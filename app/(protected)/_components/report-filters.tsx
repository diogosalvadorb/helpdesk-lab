import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { getReport } from "@/data/reports";
import { priorityLabels } from "@/lib/portal-format";
export function ReportFilters({
  report,
  path,
}: {
  report: Awaited<ReturnType<typeof getReport>>;
  path: string;
}) {
  const f = report.period.filters;
  return (
    <Card className="portal-panel">
      <form action={path} className="portal-report-filters">
        <div className="portal-field">
          <Label htmlFor="report-from">Desde</Label>
          <Input
            type="date"
            id="report-from"
            name="from"
            defaultValue={f.from}
            className="portal-form-input"
            required
          />
        </div>
        <div className="portal-field">
          <Label htmlFor="report-to">Até</Label>
          <Input
            type="date"
            id="report-to"
            name="to"
            defaultValue={f.to}
            className="portal-form-input"
            required
          />
        </div>
        {report.operation ? (
          <div className="portal-field">
            <Label htmlFor="report-company">Empresa / escopo</Label>
            <select
              id="report-company"
              name="company"
              defaultValue={f.company}
              className="portal-form-input"
            >
              <option value="">
                {report.user.role === "ADMIN"
                  ? "Selecione o escopo"
                  : "Empresas do meu escopo"}
              </option>
              {report.user.role === "ADMIN" && (
                <option value="all">Todas as empresas ativas</option>
              )}
              {report.companies.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="company" value={f.company} />
        )}
        <div className="portal-field">
          <Label htmlFor="report-priority">Prioridade atual</Label>
          <select
            id="report-priority"
            name="priority"
            className="portal-form-input"
            defaultValue={f.priority}
          >
            <option value="">Todas</option>
            {Object.entries(priorityLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="portal-field">
          <Label htmlFor="report-level">Nível atual</Label>
          <select
            id="report-level"
            name="level"
            className="portal-form-input"
            defaultValue={f.level}
          >
            <option value="">Todos os autorizados</option>
            {["N1", "N2", "N3"].map((n) => (
              <option value={n} key={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        {f.department && (
          <input type="hidden" name="department" value={f.department} />
        )}
        <Button className="portal-primary-button" type="submit">
          Aplicar filtros
        </Button>
      </form>
      <p className="portal-muted">
        {report.companyName} · Datas no horário de São Paulo · Até 366 dias
      </p>
      {report.ownOnly && (
        <p className="portal-report-note">
          Relatório pessoal: somente os seus chamados estão incluídos.
        </p>
      )}
      {report.message && (
        <p role="status" className="portal-report-note">
          {report.message}
        </p>
      )}
    </Card>
  );
}
