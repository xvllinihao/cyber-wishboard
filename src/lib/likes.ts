import type { SupabaseClient, User } from "@supabase/supabase-js";

// Which of these wishes the current user has liked.
export async function likedWishIds(supabase: SupabaseClient, user: User | null, wishIds: string[]) {
  if (!user || wishIds.length === 0) return new Set<string>();
  const { data } = await supabase
    .from("likes")
    .select("wish_id")
    .eq("user_id", user.id)
    .in("wish_id", wishIds);
  return new Set((data ?? []).map((row) => row.wish_id as string));
}
