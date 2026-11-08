"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createTicket } from "@/actions/tickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { getTicketCreationOptions } from "@/data/tickets";
import {
  type CreateTicketInput,
  createTicketSchema,
} from "@/lib/validations/ticket";

import { PortalLink } from "../../_components/portal-link";

type Options = NonNullable<
  Awaited<ReturnType<typeof getTicketCreationOptions>>
>;

export function CreateTicketForm({
  options,
  submissionKey,
}: {
  options: Options;
  submissionKey: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      companyId: options.company.id,
      submissionKey,
      impact: "MEDIUM",
      subject: "",
      description: "",
      categoryId: "",
      departmentId: options.departments.some(
        (d) => d.id === options.departmentId,
      )
        ? options.departmentId!
        : "",
    },
  });
  useEffect(() => {
    if (!isDirty) return;
    const leave = (event: BeforeUnloadEvent) => {
      if (!submitting.current) event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      if (
        submitting.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (
        anchor &&
        anchor.target !== "_blank" &&
        new URL(anchor.href).pathname !== location.pathname &&
        !window.confirm(
          "Descartar os dados deste chamado e sair do formulário?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", leave);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("click", navigate, true);
    };
  }, [isDirty]);
  const submit = (values: CreateTicketInput) => {
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    startTransition(async () => {
      try {
        const result = await createTicket(values);
        if (!result?.data?.ok) {
          setError(
            result?.data?.message ||
              result?.serverError ||
              "Revise os campos e tente novamente.",
          );
          submitting.current = false;
          return;
        }
        router.push(`/chamados/${result.data.ticketId}/enviado`);
        router.refresh();
      } catch {
        submitting.current = false;
        setError(
          "Não foi possível confirmar o envio. Tente novamente sem alterar os dados para evitar duplicidade.",
        );
      }
    });
  };
  const fieldError = (field: keyof CreateTicketInput) =>
    errors[field] ? (
      <p id={`${field}-error`} className="portal-field-error" role="alert">
        {errors[field]?.message}
      </p>
    ) : null;
  const disabled = !options.departments.length || !options.categories.length;
  return (
    <Card className="portal-card portal-new-ticket-card">
      <div className="portal-card-head">
        <div>
          <h2>Abrir um chamado</h2>
          <p className="portal-muted">Os campos com * são obrigatórios.</p>
        </div>
        <Badge className="portal-badge">Nova solicitação</Badge>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(submit)(event);
        }}
        className="portal-ticket-form"
        aria-busy={pending}
      >
        <fieldset disabled={pending || disabled}>
          <div className="portal-form-row">
            <div className="portal-field">
              <Label htmlFor="ticket-company">Empresa *</Label>
              <Input
                id="ticket-company"
                value={options.company.name}
                readOnly
                className="portal-form-input"
              />
              <small>Para trocar, use o seletor de empresa do menu.</small>
            </div>
            <div className="portal-field">
              <Label htmlFor="departmentId">Departamento *</Label>
              <select
                id="departmentId"
                required
                className="portal-form-input"
                {...register("departmentId")}
                aria-invalid={!!errors.departmentId}
                aria-describedby="departmentId-error"
              >
                <option value="">Selecione um departamento</option>
                {options.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {fieldError("departmentId")}
            </div>
          </div>
          <div className="portal-field">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              required
              className="portal-form-input"
              placeholder="Ex.: Não consigo acessar o sistema financeiro"
              maxLength={160}
              {...register("subject")}
              aria-invalid={!!errors.subject}
              aria-describedby="subject-help subject-error"
            />
            <small id="subject-help">
              Um título claro ajuda a encontrar a solução mais rápido.
            </small>
            {fieldError("subject")}
          </div>
          <div className="portal-form-row">
            <div className="portal-field">
              <Label htmlFor="categoryId">Categoria *</Label>
              <select
                id="categoryId"
                required
                className="portal-form-input"
                {...register("categoryId")}
                aria-invalid={!!errors.categoryId}
                aria-describedby="categoryId-error"
              >
                <option value="">Selecione uma categoria</option>
                {options.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldError("categoryId")}
            </div>
            <fieldset className="portal-field">
              <legend>Impacto no trabalho *</legend>
              <div className="portal-impact-options">
                {(
                  [
                    ["LOW", "Baixo"],
                    ["MEDIUM", "Médio"],
                    ["HIGH", "Alto"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value}>
                    <input
                      required
                      type="radio"
                      value={value}
                      {...register("impact")}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {fieldError("impact")}
            </fieldset>
          </div>
          <div className="portal-field">
            <Label htmlFor="description">Descreva o problema *</Label>
            <Textarea
              id="description"
              required
              className="portal-form-input portal-form-description"
              placeholder="O que aconteceu? Quando começou? Alguma mensagem de erro?"
              maxLength={10000}
              {...register("description")}
              aria-invalid={!!errors.description}
              aria-describedby="description-error"
            />
            {fieldError("description")}
          </div>
        </fieldset>
        {disabled && (
          <p className="portal-field-error" role="alert">
            Não há departamentos ou categorias disponíveis. Entre em contato com
            o suporte antes de abrir o chamado.
          </p>
        )}
        <div className="portal-field">
          <span>Anexos</span>
          <div className="portal-upload-unavailable">
            <Upload aria-hidden="true" />
            <b>Anexos indisponíveis no momento</b>
            <small>
              Descreva o problema no campo acima. O envio de arquivos ainda não
              está disponível.
            </small>
          </div>
        </div>
        <p className="portal-muted">
          A prioridade inicial é média. A equipe poderá reclassificar conforme a
          análise.
        </p>
        <div role="status" aria-live="polite">
          {error && <p className="portal-field-error">{error}</p>}
        </div>
        <div className="portal-form-footer">
          <PortalLink href="/chamados">Cancelar</PortalLink>
          <Button
            className="portal-primary-button"
            type="submit"
            disabled={pending || disabled}
          >
            {pending ? "Enviando…" : "Enviar chamado"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
