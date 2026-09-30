import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getTranslations("auth");
  const next = (await searchParams).next;

  return (
    <Card className="mx-auto mt-8 max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t("loginHeading")}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </CardContent>
      <CardFooter className="gap-1 text-sm text-muted-foreground">
        {t("noAccount")}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {t("signup")}
        </Link>
      </CardFooter>
    </Card>
  );
}
