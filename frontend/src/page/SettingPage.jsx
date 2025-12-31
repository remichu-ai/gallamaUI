import React, { useEffect, useState } from 'react';
import styles from './SettingPage.module.css';
import useChatSettingStore from '../store/chatSettingStore';
import useApiKeyStore from '../store/apiKeyStore';
import { queryAvailableModels } from '../services/queryAvailableModels';
import useUIStore from '../store/uiStore';





const SettingsPage = () => {
    const {
        useArtifact,
        toggleUseArtifact,
        temperature,
        setTemperature,
        topP,
        setTopP,
        systemPrompt,
        setSystemPrompt,
        saveSettings,
        maxImageWidth,
        setMaxImageWidth,
        maxImageHeight,
        setMaxImageHeight
    } = useChatSettingStore();

    const {
        apiKeys,
        selectedService,
        services,
        updateApiKey,
        selectService,
        setAvailableModels,
        getAvailableModels,
        setSelectedModel,
        getSelectedModel
    } = useApiKeyStore();

    const {
        themes,
        currentTheme,
        setTheme,
        showReasoning,
        toggleShowReasoning
    } = useUIStore();




    useEffect(() => {
        const fetchModels = async () => {
            const models = await queryAvailableModels();
            setAvailableModels(selectedService, models);
        };
        fetchModels();
    }, [selectedService, setAvailableModels]);

    const availableModels = getAvailableModels();
    const selectedModel = getSelectedModel();




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
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <h3 className={styles.subHeader}>API Settings</h3>

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

                    </div>
                </div>
                <div className={styles.settingColumn2}>
                    <div className={styles.settingColumn}>
                        <h3 className={styles.subHeader}>Chat Settings</h3>

                        {/* Use Artifact Mode Setting */}
                        <h3 className={styles.subHeader}>Artifact Mode</h3>
                        <div className={styles.settingGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={useArtifact}
                                    onChange={toggleUseArtifact}
                                    className={styles.checkbox}
                                />
                                Use Artifact Mode
                            </label>
                        </div>

                        {/* Chain of Thought Settings */}
                        <h4 className={styles.subHeader}>Reasoning Settings</h4>
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
                    </div>
                </div>
            </div>


            <button onClick={saveSettings} className={styles.saveButton}>
                Save Settings
            </button>
        </div >
    );
};

export default SettingsPage;
