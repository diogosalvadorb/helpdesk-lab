"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { resetPassword } from "@/actions/auth/otp";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { resetPasswordSchema } from "@/lib/validations/otp";

import { AuthFeedback, AuthStep, authSubmitClass } from "./auth-step";
import PasswordInput from "./password-input";

export function ResetPasswordForm({
  email,
  otp,
  onBack,
  onNewCode,
  onSuccess,
  onBusyChange,
}: {
  email: string;
  otp: string;
  onBack: () => void;
  onNewCode: () => void;
  onSuccess: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      purpose: "forget-password",
      otp,
      password: "",
      confirmPassword: "",
    },
  });
  const action = useAction(resetPassword, {
    onSuccess({ data }) {
      if (data?.ok) {
        form.reset();
        onSuccess();
      }
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
      icon="shield"
      eyebrow="Uma nova senha"
      title="Vamos renovar seu acesso."
      description="Escolha sua nova senha e mantenha sua conta protegida."
      onBack={onBack}
      busy={busy}
    >
      <form
        noValidate
        aria-busy={busy}
        onSubmit={form.handleSubmit(action.execute)}
      >
        <FieldGroup>
          {(
            [
              ["password", "Nova senha *"],
              ["confirmPassword", "Confirmar nova senha *"],
            ] as const
          ).map(([name, label]) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`reset-${name}`}
                    className="text-xs font-medium"
                  >
                    {label}
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id={`reset-${name}`}
                    autoComplete="new-password"
                    placeholder={
                      name === "password"
                        ? "Crie sua nova senha"
                        : "Repita sua nova senha"
                    }
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
          ))}
          <p className="text-auth-muted text-xs">
            Use de 8 a 128 caracteres. Combine letras, números e símbolos.
          </p>
          <Button type="submit" className={authSubmitClass} disabled={busy}>
            {busy ? "Salvando senha…" : "Salvar nova senha"}
          </Button>
        </FieldGroup>
        <AuthFeedback
          error={
            error ||
            (action.result.validationErrors
              ? "Confira os dados da nova senha."
              : undefined)
          }
        />
      </form>
      <div className="mt-5 text-center text-xs">
        <Button
          className="auth-text-link"
          variant="link"
          type="button"
          disabled={busy}
          onClick={onNewCode}
        >
          Código expirou? Solicitar outro
        </Button>
      </div>
    </AuthStep>
  );
}
