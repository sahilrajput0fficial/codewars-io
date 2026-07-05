"use client"

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  loginUser,
  signupUser,
  forgetPassword,
  loginWithGoogle,
  loginWithGithub,
} from "./functions";

type AuthMode = "login" | "signup" | "forget-password";

/* ── inline SVG icons ───────────────────────────────────────────────────────── */
function GithubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/* ── field label ────────────────────────────────────────────────────────────── */
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium mb-1.5"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </label>
  );
}

/* ── styled input ───────────────────────────────────────────────────────────── */
function AuthInput({
  id, type = "text", placeholder, value, onChange, disabled, required,
}: {
  id: string; type?: string; placeholder?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; required?: boolean;
}) {
  return (
    <input
      id={id} type={type} placeholder={placeholder}
      value={value} onChange={onChange} disabled={disabled} required={required}
      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
      style={{
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-primary)",
        transition: "border-color 150ms",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
    />
  );
}

/* ── password input with toggle ─────────────────────────────────────────────── */
function PasswordInput({
  id, placeholder = "••••••••", value, onChange, disabled, required, show, onToggle,
}: {
  id: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; required?: boolean; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        id={id} type={show ? "text" : "password"} placeholder={placeholder}
        value={value} onChange={onChange} disabled={disabled} required={required}
        className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
          transition: "border-color 150ms",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
      />
      <button
        type="button" tabIndex={-1} onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ── main form component ────────────────────────────────────────────────────── */
function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setAuthMode("signup");
    else if (mode === "forget-password") setAuthMode("forget-password");
    else setAuthMode("login");
  }, [searchParams]);

  const clearForm = () => {
    setUsername(""); setEmail(""); setPassword("");
    setRepeatPassword(""); setNewPassword(""); setAgreePolicy(false);
    setError(null); setSuccess(null);
  };

  const handleModeChange = (mode: AuthMode) => { clearForm(); setAuthMode(mode); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (authMode === "login") {
        if (!email || !password) throw new Error("Please enter email and password.");
        const res = await loginUser({ username: email, password });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Incorrect credentials"); }
        router.push("/dashboard");
      } else if (authMode === "signup") {
        if (!email || !password || !repeatPassword) throw new Error("All fields are required.");
        if (password !== repeatPassword) throw new Error("Passwords do not match.");
        if (!agreePolicy) throw new Error("You must agree to the privacy policy.");
        const res = await signupUser({ username: email.split("@")[0], email, password });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Signup failed"); }
        setSuccess("Account created! Redirecting…");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        if (!username || !email || !newPassword) throw new Error("All fields are required.");
        const res = await forgetPassword({ username, email, new_password: newPassword });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Reset failed"); }
        setSuccess("Password updated! Redirecting…");
        setTimeout(() => router.push("/dashboard"), 1200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    try {
      const { error: e } = provider === "google" ? await loginWithGoogle() : await loginWithGithub();
      if (e) throw e;
    } catch (err: any) {
      setError(err.message || "Social login failed");
    }
  };

  const title: Record<AuthMode, string> = {
    login: "Welcome back",
    signup: "Create account",
    "forget-password": "Reset password",
  };
  const subtitle: Record<AuthMode, string> = {
    login: "Sign in to continue",
    signup: "Join the ranked arena",
    "forget-password": "We'll update your credentials",
  };

  return (
    /* ── root: lock to 100vh, no overflow whatsoever ── */
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        background: "var(--color-bg)",
        overflow: "hidden",
      }}
    >
      {/* ────────── LEFT — form panel ────────── */}
      <div
        style={{
          width: "50%",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
          borderRight: "1px solid var(--color-border)",
          overflowY: "auto",
        }}
      >
        {/* logo */}
        <div style={{ marginBottom: "36px" }}>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: 700,
              fontSize: "18px",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Code<span style={{ color: "var(--color-accent)" }}>Wars</span>
            <span style={{ color: "var(--color-accent)" }}>.</span>IO
          </span>
        </div>

        {/* heading */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: 700,
              fontSize: "22px",
              color: "var(--color-text-primary)",
              marginBottom: "4px",
              letterSpacing: "-0.02em",
            }}
          >
            {title[authMode]}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {subtitle[authMode]}
          </p>
        </div>

        {/* OAuth */}
        {authMode !== "forget-password" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {(["github", "google"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleOAuth(p)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "border-color 150ms, color 150ms",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "var(--color-text-tertiary)";
                    el.style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "var(--color-border)";
                    el.style.color = "var(--color-text-secondary)";
                  }}
                >
                  {p === "github" ? <GithubIcon /> : <GoogleIcon />}
                  <span style={{ textTransform: "capitalize" }}>{p}</span>
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
              <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                or continue with email
              </span>
              <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
            </div>
          </>
        )}

        {/* alerts */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--color-accent-muted)",
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
              fontSize: "13px",
              marginBottom: "16px",
              animation: "rise-in 220ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--color-success)",
              color: "var(--color-success)",
              fontSize: "13px",
              marginBottom: "16px",
              animation: "rise-in 220ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* email */}
          <div>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <AuthInput
              id="email" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={loading} required
            />
          </div>

          {/* username — forget-password only */}
          {authMode === "forget-password" && (
            <div>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <AuthInput
                id="username" placeholder="your_username"
                value={username} onChange={(e) => setUsername(e.target.value)}
                disabled={loading} required
              />
            </div>
          )}

          {/* password */}
          {authMode !== "forget-password" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => handleModeChange("forget-password")}
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-tertiary)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      transition: "color 150ms",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)"; }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <PasswordInput
                id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={loading} required show={showPassword} onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
          )}

          {/* new password — forget-password only */}
          {authMode === "forget-password" && (
            <div>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <PasswordInput
                id="newPassword" placeholder="New password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading} required show={showPassword} onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
          )}

          {/* confirm password — signup only */}
          {authMode === "signup" && (
            <div>
              <FieldLabel htmlFor="repeatPassword">Confirm password</FieldLabel>
              <PasswordInput
                id="repeatPassword" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)}
                disabled={loading} required show={showPassword} onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
          )}

          {/* agree policy — signup only */}
          {authMode === "signup" && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox" checked={agreePolicy}
                onChange={(e) => setAgreePolicy(e.target.checked)}
                disabled={loading}
                style={{ marginTop: "2px", accentColor: "var(--color-accent)" }}
              />
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                I agree to the{" "}
                <span style={{ color: "var(--color-text-primary)" }}>terms &amp; privacy policy</span>
              </span>
            </label>
          )}

          {/* CTA — angular clip per DESIGN.md §7 */}
          <button
            type="submit"
            disabled={loading}
            className="clip-corner-br"
            style={{
              width: "100%",
              padding: "11px",
              marginTop: "4px",
              background: loading ? "var(--color-accent-hover)" : "var(--color-accent)",
              border: "none",
              color: "var(--color-text-on-accent)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 150ms",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "14px", height: "14px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
                Working…
              </>
            ) : (
              authMode === "login" ? "Login"
              : authMode === "signup" ? "Create account"
              : "Reset password"
            )}
          </button>
        </form>

        {/* mode switcher */}
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            marginTop: "20px",
          }}
        >
          {authMode === "login" && (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => handleModeChange("signup")}
                disabled={loading}
                style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontWeight: 600, color: "var(--color-text-primary)", transition: "color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)"; }}
              >
                Sign up
              </button>
            </>
          )}
          {authMode === "signup" && (
            <>
              Already have an account?{" "}
              <button
                onClick={() => handleModeChange("login")}
                disabled={loading}
                style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontWeight: 600, color: "var(--color-text-primary)", transition: "color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)"; }}
              >
                Login instead
              </button>
            </>
          )}
          {authMode === "forget-password" && (
            <button
              onClick={() => handleModeChange("login")}
              disabled={loading}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontWeight: 600, color: "var(--color-text-primary)", transition: "color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)"; }}
            >
              ← Back to login
            </button>
          )}
        </p>
      </div>

      {/* ────────── RIGHT — branding panel (hidden on small screens) ────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 72px",
          background: "var(--color-surface)",
          overflow: "hidden",
        }}
        className="hidden lg:flex"
      >
        <div style={{ maxWidth: "480px" }}>
          {/* headline */}
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontWeight: 700,
              fontSize: "42px",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--color-text-primary)",
              marginBottom: "16px",
            }}
          >
            Ranked 1v1<br />
            DSA battles,{" "}
            <span style={{ color: "var(--color-accent)" }}>live.</span>
          </p>
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.7,
              color: "var(--color-text-secondary)",
              marginBottom: "40px",
            }}
          >
            Solve problems faster than your opponent.
            Climb the leaderboard. Earn your tier.
          </p>

          {/* stats */}
          <div style={{ display: "flex", gap: "40px", marginBottom: "40px" }}>
            {[
              { label: "Active players", value: "12,400+" },
              { label: "Problems", value: "840+" },
              { label: "Matches today", value: "3,200+" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "2px",
                  }}
                >
                  {value}
                </p>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* divider */}
          <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "24px" }} />

          {/* tier badges */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              { label: "Bronze", color: "var(--color-tier-bronze)" },
              { label: "Silver", color: "var(--color-tier-silver)" },
              { label: "Gold", color: "var(--color-tier-gold)" },
              { label: "Diamond", color: "var(--color-tier-diamond)" },
            ].map(({ label, color }) => (
              <span
                key={label}
                style={{
                  padding: "4px 12px",
                  borderRadius: "4px",
                  border: `1px solid ${color}`,
                  color,
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "transparent",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-bg)",
            color: "var(--color-text-secondary)",
            fontSize: "14px",
          }}
        >
          Loading…
        </div>
      }
    >
      <AuthFormContent />
    </Suspense>
  );
}
