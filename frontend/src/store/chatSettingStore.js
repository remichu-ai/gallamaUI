import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

            // XML template selection from external file
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
