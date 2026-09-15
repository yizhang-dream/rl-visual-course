// 数据完整性校验（CI 用）：88 小节 / 48 组件 / 57 个公式块 katex 严格渲染零失败
// 加载方式与 check_templates.js 相同：stub window → eval 核心与各讲 data/components。
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const EXPECT_SECTIONS = 88;
const EXPECT_COMPONENTS = 48;
const EXPECT_FORMULAS = 57;

let fail = 0;
const failMsg = (msg) => { fail++; console.log('FAIL  ' + msg); };

// ── stub：data.js 在 stub 上逐步完善，data-lX.js 依赖 D.sections / D.otherLectures ──
globalThis.window = { DATA: { sections: {}, navGroups: [], otherLectures: [] } };
globalThis.navigator = { userAgent: 'node' };
eval(fs.readFileSync('assets/vendor/vue.global.prod.js', 'utf8'));
globalThis.Vue = (typeof Vue !== 'undefined') ? Vue : globalThis.Vue;
if (!globalThis.Vue) { console.log('FAIL  Vue failed to load'); process.exit(1); }

eval(fs.readFileSync(path.join('assets', 'js', 'data.js'), 'utf8'));
for (const f of fs.readdirSync(path.join('assets', 'js')).filter(f => /^data-l\d+\.js$/.test(f)).sort()) {
  eval(fs.readFileSync(path.join('assets', 'js', f), 'utf8'));
}
eval(fs.readFileSync(path.join('assets', 'js', 'components.js'), 'utf8'));
for (const f of fs.readdirSync(path.join('assets', 'js')).filter(f => /^components-l\d+\.js$/.test(f)).sort()) {
  eval(fs.readFileSync(path.join('assets', 'js', f), 'utf8'));
}

// ── 1. 小节数 ──
const D = window.DATA;
const sectionIds = Object.keys(D.sections);
const navIds = D.navGroups.flatMap(g => g.items).map(it => it.id);
if (sectionIds.length !== EXPECT_SECTIONS) {
  failMsg(`sections = ${sectionIds.length} (expect ${EXPECT_SECTIONS})`);
}
const missing = navIds.filter(id => !D.sections[id]);
const orphans = sectionIds.filter(id => !navIds.includes(id));
if (missing.length) failMsg('sections referenced by nav but missing: ' + missing.join(', '));
if (orphans.length) failMsg('sections not referenced by nav: ' + orphans.join(', '));

// ── 2. 组件注册表 ──
const comps = window.COMPONENTS || {};
const compCount = Object.keys(comps).length;
if (compCount !== EXPECT_COMPONENTS) failMsg(`components = ${compCount} (expect ${EXPECT_COMPONENTS})`);

// widget 引用合法性：每个 widget 块的 component 必须已注册
const badWidgets = [];
for (const id of sectionIds) {
  for (const b of D.sections[id].blocks || []) {
    if (b && b.t === 'widget' && !comps[b.component]) badWidgets.push(id + ':' + b.component);
  }
}
if (badWidgets.length) failMsg('widget blocks referencing unregistered components: ' + badWidgets.join(', '));

// ── 3. 公式块 katex 严格渲染（throwOnError，零失败） ──
// 57 个 formula 块 = 带 tex 整式的块 + 带 html（内嵌 data-tex 行内片段）的块；两类全部过 katex。
const decodeHtml = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
let formulas = 0, rendered = 0;
const texErrors = [];
const renderOne = (id, label, tex) => {
  try {
    katex.renderToString(tex, { displayMode: true, throwOnError: true, trust: true, strict: 'ignore' });
    rendered++;
  } catch (e) {
    texErrors.push(`  ${id} ${label} → ${e.message.slice(0, 160)}`);
  }
};
for (const id of sectionIds) {
  for (const [bi, b] of (D.sections[id].blocks || []).entries()) {
    if (!b || b.t !== 'formula') continue;
    formulas++;
    const label = `block#${bi} ${b.lbl || ''}`;
    if (b.tex) renderOne(id, label, b.tex);
    for (const m of (b.html ? b.html.matchAll(/data-tex="([^"]*)"/g) : [])) {
      renderOne(id, label + ' [inline]', decodeHtml(m[1]));
    }
  }
}
if (formulas !== EXPECT_FORMULAS) failMsg(`formula blocks = ${formulas} (expect ${EXPECT_FORMULAS})`);
// texErrors 门禁统一放在第 5 段 derivation 渲染之后（见下）：公式块与推导的 KaTeX
// 失败都计入同一份 texErrors，任何一处失败都必须让进程 exit 1，不留在原地判导致假绿。

