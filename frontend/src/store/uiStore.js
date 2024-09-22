import {create} from 'zustand';

const useUIStore = create((set) => ({
    showChatComponent: false,
    toggleChatComponent: () => set((state) => ({showChatComponent: !state.showChatComponent})),
    toggleChatComponentOnce: () => set((state) => {
        if (!state.showChatComponent) {
            return {showChatComponent: true};
        }
        return state;
    }),

    // artifact
    showArtifact: false,
    toggleArtifact: () => set((state) => ({showArtifact: !state.showArtifact})),
    toggleArtifactToTrue: () => set(() => ({showArtifact: true})),


    // side bar element
    sidebarExtended: false,
    setSidebarExtended: () => set((state) => ({sidebarExtended: !state.sidebarExtended})),

    // side bar element - Settings
    showSettingPage: false,
    setShowSettingPage: () => set((state) => ({
        showSettingPage: !state.showSettingPage,
        showModelManagementPage: false // Ensure model management page is closed
    })),

    // side bar element - Model Management
    showModelManagementPage: false,
    setShowModelManagementPage: () => set((state) => ({
        showModelManagementPage: !state.showModelManagementPage,
        showSettingPage: false // Ensure settings page is closed
    })),

    showThinking: true,
    toggleShowThinking: () => set((state) => ({showThinking: !state.showThinking})),


    // New theme-related state and actions
    // themes: ['light', 'claude', 'retro'],
    themes: ['retro'],
    currentTheme: 'retro', // default theme
    setTheme: (theme) => set((state) => {
        if (state.themes.includes(theme)) {
            return {currentTheme: theme};
        }
        return state; // If the theme is not valid, don't change the state
    }),
    cycleTheme: () => set((state) => {
        const currentIndex = state.themes.indexOf(state.currentTheme);
        const nextIndex = (currentIndex + 1) % state.themes.length;
        return {currentTheme: state.themes[nextIndex]};
    }),
}));

export default useUIStore;