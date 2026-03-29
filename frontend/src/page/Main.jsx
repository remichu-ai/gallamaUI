// eslint-disable-next-line no-unused-vars
import React, {useEffect} from 'react';
import '../css/Main.css';
import {ChatComponent} from '../components/Main/ChatComponent.jsx';
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import TopBar from "../components/TopBar/TopBar.jsx";
import ModelManagement from "./ModelManagement.jsx"
import styles from "./Main.module.css";
import SettingsPage from "./SettingPage.jsx";
import useUIStore from "../store/uiStore.js";
import {initializeWithRealData} from "../initialization.jsx";
import '../css/themes.css';

const Main = ({useRealDataInitialization = true}) => {
    const {
        showSettingPage,
        showModelManagementPage,
        sidebarExtended,
    } = useUIStore()

    useEffect(() => {
        if (useRealDataInitialization) {
            initializeWithRealData();
        }
        // UI setup that should happen regardless of data initialization
        const uiStore = useUIStore.getState();
        uiStore.showChatComponent = true;
    }, [useRealDataInitialization]);

    const {currentTheme} = useUIStore();
    useEffect(() => {
        document.body.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);

    return (
        <div className={`${styles.mainContainer} ${sidebarExtended ? styles.sidebarExpanded : ''}`}>
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
                <div className={styles.chatComContainer}>
                    <ChatComponent/>
                </div>
            </div>
            }
        </div>
    )
}

export default Main
