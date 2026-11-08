import { Ticket } from "lucide-react";
import Link from "next/link";

import type { getNotificationPage } from "@/data/notifications";

import { NotificationActions } from "./notification-actions";
export function NotificationList({
  items,
}: {
  items: Awaited<ReturnType<typeof getNotificationPage>>["items"];
}) {
  return (
    <div className="portal-notification-list">
      {items.length ? (
        items.map((item) => (
          <article
            key={item.id}
            className="portal-notification-row"
            data-unread={!item.readAt}
          >
            <span className="portal-avatar" aria-hidden="true">
              <Ticket />
            </span>
            <div>
              <Link href={item.href}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </Link>
              <small>
                {new Date(item.createdAt).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </small>
              <NotificationActions id={item.id} read={Boolean(item.readAt)} />
            </div>
          </article>
        ))
      ) : (
        <p className="portal-empty">
          Nenhuma notificação disponível neste contexto.
        </p>
      )}
    </div>
  );
}
