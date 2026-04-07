import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import styles from './TopBar.module.css'
import QuickSettings from "./QuickSettings.jsx";
import useUIStore from "../../store/uiStore.js";

const TopBar = () => {
    const {
        sidebarExtended,
        setSidebarExtended,
        isMobileViewport,
        showSettingPage,
        showModelManagementPage,
    } = useUIStore();

    const shouldShowQuickSettings = !isMobileViewport || (!showSettingPage && !showModelManagementPage);

    return (
        <div className={`${styles.topBar} ${sidebarExtended ? styles.sidebarOpen : ''} ${isMobileViewport ? styles.mobileLayout : ''}`}>
            {isMobileViewport && (
                <button
                    type="button"
                    className={styles.mobileMenuButton}
                    onClick={() => setSidebarExtended()}
                    aria-label={sidebarExtended ? 'Close sidebar' : 'Open sidebar'}
                >
                    {sidebarExtended ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>
            )}
            <p className={styles.topBarText}>Gallama UI</p>
            <div className={styles.spacer}></div>
            {shouldShowQuickSettings && <QuickSettings/>}
        </div>
    )
}

export default TopBar;
