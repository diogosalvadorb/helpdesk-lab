import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
  addWorkingMilliseconds,
  CalendarConfigurationError,
  workingMillisecondsBetween,
} from "@/lib/business-calendar";
import { prisma } from "@/lib/prisma";
import { snapshotCalendar, snapshotFromEvents } from "@/lib/ticket-sla";
export class SupportInputError extends Error {}
export const userSelection = {
  id: true,
  role: true,
  emailVerified: true,
  active: true,
  supportAgent: {
    select: {
      active: true,
      teamId: true,
      level: true,
      team: { select: { active: true } },
    },
  },
} satisfies Prisma.UserSelect;

export async function transaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 2
      )
        continue;
      if (error instanceof CalendarConfigurationError)
        throw new SupportInputError(error.message);
      throw error;
    }
  }
}
export const serviceTicketInclude = {
  events: {
    where: { type: { in: ["CREATED", "REOPENED"] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1,
    select: { metadata: true },
  },
  slaPauses: { where: { endedAt: null } },
  contract: {
    include: {
      slaPolicy: {
        include: { calendar: { include: { hours: true, holidays: true } } },
      },
    },
  },
} satisfies Prisma.TicketInclude;
export type ServiceTicket = Prisma.TicketGetPayload<{
  include: typeof serviceTicketInclude;
}>;

export async function resumePause(
  tx: Prisma.TransactionClient,
  ticket: ServiceTicket,
  now: Date,
  actorId: string,
) {
  if (!ticket.slaPauses.length) return {};
  if (ticket.slaPauses.length !== 1 || !ticket.contract)
    throw new SupportInputError(
      "As pausas deste chamado precisam de revisão administrativa.",
    );
  const pause = ticket.slaPauses[0];
  const snapshot = snapshotFromEvents(ticket.events);
  const calendar = snapshot
    ? snapshotCalendar(snapshot)
    : ticket.contract.slaPolicy.calendar;
  const elapsed = workingMillisecondsBetween(pause.startedAt, now, calendar);
  const deadlines = {
    resolutionDueAt: ticket.resolutionDueAt
      ? addWorkingMilliseconds(ticket.resolutionDueAt, elapsed, calendar)
      : null,
    firstResponseDueAt:
      ticket.firstResponseDueAt && !ticket.firstRespondedAt
        ? addWorkingMilliseconds(ticket.firstResponseDueAt, elapsed, calendar)
        : ticket.firstResponseDueAt,
  };
  await tx.ticketSlaPause.update({
    where: { id: pause.id },
    data: { endedAt: now },
  });
  await tx.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      actorId,
      type: "SLA_RESUMED",
      visibility: "PUBLIC",
      createdAt: now,
    },
  });
  return deadlines;
}
