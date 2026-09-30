import { ArrowLeft, ExternalLink, MessageCircle, Trash2 } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteComment, deleteWish } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";
import { LikeButton } from "@/components/like-button";
import { ReportButton } from "@/components/report-button";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/images";
import { likedWishIds } from "@/lib/likes";
import { getUser } from "@/lib/supabase/server";
import { COMMENT_FIELDS, WISH_FIELDS, type Wish, type WishComment } from "@/lib/types";
import { CommentForm } from "./comment-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function WishPage({ params }: PageProps<"/wish/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const t = await getTranslations();
  const format = await getFormatter();
  const { supabase, user } = await getUser();

  const [{ data: wishData }, { data: commentData }] = await Promise.all([
    supabase.from("wishes").select(WISH_FIELDS).eq("id", id).maybeSingle(),
    supabase
      .from("comments")
      .select(COMMENT_FIELDS)
      .eq("wish_id", id)
      .order("created_at", { ascending: true }),
  ]);
  if (!wishData) notFound();

  const wish = wishData as unknown as Wish;
  const comments = (commentData ?? []) as unknown as WishComment[];
  const liked = (await likedWishIds(supabase, user, [id])).has(id);
  const isOwner = user?.id === wish.author_id;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("wish.back")}
      </Link>

      <article className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight">{wish.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t("wish.by", { name: wish.author?.username ?? t("wish.anonymous") })} ·{" "}
            {format.dateTime(new Date(wish.created_at), { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </header>
        <div className="whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-4 font-mono text-sm leading-relaxed">
          {wish.content}
        </div>
        {wish.image_paths.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {wish.image_paths.map((path) => (
              <a key={path} href={imageUrl(path)} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(path)} alt="" className="w-full rounded-lg border object-cover" />
              </a>
            ))}
          </div>
        )}
        <footer className="flex flex-wrap items-center gap-2">
          <LikeButton wishId={wish.id} liked={liked} count={wish.like_count} signedIn={!!user} />
          <span className="inline-flex items-center gap-1.5 px-2.5 text-sm text-muted-foreground">
            <MessageCircle className="size-4" />
            {t("wish.comments", { count: wish.comment_count })}
          </span>
          <span className="ml-auto flex gap-2">
            <CopyButton text={wish.content} />
            {!isOwner && <ReportButton target="wish" id={wish.id} signedIn={!!user} />}
            {isOwner && (
              <form action={deleteWish.bind(null, wish.id)}>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 />
                  {t("wish.delete")}
                </Button>
              </form>
            )}
          </span>
        </footer>
      </article>

      <section id="comments" className="space-y-4">
        <h2 className="text-lg font-semibold">{t("comments.heading")}</h2>
        {user ? (
          <CommentForm wishId={wish.id} userId={user.id} />
        ) : (
          <Button asChild variant="outline">
            <Link href={`/login?next=/wish/${wish.id}`}>{t("comments.loginToComment")}</Link>
          </Button>
        )}
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("comments.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="space-y-2 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{comment.author?.username ?? t("wish.anonymous")}</span>
                  <span className="text-muted-foreground">
                    {format.relativeTime(new Date(comment.created_at))}
                  </span>
                  {user?.id === comment.author_id ? (
                    <form action={deleteComment.bind(null, comment.id, wish.id)} className="ml-auto">
                      <Button variant="ghost" size="sm" className="h-7 text-muted-foreground">
                        {t("comments.delete")}
                      </Button>
                    </form>
                  ) : (
                    <span className="ml-auto">
                      <ReportButton target="comment" id={comment.id} signedIn={!!user} />
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p>
                {comment.image_path && (
                  <a href={imageUrl(comment.image_path)} target="_blank" rel="noopener noreferrer" className="block w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl(comment.image_path)}
                      alt=""
                      loading="lazy"
                      className="max-h-80 rounded-md border object-contain"
                    />
                  </a>
                )}
                {comment.link && (
                  <a
                    href={comment.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary hover:bg-primary/15"
                  >
                    <ExternalLink className="size-3.5" />
                    {t("comments.result")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
