import React, { useState, useEffect } from 'react';
import useUIStore from "../../store/uiStore.js";
import styles from './ThinkingSection.module.css';

const thinkingWords = [
    { word: 'thinking', probability: 0.6 },
    { word: 'reasoning', probability: 0.2 },
    { word: 'processing', probability: 0.2 },
];

const getRandomWord = () => {
    const randomValue = Math.random();
    let cumulativeProbability = 0;

    for (const { word, probability } of thinkingWords) {
        cumulativeProbability += probability;
        if (randomValue <= cumulativeProbability) {
            return word;
        }
    }

    return thinkingWords[0].word;
};

const AnimatedThinking = ({ isContentLoading }) => {
    const [dots, setDots] = useState('.');
    const [currentWord, setCurrentWord] = useState(getRandomWord());

    useEffect(() => {
        if (!isContentLoading) {
            setDots('...');
            return;
        }

        const interval = setInterval(() => {
            setDots(prevDots => {
                if (prevDots === '...') {
                    // Change the word when the dots cycle completes
                    setCurrentWord(getRandomWord());
                    return '.';
                }
                return prevDots + '.';
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isContentLoading]);

    // Return null if content is not loading
    if (!isContentLoading) {
        return null;
    }

    return <span className={styles.animatedThinking}>{currentWord} {dots}</span>;
};

const ThinkingSection = ({ thinking, isContentLoading }) => {
    const [isVisible, setIsVisible] = useState(true);
    const { showThinking } = useUIStore();

    if (!thinking) return null;

    return (
        showThinking ?
            (<div className={styles.thinkingSection}>
                <div className={styles.header}>
                    <span className={styles.headerTitle}>Thinking Process</span>
                    <button
                        className={styles.toggleButton}
                        onClick={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? 'Hide' : 'Show'}
                    </button>
                </div>
                <div className={`${styles.content} ${!isVisible ? styles.hidden : ''}`}>
                    {isVisible && (
                        <div className={styles.textContent}>
                            {thinking}
                        </div>
                    )}
                </div>
            </div>)
            : (
                <AnimatedThinking className={styles.animatedThinking} isContentLoading={isContentLoading} />
            )
    );
};

export { ThinkingSection, AnimatedThinking };
