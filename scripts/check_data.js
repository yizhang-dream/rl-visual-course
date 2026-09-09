// 数据完整性校验（CI 用）：88 小节 / 44 组件 / 57 个公式块 katex 严格渲染零失败
// 加载方式与 check_templates.js 相同：stub window → eval 核心与各讲 data/components。
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const EXPECT_SECTIONS = 88;
const EXPECT_COMPONENTS = 44;
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
if (texErrors.length) failMsg(`katex strict render failures: ${texErrors.length}\n` + texErrors.join('\n'));

console.log(`sections: ${sectionIds.length}/${EXPECT_SECTIONS} · components: ${compCount}/${EXPECT_COMPONENTS} · formula blocks: ${formulas}/${EXPECT_FORMULAS} · katex snippets rendered: ${rendered}, failures: ${texErrors.length}`);
if (fail) {
  console.log(`\n${fail} FAILED`);
  process.exit(1);
}
console.log('\nALL DATA CHECKS PASSED');
