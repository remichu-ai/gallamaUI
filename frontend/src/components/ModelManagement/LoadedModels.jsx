import { useEffect } from 'react';
import { Box, Button, List, ListItem, Text } from '@chakra-ui/react';
import useModelManagementStore from '../../store/modelManagementStore';
import styles from './LoadedModels.module.css';

const LoadedModels = () => {
    const { isLoading, loadedModels, fetchLoadedModels, stopModelByPort } = useModelManagementStore();

    useEffect(() => {
        fetchLoadedModels();
    }, [fetchLoadedModels]);

    const handleUnloadModel = async (port) => {
        await stopModelByPort(port);
        fetchLoadedModels();  // Refresh the list after unloading
    };

    return (
        <Box className={styles.container}>
            <div className={styles.headerContainer}>
                <h2 className={styles.header}>Loaded Models</h2>
                <button onClick={fetchLoadedModels}
                 className={`${styles.refreshButton} ${isLoading ? styles.spin : ''}`}
                 aria-label="Refresh loaded models">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                    </svg>
                </button>
            </div>
            <List spacing={3}>
                {Object.entries(loadedModels).map(([modelName, modelData]) => (
                    modelData.instances.map((instance, index) => (
                        <ListItem key={index} className={styles.listItem}>
                            <Text>
                                {modelName} (Port: {instance.port}, Status: {instance.status})
                            </Text>
                            <Button
                                onClick={() => handleUnloadModel(instance.port)}
                                colorScheme="teal"
                                variant='solid'
                                size="md"
                            >
                                Unload
                            </Button>
                        </ListItem>
                    ))
                ))}
            </List>
        </Box>
    );
};

export default LoadedModels;