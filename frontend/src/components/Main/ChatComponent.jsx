// ChatComponent.jsx
import React from 'react';
import useChatStore from "../../store/chatStore.js";
import ChatMessagesList from './ChatMessageList.jsx';
import InputBox from "./InputBox.jsx";
import styles from './ChatComponent.module.css';

const ChatComponent = () => {
    const chatStore = useChatStore();

    return (
        <div className={styles.chatComponentContainer}>
            <div className={styles.chatComponentMessageList}>
                <ChatMessagesList />
            </div>
            <div className={styles.chatComponentContainerInputBox}>
                <InputBox />
            </div>
            {/* Optionally include LoadingComponent if needed */}
            {/*{loading && <LoadingComponent />}*/}
        </div>
    );
};

export { ChatComponent };
