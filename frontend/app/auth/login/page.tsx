"use client"

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  loginUser, 
  signupUser, 
  forgetPassword, 
  loginWithGoogle, 
  loginWithGithub 
} from "./functions";

type AuthMode = "login" | "signup" | "forget-password";

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const clearForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setRepeatPassword("");
    setNewPassword("");
    setAgreePolicy(false);
    setError(null);
    setSuccess(null);
  };

  const handleModeChange = (mode: AuthMode) => {
    clearForm();
    setAuthMode(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (authMode === "login") {
        if (!email || !password) {
          throw new Error("Please enter both email and password.");
        }
        // backend login accepts username or email in payload.username
        const res = await loginUser({ username: email, password });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Incorrect credentials");
        }
        router.push("/dashboard");
      } else if (authMode === "signup") {
        if (!email || !password || !repeatPassword) {
          throw new Error("All fields are required.");
        }
        if (password !== repeatPassword) {
          throw new Error("Passwords do not match.");
        }
        if (!agreePolicy) {
          throw new Error("You must agree to the privacy policy.");
        }
        // Generate a username from email if not present
        const generatedUsername = email.split("@")[0];
        const res = await signupUser({ username: generatedUsername, email, password });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Signup failed");
        }
        setSuccess("Account created successfully!");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else if (authMode === "forget-password") {
        if (!username || !email || !newPassword) {
          throw new Error("All fields are required.");
        }
        const res = await forgetPassword({ username, email, new_password: newPassword });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Reset request failed");
        }
        setSuccess("Password updated successfully!");
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
      const { error: oAuthError } = provider === "google" ? await loginWithGoogle() : await loginWithGithub();
      if (oAuthError) throw oAuthError;
    } catch (err: any) {
      setError(err.message || "Social login failed");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">
          {authMode === "login" && "Welcome Back"}
          {authMode === "signup" && "Get Started Now"}
          {authMode === "forget-password" && "Reset Password"}
        </h1>
        <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
          {authMode === "login" && "Welcome back! Enter your email below to login to your account."}
          {authMode === "signup" && "Welcome in our service, create account to start your experience."}
          {authMode === "forget-password" && "Confirm your account details to set a new password."}
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl max-w-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* OAuth Social Buttons (only for Login and Signup) */}
      {authMode !== "forget-password" && (
        <div className="flex flex-row gap-3 max-w-sm">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuth("github")}
            className="flex-1 border border-neutral-900 bg-[#0c0c0e]/80 text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 flex items-center justify-center gap-2 h-10 text-xs font-semibold rounded-xl transition-colors"
            disabled={loading}
          >
            {/* Apple Logo SVG Style or GitHub */}
            <svg className="w-3.5 h-3.5 fill-current text-neutral-300" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
            </svg>
            Sign up with GitHub
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuth("google")}
            className="flex-1 border border-neutral-900 bg-[#0c0c0e]/80 text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100 flex items-center justify-center gap-2 h-10 text-xs font-semibold rounded-xl transition-colors"
            disabled={loading}
          >
            {/* Google Logo SVG */}
            <svg className="w-3.5 h-3.5 fill-current text-neutral-300" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.646 0-8.212-3.83-8.212-8.514 0-4.686 3.566-8.515 8.212-8.515 2.193 0 3.992.836 5.378 2.13l3.225-3.225C18.665 1.5 15.65 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c7.1 0 12.24-5.01 12.24-12.24 0-.828-.073-1.637-.193-2.455H12.24z" />
            </svg>
            Sign up with Google
          </Button>
        </div>
      )}

      {/* Main Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        {/* Email Input */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs text-neutral-400 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Example@gmail.com"
            className="bg-[#0c0c0e]/50 border-neutral-900 text-neutral-200 h-10 rounded-xl px-4 focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Username input (Forget Password only) */}
        {authMode === "forget-password" && (
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs text-neutral-400 font-medium">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              className="bg-[#0c0c0e]/50 border-neutral-900 text-neutral-200 h-10 rounded-xl px-4 focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        )}

        {/* Password Inputs */}
        {authMode === "login" && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-xs text-neutral-400 font-medium">Password</Label>
              <button
                type="button"
                onClick={() => handleModeChange("forget-password")}
                className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="bg-[#0c0c0e]/50 border-neutral-900 text-neutral-200 pr-10 h-10 rounded-xl px-4 focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {authMode === "signup" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-neutral-400 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="bg-[#0c0c0e]/50 border-neutral-900 text-neutral-200 pr-10 h-10 rounded-xl px-4 focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repeatPassword" className="text-xs text-neutral-400 font-medium">Repeat password</Label>
              <div className="relative">
                <Input
                  id="repeatPassword"
                  type={showRepeatPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="bg-[#0c0c0e]/50 border-neutral-900 text-neutral-200 pr-10 h-10 rounded-xl px-4 focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showRepeatPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {authMode === "forget-password" && (
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs text-neutral-400 font-medium">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="bg-[#0c0c0e]/50 border-neutral-900 text-neutral-200 pr-10 h-10 rounded-xl px-4 focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Privacy Policy Checkbox (signup only) */}
        {authMode === "signup" && (
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="policy"
              checked={agreePolicy}
              onCheckedChange={(checked) => setAgreePolicy(checked === true)}
              disabled={loading}
              className="border-neutral-800 data-[state=checked]:bg-[#4f46e5] data-[state=checked]:border-[#4f46e5]"
            />
            <Label htmlFor="policy" className="text-[11px] text-neutral-500 cursor-pointer font-normal">
              I'm read and agree to the{" "}
              <a href="#" className="text-neutral-300 hover:underline">
                privacy policy
              </a>
            </Label>
          </div>
        )}

        {/* Submit Action Button */}
        <Button 
          type="submit" 
          className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium h-10 rounded-xl transition-colors text-xs flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-500/10"
          disabled={loading}
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
          ) : (
            <>
              {authMode === "login" && "Login"}
              {authMode === "signup" && "Sign Up"}
              {authMode === "forget-password" && "Reset Password"}
            </>
          )}
        </Button>
      </form>

      {/* Footer State Switches */}
      <div className="text-xs text-neutral-500 max-w-sm pt-2">
        {authMode === "login" ? (
          <>
            Don't have an account?{" "}
            <button 
              onClick={() => handleModeChange("signup")}
              className="text-neutral-200 hover:underline font-semibold"
              disabled={loading}
            >
              Sign up
            </button>
          </>
        ) : authMode === "signup" ? (
          <>
            Already have account?{" "}
            <button 
              onClick={() => handleModeChange("login")}
              className="text-neutral-200 hover:underline font-semibold"
              disabled={loading}
            >
              Sign in
            </button>
          </>
        ) : (
          <button 
            onClick={() => handleModeChange("login")}
            className="text-neutral-200 hover:underline font-semibold"
            disabled={loading}
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full">
      <Suspense fallback={
        <div className="w-full flex items-center justify-center p-8 bg-neutral-950/60 rounded-xl border border-neutral-800">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-neutral-400 animate-spin" />
        </div>
      }>
        <AuthFormContent />
      </Suspense>
    </div>
  );
}
