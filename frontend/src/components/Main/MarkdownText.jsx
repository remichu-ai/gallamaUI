import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // Allows raw HTML (for <br> tags)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import 'highlight.js/styles/stackoverflow-dark.css';
import styles from './MarkdownText.module.css'; // Assuming you have custom CSS styles

const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return !inline && match ? (
        <div className={styles.codeBlockWrapper}>
            <button
                className={styles.copyButton}
                onClick={handleCopy}
                title="Copy code"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <SyntaxHighlighter
                {...props}
                children={codeString}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
            />
        </div>
    ) : (
        <code {...props} className={className}>
            {children}
        </code>
    );
};

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
                    ),
                    code: CodeBlock
                }}
            />
        </div>
    );
};

export default MarkdownText;
