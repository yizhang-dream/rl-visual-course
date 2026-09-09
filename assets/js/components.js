/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · 组件库
   GridBoard 是唯一的网格渲染引擎，所有实验台都建立在它之上
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

  // 执行一步：优先查书中 3×3 权威表；否则按规则生成
  // mode: 'book' 禁区可进入(书) | 'code' 禁区弹回(老师代码/作业)
  function stepOnce(state, aid, cfg) {
    const { size, forbidden = [], target } = cfg;
    if (size === 3 && cfg.mode === 'book') {
      const next = D.T3[state - 1][aid - 1];
      const sym = D.R3SYM[state - 1][aid - 1];
      const reward = sym === 'b' ? -1 : sym === 'f' ? -1 : sym === 't' ? 1 : 0;
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
      if (cfg.mode === 'code') return { next: state, reward: -1, type: 'bounce-forbidden', sym: 'f' };
      return { next, reward: -1, type: 'forbidden', sym: 'f' };
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
        return '#ffffff';
      },
      clickCell(st) { if (this.clickable) this.$emit('cell', st); },
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
        <tspan v-if="size===4">起点</tspan><tspan v-else>Start</tspan>
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
                :fill="pop.kind==='pos' ? 'var(--green)' : pop.kind==='neg' ? 'var(--red)' : '#8395a7'" opacity=".92"/>
        <text :x="center(pop.state,size).x" :y="center(pop.state,size).y + 1" text-anchor="middle"
              fill="#fff" font-weight="800" font-size="16" font-family="var(--mono)">{{pop.text}}</text>
      </g>

      <!-- 撞击闪烁 -->
      <rect v-if="flashState!=null" :key="'fl'+flashKey" class="bounce-flash"
            :x="PAD + s2rc(flashState,size).c*CELL" :y="PAD + s2rc(flashState,size).r*CELL"
            :width="CELL" :height="CELL" fill="var(--red)" opacity=".28"/>

      <!-- 价值数字 -->
      <text v-for="vt in valueTexts" :key="'v'+vt.st" :x="vt.x" :y="vt.y+5"
            text-anchor="middle" font-weight="700" font-size="15" font-family="var(--mono)"
            fill="#233" style="paint-order:stroke; stroke:#fff; stroke-width:4px;">{{vt.v}}</text>

      <!-- 智能体 -->
      <g class="agent-g" :style="agentStyle">
        <polygon class="agent-star agent-pulse" :points="STAR" fill="var(--accent)" stroke="#fff" stroke-width="2"/>
      </g>

      <!-- 点击热区（最上层） -->
      <rect v-for="st in allStates" :key="'h'+st" class="cell-hit" :class="{'sel-halo': st===selected}"
            :x="PAD + s2rc(st,size).c*CELL" :y="PAD + s2rc(st,size).r*CELL"
            :width="CELL" :height="CELL" fill="transparent" @click="clickCell(st)"/>
    </svg>`,
    setup(props) { return { CELL, PAD, s2rc, center, STAR }; },
  };

  /* ═════════════ 通用小组件 ═════════════ */
  const RollNum = {
    name: 'RollNum',
    props: { value: { type: Number, default: 0 }, cls: { type: String, default: '' } },
    data: () => ({ disp: 0 }),
    watch: {
      value(nv, ov) {
        if (!window.gsap) { this.disp = nv; return; }
        const o = { v: ov };
        gsap.to(o, { v: nv, duration: .45, ease: 'power2.out', onUpdate: () => { this.disp = o.v; } });
      },
    },
    mounted() { this.disp = this.value; },
    template: `<span class="rollnum" :class="cls">{{ fmt(disp) }}</span>`,
    methods: { fmt(v) { return Number.isInteger(v) ? v : v.toFixed(2); } },
  };

  const ActionBtn = {
    name: 'ActionBtn',
    props: { act: Object, active: Boolean },
    emits: ['pick'],
    template: `
    <button class="btn sm" :class="{primary: active}" @click="$emit('pick', act.id)"
            :title="act.sym + ' · ' + act.en">
      <svg width="15" height="15" viewBox="0 0 20 20" style="transform:rotate(-90deg)">
        <g :transform="'rotate(' + [0,0,90,180,270,0][act.id] + ' 10 10)'" v-if="act.id!==5">
          <line x1="10" y1="15.5" x2="10" y2="5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
          <polygon points="10,2.6 13.4,7.4 6.6,7.4" fill="currentColor"/>
        </g>
        <circle v-else cx="10" cy="10" r="4.6" fill="none" stroke="currentColor" stroke-width="2.4"/>
      </svg>
      {{ act.sym }}<span style="font-weight:500;opacity:.65;font-size:11px">{{ act.zh }}</span>
    </button>`,
  };

  const Dist = {
    name: 'Dist',
    props: { rows: Array, title: String },  // [{name, val, hot}]
    template: `
    <div>
      <div v-if="title" class="ctl-label" style="margin-bottom:8px" v-html="title"></div>
      <div class="dist">
        <div v-for="r in rows" :key="r.name" class="dist-row">
          <span class="dist-name">{{ r.name }}</span>
          <div class="dist-bar-track"><div class="dist-bar" :class="{hot: r.hot}"
               :style="{width: (r.val*100)+'%'}"></div></div>
          <span class="dist-val">{{ r.val.toFixed(2) }}</span>
        </div>
      </div>
    </div>`,
  };

  /* ═════════════ §1.1 网格世界实验台 ═════════════ */
  const GridIntroLab = {
    name: 'GridIntroLab',
    components: { GridBoard },
    data: () => ({ world: 3, popSeq: 0, pops: [] }),
    computed: {
      cfg() {
        return this.world === 3
          ? { size: 3, forbidden: [6, 7], target: 9, start: 1 }
          : { size: 4, forbidden: [8, 10], target: 12, start: 1 };
      },
      infoLines() {
        const c = this.cfg;
        return this.world === 3
          ? [bi('9 个状态 · 5 个动作 · 禁区 s6、s7 · 目标 s9', '9 states · 5 actions · forbidden s6, s7 · target s9')]
          : [bi('16 个状态 · 5 个动作 · 禁区 s8、s10 · 目标 s12', '16 states · 5 actions · forbidden s8, s10 · target s12'),
             bi('奖励 −1 / −1 / +1 / 0，折扣率 γ = 0.9（作业规格）', 'Rewards −1 / −1 / +1 / 0, discount rate γ = 0.9 (assignment spec)')];
      },
    },
    methods: {
      poke(st) {
        const id = ++this.popSeq;
        if (st === this.cfg.target) {
          this.pops.push({ id, state: st, text: '+1', kind: 'pos' });
        } else if (this.cfg.forbidden.includes(st)) {
          this.pops.push({ id, state: st, text: '✕', kind: 'neg' });
        }
        setTimeout(() => { this.pops = this.pops.filter(p => p.id !== id); }, 1050);
      },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">交互 · 点格子试试 / Interactive — click the cells</span>
        <div class="seg">
          <button :class="{active: world===3}" @click="world=3">书本 3×3 · Book</button>
          <button :class="{active: world===4}" @click="world=4">作业 4×4 · Assignment</button>
        </div>
      </div>
      <div class="lab-body">
        <div class="lab-stage">
          <grid-board :size="cfg.size" :forbidden="cfg.forbidden" :target="cfg.target"
                      :start="cfg.start" :agent="cfg.start" clickable @cell="poke"/>
        </div>
        <div class="lab-side">
          <div class="kw-legend">
            <span class="lg"><i class="sw" style="background:#fff;border:1px solid #c9d4de"></i><span v-html="bi('白色 · 可进入','white · accessible')"></span></span>
            <span class="lg"><i class="sw" style="background:var(--gold)"></i><span v-html="bi('橙 · 禁区','orange · forbidden')"></span></span>
            <span class="lg"><i class="sw" style="background:var(--cyan)"></i><span v-html="bi('蓝 · 目标','blue · target')"></span></span>
            <span class="lg"><i class="sw" style="background:var(--accent);border-radius:99px"></i><span v-html="bi('星 · 智能体','star · the agent')"></span></span>
          </div>
          <p v-for="(l,i) in infoLines" :key="i" class="bi duo" style="font-size:14px;margin-bottom:10px" v-html="l"></p>
          <div class="callout key" style="margin:0">
            <div class="callout-icon">🎯</div>
            <div class="callout-body"><p class="bi duo" v-html="bi(
              '任务：从<strong>任何</strong>格子出发都到达 ' + (world===3?'s9':'s12') + '——不闯禁区、不绕路、不撞墙。智能体对地图一无所知，只能试错。',
              'The task: reach ' + (world===3?'s9':'s12') + ' from <strong>any</strong> cell — no trespassing, no detours, no wall bumps. The agent knows nothing about the map and can only learn by trial and error.')"></p></div>
          </div>
        </div>
      </div>
    </div>`,
    setup() { return { bi }; },
  };

  /* ═════════════ §1.2 状态与动作实验台 ═════════════ */
  const StateActionLab = {
    name: 'StateActionLab',
    components: { GridBoard, ActionBtn },
    data: () => ({ sel: 1, last: null, popSeq: 0, pops: [], flashKey: 0 }),
    computed: {
      rcInfo() {
        const { r, c } = s2rc(this.sel, 3);
        return { r, c, x: c, y: r };
      },
      resultText() {
        if (!this.last) return '';
        const r = this.last.res;
        const act = D.actions[this.last.aid - 1];
        const t = TYPE_LABEL[r.type];
        return bi(
          `在 <strong>s${this.last.from}</strong> 选 <strong>${act.sym}（${act.zh}）</strong> → ${t.zh}，落在 <strong>s${r.next}</strong>，即时奖励 <strong>${r.reward >= 0 ? '+' + r.reward : r.reward}</strong>。`,
          `At <strong>s${this.last.from}</strong> choose <strong>${act.sym} (${act.en})</strong> → ${t.en}, landing at <strong>s${r.next}</strong> with immediate reward <strong>${r.reward >= 0 ? '+' + r.reward : r.reward}</strong>.`);
      },
    },
    methods: {
      pickState(st) { this.sel = st; this.last = null; },
      pickAction(aid) {
        const from = this.sel;
        const res = stepOnce(from, aid, { size: 3, forbidden: [6, 7], target: 9, mode: 'book' });
        this.last = { aid, res, from };
        const id = ++this.popSeq;
        if (res.reward !== 0 || res.type !== 'move') {
          const kind = res.reward > 0 ? 'pos' : res.reward < 0 ? 'neg' : 'zero';
          this.pops.push({ id, state: res.next, text: res.reward > 0 ? '+1' : res.reward < 0 ? '−1' : '0', kind });
          setTimeout(() => { this.pops = this.pops.filter(p => p.id !== id); }, 1050);
        }
        if (res.type === 'bounce' || res.type === 'bounce-forbidden') this.flashKey++;
        this.sel = res.next;
      },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">交互 · 选一个状态，再选一个动作 / Pick a state, then an action</span>
      </div>
      <div class="lab-body">
        <div class="lab-stage">
          <grid-board :size="3" :forbidden="[6,7]" :target="9" :agent="sel" :selected="sel"
                      clickable @cell="pickState" :reward-pops="pops"
                      :flash-state="last && (last.res.type==='bounce'||last.res.type==='bounce-forbidden') ? last.res.next : null"
                      :flash-key="flashKey"/>
        </div>
        <div class="lab-side">
          <div style="margin-bottom:12px">
            <span class="chip-t">s{{sel}}</span>
            <span class="ctl-label" style="margin-left:8px" v-html="bi(
              '第 '+(rcInfo.r+1)+' 行第 '+(rcInfo.c+1)+' 列 · 代码坐标 (x,y) = ('+rcInfo.x+', '+rcInfo.y+')',
              'row '+(rcInfo.r+1)+', col '+(rcInfo.c+1)+' · code coords (x,y) = ('+rcInfo.x+', '+rcInfo.y+')')"></span>
          </div>
          <div class="ctl-row">
            <action-btn v-for="a in D.actions" :key="a.id" :act="a" :active="last && last.aid===a.id" @pick="pickAction"/>
          </div>
          <div v-if="last" class="callout" :class="TYPE_LABEL[last.res.type].cls || 'key'" style="margin:12px 0">
            <div class="callout-icon">{{ last.res.type==='target' ? '🏁' : (last.res.type==='move'||last.res.type==='stay') ? '🚶' : '💥' }}</div>
            <div class="callout-body"><p class="bi duo" style="font-size:14px" v-html="resultText"></p></div>
          </div>
          <div class="formula-card" style="font-size:15px; font-family:var(--mono)">
            S = {'s1', …, 's9'} &nbsp;&nbsp;·&nbsp;&nbsp; A = {'a1', …, 'a5'}
          </div>
        </div>
      </div>
    </div>`,
    setup() { return { D, bi, TYPE_LABEL }; },
  };

  /* ═════════════ §1.3 状态转移实验台 ═════════════ */
  const TransitionLab = {
    name: 'TransitionLab',
    components: { GridBoard, Dist },
    data: () => ({
      world: 3, mode: 'book', selS: 1, selA: 2,
      agentS: 1, pops: [], popSeq: 0, flashKey: 0, wind: false,
    }),
    computed: {
      cfg() {
        return this.world === 3
          ? { size: 3, forbidden: [6, 7], target: 9, mode: this.mode, table3: D.T3, rsym3: D.R3SYM }
          : { size: 4, forbidden: [8, 10], target: 12, mode: 'code' };
      },
      rows() {
        const out = [];
        const n = this.cfg.size;
        for (let s = 1; s <= n * n; s++) {
          let val = 0;
          if (this.wind && this.world === 3 && this.selS === 1 && this.selA === 2) {
            val = s === 2 ? 0.8 : s === 5 ? 0.2 : 0;
          } else {
            val = stepOnce(this.selS, this.selA, this.cfg).next === s ? 1 : 0;
          }
          out.push({ name: 's' + s, val, hot: val > 0 && val < 1 });
        }
        return out;
      },
      tableRows() {
        const n = this.cfg.size;
        const rows = [];
        for (let s = 1; s <= n * n; s++) {
          const cells = [];
          for (let a = 1; a <= 5; a++) cells.push(stepOnce(s, a, this.cfg).next);
          rows.push({ s, cells });
        }
        return rows;
      },
      result() { return stepOnce(this.selS, this.selA, this.cfg); },
      resultText() {
        const r = this.result;
        const act = D.actions[this.selA - 1];
        const t = TYPE_LABEL[r.type];
        return bi(
          `s${this.selS} <strong>+ ${act.sym}（${act.zh}）</strong> → <strong>s${r.next}</strong> · ${t.zh} · 奖励 <strong>${r.reward > 0 ? '+1' : r.reward < 0 ? '−1' : '0'}</strong>`,
          `s${this.selS} <strong>+ ${act.sym} (${act.en})</strong> → <strong>s${r.next}</strong> · ${t.en} · reward <strong>${r.reward > 0 ? '+1' : r.reward < 0 ? '−1' : '0'}</strong>`);
      },
    },
    methods: {
      run() {
        const res = stepOnce(this.selS, this.selA, this.cfg);
        this.flashKey++;
        const id = ++this.popSeq;
        const kind = res.reward > 0 ? 'pos' : res.reward < 0 ? 'neg' : 'zero';
        this.pops.push({ id, state: res.next, text: res.reward > 0 ? '+1' : res.reward < 0 ? '−1' : '0', kind });
        setTimeout(() => { this.pops = this.pops.filter(p => p.id !== id); }, 1050);
        this.agentS = res.next;
      },
      rwCell(s, a) {
        const n = this.cfg.size;
        if (this.world === 3 && this.mode === 'book') return D.R3SYM[s - 1][a - 1];
        const r = stepOnce(s, a, this.cfg);
        return r.sym === 0 ? 0 : r.sym;
      },
      rwClass(v) {
        if (v === 'b') return 'sym-b';
        if (v === 'f') return 'sym-f';
        if (v === 't') return 'sym-t';
        return v === 0 ? 'zero' : 'num';
      },
      rwText(v) {
        return v === 'b' ? 'r_bd' : v === 'f' ? 'r_fbd' : v === 't' ? 'r_tgt' : '0';
      },
      hit(s, a) { return s === this.selS && a === this.selA; },
    },
    mounted() { this.agentS = this.selS; },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">转移实验台 · Transition lab</span>
        <div class="seg">
          <button :class="{active: world===3}" @click="world=3; selS=Math.min(selS,9); agentS=selS">3×3 书本 · Book</button>
          <button :class="{active: world===4}" @click="world=4; mode='code'; agentS=selS">4×4 作业 · Assignment</button>
        </div>
        <div class="seg" v-if="world===3">
          <button :class="{active: mode==='book'}" @click="mode='book'" title="书：禁区可进入">书规则 · accessible</button>
          <button :class="{active: mode==='code'}" @click="mode='code'" title="代码/作业：禁区弹回">代码规则 · bounce</button>
        </div>
      </div>
      <div class="lab-body">
        <div class="lab-stage">
          <grid-board :size="cfg.size" :forbidden="cfg.forbidden" :target="cfg.target"
                      :agent="agentS" :selected="selS" clickable
                      @cell="selS = $event; agentS = $event"
                      :reward-pops="pops" :flash-state="(result.type==='bounce'||result.type==='bounce-forbidden') ? selS : null" :flash-key="flashKey"/>
          <div class="ctl-row" style="margin-top:12px">
            <select class="sel" v-model.number="selS" @change="agentS = selS">
              <option v-for="s in cfg.size*cfg.size" :key="s" :value="s">{{'s'+s}}</option>
            </select>
            <select class="sel" v-model.number="selA">
              <option v-for="a in D.actions" :key="a.id" :value="a.id">{{a.sym}} · {{a.zh}} / {{a.en}}</option>
            </select>
            <button class="btn primary" @click="run">▶ <span v-html="bi('执行','Run')"></span></button>
            <label class="ctl-label" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer" v-if="world===3 && selS===1 && selA===2">
              <input type="checkbox" v-model="wind"> <span v-html="bi('想象有风 🌬','imagine wind 🌬')"></span>
            </label>
          </div>
        </div>
        <div class="lab-side">
          <div class="callout key" style="margin:0 0 13px">
            <div class="callout-icon">🧭</div>
            <div class="callout-body"><p class="bi duo" style="font-size:14px" v-html="resultText"></p></div>
          </div>
          <dist :rows="rows" :title="bi('p(s′ | s'+selS+', a'+selA+') —— 下一状态分布', 'p(s′ | s'+selS+', a'+selA+') — next-state distribution')"></dist>
          <p class="bi duo" style="font-size:12.5px;color:var(--ink-3);margin:8px 0 12px" v-html="bi(
            '确定性转移：概率质量全部压在一个格子上。勾选“有风”看看随机分布长什么样（风力演示）。',
            'Deterministic: all probability mass on one cell. Tick “wind” to see what a stochastic distribution looks like (demo wind).')"></p>
        </div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th></th>
            <th v-for="a in D.actions" :key="a.id">{{a.sym}} ({{a.en}})</th>
          </tr></thead>
          <tbody>
            <tr v-for="row in tableRows" :key="row.s">
              <td class="row-head">{{'s'+row.s}}</td>
              <td v-for="(nx,i) in row.cells" :key="i" :class="{hit: hit(row.s, i+1)}">{{'s'+nx}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="bi duo" style="font-size:12.5px;color:var(--ink-3)" v-html="bi(
        '状态转移表（书 Table 1.1 的扩展版）：第 i 行第 j 列 = 在 si 取 aj 落到哪。高亮单元即当前实验选择。',
        'Transition table (extended from Table 1.1): row i, column j = where the agent lands taking aj at si. The highlighted cell is the current lab selection.')"></p>
    </div>`,
    setup() { return { D, bi, stepOnce, TYPE_LABEL }; },
  };

  /* ═════════════ §1.4 策略实验台 ═════════════ */
  const PolicyLab = {
    name: 'PolicyLab',
    components: { GridBoard, Dist },
    data: () => ({
      which: 'P1', sel: 1, sampled: null, popSeq: 0, pops: [],
    }),
    computed: {
      cfg() { return { size: 3, forbidden: [6, 7], target: 9 }; },
      matrix() { return D[this.which]; },
      isStoch() { return this.which === 'PS'; },
      nameText() {
        return {
          P1: bi('策略 1（确定性，Fig 1.4/1.6a）——避开禁区直达目标', 'Policy 1 (deterministic, Fig 1.4/1.6a) — avoids forbidden cells'),
          P2: bi('策略 2（确定性，Fig 1.6b）——从 s1 出发会踩进禁区 s7', 'Policy 2 (deterministic, Fig 1.6b) — steps into forbidden s7 from s1'),
          PS: bi('随机策略（Table 1.2）——s1 以 0.5 向右、0.5 向下掷硬币', 'Stochastic policy (Table 1.2) — at s1 flip a coin: 0.5 right, 0.5 down'),
        }[this.which];
      },
      distRows() {
        return D.actions.map((a, i) => ({
          name: a.sym + ' ' + a.zh,
          val: this.matrix[this.sel - 1][i],
          hot: this.matrix[this.sel - 1][i] > 0 && this.matrix[this.sel - 1][i] < 1,
        }));
      },
      sampleText() {
        const a = D.actions[this.sampled.aid - 1];
        const r = this.sampled.res;
        return bi(
          `掷出 <strong>${a.sym}（${a.zh}）</strong>（π = ${this.matrix[this.sel - 1][this.sampled.aid - 1]}）→ 落到 <strong>s${r.next}</strong>。多抽几次感受随机性！`,
          `Sampled <strong>${a.sym} (${a.en})</strong> (π = ${this.matrix[this.sel - 1][this.sampled.aid - 1]}) → landing at <strong>s${r.next}</strong>. Sample repeatedly to feel the randomness!`);
      },
    },
    methods: {
      sample() {
        const row = this.matrix[this.sel - 1];
        let x = Math.random(), acc = 0, pick = 5;
        for (let i = 0; i < 5; i++) { acc += row[i]; if (x <= acc) { pick = i + 1; break; } }
        const res = stepOnce(this.sel, pick, { ...this.cfg, mode: 'book' });
        this.sampled = { aid: pick, key: Date.now() };
        const id = ++this.popSeq;
        this.pops.push({ id, state: res.next, text: res.reward > 0 ? '+1' : '·', kind: res.reward > 0 ? 'pos' : 'zero' });
        setTimeout(() => { this.pops = this.pops.filter(p => p.id !== id); }, 1050);
        this.sampled.res = res;
      },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">策略实验台 · Policy lab</span>
        <div class="seg">
          <button :class="{active: which==='P1'}" @click="which='P1'">策略 1</button>
          <button :class="{active: which==='P2'}" @click="which='P2'">策略 2</button>
          <button :class="{active: which==='PS'}" @click="which='PS'">随机 π · stochastic</button>
        </div>
      </div>
      <div class="lab-body">
        <div class="lab-stage">
          <grid-board size="3" :forbidden="[6,7]" :target="9" :policy="matrix"
                      :selected="sel" clickable @cell="sel = $event; sampled = null"
                      :probe="sampled ? {state: sel, action: D.actions[sampled.aid-1], key: sampled.key} : null"
                      :reward-pops="pops"/>
        </div>
        <div class="lab-side">
          <div class="callout key" style="margin:0 0 12px">
            <div class="callout-icon">🗺️</div>
            <div class="callout-body"><p class="bi duo" style="font-size:14px" v-html="nameText"></p></div>
          </div>
          <dist :rows="distRows"
            :title="bi('π(a | s'+sel+') —— 点击左图任意格子切换状态', 'π(a | s'+sel+') — click any cell on the left to switch state')"></dist>
          <div class="ctl-row" style="margin-top:13px">
            <button class="btn primary" @click="sample">🎲 <span v-html="bi('按 π 抽样一步','Sample one step from π')"></span></button>
          </div>
          <p v-if="sampled" class="bi duo" style="font-size:14px;margin:8px 0 0" v-html="sampleText"></p>
          <p class="bi duo" style="font-size:12.5px;color:var(--ink-3);margin-top:10px" v-html="bi(
            '绿色箭头长度 = 概率大小（add_policy 的画法，见代码精讲）；圆圈 = 原地 a5。',
            'Green arrow length ∝ probability (the add_policy convention, see code walkthrough); a circle = stay a5.')"></p>
        </div>
      </div>
    </div>`,
    setup() { return { D, bi, stepOnce }; },
  };

  /* ═════════════ §1.5 奖励实验台 ═════════════ */
  const RewardLab = {
    name: 'RewardLab',
    components: { GridBoard },
    data: () => ({ selS: null, selA: null, agentS: 1, pops: [], popSeq: 0, flashKey: 0 }),
    computed: {
      expl() {
        if (this.selS == null) return null;
        const r = stepOnce(this.selS, this.selA, { size: 3, forbidden: [6, 7], target: 9, mode: 'book' });
        const act = D.actions[this.selA - 1];
        const map = {
          b: bi(`撞边界：被弹回原地，奖励 <strong>r_boundary = −1</strong>。`, `Boundary hit: bounced back in place, reward <strong>r_boundary = −1</strong>.`),
          f: bi(`进入禁区 s${r.next}：可以进入（书规则），但奖励 <strong>r_forbidden = −1</strong>。`, `Entered forbidden s${r.next}: accessible (book rule), but reward <strong>r_forbidden = −1</strong>.`),
          t: bi(`到达目标 s9：奖励 <strong>r_target = +1</strong>。`, `Reached target s9: reward <strong>r_target = +1</strong>.`),
        };
        const zero = bi(`普通移动：奖励 <strong>r_other = 0</strong>——走路免费，但也没赚。`, `Ordinary move: reward <strong>r_other = 0</strong> — walking is free, but earns nothing.`);
        const body = map[r.sym] !== undefined ? map[r.sym] : zero;
        return { body, head: bi(`s${this.selS} + ${act.sym}（${act.zh}）`, `s${this.selS} + ${act.sym} (${act.en})`), res: r };
      },
      symRows() {
        return D.R3SYM.map((row, i) => ({ s: i + 1, cells: row }));
      },
    },
    methods: {
      pick(s, a) {
        this.selS = s; this.selA = a;
        const r = stepOnce(s, a, { size: 3, forbidden: [6, 7], target: 9, mode: 'book' });
        this.flashKey++;
        this.agentS = r.next;
        const id = ++this.popSeq;
        const v = r.reward;
        this.pops.push({ id, state: r.next, text: v > 0 ? '+1' : v < 0 ? '−1' : '0', kind: v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero' });
        setTimeout(() => { this.pops = this.pops.filter(p => p.id !== id); }, 1050);
      },
      rwClass(v) { return v === 'b' ? 'sym-b' : v === 'f' ? 'sym-f' : v === 't' ? 'sym-t' : (v === 0 ? 'zero' : 'num'); },
      rwText(v) { return v === 'b' ? 'r_bd' : v === 'f' ? 'r_fbd' : v === 't' ? 'r_tgt' : '0'; },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">奖励表实验台 · 点表中的任意格子 / Reward table — click any cell</span>
      </div>
      <div class="lab-body">
        <div class="lab-side" style="flex:1.25 1 340px">
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th></th><th v-for="a in D.actions" :key="a.id">{{a.sym}} ({{a.en}})</th></tr></thead>
              <tbody>
                <tr v-for="row in symRows" :key="row.s">
                  <td class="row-head">{{'s'+row.s}}</td>
                  <td v-for="(v,i) in row.cells" :key="i" :class="[rwClass(v), {hit: selS===row.s && selA===i+1}]"
                      style="cursor:pointer" @click="pick(row.s, i+1)">{{rwText(v)}}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="kw-legend">
            <span class="lg"><i class="sw" style="background:var(--gold-soft)"></i>r_bd = −1 <span v-html="bi('边界','boundary')"></span></span>
            <span class="lg"><i class="sw" style="background:var(--red-soft)"></i>r_fbd = −1 <span v-html="bi('禁区','forbidden')"></span></span>
            <span class="lg"><i class="sw" style="background:var(--cyan-soft)"></i>r_tgt = +1 <span v-html="bi('目标','target')"></span></span>
            <span class="lg"><i class="sw" style="background:#eef1f5"></i>0 <span v-html="bi('其他','other')"></span></span>
          </div>
        </div>
        <div class="lab-stage" style="margin:0 auto">
          <grid-board size="3" :forbidden="[6,7]" :target="9" :agent="agentS"
                      :selected="selS" :reward-pops="pops" :flash-state="expl && expl.res.type==='bounce' ? selS : null" :flash-key="flashKey"/>
        </div>
      </div>
      <div v-if="expl" class="callout key">
        <div class="callout-icon">🎁</div>
        <div class="callout-body">
          <p class="bi duo" style="font-weight:700" v-html="expl.head"></p>
          <p class="bi duo" style="font-size:14px" v-html="expl.body"></p>
        </div>
      </div>
      <p v-else class="bi duo" style="font-size:13px;color:var(--ink-3);margin:4px 0 0" v-html="bi(
        '示例：点击 s9 行的 a5 列——原地不动也拿 +1；点 a2 列——同样在 s9，却因撞边界拿 −1。',
        'Try the s9 row: a5 earns +1 by standing still; a2 also stays at s9 yet earns −1 for hitting the boundary.')"></p>
    </div>`,
    setup() { return { D, bi, stepOnce }; },
  };

  /* ═════════════ §1.6 轨迹播放器 ═════════════ */
  const TrajectoryLab = {
    name: 'TrajectoryLab',
    components: { GridBoard, RollNum },
    data: () => ({
      which: 'T1', idx: 0, playing: false, infinite: false, infCount: 0,
      gamma: 0.9, timer: null, pops: [], popSeq: 0,
    }),
    computed: {
      cfg() { return { size: 3, forbidden: [6, 7], target: 9, mode: 'book' }; },
      traj() { return this.which === 'T1' ? D.TRAJ1 : D.TRAJ2; },
      states() { return this.traj.states; },
      done() { return this.idx >= this.states.length - 1; },
      tally() {
        let t = 0;
        for (let j = 0; j < this.idx; j++) t += this.traj.rewards[j];
        if (this.infinite) t += this.infCount;
        return t;
      },
      discPartial() {
        let g = 0;
        for (let j = 0; j < this.idx; j++) g += Math.pow(this.gamma, j) * this.traj.rewards[j];
        return g;
      },
      discTail() { return Math.pow(this.gamma, this.idx) / (1 - this.gamma); },
      discTotal() { return this.discPartial + (this.infinite ? this.discTail : 0); },
      closedForm() {
        const firstPos = this.traj.rewards.findIndex(r => r > 0);
        const k = firstPos < 0 ? this.idx : firstPos;
        const cf = Math.pow(this.gamma, k) / (1 - this.gamma);
        return { k, cf, num: Math.pow(this.gamma, k).toFixed(4), den: (1 - this.gamma).toFixed(2) };
      },
      weightBars() {
        return Array.from({ length: 10 }, (_, k) => Math.pow(this.gamma, k));
      },
      chainNodes() {
        const nodes = [];
        this.states.forEach((s, i) => {
          nodes.push({ s, r: i === 0 ? null : this.traj.rewards[i - 1], i });
        });
        return nodes;
      },
    },
    methods: {
      bi,
      stepForward() {
        if (this.idx < this.states.length - 1) {
          this.idx++;
          const id = ++this.popSeq;
          const v = this.traj.rewards[this.idx - 1];
          if (v !== 0 || this.idx === this.states.length - 1) {
            this.pops.push({ id, state: this.states[this.idx], text: v > 0 ? '+1' : v < 0 ? '−1' : '0', kind: v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero' });
            setTimeout(() => { this.pops = this.pops.filter(p => p.id !== id); }, 1050);
          }
          return true;
        }
        return false;
      },
      infStep() {
        this.infCount++;
        const id = ++this.popSeq;
        this.pops.push({ id, state: this.states[this.states.length - 1], text: '+1', kind: 'pos' });
        setTimeout(() => { this.pops = this.pops.filter(p => p.id !== id); }, 1050);
      },
      tick() {
        if (!this.done) { this.stepForward(); return; }
        if (this.infinite) this.infStep();
        else this.stop();
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => this.tick(), 950);
        if (this.done && this.infinite) this.infStep();
        else if (this.done) this.tick();
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() {
        this.stop(); this.idx = 0; this.infinite = false; this.infCount = 0; this.pops = [];
      },
      goInfinite() {
        this.infinite = true;
        if (!this.playing) { this.playing = true; if (!this.timer) this.timer = setInterval(() => this.tick(), 950); }
      },
      switchW(w) { this.reset(); this.which = w; },
    },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">轨迹播放器 · Trajectory player</span>
        <div class="seg">
          <button :class="{active: which==='T1'}" @click="switchW('T1')">策略 1 · return = 1</button>
          <button :class="{active: which==='T2'}" @click="switchW('T2')">策略 2 · return = 0</button>
        </div>
      </div>
      <div class="lab-body">
        <div class="lab-stage">
          <grid-board :size="3" :forbidden="[6,7]" :target="9" :start="states[0]"
                      :agent="states[Math.min(idx, states.length-1)]"
                      :traj-states="states"
                      :progress="idx / (states.length-1)"
                      :reward-pops="pops"/>
        </div>
        <div class="lab-side">
          <div class="play-ctl">
            <button class="btn primary" @click="play">{{ playing ? '⏸ 暂停 Pause' : '▶ 播放 Play' }}</button>
            <button class="btn" @click="stepForward()" :disabled="done">⏭ 一步 Step</button>
            <button class="btn ghost" @click="reset">↺ 重来 Reset</button>
            <button class="btn" @click="goInfinite" :disabled="infinite || !done" v-if="!infinite">♾ <span v-html="bi('到站继续 a5…','keep going with a5…')"></span></button>
            <span v-if="infinite" class="chip-t">continuing task ♾</span>
          </div>
          <div class="chain">
            <template v-for="n in chainNodes" :key="n.i">
              <span v-if="n.i>0" class="chain-arrow">
                <span class="a-act">a{{traj.actions[n.i-1]}}</span>
                <span>r={{traj.rewards[n.i-1]}}</span>
              </span>
              <span class="chain-node"
                    :class="{past: n.i < idx || (infinite && done), now: n.i===idx && !(infinite&&done), neg: n.r<0, pos: n.r>0}">
                <span class="cn-s">{{'s'+n.s}}</span>
                <span class="cn-r">{{ n.r==null ? 'start' : (n.r>0?'+':'')+n.r }}</span>
              </span>
            </template>
            <template v-if="infinite && done">
              <span class="chain-arrow"><span class="a-act">a5</span><span>r=+1</span></span>
              <span class="chain-node now"><span class="cn-s">s9</span><span class="cn-r">×{{infCount}}</span></span>
              <span class="chain-arrow" v-if="infCount>3"><span style="color:var(--gold);font-weight:800">→ ∞</span></span>
            </template>
          </div>
          <div class="tally">
            <span class="t-label" v-html="bi('无折扣回报', 'undiscounted return')"></span>
            <roll-num class="t-num" :class="{neg: tally<0}" :value="tally"></roll-num>
            <span v-if="infinite && infCount>3" class="t-inf">→ ∞ 发散！</span>
          </div>
          <div class="ctl-row" style="margin-top:14px">
            <span class="ctl-label">γ = <strong>{{gamma.toFixed(2)}}</strong></span>
            <input type="range" min="0.5" max="0.99" step="0.01" v-model.number="gamma"
                   :style="{width:'200px', '--fill': ((gamma-0.5)/0.49*100)+'%'}">
            <span class="ctl-label" style="color:var(--ink-3)" v-html="bi('拖动看折扣力度','drag to feel the discount')"></span>
          </div>
          <div class="tally" style="background:var(--accent-soft); color:var(--ink); border:1px solid #c8d8f6">
            <span class="t-label" style="color:var(--ink-2)" v-html="bi('折扣回报', 'discounted return')"></span>
            <roll-num class="t-num" :value="discTotal" style="color:var(--accent-deep)"></roll-num>
            <span v-if="infinite" class="t-gamma" style="color:var(--accent-deep)">
              = γ<sup>{{closedForm.k}}</sup>/(1−γ) = {{closedForm.num}}/{{closedForm.den}}
            </span>
            <span v-else class="t-gamma" style="color:var(--ink-3)" v-html="bi('（走到终点为止的部分和）', '(partial sum up to arrival)')"></span>
          </div>
          <div style="display:flex; align-items:flex-end; gap:4px; height:76px; margin-top:12px; padding:8px 10px; background:var(--bg-soft); border-radius:10px; border:1px solid var(--line)">
            <div v-for="(w,k) in weightBars" :key="k" style="flex:1; text-align:center">
              <div :style="{height: (w*46)+'px', background: k===0 ? 'var(--accent)' : 'rgba(62,111,224,'+(0.25+w*0.6)+')', borderRadius:'4px 4px 0 0', transition:'height .3s cubic-bezier(.2,0,0,1)'}"></div>
              <div style="font:700 9px var(--mono); color:var(--ink-3); margin-top:3px">γ<sup>{{k}}</sup></div>
            </div>
          </div>
          <p class="bi duo" style="font-size:12.5px;color:var(--ink-3);margin:8px 0 0" v-html="bi(
            '每一根柱子 = 未来第 k 步的奖励在今天的“汇率”。γ 越小，衰减越快——这就是“近视”。',
            'Each bar = today’s exchange rate of a reward k steps ahead. Smaller γ, faster decay — that is what “short-sighted” means.')"></p>
        </div>
      </div>
    </div>`,
    setup() { return { D, bi }; },
  };

  /* ═════════════ §1.7 MDP 循环 ═════════════ */
  const MdpLab = {
    name: 'MdpLab',
    data: () => ({ phase: 0, playing: false, timer: null }),
    phases: [
      { zh: '智能体按当前策略选动作：a_t ~ π(·|s_t)', en: 'The agent picks an action from its policy: a_t ~ π(·|s_t)' },
      { zh: '环境按转移概率演化：s_{t+1} ~ p(·|s_t, a_t)', en: 'The environment evolves: s_{t+1} ~ p(·|s_t, a_t)' },
      { zh: '环境产生奖励：r_{t+1} ~ p(·|s_t, a_t)', en: 'The environment emits a reward: r_{t+1} ~ p(·|s_t, a_t)' },
      { zh: '智能体观测到 (s_{t+1}, r_{t+1})，时间推进 t ← t+1，循环继续', en: 'The agent observes (s_{t+1}, r_{t+1}); t ← t+1; the loop continues' },
    ],
    methods: {
      tick() { this.phase = (this.phase + 1) % 4; },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => this.tick(), 1250);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      stepOnce() { this.stop(); this.tick(); },
    },
    unmounted() { this.stop(); },
    setup() { return { bi }; },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">闭环动画 · The closed loop</span>
        <div class="seg">
          <button :class="{active: playing}" @click="play">{{ playing ? '⏸ 暂停' : '▶ 循环播放 Loop' }}</button>
          <button @click="stepOnce">⏭ 单步 Step</button>
        </div>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="flex:1.2 1 380px; min-width:300px">
          <svg class="mdp-svg" viewBox="0 0 640 250">
            <path class="flow-path act" :class="{'flow-dash': phase===0}"
                  d="M 215 100 C 290 42, 350 42, 425 100" :opacity="phase===0 ? 1 : .38"/>
            <path class="flow-path obs" :class="{'flow-dash': phase===1 || phase===2}"
                  d="M 425 155 C 350 213, 290 213, 215 155" :opacity="(phase===1||phase===2) ? 1 : .38"/>
            <polygon points="425,100 407,88 411,104" fill="var(--green)" :opacity="phase===0 ? 1 : .38"/>
            <polygon points="215,155 233,143 237,159" fill="var(--accent)" :opacity="(phase===1||phase===2) ? 1 : .38"/>
            <text x="320" y="52" text-anchor="middle" class="flow-tag" fill="var(--green)">action a<tspan baseline-shift="sub" font-size="9">t</tspan> = π(a|s<tspan baseline-shift="sub" font-size="9">t</tspan>)</text>
            <text x="320" y="232" text-anchor="middle" class="flow-tag" fill="var(--accent)">state s<tspan baseline-shift="sub" font-size="9">t+1</tspan> , reward r<tspan baseline-shift="sub" font-size="9">t+1</tspan></text>

            <rect class="mdp-box agent" x="30" y="78" width="185" height="98" rx="16"
                  :style="{filter: phase===0||phase===3 ? 'drop-shadow(0 0 12px rgba(62,111,224,.45))' : 'none'}"/>
            <text x="122" y="122" text-anchor="middle" class="mdp-label">🤖 Agent</text>
            <text x="122" y="146" text-anchor="middle" class="mdp-sub">决策者 decision-maker</text>

            <rect class="mdp-box env" x="425" y="78" width="185" height="98" rx="16"
                  :style="{filter: phase===1||phase===2 ? 'drop-shadow(0 0 12px rgba(237,177,32,.5))' : 'none'}"/>
            <text x="517" y="122" text-anchor="middle" class="mdp-label">🌍 Environment</text>
            <text x="517" y="146" text-anchor="middle" class="mdp-sub">grid world 网格世界</text>
          </svg>
        </div>
        <div class="lab-side">
          <div v-for="(p,i) in $options.phases" :key="i" class="mdp-phase" :class="{active: phase===i}">
            <span class="ph-no">{{ i+1 }}</span>
            <p class="bi duo" v-html="bi(p.zh, p.en)"></p>
          </div>
          <p class="bi duo" style="font-size:12.5px;color:var(--ink-3);margin:4px 0 0" v-html="bi(
            '智能体之外的一切都是环境。动作向下行进，状态与奖励向上回流——强化学习的全部故事都发生在这条环上。',
            'Everything outside the agent is the environment. Actions flow out; states and rewards flow back — the entire RL story lives on this loop.')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ═════════════ §1.7 马尔可夫链实验台 ═════════════ */
  const MpLab = {
    name: 'MpLab',
    components: { RollNum },
    data: () => ({
      cur: 1, token: { x: 0, y: 0 }, history: [1], auto: false, timer: null, edgeHot: null, moving: false,
    }),
    computed: {
      nodes() {
        return Array.from({ length: 9 }, (_, i) => {
          const s = i + 1;
          const { x, y } = center(s, 3);
          return { s, x: 60 + (x - PAD) * 0.9, y: 34 + (y - PAD) * 0.82 };
        });
      },
      nodePos() {
        const m = {};
        this.nodes.forEach(n => { m[n.s] = n; });
        return m;
      },
      edges() {
        const E = [[1, 2, .5], [1, 4, .5], [2, 5, 1], [3, 2, 1], [4, 5, 1], [5, 8, 1], [6, 9, 1], [7, 8, 1], [8, 9, 1], [9, 9, 1]];
        return E.map(([a, b, p]) => {
          const A = this.nodePos[a], B = this.nodePos[b];
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          const dx = B.x - A.x, dy = B.y - A.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len, ny = dx / len;
          const bend = (a === 9 && b === 9) ? 0 : 18;
          const cx = mx + nx * bend, cy = my + ny * bend;
          const path = (a === 9 && b === 9)
            ? `M ${A.x} ${A.y - 13} C ${A.x + 34} ${A.y - 40}, ${A.x + 44} ${A.y + 14}, ${A.x + 4} ${A.y - 8}`
            : `M ${A.x} ${A.y} Q ${cx} ${cy} ${B.x} ${B.y}`;
          const self9 = (a === 9 && b === 9);
          return { a, b, p, path, lx: self9 ? A.x + 46 : cx, ly: self9 ? A.y - 30 : cy, key: a + '-' + b };
        });
      },
    },
    methods: {
      walkOnce() {
        if (this.moving) return;
        const row = D.PS[this.cur - 1];
        let x = Math.random(), acc = 0, pick = 5;
        for (let i = 0; i < 5; i++) { acc += row[i]; if (x <= acc) { pick = i + 1; break; } }
        const next = stepOnce(this.cur, pick, { size: 3, forbidden: [6, 7], target: 9, mode: 'book' }).next;
        this.edgeHot = this.cur + '-' + next;
        const P = this.nodePos[next];
        this.moving = true;
        this.token = { x: P.x, y: P.y };
        setTimeout(() => {
          this.cur = next;
          this.history.push(next);
          if (this.history.length > 14) this.history.shift();
          this.moving = false;
        }, 480);
      },
      toggleAuto() {
        this.auto = !this.auto;
        if (this.auto) this.timer = setInterval(() => this.walkOnce(), 700);
        else if (this.timer) { clearInterval(this.timer); this.timer = null; }
      },
      reset() {
        this.auto = false;
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        this.cur = 1; this.history = [1]; this.edgeHot = null;
        const P = this.nodePos[1]; this.token = { x: P.x, y: P.y };
      },
    },
    mounted() { const P = this.nodePos[1]; this.token = { x: P.x, y: P.y }; },
    unmounted() { if (this.timer) clearInterval(this.timer); },
    setup() { return { bi }; },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">策略固定 → 马尔可夫链 · Fix π → Markov chain</span>
        <div class="seg">
          <button :class="{active: auto}" @click="toggleAuto">{{ auto ? '⏸ 停' : '▶ 自动游走 Auto' }}</button>
          <button @click="walkOnce" :disabled="moving">🎲 走一步 Walk</button>
          <button class="ghost" @click="reset">↺</button>
        </div>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="flex:1.1 1 360px">
          <svg viewBox="0 0 330 300" style="width:100%;max-width:380px;display:block">
            <defs>
              <marker id="mparrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/>
              </marker>
            </defs>
            <path v-for="e in edges" :key="e.key" class="mp-edge" :class="{hot: edgeHot===e.key}"
                  :d="e.path" marker-end="url(#mparrow)"/>
            <text v-for="e in edges" :key="'p'+e.key" class="mp-prob" :x="e.lx" :y="e.ly" text-anchor="middle">
              {{ e.p===1 ? 'p=1' : 'p=0.5' }}</text>
            <g v-for="n in nodes" :key="n.s" class="mp-node" :class="{hot: cur===n.s}">
              <circle :cx="n.x" :cy="n.y" r="17"/>
              <text :x="n.x" :y="n.y+5">s{{n.s}}</text>
            </g>
            <circle cx="0" cy="0" r="6.5" fill="var(--red)"
                    :style="{transform: 'translate('+token.x+'px,'+token.y+'px)', transition:'transform .45s cubic-bezier(.2,0,0,1)'}"/>
          </svg>
        </div>
        <div class="lab-side">
          <p class="bi duo" style="font-size:14px;margin-top:0" v-html="bi(
            '把 Table 1.2 的随机策略“焊死”在环境上，(s,a) 的选择不再属于智能体——世界退化成一条<strong>马尔可夫链</strong>：只剩状态和转移概率。粒子每步按概率跳到下一个状态。',
            'Welding the stochastic policy of Table 1.2 onto the world removes the choice of (s,a) from the agent — the world degenerates into a <strong>Markov chain</strong>: only states and transition probabilities remain. The particle hops by probability each step.')"></p>
          <div class="chain">
            <span v-for="(h,i) in history" :key="i" class="chain-node" :class="{now: i===history.length-1}" style="min-width:40px">
              <span class="cn-s">{{'s'+h}}</span>
            </span>
          </div>
          <p class="bi duo" style="font-size:12.5px;color:var(--ink-3)" v-html="bi(
            '走足够多步，粒子会频繁光顾 s9——因为策略把 s6/s8 都导向目标，而 s9 的 a5 让它困在原地收 +1。',
            'Given enough steps the particle lingers around s9 — the policy routes both s6 and s8 into the target, where a5 traps it collecting +1.')"></p>
        </div>
      </div>
    </div>`,
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

  const TypeChips = {
    name: 'TypeChips',
    types: [
      { t: 'tuple', d: { zh: '不可变坐标 (x, y)——状态与动作都用它', en: 'immutable (x, y) — states and actions' } },
      { t: 'np.ndarray', d: { zh: '向量加法算新坐标；策略矩阵 (16,5)', en: 'vectorised coords; policy matrix (16,5)' } },
      { t: 'Namespace', d: { zh: 'argparse 产出的配置对象 args', en: 'the argparse config object args' } },
      { t: 'GridWorld', d: { zh: '环境类：图纸 → env 实例', en: 'the env class: blueprint → instance' } },
      { t: 'Figure / Axes', d: { zh: 'matplotlib 画板与画布区', en: 'matplotlib board & drawing area' } },
      { t: 'Rectangle / FancyArrow / Circle', d: { zh: 'patch 图形件：格子与箭头', en: 'patches: cells and arrows' } },
      { t: 'Line2D', d: { zh: '星标与轨迹线句柄，set_data 更新', en: 'star & trajectory handles, updated via set_data' } },
      { t: 'bool', d: { zh: '_is_done 的返回：只报告不关机', en: '_is_done\'s return: reports, never stops' } },
    ],
    template: `
    <div class="type-chips">
      <span v-for="(x,i) in $options.types" :key="i" class="type-chip" :title="bi(x.d.zh, x.d.en).replace(/<[^>]*>/g,'')">{{ x.t }}</span>
    </div>`,
    setup() { return { bi }; },
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
      <div v-for="(c,i) in cards" :key="i" class="qa-card" :class="{flipped: !!flipped[i]}" @click="flip(i)">
        <div class="qa-inner">
          <div class="qa-face">
            <span class="qa-tag">{{ c.tag }}</span>
            <p class="bi duo" style="font-weight:700; font-size:15.5px" v-html="bi(c.q.zh, c.q.en)"></p>
            <span class="qa-hint" v-html="bi('点击翻转看答案 →','click to flip →')"></span>
          </div>
          <div class="qa-face back">
            <span class="qa-tag" style="background:#fff">A</span>
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
        <div class="hero-stat"><b>10</b><span v-html="bi('讲全书覆盖','lectures, one visual course')"></span></div>
        <div class="hero-stat"><b>20+</b><span v-html="bi('个交互实验台','interactive labs')"></span></div>
        <div class="hero-stat"><b>3×3 + 4×4</b><span v-html="bi('书世界 + 作业世界','book world + assignment world')"></span></div>
        <div class="hero-stat"><b>2</b><span v-html="bi('套语言随时切换','languages, one click apart')"></span></div>
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
        const map = {
          1: 'grid-world', 2: 'l2-bellman', 3: 'l3-optimality', 4: 'l4-vi', 5: 'l5-mc',
          6: 'l6-rm', 7: 'l7-td0', 8: 'l8-approx', 9: 'l9-pg', 10: 'l10-ac',
        };
        return map;
      },
    },
    template: `
    <div class="course-map-card">
      <h3 class="sub" style="margin-top:0"><span v-html="bi('课程索引：逐讲进入','Lecture index: enter any lesson')"></span></h3>
      <div class="lx-grid">
        <button v-for="l in lectures" :key="l.no" class="lx-card" :class="l.done ? 'done' : 'pending'"
                @click="$emit('go', firstId[l.no])">
          <span class="lx-no">LESSON {{ l.no }} {{ l.done ? '· ✓ 已完成 done' : '· Soon' }}</span>
          <span class="lx-zh">{{ l.zh }}</span>
          <span class="lx-en">{{ l.en }}</span>
          <span class="lx-go" v-if="l.done" v-html="bi('进入本课 →','Enter →')"></span>
        </button>
      </div>
    </div>`,
    setup() { return { bi }; },
  };

  const CourseMap = {
    name: 'CourseMap',
    template: `
    <div class="course-map-card">
      <h3 class="sub" style="margin-top:0"><span v-html="bi('全书地图：我们在这里','The map of the book: where we are')"></span></h3>
      <div class="map-flow">
        <div class="map-row">
          <div class="map-node hot-node" style="flex:2 1 260px">
            <span class="mn-no">L1 · HERE</span>
            <span class="mn-t" v-html="bi('第 1 章 基本概念','Ch.1 Basic Concepts')"></span>
            <span class="mn-e">grid world → MDP（本课 / this lesson）</span>
          </div>
        </div>
        <div class="map-arrow">↓</div>
        <div class="map-row">
          <div class="map-node foundation">
            <span class="mn-no">CH 2</span>
            <span class="mn-t" v-html="bi('状态价值 & Bellman 方程','State values & Bellman equation')"></span>
            <span class="mn-e">fundamental tool</span>
          </div>
          <div class="map-node foundation">
            <span class="mn-no">CH 3</span>
            <span class="mn-t" v-html="bi('Bellman 最优方程','Bellman optimality equation')"></span>
            <span class="mn-e">fundamental tool</span>
          </div>
        </div>
        <div class="map-arrow">↓</div>
        <div class="map-row">
          <div class="map-node algo">
            <span class="mn-no">CH 4</span>
            <span class="mn-t" v-html="bi('值迭代 & 策略迭代','Value iteration & policy iteration')"></span>
            <span class="mn-e">with model 有模型</span>
          </div>
          <div class="map-node algo">
            <span class="mn-no">CH 5–8</span>
            <span class="mn-t" v-html="bi('MC / TD / 值函数近似','MC / TD / value function approx.')"></span>
            <span class="mn-e">without model · value-based</span>
          </div>
          <div class="map-node algo">
            <span class="mn-no">CH 9–10</span>
            <span class="mn-t" v-html="bi('策略梯度 / Actor-Critic','Policy gradient / Actor-Critic')"></span>
            <span class="mn-e">policy-based · plus</span>
          </div>
        </div>
        <div class="map-row">
          <div class="map-node tool" style="flex:1 1 130px"><span class="mn-t" style="font-size:12.5px" v-html="bi('表格表示 tabular','tabular')"></span><span class="mn-e">Ch 1–6</span></div>
          <div class="map-node tool" style="flex:1 1 130px"><span class="mn-t" style="font-size:12.5px" v-html="bi('函数表示 function approx.','function approx.')"></span><span class="mn-e">Ch 8–10</span></div>
        </div>
      </div>
      <div class="map-caption">
        <span><i style="background:linear-gradient(135deg,var(--accent),var(--violet))"></i><span v-html="bi('本课','this lesson')"></span></span>
        <span><i style="background:var(--accent-soft);border:1px solid #b7ccf4"></i><span v-html="bi('基础工具','fundamental tools')"></span></span>
        <span><i style="background:var(--green-soft);border:1px solid #cfe6ab"></i><span v-html="bi('算法方法','algorithms')"></span></span>
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
  window.RLV = { stepOnce, s2rc, rc2s, center, bi, TYPE_LABEL, hlPy, CELL, PAD, STAR };

  window.COMPONENTS = {
    GridBoard, RollNum, ActionBtn, Dist,
    'grid-intro-lab': GridIntroLab,
    'state-action-lab': StateActionLab,
    'transition-lab': TransitionLab,
    'policy-lab': PolicyLab,
    'reward-lab': RewardLab,
    'trajectory-lab': TrajectoryLab,
    'mdp-lab': MdpLab,
    'mp-lab': MpLab,
    'concept-chain': ConceptChain,
    'code-lab': CodeLab,
    'type-chips': TypeChips,
    'reasoning-lab': ReasoningLab,
    'qa-lab': QaLab,
    'home-hero': HomeHero,
    'lecture-index': LectureIndex,
    'course-map': CourseMap,
    'how-to-use': HowToUse,
  };
})();
