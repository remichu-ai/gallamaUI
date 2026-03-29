import { useEffect } from 'react';
import useModelManagementStore from '../../store/modelManagementStore';
import styles from './LoadedModels.module.css';

const LoadedModels = () => {
    const { isLoading, loadedModels, fetchLoadedModels, stopModelByPort } = useModelManagementStore();
    const loadedEntries = Object.entries(loadedModels).flatMap(([modelName, modelData]) =>
        (modelData.instances || []).map((instance) => ({
            modelName,
            port: instance.port,
            status: instance.status,
        }))
    );

    useEffect(() => {
        fetchLoadedModels();
    }, [fetchLoadedModels]);

    const handleUnloadModel = async (port) => {
        await stopModelByPort(port);
        fetchLoadedModels();  // Refresh the list after unloading
    };

    return (
        <section className={styles.container}>
            <div className={styles.headerContainer}>
                <div>
                    <p className={styles.eyebrow}>Runtime</p>
                    <h2 className={styles.header}>Loaded Models</h2>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.countPill}>{loadedEntries.length} active</span>
                    <button
                        onClick={fetchLoadedModels}
                        className={`${styles.refreshButton} ${isLoading ? styles.spin : ''}`}
                        aria-label="Refresh loaded models"
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                        </svg>
                    </button>
                </div>
            </div>

            {loadedEntries.length > 0 ? (
                <div className={styles.list}>
                    {loadedEntries.map((entry) => (
                        <article key={`${entry.modelName}-${entry.port}`} className={styles.listItem}>
                            <div className={styles.modelInfo}>
                                <div className={styles.modelNameRow}>
                                    <h3 className={styles.modelName}>{entry.modelName}</h3>
                                    <span className={`${styles.statusPill} ${entry.status === 'running' ? styles.statusRunning : styles.statusNeutral}`}>
                                        {entry.status || 'unknown'}
                                    </span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span className={styles.metaPill}>Port {entry.port}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleUnloadModel(entry.port)}
                                className={styles.unloadButton}
                                type="button"
                            >
                                Unload
                            </button>
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    No models are loaded right now. When you start one, it will appear here with quick unload controls.
                </div>
            )}
        </section>
    );
};

export default LoadedModels;
