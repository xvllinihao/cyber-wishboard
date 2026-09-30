"use client";

import { useTranslations } from "next-intl";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useRef } from "react";
import { signIn } from "@/app/actions";
import { Captcha } from "@/components/captcha";
import { FormFeedback } from "@/components/form-feedback";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const [state, onSubmit, pending] = useFormAction(signIn);
  const captcha = useRef<TurnstileInstance>(undefined);

  // A Turnstile token is single-use, so get a fresh one after each attempt.
  useEffect(() => {
    if (state) captcha.current?.reset();
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Captcha ref={captcha} />
      <FormFeedback state={state} />
      <SubmitButton pending={pending} className="w-full">{t("login")}</SubmitButton>
    </form>
  );
}
