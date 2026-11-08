import { z } from "zod";

const identifier = z.string().trim().min(1, "Selecione uma opção.").max(200);

export const createTicketSchema = z
  .object({
    companyId: identifier,
    submissionKey: z.uuid(),
    departmentId: identifier,
    categoryId: identifier,
    subject: z
      .string()
      .trim()
      .min(5, "Informe pelo menos 5 caracteres.")
      .max(160, "Use até 160 caracteres."),
    description: z
      .string()
      .trim()
      .min(20, "Descreva o problema com pelo menos 20 caracteres.")
      .max(10000, "Use até 10.000 caracteres."),
    impact: z.enum(["LOW", "MEDIUM", "HIGH"], {
      error: "Selecione o impacto.",
    }),
  })
  .strict();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
