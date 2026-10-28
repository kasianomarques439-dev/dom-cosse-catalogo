# Checklist de conformidade e validação

O repositório começou vazio: sem componentes, fotos, logo, dados de produtos ou backend existente. A estrutura foi criada em Next.js 16, React 19, TypeScript, Tailwind e Supabase. Não havia funcionalidade anterior para duplicar.

## Elementos da imagem

| Elemento | Estado | Nota |
| --- | --- | --- |
| Logo circular no header, rodapé e admin | Implementado | A marca original foi recortada da foto fornecida, preservando o círculo e tornando transparente somente o exterior; PNG transparente em `public/dom-cosse-logo.png` usado no site e no painel. A fonte tem 613 × 399 px. |
| Menu Início, Cuias e Bombas | Ajustado pelo Prompt 1 | Os cards e links filtram o catálogo. |
| Sobre Nós / Contato | Implementado no código local | Seção de contato com WhatsApp, atendimento a lojistas, Instagram, endereço e rodapé completo; requer contatos válidos nas configurações. |
| Botão “Fale no WhatsApp” | Implementado, depende de configuração | Só ativa link quando houver número válido salvo em Configurações. |
| Carrinho e lupa no header | Implementados | A lupa leva à busca de produtos e o ícone do carrinho leva ao catálogo; não há checkout. |
| Hero e frases | Implementados | O banner fornecido contém o título, “AVIOS DE MATE” e o slogan. O botão “VER CATÁLOGO” foi posicionado abaixo da frase; “Varejo e lojistas” está no cabeçalho. |
| Foto do hero | Arquivo fornecido e implementado | O banner isolado enviado pela proprietária foi salvo em `public/dom-cosse-banner.png`. O arquivo contém o título e slogan na própria imagem; o CTA é HTML. Capturas locais de 390 e 1440 px confirmam fotografia e texto completos. |
| WhatsApp e Instagram | Implementado, depende de configuração | Atalhos flutuantes no extremo direito, conforme a última referência da proprietária. Os links também aparecem no cabeçalho, na área Contato, nos detalhes e no rodapé. |
| Categorias | Schema aplicado; CRUD real pendente de sessão administrativa | Cuias e Bombas existem no banco; painel permite criar, editar e excluir categorias. O catálogo lê e atualiza a lista via Realtime. |
| Subcategorias de cuias | Migrations aplicadas | Os oito nomes ALPACA aparecem no cadastro, na tela Categorias e no filtro público. `20261028171609_add_cuia_subcategories.sql` e `20261028171610_correct_cuia_alpaca_slugs.sql` foram aplicadas nesta ordem; a segunda corrige registros antigos sem excluí-los. |
| Busca, grade e estado vazio | Implementado | Grade responsiva, skeleton, placeholder sem foto e vazio sem inventar produtos. |
| Card disponível e esgotado | Código implementado | Esgotado tem grayscale suave, selo neutro e consulta WhatsApp ativa. Falta validar com registro no Supabase. |
| Modal do produto e galeria | Implementado no código local | Foto principal e miniaturas da galeria, nome, descrição, preço e disponibilidade; ESC, toque fora, foco preso, retorno ao foco e mensagem de WhatsApp com nome do produto. |
| Sidebar admin e “Mensagens” | Ajustado pelo Prompt 1 | Mensagens removido. Painel mostra contadores; Categorias lista Cuias, Bombas e oito tipos de cuia. |
| Login, recuperação e redefinição | Implementado; ambiente externo pendente | Fluxos via Supabase Auth, resposta genérica de recuperação e senha nova com mínimo de 12 caracteres. As páginas renderizam dinamicamente para receber o nonce da política CSP; o formulário envia a requisição sem recarregar. Login e `/api/admin/check` ainda retornam 503 na Preview por ausência das credenciais Upstash. |
| Cadastro, edição, exclusão e status | Código implementado; sessão do painel pendente | Produtos e categorias passam por sessão, role, origem, validação, limite e RLS. O schema está aplicado. Um registro temporário foi inserido no banco para validar leitura do catálogo e detalhes, depois removido. Insert/update/delete com role administrativa foram confirmados em transações revertidas. O fluxo completo pela interface ainda depende de Upstash e login. |
| Foto principal, galeria e câmera móvel | Código implementado | JPG/PNG/WEBP até 5 MB, redimensiona a 1600 px e converte para WEBP. É possível definir foto principal e remover fotos; em celular, o seletor pode abrir a câmera ou galeria. |
| Atendimento para lojistas | Implementado no código local | Botão na área Contato com mensagem de revenda solicitada; utiliza o WhatsApp cadastrado. |
| Configurações de contato | Schema aplicado | WhatsApp, Instagram, empresa, e-mail e endereço; `20261028171613_store_contact_details.sql` aplicada, gravação pelo painel ainda sem teste de sessão. |
| Dados persistentes e atualização ao vivo | Leitura real verificada; assinatura pendente de teste em duas sessões | Home consulta Supabase e assina Realtime para produtos, categorias e configurações. Um produto temporário apareceu no catálogo conectado e foi removido. |
| Banner editável | Schema aplicado; arquivo padrão disponível | O painel permite enviar, pré-visualizar, substituir e remover o banner; `20261028171751_home_banner.sql` aplicada. Sem personalização, o site usa o banner isolado fornecido. A atualização via Realtime ainda não foi comprovada em duas sessões autenticadas. |
| Projeto Vercel publicado | Produção atualizada | O deployment `dpl_AW6RE9QyXoGAQB7J23Mgk2kPagr1` foi publicado como Production e está disponível em `dom-cosse-catalogo.vercel.app`; o projeto está vinculado ao repositório GitHub correto. O domínio cadastrado `domcosse.com.br` ainda não resolve no DNS observado. URL e chaves públicas do Supabase estão configuradas; os dois valores Upstash ainda faltam. |
| Supabase e migrations | Aplicadas e verificadas | O projeto correto tem as tabelas e migrations esperadas; leituras REST de `categories`, `products` e `store_settings` funcionam e insert anônimo em `products` foi negado por RLS (`42501`). O bucket `product-images` ainda precisa ser criado com credencial administrativa válida para habilitar uploads do painel. |
| Login administrativo | Conta e role vinculadas; proteção externa pendente | A conta informada existe no Supabase Auth com e-mail confirmado e o UID está vinculado a `admin_users`. A origem aceita os endereços oficiais publicados; o login ainda retorna 503 antes de validar a sessão porque os dois valores Upstash estão ausentes. |

