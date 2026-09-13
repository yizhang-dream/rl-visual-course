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
      { t: 'p', zh: '<strong>动机链：从"两步走"到"一步到位"。</strong>值方法的路线是两步：先估 q*，再 argmax 出策略。三处硬伤：① <strong>argmax 不可导</strong>——深度学习的一切武器（反向传播）在硬选择面前失效，q 估得再好，选择这一步把梯度切断了；② <strong>吐不出随机策略</strong>——argmax 永远是确定性的，可有些问题的最优解天生是混合的（石头剪刀布：任何固定招式都会被针对，均匀随机才不可剥削）；③ <strong>连续动作无能为力</strong>——动作是一段实数时，argmax 本身就是一个优化问题（在无穷集合上找最大），每个决策步都嵌套一层求极值，算不起。直接参数化 π(a|s,θ) 三伤全治：θ 一动概率连续变化（可导）、天然输出分布（随机）、对连续动作输出分布的参数（如高斯的均值方差）而不是单个动作。', en: '<strong>The motivation chain: from “two steps” to “one step”.</strong> The value route is two steps: estimate q*, then argmax out a policy. Three hard wounds: ① <strong>argmax is non-differentiable</strong> — every deep-learning weapon (backpropagation) fails before a hard choice; however well q is estimated, the selection step severs the gradient. ② <strong>It cannot emit stochastic policies</strong> — argmax is always deterministic, yet some problems have inherently mixed optima (rock-paper-scissors: any fixed move gets exploited; only uniform randomisation is unexploitable). ③ <strong>Continuous actions are helpless</strong> — when actions form a continuum, argmax is itself an optimisation problem (maximising over an infinite set), nesting a full optimisation inside every decision step, which nobody can afford. Parameterising π(a|s,θ) directly heals all three: probabilities shift continuously as θ moves (differentiable), it naturally outputs a distribution (stochastic), and for continuous actions it outputs the parameters of a distribution (e.g. a Gaussian’s mean and spread) rather than a single action.' },
      { t: 'steps', items: [
        { zh: '<strong>策略为什么可以被微分？</strong>softmax 把"分数"光滑地映成"概率"：exp 处处可导、求和归一化不破坏光滑性。θ 的任何微小移动，都会引起每个动作概率的微小移动——变化率就是 ∇<sub>θ</sub>π(a|s,θ)，有闭式可算。', en: '<strong>Why can the policy be differentiated?</strong> Softmax maps “scores” to “probabilities” smoothly: exp is differentiable everywhere, and sum-normalisation preserves smoothness. Any infinitesimal move of θ induces infinitesimal moves of every action probability — the rates of change are exactly ∇<sub>θ</sub>π(a|s,θ), available in closed form.' },
        { zh: '<strong>数值手感</strong>：两个动作、分数 h = (0, 0)，策略是 (0.5, 0.5)。把第二个动作的分数抬 0.5：π 变成 (0.378, 0.622)——没有跳变，从 0.5 平滑滑向 0.622。θ 再抬 10 分，π ≈ (0.00003, 0.99997)：softmax 会自动逼近"硬选择"，但全程保持可导。这就是"软"的含金量：软的地方能过梯度，硬的地方不能。', en: '<strong>A numerical feel</strong>: two actions with scores h = (0, 0) give the policy (0.5, 0.5). Raise the second action’s score by 0.5: π becomes (0.378, 0.622) — no jump, a smooth glide from 0.5 toward 0.622. Raise it by another 10 points: π ≈ (0.00003, 0.99997) — softmax approaches a “hard choice” automatically yet stays differentiable throughout. Such is the value of “soft”: gradients pass where it is soft, and die where it is hard.' },
        { zh: '<strong>概率守恒</strong>：Σ<sub>a</sub>π(a|s,θ) ≡ 1 两边对 θ 求导得 Σ<sub>a</sub>∇<sub>θ</sub>π(a|s,θ) = 0——抬高一个动作的概率必然压低其他动作的总概率。这个"零和"性质是第 10 章基线不变性的数学根基，先在这里记下。', en: '<strong>Probability conservation</strong>: differentiating Σ<sub>a</sub>π(a|s,θ) ≡ 1 with respect to θ yields Σ<sub>a</sub>∇<sub>θ</sub>π(a|s,θ) = 0 — raising one action’s probability must lower the total probability of the others. This zero-sum property is the mathematical root of baseline invariance in Chapter 10; note it here first.' },
      ]},
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"调转枪口","en":"turn the gun around","d":{"zh":"不再\"先估价值再 argmax\"，直接参数化策略本身：π(a|s,θ) = softmax(h(s,a)ᵀθ)。","en":"No more \"estimate values, then argmax\": parameterise the policy itself, π(a|s,θ) = softmax(h(s,a)ᵀθ)."}},
        {"zh":"argmax 三处硬伤","en":"argmax's three wounds","d":{"zh":"不可导、吐不出随机策略、连续动作要嵌套求极值——直接参数化三伤全治。","en":"Non-differentiable, never random, nested optimisation for continuous actions — direct parameterisation cures all three."}},
        {"zh":"softmax 参数化","en":"softmax","d":{"zh":"分数被光滑地映成概率：θ 一动所有概率连续地变——可求导、天生随机、自动逼近硬选择。","en":"Scores map smoothly to probabilities: one nudge of θ moves every probability continuously — differentiable, naturally random, gracefully approaching hard choices."}},
        {"zh":"范式转移","en":"paradigm shift","d":{"zh":"策略是主角，价值退居辅助——只用来指导梯度；Actor-Critic 的名字就来自这个分工。","en":"The policy is the protagonist; values retreat to assist — only guiding gradients. Actor-Critic's name comes from this division of labour."}},
      ] } },
    ],
  };

  /* ---- §9.2 度量 ---- */
  S['l9-metrics'] = {
    kicker: 'L9 · §9.2',
    title: { zh: '优化什么？给"好策略"定三个度量', en: 'Optimise What? Three Metrics for a Good Policy' },
    blocks: [
      { t: 'p', zh: '梯度上升需要一个<strong>标量</strong>目标。书上给了三个候选度量（大同小异）：① <strong>平均状态值</strong> v̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)v<sub>π</sub>(s)——按折扣访问分布加权；② <strong>初始状态值</strong> v̄⁰<sub>π</sub> = Σ<sub>s</sub> d₀(s)v<sub>π</sub>(s)——只看起点；③ <strong>平均单步奖励</strong> r̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)Σ<sub>a</sub>π(a|s)q<sub>π</sub>(s,a)——无折扣情形的续式任务度量。', en: 'Gradient ascent needs a <strong>scalar</strong> objective. The book offers three near-equivalent metrics: ① the <strong>average state value</strong> v̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)v<sub>π</sub>(s) — weighted by the discounted visitation distribution; ② the <strong>initial-state value</strong> v̄⁰<sub>π</sub> = Σ<sub>s</sub> d₀(s)v<sub>π</sub>(s) — only where you start; ③ the <strong>average per-step reward</strong> r̄<sub>π</sub> = Σ<sub>s</sub> d<sub>π</sub>(s)Σ<sub>a</sub>π(a|s)q<sub>π</sub>(s,a) — the continuing-task, undiscounted measure.' },
      { t: 'callout', variant: 'warn', zh: '<strong>别高兴太早</strong>：这三个度量的梯度推导是全书最硬的数学之一。坑在于 d<sub>π</sub>(s)、q<sub>π</sub>(s,a) 都依赖 θ——对 θ 求导时"求导的链"会沿着整条轨迹无限延伸。下一节的策略梯度定理用一记巧劲把这个死结剪开。', en: '<strong>Hold the applause</strong>: deriving the gradients of these metrics is among the hardest mathematics in the book. The trap: both d<sub>π</sub>(s) and q<sub>π</sub>(s,a) depend on θ — differentiating sends the chain endlessly along the trajectory. The policy gradient theorem in the next section cuts this knot with one clever stroke.' },
      { t: 'p', zh: '<strong>三个度量共用一个骨架：Σ<sub>s</sub> d(s)·"这个状态过得好不好"。</strong>权重 d(s) 是<strong>访问分布</strong>——"这个策略长期会在哪些状态逗留"。选哪个度量，本质是选"用哪种方式统计长期表现"：回合制任务有天然起点，看 v̄⁰<sub>π</sub>（起点价值）最直接；持续型任务没有回合边界、折扣再小也压不住无限累积，就换 r̄<sub>π</sub>（平均单步奖励）；v̄<sub>π</sub> 用折扣访问分布加权，介于两者之间。共同点更重要：<strong>三个度量都只依赖 π（通过 θ），不依赖任何价值表</strong>——"优化策略"第一次有了自成一体的目标，不必再绕道价值。', en: '<strong>All three metrics share one skeleton: Σ<sub>s</sub> d(s)·“how well this state goes”.</strong> The weight d(s) is a <strong>visitation distribution</strong> — “where this policy lingers in the long run”. Choosing a metric is really choosing “how to tally long-run performance”: episodic tasks have a natural start, so v̄⁰<sub>π</sub> (start-state value) is the most direct; continuing tasks have no episode boundaries and no discount small enough to tame infinite accumulation, so r̄<sub>π</sub> (average per-step reward) takes over; v̄<sub>π</sub> weights by the discounted visitation distribution and sits in between. The commonality matters more: <strong>all three depend only on π (through θ), not on any value table</strong> — for the first time, “optimising the policy” has a self-contained objective with no detour through values.' },
      { t: 'formula', lbl: '三个度量一张图 · Three metrics at a glance',
        tex: String.raw`\begin{gathered} \htmlClass{fx-green}{\bar{v}_\pi} = \sum_s d_\pi(s)\,v_\pi(s)\,\text{（折扣访问加权)} \qquad \htmlClass{fx-gold}{\bar{v}^0_\pi} = \sum_s d_0(s)\,v_\pi(s)\,\text{（只看起点）}\\[2pt] \htmlClass{fx-violet}{\bar{r}_\pi} = \sum_s d_\pi(s)\sum_a \pi(a\mid s)\,q_\pi(s,a)\,\text{（无折扣平均奖励）} \end{gathered}`,
        note: '形态各异，结构同源：一个"分布 × 表现"的加权和；且都随 θ 连续可变——这正是梯度上升需要的地形' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"标量目标","en":"a scalar objective","d":{"zh":"梯度上升需要标量：平均状态值、初始状态值、平均单步奖励——三个大同小异的候选。","en":"Gradient ascent needs a scalar: average state value, from-the-start value, or average per-step reward — three near-equivalent candidates."}},
        {"zh":"访问分布加权","en":"visit-distribution","d":{"zh":"三个度量共用骨架 Σ d(s)·\"这个状态过得好不好\"：d(s) 是策略长期逗留之处。","en":"All three share the skeleton Σ d(s)·\"how good this state is\", where d(s) is where the policy lingers long-term."}},
        {"zh":"推导之硬","en":"the hard part","d":{"zh":"dπ 与 qπ 都依赖 θ，求导的链沿整条轨迹无限延伸——下一节的策略梯度定理用一记 log 剪开死结。","en":"dπ and qπ depend on θ, so the differentiation chain runs forever along trajectories — the next section cuts the knot with one log."}},
      ] } },
    ],
  };

  /* ---- §9.3 梯度定理 ---- */
  S['l9-theorem'] = {
    kicker: 'L9 · §9.3',
    title: { zh: '策略梯度定理：一记 log 剪断死结', en: 'The Policy Gradient Theorem: One log Cuts the Knot' },
    blocks: [
      { t: 'p', zh: '<strong>定理 9.1</strong> 的结论惊人地简洁：三个度量的梯度都长成同一个期望的样子——', en: 'The conclusion of <strong>Theorem 9.1</strong> is astonishingly clean: the gradients of all three metrics take the form of one expectation —' },
      { t: 'formula', lbl: '策略梯度定理 · Theorem 9.1',
        tex: String.raw`\nabla_\theta J(\theta) = \sum_s \eta_\pi(s) \sum_a \nabla_\theta \pi(a\mid s,\theta)\, q_\pi(s,a) \;=\; \mathbb{E}\big[\htmlClass{fx-accent}{\nabla_\theta\ln \pi(A\mid S,\theta)} \cdot q_\pi(S,A)\big]` },
      { t: 'p', zh: '<strong>那记巧劲是 log</strong>：恒等式 ∇<sub>θ</sub>π = π·∇<sub>θ</sub>ln π 把"对概率求导"改写成"概率 × 对 log 概率求导"。这样梯度就成了一个<strong>期望</strong>（在 η<sub>π</sub> 分布下）——期望就可以用样本平均来逼近（大数定律第五次登场）！推导中还有一个隐藏的幸运：q<sub>π</sub> 对 θ 的导数项（会引入整个未来的链式依赖）恰好相互抵消——剩下的只是"动作的对数概率 × 动作价值"。', en: 'The clever stroke is the log: the identity ∇<sub>θ</sub>π = π·∇<sub>θ</sub>ln π rewrites “differentiate a probability” as “probability × differentiate its log”. The gradient becomes an <strong>expectation</strong> (under η<sub>π</sub>) — and expectations can be approximated by sample averages (the law of large numbers, fifth appearance)! A hidden piece of luck: the ∇<sub>θ</sub>q<sub>π</sub> terms (which would drag in the entire future via the chain rule) cancel exactly — leaving only “log-probability of the action × action value”.' },
      { t: 'callout', variant: 'key', zh: '<strong>直观读法</strong>：∇ln π(a|s) 指向"提高 a 概率"的方向；乘上 q<sub>π</sub>(s,a) 意味着——<strong>回报高的动作，把它的概率往上推；回报低的，往下压</strong>。推力大小正比于 q 值。这就是策略梯度的全部灵魂：被奖励强化的行为会重复出现（心理学"强化"一词的数学化身）。', en: '<strong>How to read it intuitively</strong>: ∇ln π(a|s) points in the direction of raising a’s probability; multiplying by q<sub>π</sub>(s,a) means — <strong>push up the probabilities of high-return actions, push down those of low-return ones</strong>, with force proportional to q. That is the entire soul of the policy gradient: behaviours reinforced by reward recur (the mathematical incarnation of the psychological word “reinforcement”).' },
      { t: 'steps', items: [
        { zh: '<strong>log-derivative trick 三步推导。</strong>目标：给 E<sub>a~π</sub>[f(a,s)] 对 θ 求导（f 不含 θ 的简单情形）。第一步老老实实展开：∇<sub>θ</sub>E[f] = Σ<sub>a</sub>∇<sub>θ</sub>π(a|s,θ)·f(a,s)。', en: '<strong>The log-derivative trick in three steps.</strong> Goal: differentiate E<sub>a~π</sub>[f(a,s)] with respect to θ (the easy case where f contains no θ). Step one, unfold honestly: ∇<sub>θ</sub>E[f] = Σ<sub>a</sub>∇<sub>θ</sub>π(a|s,θ)·f(a,s).' },
        { zh: '<strong>第二步：乘除恒等式。</strong>在 ∇π 后面乘一个 π/π（等于没乘），∇π = π·(∇π/π) = π·∇lnπ——"概率的梯度"改写成"概率 × 对数概率的梯度"。这一步没有用到任何高深工具，只是初中代数；但它把求导结果<strong>变回了一个期望</strong>。', en: '<strong>Step two: the multiply-divide identity.</strong> Multiply ∇π by π/π (multiplying by one): ∇π = π·(∇π/π) = π·∇lnπ — “the gradient of a probability” becomes “probability × the gradient of its log”. No advanced tools, just school algebra; yet it turns the derivative <strong>back into an expectation</strong>.' },
        { zh: '<strong>第三步：收拢成期望。</strong>Σ<sub>a</sub>π(a|s)·∇lnπ(a|s)·f(a,s) = E<sub>a~π</sub>[∇lnπ(a|s)·f(a,s)]——期望就能采样估计，大数定律接管。核心收益一句话：<strong>对 θ 的依赖被完整地吸进 ∇lnπ 这一个因子里，其余部分保持"可采样"的形态</strong>。', en: '<strong>Step three: gather into an expectation.</strong> Σ<sub>a</sub>π(a|s)·∇lnπ(a|s)·f(a,s) = E<sub>a~π</sub>[∇lnπ(a|s)·f(a,s)] — and an expectation can be estimated by sampling, with the law of large numbers taking over. The core gain in one line: <strong>all θ-dependence is absorbed into the single factor ∇lnπ, leaving everything else in a samplable shape</strong>.' },
      ]},
      { t: 'formula', lbl: '恒等式本体 · The identity itself',
        tex: String.raw`\nabla_\theta \pi(a\mid s,\theta) = \pi(a\mid s,\theta) \cdot \htmlClass{fx-accent}{\nabla_\theta\ln \pi(a\mid s,\theta)}`,
        note: 'softmax 时 ∇<sub>θ</sub>ln π(a|s) = onehot(a) − π —— 一行代码的魔法导数' },
      { t: 'p', zh: '<strong>定理骨架（以书为准）：</strong>对度量求导时，"未来的策略也依赖 θ"这条链式尾巴——下一状态的价值依赖 θ、再下一状态也是……——被完整折叠进 η<sub>π</sub>(s)（折扣访问测度，引理 9.2 的 (I−γP<sub>π</sub>)⁻¹ 正是"把无穷步折扣转移打包"的机器）。折叠之后，梯度只剩下“当前状态、当前动作”这一层的求导；q<sub>π</sub> 对 θ 的依赖也在折叠中退场——定理的结论里不见任何 ∇<sub>θ</sub>q<sub>π</sub> 的踪影。所以定理 9.1 的结论干净得反常：<strong>∇J 只需要 π 和 q<sub>π</sub> 的"值"，完全不需要它们的导数</strong>——q 不必对 θ 可导，甚至不必是函数（表格、神谕、任何 oracle 都行）。这个性质是 Actor-Critic 能用 TD 评论家替换 q<sub>π</sub> 的许可证。', en: '<strong>The theorem’s skeleton (as the book presents it)</strong>: when differentiating the metric, the chain tail of “the future policy also depends on θ” — next-state values depend on θ, and the ones after, forever — is folded entirely into η<sub>π</sub>(s) (the discounted visitation measure; Lemma 9.2’s (I−γP<sub>π</sub>)⁻¹ is precisely the machine that packs infinitely many discounted transitions into one operator). After the fold, differentiation survives only at the layer of “the current state, the current action”; and the ∇<sub>θ</sub>q<sub>π</sub>(s,a) terms cancel exactly along the way. Hence the unnaturally clean conclusion of Theorem 9.1: <strong>∇J needs only the <em>values</em> of π and q<sub>π</sub>, never their derivatives</strong> — q need not be differentiable in θ, need not even be a function (a table, an oracle, anything goes). This property is precisely the licence that lets Actor-Critic replace q<sub>π</sub> with a TD critic.' },
      { t: 'callout', variant: 'warn', zh: '<strong>误区：softmax 不归一化。</strong>两种翻车姿势：① 直接拿 exp(h(s,a)ᵀθ) 当概率用——分数一大，"概率和"飙到天上，∑π≠1，后续一切推导（尤其 Σ∇π=0 的概率守恒）全部作废；② 对概率本身做加减更新——概率可能越界到负数或超过 1。正确姿势：θ 只存<strong>原始分数</strong>，概率永远由 softmax 现场归一化产出（代码精讲里正是这么写的）；更新只动分数，归一化交给 softmax。顺带的纪律：分数的尺度要管住——分数差过大，softmax 退化为硬 argmax，梯度 ∇lnπ = onehot − π ≈ 0，策略"冻死"，探索失声。', en: '<strong>Misconception: softmax without normalisation.</strong> Two crash postures: ① using exp(h(s,a)ᵀθ) directly as the probability — scores blow up, the “probability sum” shoots skyward, ∑π≠1, and every downstream derivation (probability conservation Σ∇π=0 in particular) is voided; ② adding updates directly to probabilities — they can slip negative or exceed 1. The right posture: θ stores only <strong>raw scores</strong>, probabilities are always produced fresh by softmax normalisation (exactly how the code walkthrough writes it); updates touch scores only, and normalisation is softmax’s job. One discipline that comes along: keep the score scale in check — with huge score gaps softmax degenerates into a hard argmax, the gradient ∇lnπ = onehot − π ≈ 0, the policy “freezes to death”, and exploration falls silent.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"定理 9.1","en":"Theorem 9.1","d":{"zh":"三个度量的梯度都长成同一个期望的样子——∇J 就是期望式的采样。","en":"All three metric gradients take the same expected form — ∇J is samplable as an expectation."}},
        {"zh":"log 技巧","en":"the log trick","d":{"zh":"∇π = π·∇ln π：把\"对概率求导\"改写成期望——期望就能用样本平均逼近（大数定律登场）。","en":"∇π = π·∇ln π turns differentiation into an expectation — and expectations are approximated by sample averages."}},
        {"zh":"直观读法","en":"the intuition","d":{"zh":"∇ln π 指向\"提高概率\"的方向：回报高的动作往上推、回报低的往下压，推力正比于 q 值。","en":"∇ln π points toward \"raise the probability\": high-return actions pushed up, low-return pushed down, force proportional to q."}},
        {"zh":"意外的干净","en":"surprisingly clean","d":{"zh":"qπ 对 θ 的导数项恰好相互抵消：结论里不见任何 ∇qπ——这是 Actor-Critic 能用 TD 评分的伏笔。","en":"The ∇θqπ terms cancel exactly: no ∇qπ appears anywhere — the clue that later lets Actor-Critic score with TD."}},
      ] } },
    ],
  };

  /* ---- §9.4 REINFORCE ---- */
  S['l9-reinforce'] = {
    kicker: 'L9 · §9.4',
    title: { zh: 'REINFORCE：采样出来的梯度上升', en: 'REINFORCE: Gradient Ascent from Samples' },
    blocks: [
      { t: 'p', zh: '把期望换成单条轨迹的采样，就得到 <strong>REINFORCE</strong>（蒙特卡洛策略梯度）。每采一条轨迹 (s₀,a₀,g₁,…)：对其中每一步，用 <strong>γ<sup>t</sup>G<sub>t</sub></strong>（从该步出发的折扣回报）代替 q<sub>π</sub>，执行更新：', en: 'Replacing the expectation by samples from a single trajectory yields <strong>REINFORCE</strong> (Monte Carlo policy gradient). For each trajectory (s₀,a₀,g₁,…): at every step, substitute <strong>γ<sup>t</sup>G<sub>t</sub></strong> (the discounted return from that step) for q<sub>π</sub> and apply the update:' },
      { t: 'formula', lbl: 'REINFORCE — 式 (9.32) 的 γ^t 显式版 · REINFORCE — Eq. (9.32), γ^t-explicit',
        tex: String.raw`\theta_{t+1} = \theta_t + \alpha\,\gamma^{t}\, G_t\, \nabla_\theta\ln \pi(a_t\mid s_t, \theta_t)` },
      { t: 'p', zh: '书上的简洁读法（式 9.33）值得背下来：更新后 <strong>ln π(a<sub>t</sub>|s<sub>t</sub>) 变大当且仅当 G<sub>t</sub> > 0</strong>（折扣情形）——这次经历好，就提高这套动作的概率。注意两点：① 它是 <strong>on-policy</strong> 的（梯度定义在当前策略的分布上）；② 收敛到<strong>局部</strong>最优（θ 的非凸优化），全局最优要碰运气或加技巧。', en: 'The book’s compact reading (Eq. 9.33) is worth memorising: after the update, <strong>ln π(a<sub>t</sub>|s<sub>t</sub>) grows if and only if G<sub>t</sub> > 0</strong> (discounted case) — a good experience raises the probability of exactly those actions. Two caveats: ① it is <strong>on-policy</strong> (the gradient is defined on the current policy’s distribution); ② it converges to a <strong>local</strong> optimum (θ optimisation is nonconvex) — global optimality needs luck or extra machinery.' },
      { t: 'p', zh: '<strong>式里那个 γ<sup>t</sup> 是什么角色？</strong>折扣情形下 J 的定义把 t 步之后的回报按 γ<sup>t</sup> 折价——一个动作离回合起点越远，它对度量的"责任"越轻（它的好回报隔了 t 步折扣才传导回起点价值）。更新式里的 γ<sup>t</sup> 就是这份责任的账面折价。工程小窍门（见代码精讲）：把 γ<sup>t</sup> 折进 G<sub>t</sub> 的倒推递推里，更新行里就不必显式再写——G 本身已带上折扣的"利息"。', en: '<strong>What role does the γ<sup>t</sup> in the formula play?</strong> In the discounted case, J’s definition discounts rewards t steps ahead by γ<sup>t</sup> — the farther an action sits from the episode start, the lighter its “responsibility” toward the metric (its rewards pass through t steps of discounting before reaching the start-state value). The γ<sup>t</sup> in the update is exactly this book-keeping discount of responsibility. An engineering trick (see the code walkthrough): fold γ<sup>t</sup> into the backward recursion of G<sub>t</sub>, and the update line need not write it explicitly — G already carries the discount’s “interest”.' },
      { t: 'p', zh: '<strong>一次更新的解剖（数值）。</strong>五个动作、全零分数（均匀策略 π=0.2），在 s₅ 选了"向下"（最优方向），回合回报 G = +1，学习率 α = 0.5。更新 θ += α·G·(onehot − π)：被选动作的分数 +0.5×(1−0.2) = +0.4，其余四个各 −0.5×0.2 = −0.1。softmax 之后：', en: '<strong>Anatomy of one update (with numbers).</strong> Five actions, all-zero scores (uniform policy π=0.2); at s₅ the agent picks “downward” (the optimal direction), the episode return is G = +1, learning rate α = 0.5. The update θ += α·G·(onehot − π) adds +0.5×(1−0.2) = +0.4 to the chosen action’s score and −0.5×0.2 = −0.1 to each of the other four. After softmax:' },
      { t: 'formula', lbl: '一次好经历 / 一次坏经历 · One good episode, one bad',
        tex: String.raw`\text{G} = +1：\pi(\downarrow\mid s_5)\ 0.20 \rightarrow \htmlClass{fx-green}{0.29}\,\text{（其余各 0.177）} \qquad \text{G} = -1：\pi(\downarrow\mid s_5)\ 0.20 \rightarrow \htmlClass{fx-red}{0.13}\,\text{（其余各 0.217）}`,
        note: '好经历抬概率、坏经历压概率，抬与压的量都连续可调——"强化"的算术实现' },
      { t: 'p', zh: '<strong>高方差是 REINFORCE 的命门。</strong>G<sub>t</sub> 是整条轨迹的实际回报——轨迹里每一步的运气（转移的骰子、奖励的骰子、策略自己的骰子）全部乘进同一个数，样本之间天差地别。更隐蔽的毛病：如果环境奖励恒正（比如每步都 +1），所有动作的 G 都大于 0——<strong>每一步都在抬高所有被选动作的概率，只有相对幅度在分好坏</strong>，信噪比极差。两条出路自然浮现：① <strong>中心化</strong>——减去一个与动作无关的基线，让"高于平均"才配正号（第 10 章的 baseline/优势）；② <strong>换评分员</strong>——用低方差的 TD 估计代替真实回报（第 10 章的评论家）。第 9 章止步于此，第 10 章由此起跳。', en: '<strong>High variance is REINFORCE’s Achilles’ heel.</strong> G<sub>t</sub> is the realised return of a whole trajectory — the luck of every step (the dice of transitions, of rewards, of the policy itself) multiplies into one number, and samples differ wildly. A subtler ailment: if the environment’s rewards are all positive (say +1 per step), every action’s G exceeds zero — <strong>every step raises the probability of every action taken, with only relative magnitudes separating good from bad</strong>: a terrible signal-to-noise ratio. Two exits emerge naturally: ① <strong>centring</strong> — subtract an action-independent baseline so only “above average” earns a plus sign (Chapter 10’s baseline/advantage); ② <strong>a different grader</strong> — replace the real return with a low-variance TD estimate (Chapter 10’s critic). Chapter 9 stops here; Chapter 10 leaps from exactly this spot.' },
      { t: 'callout', variant: 'danger', zh: '<strong>三个高频误区。</strong>① <strong>把 π 的梯度当 q 的梯度</strong>：∇<sub>θ</sub>ln π(a|s) 是"策略参数空间"里的方向——它只回答"θ 怎么动才能抬高 a 的概率"，对"a 好不好"一无所知；好坏信息全部来自乘在旁边的 q 或 G。两者量纲、含义、去向都不同，混用的更新谁也不代表。② <strong>忘记 baseline 的中心化意义</strong>（提前打预防针）：基线不是"可有可无的减法"，它把评分从"绝对好坏"变成"相对平均"，方差直落；不减基线的 REINFORCE 在恒正奖励环境里会全面抬概率。③ <strong>on-policy 样本过期再用</strong>：θ 一变，采样分布就变，旧轨迹的 ∇lnπ 已经不是新策略的梯度——REINFORCE 的数据必须现采现用（这也是它样本效率低的根源，解药在第 10 章）。', en: '<strong>Three frequent misconceptions.</strong> ① <strong>Mistaking π’s gradient for q’s gradient</strong>: ∇<sub>θ</sub>ln π(a|s) is a direction in <em>policy-parameter space</em> — it answers only “how should θ move to raise a’s probability” and knows nothing about “whether a is good”; all goodness information comes from the q or G multiplied alongside. Different dimensions, meanings, and destinations — an update that confuses them represents neither. ② <strong>Forgetting what the baseline’s centring means</strong> (a vaccine in advance): the baseline is not an “optional subtraction”; it converts scores from “absolute goodness” to “relative to average”, collapsing the variance; without it, REINFORCE in all-positive-reward environments raises every probability. ③ <strong>Reusing stale on-policy samples</strong>: once θ moves, the sampling distribution moves with it, and the old trajectories’ ∇lnπ is no longer the new policy’s gradient — REINFORCE’s data must be gathered and consumed fresh (the root of its low sample efficiency, whose antidote arrives in Chapter 10).' },
      { t: 'widget', component: 'l9-reinforce-lab' },
    ],
  };

  /* ---- §9.5 总结 ---- */
  S['l9-summary'] = {
    kicker: 'L9 · §9.5',
    title: { zh: '本章总结：策略基于的方法登场', en: 'Chapter Summary: Policy-Based Methods Enter' },
    blocks: [
      { t: 'p', zh: '全书第一次，主角从价值换成了策略。套路三步：<strong>选标量度量 → 推梯度 → 梯度上升</strong>。最难的推导（定理 9.1）产出一句期望式，log 技巧让梯度可采样。REINFORCE 把它跑成在线算法：好经历加概率、坏经历减概率。从此强化学习有了两根支柱：价值基（L2–L8）与策略基（本章）。', en: 'For the first time, the protagonist switches from values to policies. The recipe is three steps: <strong>pick a scalar metric → derive its gradient → ascend</strong>. The hardest derivation (Theorem 9.1) yields one expectation formula, and the log trick makes it samplable. REINFORCE runs it as an online algorithm: good experiences raise probabilities, bad ones lower them. RL now stands on two pillars: value-based (L2–L8) and policy-based (this chapter).' },
      { t: 'steps', items: [
        { zh: '<strong>求解对象</strong>：值方法解 q（一张表/一个函数），策略在 argmax 里免费赠送；策略方法解 θ（策略的参数），价值退居幕后当评委。', en: '<strong>What is solved</strong>: value methods solve q (a table or a function), with the policy thrown in free by argmax; policy methods solve θ (the policy’s parameters), with values demoted to behind-the-scenes judges.' },
        { zh: '<strong>策略形态</strong>：argmax 吐确定性策略；softmax 参数化天然输出随机策略——需要混合最优解（博弈、藏猫猫）或平滑探索的任务只有这条路好走。', en: '<strong>Policy form</strong>: argmax emits deterministic policies; softmax parameterisation naturally outputs stochastic ones — tasks demanding mixed optima (games, hide-and-seek) or smooth exploration really only have this road.' },
        { zh: '<strong>连续动作</strong>：值方法每步要在连续集合上求 argmax（内层优化，算不起）；策略方法直接输出分布参数（如高斯的 μ、σ）——一步到位。', en: '<strong>Continuous actions</strong>: value methods must argmax over a continuum every step (an inner optimisation nobody can afford); policy methods output distribution parameters (e.g. a Gaussian’s μ, σ) directly — one step, done.' },
        { zh: '<strong>各自的代价</strong>：值方法样本效率高、可 off-policy（Q-learning 一脉），但拿不到随机策略、连续动作吃力；策略方法可导、可随机、可连续，但 on-policy 数据要现采、方差大、收敛到局部最优。Actor-Critic（下一课）让两者各出所长。', en: '<strong>What each pays</strong>: value methods are sample-efficient and off-policy capable (the Q-learning line) but cannot produce stochastic policies and strain at continuous actions; policy methods are differentiable, stochastic, continuous-friendly, but need fresh on-policy data, suffer variance, and converge only locally. Actor-Critic (next lecture) lets each contribute its strength.' },
      ]},
      { t: 'callout', variant: 'done', zh: '<strong>离场自检。</strong>① 能说出值方法"两步走"的三处硬伤（argmax 不可导/吐不出随机策略/连续动作嵌套求极值）；② 能手推 log-derivative 恒等式并说清它为什么把梯度变回"可采样的期望"；③ 能复述定理 9.1 的形态并解释"q<sub>π</sub> 不需要对 θ 求导"这件事为什么重要；④ 能用数值说出 REINFORCE 一次更新如何抬/压概率（0.20→0.29 / 0.20→0.13）；⑤ 能列出策略方法与值方法在求解对象、策略形态、连续动作、样本效率上的对照。五题全过，第 10 章的演员就该上场了。', en: '<strong>Exit self-check.</strong> ① Name the three hard wounds of the value route’s “two steps” (argmax non-differentiable / no stochastic policies / nested optimisation for continuous actions); ② derive the log-derivative identity by hand and explain why it turns the gradient back into “a samplable expectation”; ③ recite the shape of Theorem 9.1 and explain why “q<sub>π</sub> never needs differentiating in θ” matters; ④ give the numbers of how one REINFORCE update raises/lowers probabilities (0.20→0.29 / 0.20→0.13); ⑤ list the value/policy comparison across solution object, policy form, continuous actions, and sample efficiency. Pass all five, and the actor of Chapter 10 may take the stage.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"套路三步","en":"three moves","d":{"zh":"选标量度量 → 推梯度 → 梯度上升——全书第一次，主角从价值换成策略。","en":"Pick a metric, derive the gradient, ascend it — for the first time the protagonist swaps from value to policy."}},
        {"zh":"log 让梯度可采样","en":"log makes it samplable","d":{"zh":"最难的推导（定理 9.1）产出一句期望式，log 技巧让梯度可采样。","en":"The hardest derivation (Theorem 9.1) yields one expectation formula; the log trick makes the gradient samplable."}},
        {"zh":"REINFORCE","en":"REINFORCE","d":{"zh":"把定理跑成在线算法：好经历加概率、坏经历减概率。","en":"The theorem as an online algorithm: good experiences gain probability, bad ones lose it."}},
        {"zh":"两根支柱","en":"two pillars","d":{"zh":"价值基（L2–L8）与策略基（本章）从此并行，深度 RL 的两根支柱立齐。","en":"Value-based (L2–L8) and policy-based (this chapter) now stand side by side — deep RL's two pillars in place."}},
      ] } },
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
      { t: 'widget', component: 'notebook-bridge', props: { nb: 'nb6' } },
    ],
  };

  /* ---- L9 Q&A ---- */
  S['l9-qa'] = {
    kicker: 'L9 · §9.6',
    title: { zh: '问答：策略梯度六连问', en: 'Q&A: Six Questions on Policy Gradient' },
    blocks: [
      { t: 'p', zh: '为什么有 log、为什么要学无折扣情形、更新到底在更新什么——六问扫清本课。', en: 'Why the log, why study the undiscounted case, what is the update really updating — six questions to clear the lesson.' },
      { t: 'p', zh: '翻卡前先过三题：① "softmax 策略相比 ε-greedy 好在哪"（可导——梯度能流过策略；概率连续变化——探索强度由 θ 自己学着调，不是外挂的 ε）；② "策略梯度定理里为什么可以不知道 q<sub>π</sub> 的导数"（∇θ 的依赖全被 log 恒等式吸进 ∇lnπ，定理只需要 q 的值——所以任何能估 q 的东西都能当评分员）；③ "REINFORCE 为什么慢"（G<sub>t</sub> 方差大 + on-policy 数据现采现用——两个病根都通向第 10 章的评论家）。', en: 'Before flipping, run through three: ① “What does the softmax policy have over ε-greedy” (differentiability — gradients flow through the policy; smoothly shifting probabilities — exploration strength is learned by θ itself rather than bolted on as ε); ② “Why may the policy gradient theorem remain ignorant of q<sub>π</sub>’s derivative” (the θ-dependence is absorbed into ∇lnπ by the log identity; the theorem needs only q’s value — so anything that estimates q can serve as the grader); ③ “Why is REINFORCE slow” (G<sub>t</sub>’s variance plus strictly fresh on-policy data — both roots lead straight to Chapter 10’s critic).' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l9' } },
      { t: 'widget', component: 'fill-lab', props: { source: 'l9' } },
      { t: 'widget', component: 'derivation-lab', props: { source: 'l9' } },
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

  /* ═══ L9 知识填充 ═══ */
  D.fillSets['l9'] = {
    title: { zh: '第九讲 · 知识填充', en: 'Lecture 9 · Knowledge Fill-in' },
    items: [
      { kind: 'choice',
        tag: { zh: '策略登场 · 参数化', en: 'the policy enters · parameterisation' },
        stem: { zh: '之前所有算法都"先估价值，再 argmax 出策略"——argmax 不可导、永远确定。策略梯度直接参数化 π(a|s,θ)：θ 是 [[1]]，先给每个动作打分 h(s,a)ᵀθ，再由 [[2]] 把分数光滑地映成概率分布。θ 微动，每个动作的概率连续地变——可求导、天生随机。',
                en: 'Every algorithm so far went “estimate values, then argmax out a policy” — argmax is non-differentiable and forever deterministic. Policy gradients parameterise π(a|s,θ) directly: θ is [[1]]; it first scores every action with h(s,a)ᵀθ, then [[2]] maps the scores smoothly into a probability distribution. A nudge of θ shifts every action’s probability continuously — differentiable, naturally stochastic.' },
        blanks: [
          { choices: { zh: ['一组可导的参数（分数的权重）', '一张 (s,a) 查表索引', '一个离散动作的白名单'],
                       en: ['a set of differentiable parameters (the score weights)', 'a (s,a) lookup index', 'a whitelist of discrete actions'] }, answer: 0,
            why: { zh: 'argmax 是硬选择：想把偏好从 0.7 调到 0.75，它只给 0 或 1，梯度在它面前被切断。θ 是一组连续参数，动一分量、所有动作的概率都连续响应——变化率 ∇θπ 有闭式可算。查表和离散集合都不是 θ 的可导函数，撑不起梯度上升。', en: 'argmax is a hard choice: nudging a preference from 0.7 to 0.75 yields only 0 or 1, severing the gradient. θ is a set of continuous parameters — move one component and every action’s probability responds smoothly, with the rates ∇θπ available in closed form. A lookup index and a discrete whitelist are not differentiable functions of θ; gradient ascent cannot stand on them.' } },
          { choices: ['softmax', 'argmax', 'ε-greedy'], answer: 0,
            why: { zh: 'softmax 把分数映成分布：exp 处处可导、求和归一化不破坏光滑性，且自动逼近硬选择（分数差拉大 → 趋近 onehot）。argmax 只输出一个动作，形不成分布；ε-greedy 是外挂的探索拼装，不是策略本身的可导形式。', en: 'Softmax maps scores to a distribution: exp is differentiable everywhere, sum-normalisation preserves smoothness, and it approaches hard choices automatically (larger score gaps → closer to onehot). argmax outputs a single action, never a distribution; ε-greedy is a bolted-on exploration rig, not a differentiable form of the policy itself.' } },
        ] },
      { kind: 'choice',
        tag: { zh: '表格策略 vs 参数化策略', en: 'tabular vs parameterised policy' },
        stem: { zh: '把策略从表格换成 π(a|s,θ)，三笔账要重算：存储从 |S|×|A| 张表缩到 [[1]]；没见过的状态靠特征 h(s,a) 的结构 [[2]]；代价是梯度上升只保证收敛到局部最优——表格法在表格情形能到全局最优。',
                en: 'Swapping the tabular policy for π(a|s,θ) rewrites three accounts: storage shrinks from a |S|×|A| table to [[1]]; unseen states [[2]] through the structure of the features h(s,a); the price is that gradient ascent guarantees only a local optimum — the tabular method reaches a global one in the tabular case.' },
        blanks: [
          { choices: { zh: ['dim(θ) 个参数——与 |S|×|A| 解耦', '|S|×|A| 个格子——一个都不能少', '整条轨迹的长度——按步现存'],
                       en: ['dim(θ) parameters — decoupled from |S|×|A|', '|S|×|A| cells — every one kept', 'the trajectory length — stored per step'] }, answer: 0,
            why: { zh: '表格策略每个 (s,a) 一格，存储随状态数爆炸；参数化的规模只由 θ 的维数决定，与 |S|×|A| 解耦。付出的是非凸性：J(θ) 的地形有多个峰，梯度上升只承诺爬上其中一个。', en: 'A tabular policy keeps one cell per (s,a) and storage explodes with the state count; the parameterised size follows θ’s dimensionality alone, decoupled from |S|×|A|. The price is nonconvexity: J(θ) has multiple peaks, and gradient ascent promises only one of them.' } },
          { choices: { zh: ['泛化——相似状态共享相似的分数', '精查——每格独立收敛到真值', '跳过——没见过的状态自动得零分'],
                       en: ['generalisation — similar states share similar scores', 'exact lookup — each cell converges on its own', 'skipping — unseen states score zero automatically'] }, answer: 0,
            why: { zh: '表格格子互不相识：没访问过的 (s,a) 永远停在初值。参数化把分数交给 h(s,a)ᵀθ——特征相近的状态共享参数，一处学到、邻近沾光，这就是泛化。"自动得零分"既不对也不公平：参数化会给未访问状态一个由特征决定的合理外推。', en: 'Tabular cells never talk: an unvisited (s,a) stays at its initial value forever. Parameterisation hands scoring to h(s,a)ᵀθ — states with similar features share parameters, so what one learns, its neighbours inherit: generalisation. “Automatic zero” is neither right nor fair: a parameterised policy extrapolates sensibly to unvisited states through the features.' } },
        ] },
      { kind: 'number',
        tag: { zh: '实验台 · softmax 数值', en: 'lab · softmax numerics' },
        stem: { zh: '两个动作，分数 h = (0, 0)，π = (0.5, 0.5)。把第二个动作的分数抬 0.5，softmax 归一化后 π₂ = [[1]]——没有跳变，从 0.5 平滑滑过来。',
                en: 'Two actions, scores h = (0, 0), π = (0.5, 0.5). Raise the second action’s score by 0.5; after softmax normalisation π₂ = [[1]] — no jump, a smooth glide from 0.5.' },
        blanks: [
          { answer: 0.622, tol: 0.005,
            hint: { zh: 'e^0.5/(e^0.5 + e^0) ≈ ?', en: 'e^0.5/(e^0.5 + e^0) ≈ ?' },
            why: { zh: 'π₂ = e^0.5/(e^0.5 + e^0) = 1.649/2.649 ≈ 0.622，第一个动作拿剩下的 0.378（概率守恒：两者之和恒为 1）。抬高一个必然压低其余——这个"零和"性质是第 10 章基线不变性的数学根基。分数差再拉大，π₂ 贴近 1：softmax 自动逼近硬选择，但全程保持可导。', en: 'π₂ = e^0.5/(e^0.5 + e^0) = 1.649/2.649 ≈ 0.622, and the first action takes the remaining 0.378 (probability conservation: the two always sum to 1). Raising one necessarily lowers the others — this zero-sum property is the mathematical root of baseline invariance in Chapter 10. Widen the score gap and π₂ hugs 1: softmax approaches a hard choice automatically yet stays differentiable throughout.' } },
        ] },
      { kind: 'choice',
        tag: { zh: 'log-derivative 技巧', en: 'the log-derivative trick' },
        stem: { zh: '要给期望 E_a~π[f(a,s)] 对 θ 求导，老实展开是 Σ_a ∇θπ(a|s,θ)·f(a,s)——求导卡在概率 π 上，采样无从谈起。log-derivative 技巧在 ∇θπ 后乘上 [[1]]（等于没乘），把它改写成 π·∇θln π：θ 的依赖全被吸进 ∇ln π 一个因子，梯度重新变回 [[2]]，样本平均即可估计。',
                en: 'To differentiate the expectation E_a~π[f(a,s)] in θ, the honest expansion is Σ_a ∇θπ(a|s,θ)·f(a,s) — differentiation stalls on the probability π, and sampling gets nowhere. The log-derivative trick multiplies ∇θπ by [[1]] (multiplying by one), rewriting it as π·∇θln π: all θ-dependence is absorbed into the single factor ∇ln π, and the gradient becomes [[2]] again, estimable by sample averages.' },
        blanks: [
          { choices: { zh: ['π/π——初中代数的一步', 'θ/‖θ‖ 的归一化因子', '1/f(a,s) 的倒数配平'],
                       en: ['π/π — plain school algebra', 'a normaliser θ/‖θ‖', 'the reciprocal 1/f(a,s)'] }, answer: 0,
            why: { zh: '∇π = π·∇ln π 没用任何高深工具，却把"对概率求导"解耦成"概率 × 对 log 概率求导"。π 因子正是采样分布本身——所以不需要任何显式的 ∇p/p 比值出现，它化进了"期望在 π 下取"。softmax 还白送闭式：∇θln π(a|s) = onehot(a) − π。', en: '∇π = π·∇ln π uses no advanced tool, yet decouples “differentiating a probability” into “probability × differentiating its log”. The π factor is exactly the sampling distribution itself — which is why no explicit ∇p/p ratio ever appears; it dissolves into “the expectation is taken under π”. Softmax donates a closed form as well: ∇θln π(a|s) = onehot(a) − π.' } },
          { choices: { zh: ['一个期望——大数定律接管', '一个闭式解——无需再采样', '一个 argmax——回到硬选择'],
                       en: ['an expectation — the law of large numbers takes over', 'a closed-form solution — no more sampling needed', 'an argmax — back to hard choices'] }, answer: 0,
            why: { zh: '期望形态是整个定理的命门：Σ_a π·∇ln π·f 恰好是"在 π 下采 (s,a) 再平均"。每采一条样本就是一次无偏的梯度估计——不可导的优化问题瞬间变成统计问题。这也是大数定律在本讲的角色。', en: 'The expectation form is the hinge of the whole theorem: Σ_a π·∇ln π·f is exactly “sample (s,a) under π, then average”. Each sample is an unbiased estimate of the gradient — an non-differentiable optimisation problem instantly becomes a statistical one. That is the law of large numbers’ role in this lecture.' } },
        ] },
      { kind: 'choice',
        tag: { zh: '定理 9.1 的意外干净', en: 'the theorem’s surprising cleanliness' },
        stem: { zh: '定理 9.1：∇θJ(θ) = E[∇θln π(A|S,θ)·qπ(S,A)]。结论里不见 ∇θqπ 的踪影——推导中 q 的导数项恰好 [[1]]。这意味着评分员 qπ 只需要给出 [[2]]，不必对 θ 可导，甚至可以是表格或 oracle。',
                en: 'Theorem 9.1: ∇θJ(θ) = E[∇θln π(A|S,θ)·qπ(S,A)]. No ∇θqπ appears anywhere — in the derivation, the q-derivative terms [[1]] exactly. This means the grader qπ only needs to supply [[2]]; it need not be differentiable in θ, and can even be a table or an oracle.' },
        blanks: [
          { choices: { zh: ['相互抵消', '被学习率 α 吸收', '累积成主方差项'],
                       en: ['cancel each other exactly', 'are absorbed by the learning rate α', 'pile up into the dominant variance term'] }, answer: 0,
            why: { zh: '"未来的策略也依赖 θ"这条链式尾巴在折叠中两两相消——定理的结论里只剩"当前状态、当前动作"这一层的求导。这是推导里隐藏的幸运，也是定理干净得反常的原因。', en: 'The chain tail of “the future policy also depends on θ” cancels pairwise during the fold — only the layer of “the current state, the current action” survives differentiation. That is the hidden luck in the derivation, and why the theorem is unnaturally clean.' } },
          { choices: { zh: ['值——数值大小即可', '梯度——必须对 θ 可导', '二阶导——曲率信息'],
                       en: ['values — magnitudes suffice', 'gradients — it must be differentiable in θ', 'second derivatives — curvature information'] }, answer: 0,
            why: { zh: '∇θln π 才是"θ 怎么动"的方向，q 只负责打分（乘在旁边的权重）——两者量纲、含义、去向都不同。q 不必可导是 Actor-Critic 能拿 TD 评论家当评分员的许可证：评论家只需估出数值。', en: '∇θln π is the direction of “how θ should move”; q only grades (the weight multiplied alongside) — different dimensions, meanings, and destinations. q’s freedom from differentiation is the licence that lets Actor-Critic hire a TD critic as the grader: the critic only estimates numbers.' } },
        ] },
      { kind: 'code',
        tag: { zh: 'code · softmax 归一化', en: 'code · softmax normalisation' },
        stem: { zh: '本讲 code-lab 的 softmax 一行流：[[1]] 处填对，Σπ 才恒等于 1——分数才配叫"概率"。',
                en: 'The one-line softmax from this lecture’s code lab: fill [[1]] correctly and Σπ ≡ 1 — only then may the scores be called “probabilities”.' },
        code: { zh: 'e = np.exp(h - h.max()); pi = e / [[1]]　# softmax：分数 → 概率（Σπ = 1）',
                en: 'e = np.exp(h - h.max()); pi = e / [[1]]　# softmax: scores → probabilities (Σπ = 1)' },
        blanks: [
          { choices: ['e.sum()', 'h.sum()', 'len(h)'], answer: 0,
            why: { zh: '分母 e.sum() 把每个动作的 exp(h−max) 加总，分子分母同底，Σπ ≡ 1。填 h.sum()：原始分数与 exp 值量纲不同，配平当场失效；填 len(h)：输出恒为均匀分布，θ 的分数信息全部丢失。先减 h.max() 不改变输出（分子分母同缩），只防 exp 上溢。', en: 'The denominator e.sum() adds up exp(h−max) over all actions; numerator and denominator share the base, so Σπ ≡ 1. h.sum() mixes units — raw scores and exp’d values do not balance; len(h) always outputs the uniform distribution, discarding every bit of score information. Subtracting h.max() leaves the output unchanged (both shrink by the same factor); it only guards exp against overflow.' } },
        ] },
      { kind: 'choice',
        tag: { zh: 'REINFORCE · 蒙特卡洛', en: 'REINFORCE · Monte Carlo' },
        stem: { zh: '把定理里的期望换成采样，就得到 REINFORCE。它是蒙特卡洛式的：必须等 [[1]] 跑完；对其中每步 t，用从该步出发的实际折扣回报 [[2]] 代替 qπ(s_t, a_t)——G 是 q 的无偏样本。式 (9.33) 的读法：G_t > 0 ⟹ ln π(a_t|s_t,θ) 上升。',
                en: 'Replace the theorem’s expectation with samples and REINFORCE appears. It is Monte Carlo: one must wait for [[1]] to finish; at every step t, the actual discounted return from that step, [[2]], substitutes for qπ(s_t, a_t) — G is an unbiased sample of q. Reading Eq. (9.33): G_t > 0 ⟹ ln π(a_t|s_t,θ) rises.' },
        blanks: [
          { choices: { zh: ['整条 episode', '单步 (s,a,r,s′)——即采即用', '先跑满一轮 value iteration'],
                       en: ['a whole episode', 'a single step (s,a,r,s′), used on the spot', 'a full sweep of value iteration'] }, answer: 0,
            why: { zh: 'G_t 是整条轨迹的实际回报：从 t 步出发、把之后所有奖励按折扣加总。所以必须等回合结束才有更新信号——TD 方法单步就能更新，正是第 10 章评论家要补的短板。', en: 'G_t is the realised return of the whole trajectory: starting from step t, summing all later rewards with discounting. The update signal therefore waits for the episode to end — TD methods update per step, exactly the gap Chapter 10’s critic closes.' } },
          { choices: { zh: ['γ^t · G_t——无偏但方差大', 'r + γ·v̂(s′,w)——TD 目标', 'max_a q(s′,a)——max 备份'],
                       en: ['γ^t · G_t — unbiased but high-variance', 'r + γ·v̂(s′,w) — the TD target', 'max_a q(s′,a) — a max backup'] }, answer: 0,
            why: { zh: '用 γ^t G_t 代替 qπ(s_t,a_t)：对按折扣回报加权的目标函数，期望保持不变——梯度估计无偏。但整条轨迹的运气（转移、奖励、策略的骰子）全乘进同一个数，方差极大；且 θ 一变采样分布就变，on-policy 数据必须现采现用。两条解药（基线中心化、TD 评论家）都在第 10 章。', en: 'Substituting γ^t G_t for qπ(s_t,a_t) keeps the expectation intact for the return-weighted objective — hence an unbiased gradient estimate. But the luck of the whole trajectory (the dice of transitions, rewards, and the policy) multiplies into one number: enormous variance; and once θ moves the sampling distribution moves, so on-policy data must be gathered and consumed fresh. Both cures (baseline centring, the TD critic) arrive in Chapter 10.' } },
        ] },
      { kind: 'number',
        tag: { zh: '实验台 · 一次更新的解剖', en: 'lab · anatomy of one update' },
        stem: { zh: '五个动作、全零分数（π = 0.2）。在 s₅ 选了最优方向，回合回报 G = +1，学习率 α = 0.5。更新 θ += α·G·(onehot − π)：被选动作的分数增加 [[1]]；softmax 之后该动作概率从 0.20 变到 [[2]]。',
                en: 'Five actions, all-zero scores (π = 0.2). At s₅ the agent picks the optimal direction; the episode return is G = +1 and the learning rate α = 0.5. The update θ += α·G·(onehot − π) adds [[1]] to the chosen action’s score; after softmax its probability moves from 0.20 to [[2]].' },
        blanks: [
          { answer: 0.4, tol: 0.01,
            hint: { zh: 'α·G·(1 − π) = ?', en: 'α·G·(1 − π) = ?' },
            why: { zh: '被选动作分量是 (1 − 0.2) = 0.8，增量 = 0.5 × 1 × 0.8 = +0.4；其余四个动作各 −0.5 × 0.2 = −0.1。∇ln π(a|s) = onehot(a) − π 的推力合计为零——概率守恒。', en: 'The chosen component is (1 − 0.2) = 0.8, so the increment is 0.5 × 1 × 0.8 = +0.4; each of the other four gets −0.5 × 0.2 = −0.1. The pushes of ∇ln π(a|s) = onehot(a) − π sum to zero — probability conservation.' } },
          { answer: 0.29, tol: 0.005,
            hint: { zh: 'e^0.4/(e^0.4 + 4e^(−0.1)) ≈ ?', en: 'e^0.4/(e^0.4 + 4e^(−0.1)) ≈ ?' },
            why: { zh: '新分数 (0.4, −0.1, −0.1, −0.1, −0.1) 过 softmax：e^0.4/(e^0.4 + 4·e^−0.1) = 1.492/5.111 ≈ 0.29，其余各 ≈ 0.177。好经历抬概率、坏经历压概率，抬与压的量连续可调——"强化"的算术实现。', en: 'The new scores (0.4, −0.1, −0.1, −0.1, −0.1) go through softmax: e^0.4/(e^0.4 + 4·e^−0.1) = 1.492/5.111 ≈ 0.29, each of the others ≈ 0.177. Good experiences raise probability, bad ones lower it, with continuously adjustable force — the arithmetic of “reinforcement”.' } },
        ] },
    ],
  };


  /* ═══ L9 定理推导（策略梯度定理 · Theorem 9.1 完整版）═══ */
  D.derivationSets = D.derivationSets || {};
  D.derivationSets['l9'] = {
    title: { zh: '第九讲 · 定理推导', en: 'Lecture 9 · Theorem Derivations' },
    items: [
      {
        id: 'policy-gradient-theorem',
        name: { zh: '策略梯度定理', en: 'The Policy Gradient Theorem' },
        intro: {
          zh: '全书科研含金量最高的一条链：从目标 J(θ)=E[R(τ)] 出发，用一记 log-derivative 把梯度从积分里解放成期望，看着环境模型在求导中整个消失，再经因果裁剪与条件期望收拢成定理 9.1 的最终形态。20 步走完，四个带 ★ 的关键步必须亲手答对。',
          en: 'The most research-grade chain in the whole book: start from J(θ)=E[R(τ)], use one log-derivative stroke to free the gradient from the integral into an expectation, watch the environment model vanish under differentiation, then fold through causal clipping and conditional expectation into the final form of Theorem 9.1. Twenty steps, with four ★ key moves you must get right yourself.',
        },
        steps: [
          /* 1 · 目标定义 */
          { tex: String.raw`J(\theta) \;=\; \mathbb{E}_{\tau\sim\pi_\theta}\big[R(\tau)\big] \;=\; \sum_{\tau} P(\tau;\theta)\, R(\tau)`,
            why: { zh: '回合制设定：初始分布 ρ₀ 固定，智能体按参数化策略 π(a|s,θ) 走出轨迹 τ=(s₀,a₀,r₁,s₁,a₁,…)，环境按 p 转移。把"策略好坏"定成一个标量，梯度上升才有抓手——这里取起点价值口径 J=v̄⁰<sub>π</sub>（书 Ch.9 的度量之一；另两个度量最后殊途同归，见第 18 步）。', en: 'Episodic setting: fixed start distribution ρ₀; the agent follows the parameterised policy π(a|s,θ) along trajectory τ=(s₀,a₀,r₁,s₁,a₁,…) while the environment transitions by p. Pinning "how good the policy is" to one scalar gives gradient ascent something to grip — here the start-state value J=v̄⁰<sub>π</sub> (one of Ch.9’s metrics; the other two converge to the same family, see step 18).' } },
          /* 2 · 回报口径 */
          { tex: String.raw`R(\tau) \;=\; \sum_{k=0}^{T-1} \gamma^{k}\, r_{k+1}, \qquad 0<\gamma<1`,
            why: { zh: '折扣回合回报——式 (9.32) 背后的口径。γ<1 让有限与无限视野都收敛（L1 的等比级数）。书同时推了无折扣持续型（平均奖励 r̄<sub>π</sub>）版本，骨架完全同构：本链每一步在 γ=1 时照搬成立，差别只在访问分布的定义。符号约定：r<sub>k+1</sub> 是 a<sub>k</sub> 之后到来的奖励。', en: 'The discounted episodic return — the caliber behind Eq. (9.32). γ<1 keeps both finite and infinite horizons convergent (L1’s geometric series). The book also derives the undiscounted continuing (average-reward r̄<sub>π</sub>) version with an isomorphic skeleton: every step here survives verbatim at γ=1, only the visitation distribution’s definition differs. Notation: r<sub>k+1</sub> is the reward that follows a<sub>k</sub>.' } },
          /* 3 · 梯度移进求和 */
          { tex: String.raw`\nabla_\theta J(\theta) \;=\; \nabla_\theta \sum_{\tau} P(\tau;\theta)\, R(\tau) \;=\; \sum_{\tau} \htmlClass{fx-gold}{\nabla_\theta P(\tau;\theta)}\; R(\tau)`,
            why: { zh: '求导穿过求和号/积分号：R(τ) 不含 θ，唯一的 θ 依赖在 P(τ;θ) 里，梯度只落在 P 上。正则条件一句带过——有限回合时是有限项求和的线性性；无限视野时 γ<1 保证被收敛级数控制（dominated convergence 的教科书场景），书里默认成立。', en: 'The derivative passes through the sum/integral: R(τ) contains no θ, the sole θ-dependence sits in P(τ;θ), so the gradient lands only on P. Regularity in one sentence — with finite episodes it is linearity of a finite sum; with infinite horizon γ<1 keeps everything dominated by a convergent series (a textbook dominated-convergence situation), assumed silently by the book.' } },
          /* 4 · 困境 */
          { tex: String.raw`\sum_{\tau} \nabla_\theta P(\tau;\theta)\, R(\tau) \qquad \text{——不是期望：前面没有 } P(\tau;\theta) \text{ 做权重}`,
            why: { zh: '困境点明：P(τ;θ) 是"整条轨迹的概率"——ρ₀、一串转移 p、一串策略 π 的乘积，而 ρ₀ 与 p 是未知的环境模型；我们能从环境采样 τ，却写不出、更求不出 ∇P。同时这个和式不是任何分布下的期望（缺概率权重），蒙特卡洛无从下手。死结就在这里。', en: 'The predicament, spelled out: P(τ;θ) is “the probability of an entire trajectory” — a product of ρ₀, a chain of transitions p, and a chain of policy outputs π, where ρ₀ and p form the unknown environment model; we can sample τ from the environment yet can neither write down nor differentiate ∇P. And the sum is no distribution’s expectation (no probability weight in front) — Monte Carlo has no entry point. Here is the knot.' } },
          /* 5 · ★ log-derivative */
          { tex: String.raw`\nabla_\theta P(\tau;\theta) \;=\; \nabla_\theta P(\tau;\theta)\cdot\underbrace{\frac{P(\tau;\theta)}{P(\tau;\theta)}}_{=\,1} \;=\; ?`,
            why: { zh: '凭什么是它：初中代数的一步（乘除恒等式），没动用任何高深工具，却同时完成两件事——θ 依赖被完整吸进对数那侧，P 因子恰好是采样分布本身。下一行你会看到这两件事合起来把死结剪开。', en: 'Why this move: one step of school algebra (a multiply-divide identity), no advanced tools, yet it does two jobs at once — the θ-dependence is absorbed wholly toward the logarithm side, while the P factor is exactly the sampling distribution itself. The next line shows these two jobs jointly cutting the knot.' },
            blank: {
              q: { zh: 'log-derivative 恒等式：乘完 P/P 整理后，∇<sub>θ</sub>P 等于——', en: 'The log-derivative identity: after multiplying by P/P and tidying up, ∇<sub>θ</sub>P equals —' },
              choices: [
                { tex: String.raw`P(\tau;\theta)\,\nabla_\theta\ln P(\tau;\theta)` },
                { tex: String.raw`\dfrac{\nabla_\theta\ln P(\tau;\theta)}{P(\tau;\theta)}` },
                { tex: String.raw`\nabla_\theta\ln P(\tau;\theta)` },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确——∇lnP 的定义就是 ∇P/P，两边乘回 P 即得；θ 依赖被吸进 log，P 因子留在外面当权重。', en: 'Correct — ∇lnP is by definition ∇P/P; multiply both sides back by P. The θ-dependence is absorbed into the log, leaving P outside as the weight.' },
                { zh: '比值装反了：从 ∇lnP=∇P/P 解出的应是 ∇P=P·∇lnP；再除一次 P 得到 ∇P/P²，代回积分凑不出期望。', en: 'The ratio is inverted: ∇lnP=∇P/P solves to ∇P=P·∇lnP; dividing by P once more yields ∇P/P², which no longer reassembles into an expectation.' },
                { zh: '丢掉了概率因子 P——没有 P 乘在前面，求和就收不回"在 πθ 下取期望"的形态，采样仍无从谈起。', en: 'The probability factor P is lost — without P in front, the sum cannot close back into “an expectation under πθ”, and sampling stays out of reach.' },
              ],
              hint: { zh: '链式法则给出 ∇lnP = ∇P/P。把它当代数方程，解出 ∇P。', en: 'The chain rule gives ∇lnP = ∇P/P. Treat it as an algebraic equation and solve for ∇P.' },
            } },
          /* 6 · 代回成期望 */
          { tex: String.raw`\nabla_\theta J(\theta) \;=\; \sum_{\tau} P(\tau;\theta)\,\nabla_\theta\ln P(\tau;\theta)\, R(\tau) \;=\; \mathbb{E}_{\tau\sim\pi_\theta}\big[\nabla_\theta\ln P(\tau;\theta)\cdot R(\tau)\big]`,
            why: { zh: '把恒等式代回第 3 步：P 回到被积函数前面，和式重新变成"在 πθ 的轨迹分布下取期望"——一个我们采样得来的分布。梯度第一次成了可估的期望（大数定律的入场券）。别急着高兴：∇lnP(τ;θ) 里还锁着未知的环境模型，下一阶段拆它。', en: 'Substituting the identity back into step 3: P returns to the front of the integrand and the sum turns back into “an expectation under πθ’s trajectory distribution” — a distribution we can sample from. For the first time the gradient is an estimable expectation (the law of large numbers’ ticket). Don’t celebrate yet: ∇lnP(τ;θ) still locks in the unknown environment model; the next phase dismantles it.' } },
          /* 7 · 轨迹概率展开 */
          { tex: String.raw`P(\tau;\theta) \;=\; \rho_0(s_0)\prod_{t=0}^{T-1} \pi(a_t\mid s_t,\theta)\; p(s_{t+1}\mid s_t,a_t)`,
            why: { zh: '概率链式法则沿马尔可夫轨迹逐因子展开：每一步 = 策略给动作的概率 π × 环境给下一状态的概率 p，再乘起点分布 ρ₀。三个部件里只有 π 含 θ。若奖励也是随机的，还要乘 p(r<sub>t+1</sub>|s<sub>t</sub>,a<sub>t</sub>) 因子——同样不含 θ，后面每一步都不受影响（式子里干脆省略）。', en: 'The chain rule of probability unfolds along the Markov trajectory factor by factor: each step = the policy’s probability of the action π × the environment’s probability of the next state p, times the start distribution ρ₀. Of the three parts only π involves θ. If rewards are also stochastic, factors p(r<sub>t+1</sub>|s<sub>t</sub>,a<sub>t</sub>) multiply in as well — equally θ-free, so nothing downstream changes (hence omitted outright).' } },
          /* 8 · 取 log */
          { tex: String.raw`\ln P(\tau;\theta) \;=\; \ln\rho_0(s_0) \;+\; \sum_{t=0}^{T-1}\ln\pi(a_t\mid s_t,\theta) \;+\; \sum_{t=0}^{T-1}\ln p(s_{t+1}\mid s_t,a_t)`,
            why: { zh: '这就是 log 出场的原因：乘积变加法。对 T 个因子的乘积求导要用乘积法则、交叉项满天飞；对加法求导则逐项独立——每项要么含 θ、要么不含，泾渭分明。第 5 步的 log-derivative 恒等式已经把 ∇θ 引到 log 门口，现在把门里的东西摊开。', en: 'This is why the log shows up: products become sums. Differentiating a product of T factors needs the product rule with cross-terms sprouting everywhere; differentiating a sum proceeds term by term — each term either contains θ or it does not, cleanly separated. Step 5’s log-derivative identity already led ∇θ to the log’s doorstep; now we lay out what is inside.' } },
          /* 9 · ★ 环境项消失 */
          { tex: String.raw`\nabla_\theta \ln P(\tau;\theta) \;=\; \nabla_\theta\ln\rho_0(s_0) \;+\; \sum_{t=0}^{T-1}\nabla_\theta\ln\pi(a_t\mid s_t,\theta) \;+\; \sum_{t=0}^{T-1}\nabla_\theta\ln p(s_{t+1}\mid s_t,a_t) \;=\; \htmlClass{fx-gold}{\,?\,}`,
            why: { zh: '定理的灵魂步：ρ₀ 与 p 不含 θ，梯度恒为零——环境模型在求导中整个消失。剩下的 ∇lnP(τ;θ) 只关心"这条轨迹上每一步的动作概率怎么随 θ 变"。这是策略梯度方法模型无关（model-free）的数学出生证明：从不需要知道 p 和 ρ₀ 长什么样，只需要能采样。', en: 'The theorem’s soul step: ρ₀ and p carry no θ, so their gradients are identically zero — the entire environment model vanishes under differentiation. What remains of ∇lnP(τ;θ) cares only about “how the probability of each action along this one trajectory varies with θ”. This is the mathematical birth certificate of policy-gradient methods being model-free: you never need to know what p and ρ₀ look like — only to be able to sample.' },
            blank: {
              q: { zh: '对 θ 求导：三个部分里，谁活了下来？', en: 'Differentiate with respect to θ: of the three parts, which survive?' },
              choices: [
                { tex: String.raw`\sum_{t=0}^{T-1}\nabla_\theta\ln\pi(a_t\mid s_t,\theta)` },
                { tex: String.raw`\sum_{t=0}^{T-1}\nabla_\theta\ln p(s_{t+1}\mid s_t,a_t)` },
                { tex: String.raw`\nabla_\theta\ln\rho_0(s_0)\;+\;\sum_{t=0}^{T-1}\nabla_\theta\ln\pi(a_t\mid s_t,\theta)` },
                { tex: String.raw`\sum_{t=0}^{T-1}\nabla_\theta\ln\pi(a_t\mid s_t,\theta)\;+\;\sum_{t=0}^{T-1}\nabla_\theta\ln p(s_{t+1}\mid s_t,a_t)` },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确——ρ₀ 与 p 是环境的物理，不随 θ 动，梯度恒为零；整条轨迹的梯度塌缩成"每步策略 log 梯度"之和。', en: 'Correct — ρ₀ and p are the environment’s physics, unmoved by θ, so their gradients are identically zero; the whole-trajectory gradient collapses to the sum of per-step policy log-gradients.' },
                { zh: '转移模型 p(s′|s,a) 是环境规律——θ 是策略的参数，动不了它：∇lnp ≡ 0。若它幸存，策略梯度就模型相关了，第 9 章将不复存在。', en: 'The transition model p(s′|s,a) is an environment law — θ is the policy’s parameter and cannot move it: ∇lnp ≡ 0. If it survived, the policy gradient would be model-dependent and Chapter 9 would not exist.' },
                { zh: '起点分布 ρ₀(s₀) 在回合开始前就定死，不含 θ——常数的梯度为零，不该出现在结果里。', en: 'The start distribution ρ₀(s₀) is fixed before the episode begins and contains no θ — a constant’s gradient is zero and has no business in the result.' },
                { zh: 'π 与 p 都留着：p 不含 θ、∇lnp ≡ 0——留下它等于声称"策略参数能扭动物理"。', en: 'Keeping both π and p: p carries no θ and ∇lnp ≡ 0 — keeping it amounts to claiming “policy parameters can bend physics”.' },
              ],
              hint: { zh: '问自己：θ 是谁的参数？环境还是策略？', en: 'Ask yourself: whose parameter is θ? The environment’s or the policy’s?' },
            } },
          /* 10 · REINFORCE 原始形式 */
          { tex: String.raw`\nabla_\theta J(\theta) \;=\; \mathbb{E}_{\tau\sim\pi_\theta}\Big[\sum_{t=0}^{T-1} \nabla_\theta\ln\pi(a_t\mid s_t,\theta)\cdot R(\tau)\Big]`,
            why: { zh: '把第 9 步代回第 6 步的期望：REINFORCE 的原始形式。整条链上任何一处都见不到 ρ₀ 与 p——期望在"跑策略采轨迹"上取，而这恰是智能体本来就会做的事。直觉读法：∇lnπ(a<sub>t</sub>|s<sub>t</sub>) 指向"抬高 a<sub>t</sub> 概率"的方向，乘上 R(τ) 意味着整条轨迹的回报给每个动作统一打分。', en: 'Substituting step 9 back into step 6’s expectation: the original form of REINFORCE. Nowhere in the chain do ρ₀ or p appear — the expectation is over “run the policy and collect trajectories”, precisely what an agent already does. Intuitive reading: ∇lnπ(a<sub>t</sub>|s<sub>t</sub>) points toward “raise a<sub>t</sub>’s probability”, and multiplying by R(τ) means the whole trajectory’s return grades every action uniformly.' } },
          /* 11 · 因果性引理 */
          { tex: String.raw`\mathbb{E}\big[\nabla_\theta\ln\pi(a_t\mid s_t,\theta)\cdot b(s_0,a_0,\dots,s_t)\big] \;=\; 0`,
            why: { zh: '因果性引理（也是第 10 章 baseline 不变性的引擎）：对 s<sub>t</sub> 条件化后，历史量 b 可提到动作求和外——E[∇lnπ·b|s<sub>t</sub>] = b·Σ<sub>a</sub>π(a|s<sub>t</sub>)∇lnπ(a|s<sub>t</sub>) = b·Σ<sub>a</sub>∇π(a|s<sub>t</sub>) = b·∇<sub>θ</sub>(Σ<sub>a</sub>π(a|s<sub>t</sub>)) = b·∇<sub>θ</sub>1 = 0。最后一步用的正是 §9.1 记下的概率守恒 Σ<sub>a</sub>π≡1。结论：任何"a<sub>t</sub> 出生之前"的量乘进期望都贡献为零。', en: 'The causality lemma (also the engine of Chapter 10’s baseline invariance): conditioning on s<sub>t</sub> lets the history-quantity b factor out of the action sum — E[∇lnπ·b|s<sub>t</sub>] = b·Σ<sub>a</sub>π(a|s<sub>t</sub>)∇lnπ(a|s<sub>t</sub>) = b·Σ<sub>a</sub>∇π(a|s<sub>t</sub>) = b·∇<sub>θ</sub>(Σ<sub>a</sub>π(a|s<sub>t</sub>)) = b·∇<sub>θ</sub>1 = 0. The last step is exactly the probability conservation Σ<sub>a</sub>π≡1 noted in §9.1. Conclusion: any quantity “born before a<sub>t</sub>” contributes zero inside the expectation.' } },
          /* 12 · ★ 因果裁剪 */
          { tex: String.raw`R(\tau) \;=\; \underbrace{\sum_{k=0}^{t-1}\gamma^{k}r_{k+1}}_{\text{乘 }\nabla\ln\pi\text{ 后}} \;+\; \underbrace{\sum_{k=t}^{T-1}\gamma^{k}r_{k+1}}_{\text{乘 }\nabla\ln\pi\text{ 后}} \qquad\Rightarrow\qquad \nabla_\theta J \;=\; \mathbb{E}\Big[\sum_{t} \nabla_\theta\ln\pi(a_t\mid s_t,\theta)\cdot\,\htmlClass{fx-accent}{\,?\,}\Big]`,
            why: { zh: '凭什么期望不变：R(τ) 拆成"t 之前 + t 起的尾巴"，乘上 ∇lnπ(a<sub>t</sub>|s<sub>t</sub>) 后，"之前"那段恰是第 11 步引理里的 b——期望为零，扔掉无罪。方差为什么变小：每个动作的评分不再被它无法影响的运气污染。γ<sup>k</sup> 的绝对折扣原样保留在尾巴里（下一步提出 γ<sup>t</sup>）。', en: 'Why the expectation is unchanged: R(τ) splits into “the part before t + the tail from t”; multiplied by ∇lnπ(a<sub>t</sub>|s<sub>t</sub>), the “before” part is precisely the lemma’s b of step 11 — zero in expectation, guilt-free to discard. Why the variance drops: each action’s grade is no longer polluted by luck it cannot influence. The absolute discounting γ<sup>k</sup> stays in the tail as is (γ<sup>t</sup> gets pulled out next step).' },
            blank: {
              q: { zh: '因果裁剪：a<sub>t</sub> 影响不了它之前的奖励。把评分从整条 R(τ) 换成哪一段，期望不变、方差更小？', en: 'Causal clipping: a<sub>t</sub> cannot affect rewards from before it. Replace the grader R(τ) with which segment — same expectation, smaller variance?' },
              choices: [
                { tex: String.raw`\sum_{k=t}^{T-1}\gamma^{k}\,r_{k+1}` },
                { tex: String.raw`\sum_{k=0}^{t-1}\gamma^{k}\,r_{k+1}` },
                { tex: String.raw`\sum_{k=0}^{T-1}\gamma^{k}\,r_{k+1}` },
                { tex: String.raw`r_{t+1}` },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确——从 t 起的折扣尾巴：t 之前的奖励与 a<sub>t</sub> 无关，按第 11 步期望为零，扔掉它们期望分毫不动，方差却实打实地变小。', en: 'Correct — the discounted tail from t: rewards before t are causally unrelated to a<sub>t</sub> and zero in expectation by step 11; discarding them leaves the expectation untouched while the variance genuinely shrinks.' },
                { zh: '只留 t 之前的奖励——那是 a<sub>t</sub> 尚未出生的历史，与它毫无因果；这一项的期望为零，梯度信号直接消失。', en: 'Keeping only rewards before t — that is history from before a<sub>t</sub> was born, causally unrelated to it; the term is zero in expectation and the gradient signal vanishes outright.' },
                { zh: '这就是 R(τ) 本身：期望当然对，但把与 a<sub>t</sub> 无关的"过去噪声"原样乘进每个动作的评分——方差白白变大，正是本步要治的病。', en: 'That is R(τ) itself: the expectation is right, of course, but it multiplies each action’s grade by “past noise” unrelated to a<sub>t</sub> — variance inflated for nothing, precisely the ailment this step treats.' },
                { zh: '只看眼前一步的奖励 r<sub>t+1</sub>：丢掉全部长期信用分配，期望不再等于 ∇J——只有延迟回报的好动作会被它冤枉。', en: 'Only the immediate reward r<sub>t+1</sub>: all long-term credit assignment is lost and the expectation no longer equals ∇J — good actions with delayed rewards get wronged by it.' },
              ],
              hint: { zh: '站在 a<sub>t</sub> 的时刻往未来看：哪些奖励还"没发生"？', en: 'Stand at a<sub>t</sub> and look forward: which rewards have “not happened yet”?' },
            } },
          /* 13 · 按时间步形式（式 9.32 的 γ^t 显式版） */
          { tex: String.raw`\sum_{k=t}^{T-1}\gamma^{k}\,r_{k+1} \;=\; \gamma^{t}\underbrace{\sum_{k=t}^{T-1}\gamma^{k-t}\,r_{k+1}}_{G_t} \;\;\Longrightarrow\;\; \nabla_\theta J(\theta) \;=\; \mathbb{E}\Big[\sum_{t}\gamma^{t}\,\nabla_\theta\ln\pi(a_t\mid s_t,\theta)\,G_t\Big]`,
            why: { zh: '把尾巴里的公共因子 γ<sup>t</sup> 提出来，评分变成 γ<sup>t</sup>·G<sub>t</sub>——式 (9.32) 的 γ<sup>t</sup> 显式版里那个 γ<sup>t</sup> 的出处就在这（书 (9.32) 以 q<sub>t</sub> 记此式，此处展开其 γ<sup>t</sup> 显式形式）：动作离回合起点越远，对"起点价值"这个度量的责任越轻（账面折价）。G<sub>t</sub> 就是从 t 出发的折扣回报，与 L2/L5 的 G<sub>t</sub> 同一个人。采一条轨迹、每步执行 θ ← θ + αγ<sup>t</sup>G<sub>t</sub>∇lnπ，就是 REINFORCE。', en: 'Factoring the common γ<sup>t</sup> out of the tail turns the grader into γ<sup>t</sup>·G<sub>t</sub> — precisely where the γ<sup>t</sup> in the γ<sup>t</sup>-explicit version of Eq. (9.32) comes from (the book’s (9.32) writes q<sub>t</sub>; this chain spells out its explicit γ<sup>t</sup> form): the farther an action sits from the episode’s start, the lighter its responsibility toward the start-value metric (a bookkeeping discount). G<sub>t</sub> is the discounted return from t — the same G<sub>t</sub> as in L2/L5. Sample one trajectory, apply θ ← θ + αγ<sup>t</sup>G<sub>t</sub>∇lnπ per step, and you have REINFORCE.' } },
          /* 14 · ★ 条件期望 */
          { tex: String.raw`\mathbb{E}\big[G_t \mid s_t = s,\; a_t = a\big] \;=\; \htmlClass{fx-gold}{\,?\,}`,
            why: { zh: '凭什么是它：马尔可夫性——给定 (s<sub>t</sub>,a<sub>t</sub>)，未来的分布不再依赖更早的历史，条件期望只由 (s,a) 决定，而"从 (s,a) 出发的期望回报"正是 q<sub>π</sub> 的定义。注意 q<sub>π</sub> 的 θ 导数没有出场：它只以"值"的身份乘在旁边——这就是定理 9.1 结论里不见 ∇<sub>θ</sub>q<sub>π</sub> 的原因，也是 Actor-Critic 能换评分员的许可证。', en: 'Why it: the Markov property — given (s<sub>t</sub>,a<sub>t</sub>), the future’s distribution no longer depends on earlier history, so the conditional expectation is fixed by (s,a) alone, and “the expected return starting from (s,a)” is exactly q<sub>π</sub>’s definition. Note q<sub>π</sub>’s own θ-derivative never enters: it multiplies alongside purely as a value — the reason no ∇<sub>θ</sub>q<sub>π</sub> appears in Theorem 9.1’s conclusion, and the licence that lets Actor-Critic swap in another grader.' },
            blank: {
              q: { zh: '全期望公式（塔规则）往里收一层：G<sub>t</sub> 在 (s<sub>t</sub>,a<sub>t</sub>) 条件下的期望是什么？', en: 'Pull the tower rule one layer in: what is G<sub>t</sub>’s expectation conditioned on (s<sub>t</sub>,a<sub>t</sub>)?' },
              choices: [
                { tex: String.raw`q_\pi(s,a)` },
                { tex: String.raw`v_\pi(s)` },
                { tex: String.raw`\max_{a'} q_\pi(s,a')` },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确——马尔可夫性保证"从 (s,a) 出发的未来"只依赖 (s,a) 本身，其期望正是动作价值 q<sub>π</sub> 的定义。', en: 'Correct — the Markov property guarantees “the future from (s,a)” depends on (s,a) alone, and its expectation is exactly the action-value q<sub>π</sub>’s definition.' },
                { zh: 'v<sub>π</sub>(s) 是对动作再取平均后的状态价值——a 的信息已被平均掉；放这里会让同一状态的不同动作拿到同一个评分。', en: 'v<sub>π</sub>(s) is the state value after further averaging over actions — a’s information is already averaged away; using it here hands every action in a state the same grade.' },
                { zh: 'max 是贪婪备份（值迭代的动作），会系统性高估评分并带来最大化偏差——策略梯度要的是"这个动作"的期望回报，不是最好动作的。', en: 'max is the greedy backup (value iteration’s move); it systematically overgrades and imports maximisation bias — the policy gradient wants “this action’s” expected return, not the best action’s.' },
              ],
              hint: { zh: '把 q<sub>π</sub> 的定义式写出来，就是它：q<sub>π</sub>(s,a) := E[G<sub>t</sub> | s<sub>t</sub>=s, a<sub>t</sub>=a]。', en: 'Write out q<sub>π</sub>’s definition and there it is: q<sub>π</sub>(s,a) := E[G<sub>t</sub> | s<sub>t</sub>=s, a<sub>t</sub>=a].' },
            } },
          /* 15 · 值函数形式 */
          { tex: String.raw`\nabla_\theta J(\theta) \;=\; \mathbb{E}\Big[\sum_{t}\gamma^{t}\,\nabla_\theta\ln\pi(a_t\mid s_t,\theta)\,q_\pi(s_t,a_t)\Big]`,
            why: { zh: '塔规则把随机评分 G<sub>t</sub> 换成它的条件均值 q<sub>π</sub>：期望不变（全期望公式），方差再降一层（G<sub>t</sub> 的随机性被平均掉）。到这一步，"评分员"已从"一条轨迹的实际回报"进化成"策略本身的期望回报"——正是定理口径。剩下的只是记账：把 Σ<sub>t</sub> 的期望整理成按状态加权的形式。', en: 'The tower rule swaps the random grader G<sub>t</sub> for its conditional mean q<sub>π</sub>: the expectation is unchanged (law of total expectation), and the variance drops another floor (G<sub>t</sub>’s randomness is averaged out). At this point the grader has evolved from “one trajectory’s realised return” to “the policy’s own expected return” — precisely the theorem’s caliber. What remains is bookkeeping: reorganise the Σ<sub>t</sub> expectation into a state-weighted form.' } },
          /* 16 · 访问分布加权 */
          { tex: String.raw`\nabla_\theta J(\theta) \;=\; \sum_{s} \htmlClass{fx-violet}{\eta_\pi(s)} \sum_{a} \pi(a\mid s,\theta)\,\nabla_\theta\ln\pi(a\mid s,\theta)\,q_\pi(s,a), \qquad \eta_\pi(s) \;=\; \sum_{t\geq 0}\gamma^{t}\,\Pr(s_t = s)`,
            why: { zh: '把 Σ<sub>t</sub>E[·] 按"第 t 步落在哪个状态"展开再合并同类项：状态 s 的总权重是 η<sub>π</sub>(s)=Σ<sub>t</sub>γ<sup>t</sup>·Pr(s<sub>t</sub>=s)——折扣访问测度。它把"无穷步折扣转移"打包成一个分布（书引理 9.2 的 (I−γP<sub>π</sub>)⁻¹ 正是这台打包机）；"未来的策略也依赖 θ"的那条链式尾巴，全部折叠进 η<sub>π</sub>，不再露面。', en: 'Expanding Σ<sub>t</sub>E[·] by “which state step t lands in” and collecting like terms: state s’s total weight is η<sub>π</sub>(s)=Σ<sub>t</sub>γ<sup>t</sup>·Pr(s<sub>t</sub>=s) — the discounted visitation measure. It packs “infinitely many discounted transitions” into one distribution (Lemma 9.2’s (I−γP<sub>π</sub>)⁻¹ is exactly this packing machine); the chain tail of “the future policy also depends on θ” is folded entirely into η<sub>π</sub> and never shows its face again.' } },
          /* 17 · 反向用 log 技巧 → 求和形式 */
          { tex: String.raw`\sum_{a}\pi(a\mid s,\theta)\,\nabla_\theta\ln\pi(a\mid s,\theta) \;=\; \sum_{a}\nabla_\theta\pi(a\mid s,\theta) \;\;\Longrightarrow\;\; \nabla_\theta J(\theta) \;=\; \sum_{s}\eta_\pi(s)\sum_{a}\nabla_\theta\pi(a\mid s,\theta)\,q_\pi(s,a)`,
            why: { zh: '同一条 log-derivative 恒等式反向使用：Σ<sub>a</sub>π·∇lnπ = Σ<sub>a</sub>∇π。得到定理 9.1 的求和形式——与书（和本讲 §9.3 公式块）完全同口径。注意形态的干净：∂ 只打在 π 上，q<sub>π</sub> 以纯"值"的身份出现，η<sub>π</sub> 只做加权。', en: 'The same log-derivative identity, run in reverse: Σ<sub>a</sub>π·∇lnπ = Σ<sub>a</sub>∇π. This yields Theorem 9.1’s summation form — exactly the caliber of the book (and this lecture’s §9.3 formula block). Note the cleanliness: ∂ lands only on π, q<sub>π</sub> appears purely as a value, η<sub>π</sub> merely weights.' } },
          /* 18 · 最终定理 */
          { tex: String.raw`\htmlClass{fx-green}{\nabla_\theta J(\theta) \;=\; \mathbb{E}_{s\sim\eta_\pi,\;a\sim\pi(\cdot\mid s,\theta)}\big[\nabla_\theta\ln\pi(a\mid s,\theta)\cdot q_\pi(s,a)\big]}`,
            why: { zh: '定理 9.1 最终形态：双重求和读回一个期望——按折扣访问分布 η<sub>π</sub> 抽状态、按当前策略抽动作。读法：好动作（q 大）概率往上推、差动作往下压，推力正比于 q。书里另两个度量（平均状态值、平均奖励）的梯度最后也长成这一族——殊途同归。全程只用了：交换求导与求和、log 恒等式、概率守恒、马尔可夫性、全期望公式——五个本科工具。', en: 'Theorem 9.1 in final form: the double sum read back as a single expectation — states drawn from the discounted visitation distribution η<sub>π</sub>, actions from the current policy. Reading: good actions (large q) get their probabilities pushed up, poor ones down, force proportional to q. The gradients of the book’s other two metrics (average state value, average reward) end up in this same family — all roads converge. The whole chain used only: swapping derivative and sum, the log identity, probability conservation, the Markov property, and the law of total expectation — five undergraduate tools.' } },
          /* 19 · 三口径对照 */
          { tex: String.raw`\nabla_\theta\ln\pi(a_t\mid s_t,\theta)\;\times\; \underbrace{R(\tau) \quad\Big|\quad \gamma^{t}G_t \quad\Big|\quad q_\pi(s_t,a_t)}_{\text{同一期望 · 三个评分口径 · same expectation, three graders}}`,
            why: { zh: '三个口径一张表：整条回报 R(τ)——REINFORCE 原始版，无偏但把整条轨迹的运气乘进同一个数；因果裁剪 γ<sup>t</sup>G<sub>t</sub>——式 (9.32) 的 γ<sup>t</sup> 显式版，期望不变、方差变小（扔掉过去的噪声）；条件均值 q<sub>π</sub>——期望不变、方差最小（未来的随机性也被平均掉，但 q<sub>π</sub> 未知，需另学一个 critic 来估——第 10 章的活）。期望相同、方差递减、估计成本递增：一条"方差—计算"的交换谱。', en: 'Three calibers, one table: the whole-trajectory return R(τ) — original REINFORCE, unbiased but multiplying all the trajectory’s luck into one number; the causally clipped γ<sup>t</sup>G<sub>t</sub> — the γ<sup>t</sup>-explicit version of Eq. (9.32), same expectation, smaller variance (the past’s noise discarded); the conditional mean q<sub>π</sub> — same expectation, minimal variance (the future’s randomness averaged out too, but q<sub>π</sub> is unknown and needs a critic to estimate — Chapter 10’s job). Same expectation, decreasing variance, increasing estimation cost: a “variance-for-computation” exchange spectrum.' } },
          /* 20 · 收官：模型无关 + NB6 钩子 */
          { tex: String.raw`\theta \;\leftarrow\; \theta + \alpha\,\gamma^{t}G_t\,\nabla_\theta\ln\pi(a_t\mid s_t,\theta) \qquad \text{Eq. (9.32), } \gamma^{t}\text{-explicit}`,
            why: { zh: '收官回到算法：这条链解释了 REINFORCE 为什么只需要"能采样、能算 ∇lnπ"两样——环境模型 ρ₀、p 在第 9 步就被求导本身删除，G<sub>t</sub> 只是把采到的奖励加总。softmax 还白送闭式 ∇lnπ = onehot(a) − π（§9.1）。到 NB6 把它跑成 numpy：30 行代码、无环境模型、样本即梯度。下一站第 10 章：G<sub>t</sub> 方差大，换评分员（baseline 与 critic）。', en: 'The chain closes back at the algorithm: it explains why REINFORCE needs only two things — “being able to sample” and “being able to compute ∇lnπ” — the environment model ρ₀, p was deleted by differentiation itself at step 9, and G<sub>t</sub> merely sums sampled rewards. Softmax even donates the closed form ∇lnπ = onehot(a) − π (§9.1). Next stop, NB6 runs it in numpy: thirty lines, no environment model, samples as gradients. Then Chapter 10: G<sub>t</sub>’s variance is heavy — swap the grader (baseline and critic).' } },
        ],
      },
    ],
  };


  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l9 = D.otherLectures.find(l => l.no === 9);
  if (l9) l9.done = true;
})();
