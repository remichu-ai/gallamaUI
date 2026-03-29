import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { compress, decompress } from 'lz-string';
import { normalizeToolCallsToTraceItems } from '../services/api/requestTransforms.js';

const MAX_LOCAL_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB safety limit for image
const CHUNK_FLUSH_TIMEOUT_MS = 5000;
const CHUNK_FLUSH_POLL_MS = 10;

const getResponseItemMergeKey = (item, fallbackIndex) => {
    if (item?.id) {
        return item.id;
    }

    if (item?.type && item?.call_id) {
        return `${item.type}:${item.call_id}`;
    }

    if (item?.type && item?.name) {
        return `${item.type}:${item.name}:${fallbackIndex}`;
    }

    return `response-item:${fallbackIndex}`;
};

const mergeResponseItems = (existingItems = [], incomingItems = []) => {
    const mergedItems = [...existingItems];
    const keyToIndex = new Map(
        mergedItems.map((item, index) => [getResponseItemMergeKey(item, index), index]),
    );

    incomingItems.forEach((item, incomingIndex) => {
        const key = getResponseItemMergeKey(item, `${existingItems.length + incomingIndex}`);
        const existingIndex = keyToIndex.get(key);

        if (existingIndex === undefined) {
            keyToIndex.set(key, mergedItems.length);
            mergedItems.push(item);
            return;
        }

        mergedItems[existingIndex] = item;
    });

    return mergedItems;
};

const getToolCallMergeKey = (toolCall, fallbackIndex) => {
    if (toolCall?.id) {
        return toolCall.id;
    }

    if (toolCall?.call_id) {
        return toolCall.call_id;
    }

    if (toolCall?.index !== undefined) {
        return `tool-call-index:${toolCall.index}`;
    }

    if (toolCall?.function?.name) {
        return `tool-call:${toolCall.function.name}:${fallbackIndex}`;
    }

    return `tool-call:${fallbackIndex}`;
};

const mergeToolCallChunk = (existingToolCall = {}, incomingToolCall = {}) => {
    const existingArguments = existingToolCall.function?.arguments ?? '';
    const incomingArguments = incomingToolCall.function?.arguments ?? '';
    const mergedArguments = (
        typeof existingArguments === 'string'
        && typeof incomingArguments === 'string'
        && existingArguments
        && incomingArguments
        && incomingArguments !== existingArguments
    )
        ? `${existingArguments}${incomingArguments}`
        : incomingArguments || existingArguments;

    return {
        ...existingToolCall,
        ...incomingToolCall,
        function: {
            ...(existingToolCall.function ?? {}),
            ...(incomingToolCall.function ?? {}),
            ...(mergedArguments ? { arguments: mergedArguments } : {}),
        },
    };
};

const mergeToolCalls = (existingToolCalls = [], incomingToolCalls = []) => {
    const mergedToolCalls = [...existingToolCalls];
    const keyToIndex = new Map(
        mergedToolCalls.map((toolCall, index) => [getToolCallMergeKey(toolCall, index), index]),
    );

    incomingToolCalls.forEach((toolCall, incomingIndex) => {
        const key = getToolCallMergeKey(toolCall, `${existingToolCalls.length + incomingIndex}`);
        const existingIndex = keyToIndex.get(key);

        if (existingIndex === undefined) {
            keyToIndex.set(key, mergedToolCalls.length);
            mergedToolCalls.push(toolCall);
            return;
        }

        mergedToolCalls[existingIndex] = mergeToolCallChunk(mergedToolCalls[existingIndex], toolCall);
    });

    return mergedToolCalls;
};

const appendReasoningTraceItem = (existingTraceItems = [], reasoning = '') => {
    if (!reasoning) {
        return existingTraceItems;
    }

    const traceItems = [...existingTraceItems];
    const lastIndex = traceItems.length - 1;
    const lastItem = traceItems[lastIndex];

    if (lastItem?.type === 'reasoning') {
        traceItems[lastIndex] = {
            ...lastItem,
            text: `${lastItem.text ?? ''}${reasoning}`,
        };
        return traceItems;
    }

    const reasoningCount = traceItems.filter((item) => item?.type === 'reasoning').length;
    traceItems.push({
        id: `synthetic-reasoning:${reasoningCount}`,
        type: 'reasoning',
        label: 'Reasoning',
        text: reasoning,
    });
    return traceItems;
};

