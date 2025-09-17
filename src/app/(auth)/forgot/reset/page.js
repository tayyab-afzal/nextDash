"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed to reset password");
      return;
    }
    setOk(true);
    setTimeout(() => router.replace("/sign-in?reset=1"), 1200);
  };

  return (
    <div className="min-h-screen bg-all flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Reset password</h1>
            <p className="text-white">Enter a new password for {email}</p>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {ok && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">Password updated. Redirecting…</p>
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="form-label">New password</label>
              <input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="form-input" />
            </div>
            <div>
              <label htmlFor="confirm" className="form-label">Confirm password</label>
              <input id="confirm" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="form-input" />
            </div>
            <button type="submit" className="w-full btn-primary py-3 text-lg font-semibold">Reset password</button>
          </form>
          <div className="mt-6 text-center">
            <a href="/sign-in" className="url">Back to sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}


