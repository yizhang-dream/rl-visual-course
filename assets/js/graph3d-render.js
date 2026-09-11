/* ═══════════════════════════════════════════════════════════════════════
   RL 可视化课堂 · 知识星图 3D 渲染器（window.G3DRender）

   Vendor：3d-force-graph@1.80.0，UMD 挂全局 ForceGraph3D（自带 three.js，
   页面勿另引 THREE）。再 vendor 命令：
     cd rl-viz && npm i -D 3d-force-graph
     cp node_modules/3d-force-graph/dist/3d-force-graph.min.js assets/vendor/graph3d/
   （dist 内有 .js / .min.js / .mjs / .d.ts 多个文件，只拷 .min.js 一个。）

   颜色契约：一切颜色读自站点 CSS 变量（--accent / --violet / --gold / --green /
   --cyan / --line / --ink-3 / --ink / --bg），不写死最终色值（白/灰仅作混色
   中间值与 token 全缺失时的兜底）。refreshTheme() 重读 token 后用「自引用
   刷新」惯用法（graph.nodeColor(graph.nodeColor())）强制重算节点/边样式。
   讲号 → 分支 token：L1→--accent；L2,L3→--violet；L4→--gold；
   L5–L8→--green；L9,L10→--cyan。

   边透明度实现：v1.80 中链接材质透明度 = linkOpacity × colorAlpha(linkColor)，
   故全局 linkOpacity 固定 1，逐边透明度编码进 rgba() 串——
   link(rel) 边 0.5；struct 边低透明度 0.18；spine 边 0.30；
   focus 压暗的非关联边再乘 0.12（近乎隐藏）。

   布局为确定性自算（不依赖随机数）：hub 按讲号排在 xz 圆周
   angle=(no-1)/10*2π+π/10、radius=260；各讲第 k 个 member 绕其 hub
   黄金角螺旋 r=60+14·√k、θ=k·2.399963+hubAngle、y=18·sin(k·1.7+no)。
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const TAU = Math.PI * 2;
  const GOLDEN = 2.399963;   // 黄金角（弧度）
  const HUB_RING_R = 260;    // hub 圆周半径
  const MEMBER_R0 = 60;      // member 螺旋起始半径
  const MEMBER_DR = 14;      // member 半径增量系数
  const LABEL_CAP = 140;     // 标签 DOM 池上限
  // 混色中间值（非最终色用途）：提亮已读节点 / token 全缺失时的兜底
  const WHITE = { r: 255, g: 255, b: 255 };
  const NEUTRAL = { r: 128, g: 128, b: 128 };

  /* ── 颜色工具：CSS 变量读取 / 解析（hex 与 rgb()/rgba() 皆可）/ 混色 ── */

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // 解析 #rgb/#rgba/#rrggbb/#rrggbbaa 与 rgb()/rgba()（含空格分隔与百分比）；
  // 返回 {r,g,b}（8 位 hex/rgba 的 alpha 在此丢弃，透明度由各用点自行控制）
  function parseColor(str) {
    if (str == null) return null;
    const s = String(str).trim().toLowerCase();
    if (s.charAt(0) === '#') {
      let h = s.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map((ch) => ch + ch).join('');
      if (h.length === 6) h += 'ff';
      if (h.length !== 8 || /[^0-9a-f]/.test(h)) return null;
      const n = parseInt(h, 16);
      return { r: (n >>> 24) & 255, g: (n >>> 16) & 255, b: (n >>> 8) & 255 };
    }
    const m = /^rgba?\(([^)]+)\)$/.exec(s);
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const ch = [];
    for (let i = 0; i < 3; i++) {
      const p = parts[i];
      const v = p.charAt(p.length - 1) === '%' ? parseFloat(p) * 2.55 : parseFloat(p);
      if (isNaN(v)) return null;
      ch.push(Math.max(0, Math.min(255, Math.round(v))));
    }
    return { r: ch[0], g: ch[1], b: ch[2] };
  }

  function mix(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  function rgbStr(c) {
    return 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')';
  }

  function rgbaStr(c, alpha) {
    return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + alpha + ')';
  }

  // 按兜底链读 token（某些主题变量可能被覆写为 rgba() 串，parseColor 均可解析）
  function tokenColor(names) {
    for (const n of names) {
      const c = parseColor(cssVar(n));
      if (c) return c;
    }
    return null;
  }

  function readPalette() {
    return {
      accent: tokenColor(['--accent', '--ink-3', '--ink']) || NEUTRAL,
      violet: tokenColor(['--violet', '--accent', '--ink-3']) || NEUTRAL,
      gold: tokenColor(['--gold', '--accent', '--ink-3']) || NEUTRAL,
      green: tokenColor(['--green', '--accent', '--ink-3']) || NEUTRAL,
      cyan: tokenColor(['--cyan', '--accent', '--ink-3']) || NEUTRAL,
      line: tokenColor(['--line', '--ink-3', '--ink']) || NEUTRAL,
      ink3: tokenColor(['--ink-3', '--ink', '--accent']) || NEUTRAL,
      ink: tokenColor(['--ink', '--ink-3', '--accent']) || NEUTRAL,
      bg: tokenColor(['--bg']) || WHITE,
    };
  }

  // 讲号 → 分支 token 名（与站点知识树一致的分支配色）
  function lectureToken(no) {
    if (no === 1) return 'accent';
    if (no === 2 || no === 3) return 'violet';
    if (no === 4) return 'gold';
    if (no >= 5 && no <= 8) return 'green';
    if (no === 9 || no === 10) return 'cyan';
    return 'ink3'; // 讲号缺失/越界时的中性色
  }

  /* ── 讲号 / HTML 工具 ── */

  // 从 lecture（数字或 'L3'/'3' 形态）或回退从 id 提取讲号数字
  function lectureNoOf(node) {
    const raw = node.lecture != null ? node.lecture : node.id;
    if (raw == null) return null;
    if (typeof raw === 'number' && isFinite(raw)) return raw;
    const m = /(\d+)/.exec(String(raw));
    return m ? Number(m[1]) : null;
  }

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  function webglOK() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }

  /* ═════════════════════ 渲染器实例 ═════════════════════ */

  class G3DRenderer {
    constructor(container, labelsEl, reducedMotion) {
      this._container = container;
      this._labelsEl = labelsEl;
      this._reduced = !!reducedMotion;
      this._destroyed = false;
      this._palette = readPalette();

      this._nodes = [];
      this._links = [];
      this._nodeById = new Map();
      this._layoutRadius = 340;
      this._nearDist = 460;   // sec 标签「相机距离近」阈值
      this._flyDist = 200;    // flyTo 停靠距离

      this._hoverId = null;
      this._selectedId = null;
      this._hasFocus = false;
      this._focusIds = new Set();
      this._visited = new Set();
      this._filters = { lectures: null, edges: { struct: true, spine: true, link: true } };

      this._selectCbs = [];
      this._hoverCbs = [];
      this._labelPool = [];
      this._rafId = 0;
      this._introTimer = 0;
      this._cameraReady = false;
      this._frameBound = this._frame.bind(this);

      // 工厂 opts 只在第一次调用生效（单页单渲染器场景，符合契约）
      this._graph = ForceGraph3D({ rendererConfig: { antialias: true, alpha: true } })(container);
      this._graph.backgroundColor('rgba(0,0,0,0)') // 透明，透出页面 var(--bg)
        .nodeOpacity(1)
        .nodeId('id')
        .linkSource('s')
        .linkTarget('t')
        .nodeVal((n) => (n.type === 'hub' ? 8 : 2 + (n.labs && n.labs.length ? 0.6 : 0)))
        .nodeColor((n) => this._nodeColor(n))
        .nodeLabel((n) => this._nodeTip(n))
        .nodeVisibility((n) => this._nodeVisible(n))
        .linkColor((l) => this._edgeColor(l))
        .linkWidth((l) => (l.type === 'link' ? 0.5 : 0)) // rel 边细管，其余 1px 细线
        .linkOpacity(1) // 逐边透明度编码在 rgba() 串内（见文件头说明）
        .linkVisibility((l) => this._edgeVisible(l))
        .linkDirectionalArrowLength((l) => (
          l.type === 'link' && (l.rel === 'pre' || l.rel === 'app') ? 3.5 : 0
        ))
        .linkDirectionalArrowColor((l) => this._edgeColor(l))
        .linkDirectionalParticles(this._reduced ? 0 : (l) => (l.type === 'link' ? 1.6 : 0))
        .linkDirectionalParticleColor((l) => this._edgeColor(l))
        .linkLabel((l) => (l.lzh ? escHtml(l.lzh) + ' / ' + escHtml(l.len) : ''))
        .enableNodeDrag(false)
        .warmupTicks(150)
        .cooldownTime(8000)
        .onNodeClick((n) => {
          this._selectedId = n.id;
          this._emit(this._selectCbs, n.id);
        })
        .onNodeHover((n) => {
          const id = n ? n.id : null;
          if (id !== this._hoverId) {
            this._hoverId = id;
            this._container.style.cursor = id ? 'pointer' : '';
            this._emit(this._hoverCbs, id);
          }
        })
        .onBackgroundClick(() => {
          if (this._selectedId !== null) {
            this._selectedId = null;
            this._emit(this._selectCbs, null);
          }
        });

      // 力模型：charge/link 距离按边型区分（struct 紧凑、spine 拉开讲间距离）
      const charge = this._graph.d3Force('charge');
      if (charge) charge.strength(-140);
      const linkForce = this._graph.d3Force('link');
      if (linkForce) {
        linkForce.distance((l) => (l.type === 'struct' ? 42 : l.type === 'spine' ? 130 : 80));
      }

      // reducedMotion：autoRotate 明确保持 false
      try {
        const ctr = this._graph.controls();
        if (ctr) ctr.autoRotate = false;
      } catch {
        /* controls 未就绪时忽略（默认本就为 false） */
      }

      this._rafId = requestAnimationFrame(this._frameBound);
    }

    /* ── 对外接口 ── */

    setGraph(data) {
      if (this._destroyed) return this;
      const src = data || {};
      // 拷贝数据：库会向节点/边对象注入 x/y/z/vx、source/target 等字段，
      // 不能污染页面的 GRAPH3D 原始数据
      const nodes = (src.nodes || []).map((n) => Object.assign({}, n));
      // 契约字段是 edges（GRAPH3D.edges）；links 形态仅为容错保留
      const links = (src.links || src.edges || []).map((l) => Object.assign({}, l));

      this._layout(nodes);
      this._nodes = nodes;
      this._links = links;
      this._nodeById = new Map(nodes.map((n) => [n.id, n]));

      this._layoutRadius = 320 + MEMBER_DR * Math.sqrt(Math.max(0, this._maxMembers - 1));
      this._nearDist = Math.max(420, this._layoutRadius * 1.3);
      this._flyDist = Math.max(170, this._layoutRadius * 0.45);

      this._graph.graphData({ nodes, links });
      this._rebuildLabelPool();
      this._initCamera();
      return this;
    }

    setFilters(f) {
      if (this._destroyed) return this;
      const src = f || {};
      const lec = 'lectures' in src ? src.lectures : this._filters.lectures;
      const edges = src.edges || this._filters.edges;
      this._filters = {
        lectures: lec && lec.size ? lec : null,
        edges: {
          struct: !edges || edges.struct !== false,
          spine: !edges || edges.spine !== false,
          link: !edges || edges.link !== false,
        },
      };
      const g = this._graph;
      g.nodeVisibility(g.nodeVisibility());
      g.linkVisibility(g.linkVisibility());
      return this;
    }

    setFocus(ids) {
      if (this._destroyed) return this;
      this._focusIds = ids && ids.length ? new Set(ids) : new Set();
      this._hasFocus = this._focusIds.size > 0;
      const g = this._graph;
      g.nodeColor(g.nodeColor());
      g.linkColor(g.linkColor());
      g.linkDirectionalArrowColor(g.linkDirectionalArrowColor());
      g.linkDirectionalParticleColor(g.linkDirectionalParticleColor());
      return this;
    }

    setMarks(marks) {
      if (this._destroyed) return this;
      const m = marks || {};
      this._visited = m.visited && m.visited.size ? new Set(m.visited) : new Set();
      this._updateLabelTexts();
      this._graph.nodeColor(this._graph.nodeColor());
      return this;
    }

    flyTo(id, opt) {
      if (this._destroyed) return this;
      const n = this._nodeById.get(id);
      if (!n || !isFinite(n.x)) return this;
      const ms = this._reduced ? 0 : (opt && typeof opt.ms === 'number' ? opt.ms : 800);
      const cam = this._graph.cameraPosition();
      const dx = cam.x - n.x;
      const dy = cam.y - n.y;
      const dz = cam.z - n.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1; // 保持当前观察方位，停靠到节点附近
      this._graph.cameraPosition(
        { x: n.x + (dx / len) * this._flyDist, y: n.y + (dy / len) * this._flyDist, z: n.z + (dz / len) * this._flyDist },
        { x: n.x, y: n.y, z: n.z },
        ms
      );
      return this;
    }

    onSelect(cb) {
      if (typeof cb === 'function') this._selectCbs.push(cb);
      return this;
    }

    onHover(cb) {
      if (typeof cb === 'function') this._hoverCbs.push(cb);
      return this;
    }

    refreshTheme() {
      if (this._destroyed) return this;
      this._palette = readPalette();
      const g = this._graph;
      g.nodeColor(g.nodeColor());
      g.linkColor(g.linkColor());
      g.nodeLabel(g.nodeLabel());
      g.linkDirectionalArrowColor(g.linkDirectionalArrowColor());
      g.linkDirectionalParticleColor(g.linkDirectionalParticleColor());
      return this;
    }

    resize() {
      if (this._destroyed) return this;
      const w = this._container.clientWidth;
      const h = this._container.clientHeight;
      if (w > 0 && h > 0) this._graph.width(w).height(h);
      return this;
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      if (this._introTimer) clearTimeout(this._introTimer);
      this._clearLabelPool();
      this._container.style.cursor = '';
      try {
        // v1.80 只暴露内部 _destructor（无公开 destructor 方法）
        if (typeof this._graph._destructor === 'function') this._graph._destructor();
      } catch {
        /* 卸载场景下清理失败静默 */
      }
    }

    /* ── 内部：确定性布局 / 相机 ── */

    _layout(nodes) {
      const hubAngle = new Map(); // 讲号 → 圆周角
      const hubPos = new Map();   // 讲号 → {x,z}
      this._maxMembers = 0;

      for (const n of nodes) {
        if (n.type !== 'hub') continue;
        const no = lectureNoOf(n) || 1;
        const ang = ((no - 1) / 10) * TAU + TAU / 20;
        hubAngle.set(no, ang);
        hubPos.set(no, { x: Math.cos(ang) * HUB_RING_R, z: Math.sin(ang) * HUB_RING_R });
        n.x = hubPos.get(no).x;
        n.y = 0;
        n.z = hubPos.get(no).z;
      }

      const memberCount = new Map(); // 讲号 → 已放置 member 数
      for (const n of nodes) {
        if (n.type === 'hub') continue;
        const no = lectureNoOf(n) || 1;
        const k = memberCount.get(no) || 0;
        memberCount.set(no, k + 1);
        const hub = hubPos.get(no);
        const ang = hubAngle.get(no) || 0;
        const r = MEMBER_R0 + MEMBER_DR * Math.sqrt(k);
        const th = k * GOLDEN + ang;
        n.x = (hub ? hub.x : 0) + Math.cos(th) * r;
        n.z = (hub ? hub.z : 0) + Math.sin(th) * r;
        n.y = 18 * Math.sin(k * 1.7 + no);
      }
      for (const c of memberCount.values()) {
        if (c > this._maxMembers) this._maxMembers = c;
      }
    }

    _initCamera() {
      if (this._cameraReady) return;
      this._cameraReady = true;
      const cd = Math.max(560, this._layoutRadius * 1.9);
      const fin = { x: 0, y: cd * 0.32, z: cd };
      const origin = { x: 0, y: 0, z: 0 };
      if (this._reduced) {
        this._graph.cameraPosition(fin, origin, 0); // 首帧即 warmup 完成态，无入场动画
      } else {
        this._graph.cameraPosition({ x: fin.x + cd * 0.22, y: fin.y + cd * 0.55, z: fin.z + cd * 0.66 }, origin, 0);
        this._introTimer = setTimeout(() => {
          if (!this._destroyed) this._graph.cameraPosition(fin, origin, 900);
        }, 80);
      }
    }

    /* ── 内部：颜色 / 可见性 ── */

    _nodeColor(n) {
      const pal = this._palette;
      let c = pal[lectureToken(lectureNoOf(n))];
      if (this._visited.has(n.id)) c = mix(c, WHITE, 0.14); // 已读：轻微提亮
      if (this._hasFocus && !this._focusIds.has(n.id)) c = mix(c, pal.bg, 0.85); // 非焦点压暗
      return rgbStr(c);
    }

    _edgeColor(l) {
      const pal = this._palette;
      let c;
      let a;
      if (l.type === 'link') {
        const byRel = { pre: pal.gold, app: pal.cyan, kin: pal.violet, ext: pal.green };
        c = byRel[l.rel] || pal.accent;
        a = 0.5;
      } else if (l.type === 'spine') {
        c = pal.ink3;
        a = 0.3;
      } else {
        c = pal.line;
        a = 0.18; // struct 低透明度
      }
      if (this._hasFocus && !this._focusIds.has(l.s) && !this._focusIds.has(l.t)) {
        c = mix(c, pal.bg, 0.92); // 非关联边近乎隐藏
        a *= 0.12;
      }
      return rgbaStr(c, a);
    }

    _nodeVisible(n) {
      const lec = this._filters.lectures;
      if (!lec) return true;
      const no = lectureNoOf(n);
      if (no === null) return true;
      return lec.has(no) || lec.has('L' + no); // Set 元素兼容数字与 'L1' 形态
    }

    _edgeVisible(l) {
      const e = this._filters.edges;
      if (l.type === 'struct') { if (!e.struct) return false; } else if (l.type === 'spine') { if (!e.spine) return false; } else if (l.type === 'link') { if (!e.link) return false; }
      const sn = this._nodeById.get(l.s);
      const tn = this._nodeById.get(l.t);
      if (sn && !this._nodeVisible(sn)) return false;
      if (tn && !this._nodeVisible(tn)) return false;
      return true;
    }

    _nodeTip(n) {
      const pal = this._palette;
      const bgc = rgbaStr(mix(pal.bg, pal.ink, 0.86), 0.94);
      const fgc = rgbStr(mix(pal.ink, pal.bg, 0.05));
      let html = '<div style="max-width:260px;padding:6px 10px;border-radius:6px;'
        + 'background:' + bgc + ';color:' + fgc + ';font:12px/1.55 sans-serif;'
        + 'box-shadow:0 4px 14px rgba(0,0,0,0.25)">'
        + '<b style="font-size:13px">' + escHtml(n.zh || n.id) + '</b>';
      if (n.en) html += ' <span style="opacity:0.72">' + escHtml(n.en) + '</span>';
      if (n.type === 'sec' && n.sum) html += '<div style="opacity:0.85;margin-top:3px">' + escHtml(n.sum) + '</div>';
      return html + '</div>';
    }

    /* ── 内部：标签层（HTML overlay，DOM 池化） ── */

    _rebuildLabelPool() {
      this._clearLabelPool();
      const list = this._nodes.slice(0, LABEL_CAP);
      for (const n of list) {
        const el = document.createElement('div');
        el.className = n.type === 'hub' ? 'g3d-lb hub' : 'g3d-lb';
        el.style.display = 'none';
        el.style.transform = 'translate(-50%, -50%)'; // 居中锚定；定位写 left/top（契约 DOM 形态）
        const zh = document.createElement('span');
        zh.className = 'zh';
        const en = document.createElement('span');
        en.className = 'en';
        en.textContent = n.en || '';
        el.appendChild(zh);
        el.appendChild(en);
        this._labelsEl.appendChild(el);
        this._labelPool.push({ node: n, el, zh, shown: false, sx: 0, sy: 0 });
      }
      this._updateLabelTexts();
    }

    _updateLabelTexts() {
      for (const e of this._labelPool) {
        const n = e.node;
        const prefix = this._visited.has(n.id) ? '✓ ' : '';
        e.zh.textContent = prefix + (n.zh || n.id);
      }
    }

    _clearLabelPool() {
      for (const e of this._labelPool) {
        if (e.el.parentNode) e.el.parentNode.removeChild(e.el);
      }
      this._labelPool = [];
    }

    // 常驻 rAF：节点坐标 → 屏幕坐标 → 标签定位（98 节点量级无压力；
    // 引擎冷却后仍需响应相机操作，故不做休眠）
    _frame() {
      if (this._destroyed) return;
      this._rafId = requestAnimationFrame(this._frameBound);
      const g = this._graph;
      const w = this._container.clientWidth;
      const h = this._container.clientHeight;
      if (!(w > 0 && h > 0)) return;
      const cam = g.cameraPosition();

      // 视线方向 camera→controls.target：graph2ScreenCoords 不标记背面，
      // 用视向点积自行判定（背面节点投影会翻转，必须隐藏）
      let tx = 0;
      let ty = 0;
      let tz = 0;
      let ctr;
      try {
        ctr = g.controls();
      } catch {
        /* controls 未就绪时按无 target 处理 */
      }
      if (ctr && ctr.target) {
        tx = ctr.target.x;
        ty = ctr.target.y;
        tz = ctr.target.z;
      }
      let vx = tx - cam.x;
      let vy = ty - cam.y;
      let vz = tz - cam.z;
      const vl = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (vl < 1e-6) {
        vx = 0; vy = 0; vz = -1;
      } else {
        vx /= vl; vy /= vl; vz /= vl;
      }

      for (const e of this._labelPool) {
        const n = e.node;
        let show = false;
        let sx = 0;
        let sy = 0;
        if (isFinite(n.x) && isFinite(n.y) && isFinite(n.z)) {
          const behind = (n.x - cam.x) * vx + (n.y - cam.y) * vy + (n.z - cam.z) * vz <= 0;
          if (!behind) {
            const sc = g.graph2ScreenCoords(n.x, n.y, n.z);
            if (sc && isFinite(sc.x) && isFinite(sc.y)
              && sc.x >= -60 && sc.x <= w + 60 && sc.y >= -40 && sc.y <= h + 40
              && this._nodeVisible(n)) {
              if (n.type === 'hub') {
                show = true; // hub 标签常显
              } else {
                const ddx = n.x - cam.x;
                const ddy = n.y - cam.y;
                const ddz = n.z - cam.z;
                const near = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz) < this._nearDist;
                show = near
                  || n.id === this._hoverId
                  || n.id === this._selectedId
                  || this._focusIds.has(n.id);
              }
            }
            if (show) { sx = sc.x; sy = sc.y; }
          }
        }
        if (show !== e.shown) {
          e.shown = show;
          e.el.style.display = show ? '' : 'none';
        }
        if (show && (Math.abs(sx - e.sx) > 0.5 || Math.abs(sy - e.sy) > 0.5)) {
          e.sx = sx;
          e.sy = sy;
          e.el.style.left = sx + 'px';
          e.el.style.top = sy + 'px';
        }
      }
    }

    _emit(cbs, v) {
      for (const cb of cbs) {
        try {
          cb(v);
        } catch {
          /* 页面回调异常不冒泡，避免打断渲染循环 */
        }
      }
    }
  }

  /* ── 工厂：库缺失 / WebGL 不可用时返回 null，绝不抛未捕获异常 ── */

  function create(containerEl, labelsEl, opts) {
    const o = opts || {};
    if (typeof ForceGraph3D !== 'function') return null;
    if (!containerEl || !labelsEl) return null;
    if (!webglOK()) return null;
    try {
      return new G3DRenderer(containerEl, labelsEl, !!o.reducedMotion);
    } catch {
      return null; // 初始化半途失败同样静默降级为 null
    }
  }

  window.G3DRender = { create };
})();
