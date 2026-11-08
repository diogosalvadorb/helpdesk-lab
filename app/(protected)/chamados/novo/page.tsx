import { randomUUID } from "node:crypto";

import { getKnowledgeArticles, getServiceAgreement } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";
import { getTicketCreationOptions } from "@/data/tickets";

import { KnowledgeHighlights } from "../../_components/knowledge-highlights";
import { PendingAccess } from "../../_components/pending-access";
import { PortalLink } from "../../_components/portal-link";
import { ServiceAgreement } from "../../_components/service-agreement";
import { CreateTicketForm } from "../_components/create-ticket-form";

export default async function NewTicketPage() {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const [options, articles, agreement] = await Promise.all([
    getTicketCreationOptions(),
    getKnowledgeArticles(),
    getServiceAgreement(),
  ]);
  const submissionKey = randomUUID();
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Suporte que acompanha você</p>
          <h1>Como podemos ajudar?</h1>
          <p>Conte o que aconteceu. Nossa equipe cuida do próximo passo.</p>
        </div>
        <PortalLink href="/chamados" className="portal-outline-button">
          Ver meus chamados →
        </PortalLink>
      </div>
      {options ? (
        <div className="portal-dashboard-grid portal-new-ticket-grid">
          <CreateTicketForm
            key={`${options.company.id}:${submissionKey}`}
            options={options}
            submissionKey={submissionKey}
          />
          <div className="portal-stack">
            <KnowledgeHighlights
              articles={articles.slice(0, 3)}
              variant="suggestions"
            />
            <ServiceAgreement agreement={agreement} opening />
          </div>
        </div>
      ) : (
        <div className="portal-state">
          <h2>Vínculo com a empresa necessário</h2>
          <p>
            Para abrir um chamado em seu nome, é necessário um vínculo ativo com
            esta empresa. A permissão de consulta não substitui esse vínculo.
          </p>
          <PortalLink href="/chamados">Ver meus chamados</PortalLink>
        </div>
      )}
    </>
  );
}
