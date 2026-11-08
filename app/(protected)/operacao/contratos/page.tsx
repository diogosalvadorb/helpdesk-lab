import Link from "next/link";

import { getAdministrativeList } from "@/data/administration";

import { AdministrationEditor } from "../../_components/administration-editor";
import { AdministrationList } from "../../_components/administration-list";
export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getAdministrativeList("contract", await searchParams);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Acordos de atendimento</p>
          <h1>Contratos</h1>
          <p>Vigência, metas e políticas de atendimento por empresa.</p>
        </div>
        <AdministrationEditor
          entity="contract"
          options={data.options}
          companyId={data.filters.company}
        />
      </div>
      <nav className="portal-queue-tabs" aria-label="Gestão dos acordos">
        <Link href="/operacao/sla/politicas">Políticas de SLA</Link>
        <Link href="/operacao/sla/calendarios">Calendários de atendimento</Link>
      </nav>
      <AdministrationList data={data} path="/operacao/contratos" />
    </>
  );
}
