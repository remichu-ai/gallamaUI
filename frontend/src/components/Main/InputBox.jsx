import React, {useEffect, useRef, useState} from 'react'
import useInputStore from '../../store/inputStore.js'
import {sendMessageAndGetResponse, sendMessageAndReturnResponse} from "../../services/chat.mjs";
import useChatStore from "../../store/chatStore.js";
import useChatSettingStore from "../../store/chatSettingStore.js";
import useModelManagementStore from "../../store/modelManagementStore.js";
import styles from "./InputBox.module.css"
import {assets} from "../../assets/assets.js";
import useApiKeyStore from "../../store/apiKeyStore.js";

const InputBox = () => {
    const {inputText, setInputText, softClear, revertInput, clear} = useInputStore();
    const [content, setContent] = useState([{ type: 'text', content: '' }]);

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

    const {
        getSelectedModel
    } = useApiKeyStore();

    const chatSettings = useChatSettingStore.getState();
    const [selectedModel, setSelectedModel] = useState(getSelectedModel());
    const inputRef = useRef();

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const onSent = async () => {
        // Filter out empty text content and create a cleaned content array
        const cleanedContent = content.filter(item =>
            item.type !== 'text' || (item.type === 'text' && item.content.trim() !== '')
        );

        if (cleanedContent.length === 0) return;

        const newMessage = {
            role: 'user',
            content: cleanedContent
        };

        addMessage(newMessage);

        if (conversation_title === "New Chat") {
            const firstWords = getFirstWordsFromUserMessages(5);
            if (firstWords.split(' ').length === 5) {
                useChatStore.getState().setConversationTitle(firstWords);
            }
        }
        await saveCurrentConversation();

        let integratedMessages = chatSettings.useArtifact
            ? getIntegratedMessagesWithText()
            : getIntegratedMessages();

        await sendMessageAndGetResponse(
            integratedMessages,
            addMessage,
            updateLastMessage
        );

        // Reset input state
        setContent([{ type: 'text', content: '' }]);
        setInputText("");
        await saveCurrentConversation();

        // Check for conversation title update
        const {messages} = useChatStore.getState();
        if (messages.length === 4) {
            await delay(1500);

            let integratedMessagesForTitle = [
                ...useChatStore.getState().getIntegratedMessages(),
                {
                    role: "user",
                    content: "Provide a title (in 5 words or less) for the conversation so far, so that i can recall what the conversation is about later on."
                }
            ];

            const tools = [{
                "type": "function",
                "function": {
                    "name": "set_title",
                    "description": "update conversation title",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "new_title": {
                                "type": "string",
                                "description": "conversation title in 5 words or less",
                            },
                        },
                        "required": ["new_title"],
                    },
                }
            }];

            let response = await sendMessageAndReturnResponse({
                msgs: integratedMessagesForTitle,
                stream: false,
                tools: tools,
                tool_choice: "required",
                extra_body_overwrite: {"thinking_template": ""}
            });

            let parsed_argument = JSON.parse(response.tool_calls[0].function.arguments)["new_title"];
            parsed_argument = parsed_argument.split(" ").slice(0, 5).join(" ");
            useChatStore.getState().setConversationTitle(parsed_argument);
        }
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

            const loadedModels = useModelManagementStore.getState().loadedModels;
            if (Object.keys(loadedModels).length === 0) {
                alert("No model has been loaded\nCheck Model Management in Sidebar");
                return;
            }

            // Check if there's any non-empty content
            const hasContent = content.some(item =>
                item.type !== 'text' || (item.type === 'text' && item.content.trim() !== '')
            );

            if (hasContent) {
                onSent();
            }
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputText(newValue);

        // Update the last text content in the sequence
        setContent(prevContent => {
            const newContent = [...prevContent];
            const lastTextIndex = newContent.findLastIndex(item => item.type === 'text');
            if (lastTextIndex !== -1) {
                newContent[lastTextIndex] = { ...newContent[lastTextIndex], content: newValue };
            } else {
                newContent.push({ type: 'text', content: newValue });
            }
            return newContent;
        });

        adjustTextareaHeight();
    };

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        let handled = false;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                handled = true;
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    setContent(prevContent => [
                        ...prevContent,
                        {
                            type: 'image_url',
                            image_url: { url: event.target.result }
                        },
                        { type: 'text', content: '' } // Add new empty text input after image
                    ]);
                };
                reader.readAsDataURL(blob);
            }
        }

        // If no images were pasted, let the default text paste behavior occur
        if (!handled) {
            return true;
        }

        e.preventDefault();
    };

    const removeContent = (index) => {
        setContent(prevContent => prevContent.filter((_, i) => i !== index));
    };

    const handleIconClick = () => {
        const loadedModels = useModelManagementStore.getState().loadedModels;
        if (Object.keys(loadedModels).length === 0) {
            alert("No model has been loaded\nCheck Model Management in Sidebar");
            return;
        }

        if (isStreaming) {
            stopGeneration();
        } else {
            const hasContent = content.some(item =>
                item.type !== 'text' || (item.type === 'text' && item.content.trim() !== '')
            );

            if (hasContent) {
                onSent();
            }
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
                <div className={styles.contentSequenceContainer}>
                    {content.map((item, index) => (
                        <div key={index} className={styles.contentItem}>
                            {item.type === 'text' ? (
                                <div className={styles.textareaContainer}>
                                    <textarea
                                        ref={index === content.length - 1 ? inputRef : null}
                                        value={item.content}
                                        onChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        onPaste={handlePaste}
                                        placeholder='Enter a prompt here or paste images'
                                        rows={1}
                                    />
                                </div>
                            ) : item.type === 'image_url' ? (
                                <div className={styles.imagePreview}>
                                    <img src={item.image_url.url} alt={`Pasted image ${index}`} />
                                    <button onClick={() => removeContent(index)}>Remove</button>
                                </div>
                            ) : null}
                        </div>
                    ))}
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
                    )}
                </div>
            </div>
            <div className={styles.footer}>
                <p>{selectedModel}</p>
            </div>
        </div>
    );
};

export default InputBox;