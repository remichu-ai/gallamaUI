import { parseEventData, streamSSE } from '../api/sse.js';
import {
    convertMessagesToAnthropic,
    convertOpenAIToolsToAnthropic,
    convertOpenAIToolChoiceToAnthropic,
    getAnthropicMaxTokens,
    normalizeAnthropicMessage,
} from '../api/requestTransforms.js';
import {
    getPreferredMcpOutputValue,
    normalizeToolPayloadValue,
} from '../toolTraceFormatting.js';

const buildHeaders = (apiKey) => ({
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    ...(apiKey && apiKey !== 'NA' ? { 'x-api-key': apiKey } : {}),
});

const extractMcpResultValue = (content) => {
    if (Array.isArray(content) && content.length === 1 && content[0]?.type === 'text') {
        return content[0].text ?? '';
    }

    return content ?? '';
};

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
        const toolBlocksById = new Map();

        for await (const event of streamSSE(response)) {
            const payload = parseEventData(event);
            if (!payload) {
                continue;
            }

            if (payload.type === 'content_block_start') {
                if (payload.content_block?.type === 'tool_use' || payload.content_block?.type === 'mcp_tool_use') {
                    const toolBlock = {
                        id: payload.content_block.id,
                        name: payload.content_block.name,
                        serverName: payload.content_block.server_name ?? payload.content_block.server_label ?? '',
                        type: payload.content_block.type,
                        partialJson: '',
                    };

                    toolBlocks.set(payload.index, toolBlock);
                    toolBlocksById.set(toolBlock.id, toolBlock);
                    continue;
                }

                if (payload.content_block?.type === 'mcp_tool_result') {
                    const rawOutputValue = extractMcpResultValue(payload.content_block.content);
                    const normalizedOutputValue = getPreferredMcpOutputValue(rawOutputValue);
                    const linkedToolBlock = toolBlocksById.get(payload.content_block.tool_use_id);

                    yield {
                        trace_items: [{
                            id: payload.content_block.id ?? `${payload.content_block.tool_use_id}:result`,
                            type: 'tool_result',
                            label: 'MCP result',
                            name: linkedToolBlock?.name ?? payload.content_block.name ?? 'MCP tool',
                            server_label: linkedToolBlock?.serverName ?? '',
                            call_id: payload.content_block.tool_use_id ?? null,
                            outputValue: payload.content_block.is_error ? '' : normalizedOutputValue,
                            error: payload.content_block.is_error ? normalizedOutputValue : '',
                            status: payload.content_block.is_error ? 'failed' : 'completed',
                        }],
                    };
                    continue;
                }
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
                    const argumentsValue = normalizeToolPayloadValue(toolBlock.partialJson || '{}');

                    yield {
                        trace_items: [{
                            id: toolBlock.id,
                            type: 'tool_call',
                            label: toolBlock.type === 'mcp_tool_use' ? 'MCP call' : 'Function call',
                            name: toolBlock.name,
                            server_label: toolBlock.type === 'mcp_tool_use' ? toolBlock.serverName : '',
                            argumentsValue,
                            call_id: toolBlock.id,
                            status: toolBlock.type === 'mcp_tool_use' ? 'in_progress' : null,
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
