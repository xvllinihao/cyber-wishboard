"use client";

import { useTranslations } from "next-intl";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useRef } from "react";
import { signUp } from "@/app/actions";
import { Captcha } from "@/components/captcha";
import { FormFeedback } from "@/components/form-feedback";
import { SubmitButton } from "@/components/submit-button";
import { useFormAction } from "@/lib/use-form-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const t = useTranslations("auth");
  const [state, onSubmit, pending] = useFormAction(signUp);
  const captcha = useRef<TurnstileInstance>(undefined);

  // A Turnstile token is single-use, so get a fresh one after each attempt.
  useEffect(() => {
    if (state) captcha.current?.reset();
  }, [state]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">{t("username")}</Label>
        <Input
          id="username"
          name="username"
          placeholder={t("usernamePlaceholder")}
          minLength={2}
          maxLength={32}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <Captcha ref={captcha} />
      <FormFeedback state={state} />
      <SubmitButton pending={pending} className="w-full">{t("signup")}</SubmitButton>
    </form>
  );
}
