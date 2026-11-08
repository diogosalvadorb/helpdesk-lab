import Link from "next/link";
import type { ReactNode } from "react";

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
import type { AdministrativeList } from "@/data/administration";

import {
  AdministrationEditor,
  PolicyStateButton,
} from "./administration-editor";

const labels: Record<string, string> = {
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  ARCHIVED: "Arquivado",
  PENDING: "Pendente",
  REJECTED: "Rejeitado",
  REQUESTER: "Solicitante",
  MANAGER: "Gestor",
  ADMIN: "Administrador",
  CLIENT: "Cliente",
  AGENT: "Agente",
  AVAILABLE: "Disponível",
  BUSY: "Ocupado",
  AWAY: "Ausente",
  OFFLINE: "Offline",
  DRAFT: "Rascunho",
  EXPIRED: "Expirado",
  CANCELED: "Cancelado",
};
export function AdministrationList({
  data,
  path,
  params = {},
  children,
}: {
  data: AdministrativeList;
  path: string;
  params?: Record<string, string>;
  children?: ReactNode;
}) {
  const { records, columns, filters, options, entity, total } = data;
  const pageHref = (page: number) => {
    const q = new URLSearchParams({
      ...params,
      q: filters.q,
      company: filters.company,
      status: filters.status,
      page: String(page),
    });
    return `${path}?${q}`;
  };
  const statuses =
    entity === "company"
      ? ["ACTIVE", "SUSPENDED", "ARCHIVED"]
      : entity === "member"
        ? ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"]
        : entity === "contract"
          ? ["DRAFT", "ACTIVE", "EXPIRED", "CANCELED"]
          : entity === "calendar"
            ? []
            : ["active", "inactive"];
  return (
    <Card className="portal-panel portal-admin-list">
      <form action={path} className="portal-admin-filters">
        {Object.entries(params).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <div className="portal-field">
          <Label htmlFor={`admin-${entity}-q`}>Buscar</Label>
          <Input
            id={`admin-${entity}-q`}
            name="q"
            defaultValue={filters.q}
            maxLength={120}
            placeholder="Buscar por nome, e-mail ou referência…"
            className="portal-form-input"
          />
        </div>
        {!data.portal && ["department", "contract"].includes(entity) && (
          <div className="portal-field">
            <Label htmlFor={`admin-${entity}-company`}>Empresa</Label>
            <select
              id={`admin-${entity}-company`}
              className="portal-form-input"
              name="company"
              defaultValue={filters.company}
            >
              <option value="">Todas as empresas</option>
              {options.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {statuses.length > 0 && (
          <div className="portal-field">
            <Label htmlFor={`admin-${entity}-status`}>Estado</Label>
            <select
              id={`admin-${entity}-status`}
              className="portal-form-input"
              name="status"
              defaultValue={filters.status}
            >
              <option value="">Todos os estados</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "active"
                    ? "Ativo"
                    : s === "inactive"
                      ? "Inativo"
                      : labels[s] || s}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button
          type="submit"
          variant="outline"
          className="portal-outline-button"
        >
          Filtrar
        </Button>
      </form>
      {children || (
        <div
          className="portal-admin-table"
          tabIndex={0}
          role="region"
          aria-label="Cadastros e ações"
        >
          <Table className="portal-table">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                {columns.map((c) => (
                  <TableHead key={c}>{c}</TableHead>
                ))}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.href ? (
                      <Link href={r.href}>
                        <b>{r.name}</b>
                      </Link>
                    ) : (
                      <b>{r.name}</b>
                    )}
                    {r.subtitle && <small>{r.subtitle}</small>}
                  </TableCell>
                  {r.values.map((v, i) => (
                    <TableCell key={i}>
                      {i === r.values.length - 1 && entity !== "calendar" ? (
                        <Badge className="portal-badge">{labels[v] || v}</Badge>
                      ) : (
                        labels[v] || v
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="portal-admin-row-actions">
                      {r.href && <Link href={r.href}>Ver empresa</Link>}
                      <AdministrationEditor
                        entity={entity}
                        options={options}
                        initial={r.input}
                        impact={r.impact}
                      />
                      {r.input.entity === "policy" && (
                        <PolicyStateButton
                          id={r.id}
                          version={r.input.version!}
                          active={r.input.active}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!records.length && (
        <p className="portal-admin-empty">
          Nenhum cadastro encontrado para estes filtros.
        </p>
      )}
      <nav className="portal-pagination" aria-label="Paginação dos cadastros">
        <span>
          {records.length
            ? `${(filters.page - 1) * 10 + 1}–${(filters.page - 1) * 10 + records.length}`
            : "0"}{" "}
          de {total} registros
        </span>
        <div>
          {filters.page > 1 && (
            <Link
              href={pageHref(filters.page - 1)}
              className="portal-outline-button"
            >
              Anterior
            </Link>
          )}
          <span>Página {filters.page}</span>
          {filters.page * 10 < total && (
            <Link
              href={pageHref(filters.page + 1)}
              className="portal-outline-button"
            >
              Próxima →
            </Link>
          )}
        </div>
      </nav>
    </Card>
  );
}
