import { API_ENDPOINT_TYPES } from './endpointTypes.js';
import { getAllowedToolsForServer, normalizeMcpServerShape } from '../mcpUtils.js';
import {
    getPreferredMcpOutputValue,
    normalizeToolPayloadValue,
} from '../toolTraceFormatting.js';

const DEFAULT_ANTHROPIC_MAX_TOKENS = 4096;

const cloneJson = (value) => JSON.parse(JSON.stringify(value));

const getTextPartValue = (part) => part?.text ?? part?.content ?? '';

const getImageUrlValue = (part) => {
    if (!part) {
        return null;
    }

    if (typeof part.image_url === 'string') {
        return part.image_url;
    }

    return part.image_url?.url ?? part.url ?? null;
};

const parseDataUrl = (url) => {
    if (!url?.startsWith('data:')) {
        return null;
    }

    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
        return null;
    }

    return {
        mediaType: match[1],
        data: match[2],
    };
};

const parseDelimitedList = (value) => {
    if (!value) {
        return undefined;
    }

    const items = String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    return items.length > 0 ? items : undefined;
};

export const parseHeadersText = (headersText, serverName) => {
    if (!headersText?.trim()) {
        return {};
    }

    try {
        const parsedHeaders = JSON.parse(headersText);
        return parsedHeaders && typeof parsedHeaders === 'object' && !Array.isArray(parsedHeaders)
            ? parsedHeaders
            : {};
    } catch (error) {
        console.warn(`Unable to parse MCP headers JSON for server "${serverName || 'unnamed'}":`, error);
        return {};
    }
};

const normalizeMessageContentParts = (content) => {
    if (typeof content === 'string') {
        return [{ type: 'text', text: content }];
    }

    if (!Array.isArray(content)) {
        return [];
    }

    return content
        .map((part) => {
            if (part?.type === 'text') {
                return {
                    type: 'text',
                    text: getTextPartValue(part),
                };
            }

            if (part?.type === 'image_url') {
                const url = getImageUrlValue(part);
                if (!url) {
                    return null;
                }

                return {
                    type: 'image_url',
                    url,
                    detail: part.image_url?.detail,
                };
            }

            return null;
        })
        .filter(Boolean);
};

const extractResponseMessageText = (message) => {
    if (!message?.content || !Array.isArray(message.content)) {
        return '';
    }

    return message.content
        .map((part) => part?.text ?? part?.refusal ?? '')
        .filter(Boolean)
        .join('');
};

const extractResponseReasoningText = (item) => {
    return [...(item?.content ?? []), ...(item?.summary ?? [])]
        .map((part) => part?.text ?? '')
        .filter(Boolean)
        .join('\n');
};

const createReasoningTraceItem = (id, text) => {
    if (!text) {
        return null;
    }

    return {
        id,
        type: 'reasoning',
        label: 'Reasoning',
        text,
    };
};

const extractResponseToolOutputValue = (output) => {
    if (typeof output === 'string') {
        return normalizeToolPayloadValue(output);
    }

    if (!Array.isArray(output)) {
        return '';
    }

    return output
        .map((part) => {
            if (part?.type === 'input_text') {
                return part.text ?? '';
            }

            if (part?.type === 'input_image') {
                return part.image_url ?? '';
            }

            if (part?.type === 'input_file') {
                return part.file_url ?? part.filename ?? part.file_id ?? '';
            }

            return '';
        })
        .filter(Boolean)
        .join('\n');
};

export const getResponseItemLinkId = (item) => (
    item?.previous_message_id
    ?? item?.previous_item_id
    ?? item?.previous_output_item_id
    ?? item?.previous_id
    ?? null
);

