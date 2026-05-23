import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="mx-auto max-w-sm mt-20 text-center">
      <h1 className="text-2xl font-bold mb-4 text-fg">Authentication Error</h1>
      <p className="mb-4 text-fg-secondary">Something went wrong. Please try again.</p>
      <Link href="/auth/login" className="text-accent">Back to login</Link>
    </div>
  );
}
