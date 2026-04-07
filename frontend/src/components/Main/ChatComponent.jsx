// ChatComponent.jsx
import React, { Suspense, lazy } from 'react';
import ChatMessagesList from './ChatMessageList.jsx';
import InputBox from "./InputBox.jsx";
import useUIStore from '../../store/uiStore.js';
import styles from './ChatComponent.module.css';

const McpToolDrawer = lazy(() => import('./McpToolDrawer.jsx'));

const ChatComponent = () => {
    const { isMobileViewport } = useUIStore();

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
            {!isMobileViewport && (
                <Suspense fallback={<div className={styles.chatDrawerPlaceholder} aria-hidden="true" />}>
                    <McpToolDrawer />
                </Suspense>
            )}
            {/* Optionally include LoadingComponent if needed */}
            {/*{loading && <LoadingComponent />}*/}
        </div>
    );
};

export { ChatComponent };
