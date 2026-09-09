/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · 核心组件库（工具集 + GridBoard + 全讲共用组件）
   GridBoard 是唯一的网格渲染引擎，所有实验台都建立在它之上；
   各讲专属组件在 components-l1.js…components-l10.js。
   ═══════════════════════════════════════════════════════════ */
(function () {
  const { createApp } = Vue;
  const D = window.DATA;

  /* ---------- 几何与规则助手 ---------- */
  const CELL = 100, PAD = 14;
  const s2rc = (s, n) => ({ r: Math.floor((s - 1) / n), c: (s - 1) % n });
  const rc2s = (r, c, n) => r * n + c + 1;
  const center = (s, n) => {
    const { r, c } = s2rc(s, n);
    return { x: PAD + c * CELL + CELL / 2, y: PAD + r * CELL + CELL / 2 };
  };
  const stName = (s) => 's' + s;

  // 可种子化随机（mulberry32）：训练类实验台 Reset 时以同一 seed 重建，
  // 保证「Reset 再训练」轨迹逐点可复现
  const rng = (seed) => {
    let a = (seed === undefined ? 42 : seed) >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 执行一步：优先查书中 3×3 权威表；否则按规则生成
  // mode: 'book' 禁区可进入(书) | 'code' 禁区弹回(老师代码/作业)
  // rForbidden: 进禁区/撞禁区的奖励（各讲实验台可调，如 −10；缺省 −1 与书一致）
  function stepOnce(state, aid, cfg) {
    const { size, forbidden = [], target } = cfg;
    const rForbidden = cfg.rForbidden === undefined ? -1 : cfg.rForbidden;
    if (size === 3 && cfg.mode === 'book') {
      const next = D.T3[state - 1][aid - 1];
      const sym = D.R3SYM[state - 1][aid - 1];
      const reward = sym === 'b' ? -1 : sym === 'f' ? rForbidden : sym === 't' ? 1 : 0;
      const type = sym === 't' ? 'target' : sym === 'f' ? 'forbidden'
        : sym === 'b' ? 'bounce' : (next === state ? 'stay' : 'move');
      return { next, reward, type, sym };
    }
    const a = D.actions[aid - 1];
    const { r, c } = s2rc(state, size);
    const nr = r + a.dy, nc = c + a.dx;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
      return { next: state, reward: -1, type: 'bounce', sym: 'b' };
    }
    const next = rc2s(nr, nc, size);
    if (next === target) return { next, reward: 1, type: 'target', sym: 't' };
    if (forbidden.includes(next)) {
      if (cfg.mode === 'code') return { next: state, reward: rForbidden, type: 'bounce-forbidden', sym: 'f' };
      return { next, reward: rForbidden, type: 'forbidden', sym: 'f' };
    }
    return { next, reward: 0, type: next === state ? 'stay' : 'move', sym: 0 };
  }

  const bi = (zh, en) =>
    `<span class="zh du-line">${zh}</span><span class="en du-line">${en}</span>`;

  const TYPE_LABEL = {
    move:  { zh: '普通移动', en: 'normal move',  cls: '' },
    stay:  { zh: '原地不动', en: 'stay still',   cls: '' },
    bounce:{ zh: '撞边界弹回', en: 'bounced by boundary', cls: 'warn' },
    'bounce-forbidden': { zh: '禁区弹回（不可进入）', en: 'bounced by forbidden cell', cls: 'danger' },
    forbidden: { zh: '进入禁区（可进入，挨罚）', en: 'entered forbidden cell (accessible, penalised)', cls: 'danger' },
    target:{ zh: '到达目标！', en: 'target reached!', cls: 'done' },
  };

  const STAR = '0,-27 6.76,-9.3 25.68,-8.34 10.94,3.55 15.87,21.84 0,11.5 -15.87,21.84 -10.94,3.55 -25.68,-8.34 -6.76,-9.3';

  /* ═════════════ GridBoard 核心渲染 ═════════════ */
  const GridBoard = {
    name: 'GridBoard',
    props: {
      size:        { type: Number, default: 3 },
      forbidden:   { type: Array, default: () => [] },   // 1-based
      target:      { type: Number, default: 9 },
      start:       { type: Number, default: null },
      agent:       { type: Number, default: null },
      trajStates:  { type: Array, default: () => [] },   // 1-based states
      progress:    { type: Number, default: 1 },          // 0..1
      policy:      { type: Array, default: null },        // n×5 书本动作序
      values:      { type: Array, default: null },
      labels:      { type: Boolean, default: true },
      selected:    { type: Number, default: null },
      clickable:   { type: Boolean, default: false },
      rewardPops:  { type: Array, default: () => [] },    // {id, state, text, kind}
      flashState:  { type: Number, default: null },
      flashKey:    { type: Number, default: 0 },
      probe:       { type: Object, default: null },       // {state, action, key}
      heat:        { type: Array, default: null },        // 每格访问热度 0..1
    },
    emits: ['cell'],
    computed: {
      W() { return this.size * CELL + PAD * 2; },
      allStates() { return Array.from({ length: this.size * this.size }, (_, i) => i + 1); },
      gridLines() {
        const L = [];
        for (let i = 1; i < this.size; i++) {
          L.push({ x1: PAD + i * CELL, y1: PAD, x2: PAD + i * CELL, y2: this.W - PAD });
          L.push({ x1: PAD, y1: PAD + i * CELL, x2: this.W - PAD, y2: PAD + i * CELL });
        }
        return L;
      },
      arrows() {
        if (!this.policy) return [];
        const out = [];
        this.policy.forEach((row, si) => {
          const st = si + 1;
          const { x, y } = center(st, this.size);
          row.forEach((p, ai) => {
            if (p < 0.005) return;
            if (ai === 4) {
              out.push({ st, type: 'circle', x, y, p });
              return;
            }
            const a = D.actions[ai];
            const len = 14 + p * 38;
            const x1 = x + a.dx * 8, y1 = y + a.dy * 8;
            const x2 = x + a.dx * (8 + len), y2 = y + a.dy * (8 + len);
            // 箭头头部（垂直方向）
            const hx = -a.dy, hy = a.dx, hw = 4.6, hl = 11;
            const tip = { x: x2 + a.dx * hl * 0.6, y: y2 + a.dy * hl * 0.6 };
            const b1 = { x: x2 + hx * hw, y: y2 + hy * hw };
            const b2 = { x: x2 - hx * hw, y: y2 - hy * hw };
            out.push({ st, type: 'arrow', x1, y1, x2, y2, tip, b1, b2, p, key: `${st}-${ai}` });
          });
        });
        return out;
      },
      trajPts() {
        return this.trajStates.map((s) => {
          const { x, y } = center(s, this.size);
          return `${x},${y}`;
        });
      },
      trajLen() {
        let L = 0;
        for (let i = 1; i < this.trajStates.length; i++) {
          const a = center(this.trajStates[i - 1], this.size);
          const b = center(this.trajStates[i], this.size);
          L += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        }
        return L;
      },
      trajStyle() {
        const L = this.trajLen || 1;
        return {
          strokeDasharray: `${L}`,
          strokeDashoffset: `${L * (1 - this.progress)}`,
          transition: 'stroke-dashoffset .5s cubic-bezier(.2,0,0,1)',
        };
      },
      agentStyle() {
        if (this.agent == null) return { display: 'none' };
        const { x, y } = center(this.agent, this.size);
        return { transform: `translate(${x}px, ${y}px)` };
      },
      valueTexts() {
        if (!this.values) return [];
        return this.values.map((v, i) => ({ st: i + 1, ...center(i + 1, this.size), v }));
      },
    },
    methods: {
      cellFill(st) {
        if (st === this.target) return 'var(--cyan)';
        if (this.forbidden.includes(st)) return 'var(--gold)';
        return 'var(--cell-alt)';
      },
      clickCell(st) { if (this.clickable) this.$emit('cell', st); },
      // 可编辑格子的读屏标签：坐标 + 当前类型（随语言切换）
      cellLabel(st) {
        const { r, c } = s2rc(st, this.size);
        const en = this.$root && this.$root.lang === 'en';
        const kind = st === this.target ? (en ? 'target' : '目标')
          : this.forbidden.includes(st) ? (en ? 'forbidden cell' : '禁区')
          : (en ? 'normal cell' : '普通格');
        const pos = en ? 'row ' + (r + 1) + ', column ' + (c + 1) : '第 ' + (r + 1) + ' 行第 ' + (c + 1) + ' 列';
        const hint = en ? 'press Enter to select' : '按 Enter 选择';
        return 's' + st + ' · ' + pos + ' · ' + kind + ' · ' + hint;
      },
    },
    template: `
    <svg :viewBox="'0 0 ' + W + ' ' + W" class="grid-board" :class="{clickable}">
      <rect v-for="st in allStates" :key="'f'+st"
            :x="PAD + s2rc(st,size).c*CELL" :y="PAD + s2rc(st,size).r*CELL"
            :width="CELL" :height="CELL" :fill="cellFill(st)"/>
      <line v-for="(l,i) in gridLines" :key="'g'+i" class="gline"
            :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"/>
      <rect class="gframe" :x="PAD" :y="PAD" :width="W-2*PAD" :height="W-2*PAD" fill="none" rx="3"/>
      <rect v-if="start" :x="PAD + s2rc(start,size).c*CELL + 3" :y="PAD + s2rc(start,size).r*CELL + 3"
            :width="CELL-6" :height="CELL-6" fill="none" stroke="var(--accent)" stroke-width="2.4"
            stroke-dasharray="7 5" rx="6"/>

      <template v-if="labels">
        <text v-for="st in allStates" :key="'lb'+st" class="st-label"
            :class="{small: size===4}"
            :x="PAD + s2rc(st,size).c*CELL + 9" :y="PAD + s2rc(st,size).r*CELL + 24">{{'s'+st}}</text>
      </template>

      <text v-if="start" :x="PAD + s2rc(start,size).c*CELL + CELL/2" :y="PAD + s2rc(start,size).r*CELL + CELL - 12"
            class="cell-tag" fill="var(--accent)" font-size="13">
        <tspan v-if="$root.lang === 'en'">Start</tspan><tspan v-else>起点</tspan>
      </text>

      <!-- 策略箭头 -->
      <g v-for="ar in arrows" :key="ar.key || ('c'+ar.st)" class="probe-arrow">
        <title>{{'s'+ar.st+' · p='+ar.p}}</title>
        <line v-if="ar.type==='arrow'" :x1="ar.x1" :y1="ar.y1" :x2="ar.x2" :y2="ar.y2"
              stroke="var(--green)" :stroke-width="2 + ar.p*2.2" stroke-linecap="round" opacity=".92"/>
        <polygon v-if="ar.type==='arrow'" :points="ar.tip.x+','+ar.tip.y+' '+ar.b1.x+','+ar.b1.y+' '+ar.b2.x+','+ar.b2.y"
                 fill="var(--green)" opacity=".92"/>
        <circle v-if="ar.type==='circle'" :cx="ar.x" :cy="ar.y" r="8.5"
                fill="none" stroke="var(--green)" stroke-width="3" opacity=".9"/>
      </g>

      <!-- 访问热度层 -->
      <template v-if="heat">
        <rect v-for="(h,i) in heat" :key="'h'+i" v-show="h > 0.01"
              :x="PAD + s2rc(i+1,size).c*CELL" :y="PAD + s2rc(i+1,size).r*CELL"
              :width="CELL" :height="CELL" fill="var(--red)" :opacity="h*0.5"/>
      </template>

      <!-- 轨迹 -->
      <polyline v-if="trajPts.length>1" class="traj-line" :points="trajPts.join(' ')" :style="trajStyle" opacity=".8"/>

      <!-- 探针箭头（单步演示） -->
      <g v-if="probe" :key="probe.key" class="probe-arrow">
        <template v-for="(act,ai) in (probe.action ? [probe.action] : [])">
          <line :x1="center(probe.state,size).x + (act.dx||0)*0"
                :y1="center(probe.state,size).y"
                :x2="center(probe.state,size).x + act.dx*46"
                :y2="center(probe.state,size).y + act.dy*46"
                stroke="var(--violet)" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 6"/>
        </template>
      </g>

      <!-- 奖励浮字 -->
      <g v-for="pop in rewardPops" :key="pop.id" class="rw-float">
        <circle :cx="center(pop.state,size).x" :cy="center(pop.state,size).y - 4" r="21"
                :fill="pop.kind==='pos' ? 'var(--green)' : pop.kind==='neg' ? 'var(--red)' : 'var(--ink-3)'" opacity=".92"/>
        <text :x="center(pop.state,size).x" :y="center(pop.state,size).y + 1" text-anchor="middle"
              fill="var(--on-accent)" font-weight="800" font-size="16" font-family="var(--mono)">{{pop.text}}</text>
      </g>

      <!-- 撞击闪烁 -->
      <rect v-if="flashState!=null" :key="'fl'+flashKey" class="bounce-flash"
            :x="PAD + s2rc(flashState,size).c*CELL" :y="PAD + s2rc(flashState,size).r*CELL"
            :width="CELL" :height="CELL" fill="var(--red)" opacity=".28"/>

      <!-- 价值数字 -->
      <text v-for="vt in valueTexts" :key="'v'+vt.st" :x="vt.x" :y="vt.y+5"
            text-anchor="middle" font-weight="700" font-size="15" font-family="var(--mono)"
            fill="var(--ink)" style="paint-order:stroke; stroke:var(--cell-alt); stroke-width:4px;">{{vt.v}}</text>

      <!-- 智能体 -->
      <g class="agent-g" :style="agentStyle">
        <polygon class="agent-star agent-pulse" :points="STAR" fill="var(--accent)" stroke="var(--cell-alt)" stroke-width="2"/>
      </g>

      <!-- 点击热区（最上层；可编辑时键盘可达） -->
      <rect v-for="st in allStates" :key="'h'+st" class="cell-hit" :class="{'sel-halo': st===selected}"
            :x="PAD + s2rc(st,size).c*CELL" :y="PAD + s2rc(st,size).r*CELL"
            :width="CELL" :height="CELL" fill="transparent" @click="clickCell(st)"
            :tabindex="clickable ? 0 : -1" :role="clickable ? 'button' : null"
            :aria-label="clickable ? cellLabel(st) : null"
            @keydown.enter.prevent="clickCell(st)" @keydown.space.prevent="clickCell(st)"/>
    </svg>`,
    setup(props) { return { CELL, PAD, s2rc, center, STAR }; },
  };

  /* ═════════════ §1.8 概念链 ═════════════ */
  const ConceptChain = {
    name: 'ConceptChain',
    data: () => ({ hot: -1, lock: false, open: null, timer: null }),
    concepts: [
      { k: 'grid', zh: '网格世界', en: 'grid world', d: { zh: '舞台：智能体、格子、禁区、目标。', en: 'The stage: agent, cells, forbidden areas, target.' } },
      { k: 'sa', zh: '状态 · 动作', en: 'state · action', d: { zh: '“我在哪”“我能做什么”——全部编号。', en: '“Where am I”“what can I do” — everything indexed.' } },
      { k: 'trans', zh: '状态转移', en: 'transition', d: { zh: '世界的回应规则，可用条件概率 p(s′|s,a) 描述。', en: 'How the world responds, described by p(s′|s,a).' } },
      { k: 'pol', zh: '策略 π(a|s)', en: 'policy π(a|s)', d: { zh: '每个状态的行为准则，可确定性可随机。', en: 'Conduct at every state — deterministic or stochastic.' } },
      { k: 'rew', zh: '奖励 r(s,a)', en: 'reward r(s,a)', d: { zh: '环境的即时反馈，塑造行为的缰绳。', en: 'The environment\'s instant feedback shaping behaviour.' } },
      { k: 'traj', zh: '轨迹', en: 'trajectory', d: { zh: '沿策略走出的“状态-动作-奖励”链。', en: 'The state-action-reward chain a policy traces.' } },
      { k: 'ret', zh: '回报', en: 'return', d: { zh: '轨迹上奖励的总和——评价策略的尺子。', en: 'Total reward along a trajectory — the ruler of policies.' } },
      { k: 'gam', zh: '折扣率 γ', en: 'discount rate γ', d: { zh: '未来在今天的汇率：救发散 + 调远近。', en: 'Today\'s exchange rate for the future: tames divergence, balances horizons.' } },
      { k: 'ep', zh: '回合 episode', en: 'episode', d: { zh: '一段完整经历；episodic 与 continuing 可统一。', en: 'One complete experience; episodic unifies with continuing.' } },
      { k: 'mdp', zh: 'MDP · 马尔可夫性', en: 'MDP · Markov property', d: { zh: '全部概念的数学框架，地基是无记忆性。', en: 'The mathematical frame for everything, founded on memorylessness.' } },
    ],
    mounted() {
      this.timer = setInterval(() => {
        if (this.lock) return;
        this.hot = (this.hot + 1) % this.$options.concepts.length;
      }, 1100);
    },
    unmounted() { if (this.timer) clearInterval(this.timer); },
    setup() { return { bi }; },
    methods: {
      enter(i) { this.lock = true; this.hot = i; },
      leave() { this.lock = false; },
      toggle(i) { this.open = this.open === i ? null : i; },
    },
    template: `
    <div class="lab">
      <div class="lab-head"><span class="lab-title">概念依赖链 · 悬停查看 · 点击固定 / Concept chain — hover, click to pin</span></div>
      <div class="chain" style="row-gap:12px">
        <template v-for="(c,i) in $options.concepts" :key="c.k">
          <span v-if="i>0" class="chain-arrow" style="font-size:15px">→</span>
          <button class="chain-node" style="cursor:pointer; min-width:74px"
                  :class="{now: hot===i, past: open===i}" @mouseenter="enter(i)" @mouseleave="leave" @click="toggle(i)">
            <span class="cn-s" style="font-size:12.5px;font-family:var(--font)">{{c.zh}}</span>
            <span class="cn-r" style="font-size:10px">{{c.en}}</span>
          </button>
        </template>
      </div>
      <div v-if="open!=null" class="callout idea" :key="open" style="margin:14px 0 0">
        <div class="callout-icon">🔗</div>
        <div class="callout-body">
          <p class="bi duo" style="font-weight:700">{{ $options.concepts[open].zh }} · {{ $options.concepts[open].en }}</p>
          <p class="bi duo" style="font-size:14px" v-html="bi($options.concepts[open].d.zh, $options.concepts[open].d.en)"></p>
        </div>
      </div>
    </div>`,
  };

  /* ═════════════ 代码精讲 ═════════════ */
  function hlPy(line) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let out = '';
    let rest = line;
    const ci = rest.indexOf('#');
    let comment = null;
    if (ci >= 0) {
      const before = rest.slice(0, ci);
      const q = (before.match(/'/g) || []).length + (before.match(/"/g) || []).length;
      if (q % 2 === 0) { comment = rest.slice(ci); rest = before; }
    }
    const KW = /^(import|from|class|def|return|if|elif|else|for|in|while|assert|not|and|or|None|True|False|lambda|with|try|except|raise|as|pass|break|continue|global|is)$/;
    const BI = /^(print|range|len|enumerate|isinstance|tuple|list|dict|set|zip|input|float|int|str|np|plt|patches|random|argparse|type|sum|Exception)$/;
    const re = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|([A-Za-z_][A-Za-z_0-9]*)|(\d+\.?\d*)|(\s+)|(.)/g;
    let m;
    while ((m = re.exec(rest)) !== null) {
      if (m[1]) out += `<span class="tok-str">${esc(m[1])}</span>`;
      else if (m[2]) {
        const w = m[2];
        if (KW.test(w)) out += `<span class="tok-kw">${w}</span>`;
        else if (w === 'self') out += `<span class="tok-self">${w}</span>`;
        else if (BI.test(w)) out += `<span class="tok-bi">${w}</span>`;
        else if (rest[m.index + w.length] === '(' && ['def','class'].includes(out.match(/tok-kw">(\w+)<\/span>(?!.*tok-kw)/)?.[1] || '')) out += `<span class="tok-def">${w}</span>`;
        else out += esc(w);
      }
      else if (m[3]) out += `<span class="tok-num">${m[3]}</span>`;
      else if (m[4]) out += m[4];
      else out += esc(m[5]);
    }
    if (comment) out += `<span class="tok-com">${esc(comment)}</span>`;
    return out || '&nbsp;';
  }

  const CodeLab = {
    name: 'CodeLab',
    props: { source: { type: String, default: 'l1' } },
    data: () => ({ tab: null, lit: null, coordSel: 8 }),
    computed: {
      files() {
        return (D.codeFileSets && D.codeFileSets[this.source]) || D.codeFiles;
      },
      file() { return this.files.find(f => f.id === this.tab); },
      lines() { return this.file.code.split('\n').map(hlPy); },
      litLines() {
        if (!this.lit) return new Set();
        const s = new Set();
        for (let i = this.lit[0]; i <= this.lit[1]; i++) s.add(i);
        return s;
      },
      coordInfo() {
        const s = this.coordSel, n = 4;
        const { r, c } = s2rc(s, n);
        return { r: r + 1, c: c + 1, x: c, y: r };
      },
      trace() { return D.traceBranches; },
    },
    watch: {
      source: { immediate: true, handler() { this.tab = this.files[0].id; this.lit = null; } },
    },
    methods: {
      noteLines(n) { return 'L' + (n.lines[0] === n.lines[1] ? n.lines[0] : n.lines[0] + '–' + n.lines[1]); },
      clickNote(n) { this.lit = this.lit && this.lit[0] === n.lines[0] && this.lit[1] === n.lines[1] ? null : n.lines; },
    },
    template: `
    <div>
      <div class="code-tabs">
        <button v-for="f in files" :key="f.id" class="code-tab" :class="{active: tab===f.id}"
                @click="tab=f.id; lit=null">{{ f.tab }}</button>
      </div>
      <div class="code-panel">
        <div class="code-file-bar">
          <span class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span>
          {{ file.file }}
        </div>
        <div class="code-scroll">
          <pre class="codeblock"><code><span v-for="(l,i) in lines" :key="file.id+i" class="cl" :class="{hl: litLines.has(i+1)}"
              v-html="l"></span></code></pre>
        </div>
        <div class="code-notes">
          <p class="bi duo" style="font-size:13.5px; color:#aebdd0; margin:0 0 2px" v-html="file.intro"></p>
          <div v-for="(n,ni) in file.notes" :key="ni" class="code-note" :class="{lit: lit && lit[0]===n.lines[0] && lit[1]===n.lines[1]}"
               @click="clickNote(n)">
            <span class="cn-badge">{{ noteLines(n) }}</span>
            <span class="cn-body">
              <span class="zh" v-html="n.zh"></span>
              <span class="en" v-html="n.en"></span>
            </span>
          </div>
        </div>
      </div>

      <h3 class="sub"><span v-html="bi('坐标映射器：书编号 ↔ 代码坐标','Coordinate mapper: book index ↔ code coords')"></span></h3>
      <div class="lab">
        <div class="lab-body" style="align-items:center">
          <div class="lab-stage" style="max-width:280px">
            <grid-board size="4" :forbidden="[8,10]" :target="12" :start="1" :selected="coordSel" clickable @cell="coordSel=$event" :labels="true"/>
          </div>
          <div class="lab-side">
            <div class="ctl-row">
              <select class="sel" v-model.number="coordSel">
                <option v-for="s in 16" :key="s" :value="s">{{'s'+s}}</option>
              </select>
            </div>
            <div class="coord-math">
              <div class="cm-row"><span class="coord-badge">s{{coordSel}}</span> → (r, c) = ({{coordInfo.r}}, {{coordInfo.c}}) <span style="color:var(--ink-3)">// {{bi('第 r 行第 c 列（从 1 数）','1-based row, col')}}</span></div>
              <div class="cm-row"><span class="coord-badge">s{{coordSel}}</span> → <span class="cm-out">(x, y) = ({{coordInfo.x}}, {{coordInfo.y}})</span> <span style="color:var(--ink-3)">// 0-based, x→右 right, y→下 down</span></div>
              <div class="cm-row" style="font-family:var(--mono); font-size:13px">x = (i−1) % 4 &nbsp;·&nbsp; y = (i−1) // 4 &nbsp;·&nbsp; i = y·4 + x + 1</div>
            </div>
            <p class="bi duo" style="font-size:13px;color:var(--ink-3);margin:10px 0 0" v-html="bi(
              's8 → (3,1)、s10 → (1,2)、s12 → (3,2)。老师代码画图时 invert_yaxis() 把 y 轴翻转，画出来才和书一致。',
              's8 → (3,1), s10 → (1,2), s12 → (3,2). The teacher’s code calls invert_yaxis() so the plot matches the book.')"></p>
          </div>
        </div>
      </div>

      <h3 class="sub"><span v-html="bi('核心函数逐分支精读：_get_next_state_and_reward','Branch-by-branch: _get_next_state_and_reward')"></span></h3>
      <div class="data-table-wrap">
        <table class="data-table trace-table">
          <thead><tr>
            <th>#</th><th v-html="bi('命中条件（按顺序短路）','matched condition (short-circuit order)')"></th>
            <th v-html="bi('动作结果','resulting motion')"></th><th>reward</th><th v-html="bi('书上的情形','book case')"></th>
          </tr></thead>
          <tbody>
            <tr v-for="(b,i) in trace" :key="i">
              <td class="row-head">{{i+1}}</td>
              <td style="text-align:left; font-size:12px">{{ b.cond }}</td>
              <td style="font-size:12px"><span v-html="bi(b.res.zh, b.res.en)"></span></td>
              <td :class="b.rw==='reward_target' ? 'sym-t' : 'sym-f'">{{ b.rw }}</td>
              <td style="font-size:12px">{{ b.case }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="bi duo" style="font-size:13px;color:var(--ink-3);margin-top:6px" v-html="bi(
        'if/elif 是短路求值：一个动作只会命中第一个满足的分支——分支顺序即优先级：边界 &gt; 目标 &gt; 禁区 &gt; 普通。',
        'if/elif short-circuits: an action hits only the first matching branch — order is priority: boundary &gt; target &gt; forbidden &gt; normal.')"></p>

      <h3 class="sub"><span v-html="bi('动作顺序对照：书 vs 代码','Action order: book vs code')"></span></h3>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th></th><th>col 1</th><th>col 2</th><th>col 3</th><th>col 4</th><th>col 5</th></tr></thead>
          <tbody>
            <tr>
              <td class="row-head">书 Book</td>
              <td>a1 up 上</td><td>a2 right 右</td><td>a3 down 下</td><td>a4 left 左</td><td>a5 still 原</td>
            </tr>
            <tr>
              <td class="row-head">代码 Code</td>
              <td>(0,1) down 下</td><td>(1,0) right 右</td><td>(0,−1) up 上</td><td>(−1,0) left 左</td><td>(0,0) stay 原</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="bi duo" style="font-size:13px;color:var(--ink-3)" v-html="bi(
        '两套排列指向同一组动作，但<strong>列含义不同</strong>：策略矩阵的第 1 列在书里是“上”、在代码里是“下”。写作业矩阵时一律以代码为准。',
        'Both orderings describe the same five actions, but <strong>column meanings differ</strong>: column 1 is “up” in the book and “down” in the code. For assignment matrices, always follow the code.')"></p>
    </div>`,
    components: { GridBoard },
    setup() { return { D, bi }; },
  };

  /* ═════════════ 长推理链 ═════════════ */
  const ReasoningLab = {
    name: 'ReasoningLab',
    props: { source: { type: String, default: 'l1' } },
    data: () => ({ shown: 1, essay: false }),
    computed: {
      steps() {
        return (D.reasoningSets && D.reasoningSets[this.source]) || D.reasoning;
      },
    },
    watch: { source() { this.shown = 1; this.essay = false; } },
    setup() { return { bi }; },
    methods: {
      next() {
        if (this.shown < this.steps.length) {
          this.shown++;
          this.$nextTick(() => {
            const el = this.$refs['step' + (this.shown - 1)];
            if (el && el[0]) el[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        }
      },
      all() { this.essay = true; this.shown = this.steps.length; },
      stepMode() { this.essay = false; },
      restart() { this.shown = 1; this.essay = false; this.$nextTick(() => this.$refs.top && this.$refs.top.scrollIntoView({ behavior: 'smooth', block: 'center' })); },
    },
    template: `
    <div class="lab">
      <div class="reason-ctl" ref="top">
        <button class="btn primary" @click="next" :disabled="shown>=steps.length || essay">⏭ <span v-html="bi('下一步推理','Next step of the reasoning')"></span></button>
        <button class="btn" @click="all" v-if="!essay">📜 <span v-html="bi('连贯全文模式','Continuous essay mode')"></span></button>
        <button class="btn ghost" @click="stepMode" v-if="essay">🧩 <span v-html="bi('返回逐步模式','Back to step mode')"></span></button>
        <button class="btn ghost" @click="restart">↺ <span v-html="bi('重来','Restart')"></span></button>
        <span class="reason-progress">{{ shown }} / {{ steps.length }}</span>
      </div>
      <div class="reason-wrap">
        <div v-for="(st,i) in steps" :key="i" :ref="'step'+i" class="reason-step"
             :class="{shown: essay || i < shown, now: (i === shown-1 && !essay)}">
          <span class="rs-no">{{ i+1 }}</span>
          <span class="rs-link">⛓ {{ st.link }}</span>
          <h4><span class="zh">{{ st.title.zh }}</span><span class="en">{{ st.title.en }}</span></h4>
          <p class="bi duo" style="font-size:14.5px" v-html="bi(st.zh, st.en)"></p>
          <p v-if="st.question" class="bi duo" style="font-size:13.5px; margin:6px 0 0; padding:9px 13px; background:var(--gold-soft); border-radius:9px; border:1px solid #f3ddb0" v-html="bi(
            '<strong>逼出的问题 →</strong> ' + st.question.zh,
            '<strong>The question it forces →</strong> ' + st.question.en)"></p>
        </div>
      </div>
      <div v-if="shown>=steps.length || essay" class="callout done">
        <div class="callout-icon">🎓</div>
        <div class="callout-body"><p class="bi duo" v-html="bi(
          '推理链闭合：想要好策略 → 需要回报 → 回报会发散 → 需要 γ → 统一回合 → 概率接管 → MDP → 马尔可夫性 → Bellman。带着这条链去读代码、去写作业，每一个细节都不再孤立。',
          'The chain is closed: a good policy → return → divergence → γ → unified episodes → probabilities → MDP → Markov property → Bellman. Carry this chain into the code and the assignment — no detail remains isolated.')"></p></div>
      </div>
    </div>`,
  };

  /* ═════════════ Q&A 翻转卡 ═════════════ */
  const QaLab = {
    name: 'QaLab',
    props: { source: { type: String, default: 'l1' } },
    data: () => ({ flipped: {} }),
    computed: { cards() { return (D.qaSets && D.qaSets[this.source]) || D.qa; } },
    setup() { return { bi }; },
    methods: { flip(i) { this.flipped[i] = !this.flipped[i]; } },
    template: `
    <div class="qa-grid">
      <div v-for="(c,i) in cards" :key="i" class="qa-card" :class="{flipped: !!flipped[i]}"
           role="button" tabindex="0" :aria-expanded="flipped[i] ? 'true' : 'false'"
           @click="flip(i)" @keydown.enter.prevent="flip(i)" @keydown.space.prevent="flip(i)">
        <div class="qa-inner">
          <div class="qa-face">
            <span class="qa-tag">{{ c.tag }}</span>
            <p class="bi duo" style="font-weight:700; font-size:15.5px" v-html="bi(c.q.zh, c.q.en)"></p>
            <span class="qa-hint" v-html="bi('点击翻转看答案 →','click to flip →')"></span>
          </div>
          <div class="qa-face back">
            <span class="qa-tag" style="background:var(--surface)">A</span>
            <p class="bi duo" style="font-size:14px" v-html="bi(c.a.zh, c.a.en)"></p>
            <span class="qa-hint" v-html="bi('← 点击翻回','← flip back')"></span>
          </div>
        </div>
      </div>
    </div>`,
  };

  /* ═════════════ 首页 ═════════════ */
  const HomeHero = {
    name: 'HomeHero',
    emits: ['go'],
    computed: {
      // 动态统计：小节总数 / widget 实验台数 / 讲数，全部从 DATA 实时算出
      stats() {
        const D = window.DATA;
        let widgets = 0;
        Object.values(D.sections).forEach(s => {
          (s.blocks || []).forEach(b => { if (b && b.t === 'widget') widgets++; });
        });
        return {
          sections: Object.keys(D.sections).length,
          widgets,
          lectures: D.navGroups.length,
          themes: 5,
        };
      },
    },
    mounted() {
      // 首页 hero 编排（只在挂载时播一次，不随滚动重播）：
      // kicker → 标题分行 → 副标题两行 → CTA 按钮组 → stats 数字条（count-up）
      if (!window.gsap) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const el = this.$el;
      const nums = Array.from(el.querySelectorAll('.hero-stat b'));
      const targets = nums.map(b => parseInt(b.textContent, 10) || 0); // 先取真实值再从 0 滚起
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from(el.querySelector('.hero-kicker'), { y: 10, opacity: 0, duration: .4 })
        .from(Array.from(el.querySelector('.hero-title').children), { y: 16, opacity: 0, duration: .5, stagger: .09 }, '-=.18')
        .from(el.querySelector('.hero-sub'), { y: 12, opacity: 0, duration: .45 }, '-=.2')
        .from(el.querySelector('.hero-sub-en'), { y: 10, opacity: 0, duration: .4 }, '-=.28')
        .from(el.querySelectorAll('.hero-cta .btn'), { y: 8, opacity: 0, duration: .35, stagger: .07 }, '-=.22')
        .from(el.querySelectorAll('.hero-stat'), { y: 10, opacity: 0, duration: .4, stagger: .07 }, '-=.18');
      nums.forEach((b, i) => {
        b.textContent = '0';
        const o = { v: 0 };
        tl.to(o, {
          v: targets[i], duration: .75,
          onUpdate: () => { b.textContent = String(Math.round(o.v)); },
        }, .62 + i * .06);
      });
    },
    template: `
    <div class="home-hero">
      <span class="hero-kicker">📖 全书可视化 · Visual Book · Mathematical Foundation of RL · 双语</span>
      <h1 class="hero-title">
        <span v-html="bi('把强化学习全书', 'Run the whole RL book, ')"></span><span class="grad" v-html="bi('“跑”起来', 'visually')"></span>
      </h1>
      <p class="hero-sub" v-html="bi(
        '以可视化教学的高标准，把《Mathematical Foundation of Reinforcement Learning》十讲内容做成可玩的交互实验：从网格世界与 Bellman 方程，到值迭代、蒙特卡洛、时序差分、策略梯度与 Actor-Critic——看完就能理解代码与算法。',
        'Every lecture of “Mathematical Foundation of Reinforcement Learning” turned into playable interactive labs: from the grid world and the Bellman equation to value iteration, Monte Carlo, temporal-difference, policy gradient and Actor-Critic — built to make the code and the algorithms genuinely understandable.')"></p>
      <p class="hero-sub-en" v-html="bi(
        '每一课都包含：双语讲义 · 交互实验台 · 代码逐类型精讲 · 连贯长推理 · 问答。',
        'Every lesson ships bilingual notes, interactive labs, a type-by-type code walkthrough, one long coherent chain of reasoning, and Q&amp;A cards.')"></p>
      <div class="hero-cta">
        <button class="btn primary" style="padding:11px 22px; font-size:14.5px" @click="$emit('go','grid-world')">🚀 <span v-html="bi('从第一课开始','Start from Lesson 1')"></span></button>
        <button class="btn" style="padding:11px 20px" @click="$emit('go','l2-bellman')">🧮 <span v-html="bi('直达 Bellman 方程','Bellman equation')"></span></button>
        <button class="btn" style="padding:11px 20px" @click="$emit('go','l7-td0')">⚖️ <span v-html="bi('直达 Q-learning','Q-learning')"></span></button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><b>{{ stats.sections }}</b><span v-html="bi('个小节双语精讲','sections, bilingual')"></span></div>
        <div class="hero-stat"><b>{{ stats.widgets }}</b><span v-html="bi('个交互实验台','interactive labs')"></span></div>
        <div class="hero-stat"><b>{{ stats.lectures }}</b><span v-html="bi('讲全书覆盖','lectures, one visual course')"></span></div>
        <div class="hero-stat"><b>{{ stats.themes }}</b><span v-html="bi('套主题随点随换','themes, one click apart')"></span></div>
      </div>
    </div>`,
    setup() { return { bi }; },
  };

  const LectureIndex = {
    name: 'LectureIndex',
    emits: ['go'],
    computed: {
      lectures() { return window.DATA.otherLectures; },
      firstId() {
        // 动态取每讲 navGroups 的第一个小节 id（旧的硬编码表里有 5 个 id 并不存在）
        const map = {};
        window.DATA.navGroups.forEach(g => { map[g.lecture] = g.items[0] && g.items[0].id; });
        return map;
      },
    },
    template: `
    <div class="course-map-card">
      <h3 class="sub" style="margin-top:0"><span v-html="bi('课程索引：逐讲进入','Lecture index: enter any lesson')"></span></h3>
      <div class="lx-grid">
        <button v-for="l in lectures" :key="l.no" class="lx-card reveal-item" :class="l.done ? 'done' : 'pending'"
                @click="$emit('go', firstId[l.no])">
          <span class="lx-no">LESSON {{ l.no }} {{ l.done ? '· ✓ 已完成 done' : '· Soon' }}</span>
          <span class="lx-zh">{{ l.zh }}</span>
          <span class="lx-en">{{ l.en }}</span>
          <span class="lx-go" v-if="l.done" v-html="bi('进入本讲 →','Enter →')"></span>
        </button>
      </div>
    </div>`,
    setup() { return { bi }; },
  };

  const CourseMap = {
    name: 'CourseMap',
    emits: ['go'],
    computed: {
      // 首节 id：动态取每讲 navGroups 的第一个小节（保证 id 一定存在）
      firstIds() {
        const map = {};
        window.DATA.navGroups.forEach(g => { map[g.lecture] = g.items[0] && g.items[0].id; });
        return map;
      },
      // 根 → 五大分支 → 每讲叶子（讲名取自 otherLectures，单一数据源）
      branches() {
        const byNo = {};
        window.DATA.otherLectures.forEach(l => { byNo[l.no] = l; });
        const defs = [
          { key: 'I',   cls: 'b-model',  zh: '建模根基',           en: 'Modeling',                     nos: [1] },
          { key: 'II',  cls: 'b-values', zh: '值与方程',           en: 'Values & equations',           nos: [2, 3] },
          { key: 'III', cls: 'b-mb',     zh: '有模型算法',         en: 'Model-based',                  nos: [4] },
          { key: 'IV',  cls: 'b-mf',     zh: '无模型 · 值方法',    en: 'Model-free · value-based',     nos: [5, 6, 7, 8] },
          { key: 'V',   cls: 'b-policy', zh: '策略方法',           en: 'Policy-based',                 nos: [9, 10] },
        ];
        return defs.map(d => ({ ...d, leaves: d.nos.map(no => byNo[no]).filter(Boolean) }));
      },
    },
    template: `
    <div class="course-map-card">
      <h3 class="sub" style="margin-top:0"><span v-html="bi('全书知识树 · The Knowledge Tree','The Knowledge Tree · ten lectures, five branches')"></span></h3>
      <div class="ktree">
        <div class="ktree-root">
          <span class="kt-root-badge">RL</span>
          <span class="zh">强化学习的数学根基 · 全书十讲</span>
          <span class="en">Mathematical Foundation of RL · 10 lectures</span>
        </div>
        <div class="ktree-branches">
          <div class="ktree-branch reveal-item" :class="b.cls" v-for="b in branches" :key="b.key">
            <div class="ktree-branch-head">
              <span class="kt-branch-key">{{ b.key }}</span>
              <span class="kt-branch-zh">{{ b.zh }}</span>
              <span class="kt-branch-en">{{ b.en }}</span>
            </div>
            <div class="ktree-leaves">
              <button class="ktree-leaf reveal-item" v-for="leaf in b.leaves" :key="leaf.no"
                      @click="$emit('go', firstIds[leaf.no])">
                <span class="kt-leaf-no">L{{ leaf.no }}</span>
                <span class="kt-leaf-title">
                  <span class="zh">{{ leaf.zh }}</span>
                  <span class="en">{{ leaf.en }}</span>
                </span>
                <span class="kt-leaf-go">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="map-caption">
        <span v-for="b in branches" :key="'lg-' + b.key"><i class="kt-swatch" :class="b.cls"></i><span v-html="bi(b.zh, b.en)"></span></span>
        <span v-html="bi('· 点击任意一讲进入其首节','· click any lecture to enter')"></span>
      </div>
    </div>`,
    setup() { return { bi }; },
  };

  const HowToUse = {
    name: 'HowToUse',
    emits: ['go'],
    template: `
    <div class="course-map-card">
      <h3 class="sub" style="margin-top:0"><span v-html="bi('怎么用这一课','How to use this lesson')"></span></h3>
      <div class="goal-list">
        <div class="goal-item">
          <span class="g-ico">①</span>
          <span class="g-body">
            <span class="zh">按侧栏顺序学：每个概念都有“讲义 + 实验台”，先读再玩，动手才懂。</span>
            <span class="en">Follow the sidebar order: each concept pairs prose with a lab — read, then play.</span>
          </span>
        </div>
        <div class="goal-item">
          <span class="g-ico">②</span>
          <span class="g-body">
            <span class="zh">右上角切换 中英双语 / 中文 / English；双语模式下左右对照逐段对齐。</span>
            <span class="en">Switch bilingual / Chinese / English from the top bar; bilingual mode aligns the two languages side by side.</span>
          </span>
        </div>
        <div class="goal-item">
          <span class="g-ico">③</span>
          <span class="g-body">
            <span class="zh">“连贯长推理”把全章串成一条不许断的逻辑链，适合复习与写作报告前梳理。</span>
            <span class="en">“The long reasoning” chains the whole chapter into one unbreakable logic — perfect before writing reports.</span>
          </span>
        </div>
        <div class="goal-item">
          <span class="g-ico">④</span>
          <span class="g-body">
            <span class="zh">“代码精讲”逐类型拆解 grid_world.py，配作业 4×4 的坐标映射与坑位清单。</span>
            <span class="en">“Code walkthrough” dissects grid_world.py type by type, with the 4×4 coordinate mapper and the trap list.</span>
          </span>
        </div>
      </div>
      <div class="callout warn" style="margin:16px 0 0">
        <div class="callout-icon">⚠️</div>
        <div class="callout-body"><p class="bi duo" v-html="bi(
          '注意：书上禁区“可进入但扣分”，<strong>作业代码是“弹回”</strong>——课程课件第 8 页明确这一差异，本课在转移一节提供两种规则的切换实验。',
          'Note: the book lets forbidden cells be entered (with a penalty), while <strong>the assignment code bounces the agent back</strong> — slide 8 makes this explicit; the transition section offers a toggle for both rules.')"></p></div>
      </div>
    </div>`,
    setup() { return { bi }; },
  };

  /* ═════════════ 注册 ═════════════ */
  // 共享助手：后续 per-lecture 组件文件通过 window.RLV 复用
  window.RLV = { stepOnce, s2rc, rc2s, center, bi, TYPE_LABEL, hlPy, CELL, PAD, STAR, rng };

  window.COMPONENTS = {
    GridBoard,
    'concept-chain': ConceptChain,
    'code-lab': CodeLab,
    'reasoning-lab': ReasoningLab,
    'qa-lab': QaLab,
    'home-hero': HomeHero,
    'lecture-index': LectureIndex,
    'course-map': CourseMap,
    'how-to-use': HowToUse,
  };
})();
