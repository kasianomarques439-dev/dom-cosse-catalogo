# Publicação e rollback da nova página inicial

## Estado desta entrega

A implementação está em `codex/security-next-16-4-6`, worktree separado do checkout OneDrive. Next.js e `eslint-config-next` foram atualizados de 16.4.3 para 16.4.6; `sharp` foi atualizado para 0.35.5. Build, typecheck e instalação limpa passaram; lint não tem erros e mantém 17 avisos de `<img>`. Playwright: 45/45 passaram. Auditoria de produção: zero vulnerabilidades altas/críticas. Lighthouse local em build de produção: Performance 89, Acessibilidade 95, Boas práticas 100 e SEO 100; LCP 3,8 s, CLS 0,001 e TBT 60 ms. A meta de performance 90+ ainda não foi atingida nesta medição. Não são métricas do domínio publicado.

O navegador mostra a conta da Vercel autenticada, mas não há CLI instalada nem sessão local do CLI. O arquivo `.env.local` do checkout OneDrive não pôde ser lido e não foi possível confirmar backup de banco/Storage; nenhuma migração foi aplicada. A correção está pronta para um preview pela integração Git da Vercel. Não faça merge para a branch de produção antes de confirmar backup, aplicar a migração em preview e validar a URL de preview.

A migração é aditiva: cria configurações novas e a tabela `home_featured_products`; não apaga produtos, categorias, usuários, uploads, nem as rotas antigas. A tabela começa vazia. A home só mostra destaques reais que o proprietário cadastrar, sem seed ou imagem genérica.

## Pré-publicação

1. Atualização de segurança concluída na branch `codex/security-next-16-4-6`; os comandos de verificação estão listados acima.
2. Confirme o último deploy/commit de produção e crie um backup do banco e dos uploads. No Supabase, use backup da plataforma ou exporte banco e Storage; guarde fora deste repositório e verifique que os arquivos podem ser lidos.
3. Abra um pull request de `codex/security-next-16-4-6` para a branch de produção `codex/dom-cosse-catalogo`; não envie direto para a branch de produção.
4. Com o backup confirmado, aplique a migração em staging/preview primeiro:

   ```powershell
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF>
   npx supabase db push
   ```

   Revise a migração apresentada antes de confirmar. Não execute `db push` em produção até o backup estar verificado.
5. Publique o preview pela integração Vercel do projeto ou, após autenticação:

   ```powershell
   npx vercel
   ```

   Valide home em 390x844 e 1440x900, WhatsApp, Instagram, mapa, ausência de cards quando não há destaques, login/admin, uploads, SEO e navegação.
6. Só depois da aprovação e smoke test do preview, faça merge pelo fluxo normal do repositório para disparar produção. Confirme a URL de produção e os fluxos públicos e administrativos.

## Rollback

1. Se o deploy apresentar erro, reverta o deployment na Vercel para o último deployment saudável, ou reverta o merge pelo fluxo normal do Git.
2. A migração não é destrutiva e pode permanecer aplicada durante rollback do código; a versão anterior ignora as novas colunas e tabela. Isso reduz risco e preserva edições feitas nos destaques.
3. Se for necessário remover o schema novo, faça primeiro export/backup da tabela `home_featured_products` e das novas configurações. Em janela de manutenção, restaure a revisão anterior do banco. Remova apenas `home_featured_products`, a função `private.enforce_home_featured_products_limit()` e as colunas `whatsapp_secondary`, `showroom_text`, `home_banner_mobile_url`, `home_banner_desktop_url` e coordenadas `banner_desktop_cta_*`/`banner_mobile_cta_*` depois de confirmar backup e que nenhum código publicado as utiliza.
4. Não restaure um backup inteiro sobre produção sem revisar as gravações posteriores ao backup: isso pode apagar alterações legítimas de produtos, categorias, usuários ou uploads.
5. Registre o deployment e backup usados no rollback. A migração SQL fonte permanece em `supabase/migrations/20261124120000_homepage_b2b.sql`.

## Administração após publicação

- **Destaques da loja:** em Admin → Destaques, adicione ou edite até 10 itens, escolha tipo, imagem, selo, texto, ordem e status. A home mostra os ativos em ordem.
- **Banner de capa:** em Admin → Banner de capa, envie versões mobile e desktop e ajuste a área clicável sobre o botão ilustrado.
- **Textos e contato:** em Admin → Textos e contato, edite história, atendimento e os dois WhatsApps.

## Conteúdo e assets

As imagens de capa anexadas foram otimizadas para WebP, com JPG como fallback; o logo da home também usa WebP. Nenhum destaque fictício ou placeholder é criado. A frase anatômica sobre a origem do nome “Bago de Touro” foi omitida conforme instrução do cliente. O mapa usa o endereço configurado no projeto e não é renderizado sem endereço, cidade e estado.
