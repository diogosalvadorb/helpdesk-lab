import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { openStatuses } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import {
  average,
  median,
  reportDay,
  type reportingPeriod,
  ReportLimitError,
  shiftDay,
} from "@/lib/reporting";
import {
  inspectSla,
  measuredCompliance,
  measurementFromEvents,
  snapshotFromEvents,
} from "@/lib/ticket-sla";
type Period = ReturnType<typeof reportingPeriod>;
const rowSelect = {
  id: true,
  number: true,
  subject: true,
  createdAt: true,
  status: true,
  priority: true,
  level: true,
  department: { select: { name: true } },
  company: { select: { name: true } },
} satisfies Prisma.TicketSelect;
export async function calculateReport(
  scope: Prisma.TicketWhereInput,
  period: Period,
  operation: boolean,
  exportRows = false,
) {
  return prisma.$transaction(
    async (tx) => {
      const inRange = { gte: period.start, lt: period.end },
        beforeRange = { gte: period.previousStart, lt: period.previousEnd },
        now = new Date();
      const createdWhere: Prisma.TicketWhereInput = {
          AND: [scope, { createdAt: inRange }],
        },
        activeWhere: Prisma.TicketWhereInput = {
          AND: [scope, { status: { in: openStatuses } }],
        };
      const sizes = await Promise.all([
        tx.ticket.count({ where: createdWhere }),
        tx.ticket.count({ where: activeWhere }),
        tx.ticketEvent.count({
          where: {
            type: "RESOLVED",
            ticket: scope,
            createdAt: { gte: period.previousStart, lt: period.end },
          },
        }),
        tx.ticketRating.count({ where: { ticket: scope, createdAt: inRange } }),
        tx.ticketEscalation.count({
          where: { ticket: scope, createdAt: inRange },
        }),
      ]);
      if (sizes.some((n) => n > 10000))
        throw new ReportLimitError(
          "Esta consulta supera 10.000 registros em um conjunto de dados. Reduza o período ou filtre uma empresa.",
        );
      if (exportRows && sizes[0] > 5000)
        throw new ReportLimitError(
          "O CSV permite até 5.000 chamados. Reduza o período ou refine os filtros.",
        );
      const [
        created,
        previousCreated,
        backlog,
        resolutions,
        previousResolutions,
        ratings,
        escalations,
        rows,
        total,
      ] = await Promise.all([
        tx.ticket.findMany({
          where: createdWhere,
          select: {
            id: true,
            createdAt: true,
            priority: true,
            level: true,
            category: { select: { name: true } },
            department: { select: { name: true } },
          },
        }),
        tx.ticket.count({
          where: { AND: [scope, { createdAt: beforeRange }] },
        }),
        tx.ticket.findMany({
          where: activeWhere,
          select: {
            id: true,
            number: true,
            subject: true,
            priority: true,
            level: true,
            firstRespondedAt: true,
            firstResponseDueAt: true,
            resolutionDueAt: true,
            status: true,
            slaPauses: { select: { startedAt: true, endedAt: true } },
            events: {
              where: { type: { in: ["CREATED", "REOPENED"] } },
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              take: 1,
              select: { metadata: true },
            },
          },
        }),
        tx.ticketEvent.findMany({
          where: { type: "RESOLVED", ticket: scope, createdAt: inRange },
          select: { createdAt: true, metadata: true, ticketId: true },
        }),
        tx.ticketEvent.findMany({
          where: { type: "RESOLVED", ticket: scope, createdAt: beforeRange },
          select: { metadata: true },
        }),
        tx.ticketRating.findMany({
          where: {
            ticket: scope,
            createdAt: inRange,
            score: { gte: 1, lte: 5 },
          },
          select: { score: true },
        }),
        tx.ticketEscalation.findMany({
          where: { ticket: scope, createdAt: inRange },
          select: { fromLevel: true, toLevel: true, automatic: true },
        }),
        tx.ticket.findMany({
          where: createdWhere,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          take: 10,
          skip: (period.filters.page - 1) * 10,
          select: rowSelect,
        }),
        tx.ticket.count({ where: createdWhere }),
      ]);
      let outputRows = rows;
      if (exportRows) {
        outputRows = [];
        let cursor: string | undefined;
        for (;;) {
          const batch: Prisma.TicketGetPayload<{ select: typeof rowSelect }>[] =
            await tx.ticket.findMany({
              where: createdWhere,
              orderBy: [{ createdAt: "desc" }, { id: "asc" }],
              take: 500,
              ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
              select: rowSelect,
            });
          outputRows.push(...batch);
          if (batch.length < 500) break;
          cursor = batch[batch.length - 1].id;
        }
      }
      const measured = resolutions.map((e) => ({
          resolutionMeasurement: measurementFromEvents([e]),
        })),
        previousMeasured = previousResolutions.map((e) => ({
          resolutionMeasurement: measurementFromEvents([e]),
        }));
      const responses = measured.flatMap((m) =>
        m.resolutionMeasurement?.firstResponseElapsedMs === null ||
        !m.resolutionMeasurement
          ? []
          : [m.resolutionMeasurement.firstResponseElapsedMs / 60000],
      );
      const duration = measured.flatMap((m) =>
        m.resolutionMeasurement
          ? [m.resolutionMeasurement.resolutionElapsedMs / 60000]
          : [],
      );
      const priorDuration = previousMeasured.flatMap((m) =>
        m.resolutionMeasurement
          ? [m.resolutionMeasurement.resolutionElapsedMs / 60000]
          : [],
      );
      const distribution = (values: string[]) => {
        const counts = new Map<string, number>();
        for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
        return [...counts]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      };
      const bucketCounts = {
        normal: 0,
        warning: 0,
        breached: 0,
        paused: 0,
        noTarget: 0,
      };
      const priorities = backlog
        .map((t) => {
          let inspection;
          try {
            inspection = inspectSla(t, snapshotFromEvents(t.events), now);
          } catch {
            inspection = { bucket: "noTarget" as const, percent: null };
          }
          bucketCounts[inspection.bucket]++;
          return {
            id: t.id,
            number: t.number,
            subject: t.subject,
            priority: t.priority,
            level: t.level,
            bucket: inspection.bucket,
            due:
              (t.firstRespondedAt
                ? t.resolutionDueAt
                : t.firstResponseDueAt
              )?.toISOString() ?? null,
          };
        })
        .sort(
          (a, b) =>
            (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
            a.id.localeCompare(b.id),
        )
        .slice(0, 5);
      const trends = [];
      for (
        let day = period.filters.from;
        day <= period.filters.to;
        day = shiftDay(day, 1)
      )
        trends.push({ day, opened: 0, resolved: 0 });
      const byDay = new Map(trends.map((d) => [d.day, d]));
      for (const t of created) {
        const d = byDay.get(reportDay(t.createdAt));
        if (d) d.opened++;
      }
      for (const e of resolutions) {
        const d = byDay.get(reportDay(e.createdAt));
        if (d) d.resolved++;
      }
      return {
        asOf: now.toISOString(),
        created: created.length,
        previousCreated,
        backlog: backlog.length,
        resolvedCycles: resolutions.length,
        resolvedTickets: new Set(resolutions.map((r) => r.ticketId)).size,
        previousResolvedCycles: previousResolutions.length,
        compliance: measuredCompliance(measured),
        previousCompliance: measuredCompliance(previousMeasured),
        slaSample: responses.length,
        responseAverage: average(responses),
        responseMedian: median(responses),
        resolutionAverage: average(duration),
        resolutionMedian: median(duration),
        resolutionSample: duration.length,
        previousResolutionAverage: average(priorDuration),
        ratingAverage: average(ratings.map((r) => r.score)),
        ratingSample: ratings.length,
        escalations: escalations.length,
        automaticEscalations: escalations.filter((e) => e.automatic).length,
        escalationLevels: distribution(
          escalations.map((e) => `${e.fromLevel} → ${e.toLevel}`),
        ),
        priorities: distribution(created.map((t) => t.priority)),
        levels: distribution(created.map((t) => t.level)),
        categories: distribution(created.map((t) => t.category.name)),
        departments: distribution(created.map((t) => t.department.name)),
        backlogLevels: distribution(backlog.map((t) => t.level)),
        bucketCounts,
        urgent: priorities,
        trends,
        rows: outputRows.map((r) => ({
          ...r,
          company: operation ? r.company.name : undefined,
          createdAt: r.createdAt.toISOString(),
        })),
        total,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      timeout: 30000,
    },
  );
}
