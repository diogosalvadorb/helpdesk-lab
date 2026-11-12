"use client";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { OtpPurpose } from "@/lib/validations/otp";

import { AuthInfo } from "./auth-info";
import LoginForm from "./login-form";
import { OtpForm } from "./otp-form";
import { PasswordResetDone } from "./password-reset-done";
import RegisterForm from "./register-form";
import { RequestCodeForm } from "./request-code-form";
import { ResetPasswordForm } from "./reset-password-form";

type AuthFlow =
  | { view: "login"; message?: string }
  | { view: "register" | "recover" | "done" }
  | {
      view: "code";
      email: string;
      purpose: OtpPurpose;
      notice?: string;
      error?: string;
      retryAt: number;
    }
  | { view: "reset"; email: string; otp: string };

export default function AuthenticationScreen({
  initialView = "login",
  initialNotice,
}: {
  initialView?: "login" | "register" | "recover";
  initialNotice?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [flow, setFlow] = useState<AuthFlow>(
    initialView === "login"
      ? { view: "login", message: initialNotice }
      : { view: initialView },
  );
  const view = flow.view;
  const contentRef = useRef<HTMLDivElement>(null);
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    const heading = contentRef.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  }, [view]);
  const backToLogin = () => setFlow({ view: "login" });

  return (
    <main className="auth-screen bg-auth-background font-auth text-auth-foreground [&_button:focus-visible]:outline-auth-primary grid min-h-[max(60rem,100svh)] grid-cols-[.95fr_1.05fr] text-sm [--border:var(--auth-border)] [--destructive:var(--auth-destructive)] [--foreground:var(--auth-foreground)] [--input:var(--auth-border)] [--muted-foreground:var(--auth-muted)] [--primary-foreground:var(--auth-card)] [--primary:var(--auth-primary)] [--ring:var(--auth-primary)] max-[50.0625rem]:block [&_button]:cursor-pointer [&_button:disabled]:cursor-wait [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4">
      <section
        className="border-auth-story-border bg-auth-story after:border-auth-orbit after:shadow-auth-orbit relative hidden flex-col overflow-hidden border-r px-14.5 py-11.5 after:pointer-events-none after:absolute after:top-62.5 after:-right-42.5 after:size-125 after:rounded-full after:border after:content-[''] min-[50.0625rem]:flex"
        aria-label="Sobre o helpdesk"
      >
        <div className="[&_b]:text-auth-primary text-[1.6875rem] font-[650] tracking-[-0.075rem]">
          helpdesk<b>.</b>
        </div>
        <div className="relative z-1 my-auto py-12.5">
          <div className="text-auth-muted text-[0.625rem] font-semibold tracking-[0.10625rem] uppercase">
            Suporte que acompanha você
          </div>
          <h2 className="font-auth-display mt-4 mb-5.5 text-[3.625rem] leading-[1.12] tracking-[-0.0625rem]">
            Mais perto.
            <br />
            Mais simples.
            <br />
            Resolvido.
          </h2>
          <p className="text-auth-muted max-w-95 text-sm leading-[1.9]">
            Um só lugar para conectar sua empresa à equipe que cuida da sua
            tecnologia.
          </p>
          <div className="border-auth-mini-border bg-auth-card/64 shadow-auth-mini mt-10 max-w-105 rounded-[0.625rem] border p-5">
            <div className="flex items-center gap-3">
              <span className="bg-auth-check text-auth-check-foreground grid size-8.5 shrink-0 place-items-center rounded-full">
                <Check
                  className="size-4.5"
                  strokeWidth={1}
                  aria-hidden="true"
                />
              </span>
              <div>
                <b className="text-[0.8125rem] font-bold">
                  Cada chamado, no caminho certo.
                </b>
                <p className="text-auth-muted text-[0.6875rem] leading-[1.9]">
                  Do primeiro contato à solução.
                </p>
              </div>
            </div>
            <div
              className="bg-auth-track [&_span]:bg-auth-progress mt-4.5 h-1.5 overflow-hidden rounded-md [&_span]:block [&_span]:h-full [&_span]:w-[84%] [&_span]:rounded-[inherit]"
              aria-hidden="true"
            >
              <span />
            </div>
            <div className="text-auth-subtle mt-3 flex justify-between gap-2 text-[0.625rem]">
              <span>N1 · Triagem</span>
              <span>N2 · Especialistas</span>
              <span>N3 · Engenharia</span>
            </div>
          </div>
        </div>
        <footer className="text-auth-footer relative z-1 flex justify-between gap-4 text-[0.6875rem]">
          <span>© 2026 Nexo Tecnologia</span>
          <span>Feito para cuidar.</span>
        </footer>
      </section>
      <section
        className="flex min-w-0 flex-col px-16.25 py-10.5 max-[50.0625rem]:min-h-svh max-[50.0625rem]:p-7"
        aria-label="Acesso à conta"
      >
        <div className="[&_b]:text-auth-primary mb-6.25 text-[1.5625rem] leading-[normal] font-[650] tracking-[-0.075rem] min-[50.0625rem]:hidden">
          helpdesk<b>.</b>
        </div>
        <div className="text-auth-top [&_button]:text-auth-primary text-right text-xs max-[50.0625rem]:text-[0.6875rem] [&_button]:font-bold">
          {view === "login"
            ? "Ainda não tem acesso? "
            : "Já possui uma conta? "}
          <Button
            variant="link"
            className="auth-text-link"
            disabled={busy}
            type="button"
            onClick={() =>
              setFlow({ view: view === "login" ? "register" : "login" })
            }
          >
            {view === "login" ? "Criar conta →" : "Entrar →"}
          </Button>
        </div>
        <div ref={contentRef} className="flex flex-1 flex-col">
          {flow.view === "login" && (
            <LoginForm
              onBusyChange={setBusy}
              notice={flow.message}
              onRecover={() => setFlow({ view: "recover" })}
              onNeedsVerification={(email) =>
                setFlow({
                  view: "code",
                  email,
                  purpose: "email-verification",
                  retryAt: 0,
                  notice:
                    "Confirme seu e-mail para entrar. Solicite um código pelo botão Reenviar código.",
                })
              }
            />
          )}
          {flow.view === "register" && (
            <RegisterForm
              onBusyChange={setBusy}
              onRegistered={({ email, sent, message }) =>
                setFlow({
                  view: "code",
                  email,
                  purpose: "email-verification",
                  error: sent ? undefined : message,
                  retryAt: Date.now() + 60000,
                })
              }
            />
          )}
          {flow.view === "recover" && (
            <RequestCodeForm
              onBusyChange={setBusy}
              onBack={backToLogin}
              onSent={(email) =>
                setFlow({
                  view: "code",
                  email,
                  purpose: "forget-password",
                  retryAt: Date.now() + 60000,
                })
              }
            />
          )}
          {flow.view === "code" && (
            <OtpForm
              key={`${flow.email}:${flow.purpose}`}
              email={flow.email}
              purpose={flow.purpose}
              initialNotice={flow.notice}
              initialError={flow.error}
              retryAt={flow.retryAt}
              onBusyChange={setBusy}
              onBack={backToLogin}
              onChangeEmail={() =>
                setFlow({
                  view:
                    flow.purpose === "forget-password" ? "recover" : "register",
                })
              }
              onConfirmed={(otp) =>
                setFlow(
                  flow.purpose === "email-verification"
                    ? {
                        view: "login",
                        message:
                          "E-mail confirmado. Entre com sua senha para continuar.",
                      }
                    : { view: "reset", email: flow.email, otp },
                )
              }
            />
          )}
          {flow.view === "reset" && (
            <ResetPasswordForm
              email={flow.email}
              otp={flow.otp}
              onBusyChange={setBusy}
              onBack={backToLogin}
              onNewCode={() =>
                setFlow({
                  view: "code",
                  email: flow.email,
                  purpose: "forget-password",
                  retryAt: 0,
                })
              }
              onSuccess={() => setFlow({ view: "done" })}
            />
          )}
          {flow.view === "done" && <PasswordResetDone onLogin={backToLogin} />}
        </div>
        <footer className="text-auth-bottom flex flex-wrap items-center justify-center gap-2 text-center text-[0.625rem] max-[50.0625rem]:mt-auto">
          <span>Ambiente seguro</span>
          <span aria-hidden="true">·</span>
          <AuthInfo topic="privacy">Privacidade</AuthInfo>
          <span aria-hidden="true">·</span>
          <AuthInfo topic="help">Precisa de ajuda?</AuthInfo>
        </footer>
      </section>
    </main>
  );
}
