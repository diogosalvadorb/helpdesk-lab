import { z } from "zod";

const id = z.string().trim().min(1).max(200);
export const replySchema = z
  .object({
    ticketId: id,
    companyId: id,
    submissionKey: z.uuid(),
    audience: z.enum(["portal", "operation"]),
    visibility: z.enum(["PUBLIC", "INTERNAL"]),
    body: z
      .string()
      .trim()
      .min(1, "Escreva uma mensagem.")
      .max(10000, "Use até 10.000 caracteres."),
  })
  .strict();
export type ReplyInput = z.infer<typeof replySchema>;

export const serviceActionSchema = z
  .object({
    ticketId: id,
    submissionKey: z.uuid(),
    expectedUpdatedAt: z.iso.datetime(),
    operation: z.enum(["claim", "assign", "route", "start", "wait"]),
    assigneeId: id.optional(),
    teamId: id.optional(),
    reason: z.string().trim().max(1000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.operation === "assign" && !value.assigneeId)
      context.addIssue({
        code: "custom",
        path: ["assigneeId"],
        message: "Selecione um responsável.",
      });
    if (value.operation === "route" && !value.teamId)
      context.addIssue({
        code: "custom",
        path: ["teamId"],
        message: "Selecione uma equipe.",
      });
    if (value.operation === "wait" && !value.reason)
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Informe o motivo da espera.",
      });
  });
export type ServiceActionInput = z.infer<typeof serviceActionSchema>;
export const queueFilterSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  level: z.enum(["N1", "N2", "N3"]).optional().catch(undefined),
  status: z
    .enum([
      "OPEN",
      "IN_PROGRESS",
      "INVESTIGATING",
      "WAITING_CUSTOMER",
      "RESOLVED",
      "CLOSED",
      "CANCELED",
    ])
    .optional()
    .catch(undefined),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional()
    .catch(undefined),
  team: z.string().max(200).optional().catch(undefined),
  company: z.string().max(200).optional().catch(undefined),
  q: z.string().trim().max(120).catch(""),
  triage: z.enum(["true", "false"]).optional().catch(undefined),
});
