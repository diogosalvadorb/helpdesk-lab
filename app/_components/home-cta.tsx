import { HomeLink } from "./home-link";

export function HomeCta() {
  return (
    <section className="cta">
      <div className="wrap">
        <div>
          <div className="eyebrow">SUPORTE QUE ACOMPANHA VOCÊ</div>
          <h2>Seu suporte começa aqui.</h2>
          <p>Entre na sua conta ou crie seu acesso para começar.</p>
        </div>
        <div className="actions">
          <HomeLink className="btn secondary" href="/authentication">
            Já tenho uma conta
          </HomeLink>
          <HomeLink className="btn" href="/authentication?view=register">
            Criar minha conta <span>→</span>
          </HomeLink>
        </div>
      </div>
    </section>
  );
}
