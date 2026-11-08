import "server-only";

import { addWorkingMinutes } from "@/lib/business-calendar";
import { openStatuses } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import { operationScope, supportLevels } from "@/lib/support-access";
import {
  makeSlaSnapshot,
  measureResolution,
  snapshotCalendar,
  snapshotFromEvents,
} from "@/lib/ticket-sla";
import {
  type LifecycleInput,
  lifecycleSchema,
  type RatingInput,
  ratingSchema,
} from "@/lib/validations/ticket-lifecycle";

import {
  customerNotice,
  lifecycleHash,
  lifecycleTicketInclude,
  nextTicketVersion,
  transferTicket,
} from "./escalation-store";
import { getPortalContext } from "./portal-context";
import {
  getOperationContext,
  resumePause,
  serviceTransaction,
  serviceUserSelection,
  SupportInputError,
} from "./ticket-service";

export async function persistLifecycle(raw: LifecycleInput) {
  const input = lifecycleSchema.parse(raw),
    context = await getPortalContext();
  const eventId = `lifecycle-${lifecycleHash(context.user.id, input.ticketId, input.submissionKey)}`;
  const fingerprint = lifecycleHash(
    input.operation,
    input.reason,
    input.toLevel,
    input.teamId,
    input.assigneeId,
    input.adminOverride,
    input.notifyCustomer,
  );
  return serviceTransaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.ticketId}, 0))::text`;
    const user = await tx.user.findUnique({
      where: { id: context.user.id },
      select: serviceUserSelection,
    });
    if (!user?.emailVerified || user.role !== context.user.role)
      throw new SupportInputError("Suas permissões mudaram. Entre novamente.");
    const operation = operationScope(user);
    const supportMutation =
      input.operation === "resolve" || input.operation === "escalate";
    const scope = supportMutation
      ? operation
      : user.role === "ADMIN" && input.operation === "reopen"
        ? operation
        : context.scope;
    if (!scope)
      throw new SupportInputError("Você não tem permissão para esta ação.");
    const ticket = await tx.ticket.findFirst({
      where: { AND: [scope, { id: input.ticketId }] },
      include: lifecycleTicketInclude,
    });
    if (!ticket)
      throw new SupportInputError("Chamado indisponível para esta conta.");
    const owner =
      ticket.requesterId === user.id &&
      ticket.requester.status === "ACTIVE" &&
      context.company?.id === ticket.companyId;
    if (
      supportMutation &&
      user.role !== "ADMIN" &&
      ticket.assigneeId !== user.id
    )
      throw new SupportInputError(
        "Somente o responsável ou administrador pode executar esta ação.",
      );
    if (
      !supportMutation &&
      !owner &&
      !(user.role === "ADMIN" && input.operation === "reopen")
    )
      throw new SupportInputError(
        "Somente o solicitante pode confirmar ou reabrir este atendimento.",
      );
    const previous = await tx.ticketEvent.findUnique({
      where: { id: eventId },
      select: { metadata: true },
    });
    if (previous) {
      const value = previous.metadata as { fingerprint?: string } | null;
      if (value?.fingerprint !== fingerprint)
        throw new SupportInputError(
          "Esta submissão já foi usada com outros dados.",
        );
      return {
        ticketId: ticket.id,
        number: ticket.number,
        created: false,
        email: null as string | null,
        operation: input.operation,
      };
    }
    if (ticket.updatedAt.toISOString() !== input.expectedUpdatedAt)
      throw new SupportInputError(
        "O chamado mudou. Recarregue antes de continuar.",
      );
    const now = new Date(),
      version = nextTicketVersion(ticket, now);
    if (input.operation === "escalate") {
      if (!openStatuses.includes(ticket.status))
        throw new SupportInputError(
          "Somente chamados ativos podem ser escalonados.",
        );
      const adjacent =
        supportLevels.indexOf(input.toLevel!) ===
        supportLevels.indexOf(ticket.level) + 1;
      if (
        (!adjacent || input.adminOverride) &&
        !(user.role === "ADMIN" && input.adminOverride)
      )
        throw new SupportInputError(
          "Movimentos fora da sequência exigem autorização administrativa explícita.",
        );
      if (user.role !== "ADMIN" && input.teamId !== ticket.teamId)
        throw new SupportInputError(
          "Seu perfil só permite escalonamento dentro da própria equipe.",
        );
      await transferTicket(
        tx,
        ticket,
        {
          eventId,
          actorId: user.id,
          toLevel: input.toLevel!,
          teamId: input.teamId!,
          assigneeId: input.assigneeId,
          reason: input.reason!,
          automatic: false,
          notifyCustomer: input.notifyCustomer,
          adminOverride: input.adminOverride,
          fingerprint,
        },
        now,
      );
    } else if (input.operation === "resolve") {
      if (!openStatuses.includes(ticket.status))
        throw new SupportInputError("O chamado não está ativo para resolução.");
      const openPauses = ticket.slaPauses.filter((p) => p.endedAt === null);
      const deadlines = await resumePause(
        tx,
        { ...ticket, slaPauses: openPauses },
        now,
        user.id,
      );
      const firstResponse =
        ticket.firstRespondedAt ??
        (user.id !== ticket.requesterId ? now : null);
      const measurement = measureResolution(
        snapshotFromEvents(ticket.events),
        firstResponse,
        ticket.slaPauses.map((p) => ({ ...p, endedAt: p.endedAt ?? now })),
        now,
        input.reason!,
      );
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          ...deadlines,
          status: "RESOLVED",
          resolvedAt: now,
          firstRespondedAt: firstResponse,
          updatedAt: version,
        },
      });
      await tx.ticketMessage.create({
        data: {
          id: `solution-${eventId}`,
          ticketId: ticket.id,
          authorId: user.id,
          visibility: "PUBLIC",
          body: `Solução: ${input.reason!}`,
          createdAt: now,
        },
      });
      await tx.ticketEvent.create({
        data: {
          id: eventId,
          ticketId: ticket.id,
          actorId: user.id,
          type: "RESOLVED",
          visibility: "PUBLIC",
          createdAt: version,
          metadata: {
            fingerprint,
            measurement,
            summary: input.reason!,
            resolvedAt: now.toISOString(),
            firstRespondedAt: firstResponse?.toISOString() ?? null,
            measurementUnavailable: measurement === null,
          },
        },
      });
      await customerNotice(
        tx,
        ticket,
        "TICKET_RESOLVED",
        "Seu chamado foi resolvido",
      );
    } else if (input.operation === "close") {
      if (ticket.status !== "RESOLVED")
        throw new SupportInputError(
          "Somente chamados resolvidos podem ser confirmados.",
        );
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "CLOSED", closedAt: now, updatedAt: version },
      });
      await tx.ticketEvent.create({
        data: {
          id: eventId,
          ticketId: ticket.id,
          actorId: user.id,
          type: "CLOSED",
          visibility: "PUBLIC",
          createdAt: version,
          metadata: { fingerprint },
        },
      });
    } else {
      if (ticket.status !== "RESOLVED")
        throw new SupportInputError(
          "Somente chamados resolvidos podem ser reabertos. Encerrados e cancelados permanecem fechados.",
        );
      if (ticket.slaPauses.some((pause) => pause.endedAt === null))
        throw new SupportInputError(
          "Há uma pausa aberta inconsistente neste chamado. Solicite revisão administrativa antes de reabrir.",
        );
      const previousSnapshot = snapshotFromEvents(ticket.events);
      const rules = ticket.contract
        ? await tx.slaEscalationRule.findMany({
            where: { policyId: ticket.contract.slaPolicyId, active: true },
          })
        : [];
      const snapshot = previousSnapshot
        ? { ...previousSnapshot, cycleStartedAt: now.toISOString() }
        : ticket.slaTarget && ticket.contract
          ? makeSlaSnapshot(
              now,
              ticket.slaTarget,
              ticket.contract.slaPolicy.calendar,
              rules,
              ticket.contract.slaPolicy.pauseWhileWaitingCustomer,
            )
          : null;
      const calendar = snapshot ? snapshotCalendar(snapshot) : null;
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "IN_PROGRESS",
          resolvedAt: null,
          closedAt: null,
          firstRespondedAt: null,
          assigneeId: null,
          teamId: ticket.team?.active ? ticket.teamId : null,
          firstResponseDueAt:
            snapshot && calendar
              ? addWorkingMinutes(
                  now,
                  snapshot.firstResponseGoalMinutes,
                  calendar,
                )
              : null,
          resolutionDueAt:
            snapshot && calendar
              ? addWorkingMinutes(now, snapshot.resolutionGoalMinutes, calendar)
              : null,
          firstResponseMinutes: snapshot?.firstResponseGoalMinutes ?? null,
          resolutionMinutes: snapshot?.resolutionGoalMinutes ?? null,
          updatedAt: version,
        },
      });
      await tx.ticketEvent.create({
        data: {
          id: eventId,
          ticketId: ticket.id,
          actorId: user.id,
          type: "REOPENED",
          visibility: "PUBLIC",
          createdAt: version,
          metadata: {
            fingerprint,
            reason: input.reason!,
            ...(snapshot ? { slaSnapshot: snapshot } : {}),
            archivedCycle: {
              resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
              firstRespondedAt: ticket.firstRespondedAt?.toISOString() ?? null,
              firstResponseDueAt:
                ticket.firstResponseDueAt?.toISOString() ?? null,
              resolutionDueAt: ticket.resolutionDueAt?.toISOString() ?? null,
            },
          },
        },
      });
      await tx.ticketMessage.create({
        data: {
          id: `reopen-${eventId}`,
          ticketId: ticket.id,
          authorId: user.id,
          visibility: "PUBLIC",
          body: `Reabertura: ${input.reason!}`,
          createdAt: now,
        },
      });
      await customerNotice(
        tx,
        ticket,
        "TICKET_REPLIED",
        "O chamado foi reaberto para novo atendimento",
      );
    }
    const email =
      input.operation !== "close" &&
      (input.operation !== "escalate" || input.notifyCustomer) &&
      ticket.requester.status === "ACTIVE" &&
      ticket.requester.user.emailVerified &&
      ticket.requester.user.preferences?.emailEnabled !== false &&
      ticket.requesterId !== user.id
        ? ticket.requester.user.email
        : null;
    return {
      ticketId: ticket.id,
      number: ticket.number,
      created: true,
      email,
      operation: input.operation,
    };
  });
}

export async function getLifecycleOptions(ticketId: string) {
  const context = await getOperationContext();
  if (!context) return null;
  const ticket = await prisma.ticket.findFirst({
    where: { AND: [context.scope, { id: ticketId }] },
    select: { assigneeId: true, teamId: true, level: true },
  });
  if (
    !ticket ||
    (context.user.role !== "ADMIN" && ticket.assigneeId !== context.user.id)
  )
    return null;
  const teams = await prisma.supportTeam.findMany({
    where: {
      active: true,
      ...(context.user.role === "ADMIN" ? {} : { id: ticket.teamId || "" }),
    },
    select: {
      id: true,
      name: true,
      agents: {
        where: { active: true, user: { role: "AGENT", emailVerified: true } },
        select: { userId: true, level: true, user: { select: { name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return {
    admin: context.user.role === "ADMIN",
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      agents: team.agents.map((agent) => ({
        id: agent.userId,
        level: agent.level,
        name: agent.user.name,
      })),
    })),
  };
}

export async function getTicketRating(ticketId: string) {
  const context = await getPortalContext();
  if (!context.company) return null;
  return prisma.ticket.findFirst({
    where: {
      AND: [
        context.scope,
        {
          id: ticketId,
          requesterId: context.user.id,
          requester: { status: "ACTIVE" },
          status: { in: ["RESOLVED", "CLOSED"] },
        },
      ],
    },
    select: {
      id: true,
      number: true,
      subject: true,
      rating: { select: { score: true, comment: true } },
    },
  });
}
export async function persistTicketRating(raw: RatingInput) {
  const input = ratingSchema.parse(raw),
    context = await getPortalContext();
  return serviceTransaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.ticketId}, 0))::text`;
    const user = await tx.user.findUnique({
      where: { id: context.user.id },
      select: serviceUserSelection,
    });
    if (!user?.emailVerified)
      throw new SupportInputError("Acesso indisponível.");
    const ticket = await tx.ticket.findFirst({
      where: {
        AND: [
          context.scope,
          {
            id: input.ticketId,
            requesterId: user.id,
            requester: { status: "ACTIVE" },
            company: { status: "ACTIVE" },
            status: { in: ["RESOLVED", "CLOSED"] },
          },
        ],
      },
      select: { id: true, rating: true },
    });
    if (!ticket)
      throw new SupportInputError(
        "Somente o solicitante pode avaliar um chamado resolvido ou encerrado.",
      );
    if (ticket.rating) {
      if (
        ticket.rating.score === input.score &&
        (ticket.rating.comment || "") === input.comment
      )
        return { ticketId: ticket.id };
      throw new SupportInputError(
        "A avaliação já foi registrada e não pode ser alterada.",
      );
    }
    await tx.ticketRating.create({
      data: {
        ticketId: ticket.id,
        score: input.score,
        comment: input.comment || null,
      },
    });
    return { ticketId: ticket.id };
  });
}
