/* ═══════════════════════════════════════════════════════════
   L10 · Actor-Critic 方法（书 Ch.10）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §10.1 QAC ---- */
  S['l10-qac'] = {
    kicker: 'L10 · §10.1',
    title: { zh: 'QAC：演员上台，评论家入席', en: 'QAC: The Actor Takes the Stage, the Critic Takes a Seat' },
    blocks: [
      { t: 'p', zh: 'REINFORCE 的评分员是真实回报 G<sub>t</sub>——无偏但要等整条轨迹、方差大。<strong>QAC（Q actor-critic）</strong>换了个评分员：<strong>用 TD 学习现估的 q(s,a,w)</strong>。每步两行更新：<strong>演员（actor）</strong>——θ<sub>t+1</sub> = θ<sub>t</sub> + α<sub>θ</sub>∇<sub>θ</sub>ln π(a<sub>t</sub>|s<sub>t</sub>,θ<sub>t</sub>) q(s<sub>t</sub>,a<sub>t</sub>,w<sub>t</sub>)，沿评论家给的分改进策略；<strong>评论家（critic）</strong>——w<sub>t+1</sub> = w<sub>t</sub> + α<sub>w</sub>[r + γq(s′,a′,w) − q(s,a,w)]∇<sub>w</sub>q，用 TD 误差修正自己的评分表。', en: 'REINFORCE’s grader is the real return G<sub>t</sub> — unbiased but episode-bound and high-variance. <strong>QAC (Q actor-critic)</strong> hires a different grader: <strong>the q(s,a,w) estimated on the fly by TD learning</strong>. Each step is two lines. The <strong>actor</strong>: θ<sub>t+1</sub> = θ<sub>t</sub> + α<sub>θ</sub>∇<sub>θ</sub>ln π(a<sub>t</sub>|s<sub>t</sub>,θ<sub>t</sub>) q(s<sub>t</sub>,a<sub>t</sub>,w<sub>t</sub>) — improve the policy along the critic’s score. The <strong>critic</strong>: w<sub>t+1</sub> = w<sub>t</sub> + α<sub>w</sub>[r + γq(s′,a′,w) − q(s,a,w)]∇<sub>w</sub>q — correct its own scoring table by the TD error.' },
      { t: 'callout', variant: 'key', zh: '<strong>分工的本质</strong>：演员是策略函数 π(a|s,θ)（负责行动），评论家是价值函数 q(s,a,w)（负责打分）。评论家的 TD 目标让打分逐渐可靠；演员的梯度让策略逐渐优秀。对比 REINFORCE：评分从"事后整条轨迹"变为"当场 TD"——方差骤降、可单步更新。这就是广义策略迭代在无模型世界的完成态。', en: '<strong>The essence of the division of labour</strong>: the actor is the policy function π(a|s,θ) (acts); the critic is the value function q(s,a,w) (scores). The critic’s TD target makes the scores reliable over time; the actor’s gradient makes the policy better. Against REINFORCE: scoring changes from “after-the-fact whole trajectory” to “on-the-spot TD” — variance collapses and per-step updates become possible. This is generalised policy iteration completed in the model-free world.' },
    ],
  };

  /* ---- §10.2 A2C ---- */
  S['l10-a2c'] = {
    kicker: 'L10 · §10.2',
    title: { zh: 'A2C：减去基线，方差骤降', en: 'A2C: Subtract a Baseline, Watch the Variance Fall' },
    blocks: [
      { t: 'p', zh: '<strong>基线不变性（式 10.3）</strong>：策略梯度里给 q 减去任意一个只依赖状态的函数 b(S)，期望不变——因为 E[∇lnπ(S)·b(S)] = Σ<sub>s</sub>η(s)b(s)Σ<sub>a</sub>∇π(a|s) = 0（概率和恒为 1，导数为 0）。<strong>减错不了，白赚</strong>。最优的 b 是 v<sub>π</sub>(s)——减完剩下的恰好是<strong>优势（advantage）</strong>：', en: '<strong>Baseline invariance (Eq. 10.3)</strong>: subtracting any state-only function b(S) from q inside the policy gradient leaves the expectation unchanged — because E[∇lnπ(S)·b(S)] = Σ<sub>s</sub>η(s)b(s)Σ<sub>a</sub>∇π(a|s) = 0 (probabilities sum to one, so their gradient is zero). <strong>You cannot get it wrong, and it is free.</strong> The optimal b is v<sub>π</sub>(s) — subtracting it leaves exactly the <strong>advantage</strong>:' },
      { t: 'formula', lbl: '优势函数 · The advantage function',
        html: 'A<sub>π</sub>(s,a) = q<sub>π</sub>(s,a) − v<sub>π</sub>(s) &nbsp;<span style="color:var(--ink-3)">= 这个动作比"平均水平"好多少</span>' },
      { t: 'p', zh: '为什么 v<sub>π</sub>(s) 是最优基线？它让评分从"绝对好坏"变成"相对意外程度"：q 高于平均水平 → 正优势 → 多用；低于 → 少用。实践中用 TD 误差 δ = r + γv(s′) − v(s) 当优势的样本估计（单步、低方差），得到 <strong>A2C（Advantage Actor-Critic）</strong>。', en: 'Why is v<sub>π</sub>(s) the optimal baseline? It turns scores from “absolute goodness” into “relative surprise”: q above average → positive advantage → use more; below → less. In practice the TD error δ = r + γv(s′) − v(s) serves as the one-step, low-variance sample of the advantage, giving <strong>A2C (Advantage Actor-Critic)</strong>.' },
    ],
  };

  /* ---- §10.3 off-policy ---- */
  S['l10-offpolicy'] = {
    kicker: 'L10 · §10.3',
    title: { zh: 'Off-policy Actor-Critic：重要性采样穿针引线', en: 'Off-Policy Actor-Critic: Importance Sampling Threads the Needle' },
    blocks: [
      { t: 'p', zh: 'A2C 仍是 on-policy（样本必须来自当前策略）。想用旧数据或别的策略的数据？需要<strong>重要性采样（importance sampling）</strong>：用比值 ρ = π(a|s)/β(a|s) 给每条样本加权，把"别的策略的经验"折算回"我的策略的期望"——分布不同，权重来凑。代价：比值方差大（权重忽大忽小），轨迹越长越难算。', en: 'A2C is still on-policy (samples must come from the current policy). Want to reuse old data or another policy’s data? <strong>Importance sampling</strong>: weight each sample by the ratio ρ = π(a|s)/β(a|s), converting “another policy’s experience” into “my policy’s expectation” — different distributions, weights make up the difference. The price: ratio variance (weights swing wildly), and it worsens with trajectory length.' },
      { t: 'p', zh: '把重要性比值塞进优势加权的梯度，就得到 off-policy actor-critic。再往前一步：<strong>确定性策略梯度（DPG）</strong>——策略干脆不输出概率，直接输出动作 μ(s,θ)，梯度变成 ∇<sub>θ</sub>μ(s,θ)·∇<sub>a</sub>q(s,a)|<sub>a=μ</sub>（沿着 q 的山坡最陡处推动作）。行为策略 β 随便选个探索性的即可。DDPG、TD3 都是这条线的后人。', en: 'Plugging the importance ratios into the advantage-weighted gradient yields off-policy actor-critic. One step further: the <strong>deterministic policy gradient (DPG)</strong> — the policy outputs an action μ(s,θ) outright instead of probabilities, with gradient ∇<sub>θ</sub>μ(s,θ)·∇<sub>a</sub>q(s,a)|<sub>a=μ</sub> (push the action along q’s steepest slope). The behavior policy β can be any exploratory one. DDPG and TD3 are descendants of this line.' },
    ],
  };

  /* ---- §10.5 总结 ---- */
  S['l10-summary'] = {
    kicker: 'L10 · §10.5',
    title: { zh: '本章总结 & 全书收官', en: 'Chapter Summary & The End of the Book' },
    blocks: [
      { t: 'p', zh: '本章四种 actor-critic：QAC（评论家用 TD 估 q，替代 MC 评分）→ A2C（减基线 v<sub>π</sub>，评分变成优势，方差骤降）→ off-policy 版（重要性采样复用旧数据）→ 确定性策略梯度（连续动作的钥匙）。它们共享同一个骨架：<strong>演员沿评论家的分数做梯度上升，评论家沿 TD 误差做梯度下降</strong>。', en: 'Four actor-critics this chapter: QAC (the critic estimates q by TD, replacing the MC grader) → A2C (subtract the baseline v<sub>π</sub>, scores become advantages, variance collapses) → the off-policy version (importance sampling reuses old data) → deterministic policy gradient (the key to continuous actions). All share one skeleton: <strong>the actor ascends the critic’s score; the critic descends its TD error</strong>.' },
      { t: 'p', zh: '全书收官回顾：L1 概念 → L2–L3 Bellman 方程与最优性 → L4 动态编程 → L5–L7 无模型（MC/TD/Sarsa/Q）→ L8 函数近似与 DQN → L9–L10 策略梯度与 Actor-Critic。两条主线贯穿始终：<strong>广义策略迭代</strong>（评估↔改进交替）与<strong>随机近似</strong>（带噪声的增量更新）。书的终点是文献的起点：SAC、TRPO、PPO、TD3、多智能体、基于模型、分布式 RL……地基已经打好，往上盖楼吧。', en: 'A closing tour: L1 concepts → L2–L3 Bellman equations and optimality → L4 dynamic programming → L5–L7 model-free (MC/TD/Sarsa/Q) → L8 function approximation and DQN → L9–L10 policy gradient and Actor-Critic. Two threads run through it all: <strong>generalised policy iteration</strong> (evaluation↔improvement alternating) and <strong>stochastic approximation</strong> (noisy incremental updates). Where the book ends, the literature begins: SAC, TRPO, PPO, TD3, multi-agent, model-based, distributional RL… the foundation is laid — go build on it.' },
      { t: 'widget', component: 'l10-ac-lab' },
      { t: 'callout', variant: 'done', zh: '<strong>恭喜读完</strong>：十讲全部可视化完毕。建议的复习路径：① 从首页课程索引重进每一课的“连贯长推理”；② 对照“代码精讲”亲手复现值迭代、Q-learning 和 REINFORCE；③ 回到作业（4×4 世界）把报告需要的图逐一画出来。', en: '<strong>Congratulations on finishing</strong>: all ten lectures are now visualised. Suggested review path: ① re-enter each lecture via its “long coherent reasoning” from the lecture index; ② reproduce value iteration, Q-learning and REINFORCE by hand against the code walkthroughs; ③ return to the assignment (the 4×4 world) and produce the figures your report needs.' },
    ],
  };

  /* ---- L10 长推理 ---- */
  S['l10-reasoning'] = {
    kicker: 'L10 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：演员与评论家的分工史', en: 'The Long Coherent Reasoning: A History of the Actor–Critic Division of Labour' },
    blocks: [
      { t: 'p', zh: '本章推理链：REINFORCE 的 MC 评分贵 → 请 TD 评论家（QAC）→ 评分减基线 v(s) 变优势（A2C，方差骤降且不变性免费）→ off-policy 复用旧数据（重要性采样）→ 确定性策略（DPG 通向连续控制）→ SAC/PPO/TD3 的家谱。', en: 'This chapter’s spine: REINFORCE’s MC grading is dear → hire a TD critic (QAC) → subtract the baseline v(s) for advantages (A2C: variance collapses, invariance is free) → reuse old data off-policy (importance sampling) → deterministic policies (DPG toward continuous control) → the family tree of SAC/PPO/TD3.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l10' } },
    ],
  };

  /* ---- L10 代码 ---- */
  S['l10-code'] = {
    kicker: 'L10 · 动手 · Hands-on',
    title: { zh: '代码精讲：A2C 的完整骨架', en: 'Code Walkthrough: The Complete A2C Skeleton' },
    blocks: [
      { t: 'p', zh: 'A2C 的每一步 = 一行评论家更新（TD 误差修 v）+ 一行演员更新（优势推策略）。40 行以内，两个网络（或两张表）的全部爱恨情仇。', en: 'One step of A2C = one line of critic update (TD error fixes v) + one line of actor update (advantage pushes the policy). Within 40 lines, the entire love-hate story of two networks (or two tables).' },
      { t: 'widget', component: 'code-lab', props: { source: 'l10' } },
    ],
  };

  /* ---- L10 Q&A ---- */
  S['l10-qa'] = {
    kicker: 'L10 · §10.6',
    title: { zh: '问答：Actor-Critic 六连问', en: 'Q&A: Six Questions on Actor-Critic' },
    blocks: [
      { t: 'p', zh: '为什么需要评论家、基线为什么白赚、确定性策略怎么求导——收官六问。', en: 'Why a critic, why baselines are free, how deterministic policies differentiate — the closing six.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l10' } },
    ],
  };

  /* ═══ L10 长推理链 ═══ */
  D.reasoningSets = D.reasoningSets || {};
  D.reasoningSets['l10'] = [
    { link: '起点 · Start',
      title: { zh: 'REINFORCE 的评分员太贵', en: 'REINFORCE’s grader is too expensive' },
      zh: 'MC 评分员 G_t：无偏但要等回合结束、方差巨大（整条轨迹的噪声全算在头上）。想象一位评论家要等电影全部放完才打分，而且打分全凭最后一幕的心情。',
      en: 'The MC grader G_t: unbiased but episode-bound, with enormous variance (an entire trajectory’s noise lands on one head). Imagine a critic who waits for the whole movie to end and rates it by the mood of the last scene.',
      question: '能不能有一位当场打分的评论家？' },
    { link: '请评论家 · Hire a critic',
      title: { zh: 'QAC：TD 误差就是评分修正', en: 'QAC: the TD error is the scoring correction' },
      zh: '评论家 q(s,a,w) 用 TD 学习现场估值（critic 更新）；演员用评论家的 q 值替代 REINFORCE 里的 G_t 做策略梯度（actor 更新）。方差骤降、单步更新、在线可学——广义策略迭代的无模型完成态。',
      en: 'The critic q(s,a,w) estimates values on the fly by TD (critic update); the actor replaces REINFORCE’s G_t with the critic’s q in the policy gradient (actor update). Variance collapses, per-step updates, online learning — generalised policy iteration completed model-free.',
      question: 'q 减去一个只依赖状态的函数，会变味吗？' },
    { link: '减基线 · Baseline',
      title: { zh: '基线免费：减 v(s) 得优势 A(s,a)', en: 'Baselines are free: subtract v(s) for the advantage A(s,a)' },
      zh: 'E[∇lnπ·b(S)] = 0 对任何 b(S) 成立（概率和恒 1、导数和恒 0）——基线随便减，期望不变。最优基线取 v_π(s)：评分从“绝对好坏”变成“超出平均多少”，方差进一步下降。A2C = advantage actor-critic。',
      en: 'E[∇lnπ·b(S)] = 0 for any b(S) (probabilities sum to one, so their gradient is zero) — subtract any baseline, the expectation is untouched. The optimal baseline is v_π(s): scores shift from “absolute goodness” to “surprise above average”, and variance falls further. A2C = advantage actor-critic.',
      question: '想用旧数据或别人的数据怎么办？' },
    { link: '复用 · Reuse',
      title: { zh: '重要性采样：off-policy 的通行证', en: 'Importance sampling: the off-policy pass' },
      zh: '比值 ρ = π/β 把 β 策略的经验折算回 π 的期望。代价：方差随轨迹长度增长。再进一步的 DPG 让策略直接输出动作 μ(s,θ)（连续动作的钥匙），梯度沿 ∇_a q 推动作。这一支的后人：DDPG、TD3。',
      en: 'The ratio ρ = π/β converts β-policy experience into π-policy expectation. The cost: ratio variance grows with trajectory length. A step further, DPG makes the policy output actions μ(s,θ) directly (the key to continuous control), pushing actions along ∇_a q. Descendants: DDPG, TD3.',
      question: null },
  ];

  /* ═══ L10 代码块 ═══ */
  const srcA2C = `import numpy as np

def softmax(h):
    e = np.exp(h - h.max())
    return e / e.sum()

def a2c(env, episodes=4000, gamma=0.9, alpha_theta=0.02, alpha_w=0.1,
        max_steps=200):
    """Advantage actor-critic (one-step, tabular).
    actor:  theta[s]  -- raw scores -> softmax policy  (the performer)
    critic: w[s]      -- state values v(s)             (the scorer)"""
    n, n_a = env.num_states, len(env.action_space)
    theta = np.zeros((n, n_a))
    w = np.zeros(n)
    for ep in range(episodes):
        s = env.reset()
        for t in range(max_steps):
            # ---- act by the current policy ----
            pi_s = softmax(theta[s])
            a = np.random.choice(n_a, p=pi_s)
            s2, r, done, _ = env.step(a)
            # ---- critic: TD error = advantage sample ----
            v_s2 = 0.0 if done else w[s2]
            delta = r + gamma * v_s2 - w[s]
            w[s] += alpha_w * delta                       # critic update
            # ---- actor: push the taken action by the advantage ----
            pi_s = softmax(theta[s])
            grad_ln_pi = -pi_s.copy(); grad_ln_pi[a] += 1.0
            theta[s] += alpha_theta * delta * grad_ln_pi   # actor update
            s = s2
            if done:
                break
    return theta, w`;

  D.codeFileSets = D.codeFileSets || {};
  D.codeFileSets['l10'] = [
    {
      id: 'l10-a2c-code', file: 'a2c.py — 优势演员评论家', tab: '① A2C',
      intro: { zh: 'A2C 每步只有两行更新：评论家 <code class="inline">w[s] += α_w·δ</code>（沿 TD 误差修正价值），演员 <code class="inline">theta[s] += α_θ·δ·∇lnπ</code>（同一个 δ 换个方向推策略）。对比 L9 的 REINFORCE：G_t 换成了 δ——从“整条轨迹的最终审判”变成“每一步的当庭修正”。', en: 'One A2C step is two update lines: the critic <code class="inline">w[s] += α_w·δ</code> (fixing values along the TD error) and the actor <code class="inline">theta[s] += α_θ·δ·∇lnπ</code> (the same δ pushes the policy). Against L9’s REINFORCE: G_t is replaced by δ — from “the final verdict of a whole trajectory” to “an on-the-spot correction every step”.' },
      code: srcA2C,
      notes: [
        { lines: [20, 22], tag: 'delta ★', zh: '<strong>δ = r + γv(s′) − v(s)</strong>：这一行身兼三职——它是评论家的 TD 误差、优势的单步样本、演员的推动力。一个量喂两张网络，这正是 actor-critic 的效率来源。', en: '<strong>δ = r + γv(s′) − v(s)</strong>: this one line holds three jobs — the critic’s TD error, the one-step sample of the advantage, and the actor’s driving force. One quantity feeds two networks: the efficiency source of actor-critic.' },
        { lines: [23, 23], tag: 'critic', zh: '评论家更新与 L7 的 TD(0) 完全同款——评论家就是"会打分的 TD"。它的收敛由 L6 的随机近似理论背书。', en: 'The critic update is identical to L7’s TD(0) — the critic is “a TD that grades”. Its convergence is vouched by L6’s stochastic approximation theory.' },
        { lines: [26, 28], tag: 'actor', zh: '演员更新与 L9 的 REINFORCE 同构，仅 G 换成 δ。对比记忆：REINFORCE 高方差无偏、必须等回合；A2C 有偏低方差、单步更新。基线 v(s) 减掉的正是"与动作无关的那部分评分噪声"。', en: 'The actor update is isomorphic to L9’s REINFORCE with G swapped for δ. Contrast: REINFORCE is high-variance, unbiased, episode-bound; A2C is biased, low-variance, per-step. The baseline v(s) removes exactly the score noise that has nothing to do with the action.' },
      ],
    },
  ];

  /* ═══ L10 Q&A ═══ */
  D.qaSets = D.qaSets || {};
  D.qaSets['l10'] = [
    { tag: 'Q1 · 补充', q: { zh: '为什么 Actor-Critic 需要"两个网络"？', en: 'Why does Actor-Critic need “two networks”?' },
      a: { zh: '演员（策略）负责行动与被优化；评论家（价值）负责给动作打分以降低梯度估计的方差。理论上一个就够（REINFORCE 用真实回报打分），但评论家换来的是低方差与单步更新——分工是最划算的工程。', en: 'The actor (policy) acts and gets optimised; the critic (value) scores actions to reduce the gradient-estimation variance. One could do without (REINFORCE scores with real returns), but the critic buys low variance and per-step updates — the division of labour is the cheapest engineering.' } },
    { tag: 'Q2 · 补充', q: { zh: '基线 b(S) 为什么"减了白减、不减白不减"？', en: 'Why is the baseline “free to subtract”?' },
      a: { zh: '因为 Σ<sub>a</sub>∇lnπ(a|s) = Σ<sub>a</sub>(onehot − π) = 0：概率对数梯度对动作求和恒为零，所以只依赖状态的 b(S) 乘上去期望恰为零。减去最优基线 v<sub>π</sub>(s) 后梯度变成优势的平均——方差最小。', en: 'Because Σ<sub>a</sub>∇lnπ(a|s) = Σ<sub>a</sub>(onehot − π) = 0: summed over actions the log-gradient vanishes, so any state-only b(S) contributes zero in expectation. Subtracting the optimal baseline v<sub>π</sub>(s) turns the gradient into an average of advantages — minimal variance.' } },
    { tag: 'Q3 · 补充', q: { zh: 'QAC、A2C、off-policy AC、DPG 的进化主线？', en: 'The evolutionary line of QAC → A2C → off-policy AC → DPG?' },
      a: { zh: '每一步都在修上一代的短板：QAC 用 TD 评分替代 MC（修"等回合+高方差"）；A2C 减基线（修"评分噪声大"）；off-policy 版用重要性采样复用旧数据（修"数据必须新鲜"）；DPG 干脆输出确定性动作（修"连续动作空间无法枚举"）。', en: 'Each step fixes the previous generation’s flaw: QAC grades by TD instead of MC (fixes “episode-bound + high variance”); A2C subtracts a baseline (fixes “noisy scores”); the off-policy version reuses old data via importance sampling (fixes “data must be fresh”); DPG outputs deterministic actions outright (fixes “continuous action spaces cannot be enumerated”).' } },
    { tag: 'Q4 · 补充', q: { zh: '全书两条主线在 Actor-Critic 里如何汇合？', en: 'How do the book’s two main threads converge in Actor-Critic?' },
      a: { zh: '<strong>广义策略迭代</strong>：演员的改进步 + 评论家的评估步每一步都在交替——正是 L4 框架的无模型形态。<strong>随机近似</strong>：评论家的 TD 更新、演员的 SGD 更新都是 L6 的增量式。加上 L8 的函数近似，Actor-Critic 是全书所有零件的总装。', en: '<strong>Generalised policy iteration</strong>: the actor’s improvement and the critic’s evaluation alternate every step — L4’s framework in model-free form. <strong>Stochastic approximation</strong>: the critic’s TD update and the actor’s SGD update are both L6’s incremental rules. With L8’s function approximation, Actor-Critic is the final assembly of every part in the book.' } },
    { tag: 'Q5 · 补充', q: { zh: '从这里通往现代算法（PPO/SAC 等）的路标？', en: 'What are the signposts from here to modern algorithms (PPO/SAC, etc.)?' },
      a: { zh: '方差治理：REINFORCE→A2C→GAE（多步优势）；trust region：TRPO/PPO（限制每步更新幅度防崩坏）；off-policy + 确定性：DPG→DDPG→TD3（连续控制）；随机策略正则：SAC（熵正则最大化探索）。另有模型基、多智能体、分布式 RL 等分支——本书的地基都在它们的地基里。', en: 'Variance governance: REINFORCE→A2C→GAE (multi-step advantages); trust regions: TRPO/PPO (bounding each update against collapse); off-policy + deterministic: DPG→DDPG→TD3 (continuous control); stochastic-policy regularisation: SAC (entropy-maximised exploration). Branches extend to model-based, multi-agent, and distributional RL — this book’s foundations underlie all of them.' } },
  ];

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 10,
    label: 'L10 · Actor-Critic 方法',
    items: [
      { id: 'l10-qac', zh: 'QAC：最简 Actor-Critic', en: '§10.1 QAC' },
      { id: 'l10-a2c', zh: 'A2C：优势与基线', en: '§10.2 Advantage actor-critic' },
      { id: 'l10-offpolicy', zh: 'Off-policy 与确定性策略', en: '§10.3–10.4 Off-policy & DPG' },
      { id: 'l10-summary', zh: '本章总结 · 全书收官', en: '§10.5 Summary & finale' },
      { id: 'l10-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l10-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l10-qa', zh: '问答', en: 'Q&A · §10.6' },
    ],
  });
  const l10 = D.otherLectures.find(l => l.no === 10);
  if (l10) l10.done = true;
})();
