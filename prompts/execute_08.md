# Execução 08 — Administração de empresas, equipe e contratos

## Instrução e dependência

Implemente dois tópicos: **5. Gestão de empresas, departamentos e equipe** e **6. Contratos e políticas de SLA**. Verifique o estado real das execuções anteriores antes de integrar alterações a filas, permissões ou cálculos. O objetivo é administrar pela interface os cadastros que hoje dependem da seed.

## Regras obrigatórias

- Leia `AGENTS.md`, o schema, os fluxos existentes e a documentação local relevante em `node_modules/next/dist/docs/` antes de implementar.
- Preserve dados e alterações locais. Use npm e TypeScript; sem commits, push, deploy, resets ou seed automática. Justifique mudanças indispensáveis de schema e evite operações destrutivas.
- Não crie a pasta `prisma/migrations` nem arquivos de migração. Para atualizar o Prisma, use `npx prisma generate --config prisma7.config.ts` e `npx prisma db push --config prisma7.config.ts`, respeitando a configuração existente. Não use `--accept-data-loss`, `--force-reset` ou comandos `prisma migrate`.
- Use shadcn/ui, português brasileiro, rem e Next Image quando houver imagens. Todo estilo fica em `app/globals.css`, com tokens existentes ou novos tokens necessários.
- Rotas autenticadas em `app/(protected)`; componentes exclusivos na pasta `_components` da rota, compartilhados na raiz comum e primitivas em `components/ui/`. Páginas consultam e compõem diretamente no servidor; consultas e persistência em `data/`.
- Reutilize Prisma, Better Auth, autorização e validação de actions. UI escondida não é controle de acesso. Não instale Vitest nem recrie `tests`.

## Referência

Consultar MCP do Doop, canvas `BYeHwktyej`, sem alterar frames: `cfu7xfxuDZ` (31 · Empresas clientes), `MIROBbW_EW` (32 · Empresa e contrato), `ZRth-4RjhP` (33 · Departamentos), `khWNHhq7KF` (34 · Equipe de suporte) e `OSPyASOLf4` (27 · Políticas de SLA). Comparar renderização desktop/mobile e preservar a sidebar.

## Tópico 5 — Empresas, departamentos e equipe

- Criar `/operacao/empresas`, `/operacao/empresas/[companyId]`, `/operacao/departamentos` e `/operacao/equipe`, com listagem paginada, busca real, criação, edição e ativação/suspensão autorizadas.
- Administração global é exclusiva de UserRole.ADMIN. Não permitir que CompanyRole.ADMIN gerencie empresas alheias, usuários globais, agentes ou políticas globais. Agentes operacionais não recebem CRUD administrativo por padrão.
- Implementar `/departamentos` no portal para gestores autorizados administrarem somente os departamentos de sua empresa. Compartilhar os blocos de apresentação com a operação quando houver uso real em ambas as rotas.
- Validar dados cadastrais, unicidade e relações no servidor. Não expor notas internas da empresa ao cliente.
- Gerenciar associações: aprovação, rejeição e suspensão, papéis de empresa e departamento pertencente à mesma empresa. Registrar ator e mudanças relevantes; não permitir autoaprovação ou elevação de papel por payload manipulado.
- Gerenciar SupportTeam e SupportAgent com equipe, nível, disponibilidade, capacidade e estado ativo. Alterações de nível/papel global exigem ADMIN global. Não criar ou alterar senhas por formulários administrativos improvisados.
- Suspender empresa, vínculo, departamento ou agente deve surtir efeito nas consultas/actions seguintes, sem confiar em sessão antiga. Preservar registros históricos; preferir arquivamento/desativação à exclusão.
- Ao desativar agente/equipe com chamados ativos, mostrar impacto e exigir encaminhamento consistente ou impedir a operação com erro explicativo. Nunca deixar transferências parciais ou responsáveis incompatíveis.
- Manter a conta administrativa existente e impedir a remoção/suspensão do último administrador global ativo sem uma regra segura de sucessão. Não identificar esse usuário por e-mail fixo no código.

## Tópico 6 — Contratos e políticas de SLA

- Criar `/operacao/contratos`, `/operacao/sla/politicas` e a edição de calendários utilizada pelas políticas, com navegação integrada.
- Administrar contrato por empresa: número único, nome, vigência, status, política e meta de cumprimento. Validar datas, percentual e empresa no servidor.
- Detectar contratos ativos com vigência sobreposta e impedir ambiguidades novas ou exigir uma regra explícita. Preservar o desempate determinístico existente para dados legados e documentá-lo.
- Administrar políticas versionadas, metas por prioridade, `warningPercent`, pausa em WAITING_CUSTOMER e regras de escalonamento compatíveis com os níveis.
- Validar minutos positivos, resolução coerente com primeira resposta, percentuais e unicidade por política/prioridade. Não permitir ciclos nas regras de escalonamento.
- Calendários devem validar fuso IANA, dias, intervalos sem sobreposição e feriados. Respeitar o modo 24h e o horizonte suportado pelo motor; rejeitar configurações que não produzem prazo útil.
- Políticas/calendários usados por chamados devem conservar seu histórico. Preferir nova versão para mudanças efetivas; não alterar vencimentos antigos silenciosamente. Qualquer recálculo deve ser uma operação explícita, autorizada e auditável, fora do salvamento simples.
- Reutilizar o cálculo de SLA existente, sem criar uma segunda fórmula divergente. Contratos/políticas inativos não entram em novas aberturas, mas continuam referenciáveis no histórico.

## Verificação e entrega

- Testar CRUD e paginação com escopos distintos, IDs de outra empresa, autoelevação, suspensão com sessão existente, último administrador e desativação com chamados ativos.
- Testar contratos sobrepostos, vigências, política inativa, limites de metas, intervalos/feriados inválidos e preservação dos vencimentos históricos.
- Conferir um novo chamado usando contrato criado pela interface, com metas reais e isolamento entre empresas. Validar desktop/mobile e teclado.
- Executar verificações adequadas, `npm run lint` e `npm run build`. Atualizar documentação administrativa e informar limitações e alterações de schema efetivamente aplicadas por `prisma db push`.
