import React, { Suspense, lazy, useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, DatabaseZap, PanelLeftClose, PanelLeftOpen, Settings2, SquarePen, Wrench } from 'lucide-react';
import useUIStore from "../../store/uiStore.js";
import useChatStore from "../../store/chatStore.js";
import useApiKeyStore from "../../store/apiKeyStore.js";
import { buildBackendApiUrl } from "../../services/backendApi.js";
import styles from './Sidebar.module.css';
import axios from 'axios';

const McpControlsContent = lazy(() => import('../Mcp/McpControlsContent.jsx'));

const Sidebar = () => {
    const {
        clearMessages,
        addMessage,
        conversation_id,
        setConversationId,
        setConversationTitle,
        sidebarRefreshTrigger
    } = useChatStore();
    const {
        showSettingPage,
        showModelManagementPage,
        setShowSettingPage,
        setShowModelManagementPage,
        sidebarExtended,
        setSidebarExtended,
        isMobileViewport,
        showMcpToolDrawer,
        toggleMcpToolDrawer,
    } = useUIStore();
    const { backendApiUrl } = useApiKeyStore();

    // Ensure the saved conversations state is initialized correctly
    const [savedConversations, setSavedConversations] = useState([]);
    const [activeDeleteId, setActiveDeleteId] = useState(null);
    const [conversationLoadError, setConversationLoadError] = useState('');
    const [isConversationLoading, setIsConversationLoading] = useState(false);
    const fetchConversations = async () => {
        const conversationsUrl = buildBackendApiUrl('/api/conversations');

        try {
            setIsConversationLoading(true);
            const response = await axios.get(conversationsUrl);
            setSavedConversations(Array.isArray(response.data) ? response.data : []);
            setConversationLoadError('');
        } catch (error) {
            console.error("Error fetching conversations:", error);
            setConversationLoadError(`Unable to load conversation history from ${conversationsUrl}`);
        } finally {
            setIsConversationLoading(false);
        }
    };

    const shouldFetchConversationHistory = !isMobileViewport || sidebarExtended;

    const closeSidebarForMobile = () => {
        if (isMobileViewport) {
            setSidebarExtended(false);
        }
    };

    const closeSecondaryPages = () => {
        if (showSettingPage) {
            setShowSettingPage();
        }

        if (showModelManagementPage) {
            setShowModelManagementPage();
        }
    };

    const handleClearMessages = () => {
        clearMessages();
        closeSecondaryPages();
        closeSidebarForMobile();
    };

    const handleOpenModelManagement = () => {
        setShowModelManagementPage();
        closeSidebarForMobile();
    };

    const handleOpenSettings = () => {
        setShowSettingPage();
        closeSidebarForMobile();
    };

    const handleLoadConversation = async (id) => {
        try {
            const response = await axios.get(buildBackendApiUrl(`/api/conversations/${id}`));
            const conversation = response.data;
            if (conversation) {
                clearMessages();
                conversation.messages.forEach(message => addMessage(message));
                setConversationId(id);
                setConversationTitle(conversation.title || "New Chat"); // Set a fallback title
                closeSecondaryPages();
                closeSidebarForMobile();
            } else {
                console.log("Conversation not found.");
            }
        } catch (error) {
            console.error("Error loading conversation from backend:", error);
        }
    };

    const handleDeleteConversation = async (id) => {
        try {
            await axios.delete(buildBackendApiUrl(`/api/conversations/${id}`));
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
        if (!shouldFetchConversationHistory) {
            return;
        }

        fetchConversations();
    }, [backendApiUrl, shouldFetchConversationHistory]);

    useEffect(() => {
        if (!shouldFetchConversationHistory) {
            return;
        }

        fetchConversations();
    }, [sidebarRefreshTrigger, shouldFetchConversationHistory]);

    return (
        <>
            {isMobileViewport && sidebarExtended && (
                <button
                    type="button"
                    className={styles.mobileBackdrop}
                    onClick={() => setSidebarExtended(false)}
                    aria-label="Close sidebar"
                />
            )}

            <div className={`${styles.sidebarContainer} ${sidebarExtended ? styles.expanded : styles.collapsed} ${isMobileViewport ? styles.mobileSidebar : ''}`}>
                <div className={styles.sidebarTop}>
                    <button
                        type="button"
                        className={styles.sidebarToggle}
                        onClick={() => setSidebarExtended()}
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

                    <div className={styles.clearMessages} onClick={handleClearMessages}>
                        <span className={styles.iconSlot}>
                            <SquarePen className={`${styles.menuIcon} ${styles.newChatIcon}`} />
                        </span>
                        <span className={styles.menuText}>New Chat</span>
                    </div>

                    <div className={styles.modelManagement} onClick={handleOpenModelManagement}>
                        <span className={styles.iconSlot}>
                            <DatabaseZap className={`${styles.menuIcon} ${styles.modelManagementIcon}`} />
                        </span>
                        <span className={styles.menuText}>Model Management</span>
                    </div>

                    <div className={styles.settings} onClick={handleOpenSettings}>
                        <span className={styles.iconSlot}>
                            <Settings2 className={`${styles.menuIcon} ${styles.settingsIcon}`} />
                        </span>
                        <span className={styles.menuText}>Settings</span>
                    </div>

                    {isMobileViewport && (
                        <button
                            type="button"
                            className={styles.mcpControls}
                            onClick={toggleMcpToolDrawer}
                            aria-expanded={showMcpToolDrawer}
                            aria-controls="mobile-mcp-controls"
                        >
                            <span className={styles.iconSlot}>
                                <Wrench className={styles.menuIcon} />
                            </span>
                            <span className={styles.menuText}>MCP Controls</span>
                            <span className={styles.mcpChevron}>
                                {showMcpToolDrawer ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </span>
                        </button>
                    )}
                </div>

                <div className={styles.sidebarMiddle}>
                    {isMobileViewport && showMcpToolDrawer && (
                        <Suspense fallback={<div className={styles.sidebarStatus}>Loading MCP controls...</div>}>
                            <div id="mobile-mcp-controls" className={styles.mobileMcpSection}>
                                <McpControlsContent variant="sidebar" />
                            </div>
                        </Suspense>
                    )}
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
                    {conversationLoadError && (
                        <div className={styles.sidebarStatus}>{conversationLoadError}</div>
                    )}
                    {!conversationLoadError && isConversationLoading && (
                        <div className={styles.sidebarStatus}>Loading conversation history...</div>
                    )}
                    {!conversationLoadError && !isConversationLoading && savedConversations.length === 0 && (
                        <div className={styles.sidebarStatus}>No saved conversations found.</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
