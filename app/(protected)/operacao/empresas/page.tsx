import { Card } from "@/components/ui/card";
import {
  getAdministrativeList,
  getAdministrativeSummary,
} from "@/data/administration";

import { AdministrationEditor } from "../../_components/administration-editor";
import { AdministrationList } from "../../_components/administration-list";
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getAdministrativeList("company", await searchParams);
  const summary = await getAdministrativeSummary("company");
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Relacionamento e contratos</p>
          <h1>Empresas clientes</h1>
          <p>
            Cada empresa com seu contexto, seus usuários e seu acordo de
            atendimento.
          </p>
        </div>
        <AdministrationEditor entity="company" options={data.options} />
      </div>
      <div className="portal-admin-summary">
        {summary.map((m) => (
          <Card className="portal-panel" key={m.label}>
            <p>{m.label}</p>
            <b>{m.value}</b>
          </Card>
        ))}
      </div>
      <AdministrationList data={data} path="/operacao/empresas" />
    </>
  );
}
