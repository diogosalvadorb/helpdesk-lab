## User Prompt

Você é um desenvolvedor full stack sênior especializado em Next.js. Implemente o fluxo real de abertura de chamado do Helpdesk Lab, integrado ao portal existente, ao Prisma e ao Better Auth, com fidelidade ao Doop.

## Objetivo

Permitir que o usuário autenticado abra um chamado para sua empresa autorizada, receba uma confirmação com o número persistido e encontre o chamado em “Meus chamados” e nos indicadores do dashboard. Substituir os avisos de funcionalidade futura de “Abrir chamado” por navegação real. Preservar os demais módulos e os fluxos de autenticação e OTP.

Este arquivo é o plano de implementação. Sua criação não significa que o fluxo já foi implementado.

## Regras obrigatórias

- Leia `AGENTS.md`, `prompts/execute_04.md`, o código atual e os guias relevantes em `node_modules/next/dist/docs/` antes de implementar. Confira as APIs locais de Server Actions, Cache Components, Suspense, parâmetros de rota e revalidação.
- Preserve alterações locais. Não faça commit, push, deploy, reset do banco ou alterações de senha. Não execute seed ou migrações sem necessidade da tarefa.
- Use npm exclusivamente, TypeScript e os componentes existentes de shadcn/ui. Ao adicionar dependências, mantenha `package-lock.json` atualizado. Não instale Vitest nem recrie a pasta `tests`.
- Estilos somente em `app/globals.css`, reutilizando tokens e criando variáveis apenas quando faltarem. Medidas explícitas em `rem`, imagens com Next Image, textos em português brasileiro.
- Prefira Server Components. Use Client Components somente para formulário, validação interativa, estado de envio e eventos. Consultas e persistência ficam em `data/`, com a instância existente de Prisma.
- Reutilize `getPortalContext()`, `getAuthenticatedUser()`, `lib/portal-access.ts`, `lib/action-client.ts`, Better Auth e os formatadores existentes. Não replique autenticação em cada componente.
- Nunca registre senhas, tokens, chaves, conteúdo sensível dos chamados ou anexos nos logs.

## Referências do Doop

Canvas: `http://localhost:4400/c/BYeHwktyej`.

- `WHvQRnWFT-` — **13 · Portal — Abrir chamado**, desktop 1440 × 1200.
- `m9tnhxY4tM` — **14 · Portal — Chamado enviado**.
- `uM1XvCpWv-` — **12 · Portal — Meus chamados**.
- `VZDDNkQNmK` — **15 · Portal — Detalhe do chamado**, apenas como referência para visualização; não implementar atendimento completo nesta etapa.

Consultar o MCP, ler os frames atualizados e comparar screenshots da implementação em desktop e mobile. Não editar o canvas. Preservar a sidebar existente de `15.5rem`, sua paleta e a barra de rolagem visualmente oculta, mantendo rolagem acessível quando necessária.

A tela de abertura contém título “Como podemos ajudar?”, link “Ver meus chamados”, formulário, sugestões da base de conhecimento e resumo de SLA. Campos observados: empresa, departamento, assunto, categoria, impacto, descrição e anexos. Nomes, números e prazos demonstrativos devem ser substituídos por dados autorizados do banco.

## Rotas e organização

```text
app/(protected)/
  _components/
    app-sidebar.tsx
    app-nav.tsx
    mobile-navigation.tsx
    dashboard-heading.tsx
    # Somente blocos realmente compartilhados entre páginas/layout.
  chamados/
    page.tsx
    _components/
      create-ticket-form.tsx
      ticket-created.tsx
      # Outros blocos exclusivos de chamados, se necessários.
    novo/
      page.tsx
      loading.tsx
    [ticketId]/
      enviado/
        page.tsx
actions/
  tickets.ts
data/
  tickets.ts
lib/
  validations/
    ticket.ts
  # Utilitário de calendário/SLA, somente se não houver equivalente.
```

