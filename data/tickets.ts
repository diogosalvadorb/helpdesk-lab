import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
  addWorkingMinutes,
  CalendarConfigurationError,
} from "@/lib/business-calendar";
import { ticketNumber } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import { submissionIdentity } from "@/lib/ticket-submission";
import {
  type CreateTicketInput,
  createTicketSchema,
} from "@/lib/validations/ticket";

import { getPortalContext } from "./portal-context";

export class TicketInputError extends Error {}

export async function getTicketCreationOptions() {
  const context = await getPortalContext();
  if (!context.company) return null;
  const membership = await prisma.companyMember.findFirst({
    where: {
      companyId: context.company.id,
      userId: context.user.id,
      status: "ACTIVE",
      company: { status: "ACTIVE" },
    },
    select: { departmentId: true },
  });
  if (!membership) return null;
  if (
    context.user.role === "AGENT" &&
    (!context.user.supportAgent?.active ||
      !context.user.supportAgent.team.active)
  )
    return null;
  const [departments, categories] = await Promise.all([
    prisma.department.findMany({
      where: { companyId: context.company.id, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.ticketCategory.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    company: context.company,
    departments,
    categories,
    departmentId: membership.departmentId,
  };
}

export async function persistNewTicket(rawInput: CreateTicketInput) {
  const input = createTicketSchema.parse(rawInput);
  const context = await getPortalContext();
  if (!context.company || context.company.id !== input.companyId)
    throw new TicketInputError(
      "A empresa selecionada mudou ou não está disponível. Revise o formulário.",
    );
  const identity = submissionIdentity(context.user.id, input);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Serializes retries across processes, while the primary key provides a
          // permanent uniqueness constraint without schema changes.
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${identity.id}, 0))::text`;
          const user = await tx.user.findUnique({
            where: { id: context.user.id },
            select: {
              email: true,
              emailVerified: true,
              role: true,
              supportAgent: {
                select: {
                  active: true,
                  teamId: true,
                  team: { select: { active: true } },
                },
              },
            },
          });
          const membership = await tx.companyMember.findFirst({
            where: {
              companyId: input.companyId,
              userId: context.user.id,
              status: "ACTIVE",
              company: { status: "ACTIVE" },
            },
            select: { userId: true },
          });
          if (!user?.emailVerified || !membership)
            throw new TicketInputError(
              "É necessário um vínculo ativo com esta empresa para abrir um chamado.",
            );
          if (user.role !== context.user.role)
            throw new TicketInputError(
              "Suas permissões mudaram. Recarregue a página.",
            );
          const agentTeam = user.role === "AGENT" ? user.supportAgent : null;
          if (
            user.role === "AGENT" &&
            (!agentTeam?.active || !agentTeam.team.active)
          )
            throw new TicketInputError(
              "Seu perfil de suporte precisa estar ativo para abrir um chamado neste portal.",
            );
          const previous = await tx.ticket.findUnique({
            where: { id: identity.id },
            select: {
              id: true,
              number: true,
              events: {
                where: { type: "CREATED" },
                select: { metadata: true },
                take: 1,
              },
            },
          });
          if (previous) {
            const metadata = previous.events[0]?.metadata;
            if (
              !metadata ||
              typeof metadata !== "object" ||
              Array.isArray(metadata) ||
              metadata.fingerprint !== identity.fingerprint
            )
              throw new TicketInputError(
                "Esta submissão já foi usada com outros dados. Abra um novo formulário.",
              );
            return {
              id: previous.id,
              number: previous.number,
              created: false,
              email: user.email,
            };
          }
          const [department, category] = await Promise.all([
            tx.department.findFirst({
              where: {
                id: input.departmentId,
                companyId: input.companyId,
                active: true,
              },
              select: { id: true },
            }),
            tx.ticketCategory.findFirst({
              where: { id: input.categoryId, active: true },
              select: { id: true, defaultLevel: true },
            }),
          ]);
          if (!department || !category)
            throw new TicketInputError(
              "Departamento ou categoria indisponível. Recarregue as opções e revise os dados.",
            );
          const now = new Date();
          const contract = await tx.contract.findFirst({
            where: {
              companyId: input.companyId,
              status: "ACTIVE",
              startsAt: { lte: now },
              OR: [{ endsAt: null }, { endsAt: { gte: now } }],
              slaPolicy: { active: true },
            },
            orderBy: [{ startsAt: "desc" }, { id: "asc" }],
            include: {
              slaPolicy: {
                include: {
                  targets: { where: { priority: "MEDIUM" } },
                  calendar: { include: { hours: true, holidays: true } },
                },
              },
            },
          });
          const target = contract?.slaPolicy.targets[0];
          const sla =
            contract && target
              ? {
                  contractId: contract.id,
                  slaTargetId: target.id,
                  firstResponseMinutes: target.firstResponseMinutes,
                  resolutionMinutes: target.resolutionMinutes,
                  firstResponseDueAt: addWorkingMinutes(
                    now,
                    target.firstResponseMinutes,
                    contract.slaPolicy.calendar,
                  ),
                  resolutionDueAt: addWorkingMinutes(
                    now,
                    target.resolutionMinutes,
                    contract.slaPolicy.calendar,
                  ),
                }
              : {};
          const ticket = await tx.ticket.create({
            data: {
              id: identity.id,
              companyId: input.companyId,
              requesterId: context.user.id,
              departmentId: department.id,
              categoryId: category.id,
              subject: input.subject,
              description: input.description,
              impact: input.impact,
              priority: "MEDIUM",
              status: "OPEN",
              channel: "PORTAL",
              level: category.defaultLevel,
              // Agent self-service stays inside the agent's existing team scope.
              teamId: agentTeam?.teamId ?? null,
              ...sla,
              events: {
                create: {
                  actorId: context.user.id,
                  type: "CREATED",
                  visibility: "INTERNAL",
                  metadata: {
                    fingerprint: identity.fingerprint,
                    emailStatus: "pending",
                  },
                },
              },
              notifications: {
                create: {
                  userId: context.user.id,
                  type: "TICKET_CREATED",
                  title: "Chamado recebido",
                  body: input.subject,
                },
              },
            },
            select: { id: true, number: true },
          });
          return { ...ticket, created: true, email: user.email };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 20000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 2
      )
        continue;
      if (error instanceof CalendarConfigurationError)
        throw new TicketInputError(error.message);
      throw error;
    }
  }
  throw new TicketInputError(
    "Não foi possível concluir. Tente novamente com os mesmos dados.",
  );
}

export async function recordTicketEmailStatus(
  ticketId: string,
  status: "sent" | "failed",
) {
  const context = await getPortalContext();
  const event = await prisma.ticketEvent.findFirst({
    where: {
      ticketId,
      type: "CREATED",
      actorId: context.user.id,
      ticket: {
        requesterId: context.user.id,
        companyId: context.company?.id || "",
      },
    },
    select: { id: true, metadata: true },
  });
  if (!event) return;
  const metadata =
    event.metadata &&
    typeof event.metadata === "object" &&
    !Array.isArray(event.metadata)
      ? event.metadata
      : {};
  await prisma.ticketEvent.update({
    where: { id: event.id },
    data: { metadata: { ...metadata, emailStatus: status } },
  });
}

export async function getCreatedTicket(id: string) {
  const context = await getPortalContext();
  const row = await prisma.ticket.findFirst({
    where: { AND: [context.scope, { id }] },
    select: {
      id: true,
      number: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      level: true,
      createdAt: true,
      firstResponseDueAt: true,
      resolutionDueAt: true,
      company: { select: { name: true } },
      department: { select: { name: true } },
      events: {
        where: { type: "CREATED" },
        select: { metadata: true },
        take: 1,
      },
    },
  });
  if (!row) return null;
  const metadata = row.events[0]?.metadata;
  const emailStatus =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata.emailStatus
      : null;
  return {
    ...row,
    events: undefined,
    emailStatus,
    formattedNumber: ticketNumber(row.number),
  };
}
