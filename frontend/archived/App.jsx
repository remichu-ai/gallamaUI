import React, {useEffect} from 'react'
import Main from '../src/page/Main.jsx'
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
