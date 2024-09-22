import React from 'react';
import CodeBlock from '../components/Main/CodeBlock.jsx';

const MockCodeBlock = () => {
    // Fake data for testing
    const fakeLanguage = "javascript";
    const fakeCode = `function add(a, b) {\n  return a + b;\n}`;

    return (
        <div>
            <h1>test</h1>
            <CodeBlock language={fakeLanguage} code={fakeCode}/>
        </div>
    );
};

export default MockCodeBlock;