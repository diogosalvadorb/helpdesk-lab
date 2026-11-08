import { getAdministrativeList } from "@/data/administration";

import { AdministrationEditor } from "../../_components/administration-editor";
import { AdministrationList } from "../../_components/administration-list";
export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getAdministrativeList("department", await searchParams);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Organização</p>
          <h1>Departamentos</h1>
          <p>Organize os setores de cada empresa e seus vínculos.</p>
        </div>
        <AdministrationEditor
          entity="department"
          options={data.options}
          companyId={data.filters.company}
        />
      </div>
      <AdministrationList data={data} path="/operacao/departamentos" />
    </>
  );
}
