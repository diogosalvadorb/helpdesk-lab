"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveArticle } from "@/actions/knowledge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { readingMinutes } from "@/lib/knowledge-access";
import { type ArticleInput, articleSchema } from "@/lib/validations/portal";

import { ArticleContent } from "../../../_components/article-content";
export function ArticleEditor({
  initial,
  categories,
  admin,
  submissionKey,
}: {
  initial?: Omit<ArticleInput, "submissionKey">;
  categories: { id: string; name: string }[];
  admin: boolean;
  submissionKey: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? ""),
    [body, setBody] = useState(initial?.body ?? ""),
    [preview, setPreview] = useState(false),
    [error, setError] = useState(""),
    [pending, startTransition] = useTransition(),
    router = useRouter();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget),
          submitter = (event.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
        const input = articleSchema.safeParse({
          id: initial?.id,
          version: initial?.version,
          submissionKey,
          title,
          body,
          slug: String(form.get("slug")),
          categoryId: String(form.get("categoryId")),
          visibility: String(form.get("visibility")),
          status: submitter?.value || "DRAFT",
          keywords: String(form.get("keywords"))
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        });
        if (!input.success) {
          setError(input.error.issues[0].message);
          return;
        }
        startTransition(async () => {
          const result = await saveArticle(input.data);
          if (result?.data?.ok) {
            router.push(`/operacao/conhecimento/${result.data.id}/visualizar`);
            router.refresh();
          } else
            setError(
              result?.data?.message ||
                result?.serverError ||
                "Revise os dados informados.",
            );
        });
      }}
    >
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Base de conhecimento</p>
          <h1>Compartilhe uma solução.</h1>
          <p>Um guia claro hoje pode resolver o chamado de amanhã.</p>
        </div>
        <div className="portal-editor-actions">
          <Button
            type="submit"
            value="DRAFT"
            variant="outline"
            disabled={pending}
          >
            Salvar rascunho
          </Button>
          <Button
            type="submit"
            value="PUBLISHED"
            className="portal-primary-button"
            disabled={pending}
          >
            Publicar artigo
          </Button>
          {initial && (
            <Button
              type="submit"
              value="ARCHIVED"
              variant="outline"
              disabled={pending}
            >
              Arquivar
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="portal-form-error">
          {error}
        </p>
      )}
      {pending && <p role="status">Salvando artigo…</p>}
      <div className="portal-article-layout">
        <Card className="portal-panel portal-article-editor">
          <div className="portal-field">
            <Label htmlFor="article-title">Título *</Label>
            <Input
              id="article-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={5}
              maxLength={180}
              required
              className="portal-form-input"
              disabled={pending}
            />
          </div>
          <div className="portal-field">
            <Label htmlFor="article-slug">Identificador (slug) *</Label>
            <Input
              id="article-slug"
              name="slug"
              defaultValue={initial?.slug ?? ""}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              minLength={3}
              maxLength={120}
              required
              className="portal-form-input"
              placeholder="como-solicitar-acesso"
              disabled={pending}
            />
          </div>
          <div className="portal-field">
            <Label htmlFor="article-body">Conteúdo em texto simples *</Label>
            <Textarea
              id="article-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              minLength={20}
              maxLength={50000}
              required
              disabled={pending}
              className="portal-form-input portal-article-textarea"
            />
          </div>
          <small>
            {readingMinutes(body)} min de leitura · Imagens e formatação HTML
            não são suportadas.
          </small>
        </Card>
        <div className="portal-stack">
          <Card className="portal-panel">
            <h2>Publicação</h2>
            <div className="portal-field">
              <Label htmlFor="article-visibility">Visibilidade</Label>
              <select
                id="article-visibility"
                name="visibility"
                defaultValue={initial?.visibility ?? "INTERNAL"}
                className="portal-form-input"
                disabled={pending}
              >
                <option value="INTERNAL">Equipe de suporte</option>
                {admin && <option value="PUBLIC">Clientes e equipe</option>}
              </select>
            </div>
            <div className="portal-field">
              <Label htmlFor="article-category">Categoria *</Label>
              <select
                id="article-category"
                name="categoryId"
                defaultValue={initial?.categoryId ?? ""}
                required
                className="portal-form-input"
                disabled={pending}
              >
                <option value="">Selecione</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="portal-field">
              <Label htmlFor="article-keywords">
                Palavras-chave (separadas por vírgula)
              </Label>
              <Input
                id="article-keywords"
                name="keywords"
                defaultValue={initial?.keywords.join(", ") ?? ""}
                maxLength={820}
                className="portal-form-input"
                disabled={pending}
              />
            </div>
            <p>
              Estado atual:{" "}
              {initial?.status === "PUBLISHED"
                ? "Publicado"
                : initial?.status === "ARCHIVED"
                  ? "Arquivado"
                  : "Rascunho"}
            </p>
          </Card>
          <Card className="portal-panel portal-article-help">
            <h2>Um artigo que ajuda</h2>
            <p>
              Use um título direto, explique um passo por vez e revise antes de
              publicar.
            </p>
            <Button
              type="button"
              variant="outline"
              aria-expanded={preview}
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Ocultar prévia" : "Pré-visualizar"}
            </Button>
            <Link href="/operacao/conhecimento">Voltar à gestão →</Link>
          </Card>
        </div>
      </div>
      {preview && (
        <Card className="portal-panel portal-editor-preview">
          <h2>{title || "Pré-visualização do artigo"}</h2>
          <ArticleContent body={body} />
        </Card>
      )}
    </form>
  );
}
