import "server-only";

import { createHash } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import {
  canEditKnowledge,
  knowledgeScope,
  readingMinutes,
} from "@/lib/knowledge-access";
import { type ArticleInput, articleSchema } from "@/lib/validations/portal";

import { SupportInputError, transaction, userSelection } from "./service-store";

export async function saveKnowledgeArticle(userId: string, raw: ArticleInput) {
  const input = articleSchema.parse(raw);
  const fingerprint = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex"),
    auditId = `article-${createHash("sha256").update(`${userId}:${input.submissionKey}`).digest("hex")}`;
  return transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended('knowledge-publication', 0))::text`;
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: userSelection,
    });
    if (!user?.active || !user.emailVerified || !knowledgeScope(user))
      throw new SupportInputError(
        "Você não tem permissão para gerir a base de conhecimento.",
      );
    const old = input.id
      ? await tx.knowledgeArticle.findUnique({ where: { id: input.id } })
      : null;
    if (input.id && (!old || !canEditKnowledge(user, old)))
      throw new SupportInputError(
        "Artigo indisponível para edição nesta conta.",
      );
    if (
      user.role !== "ADMIN" &&
      (input.visibility !== "INTERNAL" || old?.visibility === "PUBLIC")
    )
      throw new SupportInputError(
        "Somente um administrador global pode gerir conteúdo público.",
      );
    const previous = await tx.administrativeLog.findUnique({
      where: { id: auditId },
    });
    if (previous) {
      const metadata = previous.changes as { fingerprint?: string };
      if (metadata.fingerprint !== fingerprint)
        throw new SupportInputError(
          "Esta submissão já foi usada com outros dados. Reabra o formulário.",
        );
      return { id: previous.entityId };
    }
    if (
      old &&
      (!input.version || old.updatedAt.toISOString() !== input.version)
    )
      throw new SupportInputError(
        "Este artigo mudou. Recarregue antes de salvar.",
      );
    const category = await tx.ticketCategory.findFirst({
      where: { id: input.categoryId, active: true },
      select: { id: true },
    });
    if (!category)
      throw new SupportInputError("Selecione uma categoria ativa.");
    const data = {
      title: input.title,
      slug: input.slug,
      body: input.body,
      categoryId: category.id,
      visibility: input.visibility,
      status: input.status,
      keywords: [
        ...new Set(
          input.keywords.map((keyword) => keyword.toLocaleLowerCase("pt-BR")),
        ),
      ],
      readingMinutes: readingMinutes(input.body),
      publishedAt:
        input.status === "PUBLISHED"
          ? old?.status === "PUBLISHED"
            ? (old.publishedAt ?? new Date())
            : new Date()
          : (old?.publishedAt ?? null),
    };
    const row = old
      ? await tx.knowledgeArticle.update({
          where: { id: old.id },
          data: {
            ...data,
            updatedAt: new Date(
              Math.max(Date.now(), old.updatedAt.getTime() + 1),
            ),
          },
        })
      : await tx.knowledgeArticle.create({
          data: { ...data, authorId: userId },
        });
    await tx.administrativeLog.create({
      data: {
        id: auditId,
        actorId: userId,
        entity: "knowledgeArticle",
        entityId: row.id,
        changes: JSON.parse(
          JSON.stringify({ fingerprint, before: old, after: row }),
        ) as Prisma.InputJsonValue,
      },
    });
    return { id: row.id };
  });
}
