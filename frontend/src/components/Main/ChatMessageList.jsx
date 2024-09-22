import React, { useEffect, useRef } from 'react';
import useChatStore from '../../store/chatStore.js'; // Import your Zustand store
import ChatMessage from './ChatMessage.jsx'
import styles from './ChatMessageList.module.css'

const ChatMessageList = () => {
    const { messages } = useChatStore();
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]); // Run this effect whenever messages change

    return (
        <div className={styles.chatMessageList} ref={chatContainerRef}>
            {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
        </div>
    );
};

export default ChatMessageList;
