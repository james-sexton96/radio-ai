// File: frontend/src/components/auth/LoginForm.tsx
"use client";

import React, { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Define a more specific type for Pocketbase validation errors if needed
interface PocketBaseValidationError {
  code: string;
  message: string;
}

interface PocketBaseErrorData {
  [key: string]: PocketBaseValidationError; // For field-specific errors like email, password
}

interface PocketBaseErrorResponse {
  message?: string; // General error message
  data?: PocketBaseErrorData; // Field-specific validation errors
  // Add other potential fields from Pocketbase error responses if known
}


const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setSuccessMessage("Login successful! Redirecting...");
      console.log("Logged in user data from PB:", authData);

      if (authData.record && authData.token) {
        login(authData.record, authData.token);
      } else {
        throw new Error("Authentication data is incomplete.");
      }

      setEmail('');
      setPassword('');
      router.push('/dashboard');

    } catch (err: unknown) {
      console.error("Login error:", err);
      let errorMessage = "Failed to login. Please check your credentials.";

      if (typeof err === 'object' && err !== null && 'data' in err) {
        // More specific typing for Pocketbase error structure
        const pbError = err as { data?: PocketBaseErrorResponse | string }; // data can sometimes be just a string

        if (typeof pbError.data === 'string') {
            errorMessage = pbError.data;
        } else if (pbError.data?.message) {
          errorMessage = pbError.data.message;
        } else if (pbError.data?.data) {
          // Handle nested validation errors (if any)
          const fieldErrors = Object.values(pbError.data.data).map(e => e.message).join(' ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (err instanceof Error) {
        if (err.message.includes('Failed to authenticate')) {
          errorMessage = "Invalid email or password.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}
      {successMessage && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          <span className="font-medium">Success:</span> {successMessage}
        </div>
      )}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Email address
        </label>
        <div className="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Password
          </label>
        </div>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
