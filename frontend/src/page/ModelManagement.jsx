import React, {useEffect, useState} from 'react';
import {
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box,
    Button, FormControl, FormLabel, Input, Checkbox, Select
} from '@chakra-ui/react';
import {Divider} from '@chakra-ui/react'
import LoadedModels from '../components/ModelManagement/LoadedModels.jsx'
import useModelManagementStore from '../store/modelManagementStore.js';
import useUIStore from "../store/uiStore.js";
import styles from './ModelManagement.module.css';

const ModelManagement = () => {
    const {availableModels, fetchAvailableModels, loadModel} = useModelManagementStore();
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedModelData, setSelectedModelData] = useState(null); // Add a state to store model data
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchAvailableModels();
    }, [fetchAvailableModels]);

    const openFormForModel = (modelData) => {
        setSelectedModel(modelData.model_id); // Keep selected model_id
        setSelectedModelData(modelData); // Store model data separately
        setFormData(prev => ({
            ...prev,
            [modelData.model_id]: {
                ...prev[modelData.model_id],
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
        const {name, value, type, checked} = e.target;

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
        const modelData = availableModels.find(m => m.model_id === modelId);

        let gpus = formData[modelId]?.gpus;
        if (typeof gpus === 'string') {
            gpus = gpus.split(',').map(gpu => parseFloat(gpu.trim())).filter(gpu => !isNaN(gpu));
        }

        let draft_gpus = formData[modelId]?.draft_gpus;
        if (typeof draft_gpus === 'string') {
            draft_gpus = draft_gpus.split(',').map(gpu => parseFloat(gpu.trim())).filter(gpu => !isNaN(gpu));
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
        // Check for undefined or null values
        if (value === null || value === undefined) {
            return 'N/A';  // Or return any placeholder you prefer
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            // If value is an object, we render its key-value pairs
            return (
                <div>
                    {Object.entries(value).map(([subKey, subValue]) => (
                        <div key={subKey}>
                            <strong>{subKey}:</strong> {String(subValue)}
                        </div>
                    ))}
                </div>
            );
        }

        return Array.isArray(value) ? value.join(', ') : String(value);
    };


    return (
        <div className={styles.container}>
            <div className={styles.settingContainer}>
                <div className={styles.settingColumn1}>
                    <h2 className={styles.header}>Available Models</h2>
                    <Accordion allowToggle>
                        {availableModels.map((modelData) => {
                            console.log('modelData:', modelData); // Check the structure of modelData

                            const {model, backend} = modelData;

                            return (
                                <AccordionItem key={`${model}-${backend}`}>
                                    <h2>
                                        <AccordionButton onClick={() => openFormForModel(modelData)}>
                                            <Box flex="1" textAlign="left">
                                                {model} (Backend: {backend})
                                            </Box>
                                            <AccordionIcon/>
                                        </AccordionButton>
                                    </h2>
                                    <AccordionPanel pb={4}>
                                        {Object.entries(modelData).map(([key, value]) => {
                                            if (key !== 'model' && key !== 'backend') {
                                                return (
                                                    <div key={key}>
                                                        <strong>{key}:</strong> {renderValue(value)}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </AccordionPanel>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
                <div className={styles.settingColumn2}>
                    <div className={styles.loadedModelContainer}>
                        <LoadedModels/>
                    </div>
                    {selectedModel && selectedModelData && (
                        <div className={styles.loadModelFormContainer}>
                            <h2 className={styles.header}>
                                Load Model: {selectedModelData.model}
                            </h2>
                            <h4 className={styles.subHeader}>
                                Path: {selectedModel}
                            </h4>
                            {/* Max Sequence Length */}
                            <FormControl mb={4}>
                                <FormLabel>Max Sequence Length</FormLabel>
                                <Input
                                    name="max_seq_len"
                                    value={formData[selectedModel]?.max_seq_len || ''}
                                    onChange={(e) => handleChange(e, selectedModel)}
                                    placeholder="Enter max sequence length"
                                    className={styles.textInput}
                                />
                            </FormControl>

                            {/* Cache Size */}
                            <FormControl mb={4}>
                                <FormLabel>Cache Size (must be >= max_seq_len). Leave blank to default to
                                    max_seq_len</FormLabel>
                                <Input
                                    name="cache_size"
                                    value={formData[selectedModel]?.cache_size || ''}
                                    onChange={(e) => handleChange(e, selectedModel)}
                                    placeholder="Enter cache size"
                                    className={styles.textInput}
                                />
                            </FormControl>

                            {/* Cache Quant */}
                            <FormControl mb={4}>
                                <FormLabel>Cache Quantization. Default is Q4</FormLabel>
                                <Select
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
                            <FormControl mb={4}>
                                <FormLabel>GPUs. Default to auto. Else specify the GB to stay within by GPU. e.g.
                                    20,20,15 mean: 20GB max for each of 2 first GPUs and 15GB limit for the 3rd
                                    GPU</FormLabel>
                                <Input
                                    name="gpus"
                                    value={formData[selectedModel]?.gpus || ''}
                                    onChange={(e) => handleChange(e, selectedModel)}
                                    placeholder="Enter GPU values"
                                    className={styles.textInput}
                                />
                            </FormControl>
                            <FormControl mb={4} display="flex" alignItems="center">
                                <FormLabel ml={2}>Tensor Parallel (Only for Qwen2/2.5-72B, Llama 3.1-70B and Mistral
                                    Large)</FormLabel>
                                <Checkbox
                                    name="tensor_parallel"
                                    isChecked={formData[selectedModel]?.tensor_parallel || false}
                                    onChange={(e) => handleChange(e, selectedModel)}
                                    className={styles.checkbox}
                                />
                            </FormControl>

                            {/* Draft Model */}
                            <FormControl mb={4}>
                                <FormLabel>Select Draft Model (Optional)</FormLabel>
                                <Select
                                    name="draft_model_id"
                                    value={formData[selectedModel]?.draft_model_id || ''}
                                    onChange={(e) => handleChange(e, selectedModel)}
                                    className={styles.selectInput}
                                >
                                    <option value="">None</option>
                                    {/* Default option for no draft model */}
                                    {availableModels.map((model) => (
                                        <option key={model.model} value={model.model}>
                                            {model.model}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Draft Cache Quant */}
                            <FormControl mb={4}>
                                <FormLabel>Draft Cache Quantization. Default is Q4</FormLabel>
                                <Select
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

                            <Button colorScheme="blue" mt={4} onClick={() => handleSubmit(selectedModel)}
                                    className={styles.saveButton}>
                                Load Model
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelManagement;