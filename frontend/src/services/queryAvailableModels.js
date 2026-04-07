import useApiKeyStore from '../store/apiKeyStore'
import { joinUrlPath } from './urlConfig.js';

const queryAvailableModels = async () => {
    const store = useApiKeyStore.getState()
    const { selectedService, services, apiKeys } = store

    const apiKey = apiKeys[selectedService]
    if (!apiKey) {
        console.warn(`No API key available for ${selectedService}`)
        return []
    }

    const endpoint = store.getSelectedServiceEndpoint?.() || services[selectedService]?.endpoint
    if (!endpoint) {
        console.warn(`No API endpoint configured for ${selectedService}`)
        return []
    }

    try {
        let response
        switch (selectedService) {
            case 'openai':
                response = await fetch(joinUrlPath(endpoint, '/models'), {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                })
                if (response.ok) {
                    const data = await response.json()
                    return data.data.map(model => model.id)
                }
                break
            case 'gallama':
                // Assuming Gallama has a similar endpoint structure
                response = await fetch(joinUrlPath(endpoint, '/models'), {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                })
                if (response.ok) {
                    const data = await response.json()
                    return data.data.map(model => model.id)
                }
                break
            case 'claude':
                // Claude might have a different way to query models
                // This is a placeholder and should be adjusted based on Claude's API
                return ['claude-v1', 'claude-instant-v1'] // Example models
            default:
                console.warn(`Unsupported service: ${selectedService}`)
                return []
        }
    } catch (error) {
        console.error(`Error querying models for ${selectedService}:`, error)
        return []
    }

    return []
}

export { queryAvailableModels }
