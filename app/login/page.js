"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { BusyButton } from "@/components/Spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) setError("Wrong email or password.");
    else window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(circle at 20% 20%, #1a2140 0%, #0f1115 55%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent2 mx-auto mb-4 flex items-center justify-center text-2xl">
            🧭
          </div>
          <h1 className="text-2xl font-semibold text-white">Life Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">Your whole life, in one place.</p>
        </div>

        <div className="bg-panel/80 backdrop-blur border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <label className="text-xs text-gray-400 mb-1 block">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg border border-gray-700 rounded-xl p-3 mb-4 text-sm focus:border-accent outline-none"
            placeholder="you@email.com"
          />
          <label className="text-xs text-gray-400 mb-1 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            className="w-full bg-bg border border-gray-700 rounded-xl p-3 mb-5 text-sm focus:border-accent outline-none"
            placeholder="••••••••"
          />
          <BusyButton
            busy={busy}
            onClick={handleSignIn}
            className="w-full justify-center bg-gradient-to-r from-accent to-accent2 text-bg font-medium py-3 rounded-xl text-sm"
          >
            {busy ? "Signing in..." : "Sign in"}
          </BusyButton>
          {error && <p className="text-warn text-xs mt-3 text-center">{error}</p>}
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">
          Single-admin app — there's no public sign-up.
        </p>
      </div>
    </div>
  );
}
