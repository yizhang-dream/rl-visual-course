/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · 按讲懒加载器
   首载只带 data.js + components.js 核心；进入某讲时才注入该讲
   data-lX.js + components-lX.js（file:// 下经典 script 注入可靠，
   禁 fetch/XHR 依旧成立）。必须先于 app.js 加载。
   ═══════════════════════════════════════════════════════════ */
window.RLVLoader = (function () {
  const inflight = {};    // 讲号 → Promise（幂等：同讲并发/重复调用共享同一次注入）
  const registered = {};  // 组件名 → true（已补挂到根应用的组件）

  // 经典 script 注入；async=false 保证多文件按插入顺序执行（data 先于 components）
  function inject(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(src); };
      s.onerror = function () {
        console.error('[loader] 讲内容脚本加载失败: ' + src);
        reject(new Error('script load failed: ' + src));
      };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  // 每讲要注入的文件：L1 的正文数据在 data.js 里，只差组件文件
  function filesOf(no) {
    const list = [];
    if (no > 1) list.push('assets/js/data-l' + no + '.js');
    list.push('assets/js/components-l' + no + '.js');
    return list;
  }

  // 懒加载文件往 window.COMPONENTS 追加的组件不会自动进根应用
  //（app.js 只在挂载时注册一次），这里把新增键补挂上
  function syncComponents() {
    const app = window.__RLV_APP;
    if (!app || !window.COMPONENTS) return;
    Object.keys(window.COMPONENTS).forEach(function (name) {
      if (!registered[name]) {
        app.component(name, window.COMPONENTS[name]);
        registered[name] = true;
      }
    });
  }

  // ensureLecture(no) → Promise：首次调用注入该讲两个脚本并等 onload；
  // 并发/重复调用返回同一个 Promise，绝不重复注入。失败时清缓存允许重试。
  function ensureLecture(no) {
    no = Number(no) || 0;
    if (!no) return Promise.resolve();
    if (!window.DATA || !Array.isArray(window.DATA.otherLectures)) return Promise.resolve();
    if (!window.DATA.otherLectures.some(function (l) { return l && l.no === no; })) return Promise.resolve();
    if (inflight[no]) return inflight[no];
    inflight[no] = Promise.all(filesOf(no).map(inject))
      .then(function () { syncComponents(); })
      .catch(function (err) { delete inflight[no]; throw err; });
    return inflight[no];
  }

  return { ensureLecture: ensureLecture, syncComponents: syncComponents };
})();
