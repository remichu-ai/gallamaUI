import { chatCompletionOpenAI } from './openai/chatCompletionOpenAI.js';
import { responsesOpenAI } from './openai/responsesOpenAI.js';
import { messagesAnthropic } from './anthropic/messagesAnthropic.js';
import useApiKeyStore from "../store/apiKeyStore.js";
import useUIStore from "../store/uiStore.js";
import useChatStore from "../store/chatStore.js";
import useChatSettingStore from "../store/chatSettingStore.js";
import {
    API_ENDPOINT_TYPES,
    DEFAULT_API_ENDPOINT_TYPE
} from './api/endpointTypes.js';
import {
    buildRequestSettings,
    buildMcpConfig,
    normalizeOpenAIChatMessage,
    prependSystemPrompt,
} from './api/requestTransforms.js';
import { flattenStreamText, pickPreferredStreamText } from './streamText.js';

async function callSelectedEndpoint({
    apiEndpointType,
    apiKey,
    url,
    model,
    msgs,
    systemPrompt,
    extra_body,
    stream,
    tools = [],
    tool_choice = "auto"
}) {
    switch (apiEndpointType) {
        case API_ENDPOINT_TYPES.RESPONSES:
            return responsesOpenAI({
                apiKey,
                url,
                model,
                msgs,
                systemPrompt,
                extra_body,
                stream,
                tools,
                tool_choice
            });
        case API_ENDPOINT_TYPES.ANTHROPIC_MESSAGES:
            return messagesAnthropic({
                apiKey,
                url,
                model,
                msgs,
                systemPrompt,
                extra_body,
                stream,
                tools,
                tool_choice
            });
        case API_ENDPOINT_TYPES.CHAT_COMPLETIONS:
        default: {
            const requestMessages = prependSystemPrompt(msgs, systemPrompt);
            const [response, controller] = await chatCompletionOpenAI({
                apiKey,
                url,
                model,
                msgs: requestMessages,
                extra_body,
                stream,
                tools,
                tool_choice
            });

            if (stream) {
                return [response, controller];
            }

            return [normalizeOpenAIChatMessage(response), controller];
        }
    }
}

async function sendMessageAndGetResponse(msgs, addMessage, updateLastMessage, stream = true) {
    const chatStore = useChatStore.getState();
    const { setIsStreaming, setAbortController, waitForPendingChunks } = chatStore;

    // Get API settings
    const apiKeyStore = useApiKeyStore.getState();
    const selectedService = apiKeyStore.selectedService;
    const apiKey = apiKeyStore.apiKeys[selectedService];
    const url = apiKeyStore.getSelectedServiceEndpoint();
    const model = apiKeyStore.getSelectedModel(); // Use the selected model
    const apiEndpointType = apiKeyStore.getSelectedApiEndpointType?.() || DEFAULT_API_ENDPOINT_TYPE;

    // Get chat settings
    const chatSettings = useChatSettingStore.getState();
    const temperature = chatSettings.temperature;
    const topP = chatSettings.topP;
    const systemPrompt = chatSettings.systemPrompt;
    const useMcp = chatSettings.useMcp;
    const mcpServers = chatSettings.mcpServers;

    try {
        const extra_body = buildRequestSettings({
            temperature,
            topP,
            useThinking: chatSettings.useThinking,
            apiEndpointType,
        });
        const mcpConfig = useMcp ? buildMcpConfig(apiEndpointType, mcpServers) : { tools: [], extraBody: {} };

        if (useMcp) {
            if (mcpConfig.tools.length === 0) {
                console.warn('MCP is enabled, but no valid MCP servers were included in the request.', {
                    apiEndpointType,
                    mcpServers,
                });
            } else {
                console.info('Including MCP tools in chat request.', {
                    apiEndpointType,
                    mcpTools: mcpConfig.tools,
                    mcpExtraBody: mcpConfig.extraBody,
                });
            }
        }

        const toggleChatComponentOnce = useUIStore.getState().toggleChatComponentOnce;
        toggleChatComponentOnce();

        // Add initial assistant message
        addMessage({ role: 'assistant', content: [], response_items: [], tool_calls: [], trace_items: [] });


        // Start LLM generation
        setIsStreaming(true);

        const [response, controller] = await callSelectedEndpoint({
            apiEndpointType,
            apiKey,
            url,
            model,
            msgs,
            systemPrompt,
            extra_body: {
                ...extra_body,
                ...mcpConfig.extraBody,
            },
            stream,
            tools: mcpConfig.tools,
        });

        setAbortController(controller);

        for await (const chunk of response) {
            console.log("Chunk received:", chunk);
            if (chunk.content === 'DONE') {
                console.log("Stream ended");
                break;
            }

            const content = flattenStreamText(chunk.content);
            const reasoning = pickPreferredStreamText([
                chunk.reasoning,
                chunk.reasoning_content,
                chunk.thinking,
            ]);

            if (reasoning) {
                updateLastMessage({ reasoning });
            }

            if (content) {
                updateLastMessage({ content });
            }

            if (
                chunk.tool_calls
                || chunk.trace_items
                || chunk.response_items
                || chunk.replace_response_items
                || chunk.response_id
                || chunk.previous_response_id
                || chunk.response_item_id
            ) {
                updateLastMessage({
                    tool_calls: chunk.tool_calls,
                    trace_items: chunk.trace_items,
                    response_items: chunk.response_items,
                    replace_response_items: chunk.replace_response_items,
                    response_id: chunk.response_id,
                    previous_response_id: chunk.previous_response_id,
                    response_item_id: chunk.response_item_id,
                });
            }

            // Check if streaming has been stopped
            if (!useChatStore.getState().isStreaming) {
                console.log("Streaming stopped by user");
                break;
            }

        }

        await waitForPendingChunks();

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request was aborted');
        } else {
            console.error('Error sending message and getting response:', error);
            addMessage({ role: 'system', content: 'An error occurred while processing your request.' });
            throw error;
        }
    } finally {
        setIsStreaming(false);
        setAbortController(null);
        //await saveCurrentConversation();
    }
}

