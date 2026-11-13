# Dom Cossé – Avios de Mate

## Referência aprovada (12/11/2026)

O novo catálogo público usa páginas e seções conforme as duas referências visuais. O painel `/admin` edita seções, produtos, banner, três destaques, fotos de categorias e textos. Os banners para celular e computador/tablet e as fotos de capa de Cuias e Bombas enviados foram incorporados sem alterar os arquivos originais. A migration `20261112120000_reference_sections.sql` foi aplicada no Supabase conectado em 13/11/2026 e registrada no histórico. O site está publicado em `https://domcosse.com.br`. Consulte [implementação e pendências](docs/referencia-aprovada-2026-11-12.md).

Catálogo público e painel `/admin` em Next.js 16, TypeScript, Tailwind CSS e Supabase. A branch de trabalho é `codex/dom-cosse-catalogo`. Este repositório começou vazio; não havia código, logo nem fotografias reaproveitáveis.

## Uso do painel

Depois de entrar em `/admin`, abra **Produtos**, escolha Cuias ou Bombas e toque em **Adicionar produto nesta seção**. Envie a foto, preencha nome e medida e toque em **Salvar**. As setas mudam a ordem; o lápis permite trocar a foto ou editar os dados. Seções sem produtos publicados ficam visíveis no painel e discretamente ocultas no catálogo público.

Para trocar os destaques, abra **Destaques da loja**, escolha as fotos nos espaços 01, 02 e 03, confira em **Ver como fica** e toque em **Salvar e publicar**. Título e link são opcionais. Em **Banner de capa**, é possível enviar versões para celular e para computador/tablet; em **Fotos das categorias**, trocar as capas de Cuias e Bombas.

## Começar localmente

1. Instale Node.js 20.9 ou mais recente e rode `npm ci`.
2. Copie `.env.example` para `.env.local` e preencha os valores descritos abaixo. Nunca faça commit de `.env.local`.
3. Compare o histórico das migrations e o schema do projeto Supabase correto com `supabase/migrations/`; após revisar o SQL e fazer backup, aplique apenas os arquivos pendentes na ordem necessária.
4. Rode `npm run dev` e abra `http://localhost:3000`.
5. Rode `npm run build` para conferir a compilação. Os testes de interface usam Chrome instalado: `npm run test:e2e`.

## Variáveis de ambiente

Cadastre estas cinco variáveis na Vercel, em Production e Preview conforme o domínio correspondente:

| Variável | Finalidade |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL da API do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do Supabase, protegida por RLS. O nome antigo `NEXT_PUBLIC_SUPABASE_ANON_KEY` continua aceito para compatibilidade. |
| `NEXT_PUBLIC_SITE_URL` | Origem exata do site, por exemplo a URL HTTPS final, sem caminho. Usada para CSRF e callback de recuperação. |
| `UPSTASH_REDIS_REST_URL` | Endpoint REST do Redis para limite distribuído de tentativas. |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST do Redis, somente no servidor. |

São cinco variáveis. Não coloque a chave `sb_secret_...` ou qualquer chave secreta no prefixo `NEXT_PUBLIC_` nem no navegador. O Redis é obrigatório em produção: as operações limitadas falham fechadas se ele não estiver configurado ou estiver indisponível.

`@supabase/server` está instalado para futuras APIs que recebam JWT no cabeçalho `Authorization`. Essas APIs usam `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `SUPABASE_JWKS_URL` no servidor. O painel atual usa sessões em cookies via `@supabase/ssr`; a chave secreta não entra no cliente nem substitui a verificação de sessão e função administrativa.

`DATABASE_URL` (pooler transacional, porta 6543) e `DIRECT_URL` (porta 5432) são opcionais para este aplicativo, que usa a API Supabase. Para conferir o histórico/schema e aplicar migrations com uma ferramenta PostgreSQL, configure `DIRECT_URL` localmente em `.env.local` usando uma das conexões do projeto:

```dotenv
# Conexão direta, quando houver acesso IPv6:
DIRECT_URL=postgresql://postgres:<SENHA_DO_BANCO_CODIFICADA>@db.kbrhhgeavrfwawbinjmm.supabase.co:5432/postgres
# Alternativa pelo pooler de sessão para redes IPv4 (substitua a linha acima, não use as duas):
DIRECT_URL=postgresql://postgres.kbrhhgeavrfwawbinjmm:<SENHA_DO_BANCO_CODIFICADA>@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

