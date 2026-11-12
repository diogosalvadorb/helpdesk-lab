import "server-only";

import type { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import {
  portalConfigurationSchema,
  preferenceSchema,
} from "@/lib/validations/settings";

import { SupportInputError, transaction } from "./service-store";
export async function savePreferences(
  userId: string,
  raw: z.infer<typeof preferenceSchema>,
) {
  const input = preferenceSchema.parse(raw);
  return transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { active: true, emailVerified: true },
    });
    if (!user?.active || !user.emailVerified)
      throw new SupportInputError("Seu acesso não está ativo.");
    const before = await tx.notificationPreference.findUnique({
      where: { userId },
    });
    const row = await tx.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
    await tx.administrativeLog.create({
      data: {
        actorId: userId,
        entity: "notificationPreference",
        entityId: userId,
        changes: JSON.parse(
          JSON.stringify({ before, after: row }),
        ) as Prisma.InputJsonValue,
      },
    });
    return row;
  });
}
// The transaction parameter also allows isolated rollback verification without changing live configuration.
export async function persistPortalConfiguration(
  tx: Prisma.TransactionClient,
  userId: string,
  raw: z.infer<typeof portalConfigurationSchema>,
) {
  const input = portalConfigurationSchema.parse(raw),
    actor = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, active: true, emailVerified: true },
    });
  if (actor?.role !== "ADMIN" || !actor.active || !actor.emailVerified)
    throw new SupportInputError(
      "Somente administradores globais podem alterar esta configuração.",
    );
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended('portal-configuration',0))::text`;
  const before = await tx.portalConfiguration.findUnique({
    where: { id: "default" },
  });
  if (before && before.updatedAt.toISOString() !== input.version)
    throw new SupportInputError(
      "A configuração mudou. Recarregue antes de salvar.",
    );
  if (
    input.calendarId &&
    !(await tx.businessCalendar.findUnique({
      where: { id: input.calendarId },
      select: { id: true },
    }))
  )
    throw new SupportInputError("Calendário não encontrado.");
  const { version: _version, ...fields } = input;
  void _version;
  const data = {
    ...fields,
    supportEmail: fields.supportEmail || null,
    supportPhone: fields.supportPhone || null,
    responsibleEmail: fields.responsibleEmail || null,
    calendarId: fields.calendarId || null,
    privacyPublishedAt: input.privacyApproved
      ? new Date()
      : (before?.privacyPublishedAt ?? null),
    termsPublishedAt: input.termsApproved
      ? new Date()
      : (before?.termsPublishedAt ?? null),
  };
  const after = await tx.portalConfiguration.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });
  await tx.administrativeLog.create({
    data: {
      actorId: userId,
      entity: "portalConfiguration",
      entityId: "default",
      changes: JSON.parse(
        JSON.stringify({ before, after }),
      ) as Prisma.InputJsonValue,
    },
  });
  return after;
}
export async function savePortalConfiguration(
  userId: string,
  raw: z.infer<typeof portalConfigurationSchema>,
) {
  return transaction((tx) => persistPortalConfiguration(tx, userId, raw));
}
