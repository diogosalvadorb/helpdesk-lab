import { Plus } from "lucide-react";

import { PortalLink } from "./portal-link";

export function DashboardHeading({
  name,
  title,
}: {
  name?: string;
  title?: string;
}) {
  return (
    <div className="portal-heading">
      <div>
        <p className="portal-eyebrow">Suporte que acompanha você</p>
        <h1>
          {title ||
            `Olá, ${name?.trim().split(/\s+/)[0] || "bem-vindo"}. Como podemos ajudar?`}
        </h1>
        <p>
          Seu atendimento, suas respostas e os próximos passos. Tudo por aqui.
        </p>
      </div>
      <PortalLink href="/chamados/novo" className="portal-primary-button">
        <Plus aria-hidden="true" />
        Abrir chamado
      </PortalLink>
    </div>
  );
}
