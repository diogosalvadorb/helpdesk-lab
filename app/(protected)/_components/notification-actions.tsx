"use client";
import { useState, useTransition } from "react";

import { readNotifications } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
export function NotificationActions({
  id,
  companyId,
  before,
  read,
}: {
  id?: string;
  companyId?: string | null;
  before?: string;
  read?: boolean;
}) {
  const [pending, startTransition] = useTransition(),
    [message, setMessage] = useState("");
  return (
    <div>
      {read ? (
        <small>Lida</small>
      ) : (
        <Button
          variant="link"
          className="portal-text-button"
          disabled={pending || (!id && (!companyId || !before))}
          onClick={() =>
            startTransition(async () => {
              const r = await readNotifications(
                id
                  ? { operation: "one", id }
                  : {
                      operation: "all",
                      companyId: companyId!,
                      before: before!,
                    },
              );
              setMessage(
                r?.data?.ok
                  ? id
                    ? "Notificação marcada como lida."
                    : "Notificações deste contexto marcadas como lidas."
                  : r?.data?.message ||
                      r?.serverError ||
                      "Não foi possível atualizar as notificações.",
              );
            })
          }
        >
          {pending
            ? "Atualizando…"
            : id
              ? "Marcar como lida"
              : "Marcar todas como lidas"}
        </Button>
      )}
      {message && (
        <p role="status" className="portal-muted">
          {message}
        </p>
      )}
    </div>
  );
}
