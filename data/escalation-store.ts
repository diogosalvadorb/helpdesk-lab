import "server-only";

import { createHash } from "node:crypto";

import type { Prisma, SupportLevel } from "@/generated/prisma/client";
import { openStatuses } from "@/lib/portal-format";
import { permittedLevels } from "@/lib/support-access";

import { optionalNotification } from "./optional-notification";
import { serviceTicketInclude, SupportInputError } from "./service-store";
export const lifecycleTicketInclude = {
  ...serviceTicketInclude,
  slaPauses: true,
  slaTarget: true,
  requester: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
          active: true,
          preferences: { select: { emailEnabled: true, ticketUpdates: true } },
        },
      },
    },
  },
  team: { select: { active: true } },
} satisfies Prisma.TicketInclude;
export type LifecycleTicket = Prisma.TicketGetPayload<{
  include: typeof lifecycleTicketInclude;
}>;
export const lifecycleHash = (...values: unknown[]) =>
  createHash("sha256").update(JSON.stringify(values)).digest("hex");
export const nextTicketVersion = (ticket: { updatedAt: Date }, now: Date) =>
  new Date(Math.max(now.getTime(), ticket.updatedAt.getTime() + 1));

export async function customerNotice(
  tx: Prisma.TransactionClient,
  ticket: LifecycleTicket,
  type: "TICKET_ESCALATED" | "TICKET_RESOLVED" | "TICKET_REPLIED",
  title: string,
) {
  if (ticket.requester.status !== "ACTIVE" || !ticket.requester.user.active)
    return;
  await optionalNotification(tx, {
    data: {
      ticketId: ticket.id,
      userId: ticket.requesterId,
      type,
      title,
      body: ticket.subject,
    },
  });
}

// Shared by the authenticated action and the private scheduler command. Callers
// authorize the source and destination before entering this transaction helper.
export async function transferTicket(
  tx: Prisma.TransactionClient,
  ticket: LifecycleTicket,
  input: {
    eventId: string;
    actorId: string | null;
    toLevel: SupportLevel;
    teamId: string;
    assigneeId?: string;
    reason: string;
    automatic: boolean;
    notifyCustomer: boolean;
    adminOverride: boolean;
    fingerprint?: string;
  },
  now: Date,
) {
  const team = await tx.supportTeam.findFirst({
    where: { id: input.teamId, active: true },
    select: { id: true },
  });
  if (!team) throw new SupportInputError("A equipe de destino não está ativa.");
  if (input.assigneeId) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`agent:${input.assigneeId}`}, 0))::text`;
    const agent = await tx.supportAgent.findFirst({
      where: {
        userId: input.assigneeId,
        teamId: team.id,
        active: true,
        user: { role: "AGENT", emailVerified: true, active: true },
      },
      select: { level: true, maxActiveTickets: true },
    });
    if (!agent || !permittedLevels(agent.level).includes(input.toLevel))
      throw new SupportInputError("Responsável incompatível com o destino.");
    if (
      (await tx.ticket.count({
        where: {
          assigneeId: input.assigneeId,
          status: { in: openStatuses },
          id: { not: ticket.id },
        },
      })) >= agent.maxActiveTickets
    )
      throw new SupportInputError(
        "O responsável de destino atingiu a capacidade.",
      );
  }
  await tx.ticketEscalation.create({
    data: {
      id: input.eventId,
      ticketId: ticket.id,
      actorId: input.actorId,
      fromLevel: ticket.level,
      toLevel: input.toLevel,
      teamId: team.id,
      assigneeId: input.assigneeId || null,
      reason: input.reason,
      automatic: input.automatic,
      notifyCustomer: input.notifyCustomer,
      createdAt: now,
    },
  });
  await tx.ticket.update({
    where: { id: ticket.id },
    data: {
      level: input.toLevel,
      teamId: team.id,
      assigneeId: input.assigneeId || null,
      updatedAt: nextTicketVersion(ticket, now),
    },
  });
  await tx.ticketEvent.create({
    data: {
      id: input.eventId,
      ticketId: ticket.id,
      actorId: input.actorId,
      type: "ESCALATED",
      visibility: input.notifyCustomer ? "PUBLIC" : "INTERNAL",
      createdAt: nextTicketVersion(ticket, now),
      metadata: {
        fromLevel: ticket.level,
        toLevel: input.toLevel,
        teamId: team.id,
        reason: input.reason,
        automatic: input.automatic,
        adminOverride: input.adminOverride,
        fingerprint: input.fingerprint || "automatic",
      },
    },
  });
  if (input.notifyCustomer)
    await customerNotice(
      tx,
      ticket,
      "TICKET_ESCALATED",
      "Seu chamado foi encaminhado para outro nível",
    );
  if (input.assigneeId && input.assigneeId !== input.actorId)
    await optionalNotification(tx, {
      data: {
        ticketId: ticket.id,
        userId: input.assigneeId,
        type: "TICKET_ASSIGNED",
        title: "Chamado escalonado para você",
        body: ticket.subject,
      },
    });
}
