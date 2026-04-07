import React, { useEffect, useState } from 'react';
import { ChevronDown, Plus, Settings2, Trash2 } from 'lucide-react';
import useChatSettingStore from '../../store/chatSettingStore';
import McpServerToolPanel from './McpServerToolPanel.jsx';
import useMcpServerDiscoverability from './useMcpServerDiscoverability.js';
import {
    getAllowedToolCount,
    isToolAllowedForServer,
} from '../../services/mcpUtils.js';
import styles from './McpControlsContent.module.css';

const getServerState = (server) => {
    if (server.discoveryStatus === 'loading') {
        return {
            label: 'Checking',
            className: styles.serverStateLoading,
        };
    }

    if (server.discoveryStatus === 'error') {
        return {
            label: 'Offline',
            className: styles.serverStateOffline,
        };
    }

    if (server.enabled === false) {
        return {
            label: 'Disabled',
            className: styles.serverStateDisabled,
        };
    }

    return {
        label: 'Online',
        className: styles.serverStateOnline,
    };
};

const McpControlsContent = ({ variant = 'drawer' }) => {
    const {
        useMcp,
        setUseMcp,
        mcpServers,
        addMcpServer,
        removeMcpServer,
        updateMcpServer,
        setMcpServerDiscoveryState,
        setMcpServerDiscoveredTools,
        toggleMcpServerTool,
    } = useChatSettingStore();

    const configuredServers = mcpServers.filter((server) =>
        server.name.trim() || server.url.trim() || (server.discoveredTools?.length ?? 0) > 0
    );
    const showServerEditor = variant === 'sidebar';
    const serversToRender = showServerEditor ? mcpServers : configuredServers;
    const [collapsedServerIds, setCollapsedServerIds] = useState(() => new Set());
    const serverIdsSignature = serversToRender.map((server) => server.id).join('|');

    const enabledServers = configuredServers.filter((server) => server.enabled !== false);
    const hasEnabledServers = enabledServers.length > 0;
    const { handleMcpServerEnabledChange } = useMcpServerDiscoverability({
        mcpServers,
        setMcpServerDiscoveryState,
        setMcpServerDiscoveredTools,
        updateMcpServer,
    });

    useEffect(() => {
        if (showServerEditor) {
            return;
        }

        setCollapsedServerIds((previous) => {
            const next = new Set();
            const hasExistingState = previous.size > 0;

            serversToRender.forEach((server) => {
                if (!hasExistingState || previous.has(server.id)) {
                    next.add(server.id);
                }
            });

            if (next.size === previous.size && [...next].every((serverId) => previous.has(serverId))) {
                return previous;
            }

            return next;
        });
    }, [serverIdsSignature, showServerEditor]);

    const toggleServerCollapse = (serverId) => {
        if (showServerEditor) {
            return;
        }

        setCollapsedServerIds((previous) => {
            const next = new Set(previous);
            if (next.has(serverId)) {
                next.delete(serverId);
            } else {
                next.add(serverId);
            }
            return next;
        });
    };

    return (
        <div className={`${styles.content} ${variant === 'sidebar' ? styles.sidebarVariant : styles.drawerVariant}`}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <div className={styles.eyebrow}>Tool access</div>
                        <h3 className={styles.title}>MCP Controls</h3>
                    </div>
                    {showServerEditor && (
                        <button type="button" className={styles.secondaryButton} onClick={addMcpServer}>
                            <Plus size={15} />
                            Add Server
                        </button>
                    )}
                </div>
                <label className={styles.switchRow}>
                    <span className={styles.switchCopy}>
                        <strong>Enable MCP</strong>
                        <span className={styles.switchHint}>
                            {useMcp
                                ? `${enabledServers.length} active server${enabledServers.length === 1 ? '' : 's'} will be sent with requests`
                                : (
                                    hasEnabledServers
                                        ? `${enabledServers.length} active server${enabledServers.length === 1 ? '' : 's'} configured, but MCP is off for requests`
                                        : 'Turn this on to include MCP servers in requests'
                                )}
                        </span>
                    </span>
                    <span className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={useMcp}
                            onChange={(event) => setUseMcp(event.target.checked)}
                        />
                        <span className={styles.switchTrack} />
                    </span>
                </label>
                {!useMcp && hasEnabledServers && (
                    <div className={styles.globalNotice} role="status">
                        MCP is disabled globally. Online servers below will not be sent to your LLM until this toggle is on.
                    </div>
                )}
            </div>

            <div className={styles.body}>
                {serversToRender.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Settings2 size={18} />
                        <div>
                            <strong>No MCP servers yet.</strong>
                            <p>
                                {showServerEditor
                                    ? 'Add a server here, then sync its tools for mobile use.'
                                    : 'Add a server in Settings, then its discovered tools will appear here for quick on/off control.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    serversToRender.map((server, index) => {
                        const displayName = server.name.trim() || `MCP Server ${index + 1}`;
                        const discoveredTools = server.discoveredTools ?? [];
                        const toolCount = discoveredTools.length;
                        const serverState = getServerState(server);
                        const isCollapsed = !showServerEditor && collapsedServerIds.has(server.id);
                        const areCollapsedToolControlsDisabled = server.discoveryStatus === 'loading'
                            || server.discoveryStatus === 'error'
                            || server.enabled === false;
                        const visibleAllowedCount = toolCount > 0 ? getAllowedToolCount(server) : 0;
                        const visibleCollapsedTools = discoveredTools.slice(0, 4);
                        const panelId = `mcp-drawer-server-${server.id}`;

                        return (
                            <section
                                key={server.id}
                                className={`${styles.serverCard} ${isCollapsed ? styles.serverCardCollapsed : ''}`}
                            >
                                <div className={styles.serverHeader}>
                                    <div className={styles.serverHeaderMain}>
                                        {!showServerEditor && (
                                            <button
                                                type="button"
                                                className={styles.collapseButton}
                                                onClick={() => toggleServerCollapse(server.id)}
                                                aria-expanded={!isCollapsed}
                                                aria-controls={panelId}
                                                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${displayName}`}
                                            >
                                                <ChevronDown
                                                    size={16}
                                                    className={`${styles.collapseChevron} ${isCollapsed ? styles.collapseChevronCollapsed : ''}`}
                                                />
                                            </button>
                                        )}
                                        <div className={styles.serverTitleGroup}>
                                            <div className={styles.serverTitleLine}>
                                                <strong className={styles.serverTitle}>{displayName}</strong>
                                                <span className={`${styles.serverState} ${serverState.className}`}>
                                                    <span className={styles.serverStateDot} />
                                                    {serverState.label}
                                                </span>
                                            </div>
                                            <div className={styles.serverMeta}>
                                                {toolCount > 0
                                                    ? `${toolCount} discovered tool${toolCount === 1 ? '' : 's'}`
                                                    : 'No tool list synced yet'}
                                            </div>
                                        </div>
                                    </div>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={server.enabled !== false}
                                            onChange={(event) => handleMcpServerEnabledChange(server, event.target.checked)}
                                            aria-label={`Toggle ${displayName}`}
                                            disabled={server.discoveryStatus === 'loading'}
                                        />
                                        <span className={styles.switchTrack} />
                                    </label>
                                </div>

                                {showServerEditor && (
                                    <>
                                        <div className={styles.serverEditorGrid}>
                                            <label className={styles.fieldLabel}>
                                                Server Name
                                                <input
                                                    type="text"
                                                    value={server.name}
                                                    onChange={(event) => updateMcpServer(server.id, 'name', event.target.value)}
                                                    className={styles.textInput}
                                                    placeholder="dummy_mcp"
                                                />
                                            </label>

                                            <label className={styles.fieldLabel}>
                                                Server URL
                                                <input
                                                    type="text"
                                                    value={server.url}
                                                    onChange={(event) => updateMcpServer(server.id, 'url', event.target.value)}
                                                    className={styles.textInput}
                                                    placeholder="http://127.0.0.1:18001/mcp"
                                                />
                                            </label>
                                        </div>

                                        <label className={styles.fieldLabel}>
                                            Authorization Token
                                            <input
                                                type="password"
                                                value={server.authorizationToken}
                                                onChange={(event) => updateMcpServer(server.id, 'authorizationToken', event.target.value)}
                                                className={styles.textInput}
                                                placeholder="Optional bearer token"
                                            />
                                        </label>

                                        <label className={styles.fieldLabel}>
                                            Headers JSON
                                            <textarea
                                                value={server.headersText}
                                                onChange={(event) => updateMcpServer(server.id, 'headersText', event.target.value)}
                                                rows={3}
                                                className={styles.textArea}
                                                placeholder='{"x-custom-header":"value"}'
                                            />
                                        </label>

                                        <div className={styles.serverActions}>
                                            <div className={styles.sectionCopy}>
                                                Sync tools after changing the URL or headers.
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.removeButton}
                                                onClick={() => removeMcpServer(server.id)}
                                            >
                                                <Trash2 size={15} />
                                                Remove
                                            </button>
                                        </div>
                                    </>
                                )}

                                {isCollapsed ? (
                                    <div id={panelId} className={styles.conciseSummary}>
                                        <div className={styles.conciseSummaryTop}>
                                            <span className={styles.conciseSummaryLabel}>Tools</span>
                                            <span className={styles.conciseSummaryMeta}>
                                                {toolCount > 0 ? `${visibleAllowedCount}/${toolCount} allowed` : 'No tools synced'}
                                            </span>
                                        </div>
                                        <div className={styles.conciseSummaryContent}>
                                            {toolCount > 0 ? (
                                                <div className={styles.conciseToolList}>
                                                    {visibleCollapsedTools.map((tool) => {
                                                        const isEnabled = isToolAllowedForServer(server, tool.name);

                                                        return (
                                                            <button
                                                                key={tool.name}
                                                                type="button"
                                                                className={`${styles.conciseToolChip} ${isEnabled ? styles.conciseToolChipEnabled : styles.conciseToolChipDisabled} ${areCollapsedToolControlsDisabled ? styles.conciseToolChipReadOnly : ''}`}
                                                                onClick={() => toggleMcpServerTool(server.id, tool.name)}
                                                                aria-pressed={isEnabled}
                                                                aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${tool.name} for ${displayName}`}
                                                                disabled={areCollapsedToolControlsDisabled}
                                                                title={isEnabled ? 'Click to disable tool' : 'Click to enable tool'}
                                                            >
                                                                {tool.name}
                                                            </button>
                                                        );
                                                    })}
                                                    {toolCount > visibleCollapsedTools.length && (
                                                        <span
                                                            className={`${styles.conciseToolChip} ${styles.conciseToolChipMuted} ${areCollapsedToolControlsDisabled ? styles.conciseToolChipReadOnly : ''}`}
                                                        >
                                                            +{toolCount - visibleCollapsedTools.length} more
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={styles.conciseSummaryEmpty}>
                                                    {server.discoveryStatus === 'loading'
                                                        ? 'Checking tools...'
                                                        : server.discoveryStatus === 'error'
                                                            ? 'Server offline'
                                                            : 'No tools synced'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div id={panelId} className={styles.serverExpandedBody}>
                                        <div className={styles.serverUrl}>{server.url.trim() || 'No URL configured yet'}</div>
                                        <McpServerToolPanel server={server} compact={variant === 'drawer'} variant={variant} />
                                    </div>
                                )}
                            </section>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default McpControlsContent;
