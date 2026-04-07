import { useCallback, useEffect, useRef } from 'react';
import useChatSettingStore from '../../store/chatSettingStore';
import { discoverMcpTools } from '../../services/mcpDiscovery.js';

const getMcpServerDiscoveryKey = (server) => JSON.stringify({
    name: server?.name?.trim() || '',
    url: server?.url?.trim() || '',
    authorizationToken: server?.authorizationToken?.trim() || '',
    headersText: server?.headersText?.trim() || '',
});

const useMcpServerDiscoverability = ({
    mcpServers,
    setMcpServerDiscoveryState,
    setMcpServerDiscoveredTools,
    updateMcpServer,
}) => {
    const checkedMcpDiscoveryKeysRef = useRef(new Map());
    const pendingMcpDiscoveryChecksRef = useRef(new Set());

    const verifyMcpServerDiscoverability = useCallback(async (serverId) => {
        const currentServer = useChatSettingStore.getState().mcpServers.find((server) => server.id === serverId);
        if (!currentServer || pendingMcpDiscoveryChecksRef.current.has(serverId)) {
            return;
        }

        const discoveryKey = getMcpServerDiscoveryKey(currentServer);
        pendingMcpDiscoveryChecksRef.current.add(serverId);
        setMcpServerDiscoveryState(serverId, 'loading', '');

        try {
            const result = await discoverMcpTools(currentServer);
            const latestServer = useChatSettingStore.getState().mcpServers.find((server) => server.id === serverId);
            if (!latestServer || getMcpServerDiscoveryKey(latestServer) !== discoveryKey) {
                return;
            }

            checkedMcpDiscoveryKeysRef.current.set(serverId, discoveryKey);
            setMcpServerDiscoveredTools(serverId, result.tools);
        } catch (error) {
            const latestServer = useChatSettingStore.getState().mcpServers.find((server) => server.id === serverId);
            if (!latestServer || getMcpServerDiscoveryKey(latestServer) !== discoveryKey) {
                return;
            }

            checkedMcpDiscoveryKeysRef.current.set(serverId, discoveryKey);
            setMcpServerDiscoveryState(
                serverId,
                'error',
                error?.message || 'This MCP server appears to be offline.'
            );
            updateMcpServer(serverId, 'enabled', false);
        } finally {
            pendingMcpDiscoveryChecksRef.current.delete(serverId);
        }
    }, [setMcpServerDiscoveredTools, setMcpServerDiscoveryState, updateMcpServer]);

    useEffect(() => {
        mcpServers.forEach((server) => {
            if (!server.enabled || !server.url.trim()) {
                return;
            }

            const discoveryKey = getMcpServerDiscoveryKey(server);
            if (checkedMcpDiscoveryKeysRef.current.get(server.id) === discoveryKey) {
                return;
            }

            if (pendingMcpDiscoveryChecksRef.current.has(server.id)) {
                return;
            }

            void verifyMcpServerDiscoverability(server.id);
        });
    }, [mcpServers, verifyMcpServerDiscoverability]);

    const handleMcpServerEnabledChange = useCallback((server, nextEnabled) => {
        if (!nextEnabled) {
            updateMcpServer(server.id, 'enabled', false);
            return;
        }

        if (!server.url.trim()) {
            setMcpServerDiscoveryState(server.id, 'error', 'Enter a server URL before enabling this MCP server.');
            updateMcpServer(server.id, 'enabled', false);
            return;
        }

        checkedMcpDiscoveryKeysRef.current.delete(server.id);
        updateMcpServer(server.id, 'enabled', true);
    }, [setMcpServerDiscoveryState, updateMcpServer]);

    return {
        handleMcpServerEnabledChange,
        verifyMcpServerDiscoverability,
    };
};

export default useMcpServerDiscoverability;
