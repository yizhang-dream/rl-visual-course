/* ═══════════════════════════════════════════════════════════
   L1 组件：网格世界 / 状态-动作 / 转移 / 策略 / 奖励 / 轨迹 / MDP 循环 /
   马尔可夫链 / 代码类型卡，以及仅这些实验台用到的通用小组件
   （RollNum / ActionBtn / Dist）。GridBoard 与工具集在 components.js。
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { stepOnce, s2rc, center, bi, TYPE_LABEL, PAD } = RLV;
  const D = window.DATA;
  const GB = () => window.COMPONENTS.GridBoard;

  /* ═════════════ 通用小组件 ═════════════ */
  const RollNum = {
    name: 'RollNum',
    props: { value: { type: Number, default: 0 }, cls: { type: String, default: '' } },
    data: () => ({ disp: 0 }),
    watch: {
      // 数字滚动（原第三方补间动画 → rAF 等效：450ms power2.out / cubic out）。
      // _tw 令牌保证连续变化时旧 tween 自动作废，避免两条链打架。
      value(nv, ov) {
        if (this._tw) this._tw.dead = true;
        const tw = { dead: false };
        this._tw = tw;
        const from = Number(ov) || 0, delta = (Number(nv) || 0) - from;
        const t0 = performance.now(), dur = 450;
        const tick = (now) => {
          if (tw.dead) return;
          const t = Math.min(1, (now - t0) / dur);
          this.disp = from + delta * (1 - Math.pow(1 - t, 3));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
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
    components: { GridBoard: GB() },
    data: () => ({ world: 3, popSeq: 0, pops: [] }),
    computed: {
      cfg() {
        return this.world === 3
          ? { size: 3, forbidden: [6, 7], target: 9, start: 1 }
          : { size: 4, forbidden: [8, 10], target: 12, start: 1 };
      },
      infoLines() {
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
            <span class="lg"><i class="sw" style="background:var(--cell-alt);border:1px solid var(--line-strong)"></i><span v-html="bi('白色 · 可进入','white · accessible')"></span></span>
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
    components: { GridBoard: GB(), ActionBtn },
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
    components: { GridBoard: GB(), Dist },
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
          let val;
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
    components: { GridBoard: GB(), Dist },
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
    components: { GridBoard: GB() },
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
    components: { GridBoard: GB(), RollNum },
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
                   :aria-label="$root.lang === 'en' ? 'discount factor gamma' : '折扣因子 γ'"
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


  /* ═════════════ 注册 ═════════════ */
  window.COMPONENTS.RollNum = RollNum;
  window.COMPONENTS.ActionBtn = ActionBtn;
  window.COMPONENTS.Dist = Dist;
  window.COMPONENTS['grid-intro-lab'] = GridIntroLab;
  window.COMPONENTS['state-action-lab'] = StateActionLab;
  window.COMPONENTS['transition-lab'] = TransitionLab;
  window.COMPONENTS['policy-lab'] = PolicyLab;
  window.COMPONENTS['reward-lab'] = RewardLab;
  window.COMPONENTS['trajectory-lab'] = TrajectoryLab;
  window.COMPONENTS['mdp-lab'] = MdpLab;
  window.COMPONENTS['mp-lab'] = MpLab;
  window.COMPONENTS['type-chips'] = TypeChips;
})();
