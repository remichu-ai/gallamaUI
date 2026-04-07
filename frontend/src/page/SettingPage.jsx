import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './SettingPage.module.css';
import useChatSettingStore from '../store/chatSettingStore';
import useApiKeyStore from '../store/apiKeyStore';
import { queryAvailableModels } from '../services/queryAvailableModels';
import useUIStore from '../store/uiStore';
import McpServerToolPanel from '../components/Mcp/McpServerToolPanel.jsx';
import useChatStore from '../store/chatStore';
import { buildBackendApiUrl } from '../services/backendApi.js';
import useMcpServerDiscoverability from '../components/Mcp/useMcpServerDiscoverability.js';
import axios from 'axios';
import {
    TOOL_PAYLOAD_FORMAT_JSON,
    TOOL_PAYLOAD_FORMAT_YAML,
} from '../services/toolTraceFormatting.js';

const formatThemeLabel = (theme) =>
    theme
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const getEnabledToolNamesForServer = (server) => {
    const discoveredToolNames = (server?.discoveredTools ?? [])
        .map((tool) => tool?.name?.trim())
        .filter(Boolean);

    if (server?.toolMode === 'all') {
        return discoveredToolNames;
    }

    const selectedToolNames = (server?.selectedToolNames ?? [])
        .map((toolName) => String(toolName).trim())
        .filter(Boolean);

    if (discoveredToolNames.length === 0) {
        return selectedToolNames;
    }

    const discoveredToolNameSet = new Set(discoveredToolNames);
    return selectedToolNames.filter((toolName) => discoveredToolNameSet.has(toolName));
};

const getDiscoveredToolNamesForServer = (server) => (
    (server?.discoveredTools ?? [])
        .map((tool) => tool?.name?.trim())
        .filter(Boolean)
);

const isMcpServerOffline = (server) => server?.discoveryStatus === 'error';

