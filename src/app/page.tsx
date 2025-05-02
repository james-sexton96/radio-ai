'use client'; // Required for client-side hooks and interactions

import React, { useState, useRef, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { Upload, MessageSquare, Send, Loader2, AlertCircle, Image as ImageIcon, XCircle, Bot } from 'lucide-react'; // Using lucide-react for icons
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, etc.)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a style

// Define the structure for a chat message
interface ChatMessage {
  id: string; // Unique ID for each message for streaming updates
  sender: 'user' | 'ai';
  text: string;
  timestamp: number; // For potential sorting or reference
}

// Define the structure of a streaming chunk from Ollama /api/generate
interface OllamaStreamChunk {
  model: string;
  created_at: string;
  response: string; // This contains the text chunk
  done: boolean; // Indicates if this is the final chunk
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export default function HomePage() {
  // State for image handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false); // Separate loading for image

  // State for chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');

  // State for API interaction
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false); // Loading state specifically for AI response
  const [error, setError] = useState<string | null>(null);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref for chat scroll area
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Configuration ---
  // IMPORTANT: Replace with your multi-modal Ollama model supporting vision
  const OLLAMA_MODEL = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'gemma3:12b-it-qat'; // Default to llava if not set
  // IMPORTANT: Adjust if your Ollama runs elsewhere or use env var
  const OLLAMA_API_URL = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434/api/generate';
  // --- ---

