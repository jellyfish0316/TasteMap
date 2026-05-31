// data.jsx — mock content for TasteMap (Taipei, mixed 中文/English)

const PLATFORMS = {
  instagram: { label: 'Instagram', short: 'IG', color: '#d6336c' },
  youtube:   { label: 'YouTube',   short: 'YT', color: '#e11d2a' },
  threads:   { label: 'Threads',   short: 'Th', color: '#1c1d1f' },
  x:         { label: 'X',         short: 'X',  color: '#1c1d1f' },
  maps:      { label: 'Google Maps', short: 'GM', color: '#1a73e8' },
};

// people ───────────────────────────────────────────────
const PEOPLE = {
  me:      { id: 'me',      name: '你', handle: 'you',          color: '#d97706', initial: '你', email: 'you@tastemap.app' },
  kai:     { id: 'kai',     name: '凱開吃', handle: 'kai.eats',  color: '#0e7490', initial: '凱', bio: '台北巷弄美食 · 一週吃五天外食' },
  mochi:   { id: 'mochi',   name: 'Mochi', handle: 'mochi.tw',  color: '#9333ea', initial: 'M',  bio: 'Coffee, cake & quiet corners ☕' },
  hao:     { id: 'hao',     name: '阿豪',  handle: 'haochi.tw',  color: '#15803d', initial: '豪', bio: '老台北人帶路 · 小吃魂' },
  lena:    { id: 'lena',    name: 'Lena',  handle: 'lena.bites', color: '#be123c', initial: 'L',  bio: 'Brunch hunter · 台北⇄東京' },
  jun:     { id: 'jun',     name: '阿俊',  handle: 'jun.noodle', color: '#b45309', initial: '俊', bio: '牛肉麵專門 · 已吃過 200 碗' },
};

// places ───────────────────────────────────────────────
// x,y are normalized 0..1 positions on the stylized map.
const PLACES = {
  ddf:   { id: 'ddf',   name: '鼎旺麻辣鍋',     en: 'Ding Wang Hot Pot',     area: '信義區',  cat: 'utensils', rating: 4.4, reviews: 8210, addr: '台北市信義區松壽路 12 號', x: .63, y: .42 },
  fuhang:{ id: 'fuhang',name: '阜杭豆漿',       en: 'Fu Hang Soy Milk',      area: '中正區',  cat: 'utensils', rating: 4.5, reviews: 19340, addr: '台北市中正區忠孝東路一段 108 號', x: .40, y: .55 },
  yong:  { id: 'yong',  name: '永康牛肉麵',     en: 'Yongkang Beef Noodle',  area: '大安區',  cat: 'utensils', rating: 4.3, reviews: 11280, addr: '台北市大安區金山南路二段 31 巷 17 號', x: .46, y: .66 },
  simple:{ id: 'simple',name: '興波咖啡',       en: 'Simple Kaffa',          area: '大安區',  cat: 'coffee',   rating: 4.6, reviews: 5460,  addr: '台北市大安區忠孝東路三段 251 巷 8 弄 6 號', x: .55, y: .58 },
  chun:  { id: 'chun',  name: '春美咖啡',       en: 'Chun Mei Coffee',       area: '松山區',  cat: 'coffee',   rating: 4.5, reviews: 2130,  addr: '台北市松山區民生東路五段 36 巷 4 弄 3 號', x: .70, y: .30 },
  fujin: { id: 'fujin', name: '富錦樹台菜香檳', en: 'Fujin Tree Taiwanese',  area: '松山區',  cat: 'utensils', rating: 4.4, reviews: 3870,  addr: '台北市松山區敦化北路 199 巷 17 號', x: .66, y: .26 },
  jinfeng:{id: 'jinfeng',name: '金峰魯肉飯',    en: 'Jin Feng Braised Pork', area: '中正區',  cat: 'utensils', rating: 4.2, reviews: 14010, addr: '台北市中正區羅斯福路一段 10 號', x: .38, y: .63 },
  goodcho:{id: 'goodcho',name: '好丘 Good Cho\u2019s', en: 'Good Cho\u2019s',  area: '信義區',  cat: 'bakery',   rating: 4.3, reviews: 6620,  addr: '台北市信義區松勤街 54 號', x: .60, y: .49 },
  lao:   { id: 'lao',   name: '老虎堂黑糖',     en: 'Tiger Sugar',           area: '大安區',  cat: 'drinks',   rating: 4.1, reviews: 9050,  addr: '台北市大安區忠孝東路四段 216 巷', x: .52, y: .61 },
  shan:  { id: 'shan',  name: '山小孩咖啡',     en: 'Mountain Kids Cafe',    area: '文山區',  cat: 'coffee',   rating: 4.7, reviews: 980,   addr: '台北市文山區指南路三段', x: .80, y: .82 },
};

