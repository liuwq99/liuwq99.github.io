// 生成 data.js：合并 data/ 下全部 JSON，供 index.html 直接引用（双击打开可用，无需本地服务器）
// 运行：node build_data_js.js   （会覆盖根目录 data.js）
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort();

// 中文数字转整数：一→1、十→10、十三→13、二十→20、六十七→67
const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
function cnToNum(s) {
  if (!s) return 0;
  if (s === '十') return 10;
  if (s.includes('十')) {
    const [a, b] = s.split('十');
    let n = (a ? CN_NUM[a] : 1) * 10;
    if (b) n += CN_NUM[b];
    return n;
  }
  return CN_NUM[s] || 0;
}
// 从「第 X 组」「第 X 至 Y 组」提取起始组号和结束组号
function groupRange(key) {
  const m = key.match(/第([一二三四五六七八九十]+)(?:至([一二三四五六七八九十]+))?组/);
  if (!m) return [0, 0];
  return [cnToNum(m[1]), m[2] ? cnToNum(m[2]) : 0];
}

const packs = [];
let total = 0;

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.分组)) {
    throw new Error(`${file}: 缺少分组数组`);
  }
  const groups = doc.分组.map((g) => {
    if (!Array.isArray(g.词条)) throw new Error(`${file}: 分组缺少词条数组`);
    const name = g.组别 || g.分组 || '';
    const entries = g.词条.map((it) => ({
      词: it.成语 || it.实词 || '',
      拼音: it.拼音 || '',
      解释: it.解释 || '',
      例句: Array.isArray(it.完整例句) ? it.完整例句 : [],
      记忆方法: it.记忆方法 || '',
      组别: name,
    }));
    return { name, entries };
  });
  const count = groups.reduce((n, g) => n + g.entries.length, 0);
  total += count;
  packs.push({
    key: file.slice(0, -5),
    label: `${file.slice(0, -5)}（${count} 条）`,
    来源: doc.来源 || '',
    说明: doc.说明 || '',
    groups,
    count,
  });
}

// 排序：实词（下册实词…）整体放最后；成语 / 实词内部按起始组号、结束组号升序。
packs.sort((a, b) => {
  const aShi = a.key.startsWith('下册实词');
  const bShi = b.key.startsWith('下册实词');
  if (aShi !== bShi) return aShi ? 1 : -1;
  const [aStart, aEnd] = groupRange(a.key);
  const [bStart, bEnd] = groupRange(b.key);
  if (aStart !== bStart) return aStart - bStart;
  return aEnd - bEnd;
});

fs.writeFileSync(
  path.join(ROOT, 'data.js'),
  '// 由 build_data_js.js 生成，请勿手工编辑；重新生成请运行 node build_data_js.js\n' +
    'window.CHENGYU_DATA = ' +
    JSON.stringify(packs) +
    ';\n',
  'utf8'
);

console.log(JSON.stringify({ files: packs.length, total }, null, 2));