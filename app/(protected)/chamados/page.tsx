import { getPortalTickets } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";

import { DashboardHeading } from "../_components/dashboard-heading";
import { PendingAccess } from "../_components/pending-access";
import { RecentTickets } from "../_components/recent-tickets";

export default async function TicketsPage() {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const tickets = await getPortalTickets(50);
  return (
    <>
      <DashboardHeading title="Seus chamados, por inteiro." />
      <RecentTickets tickets={tickets} all />
    </>
  );
}
