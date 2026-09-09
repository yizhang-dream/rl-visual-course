/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · 根应用
   ═══════════════════════════════════════════════════════════ */
(function () {
  const { createApp } = Vue;
  const D = window.DATA;

  // 主题清单（与 main.css 的 html[data-theme] 块一一对应）
  const THEMES = [
    { key: 'chalk',   label: '墨板 Chalkboard',  dot: '#ffd76a' },
    { key: 'swiss',   label: '讲义 Swiss Notes', dot: '#2138e0' },
    { key: 'quant',   label: '深空 Quant Dark',  dot: '#3ce6c2' },
    { key: 'forest',  label: '教科书 Forest',    dot: '#2e6b45' },
    { key: 'classic', label: '经典 Classic',     dot: '#3e6fe0' },
  ];
  function loadTheme() {
    try {
      const t = localStorage.getItem('rl-viz-theme');
      if (THEMES.some(x => x.key === t)) return t;
    } catch (e) {}
    return document.documentElement.dataset.theme || 'chalk';
  }

  // 已读小节持久化（file:// 隐私模式下 localStorage 可能抛异常，全部包 try/catch）
  const VISITED_KEY = 'rl-viz-visited';
  function loadVisited() {
    try {
      const arr = JSON.parse(localStorage.getItem(VISITED_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : []);
    } catch (e) { return new Set(); }
  }
  function saveVisited(set) {
    try { localStorage.setItem(VISITED_KEY, JSON.stringify([...set])); } catch (e) {}
  }

  // 双语段落渲染：中文 + 英文（CSS 控制显示模式）
  const fmt = (blk) =>
    `<span class="zh du-line">${blk.zh}</span><span class="en du-line">${blk.en}</span>`;

  const ICONS = { key: '🔑', warn: '⚠️', danger: '🚫', idea: '💡', done: '✅' };

  // 页面标题（SEO：路由切换时同步 document.title / og:title）
  const HOME_TITLE = 'RL 可视化课堂 · 全书十讲 | RL Visual Classroom · Mathematical Foundation of RL';
  function setOgTitle(content) {
    try {
      const el = document.head.querySelector('meta[property="og:title"]');
      if (el) el.setAttribute('content', content);
    } catch (e) {}
  }

  const app = createApp({
    template: window.ROOT_TEMPLATE,   // 根模板在 root-template.js（先于本文件加载）
    data: () => ({
      section: 'home',            // 'home' | 'lesson'
      activeId: 'grid-world',
      lang: localStorage.getItem('rl-viz-lang') || 'both',
      visited: loadVisited(),
      sidebarOpen: false,
      scrollPct: 0,
      lectureFilter: 0,           // 0 = 全部 / else lecture no
      lectureToggles: {},         // 讲级折叠的用户手动开关：{ lecture: true|false }（会话内记住）
      theme: loadTheme(),
      themes: THEMES,
      loadingLec: 0,              // 正在按需加载的讲号（0 = 无；驱动顶部加载占位）
      _observer: null,
    }),
    computed: {
      langModes() { return D.langModes; },
      navGroups() {
        return D.navGroups.filter(g => !this.lectureFilter || g.lecture === this.lectureFilter);
      },
      lectureChips() { return D.otherLectures; },
      allNavItems() { return D.navGroups.flatMap(g => g.items); },
      currentSections() {
        if (this.section !== 'lesson') return [];
        const shown = new Set(this.navGroups.flatMap(g => g.items.map(it => it.id)));
        return this.allNavItems
          .map(it => ({ ...it, ...D.sections[it.id] }))
          .filter(s => s.blocks && shown.has(s.id));
      },
    },
    watch: {
      lectureFilter() { this.$nextTick(() => { this.renderFormulas(); this.setupReveal(); }); },
    },
    methods: {
      fmt,
      bi(zh, en) { return `<span class="zh du-line">${zh}</span><span class="en du-line">${en}</span>`; },
      iconFor(v) { return ICONS[v] || '🔑'; },
      // ── KaTeX 公式渲染：当前 DOM 里所有 [data-tex] 落地后逐个渲染 ──
      // 触发点：applyRoute 渲染完成 + lectureFilter 切讲（sections 随筛选重建）。
      // 已渲染（内含 .katex）的元素跳过，天然幂等不闪烁；ensureKatex 失败时
      // 公式块回退为 TeX 源码文本，页面不炸。
      async renderFormulas() {
        const els = Array.prototype.slice.call(document.querySelectorAll('[data-tex]'))
          .filter(el => !el.querySelector('.katex'));
        if (!els.length) return;   // 无公式（含首页）：不触发 katex 懒加载
        let katex = null;
        try { katex = await window.RLVLoader.ensureKatex(); }
        catch (e) { console.error('[katex] 公式库加载失败，公式回退为源码', e); }
        els.forEach(el => {
          const tex = el.getAttribute('data-tex') || '';
          if (!katex) { el.textContent = tex; return; }
          try {
            katex.render(tex, el, {
              displayMode: !el.classList.contains('fx-inline'),
              throwOnError: false,   // 解析失败落红字原文，不抛异常不炸页面
              trust: true,           // 数据源是自家 data 文件；\htmlClass 用于主题色标记
              strict: 'ignore',
            });
          } catch (e) { el.textContent = tex; }
        });
      },
      // 三层导航：把一讲的小节按 navClusters 分组（items 解析回 nav 对象）
      // 无元数据或解析不完整时退化为单组扁平，保证任何讲都能渲染
      clustersOf(group) {
        const byId = {};
        group.items.forEach(it => { byId[it.id] = it; });
        const meta = (D.navClusters && D.navClusters[group.lecture]) || [];
        const out = meta
          .map(c => ({ zh: c.zh, en: c.en, items: (c.items || []).map(id => byId[id]).filter(Boolean) }))
          .filter(c => c.items.length);
        const covered = out.reduce((n, c) => n + c.items.length, 0);
        if (!out.length || covered !== group.items.length) {
          return [{ zh: '', en: '', items: group.items }];
        }
        return out;
      },
      setLang(k) {
        this.lang = k;
        try { localStorage.setItem('rl-viz-lang', k); } catch (e) {}
        document.body.dataset.lang = k;
        document.documentElement.lang = k === 'en' ? 'en' : 'zh-CN';
      },
      setTheme(k) {
        this.theme = k;
        document.documentElement.dataset.theme = k;
        try { localStorage.setItem('rl-viz-theme', k); } catch (e) {}
      },
      // ── hash 路由（按讲懒加载版）─────────────────────────────
      // go() 只写地址栏；状态同步统一走 syncFromHash → applyRoute，
      // 单一路径保证点击 / 后退前进 / 手改 URL / 刷新恢复行为一致。
      // 懒加载后，路由先 await ensureLecture(目标讲) 再渲染：
      // 侧栏点击 / 上一节下一节跨讲 / 深链冷启动全部汇聚于此，无需各改。
      hashOf(id) { return id === 'home' ? '' : '#sec-' + id; },
      lectureOf(id) {
        const g = D.navGroups.find(g => g.items.some(it => it.id === id));
        return g ? g.lecture : 0;
      },
      go(id) {
        const want = this.hashOf(id);
        if (location.hash === want) { this.syncFromHash(true); return; }
        location.hash = want;   // 触发 hashchange → onHashChange → syncFromHash
      },
      async syncFromHash(smooth) {
        const m = /^#sec-(.+)$/.exec(location.hash);
        const id = (m && this.allNavItems.some(n => n.id === m[1])) ? m[1] : 'home';
        if (id === 'home') { this.applyRoute('home', smooth); return; }
        const lec = this.lectureOf(id);
        if (!lec) return;
        const seq = ++this._routeSeq;          // 竞态守卫：只有最新一次导航有权落位
        // ensureLecture 幂等：已加载的讲返回已决议 Promise，不显示加载占位
        this.loadingLec = lec;
        try { await window.RLVLoader.ensureLecture(lec); }
        catch (e) { console.error('[route] L' + lec + ' 讲内容加载失败，仍尝试渲染导航骨架', e); }
        if (seq !== this._routeSeq) return;    // 等待期间用户又导航了：让最新一次接管
        this.loadingLec = 0;
        this.applyRoute(id, smooth);
      },
      applyRoute(id, smooth) {
        this.sidebarOpen = false;
        if (id === 'home') {
          this.section = 'home';
          document.title = HOME_TITLE;
          setOgTitle(HOME_TITLE);
          this.$nextTick(() => {
            if (this.$refs.content) this.$refs.content.scrollTop = 0;
            this.setupReveal();
          });
          return;
        }
        const grp = D.navGroups.find(g => g.items.some(it => it.id === id));
        if (!grp) return;
        if (this.lectureFilter !== grp.lecture) this.lectureFilter = grp.lecture;
        this.section = 'lesson';
        this.activeId = id;          // 侧栏高亮立即跟随（不等滚动事件）
        this.markVisited(id);
        // SEO：单讲视图标题同步为「L讲号 讲名 · RL 可视化课堂」
        const lecMeta = D.otherLectures.find(l => l.no === grp.lecture);
        if (lecMeta) {
          const t = 'L' + lecMeta.no + ' ' + lecMeta.zh + ' · RL 可视化课堂';
          document.title = t;
          setOgTitle(t);
        }
        this.$nextTick(() => {
          const el = document.getElementById('sec-' + id);
          this.renderFormulas();   // 当前视图含 .formula 块时懒加载 KaTeX 并渲染
          // 深链/刷新恢复（smooth=false）：目标节 reveal 直达终态，不播 stagger
          this.setupReveal(smooth ? null : el);
          if (el) this.scrollToSec(el, smooth);
        });
      },
      // 滚动到某节：点击导航走平滑动画；初始恢复走瞬时定位 + 延迟二次校准
      // （.content 是 scroll-behavior:smooth，深链首次定位时布局可能仍在稳定，
      //   350ms 后按实时几何补一枪，保证节头真正贴到滚动区顶端）
      scrollToSec(el, smooth) {
        if (smooth) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        const root = this.$refs.content;
        if (!root) return;
        const jump = () => {
          const off = el.getBoundingClientRect().top - root.getBoundingClientRect().top - 8;
          root.scrollTo({ top: root.scrollTop + off, behavior: 'instant' });
        };
        jump();
        setTimeout(() => {
          if (this.section === 'lesson' && this.activeId === el.id.replace('sec-', '')) jump();
        }, 350);
      },
      onHashChange() { this.syncFromHash(true); },
      // 已读标记：只记真实到达的节，落 localStorage 跨会话保留
      markVisited(id) {
        if (this.visited.has(id)) return;
        this.visited.add(id);
        saveVisited(this.visited);
      },
      // 上一节 / 下一节：按 navGroups 展平顺序（跨讲）
      pnOf(id) {
        const all = this.allNavItems;
        const i = all.findIndex(n => n.id === id);
        return i < 0 ? { prev: null, next: null }
          : { prev: i > 0 ? all[i - 1] : null, next: i < all.length - 1 ? all[i + 1] : null };
      },
      // 讲筛选 chip：懒加载版「先加载、后切换」——内容就绪才切 lectureFilter，
      // 避免切到内容还没注入的讲出现半渲染视图（侧栏骨架本身始终完整可点）
      async filterLecture(no) {
        const target = this.lectureFilter === no ? 0 : no;
        if (!target) { this.lectureFilter = 0; return; }
        const seq = ++this._filterSeq;
        this.loadingLec = no;
        try { await window.RLVLoader.ensureLecture(no); }
        catch (e) { console.error('[filter] L' + no + ' 讲内容加载失败', e); }
        if (seq !== this._filterSeq) return;   // 期间用户又点了别的 chip
        this.loadingLec = 0;
        this.lectureFilter = target;
      },
      // 讲级折叠状态：单讲视图（lectureFilter≠0）该讲必须展开；
      // “全部”模式默认只展开 L1，用户手动开关过的讲按 lectureToggles 记住（本次会话）
      isLectureOpen(lecture) {
        if (this.lectureFilter !== 0) return true;
        const t = this.lectureToggles[lecture];
        return t === undefined ? lecture === 1 : t;
      },
      toggleLecture(lecture) {
        if (this.lectureFilter !== 0) return;  // 单讲视图仅一讲，折叠无意义
        this.lectureToggles = { ...this.lectureToggles, [lecture]: !this.isLectureOpen(lecture) };
      },
      onScroll(e) {
        const el = e.target;
        const max = el.scrollHeight - el.clientHeight;
        this.scrollPct = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0;
        if (this.section === 'lesson') {
          const heads = document.querySelectorAll('.lesson-section');
          let cur = null;
          heads.forEach(h => { if (h.getBoundingClientRect().top < 130) cur = h.id.replace('sec-', ''); });
          // 只标记当前激活节（不再把上方全部标完成）；URL 静默跟随（不刷历史栈）
          if (cur && cur !== this.activeId) {
            this.activeId = cur;
            this.markVisited(cur);
            try { history.replaceState(null, '', '#sec-' + cur); } catch (e) {}
          }
        }
      },
      setupReveal(instantEl) {
        if (this._observer) this._observer.disconnect();
        const root = this.$refs.content;
        const els = document.querySelectorAll('.reveal, .reveal-item');
        if (!('IntersectionObserver' in window) || !root) {
          els.forEach(el => { el.classList.add('in', 'rv-done'); });
          return;
        }
        // 单块浮现：同批元素按 35ms 递进 stagger；入场完成后（rv-done）
        // 切回 150ms 微交互节奏，并清掉内联 stagger 延迟，避免拖慢 hover
        const reveal = (el, i) => {
          const d = Math.min(i, 12) * 35;
          if (d) el.style.setProperty('--rd', d + 'ms');
          el.classList.add('in');
          setTimeout(() => {
            el.classList.add('rv-done');
            el.style.removeProperty('--rd');
          }, d + 700);
        };
        this._observer = new IntersectionObserver((entries) => {
          let i = 0;
          entries.forEach(en => {
            if (en.isIntersecting && !en.target.classList.contains('in')) reveal(en.target, i++);
          });
        }, { root, threshold: 0.04 });
        // 兜底：初始视口内的元素同步点亮（无滚动 / 无头截图场景不等异步回调），
        // widget 等重组件因此不会卡在 opacity:0
        const rb = root.getBoundingClientRect();
        let sync = 0;
        els.forEach(el => {
          this._observer.observe(el);
          if (el.classList.contains('in')) return;
          // 深链直达的目标节：直接终态，跳过 stagger
          if (instantEl && (el === instantEl || instantEl.contains(el))) {
            el.classList.add('in', 'rv-done');
            return;
          }
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.top < rb.bottom && r.bottom > rb.top) reveal(el, sync++);
        });
      },
    },
    mounted() {
      document.body.dataset.lang = this.lang;
      document.documentElement.dataset.theme = this.theme;
      document.documentElement.lang = this.lang === 'en' ? 'en' : 'zh-CN';
      this._routeSeq = 0;   // 路由竞态序号（非响应式实例属性）
      this._filterSeq = 0;  // 讲筛选竞态序号
      this._route = () => this.syncFromHash(true);
      window.addEventListener('hashchange', this._route);
      this.syncFromHash(false);   // 初始化：读 hash 恢复位置（深链/刷新保位，直达终态；
                                  //   深链落在未加载讲时先 await ensureLecture 再渲染）
    },
    beforeUnmount() {
      window.removeEventListener('hashchange', this._route);
      if (this._observer) this._observer.disconnect();
    },
  });

  Object.entries(window.COMPONENTS).forEach(([name, comp]) => app.component(name, comp));
  // 懒加载器补挂后续组件用（loader.js 在各讲注入完成后调 syncComponents）
  window.__RLV_APP = app;

  app.config.errorHandler = (err, inst, info) => {
    const name = inst && (inst.$options ? inst.$options.name : inst.type && inst.type.name);
    console.error('[VueErr]', err && err.message, '| at:', name, '| hook:', info);
  };

  // 根模板来自 window.ROOT_TEMPLATE（root-template.js）；#app 只是挂载点
  app.mount('#app');
})();
