import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  sender: 'user' | 'ai';
  text: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text }) => {
  const isUser = sender === 'user';

  return (
    <div className={`mb-2 ${isUser ? 'text-right' : 'text-left'}`}>
      <div
        className={`inline-block py-2 px-4 rounded-lg shadow-md ${
          isUser
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ChatMessage;
