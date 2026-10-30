// Vypíše (JSON) všechny texty, které appka předčítá, a čím je syntetizovat.
// Použití: node scripts/audio-texts.js > texts.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
const ctx = {};
vm.runInNewContext(src + '\n;this.out = { ROWS, COURSE };', ctx);
const { COURSE } = ctx.out;

const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
// stejné jako sayToken v app.js – samostatná částice se čte jako částice
const sayToken = t => ({ 'は': 'わ', 'へ': 'え', 'を': 'お' }[t] || t);

const out = new Map(); // say -> kandidáti pro syntézu (první, jehož čtení sedí, vyhrává)
const add = (say, ...cands) => {
  if (!say) return;
  const list = out.get(say) || [];
  [...cands, say].forEach(c => { if (c && !list.includes(c)) list.push(c); });
  out.set(say, list);
};

// slovo v kaně -> zápis s kanji (pro lepší přízvuk); jen jednoznačná víceznaková slova,
// jinak by se třeba částice に změnila na 二 nebo さん (pan) na 三
const count = {};
COURSE.forEach(u => u.levels.forEach(lv => (lv.w || []).forEach(([jp]) => { count[jp] = (count[jp] || 0) + 1; })));
const kanjiOf = {};
COURSE.forEach(u => u.levels.forEach(lv => (lv.w || []).forEach(([jp, , , kanji]) => {
  if (kanji && count[jp] === 1 && jp.length > 1) kanjiOf[jp] = kanji;
})));

COURSE.forEach(u => u.levels.forEach(lv => {
  // samotný znak syntetizuj katakanou, jinak se は přečte jako částice „wa“ a へ jako „e“
  if (lv.kana) lv.kana.trim().split(/\s+/).forEach(p => { const k = toKata(p.split(':')[0]); add(lv.kata ? k : p.split(':')[0], k); });
  (lv.w || []).forEach(([jp]) => add(jp, kanjiOf[jp]));
  (lv.kj || []).forEach(([, kana]) => add(kana));
  (lv.s || []).forEach(([jp]) => {
    const tokens = jp.split('|')[0].trim().split(' ');
    add(tokens.join(''), tokens.map(t => kanjiOf[t] || t).join(''));
    tokens.forEach(t => add(sayToken(t), kanjiOf[t]));
  });
}));

// věta pro test hlasu v Profilu
add('こんにちは。いっしょに にほんご を べんきょう しましょう。', 'こんにちは。一緒に日本語を勉強しましょう。');

process.stdout.write(JSON.stringify([...out].map(([say, cands]) => ({ say, cands, read: toKata(say) })), null, 1));
