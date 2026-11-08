# Execução 09 — Conhecimento e melhorias do portal

## Instrução e dependência

Implemente dois tópicos: **7. Base de conhecimento** e **8. Melhorias do portal**. Aproveite os módulos existentes de chamados, SLA, mensagens e administração; confirme o que já está implementado para não substituir funcionalidades por versões simplificadas.

## Regras obrigatórias

- Leia `AGENTS.md`, os planos anteriores, o schema, as rotas e os guias relevantes da versão local do Next.js em `node_modules/next/dist/docs/`.
- Preserve alterações locais e todos os fluxos existentes. Use npm, TypeScript, shadcn/ui, português brasileiro, rem e Next Image. CSS exclusivamente em `app/globals.css`, com tokens do tema.
- Rotas em `app/(protected)`; componentes exclusivos em `<rota>/_components/`, compartilhados em `(protected)/_components/` e primitivas em `components/ui/`. Não reexportar páginas completas de pastas privadas.
- Consultas/persistência em `data/`, autenticação e autorização centralizadas, entradas validadas no servidor. Não cachear dados privados de forma compartilhada entre usuários/empresas.
- Sem Vitest ou pasta `tests`, commits, push, deploy, resets ou seed automática. Alterar schema somente quando houver necessidade demonstrada, preservando registros existentes.

## Referência

Consultar MCP do Doop no canvas `BYeHwktyej`: `zCT_bpSUSW` (16 · Base), `q_QY87LnIo` (17 · Artigo), `D2R4wZlx6z` (28 · Gestão da base), `jo9db417io` (29 · Editor), `uM1XvCpWv-` (12 · Meus chamados), `x77qhqPRSY` (18 · SLA do cliente) e `4yDxkghM8R` (36 · Notificações). Comparar desktop/mobile sem editar o canvas.

## Tópico 7 — Base de conhecimento

- Completar `/conhecimento` com busca e filtros reais, resultados paginados, estados vazio/erro e links para `/conhecimento/[articleId]`.
- Criar página de artigo com título, conteúdo, categoria, tempo de leitura, data e retorno à base. Usar a mesma projeção pública nas sugestões da abertura de chamado.
- Cliente recebe somente artigos PUBLISHED e PUBLIC. Conhecer o ID de artigo interno, arquivado ou rascunho não concede acesso, inclusive por prefetch e actions.
- Criar `/operacao/conhecimento` e rotas de criação/edição. ADMIN global administra; AGENT ativo pode gerir conteúdo interno no escopo autorizado, mas publicação pública exige ADMIN global nesta etapa. A associação administrativa de empresa não concede edição da base global.
- Implementar rascunho, revisão/visualização, publicação e arquivamento com ator e datas reais. Revalidar categoria ativa e unicidade de slug no servidor.
- Inspecionar os campos do schema: a base atual é global por categoria e visibilidade, sem empresa proprietária. Não inventar isolamento por empresa em uma tabela sem esse vínculo nem expor artigos internos a clientes para contornar a limitação.
- Definir um formato único de conteúdo. Se houver Markdown/HTML, sanitizar por lista permitida e bloquear scripts/URLs perigosas. Não usar `dangerouslySetInnerHTML` com entrada não sanitizada. Texto simples continua válido se essa for a escolha documentada.
- Imagens somente com armazenamento e regras reais de acesso. Sem upload configurado, não exibir inserção de mídia como funcional.
- Calcular ou validar tempo de leitura e manter busca, links e resultados coerentes após publicação/arquivamento.

## Tópico 8 — Melhorias do portal

- Completar `/chamados` com busca por número/assunto, filtros de status, prioridade, departamento e período, ordenação permitida e paginação estável no servidor.
- Persistir filtros na URL com parâmetros validados e limitados. Aplicar autorização antes de contagem, paginação e agregação. Não carregar todas as empresas e filtrar no cliente.
- Reutilizar o detalhe e as respostas já implementados. Se houver exportação, limitar ao escopo, paginar o processamento e proteger CSV contra fórmulas; não incluir conteúdo interno.
- Completar `/sla` com indicadores reais, próximos vencimentos, pausados e histórico autorizado. Usar a fórmula consolidada da execução 07; sem amostra elegível, mostrar “Sem dados”.
- Completar notificações no padrão do Doop, com paginação, filtros lidas/não lidas e links para destinos autorizados. “Marcar todas como lidas” deve afetar somente o usuário e o contexto permitido.
- Garantir que título, corpo e destino de notificações não vazem dados após suspensão de vínculo, transferência de equipe ou troca de empresa. Revalidar o acesso no destino.
- Preservar leitura individual, badges reais e ausência de duplicatas. Polling ou atualização automática, se usados, devem ser limitados e limpos ao desmontar; não prometer realtime sem infraestrutura.
- Revisar loading, vazio, erro, retry e acesso pendente nos módulos do portal. Manter a sidebar sem barra de rolagem visível, mas com navegação acessível.

## Verificação e entrega

- Testar publicação/arquivamento, slug duplicado, conteúdo malicioso e tentativa de acessar rascunho ou artigo interno como cliente.
- Testar filtros/URL inválidos, páginas vazias, ordenação com empate e consistência entre total e resultados autorizados.
- Testar marcação em massa e acesso a notificação antiga após perda de permissão; conferir SLA sem meta ou histórico suficiente.
- Conferir desktop/mobile, teclado, foco e leitores de tela nos controles relevantes. Executar scripts pertinentes, `npm run lint` e `npm run build`.
- Atualizar documentação de publicação, busca, notificações e indicadores; informar limitações reais de armazenamento e atualização automática.
