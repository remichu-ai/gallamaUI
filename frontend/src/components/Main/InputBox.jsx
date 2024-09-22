import React, {useEffect, useRef, useState} from 'react'
import useInputStore from '../../store/inputStore.js'
import {sendMessageAndGetResponse, sendMessageAndReturnResponse} from "../../services/chat.mjs";
import useChatStore from "../../store/chatStore.js";
import useChatSettingStore from "../../store/chatSettingStore.js";
import styles from "./InputBox.module.css"
import {assets} from "../../assets/assets.js";
import useApiKeyStore from "../../store/apiKeyStore.js";

const InputBox = () => {
    const {inputText, setInputText, softClear, revertInput, clear} = useInputStore();

    const {
        messages,
        conversation_title,
        getFirstWordsFromUserMessages,
        saveCurrentConversation,
        addMessage,
        updateLastMessage,
        getIntegratedMessages,
        getIntegratedMessagesWithText,
        isStreaming,
        stopGeneration
    } = useChatStore();
    // console.log('isStreaming ', isStreaming)

    const {
        getSelectedModel
    } = useApiKeyStore();

    const chatSettings = useChatSettingStore.getState();

    // Local state to track the selected model
    const [selectedModel, setSelectedModel] = useState(getSelectedModel());

    // ref to the input box for text area size adjustment
    const inputRef = useRef();

    // Helper function to create a delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


    const onSent = async (prompt) => {
        const useArtifact = chatSettings.useArtifact;

        const newMessage = {
            role: 'user',
            content: [
                {
                    type: 'text',
                    content: prompt,
                },
            ]
        };

        addMessage(newMessage);

        // set conversation title to 'New Chat', in case this is new chat
        if (conversation_title === "New Chat") {
            const firstWords = useChatStore.getState().getFirstWordsFromUserMessages(5);
            if (firstWords.split(' ').length === 5) {
                useChatStore.getState().setConversationTitle(firstWords);
            }
        }
        await saveCurrentConversation();

        let integratedMessages = useArtifact ? getIntegratedMessagesWithText() : getIntegratedMessages();

        await sendMessageAndGetResponse(
            integratedMessages,
            addMessage,
            updateLastMessage
        );

        await setInputText("");
        await saveCurrentConversation();

        // Check the number of messages in chatStore
        const {messages} = useChatStore.getState();
        // if (messages.length === 4) {
        //     // Add a delay of 3 seconds (3000 milliseconds)
        //     await delay(3000);
        //
        //     console.log("message count is 4, proceed to get conversation title");
        //     let integratedMessagesForTitle = [
        //         ...useChatStore.getState().getIntegratedMessages(),     // dont use artifact mode here
        //         {
        //             role: "user",
        //             content: "Provide a title (in 5 words or less) for the conversation so far, so that i can recall what the conversation is about later on."
        //         }
        //     ]
        //
        //     const tools = [
        //         {
        //             "type": "function",
        //             "function": {
        //                 "name": "set_title",
        //                 "description": "update conversation title",
        //                 "parameters": {
        //                     "type": "object",
        //                     "properties": {
        //                         "new_title": {
        //                             "type": "string",
        //                             "description": "conversation title in 5 words or less",
        //                         },
        //                     },
        //                     "required": ["new_title"],
        //                 },
        //             }
        //         }
        //     ];
        //
        //     let response = await sendMessageAndReturnResponse({
        //         msgs: integratedMessagesForTitle,
        //         stream: false,
        //         tools: tools,
        //         tool_choice: "required",
        //         extra_body_overwrite: {"thinking_template" : "",} //disable thinking template to avoid model confusion
        //     })
        //
        //     // Truncate the response to maximum 6 words
        //     let parsed_argument = JSON.parse(response.tool_calls[0].function.arguments)["new_title"]
        //     parsed_argument = parsed_argument.split(" ").slice(0, 5).join(" ");
        //     useChatStore.getState().setConversationTitle(parsed_argument);
        // }
    };

    const adjustTextareaHeight = () => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    };

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputText.trim() !== '') {
                onSent(inputText);
                softClear();
            } else {
                setInputText('');
            }
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        adjustTextareaHeight();
    };

    const handleIconClick = () => {
        if (isStreaming) {
            stopGeneration();
        } else if (inputText.trim() !== '') {
            onSent(inputText);
            softClear();
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [inputText]);

    useEffect(() => {
        const unsubscribe = useApiKeyStore.subscribe((state) => {
            setSelectedModel(state.getSelectedModel());
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <div className={styles.inputBoxContainer}>
            <div className={styles.inputBoxAndSendIcon}>
                <div className={styles.textareaContainer}>
                    <textarea
                        ref={inputRef}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        value={inputText}
                        placeholder='Enter a prompt here'
                        rows={1}
                    />
                </div>
                <div className={styles.imgContainer}>
                    {isStreaming ? (
                        <img
                            src={assets.stop_icon}
                            className={styles.img}
                            onClick={handleIconClick}
                            width={23}
                            height={23}
                            alt="Stop"
                        />
                    ) : (
                        <assets.SendIcon
                            className={styles.img}
                            onClick={handleIconClick}
                            width={23}
                            height={23}
                        />
                    )
                    }
                </div>
            </div>
            <div className={styles.footer}>
                <p>{selectedModel}</p>
            </div>
        </div>
    )
}

export default InputBox;