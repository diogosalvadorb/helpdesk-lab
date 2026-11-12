import "server-only";

import { openStatuses } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import { inspectSla, snapshotFromEvents } from "@/lib/ticket-sla";

import {
  lifecycleHash,
  lifecycleTicketInclude,
  transferTicket,
} from "./escalation-store";
import { transaction as serviceTransaction } from "./service-store";
export async function evaluateSlaBatch({
  limit = 100,
  after,
  companyId,
  dryRun = false,
  now = new Date(),
}: {
  limit?: number;
  after?: string;
  companyId?: string;
  dryRun?: boolean;
  now?: Date;
} = {}) {
  const ids = await prisma.ticket.findMany({
    where: {
      status: { in: openStatuses },
      company: { status: "ACTIVE" },
      ...(companyId ? { companyId } : {}),
      ...(after ? { id: { gt: after } } : {}),
    },
    orderBy: { id: "asc" },
    take: Math.min(200, Math.max(1, Math.trunc(limit))),
    select: { id: true },
  });
  const result = {
    examined: 0,
    notifications: 0,
    escalated: 0,
    skipped: 0,
    errors: 0,
    nextCursor: ids.length ? ids[ids.length - 1].id : null,
  };
  for (const row of ids) {
    try {
      const outcome = await serviceTransaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${row.id}, 0))::text`;
        const ticket = await tx.ticket.findFirst({
          where: {
            id: row.id,
            status: { in: openStatuses },
            company: { status: "ACTIVE" },
            ...(companyId ? { companyId } : {}),
          },
          include: lifecycleTicketInclude,
        });
        if (!ticket) return { notifications: 0, escalated: 0, skipped: 1 };
        const snapshot = snapshotFromEvents(ticket.events);
        const inspection = inspectSla(ticket, snapshot, now);
        if (
          (!snapshot && inspection.bucket !== "breached") ||
          inspection.bucket === "paused" ||
          inspection.bucket === "noTarget"
        )
          return { notifications: 0, escalated: 0, skipped: 1 };
        let notifications = 0,
          escalated = 0;
        if (
          inspection.bucket === "warning" ||
          inspection.bucket === "breached"
        ) {
          const kind =
            inspection.bucket === "breached"
              ? ("SLA_BREACHED" as const)
              : ("SLA_WARNING" as const);
          const recipients = await tx.user.findMany({
            where: {
              emailVerified: true,
              active: true,
              AND: [
                {
                  OR: [
                    { preferences: null },
                    { preferences: { slaAlerts: true } },
                  ],
                },
              ],
              OR: [
                { role: "ADMIN" },
                ...(ticket.assigneeId
                  ? [
                      {
                        id: ticket.assigneeId,
                        role: "AGENT" as const,
                        supportAgent: {
                          active: true,
                          teamId: ticket.teamId || "",
                          team: { active: true },
                          level: {
                            in: [
                              ticket.level,
                              ...(["N1", "N2", "N3"] as const).filter(
                                (level) =>
                                  ["N1", "N2", "N3"].indexOf(level) >
                                  ["N1", "N2", "N3"].indexOf(ticket.level),
                              ),
                            ],
                          },
                        },
                      },
                    ]
                  : []),
              ],
            },
            select: { id: true },
          });
          for (const recipient of recipients) {
            const notificationId = `sla-${lifecycleHash(ticket.id, snapshot?.cycleStartedAt ?? ticket.createdAt.toISOString(), kind, recipient.id)}`;
            if (
              !(await tx.notification.findUnique({
                where: { id: notificationId },
                select: { id: true },
              }))
            ) {
              notifications++;
              if (!dryRun)
                await tx.notification.create({
                  data: {
                    id: notificationId,
                    userId: recipient.id,
                    ticketId: ticket.id,
                    type: kind,
                    title:
                      kind === "SLA_WARNING"
                        ? "Chamado próximo do vencimento"
                        : "Prazo de SLA excedido",
                    body: ticket.subject,
                    createdAt: now,
                  },
                });
            }
          }
        }
        const rule = snapshot?.rules.find(
          (rule) =>
            rule.fromLevel === ticket.level &&
            inspection.resolutionPercent !== null &&
            inspection.resolutionPercent >= rule.resolutionPercent &&
            ["N1", "N2", "N3"].indexOf(rule.toLevel) ===
              ["N1", "N2", "N3"].indexOf(rule.fromLevel) + 1,
        );
        if (
          rule &&
          ticket.teamId &&
          ticket.team?.active &&
          ticket.contract?.slaPolicy.active
        ) {
          const stillActive = await tx.slaEscalationRule.findFirst({
            where: {
              policyId: ticket.contract.slaPolicyId,
              active: true,
              fromLevel: rule.fromLevel,
              toLevel: rule.toLevel,
              resolutionPercent: rule.resolutionPercent,
            },
            select: { id: true },
          });
          const available = await tx.supportAgent.findFirst({
            where: {
              teamId: ticket.teamId,
              active: true,
              user: { role: "AGENT", emailVerified: true, active: true },
              level: {
                in: (["N1", "N2", "N3"] as const).filter(
                  (level) =>
                    ["N1", "N2", "N3"].indexOf(level) >=
                    ["N1", "N2", "N3"].indexOf(rule.toLevel),
                ),
              },
            },
            select: { userId: true },
          });
          const eventId = `auto-${lifecycleHash(ticket.id, snapshot!.cycleStartedAt, rule.fromLevel, rule.toLevel, rule.resolutionPercent)}`;
          if (
            stillActive &&
            available &&
            !(await tx.ticketEscalation.findUnique({
              where: { id: eventId },
              select: { id: true },
            }))
          ) {
            escalated = 1;
            if (!dryRun)
              await transferTicket(
                tx,
                ticket,
                {
                  eventId,
                  actorId: null,
                  toLevel: rule.toLevel,
                  teamId: ticket.teamId,
                  reason: "Regra automática de consumo do SLA de resolução.",
                  automatic: true,
                  notifyCustomer: true,
                  adminOverride: false,
                },
                now,
              );
          }
        }
        return { notifications, escalated, skipped: 0 };
      });
      result.examined++;
      result.notifications += outcome.notifications;
      result.escalated += outcome.escalated;
      result.skipped += outcome.skipped;
    } catch {
      result.errors++;
    }
  }
  return result;
}
