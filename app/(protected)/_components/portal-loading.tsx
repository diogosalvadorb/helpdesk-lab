import { Skeleton } from "@/components/ui/skeleton";

export function PortalLoading() {
  return (
    <div
      className="portal-loading"
      role="status"
      aria-label="Carregando seu portal"
    >
      <Skeleton className="h-10 w-2/3" />
      <div className="portal-metrics">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
      <span className="sr-only">Carregando atendimento…</span>
    </div>
  );
}
