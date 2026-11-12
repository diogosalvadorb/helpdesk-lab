import "dotenv/config";

import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import {
  type Prisma,
  PrismaClient,
  type SupportLevel,
  type TicketPriority,
  type TicketStatus,
  type UserRole,
} from "../generated/prisma/client";

const masterEmail = "diogosbarbosa93@gmail.com";
const prefix = "helpdesk-demo";
const id = (name: string) => `${prefix}-${name}`;
const defaultCredentialsPath = new URL(
  "../.seed-credentials.local.json",
  import.meta.url,
);
const defaultPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const demoUsers: {
  key: string;
  name: string;
  role: UserRole;
  level?: SupportLevel;
}[] = [
  { key: "admin", name: "Administrador de demonstração", role: "ADMIN" },
  { key: "mariana", name: "Mariana Costa", role: "CLIENT" },
  { key: "joao", name: "João Almeida", role: "CLIENT" },
  { key: "julia", name: "Julia Martins", role: "AGENT", level: "N1" },
  { key: "camila", name: "Camila Souza", role: "AGENT", level: "N1" },
  { key: "lucas", name: "Lucas Ferreira", role: "AGENT", level: "N1" },
  { key: "rafael", name: "Rafael Santos", role: "AGENT", level: "N2" },
  { key: "beatriz", name: "Beatriz Lima", role: "AGENT", level: "N2" },
  { key: "diego", name: "Diego Ribeiro", role: "AGENT", level: "N2" },
  { key: "bruno", name: "Bruno Lima", role: "AGENT", level: "N3" },
  { key: "renata", name: "Renata Alves", role: "AGENT", level: "N3" },
  { key: "felipe", name: "Felipe Mendes", role: "AGENT", level: "N3" },
  { key: "carlos", name: "Carlos Oliveira", role: "CLIENT" },
  { key: "patricia", name: "Patrícia Gomes", role: "CLIENT" },
  { key: "roberto", name: "Roberto Dias", role: "CLIENT" },
  { key: "fernanda", name: "Fernanda Rocha", role: "CLIENT" },
  { key: "andre", name: "André Martins", role: "CLIENT" },
];

const demoCompanies = [
  { key: "nexus", name: "Nexus3D · Demonstração", manager: "mariana" },
  {
    key: "horizonte",
    name: "Grupo Horizonte · Demonstração",
    manager: "carlos",
  },
  { key: "aurora", name: "Aurora Saúde · Demonstração", manager: "patricia" },
  {
    key: "valeverde",
    name: "Vale Verde Logística · Demonstração",
    manager: "roberto",
  },
  { key: "atlas", name: "Atlas Educação · Demonstração", manager: "fernanda" },
  { key: "orion", name: "Orion Comércio · Demonstração", manager: "andre" },
] as const;

