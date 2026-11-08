import { randomUUID } from "node:crypto";

import { getKnowledgeEditor } from "@/data/knowledge";

import { ArticleEditor } from "../_components/article-editor";
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const data = await getKnowledgeEditor((await params).articleId);
  const a = data.article!;
  return (
    <ArticleEditor
      key={a.updatedAt.toISOString()}
      categories={data.categories}
      admin={data.admin}
      submissionKey={randomUUID()}
      initial={{
        id: a.id,
        version: a.updatedAt.toISOString(),
        title: a.title,
        slug: a.slug,
        body: a.body,
        categoryId: a.categoryId,
        status: a.status,
        visibility: a.visibility,
        keywords: a.keywords,
      }}
    />
  );
}
