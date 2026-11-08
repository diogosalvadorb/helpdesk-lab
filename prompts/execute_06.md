# Execução 06 — Detalhe do chamado e atendimento

## Instrução

Implemente dois tópicos: **1. Detalhe do chamado e respostas** e **2. Filas N1/N2/N3 e atendimento**. Complete o ciclo de comunicação entre cliente e suporte, aproveitando a abertura de chamado já implementada. Este documento é um plano; não declare a implementação concluída apenas por lê-lo.

## Regras obrigatórias

- Leia `AGENTS.md`, `prompts/execute_04.md`, `prompts/execute_05.md`, o schema, as actions, os componentes existentes e os guias relevantes em `node_modules/next/dist/docs/` antes de escrever código.
- Preserve alterações locais, autenticação/OTP, abertura e confirmação de chamados. Não faça commit, push, deploy, reset, seed ou migração desnecessária. Justifique mudanças de schema indispensáveis e preserve os dados existentes.
- Use npm, TypeScript, shadcn/ui e os tokens de `app/globals.css`. Sem CSS separado; medidas em rem e imagens com Next Image. Interface em português brasileiro, acessível e responsiva.
- Rotas em `app/(protected)`. Componentes exclusivos em `<rota>/_components/`; compartilhados em `(protected)/_components/`; primitivas em `components/ui/`. Cada `page.tsx` consulta o contexto autorizado e compõe os componentes diretamente.
- Prefira Server Components; consultas/persistência em `data/`, actions validadas no servidor com o cliente existente. Reutilize Prisma, Better Auth e a autorização centralizada. Não exponha segredos ou conteúdo privado em logs.
- Não reinstale Vitest nem recrie `tests`. Use scripts e ferramentas existentes para verificações necessárias.

## Referência

Consulte o MCP do Doop no canvas `BYeHwktyej`, sem editá-lo. Referências: `VZDDNkQNmK` (15 · Detalhe do chamado), `a0wKPeERM9` (23 · Filas N1 N2 N3) e `fnAm7Cm4Gd` (24 · Atendimento e notas internas). Compare screenshots renderizadas no desktop e mobile. Preserve a sidebar existente e sua scrollbar visualmente oculta, sem impedir rolagem.

## Tópico 1 — Detalhe do chamado e respostas

- Criar `/chamados/[ticketId]` com número, assunto, descrição, status, departamento, prioridade, nível, prazos e histórico público real. Substituir os diálogos de detalhe por links para a rota e atualizar a confirmação de abertura.
- Aplicar o escopo de leitura existente: cliente REQUESTER somente seus chamados; gestores da empresa no escopo autorizado; ADMIN global com empresa selecionada; agente somente no escopo operacional permitido. IDs fora do escopo retornam resposta genérica/not found.
- Clientes visualizam apenas mensagens, eventos e anexos PUBLIC. Não carregar conteúdo INTERNAL no payload enviado ao navegador de um cliente, mesmo que esteja oculto no JSX.
- Permitir resposta pública do solicitante e dos gestores autorizados da empresa em chamado não encerrado/cancelado, com autoria sempre derivada da sessão. Validar texto simples após trim, de 1 a 10.000 caracteres, no cliente e no servidor.
- Gravar mensagem e eventos relacionados em transação. Proteger retries e duplo envio com idempotência persistente; uma nova mensagem legítima com texto igual deve continuar permitida.
- Se o cliente responder enquanto WAITING_CUSTOMER, retornar a IN_PROGRESS, registrar a transição e terminar a pausa aberta de forma consistente. Se a pausa afetar vencimentos, usar a mesma regra de calendário e evitar somar tempo duas vezes.
- Paginar o histórico com ordem estável. Mostrar loading, ausência de mensagens, falha e retry sem apagar o texto digitado.
- Inspecionar armazenamento antes de habilitar anexos. Se disponível, implementar upload privado, limites, tipos validados no servidor, download autorizado e limpeza de órfãos; jamais usar `public/` ou base64 no banco. Sem infraestrutura, manter indisponibilidade explícita e registrar a limitação, sem simular upload.

## Tópico 2 — Filas N1/N2/N3 e atendimento

- Criar `/operacao/filas` e `/operacao/chamados/[ticketId]`, reutilizando o histórico compartilhado com projeções de dados adequadas a cada papel. Não criar implementações duplicadas de mensagens.
- Exigir ADMIN global ou AGENT com perfil/equipe ativos. Não confundir ADMIN da empresa com administrador global. Agentes não podem ler outras equipes nem promover seu próprio nível.
- Filtrar filas por equipe e nível autorizados, status e prioridade, com paginação. Chamados sem equipe devem aparecer numa fila de triagem exclusiva do ADMIN, que pode encaminhá-los a uma equipe ativa. Não tornar todos os chamados sem equipe visíveis a qualquer agente.
- Implementar assumir chamado e atribuir responsável ativo da mesma equipe, com limite de capacidade quando aplicável. Usar comparação de versão/estado ou locks em transação: duas pessoas não podem assumir simultaneamente o mesmo chamado.
- Permitir ao suporte responder publicamente e criar notas internas, com controles visualmente distintos e confirmação clara de visibilidade. Nunca enviar nota interna por e-mail ao cliente.
- Registrar `firstRespondedAt` somente na primeira resposta pública humana do suporte; confirmação automática, descrição inicial, resposta do cliente e nota interna não contam como primeira resposta.
- Permitir OPEN → IN_PROGRESS e IN_PROGRESS/INVESTIGATING → WAITING_CUSTOMER, com motivo e evento. Abrir no máximo uma pausa de SLA quando a política permitir. Resolução e escalonamento ficam para a próxima execução.
- Atualizar contadores, histórico e notificações autorizadas após commit. E-mail, quando aplicável, usa o transporte existente depois da transação; falha não desfaz nem duplica a mensagem. Não prometer atualização em tempo real se houver apenas refresh.

## Verificação e entrega

- Testar isolamento por empresa, solicitante, equipe e nível; chamada direta de actions sem permissão; tentativa de forjar autoria/visibilidade; ausência de notas internas no payload do cliente.
- Testar resposta e retry, corrida para assumir chamado, primeira resposta única e pausa/retomada sem duplicidade. Preservar os snapshots de SLA existentes e documentar sua semântica.
- Conferir fluxo cliente → suporte → cliente em navegador desktop/mobile, teclado, foco e ausência de overflow horizontal. Usar fixtures temporárias e não enviar e-mails reais sem destinatário autorizado.
- Executar verificações pertinentes, `npm run lint` e `npm run build`. Documentar rotas, permissões e limitações reais. Sem commits, push ou deploy.
