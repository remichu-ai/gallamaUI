import React from 'react';
import useChatStore from '../../store/chatStore.js';
import useUIStore from '../../store/uiStore.js';  // Import the UI store
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MarkdownText from "./MarkdownText.jsx";
import CodeBlock from "./CodeBlock.jsx";
import styles from './ArtifactViewer.module.css';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';  // Import the X icon
import { CopyButton } from './CopyButton';  // Import the CopyButton component

const ArtifactViewer = () => {
    const { getVisibleArtifact, artifactIds, visibleArtifactId, navigateArtifact } = useChatStore();
    const { showArtifact, toggleArtifact } = useUIStore();  // Get toggleArtifact function
    const visibleArtifact = getVisibleArtifact();

    if (!visibleArtifact) {
        return null;
    }

    const renderContent = () => {
        switch (visibleArtifact.artifact_type) {
            case 'code':
                return (
                    <div className={styles.scrollBarWrap}>
                        <CodeBlock code={visibleArtifact.content} language={visibleArtifact.language} />
                    </div>
                );
            case 'self_contained_text':
                return (
                    <div className={styles.scrollBarWrap}>
                        <div className={styles.markdownContent} >
                            <MarkdownText content={visibleArtifact.content} />
                        </div>
                    </div>
                );
            case 'image':
                // TODO to implement image viewing
                return (
                    <img
                        src={visibleArtifact.content}
                        alt={visibleArtifact.title}
                        className="max-w-full h-auto rounded-md"
                    />
                );
            default:
                console.error(`artifact type ${visibleArtifact.artifact_type} not supported`)
        }
    };

    const currentIndex = artifactIds.indexOf(visibleArtifactId) + 1;
    const totalArtifacts = artifactIds.length;

    return (
        <div className={styles.artifactBackground}>
            <div className={styles.topHeaderBar}>
                <h2>{visibleArtifact.title}</h2>
                <button className={styles.closeButton} onClick={toggleArtifact}>
                    <X size={20} />
                </button>
            </div>
            <div className={styles.content}>
                {renderContent()}
            </div>
            <div className={styles.bottomHeaderBar}>
                <div className={styles.navigationGroup}>
                    <button
                        onClick={() => navigateArtifact('previous')}
                        className={styles.navButton}
                        disabled={currentIndex === 1}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className={styles.artifactCounter}>
                        {currentIndex} / {totalArtifacts}
                    </span>
                    <button
                        onClick={() => navigateArtifact('next')}
                        className={styles.navButton}
                        disabled={currentIndex === totalArtifacts}
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
                <div className={styles.copyButtonWrapper}>
                    <CopyButton text={visibleArtifact.content} className={styles.copyButton} />
                </div>
            </div>
        </div>
    );
};

export default ArtifactViewer;
