import { BASE_URL, apiFetch } from "@/lib/api-client";
import { LoginPayload, SignupPayload, ForgetPasswordPayload } from "./schemas";

export async function loginUser(payload: LoginPayload): Promise<Response> {
  const url = `${BASE_URL}/auth/login`;
  return await apiFetch(url, {
    method: "POST",
    json: payload,
  });
}

export async function signupUser(payload: SignupPayload): Promise<Response> {
  const url = `${BASE_URL}/auth/signup`;
  return await apiFetch(url, {
    method: "POST",
    json: payload,
  });
}

export async function forgetPassword(payload: ForgetPasswordPayload): Promise<Response> {
  const url = `${BASE_URL}/auth/forget-pass`;
  return await apiFetch(url, {
    method: "POST",
    json: payload,
  });
}

export async function loginWithGoogle(): Promise<{ error: any }> {
  window.location.href = `${BASE_URL}/auth/oauth/google/login`;
  return { error: null };
}

export async function loginWithGithub(): Promise<{ error: any }> {
  window.location.href = `${BASE_URL}/auth/oauth/github/login`;
  return { error: null };
}
