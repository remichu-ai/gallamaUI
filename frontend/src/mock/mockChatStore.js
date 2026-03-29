const mockMessages = [
    {
        role: 'user',
        content: [
            {
                type: 'text',
                content: 'Can you explain what a binary search tree is and show a small Python example?'
            }
        ],
    },
    {
        role: 'assistant',
        content: [
            {
                type: 'text',
                content: `A binary search tree (BST) is a tree where every node keeps smaller values on the left and larger values on the right.

\`\`\`python
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
\`\`\`

That structure makes search, insert, and traversal efficient when the tree stays reasonably balanced.`
            }
        ],
    },
    {
        role: 'user',
        content: [
            {
                type: 'text',
                content: 'Nice. Can you also describe inorder traversal?'
            }
        ],
    },
    {
        role: 'assistant',
        content: [
            {
                type: 'text',
                content: `Inorder traversal visits:

1. left subtree
2. current node
3. right subtree

For a BST, that means the values come out in sorted order.`
            }
        ],
    },
];

const mockMessagesBasic = [
    {
        role: 'user',
        content: [
            {
                type: 'text',
                content: 'Hello?'
            }
        ],
    },
    {
        role: 'assistant',
        content: [
            {
                type: 'text',
                content: 'Hello back'
            }
        ],
    }
];

export { mockMessages, mockMessagesBasic };
