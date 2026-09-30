"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (username.length < 2 || username.length > 32) return { error: "auth.usernameInvalid" };
  if (password.length < 6) return { error: "auth.passwordTooShort" };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // With email confirmation off, Supabase signs the user in right away.
  if (data.session) redirect("/");
  return { message: "auth.checkEmail" };
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "auth.invalidCredentials" };
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createWish(_: FormState, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !content) return { error: "errors.required" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishes")
    .insert({ title, content })
    .select("id")
    .single();
  if (error) return { error: "errors.generic" };

  redirect(`/wish/${data.id}`);
}

export async function deleteWish(wishId: string) {
  const supabase = await createClient();
  await supabase.from("wishes").delete().eq("id", wishId);
  redirect("/me");
}

export async function toggleLike(wishId: string, like: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" as const };

  const { error } = like
    ? await supabase.from("likes").upsert(
        { user_id: user.id, wish_id: wishId },
        { onConflict: "user_id,wish_id", ignoreDuplicates: true },
      )
    : await supabase.from("likes").delete().eq("user_id", user.id).eq("wish_id", wishId);
  if (error) return { error: "generic" as const };

  revalidatePath("/", "layout");
  return {};
}

export async function addComment(_: FormState, formData: FormData): Promise<FormState> {
  const wishId = String(formData.get("wishId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim() || null;
  if (!body) return { error: "errors.required" };
  if (link && !/^https?:\/\//i.test(link)) return { error: "errors.invalidLink" };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ wish_id: wishId, body, link });
  if (error) return { error: "errors.generic" };

  revalidatePath(`/wish/${wishId}`);
  return {};
}

export async function deleteComment(commentId: string, wishId: string) {
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath(`/wish/${wishId}`);
}
