import React from 'react';
import { ChevronLeft, ChevronRight, Settings2, Wrench } from 'lucide-react';
import useChatSettingStore from '../../store/chatSettingStore';
import useUIStore from '../../store/uiStore';
import McpServerToolPanel from '../Mcp/McpServerToolPanel.jsx';
import styles from './McpToolDrawer.module.css';

const McpToolDrawer = () => {
    const {
        useMcp,
        setUseMcp,
        mcpServers,
        updateMcpServer,
    } = useChatSettingStore();

    const {
        showMcpToolDrawer,
        toggleMcpToolDrawer,
    } = useUIStore();

    const configuredServers = mcpServers.filter((server) =>
        server.name.trim() || server.url.trim() || (server.discoveredTools?.length ?? 0) > 0
    );

    const enabledServers = configuredServers.filter((server) => server.enabled !== false);

    return (
        <aside className={`${styles.drawerShell} ${showMcpToolDrawer ? styles.open : styles.closed}`}>
            <div className={styles.drawerFrame}>
                <button
                    type="button"
                    onClick={toggleMcpToolDrawer}
                    className={styles.drawerTab}
                    aria-label={showMcpToolDrawer ? 'Hide MCP tool drawer' : 'Show MCP tool drawer'}
                >
                    {showMcpToolDrawer ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    <span>MCP</span>
                </button>

                <div className={styles.drawerPanel}>
                    <div className={styles.drawerHeader}>
                        <div>
                            <div className={styles.drawerEyebrow}>Tool access</div>
                            <h3 className={styles.drawerTitle}>MCP Controls</h3>
                        </div>
                        <label className={styles.switchRow}>
                            <span className={styles.switchCopy}>
                                <strong>Enable MCP</strong>
                                <span className={styles.switchHint}>
                                    {enabledServers.length} active server{enabledServers.length === 1 ? '' : 's'}
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
                    </div>

                    <div className={styles.drawerBody}>
                        {configuredServers.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Settings2 size={18} />
                                <div>
                                    <strong>No MCP servers yet.</strong>
                                    <p>Add a server in Settings, then its discovered tools will appear here for quick on/off control.</p>
                                </div>
                            </div>
                        ) : (
                            configuredServers.map((server, index) => {
                                const displayName = server.name.trim() || `MCP Server ${index + 1}`;
                                const toolCount = server.discoveredTools?.length ?? 0;

                                return (
                                    <section key={server.id} className={styles.serverCard}>
                                        <div className={styles.serverHeader}>
                                            <div className={styles.serverIdentity}>
                                                <div className={styles.serverTitleRow}>
                                                    <Wrench size={15} />
                                                    <strong>{displayName}</strong>
                                                </div>
                                                <div className={styles.serverMeta}>
                                                    {toolCount > 0 ? `${toolCount} discovered tool${toolCount === 1 ? '' : 's'}` : 'No tool list synced yet'}
                                                </div>
                                            </div>
                                            <span className={styles.switch}>
                                                <input
                                                    type="checkbox"
                                                    checked={server.enabled !== false}
                                                    onChange={(event) => updateMcpServer(server.id, 'enabled', event.target.checked)}
                                                    aria-label={`Toggle ${displayName}`}
                                                />
                                                <span className={styles.switchTrack} />
                                            </span>
                                        </div>

                                        <div className={styles.serverUrl}>{server.url.trim() || 'No URL configured yet'}</div>
                                        <McpServerToolPanel server={server} compact />
                                    </section>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default McpToolDrawer;
