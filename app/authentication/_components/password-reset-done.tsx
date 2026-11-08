"use client";

import { Button } from "@/components/ui/button";

import { AuthStep, authSubmitClass } from "./auth-step";

export function PasswordResetDone({ onLogin }: { onLogin: () => void }) {
  return (
    <AuthStep
      icon="check"
      eyebrow="Tudo certo"
      title="Senha alterada."
      description="Seu acesso foi renovado. Entre com sua nova senha para continuar."
      onBack={onLogin}
    >
      <div className="bg-auth-check border-auth-mini-border mb-6 rounded-lg border p-4.5 text-xs leading-relaxed">
        Por segurança, suas sessões anteriores foram encerradas.
      </div>
      <Button type="button" className={authSubmitClass} onClick={onLogin}>
        Entrar na minha conta
      </Button>
    </AuthStep>
  );
}
