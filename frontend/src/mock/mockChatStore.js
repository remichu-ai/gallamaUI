const mockMessages = [
    {
        role: 'user',
        content: [{
            type: 'text',
            content: 'Can you explain what a binary search tree is and provide an example implementation?'
        }],
    },
    {
        role: 'assistant',
        content: [
            {
                type: 'text',
                content: 'Certainly! A binary search tree (BST) is a data structure that allows for efficient searching, insertion, and deletion of elements. Here\'s a brief explanation and an example implementation in Python:'
            },
            {type: 'artifact', identifier: 'bst-implementation'},
            {
                type: 'text',
                content: 'This implementation includes the basic structure of a BST and methods for insertion and in-order traversal. You can expand on this to include other operations like search and deletion.'
            },
        ],
        artifacts: {
            'bst-implementation': {
                identifier: 'bst-implementation',
                artifact_type: 'code',
                language: 'python',
                title: 'Binary Search Tree Implementation',
                content: `
# Binary Search Tree Implementation

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        if not self.root:
            self.root = Node(value)
        else:
            self._insert_recursive(self.root, value)
    
    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = Node(value)
            else:
                self._insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = Node(value)
            else:
                self._insert_recursive(node.right, value)
    
    def inorder_traversal(self):
        result = []
        self._inorder_recursive(self.root, result)
        return result
    
    def _inorder_recursive(self, node, result):
        if node:
            self._inorder_recursive(node.left, result)
            result.append(node.value)
            self._inorder_recursive(node.right, result)

# Example usage
bst = BinarySearchTree()
bst.insert(5)
bst.insert(3)
bst.insert(7)
bst.insert(1)
bst.insert(9)

print(bst.inorder_traversal())  # Output: [1, 3, 5, 7, 9]
        `,
            },
        },
    },
    {
        role: 'user',
        content: [{
            type: 'text',
            content: 'That\'s great! Can you show me how to implement a search function for this BST?'
        }],
    },
    {
        role: 'assistant',
        content: [
            {
                type: 'text',
                content: 'Certainly! I\'ll add a search function to our Binary Search Tree implementation. Here\'s the updated code with the search functionality:'
            },
            {type: 'artifact', identifier: 'bst-with-search'},
            {
                type: 'text',
                content: 'This implementation adds a `search` method to the `BinarySearchTree` class. The search function returns `True` if the value is found in the tree, and `False` otherwise. It uses the binary search tree property to efficiently navigate the tree, reducing the search space by half at each step.'
            },
            {type: 'artifact', identifier: 'markdown-document'},
        ],
        artifacts: {
            'bst-with-search': {
                identifier: 'bst-with-search',
                artifact_type: 'code',
                language: 'python',
                title: 'Binary Search Tree with Search Function',
                content: `
# Binary Search Tree with Search Function
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None
    
    def insert(self, value):
        if not self.root:
            self.root = Node(value)
        else:
            self._insert_recursive(self.root, value)
    
    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = Node(value)
            else:
                self._insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = Node(value)
            else:
                self._insert_recursive(node.right, value)
    
    def search(self, value):
        return self._search_recursive(self.root, value)
    
    def _search_recursive(self, node, value):
        if node is None or node.value == value:
            return node is not None
        
        if value < node.value:
            return self._search_recursive(node.left, value)
        else:
            return self._search_recursive(node.right, value)
    
    def inorder_traversal(self):
        result = []
        self._inorder_recursive(self.root, result)
        return result
    
    def _inorder_recursive(self, node, result):
        if node:
            self._inorder_recursive(node.left, result)
            result.append(node.value)
            self._inorder_recursive(node.right, result)

# Example usage
bst = BinarySearchTree()
bst.insert(5)
bst.insert(3)
bst.insert(7)
bst.insert(1)
bst.insert(9)

print(bst.inorder_traversal())  # Output: [1, 3, 5, 7, 9]
print(bst.search(7))  # Output: True
print(bst.search(4))  # Output: False
        `,
            },
        'markdown-document': {
            identifier: 'markdown-document',
            artifact_type: 'self_contained_text',
            title: 'Markdown Document',
            content: `
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
            }
        },
    },
    {
        role: 'user',
        content: [{
            type: 'text',
            content: 'That\'s great! Can you show me how to implement quicksort?'
        }],
    },
];


const mockMessagesBasic = [
    {
        role: 'user',
        content: [{
            type: 'text',
            content: 'Hello?'
        }],
    },
    {
        role: 'assistant',
        content: [
            {
                type: 'text',
                content: 'Hello back'
            },
        ],
    }
]

export { mockMessages, mockMessagesBasic}