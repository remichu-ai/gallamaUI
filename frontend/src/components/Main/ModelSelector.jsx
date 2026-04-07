import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import useApiKeyStore from "../../store/apiKeyStore.js";
import useModelManagementStore from "../../store/modelManagementStore.js";
import styles from './ModelSelector.module.css';

const ModelSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { getSelectedModel, setSelectedModel: storeSetSelectedModel } = useApiKeyStore();
  const { loadedModels, fetchLoadedModels, isLoading } = useModelManagementStore();
  const selectedModel = getSelectedModel();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (Object.keys(loadedModels).length === 0) {
      fetchLoadedModels();
    }
  }, [fetchLoadedModels, loadedModels]);

  useEffect(() => {
    const modelKeys = Object.keys(loadedModels);
    if (!selectedModel && modelKeys.length === 1) {
      storeSetSelectedModel('gallama', modelKeys[0]);
    }
  }, [loadedModels, selectedModel, storeSetSelectedModel]);

  const handleModelSelect = (modelName) => {
    storeSetSelectedModel('gallama', modelName);
    setIsOpen(false);
  };

  // Filter out the currently selected model from the dropdown options
  const availableModels = Object.entries(loadedModels).filter(
    ([modelName]) => modelName !== selectedModel
  );

  return (
    <div className={styles.selectorRoot} ref={dropdownRef}>
      <button
        type="button"
        className={styles.selectorButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.selectorLabel}>
          {selectedModel || 'No model selected'}
        </span>
        {isOpen ? (
          <ChevronUp className={styles.selectorIcon} />
        ) : (
          <ChevronDown className={styles.selectorIcon} />
        )}
      </button>

      {isOpen && availableModels.length > 0 && (
        <div className={styles.dropdown}>
          {availableModels.map(([modelName]) => (
            <div
              key={modelName}
              className={styles.option}
              onClick={() => handleModelSelect(modelName)}
            >
              {modelName}
            </div>
          ))}
        </div>
      )}

      {isOpen && availableModels.length === 0 && !selectedModel && (
        <div className={styles.dropdown}>
          <div className={styles.emptyState}>
          No models available
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
