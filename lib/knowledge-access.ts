import type { Prisma } from "@/generated/prisma/client";
import type { SupportIdentity } from "@/lib/support-access";
export function knowledgeScope(
  user: SupportIdentity & { id: string },
): Prisma.KnowledgeArticleWhereInput | null {
  if (user.active === false) return null;
  if (user.role === "ADMIN") return {};
  if (
    user.role !== "AGENT" ||
    !user.supportAgent?.active ||
    !user.supportAgent.team.active
  )
    return null;
  return {
    visibility: "INTERNAL",
    OR: [{ authorId: user.id }, { status: "PUBLISHED" }],
  };
}
export function canEditKnowledge(
  user: SupportIdentity & { id: string },
  article: { authorId: string; visibility: string },
) {
  return (
    Boolean(knowledgeScope(user)) &&
    (user.role === "ADMIN" ||
      (article.authorId === user.id && article.visibility === "INTERNAL"))
  );
}
export const readingMinutes = (body: string) =>
  Math.max(
    1,
    Math.ceil(body.trim().split(/\s+/u).filter(Boolean).length / 200),
  );
