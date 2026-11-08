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

export function AppNav({
  openCount,
  operationAvailable = false,
}: {
  openCount: number;
  operationAvailable?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    (pathname === href || pathname.startsWith(`${href}/`)) &&
    !(href === "/chamados" && pathname === "/chamados/novo");
  if (operationAvailable && pathname.startsWith("/operacao/"))
    return (
      <nav aria-label="Navegação da operação">
        <SidebarGroup>
          <SidebarGroupLabel className="portal-nav-label">
            Atendimento
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <FeatureNotice className="portal-nav-item">
                <House aria-hidden="true" />
                Visão geral
              </FeatureNotice>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/operacao/filas" />}
                isActive={!pathname.startsWith("/operacao/sla")}
                className={`portal-nav-item ${!pathname.startsWith("/operacao/sla") ? "active" : ""}`}
                aria-current={
                  !pathname.startsWith("/operacao/sla") ? "page" : undefined
                }
              >
                <Ticket aria-hidden="true" />
                Chamados
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/operacao/sla" />}
                isActive={pathname.startsWith("/operacao/sla")}
                className={`portal-nav-item ${pathname.startsWith("/operacao/sla") ? "active" : ""}`}
                aria-current={
                  pathname.startsWith("/operacao/sla") ? "page" : undefined
                }
              >
                <Clock3 aria-hidden="true" />
                Painel SLA
              </SidebarMenuButton>
            </SidebarMenuItem>
            {[
              { label: "Base de conhecimento", icon: BookOpen },
              { label: "Relatórios", icon: ChartNoAxesColumn },
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
        <SidebarGroup>
          <SidebarGroupLabel className="portal-nav-label">
            Organização
          </SidebarGroupLabel>
          <SidebarMenu>
            {[
              { label: "Empresas clientes", icon: Building2 },
              { label: "Departamentos", icon: Building2 },
              { label: "Equipe de suporte", icon: House },
              { label: "Configurações", icon: Settings },
            ].map((item) => (
              <SidebarMenuItem key={item.label}>
                <FeatureNotice className="portal-nav-item">
                  <item.icon aria-hidden="true" />
                  {item.label}
                </FeatureNotice>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/dashboard" />}
                className="portal-nav-item"
              >
                <House aria-hidden="true" />
                Acessar portal do cliente
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </nav>
    );
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
            <SidebarMenuButton
              render={<Link href="/chamados/novo" />}
              isActive={pathname === "/chamados/novo"}
              className={`portal-nav-item ${pathname === "/chamados/novo" ? "active" : ""}`}
              aria-current={pathname === "/chamados/novo" ? "page" : undefined}
            >
              <Plus aria-hidden="true" />
              Abrir chamado
            </SidebarMenuButton>
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
      {operationAvailable && (
        <SidebarGroup>
          <SidebarGroupLabel className="portal-nav-label">
            Central de atendimento
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/operacao/filas" />}
                isActive={pathname.startsWith("/operacao/")}
                className={`portal-nav-item ${pathname.startsWith("/operacao/") ? "active" : ""}`}
                aria-current={
                  pathname.startsWith("/operacao/") ? "page" : undefined
                }
              >
                <Ticket aria-hidden="true" />
                Filas de atendimento
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}
    </nav>
  );
}

export function PortalBreadcrumb() {
  const pathname = usePathname();
  const labels: Record<string, string> = {
    "/dashboard": "Início",
    "/chamados/novo": "Novo chamado",
    "/chamados": "Meus chamados",
    "/conhecimento": "Base de conhecimento",
    "/sla": "Painel SLA",
    "/operacao/filas": "Filas de atendimento",
    "/operacao/sla": "Painel SLA operacional",
  };
  return (
    <nav className="portal-breadcrumb" aria-label="Localização">
      {pathname.startsWith("/operacao/") ? "Workspace" : "Portal do cliente"}{" "}
      <span aria-hidden="true">/</span>
      <b>
        {labels[pathname] ||
          (pathname.startsWith("/chamados/") && pathname.endsWith("/enviado")
            ? "Chamado enviado"
            : pathname.startsWith("/chamados/") && pathname.endsWith("/avaliar")
              ? "Avaliar atendimento"
              : pathname.startsWith("/operacao/chamados/")
                ? "Atendimento do chamado"
                : pathname.startsWith("/chamados/")
                  ? "Detalhe do chamado"
                  : "Atendimento")}
      </b>
    </nav>
  );
}
