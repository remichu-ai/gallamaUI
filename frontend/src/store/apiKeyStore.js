import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import {
    API_ENDPOINT_OPTIONS,
    DEFAULT_API_ENDPOINT_TYPE
} from '../services/api/endpointTypes.js';
import {
    DEFAULT_BACKEND_API_BASE_URL,
    DEFAULT_GALLAMA_API_BASE_URL,
    normalizeConfiguredUrl,
} from '../services/urlConfig.js';

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
                    endpoint: DEFAULT_GALLAMA_API_BASE_URL,
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
                backendApiUrl: DEFAULT_BACKEND_API_BASE_URL,
                apiEndpointOptions: API_ENDPOINT_OPTIONS,
                selectedApiEndpointType: DEFAULT_API_ENDPOINT_TYPE,
                services,
                availableModels: {},
                selectedModels: {}, // Store selected model for each service

                updateApiKey: (service, key) => set(state => ({
                    apiKeys: {...state.apiKeys, [service]: key}
                })),
                clearApiKey: (service) => set(state => ({
                    apiKeys: {...state.apiKeys, [service]: 'NA'}
                })),

                setBackendApiUrl: (url) => set(() => ({
                    backendApiUrl: url,
                })),

                selectApiEndpointType: (apiEndpointType) => set((state) => {
                    const isValidApiEndpointType = state.apiEndpointOptions.some(
                        (option) => option.value === apiEndpointType
                    );

                    if (!isValidApiEndpointType) {
                        console.warn(`API endpoint type ${apiEndpointType} not found. Keeping current selection.`);
                        return {};
                    }

                    return { selectedApiEndpointType: apiEndpointType };
                }),

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
                    return normalizeConfiguredUrl(
                        state.services[state.selectedService]?.endpoint,
                        services[state.selectedService]?.endpoint
                    )
                },

                setServiceEndpoint: (serviceName, endpoint) =>
                    set((state) => {
                        if (!state.services[serviceName]) {
                            console.warn(`Service ${serviceName} not found. Keeping current endpoint.`)
                            return {}
                        }

                        return {
                            services: {
                                ...state.services,
                                [serviceName]: {
                                    ...state.services[serviceName],
                                    endpoint,
                                }
                            }
                        }
                    }),

                getBackendApiBaseUrl: () => normalizeConfiguredUrl(
                    get().backendApiUrl,
                    DEFAULT_BACKEND_API_BASE_URL
                ),

                getSelectedApiEndpointType: () => {
                    const state = get();
                    return state.selectedApiEndpointType;
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
