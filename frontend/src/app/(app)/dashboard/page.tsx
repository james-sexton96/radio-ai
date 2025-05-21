// File: frontend/src/app/(app)/dashboard/page.tsx
"use client"; // This page uses client-side hooks for auth state and actions

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation'; // For redirecting after logout
import { askLlm, askLlmStream } from '@/lib/ollamaClient';
import ChatMessage from '@/components/chat/ChatMessage';
import ImageUploader from '@/components/core/ImageUploader';

// Temporarily disable the ESLint rule for unused variables
/* eslint-disable @typescript-eslint/no-unused-vars */

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.replace('/login'); // Redirect to login page after logout
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await askLlm('Hello', 'gemma3:27b-it-qat');
      setResult(JSON.stringify(res));
    } catch (e) {
      setResult('Error: ' + (e as Error).message);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: { sender: 'user'; text: string } = { sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Add a placeholder AI message
      setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);

      let lastChunk = '';
      await askLlmStream(inputText, 'gemma3:27b-it-qat', (chunk) => {
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage?.sender === 'ai') {
            // Append only new content, ensuring spaces are preserved
            const newContent = chunk.startsWith(lastChunk) ? chunk.slice(lastChunk.length) : chunk;
            lastMessage.text += (lastMessage.text.endsWith(' ') ? '' : ' ') + newContent;
            lastChunk = chunk; // Update the last chunk
          }
          return updatedMessages;
        });
      });
    } catch (error) {
      const errorMessage: { sender: 'ai'; text: string } = {
        sender: 'ai',
        text: 'Error: Unable to get a response from the AI.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <p className="text-lg font-semibold text-red-600">User not found. Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100"> {/* Changed min-h-screen to h-screen for full height */}
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <span className="font-semibold text-xl">Neurorad AI Dashboard</span>
          <div>
            <span className="mr-2 sm:mr-4 text-sm sm:text-base">Welcome, {user.email || 'User'}!</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-xs sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content area - Now a flex container */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Column: Image Display/Upload and later, Report Display */}
        <div className="lg:w-1/2 flex flex-col gap-6">
          {/* Image Upload/Display Area */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg flex-grow flex flex-col">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Image Analysis</h2>
            <div className="flex-grow border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
              {/* Image Analysis Box */}
              {imagePreview ? (
                <img src={imagePreview} alt="Selected Preview" className="rounded-md shadow-md max-w-full h-auto" />
              ) : (
                <p>No image selected</p>
              )}
            </div>
            {/* Upload Button */}
            <div className="mt-4 flex justify-center">
              <ImageUploader onImageSelect={handleImageSelect} />
            </div>
          </div>
           {/* Report Display Area (Placeholder for later) */}
           <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mt-auto"> {/* mt-auto pushes to bottom if space */}
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Generated Report</h2>
            <div className="border border-gray-200 rounded-md p-3 min-h-[100px] text-gray-500">
              Report content will appear here...
            </div>
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:w-1/2 flex flex-col bg-white p-4 sm:p-6 rounded-lg shadow-lg h-full max-h-[calc(100vh-150px)] sm:max-h-[calc(100vh-180px)]"> {/* Adjusted max height */}
          <h2 className="text-xl font-semibold text-gray-700 mb-4">AI Chat Assistant</h2>
          {/* Chat Messages Area */}
          <div className="flex-grow border border-gray-300 rounded-md p-3 overflow-y-auto mb-4 min-h-[200px] sm:min-h-[300px]">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center py-10">Chat messages will appear here...</div>
            ) : (
              messages.map((message, index) => (
                <ChatMessage key={index} sender={message.sender} text={message.text} />
              ))
            )}
          </div>
          {/* Chat Input Field */}
          <div className="mt-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message to the AI..."
                className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Test LLM Button and Result Display - Temporary addition */}
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-md">
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
        >
          {loading ? 'Testing...' : 'Test LLM'}
        </button>
        <div className="mt-2 text-sm text-gray-600">
          {result && <p>Result: {result}</p>}
        </div>
      </div>

      {/* Footer (optional, can be removed if main content needs full height) */}
      {/* <footer className="bg-gray-200 text-center p-3 text-sm text-gray-600">
        &copy; {new Date().getFullYear()} Neurorad AI Assistant
      </footer> */}
    </div>
  );
}
