"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { createWish } from "@/app/actions";
import { FormFeedback } from "@/components/form-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function WishForm() {
  const t = useTranslations("newWish");
  const [state, action] = useActionState(createWish, undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">{t("titleLabel")}</Label>
        <Input id="title" name="title" placeholder={t("titlePlaceholder")} maxLength={120} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">{t("contentLabel")}</Label>
        <Textarea
          id="content"
          name="content"
          placeholder={t("contentPlaceholder")}
          maxLength={5000}
          className="min-h-48"
          required
        />
      </div>
      <FormFeedback state={state} />
      <SubmitButton pendingText={t("submitting")}>{t("submit")}</SubmitButton>
    </form>
  );
}
