/* ═══════════════════════════════════════════════════════════
   L3 组件：策略改进 / 压缩映射蛛网 / γ-奖励实验机 / 绕路对比
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { stepOnce, bi } = RLV;
  const GB = () => window.COMPONENTS.GridBoard;

  /* 2×2 链条世界（s1 左上, s3 右上, s2 禁区左下, s4 目标右下） */
  const CHAIN = { size: 2, forbidden: [2], target: 4, mode: 'book' };

  function solvePolicy(policy, size, forbidden, target, gamma, sweeps) {
    let v = new Array(size * size).fill(0);
    for (let k = 0; k < (sweeps || 300); k++) {
      const vn = new Array(size * size).fill(0);
      for (let s = 1; s <= size * size; s++) {
        let q = 0;
        for (let a = 1; a <= 5; a++) {
          const pa = policy[s - 1][a - 1];
          if (!pa) continue;
          const res = stepOnce(s, a, { size, forbidden, target, mode: 'book' });
          q += pa * (res.reward + gamma * v[res.next - 1]);
        }
        vn[s - 1] = q;
      }
      v = vn;
    }
    return v;
  }

  /* ---------- §3.1 策略改进 ---------- */
  const Improve = {
    name: 'L3Improve',
    components: { GridBoard: GB() },
    data: () => ({ improved: false, gamma: 0.9 }),
    computed: {
      policy() {
        const M = [
          [0, 0, 1, 0, 0],   // s2 ↓ 进目标
          [0, 1, 0, 0, 0],   // s3 → 进目标
          [0, 0, 0, 0, 1],   // s4 原地
        ];
        const s1 = this.improved ? [0, 0, 1, 0, 0] : [0, 1, 0, 0, 0];
        return [s1, ...M];
      },
      vals() { return solvePolicy(this.policy, 2, [2], 4, this.gamma); },
      vBefore() {
        const bad = [[0,1,0,0,0],[0,0,1,0,0],[0,1,0,0,0],[0,0,0,0,1]];
        return solvePolicy(bad, 2, [2], 4, this.gamma);
      },
      qs() {
        const g = this.gamma, v = this.vals;
        const q = (a) => stepOnce(1, a, CHAIN);
        return [1, 2, 3, 4, 5].map((a) => {
          const r = q(a);
          return { act: a, q: r.reward + g * v[r.next - 1] };
        });
      },
      qMax() { return Math.max(...this.qs.map(x => Math.abs(x.q))); },
      bestA() { return this.qs.reduce((m, x) => (x.q > m.q ? x : m), this.qs[0]).act; },
    },
    methods: { bi },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">改进 s1 的一步 · Improve one step at s1</span>
        <span class="ctl-label">γ = <strong>{{ gamma.toFixed(2) }}</strong></span>
        <input type="range" min="0.5" max="0.95" step="0.01" v-model.number="gamma"
               :aria-label="$root.lang === 'en' ? 'discount factor gamma' : '折扣因子 γ'"
               :style="{width:'140px', '--fill': ((gamma-0.5)/0.45*100)+'%'}">
        <button class="btn primary" @click="improved = !improved">
          {{ improved ? '↺ 换回坏策略 a2' : '⇄ 改进：换成 a3' }}
        </button>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:250px">
          <grid-board :size="2" :forbidden="[2]" :target="4" :start="1" :agent="1"
                      :policy="policy" :values="vals.map(x=>+x.toFixed(1))"/>
        </div>
        <div class="lab-side">
          <div class="dist">
            <div v-for="x in qs" :key="x.act" class="dist-row" style="grid-template-columns:52px 1fr 56px">
              <span class="dist-name" :style="{color: x.act===bestA ? 'var(--accent-deep)' : 'var(--ink-3)'}">
                a{{ x.act }}<i v-if="x.act===bestA" style="font-style:normal"> ★</i></span>
              <div class="dist-bar-track"><div class="dist-bar" :class="{hot: x.act===bestA}"
                   :style="{width: (Math.abs(x.q)/qMax*100)+'%'}"></div></div>
              <span class="dist-val">{{ x.q.toFixed(2) }}</span>
            </div>
          </div>
          <div class="callout" :class="improved ? 'done' : 'key'" style="margin:13px 0 0">
            <div class="callout-icon">{{ improved ? '✅' : '🔍' }}</div>
            <div class="callout-body"><p class="bi duo" style="font-size:13.5px" v-html="bi(
              improved ? '换上 a3 后 v(s1) = ' + vals[0].toFixed(2) + '（改进前 ' + vBefore[0].toFixed(2) + '）——贪心一换，价值上涨。' : '当前策略在 s1 选 a2（闯禁区）：q(a2) = −1 + γ·v(s2)，不是最大。★ 标出 q 最大的动作——按一下上面的改进按钮。',
              improved ? 'With a3 at s1, v(s1) = ' + vals[0].toFixed(2) + ' (was ' + vBefore[0].toFixed(2) + ') — one greedy swap, value up.' : 'The current policy takes a2 (into the forbidden cell) at s1: q(a2) = −1 + γ·v(s2), not the max. The ★ marks the greatest q — hit the improve button.')
          </div>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §3.3.3 压缩映射蛛网 ---------- */
  const Contraction = {
    name: 'L3Contraction',
    data: () => ({
      fn: 'sin', x0: 2.4, pts: [2.4], playing: false, timer: null,
    }),
    computed: {
      W() { return 320; },
      lo() { return -3; }, hi() { return 3; },
      px() { return (x) => 20 + (x - this.lo) / (this.hi - this.lo) * (this.W - 40); },
      py() { return (y) => this.W - 20 - (y - this.lo) / (this.hi - this.lo) * (this.W - 40); },
      f() { return this.fn === 'sin' ? (x) => 0.5 * Math.sin(x) : (x) => 0.5 * x; },
      curve() {
        const pts = [];
        for (let i = 0; i <= 120; i++) {
          const x = this.lo + i / 120 * (this.hi - this.lo);
          pts.push(`${this.px(x)},${this.py(this.f(x))}`);
        }
        return pts.join(' ');
      },
      xk() { return this.pts[this.pts.length - 1]; },
    },
    methods: {
      step() {
        const x = this.pts[this.pts.length - 1];
        this.pts.push(this.f(x));
        if (this.pts.length > 40) { this.stop(); }
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => this.step(), 500);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() { this.stop(); this.pts = [this.x0]; },
      setX0(e) { this.x0 = e.target.valueAsNumber; this.reset(); },
    },
    unmounted() { this.stop(); },
    setup() { return { bi }; },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">蛛网迭代：看不动点把 x 拉进来 · Cobweb iteration</span>
        <div class="seg">
          <button :class="{active: fn==='sin'}" @click="fn='sin'; reset()">f(x) = 0.5 sin x</button>
          <button :class="{active: fn==='lin'}" @click="fn='lin'; reset()">f(x) = 0.5x</button>
        </div>
        <span class="ctl-label">x₀ = <strong>{{ x0.toFixed(2) }}</strong></span>
        <input type="range" min="-2.9" max="2.9" step="0.1" :value="x0" @input="setX0"
               :aria-label="$root.lang === 'en' ? 'starting point x0' : '初始点 x₀'"
               :style="{width:'140px', '--fill': ((x0+2.9)/5.8*100)+'%'}">
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage">
          <svg :viewBox="'0 0 ' + W + ' ' + W" style="width:300px;display:block;background:var(--chart-bg);border:1px solid var(--line);border-radius:12px">
            <line :x1="px(lo)" :y1="py(lo)" :x2="px(hi)" :y2="py(hi)" stroke="#c9d4de" stroke-width="1.4"/>
            <line :x1="px(lo)" :y1="py(0)" :x2="px(hi)" :y2="py(0)" stroke="#e3e9ef"/>
            <line :x1="px(0)" :y1="py(lo)" :x2="px(0)" :y2="py(hi)" stroke="#e3e9ef"/>
            <polyline :points="curve" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
            <template v-for="(x,i) in pts" :key="i">
              <line v-if="i>0" :x1="px(pts[i-1])" :y1="py(pts[i-1])" :x2="px(pts[i-1])" :y2="py(x)"
                    stroke="var(--red)" stroke-width="1.4" opacity=".8"/>
              <line v-if="i>0" :x1="px(pts[i-1])" :y1="py(x)" :x2="px(x)" :y2="py(x)"
                    stroke="var(--green)" stroke-width="1.4" opacity=".8"/>
            </template>
            <circle :cx="px(xk)" :cy="py(xk)" r="5" fill="var(--red)"/>
            <text :x="px(hi)-8" :y="py(hi)+14" text-anchor="end" style="font:700 11px var(--mono)" fill="#7b8a9c">y = x</text>
            <text :x="px(2.2)" :y="py(f(2.2))-8" style="font:700 11px var(--mono)" fill="var(--accent)">y = f(x)</text>
          </svg>
        </div>
        <div class="lab-side">
          <div class="play-ctl">
            <button class="btn primary" @click="play">{{ playing ? '⏸ 暂停' : '▶ 迭代 Iterate' }}</button>
            <button class="btn" @click="step">⏭ 一步</button>
            <button class="btn ghost" @click="reset">↺ 重来</button>
          </div>
          <div class="tally" style="margin-top:12px">
            <span class="t-label">k = {{ pts.length - 1 }}</span>
            <span class="t-num">x<sub>k</sub> = {{ xk.toFixed(4) }}</span>
          </div>
          <p class="bi duo" style="font-size:13.5px" v-html="bi(
            '红竖线：把 x_k 送到函数上；绿横线：把结果抄回横轴。每次映射，到不动点 x* = 0 的距离至少缩到 γ 倍——无论从哪个 x₀ 出发都被拉进来。这就是『从任何初值都收敛』的几何直观，值迭代 v↦f(v) 做的是同一件事，只是维度更高。',
            'Red vertical: apply f to x_k; green horizontal: copy the result back to the axis. Each mapping shrinks the distance to the fixed point x* = 0 by at least γ — every x₀ gets pulled in. This is the geometric face of “converges from any initial guess”; value iteration v↦f(v) does the same in higher dimension.')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §3.5 γ/奖励 实验机 ---------- */
  const GammaSweep = {
    name: 'L3GammaSweep',
    components: { GridBoard: GB() },
    data: () => ({
      gamma: 0.9, rForbid: -1,
      solved: false, sweeps: 0, v: null, pi: null, solving: false,
    }),
    computed: {
      cfg() { return { size: 5, forbidden: [7, 8, 13, 17, 19, 22], target: 18 }; },
      verdict() {
        if (!this.solved) return null;
        if (this.gamma === 0) return bi('γ = 0：彻底近视，原地打转到不了目标', 'γ = 0: utterly short-sighted — the target is unreachable');
        if (this.gamma >= 0.8) return bi('远视：敢穿禁区走近路（书 Figure 3.4a）', 'Far-sighted: dares to cross forbidden cells (book Fig. 3.4a)');
        if (this.gamma >= 0.4) return bi('近视：绕开全部禁区走远路（书 Figure 3.4b）', 'Short-sighted: avoids every forbidden cell (book Fig. 3.4b)');
        return bi('高度近视：几乎只在目标边上打转', 'Extremely short-sighted: lingers near the target only');
      },
    },
    methods: {
      bi,
      solve() {
        const n = 25;
        let v = new Array(n).fill(0);
        let pi = null;
        let k;
        for (k = 1; k <= 300; k++) {
          const vn = new Array(n).fill(0);
          pi = [];
          for (let s = 1; s <= n; s++) {
            let best = -Infinity, bestA = [];
            const qs = [];
            for (let a = 1; a <= 5; a++) {
              // 与书 Figure 3.4 同款世界：边界 −1，进禁区 rForbid（可进入），进目标 +1，普通 0
              const { next, reward } = stepOnce(s, a, { ...this.cfg, rForbidden: this.rForbid });
              const q = reward + this.gamma * v[next - 1];
              qs.push(q);
              if (q > best + 1e-9) { best = q; bestA = [a]; }
              else if (q > best - 1e-9) bestA.push(a);
            }
            vn[s - 1] = best;
            pi.push(bestA);
          }
          v = vn;
          if (k >= 120) break;
        }
        // 转成概率矩阵（并列最优平分——它们都是最优动作）
        const M = pi.map(list => {
          const row = [0,0,0,0,0];
          list.forEach(a => row[a-1] = 1 / list.length);
          return row;
        });
        this.v = v; this.pi = M; this.sweeps = k; this.solved = true;
      },
      preset(g, rf) { this.gamma = g; this.rForbid = rf; this.solve(); },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">最优策略实验机 · 5×5 书本世界 · The optimal-policy experiment machine</span>
      </div>
      <div class="ctl-row">
        <span class="ctl-label">γ = <strong>{{ gamma.toFixed(2) }}</strong></span>
        <input type="range" min="0" max="0.95" step="0.05" v-model.number="gamma"
               :aria-label="$root.lang === 'en' ? 'discount factor gamma' : '折扣因子 γ'"
               :style="{width:'180px', '--fill': (gamma/0.95*100)+'%'}">
        <span class="ctl-label">r<sub>forbidden</sub> =</span>
        <select class="sel" v-model.number="rForbid">
          <option :value="-1">−1</option><option :value="-2">−2</option>
          <option :value="-5">−5</option><option :value="-10">−10</option>
        </select>
        <button class="btn primary" @click="solve">⚡ <span v-html="bi('解 BOE','Solve the BOE')"></span></button>
        <button class="btn sm" @click="preset(0.9, -1)"><span v-html="bi('书 3.4a','Fig 3.4a')"></span></button>
        <button class="btn sm" @click="preset(0.5, -1)"><span v-html="bi('书 3.4b','Fig 3.4b')"></span></button>
        <button class="btn sm" @click="preset(0, -1)"><span v-html="bi('书 3.4c','Fig 3.4c')"></span></button>
        <button class="btn sm" @click="preset(0.9, -10)"><span v-html="bi('书 3.4d','Fig 3.4d')"></span></button>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:400px">
          <grid-board v-if="solved" :size="5" :forbidden="cfg.forbidden" :target="cfg.target" :start="1"
                      :policy="pi" :values="v.map(x=>+x.toFixed(1))"/>
          <div v-else class="formula-card" style="max-width:400px; padding:40px 20px" v-html="bi(
            '拧好旋钮，点「解 BOE」——值迭代 120 轮后给出最优策略与最优价值。', 'Set the knobs and hit Solve — 120 sweeps of value iteration return the optimal policy and values.')"></div>
        </div>
        <div class="lab-side" v-if="solved">
          <div class="callout key" style="margin:0 0 12px">
            <div class="callout-icon">🎯</div>
            <div class="callout-body">
              <p class="bi duo" style="font-weight:700" v-html="verdict"></p>
              <p class="bi duo" style="font-size:13px;margin:4px 0 0" v-html="bi(
                '解法：值迭代 ' + sweeps + ' 轮（γ = ' + gamma.toFixed(2) + '，r_forbidden = ' + rForbid + '）。并列最优的动作以平分概率画出（多支等长箭头）。',
                'Solver: value iteration, ' + sweeps + ' sweeps (γ = ' + gamma.toFixed(2) + ', r_forbidden = ' + rForbid + '). Tied-optimal actions are drawn with split probability (equal-length arrows).')"></p>
            </div>
          </div>
          <p class="bi duo" style="font-size:13.5px" v-html="bi(
            '对照书 Figure 3.4：γ=0.9 时最优路径笔直地穿过禁区（远视）；γ=0.5 时全员绕行（近视）；γ=0 时价值只剩即时奖励、到不了目标；r_forbidden=−10 时即使远视也绕开禁区。',
            'Compare with book Figure 3.4: at γ=0.9 the optimal path cuts straight through forbidden cells (far-sighted); at γ=0.5 everything detours (short-sighted); at γ=0 values collapse to immediate rewards and the target is unreachable; at r_forbidden=−10 even the far-sighted policy avoids them.')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §3.5 绕路对比 ---------- */
  const Detour = {
    name: 'L3Detour',
    components: { GridBoard: GB() },
    data: () => ({ which: 'A', gamma: 0.9 }),
    computed: {
      policy() {
        const A = [[0,0,1,0,0],[0,0,1,0,0],[0,1,0,0,0],[0,0,0,0,1]]; // s1↓ s2↓ s3→ s4◎
        const B = [[0,0,1,0,0],[0,0,0,1,0],[0,1,0,0,0],[0,0,0,0,1]]; // s1↓ s2← s3→ s4◎
        return this.which === 'A' ? A : B;
      },
      ret() {
        const g = this.gamma;
        return this.which === 'A' ? 1 / (1 - g) : g * g / (1 - g);
      },
      chain() {
        return this.which === 'A'
          ? [{s:2},{a:3,r:0,s:4}]
          : [{s:2},{a:4,r:0,s:1},{a:3,r:0,s:3},{a:2,r:1,s:4}];
      },
    },
    methods: { bi },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">直走还是绕路？γ 替你付时间账 · Direct or detour? γ pays the time bill</span>
        <div class="seg">
          <button :class="{active: which==='A'}" @click="which='A'"><span v-html="bi('直走 A','Direct A')"></span></button>
          <button :class="{active: which==='B'}" @click="which='B'"><span v-html="bi('绕路 B','Detour B')"></span></button>
        </div>
        <span class="ctl-label">γ = <strong>{{ gamma.toFixed(2) }}</strong></span>
        <input type="range" min="0.5" max="0.95" step="0.01" v-model.number="gamma"
               :aria-label="$root.lang === 'en' ? 'discount factor gamma' : '折扣因子 γ'"
               :style="{width:'140px', '--fill': ((gamma-0.5)/0.45*100)+'%'}">
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:250px">
          <grid-board :size="2" :forbidden="[]" :target="4" :start="2" :agent="4" :policy="policy"/>
        </div>
        <div class="lab-side">
          <div class="chain">
            <template v-for="(n,i) in chain" :key="i">
              <span v-if="n.a" class="chain-arrow"><span class="a-act">a{{ n.a }}</span><span>r={{ n.r }}</span></span>
              <span class="chain-node" :class="{now: true}"><span class="cn-s">{{ 's'+n.s }}</span>
                <span class="cn-r">{{ n.s===4 ? 'target' : ' ' }}</span></span>
            </template>
          </div>
          <div class="tally">
            <span class="t-label" v-html="bi('折扣回报', 'discounted return')"></span>
            <span class="t-num">{{ ret.toFixed(2) }}</span>
            <span class="t-gamma">{{ which==='A' ? '1/(1−γ)' : 'γ²/(1−γ)' }}</span>
          </div>
          <p class="bi duo" style="font-size:13.5px" v-html="bi(
            '走路不要钱，但每多走一步，未来的 +1 就多打一次 γ 折。r_other = 0 时最优策略也走最短路——γ 就是时间成本。所谓『加步数惩罚』不仅多余，而且因仿射不变性而无效。',
            'Walking is free, yet every extra step discounts the future +1 once more. Even with r_other = 0 the optimal policy takes the shortest path — γ is the cost of time. A step penalty is unnecessary and, by affine invariance, useless.')"></p>
        </div>
      </div>
    </div>`,
  };

  window.COMPONENTS['l3-improve'] = Improve;
  window.COMPONENTS['l3-contraction'] = Contraction;
  window.COMPONENTS['l3-gamma-sweep'] = GammaSweep;
  window.COMPONENTS['l3-detour'] = Detour;
})();
