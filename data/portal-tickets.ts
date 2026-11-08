import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { slaDisplay } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import { measurementFromEvents } from "@/lib/ticket-sla";
import {
  type PortalTicketFilters,
  portalTicketFilters,
} from "@/lib/validations/portal";

import { getPortalContext } from "./portal-context";

export function filteredTicketWhere(
  filters: PortalTicketFilters,
): Prisma.TicketWhereInput {
  const number = filters.q.match(/^(?:#?CH-)?(\d+)$/i)?.[1];
  return {
    ...(filters.invalidPeriod ? { id: { in: [] } } : {}),
    ...(filters.q
      ? {
          OR: [
            { subject: { contains: filters.q, mode: "insensitive" } },
            ...(number &&
            Number.isSafeInteger(Number(number)) &&
            Number(number) <= 2147483647
              ? [{ number: Number(number) }]
              : []),
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.department ? { departmentId: filters.department } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from
              ? { gte: new Date(`${filters.from}T00:00:00Z`) }
              : {}),
            ...(filters.to
              ? { lte: new Date(`${filters.to}T23:59:59.999Z`) }
              : {}),
          },
        }
      : {}),
  };
}
export async function getTicketListing(
  raw: Record<string, string | string[] | undefined>,
) {
  const context = await getPortalContext();
  if (!context.company) return null;
  const filters = portalTicketFilters.parse(raw),
    where = { AND: [context.scope, filteredTicketWhere(filters)] };
  const orderBy: Prisma.TicketOrderByWithRelationInput[] =
    filters.sort === "oldest"
      ? [{ createdAt: "asc" }, { id: "asc" }]
      : filters.sort === "updated"
        ? [{ updatedAt: "desc" }, { id: "asc" }]
        : filters.sort === "priority"
          ? [{ priority: "desc" }, { createdAt: "desc" }, { id: "asc" }]
          : [{ createdAt: "desc" }, { id: "desc" }];
  const [rows, total, departments, groups] = await prisma.$transaction(
    [
      prisma.ticket.findMany({
        where,
        orderBy,
        take: 10,
        skip: (filters.page - 1) * 10,
        select: {
          id: true,
          number: true,
          subject: true,
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
          slaTarget: {
            select: { firstResponseMinutes: true, resolutionMinutes: true },
          },
          slaPauses: { where: { endedAt: null }, select: { id: true } },
          events: {
            where: { type: "RESOLVED" },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 1,
            select: { metadata: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
      prisma.department.findMany({
        where: {
          companyId: context.company.id,
          tickets: { some: context.scope },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.ticket.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        where,
        _count: { _all: true },
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
  const now = new Date();
  return {
    filters,
    total,
    departments,
    groups: groups.map((g) => ({
      status: g.status,
      count: typeof g._count === "object" ? (g._count._all ?? 0) : 0,
    })),
    rows: rows.map((row) => ({
      id: row.id,
      number: row.number,
      subject: row.subject,
      status: row.status,
      priority: row.priority,
      level: row.level,
      department: row.department,
      createdAt: row.createdAt.toISOString(),
      sla: slaDisplay(
        { ...row, resolutionMeasurement: measurementFromEvents(row.events) },
        now,
      ),
    })),
  };
}
