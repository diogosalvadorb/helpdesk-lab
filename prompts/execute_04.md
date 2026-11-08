## User Prompt

Você é um desenvolvedor full stack sênior especializado em Next.js. Implemente a tela inicial da área autenticada do usuário do Helpdesk Lab a partir do Doop e dos dados reais do Prisma.

## Objetivo

Criar o portal inicial em `/dashboard`, dentro de `app/(protected)`, com navegação compartilhada, autorização no servidor, indicadores, chamados recentes, pendências, artigos de conhecimento e resumo do acordo de atendimento. Preservar a página pública `/` e os fluxos existentes de cadastro, confirmação por OTP e recuperação de senha.

## Regras

- Leia `AGENTS.md` e os guias relevantes em `node_modules/next/dist/docs/` antes de escrever código. Este projeto usa Cache Components e Partial Prefetching: confira as regras atuais de Suspense e dados de requisição.
- Use npm exclusivamente. Preserve alterações locais e não faça commit, push, deploy, reset de banco ou migrações sem necessidade.
- Use shadcn/ui e inspecione `components/ui/` antes de adicionar componentes. Confira o CLI e a compatibilidade local antes de instalar Sidebar, Sheet, Card, Badge, Table, Skeleton, Avatar ou Dropdown Menu.
- Use somente os tokens de `app/globals.css`. Se faltar um token para estado, prioridade ou superfície, declare-o nesse arquivo. Nunca criar CSS separado por página ou componente.
- Medidas explícitas em `rem`; imagens com `Image` do Next.js; textos em português brasileiro; ícones com rótulos acessíveis quando forem ações.
- Consultas Prisma em arquivos de `data/`. Reutilizar `lib/prisma.ts` e `lib/auth.ts`. Não expor dados sensíveis, hashes, senhas ou tokens ao cliente.
- Preferir Server Components. Componentes de cliente apenas para interação, menus, notificações, navegação mobile e logout.

## Referência no Doop

Canvas: `http://localhost:4400/c/BYeHwktyej`.

Tela principal: **`WeQOOVP_6F` — 11 · Portal — Início**, desktop de 1440 × 1200. Ler o frame atualizado e comparar screenshots da implementação com a referência. Não editar o canvas.

Elementos observados na referência:

1. Sidebar com marca, empresa ativa, grupos “Seu atendimento” e “Organização”, ajuda e perfil do usuário com saída.
2. Topbar com breadcrumb, indicador de atendimento, notificações e avatar.
3. Saudação personalizada “Olá, [primeiro nome]. Como podemos ajudar?” e ação “Abrir chamado”.
4. Quatro indicadores: chamados em aberto, em atendimento, resolvidos no mês e SLA cumprido.
5. Tabela “Acompanhe seus chamados”, com assunto/número, departamento, status, prioridade, nível e SLA.
6. Lista “Aguardando você” com solicitações de informação e ação para responder.
7. Card de conhecimento com três guias e acesso à base.
8. Card “Seu acordo de atendimento” com metas e horário de suporte.
9. Rodapé com privacidade e ajuda.
10. No mobile: sidebar recolhida, navegação acessível, indicadores adaptados e tabela com rolagem local ou apresentação equivalente sem transbordar a página.

Os nomes Mariana/Grupo Horizonte e os números 07, 04, 18 e 97,2% são exemplos visuais. Não fixá-los no JSX: usar o usuário da sessão e as consultas autorizadas.

## Estrutura de rotas

O grupo `(protected)` organiza layouts e não faz parte da URL. Não criar `app/(protected)/page.tsx`, pois conflitaria com a página pública `/`. Toda nova rota autenticada deve ficar dentro desse grupo.

### Organização dos componentes e das páginas

- Componentes exclusivos de uma rota devem ficar em `app/(protected)/<rota>/_components/`. Exemplos: `dashboard/_components/`, `chamados/_components/`, `conhecimento/_components/` e `sla/_components/`. Criar essas pastas conforme houver componentes exclusivos; não criar wrappers apenas para preencher a estrutura.
- `app/(protected)/_components/` contém somente componentes compartilhados entre páginas ou pelo layout. `RecentTickets` e seu detalhe são reutilizados em Dashboard e Chamados; `KnowledgeHighlights`, em Dashboard e Conhecimento; `ServiceAgreement`, em Dashboard e SLA. Manter uma única implementação de cada bloco nessa pasta comum.
- Não colocar módulos dentro de `app/(protected)/_components/<modulo>/_components/`. Quando houver colunas de tabela exclusivas, usar `<rota>/_columns/`; primitivas genéricas do shadcn/ui pertencem a `components/ui/`.
- `page.tsx` deve conter a função de página, obter o contexto autenticado, chamar as consultas de `data/` e retornar os componentes. Não deixar apenas `export { default }` apontando para uma página completa dentro de `_components`. Aplicar esse padrão a Dashboard, Chamados, Conhecimento e SLA.
- Manter a autorização centralizada em `getPortalContext()` e `getAuthenticatedUser()`, com revalidação na camada de dados. Essas funções já consultam a sessão do Better Auth no servidor; não duplicar essa lógica no JSX nem confiar na sidebar para proteger dados.

