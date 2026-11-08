import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido."));
export const otpPurposeSchema = z.enum([
  "email-verification",
  "forget-password",
]);
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;
export const sendCodeSchema = z.object({
  email: emailSchema,
  purpose: otpPurposeSchema,
});
export const verifyCodeSchema = sendCodeSchema.extend({
  otp: z.string().regex(/^\d{6}$/, "Informe os seis dígitos do código."),
});
export const newPasswordSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .max(128, "Use no máximo 128 caracteres.");
export const resetPasswordSchema = verifyCodeSchema
  .extend({ password: newPasswordSchema, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });
