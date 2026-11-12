import Link from "next/link";

import { getReport } from "@/data/reports";

import { queryHref } from "../../_components/query-pagination";
import { ReportCharts } from "../../_components/report-charts";
import { ReportDetails } from "../../_components/report-details";
import { ReportFilters } from "../../_components/report-filters";
import { ReportMetrics } from "../../_components/report-metrics";
export default async function OperationalReports({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const report = await getReport(await searchParams, true);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Resultados do atendimento</p>
          <h1>Uma operação que evolui.</h1>
          <p>Indicadores reais do período e do escopo selecionados.</p>
        </div>
        {report.data && (
          <Link
            className="portal-outline-button"
            href={queryHref(
              "/operacao/relatorios/exportar",
              report.period.filters,
            )}
          >
            Exportar CSV
          </Link>
        )}
      </div>
      <ReportFilters report={report} path="/operacao/relatorios" />
      {report.data && (
        <>
          <ReportMetrics data={report.data} />
          <ReportCharts data={report.data} />
          <ReportDetails report={report} path="/operacao/relatorios" />
        </>
      )}
    </>
  );
}
