import React from 'react';
import useChatSettingStore from '../../store/chatSettingStore';
import useUIStore from '../../store/uiStore';
import styles from './QuickSettings.module.css';

const QuickSettings = () => {
    const {
        useArtifact,
        toggleUseArtifact,
        useThinking,
        toggleUseThinking
    } = useChatSettingStore();

    const {
        showThinking,
        toggleShowThinking
    } = useUIStore();

    return (
        <div className={styles.quickSettings}>
            <label className={styles.quickSettingsLabel}>
                <input
                    type="checkbox"
                    checked={useArtifact}
                    onChange={toggleUseArtifact}
                    className={styles.quickSettingsCheckbox}
                />
                Use Artifact
            </label>
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
                    checked={showThinking}
                    onChange={toggleShowThinking}
                    className={styles.quickSettingsCheckbox}
                />
                Show Thinking
            </label>
        </div>
    );
};

export default QuickSettings;