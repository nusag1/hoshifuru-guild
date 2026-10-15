'use strict';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'hoshifuru.save.v1';
const STAMINA_MS = 120000; // 2分で1回復

// =====================================================================
// セーブデータ
// =====================================================================
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function freshSave() {
  return {
    v: 1, rank: 1, exp: 0, stamina: 42, staminaAt: Date.now(),
    gems: 1500, gold: 3000, chars: {}, party: [], cleared: {},
    pity: 0, firstTen: false, totalPulls: 0, introSeen: false,
    login: { last: '', day: 0 },
    daily: { date: '', quest: 0, gacha: 0, levelup: 0, claimed: [] },
    prefs: { se: true, auto: false, speed: 1 },
  };
}

let S;
try { S = Object.assign(freshSave(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch { S = freshSave(); }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} }

// =====================================================================
// 計算
// =====================================================================
function maxStamina() { return 40 + S.rank * 2; }
function expNeed() { return S.rank * 100; }

function tickStamina() {
  const max = maxStamina();
  if (S.stamina >= max) { S.staminaAt = Date.now(); return; }
  const gain = Math.floor((Date.now() - S.staminaAt) / STAMINA_MS);
  if (gain > 0) {
    S.stamina = Math.min(max, S.stamina + gain);
    S.staminaAt += gain * STAMINA_MS;
    if (S.stamina >= max) S.staminaAt = Date.now();
  }
}

function maxLv(id) { const o = S.chars[id]; return MAX_LV[CHARS[id].rarity - 1] + (o ? o.dupe * 5 : 0); }
function levelCost(lv) { return 50 * lv + 50; }

function statsOf(id, lv, dupe) {
  const c = CHARS[id], r = RARITY_MULT[c.rarity - 1], role = ROLES[c.role];
  const grow = 1 + (lv - 1) * 0.07, dup = 1 + dupe * 0.08;
  return {
    hp: Math.round(300 * r * role.hp * grow * dup),
    atk: Math.round(50 * r * role.atk * grow * dup),
    def: Math.round(30 * r * role.def * grow * dup),
    spd: c.spd,
  };
}
function power(id) {
  const o = S.chars[id]; const s = statsOf(id, o.lv, o.dupe);
  return Math.round(s.hp * 0.3 + s.atk * 2 + s.def * 1.5);
}

function skillDesc(sk) {
  const pct = Math.round(sk.mult * 100);
  return {
    strike: `敵1体に攻撃力${pct}%の大ダメージ`,
    sweep: `敵全体に攻撃力${pct}%のダメージ`,
    drain: `敵1体にダメージを与え、半分回復`,
    heal: `一番弱っている味方を攻撃力${pct}%ぶん回復`,
    healAll: `味方全体を攻撃力${pct}%ぶん回復`,
    buffAtk: `味方全体の攻撃力を${pct - 100}%アップ（3ターン）`,
    guardAll: `味方全体の防御力を${pct - 100}%アップ＋敵の攻撃を引きつける（2ターン）`,
  }[sk.type] + `／クールタイム ${sk.cd}`;
}

// =====================================================================
// 画面まわり
// =====================================================================
function img(url, cls = '') { return `<img class="px ${cls}" src="${url}" alt="">`; }
function charImg(id) { return spriteURL('c_' + id, CHARS[id].look); }
function enemyImg(id) { return spriteURL('e_' + id, ENEMIES[id].look); }
function starsText(r) { return '★'.repeat(r); }

let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

function openModal(html, onMount) {
  $('modal-card').innerHTML = html;
  $('modal').hidden = false;
  if (onMount) onMount($('modal-card'));
}
function closeModal() { $('modal').hidden = true; }
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function refreshTop() {
  tickStamina();
  $('tb-rank').textContent = S.rank;
  $('tb-exp').style.width = Math.min(100, S.exp / expNeed() * 100) + '%';
  $('tb-stamina').textContent = `${S.stamina}/${maxStamina()}`;
  if (S.stamina < maxStamina()) {
    const left = STAMINA_MS - (Date.now() - S.staminaAt);
    const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
    $('tb-stamina-next').textContent = `${m}:${String(s).padStart(2, '0')}`;
  } else $('tb-stamina-next').textContent = '';
  $('tb-gems').textContent = S.gems.toLocaleString();
  $('tb-gold').textContent = S.gold.toLocaleString();
}
setInterval(refreshTop, 1000);

let tab = 'home';
function showTab(t) {
  tab = t;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'sc-' + t; });
  $('screens').scrollTop = 0;
  ({ home: renderHome, quest: renderQuest, party: renderParty, gacha: renderGacha })[t]();
  sfx.click();
}
document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

// ----- ホーム -----
function renderHome() {
  const lead = S.party[0];
  if (lead) {
    const c = CHARS[lead];
    $('home-leader').src = charImg(lead);
    $('home-name').textContent = `${starsText(c.rarity)} ${c.name}`;
    $('home-line').textContent = c.lines[Math.floor(Math.random() * c.lines.length)];
  } else {
    $('home-leader').src = spriteURL('guide', { hair: 'long', acc: 'wizard', weapon: 'staff', hairColor: '#c9b8ff', outfit: '#6a4fd6', accent: '#2b2340' });
    $('home-name').textContent = '案内人 ステラ';
    $('home-line').textContent = 'まずは「ガチャ」で仲間を呼んでみよう！';
  }
  $('badge-missions').hidden = !missionClaimable();
}
$('home-leader').addEventListener('click', () => { if (S.party[0]) { renderHome(); sfx.click(); } });
$('btn-go-quest').addEventListener('click', () => showTab('quest'));
$('btn-login').addEventListener('click', () => showLogin(false));
$('btn-missions').addEventListener('click', showMissions);
$('btn-story').addEventListener('click', showIntro);
$('btn-settings').addEventListener('click', showSettings);

