import { parseEventData, streamSSE } from '../api/sse.js';
import {
    convertMessagesToAnthropic,
    convertOpenAIToolsToAnthropic,
    convertOpenAIToolChoiceToAnthropic,
    getAnthropicMaxTokens,
    normalizeAnthropicMessage,
} from '../api/requestTransforms.js';

const buildHeaders = (apiKey) => ({
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    ...(apiKey && apiKey !== 'NA' ? { 'x-api-key': apiKey } : {}),
});

const messagesAnthropic = async ({
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

    const {
        max_tokens: ignoredMaxTokens,
        max_output_tokens: ignoredMaxOutputTokens,
        ...restExtraBody
    } = extra_body || {};

    const payload = {
        model,
        messages: convertMessagesToAnthropic(msgs),
        max_tokens: getAnthropicMaxTokens(extra_body || {}),
        stream,
        ...(systemPrompt && { system: systemPrompt }),
        ...restExtraBody,
        ...(tools.length > 0 && { tools: convertOpenAIToolsToAnthropic(tools) }),
        ...(tool_choice && { tool_choice: convertOpenAIToolChoiceToAnthropic(tool_choice) }),
    };

    const response = await fetch(`${url}/messages`, {
        method: 'POST',
        headers: buildHeaders(apiKey),
        body: JSON.stringify(payload),
        signal: controller.signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic Messages API error (${response.status}): ${errorText}`);
    }

    if (!stream) {
        const data = await response.json();
        return [normalizeAnthropicMessage(data), controller];
    }

    const processStream = async function* () {
        const toolBlocks = new Map();

        for await (const event of streamSSE(response)) {
            const payload = parseEventData(event);
            if (!payload) {
                continue;
            }

            if (payload.type === 'content_block_start' && payload.content_block?.type === 'tool_use') {
                toolBlocks.set(payload.index, {
                    id: payload.content_block.id,
                    name: payload.content_block.name,
                    partialJson: '',
                });
                continue;
            }

            if (payload.type === 'content_block_delta') {
                if (payload.delta?.type === 'text_delta') {
                    yield { content: payload.delta.text ?? '' };
                    continue;
                }

                if (payload.delta?.type === 'thinking_delta') {
                    yield { reasoning: payload.delta.thinking ?? '' };
                    continue;
                }

                if (payload.delta?.type === 'input_json_delta') {
                    const toolBlock = toolBlocks.get(payload.index);
                    if (toolBlock) {
                        toolBlock.partialJson += payload.delta.partial_json ?? '';
                    }
                }
                continue;
            }

            if (payload.type === 'content_block_stop') {
                const toolBlock = toolBlocks.get(payload.index);
                if (toolBlock) {
                    yield {
                        tool_calls: [{
                            id: toolBlock.id,
                            type: 'function',
                            function: {
                                name: toolBlock.name,
                                arguments: toolBlock.partialJson || '{}',
                            },
                        }],
                    };
                    toolBlocks.delete(payload.index);
                }
            }
        }
    };

    return [processStream(), controller];
};

export { messagesAnthropic };
