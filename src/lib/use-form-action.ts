"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/app/actions";

// Like useActionState, but submits via onSubmit so React doesn't reset the
// form's fields after the action; a failed submit keeps what the user typed.
export function useFormAction(fn: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState(fn, undefined);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }
  return [state, onSubmit, pending] as const;
}
