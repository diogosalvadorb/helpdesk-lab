import type { Prisma, SupportLevel } from "@/generated/prisma/client";

export const supportLevels: SupportLevel[] = ["N1", "N2", "N3"];
export function permittedLevels(level: SupportLevel) {
  return supportLevels.slice(0, supportLevels.indexOf(level) + 1);
}
export type SupportIdentity = {
  role: string;
  supportAgent: {
    active: boolean;
    teamId: string;
    level: SupportLevel;
    team: { active: boolean };
  } | null;
};
export function operationScope(
  user: SupportIdentity,
): Prisma.TicketWhereInput | null {
  if (user.role === "ADMIN") return { company: { status: "ACTIVE" } };
  const agent = user.supportAgent;
  if (user.role !== "AGENT" || !agent?.active || !agent.team.active)
    return null;
  return {
    company: { status: "ACTIVE" },
    teamId: agent.teamId,
    team: { active: true },
    level: { in: permittedLevels(agent.level) },
  };
}