- Usar `/chamados/novo` para abertura e `/chamados/[ticketId]/enviado` para confirmação autorizada.
- Cada `page.tsx` contém a função da página, obtém contexto, chama funções de `data/` e retorna a composição dos componentes. Não usar apenas reexports para páginas completas dentro de `_components`.
- Componentes exclusivos ficam em `app/(protected)/chamados/_components/`; compartilhados ficam em `app/(protected)/_components/`; primitivas do shadcn ficam em `components/ui/`. Não criar `_components/chamados/_components` na raiz compartilhada.
- Reutilizar a tabela e o detalhe atuais de chamados. Não duplicar esses componentes nem refazer todo o dashboard.

## Autorização e empresa

- Exigir sessão válida, e-mail confirmado e empresa ACTIVE. Validar novamente na action e na camada de dados; esconder um botão não protege uma mutação.
- Neste fluxo de autoatendimento, o solicitante é sempre o usuário da sessão, com `CompanyMember` ACTIVE na empresa selecionada. REQUESTER, MANAGER e ADMIN da empresa podem abrir para si; não implementar abertura em nome de terceiros nesta etapa.
- ADMIN global e AGENT só podem abrir para si se também tiverem associação ACTIVE à empresa. A permissão de consultar uma empresa não cria automaticamente um vínculo de solicitante. Sem esse vínculo, apresentar estado claro e não inserir associação silenciosamente.
- `Ticket.requester` possui relação composta por `companyId` e `requesterId`: respeitar essa restrição sem mudar o schema para contorná-la.
- Usar o seletor compartilhado para trocar a empresa. O formulário mostra a empresa atual; não criar um segundo seletor com estado divergente. Ao trocar, descartar opções e seleção de departamento da empresa anterior.
- Enviar o identificador da empresa exibida para detectar contexto obsoleto, mas revalidá-lo no servidor contra a sessão e a empresa atual. Se o contexto mudar antes do envio, rejeitar com mensagem para revisar os dados; não transferir o chamado para outra empresa.
- Departamento deve estar ativo e pertencer à empresa autorizada; categoria deve estar ativa. Revalidar ambos no envio, mesmo que tenham vindo de opções do servidor.
- Não aceitar do cliente `requesterId`, número, status, canal, nível, equipe, atendente, contrato, metas ou datas de SLA. Não permitir relações arbitrárias por IDs manipulados.
- Página de confirmação e detalhe devem aplicar o escopo existente de leitura. Um ID de outra empresa não pode revelar assunto, número ou existência do chamado.

## Formulário e validação

- Carregar departamentos ativos da empresa e categorias ativas no servidor. Sem opções disponíveis, mostrar estado explicativo e impedir envio.
- Empresa e solicitante são contexto do servidor. Campos editáveis: departamento, assunto, categoria, impacto e descrição.
- Usar Zod com validação compartilhada e obrigatoriamente executada no servidor: assunto após trim entre 5 e 160 caracteres; descrição após trim entre 20 e 10.000; IDs obrigatórios com limite de tamanho; impacto somente LOW, MEDIUM ou HIGH.
- Validar limites antes de persistir. Rejeitar campos privilegiados ou ignorá-los explicitamente por uma lista permitida; nunca espalhar o payload do cliente diretamente no Prisma.
- Impacto padrão MEDIUM, com rótulos Baixo, Médio e Alto e controles acessíveis. Não confundir impacto com prioridade: usar inicialmente prioridade MEDIUM definida no servidor, com texto explicando que a equipe poderá reclassificar.
- Preservar valores após erro, associar mensagens aos campos, focar o primeiro erro e oferecer estado “Enviando…” com bloqueio de duplo clique. Anunciar resultado com região acessível.
- Descrição como texto simples. Não renderizar HTML arbitrário do usuário. Cancelar retorna para `/chamados` sem gravar; oferecer confirmação de descarte se houver alterações não enviadas.
- Sugestões da base usam somente artigos PUBLIC e PUBLISHED já autorizados. Se exibir busca, ela precisa filtrar resultados de verdade; não deixar input decorativo.

