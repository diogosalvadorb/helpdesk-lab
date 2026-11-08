"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { sendCode } from "@/actions/auth/otp";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { sendCodeSchema } from "@/lib/validations/otp";

import { AuthInput } from "./auth-input";
import { AuthFeedback, AuthStep, authSubmitClass } from "./auth-step";

export function RequestCodeForm({
  onBack,
  onSent,
  onBusyChange,
}: {
  onBack: () => void;
  onSent: (email: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const form = useForm<z.infer<typeof sendCodeSchema>>({
    resolver: zodResolver(sendCodeSchema),
    defaultValues: { email: "", purpose: "forget-password" },
  });
  const action = useAction(sendCode, {
    onSuccess({ data, input }) {
      if (data?.ok) onSent(input.email.trim().toLowerCase());
    },
  });
  const busy = action.isPending;
  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);
  const error =
    action.result.serverError ||
    (action.result.data?.ok === false ? action.result.data.message : undefined);
  return (
    <AuthStep
      icon="lock"
      eyebrow="Recuperação de acesso"
      title="Esqueceu sua senha?"
      description="Acontece. Informe seu e-mail e enviaremos um código para criar uma nova senha."
      onBack={onBack}
      busy={busy}
    >
      <form
        noValidate
        aria-busy={busy}
        onSubmit={form.handleSubmit(action.execute)}
      >
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor="recovery-email"
                  className="text-xs font-medium"
                >
                  E-mail corporativo *
                </FieldLabel>
                <AuthInput
                  {...field}
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  disabled={busy}
                  required
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Button className={authSubmitClass} type="submit" disabled={busy}>
            {busy ? "Solicitando código…" : "Enviar instruções"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </FieldGroup>
        <AuthFeedback
          error={
            error ||
            (action.result.validationErrors
              ? "Confira o e-mail informado."
              : undefined)
          }
        />
      </form>
    </AuthStep>
  );
}
