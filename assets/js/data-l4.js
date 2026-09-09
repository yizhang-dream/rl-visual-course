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
    title: { zh: '问答：动态规划六连问', en: 'Q&A: Six Questions on Dynamic Programming' },
    blocks: [
      { t: 'p', zh: '本章问答的核心全是"中间值算不算状态值"这个细思恐极的问题，以及收敛保证。', en: 'This chapter\'s Q&As circle the spine-chilling question "are intermediate values state values?", plus convergence guarantees.' },
      { t: 'p', zh: '翻卡前先自查三个最易翻车的点：① 值迭代的中间量 v<sub>k</sub> 是不是状态值（不是——它不满足任何策略的 Bellman 方程）；② 停止时 ‖Δv‖ &lt; ε 对应的真实误差是多少（γε/(1−γ)，γ = 0.9 时是 9ε）；③ 策略迭代凭什么有限步终止（策略总数有限 + 每轮严格改进或已最优）。答不上哪条，就回对应小节再看一遍。', en: 'Before flipping cards, self-check the three most crash-prone points: ① is VI’s intermediate v<sub>k</sub> a state value (no — it satisfies no policy’s Bellman equation); ② what true error does ‖Δv‖ &lt; ε at stopping correspond to (γε/(1−γ), a factor 9 at γ = 0.9); ③ why does policy iteration terminate in finitely many steps (finitely many policies + strict improvement or already optimal). If any answer escapes you, revisit the matching section.' },
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


  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l4 = D.otherLectures.find(l => l.no === 4);
  if (l4) l4.done = true;
})();
