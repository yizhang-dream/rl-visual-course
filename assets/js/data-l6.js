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
        tex: String.raw`w_{k+1} = w_k - \frac{1}{k}\,(w_k - x_k) \;\Longrightarrow\; w_{k+1} = w_k - \alpha_k\,(w_k - x_k)` },
      { t: 'p', zh: '读法是全书通用的句式：<strong>新估计 = 旧估计 − 步长 × (旧估计 − 目标)</strong>。α<sub>k</sub> = 1/k 时它精确等于批量平均；α<sub>k</sub> 换成别的正数序列，它就是各种"边来边学"的算法。记住这个句式——第 7 章的 TD 更新式和它长得一模一样，只是"目标"换成了"奖励 + γ×下一状态价值"。', en: 'Read it as the book-wide sentence: <strong>new estimate = old estimate − step × (old estimate − target)</strong>. With α<sub>k</sub> = 1/k it is exactly the batch average; swap in other positive sequences and it becomes a family of learn-as-you-go algorithms. Memorise the pattern — Chapter 7\'s TD update looks identical, with the "target" replaced by "reward + γ × next-state value".' },
      { t: 'p', zh: '<strong>α<sub>k</sub> = 1/k 不是拍脑袋——它精确卡在两条级数条件的中线上。</strong>调和级数 Σ 1/k = ∞（发散：加得够远）；平方级数 Σ 1/k² = π²/6 &lt; ∞（收敛：抖得够停）。一个步长序列要同时做到"总和无穷、平方和有限"，1/k 是最自然的候选。此刻这只是两条有趣的数学事实；到 §6.2 它们会升格为收敛定理的步长条件——届时你会认出：<strong>增量均值会收敛，正是 Robbins–Monro 条件在 1/t 情形下的特例</strong>。', en: '<strong>α<sub>k</sub> = 1/k is not a guess — it sits precisely on the midline of two series conditions.</strong> The harmonic series Σ 1/k = ∞ (diverges: travels far enough); the squared series Σ 1/k² = π²/6 &lt; ∞ (converges: settles down enough). For a step sequence to achieve "infinite total, finite squared sum" at once, 1/k is the most natural candidate. For now these are two pleasant facts of mathematics; in §6.2 they are promoted to the step-size conditions of a convergence theorem — and you will recognise that <strong>the incremental mean converges exactly as the Robbins–Monro conditions specialise to 1/t</strong>.' },
      { t: 'widget', component: 'l6-incremental' },
      { t: 'callout', variant: 'key', zh: '<strong>α<sub>k</sub> 不是随便取的</strong>：试验台里的三个档位对应三种命运——1/k 收敛；0.5 恒定步长在真值附近永久抖动（步长太大，噪声擦不掉）；2 直接发散（一步跨过真值到对面更远处）。这些命运由下一节的三条件严格刻画。', en: '<strong>α<sub>k</sub> is not a free choice</strong>: the three presets in the lab correspond to three fates — 1/k converges; a constant 0.5 jitters around the truth forever (the step is too big to wash out noise); 2 diverges outright (each step overshoots farther across). These fates are exactly what the next section\'s three conditions formalise.' },
      { t: 'formula', lbl: '常数步长 = 指数加权平均 · A constant step means exponential weights',
        tex: String.raw`w_{k+1} = w_k + \alpha(x_k - w_k) \;\Longrightarrow\; w_k = (1-\alpha)^{k-1}x_1 + \sum_{j\le k} \htmlClass{fx-accent}{\alpha(1-\alpha)^{k-j}}\,x_j`,
        note: '（旧样本的权重几何递减——指数遗忘）' },
      { t: 'p', zh: '<strong>两种步长 = 两种记忆。</strong>把更新式展开成"样本的加权和"立刻看清：α = 1/t 给每个样本<strong>等权重</strong>——真正的平均，适合平稳世界；常数 α 给旧样本<strong>指数遗忘</strong>的权重——新样本占 α、全部历史挤在 1−α 里。遗忘是好是坏取决于世界：目标在漂移（机器人磨损、用户口味变化、对手在适应），你<strong>需要</strong>遗忘旧数据，小常数步长反而是正确选择；目标固定不动，遗忘只会让估计永远在真值附近抖（幅度 ∝ α）。<strong>收敛与跟踪是一对此生不可兼得的目标</strong>——第 7 章 TD 实践中用小常数学习率，正是押注"世界可能非平稳"。', en: '<strong>Two step sizes = two kinds of memory.</strong> Unrolling the update into a weighted sum of samples makes it obvious: α = 1/t grants every sample <strong>equal weight</strong> — a true average, fit for a stationary world; a constant α weights old samples with <strong>exponential forgetting</strong> — the new sample takes α, all of history squeezes into 1−α. Whether forgetting is a bug depends on the world: if the target drifts (a robot wearing out, user tastes shifting, an opponent adapting), you <strong>need</strong> to forget, and a small constant step is the right choice; if the target is fixed, forgetting only keeps the estimate jittering around the truth forever (amplitude ∝ α). <strong>Convergence and tracking are a pair you cannot have at once</strong> — Chapter 7’s TD uses a small constant learning rate in practice, precisely betting that "the world may be nonstationary".' },
      { t: 'callout', variant: 'warn', zh: '<strong>两个误区。</strong>① <strong>步长设成常数还指望收敛</strong>：常数 α 违反 Σα² &lt; ∞（α²·∞ = ∞），噪声的方差贡献永远不消失，估计在真值附近永久抖动——这不是数值不稳，是理论判了刑。② <strong>把 α = 1/k 与小常数 α 的效果混为一谈</strong>：前者渐近收敛到真值，但前期步子大、后期几乎不再更新，对新信息反应迟钝；后者永远跟得上新信息，但永不精确。选哪个不是精度问题，是"你认为世界平不平稳"的立场问题。', en: '<strong>Two misconceptions.</strong> ① <strong>Setting a constant step and still expecting convergence</strong>: a constant α violates Σα² &lt; ∞ (α²·∞ = ∞), the noise variance contribution never dies, and the estimate jitters around the truth forever — not numerical instability but a theoretical sentence. ② <strong>Confusing the effects of α = 1/k and a small constant α</strong>: the former converges asymptotically to the truth but takes huge early steps and barely updates late — sluggish to new information; the latter always tracks new information but is never exact. The choice is not about accuracy — it is a stance on whether you believe the world is stationary.' },
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
      { t: 'p', zh: '<strong>两个步长条件各自挡住哪种死法？</strong>Σa<sub>k</sub> = ∞ 挡的是"走不到"：若步长总和有限（比如 a<sub>k</sub> = 1/k²），总位移有硬上限——初始点离根足够远时，再多的迭代也够不着。Σa<sub>k</sub>² &lt; ∞ 挡的是"停不下"：每步噪声贡献 a<sub>k</sub>η<sub>k</sub>，独立噪声的方差直接相加，累计方差 ∝ σ²Σa<sub>k</sub>²——平方和发散，抖动永不平息。1/k 恰好两头都占：调和级数发散（走得够远），平方和收敛（抖得够停）。合起来的直觉只有一句话：<strong>步长要大到能走遍任何距离，又要小到能抹平任何噪声</strong>——走钢丝般的平衡。', en: '<strong>Which failure does each step-size condition prevent?</strong> Σa<sub>k</sub> = ∞ prevents "never arriving": if the total step is finite (say a<sub>k</sub> = 1/k²), the total displacement has a hard cap — start far enough from the root and no number of iterations suffices. Σa<sub>k</sub>² &lt; ∞ prevents "never settling": each step’s noise contributes a<sub>k</sub>η<sub>k</sub>, independent noises add variances directly, and the accumulated variance ∝ σ²Σa<sub>k</sub>² — with a divergent squared sum, the wobble never calms. 1/k threads both needles: the harmonic series diverges (far enough) while its square sums (still enough). The joint intuition fits in one sentence: <strong>steps must be large enough to cover any distance, yet small enough to erase any noise</strong> — a tightrope balance.' },
      { t: 'formula', lbl: '噪声的方差累积 · How noise accumulates',
        tex: String.raw`w_k - w^*\,\text{的方差} \approx \sigma^2 \sum_k a_k^2`,
        note: 'Σa<sub>k</sub>² &lt; ∞ ⟹ 抖动消失 &nbsp;·&nbsp; Σa<sub>k</sub> = ∞ ⟹ 任何初始距离都走得完' },
      { t: 'p', zh: '<strong>收敛率：随机噪声让收敛慢一阶。</strong>把确定性迭代和随机迭代放在同一把尺上：求根/梯度类的确定性迭代，误差通常以 O(1/t) 衰减；RM、SGD 这类随机迭代，误差典型只有 O(1/√t)。直觉可以数出来：取 a<sub>k</sub> = 1/k，信号部分（初始偏差）每轮按步长折减，累计约 O(1/t)；噪声部分按"平方和的平方根"累积——√(Σ1/k²) ≈ 1/√t——噪声项反而成了瓶颈。所以带噪声的更新不是免费的：同样预算下，精度差一个 √t 的因子。它也解释了神经网络训练里常见的"精度墙"：那是方差砌的墙，多算一步只便宜 1/√t。', en: '<strong>Convergence rate: noise costs an order.</strong> Put deterministic and stochastic iterations on the same ruler: deterministic root-finding or gradient iterations typically decay at O(1/t); RM- and SGD-style stochastic iterations typically achieve only O(1/√t). The intuition is countable: with a<sub>k</sub> = 1/k, the signal part (the initial bias) is scaled down by the step each round, accumulating to roughly O(1/t); the noise part accumulates as the square root of the squared sum — √(Σ1/k²) ≈ 1/√t — and the noise term becomes the bottleneck. Noisy updates are not free: at equal budget, accuracy is worse by a factor of √t. It also explains the familiar "accuracy wall" in neural-network training: a wall built of variance, where each extra step buys only 1/√t.' },
      { t: 'formula', lbl: '速率对比 · The rate comparison',
        tex: String.raw`\mathbb{E}|w_t - w^*| \lesssim \htmlClass{fx-green}{C_1/t}\text{（信号/偏置）} + \htmlClass{fx-red}{C_2/\sqrt{t}}\text{（噪声）} \;\Longrightarrow\; \text{随机}：O(1/\sqrt{t})\ \text{vs.}\ \text{确定性}：O(1/t)` },
      { t: 'p', zh: '<strong>定理 6.2（Dvoretzky 定理）</strong>是它的升级版：允许步长 a<sub>k</sub> 和噪声偏置 β<sub>k</sub> 是随机的（依赖历史 H<sub>k</sub>），条件改为 Σα<sub>k</sub> = ∞、Σα<sub>k</sub>² < ∞、Σβ<sub>k</sub>² < ∞（一致几乎 surely）加噪声零均值有界方差。它是最优值收敛证明（第 7 章 Q-learning）实际引用的工具。', en: '<strong>Theorem 6.2 (Dvoretzky\'s theorem)</strong> is the upgrade: the step sizes a<sub>k</sub> and a noise term β<sub>k</sub> may be random (history-dependent), with conditions Σα<sub>k</sub> = ∞, Σα<sub>k</sub>² < ∞, Σβ<sub>k</sub>² < ∞ (uniformly almost surely) plus zero-mean bounded-variance noise. It is the tool actually cited in the optimal-value convergence proofs (Q-learning, Chapter 7).' },
      { t: 'p', zh: '<strong>RM 是全书下半场的通用底座。</strong>回头看会发现：本章之后出现的每一个核心算法，骨架都是 w ← w + α(目标 − w)，区别只在"估计什么、目标是什么、步长怎么排"。趁热把这张族谱记牢——第 7 章每次抛出新算法时，先在心里对号入座，学习负担会小一半。', en: '<strong>RM is the universal chassis of the book’s second half.</strong> In hindsight, every core algorithm from here on shares the skeleton w ← w + α(target − w), differing only in "what is estimated, what the target is, how the step is scheduled". Memorise this family tree while it is warm — each time Chapter 7 unveils a new algorithm, seat it here first and the learning burden halves.' },
      { t: 'steps', items: [
        { zh: '<strong>公共骨架</strong>：w ← w + α(目标 − w)。改的永远是"目标"和"步长"，骨架一个字不动。', en: '<strong>The shared skeleton</strong>: w ← w + α(target − w). What changes is always the "target" and the "step"; the skeleton never moves.' },
        { zh: '<strong>增量均值</strong>（§6.1）：估计 = 均值，目标 = 样本 x<sub>k</sub>，步长 = 1/k。', en: '<strong>Incremental mean</strong> (§6.1): estimate = the mean, target = the sample x<sub>k</sub>, step = 1/k.' },
        { zh: '<strong>SGD</strong>（§6.4）：估计 = 参数，目标 = 单样本梯度 ∇f(w, x)，步长 = α<sub>k</sub>。', en: '<strong>SGD</strong> (§6.4): estimate = parameters, target = the one-sample gradient ∇f(w, x), step = α<sub>k</sub>.' },
        { zh: '<strong>TD(0)</strong>（L7）：估计 = v(s)，目标 = r + γv(s′)——目标从"样本"换成了"自举量"。', en: '<strong>TD(0)</strong> (L7): estimate = v(s), target = r + γv(s′) — the target becomes a bootstrapped quantity.' },
        { zh: '<strong>Sarsa</strong>（L7）：估计 = q(s,a)，目标 = r + γq(s′,a′)——on-policy 版本。', en: '<strong>Sarsa</strong> (L7): estimate = q(s,a), target = r + γq(s′,a′) — the on-policy version.' },
        { zh: '<strong>Q-learning</strong>（L7）：估计 = q(s,a)，目标 = r + γ max<sub>a</sub> q(s′,a)——off-policy 版本，收敛证明直接引用 Dvoretzky 定理。', en: '<strong>Q-learning</strong> (L7): estimate = q(s,a), target = r + γ max<sub>a</sub> q(s′,a) — the off-policy version, whose convergence proof cites Dvoretzky’s theorem directly.' },
      ]},
    ],
  };

  /* ---- §6.4 SGD ---- */
  S['l6-sgd'] = {
    kicker: 'L6 · §6.4',
    title: { zh: 'SGD：RM 的成名弟子', en: 'SGD: The Famous Disciple of RM' },
    blocks: [
      { t: 'p', zh: '优化问题 min J(w) = E[f(w, X)]：目标含期望，分布未知，批量采样又太贵。<strong>随机梯度下降</strong>只拿一个样本就更新：<strong>w<sub>k+1</sub> = w<sub>k</sub> − α<sub>k</sub>∇<sub>w</sub>f(w<sub>k</sub>, x<sub>k</sub>)</strong>——把真梯度 E[∇f] 换成单样本的随机梯度。书上证明它是 RM 的特例：取 g(w) = ∇J(w)，则随机梯度 = 真梯度 + 零均值噪声 η<sub>k</sub>，三条件齐活，收敛到手。而增量均值又是 SGD 的特例（f = ½(w − x)² 时随机梯度恰为 w − x）。<strong>三代同堂：RM → SGD → 增量均值。</strong>', en: 'Optimise min J(w) = E[f(w, X)]: the objective contains an expectation, the distribution is unknown, batch sampling is dear. <strong>Stochastic gradient descent</strong> updates on a single sample: <strong>w<sub>k+1</sub> = w<sub>k</sub> − α<sub>k</sub>∇<sub>w</sub>f(w<sub>k</sub>, x<sub>k</sub>)</strong> — the true gradient E[∇f] replaced by a one-sample stochastic gradient. The book proves it is a special RM: set g(w) = ∇J(w) and the stochastic gradient equals the true gradient plus zero-mean noise η<sub>k</sub> — the three conditions hold, convergence follows. And the incremental mean is a special SGD (with f = ½(w − x)² the stochastic gradient is exactly w − x). <strong>Three generations: RM → SGD → incremental mean.</strong>' },
      { t: 'widget', component: 'l6-sgd' },
      { t: 'p', zh: '<strong>为什么单个样本就敢当梯度用？</strong>因为它是<strong>无偏</strong>的：E[∇<sub>w</sub>f(w, X)] = ∇J(w)——随机梯度噪声很大，但期望恰好是真梯度，"平均意义上方向是对的"。剩下的全是方差问题：单样本的方差是 var[X] 级别；mini-batch 把 m 个样本平均，方差除以 m。m 因此是一笔明码标价的"稳定预算"：m 越大越稳（Figure 6.5 的曲线越平滑），每步算力也线性变贵。SGD（m = 1）与 BGD（m = 全部）是同一根价格轴的两端，MBGD 在中间挑性价比。', en: '<strong>Why does a single sample dare to stand in for the gradient?</strong> Because it is <strong>unbiased</strong>: E[∇<sub>w</sub>f(w, X)] = ∇J(w) — the stochastic gradient is noisy, but its expectation is exactly the true gradient; "correct in direction, on average". All that remains is variance: a single sample carries var[X]-level variance; a mini-batch averages m samples and divides the variance by m. So m is a stability budget with a price tag: larger m is steadier (smoother curves in Figure 6.5) and linearly pricier per step. SGD (m = 1) and BGD (m = all) sit at the two ends of one price axis; MBGD shops in the middle for value.' },
      { t: 'formula', lbl: '无偏性与方差的明码标价 · Unbiasedness, and variance with a price tag',
        tex: String.raw`\mathbb{E}[\nabla_w f(w, x)] = \nabla J(w)\;\htmlClass{fx-dim}{\text{(无偏)}} \qquad\text{·}\qquad \operatorname{var}[\text{mini-batch 梯度}] = \htmlClass{fx-accent}{\frac{\operatorname{var}[\text{单样本梯度}]}{m}}` },
      { t: 'p', zh: '书上 Figure 6.5 的现象值得单独记住：<strong>SGD 的收敛曲线是"远快近晃"</strong>——离最优远时随机性相对可忽略、下降飞快；靠近后随机性主导，曲线在解附近永久小幅晃动。批量版 MBGD（每次 m 个样本）在中间：比 SGD 稳、比 GD 灵活。神经网络训练里"学习率衰减"的本质，就是把 a<sub>k</sub> 从常数缓慢调成 1/k 的形状。', en: 'A phenomenon from the book\'s Figure 6.5 worth memorising: SGD converges “fast when far, wobbly when near” — far from the optimum the randomness is relatively negligible and descent is rapid; close to it, randomness dominates and the curve jitters around the solution forever. Mini-batch MBGD (m samples per update) sits between: steadier than SGD, nimbler than GD. The essence of “learning-rate decay” in neural-network training is morphing a<sub>k</sub> from a constant toward the 1/k shape.' },
    ],
  };

  /* ---- §6.5 总结 ---- */
  S['l6-summary'] = {
    kicker: 'L6 · §6.5',
    title: { zh: '本章总结：给 TD 交的基础学费', en: 'Chapter Summary: The Foundation Fee for TD' },
    blocks: [
      { t: 'p', zh: '本章没讲任何新的强化学习算法，却交齐了后面所有学费：<strong>增量均值</strong>（第一条随机迭代式）、<strong>RM 算法</strong>（黑盒求根 + 三条件收敛）、<strong>Dvoretzky 定理</strong>（随机步长版，Q-learning 收敛证明引用的工具）、<strong>SGD/MBGD</strong>（机器学习的日常主食，RM 的特例）。一句话：随机近似 = 用带噪声的增量更新逼近目标，γ< 1 之外的第二台"收敛发动机"在这里点火。', en: 'No new RL algorithms this chapter — but every future fee is paid: the <strong>incremental mean</strong> (our first stochastic iteration), the <strong>RM algorithm</strong> (black-box root-finding + three-condition convergence), <strong>Dvoretzky\'s theorem</strong> (the random-step-size version cited by Q-learning\'s proof), and <strong>SGD/MBGD</strong> (machine learning\'s daily bread, special cases of RM). In one line: stochastic approximation = noisy incremental updates approaching a target — the second “convergence engine”, ignited here beside γ < 1.' },
      { t: 'callout', variant: 'done', zh: '<strong>离场自检。</strong>① 能从 x̄<sub>k+1</sub> 的代数展开推出增量更新式；② 能说出 RM 三条件各挡住哪种失败（单调挡多根、Σa = ∞ 挡走不到、Σa² &lt; ∞ 挡停不下）；③ 能解释 1/k 为何两条件全中、常数步长为何必失其一；④ 能把 TD 更新式拆成"估计 / 目标 / 步长"三件套并指出它是 RM 的特例；⑤ 能说出随机方法的收敛率为什么慢一阶（噪声按 √(Σa²) 累积）。五题全过，第 7 章的门就开了。', en: '<strong>Exit self-check.</strong> ① Derive the incremental update from the algebra of x̄<sub>k+1</sub>; ② name the failure each RM condition prevents (monotonicity prevents multiple roots; Σa = ∞ prevents never-arriving; Σa² &lt; ∞ prevents never-settling); ③ explain why 1/k satisfies both conditions while a constant step must fail one; ④ decompose the TD update into estimate / target / step-size and identify it as special RM; ⑤ say why stochastic methods converge one order slower (noise accumulates as √(Σa²)). Pass all five, and Chapter 7’s door is open.' },
      { t: 'p', zh: '<strong>两台收敛发动机，即将同时点火。</strong>第一台在 L3–L4 点燃：γ &lt; 1 的压缩性，保证 Bellman 算子的迭代收敛——那是"确定性世界"的发动机。第二台在本章点燃：随机近似的步长条件，保证带噪声的更新收敛——这是"随机世界"的发动机。第 7 章的 TD 更新同时踩着两台：更新目标里嵌着 Bellman 算子（γ &lt; 1），更新过程却是随机采样（RM 条件），收敛证明是两台发动机的合奏——这也解释了为什么 TD 的学习率不能随便取，它得同时伺候好两个主人。', en: '<strong>Two convergence engines, about to fire together.</strong> The first ignited in L3–L4: the contraction property of γ &lt; 1, guaranteeing convergence of Bellman-operator iterations — the engine of the deterministic world. The second ignites in this chapter: the stochastic-approximation step-size conditions, guaranteeing convergence of noisy updates — the engine of the stochastic world. Chapter 7’s TD update steps on both at once: its target embeds the Bellman operator (γ &lt; 1) while its updates are driven by random samples (RM conditions), and the convergence proof is a duet of the two engines — which is also why TD’s learning rate cannot be chosen casually: it must serve two masters at once.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"随机近似","en":"stochastic approx.","d":{"zh":"用带噪声的增量更新逼近目标：增量均值、RM、Dvoretzky、SGD/MBGD 全是这套语言。","en":"Approach a target with noisy incremental updates: incremental mean, RM, Dvoretzky and SGD/MBGD all speak this language."}},
        {"zh":"RM 三条件","en":"RM conditions","d":{"zh":"单调挡多根、Σa = ∞ 挡走不到、Σa² 有界挡停不下——各挡住一种失败。","en":"Monotonicity blocks extra roots, Σa = ∞ keeps it moving, bounded Σa² lets it settle — each condition blocks one failure."}},
        {"zh":"步长的讲究","en":"step size","d":{"zh":"1/k 两条件全中；常数步长必失其一，价值在真值附近永久振荡。","en":"1/k meets both conditions; a constant step forfeits one and oscillates forever around the truth."}},
        {"zh":"第二台发动机","en":"second engine","d":{"zh":"γ 小于 1 是确定性世界的发动机，步长条件是随机世界的——第 7 章的 TD 同时踩着两台。","en":"γ below 1 powers the deterministic world, the step-size conditions power the random one — Chapter 7's TD stands on both."}},
      ] } },
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
      { t: 'p', zh: '翻卡前先过三题：① "为什么学一个没有 RL 算法的章节"（因为第 7 章的 TD 在数学上<strong>就是</strong> RM——目标换成 r + γv(s′)）；② "步长到底怎么设"（平稳目标用衰减步长、非平稳用小常数；理论上要满足 Σα = ∞ 且 Σα² &lt; ∞）；③ "SGD 每次只用一个样本会不会走错方向"（无偏——方向平均正确，代价是方差和 1/√t 的收敛率）。', en: 'Before flipping, run through three: ① "why study a chapter with no RL algorithms" (because Chapter 7’s TD mathematically <strong>is</strong> RM — with the target replaced by r + γv(s′)); ② "how should the step size be set" (decaying for stationary targets, small constants for nonstationary ones; theory demands Σα = ∞ with Σα² &lt; ∞); ③ "does one sample per step lead SGD astray" (unbiased — correct on average, at the price of variance and the 1/√t rate).' },
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


  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l6 = D.otherLectures.find(l => l.no === 6);
  if (l6) l6.done = true;
})();
