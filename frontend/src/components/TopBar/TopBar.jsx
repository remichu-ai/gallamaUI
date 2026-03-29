import React from 'react';
import styles from './TopBar.module.css'
import QuickSettings from "./QuickSettings.jsx";
import useUIStore from "../../store/uiStore.js";

const TopBar = () => {
    const { sidebarExtended } = useUIStore();

    return (
        <div className={`${styles.topBar} ${sidebarExtended ? styles.sidebarOpen : ''}`}>
            <p className={styles.topBarText}>Gallama UI</p>
            <div className={styles.spacer}></div>
            <QuickSettings/>
        </div>
    )
}

export default TopBar;
