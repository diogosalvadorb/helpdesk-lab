import { z } from "zod";

const id = z.string().min(1).max(200);
export const lifecycleSchema = z
  .object({
    ticketId: id,
    submissionKey: z.uuid(),
    expectedUpdatedAt: z.iso.datetime(),
    operation: z.enum(["escalate", "resolve", "close", "reopen"]),
    reason: z.string().trim().max(5000).optional(),
    toLevel: z.enum(["N1", "N2", "N3"]).optional(),
    teamId: id.optional(),
    assigneeId: id.optional(),
    adminOverride: z.boolean().default(false),
    notifyCustomer: z.boolean().default(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.operation !== "close" &&
      (!value.reason || value.reason.length < 5)
    )
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Informe um motivo ou solução com pelo menos 5 caracteres.",
      });
    if (value.operation === "escalate" && (!value.toLevel || !value.teamId))
      context.addIssue({
        code: "custom",
        path: ["teamId"],
        message: "Selecione o nível e a equipe de destino.",
      });
  });
export type LifecycleInput = z.infer<typeof lifecycleSchema>;
export const ratingSchema = z
  .object({
    ticketId: id,
    score: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).default(""),
  })
  .strict();
export type RatingInput = z.infer<typeof ratingSchema>;