async function sendMessageAndReturnResponse({
    msgs,
    stream = true,
    tools = [],
    tool_choice = "auto",
    extra_body_overwrite = {}
}) {
    const chatStore = useChatStore.getState();
    const { setIsStreaming, setAbortController } = chatStore;

    // Get API settings
    const apiKeyStore = useApiKeyStore.getState();
    const selectedService = apiKeyStore.selectedService;
    const apiKey = apiKeyStore.apiKeys[selectedService];
    const url = apiKeyStore.getSelectedServiceEndpoint();
    const model = apiKeyStore.getSelectedModel(); // Use the selected model
    const apiEndpointType = apiKeyStore.getSelectedApiEndpointType?.() || DEFAULT_API_ENDPOINT_TYPE;

    // Get chat settings
    const chatSettings = useChatSettingStore.getState();
    const temperature = chatSettings.temperature;
    const topP = chatSettings.topP;
    const systemPrompt = chatSettings.systemPrompt;
    const useMcp = chatSettings.useMcp;
    const mcpServers = chatSettings.mcpServers;


    try {
        const extra_body = buildRequestSettings({
            temperature,
            topP,
            useThinking: chatSettings.useThinking,
            extraBodyOverwrite: extra_body_overwrite,
            apiEndpointType,
        });
        const mcpConfig = useMcp ? buildMcpConfig(apiEndpointType, mcpServers) : { tools: [], extraBody: {} };
        const mergedTools = [...tools, ...mcpConfig.tools];

        if (useMcp) {
            if (mcpConfig.tools.length === 0) {
                console.warn('MCP is enabled, but no valid MCP servers were included in the request.', {
                    apiEndpointType,
                    mcpServers,
                });
            } else {
                console.info('Including MCP tools in request.', {
                    apiEndpointType,
                    mcpTools: mcpConfig.tools,
                    mcpExtraBody: mcpConfig.extraBody,
                });
            }
        }

        if (stream) {
            setIsStreaming(true);

            const [response, controller] = await callSelectedEndpoint({
                apiEndpointType,
                apiKey,
                url,
                model,
                msgs,
                systemPrompt,
                extra_body: {
                    ...extra_body,
                    ...mcpConfig.extraBody,
                },
                stream,
                tools: mergedTools,
                tool_choice
            });
            setAbortController(controller);

            let finalResponse = "";
            for await (const chunk of response) {
                if (chunk.content === 'DONE') {
                    break;
                }

                const content = flattenStreamText(chunk.content);
                if (content) {
                    finalResponse += content;
                }

                // Check if streaming has been stopped
                if (!useChatStore.getState().isStreaming) {
                    break;
                }
            }

            return finalResponse;

        } else {
            const [response] = await callSelectedEndpoint({
                apiEndpointType,
                apiKey,
                url,
                model,
                msgs,
                systemPrompt,
                extra_body: {
                    ...extra_body,
                    ...mcpConfig.extraBody,
                },
                stream,
                tools: mergedTools,
                tool_choice
            });
            return response;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request was aborted');
        } else {
            console.error('Error sending message and getting response:', error);
            throw error;
        }
    } finally {
        setIsStreaming(false);
        setAbortController(null);
    }
}


export { sendMessageAndGetResponse, sendMessageAndReturnResponse };