function showIntro() {
  openModal(`
    <h2>🌟 ほしふるギルド</h2>
    <p>星がふる夜にだけ開く、ふしぎなギルド。<br>あなたは今日から、ここの<b>ギルドマスター</b>です。</p>
    <p>魔物たちが「星の灯台」をうばってしまい、夜空から光が消えかけています。</p>
    <p>空からふってくる<b>星のかけら</b>で仲間を呼び、灯台を取りもどしましょう！</p>
    <button class="btn" id="intro-ok">はじめる</button>`, card => {
    card.querySelector('#intro-ok').onclick = () => {
      closeModal();
      if (!S.introSeen) {
        S.introSeen = true; save();
        showTab('gacha');
        toast('最初の10連は★3確定！');
      }
    };
  });
}

function showSettings() {
  openModal(`
    <h2>設定</h2>
    <button class="btn gray" id="set-se">効果音：${S.prefs.se ? 'ON' : 'OFF'}</button>
    <button class="btn gray" id="set-reset">データを最初からやり直す</button>
    <p class="sub">データはこの端末のブラウザに保存されています。ブラウザのデータを消すと、セーブも消えます。</p>
    <button class="btn" id="set-close">とじる</button>`, card => {
    card.querySelector('#set-se').onclick = () => { S.prefs.se = !S.prefs.se; save(); showSettings(); };
    card.querySelector('#set-close').onclick = closeModal;
    card.querySelector('#set-reset').onclick = () => {
      openModal(`<h2>本当にやり直す？</h2><p>キャラ・かけら・進み具合がすべて消えます。元には戻せません。</p>
        <div class="row"><button class="btn gray" id="r-no">やめる</button><button class="btn" id="r-yes">消してやり直す</button></div>`, c2 => {
        c2.querySelector('#r-no').onclick = closeModal;
        c2.querySelector('#r-yes').onclick = () => { S = freshSave(); save(); closeModal(); boot(); };
      });
    };
  });
}

// ----- ログインボーナス -----
function showLogin(auto) {
  const t = today();
  const canClaim = S.login.last !== t;
  const nextDay = canClaim ? (S.login.day % 7) + 1 : S.login.day;
  const cells = LOGIN_REWARDS.map((r, i) => {
    const d = i + 1;
    const got = canClaim ? d < nextDay : d <= S.login.day;
    const cls = [d === 7 ? 'd7' : '', got ? 'got' : '', canClaim && d === nextDay ? 'today' : ''].join(' ');
    return `<div class="${cls}">${d}日目<b>${r.gems ? '🌟' + r.gems : '🪙' + r.gold}</b></div>`;
  }).join('');
  openModal(`
    <h2>📅 ログインボーナス</h2>
    <div class="login-grid">${cells}</div>
    ${canClaim ? '<button class="btn gold" id="lg-claim">受け取る</button>' : '<p class="sub">今日はもう受け取ったよ。また明日！</p><button class="btn gray" id="lg-close">とじる</button>'}`, card => {
    const claim = card.querySelector('#lg-claim');
    if (claim) claim.onclick = () => {
      const r = LOGIN_REWARDS[nextDay - 1];
      S.gems += r.gems || 0; S.gold += r.gold || 0;
      S.login = { last: t, day: nextDay };
      save(); refreshTop(); sfx.get();
      toast(`${r.gems ? '🌟' + r.gems : '🪙' + r.gold} を受け取った！`);
      closeModal();
    };
    const c = card.querySelector('#lg-close');
    if (c) c.onclick = closeModal;
  });
}

// ----- デイリーミッション -----
function resetDailyIfNeeded() {
  if (S.daily.date !== today()) S.daily = { date: today(), quest: 0, gacha: 0, levelup: 0, claimed: [] };
}
function missionClaimable() {
  resetDailyIfNeeded();
  const done = MISSIONS.filter(m => S.daily[m.id] >= m.need);
  if (done.some(m => !S.daily.claimed.includes(m.id))) return true;
  return done.length === MISSIONS.length && !S.daily.claimed.includes('all');
}
function bumpMission(id, n = 1) { resetDailyIfNeeded(); S.daily[id] = (S.daily[id] || 0) + n; save(); }

function showMissions() {
  resetDailyIfNeeded();
  const rows = MISSIONS.map(m => {
    const v = Math.min(S.daily[m.id], m.need);
    const claimed = S.daily.claimed.includes(m.id);
    return `<div class="mission"><div class="mi">${m.name}<div class="prog">${v} / ${m.need}　報酬 🌟${m.gems}</div></div>
      <button data-m="${m.id}" ${v < m.need || claimed ? 'disabled' : ''}>${claimed ? '受取済' : '受け取る'}</button></div>`;
  }).join('');
  const allDone = MISSIONS.every(m => S.daily.claimed.includes(m.id));
  const allClaimed = S.daily.claimed.includes('all');
  openModal(`
    <h2>📜 デイリーミッション</h2>${rows}
    <div class="mission"><div class="mi"><b>全部達成ボーナス</b><div class="prog">報酬 🌟${MISSION_ALL_BONUS}</div></div>
      <button data-m="all" ${!allDone || allClaimed ? 'disabled' : ''}>${allClaimed ? '受取済' : '受け取る'}</button></div>
    <p class="sub">毎日0時にリセットされます</p>
    <button class="btn gray" id="ms-close">とじる</button>`, card => {
    card.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      const id = b.dataset.m;
      const reward = id === 'all' ? MISSION_ALL_BONUS : MISSIONS.find(m => m.id === id).gems;
      S.gems += reward; S.daily.claimed.push(id);
      save(); refreshTop(); sfx.get(); toast(`🌟${reward} を受け取った！`);
      showMissions(); renderHome();
    });
    card.querySelector('#ms-close').onclick = closeModal;
  });
}

