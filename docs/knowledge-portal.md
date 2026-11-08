# Base de conhecimento e portal — execução 09

## Publicação e acesso

A base é global, organizada por categoria e visibilidade. Não existe proprietário por empresa no schema. Clientes com contexto de empresa autorizado recebem somente artigos `PUBLISHED` e `PUBLIC`, de categorias ativas, em `/conhecimento` e `/conhecimento/[articleId]`. Essa mesma projeção é utilizada nas sugestões da abertura de chamado e no dashboard. Busca por título/conteúdo/palavra-chave, filtro de categoria e paginação são executados no servidor. A ordenação usa atualização e ID para desempate.

`/operacao/conhecimento`, `/operacao/conhecimento/novo`, `/operacao/conhecimento/[articleId]` e `/operacao/conhecimento/[articleId]/visualizar` permitem criar, revisar, publicar e arquivar artigos. `ADMIN` global administra toda a base. Agentes ativos em equipes ativas podem consultar artigos internos publicados e seus próprios rascunhos/arquivados, mas editar somente os próprios artigos internos. Não se inventa propriedade por equipe ou empresa. Papéis administrativos da empresa não concedem edição global. Conteúdo público exige administrador global, mesmo quando a tentativa é feita diretamente pela action.

O formato escolhido é **texto simples**, com parágrafos e quebras de linha. React escapa o texto; não há `dangerouslySetInnerHTML`, interpretação de Markdown/HTML ou ativação de URLs escritas no conteúdo. Scripts, imagens e HTML colados permanecem texto inerte. Não há upload de mídia ou botões simulando armazenamento.

Título, identificador único (`slug`), categoria ativa, conteúdo e palavras-chave são validados no servidor. Novas palavras-chave são normalizadas em minúsculas e deduplicadas. Os links usam o ID do artigo, como definido nas rotas. O tempo de leitura é calculado a 200 palavras/minuto, mínimo de um minuto. Salvar rascunho retira a publicação; publicar valida novamente as permissões; arquivar preserva o registro. `publishedAt` registra a publicação, `updatedAt` registra edições, e `AdministrativeLog` preserva ator, alterações e datas. Formulários desatualizados são rejeitados e submissões repetidas com os mesmos dados não duplicam gravações. A prévia local não publica conteúdo.

## Chamados e indicadores de SLA

`/chamados` usa filtros validados na URL: `q`, `status`, `priority`, `department`, `from`, `to`, `sort` e `page`. A busca aceita assunto, número ou `#CH-123`. Datas delimitam a criação em UTC, com fim inclusivo. Um período invertido produz mensagem e resultado vazio. Ordenações permitidas: recentes, antigos, atualização e prioridade, sempre com desempate por ID. A página contém 10 resultados, e autorização é aplicada antes das contagens, agregações e paginação. Contagem e resultados são lidos na mesma transação de leitura. O detalhe e as respostas continuam usando os fluxos anteriores. Não foi criada exportação CSV nesta etapa.

`/sla` calcula a situação atual dos chamados autorizados com `inspectSla`, snapshots e calendário da execução 07. Exibe prazos, risco, vencimento, pausas e ausência de medição; o acompanhamento é ordenado pelo vencimento. A inspeção usa lotes no servidor, sem enviar snapshots, notas ou regras internas ao navegador. A paginação mantém somente a faixa necessária de resultados em memória.

O histórico consulta eventos reais de resolução, incluindo ciclos anteriores de chamados reabertos. O período `from`/`to` filtra a data da resolução em UTC e, por padrão, corresponde ao mês corrente. O histórico tem paginação independente por `historyPage`; `bucket` filtra a situação dos chamados ativos. Cada ciclo elegível deve possuir primeira resposta medida e metas/durações válidas. Ausência de medição não conta como sucesso. Percentual e média usam esses ciclos e mostram **Sem dados** quando a amostra é vazia. Resumos internos presentes nos eventos não são enviados ao portal. As metas do contrato vigente continuam disponíveis no componente de acordo de atendimento.

## Notificações

O sino abre uma gaveta lateral com notificações e leitura individual. `/notificacoes` acrescenta paginação e filtros `read=all|unread|read`. Não há polling, websocket ou promessa de atualização em tempo real; navegação e ações revalidam o conteúdo.

Cada consulta e mutação relê usuário, estado ativo, empresa, vínculo e perfil/equipe de suporte. O escopo é aplicado antes da contagem e da projeção. Notificações de chamados seguem o acesso atual ao chamado, inclusive depois de transferência ou suspensão. Os títulos são derivados do tipo e os corpos usam o assunto público atual, evitando devolver textos antigos que possam conter informações indevidas. Os links apontam para o detalhe autorizado no portal ou na operação, onde a autorização é repetida.

Foi acrescentado `Notification.companyId`, opcional e indexado, para notificações sem chamado. A aprovação de vínculo passa a preencher esse campo. Notificações de aprovação só aparecem na empresa correspondente enquanto o vínculo permanece ativo. Notificações legadas sem chamado e sem empresa identificável ficam ocultas: não se deduz a empresa a partir do texto. Notificações antigas com chamado continuam usando a relação já existente, sem necessidade de inventar um vínculo retroativo.

**Marcar todas como lidas** afeta somente notificações autorizadas do usuário na empresa selecionada, até o instante da listagem; não altera notificações recebidas depois desse corte. Uma empresa diferente no payload é rejeitada. A leitura individual também é autorizada no servidor e é idempotente. Badges usam a contagem autorizada de não lidas, sem criar notificações novas ou duplicatas.

## Estados e verificação

Os módulos preservam o acesso pendente, carregamento e erro com tentativa novamente do layout protegido. Conhecimento e notificações possuem loading próprio. Conteúdo inexistente ou não autorizado mostra a mesma mensagem genérica em português, sem revelar seu título ou corpo. Estados vazios têm orientação para rever filtros; controles possuem rótulos, foco e navegação por teclado. A sidebar mantém a rolagem disponível e a barra visual oculta.

A única alteração de schema desta etapa foi o contexto opcional da notificação e sua relação/índice. Foram utilizados `npx prisma generate --config prisma7.config.ts` e `npx prisma db push --config prisma7.config.ts`, sem pasta de migrações, reset, seed ou aceitação de perda de dados.

Verificações locais:

```sh
node --conditions=react-server --import tsx --test scripts/check-knowledge-portal.ts
npm run lint
npm run build
```

O script local fica na pasta `scripts`, ignorada pelo Git conforme preferência do projeto. Usa somente fixtures identificadas e remove seus registros ao terminar. Os testes de navegador utilizam contas temporárias, comparação com o Doop, desktop/mobile e uma instância local com envio real de e-mail desabilitado. Não foi configurado armazenamento de mídia, agendamento ou infraestrutura de atualização automática.

Na entrega, lint, build e os três testes desta etapa passaram; os três testes administrativos anteriores também passaram. No navegador foram conferidos publicação/arquivamento, busca por palavra-chave sem distinção de caixa, conteúdo malicioso inerte, slug/permissões, prefetch de conteúdo restrito, filtros combinados, empate de ordenação, paginação e páginas vazias. Também passaram histórico de SLA por ciclo, pausas, ausência de amostra, leitura de notificações individual/em massa, troca de empresa e suspensão com sessão aberta. A gaveta foi verificada em desktop/mobile, inclusive seus limites na tela, foco e fechamento por teclado. O fluxo anterior de escalonamento, resolução, reabertura e avaliação foi conferido por regressão. Todos os dados temporários foram removidos.
