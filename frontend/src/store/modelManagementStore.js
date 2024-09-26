import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import useApiKeyStore from './apiKeyStore'  // Import the existing store

const useModelManagementStore = create(
    persist(
        (set, get) => ({
            availableModels: [],
            taskStatus: {},
            loadedModels: {},  // New state to store loaded models
            isLoading: false,

            fetchAvailableModels: async () => {
                const endpoint = get().getServiceEndpoint()
                const response = await fetch(`${endpoint}/list_available_models`)
                const data = await response.json()
                set({availableModels: data})
                console.log("Available models: ", data)
            },

            fetchLoadedModels: async () => {  // Updated function to fetch loaded models
                set({isLoading: true})
                const endpoint = get().getServiceEndpoint()
                try {
                    const response = await fetch(`${endpoint}/list_loaded_models`)
                    if (!response.ok) {
                        throw new Error('Failed to fetch loaded models')
                    }
                    const data = await response.json()
                    set({loadedModels: data})
                    console.log("Loaded models: ", data)
                } catch (error) {
                    console.error("Error fetching loaded models: ", error)
                    set({loadedModels: {}})  // Clear the store if there's an error
                }
                setTimeout(() => {
                    set({isLoading: false})
                }, 500);
            },

            loadModel: async (model) => {
                set({isLoading: true})
                const endpoint = get().getServiceEndpoint();
                const response = await fetch(`${endpoint}/add_model`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(model)
                });
                const data = await response.json();
                set(state => ({
                    taskStatus: {...state.taskStatus, [data.task_id]: 'queued'}
                }));

                // Poll the task status and update models
                get().pollTaskStatus(data.task_id);

                // Fetch available models and update selected model in apiKeyStore after successful load
                get().fetchAvailableModels();
                const apiKeyState = useApiKeyStore.getState();
                apiKeyState.setSelectedModel('gallama', model.name);  // Assuming `model.name` is the model's identifier
            },

            stopModelByPort: async (port) => {
                const endpoint = get().getServiceEndpoint();
                try {
                    const response = await fetch(`${endpoint}/stop_model_by_port`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({port})
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        console.error(`Failed to stop model on port ${port}: `, error);
                    } else {
                        console.log(`Successfully stopped model on port ${port}`);

                        // Refresh loaded models after stopping a model
                        get().fetchLoadedModels();

                        // Optionally, update selected model in apiKeyStore if needed
                        const apiKeyState = useApiKeyStore.getState();
                        const availableModels = get().availableModels;
                        if (availableModels.length > 0) {
                            apiKeyState.setSelectedModel('gallama', availableModels[0].name); // Update with first available model
                        } else {
                            apiKeyState.setSelectedModel('gallama', null); // No models available
                        }
                    }
                } catch (error) {
                    console.error(`Error stopping model on port ${port}: `, error);
                }
            },

            pollTaskStatus: async (task_id) => {
                const endpoint = get().getServiceEndpoint();
                const checkStatus = async () => {
                    const response = await fetch(`${endpoint}/task_status/${task_id}`);
                    const data = await response.json();
                    set(state => ({
                        taskStatus: {...state.taskStatus, [task_id]: data.status}
                    }));
                    if (data.status === 'loading' || data.status.startsWith('queued')) {
                        setTimeout(checkStatus, 2000); // Poll every 2 seconds
                    } else if (data.status === 'completed') {
                        // Refresh the list of loaded models when a new model is successfully loaded
                        get().fetchLoadedModels();

                        // Update selected model in apiKeyStore
                        const apiKeyState = useApiKeyStore.getState();
                        const availableModels = get().availableModels;
                        if (availableModels.length > 0) {
                            apiKeyState.setSelectedModel('gallama', availableModels[0].name);  // Update with first available model
                        }
                    }
                };
                checkStatus();
            },

            getServiceEndpoint: () => {
                const apiKeyState = useApiKeyStore.getState()  // Access the state from useApiKeyStore
                return apiKeyState.services['gallama']?.endpoint || ''
            },
        }),
        {
            name: 'model-management-store',
            getStorage: () => localStorage,
            onRehydrateStorage: () => (state) => {
                if (!Array.isArray(state?.availableModels)) {
                    state.availableModels = []; // Ensure it's always an array
                }
                if (typeof state?.loadedModels !== 'object') {
                    state.loadedModels = {}; // Ensure it's always an object
                }
            }
        }
    )
)

export default useModelManagementStore