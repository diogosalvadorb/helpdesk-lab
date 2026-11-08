"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { register } from "@/actions/auth/register";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { registerSchema } from "@/lib/validations/register";

import { AuthInfo } from "./auth-info";
import { AuthInput as Input } from "./auth-input";
import PasswordInput from "./password-input";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterForm({
  onBusyChange,
  onRegistered,
}: {
  onBusyChange: (busy: boolean) => void;
  onRegistered: (result: {
    email: string;
    sent: boolean;
    message: string;
  }) => void;
}) {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      password: "",
      acceptTerms: false,
    },
  });

  const {
    execute,
    status,
    result,
    isPending: busy,
  } = useAction(register, {
    onSuccess: (result) => {
      if (result.data) onRegistered(result.data);
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError);
      }
    },
  });

  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);

  return (
    <div className="auth-box">
      <div className="text-auth-muted text-[0.625rem] font-semibold tracking-[0.10625rem] uppercase">
        Vamos começar
      </div>
      <h1 className="font-auth-display mt-2 mb-3 text-4xl leading-[1.15] tracking-[-0.0625rem] max-[50.0625rem]:text-[2rem]">
        Seu time, conectado.
      </h1>
      <p className="text-auth-muted mb-7 text-[0.8125rem] leading-[1.65]">
        Crie sua conta para solicitar e acompanhar o suporte da sua empresa.
      </p>
      <form
        noValidate
        aria-busy={busy}
        onSubmit={form.handleSubmit((values) => execute(values))}
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-xs font-medium"
                  htmlFor="register-name"
                >
                  Nome completo *
                </FieldLabel>
                <Input
                  {...field}
                  id="register-name"
                  autoComplete="name"
                  placeholder="Como devemos chamar você?"
                  disabled={busy}
                  required
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError className="text-xs" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-xs font-medium"
                  htmlFor="register-email"
                >
                  E-mail corporativo *
                </FieldLabel>
                <Input
                  {...field}
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  disabled={busy}
                  required
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError className="text-xs" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="company"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-xs font-medium"
                  htmlFor="register-company"
                >
                  Empresa *
                </FieldLabel>
                <Input
                  {...field}
                  id="register-company"
                  autoComplete="organization"
                  placeholder="Nome da empresa"
                  disabled={busy}
                  aria-describedby="company-hint"
                  required
                  aria-invalid={fieldState.invalid}
                />
                <p
                  id="company-hint"
                  className="text-auth-muted text-[0.6875rem] leading-[1.6]"
                >
                  Use o nome da empresa vinculada ao seu contrato.
                </p>
                {fieldState.invalid && (
                  <FieldError className="text-xs" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-xs font-medium"
                  htmlFor="register-password"
                >
                  Criar senha *
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id="register-password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={busy}
                  aria-describedby="password-hint"
                  required
                  aria-invalid={fieldState.invalid}
                />
                <p
                  id="password-hint"
                  className="text-auth-muted text-[0.6875rem] leading-[1.6]"
                >
                  Use ao menos 8 caracteres. Combine letras, números e símbolos.
                </p>
                {fieldState.invalid && (
                  <FieldError className="text-xs" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="acceptTerms"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-start gap-2 text-[0.6875rem] leading-[1.6]">
                  <Checkbox
                    className="auth-checkbox mt-0.75"
                    id="accept-terms"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    disabled={busy}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.invalid ? "terms-error" : undefined
                    }
                  />
                  <div>
                    <label htmlFor="accept-terms">Li e aceito os </label>
                    <AuthInfo topic="terms">Termos de uso</AuthInfo> e a{" "}
                    <AuthInfo topic="privacy">Política de privacidade</AuthInfo>
                    .
                  </div>
                </div>
                {fieldState.invalid && (
                  <FieldError
                    id="terms-error"
                    className="text-xs"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
          <Button
            className="bg-auth-primary text-auth-card hover:bg-auth-primary/90 h-10.5 w-full rounded-md text-xs font-medium"
            type="submit"
            disabled={busy}
          >
            {status === "executing" ? "Criando conta..." : "Criar minha conta"}
            <ArrowRight
              className="size-4.25"
              strokeWidth={1}
              aria-hidden="true"
            />
          </Button>
        </FieldGroup>
        {(result.serverError || result.validationErrors?._errors?.[0]) && (
          <p role="alert" className="text-auth-destructive mt-4 text-xs">
            {result.serverError ?? result.validationErrors?._errors?.[0]}
          </p>
        )}
      </form>
      <p className="text-auth-bottom text-0.6875rem] mt-2.5 text-center leading-[1.8]">
        O acesso à empresa será validado pelo administrador.
      </p>
    </div>
  );
}
