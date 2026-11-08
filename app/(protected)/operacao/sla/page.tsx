import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSlaMonitor } from "@/data/sla-monitor";
import { dateTime, priorityLabels, ticketNumber } from "@/lib/portal-format";

import { PortalLink } from "../../_components/portal-link";

const labels = {
  normal: "No prazo",
  warning: "Em risco",
  breached: "SLA violado",
  paused: "Pausado",
  noTarget: "Sem meta ou medição histórica",
};
export default async function OperationalSlaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams,
    data = await getSlaMonitor(query);
  if (!data) notFound();
  const pageLink = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (typeof value === "string" && key !== "page") params.set(key, value);
    params.set("page", String(page));
    return `/operacao/sla?${params}`;
  };
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Controle da operação</p>
          <h1>Clareza em cada prazo.</h1>
          <p>
            Monitore os prazos, antecipe riscos e mantenha o atendimento no
            ritmo certo.
          </p>
        </div>
        <PortalLink href="/operacao/filas" className="portal-outline-button">
          Ver chamados
        </PortalLink>
      </div>
      <div className="portal-metrics">
        {[
          [
            "SLA cumprido",
            data.compliance === null
              ? "Sem dados"
              : `${data.compliance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
            `${data.sample} ${data.sample === 1 ? "ciclo medido elegível" : "ciclos medidos elegíveis"}`,
          ],
          [
            "Primeira resposta",
            data.averageResponseMinutes === null
              ? "Sem dados"
              : data.averageResponseMinutes > 0 &&
                  data.averageResponseMinutes < 1
                ? "< 1 min"
                : `${data.averageResponseMinutes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} min`,
            "Média em tempo útil dos ciclos medidos",
          ],
          ["Em risco", data.counts.warning, "Atenção aos próximos vencimentos"],
          [
            "SLA violado",
            data.counts.breached,
            "Priorize os chamados com prazo excedido",
          ],
        ].map(([label, value, help]) => (
          <Card className="portal-card portal-metric" key={label}>
            <p>{label}</p>
            <strong className="portal-sla-metric-value">{value}</strong>
            <small>{help}</small>
          </Card>
        ))}
      </div>
      <Card className="portal-card">
        <form className="portal-queue-filters" action="/operacao/sla">
          <div className="portal-field">
            <Label htmlFor="sla-bucket">Situação do prazo</Label>
            <select
              id="sla-bucket"
              name="bucket"
              className="portal-form-input"
              defaultValue={data.bucket}
            >
              <option value="all">Todos</option>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="portal-field">
            <Label htmlFor="sla-search">Assunto</Label>
            <Input
              id="sla-search"
              name="q"
              className="portal-form-input"
              defaultValue={data.filters.q}
              maxLength={120}
            />
          </div>
          <div className="portal-field">
            <Label htmlFor="sla-company">Empresa</Label>
            <select
              id="sla-company"
              name="company"
              className="portal-form-input"
              defaultValue={data.filters.company || ""}
            >
              <option value="">Todas as autorizadas</option>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="portal-field">
            <Label htmlFor="sla-level">Nível</Label>
            <select
              id="sla-level"
              name="level"
              className="portal-form-input"
              defaultValue={data.filters.level || ""}
            >
              <option value="">Todos os autorizados</option>
              {["N1", "N2", "N3"].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div className="portal-field">
            <Label htmlFor="sla-priority">Prioridade</Label>
            <select
              id="sla-priority"
              name="priority"
              className="portal-form-input"
              defaultValue={data.filters.priority || ""}
            >
              <option value="">Todas</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="portal-outline-button">
            Filtrar
          </Button>
        </form>
        <div className="portal-card-head">
          <h2>Chamados em acompanhamento</h2>
          <Badge className="portal-badge" data-tone="neutral">
            {data.total} chamados
          </Badge>
        </div>
        <div
          className="portal-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Chamados em acompanhamento de SLA"
        >
          <Table className="portal-table">
            <TableHeader>
              <TableRow>
                {[
                  "Chamado",
                  "Prioridade",
                  "Nível",
                  "Situação",
                  "Prazo de referência",
                  "Consumo do SLA",
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <PortalLink
                      href={`/operacao/chamados/${row.id}`}
                      className="portal-ticket-link"
                    >
                      {ticketNumber(row.number)} · {row.subject}
                    </PortalLink>
                    <small>{row.company}</small>
                  </TableCell>
                  <TableCell>{priorityLabels[row.priority]}</TableCell>
                  <TableCell>{row.level}</TableCell>
                  <TableCell>
                    <Badge
                      className="portal-badge"
                      data-tone={
                        row.bucket === "breached"
                          ? "danger"
                          : row.bucket === "warning"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {labels[row.bucket]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.due ? dateTime(row.due) : "Sem prazo definido"}
                  </TableCell>
                  <TableCell>
                    {row.percent === null ? (
                      "Sem medição"
                    ) : (
                      <>
                        <progress
                          className="portal-sla-progress"
                          max={100}
                          value={Math.min(row.percent, 100)}
                          aria-label="Consumo do prazo de SLA"
                        />
                        <small>
                          {row.percent.toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}
                          % utilizado
                        </small>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {!data.rows.length && (
          <p className="portal-empty">
            Nenhum chamado nesta situação e escopo.
          </p>
        )}
        <nav
          className="portal-history-pagination"
          aria-label="Paginação do SLA"
        >
          {data.filters.page > 1 && (
            <PortalLink href={pageLink(data.filters.page - 1)}>
              Página anterior
            </PortalLink>
          )}
          {data.filters.page * 20 < data.total && (
            <PortalLink href={pageLink(data.filters.page + 1)}>
              Próxima página
            </PortalLink>
          )}
        </nav>
      </Card>
      <Card className="portal-card portal-knowledge portal-sla-explainer">
        <p className="portal-eyebrow">Como contamos o tempo</p>
        <h2>Um acordo que acompanha sua rotina.</h2>
        <p>
          O relógio considera expediente, intervalos, feriados e fuso do
          calendário definido no início do atendimento. Pausas não contam como
          tempo útil de atendimento.
        </p>
        <p>
          Chamados sem histórico suficiente não entram no percentual de
          cumprimento. Os prazos disponíveis continuam visíveis.
        </p>
        <p>
          Atualizado em {dateTime(data.now)}. Atualize a página para acompanhar
          as mudanças.
        </p>
      </Card>
    </>
  );
}
