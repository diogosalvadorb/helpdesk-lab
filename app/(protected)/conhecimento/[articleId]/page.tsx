import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getPublicArticle } from "@/data/knowledge";

import { ArticleContent } from "../../_components/article-content";
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const article = await getPublicArticle((await params).articleId);
  if (!article) notFound();
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">
            Base de conhecimento / {article.category.name}
          </p>
          <h1>{article.title}</h1>
          <p>
            Atualizado em{" "}
            {article.updatedAt.toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}{" "}
            · {article.readingMinutes} min de leitura
          </p>
        </div>
        <Link className="portal-outline-button" href="/conhecimento">
          ← Voltar à base
        </Link>
      </div>
      <div className="portal-article-layout">
        <Card className="portal-panel">
          <ArticleContent body={article.body} />
        </Card>
        <Card className="portal-panel portal-article-help">
          <h2>Não encontrou a solução?</h2>
          <p>Conte para a equipe o que aconteceu. Vamos acompanhar você.</p>
          <Link className="portal-primary-button" href="/chamados/novo">
            Abrir um chamado
          </Link>
        </Card>
      </div>
    </>
  );
}
