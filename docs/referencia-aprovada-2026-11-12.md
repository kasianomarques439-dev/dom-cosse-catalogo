# Implementação da referência aprovada — 12/11/2026

## Estado local

- Site público em `/`, `/catalogo`, `/catalogo/cuias`, `/catalogo/bombas`, `/nossa-historia` e `/contato`.
- Painel protegido em `/admin`, com seções, produtos, destaques, fotos de categorias e textos/contato.
- `supabase/migrations/20261112120000_reference_sections.sql` foi aplicada no Supabase em 13/11/2026 pelo SQL Editor e registrada em `supabase_migrations.schema_migrations`. O banco agora tem nove seções vazias, três destaques vazios e zero produtos. O e-mail de contato existente foi preservado.
- O código e as imagens foram publicados em `https://domcosse.com.br` em 13/11/2026.

## Decisões assumidas

| Item | Decisão |
| --- | --- |
| Banner e fotos | As duas imagens de banner enviadas são exibidas na capa, uma no celular e outra em computador/tablet. A primeira foto de categoria enviada é de Bombas e a segunda, de Cuias; as quatro foram copiadas sem alterar os arquivos. |
| Logo | O PNG existente foi recortado em CSS para mostrar a marca oval. O arquivo de arte original continua pendente. |
| Seções | Foram pré-cadastradas vazias na ordem do adendo. Seções sem produto publicado ficam ocultas no catálogo. |
| Rodapé | Rótulos curtos seguem a lista do adendo; os de novas seções usam o título sem asteriscos quando o campo fica vazio. |
| WhatsApp | Mensagem inicial: “Olá! Vim pelo site da Dom Cossé e gostaria de fazer um pedido.” No modal de produto, o nome do produto é acrescentado. |
| Produto | Modal discreto com foto ampliada, nome, descrição e pedido pelo WhatsApp. Não há modelo 3D `.glb`; o visualizador 3D real permanece desativado. |
| Desktop | O mesmo desenho mobile é ampliado até 1200 px. Cards de produto usam três colunas em 768 px e quatro em 1024 px. |
| Tipografia | `Roboto Condensed` auto-hospedada para títulos e nomes: dentre Oswald, Barlow Condensed e Anton, a largura dos glifos e a altura se aproximam mais dos mockups. Corpo usa `Nunito Sans`, mais próxima do texto arredondado da referência do que Poppins. |

## Validação executada

- `npm run build` e `npx tsc --noEmit`: passaram.
- `tests/reference-layout.spec.ts`: 12 verificações cobrem a Home e o catálogo em 320, 375, 390, 430, 768, 1024, 1440 e 1920 px, sem transbordamento horizontal; estado vazio; fotos das categorias; história/contato; âncoras; tilt e movimento reduzido. A expectativa de contato passou a usar o endereço configurado no banco.
- `npm run lint`: passou com 14 avisos sobre uso de `<img>`; não há erro de lint. O LCP local ficou abaixo da meta solicitada.
- Login com credenciais inválidas no ambiente local: API respondeu 401. O limite de tentativas usa memória somente em desenvolvimento quando a chave secreta não está disponível; em produção, a indisponibilidade do limitador continua respondendo 503.
- Upload: a rotina Sharp foi exercitada localmente com PNG real e produziu WebP. A rota autenticada de upload não pôde ser testada sem uma sessão administrativa.
- Medição local em Chrome headless, build de produção, viewport 390 × 844: LCP observado 1.360 ms; duração máxima observada no clique do menu 24 ms (aproximação de INP); 61 quadros em um segundo. São números de laboratório local, não métricas de aparelho físico ou tráfego real.

## Diferenças visuais observadas

| Tela | Diferença | Próximo ajuste |
| --- | --- | --- |
| Início | O banner enviado foi incorporado. | Validar no aparelho real. |
| Catálogo | As duas capas enviadas estão nas categorias corretas e mantêm sua proporção. | Validar no aparelho real. |
| Cabeçalho/rodapé | O logo provém de recorte de foto, não do arquivo vetorial ou raster original. | Substituir o asset assim que for fornecido. |
| Painel | Login e permissão administrativa verificados em produção. As sete seções de Cuias, duas de Bombas, três controles de destaque e formulário de senha apareceram corretamente. | Testar o fluxo completo de CRUD/upload/publicação com imagens e produtos reais. |

## Pendências

1. Receber o logo oval original, se houver.
2. Testar com administrador autenticado: troca/publicação de banner, destaques e fotos de categoria, CRUD/ordem/visibilidade de seções e produtos, upload, prévias e reflexo público. Não foram criados produtos de teste para manter o catálogo vazio.
3. Configurar SMTP próprio no Supabase para a recuperação de senha por e-mail. O provedor padrão não entrega para o endereço administrativo, pois ele não é membro da organização.
4. Medir em aparelho real e, se o cliente fornecer modelos `.glb`, avaliar o visualizador 3D opcional.
