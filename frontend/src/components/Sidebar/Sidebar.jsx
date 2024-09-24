import React, { useState, useRef, useEffect } from 'react';
import { assets } from '../../assets/assets';
import useUIStore from "../../store/uiStore.js";
import useChatStore from "../../store/chatStore.js";
import useInputStore from '../../store/inputStore.js';
import styles from './Sidebar.module.css';
import axios from 'axios';

const Sidebar = () => {
    const {
        clearMessages,
        saveCurrentConversation,
        addMessage,
        messages,
        conversation_id,
        setConversationId,
        setConversationTitle,
        sidebarRefreshTrigger
    } = useChatStore();
    const { showModelManagementPage ,setShowSettingPage, setShowModelManagementPage } = useUIStore();
    const { inputText } = useInputStore();

    // Ensure the saved conversations state is initialized correctly
    const [savedConversations, setSavedConversations] = useState([]);
    const [activeDeleteId, setActiveDeleteId] = useState(null);
    const deleteButtonRefs = useRef({});

    const fetchConversations = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/conversations');
            setSavedConversations(response.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const handleSaveConversation = async () => {
        try {
            await saveCurrentConversation();
            fetchConversations();
        } catch (error) {
            console.error("Error saving conversation:", error);
        }
    };

    const handleLoadConversation = async (id) => {
        if(showModelManagementPage) {
            setShowModelManagementPage()
        }

        try {
            const response = await axios.get(`http://localhost:3000/api/conversations/${id}`);
            const conversation = response.data;
            if (conversation) {
                clearMessages();
                conversation.messages.forEach(message => addMessage(message));
                setConversationId(id);
                setConversationTitle(conversation.title || "New Chat"); // Set a fallback title
            } else {
                console.log("Conversation not found.");
            }
        } catch (error) {
            console.error("Error loading conversation from backend:", error);
        }
    };

    const handleDeleteConversation = async (id) => {
        try {
            await axios.delete(`http://localhost:3000/api/conversations/${id}`);
            setSavedConversations(savedConversations.filter(convo => convo._id !== id));
            if (id === conversation_id) {
                clearMessages();
            }
            setActiveDeleteId(null);
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    };

    const handleClickDeleteButton = (e, conversationId) => {
        e.stopPropagation();
        setActiveDeleteId(activeDeleteId === conversationId ? null : conversationId);
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [sidebarRefreshTrigger]);

    return (
        <div className={styles.sidebarContainer}>
            <div className={styles.sidebarTop}>
                <div className={styles.clearMessages} onClick={clearMessages}>
                    <assets.NewIcon className={styles.menuIcon} />
                    <span className={styles.menuText}>New Chat</span>
                </div>
            </div>

            <div className={styles.sidebarMiddle}>
                <div className={styles.conversationList}>
                    {savedConversations.slice().reverse().map((conversation) => (
                        <div
                            key={conversation._id}
                            className={`${styles.conversationItem} ${conversation._id === conversation_id ? styles.active : ''}`}
                            onMouseLeave={() => setActiveDeleteId(null)}
                        >
                            <span
                                className={styles.menuText}
                                onClick={() => handleLoadConversation(conversation._id)}
                            >
                                {conversation.title || "New Chat"} {/* Fallback to 'New Chat' if no title */}
                            </span>
                            <button
                                className={styles.deleteButton}
                                onClick={(e) => handleClickDeleteButton(e, conversation._id)}
                                ref={(el) => deleteButtonRefs.current[conversation._id] = el}
                            />
                            {activeDeleteId === conversation._id && (
                                <div
                                    className={styles.deleteBox}
                                    style={{
                                        top: deleteButtonRefs.current[conversation._id]?.getBoundingClientRect().bottom + window.scrollY,
                                        left: deleteButtonRefs.current[conversation._id]?.getBoundingClientRect().left + window.scrollX
                                    }}
                                >
                                    <button onClick={() => handleDeleteConversation(conversation._id)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.sidebarBottom}>
                <div className={styles.modelManagement} onClick={setShowModelManagementPage}>
                    <img src={assets.model_management_icon} alt="Model Management" className={styles.menuIcon} />
                    <span className={styles.menuText}>Model Management</span>
                </div>
                <div className={styles.settings} onClick={setShowSettingPage}>
                    <assets.SettingIcon className={styles.menuIcon} />
                    <span className={styles.menuText}>Settings</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
