"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions";
import { FormFeedback } from "@/components/form-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ wishId }: { wishId: string }) {
  const t = useTranslations("comments");
  const [state, action] = useActionState(addComment, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="wishId" value={wishId} />
      <Textarea name="body" placeholder={t("placeholder")} maxLength={2000} required />
      <div className="space-y-2">
        <Label htmlFor="link">{t("linkLabel")}</Label>
        <Input id="link" name="link" type="url" placeholder={t("linkPlaceholder")} />
      </div>
      <FormFeedback state={state} />
      <SubmitButton pendingText={t("submitting")}>{t("submit")}</SubmitButton>
    </form>
  );
}
