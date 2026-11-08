"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PortalDialog({
  label,
  title,
  description,
  children,
  className = "portal-text-button",
}: {
  label: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className={className} />}>
        {label}
      </DialogTrigger>
      <DialogContent className="portal-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function FeatureNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <PortalDialog
      label={children}
      title="Em breve no seu portal"
      description="Este recurso ainda está em desenvolvimento. Nenhuma solicitação foi criada ou alterada."
      className={className}
    >
      <p className="portal-muted">
        Para esta necessidade, utilize o canal de suporte indicado no contrato
        da sua empresa.
      </p>
    </PortalDialog>
  );
}
