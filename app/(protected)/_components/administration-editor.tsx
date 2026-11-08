"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { updateAdministration } from "@/actions/administration";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminEntity, AdminOptions } from "@/data/administration";
import {
  type AdministrationInput,
  administrationSchema,
  priorities,
} from "@/lib/validations/administration";

export const administrativeLabels: Record<AdminEntity, string> = {
  company: "Empresa",
  department: "Departamento",
  member: "Vínculo",
  team: "Equipe",
  agent: "Agente",
  user: "Acesso global",
  contract: "Contrato",
  policy: "Política de SLA",
  calendar: "Calendário",
};
const labels: Record<string, string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  ARCHIVED: "Arquivado",
  PENDING: "Pendente",
  REJECTED: "Rejeitado",
  REQUESTER: "Solicitante",
  MANAGER: "Gestor",
  ADMIN: "Administrador",
  CLIENT: "Cliente",
  AGENT: "Agente",
  AVAILABLE: "Disponível",
  BUSY: "Ocupado",
  AWAY: "Ausente",
  OFFLINE: "Offline",
  DRAFT: "Rascunho",
  EXPIRED: "Expirado",
  CANCELED: "Cancelado",
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};
export const administrativeLabel = (value: string) => labels[value] || value;
type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "checkbox" | "textarea";
  options?: { id: string; name: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  readOnly?: boolean;
  maxLength?: number;
};
const choices = (values: string[]) =>
  values.map((id) => ({ id, name: administrativeLabel(id) }));
