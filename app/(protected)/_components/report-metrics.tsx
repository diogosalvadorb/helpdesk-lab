import { Card } from "@/components/ui/card";
import type { calculateReport } from "@/data/report-store";
export function reportNumber(value: number | null, suffix = "") {
  return value === null
    ? "Sem dados"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
}
export function ReportMetrics({
  data,
  overview = false,
}: {
  data: Awaited<ReturnType<typeof calculateReport>>;
  overview?: boolean;
}) {
  const metrics = overview
    ? [
        [
          "Backlog atual",
          String(data.backlog),
          "Chamados ativos agora; independe do período",
        ],
        [
          "SLA cumprido",
          reportNumber(data.compliance, "%"),
          `${data.slaSample} ciclos com primeira resposta medida`,
        ],
        [
          "Primeira resposta",
          reportNumber(data.responseAverage, " min"),
          `Mediana: ${reportNumber(data.responseMedian, " min úteis")}`,
        ],
        [
          "Satisfação",
          reportNumber(data.ratingAverage, " / 5"),
          `${data.ratingSample} avaliações no período`,
        ],
      ]
    : [
        [
          "Resoluções no período",
          String(data.resolvedCycles),
          `${data.resolvedTickets} chamados distintos · Anterior: ${data.previousResolvedCycles}`,
        ],
        [
          "Tempo de resolução",
          reportNumber(data.resolutionAverage, " min"),
          `Mediana: ${reportNumber(data.resolutionMedian, " min úteis")} · ${data.resolutionSample} ciclos medidos`,
        ],
        [
          "SLA cumprido",
          reportNumber(data.compliance, "%"),
          `${data.slaSample} ciclos elegíveis · Anterior: ${reportNumber(data.previousCompliance, "%")}`,
        ],
        [
          "Satisfação",
          reportNumber(data.ratingAverage, " / 5"),
          `${data.ratingSample} avaliações no período`,
        ],
      ];
  return (
    <div className="portal-metrics portal-report-metrics">
      {metrics.map(([label, value, note]) => (
        <Card className="portal-card portal-metric" key={label}>
          <p>{label}</p>
          <strong className="portal-sla-metric-value">{value}</strong>
          <small>{note}</small>
        </Card>
      ))}
    </div>
  );
}