// ----- クエスト一覧 -----
function stageId(ch, i) { return `${ch}-${i}`; }
function chapterUnlocked(ch) { return ch === 1 || S.cleared[stageId(ch - 1, 10)]; }
function stageUnlocked(ch, i) { return chapterUnlocked(ch) && (i === 1 || S.cleared[stageId(ch, i - 1)]); }

function renderQuest() {
  $('chapter-list').innerHTML = CHAPTERS.map(ch => {
    const open = chapterUnlocked(ch.id);
    let stages = '';
    if (open) {
      for (let i = 1; i <= 10; i++) {
        const id = stageId(ch.id, i);
        const boss = i === 10;
        const lv = ch.baseLv + i - 1 + (boss ? 2 : 0);
        stages += `<button class="stage ${boss ? 'boss' : ''} ${S.cleared[id] ? 'clear' : ''}" data-ch="${ch.id}" data-i="${i}" ${stageUnlocked(ch.id, i) ? '' : 'disabled'}>
          <span class="no">${id}</span>
          <span class="info"><b>${boss ? '👑 ' + ENEMIES[ch.boss].name : ['草むらの魔物', '道ばたの戦い', 'あやしい気配', '群れとの遭遇'][i % 4]}</b>推奨 Lv${lv}　${S.cleared[id] ? '' : '初回 🌟' + (boss ? 150 : 50)}</span>
          <span class="cost">⚡${ch.cost}</span></button>`;
      }
    }
    return `<div class="chapter ${open ? '' : 'locked'}"><h3>第${ch.id}章 ${ch.name}</h3>
      <p>${open ? ch.story : '🔒 前の章のボスを倒すと開放'}</p>${stages}</div>`;
  }).join('') + '<div class="chapter locked"><h3>第3章 ？？？</h3><p>🔒 coming soon…</p></div>';
  document.querySelectorAll('.stage').forEach(b => b.addEventListener('click', () => confirmStage(+b.dataset.ch, +b.dataset.i)));
}

function confirmStage(ch, i) {
  const chap = CHAPTERS[ch - 1];
  if (!S.party.length) { toast('先に編成でパーティを組もう'); showTab('party'); return; }
  tickStamina();
  const party = S.party.map(id => `<div>${img(charImg(id))}<div class="sub">Lv${S.chars[id].lv}</div></div>`).join('');
  openModal(`
    <h2>${stageId(ch, i)}${i === 10 ? ' 👑ボス' : ''}</h2>
    <p class="sub">${chap.name}</p>
    <div style="display:flex;justify-content:center;gap:6px;margin:8px 0">${party.replace(/<img/g, '<img style="width:64px;height:64px"')}</div>
    <p>スタミナ ⚡${chap.cost} を使います（いま ${S.stamina}）</p>
    <div class="row"><button class="btn gray" id="st-no">やめる</button><button class="btn" id="st-go" ${S.stamina < chap.cost ? 'disabled' : ''}>出発！</button></div>
    ${S.stamina < chap.cost ? '<p class="sub">スタミナが足りません。少し待つか、ランクアップで全回復！</p>' : ''}`, card => {
    card.querySelector('#st-no').onclick = closeModal;
    card.querySelector('#st-go').onclick = () => {
      S.stamina -= chap.cost;
      if (S.stamina < maxStamina() && S.stamina + chap.cost >= maxStamina()) S.staminaAt = Date.now();
      save(); closeModal(); startBattle(ch, i);
    };
  });
}

// ----- 編成 -----
let sortMode = 'rarity';
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
  sortMode = c.dataset.sort;
  document.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c));
  renderParty();
}));

function ownedIds() {
  const ids = Object.keys(S.chars);
  const elOrder = { fire: 0, wind: 1, water: 2 };
  return ids.sort((a, b) => {
    if (sortMode === 'level') return S.chars[b].lv - S.chars[a].lv || CHARS[b].rarity - CHARS[a].rarity;
    if (sortMode === 'el') return elOrder[CHARS[a].el] - elOrder[CHARS[b].el] || CHARS[b].rarity - CHARS[a].rarity;
    return CHARS[b].rarity - CHARS[a].rarity || S.chars[b].lv - S.chars[a].lv;
  });
}

function renderParty() {
  $('party-slots').innerHTML = [0, 1, 2].map(i => {
    const id = S.party[i];
    if (!id) return `<div class="slot">＋<br>空き</div>`;
    const c = CHARS[id];
    return `<div class="slot filled" data-id="${id}">${i === 0 ? '<span class="lead">リーダー</span>' : ''}${img(charImg(id))}
      <b style="font-size:12px">${c.name}</b><span class="stars-r">${starsText(c.rarity)}</span><span style="font-size:10px">Lv${S.chars[id].lv}</span></div>`;
  }).join('');
  const ids = ownedIds();
  $('char-grid').innerHTML = ids.length ? ids.map(id => {
    const c = CHARS[id];
    return `<button class="ccard r${c.rarity}" data-id="${id}"><span class="el">${ELEMENTS[c.el].icon}</span>
      ${S.party.includes(id) ? '<span class="inparty">編成中</span>' : ''}${img(charImg(id))}
      <span class="nm">${c.name}</span><span class="stars-r">${starsText(c.rarity)}</span><span class="lv">Lv${S.chars[id].lv}</span></button>`;
  }).join('') : '<p class="hint" style="grid-column:1/-1">まだ仲間がいません。ガチャで呼んでみよう！</p>';
  document.querySelectorAll('#char-grid .ccard, #party-slots .slot.filled').forEach(el => el.addEventListener('click', () => showChar(el.dataset.id)));
}

