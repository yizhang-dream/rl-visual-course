/* ═══════════════════════════════════════════════════════════
   L2 · 状态价值与 Bellman 方程（书 Ch.2）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §2.1 为什么回报重要 ---- */
  S['l2-why'] = {
    kicker: 'L2 · §2.1',
    title: { zh: '动机一：回报为什么重要？', en: 'Motivating Example 1: Why Are Returns Important?' },
    blocks: [
      { t: 'p', zh: '上一课我们说"回报能评价策略"，但只是说说而已。这一节书里第一次把这句话<strong>做成了数学</strong>。场景是一个 2×2 小世界：s1 是起点，右上 s2 是禁区，右下 s4 是目标（进去就赖着拿 +1），左下是 s3。三张策略卡的区别只在 s1：策略 A 指向下面（绕开禁区），策略 B 指向右边（一头扎进禁区），策略 C 掷硬币（各 0.5）。直觉上 A 最好、B 最差、C 居中——但直觉不是数学，下面把它算出来。', en: 'Last lesson claimed "returns can judge policies" — verbally. This section finally turns that claim into mathematics. The arena is a 2×2 world: s1 is the start, the top-right s2 is forbidden, the bottom-right s4 is the target (step in and stay collecting +1), and the bottom-left is s3. The three policy cards differ only at s1: Policy A points down (avoids the forbidden cell), Policy B points right (straight into it), Policy C flips a coin (0.5 each). Intuition says A > C > B — but intuition is not mathematics, so let us compute.' },
      { t: 'widget', component: 'l2-three-policies' },
      { t: 'p', zh: '从 s1 出发分别沿三条策略走，折扣回报是（γ ∈ (0,1)）：策略 A：0 + γ·1 + γ²·1 + … = <strong>γ/(1−γ)</strong>；策略 B：−1 + γ·1 + γ²·1 + … = <strong>−1 + γ/(1−γ)</strong>；策略 C：两条轨迹各 0.5 概率，平均下来 = <strong>−0.5 + γ/(1−γ)</strong>。于是对<strong>任何</strong> γ 都有 return₁ > return₃ > return₂——数学结论和直觉完全一致：A 最好，B 最差。', en: 'Starting from s1, the discounted returns along the three policies are (with γ ∈ (0,1)): Policy A: 0 + γ·1 + γ²·1 + … = <strong>γ/(1−γ)</strong>. Policy B: −1 + γ·1 + γ²·1 + … = <strong>−1 + γ/(1−γ)</strong>. Policy C: two trajectories each with probability 0.5, averaged = <strong>−0.5 + γ/(1−γ)</strong>. Hence for <strong>every</strong> γ: return₁ > return₃ > return₂ — the mathematical conclusion matches intuition exactly: A best, B worst.' },
      { t: 'callout', variant: 'key', zh: '注意一个细节：return₃ 其实<strong>不严格符合"回报"的定义</strong>——它是两条轨迹回报的平均值，更像一个"期望值"。这个"更像期望的东西"就是下一节要正式定义的<strong>状态价值（state value）</strong>。', en: 'A subtle detail: return₃ actually <strong>does not strictly satisfy the definition of a return</strong> — it is the average over two trajectories, more like an "expected value". This expectation-like quantity is precisely the <strong>state value</strong> to be formally defined in §2.3.' },
    ],
  };

  /* ---- §2.2 如何计算回报 ---- */
  S['l2-bootstrap'] = {
    kicker: 'L2 · §2.2',
    title: { zh: '动机二：回报怎么算？——自举登场', en: 'Motivating Example 2: How to Calculate Returns? Enter Bootstrapping' },
    blocks: [
      { t: 'p', zh: '算回报的第一种办法当然是按定义：把轨迹上的奖励全部折现加起来。书里画了一个四状态"圆环"：s1→s2→s3→s4→s1 循环，离开 si 拿 ri。从每个状态出发写开式：v1 = r1 + γr2 + γ²r3 + …，v2 = r2 + γr3 + γ²r4 + …，以此类推。', en: 'The first way to compute returns is by definition: discount and sum all rewards along the trajectory. The book draws a four-state ring: s1→s2→s3→s4→s1 cycling, where leaving si earns ri. Writing the open form from each state: v1 = r1 + γr2 + γ²r3 + …, v2 = r2 + γr3 + γ²r4 + …, and so on.' },
      { t: 'widget', component: 'l2-ring' },
      { t: 'p', zh: '第二种办法<strong>更重要</strong>：观察开式会发现 v1 = r1 + γ(r2 + γr3 + …) = <strong>r1 + γv2</strong>，同理 v2 = r2 + γv3，v3 = r3 + γv4，v4 = r4 + γv1。每个状态的回报都靠"下一个状态的回报"表示——这就是<strong>自举（bootstrapping）</strong>：用一件事自身（们）去表达这件事。', en: 'The second way is <strong>more important</strong>: inspecting the open forms reveals v1 = r1 + γ(r2 + γr3 + …) = <strong>r1 + γv2</strong>, likewise v2 = r2 + γv3, v3 = r3 + γv4, v4 = r4 + γv1. Each state\'s return is expressed via the <em>next</em> state\'s return — this is <strong>bootstrapping</strong>: obtaining the values of some quantities from themselves.' },
      { t: 'callout', variant: 'warn', zh: '<strong>初见必懵</strong>：v1 依赖 v2，v2 依赖 v3，v3 依赖 v4，v4 又绕回来依赖 v1——乍看是无解的循环定义。破解它要换一个视角：这不是"一个数靠另一个数"，而是<strong>四个方程联立</strong>。写成矩阵-向量形式 v = r + γPv 之后，v = (I − γP)⁻¹r，一组未知数被一次性解出。下一节正式展开。', en: '<strong>The inevitable first confusion</strong>: v1 depends on v2, v2 on v3, v3 on v4, and v4 loops back to v1 — it looks like a circular definition with no way in. The way out is a change of viewpoint: this is not "one number leaning on another" but <strong>a system of simultaneous equations</strong>. Written in matrix-vector form v = r + γPv, it solves as v = (I − γP)⁻¹r — all unknowns at once. Formalised next.' },
    ],
  };

  /* ---- §2.3 状态价值 ---- */
  S['l2-state-value'] = {
    kicker: 'L2 · §2.3',
    title: { zh: '状态价值：把"平均回报"钉进数学', en: 'State Values: Pinning "Average Return" into Mathematics' },
    blocks: [
      { t: 'p', zh: '先升级记号。时刻 t 智能体在状态 S<sub>t</sub>，按策略选动作 A<sub>t</sub>，环境给出下一状态 S<sub>t+1</sub> 和奖励 R<sub>t+1</sub>，简写 S<sub>t</sub> --A<sub>t</sub>--> S<sub>t+1</sub>, R<sub>t+1</sub>。<strong>注意这些全是随机变量</strong>（大写字母）：策略可能掷骰子、环境可能刮风。沿时间轴铺开就得到一条随机轨迹，其折扣回报 G<sub>t</sub> = R<sub>t+1</sub> + γR<sub>t+2</sub> + γ²R<sub>t+3</sub> + … 自然也是随机变量——同一状态出发，这次走运、下次倒霉。', en: 'First upgrade the notation. At time t the agent is in state S<sub>t</sub>, picks action A<sub>t</sub> by the policy, and the environment returns the next state S<sub>t+1</sub> and reward R<sub>t+1</sub>, concisely S<sub>t</sub> --A<sub>t</sub>--> S<sub>t+1</sub>, R<sub>t+1</sub>. <strong>Note these are all random variables</strong> (capital letters): the policy may roll dice, the environment may blow wind. Laid along the timeline they form a random trajectory whose discounted return G<sub>t</sub> = R<sub>t+1</sub> + γR<sub>t+2</sub> + γ²R<sub>t+3</sub> + … is itself a random variable — same start, different luck.' },
      { t: 'formula', lbl: '状态价值的定义 · Definition of the state value',
        html: 'v<sub>π</sub>(s) <span class="mt">.=</span> E[G<sub>t</sub> | S<sub>t</sub> = s]' },
      { t: 'p', zh: '<strong>状态价值</strong>就是"从 s 出发、按 π 走，能拿到的回报的平均值"。三条备注（书上的 ⋄）逐条过：① v<sub>π</sub>(s) <strong>依赖 s</strong>——定义里就带着条件"从哪出发"；② v<sub>π</sub>(s) <strong>依赖 π</strong>——轨迹是按策略生成的，换策略换价值；③ v<sub>π</sub>(s) <strong>不依赖 t</strong>——模型平稳时，价值只由 (s, π) 决定，与"现在几点"无关。', en: 'The <strong>state value</strong> is the average return obtainable from s under π. Three remarks (the book\'s diamonds): ① v<sub>π</sub>(s) <strong>depends on s</strong> — the definition carries the condition "starting where"; ② v<sub>π</sub>(s) <strong>depends on π</strong> — trajectories are generated by the policy, different policy different value; ③ v<sub>π</sub>(s) <strong>does not depend on t</strong> — with a stationary model, value is fixed by (s, π), not by the clock.' },
      { t: 'callout', variant: 'key', zh: '于是评价策略有了正式的尺子：<strong>状态价值更大的策略更好</strong>。上一节 return₁ > return₃ > return₂ 的比较，如今可以升级为 v<sub>π₁</sub>(s1) > v<sub>π₃</sub>(s1) > v<sub>π₂</sub>(s1)。问题只剩一个：怎么把 v<sub>π</sub>(s) 算出来？答案是下一节的 Bellman 方程。', en: 'Policy evaluation now has its formal ruler: <strong>the policy with greater state values is better</strong>. The comparison return₁ > return₃ > return₂ upgrades to v<sub>π₁</sub>(s1) > v<sub>π₃</sub>(s1) > v<sub>π₂</sub>(s1). One question remains: how do we actually compute v<sub>π</sub>(s)? The answer is the Bellman equation, next.' },
    ],
  };

  /* ---- §2.4 Bellman 方程 ---- */
  S['l2-bellman'] = {
    kicker: 'L2 · §2.4',
    title: { zh: 'Bellman 方程：三行推导', en: 'The Bellman Equation: A Three-Move Derivation' },
    blocks: [
      { t: 'p', zh: '推导只需要三步，每步用一个你已经拥有的东西。<strong>第一步</strong>：把回报自己"折"一下——G<sub>t</sub> = R<sub>t+1</sub> + γ(R<sub>t+2</sub> + γR<sub>t+3</sub> + …) = <strong>R<sub>t+1</sub> + γG<sub>t+1</sub></strong>。这一步在 L1 就见过（γ³/(1−γ) 的把戏），它建立了"现在"与"下一步"的联系。', en: 'The derivation takes three moves, each spending something you already own. <strong>Move one</strong>: fold the return onto itself — G<sub>t</sub> = R<sub>t+1</sub> + γ(R<sub>t+2</sub> + γR<sub>t+3</sub> + …) = <strong>R<sub>t+1</sub> + γG<sub>t+1</sub></strong>. You saw this trick in L1 (the γ³/(1−γ) manoeuvre); it links "now" with "next".' },
      { t: 'p', zh: '<strong>第二步</strong>：对 S<sub>t</sub> = s 取期望并拆成两项——v<sub>π</sub>(s) = <strong>E[R<sub>t+1</sub>|S<sub>t</sub>=s]</strong>（即时奖励的均值）+ γ<strong>E[G<sub>t+1</sub>|S<sub>t</sub>=s]</strong>（未来回报的均值）。<strong>第三步</strong>：分别把两项里的随机性摊开。第一项按全期望公式对动作 a、奖励 r 各求一次和；第二项先对下一状态 s′ 求和，用<strong>马尔可夫性</strong>把"带着历史的期望"换成"只看下一状态的期望"，再展开成 v<sub>π</sub>(s′) 的加权平均。', en: '<strong>Move two</strong>: take the expectation conditioned on S<sub>t</sub> = s and split it — v<sub>π</sub>(s) = <strong>E[R<sub>t+1</sub>|S<sub>t</sub>=s]</strong> (mean of immediate rewards) + γ<strong>E[G<sub>t+1</sub>|S<sub>t</sub>=s]</strong> (mean of future returns). <strong>Move three</strong>: unfold the randomness in each term. The first sums over actions a and rewards r via the law of total expectation; the second sums over next states s′, uses the <strong>Markov property</strong> to replace the history-laden expectation by one conditioned only on the next state, and unfolds into a weighted average of v<sub>π</sub>(s′).' },
      { t: 'formula', lbl: 'Bellman 方程（逐状态形式）· The Bellman equation (elementwise form) — Eq. (2.7)',
        html: 'v<sub>π</sub>(s) = <span style="color:var(--gold)">Σ<sub>a</sub> π(a|s) Σ<sub>r</sub> p(r|s,a) r</span> &nbsp;+&nbsp; γ <span style="color:var(--accent-deep)">Σ<sub>a</sub> π(a|s) Σ<sub>s′</sub> p(s′|s,a) v<sub>π</sub>(s′)</span>' },
      { t: 'steps', items: [
        { zh: '<strong>结构读法</strong>：金色部分 = 即时奖励的均值（这一步能拿多少），蓝色部分 = 未来回报的均值（之后能拿多少，打了 γ 折）。合起来正是 L1 的"即时 + 未来 = 回报"，只不过全部期望化了。', en: '<strong>How to read it</strong>: the golden part = mean of immediate rewards (what this step earns); the blue part = mean of future rewards (what later steps earn, discounted by γ). Together they are L1\'s "immediate + future = return", now fully expectation-ised.' },
        { zh: '<strong>三个未知数的自白</strong>：v<sub>π</sub>(s) 和 v<sub>π</sub>(s′) 是待求的未知量；π(a|s) 是给定的策略；p(r|s,a) 与 p(s′|s,a) 是系统模型。已知 π 和模型，解出所有 v——这个流程叫<strong>策略评估（policy evaluation）</strong>。', en: '<strong>Confessions of the symbols</strong>: v<sub>π</sub>(s) and v<sub>π</sub>(s′) are unknowns to solve; π(a|s) is the given policy; p(r|s,a) and p(s′|s,a) are the model. Given π and the model, solve for all v — this procedure is called <strong>policy evaluation</strong>.' },
        { zh: '<strong>两种等价写法</strong>（文献里常见）：把 p 合并写成 p(s′,r|s,a) 得 v<sub>π</sub>(s) = Σ<sub>a</sub>π(a|s)Σ<sub>s′</sub>Σ<sub>r</sub> p(s′,r|s,a)[r + γv<sub>π</sub>(s′)]；若奖励只依赖下一状态 r(s′)，则 p(r(s′)|s,a) = p(s′|s,a)，方程更短。', en: '<strong>Two equivalent forms</strong> (common in the literature): merge the probabilities as p(s′,r|s,a) to get v<sub>π</sub>(s) = Σ<sub>a</sub>π(a|s)Σ<sub>s′</sub>Σ<sub>r</sub> p(s′,r|s,a)[r + γv<sub>π</sub>(s′)]; if reward depends only on the next state, r(s′), then p(r(s′)|s,a) = p(s′|s,a) and the equation shortens.' },
      ]},
    ],
  };

  /* ---- §2.5 两个例子 ---- */
  S['l2-examples'] = {
    kicker: 'L2 · §2.5',
    title: { zh: '两个例子：亲手写一遍 Bellman 方程', en: 'Two Examples: Writing the Bellman Equation by Hand' },
    blocks: [
      { t: 'p', zh: '公式看一百遍不如亲手代一次。还是那个 2×2 世界（s1 起点在左上，右上角是禁区 s2，左下是 s3，右下角是目标 s4；到目标 +1，进禁区 −1，在目标原地每步 +1）。<strong>例 1（确定性策略）</strong>：s1 向下（避开禁区）、s2 向下、s3 向右、s4 原地。把 π 和 p 全部代入 (2.7)，每个状态的大公式瞬间缩成一行：', en: 'Reading a formula a hundred times loses to substituting into it once. Return to the 2×2 world (s1 top-left, s2 forbidden top-right, s3 bottom-left, s4 target bottom-right; +1 entering the target, −1 the forbidden cell, +1 per step while staying there). <strong>Example 1 (deterministic policy)</strong>: s1 down (avoiding the forbidden cell), s2 down, s3 right, s4 still. Substituting π and p into (2.7), each state\'s grand formula collapses to one line:' },
      { t: 'formula', lbl: '例 1 · Example 1 — deterministic',
        html: 'v(s<sub>1</sub>) = 0 + γv(s<sub>3</sub>), &nbsp; v(s<sub>2</sub>) = 1 + γv(s<sub>4</sub>), &nbsp; v(s<sub>3</sub>) = 1 + γv(s<sub>4</sub>), &nbsp; v(s<sub>4</sub>) = 1 + γv(s<sub>4</sub>) &nbsp;⟹&nbsp; v(s<sub>4</sub>) = <span class="mt">1/(1−γ)</span>' },
      { t: 'widget', component: 'l2-chain-solve' },
      { t: 'p', zh: '<strong>例 2（随机策略）</strong>只改一处：s1 以 0.5 向右、0.5 向下。于是 v(s1) = 0.5[0 + γv(s3)] + 0.5[−1 + γv(s2)]，解得 v(s1) = <strong>−0.5 + γ/(1−γ)</strong>。取 γ = 0.9：确定性策略 v(s1) = <strong>9</strong>，随机策略 v(s1) = <strong>8.5</strong>；其余三个状态两种策略下都是 10。逐格比较 v<sub>π₁</sub>(sᵢ) ≥ v<sub>π₂</sub>(sᵢ)——"避开禁区的策略更好"这句话，第一次有了逐格的数值证明。', en: '<strong>Example 2 (stochastic policy)</strong> changes one thing only: at s1 go right 0.5, down 0.5. Then v(s1) = 0.5[0 + γv(s3)] + 0.5[−1 + γv(s2)], giving v(s1) = <strong>−0.5 + γ/(1−γ)</strong>. With γ = 0.9: deterministic v(s1) = <strong>9</strong>, stochastic v(s1) = <strong>8.5</strong>; the other three states are 10 under both. Comparing cell by cell, v<sub>π₁</sub>(sᵢ) ≥ v<sub>π₂</sub>(sᵢ) — the sentence "avoiding the forbidden area is better" gains its first per-cell numerical proof.' },
    ],
  };

  /* ---- §2.6 矩阵形式 ---- */
  S['l2-matrix'] = {
    kicker: 'L2 · §2.6',
    title: { zh: '矩阵-向量形式：把 n 个方程装进一行', en: 'Matrix-Vector Form: n Equations in One Line' },
    blocks: [
      { t: 'p', zh: 'Bellman 方程对每个状态都成立，n 个状态就是 n 个线性方程。把它们<strong>摞起来</strong>：先定义两个"策略消化物"——r<sub>π</sub>(s) = 即时奖励的均值（金色部分），p<sub>π</sub>(s′|s) = 按 π 加权后的转移概率（把动作加进去之后 s→s′ 的总概率）。每个方程变成 v<sub>π</sub>(s) = r<sub>π</sub>(s) + γ Σ<sub>s′</sub> p<sub>π</sub>(s′|s) v<sub>π</sub>(s′)。', en: 'The Bellman equation holds for every state, so n states give n linear equations. <strong>Stack them</strong>: first define two policy-digested objects — r<sub>π</sub>(s) = mean of immediate rewards (the golden part), and p<sub>π</sub>(s′|s) = the π-weighted transition probability (the total s→s′ probability after mixing in actions). Each equation becomes v<sub>π</sub>(s) = r<sub>π</sub>(s) + γ Σ<sub>s′</sub> p<sub>π</sub>(s′|s) v<sub>π</sub>(s′).' },
      { t: 'formula', lbl: '矩阵-向量形式 · Matrix-vector form — Eq. (2.10)',
        html: 'v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub>' },
      { t: 'p', zh: '其中 v<sub>π</sub>、r<sub>π</sub> ∈ ℝⁿ 是把每个状态的量摞成的向量，P<sub>π</sub> ∈ ℝ<sup>n×n</sup> 的第 (i,j) 元是 p<sub>π</sub>(s<sub>j</sub>|s<sub>i</sub>)。用例 2（随机策略）代入，P<sub>π</sub> 里全是 0、0.5、1 这样的数。P<sub>π</sub> 有两条漂亮的性质：① <strong>非负</strong>（P<sub>π</sub> ≥ 0，概率没有负数）；② <strong>随机矩阵</strong>（每行和为 1：P<sub>π</sub>1 = 1——从任何状态出发总要去某个地方）。这两条性质是下一节收敛性证明的全部原料。', en: 'where v<sub>π</sub>, r<sub>π</sub> ∈ ℝⁿ stack the per-state quantities into vectors, and P<sub>π</sub> ∈ ℝ<sup>n×n</sup> has entry (i,j) equal to p<sub>π</sub>(s<sub>j</sub>|s<sub>i</sub>). Substituting Example 2 (the stochastic policy), P<sub>π</sub> is filled with 0s, 0.5s and 1s. P<sub>π</sub> enjoys two lovely properties: ① <strong>nonnegative</strong> (P<sub>π</sub> ≥ 0 — probabilities are never negative); ② <strong>stochastic</strong> (every row sums to one: P<sub>π</sub>1 = 1 — from any state you must go somewhere). These two properties are the entire raw material of the convergence proof next.' },
    ],
  };

  /* ---- §2.7 求解 ---- */
  S['l2-solving'] = {
    kicker: 'L2 · §2.7',
    title: { zh: '求解状态值：闭式解与迭代解', en: 'Solving State Values: Closed-Form and Iterative Solutions' },
    blocks: [
      { t: 'p', zh: '"解 Bellman 方程"这个流程有个正式名字：<strong>策略评估（policy evaluation）</strong>——用状态值这把尺子给策略打分。<strong>闭式解</strong>是一行代数：v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> 是线性方程，移项得 <strong>v<sub>π</sub> = (I − γP<sub>π</sub>)⁻¹ r<sub>π</sub></strong>。书中补了一个漂亮的小证明（Gershgorin 圆盘定理）：I − γP<sub>π</sub> 的每个特征值都落在"圆心 1−γp<sub>π</sub>(sᵢ|sᵢ)、半径 γΣ<sub>j≠i</sub>p<sub>π</sub>(s<sub>j</sub>|s<sub>i</sub>)"的圆盘里，而半径 < 圆心，所以圆盘不包住原点、没有零特征值——可逆。', en: 'Solving the Bellman equation has a formal name: <strong>policy evaluation</strong> — grading the policy with the state-value ruler. The <strong>closed-form solution</strong> is one line of algebra: v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> is linear, so <strong>v<sub>π</sub> = (I − γP<sub>π</sub>)⁻¹ r<sub>π</sub></strong>. The book adds a pretty little proof (Gershgorin circle theorem): every eigenvalue of I − γP<sub>π</sub> lies in a disc centred at 1−γp<sub>π</sub>(sᵢ|sᵢ) with radius γΣ<sub>j≠i</sub>p<sub>π</sub>(s<sub>j</sub>|s<sub>i</sub>); since radius < centre, no disc encircles the origin and no eigenvalue is zero — hence invertible.' },
      { t: 'p', zh: '但实践中<strong>不用</strong>闭式解——矩阵求逆本身就要靠数值算法。真正好用的是<strong>迭代解</strong>：随便猜一个初值 v₀，反复执行 <strong>v<sub>k+1</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub></strong>。书上的证明干净利落：定义误差 δ<sub>k</sub> = v<sub>k</sub> − v<sub>π</sub>，代入更新式得 δ<sub>k+1</sub> = γP<sub>π</sub>δ<sub>k</sub>，展开 δ<sub>k+1</sub> = γ<sup>k+1</sup>P<sub>π</sub><sup>k+1</sup>δ₀；P<sub>π</sub><sup>k</sup> 的元素都不超过 1，γ<sup>k</sup> → 0，所以误差必然消失。<strong>γ < 1 就是收敛的全部理由</strong>——L1 那个"折扣率救发散"，在这里第二次立功。', en: 'In practice the closed form is <strong>not</strong> what we use — matrix inversion itself needs numerical algorithms. The genuinely useful one is the <strong>iterative solution</strong>: guess any v₀ and repeat <strong>v<sub>k+1</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub></strong>. The book\'s proof is crisp: define the error δ<sub>k</sub> = v<sub>k</sub> − v<sub>π</sub>; substituting into the update gives δ<sub>k+1</sub> = γP<sub>π</sub>δ<sub>k</sub>, hence δ<sub>k+1</sub> = γ<sup>k+1</sup>P<sub>π</sub><sup>k+1</sup>δ₀; entries of P<sub>π</sub><sup>k</sup> never exceed 1 and γ<sup>k</sup> → 0, so the error must vanish. <strong>γ < 1 is the entire reason for convergence</strong> — the discount rate that once tamed divergence takes its second bow here.' },
      { t: 'widget', component: 'l2-iter-eval' },
      { t: 'callout', variant: 'idea', zh: '书上的 Figure 2.7 还藏了一个彩蛋：<strong>两条不同的策略可以有完全相同的状态值</strong>（图中 (1,4)、(2,4) 两格箭头不同，价值表一模一样）。所以"状态值评价策略"是逐格的 ≥ 比较，而不是"价值表唯一 ⟹ 策略唯一"。', en: 'Easter egg hidden in the book\'s Figure 2.7: <strong>two different policies can share exactly the same state values</strong> (cells (1,4) and (2,4) differ in arrows yet the value tables coincide). So "evaluate policies by state values" is a cell-wise ≥ comparison, not "unique values ⟹ unique policy".' },
    ],
  };

  /* ---- §2.8 动作价值 ---- */
  S['l2-action-value'] = {
    kicker: 'L2 · §2.8',
    title: { zh: '从状态价值到动作价值', en: 'From State Value to Action Value' },
    blocks: [
      { t: 'p', zh: '状态价值回答"这个格子好不好"，还差半个问题："在这个格子里<strong>走某一步</strong>好不好？"<strong>动作价值（action value）</strong>补上它：q<sub>π</sub>(s,a) .= E[G<sub>t</sub> | S<sub>t</sub> = s, A<sub>t</sub> = a]——在 s 处先执行动作 a，之后仍按 π 走，能拿到的平均回报。它严格依赖"状态-动作对"，不是孤立的"动作价值"。', en: 'The state value answers "is this cell good?", which is half a question: "is <strong>taking a particular step</strong> here good?" The <strong>action value</strong> completes it: q<sub>π</sub>(s,a) .= E[G<sub>t</sub> | S<sub>t</sub> = s, A<sub>t</sub> = a] — execute a at s, follow π afterwards, collect the average return. It strictly depends on the state-action pair, not on an "action alone".' },
      { t: 'formula', lbl: '两条关系式：一枚硬币的两面 · Two relations: two sides of one coin — Eqs. (2.13)(2.14)',
        html: 'v<sub>π</sub>(s) = Σ<sub>a</sub> π(a|s) q<sub>π</sub>(s,a) &nbsp;&nbsp;·&nbsp;&nbsp; q<sub>π</sub>(s,a) = Σ<sub>r</sub> p(r|s,a) r + γ Σ<sub>s′</sub> p(s′|s,a) v<sub>π</sub>(s′)' },
      { t: 'widget', component: 'l2-q-bars' },
      { t: 'callout', variant: 'danger', zh: '<strong>新手常见错误</strong>：认为"策略不选的动作不用算，或者干脆设 q = 0"。<strong>错。</strong>哪怕策略永不选择 a₁，它依然有价值——在 s1 取 a₁ 会撞边界弹回（即时 −1），然后从 s1 继续：q<sub>π</sub>(s1,a₁) = −1 + γv<sub>π</sub>(s1)。为什么要在乎"策略不会选的动作"？因为<strong>可能正是策略不好才没选到它</strong>——找最优策略必须把所有动作都摆在台面上比较。这句话是第 5、7 章探索（exploration）思想的种子。', en: '<strong>A classic beginner mistake</strong>: assuming actions the policy never selects need no computation, or may be set to q = 0. <strong>Wrong.</strong> Even if the policy never picks a₁, it still has a value — at s1, a₁ bounces off the boundary (immediate −1) and the agent continues from s1: q<sub>π</sub>(s1,a₁) = −1 + γv<sub>π</sub>(s1). Why care about actions the policy would not select? Because <strong>a bad policy may be missing the best action</strong> — finding optimal policies requires comparing all actions on the table. This sentence is the seed of exploration in Chapters 5 and 7.' },
      { t: 'p', zh: '把 (2.13) 代回 (2.14)，Bellman 方程也有动作价值版本：q<sub>π</sub>(s,a) = Σ<sub>r</sub> p(r|s,a)r + γ Σ<sub>s′</sub> p(s′|s,a) Σ<sub>a′</sub> π(a′|s′) q<sub>π</sub>(s′,a′)，矩阵形式 q<sub>π</sub> = r̃ + γPΠq<sub>π</sub>。它的独特之处：r̃ 和 P 只由模型决定、与策略无关，策略全部藏在分块对角阵 Π 里。', en: 'Substituting (2.13) into (2.14) gives the action-value version of the Bellman equation: q<sub>π</sub>(s,a) = Σ<sub>r</sub> p(r|s,a)r + γ Σ<sub>s′</sub> p(s′|s,a) Σ<sub>a′</sub> π(a′|s′) q<sub>π</sub>(s′,a′), with matrix form q<sub>π</sub> = r̃ + γPΠq<sub>π</sub>. Its specialty: r̃ and P depend only on the model, while the policy hides entirely in the block-diagonal Π.' },
    ],
  };

  /* ---- §2.9 总结 ---- */
  S['l2-summary'] = {
    kicker: 'L2 · §2.9',
    title: { zh: '本章总结：一把尺子和一台发动机', en: 'Chapter Summary: One Ruler and One Engine' },
    blocks: [
      { t: 'p', zh: '本章交付了两个东西。<strong>一把尺子</strong>：状态价值 v<sub>π</sub>(s) = E[G<sub>t</sub>|S<sub>t</sub>=s]，从此"策略好不好"有了逐格的数值答案；<strong>一台发动机</strong>：Bellman 方程 v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub>，它把所有格子的价值关系装进一个线性系统，解它就是策略评估。最容易懵的自举（bootstrapping）一旦升级成矩阵视角就烟消云散——"自己依赖自己"不过是线性代数里的一句日常。', en: 'This chapter delivers two artefacts. <strong>A ruler</strong>: the state value v<sub>π</sub>(s) = E[G<sub>t</sub>|S<sub>t</sub>=s], giving "is this policy good?" a cell-wise numerical answer. <strong>An engine</strong>: the Bellman equation v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub>, packing the value relationships of all cells into one linear system; solving it is policy evaluation. The confusing-at-first bootstrapping evaporates once upgraded to the matrix view — "depending on itself" is everyday business in linear algebra.' },
      { t: 'p', zh: '又见概念链：回报（L1）→ 平均化 → 状态价值 → 折叠 G<sub>t</sub> → Bellman 方程 → 矩阵形式 → 闭式解 / 迭代解 → 策略评估 → 动作价值（下一章最优性方程的主角）。Bellman 方程并非强化学习专利——控制论、运筹学里都有它的变体，本书在离散 MDP 框架下研究它。', en: 'The concept chain again: return (L1) → averaging → state value → folding G<sub>t</sub> → Bellman equation → matrix form → closed-form / iterative solution → policy evaluation → action value (protagonist of the next chapter\'s optimality equation). The Bellman equation is not RL-exclusive — it lives in control theory and operations research too; here it is studied under discrete MDPs.' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：状态值能评价"给定"的策略，但哪条策略<strong>最好</strong>？给"最好"下定义需要 Bellman 最优方程——先定义最优策略与最优价值，再研究它的解。γ 如何让策略变得短视或远视，也将在那里见到实物。', en: 'Next lecture teaser: state values evaluate a <em>given</em> policy, but which policy is <em>best</em>? Defining "best" requires the Bellman optimality equation — first define optimal policies and optimal values, then study their solutions. There you will also meet, in the flesh, how γ makes policies short- or far-sighted.' },
    ],
  };

  /* ---- L2 长推理 ---- */
  S['l2-reasoning'] = {
    kicker: 'L2 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：从一个数到一个方程组', en: 'The Long Coherent Reasoning: From a Number to a System' },
    blocks: [
      { t: 'p', zh: '本章的推理主线：回报只有一个样本不够 → 平均成状态价值 → 无限求和折叠成自举 → 联立成线性系统 → 迭代压缩收敛 → 升级出动作价值。逐步走一遍，别跳步。', en: 'This chapter\'s reasoning spine: one trajectory is not enough → average into the state value → fold the infinite sum into bootstrapping → assemble a linear system → iterate with contraction → upgrade to action values. Walk it step by step; do not skip.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l2' } },
    ],
  };

  /* ---- L2 代码精讲 ---- */
  S['l2-code'] = {
    kicker: 'L2 · 动手 · Hands-on',
    title: { zh: '代码精讲：把策略评估写成 20 行', en: 'Code Walkthrough: Policy Evaluation in ~20 Lines' },
    blocks: [
      { t: 'p', zh: '策略评估是无数算法的内嵌零件（第 4 章策略迭代的内环、第 9 章Actor-Critic 的评论家……），值得亲手写一遍。下面是两版实现：迭代解（实战版）与闭式解（理论版），都基于作业同款 4×4 网格世界。', en: 'Policy evaluation is an embedded part inside countless algorithms (the inner loop of policy iteration in Chapter 4, the critic of Actor-Critic in Chapter 9…), so it is worth writing by hand. Two implementations follow: the iterative solution (practical) and the closed-form solution (theoretical), both on the assignment\'s 4×4 grid world.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l2' } },
      { t: 'callout', variant: 'warn', zh: '<strong>读代码的三处心眼</strong>：① sweep 必须是"<strong>整轮算完再覆盖</strong>"（先存 v_new 再赋值）——边算边覆盖是另一个算法（第 7 章的 Gibbs/原位更新加速，$\\;\\;$想法相近但需要重新分析收敛）；② 收敛判据用 max |Δv| < θ 而不是"迭代够多次"——θ 是精度预算；③ 验收技巧：随机抽一个状态，用 v = r + γΣp·v 手算对照——作业报告里放这一段，"key parts of code explained"的分数就稳了。', en: '<strong>Three things to watch when reading the code</strong>: ① a sweep must <strong>compute the whole round before overwriting</strong> (buffer v_new, then assign) — updating in place is a different variant (in-place updates speed things up but need separate convergence analysis); ② use max |Δv| < θ as the stopping rule instead of "iterate enough times" — θ is your accuracy budget; ③ verification trick: pick a random state and hand-check v = r + γΣp·v against the output — include this in the report and the "key parts explained" marks are safe.' },
    ],
  };

  /* ---- L2 Q&A ---- */
  S['l2-qa'] = {
    kicker: 'L2 · §2.10',
    title: { zh: '问答：状态价值七连问', en: 'Q&A: Seven Questions on State Values' },
    blocks: [
      { t: 'p', zh: '书上一口气放了七个问答，全部直击本章要害。这里挑六张做成卡片，外加一张"常见错误"代码卡。', en: 'The book packs seven Q&As, all hitting vital spots. Six become cards here, plus one bonus card on a common coding mistake.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l2' } },
    ],
  };

  /* ═══ L2 长推理链 ═══ */
  const l2reasoning = [
    { link: '起点 · Start',
      title: { zh: '一条轨迹不够', en: 'One trajectory is not enough' },
      zh: 'L1 用"两条轨迹的回报比较"评价了策略，但随机策略下同一个起点能走出多条轨迹——C 策略一半走好一半踩禁区，"它的回报是多少"根本没答案。',
      en: 'L1 judged policies by comparing two trajectories, but under a stochastic policy the same start yields many trajectories — Policy C goes good half the time, forbidden the other half; "its return" has no single answer.',
      question: '如何把"多个可能的回报"压成一个数？' },
    { link: '平均 · Average',
      title: { zh: '对回报取期望：状态价值', en: 'Take the expectation: the state value' },
      zh: 'v(s) = E[G_t | S_t = s]。它依赖 s（条件里有出发状态）、依赖 π（轨迹由策略生成）、不依赖 t（平稳模型）。从此评价策略 = 比较状态值，逐格进行。',
      en: 'v(s) = E[G_t | S_t = s]. It depends on s (the condition encodes the start), on π (trajectories follow the policy), and not on t (stationary model). Evaluating policies becomes a cell-wise comparison of state values.',
      question: '这个期望怎么算？直接按定义求和吗？' },
    { link: '折叠 · Fold',
      title: { zh: 'G_t 折叠：R_{t+1} + γG_{t+1}', en: 'Fold G_t: R_{t+1} + γG_{t+1}' },
      zh: '把无穷级数拆成"首项 + γ×尾部"。尾部恰好是下一时刻的回报 G_{t+1}——这是 L1 几何级数技巧的变体，但目的变了：不是为了收敛，而是为了建立递归结构。',
      en: 'Split the infinite series into "first term + γ×tail", and the tail is exactly the next return G_{t+1} — a variant of L1\'s geometric trick, but with a new purpose: not convergence now, but a recursive structure.',
      question: '对递归式取期望会发生什么？' },
    { link: '展开 · Unfold',
      title: { zh: '期望拆两项 → Bellman 方程', en: 'Split the expectation → the Bellman equation' },
      zh: 'E[R_{t+1}] 按全期望公式对动作和奖励摊开（金色项）；E[G_{t+1}] 先对下一状态摊开，再用马尔可夫性换成 v(s′) 的加权平均（蓝色项）。得到 v(s) = Σ_a π(a|s)[Σ_r p(r|s,a)r + γΣ_{s′} p(s′|s,a)v(s′)]。',
      en: 'E[R_{t+1}] unfolds over actions and rewards by total expectation (golden term); E[G_{t+1}] unfolds over next states, then the Markov property swaps it for a weighted average of v(s′) (blue term). Result: v(s) = Σ_a π(a|s)[Σ_r p(r|s,a)r + γΣ_{s′} p(s′|s,a)v(s′)].',
      question: '未知数依赖未知数，这怎么解？' },
    { link: '解惑 · The paradox resolved',
      title: { zh: '自举不是循环，是联立方程', en: 'Bootstrapping is not circular; it is simultaneous equations' },
      zh: 'n 个状态 n 个方程，每个方程形如 v_i = r_i + γΣ_j P_ij v_j。小学的观点"先有鸡还是先有蛋"在这里失效，代数的观点生效：联立求解。就像 x − y = 1 与 x + y = 3 各自解不出，合在一起立得 x=2, y=1。',
      en: 'n states give n equations, each v_i = r_i + γΣ_j P_ij v_j. The chicken-and-egg viewpoint fails here; the algebraic viewpoint works: solve simultaneously. Just as x − y = 1 and x + y = 3 are unsolvable alone but instantly give x=2, y=1 together.',
      question: '联立方程最紧凑的写法是什么？' },
    { link: '装订 · Bind',
      title: { zh: '矩阵-向量形式 v = r + γPv', en: 'Matrix-vector form v = r + γPv' },
      zh: '把 n 个方程装进一个线性系统：v、r 是 n 维向量，P 是 n×n 转移矩阵（非负、行和为 1）。Bellman 方程的真身从此现形——它不是一条公式，是一个线性方程组。',
      en: 'Pack the n equations into one linear system: v, r are n-vectors and P the n×n transition matrix (nonnegative, row-stochastic). The Bellman equation\'s true identity shows itself: not a formula but a linear system.',
      question: '线性系统有解析解吗？实践中用它吗？' },
    { link: '两解 · Two solutions',
      title: { zh: '闭式解管理论，迭代解管实践', en: 'Closed form for theory, iteration for practice' },
      zh: 'v* = (I − γP)⁻¹r 一行解决——Gershgorin 圆盘保证 I − γP 可逆；但求逆本身昂贵，实际用 v_{k+1} = r + γPv_k 反复扫。误差 δ_{k+1} = γPδ_k 一路乘 γ 衰减：γ<1 就是收敛的全部理由。解 Bellman 方程 = 策略评估，这是无数算法的内环。',
      en: 'v* = (I − γP)⁻¹r solves it in one line — Gershgorin discs guarantee I − γP is invertible; but inversion is costly, so practice iterates v_{k+1} = r + γPv_k. The error δ_{k+1} = γPδ_k keeps multiplying by γ: γ<1 is the entire reason it converges. Solving the Bellman equation = policy evaluation, the inner loop of countless algorithms.',
      question: '状态价值之下还有更细的量吗？' },
    { link: '细分 · Refine',
      title: { zh: '动作价值 q(s,a)：决策的最小单位', en: 'Action value q(s,a): the smallest unit of decision' },
      zh: 'v(s) = Σ_a π(a|s) q(s,a)：状态价值是动作价值的期望；q(s,a) = 即时均值 + γΣ_{s′} p·v(s′)：动作价值靠下一状态价值定义。未被策略选中的动作也有 q 值——可能策略不好才没选到它，为"探索"埋下伏笔。',
      en: 'v(s) = Σ_a π(a|s) q(s,a): the state value is the expectation of action values; q(s,a) = immediate mean + γΣ_{s′} p·v(s′): the action value leans on next-state values. Even unselected actions have q values — a bad policy may be missing the best one, planting the seed of exploration.',
      question: null },
  ];
  D.reasoningSets = D.reasoningSets || {};
  D.reasoningSets['l2'] = l2reasoning;

  /* ═══ L2 代码块 ═══ */
  const srcPeIter = `import numpy as np

def build_model(env):
    """Deterministic-model extraction: for every (s, a) return
    (next_state, reward). This is the 'model' p(s'|s,a), p(r|s,a)."""
    model = {}
    for s in range(env.num_states):
        for a, action in enumerate(env.action_space):
            model[(s, a)] = env._get_next_state_and_reward(
                (s % env.env_size[0], s // env.env_size[0]), action)
    return model

def policy_evaluation(env, policy_matrix, gamma=0.9, theta=1e-6, max_sweeps=10_000):
    """Iterative solution of the Bellman equation (Eq. 2.11):
        v_{k+1} = r_pi + gamma * P_pi @ v_k
    policy_matrix: (num_states, num_actions), each row sums to 1."""
    model = build_model(env)
    n = env.num_states
    v = np.zeros(n)                        # v0: any initial guess works
    for k in range(max_sweeps):
        v_new = np.zeros(n)                # buffer: compute the WHOLE sweep first
        for s in range(n):
            q = 0.0
            for a, pa in enumerate(policy_matrix[s]):
                if pa == 0.0:
                    continue               # unselected actions contribute 0 probability
                (x, y), r = model[(s, a)]
                s_next = y * env.env_size[0] + x
                q += pa * (r + gamma * v[s_next])   # <- the Bellman right-hand side
            v_new[s] = q
        delta = np.max(np.abs(v_new - v))  # stopping criterion: max |dv|
        v = v_new
        if delta < theta:                  # contraction finished
            break
    return v, k + 1`;

  const srcPeClosed = `def policy_evaluation_closed_form(env, policy_matrix, gamma=0.9):
    """Closed-form solution (Eq. 2.7.1):  v = (I - gamma*P)^{-1} r.
    Great for theory and tiny problems; never used at scale."""
    model = build_model(env)
    n = env.num_states
    P = np.zeros((n, n))                   # P[s, s'] = p_pi(s'|s)
    r = np.zeros(n)                        # r[s]    = mean of immediate rewards
    for s in range(n):
        for a, pa in enumerate(policy_matrix[s]):
            if pa == 0.0:
                continue
            (x, y), rew = model[(s, a)]
            s_next = y * env.env_size[0] + x
            P[s, s_next] += pa             # rows sum to 1  (stochastic matrix)
            r[s] += pa * rew               # immediate-reward mean
    v = np.linalg.solve(np.eye(n) - gamma * P, r)   # (I - gamma*P)^{-1} r
    return v

if __name__ == "__main__":
    # Assignment-style world: 4x4, forbidden s8/s10, target s12, gamma = 0.9
    env = GridWorld(env_size=(4, 4), target_state=(3, 2),
                    forbidden_states=[(3, 1), (1, 2)])
    policy = np.full((env.num_states, 5), 0.2)      # uniform random policy
    v_iter, sweeps = policy_evaluation(env, policy)
    v_closed = policy_evaluation_closed_form(env, policy)
    print("sweeps:", sweeps)                         # ~ a few hundred
    print(np.round(v_iter, 4).reshape(4, 4))
    print(np.max(np.abs(v_iter - v_closed)))          # ~ 1e-09: identical`;

  D.codeFileSets = D.codeFileSets || {};
  D.codeFileSets['l2'] = [
    {
      id: 'l2-iter', file: 'policy_evaluation.py — 迭代解', tab: '① 迭代解（实战）',
      intro: { zh: '迭代版就是 Bellman 方程本方程：<code class="inline">q += pa * (r + gamma * v[s_next])</code> 这一行就是 v<sub>π</sub>(s) = Σ<sub>a</sub>π(a|s)[r + γv<sub>π</sub>(s′)] 的代码化身。<code class="inline">build_model</code> 把老师环境的 if/elif 规则"蒸馏"成 (下一状态, 奖励) 查找表——这就是有模型方法手里的 p(s′|s,a) 和 p(r|s,a)。', en: 'The iterative version IS the Bellman equation itself: the line <code class="inline">q += pa * (r + gamma * v[s_next])</code> is the code form of v<sub>π</sub>(s) = Σ<sub>a</sub>π(a|s)[r + γv<sub>π</sub>(s′)]. <code class="inline">build_model</code> distils the teacher environment\'s if/elif rules into a (next_state, reward) lookup table — exactly the p(s′|s,a) and p(r|s,a) that model-based methods hold.' },
      code: srcPeIter,
      notes: [
        { lines: [10, 10], tag: 'v0', zh: '初值 v₀ 可以随便猜（全零最常用）——压缩映射保证从哪里出发都收敛到同一个 v<sub>π</sub>。初值好坏只影响要扫多少轮，不影响终点。', en: 'The initial guess v₀ can be anything (zeros are typical) — the contraction map guarantees convergence to the same v<sub>π</sub> from any start. The guess affects only how many sweeps, never the destination.' },
        { lines: [14, 19], tag: 'sweep ★', zh: '整个 sweep 用 v_new 缓冲、算完才覆盖 v——这是"同步更新"。若直接在 v 上改（异步更新）通常收敛更快，但那是另一种算法变体，分析要重来；初学务必先写同步版。', en: 'The whole sweep buffers into v_new and only then overwrites v — "synchronous updates". Updating v directly (asynchronous/in-place) often converges faster but is a different variant needing fresh analysis; write the synchronous version first.' },
        { lines: [17, 17], tag: 'skip zeros', zh: '<code class="inline">if pa == 0: continue</code>：概率为零的动作不贡献期望，跳过省时间——数学上等价，工程上是常识。确定性策略因此只算 1 个动作。', en: '<code class="inline">if pa == 0: continue</code>: zero-probability actions contribute nothing to the expectation — mathematically identical, computationally polite. A deterministic policy thus evaluates one action per state.' },
        { lines: [18, 19], tag: 'bellman line ★', zh: '<strong>全文件核心行</strong>：pa × (即时奖励 r + γ × 下一状态价值)。它与 (2.7) 逐符号对应：π(a|s)、p(r|s,a)r（这里奖励确定所以直接用 r）、γv<sub>π</sub>(s′)。看懂这一行，Bellman 方程就不再是公式而是循环体。', en: '<strong>The core line of the file</strong>: pa × (immediate reward r + γ × next-state value). It maps symbol-by-symbol onto (2.7): π(a|s), p(r|s,a)r (the reward is deterministic here so r is used directly), and γv<sub>π</sub>(s′). Once this line is clear, the Bellman equation stops being a formula and becomes a loop body.' },
        { lines: [22, 25], tag: 'stop', zh: '收敛判据 max|v_new − v| < θ：当一整轮扫下来所有格子的变化都小于精度预算 θ，压缩映射已经把误差压到 θ 量级，可以停了。max_sweeps 是保险丝，防止 θ 设得过小跑个没完。', en: 'The stopping rule max|v_new − v| < θ: when a full sweep moves every cell by less than the accuracy budget θ, the contraction has squeezed the error to θ scale — stop. max_sweeps is a fuse preventing an endless run if θ is set absurdly small.' },
      ],
    },
    {
      id: 'l2-closed', file: 'policy_evaluation_closed_form.py — 闭式解', tab: '② 闭式解（理论）',
      intro: { zh: '闭式版把"解方程"这件事原封不动交给线性代数：手工组装 P 和 r，然后 <code class="inline">np.linalg.solve</code> 解 (I − γP)v = r。<strong>它是检验迭代解的标尺</strong>——两个版本输出应该只差数值精度。作业里若要展示"两种方法互相验证"，这两段代码拼起来就是完整证据链。', en: 'The closed-form version hands "solving the system" to linear algebra untouched: assemble P and r by hand, then let <code class="inline">np.linalg.solve</code> crack (I − γP)v = r. <strong>It is the yardstick that checks the iterative solution</strong> — the two should agree to numerical precision. For the assignment\'s "verify both ways", these two functions together are the complete evidence chain.' },
      code: srcPeClosed,
      notes: [
        { lines: [9, 15], tag: 'assemble', zh: '组装阶段：P[s,s_next] += pa 用 += 而不是 =，因为不同动作可能转移到同一状态（比如两个方向都撞墙）——概率要累加；r[s] 同理是按 π 加权的即时奖励均值。', en: 'Assembly: P[s,s_next] += pa uses += not =, because different actions may transition to the same state (say, two directions both hit the wall) — probabilities must accumulate; r[s] likewise accumulates the π-weighted immediate-reward mean.' },
        { lines: [12, 12], tag: 'stochastic', zh: '组装完可以自查：<code class="inline">P.sum(axis=1)</code> 应该全是 1（随机矩阵性质 P1 = 1）。如果某行不是 1，说明 policy_matrix 那一行没归一化——错误会在求解阶段才爆成奇怪的价值，提前查一行省一小时。', en: 'After assembly, self-check: <code class="inline">P.sum(axis=1)</code> must be all ones (the stochastic-matrix property P1 = 1). A row that is not 1 means that row of policy_matrix was not normalised — the bug would only explode later as bizarre values; one early line saves an hour.' },
        { lines: [17, 17], tag: 'solve', zh: '<code class="inline">np.linalg.solve(I − γP, r)</code> 解的是线性方程组而非显式求逆——数值上比 <code class="inline">inv(I−γP) @ r</code> 更稳更快。教科书写作 (I−γP)⁻¹r，工程实现永远优先 solve。', en: '<code class="inline">np.linalg.solve(I − γP, r)</code> solves the linear system rather than inverting explicitly — numerically steadier and faster than <code class="inline">inv(I−γP) @ r</code>. Textbooks write (I−γP)⁻¹r; engineering always prefers solve.' },
        { lines: [20, 28], tag: 'main ★', zh: '主程序就是作业规格：4×4、禁区 (3,1)/(1,2)、目标 (3,2)、均匀随机策略（每格 0.2）。跑起来后打印 sweep 数和两种解的差——差值在 1e−9 量级即验证通过。这个"两种独立方法得到同一答案"的检查，比任何单方面输出都更有说服力。', en: 'The main block is the assignment spec: 4×4, forbidden (3,1)/(1,2), target (3,2), uniform random policy (0.2 everywhere). Run it to print the sweep count and the gap between the two solutions — a gap around 1e−9 means verified. This "two independent methods, one answer" check is more persuasive than any single output.' },
      ],
    },
  ];

  /* ═══ L2 Q&A ═══ */
  D.qaSets = D.qaSets || {};
  D.qaSets['l2'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '状态价值和回报是什么关系？', en: 'What is the relation between state values and returns?' },
      a: { zh: '状态价值是"从该状态出发能获得的回报的平均值"。确定性情形下（策略和模型都确定）回报只有一条，价值就等于回报；随机情形下回报有很多条，价值是它们的期望。', en: 'The state value is the mean of the returns obtainable from that state. Under fully deterministic policy and model there is only one return and the value equals it; under randomness there are many, and the value is their expectation.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '为什么要关心状态价值？', en: 'Why do we care about state values?' },
      a: { zh: '因为它们能评价策略：状态值更大的策略更好。更进一步，<strong>最优策略本身就是用状态值定义的</strong>——这句话在第 3 章兑现，是连接"评价"与"寻优"的桥梁。', en: 'Because they evaluate policies: greater state values mean a better policy. More deeply, <strong>optimal policies are themselves defined via state values</strong> — redeemed in Chapter 3, bridging "evaluation" and "optimisation".' } },
    { tag: 'Q3 · 书上原问', q: { zh: '为什么要研究矩阵-向量形式？', en: 'Why study the matrix-vector form?' },
      a: { zh: 'Bellman 方程本质是 n 个状态的联立线性方程组，单看一条公式会误以为"一个未知数靠另一个未知数"是循环论证。写成 v = r + γPv 才能一眼看清它是标准线性系统，从而得到闭式解、收敛性和迭代表述。', en: 'The Bellman equation is really a simultaneous linear system over n states; reading one formula alone makes "unknown depending on unknown" look circular. Writing v = r + γPv reveals a standard linear system, from which the closed form, the convergence proof, and the iterative scheme all fall out.' } },
    { tag: 'Q4 · 书上原问', q: { zh: '为什么解 Bellman 方程叫"策略评估"？', en: 'Why is solving the Bellman equation called "policy evaluation"?' },
      a: { zh: '因为解出的就是该策略的状态值，而状态值正是评价策略的尺子——"解方程"与"给策略打分"是同一件事的两个名字。这个流程是第 4 章策略迭代的内环，也是广义价值估计的原型。', en: 'Because its output is precisely the policy\'s state values, the very ruler for grading policies — "solving equations" and "scoring a policy" are two names for one act. It becomes the inner loop of policy iteration in Chapter 4 and the prototype of value estimation generally.' } },
    { tag: 'Q5 · 书上原问', q: { zh: '状态价值和动作价值是什么关系？', en: 'What is the relation between state values and action values?' },
      a: { zh: '一面两枚：v(s) = Σ<sub>a</sub>π(a|s)q(s,a)（状态值是动作值的期望）；q(s,a) = 即时均值 + γΣ<sub>s′</sub>p(s′|s,a)v(s′)（动作值靠下一状态值定义）。往后看：找最优策略时，动作价值比状态价值更"贴身"。', en: 'Two sides of one coin: v(s) = Σ<sub>a</sub>π(a|s)q(s,a) (state value = expectation of action values); q(s,a) = immediate mean + γΣ<sub>s′</sub>p(s′|s,a)v(s′) (action value leans on next-state values). Looking ahead: when hunting optimal policies, action values are the more intimate quantity.' } },
    { tag: 'Q6 · 书上原问', q: { zh: '为什么要关心策略不会选的动作的价值？', en: 'Why care about values of actions the policy would not select?' },
      a: { zh: '因为"策略没选"不等于"动作不好"——很可能是策略本身不好才错过了最好的动作。要找最优策略就必须比较所有动作的价值；这是第 5 章蒙特卡洛探索、第 7 章 ε-greedy 的思想源头。', en: '"Not selected" does not mean "not good" — quite possibly the policy itself is bad and missed the best action. Finding optimal policies requires comparing all action values; this is the intellectual source of Monte Carlo exploration in Chapter 5 and ε-greedy in Chapter 7.' } },
    { tag: 'Q7 · 代码补充', q: { zh: '迭代策略评估里，为什么必须"整轮算完再覆盖"，而不是边算边更新？', en: 'In iterative policy evaluation, why buffer a full sweep instead of updating in place?' },
      a: { zh: '同步更新（整轮缓冲）对应书上的 v<sub>k+1</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>，收敛证明就是按这个形式给的；边算边覆盖是异步（in-place）变体，通常收敛更快，但那是不同的更新规则，需要重新证明。初学阶段先写同步版：行为可预测、和教材一一对应、便于验收。', en: 'Synchronous updates (full buffering) correspond exactly to v<sub>k+1</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>, whose convergence the book proves in that form; in-place updating is an asynchronous variant that often converges faster but follows a different update rule requiring a fresh proof. Learn the synchronous version first: predictable behaviour, one-to-one with the textbook, easy to verify.' } },
  ];

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 2,
    label: 'L2 · 状态价值与 Bellman 方程',
    items: [
      { id: 'l2-why', zh: '动机一：回报为何重要', en: '§2.1 Why returns matter' },
      { id: 'l2-bootstrap', zh: '动机二：回报怎么算', en: '§2.2 Bootstrapping' },
      { id: 'l2-state-value', zh: '状态价值', en: '§2.3 State values' },
      { id: 'l2-bellman', zh: 'Bellman 方程推导', en: '§2.4 The Bellman equation' },
      { id: 'l2-examples', zh: '两个手算例子', en: '§2.5 Two examples' },
      { id: 'l2-matrix', zh: '矩阵-向量形式', en: '§2.6 Matrix-vector form' },
      { id: 'l2-solving', zh: '求解：闭式与迭代', en: '§2.7 Solving the equation' },
      { id: 'l2-action-value', zh: '动作价值', en: '§2.8 Action values' },
      { id: 'l2-summary', zh: '本章总结', en: '§2.9 Summary' },
      { id: 'l2-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l2-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l2-qa', zh: '问答', en: 'Q&A · §2.10' },
    ],
  });
  const l2 = D.otherLectures.find(l => l.no === 2);
  if (l2) l2.done = true;
})();
