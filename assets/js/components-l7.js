/* ═══════════════════════════════════════════════════════════
   L7 组件：Q-learning/Sarsa 现场训练 / TD 目标对照表
   ═══════════════════════════════════════════════════════════ */
(function () {
  const RLV = window.RLV;
  const { stepOnce, bi } = RLV;
  const GB = () => window.COMPONENTS.GridBoard;
  const MAX_EPISODES = 1000;   // doneMark 与 play 自动停止共用同一上限

  /* ---------- TD 目标对照表 ---------- */
  const TargetTable = {
    name: 'L7TargetTable',
    data: () => ({ rows: [
      { name: 'MC', zh: '真实整条回报', en: 'full real return', tgt: 'r₁ + γr₂ + γ²r₃ + … (到回合结束)', bias: '无偏', var_: '最大', algo: 'MC Basic' },
      { name: 'n-step', zh: 'n 步真实奖励 + 自举一次', en: 'n real rewards + one bootstrap', tgt: 'r₁ + γr₂ + … + γⁿq(sₙ,aₙ)', bias: '中', var_: '中', algo: 'n-step Sarsa' },
      { name: 'Sarsa', zh: '一步真实奖励 + 自举 q', en: 'one reward + bootstrap q', tgt: 'r₁ + γq(s₁,a₁)', bias: '有偏', var_: '小', algo: 'Sarsa (on-policy)' },
      { name: 'Q', zh: '一步奖励 + max 自举', en: 'one reward + max bootstrap', tgt: 'r₁ + γmax_a q(s₁,a)', bias: '有偏', var_: '小', algo: 'Q-learning (off-policy)' },
    ]}),
    template: `
    <div class="lab">
      <div class="lab-head"><span class="lab-title">TD 目标决定一切 · The TD target decides everything</span></div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr>
            <th></th><th v-html="bi('目标取法','target taken as')"></th><th v-html="bi('目标表达式','expression')"></th>
            <th v-html="bi('偏差','bias')"></th><th v-html="bi('方差','variance')"></th><th v-html="bi('所属算法','algorithm')"></th>
          </tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="r.name">
              <td class="row-head">{{ r.name }}</td>
              <td style="font-size:12px" v-html="bi(r.zh, r.en)"></td>
              <td style="font-family:var(--mono); font-size:12px">{{ r.tgt }}</td>
              <td>{{ r.bias }}</td><td>{{ r.var_ }}</td>
              <td style="font-size:12px">{{ r.algo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="bi duo" style="font-size:12.5px;color:var(--ink-3)" v-html="bi(
        '全部套进同一个模板 q ← q − α(q − ¯q)。目标的取法在『真实回报』与『自举+max』之间滑动：越往上越无偏但越抖，越往下越稳且直奔最优。',
        'All fit the same template q ← q − α(q − ¯q). The target slides between “real return” and “bootstrap + max”: toward the top, unbiased but twitchy; toward the bottom, steady and aimed straight at optimality.')"></p>
    </div>`,
    setup() { return { bi }; },
  };

  /* ---------- Q-learning / Sarsa 现场训练 ---------- */
  const QLearnLab = {
    name: 'L7QLearnLab',
    components: { GridBoard: GB() },
    data: () => ({
      algo: 'Q', eps: 0.2, alpha: 0.1,
      seed: 42,                   // 随机种子固定：Reset 重训两轮轨迹逐点一致
      rand: null,                 // reset() 时以 seed 重建（RLV.rng）
      q: null, visits: null, episodes: 0, steps: 0,
      playing: false, timer: null, cur: 1,
    }),
    computed: {
      cfg() { return { size: 4, forbidden: [8, 10], target: 12 }; },
      heat() {
        if (!this.visits) return null;
        const m = Math.max(...this.visits, 1);
        return this.visits.map(x => Math.min(1, Math.pow(x / m, 0.6)));
      },
      greedyPi() {
        if (!this.q) return [];
        return this.q.map(row => {
          const m = Math.max(...row);
          const ties = row.reduce((acc, x, i) => (x > m - 1e-9 ? [...acc, i] : acc), []);
          const r = [0,0,0,0,0];
          ties.forEach(i => r[i] = 1 / ties.length);
          return r;
        });
      },
      values() {
        if (!this.q) return [];
        return this.q.map(row => Math.max(...row));
      },
      doneMark() {
        return this.episodes >= MAX_EPISODES;
      },
    },
    methods: {
      bi,
      pick(s) {
        // ε-greedy 行为策略（随机源走种子化的 this.rand）
        if (this.rand() < this.eps) return 1 + Math.floor(this.rand() * 5);
        const row = this.q[s - 1];
        const m = Math.max(...row);
        const ties = row.reduce((acc, x, i) => (x > m - 1e-9 ? [...acc, i + 1] : acc), []);
        return ties[Math.floor(this.rand() * ties.length)];
      },
      episode() {
        let s = 1;
        let a = this.pick(s);
        for (let t = 0; t < 120; t++) {
          const rr = stepOnce(s, a, this.cfg);
          const s2 = rr.next;
          if (this.algo === 'Q') {
            const target = rr.reward + 0.9 * Math.max(...this.q[s2 - 1]);
            this.q[s - 1][a - 1] += this.alpha * (target - this.q[s - 1][a - 1]);
            a = this.pick(s2);
          } else {
            // Sarsa：先选 a'，再更新
            const a2 = this.pick(s2);
            const target = rr.reward + 0.9 * this.q[s2 - 1][a2 - 1];
            this.q[s - 1][a - 1] += this.alpha * (target - this.q[s - 1][a - 1]);
            a = a2;
          }
          this.visits[s2 - 1]++;
          this.steps++;
          s = s2;
          this.cur = s2;
          if (s === this.cfg.target && this.rand() < 0.05) break;  // 到达后偶尔结束回合
        }
        this.episodes++;
      },
      play() {
        if (this.playing) { this.stop(); return; }
        this.playing = true;
        this.timer = setInterval(() => {
          for (let i = 0; i < 3; i++) this.episode();
          if (this.episodes >= MAX_EPISODES) this.stop();
        }, 60);
      },
      stop() { this.playing = false; if (this.timer) { clearInterval(this.timer); this.timer = null; } },
      reset() {
        this.stop();
        this.rand = RLV.rng(this.seed);   // 同 seed → 重训可复现
        this.q = Array.from({ length: 16 }, () => [0,0,0,0,0]);
        this.visits = new Array(16).fill(0);
        this.episodes = 0; this.steps = 0; this.cur = 1;
      },
    },
    mounted() { this.reset(); },
    unmounted() { this.stop(); },
    template: `
    <div class="lab">
      <div class="lab-head">
        <span class="lab-title">现场训练 · 4×4 作业世界 · Live training on the assignment world</span>
        <div class="seg">
          <button :class="{active: algo==='Q'}" @click="algo='Q'; reset()">Q-learning <span v-html="bi('(off-policy)','(off-policy)')"></span></button>
          <button :class="{active: algo==='S'}" @click="algo='S'; reset()">Sarsa <span v-html="bi('(on-policy)','(on-policy)')"></span></button>
        </div>
      </div>
      <div class="ctl-row">
        <span class="ctl-label">ε = <strong>{{ eps.toFixed(2) }}</strong></span>
        <input type="range" min="0" max="0.6" step="0.05" v-model.number="eps"
               :aria-label="$root.lang === 'en' ? 'exploration rate epsilon' : '探索率 ε'"
               :style="{width:'110px', '--fill': (eps/0.6*100)+'%'}">
        <span class="ctl-label">α = <strong>{{ alpha.toFixed(2) }}</strong></span>
        <input type="range" min="0.02" max="0.6" step="0.02" v-model.number="alpha"
               :aria-label="$root.lang === 'en' ? 'learning rate alpha' : '学习率 α'"
               :style="{width:'110px', '--fill': ((alpha-0.02)/0.58*100)+'%'}">
        <button class="btn primary" @click="play"><span v-html="playing ? bi('⏸ 暂停','⏸ Pause') : bi('▶ 训练','▶ Train')"></span></button>
        <button class="btn" @click="episode()">+1 <span v-html="bi('回合','episode')"></span></button>
        <button class="btn ghost" @click="reset"><span v-html="bi('↺ 重置','↺ Reset')"></span></button>
      </div>
      <div class="lab-body">
        <div class="lab-stage" style="max-width:380px">
          <grid-board :size="4" :forbidden="cfg.forbidden" :target="cfg.target" :start="1"
                      :policy="greedyPi" :values="values.map(x=>+x.toFixed(1))" :heat="heat" :agent="cur"/>
        </div>
        <div class="lab-side">
          <div class="tally" style="margin:0 0 12px">
            <span class="t-label" v-html="bi('回合','episodes')"></span>
            <span class="t-num">{{ episodes }}</span>
            <span class="t-label" style="margin-left:12px" v-html="bi('步数','steps')"></span>
            <span class="t-num">{{ steps }}</span>
          </div>
          <p class="bi duo" style="font-size:13.5px" v-html="bi(
            '看三样东西：① 箭头场怎么从乱指收敛到最优（红色热度 = 访问次数，探索的足迹）；② s2（右上角起点的必经格）的 q 值爬升；③ 两种算法的差异——Sarsa 因为目标里的 a′ 是探索着选的，会学到『更保守』的策略（离禁区远一点）。',
            'Watch three things: ① how the arrow field converges from chaos to optimal (red heat = visit counts, the footprints of exploration); ② the q values climbing at must-pass cells; ③ the difference between the two — Sarsa’s target contains an exploratory a′, so it learns a slightly more conservative policy (keeping distance from forbidden cells).')"></p>
          <div class="callout warn" style="margin:12px 0 0">
            <div class="callout-icon">🎓</div>
            <div class="callout-body"><p class="bi duo" style="font-size:13px" v-html="bi(
              '实验建议：先 ε=0.2 训练 300 回合，再把 ε 拧到 0 继续训练——策略会在最优附近“定格”。调大 α 观察抖动，调小观察变慢——L6 的步长三命运在此重演。',
              'Try: train 300 episodes at ε=0.2, then set ε=0 and keep training — the policy freezes near optimal. Raise α to see jitter, lower it to see slowness — L6’s three step-size fates replay here.')"></p></div>
          </div>
        </div>
      </div>
    </div>`,
  };

  window.COMPONENTS['l7-target-table'] = TargetTable;
  window.COMPONENTS['l7-qlearn-lab'] = QLearnLab;
})();
