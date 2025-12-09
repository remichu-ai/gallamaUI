import React, { useState, useEffect } from 'react';
import useUIStore from "../../store/uiStore.js";
import styles from './ReasoningSection.module.css';

const reasoningWords = [
    { word: 'reasoning', probability: 0.6 },
    { word: 'thinking', probability: 0.2 },
    { word: 'processing', probability: 0.2 },
];

const getRandomWord = () => {
    const randomValue = Math.random();
    let cumulativeProbability = 0;

    for (const { word, probability } of reasoningWords) {
        cumulativeProbability += probability;
        if (randomValue <= cumulativeProbability) {
            return word;
        }
    }

    return reasoningWords[0].word;
};

const AnimatedReasoning = ({ isContentLoading }) => {
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

const ReasoningSection = ({ reasoning, isContentLoading }) => {
    const { showReasoning } = useUIStore();
    const [isVisible, setIsVisible] = useState(showReasoning);

    useEffect(() => {
        setIsVisible(showReasoning);
    }, [showReasoning]);

    if (!reasoning) return null;

    if (isContentLoading && !reasoning) {
        return <AnimatedReasoning className={styles.animatedThinking} isContentLoading={isContentLoading} />;
    }

    return (
        <div className={styles.thinkingSection}>
            <div className={styles.header}>
                <span className={styles.headerTitle}>Reasoning Process</span>
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
                        {reasoning}
                    </div>
                )}
            </div>
        </div>
    );
};

export { ReasoningSection, AnimatedReasoning };
