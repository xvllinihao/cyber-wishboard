"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleLike } from "@/app/actions";
import { cn } from "@/lib/utils";

export function LikeButton({
  wishId,
  liked,
  count,
  signedIn,
  className,
}: {
  wishId: string;
  liked: boolean;
  count: number;
  signedIn: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ liked, count });

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !state.liked;
    startTransition(async () => {
      setOptimistic({ liked: next, count: state.count + (next ? 1 : -1) });
      const result = await toggleLike(wishId, next);
      if (result.error) toast.error(t("errors.generic"));
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={state.liked}
      aria-label={state.liked ? t("wish.unlike") : t("wish.like")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors hover:bg-primary/10",
        state.liked ? "text-primary" : "text-muted-foreground",
        className,
      )}
    >
      <Heart className={cn("size-4", state.liked && "fill-current")} />
      <span className="tabular-nums">{state.count}</span>
    </button>
  );
}
