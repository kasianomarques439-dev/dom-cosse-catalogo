# Dom Cossé – Avios de Mate

Catálogo público e painel `/admin` em Next.js 16, TypeScript, Tailwind CSS e Supabase. A branch de trabalho é `codex/dom-cosse-catalogo`. Este repositório começou vazio; não havia código, logo nem fotografias reaproveitáveis.

## Começar localmente

1. Instale Node.js 20.9 ou mais recente e rode `npm ci`.
2. Copie `.env.example` para `.env.local` e preencha os valores descritos abaixo. Nunca faça commit de `.env.local`.
3. Aplique todos os arquivos SQL de `supabase/migrations/` em ordem de data no projeto Supabase correto, após revisar o SQL e fazer backup.
4. Rode `npm run dev` e abra `http://localhost:3000`.
5. Rode `npm run build` para conferir a compilação. Os testes de interface usam Chrome instalado: `npm run test:e2e`.

## Variáveis de ambiente

Cadastre estas cinco variáveis na Vercel, em Production e Preview conforme o domínio correspondente:

| Variável | Finalidade |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL da API do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase, protegida por RLS. |
| `NEXT_PUBLIC_SITE_URL` | Origem exata do site, por exemplo a URL HTTPS final, sem caminho. Usada para CSRF e callback de recuperação. |
| `UPSTASH_REDIS_REST_URL` | Endpoint REST do Redis para limite distribuído de tentativas. |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST do Redis, somente no servidor. |

São cinco variáveis. Não há `SUPABASE_SERVICE_ROLE_KEY` no aplicativo. O Redis é obrigatório em produção: as operações limitadas falham fechadas se ele não estiver configurado ou estiver indisponível.

## Supabase

1. Confirme que selecionou o projeto destinado ao Dom Cossé. Faça backup e revise todas as migrations em ordem. Execute o SQL no SQL Editor do Supabase ou com a CLI ligada ao projeto correto. As migrations criam `products` (incluindo o tipo de cuia), `store_settings`, `admin_users`, `admin_audit`, policies RLS e o bucket público `product-images` com escrita administrativa.
2. Em Authentication, habilite e-mail/senha e TOTP. Configure a política de senha mínima de 12 caracteres e proteção contra senhas comprometidas quando disponível. Em URL Configuration, defina o site final e permita apenas `https://SEU-DOMINIO/auth/callback?type=recovery` e o equivalente local durante desenvolvimento.
3. Crie ou convide a conta de administrador pelo Supabase Auth. No SQL Editor, depois de conferir o ID do usuário, vincule a role usando `insert into public.admin_users (user_id) values ('UUID-DO-USUARIO');`. A role é vinculada ao ID imutável, nunca ao e-mail enviado pelo navegador. Evite inserir uma conta equivocada.
4. Entre no `/admin`, configure TOTP e depois preencha WhatsApp e Instagram em Configurações. O WhatsApp deve conter código do país, DDD e número; a URL do Instagram deve apontar para `instagram.com`.
5. Confira no banco, após aplicar: RLS e grants das quatro tabelas, policies do storage, bucket e triggers de auditoria. A migration não é executada automaticamente pelo deploy.

## Vercel e GitHub

1. Conecte o repositório GitHub correto à Vercel. Use a branch de trabalho para Preview; publique em Production após revisão e merge planejado. Nenhum push foi feito para a branch principal.
2. Cadastre as cinco variáveis acima. Em Preview, `NEXT_PUBLIC_SITE_URL` deve apontar para a origem exata do Preview usado nos testes; em Production, para o domínio final. A origem é checada em mutações.
3. Execute o build da Vercel e confirme `/`, `/admin/login` e os cabeçalhos de segurança na resposta HTTPS. Depois valide login, TOTP, foto, CRUD e reflexo no catálogo publicado.
4. Confirme no provedor a entrega de HTTPS/HSTS, backups e restauração, política de senha e MFA.

## Mapa de acesso

| Caminho | Acesso e proteção |
| --- | --- |
| `/` | Leitura pública de `products` e contatos da loja; RLS permite `SELECT`. |
| `/admin` | `requireAdmin()` verifica usuário pelo Supabase Auth, role em `admin_users` e AAL2 em produção antes de renderizar. |
| `/admin/login`, `/admin/recover`, `/admin/reset` | Formulários públicos sem dados administrativos. |
| `/admin/mfa` | Exige sessão e role; permite configurar ou verificar TOTP antes de acessar o painel. |
| `GET /api/products`, `GET /api/settings`, `GET /api/admin/check` | Exigem sessão e role no servidor; retornam cache privado. |
| `POST /api/products`, `PATCH/DELETE /api/products/:id`, `PUT /api/settings`, `POST /api/upload` | Exigem sessão, role e AAL2 em produção, origem permitida, validação de entrada e limite distribuído. RLS confirma autorização no banco. |
| `POST /api/auth/login`, `/api/auth/recovery`, `/api/auth/reset` | Origem permitida, tamanho de corpo limitado e limite distribuído. Recuperação responde sem enumerar contas. |
| `POST /api/auth/logout` | Origem permitida, invalidação de sessão no Supabase. |

As mudanças de produtos e contatos são registradas em `admin_audit` sem conteúdo de formulários. A tabela não é legível pelo navegador. Login/logout ainda não geram eventos nessa tabela. Login e recuperação são limitados por IP fornecido pelo header confiável da Vercel e por hash do identificador; operações autenticadas usam limites por IP e usuário. Se houver proxy externo à frente da Vercel, valide a cadeia de IPs antes de usá-la para limitação.

O cabeçalho CSP usa `style-src 'unsafe-inline'` por causa de estilos inline em componentes React; `script-src` usa nonce. Essa exceção pode ser removida migrando os `style` inline restantes para classes CSS.

## Assets e decisões de interface

- O logo usado agora é tipográfico e provisório. Forneça o arquivo vetorial/PNG original para substituir o componente `.logo` no header, rodapé e painel.
- O hero usa um fundo gráfico provisório; forneça foto própria em tamanho desktop e mobile. Fotografias de produtos entram pelo painel, sem retoque. O upload reduz o maior lado a 1600 px e converte para WEBP, preservando orientação e enquadramento.
- A serifa do wordmark do hero é configurada em `--serif-wordmark`. Os títulos de seções usam Arial em negrito.
- “Sobre Nós” e “Contato” não tinham conteúdo real no repositório vazio. O menu ficou com Início, Cuias e Bombas; contato usa WhatsApp e rodapé. “Mensagens” foi removido do painel. “Painel” apresenta contadores e “Categorias” lista Cuias, Bombas e os oito tipos de cuia configurados.
- Os tipos de cuia são opções de classificação, não produtos pré-cadastrados. Nenhum nome de produto, preço ou imagem é criado automaticamente. A migration `20261027204208_correct_cuia_alpaca_slugs.sql` corrige slugs antigos em registros existentes sem excluir produtos.
- Produto esgotado mantém o botão Consultar ativo; a mensagem inclui o nome cadastrado. O selo é neutro e ajustável por `.sold-label`.

## Limites da validação atual

O build de produção, a auditoria de dependências e os testes de layout no Chrome headless foram executados. Sem acesso ao projeto Supabase certo e sem produtos cadastrados, não foi possível testar CRUD real, câmera, persistência publicada, TOTP conectado nem Lighthouse com ambiente final. Nenhum teste em aparelho físico foi feito. Não trate o sistema como auditado integralmente ou “100% seguro” até revisar deploy, policies aplicadas e fluxos reais.