// ── 4. 知识填空题库 fillSets（只校验存在的讲；fillSets / 某讲缺失 → 跳过不报错） ──
// 契约：kind ∈ choice|number|code；stem.zh/en 的 [[n]] 从 1 连续且数量===blanks.length；
// code 型必有 code.zh/en；每空 choices 型 answer 下标在界内且长度 3–4 / number 型 answer 为数且
// tol>0；why.zh/en 非空。
const FILL_KINDS = ['choice', 'number', 'code'];
const fillBanks = (typeof D.fillSets === 'object' && D.fillSets) || {};
let fillChecked = 0;
for (const src of Object.keys(fillBanks).sort()) {
  const bank = fillBanks[src];
  const bad = (m) => failMsg(`fillSets[${src}] ${m}`);
  fillChecked++;
  if (!bank || typeof bank !== 'object') { bad('bank 不是对象'); continue; }
  if (!bank.title || !bank.title.zh || !bank.title.en) bad('title.zh / title.en 非空');
  const items = Array.isArray(bank.items) ? bank.items : [];
  if (!items.length) { bad('items 为空'); continue; }
  items.forEach((it, ii) => {
    const where = `item#${ii}`;
    if (!it || typeof it !== 'object') { bad(where + ' 不是对象'); return; }
    if (!FILL_KINDS.includes(it.kind)) { bad(`${where} kind='${it.kind}' 不在 choice/number/code 三值内`); return; }
    if (!it.tag || !it.tag.zh || !it.tag.en) bad(where + ' tag.zh / tag.en 非空');
    const blanks = Array.isArray(it.blanks) ? it.blanks : [];
    if (!blanks.length) { bad(where + ' blanks 为空'); return; }
    // stem 双语的 [[n]]：编号从 1 连续且数量 === blanks.length
    for (const lg of ['zh', 'en']) {
      const nums = (String((it.stem && it.stem[lg]) || '').match(/\[\[(\d+)\]\]/g) || [])
        .map((s) => parseInt(s.slice(2, -2), 10));
      const want = blanks.map((_, k) => k + 1);
      if (nums.join(',') !== want.join(',')) {
        bad(`${where} stem.${lg} 空号 [${nums.join(',')}] 应为从 1 连续的 ${blanks.length} 个 [${want.join(',')}]`);
      }
    }
    // code 型必有 code 字段；其引用的空号须在界内（渲染按空号取 blanks[n-1]）
    if (it.kind === 'code') {
      if (!it.code || !it.code.zh || !it.code.en) {
        bad(where + " kind='code' 缺 code.zh / code.en 字段");
      } else {
        for (const lg of ['zh', 'en']) {
          const nums = (String(it.code[lg]).match(/\[\[(\d+)\]\]/g) || [])
            .map((s) => parseInt(s.slice(2, -2), 10));
          const out = nums.filter((n) => n < 1 || n > blanks.length);
          if (out.length) bad(`${where} code.${lg} 引用了界外空号 ${out.join(',')}`);
        }
      }
    }
    // 逐空：choices 型 / number 型 + why 双语非空
    blanks.forEach((bl, ki) => {
      const wb = `${where} 空${ki + 1}`;
      if (!bl || typeof bl !== 'object') { bad(wb + ' 不是对象'); return; }
      const isChoices = bl.choices && (Array.isArray(bl.choices) || Array.isArray(bl.choices.zh));
      if (isChoices) {
        const lists = Array.isArray(bl.choices) ? [bl.choices]
          : [bl.choices.zh, bl.choices.en].filter(Array.isArray);
        lists.forEach((lst) => {
          if (lst.length < 3 || lst.length > 4) bad(wb + ` choices 长度 ${lst.length} 不在 3–4`);
          if (typeof bl.answer !== 'number' || bl.answer % 1 !== 0 ||
              bl.answer < 0 || bl.answer >= lst.length) {
            bad(wb + ` answer=${bl.answer} 下标越界或非整数`);
          }
        });
      } else if (typeof bl.answer === 'number' && Number.isFinite(bl.answer)) {
        if (typeof bl.tol !== 'number' || !(bl.tol > 0)) bad(wb + ` number 型 tol 须 > 0（现在 ${bl.tol}）`);
      } else {
        bad(wb + ' 既非 choices 型也非 number 型（answer 不是数字）');
      }
      if (!bl.why || !bl.why.zh || !bl.why.en) bad(wb + ' why.zh / why.en 非空');
    });
  });
}

