import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/supabase/server";
import { WishForm } from "./wish-form";

export default async function NewWishPage() {
  const t = await getTranslations("newWish");
  const { user } = await getUser();
  if (!user) redirect("/login?next=/wish/new");

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">{t("heading")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <WishForm userId={user.id} />
      </CardContent>
    </Card>
  );
}
