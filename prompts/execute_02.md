## User Prompt

Você é um desenvolvedor full stack sênior, especializado em Next.js.

## Contexto

Este projeto é o Helpdesk Lab, uma aplicação de gestão de chamados e suporte de tecnologia para empresas. O código e o canvas do Doop são de helpdesk.

Tecnologias utilizadas:

- npm (gerenciador padrão do projeto, com `package-lock.json`)
- React 19
- Next.js 16
- Prisma 7 (schema em `prisma/schema.prisma`)
- shadcn/ui
- Better Auth
- React Hook Form, Zod e next-safe-action

## Regras

- Use npm como único gerenciador do projeto: `npm ci` para instalar pelo lockfile, `npm install` para alterar dependências, `npm run` para scripts e `npx` para CLIs locais. Não gerar arquivos de configuração ou lockfiles do pnpm.
- Leia `AGENTS.md` e os guias relevantes em `node_modules/next/dist/docs/` antes de escrever código.
- Sempre use shadcn/ui e verifique os componentes disponíveis antes de criar novos componentes.
- Use apenas cores do tema de `app/globals.css` nas classes e nos componentes.
- Reutilize os componentes de `components/ui/`. O arquivo `components/ui/page.tsx` não existe no estado atual; não trate sua utilização como concluída.
- Consulte o layout pelo MCP do Doop em http://localhost:4400/c/BYeHwktyej.
- Sempre use `Image` do Next.js quando houver imagens.
- Use `rem` para medidas, nunca `px`.
- Preserve as alterações locais existentes. Não faça commit nem descarte alterações sem solicitação.


## Objetivo
Adaptar a tela inicia do projeto `app/page.tsx` ao Doop, com máxima fidelidade visual, para cada seção crie um componente em `app/_components` siga fielmente a paleta em `app/globals.css`.
Adaptar a tela para versão Mobile
Crie um componente que controle as views de login e cadastro e implemente em `app/authentication/_components`


Referências identificadas no canvas:

- Boas Vindas: `WCym-o4sDM` — 04 · Acesso — Login.`app/page.tsx`
