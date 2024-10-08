import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import axios from 'axios';
// import {v4 as uuidv4} from 'uuid';

const useChatStore = create(persist(
    (set, get) => ({
        messages: [],
        conversation_id: "temp_id",     // new conversation will be initialize with temp_id
        conversation_title: "New Chat",

        setConversationId: (id) => set({conversation_id: id}),
        setConversationTitle: (title) => {
            set({conversation_title: title});
            get().saveCurrentConversation(); // Trigger save after title change
            get().triggerSidebarRefresh(); // New line
        },

        clearMessages: () => set({
            messages: [],
            conversation_id: "temp_id",
            conversation_title: "New Chat",
            isStreaming: false,
            abortController: null,
            visibleArtifactId: null,
            artifactIds: [],
            isViewingLatestArtifact: true
        }),

        // parameter to stop streaming
        isStreaming: false,     // will be true when LLM streaming
        abortController: null,
        setIsStreaming: (streaming) => set({isStreaming: streaming}),
        setAbortController: (controller) => set({abortController: controller}),

        stopGeneration: () => {
            const {abortController} = get();
            if (abortController) {
                abortController.abort();
                set({isStreaming: false, abortController: null});
            }
        },

        // artifact parameters
        visibleArtifactId: null,
        artifactIds: [],
        isViewingLatestArtifact: true,

        // handle smoothing of streaming
        enableChunking: true,
        chunkSize: 3,
        chunkDelay: 25,
        chunkQueue: [],


        // Define the saveCurrentConversation function
        saveCurrentConversation: async () => {
            const {messages, conversation_id, conversation_title} = get();

            // Check if the messages array is empty
            if (messages.length === 0) {
                console.log("No messages to save.");
                return; // Exit the function if there are no messages
            }

            // Save conversation to localStorage
            const conversation = JSON.stringify(messages);
            localStorage.setItem('savedConversation', conversation);
            console.log("Current conversation saved to localStorage.");

            // Save conversation to backend
            try {
                let response;
                if (conversation_id === "temp_id") {
                    // New conversation
                    response = await axios.post('http://localhost:3000/api/conversations/save', {
                        messages,
                        title: conversation_title
                    });
                    set({conversation_id: response.data.id});
                } else {
                    // Existing conversation
                    response = await axios.put(`http://localhost:3000/api/conversations/${conversation_id}`, {
                        messages,
                        title: conversation_title
                    });
                }
                // const conversationId = response.data.id;
                // localStorage.setItem('currentConversationId', conversationId);
                console.log("Current conversation saved to backend with ID:", response.data.id);
            } catch (error) {
                console.error("Error saving conversation to backend:", error);
            }
        },


        // for title
        getFirstWordsFromUserMessages: (numWords) => {
            const {messages} = get();

            // Filter messages that have the role 'user'
            const userMessages = messages.filter(message => message.role === 'user');

            // Collect the first numWords words from all user messages
            let words = [];
            for (const message of userMessages) {
                const messageWords = message.content[0].content.split(' '); // Split the content by spaces to get words
                words = [...words, ...messageWords];             // Add to the collected words
                if (words.length >= numWords) {
                    break;  // Stop if we have enough words
                }
            }

            // Return the first numWords words
            return words.slice(0, numWords).join(' '); // Join them back into a string
        },


        setChunkSize: (size) => set({chunkSize: size}),
        setChunkDelay: (delay) => set({chunkDelay: delay}),

        isProcessingChunks: false,

        addMessage: (message) => {
            console.log("addMessage", message);

            set((state) => {
                // Check if messages array is empty and update conversation_id and conversation_title if so
                if (state.messages.length === 0) {
                    get().setConversationId("temp_id")
                    get().setConversationTitle("New Chat")
                }

                let newVisibleArtifactId = state.visibleArtifactId;
                let newArtifactIds = [...state.artifactIds];

                if (message.artifacts && Object.keys(message.artifacts).length > 0) {
                    const newMessageArtifactIds = Object.keys(message.artifacts);
                    newArtifactIds = [...new Set([...newArtifactIds, ...newMessageArtifactIds])];

                    if (state.isViewingLatestArtifact) {
                        newVisibleArtifactId = newMessageArtifactIds[0];
                    }

                    // Directly update artifact content
                    Object.keys(message.artifacts).forEach(identifier => {
                        const artifact = message.artifacts[identifier];

                        // Log artifact being processed
                        console.log("Processing artifact:", identifier, artifact);

                        // Update the artifact content directly
                        if (artifact.content) {
                            if (!message.content.some(item => item.type === 'artifact' && item.identifier === identifier)) {
                                message.content.push({type: 'artifact', identifier});
                            }

                            message.artifacts[identifier].content = artifact.content;
                        } else {
                            console.log(`No content found for artifact: ${identifier}`);
                        }
                    });
                } else {
                    console.log("No artifacts found in message");
                }

                // Save conversation after adding message
                get().triggerSidebarRefresh(); // New line

                return {
                    messages: [...state.messages, {...message}],
                    visibleArtifactId: newVisibleArtifactId,
                    artifactIds: newArtifactIds,
                };
            });
        },


        updateLastMessage: (update) => {
            set((state) => {
                const updatedMessages = state.messages.map((msg, index) => {
                    if (index === state.messages.length - 1) {
                        const updatedMessage = {...msg};
                        updatedMessage.content = updatedMessage.content || [];
                        updatedMessage.artifacts = updatedMessage.artifacts || {};

                        if (update.artifact_meta) {
                            if (update.artifact_meta.tag_type === "artifact") {
                                const {identifier} = update.artifact_meta;

                                if (!updatedMessage.artifacts[identifier]) {
                                    get().queueChunkedContent(updatedMessage, 'newArtifact', {
                                        identifier,
                                        artifactMeta: update.artifact_meta,
                                    });
                                }

                                get().queueChunkedContent(updatedMessage, 'artifactContent', {
                                    identifier,
                                    content: update.content,
                                });
                            } else if (update.artifact_meta.tag_type === "text") {
                                get().queueChunkedContent(updatedMessage, 'content', update.content);
                            }
                        } else {
                            if (update.thinking) {
                                //console.log('Updating thinking:', update.thinking);
                                updatedMessage.thinking = (updatedMessage.thinking || '') + update.thinking;
                            }
                            if (update.content) {
                                get().queueChunkedContent(updatedMessage, 'content', update.content);
                            }
                        }

                        return updatedMessage;
                    }
                    return msg;
                });

                return {messages: updatedMessages};
            });
        },

        queueChunkedContent: (target, propertyName, content) => {
            const state = get();
            let chunks;

            if (propertyName === 'newArtifact' || propertyName === 'artifactContent') {
                chunks = [content];
            } else {
                chunks = state.enableChunking ? get().chunkText(content) : [content];
            }

            set(state => ({
                chunkQueue: [
                    ...state.chunkQueue,
                    ...chunks.map(chunk => ({target, propertyName, content: chunk}))
                ]
            }));

            if (!state.isProcessingChunks) {
                get().processNextChunk();
            }
        },

        processNextChunk: () => {
            set(state => ({isProcessingChunks: true}));

            const processChunk = () => {
                set(state => {
                    if (state.chunkQueue.length === 0) {
                        return {isProcessingChunks: false};
                    }

                    const {target, propertyName, content} = state.chunkQueue[0];
                    const updatedMessages = [...state.messages];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];

                    if (propertyName === 'newArtifact') {
                        if (!target.artifacts[content.identifier]) {
                            target.artifacts[content.identifier] = {
                                ...content.artifactMeta,
                                content: '',
                            };
                            if (!target.content.some(item => item.type === 'artifact' && item.identifier === content.identifier)) {
                                target.content.push({type: 'artifact', identifier: content.identifier});
                            }

                            set(state => ({
                                artifactIds: [...new Set([...state.artifactIds, content.identifier])],
                                visibleArtifactId: state.isViewingLatestArtifact ? content.identifier : state.visibleArtifactId
                            }));
                        }
                    } else if (propertyName === 'artifactContent') {
                        if (target.artifacts[content.identifier]) {
                            target.artifacts[content.identifier].content += content.content;
                        }
                    } else if (propertyName === 'content') {
                        if (target[propertyName].length > 0 && target[propertyName][target[propertyName].length - 1].type === 'text') {
                            target[propertyName][target[propertyName].length - 1].content += content;
                        } else {
                            target[propertyName].push({type: 'text', content});
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

        setVisibleArtifactId: (id) => set((state) => ({
            visibleArtifactId: id,
            isViewingLatestArtifact: state.artifactIds.indexOf(id) === state.artifactIds.length - 1,
        })),

        clearVisibleArtifact: () => set({visibleArtifactId: null, isViewingLatestArtifact: false}),

        getVisibleArtifact: () => {
            const state = get();
            if (!state.visibleArtifactId) return null;

            for (const message of state.messages) {
                if (message.artifacts && message.artifacts[state.visibleArtifactId]) {
                    return message.artifacts[state.visibleArtifactId];
                }
            }
            return null;
        },

        getIntegratedMessages: () => {
            const state = get();
            return state.messages.map((message) => {
                const integratedMessage = {...message};
                let integratedContent = '';

                if (Array.isArray(message.content)) {
                    message.content.forEach((item) => {
                        if (item.type === 'text') {
                            integratedContent += item.content;
                        } else if (item.type === 'artifact') {
                            const artifact = message.artifacts[item.identifier];
                            const languageAttr = artifact.language ? ` language="${artifact.language}"` : '';
                            integratedContent += `
<artifact identifier="${item.identifier}" type="${artifact.artifact_type}"${languageAttr} title="${artifact.title}">
${artifact.content}
</artifact>`;
                        }
                    });
                }

                integratedMessage.content = integratedContent.trim();
                delete integratedMessage.artifacts;

                return integratedMessage;
            });
        },

        getIntegratedMessagesWithText: () => {
            const state = get();
            return state.messages.map((message) => {
                const integratedMessage = {...message};
                let formattedContent = '';

                if (Array.isArray(message.content)) {
                    message.content.forEach((item) => {
                        if (item.type === 'text') {
                            formattedContent += `<text>${item.content}</text>`;
                        } else if (item.type === 'artifact') {
                            const artifact = message.artifacts[item.identifier];
                            const languageAttr = artifact.language ? ` language="${artifact.language}"` : '';
                            formattedContent += `
<artifact identifier="${item.identifier}" type="${artifact.artifact_type}"${languageAttr} title="${artifact.title}">
${artifact.content}
</artifact>`;
                        }
                    });
                } else {
                    console.error("Expected message.content to be an array, but got:", message.content);
                }

                integratedMessage.content = `<answer>${formattedContent.trim()}</answer>`;
                delete integratedMessage.artifacts;

                return integratedMessage;
            });
        },

        navigateArtifact: (direction) => {
            const state = get();
            const currentIndex = state.artifactIds.indexOf(state.visibleArtifactId);
            let newIndex;

            if (direction === 'next') {
                newIndex = (currentIndex + 1) % state.artifactIds.length;
            } else {
                newIndex = (currentIndex - 1 + state.artifactIds.length) % state.artifactIds.length;
            }

            set({
                visibleArtifactId: state.artifactIds[newIndex],
                isViewingLatestArtifact: newIndex === state.artifactIds.length - 1,
            });
        },

        // New function to trigger sidebar refresh
        triggerSidebarRefresh: () => {
            set(state => ({sidebarRefreshTrigger: !state.sidebarRefreshTrigger}));
        },

        sidebarRefreshTrigger: false, // New state to trigger sidebar refresh

    }),
    {
        name: 'chat-storage', // Name for localStorage
        getStorage: () => localStorage, // Use localStorage to persist state
    }
));

export default useChatStore;
