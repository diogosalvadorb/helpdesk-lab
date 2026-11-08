import { Card } from "@/components/ui/card";
import type { getKnowledgeArticles } from "@/data/dashboard";

import { PortalDialog } from "./portal-dialog";
import { PortalLink } from "./portal-link";

export function KnowledgeHighlights({
  articles,
  all = false,
}: {
  articles: Awaited<ReturnType<typeof getKnowledgeArticles>>;
  all?: boolean;
}) {
  return (
    <Card className="portal-card portal-knowledge">
      <p className="portal-eyebrow">Precisa de uma solução?</p>
      <h2>Talvez a resposta já esteja aqui.</h2>
      <p className="portal-muted">
        Guias simples para resolver as dúvidas mais comuns da sua equipe.
      </p>
      {articles.length ? (
        articles.map((article) => (
          <div className="portal-list-row" key={article.id}>
            <div>
              <PortalDialog
                label={
                  <>
                    {article.title}
                    <span aria-hidden="true"> ↗</span>
                  </>
                }
                title={article.title}
                description={`Guia prático · ${article.readingMinutes} min de leitura`}
                className="portal-article-link"
              >
                <p className="portal-description">{article.body}</p>
              </PortalDialog>
              <small>
                Guia prático · {article.readingMinutes} min de leitura
              </small>
            </div>
          </div>
        ))
      ) : (
        <p className="portal-empty">Novos guias serão publicados por aqui.</p>
      )}
      {!all && (
        <PortalLink href="/conhecimento">
          Explorar base de conhecimento
        </PortalLink>
      )}
    </Card>
  );
}
