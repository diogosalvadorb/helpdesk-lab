import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getNotificationPage } from "@/data/notifications";
import { getPortalContext } from "@/data/portal-context";

import { NotificationActions } from "../_components/notification-actions";
import { NotificationList } from "../_components/notification-list";
import { PendingAccess } from "../_components/pending-access";
import { QueryPagination } from "../_components/query-pagination";
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const data = await getNotificationPage(await searchParams);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Seu atendimento em dia</p>
          <h1>Notificações</h1>
          <p>{data.unread} não lida(s) na empresa selecionada.</p>
        </div>
        <NotificationActions companyId={data.companyId} before={data.asOf} />
      </div>
      <Card className="portal-panel">
        <nav className="portal-queue-tabs" aria-label="Filtrar notificações">
          {[
            ["all", "Todas"],
            ["unread", "Não lidas"],
            ["read", "Lidas"],
          ].map(([read, label]) => (
            <Link
              key={read}
              href={`/notificacoes?read=${read}`}
              aria-current={data.filters.read === read ? "page" : undefined}
              className={data.filters.read === read ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>
        <NotificationList items={data.items} />
        <QueryPagination
          path="/notificacoes"
          filters={data.filters}
          page={data.filters.page}
          total={data.total}
        />
      </Card>
    </>
  );
}
