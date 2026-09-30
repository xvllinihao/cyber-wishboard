import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WishGrid } from "@/components/wish-card";
import { likedWishIds } from "@/lib/likes";
import { getUser } from "@/lib/supabase/server";
import { WISH_FIELDS, type Wish } from "@/lib/types";
import { cn } from "@/lib/utils";

const tabs = ["wishes", "likes", "comments"] as const;
type Tab = (typeof tabs)[number];

type MyComment = {
  id: string;
  body: string;
  created_at: string;
  wish: { id: string; title: string } | null;
};

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/me");

  const t = await getTranslations("me");
  const format = await getFormatter();
  const requested = (await searchParams).tab;
  const tab: Tab = tabs.includes(requested as Tab) ? (requested as Tab) : "wishes";

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  let wishes: Wish[] = [];
  let comments: MyComment[] = [];

  if (tab === "wishes") {
    const { data } = await supabase
      .from("wishes")
      .select(WISH_FIELDS)
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    wishes = (data ?? []) as unknown as Wish[];
  } else if (tab === "likes") {
    const { data } = await supabase
      .from("likes")
      .select(`created_at, wish:wishes(${WISH_FIELDS})`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    wishes = (data ?? []).map((row) => row.wish).filter(Boolean) as unknown as Wish[];
  } else {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, wish:wishes(id, title)")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    comments = (data ?? []) as unknown as MyComment[];
  }

  const likedIds = await likedWishIds(supabase, user, wishes.map((w) => w.id));
  const label: Record<Tab, string> = {
    wishes: t("tabWishes"),
    likes: t("tabLikes"),
    comments: t("tabComments"),
  };
  const empty: Record<Tab, string> = {
    wishes: t("emptyWishes"),
    likes: t("emptyLikes"),
    comments: t("emptyComments"),
  };
  const isEmpty = tab === "comments" ? comments.length === 0 : wishes.length === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="text-muted-foreground">
          {profile?.username} · {user.email}
        </p>
      </div>

      <nav className="flex w-fit gap-1 rounded-lg bg-muted p-1 text-sm">
        {tabs.map((key) => (
          <Link
            key={key}
            href={`/me?tab=${key}`}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              tab === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label[key]}
          </Link>
        ))}
      </nav>

      {isEmpty ? (
        <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">{empty[tab]}</p>
      ) : tab === "comments" ? (
        <ul className="max-w-3xl space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border bg-card p-4">
              <Link href={`/wish/${comment.wish?.id}#comments`} className="block space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("onWish", { title: comment.wish?.title ?? "" })} ·{" "}
                  {format.relativeTime(new Date(comment.created_at))}
                </p>
                <p className="line-clamp-3 whitespace-pre-wrap break-words">{comment.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <WishGrid wishes={wishes} likedIds={likedIds} signedIn />
      )}
    </div>
  );
}