const normalizeToolTraceItem = (item, toolNameByCallId, finalMessageId) => {
    if (!item || item.id === finalMessageId) {
        return null;
    }

    if (item.type === 'reasoning') {
        return createReasoningTraceItem(
            item.id ?? item.call_id ?? null,
            extractResponseReasoningText(item),
        );
    }

    if (item.type === 'message' && item.role === 'assistant') {
        const text = extractResponseMessageText(item);
        if (!text) {
            return null;
        }

        return {
            id: item.id,
            type: 'assistant_message',
            label: item.phase === 'commentary' ? 'Assistant note' : 'Assistant message',
            text,
            phase: item.phase ?? null,
        };
    }

    if (item.type === 'function_call') {
        return {
            id: item.id ?? item.call_id,
            type: 'tool_call',
            label: 'Function call',
            name: item.name,
            argumentsValue: normalizeToolPayloadValue(item.arguments),
            call_id: item.call_id,
            status: item.status ?? null,
        };
    }

    if (item.type === 'function_call_output') {
        return {
            id: item.id ?? `${item.call_id}:output`,
            type: 'tool_result',
            label: 'Function result',
            name: toolNameByCallId.get(item.call_id) ?? 'Function',
            outputValue: extractResponseToolOutputValue(item.output),
            call_id: item.call_id,
            status: item.status ?? null,
        };
    }

    if (item.type === 'mcp_list_tools') {
        return {
            id: item.id,
            type: 'tool_info',
            label: 'MCP tools',
            name: item.server_label,
            outputValue: normalizeToolPayloadValue(item.tools),
            error: item.error ?? '',
        };
    }

    if (item.type === 'mcp_call') {
        return {
            id: item.id,
            type: 'tool_activity',
            label: 'MCP call',
            name: item.name,
            server_label: item.server_label,
            argumentsValue: normalizeToolPayloadValue(item.arguments),
            outputValue: getPreferredMcpOutputValue(item.output),
            error: item.error ?? '',
            status: item.status ?? null,
        };
    }

    if (item.type === 'local_shell_call') {
        return {
            id: item.id ?? item.call_id,
            type: 'tool_call',
            label: 'Shell call',
            name: 'exec',
            argumentsValue: normalizeToolPayloadValue(item.action),
            call_id: item.call_id,
            status: item.status ?? null,
        };
    }

    if (item.type === 'local_shell_call_output') {
        return {
            id: item.id,
            type: 'tool_result',
            label: 'Shell result',
            name: 'exec',
            outputValue: normalizeToolPayloadValue(item.output),
            status: item.status ?? null,
        };
    }

    if (item.type === 'mcp_approval_request') {
        return {
            id: item.id,
            type: 'tool_call',
            label: 'Approval request',
            name: `${item.server_label}:${item.name}`,
            argumentsValue: normalizeToolPayloadValue(item.arguments),
        };
    }

    if (item.type === 'mcp_approval_response') {
        return {
            id: item.id,
            type: 'tool_result',
            label: 'Approval response',
            name: item.approve ? 'Approved' : 'Rejected',
            outputValue: item.reason ?? '',
        };
    }

    if (item.type?.includes('_call') || item.type?.includes('_output')) {
        return {
            id: item.id ?? `${item.type}:${item.call_id ?? item.name ?? 'item'}`,
            type: item.type.includes('_output') ? 'tool_result' : 'tool_call',
            label: item.type.replaceAll('_', ' '),
            name: item.name ?? item.server_label ?? item.type,
            argumentsValue: normalizeToolPayloadValue(item.arguments ?? item.action),
            outputValue: normalizeToolPayloadValue(item.output ?? item.result),
            error: item.error ?? '',
            status: item.status ?? null,
        };
    }

    return null;
};

export const normalizeToolCallsToTraceItems = (toolCalls = []) => {
    return toolCalls
        .map((toolCall) => {
            if (!toolCall?.function?.name) {
                return null;
            }

            return {
                id: toolCall.id ?? toolCall.call_id ?? toolCall.function.name,
                type: 'tool_call',
                label: 'Function call',
                name: toolCall.function.name,
                argumentsValue: normalizeToolPayloadValue(toolCall.function.arguments),
                call_id: toolCall.id ?? toolCall.call_id ?? null,
                status: null,
            };
        })
        .filter(Boolean);
};

export const normalizeResponsesOutputItems = (items = []) => {
    const responseItems = Array.isArray(items) ? items.filter(Boolean) : [];
    const assistantMessages = responseItems.filter((item) => item?.type === 'message' && item?.role === 'assistant');
    const finalAssistantMessage = [...assistantMessages].reverse().find((item) => item?.phase === 'final_answer')
        ?? assistantMessages[assistantMessages.length - 1]
        ?? null;
    const finalMessageId = finalAssistantMessage?.id ?? null;

    const toolNameByCallId = new Map(
        responseItems
            .filter((item) => item?.type === 'function_call' && item?.call_id)
            .map((item) => [item.call_id, item.name]),
    );

    const trace_items = responseItems
        .map((item) => normalizeToolTraceItem(item, toolNameByCallId, finalMessageId))
        .filter(Boolean);

    const toolCalls = responseItems
        .filter((item) => item?.type === 'function_call')
        .map((item, index) => ({
            index,
            id: item.call_id ?? item.id,
            type: 'function',
            function: {
                name: item.name,
                arguments: item.arguments ?? '{}',
            },
        }));

    const reasoning = responseItems
        .filter((item) => item?.type === 'reasoning')
        .map((item) => extractResponseReasoningText(item))
        .filter(Boolean)
        .join('\n');

    return {
        content: extractResponseMessageText(finalAssistantMessage),
        reasoning,
        tool_calls: toolCalls,
        trace_items,
        response_item_id: finalMessageId,
        response_items: responseItems,
    };
};

