import { getServiceAgreement } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";

import { DashboardHeading } from "../_components/dashboard-heading";
import { PendingAccess } from "../_components/pending-access";
import { ServiceAgreement } from "../_components/service-agreement";

export default async function SlaPage() {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const agreement = await getServiceAgreement();
  return (
    <>
      <DashboardHeading title="Clareza em cada prazo." />
      <ServiceAgreement agreement={agreement} expanded />
    </>
  );
}
