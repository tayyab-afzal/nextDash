"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export default function SignInPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onPassword = async (data) => {
    setError(null);
    console.log("[SignIn] onPassword submit", { email: data.email });
    const res = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });
    if (!res) return;
    console.log("[SignIn] onPassword result", res);
    if (res.error) {
      if (res.error === "CODE_REQUIRED") {
        setCodeStep(true);
        return;
      }
      setError(res.error);
      return;
    }
    router.push("/dashboard");
  };

  const onCode = async () => {
    setError(null);
    console.log("[SignIn] onCode submit");
    const email = getValues("email");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      code,
    });
    if (!res) return;
    console.log("[SignIn] onCode result", res);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-all flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white">Sign in to your account</p>
          </div>

          {sp.get("registered") && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="success-text">
                Account created successfully! Please sign in.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!codeStep ? (
            <form onSubmit={handleSubmit(onPassword)} className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full btn-primary py-3 text-lg font-semibold ${
                  isSubmitting ? "btn-loading" : ""
                }`}
              >
                <span>Continue</span>
                {isSubmitting && <div className="spin-load" />}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="form-label">
                  Verification Code
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="form-input text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We sent a 6-digit code to your email
                </p>
              </div>
              <button
                onClick={onCode}
                disabled={isSubmitting || code.length !== 6}
                className={`w-full btn-primary py-3 text-lg font-semibold ${
                  isSubmitting ? "btn-loading" : ""
                }`}
              >
                <span>Verify</span>
                {isSubmitting && <div className="spin-load" />}
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-sm">
            <a href="/sign-up" className="url">
              Create an Account
            </a>
            <span className="mx-3 text-gray-400">|</span>
            <a href="/forgot" className="url">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
