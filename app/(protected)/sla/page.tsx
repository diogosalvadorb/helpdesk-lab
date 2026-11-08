import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getServiceAgreement } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";
import { getPortalSla } from "@/data/portal-sla";

import { DashboardHeading } from "../_components/dashboard-heading";
import { PendingAccess } from "../_components/pending-access";
import { ServiceAgreement } from "../_components/service-agreement";
import { slaBucketLabels, SlaResults } from "./_components/sla-results";

export default async function SlaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const agreement = await getServiceAgreement();
  const data = await getPortalSla(await searchParams);
  if (!data) return <PendingAccess context={context} />;
  return (
    <>
      <DashboardHeading title="Clareza em cada prazo." />
      <div className="portal-metrics">
        {[
          [
            "SLA cumprido",
            data.compliance === null
              ? "Sem dados"
              : `${data.compliance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
            `${data.sample} ciclo(s) com medição elegível`,
          ],
          [
            "Primeira resposta",
            data.responseMinutes === null
              ? "Sem dados"
              : `${data.responseMinutes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} min`,
            "Média em tempo útil",
          ],
          ["Em risco", data.counts.warning, "Próximos vencimentos"],
          [
            "SLA violado",
            data.counts.breached,
            "Chamados ativos com prazo excedido",
          ],
        ].map(([label, value, help]) => (
          <Card className="portal-card portal-metric" key={label}>
            <p>{label}</p>
            <strong className="portal-sla-metric-value">{value}</strong>
            <small>{help}</small>
          </Card>
        ))}
      </div>
      <Card className="portal-panel">
        <form action="/sla" className="portal-article-filters">
          <div className="portal-field">
            <Label htmlFor="sla-from">Resoluções desde (UTC)</Label>
            <Input
              id="sla-from"
              name="from"
              type="date"
              defaultValue={data.from}
              className="portal-form-input"
            />
          </div>
          <div className="portal-field">
            <Label htmlFor="sla-to">Resoluções até (UTC)</Label>
            <Input
              id="sla-to"
              name="to"
              type="date"
              defaultValue={data.to}
              className="portal-form-input"
            />
          </div>
          <div className="portal-field">
            <Label htmlFor="sla-bucket">Situação dos ativos</Label>
            <select
              id="sla-bucket"
              name="bucket"
              defaultValue={data.bucket}
              className="portal-form-input"
            >
              <option value="all">Todas</option>
              {Object.entries(slaBucketLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} ({data.counts[key as keyof typeof data.counts]})
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
        {data.invalidPeriod && (
          <p role="alert" className="portal-form-error">
            Revise as datas do período.
          </p>
        )}
      </Card>
      <SlaResults data={data} />
      <ServiceAgreement agreement={agreement} expanded />
    </>
  );
}