// saved cards (place + a "voice") ──────────────────────
// kind: 'creator' (imported) carries creator{}; everything saved by me also has user{}
let CARDS = [
  { id: 'c1', placeId: 'yong', savedBy: 'me', user: { note: '下雨天必吃，記得避開中午人潮', status: 'want' },
    creator: { author: 'jun.noodle', name: '阿俊', platform: 'youtube', summary: '湯頭濃但不死鹹，肉大塊軟嫩 — 全台北前三。',
      dishes: ['紅燒牛肉麵', '滷牛筋', '小菜拼盤'], quote: '“這碗紅燒，是我心中的天花板。”', src: '02:14 → youtu.be/…', verified: true }, lists: ['l_beef','l_rainy'] },

  { id: 'c2', placeId: 'simple', savedBy: 'me', user: { note: '帶筆電工作 OK，二樓安靜', status: 'visited' },
    creator: { author: 'mochi.tw', name: 'Mochi', platform: 'instagram', summary: '世界冠軍的店。手沖選 Geisha，甜點別錯過。',
      dishes: ['藝伎手沖', '提拉米蘇', 'Flat White'], quote: null, src: 'instagram.com/p/…' }, lists: ['l_coffee'] },

  { id: 'c3', placeId: 'fuhang', savedBy: 'me', user: { note: '', status: 'want' },
    creator: { author: 'haochi.tw', name: '阿豪', platform: 'threads', summary: '六點半就要排，厚餅夾蛋＋鹹豆漿是本體。',
      dishes: ['厚餅夾蛋', '鹹豆漿', '燒餅油條'], quote: '“排一小時，值得。”', src: 'threads.net/@haochi.tw' }, lists: ['l_breakfast'] },

  // saved by people I follow (appear on my map as "circle" pins)
  { id: 'c4', placeId: 'fujin', savedBy: 'lena', user: null,
    creator: { author: 'lena.bites', name: 'Lena', platform: 'instagram', summary: 'Taiwanese small plates + natural wine. Book ahead!',
      dishes: ['菜脯蛋 Daikon omelette', '白斬雞', 'Champagne pairing'], quote: null, src: 'instagram.com/p/…' }, lists: ['l_lena_date'] },

  { id: 'c5', placeId: 'chun', savedBy: 'mochi', user: null,
    creator: { author: 'mochi.tw', name: 'Mochi', platform: 'youtube', summary: '老派喫茶店氛圍，水果千層是招牌。',
      dishes: ['草莓千層', '虹吸式咖啡'], quote: '“時間在這裡走得比較慢。”', src: '05:40 → youtu.be/…' }, lists: ['l_mochi_cake'] },

  { id: 'c6', placeId: 'ddf', savedBy: 'kai', user: null,
    creator: { author: 'kai.eats', name: '凱開吃', platform: 'threads', summary: '麻辣鍋裡的老牌，鴨血豆腐無限續。',
      dishes: ['麻辣鍋', '鴨血豆腐', '手工花枝漿'], quote: null, src: 'threads.net/@kai.eats' }, lists: ['l_kai_hotpot'] },

  { id: 'c7', placeId: 'goodcho', savedBy: 'me', user: { note: '貝果週末早點來，常賣完', status: 'want' },
    creator: { author: 'mochi.tw', name: 'Mochi', platform: 'instagram', summary: '眷村改建的選物＋貝果店，氣氛超好。',
      dishes: ['鹹蛋黃貝果', '司康', '熱可可'], quote: null, src: 'instagram.com/p/…' }, lists: ['l_breakfast','l_coffee'] },
];

