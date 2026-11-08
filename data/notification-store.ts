import "server-only";

import type { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { ticketScope } from "@/lib/portal-access";
import { permittedLevels } from "@/lib/support-access";
import {
  type notificationFilters,
  notificationReadSchema,
} from "@/lib/validations/portal";

import { SupportInputError, transaction, userSelection } from "./service-store";

export async function notificationAccess(
  tx: Prisma.TransactionClient,
  userId: string,
  companyId: string,
) {
  const [user, company, member] = await Promise.all([
    tx.user.findUnique({ where: { id: userId }, select: userSelection }),
    tx.company.findFirst({
      where: { id: companyId, status: "ACTIVE" },
      select: { id: true },
    }),
    tx.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { role: true, status: true },
    }),
  ]);
  if (!user?.active || !user.emailVerified || !company) return null;
  const agent =
    user.role === "AGENT" &&
    user.supportAgent?.active &&
    user.supportAgent.team.active
      ? user.supportAgent
      : null;
  const scope = ticketScope({
    userId,
    role: user.role,
    companyId,
    membershipRole: member?.status === "ACTIVE" ? member.role : undefined,
    teamId: agent?.teamId,
    agentLevel: agent?.level,
  });
  const where: Prisma.NotificationWhereInput = {
    userId,
    OR: [
      { ticket: { AND: [scope, { companyId }] }, ticketId: { not: null } },
      ...(member?.status === "ACTIVE"
        ? [{ ticketId: null, companyId, type: "MEMBERSHIP_APPROVED" as const }]
        : []),
    ],
  };
  return { where, user, agent };
}
const titles: Record<string, string> = {
  TICKET_CREATED: "Chamado registrado",
  TICKET_REPLIED: "Nova resposta no chamado",
  CUSTOMER_REPLY_REQUIRED: "Seu chamado precisa de uma informação",
  TICKET_ASSIGNED: "Responsável atualizado",
  TICKET_ESCALATED: "Chamado encaminhado",
  TICKET_RESOLVED: "Seu chamado foi resolvido",
  SLA_WARNING: "Chamado próximo do prazo",
  SLA_BREACHED: "Prazo de atendimento excedido",
  MEMBERSHIP_APPROVED: "Acesso à empresa aprovado",
};
export async function listScopedNotifications(
  userId: string,
  companyId: string,
  filters: z.infer<typeof notificationFilters>,
  take = 10,
) {
  return transaction(async (tx) => {
    const access = await notificationAccess(tx, userId, companyId);
    if (!access)
      return {
        unread: 0,
        total: 0,
        items: [],
        companyId,
        asOf: new Date().toISOString(),
        filters,
      };
    const where: Prisma.NotificationWhereInput = {
      AND: [
        access.where,
        ...(filters.read === "all"
          ? []
          : [{ readAt: filters.read === "unread" ? null : { not: null } }]),
      ],
    };
    const [rows, total, unread] = await Promise.all([
      tx.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * take,
        take,
        select: {
          id: true,
          type: true,
          readAt: true,
          createdAt: true,
          ticket: {
            select: {
              id: true,
              number: true,
              subject: true,
              teamId: true,
              level: true,
            },
          },
          company: { select: { name: true } },
        },
      }),
      tx.notification.count({ where }),
      tx.notification.count({
        where: { AND: [access.where, { readAt: null }] },
      }),
    ]);
    return {
      filters,
      total,
      unread,
      companyId,
      asOf: new Date().toISOString(),
      items: rows.map((row) => {
        const operation =
          access.user.role === "ADMIN" ||
          (access.agent &&
            row.ticket?.teamId === access.agent.teamId &&
            permittedLevels(access.agent.level).includes(row.ticket.level));
        return {
          id: row.id,
          title: titles[row.type] || "Atualização do atendimento",
          body: row.ticket
            ? `${row.ticket.subject} · #CH-${row.ticket.number}`
            : row.company?.name || "Seu acesso foi atualizado.",
          href: row.ticket
            ? `${operation ? "/operacao/chamados" : "/chamados"}/${row.ticket.id}`
            : "/dashboard",
          readAt: row.readAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
        };
      }),
    };
  });
}
export async function readScopedNotifications(
  userId: string,
  companyId: string,
  raw: z.infer<typeof notificationReadSchema>,
) {
  const input = notificationReadSchema.parse(raw);
  return transaction(async (tx) => {
    const access = await notificationAccess(tx, userId, companyId);
    if (!access)
      throw new SupportInputError(
        "O contexto de acesso mudou. Recarregue a página.",
      );
    if (input.operation === "all" && input.companyId !== companyId)
      throw new SupportInputError(
        "A empresa selecionada mudou. Recarregue as notificações.",
      );
    const before = input.operation === "all" ? new Date(input.before) : null;
    if (before && before.getTime() > Date.now() + 5000)
      throw new SupportInputError("Data de leitura inválida.");
    const result = await tx.notification.updateMany({
      where: {
        AND: [
          access.where,
          { readAt: null },
          input.operation === "one"
            ? { id: input.id }
            : { createdAt: { lte: before! } },
        ],
      },
      data: { readAt: new Date() },
    });
    if (input.operation === "one" && !result.count) {
      const previous = await tx.notification.count({
        where: { AND: [access.where, { id: input.id }] },
      });
      if (!previous)
        throw new SupportInputError("Notificação indisponível nesta empresa.");
    }
    return result.count;
  });
}
