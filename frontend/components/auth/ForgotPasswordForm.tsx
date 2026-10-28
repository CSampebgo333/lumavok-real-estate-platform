"use client";
import { UiText, useUi } from "@/components/common/UiText";


import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validation/auth";
import { authService } from "@/services";

export function ForgotPasswordForm() {
  const ui = useUi();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);

    try {
      // Always resolves regardless of whether the email matches an account
      // (docs/ARCHITECTURE.md / OWASP anti-enumeration) — a thrown error here
      // means a real infrastructure failure, not "email not found".
      await authService.requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (submittedEmail) {
    return (
      <div role="status" className="flex flex-col gap-2 text-center text-sm">
        <p className="font-medium"><UiText text={"Check your email"} /></p>
        <p className="text-muted-foreground"><UiText text={"If an account exists for"} />{" "}{submittedEmail}<UiText text={", we've sent a link to reset your password."} />{" "}</p>
      </div>
    );
  }

  // `method="post"` keeps a pre-hydration native submit out of the URL — see
  // the full explanation in LoginForm. No password here, but an email address
  // in a URL is still a disclosure.
  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        label={ui("Email")}
        htmlFor="forgot-email"
        error={errors.email?.message}
      >
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? ui("Sending…") : ui("Send reset link")}
      </Button>
    </form>
  );
}
