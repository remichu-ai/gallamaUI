import React, {useEffect, useState} from 'react';
import styles from './SettingPage.module.css';
import useChatSettingStore from '../store/chatSettingStore';
import useApiKeyStore from '../store/apiKeyStore';
import {queryAvailableModels} from '../services/queryAvailableModels';
import useUIStore from '../store/uiStore';
import thinkingTemplates from "../data/thinkingTemplates.js";


const ReturnThinkingDropdown = () => {
    const {returnThinking, returnThinkingOptions, setReturnThinking} = useChatSettingStore();

    const handleChange = (event) => {
        setReturnThinking(event.target.value);
    };

    return (
        <select className={styles.selectInput} value={returnThinking} onChange={handleChange}>
            {returnThinkingOptions.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
};

const SettingsPage = () => {
    const {
        useArtifact,
        toggleUseArtifact,
        temperature,
        setTemperature,
        systemPrompt,
        setSystemPrompt,
        useThinking,
        toggleUseThinking,
        thinking,
        setThinking,
        return_thinking,
        setReturnThinking,
        selectedTemplate,
        setSelectedTemplate,
        saveSettings
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
        showThinking,
        toggleShowThinking
    } = useUIStore();

    const [xmlError, setXmlError] = useState(''); // State to store XML error message
    const [templateXML, setTemplateXML] = useState('');


    useEffect(() => {
        const fetchModels = async () => {
            const models = await queryAvailableModels();
            setAvailableModels(selectedService, models);
        };
        fetchModels();
    }, [selectedService, setAvailableModels]);

    const availableModels = getAvailableModels();
    const selectedModel = getSelectedModel();

    // Function to validate XML format
    const validateXML = (xmlString) => {
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(xmlString, 'text/xml');
        const parseError = parsedDoc.getElementsByTagName('parsererror');

        if (parseError.length > 0) {
            return 'Invalid XML format';
        }
        return '';
    };

    const isValidXML = (xmlString) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlString, 'application/xml');
            return !doc.querySelector('parsererror');
        } catch (e) {
            return false;
        }
    };


    // Handle changes in the Thinking XML textarea
    const handleThinkingChange = (e) => {
        const updatedThinking = e.target.value;
        setThinking(updatedThinking);

        // Validate XML on each change
        const error = validateXML(updatedThinking);
        setXmlError(error);
    };

    const handleLoadTemplate = () => {
        if (isValidXML(templateXML)) {
            setThinking(templateXML);
            setXmlError(''); // Clear error
        } else {
            setXmlError('Invalid XML format');
        }
    };

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
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                    className={styles.rangeInput}
                                />
                                {temperature}
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

                        {/* Template Dropdown and Load Button */}
                        <div className={styles.settingGroup}>
                            {/* Chain of Thought Settings */}
                            <h4 className={styles.subHeader}>Thinking Settings</h4>
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
                            </div>
                            <div className={styles.settingGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={showThinking}
                                        onChange={toggleShowThinking}
                                        className={styles.checkbox}
                                    />
                                    Show Thinking
                                </label>
                            </div>
                            {/* Conditionally show the returnThinking dropdown if useThinking is selected */}
                            {useThinking && (
                                <div className={styles.settingGroup}>
                                    <label className={styles.blockLabel}>
                                        Return Chain of Thought:
                                        <ReturnThinkingDropdown/>
                                    </label>
                                </div>
                            )}

                            <label className={styles.blockLabel}>
                                Select Thinking Template:
                                <select
                                    onChange={(e) => setTemplateXML(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    <option value="">Select a template...</option>
                                    {thinkingTemplates.map((template, index) => (
                                        <option key={index} value={template.xml}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <button onClick={handleLoadTemplate} className={styles.loadButton}>
                            Load Template
                        </button>

                        <div className={styles.settingGroup}>
                            <label className={styles.blockLabel}>
                                Thinking XML:
                                <textarea
                                    value={thinking}
                                    onChange={handleThinkingChange}
                                    rows={12}
                                    placeholder="Enter your custom thinking XML..."
                                    className={styles.textArea}
                                />
                                {xmlError && <div className={styles.errorText}>{xmlError}</div>}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={saveSettings} className={styles.saveButton}>
                Save Settings
            </button>
        </div>
    );
};

export default SettingsPage;
