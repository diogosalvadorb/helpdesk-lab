import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdministrativeList } from "@/data/administration";
import { priorityLabels } from "@/lib/portal-format";

import {
  AdministrationEditor,
  PolicyStateButton,
} from "../../../../_components/administration-editor";
export function PolicyCards({ data }: { data: AdministrativeList }) {
  return (
    <div className="portal-admin-policy-stack">
      {data.records.map((r) => {
        if (r.input.entity !== "policy") return null;
        const policy = r.input;
        return (
          <Card className="portal-panel" key={r.id}>
            <div className="portal-card-head">
              <div>
                <h2>
                  {r.name} · {r.values[0]}
                </h2>
                <p className="portal-muted">
                  {r.values[1]} · {r.values[2]} contrato(s)
                </p>
              </div>
              <Badge className="portal-badge">
                {policy.active ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <div
              className="portal-admin-table"
              tabIndex={0}
              role="region"
              aria-label={`Metas da política ${r.name}`}
            >
              <Table className="portal-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>1ª resposta</TableHead>
                    <TableHead>Resolução</TableHead>
                    <TableHead>Alerta em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...policy.targets]
                    .sort(
                      (a, b) =>
                        ["CRITICAL", "HIGH", "MEDIUM", "LOW"].indexOf(
                          a.priority,
                        ) -
                        ["CRITICAL", "HIGH", "MEDIUM", "LOW"].indexOf(
                          b.priority,
                        ),
                    )
                    .map((t) => (
                      <TableRow key={t.priority}>
                        <TableCell>{priorityLabels[t.priority]}</TableCell>
                        <TableCell>
                          {t.firstResponseMinutes} min úteis
                        </TableCell>
                        <TableCell>{t.resolutionMinutes} min úteis</TableCell>
                        <TableCell>{t.warningPercent}%</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <p>
              Pausar enquanto aguarda o cliente:{" "}
              <b>{policy.pauseWhileWaitingCustomer ? "Sim" : "Não"}</b>
            </p>
            <p>
              Escalonamento automático:{" "}
              {policy.rules
                .filter((r) => r.active)
                .map(
                  (r) =>
                    `${r.fromLevel} → ${r.toLevel} em ${r.resolutionPercent}%`,
                )
                .join(" · ") || "Sem regras ativas"}
            </p>
            <div className="portal-admin-row-actions">
              <AdministrationEditor
                entity="policy"
                options={data.options}
                initial={policy}
              />
              <PolicyStateButton
                id={r.id}
                version={policy.version!}
                active={policy.active}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
