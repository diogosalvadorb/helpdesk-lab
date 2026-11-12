import { BookOpen, Mail, Phone, Ticket } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { getPublicInformation } from "@/data/settings";
import type { WorkCalendar } from "@/lib/business-calendar";
export function InformationContent({
  kind,
  information,
  calendar,
  contract = false,
}: {
  kind: "help" | "privacy" | "terms";
  information: Awaited<ReturnType<typeof getPublicInformation>>;
  calendar?: WorkCalendar | null;
  contract?: boolean;
}) {
  if (kind === "help") {
    const hours = calendar === undefined ? information.calendar : calendar;
    const clock = (minute: number) =>
      `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    return (
      <>
        <div className="portal-heading">
          <div>
            <p className="portal-eyebrow">Estamos por perto</p>
            <h1>Vamos conversar.</h1>
            <p>Escolha um canal disponível para falar com a equipe.</p>
          </div>
        </div>
        <div className="portal-information-channels">
          <Card className="portal-panel">
            <Ticket aria-hidden="true" />
            <h2>Abrir chamado</h2>
            <p>
              Solicite atendimento com histórico e acompanhamento dos prazos.
            </p>
            <Link className="portal-primary-button" href="/chamados/novo">
              Abrir solicitação
            </Link>
          </Card>
          <Card className="portal-panel">
            <Mail aria-hidden="true" />
            <h2>E-mail de suporte</h2>
            {information.supportEmail ? (
              <a href={`mailto:${information.supportEmail}`}>
                {information.supportEmail}
              </a>
            ) : (
              <p className="portal-muted">
                E-mail de suporte ainda não configurado. Utilize o portal ou
                consulte o responsável da sua empresa.
              </p>
            )}
            {information.supportPhone && (
              <>
                <h3>
                  <Phone aria-hidden="true" /> Telefone configurado
                </h3>
                <a
                  href={`tel:${information.supportPhone.replace(/[^+\d]/g, "")}`}
                >
                  {information.supportPhone}
                </a>
              </>
            )}
          </Card>
          <Card className="portal-panel">
            <BookOpen aria-hidden="true" />
            <h2>Base de conhecimento</h2>
            <p>Encontre orientações publicadas pela equipe.</p>
            <Link className="portal-outline-button" href="/conhecimento">
              Consultar artigos
            </Link>
          </Card>
        </div>
        <Card className="portal-panel portal-information-hours">
          <h2>
            {contract
              ? "Horário do seu contrato"
              : "Horário geral de atendimento"}
          </h2>
          {hours ? (
            <>
              <p>
                {hours.alwaysOpen
                  ? "Atendimento 24 horas."
                  : "Atendimento nos intervalos configurados abaixo."}{" "}
                Fuso: {hours.timeZone}.
              </p>
              {!hours.alwaysOpen &&
                hours.hours.map((h, i) => (
                  <p key={i}>
                    {
                      [
                        "Domingo",
                        "Segunda",
                        "Terça",
                        "Quarta",
                        "Quinta",
                        "Sexta",
                        "Sábado",
                      ][h.weekday]
                    }{" "}
                    · {clock(h.startMinute)} às {clock(h.endMinute)}
                  </p>
                ))}
              {!hours.alwaysOpen && (
                <p>
                  {hours.holidays.length} feriado(s) configurado(s) no
                  calendário. O prazo considera essas exceções.
                </p>
              )}
            </>
          ) : (
            <p>
              Horário ainda não configurado. Consulte o acordo de atendimento da
              sua empresa.
            </p>
          )}
          <Link href="/sla">Ver meu acordo de SLA →</Link>
        </Card>
      </>
    );
  }
  const document = kind === "privacy" ? information.privacy : information.terms;
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Informações do portal</p>
          <h1>{kind === "privacy" ? "Privacidade" : "Termos de uso"}</h1>
          <p>
            {information.organizationName ||
              "Organização responsável ainda não informada"}
          </p>
        </div>
      </div>
      <Card className="portal-panel">
        {document ? (
          <>
            <p className="portal-muted">
              Texto publicado pela organização em{" "}
              {document.publishedAt?.toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              }) || "data não informada"}
              .
            </p>
            <div className="portal-information-copy">{document.body}</div>
            {information.responsibleEmail && (
              <p>
                Contato informado:{" "}
                <a href={`mailto:${information.responsibleEmail}`}>
                  {information.responsibleEmail}
                </a>
              </p>
            )}
          </>
        ) : (
          <>
            <p role="status" className="portal-report-note">
              Pendência editorial: o documento definitivo, os responsáveis e os
              contatos precisam ser revisados e publicados pela organização.
            </p>
            <h2>
              {kind === "privacy"
                ? "Informações utilizadas no atendimento"
                : "Uso do portal de atendimento"}
            </h2>
            <p>
              {kind === "privacy"
                ? "O portal utiliza dados de conta, vínculos com empresas, departamentos e conteúdo das solicitações para organizar o atendimento. O acesso aos chamados depende das permissões vigentes."
                : "O portal organiza solicitações de suporte, respostas da equipe e acompanhamento de prazos. Horários e metas dependem do contrato aplicável."}
            </p>
            <p>
              Não inclua senhas ou códigos de autenticação em chamados. Consulte
              os canais disponíveis se precisar de orientações.
            </p>
            <p className="portal-muted">
              Estas informações de funcionamento não substituem o documento
              definitivo. Não há declaração de certificação ou garantia de
              conformidade legal.
            </p>
          </>
        )}
        <nav
          className="portal-editor-actions"
          aria-label="Informações relacionadas"
        >
          <Link href="/informacoes/ajuda">Canais de atendimento</Link>
          <Link href="/informacoes/privacidade">Privacidade</Link>
          <Link href="/informacoes/termos">Termos de uso</Link>
        </nav>
      </Card>
    </>
  );
}
