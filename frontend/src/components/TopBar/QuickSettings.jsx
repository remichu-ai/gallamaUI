import React from 'react';
import useChatSettingStore from '../../store/chatSettingStore';
import useUIStore from '../../store/uiStore';
import styles from './QuickSettings.module.css';

const QuickSettings = () => {
    const {
        useThinking,
        toggleUseThinking
    } = useChatSettingStore();

    const {
        showReasoning,
        toggleShowReasoning
    } = useUIStore();

    return (
        <div className={styles.quickSettings}>
            <label className={styles.quickSettingsLabel}>
                <input
                    type="checkbox"
                    checked={useThinking}
                    onChange={toggleUseThinking}
                    className={styles.quickSettingsCheckbox}
                />
                Use Thinking
            </label>
            <label className={styles.quickSettingsLabel}>
                <input
                    type="checkbox"
                    checked={showReasoning}
                    onChange={toggleShowReasoning}
                    className={styles.quickSettingsCheckbox}
                />
                Show Thinking
            </label>
        </div>
    );
};

export default QuickSettings;
