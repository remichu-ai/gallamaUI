import React from 'react';
import { assets } from "../../assets/assets.js"; // Adjust the path if needed
import styles from './CopyButtonChat.module.css';

const CopyButtonChat = ({ text, className }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(text)
            .catch(err => console.error('Failed to copy: ', err));
    };

    return (
        <button onClick={copyToClipboard} className={`${styles.container} ${className}`}>
            <assets.CopyIcon className={styles.menuIcon} />
        </button>
    );
};

export { CopyButtonChat };