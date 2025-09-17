"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/sign-in");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-all">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-all flex flex-col">
      {/* Top Bar */}
      <header className="w-full flex justify-between items-center px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <h1 className="text-xl font-bold text-white">
          Welcome {data.user.name || data.user.email}
        </h1>
        <button
          onClick={() => signOut()}
          className="btn-primary"
        >
          Sign Out
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white/10 backdrop-blur-md border-r border-white/20 p-4 flex flex-col gap-6">
          {/* Example CRUD sections */}
          {["Create", "Read", "Update", "Delete", "Extra"].map((action) => (
            <div key={action} className="space-y-2">
              <input
                type="text"
                placeholder={`Enter ${action} data`}
                className="form-input"
              />
              <button className="btn-primary">
                {action}
              </button>
            </div>
          ))}
        </aside>
        <main className="flex-1">
          <div className="dashboard-central h-full flex items-center justify-center">
            <p className="text-white/80">
              TBD
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
