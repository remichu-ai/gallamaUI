import React, {useEffect} from 'react';
import useUIStore from "../store/uiStore.js";
import useChatStore from '../store/chatStore.js';
import '../css/themes.css';
import Main from "../page/Main.jsx";
import {initializeWithMockData} from "../initialization.jsx";


const TestComponent = () => {
    const chatStore = useChatStore();

    useEffect(() => {
        // initializeWithMockData('basic');        // 'basic' or 'advanced'
        initializeWithMockData('advanced');        // 'basic' or 'advanced'
        const uiStore = useUIStore.getState();
        uiStore.showChatComponent = true;
    }, []);

    const {currentTheme} = useUIStore();
    useEffect(() => {
        document.body.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);

    console.log("Whole message")
    console.log(chatStore.messages)

    return (
        <div>
            {/*<MockCodeBlock/>*/}
            {/*<MockMarkdownText/>*/}
            {/*<MockChatMessage/>*/}
            {/*<ChatMessageList/>*/}
            {/*<ChatComponent/>*/}
            {/*<InputBox/>*/}
            {/*<div>*/}
            {/*<SettingsPage/>*/}
            {/*<Sidebar/>*/}
            {/*</div>*/}
            {/*<TopBar/>*/}
            <Main useRealDataInitialization={false} />
        </div>
    )
};

export default TestComponent;
