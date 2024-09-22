// eslint-disable-next-line no-unused-vars
import React, {useContext, useRef, useEffect} from 'react';
import '../css/Main.css';
import {ChatComponent} from '../components/Main/ChatComponent.jsx';
import useChatSettingStore from "../store/chatSettingStore.js";
import ArtifactViewer from "../components/Main/ArtifactViewer.jsx";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import TopBar from "../components/TopBar/TopBar.jsx";
import ModelManagement from "./ModelManagement.jsx"
import styles from "./Main.module.css";
import SettingsPage from "./SettingPage.jsx";
import useUIStore from "../store/uiStore.js";
import {initializeWithRealData} from "../initialization.jsx";
import useChatStore from "../store/chatStore.js";
import '../css/themes.css';

const Main = ({useRealDataInitialization = true}) => {
    const chatSettings = useChatSettingStore.getState();
    const {
        showSettingPage,
        showModelManagementPage,
        showArtifact,
    } = useUIStore()

    useEffect(() => {
        if (useRealDataInitialization) {
            initializeWithRealData();
        }
        // UI setup that should happen regardless of data initialization
        const uiStore = useUIStore.getState();
        uiStore.showChatComponent = true;
        uiStore.showArtifact = true;
    }, [useRealDataInitialization]);

    const {currentTheme} = useUIStore();
    useEffect(() => {
        document.body.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);


    const { visibleArtifactId, getVisibleArtifact } = useChatStore()

    useEffect(() => {
        console.log("Artifact ID changed:", visibleArtifactId);
        // Any additional logic to handle when visibleArtifactId changes can be placed here
    }, [visibleArtifactId]);

    return (
        <div className={styles.mainContainer}>
            <Sidebar/>
            {showSettingPage && (
                <div className={styles.settingPage}>
                    <SettingsPage/>
                </div>
            )}
            {showModelManagementPage && (
                <div className={styles.settingPage}>
                    <ModelManagement/>
                </div>
            )}
            {!showSettingPage && !showModelManagementPage && <div className={styles.topBarAndRest}>
                <TopBar/>
                <div className={styles.chatAndArtifact}>
                    <div className={styles.chatComContainer}>
                        {<ChatComponent/>}
                    </div>
                    {visibleArtifactId!=null && showArtifact && (
                        <div className={styles.artifactComContainer}>
                            <ArtifactViewer/>
                        </div>
                    )}
                </div>
            </div>
            }
        </div>
    )
}

export default Main

