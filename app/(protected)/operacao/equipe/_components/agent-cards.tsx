import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AdministrativeList } from "@/data/administration";

import { AdministrationEditor } from "../../../_components/administration-editor";
export function AgentCards({ data }: { data: AdministrativeList }) {
  const availability: Record<string, string> = {
    AVAILABLE: "Disponível",
    BUSY: "Ocupado",
    AWAY: "Ausente",
    OFFLINE: "Offline",
  };
  return (
    <div className="portal-admin-agent-grid">
      {data.records.map((r) => {
        if (r.input.entity !== "agent") return null;
        const [used, capacity] = r.values[3].split("/").map(Number);
        return (
          <Card className="portal-panel portal-admin-agent" key={r.id}>
            <div className="portal-admin-agent-head">
              <span className="portal-avatar" aria-hidden="true">
                {r.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h2>{r.name}</h2>
                <small>
                  {r.values[1]} · {r.values[0]}
                </small>
              </div>
            </div>
            <Badge className="portal-badge">
              {r.values[4] === "Inativo"
                ? "Inativo"
                : availability[r.values[2]] || r.values[2]}
            </Badge>
            <p>
              Chamados atribuídos <b>{used}</b>
            </p>
            <p>
              Capacidade em uso <b>{Math.round((used / capacity) * 100)}%</b>
            </p>
            <progress
              aria-label={`Capacidade de ${r.name}`}
              max={capacity}
              value={used}
            />
            <AdministrationEditor
              entity="agent"
              options={data.options}
              initial={r.input}
              impact={r.impact}
            />
          </Card>
        );
      })}
    </div>
  );
}
