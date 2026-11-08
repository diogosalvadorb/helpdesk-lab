import { getPortalNotifications, getServiceAgreement } from "@/data/dashboard";
import type { PortalContext } from "@/data/portal-context";
import { initials } from "@/lib/portal-format";

import { PortalBreadcrumb } from "./app-nav";
import { AppSidebar } from "./app-sidebar";
import { MobileMenu } from "./mobile-navigation";
import { NotificationsMenu } from "./notifications-menu";

export async function PortalHeader({
  context,
  openCount,
}: {
  context: PortalContext;
  openCount: number;
}) {
  const [notifications, agreement] = await Promise.all([
    getPortalNotifications(),
    getServiceAgreement(),
  ]);
  let availability = "Horário não informado";
  if (agreement) {
    const calendar = agreement.slaPolicy.calendar;
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: calendar.timeZone,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(now);
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      parts.find((p) => p.type === "weekday")!.value,
    );
    const minutes =
      Number(parts.find((p) => p.type === "hour")!.value) * 60 +
      Number(parts.find((p) => p.type === "minute")!.value);
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: calendar.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const holiday = calendar.holidays.some(
      (h) => h.date.toISOString().slice(0, 10) === date,
    );
    const working =
      calendar.alwaysOpen ||
      (!holiday &&
        calendar.hours.some(
          (h) =>
            h.weekday === weekday &&
            h.startMinute <= minutes &&
            minutes < h.endMinute,
        ));
    availability = working
      ? "Dentro do horário de suporte"
      : "Fora do horário de suporte";
  }
  return (
    <header className="portal-topbar">
      <MobileMenu>
        <AppSidebar context={context} openCount={openCount} />
      </MobileMenu>
      <PortalBreadcrumb />
      <span className="portal-brand portal-mobile-brand">helpdesk.</span>
      <div className="portal-topbar-end">
        <span className="portal-availability">{availability}</span>
        <NotificationsMenu {...notifications} />
        <span className="portal-avatar" aria-label={context.user.name}>
          {initials(context.user.name)}
        </span>
      </div>
    </header>
  );
}
