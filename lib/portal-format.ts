import type { TicketPriority, TicketStatus } from "@/generated/prisma/client";

export const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  INVESTIGATING: "Em investigação",
  WAITING_CUSTOMER: "Aguardando resposta",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado",
};
export const priorityLabels: Record<TicketPriority, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};
export const openStatuses: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "INVESTIGATING",
  "WAITING_CUSTOMER",
];
export const ticketNumber = (number: number) =>
  `#CH-${String(number).padStart(4, "0")}`;
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
export const dateTime = (date: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));

export function monthBounds(now: Date) {
  const values = new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(values.find((v) => v.type === "year")!.value);
  const month = Number(values.find((v) => v.type === "month")!.value);
  // São Paulo has used UTC-03 throughout these reporting periods. Compute
  // offset with Intl as well so historical DST boundaries remain correct.
  const start = (offset: number) => {
    const guess = new Date(Date.UTC(year, month - 1 + offset, 1, 3));
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hourCycle: "h23",
    }).formatToParts(guess);
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)!.value);
    const localAsUTC = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    return new Date(
      Date.UTC(year, month - 1 + offset, 1) - (localAsUTC - guess.getTime()),
    );
  };
  return { previous: start(-1), start: start(0), end: start(1) };
}

export function compliance(
  rows: {
    firstResponseMinutes: number | null;
    resolutionMinutes: number | null;
    slaTarget: {
      firstResponseMinutes: number;
      resolutionMinutes: number;
    } | null;
  }[],
) {
  const eligible = rows.filter(
    (row) =>
      row.slaTarget &&
      row.firstResponseMinutes !== null &&
      row.resolutionMinutes !== null,
  );
  const met = eligible.filter(
    (row) =>
      row.firstResponseMinutes! <= row.slaTarget!.firstResponseMinutes &&
      row.resolutionMinutes! <= row.slaTarget!.resolutionMinutes,
  ).length;
  return eligible.length ? (met / eligible.length) * 100 : null;
}

export function slaDisplay(
  ticket: {
    status: TicketStatus;
    firstRespondedAt: Date | null;
    firstResponseDueAt: Date | null;
    resolutionDueAt: Date | null;
    firstResponseMinutes: number | null;
    resolutionMinutes: number | null;
    slaTarget: {
      firstResponseMinutes: number;
      resolutionMinutes: number;
    } | null;
    slaPauses: { id: string }[];
  },
  now: Date,
) {
  if (ticket.status === "CANCELED")
    return { text: "Cancelado", tone: "neutral" };
  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    const value = compliance([ticket]);
    return {
      text:
        value === null
          ? "Sem dados"
          : value === 100
            ? "Cumprido"
            : "Fora da meta",
      tone: value === 0 ? "danger" : "neutral",
    };
  }
  if (ticket.slaPauses.length) return { text: "Pausado", tone: "warning" };
  const due = ticket.firstRespondedAt
    ? ticket.resolutionDueAt
    : ticket.firstResponseDueAt;
  if (!due) return { text: "Sem prazo", tone: "neutral" };
  const minutes = Math.ceil((due.getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return { text: "Vencido", tone: "danger" };
  return {
    text: `${String(Math.floor(minutes / 60)).padStart(2, "0")}h ${String(minutes % 60).padStart(2, "0")}m`,
    tone: minutes <= 60 ? "warning" : "neutral",
  };
}
