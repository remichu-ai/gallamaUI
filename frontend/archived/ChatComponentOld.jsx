import React, { useEffect, useRef, useState } from 'react';
import useChatStore from "../src/store/chatStore.js";
import { ChatMessagesOld } from './ChatMessagesOld.jsx'; // Assuming you've moved ChatMessagesOld to a separate file
import { LoadingComponent } from '../src/components/Main/LoadingComponent.jsx'; // Assuming you've moved LoadingComponent to a separate file

const ChatComponent = () => {
    const chatStore = useChatStore();
    const [isAtBottom, setIsAtBottom] = useState(true);
    const chatContainerRef = useRef(null);

    // Handle scroll event to update `isAtBottom`
    const handleScroll = () => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            const isAtBottomNow = scrollHeight - clientHeight <= scrollTop + 1;
            setIsAtBottom(isAtBottomNow);
        }
    };

    useEffect(() => {
        // Add scroll event listener to handle auto-scrolling logic
        window.addEventListener('scroll', handleScroll);

        return () => {
            // Cleanup the scroll event listener
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (isAtBottom) {
            // Auto-scroll to the bottom of the document when new messages are added and user is at the bottom
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [chatStore.messages, isAtBottom]);


    return (
        <div className="chat-container" ref={chatContainerRef}>
            <ChatMessagesList/>
            {/* Optionally include LoadingComponent if needed */}
            {/*{loading && <LoadingComponent />}*/}
        </div>
    );
};

export { ChatComponent };
