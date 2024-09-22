import React from 'react';
import styles from './CodeBlock.module.css';
// import 'highlight.js/styles/base16/ashes.css';
import 'highlight.js/styles/sunburst.min.css';

const HighlightedCode = ({ formattedValue }) => (
    <pre className={styles.pre}>
        <code
            className={`hljs ${styles.code} ${styles.hljs}`}
            // className={`hljs ${styles.code}`}
            dangerouslySetInnerHTML={{ __html: formattedValue }}
        />
    </pre>
);

export default HighlightedCode;