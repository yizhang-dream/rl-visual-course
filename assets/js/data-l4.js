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
        tex: String.raw`v_k(s) \rightarrow q_k(s,a) \rightarrow \htmlClass{fx-violet}{\text{贪心 }\;\pi_{k+1}(s) = \argmax_a q_k(s,a)} \rightarrow \htmlClass{fx-accent}{v_{k+1}(s) = \max_a q_k(s,a)}` },
      { t: 'callout', variant: 'danger', zh: '<strong>书上一处极容易被忽略的提醒</strong>：迭代过程中的 v<sub>k</sub> <strong>不是状态值</strong>！它一般不满足任何策略的 Bellman 方程（既不是 v<sub>π<sub>k</sub></sub> 也不是 v<sub>π<sub>k+1</sub></sub>），只是算法的中间产物；同理 q<sub>k</sub> 也不是动作价值。它们只是恰好<strong>收敛到</strong>最优值而已。考试和作业里都要把这个说法写对。', en: '<strong>A reminder from the book that is easy to skim past</strong>: the intermediate v<sub>k</sub> is <strong>not a state value</strong>! In general it satisfies no policy’s Bellman equation (neither v<sub>π<sub>k</sub></sub> nor v<sub>π<sub>k+1</sub></sub>) — it is merely an intermediate quantity of the algorithm; likewise q<sub>k</sub> is not an action value. They merely happen to <strong>converge to</strong> the optimal values. Phrase this correctly in exams and reports.' },
      { t: 'p', zh: '<strong>收敛性从哪来？兑现 L3 的那张票。</strong>把一轮迭代看作映射 f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v)（Bellman 最优算子）。L3 定理 3.2 已经证明：∞-范数下 f 是系数恰为 γ 的<strong>压缩映射</strong>；定理 3.1（Banach 不动点定理）随即兑现承诺——压缩映射有唯一不动点，且从<strong>任意初值</strong>出发迭代都收敛到它，这个不动点正是 BOE 的解 v*。压缩还白送一条速率信息：<strong>误差每轮精确地乘一次 γ</strong>，收敛是几何式（指数式）的。γ 越接近 1 压得越慢——收敛速度完全被 γ 一手决定。', en: '<strong>Where does convergence come from? Cashing L3’s ticket.</strong> View one iteration as the map f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v), the Bellman optimality operator. L3’s Theorem 3.2 already proved f is a <strong>contraction</strong> with factor exactly γ in the ∞-norm; Theorem 3.1 (the Banach fixed-point theorem) then honours the promise — a contraction has a unique fixed point, iteration from <strong>any initial value</strong> converges to it, and that fixed point is exactly the BOE’s solution v*. Contraction throws in a rate for free: <strong>the error is multiplied by γ once per round</strong>, geometric (exponential) convergence. The closer γ is to 1, the slower the squeeze — the speed is dictated entirely by γ.' },
      { t: 'formula', lbl: '几何收敛率 · Geometric convergence rate',
        tex: String.raw`\lVert v_k - v^* \rVert_\infty \le \gamma\,\lVert v_{k-1} - v^* \rVert_\infty \le \cdots \le \htmlClass{fx-accent}{\gamma^k\,\lVert v_0 - v^* \rVert_\infty}`,
        note: '（误差每轮 ×γ：γ = 0.9 时约 22 轮缩小 10 倍）' },
      { t: 'p', zh: '书上用 2×2 世界把 Algorithm 4.1 手工跑了两轮：k=0 时 v₀ = 0，q 表全是即时奖励，贪心挑出 π₁（s1 处 a₅ 和 a₃ 并列最大、随便选一个——这正是"最优策略不必唯一"的现场演示）；k=1 时 π₂ 已经是最优策略。下面自己跑一遍，对照书里的 Table 4.2/4.3。', en: 'The book hand-runs Algorithm 4.1 for two rounds on a 2×2 world: at k=0 with v₀ = 0 the q-table is all immediate rewards, and the greedy π₁ (a₅ and a₃ tie at s1 — pick either, a live demonstration that "optimal policies need not be unique"); at k=1 π₂ is already optimal. Run it yourself below and check against the book\'s Tables 4.2/4.3.' },
      { t: 'widget', component: 'l4-vi-sim' },
      { t: 'p', zh: '<strong>数值演算（书 Ch.1 的 3×3 世界，γ = 0.9，v₀ = 0）</strong>。第 1 轮 q 表退化为纯即时奖励，v₁ = [0, 0, 0, 0, 0, 1, 0, 1, 1]——只有一步就能碰到目标的状态非零；第 2 轮价值向外传一格：v₂ = [0, 0, 0, 0, 0.9, 1.9, 0.9, 1.9, 1.9]。迭代到底，v* = [7.29, 8.1, 8, 8.1, 9, 10, 9, 10, 10]——注意 s9 的 10 = 1/(1−γ)，最优动作是"原地领奖"。三个可以亲手验证的规律：<strong>相邻两轮之差 ‖v<sub>k+1</sub> − v<sub>k</sub>‖<sub>∞</sub> 恰为 0.9<sup>k</sup></strong>（1, 0.9, 0.81, …）；真实误差 ‖v<sub>k</sub> − v*‖<sub>∞</sub> = 9 × 0.9<sup>k−1</sup>，与压缩映射的预言逐轮吻合；v<sub>k</sub>(s9) = 10(1 − 0.9<sup>k</sup>)——离收敛"缺的那块"正好按几何级数补齐。', en: '<strong>A numeric run (the book’s Ch.1 3×3 world, γ = 0.9, v₀ = 0).</strong> Round 1 degenerates the q-table to pure immediate rewards: v₁ = [0, 0, 0, 0, 0, 1, 0, 1, 1] — only states touching the target in one step are nonzero; round 2 propagates values one cell outward: v₂ = [0, 0, 0, 0, 0.9, 1.9, 0.9, 1.9, 1.9]. Iterating to the end, v* = [7.29, 8.1, 8, 8.1, 9, 10, 9, 10, 10] — note the 10 at s9 is 1/(1−γ), with "collect in place" the optimal action. Three patterns you can verify by hand: <strong>the round-to-round gap ‖v<sub>k+1</sub> − v<sub>k</sub>‖<sub>∞</sub> is exactly 0.9<sup>k</sup></strong> (1, 0.9, 0.81, …); the true error ‖v<sub>k</sub> − v*‖<sub>∞</sub> = 9 × 0.9<sup>k−1</sup>, matching the contraction prediction round by round; and v<sub>k</sub>(s9) = 10(1 − 0.9<sup>k</sup>) — the missing chunk to convergence fills in as a geometric series.' },
      { t: 'callout', variant: 'done', zh: '<strong>策略比价值先到站。</strong>在同一个 3×3 世界里跟踪贪心策略：π₃ 已经等于最优策略（s1 处 a2/a3 并列，选哪个都最优），此后每轮稳定不动；而此时 v₃(s9) = 2.71，离极限 10 还远。价值要几十轮才收敛，策略往往提前很久就"定型"——近最优的价值足以排出正确的动作名次。工程含义：不必等 v 完全收敛，"贪心策略连续几轮不再变化"是更实用的停止信号，也是下一节策略迭代停止条件的设计思路。', en: '<strong>The policy arrives before the value.</strong> Track the greedy policy in the same 3×3 world: π₃ already equals an optimal policy (a2/a3 tie at s1 — either choice is optimal) and never changes again, while v₃(s9) = 2.71 is still far from its limit 10. Values take dozens of rounds to converge; policies often settle much earlier — a near-optimal value already ranks the actions correctly. Practical moral: no need to wait for v to converge; "the greedy policy has stopped changing for a few rounds" is a better stopping signal, and it is exactly the design idea behind policy iteration’s stopping condition in the next section.' },
      { t: 'p', zh: '<strong>截断停止：ε 与真实误差的换算。</strong>实践不可能迭代到无穷，通常当 ‖v<sub>k+1</sub> − v<sub>k</sub>‖<sub>∞</sub> &lt; ε 就停。但相邻两轮的差<strong>不是</strong>当前误差——ε 必须换算成 ‖v<sub>k</sub> − v*‖<sub>∞</sub> 的上界。推导只用压缩性一步：把 v<sub>k</sub> − v* 写成 f(v<sub>k−1</sub>) − f(v*)，先压缩再接一次三角不等式，把 v<sub>k−1</sub> − v* 换成可观测的 v<sub>k</sub> − v<sub>k−1</sub>，解出不等式——', en: '<strong>Truncated stopping: converting ε into a true error bound.</strong> Practice cannot iterate forever; we usually stop when ‖v<sub>k+1</sub> − v<sub>k</sub>‖<sub>∞</sub> &lt; ε. But the gap between consecutive rounds is <strong>not</strong> the current error — ε must be converted into a bound on ‖v<sub>k</sub> − v*‖<sub>∞</sub>. The derivation takes one contraction step: write v<sub>k</sub> − v* = f(v<sub>k−1</sub>) − f(v*), contract once, then chain one triangle inequality to trade the unobservable v<sub>k−1</sub> − v* for the observable v<sub>k</sub> − v<sub>k−1</sub>, and solve —' },
      { t: 'formula', lbl: '停止条件换算 · From the stopping gap to the true error',
        tex: String.raw`(1-\gamma)\lVert v_k - v^* \rVert_\infty \le \gamma\,\lVert v_k - v_{k-1} \rVert_\infty < \gamma\varepsilon \;\Longrightarrow\; \htmlClass{fx-accent}{\lVert v_k - v^* \rVert_\infty \le \frac{\gamma\varepsilon}{1-\gamma}}`,
        note: 'γ = 0.9 时即 9ε；要真实误差 &lt; 0.1，需 ε ≈ 0.011' },
      { t: 'callout', variant: 'warn', zh: '<strong>两个高频误区。</strong>① <strong>把取过 argmax 的 v 当 q 用</strong>：v<sub>k+1</sub>(s) = max<sub>a</sub> q<sub>k</sub>(s,a) 是"取过 max 的结果"，已不是任何动作的价值；改进步需要的是 q 表本身——把 max 后的那列当成动作值再做加权平均，结果是张冠李戴的错误数。② <strong>把 ε 当真实误差上报</strong>：‖Δv‖ &lt; ε 只保证 ‖v<sub>k</sub> − v*‖ ≤ γε/(1−γ)——γ = 0.9 时两者差 9 倍。写报告时给换算后的界，别给 ε 本身。', en: '<strong>Two frequent misconceptions.</strong> ① <strong>Using the argmaxed v as if it were q</strong>: v<sub>k+1</sub>(s) = max<sub>a</sub> q<sub>k</sub>(s,a) is the result <em>after</em> taking the max and is no longer the value of any action; the improvement step needs the q-table itself — treating the max column as action values and averaging over them produces a wrong number with the right-looking shape. ② <strong>Reporting ε as the true error</strong>: ‖Δv‖ &lt; ε only guarantees ‖v<sub>k</sub> − v*‖ ≤ γε/(1−γ) — a factor-9 gap at γ = 0.9. Quote the converted bound in reports, not ε itself.' },
    ],
  };

  /* ---- §4.2 策略迭代 ---- */
  S['l4-pi'] = {
    kicker: 'L4 · §4.2',
    title: { zh: '策略迭代：评估与改进的华尔兹', en: 'Policy Iteration: The Waltz of Evaluation and Improvement' },
    blocks: [
      { t: 'p', zh: '<strong>策略迭代</strong>换一个角度组织同样的零件。每轮两步：<strong>策略评估（PE）</strong>——解 Bellman 方程 v<sub>π<sub>k</sub></sub> = r<sub>π<sub>k</sub></sub> + γP<sub>π<sub>k</sub></sub>v<sub>π<sub>k</sub></sub>，把当前策略的分数算清楚（闭式解或 L2 的迭代解都行）；<strong>策略改进（PI）</strong>——π<sub>k+1</sub> = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>π<sub>k</sub></sub>)，也就是 L3 开场那个"换上 q 最大的动作"的全网格放大版。', en: '<strong>Policy iteration</strong> organises the same parts from a different angle. Each round has two steps: <strong>policy evaluation (PE)</strong> — solve the Bellman equation v<sub>π<sub>k</sub></sub> = r<sub>π<sub>k</sub></sub> + γP<sub>π<sub>k</sub></sub>v<sub>π<sub>k</sub></sub> to grade the current policy properly (closed-form or L2\'s iterative solution); and <strong>policy improvement (PI)</strong> — π<sub>k+1</sub> = argmax<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v<sub>π<sub>k</sub></sub>), the grid-wide scale-up of L3\'s "swap in the greatest q" move.' },
      { t: 'p', zh: '三连问由书逐条回答。<strong>① 评估怎么做？</strong>闭式解管理论、迭代解管实践（内嵌一个 L2 式的循环——"迭代里套迭代"）。<strong>② 为什么改进后一定更好？</strong>引理 4.1：v<sub>π<sub>k+1</sub></sub> ≥ v<sub>π<sub>k</sub></sub> 逐格成立。<strong>③ 为什么收敛到最优？</strong>定理 4.1 的证明极漂亮——把策略迭代和值迭代从同一起点并排跑，归纳可证 <strong>v<sub>k</sub> ≤ v<sub>π<sub>k</sub></sub> ≤ v*</strong>：策略迭代每一步都压着值迭代打，而值迭代已知收敛到 v*，所以 v<sub>π<sub>k</sub></sub> 单调递增、上界 v*，由单调收敛定理直奔 v*。<strong>策略迭代收敛更快，正是"评估得更彻底"换来的。</strong>', en: 'Three questions, answered in the book one by one. <strong>① How to evaluate?</strong> Closed-form for theory, iterative for practice (an L2-style loop nested inside — an iteration inside an iteration). <strong>② Why does improvement help?</strong> Lemma 4.1: v<sub>π<sub>k+1</sub></sub> ≥ v<sub>π<sub>k</sub></sub> holds elementwise. <strong>③ Why converge to optimal?</strong> The proof of Theorem 4.1 is a beauty — race policy iteration against value iteration from the same start and inductively show <strong>v<sub>k</sub> ≤ v<sub>π<sub>k</sub></sub> ≤ v*</strong>: policy iteration dominates value iteration at every step, and since value iteration converges to v*, the monotone nondecreasing sequence v<sub>π<sub>k</sub></sub>, bounded above by v*, marches to v* by the monotone convergence theorem. <strong>Policy iteration converges faster precisely because it evaluates more thoroughly.</strong>' },
      { t: 'p', zh: '<strong>引理 4.1 的论证骨架（v<sub>π′</sub> ≥ v<sub>π</sub> 逐格成立）</strong>。设 π′ 是对着 v<sub>π</sub> 的贪心改进，分三步。第一步种下"种子"不等式：q<sub>π</sub>(s, π′(s)) = max<sub>a</sub> q<sub>π</sub>(s,a) ≥ Σ<sub>a</sub> π(a|s) q<sub>π</sub>(s,a) = v<sub>π</sub>(s)——贪心动作的 q 不小于按 π 加权的平均。第二步沿 π′ 展开有限 n 步：v<sub>π′</sub>(s) ≥ E[r<sub>0</sub> + γr<sub>1</sub> + … + γ<sup>n−1</sup>r<sub>n−1</sub> + γ<sup>n</sup>v<sub>π</sub>(s<sub>n</sub>)]，每换一步用一次种子。第三步令 n → ∞：γ<sup>n</sup> 项消失，右端恰好回到 v<sub>π</sub>(s) 的定义。结论：<strong>改进要么严格发生，要么 v<sub>π′</sub> = v<sub>π</sub>——后者意味着贪心策略已满足 Bellman 最优方程，π 已是最优</strong>。', en: '<strong>The skeleton of Lemma 4.1 (v<sub>π′</sub> ≥ v<sub>π</sub> elementwise).</strong> Let π′ be the greedy improvement with respect to v<sub>π</sub>; three moves. First, plant the seed inequality: q<sub>π</sub>(s, π′(s)) = max<sub>a</sub> q<sub>π</sub>(s,a) ≥ Σ<sub>a</sub> π(a|s) q<sub>π</sub>(s,a) = v<sub>π</sub>(s) — the greedy action’s q is at least the π-weighted average. Second, expand v<sub>π′</sub> along π′ for a finite horizon n: v<sub>π′</sub>(s) ≥ E[r<sub>0</sub> + γr<sub>1</sub> + … + γ<sup>n−1</sup>r<sub>n−1</sub> + γ<sup>n</sup>v<sub>π</sub>(s<sub>n</sub>)], invoking the seed once per step. Third, let n → ∞: the γ<sup>n</sup> term dies and the right-hand side is exactly the definition of v<sub>π</sub>(s). Conclusion: <strong>improvement is either strict, or v<sub>π′</sub> = v<sub>π</sub> — and in the latter case the greedy policy already satisfies the Bellman optimality equation, so π is optimal</strong>.' },
      { t: 'formula', lbl: '策略改进的单调链 · The monotone chain of policy improvement',
        tex: String.raw`q_{\pi_k}(s, \pi_{k+1}(s)) \ge v_{\pi_k}(s)\ \forall s \;\Longrightarrow\; \htmlClass{fx-accent}{v_{\pi_{k+1}}(s) \ge v_{\pi_k}(s)\ \forall s}`,
        note: '（严格改进，或已最优——二者必居其一）' },
      { t: 'widget', component: 'l4-pi-vs-vi' },
      { t: 'callout', variant: 'key', zh: '<strong>为什么策略迭代能"有限步"终止？</strong>数一数策略的总数：|S| 个状态、每个从 |A| 个动作里挑一个，确定性策略至多 |A|<sup>|S|</sup> 个。引理 4.1 保证每轮<strong>严格改进或已最优</strong>——严格改进意味着同一个策略不可能第二次出现（再出现就与"更严格"矛盾），序列又被 v* 封顶。于是至多 |A|<sup>|S|</sup> 轮内到达最优策略，<strong>精确终止</strong>。这与值迭代形成鲜明对照：VI 渐近收敛、理论上永远差一点；PI 在离散世界里有限步直达。当然 |A|<sup>|S|</sup> 是天文数字，实际轮数远小于它——单调爬坡总能很快攀到好的策略。', en: '<strong>Why does policy iteration terminate in finitely many steps?</strong> Count the policies: |S| states each choosing from |A| actions gives at most |A|<sup>|S|</sup> deterministic policies. Lemma 4.1 guarantees each round <strong>strictly improves or is already optimal</strong> — strict improvement means no policy can ever reappear (a reappearance contradicts strictness), and the sequence is capped by v*. So within at most |A|<sup>|S|</sup> rounds the optimal policy is reached and the algorithm stops <strong>exactly</strong>. Contrast with value iteration: VI converges asymptotically and is never quite there in theory; PI lands exactly, in finitely many rounds, on discrete worlds. Of course |A|<sup>|S|</sup> is astronomical — the actual count is far smaller, as monotone hill-climbing reaches good policies quickly.' },
      { t: 'steps', items: [
        { zh: '<strong>每轮代价</strong>：VI 一轮 = 一次全状态×动作的 q 扫描（|S|·|A| 次 Bellman 核）；PI 一轮 = 内层解 Bellman 方程（若干次全扫描）+ 一次贪心。单轮 PI 更贵。', en: '<strong>Per-round cost</strong>: one VI round = a single full state×action q-sweep (|S|·|A| Bellman cores); one PI round = solving the Bellman equation (several full sweeps) plus one greedy pass. PI rounds are pricier.' },
        { zh: '<strong>轮数</strong>：PI 评估"彻底"，外层轮数极少；VI 每轮只走一步，外层轮数多。总扫描数常常 PI 更省——上面的赛跑实验台可以直接验证这一点。', en: '<strong>Number of rounds</strong>: PI’s thorough evaluation keeps the outer count tiny; VI takes one step per round and needs many more. In total sweeps PI usually spends less — verify it yourself with the race button in the lab above.' },
        { zh: '<strong>中间量与可解释性</strong>：VI 只需一个 v 向量，中间量"名不正"；PI 的中间量是货真价实的 v<sub>π<sub>k</sub></sub>，随时可以拿来解释、校验，也让"策略不变即停"成为合法的停止条件。', en: '<strong>Intermediates and interpretability</strong>: VI needs only one v vector, with intermediates of dubious status; PI’s intermediates are bona fide v<sub>π<sub>k</sub></sub>, ready to be inspected and validated — which also makes "stop when the policy stops changing" a legitimate stopping rule.' },
        { zh: '<strong>实践折中</strong>：两个极端都不必死守——把评估步截断到 j 步（§4.3）常常总计算量最小。', en: '<strong>Practical compromise</strong>: neither extreme is sacred — truncating the evaluation to j steps (§4.3) often minimises total compute.' },
      ]},
      { t: 'p', zh: '<strong>工程细节：原地更新与扫描顺序。</strong>上面所有算法在同一轮内用的都是"旧值"（同步、Jacobi 式）。改成<strong>原地更新（in-place，Gauss–Seidel 式）</strong>——同一轮里后扫到的状态直接读刚算出的新值——信息传播更快，收敛通常加速，而 γ-压缩给出的收敛保证不被破坏（这是教科书标准的异步值迭代结论）。扫描顺序同样影响速度：从目标附近向外扫，新值恰好沿价值传播的方向走，比固定顺序少几个"空转"轮。这两个技巧不改算法的数学，只改它跑起来的速度——第 7 章 TD"来一个样本更一个值"，正是这种思想推到极致。', en: '<strong>Engineering detail: in-place updates and sweep order.</strong> Everything above reads the "old" values within a round (synchronous, Jacobi-style). Switching to <strong>in-place updates (Gauss–Seidel style)</strong> — later states in the same sweep read freshly computed values — propagates information faster and usually accelerates convergence, without breaking the γ-contraction guarantee (a standard textbook result on asynchronous value iteration). Sweep order matters too: sweeping outward from the target lets new values travel along the direction of value propagation, saving a few idle rounds versus a fixed order. Neither trick changes the mathematics, only the speed — Chapter 7’s TD, "update on every single sample", is this idea taken to the extreme.' },
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
        html: '截断策略迭代：<span class="mt">PE 只跑 <i class="fx-inline" data-tex="j"></i> 步</span> &nbsp;⟹&nbsp; <i class="fx-inline" data-tex="j = 1"></i> 退化为值迭代，<i class="fx-inline" data-tex="j = \\infty"></i> 即策略迭代' },
      { t: 'p', zh: '<strong>截断策略迭代（truncated policy iteration）</strong>把两个极端接成连续谱：评估步只跑 j 步就停下来做改进。j 小，单轮便宜、轮数多；j 大，单轮贵、轮数少。总账怎么算？下面的实验台在同一世界上扫一遍不同的 j，比一比到达最优策略各自花掉的<strong>内层扫描总数</strong>。', en: '<strong>Truncated policy iteration</strong> joins the extremes into a spectrum: run the evaluation step for only j steps before improving. Small j: cheap rounds, more of them; large j: pricey rounds, fewer. How does the bill add up? The lab below sweeps several j values on the same world and compares the <strong>total inner sweeps</strong> each needs to reach the optimal policy.' },
      { t: 'widget', component: 'l4-truncated' },
      { t: 'p', zh: '<strong>为什么"评估不彻底"也敢改进？</strong>因为贪心改进对评估误差相当鲁棒：argmax 只关心动作之间的<strong>名次</strong>，只要估计误差小于价值差距，名次不变、挑出的动作不变。这是广义策略迭代的深层优点：<strong>评估和改进都不必完美，两个互相纠错的循环交替运行，就能把彼此推向最优</strong>。第 5 章的 MC、第 7 章的 TD 全靠这一点活下来：它们的"评估"从来都不精确（样本有限），改进照样往前走。截断策略迭代是这个原理在"确定性误差"下的预演。', en: '<strong>Why dare to improve on an unfinished evaluation?</strong> Because greedy improvement is robust to evaluation error: argmax cares only about the <strong>ranking</strong> of actions, and as long as the estimation error is smaller than the value gaps, the ranking — and hence the chosen action — is unchanged. This is the deep virtue of generalised policy iteration: <strong>neither evaluation nor improvement must be perfect; two mutually correcting loops, alternated, push each other toward optimality</strong>. Chapter 5’s MC and Chapter 7’s TD live entirely on this: their "evaluation" is never exact (finite samples), yet improvement marches on. Truncated policy iteration rehearses the principle with deterministic error.' },
      { t: 'callout', variant: 'warn', zh: '<strong>误区：截断后的策略迭代不再是（原教旨的）策略迭代。</strong>评估步没跑到底就改进，失去的是引理 4.1 的前提——你贪心针对的那个 v 不再是任何策略的真状态值，"每轮严格改进"的形式保证随之失效（理论上存在来回震荡的可能，实践中小 j 下罕见）。另一个常见混淆：j 是<strong>内层评估的迭代步数</strong>，不是外层轮数——把 j 当轮数调，等于悄悄把算法换成了另一个，还以为在调参。', en: '<strong>Misconception: truncated policy iteration is no longer (plain) policy iteration.</strong> Improving before the evaluation finishes forfeits the premise of Lemma 4.1 — the v you are greedy against is no longer any policy’s true state value, so the formal guarantee of strict per-round improvement lapses (oscillation becomes possible in theory, though rare in practice for modest j). Another common mix-up: j is the <strong>number of inner evaluation iterations</strong>, not the outer round count — treating j as rounds silently swaps in a different algorithm while you think you are tuning a knob.' },
    ],
  };

  /* ---- §4.4 总结 ---- */
  S['l4-summary'] = {
    kicker: 'L4 · §4.4',
    title: { zh: '本章总结：一个框架，三种算法', en: 'Chapter Summary: One Framework, Three Algorithms' },
    blocks: [
      { t: 'p', zh: '值迭代、策略迭代、截断策略迭代——三种算法共享同一个心跳：<strong>每轮两步，一步更新价值、一步更新策略</strong>。这个"价值与政策交替更新"的思想叫<strong>广义策略迭代（generalized policy iteration）</strong>，它是整本强化学习的骨架：第 5 章的蒙特卡洛、第 7 章的 TD，本质上都是"评估步换成不依赖模型的无偏估计"后的策略迭代变体。', en: 'Value iteration, policy iteration, truncated policy iteration — three algorithms sharing one heartbeat: <strong>each round has two steps, one updating the value, one updating the policy</strong>. This alternation is called <strong>generalised policy iteration</strong>, the skeleton of all reinforcement learning: Monte Carlo in Chapter 5 and TD in Chapter 7 are essentially policy iteration with the evaluation step replaced by model-free unbiased estimates.' },
      { t: 'steps', items: [
        { zh: '<strong>值迭代</strong>：价值步只走一步（PU+VU）。单轮最便宜、轮数最多；中间量不是状态值；渐近收敛，误差每轮 ×γ，停止靠 ε 换算界。', en: '<strong>Value iteration</strong>: the value step takes one step only (PU+VU). Cheapest per round, most rounds; intermediates are not state values; asymptotic convergence with error ×γ per round, stopped via the ε conversion bound.' },
        { zh: '<strong>策略迭代</strong>：评估解到底（PE+PI）。单轮最贵、轮数最少；中间量是货真价实的 v<sub>π<sub>k</sub></sub>；有限步精确终止（上界 |A|<sup>|S|</sup>），停止靠"策略不再变化"。', en: '<strong>Policy iteration</strong>: evaluation solves to the end (PE+PI). Priciest per round, fewest rounds; intermediates are bona fide v<sub>π<sub>k</sub></sub>; exact termination in finitely many steps (bounded by |A|<sup>|S|</sup>), stopped by "the policy stopped changing".' },
        { zh: '<strong>截断策略迭代</strong>：评估只跑 j 步。j = 1 即 VI、j → ∞ 即 PI；中间某个 j 常常总扫描数最少——工程上的默认起点。', en: '<strong>Truncated policy iteration</strong>: evaluation runs only j steps. j = 1 is VI, j → ∞ is PI; a middle j often minimises total sweeps — the engineering default.' },
        { zh: '<strong>共同心跳</strong>：每轮"一步价值 + 一步策略"交替进行——广义策略迭代（GPI）是三者的公共名字，也是全书算法的族谱。', en: '<strong>Shared heartbeat</strong>: every round pairs one value step with one policy step, alternating — generalised policy iteration is their common name and the family tree of the whole book.' },
      ]},
      { t: 'p', zh: '给 GPI 一个力学图像：<strong>评估步把价值拉向当前策略，改进步把策略拉向当前价值</strong>——两股方向相反的力轮流作用，每次交换都让两个量更接近彼此的"一致点"，而唯一稳定的一致点就是 (v*, π*)。这个图像在第 5、7 章会反复出现：MC 把"拉价值"的力换成样本平均，TD 换成一步自举——力换了，力学结构不变。判断任何新算法时先问：它的评估力和改进力各是什么？两个力是否在交替？', en: 'A mechanical image for GPI: <strong>evaluation pulls the value toward the current policy, improvement pulls the policy toward the current value</strong> — two opposing forces applied in turns, each exchange bringing the two quantities closer to mutual consistency, and the only stable consistency point is (v*, π*). The image recurs in Chapters 5 and 7: MC replaces the value-pulling force with sample averages, TD with one-step bootstrapping — the forces change, the mechanics do not. When judging any new algorithm, ask first: what are its evaluation force and improvement force, and do they alternate?' },
      { t: 'callout', variant: 'idea', zh: '<strong>有模型时代的谢幕</strong>：本章三种算法都要求手里有 p(s′|s,a) 和 p(r|s,a)。第 5 章起进入<strong>无模型（model-free）</strong>时代——模型没有，就用采样凑。你会看到：把策略迭代的"评估步"换成"用经验平均回报估计价值"，就得到了蒙特卡洛学习。', en: '<strong>Farewell to the model-based era</strong>: all three algorithms require p(s′|s,a) and p(r|s,a) in hand. From Chapter 5 we enter the <strong>model-free</strong> era — no model, so sample instead. You will see that replacing policy iteration\'s evaluation step with "estimate values by averaging experienced returns" yields Monte Carlo learning.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"三种算法","en":"three algorithms","d":{"zh":"值迭代、策略迭代、截断策略迭代：每轮两步，一步更新价值、一步更新策略。","en":"Value iteration, policy iteration, truncated policy iteration: every round has two moves — update values, update policy."}},
        {"zh":"广义策略迭代","en":"GPI","d":{"zh":"评估步把价值拉向策略、改进步把策略拉向价值，唯一稳定的一致点是 (v*, π*)。","en":"Evaluation pulls values toward the policy, improvement pulls policy toward values; the only stable agreement is (v*, π*)."}},
        {"zh":"三档代价","en":"cost profiles","d":{"zh":"VI 单轮最便宜轮数最多，PI 单轮最贵轮数最少，截断式夹在中间——工程上常是默认起点。","en":"VI is cheapest per sweep but needs many; PI is priciest but fewest; truncated sits between — the usual engineering start."}},
        {"zh":"有模型谢幕","en":"model era ends","d":{"zh":"三种算法都要求 p(s′|s,a) 与 p(r|s,a)；第 5 章起模型没有，就用采样凑。","en":"All three need p(s′|s,a) and p(r|s,a); from Chapter 5, samples stand in for the missing model."}},
      ] } },
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
      { t: 'widget', component: 'notebook-bridge', props: { nb: 'nb2' } },
    ],
  };

  /* ---- L4 Q&A ---- */
  S['l4-qa'] = {
    kicker: 'L4 · §4.5',
    title: { zh: '问答：动态规划六连问', en: 'Q&A: Six Questions on Dynamic Programming' },
    blocks: [
      { t: 'p', zh: '本章问答的核心全是"中间值算不算状态值"这个细思恐极的问题，以及收敛保证。', en: 'This chapter\'s Q&As circle the spine-chilling question "are intermediate values state values?", plus convergence guarantees.' },
      { t: 'p', zh: '翻卡前先自查三个最易翻车的点：① 值迭代的中间量 v<sub>k</sub> 是不是状态值（不是——它不满足任何策略的 Bellman 方程）；② 停止时 ‖Δv‖ &lt; ε 对应的真实误差是多少（γε/(1−γ)，γ = 0.9 时是 9ε）；③ 策略迭代凭什么有限步终止（策略总数有限 + 每轮严格改进或已最优）。答不上哪条，就回对应小节再看一遍。', en: 'Before flipping cards, self-check the three most crash-prone points: ① is VI’s intermediate v<sub>k</sub> a state value (no — it satisfies no policy’s Bellman equation); ② what true error does ‖Δv‖ &lt; ε at stopping correspond to (γε/(1−γ), a factor 9 at γ = 0.9); ③ why does policy iteration terminate in finitely many steps (finitely many policies + strict improvement or already optimal). If any answer escapes you, revisit the matching section.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l4' } },
      { t: 'widget', component: 'fill-lab', props: { source: 'l4' } },
      { t: 'widget', component: 'derivation-lab', props: { source: 'l4' } },
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

  /* ═══ L4 知识填充 ═══ */
  D.fillSets = D.fillSets || {};   // 兜底：若 data.js 核心尚未注册 fillSets 容器，此处就地创建；已注册则为空操作
  D.fillSets['l4'] = {
    title: { zh: '第四讲 · 知识填充', en: 'Lecture 4 · Knowledge Fill-in' },
    items: [
      { kind: 'choice',
        tag: { zh: 'T1 · 收敛', en: 'T1 · Convergence' },
        stem: { zh: '值迭代的收敛速度由 [[1]] 一手决定：误差每轮精确地乘上它一次——γ = 0.9 时约 22 轮缩小 10 倍。',
                en: 'The speed of value iteration is dictated entirely by [[1]]: the error is multiplied by it exactly once per round — a factor of 10 about every 22 rounds at γ = 0.9.' },
        blanks: [
          { choices: ['γ（压缩系数）', 'ε（停止阈值）', '‖v₀ − v*‖（初值误差）'], answer: 0,
            why: { zh: '一轮迭代就是映射 f(v) = max_π(r_π + γP_π v)，∞-范数下是系数恰为 γ 的压缩映射，所以误差每轮 ×γ、几何式收敛。ε 只决定何时停，不决定每轮压多快；初值只定第 0 轮的起点，γ < 1 时速率与它无关。',
                    en: 'One round is the map f(v) = max_π(r_π + γP_π v), a contraction with factor exactly γ in the ∞-norm, so the error is multiplied by γ per round — geometric convergence. ε only decides when to stop, not how fast each round squeezes; the initial value merely sets the starting point, and for γ < 1 the rate is independent of it.' } },
        ] },
      { kind: 'number',
        tag: { zh: 'T2 · 误差界', en: 'T2 · Error bound' },
        stem: { zh: '误差界 ‖v* − vₙ‖ ≤ γ^(n+1)/(1−γ) · max|r|：取 γ = 0.9、max|r| = 1、n = 0，右端等于 [[1]]。',
                en: 'The bound ‖v* − vₙ‖ ≤ γ^(n+1)/(1−γ) · max|r|: with γ = 0.9, max|r| = 1 and n = 0, the right-hand side equals [[1]].' },
        blanks: [
          { answer: 9, tol: 0.01,
            hint: { zh: '0.9 的 1 次方，除以 0.1。', en: '0.9 to the power 1, divided by 0.1.' },
            why: { zh: '0.9¹/(1−0.9) = 0.9/0.1 = 9。这正是本讲 3×3 数值演算里的真实误差：v₁(s9) = 1 而 v*(s9) = 10，‖v₁ − v*‖ = 9×0.9⁰ = 9——压缩映射的预言与实验逐轮吻合。',
                   en: '0.9¹/(1−0.9) = 0.9/0.1 = 9. This is exactly the true error in the lecture’s 3×3 numeric run: v₁(s9) = 1 while v*(s9) = 10, so ‖v₁ − v*‖ = 9×0.9⁰ = 9 — the contraction prediction matches the experiment round by round.' } },
        ] },
      { kind: 'number',
        tag: { zh: 'T3 · ε 换算', en: 'T3 · ε conversion' },
        stem: { zh: '以 ‖v_{k+1} − v_k‖ < ε 为停止条件：γ = 0.9、ε = 0.1 时，真实误差 ‖v_k − v*‖ 至多是 [[1]]。',
                en: 'Stop when ‖v_{k+1} − v_k‖ < ε: with γ = 0.9 and ε = 0.1, the true error ‖v_k − v*‖ is at most [[1]].' },
        blanks: [
          { answer: 0.9, tol: 0.005,
            hint: { zh: '换算公式：‖v_k − v*‖ ≤ γε/(1−γ) = 9ε。', en: 'The conversion: ‖v_k − v*‖ ≤ γε/(1−γ) = 9ε.' },
            why: { zh: '由压缩性一步推出 ‖v_k − v*‖ ≤ γε/(1−γ)：γ = 0.9 时即 9ε，ε = 0.1 换算出 0.9。相邻两轮的差不是当前误差——两者在这里差整整 9 倍；写报告要给换算后的界，别把 ε 本身当误差上报。',
                   en: 'One contraction step gives ‖v_k − v*‖ ≤ γε/(1−γ): at γ = 0.9 that is 9ε, and ε = 0.1 converts to 0.9. The round-to-round gap is not the current error — here the two differ by a factor of 9; quote the converted bound in reports, not ε itself.' } },
        ] },
      { kind: 'code',
        tag: { zh: 'T4 · VI 主循环', en: 'T4 · VI main loop' },
        stem: { zh: '补全值迭代主循环的收尾一行（dp_algorithms.py）：把 q 表沿动作维取 [[1]]，逐状态得到新价值。',
                en: 'Complete the closing line of value iteration’s main loop (dp_algorithms.py): take the [[1]] over the action axis of the q-table to obtain the new value per state.' },
        code: { zh: 'v_new = q_all.[[1]](axis=1)          # value update',
                en: 'v_new = q_all.[[1]](axis=1)          # value update' },
        blanks: [
          { choices: ['max', 'sum', 'mean', 'argmax'], answer: 0,
            why: { zh: '价值更新是 v_{k+1}(s) = max_a q_k(s,a)——沿动作维取 max，得到的是数值；argmax 是策略更新那一步，返回动作下标。sum/mean 是对随机策略的加权平均：用在这里，就把"取过 max 的 v"错当成了动作价值——本讲高频误区①。',
                   en: 'The value update is v_{k+1}(s) = max_a q_k(s,a) — a max over the action axis, yielding a number; argmax belongs to the policy update and returns an action index. sum/mean is the π-weighted average used to evaluate a random policy: putting it here mistakes the argmaxed v for action values — misconception ① of this lecture.' } },
        ] },
      { kind: 'choice',
        tag: { zh: 'T5 · 有限终止', en: 'T5 · Finite termination' },
        stem: { zh: '策略迭代能有限步精确终止，靠两件事：每轮严格改进或已最优；以及确定性策略总数至多 [[1]] 个——有限集合里不可能无限次严格改进。',
                en: 'Policy iteration terminates exactly in finitely many steps thanks to two facts: each round strictly improves or is already optimal; and the number of deterministic policies is at most [[1]] — a finite set cannot be strictly improved forever.' },
        blanks: [
          { choices: ['|A|^|S|', '|S|·|A|', '|S| + |A|'], answer: 0,
            why: { zh: '|S| 个状态各从 |A| 个动作里挑一个，确定性策略至多 |A|^|S| 个。严格改进意味着同一个策略不会第二次出现，序列又被 v* 封顶——有限集合里的单调爬坡，至多 |A|^|S| 轮必达最优。对照：VI 渐近收敛，理论上永远差一点。',
                   en: '|S| states each pick one of |A| actions, so there are at most |A|^|S| deterministic policies. Strict improvement means no policy can reappear, and the sequence is capped by v* — monotone hill-climbing in a finite set reaches optimality within |A|^|S| rounds. Contrast: VI converges only asymptotically and is never quite there in theory.' } },
        ] },
      { kind: 'code',
        tag: { zh: 'T6 · PI 改进步', en: 'T6 · PI improvement' },
        stem: { zh: '补全策略迭代的改进步（dp_algorithms.py）：对 q_{π_k} 沿动作维取 [[1]] 挑出新动作，再 one-hot 展开成新策略。',
                en: 'Complete policy iteration’s improvement step (dp_algorithms.py): take the [[1]] over the action axis of q_{π_k} to pick the new action, then expand it one-hot into the new policy.' },
        code: { zh: 'pi_new[np.arange(n), q.[[1]](axis=1)] = 1.0',
                en: 'pi_new[np.arange(n), q.[[1]](axis=1)] = 1.0' },
        blanks: [
          { choices: ['argmax', 'max', 'argsort'], answer: 0,
            why: { zh: '策略更新 π_{k+1}(s) = argmax_a q_k(s,a) 要的是"哪个动作最好"——下标；T4 那行 max 要的是"最好多少"——数值。一字之差，写错就把策略表填成了价值表。挑出下标后 one-hot 展开，与 L3 的 greedy_policy 完全同款。',
                   en: 'The policy update π_{k+1}(s) = argmax_a q_k(s,a) wants WHICH action is best — an index; the max line in T4 wants HOW good — a number. One letter apart, and mixed up the policy table gets filled with values. After the index comes the one-hot expansion, identical to L3’s greedy_policy.' } },
        ] },
      { kind: 'choice',
        tag: { zh: 'T7 · VI vs PI', en: 'T7 · VI vs PI' },
        stem: { zh: '5×5 世界（r_forbidden = −10）赛跑实验台（阈值 Δ < 1e-4）：值迭代跑了 89 轮全扫描才收敛，策略迭代外层 4~5 轮就停——但每轮内层评估自己也要几十次扫描。总账的正确读法是 [[1]]。',
                en: 'The 5×5 race lab (r_forbidden = −10, threshold Δ < 1e-4): value iteration needs 89 full sweeps to converge, while policy iteration stops after 4–5 outer rounds — though each round’s inner evaluation costs dozens of sweeps itself. The right way to read the bill is [[1]].' },
        blanks: [
          { choices: [
              { zh: 'PI 单轮贵（内层解到底）但外层轮数少，VI 单轮便宜但轮数多——总账看 θ 和世界大小，把评估步截断到 j 步常是折中', en: 'PI rounds are pricey (evaluation solved to the end) but few; VI rounds are cheap but many — the bill depends on θ and world size, and truncating the evaluation to j steps is the usual compromise' },
              { zh: 'PI 每一方面都严格占优，工程上永远该选 PI', en: 'PI dominates VI in every respect; always choose PI in practice' },
              { zh: 'VI 单轮贵但外层轮数少，PI 单轮便宜但轮数多', en: 'VI is pricey per round but takes few rounds; PI is cheap per round but takes many' } ],
            answer: 0,
            why: { zh: 'PI 一轮 = 内层把 Bellman 方程解到收敛（几十次全扫描）+ 一次贪心，4~5 轮就到最优；VI 一轮 = 一次全扫描，同一阈值下要 89 轮。单轮更贵 × 轮数更少，总账谁省取决于 θ 与世界大小——所以工程上常把评估步截断到 j 步（见 T8/T9）。',
                   en: 'One PI round = solving the Bellman equation to convergence (dozens of full sweeps) plus one greedy pass, reaching optimality in 4–5 rounds; one VI round = a single sweep, but 89 rounds at the same threshold. Pricier rounds times fewer rounds: which bill wins depends on θ and world size — hence the practical compromise of truncating the evaluation to j steps (see T8/T9).' } },
        ] },
      { kind: 'choice',
        tag: { zh: 'T8 · 截断谱系', en: 'T8 · Truncation spectrum' },
        stem: { zh: '截断策略迭代把评估步只跑 j 步就停下来改进：j = 1 时退化为 [[1]]，j → ∞ 时就是策略迭代——两个极端被一个旋钮接成连续谱。',
                en: 'Truncated policy iteration runs the evaluation for only j steps before improving: j = 1 degenerates to [[1]], and j → ∞ is policy iteration — one dial joins the two extremes into a spectrum.' },
        blanks: [
          { choices: ['值迭代', '广义策略迭代', '蒙特卡洛估计'], answer: 0,
            why: { zh: 'j = 1：每轮只走一步 Bellman（PU+VU），正是值迭代；j = ∞：评估解到底，即策略迭代。截断后贪心针对的 v 不再是任何策略的真状态值，引理 4.1 的"每轮严格改进"保证随之失效（实践中适中的 j 极少震荡）。另注意：j 数的是内层评估步数，不是外层轮数。',
                   en: 'j = 1: one Bellman step per round (PU+VU), exactly value iteration; j = ∞: evaluation solved to the end, i.e. policy iteration. Once truncated, the v you are greedy against is no longer any policy’s true state value, so Lemma 4.1’s strict-improvement guarantee lapses (oscillation is rare in practice for modest j). And note: j counts inner evaluation steps, not outer rounds.' } },
        ] },
      { kind: 'number',
        tag: { zh: 'T9 · j 的总账', en: 'T9 · The bill for j' },
        stem: { zh: '截断实验台（4×4 作业世界，均匀随机起点）扫 j ∈ {1, 2, 3, 5, 10, 30}：j = 30（近似策略迭代）外层 3 轮收敛，内层评估总扫描 [[1]] 次。',
                en: 'The truncation lab (4×4 homework world, uniform random start) sweeps j ∈ {1, 2, 3, 5, 10, 30}: at j = 30 (≈ policy iteration) it converges in 3 outer rounds with [[1]] inner evaluation sweeps in total.' },
        blanks: [
          { answer: 90, tol: 2,
            hint: { zh: '每轮 30 次内层扫描，共 3 轮。', en: '30 inner sweeps per round, 3 rounds.' },
            why: { zh: '30 次/轮 × 3 轮 = 90。对照同一实验台的 j = 1（即值迭代）：5 轮、总扫描仅 5 次——小世界上 VI 的总账更省，"中间 j 总扫描最少"通常要到大世界才显现。评估不彻底并不致命：贪心只看动作名次，只要截断误差小于动作间的价值差距，挑出的动作就不变。',
                   en: '30 per round × 3 rounds = 90. Compare j = 1 (value iteration) on the same lab: 5 rounds, only 5 sweeps in total — on a small world VI wins the bill; a middle j usually minimises sweeps only on larger worlds. An unfinished evaluation is not fatal: greedy cares only about the ranking of actions, and as long as the truncation error stays below the value gaps, the chosen actions do not change.' } },
        ] },
    ],
  };


  /* ═══════════════════════════════════════════════════════════
     L4 · 定理推导（DerivationLab 组件按 derivationSets[source] 渲染：
     走步模式逐步展开，带 blank 的 ★ 关键步答对才放行；
     契约校验见 scripts/check_data.js 的 derivationSets 段）
     ═══════════════════════════════════════════════════════════ */
  D.derivationSets = D.derivationSets || {};   // 兜底：若 data.js 核心尚未注册 derivationSets 容器，此处就地创建；已注册则为空操作
  D.derivationSets['l4'] = {
    title: { zh: '第四讲 · 定理推导', en: 'Lecture 4 · Theorem Derivations' },
    items: [
      {
        // #1 压缩映射与不动点存在唯一（14 步；★ blank 在第 5、7 步）
        id: 'contraction-banach',
        name: { zh: '压缩映射与不动点存在唯一', en: 'Contraction Mapping and the Unique Fixed Point' },
        intro: {
          zh: '§4.1 说"收敛性由压缩映射定理背书"——本条把这张背书单完整走一遍：从 ∞-范数这把尺子出发，逐状态做差、翻过 max 的 Lipschitz 关卡、让概率加权和收缩，证出 Bellman 最优算子 T* 是系数恰为 γ 的压缩映射；再用 Banach 不动点定理兑现 v* 存在唯一、值迭代从任意初值收敛。两处关键步（max 怎么放缩、γ 从哪进场）要你自己填对才放行。',
          en: '§4.1 says convergence is "vouched by the contraction mapping theorem" — this derivation walks the full voucher: from the ruler that is the ∞-norm, through state-wise subtraction, the Lipschitz hurdle of max, and the contraction of probability-weighted sums, to the Bellman optimality operator T* being a contraction with factor exactly γ; Banach\'s fixed-point theorem then honours existence, uniqueness, and convergence from any start. Two key steps (how max is tamed, where γ enters) unlock only when you fill them correctly.',
        },
        steps: [
          { // 步 1 · 尺子先行：∞-范数与它诱导的距离
            tex: String.raw`\lVert v\rVert_\infty \;\doteq\; \max_{s\in\mathcal{S}}\,\big|v(s)\big|, \qquad d(u,v) \;\doteq\; \lVert u-v\rVert_\infty`,
            why: {
              zh: '尺子先于定理：∞-范数量的是"最坏状态的价值误差"——所有状态都差得少，两个价值函数才算靠得近。状态空间有限，max 必然取到；由它诱导的距离 d(u,v) = ‖u−v‖<sub>∞</sub> 让全体价值向量成为一个度量空间，且有限维上自动完备——Banach 定理要的舞台条件之一已在此就位。',
              en: 'The ruler comes before the theorem: the ∞-norm measures "the value error in the worst state" — two value functions count as close only if every state agrees. The state space is finite, so the max is attained; the induced distance d(u,v) = ‖u−v‖<sub>∞</sub> makes all value vectors a metric space, automatically complete in finite dimensions — one of the stage conditions Banach\'s theorem demands is already in place.',
            },
          },
          { // 步 2 · 主角登场：Bellman 最优算子 T*
            tex: String.raw`(T^*v)(s) \;=\; \htmlClass{fx-gold}{\max_a}\; \sum_{s'} p(s'\mid s,a)\Big[\,r(s,a,s') + \gamma\,v(s')\,\Big]`,
            why: {
              zh: '主角登场：Bellman 最优算子 T*。L3 的推导里它写成两项和 Σ<sub>r</sub> p(r|s,a)r + γΣ<sub>s′</sub> p(s′|s,a)v(s′)；这里把平均奖励折叠进 r(s,a,s′)，紧凑一档、推导分毫不变。值迭代的每一轮就是施加一次 T*（v<sub>k+1</sub> = T*v<sub>k</sub>）；§4.1 的矩阵外号 f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) 与它逐点等价——最优总在确定性贪心策略处取到。本条目标：证 T* 是系数恰为 γ 的压缩映射。',
              en: 'Enter the protagonist: the Bellman optimality operator T*. L3\'s derivation wrote it as the two-term sum Σ<sub>r</sub> p(r|s,a)r + γΣ<sub>s′</sub> p(s′|s,a)v(s′); here the mean reward is folded into r(s,a,s′) — one notch more compact, the derivation unchanged. Each round of value iteration applies T* once (v<sub>k+1</sub> = T*v<sub>k</sub>); §4.1\'s matrix alias f(v) = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v) equals it pointwise — the optimum is always attained at a deterministic greedy policy. This derivation\'s goal: prove T* is a contraction with factor exactly γ.',
            },
          },
          { // 步 3 · 目标：γ-压缩的定义
            tex: String.raw`\htmlClass{fx-gold}{\text{goal:}}\quad \lVert T^*u - T^*v\rVert_\infty \;\le\; \gamma\,\lVert u-v\rVert_\infty \qquad \forall\,u,v,\quad \gamma\in(0,1)`,
            why: {
              zh: '压缩映射的定义：映射后两点的距离 ≤ γ × 映射前的距离，γ 严格小于 1——每施加一次算子，任意两点都至少靠近 γ 倍。注意它比"迭代序列收敛"更强：要对一切 u、v 同时成立（全局压缩），而证明全程不需要知道极限在哪、也不需要知道贪心动作是谁——这正是压缩论证比硬解 BOE 高明的地方。',
              en: 'The definition of a contraction: distance after the map ≤ γ × distance before, with γ strictly below 1 — each application brings any two points at least γ times closer. Note it is stronger than "the iterates converge": it must hold for all u, v at once (a global contraction), yet the proof never needs to know where the limit is or which greedy actions are chosen — precisely where the contraction argument outshines solving the BOE head-on.',
            },
          },
          { // 步 4 · 逐状态做差：max 结构成形
            tex: String.raw`\Big|(T^*u)(s)-(T^*v)(s)\Big| = \Big|\max_a f(a)-\max_a g(a)\Big|\qquad\begin{gathered} f(a) \doteq \sum_{s'} p(s'\mid s,a)\big[r(s,a,s')+\gamma\,u(s')\big] \\[2pt] g(a) \doteq \sum_{s'} p(s'\mid s,a)\big[r(s,a,s')+\gamma\,v(s')\big] \end{gathered}`,
            why: {
              zh: '逐状态做差：∞-范数是"逐状态误差再取 max"，所以先任意固定一个 s，把它控制住，最后一步再统一取 max。对每个动作 a，u 与 v 各给出一枚 Bellman 核 f(a)、g(a)；(T*u)(s) 与 (T*v)(s) 分别是这两组核的最大值——"先取 max 再作差"的格局在此成形，下一关就是它。',
              en: 'Subtract state by state: the ∞-norm is "per-state error, then max", so fix any s first, control it, and take the max uniformly at the very end. For each action a, u and v each contribute a Bellman kernel f(a), g(a); (T*u)(s) and (T*v)(s) are the maxima of the two families — the "max-then-subtract" pattern takes shape here, and it is the next hurdle.',
            },
          },
          { // 步 5 ★ blank：max 的 1-Lipschitz
            tex: String.raw`\Big|\max_a f(a)-\max_a g(a)\Big| \;\le\; \htmlClass{fx-gold}{\text{?}}`,
            why: {
              zh: 'max 的 1-Lipschitz 性质：取最大值的运算对逐点差不放大——整条证明里唯一非代数的一步，也是 max 结构留下的唯一关卡。它对任意两组数 f、g 成立，与 argmax 在哪里毫无关系；填对它，后面的路全是坦途。',
              en: 'The 1-Lipschitz property of max: taking the maximum never amplifies a pointwise difference — the only non-algebraic step in the whole proof, and the only hurdle the max structure leaves behind. It holds for any two families f and g, utterly regardless of where the argmax sits; fill it in correctly and the rest of the road is flat.',
            },
            blank: {
              q: {
                zh: '两个"先取 max 再作差"的量：|max<sub>a</sub> f(a) − max<sub>a</sub> g(a)| 能被什么控制？硬性要求：右边在 f = g 时必须为 0（否则证不出压缩）。',
                en: 'Two "max-then-subtract" quantities: what bounds |max<sub>a</sub> f(a) − max<sub>a</sub> g(a)|? Hard requirement: the right-hand side must vanish when f = g (otherwise no contraction can follow).',
              },
              choices: [
                { tex: String.raw`\max_a\big|f(a)-g(a)\big|` },
                { tex: String.raw`\Big|\max_a f(a)-\max_a g(a)\Big| \;=\; \max_a\big|f(a)-g(a)\big|` },
                { tex: String.raw`\max_a\big|f(a)\big|+\max_a\big|g(a)\big|` },
                { zh: '无法只凭 f 与 g 的逐点差估计——必须先分别求出 f 与 g 的最大值点再比较', en: 'No estimate from the pointwise difference alone — one must first locate the maximizers of f and of g, then compare' },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确。两行放缩：max f = f(a<sub>f</sub>) ≤ g(a<sub>f</sub>) + |f(a<sub>f</sub>)−g(a<sub>f</sub>)| ≤ max g + max<sub>a</sub>|f−g|（a<sub>f</sub> 是 f 的最大值点）；对称交换 f、g 再来一遍。全程不需要知道最大值点在哪里。', en: 'Correct. A two-line squeeze: max f = f(a<sub>f</sub>) ≤ g(a<sub>f</sub>) + |f(a<sub>f</sub>)−g(a<sub>f</sub>)| ≤ max g + max<sub>a</sub>|f−g| (a<sub>f</sub> a maximizer of f); swap f and g and repeat. Where the maximizer sits never matters.' },
                { zh: '等号一般不成立：两组数各自的最大值点可以不同——u 与 v 的贪心动作不一致时正是这种情形，此时左端严格更小。只有 argmax 恰好重合才取等；把它当恒等式用，等于偷偷假设了"贪心动作不变"。', en: 'Equality generally fails: the two families can peak at different actions — exactly what happens when u and v disagree on the greedy move, leaving the left side strictly smaller. Equality needs coinciding argmaxes; treating it as an identity quietly assumes "the greedy action never changes".' },
                { zh: '这个界不随 u−v 消失：取 u = v，则 f = g、左端 = 0，而右端 = 2‖T*u‖<sub>∞</sub> 一般非零——压缩要求"差为零则界为零"，用它永远证不出压缩。', en: 'This bound never vanishes with u−v: take u = v, so f = g and the left side is 0, while the right side is 2‖T*u‖<sub>∞</sub>, generally nonzero — contraction demands "zero difference ⇒ zero bound", which this can never deliver.' },
                { zh: '引理的价值恰在回避这件事：上面的放缩对任意 f、g 成立，argmax 的位置从头到尾没出场——Bellman 迭代中贪心动作每轮都可能更换，收敛证明却毫发无损。', en: 'The lemma\'s value is precisely avoiding that: the squeeze holds for arbitrary f and g, and the argmax never takes the stage — greedy actions may change every round of Bellman iteration, yet the convergence proof is unscathed.' },
              ],
              hint: { zh: '把 max f 写成 max(g + (f−g))：先用 |f−g| 控制增量，再取 max；对称交换 f、g 再来一遍。', en: 'Write max f as max(g + (f−g)): control the increment by |f−g| first, then take max; run it again with f and g swapped.' },
            },
          },
          { // 步 6 · 奖励对消：f−g 只剩 γΣp(u−v)
            tex: String.raw`f(a)-g(a) \;=\; \sum_{s'}p(s'\mid s,a)\big[r+\gamma u(s')\big]-\sum_{s'}p(s'\mid s,a)\big[r+\gamma v(s')\big] \;=\; \gamma\sum_{s'}p(s'\mid s,a)\big(u(s')-v(s')\big)`,
            why: {
              zh: '奖励对消：f 与 g 共享同一组 r(s,a,s′) 与同一组转移概率 p(s′|s,a)——逐项作差，奖励与转移全部退场，只剩 γ(u(s′)−v(s′))。这是 T* 结构送的大礼：正因为两个核出自同一个算子，r 才能对消。γ 作为常数提到求和号外，整装待发。',
              en: 'The rewards cancel: f and g share the same r(s,a,s′) and the same transition probabilities p(s′|s,a) — subtract termwise and everything exits except γ(u(s′)−v(s′)). A gift of T*\'s structure: precisely because both kernels come from the same operator, r can leave the stage. γ, pulled out as a constant, stands ready in front of the sum.',
            },
          },
          { // 步 7 ★ blank：概率加权和的收缩 + γ 从哪来
            tex: String.raw`\big|f(a)-g(a)\big| \;=\; \Big|\gamma\sum_{s'}p(s'\mid s,a)\big(u(s')-v(s')\big)\Big| \;\le\; \htmlClass{fx-gold}{\text{?}}`,
            why: {
              zh: '概率加权和的收缩：绝对值挪进求和（三角不等式），每个 |u−v| 都 ≤ ‖u−v‖<sub>∞</sub>，而权重之和恰为 1——加权和的绝对值 ≤ 绝对值的加权和 ≤ 最大分量。γ 从第 6 步的"常数提出"一路骑在界的前面：压缩系数正是从这里进场。',
              en: 'The probability-weighted sum contracts: move the absolute value into the sum (triangle inequality), bound each |u−v| by ‖u−v‖<sub>∞</sub>, and note the weights sum to exactly 1 — the absolute value of the weighted sum ≤ the weighted sum of absolute values ≤ the largest component. γ, extracted as a constant in step 6, rides in front of the bound the whole way: the contraction factor enters exactly here.',
            },
            blank: {
              q: {
                zh: '概率加权和的绝对值怎么放缩？γ 又从哪来——这一步结束时 |f(a)−g(a)| 的上界是什么（γ 必须在场，压缩系数全指着它）？',
                en: 'How does the probability-weighted sum contract, and where does γ come from — what is the bound on |f(a)−g(a)| at the end of this step (γ must be present; the contraction factor depends on it)?',
              },
              choices: [
                { tex: String.raw`\gamma\sum_{s'}p(s'\mid s,a)\,\big|u(s')-v(s')\big| \;\le\; \gamma\,\lVert u-v\rVert_\infty` },
                { tex: String.raw`\sum_{s'}p(s'\mid s,a)\,\big|u(s')-v(s')\big| \;\le\; \lVert u-v\rVert_\infty` },
                { tex: String.raw`\gamma\,\Big(\max_{s'}p(s'\mid s,a)\Big)\,\lVert u-v\rVert_\infty` },
                { zh: 'γ 源自奖励有界性与级数求和 Σγ<sup>k</sup> = 1/(1−γ)，不在这一步出现', en: 'γ originates from bounded rewards and the series sum Σγ<sup>k</sup> = 1/(1−γ); it does not appear at this step' },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确。三件套一次用完：绝对值进求和（三角不等式）→ 权重和为 1 且每个 |u−v| ≤ ‖u−v‖<sub>∞</sub> → γ 是第 6 步提出的折扣常数，全程骑在界的前面。压缩系数 γ 正是从这条通道进场的。', en: 'Correct. Three tools spent at once: absolute value into the sum (triangle inequality) → weights sum to 1 with every |u−v| ≤ ‖u−v‖<sub>∞</sub> → γ is the discount constant extracted in step 6, riding in front throughout. The contraction factor γ enters through exactly this channel.' },
                { zh: 'γ 丢了：γ 必须跟着不等式走。丢掉它只能得到"不放大"（系数 1），而压缩要求系数严格小于 1——γ &lt; 1 是整套收敛论证的心脏，第 8 步收网就指着它。', en: 'γ went missing: it must travel with the inequality. Without it you only get "no amplification" (factor 1), while contraction demands a factor strictly below 1 — γ &lt; 1 is the heart of the whole convergence argument, and step 8\'s closing move depends on it.' },
                { zh: '因子错位：控制加权平均的是"权重之和 = 1"，不是"最大权重"。反例：两个 s′ 各占 p = 0.5 且都取最坏误差时，加权和达到 ‖u−v‖<sub>∞</sub>，而 max p × ‖u−v‖ 只有它的一半——界被说小了，不等式并不成立。', en: 'Wrong factor: what controls a weighted average is "the weights sum to 1", not "the largest weight". Counterexample: two states s′ each with p = 0.5 both at the worst error — the weighted sum reaches ‖u−v‖<sub>∞</sub> while max p × ‖u−v‖ is only half of it — the bound is understated and the inequality fails.' },
                { zh: '张冠李戴：1/(1−γ) 是几何级数的和，属于"余项/误差换算"的账（下一条推导的主角）；γ 在这一步的来源只有一个——折扣常数本身，第 6 步作差时从求和号里提出，一路乘在界的前面。', en: 'Misattributed: 1/(1−γ) is the geometric-series sum, the business of remainders and error conversion (the next derivation\'s protagonist); γ has exactly one origin at this step — the discount constant itself, extracted from the sum in step 6 and multiplying the front of the bound ever since.' },
              ],
              hint: { zh: '三件事：绝对值进求和；Σp = 1；|u−v| 逐点 ≤ ‖u−v‖<sub>∞</sub>。γ 在第 6 步已经提出，别弄丢。', en: 'Three moves: absolute value into the sum; Σp = 1; |u−v| ≤ ‖u−v‖<sub>∞</sub> pointwise. γ was already extracted in step 6 — don\'t lose it.' },
            },
          },
          { // 步 8 · 收网：取 max 得 γ-压缩
            tex: String.raw`\lVert T^*u-T^*v\rVert_\infty \;=\; \max_s\Big|(T^*u)(s)-(T^*v)(s)\Big| \;\le\; \max_s\;\gamma\,\lVert u-v\rVert_\infty \;=\; \htmlClass{fx-gold}{\gamma\,\lVert u-v\rVert_\infty}`,
            why: {
              zh: '收网：第 7 步的界对每个 s 都成立，而右边与 s 无关——取 max 不改变它。‖T*u−T*v‖<sub>∞</sub> ≤ γ‖u−v‖<sub>∞</sub>，压缩系数恰为 γ，不多不少：这就是 L3 定理 3.2 的结论（§4.1 兑现的那张票），"误差每轮精确地乘一次 γ"从此字面成立。γ = 0.9 ⇒ 每轮 ×0.9。',
              en: 'Close the net: step 7\'s bound holds for every s while the right side is independent of s — taking the max changes nothing. ‖T*u−T*v‖<sub>∞</sub> ≤ γ‖u−v‖<sub>∞</sub> with contraction factor exactly γ, no more, no less: this is L3\'s Theorem 3.2 (the ticket §4.1 cashes), and "the error is multiplied by γ once per round" now holds literally. γ = 0.9 ⇒ ×0.9 per round.',
            },
          },
          { // 步 9 · Banach 不动点定理陈述
            tex: String.raw`\text{(Banach)}\quad \mathcal{X}\ \text{complete},\ \ T\colon\mathcal{X}\to\mathcal{X},\ \ \lVert Tu-Tv\rVert\le\gamma\lVert u-v\rVert\ (\gamma<1)\ \Longrightarrow\ \htmlClass{fx-gold}{\exists!\,v^\star\colon\ Tv^\star=v^\star},\ \ T^kv_0\to v^\star\ \ \forall v_0`,
            why: {
              zh: 'Banach 不动点定理（站点 L3 引用为定理 3.1）：完备度量空间上的 γ-压缩映射有且仅有一个不动点，且从任意初值出发反复施加都收敛到它。两个前提在此全部到位——舞台是配 ∞-范数的价值向量空间（有限维、完备，步 1），演员是刚证好的 γ-压缩 T*（步 8）。定理不问出身：v₀ = 0 也好、随手猜一个也好，终点唯一。',
              en: 'The Banach fixed-point theorem (cited as Theorem 3.1 in the site\'s L3): a γ-contraction on a complete metric space has exactly one fixed point, and iterating from any start converges to it. Both premises are in place — the stage is the value-vector space with the ∞-norm (finite-dimensional, complete, step 1), the actor is the freshly proved γ-contraction T* (step 8). The theorem asks nothing about origins: v₀ = 0 or a wild guess, the destination is the same and unique.',
            },
          },
          { // 步 10 · T* 的不动点 = BOE 的解
            tex: String.raw`T^*v = v \;\Longleftrightarrow\; v(s) = \max_a\sum_{s'}p(s'\mid s,a)\big[r(s,a,s')+\gamma\,v(s')\big]\quad\forall s \;\Longleftrightarrow\; \htmlClass{fx-gold}{v\ \text{solves the BOE}}`,
            why: {
              zh: '对号入座：不动点方程 T*v = v 逐状态展开，恰好就是 Bellman 最优方程（BOE，L3 全讲的主角）。于是 Banach 的"存在唯一不动点"翻译成 RL 语言：BOE 的解 v* 存在且唯一——最优价值函数从记号升格为定理担保的实物。§4.1 那句"这个不动点正是 BOE 的解 v*"的完整依据就是这一行。',
              en: 'Fitting the crown: the fixed-point equation T*v = v, expanded state by state, is exactly the Bellman optimality equation (the BOE, L3\'s protagonist throughout). Banach\'s "a unique fixed point exists" thus translates into RL language: the BOE\'s solution v* exists and is unique — the optimal value function is promoted from notation to an object guaranteed by theorem. This one line is the full warrant behind §4.1\'s "that fixed point is exactly the BOE\'s solution v*".',
            },
          },
          { // 步 11 · 值迭代收敛：任意初值
            tex: String.raw`v_{k+1} = T^*v_k \;\xrightarrow{\ k\to\infty\ }\; v^\star \qquad\Longrightarrow\qquad \htmlClass{fx-green}{\text{value iteration converges to } v^* \text{ from any } v_0}`,
            why: {
              zh: '值迭代就是反复施加 T*：v<sub>k+1</sub> = T*v<sub>k</sub>。Banach 直接兑付收敛性——从任意初值出发、不需要任何关于 v* 的先验知识。§4.1"收敛性从哪来"的完整票根在此。丑话照旧（§4.1 的 danger 提醒）：沿途的 v<sub>k</sub> 不是任何策略的状态值，收敛保证只许诺终点，不许诺沿途的名分。',
              en: 'Value iteration is exactly repeated application of T*: v<sub>k+1</sub> = T*v<sub>k</sub>. Banach pays out convergence directly — any initial value, zero prior knowledge about v*. Here is the complete ticket stub behind §4.1\'s "where does convergence come from". The caveat stands (§4.1\'s danger callout): the intermediate v<sub>k</sub> is no policy\'s state value; the guarantee covers the destination, not the standing of waypoints.',
            },
          },
          { // 步 12 · 白送的速率：γ^k
            tex: String.raw`\lVert v_k-v^\star\rVert_\infty = \lVert T^*v_{k-1}-T^*v^\star\rVert_\infty \;\le\; \gamma\,\lVert v_{k-1}-v^\star\rVert_\infty \;\le\; \cdots \;\le\; \htmlClass{fx-gold}{\gamma^k\,\lVert v_0-v^\star\rVert_\infty}`,
            why: {
              zh: '压缩白送的速率：把第 8 步用在 (v<sub>k−1</sub>, v*) 这一对上——v* 是不动点，v<sub>k</sub> − v* = T*v<sub>k−1</sub> − T*v*——再归纳链乘 k 次得 γ<sup>k</sup>。几何式（指数式）衰减，速度被 γ 一手决定：γ = 0.9 时约 22 轮缩 10 倍。这个 γ<sup>k</sup> 正是下一条推导的起点。',
              en: 'The rate thrown in for free: apply step 8 to the pair (v<sub>k−1</sub>, v*) — v* being a fixed point, v<sub>k</sub> − v* = T*v<sub>k−1</sub> − T*v* — then chain it k times by induction to get γ<sup>k</sup>. Geometric (exponential) decay, the speed dictated solely by γ: about 22 rounds per factor of 10 at γ = 0.9. This γ<sup>k</sup> is exactly the starting point of the next derivation.',
            },
          },
          { // 步 13 · 数值对账：3×3 世界逐轮吻合
            tex: String.raw`\gamma=0.9:\quad \lVert v_k-v^*\rVert_\infty = 9\times0.9^{k-1} = \htmlClass{fx-green}{10\times0.9^{k}} \qquad \text{(the 3×3 world of §4.1, round by round)}`,
            why: {
              zh: '数值对账（§4.1 的 3×3 世界，γ = 0.9，v₀ = 0）：真实误差 ‖v<sub>k</sub> − v*‖<sub>∞</sub> = 9×0.9<sup>k−1</sup>，与压缩预言逐轮吻合；v<sub>k</sub>(s9) = 10(1−0.9<sup>k</sup>) 按几何级数补齐缺口。定理不是墙上的装饰——它在具体数字上一分不差。',
              en: 'A numeric audit (§4.1\'s 3×3 world, γ = 0.9, v₀ = 0): the true error ‖v<sub>k</sub> − v*‖<sub>∞</sub> = 9×0.9<sup>k−1</sup>, matching the contraction prediction round by round; v<sub>k</sub>(s9) = 10(1−0.9<sup>k</sup>) fills in its missing chunk as a geometric series. The theorem is no wall decoration — it is exact to the last digit on concrete numbers.',
            },
          },
          { // 步 14 · 闭合卡
            tex: String.raw`\boxed{\;\lVert T^*u-T^*v\rVert_\infty\le\gamma\,\lVert u-v\rVert_\infty \;\Longrightarrow\; \exists!\,v^\star=T^*v^\star,\quad (T^*)^kv_0\to v^\star,\quad \lVert v_k-v^\star\rVert_\infty\le\gamma^k\,\lVert v_0-v^\star\rVert_\infty\;}`,
            why: {
              zh: '链条闭合，逐环清点：∞-范数备尺（步 1）→ T* 定义（步 2）→ 压缩目标（步 3）→ 逐状态做差（步 4）→ max 的 1-Lipschitz 放行（步 5）→ 奖励对消、γ 提出（步 6）→ 加权和收缩（步 7）→ 取 max 收网（步 8）→ Banach 兑现存在唯一与任意初值收敛（步 9–11）。但 γ<sup>k</sup>‖v₀−v*‖ 里仍藏着一个看不见的量：‖v₀−v*‖ 要真跑完迭代才知道。把它换成看得见的量、再落成停机准则，是下一条推导的全部任务——NB2 的收敛曲线会把这条几何衰减画在你眼前。',
              en: 'The chain closes; audit it link by link: the ∞-norm provides the ruler (step 1) → T* defined (step 2) → the contraction goal (step 3) → state-wise subtraction (step 4) → the 1-Lipschitz max waves it through (step 5) → rewards cancel, γ steps out (step 6) → the weighted sum contracts (step 7) → taking the max closes the net (step 8) → Banach delivers existence, uniqueness and convergence from any start (steps 9–11). Yet γ<sup>k</sup>‖v₀−v*‖ still hides an invisible quantity: ‖v₀−v*‖ is known only after actually finishing the iteration. Trading it for an observable and casting that into a stopping rule is the entire task of the next derivation — NB2 will paint this geometric decay before your eyes.',
            },
          },
        ],
      },
      {
        // #2 值迭代误差界与停机准则（12 步；★ blank 在第 4、10 步）
        id: 'vi-error-bound',
        name: { zh: '值迭代误差界与停机准则', en: 'The Error Bound and Stopping Rule of Value Iteration' },
        intro: {
          zh: '上一条推到 γ<sup>k</sup>‖v₀−v*‖ 就停了——界里藏着一个看不见的量：v* 正是要求解的未知数。本条把它换成第 0 轮就能算的 ‖v₀−T*v₀‖，合并出教科书形态的误差界 γ<sup>k</sup>/(1−γ)·‖v₀−T*v₀‖；再落到实践：停机阈值怎么设（γ = 0.9 时 ε 得先缩成 ε(1−γ)/γ）、要误差 &lt; 0.1 到底几轮够（对数除法实算）。两处关键步（三角不等式换观测量、停机阈值）答对才放行。',
          en: 'The previous derivation stopped at γ<sup>k</sup>‖v₀−v*‖ — the bound hides an invisible quantity: v* is the very unknown being solved for. This one trades it for ‖v₀−T*v₀‖, computable at round 0, merging into the textbook error bound γ<sup>k</sup>/(1−γ)·‖v₀−T*v₀‖; then lands it in practice: how to set the stopping threshold (at γ = 0.9, ε must first shrink to ε(1−γ)/γ) and how many rounds error &lt; 0.1 really takes (computed by logarithm division). Two key steps (the triangle-inequality swap and the stopping threshold) unlock only when filled correctly.',
        },
        steps: [
          { // 步 1 · 误差传播：压缩性套在 (v_k, v*) 上
            tex: String.raw`v_{k+1}=T^*v_k,\quad v^\star=T^*v^\star \;\Longrightarrow\; \lVert v_{k+1}-v^\star\rVert_\infty = \lVert T^*v_k-T^*v^\star\rVert_\infty \;\le\; \htmlClass{fx-gold}{\gamma\,\lVert v_k-v^\star\rVert_\infty}`,
            why: {
              zh: '误差传播：上条推导证好的压缩性（‖T*u−T*v‖<sub>∞</sub> ≤ γ‖u−v‖<sub>∞</sub>）原样套在 (v<sub>k</sub>, v*) 这一对上——v* 是不动点，v<sub>k+1</sub> = T*v<sub>k</sub> 与 v* = T*v* 作差，恰好是"映射后的差"。每迭代一轮，到终点的距离乘一次 γ：几何收敛的引擎就这一行。',
              en: 'Error propagation: the contraction just proved (‖T*u−T*v‖<sub>∞</sub> ≤ γ‖u−v‖<sub>∞</sub>) applied verbatim to the pair (v<sub>k</sub>, v*) — v* is a fixed point, so v<sub>k+1</sub> = T*v<sub>k</sub> minus v* = T*v* is exactly "the distance after the map". Each round multiplies the distance to the destination by γ: the entire engine of geometric convergence in one line.',
            },
          },
          { // 步 2 · 链式累乘 γ^k
            tex: String.raw`\lVert v_k-v^\star\rVert_\infty \;\le\; \gamma\,\lVert v_{k-1}-v^\star\rVert_\infty \;\le\; \gamma^2\,\lVert v_{k-2}-v^\star\rVert_\infty \;\le\;\cdots\le\; \htmlClass{fx-gold}{\gamma^k\,\lVert v_0-v^\star\rVert_\infty}`,
            why: {
              zh: '链式累乘：第 1 步对每个下标都成立，从 k 一路递推回 0（数学归纳），得 γ<sup>k</sup>‖v₀−v*‖<sub>∞</sub>——§4.1 的"几何收敛率"公式。到此一切白送；真正的麻烦在下一环。',
              en: 'Chained multiplication: step 1 holds at every index, so recurse from k back to 0 (induction) to get γ<sup>k</sup>‖v₀−v*‖<sub>∞</sub> — §4.1\'s "geometric convergence rate" formula. Everything so far is free; the real trouble waits at the next link.',
            },
          },
          { // 步 3 · 障碍：v* 不可观测
            tex: String.raw`\underbrace{\htmlClass{fx-red}{\lVert v_0-v^\star\rVert_\infty}}_{\text{unobservable: } v^\star \text{ is the unknown}} \qquad\text{vs}\qquad \underbrace{\lVert v_0-T^*v_0\rVert_\infty}_{\text{observable: one Bellman sweep}}`,
            why: {
              zh: '障碍：γ<sup>k</sup>‖v₀−v*‖<sub>∞</sub> 理论漂亮、实践看不见——v* 正是要求解的未知数，知道它就不必迭代了。但 ‖v₀−T*v₀‖<sub>∞</sub> 第 0 轮就能观测：施加一次 T*（恰好是值迭代的第一轮），量出挪了多远。任务：用这个看得见的量给看不见的 ‖v₀−v*‖ 定价。',
              en: 'The obstacle: γ<sup>k</sup>‖v₀−v*‖<sub>∞</sub> is beautiful in theory and invisible in practice — v* is the very unknown being solved for; know it and no iteration is needed. But ‖v₀−T*v₀‖<sub>∞</sub> is observable at round 0: apply T* once (exactly value iteration\'s first sweep) and measure how far it moved. Task: price the invisible ‖v₀−v*‖ with this visible quantity.',
            },
          },
          { // 步 4 ★ blank：三角不等式 + 压缩，解出可观测上界
            tex: String.raw`\lVert v_0-v^\star\rVert_\infty \;\le\; \underbrace{\lVert v_0-T^*v_0\rVert_\infty}_{\text{observable}} \;+\; \underbrace{\gamma\,\lVert v_0-v^\star\rVert_\infty}_{\text{contracted back}} \qquad\Longrightarrow\qquad \lVert v_0-v^\star\rVert_\infty \;\le\; \htmlClass{fx-gold}{\text{?}}`,
            why: {
              zh: '三角不等式插一个中转站 T*v₀：v₀ 到 v* 的距离 ≤ v₀ 到 T*v₀ 的距离 + T*v₀ 到 v* 的距离；第二段用压缩性折回 γ‖v₀−v*‖<sub>∞</sub>。于是未知量 ‖v₀−v*‖ 同时站在不等式两边——这不是坏事，恰是解出它的钥匙。',
              en: 'The triangle inequality inserts a waypoint T*v₀: the distance from v₀ to v* ≤ distance from v₀ to T*v₀ plus distance from T*v₀ to v*; the second leg folds back into γ‖v₀−v*‖<sub>∞</sub> by contraction. The unknown ‖v₀−v*‖ now stands on both sides — not a flaw but the very key to solving for it.',
            },
            blank: {
              q: {
                zh: '解这个不等式：未知量 ‖v₀−v*‖<sub>∞</sub> 同时出现在两边，移项合并后它能被哪个"看得见的量"控制？',
                en: 'Solve the inequality: the unknown ‖v₀−v*‖<sub>∞</sub> appears on both sides — after moving and merging, which observable quantity bounds it?',
              },
              choices: [
                { tex: String.raw`\dfrac{\lVert v_0-T^*v_0\rVert_\infty}{1-\gamma}` },
                { tex: String.raw`\lVert v_0-T^*v_0\rVert_\infty` },
                { tex: String.raw`\dfrac{\gamma\,\lVert v_0-T^*v_0\rVert_\infty}{1-\gamma}` },
                { tex: String.raw`\dfrac{\lVert v_0-T^*v_0\rVert_\infty}{\gamma}` },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确。两边除以 1−γ（γ &lt; 1 保证为正）。看不见的 ‖v₀−v*‖ 被换成一轮就能算的 ‖v₀−T*v₀‖——先付一轮 Bellman 扫描，买到全程的误差定价权。', en: 'Correct. Divide both sides by 1−γ (positive since γ &lt; 1). The invisible ‖v₀−v*‖ is traded for ‖v₀−T*v₀‖, computable in one sweep — pay one Bellman sweep up front, buy the pricing rights for the error all the way.' },
                { zh: '漏了放大系数：1/(1−γ) 必不可少——γ = 0.9 时相差 10 倍。直觉：残差每轮乘 γ，初值误差相当于"未来所有轮残差的几何级数和"，Σγ<sup>k</sup> = 1/(1−γ)。', en: 'Missing the amplification: 1/(1−γ) is indispensable — a factor of 10 at γ = 0.9. Intuition: the residual is multiplied by γ each round, so the initial error is the geometric sum of all future residuals, Σγ<sup>k</sup> = 1/(1−γ).' },
                { zh: '多乘了 γ：γ/(1−γ) 的形态属于"停机时用相邻两轮差"的界（本推导第 9 步）；初始换算这一步里，压缩项被移项消去，系数干净地是 1/(1−γ)。', en: 'An extra γ: the γ/(1−γ) shape belongs to the stopping-time bound via the round-to-round gap (step 9 below); in this initial conversion the contraction term is moved and cancelled, leaving a clean 1/(1−γ).' },
                { zh: '分母写错：移项后左边是 (1−γ)‖v₀−v*‖<sub>∞</sub>，除掉的是 (1−γ)；γ 单独蹲在分母的位置没有任何一步支撑。', en: 'Wrong denominator: after rearranging, the left side is (1−γ)‖v₀−v*‖<sub>∞</sub>, so (1−γ) is what gets divided out; nothing in any step puts γ alone in a denominator.' },
              ],
              hint: { zh: '把 γ‖v₀−v*‖ 移到左边与 ‖v₀−v*‖ 合并，再两边同除 1−γ。', en: 'Move γ‖v₀−v*‖ to the left, merge it with ‖v₀−v*‖, then divide both sides by 1−γ.' },
            },
          },
          { // 步 5 · 合并主结果：先验误差界
            tex: String.raw`\htmlClass{fx-gold}{\lVert v_k-v^\star\rVert_\infty \;\le\; \frac{\gamma^k}{1-\gamma}\,\lVert v_0-T^*v_0\rVert_\infty}`,
            why: {
              zh: '合并第 2、4 步：教科书形态的先验误差界。特别地 v₀ = 0 时 ‖v₀−T*v₀‖<sub>∞</sub> = ‖T*v₀‖<sub>∞</sub> ≤ max|r|（概率加权和不超过最大奖励绝对值），得到书上的简化版 γ<sup>k</sup>/(1−γ)·max|r|。',
              en: 'Merge steps 2 and 4: the textbook a-priori error bound. In particular, with v₀ = 0, ‖v₀−T*v₀‖<sub>∞</sub> = ‖T*v₀‖<sub>∞</sub> ≤ max|r| (a probability-weighted sum never exceeds the largest |r|), giving the book\'s simplified form γ<sup>k</sup>/(1−γ)·max|r|.',
            },
          },
          { // 步 6 · 数值对账：3×3 世界界取等
            tex: String.raw`\gamma=0.9,\ v_0=0:\quad \lVert v_0-T^*v_0\rVert_\infty=1 \;\Longrightarrow\; \lVert v_k-v^\star\rVert_\infty\le 10\times0.9^{k}, \qquad \text{true error} = 9\times0.9^{k-1} = \htmlClass{fx-green}{10\times0.9^{k}}`,
            why: {
              zh: '数值对账（§4.1 的 3×3 世界）：‖v₀−T*v₀‖<sub>∞</sub> = 1（第一轮只看得到即时奖励），界 = 10×0.9<sup>k</sup>；而真实误差恰为 9×0.9<sup>k−1</sup> = 10×0.9<sup>k</sup>——界在此例取等（紧）。本讲填空 T2 的 γ<sup>n+1</sup>/(1−γ)·max|r| 是同一条界换一套下标记法（从"再扫 n 轮"数起），数字一致。',
              en: 'A numeric audit (§4.1\'s 3×3 world): ‖v₀−T*v₀‖<sub>∞</sub> = 1 (the first sweep sees only immediate rewards), so the bound is 10×0.9<sup>k</sup>; and the true error is exactly 9×0.9<sup>k−1</sup> = 10×0.9<sup>k</sup> — the bound is attained (tight) in this example. Fill-in T2\'s γ<sup>n+1</sup>/(1−γ)·max|r| is the same bound under a shifted index convention ("n more sweeps to go"); the numbers agree.',
            },
          },
          { // 步 7 · 实算：误差 < 0.1 需要几轮
            tex: String.raw`10\times0.9^{k}<0.1 \;\Longleftrightarrow\; 0.9^{k}<0.01 \;\Longleftrightarrow\; k>\frac{\ln 0.01}{\ln 0.9}\approx \htmlClass{fx-green}{43.7} \;\Longrightarrow\; k=\htmlClass{fx-green}{44}`,
            why: {
              zh: '实算（node 验算过）：10×0.9<sup>k</sup> &lt; 0.1 ⇔ 0.9<sup>k</sup> &lt; 0.01 ⇔ k &gt; ln 0.01 / ln 0.9 ≈ 43.7（除以 ln 0.9 &lt; 0 时不等号反向，别翻车）⇒ k = 44：0.9<sup>44</sup> ≈ 0.0097，界 ≈ 0.097 &lt; 0.1；k = 43 时 ≈ 0.108 &gt; 0.1，不够。"44 轮"不是拍脑袋，是对数除法算出来的。',
              en: 'Computed for real (re-verified in node): 10×0.9<sup>k</sup> &lt; 0.1 ⇔ 0.9<sup>k</sup> &lt; 0.01 ⇔ k &gt; ln 0.01 / ln 0.9 ≈ 43.7 (dividing by ln 0.9 &lt; 0 flips the inequality — do not skid) ⇒ k = 44: 0.9<sup>44</sup> ≈ 0.0097, bound ≈ 0.097 &lt; 0.1; at k = 43 it is ≈ 0.108 &gt; 0.1, not enough. "44 rounds" is not a guess — it is what logarithm division produces.',
            },
          },
          { // 步 8 · 当前轮版本：三角不等式再上一次
            tex: String.raw`(1-\gamma)\,\lVert v_{k+1}-v^\star\rVert_\infty \;\le\; \gamma\,\lVert v_{k+1}-v_k\rVert_\infty`,
            why: {
              zh: '先验界两处不便：‖v₀−T*v₀‖ 要预付一轮，γ<sup>k</sup> 的计数也从第 0 轮定死；实践更爱问"当前这轮挪了多少，离终点还有多远"。推导照旧两件套：先压缩（v<sub>k+1</sub>−v* = T*v<sub>k</sub>−T*v* ≤ γ‖v<sub>k</sub>−v*‖），再对 ‖v<sub>k</sub>−v*‖ 用三角不等式拆出 ‖v<sub>k</sub>−v<sub>k+1</sub>‖ + ‖v<sub>k+1</sub>−v*‖，移项合并。所得即 §4.1 停止条件换算公式的下标平移版。',
              en: 'Two inconveniences of the a-priori bound: ‖v₀−T*v₀‖ must be prepaid with a sweep, and the γ<sup>k</sup> count is fixed from round 0; practice prefers asking "how far did this round move, and how far to the destination?". The derivation reuses the same two tools: contract first (v<sub>k+1</sub>−v* = T*v<sub>k</sub>−T*v* ≤ γ‖v<sub>k</sub>−v*‖), then split ‖v<sub>k</sub>−v*‖ by the triangle inequality into ‖v<sub>k</sub>−v<sub>k+1</sub>‖ + ‖v<sub>k+1</sub>−v*‖, and rearrange. The result is §4.1\'s stopping-condition conversion with the index shifted by one.',
            },
          },
          { // 步 9 · 解出停机形态：γ/(1−γ) × 相邻差
            tex: String.raw`\lVert v_{k+1}-v^\star\rVert_\infty \;\le\; \frac{\gamma}{1-\gamma}\,\lVert v_{k+1}-v_k\rVert_\infty \;=\; \frac{\gamma}{1-\gamma}\,\lVert v_k-T^*v_k\rVert_\infty`,
            why: {
              zh: '解出停机形态：误差 ≤ γ/(1−γ) × 相邻两轮差。γ = 0.9 时即 9 倍——§4.1 误区②那个"9 倍"的出处。注意恒等式 ‖v<sub>k</sub>−T*v<sub>k</sub>‖<sub>∞</sub> = ‖v<sub>k+1</sub>−v<sub>k</sub>‖<sub>∞</sub>：残差与相邻差是同一个量的两种写法（T*v<sub>k</sub> 就是下一轮的 v<sub>k+1</sub>），实践里观测的就是它。',
              en: 'Solved into stopping form: error ≤ γ/(1−γ) × the round-to-round gap. At γ = 0.9 that is the 9× — the very origin of §4.1 misconception ②\'s "factor 9". Note the identity ‖v<sub>k</sub>−T*v<sub>k</sub>‖<sub>∞</sub> = ‖v<sub>k+1</sub>−v<sub>k</sub>‖<sub>∞</sub>: residual and consecutive gap are one quantity written twice (T*v<sub>k</sub> is precisely the next round\'s v<sub>k+1</sub>) — exactly what practice observes.',
            },
          },
          { // 步 10 ★ blank：停机阈值
            tex: String.raw`\lVert v_k-T^*v_k\rVert_\infty \;<\; \htmlClass{fx-gold}{\text{?}} \qquad\Longrightarrow\qquad \lVert v_{k+1}-v^\star\rVert_\infty \;<\; \varepsilon`,
            why: {
              zh: '停机准则落地：要保留下来的 v<sub>k+1</sub> 误差 &lt; ε，从第 9 步反解出观测差的阈值。γ = 0.9 时阈值 ≈ 0.111ε——要误差 &lt; 0.1，相邻差得压到 ≈ 0.011，正是 §4.1 callout 里那个数。两个方向别混：阈值在停机前设，误差界在停机后报。',
              en: 'The stopping rule lands: for the retained v<sub>k+1</sub> to have error &lt; ε, invert step 9 to get the threshold on the observed gap. At γ = 0.9 the threshold is ≈ 0.111ε — for error &lt; 0.1 the gap must be squeezed to ≈ 0.011, exactly the number in §4.1\'s callout. Do not mix the two directions: the threshold is set before stopping, the error bound is reported after.',
            },
            blank: {
              q: {
                zh: '停机准则：观测相邻两轮差 ‖v<sub>k</sub>−T*v<sub>k</sub>‖<sub>∞</sub>（= ‖v<sub>k+1</sub>−v<sub>k</sub>‖<sub>∞</sub>），要保证保留下来的 v<sub>k+1</sub> 满足误差 &lt; ε，阈值应设为多少？',
                en: 'Stopping rule: observing the round-to-round gap ‖v<sub>k</sub>−T*v<sub>k</sub>‖<sub>∞</sub> (= ‖v<sub>k+1</sub>−v<sub>k</sub>‖<sub>∞</sub>), what threshold guarantees the retained v<sub>k+1</sub> has error &lt; ε?',
              },
              choices: [
                { tex: String.raw`\dfrac{\varepsilon\,(1-\gamma)}{\gamma}` },
                { tex: String.raw`\varepsilon` },
                { tex: String.raw`\dfrac{\varepsilon\,\gamma}{1-\gamma}` },
                { zh: '不需要换算——相邻两轮差本身就已经是当前真实误差', en: 'No conversion needed — the round-to-round gap already equals the current true error' },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确。从第 9 步反解：要 γ/(1−γ)·‖v<sub>k</sub>−T*v<sub>k</sub>‖ &lt; ε，阈值须 ‖v<sub>k</sub>−T*v<sub>k</sub>‖ &lt; ε(1−γ)/γ。γ = 0.9 时即 ε ≈ 0.111×目标：要误差 &lt; 0.1，相邻差压到 ≈ 0.011——§4.1 callout 的那个数。', en: 'Correct. Invert step 9: for γ/(1−γ)·‖v<sub>k</sub>−T*v<sub>k</sub>‖ &lt; ε, the threshold must be ‖v<sub>k</sub>−T*v<sub>k</sub>‖ &lt; ε(1−γ)/γ. At γ = 0.9 that is ≈ 0.111× the target: for error &lt; 0.1, squeeze the gap to ≈ 0.011 — the number in §4.1\'s callout.' },
                { zh: '直接拿 ε 当阈值 = 把"每轮挪动量"当"离终点的距离"，γ = 0.9 时误差被低估 9 倍——本讲误区②、实验报告里最常见的错。', en: 'Using ε itself as the threshold equates "how far this round moved" with "how far to the destination", underestimating the error by a factor 9 at γ = 0.9 — misconception ② of this lecture and the most common lab-report mistake.' },
                { zh: '方向反了——这是"阈值为 ε 时的误差上界"（γ = 0.9 时 9ε），不是"要误差 ε 所需的阈值"。乘除 γ/(1−γ) 的方向别搞混。', en: 'Direction reversed — this is the error upper bound when the threshold is ε (9ε at γ = 0.9), not the threshold needed for error ε. Keep the direction of multiplying/dividing by γ/(1−γ) straight.' },
                { zh: '相邻差量的是"这一轮挪了多少"，不是"离 v* 还有多远"：v<sub>k</sub> 仍在几何逼近的半路上，二者相差因子 γ/(1−γ)。停机前做一次换算，是写对实验报告的最低要求。', en: 'The gap measures "how far this round moved", not "how far from v*": v<sub>k</sub> is still mid-way through its geometric approach, the two differing by the factor γ/(1−γ). Converting before stopping is the bare minimum for an honest lab report.' },
              ],
              hint: { zh: '第 9 步右边是 γ/(1−γ)×观测差——要它小于 ε，观测差得小于什么？', en: 'Step 9\'s right side is γ/(1−γ) × the observed gap — for it to stay below ε, what must the gap stay below?' },
            },
          },
          { // 步 11 · NB2 钩子：γ 扫描的预言
            tex: String.raw`\text{NB2 sweep:}\quad \gamma\in\{0.5,\,0.9,\,0.99\},\ \ \lVert v_0-T^*v_0\rVert_\infty=1,\ \ \text{err}<0.1\ \text{needs}\ k=\htmlClass{fx-green}{5,\ 44,\ 688}`,
            why: {
              zh: 'γ 的杠杆有多重，一并摆出（node 实算核对）：γ = 0.5 时 k = 5、γ = 0.9 时 k = 44、γ = 0.99 时 k = 688——γ 逼近 1，轮数按 1/(1−γ) 量级爆炸（0.99 比 0.9 慢 15 倍以上）。NB2（本讲代码节尾的笔记本入口卡）的 γ ∈ {0.5, 0.9, 0.99} 扫描实验会画出这三条收敛曲线，assert 阈值就该照本条的换算设。',
              en: 'How heavy is γ\'s leverage, all at once (re-verified in node): k = 5 at γ = 0.5, k = 44 at γ = 0.9, k = 688 at γ = 0.99 — as γ approaches 1 the round count explodes on the order of 1/(1−γ) (0.99 is over 15× slower than 0.9). NB2 (the notebook entry card at the end of this lecture\'s code section) sweeps γ ∈ {0.5, 0.9, 0.99} and plots these three convergence curves; its assert thresholds should be set by this derivation\'s conversion.',
            },
          },
          { // 步 12 · 闭合卡
            tex: String.raw`\boxed{\;\lVert v_k-v^\star\rVert_\infty\le\frac{\gamma^k}{1-\gamma}\,\lVert v_0-T^*v_0\rVert_\infty\;}\qquad\boxed{\;\lVert v_k-T^*v_k\rVert_\infty<\frac{\varepsilon(1-\gamma)}{\gamma}\ \Rightarrow\ \lVert v_{k+1}-v^\star\rVert_\infty<\varepsilon\;}`,
            why: {
              zh: '闭合卡，逐环清点：压缩性给误差传播（步 1）→ 链乘 γ<sup>k</sup>（步 2）→ 三角不等式把看不见的 ‖v₀−v*‖ 换成第 0 轮残差（步 3–4）→ 合并成先验界（步 5）→ 数值换算 k = 44（步 6–7）→ 当前轮版本 + 停机阈值（步 8–10）。全套手艺只有一个思想：<strong>用看得见的量给看不见的误差定价</strong>——它是"跑够了没有"的唯一合法判据，也是实验报告里该写的那行界。',
              en: 'The chain closes; audit it link by link: contraction gives error propagation (step 1) → chaining to γ<sup>k</sup> (step 2) → the triangle inequality trades the invisible ‖v₀−v*‖ for the round-0 residual (steps 3–4) → merging into the a-priori bound (step 5) → the numeric conversion k = 44 (steps 6–7) → the current-round version plus the stopping threshold (steps 8–10). One idea powers the whole toolkit: <strong>price the invisible error with visible quantities</strong> — the only legitimate criterion for "have we run enough", and the line your lab report should quote.',
            },
          },
        ],
      },
    ],
  };


  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l4 = D.otherLectures.find(l => l.no === 4);
  if (l4) l4.live = true;
})();

/* ===== L4 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 3 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 13–15，共 3 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l4'] = {
    min: 13,
    max: 15,
    episodes: [
      { n: 13, en: "Value Iteration and Policy Iteration (P1-Value iteration)", yt: "wMAVmLDIvQU" },
      { n: 14, en: "Value Iteration and Policy Iteration (P2-Policy iteration)", yt: "Pka6Om0nYQ8" },
      { n: 15, en: "Value Iteration and Policy Iteration (P3-Truncated policy iteration)", yt: "tUjPFPD3Vc8" }
    ],
  };
  D.sections['l4-vi'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l4' } });
})();
