import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getKnowledgeEditor } from "@/data/knowledge";

import { ArticleContent } from "../../../../_components/article-content";
export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const data = await getKnowledgeEditor((await params).articleId, true),
    a = data.article!;
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Revisão / {a.category.name}</p>
          <h1>{a.title}</h1>
          <p>
            {a.visibility === "PUBLIC" ? "Clientes e equipe" : "Interno"} ·{" "}
            {a.status === "PUBLISHED"
              ? "Publicado"
              : a.status === "ARCHIVED"
                ? "Arquivado"
                : "Rascunho"}{" "}
            · {a.readingMinutes} min de leitura
          </p>
          <p>Atualizado em {a.updatedAt.toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="portal-editor-actions">
          {data.editable && (
            <Link
              className="portal-primary-button"
              href={`/operacao/conhecimento/${a.id}`}
            >
              Editar artigo
            </Link>
          )}
          <Link className="portal-outline-button" href="/operacao/conhecimento">
            Voltar à gestão
          </Link>
        </div>
      </div>
      <Card className="portal-panel">
        <ArticleContent body={a.body} />
      </Card>
    </>
  );
}
