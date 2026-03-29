import React, { useState } from 'react';
import { ChevronRight, RefreshCcw, Wrench } from 'lucide-react';
import useChatSettingStore from '../../store/chatSettingStore';
import { discoverMcpTools } from '../../services/mcpDiscovery.js';
import {
    MCP_TOOL_MODE_ALL,
    getAllowedToolCount,
    isToolAllowedForServer,
} from '../../services/mcpUtils.js';
import styles from './McpServerToolPanel.module.css';

const formatLastSynced = (value) => {
    if (!value) {
        return 'Not synced yet';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not synced yet';
    }

    return `Synced ${date.toLocaleString()}`;
};

const McpServerToolPanel = ({ server, compact = false }) => {
    const [expandedDescriptions, setExpandedDescriptions] = useState(() => new Set());
    const {
        setMcpServerDiscoveryState,
        setMcpServerDiscoveredTools,
        setMcpServerToolMode,
        toggleMcpServerTool,
    } = useChatSettingStore();

    const tools = server.discoveredTools ?? [];
    const isLoading = server.discoveryStatus === 'loading';
    const allowAll = server.toolMode !== 'custom';
    const allowedCount = getAllowedToolCount(server);

    const toggleDescription = (toolName) => {
        setExpandedDescriptions((previous) => {
            const next = new Set(previous);
            if (next.has(toolName)) {
                next.delete(toolName);
            } else {
                next.add(toolName);
            }
            return next;
        });
    };

    const handleDiscover = async () => {
        if (!server.url.trim()) {
            setMcpServerDiscoveryState(server.id, 'error', 'Enter a server URL before syncing tools.');
            return;
        }

        setMcpServerDiscoveryState(server.id, 'loading', '');

        try {
            const result = await discoverMcpTools(server);
            setMcpServerDiscoveredTools(server.id, result.tools);
        } catch (error) {
            setMcpServerDiscoveryState(server.id, 'error', error.message);
        }
    };

    return (
        <div className={`${styles.panel} ${compact ? styles.compact : ''}`}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <span className={styles.headerLabel}>Discovered tools</span>
                    <span className={styles.headerMeta}>
                        {tools.length > 0 ? `${allowedCount}/${tools.length} allowed` : 'No tools synced'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleDiscover}
                    disabled={isLoading}
                    className={styles.refreshButton}
                >
                    <RefreshCcw size={15} className={isLoading ? styles.spinning : ''} />
                    {isLoading ? 'Syncing' : tools.length > 0 ? 'Refresh' : 'Discover'}
                </button>
            </div>

            <div className={styles.statusRow}>
                <span className={`${styles.statusPill} ${styles[`status_${server.discoveryStatus}`] || ''}`}>
                    {server.discoveryStatus === 'loading' && 'Syncing tool list'}
                    {server.discoveryStatus === 'ready' && 'Tool list ready'}
                    {server.discoveryStatus === 'error' && 'Sync failed'}
                    {server.discoveryStatus === 'stale' && 'Tool list may be outdated'}
                    {server.discoveryStatus === 'idle' && 'Ready to discover'}
                </span>
                <span className={styles.statusMeta}>{formatLastSynced(server.lastDiscoveredAt)}</span>
            </div>

            {server.discoveryError && (
                <div className={styles.errorText}>{server.discoveryError}</div>
            )}

            {tools.length > 0 ? (
                <>
                    <label className={styles.allowAllRow}>
                        <span className={styles.allowAllLabel}>
                            <strong>Allow all tools</strong>
                        </span>
                        <span className={styles.allowAllSwitch}>
                            <input
                                type="checkbox"
                                checked={allowAll}
                                onChange={(event) => setMcpServerToolMode(
                                    server.id,
                                    event.target.checked ? MCP_TOOL_MODE_ALL : 'custom'
                                )}
                            />
                            <span className={styles.allowAllSwitchTrack} />
                        </span>
                    </label>

                    <div className={styles.toolList}>
                        {tools.map((tool) => {
                            const isExpanded = expandedDescriptions.has(tool.name);
                            const description = tool.description || 'No description provided by the server.';

                            return (
                                <div key={tool.name} className={styles.toolRow}>
                                    <span className={styles.toolHeader}>
                                        <span className={styles.toolNameLine}>
                                            <Wrench size={14} className={styles.toolIcon} />
                                            <strong>{tool.name}</strong>
                                        </span>
                                    </span>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={isToolAllowedForServer(server, tool.name)}
                                            onChange={() => toggleMcpServerTool(server.id, tool.name)}
                                            aria-label={`Toggle ${tool.name}`}
                                        />
                                        <span className={styles.switchTrack} />
                                    </label>
                                    <div className={styles.toolDescriptionRow}>
                                        <button
                                            type="button"
                                            className={styles.descriptionToggle}
                                            onClick={() => toggleDescription(tool.name)}
                                            aria-expanded={isExpanded}
                                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} description for ${tool.name}`}
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                        <span className={`${styles.toolDescription} ${isExpanded ? styles.toolDescriptionExpanded : ''}`}>
                                            {description}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className={styles.emptyState}>
                    Sync this server to pull its `tools/list` output, then you can allow or block each tool individually.
                </div>
            )}
        </div>
    );
};

export default McpServerToolPanel;
