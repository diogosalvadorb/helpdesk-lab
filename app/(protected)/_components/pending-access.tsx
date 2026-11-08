import { Card } from "@/components/ui/card";
import type { PortalContext } from "@/data/portal-context";

import { CompanySelector } from "./company-selector";

export function PendingAccess({ context }: { context: PortalContext }) {
  return (
    <Card className="portal-card portal-pending">
      <p className="portal-eyebrow">Seu espaço de suporte</p>
      <h1>
        {context.invalidSelection
          ? "Empresa indisponível."
          : context.companies.length
            ? "Escolha seu espaço."
            : "Seu acesso está em análise."}
      </h1>
      <p>
        {context.invalidSelection
          ? "A empresa selecionada não está disponível para seu perfil. Selecione uma opção autorizada abaixo."
          : context.companies.length
            ? "Selecione uma empresa para consultar o atendimento."
            : "Quando o administrador aprovar seu vínculo com uma empresa, seus chamados e próximos passos aparecerão aqui."}
      </p>
      <CompanySelector
        companies={context.companies}
        selected={context.company?.id || null}
      />
    </Card>
  );
}
