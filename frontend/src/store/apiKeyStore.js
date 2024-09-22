import {create} from 'zustand'
import {persist} from 'zustand/middleware'

const useApiKeyStore = create(
    persist(
        (set, get) => {
            const services = {
                // openai: {
                //     name: 'OpenAI',
                //     endpoint: 'https://api.openai.com/v1',
                // },
                gallama: {
                    name: 'Gallama',
                    endpoint: 'http://127.0.0.1:8000/v1',
                },
                // claude: {
                //     name: 'Claude',
                //     endpoint: 'https://api.anthropic.com',
                // },
            };

            // Initialize apiKeys with 'NA' for all services
            const initialApiKeys = Object.keys(services).reduce((acc, service) => {
                acc[service] = 'NA';
                return acc;
            }, {});

            return {
                apiKeys: initialApiKeys,
                selectedService: "gallama", // default service
                services,
                availableModels: {},
                selectedModels: {}, // Store selected model for each service

                updateApiKey: (service, key) => set(state => ({
                    apiKeys: {...state.apiKeys, [service]: key}
                })),
                clearApiKey: (service) => set(state => ({
                    apiKeys: {...state.apiKeys, [service]: 'NA'}
                })),

                selectService: (serviceName) =>
                    set((state) => {
                        if (state.services[serviceName]) {
                            return {selectedService: serviceName}
                        }
                        console.warn(`Service ${serviceName} not found. Keeping current selection.`)
                        return {}
                    }),

                getSelectedServiceEndpoint: () => {
                    const state = get()
                    return state.services[state.selectedService]?.endpoint
                },

                setAvailableModels: (service, models) => set(state => {
                    // Update available models
                    const newAvailableModels = {...state.availableModels, [service]: models};

                    // Check if the selected model is still valid
                    const selectedModel = state.selectedModels[service];
                    if (!models.includes(selectedModel)) {
                        const newSelectedModel = models.length > 0 ? models[0] : null;
                        return {
                            availableModels: newAvailableModels,
                            selectedModels: {...state.selectedModels, [service]: newSelectedModel}
                        };
                    }

                    return {
                        availableModels: newAvailableModels
                    };
                }),

                getAvailableModels: () => {
                    const state = get()
                    return state.availableModels[state.selectedService] || []
                },

                setSelectedModel: (service, model) => set(state => ({
                    selectedModels: {...state.selectedModels, [service]: model}
                })),

                getSelectedModel: () => {
                    const state = get()
                    return state.selectedModels[state.selectedService] || state.availableModels[state.selectedService]?.[0] || null
                },
            }
        },
        {
            name: 'api-key-store',
            getStorage: () => localStorage,
            onRehydrateStorage: () => (state) => {
                // Check if the selected models are valid after rehydration
                const availableModels = get().availableModels[get().selectedService] || [];
                const selectedModel = get().selectedModels[get().selectedService];

                if (!availableModels.includes(selectedModel)) {
                    // Reset to the first available model if the selected one is invalid
                    const newSelectedModel = availableModels.length > 0 ? availableModels[0] : null;
                    set({
                        selectedModels: {...get().selectedModels, [get().selectedService]: newSelectedModel}
                    });
                }
            }
        }
    )
)

export default useApiKeyStore