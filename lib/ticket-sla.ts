import { z } from "zod";

import type { TicketStatus } from "@/generated/prisma/client";
import {
  CalendarConfigurationError,
  type WorkCalendar,
  workingMillisecondsBetween,
} from "@/lib/business-calendar";

const level = z.enum(["N1", "N2", "N3"]);
export const slaSnapshotSchema = z.object({
  version: z.literal(1),
  cycleStartedAt: z.iso.datetime(),
  firstResponseGoalMinutes: z.number().int().positive().max(525600),
  resolutionGoalMinutes: z.number().int().positive().max(525600),
  warningPercent: z.number().int().min(1).max(100),
  pauseWhileWaitingCustomer: z.boolean().default(true),
  calendar: z.object({
    timeZone: z.string(),
    alwaysOpen: z.boolean(),
    hours: z.array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startMinute: z.number().int().min(0).max(1439),
        endMinute: z.number().int().min(1).max(1440),
      }),
    ),
    holidays: z.array(z.object({ date: z.iso.datetime() })),
  }),
  rules: z.array(
    z.object({
      fromLevel: level,
      toLevel: level,
      resolutionPercent: z.number().int().min(1).max(100),
    }),
  ),
});
export type SlaSnapshot = z.infer<typeof slaSnapshotSchema>;
export function makeSlaSnapshot(
  start: Date,
  target: {
    firstResponseMinutes: number;
    resolutionMinutes: number;
    warningPercent: number;
  },
  calendar: WorkCalendar,
  rules: {
    fromLevel: "N1" | "N2" | "N3";
    toLevel: "N1" | "N2" | "N3";
    resolutionPercent: number;
  }[],
  pauseWhileWaitingCustomer = true,
) {
  const parsed = slaSnapshotSchema.safeParse({
    version: 1,
    cycleStartedAt: start.toISOString(),
    firstResponseGoalMinutes: target.firstResponseMinutes,
    resolutionGoalMinutes: target.resolutionMinutes,
    warningPercent: target.warningPercent,
    pauseWhileWaitingCustomer,
    calendar: {
      ...calendar,
      hours: calendar.hours.map((h) => ({
        weekday: h.weekday,
        startMinute: h.startMinute,
        endMinute: h.endMinute,
      })),
      holidays: calendar.holidays.map((h) => ({ date: h.date.toISOString() })),
    },
    rules: rules.map((r) => ({
      fromLevel: r.fromLevel,
      toLevel: r.toLevel,
      resolutionPercent: r.resolutionPercent,
    })),
  });
  if (!parsed.success) throw new CalendarConfigurationError();
  const result = parsed.data;
  workingMillisecondsBetween(start, start, snapshotCalendar(result));
  return result;
}
export function snapshotCalendar(snapshot: SlaSnapshot): WorkCalendar {
  return {
    ...snapshot.calendar,
    holidays: snapshot.calendar.holidays.map((h) => ({
      date: new Date(h.date),
    })),
  };
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function snapshotFromEvents(events: { metadata: unknown }[]) {
  // Callers supply the latest CREATED/REOPENED event only; never fall back to a
  // previous cycle if the new cycle intentionally has no contract/meta.
  const result = slaSnapshotSchema.safeParse(
    object(events[0]?.metadata).slaSnapshot,
  );
  return result.success ? result.data : null;
}
export function activeWorkingMilliseconds(
  start: Date,
  end: Date,
  pauses: { startedAt: Date; endedAt: Date | null }[],
  calendar: WorkCalendar,
) {
  if (
    pauses.some(
      (pause) =>
        !Number.isFinite(pause.startedAt.getTime()) ||
        (pause.endedAt &&
          (!Number.isFinite(pause.endedAt.getTime()) ||
            pause.endedAt < pause.startedAt)),
    )
  )
    throw new CalendarConfigurationError();
  let total = workingMillisecondsBetween(start, end, calendar);
  const intervals = pauses
    .map((p) => ({
      start: Math.max(start.getTime(), p.startedAt.getTime()),
      end: Math.min(end.getTime(), p.endedAt?.getTime() ?? end.getTime()),
    }))
    .filter((p) => p.end > p.start)
    .sort((a, b) => a.start - b.start);
  let previousEnd = start.getTime();
  for (const interval of intervals) {
    if (interval.start < previousEnd) throw new CalendarConfigurationError();
    total -= workingMillisecondsBetween(
      new Date(interval.start),
      new Date(interval.end),
      calendar,
    );
    previousEnd = interval.end;
  }
  return Math.max(0, total);
}
export const resolutionMeasurementSchema = z.object({
  version: z.literal(1),
  cycleStartedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime(),
  firstResponseGoalMinutes: z.number().positive(),
  resolutionGoalMinutes: z.number().positive(),
  firstResponseElapsedMs: z.number().nonnegative().nullable(),
  resolutionElapsedMs: z.number().nonnegative(),
  summary: z.string(),
});
export type ResolutionMeasurement = z.infer<typeof resolutionMeasurementSchema>;
export function measurementFromEvents(events: { metadata: unknown }[]) {
  const result = resolutionMeasurementSchema.safeParse(
    object(events[0]?.metadata).measurement,
  );
  return result.success ? result.data : null;
}
export function measureResolution(
  snapshot: SlaSnapshot | null,
  firstRespondedAt: Date | null,
  pauses: { startedAt: Date; endedAt: Date | null }[],
  now: Date,
  summary: string,
): ResolutionMeasurement | null {
  if (!snapshot) return null;
  if (firstRespondedAt && firstRespondedAt > now)
    throw new CalendarConfigurationError();
  const start = new Date(snapshot.cycleStartedAt),
    calendar = snapshotCalendar(snapshot);
  return {
    version: 1,
    cycleStartedAt: snapshot.cycleStartedAt,
    resolvedAt: now.toISOString(),
    firstResponseGoalMinutes: snapshot.firstResponseGoalMinutes,
    resolutionGoalMinutes: snapshot.resolutionGoalMinutes,
    firstResponseElapsedMs:
      firstRespondedAt && firstRespondedAt >= start
        ? activeWorkingMilliseconds(start, firstRespondedAt, pauses, calendar)
        : null,
    resolutionElapsedMs: activeWorkingMilliseconds(
      start,
      now,
      pauses,
      calendar,
    ),
    summary,
  };
}
export function measuredCompliance(
  rows: { resolutionMeasurement?: ResolutionMeasurement | null }[],
) {
  const eligible = rows
    .map((row) => row.resolutionMeasurement)
    .filter((m): m is ResolutionMeasurement =>
      Boolean(m && m.firstResponseElapsedMs !== null),
    );
  if (!eligible.length) return null;
  const met = eligible.filter(
    (m) =>
      m.firstResponseElapsedMs! <= m.firstResponseGoalMinutes * 60000 &&
      m.resolutionElapsedMs <= m.resolutionGoalMinutes * 60000,
  ).length;
  return (met / eligible.length) * 100;
}
export type SlaBucket =
  "normal" | "warning" | "breached" | "paused" | "noTarget";
export function inspectSla(
  ticket: {
    firstRespondedAt: Date | null;
    status: TicketStatus;
    firstResponseDueAt: Date | null;
    resolutionDueAt: Date | null;
    slaPauses: { startedAt: Date; endedAt: Date | null }[];
  },
  snapshot: SlaSnapshot | null,
  now: Date,
) {
  if (ticket.slaPauses.some((p) => p.endedAt === null))
    return {
      bucket: "paused" as SlaBucket,
      percent: null,
      resolutionPercent: null,
    };
  if (!snapshot) {
    const due = ticket.firstRespondedAt
      ? ticket.resolutionDueAt
      : ticket.firstResponseDueAt;
    return {
      bucket: (due && due <= now ? "breached" : "noTarget") as SlaBucket,
      percent: null,
      resolutionPercent: null,
    };
  }
  const elapsed = activeWorkingMilliseconds(
    new Date(snapshot.cycleStartedAt),
    now,
    ticket.slaPauses,
    snapshotCalendar(snapshot),
  );
  const resolutionPercent =
    (elapsed / (snapshot.resolutionGoalMinutes * 60000)) * 100;
  const percent = Math.max(
    resolutionPercent,
    ticket.firstRespondedAt
      ? 0
      : (elapsed / (snapshot.firstResponseGoalMinutes * 60000)) * 100,
  );
  return {
    bucket: (percent >= 100
      ? "breached"
      : percent >= snapshot.warningPercent
        ? "warning"
        : "normal") as SlaBucket,
    percent,
    resolutionPercent,
  };
}
