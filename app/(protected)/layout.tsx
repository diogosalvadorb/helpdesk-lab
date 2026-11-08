import { type ReactNode, Suspense } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { getOpenTicketCount } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";
import { openStatuses } from "@/lib/portal-format";

import { AppSidebar } from "./_components/app-sidebar";
import { MobileNavigation } from "./_components/mobile-navigation";
import { PortalHeader } from "./_components/portal-header";
import { PortalLoading } from "./_components/portal-loading";

async function AuthorizedLayout({ children }: { children: ReactNode }) {
  const context = await getPortalContext();
  const count = await getOpenTicketCount(openStatuses);
  return (
    <SidebarProvider className="portal-shell">
      <a className="portal-skip-link" href="#portal-main">
        Ir para o conteúdo
      </a>
      <aside className="portal-sidebar">
        <AppSidebar context={context} openCount={count} />
      </aside>
      <div className="portal-main">
        <PortalHeader context={context} openCount={count} />
        <main id="portal-main" className="portal-content">
          {children}
        </main>
      </div>
      <MobileNavigation />
    </SidebarProvider>
  );
}
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PortalLoading />}>
      <AuthorizedLayout>{children}</AuthorizedLayout>
    </Suspense>
  );
}
