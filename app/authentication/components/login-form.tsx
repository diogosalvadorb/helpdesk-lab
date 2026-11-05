"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/actions/auth/login";
import { loginSchema } from "@/lib/validations/login";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm({
  onSwitchToRegister,
}: {
  onSwitchToRegister: () => void;
}) {
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { execute, status, result } = useAction(login, {
    onSuccess: (result) => {
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

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-muted-foreground text-sm">
          Acesse sua conta para continuar.
        </p>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => execute(values))}
      >
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">
                  E-mail corporativo
                </FieldLabel>
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                <Input
                  {...field}
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Button type="submit" disabled={status === "executing"}>
            {status === "executing" ? "Entrando..." : "Entrar"}
          </Button>
        </FieldGroup>
        {(result.serverError || result.validationErrors?._errors?.[0]) && (
          <p role="alert" className="text-destructive text-sm">
            {result.serverError ?? result.validationErrors?._errors?.[0]}
          </p>
        )}
      </form>
      <Button
        type="button"
        variant="link"
        disabled={status === "executing"}
        onClick={onSwitchToRegister}
      >
        Ainda não tem uma conta? Criar conta
      </Button>
    </div>
  );
}
