"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-sm mt-20">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full border rounded py-2 hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">
        {mode === "login" ? (
          <>Don&apos;t have an account? <a href="/auth/register" className="text-blue-600">Register</a></>
        ) : (
          <>Already have an account? <a href="/auth/login" className="text-blue-600">Sign in</a></>
        )}
      </p>
    </div>
  );
}
