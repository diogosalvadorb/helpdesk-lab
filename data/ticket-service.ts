import "server-only";

import { createHash } from "node:crypto";

import { Prisma, type TicketStatus } from "@/generated/prisma/client";
import { openStatuses, slaDisplay, statusLabels } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import {
  operationScope,
  permittedLevels,
  supportLevels,
} from "@/lib/support-access";
import { measurementFromEvents, snapshotFromEvents } from "@/lib/ticket-sla";
import {
  queueFilterSchema,
  type ReplyInput,
  replySchema,
  type ServiceActionInput,
  serviceActionSchema,
} from "@/lib/validations/ticket-service";

import { getAuthenticatedUser } from "./authenticated-user";
import { getPortalContext } from "./portal-context";
import {
  resumePause,
  serviceTicketInclude,
  SupportInputError,
  transaction,
  userSelection,
} from "./service-store";
export {
  resumePause,
  serviceTicketInclude,
  transaction as serviceTransaction,
  userSelection as serviceUserSelection,
  SupportInputError,
};

export async function getOperationContext() {
  const user = await getAuthenticatedUser();
  const scope = operationScope(user);
  return scope ? { user, scope } : null;
}

const hash = (parts: unknown[]) =>
  createHash("sha256").update(JSON.stringify(parts)).digest("hex");
