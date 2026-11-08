import { Card } from "@/components/ui/card";
import type { getDashboard } from "@/data/dashboard";

export function DashboardMetrics({
  data,
}: {
  data: NonNullable<Awaited<ReturnType<typeof getDashboard>>>;
}) {
  const count = (value: number) =>
    value.toLocaleString("pt-BR", { minimumIntegerDigits: 2 });
  const percentage =
    data.compliance === null
      ? "Sem dados"
      : `${data.compliance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  const items = [
    {
      label: "Chamados em aberto",
      value: count(data.open),
      note: data.pendingCount
        ? `${data.pendingCount} aguardam sua resposta`
        : "Nenhuma resposta pendente",
    },
    {
      label: "Em atendimento",
      value: count(data.inProgress),
      note: data.inProgress
        ? "Nossa equipe está cuidando"
        : "Tudo em dia por aqui",
    },
    {
      label: "Resolvidos este mês",
      value: count(data.resolved),
      note: data.previousResolved
        ? `${data.resolved - data.previousResolved >= 0 ? "+" : ""}${data.resolved - data.previousResolved} em relação ao mês anterior`
        : "Sem comparação com o mês anterior",
    },
    {
      label: "SLA cumprido",
      value: percentage,
      note: data.slaSample
        ? `${data.slaSample} atendimento(s) com metas aferidas`
        : "Aguardando atendimentos com dados de SLA",
    },
  ];
  return (
    <div className="portal-metrics">
      {items.map((item) => (
        <Card className="portal-card portal-metric" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.note}</small>
        </Card>
      ))}
    </div>
  );
}
