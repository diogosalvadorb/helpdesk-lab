import { AuthInfo } from "@/app/authentication/_components/auth-info";
import { getDashboard } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";
import { dateTime } from "@/lib/portal-format";

import { DashboardHeading } from "../_components/dashboard-heading";
import { KnowledgeHighlights } from "../_components/knowledge-highlights";
import { PendingAccess } from "../_components/pending-access";
import { RecentTickets } from "../_components/recent-tickets";
import { ServiceAgreement } from "../_components/service-agreement";
import { DashboardMetrics } from "./_components/dashboard-metrics";
import { PendingReplies } from "./_components/pending-replies";

export default async function Dashboard() {
  const [context, data] = await Promise.all([
    getPortalContext(),
    getDashboard(),
  ]);
  if (!data) return <PendingAccess context={context} />;
  return (
    <>
      <DashboardHeading name={context.user.name} />
      <DashboardMetrics data={data} />
      <div className="portal-dashboard-grid">
        <div className="portal-stack">
          <RecentTickets tickets={data.tickets} />
          <PendingReplies tickets={data.pending} total={data.pendingCount} />
        </div>
        <div className="portal-stack">
          <KnowledgeHighlights articles={data.articles} />
          <ServiceAgreement agreement={data.agreement} />
        </div>
      </div>
      <footer className="portal-footer">
        <span>
          Visível apenas no seu escopo autorizado de atendimento.
          <br />
          <time dateTime={data.now}>
            Atualizado em {dateTime(data.now)} · Prazos na hora de referência.
          </time>
        </span>
        <div>
          <AuthInfo topic="help">Ajuda</AuthInfo>
          <span aria-hidden="true">·</span>
          <AuthInfo topic="privacy">Privacidade</AuthInfo>
        </div>
      </footer>
    </>
  );
}
