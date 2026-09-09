/* ═══════════════════════════════════════════════════════════
   L5 组件：均值估计 / MC Basic 采样学习 / ε-greedy 探索热图
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { bi } = RLV;
  const GB = () => window.COMPONENTS.GridBoard;

  /* ---------- §5.1 均值估计 ---------- */
  const MeanEst = {
    name: 'L5MeanEst',
    data: () => ({ pHead: 0.5, samples: [], avg: [], running: false, timer: null }),
    computed: {
      n() { return this.samples.length; },
      trueMean() { return this.pHead * 1 + (1 - this.pHead) * (-1); },
      pts() {
        // 折线：avg 序列映射到 300x120 视图
        const N = Math.max(this.avg.length, 50);
        return this.avg.map((a, i) => `${10 + i / N * 280},${60 - Math.max(-2, Math.min(2, a)) * 26}`).join(' ');
      },
    },
    methods: {
      draw(n = 1) {
        for (let i = 0; i < n; i++) {
          const x = Math.random() < this.pHead ? 1 : -1;
          this.samples.push(x);
          const prev = this.avg.length ? this.avg[this.avg.length - 1] : 0;
          this.avg.push(prev + (x - prev) / this.samples.length);
        }
      },
      play() {
        if (this.running) { this.stop(); return; }
        this.running = true;
        this.timer = setInterval(() => {
          this.draw(3);
          if (this.n >= 300) this.stop();
        }, 40);
      },
      stop() { this.running = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() { this.stop(); this.samples = []; this.avg = []; },
      setP(e) { this.pHead = e.target.valueAsNumber; this.reset(); },
    },
    unmounted() { this.stop(); },
    setup() { return { bi }; },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">掷硬币估均值 · Coin-flip mean estimation</span>
        <span class="ctl-label">p(正面) = <strong>{{ pHead.toFixed(2) }}</strong></span>
        <input type="range" min="0.05" max="0.95" step="0.05" :value="pHead" @input="setP"
               :style="{width:'140px', '--fill': ((pHead-0.05)/0.9*100)+'%'}">
        <button class="btn primary" @click="play">{{ running ? '⏸ 暂停' : '▶ 抛硬币' }}</button>
        <button class="btn" @click="draw(20)">+20</button>
        <button class="btn ghost" @click="reset">↺</button>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="flex:1 1 340px">
          <svg viewBox="0 0 300 130" style="width:100%;max-width:420px;display:block;background:#fff;border:1px solid var(--line);border-radius:12px">
            <line x1="10" :y1="60 - trueMean*26" x2="290" :y2="60 - trueMean*26"
                  stroke="var(--gold)" stroke-width="2" stroke-dasharray="6 4"/>
            <text x="288" :y="52 - trueMean*26" text-anchor="end" style="font:700 10px var(--mono)" fill="var(--gold)">E[X] = {{ trueMean.toFixed(2) }}</text>
            <polyline v-if="avg.length" :points="pts" fill="none" stroke="var(--accent)" stroke-width="1.8"/>
          </svg>
        </div>
        <div class="lab-side">
          <div class="tally" style="margin:0 0 12px">
            <span class="t-label">n = {{ n }}</span>
            <span class="t-num">x̄ = {{ n ? avg[n-1].toFixed(3) : '—' }}</span>
            <span class="t-label" style="margin-left:10px">var[X]/n = {{ (n ? (1 - trueMean*trueMean)/n : 1).toFixed(3) }}</span>
          </div>
          <p class="bi duo" style="font-size:13.5px" v-html="bi(
            '蓝线：样本平均 x̄ 随 n 的演化；金色虚线：真实均值。把 p(正面) 拧到 0.7 再玩一轮——起点不同，归宿相同：大数定律不讲情面。var[x̄] = var[X]/n 解释了为什么越到后面抖动越小。',
            'The blue line: sample average x̄ as n grows; the gold dashed line: the true mean. Twist p(heads) to 0.7 and replay — different starts, same destination: the law of large numbers shows no mercy. var[x̄] = var[X]/n explains why the wobble fades.')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §5.2 MC Basic 现场学习 ---------- */
  const McBasic = {
    name: 'L5McBasic',
    components: { GridBoard: GB() },
    data: () => ({
      n: 20, wind: false, k: 0, pi: null, totalEps: 0,
      qErrors: null, playing: false, timer: null,
    }),
    computed: {
      cfg() { return { size: 4, forbidden: [8, 10], target: 12 }; },
    },
    methods: {
      bi,
      sr(s, a) {
        const size = this.cfg.size;
        const A = [[0,-1],[1,0],[0,1],[-1,0],[0,0]][a-1];
        const { r, c } = RLV.s2rc(s, size);
        const nr = r + A[1], nc = c + A[0];
        let action = a;
        if (this.wind && Math.random() < 0.15) action = 1 + Math.floor(Math.random() * 5);  // 大风：动作打滑
        const A2 = [[0,-1],[1,0],[0,1],[-1,0],[0,0]][action-1];
        const nr2 = r + A2[1], nc2 = c + A2[0];
        if (nr2 < 0 || nr2 >= size || nc2 < 0 || nc2 >= size) return { next: s, reward: -1 };
        const next = RLV.rc2s(nr2, nc2, size);
        if (next === this.cfg.target) return { next, reward: 1 };
        if (this.cfg.forbidden.includes(next)) return { next, reward: -1 };
        return { next, reward: 0 };
      },
      roll(s, a, maxSteps) {
        // 从 (s,a) 出发按 pi 采样一条轨迹，返回整条折扣回报
        let g = 0, disc = 1;
        const rr = this.sr(s, a);
        g += disc * rr.reward;
        let cur = rr.next;
        for (let t = 1; t < maxSteps; t++) {
          disc *= 0.9;
          const row = this.pi ? this.pi[cur - 1] : [0.2, 0.2, 0.2, 0.2, 0.2];
          let pick = 0, x = Math.random(), acc = 0;
          for (let i = 0; i < 5; i++) { acc += row[i]; if (x <= acc) { pick = i; break; } }
          const r2 = this.sr(cur, pick + 1);
          g += disc * r2.reward;
          cur = r2.next;
          if (cur === this.cfg.target && Math.random() < 0.02) break;  // 偶尔提前收尾
        }
        return g;
      },
      outer() {
        // 一轮 MC Basic：对每个 (s,a) 采 n 条轨迹估 q → 贪心改进
        const n = 16;
        const q = [];
        for (let s = 1; s <= n; s++) {
          const row = [];
          for (let a = 1; a <= 5; a++) {
            let acc = 0;
            for (let i = 0; i < this.n; i++) acc += this.roll(s, a, 80);
            row.push(acc / this.n);
            this.totalEps += this.n;
          }
          q.push(row);
        }
        this.pi = q.map(row => {
          const m = Math.max(...row);
          const ties = row.reduce((acc, x, i) => (x > m - 1e-9 ? [...acc, i] : acc), []);
          const r = [0,0,0,0,0];
          ties.forEach(i => r[i] = 1 / ties.length);
          return r;
        });
        this.k++;
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => { this.outer(); if (this.k >= 8) this.stop(); }, 350);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() { this.stop(); this.pi = null; this.k = 0; this.totalEps = 0; },
    },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">MC Basic 现场 · 4×4 作业世界 · MC Basic live</span>
        <span class="ctl-label">每对采样 n = <strong>{{ n }}</strong></span>
        <input type="range" min="1" max="60" step="1" v-model.number="n"
               :style="{width:'140px', '--fill': ((n-1)/59*100)+'%'}">
        <label class="ctl-label" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="wind"> 🌬 <span v-html="bi('刮风(15%打滑)','wind (15% slip)')"></span>
        </label>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:380px">
          <grid-board v-if="pi" :size="4" :forbidden="cfg.forbidden" :target="cfg.target" :start="1" :policy="pi"/>
          <div v-else class="formula-card" style="padding:36px 20px" v-html="bi('还没开始采样——点下面的按钮。','No samples yet — hit a button below.')"></div>
        </div>
        <div class="lab-side">
          <div class="play-ctl">
            <button class="btn primary" @click="play">{{ playing ? '⏸ 暂停' : '▶ 迭代 8 轮' }}</button>
            <button class="btn" @click="outer()">⏭ 一轮外层</button>
            <button class="btn ghost" @click="reset">↺ 重置</button>
          </div>
          <div class="tally" style="margin:12px 0">
            <span class="t-label" v-html="bi('外层轮数', 'outer rounds')"></span>
            <span class="t-num">{{ k }}</span>
            <span class="t-label" style="margin-left:12px" v-html="bi('累计回合数', 'episodes so far')"></span>
            <span class="t-num">{{ totalEps }}</span>
          </div>
          <div class="callout key" style="margin:0">
            <div class="callout-icon">🌬</div>
            <div class="callout-body"><p class="bi duo" style="font-size:13.5px" v-html="bi(
              '确定性世界（不刮风）里一条轨迹就是精确答案，n=1 也收敛。勾选刮风后再试 n=1：q 估计全是噪声，策略乱指；n 调到 40+ 噪声被平均掉——『样本够多才够准』的现场演示。',
              'In the deterministic world (no wind) one episode is the exact answer and n=1 suffices. Tick the wind and retry n=1: the q estimates are pure noise and the policy points everywhere; push n to 40+ and averaging drowns the noise — “enough samples, accurate enough”, live.')"></p></div>
          </div>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §5.4/5.5 ε-greedy 探索热图 ---------- */
  const EpsGreedy = {
    name: 'L5EpsGreedy',
    components: { GridBoard: GB() },
    data: () => ({
      eps: 0.1, visits: new Array(25).fill(0), cur: 1, trail: [],
      playing: false, timer: null, steps: 0, vStar: null,
    }),
    computed: {
      cfg() { return { size: 5, forbidden: [7, 8, 13, 17, 19, 22], target: 18 }; },
      heat() {
        const m = Math.max(...this.visits, 1);
        return this.visits.map(x => Math.min(1, Math.pow(x / m, 0.5)));
      },
      unique() { return this.visits.filter(x => x > 0).length; },
    },
    created() {
      // 先用值迭代求最优策略（ε-greedy 的底座）
      const size = 5, forbidden = this.cfg.forbidden, target = this.cfg.target;
      const sr = (s, a) => {
        const A = [[0,-1],[1,0],[0,1],[-1,0],[0,0]][a-1];
        const { r, c } = RLV.s2rc(s, size);
        const nr = r + A[1], nc = c + A[0];
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return { next: s, reward: -1 };
        const next = RLV.rc2s(nr, nc, size);
        if (next === target) return { next, reward: 1 };
        if (forbidden.includes(next)) return { next, reward: -10 };
        return { next, reward: 0 };
      };
      let v = new Array(25).fill(0);
      for (let k = 0; k < 300; k++) {
        const vn = new Array(25).fill(0);
        for (let s = 1; s <= 25; s++) {
          let best = -Infinity;
          for (let a = 1; a <= 5; a++) {
            const rr = sr(s, a);
            best = Math.max(best, rr.reward + 0.9 * v[rr.next - 1]);
          }
          vn[s - 1] = best;
        }
        v = vn;
      }
      this.opt = [];
      for (let s = 1; s <= 25; s++) {
        let best = -Infinity, bestA = 1;
        for (let a = 1; a <= 5; a++) {
          const rr = sr(s, a);
          const q = rr.reward + 0.9 * v[rr.next - 1];
          if (q > best) { best = q; bestA = a; }
        }
        this.opt.push(bestA);
      }
      this.srFn = sr;
    },
    methods: {
      bi,
      step(n = 1) {
        for (let i = 0; i < n; i++) {
          let a = this.opt[this.cur - 1];
          if (Math.random() < this.eps) a = 1 + Math.floor(Math.random() * 5);  // 探索
          const rr = this.srFn(this.cur, a);
          this.cur = rr.next;
          this.visits[this.cur - 1]++;
          this.steps++;
          this.trail.push(this.cur);
          if (this.trail.length > 60) this.trail.shift();
        }
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => {
          this.step(Math.max(3, Math.floor(this.eps * 12)));
          if (this.steps >= 3000) this.stop();
        }, 60);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() { this.stop(); this.visits = new Array(25).fill(0); this.cur = 1; this.trail = []; this.steps = 0; },
    },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">ε-greedy 漫游 · 红色 = 访问热度 · ε-greedy wandering, red = visit heat</span>
        <span class="ctl-label">ε = <strong>{{ eps.toFixed(2) }}</strong></span>
        <input type="range" min="0" max="1" step="0.05" v-model.number="eps"
               :style="{width:'160px', '--fill': (eps*100)+'%'}">
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:400px">
          <grid-board :size="5" :forbidden="cfg.forbidden" :target="cfg.target" :start="1"
                      :agent="cur" :heat="heat"/>
        </div>
        <div class="lab-side">
          <div class="play-ctl">
            <button class="btn primary" @click="play">{{ playing ? '⏸ 暂停' : '▶ 漫游 Roam' }}</button>
            <button class="btn" @click="step(50)">+50 步</button>
            <button class="btn ghost" @click="reset">↺ 清零</button>
          </div>
          <div class="tally" style="margin:12px 0">
            <span class="t-label" v-html="bi('已走步数', 'steps')"></span>
            <span class="t-num">{{ steps }}</span>
            <span class="t-label" style="margin-left:12px" v-html="bi('访问过的格子', 'cells visited')"></span>
            <span class="t-num">{{ unique }}/25</span>
          </div>
          <div class="callout" :class="eps < 0.05 ? 'danger' : eps > 0.6 ? 'warn' : 'done'" style="margin:0">
            <div class="callout-icon">{{ eps < 0.05 ? '🔒' : eps > 0.6 ? '🎲' : '⚖️' }}</div>
            <div class="callout-body"><p class="bi duo" style="font-size:13.5px" v-html="bi(
              eps < 0.05 ? 'ε≈0：纯贪心。智能体在起点附近的小圈子里打转——大量格子永远没被探索，它们的价值根本无法估准。'
              : eps > 0.6 ? 'ε 很大：到处乱逛，覆盖全图——但真正执行时它只有 ' + Math.round((1 - (4/5)*eps)*100) + '% 的时间在走最优动作，最优性被大幅牺牲。'
              : '适中的 ε：既围绕最优路线行动，又持续勘探冷门格子。这就是『探索与利用』的平衡点——衰减 ε 即可从左边滑到右边。',
              eps < 0.05 ? 'ε≈0: pure greedy. The agent circles a tiny loop near the start — many cells are never explored, their values can never be estimated.'
              : eps > 0.6 ? 'Large ε: wandering everywhere, full coverage — but when executing, only ' + Math.round((1 - (4/5)*eps)*100) + '% of the time goes to optimal actions; optimality is heavily taxed.'
              : 'A moderate ε: act on the optimal route while continually probing cold cells. That is the exploration–exploitation balance — decaying ε slides you from the left extreme to the right.')"></p></div>
          </div>
        </div>
      </div>
    </div>`,
  };

  window.COMPONENTS['l5-mean-est'] = MeanEst;
  window.COMPONENTS['l5-mc-basic'] = McBasic;
  window.COMPONENTS['l5-eps-greedy'] = EpsGreedy;
})();