O host direto resolve para IPv6 e respondeu na porta 5432 nesta máquina. Copie a string em Supabase Dashboard → Connect; se não souber a senha do banco, redefina-a em Database → Settings. Codifique caracteres especiais para URL. A chave `sb_secret_...` serve à API, não é a senha PostgreSQL. Nunca envie a senha pelo chat. Os exemplos acima são apenas documentação; o `.env.example` mantém `DIRECT_URL` vazio para evitar uma conexão com placeholder.

Os clientes com sessão em cookies estão em `src/lib/supabase/browser.ts` e `src/lib/supabase/server.ts`. No Next.js 16, `src/proxy.ts` renova a sessão com a chave publicável e repassa os cookies atualizados ao servidor e ao navegador; ele também aplica os cabeçalhos de segurança. A página inicial consulta `products`, `categories` e `store_settings` do catálogo, sem usar a tabela de exemplo `todos`.

## Supabase

1. Confirme que selecionou o projeto destinado ao Dom Cossé. Compare `supabase_migrations.schema_migrations` e o schema atual com os arquivos locais. Faça backup e aplique apenas migrations pendentes, na ordem pelo nome. Não cole nem reaplique toda a pasta indiscriminadamente. O schema inclui `products`, `categories`, `store_settings`, `admin_users`, `admin_audit`, policies RLS e o bucket público `product-images` com escrita administrativa. Migrações recentes habilitam Realtime e galeria de fotos.
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

- A marca original foi recortada da foto fornecida, preservando o círculo e tornando transparente somente o exterior; o PNG transparente fica em `public/dom-cosse-logo.png` e é usado no site e no painel. A imagem fonte tem 613 × 399 px.
- O banner isolado enviado pela proprietária está em `public/dom-cosse-banner.png` (2167 × 726 px). Ele já contém o título e a frase; o site não desenha esses textos por cima. O botão continua um controle HTML funcional. Um banner enviado pelo painel substitui essa imagem e usa os textos HTML.
- Os arquivos das fontes originais não vieram nos materiais. `Roboto Condensed` e `Bodoni Moda` são aproximações auto-hospedadas; não foram identificadas como as famílias originais.
- Fotografias de produtos entram pelo painel, sem retoque. O upload reduz o maior lado a 1600 px e converte para WEBP, preservando orientação e enquadramento.
- A navegação pública traz Início, Cuias e Bombas; o contato tem ações de WhatsApp, atendimento a lojistas, Instagram e endereço. “Mensagens” foi removido do painel. “Painel” apresenta contadores e “Categorias” lista Cuias, Bombas e os tipos cadastrados.
- Os tipos de cuia são opções de classificação, não produtos pré-cadastrados. Nenhum nome de produto, preço ou imagem é criado automaticamente. A migration `20261028171610_correct_cuia_alpaca_slugs.sql` corrige slugs antigos em registros existentes sem excluir produtos.
- Produto esgotado mantém o botão Consultar ativo; a mensagem inclui o nome cadastrado. O selo é neutro e ajustável por `.sold-label`.

## Limites da validação atual

O histórico do projeto Supabase está atualizado até `20261112120000_reference_sections.sql`. Após a aplicação, a API pública retornou nove seções, três destaques vazios e zero produtos. A Home e os catálogos passaram nas verificações responsivas. O site foi publicado e o login administrativo, as nove seções vazias, os três controles de destaque e o formulário de senha foram verificados no navegador. O fluxo de câmera, upload e publicação de produtos pela interface autenticada ainda não foi exercitado para preservar o catálogo vazio. O site ainda não foi testado em aparelho físico. A recuperação por e-mail requer SMTP próprio: o envio padrão do Supabase só aceita destinatários que são membros da organização.
