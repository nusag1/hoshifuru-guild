'use strict';

// =====================================================================
// ドット絵（すべてオリジナル）
// 16×16 の体に「髪」「アクセサリー」「武器」のパーツを重ねてキャラを作る
// 記号：K 輪郭 / S 肌 / E 目 / m 口 / H 髪 / h 髪の影 / O 服 / o 服の影 / L くつ
//       A アクセント / a アクセントの影 / Y 金 / G 刃 / W 木 / X 宝玉 / M 金属 / n 金属の影 / R リボン
// =====================================================================
const BASE = [
  '................',
  '................',
  '.....KKKKKK.....',
  '....KSSSSSSK....',
  '...KSSSSSSSSK...',
  '...KSSSSSSSSK...',
  '...KSSESSESSK...',
  '...KSSSSSSSSK...',
  '....KSSmmSSK....',
  '.....KKKKKK.....',
  '....KOOOOOOK....',
  '...KSOOOOOOSK...',
  '...KKOOooOOKK...',
  '....KOOOOOOK....',
  '....KLLKKLLK....',
  '....KKK..KKK....',
];

const HAIR = {
  none: {},
  short: {
    2: '.....KKKKKK.....', 3: '....KHHHHHHK....', 4: '...KHHHHHHHHK...', 5: '...KHhHHHHhHK...',
  },
  spiky: {
    1: '....K.K..K.K....', 2: '...KHKHKKHKHK...', 3: '...KHHHHHHHHK...', 4: '...KHHHHHHHHK...', 5: '...KHHhHHhHHK...',
  },
  long: {
    2: '.....KKKKKK.....', 3: '....KHHHHHHK....', 4: '...KHHHHHHHHK...', 5: '..KHHhHHHHhHHK..',
    6: '..KH........HK..', 7: '..KH........HK..', 8: '..KHH......HHK..', 9: '..KHH......HHK..', 10: '...KK......KK...',
  },
  bob: {
    2: '.....KKKKKK.....', 3: '....KHHHHHHK....', 4: '...KHHHHHHHHK...', 5: '..KHHHHHHHHHHK..',
    6: '..KH........HK..', 7: '..KHH......HHK..', 8: '...KK......KK...',
  },
  twin: {
    2: '.....KKKKKK.....', 3: '....KHHHHHHK....', 4: '.KKKHHHHHHHHKKK.', 5: 'KHHKHhHHHHhHKHHK',
    6: 'KHHK........KHHK', 7: 'KHHK........KHHK', 8: '.KHHK......KHHK.', 9: '..KK........KK..',
  },
};

const ACC = {
  none: {},
  wizard: {
    0: '.......KK.......', 1: '......KAAK......', 2: '.....KAAAAK.....', 3: '....KAAAAAAK....',
    4: '..KKYYYYYYYYKK..', 5: '..KAAAAAAAAAAK..',
  },
  crown: { 0: '....K..KK..K....', 1: '....KYKYYKYK....', 2: '....KYYYYYYK....' },
  cat: { 1: '...KK......KK...', 2: '...KHK....KHK...' },
  horns: { 0: '..K..........K..', 1: '..KAK......KAK..', 2: '...KAK....KAK...' },
  hood: {
    2: '.....KKKKKK.....', 3: '....KAAAAAAK....', 4: '...KAAAAAAAAK...', 5: '..KAAaAAAAaAAK..',
    6: '..KA........AK..', 7: '..KA........AK..', 8: '..KAA......AAK..', 9: '...KK......KK...',
  },
  helmet: {
    2: '.....KKKKKK.....', 3: '....KMMMMMMK....', 4: '...KMMMMMMMMK...', 5: '...KnnnnnnnnK...',
    6: '...KM......MK...', 7: '...KM......MK...',
  },
  ribbon: { 1: '..........KK.KK.', 2: '.........KRRKRRK', 3: '..........KKRKK.' },
  flower: { 2: '...........KRK..', 3: '..........KRYRK.', 4: '...........KRK..' },
};