Exemplo da composição de Chamados:

```tsx
import { getPortalTickets } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";

import { DashboardHeading } from "../_components/dashboard-heading";
import { PendingAccess } from "../_components/pending-access";
import { RecentTickets } from "../_components/recent-tickets";

export default async function TicketsPage() {
  const context = await getPortalContext();
  if (!context.company) return <PendingAccess context={context} />;
  const tickets = await getPortalTickets(50);

  return (
    <>
      <DashboardHeading title="Seus chamados, por inteiro." />
      <RecentTickets tickets={tickets} all />
    </>
  );
}
```

### Sidebar e navegação

- Usar os blocos Sidebar, Header, Content, Footer, Group, Menu, MenuItem e MenuButton do shadcn/ui, com a variante fixa adaptada ao portal. A implementação reutilizável fica em `components/ui/sidebar.tsx`, e a composição do portal em `app/(protected)/_components/app-sidebar.tsx`.
- Preservar a referência do Doop: largura desktop de `15.5rem`, superfície verde-clara, marca e seletor de empresa no topo, grupos “Seu atendimento” e “Organização”, suporte e perfil na base. Estilos e tokens ficam exclusivamente em `app/globals.css`.
- A sidebar pode delegar os links ao `AppNav`. Usar `Link` do Next.js para `/dashboard`, `/chamados`, `/conhecimento` e `/sla`, com destaque ativo e `aria-current="page"`. Reconhecer também subrotas da seção ativa.
- No mobile, manter o menu acessível com abertura, fechamento por Escape e fechamento ao navegar. Permitir rolagem da região central sem cortar o perfil no rodapé; manter a navegação rápida inferior.
- Preservar o logout real, a seleção autorizada de empresa e os avisos claros para funcionalidades futuras. O exemplo financeiro é apenas uma referência de composição; não adicionar rotas de transações ao helpdesk.

## Autenticação e autorização

- Validar sessão do Better Auth e `emailVerified` no servidor. Sem sessão, redirecionar para `/authentication`; e-mail não confirmado deve continuar no fluxo de confirmação, sem acesso ao portal.
- No sucesso do login, trocar o redirecionamento atual de `/` para `/dashboard`. Manter a confirmação de cadastro e a troca de senha retornando ao login, conforme o fluxo existente.
- Implementar logout real pelo Better Auth e redirecionamento ao login. Não simular saída apenas apagando estado do cliente.
- Não presumir que um route group ou layout, sozinho, proteja consultas, actions e endpoints. Revalidar autenticação e autorização na camada de acesso aos dados e em toda mutação.
- Ler o papel global do usuário no banco. O modelo atual possui `UserRole.ADMIN`, `AGENT` e `CLIENT`; **ADMIN é o administrador global/master neste escopo**, sem criar um enum MASTER apenas para o rótulo.
- Não permitir que cadastro ou `updateUser` recebam `role`, aprovação de associação ou `emailVerified` como campos editáveis. Se expuser o papel no Better Auth como campo adicional, usar a configuração equivalente a `input: false` da versão instalada e validar os valores no servidor.
- Contas CLIENT precisam de associação ACTIVE em empresa ACTIVE. REQUESTER vê somente seus chamados; MANAGER/ADMIN da empresa podem ver os chamados da empresa. ADMIN global pode acessar empresas explicitamente, com contexto de empresa selecionado. AGENT só recebe escopo de suporte conforme equipe/perfil; não liberar dados de todas as empresas por acidente.
- O seletor de empresa deve validar no servidor o identificador recebido. Alterar URL, cookie ou estado de cliente não pode conceder acesso.
- Para usuário sem empresa aprovada, mostrar estado de acesso pendente, sem escolher automaticamente a primeira empresa do banco.
- A conta principal `diogosbarbosa93@gmail.com` recebe papel ADMIN pela seed, não por comparação de e-mail em componentes ou regras de acesso.
- Não confiar em papel obsoleto de uma sessão/cache. Reconsultar autorização no banco para decisões de acesso.
- Evitar cache compartilhado de consultas privadas. Se houver cache, vincular os argumentos ao usuário e ao contexto autorizado de empresa e definir a invalidação.

## Seed e dados existentes

Inspecionar `prisma/seed.ts`, `prisma7.config.ts`, `docs/seed.md` e o schema antes de executar qualquer carga. A seed é de helpdesk; o exemplo de transações financeiras fornecido anteriormente é apenas uma referência de estrutura e não se aplica aos modelos deste projeto.

Executar com `npm run db:seed` apenas quando necessário. Ela deve ser idempotente, preservar registros reais e nunca usar `deleteMany` para limpar o banco. Não alterar senha ou confirmação do e-mail da conta principal.

Dados demonstrativos preparados:

