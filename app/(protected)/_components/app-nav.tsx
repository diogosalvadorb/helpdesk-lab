"use client";

import {
  BookOpen,
  Building2,
  ChartNoAxesColumn,
  Clock3,
  House,
  Plus,
  Settings,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { FeatureNotice } from "./portal-dialog";

export function AppNav({ openCount }: { openCount: number }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="Navegação do portal">
      <SidebarGroup>
        <SidebarGroupLabel className="portal-nav-label">
          Seu atendimento
        </SidebarGroupLabel>
        <SidebarMenu>
          {[
            { href: "/dashboard", label: "Início", icon: House },
            { href: "/chamados", label: "Meus chamados", icon: Ticket },
          ].map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActive(item.href)}
                className={`portal-nav-item ${isActive(item.href) ? "active" : ""}`}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <item.icon aria-hidden="true" />
                {item.label}
                {item.href === "/chamados" && (
                  <span className="portal-nav-count">
                    {openCount.toLocaleString("pt-BR", {
                      minimumIntegerDigits: 2,
                    })}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <FeatureNotice className="portal-nav-item">
              <Plus aria-hidden="true" />
              Abrir chamado
            </FeatureNotice>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/conhecimento" />}
              isActive={isActive("/conhecimento")}
              className={`portal-nav-item ${isActive("/conhecimento") ? "active" : ""}`}
              aria-current={isActive("/conhecimento") ? "page" : undefined}
            >
              <BookOpen aria-hidden="true" />
              Base de conhecimento
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel className="portal-nav-label">
          Organização
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/sla" />}
              isActive={isActive("/sla")}
              className={`portal-nav-item ${isActive("/sla") ? "active" : ""}`}
              aria-current={isActive("/sla") ? "page" : undefined}
            >
              <Clock3 aria-hidden="true" />
              Painel SLA
            </SidebarMenuButton>
          </SidebarMenuItem>
          {[
            { label: "Relatórios", icon: ChartNoAxesColumn },
            { label: "Departamentos", icon: Building2 },
            { label: "Configurações", icon: Settings },
          ].map((item) => (
            <SidebarMenuItem key={item.label}>
              <FeatureNotice className="portal-nav-item">
                <item.icon aria-hidden="true" />
                {item.label}
              </FeatureNotice>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </nav>
  );
}

export function PortalBreadcrumb() {
  const pathname = usePathname();
  const labels: Record<string, string> = {
    "/dashboard": "Início",
    "/chamados": "Meus chamados",
    "/conhecimento": "Base de conhecimento",
    "/sla": "Painel SLA",
  };
  return (
    <nav className="portal-breadcrumb" aria-label="Localização">
      Portal do cliente <span aria-hidden="true">/</span>
      <b>{labels[pathname] || "Atendimento"}</b>
    </nav>
  );
}