function showChar(id) {
  const c = CHARS[id], o = S.chars[id];
  const st = statsOf(id, o.lv, o.dupe);
  const cap = maxLv(id);
  const cost = levelCost(o.lv);
  // 「最大まで」で上げられるレベル数
  let n = 0, total = 0;
  while (o.lv + n < cap && total + levelCost(o.lv + n) <= S.gold) { total += levelCost(o.lv + n); n++; }
  const inParty = S.party.includes(id);
  openModal(`
    <div class="detail-top">${img(charImg(id))}
      <div><div class="stars-r" style="font-size:14px">${starsText(c.rarity)}</div><div class="nm">${c.name}</div>
      <div class="tags"><span class="tag">${ELEMENTS[c.el].icon} ${ELEMENTS[c.el].name}</span><span class="tag">${ROLES[c.role].name}</span>
      <span class="tag">限界突破 ${o.dupe}/4</span></div></div></div>
    <div class="statgrid">
      <div>Lv<b>${o.lv} / ${cap}</b></div><div>HP<b>${st.hp}</b></div>
      <div>攻撃<b>${st.atk}</b></div><div>防御<b>${st.def}</b></div>
      <div>素早さ<b>${st.spd}</b></div><div>戦力<b>${power(id)}</b></div>
    </div>
    <div class="skillbox"><b>✨ ${c.skill.name}</b>${skillDesc(c.skill)}</div>
    <p class="profile">${c.profile}</p>
    <div class="row">
      <button class="btn gold" id="ch-lv1" ${o.lv >= cap || S.gold < cost ? 'disabled' : ''}>Lv+1<br><small>🪙${o.lv >= cap ? '-' : cost}</small></button>
      <button class="btn gold" id="ch-lvmax" ${n < 2 ? 'disabled' : ''}>${n >= 2 ? `Lv+${n}` : 'まとめて'}<br><small>${n >= 2 ? '🪙' + total : 'ゴールド不足'}</small></button>
    </div>
    <div class="row">
      <button class="btn ${inParty ? 'gray' : ''}" id="ch-party">${inParty ? '編成から外す' : '編成に入れる'}</button>
      ${inParty && S.party[0] !== id ? '<button class="btn gray" id="ch-lead">リーダーにする</button>' : ''}
    </div>
    <button class="btn gray" id="ch-close" style="margin-top:8px">とじる</button>`, card => {
    const lvUp = k => {
      let spent = 0;
      for (let j = 0; j < k; j++) { spent += levelCost(o.lv); o.lv++; }
      S.gold -= spent;
      bumpMission('levelup');
      save(); refreshTop(); sfx.levelup();
      toast(`${c.name} が Lv${o.lv} になった！`);
      showChar(id); renderParty();
    };
    card.querySelector('#ch-lv1').onclick = () => lvUp(1);
    card.querySelector('#ch-lvmax').onclick = () => lvUp(n);
    card.querySelector('#ch-party').onclick = () => {
      if (inParty) {
        if (S.party.length === 1) { toast('パーティには1人以上必要です'); return; }
        S.party = S.party.filter(x => x !== id);
      } else {
        if (S.party.length >= 3) { toast('パーティは3人まで。誰かを外してね'); return; }
        S.party.push(id);
      }
      save(); sfx.click(); showChar(id); renderParty();
    };
    const lead = card.querySelector('#ch-lead');
    if (lead) lead.onclick = () => { S.party = [id, ...S.party.filter(x => x !== id)]; save(); sfx.click(); showChar(id); renderParty(); };
    card.querySelector('#ch-close').onclick = closeModal;
  });
}

// ----- ガチャ -----
function renderGacha() {
  $('feat-1').src = charImg('shion'); $('feat-2').src = charImg('lumina'); $('feat-3').src = charImg('gald');
  $('pity-text').textContent = `天井まで あと ${PITY - S.pity} 回（${PITY}回で★3確定）`;
  $('btn-pull1').disabled = S.gems < 100;
  $('btn-pull10').disabled = S.gems < 1000;
  $('ten-note').textContent = S.firstTen ? '★2以上1体保証' : '初回限定！★3確定';
}
$('btn-pull1').addEventListener('click', () => pull(1));
$('btn-pull10').addEventListener('click', () => pull(10));
$('btn-rates').addEventListener('click', () => {
  const list = r => Object.entries(CHARS).filter(([, c]) => c.rarity === r).map(([, c]) => c.name).join('・');
  const n = r => Object.values(CHARS).filter(c => c.rarity === r).length;
  openModal(`<h2>提供割合</h2>
    <p style="text-align:left;font-size:13px">
    <b>★3：3%</b>（各 ${(3 / n(3)).toFixed(2)}%）<br>${list(3)}<br><br>
    <b>★2：18%</b>（各 ${(18 / n(2)).toFixed(2)}%）<br>${list(2)}<br><br>
    <b>★1：79%</b>（各 ${(79 / n(1)).toFixed(2)}%）<br>${list(1)}</p>
    <p class="sub" style="text-align:left">・10連は10体目が★2以上確定<br>・${PITY}回★3が出なければ、次は★3確定（天井）<br>・初めての10連は★3が1体確定<br>・ガチャはゲーム内の「星のかけら」だけで引けます。現実のお金は使いません</p>
    <button class="btn gray" id="rt-close">とじる</button>`, card => { card.querySelector('#rt-close').onclick = closeModal; });
});

function rollRarity(minR) {
  if (S.pity >= PITY - 1) return 3;
  const r = Math.random();
  let rar = r < GACHA_RATES[3] ? 3 : r < GACHA_RATES[3] + GACHA_RATES[2] ? 2 : 1;
  return Math.max(rar, minR);
}
function pickChar(rarity) {
  const ids = Object.keys(CHARS).filter(id => CHARS[id].rarity === rarity);
  return ids[Math.floor(Math.random() * ids.length)];
}

