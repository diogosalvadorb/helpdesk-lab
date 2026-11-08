import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { globalAccessChangeError } from "@/lib/administrative-access";
import { addWorkingMinutes } from "@/lib/business-calendar";
import { openStatuses } from "@/lib/portal-format";
import {
  type AdministrationInput,
  administrationSchema,
} from "@/lib/validations/administration";

import { SupportInputError, transaction } from "./service-store";

type Tx = Prisma.TransactionClient;
function deny(message: string): never {
  throw new SupportInputError(message);
}
function checkVersion(before: { updatedAt: Date }, version?: string) {
  if (!version || before.updatedAt.toISOString() !== version)
    deny("O cadastro mudou. Recarregue a página antes de salvar.");
}
async function audit(
  tx: Tx,
  actorId: string,
  entity: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  await tx.administrativeLog.create({
    data: {
      actorId,
      entity,
      entityId,
      changes: JSON.parse(
        JSON.stringify({ before: before ?? null, after }),
      ) as Prisma.InputJsonValue,
    },
  });
}
async function departmentPermission(
  tx: Tx,
  actorId: string,
  companyId: string,
  global: boolean,
) {
  const company = await tx.company.findUnique({
    where: { id: companyId },
    select: { status: true },
  });
  if (!company || (!global && company.status !== "ACTIVE"))
    deny("Empresa indisponível.");
  if (!global) {
    const member = await tx.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: actorId } },
    });
    if (
      !member ||
      member.status !== "ACTIVE" ||
      !["MANAGER", "ADMIN"].includes(member.role)
    )
      deny("Você não pode administrar esta empresa.");
  }
}
async function calendarSupports(tx: Tx, calendarId: string, minutes: number) {
  const calendar = await tx.businessCalendar.findUnique({
    where: { id: calendarId },
    include: { hours: true, holidays: true },
  });
  if (!calendar) return deny("Calendário não encontrado.");
  // Fail sparse/invalid configurations before invoking the same bounded clock used on opening.
  const weekly = calendar.hours.reduce(
    (n, h) => n + h.endMinute - h.startMinute,
    0,
  );
  if (!calendar.alwaysOpen && weekly * 104 < minutes)
    deny("A meta não cabe no horizonte de dois anos deste calendário.");
  addWorkingMinutes(new Date(), minutes, calendar);
  return calendar;
}

/** Fresh identity, serializable transaction and a common lock protect concurrent administration.
 * Exported separately from request context so integration checks use this exact boundary. */
