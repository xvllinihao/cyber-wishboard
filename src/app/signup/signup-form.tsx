"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { signUp } from "@/app/actions";
import { FormFeedback } from "@/components/form-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const t = useTranslations("auth");
  const [state, action] = useActionState(signUp, undefined);

  return (
    <form action={action} className="space-y-4">
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
      <FormFeedback state={state} />
      <SubmitButton className="w-full">{t("signup")}</SubmitButton>
    </form>
  );
}
