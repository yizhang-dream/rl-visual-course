/* ═══════════════════════════════════════════════════════════
   L7 · 时序差分方法（书 Ch.7）：TD(0) / Sarsa / n-step / Q-learning
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §7.1 TD(0) ---- */
  S['l7-td0'] = {
    kicker: 'L7 · §7.1',
    title: { zh: 'TD 学习：走一步就更新', en: 'TD Learning: Update Every Single Step' },
    blocks: [
      { t: 'p', zh: 'MC 的痛点：必须等轨迹走完才能算回报。TD 的解法：把 L6 增量均值式里的"目标"换成 <strong>TD 目标 r + γv(s′)</strong>——即时奖励到手了，"未来回报"用当前估计 v(s′) <strong>自举</strong>顶上，不用等未来真的发生：', en: 'MC\'s pain: returns wait for the episode to end. TD\'s cure: in L6\'s incremental-mean rule, replace the "target" by the <strong>TD target r + γv(s′)</strong> — the immediate reward is already here, and the "future return" is stood in for by the current estimate v(s′) via <strong>bootstrapping</strong>, no waiting for the future to actually happen:' },
      { t: 'formula', lbl: 'TD(0) — Eq. (7.1)',
        html: 'v<sub>t+1</sub>(s<sub>t</sub>) = v<sub>t</sub>(s<sub>t</sub>) − α<sub>t</sub>[v<sub>t</sub>(s<sub>t</sub>) − <span class="mt">(r<sub>t+1</sub> + γv<sub>t</sub>(s<sub>t+1</sub>))</span>]' },
      { t: 'p', zh: '<strong>它从哪来？</strong>书上 Box 7.1 一步一步推：状态值定义变形为 v<sub>π</sub>(s) = E[R + γv<sub>π</sub>(S′)]（Bellman 期望方程），这是关于 v<sub>π</sub>(s) 的方程 g(v) = 0；把期望 E[R + γv<sub>π</sub>(S′)] 换成单次采样 r + γv<sub>t</sub>(s′)，观测噪声 η = E[·] − 采样值——<strong>TD 就是套在 Bellman 期望方程上的 RM 算法</strong>。三条件检查通过（TD 目标是零均值噪声），收敛性定理 7.1 到手。', en: '<strong>Where does it come from?</strong> The book\'s Box 7.1 walks it out: reshape the state-value definition into v<sub>π</sub>(s) = E[R + γv<sub>π</sub>(S′)] (the Bellman expectation equation) — an equation g(v) = 0 in v<sub>π</sub>(s); replace the expectation E[R + γv<sub>π</sub>(S′)] by a single sample r + γv<sub>t</sub>(s′), with observation noise η = E[·] − sample — <strong>TD is the RM algorithm applied to the Bellman expectation equation</strong>. The three conditions check out (the TD target is zero-mean noise), and convergence arrives as Theorem 7.1.' },
      { t: 'formula', lbl: 'TD 误差的解剖 · Anatomy of the TD error — Eq. (7.6)',
        html: 'v<sub>t+1</sub>(s<sub>t</sub>) = <span style="color:var(--green)">v<sub>t</sub>(s<sub>t</sub>)</span> − α<sub>t</sub>[ <span style="color:var(--green)">v<sub>t</sub>(s<sub>t</sub>)</span> − (<span style="color:var(--gold)">r<sub>t+1</sub> + γv<sub>t</sub>(s<sub>t+1</sub>)</span>) ]<br><span style="font-size:13px;color:var(--ink-3)">当前估计 · current &nbsp;&nbsp;|&nbsp;&nbsp; TD 目标 ¯v<sub>t</sub> · TD target（金）＝二者的差 δ<sub>t</sub> 驱动一切 · their gap δ<sub>t</sub> drives everything</span>' },
      { t: 'steps', items: [
        { zh: '<strong>bootstrapping</strong>：更新里用了 v<sub>t</sub>(s′) 这个<strong>估计值</strong>当目标的一部分——拿估计估估计。MC 不自举（用真实回报），所以无偏但高方差；TD 自举，有偏但方差小、还快得多。', en: '<strong>Bootstrapping</strong>: the update uses the <em>estimate</em> v<sub>t</sub>(s′) as part of the target — estimating from estimates. MC does not bootstrap (real returns), hence unbiased but high-variance; TD bootstraps — biased but low-variance and much faster.' },
        { zh: '<strong>sweep-free</strong>：TD 每步只更新当前访问的那个状态，其余不动。MC Basic 要等整条轨迹、MC Exploring Starts 要倒扫一遍，TD 走一步更新一步——在线、增量、持续学习的雏形。', en: '<strong>Sweep-free</strong>: each step updates only the currently visited state; the rest stay put. MC Basic waits for whole trajectories, MC Exploring Starts back-sweeps them — TD updates as it walks: online, incremental, the embryo of continual learning.' },
      ]},
    ],
  };

  /* ---- §7.2 Sarsa ---- */
  S['l7-sarsa'] = {
    kicker: 'L7 · §7.2',
    title: { zh: 'Sarsa：直接学动作价值', en: 'Sarsa: Learning Action Values Directly' },
    blocks: [
      { t: 'p', zh: 'TD(0) 只能估状态值，而改进策略需要 q。Sarsa 把 TD 的"状态版"照抄成"动作版"——更新对象换成 q(s,a)，目标里的 v(s′) 换成 q(s′,a′)：', en: 'TD(0) estimates only state values, but improving policies needs q. Sarsa transcribes TD from "state edition" to "action edition" — the updated object becomes q(s,a) and the target\'s v(s′) becomes q(s′,a′):' },
      { t: 'formula', lbl: 'Sarsa — Eq. (7.12)',
        html: 'q<sub>t+1</sub>(s<sub>t</sub>, a<sub>t</sub>) = q<sub>t</sub>(s<sub>t</sub>, a<sub>t</sub>) − α<sub>t</sub>[q<sub>t</sub>(s<sub>t</sub>, a<sub>t</sub>) − (r<sub>t+1</sub> + γq<sub>t</sub>(s<sub>t+1</sub>, a<sub>t+1</sub>))]' },
      { t: 'p', zh: '名字来源：每次更新需要五元组 <strong>(s<sub>t</sub>, a<sub>t</sub>, r<sub>t+1</sub>, s<sub>t+1</sub>, a<sub>t+1</sub>)</strong>——state-action-reward-state-action。数学身份：解动作价值版 Bellman 方程 q<sub>π</sub>(s,a) = E[R + γq<sub>π</sub>(S′,A′)|s,a] 的 RM 算法（定理 7.2 保证收敛）。<strong>Sarsa = TD(0) + 策略改进的组合拳</strong>：按 ε-greedy 采轨迹（探索），每步更新 q，每步顺便贪心改策略——评估与改进逐事件交替，这正是广义策略迭代最细的粒度。', en: 'The name: each update needs the quintuple <strong>(s<sub>t</sub>, a<sub>t</sub>, r<sub>t+1</sub>, s<sub>t+1</sub>, a<sub>t+1</sub>)</strong> — state-action-reward-state-action. Its mathematical identity: the RM algorithm solving the action-value Bellman equation q<sub>π</sub>(s,a) = E[R + γq<sub>π</sub>(S′,A′)|s,a] (convergence: Theorem 7.2). <strong>Sarsa = TD(0) plus policy improvement as one combo</strong>: roll ε-greedy trajectories (exploration), update q each step, and greedily touch up the policy each step — evaluation and improvement alternating at the finest possible grain, the finest granularity of generalised policy iteration.' },
      { t: 'callout', variant: 'warn', zh: '<strong>为什么 Sarsa 的策略要用 ε-greedy？</strong>书上答：因为这条策略还要负责产生样本——它必须具有探索性才能把每个 (s,a) 都走到。这就是 on-policy 的含义：<strong>被评估的策略 = 产生数据的策略</strong>。代价：收敛到的是 ε-greedy 家族内的最优（L5 的"是又不是"再现）。', en: '<strong>Why is Sarsa\'s policy ε-greedy?</strong> The book answers: that same policy must also generate the samples — it has to explore so that every (s,a) gets visited. This is what on-policy means: <strong>the evaluated policy = the data-generating policy</strong>. The price: convergence to the best within the ε-greedy family (L5\'s "yes and no" returns).' },
    ],
  };

  /* ---- §7.3 n-step ---- */
  S['l7-nstep'] = {
    kicker: 'L7 · §7.3',
    title: { zh: 'n-step Sarsa：自举与采样的连续谱', en: 'n-step Sarsa: A Spectrum between Bootstrapping and Sampling' },
    blocks: [
      { t: 'p', zh: 'Sarsa 的目标只用一步真实奖励（其余自举）；MC 的目标全是真实奖励（一步都不自举）。<strong>n-step Sarsa</strong> 把两者接成连续谱——目标取 n 步真实奖励再加 γ<sup>n</sup>·q(s<sub>t+n</sub>, a<sub>t+n</sub>)：', en: 'Sarsa\'s target uses one step of real reward (bootstrapping the rest); MC\'s target is all real rewards (no bootstrapping at all). <strong>n-step Sarsa</strong> bridges them — the target takes n real rewards plus γ<sup>n</sup>·q(s<sub>t+n</sub>, a<sub>t+n</sub>):' },
      { t: 'formula', lbl: 'n-step Sarsa — Eq. (7.17)',
        html: 'q<sub>t+1</sub>(s<sub>t</sub>, a<sub>t</sub>) = q<sub>t</sub>(s<sub>t</sub>, a<sub>t</sub>) − α<sub>t</sub>[q<sub>t</sub>(s<sub>t</sub>, a<sub>t</sub>) − (r<sub>t+1</sub> + γr<sub>t+2</sub> + ⋯ + γ<sup>n</sup>q<sub>t</sub>(s<sub>t+n</sub>, a<sub>t+n</sub>))]' },
      { t: 'p', zh: 'n = 1 退化为 Sarsa；n = ∞（且 α = 1）退化为 MC。统计学的两难在中间震荡：<strong>n 大 → 偏差小、方差大</strong>（真实信息多，但长尾抖动厉害）；<strong>n 小 → 偏差大、方差小</strong>（自举误差，但很稳）。实现上要用"延迟更新"：q(s<sub>t</sub>,a<sub>t</sub>) 要等到 t+n 时刻凑齐 n 步奖励才能更新。', en: 'n = 1 degenerates to Sarsa; n = ∞ (with α = 1) to MC. The statistical dilemma oscillates in between: <strong>large n → low bias, high variance</strong> (more real information, but the long tail wobbles); <strong>small n → high bias, low variance</strong> (bootstrapping error, but steady). Implementation requires "delayed updates": q(s<sub>t</sub>,a<sub>t</sub>) must wait until time t+n for the n rewards to accrue.' },
    ],
  };

  /* ---- §7.4 Q-learning ---- */
  S['l7-qlearning'] = {
    kicker: 'L7 · §7.4',
    title: { zh: 'Q-learning：直接解最优方程的无模型王者', en: 'Q-learning: Directly Solving the Optimality Equation, Model-Free' },
    blocks: [
      { t: 'p', zh: 'Sarsa 估的是"给定策略"的 q，还要配上改进步才能找最优。<strong>Q-learning</strong> 一步到位——TD 目标里的 q(s′,a′) 换成 <strong>max<sub>a</sub> q(s′,a)</strong>：', en: 'Sarsa estimates the q of a <em>given</em> policy and still needs an improvement step to seek optimality. <strong>Q-learning</strong> finishes in one stroke — the target\'s q(s′,a′) becomes <strong>max<sub>a</sub> q(s′,a)</strong>:' },
      { t: 'formula', lbl: 'Q-learning — Eq. (7.18)',
        html: 'q<sub>t+1</sub>(s<sub>t</sub>, a<sub>t</sub>) = q<sub>t</sub>(s<sub>t</sub>, a<sub>t</sub>) − α<sub>t</sub>[q<sub>t</sub>(s<sub>t</sub>, a<sub>t</sub>) − (r<sub>t+1</sub> + γ <span class="mt">max<sub>a</sub></span> q<sub>t</sub>(s<sub>t+1</sub>, a))]' },
      { t: 'p', zh: '身份大不同：<strong>Q-learning 是解动作价值版 Bellman 最优方程 q(s,a) = E[R + γmax<sub>a</sub>q(S′,a)] 的 RM 算法</strong>（书上 Box 7.5）——还记得 L3 吗？max 进方程，最优性进解。所以 Q-learning 直接估计<strong>最优</strong>动作价值 q*，收敛到 v* 对应的 q 表。', en: 'A very different identity: <strong>Q-learning is the RM algorithm solving the action-value Bellman optimality equation q(s,a) = E[R + γmax<sub>a</sub>q(S′,a)]</strong> (book Box 7.5) — recall L3: the max enters the equation, optimality enters the solution. Q-learning thus directly estimates the <strong>optimal</strong> action values q*, converging to the q-table behind v*.' },
      { t: 'steps', items: [
        { zh: '<strong>off-policy 的含义</strong>：产生数据的策略（behavior policy，ε-greedy 负责探索）和被评估/改进的策略（target policy，贪心）<strong>可以是两个</strong>。因为 max 只对着 q 表算，不需要"下一个动作"真的被采到——数据采集方式与评估对象解耦。', en: '<strong>What off-policy means</strong>: the behavior policy generating data (ε-greedy, in charge of exploration) and the target policy being evaluated/improved (greedy) <strong>can be two different things</strong> — the max reads the q-table directly and does not care whether the next action was actually taken: data collection is decoupled from evaluation.' },
        { zh: '<strong>样本还更省</strong>：Sarsa 每步要 (r, s′, a′) 三件套，Q-learning 只要 (r, s′)——a′ 不需要。 书上 Figure 7.4 展示了 off-policy 学习：即使 behavior 策略是完全随机的，Q-learning 依然收敛到最优价值。', en: '<strong>And it saves samples</strong>: Sarsa needs the triple (r, s′, a′) each step; Q-learning only (r, s′) — no a′ required. The book\'s Figure 7.4 shows off-policy learning: even with a fully random behavior policy, Q-learning converges to the optimal values.' },
        { zh: '<strong>两个极端撞车</strong>：Q-learning 的目标也用了 max（像值迭代），也用了自举（像 Sarsa）——它是"值迭代的无模型版"。行为策略保证探索（大数定律的原料），目标策略保证最优性（BOE 的要求），两全其美。', en: '<strong>Two extremes collide</strong>: Q-learning\'s target uses the max (like value iteration) and bootstraps (like Sarsa) — it is "value iteration made model-free". The behavior policy secures exploration (raw material for the law of large numbers); the target policy secures optimality (the BOE\'s demand). Best of both.' },
      ]},
      { t: 'widget', component: 'l7-qlearn-lab' },
    ],
  };

  /* ---- §7.5 统一视角 ---- */
  S['l7-unified'] = {
    kicker: 'L7 · §7.5',
    title: { zh: '统一视角：一张表看穿所有算法', en: 'A Unified View: One Table Fits All Algorithms' },
    blocks: [
      { t: 'p', zh: '书用一个模板装下本章全部算法（外加 MC）：<strong>q<sub>t+1</sub>(s<sub>t</sub>,a<sub>t</sub>) = q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − α<sub>t</sub>[q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − ¯q<sub>t</sub>]</strong>。全部区别只在 TD 目标 ¯q<sub>t</sub> 怎么取：', en: 'The book fits every algorithm of this chapter (plus MC) into one template: <strong>q<sub>t+1</sub>(s<sub>t</sub>,a<sub>t</sub>) = q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − α<sub>t</sub>[q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − ¯q<sub>t</sub>]</strong>. All the differences live in how the TD target ¯q<sub>t</sub> is taken:' },
      { t: 'widget', component: 'l7-target-table' },
      { t: 'p', zh: '这张表是全书的"算法家谱"：目标越靠"真实回报"端，偏差越小方差越大；越靠"自举+max"端，方差越小、越偏但直奔最优。下一课的函数近似会把这个模板里的 q 表换成神经网络——模板本身终生有效。', en: 'This table is the book\'s algorithm family tree: targets nearer the "real return" end have less bias and more variance; nearer the "bootstrap + max" end, less variance, some bias, and a straight road to optimality. Next lecture swaps the q-table for a neural network — the template itself serves for life.' },
    ],
  };

  /* ---- §7.6 总结 ---- */
  S['l7-summary'] = {
    kicker: 'L7 · §7.6',
    title: { zh: '本章总结：时序差分三兄弟', en: 'Chapter Summary: The Three TD Siblings' },
    blocks: [
      { t: 'p', zh: 'TD(0) 估 v、Sarsa 估 q<sub>π</sub>、Q-learning 估 q*——三个算法是同一个 RM 骨架配三种目标。加上 n-step 和 MC 的极端情形，本章完成了"无模型强化学习"的主干搭建：<strong>评估与改进交替</strong>的广义策略迭代 + <strong>自举</strong>的样本效率 + <strong>off-policy</strong> 的解耦能力。书末点出一个工程真相：实践中学习率常取小常数而非衰减到零——因为被评估的策略一直在变（非平稳），衰减太早会"学不动"；小常数带来的小幅波动是可以接受的代价。', en: 'TD(0) estimates v, Sarsa estimates q<sub>π</sub>, Q-learning estimates q* — one RM skeleton wearing three targets. With n-step and the MC extreme, this chapter erects the backbone of model-free RL: <strong>alternating evaluation–improvement</strong> (generalised policy iteration), <strong>bootstrapping</strong> for sample efficiency, and <strong>off-policy</strong> decoupling. The book closes with an engineering truth: in practice the learning rate is a small constant rather than decaying to zero — because the policy being evaluated keeps changing (nonstationarity), and a decayed rate soon cannot learn; small fluctuations are the acceptable price.' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：到目前为止 q 都是"一张表"——每个 (s,a) 一格。状态太多（围棋 10<sup>170</sup>）表格就爆了。第 8 章：<strong>用函数近似 q(s,a)</strong>——参数化、可泛化、可用梯度下降训练。L6 的 SGD 将再挑大梁。', en: 'Next lecture teaser: so far q has been a table — one cell per (s,a). With huge state spaces (Go has ~10<sup>170</sup> states) tables explode. Chapter 8: <strong>approximate q(s,a) with a function</strong> — parameterised, generalising, trainable by gradient descent. L6\'s SGD returns to centre stage.' },
    ],
  };

  /* ---- L7 长推理 ---- */
  S['l7-reasoning'] = {
    kicker: 'L7 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：自举的胜利', en: 'The Long Coherent Reasoning: The Triumph of Bootstrapping' },
    blocks: [
      { t: 'p', zh: '本章推理链：MC 要等轨迹结束 → 用 v(s′) 自举顶替未来 → TD = 解 Bellman 期望方程的 RM → 换成 q 就是 Sarsa → 目标取 n 步得连续谱 → 目标加 max 直接解 BOE 就是 Q-learning → 一个模板统一全部 → 学习率之争（衰减 vs 常数）。', en: 'This chapter\'s spine: MC waits for the episode’s end → bootstrap the future with v(s′) → TD = RM on the Bellman expectation equation → swap in q to get Sarsa → n real rewards make the spectrum → add max to the target and the BOE is solved directly: Q-learning → one template unifies all → the learning-rate dispute (decay vs constant).' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l7' } },
    ],
  };

  /* ---- L7 代码 ---- */
  S['l7-code'] = {
    kicker: 'L7 · 动手 · Hands-on',
    title: { zh: '代码精讲：Sarsa 与 Q-learning 对肩跑', en: 'Code Walkthrough: Sarsa and Q-learning Shoulder to Shoulder' },
    blocks: [
      { t: 'p', zh: '两个算法只差一行——TD 目标里"下一个动作的 q"还是"下一状态的最大 q"。并排写出来，on-policy 与 off-policy 的工程差别一目了然：Sarsa 采样时必须先算 a′，Q-learning 不用。', en: 'The two algorithms differ by a single line — whether the TD target reads "the next action\'s q" or "the max q of the next state". Written side by side, the engineering difference between on- and off-policy pops out: Sarsa must compute a′ while sampling; Q-learning does not.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l7' } },
    ],
  };

  /* ---- L7 Q&A ---- */
  S['l7-qa'] = {
    kicker: 'L7 · §7.7',
    title: { zh: '问答：时序差分九连问（精选）', en: 'Q&A: Nine Questions on TD (Selected)' },
    blocks: [
      { t: 'p', zh: 'on/off-policy 之辨、学习率之争、要不要学全部状态——本章最容易被面试官追问的点都在这里。', en: 'The on/off-policy distinction, the learning-rate dispute, and "do we need all states optimal" — the points interviewers love, all here.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l7' } },
    ],
  };

  /* ═══ L7 长推理链 ═══ */
  D.reasoningSets['l7'] = [
    { link: '起点 · Start',
      title: { zh: 'MC 必须等轨迹结束', en: 'MC must wait for the episode to end' },
      zh: 'MC 的回报要从轨迹末端倒推，意味着：必须采完整条轨迹、必须等批量、在线场景直接出局。增量均值式已经把更新写成了"来一个样本动一次"——能不能让回报也这样？',
      en: 'MC returns are computed backwards from the episode end, implying: collect the whole trajectory first, batch first, and online settings are out. The incremental-mean rule already updates on every sample — can the return do the same?',
      question: '"未来回报"能提前知道吗？' },
    { link: '自举 · Bootstrap',
      title: { zh: '用估计顶替未来：TD 目标 r + γv(s′)', en: 'Stand in for the future: the TD target r + γv(s′)' },
      zh: 'E[G_t|s] = E[R + γv_π(S′)|s]（Bellman 期望方程）。把期望换成单次采样：目标 = r + γv_t(s′)。未知未来被当前估计顶替——bootstrapping。这正是把 RM 算法套在 Bellman 方程上（Box 7.1），噪声条件天然满足。',
      en: 'E[G_t|s] = E[R + γv_π(S′)|s] (the Bellman expectation equation). Swap the expectation for one sample: target = r + γv_t(s′). The unknown future is stood in for by the current estimate — bootstrapping. This is the RM algorithm wrapped around the Bellman equation (Box 7.1), with noise conditions naturally met.',
      question: '只更新访问到的那个状态，够吗？' },
    { link: '落点 · Landing',
      title: { zh: 'TD(0)：在线、增量、sweep-free', en: 'TD(0): online, incremental, sweep-free' },
      zh: '每走一步只更新 v(s_t)，其余不动。与 MC 对比：MC 无偏高方差、必须等轨迹；TD 有偏低方差、走一步更新一步。偏差来自自举（目标里的 v_t 本身不准），方差小是因为只吃一步噪声。',
      en: 'Each step updates only v(s_t); everything else stays put. Against MC: MC is unbiased, high-variance, waits for episodes; TD is biased, low-variance, updates per step. The bias comes from bootstrapping (the target\'s v_t is itself inaccurate); the low variance from only one step of noise.',
      question: '改进策略需要 q，TD 只给了 v，怎么办？' },
    { link: '升维 · Upgrade',
      title: { zh: 'Sarsa：把整条 TD 搬进 q 世界', en: 'Sarsa: move the whole TD into q-land' },
      zh: '照抄 TD，把 v 换成 q：目标变 r + γq(s′,a′)，五元组 (s,a,r,s′,a′) 得名 Sarsa。它解的是动作价值版 Bellman 期望方程（定理 7.2 收敛）。配上 ε-greedy 采样与贪心改进，评估与改进逐事件交替——最细粒度的广义策略迭代。',
      en: 'Copy TD with v→q: the target becomes r + γq(s′,a′), and the quintuple (s,a,r,s′,a′) names Sarsa. It solves the action-value Bellman expectation equation (Theorem 7.2). With ε-greedy sampling and greedy improvement, evaluation and improvement alternate event by event — generalised policy iteration at its finest grain.',
      question: '能不能不等策略评估完，直接瞄着最优去？' },
    { link: '瞄准最优 · Aim at optimal',
      title: { zh: 'Q-learning：目标里塞进 max', en: 'Q-learning: stuff a max into the target' },
      zh: '目标换 r + γmax_a q(s′,a)——这是动作价值版 Bellman 最优方程的 RM 迭代。max 意味着"下一状态按最优价值算"，与实际执行的（探索性）动作无关：behavior 与 target 解耦 = off-policy。样本还省了一个：不再需要 a′。',
      en: 'Swap the target for r + γmax_a q(s′,a) — the RM iteration of the action-value Bellman optimality equation. The max means “the next state counts at its optimal value”, regardless of the actually executed (exploratory) action: behavior and target policies decouple = off-policy. Even one sample saved: a′ is no longer needed.',
      question: '这些目标五花八门，有共同模板吗？' },
    { link: '统一 · Unify',
      title: { zh: '一个模板：q ← q − α(q − ¯q)', en: 'One template: q ← q − α(q − ¯q)' },
      zh: 'Sarsa 目标 = r + γq(s′,a′)；n-step = r + γr₂ + … + γⁿq(s_{t+n},a_{t+n})（n=1 是 Sarsa，n=∞ 且 α=1 是 MC——偏差与方差的连续谱）；Q-learning 目标 = r + γmax。全部套进 q ← q − α(q − ¯q)。目标怎么取，决定你学的是谁的价值、快慢与偏差。',
      en: 'Sarsa target = r + γq(s′,a′); n-step = r + γr₂ + … + γⁿq(s_{t+n},a_{t+n}) (n=1 is Sarsa, n=∞ with α=1 is MC — a bias–variance spectrum); Q-learning target = r + γmax. All fit q ← q − α(q − ¯q). How you take the target decides whose value you learn, at what speed and bias.',
      question: null },
  ];

  /* ═══ L7 代码块 ═══ */
  const srcSARSA = `import numpy as np

def eps_greedy(q_row, eps):
    """epsilon-greedy: greedy action gets the lion's share, others split eps."""
    n_a = len(q_row)
    a_star = int(np.argmax(q_row))
    p = np.full(n_a, eps / n_a)
    p[a_star] += 1.0 - eps
    return np.random.choice(n_a, p=p)

def sarsa(env, episodes=5000, gamma=0.9, alpha=0.1, eps=0.1, max_steps=200):
    """Algorithm: on-policy Sarsa. Each step needs (s, a, r, s', a')."""
    n, n_a = env.num_states, len(env.action_space)
    q = np.zeros((n, n_a))
    for ep in range(episodes):
        s = env.reset()
        a = eps_greedy(q[s], eps)                 # a' must be chosen BEFORE the step
        for _ in range(max_steps):
            s2, r, done, _ = env.step(a)          # interact
            a2 = eps_greedy(q[s2], eps)           # choose the NEXT action now!
            # TD update: target = r + gamma * q[s2, a2]   (the sampled a', not max)
            q[s, a] += alpha * (r + gamma * q[s2, a2] - q[s, a])
            s, a = s2, a2
            if done:
                break
    return q

def q_learning(env, episodes=5000, gamma=0.9, alpha=0.1, eps=0.1, max_steps=200):
    """Off-policy Q-learning. Each step needs only (s, a, r, s')."""
    n, n_a = env.num_states, len(env.action_space)
    q = np.zeros((n, n_a))
    for ep in range(episodes):
        s = env.reset()
        for _ in range(max_steps):
            a = eps_greedy(q[s], eps)             # behavior: explore
            s2, r, done, _ = env.step(a)
            # TD update: target = r + gamma * max_{a'} q[s2, a']  (no a' sampled)
            q[s, a] += alpha * (r + gamma * np.max(q[s2]) - q[s, a])
            s = s2
            if done:
                break
    pi = q.argmax(axis=1)                          # greedy extraction
    return q, pi`;

  D.codeFileSets['l7'] = [
    {
      id: 'l7-sarsa', file: 'td_algorithms.py — Sarsa 与 Q-learning', tab: '① Sarsa vs Q-learning',
      intro: { zh: '两个函数几乎逐行相同，<strong>唯一的差别在 TD 目标</strong>：Sarsa 是 <code class="inline">q[s2, a2]</code>（要先采出 a′——on-policy），Q-learning 是 <code class="inline">np.max(q[s2])</code>（不用采 a′——off-policy）。找不同是理解这两个算法最快的方式。', en: 'The two functions are line-for-line identical, <strong>except the TD target</strong>: Sarsa reads <code class="inline">q[s2, a2]</code> (a′ must be sampled first — on-policy); Q-learning reads <code class="inline">np.max(q[s2])</code> (no a′ sampled — off-policy). Spot-the-difference is the fastest way to understand them.' },
      code: srcSARSA,
      notes: [
        { lines: [2, 6], tag: 'eps-greedy', zh: 'ε-greedy 采样器：贪心动作概率 1−ε+ε/|A|，其余均分 ε/|A|。这正是式 (5.5) 的解——它在"利用"（大概率走贪心）与"探索"（每个动作都可能被试）之间取平衡。', en: 'The ε-greedy sampler: the greedy action takes 1−ε+ε/|A|, the rest split ε/|A| — the solution of Eq. (5.5), balancing exploitation (mostly greedy) against exploration (every action remains possible).' },
        { lines: [17, 18], tag: 'sarsa order ★', zh: '<strong>Sarsa 的关键时序</strong>：先选 a′ 再执行——因为更新目标里要用 q[s2,a2]。这也意味着"下一步实际走的就是用来更新的那个动作"：评估与行为同一条策略（on-policy 的字面含义）。', en: '<strong>Sarsa’s crucial ordering</strong>: choose a′ BEFORE stepping — the update target needs q[s2,a2]. This also means the next action actually taken IS the one used in the update: evaluation and behaviour are the same policy (the literal meaning of on-policy).' },
        { lines: [35, 35], tag: 'q-learning ★', zh: '<strong>与 Sarsa 唯一的差别行</strong>：<code class="inline">np.max(q[s2])</code>。max 让目标直接指向最优价值——哪怕探索时走了臭棋，更新时仍按"下一步走最好的"记账。这是 off-policy 的能量来源。', en: '<strong>The only line that differs from Sarsa</strong>: <code class="inline">np.max(q[s2])</code>. The max points the target straight at optimal values — even if exploration took a bad step, the update books it as if the best were taken next. This is where off-policy gets its power.' },
        { lines: [38, 40], tag: 'extract', zh: 'Q-learning 收敛后 <code class="inline">argmax</code> 直接给出最优策略——不需要再跑改进步（目标里已经带 max 了）。Sarsa 的 q 则对应"训练时的 ε-greedy 策略"，直接 argmax 会有一点 ε 的残留偏差。', en: 'Once Q-learning converges, <code class="inline">argmax</code> hands over the optimal policy — no separate improvement step (the max was already inside the target). Sarsa’s q corresponds to the training-time ε-greedy policy; a direct argmax carries a slight ε residue.' },
      ],
    },
  ];

  /* ═══ L7 Q&A ═══ */
  D.qaSets['l7'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '为什么 Sarsa 的策略要用 ε-greedy 更新？', en: 'Why is Sarsa’s policy updated to be ε-greedy?' },
      a: { zh: '因为这条策略还要负责<strong>产生样本</strong>。它是 on-policy 的：被评估的就是走路的策略，必须带探索性才能保证每个 (s,a) 被充分访问、q 估得准。', en: 'Because that policy must also <strong>generate the samples</strong>. Sarsa is on-policy: the evaluated policy is the walking policy, so it must explore to keep every (s,a) well visited and q well estimated.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '定理要求学习率衰减到零，实践为什么常用小常数？', en: 'Theorems require a decaying α, so why is a small constant used in practice?' },
      a: { zh: '因为被评估的策略一直在变（非平稳）。策略变 → 要估的目标就在变 → 衰减太早的学习率会"追不动"。小常数能持续跟踪，代价是估计会永久小幅波动——波动幅度 ∝ α，够小就行。', en: 'Because the policy being evaluated keeps changing (nonstationarity). A changing policy means a moving estimation target; a decayed rate soon cannot chase it. A small constant keeps tracking, at the price of permanent small fluctuations — amplitude ∝ α, small enough is fine.' } },
    { tag: 'Q3 · 书上原问', q: { zh: '该学所有状态的最优策略，还是只学一条路？', en: 'Learn optimal policies for all states, or just one path?' },
      a: { zh: '看任务。只要一条从起点到目标的好路径，数据需求小（不必覆盖全部 (s,a)），但<strong>不保证最优</strong>——没探索到的更优路径会被错过。要全局最优就得充分探索全部状态-动作对。', en: 'Task-dependent. A single good path from start to target needs little data (no need to cover all (s,a)) but is <strong>not guaranteed optimal</strong> — better unexplored paths are missed. Global optimality requires exploring all pairs.' } },
    { tag: 'Q4 · 书上原问', q: { zh: '为什么 Q-learning 是 off-policy 而其他 TD 是 on-policy？', en: 'Why is Q-learning off-policy while the other TD algorithms are on-policy?' },
      a: { zh: '根本原因在目标：Q-learning 解的是<strong>最优</strong>方程（目标带 max，只依赖 q 表不依赖下一步实际动作），数据怎么采与学什么解耦；Sarsa/TD 解的是给定策略的方程，目标里的 q(s′,a′) 必须是"实际走出的那个 a′"，数据与评估绑死。', en: 'It is all in the target: Q-learning solves the <strong>optimality</strong> equation (the max reads the q-table, indifferent to the actually taken next action), so data collection is decoupled from what is learned; Sarsa/TD solve given-policy equations whose target q(s′,a′) must be the action actually taken — data and evaluation are welded together.' } },
    { tag: 'Q5 · 书上原问', q: { zh: '为什么 Q-learning 的目标策略用贪心而不是 ε-greedy？', en: 'Why is Q-learning’s target policy greedy rather than ε-greedy?' },
      a: { zh: '因为 target 策略不负责产生样本，不需要探索性——它只需要"正确"（最优）。探索由 behavior 策略（ε-greedy）负责。分工明确：behavior 管探索，target 管最优。', en: 'The target policy does not generate samples, so it need not explore — it only needs to be correct (optimal). Exploration is the behavior policy’s (ε-greedy) job. Clean division: behavior explores, target optimises.' } },
    { tag: 'Q6 · 补充', q: { zh: 'TD 自举有偏，为什么大家还是爱用它？', en: 'TD bootstrapping is biased — why does everyone still love it?' },
      a: { zh: '三个字：快、稳、在线。不用等轨迹结束（可边走边学）、方差小（只吃一步噪声）、内存 O(1)（无需存轨迹）。偏差会随着 q 估计变准而自我修正——自举的偏差是"会呼吸的偏差"，MC 的高方差才是真正难缠的。', en: 'Three words: fast, steady, online. No waiting for episode ends (learn while walking), low variance (one step of noise per update), O(1) memory (no trajectory storage). The bias self-corrects as q sharpens — a living bias; MC’s high variance is the truly stubborn one.' } },
  ];

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 7,
    label: 'L7 · 时序差分方法',
    items: [
      { id: 'l7-td0', zh: 'TD(0)：走一步更新一步', en: '§7.1 TD learning' },
      { id: 'l7-sarsa', zh: 'Sarsa', en: '§7.2 Sarsa' },
      { id: 'l7-nstep', zh: 'n-step Sarsa', en: '§7.3 n-step Sarsa' },
      { id: 'l7-qlearning', zh: 'Q-learning', en: '§7.4 Q-learning' },
      { id: 'l7-unified', zh: '统一视角', en: '§7.5 A unified view' },
      { id: 'l7-summary', zh: '本章总结', en: '§7.6 Summary' },
      { id: 'l7-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l7-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l7-qa', zh: '问答', en: 'Q&A · §7.7' },
    ],
  });
  const l7 = D.otherLectures.find(l => l.no === 7);
  if (l7) l7.done = true;
})();
