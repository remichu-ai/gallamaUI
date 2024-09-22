import {chatCompletionOpenAI} from './openai/chatCompletionOpenAI.js';
import useApiKeyStore from "../store/apiKeyStore.js";
import useUIStore from "../store/uiStore.js";
import useChatStore from "../store/chatStore.js";
import useChatSettingStore from "../store/chatSettingStore.js";

async function sendMessageAndGetResponse(msgs, addMessage, updateLastMessage, stream = true) {
    const chatStore = useChatStore.getState();
    const {setIsStreaming, setAbortController, saveCurrentConversation} = chatStore;

    // Get API settings
    const apiKeyStore = useApiKeyStore.getState();
    const selectedService = apiKeyStore.selectedService;
    const apiKey = apiKeyStore.apiKeys[selectedService];
    const url = apiKeyStore.getSelectedServiceEndpoint();
    const model = apiKeyStore.getSelectedModel(); // Use the selected model

    // Get chat settings
    const chatSettings = useChatSettingStore.getState();
    const useArtifact = chatSettings.useArtifact;
    const temperature = chatSettings.temperature;
    const systemPrompt = chatSettings.systemPrompt;
    const useThinking = chatSettings.useThinking;  // Retrieve the thinking template
    const thinking = chatSettings.thinking;

    try {

        // Convert "return_thinking" to the required API format
        const {returnThinking} = chatSettings;
        let returnThinkingConverted;
        switch (returnThinking) {
            case "Yes":
                returnThinkingConverted = true;
                break;
            case "No":
                returnThinkingConverted = false;
                break;
            case "Seperate": // Note: ensure the spelling matches backend requirements.
                returnThinkingConverted = "separate";
                break;
            default:
                returnThinkingConverted = "separate"; // Default to False if not matched
        }

        // Prepare extra body with settings, including 'return_thinking'
        const extra_body = {
            temperature: temperature,
            ...(useArtifact && {artifact: "Fast"}),
            ...(useThinking && thinking && {thinking_template: thinking}),  // Add thinking to extra_body if set
            ...(returnThinkingConverted !== undefined && {return_thinking: returnThinkingConverted}) // Add 'return_thinking' if set
        };

        // Add system prompt if it exists
        if (systemPrompt) {
            msgs.unshift({role: 'system', content: systemPrompt});
        }

        const toggleChatComponentOnce = useUIStore.getState().toggleChatComponentOnce;
        toggleChatComponentOnce();

        // Add initial assistant message
        addMessage({role: 'assistant', content: '', artifacts: {}});


        // Start LLM generation
        setIsStreaming(true);

        const [response, controller] = await chatCompletionOpenAI({
            apiKey,
            url,
            model,
            msgs,
            extra_body,
            stream,
            //tools: [],  // Can pass tools if needed
            //tool_choice: "auto"  // Can specify tool_choice if needed
        });

        setAbortController(controller);

        for await (const chunk of response) {
            if (chunk.content === 'DONE') {
                console.log("Stream ended");
                break;
            }

            const {content, artifact_meta, thinking} = chunk;

            if (thinking) {
                //console.log("Received thinking:", thinking);
                updateLastMessage({thinking});
            }

            if (content || artifact_meta) {
                updateLastMessage({content, artifact_meta});
            }

            // Check if streaming has been stopped
            if (!useChatStore.getState().isStreaming) {
                console.log("Streaming stopped by user");
                break;
            }

        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request was aborted');
        } else {
            console.error('Error sending message and getting response:', error);
            addMessage({role: 'system', content: 'An error occurred while processing your request.'});
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
    const {setIsStreaming, setAbortController, saveCurrentConversation} = chatStore;

    // Get API settings
    const apiKeyStore = useApiKeyStore.getState();
    const selectedService = apiKeyStore.selectedService;
    const apiKey = apiKeyStore.apiKeys[selectedService];
    const url = apiKeyStore.getSelectedServiceEndpoint();
    const model = apiKeyStore.getSelectedModel(); // Use the selected model

    // Get chat settings
    const chatSettings = useChatSettingStore.getState();
    const temperature = chatSettings.temperature;
    const systemPrompt = chatSettings.systemPrompt;
    const useThinking = chatSettings.useThinking;
    const thinking = chatSettings.thinking;

    try {
        // Prepare extra body with settings
        const extra_body = {
            temperature,
            ...(useThinking && thinking && {thinking_template: thinking}),
            ...extra_body_overwrite,
        };

        // Add system prompt if it exists
        if (systemPrompt) {
            msgs.unshift({role: 'system', content: systemPrompt});
        }

        if (stream) {
            setIsStreaming(true);

            const [response, controller] = await chatCompletionOpenAI({
                apiKey,
                url,
                model,
                msgs,
                extra_body,
                stream,
                tools: tools,
                tool_choice: tool_choice
            });
            setAbortController(controller);

            let finalResponse = "";
            for await (const chunk of response) {
                if (chunk.content === 'DONE') {
                    break;
                }

                const {content} = chunk;
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
            const [response, controller] = await chatCompletionOpenAI({
                apiKey,
                url,
                model,
                msgs,
                extra_body,
                stream,
                tools: tools,
                tool_choice: tool_choice
            });
            return response.choices[0].message;
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
        await saveCurrentConversation();
    }
}


export {sendMessageAndGetResponse, sendMessageAndReturnResponse};