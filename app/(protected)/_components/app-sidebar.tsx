import { AuthInfo } from "@/app/authentication/_components/auth-info";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import type { PortalContext } from "@/data/portal-context";

import { AppNav } from "./app-nav";
import { CompanySelector } from "./company-selector";
import { PortalLink } from "./portal-link";
import { UserMenu } from "./user-menu";

export function AppSidebar({
  context,
  openCount,
}: {
  context: PortalContext;
  openCount: number;
}) {
  const operationAvailable =
    context.user.role === "ADMIN" ||
    Boolean(
      context.user.role === "AGENT" &&
      context.user.supportAgent?.active &&
      context.user.supportAgent.team.active,
    );
  return (
    <Sidebar className="portal-sidebar-content">
      <SidebarHeader>
        <div className="portal-brand">
          helpdesk<span>.</span>
        </div>
        <CompanySelector
          companies={context.companies}
          selected={context.company?.id || null}
        />
      </SidebarHeader>
      <SidebarContent>
        <AppNav openCount={openCount} operationAvailable={operationAvailable} />
        <div className="portal-support">
          <b>Estamos por perto.</b>
          <p>
            Consulte seu acordo de atendimento para horários e canais de
            suporte.
          </p>
          <AuthInfo topic="help">Precisa de ajuda? ↗</AuthInfo>
          {operationAvailable && (
            <PortalLink href="/operacao/filas">
              Central de operações ↗
            </PortalLink>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu name={context.user.name} roleLabel={context.roleLabel} />
      </SidebarFooter>
    </Sidebar>
  );
}