function pull(n) {
  const cost = n * 100;
  if (S.gems < cost) { toast('星のかけらが足りません'); return; }
  S.gems -= cost;
  const results = [];
  const guaranteeThree = n === 10 && !S.firstTen;
  for (let i = 0; i < n; i++) {
    let rar = rollRarity(n === 10 && i === n - 1 ? 2 : 1);
    if (guaranteeThree && i === n - 1 && !results.some(r => r.rar === 3)) rar = 3;
    S.pity = rar === 3 ? 0 : S.pity + 1;
    const id = pickChar(rar);
    const isNew = !S.chars[id];
    let dupNote = '';
    if (isNew) S.chars[id] = { lv: 1, dupe: 0 };
    else if (S.chars[id].dupe < 4) { S.chars[id].dupe++; dupNote = '限界突破'; }
    else { S.gold += 500 * rar; dupNote = '🪙'; }
    results.push({ id, rar, isNew, dupNote });
  }
  if (n === 10) S.firstTen = true;
  S.totalPulls += n;
  // パーティが空なら、強い順に自動で編成
  if (S.party.length < 3) {
    const best = Object.keys(S.chars).filter(id => !S.party.includes(id)).sort((a, b) => power(b) - power(a));
    while (S.party.length < 3 && best.length) S.party.push(best.shift());
  }
  bumpMission('gacha');
  save(); refreshTop();
  playSummon(results);
}

function playSummon(results) {
  const top = Math.max(...results.map(r => r.rar));
  const el = document.createElement('div');
  el.className = 'summon';
  el.style.setProperty('--orb', top === 3 ? '#ffcf3f' : top === 2 ? '#9cc4ff' : '#e8c9a8');
  el.innerHTML = `<div class="orb"></div><div class="msg">${top === 3 ? '✦ 虹色の星が… ✦' : '星がふってくる…'}</div>`;
  document.body.appendChild(el);
  sfx.summon(top);
  const finish = () => {
    el.remove();
    const cards = results.map((r, i) => `<div class="rcard r${r.rar}" style="animation-delay:${i * 0.06}s">
      ${r.isNew ? '<span class="new">NEW</span>' : r.dupNote ? `<span class="dup">${r.dupNote}</span>` : ''}
      ${img(charImg(r.id))}<div class="stars-r">${starsText(r.rar)}</div><div class="nm">${CHARS[r.id].name}</div></div>`).join('');
    openModal(`<h2>召喚結果</h2><div class="results ${results.length === 1 ? 'single' : ''}">${cards}</div>
      <p class="sub">同じキャラは「限界突破」でパワーアップ！</p>
      <div class="row"><button class="btn gray" id="gr-party">編成を見る</button><button class="btn" id="gr-ok">OK</button></div>`, card => {
      card.querySelector('#gr-ok').onclick = () => { closeModal(); renderGacha(); };
      card.querySelector('#gr-party').onclick = () => { closeModal(); showTab('party'); };
    });
    if (top === 3) sfx.rare();
  };
  setTimeout(finish, 1400);
  el.addEventListener('click', finish, { once: true });
}

// =====================================================================
// バトル
// =====================================================================
let B = null;
const wait = ms => new Promise(r => setTimeout(r, ms / (S.prefs.speed || 1)));

function makeEnemy(key, lv) {
  const e = ENEMIES[key];
  const g = 1 + (lv - 1) * 0.16;
  return {
    side: 'enemy', key, name: e.name, el: e.el, boss: !!e.boss, img: enemyImg(key),
    maxHp: Math.round(130 * e.mod.hp * g), atk: Math.round(36 * e.mod.atk * (1 + (lv - 1) * 0.12)),
    def: Math.round(22 * e.mod.def * (1 + (lv - 1) * 0.1)), spd: e.spd, skill: e.skill || null, turn: 0,
  };
}

function buildWaves(ch, i) {
  const chap = CHAPTERS[ch - 1];
  const lv = chap.baseLv + i - 1;
  const waveCount = i <= 3 ? 1 : i <= 7 ? 2 : 3;
  const waves = [];
  for (let w = 0; w < waveCount; w++) {
    const n = Math.min(3, 1 + Math.floor((i + w) / 3));
    const list = [];
    for (let k = 0; k < n; k++) list.push(makeEnemy(chap.pool[Math.floor(Math.random() * chap.pool.length)], lv));
    waves.push(list);
  }
  if (i === 10) waves[waves.length - 1] = [makeEnemy(chap.pool[0], lv), makeEnemy(chap.boss, lv + 2), makeEnemy(chap.pool[1], lv)];
  return waves;
}

function startBattle(ch, i) {
  const allies = S.party.map(id => {
    const o = S.chars[id], st = statsOf(id, o.lv, o.dupe), c = CHARS[id];
    return { side: 'ally', id, name: c.name, el: c.el, role: c.role, img: charImg(id), maxHp: st.hp, atk: st.atk, def: st.def, spd: st.spd, skill: c.skill, cd: 1 };
  });
  allies.forEach(prepUnit);
  B = { ch, i, allies, waves: buildWaves(ch, i), wave: 0, enemies: [], target: null, over: false, retire: false, waiting: null, round: 0 };
  $('battle').hidden = false;
  $('battle').classList.toggle('cave', ch === 2);
  $('b-stage').textContent = `${stageId(ch, i)} ${CHAPTERS[ch - 1].name}`;
  updateCtrl();
  battleLoop();
}

function prepUnit(u) { u.hp = u.maxHp; u.alive = true; u.buffs = { atk: 0, def: 0 }; u.atkMul = 1; u.defMul = 1; u.taunt = 0; u.guard = false; }

