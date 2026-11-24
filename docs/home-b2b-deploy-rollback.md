# Publicação e rollback da nova página inicial

## Estado desta entrega

A implementação está na branch `codex/dom-cosse-catalogo`. Build de produção, typecheck e lint passaram; lint reporta 17 avisos de `<img>` no projeto. Playwright: 45/45 testes passaram; os três testes de banner/hotspot também passaram após a otimização dos assets. Lighthouse local em build de produção (sem configuração conectada ao Supabase): Acessibilidade 95, Boas práticas 100 e SEO 100. Performance variou de 88 a 96 em quatro execuções; as três últimas ficaram em 88, com LCP 3,8 s, CLS 0,001 e TBT de 60–70 ms. A meta de performance 90+ não ficou consistente. Não são métricas do domínio publicado.

Não há CLI/autenticação Vercel disponível neste ambiente, não foi possível confirmar backup do Supabase e a versão atual do Next.js recebeu um alerta de segurança durante os comandos. Consulte os [avisos oficiais de segurança do Next.js](https://github.com/vercel/next.js/security/advisories), atualize a dependência e repita as verificações antes de publicar. Não aplique a migração nem publique esta versão antes de concluir essas etapas.

A migração é aditiva: cria configurações novas e a tabela `home_featured_products`; não apaga produtos, categorias, usuários, uploads, nem as rotas antigas. Os itens existentes seguem disponíveis no catálogo e no admin. A home deixa de apontar para o catálogo completo.

## Pré-publicação

1. Atualize o Next.js para a versão de correção indicada pelo comando `next upgrade --agent=security`, em branch/worktree separado; rode novamente lint, typecheck, testes e build.
2. Confirme o último deploy/commit de produção e crie um backup do banco e dos uploads. No Supabase, use backup da plataforma ou exporte banco e Storage; guarde fora deste repositório e verifique que os arquivos podem ser lidos.
3. Abra um pull request da branch `codex/dom-cosse-catalogo`; não envie direto para a branch de produção.
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

   Valide home em 390x844 e 1440x900, WhatsApp, seis destaques, login/admin, uploads, SEO e navegação.
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

As duas imagens anexadas foram otimizadas para WebP, com JPG como fallback. As versões WebP ficam abaixo de 200 KB (mobile) e 350 KB (desktop); o logo da home também usa WebP. O seed tenta reutilizar imagens dos seis produtos nomeados no brief e usa placeholder neutro quando não encontra imagem. Sem conexão de banco nesta sessão, não pude confirmar quais imagens existentes serão reutilizadas; na medição local os seis cartões usam o placeholder. A frase anatômica sobre a origem do nome “Bago de Touro” foi omitida conforme instrução do cliente. Endereço e horário não foram inventados.
