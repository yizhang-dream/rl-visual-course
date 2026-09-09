/* ═══════════════════════════════════════════════════════════
   L4 组件：值迭代逐步模拟 / PI vs VI 赛跑 / 截断谱系
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { stepOnce, bi } = RLV;
  const GB = () => window.COMPONENTS.GridBoard;

  /* 世界：书 §4.1 的 2×2（s1 左上, s2 右上禁区, s3 左下, s4 右下目标） */
  const W2 = { size: 2, forbidden: [2], target: 4, mode: 'book' };

  function qTable(v, world) {
    const n = world.size * world.size;
    const Q = [];
    for (let s = 1; s <= n; s++) {
      const row = [];
      for (let a = 1; a <= 5; a++) {
        const r = stepOnce(s, a, world);
        row.push(r.reward + (world.gamma || 0.9) * v[r.next - 1]);
      }
      Q.push(row);
    }
    return Q;
  }

  /* ---------- §4.1 值迭代逐步（书 2×2 例子） ---------- */
  const ViSim = {
    name: 'L4ViSim',
    components: { GridBoard: GB() },
    data: () => ({ k: 0, v: [0, 0, 0, 0], hist: [], playing: false, timer: null, world: '2x2', gamma: 0.9 }),
    computed: {
      cfg() {
        return this.world === '2x2' ? W2 : { size: 4, forbidden: [8, 10], target: 12, mode: 'book' };
      },
      n() { return this.cfg.size * this.cfg.size; },
      Q() { return qTable(this.v, { ...this.cfg, gamma: this.gamma }); },
      argmaxes() {
        return this.Q.map(row => {
          const m = Math.max(...row);
          return row.map((q, i) => ({ q, i, tie: q > m - 1e-9 }));
        });
      },
      vNew() { return this.Q.map(row => Math.max(...row)); },
      delta() { return Math.max(...this.vNew.map((x, i) => Math.abs(x - this.v[i]))); },
      pi() {
        return this.argmaxes.map(row => {
          const ties = row.filter(x => x.tie);
          const r = [0, 0, 0, 0, 0];
          ties.forEach(x => r[x.i] = 1 / ties.length);
          return r;
        });
      },
      acts() { return ['a1 上', 'a2 右', 'a3 下', 'a4 左', 'a5 原地']; },
    },
    methods: {
      bi,
      sweep() {
        this.hist.push({ v: [...this.v], pi: JSON.parse(JSON.stringify(this.pi)) });
        this.v = this.vNew;
        this.k++;
        if (this.k >= 30) this.stop();
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => this.sweep(), 700);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() { this.stop(); this.v = new Array(this.n).fill(0); this.k = 0; this.hist = []; },
      back() { this.stop(); const h = this.hist.pop(); if (h) { this.v = h.v; this.k--; } },
    },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">值迭代逐步 · q 表 → 贪心 → 取 max · Step through value iteration</span>
        <div class="seg">
          <button :class="{active: world==='2x2'}" @click="world='2x2'; reset()">书 2×2</button>
          <button :class="{active: world==='4x4'}" @click="world='4x4'; reset()">作业 4×4</button>
        </div>
      </div>
      <div class="lab-body">
        <div class="lab-stage" :style="{maxWidth: world==='2x2' ? '250px' : '380px'}">
          <grid-board :size="cfg.size" :forbidden="cfg.forbidden" :target="cfg.target" :start="1"
                      :policy="pi" :values="v.map(x=>+x.toFixed(1))"/>
        </div>
        <div class="lab-side">
          <div class="play-ctl">
            <button class="btn primary" @click="play">{{ playing ? '⏸ 暂停' : '▶ 迭代' }}</button>
            <button class="btn" @click="sweep">⏭ 一轮</button>
            <button class="btn ghost" @click="back">↩ 退一步</button>
            <button class="btn ghost" @click="reset">↺ 清零</button>
            <span class="reason-progress">k = {{ k }}</span>
          </div>
          <div class="data-table-wrap" style="margin-top:12px">
            <table class="data-table" style="font-size:11.5px">
              <thead><tr><th>q(s,a)</th><th v-for="a in acts" :key="a">{{ a }}</th><th>max → v′</th></tr></thead>
              <tbody>
                <tr v-for="(row,si) in Q" :key="si">
                  <td class="row-head">s{{ si+1 }}</td>
                  <td v-for="(q,ai) in row" :key="ai" :class="{hit: argmaxes[si][ai].tie}">{{ q.toFixed(2) }}</td>
                  <td style="font-weight:700; color:var(--accent-deep)">{{ vNew[si].toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="bi duo" style="font-size:12.5px;color:var(--ink-3)" v-html="bi(
            '高亮 = 该状态并列最大的 q（贪心候选，可能不止一个——最优策略不必唯一的现场）。右列取 max 即下一轮的 v′。k=1 时 2×2 世界已经收敛出最优策略（对照书 Figure 4.2）。',
            'Highlighted = tied-greatest q per state (greedy candidates — there may be several: optimal policies need not be unique, live). The right column takes the max as next v′. By k=1 the 2×2 world already yields an optimal policy (book Figure 4.2).')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §4.2 PI vs VI 赛跑（5×5, r_forbidden=−10） ---------- */
  const PiVsVi = {
    name: 'L4PiVsVi',
    components: { GridBoard: GB() },
    data: () => ({
      k: 0, v: null, pi: null, inner: [], totalInner: 0, playing: false, timer: null,
      viTotal: null, monotone: [],
    }),
    computed: {
      cfg() { return { size: 5, forbidden: [7, 8, 13, 17, 19, 22], target: 18 }; },
    },
    methods: {
      bi,
      sr(s, a, rForbid) {
        const size = this.cfg.size;
        const A = [[0,-1],[1,0],[0,1],[-1,0],[0,0]][a-1];
        const { r, c } = RLV.s2rc(s, size);
        const nr = r + A[1], nc = c + A[0];
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return { next: s, reward: -1 };
        const next = RLV.rc2s(nr, nc, size);
        if (next === this.cfg.target) return { next, reward: 1 };
        if (this.cfg.forbidden.includes(next)) return { next, reward: rForbid };
        return { next, reward: 0 };
      },
      evaluate(pi, rForbid) {
        // PE 到收敛（内层迭代），返回 (v, 内层轮数)
        const n = 25;
        let v = new Array(n).fill(0);
        let j = 0;
        for (; j < 500; j++) {
          const vn = new Array(n).fill(0);
          for (let s = 1; s <= n; s++) {
            let q = 0;
            for (let a = 1; a <= 5; a++) {
              const pa = pi[s - 1][a - 1];
              if (!pa) continue;
              const rr = this.sr(s, a, rForbid);
              q += pa * (rr.reward + 0.9 * v[rr.next - 1]);
            }
            vn[s - 1] = q;
          }
          const d = Math.max(...vn.map((x, i) => Math.abs(x - v[i])));
          v = vn;
          if (d < 1e-4) { j++; break; }
        }
        return { v, j: Math.min(j + 1, 500) };
      },
      greedy(v, rForbid) {
        const M = [];
        for (let s = 1; s <= 25; s++) {
          let best = -Infinity, bestA = [];
          for (let a = 1; a <= 5; a++) {
            const rr = this.sr(s, a, rForbid);
            const q = rr.reward + 0.9 * v[rr.next - 1];
            if (q > best + 1e-9) { best = q; bestA = [a]; }
            else if (q > best - 1e-9) bestA.push(a);
          }
          const row = [0,0,0,0,0];
          bestA.forEach(a => row[a-1] = 1 / bestA.length);
          M.push(row);
        }
        return M;
      },
      initRandom() {
        const M = [];
        for (let s = 0; s < 25; s++) {
          const row = [0,0,0,0,0];
          const picks = 1 + Math.floor(Math.random() * 3);
          const used = new Set();
          while (used.size < picks) used.add(Math.floor(Math.random() * 5));
          used.forEach(a => row[a] = 1 / picks);
          M.push(row);
        }
        return M;
      },
      restart() {
        this.stop();
        this.pi = this.initRandom();
        const r = this.evaluate(this.pi, -10);
        this.v = r.v; this.inner = [r.j]; this.totalInner = r.j;
        this.k = 0; this.viTotal = null; this.monotone = [this.v[17] || 0];
        // 目标格价值（s18 附近均值）作单调性展示
        this.monotone = [this.v.filter(x => x > -900).reduce((a,b)=>a+b,0) / 25];
      },
      step() {
        if (this.k >= 12) { this.stop(); return; }
        // PI: greedy improve
        this.pi = this.greedy(this.v, -10);
        const r = this.evaluate(this.pi, -10);
        this.v = r.v; this.k++;
        this.inner.push(r.j); this.totalInner += r.j;
        this.monotone.push(this.v.filter(x => x > -900).reduce((a,b)=>a+b, 0) / 25);
        if (this.inner.length >= 3) {
          const a1 = this.monotone[this.monotone.length-1], a0 = this.monotone[this.monotone.length-2];
          if (Math.abs(a1 - a0) < 1e-6) this.stop();
        }
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => this.step(), 900);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      runVI() {
        // 值迭代到与 PI 相同阈值，统计总扫描数
        const n = 25;
        let v = new Array(n).fill(0);
        let total = 0;
        for (let k = 0; k < 400; k++) {
          const vn = new Array(n).fill(0);
          for (let s = 1; s <= n; s++) {
            let best = -Infinity;
            for (let a = 1; a <= 5; a++) {
              const rr = this.sr(s, a, -10);
              best = Math.max(best, rr.reward + 0.9 * v[rr.next - 1]);
            }
            vn[s - 1] = best;
          }
          const d = Math.max(...vn.map((x, i) => Math.abs(x - v[i])));
          v = vn; total++;
          if (d < 1e-4) break;
        }
        this.viTotal = total;
      },
    },
    mounted() { this.restart(); },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">策略迭代赛跑 · 5×5 · r_forbidden = −10 · Policy iteration at work</span>
        <div class="play-ctl">
          <button class="btn primary" @click="play">{{ playing ? '⏸' : '▶ 自动' }}</button>
          <button class="btn" @click="step()">⏭ 改进一轮</button>
          <button class="btn ghost" @click="restart">↺ 换随机起点</button>
          <button class="btn" @click="runVI">🏁 <span v-html="bi('值迭代同题测试','Race value iteration')"></span></button>
        </div>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:400px">
          <grid-board :size="5" :forbidden="cfg.forbidden" :target="cfg.target" :start="1"
                      :policy="pi || []" :values="(v||[]).map(x=>+x.toFixed(1))"/>
        </div>
        <div class="lab-side">
          <div class="tally" style="margin:0 0 12px">
            <span class="t-label" v-html="bi('外层轮数', 'outer rounds')"></span>
            <span class="t-num">{{ k }}</span>
            <span class="t-label" style="margin-left:12px" v-html="bi('内层评估总扫描', 'total inner sweeps')"></span>
            <span class="t-num">{{ totalInner }}</span>
            <template v-if="viTotal != null">
              <span class="t-label" style="margin-left:12px">VI</span>
              <span class="t-num" style="color:var(--gold)">{{ viTotal }}</span>
            </template>
          </div>
          <div v-if="monotone.length > 1" style="display:flex; align-items:flex-end; gap:3px; height:64px; padding:8px 10px; background:var(--bg-soft); border-radius:10px; border:1px solid var(--line); margin-bottom:12px">
            <div v-for="(m,i) in monotone" :key="i" :title="'v̄ after round '+i"
                 style="flex:1; background:linear-gradient(var(--accent),#7fa3ec); border-radius:3px 3px 0 0; transition:height .4s cubic-bezier(.2,0,0,1)"
                 :style="{height: Math.max(4, (m - monotone[0]) / Math.max(1e-9, (monotone[monotone.length-1]-monotone[0])) * 48) + 'px'}"></div>
          </div>
          <p class="bi duo" style="font-size:13px;color:var(--ink-2)" v-html="bi(
            '柱状图：平均状态值逐轮单调上涨（引理 4.1 的可视化）。观察书上的现象——离目标近的格子先亮出最优箭头，价值从目标向外扩散。点击『值迭代同题测试』对比总扫描数：策略迭代通常更省。',
            'Bars: the mean state value rises monotonically each round (Lemma 4.1 visualised). Watch the book\\'s phenomenon — cells near the target settle on optimal arrows first as values ripple outward. Hit “race value iteration” to compare total sweeps: policy iteration usually spends fewer.')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §4.3 截断策略迭代谱系 ---------- */
  const Truncated = {
    name: 'L4Truncated',
    components: { GridBoard: GB() },
    data: () => ({ rows: null, running: false }),
    computed: {
      cfg() { return { size: 4, forbidden: [8, 10], target: 12 }; },
      js() { return [1, 2, 3, 5, 10, 30]; },
    },
    methods: {
      bi,
      sr(s, a) {
        const size = this.cfg.size;
        const A = [[0,-1],[1,0],[0,1],[-1,0],[0,0]][a-1];
        const { r, c } = RLV.s2rc(s, size);
        const nr = r + A[1], nc = c + A[0];
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return { next: s, reward: -1 };
        const next = RLV.rc2s(nr, nc, size);
        if (next === this.cfg.target) return { next, reward: 1 };
        if (this.cfg.forbidden.includes(next)) return { next, reward: -1 };
        return { next, reward: 0 };
      },
      greedyM(v) {
        const M = [];
        for (let s = 1; s <= 16; s++) {
          let best = -Infinity, bestA = [];
          for (let a = 1; a <= 5; a++) {
            const rr = this.sr(s, a);
            const q = rr.reward + 0.9 * v[rr.next - 1];
            if (q > best + 1e-9) { best = q; bestA = [a]; }
            else if (q > best - 1e-9) bestA.push(a);
          }
          const row = [0,0,0,0,0];
          bestA.forEach(a => row[a-1] = 1 / bestA.length);
          M.push(row);
        }
        return M;
      },
      runAll() {
        this.running = true;
        setTimeout(() => {
          const rows = [];
          for (const j of this.js) {
            let pi = []; // 从均匀随机策略开始
            for (let s = 0; s < 16; s++) pi.push([.2,.2,.2,.2,.2]);
            let v = new Array(16).fill(0);
            let outer = 0, inner = 0, stable = false;
            for (let k = 0; k < 200 && !stable; k++) {
              // PE 截断 j 步
              for (let it = 0; it < j; it++) {
                const vn = new Array(16).fill(0);
                for (let s = 1; s <= 16; s++) {
                  let q = 0;
                  for (let a = 1; a <= 5; a++) {
                    const pa = pi[s-1][a-1];
                    if (!pa) continue;
                    const rr = this.sr(s, a);
                    q += pa * (rr.reward + 0.9 * v[rr.next - 1]);
                  }
                  vn[s-1] = q;
                }
                v = vn; inner++;
              }
              // PI
              const piNew = this.greedyM(v);
              stable = JSON.stringify(piNew) === JSON.stringify(pi);
              pi = piNew;
              outer++;
              if (outer >= 200) stable = true;
            }
            rows.push({ j, outer, inner });
          }
          this.rows = rows;
          this.running = false;
        }, 60);
      },
      barW(row, key) {
        const max = Math.max(...this.rows.map(r => r[key]));
        return Math.max(4, row[key] / max * 100);
      },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">j 旋钮总账 · 4×4 作业世界 · The bill for each j</span>
        <button class="btn primary" @click="runAll" :disabled="running">
          {{ running ? '⏳ 计算中…' : '▶ 扫一遍 j ∈ {1,2,3,5,10,30}' }}
        </button>
      </div>
      <div v-if="rows" class="lab-body">
        <div class="lab-side" style="flex:1 1 100%">
          <div class="dist" style="gap:10px">
            <div v-for="r in rows" :key="r.j" class="dist-row" style="grid-template-columns:120px 1fr 70px 1fr 70px">
              <span class="dist-name" :style="{color: r.j===1||r.j===30 ? 'var(--accent-deep)' : 'var(--ink-2)'}">
                {{ r.j===1 ? 'j=1 (=VI)' : r.j===30 ? 'j=30 (≈PI)' : 'j='+r.j }}</span>
              <div class="dist-bar-track"><div class="dist-bar" :style="{width: barW(r,'outer')+'%'}"></div></div>
              <span class="dist-val">{{ r.outer }} <span v-html="bi('轮','rounds')"></span></span>
              <div class="dist-bar-track"><div class="dist-bar hot" :style="{width: barW(r,'inner')+'%'}"></div></div>
              <span class="dist-val">{{ r.inner }} <span v-html="bi('扫描','sweeps')"></span></span>
            </div>
          </div>
          <p class="bi duo" style="font-size:13.5px;margin-top:14px" v-html="bi(
            '绿色条 = 外层轮数（j 越大越少），蓝色条 = 内层评估总扫描数（j=1 时等于值迭代）。中间某处通常总扫描最少——『评估得足够好但不完美』是工程最优点。两端正是值迭代与策略迭代。',
            'Green bars = outer rounds (fewer for larger j); blue bars = total inner evaluation sweeps (j=1 equals value iteration). A middle j usually minimises total sweeps — “evaluate well but not perfectly” is the engineering optimum. The two ends are exactly value and policy iteration.')"></p>
        </div>
      </div>
      <p v-else class="bi duo" style="font-size:13px;color:var(--ink-3);margin:4px 0 0" v-html="bi(
        'j = 策略评估步的内层迭代次数。j=1 退化为值迭代，j=∞（此处以 30 近似）即策略迭代。点按钮跑完全谱系，看看总账在哪最少。',
        'j = inner iterations of the evaluation step; j=1 degenerates to value iteration, j=∞ (approximated by 30 here) is policy iteration. Run the whole spectrum to find where the total bill is smallest.')"></p>
    </div>`,
  };

  window.COMPONENTS['l4-vi-sim'] = ViSim;
  window.COMPONENTS['l4-pi-vs-vi'] = PiVsVi;
  window.COMPONENTS['l4-truncated'] = Truncated;
})();
