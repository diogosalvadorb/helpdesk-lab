"use client";

import { useRef, useState, useTransition } from "react";

import { updateTicketLifecycle } from "@/actions/ticket-lifecycle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { getLifecycleOptions } from "@/data/ticket-lifecycle";
import {
  type LifecycleInput,
  lifecycleSchema,
} from "@/lib/validations/ticket-lifecycle";

import { PortalLink } from "./portal-link";

type Options = Awaited<ReturnType<typeof getLifecycleOptions>>;
type Ticket = {
  id: string;
  updatedAt: string;
  level: "N1" | "N2" | "N3";
  teamId: string | null;
  status: string;
  isRequester: boolean;
  ratingScore: number | null;
};
export function TicketLifecycleControls({
  ticket,
  options,
  mode,
}: {
  ticket: Ticket;
  options: Options;
  mode: "portal" | "operation";
}) {
  const [open, setOpen] = useState(false),
    [operation, setOperation] =
      useState<LifecycleInput["operation"]>("resolve");
  const [reason, setReason] = useState(""),
    [teamId, setTeamId] = useState(ticket.teamId || ""),
    [toLevel, setToLevel] = useState<"N1" | "N2" | "N3">(
      ticket.level === "N1" ? "N2" : "N3",
    ),
    [assigneeId, setAssigneeId] = useState("");
  const [adminOverride, setAdminOverride] = useState(false),
    [notifyCustomer, setNotifyCustomer] = useState(true),
    [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const attempt = useRef<{ value: string; key: string } | null>(null),
    busy = useRef(false);
  const active = !["RESOLVED", "CLOSED", "CANCELED"].includes(ticket.status);
  const canOperate = mode === "operation" && options;
  if (
    !(canOperate && active) &&
    !(
      ticket.status === "RESOLVED" &&
      (ticket.isRequester || (mode === "operation" && options?.admin))
    ) &&
    !(ticket.status === "CLOSED" && ticket.isRequester)
  )
    return null;
  const trigger = (value: LifecycleInput["operation"], label: string) => (
    <DialogTrigger
      render={
        <Button
          className={
            value === "resolve"
              ? "portal-primary-button"
              : "portal-outline-button"
          }
          disabled={pending}
          onClick={() => {
            setOperation(value);
            setMessage("");
          }}
        />
      }
    >
      {label}
    </DialogTrigger>
  );
  function submit() {
    if (busy.current) return;
    const data = {
      ticketId: ticket.id,
      expectedUpdatedAt: ticket.updatedAt,
      operation,
      ...(operation !== "close" ? { reason } : {}),
      ...(operation === "escalate"
        ? {
            toLevel,
            teamId,
            ...(assigneeId ? { assigneeId } : {}),
            adminOverride,
            notifyCustomer,
          }
        : {}),
    };
    const value = JSON.stringify(data);
    if (!attempt.current || attempt.current.value !== value)
      attempt.current = { value, key: crypto.randomUUID() };
    const input = lifecycleSchema.safeParse({
      ...data,
      submissionKey: attempt.current.key,
    });
    if (!input.success) {
      setMessage(input.error.issues[0].message);
      return;
    }
    busy.current = true;
    startTransition(async () => {
      try {
        const result = await updateTicketLifecycle(input.data);
        if (!result?.data?.ok) {
          setMessage(
            result?.data?.message ||
              result?.serverError ||
              "Revise os campos e tente novamente.",
          );
          return;
        }
        setOpen(false);
        setReason("");
        setMessage(
          result.data.emailFailed
            ? "Alteração salva. Não foi possível enviar a confirmação por e-mail."
            : "Atendimento atualizado.",
        );
      } catch {
        setMessage(
          "Não foi possível confirmar a alteração. Atualize a página antes de tentar novamente.",
        );
      } finally {
        busy.current = false;
      }
    });
  }
  const levelIndex = (level: string) => ["N1", "N2", "N3"].indexOf(level);
  const agents =
    options?.teams
      .find((team) => team.id === teamId)
      ?.agents.filter(
        (agent) => levelIndex(agent.level) >= levelIndex(toLevel),
      ) || [];
  return (
    <Card className="portal-card portal-lifecycle-controls">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="portal-lifecycle-actions">
          {canOperate && active && (
            <>
              {(ticket.level !== "N3" || options.admin) &&
                trigger("escalate", "Escalonar chamado")}
              {trigger("resolve", "Resolver chamado")}
            </>
          )}
          {ticket.status === "RESOLVED" &&
            ticket.isRequester &&
            trigger("close", "Confirmar solução e encerrar")}
          {ticket.status === "RESOLVED" &&
            (ticket.isRequester || (mode === "operation" && options?.admin)) &&
            trigger("reopen", "Reabrir chamado")}
          {ticket.isRequester &&
            ["RESOLVED", "CLOSED"].includes(ticket.status) && (
              <PortalLink
                href={`/chamados/${ticket.id}/avaliar`}
                className="portal-outline-button"
              >
                {ticket.ratingScore
                  ? `Avaliação registrada · ${ticket.ratingScore}/5`
                  : "Avaliar atendimento"}
              </PortalLink>
            )}
          {ticket.status === "RESOLVED" && (
            <p className="portal-muted">
              A solução está no histórico. Uma reabertura inicia um novo ciclo
              de SLA e preserva as resoluções anteriores.
            </p>
          )}
        </div>
        <DialogContent className="portal-dialog portal-lifecycle-dialog">
          <DialogHeader>
            <DialogTitle>
              {operation === "escalate"
                ? "Escalonar atendimento"
                : operation === "resolve"
                  ? "Resolver chamado"
                  : operation === "close"
                    ? "Confirmar solução"
                    : "Reabrir atendimento"}
            </DialogTitle>
            <DialogDescription>
              {operation === "escalate"
                ? "O histórico e os prazos serão preservados. O acesso será revalidado após a transferência."
                : operation === "reopen"
                  ? "Um novo ciclo começa agora, sem apagar as medições anteriores. O responsável será liberado para nova atribuição."
                  : operation === "close"
                    ? "Confirme que a solução resolveu sua solicitação. Um chamado encerrado não pode ser reaberto por este fluxo."
                    : "Descreva a solução. O resumo ficará visível para o solicitante."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <fieldset disabled={pending}>
              {operation === "escalate" && (
                <>
                  <div className="portal-form-row">
                    <div className="portal-field">
                      <Label htmlFor="escalation-level">
                        Nível de destino *
                      </Label>
                      <select
                        id="escalation-level"
                        className="portal-form-input"
                        value={toLevel}
                        onChange={(event) => {
                          setToLevel(event.target.value as "N1" | "N2" | "N3");
                          setAssigneeId("");
                        }}
                      >
                        {(["N1", "N2", "N3"] as const)
                          .filter(
                            (level) =>
                              options?.admin ||
                              levelIndex(level) ===
                                levelIndex(ticket.level) + 1,
                          )
                          .map((level) => (
                            <option value={level} key={level}>
                              {level}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="portal-field">
                      <Label htmlFor="escalation-team">
                        Equipe responsável *
                      </Label>
                      <select
                        id="escalation-team"
                        className="portal-form-input"
                        value={teamId}
                        onChange={(event) => {
                          setTeamId(event.target.value);
                          setAssigneeId("");
                        }}
                      >
                        <option value="">Selecione uma equipe</option>
                        {options?.teams.map((team) => (
                          <option value={team.id} key={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="portal-field">
                    <Label htmlFor="escalation-agent">Analista</Label>
                    <select
                      id="escalation-agent"
                      className="portal-form-input"
                      value={assigneeId}
                      onChange={(event) => setAssigneeId(event.target.value)}
                    >
                      <option value="">
                        Sem atribuição — disponível na fila
                      </option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} · {agent.level}
                        </option>
                      ))}
                    </select>
                  </div>
                  {options?.admin && (
                    <label className="portal-note-confirm">
                      <input
                        type="checkbox"
                        checked={adminOverride}
                        onChange={(event) =>
                          setAdminOverride(event.target.checked)
                        }
                      />
                      Autorizar administrativamente um movimento fora da
                      sequência N1 → N2 → N3.
                    </label>
                  )}
                </>
              )}
              {operation !== "close" && (
                <div className="portal-field">
                  <Label htmlFor="lifecycle-reason">
                    {operation === "resolve"
                      ? "Resumo da solução *"
                      : "Motivo *"}
                  </Label>
                  <Textarea
                    id="lifecycle-reason"
                    className="portal-form-input portal-form-description"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={5000}
                    required
                  />
                </div>
              )}
              {operation === "escalate" && (
                <label className="portal-note-confirm">
                  <input
                    type="checkbox"
                    checked={notifyCustomer}
                    onChange={(event) =>
                      setNotifyCustomer(event.target.checked)
                    }
                  />
                  Notificar o cliente sobre o encaminhamento
                </label>
              )}
              <p role="alert" className="portal-field-error">
                {message}
              </p>
              <div className="portal-form-footer">
                <Button
                  type="button"
                  className="portal-outline-button"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="portal-primary-button"
                  type="submit"
                  disabled={pending}
                >
                  {pending
                    ? "Salvando…"
                    : operation === "escalate"
                      ? "Confirmar escalonamento"
                      : operation === "resolve"
                        ? "Confirmar resolução"
                        : operation === "close"
                          ? "Encerrar chamado"
                          : "Confirmar reabertura"}
                </Button>
              </div>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
      <p role="status" className="portal-muted">
        {!open ? message : ""}
      </p>
    </Card>
  );
}
