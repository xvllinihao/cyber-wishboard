"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useLocale } from "next-intl";
import { forwardRef } from "react";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Cloudflare Turnstile widget. It adds a `cf-turnstile-response` field to the
// surrounding form. Renders nothing until the site key is configured.
export const Captcha = forwardRef<TurnstileInstance | undefined>(function Captcha(_, ref) {
  const locale = useLocale();
  if (!siteKey) return null;
  return (
    <Turnstile
      ref={ref}
      siteKey={siteKey}
      options={{ language: locale === "zh" ? "zh-cn" : "en", size: "flexible" }}
    />
  );
});
