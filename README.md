# Helpdesk Lab

Sistema de suporte para empresas que reúne solicitações, conversas e acompanhamento de prazos em um só lugar. O portal conecta os colaboradores à equipe de atendimento, com organização por empresa, departamento e nível de suporte: **N1, N2 e N3**.

O projeto inclui um portal do cliente e uma área operacional para gerenciar filas, contratos, políticas de SLA e indicadores. A interface e o servidor fazem parte da mesma aplicação **Next.js**, integrada ao PostgreSQL, Prisma, Better Auth e Resend.

🌐 **Acesso local:** [http://localhost:3000](http://localhost:3000)

🔐 **Entrar ou criar conta:** [http://localhost:3000/authentication](http://localhost:3000/authentication)

📦 **Repositório:** [diogosalvadorb/helpdesk-lab](https://github.com/diogosalvadorb/helpdesk-lab)

O projeto está em desenvolvimento. A URL pública e os provedores de hospedagem ainda não estão documentados no repositório.

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Como instalar e executar](#como-instalar-e-executar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Acesso e dados demonstrativos](#acesso-e-dados-demonstrativos)
- [Comandos disponíveis](#comandos-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Infraestrutura e serviços](#infraestrutura-e-serviços)
- [Limitações atuais](#limitações-atuais)

## Funcionalidades

### 🔐 Autenticação e acesso

- Cadastro, login e confirmação de e-mail com código OTP.
- Recuperação de senha por código enviado por e-mail, com expiração e limite de tentativas.
- Perfis globais de cliente, agente e administrador, além de permissões por empresa.
- Vínculos com empresas e controle de aprovação de acesso.
- Edição de nome, preferências de notificação e alteração de senha com revogação das outras sessões.

### 🎫 Portal do cliente

- Abertura e acompanhamento de chamados por empresa e departamento.
- Conversas com a equipe, respostas e acompanhamento do status.
- Consulta de prazos, contrato e acordo de atendimento.
- Avaliação do atendimento e confirmação de encerramento.
- Base de conhecimento com artigos publicados para o portal.
- Notificações e relatórios conforme o escopo autorizado do usuário.

### 🛠️ Operação e administração

- Visão geral, filas e atribuição de chamados.
- Respostas públicas e notas internas com permissões distintas.
- Escalonamento entre N1, N2 e N3, resolução e reabertura.
- Gestão de empresas, departamentos, equipe de suporte e contratos.
- Políticas de SLA, calendários, horários, feriados e pausas de atendimento.
- Gestão de artigos, rascunhos e publicações da base de conhecimento.
- Configuração de contatos, calendário geral, termos e privacidade.
- Auditoria das ações administrativas suportadas.

### 📊 Indicadores e relatórios

- Volume de chamados, backlog atual, resoluções e escalonamentos.
- Médias e medianas de primeira resposta e resolução, separadas das metas contratuais.
- Cumprimento de SLA e satisfação com identificação da amostra disponível.
- Filtros por período e escopo autorizado, com comparação ao período anterior equivalente.
- Exportação CSV protegida contra fórmulas, limitada a 5.000 chamados e 5 MB.
- Gráficos com alternativa tabular acessível e interface responsiva.

## Tecnologias

| Camada                  | Tecnologias                                           |
| ----------------------- | ----------------------------------------------------- |
| Interface e servidor    | Next.js 16.4.5, React 19 e TypeScript                 |
| Estilos e componentes   | Tailwind CSS 4, shadcn/ui, Base UI e Lucide           |
| Formulários e validação | React Hook Form, Zod e next-safe-action               |
| Autenticação            | Better Auth com plugin de e-mail OTP                  |
| Banco de dados          | PostgreSQL, Prisma 7 e adaptador `@prisma/adapter-pg` |
| E-mails transacionais   | Resend                                                |
| Verificação de código   | ESLint e TypeScript                                   |
| Pacotes                 | npm e `package-lock.json`                             |

## Pré-requisitos

- **Node.js 22.12 ou superior na linha 22.x, ou Node.js 24.x**, compatível com as dependências do projeto.
- **npm 11.19.1**, conforme o campo `packageManager` do `package.json`.
- **PostgreSQL** disponível e um banco dedicado ao desenvolvimento.
- **Git** para clonar o repositório.
- **Conta Resend**, chave de API e remetente autorizado para confirmação e recuperação por e-mail.

## Como instalar e executar

### 1. Clone o repositório

```bash
git clone https://github.com/diogosalvadorb/helpdesk-lab.git
cd helpdesk-lab
```

### 2. Configure o ambiente

Copie `.env.example` para `.env`. No PowerShell:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```bash
cp .env.example .env
```

Preencha as variáveis descritas abaixo. O banco indicado em `DATABASE_URL` deve existir e estar acessível.

### 3. Instale as dependências

```bash
npm ci
```

O projeto utiliza exclusivamente npm, com as versões registradas no `package-lock.json`.

### 4. Prepare o Prisma e o banco local

```bash
npx prisma generate --config prisma7.config.ts
npx prisma db push --config prisma7.config.ts
```

O fluxo adotado utiliza `generate` e `db push`, sem criar a pasta `prisma/migrations`. Não utilize `--accept-data-loss` nem reset para contornar conflitos com dados existentes.

### 5. Inicie o desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Para entrar ou solicitar acesso, abra [a tela de autenticação](http://localhost:3000/authentication).

### 6. Execute uma compilação local de produção

```bash
npm run lint
npm run build
npm run start
```

`npm run start` depende de uma compilação concluída. Esse procedimento inicia a aplicação localmente; não realiza publicação em um provedor.

## Variáveis de ambiente

Exemplo de configuração local, sem credenciais reais:

```dotenv
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/helpdesk
BETTER_AUTH_SECRET=SUBSTITUA_POR_UM_SEGREDO_ALEATORIO_DE_PELO_MENOS_32_CARACTERES
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=SUA_CHAVE_RESEND
RESEND_FROM_EMAIL=Helpdesk Lab <suporte@seu-dominio.com>
AUTH_TRUSTED_IP_HEADER=
```

| Variável                 | Finalidade                                                                    |
| ------------------------ | ----------------------------------------------------------------------------- |
| `DATABASE_URL`           | Conexão com o PostgreSQL utilizada pelo Prisma                                |
| `BETTER_AUTH_SECRET`     | Segredo aleatório da autenticação; não reutilize o texto do exemplo           |
| `BETTER_AUTH_URL`        | URL da aplicação utilizada pelo Better Auth                                   |
| `RESEND_API_KEY`         | Chave de API do provedor de e-mail                                            |
| `RESEND_FROM_EMAIL`      | Remetente autorizado na conta Resend                                          |
| `AUTH_TRUSTED_IP_HEADER` | Opcional; configure somente se um proxy confiável sobrescrever esse cabeçalho |

Para gerar um segredo aleatório localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Sem o cabeçalho de IP configurado, a limitação de solicitações usa um agrupamento conservador para IP desconhecido. Sem o Resend configurado, a confirmação e a recuperação de acesso por e-mail não podem ser concluídas normalmente.

O `.env` e as credenciais locais da seed são ignorados pelo Git. Não publique esses arquivos nem coloque segredos em variáveis `NEXT_PUBLIC_*`.

## Acesso e dados demonstrativos

### Cadastro e permissões

1. Acesse `/authentication` e crie sua conta.
2. Confirme o e-mail com o código recebido.
3. O acesso à empresa depende de um vínculo ativo e das permissões concedidas. Confirmar o e-mail não substitui a aprovação desse vínculo.

| Rota                             | Finalidade                                      |
| -------------------------------- | ----------------------------------------------- |
| `/dashboard`                     | Início do portal do cliente                     |
| `/chamados` e `/chamados/novo`   | Acompanhamento e abertura de solicitações       |
| `/conhecimento` e `/sla`         | Artigos e acordo de atendimento                 |
| `/relatorios` e `/configuracoes` | Indicadores autorizados e preferências da conta |
| `/operacao` e `/operacao/filas`  | Visão geral e atendimento operacional           |
| `/operacao/relatorios`           | Relatórios da operação                          |
| `/operacao/configuracoes`        | Configuração administrativa do workspace        |

A autorização é validada no servidor. Agentes ficam restritos às equipes e aos níveis permitidos; administradores globais selecionam explicitamente o escopo dos relatórios operacionais.

### Seed opcional de desenvolvimento

A seed está em [`prisma/seed.ts`](prisma/seed.ts) e funciona em um banco vazio após o `db push`. Ela cria um administrador de demonstração para quem clonar o repositório, sem exigir cadastro prévio da conta do autor.

```bash
npm run db:seed
```

A execução prepara **17 contas demonstrativas: 1 administrador global, 9 agentes (3 por nível) e 7 clientes**, além de **6 empresas, 18 departamentos, 6 contratos, 22 chamados e 3 artigos**. Ela é destinada ao desenvolvimento e recusa execução com `NODE_ENV=production`.

#### Contas de acesso

| Perfil               | E-mails de demonstração                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Administrador global | `admin@helpdesk.example.test`                                                                  |
| Agentes N1           | `julia@helpdesk.example.test`, `camila@helpdesk.example.test`, `lucas@helpdesk.example.test`   |
| Agentes N2           | `rafael@helpdesk.example.test`, `beatriz@helpdesk.example.test`, `diego@helpdesk.example.test` |
| Agentes N3           | `bruno@helpdesk.example.test`, `renata@helpdesk.example.test`, `felipe@helpdesk.example.test`  |

As senhas geradas para essas contas e para os clientes ficam em `.seed-credentials.local.json`, ignorado pelo Git. Localize o e-mail desejado nesse arquivo e utilize sua senha na [tela de autenticação](http://localhost:3000/authentication). O arquivo registra as senhas iniciais; alterações feitas posteriormente no portal são preservadas e não são regravadas nesse arquivo pela seed. As contas demonstrativas são criadas com e-mail confirmado e podem ser acessadas sem envio de OTP no primeiro login. Seus endereços fictícios não recebem e-mails reais.

As contas de cliente são Mariana, João, Carlos, Patrícia, Roberto, Fernanda e André. Seus e-mails e senhas também estão no arquivo local de credenciais.

#### Empresas de exemplo

| Empresa              | Gestor de demonstração |
| -------------------- | ---------------------- |
| Nexus3D              | Mariana Costa          |
| Grupo Horizonte      | Carlos Oliveira        |
| Aurora Saúde         | Patrícia Gomes         |
| Vale Verde Logística | Roberto Dias           |
| Atlas Educação       | Fernanda Rocha         |
| Orion Comércio       | André Martins          |

Cada empresa possui os departamentos Tecnologia, Administrativo e Financeiro, além de contrato ativo. Os novos exemplos incluem chamados distribuídos entre os três níveis de suporte. O administrador demonstrativo possui vínculo ativo nas seis empresas.

Reexecutar a seed reutiliza os registros demonstrativos e preserva senhas e alterações já existentes. Se a conta principal definida em `masterEmail` já existir, ela também recebe o papel de administrador global, mantendo sua senha e o estado de confirmação do e-mail. Essa conta pessoal não é criada pela seed.

Opcionalmente, `SEED_DEMO_PASSWORD` permite definir a senha inicial das novas contas demonstrativas, com pelo menos 12 caracteres. Essa variável não redefine a senha da conta principal nem as senhas demonstrativas já existentes.

## Comandos disponíveis

| Comando                                          | Descrição                                          |
| ------------------------------------------------ | -------------------------------------------------- |
| `npm ci`                                         | Instala as dependências registradas no lockfile    |
| `npm run dev`                                    | Inicia o desenvolvimento                           |
| `npm run lint`                                   | Executa o ESLint                                   |
| `npm run build`                                  | Gera a compilação de produção e verifica os tipos  |
| `npm run start`                                  | Inicia a compilação de produção existente          |
| `npm run db:seed`                                | Prepara os dados demonstrativos, quando solicitado |
| `npx prisma generate --config prisma7.config.ts` | Gera o cliente Prisma                              |
| `npx prisma db push --config prisma7.config.ts`  | Sincroniza o schema com o banco configurado        |

O `package.json` também declara `npm run sla:evaluate`, mas ele depende de `scripts/evaluate-sla.ts`, ausente neste checkout. A pasta `scripts/` é ignorada pelo Git. Esse comando não deve ser considerado funcional em um clone novo até que o executável seja disponibilizado. A rotina existente está em `data/sla-evaluation.ts`; sua execução periódica exige um agendador externo.

## Estrutura do projeto

```text
app/
  (protected)/          # Rotas autenticadas
    _components/        # Componentes compartilhados do portal
    chamados/
      _components/      # Componentes exclusivos de chamados
    operacao/           # Filas, gestão e relatórios operacionais
  api/                  # API de autenticação e conta
  authentication/       # Login, cadastro e recuperação por OTP
  informacoes/          # Canais e documentos acessíveis sem login
  globals.css           # Estilos e variáveis do tema
actions/                # Server Actions
components/ui/          # Primitivas shadcn/ui
data/                   # Consultas e operações de dados no servidor
lib/                    # Autenticação, validações e regras compartilhadas
prisma/
  schema.prisma         # Modelos do banco
  seed.ts               # Dados demonstrativos de desenvolvimento
prompts/                # Planos de implementação por etapa
prisma7.config.ts       # Configuração do Prisma
```

Componentes exclusivos ficam em `_components` na própria rota. A raiz `app/(protected)/_components/` é reservada ao que é compartilhado entre páginas ou pelo layout. Os estilos ficam em `app/globals.css`, reutilizando os tokens do tema.

## Infraestrutura e serviços

| Componente                    | Serviço ou execução       | Situação no repositório                                                 |
| ----------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| 💻 Interface e servidor       | Aplicação Next.js         | Execução local; hospedagem pública não documentada                      |
| 🗄️ Persistência               | PostgreSQL e Prisma       | Configurada por `DATABASE_URL`; provedor não documentado                |
| 🔐 Autenticação               | Better Auth               | Integrado à aplicação e ao banco                                        |
| ✉️ E-mails                    | Resend                    | Depende de chave e remetente válidos                                    |
| ⏱️ Avaliação periódica de SLA | Agendador externo         | Agendamento pendente; executável do comando não incluído neste checkout |
| 📎 Anexos                     | Armazenamento de arquivos | Configuração e fluxo de armazenamento pendentes                         |
| 🔁 CI/CD                      | Pipeline de publicação    | Nenhum workflow versionado em `.github/workflows` neste checkout        |

## Limitações atuais

- Anexos dependem de armazenamento configurado e de um fluxo de envio seguro.
- Alertas periódicos de SLA não são agendados pela interface.
- Entrega de e-mail depende do Resend; registrar um chamado não garante a entrega de sua confirmação por e-mail.
- Alteração de e-mail não está disponível na tela de perfil, pois requer um fluxo próprio de verificação.
- Contatos, horários gerais, privacidade e termos precisam ser configurados e revisados pela organização. Documentos não aprovados aparecem como pendência editorial.
- Não há reconstrução confiável do backlog histórico nem de desempenho histórico por nível quando faltam eventos antigos. Os relatórios identificam essa indisponibilidade e usam as medições válidas disponíveis.
- O ambiente de desenvolvimento e os dados demonstrativos não representam uma homologação para produção.
