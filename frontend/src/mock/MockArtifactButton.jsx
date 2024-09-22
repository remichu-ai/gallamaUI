import React, {useState, useEffect} from 'react';
import useChatStore from '../store/chatStore.js'; // Import your Zustand store
import ArtifactButton from '../components/Main/ArtifactButton.jsx'; // Import the ArtifactButton component we created

const ArtifactButtonTestContainer = () => {
    const { messages, visibleArtifactId, setVisibleArtifactId } = useChatStore();

    // Extract all artifacts from messages
    const artifacts = messages.reduce((acc, message) => {
        if (message.artifacts) {
            Object.entries(message.artifacts).forEach(([identifier, artifact]) => {
                if (!acc.some(a => a.identifier === identifier)) {
                    acc.push({
                        identifier,
                        title: artifact.title,
                        type: artifact.artifact_type
                    });
                }
            });
        }
        return acc;
    }, []);

    const handleArtifactClick = (identifier) => {
        console.log('Artifact clicked:', identifier);
        setVisibleArtifactId(identifier);
    };

    console.log('Rendered artifacts:', artifacts);
    console.log('Current visibleArtifactId:', visibleArtifactId);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">ArtifactButton Test</h2>
            <div className="space-y-4">
                {artifacts.map(artifact => (
                    <div key={artifact.identifier} className="flex items-center space-x-4">
                        <ArtifactButton
                            title={artifact.title}
                            identifier={artifact.identifier}
                            type={artifact.type}
                            onClick={() => handleArtifactClick(artifact.identifier)}
                        />
                        {/*<span className="text-sm">*/}
                        {/*    {visibleArtifactId === artifact.identifier ? '(Selected)' : ''}*/}
                        {/*</span>*/}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArtifactButtonTestContainer