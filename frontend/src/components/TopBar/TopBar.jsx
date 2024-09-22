import React from 'react';
import styles from './TopBar.module.css'
import QuickSettings from "./QuickSettings.jsx";

const TopBar = () => {
    return (
        <div className={styles.topBar}>
            <p className={styles.topBarText}>Gallama UI</p>
            <div className={styles.spacer}></div>
            <QuickSettings/>
        </div>
    )
}

export default TopBar;