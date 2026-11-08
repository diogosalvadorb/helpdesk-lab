import Link from "next/link";

import { getPortalContext } from "@/data/portal-context";
import { getTicketListing } from "@/data/portal-tickets";
import { statusLabels } from "@/lib/portal-format";

import { PendingAccess } from "../_components/pending-access";
import { QueryPagination } from "../_components/query-pagination";
import { RecentTickets } from "../_components/recent-tickets";
import { TicketFilters } from "./_components/ticket-filters";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const data = await getTicketListing(await searchParams);
  if (!data) return <PendingAccess context={context} />;
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Seu atendimento em movimento</p>
          <h1>Seus chamados, por inteiro.</h1>
          <p>Acompanhe cada solicitação com clareza e segurança.</p>
        </div>
        <Link href="/chamados/novo" className="portal-primary-button">
          Abrir chamado
        </Link>
      </div>
      <TicketFilters data={data} />
      <div
        className="portal-ticket-summary"
        aria-label="Contagem dos resultados"
      >
        <span>{data.total} chamado(s) encontrado(s)</span>
        {data.groups.map((g) => (
          <span key={g.status}>
            {statusLabels[g.status]}: {g.count}
          </span>
        ))}
      </div>
      <RecentTickets
        tickets={data.rows}
        all
        emptyMessage="Nenhum chamado encontrado. Revise os filtros ou abra um novo chamado."
      />
      <QueryPagination
        path="/chamados"
        filters={data.filters}
        page={data.filters.page}
        total={data.total}
      />
    </>
  );
}
