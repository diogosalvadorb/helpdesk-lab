"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { login } from "@/actions/auth/login";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginSchema } from "@/lib/validations/login";

import { AuthInput as Input } from "./auth-input";
import PasswordInput from "./password-input";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm({
  onBusyChange,
  onRecover,
  onNeedsVerification,
  notice,
}: {
  onBusyChange: (busy: boolean) => void;
  onRecover: () => void;
  onNeedsVerification: (email: string) => void;
  notice?: string;
}) {
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const {
    execute,
    status,
    result,
    isPending: busy,
  } = useAction(login, {
    onSuccess: (result) => {
      if (result.data?.needsVerification) {
        form.resetField("password");
        onNeedsVerification(result.data.email);
        return;
      }
      if (result?.data?.message) {
        toast.success(result.data.message);
      }

      router.replace("/");
      router.refresh();
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
        Bem-vindo de volta
      </div>
      <h1 className="font-auth-display mt-2 mb-3 text-4xl leading-[1.15] tracking-[-0.0625rem] max-[50.0625rem]:text-[2rem]">
        Seu suporte começa aqui.
      </h1>
      <p className="text-auth-muted mb-7 text-[0.8125rem] leading-[1.65]">
        Entre para acompanhar seus chamados e falar com nossa equipe.
      </p>
      <form
        noValidate
        aria-busy={busy}
        onSubmit={form.handleSubmit((values) => execute(values))}
      >
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-xs font-medium"
                  htmlFor="login-email"
                >
                  E-mail corporativo *
                </FieldLabel>
                <Input
                  {...field}
                  id="login-email"
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
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-xs font-medium"
                  htmlFor="login-password"
                >
                  Senha *
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id="login-password"
                  autoComplete="current-password"
                  placeholder="••••••••"
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
          <div className="auth-links">
            <Controller
              name="rememberMe"
              control={form.control}
              render={({ field }) => (
                <Label
                  className="flex items-center gap-1.75 text-[0.6875rem] leading-[normal] font-normal"
                  htmlFor="remember-me"
                >
                  <Checkbox
                    className="auth-checkbox"
                    id="remember-me"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    disabled={busy}
                  />
                  Manter conectado
                </Label>
              )}
            />
            <Button
              type="button"
              variant="link"
              className="auth-text-link"
              disabled={busy}
              onClick={onRecover}
            >
              Esqueci minha senha
            </Button>
          </div>
          <Button
            className="bg-auth-primary text-auth-card hover:bg-auth-primary/90 h-10.5 w-full rounded-md text-xs font-medium"
            type="submit"
            disabled={busy}
          >
            {status === "executing" ? "Entrando..." : "Entrar na minha conta"}
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
      {notice && (
        <p
          role="status"
          className="text-auth-primary mt-4 text-xs leading-relaxed"
        >
          {notice}
        </p>
      )}
      <Separator className="bg-auth-border my-5" />
      <p className="text-auth-muted text-center text-[0.6875rem] leading-[1.65]">
        Faz parte da equipe de TI?{" "}
        <Link className="text-auth-primary hover:underline" href="/">
          Acessar central de operações →
        </Link>
      </p>
    </div>
  );
}
