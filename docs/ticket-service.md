# Detalhe e atendimento de chamados

## Rotas

- `/chamados/[ticketId]`: detalhe público, histórico paginado e resposta do cliente.
- `/operacao/filas`: filas de atendimento por nível, com filtros de equipe, empresa, status, prioridade, assunto/número e paginação de 20 chamados.
- `/operacao/filas?triage=true`: chamados ativos sem equipe, exclusivos da triagem administrativa.
- `/operacao/chamados/[ticketId]`: atendimento, atribuição, respostas públicas, notas internas e espera de informações.

Os links do dashboard, pendências, listagem e confirmação de abertura levam ao detalhe real. A conversa usa uma implementação compartilhada, com consultas diferentes para portal e operação. Loading e erro usam as estruturas existentes do portal.

## Permissões

O portal preserva o contexto autorizado de empresa. REQUESTER lê e responde somente seus chamados; MANAGER/ADMIN de empresa podem responder dentro da própria empresa ativa. É necessário vínculo ACTIVE para responder pelo portal, inclusive para administradores globais. O autor sempre vem da sessão, nunca do formulário.

A operação exige ADMIN global ou AGENT com perfil e equipe ativos. ADMIN global tem acesso às empresas ativas e pode selecionar filtros explícitos na fila, independentemente do seletor de empresa do portal. O workspace operacional identifica esse contexto; não usa um seletor que pareça restringir dados sem efetivamente fazê-lo.

Agentes acessam somente sua equipe e níveis compatíveis: N1 atende N1; N2 atende N1/N2; N3 atende N1/N2/N3. Esse limite também é aplicado às consultas do portal para agentes. Categorias disponíveis na abertura feita por agente respeitam seu nível, evitando criar um chamado que ele não possa acompanhar. O ADMIN da empresa, cujo papel global é CLIENT, não recebe acesso operacional.

Clientes nunca recebem mensagens ou eventos INTERNAL, nem metadados arbitrários dos eventos. O filtro é feito na consulta, antes da serialização. IDs de outras empresas, equipes ou níveis não concedem acesso. O histórico público não oferece upload ou download de anexos porque não existe armazenamento privado configurado.

## Atribuição e estados

Somente ADMIN global pode encaminhar um chamado sem equipe para uma equipe ativa. Isso não muda o nível e não implementa escalonamento. Agentes não veem a fila sem equipe.

Assumir exige agente ativo compatível com a equipe e nível. Atribuir a outra pessoa também valida equipe, nível, e-mail confirmado e capacidade de chamados ativos. Uma atribuição nova gera evento e, quando destinada a outra pessoa, notificação interna. ADMIN global sem perfil de agente pode atribuir, mas não assumir como se fosse atendente.

Assumir/atribuir um chamado OPEN muda seu estado para IN_PROGRESS e registra a transição. O responsável ou ADMIN global pode iniciar atendimento ou mudar IN_PROGRESS/INVESTIGATING para WAITING_CUSTOMER, com motivo obrigatório, visível ao solicitante na notificação. Chamados resolvidos, encerrados ou cancelados não aceitam esses controles de atendimento.

O detalhe aceita mensagens em chamados não CLOSED/CANCELED. Responder em RESOLVED não reabre automaticamente o chamado; resolução e reabertura pertencem à próxima etapa. Uma resposta pública humana do suporte em OPEN inicia atendimento. Notas internas não alteram o status e exigem confirmação visual de visibilidade na interface.

## Concorrência e idempotência

Mutações usam transação serializável, lock por chamado e retries limitados. A atribuição usa também lock por agente para proteger a capacidade entre chamados distintos. Os controles usam a versão `updatedAt`, atualizada de maneira monotônica; versões obsoletas são rejeitadas.

Cada mensagem recebe ID derivado de usuário, chamado e UUID da submissão. Replay retorna a mensagem existente; reutilizar a mesma chave com texto ou visibilidade diferente é rejeitado. Novas mensagens legítimas com o mesmo texto usam novas chaves. Operações de atendimento usam eventos com IDs determinísticos e fingerprint dos argumentos. Uma resposta não precisa inventar um evento de mudança de status: a mensagem é seu próprio registro no histórico.

## Primeira resposta e pausas

`firstRespondedAt` é registrado uma única vez, na primeira resposta pública humana do suporte para outro solicitante. Descrição inicial, mensagem do cliente/gestor, nota interna, atribuição e confirmação automática não contam como primeira resposta.

Os campos de minutos existentes continuam como snapshots de meta; esta etapa não os sobrescreve com duração medida. A separação de metas e métricas de resolução e múltiplos ciclos pertence à execução seguinte.

WAITING_CUSTOMER abre no máximo uma pausa quando a política do contrato permitir e houver vencimento de SLA. Uma resposta pública nesse estado retorna a IN_PROGRESS e encerra a pausa atomicamente. Notas internas não retomam o relógio.

O tempo útil da pausa é calculado com o mesmo calendário de expediente/feriados/fuso utilizado na abertura. Esse tempo é acrescentado aos vencimentos, sem alterar uma primeira resposta já registrada. O replay não encerra nem aplica a pausa duas vezes. Múltiplas pausas abertas ou calendário inválido exigem correção administrativa e produzem erro sem gravação parcial.

## Notificações e e-mail

Respostas públicas notificam o solicitante ou responsável, conforme a direção da conversa, se o destinatário ainda tiver acesso. Mensagens do cliente sem responsável atribuído permanecem no histórico e na fila; não há envio para todos os agentes.

Quando o destinatário tem e-mail confirmado e não desabilitou e-mail em NotificationPreference, o transporte Resend envia somente número e link autenticado, depois do commit. Notas internas nunca disparam e-mail para o cliente. Uma falha de entrega não desfaz nem duplica a mensagem; a interface informa que a mensagem está salva. Não há fila de reenvio automático ou atualização em tempo real nesta etapa.

## Verificação

`npx tsx --test scripts/check-ticket-service.ts` verifica cálculo de pausas, calendário, escopo por nível, validações e limites de filtros. As verificações de navegador usam dados temporários, instância local com envio real de e-mail desabilitado e limpeza restrita às fixtures.

Conferir o ciclo cliente → assumir → nota interna → resposta pública → espera → resposta do cliente, inclusive replay concorrente, disputa de atribuição, capacidade compartilhada, revogação de vínculo/perfil, histórico paginado e ausência de conteúdo interno em HTML/RSC do cliente. Comparar desktop/mobile com o Doop, testar teclado e executar lint/build.

Na entrega, os seis testes automatizados passaram. Também foram executados o ciclo completo no navegador, respostas do gestor da empresa, tentativas de forjar autor/visibilidade, acesso por outra empresa/equipe/nível, resposta em chamado encerrado, replay da atribuição, disputa de capacidade entre chamados diferentes, responsável incompatível, triagem administrativa e pausas antes/depois da primeira resposta. Foram conferidos histórico paginado, revogação de perfil/vínculo, teclado, menu e ausência de overflow horizontal em desktop/mobile. Os dados temporários foram removidos; o envio real de e-mail ficou desabilitado na instância de teste.

Anexos, escalonamento, resolução, avaliação, agendamento de alertas e administração completa continuam fora desta entrega. Nenhum schema ou migração foi necessário.