function fieldsFor(
  entity: AdminEntity,
  options: AdminOptions,
  editing: boolean,
  companyId: string,
): Field[] {
  const name: Field = {
    key: "name",
    label: "Nome",
    required: true,
    maxLength: 160,
  };
  const active: Field = { key: "active", label: "Ativo", type: "checkbox" };
  const company: Field = {
    key: "companyId",
    label: "Empresa",
    options: options.companies,
    required: true,
    readOnly: editing || options.companies.length === 1,
  };
  const email: Field = {
    key: "email",
    label: "E-mail do usuário cadastrado",
    type: "email",
    required: true,
    readOnly: editing,
    maxLength: 254,
  };
  const description: Field = {
    key: "description",
    label: "Descrição",
    type: "textarea",
    maxLength: 1000,
  };
  switch (entity) {
    case "company":
      return [
        name,
        { key: "legalName", label: "Razão social", maxLength: 180 },
        { key: "taxId", label: "CPF ou CNPJ (somente dígitos)", maxLength: 14 },
        { key: "contactName", label: "Contato", maxLength: 160 },
        {
          key: "contactEmail",
          label: "E-mail de contato",
          type: "email",
          maxLength: 254,
        },
        { key: "contactPhone", label: "Telefone", maxLength: 30 },
        {
          key: "status",
          label: "Estado",
          options: choices(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
          required: true,
        },
        {
          key: "internalNotes",
          label: "Notas internas (somente administração)",
          type: "textarea",
          maxLength: 5000,
        },
      ];
    case "department":
      return [company, name, description, active];
    case "member":
      return [
        company,
        email,
        {
          key: "departmentId",
          label: "Departamento",
          options: options.departments.filter((d) => d.companyId === companyId),
        },
        {
          key: "role",
          label: "Papel na empresa",
          options: choices(["REQUESTER", "MANAGER", "ADMIN"]),
          required: true,
        },
        {
          key: "status",
          label: "Estado do vínculo",
          options: choices(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"]),
          required: true,
        },
      ];
    case "team":
      return [name, description, active];
    case "agent":
      return [
        email,
        {
          key: "teamId",
          label: "Equipe",
          options: options.teams,
          required: true,
        },
        {
          key: "level",
          label: "Nível",
          options: choices(["N1", "N2", "N3"]),
          required: true,
        },
        {
          key: "availability",
          label: "Disponibilidade",
          options: choices(["AVAILABLE", "BUSY", "AWAY", "OFFLINE"]),
          required: true,
        },
        {
          key: "maxActiveTickets",
          label: "Capacidade de chamados ativos",
          type: "number",
          min: 1,
          max: 200,
          required: true,
        },
        active,
      ];
    case "user":
      return [
        email,
        {
          key: "role",
          label: "Papel global",
          options: choices(["CLIENT", "AGENT", "ADMIN"]),
          required: true,
        },
        active,
      ];
    case "contract":
      return [
        company,
        {
          key: "number",
          label: "Número do contrato",
          required: true,
          maxLength: 160,
        },
        name,
        {
          key: "slaPolicyId",
          label: "Política e versão",
          options: options.policies,
          required: true,
        },
        {
          key: "status",
          label: "Estado",
          options: choices(["DRAFT", "ACTIVE", "EXPIRED", "CANCELED"]),
          required: true,
        },
        {
          key: "startsAt",
          label: "Início da vigência",
          type: "date",
          required: true,
        },
        { key: "endsAt", label: "Fim da vigência (inclusive)", type: "date" },
        {
          key: "slaGoalPercent",
          label: "Meta de cumprimento (%)",
          type: "number",
          min: 0.01,
          max: 100,
          step: "0.01",
          required: true,
        },
      ];
    case "calendar":
      return [
        name,
        { key: "timeZone", label: "Fuso IANA", required: true, maxLength: 100 },
        {
          key: "alwaysOpen",
          label: "Atendimento 24 horas (ignora intervalos e feriados)",
          type: "checkbox",
        },
      ];
    case "policy":
      return [
        { ...name, readOnly: editing },
        {
          key: "calendarId",
          label: "Calendário",
          options: options.calendars,
          required: true,
        },
        active,
        {
          key: "pauseWhileWaitingCustomer",
          label: "Pausar SLA enquanto aguarda o cliente",
          type: "checkbox",
        },
      ];
  }
}
function defaults(
  entity: AdminEntity,
  companyId?: string,
): Record<string, string | number | boolean> {
  return {
    name: "",
    legalName: "",
    taxId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    internalNotes: "",
    description: "",
    email: "",
    companyId: companyId || "",
    departmentId: "",
    status:
      entity === "contract"
        ? "DRAFT"
        : entity === "member"
          ? "PENDING"
          : "ACTIVE",
    active: true,
    role: entity === "member" ? "REQUESTER" : "CLIENT",
    teamId: "",
    level: "N1",
    availability: "OFFLINE",
    maxActiveTickets: 10,
    number: "",
    slaPolicyId: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
    slaGoalPercent: 95,
    timeZone: "America/Sao_Paulo",
    alwaysOpen: false,
    calendarId: "",
    pauseWhileWaitingCustomer: true,
  };
}
export function AdministrationEditor({
  entity,
  options,
  initial,
  companyId,
  impact,
  label,
}: {
  entity: AdminEntity;
  options: AdminOptions;
  initial?: AdministrationInput;
  companyId?: string;
  impact?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={initial ? "outline" : "default"}
            className={
              initial ? "portal-outline-button" : "portal-primary-button"
            }
          />
        }
      >
        {!initial && <Plus aria-hidden="true" />}
        {label ||
          (initial
            ? entity === "policy"
              ? "Nova versão"
              : entity === "calendar"
                ? "Criar revisão"
                : "Editar"
            : `Adicionar ${administrativeLabels[entity].toLowerCase()}`)}
      </DialogTrigger>
      <DialogContent className="portal-dialog portal-admin-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? entity === "policy"
                ? "Nova versão da política"
                : entity === "calendar"
                  ? "Revisão do calendário"
                  : `Editar ${administrativeLabels[entity].toLowerCase()}`
              : `Adicionar ${administrativeLabels[entity].toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            {entity === "calendar"
              ? "Cada revisão cria um calendário independente. Selecione-o em uma nova versão da política para utilizá-lo."
              : entity === "policy"
                ? "Cada edição cria uma nova versão. Atualize os contratos desejados; chamados existentes mantêm suas metas e prazos."
                : entity === "agent" || entity === "user" || entity === "member"
                  ? "Use uma conta já cadastrada. Senhas e confirmação de e-mail seguem o fluxo de autenticação."
                  : "As alterações são validadas e registradas com seu usuário."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AdministrativeForm
            entity={entity}
            options={options}
            initial={initial}
            companyId={companyId}
            impact={impact}
            onSaved={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function AdministrativeForm({
  entity,
  options,
  initial,
  companyId,
  impact,
  onSaved,
}: {
  entity: AdminEntity;
  options: AdminOptions;
  initial?: AdministrationInput;
  companyId?: string;
  impact?: string;
  onSaved: () => void;
}) {
  const uid = useId(),
    router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const values: Record<string, unknown> = {
    ...defaults(entity, companyId),
    ...initial,
  };
  const fields = fieldsFor(
    entity,
    options,
    Boolean(initial),
    String(values.companyId || companyId || ""),
  );
  const [hours, setHours] = useState(
    entity === "calendar" && initial?.entity === "calendar"
      ? initial.hours
      : [
          { weekday: 1, startMinute: 480, endMinute: 1080 },
          { weekday: 2, startMinute: 480, endMinute: 1080 },
          { weekday: 3, startMinute: 480, endMinute: 1080 },
          { weekday: 4, startMinute: 480, endMinute: 1080 },
          { weekday: 5, startMinute: 480, endMinute: 1080 },
        ],
  );
  const [holidays, setHolidays] = useState(
    entity === "calendar" && initial?.entity === "calendar"
      ? initial.holidays
      : [],
  );
  const [targets, setTargets] = useState(
    priorities.map((priority) =>
      initial?.entity === "policy"
        ? (initial.targets.find((t) => t.priority === priority) ?? {
            priority,
            firstResponseMinutes: 60,
            resolutionMinutes: 480,
            warningPercent: 80,
          })
        : {
            priority,
            firstResponseMinutes: 60,
            resolutionMinutes: 480,
            warningPercent: 80,
          },
    ),
  );
  const [rules, setRules] = useState(
    initial?.entity === "policy" ? initial.rules : [],
  );
  const minuteTime = (n: number) =>
    `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  const timeMinute = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  return (
    <form
      className="portal-admin-form"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        const payload: Record<string, unknown> = { entity };
        for (const field of fields)
          payload[field.key] =
            field.type === "checkbox"
              ? form.get(field.key) === "on"
              : field.type === "number"
                ? Number(form.get(field.key))
                : String(form.get(field.key) ?? "");
        if (initial && "id" in initial) payload.id = initial.id;
        if (initial?.version) payload.version = initial.version;
        if (entity === "calendar") {
          payload.hours = hours;
          payload.holidays = holidays;
        }
        if (entity === "policy") {
          payload.targets = targets;
          payload.rules = rules;
        }
        const result = administrationSchema.safeParse(payload);
        if (!result.success) {
          setError(result.error.issues[0]?.message || "Revise os campos.");
          return;
        }
        startTransition(async () => {
          const response = await updateAdministration(result.data);
          if (response?.data?.ok) {
            onSaved();
            router.refresh();
          } else
            setError(
              response?.data?.message ||
                response?.serverError ||
                "Revise os dados informados e suas permissões.",
            );
        });
      }}
    >
      {impact && <p className="portal-admin-impact">{impact}</p>}
      <div className="portal-admin-fields">
        {fields.map((field) => {
          const id = `${uid}-${field.key}`;
          const value = values[field.key as keyof typeof values];
          return (
            <div
              className={`portal-field ${field.type === "textarea" || field.type === "checkbox" ? "portal-admin-wide" : ""}`}
              key={field.key}
            >
              <Label htmlFor={id}>
                {field.label}
                {field.required ? " *" : ""}
              </Label>
              {field.options ? (
                <>
                  <select
                    id={id}
                    name={field.key}
                    className="portal-form-input"
                    required={field.required}
                    defaultValue={String(value ?? "")}
                    disabled={field.readOnly || pending}
                  >
                    <option value="">Selecione</option>
                    {field.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                    {Boolean(value) &&
                      !field.options.some((o) => o.id === value) && (
                        <option value={String(value)}>
                          Referência atual indisponível
                        </option>
                      )}
                  </select>
                  {field.readOnly && (
                    <input
                      type="hidden"
                      name={field.key}
                      value={String(value ?? "")}
                    />
                  )}
                </>
              ) : field.type === "checkbox" ? (
                <input
                  id={id}
                  type="checkbox"
                  name={field.key}
                  defaultChecked={Boolean(value)}
                  disabled={pending}
                />
              ) : field.type === "textarea" ? (
                <Textarea
                  id={id}
                  name={field.key}
                  defaultValue={String(value ?? "")}
                  className="portal-form-input"
                  maxLength={field.maxLength}
                  disabled={pending}
                />
              ) : (
                <Input
                  id={id}
                  name={field.key}
                  type={field.type || "text"}
                  className="portal-form-input"
                  defaultValue={
                    entity === "calendar" && initial && field.key === "name"
                      ? `${String(value)} · revisão`
                      : String(value ?? "")
                  }
                  readOnly={field.readOnly}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  maxLength={field.maxLength}
                  disabled={pending}
                />
              )}
            </div>
          );
        })}
      </div>
      {entity === "policy" && (
        <>
          <fieldset disabled={pending}>
            <legend>Metas por prioridade · minutos úteis</legend>
            {targets.map((t, i) => (
              <div className="portal-admin-target" key={t.priority}>
                <b>{administrativeLabel(t.priority)}</b>
                {(
                  [
                    "firstResponseMinutes",
                    "resolutionMinutes",
                    "warningPercent",
                  ] as const
                ).map((key, j) => (
                  <div className="portal-field" key={key}>
                    <Label htmlFor={`${uid}-${i}-${key}`}>
                      {["Primeira resposta", "Resolução", "Aviso (%)"][j]}
                    </Label>
                    <Input
                      id={`${uid}-${i}-${key}`}
                      type="number"
                      className="portal-form-input"
                      min={1}
                      max={key === "warningPercent" ? 100 : 525600}
                      required
                      value={t[key]}
                      onChange={(e) =>
                        setTargets(
                          targets.map((v, n) =>
                            n === i
                              ? { ...v, [key]: Number(e.target.value) }
                              : v,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
          </fieldset>
          <fieldset disabled={pending}>
            <legend>Escalonamento automático</legend>
            {(["N1", "N2"] as const).map((from) => {
              const index = rules.findIndex((r) => r.fromLevel === from),
                rule = rules[index];
              return (
                <div className="portal-admin-rule" key={from}>
                  <Label>
                    <input
                      type="checkbox"
                      checked={Boolean(rule)}
                      onChange={(e) =>
                        setRules(
                          e.target.checked
                            ? [
                                ...rules,
                                {
                                  fromLevel: from,
                                  toLevel: from === "N1" ? "N2" : "N3",
                                  resolutionPercent: 90,
                                  active: true,
                                },
                              ]
                            : rules.filter((r) => r.fromLevel !== from),
                        )
                      }
                    />{" "}
                    {from} → {from === "N1" ? "N2" : "N3"}
                  </Label>
                  {rule && (
                    <>
                      <Label htmlFor={`${uid}-${from}`}>
                        Percentual da resolução
                      </Label>
                      <Input
                        id={`${uid}-${from}`}
                        type="number"
                        min={1}
                        max={100}
                        value={rule.resolutionPercent}
                        onChange={(e) =>
                          setRules(
                            rules.map((r, n) =>
                              n === index
                                ? {
                                    ...r,
                                    resolutionPercent: Number(e.target.value),
                                  }
                                : r,
                            ),
                          )
                        }
                      />
                      <Label>
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={(e) =>
                            setRules(
                              rules.map((r, n) =>
                                n === index
                                  ? { ...r, active: e.target.checked }
                                  : r,
                              ),
                            )
                          }
                        />{" "}
                        Regra ativa
                      </Label>
                    </>
                  )}
                </div>
              );
            })}
          </fieldset>
        </>
      )}
      {entity === "calendar" && (
        <>
          <fieldset disabled={pending}>
            <legend>Intervalos de atendimento</legend>
            {hours.map((h, i) => (
              <div className="portal-admin-interval" key={i}>
                <select
                  className="portal-form-input"
                  aria-label={`Dia do intervalo ${i + 1}`}
                  value={h.weekday}
                  onChange={(e) =>
                    setHours(
                      hours.map((v, n) =>
                        n === i ? { ...v, weekday: Number(e.target.value) } : v,
                      ),
                    )
                  }
                >
                  {[
                    "Domingo",
                    "Segunda",
                    "Terça",
                    "Quarta",
                    "Quinta",
                    "Sexta",
                    "Sábado",
                  ].map((s, n) => (
                    <option key={s} value={n}>
                      {s}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label={`Início do intervalo ${i + 1}`}
                  type="time"
                  value={minuteTime(h.startMinute)}
                  onChange={(e) =>
                    setHours(
                      hours.map((v, n) =>
                        n === i
                          ? { ...v, startMinute: timeMinute(e.target.value) }
                          : v,
                      ),
                    )
                  }
                />
                <Input
                  aria-label={`Fim do intervalo ${i + 1}`}
                  type="time"
                  title="00:00 indica meia-noite no fim do dia"
                  value={minuteTime(h.endMinute === 1440 ? 0 : h.endMinute)}
                  onChange={(e) =>
                    setHours(
                      hours.map((v, n) =>
                        n === i
                          ? {
                              ...v,
                              endMinute: timeMinute(e.target.value) || 1440,
                            }
                          : v,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Remover intervalo ${i + 1}`}
                  onClick={() => setHours(hours.filter((_, n) => n !== i))}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={hours.length >= 28}
              onClick={() =>
                setHours([
                  ...hours,
                  { weekday: 1, startMinute: 480, endMinute: 1080 },
                ])
              }
            >
              Adicionar intervalo
            </Button>
          </fieldset>
          <fieldset disabled={pending}>
            <legend>Feriados</legend>
            {holidays.map((h, i) => (
              <div className="portal-admin-interval" key={i}>
                <Input
                  aria-label={`Data do feriado ${i + 1}`}
                  type="date"
                  value={h.date}
                  onChange={(e) =>
                    setHolidays(
                      holidays.map((v, n) =>
                        n === i ? { ...v, date: e.target.value } : v,
                      ),
                    )
                  }
                />
                <Input
                  aria-label={`Nome do feriado ${i + 1}`}
                  value={h.name}
                  maxLength={160}
                  onChange={(e) =>
                    setHolidays(
                      holidays.map((v, n) =>
                        n === i ? { ...v, name: e.target.value } : v,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={`Remover feriado ${i + 1}`}
                  onClick={() =>
                    setHolidays(holidays.filter((_, n) => n !== i))
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={holidays.length >= 366}
              onClick={() => setHolidays([...holidays, { date: "", name: "" }])}
            >
              Adicionar feriado
            </Button>
          </fieldset>
        </>
      )}
      {error && (
        <p role="alert" className="portal-form-error">
          {error}
        </p>
      )}
      <div className="portal-admin-footer">
        <Button
          type="button"
          variant="outline"
          onClick={onSaved}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="portal-primary-button"
        >
          {pending
            ? "Salvando…"
            : initial && (entity === "policy" || entity === "calendar")
              ? "Criar nova versão"
              : "Salvar"}
        </Button>
      </div>
      {pending && <p role="status">Validando e salvando o cadastro…</p>}
    </form>
  );
}
export function PolicyStateButton({
  id,
  version,
  active,
}: {
  id: string;
  version: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition(),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <div>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await updateAdministration({
              entity: "policyState",
              id,
              version,
              active: !active,
            });
            if (r?.data?.ok) {
              setError("");
              router.refresh();
            } else
              setError(
                r?.data?.message || "Não foi possível alterar o estado.",
              );
          })
        }
      >
        {active ? "Desativar" : "Ativar"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
