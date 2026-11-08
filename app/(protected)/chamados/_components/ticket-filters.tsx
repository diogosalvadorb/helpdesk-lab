import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { getTicketListing } from "@/data/portal-tickets";
import { priorityLabels, statusLabels } from "@/lib/portal-format";
export function TicketFilters({
  data,
}: {
  data: NonNullable<Awaited<ReturnType<typeof getTicketListing>>>;
}) {
  const { filters } = data;
  return (
    <Card className="portal-panel">
      <form action="/chamados" className="portal-ticket-filters">
        <div className="portal-field">
          <Label htmlFor="tickets-q">Buscar chamado</Label>
          <Input
            id="tickets-q"
            name="q"
            defaultValue={filters.q}
            className="portal-form-input"
            maxLength={120}
            placeholder="Assunto ou #CH-2048"
          />
        </div>
        <div className="portal-field">
          <Label htmlFor="tickets-status">Status</Label>
          <select
            id="tickets-status"
            name="status"
            defaultValue={filters.status}
            className="portal-form-input"
          >
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="portal-field">
          <Label htmlFor="tickets-priority">Prioridade</Label>
          <select
            id="tickets-priority"
            name="priority"
            defaultValue={filters.priority}
            className="portal-form-input"
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
          <Label htmlFor="tickets-department">Departamento</Label>
          <select
            id="tickets-department"
            name="department"
            defaultValue={filters.department}
            className="portal-form-input"
          >
            <option value="">Todos</option>
            {data.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="portal-field">
          <Label htmlFor="tickets-from">Criados desde (UTC)</Label>
          <Input
            id="tickets-from"
            name="from"
            type="date"
            defaultValue={filters.from}
            className="portal-form-input"
          />
        </div>
        <div className="portal-field">
          <Label htmlFor="tickets-to">Criados até (UTC)</Label>
          <Input
            id="tickets-to"
            name="to"
            type="date"
            defaultValue={filters.to}
            className="portal-form-input"
          />
        </div>
        <div className="portal-field">
          <Label htmlFor="tickets-sort">Ordenação</Label>
          <select
            id="tickets-sort"
            name="sort"
            defaultValue={filters.sort}
            className="portal-form-input"
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="updated">Última atualização</option>
            <option value="priority">Maior prioridade</option>
          </select>
        </div>
        <Button type="submit" className="portal-primary-button">
          Filtrar chamados
        </Button>
      </form>
      {filters.invalidPeriod && (
        <p role="alert" className="portal-form-error">
          O fim do período deve ser igual ou posterior ao início.
        </p>
      )}
    </Card>
  );
}
