import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { monthBounds, openStatuses } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import {
  inspectSla,
  measuredCompliance,
  measurementFromEvents,
  type SlaBucket,
  snapshotFromEvents,
} from "@/lib/ticket-sla";
import { portalTicketFilters } from "@/lib/validations/portal";

import { getPortalContext } from "./portal-context";

export async function getPortalSla(
  raw: Record<string, string | string[] | undefined>,
) {
  const context = await getPortalContext();
  if (!context.company) return null;
  const filters = portalTicketFilters.parse(raw),
    now = new Date(),
    month = monthBounds(now);
  const from = filters.from
      ? new Date(`${filters.from}T00:00:00Z`)
      : new Date(month.start.toISOString().slice(0, 10) + "T00:00:00Z"),
    to = filters.to
      ? new Date(`${filters.to}T23:59:59.999Z`)
      : new Date(
          new Date(
            month.end.toISOString().slice(0, 10) + "T00:00:00Z",
          ).getTime() - 1,
        );
  const bucket =
    typeof raw.bucket === "string" &&
    ["normal", "warning", "breached", "paused", "noTarget"].includes(raw.bucket)
      ? raw.bucket
      : "all";
  const activeWhere: Prisma.TicketWhereInput = {
    AND: [context.scope, { status: { in: openStatuses } }],
  };
  const historyWhere: Prisma.TicketEventWhereInput = {
    type: "RESOLVED",
    ticket: context.scope,
    createdAt: { gte: from, lte: to },
    ...(from > to || filters.invalidPeriod ? { id: { in: [] } } : {}),
  };
  const counts: Record<SlaBucket, number> = {
    normal: 0,
    warning: 0,
    breached: 0,
    paused: 0,
    noTarget: 0,
  };
  type Row = {
    id: string;
    number: number;
    subject: string;
    priority: string;
    level: string;
    due: string | null;
    bucket: SlaBucket;
    percent: number | null;
  };
  const selected: Row[] = [];
  let selectedTotal = 0,
    cursor: string | undefined;
  // Inspect only authorized records, in bounded batches. Keep only the requested page.
  for (;;) {
    const batch = await prisma.ticket.findMany({
      where: activeWhere,
      orderBy: { id: "asc" },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        number: true,
        subject: true,
        priority: true,
        level: true,
        status: true,
        firstRespondedAt: true,
        firstResponseDueAt: true,
        resolutionDueAt: true,
        slaPauses: { select: { startedAt: true, endedAt: true } },
        events: {
          where: { type: { in: ["CREATED", "REOPENED"] } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { metadata: true },
        },
      },
    });
    for (const ticket of batch) {
      let result;
      try {
        result = inspectSla(ticket, snapshotFromEvents(ticket.events), now);
      } catch {
        result = { bucket: "noTarget" as const, percent: null };
      }
      counts[result.bucket]++;
      if (bucket !== "all" && result.bucket !== bucket) continue;
      selectedTotal++;
      selected.push({
        id: ticket.id,
        number: ticket.number,
        subject: ticket.subject,
        priority: ticket.priority,
        level: ticket.level,
        due:
          (ticket.firstRespondedAt
            ? ticket.resolutionDueAt
            : ticket.firstResponseDueAt
          )?.toISOString() ?? null,
        bucket: result.bucket,
        percent: result.percent,
      });
      selected.sort(
        (a, b) =>
          (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
          a.id.localeCompare(b.id),
      );
      if (selected.length > filters.page * 10) selected.pop();
    }
    if (batch.length < 100) break;
    cursor = batch[batch.length - 1].id;
  }
  let eligible = 0,
    met = 0,
    responseMs = 0;
  cursor = undefined;
  for (;;) {
    const batch: { id: string; metadata: Prisma.JsonValue | null }[] =
      await prisma.ticketEvent.findMany({
        where: historyWhere,
        orderBy: { id: "asc" },
        take: 100,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: { id: true, metadata: true },
      });
    for (const event of batch) {
      const measurement = measurementFromEvents([event]);
      if (!measurement || measurement.firstResponseElapsedMs === null) continue;
      eligible++;
      responseMs += measurement.firstResponseElapsedMs;
      if (measuredCompliance([{ resolutionMeasurement: measurement }]) === 100)
        met++;
    }
    if (batch.length < 100) break;
    cursor = batch[batch.length - 1].id;
  }
  const historyPage =
    Number.isInteger(Number(raw.historyPage)) &&
    Number(raw.historyPage) > 0 &&
    Number(raw.historyPage) <= 10000
      ? Number(raw.historyPage)
      : 1;
  const [history, totalHistory] = await prisma.$transaction([
    prisma.ticketEvent.findMany({
      where: historyWhere,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 10,
      skip: (historyPage - 1) * 10,
      select: {
        id: true,
        createdAt: true,
        metadata: true,
        ticket: { select: { id: true, number: true, subject: true } },
      },
    }),
    prisma.ticketEvent.count({ where: historyWhere }),
  ]);
  return {
    rows: selected.slice((filters.page - 1) * 10),
    total: selectedTotal,
    counts,
    bucket,
    page: filters.page,
    now: now.toISOString(),
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    invalidPeriod: from > to || filters.invalidPeriod,
    compliance: eligible ? (met / eligible) * 100 : null,
    sample: eligible,
    responseMinutes: eligible ? responseMs / eligible / 60000 : null,
    historyPage,
    totalHistory,
    history: history.map((event) => {
      const m = measurementFromEvents([event]);
      const compliance = measuredCompliance([{ resolutionMeasurement: m }]);
      return {
        id: event.id,
        ticket: event.ticket,
        date: event.createdAt.toISOString(),
        firstMinutes:
          m?.firstResponseElapsedMs === null || !m
            ? null
            : m.firstResponseElapsedMs / 60000,
        resolutionMinutes: m ? m.resolutionElapsedMs / 60000 : null,
        compliance: compliance === null ? null : compliance === 100,
      };
    }),
  };
}
