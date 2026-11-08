import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { ticketScope } from "@/lib/portal-access";
import { prisma } from "@/lib/prisma";
import { permittedLevels } from "@/lib/support-access";

import { getAuthenticatedUser } from "./authenticated-user";

export const getPortalContext = cache(async () => {
  const user = await getAuthenticatedUser();
  const memberships = await prisma.companyMember.findMany({
    where: { userId: user.id, status: "ACTIVE", company: { status: "ACTIVE" } },
    select: {
      companyId: true,
      role: true,
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const agent =
    user.role === "AGENT" &&
    user.supportAgent?.active &&
    user.supportAgent.team.active
      ? user.supportAgent
      : null;
  const companies =
    user.role === "ADMIN"
      ? await prisma.company.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : user.role === "AGENT"
        ? agent
          ? await prisma.company.findMany({
              where: {
                status: "ACTIVE",
                tickets: {
                  some: {
                    OR: [
                      {
                        teamId: agent.teamId,
                        level: { in: permittedLevels(agent.level) },
                      },
                      { requesterId: user.id, requester: { status: "ACTIVE" } },
                    ],
                  },
                },
              },
              select: { id: true, name: true },
              orderBy: { name: "asc" },
            })
          : []
        : memberships.map((m) => m.company);
  const requested = (await cookies()).get("portal-company")?.value;
  // An invalid selection never falls back to another tenant silently.
  const company = requested
    ? companies.find((c) => c.id === requested) || null
    : companies.find((c) => c.id === memberships[0]?.companyId) ||
      (user.role !== "ADMIN" && companies.length === 1 ? companies[0] : null);
  const membership = memberships.find((m) => m.companyId === company?.id);
  const access = {
    userId: user.id,
    role: user.role,
    companyId: company?.id || null,
    membershipRole: membership?.role,
    teamId: agent?.teamId,
    agentLevel: agent?.level,
  };
  const scope = ticketScope(access);
  const roleLabel =
    user.role === "ADMIN"
      ? "Administrador global"
      : user.role === "AGENT"
        ? "Equipe de suporte"
        : membership?.role === "REQUESTER"
          ? "Solicitante"
          : "Gestão da empresa";
  return {
    user,
    companies,
    company,
    roleLabel,
    canManageDepartments:
      user.role === "ADMIN" ||
      membership?.role === "MANAGER" ||
      membership?.role === "ADMIN",
    scope,
    invalidSelection: Boolean(requested && !company),
  };
});
export type PortalContext = Awaited<ReturnType<typeof getPortalContext>>;
