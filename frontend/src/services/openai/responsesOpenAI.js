import { parseEventData, streamSSE } from '../api/sse.js';
import {
    convertMessagesToResponsesInput,
    convertOpenAIToolsToResponses,
    convertOpenAIToolChoiceToResponses,
    getResponseItemLinkId,
    normalizeResponsesMessage,
    normalizeResponsesOutputItems,
} from '../api/requestTransforms.js';
import { flattenStreamText } from '../streamText.js';

const buildHeaders = (apiKey) => ({
    'Content-Type': 'application/json',
    ...(apiKey && apiKey !== 'NA' ? { Authorization: `Bearer ${apiKey}` } : {}),
});

const STORED_RESPONSE_RETRY_DELAYS_MS = [0, 75, 150, 300, 600];

const sleep = (delayMs) => new Promise((resolve) => {
    setTimeout(resolve, delayMs);
});

const buildUrl = (baseUrl, path, query = {}) => {
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const requestUrl = new URL(path.replace(/^\//, ''), normalizedBaseUrl);

    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            requestUrl.searchParams.set(key, String(value));
        }
    });

    return requestUrl.toString();
};

const fetchJson = async ({ apiKey, url, path, query = {} }) => {
    const response = await fetch(buildUrl(url, path, query), {
        method: 'GET',
        headers: buildHeaders(apiKey),
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Responses API history error (${response.status}): ${errorText}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

const retrieveStoredResponse = async ({ apiKey, url, response }) => {
    if (!response?.id) {
        return response;
    }

    let retrievedResponse = null;
    let lastError = null;

    for (let attempt = 0; attempt < STORED_RESPONSE_RETRY_DELAYS_MS.length; attempt += 1) {
        const delayMs = STORED_RESPONSE_RETRY_DELAYS_MS[attempt];
        if (delayMs > 0) {
            await sleep(delayMs);
        }

        try {
            retrievedResponse = await fetchJson({
                apiKey,
                url,
                path: `/responses/${response.id}`,
            });
            break;
        } catch (error) {
            lastError = error;

            if (error?.status !== 404 || attempt === STORED_RESPONSE_RETRY_DELAYS_MS.length - 1) {
                throw error;
            }
        }
    }

    if (!retrievedResponse?.id) {
        if (lastError) {
            throw lastError;
        }

        return response;
    }

    return {
        ...response,
        ...retrievedResponse,
        output: Array.isArray(retrievedResponse.output) ? retrievedResponse.output : (response.output ?? []),
    };
};

const isConversationBoundaryItem = (item) => item?.type === 'message' && item?.role && item.role !== 'assistant';

const mergeHistoricalItemsIntoOutput = (response, historicalItemsMap) => {
    const outputItems = Array.isArray(response?.output) ? response.output : [];
    const finalAssistantMessage = [...outputItems].reverse().find(
        (item) => item?.type === 'message' && item?.role === 'assistant',
    );

    if (!finalAssistantMessage) {
        return response;
    }

    const outputItemIds = new Set(outputItems.map((item) => item?.id).filter(Boolean));
    const historyChain = [];
    const visitedIds = new Set();
    let currentLinkedId = getResponseItemLinkId(finalAssistantMessage);

    while (currentLinkedId && !visitedIds.has(currentLinkedId)) {
        visitedIds.add(currentLinkedId);
        const historicalItem = historicalItemsMap.get(currentLinkedId);

        if (!historicalItem || isConversationBoundaryItem(historicalItem)) {
            break;
        }

        if (!outputItemIds.has(historicalItem.id)) {
            historyChain.unshift(historicalItem);
        }

        currentLinkedId = getResponseItemLinkId(historicalItem);
    }

    if (historyChain.length === 0) {
        return response;
    }

    return {
        ...response,
        output: [...historyChain, ...outputItems],
    };
};

const hydrateResponseHistory = async ({ apiKey, url, response }) => {
    if (!response?.id) {
        return response;
    }

    const effectiveResponse = await retrieveStoredResponse({ apiKey, url, response });
    const outputItems = Array.isArray(effectiveResponse.output) ? effectiveResponse.output : [];
    const finalAssistantMessage = [...outputItems].reverse().find(
        (item) => item?.type === 'message' && item?.role === 'assistant',
    );

    const initialLinkedId = getResponseItemLinkId(finalAssistantMessage);
    if (!initialLinkedId && !effectiveResponse.previous_response_id) {
        return effectiveResponse;
    }

    const historicalItems = new Map(outputItems.filter((item) => item?.id).map((item) => [item.id, item]));
    const pendingIds = new Set(initialLinkedId && !historicalItems.has(initialLinkedId) ? [initialLinkedId] : []);

    const addHistoricalItem = (item) => {
        if (!item?.id) {
            return;
        }

        historicalItems.set(item.id, item);
        pendingIds.delete(item.id);

        const previousLinkedId = getResponseItemLinkId(item);
        if (previousLinkedId && !historicalItems.has(previousLinkedId) && !isConversationBoundaryItem(item)) {
            pendingIds.add(previousLinkedId);
        }
    };

    let after;
    let pageCount = 0;
    while (pendingIds.size > 0 && pageCount < 10) {
        const page = await fetchJson({
            apiKey,
            url,
            path: `/responses/${effectiveResponse.id}/input_items`,
            query: {
                order: 'desc',
                limit: 100,
                ...(after && { after }),
            },
        });

        const items = Array.isArray(page?.data) ? page.data : [];
        items.forEach(addHistoricalItem);

        if (!page?.has_more || items.length === 0) {
            break;
        }

        after = items[items.length - 1]?.id;
        pageCount += 1;
    }

    let previousResponseId = effectiveResponse.previous_response_id ?? null;
    let responseHopCount = 0;
    while (pendingIds.size > 0 && previousResponseId && responseHopCount < 6) {
        const previousResponse = await fetchJson({
            apiKey,
            url,
            path: `/responses/${previousResponseId}`,
        });

        (previousResponse?.output ?? []).forEach(addHistoricalItem);
        previousResponseId = previousResponse?.previous_response_id ?? null;
        responseHopCount += 1;
    }

    return mergeHistoricalItemsIntoOutput(effectiveResponse, historicalItems);
};

const safeHydrateResponseHistory = async ({ apiKey, url, response }) => {
    try {
        return await hydrateResponseHistory({ apiKey, url, response });
    } catch (error) {
        console.warn('Unable to hydrate Responses API history; falling back to the latest output only.', error);
        return response;
    }
};

const responsesOpenAI = async ({
    apiKey,
    url,
    model,
    msgs,
    systemPrompt,
    extra_body,
    stream = true,
    tools = [],
    tool_choice = 'auto',
}) => {
    const controller = new AbortController();

    const payload = {
        model,
        input: convertMessagesToResponsesInput(msgs),
        stream,
        ...(systemPrompt && { instructions: systemPrompt }),
        ...extra_body,
        ...(tools.length > 0 && { tools: convertOpenAIToolsToResponses(tools) }),
        ...(tool_choice && { tool_choice: convertOpenAIToolChoiceToResponses(tool_choice) }),
    };

    const response = await fetch(`${url}/responses`, {
        method: 'POST',
        headers: buildHeaders(apiKey),
        body: JSON.stringify(payload),
        signal: controller.signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Responses API error (${response.status}): ${errorText}`);
    }

    if (!stream) {
        const data = await response.json();
        const hydratedResponse = await safeHydrateResponseHistory({ apiKey, url, response: data });
        return [normalizeResponsesMessage(hydratedResponse), controller];
    }

    const processStream = async function* () {
        let streamedAnyContent = false;
        let streamedAnyReasoning = false;

        for await (const event of streamSSE(response)) {
            const payload = parseEventData(event);
            if (!payload) {
                continue;
            }

            const isOutputItemEvent = (
                payload.type === 'response.output_item.added'
                || payload.type === 'response.output_item.done'
            );

            if (payload.type === 'response.created' && payload.response) {
                yield {
                    response_id: payload.response.id ?? null,
                    previous_response_id: payload.response.previous_response_id ?? null,
                };
                continue;
            }

            if (payload.type === 'response.output_text.delta') {
                streamedAnyContent = streamedAnyContent || Boolean(payload.delta);
                yield { content: payload.delta ?? '' };
                continue;
            }

            if (
                payload.type === 'response.reasoning_text.delta'
                || payload.type === 'response.reasoning_summary_text.delta'
            ) {
                const reasoningDelta = flattenStreamText(payload.delta ?? payload.text ?? payload.part);

                if (reasoningDelta) {
                    streamedAnyReasoning = true;
                    yield { reasoning: reasoningDelta };
                }
                continue;
            }

            if (
                payload.type === 'response.reasoning_text.done'
                || payload.type === 'response.reasoning_summary_text.done'
            ) {
                continue;
            }

            if (isOutputItemEvent && payload.item?.type === 'reasoning') {
                const reasoning = [...(payload.item.content ?? []), ...(payload.item.summary ?? [])]
                    .map((part) => part?.text ?? '')
                    .filter(Boolean)
                    .join('\n');

                if (reasoning && !streamedAnyReasoning) {
                    streamedAnyReasoning = true;
                    yield {
                        reasoning,
                        response_items: [payload.item],
                    };
                    continue;
                }

                yield {
                    response_items: [payload.item],
                };
                continue;
            }

            if (isOutputItemEvent && payload.item) {
                const normalizedItem = normalizeResponsesOutputItems([payload.item]);
                yield {
                    response_items: [payload.item],
                    ...(normalizedItem.response_item_id && { response_item_id: normalizedItem.response_item_id }),
                };
                continue;
            }

            if (payload.type === 'response.completed' && payload.response) {
                const hydratedResponse = await safeHydrateResponseHistory({ apiKey, url, response: payload.response });
                const normalizedResponse = normalizeResponsesMessage(hydratedResponse);

                yield {
                    response_items: normalizedResponse.response_items,
                    replace_response_items: true,
                    response_id: normalizedResponse.response_id,
                    previous_response_id: normalizedResponse.previous_response_id,
                    response_item_id: normalizedResponse.response_item_id,
                    ...(!streamedAnyReasoning && normalizedResponse.reasoning
                        ? { reasoning: normalizedResponse.reasoning }
                        : {}),
                    ...(!streamedAnyContent && normalizedResponse.content
                        ? { content: normalizedResponse.content }
                        : {}),
                };
            }
        }
    };

    return [processStream(), controller];
};

export { responsesOpenAI };
