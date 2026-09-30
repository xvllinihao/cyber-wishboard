import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WishGrid } from "@/components/wish-card";
import { likedWishIds } from "@/lib/likes";
import { getUser } from "@/lib/supabase/server";
import { WISH_FIELDS, type Wish } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function Home({ searchParams }: PageProps<"/">) {
  const t = await getTranslations("home");
  const sort = (await searchParams).sort === "new" ? "new" : "hot";
  const { supabase, user } = await getUser();

  let query = supabase.from("wishes").select(WISH_FIELDS);
  query =
    sort === "hot"
      ? query.order("score", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });
  const { data } = await query.limit(100);
  const wishes = (data ?? []) as unknown as Wish[];
  const likedIds = await likedWishIds(supabase, user, wishes.map((w) => w.id));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <nav className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
          {(["hot", "new"] as const).map((key) => (
            <Link
              key={key}
              href={key === "hot" ? "/" : "/?sort=new"}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                sort === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {key === "hot" ? t("sortHot") : t("sortNew")}
            </Link>
          ))}
        </nav>
      </section>

      {wishes.length > 0 ? (
        <WishGrid wishes={wishes} likedIds={likedIds} signedIn={!!user} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button asChild>
            <Link href={user ? "/wish/new" : "/signup"}>{t("cta")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
