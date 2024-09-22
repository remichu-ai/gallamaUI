import React from 'react';
import {useChatStore} from './chatStore'; // Import your Zustand store
import ArtifactButton from '../components/Main/ArtifactButton'; // Import the ArtifactButton component we created

const MockChat = () => {
    const messages = [
        {
            id: 1,
            content: "Hello! Here's a code snippet for you:",
            artifact: {id: 'code1', title: 'Simple JavaScript Function', type: 'code'}
        },
        {
            id: 2,
            content: "And here's some text content:",
            artifact: {id: 'text1', title: 'Important Notes', type: 'text'}
        },
        {id: 3, content: "Check out this image:", artifact: {id: 'image1', title: 'Cool Diagram', type: 'image'}},
        {id: 4, content: "This message doesn't have an artifact."},
    ];

    const visibleArtifactId = useChatStore(state => state.visibleArtifactId);
    const getVisibleArtifact = useChatStore(state => state.getVisibleArtifact);

    const visibleArtifact = getVisibleArtifact();

    return (
        <div className="flex">
            <div className="w-2/3 p-4 border-r">
                <h2 className="text-xl font-bold mb-4">Mock Chat</h2>
                {messages.map(message => (
                    <div key={message.id} className="mb-4 p-2 bg-gray-100 rounded">
                        <p>{message.content}</p>
                        {message.artifact && (
                            <ArtifactButton
                                title={message.artifact.title}
                                id={message.artifact.id}
                                type={message.artifact.type}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="w-1/3 p-4">
                <h2 className="text-xl font-bold mb-4">Artifact Viewer</h2>
                {visibleArtifact ? (
                    <div>
                        <h3 className="text-lg font-semibold">{visibleArtifact.title}</h3>
                        <p>Type: {visibleArtifact.type}</p>
                        <p>Content would be displayed here</p>
                    </div>
                ) : (
                    <p>No artifact selected</p>
                )}
            </div>
        </div>
    );
};

export default MockChat;