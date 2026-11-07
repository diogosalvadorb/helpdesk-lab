import Link from "next/link";

import { HomeLink } from "./home-link";

export function HomeHeader() {
  return (
    <header>
      <div className="wrap">
        <Link className="brand" href="/" aria-label="helpdesk início">
          helpdesk<span>.</span>
        </Link>
        <nav aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#recursos">Recursos</a>
          <a href="#portal">Portal do cliente</a>
        </nav>
        <div className="actions">
          <HomeLink className="text-btn" href="/authentication">
            Entrar
          </HomeLink>
          <HomeLink className="btn" href="/authentication?view=register">
            Criar minha conta <span>↗</span>
          </HomeLink>
        </div>
      </div>
    </header>
  );
}
