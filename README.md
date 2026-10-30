# Japonsky 🇨🇿 → 🇯🇵

Appka ve stylu Duolinga na japonštinu pro Čechy. Funguje v prohlížeči a na iPhonu si ji přidáš na plochu jako normální appku. Jede i offline.

## Co v ní je

- **22 jednotek s levely:** hiragana, katakana, první slova, pozdravy, čísla, cizí slova, představení, jídlo, rodina, přídavná jména, slovesa, čas, město a první kanji
- **Cvičení:** výběr odpovědi, poslech (japonský hlas), spojování dvojic, psaní v romaji a skládání vět z dlaždic
- **Česká výslovnost** u každého slova (shi → ši, tsu → cu, ji → dži)
- **Tipy** ke gramatice u každé jednotky
- **Zkouška** na konci každé jednotky a možnost přeskočit, co už umíš
- **Série 🔥, XP, srdíčka ❤️, drahokamy 💎, denní úkoly, obchod a úspěchy**
- **Procvičování:** chytré opakování slabých míst, líný mód 🦥, poslech a psaní
- **Nahraná výslovnost** všech znaků, slov a vět – hraje na každém zařízení, i offline
- Tmavý režim, záloha a obnovení postupu

## Spuštění na GitHub Pages

1. Na GitHubu otevři **Settings → Pages**.
2. U *Source* vyber **Deploy from a branch**.
3. Vyber větev (např. `main`) a složku **/ (root)**, pak dej **Save**.
4. Za chvilku poběží appka na `https://<uživatel>.github.io/learn-japonsky/`.

## Instalace na iPhone

1. Otevři adresu appky v **Safari**.
2. Klepni na **Sdílet** a vyber **Přidat na plochu**.
3. Hotovo. Appka se spustí na celou obrazovku a funguje i bez internetu.

## Lokálně

Stačí statický server, žádný build:

```sh
python3 -m http.server 8000
# a otevři http://localhost:8000
```

## Struktura

- `index.html`: kostra stránky a meta tagy pro iOS
- `css/style.css`: vzhled (světlý i tmavý režim)
- `js/data.js`: obsah kurzu (znaky, slovíčka, věty, tipy), sem se přidávají nové lekce
- `js/app.js`: logika appky (cesta, lekce, cvičení, série, úkoly…)
- `audio/` a `js/audio.js`: nahrávky výslovnosti a jejich mapa (generuje `scripts/gen_audio.py`)
- `sw.js`: service worker pro offline režim (při změně souborů zvyš verzi `CACHE`)
- `manifest.webmanifest` a `icons/`: ikonky a nastavení PWA

Postup se ukládá do `localStorage` v prohlížeči. Na jiné zařízení ho přeneseš přes **Profil → Zálohovat postup**.

## Nahrávky výslovnosti

Po přidání nových slov nebo vět je potřeba nahrávky přegenerovat:

```sh
pip install pyopenjtalk-plus
node scripts/audio-texts.js > texts.json
python scripts/gen_audio.py texts.json
```

Když nějaká nahrávka chybí, appka použije japonský hlas z prohlížeče.

## Poděkování

Výslovnost je syntetizovaná pomocí [Open JTalk](https://open-jtalk.sourceforge.net/) (přes [pyopenjtalk-plus](https://pypi.org/project/pyopenjtalk-plus/)) hlasem
**HTS Voice „Mei“** © 2009–2013 Nagoya Institute of Technology, Department of Computer Science (MMDAgent Project Team),
licence [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
