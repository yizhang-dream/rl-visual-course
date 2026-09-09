/* ═══════════════════════════════════════════════════════════
   L9 组件：REINFORCE 现场训练（softmax 策略在 2×2 世界收敛）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { bi, stepOnce } = RLV;
  const GB = () => window.COMPONENTS.GridBoard;

  const ReinforceLab = {
    name: 'L9ReinforceLab',
    components: { GridBoard: GB() },
    data: () => ({
      alpha: 0.05,
      seed: 42,                   // 随机种子固定：Reset 重训两轮轨迹逐点一致
      rand: null,                 // reset() 时以 seed 重建（RLV.rng）
      theta: null, episodes: 0, returns: [],
      playing: false, timer: null,
    }),
    computed: {
      cfg() { return { size: 2, forbidden: [2], target: 4 }; },
      probs() {
        if (!this.theta) return null;
        return this.theta.map(row => {
          const m = Math.max(...row);
          const e = row.map(x => Math.exp(x - m));
          const s = e.reduce((a, b) => a + b, 0);
          return e.map(x => x / s);
        });
      },
      policy() { return this.probs || Array.from({ length: 4 }, () => [.2,.2,.2,.2,.2]); },
      avgReturn() {
        const n = Math.min(this.returns.length, 20);
        if (!n) return null;
        return this.returns.slice(-n).reduce((a, b) => a + b, 0) / n;
      },
      sparkline() {
        // 最近 returns 的折线
        const arr = this.returns.slice(-80);
        if (arr.length < 2) return '';
        const m = Math.max(...arr.map(Math.abs), 1);
        return arr.map((g, i) => `${8 + i / (arr.length - 1) * 264},${45 - g / m * 36}`).join(' ');
      },
    },
    methods: {
      bi,
      episode() {
        const gamma = 0.9;
        // 采样一条轨迹（softmax 策略）
        let s = 1;
        const traj = [];
        for (let t = 0; t < 60; t++) {
          const p = this.probs[s - 1];
          let x = this.rand(), acc = 0, a = 5;
          for (let i = 0; i < 5; i++) { acc += p[i]; if (x <= acc) { a = i + 1; break; } }
          const r = stepOnce(s, a, { size: 2, forbidden: [2], target: 4, mode: 'book' });
          traj.push({ s, a, r: r.reward });
          s = r.next;
          if (s === 4 && t > 3) break;
        }
        // 倒推 G 并更新 θ
        let G = 0;
        const gammaPows = traj.map((_, t) => Math.pow(gamma, t));
        for (let i = traj.length - 1; i >= 0; i--) {
          G = gamma * G + traj[i].r;
          traj[i].G = G;
        }
        traj.forEach((st, t) => {
          const pi = this.probs[st.s - 1];
          for (let i = 0; i < 5; i++) {
            const grad = (i === st.a - 1 ? 1 : 0) - pi[i];
            this.theta[st.s - 1][i] += this.alpha * gammaPows[t] * st.G * grad;
          }
        });
        this.episodes++;
        this.returns.push(traj.reduce((acc, x) => acc + x.r, 0));
        if (this.returns.length > 400) this.returns.shift();
        // 触发响应式
        this.theta = this.theta.map(r => [...r]);
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => {
          for (let i = 0; i < 4; i++) this.episode();
          if (this.episodes >= 2000) this.stop();
        }, 50);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() {
        this.stop();
        this.rand = RLV.rng(this.seed);   // 同 seed → 重训可复现
        this.theta = Array.from({ length: 4 }, () => [0,0,0,0,0]);
        this.episodes = 0; this.returns = [];
      },
    },
    mounted() { this.reset(); },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">REINFORCE 现场训练 · 2×2 世界 · REINFORCE live on the 2×2 world</span>
        <span class="ctl-label">α = <strong>{{ alpha.toFixed(2) }}</strong></span>
        <input type="range" min="0.01" max="0.2" step="0.01" v-model.number="alpha"
               :aria-label="$root.lang === 'en' ? 'learning rate alpha' : '学习率 α'"
               :style="{width:'120px', '--fill': ((alpha-0.01)/0.19*100)+'%'}">
      </div>
      <div class="ctl-row">
        <button class="btn primary" @click="play"><span v-html="playing ? bi('⏸ 暂停','⏸ Pause') : bi('▶ 训练','▶ Train')"></span></button>
        <button class="btn" @click="for(let i=0;i<20;i++) episode()">+20 <span v-html="bi('回合','episodes')"></span></button>
        <button class="btn ghost" @click="reset"><span v-html="bi('↺ 重置','↺ Reset')"></span></button>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:250px">
          <grid-board :size="2" :forbidden="[2]" :target="4" :start="1" :agent="1" :policy="policy"/>
        </div>
        <div class="lab-side">
          <div class="dist" style="margin-bottom:12px">
            <div v-for="(p,i) in probs ? probs[0] : [.2,.2,.2,.2,.2]" :key="i" class="dist-row" style="grid-template-columns:40px 1fr 56px">
              <span class="dist-name">a{{ i+1 }}</span>
              <div class="dist-bar-track"><div class="dist-bar" :style="{width: (p*100)+'%'}"></div></div>
              <span class="dist-val">{{ p.toFixed(2) }}</span>
            </div>
          </div>
          <div class="tally" style="margin:0 0 10px">
            <span class="t-label" v-html="bi('回合', 'episodes')"></span>
            <span class="t-num">{{ episodes }}</span>
            <span class="t-label" style="margin-left:12px" v-html="bi('近 20 回合平均回报', 'avg return (last 20)')"></span>
            <span class="t-num" style="color:var(--gold)">{{ avgReturn == null ? '—' : avgReturn.toFixed(2) }}</span>
          </div>
          <svg viewBox="0 0 280 60" style="width:100%;max-width:280px;display:block;background:var(--chart-bg);border:1px solid var(--line);border-radius:10px;margin-bottom:10px">
            <polyline v-if="sparkline" :points="sparkline" fill="none" stroke="var(--accent)" stroke-width="1.4"/>
            <text v-if="!sparkline" x="140" y="32" text-anchor="middle" style="font:600 11px var(--font)" fill="var(--chart-ink)" v-html="bi('回报曲线将出现在这里','the return curve will appear here')"></text>
          </svg>
          <p class="bi duo" style="font-size:13px" v-html="bi(
            's1 的五个动作概率实时展示：REINFORCE 会把 a3（向下，避开右上禁区）的概率推高、把 a2（向右，闯禁区）压低——推力正比于回报。平均回报曲线从震荡爬向高位，这就是『被奖励强化的行为更常出现』。',
            'The five action probabilities at s1, live: REINFORCE pushes a3 (down, avoiding the top-right forbidden cell) up and a2 (right, into it) down — force proportional to return. The average-return curve climbs out of noise: rewarded behaviours recur.')"></p>
        </div>
      </div>
    </div>`,
  };

  window.COMPONENTS['l9-reinforce-lab'] = ReinforceLab;
})();
