import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import thinkingTemplates from '../data/thinkingTemplates'; // Import the templates

const useChatSettingStore = create(
    persist(
        (set) => ({
            useArtifact: true,
            toggleUseArtifact: () => set((state) => ({ useArtifact: !state.useArtifact })),
            temperature: 0.3,
            setTemperature: (newTemperature) => set({ temperature: newTemperature }),
            modelList: ["default", "gpt-3.5-turbo", "gpt-4"],
            selectedModel: "default",
            setSelectedModel: (newModel) => set({ selectedModel: newModel }),

            // New fields for chain of thought thinking
            useThinking: false,
            toggleUseThinking: () => set((state) => {
                const newUseThinking = !state.useThinking;
                // Update returnThinking to 'Seperate' if useThinking is enabled
                return {
                    useThinking: newUseThinking,
                    returnThinking: newUseThinking ? 'Seperate' : state.returnThinking
                };
            }),
            thinking: '',
            returnThinkingOptions: ['Yes', 'No', 'Seperate'], // List of options
            returnThinking: 'Seperate', // Default value
            setThinking: (newThinking) => set({ thinking: newThinking.trim() }),
            setReturnThinking: (newReturnThinking) => set({ returnThinking: newReturnThinking }),

            // XML template selection from external file
            thinkingTemplates: thinkingTemplates,
            selectedTemplate: '',
            setSelectedTemplate: (template) => set({ selectedTemplate: template }),
        }),
        {
            name: 'chat-settings-storage', // Name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
);

export default useChatSettingStore;