const metadataObject = (value: Prisma.JsonValue | null) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export async function persistTicketReply(raw: ReplyInput) {
  const input = replySchema.parse(raw);
  const context = await getPortalContext();
  const messageId = `reply-${hash([context.user.id, input.ticketId, input.submissionKey])}`;
  return transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.ticketId}, 0))::text`;
    const user = await tx.user.findUnique({
      where: { id: context.user.id },
      select: userSelection,
    });
    if (!user?.emailVerified)
      throw new SupportInputError("Acesso indisponível. Entre novamente.");
    if (user.role !== context.user.role)
      throw new SupportInputError(
        "Suas permissões mudaram. Recarregue a página.",
      );
    let scope: Prisma.TicketWhereInput;
    if (input.audience === "operation") {
      const authorized = operationScope(user);
      if (!authorized)
        throw new SupportInputError(
          "Você não tem permissão para atender este chamado.",
        );
      scope = authorized;
    } else {
      if (
        input.visibility !== "PUBLIC" ||
        !context.company ||
        context.company.id !== input.companyId
      )
        throw new SupportInputError(
          "A empresa selecionada mudou ou a resposta não é permitida.",
        );
      const member = await tx.companyMember.findUnique({
        where: {
          companyId_userId: { companyId: input.companyId, userId: user.id },
        },
        select: { status: true, role: true },
      });
      if (!member || member.status !== "ACTIVE")
        throw new SupportInputError(
          "Seu vínculo com esta empresa não está ativo.",
        );
      scope = {
        AND: [
          context.scope,
          {
            companyId: input.companyId,
            company: { status: "ACTIVE" },
            ...(member.role === "REQUESTER" ? { requesterId: user.id } : {}),
          },
          ...(user.role === "AGENT"
            ? [
                {
                  OR: [
                    operationScope(user) ?? { id: { in: [] } },
                    {
                      requesterId: user.id,
                      requester: { status: "ACTIVE" as const },
                    },
                  ],
                },
              ]
            : []),
        ],
      };
    }
    const ticket = await tx.ticket.findFirst({
      where: {
        AND: [scope, { id: input.ticketId, companyId: input.companyId }],
      },
      include: serviceTicketInclude,
    });
    if (!ticket)
      throw new SupportInputError("Chamado indisponível para esta conta.");
    const previous = await tx.ticketMessage.findUnique({
      where: { id: messageId },
    });
    if (previous) {
      if (
        previous.body !== input.body ||
        previous.visibility !== input.visibility
      )
        throw new SupportInputError(
          "Esta submissão já foi usada com outros dados. Recarregue o formulário.",
        );
      return {
        messageId,
        created: false,
        email: null as string | null,
        number: ticket.number,
        ticketId: ticket.id,
      };
    }
    if (["RESOLVED", "CLOSED", "CANCELED"].includes(ticket.status))
      throw new SupportInputError("Este chamado não aceita novas mensagens.");
    const now = new Date();
    const supportReply =
      input.audience === "operation" && input.visibility === "PUBLIC";
    const publicReply = input.visibility === "PUBLIC";
    const nextStatus =
      publicReply && ticket.status === "WAITING_CUSTOMER"
        ? "IN_PROGRESS"
        : supportReply && ticket.status === "OPEN"
          ? "IN_PROGRESS"
          : ticket.status;
    const deadlines =
      publicReply && ticket.status === "WAITING_CUSTOMER"
        ? await resumePause(tx, ticket, now, user.id)
        : {};
    await tx.ticketMessage.create({
      data: {
        id: messageId,
        ticketId: ticket.id,
        authorId: user.id,
        body: input.body,
        visibility: input.visibility,
        createdAt: now,
      },
    });
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: nextStatus,
        ...deadlines,
        ...(supportReply &&
        user.id !== ticket.requesterId &&
        !ticket.firstRespondedAt
          ? { firstRespondedAt: now }
          : {}),
        updatedAt: new Date(
          Math.max(now.getTime(), ticket.updatedAt.getTime() + 1),
        ),
      },
    });
    if (nextStatus !== ticket.status)
      await tx.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          actorId: user.id,
          type: "STATUS_CHANGED",
          visibility: "PUBLIC",
          metadata: { from: ticket.status, to: nextStatus },
        },
      });
    let email: string | null = null;
    if (publicReply) {
      const recipientId = supportReply ? ticket.requesterId : ticket.assigneeId;
      if (recipientId && recipientId !== user.id) {
        const recipient = await tx.user.findUnique({
          where: { id: recipientId },
          select: {
            ...userSelection,
            email: true,
            emailVerified: true,
            preferences: { select: { emailEnabled: true } },
          },
        });
        const authorizedRecipient = supportReply
          ? Boolean(
              await tx.companyMember.findFirst({
                where: {
                  companyId: ticket.companyId,
                  userId: recipientId,
                  status: "ACTIVE",
                },
                select: { userId: true },
              }),
            )
          : Boolean(
              recipient &&
              (recipient.role === "ADMIN" ||
                (recipient.role === "AGENT" &&
                  recipient.supportAgent?.active &&
                  recipient.supportAgent.team.active &&
                  recipient.supportAgent.teamId === ticket.teamId &&
                  permittedLevels(recipient.supportAgent.level).includes(
                    ticket.level,
                  ))),
            );
        if (authorizedRecipient)
          await tx.notification.create({
            data: {
              ticketId: ticket.id,
              userId: recipientId,
              type: "TICKET_REPLIED",
              title: "Nova resposta no chamado",
              body: ticket.subject,
            },
          });
        if (
          authorizedRecipient &&
          recipient?.emailVerified &&
          recipient.preferences?.emailEnabled !== false
        )
          email = recipient.email;
      }
    }
    return {
      messageId,
      created: true,
      email,
      number: ticket.number,
      ticketId: ticket.id,
    };
  });
}

export async function persistServiceAction(raw: ServiceActionInput) {
  const input = serviceActionSchema.parse(raw);
  const authenticated = await getAuthenticatedUser();
  const eventId = `service-${hash([authenticated.id, input.ticketId, input.submissionKey])}`;
  const fingerprint = hash([
    input.operation,
    input.assigneeId,
    input.teamId,
    input.reason,
  ]);
  return transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.ticketId}, 0))::text`;
    const user = await tx.user.findUnique({
      where: { id: authenticated.id },
      select: userSelection,
    });
    const scope = user?.emailVerified ? operationScope(user) : null;
    if (!user || !scope)
      throw new SupportInputError("Você não tem permissão para esta operação.");
    const ticket = await tx.ticket.findFirst({
      where: { AND: [scope, { id: input.ticketId }] },
      include: serviceTicketInclude,
    });
    if (!ticket)
      throw new SupportInputError("Chamado indisponível para esta conta.");
    const previous = await tx.ticketEvent.findUnique({
      where: { id: eventId },
      select: { metadata: true },
    });
    if (previous) {
      if (metadataObject(previous.metadata).fingerprint !== fingerprint)
        throw new SupportInputError(
          "Esta submissão já foi usada com outros dados.",
        );
      return { ticketId: ticket.id };
    }
    if (ticket.updatedAt.toISOString() !== input.expectedUpdatedAt)
      throw new SupportInputError(
        "O chamado foi atualizado por outra pessoa. Recarregue antes de continuar.",
      );
    if (!openStatuses.includes(ticket.status))
      throw new SupportInputError(
        "Este chamado não está ativo para esta operação.",
      );
    const now = new Date();
    const updates: Prisma.TicketUncheckedUpdateInput = {
      updatedAt: new Date(
        Math.max(now.getTime(), ticket.updatedAt.getTime() + 1),
      ),
    };
    let eventType: "ASSIGNED" | "STATUS_CHANGED" = "ASSIGNED";
    let eventVisibility: "PUBLIC" | "INTERNAL" = "INTERNAL";
    const details: Record<string, string> = {
      fingerprint,
      operation: input.operation,
    };
    if (input.operation === "route") {
      if (user.role !== "ADMIN" || ticket.teamId !== null)
        throw new SupportInputError(
          "Somente a triagem administrativa pode encaminhar chamados sem equipe.",
        );
      const team = await tx.supportTeam.findFirst({
        where: { id: input.teamId, active: true },
        select: { id: true },
      });
      if (!team) throw new SupportInputError("Equipe indisponível.");
      updates.teamId = team.id;
      updates.assigneeId = null;
      details.teamId = team.id;
    } else if (input.operation === "claim" || input.operation === "assign") {
      const assigneeId =
        input.operation === "claim" ? user.id : input.assigneeId!;
      if (!ticket.teamId)
        throw new SupportInputError(
          "Encaminhe o chamado para uma equipe antes de atribuir um responsável.",
        );
      if (
        input.operation === "claim" &&
        ticket.assigneeId &&
        ticket.assigneeId !== user.id
      )
        throw new SupportInputError("Outra pessoa já assumiu este chamado.");
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`agent:${assigneeId}`}, 0))::text`;
      const agent = await tx.supportAgent.findFirst({
        where: {
          userId: assigneeId,
          teamId: ticket.teamId,
          active: true,
          team: { active: true },
          user: { role: "AGENT", emailVerified: true },
        },
        select: { userId: true, level: true, maxActiveTickets: true },
      });
      if (!agent || !permittedLevels(agent.level).includes(ticket.level))
        throw new SupportInputError(
          "Responsável incompatível com a equipe ou o nível do chamado.",
        );
      const active = await tx.ticket.count({
        where: {
          assigneeId,
          status: { in: openStatuses },
          id: { not: ticket.id },
        },
      });
      if (active >= agent.maxActiveTickets)
        throw new SupportInputError(
          "O responsável atingiu a capacidade de chamados ativos.",
        );
      updates.assigneeId = assigneeId;
      if (ticket.status === "OPEN") updates.status = "IN_PROGRESS";
      details.assigneeId = assigneeId;
      if (assigneeId !== user.id && assigneeId !== ticket.assigneeId)
        await tx.notification.create({
          data: {
            ticketId: ticket.id,
            userId: assigneeId,
            type: "TICKET_ASSIGNED",
            title: "Chamado atribuído a você",
            body: ticket.subject,
          },
        });
    } else {
      if (user.role !== "ADMIN" && ticket.assigneeId !== user.id)
        throw new SupportInputError(
          "Somente o responsável ou administrador pode alterar este estado.",
        );
      if (input.operation === "start") {
        if (ticket.status !== "OPEN")
          throw new SupportInputError(
            "Somente chamados abertos podem iniciar atendimento.",
          );
        updates.status = "IN_PROGRESS";
      } else {
        if (!["IN_PROGRESS", "INVESTIGATING"].includes(ticket.status))
          throw new SupportInputError(
            "O chamado precisa estar em atendimento para aguardar o cliente.",
          );
        if (ticket.slaPauses.length)
          throw new SupportInputError(
            "Já existe uma pausa aberta neste chamado.",
          );
        updates.status = "WAITING_CUSTOMER";
        details.reason = input.reason!;
        if (
          (snapshotFromEvents(ticket.events)?.pauseWhileWaitingCustomer ??
            ticket.contract?.slaPolicy.pauseWhileWaitingCustomer) &&
          (ticket.firstResponseDueAt || ticket.resolutionDueAt)
        ) {
          await tx.ticketSlaPause.create({
            data: {
              ticketId: ticket.id,
              reason: input.reason!,
              startedAt: now,
            },
          });
          await tx.ticketEvent.create({
            data: {
              ticketId: ticket.id,
              actorId: user.id,
              type: "SLA_PAUSED",
              visibility: "PUBLIC",
              createdAt: now,
            },
          });
        }
        if (ticket.requesterId !== user.id)
          await tx.notification.create({
            data: {
              ticketId: ticket.id,
              userId: ticket.requesterId,
              type: "CUSTOMER_REPLY_REQUIRED",
              title: "Aguardamos sua resposta",
              body: input.reason,
            },
          });
      }
      eventType = "STATUS_CHANGED";
      eventVisibility = "PUBLIC";
      details.from = ticket.status;
      details.to = updates.status as string;
    }
    await tx.ticket.update({ where: { id: ticket.id }, data: updates });
    if (
      eventType === "ASSIGNED" &&
      updates.status &&
      updates.status !== ticket.status
    )
      await tx.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          actorId: user.id,
          type: "STATUS_CHANGED",
          visibility: "PUBLIC",
          metadata: { from: ticket.status, to: updates.status as string },
          createdAt: now,
        },
      });
    await tx.ticketEvent.create({
      data: {
        id: eventId,
        ticketId: ticket.id,
        actorId: user.id,
        type: eventType,
        visibility: eventVisibility,
        metadata: details,
        createdAt: now,
      },
    });
    return { ticketId: ticket.id };
  });
}

const eventLabels = {
  CREATED: "Chamado aberto",
  STATUS_CHANGED: "Estado atualizado",
  PRIORITY_CHANGED: "Prioridade atualizada",
  ASSIGNED: "Responsável ou equipe atualizados",
  DEPARTMENT_CHANGED: "Departamento atualizado",
  ESCALATED: "Chamado escalonado",
  SLA_PAUSED: "Relógio de SLA pausado",
  SLA_RESUMED: "Relógio de SLA retomado",
  RESOLVED: "Chamado resolvido",
  REOPENED: "Chamado reaberto",
  CLOSED: "Chamado encerrado",
};

export async function getTicketConversation(
  id: string,
  mode: "portal" | "operation",
  page = 1,
  eventPage = 1,
) {
  const portal = mode === "portal" ? await getPortalContext() : null;
  const operation = mode === "operation" ? await getOperationContext() : null;
  const scope = portal?.scope ?? operation?.scope;
  if (!scope) return null;
  const ticket = await prisma.ticket.findFirst({
    where: { AND: [scope, { id }] },
    select: {
      id: true,
      number: true,
      companyId: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      level: true,
      teamId: true,
      assigneeId: true,
      updatedAt: true,
      createdAt: true,
      firstRespondedAt: true,
      firstResponseDueAt: true,
      resolutionDueAt: true,
      firstResponseMinutes: true,
      resolutionMinutes: true,
      slaTarget: {
        select: { firstResponseMinutes: true, resolutionMinutes: true },
      },
      slaPauses: { where: { endedAt: null }, select: { id: true } },
      company: { select: { name: true } },
      department: { select: { name: true } },
      category: { select: { name: true } },
      requester: { select: { userId: true, user: { select: { name: true } } } },
      events: {
        where: { type: "RESOLVED" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { metadata: true },
      },
      rating: { select: { score: true } },
      assignee: { select: { user: { select: { name: true } } } },
      team: { select: { name: true } },
    },
  });
  if (!ticket) return null;
  const p = Math.max(
    1,
    Math.min(1000, Number.isFinite(page) ? Math.trunc(page) : 1),
  );
  const ep = Math.max(
    1,
    Math.min(1000, Number.isFinite(eventPage) ? Math.trunc(eventPage) : 1),
  );
  const visibility = mode === "portal" ? { visibility: "PUBLIC" as const } : {};
  const [messages, totalMessages, events, totalEvents, membership] =
    await Promise.all([
      prisma.ticketMessage.findMany({
        where: { ticketId: id, ...visibility },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (p - 1) * 20,
        take: 20,
        select: {
          id: true,
          body: true,
          visibility: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      }),
      prisma.ticketMessage.count({ where: { ticketId: id, ...visibility } }),
      prisma.ticketEvent.findMany({
        where: { ticketId: id, ...visibility },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (ep - 1) * 20,
        take: 20,
        select: { id: true, type: true, createdAt: true, metadata: true },
      }),
      prisma.ticketEvent.count({ where: { ticketId: id, ...visibility } }),
      portal
        ? prisma.companyMember.findUnique({
            where: {
              companyId_userId: {
                companyId: ticket.companyId,
                userId: portal.user.id,
              },
            },
            select: { status: true, role: true },
          })
        : null,
    ]);
  const canReply =
    mode === "operation" ||
    (membership?.status === "ACTIVE" &&
      (membership.role !== "REQUESTER" ||
        ticket.requester.userId === portal?.user.id));
  return {
    id: ticket.id,
    number: ticket.number,
    companyId: ticket.companyId,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    level: ticket.level,
    teamId: ticket.teamId,
    assigneeId: ticket.assigneeId,
    updatedAt: ticket.updatedAt.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
    company: ticket.company.name,
    department: ticket.department.name,
    category: ticket.category.name,
    requester: ticket.requester.user.name,
    assignee: ticket.assignee?.user.name ?? "Não atribuído",
    team: ticket.team?.name ?? "Aguardando triagem",
    firstResponseDueAt: ticket.firstResponseDueAt?.toISOString() ?? null,
    resolutionDueAt: ticket.resolutionDueAt?.toISOString() ?? null,
    firstRespondedAt: ticket.firstRespondedAt?.toISOString() ?? null,
    sla: slaDisplay(
      {
        ...ticket,
        resolutionMeasurement: measurementFromEvents(ticket.events),
      },
      new Date(),
    ),
    isRequester: Boolean(
      portal &&
      membership?.status === "ACTIVE" &&
      portal.user.id === ticket.requester.userId,
    ),
    ratingScore: ticket.rating?.score ?? null,
    canReply: Boolean(
      canReply && !["RESOLVED", "CLOSED", "CANCELED"].includes(ticket.status),
    ),
    mode,
    page: p,
    eventPage: ep,
    totalMessages,
    totalEvents,
    messages: messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
    // No arbitrary metadata, operation keys, private reasons or fingerprints are serialized.
    events: events.map((event) => {
      const to = metadataObject(event.metadata).to;
      return {
        id: event.id,
        createdAt: event.createdAt.toISOString(),
        label:
          event.type === "STATUS_CHANGED" &&
          typeof to === "string" &&
          to in statusLabels
            ? `Estado: ${statusLabels[to as TicketStatus]}`
            : eventLabels[event.type],
      };
    }),
  };
}
export type TicketConversationData = NonNullable<
  Awaited<ReturnType<typeof getTicketConversation>>
>;

export async function getServiceOptions(ticketId: string) {
  const context = await getOperationContext();
  if (!context) return null;
  const ticket = await prisma.ticket.findFirst({
    where: { AND: [context.scope, { id: ticketId }] },
    select: { teamId: true, level: true },
  });
  if (!ticket) return null;
  const [teams, agents] = await Promise.all([
    context.user.role === "ADMIN" && !ticket.teamId
      ? prisma.supportTeam.findMany({
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [],
    ticket.teamId
      ? prisma.supportAgent.findMany({
          where: {
            active: true,
            teamId: ticket.teamId,
            team: { active: true },
            user: { role: "AGENT", emailVerified: true },
          },
          select: {
            userId: true,
            level: true,
            user: { select: { name: true } },
          },
          orderBy: { userId: "asc" },
        })
      : [],
  ]);
  return {
    teams,
    agents: agents
      .filter((agent) => permittedLevels(agent.level).includes(ticket.level))
      .map((agent) => ({ id: agent.userId, name: agent.user.name })),
    userId: context.user.id,
    admin: context.user.role === "ADMIN",
  };
}

export async function getServiceQueue(
  raw: Record<string, string | string[] | undefined>,
) {
  const context = await getOperationContext();
  if (!context) return null;
  const filters = queueFilterSchema.parse(raw);
  const searchNumber =
    /^\d+$/.test(filters.q) && Number(filters.q) <= 2147483647
      ? Number(filters.q)
      : null;
  const where: Prisma.TicketWhereInput = {
    AND: [
      context.scope,
      {
        status: filters.status ?? { in: openStatuses },
        ...(filters.level ? { level: filters.level } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.company ? { companyId: filters.company } : {}),
        ...(filters.triage === "true"
          ? { teamId: null }
          : { teamId: filters.team || { not: null } }),
        ...(filters.q
          ? {
              OR: [
                { subject: { contains: filters.q, mode: "insensitive" } },
                ...(searchNumber !== null ? [{ number: searchNumber }] : []),
              ],
            }
          : {}),
      },
    ],
  };
  const [tickets, total, groups, teams, companies, triageCount] =
    await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }, { id: "asc" }],
        skip: (filters.page - 1) * 20,
        take: 20,
        select: {
          id: true,
          number: true,
          subject: true,
          level: true,
          status: true,
          priority: true,
          company: { select: { name: true } },
          department: { select: { name: true } },
          assignee: { select: { user: { select: { name: true } } } },
        },
      }),
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({ by: ["level"], where, _count: true }),
      context.user.role === "ADMIN"
        ? prisma.supportTeam.findMany({
            where: { active: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          })
        : [],
      prisma.company.findMany({
        where: { status: "ACTIVE", tickets: { some: context.scope } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      context.user.role === "ADMIN"
        ? prisma.ticket.count({
            where: {
              AND: [
                context.scope,
                { teamId: null, status: { in: openStatuses } },
              ],
            },
          })
        : 0,
    ]);
  return {
    tickets,
    total,
    groups,
    teams,
    companies,
    filters,
    admin: context.user.role === "ADMIN",
    triageCount,
    levels:
      context.user.role === "ADMIN"
        ? supportLevels
        : permittedLevels(context.user.supportAgent!.level),
  };
}
