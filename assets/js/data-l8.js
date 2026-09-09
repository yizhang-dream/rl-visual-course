/* ═══════════════════════════════════════════════════════════
   L8 · 值函数近似（书 Ch.8）：从表格到函数，再到 DQN
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §8.1 表示 ---- */
  S['l8-representation'] = {
    kicker: 'L8 · §8.1',
    title: { zh: '从表格到函数：为什么必须换表示？', en: 'From Table to Function: Why the Representation Must Change' },
    blocks: [
      { t: 'p', zh: '表格法的死穴是<strong>泛化</strong>：更新 s₁ 的价值，s₂、s₃ 的价值纹丝不动——格子之间互相不认识。状态空间一大（围棋 ~10<sup>170</sup>、连续控制任务无穷多），表既存不下也学不快。<strong>函数近似</strong>的解法：用参数化函数 v̂(s, w) ≈ v<sub>π</sub>(s) 代替查表——最简单的线性形式 v̂(s,w) = φ<sup>T</sup>(s)w，其中 φ(s) 是特征向量（把状态编码成几个数），w 是待学参数。', en: 'The table method\'s fatal flaw is <strong>generalisation</strong>: updating s₁\'s value leaves s₂ and s₃ untouched — cells do not know each other. With huge state spaces (Go ~10<sup>170</sup>, continuous control infinitely many), tables can neither be stored nor learned quickly. <strong>Function approximation</strong> answers: a parameterised function v̂(s, w) ≈ v<sub>π</sub>(s) replaces the lookup — the simplest linear form v̂(s,w) = φ<sup>T</sup>(s)w, where φ(s) is a feature vector (encoding the state into a few numbers) and w is the parameter to learn.' },
      { t: 'steps', items: [
        { zh: '<strong>检索方式变了</strong>：表格查一次 O(1)；函数要输入 s 算前向（神经网络的 forward）。', en: '<strong>Retrieval changes</strong>: a table is O(1); a function computes a forward pass on s.' },
        { zh: '<strong>更新方式变了</strong>：表格改一个格子；函数更新参数 w——<strong>间接地</strong>改变许多状态的价值。这既是泛化的来源，也是不稳定性的来源。', en: '<strong>Updating changes</strong>: a table rewrites one cell; a function updates w — <strong>indirectly</strong> changing many states\' values at once. This is both the source of generalisation and of instability.' },
        { zh: '<strong>拟合问题</strong>：给定各状态真值 {(sᵢ, v<sub>π</sub>(sᵢ))}，最小化 Σ(v̂(sᵢ,w) − v<sub>π</sub>(sᵢ))² 就是标准最小二乘，线性情形闭式解 w* = (Φ<sup>T</sup>Φ)⁻¹Φv<sub>π</sub>。', en: '<strong>The fitting problem</strong>: given true pairs {(sᵢ, v<sub>π</sub>(sᵢ))}, minimising Σ(v̂(sᵢ,w) − v<sub>π</sub>(sᵢ))² is plain least squares; the linear case has the closed form w* = (Φ<sup>T</sup>Φ)⁻¹Φv<sub>π</sub>.' },
      ]},
      { t: 'callout', variant: 'key', zh: '<strong>泛化是函数近似的超能力</strong>（书 Figure 8.4）：s₃ 的经验样本不仅能更新 s₃ 自己，还会通过共享参数 w 顺带修正相邻状态的价值——因为它们共享特征。这正是神经网络能玩游戏的根本原因：没见过的局面，靠相似特征举一反三。', en: '<strong>Generalisation is the superpower</strong> (book Figure 8.4): an experience sample at s₃ updates not only s₃ but, through the shared parameters w, also the values of neighbouring states — they share features. This is exactly why neural networks can play games: unseen situations generalise from similar features.' },
    ],
  };

  /* ---- §8.2 TD + FA ---- */
  S['l8-td-fa'] = {
    kicker: 'L8 · §8.2',
    title: { zh: 'TD + 函数近似 = 一个优化问题', en: 'TD + Function Approximation = An Optimisation Problem' },
    blocks: [
      { t: 'p', zh: '把近似写成优化问题：目标函数 J(w) = E[(v<sub>π</sub>(S) − v̂(S,w))²]——让估计值和真值的平方误差期望最小（S 的分布决定"更在乎哪些状态"，平稳分布是最常用的选择）。对 J 做梯度下降，再按 SGD 精神把期望换成单样本：', en: 'Pose approximation as optimisation: J(w) = E[(v<sub>π</sub>(S) − v̂(S,w))²] — minimise the expected squared error (the distribution of S decides "which states matter"; the stationary distribution is the usual choice). Gradient descent on J, then swap the expectation for a single sample in SGD spirit:' },
      { t: 'formula', lbl: 'TD + 函数近似的骨架 · The skeleton — Eq. (8.12)',
        html: 'w<sub>t+1</sub> = w<sub>t</sub> + α<sub>t</sub> [v<sub>π</sub>(s<sub>t</sub>) − v̂(s<sub>t</sub>, w<sub>t</sub>)] ∇<sub>w</sub>v̂(s<sub>t</sub>, w<sub>t</sub>)' },
      { t: 'p', zh: '麻烦来了：真值 v<sub>π</sub>(s<sub>t</sub>) 未知（不然还学什么）。两种替换：<strong>MC 替换</strong>——用轨迹回报 g<sub>t</sub>；<strong>TD 替换</strong>——用自举目标 r + γv̂(s′,w)。后者代入得到 <strong>TD-Linear</strong>：', en: 'The catch: the true v<sub>π</sub>(s<sub>t</sub>) is unknown (or there would be nothing to learn). Two substitutions: <strong>MC</strong> — use the episode return g<sub>t</sub>; <strong>TD</strong> — use the bootstrap target r + γv̂(s′,w). The latter gives <strong>TD-Linear</strong>:' },
      { t: 'formula', lbl: 'TD-Linear — Eq. (8.13)',
        html: 'w<sub>t+1</sub> = w<sub>t</sub> + α<sub>t</sub> [r + γv̂(s′,w<sub>t</sub>) − v̂(s,w<sub>t</sub>)] ∇<sub>w</sub>v̂(s,w<sub>t</sub>) &nbsp;&nbsp;<span style="color:var(--ink-3)">线性时 ∇<sub>w</sub>v̂ = φ(s)</span>' },
      { t: 'widget', component: 'l8-fit-lab' },
      { t: 'steps', items: [
        { zh: '<strong>特征选择</strong>决定能学成什么样：多项式特征（阶数越高越弯）、Fourier 特征（正交性好、书上的例子用它）、Tile Coding（把状态空间铺瓷砖，激活少数几块）。特征太少欠拟合，太多过拟合。', en: '<strong>Feature choice</strong> decides what can be learned: polynomial features (higher order, curvier), Fourier features (nice orthogonality — the book\'s example), tile coding (tile the state space, activate a few tiles). Too few features underfit; too many overfit.' },
        { zh: '<strong>理论身份</strong>：TD-Linear 收敛到的不是真值 v<sub>π</sub> 本身，而是它在特征空间上的<strong>投影</strong>——最小化投影 Bellman 误差（PBE）。表格特征（one-hot）时特征完备，投影退化为真值——表格法是函数近似的特例。', en: '<strong>Theoretical identity</strong>: TD-Linear converges not to the true v<sub>π</sub> but to its <strong>projection</strong> onto the feature space — minimising the projected Bellman error (PBE). With table-lookup (one-hot) features the projection degenerates to the truth — tabular methods are a special case of function approximation.' },
      ]},
    ],
  };

  /* ---- §8.3 q 近似 ---- */
  S['l8-q-fa'] = {
    kicker: 'L8 · §8.3',
    title: { zh: 'Sarsa/Q-learning 换上函数引擎', en: 'Sarsa and Q-learning with a Function Engine' },
    blocks: [
      { t: 'p', zh: '把 7 章的表格换近似函数，机械得不能再机械：<strong>Sarsa 版</strong>把 v̂ 换成 q̂(s,a,w)：w<sub>t+1</sub> = w<sub>t</sub> + α[r + γq̂(s′,a′,w) − q̂(s,a,w)]∇q̂；<strong>Q-learning 版</strong>把目标再换成 r + γ·max<sub>a</sub>q̂(s′,a,w)（Algorithm 8.3）。配上 ε-greedy 改进步，就能学出通往目标的策略——书上用 Fourier 特征（阶数 5）在 5×5 世界跑通，总奖励和回合长度逐步收敛。', en: 'Swapping the tabular values of Chapter 7 for approximations is mechanical: the <strong>Sarsa version</strong> replaces v̂ with q̂(s,a,w): w<sub>t+1</sub> = w<sub>t</sub> + α[r + γq̂(s′,a′,w) − q̂(s,a,w)]∇q̂; the <strong>Q-learning version</strong> further swaps the target for r + γ·max<sub>a</sub>q̂(s′,a,w) (Algorithm 8.3). With an ε-greedy improvement step this learns a policy to the target — the book runs it on a 5×5 world with order-5 Fourier features, total reward and episode length converging step by step.' },
      { t: 'callout', variant: 'warn', zh: '<strong>致命三角（deadly triad）预告</strong>：自举（bootstrapping）+ 函数近似（近似目标）+ 离线训练（off-policy）三者同用，收敛性不再有保证——值可能震荡甚至爆炸。表格时代三者共处无恙；函数时代要靠技巧驯服。DQN 的两大技术就是为此而生。', en: '<strong>Preview of the deadly triad</strong>: bootstrapping + function approximation + off-policy training together void the convergence guarantees — values may oscillate or explode. In the tabular era the three coexisted peacefully; the function era needs tricks to tame them. DQN’s two techniques were born exactly for this.' },
    ],
  };

  /* ---- §8.4 DQN ---- */
  S['l8-dqn'] = {
    kicker: 'L8 · §8.4',
    title: { zh: 'Deep Q-Learning：深度学习与 RL 会师', en: 'Deep Q-Learning: Where Deep Learning Meets RL' },
    blocks: [
      { t: 'p', zh: '把 Q-learning 的 q 表换成深度神经网络 q̂(s,a,w)，目标函数 J = E[(R + γmax<sub>a</sub>q̂(S′,a,w) − q̂(S,A,w))²]——可以看作"平方 Bellman 最优误差"。麻烦：梯度里 w 同时出现在目标和目标网络两侧——自己追自己，必抖。DQN 的<strong>两大稳定化技术</strong>：', en: 'Replace Q-learning’s q-table with a deep network q̂(s,a,w) and the objective becomes J = E[(R + γmax<sub>a</sub>q̂(S′,a,w) − q̂(S,A,w))²] — readable as the “squared Bellman optimality error”. The trouble: w appears on BOTH sides of the target — chasing oneself, guaranteed wobble. DQN’s <strong>two stabilising techniques</strong>:' },
      { t: 'steps', items: [
        { zh: '<strong>目标网络（target network）</strong>：复制一份参数 w<sub>T</sub> 专门算目标，冻结一段时间再同步——把"追自己"变成"追一个暂时不动的影子"。', en: '<strong>Target network</strong>: clone the parameters w<sub>T</sub> solely to compute targets, frozen for a while then synced — turning “chasing oneself” into “chasing a briefly frozen shadow”.' },
        { zh: '<strong>经验回放（experience replay）</strong>：把经验 (s,a,r,s′) 存进大池子，训练时随机抽小批量——打破样本间的时间相关性（i.i.d. 的近似），还能反复利用稀有经验。', en: '<strong>Experience replay</strong>: store transitions (s,a,r,s′) in a big pool and sample random mini-batches — breaking temporal correlation in the data (approximating i.i.d.) and reusing rare experiences.' },
        { zh: '<strong>奖励截断</strong>：DQN 原论文还把奖励夹到 [−1,1]，使单个网络能同时适配几十种 Atari 游戏——奖励尺度统一是跨任务泛化的隐形前提。', en: '<strong>Reward clipping</strong>: the original DQN paper also clamps rewards to [−1,1] so one network can play dozens of Atari games at once — a unified reward scale is the hidden prerequisite of cross-task generalisation.' },
      ]},
      { t: 'callout', variant: 'idea', zh: '<strong>历史地位</strong>：DQN 是最早、最成功的深度强化学习算法之一——2015 年 Nature 论文里它用同一套网络从像素级别打通了 49 款 Atari 游戏，多个游戏超过人类水平。它证明了"深度网络 + RL"不是凑热闹，而是通向通用学习的路。', en: '<strong>Historic standing</strong>: DQN is among the earliest and most successful deep RL algorithms — the 2015 Nature paper played 49 Atari games from raw pixels with one architecture, surpassing humans on several. It proved that “deep nets + RL” is a road to general learning, not a gimmick.' },
    ],
  };

  /* ---- §8.5 总结 ---- */
  S['l8-summary'] = {
    kicker: 'L8 · §8.5',
    title: { zh: '本章总结：近似即优化', en: 'Chapter Summary: Approximation Is Optimisation' },
    blocks: [
      { t: 'p', zh: '本章把 TD 学习从表格搬到函数，关键是换一副眼镜：<strong>价值估计不再是一组数，而是一个优化问题</strong>——目标函数（平方误差/Bellman 误差/投影 Bellman 误差）+ 优化器（SGD 家族）。特征决定上限，优化器决定下限；线性情形理解透了，非线性（神经网络）只是换更强的 v̂。值函数近似的终极意义：让神经网络得以与强化学习合体。', en: 'This chapter moved TD learning from tables to functions, and the key is a new pair of glasses: <strong>value estimation is no longer a collection of numbers but an optimisation problem</strong> — an objective (squared error / Bellman error / projected Bellman error) plus an optimiser (the SGD family). Features set the ceiling; the optimiser sets the floor; once the linear case is fully understood, the nonlinear (neural network) case is just a stronger v̂. The ultimate meaning of value function approximation: it marries neural networks to reinforcement learning.' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：一直以来我们近似的是<strong>价值</strong>，策略只是"从价值里 argmax"。第 9 章调转枪口：<strong>直接用函数近似策略本身 π(a|s,θ)</strong>，用梯度上升直接优化策略——策略梯度方法，深度 RL 的另一根支柱。', en: 'Next lecture teaser: so far we approximated <strong>values</strong> and treated the policy as an argmax over them. Chapter 9 turns the gun around: <strong>approximate the policy itself with a function π(a|s,θ)</strong> and ascend its gradient directly — policy gradient methods, the other pillar of deep RL.' },
    ],
  };

  /* ---- L8 长推理 ---- */
  S['l8-reasoning'] = {
    kicker: 'L8 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：表格的黄昏', en: 'The Long Coherent Reasoning: The Twilight of Tables' },
    blocks: [
      { t: 'p', zh: '本章推理链：表格无泛化、存不下 → 参数化函数 + 特征 → 近似即最小二乘 → 真值未知，MC/TD 目标顶替 → TD-Linear = SGD on Bellman 方程 → 收敛到投影 → Sarsa/Q-learning 换引擎 → 致命三角现形 → 目标网络 + 经验回放驯服之 → DQN 会师深度学习。', en: 'This chapter’s spine: tables neither generalise nor scale → parameterise with features → approximation as least squares → truth unknown, substitute MC/TD targets → TD-Linear = SGD on the Bellman equation → converges to a projection → Sarsa/Q-learning swap engines → the deadly triad appears → target network + experience replay tame it → DQN marries deep learning.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l8' } },
    ],
  };

  /* ---- L8 代码 ---- */
  S['l8-code'] = {
    kicker: 'L8 · 动手 · Hands-on',
    title: { zh: '代码精讲：TD-Linear 与 DQN 骨架', en: 'Code Walkthrough: TD-Linear and the DQN Skeleton' },
    blocks: [
      { t: 'p', zh: 'TD-Linear 十行可见全貌；DQN 骨架用伪代码点出目标网络与回放池的落点——参数 w<sub>T</sub> 出现在目标里但梯度只流向 w，这就是"冻结"的代码含义。', en: 'TD-Linear shows its whole face in ten lines; the DQN skeleton uses pseudocode to mark exactly where the target network and the replay pool sit — the parameter w<sub>T</sub> appears in the target while gradients flow only into w: that is what “freezing” means in code.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l8' } },
    ],
  };

  /* ---- L8 Q&A ---- */
  S['l8-qa'] = {
    kicker: 'L8 · §8.6',
    title: { zh: '问答：表格 vs 函数', en: 'Q&A: Tables vs Functions' },
    blocks: [
      { t: 'p', zh: '检索方式、更新方式、泛化能力、平稳分布的角色——本章问答聚焦"两种表示的本质差异"。', en: 'Retrieval, update, generalisation, and the role of the stationary distribution — the Q&As focus on the essential differences between the two representations.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l8' } },
    ],
  };

  /* ═══ L8 长推理链 ═══ */
  D.reasoningSets['l8'] = [
    { link: '起点 · Start',
      title: { zh: '表格的天花板', en: 'The ceiling of tables' },
      zh: '表格法里每个 (s,a) 一格：格子互相不认识（无泛化）、状态一多就存不下（围棋 10^170）、学不到没见过的局面。第一条铁律：表示决定学习能力的上限。',
      en: 'In tabular methods each (s,a) is one cell: cells are strangers (no generalisation), huge spaces cannot be stored (Go 10^170), unseen situations are never learned. Iron law #1: representation caps learning.',
      question: '什么东西既能压缩状态又能互相举一反三？' },
    { link: '参数化 · Parameterise',
      title: { zh: 'v̂(s,w) = φᵀ(s)w：把价值变成函数', en: 'v̂(s,w) = φᵀ(s)w: values become a function' },
      zh: '特征 φ(s) 把状态编码成向量，w 是参数。更新 w 会同时影响所有状态的价值——s₃ 的经验顺带修正 s₂（泛化来了）。拟合问题就是最小二乘：J = ‖Φw − v_π‖²。',
      en: 'Features φ(s) encode states as vectors; w is the parameter. Updating w shifts the values of ALL states at once — s₃’s experience corrects s₂ too (generalisation). Fitting becomes least squares: J = ‖Φw − v_π‖².',
      question: '真值 v_π 从哪来？' },
    { link: '换目标 · Substitute',
      title: { zh: '真值未知：MC 或 TD 目标顶替', en: 'Truth unknown: substitute MC or TD targets' },
      zh: 'SGD 式 w ← w + α(v_π(s) − v̂)∇v̂ 里的真值换成 MC 回报 g_t（无偏高方差）或 TD 目标 r + γv̂(s′,w)（自举、低方差）——后者就是 TD-Linear。L6 的 SGD 引擎与 L7 的自举目标在此会师。',
      en: 'In the SGD step w ← w + α(v_π(s) − v̂)∇v̂, substitute the truth with the MC return g_t (unbiased, high variance) or the TD target r + γv̂(s′,w) (bootstrapped, low variance) — the latter is TD-Linear. L6’s SGD engine and L7’s bootstrap target meet here.',
      question: '它收敛到真值吗？' },
    { link: '投影 · Projection',
      title: { zh: '收敛到投影：特征决定上限', en: 'It converges to a projection: features set the ceiling' },
      zh: 'TD-Linear 最小化投影 Bellman 误差（PBE）——解是 v_π 在特征空间上的正交投影。特征空间表达不了的部分，永远学不到。one-hot 特征恢复表格情形：表格法是函数近似的特例。',
      en: 'TD-Linear minimises the projected Bellman error (PBE) — the solution is the orthogonal projection of v_π onto the feature space. What the features cannot express can never be learned. One-hot features recover the tabular case: tables are a special case of function approximation.',
      question: '把 q 表也换掉，最优性还能保证吗？' },
    { link: '危险区 · The triad',
      title: { zh: '致命三角：自举 + 近似 + off-policy', en: 'The deadly triad: bootstrap + approximation + off-policy' },
      zh: 'Q-learning 的函数版三样全占——目标追着正在变的函数跑，值可能震荡爆炸。DQN 的两剂药：目标网络（冻结影子让梯度有处可依）+ 经验回放（打散时序相关性逼近 i.i.d.）。深度 RL 从此起步。',
      en: 'The functional Q-learning takes all three at once — the target chases a moving function, and values may oscillate or explode. DQN’s two remedies: a target network (a frozen shadow for the gradient to lean on) + experience replay (shuffling away temporal correlation toward i.i.d.). Deep RL starts here.',
      question: null },
  ];

  /* ═══ L8 代码块 ═══ */
  const srcTDLinear = `import numpy as np

def fourier_features(s, n_states, order=3):
    """Fourier feature vector phi(s) (the book's Eq. 8.18 family).
    s in [0,1] after normalising state indices."""
    s_norm = s / (n_states - 1)
    return np.cos(np.pi * np.arange(order + 1) * s_norm)

def td_linear(env, policy, episodes=500, gamma=0.9, alpha=0.01, order=3):
    """TD(0) with linear function approximation (Eq. 8.13):
       w <- w + alpha * [r + gamma*v_hat(s') - v_hat(s)] * phi(s)
    v_hat(s,w) = phi(s)^T w   =>   grad v_hat = phi(s)."""
    n, dim = env.num_states, order + 1
    w = np.zeros(dim)
    for ep in range(episodes):
        s = env.reset()
        phi_s = fourier_features(s, n, order)
        done = False
        while not done:
            a = np.random.choice(len(policy[s]), p=policy[s])
            s2, r, done, _ = env.step(a)
            phi_s2 = fourier_features(s2, n, order)
            target = r + gamma * phi_s2 @ w * (not done)
            delta = target - phi_s @ w              # TD error (same as tabular!)
            w += alpha * delta * phi_s              # gradient = phi(s) when linear
            s, phi_s = s2, phi_s2
    return w

def v_hat_all(env, w, order=3):
    return np.array([fourier_features(s, env.num_states, order) @ w
                     for s in range(env.num_states)])`;

  const srcDQN = `# Deep Q-learning skeleton (Algorithm 8.3 + DQN tricks, pseudocode-level)
replay = ReplayBuffer(capacity=100_000)      # experience replay pool
q_main  = QNetwork(state_dim, n_actions)     # hat q(s, a, w)
q_target = QNetwork(state_dim, n_actions)    # hat q(s, a, w_T) -- frozen shadow
q_target.load_state_dict(q_main.state_dict())

for episode in range(N):
    s = env.reset()
    for t in range(max_steps):
        a = eps_greedy(q_main, s, eps)               # behavior: explore
        s2, r, done, _ = env.step(a)
        replay.store((s, a, r, s2, done))            # remember the transition
        s = s2
        if done: break

        # ---- learn from a random mini-batch (breaks temporal correlation) ----
        batch = replay.sample(m=32)
        # targets use the FROZEN network: w_T appears here, no gradient flows to it
        y = r + gamma * q_target(s2).max() * (1 - done)
        loss = (y - q_main(s, a)) ** 2               # squared Bellman optimality error
        q_main.backward_and_step(loss)               # gradient flows into w only

        # ---- periodic sync: the shadow catches up ----
        if global_step % C == 0:
            q_target.load_state_dict(q_main.state_dict())`;

  D.codeFileSets['l8'] = [
    {
      id: 'l8-tdl', file: 'td_linear.py — 线性 TD', tab: '① TD-Linear',
      intro: { zh: '把 L7 的表格 TD 换成线性函数近似后，代码只多了一步：算特征 φ(s)。<code class="inline">w += alpha * delta * phi_s</code> 这一行 = 式 (8.13)：delta 还是那个 TD 误差，"更新哪张表"变成了"更新参数向量 w"。Fourier 特征把状态编号映射成余弦波——相邻状态共享大部分波形，这就是泛化的物理来源。', en: 'Swapping L7’s tabular TD for linear approximation adds exactly one step: computing the features φ(s). The line <code class="inline">w += alpha * delta * phi_s</code> IS Eq. (8.13): delta is still the TD error, and “which cell to update” becomes “which direction to push w”. Fourier features map state indices to cosine waves — neighbouring states share most of the wave, the physical origin of generalisation.' },
      code: srcTDLinear,
      notes: [
        { lines: [11, 11], tag: 'fourier', zh: '<code class="inline">cos(π·k·s_norm)</code> 对 k = 0..order 生成一排余弦波：k=0 是常数项、k 越大频率越高。低频捕捉大势、高频捕捉细节——和信号分解一个思路。', en: '<code class="inline">cos(π·k·s_norm)</code> over k = 0..order lays out a bank of cosine waves: k=0 is the constant term, larger k oscillate faster. Low frequencies capture the trend, high ones the detail — the same idea as signal decomposition.' },
        { lines: [24, 24], tag: 'delta same', zh: 'TD 误差 <code class="inline">target − v̂(s)</code> 与表格版一模一样——变的只是"误差怎么被消化"：表格版改一格，线性版沿特征方向推参数。理解这一点，第 7 章到第 8 章就是平滑过渡。', en: 'The TD error <code class="inline">target − v̂(s)</code> is identical to the tabular version — only how the error is absorbed changes: tables edit one cell; linear functions push the parameters along the feature direction. Seen this way, Chapter 7 flows into Chapter 8 smoothly.' },
        { lines: [22, 23], tag: 'bootstrapped', zh: '<code class="inline">phi_s2 @ w</code> 是自举：下一状态的价值用当前参数现算——所以叫 semi-gradient（目标里的 w 没被求导）。这是致命三角的第一角。', en: '<code class="inline">phi_s2 @ w</code> is bootstrapping: the next state’s value is computed on the fly with current parameters — hence “semi-gradient” (no gradient through the target’s w). That is corner #1 of the deadly triad.' },
      ],
    },
    {
      id: 'l8-dqn-code', file: 'dqn_skeleton.py — DQN 骨架', tab: '② DQN 骨架',
      intro: { zh: 'DQN 骨架点出三个落点：回放池在哪里入样、目标网络在哪里出目标、梯度往哪流。伪代码里 <code class="inline">y = r + γ·q_target(s2).max()</code> 的 <code class="inline">q_target</code> 参数被冻结——梯度只流进 <code class="inline">q_main</code>，"追自己"变成"追影子"。', en: 'The DQN skeleton marks three spots: where the replay pool ingests samples, where the target network produces targets, and where gradients flow. In the pseudocode, <code class="inline">q_target</code> inside <code class="inline">y = r + γ·q_target(s2).max()</code> is frozen — gradients flow only into <code class="inline">q_main</code>: “chasing oneself” becomes “chasing a shadow”.' },
      code: srcDQN,
      notes: [
        { lines: [16, 17], tag: 'replay ★', zh: '经验回放一举两得：① 随机抽样打散相邻转移的相关性（逼近 i.i.d.，喂饱 SGD 的大数定律）；② 稀有宝贵经验（比如罕见死亡）可被反复重放学习。', en: 'Experience replay kills two birds: ① random sampling breaks correlations between adjacent transitions (approaching i.i.d., feeding SGD’s law of large numbers); ② rare precious experiences (say, an unusual death) can be replayed and learned again.' },
        { lines: [19, 20], tag: 'frozen target ★', zh: '<strong>DQN 的灵魂两行</strong>：y 用 w_T 算、loss 对 w 求导——目标暂时不动，学习才有一个稳定的靶子。每 C 步同步一次 w_T ← w：影子周期性追上本体。不冻结 = 自己追自己 = 追光 peine（追不上）。', en: '<strong>The soul of DQN in two lines</strong>: y is computed with w_T while the loss differentiates w — the target stands still for a while, giving learning a stable mark. Every C steps sync w_T ← w: the shadow periodically catches up. Without freezing, you chase yourself — and never catch up.' },
        { lines: [12, 12], tag: 'eps-greedy', zh: '行为策略仍是 ε-greedy——致命三角的 off-policy 角在这里：训练样本由探索性策略产生，学到的却是贪心最优 q。', en: 'The behavior policy is still ε-greedy — here sits the off-policy corner of the deadly triad: samples come from an exploratory policy while the learned object is the greedy optimal q.' },
      ],
    },
  ];

  /* ═══ L8 Q&A ═══ */
  D.qaSets['l8'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '表格法与函数近似法的本质区别？', en: 'Tabular vs function approximation — the essential difference?' },
      a: { zh: '两处：① <strong>检索</strong>——表格直接读格子，函数要算前向；② <strong>更新</strong>——表格改一个格子，函数更新参数间接改变许多状态的价值。前者换来简单，后者换来泛化。', en: 'Two spots: ① <strong>retrieval</strong> — a table is read directly; a function computes a forward pass. ② <strong>update</strong> — a table rewrites one cell; a function updates parameters, indirectly changing many states. The first buys simplicity; the second buys generalisation.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '函数近似比表格强在哪？', en: 'What advantages does function approximation have over tables?' },
      a: { zh: '两条：① <strong>存储</strong>——存 |S| 个数 vs 存一个低维参数向量；② <strong>泛化</strong>——表格改一处只动一处，函数改参数会顺带修正相似状态的价值。学过 s₃ 就懂 s₂——经验被复用。', en: 'Two: ① <strong>storage</strong> — |S| numbers vs a low-dimensional parameter vector; ② <strong>generalisation</strong> — tables change one cell per update, functions nudge the values of similar states together. Learning s₃ teaches you s₂ — experience is reused.' } },
    { tag: 'Q3 · 补充', q: { zh: '为什么目标函数里 S 的分布那么重要（平稳分布）？', en: 'Why does the distribution of S in the objective matter (stationary distribution)?' },
      a: { zh: '平方误差 J(w) = E[(v_π(S) − v̂(S,w))²] 是加权平均——分布决定"哪些状态的误差更在乎"。特征有限时不可能处处拟合好，平稳分布（按访问频率）给出最合理的取舍：常去的状态拟合得更准。', en: 'The squared error J(w) = E[(v_π(S) − v̂(S,w))²] is a weighted average — the distribution decides “whose errors matter more”. With limited features you cannot fit everywhere; the stationary distribution (visit frequencies) makes the most sensible trade-off: frequently visited states get fitted better.' } },
    { tag: 'Q4 · 补充', q: { zh: 'TD-Linear 学到的是真值 v_π 吗？', en: 'Does TD-Linear learn the true v_π?' },
      a: { zh: '一般不是。它收敛到特征空间上的<strong>投影</strong>——最小化投影 Bellman 误差。特征表达不了的部分被永久舍弃；只有特征完备（如 one-hot 表格特征）时投影才等于真值。这是"特征决定上限"的精确含义。', en: 'Usually not. It converges to the <strong>projection</strong> onto the feature space — minimising the projected Bellman error. Whatever the features cannot express is permanently lost; only with complete features (e.g. one-hot table features) does the projection equal the truth. That is the precise meaning of “features set the ceiling”.' } },
    { tag: 'Q5 · 补充', q: { zh: 'DQN 的两个技巧分别在治什么病？', en: 'Which illness does each DQN trick cure?' },
      a: { zh: '目标网络治"自己追自己"——目标和被优化对象共享参数会让目标不断移动，冻结副本给梯度一个稳定靶子。经验回放治"样本相关"——连续决策的样本高度相关，violates i.i.d.，随机抽批打散它。两药合用驯服致命三角。', en: 'The target network cures “chasing oneself” — target and optimised object sharing parameters makes the target move; a frozen copy gives the gradient a stable mark. Experience replay cures “correlated samples” — sequential decisions are strongly correlated, violating i.i.d.; random mini-batches shuffle it away. Together they tame the deadly triad.' } },
  ];

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 8,
    label: 'L8 · 值函数近似',
    items: [
      { id: 'l8-representation', zh: '从表格到函数', en: '§8.1 Table → function' },
      { id: 'l8-td-fa', zh: 'TD + 函数近似', en: '§8.2 TD with approximation' },
      { id: 'l8-q-fa', zh: 'Sarsa/Q-learning 换引擎', en: '§8.3 Sarsa/Q with approximation' },
      { id: 'l8-dqn', zh: 'Deep Q-Learning', en: '§8.4 Deep Q-learning' },
      { id: 'l8-summary', zh: '本章总结', en: '§8.5 Summary' },
      { id: 'l8-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l8-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l8-qa', zh: '问答', en: 'Q&A · §8.6' },
    ],
  });
  const l8 = D.otherLectures.find(l => l.no === 8);
  if (l8) l8.done = true;
})();
