import "server-only";

import { notFound } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { openStatuses } from "@/lib/portal-format";
import { prisma } from "@/lib/prisma";
import {
  administrationFilters,
  type AdministrationInput,
} from "@/lib/validations/administration";

import { getAuthenticatedUser } from "./authenticated-user";
import { getPortalContext } from "./portal-context";

export async function requireGlobalAdministrator() {
  const user = await getAuthenticatedUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}
export type AdminEntity = Exclude<AdministrationInput["entity"], "policyState">;
export type AdminRecord = {
  id: string;
  name: string;
  subtitle?: string;
  values: string[];
  input: AdministrationInput;
  href?: string;
  impact?: string;
};
export type AdminOptions = {
  companies: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  calendars: { id: string; name: string }[];
  policies: { id: string; name: string }[];
  departments: { id: string; name: string; companyId: string }[];
};
const blankOptions: AdminOptions = {
  companies: [],
  teams: [],
  calendars: [],
  policies: [],
  departments: [],
};
const date = (d: Date) => d.toISOString().slice(0, 10);
export async function getAdministrationOptions(): Promise<AdminOptions> {
  await requireGlobalAdministrator();
  const [companies, teams, calendars, policies, departments] =
    await Promise.all([
      prisma.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.supportTeam.findMany({
        select: { id: true, name: true },
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      prisma.businessCalendar.findMany({
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.slaPolicy.findMany({
        select: { id: true, name: true, version: true, active: true },
        orderBy: [{ name: "asc" }, { version: "desc" }],
      }),
      prisma.department.findMany({
        select: { id: true, name: true, companyId: true },
        where: { active: true },
        orderBy: { name: "asc" },
      }),
    ]);
  return {
    companies,
    teams,
    calendars,
    policies: policies.map((p) => ({
      id: p.id,
      name: `${p.name} · v${p.version}${p.active ? "" : " · inativa"}`,
    })),
    departments,
  };
}

export async function getAdministrativeList(
  entity: AdminEntity,
  query: Record<string, string | string[] | undefined>,
  portal = false,
  fixedCompany?: string,
) {
  const user = portal
    ? await getAuthenticatedUser()
    : await requireGlobalAdministrator();
  const filters = administrationFilters.parse(query);
  let companyId = fixedCompany || filters.company;
  let options = blankOptions;
  if (portal) {
    if (entity !== "department") notFound();
    const context = await getPortalContext();
    if (!context.company) notFound();
    const member = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId: context.company.id, userId: user.id },
      },
    });
    if (
      user.role !== "ADMIN" &&
      (!member ||
        member.status !== "ACTIVE" ||
        !["MANAGER", "ADMIN"].includes(member.role))
    )
      notFound();
    companyId = context.company.id;
    options = { ...blankOptions, companies: [context.company] };
  } else options = await getAdministrationOptions();
  const search = { contains: filters.q, mode: Prisma.QueryMode.insensitive };
  const take = 10,
    skip = (filters.page - 1) * take;
  let records: AdminRecord[] = [],
    total = 0,
    columns: string[] = [];
  const status = filters.status;
  switch (entity) {
    case "company": {
      const where: Prisma.CompanyWhereInput = {
        ...(filters.q
          ? {
              OR: [
                { name: search },
                { taxId: search },
                { contracts: { some: { number: search } } },
              ],
            }
          : {}),
        ...(["ACTIVE", "SUSPENDED", "ARCHIVED"].includes(status)
          ? { status: status as "ACTIVE" | "SUSPENDED" | "ARCHIVED" }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.company.findMany({
          where,
          take,
          skip,
          orderBy: [{ name: "asc" }, { id: "asc" }],
          include: {
            _count: {
              select: {
                members: true,
                tickets: { where: { status: { in: openStatuses } } },
                contracts: true,
              },
            },
          },
        }),
        prisma.company.count({ where }),
      ]);
      total = count;
      columns = ["Contato", "Usuários", "Chamados ativos", "Estado"];
      records = rows.map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.taxId || "Documento não informado",
        values: [
          r.contactName || "—",
          String(r._count.members),
          String(r._count.tickets),
          r.status,
        ],
        href: `/operacao/empresas/${r.id}`,
        input: {
          entity,
          id: r.id,
          version: r.updatedAt.toISOString(),
          name: r.name,
          legalName: r.legalName || "",
          taxId: r.taxId || "",
          contactName: r.contactName || "",
          contactEmail: r.contactEmail || "",
          contactPhone: r.contactPhone || "",
          internalNotes: r.internalNotes || "",
          status: r.status,
        },
      }));
      break;
    }
    case "department": {
      const where: Prisma.DepartmentWhereInput = {
        ...(companyId ? { companyId } : {}),
        ...(filters.q
          ? { OR: [{ name: search }, { company: { name: search } }] }
          : {}),
        ...(["active", "inactive"].includes(status)
          ? { active: status === "active" }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.department.findMany({
          where,
          take,
          skip,
          orderBy: [{ name: "asc" }, { id: "asc" }],
          include: {
            company: { select: { name: true } },
            _count: {
              select: {
                members: true,
                tickets: { where: { status: { in: openStatuses } } },
              },
            },
          },
        }),
        prisma.department.count({ where }),
      ]);
      total = count;
      columns = ["Empresa", "Usuários", "Chamados ativos", "Estado"];
      records = rows.map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.description || undefined,
        values: [
          r.company.name,
          String(r._count.members),
          String(r._count.tickets),
          r.active ? "Ativo" : "Inativo",
        ],
        input: {
          entity,
          id: r.id,
          version: r.updatedAt.toISOString(),
          companyId: r.companyId,
          name: r.name,
          description: r.description || "",
          active: r.active,
        },
      }));
      break;
    }
    case "member": {
      if (!companyId) notFound();
      const where: Prisma.CompanyMemberWhereInput = {
        companyId,
        ...(filters.q
          ? { user: { OR: [{ name: search }, { email: search }] } }
          : {}),
        ...(["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"].includes(status)
          ? {
              status: status as "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED",
            }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.companyMember.findMany({
          where,
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { userId: "asc" }],
          include: {
            user: { select: { name: true, email: true } },
            department: { select: { name: true } },
          },
        }),
        prisma.companyMember.count({ where }),
      ]);
      total = count;
      columns = ["E-mail", "Departamento", "Papel", "Estado"];
      records = rows.map((r) => ({
        id: r.userId,
        name: r.user.name,
        values: [r.user.email, r.department?.name || "—", r.role, r.status],
        input: {
          entity,
          companyId: r.companyId,
          email: r.user.email,
          departmentId: r.departmentId || "",
          role: r.role,
          status: r.status,
          version: r.updatedAt.toISOString(),
        },
      }));
      break;
    }
    case "team": {
      const where: Prisma.SupportTeamWhereInput = {
        ...(filters.q ? { name: search } : {}),
        ...(["active", "inactive"].includes(status)
          ? { active: status === "active" }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.supportTeam.findMany({
          where,
          take,
          skip,
          orderBy: [{ name: "asc" }, { id: "asc" }],
          include: {
            _count: {
              select: {
                agents: true,
                tickets: { where: { status: { in: openStatuses } } },
              },
            },
          },
        }),
        prisma.supportTeam.count({ where }),
      ]);
      total = count;
      columns = ["Agentes", "Chamados ativos", "Estado"];
      records = rows.map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.description || undefined,
        values: [
          String(r._count.agents),
          String(r._count.tickets),
          r.active ? "Ativa" : "Inativa",
        ],
        impact: `${r._count.tickets} chamado(s) ativo(s). A desativação exige encaminhar todos antes.`,
        input: {
          entity,
          id: r.id,
          version: r.updatedAt.toISOString(),
          name: r.name,
          description: r.description || "",
          active: r.active,
        },
      }));
      break;
    }
    case "agent": {
      const where: Prisma.SupportAgentWhereInput = {
        ...(filters.q
          ? { user: { OR: [{ name: search }, { email: search }] } }
          : {}),
        ...(["active", "inactive"].includes(status)
          ? { active: status === "active" }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.supportAgent.findMany({
          where,
          take,
          skip,
          orderBy: { userId: "asc" },
          include: {
            user: { select: { name: true, email: true, active: true } },
            team: { select: { name: true } },
            _count: {
              select: {
                assignedTickets: { where: { status: { in: openStatuses } } },
              },
            },
          },
        }),
        prisma.supportAgent.count({ where }),
      ]);
      total = count;
      columns = ["Equipe", "Nível", "Disponibilidade", "Carga", "Estado"];
      records = rows.map((r) => ({
        id: r.userId,
        name: r.user.name,
        subtitle: r.user.email,
        values: [
          r.team.name,
          r.level,
          r.availability,
          `${r._count.assignedTickets}/${r.maxActiveTickets}`,
          r.active && r.user.active ? "Ativo" : "Inativo",
        ],
        impact: `${r._count.assignedTickets} chamado(s) ativo(s). Encaminhe-os antes de desativar ou mudar equipe/nível.`,
        input: {
          entity,
          email: r.user.email,
          version: r.updatedAt.toISOString(),
          teamId: r.teamId,
          level: r.level,
          availability: r.availability,
          maxActiveTickets: r.maxActiveTickets,
          active: r.active,
        },
      }));
      break;
    }
    case "user": {
      const where: Prisma.UserWhereInput = {
        ...(filters.q ? { OR: [{ name: search }, { email: search }] } : {}),
        ...(["active", "inactive"].includes(status)
          ? { active: status === "active" }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.user.findMany({
          where,
          take,
          skip,
          orderBy: [{ name: "asc" }, { id: "asc" }],
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            emailVerified: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);
      total = count;
      columns = ["E-mail", "Papel global", "E-mail confirmado", "Estado"];
      records = rows.map((r) => ({
        id: r.id,
        name: r.name,
        values: [
          r.email,
          r.role,
          r.emailVerified ? "Sim" : "Não",
          r.active ? "Ativo" : "Suspenso",
        ],
        input: {
          entity,
          email: r.email,
          role: r.role,
          active: r.active,
          version: r.updatedAt.toISOString(),
        },
      }));
      break;
    }
    case "contract": {
      const where: Prisma.ContractWhereInput = {
        ...(companyId ? { companyId } : {}),
        ...(filters.q
          ? {
              OR: [
                { name: search },
                { number: search },
                { company: { name: search } },
              ],
            }
          : {}),
        ...(["DRAFT", "ACTIVE", "EXPIRED", "CANCELED"].includes(status)
          ? { status: status as "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELED" }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.contract.findMany({
          where,
          take,
          skip,
          orderBy: [{ startsAt: "desc" }, { id: "asc" }],
          include: {
            company: { select: { name: true } },
            slaPolicy: { select: { name: true, version: true } },
          },
        }),
        prisma.contract.count({ where }),
      ]);
      total = count;
      columns = ["Empresa", "Política", "Vigência", "Meta", "Estado"];
      records = rows.map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: r.number,
        values: [
          r.company.name,
          `${r.slaPolicy.name} · v${r.slaPolicy.version}`,
          `${date(r.startsAt)} → ${r.endsAt ? date(r.endsAt) : "indeterminada"}`,
          `${r.slaGoalPercent.toString()}%`,
          r.status,
        ],
        input: {
          entity,
          id: r.id,
          version: r.updatedAt.toISOString(),
          companyId: r.companyId,
          number: r.number,
          name: r.name,
          slaPolicyId: r.slaPolicyId,
          status: r.status,
          startsAt: date(r.startsAt),
          endsAt: r.endsAt ? date(r.endsAt) : "",
          slaGoalPercent: Number(r.slaGoalPercent),
        },
      }));
      break;
    }
    case "policy": {
      const where: Prisma.SlaPolicyWhereInput = {
        ...(filters.q ? { name: search } : {}),
        ...(["active", "inactive"].includes(status)
          ? { active: status === "active" }
          : {}),
      };
      const [rows, count] = await Promise.all([
        prisma.slaPolicy.findMany({
          where,
          take,
          skip,
          orderBy: [{ name: "asc" }, { version: "desc" }, { id: "asc" }],
          include: {
            calendar: { select: { name: true } },
            targets: true,
            escalationRules: true,
            _count: { select: { contracts: true } },
          },
        }),
        prisma.slaPolicy.count({ where }),
      ]);
      total = count;
      columns = ["Versão", "Calendário", "Contratos", "Estado"];
      records = rows.map((r) => ({
        id: r.id,
        name: r.name,
        values: [
          `v${r.version}`,
          r.calendar.name,
          String(r._count.contracts),
          r.active ? "Ativa" : "Inativa",
        ],
        input: {
          entity,
          id: r.id,
          version: r.updatedAt.toISOString(),
          name: r.name,
          calendarId: r.calendarId,
          active: r.active,
          pauseWhileWaitingCustomer: r.pauseWhileWaitingCustomer,
          targets: r.targets.map((t) => ({
            priority: t.priority,
            firstResponseMinutes: t.firstResponseMinutes,
            resolutionMinutes: t.resolutionMinutes,
            warningPercent: t.warningPercent,
          })),
          rules: r.escalationRules
            .filter((t) => t.fromLevel !== "N3")
            .map((t) => ({
              fromLevel: t.fromLevel as "N1" | "N2",
              toLevel: t.toLevel as "N2" | "N3",
              resolutionPercent: t.resolutionPercent,
              active: t.active,
            })),
        },
      }));
      break;
    }
    case "calendar": {
      const where: Prisma.BusinessCalendarWhereInput = filters.q
        ? { name: search }
        : {};
      const [rows, count] = await Promise.all([
        prisma.businessCalendar.findMany({
          where,
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          include: {
            hours: true,
            holidays: true,
            _count: { select: { policies: true } },
          },
        }),
        prisma.businessCalendar.count({ where }),
      ]);
      total = count;
      columns = ["Fuso", "Atendimento", "Políticas"];
      records = rows.map((r) => ({
        id: r.id,
        name: r.name,
        values: [
          r.timeZone,
          r.alwaysOpen ? "24 horas" : `${r.hours.length} intervalos`,
          String(r._count.policies),
        ],
        input: {
          entity,
          id: r.id,
          version: r.updatedAt.toISOString(),
          name: r.name,
          timeZone: r.timeZone,
          alwaysOpen: r.alwaysOpen,
          hours: r.hours.map((h) => ({
            weekday: h.weekday,
            startMinute: h.startMinute,
            endMinute: h.endMinute,
          })),
          holidays: r.holidays.map((h) => ({
            date: date(h.date),
            name: h.name,
          })),
        },
      }));
      break;
    }
  }
  return {
    entity,
    records,
    total,
    columns,
    filters: { ...filters, company: companyId },
    options,
    portal,
  };
}
export type AdministrativeList = Awaited<
  ReturnType<typeof getAdministrativeList>
