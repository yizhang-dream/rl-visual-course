/* ═══════════════════════════════════════════════════════════
   L4 · 值迭代与策略迭代（书 Ch.4）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §4.1 值迭代 ---- */
  S['l4-vi'] = {
    kicker: 'L4 · §4.1',
    title: { zh: '值迭代：L3 那张"票"今天兑现', en: 'Value Iteration: Cashing the Ticket from L3' },
    blocks: [
      { t: 'p', zh: 'L3 的定理 3.3 说"v<sub>k+1</sub> = f(v<sub>k</sub>) 能解 BOE"，本章把这句话落成可执行的算法。<strong>值迭代</strong>的每一轮分两步：<strong>策略更新（policy update）</strong>π<sub>k+1</sub> = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>)——对着当前的 v 挑最好的策略（逐状态看就是贪心）；<strong>价值更新（value update）</strong>v<sub>k+1</sub> = r<sub>π<sub>k+1</sub></sub> + γP<sub>π<sub>k+1</sub></sub>v<sub>k</sub>——沿着刚挑的策略走一步。逐元素合并后，每轮就是那个熟悉的节奏：', en: 'L3\'s Theorem 3.3 promised that "v<sub>k+1</sub> = f(v<sub>k</sub>) solves the BOE"; this chapter turns the promise into an executable algorithm. Each iteration of <strong>value iteration</strong> has two steps: a <strong>policy update</strong> π<sub>k+1</sub> = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>) — pick the best policy for the current v (greedy, state by state); and a <strong>value update</strong> v<sub>k+1</sub> = r<sub>π<sub>k+1</sub></sub> + γP<sub>π<sub>k+1</sub></sub>v<sub>k</sub> — take one step along the freshly picked policy. Merged elementwise, each round is the familiar rhythm:' },
      { t: 'formula', lbl: '值迭代的单轮节奏 · One iteration of value iteration',
        html: 'v<sub>k</sub>(s) → q<sub>k</sub>(s,a) → <span style="color:var(--violet)">贪心 π<sub>k+1</sub>(s) = argmax<sub>a</sub> q<sub>k</sub>(s,a)</span> → <span style="color:var(--accent-deep)">v<sub>k+1</sub>(s) = max<sub>a</sub> q<sub>k</sub>(s,a)</span>' },
      { t: 'callout', variant: 'danger', zh: '<strong>书上一处极容易被忽略的提醒</strong>：迭代过程中的 v<sub>k</sub> <strong>不是状态值</strong>！它一般不满足任何策略的 Bellman 方程（既不是 v<sub>π<sub>k</sub></sub> 也不是 v<sub>π<sub>k+1</sub></sub>），只是算法的中间产物；同理 q<sub>k</sub> 也不是动作价值。它们只是恰好<strong>收敛到</strong>最优值而已。考试和作业里都要把这个说法写对。', en: '<strong>A reminder from the book that is easy to skim past</strong>: the intermediate v<sub>k</sub> is <strong>not a state value</strong>! In general it satisfies no policy’s Bellman equation (neither v<sub>π<sub>k</sub></sub> nor v<sub>π<sub>k+1</sub></sub>) — it is merely an intermediate quantity of the algorithm; likewise q<sub>k</sub> is not an action value. They merely happen to <strong>converge to</strong> the optimal values. Phrase this correctly in exams and reports.' },
      { t: 'p', zh: '书上用 2×2 世界把 Algorithm 4.1 手工跑了两轮：k=0 时 v₀ = 0，q 表全是即时奖励，贪心挑出 π₁（s1 处 a₅ 和 a₃ 并列最大、随便选一个——这正是"最优策略不必唯一"的现场演示）；k=1 时 π₂ 已经是最优策略。下面自己跑一遍，对照书里的 Table 4.2/4.3。', en: 'The book hand-runs Algorithm 4.1 for two rounds on a 2×2 world: at k=0 with v₀ = 0 the q-table is all immediate rewards, and the greedy π₁ (a₅ and a₃ tie at s1 — pick either, a live demonstration that "optimal policies need not be unique"); at k=1 π₂ is already optimal. Run it yourself below and check against the book\'s Tables 4.2/4.3.' },
      { t: 'widget', component: 'l4-vi-sim' },
    ],
  };

  /* ---- §4.2 策略迭代 ---- */
  S['l4-pi'] = {
    kicker: 'L4 · §4.2',
    title: { zh: '策略迭代：评估与改进的华尔兹', en: 'Policy Iteration: The Waltz of Evaluation and Improvement' },
    blocks: [
      { t: 'p', zh: '<strong>策略迭代</strong>换一个角度组织同样的零件。每轮两步：<strong>策略评估（PE）</strong>——解 Bellman 方程 v<sub>π<sub>k</sub></sub> = r<sub>π<sub>k</sub></sub> + γP<sub>π<sub>k</sub></sub>v<sub>π<sub>k</sub></sub>，把当前策略的分数算清楚（闭式解或 L2 的迭代解都行）；<strong>策略改进（PI）</strong>——π<sub>k+1</sub> = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>π<sub>k</sub></sub>)，也就是 L3 开场那个"换上 q 最大的动作"的全网格放大版。', en: '<strong>Policy iteration</strong> organises the same parts from a different angle. Each round has two steps: <strong>policy evaluation (PE)</strong> — solve the Bellman equation v<sub>π<sub>k</sub></sub> = r<sub>π<sub>k</sub></sub> + γP<sub>π<sub>k</sub></sub>v<sub>π<sub>k</sub></sub> to grade the current policy properly (closed-form or L2\'s iterative solution); and <strong>policy improvement (PI)</strong> — π<sub>k+1</sub> = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>π<sub>k</sub></sub>), the grid-wide scale-up of L3\'s "swap in the greatest q" move.' },
      { t: 'p', zh: '三连问由书逐条回答。<strong>① 评估怎么做？</strong>闭式解管理论、迭代解管实践（内嵌一个 L2 式的循环——"迭代里套迭代"）。<strong>② 为什么改进后一定更好？</strong>引理 4.1：v<sub>π<sub>k+1</sub></sub> ≥ v<sub>π<sub>k</sub></sub> 逐格成立。<strong>③ 为什么收敛到最优？</strong>定理 4.1 的证明极漂亮——把策略迭代和值迭代从同一起点并排跑，归纳可证 <strong>v<sub>k</sub> ≤ v<sub>π<sub>k</sub></sub> ≤ v*</strong>：策略迭代每一步都压着值迭代打，而值迭代已知收敛到 v*，所以 v<sub>π<sub>k</sub></sub> 单调递增、上界 v*，由单调收敛定理直奔 v*。<strong>策略迭代收敛更快，正是"评估得更彻底"换来的。</strong>', en: 'Three questions, answered in the book one by one. <strong>① How to evaluate?</strong> Closed-form for theory, iterative for practice (an L2-style loop nested inside — an iteration inside an iteration). <strong>② Why does improvement help?</strong> Lemma 4.1: v<sub>π<sub>k+1</sub></sub> ≥ v<sub>π<sub>k</sub></sub> holds elementwise. <strong>③ Why converge to optimal?</strong> The proof of Theorem 4.1 is a beauty — race policy iteration against value iteration from the same start and inductively show <strong>v<sub>k</sub> ≤ v<sub>π<sub>k</sub></sub> ≤ v*</strong>: policy iteration dominates value iteration at every step, and since value iteration converges to v*, the monotone nondecreasing sequence v<sub>π<sub>k</sub></sub>, bounded above by v*, marches to v* by the monotone convergence theorem. <strong>Policy iteration converges faster precisely because it evaluates more thoroughly.</strong>' },
      { t: 'widget', component: 'l4-pi-vs-vi' },
      { t: 'p', zh: '书上还观察到一个悦目的现象（Figure 4.4，5×5、r<sub>forbidden</sub> = −10、随机初始策略）：离目标近的格子<strong>先</strong>找到最优动作，远处格子随后"沾光"——价值从目标向外涟漪式扩散。直觉：近处的格子先找到通往目标的轨迹，远处格子才能借道。这正是价值图是"等高线地图"的动态版本。', en: 'The book also notes a pleasing phenomenon (Figure 4.4: 5×5, r<sub>forbidden</sub> = −10, random initial policy): cells <strong>near</strong> the target settle on optimal actions first, and distant cells catch the wave later — values ripple outward from the target. Intuition: nearby cells must find their tracks to the target first before distant cells can ride through them. It is the dynamic version of "values are a contour map".' },
    ],
  };

  /* ---- §4.3 截断策略迭代 ---- */
  S['l4-truncated'] = {
    kicker: 'L4 · §4.3',
    title: { zh: '截断策略迭代：两个极端之间的连续谱', en: 'Truncated Policy Iteration: A Spectrum Between Two Extremes' },
    blocks: [
      { t: 'p', zh: '把两个算法的步骤并排写出来，它们突然变得像一对孪生兄弟：策略迭代是 <strong>PE → PI → PE → PI → …</strong>，值迭代是 <strong>PU → VU → PU → VU → …</strong>。差别只在"价值步做多满"：策略迭代的 PE 把 Bellman 方程<strong>解到底</strong>（无穷多内层迭代）；值迭代的 VU <strong>只走一步</strong>。表 4.6 逐行对照证明：若从同一起点出发，前几步两者完全一致，第四步开始分道——值迭代少走了内层路，所以单轮便宜但轮数多。', en: 'Write both algorithms side by side and they suddenly look like twins: policy iteration is <strong>PE → PI → PE → PI → …</strong>, value iteration is <strong>PU → VU → PU → VU → …</strong>. The only difference is how thoroughly the value step is done: policy iteration\'s PE <strong>solves to the end</strong> (infinitely many inner iterations), while value iteration\'s VU <strong>takes one step</strong>. The book\'s Table 4.6 verifies row by row: from the same start the first few steps coincide; they part at step four — value iteration skips the inner road, cheaper per round but more rounds.' },
      { t: 'formula', lbl: '统一视角 · The unified view',
        html: '截断策略迭代：<span class="mt">PE 只跑 j 步</span> &nbsp;⟹&nbsp; j = 1 退化为值迭代，j = ∞ 即策略迭代' },
      { t: 'p', zh: '<strong>截断策略迭代（truncated policy iteration）</strong>把两个极端接成连续谱：评估步只跑 j 步就停下来做改进。j 小，单轮便宜、轮数多；j 大，单轮贵、轮数少。总账怎么算？下面的实验台在同一世界上扫一遍不同的 j，比一比到达最优策略各自花掉的<strong>内层扫描总数</strong>。', en: '<strong>Truncated policy iteration</strong> joins the extremes into a spectrum: run the evaluation step for only j steps before improving. Small j: cheap rounds, more of them; large j: pricey rounds, fewer. How does the bill add up? The lab below sweeps several j values on the same world and compares the <strong>total inner sweeps</strong> each needs to reach the optimal policy.' },
      { t: 'widget', component: 'l4-truncated' },
    ],
  };

  /* ---- §4.4 总结 ---- */
  S['l4-summary'] = {
    kicker: 'L4 · §4.4',
    title: { zh: '本章总结：一个框架，三种算法', en: 'Chapter Summary: One Framework, Three Algorithms' },
    blocks: [
      { t: 'p', zh: '值迭代、策略迭代、截断策略迭代——三种算法共享同一个心跳：<strong>每轮两步，一步更新价值、一步更新策略</strong>。这个"价值与政策交替更新"的思想叫<strong>广义策略迭代（generalized policy iteration）</strong>，它是整本强化学习的骨架：第 5 章的蒙特卡洛、第 7 章的 TD，本质上都是"评估步换成不依赖模型的无偏估计"后的策略迭代变体。', en: 'Value iteration, policy iteration, truncated policy iteration — three algorithms sharing one heartbeat: <strong>each round has two steps, one updating the value, one updating the policy</strong>. This alternation is called <strong>generalised policy iteration</strong>, the skeleton of all reinforcement learning: Monte Carlo in Chapter 5 and TD in Chapter 7 are essentially policy iteration with the evaluation step replaced by model-free unbiased estimates.' },
      { t: 'callout', variant: 'idea', zh: '<strong>有模型时代的谢幕</strong>：本章三种算法都要求手里有 p(s′|s,a) 和 p(r|s,a)。第 5 章起进入<strong>无模型（model-free）</strong>时代——模型没有，就用采样凑。你会看到：把策略迭代的"评估步"换成"用经验平均回报估计价值"，就得到了蒙特卡洛学习。', en: '<strong>Farewell to the model-based era</strong>: all three algorithms require p(s′|s,a) and p(r|s,a) in hand. From Chapter 5 we enter the <strong>model-free</strong> era — no model, so sample instead. You will see that replacing policy iteration\'s evaluation step with "estimate values by averaging experienced returns" yields Monte Carlo learning.' },
    ],
  };

  /* ---- L4 长推理 ---- */
  S['l4-reasoning'] = {
    kicker: 'L4 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：两步一循环，走遍最优路', en: 'The Long Coherent Reasoning: Two Steps per Loop, One Road to Optimality' },
    blocks: [
      { t: 'p', zh: '本章推理链：BOE 的迭代式需要实现 → 拆成策略更新+价值更新（= 值迭代）→ 反过来先评估再改进（= 策略迭代）→ 引理保证越改越好 → 与值迭代赛跑证明收敛到 v* → 截断评估步得到统一谱系 → 广义策略迭代俯瞰全书。', en: 'This chapter\'s spine: implement the BOE iteration → split into policy update + value update (value iteration) → alternatively evaluate first, then improve (policy iteration) → a lemma guarantees monotone improvement → race against value iteration to prove convergence to v* → truncate the evaluation step to get one unified spectrum → generalised policy iteration overlooks the whole book.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l4' } },
    ],
  };

  /* ---- L4 代码 ---- */
  S['l4-code'] = {
    kicker: 'L4 · 动手 · Hands-on',
    title: { zh: '代码精讲：值迭代与策略迭代并排实现', en: 'Code Walkthrough: Value and Policy Iteration Side by Side' },
    blocks: [
      { t: 'p', zh: '把两个算法写并排，相似处和差异处一目了然。策略迭代里内嵌的评估循环直接复用 L2 的 <code class="inline">policy_evaluation</code>——好的函数设计会让你在第 5、7 章继续白嫖这个结构。', en: 'Write both algorithms side by side and the similarities and the one difference pop out. The evaluation loop inside policy iteration reuses L2\'s <code class="inline">policy_evaluation</code> as-is — good function design lets you keep freeriding on this structure in Chapters 5 and 7.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l4' } },
    ],
  };

  /* ---- L4 Q&A ---- */
  S['l4-qa'] = {
    kicker: 'L4 · §4.5',
    title: { zh: '问答：动态编程六连问', en: 'Q&A: Six Questions on Dynamic Programming' },
    blocks: [
      { t: 'p', zh: '本章问答的核心全是"中间值算不算状态值"这个细思恐极的问题，以及收敛保证。', en: 'This chapter\'s Q&As circle the spine-chilling question "are intermediate values state values?", plus convergence guarantees.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l4' } },
    ],
  };

  /* ═══ L4 长推理链 ═══ */
  D.reasoningSets['l4'] = [
    { link: '起点 · Start',
      title: { zh: '把定理 3.3 变成代码', en: 'Turn Theorem 3.3 into code' },
      zh: '值迭代 v_{k+1} = max_π(r_π + γP_π v_k) 每轮拆成两步：策略更新（贪心挑 π_{k+1}）+ 价值更新（沿 π_{k+1} 走一步）。逐元素合并后就是"q 表 → 取 max"。一个警告必须记住：中间的 v_k 不是任何策略的状态值。',
      en: 'Value iteration v_{k+1} = max_π(r_π + γP_π v_k) splits each round into a policy update (greedy pick of π_{k+1}) plus a value update (one step along it). Elementwise it is "q-table → take max". One warning to remember: the intermediate v_k is NOT the state value of any policy.',
      question: '能不能换一种组织方式，让中间量都"名正言顺"？' },
    { link: '重组 · Reorganise',
      title: { zh: '策略迭代：先把分算清楚，再改进', en: 'Policy iteration: finish the grading, then improve' },
      zh: '每轮先 PE（把当前策略的 Bellman 方程解到底，得到名正言顺的状态值 v_{π_k}），再 PI（贪心改进）。PE 里内嵌着 L2 的迭代解——迭代里套迭代。',
      en: 'Each round first PE (solve the current policy’s Bellman equation fully, yielding a bona fide state value v_{π_k}), then PI (greedy improvement). PE nests L2\'s iterative solution — an iteration inside an iteration.',
      question: '凭什么说改进后"更好"？' },
    { link: '引理 · Lemma',
      title: { zh: '引理 4.1：v_{π_{k+1}} ≥ v_{π_k} 逐格成立', en: 'Lemma 4.1: v_{π_{k+1}} ≥ v_{π_k} elementwise' },
      zh: '贪心改进把每个动作换成 q 更大的，因此即时与未来都不会变差。价值序列单调不减，且上界是 v*——单调有界必收敛（单调收敛定理）。但收敛到哪儿？可能是某个"局部最优"吗？',
      en: 'Greedy improvement swaps every action for a larger-q one, so neither the immediate nor the future part can worsen. The value sequence is monotone nondecreasing with upper bound v* — monotone and bounded, hence convergent (monotone convergence theorem). But converging to WHERE? Could it be a local optimum?',
      question: '如何证明收敛点恰是全局最优 v*？' },
    { link: '赛跑 · The race',
      title: { zh: '和值迭代赛跑：v_k ≤ v_{π_k} ≤ v*', en: 'Race value iteration: v_k ≤ v_{π_k} ≤ v*' },
      zh: '定理 4.1 的证明是归纳法 + 一次"交换"：策略迭代每步的贪心对着更好的 v_{π_k}，所以它的结果处处压着值迭代的 v_k；而值迭代已知收敛到 v*。夹住之后 v_{π_k} 只能收敛到 v*。策略迭代更快的原因也暴露了：每轮评估得更彻底。',
      en: 'Theorem 4.1\'s proof is induction plus one swap: policy iteration\'s greedy step looks at the better v_{π_k}, so its result dominates value iteration\'s v_k everywhere; and value iteration already converges to v*. Sandwiched, v_{π_k} can only converge to v*. The speed edge is also exposed: each round evaluates more thoroughly.',
      question: '评估到"多彻底"才是最优权衡？' },
    { link: '截断 · Truncate',
      title: { zh: '截断评估步：j 是连续谱的旋钮', en: 'Truncate the evaluation: j is the spectrum dial' },
      zh: 'PE 跑 ∞ 步 = 策略迭代；跑 1 步 = 值迭代。中间的 j 步版本常常总计算量最小——"评估得足够好但不完美"在工程上反而最划算。三种算法共享"价值步+策略步"的心跳：广义策略迭代。',
      en: 'PE for ∞ steps = policy iteration; for 1 step = value iteration. An intermediate j often minimises total compute — "evaluate well but not perfectly" is the engineering sweet spot. All three share the value-step/policy-step heartbeat: generalised policy iteration.',
      question: null },
  ];

  /* ═══ L4 代码块 ═══ */
  const srcVI4 = `def value_iteration(env, gamma=0.9, theta=1e-6, max_sweeps=10_000):
    """Algorithm 4.1 (identical to L3 -- kept for the side-by-side view)."""
    model = build_model(env)
    n, n_a = env.num_states, len(env.action_space)
    v = np.zeros(n)
    for k in range(max_sweeps):
        q_all = np.zeros((n, n_a))
        for s in range(n):
            for a in range(n_a):
                (x, y), r = model[(s, a)]
                s_next = y * env.env_size[0] + x
                q_all[s, a] = r + gamma * v[s_next]
        v_new = q_all.max(axis=1)          # value update = max over actions
        if np.max(np.abs(v_new - v)) < theta:
            break
        v = v_new
    return v, q_all.argmax(axis=1), k + 1

def policy_iteration(env, gamma=0.9, theta=1e-6, max_outer=1_000):
    """Algorithm 4.2: policy evaluation (to the end) + policy improvement."""
    model = build_model(env)
    n, n_a = env.num_states, len(env.action_space)
    pi = np.full((n, n_a), 1.0 / n_a)      # pi_0: uniform random policy
    for k in range(max_outer):
        # ── Step 1: policy evaluation -- solve v_{pi_k} (L2's iterative solver)
        v = np.zeros(n)
        while True:
            v_new = np.zeros(n)
            for s in range(n):
                for a in range(n_a):
                    if pi[s, a] == 0.0:
                        continue
                    (x, y), r = model[(s, a)]
                    s_next = y * env.env_size[0] + x
                    v_new[s] += pi[s, a] * (r + gamma * v[s_next])
            if np.max(np.abs(v_new - v)) < theta:
                break
            v = v_new
        # ── Step 2: policy improvement -- greedy over q_{pi_k}
        q = np.zeros((n, n_a))
        for s in range(n):
            for a in range(n_a):
                (x, y), r = model[(s, a)]
                s_next = y * env.env_size[0] + x
                q[s, a] = r + gamma * v[s_next]
        pi_new = np.zeros_like(pi)
        pi_new[np.arange(n), q.argmax(axis=1)] = 1.0
        if np.array_equal(pi_new, pi):     # policy stable -> optimal
            return v, pi, k + 1
        pi = pi_new
    return v, pi, max_outer`;

  D.codeFileSets['l4'] = [
    {
      id: 'l4-algos', file: 'dp_algorithms.py — 值迭代与策略迭代', tab: '① 两大算法',
      intro: { zh: '两个算法并排放着看：值迭代的循环体是"算 q → 取 max"；策略迭代的循环体是"评估到底 → 贪心改进 → 检查策略是否稳定"。<strong>唯一的输出差异</strong>是策略迭代的停止条件是"策略不再变化"而不是"价值变化很小"。', en: 'The two algorithms laid side by side: value iteration\'s loop body is "compute q → take max"; policy iteration\'s is "evaluate to the end → greedy improvement → check policy stability". <strong>The only output-side difference</strong> is the stopping condition: policy stability rather than a small value change.' },
      code: srcVI4,
      notes: [
        { lines: [16, 16], tag: 'stable ★', zh: '<code class="inline">np.array_equal(pi_new, pi)</code>：策略迭代用"策略不再变化"作为终止信号——这比价值阈值更强：策略不变意味着已经是最优（定理 4.1），再迭代也不会变。', en: '<code class="inline">np.array_equal(pi_new, pi)</code>: policy iteration terminates on "the policy stopped changing" — a stronger signal than a value threshold: a stable policy is already optimal (Theorem 4.1); iterating further changes nothing.' },
        { lines: [19, 30], tag: 'PE inner', zh: '内层评估循环就是 L2 的 <code class="inline">policy_evaluation</code> 原地内联了一遍——工程上应该直接调用函数。"迭代里套迭代"是策略迭代的真实结构，书上也明确点出。', en: 'The inner evaluation loop is L2\'s <code class="inline">policy_evaluation</code> inlined — in production you would simply call the function. "An iteration inside an iteration" is policy iteration\'s true structure, explicitly noted in the book.' },
        { lines: [37, 39], tag: 'greedy', zh: '改进步的两行：argmax 挑动作 + one-hot 展开。与 L3 的 <code class="inline">greedy_policy</code> 一模一样——区别只在喂进去的 v：那里是收敛后的 v*，这里是每轮评估出的 v_{π_k}。', en: 'Two lines of improvement: argmax over actions + one-hot expansion. Identical to L3\'s <code class="inline">greedy_policy</code> — the only difference is the v fed in: the converged v* there, the per-round v_{π_k} here.' },
        { lines: [7, 12], tag: 'vi body', zh: '值迭代循环体只有 6 行有效代码。对比策略迭代的 25 行：值迭代省掉的是"评估到底"的内层循环，代价是外层轮数变多。总账谁划算，取决于 θ 和世界大小——这正是截断策略迭代的用武之地。', en: 'Value iteration\'s loop body is ~6 effective lines vs. 25 for policy iteration: it skips the evaluate-to-the-end inner loop at the price of more outer rounds. Which bill is cheaper depends on θ and the world size — exactly where truncated policy iteration earns its keep.' },
      ],
    },
  ];

  /* ═══ L4 Q&A ═══ */
  D.qaSets['l4'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '值迭代一定能找到最优策略吗？', en: 'Is value iteration guaranteed to find optimal policies?' },
      a: { zh: '能。它正是定理 3.3 为解 BOE 给出的迭代算法，收敛性由压缩映射定理背书——γ < 1 时从任何初值出发都指数收敛到 v*。', en: 'Yes. It is exactly the iteration Theorem 3.3 suggested for the BOE, with convergence vouched by the contraction mapping theorem — for γ < 1 it converges exponentially to v* from any initial value.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '值迭代的中间值 v_k 是状态值吗？', en: 'Are value iteration\'s intermediate values v_k state values?' },
      a: { zh: '<strong>不是</strong>。v_k 一般不满足任何策略的 Bellman 方程，只是算法的中间量（q_k 同理不是动作价值）。它们只是恰好收敛到最优值。对比：策略迭代的中间值<strong>是</strong>状态值（v_{π_k}）。', en: '<strong>No</strong>. v_k generally satisfies no policy’s Bellman equation; it is an intermediate quantity (likewise q_k is not an action value). It merely converges to the optimum. Contrast: policy iteration\'s intermediates <strong>are</strong> state values (v_{π_k}).' } },
    { tag: 'Q3 · 书上原问', q: { zh: '策略迭代的每轮包含哪些步骤？', en: 'What steps does one round of policy iteration contain?' },
      a: { zh: '两步：<strong>策略评估</strong>——解当前策略的 Bellman 方程得到 v<sub>π<sub>k</sub></sub>（给策略打分）；<strong>策略改进</strong>——贪心更新策略使状态值增大（换上更好的动作）。', en: 'Two steps: <strong>policy evaluation</strong> — solve the current policy’s Bellman equation for v<sub>π<sub>k</sub></sub> (grade the policy); <strong>policy improvement</strong> — update the policy greedily so state values grow (swap in better actions).' } },
    { tag: 'Q4 · 书上原问', q: { zh: '策略迭代里是不是又嵌了一个迭代算法？', en: 'Is another iterative algorithm nested inside policy iteration?' },
      a: { zh: '是。评估步解 Bellman 方程用的就是 L2 的迭代解 v^{(j+1)} = r_π + γP_π v^{(j)}——理论上要跑到无穷步，实践中用阈值或步数上限截断。这个"嵌套"正是截断策略迭代的切入点。', en: 'Yes. The evaluation step solves the Bellman equation with L2\'s iteration v^{(j+1)} = r_π + γP_π v^{(j)} — infinitely many steps in theory, truncated by a threshold or an iteration cap in practice. This nesting is exactly where truncated policy iteration cuts in.' } },
    { tag: 'Q5 · 书上原问', q: { zh: '策略迭代的中间值是状态值吗？收敛有保证吗？', en: 'Are policy iteration\'s intermediate values state values, and is convergence guaranteed?' },
      a: { zh: '是状态值——它们是当前策略 Bellman 方程的解，名正言顺。收敛也有保证（定理 4.1）：价值序列单调不减、上界 v*，且与值迭代赛跑可证收敛点恰是 v*，对应策略即最优策略。', en: 'Yes — they solve the current policy’s Bellman equation, fully legitimate. Convergence is guaranteed too (Theorem 4.1): the value sequence is monotone nondecreasing with bound v*, and racing value iteration proves the limit is exactly v*, whose policy is optimal.' } },
    { tag: 'Q6 · 补充', q: { zh: '三种 DP 算法（VI/截断 PI/PI）工程上怎么选？', en: 'How to choose among VI / truncated PI / PI in practice?' },
      a: { zh: '看"每轮评估精度 vs 轮数"的总账：世界小、θ 松 → 策略迭代几轮就完；世界大、单轮要省 → 值迭代或小 j 的截断版。经验法则：j 取 3~10 常常总扫描数最少。广义策略迭代告诉你：只要"评估↔改进"在交替，就是同一家族。', en: 'Balance per-round evaluation cost against number of rounds: small worlds with loose θ finish in a few policy-iteration rounds; large worlds favour value iteration or truncated with small j. Rule of thumb: j around 3–10 often minimises total sweeps. Generalised policy iteration says: as long as evaluation and improvement alternate, it is one family.' } },
  ];

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 4,
    label: 'L4 · 值迭代与策略迭代',
    items: [
      { id: 'l4-vi', zh: '值迭代', en: '§4.1 Value iteration' },
      { id: 'l4-pi', zh: '策略迭代', en: '§4.2 Policy iteration' },
      { id: 'l4-truncated', zh: '截断策略迭代', en: '§4.3 Truncated PI' },
      { id: 'l4-summary', zh: '本章总结', en: '§4.4 Summary' },
      { id: 'l4-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l4-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l4-qa', zh: '问答', en: 'Q&A · §4.5' },
    ],
  });
  const l4 = D.otherLectures.find(l => l.no === 4);
  if (l4) l4.done = true;
})();