const getTraceToolMergeKey = (item, fallbackIndex) => {
    if (item?.call_id) {
        return item.call_id;
    }

    if (item?.id) {
        return item.id;
    }

    if (item?.name) {
        return `${item.name}:${fallbackIndex}`;
    }

    return `trace-tool:${fallbackIndex}`;
};

const mergeToolTraceItems = (existingTraceItems = [], incomingToolCalls = []) => {
    const incomingTraceItems = incomingToolCalls
        .map((toolCall, index) => {
            const [traceItem] = normalizeToolCallsToTraceItems([toolCall]);
            if (!traceItem) {
                return null;
            }

            const mergeKey = getToolCallMergeKey(toolCall, index);
            return {
                ...traceItem,
                id: traceItem.id ?? `synthetic-tool:${mergeKey}`,
                call_id: traceItem.call_id ?? mergeKey,
            };
        })
        .filter(Boolean);
    if (incomingTraceItems.length === 0) {
        return existingTraceItems;
    }

    const traceItems = [...existingTraceItems];
    const keyToIndex = new Map(
        traceItems
            .map((item, index) => (
                item?.type === 'tool_call'
                    ? [getTraceToolMergeKey(item, index), index]
                    : null
            ))
            .filter(Boolean),
    );

    incomingTraceItems.forEach((item, incomingIndex) => {
        const key = getTraceToolMergeKey(item, `${traceItems.length + incomingIndex}`);
        const existingIndex = keyToIndex.get(key);

        if (existingIndex === undefined) {
            keyToIndex.set(key, traceItems.length);
            traceItems.push(item);
            return;
        }

        traceItems[existingIndex] = {
            ...traceItems[existingIndex],
            ...item,
            argumentsValue: item.argumentsValue || traceItems[existingIndex].argumentsValue,
        };
    });

    return traceItems;
};