export async function saveAdministration(
  actorId: string,
  raw: AdministrationInput,
  portalCompanyId?: string,
) {
  const input = administrationSchema.parse(raw);
  return transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended('helpdesk-administration', 0))::text`;
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, active: true, emailVerified: true },
    });
    if (!actor?.active || !actor.emailVerified)
      deny("Seu acesso não está ativo. Entre novamente.");
    const global = actor.role === "ADMIN";
    if (!global && input.entity !== "department")
      deny("A administração global exige um administrador global.");
    let before: unknown = null,
      after: unknown,
      entityId: string;
    switch (input.entity) {
      case "company": {
        const { entity: _entity, id, version, ...fields } = input;
        void _entity;
        const data = {
          ...fields,
          taxId: fields.taxId || null,
          contactEmail: fields.contactEmail || null,
        };
        if (id) {
          const old = await tx.company.findUnique({ where: { id } });
          if (!old) return deny("Empresa não encontrada.");
          checkVersion(old, version);
          before = old;
        }
        const row = id
          ? await tx.company.update({ where: { id }, data })
          : await tx.company.create({ data });
        after = row;
        entityId = row.id;
        break;
      }
      case "department": {
        if (!global && input.companyId !== portalCompanyId)
          deny("A empresa selecionada mudou. Recarregue a página.");
        await departmentPermission(tx, actorId, input.companyId, global);
        const { entity: _entity, id, version, ...data } = input;
        void _entity;
        if (id) {
          const old = await tx.department.findFirst({
            where: { id, companyId: input.companyId },
          });
          if (!old) return deny("Departamento não encontrado nesta empresa.");
          checkVersion(old, version);
          before = old;
        }
        const row = id
          ? await tx.department.update({ where: { id }, data })
          : await tx.department.create({ data });
        after = row;
        entityId = row.id;
        break;
      }
      case "member": {
        await departmentPermission(tx, actorId, input.companyId, true);
        const user = await tx.user.findUnique({
          where: { email: input.email },
          select: { id: true, active: true, emailVerified: true },
        });
        if (!user)
          return deny(
            "Usuário não encontrado. Ele deve se cadastrar pelo fluxo de autenticação.",
          );
        if (user.id === actorId)
          deny("Não é permitido aprovar ou alterar o próprio vínculo.");
        if (input.status === "ACTIVE" && (!user.active || !user.emailVerified))
          deny(
            "Para aprovar, o usuário precisa estar ativo e ter e-mail confirmado.",
          );
        if (
          input.departmentId &&
          !(await tx.department.findFirst({
            where: {
              id: input.departmentId,
              companyId: input.companyId,
              active: true,
            },
          }))
        )
          deny("Escolha um departamento ativo desta empresa.");
        const where = {
          companyId_userId: { companyId: input.companyId, userId: user.id },
        };
        const old = await tx.companyMember.findUnique({ where });
        if (old) checkVersion(old, input.version);
        const data = {
          departmentId: input.departmentId || null,
          role: input.role,
          status: input.status,
          approvedAt:
            input.status === "ACTIVE"
              ? (old?.approvedAt ?? new Date())
              : old?.approvedAt,
        };
        const row = await tx.companyMember.upsert({
          where,
          create: { companyId: input.companyId, userId: user.id, ...data },
          update: data,
        });
        if (input.status === "ACTIVE" && old?.status !== "ACTIVE")
          await tx.notification.create({
            data: {
              userId: user.id,
              type: "MEMBERSHIP_APPROVED",
              companyId: input.companyId,
              title: "Vínculo com a empresa aprovado",
              body: "Seu acesso já está disponível no portal.",
            },
          });
        before = old;
        after = row;
        entityId = `${input.companyId}/${user.id}`;
        break;
      }
      case "team": {
        const { entity: _entity, id, version, ...data } = input;
        void _entity;
        if (id) {
          const old = await tx.supportTeam.findUnique({ where: { id } });
          if (!old) return deny("Equipe não encontrada.");
          checkVersion(old, version);
          before = old;
          if (!data.active) {
            const count = await tx.ticket.count({
              where: { teamId: id, status: { in: openStatuses } },
            });
            if (count)
              deny(
                `Esta equipe possui ${count} chamado(s) ativo(s). Encaminhe todos antes de desativá-la.`,
              );
          }
        }
        const row = id
          ? await tx.supportTeam.update({ where: { id }, data })
          : await tx.supportTeam.create({ data });
        after = row;
        entityId = row.id;
        break;
      }
      case "agent": {
        const user = await tx.user.findUnique({
          where: { email: input.email },
          select: { id: true, role: true, active: true, emailVerified: true },
        });
        if (!user || user.role !== "AGENT")
          return deny(
            "Escolha um usuário com papel global Agente. Altere o papel no cadastro de acesso, se necessário.",
          );
        if (input.active && (!user.active || !user.emailVerified))
          deny("O usuário precisa estar ativo e ter e-mail confirmado.");
        const team = await tx.supportTeam.findUnique({
          where: { id: input.teamId },
        });
        if (!team || (input.active && !team.active))
          return deny("Selecione uma equipe ativa.");
        const old = await tx.supportAgent.findUnique({
          where: { userId: user.id },
        });
        if (old) checkVersion(old, input.version);
        const count = await tx.ticket.count({
          where: { assigneeId: user.id, status: { in: openStatuses } },
        });
        if (
          count &&
          (!input.active ||
            old?.teamId !== input.teamId ||
            old?.level !== input.level)
        )
          deny(
            `O agente possui ${count} chamado(s) ativo(s). Encaminhe todos antes de mudar equipe, nível ou estado.`,
          );
        if (count > input.maxActiveTickets)
          deny(
            `A capacidade não pode ser menor que os ${count} chamados ativos atribuídos.`,
          );
        const {
          entity: _entity,
          email: _email,
          version: _version,
          ...data
        } = input;
        void _entity;
        void _email;
        void _version;
        const row = await tx.supportAgent.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...data },
          update: data,
        });
        before = old;
        after = row;
        entityId = user.id;
        break;
      }
      case "user": {
        const old = await tx.user.findUnique({
          where: { email: input.email },
          select: {
            id: true,
            name: true,
            role: true,
            active: true,
            emailVerified: true,
            updatedAt: true,
          },
        });
        if (!old)
          return deny(
            "Usuário não encontrado. Não são criadas senhas pela administração.",
          );
        checkVersion(old, input.version);
        const accessError = globalAccessChangeError(
          actorId,
          old,
          input,
          await tx.user.count({
            where: { role: "ADMIN", active: true, emailVerified: true },
          }),
        );
        if (accessError) deny(accessError);
        if (input.active && input.role !== "CLIENT" && !old.emailVerified)
          deny(
            "Confirme o e-mail antes de conceder acesso ao suporte ou à administração.",
          );
        const count = await tx.ticket.count({
          where: { assigneeId: old.id, status: { in: openStatuses } },
        });
        if (count && (!input.active || input.role !== "AGENT"))
          deny(
            `Este usuário possui ${count} chamado(s) ativo(s). Encaminhe todos antes de alterar o acesso.`,
          );
        const row = await tx.user.update({
          where: { id: old.id },
          data: { active: input.active, role: input.role },
          select: { id: true, role: true, active: true, updatedAt: true },
        });
        if (!input.active || input.role !== old.role)
          await tx.session.deleteMany({ where: { userId: old.id } });
        before = old;
        after = row;
        entityId = row.id;
        break;
      }
      case "calendar": {
        if (input.id) {
          const old = await tx.businessCalendar.findUnique({
            where: { id: input.id },
            include: { hours: true, holidays: true },
          });
          if (!old) return deny("Calendário não encontrado.");
          checkVersion(old, input.version);
          before = old;
        }
        const row = await tx.businessCalendar.create({
          data: {
            name: input.name,
            timeZone: input.timeZone,
            alwaysOpen: input.alwaysOpen,
            hours: { create: input.hours },
            holidays: {
              create: input.holidays.map((h) => ({
                ...h,
                date: new Date(`${h.date}T00:00:00Z`),
              })),
            },
          },
          include: { hours: true, holidays: true },
        });
        await calendarSupports(tx, row.id, 1);
        after = row;
        entityId = row.id;
        break;
      }
      case "policy": {
        let version = 1;
        if (input.id) {
          const old = await tx.slaPolicy.findUnique({
            where: { id: input.id },
            include: { targets: true, escalationRules: true },
          });
          if (!old) return deny("Política não encontrada.");
          checkVersion(old, input.version);
          before = old;
          if (input.name !== old.name)
            deny("Mantenha o nome para criar uma nova versão desta política.");
        }
        const latest = await tx.slaPolicy.findFirst({
          where: { name: input.name },
          orderBy: { version: "desc" },
        });
        if (latest) {
          if (!input.id)
            deny(
              "Este nome já existe. Crie uma nova versão a partir da política existente.",
            );
          version = latest.version + 1;
        }
        await calendarSupports(
          tx,
          input.calendarId,
          Math.max(...input.targets.map((t) => t.resolutionMinutes)),
        );
        const row = await tx.slaPolicy.create({
          data: {
            name: input.name,
            version,
            calendarId: input.calendarId,
            active: input.active,
            pauseWhileWaitingCustomer: input.pauseWhileWaitingCustomer,
            targets: { create: input.targets },
            escalationRules: { create: input.rules },
          },
          include: { targets: true, escalationRules: true },
        });
        after = row;
        entityId = row.id;
        break;
      }
      case "policyState": {
        const old = await tx.slaPolicy.findUnique({ where: { id: input.id } });
        if (!old) return deny("Política não encontrada.");
        checkVersion(old, input.version);
        const row = await tx.slaPolicy.update({
          where: { id: input.id },
          data: { active: input.active },
        });
        before = old;
        after = row;
        entityId = row.id;
        break;
      }
      case "contract": {
        const {
          entity: _entity,
          id,
          version,
          startsAt,
          endsAt,
          ...fields
        } = input;
        void _entity;
        const company = await tx.company.findUnique({
          where: { id: input.companyId },
        });
        if (
          !company ||
          (input.status === "ACTIVE" && company.status !== "ACTIVE")
        )
          deny("A empresa precisa estar ativa para ativar o contrato.");
        const policy = await tx.slaPolicy.findUnique({
          where: { id: input.slaPolicyId },
          include: { targets: true },
        });
        if (!policy || (input.status === "ACTIVE" && !policy.active))
          return deny("Selecione uma política ativa para ativar o contrato.");
        if (input.status === "ACTIVE") {
          if (policy.targets.length !== 4)
            deny("A política deve definir as quatro prioridades.");
          await calendarSupports(
            tx,
            policy.calendarId,
            Math.max(...policy.targets.map((t) => t.resolutionMinutes)),
          );
        }
        const data = {
          ...fields,
          startsAt: new Date(`${startsAt}T00:00:00Z`),
          endsAt: endsAt ? new Date(`${endsAt}T23:59:59.999Z`) : null,
        };
        if (id) {
          const old = await tx.contract.findUnique({ where: { id } });
          if (!old || old.companyId !== input.companyId)
            return deny("Contrato não encontrado nesta empresa.");
          checkVersion(old, version);
          before = old;
          if (
            (old.slaPolicyId !== input.slaPolicyId ||
              old.startsAt.toISOString().slice(0, 10) !== startsAt) &&
            (await tx.ticket.count({ where: { contractId: id } }))
          )
            deny(
              "Este contrato já possui chamados. Preserve a política e o início da vigência; encerre-o e crie outro contrato para os novos termos.",
            );
        }
        if (input.status === "ACTIVE") {
          const overlap = await tx.contract.count({
            where: {
              companyId: input.companyId,
              status: "ACTIVE",
              ...(id ? { id: { not: id } } : {}),
              ...(data.endsAt ? { startsAt: { lte: data.endsAt } } : {}),
              OR: [{ endsAt: null }, { endsAt: { gte: data.startsAt } }],
            },
          });
          if (overlap)
            deny(
              "Já existe contrato ativo com vigência sobreposta nesta empresa. Ajuste as datas ou encerre o contrato anterior.",
            );
        }
        const row = id
          ? await tx.contract.update({ where: { id }, data })
          : await tx.contract.create({ data });
        before = before ?? null;
        after = row;
        entityId = row.id;
        break;
      }
    }
    await audit(tx, actorId, input.entity, entityId, before, after);
    return { id: entityId };
  });
}
