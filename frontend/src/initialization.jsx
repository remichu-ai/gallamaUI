// In a new file, e.g., initializeData.js
import useChatStore from './store/chatStore';
import useUIStore from './store/uiStore';
import useModelManagementStore from './store/modelManagementStore';
import useApiKeyStore from './store/apiKeyStore';
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

export const initializeWithRealData = async () => {
    // Get all store states
    const modelManagementStore = useModelManagementStore.getState();
    const apiKeyStore = useApiKeyStore.getState();
    const chatStore = useChatStore.getState();
    const uiStore = useUIStore.getState();

    // Clear existing messages and set initial UI state
    chatStore.clearMessages();
    uiStore.showChatComponent = true;
    uiStore.showArtifact = true;

    try {
        // Fetch both available and loaded models
        await Promise.all([
            modelManagementStore.fetchAvailableModels(),
            modelManagementStore.fetchLoadedModels()
        ]);

        // Get the current state after fetches
        const availableModels = modelManagementStore.availableModels;
        const loadedModels = modelManagementStore.loadedModels;

        // Get the previously selected model for the gallama service
        const previousSelectedModel = apiKeyStore.selectedModels['gallama'];

        // Initialize model selection based on loaded models
        let modelToSelect = '';

        // First, check if we have any loaded models
        if (Object.keys(loadedModels).length > 0) {
            // If we have loaded models, prefer the previously selected model if it's still loaded
            const loadedModelNames = Object.values(loadedModels).map(model => model.name);

            if (previousSelectedModel && loadedModelNames.includes(previousSelectedModel)) {
                modelToSelect = previousSelectedModel;
            } else {
                // If previous model isn't loaded, use the first loaded model
                modelToSelect = loadedModelNames[0];
            }
        } else if (availableModels.length > 0) {
            // If no loaded models but we have available models, check if previous model is in available list
            const availableModelNames = availableModels.map(model => model.name);

            if (previousSelectedModel && availableModelNames.includes(previousSelectedModel)) {
                modelToSelect = previousSelectedModel;
            } else {
                // If previous model isn't available, use the first available model
                modelToSelect = availableModelNames[0];
            }
        }

        // Update the selected model in the API key store
        apiKeyStore.setSelectedModel('gallama', modelToSelect);

        // Initialize available models in the API key store
        const modelNames = availableModels.map(model => model.name);
        apiKeyStore.setAvailableModels('gallama', modelNames);

        console.log('Initialization complete:', {
            selectedModel: modelToSelect,
            availableModels: modelNames,
            loadedModels: Object.keys(loadedModels),
            uiState: {
                showChatComponent: uiStore.showChatComponent,
                showArtifact: uiStore.showArtifact
            }
        });

    } catch (error) {
        console.error('Error during initialization:', error);
        // Reset to empty state in case of error
        apiKeyStore.setSelectedModel('gallama', '');
        apiKeyStore.setAvailableModels('gallama', []);
    }
};