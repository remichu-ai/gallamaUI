// eslint-disable-next-line no-unused-vars
import React, {Suspense, lazy, useEffect} from 'react';
import '../css/Main.css';
import {ChatComponent} from '../components/Main/ChatComponent.jsx';
import TopBar from "../components/TopBar/TopBar.jsx";
import styles from "./Main.module.css";
import useUIStore from "../store/uiStore.js";
import {initializeWithRealData} from "../initialization.jsx";
import '../css/themes.css';

const MOBILE_LAYOUT_QUERY = '(max-width: 820px)';
const Sidebar = lazy(() => import('../components/Sidebar/Sidebar.jsx'));
const ModelManagement = lazy(() => import('./ModelManagement.jsx'));
const SettingsPage = lazy(() => import('./SettingPage.jsx'));

const Main = ({useRealDataInitialization = true}) => {
    const {
        showSettingPage,
        showModelManagementPage,
        sidebarExtended,
        isMobileViewport,
        setIsMobileViewport,
    } = useUIStore()

    useEffect(() => {
        if (useRealDataInitialization) {
            initializeWithRealData();
        }
        // UI setup that should happen regardless of data initialization
        const uiStore = useUIStore.getState();
        uiStore.showChatComponent = true;
    }, [useRealDataInitialization]);

    const {currentTheme} = useUIStore();
    useEffect(() => {
        document.body.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const mediaQuery = window.matchMedia(MOBILE_LAYOUT_QUERY);

        const syncViewport = (event) => {
            const matches = 'matches' in event ? event.matches : mediaQuery.matches;
            setIsMobileViewport(matches);
        };

        syncViewport(mediaQuery);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncViewport);
            return () => mediaQuery.removeEventListener('change', syncViewport);
        }

        mediaQuery.addListener(syncViewport);
        return () => mediaQuery.removeListener(syncViewport);
    }, [setIsMobileViewport]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const rootStyle = document.documentElement.style;
        const visualViewport = window.visualViewport;
        const delayedSyncs = [];

        const syncAppHeight = () => {
            const viewportOffsetTop = Math.max(0, Math.round(visualViewport?.offsetTop ?? 0));
            const layoutViewportHeight = Math.round(window.innerHeight);
            const visibleViewportHeight = Math.round(visualViewport?.height ?? layoutViewportHeight);
            const appHeight = Math.max(
                0,
                Math.min(layoutViewportHeight, visibleViewportHeight + viewportOffsetTop),
            );
            const obscuredBottomInset = Math.max(
                0,
                layoutViewportHeight - viewportOffsetTop - visibleViewportHeight,
            );

            rootStyle.setProperty('--app-height', `${appHeight}px`);
            rootStyle.setProperty('--visual-viewport-height', `${visibleViewportHeight}px`);
            rootStyle.setProperty('--visual-viewport-offset-top', `${viewportOffsetTop}px`);
            rootStyle.setProperty('--visual-viewport-bottom-inset', `${obscuredBottomInset}px`);
        };

        syncAppHeight();
        delayedSyncs.push(window.setTimeout(syncAppHeight, 150));
        delayedSyncs.push(window.setTimeout(syncAppHeight, 500));

        window.addEventListener('resize', syncAppHeight);
        window.addEventListener('orientationchange', syncAppHeight);
        window.addEventListener('pageshow', syncAppHeight);

        if (visualViewport) {
            visualViewport.addEventListener('resize', syncAppHeight);
            visualViewport.addEventListener('scroll', syncAppHeight);
        }

        return () => {
            window.removeEventListener('resize', syncAppHeight);
            window.removeEventListener('orientationchange', syncAppHeight);
            window.removeEventListener('pageshow', syncAppHeight);

            if (visualViewport) {
                visualViewport.removeEventListener('resize', syncAppHeight);
                visualViewport.removeEventListener('scroll', syncAppHeight);
            }

            delayedSyncs.forEach((timeoutId) => window.clearTimeout(timeoutId));

            rootStyle.removeProperty('--app-height');
            rootStyle.removeProperty('--visual-viewport-height');
            rootStyle.removeProperty('--visual-viewport-offset-top');
            rootStyle.removeProperty('--visual-viewport-bottom-inset');
        };
    }, []);

    const shouldShowTopBar = isMobileViewport || (!showSettingPage && !showModelManagementPage);

    return (
        <div className={`${styles.mainContainer} ${sidebarExtended ? styles.sidebarExpanded : ''} ${isMobileViewport ? styles.mobileLayout : ''}`}>
            <Suspense fallback={<div className={styles.sidebarPlaceholder} aria-hidden="true" />}>
                <Sidebar/>
            </Suspense>
            <div className={styles.topBarAndRest}>
                {shouldShowTopBar && <TopBar/>}
                {showSettingPage && (
                    <Suspense fallback={<div className={styles.settingPage} />}>
                        <div className={styles.settingPage}>
                            <SettingsPage/>
                        </div>
                    </Suspense>
                )}
                {showModelManagementPage && (
                    <Suspense fallback={<div className={styles.settingPage} />}>
                        <div className={styles.settingPage}>
                            <ModelManagement/>
                        </div>
                    </Suspense>
                )}
                {!showSettingPage && !showModelManagementPage && (
                    <div className={styles.chatComContainer}>
                        <ChatComponent/>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Main
