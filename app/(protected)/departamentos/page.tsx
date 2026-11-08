import { getAdministrativeList } from "@/data/administration";

import { AdministrationEditor } from "../_components/administration-editor";
import { AdministrationList } from "../_components/administration-list";
export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getAdministrativeList(
    "department",
    await searchParams,
    true,
  );
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Sua organização</p>
          <h1>Departamentos</h1>
          <p>Gerencie os setores da empresa selecionada.</p>
        </div>
        <AdministrationEditor
          entity="department"
          options={data.options}
          companyId={data.filters.company}
        />
      </div>
      <AdministrationList data={data} path="/departamentos" />
    </>
  );
}
