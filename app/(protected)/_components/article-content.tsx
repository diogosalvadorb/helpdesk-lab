export function ArticleContent({ body }: { body: string }) {
  // Plain text deliberately remains text. HTML, scripts and URLs never become markup.
  return (
    <div className="portal-article-content">
      {body.split(/\n\s*\n/u).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