## Matriz de viewport

Chrome instalado no computador, execução headless com larguras e alturas CSS via Playwright. Estes resultados verificam layout e rolagem; não equivalem a teste no Chrome DevTools Device Mode nem a um telefone físico.

| Perfil / viewport CSS | Simulação local | Aparelho real |
| --- | --- | --- |
| Android compacto 320×720 | OK, sem rolagem horizontal; alvos visíveis ≥48 px | Não substitui aparelho físico |
| Android compacto 360×640 | OK, mesmas verificações | Não substitui aparelho físico |
| Android compacto 360×800 | OK, mesmas verificações | Não substitui aparelho físico |
| iPhone SE 375×667 | OK, mesmas verificações | Não substitui aparelho físico |
| iPhone 390×844 | OK, mesmas verificações | Não substitui aparelho físico |
| iPhone 393×852 | OK, mesmas verificações | Não substitui aparelho físico |
| Pixel / similares 412×915 | OK, mesmas verificações | Não substitui aparelho físico |
| iPhone Plus / Max 430×932 | OK, mesmas verificações | Não substitui aparelho físico |
| Pixel Pro 448×998 | OK, mesmas verificações | Não substitui aparelho físico |
| Paisagem 915×412 | OK; hero cabe na altura informada | Não substitui aparelho físico |
| Dobrável aberto 600×900 | OK, sem rolagem horizontal | Não substitui aparelho físico |
| Tablet 768×1024 | OK, sem rolagem horizontal | Não substitui aparelho físico |
| Tablet 820×1180 | OK, sem rolagem horizontal | Não substitui aparelho físico |
| Tablet 1024×1366 | OK, sem rolagem horizontal | Não substitui aparelho físico |
| Desktop 1280×800 | OK, sem rolagem horizontal | Não substitui outros navegadores |
| Desktop 1440×900 | OK, sem rolagem horizontal | Não substitui outros navegadores |
| Desktop 1920×1080 | OK, sem rolagem horizontal | Não substitui outros navegadores |

### Cenários

| Cenário | Resultado atual |
| --- | --- |
| Catálogo vazio | OK em todas as viewports. |
| Busca e filtros em vazio | OK. |
| Menu mobile e alvos de toque | OK; controles visíveis ≥48 px. |
| Fonte do sistema ampliada (125%) | OK no viewport 360 px; sem rolagem horizontal. |
| Nome com acentos e símbolos no link WhatsApp | OK no teste de codificação unitário; link final depende do telefone configurado. |
| Mensagens de WhatsApp para cuia, outro produto e lojista | OK em testes unitários de link e codificação; envio real depende do contato configurado. |
| Configuração `@domcosse` do Instagram | OK no teste unitário de normalização. |
| Produto disponível, esgotado, nome/preço longos, sem foto | Pendente no catálogo real até inserir registros de teste com aprovação do proprietário. |
| Cadastro, edição, exclusão, alternância, upload/câmera, Realtime e persistência | Implementação pronta; fluxo autenticado pela interface ainda depende de credenciais Upstash e conta admin disponível para teste. |
| Samsung Internet, Safari iOS e browsers desktop alternativos | Pendente; não executados. |
| Lighthouse mobile e LCP em 4G | Pendente; não executado nesta verificação. |
| Dispositivo Android Pixel ou iPhone real | Pendente; nenhum aparelho real foi testado. |

Na revisão final de 2026-10-28, `npm run build`, `npm run lint` e os 27 testes Playwright passaram. A leitura REST segura confirmou `categories` (2 registros), `products` (0 registros) e `store_settings` (1 registro) no Supabase existente, sem alterações de dados. O deployment de produção foi atualizado e as rotas administrativas passaram a responder corretamente; sem sessão, retornam 401. O painel ainda não pode ser validado de ponta a ponta porque `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` não estão configuradas na Vercel. O domínio `domcosse.com.br` está cadastrado na Vercel, mas não resolveu via DNS durante a verificação. Os testes Playwright simulam navegador, não substituem o fluxo autenticado nem um aparelho físico.
