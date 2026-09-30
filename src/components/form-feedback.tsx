"use client";

import { useTranslations } from "next-intl";
import type { FormState } from "@/app/actions";

// Server actions return message keys; unknown strings (e.g. Supabase errors) are shown as-is.
export function FormFeedback({ state }: { state: FormState }) {
  const t = useTranslations();
  if (!state?.error && !state?.message) return null;
  const key = (state.error ?? state.message)!;
  const text = t.has(key) ? t(key) : key;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={
        state.error
          ? "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
      }
    >
      {text}
    </p>
  );
}