## Persistência e consistência

- Implementar action com `actionClient` e schema validado, delegando acesso ao banco a `data/tickets.ts`.
- Criar em transação o Ticket e o evento CREATED, com ator autenticado e metadados mínimos. A descrição do Ticket é a mensagem inicial; não duplicá-la como TicketMessage se isso repetir o mesmo conteúdo no detalhe existente.
- Valores iniciais: status OPEN, canal PORTAL, prioridade MEDIUM, impacto validado e nível da categoria (`defaultLevel`). Equipe e atendente ficam nulos até existir uma regra real de roteamento; não escolher o primeiro agente ou equipe do banco.
- Deixar `Ticket.number` ser gerado pela sequência do banco e usar o formatador existente. Nunca usar contagem de registros ou redefinir sequência.
- Revalidar associação, empresa, departamento, categoria e contrato no momento da gravação. Tratar inconsistência ou desativação concorrente sem produzir registro parcial.
- Prevenir duplicidade de submissões simultâneas/repetidas com uma chave de idempotência por usuário e empresa e controle persistente transacional. Inspecionar a infraestrutura disponível antes de escolher o mecanismo; não depender somente de estado React ou memória do processo. Não usar hash do conteúdo para bloquear chamados legítimos iguais. Se exigir schema novo, justificar a necessidade antes de executar migração.
- Após commit, atualizar `/dashboard`, `/chamados`, sidebar/contadores e notificações conforme as APIs da versão instalada. Redirecionar para confirmação apenas com o ID retornado pelo servidor.

## Contrato e SLA

- Selecionar contrato ACTIVE da empresa, vigente no instante de abertura e com política ativa. Havendo múltiplos elegíveis, usar regra determinística documentada: início mais recente e ID como desempate. Não aceitar `contractId` ou `slaTargetId` enviados pelo navegador.
- Resolver a meta da prioridade inicial MEDIUM e persistir contrato, meta e minutos de primeira resposta/resolução como snapshot no chamado.
- Calcular os dois vencimentos com calendário de expediente e feriados da política, respeitando `timeZone`, início fora do expediente, intervalos, fins de semana e `alwaysOpen`. Minutos úteis não são simples soma de tempo corrido. Inspecionar utilitários existentes antes de criar outro cálculo.
- Sem contrato vigente ou meta, permitir a abertura sem SLA e informar “Prazo não definido”; manter os campos correspondentes nulos. Se houver configuração de calendário inválida, retornar erro de configuração claro, sem inventar vencimentos nem entrar em loop.
- Resumo de acordo deve usar os dados reais e explicar a classificação inicial. Não prometer os prazos fixos do mockup nem marcar como cumprido um chamado recém-criado.

## Anexos e notificações

- Inspecionar se existe armazenamento real configurado. O modelo TicketAttachment sozinho não fornece upload. Nunca gravar base64 no banco nem colocar anexos privados em `public/`.
- Se houver infraestrutura: implementar upload privado com vínculo ao usuário/empresa, limites de quantidade e tamanho, validação de tipo no servidor, nomes/chaves gerados pelo servidor, download autorizado e limpeza de arquivos órfãos em falhas. O limite visual do Doop é 10 MB por arquivo; considerar também os limites efetivos de transporte da aplicação.
- Se não houver infraestrutura configurada, manter o chamado textual funcional e mostrar anexos como indisponíveis, sem aceitar arquivos ou simular envio. Registrar essa limitação na entrega; não adicionar um serviço externo obrigatório silenciosamente.
- Criar notificação TICKET_CREATED para o solicitante usando o modelo e o escopo existentes, sem fan-out para todos os usuários ou exposição entre empresas.
- Reutilizar Resend e `lib/auth-mail.ts` somente após inspecionar como extrair/reutilizar o transporte sem alterar os templates OTP. E-mail transacional de confirmação deve conter número real e link para destino autorizado, com URL base confiável e conteúdo escapado.
- Enviar e-mail após o commit. Falha de e-mail não deve desfazer o chamado nem levar o usuário a reenviar e duplicar a solicitação. Informar que o chamado foi criado e que a confirmação por e-mail não pôde ser enviada. Não prometer atualizações futuras por e-mail sem implementá-las.

