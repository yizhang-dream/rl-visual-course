/* ═══════════════════════════════════════════════════════════
   L10 组件：A2C 现场训练（演员策略 + 评论家价值 + TD 误差轨迹）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { bi, stepOnce } = RLV;
  const GB = () => window.COMPONENTS.GridBoard;

  const A2CLab = {
    name: 'L10A2CLab',
    components: { GridBoard: GB() },
    data: () => ({
      eps: 0.2, alphaW: 0.1, alphaTheta: 0.05,
      theta: null, w: null, visits: null, cur: 1,
      episodes: 0, steps: 0, deltaTrace: [],
      playing: false, timer: null,
    }),
    computed: {
      cfg() { return { size: 4, forbidden: [8, 10], target: 12 }; },
      probs() {
        if (!this.theta) return null;
        return this.theta.map(row => {
          const m = Math.max(...row);
          const e = row.map(x => Math.exp(x - m));
          const s = e.reduce((a, b) => a + b, 0);
          return e.map(x => x / s);
        });
      },
      policy() { return this.probs || Array.from({ length: 16 }, () => [.2,.2,.2,.2,.2]); },
      heat() {
        if (!this.visits) return null;
        const m = Math.max(...this.visits, 1);
        return this.visits.map(x => Math.min(1, Math.pow(x / m, 0.6)));
      },
      deltaPath() {
        const arr = this.deltaTrace.slice(-120);
        if (arr.length < 2) return '';
        const m = Math.max(...arr.map(Math.abs), 1e-6);
        return arr.map((d, i) => `${8 + i / (arr.length - 1) * 264},${32 - Math.max(-1.2, Math.min(1.2, d)) / 1.2 * 26}`).join(' ');
      },
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
      pick(s) {
        if (Math.random() < this.eps) return 1 + Math.floor(Math.random() * 5);
        const p = this.probs[s - 1];
        let x = Math.random(), acc = 0;
        for (let i = 0; i < 5; i++) { acc += p[i]; if (x <= acc) return i + 1; }
        return 5;
      },
      episode() {
        let s = 1;
        for (let t = 0; t < 120; t++) {
          const a = this.pick(s);
          const rr = this.sr(s, a);
          const s2 = rr.next;
          const v2 = s2 === this.cfg.target ? 0 : this.w[s2 - 1];
          const delta = rr.reward + 0.9 * v2 - this.w[s - 1];
          // critic
          this.w[s - 1] += this.alphaW * delta;
          // actor
          const pi = this.probs[s - 1];
          for (let i = 0; i < 5; i++) {
            const grad = (i === a - 1 ? 1 : 0) - pi[i];
            this.theta[s - 1][i] += this.alphaTheta * delta * grad;
          }
          this.visits[s - 1]++;
          this.steps++;
          s = s2; this.cur = s2;
          if (t > 3 && s === this.cfg.target && Math.random() < 0.1) break;
        }
        this.episodes++;
        this.deltaTrace.push(0);   // 占位：用 w 变化量
        const d = Math.abs(this.w.reduce((a, b) => a + b, 0)) / 16;
        this.deltaTrace[this.deltaTrace.length - 1] = Math.min(1.2, d);
        if (this.deltaTrace.length > 120) this.deltaTrace.shift();
        this.theta = this.theta.map(r => [...r]);
        this.w = [...this.w];
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => {
          for (let i = 0; i < 3; i++) this.episode();
          if (this.episodes >= 1000) this.stop();
        }, 60);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() {
        this.stop();
        this.theta = Array.from({ length: 16 }, () => [0,0,0,0,0]);
        this.w = new Array(16).fill(0);
        this.visits = new Array(16).fill(0);
        this.episodes = 0; this.steps = 0; this.cur = 1; this.deltaTrace = [];
      },
    },
    mounted() { this.reset(); },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">A2C 现场训练 · 演员(箭头) + 评论家(格中数字) · A2C live: actor arrows + critic numbers</span>
      </div>
      <div class="ctl-row">
        <span class="ctl-label">ε = <strong>{{ eps.toFixed(2) }}</strong></span>
        <input type="range" min="0" max="0.5" step="0.05" v-model.number="eps" :style="{width:'100px', '--fill': (eps/0.5*100)+'%'}">
        <span class="ctl-label">α<sub>w</sub> = <strong>{{ alphaW.toFixed(2) }}</strong></span>
        <input type="range" min="0.02" max="0.5" step="0.02" v-model.number="alphaW" :style="{width:'100px', '--fill': ((alphaW-0.02)/0.48*100)+'%'}">
        <span class="ctl-label">α<sub>θ</sub> = <strong>{{ alphaTheta.toFixed(2) }}</strong></span>
        <input type="range" min="0.01" max="0.2" step="0.01" v-model.number="alphaTheta" :style="{width:'100px', '--fill': ((alphaTheta-0.01)/0.19*100)+'%'}">
        <button class="btn primary" @click="play">{{ playing ? '⏸ 暂停' : '▶ 训练 Train' }}</button>
        <button class="btn ghost" @click="reset">↺ 重置</button>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:380px">
          <grid-board :size="4" :forbidden="cfg.forbidden" :target="cfg.target" :start="1"
                      :policy="policy" :values="(w||[]).map(x=>+x.toFixed(1))" :heat="heat" :agent="cur"/>
        </div>
        <div class="lab-side">
          <div class="tally" style="margin:0 0 12px">
            <span class="t-label" v-html="bi('回合', 'episodes')"></span>
            <span class="t-num">{{ episodes }}</span>
            <span class="t-label" style="margin-left:12px" v-html="bi('步数', 'steps')"></span>
            <span class="t-num">{{ steps }}</span>
          </div>
          <svg viewBox="0 0 280 64" style="width:100%;max-width:280px;display:block;background:#fff;border:1px solid var(--line);border-radius:10px;margin-bottom:10px">
            <text x="272" y="14" text-anchor="end" style="font:700 9px var(--mono)" fill="#9fb2c8">|w̄| critic confidence</text>
            <polyline v-if="deltaPath" :points="deltaPath" fill="none" stroke="var(--violet)" stroke-width="1.5"/>
          </svg>
          <p class="bi duo" style="font-size:13px" v-html="bi(
            '紫线 = 评论家的平均 |v|（自信心）：从 0 爬升到 ~10 意味着打分体系成形。箭头（演员）与数字（评论家）同步进化——注意它们用的是<strong>同一个 δ</strong>：一次 TD 误差同时修正评分和策略。这就是 actor-critic 的全部效率来源。',
            'The violet line = the critic’s mean |v| (its confidence): climbing from 0 toward ~10 means the scoring system has taken shape. Arrows (actor) and numbers (critic) evolve in lockstep — note they share <strong>the same δ</strong>: one TD error fixes both the scores and the policy. That is the entire efficiency of actor-critic.')"></p>
        </div>
      </div>
    </div>`,
  };

  window.COMPONENTS['l10-ac-lab'] = A2CLab;
})();
