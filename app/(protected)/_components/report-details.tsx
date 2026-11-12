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
import type { getReport } from "@/data/reports";
import {
  priorityLabels,
  statusLabels,
  ticketNumber,
} from "@/lib/portal-format";

import { QueryPagination } from "./query-pagination";
import { reportNumber } from "./report-metrics";
export function ReportDetails({
  report,
  path,
}: {
  report: Awaited<ReturnType<typeof getReport>>;
  path: string;
}) {
  const d = report.data!;
  return (
    <>
      <div className="portal-report-grid">
        <Card className="portal-panel">
          <h2>Distribuição por nível e prioridade</h2>
          <p className="portal-muted">
            Classificação atual dos chamados criados no período.
          </p>
          {[...d.levels, ...d.priorities].map((g) => (
            <p className="portal-report-pair" key={g.name}>
              <span>
                {priorityLabels[g.name as keyof typeof priorityLabels] ??
                  g.name}
              </span>
              <b>{g.count}</b>
            </p>
          ))}
        </Card>
        <Card className="portal-panel">
          <h2>Resposta e encaminhamento</h2>
          <p>
            Primeira resposta média:{" "}
            <b>{reportNumber(d.responseAverage, " min úteis")}</b>
          </p>
          <p>
            Mediana: {reportNumber(d.responseMedian, " min úteis")} ·{" "}
            {d.slaSample} ciclos medidos
          </p>
          <p>
            Escalonamentos: <b>{d.escalations}</b> · {d.automaticEscalations}{" "}
            automáticos
          </p>
          {d.escalationLevels.map((g) => (
            <p key={g.name}>
              {g.name}: {g.count}
            </p>
          ))}
          <p>
            Resolução média no período anterior:{" "}
            {reportNumber(d.previousResolutionAverage, " min úteis")}
          </p>
          <p>
            Novos chamados: {d.created} · Período anterior equivalente:{" "}
            {d.previousCreated}
          </p>
        </Card>
      </div>
      <Card className="portal-panel portal-report-section">
        <h2>Chamados criados no período</h2>
        <div
          className="portal-admin-table"
          tabIndex={0}
          role="region"
          aria-label="Chamados do relatório"
        >
          <Table className="portal-table">
            <TableHeader>
              <TableRow>
                {[
                  "Chamado",
                  "Departamento",
                  "Status",
                  "Prioridade",
                  "Nível",
                  "Criado em",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link
                      href={`${report.operation ? "/operacao/chamados" : "/chamados"}/${t.id}`}
                    >
                      {ticketNumber(t.number)} · {t.subject}
                    </Link>
                  </TableCell>
                  <TableCell>{t.department.name}</TableCell>
                  <TableCell>{statusLabels[t.status]}</TableCell>
                  <TableCell>{priorityLabels[t.priority]}</TableCell>
                  <TableCell>{t.level}</TableCell>
                  <TableCell>
                    {new Date(t.createdAt).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {!d.rows.length && (
          <p className="portal-empty">Nenhum chamado criado no período.</p>
        )}
        <QueryPagination
          path={path}
          filters={report.period.filters}
          page={report.period.filters.page}
          total={d.total}
        />
      </Card>
      <Card className="portal-panel portal-report-section">
        <h2>Como interpretar estes indicadores</h2>
        <p>
          Volumes contam criações e eventos de resolução no período. Uma
          reabertura pode gerar outra resolução do mesmo chamado. Médias e
          medianas usam minutos úteis medidos, com o calendário e as pausas de
          cada ciclo; metas contratadas não são tempos medidos.
        </p>
        <p>
          SLA considera somente ciclos com medição válida e primeira resposta
          registrada. Avaliações contam a data de envio da avaliação, uma por
          chamado. Sem amostra elegível, os indicadores mostram “Sem dados”.
        </p>
        <p>
          Backlog atual: {d.backlog} · Em risco: {d.bucketCounts.warning} ·
          Vencidos: {d.bucketCounts.breached} · Pausados:{" "}
          {d.bucketCounts.paused} · Sem meta/histórico:{" "}
          {d.bucketCounts.noTarget}.
        </p>
        <p className="portal-report-note">
          Histórico de backlog e de desempenho por nível não disponível:
          registros antigos não garantem eventos completos nem nível congelado
          em cada resolução. As distribuições apresentadas usam a classificação
          atual e não reconstroem esse histórico.
        </p>
        <p className="portal-muted">
          Atualizado em{" "}
          {new Date(d.asOf).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}
          . O acesso atual determina quais chamados e ciclos entram na consulta.
        </p>
      </Card>
    </>
  );
}
