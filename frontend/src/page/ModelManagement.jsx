import React, { useEffect, useState } from 'react';
import {
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box,
    FormControl, FormLabel, Input, Select
} from '@chakra-ui/react';
import LoadedModels from '../components/ModelManagement/LoadedModels.jsx'
import useModelManagementStore from '../store/modelManagementStore.js';
import styles from './ModelManagement.module.css';

const getModelSelectionId = (modelData) => modelData.model_id || modelData.model;

const formatFieldLabel = (value) => value.replace(/_/g, ' ');

const ModelManagement = () => {
    const { availableModels, fetchAvailableModels, loadModel } = useModelManagementStore();
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedModelData, setSelectedModelData] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchAvailableModels();
    }, [fetchAvailableModels]);

    const openFormForModel = (modelData) => {
        const selectionId = getModelSelectionId(modelData);
        setSelectedModel(selectionId);
        setSelectedModelData(modelData);
        setFormData(prev => ({
            ...prev,
            [selectionId]: {
                ...prev[selectionId],
                gpus: modelData.gpus || [],
                cache_size: modelData.cache_size || '',
                cache_quant: modelData.cache_quant || 'Q4',
                max_seq_len: modelData.max_seq_len || '',
                tensor_parallel: modelData.tensor_parallel || false,
                draft_model_id: '',
                draft_model_name: '',
                draft_gpus: [],
                draft_cache_size: '',
                draft_cache_quant: 'Q4',
            }
        }));
    };

    const handleChange = (e, modelId) => {
        const { name, value, type, checked } = e.target;

        if (name === 'cache_size') {
            setFormData(prev => ({
                ...prev,
                [modelId]: {
                    ...prev[modelId],
                    [name]: value,
                    draft_cache_size: value, // Sync draft_cache_size with cache_size
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [modelId]: {
                    ...prev[modelId],
                    [name]: type === 'checkbox' ? checked : value
                }
            }));
        }
    };

    const handleSubmit = async (modelId) => {
        const modelData = availableModels.find((model) => getModelSelectionId(model) === modelId);
        if (!modelData) {
            return;
        }

        let gpus = formData[modelId]?.gpus ?? [];
        if (typeof gpus === 'string') {
            gpus = gpus.split(',').map(gpu => parseFloat(gpu.trim())).filter(gpu => !isNaN(gpu));
        }
        if (!Array.isArray(gpus)) {
            gpus = [];
        }

        let draft_gpus = formData[modelId]?.draft_gpus ?? [];
        if (typeof draft_gpus === 'string') {
            draft_gpus = draft_gpus.split(',').map(gpu => parseFloat(gpu.trim())).filter(gpu => !isNaN(gpu));
        }
        if (!Array.isArray(draft_gpus)) {
            draft_gpus = [];
        }

        const payload = {
            model_id: modelData.model,
            model_name: formData[modelId]?.model_name || null,
            gpus: gpus.length > 0 ? gpus : null,
            cache_size: formData[modelId]?.cache_size ? parseInt(formData[modelId].cache_size) : null,
            cache_quant: formData[modelId]?.cache_quant || 'Q4',
            max_seq_len: formData[modelId]?.max_seq_len ? parseInt(formData[modelId].max_seq_len) : null,
            backend: modelData.backend || null,
            tensor_parallel: formData[modelId]?.tensor_parallel || false,
            draft_model_id: formData[modelId]?.draft_model_id || null,
            draft_model_name: formData[modelId]?.draft_model_name || null,
            draft_gpus: draft_gpus.length > 0 ? draft_gpus : null,
            draft_cache_size: formData[modelId]?.draft_cache_size ? parseInt(formData[modelId].draft_cache_size) : null,
            draft_cache_quant: formData[modelId]?.draft_cache_quant || 'Q4',
        };

        await loadModel(payload);
    };

    const renderValue = (value) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            const entries = Object.entries(value);
            if (entries.length === 0) {
                return 'N/A';
            }

            return (
                <div className={styles.objectValue}>
                    {entries.map(([subKey, subValue]) => (
                        <div key={subKey} className={styles.objectValueRow}>
                            <strong>{formatFieldLabel(subKey)}:</strong> {String(subValue)}
                        </div>
                    ))}
                </div>
            );
        }

        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : 'N/A';
        }

        return String(value);
    };

    return (
        <div className={styles.container}>
            <div className={styles.settingContainer}>
                <section className={styles.settingColumn1}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.eyebrow}>Model catalog</p>
                            <h2 className={styles.header}>Available Models</h2>
                            <p className={styles.panelHint}>
                                Browse the installed catalog, inspect model metadata, then open a compact load form on the right.
                            </p>
                        </div>
                        <span className={styles.countPill}>{availableModels.length} models</span>
                    </div>

                    <div className={styles.accordionScroller}>
                        {availableModels.length > 0 ? (
                            <Accordion allowToggle className={styles.modelAccordion}>
                                {availableModels.map((modelData) => {
                                    const { model, backend } = modelData;
                                    const selectionId = getModelSelectionId(modelData);
                                    const isSelected = selectedModel === selectionId;

                                    return (
                                        <AccordionItem key={`${selectionId}-${backend}`} className={styles.modelItem}>
                                            <h3>
                                                <AccordionButton
                                                    onClick={() => openFormForModel(modelData)}
                                                    className={styles.modelTrigger}
                                                >
                                                    <Box className={styles.modelButtonContent}>
                                                        <div className={styles.modelTopLine}>
                                                            <span className={styles.modelName}>{model}</span>
                                                            <span className={styles.backendPill}>{backend || 'Unknown backend'}</span>
                                                            {isSelected && <span className={styles.selectedPill}>Selected</span>}
                                                        </div>
                                                        <span className={styles.modelPath}>{selectionId}</span>
                                                    </Box>
                                                    <AccordionIcon className={styles.accordionIcon} />
                                                </AccordionButton>
                                            </h3>
                                            <AccordionPanel className={styles.modelPanel}>
                                                <div className={styles.modelFieldGrid}>
                                                    {Object.entries(modelData).map(([key, value]) => {
                                                        if (key === 'model' || key === 'backend') {
                                                            return null;
                                                        }

                                                        return (
                                                            <div key={key} className={styles.modelField}>
                                                                <span className={styles.fieldLabel}>{formatFieldLabel(key)}</span>
                                                                <div className={styles.fieldValue}>{renderValue(value)}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionPanel>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        ) : (
                            <div className={styles.emptyState}>
                                No models were returned by the backend yet. Refresh the backend connection and this catalog will populate here.
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.settingColumn2}>
                    <div className={styles.loadedModelContainer}>
                        <LoadedModels />
                    </div>

                    {selectedModel && selectedModelData && (
                        <div className={styles.loadModelFormContainer}>
                            <div className={styles.loadModelHeader}>
                                <div>
                                    <p className={styles.eyebrow}>Launch configuration</p>
                                    <h2 className={styles.header}>Load {selectedModelData.model}</h2>
                                    <p className={styles.subHeader}>{selectedModel}</p>
                                </div>
                                <span className={styles.backendPill}>{selectedModelData.backend || 'Unknown backend'}</span>
                            </div>

                            <p className={styles.formIntro}>
                                Tune only the fields you care about. Blank values fall back to the server defaults.
                            </p>

                            <div className={styles.formGrid}>
                                <FormControl mb={0} className={styles.formControl}>
                                    <FormLabel className={styles.formLabel}>Max Sequence Length</FormLabel>
                                    <Input
                                        size="sm"
                                        name="max_seq_len"
                                        value={formData[selectedModel]?.max_seq_len || ''}
                                        onChange={(e) => handleChange(e, selectedModel)}
                                        placeholder="Enter max sequence length"
                                        className={styles.textInput}
                                    />
                                </FormControl>

                                <FormControl mb={0} className={styles.formControl}>
                                    <FormLabel className={styles.formLabel}>Cache Size</FormLabel>
                                    <Input
                                        size="sm"
                                        name="cache_size"
                                        value={formData[selectedModel]?.cache_size || ''}
                                        onChange={(e) => handleChange(e, selectedModel)}
                                        placeholder="Leave blank to match max sequence"
                                        className={styles.textInput}
                                    />
                                </FormControl>

                                <FormControl mb={0} className={styles.formControl}>
                                    <FormLabel className={styles.formLabel}>Cache Quantization</FormLabel>
                                    <Select
                                        size="sm"
                                        name="cache_quant"
                                        value={formData[selectedModel]?.cache_quant || 'Q4'}
                                        onChange={(e) => handleChange(e, selectedModel)}
                                        className={styles.selectInput}
                                    >
                                        <option value="Q4">Q4</option>
                                        <option value="Q6">Q6</option>
                                        <option value="Q8">Q8</option>
                                        <option value="FP16">FP16</option>
                                    </Select>
                                </FormControl>

                                <FormControl mb={0} className={`${styles.formControl} ${styles.formControlWide}`}>
                                    <FormLabel className={styles.formLabel}>GPU Limits</FormLabel>
                                    <Input
                                        size="sm"
                                        name="gpus"
                                        value={formData[selectedModel]?.gpus || ''}
                                        onChange={(e) => handleChange(e, selectedModel)}
                                        placeholder="Example: 20,20,15"
                                        className={styles.textInput}
                                    />
                                </FormControl>

                                <div className={`${styles.formControl} ${styles.formControlWide}`}>
                                    <label className={styles.checkboxRow}>
                                        <input
                                            type="checkbox"
                                            name="tensor_parallel"
                                            checked={formData[selectedModel]?.tensor_parallel || false}
                                            onChange={(e) => handleChange(e, selectedModel)}
                                            className={styles.checkboxInput}
                                        />
                                        <span className={styles.checkboxCopy}>
                                            <strong>Tensor Parallel</strong>
                                            <span>Recommended only for Qwen2/2.5-72B, Llama 3.1-70B, and Mistral Large.</span>
                                        </span>
                                    </label>
                                </div>

                                <FormControl mb={0} className={`${styles.formControl} ${styles.formControlWide}`}>
                                    <FormLabel className={styles.formLabel}>Draft Model</FormLabel>
                                    <Select
                                        size="sm"
                                        name="draft_model_id"
                                        value={formData[selectedModel]?.draft_model_id || ''}
                                        onChange={(e) => handleChange(e, selectedModel)}
                                        className={styles.selectInput}
                                    >
                                        <option value="">None</option>
                                        {availableModels.map((modelOption) => (
                                            <option key={modelOption.model} value={modelOption.model}>
                                                {modelOption.model}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl mb={0} className={styles.formControl}>
                                    <FormLabel className={styles.formLabel}>Draft Cache Quantization</FormLabel>
                                    <Select
                                        size="sm"
                                        name="draft_cache_quant"
                                        value={formData[selectedModel]?.draft_cache_quant || 'Q4'}
                                        onChange={(e) => handleChange(e, selectedModel)}
                                        className={styles.selectInput}
                                    >
                                        <option value="Q4">Q4</option>
                                        <option value="Q6">Q6</option>
                                        <option value="Q8">Q8</option>
                                        <option value="FP16">FP16</option>
                                    </Select>
                                </FormControl>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSubmit(selectedModel)}
                                className={styles.saveButton}
                            >
                                Load Model
                            </button>
                        </div>
                    )}

                    {!selectedModel && (
                        <div className={styles.emptySelectionCard}>
                            <p className={styles.eyebrow}>No model selected</p>
                            <h2 className={styles.header}>Pick a model to configure it</h2>
                            <p className={styles.panelHint}>
                                Selecting a model from the left opens a trimmed-down launch form here with cache, GPU, and draft settings.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ModelManagement;