## Confirmação e integração

- Substituir “Abrir chamado” em sidebar, navegação mobile, cabeçalhos e demais pontos existentes por links para `/chamados/novo`. Preservar os avisos de recursos ainda fora do escopo.
- Ajustar breadcrumb e rota ativa: “Abrir chamado” ativo no formulário; “Meus chamados” ativo na listagem e na confirmação. Evitar dois itens ativos simultaneamente pelo prefixo `/chamados`.
- A confirmação consulta o chamado persistido pelo escopo autorizado e mostra número, assunto, empresa, status e prazos disponíveis, com ações “Ver meus chamados” e “Abrir outro chamado”. Oferecer acesso ao detalhe existente sem criar um botão inoperante.
- Não confiar em query string com número/assunto ou em estado de sucesso do cliente. Recarregar a confirmação precisa funcionar e continuar protegido.
- Para ID inexistente ou fora do escopo, usar resposta genérica/not found. O dashboard e a listagem devem exibir o novo chamado após navegar ou recarregar.

## Verificação e aceite

1. Abrir chamado como usuário associado e confirmar Ticket, evento, notificação e número real no banco, sem dados duplicados.
2. Validar erro por campo, opções vazias, falha de persistência, retry e cliques simultâneos. Falhas antes do commit não deixam registros parciais; retry da mesma submissão não duplica o chamado.
3. Testar usuário anônimo, e-mail não confirmado, associação pendente/suspensa, empresa suspensa, ADMIN/AGENT sem vínculo e IDs manipulados de outra empresa. Acesso de leitura existente não deve ser ampliado.
4. Testar troca de empresa enquanto o formulário está aberto e desativação de departamento/categoria antes do envio.
5. Verificar SLA dentro/fora do expediente, fim de semana, feriado, intervalo entre turnos, `alwaysOpen`, ausência de contrato/meta e calendário inválido. Usar testes determinísticos dos cálculos.
6. Conferir dashboard, contador, listagem, confirmação recarregada e detalhe no escopo correto. Confirmar que o formulário não aparece como sucesso sem persistência.
7. Testar falha do provedor de e-mail sem duplicar Ticket. Não enviar e-mails reais de teste sem destinatário autorizado; não alterar senhas de contas existentes.
8. Comparar desktop e mobile no navegador com o Doop, verificar teclado, foco, labels, erros, menu e ausência de overflow horizontal ou scrollbar visível na sidebar.
9. Usar scripts/checks existentes e testes necessários com ferramentas já disponíveis, sem Vitest e sem pasta `tests`. Executar `npm run lint`, `npm run build` e as verificações adicionais pertinentes. Não afirmar resultados não executados.
10. Atualizar a documentação do fluxo com regras de abertura, prioridade inicial, SLA e limitações reais de anexos/e-mail. Preservar documentos existentes; inspecionar caminhos atuais antes de editá-los.

## Fora do escopo

Atendimento pelo agente, resposta ao chamado, notas internas, edição posterior, escalonamento, fechamento, avaliação, gestão de contratos e motor de distribuição de equipe. Não implementar esses módulos apenas porque aparecem na referência.

## Entrega

Informar arquivos alterados, fluxo entregue, verificações executadas e limitações restantes. Distinguir chamado persistido, notificação interna e envio de e-mail. Não executar seed, migrações, commit, push ou deploy como etapa automática de conclusão.
