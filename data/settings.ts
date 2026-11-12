import "server-only";

import { prisma } from "@/lib/prisma";

import { requireGlobalAdministrator } from "./administration";
import { getAuthenticatedUser } from "./authenticated-user";
export async function getAccountSettings() {
  const user = await getAuthenticatedUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      preferences: {
        select: { emailEnabled: true, ticketUpdates: true, slaAlerts: true },
      },
    },
  });
}
export async function getWorkspaceSettings() {
  await requireGlobalAdministrator();
  const [configuration, calendars, logs] = await Promise.all([
    prisma.portalConfiguration.findUnique({ where: { id: "default" } }),
    prisma.businessCalendar.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.administrativeLog.findMany({
      where: { entity: "portalConfiguration" },
      take: 5,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: { id: true, createdAt: true, actor: { select: { name: true } } },
    }),
  ]);
  return { configuration, calendars, logs };
}
export async function getPublicInformation() {
  const config = await prisma.portalConfiguration.findUnique({
    where: { id: "default" },
    include: {
      calendar: {
        include: {
          hours: { orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] },
          holidays: { select: { date: true, name: true } },
        },
      },
    },
  });
  return {
    organizationName: config?.organizationName || null,
    supportEmail: config?.supportEmail ?? null,
    supportPhone: config?.supportPhone ?? null,
    responsibleEmail: config?.responsibleEmail ?? null,
    calendar: config?.calendar ?? null,
    privacy: config?.privacyApproved
      ? { body: config.privacyText, publishedAt: config.privacyPublishedAt }
      : null,
    terms: config?.termsApproved
      ? { body: config.termsText, publishedAt: config.termsPublishedAt }
      : null,
  };
}
