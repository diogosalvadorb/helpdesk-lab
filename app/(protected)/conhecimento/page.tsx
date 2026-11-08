import { getKnowledgeArticles } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";

import { DashboardHeading } from "../_components/dashboard-heading";
import { KnowledgeHighlights } from "../_components/knowledge-highlights";
import { PendingAccess } from "../_components/pending-access";

export default async function KnowledgePage() {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const articles = await getKnowledgeArticles();
  return (
    <>
      <DashboardHeading title="Respostas ao seu alcance." />
      <KnowledgeHighlights articles={articles} all />
    </>
  );
}
