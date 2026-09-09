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

console.log(fail ? `\n${fail} FAILED` : `\nALL TEMPLATES OK · components: ${Object.keys(comps).length} · sections: ${Object.keys(D.sections).length}`);
