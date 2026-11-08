import { z } from "zod";

import { emailSchema } from "./otp";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
  rememberMe: z.boolean(),
});
