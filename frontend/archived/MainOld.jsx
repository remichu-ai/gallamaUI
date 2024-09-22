// eslint-disable-next-line no-unused-vars
import React, {useContext, useRef, useEffect} from 'react';
import '../src/css/Main.css';
import {assets} from '../src/assets/assets.js';
import {Context} from '../src/context/Context.jsx';
import {ChatComponent} from '../src/components/Main/ChatComponent.jsx';
import {LandingComponent} from '../src/components/Main/LandingComponent.jsx';
import {useChatStore} from "../src/store/chatStore.js";
import {useApiKeyStore} from "../src/store/apiKeyStore.js";
import {sendMessageAndGetResponse} from "../src/services/chat.mjs";
import { useChatSettingStore } from "../src/store/chatSettingStore.js";


const Main = () => {
    const inputRef = useRef();
    const {showResult, setInput, input} = useContext(Context);
    // const chatStore = useChatStore();
    const { messages, addMessage, updateLastMessage, getIntegratedMessages, getIntegratedMessagesWithText } = useChatStore();
    const chatSettings = useChatSettingStore.getState();


    const handleInputChange = (e) => {
        setInput(e.target.value);
        adjustTextareaHeight();
    };

    const adjustTextareaHeight = () => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    };


    const onSent = async (prompt) => {
        const newMessage =  {role: 'user', content: prompt}
        const useArtifact = chatSettings.useArtifact;
        addMessage(newMessage);
        // const updatedMessages = [...messages, newMessage];
        // Get the integrated messages (including the new message)
        let integratedMessages = null
        if (useArtifact) {
            integratedMessages = getIntegratedMessagesWithText();
            //integratedMessages = getIntegratedMessages();

        } else {
            integratedMessages = getIntegratedMessages();
        }

        await sendMessageAndGetResponse(
            integratedMessages,
            addMessage,
            updateLastMessage
        )
        setInput("")
    }

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSent(input);
            setInput("")
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    return (
        <div className='main'>
            <div className="nav">
                {showResult ? <p>AI Squad</p> : null}
            </div>
            <div className="main-container">
                <ChatComponent/>
                <div className="main-bottom">
                    <div className="search-box">
            <textarea
                ref={inputRef}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                value={input}
                placeholder='Enter a prompt here'
                rows={1}/>
                        <div>
                            <img src={assets.gallery_icon} width={30} alt=""/>
                            {input ?
                                <img onClick={() => onSent(input)} src={assets.send_icon} width={30} alt=""/> : null}
                        </div>
                    </div>
                    <p className="bottom-info">
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Main

