# Execução 10 — Indicadores, configurações e acabamento

## Instrução e dependência

Implemente dois tópicos: **9. Visão geral e relatórios** e **10. Configurações e acabamento**. Antes de calcular métricas, confira os fluxos e a semântica dos dados das execuções 06 a 09. Não apresentar métricas fictícias para funcionalidades ainda ausentes.

## Regras obrigatórias

- Leia `AGENTS.md`, os planos anteriores, os modelos reais e a documentação relevante em `node_modules/next/dist/docs/` antes de implementar.
- Preserve alterações locais, dados e fluxos existentes. Use npm, TypeScript, shadcn/ui, pt-BR, rem e Next Image para imagens. Estilos somente em `app/globals.css`, reutilizando tokens.
- Toda rota autenticada fica em `app/(protected)`. Componentes exclusivos pertencem a `<rota>/_components/`, compartilhados à raiz comum; primitivas ficam em `components/ui/`. `page.tsx` consulta o contexto e compõe os componentes diretamente.
- Centralize acesso ao banco em `data/`, valide entradas no servidor e reutilize Prisma/Better Auth. Não vaze dados em logs, exportações, caches ou gráficos agregados.
- Não criar Vitest ou pasta `tests`, nem fazer commit, push, deploy, reset ou seed automática. Justificar qualquer alteração indispensável de schema, sem apagar dados históricos.
- Não criar `prisma/migrations`. Quando a tarefa exigir alteração de schema, usar `npx prisma generate --config prisma7.config.ts` e `npx prisma db push --config prisma7.config.ts`, sem `--accept-data-loss`.

## Referência

Consultar MCP do Doop, canvas `BYeHwktyej`: `2sFq46Ykvo` (22 · Visão geral operacional), `C_uWuC4mK-` (30 · Relatórios operacionais), `QTzdvAuKVk` (19 · Relatórios do portal), `1uSwhT32j9` (21 · Configurações do portal), `bzuJK-k72u` (35 · Configurações operacionais), `lLFynleJCM` (38 · Vazio), `F2ainM1H1R` (39 · Expirado), `OcZxwfwrOp` (40 · Erro), `s_iIiS8kaw` (41 · Canais), `OtaUAmeBqR` (42 · Privacidade), `75iho6M_zP` (43 · Termos), `NdIZ0tB5sC` e `YpQmSb5AUb` (mobile). Comparar renderização sem alterar o canvas.

## Tópico 9 — Visão geral e relatórios

- Criar `/operacao` com visão geral e `/operacao/relatorios` com métricas de volume, backlog, prioridade, níveis, primeira resposta, resolução, escalonamento, SLA e avaliações, somente quando houver dados válidos.
- ADMIN global consulta o escopo explicitamente selecionado; AGENT ativo somente dados operacionais de sua equipe/permissão. Não usar a existência de acesso à operação para liberar agregados globais.
- Criar `/relatorios` no portal para MANAGER/ADMIN de empresa ativa. REQUESTER não recebe relatórios de colegas; negar ou oferecer somente seu próprio escopo com identificação clara.
- Definir cada métrica: evento/timestamp usado, intervalo, denominador, exclusões, ciclo de reabertura e unidade de tempo. Separar médias/medianas de metas contratuais. Ausência de dados deve ser informada, nunca preenchida com valores do mockup.
- Períodos em `America/Sao_Paulo`, com início inclusivo e fim exclusivo. Testar fim de mês/ano e evitar dependência do fuso do host. Comparações usam períodos equivalentes.
- Executar filtros e agregações no servidor com limites de intervalo e consultas adequadas. Paginar tabelas e investigar índices apenas quando as consultas demonstrarem necessidade.
- Não reconstruir histórico de backlog ou status com a fotografia atual se faltarem eventos históricos. Mostrar indisponibilidade para períodos sem dados suficientes e documentar a cobertura.
- Gráficos devem ter rótulos, legenda e alternativa tabular acessível. Não depender apenas de cor para status.
- Exportação deve refletir exatamente os filtros e o escopo autorizados, sem notas internas para clientes, sem fórmulas executáveis em CSV e com limite/tamanho documentados. Não armazenar relatórios privados em URLs públicas.

## Tópico 10 — Configurações e acabamento

- Completar `/configuracoes` para perfil e preferências do usuário e `/operacao/configuracoes` para configurações administrativas realmente suportadas. Separar privilégios e não expor segredos de infraestrutura na interface.
- Usar o Better Auth existente para dados e ações de conta. Não permitir edição de papel global ou `emailVerified` pelo usuário. Mudança de e-mail exige verificação apropriada; preservar OTP e revogação de sessões conforme a política existente.
- Integrar NotificationPreference aos envios e canais suportados, respeitando diferenças entre notificações opcionais e mensagens essenciais de segurança. Não oferecer preferências que o backend ignore.
- Completar canais de atendimento com dados configurados, horários reais e contatos válidos. Não apresentar WhatsApp, telefone ou plantão inventados como canais disponíveis.
- Completar privacidade e termos com navegação acessível, reaproveitando a apresentação comum. Se conteúdo definitivo, responsável ou contatos não estiverem disponíveis, identificá-los como pendência editorial; não fabricar alegações legais, certificações ou garantias de conformidade.
- Adaptar a tela “Link expirado” ao fluxo OTP real: código expirado/inválido, reenvio com cooldown e retorno seguro. Não introduzir um fluxo de link de recuperação incompatível com o sistema atual.
- Uniformizar estados vazios, erros, loading, acesso pendente e indisponibilidade. Diferenciar erro recuperável, falta de permissão e recurso não implementado, sem revelar dados privados.
- Revisar navegação, breadcrumbs, rotas ativas, foco, teclado, contraste, layout mobile e transbordamento. Preservar a sidebar do Doop e esconder apenas a scrollbar, não conteúdo inacessível.
- Remover avisos “Em breve” somente para funcionalidades efetivamente entregues. Manter limitações de anexos, scheduler ou e-mail explícitas se continuarem pendentes.

## Verificação e entrega

- Conferir indicadores com amostras conhecidas do banco, filtros, denominadores, reabertura, ausência de histórico e fronteiras de data. Testar isolamento também em agregados e exportações.
- Testar alterações de perfil, tentativa de elevar papel, preferências persistidas, OTP expirado/reenvio e falha de configuração. Não enviar e-mails reais sem destinatário autorizado.
- Fazer revisão desktop/mobile com o Doop e do ciclo completo: autenticar → abrir → atender → responder → escalonar → resolver → avaliar → consultar relatório, conforme os módulos existentes.
- Executar verificações apropriadas, `npm run lint` e `npm run build`. Atualizar a documentação e o inventário de telas com estados implementado/parcial/pendente.
- Entregar resultados reais, limitações técnicas e pendências editoriais ou externas. Não declarar o sistema pronto para produção apenas porque as telas renderizam.
