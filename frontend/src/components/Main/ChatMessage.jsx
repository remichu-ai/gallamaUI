import React, { useState, useEffect } from 'react';
import {assets} from "../../assets/assets.js";
import useChatStore from '../../store/chatStore.js';
import useUIStore from "../../store/uiStore.js";
import ArtifactButton from './ArtifactButton.jsx';
import MarkdownText from './MarkdownText.jsx';
import {ThinkingSection} from './ThinkingSection.jsx';
import {CopyButtonChat} from './CopyButtonChat';
import styles from './ChatMessage.module.css';

const ImageModal = ({ src, alt, isOpen, onClose, clickPosition }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen && clickPosition) {
            // Calculate position based on click coordinates and viewport size
            const img = new Image();
            img.src = src;

            img.onload = () => {
                const maxWidth = window.innerWidth * 0.8;
                const maxHeight = window.innerHeight * 0.8;

                // Calculate scaled dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = height * ratio;
                }

                if (height > maxHeight) {
                    const ratio = maxHeight / height;
                    height = maxHeight;
                    width = width * ratio;
                }

                // Calculate position
                let x = clickPosition.x - width / 2;
                let y = clickPosition.y - height / 2;

                // Ensure popup stays within viewport
                x = Math.max(20, Math.min(x, window.innerWidth - width - 20));
                y = Math.max(20, Math.min(y, window.innerHeight - height - 20));

                setPosition({ x, y });
            };
        }
    }, [isOpen, clickPosition, src]);

    if (!isOpen) return null;

    return (
        <>
            <div className={`modalOverlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
            <div
                className={`imageModal ${isOpen ? 'active' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <img src={src} alt={alt} className="modalImage" />
                <button className="closeButton" onClick={onClose}>×</button>
            </div>
        </>
    );
};


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

const ChatMessage = ({message}) => {
    const [modalImage, setModalImage] = useState({
        src: '',
        isOpen: false,
        clickPosition: null
    });

    const {setVisibleArtifactId} = useChatStore();
    const {showThinking} = useUIStore();

    const handleImageClick = (url, e) => {
        setModalImage({
            src: url,
            isOpen: true,
            clickPosition: {
                x: e.clientX,
                y: e.clientY
            }
        });
    };

    const renderMessageContent = (content) => {
        if (Array.isArray(content)) {
            return content.map((item, index) => {
                if (item.type === 'text') {
                    return (
                        <div className={styles.chatMessageContentMarkdownText} key={index}>
                            {message.role === 'assistant' ? (
                                <MarkdownText content={item.content}/>
                            ) : (
                                <span className={styles.preserveFormat}>
                                    {item.content}
                                </span>
                            )}
                        </div>
                    )
                } else if (item.type === 'image_url') {
                    return (
                        <div className={styles.chatMessageContentImage} key={index}>
                            <img
                                src={item.image_url.url}
                                alt="Uploaded content"
                                className={styles.messageImage}
                                onClick={(e) => handleImageClick(item.image_url.url, e)}
                            />
                        </div>
                    )
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
        <>
            <div className={styles.chatMessageContainer}>
                <div className={`${styles.roleIcon} ${getRoleIconCSS(message.role)}`}>
                    <img src={getIcon(message.role)} alt=""/>
                </div>
                <div className={styles.chatMessageWrapper}>
                    <div className={`${styles.chatMessageContent} ${getRoleCSS(message.role)}`}>
                        <ThinkingSection thinking={message.thinking} isContentLoading={isContentLoading}/>
                        {renderMessageContent(message.content)}
                    </div>
                    <CopyButtonChat text={copyText} className={styles.copyButton}/>
                </div>
            </div>
            <ImageModal
                src={modalImage.src}
                alt="Full size image"
                isOpen={modalImage.isOpen}
                clickPosition={modalImage.clickPosition}
                onClose={() => setModalImage({ src: '', isOpen: false, clickPosition: null })}
            />
        </>
    );
};

export default ChatMessage;