  // Scroll to bottom of chat on new message or AI loading start
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isAiLoading]); // Trigger scroll on history change or when AI starts loading

  // Handle image selection
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setError(null); // Clear previous errors
      setIsImageLoading(true); // Start image loading indicator
      setImageUrl(null); // Clear previous image preview
      setImageBase64(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setImageUrl(url);
        // Extract base64 data (remove the prefix like 'data:image/png;base64,')
        const base64String = url.split(',')[1];
        setImageBase64(base64String);
        setIsImageLoading(false); // Finish image loading
        console.log(`Image loaded: ${file.name}, Size: ${Math.round(file.size / 1024)} KB`);
      };
      reader.onerror = () => {
        setError(`Failed to read file: ${file.name}`);
        setImageUrl(null);
        setImageBase64(null);
        setImageFile(null);
        setIsImageLoading(false); // Finish image loading on error
      }
      reader.readAsDataURL(file); // Read file as Data URL (includes base64)
    }
  };

  // Trigger hidden file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Clear the uploaded image
  const handleClearImage = () => {
    setImageFile(null);
    setImageUrl(null);
    setImageBase64(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
    }
    setError(null); // Clear any errors related to the image
    console.log("Image cleared.");
  };

  // Handle chat message submission (now with streaming)
  const handleSendMessage = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault(); // Prevent form submission if used in a form

    const messageText = currentMessage.trim();
    if (!messageText || isAiLoading) return; // Don't send empty messages or while loading

    if (!imageBase64) {
        setError("Please upload an image before sending a message.");
        return;
    }

    // 1. Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: Date.now(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage(''); // Clear input field
    setIsAiLoading(true);
    setError(null);

    // 2. Prepare a placeholder for the AI's response
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessagePlaceholder: ChatMessage = {
        id: aiMessageId,
        sender: 'ai',
        text: '...', // Initial placeholder text
        timestamp: Date.now(),
    };
    setChatHistory(prev => [...prev, aiMessagePlaceholder]);

    console.log(`Sending prompt to ${OLLAMA_API_URL} with model ${OLLAMA_MODEL}`);
    console.log(`Image attached: ${imageFile?.name}`);

    try {
      const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: messageText,
          images: [imageBase64], // Send base64 image data
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.text();
        console.error('API request failed:', response.status, response.statusText, errorBody);
        throw new Error(`API Error (${response.status}): ${errorBody || response.statusText}`);
      }

      // 3. Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      let buffer = ''; // Buffer for incomplete JSON chunks

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream finished.');
          break; // Exit loop when stream is done
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON objects separated by newlines
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
            const jsonString = buffer.substring(0, boundary).trim();
            buffer = buffer.substring(boundary + 1);

            if (jsonString) {
                try {
                    const chunk: OllamaStreamChunk = JSON.parse(jsonString);
                    if (chunk.response) {
                        accumulatedResponse += chunk.response;
                        // Update the specific AI message in the chat history
                        setChatHistory(prev =>
                            prev.map(msg =>
                                msg.id === aiMessageId
                                    ? { ...msg, text: accumulatedResponse }
                                    : msg
                            )
                        );
                    }
                    if (chunk.done) {
                      console.log('Received done signal in a chunk.');
                      // Optional: Final processing if needed based on the 'done' chunk
                    }
                } catch (parseError) {
                    console.warn('Failed to parse JSON chunk:', parseError, 'Chunk:', jsonString);
                    // Handle potential partial JSON objects or malformed data if necessary
                }
            }
            boundary = buffer.indexOf('\n');
        }
      }
      // Final flush for any remaining text in the buffer (though Ollama usually ends with newline)
      if (buffer.trim()) {
          try {
              const chunk: OllamaStreamChunk = JSON.parse(buffer.trim());
              if (chunk.response) {
                  accumulatedResponse += chunk.response;
                  setChatHistory(prev =>
                      prev.map(msg =>
                          msg.id === aiMessageId
                              ? { ...msg, text: accumulatedResponse }
                              : msg
                      )
                  );
              }
          } catch (parseError) {
              console.warn('Failed to parse final buffer content:', parseError, 'Buffer:', buffer);
          }
      }


    } catch (err: unknown) {
      console.error('Error processing stream or sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get response: ${errorMessage}`);
      // Update the AI placeholder message with the error
      setChatHistory(prev =>
        prev.map(msg =>
            msg.id === aiMessageId
                ? { ...msg, text: `Error: ${errorMessage}` }
                : msg
        )
      );
    } finally {
      setIsAiLoading(false); // Stop loading indicator
    }
  }, [currentMessage, isAiLoading, imageBase64, OLLAMA_API_URL, OLLAMA_MODEL, imageFile?.name]);


  return (
    <div className="flex h-screen w-screen bg-gray-100 text-gray-900 font-sans">
      {/* Left Column: Image Upload and Display */}
      <div className="w-full md:w-1/3 flex flex-col bg-white border-r border-gray-200 p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Radiology Image</h2>
        <div className="flex-grow flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 mb-4 relative min-h-[200px]">
          {isImageLoading ? (
             <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg z-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
             </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={imageFile ? imageFile.name : "Uploaded image"}
                className="max-w-full max-h-full object-contain rounded"
              />
              <button
                onClick={handleClearImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors z-20"
                title="Clear Image"
                aria-label="Clear Image"
                disabled={isAiLoading} // Disable clear while AI is thinking
              >
                <XCircle size={18} />
              </button>
            </>
          ) : (
            <div className="text-center text-gray-500">
              <ImageIcon size={48} className="mx-auto mb-2 text-gray-400" />
              <p className="font-medium">Upload an image to begin</p>
              <p className="text-xs mt-1">(e.g., X-ray, CT, MRI scan)</p>
            </div>
          )}
           {/* Loading overlay *during AI processing* */}
           {isAiLoading && imageBase64 && !isImageLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-white font-medium">AI Processing...</span>
              </div>
            )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/png, image/jpeg, image/webp, image/gif, image/dicom" // Added gif, adjust as needed
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          disabled={isAiLoading || isImageLoading} // Disable if AI is loading OR image is loading
          className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={16} className="mr-2" />
          {isImageLoading ? 'Loading...' : (imageFile ? 'Change Image' : 'Upload Image')}
        </button>
         {imageFile && (
          <p className="text-xs text-gray-600 mt-2 truncate text-center" title={imageFile.name}>
            {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
          </p>
        )}
        {/* API Info */}
        <div className="mt-auto pt-4 text-xs text-gray-400 text-center border-t mt-4">
             Model: <span className="font-medium text-gray-500">{OLLAMA_MODEL}</span> <br/>
             API: <span className="font-medium text-gray-500">{OLLAMA_API_URL.replace(/^https?:\/\//, '')}</span>
        </div>
      </div>

      {/* Right Column: Chat Interface */}
      <div className="w-full md:w-2/3 flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 shadow-sm flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800 flex items-center">
            <MessageSquare size={22} className="mr-2 text-blue-600" />
            Radio-AI Chat Assistant
          </h1>
          {/* Optional: Add other header controls here if needed */}
        </header>

        {/* Chat Messages Area */}
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg shadow-md break-words ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                {/* Render Markdown Content */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown
                  components={{
                     // Custom renderer for code blocks
                     code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus} // Choose your preferred style
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Improve list spacing
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2 ml-4" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2 ml-4" {...props} />,
                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                    // Add styling for blockquotes
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600" {...props} />,
                    // Ensure paragraphs have some margin
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
                 {/* Show loading dots only for the AI message being generated */}
                 {msg.sender === 'ai' && isAiLoading && msg.id === chatHistory[chatHistory.length - 1]?.id && (
                    <span className="inline-block ml-2 animate-pulse">...</span>
                 )}
              </div>
            </div>
          ))}

          {/* Show "Thinking..." indicator when AI is loading but hasn't sent first chunk yet */}
          {isAiLoading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.sender === 'user' && (
             <div className="flex justify-start">
              <div className="px-4 py-3 rounded-lg shadow-md bg-white text-gray-600 border border-gray-200 inline-flex items-center">
                <Bot size={18} className="mr-2 text-blue-600 animate-pulse" />
                Thinking...
              </div>
            </div>
          )}

          {/* Error Display Area */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md flex items-start shadow-sm">
              <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold text-sm">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          {/* Scroll anchor (no visual element needed) */}
          {/* <div ref={chatEndRef} /> */}
        </div>

        {/* Chat Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 shadow-inner">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={!imageBase64 ? "Upload an image first..." : (isAiLoading ? "Waiting for response..." : "Ask about the image...")}
              disabled={isAiLoading || !imageBase64 || isImageLoading} // Disable if AI loading, no image, or image loading
              className="flex-grow p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              onKeyDown={(e) => {
                // Send on Enter (unless Shift is pressed)
                if (e.key === 'Enter' && !e.shiftKey && !isAiLoading && currentMessage.trim()) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              type="submit"
              disabled={isAiLoading || !currentMessage.trim() || !imageBase64 || isImageLoading}
              className="inline-flex items-center justify-center p-2.5 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {isAiLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
