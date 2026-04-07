import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import styles from './McpToolDrawer.module.css';

const McpControlsContent = lazy(() => import('../Mcp/McpControlsContent.jsx'));

const McpToolDrawer = () => {
    const {
        showMcpToolDrawer,
        toggleMcpToolDrawer,
    } = useUIStore();
    const [hasLoadedControls, setHasLoadedControls] = useState(showMcpToolDrawer);

    useEffect(() => {
        if (showMcpToolDrawer) {
            setHasLoadedControls(true);
        }
    }, [showMcpToolDrawer]);

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
                    {hasLoadedControls ? (
                        <Suspense fallback={<div className={styles.drawerPanelFallback} aria-hidden="true" />}>
                            <McpControlsContent variant="drawer" />
                        </Suspense>
                    ) : null}
                </div>
            </div>
        </aside>
    );
};

export default McpToolDrawer;
