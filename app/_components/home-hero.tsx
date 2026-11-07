import { HomeLink } from "./home-link";

export function HomeHero() {
  return (
    <section className="wrap hero">
      <div>
        <div className="eyebrow">NEXO TECNOLOGIA · PORTAL DE ATENDIMENTO</div>
        <h1>
          Mais perto.
          <br />
          Mais simples.
          <br />
          <em>Resolvido.</em>
        </h1>
        <p>
          Um só lugar para conectar sua empresa à equipe que cuida da sua
          tecnologia. Do primeiro contato à solução, acompanhe tudo por aqui.
        </p>
        <div className="actions">
          <HomeLink className="btn" href="/authentication">
            Acessar meu portal <span>→</span>
          </HomeLink>
          <a className="btn secondary" href="#como-funciona">
            Conhecer o atendimento
          </a>
        </div>
        <div className="small">
          Seu espaço de suporte. Seguro, organizado e próximo.
        </div>
      </div>
      <div
        className="preview"
        aria-label="Exemplo de acompanhamento de um chamado"
      >
        <div className="preview-top">
          <span className="eyebrow">SEU SUPORTE, EM DIA</span>
          <span className="online">Atendimento online</span>
        </div>
        <h3>Cada chamado, no caminho certo.</h3>
        <p>Saiba quem está cuidando e qual é o próximo passo.</p>
        <div className="ticket">
          <div className="ticket-top">
            <span>#CH-2047 · Administrativo</span>
            <span className="pill">Em atendimento</span>
          </div>
          <strong>Falha de conexão com a VPN</strong>
          <p>
            Nossa equipe está verificando sua conexão.
            <br />
            Você acompanha as atualizações pelo portal.
          </p>
          <div className="progress">
            <i className="on"></i>
            <i className="on"></i>
            <i></i>
          </div>
          <div className="stages">
            <span>Recebido</span>
            <span>Em atendimento</span>
            <span>Resolvido</span>
          </div>
        </div>
        <div className="ticket">
          <div className="ticket-top">
            <span>ATENDIMENTO ESPECIALIZADO</span>
            <span className="pill">N1 · N2 · N3</span>
          </div>
          <strong>A equipe certa para cada necessidade.</strong>
          <p>Da triagem à engenharia, sem perder o histórico.</p>
        </div>
        <div className="preview-foot">
          <span>Visibilidade em cada etapa</span>
          <span>↗</span>
        </div>
      </div>
    </section>
  );
}
