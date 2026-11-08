import type { CompanyRole, Prisma, UserRole } from "@/generated/prisma/client";

export type TicketAccess = {
  userId: string;
  role: UserRole;
  companyId: string | null;
  membershipRole?: CompanyRole;
  teamId?: string;
};

export function ticketScope(access: TicketAccess): Prisma.TicketWhereInput {
  if (!access.companyId) return { id: { in: [] } };
  const company = {
    companyId: access.companyId,
    company: { status: "ACTIVE" as const },
  };
  if (access.role === "ADMIN") return company;
  if (access.role === "AGENT")
    return access.teamId
      ? { ...company, teamId: access.teamId, team: { active: true } }
      : { id: { in: [] } };
  if (!access.membershipRole) return { id: { in: [] } };
  return access.membershipRole === "REQUESTER"
    ? { ...company, requesterId: access.userId }
    : company;
}
