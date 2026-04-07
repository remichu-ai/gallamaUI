export const MCP_TOOL_MODE_ALL = 'all';
export const MCP_TOOL_MODE_CUSTOM = 'custom';

const VALID_DISCOVERY_STATES = new Set(['idle', 'loading', 'ready', 'error', 'stale']);

const createFallbackUuid = () => {
    const cryptoApi = globalThis.crypto;

    if (typeof cryptoApi?.randomUUID === 'function') {
        return cryptoApi.randomUUID();
    }

    if (typeof cryptoApi?.getRandomValues === 'function') {
        const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20),
        ].join('-');
    }

    return `mcp-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const parseDelimitedToolNames = (value) => {
    if (Array.isArray(value)) {
        return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
    }

    if (!value) {
        return [];
    }

    return [...new Set(
        String(value)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
    )];
};

export const normalizeDiscoveredTools = (tools = []) => {
    return tools
        .map((tool) => {
            const name = String(tool?.name ?? '').trim();
            if (!name) {
                return null;
            }

            return {
                name,
                description: typeof tool?.description === 'string' ? tool.description : '',
                inputSchema: tool?.inputSchema ?? tool?.input_schema ?? null,
                annotations: tool?.annotations ?? null,
            };
        })
        .filter(Boolean);
};

export const normalizeMcpServerShape = (server = {}) => {
    const discoveredTools = normalizeDiscoveredTools(server.discoveredTools);
    const selectedToolNames = parseDelimitedToolNames(server.selectedToolNames);
    const legacyAllowedTools = parseDelimitedToolNames(server.allowedTools);

    let toolMode = server.toolMode;
    if (toolMode !== MCP_TOOL_MODE_ALL && toolMode !== MCP_TOOL_MODE_CUSTOM) {
        toolMode = selectedToolNames.length > 0 || legacyAllowedTools.length > 0
            ? MCP_TOOL_MODE_CUSTOM
            : MCP_TOOL_MODE_ALL;
    }

    return {
        id: server.id ?? createFallbackUuid(),
        enabled: server.enabled !== false,
        name: typeof server.name === 'string' ? server.name : '',
        url: typeof server.url === 'string' ? server.url : '',
        authorizationToken: typeof server.authorizationToken === 'string' ? server.authorizationToken : '',
        allowedTools: typeof server.allowedTools === 'string' ? server.allowedTools : '',
        headersText: typeof server.headersText === 'string' && server.headersText.trim()
            ? server.headersText
            : '{}',
        discoveredTools,
        toolMode,
        selectedToolNames: toolMode === MCP_TOOL_MODE_CUSTOM
            ? (selectedToolNames.length > 0 ? selectedToolNames : legacyAllowedTools)
            : [],
        discoveryStatus: VALID_DISCOVERY_STATES.has(server.discoveryStatus)
            ? server.discoveryStatus
            : (discoveredTools.length > 0 ? 'ready' : 'idle'),
        discoveryError: typeof server.discoveryError === 'string' ? server.discoveryError : '',
        lastDiscoveredAt: typeof server.lastDiscoveredAt === 'string' ? server.lastDiscoveredAt : null,
    };
};

export const getAllowedToolsForServer = (server) => {
    const normalizedServer = normalizeMcpServerShape(server);
    if (normalizedServer.toolMode === MCP_TOOL_MODE_ALL) {
        return undefined;
    }

    const discoveredToolNames = new Set(normalizedServer.discoveredTools.map((tool) => tool.name));
    const selectedTools = normalizedServer.selectedToolNames.filter((toolName) =>
        toolName && (discoveredToolNames.size === 0 || discoveredToolNames.has(toolName))
    );

    return selectedTools;
};

export const isToolAllowedForServer = (server, toolName) => {
    const normalizedServer = normalizeMcpServerShape(server);
    if (!toolName) {
        return false;
    }

    if (normalizedServer.toolMode === MCP_TOOL_MODE_ALL) {
        return true;
    }

    return normalizedServer.selectedToolNames.includes(toolName);
};

export const getAllowedToolCount = (server) => {
    const normalizedServer = normalizeMcpServerShape(server);
    if (normalizedServer.toolMode === MCP_TOOL_MODE_ALL) {
        return normalizedServer.discoveredTools.length;
    }

    return normalizedServer.selectedToolNames.length;
};
