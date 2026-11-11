"use server";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  resetPasswordRequestSchema,
  updatePasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordRequestInput,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | { error: null };

/**
 * signIn/signUp/updatePassword deliberately return instead of calling
 * next/navigation's redirect() on success. redirect() thrown inside a
 * Server Action invoked via a plain async client call (not a native
 * <form action={fn}> submission) hands the browser a soft, Router-Cache
 * based navigation — which was observed in production to sometimes land
 * on a blank page with a stale cached route segment (e.g. still "login")
 * after a successful sign-in. The calling page instead does a hard
 * `window.location.href` navigation on success, guaranteeing a fresh
 * document load with no stale client router cache. signOut is unaffected
 * — it's invoked via a native <form action={signOut}>, a different code
 * path that doesn't have this failure mode.
 */
export async function signIn(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  return { error: null };
}

export async function signUp(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { fullName, email, password, organizationName } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Picked up by the auth.callback route once the user confirms their
      // email, to provision their organization exactly once.
      data: { full_name: fullName, organization_name: organizationName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  return { error: null };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  input: ResetPasswordRequestInput
): Promise<ActionResult> {
  const parsed = resetPasswordRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`,
  });
  // Deliberately do not reveal whether the email exists.
  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePassword(input: UpdatePasswordInput): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return { error: null };
}

export async function resendVerificationEmail(email: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error) return { error: error.message };
  return { error: null };
}
