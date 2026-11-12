import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getWorkspaceSettings } from "@/data/settings";

import { WorkspaceSettings } from "./_components/workspace-settings";
export default async function WorkspaceSettingsPage() {
  const data = await getWorkspaceSettings();
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Administração do workspace</p>
          <h1>Configurações do workspace</h1>
          <p>Canais de atendimento e documentos publicados pela organização.</p>
        </div>
        <Link href="/configuracoes" className="portal-outline-button">
          Meu perfil e segurança
        </Link>
      </div>
      <div className="portal-settings-layout">
        <nav aria-label="Administração">
          <Link href="/operacao/empresas">Empresas e contratos</Link>
          <Link href="/operacao/equipe?view=users">Permissões globais</Link>
          <Link href="/operacao/sla/politicas">Políticas de SLA</Link>
          <Link href="/canais">Ver canais</Link>
        </nav>
        <div className="portal-stack">
          <WorkspaceSettings data={data} />
          <Card className="portal-panel">
            <h2>Disponibilidade dos recursos</h2>
            <p>Anexos: armazenamento ainda não configurado.</p>
            <p>
              Alertas periódicos: exigem agendador externo; a interface não
              inicia um agendamento.
            </p>
            <p>
              E-mails: dependem da configuração do provedor no servidor. Nenhuma
              credencial é exibida ou alterada aqui.
            </p>
          </Card>
          <Card className="portal-panel">
            <h2>Últimas alterações desta configuração</h2>
            {data.logs.length ? (
              data.logs.map((l) => (
                <p key={l.id}>
                  {l.actor.name} ·{" "}
                  {l.createdAt.toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </p>
              ))
            ) : (
              <p>Nenhuma alteração registrada.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