// WAVE が変わったときだけ作り直し、それ以外は updateUnits で中身だけ更新する
// （作り直すとダメージ表示のアニメが消えてしまうため）
function updateUnits() {
  const upd = (u, el) => {
    if (!el) return;
    el.classList.toggle('dead', !u.alive);
    el.classList.toggle('target', B.target === u);
    el.classList.toggle('active', B.active === u);
    const bar = el.querySelector('.hpbar');
    bar.classList.toggle('low', u.hp / u.maxHp < 0.3);
    bar.firstElementChild.style.width = (u.hp / u.maxHp * 100) + '%';
    const num = el.querySelector('.hpnum');
    if (num) num.textContent = `${u.hp}/${u.maxHp}${u.cd > 0 ? '　✨' + u.cd : '　✨OK'}`;
    const bf = el.querySelector('.buffs');
    if (bf) bf.textContent = `${u.atkMul > 1 ? '⚔️' : ''}${u.defMul > 1 ? '🛡️' : ''}${u.guard ? '🔰' : ''}`;
  };
  B.enemies.forEach((u, k) => upd(u, $('ue-' + k)));
  B.allies.forEach((u, k) => upd(u, $('ua-' + k)));
}

function buildUnits() {
  $('b-enemies').innerHTML = B.enemies.map((u, k) => `
    <div class="unit enemy ${u.boss ? 'boss' : ''} ${u.alive ? '' : 'dead'} ${B.target === u ? 'target' : ''}" id="ue-${k}" data-k="${k}">
      <span class="el">${ELEMENTS[u.el].icon}</span>${img(u.img)}
      <span class="nm">${u.boss ? '👑' : ''}${u.name}</span>
      <div class="hpbar ${u.hp / u.maxHp < 0.3 ? 'low' : ''}"><i style="width:${u.hp / u.maxHp * 100}%"></i></div></div>`).join('');
  $('b-allies').innerHTML = B.allies.map((u, k) => `
    <div class="unit ally ${u.alive ? '' : 'dead'} ${B.active === u ? 'active' : ''}" id="ua-${k}">
      <span class="el">${ELEMENTS[u.el].icon}</span><span class="buffs">${u.atkMul > 1 ? '⚔️' : ''}${u.defMul > 1 ? '🛡️' : ''}${u.guard ? '🔰' : ''}</span>
      ${img(u.img)}<span class="nm">${u.name}</span>
      <div class="hpbar ${u.hp / u.maxHp < 0.3 ? 'low' : ''}"><i style="width:${u.hp / u.maxHp * 100}%"></i></div>
      <span class="hpnum">${u.hp}/${u.maxHp}${u.cd > 0 ? '　✨' + u.cd : '　✨OK'}</span></div>`).join('');
  document.querySelectorAll('.unit.enemy').forEach(el => el.addEventListener('click', () => {
    const u = B.enemies[+el.dataset.k];
    if (u && u.alive) { B.target = u; updateUnits(); sfx.click(); }
  }));
}

function unitEl(u) {
  const k = (u.side === 'ally' ? B.allies : B.enemies).indexOf(u);
  return $((u.side === 'ally' ? 'ua-' : 'ue-') + k);
}
function log(msg) { $('b-log').textContent = msg; }
function popNum(u, text, cls) {
  const el = unitEl(u);
  if (!el) return;
  const d = document.createElement('span');
  d.className = 'dmg ' + cls; d.textContent = text;
  el.appendChild(d);
  setTimeout(() => d.remove(), 900);
}
function flash(u, cls) {
  const el = unitEl(u);
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}

function aliveOf(side) { return (side === 'ally' ? B.allies : B.enemies).filter(u => u.alive); }

async function battleLoop() {
  for (B.wave = 0; B.wave < B.waves.length; B.wave++) {
    B.enemies = B.waves[B.wave];
    B.enemies.forEach(prepUnit);
    B.target = B.enemies.find(e => e.boss) || B.enemies[0];
    $('b-wave').textContent = `WAVE ${B.wave + 1}/${B.waves.length}`;
    buildUnits();
    log(B.enemies.some(e => e.boss) ? `👑 ${B.enemies.find(e => e.boss).name} があらわれた！` : '魔物があらわれた！');
    await wait(700);
    while (aliveOf('enemy').length && aliveOf('ally').length && !B.retire) {
      B.round++;
      const order = [...aliveOf('ally'), ...aliveOf('enemy')].sort((a, b) => (b.spd + Math.random() * 3) - (a.spd + Math.random() * 3));
      for (const u of order) {
        if (!u.alive || B.retire) continue;
        if (!aliveOf('enemy').length || !aliveOf('ally').length) break;
        await takeTurn(u);
      }
    }
    if (B.retire || !aliveOf('ally').length) break;
    if (B.wave < B.waves.length - 1) { log('つぎのWAVEへ！'); await wait(600); }
  }
  endBattle(!B.retire && aliveOf('ally').length > 0);
}

function startOfTurn(u) {
  u.guard = false;
  if (u.buffs.atk > 0 && --u.buffs.atk === 0) u.atkMul = 1;
  if (u.buffs.def > 0 && --u.buffs.def === 0) u.defMul = 1;
  if (u.taunt > 0) u.taunt--;
  if (u.cd > 0) u.cd--;
}

async function takeTurn(u) {
  startOfTurn(u);
  if (u.side === 'ally') {
    B.active = u;
    updateUnits();
    if (!B.target || !B.target.alive) B.target = aliveOf('enemy')[0];
    const cmd = S.prefs.auto ? autoCommand(u) : await playerCommand(u);
    B.active = null;
    if (cmd === 'retire' || B.retire) return;
    await doCommand(u, cmd);
  } else {
    u.turn++;
    await enemyAct(u);
  }
  updateUnits();
}

