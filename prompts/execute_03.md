## User Prompt

Você é um desenvolvedor full stack sênior, especializado em Next.js. Implemente os fluxos abaixo no Helpdesk Lab, incluindo interface, integração e validações reais.

## Objetivo

Implementar confirmação de cadastro e recuperação de senha com código numérico enviado por e-mail usando Resend e o plugin Email OTP do Better Auth. Adaptar as telas “Confirmar cadastro” e “Instruções enviadas” do Doop para entrada do código, preservando o estilo existente e a versão mobile.

Neste escopo, “confirmação de senha” significa recuperar/redefinir a senha mediante um código recebido por e-mail. O campo de confirmação da nova senha continua sendo uma validação local de igualdade. Nunca enviar a senha por e-mail.

## Contexto e estado a verificar

- Stack: npm, React 19, Next.js 16, Prisma 7, shadcn/ui, Better Auth, React Hook Form, Zod e next-safe-action.
- Autenticação do servidor em `lib/auth.ts`; cliente em `lib/auth-client.ts`.
- Actions existentes em `actions/auth/login.ts` e `actions/auth/register.ts`.
- Componentes de autenticação em `app/authentication/_components`.
- O cadastro atual cria a conta e redireciona para `/`; substituir essa transição pela etapa de confirmação.
- `User.emailVerified` e o modelo `Verification` já existem em `prisma/schema.prisma`. Reutilizar a persistência do Better Auth; não criar uma tabela própria de códigos por padrão.
- A recuperação atual deve ser inspecionada, incluindo `auth-info.tsx` e o link “Esqueci minha senha”, para substituir qualquer mensagem provisória pelo fluxo funcional.
- Verificação do e-mail não aprova vínculo com empresa nem concede permissões administrativas. Preservar as regras de associação e autorização existentes.

## Regras obrigatórias

- Leia `AGENTS.md` e os guias pertinentes em `node_modules/next/dist/docs/` antes de alterar código. Considere Cache Components e Suspense ao acessar `searchParams` e dados de requisição.
- Use apenas npm: `npm ci`, `npm install`, `npm run` e `npx`. Não gerar lockfiles ou configurações de outro gerenciador.
- Consulte os componentes disponíveis em `components/ui/` e reutilize shadcn/ui. Se necessário, adicione o componente oficial Input OTP pelo CLI, verificando sua compatibilidade com a versão instalada.
- Nunca criar arquivos CSS específicos por página ou componente. Centralizar estilos e novos tokens em `app/globals.css`; usar somente a paleta do tema, medidas em `rem` e utilitários Tailwind existentes.
- Usar `Image` do Next.js quando houver imagens.
- Preservar alterações locais, schema de domínio e funcionalidades existentes. Não fazer commits nem executar migrações destrutivas.
- Não atualizar Better Auth, Next.js ou Prisma para resolver a tarefa sem necessidade demonstrada.

## Referências visuais

Consultar pelo MCP do Doop o canvas `http://localhost:4400/c/BYeHwktyej`, lendo os frames antes de implementar:

- `8O6aS-3_D5` — 10 · Acesso — Confirmar cadastro.
- `138Xm436fM` — 07 · Acesso — Instruções enviadas.
- `qZiwALqYcu` — 06 · Acesso — Recuperar senha.
- `BJoR6IMDpi` — 08 · Acesso — Redefinir senha.
- `zpclP7dwHh` — 09 · Acesso — Senha alterada.

Reutilizar o painel institucional, o rodapé e a estrutura de autenticação existentes. Adaptar textos que mencionem links para explicar o código e sua validade. Não modificar o canvas como parte desta implementação.

## 1. Conferir APIs e preparar integração

Consultar a documentação oficial e os tipos da versão instalada:

- Better Auth Email OTP: https://www.better-auth.com/docs/plugins/email-otp
- Better Auth com e-mail e senha: https://www.better-auth.com/docs/authentication/email-password
- Resend com Next.js: https://resend.com/docs/send-with-nextjs

