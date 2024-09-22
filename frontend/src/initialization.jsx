// In a new file, e.g., initializeData.js
import useChatStore from './store/chatStore';
import useUIStore from './store/uiStore';
import {mockMessages, mockMessagesBasic} from './mock/mockChatStore';

export const initializeWithMockData = (mockType = 'advanced') => {
    const chatStore = useChatStore.getState();
    const uiStore = useUIStore.getState();

    // Clear existing messages
    chatStore.clearMessages();

    // Choose mock messages based on the mockType parameter
    let selectedMockMessages;
    switch (mockType) {
        case 'basic':
            selectedMockMessages = mockMessagesBasic;
            break;
        case 'advanced':
            selectedMockMessages = mockMessages;
            // Set the visible artifact ID (adjust based on mockType if needed)
            chatStore.setVisibleArtifactId('bst-with-search');
            break;
        // Add more cases as needed
        default:
            selectedMockMessages = mockMessagesBasic;
    }

    // Add selected mock messages
    selectedMockMessages.forEach(message => {
        chatStore.addMessage(message);
    });



    // Set UI state
    uiStore.showChatComponent = true;
    uiStore.showArtifact = true;
};

export const initializeWithRealData = () => {
    // Implement real data initialization here
    // This could involve API calls, loading from local storage, etc
    const chatStore = useChatStore.getState();
    const uiStore = useUIStore.getState();

    // Clear existing messages
    chatStore.clearMessages();

    // Set UI state
    uiStore.showChatComponent = true;
    uiStore.showArtifact = true;
};