// lists / collections ──────────────────────────────────
const LISTS = {
  l_beef:      { id: 'l_beef',      name: '牛肉麵地圖',        owner: 'me',   public: true,  emoji: '🍜', cards: ['c1'] },
  l_coffee:    { id: 'l_coffee',    name: 'Coffee & work',     owner: 'me',   public: true,  emoji: '☕', cards: ['c2','c7'] },
  l_breakfast: { id: 'l_breakfast', name: '台北早餐',          owner: 'me',   public: false, emoji: '🥟', cards: ['c3','c7'] },
  l_rainy:     { id: 'l_rainy',     name: '下雨天想吃',        owner: 'me',   public: false, emoji: '🌧', cards: ['c1'] },
  // followed people's public lists
  l_lena_date: { id: 'l_lena_date', name: 'Date night 台北',   owner: 'lena', public: true,  emoji: '🍷', cards: ['c4'] },
  l_mochi_cake:{ id: 'l_mochi_cake',name: '甜點巡禮',          owner: 'mochi',public: true,  emoji: '🍰', cards: ['c5'] },
  l_kai_hotpot:{ id: 'l_kai_hotpot',name: '火鍋名單',          owner: 'kai',  public: true,  emoji: '🍲', cards: ['c6'] },
};

// who I follow ─────────────────────────────────────────
let FOLLOWING = ['lena', 'mochi', 'kai'];
const ALL_PEOPLE_SEARCH = ['kai', 'mochi', 'hao', 'lena', 'jun'];

// explore feed — public lists from followed people
const FEED = ['l_lena_date', 'l_mochi_cake', 'l_kai_hotpot'];

// import candidates (the review flow) ──────────────────
const IMPORT_SOURCE = { platform: 'instagram', author: 'tpe.foodie', title: '台北東區宵夜 5 選 🌃', url: 'instagram.com/reel/Cz8…' };
const IMPORT_CANDIDATES = [
  { id: 'ic1', match: 'matched', name: '雙月食品社', en: 'Shuang Yue', area: '中正區', rating: 4.4,
    summary: '深夜也能吃到的養生雞湯，麻油雞必點。', dishes: ['麻油雞', '招牌油飯', '燙青菜'], placeId: 'm_sy', x: .42, y: .58 },
  { id: 'ic2', match: 'matched', name: '通化夜市米粉湯', en: 'Tonghua Rice Noodle', area: '大安區', rating: 4.2,
    summary: '夜市口的老攤，黑白切配米粉湯。', dishes: ['米粉湯', '黑白切', '紅燒肉'], placeId: 'm_th', x: .56, y: .68 },
  { id: 'ic3', match: 'needs_review', name: '阿宗麵線（東區店？）', en: 'Ay-Chung (which branch?)', area: '— 需確認分店', rating: null,
    summary: '大腸麵線，創作者沒講是哪一家分店。', dishes: ['大腸麵線'], placeId: null, x: null, y: null },
  { id: 'ic4', match: 'matched', name: '東區粉圓', en: 'Dongqu Fenyuan', area: '大安區', rating: 4.3,
    summary: '剉冰＋手工粉圓，宵夜後的甜點。', dishes: ['綜合粉圓冰', '燒仙草'], placeId: 'm_dq', x: .53, y: .63 },
  { id: 'ic5', match: 'unmatched', name: '“巷子裡那家鹹酥雞”', en: 'unnamed salty chicken', area: '— 找不到地點', rating: null,
    summary: '創作者只說「忠孝敦化 2 號出口走進去」，無店名。', dishes: ['鹹酥雞', '炸魷魚'], placeId: null, x: null, y: null },
];

window.TM_DATA = {
  PLATFORMS, PEOPLE, PLACES, LISTS,
  getCards: () => CARDS,
  setCards: (c) => { CARDS = c; },
  getFollowing: () => FOLLOWING,
  setFollowing: (f) => { FOLLOWING = f; },
  ALL_PEOPLE_SEARCH, FEED,
  IMPORT_SOURCE, IMPORT_CANDIDATES,
};
