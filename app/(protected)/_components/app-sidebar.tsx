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
import { FeatureNotice } from "./portal-dialog";
import { UserMenu } from "./user-menu";

export function AppSidebar({
  context,
  openCount,
}: {
  context: PortalContext;
  openCount: number;
}) {
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
        <AppNav openCount={openCount} />
        <div className="portal-support">
          <b>Estamos por perto.</b>
          <p>
            Consulte seu acordo de atendimento para horários e canais de
            suporte.
          </p>
          <AuthInfo topic="help">Precisa de ajuda? ↗</AuthInfo>
          {context.user.role !== "CLIENT" && (
            <FeatureNotice>Central de operações ↗</FeatureNotice>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu name={context.user.name} roleLabel={context.roleLabel} />
      </SidebarFooter>
    </Sidebar>
  );
}