export async function seedDatabase({
  prisma = defaultPrisma,
  credentialsPath = defaultCredentialsPath,
}: { prisma?: PrismaClient; credentialsPath?: URL } = {}) {
  if (!process.env.DATABASE_URL)
    throw new Error("Configure DATABASE_URL antes de executar a seed.");
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Esta seed demonstrativa deve ser executada em desenvolvimento.",
    );
  if (
    process.env.SEED_DEMO_PASSWORD &&
    process.env.SEED_DEMO_PASSWORD.length < 12
  )
    throw new Error("SEED_DEMO_PASSWORD deve ter pelo menos 12 caracteres.");
  const master = await prisma.user.findFirst({
    where: { email: { equals: masterEmail, mode: "insensitive" } },
  });
  // The demonstration administrator bootstraps a fresh clone. If the owner's
  // existing account is present, preserve its credentials and previous access.
  const ownerId = master?.id ?? id("user-admin");

  const now = new Date();
  const ago = (hours: number) => new Date(now.getTime() - hours * 3600000);
  const later = (hours: number) => new Date(now.getTime() + hours * 3600000);
  const summary = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${prefix}, 0))::text`;
      let credentials: Record<string, string> = {};
      try {
        credentials = JSON.parse(await readFile(credentialsPath, "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT")
          throw new Error(
            "Não foi possível ler o arquivo local de credenciais demonstrativas.",
          );
      }
      const hashes = new Map<string, string>();
      for (const user of demoUsers) {
        const email = `${user.key}@helpdesk.example.test`;
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing && existing.id !== id(`user-${user.key}`))
          throw new Error(
            "Uma conta demonstrativa conflita com um usuário existente. Nenhum dado foi alterado.",
          );
        const account =
          existing &&
          (await tx.account.findFirst({
            where: { userId: existing.id, providerId: "credential" },
          }));
        if (!account) {
          const password =
            process.env.SEED_DEMO_PASSWORD ||
            credentials[email] ||
            randomBytes(24).toString("base64url");
          credentials[email] = password;
          hashes.set(user.key, await hashPassword(password));
        }
      }

      if (hashes.size)
        await writeFile(
          credentialsPath,
          `${JSON.stringify(credentials, null, 2)}\n`,
          { mode: 0o600 },
        );

      if (master)
        await tx.user.update({
          where: { id: master.id },
          data: { role: "ADMIN" },
        });

      for (const { key, name } of demoCompanies) {
        await tx.company.upsert({
          where: { id: id(`company-${key}`) },
          update: {},
          create: {
            id: id(`company-${key}`),
            name,
            status: "ACTIVE",
            internalNotes: "Dados demonstrativos da seed Helpdesk Lab.",
          },
        });
        for (const [dept, title] of [
          ["technology", "Tecnologia"],
          ["admin", "Administrativo"],
          ["finance", "Financeiro"],
        ] as const) {
          await tx.department.upsert({
            where: { id: id(`dept-${key}-${dept}`) },
            update: {},
            create: {
              id: id(`dept-${key}-${dept}`),
              companyId: id(`company-${key}`),
              name: title,
            },
          });
        }
      }
      const team = await tx.supportTeam.upsert({
        where: { name: "Suporte Helpdesk · Demonstração" },
        update: {},
        create: {
          id: id("team"),
          name: "Suporte Helpdesk · Demonstração",
          description: "Triagem, especialistas e engenharia.",
        },
      });
      for (const user of demoUsers) {
        const userId = id(`user-${user.key}`);
        const email = `${user.key}@helpdesk.example.test`;
        await tx.user.upsert({
          where: { email },
          update: {},
          create: {
            id: userId,
            email,
            name: user.name,
            company:
              user.role !== "CLIENT"
                ? "Nexo Tecnologia · Demonstração"
                : (demoCompanies.find((company) => company.manager === user.key)
                    ?.name ?? "Nexus3D · Demonstração"),
            role: user.role,
            emailVerified: true,
          },
        });
        const existingAccount = await tx.account.findFirst({
          where: { userId, providerId: "credential" },
        });
        if (!existingAccount && hashes.has(user.key))
          await tx.account.create({
            data: {
              id: id(`account-${user.key}`),
              userId,
              providerId: "credential",
              accountId: userId,
              password: hashes.get(user.key)!,
            },
          });
        if (user.level)
          await tx.supportAgent.upsert({
            where: { userId },
            update: {},
            create: {
              userId,
              teamId: team.id,
              level: user.level,
              availability: "AVAILABLE",
            },
          });
      }
      const members: {
        userId: string;
        company: string;
        dept: string;
        role: "ADMIN" | "MANAGER" | "REQUESTER";
      }[] = [
        {
          userId: id("user-mariana"),
          company: "nexus",
          dept: "admin",
          role: "MANAGER",
        },
        {
          userId: id("user-joao"),
          company: "nexus",
          dept: "finance",
          role: "REQUESTER",
        },
        {
          userId: id("user-carlos"),
          company: "horizonte",
          dept: "admin",
          role: "MANAGER",
        },
      ];
      for (const company of demoCompanies) {
        members.push({
          userId: id("user-admin"),
          company: company.key,
          dept: "technology",
          role: "ADMIN",
        });
        if (master)
          members.push({
            userId: master.id,
            company: company.key,
            dept: "technology",
            role: "ADMIN",
          });
        if (company.key !== "nexus" && company.key !== "horizonte") {
          members.push({
            userId: id(`user-${company.manager}`),
            company: company.key,
            dept: "admin",
            role: "MANAGER",
          });
        }
      }
      for (const member of members)
        await tx.companyMember.upsert({
          where: {
            companyId_userId: {
              companyId: id(`company-${member.company}`),
              userId: member.userId,
            },
          },
          update: {},
          create: {
            companyId: id(`company-${member.company}`),
            userId: member.userId,
            departmentId: id(`dept-${member.company}-${member.dept}`),
            role: member.role,
            status: "ACTIVE",
            approvedAt: now,
          },
        });

      const category = await tx.ticketCategory.upsert({
        where: { name: "Suporte de TI · Demonstração" },
        update: {},
        create: {
          id: id("category"),
          name: "Suporte de TI · Demonstração",
          defaultLevel: "N1",
        },
      });
      const calendar = await tx.businessCalendar.upsert({
        where: { name: "Comercial · Demonstração" },
        update: {},
        create: {
          id: id("calendar"),
          name: "Comercial · Demonstração",
          timeZone: "America/Sao_Paulo",
        },
      });
      for (let weekday = 1; weekday <= 5; weekday++)
        await tx.businessHours.upsert({
          where: {
            calendarId_weekday_startMinute: {
              calendarId: calendar.id,
              weekday,
              startMinute: 480,
            },
          },
          update: {},
          create: {
            calendarId: calendar.id,
            weekday,
            startMinute: 480,
            endMinute: 1080,
          },
        });
      const policy = await tx.slaPolicy.upsert({
        where: {
          name_version: {
            name: "Atendimento empresarial · Demonstração",
            version: 1,
          },
        },
        update: {},
        create: {
          id: id("policy"),
          name: "Atendimento empresarial · Demonstração",
          calendarId: calendar.id,
        },
      });
      const targets = new Map<TicketPriority, string>();
      for (const [priority, first, resolution] of [
        ["CRITICAL", 15, 120],
        ["HIGH", 30, 240],
        ["MEDIUM", 60, 480],
        ["LOW", 120, 960],
      ] as const) {
        const target = await tx.slaTarget.upsert({
          where: { policyId_priority: { policyId: policy.id, priority } },
          update: {},
          create: {
            policyId: policy.id,
            priority,
            firstResponseMinutes: first,
            resolutionMinutes: resolution,
          },
        });
        targets.set(priority, target.id);
      }
      for (const { key: company } of demoCompanies)
        await tx.contract.upsert({
          where: { number: `DEMO-${company.toUpperCase()}-001` },
          update: {},
          create: {
            id: id(`contract-${company}`),
            number: `DEMO-${company.toUpperCase()}-001`,
            companyId: id(`company-${company}`),
            slaPolicyId: policy.id,
            name: "Suporte empresarial demonstrativo",
            status: "ACTIVE",
            startsAt: ago(24 * 60),
            slaGoalPercent: 95,
          },
        });

      const tickets: {
        key: string;
        subject: string;
        status: TicketStatus;
        priority: TicketPriority;
        level: SupportLevel;
        dept: string;
        agent: string;
        company?: string;
        requester?: string;
        pending?: string;
      }[] = [
        {
          key: "erp",
          subject: "Servidor ERP indisponível",
          status: "IN_PROGRESS",
          priority: "CRITICAL",
          level: "N3",
          dept: "technology",
          agent: "bruno",
        },
        {
          key: "vpn",
          subject: "Falha de conexão com a VPN",
          status: "INVESTIGATING",
          priority: "HIGH",
          level: "N2",
          dept: "admin",
          agent: "rafael",
        },
        {
          key: "finance",
          subject: "Acesso ao sistema financeiro",
          status: "OPEN",
          priority: "MEDIUM",
          level: "N1",
          dept: "finance",
          agent: "julia",
        },
        {
          key: "printer",
          subject: "Impressora não reconhecida",
          status: "WAITING_CUSTOMER",
          priority: "LOW",
          level: "N1",
          dept: "finance",
          agent: "julia",
          pending:
            "Envie uma foto do painel da impressora para continuarmos o atendimento.",
        },
        {
          key: "outlook",
          subject: "E-mail não sincroniza no Outlook",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          level: "N1",
          dept: "admin",
          agent: "julia",
        },
        {
          key: "certificate",
          subject: "Instalação do certificado digital",
          status: "RESOLVED",
          priority: "MEDIUM",
          level: "N1",
          dept: "finance",
          agent: "julia",
        },
        {
          key: "software",
          subject: "Instalação de software de gestão",
          status: "WAITING_CUSTOMER",
          priority: "MEDIUM",
          level: "N2",
          dept: "admin",
          agent: "rafael",
          pending: "Precisamos confirmar um horário para o acesso remoto.",
        },
        {
          key: "network",
          subject: "Instabilidade na rede do escritório",
          status: "IN_PROGRESS",
          priority: "HIGH",
          level: "N2",
          dept: "technology",
          agent: "rafael",
        },
        {
          key: "other-company",
          subject: "Novo acesso ao portal do Grupo Horizonte",
          status: "OPEN",
          priority: "LOW",
          level: "N1",
          dept: "admin",
          agent: "julia",
          company: "horizonte",
          requester: id("user-carlos"),
        },
        {
          key: "other-requester",
          subject: "Solicitação de acesso do Financeiro",
          status: "OPEN",
          priority: "LOW",
          level: "N1",
          dept: "finance",
          agent: "julia",
          requester: id("user-joao"),
        },
      ];
      const companyIssues = [
        [
          "Acesso ao prontuário eletrônico",
          "Falha na integração do agendamento",
          "Indisponibilidade no serviço de exames",
        ],
        [
          "Novo acesso ao painel de entregas",
          "Coletores sem sincronização",
          "Falha no processamento de rotas",
        ],
        [
          "Acesso ao ambiente de aprendizagem",
          "Falha no sistema de matrículas",
          "Integração do portal acadêmico indisponível",
        ],
        [
          "Cadastro de operador no caixa",
          "Estoque sem sincronização entre lojas",
          "Falha no processamento de pedidos",
        ],
      ];
      const agentsByLevel = [
        ["camila", "lucas", "julia"],
        ["beatriz", "diego", "rafael"],
        ["renata", "felipe", "bruno"],
      ];
      for (const [companyIndex, company] of demoCompanies.slice(2).entries()) {
        for (const [levelIndex, level] of (
          ["N1", "N2", "N3"] as const
        ).entries()) {
          tickets.push({
            key: `${company.key}-${level.toLowerCase()}`,
            subject: companyIssues[companyIndex][levelIndex],
            status:
              level === "N1"
                ? "OPEN"
                : level === "N2"
                  ? "INVESTIGATING"
                  : "IN_PROGRESS",
            priority:
              level === "N1" ? "LOW" : level === "N2" ? "MEDIUM" : "HIGH",
            level,
            dept: level === "N1" ? "admin" : "technology",
            agent: agentsByLevel[levelIndex][companyIndex % 3],
            company: company.key,
            requester: id(`user-${company.manager}`),
          });
        }
      }
      for (const [index, ticket] of tickets.entries()) {
        const company = ticket.company || "nexus";
        const existing = await tx.ticket.findUnique({
          where: { id: id(`ticket-${ticket.key}`) },
        });
        const createdAt = ago(index + 2);
        const resolvedAt = ticket.status === "RESOLVED" ? ago(1) : null;
        const data: Prisma.TicketUncheckedCreateInput = {
          id: id(`ticket-${ticket.key}`),
          companyId: id(`company-${company}`),
          requesterId: ticket.requester || ownerId,
          departmentId: id(`dept-${company}-${ticket.dept}`),
          contractId: id(`contract-${company}`),
          categoryId: category.id,
          teamId: team.id,
          assigneeId: id(`user-${ticket.agent}`),
          subject: ticket.subject,
          description: `Solicitação demonstrativa: ${ticket.subject}. Acompanhe as atualizações e os próximos passos pelo portal.`,
          status: ticket.status,
          priority: ticket.priority,
          level: ticket.level,
          slaTargetId: targets.get(ticket.priority),
          createdAt,
          firstRespondedAt:
            ticket.status === "OPEN"
              ? null
              : new Date(createdAt.getTime() + 10 * 60000),
          firstResponseMinutes: ticket.status === "OPEN" ? null : 10,
          resolutionMinutes: resolvedAt ? 120 : null,
          firstResponseDueAt: new Date(createdAt.getTime() + 60 * 60000),
          resolutionDueAt: later(
            ticket.priority === "CRITICAL"
              ? 0.4
              : ticket.priority === "HIGH"
                ? 1
                : 4,
          ),
          resolvedAt,
        };
        if (existing) continue;
        await tx.ticket.create({ data });
        await tx.ticketEvent.create({
          data: {
            id: id(`event-${ticket.key}`),
            ticketId: data.id!,
            actorId: ticket.requester || ownerId,
            type: "CREATED",
            visibility: "PUBLIC",
            createdAt,
          },
        });
        await tx.ticketMessage.create({
          data: {
            id: id(`message-${ticket.key}`),
            ticketId: data.id!,
            authorId: id(`user-${ticket.agent}`),
            body:
              ticket.pending ||
              (resolvedAt
                ? "Atendimento concluído. Confirme se está tudo funcionando conforme esperado."
                : "Recebemos sua solicitação e estamos acompanhando o atendimento."),
            visibility: "PUBLIC",
          },
        });
        if (ticket.pending)
          await tx.ticketSlaPause.create({
            data: {
              ticketId: data.id!,
              startedAt: ago(0.5),
              reason: "Aguardando informações do cliente",
            },
          });
        if (ticket.pending)
          await tx.notification.create({
            data: {
              id: id(`notification-${ticket.key}`),
              userId: ticket.requester || ownerId,
              ticketId: data.id!,
              type: "CUSTOMER_REPLY_REQUIRED",
              title: ticket.subject,
              body: ticket.pending,
            },
          });
      }
      for (const [key, title, body] of [
        [
          "request-access",
          "Como solicitar acesso a um sistema",
          "Abra um chamado, informe o sistema e o perfil necessário. Não compartilhe senhas. A liberação depende da aprovação do responsável da empresa.",
        ],
        [
          "reset-password",
          "Redefinir sua senha com segurança",
          "Na tela de acesso, escolha Esqueci minha senha. Informe seu e-mail e use o código recebido para cadastrar uma nova senha. Nunca compartilhe seu código.",
        ],
        [
          "vpn-windows",
          "Configurar VPN no Windows 11",
          "Confira sua conexão com a internet e utilize apenas o cliente VPN aprovado pela empresa. Caso o acesso falhe, abra um chamado com a mensagem de erro, sem incluir credenciais.",
        ],
      ])
        await tx.knowledgeArticle.upsert({
          where: { slug: `demo-${key}` },
          update: {},
          create: {
            id: id(`article-${key}`),
            slug: `demo-${key}`,
            title,
            body,
            categoryId: category.id,
            authorId: id("user-julia"),
            status: "PUBLISHED",
            visibility: "PUBLIC",
            readingMinutes: 3,
            publishedAt: now,
            keywords: ["demonstração", "suporte"],
          },
        });
      return {
        users: demoUsers.length,
        companies: demoCompanies.length,
        tickets: tickets.length,
      };
    },
    { timeout: 30000 },
  );
  console.log(
    `Seed concluída: ${summary.users} contas demonstrativas (1 administrador, 3 agentes por nível e 7 clientes), ${summary.companies} empresas, ${summary.tickets} chamados e 3 artigos preparados sem duplicação.`,
  );
  console.log(
    "Administrador: admin@helpdesk.example.test. Senhas das novas contas: .seed-credentials.local.json (arquivo local ignorado pelo Git). Senhas existentes foram preservadas.",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  seedDatabase()
    .catch(() => {
      console.error(
        "Não foi possível concluir a seed. Confira a conexão, o schema e possíveis conflitos com contas existentes. Nenhuma credencial foi registrada no log.",
      );
      process.exitCode = 1;
    })
    .finally(async () => {
      await defaultPrisma.$disconnect();
    });
