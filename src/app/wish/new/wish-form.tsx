"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormState } from "@/app/actions";
import { createWish } from "@/app/actions";
import { ImageUploader } from "@/components/image-uploader";
import { FormFeedback } from "@/components/form-feedback";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_WISH_IMAGES } from "@/lib/images";

export function WishForm({ userId }: { userId: string }) {
  const t = useTranslations("newWish");
  // Flagged posts have their images deleted server-side, so start the uploader fresh.
  const [uploaderKey, setUploaderKey] = useState(0);
  const [state, onSubmit, pending] = useFormAction(async (prev: FormState, formData: FormData) => {
    const result = await createWish(prev, formData);
    if (result?.error === "errors.flagged") setUploaderKey((k) => k + 1);
    return result;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
      <div className="space-y-2">
        <Label>{t("imagesLabel")}</Label>
        <ImageUploader key={uploaderKey} userId={userId} max={MAX_WISH_IMAGES} />
      </div>
      <FormFeedback state={state} />
      <SubmitButton pending={pending} pendingText={t("submitting")}>{t("submit")}</SubmitButton>
    </form>
  );
}
