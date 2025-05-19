// File: frontend/src/app/page.tsx
// "use client"; // Temporarily commented out for build test
// import Link from 'next/link';
// import { useAuth } from '@/contexts/AuthContext';

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic';

export default function HomePage() {
  // All logic related to useAuth is temporarily commented out
  // const { user, logout, isAuthenticated, isLoading } = useAuth();

  // if (isLoading) {
  //   return (
  //     <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold text-gray-700">Loading authentication status...</h1>
  //       </div>
  //     </main>
  //   );
  // }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-indigo-600">
          Hello Neurorad AI (Build Test)
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          This is a simplified page to test the build process.
        </p>
        {/* Temporarily removing links and auth-dependent content
        {isAuthenticated() && user ? (
          <div>
            <p>User is logged in.</p>
          </div>
        ) : (
          <div>
            <p>User is not logged in.</p>
            <Link href="/login">Go to Login</Link>
          </div>
        )}
        */}
      </div>
    </main>
  );
}
