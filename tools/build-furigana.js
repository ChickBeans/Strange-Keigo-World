// ふりがなを自動生成して office-visit.html の RUBY に書き込む。
// 使い方: npm install && npm run furigana
//
// ページ内の文字列リテラルのうち漢字を含むものをすべて kuromoji で解析し、
// 「元の文字列 → <ruby> 付き HTML」の対応表を /*FURIGANA-BEGIN*/ 〜 /*FURIGANA-END*/ に埋め込む。
// 文脈で読みが変わる語や固有名詞は OVERRIDES で固定する。
const fs = require('fs');
const path = require('path');
const kuromoji = require('kuromoji');
const acorn = require('acorn');
const walk = require('acorn-walk');

const FILE = path.join(__dirname, '..', 'office-visit.html');
const DIC = path.join(__dirname, '..', 'node_modules', 'kuromoji', 'dict');

// {漢字|よみ} 形式。長いものから順に照合する。
const OVERRIDES = {
  'そちらの方': 'そちらの{方|かた}',
  'どちらの方': 'どちらの{方|かた}',
  '御社': '{御社|おんしゃ}', '貴社': '{貴社|きしゃ}', '弊社': '{弊社|へいしゃ}',
  '御校': '{御校|おんこう}', '貴校': '{貴校|きこう}', '弊校': '{弊校|へいこう}', '拙宅': '{拙宅|せったく}', 'お宅': 'お{宅|たく}',
  '上座': '{上座|かみざ}', '下座': '{下座|しもざ}',
  '会釈': '{会釈|えしゃく}', '最敬礼': '{最敬礼|さいけいれい}', '敬礼': '{敬礼|けいれい}', '先言後礼': '{先言後礼|せんげんごれい}',
  '田中': '{田中|たなか}', '山田': '{山田|やまだ}', '鈴木': '{鈴木|すずき}', '佐藤': '{佐藤|さとう}', '山形': '{山形|やまがた}',
  '商事': '{商事|しょうじ}', '人事部': '{人事部|じんじぶ}', '営業部長': '{営業|えいぎょう}{部長|ぶちょう}', '営業部': '{営業部|えいぎょうぶ}',
  '一度': '{一度|いちど}', '本日': '{本日|ほんじつ}', '昨年': '{昨年|さくねん}', '先約': '{先約|せんやく}',
  '5日': '{5日|いつか}', '6日': '{6日|むいか}', '9日': '{9日|ここのか}',
  '何時頃': '{何時頃|なんじごろ}', 'いつ頃': 'いつ{頃|ごろ}',
  '二重敬語': '{二重|にじゅう}{敬語|けいご}', '丁寧語': '{丁寧語|ていねいご}', '尊敬語': '{尊敬語|そんけいご}', '謙譲語': '{謙譲語|けんじょうご}',
  '〇〇様': '〇〇{様|さま}', '佐藤様': '{佐藤|さとう}{様|さま}', '鈴木様': '{鈴木|すずき}{様|さま}', '山田様': '{山田|やまだ}{様|さま}', '田中様': '{田中|たなか}{様|さま}',
  '部長様': '{部長|ぶちょう}{様|さま}', 'お客様': 'お{客様|きゃくさま}',
  '見学': '{見学|けんがく}', '企業見学': '{企業|きぎょう}{見学|けんがく}',
  '話し言葉': '{話|はな}し{言葉|ことば}', '書き言葉': '{書|か}き{言葉|ことば}',
  '呼び捨て': '{呼|よ}び{捨|す}て', '身内': '{身内|みうち}', '目上': '{目上|めうえ}', '目下': '{目下|めした}',
  '取引先': '{取引先|とりひきさき}', '打ち合わせ': '{打|う}ち{合|あ}わせ', '見積もり': '{見積|みつ}もり', '見積書': '{見積書|みつもりしょ}',
  '恐縮': '{恐縮|きょうしゅく}', '承知': '{承知|しょうち}', '了解': '{了解|りょうかい}', '他人事': '{他人事|ひとごと}',
  '大声': '{大声|おおごえ}', '足元': '{足元|あしもと}', '足組み': '{足組|あしぐ}み', '背もたれ': '{背|せ}もたれ',
  '漢語': '{漢語|かんご}', 'ます形': 'ます{形|けい}', '（型）': '（{型|かた}）', '作り方': '{作|つく}り{方|かた}', '呼び方': '{呼|よ}び{方|かた}',
  '受付': '{受付|うけつけ}', '名刺': '{名刺|めいし}', '受話器': '{受話器|じゅわき}', '経済学部': '{経済|けいざい}{学部|がくぶ}',
  '自分側': '{自分|じぶん}{側|がわ}', '相手側': '{相手|あいて}{側|がわ}', '佐藤様側': '{佐藤|さとう}{様|さま}{側|がわ}',
  '入口': '{入口|いりぐち}', '頂戴': '{頂戴|ちょうだい}', '拝受': '{拝受|はいじゅ}', '拝聴': '{拝聴|はいちょう}', '拝読': '{拝読|はいどく}', '拝見': '{拝見|はいけん}',
  '申し伝え': '{申|もう}し{伝|つた}え', '申し上げ': '{申|もう}し{上|あ}げ', '存じ上げ': '{存|ぞん}じ{上|あ}げ',
  '召し上がる': '{召|め}し{上|あ}がる', 'お越し': 'お{越|こ}し', 'お見え': 'お{見|み}え', 'お掛け': 'お{掛|か}け', 'ご覧': 'ご{覧|らん}', 'ご存じ': 'ご{存|ぞん}じ',
  '差し上げる': '{差|さ}し{上|あ}げる', 'お目にかかる': 'お{目|め}にかかる', '失礼': '{失礼|しつれい}',
  '11月': '11{月|がつ}', '（月）': '（{月|げつ}）', '（木）': '（{木|もく}）', '（金）': '（{金|きん}）',
  '受付の方': '{受付|うけつけ}の{方|かた}', '今お時間': '{今|いま}お{時間|じかん}', '今、お時間': '{今|いま}、お{時間|じかん}', 'バイブ音': 'バイブ{音|おと}', '3か月間': '3か{月|げつ}{間|かん}',
  '様＋': '{様|さま}＋', '様 +': '{様|さま} +', '様:': '{様|さま}:', '様 and': '{様|さま} and', '様,': '{様|さま},', '様.': '{様|さま}.', '様<': '{様|さま}<', ' 様': ' {様|さま}',
  '3コール': '3コール', '1年': '{1年|いちねん}', '3か月': '3か{月|げつ}', '8時半': '8{時半|じはん}',
};

