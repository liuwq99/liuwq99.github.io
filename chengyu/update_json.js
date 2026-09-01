const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

const ROOT = __dirname;
const files = fs.readdirSync(ROOT).filter((name) => name.endsWith('.json')).sort();
const generic = /抓住“?[^”]+”?的字面画面|把“?[^”]+”?想象成具体画面|抓住字面画面|再联系它的核心含义|把“?[^”]+”?想象成具体画面/;

// 固定读音表覆盖词典默认读音可能不符合词语习惯的多音字。
const pronunciationOverrides = {
  擘画: 'bò huà',
  龃龉: 'jǔ yǔ',
  踯躅: 'zhí zhú',
  狡黠: 'jiǎo xiá',
  桎梏: 'zhì gù',
  觥筹交错: 'gōng chóu jiāo cuò',
  面面相觑: 'miàn miàn xiāng qù',
  吹毛求疵: 'chuī máo qiú cī',
};

function termOf(item) {
  return item.成语 || item.实词;
}

function makePinyin(term) {
  return pronunciationOverrides[term] || pinyin(term, { toneType: 'symbol', type: 'array' }).join(' ');
}

function makeMemory(term, explanation, isIdiom) {
  const meaning = String(explanation || '').split(/[。；;]/)[0].replace(/^意思是|^指|^形容/, '').trim();
  if (isIdiom) {
    return `记住“${term}”：把“${term.slice(0, 2)}”和“${term.slice(2)}”想成一幅画——${meaning || '先抓住字面，再联想到整体含义'}；遇到类似场景，就像在脑中播放这幅小短片。`;
  }
  return `记住“${term}”：想象${term}正在${meaning || '具体场景中发挥作用'}；先看清动作或状态，再把它放回句子里理解。`;
}

function validate(document, filename) {
  if (!document || !Array.isArray(document.分组)) throw new Error(`${filename}: 分组不是数组`);
  let count = 0;
  for (const group of document.分组) {
    if (!Array.isArray(group.词条)) throw new Error(`${filename}: 词条不是数组`);
    const countKey = Object.prototype.hasOwnProperty.call(group, '成语数量') ? '成语数量' : '词条数量';
    if (group[countKey] !== group.词条.length) throw new Error(`${filename}: ${countKey} 不匹配`);
    count += group.词条.length;
    for (const item of group.词条) {
      const term = termOf(item);
      if (!term || !item.拼音 || !item.记忆方法 || item.记忆技巧 !== undefined) {
        throw new Error(`${filename}: 词条字段不完整 (${term || '未知'})`);
      }
      if (item.拼音.split(/\s+/).length !== [...term].length) {
        throw new Error(`${filename}: 拼音音节数量不匹配 (${term}: ${item.拼音})`);
      }
    }
  }
  return count;
}

let total = 0;
let renamed = 0;
for (const filename of files) {
  const fullPath = path.join(ROOT, filename);
  const document = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  for (const group of document.分组) {
    for (const item of group.词条) {
      const term = termOf(item);
      const isIdiom = Object.prototype.hasOwnProperty.call(item, '成语');
      if (Object.prototype.hasOwnProperty.call(item, '记忆技巧')) renamed++;
      delete item.记忆技巧;
      item.拼音 = makePinyin(term);
      item.记忆方法 = makeMemory(term, item.解释, isIdiom);
    }
  }
  const count = validate(document, filename);
  total += count;
  fs.writeFileSync(fullPath, JSON.stringify(document, null, 2) + '\n', 'utf8');
}
console.log(JSON.stringify({ files: files.length, entries: total, renamed }, null, 2));
