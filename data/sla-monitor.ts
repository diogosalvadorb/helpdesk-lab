import "server-only";

import { openStatuses } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import {
  inspectSla,
  measuredCompliance,
  measurementFromEvents,
  snapshotFromEvents,
} from "@/lib/ticket-sla";
import { queueFilterSchema } from "@/lib/validations/ticket-service";

import { getOperationContext } from "./ticket-service";

export async function getSlaMonitor(
  raw: Record<string, string | string[] | undefined>,
) {
  const context = await getOperationContext();
  if (!context) return null;
  const filters = queueFilterSchema.parse(raw),
    now = new Date();
  const bucket =
    typeof raw.bucket === "string" &&
    ["warning", "breached", "paused", "noTarget", "normal"].includes(raw.bucket)
      ? raw.bucket
      : "all";
  const where = {
    AND: [
      context.scope,
      {
        status: { in: openStatuses },
        ...(filters.company ? { companyId: filters.company } : {}),
        ...(filters.level ? { level: filters.level } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.q
          ? { subject: { contains: filters.q, mode: "insensitive" as const } }
          : {}),
      },
    ],
  };
  const [rows, resolved, companies] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [{ resolutionDueAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        priority: true,
        level: true,
        firstRespondedAt: true,
        firstResponseDueAt: true,
        resolutionDueAt: true,
        company: { select: { name: true } },
        slaPauses: { select: { startedAt: true, endedAt: true } },
        events: {
          where: { type: { in: ["CREATED", "REOPENED"] } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { metadata: true },
        },
      },
    }),
    prisma.ticket.findMany({
      where: {
        AND: [
          context.scope,
          {
            status: { in: ["RESOLVED", "CLOSED"] },
            ...(filters.company ? { companyId: filters.company } : {}),
            ...(filters.level ? { level: filters.level } : {}),
            ...(filters.priority ? { priority: filters.priority } : {}),
            ...(filters.q
              ? { subject: { contains: filters.q, mode: "insensitive" } }
              : {}),
          },
        ],
      },
      select: {
        events: {
          where: { type: "RESOLVED" },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { metadata: true },
        },
      },
    }),
    prisma.company.findMany({
      where: { status: "ACTIVE", tickets: { some: context.scope } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const inspected = rows.map((row) => {
    try {
      const result = inspectSla(row, snapshotFromEvents(row.events), now);
      return {
        id: row.id,
        number: row.number,
        subject: row.subject,
        company: row.company.name,
        priority: row.priority,
        level: row.level,
        due:
          (row.firstRespondedAt
            ? row.resolutionDueAt
            : row.firstResponseDueAt
          )?.toISOString() ?? null,
        ...result,
      };
    } catch {
      return {
        id: row.id,
        number: row.number,
        subject: row.subject,
        company: row.company.name,
        priority: row.priority,
        level: row.level,
        due: null,
        bucket: "noTarget" as const,
        percent: null,
        resolutionPercent: null,
      };
    }
  });
  const counts = { normal: 0, warning: 0, breached: 0, paused: 0, noTarget: 0 };
  for (const row of inspected) counts[row.bucket]++;
  const selected = inspected.filter(
    (row) => bucket === "all" || row.bucket === bucket,
  );
  const measured = resolved.map((row) => ({
    resolutionMeasurement: measurementFromEvents(row.events),
  }));
  const responseMeasurements = measured.flatMap((row) =>
    row.resolutionMeasurement?.firstResponseElapsedMs !== null &&
    row.resolutionMeasurement?.firstResponseElapsedMs !== undefined
      ? [row.resolutionMeasurement.firstResponseElapsedMs]
      : [],
  );
  return {
    companies,
    rows: selected.slice((filters.page - 1) * 20, filters.page * 20),
    total: selected.length,
    counts,
    filters,
    bucket,
    compliance: measuredCompliance(measured),
    sample: responseMeasurements.length,
    averageResponseMinutes: responseMeasurements.length
      ? responseMeasurements.reduce((a, b) => a + b, 0) /
        responseMeasurements.length /
        60000
      : null,
    now: now.toISOString(),
  };
}
