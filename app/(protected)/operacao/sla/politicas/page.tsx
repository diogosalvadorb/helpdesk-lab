import Link from "next/link";

import { getAdministrativeList } from "@/data/administration";

import { AdministrationEditor } from "../../../_components/administration-editor";
import { AdministrationList } from "../../../_components/administration-list";
import { PolicyCards } from "./_components/policy-cards";
export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getAdministrativeList("policy", await searchParams);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Acordos que orientam</p>
          <h1>Políticas de SLA</h1>
          <p>
            Defina metas por prioridade e preserve cada versão do atendimento.
          </p>
        </div>
        <AdministrationEditor entity="policy" options={data.options} />
      </div>
      <nav className="portal-queue-tabs" aria-label="Gestão do SLA">
        <Link href="/operacao/sla">Painel operacional</Link>
        <Link href="/operacao/sla/calendarios">Calendários de atendimento</Link>
        <Link href="/operacao/contratos">Contratos</Link>
      </nav>
      <AdministrationList data={data} path="/operacao/sla/politicas">
        <PolicyCards data={data} />
      </AdministrationList>
    </>
  );
}
