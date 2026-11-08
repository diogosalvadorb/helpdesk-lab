import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  compliance,
  monthBounds,
  openStatuses,
  slaDisplay,
} from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import { measurementFromEvents } from "@/lib/ticket-sla";

import { getPublicKnowledgeSuggestions as getKnowledgeArticles } from "./knowledge";
import { readScopedNotifications } from "./notification-store";
import { getPortalContext } from "./portal-context";
export { getPublicKnowledgeSuggestions as getKnowledgeArticles } from "./knowledge";
export { getNotificationPage as getPortalNotifications } from "./notifications";

export async function getOpenTicketCount(statuses = openStatuses) {
  const { scope } = await getPortalContext();
  return prisma.ticket.count({
    where: { AND: [scope, { status: { in: statuses } }] },
  });
}

export async function markOwnNotificationRead(id: string) {
  const context = await getPortalContext();
  if (!context.company) return false;
  await readScopedNotifications(context.user.id, context.company.id, {
    operation: "one",
    id,
  });
  return true;
}

const ticketSelect = {
  id: true,
  number: true,
  subject: true,
  description: true,
  status: true,
  priority: true,
  level: true,
  createdAt: true,
  firstRespondedAt: true,
  firstResponseDueAt: true,
  resolutionDueAt: true,
  firstResponseMinutes: true,
  resolutionMinutes: true,
  department: { select: { name: true } },
  events: {
    where: { type: "RESOLVED" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1,
    select: { metadata: true },
  },
  slaTarget: {
    select: { firstResponseMinutes: true, resolutionMinutes: true },
  },
  slaPauses: { where: { endedAt: null }, select: { id: true } },
  messages: {
    where: { visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  },
} satisfies Prisma.TicketSelect;

export async function getPortalTickets(limit = 6, id?: string) {
  const { scope } = await getPortalContext();
  const now = new Date();
  const rows = await prisma.ticket.findMany({
    where: id ? { AND: [scope, { id }] } : scope,
    select: ticketSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(limit, 1), 50),
  });
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    messages: row.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    sla: slaDisplay(
      { ...row, resolutionMeasurement: measurementFromEvents(row.events) },
      now,
    ),
    events: undefined,
    firstRespondedAt: undefined,
    firstResponseDueAt: undefined,
    resolutionDueAt: undefined,
    slaTarget: undefined,
    slaPauses: undefined,
  }));
}
export type PortalTicket = Awaited<ReturnType<typeof getPortalTickets>>[number];

export async function getServiceAgreement() {
  const { company } = await getPortalContext();
  if (!company) return null;
  const now = new Date();
  return prisma.contract.findFirst({
    where: {
      companyId: company.id,
      status: "ACTIVE",
      startsAt: { lte: now },
      slaPolicy: { active: true },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: [{ startsAt: "desc" }, { id: "asc" }],
    select: {
      name: true,
      number: true,
      slaGoalPercent: true,
      slaPolicy: {
        select: {
          targets: {
            orderBy: { resolutionMinutes: "asc" },
            select: {
              priority: true,
              firstResponseMinutes: true,
              resolutionMinutes: true,
            },
          },
          calendar: {
            select: {
              timeZone: true,
              alwaysOpen: true,
              hours: {
                orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
                select: { weekday: true, startMinute: true, endMinute: true },
              },
              holidays: { select: { date: true } },
            },
          },
        },
      },
    },
  });
}
export async function getDashboard() {
  const context = await getPortalContext();
  if (!context.company) return null;
  const now = new Date();
  const months = monthBounds(now);
  const scoped = (
    filter: Prisma.TicketWhereInput,
  ): Prisma.TicketWhereInput => ({ AND: [context.scope, filter] });
  const [
    open,
    inProgress,
    resolved,
    previousResolved,
    completedRows,
    tickets,
    pending,
    articles,
    agreement,
  ] = await Promise.all([
    prisma.ticket.count({ where: scoped({ status: { in: openStatuses } }) }),
    prisma.ticket.count({
      where: scoped({ status: { in: ["IN_PROGRESS", "INVESTIGATING"] } }),
    }),
    prisma.ticket.count({
      where: scoped({
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: months.start, lt: months.end },
      }),
    }),
    prisma.ticket.count({
      where: scoped({
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: months.previous, lt: months.start },
      }),
    }),
    prisma.ticket.findMany({
      where: scoped({
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: months.start, lt: months.end },
        slaTargetId: { not: null },
        firstResponseMinutes: { not: null },
        resolutionMinutes: { not: null },
      }),
      select: {
        firstResponseMinutes: true,
        resolutionMinutes: true,
        events: {
          where: { type: "RESOLVED" },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { metadata: true },
        },
        slaTarget: {
          select: { firstResponseMinutes: true, resolutionMinutes: true },
        },
      },
    }),
    getPortalTickets(),
    prisma.ticket.findMany({
      where: scoped({ status: "WAITING_CUSTOMER" }),
      select: ticketSelect,
      take: 10,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
    getKnowledgeArticles(),
    getServiceAgreement(),
  ]);
  const pendingCount = await prisma.ticket.count({
    where: scoped({ status: "WAITING_CUSTOMER" }),
  });
  const measuredRows = completedRows.map((row) => ({
    ...row,
    resolutionMeasurement: measurementFromEvents(row.events),
  }));
  return {
    now: now.toISOString(),
    open,
    inProgress,
    resolved,
    previousResolved,
    compliance: compliance(measuredRows),
    slaSample: measuredRows.filter(
      (row) =>
        row.resolutionMeasurement &&
        row.resolutionMeasurement.firstResponseElapsedMs !== null,
    ).length,
    tickets,
    pendingCount,
    pending: pending.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      messages: row.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
      sla: slaDisplay(
        { ...row, resolutionMeasurement: measurementFromEvents(row.events) },
        now,
      ),
      events: undefined,
      firstRespondedAt: undefined,
      firstResponseDueAt: undefined,
      resolutionDueAt: undefined,
      slaTarget: undefined,
      slaPauses: undefined,
    })),
    articles: articles.slice(0, 3),
    agreement,
  };
}
