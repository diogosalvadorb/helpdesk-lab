import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { calculateReport } from "@/data/report-store";
export function ReportCharts({
  data,
}: {
  data: Awaited<ReturnType<typeof calculateReport>>;
}) {
  const groups = [];
  for (
    let i = 0;
    i < data.trends.length;
    i += data.trends.length > 31 ? 7 : 1
  ) {
    const days = data.trends.slice(i, i + (data.trends.length > 31 ? 7 : 1));
    groups.push({
      label: days[0].day.slice(5).split("-").reverse().join("/"),
      opened: days.reduce((n, d) => n + d.opened, 0),
      resolved: days.reduce((n, d) => n + d.resolved, 0),
    });
  }
  const max = Math.max(1, ...groups.flatMap((g) => [g.opened, g.resolved]));
  return (
    <div className="portal-report-grid">
      <Card className="portal-panel">
        <h2>Volume do atendimento</h2>
        <p className="portal-muted">
          {data.trends.length > 31
            ? "Agrupamento por blocos de 7 dias"
            : "Contagens por dia"}{" "}
          · São Paulo
        </p>
        <div
          className="portal-report-chart-scroll"
          tabIndex={0}
          role="region"
          aria-label="Gráfico de volume"
        >
          <div
            className="portal-report-bars"
            role="img"
            aria-label="Novos chamados e resoluções por data. Os valores também estão na tabela abaixo."
          >
            {groups.map((g, i) => (
              <div className="portal-report-bar-group" key={i}>
                <div className="portal-report-bar-pair">
                  <span
                    className="portal-report-bar opened"
                    style={{ height: `${(g.opened / max) * 100}%` }}
                    title={`${g.opened} novos chamados`}
                  />
                  <span
                    className="portal-report-bar resolved"
                    style={{ height: `${(g.resolved / max) * 100}%` }}
                    title={`${g.resolved} resoluções`}
                  />
                </div>
                <small>{g.label}</small>
              </div>
            ))}
          </div>
        </div>
        <p className="portal-report-legend">
          <span>● Novos chamados</span>
          <span>■ Resoluções (ciclos)</span>
        </p>
        <details>
          <summary>Ver tabela de valores diários</summary>
          <div
            className="portal-admin-table"
            tabIndex={0}
            role="region"
            aria-label="Valores do volume"
          >
            <Table className="portal-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Novos chamados</TableHead>
                  <TableHead>Resoluções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.trends.map((d) => (
                  <TableRow key={d.day}>
                    <TableCell>{d.day}</TableCell>
                    <TableCell>{d.opened}</TableCell>
                    <TableCell>{d.resolved}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      </Card>
      <Card className="portal-panel">
        <h2>Chamados por categoria</h2>
        <p className="portal-muted">
          Classificação atual dos chamados criados no período. Até 8 categorias
          mais frequentes.
        </p>
        {data.categories.length ? (
          data.categories.slice(0, 8).map((c) => (
            <div className="portal-report-distribution" key={c.name}>
              <p>
                <span>{c.name}</span>
                <b>
                  {c.count} (
                  {data.created
                    ? Math.round((c.count / data.created) * 100)
                    : 0}
                  %)
                </b>
              </p>
              <progress
                max={Math.max(1, data.created)}
                value={c.count}
                aria-label={`${c.name}: ${c.count} chamados`}
              />
            </div>
          ))
        ) : (
          <p className="portal-empty">Nenhum chamado criado neste período.</p>
        )}
      </Card>
    </div>
  );
}
