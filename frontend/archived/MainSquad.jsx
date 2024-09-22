import React, {useContext, useState} from 'react'
import '../src/css/Main.css'
import {assets} from '../src/assets/assets.js'
import {Context} from '../src/context/Context.jsx'
import {ChatComponent} from '../src/components/Main/ChatComponent.jsx'


const MainSquad = () => {

    const {
        mode,
        onSent,
        msgHistory,
        recentPrompt,
        showResult,   // this toggle is to show the chat result or welcome screen
        loading,
        resultData,
        setInput,
        input
    } = useContext(Context);

    const handleKeyPress = (e, inputValue) => {
        if (e.key === 'Enter') {
            onSent(inputValue);
        }
    };

    return (
        <div className='main'>
            <div className="nav" >
                <p>Working Group</p>
                {/*<img src={assets.user_icon} alt="" />*/}
            </div>
            <div className="main-container-working-group">
                {showResult
                    ? <ChatComponent display_mode={"user"}/>
                    : null
                }
            </div>

        </div>
    )
}


export default MainSquad
