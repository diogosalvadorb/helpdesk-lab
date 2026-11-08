"use client";

import { useRef, useState, useTransition } from "react";

import { updateTicketService } from "@/actions/ticket-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  getServiceOptions,
  TicketConversationData,
} from "@/data/ticket-service";
import type { ServiceActionInput } from "@/lib/validations/ticket-service";

export function TicketControls({
  ticket,
  options,
}: {
  ticket: Pick<
    TicketConversationData,
    "id" | "updatedAt" | "status" | "teamId" | "assigneeId"
  >;
  options: NonNullable<Awaited<ReturnType<typeof getServiceOptions>>>;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [teamId, setTeamId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [reason, setReason] = useState("");
  const busy = useRef(false);
  const attempt = useRef<{
    fingerprint: string;
    key: string;
    version: string;
  } | null>(null);
  function act(operation: ServiceActionInput["operation"]) {
    if (busy.current) return;
    const fingerprint = JSON.stringify([operation, teamId, assigneeId, reason]);
    if (
      !attempt.current ||
      attempt.current.fingerprint !== fingerprint ||
      attempt.current.version !== ticket.updatedAt
    )
      attempt.current = {
        fingerprint,
        key: crypto.randomUUID(),
        version: ticket.updatedAt,
      };
    const input: ServiceActionInput = {
      ticketId: ticket.id,
      expectedUpdatedAt: ticket.updatedAt,
      submissionKey: attempt.current.key,
      operation,
      ...(operation === "route" ? { teamId } : {}),
      ...(operation === "assign" ? { assigneeId } : {}),
      ...(operation === "wait" ? { reason } : {}),
    };
    if (
      (operation === "route" && !teamId) ||
      (operation === "assign" && !assigneeId) ||
      (operation === "wait" && !reason.trim())
    ) {
      setMessage(
        "Preencha a equipe, responsável ou motivo correspondente à ação.",
      );
      return;
    }
    busy.current = true;
    startTransition(async () => {
      try {
        const result = await updateTicketService(input);
        setMessage(
          result?.data?.ok
            ? "Atendimento atualizado."
            : result?.data?.message ||
                result?.serverError ||
                "Não foi possível atualizar. Revise os campos.",
        );
      } catch {
        setMessage(
          "Não foi possível confirmar a atualização. Tente novamente.",
        );
      } finally {
        busy.current = false;
      }
    });
  }
  if (["RESOLVED", "CLOSED", "CANCELED"].includes(ticket.status)) return null;
  return (
    <Card className="portal-card portal-service-controls">
      <h2>Gerenciar atendimento</h2>
      <fieldset disabled={pending}>
        {!ticket.teamId && options.admin ? (
          <div className="portal-service-control-row">
            <div className="portal-field">
              <Label htmlFor="route-team">Equipe de triagem</Label>
              <select
                id="route-team"
                className="portal-form-input"
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
              >
                <option value="">Selecione uma equipe</option>
                {options.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="portal-primary-button"
              onClick={() => act("route")}
            >
              Encaminhar para equipe
            </Button>
          </div>
        ) : (
          <>
            <div className="portal-service-control-row">
              <Button
                className="portal-outline-button"
                disabled={
                  !options.agents.some(
                    (agent) => agent.id === options.userId,
                  ) || Boolean(ticket.assigneeId)
                }
                onClick={() => act("claim")}
              >
                {ticket.assigneeId === options.userId
                  ? "Você é o responsável"
                  : "Assumir chamado"}
              </Button>
              <div className="portal-field">
                <Label htmlFor="service-assignee">Responsável da equipe</Label>
                <select
                  id="service-assignee"
                  className="portal-form-input"
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                >
                  <option value="">Selecione um responsável</option>
                  {options.agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="portal-outline-button"
                onClick={() => act("assign")}
              >
                Atribuir responsável
              </Button>
            </div>
            {(options.admin || ticket.assigneeId === options.userId) && (
              <div className="portal-service-control-row">
                {ticket.status === "OPEN" && (
                  <Button
                    className="portal-primary-button"
                    onClick={() => act("start")}
                  >
                    Iniciar atendimento
                  </Button>
                )}
                {["IN_PROGRESS", "INVESTIGATING"].includes(ticket.status) && (
                  <>
                    <div className="portal-field">
                      <Label htmlFor="wait-reason">
                        Motivo da espera — visível para o cliente
                      </Label>
                      <Input
                        id="wait-reason"
                        className="portal-form-input"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        maxLength={1000}
                      />
                    </div>
                    <Button
                      className="portal-outline-button"
                      onClick={() => act("wait")}
                    >
                      Aguardar resposta do cliente
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </fieldset>
      <p role="status" className="portal-muted">
        {pending ? "Atualizando…" : message}
      </p>
    </Card>
  );
}
