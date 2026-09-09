/* ═══════════════════════════════════════════════════════════
   L9 · 策略梯度方法（书 Ch.9）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §9.1 策略表示 ---- */
  S['l9-representation'] = {
    kicker: 'L9 · §9.1',
    title: { zh: '调转枪口：直接把策略做成函数', en: 'Turning the Gun Around: The Policy Itself Becomes a Function' },
    blocks: [
      { t: 'p', zh: '之前所有算法都是<strong>价值驱动</strong>的：先估价值，再 argmax 出策略。argmax 有个天生的毛病——它是<strong>不可导</strong>的硬操作，而且吐出来的永远是确定性策略。策略梯度方法直接参数化策略本身：<strong>π(a|s,θ) = exp(h(s,a)ᵀθ) / Σ<sub>a′</sub> exp(h(s,a′)ᵀθ)</strong>（softmax，h 是特征）。θ 一动，所有动作的概率连续地变——可以求导、可以试探、天生随机。', en: 'Every algorithm so far was <strong>value-driven</strong>: estimate values, then argmax out a policy. argmax has a birth defect — it is a hard, non-differentiable operation, and it always spits out deterministic policies. Policy gradient methods parameterise the policy itself: <strong>π(a|s,θ) = exp(h(s,a)ᵀθ) / Σ<sub>a′</sub> exp(h(s,a′)ᵀθ)</strong> (softmax, with features h). Move θ and every action’s probability shifts continuously — differentiable, searchable, naturally stochastic.' },
      { t: 'callout', variant: 'key', zh: '<strong>范式转移</strong>：之前是"学价值 → 间接得到策略"（价值是主角、策略是副产品）；现在是"直接学策略"（策略是主角、价值退居辅助——只用来指导梯度）。第 10 章的 Actor-Critic 名字就来自这个分工的进化版。', en: '<strong>A paradigm shift</strong>: before, “learn values → obtain a policy indirectly” (values star, policy by-product); now, “learn the policy directly” (policy stars, values demoted to helpers — only guiding the gradient). The Actor-Critic split in Chapter 10 is this division of labour, evolved.' },
    ],
  };

  /* ---- §9.2 度量 ---- */
  S['l9-metrics'] = {
    kicker: 'L9 · §9.2',
    title: { zh: '优化什么？给"好策略"定三个度量', en: 'Optimise What? Three Metrics for a Good Policy' },
    blocks: [
      { t: 'p', zh: '梯度上升需要一个<strong>标量</strong>目标。书上给了三个候选度量（大同小异）：① <strong>平均状态值</strong> v̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)v<sub>π</sub>(s)——按折扣访问分布加权；② <strong>初始状态值</strong> v̄⁰<sub>π</sub> = Σ<sub>s</sub> d₀(s)v<sub>π</sub>(s)——只看起点；③ <strong>平均单步奖励</strong> r̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)Σ<sub>a</sub>π(a|s)q<sub>π</sub>(s,a)——无折扣情形的续式任务度量。', en: 'Gradient ascent needs a <strong>scalar</strong> objective. The book offers three near-equivalent metrics: ① the <strong>average state value</strong> v̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)v<sub>π</sub>(s) — weighted by the discounted visitation distribution; ② the <strong>initial-state value</strong> v̄⁰<sub>π</sub> = Σ<sub>s</sub> d₀(s)v<sub>π</sub>(s) — only where you start; ③ the <strong>average per-step reward</strong> r̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)Σ<sub>a</sub>π(a|s)q<sub>π</sub>(s,a) — the continuing-task, undiscounted measure.' },
      { t: 'callout', variant: 'warn', zh: '<strong>别高兴太早</strong>：这三个度量的梯度推导是全书最硬的数学之一。坑在于 d<sub>π</sub>(s)、q<sub>π</sub>(s,a) 都依赖 θ——对 θ 求导时"求导的链"会沿着整条轨迹无限延伸。下一节的策略梯度定理用一记巧劲把这个死结剪开。', en: '<strong>Hold the applause</strong>: deriving the gradients of these metrics is among the hardest mathematics in the book. The trap: both d<sub>π</sub>(s) and q<sub>π</sub>(s,a) depend on θ — differentiating sends the chain endlessly along the trajectory. The policy gradient theorem in the next section cuts this knot with one clever stroke.' },
    ],
  };

  /* ---- §9.3 梯度定理 ---- */
  S['l9-theorem'] = {
    kicker: 'L9 · §9.3',
    title: { zh: '策略梯度定理：一记 log 剪断死结', en: 'The Policy Gradient Theorem: One log Cuts the Knot' },
    blocks: [
      { t: 'p', zh: '<strong>定理 9.1</strong> 的结论惊人地简洁：三个度量的梯度都长成同一个期望的样子——', en: 'The conclusion of <strong>Theorem 9.1</strong> is astonishingly clean: the gradients of all three metrics take the form of one expectation —' },
      { t: 'formula', lbl: '策略梯度定理 · Theorem 9.1',
        html: '∇<sub>θ</sub>J(θ) = Σ<sub>s</sub> η<sub>π</sub>(s) Σ<sub>a</sub> ∇<sub>θ</sub>π(a|s,θ) q<sub>π</sub>(s,a) &nbsp;=&nbsp; E[ <span class="mt">∇<sub>θ</sub>ln π(A|S,θ)</span> · q<sub>π</sub>(S,A) ]' },
      { t: 'p', zh: '<strong>那记巧劲是 log</strong>：恒等式 ∇<sub>θ</sub>π = π·∇<sub>θ</sub>ln π 把"对概率求导"改写成"概率 × 对 log 概率求导"。这样梯度就成了一个<strong>期望</strong>（在 η<sub>π</sub> 分布下）——期望就可以用样本平均来逼近（大数定律第五次登场）！推导中还有一个隐藏的幸运：q<sub>π</sub> 对 θ 的导数项（会引入整个未来的链式依赖）恰好相互抵消——剩下的只是"动作的对数概率 × 动作价值"。', en: 'The clever stroke is the log: the identity ∇<sub>θ</sub>π = π·∇<sub>θ</sub>ln π rewrites “differentiate a probability” as “probability × differentiate its log”. The gradient becomes an <strong>expectation</strong> (under η<sub>π</sub>) — and expectations can be approximated by sample averages (the law of large numbers, fifth appearance)! A hidden piece of luck: the ∇<sub>θ</sub>q<sub>π</sub> terms (which would drag in the entire future via the chain rule) cancel exactly — leaving only “log-probability of the action × action value”.' },
      { t: 'callout', variant: 'key', zh: '<strong>直观读法</strong>：∇ln π(a|s) 指向"提高 a 概率"的方向；乘上 q<sub>π</sub>(s,a) 意味着——<strong>回报高的动作，把它的概率往上推；回报低的，往下压</strong>。推力大小正比于 q 值。这就是策略梯度的全部灵魂：被奖励强化的行为会重复出现（心理学"强化"一词的数学化身）。', en: '<strong>How to read it intuitively</strong>: ∇ln π(a|s) points in the direction of raising a’s probability; multiplying by q<sub>π</sub>(s,a) means — <strong>push up the probabilities of high-return actions, push down those of low-return ones</strong>, with force proportional to q. That is the entire soul of the policy gradient: behaviours reinforced by reward recur (the mathematical incarnation of the psychological word “reinforcement”).' },
    ],
  };

  /* ---- §9.4 REINFORCE ---- */
  S['l9-reinforce'] = {
    kicker: 'L9 · §9.4',
    title: { zh: 'REINFORCE：采样出来的梯度上升', en: 'REINFORCE: Gradient Ascent from Samples' },
    blocks: [
      { t: 'p', zh: '把期望换成单条轨迹的采样，就得到 <strong>REINFORCE</strong>（蒙特卡洛策略梯度）。每采一条轨迹 (s₀,a₀,g₁,…)：对其中每一步，用 <strong>γ<sup>t</sup>G<sub>t</sub></strong>（从该步出发的折扣回报）代替 q<sub>π</sub>，执行更新：', en: 'Replacing the expectation by samples from a single trajectory yields <strong>REINFORCE</strong> (Monte Carlo policy gradient). For each trajectory (s₀,a₀,g₁,…): at every step, substitute <strong>γ<sup>t</sup>G<sub>t</sub></strong> (the discounted return from that step) for q<sub>π</sub> and apply the update:' },
      { t: 'formula', lbl: 'REINFORCE — Eq. (9.32)',
        html: 'θ<sub>t+1</sub> = θ<sub>t</sub> + α γ<sup>t</sup> G<sub>t</sub> ∇<sub>θ</sub>ln π(a<sub>t</sub>|s<sub>t</sub>, θ<sub>t</sub>)' },
      { t: 'p', zh: '书上的简洁读法（式 9.33）值得背下来：更新后 <strong>ln π(a<sub>t</sub>|s<sub>t</sub>) 变大当且仅当 G<sub>t</sub> > 0</strong>（折扣情形）——这次经历好，就提高这套动作的概率。注意两点：① 它是 <strong>on-policy</strong> 的（梯度定义在当前策略的分布上）；② 收敛到<strong>局部</strong>最优（θ 的非凸优化），全局最优要碰运气或加技巧。', en: 'The book’s compact reading (Eq. 9.33) is worth memorising: after the update, <strong>ln π(a<sub>t</sub>|s<sub>t</sub>) grows if and only if G<sub>t</sub> > 0</strong> (discounted case) — a good experience raises the probability of exactly those actions. Two caveats: ① it is <strong>on-policy</strong> (the gradient is defined on the current policy’s distribution); ② it converges to a <strong>local</strong> optimum (θ optimisation is nonconvex) — global optimality needs luck or extra machinery.' },
      { t: 'widget', component: 'l9-reinforce-lab' },
    ],
  };

  /* ---- §9.5 总结 ---- */
  S['l9-summary'] = {
    kicker: 'L9 · §9.5',
    title: { zh: '本章总结：策略基于的方法登场', en: 'Chapter Summary: Policy-Based Methods Enter' },
    blocks: [
      { t: 'p', zh: '全书第一次，主角从价值换成了策略。套路三步：<strong>选标量度量 → 推梯度 → 梯度上升</strong>。最难的推导（定理 9.1）产出一句期望式，log 技巧让梯度可采样。REINFORCE 把它跑成在线算法：好经历加概率、坏经历减概率。从此强化学习有了两根支柱：价值基（L2–L8）与策略基（本章）。', en: 'For the first time, the protagonist switches from values to policies. The recipe is three steps: <strong>pick a scalar metric → derive its gradient → ascend</strong>. The hardest derivation (Theorem 9.1) yields one expectation formula, and the log trick makes it samplable. REINFORCE runs it as an online algorithm: good experiences raise probabilities, bad ones lower them. RL now stands on two pillars: value-based (L2–L8) and policy-based (this chapter).' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：REINFORCE 用真实回报 G<sub>t</sub> 当"评分员"——无偏但方差大、必须等回合结束。<strong>Actor-Critic</strong> 请来一位评论家：用价值函数（TD 误差）当评分员——方差骤降、还能单步更新。演员负责表演（策略），评论家负责打分（价值），两者互相成就。', en: 'Next lecture teaser: REINFORCE hires the real return G<sub>t</sub> as the “grader” — unbiased but high-variance, and it must wait for episodes to end. <strong>Actor-Critic</strong> hires a critic: the value function (TD error) grades instead — variance collapses and updates become per-step. The actor performs (policy); the critic scores (value); each makes the other better.' },
    ],
  };

  /* ---- L9 长推理 ---- */
  S['l9-reasoning'] = {
    kicker: 'L9 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：让策略自己长出最优来', en: 'The Long Coherent Reasoning: Letting the Policy Grow Its Own Optimality' },
    blocks: [
      { t: 'p', zh: '本章推理链：argmax 不可导、吐不出随机策略 → softmax 参数化 → 需要标量度量（三个候选）→ 度量的梯度有死结（d_π、q 依赖 θ）→ log 恒等式剪断 → 期望式可采样 → REINFORCE：好经历加概率。', en: 'This chapter’s spine: argmax is non-differentiable and deterministic → parameterise with softmax → a scalar metric is needed (three candidates) → the metric’s gradient has a knot (d_π and q depend on θ) → the log identity cuts it → the expectation is samplable → REINFORCE: good experiences raise probability.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l9' } },
    ],
  };

  /* ---- L9 代码 ---- */
  S['l9-code'] = {
    kicker: 'L9 · 动手 · Hands-on',
    title: { zh: '代码精讲：REINFORCE 全身不过 30 行', en: 'Code Walkthrough: REINFORCE in About 30 Lines' },
    blocks: [
      { t: 'p', zh: '策略梯度代码的主角不是循环而是<strong>梯度公式</strong>：∇lnπ = onehot(a) − π（softmax 的魔法导数）。这一行加上回报折扣，就是 REINFORCE 的全部数学。', en: 'The protagonist of policy-gradient code is not the loop but the <strong>gradient formula</strong>: ∇lnπ = onehot(a) − π (the magic softmax derivative). That line plus return discounting is the whole mathematics of REINFORCE.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l9' } },
    ],
  };

  /* ---- L9 Q&A ---- */
  S['l9-qa'] = {
    kicker: 'L9 · §9.6',
    title: { zh: '问答：策略梯度六连问', en: 'Q&A: Six Questions on Policy Gradient' },
    blocks: [
      { t: 'p', zh: '为什么有 log、为什么要学无折扣情形、更新到底在更新什么——六问扫清本课。', en: 'Why the log, why study the undiscounted case, what is the update really updating — six questions to clear the lesson.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l9' } },
    ],
  };

  /* ═══ L9 长推理链 ═══ */
  D.reasoningSets['l9'] = [
    { link: '起点 · Start',
      title: { zh: '价值路线的天花板', en: 'The ceiling of the value route' },
      zh: '价值基方法先估价值再 argmax。argmax 不可导、天然确定性、且"对动作偏好的微调"无法表达——想从 0.7 调到 0.75，argmax 只会给 0 或 1。深度学习时代的一切武器（梯度下降）都要求可导。',
      en: 'Value-based methods estimate values then argmax. argmax is non-differentiable, inherently deterministic, and cannot express fine tuning of action preferences — nudging 0.7 to 0.75 is impossible when the answer is 0 or 1. Every deep-learning weapon (gradient descent) demands differentiability.',
      question: '如何让"策略"本身可导？' },
    { link: '参数化 · Parameterise',
      title: { zh: 'softmax 策略：π(a|s,θ)', en: 'The softmax policy: π(a|s,θ)' },
      zh: '给每个动作打分 h(s,a)ᵀθ，softmax 归一化成概率。θ 移动 → 概率连续变化 → 可求导 → 可用梯度上升。随机性免费赠送：探索天然内置（对比 ε-greedy 的人为拼装）。',
      en: 'Score every action with h(s,a)ᵀθ and normalise with softmax. Moving θ shifts probabilities continuously → differentiable → gradient ascent works. Randomness comes free: exploration is built in (contrast the hand-assembled ε-greedy).',
      question: '往哪个方向移动 θ 才算"变好"？' },
    { link: '定标 · Pick a metric',
      title: { zh: '需要标量度量：三个候选', en: 'Need a scalar metric: three candidates' },
      zh: '梯度上升优化的是标量。候选：平均状态值 v̄_π（按访问分布加权）、初始状态值 v̄⁰_π（只看起点）、平均单步奖励 r̄_π（连续任务）。三者同宗，梯度形状相似。',
      en: 'Gradient ascent optimises a scalar. Candidates: the average state value v̄_π (visitation-weighted), the initial-state value v̄⁰_π (starts only), the average per-step reward r̄_π (continuing tasks). Same family, similar gradient shapes.',
      question: '这些度量对 θ 的梯度能求出来吗？' },
    { link: '死结 · The knot',
      title: { zh: '死结：d_π 和 q 都依赖 θ', en: 'The knot: both d_π and q depend on θ' },
      zh: '对度量求导时，链式法则会沿轨迹无限延伸（下一状态的价值也依赖 θ，下下状态也是……）。硬算需要"折扣总转移概率"这样的重机器（书上引理 9.2 用 (I−γP_π)⁻¹）。有没有一劳永逸的化简？',
      en: 'Differentiating the metric sends the chain rule down the trajectory forever (next-state values depend on θ, and so on). Brute force needs heavy machinery — discounted total transition probabilities via (I−γP_π)⁻¹ (Lemma 9.2). Is there a once-and-for-all simplification?',
      question: '有没有一行就能写完的梯度？' },
    { link: '剪断 · Cut',
      title: { zh: '定理 9.1：∇J = E[∇lnπ · q]', en: 'Theorem 9.1: ∇J = E[∇lnπ · q]' },
      zh: '恒等式 ∇π = π∇lnπ 把梯度变成期望；q 的导数项恰好抵消；剩下的 ∇lnπ(a|s) 对 softmax 就是 onehot(a) − π——简单到可以手写。期望式 = 可以采样 = 大数定律接管一切。',
      en: 'The identity ∇π = π∇lnπ turns the gradient into an expectation; the ∇q terms cancel exactly; and ∇lnπ(a|s) for softmax is just onehot(a) − π — simple enough to write by hand. An expectation is samplable — the law of large numbers takes over.',
      question: '采样版算法长什么样？' },
    { link: '成算法 · The algorithm',
      title: { zh: 'REINFORCE：好经历加概率', en: 'REINFORCE: good experiences raise probability' },
      zh: '每采一条轨迹，对每步 t 用折扣回报 γ^t G_t 代替 q：θ ← θ + αγ^t G_t ∇lnπ。式 (9.33) 的读法：G_t > 0 ⟹ ln π(a_t|s_t) 上升。被奖励强化的行为更常出现——策略在采样中自己长成最优（局部）。',
      en: 'For each sampled trajectory, replace q at step t with the discounted return γ^t G_t: θ ← θ + αγ^t G_t ∇lnπ. Reading Eq. (9.33): G_t > 0 ⟹ ln π(a_t|s_t) rises. Reward-reinforced behaviours recur — the policy grows its own (local) optimality from sampling.',
      question: null },
  ];

  /* ═══ L9 代码块 ═══ */
  const srcREINFORCE = `import numpy as np

def softmax(h):
    """pi(a|s,theta) = exp(h_a) / sum exp(h_a)   -- the differentiable policy."""
    e = np.exp(h - h.max())          # numeric stabilisation
    return e / e.sum()

def grad_ln_pi(pi, a):
    """The magic softmax derivative: d/dh ln pi(a) = onehot(a) - pi."""
    g = -pi.copy()
    g[a] += 1.0
    return g

def reinforce(env, episodes=3000, gamma=0.9, alpha=0.02, max_steps=200):
    """REINFORCE (Eq. 9.32): theta <- theta + alpha * gamma^t * G_t * grad ln pi."""
    n, n_a = env.num_states, len(env.action_space)
    theta = np.zeros((n, n_a))                 # raw scores, zeros => uniform policy
    for ep in range(episodes):
        # ── sample one episode under the current softmax policy ──
        s = env.reset()
        traj = []                              # (s_t, a_t)
        for t in range(max_steps):
            pi_s = softmax(theta[s])
            a = np.random.choice(n_a, p=pi_s)
            s2, r, done, _ = env.step(a)
            traj.append((s, a, r))
            s = s2
            if done:
                break
        # ── compute discounted returns backwards, then update ──
        G = 0.0
        for (s_t, a_t, r_t1) in reversed(traj):
            G = gamma * G + r_t1
            pi_s = softmax(theta[s_t])
            theta[s_t] += alpha * G * grad_ln_pi(pi_s, a_t)   # Eq. 9.32 (gamma^t folded into G)
    return theta`;

  D.codeFileSets['l9'] = [
    {
      id: 'l9-reinforce-code', file: 'reinforce.py — 蒙特卡洛策略梯度', tab: '① REINFORCE',
      intro: { zh: '代码的三个主角：<code class="inline">softmax</code>（可导策略）、<code class="inline">grad_ln_pi</code>（那行魔法导数 onehot − π）、以及"先采完整条轨迹、倒推 G、再更新"的 MC 节奏。θ 用"原始分数"存而不是概率——因为梯度上升在分数空间里天然平稳。', en: 'Three protagonists: <code class="inline">softmax</code> (the differentiable policy), <code class="inline">grad_ln_pi</code> (that magic derivative onehot − π), and the MC rhythm of “sample the whole trajectory, walk G backwards, then update”. θ stores raw scores rather than probabilities — gradient ascent is naturally well-behaved in score space.' },
      code: srcREINFORCE,
      notes: [
        { lines: [9, 10], tag: 'grad ★', zh: '<strong>全文件最有含金量的一行</strong>：∇lnπ(a) = onehot(a) − π。直觉：把被选动作的概率向上推、其余全部向下压，推力合计为零（概率守恒）。它是 softmax 对 log 的导数——一行代码就是策略梯度定理的落点。', en: '<strong>The most valuable line of the file</strong>: ∇lnπ(a) = onehot(a) − π. Intuition: push the taken action’s probability up and all others down, with the pushes summing to zero (probability conservation). It is softmax’s log-derivative — one line of code where the policy gradient theorem lands.' },
        { lines: [24, 27], tag: 'backward G', zh: '倒推 G 与 L5 的 MC 一模一样——REINFORCE 本质是"MC 回报 + 策略梯度更新"。γ^t 的折扣折进了 G 的递推里，所以更新式里不用再写 γ^t。', en: 'The backward G pass is identical to L5’s MC — REINFORCE is essentially “MC returns + a policy-gradient update”. The γ^t discounting is folded into G’s recursion, which is why it does not reappear in the update line.' },
        { lines: [28, 28], tag: 'update ★', zh: '<code class="inline">theta[s_t] += alpha * G * grad</code>：G > 0 时被选动作概率上升（其余下降），G < 0 反向。α 是唯一的旋钮——过大抖动、过小慢。没减基线是它方差大的根源（第 10 章 baseline/评论家来治）。', en: '<code class="inline">theta[s_t] += alpha * G * grad</code>: G > 0 raises the taken action’s probability (others fall), G < 0 reverses it. α is the only dial — too big jitters, too small crawls. No baseline is the root of its high variance (Chapter 10’s baseline/critic is the cure).' },
      ],
    },
  ];

  /* ═══ L9 Q&A ═══ */
  D.qaSets['l9'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '策略梯度方法的基本思想？', en: 'What is the basic idea of the policy gradient method?' },
      a: { zh: '三步：选一个合适的标量度量、推导它的梯度、用梯度上升优化。最重要的理论结果是定理 9.1 的策略梯度表达式。', en: 'Three steps: pick a suitable scalar metric, derive its gradient, optimise by gradient ascent. The most important theoretical result is the policy gradient expression of Theorem 9.1.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '策略梯度方法最复杂的部分？', en: 'What is the most complicated part?' },
      a: { zh: '思想的简单，难在<strong>梯度的推导</strong>：要区分多种度量、折扣/无折扣场景，每种推导都不平凡。多数读者掌握定理 9.1 的结论即可，证明可跳过。', en: 'The idea is simple; the <strong>gradient derivations</strong> are hard: many metrics, discounted/undiscounted cases, each nontrivial. Most readers can take Theorem 9.1 as given and skip the proofs.' } },
    { tag: 'Q3 · 书上原问', q: { zh: '为什么策略梯度里有个自然对数？', en: 'Why does a natural logarithm appear in the policy gradient?' },
      a: { zh: '引入 log 是为了把梯度<strong>表达成期望</strong>：∇π = π∇lnπ 让"对 θ 求导"与"概率分布"解耦，期望就能用随机样本逼近——不可导的问题瞬间变成统计问题。', en: 'The log expresses the gradient <strong>as an expectation</strong>: ∇π = π∇lnπ decouples differentiation from the distribution, and an expectation can be approximated by stochastic samples — a non-differentiable problem instantly becomes a statistical one.' } },
    { tag: 'Q4 · 书上原问', q: { zh: '为什么推导时还要研究无折扣情形？', en: 'Why also study the undiscounted case in the derivations?' },
      a: { zh: '因为平均奖励 r̄_π 的定义对折扣/无折扣都成立：折扣情形下它的梯度只是一种近似，无折扣情形的梯度更优雅严谨。两组结果相似，工程上常互换使用。', en: 'Because the average reward r̄_π is defined for both cases: its gradient in the discounted case is only an approximation, while the undiscounted gradient is cleaner and exact. The two results are similar and used interchangeably in practice.' } },
    { tag: 'Q5 · 书上原问', q: { zh: '式 (9.32) 的更新到底在更新什么？', en: 'What is the update (9.32) really updating?' },
      a: { zh: '看简洁式 (9.33)：它是对 π(a<sub>t</sub>|s<sub>t</sub>,θ) 的对数概率做梯度上升——G<sub>t</sub> > 0 时上升、G<sub>t</sub> < 0 时下降。"这次经历好不好"直接翻译成"这套动作下次多不多走"。', en: 'Read the compact form (9.33): it is gradient ascent on the log-probability of π(a<sub>t</sub>|s<sub>t</sub>,θ) — rising when G<sub>t</sub> > 0, falling when G<sub>t</sub> < 0. “Was this experience good” translates directly into “will this set of actions be taken more often”.' } },
    { tag: 'Q6 · 补充', q: { zh: '策略基 vs 价值基，各擅长什么？', en: 'Policy-based vs value-based — what is each good at?' },
      a: { zh: '策略基：天然输出随机策略（适合需要随机性的场景如石头剪刀布）、可表达连续动作、参数化平滑易收敛到局部最优；价值基：样本效率高、可离策略、表格情形收敛到全局最优。Actor-Critic（下一课）取两者之长。', en: 'Policy-based: naturally stochastic policies (ideal when randomness matters, like rock-paper-scissors), continuous actions, smooth local convergence. Value-based: sample-efficient, off-policy capable, globally optimal in the tabular case. Actor-Critic (next lecture) takes the best of both.' } },
  ];

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 9,
    label: 'L9 · 策略梯度方法',
    items: [
      { id: 'l9-representation', zh: '策略的函数表示', en: '§9.1 Policy representation' },
      { id: 'l9-metrics', zh: '三个优化度量', en: '§9.2 Three metrics' },
      { id: 'l9-theorem', zh: '策略梯度定理', en: '§9.3 The policy gradient theorem' },
      { id: 'l9-reinforce', zh: 'REINFORCE', en: '§9.4 REINFORCE' },
      { id: 'l9-summary', zh: '本章总结', en: '§9.5 Summary' },
      { id: 'l9-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l9-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l9-qa', zh: '问答', en: 'Q&A · §9.6' },
    ],
  });
  const l9 = D.otherLectures.find(l => l.no === 9);
  if (l9) l9.done = true;
})();
