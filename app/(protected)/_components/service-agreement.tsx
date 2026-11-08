import { Card } from "@/components/ui/card";
import type { getServiceAgreement } from "@/data/dashboard";
import { priorityLabels } from "@/lib/portal-format";

import { PortalLink } from "./portal-link";

const minutesLabel = (minutes: number) =>
  minutes < 60
    ? `${minutes} min úteis`
    : `${Number((minutes / 60).toFixed(1)).toLocaleString("pt-BR")} ${minutes === 60 ? "hora útil" : "horas úteis"}`;
const timeLabel = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export function ServiceAgreement({
  agreement,
  expanded = false,
  opening = false,
}: {
  agreement: Awaited<ReturnType<typeof getServiceAgreement>>;
  expanded?: boolean;
  opening?: boolean;
}) {
  const medium = agreement?.slaPolicy.targets.find(
    (target) => target.priority === "MEDIUM",
  );
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const hours = agreement?.slaPolicy.calendar.hours || [];
  const regular =
    hours.length === 5 &&
    hours.every(
      (h, i) =>
        h.weekday === i + 1 &&
        h.startMinute === hours[0].startMinute &&
        h.endMinute === hours[0].endMinute,
    );
  return (
    <Card
      className={`portal-card portal-agreement ${opening ? "portal-knowledge" : ""}`}
    >
      {opening && <p className="portal-eyebrow">Seu acordo de atendimento</p>}
      <h2>
        {opening ? "Clareza em cada etapa." : "Seu acordo de atendimento"}
      </h2>
      {agreement ? (
        <>
          <dl>
            <div>
              <dt>Primeira resposta{medium ? " · prioridade média" : ""}</dt>
              <dd>
                {medium
                  ? `Até ${minutesLabel(medium.firstResponseMinutes)}`
                  : "Consulte as metas por prioridade"}
              </dd>
            </div>
            <div>
              <dt>Resolução · prioridade média</dt>
              <dd>
                {medium
                  ? `Até ${minutesLabel(medium.resolutionMinutes)}`
                  : "Sem meta definida"}
              </dd>
            </div>
          </dl>
          <p className="portal-muted">
            {agreement.slaPolicy.calendar.alwaysOpen
              ? "Atendimento 24 horas, todos os dias."
              : regular
                ? `Segunda a sexta, ${timeLabel(hours[0].startMinute)} às ${timeLabel(hours[0].endMinute)}.`
                : hours
                    .map(
                      (h) =>
                        `${days[h.weekday]}, ${timeLabel(h.startMinute)}–${timeLabel(h.endMinute)}`,
                    )
                    .join(" · ") || "Horários ainda não informados."}
            <br />
            {agreement.slaPolicy.calendar.timeZone === "America/Sao_Paulo"
              ? "Horário de Brasília"
              : `Fuso: ${agreement.slaPolicy.calendar.timeZone}`}
          </p>
          {expanded && (
            <>
              <h3>{agreement.name}</h3>
              <p className="portal-muted">
                Contrato {agreement.number} · Meta de cumprimento:{" "}
                {agreement.slaGoalPercent.toString()}%
              </p>
              <dl>
                {agreement.slaPolicy.targets.map((target) => (
                  <div key={target.priority}>
                    <dt>{priorityLabels[target.priority]}</dt>
                    <dd>
                      Resposta: {minutesLabel(target.firstResponseMinutes)}
                      <br />
                      Resolução: {minutesLabel(target.resolutionMinutes)}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {!expanded && <PortalLink href="/sla">Acompanhar SLA →</PortalLink>}
        </>
      ) : (
        <p className="portal-empty">
          Nenhum acordo de atendimento ativo para esta empresa.
        </p>
      )}
    </Card>
  );
}