Instalar `resend` com npm. Configurar `emailOTP` no servidor e `emailOTPClient` no cliente quando necessário. Manter `nextCookies()` na posição recomendada pela versão instalada.

Configurar a confirmação obrigatória de e-mail para login por senha e impedir a criação automática de sessão antes da confirmação. Após verificar o cadastro, encaminhar ao login com mensagem de sucesso, sem habilitar login sem senha por OTP.

Usar os mecanismos nativos do plugin para gerar, persistir, verificar e consumir os códigos. Conferir os nomes reais dos métodos no pacote instalado antes de escrever as actions. Planejar operações separadas para envio/reenvio, verificação de cadastro, solicitação de recuperação e redefinição de senha.

## 2. Enviar os códigos com Resend

- Criar módulo de envio exclusivo do servidor, com proteção contra importação pelo cliente.
- Documentar `RESEND_API_KEY` e `RESEND_FROM_EMAIL` no arquivo de exemplo de ambiente, preservando as outras variáveis. Nunca incluir credenciais reais ou usar prefixo `NEXT_PUBLIC_`.
- Exigir remetente de domínio verificado para produção. Documentar as restrições do ambiente de testes do Resend.
- Integrar o envio ao callback `sendVerificationOTP`, distinguindo confirmação de e-mail e recuperação de senha.
- Enviar assunto e mensagem em português com finalidade, código, validade e aviso para ignorar caso a solicitação não tenha sido feita pelo destinatário.
- Preferir texto simples inicialmente, evitando arquivos CSS para e-mail e dependências de templates desnecessárias. Não depender de variáveis CSS do navegador para renderizar a mensagem.
- Tratar tanto exceções quanto o campo `error` retornado pelo SDK. Não apresentar envio como concluído quando o provedor recusar a requisição.
- Não expor código, chave, corpo do e-mail ou detalhes internos do provedor em respostas e logs.
- Não criar endpoint público genérico de envio de e-mail.

## 3. Fluxo de confirmação do cadastro

1. Validar e cadastrar com a action existente, mantendo os campos de empresa e aceite de termos.
2. Disparar exatamente um envio inicial de OTP de confirmação. Escolher envio automático pelo plugin ou envio explícito, sem duplicar os dois caminhos.
3. Exibir “Confirme seu cadastro”, com e-mail parcialmente mascarado, campo para seis dígitos, botão “Confirmar cadastro”, opção de reenviar e retorno ao login.
4. Validar o código no servidor pelo Better Auth; somente o mecanismo de verificação pode alterar `emailVerified`.
5. Após confirmação válida, consumir o código e encaminhar ao login com feedback de sucesso.
6. Para login com credenciais válidas de conta não verificada, permitir continuar a confirmação e reenviar o código; não transformar esse caso em simples “senha inválida”.
7. Se a conta for criada e o envio falhar, manter um estado recuperável com opção de tentar o envio novamente. Não exigir recriar a conta nem tentar reverter o cadastro de forma destrutiva.

## 4. Fluxo de recuperação de senha e “Instruções enviadas”

1. “Esqueci minha senha” abre formulário de e-mail com validação no cliente e servidor.
2. Solicitar OTP de recuperação pelo Better Auth e enviar pelo Resend.
3. Exibir “Instruções enviadas” com mensagem neutra: “Se houver uma conta para este e-mail, você receberá um código para redefinir sua senha”. Não revelar existência de conta.
4. Nessa etapa, oferecer código de seis dígitos, reenvio com espera e ação para corrigir o e-mail.
5. Encaminhar à definição de nova senha, com senha e confirmação, mantendo o OTP apenas na memória do fluxo enquanto necessário.
6. A operação final deve validar e consumir o OTP junto com a atualização da senha pelo Better Auth. Uma validação intermediária do código nunca substitui essa verificação final.
7. Exibir “Senha alterada” e retorno ao login. Não autenticar automaticamente após recuperação.
8. Invalidar sessões anteriores na redefinição conforme os recursos da versão instalada; testar o comportamento efetivo, sem presumir que seja automático.

