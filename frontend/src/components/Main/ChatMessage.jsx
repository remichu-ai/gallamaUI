import React from 'react';
import { assets } from "../../assets/assets.js";
import useChatStore from '../../store/chatStore.js';
import useUIStore from "../../store/uiStore.js";
import ArtifactButton from './ArtifactButton.jsx';
import MarkdownText from './MarkdownText.jsx';
import { ThinkingSection } from './ThinkingSection.jsx';
import { CopyButtonChat } from './CopyButtonChat';
import styles from './ChatMessage.module.css';

const getIcon = (role) => {
    switch (role) {
        case 'user':
            return assets.logan_icon;
        case 'assistant':
            return assets.assistant_icon;
        default:
            return null;
    }
};

const getRoleCSS = (role) => {
    switch (role) {
        case 'user':
            return styles.chatMessageContentUser;
        case 'assistant':
            return styles.chatMessageContentAssistant;
        default:
            return '';
    }
};

const getRoleIconCSS = (role) => {
    switch (role) {
        case 'user':
            return styles.roleIconUser;
        case 'assistant':
            return styles.roleIconAssistant;
        default:
            return '';
    }
};

const ChatMessage = ({ message }) => {
    const { setVisibleArtifactId } = useChatStore();
    const { showThinking } = useUIStore();

    const renderMessageContent = (content) => {
        if (Array.isArray(content)) {
            return content.map((item, index) => {
                if (item.type === 'text') {
                    return (
                        <div className={styles.chatMessageContentMarkdownText} key={index}>
                            {message.role === 'assistant' ? (
                                <MarkdownText content={item.content} />
                            ) : (
                                <span className={styles.preserveFormat}>
                                    {item.content}
                                </span>
                            )}
                        </div>
                    );
                } else if (item.type === 'artifact') {
                    const artifact = message.artifacts[item.identifier];
                    return (
                        <div className={styles.chatMessageContentArtifactButton} key={index}>
                            <ArtifactButton
                                key={item.identifier}
                                title={artifact.title}
                                identifier={item.identifier}
                                type={artifact.artifact_type}
                                onClick={() => setVisibleArtifactId(item.identifier)}
                            />
                        </div>
                    );
                }
                return null;
            });
        }
        return null;
    };

    const isContentLoading = !message.content || !Array.isArray(message.content) || message.content.length === 0;

    // Check if message.content is an array before mapping
    const copyText = Array.isArray(message.content)
        ? message.content.map(item => item.content).join(' ')
        : '';

    return (
        <div className={styles.chatMessageContainer}>
            <div className={`${styles.roleIcon} ${getRoleIconCSS(message.role)}`}>
                <img src={getIcon(message.role)} alt="" />
            </div>
            <div className={styles.chatMessageWrapper}>
                <div className={`${styles.chatMessageContent} ${getRoleCSS(message.role)}`}>
                    <ThinkingSection thinking={message.thinking} isContentLoading={isContentLoading} />
                    {renderMessageContent(message.content)}
                    {/* Add the Copy Button here */}
                </div>
                <CopyButtonChat text={copyText} className={styles.copyButton} />
            </div>
        </div>
    );
};

export default ChatMessage;
