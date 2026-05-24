"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
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
      <h1 className="text-2xl font-bold mb-6 text-center text-fg">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-line rounded px-3 py-2 bg-input text-fg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-line rounded px-3 py-2 bg-input text-fg"
        />
        {mode === "register" && (
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-line rounded px-3 py-2 bg-input text-fg"
          />
        )}
        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        <button
          type="submit"
          className="w-full bg-accent text-on-accent rounded py-2 hover:bg-accent-light transition-colors font-medium"
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full border border-line rounded py-2 bg-card text-fg hover:bg-card-hover transition-colors"
        >
          Sign in with Google
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-fg-secondary">
        {mode === "login" ? (
          <>Don&apos;t have an account? <a href="/auth/register" className="text-accent">Register</a></>
        ) : (
          <>Already have an account? <a href="/auth/login" className="text-accent">Sign in</a></>
        )}
      </p>
    </div>
  );
}
