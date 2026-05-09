import React, { useEffect, useLayoutEffect, useRef } from 'react';
import useChatStore from '../../store/chatStore.js'; // Import your Zustand store
import ChatMessage from './ChatMessage.jsx'
import styles from './ChatMessageList.module.css'

const AUTO_SCROLL_THRESHOLD_PX = 48;

const ChatMessageList = () => {
    const { messages } = useChatStore();
    const chatContainerRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const previousMessageCountRef = useRef(messages.length);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) {
            return undefined;
        }

        const updateAutoScrollPreference = () => {
            const distanceFromBottom = (
                container.scrollHeight
                - container.scrollTop
                - container.clientHeight
            );

            shouldAutoScrollRef.current = distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
        };

        updateAutoScrollPreference();
        container.addEventListener('scroll', updateAutoScrollPreference, { passive: true });

        return () => {
            container.removeEventListener('scroll', updateAutoScrollPreference);
        };
    }, []);

    useLayoutEffect(() => {
        const container = chatContainerRef.current;
        if (!container) {
            previousMessageCountRef.current = messages.length;
            return;
        }

        const hasNewMessage = messages.length > previousMessageCountRef.current;

        if (hasNewMessage || shouldAutoScrollRef.current) {
            container.scrollTop = container.scrollHeight;
        }

        previousMessageCountRef.current = messages.length;
    }, [messages]);

    return (
        <div className={styles.chatMessageList} ref={chatContainerRef}>
            {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
        </div>
    );
};

export default ChatMessageList;
