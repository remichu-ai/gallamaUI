import React, {useEffect} from 'react';
import useUIStore from "../store/uiStore.js";
import useChatStore from '../store/chatStore.js';
import useChatSettingStore from '../store/chatSettingStore.js';
import '../css/themes.css';
import topBar from "../components/TopBar/TopBar.jsx";

// UI component
// import {CodeBlock} from '../components/Main/CodeBlock.jsx';
import MockCodeBlock from "./MockCodeBlock.jsx";
import MockMarkdownText from "./MockMarkdownText.jsx";
import ChatMessage from "../components/Main/ChatMessage.jsx";

import ArtifactButtonTestContainer from "./MockArtifactButton.jsx";
import ArtifactViewer from "../components/Main/ArtifactViewer.jsx";
import MockChatMessage from "./MockChatMessage.jsx";
import ChatMessageList from "../components/Main/ChatMessageList.jsx";
import {ChatComponent} from "../components/Main/ChatComponent.jsx";
import Main from "../page/Main.jsx";
import InputBox from "../components/Main/InputBox.jsx";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import App from "../../archived/App.jsx";
import SettingsPage from "../page/SettingPage.jsx";
import TopBar from "../components/TopBar/TopBar.jsx";

import {initializeWithMockData} from "../initialization.jsx";


const TestComponent = () => {
    const chatStore = useChatStore();
    const uiStore = useUIStore();

    useEffect(() => {
        // initializeWithMockData('basic');        // 'basic' or 'advanced'
        initializeWithMockData('advanced');        // 'basic' or 'advanced'
        const uiStore = useUIStore.getState();
        uiStore.showChatComponent = true;
        uiStore.showArtifact = true;
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
            {/*<ArtifactButtonTestContainer/>*/}
            {/*<MockChatMessage/>*/}
            {/*<ArtifactViewer/>*/}
            {/*<ChatMessageList/>*/}
            {/*<ChatComponent/>*/}
            {/*<InputBox/>*/}
            {/*<div>*/}
            {/*<SettingsPage/>*/}
            {/*<Sidebar/>*/}
            {/*</div>*/}
            {/*<TopBar/>*/}
            <Main useRealDataInitialization={false} />
            {/*<App/>*/}
        </div>
    )
};

export default TestComponent;