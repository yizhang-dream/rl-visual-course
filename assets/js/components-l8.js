/* ═══════════════════════════════════════════════════════════
   L8 组件：曲线拟合近似器（TD-Linear 现场学习）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { bi } = RLV;

  /* ---------- TD-Linear 现场学习：用多项式/Fourier 特征拟合真值曲线 ---------- */
  const FitLab = {
    name: 'L8FitLab',
    data: () => ({
      features: 'poly', order: 2, alpha: 0.05, playing: false, timer: null,
      w: null, k: 0, targetPts: null,
    }),
    methods: {
      bi,
      phi(s) {
        // s: 0..nS-1 归一化到 [-1,1]
        const x = 2 * s / (this.nS - 1) - 1;
        if (this.features === 'poly') {
          return Array.from({ length: this.dim }, (_, i) => Math.pow(x, i));
        }
        // Fourier: cos(π k (x+1)/2), k=0..order
        const xn = (x + 1) / 2;
        return Array.from({ length: this.dim }, (_, i) => Math.cos(Math.PI * i * xn));
      },
      vhat(s) {
        const p = this.phi(s), w = this.w;
        if (!w || w.length !== p.length) return 0;
        const v = p.reduce((acc, f, i) => acc + f * (Number.isFinite(w[i]) ? w[i] : 0), 0);
        return Number.isFinite(v) ? v : 0;
      },
      trueV(s) {
        // 人造"真值"曲线：一个形似状态价值的驼峰
        const x = s / (this.nS - 1);
        return 10 * (0.35 + 0.5 * Math.sin(Math.PI * x) + 0.15 * x);
      },
      sweep(n = 1) {
        for (let i = 0; i < n; i++) {
          const s = Math.floor(Math.random() * this.nS);
          const v = this.trueV(s);
          const p = this.phi(s);
          const vhat = p.reduce((acc, f, j) => acc + f * this.w[j], 0);
          const delta = v - vhat;
          // normalized LMS: 步长除以 ||p||^2，保证任何特征缩放下都稳定
          const norm2 = p.reduce((acc, f) => acc + f * f, 0) + 1e-9;
          for (let j = 0; j < this.dim; j++) {
            this.w[j] += this.alpha * delta * p[j] / norm2;
            if (!Number.isFinite(this.w[j])) this.w[j] = 0;
          }
          this.k++;
        }
        this.w = [...this.w];  // 触发响应式
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => {
          this.sweep(5);
          if (this.k >= 4000) this.stop();
        }, 40);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() {
        this.stop();
        this.w = new Array(this.dim).fill(0);
        this.k = 0;
      },
      polyPath(f) {
        // 画 v̂ 曲线
        const N = 80, pts = [];
        for (let i = 0; i <= N; i++) {
          const s = i / N * (this.nS - 1);
          const p = this.phi(s);
          const v = f(p);
          pts.push(`${10 + i / N * 380},${170 - Math.max(0, Math.min(12, v)) / 12 * 150}`);
        }
        return pts.join(' ');
      },
    },
    mounted() { this.reset(); },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">拟合状态价值曲线 · v̂(s,w) = φᵀ(s)w · Fitting the value curve</span>
        <div class="seg">
          <button :class="{active: features==='poly'}" @click="features='poly'; reset()">多项式</button>
          <button :class="{active: features==='fourier'}" @click="features='fourier'; reset()">Fourier</button>
        </div>
        <span class="ctl-label">order = <strong>{{ order }}</strong></span>
        <input type="range" min="0" max="6" step="1" v-model.number="order" @change="reset"
               :style="{width:'110px', '--fill': (order/6*100)+'%'}">
        <button class="btn primary" @click="play">{{ playing ? '⏸' : '▶ SGD 学习' }}</button>
        <button class="btn" @click="sweep(50)">+50</button>
        <button class="btn ghost" @click="reset">↺</button>
      </div>
      <div class="lab-body" style="align-items:center">
        <div class="lab-stage" style="flex:1 1 420px">
          <svg viewBox="0 0 400 185" style="width:100%;display:block;background:#fff;border:1px solid var(--line);border-radius:12px">
            <polyline :points="trueCurve" fill="none" stroke="var(--gold)" stroke-width="2.4" stroke-dasharray="7 5"/>
            <polyline v-if="w" :points="estCurve" fill="none" stroke="var(--accent)" stroke-width="2.6"/>
            <g v-for="s in nS" :key="'d'+s">
              <circle :cx="10 + (s-1)/(nS-1)*380" :cy="170 - Math.max(0, Math.min(12, trueV(s-1)))/12*150" r="4"
                      fill="var(--gold)" opacity=".8"/>
              <circle v-if="w" :cx="10 + (s-1)/(nS-1)*380" :cy="170 - Math.max(-12, Math.min(12, vhat(s-1)))/12*150" r="4"
                      fill="var(--accent)"/>
            </g>
          </svg>
        </div>
        <div class="lab-side">
          <div class="tally" style="margin:0 0 12px">
            <span class="t-label" v-html="bi('SGD 更新次数', 'SGD updates')"></span>
            <span class="t-num">{{ k }}</span>
            <span class="t-label" style="margin-left:10px" v-html="bi('参数维度', 'params')"></span>
            <span class="t-num">{{ dim }}</span>
          </div>
          <p class="bi duo" style="font-size:13px" v-html="bi(
            '金虚线 = 真值曲线，蓝实线 = v̂(s,w) 当前拟合，圆点 = 各状态的取值。order=0 只有一条水平线（欠拟合）；order 拉高后蓝线逐渐贴住金线。试切 Fourier 特征对比收敛形状——特征决定上限。',
            'Gold dashed = the true curve; blue solid = current v̂(s,w); dots = per-state values. order=0 is a flat line (underfitting); raise the order and blue hugs gold. Switch to Fourier features to compare the fitted shapes — features set the ceiling.')"></p>
        </div>
      </div>
    </div>`,
    computed: {
      nS() { return 9; },
      dim() { return this.order + 1; },
      trueCurve() {
        const pts = [];
        for (let i = 0; i <= 80; i++) {
          const s = i / 80 * (this.nS - 1);
          pts.push(`${10 + i / 80 * 380},${170 - Math.max(0, Math.min(12, this.trueV(s))) / 12 * 150}`);
        }
        return pts.join(' ');
      },
      estCurve() {
        if (!this.w) return '';
        const pts = [];
        for (let i = 0; i <= 80; i++) {
          const s = i / 80 * (this.nS - 1);
          const v = this.vhat(s);
          pts.push(`${10 + i / 80 * 380},${170 - Math.max(-12, Math.min(12, v)) / 12 * 150}`);
        }
        return pts.join(' ');
      },
    },
  };

  window.COMPONENTS['l8-fit-lab'] = FitLab;
})();