const useChatStore = create(persist(
    (set, get) => ({
        messages: [],
        conversation_id: "temp_id",     // new conversation will be initialize with temp_id
        conversation_title: "New Chat",

        setConversationId: (id) => set({ conversation_id: id }),
        setConversationTitle: (title) => {
            set({ conversation_title: title });
            // get().saveCurrentConversation(); // Trigger save after title change -> REMOVED to prevent duplicates
            get().triggerSidebarRefresh(); // New line
        },

        clearMessages: () => set({
            messages: [],
            conversation_id: "temp_id",
            conversation_title: "New Chat",
            isStreaming: false,
            abortController: null,
            chunkQueue: [],
            isProcessingChunks: false
        }),

        // parameter to stop streaming
        isStreaming: false,     // will be true when LLM streaming
        abortController: null,
        setIsStreaming: (streaming) => set({ isStreaming: streaming }),
        setAbortController: (controller) => set({ abortController: controller }),

        stopGeneration: () => {
            const { abortController } = get();
            if (abortController) {
                abortController.abort();
                set({ isStreaming: false, abortController: null });
            }
        },

        // handle smoothing of streaming
        enableChunking: true,
        chunkSize: 3,
        chunkDelay: 25,
        chunkQueue: [],

        waitForPendingChunks: async (timeoutMs = CHUNK_FLUSH_TIMEOUT_MS) => {
            const startTime = Date.now();

            while (true) {
                const { chunkQueue, isProcessingChunks } = get();
                if (chunkQueue.length === 0 && !isProcessingChunks) {
                    return true;
                }

                if (Date.now() - startTime >= timeoutMs) {
                    console.warn("Timed out waiting for pending message chunks to finish processing.");
                    return false;
                }

                await new Promise((resolve) => setTimeout(resolve, CHUNK_FLUSH_POLL_MS));
            }
        },


        // Define the saveCurrentConversation function
        saveCurrentConversation: async () => {
            await get().waitForPendingChunks();

            const { messages, conversation_id, conversation_title } = get();

            if (messages.length === 0) {
                console.log("No messages to save.");
                return;
            }
            //
            // First, try to save to backend
            try {
                let response;
                if (conversation_id === "temp_id") {
                    response = await axios.post('http://localhost:3000/api/conversations/save', {
                        messages,
                        title: conversation_title
                    });
                    set({ conversation_id: response.data.id });
                } else {
                    response = await axios.put(`http://localhost:3000/api/conversations/${conversation_id}`, {
                        messages,
                        title: conversation_title
                    });
                }
                console.log("Conversation saved to backend:", response.data.id);
                get().triggerSidebarRefresh();
            } catch (error) {
                console.error("Error saving to backend:", error);
            }

            // Then, try to save to localStorage with compression
            try {
                const conversation = JSON.stringify(messages);
                const compressed = compress(conversation);

                // Check compressed size
                const byteSize = new Blob([compressed]).size;

                if (byteSize > MAX_LOCAL_STORAGE_SIZE) {
                    console.warn("Compressed conversation too large for localStorage");

                    // Save only the most recent messages that fit
                    const saveRecentMessages = (msgs) => {
                        const compressedRecent = compress(JSON.stringify(msgs));
                        if (new Blob([compressedRecent]).size <= MAX_LOCAL_STORAGE_SIZE) {
                            localStorage.setItem('savedConversation', compressedRecent);
                            return true;
                        }
                        return false;
                    };

                    // Try to save last 10 messages, then reduce if still too large
                    let recentMessages = messages.slice(-10);
                    while (recentMessages.length > 0 && !saveRecentMessages(recentMessages)) {
                        recentMessages = recentMessages.slice(1);
                    }

                    console.log(`Saved ${recentMessages.length} most recent messages to localStorage`);
                } else {
                    localStorage.setItem('savedConversation', compressed);
                    console.log("Full conversation saved to localStorage");
                }
            } catch (error) {
                console.error("Error saving to localStorage:", error);
            }
        },

        // Add method to load conversation from localStorage
        loadSavedConversation: () => {
            try {
                const compressed = localStorage.getItem('savedConversation');
                if (compressed) {
                    const conversation = decompress(compressed);
                    return JSON.parse(conversation);
                }
            } catch (error) {
                console.error("Error loading from localStorage:", error);
                localStorage.removeItem('savedConversation'); // Clear corrupted data
            }
            return [];
        },

        // for title
        getFirstWordsFromUserMessages: (numWords) => {
            const { messages } = get();

            // Filter messages that have the role 'user'
            const userMessages = messages.filter(message => message.role === 'user');

            // If no user messages, return default
            if (userMessages.length === 0) return 'New Chat';

            // Collect the first numWords words from all user messages
            let words = [];
            for (const message of userMessages) {
                // Handle both array and string content
                const content = Array.isArray(message.content) ? message.content : [{
                    type: 'text',
                    content: message.content
                }];

                // Find the first text content
                const textContent = content.find(item => item.type === 'text')?.content;

                if (textContent) {
                    const messageWords = textContent.split(' '); // Split the content by spaces to get words
                    words = [...words, ...messageWords];         // Add to the collected words
                    if (words.length >= numWords) {
                        break;  // Stop if we have enough words
                    }
                }
            }

            // Return default if no text content found, otherwise return the first numWords
            return words.length > 0 ? words.slice(0, numWords).join(' ') : 'New Chat';
        },

        setChunkSize: (size) => set({ chunkSize: size }),
        setChunkDelay: (delay) => set({ chunkDelay: delay }),

        isProcessingChunks: false,

        addMessage: (message) => {
            console.log("addMessage", message);

            set((state) => {
                // Check if message contains images and they need resizing
                if (Array.isArray(message.content)) {
                    message.content = message.content.map(item => {
                        if (item.type === 'image_url') {
                            // Create a compressed version of the image data
                            return {
                                ...item,
                                data: get().compressImageData(item.data)
                            };
                        }
                        return item;
                    });
                }


                // Check if messages array is empty and update conversation_id and conversation_title if so
                if (state.messages.length === 0) {
                    get().setConversationId("temp_id")
                    get().setConversationTitle("New Chat")
                }

                // Handle message content as a sequence of text and images
                if (Array.isArray(message.content)) {
                    // Filter out empty text content
                    message.content = message.content.filter(item =>
                        item.type !== 'text' || (item.type === 'text' && item.content.trim() !== '')
                    );
                }

                get().triggerSidebarRefresh();

                const nextMessage = {
                    ...message,
                    ...(Array.isArray(message.trace_items) ? { trace_items: [...message.trace_items] } : {}),
                };

                return {
                    messages: [...state.messages, nextMessage],
                };
            });
        },

        updateLastMessage: (update) => {
            if (update.reasoning) {
                set((state) => {
                    const messages = [...state.messages];
                    const lastIndex = messages.length - 1;
                    if (lastIndex >= 0) {
                        const lastMsg = { ...messages[lastIndex] };
                        lastMsg.reasoning = (lastMsg.reasoning || '') + update.reasoning;
                        lastMsg.trace_items = appendReasoningTraceItem(
                            Array.isArray(lastMsg.trace_items) ? lastMsg.trace_items : [],
                            update.reasoning,
                        );
                        messages[lastIndex] = lastMsg;
                        return { messages };
                    }
                    return {};
                });
            }

            if (
                update.tool_calls
                || update.response_items
                || update.replace_response_items
                || update.response_id
                || update.previous_response_id
                || update.response_item_id
            ) {
                set((state) => {
                    const messages = [...state.messages];
                    const lastIndex = messages.length - 1;
                    if (lastIndex < 0) {
                        return {};
                    }

                    const lastMessage = { ...messages[lastIndex] };
                    const incomingToolCalls = Array.isArray(update.tool_calls) ? update.tool_calls : [];
                    const incomingResponseItems = Array.isArray(update.response_items) ? update.response_items : [];

                    if (incomingToolCalls.length > 0) {
                        lastMessage.tool_calls = mergeToolCalls(
                            Array.isArray(lastMessage.tool_calls) ? lastMessage.tool_calls : [],
                            incomingToolCalls,
                        );
                        lastMessage.trace_items = mergeToolTraceItems(
                            Array.isArray(lastMessage.trace_items) ? lastMessage.trace_items : [],
                            incomingToolCalls,
                        );
                    }

                    if (update.replace_response_items) {
                        lastMessage.response_items = [...incomingResponseItems];
                    } else if (incomingResponseItems.length > 0) {
                        lastMessage.response_items = mergeResponseItems(
                            Array.isArray(lastMessage.response_items) ? lastMessage.response_items : [],
                            incomingResponseItems,
                        );
                    }

                    if (update.response_id !== undefined) {
                        lastMessage.response_id = update.response_id;
                    }

                    if (update.previous_response_id !== undefined) {
                        lastMessage.previous_response_id = update.previous_response_id;
                    }

                    if (update.response_item_id !== undefined) {
                        lastMessage.response_item_id = update.response_item_id;
                    }

                    messages[lastIndex] = lastMessage;
                    return { messages };
                });
            }

            if (
                update.content
            ) {
                const currentState = get();
                const lastMessage = currentState.messages[currentState.messages.length - 1];
                if (!lastMessage) return;
                get().queueChunkedContent(lastMessage, 'content', update.content);
            }
        },

        getIntegratedMessages: () => {
            const state = get();
            return state.messages.map((message) => {
                const integratedMessage = { ...message };

                if (Array.isArray(message.content)) {
                    const hasImage = message.content.some(item => item.type === 'image_url');

                    integratedMessage.content = hasImage
                        ? message.content.map((item) => {
                            if (item.type === 'text') {
                                return {
                                    type: 'text',
                                    text: item.content,
                                };
                            }

                            return item;
                        })
                        : message.content
                            .map(item => item.type === 'text' ? item.content : '')
                            .join('');
                } else {
                    integratedMessage.content = [{
                        type: 'text',
                        content: message.content
                    }];
                }

                return integratedMessage;
            });
        },

        queueChunkedContent: (target, propertyName, content) => {
            const state = get();
            const chunks = state.enableChunking ? get().chunkText(content) : [content];

            set(state => ({
                chunkQueue: [
                    ...state.chunkQueue,
                    ...chunks.map(chunk => ({ target, propertyName, content: chunk }))
                ]
            }));

            if (!state.isProcessingChunks) {
                get().processNextChunk();
            }
        },

        processNextChunk: () => {
            set(state => ({ isProcessingChunks: true }));

            const processChunk = () => {
                set(state => {
                    if (state.chunkQueue.length === 0) {
                        return { isProcessingChunks: false };
                    }

                    const { propertyName, content } = state.chunkQueue[0];
                    const updatedMessages = [...state.messages];

                    if (updatedMessages.length === 0) {
                        // Should not happen during streaming usually
                        return {
                            chunkQueue: [],
                            isProcessingChunks: false
                        };
                    }

                    const lastMessageIndex = updatedMessages.length - 1;
                    const lastMessage = { ...updatedMessages[lastMessageIndex] };
                    updatedMessages[lastMessageIndex] = lastMessage;

                    // Ensure arrays and objects are cloned for immutability
                    if (lastMessage.content) {
                        lastMessage.content = [...lastMessage.content];
                    }
                    if (typeof lastMessage.content === 'string') {
                        lastMessage.content = lastMessage.content ? [{ type: 'text', content: lastMessage.content }] : [];
                    }

                    if (propertyName === 'content') {
                        if (lastMessage.content.length > 0 && lastMessage.content[lastMessage.content.length - 1].type === 'text') {
                            const lastItem = { ...lastMessage.content[lastMessage.content.length - 1] };
                            lastItem.content += content;
                            lastMessage.content[lastMessage.content.length - 1] = lastItem;
                        } else {
                            lastMessage.content.push({ type: 'text', content });
                        }
                    }

                    setTimeout(processChunk, state.chunkDelay);

                    return {
                        messages: updatedMessages,
                        chunkQueue: state.chunkQueue.slice(1)
                    };
                });
            };

            processChunk();
        },

        chunkText: (text) => {
            const chunkSize = get().chunkSize;
            const chunks = [];
            let currentChunk = '';
            let wordCount = 0;

            for (let i = 0; i < text.length; i++) {
                currentChunk += text[i];

                if (text[i] === ' ') {
                    wordCount++;
                    if (wordCount === chunkSize) {
                        chunks.push(currentChunk);
                        currentChunk = '';
                        wordCount = 0;
                    }
                }
            }

            if (currentChunk) {
                chunks.push(currentChunk);
            }

            return chunks;
        },

        // New function to trigger sidebar refresh
        triggerSidebarRefresh: () => {
            set(state => ({ sidebarRefreshTrigger: !state.sidebarRefreshTrigger }));
        },

        sidebarRefreshTrigger: false, // New state to trigger sidebar refresh

        // Add utility method for image compression
        compressImageData: (imageData) => {
            // If the image is a base64 string larger than 1MB, compress it
            if (typeof imageData === 'string' && imageData.length > 1024 * 1024) {
                // Create a temporary canvas to resize the image
                const img = new Image();
                img.src = imageData;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculate new dimensions (max 800px width/height)
                const maxDim = 800;
                let width = img.width;
                let height = img.height;

                if (width > height && width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                } else if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                return canvas.toDataURL('image/jpeg', 0.7);
            }

            return imageData;
        },

    }),
    {
        name: 'chat-storage', // Name for localStorage
        getStorage:
            () => localStorage, // Use localStorage to persist state
        partialize: (state) => ({
            messages: state.messages,
            conversation_id: state.conversation_id,
            conversation_title: state.conversation_title,
            enableChunking: state.enableChunking,
            chunkSize: state.chunkSize,
            chunkDelay: state.chunkDelay,
        }),
        version: 1,
        migrate: (persistedState, version) => {
            if (version === 0) {
                // Clean up transient state from version 0
                const {
                    isProcessingChunks,
                    chunkQueue,
                    isStreaming,
                    abortController,
                    ...rest
                } = persistedState;
                return rest;
            }
            return persistedState;
        },
    }
))
    ;

export default useChatStore;
