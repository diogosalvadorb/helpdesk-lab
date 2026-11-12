import "server-only";

import { csvLine, ReportLimitError } from "@/lib/reporting";

import { calculateReport } from "./report-store";
import { getReportContext } from "./reports";
export async function exportReport(request: Request, operation: boolean) {
  const raw = Object.fromEntries(new URL(request.url).searchParams),
    context = await getReportContext(raw, operation),
    headers = {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };
  if (context.message)
    return new Response(context.message, { status: 400, headers });
  try {
    const data = await calculateReport(
      context.scope,
      context.period,
      operation,
      true,
    );
    let csv =
      "\uFEFF" +
      csvLine([
        "Relatório de atendimento",
        context.companyName,
        context.period.filters.from,
        context.period.filters.to,
        "America/Sao_Paulo",
      ]) +
      csvLine(["Métrica", "Valor", "Unidade", "Amostra"]);
    for (const row of [
      ["Novos chamados", data.created, "chamados", data.created],
      ["Resoluções", data.resolvedCycles, "ciclos", data.resolvedCycles],
      ["Backlog atual", data.backlog, "chamados atuais", data.backlog],
      [
        "Primeira resposta média",
        data.responseAverage,
        "minutos úteis",
        data.slaSample,
      ],
      [
        "Primeira resposta mediana",
        data.responseMedian,
        "minutos úteis",
        data.slaSample,
      ],
      [
        "Resolução média",
        data.resolutionAverage,
        "minutos úteis",
        data.resolutionSample,
      ],
      [
        "Resolução mediana",
        data.resolutionMedian,
        "minutos úteis",
        data.resolutionSample,
      ],
      ["SLA cumprido", data.compliance, "percentual", data.slaSample],
      ["Satisfação", data.ratingAverage, "escala de 1 a 5", data.ratingSample],
      ["Escalonamentos", data.escalations, "eventos", data.escalations],
    ])
      csv += csvLine(row);
    csv +=
      "\r\n" +
      csvLine([
        "Chamado",
        "Assunto",
        ...(operation ? ["Empresa"] : []),
        "Departamento",
        "Status atual",
        "Prioridade atual",
        "Nível atual",
        "Criado em",
      ]);
    for (const t of data.rows)
      csv += csvLine([
        t.number,
        t.subject,
        ...(operation ? [t.company] : []),
        t.department.name,
        t.status,
        t.priority,
        t.level,
        t.createdAt,
      ]);
    if (new TextEncoder().encode(csv).byteLength > 5 * 1024 * 1024)
      return new Response("O CSV excede 5 MB. Refine os filtros.", {
        status: 413,
        headers,
      });
    return new Response(csv, {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="relatorio-atendimento.csv"',
      },
    });
  } catch (error) {
    if (error instanceof ReportLimitError)
      return new Response(error.message, { status: 413, headers });
    throw error;
  }
}
