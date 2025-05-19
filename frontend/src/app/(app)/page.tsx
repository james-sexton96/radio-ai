// File: frontend/src/app/(app)/layout.tsx
"use client"; // This layout needs client-side hooks for auth checks and redirection

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation'; // For redirection

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for authenticated sections of the application.
 * It checks if the user is authenticated. If not, it redirects to the login page.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for the initial loading to complete
    if (isLoading) {
      return;
    }

    // If not loading and not authenticated, redirect to login
    if (!isAuthenticated()) {
      console.log("AppLayout: User not authenticated, redirecting to /login");
      router.replace('/login'); // Use replace to avoid adding to history stack
    } else {
      console.log("AppLayout: User is authenticated:", user?.email);
    }
  }, [isAuthenticated, isLoading, router, user]); // Add user to dependency array for logging

  // If still loading, or if not authenticated (and redirect is in progress),
  // show a loading indicator or null to prevent flashing content.
  if (isLoading || !isAuthenticated()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold text-gray-700">Loading or Redirecting...</p>
      </div>
    );
  }

  // If authenticated, render the children (the actual page content)
  return <>{children}</>;
}