const WEAPON = {
  none: {},
  sword: {
    3: '.............K..', 4: '............KGK.', 5: '............KGK.', 6: '............KGK.',
    7: '............KGK.', 8: '............KGK.', 9: '............KGK.', 10: '...........KYYYK', 11: '............KYK.',
  },
  dagger: { 7: '.............K..', 8: '............KGK.', 9: '............KGK.', 10: '...........KYYYK', 11: '............KYK.' },
  staff: {
    2: '...........KKK..', 3: '..........KXXXK.', 4: '..........KXXXK.', 5: '...........KKK..',
    6: '............KWK.', 7: '............KWK.', 8: '............KWK.', 9: '............KWK.',
    10: '............KWK.', 11: '............KWK.', 12: '............KWK.', 13: '............KWK.', 14: '............KKK.',
  },
  bow: {
    4: '............KK..', 5: '.............KK.', 6: '.............KWK', 7: '.............KWK',
    8: '.............KWK', 9: '.............KWK', 10: '.............KK.', 11: '............KK..',
  },
  spear: {
    0: '.............K..', 1: '............KGK.', 2: '............KGK.', 3: '...........KGGGK',
    4: '............KWK.', 5: '............KWK.', 6: '............KWK.', 7: '............KWK.', 8: '............KWK.',
    9: '............KWK.', 10: '............KWK.', 11: '............KWK.', 12: '............KWK.', 13: '............KKK.',
  },
  shield: {
    9: 'KKKKK...........', 10: 'KAAAK...........', 11: 'KAYAK...........', 12: 'KAAAK...........',
    13: '.KAK............', 14: '..K.............',
  },
  book: { 10: 'KKKKK...........', 11: 'KAYAK...........', 12: 'KAYAK...........', 13: 'KKKKK...........' },
};

// 敵の専用ドット絵
const MONSTER = {
  slime: [
    '................', '................', '................', '................', '................', '................',
    '.....KKKKKK.....', '....KCCCCCCK....', '...KCWWCCCCCK...', '..KCWCCCCCCCCK..', '..KCCKKCCKKCCK..',
    '.KCCCCCCCCCCCCK.', '.KCCCCCmmCCCCCK.', '.KcCCCCCCCCCCcK.', '..KccccccccccK..', '...KKKKKKKKKK...',
  ],
  bat: [
    '................', '................', '................', '................',
    'K..............K', 'KK....K..K....KK', 'KCK...KKKK...KCK', 'KCCK.KCCCCK.KCCK', 'KCCCKCWCCWCKCCCK',
    '.KCCCCCCCCCCCCK.', '..KCCKcCCcKCCK..', '...KK.KccK.KK...', '.......KK.......', '................', '................', '................',
  ],
  golem: [
    '................', '................', '....KKKKKKKK....', '...KCCCCCCCCK...', '...KCXXCCXXCK...', '...KCCCCCCCCK...',
    '.KKKcccccccccKK.', 'KCCKCCCCCCCCKCCK', 'KCCKCCCCCCCCKCCK', 'KCCKCCcCCcCCKCCK', 'KccKCCCCCCCCKccK',
    '.KK.KCCCCCCK.KK.', '....KCCKKCCK....', '...KCCCKKCCCK...', '...KKKKKKKKKK...', '................',
  ],
  ghost: [
    '................', '................', '................', '.....KKKKKK.....', '....KCCCCCCK....', '...KCCCCCCCCK...',
    '...KCKKCCKKCK...', '...KCCCCCCCCK...', '..KCCCCmmCCCCK..', '..KCCCCCCCCCCK..', '..KCCCCCCCCCCK..',
    '..KcCCCCCCCCcK..', '..KccKccKccKcK..', '..KK.KK.KK.KK...', '................', '................',
  ],
};
const SLIME_CROWN = { 3: '.....K.KK.K.....', 4: '.....KYKKYK.....', 5: '.....KYYYYK.....' };

