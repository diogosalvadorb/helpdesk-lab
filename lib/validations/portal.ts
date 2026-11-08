import { z } from "zod";

const identifier = z.string().trim().max(200).catch("");
const search = z.string().trim().max(120).catch("");
const page = z.coerce.number().int().min(1).max(10000).catch(1);
const date = z.union([z.iso.date(), z.literal("")]).catch("");
export const knowledgeFilters = z.object({
  q: search,
  category: identifier,
  page,
  status: z.enum(["", "DRAFT", "PUBLISHED", "ARCHIVED"]).catch(""),
  visibility: z.enum(["", "PUBLIC", "INTERNAL"]).catch(""),
});
export const portalTicketFilters = z
  .object({
    q: search,
    page,
    status: z
      .enum([
        "",
        "OPEN",
        "IN_PROGRESS",
        "INVESTIGATING",
        "WAITING_CUSTOMER",
        "RESOLVED",
        "CLOSED",
        "CANCELED",
      ])
      .catch(""),
    priority: z.enum(["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).catch(""),
    department: identifier,
    from: date,
    to: date,
    sort: z.enum(["newest", "oldest", "updated", "priority"]).catch("newest"),
  })
  .transform((v) => ({
    ...v,
    invalidPeriod: Boolean(v.from && v.to && v.from > v.to),
  }));
export const notificationFilters = z.object({
  page,
  read: z.enum(["all", "unread", "read"]).catch("all"),
});
export const notificationReadSchema = z.discriminatedUnion("operation", [
  z
    .object({ operation: z.literal("one"), id: z.string().min(1).max(200) })
    .strict(),
  z
    .object({
      operation: z.literal("all"),
      companyId: z.string().min(1).max(200),
      before: z.iso.datetime(),
    })
    .strict(),
]);
export const articleSchema = z
  .object({
    id: z.string().min(1).max(200).optional(),
    version: z.iso.datetime().optional(),
    submissionKey: z.uuid(),
    title: z
      .string()
      .trim()
      .min(5, "Informe um título com pelo menos 5 caracteres.")
      .max(180, "Use até 180 caracteres no título."),
    slug: z
      .string()
      .trim()
      .min(3, "Informe um identificador com pelo menos 3 caracteres.")
      .max(120, "Use até 120 caracteres no identificador.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use letras minúsculas, números e hífens no identificador.",
      ),
    body: z
      .string()
      .trim()
      .min(20, "Escreva pelo menos 20 caracteres no conteúdo.")
      .max(50000, "Use até 50.000 caracteres no conteúdo."),
    categoryId: z.string().min(1).max(200),
    visibility: z.enum(["PUBLIC", "INTERNAL"]),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    keywords: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Revise as palavras-chave.")
          .max(40, "Use até 40 caracteres por palavra-chave."),
      )
      .max(20, "Use até 20 palavras-chave."),
  })
  .strict();
export type ArticleInput = z.infer<typeof articleSchema>;
export type PortalTicketFilters = z.infer<typeof portalTicketFilters>;
