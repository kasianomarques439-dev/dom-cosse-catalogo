# Checklist de conformidade e validação

O repositório começou vazio: sem componentes, fotos, logo, dados de produtos ou backend existente. A estrutura foi criada em Next.js 16, React 19, TypeScript, Tailwind e Supabase. Não havia funcionalidade anterior para duplicar.

## Elementos da imagem

| Elemento | Estado | Nota |
| --- | --- | --- |
| Logo circular no header, rodapé e admin | Pendente de asset | Há marca tipográfica circular provisória. Enviar logo original em SVG ou PNG. |
| Menu Início, Cuias e Bombas | Ajustado pelo Prompt 1 | Os cards e links filtram o catálogo. |
| Sobre Nós / Contato no menu | Ajustado pelo Prompt 1 | Repositório vazio sem seções reais; ficou Início, Cuias e Bombas. Contato fica no WhatsApp configurável e rodapé. |
| Botão “Fale no WhatsApp” | Implementado, depende de configuração | Só ativa link quando houver número válido salvo em Configurações. |
| Carrinho e lupa no header | Removidos pelo Prompt 1 | Busca aparece apenas na seção Produtos. Carrinho não foi criado. |
| Hero e frases | Implementado | Título, subtítulo e CTA estão presentes; overlay escuro melhora contraste. |
| Foto do hero | Pendente de asset | Fundo gráfico provisório. Enviar foto original em versão desktop e mobile. |
| Flutuantes WhatsApp e Instagram | Implementado, depende de configuração | Fixos, respeitam safe-area e ficam ocultos sobre a seção de cards para não encobrir consultas. |
| Categorias principais Cuias e Bombas | Implementado | Ícones próprios em SVG, filtro, hover/focus e filtro Todos. |
| Subcategorias de cuias | Implementado no código | Os oito nomes ALPACA aparecem no cadastro, na tela Categorias e no filtro público. Aplique `20261027203739_add_cuia_subcategories.sql` e depois `20261027204208_correct_cuia_alpaca_slugs.sql`; a segunda atualiza registros antigos em vez de apagá-los. |
| Busca, grade e estado vazio | Implementado | Grade responsiva, skeleton, placeholder sem foto e vazio sem inventar produtos. |
| Card disponível e esgotado | Código implementado | Esgotado tem grayscale suave, selo neutro e consulta WhatsApp ativa. Falta validar com registro no Supabase. |
| Modal do produto | Implementado | Foto, nome, descrição, preço; ESC, toque fora, foco preso e botão Voltar quando simples. |
| Sidebar admin e “Mensagens” | Ajustado pelo Prompt 1 | Mensagens removido. Painel mostra contadores; Categorias lista Cuias, Bombas e oito tipos de cuia. |
| Login, recuperação e redefinição | Implementado | Fluxos via Supabase Auth, resposta genérica de recuperação e senha nova com mínimo de 12 caracteres. |
| Cadastro, edição, exclusão e status | Código implementado | Operações protegidas por sessão, role, origem, validação, limite e RLS. Teste end-to-end com banco aguarda configuração. |
| Foto e prévia no cadastro | Implementado | JPG/PNG/WEBP até 5 MB, redimensiona a 1600 px e converte para WEBP. Prévia recolhível. |
| Configurações de contato | Implementado | WhatsApp e URL HTTPS do Instagram; leitura pública limitada a esses contatos. |
| Dados persistentes e atualização do catálogo | Pendente de ativação | Migration entregue, ainda não aplicada pelo proprietário. |

## Matriz de viewport

Chrome instalado no computador, execução headless com larguras e alturas CSS via Playwright. Estes resultados verificam layout e rolagem; não equivalem a teste no Chrome DevTools Device Mode nem a um telefone físico.

| Perfil / viewport CSS | Simulação local | Aparelho real |
| --- | --- | --- |
| Android compacto 320×720 | OK, sem rolagem horizontal; alvos visíveis ≥48 px | Pendente |
| Android compacto 360×640 | OK, mesmas verificações | Pendente |
| Android compacto 360×800 | OK, mesmas verificações | Pendente |
| iPhone SE 375×667 | OK, mesmas verificações | Pendente |
| iPhone 390×844 | OK, mesmas verificações | Pendente |
| iPhone 393×852 | OK, mesmas verificações | Pendente |
| Pixel / similares 412×915 | OK, mesmas verificações | Pendente |
| iPhone Plus / Max 430×932 | OK, mesmas verificações | Pendente |
| Pixel Pro 448×998 | OK, mesmas verificações | Pendente |
| Paisagem 915×412 | OK; hero cabe na altura informada | Pendente |
| Dobrável aberto 600×900 | OK, sem rolagem horizontal | Pendente |
| Tablet 768×1024 | OK, sem rolagem horizontal | Pendente |
| Tablet 820×1180 | OK, sem rolagem horizontal | Pendente |
| Tablet 1024×1366 | OK, sem rolagem horizontal | Pendente |
| Desktop 1280×800 | OK, sem rolagem horizontal | Pendente em outros navegadores |
| Desktop 1440×900 | OK, sem rolagem horizontal | Pendente em outros navegadores |
| Desktop 1920×1080 | OK, sem rolagem horizontal | Pendente em outros navegadores |

### Cenários

| Cenário | Resultado atual |
| --- | --- |
| Catálogo vazio | OK em todas as viewports. |
| Busca e filtros em vazio | OK. |
| Menu mobile e alvos de toque | OK; controles visíveis ≥48 px. |
| Fonte do sistema ampliada (125%) | OK no viewport 360 px; sem rolagem horizontal. |
| Nome com acentos e símbolos no link WhatsApp | OK no teste de codificação unitário; link final depende do telefone configurado. |
| Produto disponível, esgotado, nome/preço longos, sem foto | Pendente no catálogo real até inserir registros de teste com aprovação do proprietário. |
| Cadastro, edição, exclusão, alternância, upload/câmera e persistência | Pendente até aplicar migration, configurar ambiente e criar usuário admin. |
| Samsung Internet, Safari iOS e browsers desktop alternativos | Pendente; não executados. |
| Lighthouse mobile e LCP em 4G | Pendente; sem deployment e sem dados/ambiente de produção. |
| Dispositivo Android Pixel ou iPhone real | Pendente; nenhum aparelho real foi testado. |
