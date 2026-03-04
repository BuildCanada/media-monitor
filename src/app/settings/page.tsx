"use client";

import { useCallback, useEffect, useState } from "react";

interface AuthStatus {
  jwt: {
    hasToken: boolean;
    expiresAt?: string;
    isExpired?: boolean;
    updatedAt?: string;
  };
  proxyCookies: {
    hasCookies: boolean;
    updatedAt?: string;
    notes?: string;
  };
}

export default function SettingsPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [jwtInput, setJwtInput] = useState("");
  const [cookiesInput, setCookiesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/auth/status");
    const data = (await res.json()) as AuthStatus;
    setAuthStatus(data);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleSaveJwt() {
    if (!jwtInput.trim()) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "jwt", token: jwtInput.trim() }),
    });
    if (res.ok) {
      setMessage("JWT token saved.");
      setJwtInput("");
      await fetchStatus();
    } else {
      setMessage("Failed to save JWT token.");
    }
    setSaving(false);
  }

  async function handleSaveCookies() {
    if (!cookiesInput.trim()) return;
    setSaving(true);
    setMessage("");

    // Parse cookie string into object: "key1=value1; key2=value2"
    const cookies: Record<string, string> = {};
    for (const part of cookiesInput.split(";")) {
      const [key, ...valParts] = part.trim().split("=");
      if (key) cookies[key.trim()] = valParts.join("=").trim();
    }

    const res = await fetch("/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "proxy_cookies", cookies }),
    });
    if (res.ok) {
      setMessage("Proxy cookies saved.");
      setCookiesInput("");
      await fetchStatus();
    } else {
      setMessage("Failed to save cookies.");
    }
    setSaving(false);
  }

  function formatExpiry(expiresAt?: string, isExpired?: boolean) {
    if (!expiresAt) return "Unknown";
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);

    if (isExpired) return `Expired (${date.toLocaleString()})`;
    if (diffMin < 60) return `${diffMin}m remaining`;
    return `${Math.round(diffMin / 60)}h remaining (${date.toLocaleString()})`;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {message && (
        <div className="mt-4 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          {message}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Auth Status */}
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500">Auth Status</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>JWT Token</span>
              <span
                className={
                  authStatus?.jwt.hasToken && !authStatus.jwt.isExpired
                    ? "text-green-600"
                    : "text-red-500"
                }
              >
                {authStatus?.jwt.hasToken
                  ? formatExpiry(authStatus.jwt.expiresAt, authStatus.jwt.isExpired)
                  : "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Proxy Cookies</span>
              <span
                className={
                  authStatus?.proxyCookies.hasCookies ? "text-green-600" : "text-red-500"
                }
              >
                {authStatus?.proxyCookies.hasCookies
                  ? `Set (${authStatus.proxyCookies.updatedAt ? new Date(authStatus.proxyCookies.updatedAt).toLocaleDateString() : "unknown"})`
                  : "Not set"}
              </span>
            </div>
          </div>
        </div>

        {/* JWT Input */}
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500">Update JWT Token</h2>
          <p className="mt-1 text-xs text-neutral-400">
            Paste the Bearer token from PressReader (starts with &quot;eyJ&quot;).
          </p>
          <textarea
            value={jwtInput}
            onChange={(e) => setJwtInput(e.target.value)}
            placeholder="eyJhbGciOiJSUzI1NiIs..."
            rows={3}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            onClick={handleSaveJwt}
            disabled={saving || !jwtInput.trim()}
            className="mt-2 rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            Save JWT
          </button>
        </div>

        {/* Proxy Cookies Input */}
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500">Update Proxy Cookies</h2>
          <p className="mt-1 text-xs text-neutral-400">
            Paste the cookie string from the EDPL proxy session (e.g., &quot;ezproxy=Hm2SX3Ae...;
            AProfile=...&quot;).
          </p>
          <textarea
            value={cookiesInput}
            onChange={(e) => setCookiesInput(e.target.value)}
            placeholder="ezproxy=...; AProfile=..."
            rows={3}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            onClick={handleSaveCookies}
            disabled={saving || !cookiesInput.trim()}
            className="mt-2 rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            Save Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