- Conta principal existente com `User.role = ADMIN` e vínculo ativo de administração na empresa demonstrativa Nexus3D.
- Seis contas demonstrativas: Mariana (gestora), João (solicitante), Julia (N1), Rafael (N2), Bruno (N3) e Carlos (gestor da segunda empresa).
- Duas empresas, departamentos, equipe de suporte, calendário comercial de Brasília, política SLA, metas por prioridade e contratos ativos.
- Dez chamados com estados e prioridades diferentes, incluindo chamados da conta principal, de outro solicitante e de outra empresa para testar isolamento.
- Mensagens, eventos, duas pendências de resposta, pausas de SLA, notificações e três artigos publicados.
- Senhas das novas contas demonstrativas no arquivo local `.seed-credentials.local.json`, ignorado pelo Git. Nunca copiar seu conteúdo para código, documentação, logs ou resposta final. Credenciais reais não pertencem à seed.

Não redefinir a sequência global de chamados nem forçar os números do mockup. Usar `Ticket.number` e formatar a apresentação. Os dados devem continuar consistentes em execuções repetidas e após edições manuais.

## Consultas e indicadores

- Criar uma função central que resolva sessão, usuário, papel global, associação e empresa autorizada antes de consultar o dashboard.
- Aplicar o mesmo escopo em contadores, tabela, pendências, notificações e links de detalhe. Não carregar tudo e filtrar apenas no cliente.
- “Em aberto”: OPEN, IN_PROGRESS, INVESTIGATING e WAITING_CUSTOMER. “Em atendimento”: IN_PROGRESS e INVESTIGATING. “Aguardando você”: WAITING_CUSTOMER dentro do escopo autorizado.
- “Resolvidos no mês”: usar `resolvedAt` no intervalo do mês em `America/Sao_Paulo`. Comparar com o mês anterior usando a mesma definição. Sem histórico suficiente, mostrar um texto neutro.
- SLA cumprido: definir a fórmula sobre chamados resolvidos com meta e dados suficientes. Não inventar percentuais, nem contar chamados sem meta como sucesso. Sem denominador, mostrar “Sem dados” em vez de 0% ou 100%.
- Os dados de seed não substituem um motor de cálculo de horas úteis. Exibir os prazos persistidos; respeitar pausas abertas e estados resolvidos. Não chamar tempo corrido de “horas úteis”.
- Consultar chamados recentes com ordenação estável e limite, trazendo apenas os campos usados na tela e as relações necessárias.
- Para SLA restante, usar prazo real e instante atual; apresentar “Pausado”, “Vencido”, “Cumprido” ou tempo restante conforme os dados. Mostrar data/hora de referência acessível e evitar hidratação inconsistente.
- Artigos: somente PUBLISHED e PUBLIC, sem conteúdo interno. Consultar o contrato ativo da empresa e suas metas em vez de textos fixos.
- Notificações: apenas as do usuário autenticado; badge sem contagem fictícia. Só marcar como lida através de action autorizada.

## Interações e limites da entrega

- Implementar o dashboard e a estrutura protegida, sem tentar concluir todo o helpdesk nesta etapa.
- Navegação existente precisa apontar para rotas reais. Para módulos ainda não implementados, apresentar item indisponível acessível ou estado claro de funcionalidade futura; não criar links quebrados, botões sem ação ou confirmação falsa.
- Ações “Abrir chamado”, “Ver todos”, “Responder”, artigos e SLA devem abrir uma rota/modal funcional dentro do escopo implementado, ou informar claramente a indisponibilidade. Não fazer parecer que um chamado foi aberto ou respondido sem persistência.
- Não liberar uma central de operações completa só porque o menu do Doop a mostra. Restringir sua visibilidade por papel e marcar como futura se estiver fora desta implementação.
- Reutilizar os diálogos de ajuda e privacidade existentes quando apropriado.
- Implementar loading, empty, erro de consulta e acesso pendente. Formatar datas e números em pt-BR. Dar foco e rótulos adequados a menus e botões, incluindo teclado e leitores de tela.

## Critérios de aceite

1. `/` continua pública; `/dashboard` e demais novas rotas autenticadas ficam em `app/(protected)`.
2. Sem sessão ou e-mail confirmado não há acesso a dados protegidos; logout invalida a sessão.
3. Conta principal aparece como administrador global pelo dado persistido, sem hardcode de e-mail na autorização.
4. Dashboard segue a hierarquia e a paleta do Doop e usa dados do banco em todos os indicadores e listas.
5. CLIENT de outra empresa não consegue consultar contadores, notificações ou chamados da Nexus3D alterando identificadores. REQUESTER não vê chamados de outro solicitante; MANAGER só vê os da empresa autorizada.
6. Seed pode rodar duas vezes sem duplicar registros nem alterar senha da conta principal, credenciais existentes ou progresso dos chamados.
7. Verificar desktop e mobile em navegador, navegação por teclado, estados sem dados e erros, sem transbordamento horizontal da página.
8. Criar testes de autorização e agregação que validem isolamento entre empresas, papéis, pendências e limites de mês. Reexecutar os testes de OTP para preservar o login.
9. Executar `npm run lint`, `npx tsc --noEmit`, os testes pertinentes e `npm run build`. Evitar build e dev simultâneos na mesma saída para não misturar artefatos do Turbopack.
10. Entregar resumo do que foi implementado, verificações executadas e módulos ainda indisponíveis. Não afirmar que a UI já está implementada apenas porque este plano ou a seed existem.
