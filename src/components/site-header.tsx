import { LogOut, Plus, Sparkles, User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const { user } = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <Link href="/" className="mr-auto flex items-center gap-2 font-bold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          <span>{t("brand")}</span>
        </Link>
        <LocaleSwitcher />
        {user ? (
          <>
            <Button asChild size="sm">
              <Link href="/wish/new">
                <Plus />
                <span className="hidden sm:inline">{t("newWish")}</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/me">
                <User />
                <span className="hidden sm:inline">{t("me")}</span>
              </Link>
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="icon" aria-label={t("logout")} title={t("logout")}>
                <LogOut />
              </Button>
            </form>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">{t("signup")}</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
