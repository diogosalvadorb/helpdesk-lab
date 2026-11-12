"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateWorkspace } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { getWorkspaceSettings } from "@/data/settings";
import { portalConfigurationSchema } from "@/lib/validations/settings";
export function WorkspaceSettings({
  data,
}: {
  data: Awaited<ReturnType<typeof getWorkspaceSettings>>;
}) {
  const [pending, startTransition] = useTransition(),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    router = useRouter(),
    c = data.configuration;
  return (
    <Card className="portal-panel">
      <form
        className="portal-settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            input = portalConfigurationSchema.safeParse({
              version: c?.updatedAt.toISOString(),
              organizationName: String(f.get("organizationName") ?? "").trim(),
              supportEmail: String(f.get("supportEmail") ?? "").trim(),
              supportPhone: String(f.get("supportPhone") ?? "").trim(),
              responsibleEmail: String(f.get("responsibleEmail") ?? "").trim(),
              calendarId: String(f.get("calendarId") ?? ""),
              privacyText: String(f.get("privacyText") ?? ""),
              termsText: String(f.get("termsText") ?? ""),
              privacyApproved: f.get("privacyApproved") === "on",
              termsApproved: f.get("termsApproved") === "on",
            });
          if (!input.success) {
            setError(input.error.issues[0].message);
            return;
          }
          startTransition(async () => {
            const r = await updateWorkspace(input.data);
            if (r?.data?.ok) {
              setMessage("Configuração salva e auditada.");
              setError("");
              router.refresh();
            } else
              setError(
                r?.data?.message ||
                  r?.serverError ||
                  "Revise os dados e suas permissões.",
              );
          });
        }}
      >
        <h2>Canais e organização</h2>
        {[
          ["organizationName", "Organização responsável", "text"],
          ["supportEmail", "E-mail de suporte", "email"],
          ["supportPhone", "Telefone de suporte", "tel"],
          ["responsibleEmail", "Contato responsável pelos documentos", "email"],
        ].map(([name, label, type]) => (
          <div className="portal-field" key={name}>
            <Label htmlFor={`workspace-${name}`}>{label}</Label>
            <Input
              id={`workspace-${name}`}
              name={name}
              type={type}
              defaultValue={String(
                c?.[
                  name as
                    | "organizationName"
                    | "supportEmail"
                    | "supportPhone"
                    | "responsibleEmail"
                ] ?? "",
              )}
              maxLength={name === "supportPhone" ? 25 : 160}
              disabled={pending}
              className="portal-form-input"
            />
          </div>
        ))}
        <div className="portal-field">
          <Label htmlFor="workspace-calendar">Horário geral de suporte</Label>
          <select
            id="workspace-calendar"
            name="calendarId"
            className="portal-form-input"
            defaultValue={c?.calendarId ?? ""}
            disabled={pending}
          >
            <option value="">Não configurado</option>
            {data.calendars.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <p className="portal-muted">
          Campos de contato vazios permanecem indisponíveis nos canais. O
          calendário geral não altera os contratos ou os prazos de chamados
          existentes.
        </p>
        <h2>Documentos institucionais</h2>
        {[
          ["privacyText", "privacyApproved", "Privacidade"],
          ["termsText", "termsApproved", "Termos de uso"],
        ].map(([text, approved, label]) => (
          <section className="portal-settings-form" key={text}>
            <Label htmlFor={`workspace-${text}`}>{label} — texto simples</Label>
            <Textarea
              id={`workspace-${text}`}
              name={text}
              className="portal-form-input portal-legal-editor"
              defaultValue={String(
                c?.[text as "privacyText" | "termsText"] ?? "",
              )}
              maxLength={20000}
              disabled={pending}
            />
            <Label htmlFor={`workspace-${approved}`}>
              <Checkbox
                id={`workspace-${approved}`}
                name={approved}
                defaultChecked={Boolean(
                  c?.[approved as "privacyApproved" | "termsApproved"],
                )}
                disabled={pending}
              />{" "}
              Texto revisado e aprovado para publicação pela organização
            </Label>
          </section>
        ))}
        <p className="portal-report-note">
          A publicação exige conteúdo revisado, organização responsável e
          contato válido. O sistema não atesta conformidade legal; os documentos
          permanecem pendentes até sua aprovação.
        </p>
        {error && (
          <p role="alert" className="portal-form-error">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <Button
          type="submit"
          className="portal-primary-button"
          disabled={pending}
        >
          {pending ? "Salvando…" : "Salvar configurações"}
        </Button>
      </form>
    </Card>
  );
}
