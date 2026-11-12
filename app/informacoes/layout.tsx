import Link from "next/link";
import { type ReactNode,Suspense } from "react";
export default function InformationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="portal-shell portal-information-shell">
      <header>
        <Link className="portal-brand" href="/">
          helpdesk.
        </Link>
        <Link className="portal-outline-button" href="/authentication">
          Voltar ao acesso
        </Link>
      </header>
      <main id="information-main">
        <Suspense fallback={<p role="status">Carregando informações…</p>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
