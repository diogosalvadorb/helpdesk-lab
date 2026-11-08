"use client";

import { useRef, useState, useTransition } from "react";

import { sendTicketReply } from "@/actions/ticket-service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { replySchema } from "@/lib/validations/ticket-service";

export function TicketReplyForm({
  ticketId,
  companyId,
  mode,
  initialKey,
}: {
  ticketId: string;
  companyId: string;
  mode: "portal" | "operation";
  initialKey: string;
}) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [submissionKey, setSubmissionKey] = useState(initialKey);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  function submit() {
    if (busy.current) return;
    const result = replySchema.safeParse({
      ticketId,
      companyId,
      submissionKey,
      audience: mode,
      body,
      visibility,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      input.current?.focus();
      return;
    }
    if (visibility === "INTERNAL" && !confirmed) {
      setError("Confirme o envio como nota interna.");
      return;
    }
    busy.current = true;
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const response = await sendTicketReply(result.data);
        if (!response?.data?.ok) {
          setError(
            response?.data?.message ||
              response?.serverError ||
              "Não foi possível enviar. Tente novamente com a mesma mensagem.",
          );
          return;
        }
        setBody("");
        setConfirmed(false);
        setSubmissionKey(crypto.randomUUID());
        setNotice(
          response.data.emailFailed
            ? "Mensagem salva. A notificação por e-mail não pôde ser enviada; acompanhe pelo portal."
            : visibility === "INTERNAL"
              ? "Nota interna salva, visível somente para a equipe."
              : "Mensagem enviada.",
        );
      } catch {
        setError(
          "Não foi possível confirmar o envio. Tente novamente sem alterar o texto.",
        );
      } finally {
        busy.current = false;
      }
    });
  }
  return (
    <form
      className="portal-reply-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        {mode === "operation" ? (
          <fieldset className="portal-reply-types">
            <legend className="sr-only">Visibilidade da mensagem</legend>
            {(
              [
                ["PUBLIC", "Resposta pública"],
                ["INTERNAL", "Nota interna"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={visibility === value ? "active" : ""}
              >
                <input
                  type="radio"
                  name="reply-visibility"
                  value={value}
                  checked={visibility === value}
                  onChange={() => {
                    setVisibility(value);
                    setConfirmed(false);
                  }}
                />
                {label}
              </label>
            ))}
          </fieldset>
        ) : (
          <h3 className="portal-reply-title">Resposta pública</h3>
        )}
        {visibility === "INTERNAL" && (
          <p className="portal-internal-warning">
            Nota interna · Visível somente para a equipe de suporte. Não será
            enviada por e-mail ao cliente.
          </p>
        )}
        <div className="portal-field">
          <Label htmlFor="reply-body">Sua mensagem *</Label>
          <Textarea
            ref={input}
            id="reply-body"
            className="portal-form-input portal-form-description"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={10000}
            aria-invalid={!!error}
            aria-describedby="reply-error"
            placeholder={
              visibility === "INTERNAL"
                ? "Escreva uma nota para a equipe…"
                : "Escreva sua mensagem para o atendimento…"
            }
          />
        </div>
        {visibility === "INTERNAL" && (
          <label className="portal-note-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            Confirmo que esta mensagem é uma nota interna.
          </label>
        )}
        <p id="reply-error" role="alert" className="portal-field-error">
          {error}
        </p>
        <p role="status" className="portal-muted">
          {notice}
        </p>
        <div className="portal-form-footer">
          <small className="portal-muted">
            {visibility === "INTERNAL"
              ? "Somente a equipe poderá ler esta nota."
              : mode === "operation"
                ? "A resposta pública ficará visível para o cliente."
                : "Sua mensagem será enviada para a equipe de suporte."}
          </small>
          <Button
            type="submit"
            disabled={pending}
            className="portal-primary-button"
          >
            {pending
              ? "Enviando…"
              : visibility === "INTERNAL"
                ? "Salvar nota interna"
                : "Enviar mensagem"}
          </Button>
        </div>
        <p className="portal-muted portal-attachment-notice">
          Anexos indisponíveis: o armazenamento privado ainda não está
          configurado.
        </p>
      </fieldset>
    </form>
  );
}
