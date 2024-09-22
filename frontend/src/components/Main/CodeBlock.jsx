import React from 'react';
import hljs from 'highlight.js';
import HighlightedCode from './HighlightedCode';
import AutoScroll from './AutoScroll';
import styles from './CodeBlock.module.css';
// import 'highlight.js/styles/base16/ashes.css';

const cleanupCode = (str) => {
  // Remove leading newline
  let cleanedStr = str.startsWith('\n') ? str.slice(1) : str;

  // Remove markdown code tags at the beginning and end
  const codeTagRegex = /^```[\w-]*\n?|```\n?$/g;
  cleanedStr = cleanedStr.replace(codeTagRegex, '');

  // Trim any remaining whitespace at the beginning and end
  return cleanedStr.trim();
};

const CodeBlock = ({ language, code }) => {
    let formattedValue = cleanupCode(code);

    try {
        formattedValue = hljs.highlight(formattedValue, { language }).value;
    } catch (error) {
        console.error('Highlight.js error:', error);
        formattedValue = code; // Fallback to raw text
    }

    return (
        <AutoScroll>
            <div className={styles.codeBlock}>
                <HighlightedCode formattedValue={formattedValue} />
            </div>
        </AutoScroll>
    );
};

export default CodeBlock;
