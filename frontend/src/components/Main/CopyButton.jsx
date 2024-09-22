import React from 'react';
import styles from './CopyButton.module.css';

const CopyButton = ({ text, className }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
        .catch(err => console.error('Failed to copy: ', err));
  };

  return (
      <button onClick={copyToClipboard} className={styles.container}>
        Copy
      </button>
  );
};

export { CopyButton };
