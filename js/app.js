/* Japonsky – appka na japonštinu pro Čechy */
'use strict';
(function () {

  /* ═════════════ Pomocné funkce ═════════════ */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniqBy = (a, f) => { const s = new Set(); return a.filter(x => { const k = f(x); if (s.has(k)) return false; s.add(k); return true; }); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
  const plural = (n, one, few, many) => n === 1 ? one : (n >= 2 && n <= 4 ? few : many);
  const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

  // Česká výslovnost z romaji: shi → ši, chi → či, tsu → cu, ji → dži, ya → ja
  function czRead(r) {
    return r.replace(/ssh/g, 'šš').replace(/tch/g, 'čč').replace(/tts/g, 'cc')
      .replace(/sh/g, 'š').replace(/ch/g, 'č').replace(/ts/g, 'c')
      .replace(/j/g, 'dž').replace(/y/g, 'j');
  }

  // Sjednocení romaji pro porovnání (hepburn i kunrei, makrony, ou/oo…)
  function canon(s) {
    s = String(s).toLowerCase().normalize('NFD')
      .replace(/([aeiou])[̄̂]/g, '$1$1').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z]/g, '');
    return s.replace(/tch/g, 'cch')
      .replace(/shi/g, 'si').replace(/sh/g, 'sy')
      .replace(/chi/g, 'ti').replace(/ch/g, 'ty')
      .replace(/tsu/g, 'tu').replace(/fu/g, 'hu')
      .replace(/jy/g, 'j').replace(/ji/g, 'zi').replace(/j/g, 'zy')
      .replace(/ou/g, 'oo').replace(/wo/g, 'o')
      .replace(/m(?=[bp])/g, 'n');
  }

  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  const normCz = s => s.toLowerCase().replace(/[.,!?;:„“"]/g, '').replace(/\s+/g, ' ').trim();
  const czWords = s => s.replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);

  /* ═════════════ Sestavení kurzu ═════════════ */
  const ITEMS = {};
  const UNITS = [];
  const NODES = [];

  const addItem = it => (ITEMS[it.id] = ITEMS[it.id] || it);

  function kanaItems(str, kata) {
    return str.trim().split(/\s+/).map(p => {
      const [ch, romaji] = p.split(':');
      const jp = kata ? toKata(ch) : ch;
      return addItem({
        id: 'k:' + jp, type: 'kana', jp, say: jp, romaji,
        script: /[゠-ヿ]/.test(jp) ? 'kata' : 'hira',
        alts: KANA_ALT[toHira(jp)] || [],
      });
    });
  }
  const wordItem = ([jp, romaji, cz, kanji, note]) =>
    addItem({ id: 'w:' + jp + ':' + cz, type: 'word', jp, say: jp, romaji, cz, kanji: kanji || '', note: note || '' });
  const kanjiItem = ([jp, kana, romaji, cz, note]) =>
    addItem({ id: 'j:' + jp, type: 'kanji', jp, say: kana, kana, romaji, cz, note: note || '' });
  function sentItem([jp, romaji, cz, extra]) {
    const alts = jp.split('|').map(s => s.trim());
    return addItem({
      id: 's:' + alts[0], type: 'sent', tokens: alts[0].split(' '),
      jp: alts[0].replace(/ /g, ''), say: alts[0].replace(/ /g, ''),
      jpAlts: alts.map(s => s.replace(/ /g, '')), romaji, cz: cz.split('|'),
      extra: extra ? extra.split(' ') : [],
    });
  }

  COURSE.forEach((u, ui) => {
    const unit = Object.assign({}, u, { idx: ui, items: [], sents: [], nodes: [], icon: UNIT_ICONS[u.id] || '⭐' });
    u.levels.forEach(lv => {
      let items = [], sents = [];
      if (lv.review) { items = unit.items.slice(); sents = unit.sents.slice(); }
      else {
        if (lv.kana) items = kanaItems(lv.kana, lv.kata);
        if (lv.w) items = items.concat(lv.w.map(wordItem));
        if (lv.kj) items = items.concat(lv.kj.map(kanjiItem));
        if (lv.s) sents = lv.s.map(sentItem);
        unit.items.push(...items);
        unit.sents.push(...sents);
      }
      let icon = '⭐';
      if (lv.review) icon = '🔁';
      else if (lv.kana || lv.kj) icon = items[0].jp;
      else if (lv.s) icon = '💬';
      const node = {
        id: lv.id, kind: 'level', title: lv.title, unit, items, sents, review: !!lv.review, icon,
        lessons: lv.lessons || (lv.review ? 2 : lv.kana ? 3 : 2),
      };
      unit.nodes.push(node); NODES.push(node);
    });
    const test = { id: 'test:' + u.id, kind: 'test', title: 'Zkouška jednotky', unit, items: unit.items, sents: unit.sents, lessons: 1, icon: '🏆' };
    unit.nodes.push(test); NODES.push(test);
    UNITS.push(unit);
  });
  NODES.forEach((n, i) => { n.idx = i; });

  /* ═════════════ Stav a ukládání ═════════════ */
  const KEY = 'japonsky:v1';
  const MAX_HEARTS = 5;
  const HEART_MS = 30 * 60 * 1000;
  const PRICE = { hearts: 150, freeze: 100, boost: 80 };

  const defaults = () => ({
    v: 1, name: '', created: Date.now(), onboarded: false,
    xp: 0, gems: 100, hearts: MAX_HEARTS, heartTs: Date.now(),
    streak: 0, best: 0, lastDay: null, freezes: 0, goal: 20, days: {},
    progress: {}, stats: {}, ach: {}, flags: {}, quests: null,
    lessons: 0, perfect: 0, boost: 0, installHint: false,
    set: { sfx: true, tts: true, romaji: true, cz: true, hearts: true, slow: false },
  });

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v) return Object.assign(defaults(), s, { set: Object.assign(defaults().set, s.set || {}) });
    } catch (e) { /* prázdno */ }
    return defaults();
  }
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* plný disk / privátní režim */ } };
  const UI = { tab: 'learn', chars: 'hira' };

  /* ── srdíčka ── */
  function tickHearts() {
    if (S.hearts >= MAX_HEARTS) { S.heartTs = Date.now(); return; }
    const n = Math.floor((Date.now() - S.heartTs) / HEART_MS);
    if (n > 0) {
      S.hearts = Math.min(MAX_HEARTS, S.hearts + n);
      S.heartTs = S.hearts >= MAX_HEARTS ? Date.now() : S.heartTs + n * HEART_MS;
      save();
    }
  }
  function loseHeart() {
    if (S.hearts >= MAX_HEARTS) S.heartTs = Date.now();
    S.hearts = Math.max(0, S.hearts - 1);
    save();
  }
  const nextHeartIn = () => Math.max(0, HEART_MS - (Date.now() - S.heartTs));
  const heartsOn = () => S.set.hearts;

  /* ── série ── */
  function checkStreak() {
    if (!S.lastDay) return;
    const gap = dayDiff(S.lastDay, dayKey());
    if (gap <= 1) return;
    const missed = gap - 1;
    if (S.streak > 0 && S.freezes >= missed) {
      S.freezes -= missed;
      S.lastDay = dayKey(new Date(Date.now() - 864e5));
      UI.frozeMsg = missed;
    } else S.streak = 0;
    save();
  }
  function markActive() {
    const t = dayKey();
    if (S.lastDay === t) return false;
    S.streak = (S.lastDay && dayDiff(S.lastDay, t) === 1) ? S.streak + 1 : 1;
    S.lastDay = t;
    S.best = Math.max(S.best, S.streak);
    return true;
  }
  const dayXP = (d = dayKey()) => S.days[d] || 0;
  const boostOn = () => S.boost > Date.now();

  function addXP(n) {
    S.xp += n;
    const d = dayKey();
    S.days[d] = (S.days[d] || 0) + n;
    questProgress('xp', n);
  }

  /* ── statistiky položek ── */
  function rec(item, ok) {
    if (!item) return;
    const s = S.stats[item.id] || [0, 0, 0];
    if (ok) s[0]++; else s[1]++;
    s[2] = Date.now();
    S.stats[item.id] = s;
  }
  const mastery = it => { const s = S.stats[it.id]; return s ? clamp((s[0] - s[1] * 0.5) / 6, 0.08, 1) : 0; };
  const weakness = it => { const s = S.stats[it.id] || [0, 0, 0]; return (s[1] + 1) / (s[0] + 1) + (Date.now() - s[2]) / 864e5 * 0.05; };

  /* ── postup ── */
  const prog = n => S.progress[n.id] || 0;
  const isDone = n => prog(n) >= n.lessons;
  function currentIdx() { const i = NODES.findIndex(n => !isDone(n)); return i < 0 ? NODES.length : i; }
  function nodeState(n) { const c = currentIdx(); return isDone(n) ? 'done' : n.idx === c ? 'current' : n.idx < c ? 'done' : 'locked'; }
  function startedNodes() { return NODES.filter(n => prog(n) > 0); }
  function learnedItems() { const s = new Set(); startedNodes().forEach(n => n.items.forEach(i => s.add(i))); return [...s]; }
  function learnedSents() { const s = new Set(); startedNodes().forEach(n => n.sents.forEach(i => s.add(i))); return [...s]; }
  const wordsLearned = () => Object.keys(S.stats).filter(id => (id[0] === 'w' || id[0] === 'j') && S.stats[id][0] > 0).length;
  const unitLevelsDone = ids => ids.every(id => UNITS.find(u => u.id === id).nodes.filter(n => n.kind === 'level').every(isDone));

  /* ── denní úkoly ── */
  const QUESTS = {
    xp: { ic: '⚡', txt: n => `Získej ${n} XP`, n: [20, 30, 50] },
    lessons: { ic: '📘', txt: n => `Dokonči ${n} ${plural(n, 'lekci', 'lekce', 'lekcí')}`, n: [2, 3] },
    combo: { ic: '🎯', txt: n => `Odpověz ${n}× správně v řadě`, n: [5, 10] },
    perfect: { ic: '💯', txt: () => 'Dokonči lekci bez chyby', n: [1] },
    listen: { ic: '🎧', txt: n => `Splň ${n} poslechových cvičení`, n: [4, 6] },
    practice: { ic: '🏋️', txt: () => 'Dokonči jedno procvičování', n: [1] },
  };
  function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  function ensureQuests() {
    const d = dayKey();
    if (S.quests && S.quests.day === d) return;
    const r = seeded(d);
    const pickN = k => QUESTS[k].n[Math.floor(r() * QUESTS[k].n.length)];
    const others = ['lessons', 'combo', 'perfect', 'listen', 'practice'].map(k => [k, r()]).sort((a, b) => a[1] - b[1]).slice(0, 2).map(x => x[0]);
    S.quests = { day: d, list: ['xp', ...others].map((k, i) => ({ k, n: pickN(k), p: 0, gems: [10, 15, 20][i], claimed: false })) };
    save();
  }
  function questProgress(k, v = 1, abs = false) {
    ensureQuests();
    S.quests.list.forEach(q => { if (q.k === k) q.p = abs ? Math.max(q.p, v) : q.p + v; });
  }
  const claimable = () => { ensureQuests(); return S.quests.list.filter(q => q.p >= q.n && !q.claimed).length; };

  /* ── úspěchy ── */
  const ACH = [
    { id: 'first', ic: '🐣', t: 'První krůček', d: 'Dokonči první lekci', ok: () => S.lessons >= 1 },
    { id: 'ten', ic: '📚', t: 'Pilný student', d: 'Dokonči 10 lekcí', ok: () => S.lessons >= 10 },
    { id: 'fifty', ic: '🎓', t: 'Sensei v zácviku', d: 'Dokonči 50 lekcí', ok: () => S.lessons >= 50 },
    { id: 'perfect', ic: '💯', t: 'Bez chyby', d: 'Dokonči lekci bez jediné chyby', ok: () => S.perfect >= 1 },
    { id: 's3', ic: '🔥', t: 'Rozehřátí', d: 'Série 3 dny', ok: () => S.best >= 3 },
    { id: 's7', ic: '☄️', t: 'Týden v plamenech', d: 'Série 7 dní', ok: () => S.best >= 7 },
    { id: 's30', ic: '🌋', t: 'Sopka', d: 'Série 30 dní', ok: () => S.best >= 30 },
    { id: 'xp500', ic: '⚡', t: 'Nabitý', d: 'Získej 500 XP', ok: () => S.xp >= 500 },
    { id: 'xp2000', ic: '🌩️', t: 'Bouře', d: 'Získej 2000 XP', ok: () => S.xp >= 2000 },
    { id: 'hira', ic: 'あ', t: 'Mistr hiragany', d: 'Dokonči všechny jednotky hiragany', ok: () => unitLevelsDone(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) },
    { id: 'kata', ic: 'ア', t: 'Mistr katakany', d: 'Dokonči všechny jednotky katakany', ok: () => unitLevelsDone(['k1', 'k2', 'k3', 'k4']) },
    { id: 'words50', ic: '🗣️', t: 'Slovní zásoba', d: 'Nauč se 50 slov', ok: () => wordsLearned() >= 50 },
    { id: 'beer', ic: '🍺', t: 'Pivní diplomat', d: 'Nauč se japonsky slovo pivo', ok: () => (S.stats['w:ビール:pivo'] || [0])[0] > 0 },
    { id: 'test', ic: '🏆', t: 'Zkouška složena', d: 'Slož zkoušku jednotky', ok: () => !!S.flags.test },
    { id: 'lazy', ic: '🦥', t: 'Líná kočka', d: 'Dokonči líný mód', ok: () => !!S.flags.lazy },
    { id: 'owl', ic: '🦉', t: 'Noční sova', d: 'Uč se po 22:00', ok: () => !!S.flags.owl },
    { id: 'bird', ic: '🐦', t: 'Ranní ptáče', d: 'Uč se před 7:00', ok: () => !!S.flags.bird },
    { id: 'rich', ic: '💎', t: 'Boháč', d: 'Měj 1000 drahokamů', ok: () => S.gems >= 1000 },
  ];
  function checkAch() {
    const fresh = [];
    ACH.forEach(a => { if (!S.ach[a.id] && a.ok()) { S.ach[a.id] = Date.now(); fresh.push(a); } });
    return fresh;
  }

  /* ═════════════ Zvuk ═════════════ */
  let AC = null;
  function ac() {
    if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(freq, t0, dur, type = 'sine', vol = 0.15) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  const SFX = {
    ok() { tone(660, 0, 0.12, 'triangle'); tone(990, 0.09, 0.25, 'triangle'); },
    bad() { tone(220, 0, 0.18, 'sawtooth', 0.06); tone(165, 0.12, 0.28, 'sawtooth', 0.06); },
    tap() { tone(600, 0, 0.05, 'sine', 0.05); },
    pair() { tone(880, 0, 0.1, 'triangle', 0.1); },
    done() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle', 0.12)); },
    coin() { tone(988, 0, 0.08, 'square', 0.05); tone(1319, 0.08, 0.25, 'square', 0.05); },
  };
  const sfx = k => { if (S.set.sfx) try { SFX[k](); } catch (e) { /* bez zvuku */ } };

  /* ── japonský hlas ── */
  const HAS_TTS = 'speechSynthesis' in window;
  let JA_VOICE = null, VOICES_READY = false;
  function loadVoices() {
    if (!HAS_TTS) return;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    VOICES_READY = true;
    const ja = vs.filter(v => /^ja/i.test(v.lang));
    JA_VOICE = ja.find(v => /Kyoko|O-ren|Google/i.test(v.name)) || ja[0] || null;
  }
  if (HAS_TTS) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  const canListen = () => HAS_TTS && S.set.tts && (!VOICES_READY || !!JA_VOICE);

  function speak(text, slow) {
    if (!HAS_TTS || !S.set.tts || !text) return;
    const go = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP';
      if (JA_VOICE) u.voice = JA_VOICE;
      u.rate = slow ? 0.5 : (S.set.slow ? 0.7 : 0.9);
      speechSynthesis.speak(u);
    };
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(go, 60); }
      else go();
    } catch (e) { /* bez hlasu */ }
  }
  // samostatná částice se má číst jako částice
  const sayToken = t => ({ 'は': 'わ', 'へ': 'え', 'を': 'お' }[t] || t);

  /* ═════════════ Maskot Mochi ═════════════ */
  function mochi(mood = 'normal', size = 110, cls = '') {
    const eyes = mood === 'happy'
      ? '<path d="M37 74 Q44 64 51 74" class="m-line" stroke-width="5"/><path d="M69 74 Q76 64 83 74" class="m-line" stroke-width="5"/>'
      : mood === 'sad'
        ? '<ellipse cx="44" cy="76" rx="5.5" ry="7" fill="#3c3c3c"/><ellipse cx="76" cy="76" rx="5.5" ry="7" fill="#3c3c3c"/><path d="M36 66 L50 61" class="m-line" stroke-width="3.5"/><path d="M84 66 L70 61" class="m-line" stroke-width="3.5"/><path d="M86 84 q3 6 0 9 q-3 -3 0 -9z" fill="#7cc8ff"/>'
        : '<ellipse cx="44" cy="73" rx="6" ry="8" fill="#3c3c3c"/><ellipse cx="76" cy="73" rx="6" ry="8" fill="#3c3c3c"/><circle cx="46.5" cy="69.5" r="2.4" fill="#fff"/><circle cx="78.5" cy="69.5" r="2.4" fill="#fff"/>';
    const mouth = mood === 'sad'
      ? '<path d="M52 96 Q60 89 68 96" class="m-line" stroke-width="3"/>'
      : '<path d="M51 89 Q55.5 95 60 89 Q64.5 95 69 89" class="m-line" stroke-width="3"/>';
    return `<svg class="mochi ${cls}" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
      <path d="M20 54 L25 12 L55 34 Z" fill="#fff" stroke="#3c3c3c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M100 54 L95 12 L65 34 Z" fill="#fff" stroke="#3c3c3c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 44 L29 22 L45 34 Z" fill="#ffb3c6"/><path d="M92 44 L91 22 L75 34 Z" fill="#ffb3c6"/>
      <ellipse cx="60" cy="68" rx="46" ry="40" fill="#fff"/>
      <path d="M17 52 Q60 40 103 52 L105 60 Q60 48 15 60 Z" fill="#e63946"/>
      <circle cx="60" cy="50" r="5.5" fill="#fff"/><circle cx="60" cy="50" r="3" fill="#e63946"/>
      <ellipse cx="60" cy="68" rx="46" ry="40" fill="none" stroke="#3c3c3c" stroke-width="4"/>
      ${eyes}
      <ellipse cx="33" cy="86" rx="7" ry="4" fill="#ffb3c6"/><ellipse cx="87" cy="86" rx="7" ry="4" fill="#ffb3c6"/>
      <path d="M56 81 L64 81 L60 86 Z" fill="#ff8fa3"/>
      ${mouth}
      <path d="M24 82 L6 78 M24 89 L7 92 M96 82 L114 78 M96 89 L113 92" class="m-line" stroke-width="2.5"/>
    </svg>`;
  }

  /* ═════════════ Generátor cvičení ═════════════ */
  const CHOICE = {
    k2r: { q: i => i.jp, a: i => i.romaji },
    r2k: { q: i => i.romaji, a: i => i.jp },
    listen: { q: i => i.jp, a: i => i.jp },
    w2c: { q: i => i.jp, a: i => i.cz },
    c2w: { q: i => i.cz, a: i => i.jp },
    j2c: { q: i => i.jp, a: i => i.cz },
    c2j: { q: i => i.cz, a: i => i.jp },
    j2r: { q: i => i.jp, a: i => i.kana },
  };
  const KINDS = {
    kana: { normal: ['k2r', 'k2r', 'r2k', 'r2k', 'listen', 'type'], listen: ['listen'], type: ['type'], lazy: ['k2r', 'r2k'] },
    word: { normal: ['w2c', 'w2c', 'c2w', 'c2w', 'listen', 'type'], listen: ['listen'], type: ['type'], lazy: ['w2c', 'c2w'] },
    kanji: { normal: ['j2c', 'j2c', 'c2j', 'j2r', 'type'], listen: [], type: ['type'], lazy: ['j2c', 'c2j'] },
  };
  const FIRST = { kana: 'k2r', word: 'w2c', kanji: 'j2c' };
  const sameFamily = (a, b) => a.type === b.type && (a.type !== 'kana' || a.script === b.script);

  function kindFor(it, mode) {
    let ks = KINDS[it.type][mode] || KINDS[it.type].normal;
    if (!canListen() || (L && L.noListen)) ks = ks.filter(k => k !== 'listen');
    if (it.romaji.replace(/ /g, '').length > 14) ks = ks.filter(k => k !== 'type');
    return ks.length ? pick(ks) : null;
  }

  function choiceEx(t, item, pool) {
    const F = CHOICE[t], ans = F.a(item), q = F.q(item);
    const ok = x => x.id !== item.id && sameFamily(x, item) && F.a(x) !== ans && F.q(x) !== q;
    let cands = uniqBy(shuffle(pool.filter(ok)), F.a);
    if (cands.length < 3) cands = uniqBy(cands.concat(shuffle(Object.values(ITEMS).filter(ok))), F.a);
    const n = item.type === 'word' ? 3 : 4;
    const opts = shuffle([item, ...cands.slice(0, n - 1)]);
    return { t, item, opts, ans: opts.indexOf(item) };
  }

  function itemEx(it, kind, pool) {
    if (!kind) return null;
    if (kind === 'type') return { t: 'type', item: it };
    return choiceEx(kind, it, pool);
  }

  function matchEx(cands) {
    const counts = {};
    cands.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    const ty = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const right = i => i.type === 'kana' ? i.romaji : i.cz;
    let list = uniqBy(shuffle(cands.filter(i => i.type === ty)), i => i.jp);
    list = uniqBy(list, right).slice(0, 5);
    if (list.length < 4) return null;
    return { t: 'match', items: list, left: shuffle(list), right: shuffle(list), rightOf: right };
  }

  function sentEx(s, kind, sentPool, wordPool) {
    const toCz = kind === 'b2c';
    let tiles;
    if (toCz) {
      const ans = czWords(s.cz[0]);
      const have = new Set(ans.map(w => w.toLowerCase()));
      let extra = s.extra.filter(w => !have.has(w.toLowerCase()));
      extra.forEach(w => have.add(w.toLowerCase()));
      let other = uniqBy(shuffle(sentPool.filter(x => x !== s).flatMap(x => czWords(x.cz[0]))), w => w.toLowerCase())
        .filter(w => !have.has(w.toLowerCase()));
      if (other.length < 3) other = other.concat(shuffle(wordPool.filter(i => i.cz && !/[\s/(]/.test(i.cz)).map(i => i.cz)).filter(w => !have.has(w.toLowerCase())));
      other = uniqBy(other, w => w.toLowerCase()).slice(0, clamp(7 - ans.length - extra.length, 2, 4));
      tiles = [...ans, ...extra, ...other];
    } else {
      const have = new Set(s.tokens);
      let other = uniqBy(shuffle(sentPool.filter(x => x !== s).flatMap(x => x.tokens)), x => x).filter(w => !have.has(w));
      if (other.length < 3) other = other.concat(shuffle(wordPool.filter(i => i.type === 'word').map(i => i.jp)).filter(w => !have.has(w)));
      other = uniqBy(other, x => x).slice(0, clamp(7 - s.tokens.length, 2, 4));
      tiles = [...s.tokens, ...other];
    }
    return { t: kind, item: s, target: toCz ? 'cz' : 'jp', tiles: shuffle(tiles).map((txt, i) => ({ txt, i })) };
  }

  function sentKind(mode) {
    const listenOk = canListen() && !(L && L.noListen);
    if (mode === 'listen') return listenOk ? 'lb' : null;
    if (mode === 'lazy') return 'b2c';
    const r = Math.random();
    return r < 0.45 ? 'b2c' : r < 0.8 || !listenOk ? 'b2j' : 'lb';
  }

  function pickW(list, avoid) {
    if (list.length === 1) return list[0];
    const cands = list.filter(x => x !== avoid);
    const ws = cands.map(x => 0.5 + weakness(x));
    let r = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cands.length; i++) { r -= ws[i]; if (r <= 0) return cands[i]; }
    return cands[cands.length - 1];
  }

  function generate({ items = [], sents = [], review = [], sentPool = [], intro = false, size = 12, mode = 'normal', match = true }) {
    const steps = [];
    const introItems = intro ? items.filter(i => !S.stats[i.id]).slice(0, 4) : [];
    const known = items.filter(i => S.stats[i.id] || introItems.includes(i));
    const own = known.length ? known : (intro ? [] : items);
    const pool = uniqBy([...items, ...review, ...learnedItems()], i => i.id);
    const sPool = uniqBy([...sents, ...sentPool, ...learnedSents()], i => i.id);

    introItems.forEach(it => {
      steps.push({ t: 'intro', item: it });
      steps.push(itemEx(it, FIRST[it.type], pool));
    });

    const mains = [];
    const n = mode === 'lazy' ? size : Math.max(6, size - steps.length);
    const useSents = sents.length && mode !== 'type' && (mode !== 'listen' || canListen());
    const nSent = useSents ? Math.round(n * (own.length ? 0.5 : 0.75)) : 0;
    const matchSrc = uniqBy([...own, ...review.filter(r => own.length === 0 || own.some(o => sameFamily(o, r)))], i => i.id);
    const m = match && mode === 'normal' && n >= 6 ? matchEx(matchSrc) : null;

    let last = null;
    for (let i = 0; i < nSent; i++) {
      const s = pickW(sents, last); last = s;
      const k = sentKind(mode);
      if (k) mains.push(sentEx(s, k, sPool, pool));
    }
    for (let i = mains.length; i < n - (m ? 1 : 0); i++) {
      const src = own.length ? (review.length && Math.random() < 0.3 ? review : own) : review;
      if (!src.length) break;
      const it = pickW(src, last); last = it;
      const ex = itemEx(it, kindFor(it, mode), pool) || itemEx(it, FIRST[it.type], pool);
      if (ex) mains.push(ex);
    }
    const out = shuffle(mains);
    if (m) out.splice(1 + rnd(Math.max(1, out.length - 1)), 0, m);
    return steps.filter(Boolean).concat(out);
  }

  function reviewFor(node) {
    return learnedItems().filter(i => !node.items.includes(i) && node.items.some(o => sameFamily(o, i)));
  }

  function lessonFor(node) {
    if (node.kind === 'test') {
      return generate({ items: node.items, sents: node.sents, size: 15 });
    }
    return generate({
      items: node.items, sents: node.sents, review: reviewFor(node),
      intro: !node.review, size: node.review ? 13 : 12,
    });
  }

  /* ═════════════ Vykreslení hlavní obrazovky ═════════════ */
  const app = $('#app');

  function render() {
    tickHearts();
    ensureQuests();
    if (!S.onboarded) return renderOnboarding();
    const tabs = [
      ['learn', '🏯', 'Učit'],
      ['chars', '<span class="jp">あ</span>', 'Znaky'],
      ['practice', '🏋️', 'Procvičit'],
      ['quests', '🎯', 'Úkoly'],
      ['profile', '🐱', 'Profil'],
    ];
    const q = claimable();
    app.innerHTML = `
      <div class="shell">
        <header class="topbar">${topbar()}</header>
        <main class="content" id="content">${TAB[UI.tab]()}</main>
        <nav class="tabbar">
          ${tabs.map(([id, ic, label]) => `
            <button class="tab ${UI.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}">
              <span class="tab-ic">${ic}</span><span class="tab-l">${label}</span>
              ${id === 'quests' && q ? `<span class="dot">${q}</span>` : ''}
            </button>`).join('')}
        </nav>
      </div>`;
    if (UI.tab === 'learn') requestAnimationFrame(scrollToCurrent);
    mountTab();
  }

  function topbar() {
    const hearts = heartsOn() ? S.hearts : '∞';
    return `
      <button class="tb-item flag" data-act="tab" data-v="learn" aria-label="Kurz"><span class="flag-jp"></span></button>
      <button class="tb-item streak ${S.lastDay === dayKey() ? 'lit' : ''}" data-act="streak">🔥 <b>${S.streak}</b></button>
      <button class="tb-item gems" data-act="shop">💎 <b>${S.gems}</b></button>
      ${boostOn() ? '<span class="tb-item boost">⚡2×</span>' : ''}
      <button class="tb-item hearts" data-act="hearts">❤️ <b>${hearts}</b></button>`;
  }
  const refreshTop = () => { const t = $('.topbar'); if (t) t.innerHTML = topbar(); };

  /* ── záložka Učit ── */
  const OFFS = [0, 44, 70, 44, 0, -44, -70, -44];

  function learnTab() {
    const cur = currentIdx();
    return `<div class="path">${UNITS.map(u => {
      const unitLocked = u.nodes[0].idx > cur;
      const done = u.nodes.every(isDone);
      return `
      <section class="unit ${unitLocked ? 'locked' : ''}" style="--u:${u.color}" id="unit-${u.id}">
        <div class="unit-head">
          <div class="unit-txt">
            <div class="unit-num">Jednotka ${u.idx + 1}${done ? ' · hotovo ✓' : ''}</div>
            <div class="unit-title">${esc(u.title)}</div>
            <div class="unit-sub">${esc(u.sub)}</div>
          </div>
          <button class="unit-guide" data-act="tips" data-u="${u.idx}" aria-label="Tipy">📖<span>Tipy</span></button>
        </div>
        ${unitLocked ? `<button class="jump" data-act="jump" data-u="${u.idx}">⏩ Umíš to? Přeskoč sem</button>` : ''}
        <div class="nodes">
          ${u.nodes.map((n, i) => nodeHTML(n, OFFS[i % OFFS.length] * (u.idx % 2 ? -1 : 1), cur)).join('')}
          <div class="unit-mascot ${u.idx % 2 ? 'right' : 'left'}">${mochi(done ? 'happy' : 'normal', 92)}<span class="unit-emoji">${u.icon}</span></div>
        </div>
      </section>`;
    }).join('')}
      <div class="path-end">${mochi('happy', 120)}<p>Další jednotky už se chystají 🛠️<br>Zatím opakuj a drž sérii! 🔥</p></div>
    </div>`;
  }

  function nodeHTML(n, x, cur) {
    const st = nodeState(n);
    const p = prog(n);
    const ring = (st === 'current' && n.lessons > 1)
      ? `<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" class="ring-bg"/><circle cx="50" cy="50" r="46" class="ring-fg" stroke-dasharray="${(p / n.lessons) * 289} 289"/></svg>` : '';
    return `
      <div class="node-wrap" style="--x:${x}px">
        ${n.idx === cur ? `<div class="start-bubble">${p ? 'POKRAČOVAT' : 'ZAČÍT'}</div>` : ''}
        <button class="node ${st} ${n.kind}" data-act="node" data-i="${n.idx}" aria-label="${esc(n.title)}">
          ${ring}<span class="node-face"><span class="node-ic ${n.icon.length > 1 && !/\p{Emoji}/u.test(n.icon) ? 'small' : ''}">${st === 'locked' && n.kind === 'test' ? '🔒' : esc(n.icon)}</span></span>
          ${st === 'done' && n.kind === 'level' ? '<span class="crown">👑</span>' : ''}
        </button>
      </div>`;
  }

  function scrollToCurrent() {
    const el = $('.node.current') || $('.start-bubble');
    if (el) el.scrollIntoView({ block: 'center' });
  }

  function closePop() { $$('.pop').forEach(p => p.remove()); }

  function showNodePop(btn) {
    const wasOpen = btn.parentElement.querySelector('.pop');
    closePop();
    if (wasOpen) return;
    const n = NODES[+btn.dataset.i];
    const st = nodeState(n);
    const wrap = btn.closest('.node-wrap');
    const pop = document.createElement('div');
    pop.className = 'pop ' + st;
    let body;
    if (st === 'locked') {
      body = `<div class="pop-t">${esc(n.title)}</div><div class="pop-s">Nejdřív dokonči předchozí úrovně 🔒</div>`;
    } else if (n.kind === 'test') {
      body = `<div class="pop-t">🏆 Zkouška: ${esc(n.unit.title)}</div><div class="pop-s">${st === 'done' ? 'Složeno! Chceš si to zopakovat?' : 'Ukaž, co umíš – 15 otázek z celé jednotky.'}</div>
        <button class="btn white" data-act="start" data-i="${n.idx}">${st === 'done' ? 'Zopakovat +20 XP' : 'Spustit zkoušku +20 XP'}</button>`;
    } else {
      const p = prog(n);
      body = `<div class="pop-t">${esc(n.title)}</div>
        <div class="pop-s">${st === 'done' ? 'Úroveň dokončena 👑 Můžeš opakovat.' : `Lekce ${Math.min(p + 1, n.lessons)} z ${n.lessons}`}</div>
        <button class="btn white" data-act="start" data-i="${n.idx}">${st === 'done' ? 'Opakovat +10 XP' : 'Začít +10 XP'}</button>`;
    }
    pop.innerHTML = `<div class="pop-arrow"></div>${body}`;
    wrap.appendChild(pop);
    const r = pop.getBoundingClientRect();
    if (r.bottom > innerHeight - 90) $('#content').scrollBy({ top: r.bottom - innerHeight + 110, behavior: 'smooth' });
  }

  /* ── záložka Znaky ── */
  function charsTab() {
    const seg = UI.chars;
    const segs = [['hira', 'Hiragana'], ['kata', 'Katakana'], ['words', 'Slovíčka']];
    let inner;
    if (seg === 'words') inner = wordsList();
    else {
      const kata = seg === 'kata';
      const conv = s => kata ? toKata(s) : s;
      const cell = ch => {
        if (!ch || ch === ' ') return '<div class="kc empty"></div>';
        const jp = conv(ch), it = ITEMS['k:' + jp];
        if (!it) return '<div class="kc empty"></div>';
        const m = mastery(it);
        return `<button class="kc ${m ? '' : 'dim'}" data-act="say" data-t="${jp}"><span class="jp">${jp}</span><small>${it.romaji}</small><i style="--p:${m * 100}%"></i></button>`;
      };
      const grid = (rows, cols, split) => `<div class="kgrid c${cols}">${rows.map(r => split(r).map(cell).join('')).join('')}</div>`;
      const chars = r => [...r];
      const pairs = r => r.match(/.[ゃゅょ]/g);
      const learnedN = learnedItems().filter(i => i.type === 'kana' && i.script === seg).length;
      inner = `
        <div class="chars-head">
          <h2>${kata ? 'Katakana' : 'Hiragana'} <span class="jp">${kata ? 'カタカナ' : 'ひらがな'}</span></h2>
          <p class="muted">Klepni na znak a uslyšíš ho. Lišta ukazuje, jak ho máš zmáknutý.</p>
          <button class="btn" data-act="practice-kana" data-v="${seg}" ${learnedN < 4 ? 'disabled' : ''}>Procvičit znaky</button>
        </div>
        <h3 class="sec">Základní</h3>${grid(KANA_TABLE.main, 5, chars)}
        <h3 class="sec">Čárky a kroužky</h3>${grid(KANA_TABLE.dak, 5, chars)}
        <h3 class="sec">Spojené slabiky</h3>${grid(kata ? KANA_TABLE.yoon.slice(0, 3).concat(['じゃじゅじょ']) : KANA_TABLE.yoon, 3, pairs)}
        ${kata ? `<h3 class="sec">Speciality pro cizí slova</h3><div class="kgrid c4">${ROWS.sp.split(' ').map(p => cell(p.split(':')[0])).join('')}</div>` : ''}`;
    }
    return `<div class="page">
      <div class="seg">${segs.map(([v, l]) => `<button class="${seg === v ? 'on' : ''}" data-act="chars" data-v="${v}">${l}</button>`).join('')}</div>
      ${inner}
    </div>`;
  }

  function wordsList() {
    const list = learnedItems().filter(i => i.type === 'word' || i.type === 'kanji');
    if (!list.length) return `<div class="empty-state">${mochi('normal', 110)}<p>Zatím žádná slovíčka. Dokonči lekci s novými slovy a objeví se tady 📚</p></div>`;
    return `
      <div class="chars-head"><h2>Moje slovíčka</h2><p class="muted">${list.length} ${plural(list.length, 'slovo', 'slova', 'slov')} v tvém slovníčku</p></div>
      <input class="search" id="wsearch" type="search" placeholder="Hledat (česky, romaji, kana)…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <div class="wlist">${list.map(i => `
        <button class="wrow" data-act="say" data-t="${esc(i.say)}" data-s="${esc((i.cz + ' ' + i.romaji + ' ' + i.jp + ' ' + (i.kanji || '') + ' ' + (i.kana || '')).toLowerCase())}">
          <span class="wj jp">${esc(i.jp)}${i.kanji ? `<small>${esc(i.kanji)}</small>` : ''}${i.kana && i.kana !== i.jp ? `<small>${esc(i.kana)}</small>` : ''}</span>
          <span class="wm"><b>${esc(i.cz)}</b><small>${esc(i.romaji)}</small></span>
          <span class="wbar"><i style="--p:${mastery(i) * 100}%"></i></span>
        </button>`).join('')}</div>`;
  }

  /* ── záložka Procvičit ── */
  function practiceTab() {
    const n = learnedItems().length;
    const ok = n >= 4;
    const card = (id, ic, t, d, cls = '') => `
      <button class="pcard ${cls}" data-act="practice" data-v="${id}" ${ok ? '' : 'disabled'}>
        <span class="pc-ic">${ic}</span><span class="pc-t"><b>${t}</b><small>${d}</small></span><span class="pc-go">›</span>
      </button>`;
    return `<div class="page">
      <div class="hero">${mochi('happy', 96)}<div><h2>Procvičování</h2><p class="muted">${ok ? 'Opakování je matka moudrosti. A taky ti dá srdíčko ❤️' : 'Nejdřív dokonči aspoň jednu lekci, ať je co procvičovat 🙏'}</p></div></div>
      ${card('smart', '🧠', 'Chytré opakování', 'Zaměří se na to, co ti nejde. +1 ❤️')}
      ${card('lazy', '🦥', 'Líný mód', 'Jen 5 lehkých otázek. Na gauči, bez stresu.', 'lazy')}
      ${canListen() ? card('listen', '🎧', 'Poslech', 'Trénuj ucho – jen poslechová cvičení') : ''}
      ${card('type', '⌨️', 'Psaní romaji', 'Přepisuj japonštinu do latinky')}
      ${!canListen() && HAS_TTS && VOICES_READY ? '<p class="note">🔇 Na tomhle zařízení chybí japonský hlas, takže poslech je vypnutý.</p>' : ''}
    </div>`;
  }

  function startPractice(kind) {
    const items = learnedItems(), sents = learnedSents();
    if (items.length < 4) return toast('Nejdřív dokonči aspoň jednu lekci 🙏');
    let steps;
    if (kind === 'smart') {
      const weak = items.slice().sort((a, b) => weakness(b) - weakness(a)).slice(0, 8);
      const ws = sents.slice().sort((a, b) => weakness(b) - weakness(a)).slice(0, 4);
      steps = generate({ items: weak, sents: ws, size: 12 });
    } else if (kind === 'lazy') {
      steps = generate({ items: shuffle(items).slice(0, 8), size: 5, mode: 'lazy' });
    } else if (kind === 'listen') {
      steps = generate({ items: items.filter(i => i.type !== 'kanji'), sents, size: 10, mode: 'listen' });
    } else if (kind === 'type') {
      steps = generate({ items: items.filter(i => i.romaji.replace(/ /g, '').length <= 14), size: 10, mode: 'type' });
    }
    startLesson({ steps, kind: kind === 'lazy' ? 'lazy' : 'practice', title: 'Procvičování' });
  }

  /* ── záložka Úkoly ── */
  function questsTab() {
    ensureQuests();
    const dx = dayXP(), pct = clamp(dx / S.goal, 0, 1);
    const left = new Date(); left.setHours(24, 0, 0, 0);
    const mins = Math.round((left - Date.now()) / 60000);
    const shopItem = (id, ic, t, d, price, dis) => `
      <div class="shop-row"><span class="si-ic">${ic}</span><span class="si-t"><b>${t}</b><small>${d}</small></span>
      <button class="btn small ${dis ? '' : 'blue'}" data-act="buy" data-v="${id}" ${dis ? 'disabled' : ''}>💎 ${price}</button></div>`;
    return `<div class="page">
      <div class="goal-card">
        <div class="goal-ring" style="--p:${pct * 360}deg"><span>${pct >= 1 ? '✓' : Math.round(pct * 100) + '%'}</span></div>
        <div><h2>Denní cíl</h2><p class="muted">${dx} / ${S.goal} XP dnes${pct >= 1 ? ' – splněno! 🎉' : ''}</p></div>
      </div>
      <h3 class="sec">Denní úkoly <small class="muted">· nové za ${Math.floor(mins / 60)} h ${mins % 60} min</small></h3>
      <div class="quests">${S.quests.list.map((q, i) => {
        const Q = QUESTS[q.k], done = q.p >= q.n;
        return `<div class="quest ${q.claimed ? 'claimed' : ''}">
          <span class="q-ic">${Q.ic}</span>
          <div class="q-main"><b>${Q.txt(q.n)}</b>
            <div class="bar"><div class="fill" style="width:${clamp(q.p / q.n, 0, 1) * 100}%"></div><span>${Math.min(q.p, q.n)} / ${q.n}</span></div>
          </div>
          ${q.claimed ? '<span class="q-done">✓</span>' : `<button class="btn small ${done ? 'gold' : ''}" data-act="claim" data-i="${i}" ${done ? '' : 'disabled'}>🎁 ${q.gems}</button>`}
        </div>`;
      }).join('')}</div>
      <h3 class="sec">Obchod <small class="muted">· máš ${S.gems} 💎</small></h3>
      <div class="shop">
        ${shopItem('hearts', '❤️', 'Doplnit srdíčka', 'Hned zpátky na plných 5', PRICE.hearts, S.gems < PRICE.hearts || S.hearts >= MAX_HEARTS || !heartsOn())}
        ${shopItem('freeze', '🧊', 'Zmrazení série', `Ochrání sérii, když den vynecháš (máš ${S.freezes}/2)`, PRICE.freeze, S.gems < PRICE.freeze || S.freezes >= 2)}
        ${shopItem('boost', '⚡', 'Dvojnásobné XP', '15 minut dvojnásobných XP', PRICE.boost, S.gems < PRICE.boost || boostOn())}
      </div>
    </div>`;
  }

  /* ── záložka Profil ── */
  const WD = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

  function profileTab() {
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
    const vals = days.map(d => dayXP(dayKey(d)));
    const max = Math.max(S.goal, ...vals);
    const setRow = (k, t, d) => `
      <label class="set-row"><span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span>
      <input type="checkbox" class="switch" data-set="${k}" ${S.set[k] ? 'checked' : ''}></label>`;
    return `<div class="page">
      <div class="profile-head">
        <div class="avatar">${mochi('happy', 84)}</div>
        <div class="ph-main">
          <input class="name-input" id="nameInput" value="${esc(S.name)}" placeholder="Tvoje jméno" maxlength="24" autocomplete="off">
          <p class="muted">Učíš se od ${new Date(S.created).toLocaleDateString('cs-CZ')}</p>
        </div>
      </div>
      <h3 class="sec">Statistiky</h3>
      <div class="stats">
        <div class="stat"><span>🔥</span><b>${S.streak}</b><small>série (rekord ${S.best})</small></div>
        <div class="stat"><span>⚡</span><b>${S.xp}</b><small>XP celkem</small></div>
        <div class="stat"><span>📚</span><b>${wordsLearned()}</b><small>naučených slov</small></div>
        <div class="stat"><span>🏁</span><b>${S.lessons}</b><small>dokončených lekcí</small></div>
      </div>
      <h3 class="sec">Tento týden</h3>
      <div class="chart">${days.map((d, i) => `
        <div class="col ${i === 6 ? 'today' : ''}"><span class="v">${vals[i] || ''}</span><div class="b" style="height:${Math.max(3, vals[i] / max * 100)}%"></div><span class="l">${WD[d.getDay()]}</span></div>`).join('')}
        <div class="goal-line" style="bottom:calc(${S.goal / max * 100}% * .72 + 24px)"><span>cíl</span></div>
      </div>
      <h3 class="sec">Úspěchy <small class="muted">· ${Object.keys(S.ach).length}/${ACH.length}</small></h3>
      <div class="achs">${ACH.map(a => `
        <div class="ach ${S.ach[a.id] ? 'on' : ''}"><span class="a-ic">${a.ic}</span><b>${a.t}</b><small>${a.d}</small></div>`).join('')}</div>
      <h3 class="sec">Nastavení</h3>
      <div class="settings">
        <div class="set-row"><span><b>Denní cíl</b><small>Kolik XP chceš denně nasbírat</small></span></div>
        <div class="seg goal-seg">${[[10, '🐢 10'], [20, '🙂 20'], [30, '💪 30'], [50, '🔥 50']].map(([v, l]) => `<button class="${S.goal === v ? 'on' : ''}" data-act="goal" data-v="${v}">${l}</button>`).join('')}</div>
        ${setRow('sfx', 'Zvukové efekty')}
        ${setRow('tts', 'Japonský hlas', HAS_TTS ? (VOICES_READY && !JA_VOICE ? 'Na tomhle zařízení chybí japonský hlas' : 'Předčítání slov a vět') : 'Prohlížeč nepodporuje předčítání')}
        ${setRow('slow', 'Pomalejší hlas', 'Hodí se na začátku')}
        ${setRow('romaji', 'Zobrazovat romaji', 'Nápověda latinkou pod japonštinou')}
        ${setRow('cz', 'Česká výslovnost', 'Např. shi → ši, chi → či')}
        ${setRow('hearts', 'Srdíčka', 'Vypni a máš nekonečno životů')}
      </div>
      <h3 class="sec">Data</h3>
      <div class="settings">
        <button class="set-row link" data-act="export"><span><b>📤 Zálohovat postup</b><small>Zkopíruj si kód zálohy</small></span>›</button>
        <button class="set-row link" data-act="import"><span><b>📥 Obnovit ze zálohy</b><small>Vlož kód zálohy</small></span>›</button>
        <button class="set-row link danger" data-act="reset"><span><b>🗑️ Smazat postup</b><small>Začneš úplně od nuly</small></span>›</button>
      </div>
      <p class="about">Japonsky · vyrobeno s ❤️ pro Čechy, co chtějí do Japonska<br>がんばって！ (Ganbatte – drž se!)</p>
    </div>`;
  }

  const TAB = { learn: learnTab, chars: charsTab, practice: practiceTab, quests: questsTab, profile: profileTab };

  function mountTab() {
    const ws = $('#wsearch');
    if (ws) ws.addEventListener('input', () => {
      const q = ws.value.toLowerCase().trim();
      $$('.wrow').forEach(r => { r.hidden = q && !r.dataset.s.includes(q); });
    });
    const ni = $('#nameInput');
    if (ni) ni.addEventListener('change', () => { S.name = ni.value.trim(); save(); toast('Jméno uloženo ✓'); });
    $$('[data-set]').forEach(sw => sw.addEventListener('change', () => {
      S.set[sw.dataset.set] = sw.checked; save();
      if (sw.dataset.set === 'hearts') refreshTop();
      if (sw.dataset.set === 'tts' && sw.checked) speak('こんにちは');
    }));
  }

  /* ═════════════ Spodní panely (sheets) a toasty ═════════════ */
  function sheet(html, cls = '') {
    closeSheet(true);
    const el = document.createElement('div');
    el.className = 'sheet-wrap ' + cls;
    el.innerHTML = `<div class="sheet-bg" data-act="close-sheet"></div><div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
    return el;
  }
  function closeSheet(now) {
    $$('.sheet-wrap').forEach(el => {
      if (now) return el.remove();
      el.classList.remove('open');
      setTimeout(() => el.remove(), 260);
    });
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2400);
  }

  function weekDots() {
    return [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 6 + i);
      const on = dayXP(dayKey(d)) > 0;
      return `<span class="wd ${on ? 'on' : ''} ${i === 6 ? 'today' : ''}"><i>${on ? '🔥' : ''}</i>${WD[d.getDay()]}</span>`;
    }).join('');
  }

  function streakSheet() {
    const today = S.lastDay === dayKey();
    sheet(`<div class="center">
      <div class="big-emoji ${today ? '' : 'grey'}">🔥</div>
      <h2>${S.streak} ${plural(S.streak, 'den', 'dny', 'dní')} v řadě</h2>
      <p class="muted">${today ? 'Dnes máš splněno, ty jedeš! 🙌' : S.streak ? 'Dnes ještě nemáš lekci – nenech sérii vyhasnout! 🥺' : 'Dokonči lekci a zapal sérii.'}</p>
      <div class="week">${weekDots()}</div>
      <p class="muted small">🧊 Zmrazení série: ${S.freezes}/2 · rekord: ${S.best} ${plural(S.best, 'den', 'dny', 'dní')}</p>
      <button class="btn" data-act="close-sheet">Jasně</button></div>`);
  }

  function heartsSheet(inLesson) {
    tickHearts();
    const ms = nextHeartIn();
    const mm = Math.floor(ms / 60000), ss = Math.floor(ms % 60000 / 1000);
    sheet(`<div class="center">
      <div class="hearts-row">${[...Array(MAX_HEARTS)].map((_, i) => `<span class="${i < S.hearts ? '' : 'empty'}">❤️</span>`).join('')}</div>
      <h2>${!heartsOn() ? 'Nekonečná srdíčka ∞' : S.hearts >= MAX_HEARTS ? 'Máš plno srdíček!' : S.hearts ? `Máš ${S.hearts} ${plural(S.hearts, 'srdíčko', 'srdíčka', 'srdíček')}` : 'Došla ti srdíčka 💔'}</h2>
      <p class="muted">${!heartsOn() ? 'Srdíčka máš vypnutá v nastavení.' : S.hearts >= MAX_HEARTS ? 'Za každou chybu v lekci přijdeš o jedno.' : `Další srdíčko za ${mm}:${String(ss).padStart(2, '0')}. Procvičováním získáš jedno hned.`}</p>
      ${heartsOn() && S.hearts < MAX_HEARTS ? `
        <button class="btn blue" data-act="buy" data-v="hearts" ${S.gems < PRICE.hearts ? 'disabled' : ''}>Doplnit za 💎 ${PRICE.hearts}</button>
        ${inLesson ? '<button class="btn ghost" data-act="quit-now">Ukončit lekci</button>' : '<button class="btn ghost" data-act="go-practice">Procvičit a získat ❤️</button>'}` : '<button class="btn" data-act="close-sheet">OK</button>'}
    </div>`, inLesson ? 'locked' : '');
  }

  function shopSheet() {
    sheet(`<div class="center"><div class="big-emoji">💎</div><h2>Máš ${S.gems} drahokamů</h2>
      <p class="muted">Drahokamy dostáváš za lekce a denní úkoly. Utratit je můžeš v obchodě v záložce Úkoly.</p>
      <button class="btn blue" data-act="go-shop">Do obchodu</button></div>`);
  }

  function tipsSheet(u) {
    sheet(`<div class="tips" style="--u:${u.color}">
      <div class="tips-head"><span class="tips-ic">${u.icon}</span><div><small>Jednotka ${u.idx + 1}</small><h2>${esc(u.title)}</h2></div></div>
      ${u.tips}
      <h3 class="sec">Co se naučíš</h3>
      <div class="tips-items">${u.items.slice(0, 40).map(i => `<button class="chip" data-act="say" data-t="${esc(i.say)}"><span class="jp">${esc(i.jp)}</span><small>${esc(i.type === 'kana' ? i.romaji : i.cz)}</small></button>`).join('')}</div>
      <button class="btn" data-act="close-sheet">Rozumím</button></div>`, 'tall');
  }

  /* ═════════════ Lekce ═════════════ */
  let L = null;
  const ov = $('#overlay');

  function startLesson(cfg) {
    tickHearts();
    const usesHearts = heartsOn() && (cfg.kind === 'lesson' || cfg.kind === 'test');
    if (usesHearts && S.hearts <= 0) return heartsSheet();
    if (!cfg.steps || !cfg.steps.length) return toast('Tady zatím není co procvičit 🤷');
    closePop(); closeSheet(true);
    ac();
    L = Object.assign({
      queue: cfg.steps.slice(), total: cfg.steps.length, done: 0, mistakes: 0, combo: 0, maxCombo: 0,
      answered: 0, right: 0, t0: Date.now(), usesHearts, listenDone: 0, lives: cfg.kind === 'jump' ? 3 : null,
    }, cfg);
    ov.innerHTML = `
      <div class="lesson">
        <div class="l-top">
          <button class="l-x" data-act="quit" aria-label="Zavřít">✕</button>
          <div class="l-bar"><div class="l-fill" id="lfill"></div><div class="l-combo" id="lcombo"></div></div>
          <div class="l-hearts" id="lhearts"></div>
        </div>
        <div class="l-body" id="lbody"></div>
        <div class="l-foot" id="lfoot"></div>
      </div>`;
    ov.classList.add('open');
    document.body.classList.add('in-lesson');
    nextStep();
  }

  function updateLessonTop() {
    if (!L) return;
    $('#lfill').style.width = (L.done / L.total * 100) + '%';
    const h = $('#lhearts');
    if (L.lives != null) h.innerHTML = `<span class="lh">❤️ ${L.lives}</span>`;
    else if (L.usesHearts) h.innerHTML = `<span class="lh ${S.hearts <= 1 ? 'low' : ''}">❤️ ${S.hearts}</span>`;
    else h.innerHTML = '<span class="lh inf">❤️ ∞</span>';
  }

  function nextStep() {
    if (!L.queue.length) return finishLesson(false);
    const ex = L.queue.shift();
    // když uživatel nemůže poslouchat, nahraď poslechové cvičení jiným
    if (L.noListen && (ex.t === 'listen' || ex.t === 'lb')) {
      const alt = ex.t === 'lb' ? sentEx(ex.item, 'b2c', learnedSents(), learnedItems()) : itemEx(ex.item, FIRST[ex.item.type], learnedItems());
      L.queue.unshift(alt);
      return nextStep();
    }
    L.ex = ex; L.phase = 'answer'; L.sel = null; L.chosen = [];
    updateLessonTop();
    const body = $('#lbody');
    body.innerHTML = renderEx(ex);
    body.scrollTop = 0;
    body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
    footCheck(ex.t === 'intro' ? 'Pokračovat' : 'Zkontrolovat', ex.t === 'intro');
    if (ex.t === 'match') $('#lfoot').innerHTML = '<div class="match-hint">Klepni na dvojice, které k sobě patří 👆</div>';
    mountEx(ex);
  }

  function footCheck(label, enabled) {
    $('#lfoot').className = 'l-foot';
    $('#lfoot').innerHTML = `
      ${['listen', 'lb'].includes(L.ex.t) ? '<button class="link-btn" data-act="no-listen">🔇 Teď nemůžu poslouchat</button>' : ''}
      <button class="btn" id="checkBtn" data-act="check" ${enabled ? '' : 'disabled'}>${label}</button>`;
  }
  const enableCheck = on => { const b = $('#checkBtn'); if (b) b.disabled = !on; };

  /* ── vykreslení jednotlivých cvičení ── */
  const TITLES = {
    k2r: () => 'Jak se čte tento znak?',
    r2k: it => `Vyber znak pro „${esc(it.romaji)}“`,
    listen: it => it.type === 'kana' ? 'Který znak slyšíš?' : 'Co slyšíš?',
    w2c: () => 'Co to znamená?',
    c2w: it => `Jak se řekne „${esc(it.cz)}“?`,
    j2c: () => 'Co znamená toto kanji?',
    c2j: it => `Které kanji znamená „${esc(it.cz)}“?`,
    j2r: () => 'Jak se čte toto kanji?',
    type: it => it.type === 'kana' ? 'Napiš čtení v romaji' : 'Přepiš do romaji',
    match: () => 'Spoj dvojice',
    b2c: () => 'Přelož do češtiny',
    b2j: () => 'Přelož do japonštiny',
    lb: () => 'Poslechni si a slož větu',
  };

  const hint = r => {
    if (!S.set.romaji) return '';
    const cz = czRead(r);
    return `<div class="hint">${esc(r)}${S.set.cz && cz !== r ? ` <span class="czh">🇨🇿 ${esc(cz)}</span>` : ''}</div>`;
  };
  const spk = (text, cls = '') => `<button class="spk ${cls}" data-act="say" data-t="${esc(text)}" aria-label="Přehrát">🔊</button>`;

  function renderEx(ex) {
    const it = ex.item;
    if (ex.t === 'intro') return renderIntro(it);
    if (ex.t === 'match') return `<h2 class="ex-title">${TITLES.match()}</h2>${renderMatch(ex)}`;
    if (ex.t === 'type') return `<h2 class="ex-title">${TITLES.type(it)}</h2>${renderType(ex)}`;
    if (ex.tiles) return `<h2 class="ex-title">${TITLES[ex.t]()}</h2>${renderBuild(ex)}`;
    return `<h2 class="ex-title">${TITLES[ex.t](it)}</h2>${renderPrompt(ex)}${renderOpts(ex)}`;
  }

  function renderIntro(it) {
    const label = { kana: 'Nový znak', word: 'Nové slovo', kanji: 'Nové kanji' }[it.type];
    const cz = czRead(it.romaji);
    return `
      <h2 class="ex-title"><span class="new-badge">NOVÉ</span> ${label}</h2>
      <div class="intro-card">
        ${it.kanji ? `<div class="ic-kanji jp">${esc(it.kanji)}</div>` : ''}
        <button class="ic-jp jp ${it.jp.length > 5 ? 'long' : ''}" data-act="say" data-t="${esc(it.say)}">${esc(it.jp)}</button>
        ${it.kana && it.kana !== it.jp ? `<div class="ic-kana jp">${esc(it.kana)}</div>` : ''}
        <div class="ic-romaji">${esc(it.romaji)}</div>
        ${cz !== it.romaji ? `<div class="ic-cz">🇨🇿 čti jako <b>${esc(cz)}</b></div>` : ''}
        ${it.cz ? `<div class="ic-mean">${esc(it.cz)}</div>` : ''}
        ${it.note ? `<div class="ic-note">💡 ${esc(it.note)}</div>` : ''}
        <div class="ic-audio">${spk(it.say, 'big')}${spk(it.say, 'big slow')}</div>
      </div>`;
  }

  function renderPrompt(ex) {
    const it = ex.item;
    switch (ex.t) {
      case 'k2r':
      case 'j2c':
      case 'j2r':
        return `<div class="prompt"><div class="big-char jp">${esc(it.jp)}</div></div>`;
      case 'r2k':
        return `<div class="prompt"><div class="big-romaji">${esc(it.romaji)}</div>${S.set.cz && czRead(it.romaji) !== it.romaji ? `<div class="czh">🇨🇿 ${esc(czRead(it.romaji))}</div>` : ''}</div>`;
      case 'listen':
        return `<div class="prompt listen">${spk(it.say, 'huge')}${spk(it.say, 'mid slow')}</div>`;
      case 'w2c':
        return `<div class="prompt speech">${mochi('normal', 90)}<div class="bubble">
          ${it.kanji ? `<div class="kanji-hint jp">${esc(it.kanji)}</div>` : ''}
          <div class="bubble-jp jp">${esc(it.jp)} ${spk(it.say)}</div>${hint(it.romaji)}</div></div>`;
      default: // c2w, c2j
        return `<div class="prompt speech">${mochi('normal', 90)}<div class="bubble"><div class="bubble-cz">${esc(it.cz)}</div></div></div>`;
    }
  }

  function renderOpts(ex) {
    const label = o => {
      switch (ex.t) {
        case 'k2r': return `<span class="o-romaji">${esc(o.romaji)}</span>`;
        case 'w2c': case 'j2c': return `<span class="o-cz">${esc(o.cz)}</span>`;
        case 'j2r': return `<span class="jp o-jp">${esc(o.kana)}</span>`;
        default: return `<span class="jp o-jp">${esc(o.jp)}</span>`;
      }
    };
    const wide = ['w2c', 'j2c', 'c2w'].includes(ex.t) || ex.opts.some(o => (CHOICE[ex.t].a(o) || '').length > 4);
    return `<div class="opts ${wide ? 'list' : 'grid'}">${ex.opts.map((o, i) => `
      <button class="opt" data-act="opt" data-i="${i}"><span class="key">${i + 1}</span>${label(o)}</button>`).join('')}</div>`;
  }

  function renderType(ex) {
    const it = ex.item;
    return `<div class="prompt speech">${mochi('normal', 90)}<div class="bubble">
        ${it.kanji ? `<div class="kanji-hint jp">${esc(it.kanji)}</div>` : ''}
        <div class="bubble-jp jp ${it.type !== 'word' ? 'xl' : ''}">${esc(it.jp)}</div>
        ${it.cz ? `<div class="bubble-sub">${esc(it.cz)}</div>` : ''}</div></div>
      <input class="type-in" id="typeIn" type="text" inputmode="latin" placeholder="Napiš romaji…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">`;
  }

  function renderBuild(ex) {
    const s = ex.item;
    let prompt;
    if (ex.t === 'b2c') {
      prompt = `<div class="prompt speech">${mochi('normal', 90)}<div class="bubble">
        <div class="sent-jp jp">${s.tokens.map(t => `<button class="tok" data-act="say" data-t="${esc(sayToken(t))}">${esc(t)}</button>`).join('')} ${spk(s.say)}</div>
        ${hint(s.romaji)}</div></div>`;
    } else if (ex.t === 'b2j') {
      prompt = `<div class="prompt speech">${mochi('normal', 90)}<div class="bubble"><div class="bubble-cz">${esc(s.cz[0])}</div></div></div>`;
    } else {
      prompt = `<div class="prompt listen">${spk(s.say, 'huge')}${spk(s.say, 'mid slow')}</div>`;
    }
    return `${prompt}
      <div class="answer" id="answer"></div>
      <div class="bank" id="bank">${ex.tiles.map(t => `<button class="tile ${ex.target === 'jp' ? 'jp' : ''}" data-act="tile" data-i="${t.i}">${esc(t.txt)}</button>`).join('')}</div>`;
  }

  function renderMatch(ex) {
    return `<div class="match">
      <div class="mcol">${ex.left.map(it => `<button class="mt ${it.type === 'kana' ? 'kana' : ''} jp" data-act="ml" data-id="${esc(it.id)}">${esc(it.jp)}</button>`).join('')}</div>
      <div class="mcol">${ex.right.map(it => `<button class="mt" data-act="mr" data-id="${esc(it.id)}">${esc(ex.rightOf(it))}</button>`).join('')}</div>
    </div>`;
  }

  function mountEx(ex) {
    const it = ex.item;
    if (ex.t === 'intro') setTimeout(() => speak(it.say), 250);
    if (ex.t === 'listen' || ex.t === 'lb' || ex.t === 'w2c' || ex.t === 'b2c') setTimeout(() => speak(it.say), 300);
    if (ex.t === 'type') {
      const inp = $('#typeIn');
      inp.addEventListener('input', () => enableCheck(inp.value.trim().length > 0));
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim()) doCheck(); } });
      setTimeout(() => inp.focus(), 80);
    }
    if (ex.t === 'match') { L.mSel = { l: null, r: null }; L.mDone = 0; L.mErr = false; }
  }

  /* ── interakce ── */
  function selectOpt(i) {
    if (!L || L.phase !== 'answer' || !L.ex.opts) return;
    L.sel = i;
    $$('.opt').forEach((b, j) => b.classList.toggle('sel', j === i));
    const o = L.ex.opts[i];
    if (['r2k', 'c2w', 'c2j', 'listen'].includes(L.ex.t)) speak(o.say);
    else sfx('tap');
    enableCheck(true);
  }

  function tapTile(btn) {
    if (!L || L.phase !== 'answer') return;
    const ex = L.ex, i = +btn.dataset.i, t = ex.tiles.find(x => x.i === i);
    if (btn.closest('#bank')) {
      if (btn.classList.contains('used')) return;
      btn.classList.add('used');
      L.chosen.push(i);
      const a = document.createElement('button');
      a.className = 'tile in ' + (ex.target === 'jp' ? 'jp' : '');
      a.dataset.act = 'tile'; a.dataset.i = i; a.textContent = t.txt;
      $('#answer').appendChild(a);
      if (ex.target === 'jp') speak(sayToken(t.txt)); else sfx('tap');
    } else {
      L.chosen = L.chosen.filter(x => x !== i);
      btn.remove();
      const b = $(`#bank .tile[data-i="${i}"]`);
      if (b) b.classList.remove('used');
    }
    enableCheck(L.chosen.length > 0);
  }

  function tapMatch(btn, side) {
    if (!L || L.phase !== 'answer' || btn.classList.contains('gone')) return;
    const ex = L.ex;
    $$(`.mcol .mt[data-act="${side === 'l' ? 'ml' : 'mr'}"]`).forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    L.mSel[side] = btn;
    const item = ITEMS[btn.dataset.id];
    if (side === 'l' && item.type !== 'kana') speak(item.say); else sfx('tap');
    const { l, r } = L.mSel;
    if (!l || !r) return;
    if (l.dataset.id === r.dataset.id) {
      [l, r].forEach(b => { b.classList.remove('sel'); b.classList.add('good'); setTimeout(() => b.classList.add('gone'), 300); });
      rec(item, true);
      sfx('pair');
      L.mDone++;
      L.mSel = { l: null, r: null };
      if (L.mDone >= ex.items.length) {
        L.phase = 'feedback';
        L.done++; L.answered++;
        if (!L.mErr) L.right++;
        setTimeout(() => showFeedback({ ok: true }), 350);
      }
    } else {
      [l, r].forEach(b => { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong', 'sel'), 450); });
      rec(ITEMS[l.dataset.id], false);
      L.mErr = true;
      sfx('bad');
      L.mSel = { l: null, r: null };
    }
  }

  function evaluate(ex) {
    const it = ex.item;
    if (ex.opts) {
      if (L.sel == null) return null;
      return { ok: L.sel === ex.ans };
    }
    if (ex.t === 'type') {
      const v = $('#typeIn').value.trim();
      if (!v) return null;
      const inp = canon(v);
      const targets = [it.romaji, ...(it.alts || [])].map(canon);
      if (targets.includes(inp)) return { ok: true };
      if (inp.length >= 4 && targets.some(t => lev(t, inp) <= 1)) return { ok: true, typo: true };
      return { ok: false };
    }
    if (ex.tiles) {
      if (!L.chosen.length) return null;
      const words = L.chosen.map(i => ex.tiles.find(t => t.i === i).txt);
      if (ex.target === 'cz') return { ok: it.cz.some(c => normCz(c) === normCz(words.join(' '))) };
      return { ok: it.jpAlts.includes(words.join('')) };
    }
    return null;
  }

  function correctAnswerHTML(ex) {
    const it = ex.item;
    const reading = `<span class="jp">${esc(it.kanji || '')} ${esc(it.jp)}</span> · ${esc(it.romaji)}${it.cz ? ' · ' + esc(it.cz) : ''}`;
    switch (ex.t) {
      case 'k2r': case 'r2k': case 'listen':
        return it.type === 'kana' ? `<span class="jp">${esc(it.jp)}</span> = ${esc(it.romaji)}` : reading;
      case 'type': return `${esc(it.romaji)}`;
      case 'j2r': case 'j2c': case 'c2j':
        return `<span class="jp">${esc(it.jp)}</span> (${esc(it.kana)}, ${esc(it.romaji)}) = ${esc(it.cz)}`;
      case 'b2c': return esc(it.cz[0]);
      case 'b2j': case 'lb': return `<span class="jp">${esc(it.tokens.join(' '))}</span><br><small>${esc(it.romaji)}</small>`;
      default: return reading;
    }
  }

  const PRAISE = ['Výborně!', 'Paráda!', 'Skvělé!', 'Super!', 'Přesně tak!', 'Bomba!', 'すごい！ Sugoi!', 'やった！ Jatta!', 'Jedeš! 🔥', 'Neskutečný!', 'Tak to je ono!'];
  const OOPS = ['Skoro!', 'Nevadí!', 'Ne tak úplně…', 'Příště to dáš!', 'Uff, vedle 😅'];

  function doCheck() {
    if (!L) return;
    const ex = L.ex;
    if (L.phase === 'feedback') return doNext();
    if (L.phase !== 'answer') return;
    if (ex.t === 'intro') { rec(ex.item, true); L.done++; return nextStep(); }
    const r = evaluate(ex);
    if (!r) return;
    L.phase = 'feedback';
    L.answered++;
    rec(ex.item, r.ok);
    if (r.ok) {
      L.right++; L.done++; L.combo++;
      L.maxCombo = Math.max(L.maxCombo, L.combo);
      questProgress('combo', L.combo, true);
      if (ex.t === 'listen' || ex.t === 'lb') L.listenDone++;
      sfx('ok');
      if (['r2k', 'c2w', 'type', 'b2j', 'lb', 'k2r', 'j2r', 'j2c'].includes(ex.t)) setTimeout(() => speak(ex.item.say), 150);
      if (L.combo >= 3 && L.combo % 1 === 0) showCombo(L.combo);
    } else {
      L.mistakes++; L.combo = 0;
      L.queue.push(ex);
      if (L.usesHearts) loseHeart();
      if (L.lives != null) L.lives = Math.max(0, L.lives - 1);
      sfx('bad');
      $('.lesson').classList.add('shake');
      setTimeout(() => { const l = $('.lesson'); if (l) l.classList.remove('shake'); }, 400);
    }
    markOpts(ex, r);
    showFeedback(r);
    updateLessonTop();
  }

  function markOpts(ex, r) {
    if (ex.opts) {
      $$('.opt').forEach((b, i) => {
        b.disabled = true;
        if (i === ex.ans) b.classList.add('good');
        else if (i === L.sel && !r.ok) b.classList.add('bad');
      });
    }
    if (ex.tiles) $$('.tile').forEach(b => { b.disabled = true; });
    if (ex.t === 'type') { const i = $('#typeIn'); i.readOnly = true; i.classList.add(r.ok ? 'good' : 'bad'); i.blur(); }
  }

  function showCombo(n) {
    const c = $('#lcombo');
    if (!c) return;
    c.textContent = `🔥 ${n} v řadě!`;
    c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
  }

  function showFeedback(r) {
    const ex = L.ex;
    const f = $('#lfoot');
    f.className = 'l-foot fb ' + (r.ok ? 'ok' : 'bad');
    let title, sub = '';
    if (r.ok && r.typo) { title = 'Překlep, ale beru 👀'; sub = `Správně: ${correctAnswerHTML(ex)}`; }
    else if (r.ok) {
      title = pick(PRAISE);
      if (ex.t !== 'match') sub = correctAnswerHTML(ex);
    } else { title = pick(OOPS); sub = `Správná odpověď: ${correctAnswerHTML(ex)}`; }
    f.innerHTML = `
      <div class="fb-row">
        <span class="fb-ic">${r.ok ? '✓' : '✕'}</span>
        <div class="fb-txt"><div class="fb-title">${title}</div>${sub ? `<div class="fb-sub">${sub}</div>` : ''}</div>
      </div>
      <button class="btn ${r.ok ? '' : 'red'}" id="checkBtn" data-act="check">${r.ok ? 'Pokračovat' : 'Rozumím'}</button>`;
  }

  function doNext() {
    if (!L || L.phase !== 'feedback') return;
    if (L.lives === 0) return finishLesson(true);
    if (L.usesHearts && S.hearts <= 0) return heartsSheet(true);
    nextStep();
  }

  function quitLesson() {
    sheet(`<div class="center">${mochi('sad', 110)}
      <h2>Fakt chceš skončit? 🥺</h2><p class="muted">Postup v téhle lekci se neuloží.</p>
      <button class="btn" data-act="close-sheet">Pokračovat v učení</button>
      <button class="btn ghost red-txt" data-act="quit-now">Ukončit</button></div>`);
  }

  function closeLesson() {
    L = null;
    closeSheet(true);
    ov.classList.remove('open');
    ov.innerHTML = '';
    document.body.classList.remove('in-lesson');
    render();
  }

  function finishLesson(failed) {
    const secs = Math.round((Date.now() - L.t0) / 1000);
    const acc = L.answered ? Math.round(L.right / L.answered * 100) : 100;
    if (failed) {
      sfx('bad');
      showResult(`
        <div class="result fail">${mochi('sad', 150)}
          <h1>Tentokrát to nevyšlo</h1>
          <p class="muted">Nevadí – projdi to pěkně krok za krokem a pak to zkus znovu 💪</p>
        </div>`, 'Zpět');
      return;
    }
    const perfect = L.mistakes === 0;
    const graded = L.kind === 'lesson' || L.kind === 'test' || L.kind === 'jump';
    let xp = { lesson: 10, test: 20, jump: 20, practice: 10, lazy: 5 }[L.kind] + (perfect && graded ? 5 : 0);
    if (boostOn()) xp *= 2;
    let gems = { lesson: 5, test: 15, jump: 15, practice: 5, lazy: 2 }[L.kind] + (perfect && graded ? 5 : 0);
    const before = dayXP();
    addXP(xp);

    if (L.kind === 'lesson') S.progress[L.node.id] = Math.min(L.node.lessons, prog(L.node) + 1);
    if (L.kind === 'test') { S.progress[L.node.id] = 1; S.flags.test = 1; }
    if (L.kind === 'jump') NODES.forEach(n => { if (n.idx < L.toIdx) S.progress[n.id] = n.lessons; });
    let heart = false;
    if (L.kind === 'practice' && heartsOn() && S.hearts < MAX_HEARTS) { S.hearts++; heart = true; }
    if (L.kind === 'practice' || L.kind === 'lazy') questProgress('practice');
    if (L.kind === 'lazy') S.flags.lazy = 1;

    S.lessons++;
    if (perfect) { S.perfect++; questProgress('perfect'); }
    questProgress('lessons');
    if (L.listenDone) questProgress('listen', L.listenDone);
    const h = new Date().getHours();
    if (h >= 22 || h < 4) S.flags.owl = 1;
    if (h >= 4 && h < 7) S.flags.bird = 1;

    const extended = markActive();
    const goalHit = before < S.goal && dayXP() >= S.goal;
    if (goalHit) gems += 10;
    S.gems += gems;
    const fresh = checkAch();
    save();

    sfx('done');
    confetti();
    const titles = { lesson: 'Lekce hotová!', test: 'Zkouška složena! 🏆', jump: 'Přeskočeno! ⏩', practice: 'Procvičeno!', lazy: 'Líný mód splněn 🦥' };
    const mm = Math.floor(secs / 60), ss = secs % 60;
    UI.afterResult = { extended, goalHit };
    showResult(`
      <div class="result">
        ${mochi('happy', 150, 'bounce')}
        <h1>${titles[L.kind]}</h1>
        <p class="muted">${perfect ? 'Bez jediné chyby, ty jsi legenda 💯' : pick(['Každý den kousek a budeš mluvit jak rodilý 🗾', 'Pěkná práce! がんばって！', 'Mochi je na tebe hrdý 🐱'])}</p>
        <div class="stat-cards">
          <div class="sc gold"><div class="sc-h">XP</div><div class="sc-v">⚡ ${xp}</div></div>
          <div class="sc green"><div class="sc-h">${perfect ? 'Dokonalé' : 'Přesnost'}</div><div class="sc-v">🎯 ${acc}%</div></div>
          <div class="sc blue"><div class="sc-h">Čas</div><div class="sc-v">⏱ ${mm}:${String(ss).padStart(2, '0')}</div></div>
        </div>
        <div class="rewards">
          <span>💎 +${gems}</span>
          ${heart ? '<span>❤️ +1</span>' : ''}
          ${goalHit ? '<span>🎯 Denní cíl splněn!</span>' : ''}
          ${L.maxCombo >= 5 ? `<span>🔥 ${L.maxCombo} v řadě</span>` : ''}
        </div>
        ${fresh.map(a => `<div class="new-ach"><span>${a.ic}</span><div><small>Nový úspěch!</small><b>${a.t}</b></div></div>`).join('')}
      </div>`, 'Pokračovat');
  }

  function showResult(html, btn) {
    ov.innerHTML = `<div class="lesson result-screen"><div class="l-body">${html}</div><div class="l-foot"><button class="btn" data-act="res-next">${btn}</button></div></div>`;
    L = null;
  }

  function afterResult() {
    const a = UI.afterResult || {};
    UI.afterResult = null;
    if (a.extended) {
      sfx('coin');
      ov.innerHTML = `<div class="lesson result-screen"><div class="l-body"><div class="result streak-screen">
          <div class="streak-num">🔥<b>${S.streak}</b></div>
          <h1>${S.streak} ${plural(S.streak, 'den', 'dny', 'dní')} v řadě!</h1>
          <p class="muted">${S.streak === 1 ? 'Série začíná! Zítra přijď zas a rozfoukej ji 🔥' : 'Jen tak dál, nepřestávej! 🙌'}</p>
          <div class="week">${weekDots()}</div>
        </div></div><div class="l-foot"><button class="btn" data-act="res-next">Pokračovat</button></div></div>`;
      return;
    }
    closeLesson();
  }

  /* ── konfety ── */
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    document.body.appendChild(c);
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
    const ctx = c.getContext('2d');
    const cols = ['#ff6b9d', '#ffc800', '#58cc02', '#1cb0f6', '#a560e8', '#ff9600', '#e63946'];
    const P = [...Array(140)].map(() => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
      vx: (Math.random() - 0.5) * 22 * dpr, vy: (-Math.random() * 18 - 6) * dpr,
      s: (Math.random() * 6 + 5) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: pick(cols),
    }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      P.forEach(p => {
        p.vy += 0.6 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (++f < 150) requestAnimationFrame(tick); else c.remove();
    })();
  }

  /* ═════════════ Úvodní průvodce ═════════════ */
  let OB = { step: 0, goal: 20, level: 'zero' };

  function renderOnboarding() {
    const steps = [
      () => `
        <div class="ob-hero">${mochi('happy', 170, 'bounce')}</div>
        <h1>こんにちは！<br>Já jsem Mochi 🐱</h1>
        <p class="muted">Naučím tě japonsky – po malých kouscích, každý den. Hiragana, katakana, slovíčka i první věty. Všechno česky.</p>`,
      () => `
        <div class="ob-small">${mochi('normal', 90)}<div class="bubble">Kolik času chceš denně dávat?</div></div>
        <div class="ob-opts">${[[10, '🐢', 'Pohodička', '10 XP denně'], [20, '🙂', 'Normálka', '20 XP denně'], [30, '💪', 'Vážně', '30 XP denně'], [50, '🔥', 'Šílenec', '50 XP denně']].map(([v, ic, t, d]) => `
          <button class="ob-opt ${OB.goal === v ? 'on' : ''}" data-act="ob-goal" data-v="${v}"><span>${ic}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div>`,
      () => `
        <div class="ob-small">${mochi('normal', 90)}<div class="bubble">Umíš už něco japonsky?</div></div>
        <div class="ob-opts">
          <button class="ob-opt ${OB.level === 'zero' ? 'on' : ''}" data-act="ob-level" data-v="zero"><span>🌱</span><b>Jsem úplný začátečník</b><small>Začnu hiraganou od nuly</small></button>
          <button class="ob-opt ${OB.level === 'hira' ? 'on' : ''}" data-act="ob-level" data-v="hira"><span>🎌</span><b>Umím hiraganu</b><small>Krátký test a skočím na slovíčka</small></button>
        </div>`,
    ];
    app.innerHTML = `
      <div class="onboarding">
        <div class="ob-top">${OB.step ? '<button class="l-x" data-act="ob-back">‹</button>' : '<span></span>'}<div class="l-bar"><div class="l-fill" style="width:${(OB.step + 1) / steps.length * 100}%"></div></div></div>
        <div class="ob-body">${steps[OB.step]()}</div>
        <div class="ob-foot"><button class="btn" data-act="ob-next">${OB.step === 0 ? 'Jdeme na to!' : 'Pokračovat'}</button></div>
      </div>`;
  }

  function obNext() {
    if (OB.step < 2) { OB.step++; sfx('tap'); return renderOnboarding(); }
    S.goal = OB.goal;
    S.onboarded = true;
    save();
    render();
    if (OB.level === 'hira') startJump(UNITS.findIndex(u => u.id === 'w1'));
    else maybeInstallHint();
  }

  function startJump(ui) {
    const u = UNITS[ui];
    const before = UNITS.slice(0, ui);
    const items = before.flatMap(x => x.items);
    const sents = before.flatMap(x => x.sents);
    if (!items.length) return;
    const steps = generate({ items: shuffle(items).slice(0, 30), sents: shuffle(sents).slice(0, 6), size: 14, match: false });
    startLesson({ steps, kind: 'jump', toIdx: u.nodes[0].idx, title: 'Přeskočení' });
  }

  /* ── tip na instalaci (iOS) ── */
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  function maybeInstallHint() {
    if (!isIOS || standalone || S.installHint) return;
    S.installHint = true; save();
    setTimeout(() => sheet(`<div class="center">
      <div class="big-emoji">📲</div><h2>Dej si mě na plochu!</h2>
      <p class="muted">Pak se Japonsky spouští jako normální appka, na celou obrazovku a funguje i offline.</p>
      <ol class="steps"><li>Klepni dole na <b>Sdílet</b> <span class="ios-share"></span></li><li>Vyber <b>Přidat na plochu</b> ➕</li><li>Potvrď <b>Přidat</b> ✓</li></ol>
      <button class="btn" data-act="close-sheet">Jasně, díky</button></div>`), 600);
  }

  /* ═════════════ Akce (delegace kliknutí) ═════════════ */
  const ACT = {
    tab(el) { UI.tab = el.dataset.v; closePop(); render(); $('#content').scrollTop = 0; if (UI.tab === 'learn') scrollToCurrent(); },
    node(el) { showNodePop(el); },
    start(el) {
      const n = NODES[+el.dataset.i];
      startLesson({ steps: lessonFor(n), kind: n.kind === 'test' ? 'test' : 'lesson', node: n });
    },
    tips(el) { tipsSheet(UNITS[+el.dataset.u]); },
    jump(el) {
      const u = UNITS[+el.dataset.u];
      sheet(`<div class="center"><div class="big-emoji">⏩</div><h2>Přeskočit na „${esc(u.title)}“?</h2>
        <p class="muted">Dostaneš test ze všeho před touhle jednotkou. Máš 3 životy – když to dáš, odemkne se všechno až sem.</p>
        <button class="btn" data-act="jump-go" data-u="${u.idx}">Spustit test</button>
        <button class="btn ghost" data-act="close-sheet">Radši ne</button></div>`);
    },
    'jump-go'(el) { startJump(+el.dataset.u); },
    say(el) { speak(el.dataset.t, el.classList.contains('slow')); },
    chars(el) { UI.chars = el.dataset.v; render(); },
    'practice-kana'(el) {
      const items = learnedItems().filter(i => i.type === 'kana' && i.script === el.dataset.v);
      startLesson({ steps: generate({ items: items.slice().sort((a, b) => weakness(b) - weakness(a)).slice(0, 15), size: 12 }), kind: 'practice' });
    },
    practice(el) { startPractice(el.dataset.v); },
    claim(el) {
      const q = S.quests.list[+el.dataset.i];
      if (!q || q.claimed || q.p < q.n) return;
      q.claimed = true; S.gems += q.gems; checkAch(); save();
      sfx('coin'); toast(`🎁 +${q.gems} 💎`);
      render();
    },
    buy(el) {
      const k = el.dataset.v;
      if (S.gems < PRICE[k]) return toast('Málo drahokamů 💎😭');
      if (k === 'hearts') { if (S.hearts >= MAX_HEARTS) return; S.hearts = MAX_HEARTS; S.heartTs = Date.now(); }
      if (k === 'freeze') { if (S.freezes >= 2) return; S.freezes++; }
      if (k === 'boost') { if (boostOn()) return; S.boost = Date.now() + 15 * 60e3; }
      S.gems -= PRICE[k]; save(); sfx('coin');
      toast({ hearts: '❤️ Srdíčka doplněna!', freeze: '🧊 Zmrazení série koupeno', boost: '⚡ 2× XP na 15 minut!' }[k]);
      if (L) { closeSheet(); updateLessonTop(); if (L.phase === 'feedback') nextStep(); return; }
      closeSheet(); render();
    },
    streak() { streakSheet(); },
    hearts() { heartsSheet(false); },
    shop() { shopSheet(); },
    'go-shop'() { closeSheet(); UI.tab = 'quests'; render(); setTimeout(() => { const s = $('.shop'); if (s) s.scrollIntoView({ behavior: 'smooth' }); }, 50); },
    'go-practice'() { closeSheet(); UI.tab = 'practice'; render(); },
    'close-sheet'() { if ($('.sheet-wrap.locked')) return; closeSheet(); },
    goal(el) { S.goal = +el.dataset.v; save(); render(); },
    export() {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
      sheet(`<div class="center"><h2>📤 Záloha postupu</h2><p class="muted">Zkopíruj si tenhle kód a schovej ho (třeba do Poznámek). Na jiném zařízení ho vložíš přes „Obnovit ze zálohy“.</p>
        <textarea class="code" id="codeOut" readonly>${code}</textarea>
        <button class="btn blue" data-act="copy">Zkopírovat</button><button class="btn ghost" data-act="close-sheet">Zavřít</button></div>`);
    },
    copy() {
      const t = $('#codeOut');
      t.select();
      (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => toast('Zkopírováno ✓'), () => { document.execCommand('copy'); toast('Zkopírováno ✓'); });
    },
    import() {
      sheet(`<div class="center"><h2>📥 Obnovit ze zálohy</h2><p class="muted">Vlož kód zálohy. Současný postup se tím přepíše.</p>
        <textarea class="code" id="codeIn" placeholder="Sem vlož kód…"></textarea>
        <button class="btn" data-act="import-go">Obnovit</button><button class="btn ghost" data-act="close-sheet">Zrušit</button></div>`);
    },
    'import-go'() {
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob($('#codeIn').value.trim()))));
        if (!s || !s.v) throw new Error('bad');
        S = Object.assign(defaults(), s, { set: Object.assign(defaults().set, s.set || {}) });
        save(); closeSheet(); toast('Postup obnoven ✓'); render();
      } catch (e) { toast('Tenhle kód nefunguje 😕'); }
    },
    reset() {
      sheet(`<div class="center">${mochi('sad', 100)}<h2>Smazat všechno?</h2><p class="muted">Přijdeš o sérii, XP i všechen postup. Tohle nejde vrátit.</p>
        <button class="btn red" data-act="reset-go">Ano, smazat</button><button class="btn ghost" data-act="close-sheet">Ne, nechci</button></div>`);
    },
    'reset-go'() { try { localStorage.removeItem(KEY); } catch (e) { /* nic */ } location.reload(); },

    // lekce
    check() { doCheck(); },
    opt(el) { selectOpt(+el.dataset.i); },
    tile(el) { tapTile(el); },
    ml(el) { tapMatch(el, 'l'); },
    mr(el) { tapMatch(el, 'r'); },
    quit() { quitLesson(); },
    'quit-now'() { closeLesson(); },
    'no-listen'() {
      if (!L) return;
      L.noListen = true;
      toast('🔇 Poslech vypnutý pro tuhle lekci');
      L.queue.unshift(L.ex);
      nextStep();
    },
    'res-next'() { if (UI.afterResult) afterResult(); else closeLesson(); },

    // průvodce
    'ob-next'() { obNext(); },
    'ob-back'() { OB.step = Math.max(0, OB.step - 1); renderOnboarding(); },
    'ob-goal'(el) { OB.goal = +el.dataset.v; sfx('tap'); renderOnboarding(); },
    'ob-level'(el) { OB.level = el.dataset.v; sfx('tap'); renderOnboarding(); },
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      if (!e.target.closest('.pop')) closePop();
      return;
    }
    if (el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) fn(el, e);
  });

  document.addEventListener('keydown', e => {
    if (!L || $('.sheet-wrap')) return;
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Enter') { e.preventDefault(); doCheck(); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && L.ex && L.ex.opts && n <= L.ex.opts.length) selectOpt(n - 1);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    tickHearts(); checkStreak();
    if (!L && S.onboarded && !$('.sheet-wrap')) {
      if (S.quests && S.quests.day !== dayKey()) render(); else refreshTop();
    }
  });

  /* ═════════════ Start ═════════════ */
  checkStreak();
  render();
  if (S.onboarded) maybeInstallHint();
  if (UI.frozeMsg) { toast(`🧊 Zmrazení zachránilo tvoji sérii!`); UI.frozeMsg = 0; }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline režim nebude */ });
  }

  // pro testy v konzoli
  window.__japonsky = { S: () => S, L: () => L, NODES, UNITS, ITEMS, generate, lessonFor };
})();
