import Link from "next/link";
import { notFound } from "next/navigation";

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
import { getKnowledgeList } from "@/data/knowledge";

import { QueryPagination } from "../../_components/query-pagination";
export default async function KnowledgeManagement({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getKnowledgeList(await searchParams, true);
  if (!data) notFound();
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Conhecimento compartilhado</p>
          <h1>Respostas que ficam.</h1>
          <p>
            Organize, revise e publique os guias que ajudam sua equipe e seus
            clientes.
          </p>
        </div>
        <Link
          className="portal-primary-button"
          href="/operacao/conhecimento/novo"
        >
          Novo artigo
        </Link>
      </div>
      <Card className="portal-panel">
        <form
          action="/operacao/conhecimento"
          className="portal-article-filters"
        >
          <div className="portal-field">
            <Label htmlFor="manage-q">Buscar artigos</Label>
            <Input
              id="manage-q"
              name="q"
              defaultValue={data.filters.q}
              maxLength={120}
              className="portal-form-input"
            />
          </div>
          <div className="portal-field">
            <Label htmlFor="manage-status">Estado</Label>
            <select
              id="manage-status"
              name="status"
              defaultValue={data.filters.status}
              className="portal-form-input"
            >
              <option value="">Todos</option>
              <option value="DRAFT">Rascunhos</option>
              <option value="PUBLISHED">Publicados</option>
              <option value="ARCHIVED">Arquivados</option>
            </select>
          </div>
          <div className="portal-field">
            <Label htmlFor="manage-visibility">Visibilidade</Label>
            <select
              id="manage-visibility"
              name="visibility"
              defaultValue={data.filters.visibility}
              className="portal-form-input"
            >
              <option value="">Todas</option>
              <option value="PUBLIC">Clientes e equipe</option>
              <option value="INTERNAL">Interno</option>
            </select>
          </div>
          <div className="portal-field">
            <Label htmlFor="manage-category">Categoria</Label>
            <select
              id="manage-category"
              name="category"
              defaultValue={data.filters.category}
              className="portal-form-input"
            >
              <option value="">Todas</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
        <div
          className="portal-admin-table"
          tabIndex={0}
          role="region"
          aria-label="Artigos da operação"
        >
          <Table className="portal-table">
            <TableHeader>
              <TableRow>
                {[
                  "Artigo",
                  "Categoria",
                  "Visibilidade",
                  "Estado",
                  "Atualizado",
                  "Ações",
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.articles.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <b>{a.title}</b>
                    <small>Por {a.author.name}</small>
                  </TableCell>
                  <TableCell>{a.category.name}</TableCell>
                  <TableCell>
                    {a.visibility === "PUBLIC"
                      ? "Clientes e equipe"
                      : "Interno"}
                  </TableCell>
                  <TableCell>
                    {a.status === "PUBLISHED"
                      ? "Publicado"
                      : a.status === "ARCHIVED"
                        ? "Arquivado"
                        : "Rascunho"}
                  </TableCell>
                  <TableCell>
                    {a.updatedAt.toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="portal-editor-actions">
                      <Link href={`/operacao/conhecimento/${a.id}/visualizar`}>
                        Visualizar
                      </Link>
                      {a.editable && (
                        <Link href={`/operacao/conhecimento/${a.id}`}>
                          Editar
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {!data.articles.length && (
          <p className="portal-empty">
            Nenhum artigo disponível para estes filtros.
          </p>
        )}
        <QueryPagination
          path="/operacao/conhecimento"
          filters={data.filters}
          page={data.filters.page}
          total={data.total}
        />
      </Card>
    </>
  );
}