// ── 5. 定理推导题库 derivationSets（只校验存在的讲；derivationSets / 某讲缺失 → 跳过不报错） ──
// 契约：每 item 有 id（非空字符串）+ 双语 name/intro；steps ≥ 6；每 step tex 非空且
// katex 严格渲染零失败（display）、why 双语非空；blank 可选，存在时 choices ≥ 2、
// answer 为界内整数下标、{tex} 型 choice 的 tex 也须 katex 渲染过、非 {tex} 型 choice 的
// zh/en 非空串；whyWrong 存在时长度 === choices 长度（whyWrongHTML 按 pick 下标取）。
const derivBanks = (typeof D.derivationSets === 'object' && D.derivationSets) || {};
let derivChecked = 0;
for (const src of Object.keys(derivBanks).sort()) {
  const bank = derivBanks[src];
  const bad = (m) => failMsg(`derivationSets[${src}] ${m}`);
  derivChecked++;
  if (!bank || typeof bank !== 'object') { bad('bank 不是对象'); continue; }
  const items = Array.isArray(bank.items) ? bank.items : [];
  if (!items.length) { bad('items 为空'); continue; }
  items.forEach((it, ii) => {
    const where = `item#${ii}`;
    if (!it || typeof it !== 'object') { bad(where + ' 不是对象'); return; }
    if (typeof it.id !== 'string' || !it.id) bad(where + ' id 非空字符串缺失');
    for (const f of ['name', 'intro']) {
      if (!it[f] || !it[f].zh || !it[f].en) bad(`${where} ${f}.zh / ${f}.en 非空`);
    }
    const steps = Array.isArray(it.steps) ? it.steps : [];
    if (steps.length < 6) { bad(`${where} steps.length = ${steps.length}（须 ≥ 6）`); return; }
    steps.forEach((st, si) => {
      const ws = `${where} step#${si}`;
      if (!st || typeof st !== 'object') { bad(ws + ' 不是对象'); return; }
      if (typeof st.tex !== 'string' || !st.tex.trim()) bad(ws + ' tex 非空字符串缺失');
      else renderOne(`derivationSets[${src}]`, ws, st.tex);
      if (!st.why || !st.why.zh || !st.why.en) bad(ws + ' why.zh / why.en 非空');
      const bl = st.blank;
      if (bl == null) return;
      if (typeof bl !== 'object') { bad(ws + ' blank 不是对象'); return; }
      const choices = Array.isArray(bl.choices) ? bl.choices : null;
      if (!choices || choices.length < 2) { bad(ws + ' blank.choices 须为长度 ≥ 2 的数组'); return; }
      if (typeof bl.answer !== 'number' || bl.answer % 1 !== 0 ||
          bl.answer < 0 || bl.answer >= choices.length) {
        bad(ws + ` blank.answer=${bl.answer} 下标越界或非整数`);
      }
      choices.forEach((c, ci) => {
        if (c && typeof c === 'object' && c.tex != null) {
          renderOne(`derivationSets[${src}]`, ws + ` choice#${ci}`, String(c.tex));
        } else if (c && typeof c === 'object') {
          if (!String(c.zh || '').trim() || !String(c.en || '').trim()) {
            bad(`${ws} choice#${ci} 非 {tex} 型 choice 的 zh/en 不得为空串`);
          }
        }
      });
      if (Array.isArray(bl.whyWrong) && bl.whyWrong.length !== choices.length) {
        bad(`${ws} blank.whyWrong 长度 ${bl.whyWrong.length} 须等于 choices 长度 ${choices.length}`);
      }
    });
  });
}

// katex 统一门禁：公式块与推导 step/choice tex 的所有 renderOne 都已执行完
// （fillSets 不含 tex），texErrors 非空即 FAIL → exit 1。
if (texErrors.length) failMsg(`katex strict render failures: ${texErrors.length}\n` + texErrors.join('\n'));

console.log(`sections: ${sectionIds.length}/${EXPECT_SECTIONS} · components: ${compCount}/${EXPECT_COMPONENTS} · formula blocks: ${formulas}/${EXPECT_FORMULAS} · katex snippets rendered: ${rendered}, failures: ${texErrors.length} · fill sets: ${fillChecked} · derivation sets: ${derivChecked}`);
if (fail) {
  console.log(`\n${fail} FAILED`);
  process.exit(1);
}
console.log('\nALL DATA CHECKS PASSED');
