"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const baseSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export default function SignInPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState(null);
  const [otp, setOtp] = useState("");

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(baseSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      ...(mfaRequired ? { otp } : {}),
    });

    if (!res) return;
    if (res.error) {
      if (res.error === "MFA_REQUIRED") {
        setMfaRequired(true);
        setError("Enter your 6-digit authenticator code");
        return;
      }
      setError(res.error);
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>
          
          {sp.get("registered") && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="success-text">Account created successfully! Please sign in.</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <input 
                id="email" 
                type="email" 
                placeholder="Enter your email" 
                {...register("email")} 
                className="form-input"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                id="password" 
                type="password" 
                placeholder="Enter your password" 
                {...register("password")} 
                className="form-input"
              />
            </div>

            {mfaRequired && (
              <div>
                <label htmlFor="otp" className="form-label">Authenticator Code</label>
                <input 
                  id="otp" 
                  inputMode="numeric" 
                  placeholder="123456" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  className="form-input text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full btn-primary py-3 text-lg font-semibold" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}