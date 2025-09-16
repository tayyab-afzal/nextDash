"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data } = useSession();
  const [qr, setQr] = useState(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startMfa = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mfa/start", { method: "POST" });
      const j = await res.json();
      setQr(j.qrDataUrl);
    } catch (error) {
      alert("Failed to start MFA setup");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMfa = async () => {
    if (!token || token.length !== 6) {
      alert("Please enter a valid 6-digit code");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        alert("MFA enabled successfully! 🎉");
        setQr(null);
        setToken("");
        location.reload();
      } else {
        const j = await res.json();
        alert(j.error || "Failed to enable MFA");
      }
    } catch (error) {
      alert("Failed to confirm MFA");
    } finally {
      setIsLoading(false);
    }
  };

  if (!data?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MyApp</h1>
          <p className="text-gray-600 mb-8">Please sign in to continue</p>
          <a 
            href="/sign-in" 
            className="btn-primary text-lg px-8 py-3 inline-block"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {data.user.name || data.user.email}</p>
            </div>
            <button 
              onClick={() => signOut()} 
              className="btn-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* MFA Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
          
          {!data.user.mfaEnabled ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">Two-Factor Authentication</h3>
                <p className="text-yellow-700 text-sm">
                  Protect your account with an additional layer of security using an authenticator app.
                </p>
              </div>
              
              <button 
                onClick={startMfa} 
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? "Setting up..." : "Enable Two-Factor Authentication"}
              </button>
              
              {qr && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <h3 className="font-medium text-gray-900 mb-4">Scan QR Code</h3>
                  <div className="flex flex-col items-center space-y-4">
                    <img 
                      src={qr} 
                      alt="Scan QR with Authenticator app" 
                      className="w-48 h-48 rounded-lg border border-gray-200 bg-white p-2"
                    />
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Scan this QR code with your authenticator app:
                      </p>
                      <p className="text-xs text-gray-500">
                        Google Authenticator, Microsoft Authenticator, Authy, etc.
                      </p>
                    </div>
                    
                    <div className="w-full max-w-xs">
                      <label htmlFor="otp" className="form-label text-center">Enter 6-digit code</label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        placeholder="123456"
                        value={token}
                        onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="form-input text-center text-xl tracking-widest"
                      />
                    </div>
                    
                    <button 
                      onClick={confirmMfa}
                      disabled={isLoading || token.length !== 6}
                      className="btn-primary"
                    >
                      {isLoading ? "Verifying..." : "Confirm & Enable MFA"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✅</span>
                <div>
                  <h3 className="font-medium text-green-800">Two-Factor Authentication Enabled</h3>
                  <p className="text-green-700 text-sm">Your account is protected with MFA</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}