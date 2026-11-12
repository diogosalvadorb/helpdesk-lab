"use client";
import { useState, useTransition } from "react";

import { updatePreferences, updateProfile } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { getAccountSettings } from "@/data/settings";
import {
  passwordChangeSchema,
  profileSchema,
} from "@/lib/validations/settings";
export function AccountSettings({
  account,
}: {
  account: Awaited<ReturnType<typeof getAccountSettings>>;
}) {
  const [pending, startTransition] = useTransition(),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const result = (
    r:
      | { data?: { ok: boolean; message?: string }; serverError?: string }
      | undefined,
    success: string,
  ) => {
    if (r?.data?.ok) {
      setError("");
      setMessage(success);
    } else {
      setMessage("");
      setError(
        r?.data?.message || r?.serverError || "Revise os dados informados.",
      );
    }
  };
  return (
    <div className="portal-settings-layout">
      <nav aria-label="Seções das configurações">
        <a href="#perfil">Perfil e conta</a>
        <a href="#preferencias">Notificações</a>
        <a href="#seguranca">Segurança</a>
      </nav>
      <div className="portal-stack">
        {message && (
          <p role="status" className="portal-report-note">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="portal-form-error">
            {error}
          </p>
        )}
        <Card className="portal-panel" id="perfil">
          <h2>Informações do perfil</h2>
          <form
            className="portal-settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = profileSchema.safeParse(
                Object.fromEntries(new FormData(e.currentTarget)),
              );
              if (!data.success) {
                setError(data.error.issues[0].message);
                return;
              }
              startTransition(async () =>
                result(await updateProfile(data.data), "Perfil atualizado."),
              );
            }}
          >
            <div className="portal-field">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input
                id="profile-name"
                name="name"
                defaultValue={account.name}
                minLength={2}
                maxLength={160}
                required
                className="portal-form-input"
                disabled={pending}
              />
            </div>
            <div className="portal-field">
              <Label htmlFor="profile-email">E-mail confirmado</Label>
              <Input
                id="profile-email"
                value={account.email}
                readOnly
                className="portal-form-input"
              />
            </div>
            <p className="portal-muted">
              O e-mail permanece protegido pelo fluxo de verificação. Sua
              alteração ainda não está disponível nesta tela. Papéis e vínculos
              são geridos pela administração.
            </p>
            <Button
              type="submit"
              disabled={pending}
              className="portal-primary-button"
            >
              Salvar perfil
            </Button>
          </form>
        </Card>
        <Card className="portal-panel" id="preferencias">
          <h2>Notificações</h2>
          <form
            className="portal-settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              startTransition(async () =>
                result(
                  await updatePreferences({
                    emailEnabled: f.get("emailEnabled") === "on",
                    ticketUpdates: f.get("ticketUpdates") === "on",
                    slaAlerts: f.get("slaAlerts") === "on",
                  }),
                  "Preferências salvas.",
                ),
              );
            }}
          >
            {[
              [
                "emailEnabled",
                "E-mails de atualização",
                "Permitir e-mails opcionais sobre chamados.",
              ],
              [
                "ticketUpdates",
                "Atualizações de chamados",
                "Receber avisos opcionais no portal e, se habilitado, por e-mail.",
              ],
              [
                "slaAlerts",
                "Alertas de SLA no portal",
                "Receber avisos produzidos pela rotina de avaliação de prazos.",
              ],
            ].map(([key, label, note]) => (
              <div className="portal-settings-toggle" key={key}>
                <div>
                  <Label htmlFor={`pref-${key}`}>{label}</Label>
                  <p className="portal-muted">{note}</p>
                </div>
                <Checkbox
                  id={`pref-${key}`}
                  name={key}
                  defaultChecked={
                    account.preferences?.[
                      key as "emailEnabled" | "ticketUpdates" | "slaAlerts"
                    ] !== false
                  }
                  disabled={pending}
                />
              </div>
            ))}
            <p className="portal-muted">
              Códigos de autenticação, recuperação de senha e aprovações de
              acesso são mensagens essenciais e não são desativados por estas
              preferências. Não há resumo semanal automático configurado.
            </p>
            <Button
              type="submit"
              disabled={pending}
              className="portal-primary-button"
            >
              Salvar preferências
            </Button>
          </form>
        </Card>
        <Card className="portal-panel" id="seguranca">
          <h2>Senha e segurança</h2>
          <form
            className="portal-settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget,
                data = passwordChangeSchema.safeParse(
                  Object.fromEntries(new FormData(form)),
                );
              if (!data.success) {
                setError(data.error.issues[0].message);
                return;
              }
              startTransition(async () => {
                let r;
                try {
                  const response = await fetch("/api/account/password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data.data),
                  });
                  r = {
                    data: (await response.json()) as {
                      ok: boolean;
                      message?: string;
                    },
                  };
                } catch {
                  r = {
                    data: {
                      ok: false,
                      message:
                        "Não foi possível alterar sua senha. Tente novamente.",
                    },
                  };
                }
                result(r, "Senha alterada. As outras sessões foram revogadas.");
                if (r?.data?.ok) form.reset();
              });
            }}
          >
            {[
              ["currentPassword", "Senha atual"],
              ["newPassword", "Nova senha"],
              ["confirmPassword", "Confirmar nova senha"],
            ].map(([name, label]) => (
              <div className="portal-field" key={name}>
                <Label htmlFor={`password-${name}`}>{label}</Label>
                <Input
                  id={`password-${name}`}
                  type="password"
                  name={name}
                  required
                  minLength={name === "currentPassword" ? 1 : 8}
                  maxLength={128}
                  autoComplete={
                    name === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                  disabled={pending}
                  className="portal-form-input"
                />
              </div>
            ))}
            <Button
              type="submit"
              disabled={pending}
              className="portal-primary-button"
            >
              Alterar senha
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
