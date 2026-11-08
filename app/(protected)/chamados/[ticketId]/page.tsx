import { notFound } from "next/navigation";

import { getTicketConversation } from "@/data/ticket-service";

import { TicketConversation } from "../../_components/ticket-conversation";

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticketId: string }>;
  searchParams: Promise<{ page?: string; events?: string }>;
}) {
  const { ticketId } = await params;
  const query = await searchParams;
  const ticket = await getTicketConversation(
    ticketId,
    "portal",
    Number(query.page || 1),
    Number(query.events || 1),
  );
  if (!ticket) notFound();
  return <TicketConversation ticket={ticket} />;
}
