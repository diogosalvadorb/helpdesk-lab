"use client";

import { BookOpen, House, Menu, Plus, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="portal-mobile-menu"
            aria-label="Abrir menu de navegação"
          />
        }
      >
        <Menu aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="portal-dialog portal-mobile-drawer">
        <DialogHeader className="sr-only">
          <DialogTitle>Menu do portal</DialogTitle>
          <DialogDescription>
            Escolha uma empresa ou navegue pelo atendimento.
          </DialogDescription>
        </DialogHeader>
        <div
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a[href]"))
              setOpen(false);
          }}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function MobileNavigation() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    (pathname === href || pathname.startsWith(`${href}/`)) &&
    !(href === "/chamados" && pathname === "/chamados/novo");
  return (
    <nav className="portal-mobile-nav" aria-label="Navegação rápida">
      {[
        { href: "/dashboard", label: "Início", icon: House },
        { href: "/chamados", label: "Chamados", icon: Ticket },
      ].map((item) => (
        <Link
          key={item.href}
          className={isActive(item.href) ? "active" : ""}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          <item.icon aria-hidden="true" />
          {item.label}
        </Link>
      ))}
      <Link
        href="/chamados/novo"
        className={pathname === "/chamados/novo" ? "active" : ""}
        aria-current={pathname === "/chamados/novo" ? "page" : undefined}
      >
        <Plus aria-hidden="true" />
        Abrir chamado
      </Link>
      <Link
        className={pathname === "/conhecimento" ? "active" : ""}
        href="/conhecimento"
        aria-current={pathname === "/conhecimento" ? "page" : undefined}
      >
        <BookOpen aria-hidden="true" />
        Conhecimento
      </Link>
    </nav>
  );
}
