import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.email("Email inválido"),
  company: z.string().trim().min(1, "Informe a empresa"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(128, "Senha deve ter no máximo 128 caracteres"),
  acceptTerms: z.boolean().refine((accepted) => accepted, {
    message:
      "Aceite os Termos de uso e a Política de privacidade para continuar.",
  }),
});
