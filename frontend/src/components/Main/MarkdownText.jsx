import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // Allows raw HTML (for <br> tags)
import 'highlight.js/styles/stackoverflow-dark.css';
import styles from './MarkdownText.module.css'; // Assuming you have custom CSS styles

const MarkdownText = ({ content }) => {
    // Preprocess content to replace newlines with double spaces for line breaks
    const processedContent = content.replace(/\n/g, '  \n');

    return (
        <div className={styles.markdownContainer}>
            <ReactMarkdown
                children={processedContent}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]} // Allows HTML processing
                components={{
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    )
                }}
            />
        </div>
    );
};

export default MarkdownText;