function playerCommand(u) {
  return new Promise(resolve => {
    B.waiting = cmd => { B.waiting = null; $('b-commands').classList.add('wait'); resolve(cmd); };
    $('cmd-skill-name').textContent = u.skill.name;
    $('cmd-skill-cd').textContent = u.cd > 0 ? `あと${u.cd}ターン` : '使える！';
    $('cmd-skill').disabled = u.cd > 0;
    $('b-commands').classList.remove('wait');
    log(`${u.name} はどうする？`);
  });
}
$('cmd-attack').addEventListener('click', () => B && B.waiting && B.waiting('attack'));
$('cmd-skill').addEventListener('click', () => B && B.waiting && B.waiting('skill'));
$('cmd-guard').addEventListener('click', () => B && B.waiting && B.waiting('guard'));

function autoCommand(u) {
  if (u.cd === 0) {
    const t = u.skill.type;
    const hurt = aliveOf('ally').some(a => a.hp / a.maxHp < 0.65);
    if ((t === 'heal' || t === 'healAll') && !hurt) return 'attack';
    return 'skill';
  }
  // 弱点をつける敵を優先して狙う
  const weak = aliveOf('enemy').filter(e => ELEMENTS[u.el].strong === e.el);
  if (weak.length && (!B.target || ELEMENTS[u.el].strong !== B.target.el)) B.target = weak.sort((a, b) => a.hp - b.hp)[0];
  return 'attack';
}

function calcDamage(a, d, mult) {
  let el = 1;
  if (ELEMENTS[a.el].strong === d.el) el = 1.5;
  else if (ELEMENTS[d.el].strong === a.el) el = 0.75;
  const crit = Math.random() < 0.1;
  let dmg = a.atk * a.atkMul * mult * el * (100 / (100 + d.def * d.defMul)) * (0.9 + Math.random() * 0.2);
  if (crit) dmg *= 1.5;
  if (d.guard) dmg *= 0.5;
  return { dmg: Math.max(1, Math.round(dmg)), el, crit };
}

async function hit(a, d, mult) {
  const r = calcDamage(a, d, mult);
  d.hp = Math.max(0, d.hp - r.dmg);
  flash(d, 'hit');
  popNum(d, r.dmg, [r.crit ? 'crit' : '', r.el > 1 ? 'weak' : '', r.el < 1 ? 'resist' : ''].join(' '));
  sfx.hit(r.crit || r.el > 1);
  if (d.hp <= 0) {
    d.alive = false;
    setTimeout(() => { const el = unitEl(d); if (el) el.classList.add('dead'); }, 250);
  }
  return r;
}

function heal(u, amount) {
  const v = Math.min(u.maxHp - u.hp, Math.round(amount));
  u.hp += v;
  popNum(u, '+' + v, 'heal');
}

async function doCommand(u, cmd) {
  flash(u, 'act');
  if (cmd === 'guard') {
    u.guard = true;
    u.cd = Math.max(0, u.cd - 1);
    log(`${u.name} は身をまもっている（ダメージ半減・スキル短縮）`);
    sfx.click();
    await wait(500);
    return;
  }
  if (cmd === 'attack') {
    const t = B.target && B.target.alive ? B.target : aliveOf('enemy')[0];
    log(`${u.name} のこうげき！`);
    await wait(250);
    const r = await hit(u, t, 1);
    if (r.el > 1) log(`${u.name} のこうげき！ 弱点をついた！`);
    await wait(550);
    return;
  }
  // スキル
  const sk = u.skill;
  u.cd = sk.cd;
  log(`✨ ${u.name} の「${sk.name}」！`);
  sfx.skill();
  await wait(350);
  const allies = aliveOf('ally');
  if (sk.type === 'strike' || sk.type === 'drain') {
    const t = B.target && B.target.alive ? B.target : aliveOf('enemy')[0];
    const r = await hit(u, t, sk.mult);
    if (sk.type === 'drain') heal(u, r.dmg * 0.5);
  } else if (sk.type === 'sweep') {
    for (const e of aliveOf('enemy')) hit(u, e, sk.mult);
  } else if (sk.type === 'heal') {
    const t = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    heal(t, u.atk * sk.mult);
    sfx.heal();
  } else if (sk.type === 'healAll') {
    allies.forEach(a => heal(a, u.atk * sk.mult));
    sfx.heal();
  } else if (sk.type === 'buffAtk') {
    allies.forEach(a => { a.atkMul = sk.mult; a.buffs.atk = 3; popNum(a, '攻撃UP', 'heal'); });
  } else if (sk.type === 'guardAll') {
    allies.forEach(a => { a.defMul = sk.mult; a.buffs.def = 2; popNum(a, '防御UP', 'heal'); });
    u.taunt = 2;
  }
  updateUnits();
  await wait(700);
}

async function enemyAct(u) {
  const allies = aliveOf('ally');
  if (!allies.length) return;
  flash(u, 'act');
  // ボスは3ターンごとに全体攻撃
  if (u.boss && u.skill && u.turn % 3 === 0) {
    log(`💥 ${u.name} の「${u.skill.name}」！`);
    sfx.skill();
    await wait(400);
    for (const a of allies) hit(u, a, u.skill.mult);
    await wait(750);
    return;
  }
  const taunter = allies.find(a => a.taunt > 0);
  let t = taunter;
  if (!t) t = Math.random() < 0.4 ? allies.sort((a, b) => a.hp - b.hp)[0] : allies[Math.floor(Math.random() * allies.length)];
  log(`${u.name} のこうげき！`);
  await wait(250);
  await hit(u, t, 1);
  await wait(500);
}

