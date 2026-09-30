"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IMAGE_BUCKET, imageUrl, MAX_WISH_IMAGES } from "@/lib/images";
import { isFlagged } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

function captchaToken(formData: FormData) {
  const token = formData.get("cf-turnstile-response");
  return typeof token === "string" && token ? token : undefined;
}

// Only accept storage paths inside the uploader's own folder.
function ownImagePaths(formData: FormData, userId: string, max: number) {
  return formData
    .getAll("image_paths")
    .map(String)
    .filter((path) => path.startsWith(`${userId}/`) && !path.includes(".."))
    .slice(0, max);
}

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
      captchaToken: captchaToken(formData),
    },
  });
  if (error?.code === "captcha_failed") return { error: "auth.captchaFailed" };
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
    options: { captchaToken: captchaToken(formData) },
  });
  if (error) {
    if (error.code === "captcha_failed") return { error: "auth.captchaFailed" };
    return { error: "auth.invalidCredentials" };
  }
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wish/new");

  const imagePaths = ownImagePaths(formData, user.id, MAX_WISH_IMAGES);
  if (await isFlagged({ text: `${title}\n${content}`, imageUrls: imagePaths.map(imageUrl) })) {
    await removeImages(imagePaths);
    return { error: "errors.flagged" };
  }

  const { data, error } = await supabase
    .from("wishes")
    .insert({ title, content, image_paths: imagePaths })
    .select("id")
    .single();
  if (error) return { error: "errors.generic" };

  redirect(`/wish/${data.id}`);
}

async function removeImages(paths: string[]) {
  if (paths.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from(IMAGE_BUCKET).remove(paths);
}

export async function deleteWish(wishId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("wishes").delete().eq("id", wishId).select("image_paths");
  await removeImages(data?.flatMap((row) => row.image_paths as string[]) ?? []);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "errors.generic" };

  const [imagePath = null] = ownImagePaths(formData, user.id, 1);
  if (await isFlagged({ text: body, imageUrls: imagePath ? [imageUrl(imagePath)] : [] })) {
    await removeImages(imagePath ? [imagePath] : []);
    return { error: "errors.flagged" };
  }

  const { error } = await supabase
    .from("comments")
    .insert({ wish_id: wishId, body, link, image_path: imagePath });
  if (error) return { error: "errors.generic" };

  revalidatePath(`/wish/${wishId}`);
  return {};
}

export async function deleteComment(commentId: string, wishId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("comments").delete().eq("id", commentId).select("image_path");
  await removeImages(data?.map((row) => row.image_path as string | null).filter((p) => p !== null) ?? []);
  revalidatePath(`/wish/${wishId}`);
}

export async function report(target: "wish" | "comment", id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" as const };

  const { error } =
    target === "wish"
      ? await supabase.from("wish_reports").insert({ wish_id: id })
      : await supabase.from("comment_reports").insert({ comment_id: id });
  if (error?.code === "23505") return { error: "duplicate" as const };
  if (error) return { error: "generic" as const };
  return {};
}
