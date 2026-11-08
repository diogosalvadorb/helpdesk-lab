import Link from "next/link";
export function queryHref(
  path: string,
  filters: Record<string, unknown>,
  changes: Record<string, string | number> = {},
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...changes }))
    if (
      (typeof value === "string" || typeof value === "number") &&
      value !== ""
    )
      query.set(key, String(value));
  return `${path}?${query}`;
}
export function QueryPagination({
  path,
  filters,
  page,
  total,
  size = 10,
  pageKey = "page",
}: {
  path: string;
  filters: Record<string, unknown>;
  page: number;
  total: number;
  size?: number;
  pageKey?: string;
}) {
  return (
    <nav className="portal-pagination" aria-label="Paginação">
      <span>
        {total ? Math.min((page - 1) * size + 1, total) : 0}–
        {Math.min(page * size, total)} de {total}
      </span>
      <div>
        {page > 1 && (
          <Link
            className="portal-outline-button"
            href={queryHref(path, filters, { [pageKey]: page - 1 })}
          >
            Anterior
          </Link>
        )}
        <span>Página {page}</span>
        {page * size < total && (
          <Link
            className="portal-outline-button"
            href={queryHref(path, filters, { [pageKey]: page + 1 })}
          >
            Próxima →
          </Link>
        )}
      </div>
    </nav>
  );
}
