export const DEFAULT_BACKEND_API_BASE_URL = 'http://localhost:3000';
export const DEFAULT_GALLAMA_API_BASE_URL = 'http://127.0.0.1:8000/v1';

export const normalizeConfiguredUrl = (value, fallback = '') => {
    const nextValue = String(value ?? '').trim() || String(fallback ?? '').trim();
    if (!nextValue) {
        return '';
    }

    return nextValue.replace(/\/+$/, '');
};

export const joinUrlPath = (baseUrl, path = '') => {
    const normalizedBase = normalizeConfiguredUrl(baseUrl);
    if (!path) {
        return normalizedBase;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
};
