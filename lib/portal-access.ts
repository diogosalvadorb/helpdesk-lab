import type {
  CompanyRole,
  Prisma,
  SupportLevel,
  UserRole,
} from "@/generated/prisma/client";
import { permittedLevels } from "@/lib/support-access";

export type TicketAccess = {
  userId: string;
  role: UserRole;
  companyId: string | null;
  membershipRole?: CompanyRole;
  teamId?: string;
  agentLevel?: SupportLevel;
};

export function ticketScope(access: TicketAccess): Prisma.TicketWhereInput {
  if (!access.companyId) return { id: { in: [] } };
  const company = {
    companyId: access.companyId,
    company: { status: "ACTIVE" as const },
  };
  if (access.role === "ADMIN") return company;
  if (access.role === "AGENT")
    return access.teamId && access.agentLevel
      ? {
          ...company,
          OR: [
            {
              teamId: access.teamId,
              team: { active: true },
              level: { in: permittedLevels(access.agentLevel) },
            },
            { requesterId: access.userId, requester: { status: "ACTIVE" } },
          ],
        }
      : { id: { in: [] } };
  if (!access.membershipRole) return { id: { in: [] } };
  return access.membershipRole === "REQUESTER"
    ? { ...company, requesterId: access.userId }
    : company;
}