const isKanji = c => /[一-鿿々〆ヶ]/.test(c);
const hasKanji = s => [...s].some(isKanji);
const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ruby = (base, yomi) => `<ruby>${base}<rt>${yomi}</rt></ruby>`;

// 「申し上げ」「もうしあげ」→ 申|もう し 上|あ げ のように、送りがなを外して漢字だけにルビを振る
function align(surface, reading) {
  if (!hasKanji(surface)) return surface;
  const yomi = kata2hira(reading || '');
  if (!yomi || yomi === '*') return surface;
  const parts = surface.match(/[一-鿿々〆ヶ]+|[^一-鿿々〆ヶ]+/g);
  const re = new RegExp('^' + parts.map(p => isKanji(p[0]) ? '(.+?)' : esc(kata2hira(p))).join('') + '$');
  const m = yomi.match(re);
  if (!m) return ruby(surface, yomi);
  let g = 1;
  return parts.map(p => isKanji(p[0]) ? ruby(p, m[g++]) : p).join('');
}

function renderOverride(markup) {
  return markup.replace(/\{([^|}]+)\|([^}]+)\}/g, (_, b, y) => ruby(b, y));
}

function annotateText(tokenizer, text) {
  if (!hasKanji(text)) return text;
  const keys = Object.keys(OVERRIDES).sort((a, b) => b.length - a.length);
  let out = '', buf = '';
  const flush = () => {
    if (!buf) return;
    out += tokenizer.tokenize(buf).map(t => align(t.surface_form, t.reading)).join('');
    buf = '';
  };
  for (let i = 0; i < text.length;) {
    const k = keys.find(k => text.startsWith(k, i));
    if (k) { flush(); out += renderOverride(OVERRIDES[k]); i += k.length; }
    else { buf += text[i]; i++; }
  }
  flush();
  return out;
}

// HTML タグの外側だけを解析する
function annotate(tokenizer, s) {
  return s.split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part : annotateText(tokenizer, part)).join('');
}

// ページのスクリプトを構文解析して、文字列リテラル（と ${} を含まないテンプレート）を集める
function literals(src) {
  const out = new Set();
  walk.simple(acorn.parse(src, { ecmaVersion: 'latest' }), {
    Literal(n) { if (typeof n.value === 'string' && hasKanji(n.value)) out.add(n.value); },
    TemplateLiteral(n) { if (n.expressions.length === 0 && hasKanji(n.quasis[0].value.cooked)) out.add(n.quasis[0].value.cooked); },
  });
  return [...out];
}

kuromoji.builder({ dicPath: DIC }).build((err, tokenizer) => {
  if (err) throw err;
  const html = fs.readFileSync(FILE, 'utf8');
  const begin = '/*FURIGANA-BEGIN*/', end = '/*FURIGANA-END*/';
  const a = html.indexOf(begin), b = html.lastIndexOf(end);
  if (a < 0 || b < 0) throw new Error('FURIGANA markers not found');
  const scriptStart = html.lastIndexOf('<script>') + '<script>'.length;
  const src = html.slice(scriptStart, a) + 'const RUBY={};' + html.slice(b + end.length, html.indexOf('</script>', b));
  const map = {};
  for (const s of literals(src)) map[s] = annotate(tokenizer, s);
  const block = begin + 'const RUBY=' + JSON.stringify(map) + ';' + end;
  fs.writeFileSync(FILE, html.slice(0, a) + block + html.slice(b + end.length));
  console.log(`furigana: ${Object.keys(map).length} strings`);
  if (process.argv.includes('--dump')) {
    const seen = new Map();
    for (const v of Object.values(map)) for (const [, base, y] of v.matchAll(/<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/g)) seen.set(base + '|' + y, (seen.get(base + '|' + y) || 0) + 1);
    console.log([...seen.keys()].sort().join('\n'));
  }
});