const SettingsPage = () => {
    const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [deleteHistoryStatus, setDeleteHistoryStatus] = useState('');
    const [deleteHistoryError, setDeleteHistoryError] = useState('');
    const [isDeletingHistory, setIsDeletingHistory] = useState(false);
    const [collapsedMcpServerIds, setCollapsedMcpServerIds] = useState(() => new Set());

    const {
        temperature,
        setTemperature,
        topP,
        setTopP,
        systemPrompt,
        setSystemPrompt,
        saveSettings,
        useThinking,
        toggleUseThinking,
        useMcp,
        setUseMcp,
        mcpServers,
        addMcpServer,
        removeMcpServer,
        updateMcpServer,
        setMcpServerDiscoveryState,
        setMcpServerDiscoveredTools,
        maxImageWidth,
        setMaxImageWidth,
        maxImageHeight,
        setMaxImageHeight
    } = useChatSettingStore();

    const {
        apiKeys,
        selectedService,
        apiEndpointOptions,
        selectedApiEndpointType,
        backendApiUrl,
        services,
        updateApiKey,
        selectService,
        selectApiEndpointType,
        setBackendApiUrl,
        setAvailableModels,
        getAvailableModels,
        setServiceEndpoint,
        setSelectedModel,
        getSelectedModel
    } = useApiKeyStore();

    const {
        themes,
        currentTheme,
        setTheme,
        showReasoning,
        toggleShowReasoning,
        traceDisplayMode,
        setTraceDisplayMode,
        toolPayloadFormat,
        setToolPayloadFormat,
    } = useUIStore();

    const {
        clearMessages,
        triggerSidebarRefresh
    } = useChatStore();

    const openDeleteHistoryModal = () => {
        setDeleteHistoryStatus('');
        setDeleteHistoryError('');
        setDeleteConfirmationText('');
        setIsDeleteHistoryModalOpen(true);
    };

    const closeDeleteHistoryModal = () => {
        if (isDeletingHistory) return;
        setDeleteConfirmationText('');
        setDeleteHistoryError('');
        setIsDeleteHistoryModalOpen(false);
    };

    const handleDeleteAllHistory = async () => {
        if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
            setDeleteHistoryError('Type "delete" to confirm.');
            return;
        }

        setIsDeletingHistory(true);
        setDeleteHistoryError('');

        try {
            try {
                await axios.delete(buildBackendApiUrl('/api/conversations/all'));
            } catch (bulkDeleteError) {
                console.warn('Bulk delete endpoint unavailable, falling back to deleting conversations one by one.', bulkDeleteError);

                const { data: conversations } = await axios.get(buildBackendApiUrl('/api/conversations'));
                await Promise.all(
                    conversations.map((conversation) =>
                        axios.delete(buildBackendApiUrl(`/api/conversations/${conversation._id}`))
                    )
                );
            }

            localStorage.removeItem('savedConversation');
            clearMessages();
            triggerSidebarRefresh();
            setDeleteHistoryStatus('All chat history has been deleted.');
            setDeleteConfirmationText('');
            setIsDeleteHistoryModalOpen(false);
        } catch (error) {
            console.error('Error deleting all chat history:', error);
            setDeleteHistoryError('Unable to delete chat history right now. Please try again.');
        } finally {
            setIsDeletingHistory(false);
        }
    };




    const selectedServiceConfig = services[selectedService];
    const selectedServiceEndpoint = selectedServiceConfig?.endpoint || '';

    useEffect(() => {
        let isCancelled = false;
        const fetchModels = async () => {
            const models = await queryAvailableModels();
            if (!isCancelled) {
                setAvailableModels(selectedService, models);
            }
        };

        const timeoutId = window.setTimeout(fetchModels, 300);

        return () => {
            isCancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [selectedService, selectedServiceEndpoint, setAvailableModels]);

    const availableModels = getAvailableModels();
    const selectedModel = getSelectedModel();
    const { handleMcpServerEnabledChange } = useMcpServerDiscoverability({
        mcpServers,
        setMcpServerDiscoveryState,
        setMcpServerDiscoveredTools,
        updateMcpServer,
    });

    const toggleMcpServerCollapse = useCallback((serverId) => {
        setCollapsedMcpServerIds((previous) => {
            const next = new Set(previous);
            if (next.has(serverId)) {
                next.delete(serverId);
            } else {
                next.add(serverId);
            }
            return next;
        });
    }, []);




    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Settings</h2>
            <div className={styles.settingContainer}>
                <div className={styles.settingColumn1}>
                    {/* Column 2: Theme, API & Model Settings */}
                    <div className={styles.settingColumn}>
                        <h3 className={styles.subHeader}>Theme Settings</h3>

                        {/* Theme Selector */}
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Theme:
                                <select
                                    value={currentTheme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    {themes.map((theme) => (
                                        <option key={theme} value={theme}>
                                            {formatThemeLabel(theme)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <h3 className={styles.subHeader}>API Settings</h3>

                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Gallama UI Backend URL:
                                <input
                                    type="text"
                                    value={backendApiUrl}
                                    onChange={(e) => setBackendApiUrl(e.target.value)}
                                    className={styles.textInput}
                                    placeholder="http://localhost:3000"
                                />
                            </label>
                            <div className={styles.sectionHint}>
                                Used for saved conversations and MCP discovery. Set this to your Tailscale URL when opening the UI from mobile.
                            </div>
                        </div>

                        {/* Service Provider Selector */}
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Service Provider:
                                <select
                                    value={selectedService}
                                    onChange={(e) => selectService(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    {Object.keys(services).map((service) => (
                                        <option key={service} value={service}>
                                            {services[service].name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                {selectedServiceConfig?.name || 'Service'} API URL:
                                <input
                                    type="text"
                                    value={selectedServiceConfig?.endpoint || ''}
                                    onChange={(e) => setServiceEndpoint(selectedService, e.target.value)}
                                    className={styles.textInput}
                                    placeholder="http://127.0.0.1:8000/v1"
                                />
                            </label>
                            <div className={styles.sectionHint}>
                                Used for model listing and chat requests. Point this to localhost on desktop or your exposed Tailscale URL on mobile.
                            </div>
                        </div>

                        {/* API Key Input */}
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                API Key:
                                <input
                                    type="password"
                                    value={apiKeys[selectedService] || ''}
                                    onChange={(e) => updateApiKey(selectedService, e.target.value)}
                                    className={styles.textInput}
                                    placeholder="Enter API key for selected service"
                                />
                            </label>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Request API:
                                <select
                                    value={selectedApiEndpointType}
                                    onChange={(e) => selectApiEndpointType(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    {apiEndpointOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {/* Model Selector */}
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Model:
                                <select
                                    value={selectedModel || ''}
                                    onChange={(e) => setSelectedModel(selectedService, e.target.value)}
                                    className={styles.selectInput}
                                >
                                    {availableModels.map((model) => (
                                        <option key={model} value={model}>
                                            {model}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {/* Temperature Setting */}
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Temperature:
                                <input
                                    type="range"
                                    min="0.1"
                                    max="2"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className={styles.rangeInput}
                                />
                                {temperature}
                            </label>
                        </div>

                        {/* Top-P Setting */}
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Top-P:
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={topP}
                                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                                    className={styles.rangeInput}
                                />
                                {topP}
                            </label>
                        </div>
                        {/* System Prompt Setting */}
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                System Prompt:
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    rows={8}
                                    placeholder="Enter your custom system prompt..."
                                    className={styles.textArea}
                                />
                            </label>
                        </div>

                        {/* Image Resize Settings */}
                        <h4 className={styles.subHeader}>Image Resize Settings</h4>
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Max Width:
                                <input
                                    type="number"
                                    value={maxImageWidth}
                                    onChange={(e) => setMaxImageWidth(Number(e.target.value))}
                                    className={styles.textInput}
                                />
                            </label>
                        </div>
                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Max Height:
                                <input
                                    type="number"
                                    value={maxImageHeight}
                                    onChange={(e) => setMaxImageHeight(Number(e.target.value))}
                                    className={styles.textInput}
                                />
                            </label>
                        </div>

                        <h4 className={styles.subHeader}>Danger Zone</h4>
                        <div className={`${styles.settingGroup} ${styles.dangerCard}`}>
                            <div className={styles.dangerCardHeader}>
                                <div>
                                    <div className={styles.dangerTitle}>Delete All Chat History</div>
                                    <div className={styles.sectionHint}>
                                        This permanently removes every saved conversation from the backend and clears the current local chat history.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={openDeleteHistoryModal}
                                    className={styles.dangerButton}
                                >
                                    Delete All History
                                </button>
                            </div>
                            {deleteHistoryStatus && (
                                <div className={styles.successText}>{deleteHistoryStatus}</div>
                            )}
                        </div>

                    </div>
                </div>
                <div className={styles.settingColumn2}>
                    <div className={styles.settingColumn}>
                        <h3 className={styles.subHeader}>Chat Settings</h3>

                        {/* Chain of Thought Settings */}
                        <h4 className={styles.subHeader}>Reasoning Settings</h4>
                        <div className={styles.settingGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={useThinking}
                                    onChange={toggleUseThinking}
                                    className={styles.checkbox}
                                />
                                Use Thinking
                            </label>
                            <div className={styles.sectionHint}>
                                Requests reasoning/thinking output from providers that support it.
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={showReasoning}
                                    onChange={toggleShowReasoning}
                                    className={styles.checkbox}
                                />
                                Show Reasoning
                            </label>
                        </div>

                        <div className={styles.settingGroup}>
                            <div className={styles.displayModeCard}>
                                <div className={styles.displayModeHeader}>
                                    <div>
                                        <div className={styles.displayModeTitle}>Trace Display Mode</div>
                                        <div className={styles.sectionHint}>
                                            Retro keeps the current stacked reasoning panels. Modern turns thinking and tool usage into collapsible conversation items.
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.segmentedControl} role="tablist" aria-label="Trace display mode">
                                    <button
                                        type="button"
                                        className={`${styles.segmentedButton} ${traceDisplayMode === 'retro' ? styles.segmentedButtonActive : ''}`}
                                        onClick={() => setTraceDisplayMode('retro')}
                                        aria-pressed={traceDisplayMode === 'retro'}
                                    >
                                        Retro
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.segmentedButton} ${traceDisplayMode === 'modern' ? styles.segmentedButtonActive : ''}`}
                                        onClick={() => setTraceDisplayMode('modern')}
                                        aria-pressed={traceDisplayMode === 'modern'}
                                    >
                                        Modern
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <div className={styles.displayModeCard}>
                                <div className={styles.displayModeHeader}>
                                    <div>
                                        <div className={styles.displayModeTitle}>Tool Payload Format</div>
                                        <div className={styles.sectionHint}>
                                            Tool arguments and MCP structured results can stay in JSON or be converted to YAML for easier reading in chat.
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.segmentedControl} role="tablist" aria-label="Tool payload format">
                                    <button
                                        type="button"
                                        className={`${styles.segmentedButton} ${toolPayloadFormat === TOOL_PAYLOAD_FORMAT_JSON ? styles.segmentedButtonActive : ''}`}
                                        onClick={() => setToolPayloadFormat(TOOL_PAYLOAD_FORMAT_JSON)}
                                        aria-pressed={toolPayloadFormat === TOOL_PAYLOAD_FORMAT_JSON}
                                    >
                                        JSON
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.segmentedButton} ${toolPayloadFormat === TOOL_PAYLOAD_FORMAT_YAML ? styles.segmentedButtonActive : ''}`}
                                        onClick={() => setToolPayloadFormat(TOOL_PAYLOAD_FORMAT_YAML)}
                                        aria-pressed={toolPayloadFormat === TOOL_PAYLOAD_FORMAT_YAML}
                                    >
                                        YAML
                                    </button>
                                </div>
                            </div>
                        </div>

                        <h4 className={styles.subHeader}>MCP Settings</h4>
                        <div className={`${styles.settingGroup} ${styles.mcpOverviewCard}`}>
                            <div className={styles.mcpOverviewHeader}>
                                <div>
                                    <div className={styles.mcpOverviewTitle}>Tool access for connected MCP servers</div>
                                    <div className={styles.sectionHint}>
                                        These servers are translated automatically for Chat Completions, Responses, and Anthropic Messages.
                                    </div>
                                </div>
                                <label className={styles.toggleRow}>
                                    <span className={styles.toggleCopy}>
                                        <strong>{useMcp ? 'MCP enabled' : 'MCP disabled'}</strong>
                                        <span className={styles.toggleHint}>Use the chat drawer to quickly allow or block specific tools.</span>
                                    </span>
                                    <span className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={useMcp}
                                            onChange={(e) => setUseMcp(e.target.checked)}
                                        />
                                        <span className={styles.switchTrack} />
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <button
                                type="button"
                                onClick={addMcpServer}
                                className={styles.secondaryButton}
                            >
                                Add MCP Server
                            </button>

                            {mcpServers.length === 0 && (
                                <div className={styles.sectionHint}>
                                    No MCP servers configured yet.
                                </div>
                            )}

                            {mcpServers.map((server, index) => {
                                const isCollapsed = collapsedMcpServerIds.has(server.id);
                                const isOffline = isMcpServerOffline(server);
                                const enabledToolNames = getEnabledToolNamesForServer(server);
                                const discoveredToolNames = getDiscoveredToolNamesForServer(server);
                                const conciseToolNames = isOffline ? discoveredToolNames : enabledToolNames;
                                const panelId = `mcp-server-panel-${server.id}`;
                                const serverTitle = server.name.trim() || `MCP Server ${index + 1}`;
                                const serverStateLabel = server.discoveryStatus === 'loading'
                                    ? 'Checking'
                                    : isOffline
                                        ? 'Offline'
                                        : server.enabled
                                            ? 'Online'
                                            : 'Disabled';
                                const serverStateClassName = server.discoveryStatus === 'loading'
                                    ? styles.serverStateLoading
                                    : isOffline
                                        ? styles.serverStateOffline
                                        : server.enabled
                                            ? styles.serverStateOnline
                                            : styles.serverStateDisabled;

                                return (
                                    <div
                                        key={server.id}
                                        className={`${styles.mcpCard} ${isCollapsed ? styles.mcpCardCollapsed : ''}`}
                                    >
                                        <div className={styles.mcpHeaderRow}>
                                            <div className={styles.mcpHeaderMain}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMcpServerCollapse(server.id)}
                                                    className={styles.collapseButton}
                                                    aria-expanded={!isCollapsed}
                                                    aria-controls={panelId}
                                                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} MCP Server ${index + 1}`}
                                                >
                                                    <ChevronDown
                                                        size={16}
                                                        className={`${styles.collapseChevron} ${isCollapsed ? styles.collapseChevronCollapsed : ''}`}
                                                    />
                                                </button>
                                                <div className={styles.mcpTitleGroup}>
                                                    <div className={styles.mcpTitleLine}>
                                                        <div className={styles.mcpTitle}>{serverTitle}</div>
                                                        <span className={`${styles.serverState} ${serverStateClassName}`}>
                                                            <span className={styles.serverStateDot} />
                                                            {serverStateLabel}
                                                        </span>
                                                    </div>
                                                    {!isCollapsed && (
                                                        <div className={styles.serverHint}>
                                                            Discovery works best with Streamable HTTP MCP endpoints.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.mcpHeaderActions}>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={server.enabled}
                                                    aria-label={`${server.enabled ? 'Disable' : 'Enable'} MCP Server ${index + 1}`}
                                                    onClick={() => handleMcpServerEnabledChange(server, !server.enabled)}
                                                    disabled={server.discoveryStatus === 'loading'}
                                                    className={`${styles.statusToggleButton} ${server.enabled ? styles.statusToggleButtonEnabled : styles.statusToggleButtonDisabled}`}
                                                >
                                                    <span className={styles.statusToggleVisual} aria-hidden="true">
                                                        <span className={styles.statusToggleThumb} />
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeMcpServer(server.id)}
                                                    className={`${styles.dangerButton} ${styles.mcpRemoveButton}`}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>

                                        {isCollapsed ? (
                                            <div id={panelId} className={styles.conciseMcpSummary}>
                                                <div className={styles.conciseSummaryHeader}>Tools</div>
                                                <div className={styles.conciseSummaryContent}>
                                                    {conciseToolNames.length > 0 ? (
                                                        <div className={styles.enabledToolList}>
                                                            {conciseToolNames.map((toolName) => (
                                                                <span
                                                                    key={toolName}
                                                                    className={`${styles.enabledToolChip} ${isOffline ? styles.enabledToolChipDisabled : ''}`}
                                                                >
                                                                    {toolName}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className={styles.conciseSummaryEmpty}>
                                                            {isOffline
                                                                ? 'Server offline'
                                                                : server.discoveryStatus === 'loading'
                                                                ? 'Checking tools...'
                                                                : 'No tools enabled'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div id={panelId} className={styles.mcpPanelBody}>
                                                <div className={styles.inlineInputRow}>
                                                    <label className={styles.blockLabel}>
                                                        Server Name:
                                                        <input
                                                            type="text"
                                                            value={server.name}
                                                            onChange={(e) => updateMcpServer(server.id, 'name', e.target.value)}
                                                            className={styles.textInput}
                                                            placeholder="dummy_mcp"
                                                        />
                                                    </label>

                                                    <label className={styles.blockLabel}>
                                                        Server URL:
                                                        <input
                                                            type="text"
                                                            value={server.url}
                                                            onChange={(e) => updateMcpServer(server.id, 'url', e.target.value)}
                                                            className={styles.textInput}
                                                            placeholder="http://127.0.0.1:18001/mcp"
                                                        />
                                                    </label>
                                                </div>

                                                <div className={styles.inlineInputRow}>
                                                    <label className={styles.blockLabel}>
                                                        Authorization Token:
                                                        <input
                                                            type="password"
                                                            value={server.authorizationToken}
                                                            onChange={(e) => updateMcpServer(server.id, 'authorizationToken', e.target.value)}
                                                            className={styles.textInput}
                                                            placeholder="Optional bearer token"
                                                        />
                                                    </label>
                                                </div>

                                                <div className={styles.settingGroup}>
                                                    <label className={styles.blockLabel}>
                                                        Headers JSON:
                                                        <textarea
                                                            value={server.headersText}
                                                            onChange={(e) => updateMcpServer(server.id, 'headersText', e.target.value)}
                                                            rows={4}
                                                            placeholder='{"x-custom-header":"value"}'
                                                            className={styles.textArea}
                                                        />
                                                    </label>
                                                    <div className={styles.sectionHint}>
                                                        Use a JSON object. Invalid JSON will be ignored.
                                                    </div>
                                                </div>

                                                <McpServerToolPanel server={server} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>


            <button onClick={saveSettings} className={styles.saveButton}>
                Save Settings
            </button>

            {isDeleteHistoryModalOpen && (
                <div className={styles.modalOverlay} onClick={closeDeleteHistoryModal}>
                    <div
                        className={styles.modalCard}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-history-title"
                    >
                        <h3 id="delete-history-title" className={styles.modalTitle}>Delete All Chat History</h3>
                        <p className={styles.modalText}>
                            This action cannot be undone. Type <code>delete</code> below to permanently remove all saved conversations.
                        </p>
                        <label className={styles.blockLabel}>
                            Confirmation:
                            <input
                                type="text"
                                value={deleteConfirmationText}
                                onChange={(e) => {
                                    setDeleteConfirmationText(e.target.value);
                                    if (deleteHistoryError) {
                                        setDeleteHistoryError('');
                                    }
                                }}
                                className={styles.textInput}
                                placeholder='Type "delete" to confirm'
                                autoFocus
                            />
                        </label>
                        {deleteHistoryError && (
                            <div className={styles.errorText}>{deleteHistoryError}</div>
                        )}
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                onClick={closeDeleteHistoryModal}
                                className={styles.secondaryButton}
                                disabled={isDeletingHistory}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAllHistory}
                                className={styles.dangerButton}
                                disabled={isDeletingHistory || deleteConfirmationText.trim().toLowerCase() !== 'delete'}
                            >
                                {isDeletingHistory ? 'Deleting...' : 'Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default SettingsPage;
