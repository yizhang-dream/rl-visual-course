/* ═══════════════════════════════════════════════════════════
   L3 · Bellman 最优方程（书 Ch.3）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §3.1 动机 ---- */
  S['l3-improve'] = {
    kicker: 'L3 · §3.1',
    title: { zh: '动机：手里这套策略，怎么改好一点？', en: 'Motivation: How Can We Improve a Given Policy?' },
    blocks: [
      { t: 'p', zh: 'L2 让我们能给任意策略打分了。新的问题立刻顶上来：打完分发现策略不好，<strong>怎么改？</strong>书里用 2×2 链条做示范：当前策略在 s1 选 a2（向右、闯禁区），直觉上应该改成 a3（向下、绕开禁区）。直觉这次照样可以算：先用 Bellman 方程解出当前策略的状态值（γ = 0.9）：v(s1) = 8，v(s2) = v(s3) = v(s4) = 10；再算 s1 处五个动作的动作价值。', en: 'L2 lets us grade any policy. The next question pushes in immediately: the grade is bad — <strong>how do we improve it?</strong> The book demonstrates on the 2×2 chain: the current policy takes a2 (right, into the forbidden cell) at s1; intuition says switch to a3 (down, avoiding it). Once again intuition can be computed: first solve the current policy\'s state values via the Bellman equation (γ = 0.9): v(s1) = 8, v(s2) = v(s3) = v(s4) = 10; then compute the action values of all five actions at s1.' },
      { t: 'widget', component: 'l3-improve' },
      { t: 'callout', variant: 'key', zh: '<strong>这就是"策略改进"的全部秘密</strong>：把每个动作的 q 值摆上桌，选最大的换上去。a₃ 的 q = 9 是五个里最大的——换！v(s1) 从 8 涨到 9。"选 q 值最大的动作"这个朴素动作，是今后<strong>几乎所有</strong>强化学习算法的发动机：第 4 章策略迭代改进策略靠它，第 7 章 Q-learning 的贪心也靠它。剩下的问题（如果每个状态都这样改会怎样？最优策略一定存在吗？长什么样？）正是本章要回答的。', en: '<strong>This is the entire secret of policy improvement</strong>: lay the q values of every action on the table and swap in the argmax. a₃ has the greatest q = 9 — switch! v(s1) rises from 8 to 9. This humble move, "select the action with the greatest q", is the engine of <strong>almost every</strong> RL algorithm to come: policy iteration in Chapter 4 improves with it, Q-learning\'s greedy step in Chapter 7 leans on it. The remaining questions (what if we improve everywhere? do optimal policies always exist? what do they look like?) are exactly what this chapter answers.' },
      { t: 'p', zh: '把这一节放进全局坐标系：L2 回答"给定策略值多少分"（评估），本章回答"所有策略里谁最高"（寻优）。暴力比对走不通——仅确定性策略就有 |A|<sup>|S|</sup> 条：书里 5 动作 × 9 状态的 3×3 世界已是 5<sup>9</sup> ≈ 195 万条，4×4 作业世界是 5<sup>16</sup> ≈ 1526 亿条，逐条评估等于不做事。出路是把"寻优"写进方程，让方程自己挑出最好的策略——这正是 BOE 登场的方式。先吃一颗定心丸：有限 MDP（状态、动作都有限）里<strong>最优策略必定存在</strong>——本章稍后将证明 BOE 有唯一解 v*，其贪心策略就是最优策略，存在性与可计算性一并落定。', en: 'Place this section in global coordinates: L2 answered "what is a given policy worth" (evaluation); this chapter answers "which policy scores highest among all" (search). Brute-force comparison is a dead end — there are |A|<sup>|S|</sup> deterministic policies alone: the book’s 5-action × 9-state 3×3 world already has 5<sup>9</sup> ≈ 1.95 million, and the 4×4 assignment world has 5<sup>16</sup> ≈ 1.5×10¹¹; evaluating one by one amounts to doing nothing. The way out is to write "optimising" into an equation and let the equation pick the best policy itself — which is exactly how the BOE enters. One reassurance up front: in a finite MDP (finitely many states and actions) an <strong>optimal policy always exists</strong> — later this chapter proves the BOE has a unique solution v*, whose greedy policy is optimal, settling existence and computability in one stroke.' },
    ],
  };

  /* ---- §3.2 定义 ---- */
  S['l3-definition'] = {
    kicker: 'L3 · §3.2',
    title: { zh: '什么叫"最优"？先把它定义清楚', en: 'What Does "Optimal" Mean? Define It First' },
    blocks: [
      { t: 'p', zh: '"找最优策略"之前必须先说清什么叫最优，否则找到了也不认识。书上的定义建立在状态值上：<strong>若 v<sub>π₁</sub>(s) ≥ v<sub>π₂</sub>(s) 对所有 s 成立，则 π₁ 不差于 π₂</strong>；若某个策略不差于<strong>所有其他策略</strong>，它就是<strong>最优策略（optimal policy）</strong>，它的状态值叫<strong>最优状态值（optimal state values）</strong>。', en: 'Before seeking optimal policies we must say what "optimal" means, or we would not recognise one. The book\'s definition is built on state values: <strong>if v<sub>π₁</sub>(s) ≥ v<sub>π₂</sub>(s) for all s, then π₁ is no worse than π₂</strong>; a policy no worse than <strong>every other policy</strong> is an <strong>optimal policy</strong>, and its state values are the <strong>optimal state values</strong>.' },
      { t: 'steps', items: [
        { zh: '<strong>存在性</strong>：最优策略真的存在吗？不存在就不用白费劲设计算法了。', en: '<strong>Existence</strong>: does an optimal policy exist at all? If not, designing algorithms is pointless.' },
        { zh: '<strong>唯一性</strong>：最优策略只有一个吗？', en: '<strong>Uniqueness</strong>: is the optimal policy unique?' },
        { zh: '<strong>随机性</strong>：最优策略是确定性的还是随机的？', en: '<strong>Stochasticity</strong>: is the optimal policy deterministic or stochastic?' },
        { zh: '<strong>算法</strong>：怎么把最优策略和最优状态值算出来？', en: '<strong>Algorithm</strong>: how do we actually compute them?' },
      ]},
      { t: 'callout', variant: 'idea', zh: '<strong>定义的精细处：是"逐格全胜"，不是"总分更高"。</strong>两个策略可能各有所长——π₁ 在 s1 更好、π₂ 在 s2 更好，互不支配；"v<sub>π₁</sub> ≥ v<sub>π₂</sub> 对<strong>所有</strong> s 成立"因此是个很强的要求：比的是整张价值表，不是平均值或加权和。也正因为它强，最优策略的存在才不是废话——随机策略有不可数无穷多条，其中要有一条全胜，需要证明（本章用 BOE 的解来完成）。另一个直接推论：<strong>v* 必然唯一</strong>——任何最优策略的价值表都等于逐状态的上确界，夹出来只能是同一张表；但取得 v* 的策略可以不唯一（§3.4 有实例）。', en: '<strong>A subtlety of the definition: "winning every cell", not "a higher total".</strong> Two policies may each hold home turf — π₁ better at s1, π₂ better at s2, neither dominating — so "v<sub>π₁</sub> ≥ v<sub>π₂</sub> for <strong>all</strong> s" is a demanding requirement: the whole value table is compared, not an average or a weighted sum. Precisely because it is demanding, the existence of an optimal policy is no triviality — among uncountably many stochastic policies one must dominate all, a claim that needs proof (this chapter delivers it via the solution of the BOE). One direct corollary: <strong>v* is necessarily unique</strong> — every optimal policy’s value table equals the per-state supremum, squeezed into one and the same table; yet the policies attaining v* need not be unique (§3.4 exhibits examples).' },
      { t: 'p', zh: '这四个问题看着像哲学，其实都是数学题，而且共用一把钥匙——<strong>Bellman 最优方程（Bellman optimality equation, BOE）</strong>。接下来的路线：写出 BOE → 证明它有唯一解 → 给出解它的迭代算法 → 证明解出来就是最优。四连问一次全清。', en: 'These four questions look philosophical but are mathematical, and they share one key — the <strong>Bellman optimality equation (BOE)</strong>. The route: write the BOE → prove it has a unique solution → give an iterative algorithm → prove the solution is optimal. Four questions cleared in one sweep.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"最优的定义","en":"defining optimal","d":{"zh":"vπ₁(s) ≥ vπ₂(s) 对所有 s 成立，π₁ 才不差于 π₂；不差于一切策略者为最优。","en":"π₁ is no worse than π₂ only if vπ₁(s) ≥ vπ₂(s) for every s; no worse than all makes it optimal."}},
        {"zh":"逐格全胜","en":"per-state sweep","d":{"zh":"比的是整张价值表，不是总分或平均值——要求很强，存在性需要证明。","en":"The whole value table is compared, not a total score — a strong demand whose existence still needs proof."}},
        {"zh":"四个问题","en":"four questions","d":{"zh":"存在？唯一？随机？算法？四问看着像哲学，其实都是数学题。","en":"Existence? Uniqueness? Randomness? An algorithm? Four questions that look philosophical but are all mathematics."}},
        {"zh":"一把钥匙","en":"one key","d":{"zh":"写出 BOE → 证明唯一解 → 给迭代算法 → 证明解出即最优，四连问一次全清。","en":"Write the BOE, prove a unique solution, give the iteration, show it is optimal — all four at once."}},
      ] } },
    ],
  };

  /* ---- §3.3 BOE ---- */
  S['l3-boe'] = {
    kicker: 'L3 · §3.3',
    title: { zh: 'Bellman 最优方程：把 max 写进方程', en: 'The BOE: Writing max into the Equation' },
    blocks: [
      { t: 'p', zh: 'Bellman 方程 v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> 是"给定策略"的方程。把"给定"换成"挑最好"——对每个状态，在所有可选策略 π(s) 里挑让右端最大的那个——就得到 <strong>BOE</strong>：', en: 'The Bellman equation v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> is the equation of a <em>given</em> policy. Replace "given" by "pick the best" — for each state, choose among all local policies π(s) the one maximising the right-hand side — and you get the <strong>BOE</strong>:' },
      { t: 'formula', lbl: 'Bellman 最优方程 · Eq. (3.1)',
        tex: String.raw`\begin{gathered} v(s) = \max_{\pi(s)\in\Pi(s)} \sum_a \pi(a\mid s)\,q(s,a),\quad\text{其中}\\[2pt] q(s,a) = \sum_r p(r\mid s,a)\,r + \gamma \sum_{s'} p(s'\mid s,a)\,v(s') \end{gathered}` },
      { t: 'p', zh: '<strong>一个方程怎么有两个未知数？</strong>（v 和 π）书上的回答极其干脆：一个一个解。先看两个小例子。例 3.1：x = max<sub>y</sub>(2x − 1 − y²)。无论 x 是多少，右端在 y = 0 时取最大 2x − 1，代回去解 x = 2x − 1 得 x = 1。先解"好解的"未知数，再解另一个。', en: '<strong>One equation, two unknowns?</strong> (v and π) The book\'s answer is brisk: solve them one at a time. Example 3.1: x = max<sub>y</sub>(2x − 1 − y²). Whatever x is, the right side peaks at y = 0 giving 2x − 1; substitute back, x = 2x − 1, so x = 1. Solve the easy unknown first, then the other.' },
      { t: 'p', zh: '例 3.2 是 BOE 右端的缩影：在 c₁ + c₂ + c₃ = 1、cᵢ ≥ 0 的约束下最大化 c₁q₁ + c₂q₂ + c₃q₃。结论一目了然：<strong>把全部概率押在最大的 q 上</strong>（比如 q₃ 最大就取 c₃* = 1）。代入 BOE：<strong>最优的 π(s) 就是"贪心"策略——选 q(s,a) 最大的那个动作，概率 1</strong>。于是 BOE 的右端变成 max<sub>a</sub> q(s,a)，只是 v 的函数，记作 f(v)，方程缩写成 <strong>v = f(v)</strong>——一个非线性方程。矩阵形式即 v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v)，逐元素取 max。', en: 'Example 3.2 is the BOE right side in miniature: maximise c₁q₁ + c₂q₂ + c₃q₃ subject to c₁+c₂+c₃ = 1, cᵢ ≥ 0. The conclusion is plain: <strong>put all probability on the greatest q</strong> (if q₃ is largest, take c₃* = 1). Substituting into the BOE: <strong>the optimal π(s) is the greedy policy — probability 1 on the action with the greatest q(s,a)</strong>. The right side then becomes max<sub>a</sub> q(s,a), a function of v alone, call it f(v); the equation compresses to <strong>v = f(v)</strong> — a nonlinear equation. In matrix form: v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v), elementwise max.' },
      { t: 'p', zh: '<strong>max 和期望不可交换——这是 BOE 一切特殊性的源头。</strong>两状态迷你例：下一状态 S′ 各以 0.5 落在 A 或 B；两个动作的下一站价值为 q(A,a₁)=1、q(A,a₂)=0、q(B,a₁)=0、q(B,a₂)=1。<strong>先看牌再选</strong>（到了 S′ 再取 max）：E[max<sub>a</sub> q(S′,a)] = 0.5×1 + 0.5×1 = <strong>1</strong>；<strong>先选再看牌</strong>（现在就锁死一个动作）：max<sub>a</sub> E[q(S′,a)] = max(0.5, 0.5) = <strong>0.5</strong>。差整整一倍。max 放在期望<strong>外</strong>，等于放弃"到了下一状态还能重新选择"的权利；放在期望<strong>内</strong>，这份权利才保得住。BOE 的最优性恰恰建立在后者上：每一站抵达之后都可以重新决策，所以 max 必须嵌在期望里——方程因此非线性，L2 的线性代数从此谢幕。', en: '<strong>max and expectation do not commute — the fountainhead of everything special about the BOE.</strong> A two-state miniature: the next state S′ lands on A or B with probability 0.5 each; the next-stop values of two actions are q(A,a₁)=1, q(A,a₂)=0, q(B,a₁)=0, q(B,a₂)=1. <strong>Look, then choose</strong> (take the max upon arriving at S′): E[max<sub>a</sub> q(S′,a)] = 0.5×1 + 0.5×1 = <strong>1</strong>. <strong>Choose, then look</strong> (lock in one action now): max<sub>a</sub> E[q(S′,a)] = max(0.5, 0.5) = <strong>0.5</strong>. A factor of two apart. Placing the max <em>outside</em> the expectation forfeits the right to re-decide upon arrival; placing it <em>inside</em> keeps that right. The BOE’s optimality is built precisely on the latter: at every station the agent may decide afresh, so the max must sit inside the expectation — and the equation turns nonlinear, retiring L2’s linear algebra for good.' },
      { t: 'formula', lbl: 'max 的正确位置 · Where the max belongs',
        tex: String.raw`\htmlClass{fx-green}{\text{正确}}\ \checkmark\ \ \mathbb{E}_{S'}\big[R + \gamma\max_{a'} q(S',a')\big] \qquad\text{·}\qquad \htmlClass{fx-red}{\text{错误}}\ \times\ \ \max_{a'}\mathbb{E}_{S'}\big[R + \gamma q(S',a')\big]`,
        note: '（上例：1 vs 0.5）' },
      { t: 'callout', variant: 'warn', zh: '<strong>BOE 和 Bellman 方程的关系</strong>：BOE 是一个特殊的 Bellman 方程——对应的策略恰好是最优策略。但表达式长得不一样（多了 max），它不再是线性方程，L2 那套线性代数工具全部失效，必须请新工具：压缩映射定理。', en: '<strong>BOE vs. Bellman equation</strong>: the BOE is a special Bellman equation whose corresponding policy happens to be optimal. But the expression differs (the max), it is no longer linear, and every linear-algebra tool from L2 goes out the window — a new tool is needed: the contraction mapping theorem.' },
      { t: 'callout', variant: 'danger', zh: '<strong>两处最值钱的坑。</strong>① <strong>给 BOE 求"闭式解"</strong>：把 v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) 照抄 L2 的作业写成 v = (I − γP<sub>π</sub>)<sup>−1</sup>r<sub>π</sub>——不合法：max 使方程非线性，"移项—求逆"从第一步就走不通（何况该用哪个 P<sub>π</sub> 本身取决于 max 选出的策略，循环依赖）。非线性方程的替代工具是下一节的压缩映射定理。② <strong>max 放错层</strong>：把 E[max<sub>a′</sub> q(S′,a′)] 写成 max<sub>a′</sub> E[q(S′,a′)]——上面的迷你例就是 1 vs 0.5 的现成反例。口诀：<strong>选择发生在哪个状态，max 就放在对该状态的期望之内</strong>（s 已知，当前动作的 max 可在最外层；S′ 未定，下一动作的 max 必须待在 E[S′] 里面）。', en: '<strong>The two most expensive pits.</strong> ① <strong>Demanding a "closed form" for the BOE</strong>: copying L2’s homework to turn v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) into v = (I − γP<sub>π</sub>)<sup>−1</sup>r<sub>π</sub> — illegal: the max makes the equation nonlinear, so "transpose and invert" fails at step one (never mind that which P<sub>π</sub> to use itself depends on the policy the max selects — a circular dependence). The replacement tool for nonlinear equations is the contraction mapping theorem, next section. ② <strong>The max at the wrong layer</strong>: writing E[max<sub>a′</sub> q(S′,a′)] as max<sub>a′</sub> E[q(S′,a′)] — the miniature above is a ready counterexample, 1 versus 0.5. Rule of thumb: <strong>whichever state the choice happens in, the max must sit inside the expectation over that state</strong> (s is known, so the current action’s max may sit outermost; S′ is undetermined, so the next action’s max must stay inside E[S′]).' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"把 max 写进方程","en":"max enters","d":{"zh":"把 Bellman 方程的\"给定策略\"换成\"逐状态挑最好\"，就得到 BOE。","en":"Swap the Bellman equation's \"given policy\" for \"pick the best per state\" — that is the BOE."}},
        {"zh":"全押最大 q","en":"all-in on max q","d":{"zh":"例 3.2 消元：最优局部策略把概率 1 押在 q 最大的动作上，π 被请出方程，只剩 v = f(v)。","en":"Example 3.2 eliminates π: the optimal local policy puts probability 1 on the largest-q action, leaving v = f(v)."}},
        {"zh":"非线性方程","en":"nonlinear","d":{"zh":"多了 max，方程不再线性——L2 那套线性代数工具全部失效。","en":"With max inside, the equation is no longer linear — all of L2's linear algebra fails."}},
        {"zh":"max 的位置","en":"where max sits","d":{"zh":"max 与期望不可交换：E[max q] ≠ max E[q]。选择发生在哪个状态，max 就放在对该状态的期望之内。","en":"max and expectation do not commute: E[max q] ≠ max E[q]; the max sits inside the expectation of the state where the choice is made."}},
      ] } },
    ],
  };

  /* ---- §3.3.3 压缩映射 ---- */
  S['l3-contraction'] = {
    kicker: 'L3 · §3.3.3',
    title: { zh: '压缩映射定理：非线性方程的万能钥匙', en: 'The Contraction Mapping Theorem: Master Key for Nonlinear Equations' },
    blocks: [
      { t: 'p', zh: '<strong>不动点（fixed point）</strong>：满足 f(x*) = x* 的点——映到自己。<strong>压缩映射（contraction mapping）</strong>：存在 γ ∈ (0,1) 使 ‖f(x₁) − f(x₂)‖ ≤ γ‖x₁ − x₂‖ 对一切 x₁, x₂ 成立——每映射一次，任意两点的距离至少压缩到 γ 倍。书上的三个例子都值得过一遍：f(x) = 0.5x（压缩系数 0.5）；f(x) = Ax（‖A‖ ≤ γ < 1）；f(x) = 0.5 sin x（中值定理：|0.5cos x₃| ≤ 0.5）。', en: 'A <strong>fixed point</strong> satisfies f(x*) = x* — it maps to itself. A <strong>contraction mapping</strong> admits γ ∈ (0,1) with ‖f(x₁) − f(x₂)‖ ≤ γ‖x₁ − x₂‖ for all x₁, x₂ — each application shrinks every pairwise distance by at least a factor γ. The book\'s three examples are all worth a pass: f(x) = 0.5x (factor 0.5); f(x) = Ax (‖A‖ ≤ γ < 1); f(x) = 0.5 sin x (mean value theorem: |0.5cos x₃| ≤ 0.5).' },
      { t: 'widget', component: 'l3-contraction' },
      { t: 'formula', lbl: '压缩映射定理 · Theorem 3.1',
        html: '若 <i class="fx-inline" data-tex="f"></i> 是压缩映射，则 <i class="fx-inline" data-tex="x = f(x)"></i> 的不动点 <i class="fx-inline" data-tex="x^*"></i> <span class="mt">存在</span>、<span class="mt">唯一</span>，且 <i class="fx-inline" data-tex="x_{k+1} = f(x_k)"></i> 从<strong>任何</strong> <i class="fx-inline" data-tex="x_0"></i> 出发都<span class="mt">指数速度</span>收敛到 <i class="fx-inline" data-tex="x^*"></i>' },
      { t: 'p', zh: '定理的证明分四步（书 Box 3.1）：① 迭代序列相邻两项的距离被 γ<sup>k</sup> 压缩，任意两项距离 ≤ γ<sup>n</sup>/(1−γ)·‖x₁−x₀‖（又一次几何级数！），序列是 Cauchy 的故收敛；② 极限点是不动点；③ 反证若有两个不动点，‖x′−x*‖ ≤ γ‖x′−x*‖ 迫使其为零；④ 误差估计直接给出指数收敛速度。注意证明里反复出现的那把旧钥匙：γ < 1 的几何级数。', en: 'The proof has four moves (book Box 3.1): ① consecutive iterates shrink by γ<sup>k</sup>; pairwise distances are ≤ γ<sup>n</sup>/(1−γ)·‖x₁−x₀‖ (the geometric series again!), so the sequence is Cauchy and converges; ② the limit is a fixed point; ③ if two fixed points existed, ‖x′−x*‖ ≤ γ‖x′−x*‖ forces zero distance; ④ the error bound gives exponential rate. Notice the old key reappearing throughout: the geometric series with γ < 1.' },
      { t: 'p', zh: '最后一步把钥匙插进 BOE 的锁孔：<strong>定理 3.2</strong>——f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) 是压缩映射（∞-范数下，系数恰好 γ）。证明的技巧是"交换最大"：对 v₁ 取的最优 π₁* 代入 v₂ 会吃亏，于是 f(v₁) − f(v₂) ≤ γP<sub>π₁*</sub>(v₁ − v₂)；对称地再得一侧，夹住之后逐元素放大到 ‖v₁−v₂‖<sub>∞</sub>。于是压缩映射定理全套适用于 BOE：解存在、唯一、可迭代、指数收敛。', en: 'Finally the key meets the lock: <strong>Theorem 3.2</strong> — f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) is a contraction mapping (in the ∞-norm, with factor exactly γ). The proof trick is "swapping the max": the π₁* optimal for v₁ underperforms on v₂, giving f(v₁) − f(v₂) ≤ γP<sub>π₁*</sub>(v₁ − v₂); symmetrically for the other side; sandwich and lift to the ∞-norm. The whole contraction mapping theorem now applies to the BOE: solution exists, unique, iterable, exponentially fast.' },
    ],
  };

  /* ---- §3.4 解 BOE ---- */
  S['l3-solving'] = {
    kicker: 'L3 · §3.4',
    title: { zh: '解 BOE：v* 与 π* 都到手', en: 'Solving the BOE: Getting Both v* and π*' },
    blocks: [
      { t: 'p', zh: '压缩映射定理一对进 BOE，三大问题同时了结（<strong>定理 3.3</strong>）：<strong>存在</strong>——BOE 的解 v* 存在（不动点）；<strong>唯一</strong>——v* 唯一；<strong>算法</strong>——从任意 v₀ 出发迭代 <strong>v<sub>k+1</sub> = f(v<sub>k</sub>) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>)</strong> 指数收敛到 v*。这个迭代算法有个响亮的名字：<strong>值迭代（value iteration）</strong>——第 4 章的主角，这里先领个票。', en: 'Once the contraction mapping theorem meets the BOE, three questions close at once (<strong>Theorem 3.3</strong>): <strong>existence</strong> — the BOE solution v* exists (a fixed point); <strong>uniqueness</strong> — v* is unique; <strong>algorithm</strong> — iterating <strong>v<sub>k+1</sub> = f(v<sub>k</sub>) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>)</strong> from any v₀ converges exponentially to v*. This iteration has a famous name: <strong>value iteration</strong> — the protagonist of Chapter 4, taking a ticket here.' },
      { t: 'p', zh: '<strong>解出 v* 之后，π* 白送</strong>：π* = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v*)，逐状态看就是<strong>贪心策略</strong>——在每个状态选 q*(s,a) = Σ<sub>r</sub>p(r|s,a)r + γΣ<sub>s′</sub>p(s′|s,a)v*(s′) 最大的动作（<strong>定理 3.5</strong>）。代回去可得 v* = r<sub>π*</sub> + γP<sub>π*</sub>v*：v* 恰好是 π* 的状态值，BOE 确实是"对应最优策略的特殊 Bellman 方程"。<strong>定理 3.4</strong> 补上最后一环：对任何策略 π 都有 v* = v<sub>π*</sub> ≥ v<sub>π</sub>——解出来的就是最优的，货真价实。', en: '<strong>After v*, the policy π* comes free</strong>: π* = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v*), which state by state is the <strong>greedy policy</strong> — at each state pick the action maximising q*(s,a) = Σ<sub>r</sub>p(r|s,a)r + γΣ<sub>s′</sub>p(s′|s,a)v*(s′) (<strong>Theorem 3.5</strong>). Substituting back gives v* = r<sub>π*</sub> + γP<sub>π*</sub>v*: v* is exactly π*\'s state value, so the BOE is indeed "the special Bellman equation of the optimal policy". <strong>Theorem 3.4</strong> closes the loop: for every policy π, v* = v<sub>π*</sub> ≥ v<sub>π</sub> — the solution is genuinely optimal.' },
      { t: 'formula', lbl: 'v* 与 q* 的互相表出 · Expressing v* and q* through each other',
        tex: String.raw`v^*(s) = \htmlClass{fx-gold}{\max_a}\, q^*(s,a) \qquad\text{·}\qquad q^*(s,a) = \sum_r p(r\mid s,a)\,r + \gamma \sum_{s'} p(s'\mid s,a)\,\htmlClass{fx-gold}{\max_{a'}}\, q^*(s',a')` },
      { t: 'p', zh: '这对表出式与 L2 的 (2.13)(2.14) 严格同构，只是"π 加权平均"换成了"max"——从"平均给定的选择"升级为"挑选最好的选择"。<strong>知道 q*，连贪心都一步到位</strong>：在 s 处把 q*(s,a) 摆开取最大，策略选择被 max 一次性解决，全程不需要 v*、也不需要模型加权的中间步骤。这预告了后续两条路线的分岔：第 5 章蒙特卡洛、第 7 章 Q-learning 走 <strong>q* 路线</strong>（样本直接估动作值，无需模型）；本章与第 4 章的值迭代走 <strong>v* 路线</strong>（每轮一次模型加权求 q、一次 max 收账）。两条路线在"贪心提取 π*"处会师。', en: 'This pair of expressions is strictly isomorphic to L2’s (2.13)(2.14), with the "π-weighted average" swapped for a max — upgrading from "averaging given choices" to "choosing the best". <strong>With q* in hand, even the greedy step collapses to one move</strong>: lay out q*(s,a) at s and take the maximum; the policy selection is settled by a single max, with no v* and no model-weighted intermediate needed. This foretells the fork of later chapters: Monte Carlo (Chapter 5) and Q-learning (Chapter 7) take the <strong>q* route</strong> (samples estimate action values directly, no model required), while this chapter’s and Chapter 4’s value iteration takes the <strong>v* route</strong> (each round: one model-weighted pass to the q’s, one max to collect). The two routes reunite at "greedy extraction of π*".' },
      { t: 'p', zh: '<strong>数值演算（两状态迷你世界，γ = 0.5，max 手算一步）</strong>。s2 只有"原地"一个动作，每步 +1；s1 有两个动作：<strong>走</strong>（奖励 0，转移到 s2）与<strong>留</strong>（奖励 0.4，留在 s1）。先解 s2 的 BOE：v(s2) = 1 + 0.5v(s2) ⟹ v*(s2) = 2 = 1/(1−γ)。再代 s1：v(s1) = max(0 + 0.5v(s2), 0.4 + 0.5v(s1))。两分支各试一次："留"若为最优，v(s1) = 0.4 + 0.5v(s1) 解得 0.8，但此时"走"分支值 0.5×2 = 1 &gt; 0.8，矛盾；"走"若为最优，v(s1) = 1，回查"留"分支 0.4 + 0.5×1 = 0.9 &lt; 1 ✓。<strong>v*(s1) = 1，最优动作是"走"</strong>——即时奖励更大的"留"是陷阱，远处每步 +1 的 s2 才是金山。再跑三轮值迭代，亲眼看 max 干活（v₀ = 0）：第 1 轮 v(s1) = max(0, 0.4) = 0.4（贪心<strong>错选</strong>"留"）；第 2 轮 = max(0.5×1, 0.4+0.2) = 0.6（仍"留"）；第 3 轮 = max(0.5×1.5, 0.4+0.3) = <strong>0.75，argmax 翻转为"走"</strong>，此后单调奔向 1；v(s2) 则按 2(1−0.5<sup>k</sup>) = 1, 1.5, 1.75, … 几何级数补齐（以上用 node 逐轮实算核对）。小世界一句话演完大道理：<strong>max 让"短视的贪心"随着价值信息的传播自我修正</strong>。', en: '<strong>A numeric run (a two-state miniature, γ = 0.5, one max by hand).</strong> s2 has a single action "stay" paying +1 per step; s1 has two actions: <strong>go</strong> (reward 0, move to s2) and <strong>stay</strong> (reward 0.4, remain at s1). Solve s2’s BOE first: v(s2) = 1 + 0.5v(s2) ⟹ v*(s2) = 2 = 1/(1−γ). Substitute into s1: v(s1) = max(0 + 0.5v(s2), 0.4 + 0.5v(s1)). Try each branch: were "stay" optimal, v(s1) = 0.4 + 0.5v(s1) would give 0.8 — but the "go" branch is then worth 0.5×2 = 1 &gt; 0.8, a contradiction; with "go" optimal, v(s1) = 1, and re-checking "stay": 0.4 + 0.5×1 = 0.9 &lt; 1 ✓. <strong>v*(s1) = 1 with "go" optimal</strong> — the fatter immediate reward of "stay" is a trap; the +1-per-step s2 is the gold mine. Now run three rounds of value iteration and watch the max work (v₀ = 0): round 1, v(s1) = max(0, 0.4) = 0.4 (the greedy pick <strong>wrongly</strong> chooses "stay"); round 2, max(0.5×1, 0.4+0.2) = 0.6 (still "stay"); round 3, max(0.5×1.5, 0.4+0.3) = <strong>0.75 and the argmax flips to "go"</strong>, after which it climbs monotonically toward 1, while v(s2) fills in geometrically as 2(1−0.5<sup>k</sup>) = 1, 1.5, 1.75, … (re-verified round by round in node). One miniature stages the big moral: <strong>the max lets a short-sighted greed correct itself as value information propagates</strong>.' },
      { t: 'steps', items: [
        { zh: '<strong>最优策略不唯一</strong>：v* 唯一，但取到 v* 的策略可以多条（书 Figure 3.3：s1 处 0.5/0.5 随机与另一条确定性策略都是最优）。直觉：两条路一样好，掷不掷硬币都到罗马。', en: '<strong>Optimal policies are not unique</strong>: v* is unique, yet several policies may attain it (book Figure 3.3: a 0.5/0.5 stochastic policy and a deterministic one are both optimal). Intuition: when two roads are equally good, flipping a coin or not still lands in Rome.' },
        { zh: '<strong>必有确定性最优策略</strong>：最优策略可以是随机的也可以是确定的，但定理 3.5 保证<strong>总存在一条确定性的贪心最优策略</strong>——这就是为什么我们敢在图里全画箭头。', en: '<strong>A deterministic optimal policy always exists</strong>: optimal policies may be stochastic or deterministic, but Theorem 3.5 guarantees at least one <strong>deterministic greedy</strong> optimal policy — which is why drawing arrows everywhere is always honest.' },
        { zh: '<strong>四个问题全部销账</strong>：存在 ✓（不动点）、算法 ✓（值迭代）、唯一性 ✓（v* 唯一，π* 不一定）、随机性 ✓（可随机，必有确定）。', en: '<strong>All four questions settled</strong>: existence ✓ (fixed point), algorithm ✓ (value iteration), uniqueness ✓ (v* unique, π* not necessarily), stochasticity ✓ (may be stochastic, deterministic always exists).' },
      ]},
      { t: 'callout', variant: 'warn', zh: '<strong>方向搞反的经典误会："得先有 π* 才能算 v*"。</strong>恰恰相反：BOE 里根本没有 π 这个未知数——max<sub>π</sub> 只是个记号，消元之后方程 v = max<sub>a</sub>(即时均值 + γΣ<sub>s′</sub>p·v) 里只剩 v。所以顺序永远是<strong>先解 v*，再贪心提取 π*</strong>（定理 3.5）；π* 是 v* 的附属品，不是前提。同族误会还有："值迭代每轮在评估某个具体策略"——并没有，中间量 v<sub>k</sub> 不满足任何策略的 Bellman 方程（第 4 章开篇的警告专门回击这一点）。', en: '<strong>The classic direction error: "you need π* before you can compute v*".</strong> Exactly backwards: the BOE contains no unknown π — max<sub>π</sub> is mere notation, and after elimination the equation v = max<sub>a</sub>(immediate mean + γΣ<sub>s′</sub>p·v) holds v alone. The order is always <strong>solve v* first, then extract π* greedily</strong> (Theorem 3.5); π* is a by-product of v*, never a prerequisite. A cousin misconception: "each round of value iteration evaluates some concrete policy" — it does not; the intermediate v<sub>k</sub> satisfies no policy’s Bellman equation (the warning at the head of Chapter 4 strikes precisely this).' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"压缩映射定理","en":"contraction theorem","d":{"zh":"BOE 的右端是 ∞-范数下系数 γ 的压缩映射：v* 存在、唯一、迭代必收敛（定理 3.3）。","en":"The BOE's right side is a γ-contraction in the ∞-norm: v* exists, is unique, and iteration converges (Theorem 3.3)."}},
        {"zh":"值迭代","en":"value iteration","d":{"zh":"vk+1 = f(vk) 指数收敛到 v*——第 4 章的主角在这里先领个票。","en":"vk+1 = f(vk) converges geometrically to v* — Chapter 4's protagonist picks up its ticket here."}},
        {"zh":"贪心提取 π*","en":"greedy π*","d":{"zh":"解出 v* 后选 q* 最大的动作，定理 3.5 保证这就是最优策略；v* 恰是 π* 的状态值。","en":"After solving v*, pick the largest-q* action; Theorem 3.5 guarantees optimality, and v* is exactly π*'s state value."}},
        {"zh":"v* 唯一，π* 不必","en":"unique v*, not π*","d":{"zh":"值表唯一，取到它的策略可以多条，且必有确定性最优策略（定理 3.5）。","en":"The value table is unique; policies achieving it need not be, and a deterministic optimum always exists (Theorem 3.5)."}},
        {"zh":"先 v* 后 π*","en":"v* first","d":{"zh":"BOE 里根本没有 π 这个未知数：先解 v*，π* 是附属品，不是前提。","en":"No π unknown remains in the BOE: solve v* first; π* is a by-product, not a prerequisite."}},
      ] } },
    ],
  };

  /* ---- §3.5 因素 ---- */
  S['l3-factors'] = {
    kicker: 'L3 · §3.5',
    title: { zh: 'γ 和奖励如何摆布最优策略', en: 'How γ and Rewards Bend Optimal Policies' },
    blocks: [
      { t: 'p', zh: 'BOE 最大的实用价值：它是一台<strong>策略实验机</strong>。逐状态的表达式里有三个旋钮——即时奖励 r、折扣率 γ、模型 p——拧动旋钮重解 BOE，就能看到最优策略如何变形。书里的基线是 5×5 世界（r<sub>boundary</sub> = r<sub>forbidden</sub> = −1、r<sub>target</sub> = 1、r<sub>other</sub> = 0）：γ = 0.9 时最优策略<strong>敢于穿越禁区</strong>——从 (4,1) 出发宁可吃两个 −1 也要走近路，因为 γ 大，远处的 +1 很值钱，算总账穿越更划算。这就是"远视"。', en: 'The BOE\'s greatest practical value: it is a <strong>policy experiment machine</strong>. Its elementwise form has three knobs — the immediate reward r, the discount rate γ, and the model p — and twisting them while re-solving the BOE shows how optimal policies morph. The book\'s baseline is the 5×5 world (r<sub>boundary</sub> = r<sub>forbidden</sub> = −1, r<sub>target</sub> = 1, r<sub>other</sub> = 0): at γ = 0.9 the optimal policy <strong>dares to cross forbidden cells</strong> — from (4,1) it prefers eating two −1s on the shortcut, because a large γ makes the distant +1 precious and the total favours crossing. That is far-sightedness.' },
      { t: 'p', zh: '<strong>数值演算（书 Ch.1 的 3×3 世界，γ = 0.9）：最优策略真的会穿禁区。</strong>在 s3 处摆出两个候选动作（node 按转移表 T3、奖励表 R3SYM 实算）：<strong>向下</strong> a3 直插禁区 s6（即时 −1），再一步进目标：q*(s3,a3) = −1 + 0.9×10 = <strong>8</strong>；<strong>向左</strong> a4 绕行 s2 一路下去：q*(s3,a4) = 0 + 0.9×8.1 = <strong>7.29</strong>。max 取前者——v*(s3) = 8，最优策略心甘情愿吃那记 −1 换两步近路。同一张解表还能读出 v*(s9) = 10 = 1/(1−γ)（原地领奖）、v*(s1) = 7.29 = 0.9×8.1。把 γ 调到 0.5 重解：q*(s3,a3) = −1 + 0.5×2 = 0 &lt; q*(s3,a4) = 0.25，最优策略立刻改绕行——"远视敢闯、近视保守"在同一格上量化呈现。', en: '<strong>A numeric run (the book’s Ch.1 3×3 world, γ = 0.9): the optimal policy really does cross forbidden cells.</strong> Lay out the two candidate actions at s3 (computed in node from the transition table T3 and reward table R3SYM): <strong>down</strong> a3 dives into the forbidden s6 (immediate −1), then one step into the target: q*(s3,a3) = −1 + 0.9×10 = <strong>8</strong>; <strong>left</strong> a4 detours down via s2: q*(s3,a4) = 0 + 0.9×8.1 = <strong>7.29</strong>. The max takes the former — v*(s3) = 8, the optimal policy gladly eats the −1 for the two-step shortcut. The same solution table reads off v*(s9) = 10 = 1/(1−γ) (collecting in place) and v*(s1) = 7.29 = 0.9×8.1. Re-solve with γ = 0.5: q*(s3,a3) = −1 + 0.5×2 = 0 &lt; q*(s3,a4) = 0.25 — the optimal policy switches to the detour at once. "Far-sighted dares, near-sighted detours", quantified on a single cell.' },
      { t: 'widget', component: 'l3-gamma-sweep' },
      { t: 'steps', items: [
        { zh: '<strong>γ = 0.5：不敢冒险了</strong>。禁区惩罚被折现放大（眼前 −1 太痛），最优策略改为绕开全部禁区、走远路——短视的策略保守行事。', en: '<strong>γ = 0.5: risk appetite gone</strong>. The forbidden penalty now stings in the present, so the optimal policy detours around every forbidden cell — a short-sighted policy behaves conservatively.' },
        { zh: '<strong>γ = 0：彻底近视</strong>。未来全被抹零，每格只挑即时奖励最大的动作——结果是智能体在原地打转，<strong>根本到不了目标</strong>。目标导向行为需要 γ > 0，这是"折扣率不只是数学补丁"的最直接证据。', en: '<strong>γ = 0: utterly short-sighted</strong>. The future is zeroed out; each state grabs the best immediate reward — the agent spins in place and <strong>never reaches the target</strong>. Goal-directed behaviour needs γ > 0: the most direct evidence that the discount rate is more than a mathematical patch.' },
        { zh: '<strong>r<sub>forbidden</sub>: −1 → −10：惩罚加码</strong>。即使 γ = 0.9，禁区也变得碰不得，最优策略改为绕行。<strong>奖励设计是行为设计</strong>——想让机器人怕什么，就加大那部分的负奖励。', en: '<strong>r<sub>forbidden</sub>: −1 → −10: harsher punishment</strong>. Even at γ = 0.9 forbidden cells become untouchable and the optimal policy detours. <strong>Reward design is behaviour design</strong> — to make the robot fear something, enlarge that negative reward.' },
        { zh: '<strong>价值的空间分布</strong>：所有例子里，离目标越近价值越高，越远越低——每远一步就多打一次 γ 折。价值图天然是一张"等高线地图"，目标就是峰顶。', en: '<strong>Spatial pattern of values</strong>: in every example, states nearer the target hold higher values — each extra step discounts once more. The value map is naturally a contour map with the target at the peak.' },
      ]},
      { t: 'callout', variant: 'idea', zh: '<strong>仿射不变性（定理 3.6）</strong>：把所有奖励 r 换成 αr + β（α > 0），最优策略<strong>纹丝不动</strong>，最优值只做同样的仿射变换 v′ = αv* + β/(1−γ)·1。这回收了 L1 Q&A 的伏笔："全部奖励设成负数也没关系"——起作用的是奖励的相对大小。实用推论：想让某件事"相对更贵"，调 α（放大差距）有用，统一加 β 没用。', en: '<strong>Affine invariance (Theorem 3.6)</strong>: replacing every reward r by αr + β (α > 0) leaves the optimal policy <strong>untouched</strong>, while optimal values transform affinely, v′ = αv* + β/(1−γ)·1. This cashes in L1\'s Q&A voucher: "all-negative rewards are fine" — relative sizes are all that matter. Practical corollary: to make one thing relatively pricier, scale α (spread the gaps); a uniform shift β does nothing.' },
    ],
  };

  /* ---- §3.5 绕路 ---- */
  S['l3-detour'] = {
    kicker: 'L3 · §3.5',
    title: { zh: '绕路之谜：为什么 r_other = 0 也不会绕远？', en: 'The Detour Puzzle: Why r_other = 0 Still Yields Short Paths' },
    blocks: [
      { t: 'p', zh: '一个自然的担忧：走路不扣钱（r<sub>other</sub> = 0），智能体会不会故意兜风再进目标？<strong>不会</strong>——γ 天生惩罚绕路。2×2 小例：两条策略只差 s2 一格。直走：s2 → s4，回报 1 + γ + γ² + … = 1/(1−γ) = 10；绕路：s2 → s1 → s3 → s4，回报 0 + γ·0 + γ²·1 + … = γ²/(1−γ) = 8.1。同样的奖励流，晚到两步就打两次折。<strong>折扣率本身就是"时间成本"</strong>。', en: 'A natural worry: walking is free (r<sub>other</sub> = 0), so might the agent take a joyride before entering the target? <strong>No</strong> — γ punishes detours by birth. The 2×2 example: two policies differing only at s2. Direct: s2 → s4, return 1 + γ + γ² + … = 1/(1−γ) = 10. Detour: s2 → s1 → s3 → s4, return 0 + γ·0 + γ²·1 + … = γ²/(1−γ) = 8.1. Same reward stream, two steps later means discounted twice. <strong>The discount rate is itself a cost of time</strong>.' },
      { t: 'widget', component: 'l3-detour' },
      { t: 'callout', variant: 'danger', zh: '<strong>新手误解粉碎机</strong>："要让智能体尽快到目标，得给每步加个负奖励（比如 −1）吧？"——不需要，而且加了也白加：给所有奖励统一加一个数是仿射变换，最优策略不变。γ 已经在惩罚时间了。真正要改快慢行为时，动 γ 或者动相对奖励差，而不是全民加税。', en: '<strong>Beginner-misconception crusher</strong>: "To make the agent hurry, add a negative reward (say −1) to every step?" — unnecessary, and useless anyway: shifting all rewards by a constant is an affine transformation, which preserves the optimal policy. γ already charges for time. To change hurry-behaviour, tune γ or the relative reward gaps, not a universal tax.' },
      { t: 'p', zh: '网格里的绕路之谜至此了结，但“绕路”在本章还有第二现场：<strong>学习者本人</strong>。智能体绕远路有 γ 收利息，学习者绕弯路没人收费——只会悄悄多花几周。下面三条是本章最高频的弯路，出发前对照一遍。', en: 'That settles the gridworld detour puzzle, but “detour” has a second scene in this chapter: <strong>the learner</strong>. The agent pays γ-interest for detours; nobody bills the learner for wandering — it just quietly costs weeks. The three most frequented detours, for a pre-departure check:' },
      { t: 'callout', variant: 'warn', zh: '<strong>弯路一：“先枚举所有策略，再挑最好的。”</strong>听着严谨，实为不做事：3×3 世界的确定性策略已有 5⁹ ≈ 195 万条，作业 4×4 是 5¹⁶ ≈ 1526 亿条。BOE 的全部意义就是把“寻优”改写成“解一个方程”，让 max 在方程内部替你完成比较。<strong>弯路二：“把 v* 当 v<sub>π</sub> 的特例来算。”</strong>设想用 L2 的评估机器：喂一个策略、得一张价值表，多试几个总能撞上 v*——方向反了。评估的输入是 π，而 π* 恰恰是你未知的东西；BOE 把数据流倒转：max<sub>π</sub> 消元之后方程里没有 π，先解 v*，π* 贪心白送。<strong>弯路三：“最优策略就是贪心策略”，丢了限定词。</strong>贪心必须相对某张价值表才有意义：对 v* 贪心 ⟹ 最优（定理 3.5）；对某策略的 v<sub>π</sub> 贪心 ⟹ 通常是改进而非最优（L4 策略迭代的改进步干的正是这个）；对值迭代中间的 v<sub>k</sub> 贪心 ⟹ 只是过程快照，收敛前不保证最优。贪心是相对量，最优是绝对量，两者隔着一张价值表的距离。', en: '<strong>Detour 1: “Enumerate all policies first, then pick the best.”</strong> Sounds rigorous, accomplishes nothing: the 3×3 world already has 5⁹ ≈ 1.95 million deterministic policies, the 4×4 assignment 5¹⁶ ≈ 1.5×10¹¹. The whole point of the BOE is to rewrite “searching” as “solving one equation”, letting the max do the comparing inside it. <strong>Detour 2: “Compute v* as a special case of v<sub>π</sub>.”</strong> The plan: use L2’s evaluation machine — feed in a policy, receive a value table, try enough of them and one must be v*. Direction reversed: evaluation takes π as input, and π* is exactly the thing you do not know; the BOE flips the data flow — after the max<sub>π</sub> elimination no π remains in the equation, so solve v* first and π* comes free by greed. <strong>Detour 3: “The optimal policy is the greedy policy” — losing the qualifier.</strong> Greedy means something only relative to a value table: greedy w.r.t. v* ⟹ optimal (Theorem 3.5); greedy w.r.t. some policy’s v<sub>π</sub> ⟹ usually an improvement, not yet optimal (exactly the improvement step of L4’s policy iteration); greedy w.r.t. an intermediate v<sub>k</sub> of value iteration ⟹ a snapshot in progress, not guaranteed optimal before convergence. Greedy is relative, optimal is absolute — the gap between them is one value table wide.' },
    ],
  };

  /* ---- §3.6 总结 ---- */
  S['l3-summary'] = {
    kicker: 'L3 · §3.6',
    title: { zh: '本章总结：最优性从定义变成算法', en: 'Chapter Summary: Optimality Turns from Definition into Algorithm' },
    blocks: [
      { t: 'p', zh: '本章把"最优"从愿望变成了可计算的对象。概念上：<strong>最优策略</strong>由逐格的状态值比较定义，其值即<strong>最优状态值</strong>。工具上：<strong>BOE</strong> 把最优性写进方程，它的右端是压缩映射，压缩映射定理一步到位地给出存在性、唯一性、迭代算法与收敛速度。解出 v* 后贪心提取 π*，定理 3.4 保证这就是最优。γ 与奖励两个旋钮决定最优策略的形状——远视/近视、敢闯/保守，全是参数的表达。', en: 'This chapter turned "optimal" from a wish into a computable object. Conceptually: the <strong>optimal policy</strong> is defined by cell-wise state-value comparison, and its values are the <strong>optimal state values</strong>. Tool-wise: the <strong>BOE</strong> writes optimality into an equation whose right side is a contraction, and the contraction mapping theorem instantly yields existence, uniqueness, an iterative algorithm, and its rate. Solve for v*, extract π* greedily, and Theorem 3.4 certifies optimality. The two knobs γ and reward shape the optimal policy — far-sighted or short-sighted, bold or conservative are all parameter expressions.' },
      { t: 'steps', items: [
        { zh: '<strong>定义最优</strong>：状态值逐格 ≥ 一切策略者为最优。先有定义才谈得上寻找；它立刻生出四问（存在？唯一？随机？可算？），回答需要一个方程。', en: '<strong>Define optimality</strong>: the policy cell-wise ≥ all others is optimal. Only with a definition does seeking begin; it instantly births four questions (existence? uniqueness? stochastic? computable?) whose answer requires an equation.' },
        { zh: '<strong>把最优写进方程（BOE）</strong>：v(s) = max<sub>π(s)</sub> Σ<sub>a</sub>π(a|s)q(s,a)。例 3.2 消元：最优局部策略必“全押最大 q”，π 被请出方程，只剩 v = f(v)。', en: '<strong>Write optimality into an equation (BOE)</strong>: v(s) = max<sub>π(s)</sub> Σ<sub>a</sub>π(a|s)q(s,a). Example 3.2 eliminates π — the optimal local policy goes all-in on the greatest q — leaving v = f(v).' },
        { zh: '<strong>非线性，请压缩映射</strong>：max 不可拆，L2 的线性代数谢幕；f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) 恰是 ∞-范数下系数 γ 的压缩映射——定理 3.3 一次交付存在、唯一、值迭代与指数收敛。', en: '<strong>Nonlinear — call in contraction</strong>: the max will not distribute, so L2’s linear algebra exits; f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) is exactly a contraction of factor γ in the ∞-norm — Theorem 3.3 delivers existence, uniqueness, value iteration, and exponential rate in one stroke.' },
        { zh: '<strong>求解收网</strong>：v* 贪心提取 π*（定理 3.5，必有确定性最优）；定理 3.4 认证 v* = v<sub>π*</sub> ≥ v<sub>π</sub> 对一切 π。四问全部销账。', en: '<strong>Solve and seal</strong>: extract π* greedily from v* (Theorem 3.5, a deterministic optimum always exists); Theorem 3.4 certifies v* = v<sub>π*</sub> ≥ v<sub>π</sub> for every π. All four questions cleared.' },
        { zh: '<strong>路线分岔</strong>：走 v* 要模型加权（L4 值迭代 / 策略迭代）；直接估 q* 可甩掉模型（L5 蒙特卡洛、L7 TD / Q-learning）。两条路终点相同——贪心提取 π*。', en: '<strong>The routes fork</strong>: the v* route needs model weighting (L4’s value / policy iteration); estimating q* directly sheds the model (L5 Monte Carlo, L7 TD / Q-learning). Both routes end at the same place — greedy extraction of π*.' },
      ]},
      { t: 'callout', variant: 'key', zh: '<strong>L2 / L3 对照卡。</strong>方程：<strong>线性</strong> v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub>（π 给定后 r<sub>π</sub>、P<sub>π</sub> 是常数）vs <strong>非线性</strong> v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v)（max 不可拆，且用哪个 P<sub>π</sub> 本身取决于 max）。解：<strong>有闭式解</strong> (I − γP<sub>π</sub>)⁻¹r<sub>π</sub> vs <strong>无闭式解</strong>，只能压缩映射迭代。对象：v<sub>π</sub> 是“某条策略的成绩单”，策略有多少张、成绩单就有多少张 vs v* 唯一，是全体策略的<strong>天花板</strong>，又恰是最优策略的成绩单（v* = v<sub>π*</sub>）。工具：线性代数 vs 不动点定理。不变的是引擎：两者都靠 γ &lt; 1 收敛，迭代式只差一个 max。', en: '<strong>The L2/L3 contrast card.</strong> Equation: <strong>linear</strong> v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> (with π given, r<sub>π</sub> and P<sub>π</sub> are constants) vs <strong>nonlinear</strong> v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) (the max does not distribute, and which P<sub>π</sub> applies itself depends on the max). Solution: a <strong>closed form exists</strong>, (I − γP<sub>π</sub>)⁻¹r<sub>π</sub>, vs <strong>no closed form</strong> — contraction iteration only. Object: v<sub>π</sub> is one policy’s report card, one per policy, vs the unique v*, the <strong>ceiling</strong> over all policies and simultaneously the optimal policy’s own card (v* = v<sub>π*</sub>). Tools: linear algebra vs fixed-point theory. What stays is the engine: both converge on γ &lt; 1, and the two iterations differ by a single max.' },
      { t: 'p', zh: '行李清单上其实只有一张票：<strong>压缩映射定理</strong>。L4 的三个算法全是它的兑现——值迭代 = 定理 3.3 的迭代式加上截断与停止准则（把 ε 换算成真实误差上界，用的正是压缩系数 γ）；策略迭代 = 反复调用 L2 的评估 + 本章的贪心改进；截断策略迭代夹在中间，评估只跑 j 步就敢改进，底气仍是“误差每轮被 γ 压走一份”。再往后，第 5、7 章的采样算法不再握有精确的 f，但“评估与改进两个互相纠错的循环交替运行”这个骨架原样保留——广义策略迭代是它的名字。带着 v*、π* 和这张票进 L4。', en: 'The packing list really holds one ticket: <strong>the contraction mapping theorem</strong>. All three algorithms of L4 redeem it — value iteration is Theorem 3.3’s update plus truncation and stopping rules (converting ε into a true error bound leans exactly on the contraction factor γ); policy iteration repeatedly calls L2’s evaluation followed by this chapter’s greedy improvement; truncated policy iteration sits between, daring to improve after only j evaluation steps, still on the strength of “every round compresses the error by one γ-share”. Farther on, the sampling algorithms of Chapters 5 and 7 no longer hold an exact f, yet the skeleton — evaluation and improvement, two mutually correcting loops in alternation — survives verbatim under the name generalised policy iteration. Pack v*, π*, and this ticket for L4.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"定义最优","en":"define optimality","d":{"zh":"状态值逐格不差于一切策略者为最优；定义立刻生出四问，回答需要一个方程。","en":"Optimal means state values no worse than every policy, state by state; the definition begets four questions needing an equation."}},
        {"zh":"BOE","en":"the BOE","d":{"zh":"把最优写进方程：v(s) = maxπ Σa π(a|s) q(s,a)；例 3.2 消元后只剩 v = f(v)。","en":"Optimality written into an equation, v(s) = maxπ Σa π(a|s) q(s,a); Example 3.2 eliminates π, leaving v = f(v)."}},
        {"zh":"压缩映射","en":"contraction","d":{"zh":"f 恰是系数 γ 的压缩映射：存在、唯一、值迭代与指数收敛一次交付（定理 3.3）。","en":"f is a γ-contraction: existence, uniqueness, value iteration and geometric convergence delivered in one stroke (Theorem 3.3)."}},
        {"zh":"求解收网","en":"the catch","d":{"zh":"解出 v* 贪心提取 π*（定理 3.5）；γ 与奖励两个旋钮决定最优策略的形状。","en":"Solve v*, extract π* greedily (Theorem 3.5); the two knobs, γ and rewards, shape the optimal policy."}},
      ] } },
      { t: 'callout', variant: 'idea', zh: '下一课预告：定理 3.3 的迭代式 v<sub>k+1</sub> = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>) 就是<strong>值迭代</strong>。第 4 章给它完整实现与收敛分析，并介绍它的孪生兄弟——<strong>策略迭代</strong>（先精确评估、再贪心改进，上一课那个"换最大 q"的放大版）。', en: 'Next lecture teaser: Theorem 3.3\'s iteration v<sub>k+1</sub> = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub>) IS <strong>value iteration</strong>. Chapter 4 implements it fully with convergence analysis and introduces its twin, <strong>policy iteration</strong> (evaluate exactly, then improve greedily — the scaled-up version of L3\'s "swap in the greatest q" move).' },
    ],
  };

  /* ---- L3 长推理 ---- */
  S['l3-reasoning'] = {
    kicker: 'L3 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：从"换一步"到"最优性定理"', en: 'The Long Coherent Reasoning: From Swapping One Step to the Optimality Theorem' },
    blocks: [
      { t: 'p', zh: '本章推理链：改进一步（q 比较）→ 定义最优 → 把最优写进方程（max）→ 双未知数逐个击破 → 非线性方程请压缩映射 → f 压缩 ⟹ 解存在唯一可迭代 → 贪心提取 π* → 最优性定理收网。逐步走。', en: 'This chapter\'s spine: improve one step (q comparison) → define optimality → write it into the equation (max) → crack the two unknowns one by one → contraction mappings for the nonlinear equation → f contracts, so the solution exists, is unique and iterable → extract π* greedily → the optimality theorem seals it. Walk it step by step.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l3' } },
    ],
  };

  /* ---- L3 代码 ---- */
  S['l3-code'] = {
    kicker: 'L3 · 动手 · Hands-on',
    title: { zh: '代码精讲：值迭代，15 行解出最优', en: 'Code Walkthrough: Value Iteration, Optimal in ~15 Lines' },
    blocks: [
      { t: 'p', zh: '定理 3.3 的迭代式翻译成代码短得惊人。下面是在 4×4 作业同款世界上的完整值迭代 + 贪心提取——跑完直接得到最优策略和最优价值。它和 L2 策略评估代码只差一个 <code class="inline">max</code>：评估是"给定 π 求平均"，迭代是"每格先挑最好的动作再更新"。', en: 'Theorem 3.3\'s iteration translates into shockingly short code. Below is complete value iteration + greedy extraction on the assignment\'s 4×4 world — run it and you hold the optimal policy and values. It differs from L2\'s policy-evaluation code by a single <code class="inline">max</code>: evaluation averages a given π, iteration first picks each cell\'s best action, then updates.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l3' } },
      { t: 'callout', variant: 'key', zh: '<strong>与 L2 的对照记忆法</strong>：策略评估 v<sub>k+1</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub> 是"沿着给定策略走"，值迭代 v<sub>k+1</sub> = max<sub>a</sub>(r + γv) 是"每步都踩最优"。两者都是压缩映射、都指数收敛；前者解线性方程，后者解非线性方程。这个对照就是第 4 章"广义策略迭代"框架的雏形。', en: '<strong>A mnemonic against L2</strong>: policy evaluation v<sub>k+1</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>k</sub> "walks a given policy", value iteration v<sub>k+1</sub> = max<sub>a</sub>(r + γv) "steps on the best every time". Both are contraction mappings converging exponentially; the former solves a linear system, the latter a nonlinear one. This contrast is the embryo of Chapter 4\'s generalised policy iteration.' },
      { t: 'widget', component: 'notebook-bridge', props: { nb: 'nb1' } },
    ],
  };

  /* ---- L3 Q&A ---- */
  S['l3-qa'] = {
    kicker: 'L3 · §3.7',
    title: { zh: '问答：最优性十连问（精选）', en: 'Q&A: Ten Questions on Optimality (Selected)' },
    blocks: [
      { t: 'p', zh: '书上的十个问答把本章钉得死死的，这里精选六张卡片 + 一张"旋钮速查"。', en: 'The book\'s ten Q&As nail this chapter shut; six selected cards plus one knob cheat-sheet follow.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l3' } },
      { t: 'widget', component: 'fill-lab', props: { source: 'l3' } },
      { t: 'widget', component: 'derivation-lab', props: { source: 'l3' } },
    ],
  };

  /* ═══ L3 长推理链 ═══ */
  D.reasoningSets['l3'] = [
    { link: '起点 · Start',
      title: { zh: '会打分了，然后呢？', en: 'We can grade policies — so what?' },
      zh: 'L2 的策略评估只能评价"给定"的策略。真正的目标是找到最优策略。第一步不是写算法，而是定义"最优"——否则算出来最优也不认识。',
      en: 'Policy evaluation grades a given policy, but the goal is to find the best one. Step one is not coding — it is defining "optimal", or we would not recognise it if found.',
      question: '“最优”用哪个量定义才可计算？' },
    { link: '定义 · Define',
      title: { zh: '逐格比较：v_{π*}(s) ≥ v_π(s) ∀s,∀π', en: 'Cell-wise comparison: v_{π*}(s) ≥ v_π(s) ∀s, ∀π' },
      zh: '用状态值逐格地 ≥ 比较所有策略，全胜者为最优。这个定义立刻生成四个问题：存在？唯一？随机还是确定？怎么算？——本章余下部分就是把这四问全部变成定理。',
      en: 'Compare all policies cell-wise by state values; the all-round winner is optimal. This definition instantly births four questions: existence? uniqueness? stochastic or deterministic? how to compute? — the rest of the chapter turns them into theorems.',
      question: '怎么把"最优"塞进一个方程里？' },
    { link: '改进 · Improve',
      title: { zh: '改进的原子操作：换上 q 最大的动作', en: 'The atomic improvement: swap in the argmax-q action' },
      zh: '在 s1 处算五个 q 值，把策略换成 q = 9 的 a₃，v(s1) 从 8 → 9。贪心改进有效。但一次改一格太慢：要是对所有状态同时贪心呢？这个念头需要一个方程来安放。',
      en: 'Compute the five q values at s1, swap in a₃ with q = 9, and v(s1) jumps 8 → 9. Greedy improvement works. But one cell at a time is slow: what about being greedy everywhere at once? That thought needs an equation to live in.',
      question: '如何让方程自己挑最好？' },
    { link: '入方程 · Into the equation',
      title: { zh: 'BOE：max 进驻方程', en: 'The BOE: max moves into the equation' },
      zh: 'v(s) = max_{π(s)} Σ_a π(a|s) q(s,a)。右端的 max 是"逐状态挑最好"的数学化身。方程从此非线性——L2 的线性代数武器全部失效，必须找非线性方程的理论。',
      en: 'v(s) = max_{π(s)} Σ_a π(a|s) q(s,a). The max is "pick the best per state" made mathematical. The equation is now nonlinear — every linear-algebra weapon from L2 is useless; we need a theory of nonlinear equations.',
      question: '一个方程两个未知数（v 和 π），怎么解？' },
    { link: '拆解 · Split',
      title: { zh: '先解 π：全押最大的 q', en: 'Solve π first: all-in on the greatest q' },
      zh: '在 Σ_a π(a|s) = 1 的约束下最大化加权平均，答案是"把概率 1 押在 q 最大的动作上"（例 3.2）。右端变成 max_a q(s,a) =: f(v)(s)——π 被消元，只剩 v = f(v)，一个非线性方程组。',
      en: 'Maximising the weighted average under Σ_a π(a|s) = 1, the answer is "probability 1 on the greatest q" (Example 3.2). The right side becomes max_a q(s,a) =: f(v)(s) — π is eliminated, leaving v = f(v), a system of nonlinear equations.',
      question: '非线性方程组有解吗？怎么求？' },
    { link: '请定理 · Invoke',
      title: { zh: '压缩映射定理：存在、唯一、可迭代', en: 'Contraction mapping theorem: existence, uniqueness, iteration' },
      zh: '若 f 是压缩映射（‖f(x₁)−f(x₂)‖ ≤ γ‖x₁−x₂‖），则不动点存在且唯一，且 x_{k+1} = f(x_k) 从任何起点指数收敛。证明的燃料还是 γ<1 的几何级数：Cauchy 序列 → 收敛 → 不动点 → 唯一 → 速度。',
      en: 'If f contracts (‖f(x₁)−f(x₂)‖ ≤ γ‖x₁−x₂‖), a unique fixed point exists and x_{k+1} = f(x_k) converges exponentially from any start. The proof burns the same fuel as always — the γ<1 geometric series: Cauchy → converge → fixed point → unique → rate.',
      question: 'BOE 的 f 恰好是压缩映射吗？' },
    { link: '验证 · Verify',
      title: { zh: 'f(v) = max_π(r_π + γP_π v) 恰好压缩，系数恰为 γ', en: 'f(v) = max_π(r_π + γP_π v) contracts with factor exactly γ' },
      zh: '交换技巧：对 v₁ 最优的 π₁* 用在 v₂ 上只会更差，故 f(v₁)−f(v₂) ≤ γP_{π₁*}(v₁−v₂)；对称地夹住另一侧；概率行向量与 |v₁−v₂| 相乘不超过 ∞-范数。⟹ BOE 有唯一解 v*，值迭代 v_{k+1} = f(v_k) 指数收敛（定理 3.3）。',
      en: 'The swap trick: π₁* optimal for v₁ underperforms on v₂, so f(v₁)−f(v₂) ≤ γP_{π₁*}(v₁−v₂); symmetrically from the other side; probability rows times |v₁−v₂| never exceed the ∞-norm. The BOE therefore has a unique solution v*, and value iteration v_{k+1} = f(v_k) converges exponentially (Theorem 3.3).',
      question: '解出的 v* 怎么变回策略？它真的最优吗？' },
    { link: '收网 · Seal',
      title: { zh: '贪心提取 π* → 最优性定理', en: 'Extract π* greedily → the optimality theorem' },
      zh: 'v* 到手后 π* 白送：每状态选 q*(s,a) 最大的动作（定理 3.5，必有确定性最优）。代回 BOE 得 v* = v_{π*}，再用 γP 迭代不等式证明对一切 π 有 v_{π*} ≥ v_π（定理 3.4）。四问销账：存在 ✓、唯一性(v*) ✓、可解 ✓、随机性（可随机、必有确定）✓。',
      en: 'With v* in hand, π* is free: pick the argmax-q*(s,a) action per state (Theorem 3.5, a deterministic optimum always exists). Substituting back yields v* = v_{π*}, and a γP-inequality ladder proves v_{π*} ≥ v_π for all π (Theorem 3.4). All four questions cleared: existence ✓, uniqueness (of v*) ✓, computability ✓, stochasticity (may be stochastic, deterministic always exists) ✓.',
      question: null },
  ];

  /* ═══ L3 代码块 ═══ */
  const srcVI = `import numpy as np

def value_iteration(env, gamma=0.9, theta=1e-6, max_sweeps=10_000):
    """Solve the Bellman optimality equation (Theorem 3.3):
        v_{k+1} = max_a [ r(s,a) + gamma * v(s') ]   (elementwise max)
    Returns (v_star, pi_star, sweeps)."""
    model = build_model(env)               # same helper as L2: (s,a) -> (s_next, r)
    n, n_a = env.num_states, len(env.action_space)
    v = np.zeros(n)                        # any initial guess
    for k in range(max_sweeps):
        q_all = np.zeros((n, n_a))         # q-table of this sweep
        for s in range(n):
            for a in range(n_a):
                (x, y), r = model[(s, a)]
                s_next = y * env.env_size[0] + x
                q_all[s, a] = r + gamma * v[s_next]   # no pi here: raw q values
        v_new = q_all.max(axis=1)          # <- THE max of the BOE (elementwise)
        delta = np.max(np.abs(v_new - v))
        v = v_new
        if delta < theta:
            break
    pi_star = q_all.argmax(axis=1)         # greedy extraction (Theorem 3.5)
    return v, pi_star, k + 1

if __name__ == "__main__":
    env = GridWorld(env_size=(4, 4), target_state=(3, 2),
                    forbidden_states=[(3, 1), (1, 2)])
    v, pi, sweeps = value_iteration(env, gamma=0.9)
    print("sweeps:", sweeps)                      # ~ 30
    print(np.round(v, 2).reshape(4, 4))           # optimal values
    print(pi.reshape(4, 4))                       # optimal actions (0..4 = 下右上左原)`;

  const srcGreedy = `def greedy_policy(env, v, gamma=0.9):
    """Extract pi* from v* (Theorem 3.5): deterministic, argmax q*(s,a).
    Note: ties may hide other optimal actions -- v* is unique, pi* is not."""
    model = build_model(env)
    n, n_a = env.num_states, len(env.action_space)
    pi = np.zeros((n, n_a))                        # one-hot matrix for add_policy()
    for s in range(n):
        q = np.zeros(n_a)
        for a in range(n_a):
            (x, y), r = model[(s, a)]
            s_next = y * env.env_size[0] + x
            q[a] = r + gamma * v[s_next]
        best = np.flatnonzero(np.isclose(q, q.max(), atol=1e-9))  # all optimal actions
        for a in best:
            pi[s, a] = 1.0 / len(best)             # split (or keep 1 on one of them)
    return pi`;

  D.codeFileSets['l3'] = [
    {
      id: 'l3-vi', file: 'value_iteration.py — 解 BOE', tab: '① 值迭代',
      intro: { zh: '值迭代 = 策略评估代码去掉 π、换上 max。每轮先算全部 q 值（这一轮的"慢计算"），再逐状态取 max 得 v_new。收敛后 <code class="inline">argmax</code> 一抽，最优策略到手——第 4 章的主角在这里只有 20 行。', en: 'Value iteration = the policy-evaluation code with π removed and a max inserted. Each sweep first computes every q value (the slow part), then takes the per-state max into v_new. On convergence one <code class="inline">argmax</code> extracts the optimal policy — Chapter 4\'s protagonist in twenty lines.' },
      code: srcVI,
      notes: [
        { lines: [12, 15], tag: 'q table', zh: '这一轮的所有 q(s,a) 先算齐——注意没有 π 加权：值迭代不是"沿某条策略求平均"，而是把每个动作都摆出来比。这正是 BOE 右端 f(v) 的逐格计算。', en: 'All q(s,a) of this sweep are computed first — note there is NO π weighting: value iteration does not average along a given policy, it lays every action on the table to compare. This is the cell-wise computation of the BOE right side f(v).' },
        { lines: [16, 16], tag: 'max ★', zh: '<strong>整个算法的心脏就这一行</strong>：<code class="inline">q_all.max(axis=1)</code>。把 L2 评估代码的"π 加权平均"换成"逐状态 max"，Bellman 方程就变成了 BOE。非线性从这里进来，最优性从这里出去。', en: '<strong>The heart of the whole algorithm is this line</strong>: <code class="inline">q_all.max(axis=1)</code>. Replacing L2\'s "π-weighted average" by the "per-state max" turns the Bellman equation into the BOE. Nonlinearity enters here; optimality exits here.' },
        { lines: [18, 20], tag: 'stop', zh: '收敛判据与 L2 相同（max|Δv| < θ）——压缩映射定理保证必然触发，θ 只决定提前停时的精度。理论上指数收敛，实践中几十轮就非常接近 v*。', en: 'The stopping rule is identical to L2 (max|Δv| < θ) — the contraction mapping theorem guarantees it will trigger; θ only sets the early-stopping precision. Convergence is exponential in theory; in practice a few dozen sweeps land essentially on v*.' },
        { lines: [23, 23], tag: 'extract', zh: '<code class="inline">argmax(axis=1)</code> 就是定理 3.5 的贪心提取。注意 argmax 平局时只取第一个——而最优策略<strong>不必唯一</strong>；要展示所有最优动作，见第二段代码的 <code class="inline">isclose</code> 处理。', en: '<code class="inline">argmax(axis=1)</code> is Theorem 3.5\'s greedy extraction. Careful: argmax breaks ties by taking the first — yet optimal policies are <strong>not necessarily unique</strong>; to surface every optimal action see the isclose handling in the second code block.' },
      ],
    },
    {
      id: 'l3-greedy', file: 'greedy_policy.py — 贪心提取与平局', tab: '② 贪心提取 π*',
      intro: { zh: '这一小段专门处理"最优策略不唯一"这个理论上很美、工程上容易踩的点：v* 唯一，但多个动作的 q 可能并列最大。用 <code class="inline">np.isclose</code> 找出全部并列最优动作，要么平分概率（随机最优策略）、要么任选其一（确定性最优策略）——两者都货真价实。', en: 'This snippet handles a point that is lovely in theory and trippy in engineering: v* is unique but several actions may tie for the greatest q. <code class="inline">np.isclose</code> surfaces all tied-optimal actions; split the probability (a stochastic optimal policy) or keep one (deterministic) — both are genuinely optimal.' },
      code: srcGreedy,
      notes: [
        { lines: [10, 12], tag: 'q recompute', zh: 'q 值在这里重新算了一遍（值迭代内部也算过）——工程上应把 q_all 缓存复用；教学上单独成函数更清晰。这是"教科书结构"与"产品结构"的取舍。', en: 'The q values are recomputed here (value iteration already did) — in production you would cache q_all; as a teaching function, standalone clarity wins. A textbook-structure vs product-structure trade-off.' },
        { lines: [13, 14], tag: 'ties ★', zh: '<code class="inline">np.isclose(q, q.max(), atol=1e-9)</code> 找出所有并列最大——浮点世界里"相等"必须用容差。这些并列动作全部都是最优动作：这正是"v* 唯一但 π* 不唯一"的代码形态。', en: '<code class="inline">np.isclose(q, q.max(), atol=1e-9)</code> finds every tied maximum — in floating point, "equality" needs tolerance. All tied actions are jointly optimal: this is "v* unique, π* not necessarily" rendered as code.' },
        { lines: [15, 16], tag: 'one-hot', zh: '输出 one-hot（或平分）矩阵，恰好是 <code class="inline">add_policy()</code> 想要的格式——作业里画最优策略箭头图就是这两段代码 + 一行画图。平分概率时图上会出现多支箭头，长度表示概率。', en: 'The one-hot (or split) matrix is exactly what <code class="inline">add_policy()</code> consumes — the assignment\'s optimal-policy figure is these two functions plus one plotting call. With split probabilities several arrows appear per cell, their lengths encoding probability.' },
      ],
    },
  ];

  /* ═══ L3 Q&A ═══ */
  D.qaSets['l3'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '最优策略的准确定义是什么？', en: 'What exactly is an optimal policy?' },
      a: { zh: '状态值逐格 ≥ 一切其他策略的策略。注意这个定义只对<strong>表格型</strong>强化学习成立——当价值/策略用函数近似时（第 8、9 章），要换别的度量来定义最优。', en: 'A policy whose state values are cell-wise ≥ every other policy\'s. Note this definition holds only for <strong>tabular</strong> RL — once values/policies are approximated by functions (Chapters 8–9), different metrics are needed.' } },
    { tag: 'Q2 · 书上原问', q: { zh: 'BOE 是 Bellman 方程吗？', en: 'Is the BOE a Bellman equation?' },
      a: { zh: '是。它是对应策略恰为最优策略的特殊 Bellman 方程：解出 v* 后贪心得到的 π* 满足 v* = r<sub>π*</sub> + γP<sub>π*</sub>v*——把 BOE 展平就成了普通的 Bellman 方程。', en: 'Yes. It is the special Bellman equation whose corresponding policy is optimal: solve v*, extract π* greedily, and v* = r<sub>π*</sub> + γP<sub>π*</sub>v* — flattened, the BOE is an ordinary Bellman equation.' } },
    { tag: 'Q3 · 书上原问', q: { zh: 'BOE 的解唯一吗？', en: 'Is the BOE solution unique?' },
      a: { zh: '分两个未知数说：<strong>价值解 v* 唯一</strong>（压缩映射定理）；<strong>策略解 π* 不一定唯一</strong>——同一个 v* 可以被多条策略达到。山顶只有一个，登顶的路线可以有好几条。', en: 'Split by unknown: the <strong>value solution v* is unique</strong> (contraction mapping theorem); the <strong>policy solution π* need not be</strong> — several policies may attain the same v*. One summit, many routes.' } },
    { tag: 'Q4 · 书上原问', q: { zh: '分析 BOE 解的关键性质是什么？', en: 'Which property is key to analysing the BOE?' },
      a: { zh: '右端 f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) 是<strong>压缩映射</strong>（∞-范数、系数 γ）。有了它，压缩映射定理一口气给出存在性、唯一性、迭代算法和指数收敛速度。', en: 'That the right side f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) is a <strong>contraction mapping</strong> (∞-norm, factor γ). With it, the contraction mapping theorem delivers existence, uniqueness, an iterative algorithm, and exponential convergence in one stroke.' } },
    { tag: 'Q5 · 书上原问', q: { zh: '调低折扣率对最优策略的总体影响？', en: 'What happens to optimal policies when γ decreases?' },
      a: { zh: '策略变得更<strong>短视</strong>：不敢为远处的大奖励吃眼前的亏，绕开禁区、行为保守；γ = 0 时彻底只看即时奖励，甚至到不了目标。反过来调高 γ 则更<strong>远视</strong>、敢冒险。γ 是"胆量旋钮"。', en: 'Policies grow <strong>short-sighted</strong>: unwilling to suffer now for distant gains, they avoid forbidden cells and behave conservatively; at γ = 0 only immediate rewards matter and the target may never be reached. Raising γ makes policies <strong>far-sighted</strong> and bold. γ is the courage dial.' } },
    { tag: 'Q6 · 书上原问', q: { zh: '怎么得到最优策略？', en: 'How do we obtain an optimal policy?' },
      a: { zh: '用定理 3.3 的迭代（值迭代）解出 v*，再逐状态贪心提取 π*。书里所有算法——第 4 章到第 10 章——本质上都是在不同设定下（已知/未知模型、表格/函数近似）做这件事。', en: 'Solve the BOE by Theorem 3.3\'s iteration (value iteration), then extract π* greedily per state. Every algorithm in the book — Chapters 4 through 10 — is essentially this same pursuit under different settings (known/unknown model, tabular/function approximation).' } },
    { tag: 'Q7 · 旋钮速查', q: { zh: '想让智能体"更怕禁区"或"更快到目标"，该拧哪个旋钮？', en: 'Which knob makes the agent fear forbidden cells more, or hurry more?' },
      a: { zh: '怕禁区：加大 r<sub>forbidden</sub> 的负值（−1 → −10），或调小 γ（眼前惩罚更痛）。更快到目标：<strong>不需要加步数惩罚</strong>——γ 本身就是时间成本（绕路 γ²/(1−γ) 小于直达 1/(1−γ)）；统一加负奖励是仿射变换、无效。想放大行为差距：调 α 缩放全部奖励。', en: 'Fear forbidden cells: push r<sub>forbidden</sub> down (−1 → −10), or lower γ so present penalties sting. Hurry: <strong>no step penalty needed</strong> — γ already charges for time (detour γ²/(1−γ) &lt; direct 1/(1−γ)); a uniform negative shift is affine and useless. To amplify behaviour gaps: scale all rewards by α.' } },
  ];

  /* ═══ L3 知识填空 ═══ */
  D.fillSets['l3'] = {
    title: { zh: '第三讲 · 知识填充', en: 'Lecture 3 · Knowledge Fill-in' },
    items: [
      {
        kind: 'choice',
        tag: { zh: 'BOE · 消元', en: 'BOE · elimination' },
        stem: { zh: '从 Bellman 方程 v_π = r_π + γP_π v_π 到 BOE：在约束 Σ_a π(a|s) = 1 下最大化 Σ_a π(a|s)q(s,a)（例 3.2），最优局部策略是[[1]]，π 由此被消去，方程只剩 v = f(v)。',
          en: 'From the Bellman equation v_π = r_π + γP_π v_π to the BOE: maximise Σ_a π(a|s)q(s,a) under the constraint Σ_a π(a|s) = 1 (Example 3.2). The optimal local policy is [[1]], which eliminates π and leaves v = f(v).' },
        blanks: [
          { choices: { zh: ['把概率均分给所有动作', '把概率 1 全押在 q(s,a) 最大的动作上', '把概率押在即时奖励 r 最大的动作上'],
              en: ['spread probability evenly over all actions', 'put probability 1 on the action with the greatest q(s,a)', 'put probability on the action with the greatest immediate reward r'] },
            answer: 1,
            why: { zh: '加权平均的上界就是最大的 qᵢ，全部概率押上去恰好取到（q₃ 最大就取 c₃* = 1）。均分是"平均给定策略"的老习惯，只平均不挑选；按即时奖励挑则丢掉 γ 折扣——本讲迷你世界里即时更大的"留"（0.4）恰是陷阱，远处每步 +1 的 s2 才是金山。',
              en: 'The weighted average never exceeds the greatest qᵢ, and putting all probability on it attains that bound (if q₃ is largest, take c₃* = 1). Splitting evenly is the old "average a given policy" habit — averaging without choosing. Picking by immediate reward drops the γ discount: in this lecture’s miniature the fatter immediate reward of "stay" (0.4) is exactly the trap, while the +1-per-step s2 is the gold mine.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: 'max 的位置', en: 'Where max sits' },
        stem: { zh: '下一状态 S′ 以 0.5/0.5 落在 A 或 B，两动作的下一站价值为 q(A,a₁)=1、q(A,a₂)=0、q(B,a₁)=0、q(B,a₂)=1。则 E[max_a q(S′,a)] 与 max_a E[q(S′,a)] 分别等于[[1]]。',
          en: 'The next state S′ lands on A or B with probability 0.5 each; the two actions’ next-stop values are q(A,a₁)=1, q(A,a₂)=0, q(B,a₁)=0, q(B,a₂)=1. Then E[max_a q(S′,a)] and max_a E[q(S′,a)] equal [[1]], respectively.' },
        blanks: [
          { choices: { zh: ['0.5 与 1', '1 与 1', '1 与 0.5'], en: ['0.5 and 1', '1 and 1', '1 and 0.5'] },
            answer: 2,
            why: { zh: '先到 S′ 再挑（max 对每个到达状态逐点取）：0.5×1 + 0.5×1 = 1；现在就锁死一个动作：max(0.5, 0.5) = 0.5。max 与期望不可交换，差整整一倍——BOE 的最优性靠"每一站抵达后还能重新决策"，所以下一动作的 max 必须待在 E[S′] 里面。',
              en: 'Arrive first, then choose (the max is taken per arrival state): 0.5×1 + 0.5×1 = 1. Lock in an action now: max(0.5, 0.5) = 0.5. max and expectation do not commute — a factor of two apart. The BOE’s optimality rests on "re-deciding upon every arrival", so the next action’s max must stay inside E[S′].' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: 'v* vs π*', en: 'v* vs π*' },
        stem: { zh: '关于 BOE 的解，正确的说法是[[1]]。',
          en: 'About the solutions of the BOE, the correct statement is [[1]].' },
        blanks: [
          { choices: { zh: ['v* 唯一，是所有策略状态值的逐状态上确界；取到 v* 的最优策略可以不唯一', 'v* 与最优策略都唯一', 'v* 不唯一：每个最优策略有自己的 v*'],
              en: ['v* is unique — the per-state supremum over all policies’ state values; the optimal policies attaining v* need not be unique', 'both v* and the optimal policy are unique', 'v* is not unique: each optimal policy has its own v*'] },
            answer: 0,
            why: { zh: '压缩映射定理保证不动点唯一，v* 就是全体策略价值表逐状态的"天花板"（上确界）；书 Figure 3.3 里 0.5/0.5 随机策略与一条确定性策略同时取到它。山顶只有一个，登顶路线可以多条——动作打平时，掷不掷硬币都最优。',
              en: 'The contraction mapping theorem guarantees a unique fixed point, and v* is the per-state "ceiling" (supremum) over all policies’ value tables; in book Figure 3.3 a 0.5/0.5 stochastic policy and a deterministic one attain it simultaneously. One summit, many routes — and when actions tie, flipping a coin or not is equally optimal.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '压缩映射', en: 'Contraction' },
        stem: { zh: '压缩映射是指：存在 γ ∈ (0,1)，使[[1]]；对 BOE 的右端 f(v) = max_π(r_π + γP_π v)，定理 3.2 保证它恰好压缩，系数就是 γ（∞-范数）。',
          en: 'A contraction mapping admits some γ ∈ (0,1) such that [[1]]; for the BOE right side f(v) = max_π(r_π + γP_π v), Theorem 3.2 guarantees it is exactly a contraction with factor γ in the ∞-norm.' },
        blanks: [
          { choices: { zh: ['只要存在一对 x₁, x₂ 使距离缩小即可', '‖f(x₁)−f(x₂)‖ ≤ γ‖x₁−x₂‖ 对一切 x₁, x₂ 成立', 'γ 是放大系数：γ 越大，每轮迭代误差越大'],
              en: ['it suffices that some single pair x₁, x₂ moves closer', '‖f(x₁)−f(x₂)‖ ≤ γ‖x₁−x₂‖ holds for all x₁, x₂', 'γ is a magnification factor: the larger γ, the larger the per-round error'] },
            answer: 1,
            why: { zh: '定义要求"一切点对"的距离都至少缩到 γ 倍，一对缩小不算数——书例 f(x) = 0.5 sin x 靠中值定理 |0.5cos x₃| ≤ 0.5 在全轴验证。γ 是收缩比不是放大系数：误差估计 ‖v_k−v*‖ ≤ γ^k‖v₀−v*‖ 里 γ 越接近 1，每轮只压走 1−γ 份额，收敛越慢。',
              en: 'The definition demands that every pair of points shrink by at least a factor γ — one lucky pair proves nothing; the book’s f(x) = 0.5 sin x is verified on the whole axis via the mean value theorem, |0.5cos x₃| ≤ 0.5. γ is a contraction ratio, not a magnifier: in the error bound ‖v_k−v*‖ ≤ γ^k‖v₀−v*‖, the closer γ is to 1, the thinner the 1−γ share squeezed out per round and the slower the convergence.' } },
        ],
      },
      {
        kind: 'number',
        tag: { zh: '几何收敛', en: 'Geometric rate' },
        stem: { zh: '两状态迷你世界（γ = 0.5）：v*(s2) = 2 = 1/(1−γ)，值迭代从 v₀ = 0 出发，v(s2) 逐轮补齐为 2(1−0.5^k) = 1, 1.5, 1.75, …。第 3 轮后误差 |v*(s2) − v₃(s2)| = [[1]]。',
          en: 'Two-state miniature (γ = 0.5): v*(s2) = 2 = 1/(1−γ), and value iteration from v₀ = 0 fills v(s2) in as 2(1−0.5^k) = 1, 1.5, 1.75, …. After round 3 the error |v*(s2) − v₃(s2)| = [[1]].' },
        blanks: [
          { answer: 0.25, tol: 0.001,
            hint: { zh: 'v₃(s2) = 2(1−0.5³) = 1.75。', en: 'v₃(s2) = 2(1−0.5³) = 1.75.' },
            why: { zh: 'v₃ = 2(1−0.5³) = 1.75，误差 2 − 1.75 = 0.25 = 2×0.5³。误差每轮恰好缩到上一轮的一半——这就是压缩映射的几何收敛，γ 本身就是收缩比：γ 越小跑得越快，γ → 1 越慢。',
              en: 'v₃ = 2(1−0.5³) = 1.75, so the error is 2 − 1.75 = 0.25 = 2×0.5³. Each round shrinks the error to exactly half of the previous one — that is the contraction mapping’s geometric convergence, with γ itself as the ratio: smaller γ runs faster, γ → 1 crawls.' } },
        ],
      },
      {
        kind: 'code',
        tag: { zh: 'code · 逐元素 max', en: 'code · elementwise max' },
        stem: { zh: '本讲 code-lab 的值迭代先算齐全部 q(s,a)（形状 (n, n_a) 的表），再用一行取出每个状态的最大动作值。[[1]] 处应填：',
          en: 'The value-iteration code in this lecture’s code lab first fills the whole q-table of shape (n, n_a), then extracts every state’s greatest action value in one line. What goes at [[1]]?' },
        code: { zh: 'v_new = q_all.max([[1]])   # 逐状态取最大：BOE 的心脏',
          en: 'v_new = q_all.max([[1]])   # per-state max: the heart of the BOE' },
        blanks: [
          { choices: { zh: ['axis=1', 'axis=0', 'axis=None'], en: ['axis=1', 'axis=0', 'axis=None'] },
            answer: 0,
            why: { zh: 'q_all 行是状态、列是动作，axis=1 沿动作轴逐行取 max，得到 n 维的 v_new——把 L2 的"π 加权平均"换成这一步 max，Bellman 方程就成了 BOE。axis=0 是跨状态比大小（不同状态的 q 没有可比性），不填轴向则整张表只出一个最大值。',
              en: 'Rows of q_all are states, columns are actions; axis=1 takes the max along the action axis, yielding the n-dimensional v_new — swapping L2’s "π-weighted average" for this max turns the Bellman equation into the BOE. axis=0 would compare across states (q values of different states are not comparable), and omitting the axis collapses the whole table to a single number.' } },
        ],
      },
      {
        kind: 'code',
        tag: { zh: 'code · 折扣位置', en: 'code · the discount spot' },
        stem: { zh: '同一段代码的上一行：q 值由即时奖励加"折扣后的下一状态价值"组成。按 q(s,a) = r + γ·v(s′)（本讲 γ = 0.9），[[1]] 处应填：',
          en: 'One line above in the same function: each q value is the immediate reward plus the discounted next-state value. Per q(s,a) = r + γ·v(s′) with γ = 0.9 as in this lecture, what goes at [[1]]?' },
        code: { zh: 'q_all[s, a] = r + [[1]] * v[s_next]   # 未来价值打一次 γ 折',
          en: 'q_all[s, a] = r + [[1]] * v[s_next]   # discount the future once more' },
        blanks: [
          { choices: { zh: ['gamma', '1 / gamma', '1 - gamma'], en: ['gamma', '1 / gamma', '1 - gamma'] },
            answer: 0,
            why: { zh: '每多走一步，未来就多打一次 γ 折，所以是 gamma（0.9）。写成 1 / gamma 会把越远的未来放得越大；写成 1 - gamma 则把 0.9 折变成 0.1 折、未来几乎归零——都是把折扣方向记反的典型笔误。γ < 1 正是右端成为压缩映射的来源。',
              en: 'Each extra step discounts the future once more by γ, hence gamma (0.9). Writing 1 / gamma would magnify the distant future more and more; writing 1 - gamma turns a 0.9 keep-rate into 0.1, nearly zeroing the future — both are the classic direction-reversed typo. And γ < 1 is exactly what makes the right side a contraction.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '绕路与环路', en: 'Detours and circuits' },
        stem: { zh: '走路不要钱（r_other = 0），关于最优策略的路径，正确的说法是[[1]]。',
          en: 'Walking is free (r_other = 0). About the optimal policy’s path, the correct statement is [[1]].' },
        blanks: [
          { choices: { zh: ['它会故意兜风再进目标，反正走路不要钱', '最优路径永远是最短路，任何情况下都直奔目标', '它不兜风——γ 本身就是时间成本；但该绕时真绕：γ 小或禁区罚重时，最优策略在非目标态绕开禁区走远路'],
              en: ['it joyrides before entering the target, since walking is free', 'the optimal path is always a shortest path and never avoids forbidden cells', 'it does not joyride — γ itself is the cost of time; yet it detours when needed: with small γ or harsher forbidden penalties the optimal policy leaves the shortest path to avoid forbidden cells'] },
            answer: 2,
            why: { zh: 'γ=0.9 时直走回报 1/(1−γ) = 10，晚两步只剩 γ²/(1−γ) = 8.1——折扣天生罚时间，兜风不划算。但安全是另一本账：γ=0.5 重解 3×3 世界，s3 穿禁区 q* = −1 + 0.5×2 = 0，绕行 q* = 0.25，最优策略立刻改绕行；r_forbidden 从 −1 加到 −10 后连 γ=0.9 也绕。时间账与安全账分开算。',
              en: 'At γ = 0.9 the direct policy earns 1/(1−γ) = 10 while entering two steps late earns only γ²/(1−γ) = 8.1 — discounting charges for time by birth, so joyriding never pays. But safety is a different ledger: re-solve the 3×3 world at γ = 0.5 and at s3 the forbidden-crossing branch gives q* = −1 + 0.5×2 = 0 against the detour’s 0.25, so the optimal policy switches at once; push r_forbidden from −1 to −10 and even γ = 0.9 detours. Keep the time account and the safety account separate.' } },
        ],
      },
      {
        kind: 'number',
        tag: { zh: 'γ 的利息', en: 'γ’s interest' },
        stem: { zh: 'r_other = 0，γ = 0.9：直走策略的折扣回报 1/(1−γ) = 10；绕路策略晚两步进目标，回报是 γ²/(1−γ) = [[1]]。',
          en: 'With r_other = 0 and γ = 0.9: the direct policy earns 1/(1−γ) = 10; the detour enters the target two steps later and earns γ²/(1−γ) = [[1]].' },
        blanks: [
          { answer: 8.1, tol: 0.01,
            hint: { zh: '先算 0.9²，再除以 1 − 0.9。', en: 'Compute 0.9² first, then divide by 1 − 0.9.' },
            why: { zh: '0.9²/(1−0.9) = 0.81/0.1 = 8.1，比直走的 10 少 1.9——晚两步就多打两次 0.9 折。所以 r_other = 0 时最优策略也不兜风，γ 已在对未来收"时间利息"；想改快慢去调 γ 或相对奖励差，统一加步数惩罚是仿射变换、无效。',
              en: '0.9²/(1−0.9) = 0.81/0.1 = 8.1, a full 1.9 below the direct 10 — two steps later means discounted twice. So even with r_other = 0 the optimal policy never joyrides: γ already collects "time interest" on the future. To change hurry-behaviour, tune γ or the relative reward gaps; a uniform step penalty is an affine shift and does nothing.' } },
        ],
      },
    ],
  };


  /* ═══ L3 定理推导 ═══ */
  D.derivationSets = D.derivationSets || {};
  D.derivationSets['l3'] = {
    title: { zh: '第三讲 · 定理推导', en: 'Lecture 3 · Theorem Derivations' },
    items: [
      {
        id: 'bellman-optimality',
        name: { zh: 'Bellman 最优方程', en: 'The Bellman Optimality Equation' },
        intro: {
          zh: '从"所有策略的上确界"出发，亲手把最优性写进方程：为什么允许逐状态取 max、一步展开后 BOE 长什么样、max 为什么挡住闭式解、不动点与贪心如何把 v* 与 π* 一起交到你手上。',
          en: 'Starting from the supremum over all policies, write optimality into an equation with your own hands: why the per-state max is legal, what the BOE looks like after the one-step expansion, why the max blocks any closed form, and how the fixed-point view plus greed hand you both v* and π*.',
        },
        steps: [
          { // 1 回顾：回报与状态值
            tex: String.raw`\begin{gathered} G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots \\[4pt] v_\pi(s) = \mathbb{E}_\pi\!\left[\, G_t \mid S_t = s \,\right] \end{gathered}`,
            why: { zh: '照抄 L2 的起点：回报是逐打 γ 折的奖励流之和（γ < 1 保证收敛），状态值是策略 π 下的条件期望。最优性要比较的正是这一张张 v_π 表。', en: 'L2\'s starting point verbatim: the return is the reward stream discounted step by step (γ < 1 keeps it convergent), and the state value is its conditional expectation under a policy π. Optimality is precisely a comparison among these v_π tables.' },
          },
          { // 2 v* 的定义：上确界
            tex: String.raw`v^*(s) \;\triangleq\; \htmlClass{fx-gold}{\sup_{\pi}\, v_\pi(s)} \;=\; \sup_{\pi}\; \mathbb{E}_\pi\!\left[\, G_t \mid S_t = s \,\right]`,
            why: { zh: '最优状态值的定义：固定状态 s，对<strong>所有</strong>（含随机）策略的状态值取上确界——逐状态取上界，不是把全表加总再比。有限 MDP 里这个上确界取得到（最优策略存在），sup 实为 max；存在性在第 12 步由不动点定理正式兑现。', en: 'The definition of optimal state values: at a fixed state s, take the supremum over <strong>all</strong> (including stochastic) policies\' state values — per state, never a total over the table. In a finite MDP the supremum is attained (an optimal policy exists), so the sup is in fact a max; existence is cashed formally by the fixed-point theorem at step 12.' },
          },
          { // 3 首步分解
            tex: String.raw`v_\pi(s) = \sum_{a\in\mathcal{A}(s)} \pi(a\mid s)\; q_\pi(s,a) \qquad\quad q_\pi(s,a) = \mathbb{E}_\pi\!\left[\, G_t \mid S_t = s,\ A_t = a \,\right]`,
            why: { zh: 'L2 的首步分解（式 2.13）：π 在 s 处以概率 π(a|s) 选动作，q_π(s,a) 是"先执行 a、其后遵循 π"的期望回报。这把"对整条策略取 sup"拆成了"对第一步动作的选择"——最优化的自由度全部集中在这一步。', en: 'L2\'s first-step decomposition (Eq. 2.13): π picks action a at s with probability π(a|s), and q_π(s,a) is the expected return of "take a first, then follow π". This splits the "sup over whole policies" into "the choice of the first action" — all the optimisation freedom concentrates on this single move.' },
          },
          { // 4 q* 的定义
            tex: String.raw`q^*(s,a) \;\triangleq\; \sup_{\pi}\; q_\pi(s,a)`,
            why: { zh: '动作值版本的最优：在 s 先固定执行 a，对"其后的一切策略"取上确界——sup 只作用于 a 之后的策略，a 已被写进条件。v* 与 q* 是同一枚硬币的两面：q* 是"先做 a 再最优"，v* 连第一步也选到最好。', en: 'The action-value version of optimality: fix executing a at s first, then take the supremum over "every policy thereafter" — the sup acts only on the policies after a, which already sits in the condition. v* and q* are two faces of one coin: q* is "act a, then optimal"; v* additionally chooses the first move optimally.' },
          },
          { // 5 ★ blank：逐状态取 max 的合法性
            tex: String.raw`v^*(s) = \htmlClass{fx-gold}{\max_{a\in\mathcal{A}(s)}\; \text{?}}`,
            why: { zh: '凭什么是 max：马尔可夫性允许<strong>逐状态重组</strong>策略——在 s 选哪个动作不影响其他状态怎么做才是最优（未来只通过下一状态的 v* 进入当前账本），于是"整条策略的 sup"落成"首动作的 max"。例 3.2 的全押论证（约束 Σπ = 1 下最大化加权平均 ⟹ 概率 1 押最大 q）给出同一结论——这正是"策略可以逐格贪心"的合法性来源。', en: 'Why a max is legal: the Markov property lets us <strong>reassemble policies state by state</strong> — which action s takes does not affect what is optimal elsewhere (the future enters today\'s ledger only through v* of the next state), so the "sup over whole policies" lands as a "max over first actions". Example 3.2\'s all-in argument (maximising a weighted average under Σπ = 1 puts probability 1 on the greatest q) says the same — this is exactly why per-state greed is legitimate.' },
            blank: {
              q: { zh: '关键步：sup<sub>π</sub> v<sub>π</sub>(s) 为什么能换成对动作的 max？选出正确的等式。', en: 'Key step: why can sup<sub>π</sub> v<sub>π</sub>(s) become a max over actions? Pick the correct identity.' },
              choices: [
                { tex: String.raw`v^*(s) = \sum_{a\in\mathcal{A}(s)} \pi(a\mid s)\; q^*(s,a)` },
                { tex: String.raw`v^*(s) = \max_{a\in\mathcal{A}(s)}\; q^*(s,a)` },
                { tex: String.raw`v^*(s) = \max_{a\in\mathcal{A}(s)}\; r(s,a)` },
              ],
              answer: 1,
              whyWrong: [
                { zh: '这是 L2 的老习惯——"对给定的选择做加权平均"。任何 π 的加权平均都不超过 max<sub>a</sub> q*(s,a)，只有把概率 1 全押在最大 q 上才恰好取到（例 3.2 的全押论证）。平均是评估，挑选才是寻优。', en: 'This is L2\'s old habit — "averaging given choices". Any π-weighted average never exceeds max<sub>a</sub> q*(s,a); only probability 1 on the greatest q attains it (Example 3.2\'s all-in argument). Averaging evaluates; choosing optimises.' },
                { zh: '正确：马尔可夫性允许逐状态重组——一个状态选什么动作不影响其他状态的最优性，"对策略的 sup"于是落成"对首动作的 max"。', en: 'Correct: the Markov property allows per-state reassembly — what one state plays does not affect what is optimal elsewhere, so the "sup over policies" lands as a "max over first actions".' },
                { zh: '只对即时奖励贪心，丢掉了折扣未来 γ Σ<sub>s′</sub> p(s′|s,a) v*(s′)。§3.5 的迷你世界里即时 0.4 的"留"恰是陷阱，远处每步 +1 才是金山——最优看的是"即时 + 折扣未来"的整体。', en: 'Greedy on the immediate reward alone drops the discounted future γ Σ<sub>s′</sub> p(s′|s,a) v*(s′). In §3.5\'s miniature the fatter immediate 0.4 of "stay" is exactly the trap while the +1-per-step future is the gold mine — optimality weighs "immediate + discounted future" as a whole.' },
              ],
              hint: { zh: '想想"对整条策略的 sup"和"第一步选哪个动作"的关系——未来经由哪个量进入当前这一步？', en: 'How does "sup over whole policies" relate to "which first action"? Through which quantity does the future enter this step?' },
            },
          },
          { // 6 q* 拆一步
            tex: String.raw`q^*(s,a) = \mathbb{E}\!\left[\, R_{t+1} + \gamma\, v^*(S_{t+1}) \;\middle|\; S_t = s,\ A_t = a \,\right]`,
            why: { zh: '拆一步（L2 同款手法，对象换成最优）：先吃即时奖励 R<sub>t+1</sub>，抵达 S<sub>t+1</sub> 后"从那里出发的最优期望回报"按定义就是 v*(S<sub>t+1</sub>)。第 5 步的逐状态重组在这里再次使用：到达哪个状态就在哪个状态最优，无需预先承诺一条完整策略。', en: 'Peel off one step (L2\'s move, now applied to the optimal): collect R<sub>t+1</sub> first, and upon arriving at S<sub>t+1</sub> "the optimal expected return from there" is by definition v*(S<sub>t+1</sub>). Step 5\'s per-state reassembly is used again: be optimal wherever you arrive — no need to pre-commit to a whole policy.' },
          },
          { // 7 ★ blank：一步转移展开
            tex: String.raw`q^*(s,a) = \htmlClass{fx-gold}{\sum_r p(r\mid s,a)\, r \;+\; \gamma \sum_{s'} p(s'\mid s,a)\, \text{?}}`,
            why: { zh: '全期望公式按模型展开：R<sub>t+1</sub> 的条件期望按 p(r|s,a) 加权，S<sub>t+1</sub> 的分布按 p(s′|s,a) 加权——与 L2 推导的同款展开完全同构，只是 v<sub>π</sub> 换成 v*。注意每个 v*(s′) 里各自藏着 max——下一状态的动作选择发生在下一状态。', en: 'The law of total expectation unfolds through the model: R<sub>t+1</sub>\'s conditional mean is weighted by p(r|s,a), S<sub>t+1</sub>\'s distribution by p(s′|s,a) — exactly isomorphic to the same expansion in the L2 derivation, with v<sub>π</sub> swapped for v*. Note that each v*(s′) hides its own max inside — the next state\'s action choice happens in the next state.' },
            blank: {
              q: { zh: '关键步：把条件期望按模型 p 展开，选出正确的一步转移形式。', en: 'Key step: unfold the conditional expectation through the model p; pick the correct one-step expansion.' },
              choices: [
                { tex: String.raw`q^*(s,a) = \sum_r p(r\mid s,a)\, r + \sum_{s'} p(s'\mid s,a)\, v^*(s')` },
                { tex: String.raw`q^*(s,a) = \sum_r p(r\mid s,a)\, r + \gamma \sum_{s'} p(s'\mid s,a)\, q^*(s', a)` },
                { tex: String.raw`q^*(s,a) = \sum_r p(r\mid s,a)\, r + \gamma \sum_{s'} p(s'\mid s,a)\, v^*(s')` },
              ],
              answer: 2,
              whyWrong: [
                { zh: '漏了 γ：每多走一步，未来要多打一次折。γ < 1 不仅让回报收敛，更是后面"压缩系数恰为 γ"的来源——漏掉它，收敛分析整个塌掉。', en: 'γ is missing: every extra step discounts the future once more. γ < 1 not only keeps returns convergent but is exactly the source of the "contraction factor γ" to come — drop it and the whole convergence analysis collapses.' },
                { zh: '动作沿用了当前的 a：到了 s′ 该重新选动作——v*(s′) = max<sub>a′</sub> q*(s′,a′) 里的 a′ 是"到那时再挑"，把今天的 a 带过去等于放弃抵达后重新决策的权利。', en: 'The current action a is carried over: upon arriving at s′ the choice must be made anew — inside v*(s′) = max<sub>a′</sub> q*(s′,a′) the a′ is "chosen then"; carrying today\'s a over forfeits the right to re-decide upon arrival.' },
                { zh: '正确：即时项按 p(r|s,a) 加权、未来按 p(s′|s,a) 加权再打一次 γ 折——与 L2 的展开同构，v<sub>π</sub> 换成 v*。', en: 'Correct: the immediate term weighted by p(r|s,a), the future weighted by p(s′|s,a) and discounted once by γ — isomorphic to L2\'s expansion with v<sub>π</sub> replaced by v*.' },
              ],
              hint: { zh: '两项结构：即时奖励的均值 + γ × 下一状态价值的均值。下一状态该用 v*(s′) 还是沿用当前动作的 q*(s′, a)？', en: 'Two-part structure: the mean immediate reward + γ × the mean next-state value. For the next state, v*(s′), or today\'s action carried over as q*(s′, a)?' },
            },
          },
          { // 8 合并：BOE 逐状态形式
            tex: String.raw`v^*(s) = \max_{a\in\mathcal{A}(s)} \Big[\, \htmlClass{fx-gold}{\sum_r p(r\mid s,a)\, r + \gamma \sum_{s'} p(s'\mid s,a)\, v^*(s')} \,\Big]`,
            why: { zh: '把第 5 步的 max 与第 7 步的展开拼装，得到 <strong>Bellman 最优方程（BOE）</strong>的逐状态形式。注意方程里已经没有 π：max 就是"选最好"的数学化身，π 被消元（例 3.2：最优局部策略把概率 1 押在最大 q 上）——所以解 BOE 不需要预先知道 π*。', en: 'Assembling step 5\'s max with step 7\'s expansion yields the <strong>Bellman optimality equation (BOE)</strong> in per-state form. Note that π no longer appears: the max is "choose the best" made mathematical, and π is eliminated (Example 3.2: the optimal local policy puts probability 1 on the greatest q) — so solving the BOE presumes no knowledge of π*.' },
          },
          { // 9 矩阵形式
            tex: String.raw`\mathbf{v}^* = \htmlClass{fx-gold}{\max_{\pi}} \big(\, \mathbf{r}_\pi + \gamma\, \mathbf{P}_\pi\, \mathbf{v}^* \,\big)`,
            why: { zh: '矩阵形式：max 逐分量作用（每个状态各自挑最优）。与 L2 的 v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> 并排对照，结构只差一个 max——"平均给定的选择"升级为"挑选最好的选择"。这一个记号的差别，改写了整个求解理论。', en: 'Matrix form: the max acts component-wise (each state picks its own best). Side by side with L2\'s v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub>, the structure differs by a single max — "averaging given choices" upgraded to "choosing the best". That one symbol rewrites the entire solution theory.' },
          },
          { // 10 与 L2 对比：max 挡住闭式解
            tex: String.raw`\begin{gathered} \text{L2 (linear):}\quad \mathbf{v}_\pi = \mathbf{r}_\pi + \gamma\mathbf{P}_\pi\mathbf{v}_\pi \;\Longrightarrow\; \mathbf{v}_\pi = (I-\gamma\mathbf{P}_\pi)^{-1}\mathbf{r}_\pi \\[6pt] \text{BOE (nonlinear):}\quad \mathbf{v}^* = \max_\pi\big(\mathbf{r}_\pi + \gamma\mathbf{P}_\pi\mathbf{v}^*\big) \;\;\htmlClass{fx-red}{\cancel{\Longrightarrow}}\;\; \mathbf{v}^* = (I-\gamma\mathbf{P}_{\pi^*})^{-1}\mathbf{r}_{\pi^*} \end{gathered}`,
            why: { zh: 'L2 能闭式解，靠的是线性：v 在两边出现不要紧，移项成 (I − γP<sub>π</sub>)v<sub>π</sub> = r<sub>π</sub> 再求逆——I − γP<sub>π</sub> 可逆由 L2 推导 #2 的 Neumann 级数证好。BOE 里 max 挡在中间：它对 v 非线性，"移项"从第一步就不存在；而且该用哪个 P<sub>π</sub> 取决于 max 选出的动作（π* 又依赖 v*），循环依赖。闭式解出局，只能迭代——这正是引入不动点视角的直接动机。', en: 'L2\'s closed form leans on linearity: v on both sides is fine — transpose to (I − γP<sub>π</sub>)v<sub>π</sub> = r<sub>π</sub> and invert, with invertibility proved in L2 derivation #2 via the Neumann series. In the BOE the max blocks the way: it is nonlinear in v, so "transposing" never gets started; and which P<sub>π</sub> applies depends on the action the max selects (π* itself depends on v*) — a circular dependence. The closed form is out, iteration is in — precisely the motivation for the fixed-point view.' },
          },
          { // 11 max 与期望不可交换
            tex: String.raw`\mathbb{E}_{S'}\!\Big[\max_{a'} q^*(S',a')\Big] = 1 \qquad\neq\qquad \max_{a'}\, \mathbb{E}_{S'}\!\big[q^*(S',a')\big] = \tfrac{1}{2}`,
            why: { zh: 'max 与期望不可交换（非线性的微观来源）。书中两状态反例：S′ 各以 0.5 落 A 或 B，q(A,a₁)=1、q(A,a₂)=0、q(B,a₁)=0、q(B,a₂)=1。先看牌再选：0.5×1 + 0.5×1 = 1；先锁死动作再看牌：max(0.5, 0.5) = 0.5。max 提到期望外等于放弃"抵达后重新决策"的权利——所以 BOE 里当前的 max（对 a）可以放最外层，S′ 处的 max 必须待在 Σ<sub>s′</sub> 之内。', en: 'max and expectation do not commute (the microscopic source of nonlinearity). The book\'s two-state counterexample: S′ lands on A or B with probability 0.5 each, with q(A,a₁)=1, q(A,a₂)=0, q(B,a₁)=0, q(B,a₂)=1. Look then choose: 0.5×1 + 0.5×1 = 1; choose then look: max(0.5, 0.5) = 0.5. Hoisting the max outside the expectation forfeits the right to re-decide upon arrival — hence in the BOE the current max (over a) may sit outermost, while the max at S′ must stay inside the Σ<sub>s′</sub>.' },
          },
          { // 12 不动点视角：Bellman 最优算子
            tex: String.raw`(T^* v)(s) \;\triangleq\; \max_{a\in\mathcal{A}(s)}\Big[\, \sum_r p(r\mid s,a)\, r + \gamma \sum_{s'} p(s'\mid s,a)\, v(s') \,\Big] \qquad\Longrightarrow\qquad \htmlClass{fx-gold}{T^* v^* = v^*}`,
            why: { zh: '不动点视角：把 BOE 右端定义成 <strong>Bellman 最优算子 T*</strong>——输入任意价值表 v，输出"对 v 贪心一步"的新表。第 8 步的 BOE 即 v* = T*v*：<strong>v* 是 T* 的不动点</strong>。线性代数谢幕，接力棒交给不动点理论：本章定理 3.2 证得 T* 是 ∞-范数下系数恰为 γ 的压缩映射，于是解存在、唯一、可迭代——完整证明是 L4 推导的主角，这里先把视角立起来。', en: 'The fixed-point view: define the BOE\'s right side as the <strong>Bellman optimality operator T*</strong> — feed in any value table v, get back the table "one greedy step against v". Step 8\'s BOE is exactly v* = T*v*: <strong>v* is a fixed point of T*</strong>. Linear algebra exits, fixed-point theory takes the baton: Theorem 3.2 of this chapter proves T* is a contraction of factor exactly γ in the ∞-norm, so the solution exists, is unique, and is iterable — the full proof stars in L4\'s derivation; here we set up the viewpoint.' },
          },
          { // 13 greedy 策略
            tex: String.raw`\pi^*(s) = \htmlClass{fx-gold}{\arg\max_{a\in\mathcal{A}(s)}\; q^*(s,a)} \qquad\Longrightarrow\qquad v_{\pi^*} = v^* \;\geq\; v_\pi \quad \forall\,\pi`,
            why: { zh: '贪心构造：解出 v* 后，逐状态选 q*(s,a) 最大的动作即得 π*（定理 3.5；平局时任选或平分概率——π* 可以不唯一，但必有确定性最优）。代回 BOE 得 v* = r<sub>π*</sub> + γP<sub>π*</sub>v*，BOE 正是"对应最优策略的特殊 Bellman 方程"；定理 3.4 认证 v<sub>π*</sub> = v* ≥ v<sub>π</sub> 对一切 π。max 是分析工具，argmax 是构造工具——从值迭代到 Q-learning 的贪心步用的都是它。', en: 'The greedy construction: once v* is solved, pick per state the action with the greatest q*(s,a) — that is π* (Theorem 3.5; ties may be broken arbitrarily or split — π* need not be unique, yet a deterministic optimum always exists). Substituting back gives v* = r<sub>π*</sub> + γP<sub>π*</sub>v*, i.e. the BOE is exactly "the special Bellman equation of the optimal policy", and Theorem 3.4 certifies v<sub>π*</sub> = v* ≥ v<sub>π</sub> for every π. max is the analysis tool; argmax is the construction tool — from value iteration to Q-learning\'s greedy step, it is the argmax that builds policies.' },
          },
          { // 14 闭合卡
            tex: String.raw`\begin{gathered} \sup_\pi v_\pi(s) \;\to\; \max_a q^*(s,a) \;\to\; \text{BOE:}\; v^*(s) = \max_a\Big[\textstyle\sum_r p(r\mid s,a)\,r + \gamma\sum_{s'} p(s'\mid s,a)\,v^*(s')\Big] \\[4pt] \longrightarrow\; T^* v^* = v^* \;\longrightarrow\; \pi^*(s) = \arg\max_a\, q^*(s,a) \end{gathered}`,
            why: { zh: '闭合卡：上确界定义（1–2）→ 马尔可夫性允许逐状态重组（3–5）→ 一步展开（6–8）→ 非线性挡住闭式解、max 与期望不可交换（9–11）→ 不动点视角（12）→ argmax 构造 π*（13）。每一环都承重：去掉马尔可夫性，max 不合法；去掉 γ，压缩性消失；把 max 挪出期望，最优性蒸发。下一站 L4：T* 的 γ-压缩性 ⟹ 值迭代从任意起点指数收敛；本讲的 NB1 笔记本把这条迭代跑给你看。', en: 'Closing card: supremum definition (1–2) → Markov per-state reassembly (3–5) → one-step expansion (6–8) → nonlinearity blocking the closed form and the non-commuting max (9–11) → the fixed-point view (12) → the argmax construction of π* (13). Every link carries load: drop the Markov property and the max is illegal; drop γ and contraction evaporates; hoist the max out of the expectation and optimality vanishes. Next stop L4: T*\'s γ-contraction ⟹ value iteration converges exponentially from any start; this lecture\'s NB1 notebook runs that iteration for you.' },
          },
        ],
      },
    ],
  };

  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l3 = D.otherLectures.find(l => l.no === 3);
  if (l3) l3.done = true;
})();
