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

  // 双语段落渲染：中文 + 英文（CSS 控制显示模式）
  const fmt = (blk) =>
    `<span class="zh du-line">${blk.zh}</span><span class="en du-line">${blk.en}</span>`;

  const ICONS = { key: '🔑', warn: '⚠️', danger: '🚫', idea: '💡', done: '✅' };

  const app = createApp({
    data: () => ({
      section: 'home',            // 'home' | 'lesson'
      activeId: 'grid-world',
      lang: localStorage.getItem('rl-viz-lang') || 'both',
      visited: new Set(),
      sidebarOpen: false,
      scrollPct: 0,
      lectureFilter: 0,           // 0 = 全部 / else lecture no
      lectureToggles: {},         // 讲级折叠的用户手动开关：{ lecture: true|false }（会话内记住）
      theme: loadTheme(),
      themes: THEMES,
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
      lectureFilter() { this.$nextTick(() => { this.setupReveal(); }); },
    },
    methods: {
      fmt,
      bi(zh, en) { return `<span class="zh du-line">${zh}</span><span class="en du-line">${en}</span>`; },
      iconFor(v) { return ICONS[v] || '🔑'; },
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
        localStorage.setItem('rl-viz-lang', k);
        document.body.dataset.lang = k;
      },
      setTheme(k) {
        this.theme = k;
        document.documentElement.dataset.theme = k;
        try { localStorage.setItem('rl-viz-theme', k); } catch (e) {}
      },
      go(id) {
        this.sidebarOpen = false;
        if (id === 'home') {
          this.section = 'home';
          this.$nextTick(() => { this.$refs.content.scrollTop = 0; this.setupReveal(); });
          return;
        }
        const grp = D.navGroups.find(g => g.items.some(it => it.id === id));
        if (grp) this.lectureFilter = grp.lecture;
        this.section = 'lesson';
        this.activeId = id;          // 侧栏高亮立即跟随点击目标（不等滚动事件）
        this.visited.add(id);
        this.$nextTick(() => {
          this.setupReveal();
          const el = document.getElementById('sec-' + id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      filterLecture(no) {
        this.lectureFilter = this.lectureFilter === no ? 0 : no;
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
          if (cur) {
            this.activeId = cur;
            this.visited.add(cur);
            const i = this.allNavItems.findIndex(n => n.id === cur);
            heads.forEach((h, j) => { if (j <= i) this.visited.add(h.id.replace('sec-', '')); });
          }
        }
      },
      setupReveal() {
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
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.top < rb.bottom && r.bottom > rb.top) reveal(el, sync++);
        });
      },
    },
    mounted() {
      document.body.dataset.lang = this.lang;
      document.documentElement.dataset.theme = this.theme;
      this.setupReveal();
    },
  });

  Object.entries(window.COMPONENTS).forEach(([name, comp]) => app.component(name, comp));

  app.config.errorHandler = (err, inst, info) => {
    const name = inst && (inst.$options ? inst.$options.name : inst.type && inst.type.name);
    console.error('[VueErr]', err && err.message, '| at:', name, '| hook:', info);
  };

  // 挂载元素 #app 的 innerHTML 即为根模板（Vue 全局构建的默认行为）
  app.mount('#app');
})();
