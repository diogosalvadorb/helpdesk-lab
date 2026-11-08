import { BookOpen } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getKnowledgeList } from "@/data/knowledge";
import { getPortalContext } from "@/data/portal-context";

import { PendingAccess } from "../_components/pending-access";
import { queryHref, QueryPagination } from "../_components/query-pagination";
export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const data = await getKnowledgeList(await searchParams);
  if (!data) return <PendingAccess context={context} />;
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Respostas ao seu alcance</p>
          <h1>Encontre seu próximo passo.</h1>
          <p>Guias e orientações para facilitar o dia a dia da sua equipe.</p>
        </div>
      </div>
      <Card className="portal-panel portal-knowledge-search">
        <h2>O que você precisa resolver?</h2>
        <form action="/conhecimento" className="portal-article-filters">
          <div className="portal-field">
            <Label htmlFor="knowledge-q">Buscar artigos</Label>
            <Input
              id="knowledge-q"
              name="q"
              defaultValue={data.filters.q}
              maxLength={120}
              placeholder="Artigos, dúvidas ou palavras-chave…"
              className="portal-form-input"
            />
          </div>
          <div className="portal-field">
            <Label htmlFor="knowledge-category">Categoria</Label>
            <select
              id="knowledge-category"
              name="category"
              defaultValue={data.filters.category}
              className="portal-form-input"
            >
              <option value="">Todas as categorias</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="portal-primary-button">
            Buscar
          </Button>
        </form>
      </Card>
      <div className="portal-knowledge-categories">
        {data.categories
          .filter((c) => c.count > 0)
          .map((c) => (
            <Card key={c.id} className="portal-panel">
              <BookOpen aria-hidden="true" />
              <h2>{c.name}</h2>
              <p>{c.count} artigo(s) publicado(s)</p>
              <Link
                href={queryHref("/conhecimento", {
                  category: c.id,
                  q: data.filters.q,
                })}
              >
                Explorar categoria →
              </Link>
            </Card>
          ))}
      </div>
      <Card className="portal-panel">
        <h2>Artigos e orientações</h2>
        {data.articles.length ? (
          data.articles.map((a) => (
            <Link
              className="portal-knowledge-row"
              key={a.id}
              href={`/conhecimento/${a.id}`}
            >
              <span>
                <b>{a.title}</b>
                <small>
                  {a.category.name} · {a.readingMinutes} min de leitura
                </small>
              </span>
              <span aria-hidden="true">Ler artigo ↗</span>
            </Link>
          ))
        ) : (
          <p className="portal-empty">
            Nenhum artigo encontrado. Tente outra busca ou categoria.
          </p>
        )}
        <QueryPagination
          path="/conhecimento"
          filters={data.filters}
          page={data.filters.page}
          total={data.total}
        />
      </Card>
    </>
  );
}
