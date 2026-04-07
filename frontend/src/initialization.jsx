// In a new file, e.g., initializeData.js
import useChatStore from './store/chatStore';
import useUIStore from './store/uiStore';
import useModelManagementStore from './store/modelManagementStore';
import useApiKeyStore from './store/apiKeyStore';
import {mockMessages, mockMessagesBasic} from './mock/mockChatStore';

const scheduleBackgroundTask = (task) => {
    if (typeof window === 'undefined') {
        return task();
    }

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
            void task();
        }, { timeout: 1200 });
        return undefined;
    }

    window.setTimeout(() => {
        void task();
    }, 0);
    return undefined;
};

const syncModelSelection = (apiKeyStore, { allowAvailableFallback }) => {
    const {
        availableModels,
        loadedModels,
    } = useModelManagementStore.getState();

    const previousSelectedModel = apiKeyStore.selectedModels['gallama'];
    const loadedModelNames = Object.values(loadedModels).map((model) => model.name);
    const availableModelNames = availableModels.map((model) => model.name);

    let modelToSelect = '';

    if (loadedModelNames.length > 0) {
        if (previousSelectedModel && loadedModelNames.includes(previousSelectedModel)) {
            modelToSelect = previousSelectedModel;
        } else {
            modelToSelect = loadedModelNames[0];
        }
    } else if (allowAvailableFallback && availableModelNames.length > 0) {
        if (previousSelectedModel && availableModelNames.includes(previousSelectedModel)) {
            modelToSelect = previousSelectedModel;
        } else {
            modelToSelect = availableModelNames[0];
        }
    }

    apiKeyStore.setSelectedModel('gallama', modelToSelect);
    apiKeyStore.setAvailableModels('gallama', availableModelNames);
};

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
};

export const initializeWithRealData = async () => {
    const modelManagementStore = useModelManagementStore.getState();
    const apiKeyStore = useApiKeyStore.getState();

    // Preserve persisted chat state when the app is recreated on mobile.
    useUIStore.setState({ showChatComponent: true });

    try {
        // Load only what the chat shell needs immediately.
        await modelManagementStore.fetchLoadedModels();
        syncModelSelection(apiKeyStore, { allowAvailableFallback: false });

        // The broader model catalog is only needed for secondary surfaces.
        scheduleBackgroundTask(async () => {
            try {
                await modelManagementStore.fetchAvailableModels();
                syncModelSelection(apiKeyStore, { allowAvailableFallback: true });
            } catch (error) {
                console.error('Error fetching available models in the background:', error);
            }
        });

        const {
            availableModels,
            loadedModels,
        } = useModelManagementStore.getState();

        console.log('Initialization complete:', {
            selectedModel: apiKeyStore.selectedModels['gallama'],
            availableModels: availableModels.map((model) => model.name),
            loadedModels: Object.keys(loadedModels),
            uiState: {
                showChatComponent: useUIStore.getState().showChatComponent,
            }
        });

    } catch (error) {
        console.error('Error during initialization:', error);
    }
};
