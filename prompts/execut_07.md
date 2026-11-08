# Execução 07 — Escalonamento, SLA e conclusão do atendimento

## Instrução e dependência

Implemente dois tópicos: **3. Escalonamento e SLA operacional** e **4. Resolução e avaliação**. Antes, verifique se o detalhe, as respostas e as filas descritos em `prompts/execut_06.md` já existem e funcionam. Não confunda o documento com código implementado; registre qualquer pré-requisito ausente e avance somente no trabalho independente dele.

## Regras obrigatórias

- Leia `AGENTS.md`, o schema e os guias relevantes da versão local do Next.js em `node_modules/next/dist/docs/`. Preserve alterações locais e fluxos existentes.
- Use npm, TypeScript, shadcn/ui, textos pt-BR, medidas em rem, Next Image para imagens e estilos somente em `app/globals.css`, com tokens do tema.
- Rotas em `app/(protected)`, componentes exclusivos em `<rota>/_components/`, compartilhados em `(protected)/_components/`. `page.tsx` é Server Component que consulta e compõe; acesso ao banco em `data/` e mutações validadas no servidor.
- Reutilize autenticação, Prisma, transporte de e-mail, calendário e regras de acesso. Não registre dados sensíveis. Sem Vitest ou pasta `tests`, commits, push, deploy, resets ou seed automática.
- Não altere schema sem necessidade demonstrada. Caso snapshots e métricas exijam campos distintos, documente o motivo e faça evolução compatível com registros antigos, sem apagar histórico ou inventar dados.

## Referência

Doop, canvas `BYeHwktyej`: `S_YTT2M7Y6` (25 · Escalonar chamado), `2IPNqLtY9a` (26 · Painel SLA operacional) e `WcAZLrx08O` (37 · Avaliar atendimento). Consultar MCP e comparar desktop/mobile, sem editar o canvas. Preservar a sidebar e sua scrollbar oculta.

## Tópico 3 — Escalonamento e SLA operacional

- Implementar transferência N1 → N2 → N3 com motivo obrigatório, equipe de destino ativa e responsável compatível opcional. Movimentos fora dessa sequência exigem permissão administrativa explícita e auditoria.
- Revalidar escopo de origem e permissão de destino na transação; conhecer um ID de equipe não concede transferência. Não permitir que o agente atribua a si um nível superior.
- Criar TicketEscalation e evento ESCALATED, atualizar equipe/nível/responsável de forma atômica e idempotente. Não deixar responsável de outra equipe após a mudança. Revalidar a leitura depois da transferência: o agente de origem pode perder acesso.
- Criar `/operacao/sla` com chamados próximos do vencimento, vencidos, pausados e sem meta, aplicando filtros e contagens no servidor dentro do escopo autorizado.
- Consolidar o cálculo em um único utilitário de calendário: expediente, intervalos, feriados, fuso, horário de verão, calendário 24h e pausas. Usar os vencimentos/snapshots corretos; não tratar tempo corrido como útil.
- Auditar a semântica de `firstResponseMinutes` e `resolutionMinutes`: metas contratadas e duração efetivamente medida não podem compartilhar um valor ambíguo. Preservar snapshots e separar métricas reais quando necessário; ausência de medição não conta como sucesso.
- Pausas não podem se sobrepor. Retomar deve encerrar a pausa e atualizar o relógio uma única vez. Não reescrever retroativamente prazos históricos ao editar uma política.
- Alertas baseados em `warningPercent` e regras ativas devem ser deduplicados persistentemente. Se automatizar, criar comando de avaliação idempotente para um scheduler real; não usar timer no navegador nem afirmar que existe agendamento sem configurá-lo.
- Se não houver infraestrutura de scheduler, entregar a avaliação executável e documentar que sua execução periódica ainda depende de configuração externa. Não configurar serviço pago ou deploy silenciosamente.

## Tópico 4 — Resolução e avaliação

- Permitir ao suporte autorizado resolver chamados com resumo da solução, preenchendo `resolvedAt`, evento e notificação em transação. Encerrar eventual pausa e medir SLA antes de concluir.
- Definir e documentar as transições: ativo → RESOLVED pelo suporte; RESOLVED → CLOSED por confirmação do solicitante; RESOLVED → IN_PROGRESS por reabertura autorizada com motivo. Não reabrir CANCELED/CLOSED automaticamente nem apagar ciclos anteriores.
- Reabertura não pode sobrescrever os dados históricos da resolução sem rastreabilidade. Decidir explicitamente como o relógio do novo ciclo funciona e mostrar essa regra; não fingir suporte a múltiplos ciclos com um único timestamp perdido.
- Implementar avaliação pelo próprio solicitante em chamado RESOLVED/CLOSED, usando a relação única TicketRating e os limites reais do schema. Não permitir avaliação por outro usuário, mesmo gestor da empresa, nem múltiplas avaliações por replay.
- Registrar estrelas e comentário opcional validados no servidor, com feedback acessível. Definir se a avaliação pode ser editada; manter o comportamento consistente com a auditoria.
- Atualizar detalhe, filas, dashboard, notificações e indicadores após cada transição. E-mails somente após commit, sem duplicar transições em retry.

## Verificação e entrega

- Testar escalonamento concorrente, destino inválido, equipe inativa, elevação indevida e perda de acesso após transferência.
- Testar expediente/feriado/DST, múltiplas pausas, alertas repetidos, ausência de meta e separação entre meta e duração real.
- Testar resolução repetida, corrida entre responder/resolver, reabertura, encerramento e avaliação por terceiro/replay. Conferir o ciclo completo em desktop/mobile e teclado.
- Executar os scripts adequados, `npm run lint` e `npm run build`. Documentar transições, métricas, scheduler e limitações verificadas. Não afirmar envio real ou automação não testados.
