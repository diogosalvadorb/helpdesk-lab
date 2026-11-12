import { z } from "zod";
export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe seu nome completo.")
      .max(160, "Use até 160 caracteres."),
  })
  .strict();
export const preferenceSchema = z
  .object({
    emailEnabled: z.boolean(),
    ticketUpdates: z.boolean(),
    slaAlerts: z.boolean(),
  })
  .strict();
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual.").max(128),
    newPassword: z.string().min(8, "Use pelo menos 8 caracteres.").max(128),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
const email = z.union([z.email(), z.literal("")]);
export const portalConfigurationSchema = z
  .object({
    version: z.iso.datetime().optional(),
    organizationName: z.string().trim().max(160),
    supportEmail: email,
    supportPhone: z
      .string()
      .trim()
      .regex(
        /^(?:\+?[0-9 ()-]{7,25})?$/,
        "Informe um telefone válido ou deixe em branco.",
      ),
    responsibleEmail: email,
    calendarId: z.string().max(200),
    privacyText: z.string().trim().max(20000),
    termsText: z.string().trim().max(20000),
    privacyApproved: z.boolean(),
    termsApproved: z.boolean(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.supportPhone &&
      (v.supportPhone.replace(/\D/g, "").length < 7 ||
        v.supportPhone.replace(/\D/g, "").length > 15)
    )
      ctx.addIssue({
        code: "custom",
        message: "Telefone deve conter de 7 a 15 algarismos.",
      });
    if (
      (v.privacyApproved || v.termsApproved) &&
      (!v.organizationName || !v.responsibleEmail)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Para publicar, informe a organização responsável e seu e-mail de contato.",
      });
    if (v.privacyApproved && v.privacyText.length < 100)
      ctx.addIssue({
        code: "custom",
        message:
          "Revise a política de privacidade antes de publicar (mínimo de 100 caracteres).",
      });
    if (v.termsApproved && v.termsText.length < 100)
      ctx.addIssue({
        code: "custom",
        message:
          "Revise os termos antes de publicar (mínimo de 100 caracteres).",
      });
  });
