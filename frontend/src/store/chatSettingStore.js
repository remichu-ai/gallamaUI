import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    MCP_TOOL_MODE_ALL,
    MCP_TOOL_MODE_CUSTOM,
    normalizeDiscoveredTools,
    normalizeMcpServerShape,
} from '../services/mcpUtils.js';

const createMcpServer = () => normalizeMcpServerShape({});

const markServerDiscoveryStale = (server) => ({
    ...server,
    discoveryStatus: server.discoveredTools.length > 0 ? 'stale' : 'idle',
    discoveryError: '',
});

const useChatSettingStore = create(
    persist(
        (set) => ({
            useThinking: true,
            toggleUseThinking: () => set((state) => ({ useThinking: !state.useThinking })),
            temperature: 0.8,
            setTemperature: (newTemperature) => set({ temperature: newTemperature }),
            topP: 0.95,
            setTopP: (newTopP) => set({ topP: newTopP }),
            modelList: ["default", "gpt-3.5-turbo", "gpt-4"],
            selectedModel: "default",
            setSelectedModel: (newModel) => set({ selectedModel: newModel }),
            systemPrompt: '',
            setSystemPrompt: (newSystemPrompt) => set({ systemPrompt: newSystemPrompt }),

            // XML template selection from external file
            selectedTemplate: '',
            setSelectedTemplate: (template) => set({ selectedTemplate: template }),

            useMcp: false,
            setUseMcp: (value) => set({ useMcp: Boolean(value) }),
            toggleUseMcp: () => set((state) => ({ useMcp: !state.useMcp })),
            mcpServers: [],
            addMcpServer: () => set((state) => ({
                mcpServers: [...state.mcpServers, createMcpServer()],
            })),
            removeMcpServer: (serverId) => set((state) => ({
                mcpServers: state.mcpServers.filter((server) => server.id !== serverId),
            })),
            updateMcpServer: (serverId, field, value) => set((state) => ({
                mcpServers: state.mcpServers.map((server) =>
                    server.id === serverId
                        ? (() => {
                            const nextServer = normalizeMcpServerShape({ ...server, [field]: value });
                            if (['url', 'authorizationToken', 'headersText'].includes(field)) {
                                return markServerDiscoveryStale(nextServer);
                            }

                            return nextServer;
                        })()
                        : server
                ),
            })),
            setMcpServerDiscoveryState: (serverId, discoveryStatus, discoveryError = '') => set((state) => ({
                mcpServers: state.mcpServers.map((server) =>
                    server.id === serverId
                        ? {
                            ...server,
                            discoveryStatus,
                            discoveryError,
                        }
                        : server
                ),
            })),
            setMcpServerDiscoveredTools: (serverId, discoveredTools) => set((state) => ({
                mcpServers: state.mcpServers.map((server) => {
                    if (server.id !== serverId) {
                        return server;
                    }

                    const nextDiscoveredTools = normalizeDiscoveredTools(discoveredTools);
                    const nextDiscoveredToolNames = new Set(nextDiscoveredTools.map((tool) => tool.name));
                    const selectedToolNames = server.selectedToolNames.filter((toolName) => nextDiscoveredToolNames.has(toolName));

                    return normalizeMcpServerShape({
                        ...server,
                        discoveredTools: nextDiscoveredTools,
                        selectedToolNames,
                        discoveryStatus: 'ready',
                        discoveryError: '',
                        lastDiscoveredAt: new Date().toISOString(),
                    });
                }),
            })),
            setMcpServerToolMode: (serverId, toolMode) => set((state) => ({
                mcpServers: state.mcpServers.map((server) =>
                    server.id === serverId
                        ? normalizeMcpServerShape({
                            ...server,
                            toolMode,
                            selectedToolNames: toolMode === MCP_TOOL_MODE_ALL
                                ? []
                                : server.discoveredTools.map((tool) => tool.name),
                        })
                        : server
                ),
            })),
            toggleMcpServerTool: (serverId, toolName) => set((state) => ({
                mcpServers: state.mcpServers.map((server) => {
                    if (server.id !== serverId || !toolName) {
                        return server;
                    }

                    const allToolNames = server.discoveredTools.map((tool) => tool.name);
                    const normalizedSelection = server.toolMode === MCP_TOOL_MODE_ALL
                        ? allToolNames
                        : server.selectedToolNames;

                    const selectedToolNames = normalizedSelection.includes(toolName)
                        ? normalizedSelection.filter((name) => name !== toolName)
                        : [...normalizedSelection, toolName];

                    const nextToolMode = selectedToolNames.length === allToolNames.length && allToolNames.length > 0
                        ? MCP_TOOL_MODE_ALL
                        : MCP_TOOL_MODE_CUSTOM;

                    return normalizeMcpServerShape({
                        ...server,
                        toolMode: nextToolMode,
                        selectedToolNames: nextToolMode === MCP_TOOL_MODE_ALL ? [] : selectedToolNames,
                    });
                }),
            })),

            // Image resize settings
            maxImageWidth: 1024,
            setMaxImageWidth: (width) => set({ maxImageWidth: width }),
            maxImageHeight: 1024,
            setMaxImageHeight: (height) => set({ maxImageHeight: height }),
            saveSettings: () => {},
        }),
        {
            name: 'chat-settings-storage', // Name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            version: 2,
            migrate: (persistedState) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return persistedState;
                }

                return {
                    ...persistedState,
                    mcpServers: Array.isArray(persistedState.mcpServers)
                        ? persistedState.mcpServers.map((server) => normalizeMcpServerShape(server))
                        : [],
                };
            },
        }
    )
);

export default useChatSettingStore;
