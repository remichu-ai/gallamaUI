import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    TOOL_PAYLOAD_FORMAT_JSON,
    TOOL_PAYLOAD_FORMAT_YAML,
} from '../services/toolTraceFormatting.js';

const DEFAULT_TRACE_DISPLAY_MODE = 'modern';
const DEFAULT_TOOL_PAYLOAD_FORMAT = TOOL_PAYLOAD_FORMAT_YAML;

const useUIStore = create(persist((set) => ({
    showChatComponent: false,
    toggleChatComponent: () => set((state) => ({ showChatComponent: !state.showChatComponent })),
    toggleChatComponentOnce: () => set((state) => {
        if (!state.showChatComponent) {
            return { showChatComponent: true };
        }
        return state;
    }),
    // side bar element
    sidebarExtended: false,
    setSidebarExtended: (value) => set((state) => ({
        sidebarExtended: typeof value === 'boolean' ? value : !state.sidebarExtended
    })),
    isMobileViewport: false,
    setIsMobileViewport: (value) => set((state) => {
        const isMobileViewport = Boolean(value);

        if (state.isMobileViewport === isMobileViewport) {
            return state;
        }

        return {
            isMobileViewport,
            sidebarExtended: isMobileViewport ? false : state.sidebarExtended,
            showMcpToolDrawer: isMobileViewport ? false : state.showMcpToolDrawer,
        };
    }),

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

    showReasoning: true,
    toggleShowReasoning: () => set((state) => ({ showReasoning: !state.showReasoning })),
    traceDisplayMode: DEFAULT_TRACE_DISPLAY_MODE,
    hasExplicitTraceDisplayMode: false,
    setTraceDisplayMode: (mode) => set((state) => (
        mode === 'retro' || mode === 'modern'
            ? {
                traceDisplayMode: mode,
                hasExplicitTraceDisplayMode: true,
            }
            : state
    )),
    toolPayloadFormat: DEFAULT_TOOL_PAYLOAD_FORMAT,
    hasExplicitToolPayloadFormat: false,
    setToolPayloadFormat: (format) => set((state) => (
        format === TOOL_PAYLOAD_FORMAT_JSON || format === TOOL_PAYLOAD_FORMAT_YAML
            ? {
                toolPayloadFormat: format,
                hasExplicitToolPayloadFormat: true,
            }
            : state
    )),
    showMcpToolDrawer: true,
    toggleMcpToolDrawer: () => set((state) => ({ showMcpToolDrawer: !state.showMcpToolDrawer })),
    setShowMcpToolDrawer: (value) => set({ showMcpToolDrawer: Boolean(value) }),


    // New theme-related state and actions
    themes: ['retro', 'moonlight', 'moonlight-dark'],
    currentTheme: 'retro', // default theme
    setTheme: (theme) => set((state) => {
        if (state.themes.includes(theme)) {
            return { currentTheme: theme };
        }
        return state; // If the theme is not valid, don't change the state
    }),
    cycleTheme: () => set((state) => {
        const currentIndex = state.themes.indexOf(state.currentTheme);
        const nextIndex = (currentIndex + 1) % state.themes.length;
        return { currentTheme: state.themes[nextIndex] };
    }),
}), {
    name: 'ui-store',
    storage: createJSONStorage(() => localStorage),
    version: 2,
    migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
            return persistedState;
        }

        const hasExplicitTraceDisplayMode = Boolean(persistedState.hasExplicitTraceDisplayMode);
        const hasExplicitToolPayloadFormat = Boolean(persistedState.hasExplicitToolPayloadFormat);
        const persistedTraceDisplayMode = persistedState.traceDisplayMode;
        const persistedToolPayloadFormat = persistedState.toolPayloadFormat;

        return {
            ...persistedState,
            traceDisplayMode: (
                hasExplicitTraceDisplayMode
                && (persistedTraceDisplayMode === 'retro' || persistedTraceDisplayMode === 'modern')
            )
                ? persistedTraceDisplayMode
                : DEFAULT_TRACE_DISPLAY_MODE,
            toolPayloadFormat: (
                hasExplicitToolPayloadFormat
                && (
                    persistedToolPayloadFormat === TOOL_PAYLOAD_FORMAT_JSON
                    || persistedToolPayloadFormat === TOOL_PAYLOAD_FORMAT_YAML
                )
            )
                ? persistedToolPayloadFormat
                : DEFAULT_TOOL_PAYLOAD_FORMAT,
            hasExplicitTraceDisplayMode,
            hasExplicitToolPayloadFormat,
        };
    },
    partialize: (state) => ({
        currentTheme: state.currentTheme,
        showReasoning: state.showReasoning,
        traceDisplayMode: state.traceDisplayMode,
        toolPayloadFormat: state.toolPayloadFormat,
        hasExplicitTraceDisplayMode: state.hasExplicitTraceDisplayMode,
        hasExplicitToolPayloadFormat: state.hasExplicitToolPayloadFormat,
    }),
}));

export default useUIStore;
