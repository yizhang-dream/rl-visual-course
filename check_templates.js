// 模板编译校验：用 Vue 自带编译器逐一编译所有模板（含 per-lecture 文件），定位语法错误
const fs = require('fs');
globalThis.window = globalThis;
globalThis.navigator = { userAgent: 'node' };
eval(fs.readFileSync('assets/vendor/vue.global.prod.js', 'utf8'));
const V = (typeof Vue !== 'undefined') ? Vue : globalThis.Vue;
if (!V) { console.log('Vue failed to load'); process.exit(1); }
// Vue 的 decodeEntities: c.innerHTML=e → c.textContent；或 c.innerHTML='<div foo="...">' → c.children[0].getAttribute('foo')
function decodeHtml(raw) {
  return String(raw)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&');
}
const decoderDiv = {
  set innerHTML(v) { this._v = v; },
  get textContent() { return decodeHtml(this._v || ''); },
  get children() {
    const self = this;
    return [{ getAttribute: () => {
      const m = /foo="([\s\S]*)"/.exec(self._v || '');
      return m ? decodeHtml(m[1]) : '';
    } }];
  },
};
globalThis.Vue = V;
globalThis.document = {
  createElement: () => decoderDiv,
  createTextNode: () => ({}),
  querySelector: () => null,
  addEventListener() {},
};
globalThis.navigator = { userAgent: 'node' };

eval(fs.readFileSync('assets/js/data.js', 'utf8'));
for (const f of fs.readdirSync('assets/js').filter(f => /^data-l\d+\.js$/.test(f)).sort()) {
  eval(fs.readFileSync('assets/js/' + f, 'utf8'));
}
eval(fs.readFileSync('assets/js/components.js', 'utf8'));
for (const f of fs.readdirSync('assets/js').filter(f => /^components-l\d+\.js$/.test(f)).sort()) {
  eval(fs.readFileSync('assets/js/' + f, 'utf8'));
}
const comps = window.COMPONENTS;
let fail = 0;

for (const [name, comp] of Object.entries(comps)) {
  if (!comp.template) continue;
  try {
    V.compile(comp.template);
  } catch (e) {
    fail++;
    console.log('FAIL ', name, '→', e.message);
  }
}

// 根模板：index.html 中 #app 的 innerHTML
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<div id="app" v-cloak>([\s\S]*?)<\/div>\s*<script/);
if (m) {
  try {
    V.compile('<div>' + m[1] + '</div>');
  } catch (e) {
    fail++;
    console.log('FAIL  root-template →', e.message);
  }
}

// 交叉检查：导航里每个 id 都有内容
const D = window.DATA;
const missing = D.navGroups.flatMap(g => g.items).filter(it => !D.sections[it.id]);
if (missing.length) { fail++; console.log('FAIL  missing sections:', missing.map(x => x.id).join(', ')); }
const orphans = Object.keys(D.sections).filter(id => !D.navGroups.some(g => g.items.some(it => it.id === id)));
if (orphans.length) { console.log('WARN  orphan sections (no nav):', orphans.join(', ')); }

// navClusters 校验：每讲的 items 集合与 navGroups 该讲 items 的 id 集合完全一致
// （无遗漏、无多余、无重复；每讲都必须有分组；不允许未知讲座键）
const clusters = D.navClusters;
let clusterBad = 0;
if (!clusters || typeof clusters !== 'object') {
  fail++; clusterBad++;
  console.log('FAIL  navClusters: missing (window.DATA.navClusters not defined)');
} else {
  const lectureSet = new Set(D.navGroups.map(g => g.lecture));
  for (const k of Object.keys(clusters)) {
    if (!lectureSet.has(+k)) { fail++; clusterBad++; console.log('FAIL  navClusters: unknown lecture key', k); }
  }
  for (const g of D.navGroups) {
    const cs = clusters[g.lecture];
    if (!Array.isArray(cs) || !cs.length) {
      fail++; clusterBad++;
      console.log(`FAIL  navClusters L${g.lecture}: no clusters defined`);
      continue;
    }
    const flat = cs.flatMap(c => (c && c.items) || []);
    const flatSet = new Set(flat);
    const want = new Set(g.items.map(it => it.id));
    const missing = [...want].filter(id => !flatSet.has(id));
    const extra = flat.filter(id => !want.has(id));
    const dup = flat.length !== flatSet.size;
    if (missing.length || extra.length || dup) {
      fail++; clusterBad++;
      console.log(`FAIL  navClusters L${g.lecture}:${dup ? ' duplicate ids;' : ''}${missing.length ? ' missing: ' + missing.join(', ') + ';' : ''}${extra.length ? ' extra: ' + extra.join(', ') : ''}`);
    }
    for (const c of cs) {
      if (!c.zh || !c.en || !Array.isArray(c.items) || c.items.length < 2) {
        fail++; clusterBad++;
        console.log(`FAIL  navClusters L${g.lecture}: bad cluster shape`, JSON.stringify(c));
      }
    }
  }
  if (!clusterBad) {
    const grouped = D.navGroups.map(g => `L${g.lecture}×${clusters[g.lecture].length}`).join(' ');
    console.log(`clusters OK · ${D.navGroups.length} lectures grouped (${grouped})`);
  }
}

console.log(fail ? `\n${fail} FAILED` : `\nALL TEMPLATES OK · components: ${Object.keys(comps).length} · sections: ${Object.keys(D.sections).length}`);
process.exit(fail ? 1 : 0);
