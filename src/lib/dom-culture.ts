export type CultureListItem = { label: string; text: string };
export type CultureBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: CultureListItem[] };
export type CultureTopic = {
  id: 'avios' | 'cuia-bago-de-touro' | 'porongo-ferro' | 'metal-alpaca';
  title: string;
  introduction: string;
  blocks: CultureBlock[];
  position: number;
  is_visible: boolean;
};

export const DEFAULT_CULTURE_CONTENT: CultureTopic[] = [
  {
    id: 'avios', title: 'Avios de Mate', position: 0, is_visible: true,
    introduction: 'Conjunto de utensílios e acessórios usados para preparar, transportar e servir chimarrão ou mate.',
    blocks: [
      { type: 'paragraph', text: 'Os principais itens dos avios de mate são:' },
      { type: 'list', items: [
        { label: 'Cuia', text: 'recipiente tradicionalmente feito de porongo ou cabaça (também há opções em madeira, inox ou vidro), onde se coloca a erva e a água.' },
        { label: 'Bomba', text: 'canudo com filtro na ponta, geralmente de metal ou inox, usado para beber a infusão sem puxar a erva.' },
        { label: 'Garrafa térmica', text: 'mantém a água quente (ou gelada, no caso de tereré) durante o preparo.' },
        { label: 'Mateira', text: 'bolsa ou caixa (de couro, madeira ou tecido) para guardar e transportar os avios.' },
      ] },
    ],
  },
  {
    id: 'cuia-bago-de-touro', title: 'Cuia Bago de Touro', position: 1, is_visible: true,
    introduction: 'Modelo tradicional de cuia para mate, feito de porongo natural, com formato arredondado e sem pé.',
    blocks: [
      { type: 'paragraph', text: 'A Cuia Bago de Touro é um modelo tradicional de cuia para mate, feito de porongo natural, caracterizado pelo formato arredondado e sem pé. Ela leva esse nome por analogia ao formato arredondado das bolsas testiculares de touros.' },
      { type: 'heading', text: 'Principais características' },
      { type: 'list', items: [
        { label: 'Material natural', text: 'produzida em porongo, com variações de cor (clara, avermelhada ou preta) e marcas/cicatrizes naturais que tornam cada peça única.' },
        { label: 'Formato', text: 'sem pé, mais baixa e arredondada, muitas vezes acompanhada de suporte de couro para apoiar em superfícies.' },
        { label: 'Acabamento', text: 'pode vir com virola/bocal de alpaca, níquel ou prata, além de gravações personalizadas.' },
      ] },
    ],
  },
  {
    id: 'porongo-ferro', title: 'Porongo Ferro', position: 2, is_visible: true,
    introduction: 'Porongo de casco firme, curtido de forma orgânica e natural.',
    blocks: [
      { type: 'paragraph', text: 'O Porongo Ferro é uma espécie de planta de braço, da família das abóboras, cultivada em uma região específica do estado do Rio Grande do Sul.' },
      { type: 'paragraph', text: 'Por seu cultivo e manejo, apresenta características da fruta com casco mais resistente e firme, por isso a denominação “Ferro”.' },
      { type: 'paragraph', text: 'Curtido orgânica e naturalmente, não há necessidade de cura, podendo ser usado diretamente sem risco de gosto no mate. É aconselhável somente enxaguar com água corrente antes de cevar seu mate.' },
    ],
  },
  {
    id: 'metal-alpaca', title: 'Metal Alpaca', position: 3, is_visible: true,
    introduction: 'Liga metálica de cobre, níquel e zinco, muito usada em bombas, virolas e bocais. Não contém prata.',
    blocks: [
      { type: 'paragraph', text: 'O metal alpaca (também conhecido como prata alemã ou nickel silver) é uma liga metálica composta principalmente por cobre, níquel e zinco.' },
      { type: 'heading', text: 'Composição e características' },
      { type: 'list', items: [
        { label: 'Composição usual', text: 'cerca de 65% de cobre, 18% de níquel e 17% de zinco.' },
        { label: 'Não contém prata', text: 'apesar da cor prateada e do brilho semelhante, o metal não leva prata em sua fabricação.' },
        { label: 'Propriedades', text: 'é um material dúctil, maleável, resistente à corrosão (graças ao níquel) e que pode ser trabalhado facilmente à temperatura ambiente.' },
        { label: 'Oxidação', text: 'com o tempo e o manuseio, pode desenvolver uma pátina ou alteração natural de tonalidade.' },
      ] },
      { type: 'heading', text: 'Principais aplicações' },
      { type: 'list', items: [
        { label: 'Tradição gaúcha e campeira', text: 'muito utilizada na confecção de bombas, virolas e bocas de cuias de mate, fivelas, arreios, apliques de selaria e apetrechos de montaria.' },
        { label: 'Cutelaria', text: 'em cabos e detalhes de facas artesanais.' },
        { label: 'Instrumentos musicais e relojoaria', text: 'em trastes de instrumentos de corda, componentes estruturais e movimentos de alta relojoaria.' },
        { label: 'Outros usos', text: 'bijuterias, moedas antigas e objetos decorativos.' },
      ] },
    ],
  },
];

export function parseCultureContent(value: unknown): CultureTopic[] | null {
  if (!Array.isArray(value) || value.length !== DEFAULT_CULTURE_CONTENT.length) return null;
  const ids = new Set(DEFAULT_CULTURE_CONTENT.map((topic) => topic.id));
  const topics = value as CultureTopic[];
  if (topics.some((topic) => !topic || !ids.has(topic.id) || typeof topic.title !== 'string' || typeof topic.introduction !== 'string' || !Array.isArray(topic.blocks) || typeof topic.position !== 'number' || typeof topic.is_visible !== 'boolean' || topic.blocks.some((block) => !block || !['paragraph','heading','list'].includes(block.type) || (block.type === 'list' ? !Array.isArray(block.items) || block.items.some((entry) => !entry || typeof entry.label !== 'string' || typeof entry.text !== 'string') : typeof block.text !== 'string')))) return null;
  if (new Set(topics.map(({ id }) => id)).size !== 4 || new Set(topics.map(({ position }) => position)).size !== 4) return null;
  return [...topics].sort((a, b) => a.position - b.position);
}
