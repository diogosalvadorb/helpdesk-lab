import { z } from "zod";

const id = z.string().trim().min(1).max(180);
const name = z
  .string()
  .trim()
  .min(2, "Informe pelo menos 2 caracteres.")
  .max(160);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const base = { id: id.optional(), version: z.iso.datetime().optional() };
const date = z.iso
  .date()
  .refine(
    (v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
    "Data inválida.",
  );
export const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const administrationSchema = z.discriminatedUnion("entity", [
  z
    .object({
      ...base,
      entity: z.literal("company"),
      name,
      legalName: optionalText(180),
      taxId: z
        .string()
        .trim()
        .regex(/^(?:\d{11}|\d{14})?$/, "Use 11 ou 14 dígitos no documento."),
      contactName: optionalText(160),
      contactEmail: z.union([z.email(), z.literal("")]),
      contactPhone: optionalText(30),
      internalNotes: optionalText(5000),
      status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
    })
    .strict(),
  z
    .object({
      ...base,
      entity: z.literal("department"),
      companyId: id,
      name,
      description: optionalText(1000),
      active: z.boolean(),
    })
    .strict(),
  z
    .object({
      entity: z.literal("member"),
      companyId: id,
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      departmentId: z.union([id, z.literal("")]),
      role: z.enum(["REQUESTER", "MANAGER", "ADMIN"]),
      status: z.enum(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"]),
      version: z.iso.datetime().optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      entity: z.literal("team"),
      name,
      description: optionalText(1000),
      active: z.boolean(),
    })
    .strict(),
  z
    .object({
      entity: z.literal("agent"),
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      teamId: id,
      level: z.enum(["N1", "N2", "N3"]),
      availability: z.enum(["AVAILABLE", "BUSY", "AWAY", "OFFLINE"]),
      maxActiveTickets: z.number().int().min(1).max(200),
      active: z.boolean(),
      version: z.iso.datetime().optional(),
    })
    .strict(),
  z
    .object({
      entity: z.literal("user"),
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      role: z.enum(["CLIENT", "AGENT", "ADMIN"]),
      active: z.boolean(),
      version: z.iso.datetime().optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      entity: z.literal("contract"),
      companyId: id,
      number: name,
      name,
      slaPolicyId: id,
      status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "CANCELED"]),
      startsAt: date,
      endsAt: z.union([date, z.literal("")]),
      slaGoalPercent: z.number().min(0.01).max(100),
    })
    .strict()
    .refine(
      (v) => !v.endsAt || v.endsAt >= v.startsAt,
      "O fim da vigência deve ser igual ou posterior ao início.",
    ),
  z
    .object({
      ...base,
      entity: z.literal("calendar"),
      name,
      timeZone: z
        .string()
        .min(1)
        .max(100)
        .refine((v) => {
          try {
            new Intl.DateTimeFormat("pt-BR", { timeZone: v });
            return true;
          } catch {
            return false;
          }
        }, "Fuso IANA inválido."),
      alwaysOpen: z.boolean(),
      hours: z
        .array(
          z
            .object({
              weekday: z.number().int().min(0).max(6),
              startMinute: z.number().int().min(0).max(1439),
              endMinute: z.number().int().min(1).max(1440),
            })
            .strict()
            .refine(
              (h) => h.startMinute < h.endMinute,
              "O fim deve ser posterior ao início.",
            ),
        )
        .max(28),
      holidays: z.array(z.object({ date, name }).strict()).max(366),
    })
    .strict()
    .superRefine((v, ctx) => {
      if (!v.alwaysOpen && !v.hours.length)
        ctx.addIssue({
          code: "custom",
          message: "Informe ao menos um intervalo de atendimento.",
        });
      const sorted = [...v.hours].sort(
        (a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute,
      );
      if (
        sorted.some(
          (h, i) =>
            i > 0 &&
            sorted[i - 1].weekday === h.weekday &&
            sorted[i - 1].endMinute > h.startMinute,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Os intervalos não podem se sobrepor.",
        });
      if (new Set(v.holidays.map((h) => h.date)).size !== v.holidays.length)
        ctx.addIssue({ code: "custom", message: "Há feriados repetidos." });
    }),
  z
    .object({
      ...base,
      entity: z.literal("policy"),
      name,
      calendarId: id,
      active: z.boolean(),
      pauseWhileWaitingCustomer: z.boolean(),
      targets: z
        .array(
          z
            .object({
              priority: z.enum(priorities),
              firstResponseMinutes: z.number().int().min(1).max(525600),
              resolutionMinutes: z.number().int().min(1).max(525600),
              warningPercent: z.number().int().min(1).max(100),
            })
            .strict()
            .refine(
              (t) => t.resolutionMinutes >= t.firstResponseMinutes,
              "A resolução não pode ter meta menor que a primeira resposta.",
            ),
        )
        .length(4),
      rules: z
        .array(
          z
            .object({
              fromLevel: z.enum(["N1", "N2"]),
              toLevel: z.enum(["N2", "N3"]),
              resolutionPercent: z.number().int().min(1).max(100),
              active: z.boolean(),
            })
            .strict()
            .refine(
              (r) =>
                Number(r.toLevel.slice(1)) === Number(r.fromLevel.slice(1)) + 1,
              "Use N1 → N2 ou N2 → N3.",
            ),
        )
        .max(2),
    })
    .strict()
    .superRefine((v, ctx) => {
      if (new Set(v.targets.map((t) => t.priority)).size !== 4)
        ctx.addIssue({
          code: "custom",
          message: "Informe uma meta para cada prioridade.",
        });
      if (new Set(v.rules.map((r) => r.fromLevel)).size !== v.rules.length)
        ctx.addIssue({
          code: "custom",
          message: "Não repita a origem de uma regra.",
        });
    }),
  z
    .object({
      entity: z.literal("policyState"),
      id,
      version: z.iso.datetime(),
      active: z.boolean(),
    })
    .strict(),
]);
export type AdministrationInput = z.infer<typeof administrationSchema>;
export const administrationFilters = z.object({
  q: z.string().trim().max(120).catch(""),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
  company: z.string().max(180).catch(""),
  status: z.string().max(30).catch(""),
});
