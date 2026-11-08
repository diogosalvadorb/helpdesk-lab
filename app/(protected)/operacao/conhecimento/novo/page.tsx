import { randomUUID } from "node:crypto";

import { getKnowledgeEditor } from "@/data/knowledge";

import { ArticleEditor } from "../_components/article-editor";
export default async function NewArticlePage() {
  const data = await getKnowledgeEditor();
  return (
    <ArticleEditor
      categories={data.categories}
      admin={data.admin}
      submissionKey={randomUUID()}
    />
  );
}
