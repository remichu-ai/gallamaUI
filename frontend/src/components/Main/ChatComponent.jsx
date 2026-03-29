// ChatComponent.jsx
import React from 'react';
import ChatMessagesList from './ChatMessageList.jsx';
import InputBox from "./InputBox.jsx";
import McpToolDrawer from './McpToolDrawer.jsx';
import styles from './ChatComponent.module.css';

const ChatComponent = () => {
    return (
        <div className={styles.chatComponentContainer}>
            <div className={styles.chatRail}>
                <div className={styles.chatComponentMessageList}>
                    <ChatMessagesList />
                </div>
                <div className={styles.chatComponentContainerInputBox}>
                    <InputBox />
                </div>
            </div>
            <McpToolDrawer />
            {/* Optionally include LoadingComponent if needed */}
            {/*{loading && <LoadingComponent />}*/}
        </div>
    );
};

export { ChatComponent };
