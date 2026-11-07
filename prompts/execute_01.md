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

Adaptar login e cadastro em `app/authentication` ao Doop, com máxima fidelidade visual, mantendo a autenticação existente e centralizando a paleta em `app/globals.css`.

Referências identificadas no canvas:

- Login desktop: `pktfyM7qGH` — 04 · Acesso — Login.
- Cadastro desktop: `Bbii_dd5vn` — 05 · Acesso — Cadastro.
- Login mobile: `YpQmSb5AUb` — 45 · Mobile — Login.