## 5. Estados, navegação e acessibilidade

- Integrar as novas etapas ao controlador em `authentication-screen.tsx`, com tipos explícitos para cada view e propósito do código.
- Separar as seções/formulários em componentes de `app/authentication/_components`; compartilhar a entrada de OTP e a apresentação de reenvio quando fizer sentido.
- Manter a navegação existente para login/cadastro e permitir reiniciar o fluxo após recarregar a página, sem armazenar senhas ou códigos em URL, cookies de cliente, localStorage ou sessionStorage.
- Não usar parâmetro de URL ou estado do cliente como prova de confirmação. O servidor é a fonte de verdade.
- Usar React Hook Form, Zod e next-safe-action para as novas operações, seguindo os padrões locais e repassando os headers necessários ao Better Auth.
- Entrada de código deve suportar colagem, teclado numérico, `autoComplete="one-time-code"`, rótulo acessível e zeros à esquerda. Tratar o código como string.
- Incluir estados de envio, confirmação, erro, código expirado, tentativas excedidas e sucesso; evitar submissões duplicadas.
- Anunciar mensagens para leitores de tela e mover o foco adequadamente nas transições. Não depender exclusivamente de toast ou cor para comunicar erro.

## 6. Proteções e parâmetros iniciais

- Código numérico de seis dígitos; validade de cinco minutos; máximo de três tentativas por código; armazenamento com hash pelo plugin, conforme suporte da versão instalada.
- Reenvio com espera mínima de 60 segundos, fiscalizada no servidor. O contador visual não é controle de segurança.
- Aplicar limites de envio e tentativas por propósito, e-mail normalizado e IP. Confirmar que os limites também cobrem chamadas diretas às APIs do Better Auth e chamadas via server actions.
- Usar armazenamento compartilhado adequado ao ambiente para os limites; não depender apenas de memória de um processo em produção com múltiplas instâncias.
- Garantir que um código de cadastro não redefina senha e vice-versa, e que códigos consumidos ou substituídos por reenvio não sejam reutilizáveis.
- Normalizar o e-mail de maneira consistente com o Better Auth, sem alterar regras de unicidade arbitrariamente.
- Não revelar existência de conta nas respostas de recuperação/reenvio público. Tratar falhas do provedor com mensagens genéricas e sem expor dados internos.
- Se algum parâmetro exigir mecanismo adicional ao plugin, documentar e implementar o controle no servidor; não inventar opções de configuração inexistentes.

## 7. Verificação e critérios de aceite

- Cadastro envia um único código; conta não verificada não recebe sessão nem acessa recursos protegidos.
- OTP correto confirma o e-mail; código incorreto, expirado, consumido, substituído ou de outro propósito é rejeitado.
- Recuperação completa altera a senha; a senha antiga deixa de funcionar e as sessões anteriores são revogadas conforme a política definida.
- Limites de tentativas e reenvio funcionam também ao contornar a interface.
- Falha de envio permite recuperação do fluxo, e solicitações para e-mails inexistentes preservam a resposta neutra.
- Usar mocks do Resend em testes automatizados; nunca disparar mensagens reais repetidamente durante testes. Com credenciais e destinatário de teste disponíveis, realizar uma verificação controlada de entrega.
- Verificar navegação, colagem de OTP, foco, teclado e layout desktop/mobile, sem transbordamento horizontal.
- Executar `npm run lint`, `npx tsc --noEmit`, testes pertinentes de integração e `npm run build`.
- Não criar migração se o schema existente atender ao plugin. Se uma mudança for necessária, explicar o motivo e preservar os dados.
- Entregar resumo dos arquivos alterados, configurações de ambiente necessárias e verificações realizadas. Se faltar chave, domínio, banco ou destinatário autorizado, distinguir claramente testes com mocks de entrega real pendente.

## Fora do escopo

Não implementar login sem senha, MFA, aprovação automática de empresa, gestão de domínio Resend ou alterações no sistema de chamados. O OTP atende apenas à confirmação do e-mail no cadastro e à recuperação de senha.
