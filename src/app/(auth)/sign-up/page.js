"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
});

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || "Registration failed");
      return;
    }
    router.push("/sign-in?registered=1");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join us and secure your data with MFA</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">Full Name</label>
              <input 
                id="name" 
                {...register("name")} 
                placeholder="Enter your full name" 
                className="form-input"
              />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <input 
                id="email" 
                type="email" 
                {...register("email")} 
                placeholder="Enter your email" 
                className="form-input"
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                id="password" 
                type="password" 
                {...register("password")} 
                placeholder="Create a strong password" 
                className="form-input"
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>
            
            <button 
              type="submit"
              className="w-full btn-primary py-3 text-lg font-semibold" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}