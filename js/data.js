/* Japonsky – obsah kurzu (čeština → japonština)
 *
 * kana:  'あ:a い:i …'  (znak:romaji, katakana se generuje z hiragany přes kata:true)
 * w:     [kana, romaji, význam, kanji?, poznámka?]
 * kj:    [kanji, čtení, romaji, význam, poznámka?]
 * s:     [japonsky po slovech (alternativy |), romaji, česky (alternativy |), extra dlaždice?]
 */

const ROWS = {
  a: 'あ:a い:i う:u え:e お:o',
  k: 'か:ka き:ki く:ku け:ke こ:ko',
  s: 'さ:sa し:shi す:su せ:se そ:so',
  t: 'た:ta ち:chi つ:tsu て:te と:to',
  n: 'な:na に:ni ぬ:nu ね:ne の:no',
  h: 'は:ha ひ:hi ふ:fu へ:he ほ:ho',
  m: 'ま:ma み:mi む:mu め:me も:mo',
  y: 'や:ya ゆ:yu よ:yo',
  r: 'ら:ra り:ri る:ru れ:re ろ:ro',
  w: 'わ:wa を:wo ん:n',
  g: 'が:ga ぎ:gi ぐ:gu げ:ge ご:go',
  z: 'ざ:za じ:ji ず:zu ぜ:ze ぞ:zo',
  d: 'だ:da ぢ:ji づ:zu で:de ど:do',
  b: 'ば:ba び:bi ぶ:bu べ:be ぼ:bo',
  p: 'ぱ:pa ぴ:pi ぷ:pu ぺ:pe ぽ:po',
  y1: 'きゃ:kya きゅ:kyu きょ:kyo しゃ:sha しゅ:shu しょ:sho ちゃ:cha ちゅ:chu ちょ:cho',
  y2: 'にゃ:nya にゅ:nyu にょ:nyo ひゃ:hya ひゅ:hyu ひょ:hyo みゃ:mya みゅ:myu みょ:myo りゃ:rya りゅ:ryu りょ:ryo',
  y3: 'ぎゃ:gya ぎゅ:gyu ぎょ:gyo じゃ:ja じゅ:ju じょ:jo びゃ:bya びゅ:byu びょ:byo ぴゃ:pya ぴゅ:pyu ぴょ:pyo',
  ky: 'きゃ:kya きゅ:kyu きょ:kyo しゃ:sha しゅ:shu しょ:sho ちゃ:cha ちゅ:chu ちょ:cho じゃ:ja じゅ:ju じょ:jo',
  sp: 'ファ:fa フィ:fi フェ:fe フォ:fo ティ:ti ディ:di チェ:che シェ:she ジェ:je ウィ:wi ウェ:we ヴ:vu',
};

// Pro psaní: další přijatelné přepisy
const KANA_ALT = { 'を': ['o'], 'ぢ': ['di', 'dji'], 'づ': ['du', 'dzu'], 'ん': ['nn'] };

// Tabulka pro záložku Znaky (prázdný řetězec = mezera v mřížce)
const KANA_TABLE = {
  main: ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'や ゆ よ', 'らりるれろ', 'わ   を', 'ん    '],
  dak: ['がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶべぼ', 'ぱぴぷぺぽ'],
  yoon: ['きゃきゅきょ', 'しゃしゅしょ', 'ちゃちゅちょ', 'にゃにゅにょ', 'ひゃひゅひょ', 'みゃみゅみょ', 'りゃりゅりょ', 'ぎゃぎゅぎょ', 'じゃじゅじょ', 'びゃびゅびょ', 'ぴゃぴゅぴょ'],
};

