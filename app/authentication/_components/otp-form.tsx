"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { sendCode, verifyCode } from "@/actions/auth/otp";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { type OtpPurpose, verifyCodeSchema } from "@/lib/validations/otp";

import { AuthInput } from "./auth-input";
import {
  AuthFeedback,
  AuthStep,
  authSubmitClass,
  maskEmail,
} from "./auth-step";

export function OtpForm({
  email,
  purpose,
  initialNotice,
  initialError,
  retryAt = 0,
  onBack,
  onChangeEmail,
  onConfirmed,
  onBusyChange,
}: {
  email: string;
  purpose: OtpPurpose;
  initialNotice?: string;
  initialError?: string;
  retryAt?: number;
  onBack: () => void;
  onChangeEmail: () => void;
  onConfirmed: (otp: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [deadline, setDeadline] = useState(retryAt);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState(initialNotice);
  const [deliveryError, setDeliveryError] = useState(initialError);
  const form = useForm<z.infer<typeof verifyCodeSchema>>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { email, purpose, otp: "" },
  });
  const verification = useAction(verifyCode, {
    onSuccess({ data, input }) {
      if (data?.ok) onConfirmed(input.otp);
    },
  });
  const resend = useAction(sendCode, {
    onSuccess({ data }) {
      if (data?.ok) {
        setDeadline(Date.now() + data.retryAfter * 1000);
        setNow(Date.now());
        setNotice(data.message);
        setDeliveryError(undefined);
        form.resetField("otp");
        verification.reset();
      }
    },
  });
  const busy = verification.isPending || resend.isPending;
  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const verificationError =
    verification.result.serverError ||
    (verification.result.data?.ok === false
      ? verification.result.data.message
      : undefined);
  const resendError =
    resend.result.serverError ||
    (resend.result.data?.ok === false ? resend.result.data.message : undefined);
  const registration = purpose === "email-verification";
  return (
    <AuthStep
      icon="mail"
      eyebrow={registration ? "Falta só um passo" : "Próximo passo"}
      title={registration ? "Confirme seu cadastro." : "Instruções enviadas."}
      description={
        <>
          <p>
            {registration
              ? "Confirme seu endereço para concluir a solicitação de acesso."
              : "Se houver uma conta para este e-mail, você receberá um código para redefinir sua senha."}
          </p>
          <p className="text-auth-input-foreground mt-2 font-medium break-all">
            {maskEmail(email)}
          </p>
        </>
      }
      onBack={onBack}
      busy={busy}
    >
      <div className="bg-auth-check border-auth-mini-border mb-6 rounded-lg border p-4.5 text-xs leading-[1.8]">
        O código é válido por <b>5 minutos</b>.<br />
        Não encontrou? Verifique a caixa de spam.
        {registration && (
          <p className="mt-2">
            A confirmação do e-mail não substitui a aprovação de acesso pela sua
            empresa.
          </p>
        )}
      </div>
      <form
        noValidate
        aria-busy={busy}
        onSubmit={form.handleSubmit(verification.execute)}
      >
        <FieldGroup>
          <Controller
            name="otp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor="verification-code"
                  className="text-xs font-medium"
                >
                  Código de verificação *
                </FieldLabel>
                <AuthInput
                  {...field}
                  id="verification-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  className="auth-otp-input"
                  onChange={(event) =>
                    field.onChange(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  disabled={busy}
                  required
                  aria-invalid={fieldState.invalid}
                  aria-describedby="code-hint"
                />
                <p id="code-hint" className="text-auth-muted text-xs">
                  Digite ou cole os seis dígitos recebidos por e-mail.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Button className={authSubmitClass} type="submit" disabled={busy}>
            {verification.isPending
              ? "Conferindo código…"
              : registration
                ? "Confirmar cadastro"
                : "Continuar"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </FieldGroup>
        <AuthFeedback
          error={
            verificationError ||
            resendError ||
            deliveryError ||
            (verification.result.validationErrors
              ? "Confira o código informado."
              : undefined)
          }
          message={notice}
        />
      </form>
      <div className="text-auth-muted mt-5 space-y-4 text-center text-xs">
        <p>
          Não recebeu?{" "}
          <Button
            type="button"
            variant="link"
            className="auth-text-link"
            disabled={busy || remaining > 0}
            onClick={() => resend.execute({ email, purpose })}
          >
            {resend.isPending
              ? "Solicitando…"
              : remaining
                ? `Reenviar em ${remaining}s`
                : "Reenviar código"}
          </Button>
        </p>
        <Button
          type="button"
          variant="link"
          className="auth-text-link"
          disabled={busy}
          onClick={onChangeEmail}
        >
          Usar outro e-mail
        </Button>
      </div>
    </AuthStep>
  );
}
