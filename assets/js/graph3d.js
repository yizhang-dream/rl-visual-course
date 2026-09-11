/* ═══════════════════════════════════════════════════════════════
   知识星图 · Knowledge Constellation — UI 层（纯 DOM，本页不用 Vue）
   消费两个可选全局（缺件时全部 typeof 守卫，优雅降级）：
   - window.GRAPH3D   知识图数据（assets/js/graph3d-data.js）
   - window.G3DRender 3D 渲染器工厂（assets/js/graph3d-render.js）
   缺件 / WebGL 失败 → 显示 #g3d-fallback 大纲模式；
   筛选 / 搜索 / 信息面板 / 统计不依赖渲染器，照常工作。
   无 fetch/XHR（file:// 双击可用）；缺件路径不产生 console.error。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const LANG_KEY = 'rl-viz-lang';
  const THEME_KEY = 'rl-viz-theme';
  const VISITED_KEY = 'rl-viz-visited';

  function $(id) { return document.getElementById(id); }
  function lsGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function lsSet(key, val) { try { localStorage.setItem(key, val); } catch { /* 隐私模式写不进就算了 */ } }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  // sum 等字段可能是字符串，也可能是 {zh,en}：统一成双语对
  function biText(v) {
    if (v && typeof v === 'object') return { zh: v.zh || '', en: v.en || '' };
    return { zh: typeof v === 'string' ? v : '', en: '' };
  }

  // ── 数据接入（缺文件 / 字段残缺都降级为空图）─────────────────
  // GRAPH3D.lectures 缺失时，讲 chips 仍要能渲染（title 用站点通用讲名兜底）
  const LECTURE_FALLBACK = [
    { no: 1, id: 'L1', zh: 'L1 · 基本概念', en: 'L1 · Basic concepts' },
    { no: 2, id: 'L2', zh: 'L2 · 状态价值与 Bellman 方程', en: 'L2 · Bellman equation' },
    { no: 3, id: 'L3', zh: 'L3 · Bellman 最优方程', en: 'L3 · Bellman optimality' },
    { no: 4, id: 'L4', zh: 'L4 · 值迭代与策略迭代', en: 'L4 · Value & policy iteration' },
    { no: 5, id: 'L5', zh: 'L5 · 蒙特卡洛方法', en: 'L5 · Monte Carlo methods' },
    { no: 6, id: 'L6', zh: 'L6 · 随机近似', en: 'L6 · Stochastic approximation' },
    { no: 7, id: 'L7', zh: 'L7 · 时序差分方法', en: 'L7 · Temporal-difference methods' },
    { no: 8, id: 'L8', zh: 'L8 · 值函数近似', en: 'L8 · Value function approximation' },
    { no: 9, id: 'L9', zh: 'L9 · 策略梯度方法', en: 'L9 · Policy gradient methods' },
    { no: 10, id: 'L10', zh: 'L10 · Actor-Critic 方法', en: 'L10 · Actor-Critic methods' },
  ];

  const G = (typeof GRAPH3D !== 'undefined' && GRAPH3D && Array.isArray(GRAPH3D.nodes)) ? GRAPH3D : null;
  const nodes = G ? G.nodes : [];
  const edges = (G && Array.isArray(G.edges)) ? G.edges : [];
  const threads = (G && Array.isArray(G.threads)) ? G.threads : [];
  const lectures = (G && Array.isArray(G.lectures) && G.lectures.length === 10) ? G.lectures : LECTURE_FALLBACK;
  const meta = (G && G.meta) || {};
  const N_SECTIONS = Number(meta.sections) || 88;
  const N_HUBS = Number(meta.hubs) || 10;

  const nodeById = new Map();
  const orderIdx = new Map();   // 数据内序号：同讲内按出现序排（组内序）
  nodes.forEach((n, i) => {
    if (n && typeof n.id === 'string') { nodeById.set(n.id, n); orderIdx.set(n.id, i); }
  });

  // 邻接表：入边 / 出边（边方向 = 知识流：前置 → 后继）
  const incoming = new Map();
  const outgoing = new Map();
  function adjPush(map, k, e) {
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  }
  edges.forEach(e => {
    if (!e || typeof e.s !== 'string' || typeof e.t !== 'string') return;
    adjPush(outgoing, e.s, e);
    adjPush(incoming, e.t, e);
  });

  // rel 语义：pre/app 算「前置类」（知识空间 / 前沿 / 路径），kin/ext 算「关联」
  const isPreLike = e => e.type === 'link' && (e.rel === 'pre' || e.rel === 'app');
  const isKinLike = e => e.type === 'link' && (e.rel === 'kin' || e.rel === 'ext');
  // 隐式前置：非首节依赖本讲首节（进一讲先读开头）；讲首节依赖上一讲首节
  // （数学基础书线性递进，知识前沿按章解锁）。nodes 按阅读序，讲内第一个 sec 即首节
  const firstSecOfLecture = new Map();
  nodes.forEach(n => {
    if (n && n.type === 'sec' && !firstSecOfLecture.has(n.lecture)) firstSecOfLecture.set(n.lecture, n.id);
  });
  function implicitPres(id) {
    const n = nodeById.get(id);
    if (!n || n.type !== 'sec') return [];
    const first = firstSecOfLecture.get(n.lecture);
    if (first && first !== id) return [first];
    const prev = n.lecture > 1 ? firstSecOfLecture.get(n.lecture - 1) : null;
    return prev ? [prev] : [];
  }
  function presOf(id) { return (incoming.get(id) || []).filter(isPreLike).map(e => e.s); }
  function succsOf(id) { return (outgoing.get(id) || []).filter(isPreLike).map(e => e.t); }
  function relatedOf(id) {
    const out = [];
    const seen = new Set();
    (incoming.get(id) || []).concat(outgoing.get(id) || []).forEach(e => {
      if (!isKinLike(e)) return;
      [e.s, e.t].forEach(other => {
        if (other !== id && nodeById.has(other) && !seen.has(other)) { seen.add(other); out.push(other); }
      });
    });
    return out;
  }

  // ── 状态 ─────────────────────────────────────────────────────
  function loadVisited() {
    try {
      const arr = JSON.parse(lsGet(VISITED_KEY) || '[]');
      return new Set(Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : []);
    } catch { return new Set(); }
  }

  const state = {
    selected: null,
    lectureFilter: null,                    // Set<讲号> | null（null = 全部）
    edgeToggles: { link: true, struct: false, spine: true },
    activeThread: null,
    frontierMode: false,
    visited: loadVisited(),
  };

  let renderer = null;        // window.G3DRender 实例（可能为 null）
  let frontierCache = [];     // 最近一次计算的前沿 id 数组
  const infoEl = $('g3d-info');

  // ── 知识空间计算 ─────────────────────────────────────────────
  // 前沿：sec 节点、未读，且（精选前置入边 + 隐式“本讲首节”）全部已读
  function computeFrontier() {
    const out = [];
    nodes.forEach(n => {
      if (!n || n.type !== 'sec' || state.visited.has(n.id)) return;
      const ready = presOf(n.id).concat(implicitPres(n.id)).every(pid =>
        state.visited.has(pid) || (nodeById.get(pid) || {}).type === 'hub');
      if (ready) out.push(n.id);
    });
    return out;
  }
  function refreshFrontier() {
    frontierCache = computeFrontier();
    updateStats();
    applyFocus();
  }
  // 前置路径：沿前置类入边（含隐式“本讲首节”）的祖先闭包；按讲号 + 组内序排拓扑展示序
  function prereqClosure(id) {
    const seen = new Set([id]);
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      presOf(cur).concat(implicitPres(cur)).forEach(p => {
        if (!seen.has(p)) { seen.add(p); stack.push(p); }
      });
    }
    return seen;
  }
  function topoSort(ids) {
    return Array.from(ids).sort((a, b) => {
      const la = (nodeById.get(a) || {}).lecture || 99;
      const lb = (nodeById.get(b) || {}).lecture || 99;
      if (la !== lb) return la - lb;
      return (orderIdx.get(a) || 0) - (orderIdx.get(b) || 0);
    });
  }

  // ── 渲染器联动（全部容错，渲染器异常不拖垮面板）──────────────
  function currentFilters() {
    return {
      lectures: state.lectureFilter ? new Set(state.lectureFilter) : null,
      edges: {
        link: !!state.edgeToggles.link,
        struct: !!state.edgeToggles.struct,
        spine: !!state.edgeToggles.spine,
      },
    };
  }
  function pushFilters() {
    if (!renderer) return;
    try { renderer.setFilters(currentFilters()); } catch { /* 静默 */ }
  }
  // 焦点优先级：线索模式 > 前沿模式 > 选中节点（选中至少亮自身）
  function applyFocus() {
    if (!renderer) return;
    let ids = null;
    if (state.activeThread) {
      const t = threads.find(x => x && x.id === state.activeThread);
      ids = (t && Array.isArray(t.members)) ? t.members : null;
    } else if (state.frontierMode) {
      ids = frontierCache;
    } else if (state.selected) {
      ids = [state.selected];
    }
    try { renderer.setFocus(ids); } catch { /* 静默 */ }
  }
  function initRenderer() {
    if (typeof G3DRender === 'undefined' || !G3DRender || typeof G3DRender.create !== 'function') return null;
    const canvasEl = $('g3d-canvas');
    const labelsEl = $('g3d-labels');
    if (!canvasEl || !labelsEl) return null;
    let reduced;
    try {
      reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch { reduced = false; }
    try {
      const r = G3DRender.create(canvasEl, labelsEl, { reducedMotion: reduced });
      return r || null;   // WebGL 失败等 → create 返回 null → 走 fallback
    } catch { return null; }
  }
  function onCanvasSelect(id) {
    if (id == null) { clearSelection(); return; }
    selectNode(id);
  }
  function onCanvasHover(id) {
    const el = $('g3d-canvas');
    if (el) el.classList.toggle('is-hover', id != null);
  }

  // ── 主题 / 语言 ──────────────────────────────────────────────
  function setTheme(key) {
    if (!key) return;
    document.documentElement.dataset.theme = key;
    lsSet(THEME_KEY, key);
    document.querySelectorAll('.g3d-theme-btn').forEach(b => {
      const on = b.dataset.theme === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (renderer) { try { renderer.refreshTheme(); } catch { /* 静默 */ } }
  }
  function setLang(key) {
    const k = (key === 'zh' || key === 'en') ? key : 'both';
    document.body.dataset.lang = k;
    lsSet(LANG_KEY, k);
    document.documentElement.lang = k === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('.g3d-lang-btn').forEach(b => {
      const on = b.dataset.lang === k;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // ── 面板构建 ─────────────────────────────────────────────────
  function buildLectureChips() {
    const box = $('g3d-lecture-chips');
    if (!box) return;
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'g3d-chip g3d-chip-all is-active';
    all.setAttribute('data-lecture', 'all');
    all.innerHTML = '<span class="zh">全部</span><span class="en">All</span>';
    all.addEventListener('click', () => {
      state.lectureFilter = null;
      syncChipUI();
      pushFilters();
    });
    box.appendChild(all);
    lectures.forEach(l => {
      if (!l || typeof l.no !== 'number') return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'g3d-chip g3d-chip-lecture';
      b.setAttribute('data-lecture', String(l.no));
      b.title = (l.zh || '') + ' / ' + (l.en || '');
      b.innerHTML = '<i class="g3d-dot dot-l' + l.no + '"></i>L' + l.no;
      b.addEventListener('click', () => {
        // 单选 toggle：点同一枚 chip 取消筛选
        state.lectureFilter = (state.lectureFilter && state.lectureFilter.has(l.no))
          ? null : new Set([l.no]);
        syncChipUI();
        pushFilters();
      });
      box.appendChild(b);
    });
  }
  function syncChipUI() {
    document.querySelectorAll('.g3d-chip').forEach(b => {
      const v = b.getAttribute('data-lecture');
      const on = v === 'all'
        ? state.lectureFilter == null
        : !!state.lectureFilter && state.lectureFilter.has(Number(v));
      b.classList.toggle('is-active', on);
    });
  }
  function buildThreadList() {
    const box = $('g3d-thread-list');
    if (!box) return;
    if (!threads.length) {
      box.innerHTML = '<li class="g3d-thread-empty"><span class="zh">线索数据未加载</span><span class="en">Threads unavailable</span></li>';
      return;
    }
    box.innerHTML = threads.map(t =>
      '<li><button type="button" class="g3d-thread-item" data-thread="' + esc(t.id) + '">' +
      '<span class="zh">' + esc(t.zh) + '</span><span class="en">' + esc(t.en) + '</span></button></li>'
    ).join('');
    box.addEventListener('click', ev => {
      const btn = ev.target && ev.target.closest ? ev.target.closest('.g3d-thread-item') : null;
      if (btn) toggleThread(btn.getAttribute('data-thread'));
    });
  }
  function toggleThread(id) {
    if (!id) return;
    state.activeThread = state.activeThread === id ? null : id;
    document.querySelectorAll('.g3d-thread-item').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-thread') === state.activeThread);
    });
    if (state.selected) {
      const n = nodeById.get(state.selected);
      if (n) renderInfo(n);   // 信息面板里的线索 badges 同步高亮态
    }
    applyFocus();
  }
  function buildFallback() {
    const outline = $('g3d-outline');
    if (!outline) return;
    if (!nodes.length) {
      outline.innerHTML = '<p class="g3d-fallback-note"><span class="zh">知识图数据未加载（assets/js/graph3d-data.js 缺失）。</span><span class="en">Graph data not loaded (assets/js/graph3d-data.js missing).</span></p>';
      return;
    }
    outline.innerHTML = nodes.filter(n => n && n.type === 'sec').map(n => {
      const g = n.group || {};
      const tag = 'L' + (n.lecture || '?');
      return '<button type="button" class="g3d-outline-item" data-id="' + esc(n.id) + '">' +
        '<i class="g3d-dot dot-l' + (n.lecture || 0) + '"></i>' +
        '<span class="zh">' + tag + ' · ' + esc(g.zh || '') + ' · ' + esc(n.zh) + '</span>' +
        '<span class="en">' + tag + ' · ' + esc(g.en || '') + ' · ' + esc(n.en) + '</span></button>';
    }).join('');
  }

  // ── 信息面板 ─────────────────────────────────────────────────
  function relBtnHtml(id, extraClass) {
    const n = nodeById.get(id);
    if (!n) return '';
    const done = (n.type === 'sec' && state.visited.has(id)) ? ' is-done' : '';
    const tag = 'L' + (n.lecture || '?');
    return '<button type="button" class="g3d-rel-item' + done + (extraClass ? ' ' + extraClass : '') +
      '" data-id="' + esc(id) + '">' +
      '<span class="zh">' + tag + ' · ' + esc(n.zh) + '</span>' +
      '<span class="en">' + tag + ' · ' + esc(n.en) + '</span></button>';
  }
  function relGroupHtml(titleZh, titleEn, ids) {
    if (!ids.length) return '';
    return '<div class="g3d-rel-group">' +
      '<h3 class="g3d-rel-title"><span class="zh">' + titleZh + '</span><span class="en">' + titleEn + '</span></h3>' +
      '<div class="g3d-rel-list">' + ids.map(x => relBtnHtml(x)).join('') + '</div></div>';
  }
  function threadBadgesHtml(id) {
    return threads
      .filter(t => t && Array.isArray(t.members) && t.members.indexOf(id) !== -1)
      .map(t =>
        '<button type="button" class="g3d-thread-badge' + (state.activeThread === t.id ? ' is-active' : '') +
        '" data-thread="' + esc(t.id) + '">' +
        '<span class="zh">' + esc(t.zh) + '</span><span class="en">' + esc(t.en) + '</span></button>')
      .join('');
  }
  function renderInfo(n) {
    if (!infoEl || !n) return;
    const kicker = infoEl.querySelector('.g3d-kicker');
    const title = infoEl.querySelector('.g3d-title');
    const sumEl = infoEl.querySelector('.g3d-sum');
    const conceptsEl = infoEl.querySelector('.g3d-concepts');
    const relsEl = infoEl.querySelector('.g3d-rels');
    const threadBox = infoEl.querySelector('.g3d-threads-box');
    const badgesEl = infoEl.querySelector('.g3d-thread-badges');
    const goEl = infoEl.querySelector('.g3d-go');
    const pathBtn = infoEl.querySelector('.g3d-path');
    const pathBox = $('g3d-path-box');
    if (!kicker || !title || !sumEl || !conceptsEl || !relsEl || !threadBox || !badgesEl || !goEl || !pathBtn) return;
    if (pathBox) pathBox.hidden = true;   // 换节点就收起上一条路径

    const isHub = n.type === 'hub';
    const sumT = biText(n.sum);
    let goId = n.id;
    let sumHtml;

    if (isHub) {
      const lec = n.lecture || 0;
      const secs = nodes.filter(m => m && m.type === 'sec' && m.lecture === lec);
      const read = secs.filter(m => state.visited.has(m.id)).length;
      kicker.innerHTML = '<span class="zh">第 ' + lec + ' 讲 · 枢纽</span><span class="en">Lecture ' + lec + ' · Hub</span>';
      sumHtml = '<span class="zh">共 ' + secs.length + ' 个小节 · 已读 ' + read + '</span>' +
        '<span class="en">' + secs.length + ' sections · ' + read + ' visited</span>';
      goId = secs.length ? secs[0].id : null;   // hub 的「去学习」指向该讲首节
    } else {
      const grp = n.group || {};
      const tag = 'L' + (n.lecture || '?');
      kicker.innerHTML = '<span class="zh">' + tag + ' · ' + esc(grp.zh || '') + '</span>' +
        '<span class="en">' + tag + ' · ' + esc(grp.en || '') + '</span>';
      sumHtml = '<span class="zh">' + esc(sumT.zh) + '</span><span class="en">' + esc(sumT.en) + '</span>';
    }
    title.innerHTML = '<span class="zh">' + esc(n.zh) + '</span><span class="en">' + esc(n.en) + '</span>';
    sumEl.innerHTML = sumHtml;

    const cps = isHub ? [] : (Array.isArray(n.concepts) ? n.concepts : []);
    conceptsEl.innerHTML = cps.map(c => '<span class="g3d-concept">' + esc(c) + '</span>').join('');
    conceptsEl.hidden = !cps.length;

    // 关联区：前置 = 入边 pre/app 源（含隐式“本讲首节”）；后继 = 出边 pre/app 目标；关联 = kin/ext 双向
    const preIds = presOf(n.id).concat(implicitPres(n.id)).filter(x => nodeById.has(x) && x !== n.id);
    const sucIds = succsOf(n.id).filter(x => nodeById.has(x) && x !== n.id);
    const kinIds = relatedOf(n.id);
    relsEl.innerHTML =
      relGroupHtml('前置', 'Prerequisites', preIds) +
      relGroupHtml('后继', 'Successors', sucIds) +
      relGroupHtml('关联', 'Related', kinIds);
    relsEl.hidden = !(preIds.length || sucIds.length || kinIds.length);

    const tb = threadBadgesHtml(n.id);
    badgesEl.innerHTML = tb;
    threadBox.hidden = !tb;

    if (goId) {
      goEl.hidden = false;
      goEl.href = 'index.html#sec-' + encodeURIComponent(goId);
      goEl.innerHTML = '<span class="zh">去学习 →</span><span class="en">Open →</span>';
    } else {
      goEl.hidden = true;
    }
    pathBtn.hidden = isHub;   // hub 无前置语义，不提供路径计算
    pathBtn.innerHTML = '<span class="zh">前置路径</span><span class="en">Prereq path</span>';
  }
  function showPrereqPath() {
    if (!state.selected) return;
    const ordered = topoSort(prereqClosure(state.selected));
    if (renderer) { try { renderer.setFocus(ordered); } catch { /* 静默 */ } }
    const box = $('g3d-path-box');
    const list = $('g3d-path-list');
    if (!box || !list) return;
    list.innerHTML = ordered.map((id, i) => {
      const n = nodeById.get(id);
      if (!n) return '';
      const tag = 'L' + (n.lecture || '?');
      return '<button type="button" class="g3d-rel-item g3d-path-item" data-id="' + esc(id) + '">' +
        '<span class="zh">' + (i + 1) + '. ' + tag + ' · ' + esc(n.zh) + '</span>' +
        '<span class="en">' + (i + 1) + '. ' + tag + ' · ' + esc(n.en) + '</span></button>';
    }).join('');
    box.hidden = false;
  }

  // ── 选中 / 清除 ──────────────────────────────────────────────
  function selectNode(id) {
    const n = nodeById.get(id);
    if (!n || !infoEl) return;
    state.selected = id;
    renderInfo(n);
    infoEl.hidden = false;
    if (renderer) { try { renderer.flyTo(id, { ms: 600 }); } catch { /* 飞行失败不影响面板 */ } }
    applyFocus();   // 非前沿/线索模式 → setFocus([id])
  }
  function clearSelection() {
    state.selected = null;
    if (infoEl) infoEl.hidden = true;
    applyFocus();
  }

  // ── 搜索（zh/en 标题 + concepts，不分大小写，≤8 条）──────────
  let lastResults = [];
  function runSearch() {
    const searchInput = $('g3d-search');
    const resultsBox = $('g3d-results');
    if (!searchInput || !resultsBox) return;
    const q = searchInput.value.trim().toLowerCase();
    lastResults = [];
    if (q) {
      for (let i = 0; i < nodes.length && lastResults.length < 8; i++) {
        const n = nodes[i];
        if (!n) continue;
        const concepts = Array.isArray(n.concepts) ? n.concepts : [];
        const hay = (String(n.zh || '') + '\n' + String(n.en || '') + '\n' + concepts.join('\n')).toLowerCase();
        if (hay.indexOf(q) !== -1) lastResults.push(n);
      }
    }
    resultsBox.innerHTML = lastResults.map(n => {
      const tag = 'L' + (n.lecture || '?');
      return '<button type="button" class="g3d-result" data-id="' + esc(n.id) + '">' +
        '<span class="zh">' + tag + ' · ' + esc(n.zh) + '</span>' +
        '<span class="en">' + tag + ' · ' + esc(n.en) + '</span></button>';
    }).join('');
    resultsBox.classList.toggle('has-items', lastResults.length > 0);
  }

  // ── 统计条（文本模板保证含字面 '88' / '10'）──────────────────
  function visitedSecCount() {
    if (!nodes.length) return state.visited.size;
    let c = 0;
    state.visited.forEach(id => {
      const n = nodeById.get(id);
      if (n && n.type === 'sec') c += 1;
    });
    return c;
  }
  function updateStats() {
    const zh = document.querySelector('#g3d-stats .zh');
    const en = document.querySelector('#g3d-stats .en');
    const v = visitedSecCount();
    if (zh) zh.textContent = N_SECTIONS + ' 个小节 · ' + N_HUBS + ' 讲 · 已读 ' + v + ' · 前沿可学 ' + frontierCache.length;
    if (en) en.textContent = N_SECTIONS + ' sections · ' + N_HUBS + ' lectures · visited ' + v + ' · ready to learn ' + frontierCache.length;
  }

  // ── 静态交互接线 ─────────────────────────────────────────────
  function wireStatic() {
    // 控制面板折叠（移动端默认收起为抽屉按钮）
    const controls = $('g3d-controls');
    const toggleBtn = $('g3d-controls-toggle');
    if (controls && toggleBtn) {
      let small;
      try { small = !!(window.matchMedia && window.matchMedia('(max-width: 900px)').matches); } catch { small = false; }
      if (small) {
        controls.classList.add('is-collapsed');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
      toggleBtn.addEventListener('click', () => {
        const collapsed = controls.classList.toggle('is-collapsed');
        toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      });
    }

    // 边显示三开关
    [['g3d-edge-link', 'link'], ['g3d-edge-struct', 'struct'], ['g3d-edge-spine', 'spine']].forEach(pair => {
      const el = $(pair[0]);
      if (!el) return;
      el.checked = !!state.edgeToggles[pair[1]];
      el.addEventListener('change', () => {
        state.edgeToggles[pair[1]] = !!el.checked;
        pushFilters();
      });
    });

    // 知识前沿开关
    const frontierToggle = $('g3d-frontier-toggle');
    if (frontierToggle) {
      frontierToggle.addEventListener('change', () => {
        state.frontierMode = !!frontierToggle.checked;
        applyFocus();
      });
    }

    // 搜索：即时过滤 + Enter 选第一条 + 点击结果选中
    const searchInput = $('g3d-search');
    const resultsBox = $('g3d-results');
    if (searchInput) {
      searchInput.addEventListener('input', runSearch);
      searchInput.addEventListener('keydown', ev => {
        if (ev.key !== 'Enter' || !lastResults.length) return;
        ev.preventDefault();
        selectNode(lastResults[0].id);
      });
    }
    if (resultsBox) {
      resultsBox.addEventListener('click', ev => {
        const btn = ev.target && ev.target.closest ? ev.target.closest('.g3d-result') : null;
        if (btn) selectNode(btn.getAttribute('data-id'));
      });
    }

    // 信息面板事件委托（关联项 / 线索 badge / 关闭 / 路径）
    if (infoEl) {
      infoEl.addEventListener('click', ev => {
        const t = ev.target;
        if (!t || !t.closest) return;
        const rel = t.closest('.g3d-rel-item');
        if (rel && rel.getAttribute('data-id')) { selectNode(rel.getAttribute('data-id')); return; }
        const badge = t.closest('.g3d-thread-badge');
        if (badge && badge.getAttribute('data-thread')) { toggleThread(badge.getAttribute('data-thread')); return; }
        if (t.closest('.g3d-info-close')) { clearSelection(); return; }
        if (t.closest('.g3d-path')) showPrereqPath();
      });
    }

    // 主题圆点 / 语言三段
    document.querySelectorAll('.g3d-theme-btn').forEach(b => {
      b.addEventListener('click', () => setTheme(b.dataset.theme));
    });
    document.querySelectorAll('.g3d-lang-btn').forEach(b => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });

    // 降级大纲清单点击（信息面板照常工作）
    const outline = $('g3d-outline');
    if (outline) {
      outline.addEventListener('click', ev => {
        const btn = ev.target && ev.target.closest ? ev.target.closest('.g3d-outline-item') : null;
        if (btn) selectNode(btn.getAttribute('data-id'));
      });
    }
  }

  // ── 启动 ─────────────────────────────────────────────────────
  function boot() {
    const savedLang = lsGet(LANG_KEY);
    setLang(savedLang === 'zh' || savedLang === 'en' ? savedLang : 'both');

    buildLectureChips();
    buildThreadList();
    buildFallback();
    wireStatic();

    renderer = initRenderer();
    if (renderer && G) {
      try {
        renderer.setGraph(G);
        renderer.onSelect(onCanvasSelect);
        renderer.onHover(onCanvasHover);
        renderer.setFilters(currentFilters());
        renderer.setMarks({ visited: state.visited });
      } catch { renderer = null; }   // 场景构建失败 → 降级大纲模式
    }

    refreshFrontier();
    const loading = $('g3d-loading');
    if (loading) loading.hidden = true;   // setGraph 完成（或走降级）后隐藏
    if (!(renderer && G)) {
      const fb = $('g3d-fallback');
      if (fb) fb.hidden = false;
    }

    window.addEventListener('resize', () => {
      if (renderer) { try { renderer.resize(); } catch { /* 静默 */ } }
    });
    // 其他标签页改了已读进度 → 同步 marks / frontier / 统计 / 信息面板
    window.addEventListener('storage', ev => {
      if (!ev || ev.key !== VISITED_KEY) return;
      state.visited = loadVisited();
      if (renderer) { try { renderer.setMarks({ visited: state.visited }); } catch { /* 静默 */ } }
      refreshFrontier();
      if (state.selected) renderInfo(nodeById.get(state.selected));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
