import React from 'react';
import { Code, FileText, Image } from 'lucide-react';
import useChatStore from "../../store/chatStore.js";
import styles from './ArtifactButton.module.css';
import useUIStore from "../../store/uiStore.js";

const ArtifactButton = ({ title, identifier, type }) => {
    const { setVisibleArtifactId } = useChatStore();

    const {
        toggleArtifactToTrue,
    } = useUIStore()

    const handleClick = () => {
        console.log(`Button clicked with identifier: ${identifier}`);
        setVisibleArtifactId(identifier);
        toggleArtifactToTrue();
    };

    const getIcon = () => {
        const iconColor = 'var(--artifact-button-icon-color)';
        const iconSize = 25;
        const iconProps = { size: iconSize, color: iconColor };

        switch (type) {
            case 'code':
                return <Code {...iconProps} />;
            case 'text':
                return <FileText {...iconProps} />;
            case 'image':
                return <Image {...iconProps} />;
            default:
                return <FileText {...iconProps} />;
        }
    };

    return (
        <button
            onClick={handleClick}
            className={styles.artifactButtonContainer}
        >
            <div className={styles.buttonContent}>
                <div className={styles.artifactIconContainer}>
                    {getIcon()}
                </div>
                <div className={styles.textContainer}>
                    <span className={styles.artifactTitle}>{title}</span>
                    <span className={styles.artifactSubtext}>Click to open {type}</span>
                </div>
            </div>
        </button>
    );
};

export default ArtifactButton;
