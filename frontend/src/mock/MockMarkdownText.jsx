import React from 'react';
import CodeBlock from '../components/Main/CodeBlock.jsx';
import MarkdownText from "../components/Main/MarkdownText.jsx";

const MockMarkdownText = () => {
    // Fake data for testing
    const fakeContent = `
# Header 1
## Header 2
### Header 3

This is a paragraph with some **bold** text, *italic* text, and a [link](https://www.example.com).

- List item 1
- List item 2
  - Nested item 1
  - Nested item 2

1. Ordered list item 1
2. Ordered list item 2

\`\`\`javascript
// This is a code block
function helloWorld() {
    console.log("Hello, world!");
}
\`\`\`

Here is an inline code example: \`const x = 10;\`

> This is a blockquote.

![Image Alt Text](https://dummyimage.com/300x200/000/fff)

---

Here is a horizontal rule above this line.
`

    return (
        <div>
            <MarkdownText content={fakeContent}/>
        </div>
    );
};

export default MockMarkdownText;