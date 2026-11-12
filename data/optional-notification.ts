import "server-only";

import type { Prisma } from "@/generated/prisma/client";
export function ticketEmailAllowed(
  preferences:
    { emailEnabled: boolean; ticketUpdates: boolean } | null | undefined,
) {
  return (
    preferences?.emailEnabled !== false && preferences?.ticketUpdates !== false
  );
}
export async function optionalNotification(
  tx: Prisma.TransactionClient,
  args: { data: Prisma.NotificationUncheckedCreateInput },
) {
  const user = await tx.user.findUnique({
    where: { id: args.data.userId },
    select: {
      active: true,
      preferences: { select: { ticketUpdates: true, slaAlerts: true } },
    },
  });
  if (!user?.active) return null;
  if (
    ["SLA_WARNING", "SLA_BREACHED"].includes(args.data.type) &&
    user.preferences?.slaAlerts === false
  )
    return null;
  if (
    args.data.type.startsWith("TICKET_") ||
    args.data.type === "CUSTOMER_REPLY_REQUIRED"
  )
    if (user.preferences?.ticketUpdates === false) return null;
  return tx.notification.create(args);
}
