// src/components/ArtifactComponent.jsx
import React from 'react';
import '../src/css/ArtifactComponent.css'; // Import your CSS file


// Define the ArtifactComponent
const ArtifactComponent = ({ children, onClose }) => (
  <div className="artifact-component">
    <div className="top-bar">
      <button onClick={onClose} className="close-button">Close</button>
    </div>
    <div className="content">
      {children}
    </div>
  </div>
);

export { ArtifactComponent };
