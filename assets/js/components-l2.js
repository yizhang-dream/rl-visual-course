/* ═══════════════════════════════════════════════════════════
   L2 组件：三条策略比较 / 圆环自举 / 2×2 手算 / 5×5 迭代评估 / q 值条
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { stepOnce, bi } = RLV;

  /* ---------- §2.1 三条策略 ---------- */
  const ThreePolicies = {
    name: 'ThreePolicies',
    components: { GridBoard: window.COMPONENTS.GridBoard },
    data: () => ({ which: 'A', gamma: 0.9 }),
    computed: {
      cfg() { return { size: 2, forbidden: [2], target: 4, mode: 'book' }; },
      policy() {
        const base = { 1: null, 2: 3, 3: 2, 4: 5 };  // s2↓(进目标) s3→(进目标) s4 原地
        const s1 = { A: 3, B: 2, C: null }[this.which];  // A向下避开禁区 / B向右闯禁区
        const M = [];
        for (let s = 1; s <= 4; s++) {
          const row = [0, 0, 0, 0, 0];
          if (s === 1) {
            if (s1) row[s1 - 1] = 1; else { row[1] = .5; row[2] = .5; }
          } else row[base[s] - 1] = 1;
          M.push(row);
        }
        return M;
      },
      returns() {
        const g = this.gamma, tail = g / (1 - g);
        return { A: tail, B: -1 + tail, C: -0.5 + tail };
      },
      maxAbs() { return Math.max(...Object.values(this.returns).map(Math.abs)); },
    },
    methods: {
      bi, fmtV(v) { return (v >= 0 ? '' : '') + v.toFixed(2); },
      barW(v) { return Math.max(2, Math.abs(v) / this.maxAbs * 100); },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">三条策略对赌 · Three policies, one start</span>
        <div class="seg">
          <button :class="{active: which==='A'}" @click="which='A'">A · <span v-html="bi('向下避开','down')"></span></button>
          <button :class="{active: which==='B'}" @click="which='B'">B · <span v-html="bi('向右闯禁区','right')"></span></button>
          <button :class="{active: which==='C'}" @click="which='C'">C · 0.5/0.5</button>
        </div>
        <span class="ctl-label">γ = <strong>{{ gamma.toFixed(2) }}</strong></span>
        <input type="range" min="0.5" max="0.95" step="0.01" v-model.number="gamma"
               :style="{width:'150px', '--fill': ((gamma-0.5)/0.45*100)+'%'}">
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:270px">
          <grid-board :size="2" :forbidden="[2]" :target="4" :start="1"
                      :policy="policy" :agent="1"/>
        </div>
        <div class="lab-side">
          <div class="chain" style="margin-top:0">
            <span v-for="r in ['A','B','C']" :key="r" class="chain-node"
                  :class="{now: which===r}" style="min-width:74px">
              <span class="cn-s">{{ r }}</span>
              <span class="cn-r">{{ returns[r].toFixed(2) }}</span>
            </span>
          </div>
          <div class="dist" style="margin-top:6px">
            <div v-for="r in ['A','B','C']" :key="r" class="dist-row">
              <span class="dist-name">{{ r }}</span>
              <div class="dist-bar-track" style="height:19px">
                <div class="dist-bar" :class="{hot: which===r, 'neg-bar': returns[r]<0}"
                     :style="{width: barW(returns[r])+'%'}"></div>
              </div>
              <span class="dist-val">{{ returns[r].toFixed(2) }}</span>
            </div>
          </div>
          <div class="callout key" style="margin:14px 0 0">
            <div class="callout-icon">🧮</div>
            <div class="callout-body"><p class="bi duo" style="font-size:13.5px" v-html="bi(
              'A: 0+γ·1+γ²+… = γ/(1−γ)；B: −1+γ·1+… = −1+γ/(1−γ)；C: 0.5·B + 0.5·A = −0.5+γ/(1−γ)。对任何 γ 都有 A > C > B——数学第一次和直觉严丝合缝。',
              'A: 0+γ·1+γ²+… = γ/(1−γ); B: −1+γ·1+… = −1+γ/(1−γ); C: 0.5·B + 0.5·A = −0.5+γ/(1−γ). For every γ: A &gt; C &gt; B — mathematics matches intuition perfectly for the first time.')"></p></div>
          </div>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §2.2 圆环自举 ---------- */
  const RingBoot = {
    name: 'RingBoot',
    data: () => ({ rs: [1, 2, 3, 4], gamma: 0.9, hot: 0, lock: false, timer: null }),
    computed: {
      g() { return this.gamma; },
      values() {
        const { g, rs } = this;
        // v_i = (r_i + g r_{i+1} + g² r_{i+2} + g³ r_{i+3}) / (1 - g⁴)
        const g4 = Math.pow(g, 4);
        return rs.map((_, i) => {
          let acc = 0;
          for (let k = 0; k < 4; k++) acc += Math.pow(g, k) * rs[(i + k) % 4];
          return acc / (1 - g4);
        });
      },
    },
    mounted() {
      this.timer = setInterval(() => { if (!this.lock) this.hot = (this.hot + 1) % 4; }, 1300);
    },
    unmounted() { if (this.timer) clearInterval(this.timer); },
    setup() { return { bi }; },
    methods: {
      pos(i) {
        const ang = [-90, 0, 90, 180][i] * Math.PI / 180;
        return { x: 155 + 105 * Math.cos(ang), y: 148 + 105 * Math.sin(ang) };
      },
      enter(i) { this.lock = true; this.hot = i; },
      leave() { this.lock = false; },
      ringEdge(i) {
        const a = this.pos(i), b = this.pos((i + 1) % 4);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        return `M ${a.x} ${a.y} Q ${mx + nx * 34} ${my + ny * 34} ${b.x} ${b.y}`;
      },
      midp(i) {
        const a = this.pos(i), b = this.pos((i + 1) % 4);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        return { x: mx + (-dy / len) * 34, y: my + (dx / len) * 34 };
      },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">四状态圆环 · 改奖励看价值 · The ring — tune the rewards</span>
        <div class="ctl-row" style="margin:0">
          <label v-for="(r,i) in rs" :key="i" class="ctl-label" style="gap:4px">
            r{{ i+1 }} <input type="number" step="0.5" v-model.number="rs[i]"
              style="width:64px; font:700 13px var(--mono); padding:4px 6px; border:1px solid var(--line-strong); border-radius:8px">
          </label>
          <span class="ctl-label">γ = <strong>{{ gamma.toFixed(2) }}</strong></span>
          <input type="range" min="0.3" max="0.95" step="0.01" v-model.number="gamma"
                 :style="{width:'130px', '--fill': ((gamma-0.3)/0.65*100)+'%'}">
        </div>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="max-width:320px">
          <svg viewBox="0 0 310 300" style="width:100%;display:block">
            <defs><marker id="ring-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8fa1b3"/></marker></defs>
            <path v-for="i in 4" :key="'e'+i"
                  :d="ringEdge(i-1)" fill="none" stroke="#8fa1b3" stroke-width="2" marker-end="url(#ring-ar)"/>
            <text v-for="i in 4" :key="'l'+i" :x="midp(i-1).x" :y="midp(i-1).y - 7"
                  text-anchor="middle" style="font:700 13px var(--mono)" fill="var(--gold)">r{{ i }}</text>
            <g v-for="i in 4" :key="'n'+i" @mouseenter="enter(i-1)" @mouseleave="leave" style="cursor:pointer">
              <circle :cx="pos(i-1).x" :cy="pos(i-1).y" r="27"
                      :fill="hot===i-1 ? 'var(--accent)' : '#fff'" stroke="var(--accent)" stroke-width="2.4"
                      style="transition:all .25s cubic-bezier(.2,0,0,1)"/>
              <text :x="pos(i-1).x" :y="pos(i-1).y - 3" text-anchor="middle"
                    :fill="hot===i-1 ? '#fff' : 'var(--ink)'" style="font:700 13px var(--mono)">s{{ i }}</text>
              <text :x="pos(i-1).x" :y="pos(i-1).y + 13" text-anchor="middle"
                    :fill="hot===i-1 ? '#fff' : 'var(--accent-deep)'" style="font:700 12px var(--mono)">
                {{ values[i-1].toFixed(2) }}</text>
            </g>
          </svg>
        </div>
        <div class="lab-side">
          <div class="formula-card" style="margin:0 0 12px; font-size:16px" :key="hot">
            v<sub>{{ hot+1 }}</sub> = r<sub>{{ hot+1 }}</sub> + γ·v<sub>{{ (hot+1)%4+1 }}</sub>
            &nbsp;=&nbsp; <strong style="color:var(--accent-deep)">{{ values[hot].toFixed(3) }}</strong>
          </div>
          <p class="bi duo" style="font-size:13.5px" v-html="bi(
            '高亮状态的自举等式。四个状态各写一条，联立起来就是 4×4 的小型 Bellman 方程组；解析解 v_i = (r_i + γr_{i+1} + γ²r_{i+2} + γ³r_{i+3})/(1−γ⁴)。试着把 r 全改成 1：v = 1/(1−γ)，和 L1 的结论接上了。',
            'The bootstrap identity of the highlighted state. One such line per state; four lines make a tiny 4×4 Bellman system with closed form v_i = (r_i + γr_{i+1} + γ²r_{i+2} + γ³r_{i+3})/(1−γ⁴). Set all r = 1 and you get v = 1/(1−γ) — L1’s result reappears.')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §2.5 2×2 手算 ---------- */
  const ChainSolve = {
    name: 'ChainSolve',
    components: { GridBoard: window.COMPONENTS.GridBoard },
    data: () => ({ mode: 'det', gamma: 0.9 }),
    computed: {
      policy() {
        const M = [];
        const s1 = this.mode === 'det' ? [0, 0, 1, 0, 0] : [0, .5, .5, 0, 0];
        M.push(s1);
        M.push([0, 0, 1, 0, 0]);   // s2 ↓ 进目标
        M.push([0, 1, 0, 0, 0]);   // s3 → 进目标
        M.push([0, 0, 0, 0, 1]);   // s4 原地
        return M;
      },
      vals() {
        const g = this.gamma;
        const v4 = 1 / (1 - g);
        const v2 = 1 + g * v4, v3 = 1 + g * v4;
        const v1 = this.mode === 'det'
          ? g * v3
          : 0.5 * (0 + g * v3) + 0.5 * (-1 + g * v2);
        return [v1, v2, v3, v4];
      },
    },
    methods: { bi },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">亲手解方程 · Solve it by hand</span>
        <div class="seg">
          <button :class="{active: mode==='det'}" @click="mode='det'"><span v-html="bi('例1 确定性','Ex.1 deterministic')"></span></button>
          <button :class="{active: mode==='stoch'}" @click="mode='stoch'"><span v-html="bi('例2 随机 s1','Ex.2 stochastic s1')"></span></button>
        </div>
        <span class="ctl-label">γ = <strong>{{ gamma.toFixed(2) }}</strong></span>
        <input type="range" min="0.5" max="0.95" step="0.01" v-model.number="gamma"
               :style="{width:'150px', '--fill': ((gamma-0.5)/0.45*100)+'%'}">
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:270px">
          <grid-board :size="2" :forbidden="[2]" :target="4" :start="1"
                      :policy="policy" :values="vals.map(v=>+v.toFixed(1))"/>
        </div>
        <div class="lab-side">
          <div class="coord-math" style="gap:10px">
            <div class="cm-row">v(s<sub>4</sub>) = 1 + γ·v(s<sub>4</sub>) ⟹ <span class="cm-out">{{ vals[3].toFixed(2) }}</span></div>
            <div class="cm-row">v(s<sub>3</sub>) = 1 + γ·v(s<sub>4</sub>) = <span class="cm-out">{{ vals[2].toFixed(2) }}</span></div>
            <div class="cm-row">v(s<sub>2</sub>) = 1 + γ·v(s<sub>4</sub>) = <span class="cm-out">{{ vals[1].toFixed(2) }}</span></div>
            <div class="cm-row" v-if="mode==='det'">v(s<sub>1</sub>) = 0 + γ·v(s<sub>3</sub>) = <span class="cm-out">{{ vals[0].toFixed(2) }}</span></div>
            <div class="cm-row" v-else>v(s<sub>1</sub>) = 0.5[0+γv(s<sub>3</sub>)] + 0.5[−1+γv(s<sub>2</sub>)] = <span class="cm-out">{{ vals[0].toFixed(2) }}</span></div>
          </div>
          <div class="callout key" style="margin:12px 0 0">
            <div class="callout-icon">⚖️</div>
            <div class="callout-body"><p class="bi duo" style="font-size:13.5px" v-html="bi(
              '逐格比较：v(确定) ≥ v(随机)，差距全部来自 s1 那枚 0.5 的硬币。γ 拉到 0.5 再拉到 0.95，看看差距被放大还是吞掉。',
              'Cell by cell: v(deterministic) ≥ v(stochastic); the gap comes entirely from the 0.5 coin at s1. Drag γ from 0.5 to 0.95 and watch the gap widen or vanish.')"></p></div>
          </div>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §2.7 5×5 迭代策略评估 ---------- */
  function arrowsToMatrix(arrows) {   // 25 个动作 id（1..5，书本动作序）→ 25×5 矩阵
    return arrows.map(a => { const r = [0, 0, 0, 0, 0]; r[a - 1] = 1; return r; });
  }
  const GOOD1 = [
    2, 2, 2, 3, 3,
    1, 1, 2, 3, 3,
    1, 4, 3, 2, 3,
    1, 2, 5, 2, 3,
    1, 2, 1, 4, 4,
  ];
  const GOOD2 = GOOD1.map((a, i) => (i === 3 ? 2 : i === 8 ? 2 : a));  // (0,3),(1,3) 换成 →
  const BAD1 = new Array(25).fill(2);                                   // 全部向右
  const BAD2 = [
    2, 4, 4, 1, 1,
    3, 5, 2, 3, 2,
    4, 2, 3, 4, 5,
    5, 3, 1, 1, 2,
    5, 2, 5, 2, 5,
  ];
  const IterEval = {
    name: 'IterEval',
    components: { GridBoard: window.COMPONENTS.GridBoard },
    data: () => ({
      preset: 'good1', k: 0, delta: null, playing: false, timer: null,
      v: new Array(25).fill(0),
    }),
    computed: {
      cfg() { return { size: 5, forbidden: [7, 8, 13, 17, 19, 22], target: 18, mode: 'book' }; },
      matrices() {
        return { good1: arrowsToMatrix(GOOD1), good2: arrowsToMatrix(GOOD2), bad1: arrowsToMatrix(BAD1), bad2: arrowsToMatrix(BAD2) };
      },
      policy() { return this.matrices[this.preset]; },
      presetName() {
        return {
          good1: bi('好策略 1（书 Figure 2.7a）', 'Good policy 1 (book Fig. 2.7a)'),
          good2: bi('好策略 2（只改两格箭头）', 'Good policy 2 (two arrows swapped)'),
          bad1: bi('坏策略 1：全一向右撞墙', 'Bad policy 1: always right, into the wall'),
          bad2: bi('坏策略 2：乱指一气', 'Bad policy 2: pointing everywhere'),
        }[this.preset];
      },
    },
    methods: {
      sweep() {
        const { size, forbidden, target } = this.cfg;
        const v = this.v, M = this.policy, vNew = new Array(25).fill(0);
        for (let s = 1; s <= 25; s++) {
          let q = 0;
          for (let a = 1; a <= 5; a++) {
            const pa = M[s - 1][a - 1];
            if (!pa) continue;
            const res = stepOnce(s, a, { size, forbidden, target, mode: 'book' });
            q += pa * (res.reward + 0.9 * v[res.next - 1]);
          }
          vNew[s - 1] = q;
        }
        this.delta = Math.max(...vNew.map((x, i) => Math.abs(x - v[i])));
        this.v = vNew;
        this.k++;
      },
      play() {
        if (this.playing) { this.playing = false; clearInterval(this.timer); this.timer = null; return; }
        this.playing = true;
        this.timer = setInterval(() => { if (this.k >= 120) this.play(); else this.sweep(); }, 160);
      },
      reset() { this.playing = false; if (this.timer) clearInterval(this.timer); this.timer = null; this.v = new Array(25).fill(0); this.k = 0; this.delta = null; },
      switchPreset(p) { this.preset = p; this.reset(); },
    },
    unmounted() { if (this.timer) clearInterval(this.timer); },
    setup() { return { bi }; },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">迭代策略评估 · v<sub>k+1</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub> · 5×5 书本世界</span>
        <div class="seg">
          <button :class="{active: preset==='good1'}" @click="switchPreset('good1')"><span v-html="bi('好1','Good1')"></span></button>
          <button :class="{active: preset==='good2'}" @click="switchPreset('good2')"><span v-html="bi('好2','Good2')"></span></button>
          <button :class="{active: preset==='bad1'}" @click="switchPreset('bad1')"><span v-html="bi('坏1','Bad1')"></span></button>
          <button :class="{active: preset==='bad2'}" @click="switchPreset('bad2')"><span v-html="bi('坏2','Bad2')"></span></button>
        </div>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:400px">
          <grid-board :size="5" :forbidden="cfg.forbidden" :target="cfg.target" :start="1"
                      :policy="policy" :values="v.map(x=>+x.toFixed(1))" :labels="true"/>
        </div>
        <div class="lab-side">
          <div class="play-ctl">
            <button class="btn primary" @click="play">{{ playing ? '⏸ 暂停 Pause' : '▶ 迭代 Iterate' }}</button>
            <button class="btn" @click="sweep()">⏭ 一轮 Sweep</button>
            <button class="btn ghost" @click="reset">↺ 清零 Reset</button>
          </div>
          <div class="tally" style="margin-top:12px">
            <span class="t-label" v-html="bi('已扫轮数 k', 'sweeps done')"></span>
            <span class="t-num">{{ k }}</span>
            <span class="t-label" style="margin-left:14px" v-html="bi('最大变化 max|Δv|', 'max |Δv|')"></span>
            <span class="t-num" style="color:var(--gold)">{{ delta==null ? '—' : delta.toFixed(3) }}</span>
          </div>
          <div class="callout key" style="margin:14px 0 0">
            <div class="callout-icon">{{ preset.startsWith('good') ? '🕊' : '🕳' }}</div>
            <div class="callout-body">
              <p class="bi duo" style="font-weight:700" v-html="presetName"></p>
              <p class="bi duo" style="font-size:13.5px" v-html="bi(
                'γ = 0.9。好策略收敛到全正值、目标附近 ≈ 10（和书上 Figure 2.7a 一致）；好1 与好2 箭头只差两格、价值表完全相同——不同的策略可以有相同的状态值。坏策略的价值一片负值。',
                'γ = 0.9. Good policies converge to all-positive values near 10 by the target (matching book Fig. 2.7a); Good1 and Good2 differ in two arrows yet share identical values — different policies may share state values. Bad policies sink into negatives.')"></p>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §2.8 动作价值条 ---------- */
  const QBars = {
    name: 'QBars',
    components: { GridBoard: window.COMPONENTS.GridBoard },
    data: () => ({ gamma: 0.9 }),
    computed: {
      vals() {
        const g = this.gamma, v4 = 1 / (1 - g);
        const v1 = -0.5 + g / (1 - g);
        return [v1, v4, v4, v4];
      },
      qs() {
        const g = this.gamma;
        const [v1, v2, v3] = this.vals;
        return [
          { act: 'a1', zh: '向上（撞墙）', en: 'up (wall)', q: -1 + g * v1, sel: false },
          { act: 'a2', zh: '向右（进禁区）', en: 'right (forbidden)', q: -1 + g * v2, sel: true },
          { act: 'a3', zh: '向下（到 s3）', en: 'down (to s3)', q: 0 + g * v3, sel: true },  // 保持
          { act: 'a4', zh: '向左（撞墙）', en: 'left (wall)', q: -1 + g * v1, sel: false },
          { act: 'a5', zh: '原地', en: 'stay', q: 0 + g * v1, sel: false },
        ];
      },
      qMax() { return Math.max(...this.qs.map(x => Math.abs(x.q))); },
      policy() {
        return [[0, .5, .5, 0, 0], [0, 0, 1, 0, 0], [0, 1, 0, 0, 0], [0, 0, 0, 0, 1]];
      },
    },
    methods: { bi },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">s1 的五个动作价值 · π 不选的动作也有价值 · All five actions have values</span>
        <span class="ctl-label">γ = <strong>{{ gamma.toFixed(2) }}</strong></span>
        <input type="range" min="0.5" max="0.95" step="0.01" v-model.number="gamma"
               :style="{width:'150px', '--fill': ((gamma-0.5)/0.45*100)+'%'}">
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:250px">
          <grid-board :size="2" :forbidden="[2]" :target="4" :start="1" :agent="1" :policy="policy"/>
        </div>
        <div class="lab-side">
          <div class="dist">
            <div v-for="x in qs" :key="x.act" class="dist-row" style="grid-template-columns:120px 1fr 56px">
              <span class="dist-name" :style="{color: x.sel ? 'var(--accent-deep)' : 'var(--ink-3)'}"
                    :title="x.zh + ' / ' + x.en">{{ x.act }}</span>
              <div class="dist-bar-track"><div class="dist-bar" :class="{hot: !x.sel}"
                   :style="{width: (Math.abs(x.q)/qMax*100)+'%'}"></div></div>
              <span class="dist-val">{{ x.q.toFixed(2) }}</span>
            </div>
          </div>
          <div class="formula-card" style="margin-top:14px; font-size:15px">
            v(s<sub>1</sub>) = 0.5·q(a<sub>2</sub>) + 0.5·q(a<sub>3</sub>) = <strong style="color:var(--accent-deep)">{{ vals[0].toFixed(2) }}</strong>
          </div>
          <p class="bi duo" style="font-size:13px;color:var(--ink-3);margin:8px 0 0" v-html="bi(
            'π 在 s1 只掷 a2/a3，但五个动作的 q 全部有意义：撞墙的 a1/a4 = −1+γv(s1)，原地 a5 = 0+γv(s1)。把 q 从小到大排一遍，你会发现π没选的动作里藏着信息——这正是后来『探索』存在的理由。',
            'π only rolls a2/a3 at s1, yet all five q values matter: wall-hitting a1/a4 = −1+γv(s1), staying a5 = 0+γv(s1). Ranking the q values reveals information hidden among the unselected actions — the very reason exploration will exist.')"></p>
        </div>
      </div>
    </div>`,
  };

  window.COMPONENTS['l2-three-policies'] = ThreePolicies;
  window.COMPONENTS['l2-ring'] = RingBoot;
  window.COMPONENTS['l2-chain-solve'] = ChainSolve;
  window.COMPONENTS['l2-iter-eval'] = IterEval;
  window.COMPONENTS['l2-q-bars'] = QBars;
})();
