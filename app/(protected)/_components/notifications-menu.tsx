"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";

import { markNotificationRead } from "@/actions/portal";
import { Button } from "@/components/ui/button";

import { PortalDialog } from "./portal-dialog";

export function NotificationsMenu({
  unread,
  items,
}: {
  unread: number;
  items: {
    id: string;
    title: string;
    body: string | null;
    readAt: string | null;
  }[];
}) {
  const router = useRouter();
  const action = useAction(markNotificationRead, {
    onSuccess({ data }) {
      if (data?.ok) router.refresh();
    },
  });
  return (
    <PortalDialog
      className="portal-icon-button portal-notifications-trigger"
      label={
        <>
          <Bell aria-label="Notificações" />
          <span className="sr-only">Notificações, {unread} não lidas</span>
          {unread > 0 && (
            <span className="portal-notification-count" aria-hidden="true">
              {unread}
            </span>
          )}
        </>
      }
      title="Suas notificações"
      description="Atualizações do seu atendimento na empresa selecionada."
    >
      <div className="portal-notification-list">
        {items.length ? (
          items.map((item) => (
            <article key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              {!item.readAt ? (
                <Button
                  variant="link"
                  className="portal-text-button"
                  disabled={action.isPending}
                  onClick={() => action.execute({ id: item.id })}
                >
                  Marcar como lida
                </Button>
              ) : (
                <small>Lida</small>
              )}
            </article>
          ))
        ) : (
          <p>Nenhuma notificação por aqui.</p>
        )}
        {(action.result.serverError || action.result.data?.ok === false) && (
          <p role="alert">Não foi possível atualizar a notificação.</p>
        )}
      </div>
    </PortalDialog>
  );
}
