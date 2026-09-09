/* ═══════════════════════════════════════════════════════════
   L6 · 随机近似（书 Ch.6）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §6.1 增量均值 ---- */
  S['l6-incremental'] = {
    kicker: 'L6 · §6.1',
    title: { zh: '从批量到增量：一条更新式走天下', en: 'From Batch to Incremental: One Update Rule to Rule Them All' },
    blocks: [
      { t: 'p', zh: '上一课的均值估计是<strong>非增量</strong>的：攒够 n 个样本再一次性求平均——样本大了要等很久。增量的做法：新样本来了，<strong>旧估计往新样本方向挪一小步</strong>。把 x̄ₖ₊₁ 按旧均值 x̄ₖ 展开，整理出一颗闪烁的种子：', en: 'Last lecture\'s mean estimation was <strong>non-incremental</strong>: wait for all n samples, then average — a long wait for big n. The incremental way: as each new sample arrives, <strong>nudge the old estimate a small step toward it</strong>. Expanding x̄ₖ₊₁ around the old mean x̄ₖ crystallises a glittering seed:' },
      { t: 'formula', lbl: '增量均值 → 一般形式 · Incremental mean → general form',
        html: 'w<sub>k+1</sub> = w<sub>k</sub> − <span class="mt">1/k</span> (w<sub>k</sub> − x<sub>k</sub>) &nbsp;&nbsp;⟹&nbsp;&nbsp; w<sub>k+1</sub> = w<sub>k</sub> − <span class="mt">α<sub>k</sub></span>(w<sub>k</sub> − x<sub>k</sub>)' },
      { t: 'p', zh: '读法是全书通用的句式：<strong>新估计 = 旧估计 − 步长 × (旧估计 − 目标)</strong>。α<sub>k</sub> = 1/k 时它精确等于批量平均；α<sub>k</sub> 换成别的正数序列，它就是各种"边来边学"的算法。记住这个句式——第 7 章的 TD 更新式和它长得一模一样，只是"目标"换成了"奖励 + γ×下一状态价值"。', en: 'Read it as the book-wide sentence: <strong>new estimate = old estimate − step × (old estimate − target)</strong>. With α<sub>k</sub> = 1/k it is exactly the batch average; swap in other positive sequences and it becomes a family of learn-as-you-go algorithms. Memorise the pattern — Chapter 7\'s TD update looks identical, with the "target" replaced by "reward + γ × next-state value".' },
      { t: 'widget', component: 'l6-incremental' },
      { t: 'callout', variant: 'key', zh: '<strong>α<sub>k</sub> 不是随便取的</strong>：试验台里的三个档位对应三种命运——1/k 收敛；0.5 恒定步长在真值附近永久抖动（步长太大，噪声擦不掉）；2 直接发散（一步跨过真值到对面更远处）。这些命运由下一节的三条件严格刻画。', en: '<strong>α<sub>k</sub> is not a free choice</strong>: the three presets in the lab correspond to three fates — 1/k converges; a constant 0.5 jitters around the truth forever (the step is too big to wash out noise); 2 diverges outright (each step overshoots farther across). These fates are exactly what the next section\'s three conditions formalise.' },
    ],
  };

  /* ---- §6.2 RM ---- */
  S['l6-rm'] = {
    kicker: 'L6 · §6.2',
    title: { zh: 'Robbins-Monro 算法：解黑盒方程', en: 'The Robbins-Monro Algorithm: Solving Black-Box Equations' },
    blocks: [
      { t: 'p', zh: '想解 g(w) = 0，但 g 是黑盒：表达式未知（比如藏在神经网络里），连导数都没有，只能输入 w、收到一个<strong>带噪声的输出</strong> g̃(w,η) = g(w) + η。RM 算法只有一行：<strong>w<sub>k+1</sub> = w<sub>k</sub> − a<sub>k</sub> g̃(w<sub>k</sub>, η<sub>k</sub>)</strong>。书上的例子 g(w) = w³ − 5（真根 ≈ 1.71），观测噪声是标准正态，a<sub>k</sub> = 1/k——尽管每一步的"梯度读数"都被噪声污染，w<sub>k</sub> 照样滑向真根。', en: 'You want to solve g(w) = 0, but g is a black box: its expression is unknown (say, buried in a neural network), not even its derivative — you feed in w and receive a <strong>noisy reading</strong> g̃(w,η) = g(w) + η. The RM algorithm is one line: <strong>w<sub>k+1</sub> = w<sub>k</sub> − a<sub>k</sub> g̃(w<sub>k</sub>, η<sub>k</sub>)</strong>. The book\'s example g(w) = w³ − 5 (true root ≈ 1.71) with standard-normal noise and a<sub>k</sub> = 1/k — even though every gradient reading is polluted, w<sub>k</sub> still slides to the true root.' },
      { t: 'widget', component: 'l6-rm' },
      { t: 'p', zh: '<strong>为什么有效？</strong>书上先用 g(w) = tanh(w−1)（无噪声）画图讲直觉：w<sub>k</sub > 在真根右边时 g > 0，更新往左挪；在左边时 g < 0，更新往右挪——只要步子不太大，每步都更靠近。<strong>定理 6.1（Robbins-Monro 定理）</strong>给出严格条件：', en: '<strong>Why does it work?</strong> The book first draws the intuition on g(w) = tanh(w−1) with zero noise: right of the root g > 0, so the update moves left; left of it g < 0, so it moves right — provided steps are small, every step gets closer. <strong>Theorem 6.1 (the Robbins-Monro theorem)</strong> makes it strict with three conditions:' },
      { t: 'steps', items: [
        { zh: '<strong>单调条件</strong>：0 < c₁ ≤ ∇g(w) ≤ c₂——g 严格递增且斜率有界，保证根<strong>存在且唯一</strong>（若 g 是目标函数的梯度，这相当于要求凸性）。', en: '<strong>Monotonicity</strong>: 0 < c₁ ≤ ∇g(w) ≤ c₂ — g strictly increasing with bounded slope, guaranteeing the root <strong>exists and is unique</strong> (if g is an objective\'s gradient, this is convexity).' },
        { zh: '<strong>步长条件</strong>：Σa<sub>k</sub> = ∞（步子加起来要走得足够远——否则到不了根）且 Σa<sub>k</sub>² < ∞（步子平方和要有限——否则噪声永远抖不平）。1/k 两条件全满足；常数步长违反第二条。', en: '<strong>Step-size conditions</strong>: Σa<sub>k</sub> = ∞ (the total distance must suffice to reach the root) yet Σa<sub>k</sub>² < ∞ (otherwise noise never settles). 1/k satisfies both; a constant step violates the second.' },
        { zh: '<strong>噪声条件</strong>：E[η<sub>k</sub>|H<sub>k</sub>] = 0 且方差有界——噪声零均值即可，不必是高斯。三条全占，w<sub>k</sub> <strong>几乎必然</strong>收敛到真根。', en: '<strong>Noise conditions</strong>: E[η<sub>k</sub>|H<sub>k</sub>] = 0 with bounded variance — zero mean suffices; Gaussian is not required. With all three, w<sub>k</sub> converges <strong>almost surely</strong> to the true root.' },
      ]},
      { t: 'p', zh: '<strong>定理 6.2（Dvoretzky 定理）</strong>是它的升级版：允许步长 a<sub>k</sub> 和噪声偏置 β<sub>k</sub> 是随机的（依赖历史 H<sub>k</sub>），条件改为 Σα<sub>k</sub> = ∞、Σα<sub>k</sub>² < ∞、Σβ<sub>k</sub>² < ∞（一致几乎 surely）加噪声零均值有界方差。它是最优值收敛证明（第 7 章 Q-learning）实际引用的工具。', en: '<strong>Theorem 6.2 (Dvoretzky\'s theorem)</strong> is the upgrade: the step sizes a<sub>k</sub> and a noise term β<sub>k</sub> may be random (history-dependent), with conditions Σα<sub>k</sub> = ∞, Σα<sub>k</sub>² < ∞, Σβ<sub>k</sub>² < ∞ (uniformly almost surely) plus zero-mean bounded-variance noise. It is the tool actually cited in the optimal-value convergence proofs (Q-learning, Chapter 7).' },
    ],
  };

  /* ---- §6.4 SGD ---- */
  S['l6-sgd'] = {
    kicker: 'L6 · §6.4',
    title: { zh: 'SGD：RM 的成名弟子', en: 'SGD: The Famous Disciple of RM' },
    blocks: [
      { t: 'p', zh: '优化问题 min J(w) = E[f(w, X)]：目标含期望，分布未知，批量采样又太贵。<strong>随机梯度下降</strong>只拿一个样本就更新：<strong>w<sub>k+1</sub> = w<sub>k</sub> − α<sub>k</sub>∇<sub>w</sub>f(w<sub>k</sub>, x<sub>k</sub>)</strong>——把真梯度 E[∇f] 换成单样本的随机梯度。书上证明它是 RM 的特例：取 g(w) = ∇J(w)，则随机梯度 = 真梯度 + 零均值噪声 η<sub>k</sub>，三条件齐活，收敛到手。而增量均值又是 SGD 的特例（f = ½(w − x)² 时随机梯度恰为 w − x）。<strong>三代同堂：RM → SGD → 增量均值。</strong>', en: 'Optimise min J(w) = E[f(w, X)]: the objective contains an expectation, the distribution is unknown, batch sampling is dear. <strong>Stochastic gradient descent</strong> updates on a single sample: <strong>w<sub>k+1</sub> = w<sub>k</sub> − α<sub>k</sub>∇<sub>w</sub>f(w<sub>k</sub>, x<sub>k</sub>)</strong> — the true gradient E[∇f] replaced by a one-sample stochastic gradient. The book proves it is a special RM: set g(w) = ∇J(w) and the stochastic gradient equals the true gradient plus zero-mean noise η<sub>k</sub> — the three conditions hold, convergence follows. And the incremental mean is a special SGD (with f = ½(w − x)² the stochastic gradient is exactly w − x). <strong>Three generations: RM → SGD → incremental mean.</strong>' },
      { t: 'widget', component: 'l6-sgd' },
      { t: 'p', zh: '书上 Figure 6.5 的现象值得单独记住：<strong>SGD 的收敛曲线是"远快近晃"</strong>——离最优远时随机性相对可忽略、下降飞快；靠近后随机性主导，曲线在解附近永久小幅晃动。批量版 MBGD（每次 m 个样本）在中间：比 SGD 稳、比 GD 灵活。神经网络训练里"学习率衰减"的本质，就是把 a<sub>k</sub> 从常数缓慢调成 1/k 的形状。', en: 'A phenomenon from the book\'s Figure 6.5 worth memorising: SGD converges “fast when far, wobbly when near” — far from the optimum the randomness is relatively negligible and descent is rapid; close to it, randomness dominates and the curve jitters around the solution forever. Mini-batch MBGD (m samples per update) sits between: steadier than SGD, nimbler than GD. The essence of “learning-rate decay” in neural-network training is morphing a<sub>k</sub> from a constant toward the 1/k shape.' },
    ],
  };

  /* ---- §6.5 总结 ---- */
  S['l6-summary'] = {
    kicker: 'L6 · §6.5',
    title: { zh: '本章总结：给 TD 交的基础学费', en: 'Chapter Summary: The Foundation Fee for TD' },
    blocks: [
      { t: 'p', zh: '本章没讲任何新的强化学习算法，却交齐了后面所有学费：<strong>增量均值</strong>（第一条随机迭代式）、<strong>RM 算法</strong>（黑盒求根 + 三条件收敛）、<strong>Dvoretzky 定理</strong>（随机步长版，Q-learning 收敛证明引用的工具）、<strong>SGD/MBGD</strong>（机器学习的日常主食，RM 的特例）。一句话：随机近似 = 用带噪声的增量更新逼近目标，γ< 1 之外的第二台"收敛发动机"在这里点火。', en: 'No new RL algorithms this chapter — but every future fee is paid: the <strong>incremental mean</strong> (our first stochastic iteration), the <strong>RM algorithm</strong> (black-box root-finding + three-condition convergence), <strong>Dvoretzky\'s theorem</strong> (the random-step-size version cited by Q-learning\'s proof), and <strong>SGD/MBGD</strong> (machine learning\'s daily bread, special cases of RM). In one line: stochastic approximation = noisy incremental updates approaching a target — the second “convergence engine”, ignited here beside γ < 1.' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：把增量均值更新式 w<sub>k+1</sub> = w<sub>k</sub> − α<sub>k</sub>(w<sub>k</sub> − x<sub>k</sub>) 里的 x<sub>k</sub> 换成"r + γv(s′)"——这就是<strong>TD(0)</strong>。名字换了，骨子里是 RM。第 7 章还打包赠送 Sarsa 和 Q-learning 两位大人物。', en: 'Next lecture teaser: in the incremental-mean update w<sub>k+1</sub> = w<sub>k</sub> − α<sub>k</sub>(w<sub>k</sub> − x<sub>k</sub>), replace x<sub>k</sub> by “r + γv(s′)” — that is <strong>TD(0)</strong>. New name, RM bones. Chapter 7 also introduces two celebrities: Sarsa and Q-learning.' },
    ],
  };

  /* ---- L6 长推理 ---- */
  S['l6-reasoning'] = {
    kicker: 'L6 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：一条更新式的家族史', en: 'The Long Coherent Reasoning: The Family Tree of One Update Rule' },
    blocks: [
      { t: 'p', zh: '本章推理链：批量均值慢 → 展开成增量式 → 步长抽象成 α<sub>k</sub> → 解黑盒方程的 RM → 收敛三条件 → Dvoretzky 放宽到随机步长 → SGD 是 RM 特例、增量均值是 SGD 特例 → 下一课 TD 坐享其成。', en: 'This chapter\'s spine: batch means are slow → unfold into the incremental form → abstract the step to α<sub>k</sub> → RM for black-box equations → three convergence conditions → Dvoretzky relaxes to random steps → SGD is special RM and incremental mean is special SGD → TD will cash it all in next lecture.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l6' } },
    ],
  };

  /* ---- L6 代码 ---- */
  S['l6-code'] = {
    kicker: 'L6 · 动手 · Hands-on',
    title: { zh: '代码精讲：RM 与增量均值，各十行', en: 'Code Walkthrough: RM and the Incremental Mean, Ten Lines Each' },
    blocks: [
      { t: 'p', zh: '这节课的代码短到不像话，但每一行都对应定理的一个条件。特别注意步长 schedules 的写法——Σa<sub>k</sub> = ∞ 而 Σa<sub>k</sub>² < ∞ 的族谱（1/k、1/kᵖ (p∈(0.5,1])）与常数步长的本质区别全在这里。', en: 'This lecture\'s code is absurdly short, yet every line maps to a theorem condition. Watch how the step-size schedules are written — the family satisfying Σa<sub>k</sub> = ∞ while Σa<sub>k</sub>² < ∞ (1/k, 1/kᵖ with p ∈ (0.5,1]) versus constant steps is the whole story.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l6' } },
    ],
  };

  /* ---- L6 Q&A ---- */
  S['l6-qa'] = {
    kicker: 'L6 · §6.6',
    title: { zh: '问答：随机近似六连问', en: 'Q&A: Six Questions on Stochastic Approximation' },
    blocks: [
      { t: 'p', zh: '书上的问答直击"为什么要学这一章"——答案都指向第 7 章。', en: 'The book\'s Q&As hit “why study this chapter” — every answer points to Chapter 7.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l6' } },
    ],
  };

  /* ═══ L6 长推理链 ═══ */
  D.reasoningSets['l6'] = [
    { link: '起点 · Start',
      title: { zh: '攒一批再算，太慢了', en: 'Batch first, compute later — too slow' },
      zh: 'MC 式均值估计要攒够一批样本再除以 n。流式数据（机器人每秒都在动）等不起。能不能来一个样本更新一次？',
      en: 'MC-style estimation waits for a batch, then divides by n. Streaming data (a robot moving every second) cannot wait. Can we update on every single sample?',
      question: '旧估计和新样本之间是什么代数关系？' },
    { link: '展开 · Unfold',
      title: { zh: '批量平均展开成增量式', en: 'Unfold the batch average into an increment' },
      zh: 'x̄_{k+1} = (1/k)((k−1)x̄_k + x_k) 整理得 w_{k+1} = w_k − (1/k)(w_k − x_k)：新估计 = 旧估计 − 步长×(旧估计−样本)。“目标 − 当前”这个差是全部动力。',
      en: 'x̄_{k+1} = (1/k)((k−1)x̄_k + x_k) rearranges to w_{k+1} = w_k − (1/k)(w_k − x_k): new = old − step×(old − sample). The gap “target − current” is the entire engine.',
      question: '步长 1/k 能换成别的吗？换了还收敛吗？' },
    { link: '抽象 · Abstract',
      title: { zh: 'α_k 上位：一般随机迭代', en: 'Promote α_k: the general stochastic iteration' },
      zh: 'w_{k+1} = w_k − α_k(w_k − x_k)。α_k = 1/k 是“精确平均”；别的正序列是“带遗忘的学习”。这是全书第一条通用更新式——它的每个部件（步长、目标、旧估计）都将在 TD 里换名字。',
      en: 'w_{k+1} = w_k − α_k(w_k − x_k). α_k = 1/k is exact averaging; other positive sequences are “learning with forgetting”. This is the book’s first universal update — every part (step, target, old estimate) will be renamed inside TD.',
      question: '这条式子最远能推广到什么问题？' },
    { link: '黑盒 · Black box',
      title: { zh: 'RM 算法：只有输入输出也能解方程', en: 'RM: solving equations with input-output only' },
      zh: '解 g(w) = 0，g 表达式未知、只能拿到带噪声读数 g̃ = g + η。更新 w_{k+1} = w_k − a_k g̃：读数为正就往左、为负就往右，噪声靠期望归零。黑盒、无导数、甚至噪声非高斯都可以。',
      en: 'Solve g(w) = 0 where g is unknown and only noisy readings g̃ = g + η are available. Update w_{k+1} = w_k − a_k g̃: positive reading moves left, negative moves right; noise vanishes in expectation. Black box, no derivative, not even Gaussian noise required.',
      question: '凭什么保证它收敛而不是被噪声带偏？' },
    { link: '三条件 · Three conditions',
      title: { zh: '定理 6.1：单调 + 步长 + 噪声', en: 'Theorem 6.1: monotone + step sizes + noise' },
      zh: '① 0 < c₁ ≤ ∇g ≤ c₂：根存在唯一；② Σa_k = ∞ 且 Σa_k² < ∞：走得到、又抖得停（1/k 满足，常数步长违反后者）；③ 噪声零均值方差有界。三条全占 ⟹ 几乎必然收敛。Dvoretzky 定理再把步长放宽成随机变量——正是 Q-learning 里 α 取决于访问次数的情形。',
      en: '① 0 < c₁ ≤ ∇g ≤ c₂: the root exists and is unique; ② Σa_k = ∞ with Σa_k² < ∞: you get there, and the wobble settles (1/k qualifies; constant steps fail the second); ③ zero-mean bounded-variance noise. All three ⟹ almost-sure convergence. Dvoretzky’s theorem further allows random step sizes — exactly Q-learning’s α depending on visit counts.',
      question: '机器学习里的 SGD 也是它吗？' },
    { link: '认亲 · Family',
      title: { zh: 'SGD 是 RM 的特例，增量均值是 SGD 的特例', en: 'SGD is special RM; incremental mean is special SGD' },
      zh: '取 g(w) = ∇J(w)，随机梯度 = 真梯度 + 零均值噪声——SGD 落入 RM 框架，三条件恰好成立；再取 f = ½(w−x)²，随机梯度退化为 w−x——SGD 又退化为增量均值。三代同堂，一脉相承：TD 用的还是这条式子，只是目标换成 r + γv(s′)。',
      en: 'Set g(w) = ∇J(w): the stochastic gradient is the true gradient plus zero-mean noise — SGD falls into the RM frame with all conditions holding; then set f = ½(w−x)² and the stochastic gradient degenerates to w−x — SGD becomes the incremental mean. Three generations, one bloodline: TD will reuse the very same rule with target r + γv(s′).',
      question: null },
  ];

  /* ═══ L6 代码块 ═══ */
  const srcRM = `import numpy as np

def rm_rootfinding(g_noisy, w1=0.0, schedule=lambda k: 1.0 / k, n=500):
    """Robbins-Monro (Eq. 6.5):  w_{k+1} = w_k - a_k * g_tilde(w_k, eta_k).
    g_noisy(w) returns the NOISY reading g(w) + eta. No expressions needed."""
    w = w1
    trace = [w]
    for k in range(1, n + 1):
        a_k = schedule(k)
        w = w - a_k * g_noisy(w)           # the entire algorithm is this line
        trace.append(w)
    return w, trace

def make_schedules():
    """Step-size families vs. the two summability conditions:
       sum a_k = oo (must travel far), sum a_k^2 < oo (noise must settle)."""
    return {
        "1/k      (both hold -> converges)":   lambda k: 1.0 / k,
        "1/k^0.75 (both hold -> converges)":   lambda k: 1.0 / k ** 0.75,
        "0.5      (sum^2 = oo -> jitters)":    lambda k: 0.5,
        "2.0      (overshoots -> diverges)":   lambda k: 2.0,
    }

if __name__ == "__main__":
    true_root = 5 ** (1 / 3)                       # ~ 1.71 for g(w) = w^3 - 5
    rng = np.random.default_rng(0)
    g_noisy = lambda w: (w ** 3 - 5) + rng.normal()  # black box + N(0,1) noise
    for name, sch in make_schedules().items():
        w, _ = rm_rootfinding(g_noisy, schedule=sch, n=2000)
        print(f"{name:38s} -> w = {w:8.3f}")
    print("true root:", round(true_root, 3))`;

  const srcInc = `def incremental_mean(samples):
    """Eq. 6.2 -- and a special case of SGD with f(w,x) = 0.5*(w-x)**2:
       w_{k+1} = w_k - (1/k)*(w_k - x_k)
    O(1) memory: no need to store the samples at all."""
    w = 0.0
    for k, x in enumerate(samples, start=1):
        w = w - (1.0 / k) * (w - x)     # same as w += (x - w)/k
    return w

def sgd_mean(samples, alpha=0.1, w0=0.0):
    """The same problem via SGD (Eq. 6.13) with a CONSTANT step:
       w_{k+1} = w_k - alpha*(w_k - x_k)
    Constant alpha -> converges to a NEIGHBORHOOD, then jitters forever."""
    w = w0
    for x in samples:
        w = w - alpha * (w - x)
    return w`;

  D.codeFileSets['l6'] = [
    {
      id: 'l6-rm-code', file: 'robbins_monro.py — 黑盒求根', tab: '① RM 算法',
      intro: { zh: 'RM 的实现短得像玩笑：算法本体一行。真正值得读的是 <code class="inline">make_schedules</code>——四个步长家族是定理 6.1 条件②的活标本：前两个收敛、常数步长抖动、2.0 发散。跑一遍 main，输出就是条件②的实验证明。', en: 'The RM implementation is a joke it is so short — the algorithm is one line. The real reading is <code class="inline">make_schedules</code>: the four step-size families are living specimens of Theorem 6.1\'s condition (b) — the first two converge, constant steps jitter, 2.0 diverges. Run main once: the output is condition (b)\'s experimental proof.' },
      code: srcRM,
      notes: [
        { lines: [7, 8], tag: 'one line ★', zh: '<strong>算法全部内容</strong>：<code class="inline">w - a_k * g_noisy(w)</code>。注意 g_noisy 是黑盒调用——实现里没有 g 的表达式、没有导数、连噪声分布都不关心（只要零均值）。这正是"随机近似不需要表达式"的字面意思。', en: '<strong>The entire algorithm</strong>: <code class="inline">w - a_k * g_noisy(w)</code>. Note g_noisy is a black-box call — no expression for g, no derivative, not even the noise distribution matters (zero mean suffices). This is “stochastic approximation needs no expression”, taken literally.' },
        { lines: [13, 19], tag: 'schedules', zh: '四个步长家族对应定理条件②的四种命运。面试级细节：p ∈ (0.5, 1] 的 1/k^p 都满足两条件——p > 0.5 保证平方可和。常数步长 Σa² = ∞ 永不安静；大常数直接发散。', en: 'Four step-size families map to four fates under condition (b). Interview-grade detail: 1/k^p for p ∈ (0.5, 1] satisfies both summability conditions — p > 0.5 makes the squares sum finite. Constant steps have Σa² = ∞ and never settle; large constants diverge outright.' },
        { lines: [26, 30], tag: 'main', zh: '噪声用 <code class="inline">rng.normal()</code> 每次重新抽——每次观测都不同，但估计照样收敛：这就是"几乎必然收敛"的日常版本。把 n 从 2000 调到 200，你会看到 1/k 的估计还没走到根——Σa_k = ∞ 需要"足够远的总路程"。', en: 'The noise <code class="inline">rng.normal()</code> is redrawn per observation — every reading differs, yet the estimate still converges: “almost sure convergence” in daily dress. Drop n from 2000 to 200 and the 1/k estimate has not yet arrived — Σa_k = ∞ demands “enough total distance”.' },
      ],
    },
    {
      id: 'l6-inc-code', file: 'incremental_mean.py — 增量均值与 SGD', tab: '② 增量均值 = 特例',
      intro: { zh: '两个函数解同一个问题（估均值），差别只在步长：<code class="inline">1/k</code> 对 <code class="inline">常数 α</code>。这是书 Figure 6.5 的 1D 版本：常数步长先快速逼近、再在邻域内永久抖动。第 7 章的 TD 学习率也是这两种选择的博弈。', en: 'Two functions, one problem (estimate a mean), differing only in the step: <code class="inline">1/k</code> vs. a <code class="inline">constant α</code>. This is the 1-D version of the book\'s Figure 6.5: constant steps approach fast, then jitter in a neighbourhood forever. Chapter 7\'s TD learning rates play this exact game.' },
      code: srcInc,
      notes: [
        { lines: [7, 7], tag: 'incremental ★', zh: '<code class="inline">w -= (1/k)*(w - x)</code> 与 <code class="inline">w += (x - w)/k</code> 数学相同，写法不同：后者读作"往新样本挪动 1/k 的距离"——强化学习代码里更常见的是这种写法（TD 误差 × 学习率）。', en: '<code class="inline">w -= (1/k)*(w - x)</code> equals <code class="inline">w += (x - w)/k</code> mathematically but reads differently: “move toward the new sample by a 1/k fraction” — the form RL code prefers (TD error × learning rate).' },
        { lines: [4, 5], tag: 'O(1) memory', zh: '增量式的隐藏福利：<strong>内存 O(1)</strong>。批量法要存全部样本，增量法处理完即扔——流式场景（机器人持续运行）的唯一选择。这是"非增量 → 增量"除了速度外的第二个动机。', en: 'The hidden bonus of the incremental form: <strong>O(1) memory</strong>. Batch methods store every sample; incremental methods discard as they go — the only option for streaming settings (a robot running for days). A second motive beyond speed for “non-incremental → incremental”.' },
        { lines: [17, 19], tag: 'constant α', zh: '常数 α 的结局由 RM 理论精确预言：Σα² = ∞ ⟹ 方差项不消失 ⟹ 永久抖动。抖动幅度 ∝ α²·var[X]——把 α 减半，抖动变四分之一。这正是学习率衰减 schedules（step decay、cosine…）的理论根源。', en: 'A constant α\'s fate is precisely predicted by RM theory: Σα² = ∞ means the variance term never vanishes — perpetual jitter, amplitude ∝ α²·var[X]. Halve α and the wobble quarters. This is the theoretical root of learning-rate decay schedules (step decay, cosine, …).' },
      ],
    },
  ];

  /* ═══ L6 Q&A ═══ */
  D.qaSets['l6'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '什么是随机近似？', en: 'What is stochastic approximation?' },
      a: { zh: '一大类<strong>随机的迭代算法</strong>，用于求解求根或优化问题——每步更新都带着噪声，但只要步长和噪声满足条件，迭代仍然收敛到目标。', en: 'A broad class of <strong>stochastic iterative algorithms</strong> for root-finding or optimisation — every update carries noise, yet under step-size and noise conditions the iteration still converges to the target.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '为什么要研究随机近似？', en: 'Why study stochastic approximation?' },
      a: { zh: '因为第 7 章的时序差分算法<strong>就是</strong>随机近似算法。先学本章，第 7 章看到 TD 更新式时就不会感到突兀——它的收敛证明直接引用本章的定理。', en: 'Because the temporal-difference algorithms of Chapter 7 <strong>are</strong> stochastic approximation algorithms. Learning this chapter first means the TD update will not appear out of nowhere — its convergence proof cites this chapter\'s theorems.' } },
    { tag: 'Q3 · 书上原问', q: { zh: '为什么本章反复讨论均值估计？', en: 'Why does this chapter keep returning to mean estimation?' },
      a: { zh: '因为状态值和动作值都定义为随机变量的均值，而 TD 算法的形态与均值估计的随机近似算法几乎一模一样——它们是同一个式子的不同马甲。', en: 'Because state and action values are defined as means of random variables, and the TD algorithms look almost identical to the stochastic-approximation form of mean estimation — different costumes, same equation.' } },
    { tag: 'Q4 · 书上原问', q: { zh: 'RM 算法比其他求根算法好在哪？', en: 'What is the advantage of RM over other root-finding methods?' },
      a: { zh: '它<strong>不需要目标函数的表达式或导数</strong>——纯黑盒：只要能输入 w、拿到（带噪声的）输出就能迭代。著名 SGD 算法就是 RM 的特殊形式。', en: 'It <strong>needs neither the expression of the objective nor its derivative</strong> — a pure black box: feed in w, read the (noisy) output, iterate. The famous SGD is a special form of RM.' } },
    { tag: 'Q5 · 书上原问', q: { zh: 'SGD 能收敛得很快吗？', en: 'Can SGD converge quickly?' },
      a: { zh: 'SGD 有个有趣的收敛模式：<strong>远快近晃</strong>——估计离最优远时下降飞快（随机性相对可忽略）；靠近后随机性主导，在解附近永久小幅晃动。常数步长下晃动不会消失，衰减步长才能安静下来。', en: 'SGD shows a curious pattern: <strong>fast when far, wobbly when near</strong> — far from the optimum the randomness is negligible and descent is rapid; near it, randomness dominates and the estimate jitters around the solution forever. Constant steps never settle; decaying steps do.' } },
    { tag: 'Q6 · 书上原问', q: { zh: 'MBGD 是什么？比 SGD 和 BGD 好在哪？', en: 'What is MBGD and how does it compare with SGD and BGD?' },
      a: { zh: 'MBGD（小批量）是 SGD 与 BGD（全批量）的中间版本：比 SGD 用更多样本所以更稳（随机性小），比 BGD 不必用全部样本所以更灵活。图 6.5 显示 m 越大路径越平滑、越靠近解。', en: 'MBGD (mini-batch) is the middle ground between SGD and full-batch BGD: more samples than SGD makes it steadier (less randomness), fewer than BGD keeps it flexible. Figure 6.5 shows larger m yields smoother paths ending closer to the solution.' } },
  ];

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 6,
    label: 'L6 · 随机近似',
    items: [
      { id: 'l6-incremental', zh: '增量均值与 α_k', en: '§6.1 Incremental means' },
      { id: 'l6-rm', zh: 'Robbins-Monro 算法', en: '§6.2 The RM algorithm' },
      { id: 'l6-sgd', zh: 'SGD 与 MBGD', en: '§6.4 SGD & MBGD' },
      { id: 'l6-summary', zh: '本章总结', en: '§6.5 Summary' },
      { id: 'l6-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l6-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l6-qa', zh: '问答', en: 'Q&A · §6.6' },
    ],
  });
  const l6 = D.otherLectures.find(l => l.no === 6);
  if (l6) l6.done = true;
})();
