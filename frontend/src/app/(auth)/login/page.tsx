// File: frontend/src/app/(auth)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm'; // Using import alias @
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* You can add a logo here if you have one */}
        {/* <img
          className="mx-auto h-10 w-auto"
          src="https_your_logo_url"
          alt="Your Company"
        /> */}
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <LoginForm />
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Not a member?{' '}
          <Link
            href="/signup"
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
