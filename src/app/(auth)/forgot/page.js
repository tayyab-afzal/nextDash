"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed to send reset email");
        return;
      }
      setSent(true);
    } catch (e) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-all flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Forgot Password?
            </h1>
            <p className="text-white">We’ll send a reset link to your email</p>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg relative animate-fade-in">
              <p className="text-red-600 text-sm">Invalid email</p>
              <button
                onClick={() => setError(null)}
                className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center
                 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition"
              >
                ×
              </button>
            </div>
          )}

          {sent && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg relative animate-fade-in">
              <p className="text-green-700 text-sm">
                Reset link sent to {email}
              </p>
              <button
                onClick={() => setSent(false)}
                className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center
                 rounded-full text-green-500 hover:bg-green-100 hover:text-green-700 transition"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg font-semibold"
            >
              Reset
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/sign-in" className="url">
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
