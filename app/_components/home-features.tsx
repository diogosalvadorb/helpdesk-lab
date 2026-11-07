import Link from "next/link";

export function HomeFeatures() {
  return (
    <section className="section features" id="recursos">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">TUDO NO SEU PORTAL</div>
            <h2>
              Menos idas e vindas.
              <br />
              Mais clareza para sua equipe.
            </h2>
          </div>
          <p>
            Solicite suporte, encontre respostas e acompanhe seus acordos de
            atendimento em um único lugar.
          </p>
        </div>
        <div className="cards">
          <article className="card">
            <span className="tag">01 / CHAMADOS</span>
            <h3>Seu atendimento, por inteiro.</h3>
            <p>
              Abra solicitações, envie informações e acompanhe o histórico de
              cada chamado.
            </p>
            <Link href="/authentication">Entrar para abrir um chamado →</Link>
          </article>
          <article className="card">
            <span className="tag">02 / CONHECIMENTO</span>
            <h3>Respostas ao seu alcance.</h3>
            <p>
              Guias práticos sobre acessos, senhas e ferramentas para ajudar no
              dia a dia.
            </p>
            <Link href="/authentication">Explorar a base →</Link>
          </article>
          <article className="card">
            <span className="tag">03 / VISIBILIDADE</span>
            <h3>Saiba o que vem a seguir.</h3>
            <p>
              Acompanhe prioridades, prazos de SLA e pendências que precisam da
              sua resposta.
            </p>
            <Link href="/authentication">Acessar meu acompanhamento →</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
