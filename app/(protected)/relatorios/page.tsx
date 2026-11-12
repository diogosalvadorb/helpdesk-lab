import Link from "next/link";

import { getReport } from "@/data/reports";

import { queryHref } from "../_components/query-pagination";
import { ReportCharts } from "../_components/report-charts";
import { ReportDetails } from "../_components/report-details";
import { ReportFilters } from "../_components/report-filters";
import { ReportMetrics } from "../_components/report-metrics";
export default async function PortalReports({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const report = await getReport(await searchParams, false);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Resultados do atendimento</p>
          <h1>Seu atendimento em números.</h1>
          <p>
            {report.ownOnly
              ? "Indicadores somente dos seus chamados."
              : "Indicadores do atendimento da empresa selecionada."}
          </p>
        </div>
        {report.data && (
          <Link
            className="portal-outline-button"
            href={queryHref("/relatorios/exportar", report.period.filters)}
          >
            Exportar CSV
          </Link>
        )}
      </div>
      <ReportFilters report={report} path="/relatorios" />
      {report.data && (
        <>
          <ReportMetrics data={report.data} />
          <ReportCharts data={report.data} />
          <ReportDetails report={report} path="/relatorios" />
        </>
      )}
    </>
  );
}