const convertStoredResponseItemToInputItem = (item) => {
    if (!item?.type) {
        return null;
    }

    if (item.type === 'message') {
        const role = item.role ?? 'assistant';

        if (role === 'assistant') {
            const content = (item.content ?? [])
                .map((part) => {
                    if (part?.type === 'output_text' || part?.type === 'input_text') {
                        return {
                            type: 'output_text',
                            text: part.text ?? '',
                        };
                    }

                    if (part?.type === 'refusal') {
                        return {
                            type: 'refusal',
                            refusal: part.refusal ?? '',
                        };
                    }

                    return null;
                })
                .filter(Boolean);

            if (content.length === 0) {
                return null;
            }

            return {
                type: 'message',
                role: 'assistant',
                content,
                status: 'completed',
                ...(item.phase && { phase: item.phase }),
            };
        }

        const parts = normalizeMessageContentParts(item.content);
        return {
            type: 'message',
            role,
            content: parts.length > 0
                ? parts.map((part) => {
                    if (part.type === 'image_url') {
                        return {
                            type: 'input_image',
                            image_url: part.url,
                            ...(part.detail && { detail: part.detail }),
                        };
                    }

                    return {
                        type: 'input_text',
                        text: part.text,
                    };
                })
                : [{ type: 'input_text', text: '' }],
            status: 'completed',
        };
    }

    if (item.type === 'function_call') {
        return {
            type: 'function_call',
            call_id: item.call_id,
            name: item.name,
            arguments: item.arguments ?? '{}',
        };
    }

    if (item.type === 'function_call_output') {
        return {
            type: 'function_call_output',
            call_id: item.call_id,
            output: item.output ?? '',
        };
    }

    if (item.type === 'mcp_list_tools') {
        return {
            type: 'mcp_list_tools',
            id: item.id,
            server_label: item.server_label,
            tools: item.tools ?? [],
            ...(item.error && { error: item.error }),
        };
    }

    if (item.type === 'mcp_call') {
        return {
            type: 'mcp_call',
            id: item.id,
            server_label: item.server_label,
            name: item.name,
            arguments: item.arguments ?? '{}',
            ...(item.output !== undefined && item.output !== null && { output: item.output }),
            ...(item.error && { error: item.error }),
            ...(item.status && { status: item.status }),
        };
    }

    if (item.type === 'local_shell_call') {
        return {
            type: 'local_shell_call',
            id: item.id,
            call_id: item.call_id,
            action: item.action,
            ...(item.status && { status: item.status }),
        };
    }

    if (item.type === 'local_shell_call_output') {
        return {
            type: 'local_shell_call_output',
            id: item.id,
            output: item.output ?? '',
            ...(item.status && { status: item.status }),
        };
    }

    return null;
};

export const prependSystemPrompt = (msgs, systemPrompt) => {
    const nextMessages = cloneJson(msgs);
    if (!systemPrompt) {
        return nextMessages;
    }

    return [{ role: 'system', content: systemPrompt }, ...nextMessages];
};

export const buildRequestSettings = ({
    temperature,
    topP,
    useThinking,
    extraBodyOverwrite = {},
    apiEndpointType,
}) => {
    const sanitizedExtraBody = Object.fromEntries(
        Object.entries(extraBodyOverwrite).filter(([, value]) => value !== undefined && value !== null)
    );

    if (apiEndpointType === API_ENDPOINT_TYPES.RESPONSES) {
        return {
            temperature,
            top_p: topP,
            store: true,
            ...(useThinking && { reasoning: { effort: 'medium' } }),
            ...sanitizedExtraBody,
        };
    }

    if (apiEndpointType === API_ENDPOINT_TYPES.ANTHROPIC_MESSAGES) {
        const outputConfig = {
            ...(useThinking && { effort: 'medium' }),
            ...(sanitizedExtraBody.output_config || {}),
        };

        return {
            temperature,
            top_p: topP,
            ...(Object.keys(outputConfig).length > 0 && { output_config: outputConfig }),
        };
    }

    return {
        temperature,
        top_p: topP,
        ...(useThinking && { reasoning_effort: 'medium' }),
        ...sanitizedExtraBody,
    };
};

