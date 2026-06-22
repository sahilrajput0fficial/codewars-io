import { BASE_URL } from "@/proxy";
import { supabase } from "@/app/utility/supabase";
import { LoginPayload, SignupPayload, ForgetPasswordPayload } from "./schemas";

export async function loginUser(payload: LoginPayload): Promise<Response> {
  const url = `${BASE_URL}/auth/login`;
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function signupUser(payload: SignupPayload): Promise<Response> {
  const url = `${BASE_URL}/auth/signup`;
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function forgetPassword(payload: ForgetPasswordPayload): Promise<Response> {
  const url = `${BASE_URL}/auth/forget-pass`;
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function loginWithGoogle(): Promise<{ error: any }> {
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function loginWithGithub(): Promise<{ error: any }> {
  return await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
