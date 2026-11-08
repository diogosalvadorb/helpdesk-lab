import "server-only";

import { notFound } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { canEditKnowledge, knowledgeScope } from "@/lib/knowledge-access";
import { prisma } from "@/lib/prisma";
import { knowledgeFilters } from "@/lib/validations/portal";

import { getAuthenticatedUser } from "./authenticated-user";
import { getPortalContext } from "./portal-context";

export const publicArticleWhere = {
  status: "PUBLISHED",
  visibility: "PUBLIC",
  category: { active: true },
} satisfies Prisma.KnowledgeArticleWhereInput;
export const publicArticleSelect = {
  id: true,
  title: true,
  body: true,
  readingMinutes: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.KnowledgeArticleSelect;
export type PublicArticle = Prisma.KnowledgeArticleGetPayload<{
  select: typeof publicArticleSelect;
}>;
export async function getPublicKnowledgeSuggestions(limit = 3) {
  const context = await getPortalContext();
  if (!context.company) return [];
  return prisma.knowledgeArticle.findMany({
    where: publicArticleWhere,
    select: publicArticleSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take: Math.min(30, Math.max(1, limit)),
  });
}
export async function getKnowledgeList(
  raw: Record<string, string | string[] | undefined>,
  operation = false,
) {
  const context = await getPortalContext(),
    filters = knowledgeFilters.parse(raw);
  const scope = operation ? knowledgeScope(context.user) : publicArticleWhere;
  if (!scope || (operation === false && !context.company)) return null;
  const search: Prisma.KnowledgeArticleWhereInput = filters.q
    ? {
        OR: [
          { title: { contains: filters.q, mode: "insensitive" } },
          { body: { contains: filters.q, mode: "insensitive" } },
          {
            keywords: {
              hasSome: [
                filters.q,
                filters.q.toLocaleLowerCase("pt-BR"),
                filters.q.toLocaleUpperCase("pt-BR"),
              ],
            },
          },
        ],
      }
    : {};
  const where: Prisma.KnowledgeArticleWhereInput = {
    AND: [
      scope,
      search,
      {
        ...(filters.category ? { categoryId: filters.category } : {}),
        ...(operation && filters.status ? { status: filters.status } : {}),
        ...(operation && filters.visibility
          ? { visibility: filters.visibility }
          : {}),
      },
    ],
  };
  const [articles, total, categories, groups] = await prisma.$transaction(
    [
      prisma.knowledgeArticle.findMany({
        where,
        select: {
          ...publicArticleSelect,
          ...(operation
            ? { status: true, visibility: true, authorId: true }
            : {}),
          author: { select: { name: true } },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * 10,
        take: 10,
      }),
      prisma.knowledgeArticle.count({ where }),
      prisma.ticketCategory.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.knowledgeArticle.groupBy({
        by: ["categoryId"],
        orderBy: { categoryId: "asc" },
        where: scope,
        _count: { _all: true },
      }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
  return {
    articles: articles.map((a) => ({
      ...a,
      editable:
        operation &&
        canEditKnowledge(
          context.user,
          a as typeof a & { authorId: string; visibility: string },
        ),
    })),
    total,
    categories: categories.map((c) => {
      const group = groups.find((g) => g.categoryId === c.id);
      return {
        ...c,
        count: typeof group?._count === "object" ? (group._count._all ?? 0) : 0,
      };
    }),
    filters,
    operation,
  };
}
export async function getPublicArticle(id: string) {
  const context = await getPortalContext();
  if (!context.company) return null;
  return prisma.knowledgeArticle.findFirst({
    where: { AND: [publicArticleWhere, { id }] },
    select: publicArticleSelect,
  });
}
export async function getKnowledgeEditor(id?: string, preview = false) {
  const user = await getAuthenticatedUser(),
    scope = knowledgeScope(user);
  if (!scope) notFound();
  const article = id
    ? await prisma.knowledgeArticle.findFirst({
        where: { AND: [scope, { id }] },
        include: {
          category: { select: { name: true } },
          author: { select: { name: true } },
        },
      })
    : null;
  if (id && (!article || (!preview && !canEditKnowledge(user, article))))
    notFound();
  const categories = await prisma.ticketCategory.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return {
    article,
    categories,
    admin: user.role === "ADMIN",
    editable: article ? canEditKnowledge(user, article) : true,
  };
}
