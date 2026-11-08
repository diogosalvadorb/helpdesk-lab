import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getAdministrativeList,
  getAdministrativeSummary,
} from "@/data/administration";

import { AdministrationEditor } from "../../_components/administration-editor";
import { AdministrationList } from "../../_components/administration-list";
import { AgentCards } from "./_components/agent-cards";
export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams,
    entity =
      query.view === "teams"
        ? "team"
        : query.view === "users"
          ? "user"
          : "agent";
  const data = await getAdministrativeList(entity, query);
  const summary = await getAdministrativeSummary("agent");
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Pessoas que resolvem</p>
          <h1>Equipe de suporte</h1>
          <p>Equipes, níveis, disponibilidade e capacidade em um só lugar.</p>
        </div>
        {entity !== "user" && (
          <AdministrationEditor entity={entity} options={data.options} />
        )}
      </div>
      <div className="portal-admin-summary">
        {summary.map((m) => (
          <Card className="portal-panel" key={m.label}>
            <p>{m.label}</p>
            <b>{m.value}</b>
          </Card>
        ))}
      </div>
      <nav className="portal-queue-tabs" aria-label="Gestão da equipe">
        {[
          ["agents", "Agentes"],
          ["teams", "Equipes"],
          ["users", "Acessos globais"],
        ].map(([view, label]) => (
          <Link
            key={view}
            href={`/operacao/equipe?view=${view}`}
            className={(query.view || "agents") === view ? "active" : ""}
          >
            {label}
          </Link>
        ))}
      </nav>
      {entity === "user" && (
        <p className="portal-muted">
          Usuários são criados pelo cadastro de autenticação. Aqui você altera o
          papel e o estado de contas existentes; não são definidas senhas.
        </p>
      )}
      <AdministrationList
        data={data}
        path="/operacao/equipe"
        params={{
          view:
            entity === "team"
              ? "teams"
              : entity === "user"
                ? "users"
                : "agents",
        }}
      >
        {entity === "agent" ? <AgentCards data={data} /> : undefined}
      </AdministrationList>
    </>
  );
}
