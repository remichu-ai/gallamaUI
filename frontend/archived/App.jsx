import React, {useContext, useEffect} from 'react'
import Sidebar from '../src/components/Sidebar/Sidebar.jsx'
import Main from '../src/page/Main.jsx'
import SettingsPage from '../src/page/SettingPage.jsx'
// import {Context} from "./context/Context.jsx";
import useChatSettingStore from "../src/store/chatSettingStore.js";
import ArtifactViewer from "../src/components/Main/ArtifactViewer.jsx";
import useUIStore from "../src/store/uiStore.js";
import './App.css'
import '../src/css/themes.css';
import {initializeWithRealData} from "../src/initialization.jsx";

const App = () => {
    useEffect(() => {
        initializeWithRealData();
    }, []);

    // handle css theme
    const {currentTheme} = useUIStore();

    useEffect(() => {
        document.body.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);


    return (
        <div>
            <Main/>
        </div>
    );
};

export default App