>;
export async function getAdministrativeCompany(id: string) {
  await requireGlobalAdministrator();
  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      legalName: true,
      taxId: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      status: true,
      internalNotes: true,
      updatedAt: true,
      _count: {
        select: {
          members: true,
          departments: true,
          contracts: true,
          tickets: { where: { status: { in: openStatuses } } },
        },
      },
    },
  });
  if (!company) notFound();
  return company;
}

export async function getAdministrativeSummary(kind: "company" | "agent") {
  await requireGlobalAdministrator();
  if (kind === "company") {
    const now = new Date(),
      soon = new Date(now.getTime() + 30 * 86400000);
    const values = await Promise.all([
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.companyMember.count({
        where: {
          status: "ACTIVE",
          company: { status: "ACTIVE" },
          user: { active: true },
        },
      }),
      prisma.ticket.count({
        where: { status: { in: openStatuses }, company: { status: "ACTIVE" } },
      }),
      prisma.contract.count({
        where: { status: "ACTIVE", endsAt: { gte: now, lte: soon } },
      }),
    ]);
    return [
      "Empresas ativas",
      "Usuários vinculados",
      "Chamados em aberto",
      "Contratos a renovar em 30 dias",
    ].map((label, i) => ({ label, value: values[i] }));
  }
  const base = {
    active: true,
    user: { role: "AGENT" as const, active: true },
    team: { active: true },
  };
  const values = await Promise.all([
    prisma.supportAgent.count({ where: base }),
    ...(["N1", "N2", "N3"] as const).map((level) =>
      prisma.supportAgent.count({ where: { ...base, level } }),
    ),
  ]);
  return [
    "Analistas ativos",
    "Primeiro atendimento · N1",
    "Especialistas · N2",
    "Engenharia · N3",
  ].map((label, i) => ({ label, value: values[i] }));
}
export async function getAdministrativeCompanyContract(companyId: string) {
  await requireGlobalAdministrator();
  const now = new Date();
  const contract = await prisma.contract.findFirst({
    where: {
      companyId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      slaPolicy: { active: true },
    },
    orderBy: [{ startsAt: "desc" }, { id: "asc" }],
    include: {
      slaPolicy: {
        include: { calendar: true, targets: { where: { priority: "MEDIUM" } } },
      },
    },
  });
  return contract
    ? {
        name: contract.name,
        number: contract.number,
        endsAt: contract.endsAt ? date(contract.endsAt) : null,
        goal: contract.slaGoalPercent.toString(),
        policy: `${contract.slaPolicy.name} · v${contract.slaPolicy.version}`,
        calendar: contract.slaPolicy.calendar.name,
        firstResponse: contract.slaPolicy.targets[0]?.firstResponseMinutes,
        resolution: contract.slaPolicy.targets[0]?.resolutionMinutes,
      }
    : null;
}
