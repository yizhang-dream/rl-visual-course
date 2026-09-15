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
        tex: String.raw`v_{t+1}(s_t) = v_t(s_t) - \alpha_t\big[v_t(s_t) - \htmlClass{fx-accent}{(r_{t+1} + \gamma v_t(s_{t+1}))}\big]` },
      { t: 'p', zh: '<strong>它从哪来？</strong>书上 Box 7.1 一步一步推：状态值定义变形为 v<sub>π</sub>(s) = E[R + γv<sub>π</sub>(S′)]（Bellman 期望方程），这是关于 v<sub>π</sub>(s) 的方程 g(v) = 0；把期望 E[R + γv<sub>π</sub>(S′)] 换成单次采样 r + γv<sub>t</sub>(s′)，观测噪声 η = E[·] − 采样值——<strong>TD 就是套在 Bellman 期望方程上的 RM 算法</strong>。三条件检查通过（TD 目标是零均值噪声），收敛性定理 7.1 到手。', en: '<strong>Where does it come from?</strong> The book\'s Box 7.1 walks it out: reshape the state-value definition into v<sub>π</sub>(s) = E[R + γv<sub>π</sub>(S′)] (the Bellman expectation equation) — an equation g(v) = 0 in v<sub>π</sub>(s); replace the expectation E[R + γv<sub>π</sub>(S′)] by a single sample r + γv<sub>t</sub>(s′), with observation noise η = E[·] − sample — <strong>TD is the RM algorithm applied to the Bellman expectation equation</strong>. The three conditions check out (the TD target is zero-mean noise), and convergence arrives as Theorem 7.1.' },
      { t: 'formula', lbl: 'TD 目标的推导链 · Where r + γv(s′) comes from — Box 7.1',
        tex: String.raw`\begin{gathered} v_\pi(s) = \mathbb{E}[G\mid s]\,\htmlClass{fx-dim}{\text{(定义)}} = \mathbb{E}[R + \gamma G'\mid s]\,\htmlClass{fx-dim}{\text{(回报拆一步)}} = \mathbb{E}\big[R + \htmlClass{fx-green}{\gamma v_\pi(S')}\mid s\big]\,\htmlClass{fx-dim}{\text{(重期望折叠)}}\\[2pt] \Longrightarrow\; \text{采样} \;\Longrightarrow\; \htmlClass{fx-accent}{r + \gamma v_t(s')} \end{gathered}` },
      { t: 'steps', items: [
        { zh: '<strong>视角一：方程变形——为什么"只看一步"是合法的</strong>。G = R + γG′ 只是回报定义；关键一步是<strong>重期望公式</strong>（tower property）把 E[G′|s] 折叠成 E[v<sub>π</sub>(S′)|s]："未来整段的期望"换成"下一状态价值的期望"，一步就够。这一折叠不丢信息靠的是马尔可夫性：知道 S′ 之后，历史不再改变 G′ 的条件分布。', en: '<strong>View 1: reshaping the equation — why "one step ahead" is legal.</strong> G = R + γG′ is just the definition of return; the pivotal move is the <strong>law of total expectation</strong> (tower property) folding E[G′|s] into E[v<sub>π</sub>(S′)|s]: the expectation of the whole future is replaced by the value of the next state — one step suffices. The fold loses nothing precisely because of the Markov property: given S′, history no longer changes the conditional distribution of G′.' },
        { zh: '<strong>视角二：自举——为什么现在就能更新</strong>。方程右边还含未知的 v<sub>π</sub>(S′)；拿当前估计 v<sub>t</sub>(s′) 顶上，未知变已知，更新立刻可执行。代价也随之而来：目标从"真值"变成"真值 + 估计误差"——<strong>偏差的来源</strong>。', en: '<strong>View 2: bootstrapping — why the update can run right now.</strong> The right-hand side still contains the unknown v<sub>π</sub>(S′); stand the current estimate v<sub>t</sub>(s′) in its place, and the unknown becomes known — the update executes immediately. The price follows at once: the target is no longer the truth but "truth + estimation error" — <strong>the origin of bias</strong>.' },
        { zh: '<strong>视角三：一步采样——为什么它就是 RM</strong>。期望 E[R + γv<sub>t</sub>(S′)] 依然算不动（转移概率未知），换成单次转移的采样 r + γv<sub>t</sub>(s′)。采样对期望的偏离恰是零均值噪声——L6 的 RM 三条件逐条对号入座，收敛性由定理 7.1 兜底。三个视角合起来一句话：<strong>Bellman 方程给出骨架，自举给出可行性，采样给出算法</strong>。', en: '<strong>View 3: one-step sampling — why it is exactly RM.</strong> The expectation E[R + γv<sub>t</sub>(S′)] is still uncomputable (transition probabilities unknown), so swap in the single-transition sample r + γv<sub>t</sub>(s′). The deviation of a sample from its expectation is precisely zero-mean noise — L6’s RM conditions line up one by one, and Theorem 7.1 underwrites convergence. Three views in one sentence: <strong>the Bellman equation gives the skeleton, bootstrapping gives feasibility, sampling gives the algorithm</strong>.' },
      ]},
      { t: 'formula', lbl: 'TD 误差的解剖 · Anatomy of the TD error — Eq. (7.6)',
        tex: String.raw`v_{t+1}(s_t) = \htmlClass{fx-green}{v_t(s_t)} - \alpha_t\big[\,\htmlClass{fx-green}{v_t(s_t)} - \big(\htmlClass{fx-gold}{r_{t+1} + \gamma v_t(s_{t+1})}\big)\big]`,
        note: '当前估计 · current &nbsp;&nbsp;|&nbsp;&nbsp; TD 目标 ¯v<sub>t</sub> · TD target（金）＝二者的差 δ<sub>t</sub> 驱动一切 · their gap δ<sub>t</sub> drives everything' },
      { t: 'p', zh: '<strong>全章灵魂：偏差-方差权衡。</strong>MC 的目标是真实回报 G：无偏（E[G|s] 恰是 v<sub>π</sub>(s)）——但 G 把整条轨迹的随机性（转移、奖励、策略的抽样）全部累乘到同一个数上，方差巨大。TD 的目标 r + γv<sub>t</sub>(s′)：方差小（只吃一步奖励与一次转移的噪声）——但 v<sub>t</sub>(s′) 本身不准，目标被估计误差污染，<strong>有偏</strong>。拿书 3×3 世界（γ=0.9）感受量级：沿最优路 s₁→s₂→s₅→s₈→s₉ 的真实回报 G₀ = 0.9³×1 = 0.729，恰好等于 v*(s₁)=0.73；而 TD 在全零初始化下的第一个目标是 r + γv(s₂) = 0 + 0.9×0 = 0——<strong>MC 开局就看到"完整的 0.729"，但换个运气可能完全是另一个数（高方差）；TD 开局只看到"诚实的 0"（有偏），却几乎每次都一样（低方差）</strong>。', en: '<strong>The soul of the chapter: the bias–variance trade-off.</strong> MC’s target is the real return G: unbiased (E[G|s] is exactly v<sub>π</sub>(s)) — but G piles the randomness of the whole trajectory (transitions, rewards, policy draws) onto one number: enormous variance. TD’s target r + γv<sub>t</sub>(s′): small variance (only one reward and one transition of noise) — but v<sub>t</sub>(s′) is itself inaccurate, the target is polluted by estimation error: <strong>biased</strong>. Feel the magnitudes in the book’s 3×3 world (γ=0.9): along the optimal path s₁→s₂→s₅→s₈→s₉ the real return G₀ = 0.9³×1 = 0.729, exactly v*(s₁)=0.73; TD’s very first target from an all-zero initialisation is r + γv(s₂) = 0 + 0.9×0 = 0 — <strong>MC’s opening move sees the “complete 0.729”, though under different luck it could be a totally different number (high variance); TD’s opening sees an “honest 0” (biased) that is nearly the same every time (low variance)</strong>.' },
      { t: 'formula', lbl: 'MC vs TD · 一张对照卡 · A comparison card',
        html: '<span style="color:var(--green)">MC</span>：目标 <i class="fx-inline" data-tex="G"></i> —— 无偏 · 方差大 · 必须等回合结束 &nbsp;&nbsp;vs.&nbsp;&nbsp; <span style="color:var(--gold)">TD</span>：目标 <i class="fx-inline" data-tex="r + \\gamma v_t(s\')"></i> —— 有偏（偏差 = 目标里 <i class="fx-inline" data-tex="v_t"></i> 的误差）· 方差小（只吃一步噪声）· 走一步就能更新<br><span style="font-size:13px;color:var(--ink-3)">关键差异：TD 的偏差会"呼吸"——<i class="fx-inline" data-tex="v_t"></i> 越学越准，偏差自我收缩；MC 的方差不随学习缩小。这就是实践偏爱 TD 的底层原因</span>' },
      { t: 'steps', items: [
        { zh: '<strong>bootstrapping</strong>：更新里用了 v<sub>t</sub>(s′) 这个<strong>估计值</strong>当目标的一部分——拿估计估估计。MC 不自举（用真实回报），所以无偏但高方差；TD 自举，有偏但方差小、还快得多。', en: '<strong>Bootstrapping</strong>: the update uses the <em>estimate</em> v<sub>t</sub>(s′) as part of the target — estimating from estimates. MC does not bootstrap (real returns), hence unbiased but high-variance; TD bootstraps — biased but low-variance and much faster.' },
        { zh: '<strong>sweep-free</strong>：TD 每步只更新当前访问的那个状态，其余不动。MC Basic 要等整条轨迹、MC Exploring Starts 要倒扫一遍，TD 走一步更新一步——在线、增量、持续学习的雏形。', en: '<strong>Sweep-free</strong>: each step updates only the currently visited state; the rest stay put. MC Basic waits for whole trajectories, MC Exploring Starts back-sweeps them — TD updates as it walks: online, incremental, the embryo of continual learning.' },
      ]},
      { t: 'callout', variant: 'warn', zh: '<strong>两个高频误区。</strong>① <strong>把 TD 误差 δ 当损失函数</strong>：δ<sub>t</sub> = v<sub>t</sub>(s) − (r + γv<sub>t</sub>(s′)) 只是 RM 更新式里那个"带噪声的读数"，不是任何目标函数的导数——"最小化 Σδ²"在数学上站不住（把所有 v 一路推向 0 也能让某些 δ 变小，但那不是学习）。δ 的角色是<strong>驱动力</strong>：它说"当前估计与目标差多少"，用完即弃。② <strong>α 永不衰减还指望收敛</strong>：常数 α 违反 Σα² &lt; ∞（L6 已判过刑），价值在真值附近永久振荡、振幅 ∝ α；非平稳目标下这是有意为之的取舍（跟踪），平稳目标下就是 bug。', en: '<strong>Two frequent misconceptions.</strong> ① <strong>Treating the TD error δ as a loss function</strong>: δ<sub>t</sub> = v<sub>t</sub>(s) − (r + γv<sub>t</sub>(s′)) is merely the “noisy reading” inside the RM update — it is not the derivative of any objective. “Minimising Σδ²” does not stand mathematically (pushing every v toward 0 also shrinks some δ, but that is not learning). δ’s role is a <strong>driving force</strong>: it reports “how far the estimate sits from the target”, is consumed, and discarded. ② <strong>Never decaying α yet still expecting convergence</strong>: a constant α violates Σα² &lt; ∞ (already sentenced in L6); values oscillate around the truth forever with amplitude ∝ α — a deliberate trade-off for nonstationary targets (tracking), but a bug for stationary ones.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"TD 目标","en":"TD target","d":{"zh":"走一步就更新：v(s) ← v(s) + α[r + γv(s′) − v(s)]——未来还没发生，用当前估计顶上。","en":"Update every step: v(s) ← v(s) + α[r + γv(s′) − v(s)] — an estimate stands in for a future not yet seen."}},
        {"zh":"RM 的特例","en":"an RM case","d":{"zh":"TD 就是套在 Bellman 期望方程上的 RM 算法，三条件检查通过，收敛性定理 7.1 到手。","en":"TD is the RM algorithm applied to the Bellman expectation equation; the three conditions hold, giving Theorem 7.1."}},
        {"zh":"自举","en":"bootstrapping","d":{"zh":"拿当前估计 vt(s′) 当目标的一部分——拿估计估估计：有偏，但方差小、还快得多。","en":"The current estimate vt(s′) enters the target — estimating with estimates: biased, yet far lower-variance and faster."}},
        {"zh":"偏差-方差","en":"bias–variance","d":{"zh":"MC 的目标 G 无偏但把整条轨迹的随机性累乘到一个数上；TD 目标只吃一步噪声。","en":"MC's target G is unbiased but multiplies a whole trajectory's randomness into one number; TD's target swallows one step of noise."}},
        {"zh":"两个误区","en":"two pitfalls","d":{"zh":"δ 是驱动力不是损失函数；常数 α 永不收敛——只有非平稳目标下才是有意取舍。","en":"δ is a driving force, not a loss function; a constant α never converges — a deliberate trade only under non-stationary targets."}},
      ] } },
    ],
  };

  /* ---- §7.2 Sarsa ---- */
  S['l7-sarsa'] = {
    kicker: 'L7 · §7.2',
    title: { zh: 'Sarsa：直接学动作价值', en: 'Sarsa: Learning Action Values Directly' },
    blocks: [
      { t: 'p', zh: 'TD(0) 只能估状态值，而改进策略需要 q。Sarsa 把 TD 的"状态版"照抄成"动作版"——更新对象换成 q(s,a)，目标里的 v(s′) 换成 q(s′,a′)：', en: 'TD(0) estimates only state values, but improving policies needs q. Sarsa transcribes TD from "state edition" to "action edition" — the updated object becomes q(s,a) and the target\'s v(s′) becomes q(s′,a′):' },
      { t: 'formula', lbl: 'Sarsa — Eq. (7.12)',
        tex: String.raw`q_{t+1}(s_t, a_t) = q_t(s_t, a_t) - \alpha_t\big[q_t(s_t, a_t) - (r_{t+1} + \gamma q_t(s_{t+1}, a_{t+1}))\big]` },
      { t: 'p', zh: '名字来源：每次更新需要五元组 <strong>(s<sub>t</sub>, a<sub>t</sub>, r<sub>t+1</sub>, s<sub>t+1</sub>, a<sub>t+1</sub>)</strong>——state-action-reward-state-action。数学身份：解动作价值版 Bellman 方程 q<sub>π</sub>(s,a) = E[R + γq<sub>π</sub>(S′,A′)|s,a] 的 RM 算法（定理 7.2 保证收敛）。<strong>Sarsa = TD(0) + 策略改进的组合拳</strong>：按 ε-greedy 采轨迹（探索），每步更新 q，每步顺便贪心改策略——评估与改进逐事件交替，这正是广义策略迭代最细的粒度。', en: 'The name: each update needs the quintuple <strong>(s<sub>t</sub>, a<sub>t</sub>, r<sub>t+1</sub>, s<sub>t+1</sub>, a<sub>t+1</sub>)</strong> — state-action-reward-state-action. Its mathematical identity: the RM algorithm solving the action-value Bellman equation q<sub>π</sub>(s,a) = E[R + γq<sub>π</sub>(S′,A′)|s,a] (convergence: Theorem 7.2). <strong>Sarsa = TD(0) plus policy improvement as one combo</strong>: roll ε-greedy trajectories (exploration), update q each step, and greedily touch up the policy each step — evaluation and improvement alternating at the finest possible grain, the finest granularity of generalised policy iteration.' },
      { t: 'p', zh: '<strong>ε-greedy 下 Sarsa 学到的表，和 Q-learning 的表不是同一张。</strong>Sarsa 的目标里 q(s′,a′) 的 a′ 是<strong>自己（ε-greedy）实际采出的下一步</strong>——更新式在评估"我带着探索噪声走路时这条路值多少"。用书 3×3 世界（γ=0.9）把两张表算出来对比（下方实验室同款世界，可直接验证）：', en: '<strong>Under ε-greedy, Sarsa’s table is not the same table Q-learning learns.</strong> The a′ inside Sarsa’s target q(s′,a′) is <strong>the next action actually drawn by its own ε-greedy policy</strong> — the update evaluates “what this route is worth while I walk with exploration noise on”. Compute both tables on the book’s 3×3 world (γ=0.9; the lab below runs the very same world, verify it yourself):' },
      { t: 'formula', lbl: '3×3 世界实测 · 两张表的差距（γ=0.9，ε=0.2）',
        tex: String.raw`q^*(s_1, \rightarrow) = \htmlClass{fx-gold}{0.73}\ \text{vs.}\ \text{Sarsa } q(s_1, \rightarrow) = \htmlClass{fx-green}{0.51} \;\;\text{·}\;\; q^*(s_2, \downarrow) = 0.81\ \text{vs}\ 0.64 \;\;\text{·}\;\; q^*(s_5, \downarrow) = 0.90\ \text{vs}\ 0.78`,
        note: 'Sarsa 的数值整体被压低：每一步都有 20% 的概率乱走（撞边界 −1、绕远路）——它诚实地给探索风险记了账；Q-learning 的 max 只认最优，不管行为策略多吵' },
      { t: 'callout', variant: 'warn', zh: '<strong>为什么 Sarsa 的策略要用 ε-greedy？</strong>书上答：因为这条策略还要负责产生样本——它必须具有探索性才能把每个 (s,a) 都走到。这就是 on-policy 的含义：<strong>被评估的策略 = 产生数据的策略</strong>。代价：收敛到的是 ε-greedy 家族内的最优（L5 的"是又不是"再现）。', en: '<strong>Why is Sarsa\'s policy ε-greedy?</strong> The book answers: that same policy must also generate the samples — it has to explore so that every (s,a) gets visited. This is what on-policy means: <strong>the evaluated policy = the data-generating policy</strong>. The price: convergence to the best within the ε-greedy family (L5\'s "yes and no" returns).' },
      { t: 'callout', variant: 'idea', zh: '<strong>【书外延伸，助理解】悬崖边的 Sarsa 更谨慎。</strong>把书 3×3 世界的禁区奖励加深成 −10（当成"陷阱"），ε=0.1 跑数值实验：直接执行 ε-greedy(Q* 表) 的平均折扣回报 ≈ 0.269，执行 ε-greedy(Sarsa 表) ≈ 0.282——<strong>Sarsa 反而更高</strong>。原因：Q* 表只认最优价值，执行时一旦探索失足掉进陷阱就要自己扛；Sarsa 的表在学的时候就把"探索可能掉坑"定价进去了，离陷阱近的状态被压低，恢复动作更保守。经典悬崖行走（cliff walking）实验展示的就是这一幕：Q-learning 学最短的危险路线，Sarsa 学安全的绕行路线——没有谁"错"，它们优化的对象本来就不是同一个。', en: '<strong>[Beyond the book, for intuition] Sarsa is more careful at the cliff edge.</strong> Deepen the forbidden-cell reward of the book’s 3×3 world to −10 (treat it as a “pit”) and run the numbers with ε=0.1: executing ε-greedy on the Q* table earns an average discounted return of ≈ 0.269, while ε-greedy on the Sarsa table earns ≈ 0.282 — <strong>Sarsa wins</strong>. Why: the Q* table only acknowledges optimal values, and when exploration stumbles into the pit during execution, it pays the bill alone; Sarsa’s table priced “exploration may fall in” while learning — states near the pit get pushed down, and its recovery actions are more conservative. The classic cliff-walking experiment shows exactly this scene: Q-learning takes the short dangerous route, Sarsa the safe detour — neither is “wrong”; they were never optimising the same object.' },
      { t: 'p', zh: '<strong>收敛条件（定理 7.2 的前提不能省）</strong>：① 每个状态-动作对 (s,a) 被<strong>无限多次</strong>访问——ε-greedy 保证这件事（纯贪心策略会把没试过的动作永远锁在初始值上）；② 步长满足 Robbins–Monro 条件（Σα=∞ 且 Σα²&lt;∞，实践中常用小常数的理由见 L6）。探索不足的后果是<strong>局部的错误固化</strong>：没被访问的 (s,a) 保持初值，策略改进又恰好挑中被高估的动作——错上加错。', en: '<strong>Convergence conditions (the premises of Theorem 7.2 are not optional)</strong>: ① every state–action pair (s,a) is visited <strong>infinitely often</strong> — ε-greedy guarantees this (a purely greedy policy would lock untried actions at their initial values forever); ② step sizes satisfy the Robbins–Monro conditions (Σα=∞ with Σα²&lt;∞; the practical case for small constants was made in L6). Insufficient exploration means <strong>local errors fossilise</strong>: unvisited (s,a) keep their initial values, and policy improvement then picks precisely the overestimated actions — error compounding on error.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"动作版 TD","en":"action-valued TD","d":{"zh":"把 TD(0) 的\"状态版\"照抄成\"动作版\"：更新 q(s,a)，目标换成 r + γq(s′,a′)。","en":"TD(0)'s state version copied into action form: update q(s,a) with target r + γq(s′,a′)."}},
        {"zh":"五元组","en":"the five tuple","d":{"zh":"每次更新需要 (st, at, rt+1, st+1, at+1)——state-action-reward-state-action，名字由此而来。","en":"Each update needs (st, at, rt+1, st+1, at+1) — state-action-reward-state-action, hence the name."}},
        {"zh":"on-policy","en":"on-policy","d":{"zh":"被评估的策略 = 产生数据的策略：ε-greedy 负责探索，收敛到 ε-greedy 家族内的最优。","en":"The evaluated policy is the data-collecting one: ε-greedy explores, and convergence is to the best within the ε-greedy family."}},
        {"zh":"收敛条件","en":"convergence","d":{"zh":"每个状态-动作对被无限多次访问（ε-greedy 保证）+ Robbins–Monro 步长条件（定理 7.2）。","en":"Every state-action pair visited infinitely often (ε-greedy ensures it), plus Robbins–Monro step sizes (Theorem 7.2)."}},
      ] } },
    ],
  };

  /* ---- §7.3 n-step ---- */
  S['l7-nstep'] = {
    kicker: 'L7 · §7.3',
    title: { zh: 'n-step Sarsa：自举与采样的连续谱', en: 'n-step Sarsa: A Spectrum between Bootstrapping and Sampling' },
    blocks: [
      { t: 'p', zh: 'Sarsa 的目标只用一步真实奖励（其余自举）；MC 的目标全是真实奖励（一步都不自举）。<strong>n-step Sarsa</strong> 把两者接成连续谱——目标取 n 步真实奖励再加 γ<sup>n</sup>·q(s<sub>t+n</sub>, a<sub>t+n</sub>)：', en: 'Sarsa\'s target uses one step of real reward (bootstrapping the rest); MC\'s target is all real rewards (no bootstrapping at all). <strong>n-step Sarsa</strong> bridges them — the target takes n real rewards plus γ<sup>n</sup>·q(s<sub>t+n</sub>, a<sub>t+n</sub>):' },
      { t: 'formula', lbl: 'n-step Sarsa — Eq. (7.17)',
        tex: String.raw`q_{t+1}(s_t, a_t) = q_t(s_t, a_t) - \alpha_t\big[q_t(s_t, a_t) - (r_{t+1} + \gamma r_{t+2} + \cdots + \gamma^{n} q_t(s_{t+n}, a_{t+n}))\big]` },
      { t: 'p', zh: 'n = 1 退化为 Sarsa；n = ∞（且 α = 1）退化为 MC。统计学的两难在中间震荡：<strong>n 大 → 偏差小、方差大</strong>（真实信息多，但长尾抖动厉害）；<strong>n 小 → 偏差大、方差小</strong>（自举误差，但很稳）。实现上要用"延迟更新"：q(s<sub>t</sub>,a<sub>t</sub>) 要等到 t+n 时刻凑齐 n 步奖励才能更新。', en: 'n = 1 degenerates to Sarsa; n = ∞ (with α = 1) to MC. The statistical dilemma oscillates in between: <strong>large n → low bias, high variance</strong> (more real information, but the long tail wobbles); <strong>small n → high bias, low variance</strong> (bootstrapping error, but steady). Implementation requires "delayed updates": q(s<sub>t</sub>,a<sub>t</sub>) must wait until time t+n for the n rewards to accrue.' },
      { t: 'p', zh: '<strong>同一条轨迹，四种目标各"看到"多少真实？</strong>取书 3×3 世界（γ=0.9）最优路上的一条轨迹 s₁→s₂→s₅→s₈→s₉，奖励依次 (0, 0, 0, +1)，全零初始化。从 s₁ 出发的真实回报 G₀ = 0 + 0.9·0 + 0.9²·0 + 0.9³·1 = <strong>0.729</strong>。同一个 (s₁,→)，四种目标分别是：', en: '<strong>On one trajectory, how much truth does each target see?</strong> Take the book’s 3×3 world (γ=0.9) and a trajectory on the optimal route s₁→s₂→s₅→s₈→s₉ with rewards (0, 0, 0, +1), all-zero initialisation. The true return from s₁ is G₀ = 0 + 0.9·0 + 0.9²·0 + 0.9³·1 = <strong>0.729</strong>. For the same (s₁,→), the four targets read:' },
      { t: 'formula', lbl: '数值例子 · 同一 (s₁,→) 的四档目标',
        tex: String.raw`\begin{gathered} \text{n=1}：\htmlClass{fx-gold}{r + \gamma q(s_2,\cdot)} = 0 + 0.9\times 0 = \mathbf{0} \;\;\text{·}\;\; \text{n=2}：\htmlClass{fx-gold}{r_1 + \gamma r_2 + \gamma^2 q(s_5,\cdot)} = 0\\[2pt] \text{n=4}：\htmlClass{fx-green}{G_0 = 0.729}\,\text{（全是真实奖励）} \end{gathered}`,
        note: '真实奖励的"含量"随 n 单调增加；自举部分的权重是 γ<sup>n</sup>——n 每加一，估计误差的折扣就乘一次 γ' },
      { t: 'callout', variant: 'key', zh: '<strong>偏差-方差谱的定量读法。</strong>n-step 目标 =（前 n 个真实奖励）+（γ<sup>n</sup> 加权的自举尾巴）。偏差随 n 收缩：自举尾巴的权重 γ<sup>n</sup> 指数式变小，到 n 覆盖整条轨迹时偏差归零（MC）；方差随 n 膨胀：每多采一步真实奖励，就多吞一步转移与奖励的随机性。挑 n 就是在"误差会被 γ<sup>n</sup> 打折"与"噪声会随 n 累积"之间找谷底——实践中 n = 3~5 常常是甜点位（经验之谈，非定理）。', en: '<strong>Reading the bias–variance spectrum quantitatively.</strong> The n-step target = (n real rewards) + (a bootstrapped tail weighted by γ<sup>n</sup>). Bias shrinks with n: the tail’s weight γ<sup>n</sup> decays exponentially, hitting zero when n covers the whole trajectory (MC). Variance inflates with n: each extra real reward swallows one more step of transition-and-reward randomness. Choosing n means finding the valley between “error discounted by γ<sup>n</sup>” and “noise accumulating with n” — in practice n = 3~5 is often the sweet spot (folk wisdom, not a theorem).' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"连续谱","en":"a spectrum","d":{"zh":"目标取 n 步真实奖励，再加 γn 加权的自举尾巴 q(st+n, at+n)。","en":"The target takes n real rewards, then a bootstrapped tail q(st+n, at+n) weighted by γn."}},
        {"zh":"两端","en":"the two ends","d":{"zh":"n = 1 退化为 Sarsa；n = ∞（且 α = 1）退化为 MC。","en":"n = 1 degenerates to Sarsa; n = ∞ (with α = 1) to MC."}},
        {"zh":"偏差-方差谱","en":"bias–variance","d":{"zh":"n 大偏差小方差大，n 小偏差大方差小；实践中 n = 3~5 常常是甜点位。","en":"Large n: low bias, high variance; small n the reverse — in practice n = 3–5 is often the sweet spot."}},
        {"zh":"延迟更新","en":"delayed update","d":{"zh":"实现上要等：q(st, at) 凑齐 n 步奖励（到 t+n 时刻）才能更新。","en":"Implementation waits: q(st, at) updates only at time t+n, once the n rewards are complete."}},
      ] } },
    ],
  };

  /* ---- §7.4 Q-learning ---- */
  S['l7-qlearning'] = {
    kicker: 'L7 · §7.4',
    title: { zh: 'Q-learning：直接解最优方程的无模型王者', en: 'Q-learning: Directly Solving the Optimality Equation, Model-Free' },
    blocks: [
      { t: 'p', zh: 'Sarsa 估的是"给定策略"的 q，还要配上改进步才能找最优。<strong>Q-learning</strong> 一步到位——TD 目标里的 q(s′,a′) 换成 <strong>max<sub>a</sub> q(s′,a)</strong>：', en: 'Sarsa estimates the q of a <em>given</em> policy and still needs an improvement step to seek optimality. <strong>Q-learning</strong> finishes in one stroke — the target\'s q(s′,a′) becomes <strong>max<sub>a</sub> q(s′,a)</strong>:' },
      { t: 'formula', lbl: 'Q-learning — Eq. (7.18)',
        tex: String.raw`q_{t+1}(s_t, a_t) = q_t(s_t, a_t) - \alpha_t\big[q_t(s_t, a_t) - (r_{t+1} + \gamma\,\htmlClass{fx-accent}{\max_a}\, q_t(s_{t+1}, a))\big]` },
      { t: 'p', zh: '身份大不同：<strong>Q-learning 是解动作价值版 Bellman 最优方程 q(s,a) = E[R + γmax<sub>a</sub>q(S′,a)] 的 RM 算法</strong>（书上 Box 7.5）——还记得 L3 吗？max 进方程，最优性进解。所以 Q-learning 直接估计<strong>最优</strong>动作价值 q*，收敛到 v* 对应的 q 表。', en: 'A very different identity: <strong>Q-learning is the RM algorithm solving the action-value Bellman optimality equation q(s,a) = E[R + γmax<sub>a</sub>q(S′,a)]</strong> (book Box 7.5) — recall L3: the max enters the equation, optimality enters the solution. Q-learning thus directly estimates the <strong>optimal</strong> action values q*, converging to the q-table behind v*.' },
      { t: 'steps', items: [
        { zh: '<strong>off-policy 的含义</strong>：产生数据的策略（behavior policy，ε-greedy 负责探索）和被评估/改进的策略（target policy，贪心）<strong>可以是两个</strong>。因为 max 只对着 q 表算，不需要"下一个动作"真的被采到——数据采集方式与评估对象解耦。', en: '<strong>What off-policy means</strong>: the behavior policy generating data (ε-greedy, in charge of exploration) and the target policy being evaluated/improved (greedy) <strong>can be two different things</strong> — the max reads the q-table directly and does not care whether the next action was actually taken: data collection is decoupled from evaluation.' },
        { zh: '<strong>样本还更省</strong>：Sarsa 每步要 (r, s′, a′) 三件套，Q-learning 只要 (r, s′)——a′ 不需要。 书上 Figure 7.4 展示了 off-policy 学习：即使 behavior 策略是完全随机的，Q-learning 依然收敛到最优价值。', en: '<strong>And it saves samples</strong>: Sarsa needs the triple (r, s′, a′) each step; Q-learning only (r, s′) — no a′ required. The book\'s Figure 7.4 shows off-policy learning: even with a fully random behavior policy, Q-learning converges to the optimal values.' },
        { zh: '<strong>两个极端撞车</strong>：Q-learning 的目标也用了 max（像值迭代），也用了自举（像 Sarsa）——它是"值迭代的无模型版"。行为策略保证探索（大数定律的原料），目标策略保证最优性（BOE 的要求），两全其美。', en: '<strong>Two extremes collide</strong>: Q-learning\'s target uses the max (like value iteration) and bootstraps (like Sarsa) — it is "value iteration made model-free". The behavior policy secures exploration (raw material for the law of large numbers); the target policy secures optimality (the BOE\'s demand). Best of both.' },
      ]},
      { t: 'formula', lbl: '逐项对差 · Sarsa vs Q-learning 的目标',
        tex: String.raw`\begin{gathered} \text{Sarsa}：r_{t+1} + \gamma\, q_t(s_{t+1}, \htmlClass{fx-green}{a_{t+1}})\\[2pt] \text{Q-learning}：r_{t+1} + \gamma\,\htmlClass{fx-gold}{\max_a}\, q_t(s_{t+1}, a) \end{gathered}`,
        note: 'a′ = 行为策略实际采出的下一步——评估"我自己会怎么走"<br>max = 表上的最优——评估"假如下一步走最好会怎样"，与 a′ 无关' },
      { t: 'p', zh: '<strong>Q-learning 的收敛条件同样两条，缺一不可。</strong>① <strong>充分探索</strong>：行为策略必须把每个 (s,a) 都无限次送到（ε-greedy 或随机策略都行——书上 Figure 7.4 干脆用完全随机的行为策略照样收敛到最优，把 off-policy 的解耦展示到极致）。道理在 L6：RM 的收敛靠噪声在期望中相消，样本没送到的 (s,a)，大数定律没有原料。② <strong>步长条件</strong>：衰减步长（Σα=∞、Σα²&lt;∞）保证收敛到真值；收敛证明正是引用 L6 的 Dvoretzky 定理——因为 Q-learning 的目标 max q<sub>t</sub>(s′,·) 随 t 变化，一般的 RM 定理不够用，需要允许"目标会动"的版本。', en: '<strong>Q-learning’s convergence conditions are likewise two, both mandatory.</strong> ① <strong>Sufficient exploration</strong>: the behavior policy must deliver every (s,a) infinitely often (ε-greedy or even a purely random policy — the book’s Figure 7.4 uses a fully random behavior policy and still converges to the optimum, showcasing the off-policy decoupling at its extreme). The reason traces to L6: RM convergence relies on noise cancelling in expectation, and for (s,a) pairs never sampled the law of large numbers has no raw material. ② <strong>Step-size conditions</strong>: decaying steps (Σα=∞, Σα²&lt;∞) secure convergence to the truth; the proof cites L6’s Dvoretzky theorem — because Q-learning’s target max q<sub>t</sub>(s′,·) changes with t, the plain RM theorem does not suffice, and the version that allows a “moving target” is needed.' },
      { t: 'callout', variant: 'danger', zh: '<strong>误区：拿旧策略的样本去更新新策略。</strong>策略每改一步，数据的"产地"就换一次。Sarsa 的目标里 a′ 必须是<strong>当前策略</strong>采出的动作——用昨天策略采的 (s,a,r,s′,a′) 去更新今天的 q，等于给错了方程：你解的是旧策略的 Bellman 期望方程，策略改进却已往前走。这就是 on-policy 方法"数据必须新鲜"的宿命，也解释了它样本效率的天花板。Q-learning 天生豁免：目标 r + γmax q(s′,a) 不含 a′、不依赖行为策略——只要探索到位，谁产的样本都能用。L8 的经验回放（拿旧样本反复训练）之所以配得上 Q-learning 而配不上 Sarsa，门票就在这一行更新式里。', en: '<strong>Misconception: updating a new policy with an old policy’s samples.</strong> Every improvement step changes the “origin” of the data. Sarsa’s target demands that a′ be drawn by the <strong>current</strong> policy — updating today’s q with (s,a,r,s′,a′) sampled under yesterday’s policy solves the wrong equation: you are solving the previous policy’s Bellman expectation equation while policy improvement has moved on. This is the on-policy fate of “data must be fresh”, and it explains the sample-efficiency ceiling. Q-learning is exempt by birth: the target r + γmax q(s′,a) contains no a′ and does not depend on the behavior policy — given sufficient exploration, samples from anyone are usable. Why experience replay in L8 pairs with Q-learning and not with Sarsa: the admission ticket is written in this very update line.' },
      { t: 'widget', component: 'l7-qlearn-lab' },
    ],
  };

  /* ---- §7.5 统一视角 ---- */
  S['l7-unified'] = {
    kicker: 'L7 · §7.5',
    title: { zh: '统一视角：一张表看穿所有算法', en: 'A Unified View: One Table Fits All Algorithms' },
    blocks: [
      { t: 'p', zh: '书用一个模板装下本章全部算法（外加 MC）：<strong>q<sub>t+1</sub>(s<sub>t</sub>,a<sub>t</sub>) = q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − α<sub>t</sub>[q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − ¯q<sub>t</sub>]</strong>。全部区别只在 TD 目标 ¯q<sub>t</sub> 怎么取：', en: 'The book fits every algorithm of this chapter (plus MC) into one template: <strong>q<sub>t+1</sub>(s<sub>t</sub>,a<sub>t</sub>) = q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − α<sub>t</sub>[q<sub>t</sub>(s<sub>t</sub>,a<sub>t</sub>) − ¯q<sub>t</sub>]</strong>. All the differences live in how the TD target ¯q<sub>t</sub> is taken:' },
      { t: 'formula', lbl: '模板上的两个旋钮 · Two knobs on the template',
        tex: String.raw`\bar{q}_t = \htmlClass{fx-green}{r_{t+1} + \gamma r_{t+2} + \cdots + \gamma^{n-1} r_{t+n}} + \gamma^{n}\cdot\htmlClass{fx-gold}{\big[\, q(s_{t+n}, a_{t+n})\ \text{或}\ \max_a q(s_{t+n}, a) \,\big]}`,
        note: '旋钮一（绿色）：采样长度 n —— 控制偏差-方差谱（n=1 最稳，n=∞ 无偏）&nbsp;·&nbsp; 旋钮二（金色）：末端是否加 max —— 控制解"给定策略的方程"还是"最优方程"' },
      { t: 'p', zh: '两个旋钮生成全家福：n=1、不加 max → <strong>Sarsa</strong>（评估当前策略）；n=1、加 max → <strong>Q-learning</strong>（直接解最优方程）；n&lt;∞、不加 max → <strong>n-step Sarsa</strong>（谱上任意点）；n=∞ → <strong>MC</strong>（不自举的极端）。看任何新算法，先问两句话："目标里有多少真实奖励？末端有没有 max？"——答案一报，它在家族里的位置就定了。', en: 'Two knobs generate the family portrait: n=1, no max → <strong>Sarsa</strong> (evaluates the current policy); n=1, with max → <strong>Q-learning</strong> (solves the optimality equation directly); n&lt;∞, no max → <strong>n-step Sarsa</strong> (any point on the spectrum); n=∞ → <strong>MC</strong> (the no-bootstrapping extreme). When you meet any new algorithm, ask two questions first: “How many real rewards sit in the target? Is there a max at the end?” — the answers fix its seat in the family.' },
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
      { t: 'steps', items: [
        { zh: '<strong>TD(0)</strong>：估 v<sub>π</sub>，目标 r + γv(s′)，纯评估（不含改进步）；三视角推导 = Bellman 变形 + 自举 + 一步采样。', en: '<strong>TD(0)</strong>: estimates v<sub>π</sub> with target r + γv(s′), pure evaluation (no improvement step); the three-view derivation = Bellman reshaping + bootstrapping + one-step sampling.' },
        { zh: '<strong>Sarsa</strong>：估 q<sub>π</sub>（on-policy），目标 r + γq(s′,a′)，五元组缺一不可；收敛到 ε-greedy 家族内的最优，数据必须新鲜。', en: '<strong>Sarsa</strong>: estimates q<sub>π</sub> (on-policy) with target r + γq(s′,a′), the quintuple is non-negotiable; converges to the best within the ε-greedy family, and its data must be fresh.' },
        { zh: '<strong>Q-learning</strong>：估 q*（off-policy），目标 r + γmax q(s′,a)，不需要 a′；行为策略管探索、目标策略管最优，收敛证明引用 Dvoretzky。', en: '<strong>Q-learning</strong>: estimates q* (off-policy) with target r + γmax q(s′,a), no a′ needed; the behavior policy explores while the target policy optimises, and the convergence proof cites Dvoretzky.' },
        { zh: '<strong>n-step</strong>：目标 = n 个真实奖励 + γ<sup>n</sup> 自举尾巴，一个 n 把偏差-方差谱连续接通 MC 与 Sarsa 两端。', en: '<strong>n-step</strong>: target = n real rewards + a bootstrapped tail weighted by γ<sup>n</sup>; one dial n connects MC and Sarsa continuously along the bias–variance spectrum.' },
      ]},
      { t: 'callout', variant: 'done', zh: '<strong>离场自检。</strong>① 能用三视角（方程变形/自举/一步采样）说清 TD 目标 r + γv(s′) 的来历；② 能说出 TD 有偏的根源与"偏差会呼吸"的含义，以及 MC 方差不缩小的对比；③ 能逐项指出 Sarsa 与 Q-learning 更新式的差异并说出各自的收敛条件；④ 能解释为什么 Q-learning 可以用任意探索性策略的样本而 Sarsa 不行；⑤ 能用"两个旋钮"（采样长度 n、末端是否 max）定位 MC/Sarsa/n-step/Q-learning。五题全过，第 8 章的门票到手。', en: '<strong>Exit self-check.</strong> ① Explain the origin of the TD target r + γv(s′) via the three views (equation reshaping / bootstrapping / one-step sampling); ② name the root of TD’s bias and what “the bias breathes” means, contrasted with MC’s never-shrinking variance; ③ point out term-by-term differences between the Sarsa and Q-learning updates and state each one’s convergence conditions; ④ explain why Q-learning can consume samples from any exploratory policy while Sarsa cannot; ⑤ locate MC/Sarsa/n-step/Q-learning with the two knobs (sampling length n, max at the end). Pass all five, and the ticket to Chapter 8 is yours.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"三兄弟","en":"three siblings","d":{"zh":"TD(0) 估 v、Sarsa 估 qπ、Q-learning 估 q*——同一个 RM 骨架配三种目标。","en":"TD(0) estimates v, Sarsa qπ, Q-learning q* — one RM skeleton fitted with three targets."}},
        {"zh":"两个旋钮","en":"two knobs","d":{"zh":"采样长度 n 与末端是否 max：用它们定位 MC / Sarsa / n-step / Q-learning。","en":"Sample length n and whether the tail takes a max: the two knobs that place MC, Sarsa, n-step and Q-learning."}},
        {"zh":"自举的谱","en":"bootstrap spectrum","d":{"zh":"加上 n-step 与 MC 两个极端，无模型主干搭建完成：GPI + 自举效率 + off-policy 解耦。","en":"With n-step and MC at the extremes, the model-free backbone is complete: GPI plus bootstrapped efficiency plus off-policy decoupling."}},
        {"zh":"工程真相","en":"engineering truth","d":{"zh":"被评估的策略一直在变（非平稳）：学习率常取小常数而非衰减到零，小幅波动是可接受的代价。","en":"The evaluated policy keeps drifting (non-stationary): learning rates stay small constants rather than decay — small oscillation is an accepted price."}},
      ] } },
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
      { t: 'widget', component: 'notebook-bridge', props: { nb: 'nb4' } },
    ],
  };

  /* ---- L7 Q&A ---- */
  S['l7-qa'] = {
    kicker: 'L7 · §7.7',
    title: { zh: '问答：时序差分九连问（精选）', en: 'Q&A: Nine Questions on TD (Selected)' },
    blocks: [
      { t: 'p', zh: 'on/off-policy 之辨、学习率之争、要不要学全部状态——本章最容易被面试官追问的点都在这里。', en: 'The on/off-policy distinction, the learning-rate dispute, and "do we need all states optimal" — the points interviewers love, all here.' },
      { t: 'p', zh: '翻卡前先过三题：① "TD 的目标为什么是 r + γv(s′) 而不是别的形状"（Bellman 期望方程 + 自举 + 一步采样，三视角缺一不可）；② "Sarsa 和 Q-learning 到底差在哪"（目标里的 a′ 换成 max——一个评估自己、一个瞄准最优，on/off-policy 之分全由此起）；③ "学习率到底该衰减还是常数"（平稳目标衰减、非平稳目标小常数——被评估的策略一直在变，这正是 L6 两种记忆的现场应用）。', en: 'Before flipping, run through three: ① “Why is the TD target r + γv(s′) and not some other shape” (Bellman expectation equation + bootstrapping + one-step sampling — no view may be missing); ② “Where exactly do Sarsa and Q-learning differ” (a′ in the target replaced by max — one evaluates itself, the other aims at the optimum; the on/off-policy split starts exactly there); ③ “Should the learning rate decay or stay constant” (decay for stationary targets, small constants for nonstationary ones — the policy being evaluated keeps changing, L6’s two kinds of memory applied on the spot).' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l7' } },
      { t: 'widget', component: 'fill-lab', props: { source: 'l7' } },
      { t: 'widget', component: 'derivation-lab', props: { source: 'l7' } },
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


  /* ═══ L7 知识填充 ═══ */
  D.fillSets = D.fillSets || {};
  D.fillSets['l7'] = {
    title: { zh: '第七讲 · 知识填充', en: 'Lecture 7 · Knowledge Fill-in' },
    items: [
      {
        kind: 'choice',
        tag: { zh: 'TD 误差 · δ', en: 'TD error · δ' },
        stem: { zh: 'Q-learning 一步更新的驱动力是 TD 误差：δ = r + γ[[1]] − q(s,a)，更新写作 q(s,a) ← q(s,a) + αδ；目标里的 q(s′,·) 直接读当前估计表。', en: 'The driving force of a Q-learning update is the TD error: δ = r + γ[[1]] − q(s,a), applied as q(s,a) ← q(s,a) + αδ; the q(s′,·) in the target is read straight off the current estimate table.' },
        blanks: [
          { choices: [
              { zh: 'max q(s′,·)', en: 'max q(s′,·)' },
              { zh: 'q(s′,a′)', en: 'q(s′,a′)' },
              { zh: 'v(s′)', en: 'v(s′)' },
            ], answer: 0,
            why: { zh: 'max 进目标，解的是动作价值版 Bellman 最优方程（Box 7.5）——max 进方程，最优性进解。换成 q(s′,a′) 就是 Sarsa 的目标，评估的是带探索噪声的当前策略；v(s′) 是状态值，动作价值的更新里没有它的位置。δ 只报告"估计离目标多远"，是驱动力不是损失函数。', en: 'The max in the target solves the action-value Bellman optimality equation (Box 7.5) — max enters, optimality enters. Swap in q(s′,a′) and you get Sarsa’s target, evaluating the current policy with its exploration noise; v(s′) is a state value and has no seat in an action-value update. δ only reports how far the estimate sits from the target — a driving force, not a loss.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '自举 · bootstrapping', en: 'Bootstrapping' },
        stem: { zh: 'TD 三兄弟的目标 r + γv(s′)、r + γq(s′,a′)、r + γmax q(s′,·) 形状各异，却共享同一个特征——[[1]]，这正是它们有偏的根源。', en: 'The three TD targets r + γv(s′), r + γq(s′,a′), r + γmax q(s′,·) differ in shape yet share one trait — [[1]] — which is exactly where their bias comes from.' },
        blanks: [
          { choices: [
              { zh: '目标里含当前估计值：拿估计更新估计', en: 'the target contains a current estimate: updating estimates with estimates' },
              { zh: '目标全部由真实奖励构成', en: 'the target is built entirely from real rewards' },
              { zh: '更新必须等整条轨迹走完', en: 'the update must wait for a full trajectory' },
            ], answer: 0,
            why: { zh: '目标里的 v(s′)、q(s′,a′) 或 max q(s′,·) 都是估计表上的读数——拿估计估估计，所以有偏；代价换来方差小（只吃一步噪声）且走一步就能更新。MC 的目标 G 全是真实奖励：不自举、无偏，但方差大还得等回合结束。好消息：自举的偏差会呼吸——估计越准，偏差越小。', en: 'The v(s′), q(s′,a′) or max q(s′,·) inside the target is a reading from the estimate table — estimating with estimates, hence biased; the price buys low variance (one step of noise) and per-step updates. MC’s target G is all real rewards: no bootstrapping, no bias, but high variance and a wait for the episode to end. The good news: bootstrapped bias breathes — as the estimates sharpen, the bias shrinks.' } },
        ],
      },
      {
        kind: 'number',
        tag: { zh: 'MC vs TD · 3×3 世界', en: 'MC vs TD · 3×3 world' },
        stem: { zh: '书 3×3 世界（γ=0.9）：沿最优路 s₁→s₂→s₅→s₈→s₉ 的真实回报 G₀ = 0.9³×1 = [[1]]；而全零初始化下 TD 的第一个目标只有 r + γv(s₂) = 0。', en: 'The book’s 3×3 world (γ=0.9): the true return along the optimal route s₁→s₂→s₅→s₈→s₉ is G₀ = 0.9³×1 = [[1]]; yet TD’s very first target from an all-zero initialisation is only r + γv(s₂) = 0.' },
        blanks: [
          { answer: 0.729, tol: 0.005,
            hint: { zh: '0.9 的三次方。', en: '0.9 cubed.' },
            why: { zh: 'G₀ = 0.9³×1 = 0.729，恰好等于 v*(s₁) ≈ 0.73。MC 开局就看到完整的 0.729，但换个轨迹可能完全是另一个数（高方差）；TD 开局只看到诚实的 0（有偏），却几乎每次都一样（低方差）。这就是偏差-方差权衡的定量样本。', en: 'G₀ = 0.9³×1 = 0.729, exactly v*(s₁) ≈ 0.73. MC’s opening move sees the complete 0.729, though another trajectory could give a totally different number (high variance); TD’s opening sees an honest 0 (biased) that is nearly identical every time (low variance). A quantitative specimen of the bias–variance trade-off.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: 'on/off-policy · 一行之差', en: 'on/off-policy · one line apart' },
        stem: { zh: 'Sarsa 与 Q-learning 的目标只差一处：Sarsa 取 r + γq(s′,a′)，其中 a′ 是 [[1]]；Q-learning 取 r + γmax q(s′,·)，完全不看 a′。', en: 'Sarsa and Q-learning differ in exactly one spot: Sarsa takes r + γq(s′,a′), where a′ is [[1]]; Q-learning takes r + γmax q(s′,·), ignoring a′ altogether.' },
        blanks: [
          { choices: [
              { zh: '当前 ε-greedy 策略实际采出的下一步', en: 'the next action actually drawn by the current ε-greedy policy' },
              { zh: '历史旧策略采过的那个动作', en: 'the action drawn by some older policy' },
              { zh: '值迭代里假设的最优动作', en: 'the optimal action assumed as in value iteration' },
            ], answer: 0,
            why: { zh: 'a′ 必须是自己（ε-greedy）实际采的下一步：Sarsa 评估的是"我带着探索噪声走路时这条路值多少"，被评估的策略 = 产生数据的策略，这就是 on-policy。max 只对着 q 表算，不需要下一个动作真的被采到——数据采集与评估解耦，这就是 off-policy。一行之差决定两个身份。', en: 'a′ must be the next action actually drawn by its own ε-greedy policy: Sarsa evaluates “what this route is worth while I walk with exploration noise on” — the evaluated policy is the data-generating one, i.e. on-policy. The max reads the q-table and never asks whether the next action was really taken — data collection decoupled from evaluation, i.e. off-policy. One line decides two identities.' } },
        ],
      },
      {
        kind: 'code',
        tag: { zh: '代码 · Q-learning 更新行', en: 'Code · the Q-learning line' },
        stem: { zh: '两个算法只差一行：把 Q-learning 更新行（td_algorithms.py 第 35 行）里的目标空补上：[[1]]', en: 'The two algorithms differ by a single line: fill the target gap in the Q-learning update (line 35 of td_algorithms.py): [[1]]' },
        code: { zh: 'q[s,a] += alpha * (r + gamma * [[1]] - q[s,a])', en: 'q[s,a] += alpha * (r + gamma * [[1]] - q[s,a])' },
        blanks: [
          { choices: ['max(q[s_next, :])', 'q[s_next, a_next]', 'mean(q[s_next, :])'], answer: 0,
            why: { zh: 'max 直指下一状态的最优价值——哪怕探索走了臭棋，更新仍按"下一步最好"记账，这是 off-policy 的能量来源（代码里即 np.max(q[s2])）。把这行换成 q[s_next, a_next]（先 eps_greedy 采出 a_next 再更新）就是 Sarsa——on-policy，评估自己带探索噪声的策略。mean(q[s_next, :]) 不对应任何 Bellman 方程——既不是期望方程也不是最优方程，收敛不到任何真值。', en: 'The max points straight at the next state’s optimal value — even a bad exploratory step is booked as if the best were taken next: the energy source of off-policy (np.max(q[s2]) in the code). Replace this line with q[s_next, a_next] (sample a_next by eps_greedy first) and you get Sarsa — on-policy, evaluating its own noisy policy. mean(q[s_next, :]) matches no Bellman equation at all — neither the expectation one nor the optimality one — so it converges to nothing.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '经验回放的门票', en: 'The replay ticket' },
        stem: { zh: 'L8 的经验回放（拿旧样本反复训练）配得上 Q-learning 却配不上 Sarsa，因为 Q-learning 的目标 [[1]]。', en: 'Experience replay in L8 (training repeatedly on old samples) pairs with Q-learning but not with Sarsa, because Q-learning’s target [[1]].' },
        blanks: [
          { choices: [
              { zh: 'r + γmax q(s′,a) 不含 a′、不依赖行为策略', en: 'r + γmax q(s′,a) contains no a′ and does not depend on the behavior policy' },
              { zh: '也含 a′，只是允许事后补采', en: 'also contains a′, merely allowing it to be patched in afterwards' },
              { zh: '带 max，任何旧数据都会被自动纠正成最优', en: 'carries a max, so any stale data is automatically corrected toward optimality' },
              { zh: '对样本新旧不敏感，靠的是 α 衰减得够快', en: 'is insensitive to sample age because α decays fast enough' },
            ], answer: 0,
            why: { zh: 'max q(s′,·) 是 q 表上的最优读数，与谁、何时采的样本无关——只要探索到位，旧样本一样有效。Sarsa 的目标里 a′ 必须是当前策略采出的动作：用昨天策略的五元组更新今天的 q，等于在解旧策略的 Bellman 期望方程，而策略改进已经往前走。数据必须新鲜，是 on-policy 的宿命，也是它样本效率的天花板。', en: 'max q(s′,·) is the optimal reading on the q-table, indifferent to who drew the sample or when — given enough exploration, old samples work just as well. Sarsa’s a′ must come from the current policy: updating today’s q with yesterday’s quintuple solves the old policy’s Bellman expectation equation while improvement has already moved on. Fresh data is the on-policy fate, and the ceiling on its sample efficiency.' } },
        ],
      },
      {
        kind: 'number',
        tag: { zh: '两张表 · ε=0.2', en: 'Two tables · ε=0.2' },
        stem: { zh: '3×3 世界（γ=0.9，ε=0.2）实测：q*(s₁,→) = 0.73，而 Sarsa 表的 q(s₁,→) ≈ [[1]]——数值整体被探索风险压低。', en: 'Measured on the 3×3 world (γ=0.9, ε=0.2): q*(s₁,→) = 0.73, while the Sarsa table reads q(s₁,→) ≈ [[1]] — its values are pushed down overall by exploration risk.' },
        blanks: [
          { answer: 0.51, tol: 0.01,
            hint: { zh: '比 0.73 低两成多，在 0.5 上下。', en: 'Some twenty percent below 0.73, around 0.5.' },
            why: { zh: '实测 0.51。每一步都有 20% 的概率乱走（撞边界 −1、绕远路），Sarsa 诚实地给探索风险记了账；Q-learning 的 max 只认最优，不管行为策略多吵。ε 越大压得越低——Sarsa 收敛到的是 ε-greedy 家族内的最优，不是全局 q*。', en: 'The measurement reads 0.51. Each step carries a 20% chance of a wild move (bumping a wall −1, taking the long way), and Sarsa honestly books that exploration risk; Q-learning’s max only acknowledges the optimum, however noisy the behavior policy. Larger ε pushes it lower — Sarsa converges to the best within the ε-greedy family, not the global q*.' } },
        ],
      },
      {
        kind: 'number',
        tag: { zh: '悬崖行走 · 数值', en: 'Cliff walking · the number' },
        stem: { zh: '书外延伸：把 3×3 世界的禁区奖励加深成 −10（当陷阱），ε=0.1 跑数值实验——执行 ε-greedy(Sarsa 表) 的平均折扣回报 ≈ [[1]]，比执行 ε-greedy(Q* 表) 的 0.269 反而更高。', en: 'Beyond the book: deepen the forbidden-cell reward of the 3×3 world to −10 (a pit) and run the numbers with ε=0.1 — executing ε-greedy on the Sarsa table earns an average discounted return ≈ [[1]], higher than the 0.269 earned on the Q* table.' },
        blanks: [
          { answer: 0.282, tol: 0.01,
            hint: { zh: '在 0.27 与 0.29 之间，比 0.269 略高。', en: 'Between 0.27 and 0.29, a shade above 0.269.' },
            why: { zh: '实测 ≈ 0.282。Q* 表只认最优价值，执行时一旦探索失足掉进陷阱（−10）就要自己扛全额账单；Sarsa 的表在学的时候就把"探索可能掉坑"定价进去了——离陷阱近的状态被压低，恢复动作更保守。Q-learning 学最短的危险路线，Sarsa 学安全的绕行路线，没有谁错。', en: 'The measurement reads ≈ 0.282. The Q* table only acknowledges optimal values, so a stumble into the pit (−10) during execution is paid in full; Sarsa’s table priced “exploration may fall in” while learning — states near the pit are pushed down and its recovery actions stay conservative. Q-learning takes the short dangerous route, Sarsa the safe detour — neither is wrong.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '悬崖行走 · 为什么', en: 'Cliff walking · the why' },
        stem: { zh: '同一个悬崖实验：Sarsa 表 0.282 > Q* 表 0.269，决定性的原因是 [[1]]。', en: 'Same cliff experiment: Sarsa’s table earns 0.282 against the Q* table’s 0.269 — the decisive reason is [[1]].' },
        blanks: [
          { choices: [
              { zh: 'Sarsa 在学表时就把探索掉坑的风险定价进了表里', en: 'Sarsa priced the risk of exploratory falls into its table while learning' },
              { zh: '执行时 Sarsa 的 ε 更小，掉坑次数更少', en: 'Sarsa runs with a smaller ε at execution time, falling in less often' },
              { zh: 'Sarsa 的表收敛到了更高的真值', en: 'Sarsa’s table converged to a higher truth' },
              { zh: 'Q-learning 的 max 目标在负奖励下不收敛', en: 'Q-learning’s max target fails to converge under negative rewards' },
            ], answer: 0,
            why: { zh: '两张表优化的对象本来就不是同一个：Sarsa 评估"带探索噪声走路"的价值，陷阱附近的 q 被系统性压低，于是绕行；Q* 表按无探索的最优记账，执行时 ε 一触发失足就付 −10。执行时两者用的是同一个 ε-greedy，掉坑概率没有差别——差别全在表里，不在执行里。', en: 'The two tables were never optimising the same object: Sarsa evaluates “walking with exploration noise on”, so q near the pit is pushed down systematically and it detours; the Q* table books the no-exploration optimum and pays −10 the moment ε trips at execution. At execution both use the same ε-greedy — the fall rate is identical. The difference lives in the tables, not in the execution.' } },
        ],
      },
    ],
  };

  /* ═══ L7 定理推导 ═══ */
  D.derivationSets = D.derivationSets || {};
  D.derivationSets['l7'] = {
    title: { zh: '第七讲 · 定理推导', en: 'Lecture 7 · Theorem Derivations' },
    items: [
      {
        id: 'dvoretzky-ql-convergence',
        name: { zh: 'Dvoretzky × Q-learning 收敛', en: 'Dvoretzky × Q-learning Convergence' },
        intro: {
          zh: '正文说“Q-learning 的收敛证明引用 Dvoretzky 定理”——这条链把引用做实：陈述定理，把误差递推整理成它的形状，逐条核对条件，最后落到“表格 Q-learning 以概率 1 收敛到 q*”，并圈出表格口径的边界。只核对条件，不重证 Dvoretzky 本身（它是 L6 的工具箱）。',
          en: 'The text says Q-learning’s convergence proof “cites Dvoretzky’s theorem” — this chain makes the citation real: state the theorem, reshape the error recursion into its form, verify the conditions one by one, land on “tabular Q-learning converges to q* almost surely”, and mark the tabular boundary. Conditions are verified only; Dvoretzky itself is L6’s toolbox and is not re-proved here.',
        },
        steps: [
          {
            tex: String.raw`q_{t+1}(s_t,a_t) = q_t(s_t,a_t) + \alpha_t\big[\underbrace{r_{t+1} + \gamma \max_{a'} q_t(s_{t+1},a')}_{\htmlClass{fx-gold}{\text{target moves with } q_t}} - q_t(s_t,a_t)\big] \quad\Longrightarrow\quad q_t \to q^* \ \text{a.s.}`,
            why: { zh: '要证的命题：表格 Q-learning 以概率 1（almost surely）收敛到最优动作价值 q*。证法不是从零开始：把误差整理成随机近似定理的形状，再逐条核对条件。为什么 L6 的基本 RM 定理不够用：RM 求根时目标是<strong>固定的未知常数</strong>，而这里的目标 r + γmax q<sub>t</sub>(s′,·) 含当前表的读数、随 t 变化——需要“目标会动”的版本。', en: 'The claim: tabular Q-learning converges to the optimal action values q* almost surely. The proof does not start from zero: reshape the error into the form of a stochastic-approximation theorem, then verify its conditions. Why L6’s basic RM theorem does not suffice: RM seeks the root of a <strong>fixed unknown constant</strong>, whereas here the target r + γmax q<sub>t</sub>(s′,·) reads the current table and moves with t — the “moving target” version is needed.' },
          },
          {
            tex: String.raw`\begin{gathered} \Delta_{k+1} = (1-\alpha_k)\,\Delta_k + \beta_k\,\eta_k \;\xrightarrow{\;\text{a.s.}\;}\; 0 \\[2pt] \text{(a) } \sum_k \alpha_k = \infty,\;\; \sum_k \alpha_k^2 < \infty,\;\; \sum_k \beta_k^2 < \infty \;\text{(uniformly a.s.)} \qquad \text{(b) } \mathbb{E}[\eta_k \mid H_k] = 0,\;\; \mathbb{E}[\eta_k^2 \mid H_k] \le C \end{gathered}`,
            why: { zh: '<strong>Dvoretzky 定理（书 Theorem 6.2）</strong>：随机递推 Δ<sub>k+1</sub> = (1−α<sub>k</sub>)Δ<sub>k</sub> + β<sub>k</sub>η<sub>k</sub> 在两组条件下以概率 1 收敛到零——(a) 步长与系数的级数条件；(b) 噪声对历史 H<sub>k</sub> 零均值、方差有界。关键放宽：α<sub>k</sub>、β<sub>k</sub> 可以是依赖历史的随机变量（基本 RM 只许确定性步长）。Q-learning 里 α 取决于访问次数，正吃这个放宽的红利。', en: '<strong>Dvoretzky’s theorem (book Theorem 6.2)</strong>: the random recursion converges to zero almost surely under two groups of conditions — (a) series conditions on the steps and coefficients; (b) noise that is zero-mean given the history H<sub>k</sub> with bounded variance. The key relaxation: α<sub>k</sub> and β<sub>k</sub> may be random and history-dependent (basic RM allows only deterministic steps). Q-learning’s visit-count-dependent α feeds exactly on this relaxation.' },
          },
          {
            tex: String.raw`\begin{gathered} \Delta_{k+1}(s) = (1-\alpha_k(s))\,\Delta_k(s) + \beta_k(s)\,\eta_k(s), \qquad s \in \mathcal{S} \\[2pt] \text{(a) steps: } \sum_k \alpha_k(s) = \infty,\; \sum_k \alpha_k^2(s) < \infty,\; \sum_k \beta_k^2(s) < \infty,\; \mathbb{E}[\beta_k(s)\mid H_k] \le \mathbb{E}[\alpha_k(s)\mid H_k] \;\text{(uniformly a.s.)} \\[2pt] \text{(b) contraction: } \big\|\mathbb{E}[\eta_k(s) \mid H_k]\big\|_\infty \le \gamma\|\Delta_k\|_\infty,\; \gamma \in (0,1) \qquad \text{(c) variance: } \mathrm{var}[\eta_k(s) \mid H_k] \le C\big(1+\|\Delta_k\|_\infty\big)^2 \end{gathered}`,
            why: { zh: '真正被 Theorem 7.1 的证明引用的是升级版 <strong>Theorem 6.3</strong>：把单变量的 Dvoretzky 推广到有限指标集 S（这里 = 全体状态-动作对）；条件 (a) 在级数组上补两条 β 侧约束（Σβ<sub>k</sub>²(s)&lt;∞、E[β<sub>k</sub>(s)|H<sub>k</sub>] ≤ E[α<sub>k</sub>(s)|H<sub>k</sub>]——噪声系数不得压过步长），并把零均值要求放宽成“条件期望被误差的 γ 倍压住”（b）——系统漂移不必为零，但必须收缩；方差条件 (c) 同步放宽为“随误差平方增长以内”。Q-learning 的收敛证明“与 Theorem 7.1 类似”（书 §7.4 原话），套的正是这个模板。', en: 'What Theorem 7.1’s proof actually cites is the upgraded <strong>Theorem 6.3</strong>: Dvoretzky generalised to a finite index set S (here: all state–action pairs); condition (a) adds two β-side constraints on top of the series group (Σβ<sub>k</sub>²(s)&lt;∞ and E[β<sub>k</sub>(s)|H<sub>k</sub>] ≤ E[α<sub>k</sub>(s)|H<sub>k</sub>] — the noise coefficient must not outweigh the step), with the zero-mean requirement relaxed to “the conditional mean is pressed below γ times the error” (b) — the systematic drift need not vanish, but it must contract; the variance condition (c) is likewise relaxed to “within squared-error growth”. Q-learning’s convergence analysis is “similar to Theorem 7.1” (book §7.4, verbatim) and fills in exactly this template.' },
          },
          {
            tex: String.raw`\underbrace{\sum\alpha = \infty,\; \sum\alpha^2 < \infty}_{\text{(a) reach it, then settle}} \qquad \underbrace{\big\|\mathbb{E}[\eta \mid H]\big\|_\infty \le \gamma\|\Delta\|_\infty}_{\text{(b) drift pulls back}} \qquad \underbrace{\mathrm{var}[\eta \mid H] \le C\big(1+\|\Delta\|_\infty\big)^2}_{\text{(c) noise stays tame}}`,
            why: { zh: '三个条件各一句直觉：(a) <strong>走得到又抖得停</strong>——Σα=∞ 保证再远的误差也有足够步数走完，Σα²&lt;∞ 保证后期抖动收敛（L6 已逐条验尸）；(b) <strong>目标会动，但动不过误差</strong>——漂移被 γ&lt;1 逐环打折，往回拉而非往外推；(c) <strong>噪声有界但不要求消失</strong>——它在期望中相消（大数定律的原料）。当漂移恒为零（目标固定）时 (b) 自动成立，剩下的正是 L6 RM 的两条件：Dvoretzky 推广了 RM，RM 是它的特例。', en: 'One sentence of intuition per condition: (a) <strong>you can get there, and the wobble dies</strong> — Σα=∞ supplies enough steps for any error, Σα²&lt;∞ settles the late oscillations (autopsied in L6); (b) <strong>the target moves, but never farther than the error</strong> — the drift is discounted link by link by γ&lt;1, pulled back rather than pushed out; (c) <strong>noise is bounded yet need not vanish</strong> — it cancels in expectation (raw material for the law of large numbers). When the drift is identically zero (a fixed target), (b) holds automatically and what remains is exactly L6’s two RM conditions: Dvoretzky generalises RM; RM is its special case.' },
          },
          {
            tex: String.raw`\Delta_t(s,a) \;\triangleq\; q_t(s,a) - q^*(s,a), \qquad \|\Delta_t\|_\infty = \max_{s,a}\big|\Delta_t(s,a)\big|, \qquad \text{goal: } \Delta_t(s,a) \to 0 \;\; \forall (s,a)`,
            why: { zh: '误差 = 当前表减真值表；范数 ‖Δ<sub>t</sub>‖<sub>∞</sub> 取全表最大格子差（书 Theorem 6.3 的口径）。“q<sub>t</sub> → q*”等价于“每一对的误差都趋于零”。接下来推导的核心动作只有两类：定义误差，把更新式改写成误差的语言（两侧减 q*）。', en: 'The error = the current table minus the true table; the norm ‖Δ<sub>t</sub>‖<sub>∞</sub> takes the largest cell gap over the whole table (the book Theorem 6.3 convention). The claim “q<sub>t</sub> → q*” is equivalent to “every pair’s error tends to zero”. From here the derivation has only two core moves: define the error, and rewrite the update in the error’s language (subtract q* from both sides).' },
          },
          {
            tex: String.raw`q^*(s,a) = \mathbb{E}\big[R_{t+1} + \gamma \max_{a'} q^*(S_{t+1}, a') \,\big|\, S_t = s,\, A_t = a\big]`,
            why: { zh: 'q* 是动作价值版 Bellman 最优方程（式 7.19，Box 7.5）的不动点——Q-learning 就是解这个方程的随机近似算法。误差递推拿它当“零点”：更新目标与这个方程右边的差，就是误差的全部来源；后面凡出现 E[R + γmax q(S′,a′)|s,a]，都用它换掉 q*(s,a)。', en: 'q* is the fixed point of the action-value Bellman optimality equation (Eq. 7.19, Box 7.5) — Q-learning is precisely the stochastic-approximation algorithm solving this equation. It serves as the “zero” of the error recursion: whatever the update target deviates from this equation’s right-hand side is the entire source of the error; whenever E[R + γmax q(S′,a′)|s,a] appears later, q*(s,a) is exchanged for it.' },
          },
          {
            tex: String.raw`\begin{gathered} (s_t,a_t)=(s,a):\;\; \Delta_{t+1}(s,a) = (1-\alpha_t)\,\Delta_t(s,a) + \alpha_t\,\underbrace{\big[r_{t+1} + \gamma\max_{a'} q_t(s_{t+1},a') - q^*(s,a)\big]}_{\htmlClass{fx-green}{\eta_t(s,a)}} \\[2pt] (s_t,a_t)\neq(s,a):\;\; \Delta_{t+1}(s,a) = \Delta_t(s,a) \;\equiv\; (1-\alpha_t)\Delta_t(s,a) + \alpha_t\eta_t(s,a) \;\;\text{with } \alpha_t = \eta_t = 0 \end{gathered}`,
            why: { zh: '书的统一化技巧（Theorem 7.1 证明的式 7.7–7.9 同款）：访问到 (s,a) 的时刻，两侧减 q* 凑出 (1−α)Δ 骨架，方括号整体记作 η<sub>t</sub>(s,a)；没访问到的时刻表项不动，恰好等于 α 记零的同一表达式。于是无论访问与否，误差递推<strong>永远</strong>是 Δ<sub>t+1</sub> = (1−α<sub>t</sub>)Δ<sub>t</sub> + α<sub>t</sub>η<sub>t</sub>——Theorem 6.3 要的形状原样出现（β<sub>t</sub> = α<sub>t</sub>，E[β|H] ≤ E[α|H] 取等号）。', en: 'The book’s unification trick (same as Eqs. 7.7–7.9 in Theorem 7.1’s proof): at moments that visit (s,a), subtract q* from both sides to assemble the (1−α)Δ skeleton, naming the whole bracket η<sub>t</sub>(s,a); at other moments the entry stays put — exactly the same expression with α recorded as zero. So visited or not, the error recursion is <strong>always</strong> Δ<sub>t+1</sub> = (1−α<sub>t</sub>)Δ<sub>t</sub> + α<sub>t</sub>η<sub>t</sub> — Theorem 6.3’s shape appears verbatim (with β<sub>t</sub> = α<sub>t</sub>, so E[β|H] ≤ E[α|H] holds with equality).' },
          },
          {
            tex: String.raw`\eta_t(s,a) = \underbrace{\Big[(r_{t+1} - \mathbb{E}R) + \gamma\big(\max_{a'} q_t(s_{t+1},a') - \mathbb{E}\max_{a'} q_t(S_{t+1},a')\big)\Big]}_{\htmlClass{fx-green}{\text{sampling noise}}} \;+\; \underbrace{\gamma\,\mathbb{E}\big[\max_{a'} q_t(S_{t+1},a') - \max_{a'} q^*(S_{t+1},a')\big]}_{\htmlClass{fx-gold}{\text{systematic drift}}}`,
            why: { zh: '在 η<sub>t</sub>(s,a) 里垫一层条件期望 F<sub>t</sub>(s,a) ≜ E[R + γmax q<sub>t</sub>(S<sub>t+1</sub>,·)|s,a] 做中介：采样对期望的偏离归<strong>噪声</strong>（绿），期望对 q* 的偏离归<strong>系统漂移</strong>（金）——后者再用 q* 的方程（上一步）折叠成“同一转移分布下两张表的 max 之差的期望”。关键观察：噪声部分继承 Dvoretzky 的零均值血统（下步核对）；漂移部分<strong>不是</strong>零均值——这正是基本 RM 不够用、必须换 Theorem 6.3 的地方（条件 (b) 专收留这种漂移）。', en: 'Pad η<sub>t</sub>(s,a) with a layer of conditional expectation F<sub>t</sub>(s,a) ≜ E[R + γmax q<sub>t</sub>(S<sub>t+1</sub>,·)|s,a] as intermediary: the sample’s deviation from its expectation goes to the <strong>noise</strong> (green), the expectation’s deviation from q* goes to the <strong>systematic drift</strong> (gold) — the latter then folds, via q*’s own equation (previous step), into “the expected max-gap between the two tables under the same transition distribution”. Key observation: the noise part inherits Dvoretzky’s zero-mean bloodline (checked next); the drift part is <strong>not</strong> zero-mean — precisely why basic RM does not suffice and Theorem 6.3 must step in (its condition (b) shelters exactly this drift).' },
          },
          {
            tex: String.raw`\mathbb{E}\big[\underbrace{(r_{t+1} - \mathbb{E}R) + \gamma\big(\max_{a'} q_t(s_{t+1},a') - \mathbb{E}\max_{a'} q_t(S_{t+1},a')\big)}_{\htmlClass{fx-green}{\text{sampling noise}}}\;\Big|\; H_t\big] = 0 \quad\Longrightarrow\quad \mathbb{E}[\eta_t(s,a) \mid H_t] = \htmlClass{fx-gold}{\text{(drift only)}}`,
            why: { zh: '两个事实合围。其一（马尔可夫性）：给定 (s,a) 后 (r<sub>t+1</sub>, s<sub>t+1</sub>) 的分布与历史 H<sub>t</sub> 无关，条件期望退化为 E[·|s,a]；q<sub>t</sub> 在 H<sub>t</sub> 上是确定的表，不添随机性。其二（条件期望的定义）：随机变量减去自己的期望，均值恰为零——采样噪声整块消失，只剩系统漂移。方差侧：奖励有界 + 表有界 ⇒ 噪声方差有界。Dvoretzky 的零均值要求在“采样部分”成立；漂移交给 6.3 的收缩条件——分工明确。', en: 'Two facts close in. First (Markov property): given (s,a), the distribution of (r<sub>t+1</sub>, s<sub>t+1</sub>) does not depend on the history H<sub>t</sub>, so the conditional expectation degenerates to E[·|s,a]; q<sub>t</sub> is a fixed table given H<sub>t</sub> and adds no randomness. Second (definition of conditional expectation): a random variable minus its own expectation has exactly zero mean — the sampling noise vanishes wholesale, leaving only the systematic drift. On the variance side: bounded rewards plus a bounded table give bounded noise variance. Dvoretzky’s zero-mean requirement holds for the sampling part; the drift is handed to 6.3’s contraction condition — a clean division of labour.' },
            blank: {
              q: { zh: '噪声块在条件期望下整块归零——起决定作用的事实是哪一个？', en: 'The noise block vanishes wholesale under the conditional expectation — which fact does the decisive work?' },
              choices: [
                { zh: '给定 (s,a) 后 (r, s′) 的分布不依赖历史（马尔可夫性），且 q_t 在历史上是确定的表——采样对自身条件期望的偏差均值为零', en: 'given (s,a), the distribution of (r, s′) does not depend on history (Markov property) and q_t is a fixed table given the history — a sample deviates from its own conditional expectation with mean zero' },
                { zh: '步长 α_t 衰减得足够快，把噪声的均值压到了零', en: 'the step size α_t decays fast enough to press the noise mean to zero' },
                { zh: '奖励有界，而有界随机变量的均值必为零', en: 'rewards are bounded, and a bounded random variable must have zero mean' },
                { zh: '每个 (s,a) 被无穷次访问，大数定律把每一次噪声都洗成零均值', en: 'every (s,a) is visited infinitely often, and the law of large numbers washes each single noise term to zero mean' },
              ],
              answer: 0,
              whyWrong: [
                '',
                { zh: 'α 只决定这步走多远，既不改变噪声的分布也不改变均值；零均值是采样机制的性质，与步长无关。', en: 'α only decides how far this step travels; it changes neither the noise distribution nor its mean — zero-meanness belongs to the sampling mechanism, not to the step size.' },
                { zh: '有界只保证方差有界；有界随机变量的均值可以是任何数——r 的均值是 E[R|s,a]，本就不必为零、也无需为零。', en: 'Boundedness only secures bounded variance; a bounded random variable may carry any mean — r’s mean is E[R|s,a], which need not be zero and is never required to be.' },
                { zh: '层次反了：逐点零均值不需要任何访问次数假设，它是条件期望定义的直接推论；无穷访问保证的是噪声充分相消（收敛到真值而非偏移值）——那是步长条件的事。', en: 'The levels are swapped: pointwise zero mean needs no visitation assumption — it is a direct corollary of the definition of conditional expectation; infinite visits secure the full cancellation of noise (convergence to the truth, not to a shifted value) — that is the step-size condition’s business.' },
              ],
              hint: { zh: '条件在历史上之后，更新式里还剩什么是随机的？', en: 'After conditioning on the history, what inside the update is still random?' },
            },
          },
          {
            tex: String.raw`\mathbb{E}[\eta_t(s,a) \mid H_t] = \gamma\sum_{s'} p(s'|s,a)\big[\max_{a'} q_t(s',a') - \max_{a'} q^*(s',a')\big] \quad\Longrightarrow\quad \big|\mathbb{E}[\eta_t(s,a) \mid H_t]\big| \;\le\; \gamma\max_{s',a'}\big|\Delta_t(s',a')\big| = \gamma\|\Delta_t\|_\infty`,
            why: { zh: '把漂移精确算出来：用 q* 的方程换掉期望里的 q*(s,a)，得 E[η<sub>t</sub>|H<sub>t</sub>] = γ Σ<sub>s′</sub> p(s′|s,a)[max q<sub>t</sub>(s′,·) − max q*(s′,·)]。再收口：max 算子 1-Lipschitz（|max<sub>a</sub>x(a) − max<sub>a</sub>y(a)| ≤ max<sub>a</sub>|x(a)−y(a)|，换表最多让 max 变动两表最大格差）+ Σ<sub>s′</sub>p = 1 ⇒ |E[η<sub>t</sub>|H<sub>t</sub>]| ≤ γ‖Δ<sub>t</sub>‖<sub>∞</sub>。<strong>Theorem 6.3 条件 (b) 核对完毕</strong>——顺带消化了多对耦合：本对的漂移以全表最大误差为上界，其他格子的误差只能往回拉、不能往外推。', en: 'Compute the drift exactly: replace the q*(s,a) inside the expectation using q*’s equation to get E[η<sub>t</sub>|H<sub>t</sub>] = γ Σ<sub>s′</sub> p(s′|s,a)[max q<sub>t</sub>(s′,·) − max q*(s′,·)]. Then close it: the max operator is 1-Lipschitz (|max<sub>a</sub>x(a) − max<sub>a</sub>y(a)| ≤ max<sub>a</sub>|x(a)−y(a)| — swapping tables moves the max by at most the largest cell gap) plus Σ<sub>s′</sub>p = 1 give |E[η<sub>t</sub>|H<sub>t</sub>]| ≤ γ‖Δ<sub>t</sub>‖<sub>∞</sub>. <strong>Theorem 6.3 condition (b) verified</strong> — and the multi-pair coupling is digested along the way: this pair’s drift is bounded by the table-wide max error, so other cells’ errors can only pull back, never push out.' },
          },
          {
            tex: String.raw`\big\|\mathbb{E}[\eta_t(s,a) \mid H_t]\big\|_\infty \;\le\; \htmlClass{fx-gold}{\gamma}\,\|\Delta_t\|_\infty \quad\text{with } \gamma \in (0,1) \qquad\Longrightarrow\qquad \text{condition (b) of Theorem 6.3}`,
            why: { zh: 'γ &lt; 1 的岗位在收缩条件 (b)：它把“目标漂移”压到当前全表最大误差的 γ 倍以内——目标会动，但动不过误差本身。若 γ = 1，上界失去折扣、漂移可与误差打平，逐环衰减断链；γ &lt; 1 保证表内误差互相拖向零而非互相放大。这个 γ 正是 Bellman 算子那个 γ：L4 的压缩映射与这里的噪声收缩，是同一台折扣发动机的两次点火。', en: 'γ &lt; 1’s post is the contraction condition (b): it presses the target’s drift below γ times the table-wide max error — the target moves, but never farther than the error itself. At γ = 1 the bound loses its cut, the drift can match the error, and the per-link decay snaps; γ &lt; 1 ensures the table’s errors drag each other toward zero rather than amplifying one another. This γ is the Bellman operator’s γ: L4’s contraction mapping and this noise contraction are the same discount engine firing twice.' },
            blank: {
              q: { zh: 'γ &lt; 1 在这套收敛论证里担纲的角色是？', en: 'What role does γ &lt; 1 play in this convergence argument?' },
              choices: [
                { zh: '收缩条件 (b)：系统漂移 ≤ γ × 全表最大误差——目标会动，但动不过误差本身', en: 'the contraction condition (b): systematic drift ≤ γ × the table-wide max error — the target moves, but never farther than the error itself' },
                { zh: '步长条件 (a)：γ < 1 保证 Σα = ∞ 且 Σα² < ∞', en: 'the step-size condition (a): γ < 1 guarantees Σα = ∞ and Σα² < ∞' },
                { zh: '噪声零均值：γ < 1 把噪声的均值变成零', en: 'noise zero-mean: γ < 1 turns the noise mean into zero' },
                { zh: '它只是把奖励统一缩放一个倍数，不参与任何条件', en: 'it merely rescales all rewards by a constant and takes part in no condition' },
              ],
              answer: 0,
              whyWrong: [
                '',
                { zh: '步长条件只审查 α 自己的级数：1/N 型步长与 γ 毫无关系地满足 (a)，γ 根本不出现在 (a) 的表达式里。', en: 'The step-size condition audits only the series of α itself: 1/N-type steps satisfy (a) with γ nowhere in sight; γ never appears in (a) at all.' },
                { zh: '零均值来自“采样对条件期望的偏差”这一身份，常数乘零期望仍是零期望——γ 乘在噪声里不改变均值，顶多帮忙压方差。', en: 'Zero mean comes from the identity “a sample deviating from its conditional expectation”; a constant times a zero mean stays zero — γ riding inside the noise changes no mean, at most helping the variance.' },
                { zh: '把 γ 设成 1 试试：漂移上界变成 ‖Δ‖∞（不打折），逐环衰减断链，连 |q| ≤ r_max/(1−γ) 的有界性也会爆掉。γ 恰是这套证明的承重墙。', en: 'Set γ = 1 and watch: the drift bound becomes ‖Δ‖∞ (no cut), the per-link decay snaps, and even the boundedness |q| ≤ r_max/(1−γ) explodes. γ is the load-bearing wall of this proof.' },
              ],
              hint: { zh: '问自己：γ 从 1 变到 0.999，哪个条件的成立性最先被改变？', en: 'Ask yourself: as γ moves from 1 to 0.999, which condition changes its verdict first?' },
            },
          },
          {
            tex: String.raw`|q_t(s,a)| \le \frac{r_{\max}}{1-\gamma}, \qquad |q^*(s,a)| \le \frac{r_{\max}}{1-\gamma} \qquad\Longrightarrow\qquad \mathrm{var}[\eta_t(s,a) \mid H_t] \le C\big(1+\|\Delta_t\|_\infty\big)^2 \quad\text{(c)}`,
            why: { zh: '有界性先看真值：折扣回报 |G| ≤ r<sub>max</sub>/(1−γ)（L1 等比级数），q* 天然有界。再看估计：更新是凸组合（α ∈ (0,1]）——若全表落在 [−B, B] 内且 B = r<sub>max</sub>/(1−γ)，则目标 r + γmax q<sub>t</sub>(s′,·) 也落在 [−B, B] 内（r<sub>max</sub> + γB = B），归纳下去整张表永不越界。于是 η<sub>t</sub> 由有界的 r、有界的表读数与有界的 q* 组成，方差被常数封顶——远强于条件 (c) 的“不超过误差平方增长”。表格世界天然有界，无需投影算子（投影登场要等 L8 的函数近似）。', en: 'Boundedness, truth first: discounted returns obey |G| ≤ r<sub>max</sub>/(1−γ) (L1’s geometric series), so q* is bounded by nature. Then the estimate: the update is a convex combination (α ∈ (0,1]) — if the whole table sits in [−B, B] with B = r<sub>max</sub>/(1−γ), the target r + γmax q<sub>t</sub>(s′,·) also lands in [−B, B] (r<sub>max</sub> + γB = B), and by induction the table never escapes. Hence η<sub>t</sub> is assembled from bounded r, bounded table readings and bounded q*, so its variance is capped by a constant — far stronger than condition (c)’s “within squared-error growth”. The tabular world is bounded by nature; no projection operator needed (projection waits for L8’s function approximation).' },
          },
          {
            tex: String.raw`\sum_{t:\,(s_t,a_t)=(s,a)} \alpha_t(s,a) = \infty, \qquad \sum_{t:\,(s_t,a_t)=(s,a)} \alpha_t^2(s,a) < \infty \qquad\text{for every } (s,a)`,
            why: { zh: '条件 (a) 的确切形状：没被访问的时刻 α 记零，级数只对访问时刻求和。Σα = ∞ 要求每个 (s,a) 被<strong>无穷次访问</strong>——ε-greedy（乃至完全随机，Figure 7.4）的行为策略保证这一点；访问计数步长 α = 1/N(s,a) 同时给出 Σα = ∞（调和级数发散）与 Σα² &lt; ∞（平方收敛）。注意 α<sub>t</sub>(s,a) 依赖历史（访问次数）：基本 RM 的确定性步长假设在此不成立，必须用允许随机步长的 Dvoretzky/6.3——这是“为什么偏偏要它”的第二条理由。', en: 'Condition (a) in its exact shape: non-visiting times record α = 0, so the series run over visiting times only. Σα = ∞ demands that every (s,a) be <strong>visited infinitely often</strong> — guaranteed by an ε-greedy (or even fully random, Figure 7.4) behavior policy; visit-count steps α = 1/N(s,a) deliver both Σα = ∞ (the harmonic series diverges) and Σα² &lt; ∞ (its square converges). Note that α<sub>t</sub>(s,a) depends on history (visit counts): basic RM’s deterministic-step assumption fails here, and the history-tolerant Dvoretzky/6.3 is mandatory — the second reason why it, of all theorems.' },
          },
          {
            tex: String.raw`\Delta_t(s,a) \xrightarrow{\;\text{a.s.}\;} 0 \;\;\text{for every } (s,a) \qquad\Longleftrightarrow\qquad \|\Delta_t\|_\infty \to 0 \qquad\Longleftrightarrow\qquad q_t \to q^*`,
            why: { zh: '三条条件对每个 (s,a) 全部核对通过——(a) 覆盖性步长、(b) γ-收缩、(c) 有界方差——Theorem 6.3 的结论到账：Δ<sub>t</sub>(s,a) → 0（a.s.）对所有 (s,a)；有限表格上逐对收敛即全表一致收敛。两件附带礼物：① 与行为策略无关（只要探索充分——off-policy 的收敛保证，完全随机行为也在保护范围）；② max 已在目标里，q<sub>t</sub> → q* 后 argmax 直接提取最优策略，无需另跑改进步。', en: 'All three conditions verified for every (s,a) — (a) coverage steps, (b) γ-contraction, (c) bounded variance — and Theorem 6.3 delivers: Δ<sub>t</sub>(s,a) → 0 almost surely for all (s,a); on a finite table, per-pair convergence is uniform whole-table convergence. Two gifts ride along: ① independence of the behavior policy (given sufficient exploration — the off-policy guarantee, with fully random behavior inside the protection zone); ② the max already sits in the target, so once q<sub>t</sub> → q*, argmax extracts the optimal policy with no separate improvement step.' },
          },
          {
            tex: String.raw`\hat{q}(s,a;w_t) \;\not\to\; q^*(s,a) \quad\text{in general under function approximation}`,
            why: { zh: '这条保证是<strong>表格口径</strong>的：每个 (s,a) 一格、逐格独立更新、天然有界——三件表格特产缺一不可。L8 把表换成参数化函数后：更新变半梯度（上面条件核对的推导不再逐字成立）、有界性失去凸组合保护、max 还会传播高估误差——收敛保证不继承，需要目标网络等工程手段稳住。这也是下一讲的入场动机。', en: 'This guarantee is <strong>tabular</strong>: one cell per (s,a), per-cell independent updates, boundedness by nature — three tabular specialities, none dispensable. When L8 swaps the table for a parameterised function: updates become semi-gradient (the condition verifications above no longer hold verbatim), boundedness loses its convex-combination shield, and the max propagates overestimation — the guarantee is not inherited, and engineering devices like target networks step in to steady it. That is exactly the motivation for the next lecture.' },
          },
          {
            tex: String.raw`\underbrace{(1-\alpha_t)\,\Delta_t}_{\text{skeleton}} + \alpha_t\Big[\underbrace{\text{sampling noise}}_{\text{zero mean, bounded var.}} + \underbrace{\gamma\,\|\Delta_t\|_\infty}_{\text{contractive drift}}\Big] \;\xrightarrow{\;\text{a.s.}\;}\; 0`,
            why: { zh: '回看整条链：陈述 Dvoretzky（6.2）→ 升级到 6.3（多对 + 收缩）→ 条件直觉（RM 是特例）→ 定义误差 → 对齐 q* 的最优方程 → 统一递推（访问/未访问）→ 拆噪声/漂移 → 零均值核对 → Lipschitz 收缩 → 有界与方差 → 覆盖性步长 → 三条件全过、结论到账 → 圈出表格边界。正文那句“收敛证明引用 Dvoretzky”从此有了内容：引用不是一笔带过，而是把每个核对一件件做实。', en: 'Look back along the chain: state Dvoretzky (6.2) → upgrade to 6.3 (multi-pair + contraction) → intuition per condition (RM as special case) → define the error → align with q*’s optimality equation → the unified recursion (visited / not) → split noise from drift → verify zero mean → Lipschitz contraction → boundedness and variance → coverage steps → all conditions pass, the conclusion arrives → mark the tabular boundary. The text’s phrase “the proof cites Dvoretzky” now has content: the citation is not a wave of the hand — it is every verification, made real one by one.' },
          },
        ],
      },
    ],
  };

  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l7 = D.otherLectures.find(l => l.no === 7);
  if (l7) l7.live = true;
})();

/* ===== L7 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 8 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 29–36，共 8 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l7'] = {
    min: 29,
    max: 36,
    episodes: [
      { n: 29, en: "Temporal-Difference Learning (P1-Motivating example)", yt: "u1X-7XX3dtI" },
      { n: 30, en: "Temporal-Difference Learning (P2-TD algorithm: introduction)", yt: "XiCUsc7CCE0" },
      { n: 31, en: "Temporal-Difference Learning (P3-TD algorithm: convergence)", yt: "faWg8M91-Oo" },
      { n: 32, en: "Temporal-Difference Learning (P4-Sarsa)", yt: "jYwQufkBUPo" },
      { n: 33, en: "Temporal-Difference Learning (P5-Expected Sarsa & n-step Sarsa)", yt: "0kKzQbWZOlk" },
      { n: 34, en: "Temporal-Difference Learning (P6-Q-learning: introduction)", yt: "4BvYR2hm730" },
      { n: 35, en: "Temporal-Difference Learning (P7-Q-learning: pseudo code)", yt: "I0YhlOIFF4s" },
      { n: 36, en: "Temporal-Difference Learning (P8-Unified viewpoint and summary)", yt: "3t74lvk1GBM" }
    ],
  };
  D.sections['l7-td0'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l7' } });
})();
