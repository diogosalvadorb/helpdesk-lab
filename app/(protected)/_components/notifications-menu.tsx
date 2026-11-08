"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { getNotificationPage } from "@/data/notifications";

import { NotificationActions } from "./notification-actions";
import { NotificationList } from "./notification-list";

export function NotificationsMenu({
  unread,
  items,
  companyId,
  asOf,
}: Awaited<ReturnType<typeof getNotificationPage>>) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="portal-icon-button portal-notifications-trigger"
          />
        }
      >
        <Bell aria-label="Notificações" />
        <span className="sr-only">Notificações, {unread} não lidas</span>
        {unread > 0 && (
          <span className="portal-notification-count" aria-hidden="true">
            {unread}
          </span>
        )}
      </DialogTrigger>
      <DialogContent
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a[href]")) setOpen(false);
        }}
        className="portal-dialog portal-notification-drawer"
      >
        <DialogHeader>
          <DialogTitle>Notificações</DialogTitle>
          <DialogDescription>
            Atualizações do atendimento na empresa selecionada.
          </DialogDescription>
        </DialogHeader>
        <NotificationActions companyId={companyId} before={asOf} />
        <NotificationList items={items} />
        <Link href="/notificacoes" className="portal-outline-button">
          Ver todas as notificações →
        </Link>
      </DialogContent>
    </Dialog>
  );
}
