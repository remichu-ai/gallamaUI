import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import useApiKeyStore from "../../store/apiKeyStore.js";
import useModelManagementStore from "../../store/modelManagementStore.js";

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
    fetchLoadedModels();
  }, []);

  const handleModelSelect = (modelName) => {
    storeSetSelectedModel('gallama', modelName);
    setIsOpen(false);
  };

  // Filter out the currently selected model from the dropdown options
  const availableModels = Object.entries(loadedModels).filter(
    ([modelName]) => modelName !== selectedModel
  );

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      <div
        className="flex items-center cursor-pointer text-gray-600 hover:text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate max-w-[200px]">
          {selectedModel || 'No model selected'}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 ml-1 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0" />
        )}
      </div>

      {isOpen && availableModels.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {availableModels.map(([modelName, modelInfo]) => (
            <div
              key={modelName}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-700"
              onClick={() => handleModelSelect(modelName)}
            >
              {modelName}
            </div>
          ))}
        </div>
      )}

      {isOpen && availableModels.length === 0 && !selectedModel && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 text-gray-500">
          No models available
        </div>
      )}
    </div>
  );
};

export default ModelSelector;