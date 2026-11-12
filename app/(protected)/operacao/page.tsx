import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getReport } from "@/data/reports";
import { ticketNumber } from "@/lib/portal-format";

import { queryHref } from "../_components/query-pagination";
import { ReportCharts } from "../_components/report-charts";
import { ReportFilters } from "../_components/report-filters";
import { ReportMetrics } from "../_components/report-metrics";
export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const report = await getReport(await searchParams, true);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Controle da operação</p>
          <h1>Cada chamado, no nível certo.</h1>
          <p>
            Uma visão das filas, dos atendimentos e dos prazos no seu escopo.
          </p>
        </div>
        <Link
          className="portal-outline-button"
          href={queryHref("/operacao/relatorios", report.period.filters)}
        >
          Ver relatório
        </Link>
      </div>
      <ReportFilters report={report} path="/operacao" />
      {report.data && (
        <>
          <ReportMetrics data={report.data} overview />
          <ReportCharts data={report.data} />
          <Card className="portal-panel portal-report-section">
            <h2>Prioridade agora</h2>
            <p>
              {report.data.bucketCounts.warning} em risco ·{" "}
              {report.data.bucketCounts.breached} vencido(s) · Fotografia atual
            </p>
            {report.data.urgent.map((t) => (
              <Link
                className="portal-knowledge-row"
                href={`/operacao/chamados/${t.id}`}
                key={t.id}
              >
                <span>
                  {ticketNumber(t.number)} · {t.subject}
                  <small>
                    {t.level} ·{" "}
                    {t.bucket === "paused"
                      ? "Pausado"
                      : t.due
                        ? new Date(t.due).toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                          })
                        : "Sem prazo disponível"}
                  </small>
                </span>
                <span>Acompanhar →</span>
              </Link>
            ))}
            {!report.data.urgent.length && (
              <p className="portal-empty">Nenhum chamado ativo neste escopo.</p>
            )}
            <Link href="/operacao/sla">Ver painel SLA →</Link>
          </Card>
        </>
      )}
    </>
  );
}
