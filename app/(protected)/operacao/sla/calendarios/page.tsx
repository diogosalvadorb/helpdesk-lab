import Link from "next/link";

import { getAdministrativeList } from "@/data/administration";

import { AdministrationEditor } from "../../../_components/administration-editor";
import { AdministrationList } from "../../../_components/administration-list";
export default async function CalendarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getAdministrativeList("calendar", await searchParams);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Tempo de atendimento</p>
          <h1>Calendários</h1>
          <p>
            Expediente, fuso e feriados. Revisões preservam o calendário
            anterior.
          </p>
        </div>
        <AdministrationEditor entity="calendar" options={data.options} />
      </div>
      <nav className="portal-queue-tabs" aria-label="Gestão do calendário">
        <Link href="/operacao/sla/politicas">Políticas de SLA</Link>
        <Link href="/operacao/contratos">Contratos</Link>
      </nav>
      <AdministrationList data={data} path="/operacao/sla/calendarios" />
    </>
  );
}
