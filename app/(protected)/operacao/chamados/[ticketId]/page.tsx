import { notFound } from "next/navigation";

import {
  getServiceOptions,
  getTicketConversation,
} from "@/data/ticket-service";

import { TicketConversation } from "../../../_components/ticket-conversation";
import { TicketControls } from "../../_components/ticket-controls";

export default async function ServiceTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticketId: string }>;
  searchParams: Promise<{ page?: string; events?: string }>;
}) {
  const { ticketId } = await params;
  const query = await searchParams;
  const [ticket, options] = await Promise.all([
    getTicketConversation(
      ticketId,
      "operation",
      Number(query.page || 1),
      Number(query.events || 1),
    ),
    getServiceOptions(ticketId),
  ]);
  if (!ticket || !options) notFound();
  return (
    <TicketConversation
      ticket={ticket}
      controls={<TicketControls ticket={ticket} options={options} />}
    />
  );
}
