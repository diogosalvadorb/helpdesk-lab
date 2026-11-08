import "server-only";

import { notificationFilters } from "@/lib/validations/portal";

import { listScopedNotifications } from "./notification-store";
import { getPortalContext } from "./portal-context";
export async function getNotificationPage(
  raw: Record<string, string | string[] | undefined> = {},
  take = 10,
) {
  const context = await getPortalContext(),
    filters = notificationFilters.parse(raw);
  if (!context.company)
    return {
      filters,
      unread: 0,
      total: 0,
      items: [],
      companyId: null,
      asOf: new Date().toISOString(),
    };
  return listScopedNotifications(
    context.user.id,
    context.company.id,
    filters,
    take,
  );
}
