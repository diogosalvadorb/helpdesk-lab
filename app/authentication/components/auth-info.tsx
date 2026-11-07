"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const information = {
  privacy: {
    title: "Seus dados, com cuidado.",
    description: "Informações sobre o uso dos dados no portal de atendimento.",
    sections: [
      [
        "Dados usados no atendimento",
        "Nome, e-mail corporativo, empresa, departamento e informações dos chamados permitem identificar solicitações e prestar suporte.",
      ],
      [
        "Quem pode acessar",
        "Os dados de atendimento são disponibilizados à equipe de suporte e às pessoas autorizadas da sua empresa, conforme o perfil de acesso.",
      ],
      [
        "Cuide do que você compartilha",
        "Não inclua senhas, códigos de autenticação ou documentos pessoais desnecessários em mensagens e anexos.",
      ],
      [
        "Solicitações sobre seus dados",
        "Entre em contato com o administrador da sua empresa ou com o canal de suporte para solicitar informações e correções.",
      ],
    ],
    note: "Conteúdo de referência. A política final deve refletir as práticas e os responsáveis definidos pela organização.",
  },
  terms: {
    title: "Termos de uso",
    description: "Regras de referência para a utilização do atendimento.",
    sections: [
      [
        "Uso do portal",
        "O portal organiza as solicitações de suporte da empresa, as respostas da equipe e o acompanhamento dos prazos contratados.",
      ],
      [
        "Responsabilidades da conta",
        "Mantenha seus dados atualizados, proteja suas credenciais e utilize o portal apenas para solicitações relacionadas ao atendimento da empresa.",
      ],
      [
        "Atendimento e prazos",
        "Prioridades, horários e metas são definidos pelo contrato de serviço. A equipe pode solicitar informações para dar continuidade ao atendimento.",
      ],
    ],
    note: "Texto de referência para revisão da organização antes da disponibilização do serviço.",
  },
  help: {
    title: "Vamos conversar.",
    description: "Estamos por perto.",
    sections: [
      [
        "Precisa de ajuda para acessar?",
        "Entre em contato com o administrador da sua empresa ou com o canal de suporte indicado no seu contrato.",
      ],
      [
        "Horário de atendimento",
        "Segunda a sexta, das 08h às 18h, horário de Brasília. Para incidentes críticos, consulte o plantão previsto no seu contrato.",
      ],
    ],
    note: "",
  },
  recovery: {
    title: "Esqueceu sua senha? Acontece.",
    description: "Recuperação de acesso",
    sections: [
      [
        "Recupere seu acesso",
        "A recuperação por e-mail ainda não está disponível. Entre em contato com o administrador da sua empresa para obter ajuda com o acesso.",
      ],
    ],
    note: "",
  },
};

export function AuthInfo({
  topic,
  children,
}: {
  topic: keyof typeof information;
  children: ReactNode;
}) {
  const content = information[topic];
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="link" className="auth-text-link" />
        }
      >
        {children}
      </DialogTrigger>
      <DialogContent className="bg-auth-background text-auth-foreground font-auth max-h-[85svh] overflow-y-auto sm:max-w-140">
        <DialogHeader>
          <DialogTitle className="font-auth-display text-2xl font-normal">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-auth-muted">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          {content.sections.map(([heading, text]) => (
            <section key={heading}>
              <h3 className="mb-2 font-semibold">{heading}</h3>
              <p className="text-auth-muted leading-relaxed">{text}</p>
            </section>
          ))}
          {content.note && (
            <p className="text-auth-muted text-xs leading-relaxed">
              {content.note}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
