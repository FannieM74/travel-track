import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="mx-auto max-w-sm mt-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="mb-4 text-gray-600">Something went wrong. Please try again.</p>
      <Link href="/auth/login" className="text-blue-600">Back to login</Link>
    </div>
  );
}
