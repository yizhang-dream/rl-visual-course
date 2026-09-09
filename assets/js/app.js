/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · 根应用
   ═══════════════════════════════════════════════════════════ */
(function () {
  const { createApp } = Vue;
  const D = window.DATA;

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
      setLang(k) {
        this.lang = k;
        localStorage.setItem('rl-viz-lang', k);
        document.body.dataset.lang = k;
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
        this.$nextTick(() => {
          this.setupReveal();
          const el = document.getElementById('sec-' + id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      filterLecture(no) {
        this.lectureFilter = this.lectureFilter === no ? 0 : no;
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
        this._observer = new IntersectionObserver((entries) => {
          entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); } });
        }, { root: this.$refs.content, threshold: 0.04 });
        document.querySelectorAll('.reveal').forEach(el => this._observer.observe(el));
      },
    },
    mounted() {
      document.body.dataset.lang = this.lang;
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
