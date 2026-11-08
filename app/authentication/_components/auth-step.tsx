"use client";

import { ArrowLeft, Check, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

const icons = {
  mail: Mail,
  lock: LockKeyhole,
  shield: ShieldCheck,
  check: Check,
};
export const authSubmitClass =
  "bg-auth-primary text-auth-card hover:bg-auth-primary/90 h-10.5 w-full rounded-md text-xs font-medium";

export function AuthStep({
  icon,
  eyebrow,
  title,
  description,
  children,
  onBack,
  busy = false,
}: {
  icon: keyof typeof icons;
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  onBack: () => void;
  busy?: boolean;
}) {
  const Icon = icons[icon];
  return (
    <div className="auth-box">
      <span className="bg-auth-check text-auth-primary border-auth-mini-border mb-6 grid size-13.5 place-items-center rounded-2xl border">
        <Icon className="size-5" strokeWidth={1} aria-hidden="true" />
      </span>
      <div className="text-auth-muted text-[0.625rem] font-semibold tracking-[0.10625rem] uppercase">
        {eyebrow}
      </div>
      <h1 className="font-auth-display mt-2 mb-3 text-4xl leading-[1.15] tracking-[-0.0625rem] max-[50.0625rem]:text-[2rem]">
        {title}
      </h1>
      <div className="text-auth-muted mb-7 text-[0.8125rem] leading-[1.8]">
        {description}
      </div>
      {children}
      <div className="mt-6 text-center text-xs">
        <Button
          type="button"
          variant="link"
          className="auth-text-link"
          onClick={onBack}
          disabled={busy}
        >
          <ArrowLeft className="mr-1 inline size-3.5" aria-hidden="true" />{" "}
          Voltar ao login
        </Button>
      </div>
    </div>
  );
}

export function AuthFeedback({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-4 text-xs leading-relaxed ${error ? "text-auth-destructive" : "text-auth-muted"}`}
    >
      {error || message}
    </p>
  );
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}•••@${domain}`;
}
