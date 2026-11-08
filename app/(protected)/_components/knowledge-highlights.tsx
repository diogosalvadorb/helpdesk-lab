import { Card } from "@/components/ui/card";
import type { getKnowledgeArticles } from "@/data/dashboard";

import { PortalLink } from "./portal-link";

export function KnowledgeHighlights({
  articles,
  all = false,
  variant = "highlight",
}: {
  articles: Awaited<ReturnType<typeof getKnowledgeArticles>>;
  all?: boolean;
  variant?: "highlight" | "suggestions";
}) {
  return (
    <Card
      className={`portal-card ${variant === "highlight" ? "portal-knowledge" : "portal-knowledge-suggestions"}`}
    >
      <p className="portal-eyebrow">
        {variant === "highlight"
          ? "Precisa de uma solução?"
          : "Talvez a resposta já esteja aqui"}
      </p>
      <h2>
        {variant === "highlight"
          ? "Talvez a resposta já esteja aqui."
          : "Base de conhecimento"}
      </h2>
      {variant === "highlight" && (
        <p className="portal-muted">
          Guias simples para resolver as dúvidas mais comuns da sua equipe.
        </p>
      )}
      {articles.length ? (
        articles.map((article) => (
          <div className="portal-list-row" key={article.id}>
            <div>
              <PortalLink
                href={`/conhecimento/${article.id}`}
                className="portal-article-link"
              >
                {article.title} <span aria-hidden="true">↗</span>
              </PortalLink>
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
