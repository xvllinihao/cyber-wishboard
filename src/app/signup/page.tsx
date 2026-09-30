import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const t = await getTranslations("auth");

  return (
    <Card className="mx-auto mt-8 max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t("signupHeading")}</CardTitle>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="gap-1 text-sm text-muted-foreground">
        {t("haveAccount")}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </CardFooter>
    </Card>
  );
}
