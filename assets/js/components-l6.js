/* ═══════════════════════════════════════════════════════════
   L6 组件：增量均值步长实验 / RM 黑盒求根 / SGD 三代同堂
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { bi } = RLV;

  /* ---------- §6.1 增量均值：α_k 的三种命运 ---------- */
  const Incremental = {
    name: 'L6Incremental',
    data: () => ({
      sched: 'invk', alpha: 0.5, trueMean: 2.0,
      series: [], samples: [], running: false, timer: null,
    }),
    computed: {
      NAMES() {
        return {
          invk: bi('α_k = 1/k（满足两条件 → 收敛）', 'α_k = 1/k (both conditions → converges)'),
          half: bi('α = 0.5 恒定（Σα² = ∞ → 永久抖动）', 'α = 0.5 constant (Σα² = ∞ → endless jitter)'),
          two: bi('α = 2 恒定（跨过真值 → 发散）', 'α = 2 constant (overshoots → diverges)'),
        };
      },
      pts() {
        const W = 320, H = 150;
        const lo = -4, hi = 8;
        const N = Math.max(this.series.length, 50);
        return this.series.map((w, i) => {
          const c = Math.max(lo, Math.min(hi, Number.isFinite(w) ? w : hi));
          return `${10 + i / N * (W - 20)},${H - 14 - (c - lo) / (hi - lo) * (H - 28)}`;
        }).join(' ');
      },
    },
    methods: {
      bi,
      alphaAt(k) {
        return this.sched === 'invk' ? 1 / k : this.alpha;
      },
      step(n = 1) {
        for (let i = 0; i < n; i++) {
          const x = this.trueMean + (Math.random() * 6 - 3);  // 样本 = 真值 + U(-3,3) 噪声
          const k = this.samples.length + 1;
          const w = this.series.length ? this.series[this.series.length - 1] : 0;
          this.samples.push(x);
          this.series.push(w - this.alphaAt(k) * (w - x));
          if (this.series.length >= 200) { this.stop(); break; }
        }
      },
      play() {
        if (this.running) { this.stop(); return; }
        this.running = true;
        this.timer = setInterval(() => this.step(2), 40);
      },
      stop() { this.running = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() { this.stop(); this.series = []; this.samples = []; },
    },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">w_{k+1} = w_k − α_k(w_k − x_k) · 步长的三种命运 · Three fates of the step size</span>
        <div class="seg">
          <button :class="{active: sched==='invk'}" @click="sched='invk'; reset()">α = 1/k</button>
          <button :class="{active: sched==='half'}" @click="sched='half'; reset()">α = 0.5</button>
          <button :class="{active: sched==='two'}" @click="sched='two'; reset()">α = 2</button>
        </div>
        <button class="btn primary" @click="play">{{ running ? '⏸' : '▶ 采样' }}</button>
        <button class="btn" @click="step(20)">+20</button>
        <button class="btn ghost" @click="reset">↺</button>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="flex:1 1 360px">
          <svg viewBox="0 0 320 150" style="width:100%;max-width:440px;display:block;background:var(--chart-bg);border:1px solid var(--line);border-radius:12px">
            <line x1="10" :y1="150-14-(trueMean+4)/12*122" x2="310" :y2="150-14-(trueMean+4)/12*122"
                  stroke="var(--gold)" stroke-width="2" stroke-dasharray="6 4"/>
            <text x="308" :y="146-(trueMean+4)/12*122" text-anchor="end" style="font:700 10px var(--mono)" fill="var(--gold)">E[X] = {{ trueMean }}</text>
            <polyline v-if="series.length" :points="pts" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
          </svg>
        </div>
        <div class="lab-side">
          <div class="tally" style="margin:0 0 12px">
            <span class="t-label">k = {{ samples.length }}</span>
            <span class="t-num">w_k = {{ series.length ? series[series.length-1].toFixed(3) : '—' }}</span>
          </div>
          <div class="callout key" style="margin:0">
            <div class="callout-icon">🧭</div>
            <div class="callout-body">
              <p class="bi duo" style="font-weight:700" v-html="NAMES[sched]"></p>
              <p class="bi duo" style="font-size:13.5px" v-html="bi(
                '三个档位演示定理 6.1 条件②：Σα_k = ∞ 保证走得到，Σα_k² < ∞ 保证抖得停。1/k 两样全占；0.5 走得到但永远安静不下来；2.0 每步跨过真值越走越远。第 7 章 TD 的学习率就是这个 α_k。',
                'Three presets demonstrate Theorem 6.1 condition (b): Σα_k = ∞ ensures you get there; Σα_k² < ∞ ensures the wobble settles. 1/k has both; 0.5 arrives but never quiets down; 2.0 overshoots ever farther. Chapter 7’s TD learning rate is this very α_k.')"></p>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §6.2 RM 黑盒求根 ---------- */
  const RmLab = {
    name: 'L6Rm',
    data: () => ({ sigma: 1, sched: 'invk', w: 0, k: 0, trace: [], running: false, timer: null }),
    computed: {
      trueRoot() { return Math.pow(5, 1 / 3); },
      pts() {
        const lo = -0.5, hi = 3;
        const N = Math.max(this.trace.length, 60);
        return this.trace.map((w, i) => {
          const c = Math.max(lo, Math.min(hi, Number.isFinite(w) ? w : hi));
          return `${10 + i / N * 280},${130 - (c - lo) / (hi - lo) * 110}`;
        }).join(' ');
      },
      wpts() {
        const lo = -0.5, hi = 3;
        return this.trace.map((w, i) => ({ x: 10 + i / Math.max(this.trace.length, 60) * 280, y: 130 - (w - lo) / (hi - lo) * 110 }));
      },
    },
    methods: {
      bi,
      alphaAt() { return this.sched === 'invk' ? 1 / (this.k + 1) : this.sched === 'cst' ? 0.05 : 0.4; },
      step(n = 1) {
        for (let i = 0; i < n; i++) {
          const g = (this.w ** 3 - 5) + this.gauss() * this.sigma;  // 黑盒噪声读数
          this.w = this.w - this.alphaAt() * g;
          this.k++;
          this.trace.push(this.w);
        }
      },
      gauss() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      },
      play() {
        if (this.running) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => {
          this.step(2);
          if (this.k >= 400) this.stop();
        }, 30);
      },
      stop() { this.running = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() { this.stop(); this.w = 0; this.k = 0; this.trace = [0]; },
    },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">解 g(w) = w³ − 5 = 0 · 只凭噪声读数 · Root-finding on noisy readings</span>
        <span class="ctl-label">噪声 σ = <strong>{{ sigma }}</strong></span>
        <input type="range" min="0" max="3" step="0.5" v-model.number="sigma"
               :aria-label="$root.lang === 'en' ? 'noise level sigma' : '噪声强度 σ'"
               :style="{width:'120px', '--fill': (sigma/3*100)+'%'}">
        <div class="seg">
          <button :class="{active: sched==='invk'}" @click="sched='invk'; reset()">a_k = 1/k</button>
          <button :class="{active: sched==='cst'}" @click="sched='cst'; reset()">a = 0.05</button>
          <button :class="{active: sched==='big'}" @click="sched='big'; reset()">a = 0.4</button>
        </div>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="flex:1 1 360px">
          <svg viewBox="0 0 300 150" style="width:100%;max-width:440px;display:block;background:var(--chart-bg);border:1px solid var(--line);border-radius:12px">
            <line x1="10" :y1="130 - (trueRoot+0.5)/3.5*110" x2="290" :y2="130 - (trueRoot+0.5)/3.5*110"
                  stroke="var(--gold)" stroke-width="2" stroke-dasharray="6 4"/>
            <text x="288" :y="126 - (trueRoot+0.5)/3.5*110" text-anchor="end" style="font:700 10px var(--mono)" fill="var(--gold)">w* ≈ {{ trueRoot.toFixed(2) }}</text>
            <polyline v-if="trace.length" :points="pts" fill="none" stroke="var(--violet)" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="lab-side">
          <div class="play-ctl">
            <button class="btn primary" @click="play">{{ running ? '⏸' : '▶ 迭代' }}</button>
            <button class="btn" @click="step(20)">+20</button>
            <button class="btn ghost" @click="reset">↺</button>
          </div>
          <div class="tally" style="margin:12px 0">
            <span class="t-label">k = {{ k }}</span>
            <span class="t-num">w_k = {{ w.toFixed(3) }}</span>
          </div>
          <p class="bi duo" style="font-size:13px;color:var(--ink-2)" v-html="bi(
            '黑盒规则：读数 g̃ 为正就调小 w，为负就调大，步长控制幅度。a=0.4 太大——在根附近来回过冲；a=0.05 稳但到得慢；1/k 兼得。σ=0 可以看无噪声的干净轨迹。',
            'Black-box rule: a positive reading decreases w, a negative one increases it, and the step sizes the move. a=0.4 overshoots around the root; a=0.05 is steady but slow; 1/k gets both. Set σ=0 to watch the clean noiseless path.')"></p>
        </div>
      </div>
    </div>`,
  };

  /* ---------- §6.4 SGD/MBGD 赛跑 ---------- */
  const SgdRace = {
    name: 'L6Sgd',
    data: () => ({
      paths: null, running: false,
      m1: [], m5: [], m50: [], samples: [],
    }),
    computed: {
      pts1() { return this.mkPts(this.m1); },
      pts5() { return this.mkPts(this.m5); },
      pts50() { return this.mkPts(this.m50); },
    },
    methods: {
      bi,
      mkPts(arr) {
        const N = Math.max(arr.length, 30);
        return arr.map((d, i) => `${10 + i / N * 280},${130 - Math.min(6, d) / 6 * 110}`).join(' ');
      },
      race() {
        // 样本：正态(0, 4²)
        this.samples = Array.from({ length: 300 }, () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 4);
        let w1 = 20, w5 = 20, w50 = 20;
        this.m1 = [w1]; this.m5 = [w5]; this.m50 = [w50];
        const alpha = 0.02;
        for (let k = 0; k < 200; k++) {
          const i = k * 50;
          const x1 = this.samples[(i + 7) % 300];
          w1 -= alpha * (w1 - x1);
          let s5 = 0; for (let j = 0; j < 5; j++) s5 += this.samples[(i + j * 3) % 300];
          w5 -= alpha * (w5 - s5 / 5);
          let s50 = 0; for (let j = 0; j < 50; j++) s50 += this.samples[(i + j) % 300];
          w50 -= alpha * (w50 - s50 / 50);
          this.m1.push(Math.abs(w1)); this.m5.push(Math.abs(w5)); this.m50.push(Math.abs(w50));
        }
      },
    },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">估计均值：SGD(m=1) vs MBGD(m=5,50) · 估计 |w−w*| 的下降 · |w−w*| descent</span>
        <button class="btn primary" @click="race">⚡ <span v-html="bi('开赛','Race')"></span></button>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="flex:1 1 380px">
          <svg viewBox="0 0 300 150" style="width:100%;max-width:480px;display:block;background:var(--chart-bg);border:1px solid var(--line);border-radius:12px">
            <text x="290" y="18" text-anchor="end" style="font:700 10px var(--mono)" fill="var(--red)">SGD m=1</text>
            <text x="290" y="32" text-anchor="end" style="font:700 10px var(--mono)" fill="var(--gold)">MBGD m=5</text>
            <text x="290" y="46" text-anchor="end" style="font:700 10px var(--mono)" fill="var(--green)">MBGD m=50</text>
            <polyline v-if="m1.length" :points="pts1" fill="none" stroke="var(--red)" stroke-width="1.3" opacity=".85"/>
            <polyline v-if="m5.length" :points="pts5" fill="none" stroke="var(--gold)" stroke-width="1.5"/>
            <polyline v-if="m50.length" :points="pts50" fill="none" stroke="var(--green)" stroke-width="1.8"/>
          </svg>
        </div>
        <div class="lab-side">
          <p class="bi duo" style="font-size:13.5px" v-html="bi(
            '三条路径解同一问题（估 N(0,4²) 的均值 0）：SGD（红）先冲得猛、后在零附近永久抖动；MBGD m=5（金）抖动减半；m=50（绿）几乎平滑到底。批量大小是『方差 vs 单步成本』的旋钮——这就是深度学习 batch size 的理论身世。',
            'Three paths, one problem (estimate the mean 0 of N(0,4²)): SGD (red) sprints then jitters around zero forever; MBGD m=5 (gold) halves the wobble; m=50 (green) is nearly smooth all the way. Batch size is the dial trading variance against per-step cost — the theoretical biography of the deep-learning batch size.')"></p>
        </div>
      </div>
    </div>`,
  };

  window.COMPONENTS['l6-incremental'] = Incremental;
  window.COMPONENTS['l6-rm'] = RmLab;
  window.COMPONENTS['l6-sgd'] = SgdRace;
})();
