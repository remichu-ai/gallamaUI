import React, {useState, useEffect} from 'react';
import useUIStore from "../../store/uiStore.js";
import styles from './ThinkingSection.module.css';

const XMLParser = ({xmlString, isContentLoading}) => {
    const [parsedContent, setParsedContent] = useState(null);

    useEffect(() => {
        if (isContentLoading) {
            setParsedContent(<span>{xmlString}</span>);
            return;
        }

        const parseXML = (xml) => {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "text/xml");

                if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                    throw new Error("XML parsing error");
                }

                return xmlDoc.documentElement;
            } catch (error) {
                console.error("XML parsing failed:", error);
                return null;
            }
        };

        const renderNode = (node, depth = 0) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.trim() && <span key={Math.random()}>{node.nodeValue.trim()}</span>;
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const children = Array.from(node.childNodes)
                    .map(child => renderNode(child, depth + 1))
                    .filter(Boolean);

                const indent = '\u00A0'.repeat(depth * 2); // Non-breaking spaces for indentation

                return (
                    <React.Fragment key={Math.random()}>
                        {depth > 0 && <br />}
                        {indent}<span className={styles.tagLabel}>{`<${node.tagName}>`}</span>
                        {children.length > 0 && (
                            <>
                                {children}
                                {children.length > 1 && <br />}
                                {indent}<span className={styles.tagLabel}>{`</${node.tagName}>`}</span>
                            </>
                        )}
                    </React.Fragment>
                );
            }

            return null;
        };

        const rootNode = parseXML(xmlString);
        if (rootNode) {
            setParsedContent(<div className={styles.xmlContainer}>{renderNode(rootNode)}</div>);
        } else {
            setParsedContent(<span>{xmlString}</span>);
        }
    }, [xmlString, isContentLoading]);

    return parsedContent;
};


const thinkingWords = [
    {word: 'thinking', probability: 0.6},
    {word: 'brainstorming', probability: 0.1},
    // {word: 'planning', probability: 0.1},
    {word: 'processing', probability: 0.15},
    {word: 'analyzing', probability: 0.15},
];

const getRandomWord = () => {
    const randomValue = Math.random();
    let cumulativeProbability = 0;

    for (const {word, probability} of thinkingWords) {
        cumulativeProbability += probability;
        if (randomValue <= cumulativeProbability) {
            return word;
        }
    }

    return thinkingWords[0].word; // Fallback to first word if something goes wrong
};

const AnimatedThinking = ({isContentLoading}) => {
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

const ThinkingSection = ({thinking, isContentLoading}) => {
    const [isVisible, setIsVisible] = useState(true);
    const {showThinking} = useUIStore();

    if (!thinking) return null;

    return (
        showThinking ?
            (<div className={styles.thinkingSection}>
                <div className={styles.header}>
                    <span className={styles.headerTitle}>Thinking</span>
                    <button
                        className={styles.toggleButton}
                        onClick={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? 'Hide' : 'Show'}
                    </button>
                </div>
                <div className={`${styles.content} ${!isVisible ? styles.hidden : ''}`}>
                    {isVisible && (<XMLParser xmlString={thinking} isContentLoading={isContentLoading}/>)}
                </div>
            </div>)
            : (
                <AnimatedThinking className={styles.animatedThinking} isContentLoading={isContentLoading}/>
            )
    );
};

export {ThinkingSection, AnimatedThinking};
