import React from 'react';
import useUIStore from '../store/uiStore.js';

const TestToggle = () => {
    const { showArtifact, toggleArtifact } = useUIStore();

    return (
        <div>
            <button onClick={toggleArtifact}>
                {showArtifact ? 'Hide' : 'Show'}
            </button>
            {showArtifact && <p>Artifact Viewer is visible</p>}
        </div>
    );
};

export default TestToggle;