// 色を暗くする（影の色を自動で作る）
function shade(hex, k = 0.72) {
  const n = parseInt(hex.slice(1), 16);
  const c = [16, 8, 0].map(s => Math.round(((n >> s) & 255) * k));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

function makePalette(p) {
  return {
    K: '#2b2340', E: p.eye || '#2b2340', m: '#d9776a', G: '#eef3fb', Y: '#ffcf3f', W: '#9a6a3a',
    M: p.metal || '#c9d3e0', n: shade(p.metal || '#c9d3e0', 0.7), L: p.boots || '#6b4a3a',
    S: p.skin || '#ffd8b5', H: p.hairColor || '#6b4a3a', h: shade(p.hairColor || '#6b4a3a'),
    O: p.outfit || '#4d7cff', o: shade(p.outfit || '#4d7cff'),
    A: p.accent || '#ff6b6b', a: shade(p.accent || '#ff6b6b'), X: p.orb || '#7fe3ff', R: p.ribbon || p.accent || '#ff6b9a',
    C: p.body || '#7be07b', c: shade(p.body || '#7be07b'), W2: '#ffffff',
  };
}

function overlay(grid, layer) {
  for (const [row, str] of Object.entries(layer)) {
    [...str].forEach((ch, x) => { if (ch !== '.') grid[row][x] = ch; });
  }
}

const spriteURLCache = {};
// look: { hair, acc, weapon, ...色 } または { monster, ...色 }
function spriteURL(key, look) {
  if (spriteURLCache[key]) return spriteURLCache[key];
  let grid;
  if (look.monster) {
    grid = MONSTER[look.monster].map(r => [...r]);
    if (look.crown) overlay(grid, SLIME_CROWN);
  } else {
    grid = BASE.map(r => [...r]);
    overlay(grid, HAIR[look.hair || 'short']);
    overlay(grid, ACC[look.acc || 'none']);
    overlay(grid, WEAPON[look.weapon || 'none']);
  }
  const pal = makePalette(look);
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d');
  grid.forEach((row, y) => row.forEach((ch, x) => {
    if (ch === '.') return;
    g.fillStyle = ch === 'W' && look.monster ? '#ffffff' : pal[ch] || '#ff00ff';
    g.fillRect(x, y, 1, 1);
  }));
  return (spriteURLCache[key] = c.toDataURL());
}

// =====================================================================
// ゲームデータ
// =====================================================================
const ELEMENTS = {
  fire: { name: '火', icon: '🔥', strong: 'wind', color: '#ff6b4a' },
  wind: { name: '風', icon: '🍃', strong: 'water', color: '#3cc47c' },
  water: { name: '水', icon: '💧', strong: 'fire', color: '#4d9cff' },
};
const ROLES = {
  attacker: { name: 'アタッカー', hp: 1.0, atk: 1.3, def: 0.9 },
  tank: { name: 'タンク', hp: 1.4, atk: 0.8, def: 1.45 },
  healer: { name: 'ヒーラー', hp: 1.05, atk: 0.95, def: 1.0 },
  support: { name: 'サポート', hp: 1.1, atk: 1.0, def: 1.05 },
};
const RARITY_MULT = [1, 1.25, 1.55];
const MAX_LV = [20, 30, 40];

// スキル： type ごとに効果が決まる
//   strike 敵1体に大ダメージ / sweep 敵全体にダメージ / drain 敵1体にダメージ＋自分回復
//   heal 一番弱っている味方を回復 / healAll 味方全体を回復
//   buffAtk 味方全体の攻撃UP / guardAll 味方全体の防御UP＋自分に敵の攻撃を集める
const CHARS = {
  lumina: {
    name: 'ルミナ', rarity: 3, el: 'fire', role: 'attacker', spd: 15,
    look: { hair: 'long', acc: 'flower', weapon: 'sword' },
    skill: { name: 'ほうき星斬り', type: 'strike', mult: 2.7, cd: 3 },
    lines: ['星の剣士ルミナ、参上！', 'マスター、どんどん進もう！'],
    profile: '流れ星に乗ってやってきた剣士。元気いっぱいで、少しおっちょこちょい。',
  },
  shion: {
    name: 'シオン', rarity: 3, el: 'water', role: 'healer', spd: 13,
    look: { hair: 'long', acc: 'wizard', weapon: 'staff' },
    skill: { name: '星雨のいやし', type: 'healAll', mult: 1.15, cd: 3 },
    lines: ['けがをしたら、すぐ言ってね。', '星の雨は、やさしい魔法なの。'],
    profile: '星の雨を降らせる魔法使い。おっとりしているが、実はギルドで一番の物知り。',
  },
  gald: {
    name: 'ガルド', rarity: 3, el: 'wind', role: 'tank', spd: 9,
    look: { hair: 'short', acc: 'helmet', weapon: 'shield' },
    skill: { name: '大地のかまえ', type: 'guardAll', mult: 1.6, cd: 4 },
    lines: ['オレの後ろにいろ。', 'この盾は、まだ一度も割れたことがない。'],
    profile: '無口な盾の騎士。仲間を守ることにすべてをかけている。甘いものが好き。',
  },
  mike: {
    name: 'ミケ', rarity: 2, el: 'wind', role: 'attacker', spd: 17,
    look: { hair: 'bob', acc: 'cat', weapon: 'dagger' },
    skill: { name: 'つむじ風', type: 'sweep', mult: 1.3, cd: 3 },
    lines: ['にゃっ、お宝の匂いがする！', 'すばやさなら誰にも負けないよ。'],
    profile: '猫の耳をもつ盗賊。すばしっこくて、光るものに目がない。',
  },
  noa: {
    name: 'ノア', rarity: 2, el: 'water', role: 'attacker', spd: 14,
    look: { hair: 'short', acc: 'none', weapon: 'bow' },
    skill: { name: '氷の矢', type: 'strike', mult: 2.2, cd: 3 },
    lines: ['狙った獲物は外さない。', '静かに…気づかれるよ。'],
    profile: '氷の矢を放つ弓使い。クールに見えて、ギルドの動物たちの世話係。',
  },
  bell: {
    name: 'ベル', rarity: 2, el: 'fire', role: 'support', spd: 12,
    look: { hair: 'twin', acc: 'ribbon', weapon: 'book' },
    skill: { name: '勇気の歌', type: 'buffAtk', mult: 1.35, cd: 4 },
    lines: ['みんな、元気出していこー！', '歌えば、こわいものなんてない！'],
    profile: '歌で仲間を元気にする吟遊詩人。ギルドのムードメーカー。',
  },
  yuki: {
    name: 'ユキ', rarity: 2, el: 'water', role: 'tank', spd: 10,
    look: { hair: 'bob', acc: 'hood', weapon: 'shield' },
    skill: { name: '雪のとばり', type: 'guardAll', mult: 1.45, cd: 4 },
    lines: ['……さむくない？', '雪の盾で、守るから。'],
    profile: '雪国から来た無口な守り手。寒がりなのに、氷の魔法が得意。',
  },
  popo: {
    name: 'ポポ', rarity: 1, el: 'wind', role: 'healer', spd: 12,
    look: { hair: 'spiky', acc: 'none', weapon: 'staff' },
    skill: { name: 'おまじない', type: 'heal', mult: 1.8, cd: 2 },
    lines: ['いたいの、とんでけ〜！', 'ぼく、見習いだけどがんばる！'],
    profile: '見習いの癒し手。おまじないの成功率は、だいたい7割。',
  },
  kai: {
    name: 'カイ', rarity: 1, el: 'fire', role: 'attacker', spd: 13,
    look: { hair: 'spiky', acc: 'none', weapon: 'sword' },
    skill: { name: '火花斬り', type: 'strike', mult: 1.9, cd: 3 },
    lines: ['オレが一番乗りだ！', '修行の成果を見せてやる！'],
    profile: '熱血な剣士見習い。ルミナにあこがれて、毎朝素振りをしている。',
  },
  momo: {
    name: 'モモ', rarity: 1, el: 'water', role: 'support', spd: 11,
    look: { hair: 'twin', acc: 'flower', weapon: 'none' },
    skill: { name: 'はげまし', type: 'buffAtk', mult: 1.25, cd: 4 },
    lines: ['ファイトだよ〜！', 'おやつ持ってきたよ！'],
    profile: 'ギルドの食堂の看板娘。応援の声は、敵までちょっと和ませる。',
  },
  jin: {
    name: 'ジン', rarity: 1, el: 'wind', role: 'attacker', spd: 12,
    look: { hair: 'short', acc: 'none', weapon: 'spear' },
    skill: { name: '旋風突き', type: 'sweep', mult: 1.05, cd: 3 },
    lines: ['槍のリーチをなめるなよ。', 'のんびり行こうぜ。'],
    profile: '風のように気ままな槍使い。昼寝の場所探しの名人。',
  },
  toto: {
    name: 'トト', rarity: 1, el: 'fire', role: 'tank', spd: 8,
    look: { hair: 'none', acc: 'horns', weapon: 'shield' },
    skill: { name: 'なべぶたガード', type: 'guardAll', mult: 1.3, cd: 4 },
    lines: ['なべのふたは最強の盾なのだ！', 'お腹すいたのだ…'],
    profile: 'ちいさな角のある見習い。盾がわりの鍋のふたを、いつも大事にしている。',
  },
};

// 見た目の色（キャラごと）。look.hair は髪型、hairColor は髪の色
const LOOKS = {
  lumina: { hairColor: '#ffcf5a', outfit: '#ff6b4a', accent: '#ff9ec2', ribbon: '#ff9ec2', eye: '#c2410c' },
  shion: { hairColor: '#8fc8ff', outfit: '#4d6bd6', accent: '#3a3f8f', orb: '#b8f0ff', eye: '#2a4fa8' },
  gald: { hairColor: '#7a5230', outfit: '#3f8f5a', accent: '#4fbf7a', metal: '#d0d8e4', skin: '#f2c49b' },
  mike: { hairColor: '#ffa94d', outfit: '#4a8f3a', eye: '#2f9e44' },
  noa: { hairColor: '#4a5a8a', outfit: '#3a7ec4', eye: '#1c4f8a' },
  bell: { hairColor: '#ff8fb5', outfit: '#ffb02e', accent: '#c2410c', ribbon: '#ff5a8a' },
  yuki: { hairColor: '#e8f4ff', outfit: '#9cc9ff', accent: '#f4fbff', skin: '#fff0e6' },
  popo: { hairColor: '#8bd17c', outfit: '#d9f5d0', orb: '#9effa8' },
  kai: { hairColor: '#e8442e', outfit: '#9a3a2a' },
  momo: { hairColor: '#ffb3c7', outfit: '#ff8fa8', ribbon: '#fff07a' },
  jin: { hairColor: '#2f8f6a', outfit: '#6fae8a' },
  toto: { skin: '#ffd2a8', outfit: '#b0703a', accent: '#f4e7c8', boots: '#5a3a2a' },
};
for (const [id, c] of Object.entries(CHARS)) Object.assign(c.look, LOOKS[id]);

const ENEMIES = {
  slime_f: { name: 'ほのおスライム', el: 'fire', look: { monster: 'slime', body: '#ff8a5c' }, mod: { hp: 1, atk: 0.9, def: 0.8 }, spd: 9 },
  slime_w: { name: 'みずスライム', el: 'water', look: { monster: 'slime', body: '#6cb8ff' }, mod: { hp: 1, atk: 0.9, def: 0.8 }, spd: 9 },
  slime_g: { name: 'くさスライム', el: 'wind', look: { monster: 'slime', body: '#7be07b' }, mod: { hp: 1, atk: 0.9, def: 0.8 }, spd: 9 },
  bat: { name: 'ヨルコウモリ', el: 'wind', look: { monster: 'bat', body: '#9a6bd6' }, mod: { hp: 0.75, atk: 1.05, def: 0.6 }, spd: 15 },
  goblin: { name: 'ゴブリン', el: 'fire', look: { hair: 'none', acc: 'horns', weapon: 'dagger', skin: '#8ccf6a', outfit: '#8a5a3a', accent: '#f4e7c8', eye: '#c22' }, mod: { hp: 1.1, atk: 1.15, def: 1 }, spd: 11 },
  golem: { name: 'いわゴーレム', el: 'water', look: { monster: 'golem', body: '#a39a8f', orb: '#7fe3ff' }, mod: { hp: 1.8, atk: 1.1, def: 1.6 }, spd: 6 },
  ghost: { name: 'まよいゴースト', el: 'water', look: { monster: 'ghost', body: '#e6ecff' }, mod: { hp: 0.9, atk: 1.25, def: 0.7 }, spd: 12 },
  imp: { name: 'ほしくいインプ', el: 'wind', look: { hair: 'spiky', acc: 'horns', weapon: 'spear', skin: '#b48cff', hairColor: '#3a2a5a', outfit: '#3a2a5a', accent: '#ffcf3f', eye: '#ff3' }, mod: { hp: 1, atk: 1.2, def: 0.9 }, spd: 13 },
  kingslime: { name: 'キングスライム', el: 'water', boss: true, look: { monster: 'slime', body: '#5aa8ff', crown: true }, mod: { hp: 6, atk: 1.4, def: 1.2 }, spd: 8, skill: { name: 'ボディプレス', mult: 1.0 } },
  darkknight: { name: 'やみの騎士', el: 'fire', boss: true, look: { hair: 'none', acc: 'helmet', weapon: 'sword', skin: '#4a3a5a', metal: '#5a4a6a', outfit: '#2b2340', eye: '#ff3b3b' }, mod: { hp: 6.5, atk: 1.55, def: 1.3 }, spd: 12, skill: { name: 'やみの大剣', mult: 1.1 } },
};

const CHAPTERS = [
  {
    id: 1, name: 'はじまりの草原', cost: 4, baseLv: 1,
    pool: ['slime_f', 'slime_w', 'slime_g', 'bat', 'goblin'], boss: 'kingslime',
    story: '星の灯台へ続く草原に、魔物があふれている。まずはここを抜けよう！',
  },
  {
    id: 2, name: 'ほしぞらの洞窟', cost: 6, baseLv: 13,
    pool: ['bat', 'goblin', 'golem', 'ghost', 'imp'], boss: 'darkknight',
    story: '天井に星が光る不思議な洞窟。灯台の鍵を守る「やみの騎士」がいるらしい…',
  },
];

const LOGIN_REWARDS = [
  { gems: 100 }, { gold: 1000 }, { gems: 150 }, { gold: 2000 }, { gems: 200 }, { gold: 3000 }, { gems: 500 },
];

const MISSIONS = [
  { id: 'quest', name: 'クエストを3回クリア', need: 3, gems: 30 },
  { id: 'gacha', name: 'ガチャを1回引く', need: 1, gems: 30 },
  { id: 'levelup', name: 'キャラを1回強化', need: 1, gems: 30 },
];
const MISSION_ALL_BONUS = 50;

const GACHA_RATES = { 3: 0.03, 2: 0.18, 1: 0.79 };
const PITY = 50;
