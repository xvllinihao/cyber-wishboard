"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { FormState } from "@/app/actions";
import { addComment } from "@/app/actions";
import { ImageUploader } from "@/components/image-uploader";
import { FormFeedback } from "@/components/form-feedback";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ wishId, userId }: { wishId: string; userId: string }) {
  const t = useTranslations("comments");
  const formRef = useRef<HTMLFormElement>(null);
  // Remount the uploader once its image is posted or deleted as flagged.
  const [formKey, setFormKey] = useState(0);
  const [state, onSubmit, pending] = useFormAction(async (prev: FormState, formData: FormData) => {
    const result = await addComment(prev, formData);
    if (!result?.error) formRef.current?.reset();
    if (!result?.error || result.error === "errors.flagged") setFormKey((k) => k + 1);
    return result;
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="wishId" value={wishId} />
      <Textarea name="body" placeholder={t("placeholder")} maxLength={2000} required />
      <div className="space-y-2">
        <Label htmlFor="link">{t("linkLabel")}</Label>
        <Input id="link" name="link" type="url" placeholder={t("linkPlaceholder")} />
      </div>
      <ImageUploader key={formKey} userId={userId} max={1} />
      <FormFeedback state={state} />
      <SubmitButton pending={pending} pendingText={t("submitting")}>{t("submit")}</SubmitButton>
    </form>
  );
}