function updateCtrl() {
  $('b-auto').classList.toggle('on', S.prefs.auto);
  $('b-speed').textContent = '×' + (S.prefs.speed || 1);
  $('b-speed').classList.toggle('on', S.prefs.speed === 2);
}
$('b-auto').addEventListener('click', () => {
  S.prefs.auto = !S.prefs.auto; save(); updateCtrl(); sfx.click();
  if (S.prefs.auto && B && B.waiting && B.active) B.waiting(autoCommand(B.active));
});
$('b-speed').addEventListener('click', () => { S.prefs.speed = S.prefs.speed === 2 ? 1 : 2; save(); updateCtrl(); sfx.click(); });
$('b-retire').addEventListener('click', () => {
  if (!B || B.over) return;
  openModal(`<h2>リタイアする？</h2><p>使ったスタミナは戻りません。</p>
    <div class="row"><button class="btn gray" id="rt-no">つづける</button><button class="btn" id="rt-yes">リタイア</button></div>`, card => {
    card.querySelector('#rt-no').onclick = closeModal;
    card.querySelector('#rt-yes').onclick = () => { closeModal(); B.retire = true; if (B.waiting) B.waiting('retire'); };
  });
});

function endBattle(win) {
  B.over = true;
  const { ch, i } = B;
  const chap = CHAPTERS[ch - 1];
  const id = stageId(ch, i);
  let html;
  if (win) {
    const first = !S.cleared[id];
    const lv = chap.baseLv + i - 1;
    const gold = 100 + lv * 25 + (i === 10 ? 300 : 0);
    const exp = chap.cost * 10;
    const gems = first ? (i === 10 ? 150 : 50) : 0;
    S.gold += gold; S.gems += gems; S.exp += exp;
    S.cleared[id] = true;
    let rankUp = false;
    while (S.exp >= expNeed()) { S.exp -= expNeed(); S.rank++; rankUp = true; }
    if (rankUp) { S.stamina = Math.max(S.stamina, maxStamina()); S.staminaAt = Date.now(); }
    bumpMission('quest');
    save();
    sfx.win();
    const chapterClear = i === 10 && first;
    html = `<h2>🎉 クエストクリア！</h2>
      <p style="font-size:16px">🪙 ${gold}　EXP ${exp}${gems ? `<br><b>🌟 初回報酬 ${gems}</b>` : ''}</p>
      ${rankUp ? `<p><b>⭐ ランクアップ！ Rank ${S.rank}</b><br><span class="sub">スタミナが全回復した！</span></p>` : ''}
      ${chapterClear ? `<p><b>${ch < CHAPTERS.length ? `第${ch + 1}章が開放された！` : '星の灯台に光が戻った…！ ありがとう、マスター！（つづく）'}</b></p>` : ''}
      <div class="row"><button class="btn gray" id="end-home">ホームへ</button>${i < 10 ? '<button class="btn" id="end-next">次へ</button>' : ''}</div>`;
  } else {
    sfx.lose();
    html = `<h2>${B.retire ? 'リタイアした' : '全滅してしまった…'}</h2>
      <p class="sub">ヒント：ゴールドでキャラを強化しよう！<br>属性の相性（🔥→🍃→💧→🔥）も大事だよ。</p>
      <div class="row"><button class="btn gray" id="end-home">ホームへ</button><button class="btn" id="end-party">編成へ</button></div>`;
  }
  setTimeout(() => {
    openModal(html, card => {
      const leave = t => { closeModal(); $('battle').hidden = true; B = null; refreshTop(); showTab(t); };
      card.querySelector('#end-home').onclick = () => leave('home');
      const nx = card.querySelector('#end-next');
      if (nx) nx.onclick = () => { leave('quest'); confirmStage(ch, i + 1); };
      const pt = card.querySelector('#end-party');
      if (pt) pt.onclick = () => leave('party');
    });
  }, 500);
}

// =====================================================================
// サウンド（WebAudio で合成）
// =====================================================================
const audio = {
  ctx: null,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch {}
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4;
    this.master.connect(this.ctx.destination);
  },
  tone(f, dur, { type = 'square', vol = 0.15, when = 0, slide = 0 } = {}) {
    if (!this.ctx || !S.prefs.se) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
};
document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
const sfx = {
  click() { audio.tone(880, 0.05, { vol: 0.05 }); },
  get() { [784, 988, 1319].forEach((f, i) => audio.tone(f, 0.12, { vol: 0.08, when: i * 0.07 })); },
  levelup() { [523, 659, 784, 1047].forEach((f, i) => audio.tone(f, 0.12, { vol: 0.08, when: i * 0.05 })); },
  summon(r) { audio.tone(200, 1.2, { type: 'sine', vol: 0.15, slide: r === 3 ? 6 : 4 }); },
  rare() { [784, 988, 1175, 1568, 1976].forEach((f, i) => audio.tone(f, 0.25, { type: 'triangle', vol: 0.12, when: i * 0.09 })); },
  hit(big) { audio.tone(big ? 180 : 240, 0.12, { type: 'sawtooth', vol: big ? 0.14 : 0.09, slide: 0.4 }); },
  skill() { audio.tone(600, 0.25, { type: 'triangle', vol: 0.1, slide: 2 }); },
  heal() { [660, 880, 1100].forEach((f, i) => audio.tone(f, 0.15, { type: 'sine', vol: 0.1, when: i * 0.06 })); },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => audio.tone(f, 0.16, { vol: 0.09, when: i * 0.1 })); },
  lose() { [392, 330, 262, 196].forEach((f, i) => audio.tone(f, 0.3, { type: 'triangle', vol: 0.2, when: i * 0.18 })); },
};

document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
  else { refreshTop(); if (!B && S.introSeen && S.login.last !== today()) showLogin(true); }
});

// =====================================================================
// 起動
// =====================================================================
function boot() {
  $('battle').hidden = true;
  B = null;
  refreshTop();
  showTab('home');
  if (!S.introSeen) showIntro();
  else if (S.login.last !== today()) showLogin(true);
}
boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
