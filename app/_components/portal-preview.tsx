export function PortalPreview() {
  return (
    <section className="section portal" id="portal">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <div className="eyebrow">PORTAL DO CLIENTE</div>
            <h2>O essencial, sem procurar.</h2>
          </div>
          <p>
            Chamados, respostas e próximos passos.
            <br />
            Um espaço pensado para sua empresa.
          </p>
        </div>
        <div
          className="dashboard"
          aria-label="Prévia ilustrativa do portal do cliente"
        >
          <aside className="dash-side">
            <b>helpdesk.</b>
            <div className="selected">Início</div>
            <div>Meus chamados</div>
            <div>Base de conhecimento</div>
            <div>Painel SLA</div>
          </aside>
          <div className="dash-main">
            <div className="dash-title">
              <b>Acompanhe seus chamados</b>
              <span>PRÉVIA DO PORTAL</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>CHAMADO</th>
                  <th>STATUS</th>
                  <th>PRIORIDADE</th>
                  <th>NÍVEL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Falha de conexão com a VPN <small>#CH-2047</small>
                  </td>
                  <td>
                    <span className="pill">Em atendimento</span>
                  </td>
                  <td>Alta</td>
                  <td>N2</td>
                </tr>
                <tr>
                  <td>
                    Acesso ao sistema financeiro <small>#CH-2046</small>
                  </td>
                  <td>
                    <span className="pill">Em triagem</span>
                  </td>
                  <td>Média</td>
                  <td>N1</td>
                </tr>
                <tr>
                  <td>
                    Impressora não reconhecida <small>#CH-2045</small>
                  </td>
                  <td>
                    <span className="pill">Aguardando você</span>
                  </td>
                  <td>Média</td>
                  <td>N1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
