import { MessageCircle } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { LikeButton } from "@/components/like-button";
import type { Wish } from "@/lib/types";

const tints = [
  "from-rose-100/70 dark:from-rose-500/10",
  "from-amber-100/70 dark:from-amber-500/10",
  "from-emerald-100/70 dark:from-emerald-500/10",
  "from-sky-100/70 dark:from-sky-500/10",
  "from-violet-100/70 dark:from-violet-500/10",
  "from-orange-100/70 dark:from-orange-500/10",
];

function tintFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return tints[Math.abs(hash) % tints.length];
}

export async function WishCard({
  wish,
  liked,
  signedIn,
}: {
  wish: Wish;
  liked: boolean;
  signedIn: boolean;
}) {
  const t = await getTranslations("wish");
  const format = await getFormatter();

  return (
    <article className="group mb-4 break-inside-avoid overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/wish/${wish.id}`} className={`block bg-gradient-to-b ${tintFor(wish.id)} to-transparent p-4`}>
        <h2 className="font-semibold leading-snug group-hover:text-primary">{wish.title}</h2>
        <p className="mt-2 line-clamp-[8] whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {wish.content}
        </p>
      </Link>
      <div className="flex items-center gap-1 px-2 pb-2 text-xs text-muted-foreground">
        <span className="mr-auto truncate px-2">
          {t("by", { name: wish.author?.username ?? t("anonymous") })} ·{" "}
          {format.relativeTime(new Date(wish.created_at))}
        </span>
        <LikeButton wishId={wish.id} liked={liked} count={wish.like_count} signedIn={signedIn} />
        <Link
          href={`/wish/${wish.id}#comments`}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm hover:bg-accent"
        >
          <MessageCircle className="size-4" />
          <span className="tabular-nums">{wish.comment_count}</span>
        </Link>
      </div>
    </article>
  );
}

export async function WishGrid({
  wishes,
  likedIds,
  signedIn,
}: {
  wishes: Wish[];
  likedIds: Set<string>;
  signedIn: boolean;
}) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {wishes.map((wish) => (
        <WishCard key={wish.id} wish={wish} liked={likedIds.has(wish.id)} signedIn={signedIn} />
      ))}
    </div>
  );
}
