"use client";

import { Star } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { rateTicket } from "@/actions/ticket-lifecycle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { getTicketRating } from "@/data/ticket-lifecycle";

export function TicketRatingForm({
  ticket,
}: {
  ticket: NonNullable<Awaited<ReturnType<typeof getTicketRating>>>;
}) {
  const [score, setScore] = useState(ticket.rating?.score || 0),
    [comment, setComment] = useState(ticket.rating?.comment || ""),
    [message, setMessage] = useState(""),
    [saved, setSaved] = useState(Boolean(ticket.rating));
  const [pending, startTransition] = useTransition(),
    busy = useRef(false);
  function submit() {
    if (busy.current || saved) return;
    if (!score) {
      setMessage("Escolha uma nota de 1 a 5.");
      return;
    }
    busy.current = true;
    startTransition(async () => {
      try {
        const result = await rateTicket({
          ticketId: ticket.id,
          score,
          comment,
        });
        if (!result?.data?.ok) {
          setMessage(
            result?.data?.message ||
              result?.serverError ||
              "Não foi possível registrar a avaliação.",
          );
          return;
        }
        setSaved(true);
        setMessage("Obrigado! Sua avaliação foi registrada.");
      } catch {
        setMessage(
          "Não foi possível confirmar. Tente novamente com a mesma avaliação.",
        );
      } finally {
        busy.current = false;
      }
    });
  }
  return (
    <Card className="portal-card portal-rating-card">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={pending || saved} className="portal-rating-stars">
          <legend className="sr-only">Nota de 1 a 5 estrelas</legend>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className={score >= value ? "selected" : ""}>
              <Star aria-hidden="true" />
              <input
                type="radio"
                name="rating"
                aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                value={value}
                checked={score === value}
                onChange={() => setScore(value)}
              />
            </label>
          ))}
        </fieldset>
        <p className="portal-muted">1 · Pode melhorar &nbsp; 5 · Excelente</p>
        <div className="portal-field">
          <Label htmlFor="rating-comment">Quer contar mais?</Label>
          <Textarea
            id="rating-comment"
            className="portal-form-input portal-form-description"
            value={comment}
            maxLength={2000}
            disabled={pending || saved}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Seu comentário é opcional."
          />
        </div>
        <p role="status" className="portal-muted">
          {message ||
            (saved
              ? "Avaliação já registrada. Ela não pode ser alterada."
              : "")}
        </p>
        {!saved && (
          <Button
            className="portal-primary-button"
            type="submit"
            disabled={pending}
          >
            {pending ? "Enviando…" : "Enviar avaliação"}
          </Button>
        )}
      </form>
    </Card>
  );
}