export const convertMessagesToResponsesInput = (msgs) => {
    return msgs.flatMap((message) => {
        if (message.role === 'assistant' && Array.isArray(message.response_items) && message.response_items.length > 0) {
            const responseItems = message.response_items
                .map((item) => convertStoredResponseItemToInputItem(item))
                .filter(Boolean);

            if (responseItems.length > 0) {
                return responseItems;
            }
        }

        const parts = normalizeMessageContentParts(message.content);

        if (parts.length === 0) {
            return [{
                type: 'message',
                role: message.role,
                content: [{ type: 'input_text', text: '' }],
            }];
        }

        return [{
            type: 'message',
            role: message.role,
            content: parts.map((part) => {
                if (part.type === 'image_url') {
                    return {
                        type: 'input_image',
                        image_url: part.url,
                        ...(part.detail && { detail: part.detail }),
                    };
                }

                return {
                    type: 'input_text',
                    text: part.text,
                };
            }),
        }];
    });
};

export const convertMessagesToAnthropic = (msgs) => {
    return msgs.map((message) => {
        const parts = normalizeMessageContentParts(message.content);

        if (parts.length === 0) {
            return {
                role: message.role,
                content: '',
            };
        }

        const hasImage = parts.some((part) => part.type === 'image_url');
        if (!hasImage) {
            return {
                role: message.role,
                content: parts.map((part) => part.text).join(''),
            };
        }

        return {
            role: message.role,
            content: parts.map((part) => {
                if (part.type === 'image_url') {
                    const dataUrl = parseDataUrl(part.url);
                    if (dataUrl) {
                        return {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: dataUrl.mediaType,
                                data: dataUrl.data,
                            },
                        };
                    }

                    return {
                        type: 'image',
                        source: {
                            type: 'url',
                            url: part.url,
                        },
                    };
                }

                return {
                    type: 'text',
                    text: part.text,
                };
            }),
        };
    });
};

export const convertOpenAIToolsToResponses = (tools = []) => {
    return tools
        .map((tool) => {
            if (tool?.type === 'mcp') {
                return tool;
            }

            if (tool?.type === 'function' && tool.function?.name) {
                return {
                    type: 'function',
                    name: tool.function.name,
                    description: tool.function.description,
                    parameters: tool.function.parameters,
                };
            }

            return null;
        })
        .filter(Boolean);
};

export const convertOpenAIToolsToAnthropic = (tools = []) => {
    return tools
        .map((tool) => {
            if (tool?.type === 'mcp_toolset') {
                return tool;
            }

            if (tool?.type === 'function' && tool.function?.name) {
                return {
                    name: tool.function.name,
                    description: tool.function.description,
                    input_schema: tool.function.parameters ?? {
                        type: 'object',
                        properties: {},
                        required: [],
                    },
                };
            }

            return null;
        })
        .filter(Boolean);
};

export const convertOpenAIToolChoiceToResponses = (toolChoice) => {
    if (!toolChoice || typeof toolChoice === 'string') {
        return toolChoice;
    }

    const toolName = toolChoice?.function?.name;
    if (!toolName) {
        return undefined;
    }

    return {
        type: 'function',
        name: toolName,
    };
};

export const convertOpenAIToolChoiceToAnthropic = (toolChoice) => {
    if (!toolChoice) {
        return undefined;
    }

    if (typeof toolChoice === 'string') {
        if (toolChoice === 'required') {
            return { type: 'any' };
        }

        return { type: toolChoice };
    }

    const toolName = toolChoice?.function?.name;
    if (!toolName) {
        return undefined;
    }

    return {
        type: 'tool',
        name: toolName,
    };
};

export const normalizeOpenAIChatMessage = (response) => {
    const message = response?.choices?.[0]?.message ?? {};
    const reasoning = message.reasoning ?? message.reasoning_content ?? message.thinking ?? '';
    const toolCalls = message.tool_calls ?? [];
    const traceItems = [
        createReasoningTraceItem('openai-chat-reasoning', reasoning),
        ...normalizeToolCallsToTraceItems(toolCalls),
    ].filter(Boolean);

    return {
        role: message.role ?? 'assistant',
        content: message.content ?? '',
        tool_calls: toolCalls,
        reasoning,
        trace_items: traceItems,
    };
};