const COURSE = [
  /* ───────────── HIRAGANA ───────────── */
  {
    id: 'h1', title: 'Hiragana 1', sub: 'Samohlásky a řada K', color: '#ff6b9d',
    tips: `
      <p>Japonština má tři písma: <b>hiraganu</b>, <b>katakanu</b> a <b>kanji</b>. Začínáme hiraganou – každý znak je jedna slabika.</p>
      <p>Samohlásky <span class="jp">あ い う え お</span> se čtou skoro jako česky: <b>a i u e o</b>. Jen <span class="jp">う</span> je kratší a rty se tolik nešpulí.</p>
      <p>Řada K vznikne přidáním „k“: <span class="jp">か き く け こ</span> = ka ki ku ke ko.</p>
      <div class="tip">💡 Pod romaji uvidíš i <b>českou výslovnost</b>. Třeba <span class="jp">し</span> = shi, česky <b>ši</b>.</div>`,
    levels: [
      { id: 'h1a', title: 'Samohlásky', kana: ROWS.a },
      { id: 'h1b', title: 'Řada K', kana: ROWS.k },
      { id: 'h1c', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'h2', title: 'Hiragana 2', sub: 'Řady S a T', color: '#7c6cff',
    tips: `
      <p>Řada S: <span class="jp">さ し す せ そ</span>. Pozor, <span class="jp">し</span> se čte <b>ši</b> (shi), ne „si“.</p>
      <p>Řada T: <span class="jp">た ち つ て と</span>. Výjimky: <span class="jp">ち</span> = <b>či</b> (chi), <span class="jp">つ</span> = <b>cu</b> (tsu).</p>
      <div class="tip">🧠 <span class="jp">さ</span> vs <span class="jp">き</span>: き má o čárku víc. <span class="jp">て</span> vypadá jako ruka, co mává – <b>te</b> (手 = ruka).</div>`,
    levels: [
      { id: 'h2a', title: 'Řada S', kana: ROWS.s },
      { id: 'h2b', title: 'Řada T', kana: ROWS.t },
      { id: 'h2c', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'h3', title: 'Hiragana 3', sub: 'Řady N, H a M', color: '#00b8a9',
    tips: `
      <p>Řada N: <span class="jp">な に ぬ ね の</span> – nic záludného.</p>
      <p>Řada H: <span class="jp">は ひ ふ へ ほ</span>. <span class="jp">ふ</span> = <b>fu</b>, ale vyslovuje se jemně, něco mezi „fu“ a „hu“ – rty se nedotýkají zubů.</p>
      <p>Řada M: <span class="jp">ま み む め も</span>.</p>
      <div class="tip">⚠️ Když je <span class="jp">は</span> částice, čte se <b>wa</b>. A <span class="jp">へ</span> jako částice se čte <b>e</b>.</div>`,
    levels: [
      { id: 'h3a', title: 'Řada N', kana: ROWS.n },
      { id: 'h3b', title: 'Řada H', kana: ROWS.h },
      { id: 'h3c', title: 'Řada M', kana: ROWS.m },
      { id: 'h3d', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'h4', title: 'Hiragana 4', sub: 'Řady Y, R, W a N', color: '#ff9f1c',
    tips: `
      <p><span class="jp">や ゆ よ</span> = ya yu yo, česky <b>ja ju jo</b>.</p>
      <p>Japonské R je mezi naším R a L – jen lehce ťukneš špičkou jazyka za zuby. <span class="jp">ら り る れ ろ</span>.</p>
      <p><span class="jp">わ</span> = wa. <span class="jp">を</span> = wo, ale čte se prostě <b>o</b> a používá se jen jako částice.</p>
      <p><span class="jp">ん</span> = <b>n</b> – jediný znak bez samohlásky.</p>
      <div class="tip">🎉 Po téhle jednotce umíš celou základní hiraganu!</div>`,
    levels: [
      { id: 'h4a', title: 'Řada Y', kana: ROWS.y },
      { id: 'h4b', title: 'Řada R', kana: ROWS.r },
      { id: 'h4c', title: 'W a N', kana: ROWS.w },
      { id: 'h4d', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'h5', title: 'Hiragana 5', sub: 'Čárky a kroužky', color: '#58b947',
    tips: `
      <p>Dvě čárky <b>゛</b> (dakuten) změní zvuk: k→<b>g</b>, s→<b>z</b>, t→<b>d</b>, h→<b>b</b>.</p>
      <p>Kroužek <b>゜</b> (handakuten) změní h→<b>p</b>: <span class="jp">ぱ ぴ ぷ ぺ ぽ</span>.</p>
      <p><span class="jp">じ</span> = ji, česky <b>dži</b>. <span class="jp">ぢ</span> a <span class="jp">づ</span> jsou vzácné a čtou se stejně jako <span class="jp">じ</span> a <span class="jp">ず</span>.</p>`,
    levels: [
      { id: 'h5a', title: 'G a Z', kana: ROWS.g + ' ' + ROWS.z },
      { id: 'h5b', title: 'D a B', kana: ROWS.d + ' ' + ROWS.b },
      { id: 'h5c', title: 'P', kana: ROWS.p },
      { id: 'h5d', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'h6', title: 'Hiragana 6', sub: 'Spojené slabiky', color: '#a560e8',
    tips: `
      <p>Malé <span class="jp">ゃ ゅ ょ</span> se spojí se znakem na „i“: <span class="jp">き + ゃ = きゃ</span> = kya, česky <b>kja</b>.</p>
      <p>Malé <span class="jp">っ</span> zdvojí následující souhlásku: <span class="jp">がっこう</span> = ga<b>kk</b>ou (škola).</p>
      <p>Dlouhé samohlásky: <span class="jp">ありがとう</span> = arigatou, vyslov <b>arigató</b>. Délka mění význam, tak ji nepolykej!</p>`,
    levels: [
      { id: 'h6a', title: 'KYA, SHA, CHA', kana: ROWS.y1 },
      { id: 'h6b', title: 'NYA, HYA, MYA, RYA', kana: ROWS.y2 },
      { id: 'h6c', title: 'GYA, JA, BYA, PYA', kana: ROWS.y3 },
      { id: 'h6d', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── PRVNÍ SLOVA ───────────── */
  {
    id: 'w1', title: 'První slova', sub: 'Zvířata, příroda, doma', color: '#1cb0f6',
    tips: `
      <p>Japonská podstatná jména nemají rod ani množné číslo: <span class="jp">ねこ</span> = kočka i kočky. Chill 😎</p>
      <p><b>これ は ～ です</b> = To je ～. <span class="jp">は</span> se tu čte <b>wa</b> a označuje, o čem mluvíme. <span class="jp">です</span> = „je / jsem / jsou“ (zdvořile).</p>
      <p><span class="jp">これ</span> = tohle (u mě), <span class="jp">それ</span> = to (u tebe), <span class="jp">あれ</span> = tamto (daleko).</p>`,
    levels: [
      {
        id: 'w1a', title: 'Zvířata', w: [
          ['ねこ', 'neko', 'kočka', '猫'],
          ['いぬ', 'inu', 'pes', '犬'],
          ['さかな', 'sakana', 'ryba', '魚'],
          ['とり', 'tori', 'pták', '鳥'],
          ['うま', 'uma', 'kůň', '馬'],
          ['うし', 'ushi', 'kráva', '牛'],
        ],
      },
      {
        id: 'w1b', title: 'Příroda', w: [
          ['やま', 'yama', 'hora', '山'],
          ['かわ', 'kawa', 'řeka', '川'],
          ['うみ', 'umi', 'moře', '海'],
          ['そら', 'sora', 'nebe', '空'],
          ['き', 'ki', 'strom', '木'],
          ['はな', 'hana', 'květina', '花'],
        ],
      },
      {
        id: 'w1c', title: 'Doma', w: [
          ['いえ', 'ie', 'dům', '家'],
          ['ほん', 'hon', 'kniha', '本'],
          ['つくえ', 'tsukue', 'stůl', '机'],
          ['いす', 'isu', 'židle', '椅子'],
          ['くるま', 'kuruma', 'auto', '車'],
          ['でんわ', 'denwa', 'telefon', '電話'],
        ],
      },
      {
        id: 'w1d', title: 'To je…', w: [
          ['これ', 'kore', 'tohle'],
          ['それ', 'sore', 'to (u tebe)'],
          ['あれ', 'are', 'tamto'],
          ['です', 'desu', 'je / jsem (zdvořile)'],
        ],
        s: [
          ['これ は ねこ です', 'kore wa neko desu', 'To je kočka|Tohle je kočka'],
          ['これ は いぬ です', 'kore wa inu desu', 'To je pes|Tohle je pes'],
          ['これ は ほん です', 'kore wa hon desu', 'To je kniha|Tohle je kniha'],
          ['それ は くるま です', 'sore wa kuruma desu', 'To je auto'],
          ['あれ は やま です', 'are wa yama desu', 'Tamto je hora|To je hora'],
          ['あれ は うみ です', 'are wa umi desu', 'Tamto je moře|To je moře'],
        ],
      },
      { id: 'w1e', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── POZDRAVY ───────────── */
  {
    id: 'gr', title: 'Pozdravy', sub: 'Ahoj, děkuju, promiň', color: '#ef476f',
    tips: `
      <p><span class="jp">こんにちは</span> píšeme s <span class="jp">は</span> na konci, ale čteme <b>konničiwa</b>.</p>
      <p>Zdvořilou verzi často uděláš přidáním <span class="jp">ございます</span>: <span class="jp">おはよう</span> → <span class="jp">おはようございます</span>.</p>
      <p><span class="jp">すみません</span> je kouzelné slovo: promiňte, pardon, a někdy i děkuju.</p>
      <div class="tip">🍜 <span class="jp">いただきます</span> se říká před jídlem, <span class="jp">ごちそうさまでした</span> po jídle.</div>`,
    levels: [
      {
        id: 'gra', title: 'Ahoj!', w: [
          ['こんにちは', 'konnichiwa', 'dobrý den / ahoj', '今日は', 'Na konci je は, ale čte se wa.'],
          ['おはよう', 'ohayou', 'dobré ráno'],
          ['こんばんは', 'konbanwa', 'dobrý večer', '今晩は'],
          ['おやすみ', 'oyasumi', 'dobrou noc'],
          ['さようなら', 'sayounara', 'na shledanou'],
          ['じゃあね', 'jaa ne', 'čau (na rozloučenou)'],
        ],
      },
      {
        id: 'grb', title: 'Zdvořilost', w: [
          ['ありがとう', 'arigatou', 'děkuju'],
          ['すみません', 'sumimasen', 'promiňte'],
          ['ごめんなさい', 'gomennasai', 'omlouvám se'],
          ['おねがいします', 'onegaishimasu', 'prosím (o něco)'],
          ['はい', 'hai', 'ano'],
          ['いいえ', 'iie', 'ne'],
        ],
      },
      {
        id: 'grc', title: 'Extra zdvořile', w: [
          ['おはようございます', 'ohayou gozaimasu', 'dobré ráno (zdvořile)'],
          ['ありがとうございます', 'arigatou gozaimasu', 'děkuji (zdvořile)'],
          ['いただきます', 'itadakimasu', 'dobrou chuť', null, 'Říká se před jídlem.'],
          ['ごちそうさまでした', 'gochisousama deshita', 'děkuji za jídlo', null, 'Říká se po jídle.'],
          ['はじめまして', 'hajimemashite', 'těší mě', null, 'Při prvním setkání.'],
          ['よろしくおねがいします', 'yoroshiku onegaishimasu', 'prosím o přízeň', null, 'Říká se po představení – něco jako „rád tě poznávám“.'],
        ],
      },
      { id: 'grd', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── ČÍSLA ───────────── */
  {
    id: 'num', title: 'Čísla', sub: 'Od jedné do deseti tisíc', color: '#ff9600',
    tips: `
      <p>1–10: <span class="jp">いち に さん よん ご ろく なな はち きゅう じゅう</span>.</p>
      <p>4, 7 a 9 mají dvě čtení. <span class="jp">し</span> (4) zní jako slovo „smrt“, proto se častěji říká <span class="jp">よん</span>.</p>
      <p>Větší čísla se skládají jako lego: 11 = 10 + 1 = <span class="jp">じゅういち</span>, 20 = 2 × 10 = <span class="jp">にじゅう</span>.</p>
      <div class="tip">🤯 Japonci počítají po desetitisících: <span class="jp">まん</span> = 10 000.</div>`,
    levels: [
      {
        id: 'numa', title: '1 až 5', w: [
          ['いち', 'ichi', 'jedna (1)', '一'],
          ['に', 'ni', 'dva (2)', '二'],
          ['さん', 'san', 'tři (3)', '三'],
          ['よん', 'yon', 'čtyři (4)', '四', 'Také し (shi), ale to zní jako „smrt“.'],
          ['ご', 'go', 'pět (5)', '五'],
        ],
      },
      {
        id: 'numb', title: '6 až 10', w: [
          ['ろく', 'roku', 'šest (6)', '六'],
          ['なな', 'nana', 'sedm (7)', '七', 'Také しち (shichi).'],
          ['はち', 'hachi', 'osm (8)', '八'],
          ['きゅう', 'kyuu', 'devět (9)', '九', 'Také く (ku).'],
          ['じゅう', 'juu', 'deset (10)', '十'],
        ],
      },
      {
        id: 'numc', title: 'Velká čísla', w: [
          ['じゅういち', 'juuichi', 'jedenáct (11)', '十一'],
          ['にじゅう', 'nijuu', 'dvacet (20)', '二十'],
          ['ひゃく', 'hyaku', 'sto (100)', '百'],
          ['せん', 'sen', 'tisíc (1000)', '千'],
          ['いちまん', 'ichiman', 'deset tisíc (10 000)', '一万'],
        ],
      },
      { id: 'numd', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── KATAKANA ───────────── */
  {
    id: 'k1', title: 'Katakana 1', sub: 'A, K a S', color: '#06d6a0', kata: true,
    tips: `
      <p>Katakana má <b>stejné zvuky</b> jako hiragana, jen hranatější tvary. Píšou se v ní cizí slova, jména a zvuky.</p>
      <p>Pozor na dvojice: <span class="jp">シ</span> (ši) a <span class="jp">ツ</span> (cu), <span class="jp">ソ</span> (so) a <span class="jp">ン</span> (n).</p>
      <div class="tip">🧠 U <span class="jp">シ</span> a <span class="jp">ン</span> jdou čárky spíš naležato, u <span class="jp">ツ</span> a <span class="jp">ソ</span> shora dolů.</div>`,
    levels: [
      { id: 'k1a', title: 'Samohlásky', kana: ROWS.a, kata: true },
      { id: 'k1b', title: 'Řada K', kana: ROWS.k, kata: true },
      { id: 'k1c', title: 'Řada S', kana: ROWS.s, kata: true },
      { id: 'k1d', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'k2', title: 'Katakana 2', sub: 'T, N a H', color: '#118ab2', kata: true,
    tips: `
      <p><span class="jp">タ チ ツ テ ト</span> – ta či cu te to.</p>
      <p><span class="jp">ナ ニ ヌ ネ ノ</span> – <span class="jp">ニ</span> je jen dvě čárky, jako hiragana <span class="jp">に</span> bez levé části.</p>
      <p><span class="jp">ハ ヒ フ ヘ ホ</span> – <span class="jp">ヘ</span> vypadá skoro stejně jako hiragana <span class="jp">へ</span>.</p>`,
    levels: [
      { id: 'k2a', title: 'Řada T', kana: ROWS.t, kata: true },
      { id: 'k2b', title: 'Řada N', kana: ROWS.n, kata: true },
      { id: 'k2c', title: 'Řada H', kana: ROWS.h, kata: true },
      { id: 'k2d', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'k3', title: 'Katakana 3', sub: 'M, Y, R, W a N', color: '#ef8354', kata: true,
    tips: `
      <p><span class="jp">マ ミ ム メ モ</span>, <span class="jp">ヤ ユ ヨ</span>, <span class="jp">ラ リ ル レ ロ</span>, <span class="jp">ワ ヲ ン</span>.</p>
      <div class="tip">➖ Čárka <b>ー</b> v katakaně prodlužuje samohlásku: <span class="jp">コーヒー</span> = koohii, česky <b>kóhí</b>.</div>`,
    levels: [
      { id: 'k3a', title: 'M a Y', kana: ROWS.m + ' ' + ROWS.y, kata: true },
      { id: 'k3b', title: 'R, W a N', kana: ROWS.r + ' ' + ROWS.w, kata: true },
      { id: 'k3c', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'k4', title: 'Katakana 4', sub: 'Čárky, kroužky a speciality', color: '#8338ec', kata: true,
    tips: `
      <p>Čárky a kroužky fungují stejně jako v hiraganě: <span class="jp">カ→ガ</span>, <span class="jp">ハ→バ→パ</span>.</p>
      <p>Pro cizí zvuky má katakana speciální kombinace: <span class="jp">ファ</span> fa, <span class="jp">ティ</span> ti, <span class="jp">チェ</span> če, <span class="jp">ヴ</span> vu.</p>
      <div class="tip">🇨🇿 Díky <span class="jp">チェ</span> napíšeš <span class="jp">チェコ</span> = Česko! Jména: <span class="jp">ヤン</span> (Jan), <span class="jp">ペトル</span> (Petr), <span class="jp">エヴァ</span> (Eva).</div>`,
    levels: [
      { id: 'k4a', title: 'G, Z a D', kana: ROWS.g + ' ' + ROWS.z + ' ダ:da デ:de ド:do', kata: true },
      { id: 'k4b', title: 'B a P', kana: ROWS.b + ' ' + ROWS.p, kata: true },
      { id: 'k4c', title: 'Spojené', kana: ROWS.ky, kata: true },
      { id: 'k4d', title: 'Speciality', kana: ROWS.sp, kata: true },
      { id: 'k4e', title: 'Opakování', review: true },
    ],
  },
  {
    id: 'kw', title: 'Cizí slova', sub: 'Slova v katakaně', color: '#e76f51',
    tips: `
      <p>Japonština si půjčuje slova hlavně z angličtiny. Protože nezná samotné souhlásky (kromě n), přidává za ně samohlásku: <span class="jp">ホテル</span> = ho-te-ru.</p>
      <p>L se mění na R: Praha = <span class="jp">プラハ</span> (puraha).</p>
      <div class="tip">🍺 <span class="jp">ビール</span> je slovo, které se ti v Japonsku bude hodit nejvíc. Věř mi.</div>`,
    levels: [
      {
        id: 'kwa', title: 'Jídlo a pití', w: [
          ['コーヒー', 'koohii', 'káva'],
          ['ビール', 'biiru', 'pivo'],
          ['ジュース', 'juusu', 'džus'],
          ['パン', 'pan', 'chleba', null, 'Z portugalského „pão“.'],
          ['ラーメン', 'raamen', 'rámen (nudlová polévka)'],
          ['アイスクリーム', 'aisukuriimu', 'zmrzlina'],
        ],
      },
      {
        id: 'kwb', title: 'Věci', w: [
          ['テレビ', 'terebi', 'televize'],
          ['カメラ', 'kamera', 'fotoaparát'],
          ['スマホ', 'sumaho', 'mobil'],
          ['パソコン', 'pasokon', 'počítač'],
          ['ゲーム', 'geemu', 'hra (videohra)'],
          ['ペン', 'pen', 'propiska'],
        ],
      },
      {
        id: 'kwc', title: 'Místa', w: [
          ['ホテル', 'hoteru', 'hotel'],
          ['レストラン', 'resutoran', 'restaurace'],
          ['トイレ', 'toire', 'záchod'],
          ['コンビニ', 'konbini', 'večerka (konbini)'],
          ['チェコ', 'cheko', 'Česko'],
          ['プラハ', 'puraha', 'Praha'],
        ],
      },
      { id: 'kwd', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── PŘEDSTAVENÍ ───────────── */
  {
    id: 'me', title: 'Představení', sub: 'Kdo jsi a odkud', color: '#3a86ff',
    tips: `
      <p><b>わたし は ～ です</b> = Jsem ～.</p>
      <p><span class="jp">の</span> = přivlastnění: <span class="jp">わたし の なまえ</span> = moje jméno.</p>
      <p><span class="jp">か</span> na konci udělá z věty otázku. Otazník se často ani nepíše.</p>
      <p><span class="jp">じゃ ありません</span> = nejsem / není.</p>
      <p><span class="jp">～じん</span> = národnost (<span class="jp">にほんじん</span> Japonec), <span class="jp">～ご</span> = jazyk (<span class="jp">にほんご</span> japonština).</p>
      <div class="tip">⚠️ <span class="jp">～さん</span> (pan/paní) dáváš za jména ostatních, nikdy za svoje!</div>`,
    levels: [
      {
        id: 'mea', title: 'Já a ty', w: [
          ['わたし', 'watashi', 'já', '私'],
          ['あなた', 'anata', 'ty', null, 'Japonci ho moc nepoužívají – radši oslovují jménem + さん.'],
          ['なまえ', 'namae', 'jméno', '名前'],
          ['がくせい', 'gakusei', 'student', '学生'],
          ['せんせい', 'sensei', 'učitel', '先生'],
          ['ともだち', 'tomodachi', 'kamarád', '友達'],
        ],
      },
      {
        id: 'meb', title: 'Odkud jsi?', w: [
          ['にほん', 'nihon', 'Japonsko', '日本'],
          ['にほんじん', 'nihonjin', 'Japonec', '日本人'],
          ['にほんご', 'nihongo', 'japonština', '日本語'],
          ['チェコじん', 'chekojin', 'Čech', 'チェコ人'],
          ['チェコご', 'chekogo', 'čeština', 'チェコ語'],
          ['さん', 'san', 'pan / paní (za jménem)'],
        ],
      },
      {
        id: 'mec', title: 'Věty', s: [
          ['わたし は がくせい です|がくせい です', 'watashi wa gakusei desu', 'Jsem student|Já jsem student|Jsem studentka|Já jsem studentka', 'studentka'],
          ['わたし は チェコじん です|チェコじん です', 'watashi wa chekojin desu', 'Jsem Čech|Já jsem Čech|Jsem Češka|Já jsem Češka', 'Češka'],
          ['わたし の なまえ は ヤン です', 'watashi no namae wa yan desu', 'Jmenuji se Jan|Jmenuju se Jan|Moje jméno je Jan|Mé jméno je Jan'],
          ['あなた は にほんじん です か', 'anata wa nihonjin desu ka', 'Jsi Japonec|Ty jsi Japonec|Jste Japonec|Vy jste Japonec|Jsi Japonka|Jste Japonka', 'Japonka'],
          ['せんせい は にほんじん です', 'sensei wa nihonjin desu', 'Učitel je Japonec|Učitelka je Japonka'],
          ['ヤン さん は チェコじん です', 'yan san wa chekojin desu', 'Jan je Čech|Pan Jan je Čech'],
          ['わたし は せんせい じゃ ありません', 'watashi wa sensei ja arimasen', 'Nejsem učitel|Já nejsem učitel|Nejsem učitelka|Já nejsem učitelka', 'učitelka'],
        ],
      },
      { id: 'med', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── JÍDLO ───────────── */
  {
    id: 'food', title: 'Jídlo a pití', sub: 'Objednej si jako profík', color: '#f4a261',
    tips: `
      <p><b>～ を ください</b> = Dejte mi ～, prosím. <span class="jp">を</span> se čte <b>o</b> a označuje předmět.</p>
      <p><b>～ が すき です</b> = Mám rád ～.</p>
      <p><span class="jp">と</span> = a (mezi podstatnými jmény): <span class="jp">ごはん と さかな</span> = rýže a ryba.</p>
      <div class="tip">🍚 <span class="jp">ごはん</span> znamená rýže, ale i jídlo obecně – rýže je v Japonsku základ.</div>`,
    levels: [
      {
        id: 'fooda', title: 'Jídlo', w: [
          ['ごはん', 'gohan', 'rýže / jídlo', 'ご飯'],
          ['にく', 'niku', 'maso', '肉'],
          ['やさい', 'yasai', 'zelenina', '野菜'],
          ['たまご', 'tamago', 'vejce', '卵'],
          ['くだもの', 'kudamono', 'ovoce', '果物'],
          ['りんご', 'ringo', 'jablko'],
        ],
      },
      {
        id: 'foodb', title: 'Pití', w: [
          ['みず', 'mizu', 'voda', '水'],
          ['おちゃ', 'ocha', 'čaj', 'お茶'],
          ['ぎゅうにゅう', 'gyuunyuu', 'mléko', '牛乳'],
          ['おさけ', 'osake', 'alkohol / saké', 'お酒'],
          ['ください', 'kudasai', 'dejte mi, prosím'],
          ['おいしい', 'oishii', 'chutný'],
          ['すき', 'suki', 'mít rád', '好き'],
        ],
      },
      {
        id: 'foodc', title: 'V restauraci', s: [
          ['みず を ください', 'mizu o kudasai', 'Vodu prosím|Prosím vodu'],
          ['おちゃ を ください', 'ocha o kudasai', 'Čaj prosím|Prosím čaj'],
          ['ビール を ください', 'biiru o kudasai', 'Pivo prosím|Prosím pivo'],
          ['これ は おいしい です', 'kore wa oishii desu', 'To je dobré|Tohle je dobré|To je chutné|Tohle je chutné'],
          ['すし が すき です', 'sushi ga suki desu', 'Mám rád suši|Mám ráda suši', 'ráda'],
          ['ラーメン が すき です', 'raamen ga suki desu', 'Mám rád rámen|Mám ráda rámen', 'ráda'],
          ['ごはん と さかな', 'gohan to sakana', 'Rýže a ryba'],
        ],
      },
      { id: 'foodd', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── RODINA ───────────── */
  {
    id: 'fam', title: 'Rodina', sub: 'Máma, táta a sourozenci', color: '#e5989b',
    tips: `
      <p>O <b>své</b> rodině mluvíš skromně: <span class="jp">はは</span> (moje máma), <span class="jp">ちち</span> (můj táta).</p>
      <p>O <b>cizí</b> rodině zdvořile: <span class="jp">おかあさん</span>, <span class="jp">おとうさん</span>. Tak taky oslovuješ vlastní rodiče.</p>
      <p><b>～ が います</b> = mám ～ / je tu ～ (u lidí a zvířat).</p>
      <div class="tip">👫 Sourozenci se dělí na starší a mladší – japonština to bere vážně.</div>`,
    levels: [
      {
        id: 'fama', title: 'Moje rodina', w: [
          ['かぞく', 'kazoku', 'rodina', '家族'],
          ['はは', 'haha', 'moje máma', '母'],
          ['ちち', 'chichi', 'můj táta', '父'],
          ['あに', 'ani', 'můj starší bratr', '兄'],
          ['あね', 'ane', 'moje starší sestra', '姉'],
          ['おとうと', 'otouto', 'můj mladší bratr', '弟'],
          ['いもうと', 'imouto', 'moje mladší sestra', '妹'],
        ],
      },
      {
        id: 'famb', title: 'Lidé', w: [
          ['おかあさん', 'okaasan', 'maminka (něčí)', 'お母さん'],
          ['おとうさん', 'otousan', 'tatínek (něčí)', 'お父さん'],
          ['ひと', 'hito', 'člověk', '人'],
          ['こども', 'kodomo', 'dítě', '子供'],
          ['おとこのこ', 'otokonoko', 'kluk', '男の子'],
          ['おんなのこ', 'onnanoko', 'holka', '女の子'],
          ['います', 'imasu', 'být (o živých bytostech)'],
        ],
      },
      {
        id: 'famc', title: 'Věty', s: [
          ['これ は わたし の かぞく です', 'kore wa watashi no kazoku desu', 'To je moje rodina|Tohle je moje rodina|To je má rodina'],
          ['はは は せんせい です', 'haha wa sensei desu', 'Moje máma je učitelka|Máma je učitelka'],
          ['ちち は にほんじん です', 'chichi wa nihonjin desu', 'Můj táta je Japonec|Táta je Japonec'],
          ['あに が います', 'ani ga imasu', 'Mám staršího bratra'],
          ['いもうと が います', 'imouto ga imasu', 'Mám mladší sestru'],
          ['ねこ が います', 'neko ga imasu', 'Mám kočku|Je tu kočka'],
        ],
      },
      { id: 'famd', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── PŘÍDAVNÁ JMÉNA ───────────── */
  {
    id: 'adj', title: 'Barvy a vlastnosti', sub: 'Jaké to je?', color: '#ffb703',
    tips: `
      <p>Většina přídavných jmen končí na <span class="jp">い</span>: <span class="jp">あかい</span> (červený), <span class="jp">おおきい</span> (velký).</p>
      <p>Stojí před podstatným jménem: <span class="jp">あかい りんご</span> = červené jablko. Žádné skloňování, žádný rod 🙏</p>
      <p><span class="jp">この / その / あの</span> + podstatné jméno = tento / ten / tamten.</p>`,
    levels: [
      {
        id: 'adja', title: 'Barvy', w: [
          ['あかい', 'akai', 'červený', '赤い'],
          ['あおい', 'aoi', 'modrý', '青い'],
          ['しろい', 'shiroi', 'bílý', '白い'],
          ['くろい', 'kuroi', 'černý', '黒い'],
          ['きいろい', 'kiiroi', 'žlutý', '黄色い'],
          ['みどり', 'midori', 'zelená', '緑'],
        ],
      },
      {
        id: 'adjb', title: 'Jaké to je?', w: [
          ['おおきい', 'ookii', 'velký', '大きい'],
          ['ちいさい', 'chiisai', 'malý', '小さい'],
          ['たかい', 'takai', 'drahý / vysoký', '高い'],
          ['やすい', 'yasui', 'levný', '安い'],
          ['あたらしい', 'atarashii', 'nový', '新しい'],
          ['ふるい', 'furui', 'starý (o věcech)', '古い'],
          ['この', 'kono', 'tento'],
        ],
      },
      {
        id: 'adjc', title: 'Pocity', w: [
          ['かわいい', 'kawaii', 'roztomilý', '可愛い'],
          ['むずかしい', 'muzukashii', 'těžký (obtížný)', '難しい'],
          ['たのしい', 'tanoshii', 'zábavný', '楽しい'],
          ['あつい', 'atsui', 'horký', '暑い'],
          ['さむい', 'samui', 'studený (o počasí)', '寒い'],
          ['いい', 'ii', 'dobrý'],
        ],
      },
      {
        id: 'adjd', title: 'Věty', s: [
          ['ねこ は かわいい です', 'neko wa kawaii desu', 'Kočka je roztomilá|Kočky jsou roztomilé'],
          ['この くるま は あかい です', 'kono kuruma wa akai desu', 'Tohle auto je červené|Toto auto je červené|To auto je červené'],
          ['にほんご は むずかしい です', 'nihongo wa muzukashii desu', 'Japonština je těžká|Japonština je obtížná'],
          ['にほんご は たのしい です', 'nihongo wa tanoshii desu', 'Japonština je zábavná'],
          ['この ほん は たかい です', 'kono hon wa takai desu', 'Tahle kniha je drahá|Tato kniha je drahá|Ta kniha je drahá'],
          ['あかい りんご', 'akai ringo', 'Červené jablko'],
          ['おおきい いぬ', 'ookii inu', 'Velký pes'],
        ],
      },
      { id: 'adje', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── SLOVESA ───────────── */
  {
    id: 'verb', title: 'Slovesa', sub: 'Jím, piju, spím', color: '#2a9d8f',
    tips: `
      <p>Sloveso je <b>vždycky na konci</b> věty.</p>
      <p><span class="jp">～ます</span> = zdvořilý tvar pro přítomnost i budoucnost (jím / budu jíst). <span class="jp">～ません</span> = zápor (nejím).</p>
      <p>Částice: <span class="jp">を</span> = co (předmět), <span class="jp">に</span> = kam, <span class="jp">で</span> = čím / kde.</p>
      <div class="tip">🧩 <span class="jp">パン を たべます</span> = doslova „chleba (co) jím“.</div>`,
    levels: [
      {
        id: 'verba', title: 'Každý den', w: [
          ['たべます', 'tabemasu', 'jíst', '食べます'],
          ['のみます', 'nomimasu', 'pít', '飲みます'],
          ['ねます', 'nemasu', 'spát', '寝ます'],
          ['おきます', 'okimasu', 'vstávat', '起きます'],
          ['いきます', 'ikimasu', 'jít / jet', '行きます'],
          ['かえります', 'kaerimasu', 'vrátit se domů', '帰ります'],
        ],
      },
      {
        id: 'verbb', title: 'Volný čas', w: [
          ['みます', 'mimasu', 'dívat se', '見ます'],
          ['ききます', 'kikimasu', 'poslouchat', '聞きます'],
          ['よみます', 'yomimasu', 'číst', '読みます'],
          ['かきます', 'kakimasu', 'psát', '書きます'],
          ['はなします', 'hanashimasu', 'mluvit', '話します'],
          ['わかります', 'wakarimasu', 'rozumět', '分かります'],
          ['おんがく', 'ongaku', 'hudba', '音楽'],
        ],
      },
      {
        id: 'verbc', title: 'Věty', s: [
          ['パン を たべます', 'pan o tabemasu', 'Jím chleba|Jíme chleba'],
          ['コーヒー を のみます', 'koohii o nomimasu', 'Piju kávu|Piji kávu|Pijeme kávu', 'Piji'],
          ['テレビ を みます', 'terebi o mimasu', 'Dívám se na televizi|Koukám na televizi'],
          ['ほん を よみます', 'hon o yomimasu', 'Čtu knihu|Čteme knihu'],
          ['おんがく を ききます', 'ongaku o kikimasu', 'Poslouchám hudbu|Posloucháme hudbu'],
          ['にほん に いきます', 'nihon ni ikimasu', 'Jedu do Japonska|Pojedu do Japonska', 'Pojedu'],
          ['にほんご を はなします', 'nihongo o hanashimasu', 'Mluvím japonsky|Mluvíme japonsky'],
          ['にく を たべません', 'niku o tabemasen', 'Nejím maso|Nejíme maso'],
          ['わかりません', 'wakarimasen', 'Nerozumím|Nevím'],
        ],
      },
      { id: 'verbd', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── ČAS ───────────── */
  {
    id: 'time', title: 'Čas a dny', sub: 'Dnes, zítra, pondělí', color: '#6a4c93',
    tips: `
      <p>Dny v týdnu jsou podle živlů: 月 měsíc (pondělí), 火 oheň (úterý), 水 voda (středa), 木 strom (čtvrtek), 金 zlato (pátek), 土 země (sobota), 日 slunce (neděle).</p>
      <p><span class="jp">でした</span> = minulý čas od <span class="jp">です</span> (byl / byla / bylo).</p>
      <p><span class="jp">べんきょう します</span> = učit se (doslova „dělat studium“).</p>`,
    levels: [
      {
        id: 'timea', title: 'Kdy?', w: [
          ['きょう', 'kyou', 'dnes', '今日'],
          ['あした', 'ashita', 'zítra', '明日'],
          ['きのう', 'kinou', 'včera', '昨日'],
          ['いま', 'ima', 'teď', '今'],
          ['まいにち', 'mainichi', 'každý den', '毎日'],
          ['しゅうまつ', 'shuumatsu', 'víkend', '週末'],
        ],
      },
      {
        id: 'timeb', title: 'Části dne', w: [
          ['あさ', 'asa', 'ráno', '朝'],
          ['ひる', 'hiru', 'poledne', '昼'],
          ['よる', 'yoru', 'večer / noc', '夜'],
          ['じかん', 'jikan', 'čas', '時間'],
          ['なんじ', 'nanji', 'kolik hodin', '何時'],
          ['べんきょう', 'benkyou', 'učení / studium', '勉強'],
        ],
      },
      {
        id: 'timec', title: 'Dny v týdnu', lessons: 3, w: [
          ['げつようび', 'getsuyoubi', 'pondělí', '月曜日'],
          ['かようび', 'kayoubi', 'úterý', '火曜日'],
          ['すいようび', 'suiyoubi', 'středa', '水曜日'],
          ['もくようび', 'mokuyoubi', 'čtvrtek', '木曜日'],
          ['きんようび', 'kinyoubi', 'pátek', '金曜日'],
          ['どようび', 'doyoubi', 'sobota', '土曜日'],
          ['にちようび', 'nichiyoubi', 'neděle', '日曜日'],
        ],
      },
      {
        id: 'timed', title: 'Věty', s: [
          ['きょう は げつようび です', 'kyou wa getsuyoubi desu', 'Dnes je pondělí'],
          ['あした は どようび です', 'ashita wa doyoubi desu', 'Zítra je sobota'],
          ['きのう は にちようび でした', 'kinou wa nichiyoubi deshita', 'Včera byla neděle'],
          ['いま なんじ です か', 'ima nanji desu ka', 'Kolik je hodin|Kolik je teď hodin'],
          ['まいにち にほんご を べんきょう します', 'mainichi nihongo o benkyou shimasu', 'Každý den se učím japonsky|Učím se japonsky každý den'],
          ['あした にほん に いきます', 'ashita nihon ni ikimasu', 'Zítra jedu do Japonska|Zítra pojedu do Japonska', 'pojedu'],
        ],
      },
      { id: 'timee', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── MĚSTO ───────────── */
  {
    id: 'city', title: 'Ve městě', sub: 'Kde je nádraží?', color: '#219ebc',
    tips: `
      <p><b>～ は どこ です か</b> = Kde je ～?</p>
      <p><span class="jp">ここ / そこ / あそこ / どこ</span> = tady / tam / tamhle / kde.</p>
      <p><span class="jp">いくら です か</span> = Kolik to stojí? <span class="jp">で</span> = prostředek: <span class="jp">でんしゃ で</span> = vlakem.</p>
      <div class="tip">⚠️ <span class="jp">びょういん</span> = nemocnice, ale <span class="jp">びよういん</span> = kadeřnictví. Jedna délka a jdeš na stříhání místo k doktorovi 💀</div>`,
    levels: [
      {
        id: 'citya', title: 'Místa', w: [
          ['えき', 'eki', 'nádraží', '駅'],
          ['みせ', 'mise', 'obchod', '店'],
          ['ぎんこう', 'ginkou', 'banka', '銀行'],
          ['びょういん', 'byouin', 'nemocnice', '病院'],
          ['がっこう', 'gakkou', 'škola', '学校'],
          ['くうこう', 'kuukou', 'letiště', '空港'],
        ],
      },
      {
        id: 'cityb', title: 'Kudy?', w: [
          ['どこ', 'doko', 'kde'],
          ['ここ', 'koko', 'tady'],
          ['そこ', 'soko', 'tam (u tebe)'],
          ['あそこ', 'asoko', 'tamhle'],
          ['みぎ', 'migi', 'vpravo', '右'],
          ['ひだり', 'hidari', 'vlevo', '左'],
          ['まっすぐ', 'massugu', 'rovně'],
        ],
      },
      {
        id: 'cityc', title: 'Nakupování', w: [
          ['いくら', 'ikura', 'kolik (stojí)'],
          ['えん', 'en', 'jen (měna)', '円'],
          ['かいます', 'kaimasu', 'kupovat', '買います'],
          ['でんしゃ', 'densha', 'vlak', '電車'],
          ['バス', 'basu', 'autobus'],
          ['きっぷ', 'kippu', 'jízdenka', '切符'],
        ],
      },
      {
        id: 'cityd', title: 'Věty', s: [
          ['トイレ は どこ です か', 'toire wa doko desu ka', 'Kde je záchod|Kde je toaleta'],
          ['えき は どこ です か', 'eki wa doko desu ka', 'Kde je nádraží'],
          ['えき は あそこ です', 'eki wa asoko desu', 'Nádraží je tamhle'],
          ['これ は いくら です か', 'kore wa ikura desu ka', 'Kolik to stojí|Kolik tohle stojí'],
          ['ひゃく えん です', 'hyaku en desu', 'Stojí to sto jenů|Je to sto jenů|To je sto jenů'],
          ['でんしゃ で いきます', 'densha de ikimasu', 'Jedu vlakem|Pojedu vlakem', 'Pojedu'],
          ['きっぷ を かいます', 'kippu o kaimasu', 'Kupuju jízdenku|Kupuji jízdenku|Koupím jízdenku', 'Kupuji'],
        ],
      },
      { id: 'citye', title: 'Opakování', review: true },
    ],
  },

  /* ───────────── KANJI ───────────── */
  {
    id: 'kanji', title: 'První kanji', sub: 'Znaky s významem', color: '#d62828',
    tips: `
      <p>Kanji jsou znaky převzaté z Číny. Každý má <b>význam</b> a obvykle víc čtení.</p>
      <p>Spousta z nich jsou obrázky: <b>山</b> hory, <b>川</b> tekoucí řeka, <b>木</b> strom, <b>人</b> člověk na dvou nohách, <b>口</b> otevřená pusa.</p>
      <div class="tip">🔢 <b>一 二 三</b> = jedna, dvě, tři čáry. Nejlehčí kanji ever.</div>`,
    levels: [
      {
        id: 'kanjia', title: 'Čísla', kj: [
          ['一', 'いち', 'ichi', 'jedna'],
          ['二', 'に', 'ni', 'dva'],
          ['三', 'さん', 'san', 'tři'],
          ['十', 'じゅう', 'juu', 'deset'],
          ['百', 'ひゃく', 'hyaku', 'sto'],
          ['円', 'えん', 'en', 'jen (měna)'],
        ],
      },
      {
        id: 'kanjib', title: 'Příroda', kj: [
          ['日', 'ひ', 'hi', 'slunce / den', 'Také にち (nichi), např. 日本.'],
          ['月', 'つき', 'tsuki', 'měsíc', 'Také げつ (getsu), např. 月曜日.'],
          ['山', 'やま', 'yama', 'hora'],
          ['川', 'かわ', 'kawa', 'řeka'],
          ['木', 'き', 'ki', 'strom'],
          ['水', 'みず', 'mizu', 'voda'],
          ['火', 'ひ', 'hi', 'oheň'],
        ],
      },
      {
        id: 'kanjic', title: 'Lidé', kj: [
          ['人', 'ひと', 'hito', 'člověk'],
          ['口', 'くち', 'kuchi', 'ústa'],
          ['目', 'め', 'me', 'oko'],
          ['手', 'て', 'te', 'ruka'],
          ['大きい', 'おおきい', 'ookii', 'velký'],
          ['小さい', 'ちいさい', 'chiisai', 'malý'],
          ['日本', 'にほん', 'nihon', 'Japonsko'],
        ],
      },
      { id: 'kanjid', title: 'Opakování', review: true },
    ],
  },
];

const UNIT_ICONS = { h1: 'あ', h2: 'さ', h3: 'な', h4: 'ら', h5: 'が', h6: 'きゃ', w1: '🐱', gr: '👋', num: '🔢', k1: 'ア', k2: 'タ', k3: 'マ', k4: 'パ', kw: '🍺', me: '🙋', food: '🍣', fam: '👪', adj: '🎨', verb: '🏃', time: '📅', city: '🚃', kanji: '山' };
