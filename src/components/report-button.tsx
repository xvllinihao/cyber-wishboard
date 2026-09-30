"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { report } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function ReportButton({
  target,
  id,
  signedIn,
}: {
  target: "wish" | "comment";
  id: string;
  signedIn: boolean;
}) {
  const t = useTranslations("report");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!window.confirm(t("confirm"))) return;
    startTransition(async () => {
      const result = await report(target, id);
      if (!result.error) toast.success(t("done"));
      else if (result.error === "duplicate") toast.info(t("duplicate"));
      else toast.error(t("failed"));
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={onClick}
      className="h-7 text-muted-foreground"
      title={t("label")}
    >
      <Flag className="size-3.5" />
      <span className="sr-only sm:not-sr-only">{t("label")}</span>
    </Button>
  );
}