export const normalizeResponsesMessage = (response) => {
    const normalized = normalizeResponsesOutputItems(response?.output ?? []);

    return {
        role: 'assistant',
        content: normalized.content,
        tool_calls: normalized.tool_calls,
        reasoning: normalized.reasoning,
        trace_items: normalized.trace_items,
        response_items: normalized.response_items,
        response_id: response?.id ?? null,
        previous_response_id: response?.previous_response_id ?? null,
        response_item_id: normalized.response_item_id,
    };
};

export const normalizeAnthropicMessage = (response) => {
    const content = response?.content ?? [];

    const text = content
        .filter((block) => block?.type === 'text')
        .map((block) => block.text ?? '')
        .join('');

    const reasoning = content
        .filter((block) => block?.type === 'thinking')
        .map((block) => block.thinking ?? '')
        .filter(Boolean)
        .join('\n');

    const toolCalls = content
        .filter((block) => block?.type === 'tool_use')
        .map((block, index) => ({
            index,
            id: block.id,
            type: 'function',
            function: {
                name: block.name,
                arguments: JSON.stringify(block.input ?? {}),
            },
        }));

    const traceItems = content
        .map((block, index) => {
            if (block?.type === 'thinking') {
                return createReasoningTraceItem(
                    block.id ?? `anthropic-thinking:${index}`,
                    block.thinking ?? '',
                );
            }

            if (block?.type === 'tool_use') {
                return {
                    id: block.id ?? `anthropic-tool:${index}`,
                    type: 'tool_call',
                    label: 'Function call',
                    name: block.name ?? 'Function',
                    argumentsValue: normalizeToolPayloadValue(JSON.stringify(block.input ?? {})),
                    call_id: block.id ?? null,
                    status: null,
                };
            }

            return null;
        })
        .filter(Boolean);

    return {
        role: response?.role ?? 'assistant',
        content: text,
        tool_calls: toolCalls,
        reasoning,
        trace_items: traceItems,
    };
};

export const getAnthropicMaxTokens = (extraBody = {}) => {
    return extraBody.max_tokens ?? extraBody.max_output_tokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS;
};

export const normalizeMcpServers = (mcpServers = []) => {
    return mcpServers
        .map((server) => normalizeMcpServerShape(server))
        .filter((server) => server.enabled !== false)
        .map((server) => {
            const name = server.name.trim();
            const url = server.url.trim();

            if (!name || !url) {
                return null;
            }

            const selectedTools = getAllowedToolsForServer(server);
            const legacyAllowedTools = parseDelimitedList(server.allowedTools);
            const allowedTools = selectedTools ?? legacyAllowedTools;

            if (server.toolMode === 'custom' && (!allowedTools || allowedTools.length === 0)) {
                return null;
            }

            return {
                name,
                url,
                authorizationToken: server.authorizationToken?.trim() || undefined,
                allowedTools,
                headers: parseHeadersText(server.headersText, name),
            };
        })
        .filter(Boolean);
};

export const buildMcpConfig = (apiEndpointType, mcpServers = []) => {
    const normalizedServers = normalizeMcpServers(mcpServers);
    if (normalizedServers.length === 0) {
        return { tools: [], extraBody: {} };
    }

    if (apiEndpointType === API_ENDPOINT_TYPES.ANTHROPIC_MESSAGES) {
        return {
            tools: normalizedServers.map((server) => ({
                type: 'mcp_toolset',
                mcp_server_name: server.name,
                ...(server.allowedTools && { allowed_tools: server.allowedTools }),
            })),
            extraBody: {
                mcp_servers: normalizedServers.map((server) => ({
                    type: 'url',
                    name: server.name,
                    url: server.url,
                    ...(server.authorizationToken && { authorization_token: server.authorizationToken }),
                    ...(Object.keys(server.headers).length > 0 && { headers: server.headers }),
                })),
            },
        };
    }

    return {
        tools: normalizedServers.map((server) => ({
            type: 'mcp',
            server_label: server.name,
            server_url: server.url,
            ...(server.authorizationToken && { authorization_token: server.authorizationToken }),
            ...(Object.keys(server.headers).length > 0 && { headers: server.headers }),
            ...(server.allowedTools && { allowed_tools: server.allowedTools }),
            require_approval: 'never',
        })),
        extraBody: {},
    };
};
