import { parseHeadersText } from './api/requestTransforms.js';
import { normalizeDiscoveredTools } from './mcpUtils.js';
import { buildBackendApiUrl } from './backendApi.js';

export const discoverMcpTools = async (server) => {
    const response = await fetch(buildBackendApiUrl('/api/mcp/discover'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: server?.url?.trim(),
            authorizationToken: server?.authorizationToken?.trim() || '',
            headers: parseHeadersText(server?.headersText, server?.name),
        }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('MCP discovery endpoint not found. Restart the backend so /api/mcp/discover is loaded.');
        }

        throw new Error(
            payload?.error
            || payload?.details
            || payload?.message
            || response.statusText
            || `Unable to discover MCP tools (HTTP ${response.status}).`
        );
    }

    return {
        protocolVersion: payload.protocolVersion,
        tools: normalizeDiscoveredTools(payload.tools),
    };
};
