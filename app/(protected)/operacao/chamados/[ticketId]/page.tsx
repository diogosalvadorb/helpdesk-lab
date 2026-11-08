import { notFound } from "next/navigation";

import { getLifecycleOptions } from "@/data/ticket-lifecycle";
import {
  getServiceOptions,
  getTicketConversation,
} from "@/data/ticket-service";

import { TicketConversation } from "../../../_components/ticket-conversation";
import { TicketLifecycleControls } from "../../../_components/ticket-lifecycle-controls";
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
  const [ticket, options, lifecycleOptions] = await Promise.all([
    getTicketConversation(
      ticketId,
      "operation",
      Number(query.page || 1),
      Number(query.events || 1),
    ),
    getServiceOptions(ticketId),
    getLifecycleOptions(ticketId),
  ]);
  if (!ticket || !options) notFound();
  return (
    <TicketConversation
      ticket={ticket}
      controls={
        <>
          <TicketLifecycleControls
            ticket={ticket}
            options={lifecycleOptions}
            mode="operation"
          />
          <TicketControls ticket={ticket} options={options} />
        </>
      }
    />
  );
}
