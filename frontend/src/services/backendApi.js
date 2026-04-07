import useApiKeyStore from '../store/apiKeyStore.js';
import {
    DEFAULT_BACKEND_API_BASE_URL,
    joinUrlPath,
    normalizeConfiguredUrl,
} from './urlConfig.js';

export const getBackendApiBaseUrl = () => normalizeConfiguredUrl(
    useApiKeyStore.getState().backendApiUrl,
    DEFAULT_BACKEND_API_BASE_URL,
);

export const buildBackendApiUrl = (path = '') => joinUrlPath(getBackendApiBaseUrl(), path);
