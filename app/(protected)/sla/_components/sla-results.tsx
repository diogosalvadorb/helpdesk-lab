import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { getPortalSla } from "@/data/portal-sla";
import { ticketNumber } from "@/lib/portal-format";

import { QueryPagination } from "../../_components/query-pagination";
export const slaBucketLabels = {
  normal: "No prazo",
  warning: "Em risco",
  breached: "SLA violado",
  paused: "Pausado",
  noTarget: "Sem meta ou histórico suficiente",
};
export function SlaResults({
  data,
}: {
  data: NonNullable<Awaited<ReturnType<typeof getPortalSla>>>;
}) {
  const filters = { from: data.from, to: data.to, bucket: data.bucket };
  return (
    <>
      <Card className="portal-panel portal-sla-panel">
        <h2>Chamados em acompanhamento</h2>
        <div
          className="portal-admin-table"
          tabIndex={0}
          role="region"
          aria-label="Prazos dos chamados"
        >
          <Table className="portal-table">
            <TableHeader>
              <TableRow>
                {[
                  "Chamado",
                  "Nível",
                  "Situação",
                  "Vencimento",
                  "Consumo do SLA",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/chamados/${t.id}`}>
                      {ticketNumber(t.number)}
                    </Link>
                    <small>{t.subject}</small>
                  </TableCell>
                  <TableCell>{t.level}</TableCell>
                  <TableCell>{slaBucketLabels[t.bucket]}</TableCell>
                  <TableCell>
                    {t.bucket === "paused"
                      ? "Pausado"
                      : t.due
                        ? new Date(t.due).toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                          })
                        : "Sem prazo"}
                  </TableCell>
                  <TableCell>
                    {t.percent === null ? (
                      "Sem medição"
                    ) : (
                      <>
                        <progress
                          className="portal-sla-progress"
                          max={100}
                          value={Math.min(100, t.percent)}
                          aria-label={`Consumo do SLA de ${ticketNumber(t.number)}`}
                        />
                        <small>
                          {t.percent.toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}
                          %
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
          <p className="portal-empty">Nenhum chamado ativo nesta situação.</p>
        )}
        <QueryPagination
          path="/sla"
          filters={filters}
          page={data.page}
          total={data.total}
        />
      </Card>
      <Card className="portal-panel portal-sla-panel">
        <h2>Histórico de resoluções</h2>
        <p className="portal-muted">
          Cada resolução aparece como um ciclo. O período filtra a data da
          resolução.
        </p>
        <div
          className="portal-admin-table"
          tabIndex={0}
          role="region"
          aria-label="Histórico do SLA"
        >
          <Table className="portal-table">
            <TableHeader>
              <TableRow>
                {[
                  "Chamado",
                  "Resolvido em",
                  "Primeira resposta",
                  "Resolução",
                  "Meta cumprida",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <Link href={`/chamados/${h.ticket.id}`}>
                      {ticketNumber(h.ticket.number)} · {h.ticket.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Date(h.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {h.firstMinutes === null
                      ? "Sem dados"
                      : `${h.firstMinutes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} min úteis`}
                  </TableCell>
                  <TableCell>
                    {h.resolutionMinutes === null
                      ? "Sem dados"
                      : `${h.resolutionMinutes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} min úteis`}
                  </TableCell>
                  <TableCell>
                    {h.compliance === null
                      ? "Sem dados"
                      : h.compliance
                        ? "Sim"
                        : "Não"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {!data.history.length && (
          <p className="portal-empty">Nenhuma resolução neste período.</p>
        )}
        <QueryPagination
          path="/sla"
          filters={{ ...filters, page: data.page }}
          pageKey="historyPage"
          page={data.historyPage}
          total={data.totalHistory}
        />
      </Card>
    </>
  );
}
