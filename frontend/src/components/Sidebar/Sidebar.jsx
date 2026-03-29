import React, { useState, useEffect } from 'react';
import { DatabaseZap, PanelLeftClose, PanelLeftOpen, Settings2, SquarePen } from 'lucide-react';
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
    const {
        showModelManagementPage,
        setShowSettingPage,
        setShowModelManagementPage,
        sidebarExtended,
        setSidebarExtended,
    } = useUIStore();
    const { inputText } = useInputStore();

    // Ensure the saved conversations state is initialized correctly
    const [savedConversations, setSavedConversations] = useState([]);
    const [activeDeleteId, setActiveDeleteId] = useState(null);
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
        <div className={`${styles.sidebarContainer} ${sidebarExtended ? styles.expanded : styles.collapsed}`}>
            <div className={styles.sidebarTop}>
                <button
                    type="button"
                    className={styles.sidebarToggle}
                    onClick={setSidebarExtended}
                    aria-label={sidebarExtended ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <span className={styles.iconSlot}>
                        {sidebarExtended ? (
                            <PanelLeftClose className={`${styles.menuIcon} ${styles.toggleIcon}`} />
                        ) : (
                            <PanelLeftOpen className={`${styles.menuIcon} ${styles.toggleIcon}`} />
                        )}
                    </span>
                </button>

                <div className={styles.clearMessages} onClick={clearMessages}>
                    <span className={styles.iconSlot}>
                        <SquarePen className={`${styles.menuIcon} ${styles.newChatIcon}`} />
                    </span>
                    <span className={styles.menuText}>New Chat</span>
                </div>

                <div className={styles.modelManagement} onClick={setShowModelManagementPage}>
                    <span className={styles.iconSlot}>
                        <DatabaseZap className={`${styles.menuIcon} ${styles.modelManagementIcon}`} />
                    </span>
                    <span className={styles.menuText}>Model Management</span>
                </div>

                <div className={styles.settings} onClick={setShowSettingPage}>
                    <span className={styles.iconSlot}>
                        <Settings2 className={`${styles.menuIcon} ${styles.settingsIcon}`} />
                    </span>
                    <span className={styles.menuText}>Settings</span>
                </div>
            </div>

            <div className={styles.sidebarMiddle}>
                <div className={styles.sectionLabel}>Recent</div>
                <div className={styles.conversationList}>
                    {savedConversations.slice().reverse().map((conversation) => (
                        <div
                            key={conversation._id}
                            className={`${styles.conversationItem} ${conversation._id === conversation_id ? styles.conversationItemActive : ''}`}
                            onMouseLeave={() => setActiveDeleteId(null)}
                        >
                            <span
                                className={styles.conversationText}
                                onClick={() => handleLoadConversation(conversation._id)}
                            >
                                {conversation.title || "New Chat"} {/* Fallback to 'New Chat' if no title */}
                            </span>
                            <button
                                className={styles.deleteButton}
                                onClick={(e) => handleClickDeleteButton(e, conversation._id)}
                                aria-label={`Open actions for ${conversation.title || "New Chat"}`}
                            />
                            {activeDeleteId === conversation._id && (
                                <div
                                    className={styles.deleteBox}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button onClick={() => handleDeleteConversation(conversation._id)}>Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
