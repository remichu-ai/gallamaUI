import React from 'react';
import useChatStore from '../store/chatStore.js'; // Import your Zustand store
import ChatMessage from '../components/Main/ChatMessage.jsx'

const MockChatMessage = () => {
    const { messages } = useChatStore();

    return (
        <div>
            {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
        </div>
    );
};

export default MockChatMessage;