import { assets } from "../src/assets/assets.js";
import React from 'react';
import useChatStore from '../src/store/chatStore.js';
import { ArtifactComponent } from './ArtifactComponent.jsx';
import { CopyButton } from '../src/components/Main/CopyButton.jsx';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@chakra-ui/react'
import { FiFile } from 'react-icons/fi';
// import hljs from 'highlight.js';
// import 'highlight.js/styles/stackoverflow-dark.css'; // Or another theme of your choice
import CodeBlock from '../src/components/Main/CodeBlock.jsx';


const getIcon = (role) => {
    // Assume assets is imported or available in the scope
    switch (role) {
        case 'user':
            return assets.logan_icon;
        case 'assistant':
            return assets.assistant_icon;
        default:
            return null;
    }
};

// helper function to handlenewline issue for markdown
const removeLeadingNewline = (str) => {
    const newlineMarker = '\n';
    if (str.startsWith(newlineMarker)) {
        return str.slice(newlineMarker.length);
    }
    return str;
};

const handleMarkdownNewlines = (blockMatchOutput) => {
    // Add two spaces before each newline for Markdown line breaks
    const newBlockMatchOutput = removeLeadingNewline(blockMatchOutput)
    return newBlockMatchOutput
        .replace(/\n/g, '  \n');
};



const ArtifactButton = ({ artifact, onViewArtifact }) => (
  <Button
    onClick={() => onViewArtifact(artifact.identifier)}
    className="inline-flex items-center space-x-1 my-1"
  >
    <span role="img" aria-label="file icon" className="mr-1">📄</span>
    <span>View {artifact.title}</span>
  </Button>
);

const MessageContent = ({ content, artifacts, onViewArtifact }) => {
  const renderedArtifacts = new Set();

  return (
    <div className="space-y-2">
      {content.map((item, index) => {
        if (item.type === 'text') {
          return (
            <Markdown key={index} remarkPlugins={[remarkGfm]}>
              {item.content}
            </Markdown>
          );
        } else if (item.type === 'artifact') {
          if (!renderedArtifacts.has(item.identifier)) {
            renderedArtifacts.add(item.identifier);
            const artifact = artifacts[item.identifier];
            return <ArtifactButton key={item.identifier} artifact={artifact} onViewArtifact={onViewArtifact} />;
          }
          return null;
        }
      })}
    </div>
  );
};


const ChatMessageOpenAI = ({ chatmsg }) => {
    const { setVisibleArtifactId } = useChatStore();

    return (
        <div className="result">
            <div className="result-icon">
                <img src={getIcon(chatmsg.role)} alt="" />
            </div>
            <div className="result-content">
                <MessageContent
                    content={chatmsg.content}
                    artifacts={chatmsg.artifacts}
                    onViewArtifact={setVisibleArtifactId}
                />
            </div>
        </div>
    );
};


const ChatMessagesOld = ({ messages }) => {
    return (
        <div>
            {messages.map((message, index) => (
                <ChatMessageOpenAI key={index} chatmsg={message} />
            ))}
        </div>
    );
};

export { ChatMessagesOld };

