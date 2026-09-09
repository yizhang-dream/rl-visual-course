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
      { t: 'p', zh: '这四个问题看着像哲学，其实都是数学题，而且共用一把钥匙——<strong>Bellman 最优方程（Bellman optimality equation, BOE）</strong>。接下来的路线：写出 BOE → 证明它有唯一解 → 给出解它的迭代算法 → 证明解出来就是最优。四连问一次全清。', en: 'These four questions look philosophical but are mathematical, and they share one key — the <strong>Bellman optimality equation (BOE)</strong>. The route: write the BOE → prove it has a unique solution → give an iterative algorithm → prove the solution is optimal. Four questions cleared in one sweep.' },
    ],
  };

  /* ---- §3.3 BOE ---- */
  S['l3-boe'] = {
    kicker: 'L3 · §3.3',
    title: { zh: 'Bellman 最优方程：把 max 写进方程', en: 'The BOE: Writing max into the Equation' },
    blocks: [
      { t: 'p', zh: 'Bellman 方程 v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> 是"给定策略"的方程。把"给定"换成"挑最好"——对每个状态，在所有可选策略 π(s) 里挑让右端最大的那个——就得到 <strong>BOE</strong>：', en: 'The Bellman equation v<sub>π</sub> = r<sub>π</sub> + γP<sub>π</sub>v<sub>π</sub> is the equation of a <em>given</em> policy. Replace "given" by "pick the best" — for each state, choose among all local policies π(s) the one maximising the right-hand side — and you get the <strong>BOE</strong>:' },
      { t: 'formula', lbl: 'Bellman 最优方程 · Eq. (3.1)',
        html: 'v(s) = max<sub>π(s)∈Π(s)</sub> Σ<sub>a</sub> π(a|s) q(s,a), &nbsp;&nbsp; 其中 q(s,a) = Σ<sub>r</sub> p(r|s,a) r + γ Σ<sub>s′</sub> p(s′|s,a) v(s′)' },
      { t: 'p', zh: '<strong>一个方程怎么有两个未知数？</strong>（v 和 π）书上的回答极其干脆：一个一个解。先看两个小例子。例 3.1：x = max<sub>y</sub>(2x − 1 − y²)。无论 x 是多少，右端在 y = 0 时取最大 2x − 1，代回去解 x = 2x − 1 得 x = 1。先解"好解的"未知数，再解另一个。', en: '<strong>One equation, two unknowns?</strong> (v and π) The book\'s answer is brisk: solve them one at a time. Example 3.1: x = max<sub>y</sub>(2x − 1 − y²). Whatever x is, the right side peaks at y = 0 giving 2x − 1; substitute back, x = 2x − 1, so x = 1. Solve the easy unknown first, then the other.' },
      { t: 'p', zh: '例 3.2 是 BOE 右端的缩影：在 c₁ + c₂ + c₃ = 1、cᵢ ≥ 0 的约束下最大化 c₁q₁ + c₂q₂ + c₃q₃。结论一目了然：<strong>把全部概率押在最大的 q 上</strong>（比如 q₃ 最大就取 c₃* = 1）。代入 BOE：<strong>最优的 π(s) 就是"贪心"策略——选 q(s,a) 最大的那个动作，概率 1</strong>。于是 BOE 的右端变成 max<sub>a</sub> q(s,a)，只是 v 的函数，记作 f(v)，方程缩写成 <strong>v = f(v)</strong>——一个非线性方程。矩阵形式即 v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v)，逐元素取 max。', en: 'Example 3.2 is the BOE right side in miniature: maximise c₁q₁ + c₂q₂ + c₃q₃ subject to c₁+c₂+c₃ = 1, cᵢ ≥ 0. The conclusion is plain: <strong>put all probability on the greatest q</strong> (if q₃ is largest, take c₃* = 1). Substituting into the BOE: <strong>the optimal π(s) is the greedy policy — probability 1 on the action with the greatest q(s,a)</strong>. The right side then becomes max<sub>a</sub> q(s,a), a function of v alone, call it f(v); the equation compresses to <strong>v = f(v)</strong> — a nonlinear equation. In matrix form: v = max<sub>π</sub>(r<sub>π</sub> + γP<sub>π</sub>v), elementwise max.' },
      { t: 'callout', variant: 'warn', zh: '<strong>BOE 和 Bellman 方程的关系</strong>：BOE 是一个特殊的 Bellman 方程——对应的策略恰好是最优策略。但表达式长得不一样（多了 max），它不再是线性方程，L2 那套线性代数工具全部失效，必须请新工具：压缩映射定理。', en: '<strong>BOE vs. Bellman equation</strong>: the BOE is a special Bellman equation whose corresponding policy happens to be optimal. But the expression differs (the max), it is no longer linear, and every linear-algebra tool from L2 goes out the window — a new tool is needed: the contraction mapping theorem.' },
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
        html: '若 f 是压缩映射，则 x = f(x) 的不动点 x* <span class="mt">存在</span>、<span class="mt">唯一</span>，且 x<sub>k+1</sub> = f(x<sub>k</sub>) 从<strong>任何</strong> x₀ 出发都<span class="mt">指数速度</span>收敛到 x*' },
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
      { t: 'steps', items: [
        { zh: '<strong>最优策略不唯一</strong>：v* 唯一，但取到 v* 的策略可以多条（书 Figure 3.3：s1 处 0.5/0.5 随机与另一条确定性策略都是最优）。直觉：两条路一样好，掷不掷硬币都到罗马。', en: '<strong>Optimal policies are not unique</strong>: v* is unique, yet several policies may attain it (book Figure 3.3: a 0.5/0.5 stochastic policy and a deterministic one are both optimal). Intuition: when two roads are equally good, flipping a coin or not still lands in Rome.' },
        { zh: '<strong>必有确定性最优策略</strong>：最优策略可以是随机的也可以是确定的，但定理 3.5 保证<strong>总存在一条确定性的贪心最优策略</strong>——这就是为什么我们敢在图里全画箭头。', en: '<strong>A deterministic optimal policy always exists</strong>: optimal policies may be stochastic or deterministic, but Theorem 3.5 guarantees at least one <strong>deterministic greedy</strong> optimal policy — which is why drawing arrows everywhere is always honest.' },
        { zh: '<strong>四个问题全部销账</strong>：存在 ✓（不动点）、算法 ✓（值迭代）、唯一性 ✓（v* 唯一，π* 不一定）、随机性 ✓（可随机，必有确定）。', en: '<strong>All four questions settled</strong>: existence ✓ (fixed point), algorithm ✓ (value iteration), uniqueness ✓ (v* unique, π* not necessarily), stochasticity ✓ (may be stochastic, deterministic always exists).' },
      ]},
    ],
  };

  /* ---- §3.5 因素 ---- */
  S['l3-factors'] = {
    kicker: 'L3 · §3.5',
    title: { zh: 'γ 和奖励如何摆布最优策略', en: 'How γ and Rewards Bend Optimal Policies' },
    blocks: [
      { t: 'p', zh: 'BOE 最大的实用价值：它是一台<strong>策略实验机</strong>。逐状态的表达式里有三个旋钮——即时奖励 r、折扣率 γ、模型 p——拧动旋钮重解 BOE，就能看到最优策略如何变形。书里的基线是 5×5 世界（r<sub>boundary</sub> = r<sub>forbidden</sub> = −1、r<sub>target</sub> = 1、r<sub>other</sub> = 0）：γ = 0.9 时最优策略<strong>敢于穿越禁区</strong>——从 (4,1) 出发宁可吃两个 −1 也要走近路，因为 γ 大，远处的 +1 很值钱，算总账穿越更划算。这就是"远视"。', en: 'The BOE\'s greatest practical value: it is a <strong>policy experiment machine</strong>. Its elementwise form has three knobs — the immediate reward r, the discount rate γ, and the model p — and twisting them while re-solving the BOE shows how optimal policies morph. The book\'s baseline is the 5×5 world (r<sub>boundary</sub> = r<sub>forbidden</sub> = −1, r<sub>target</sub> = 1, r<sub>other</sub> = 0): at γ = 0.9 the optimal policy <strong>dares to cross forbidden cells</strong> — from (4,1) it prefers eating two −1s on the shortcut, because a large γ makes the distant +1 precious and the total favours crossing. That is far-sightedness.' },
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
    ],
  };

  /* ---- §3.6 总结 ---- */
  S['l3-summary'] = {
    kicker: 'L3 · §3.6',
    title: { zh: '本章总结：最优性从定义变成算法', en: 'Chapter Summary: Optimality Turns from Definition into Algorithm' },
    blocks: [
      { t: 'p', zh: '本章把"最优"从愿望变成了可计算的对象。概念上：<strong>最优策略</strong>由逐格的状态值比较定义，其值即<strong>最优状态值</strong>。工具上：<strong>BOE</strong> 把最优性写进方程，它的右端是压缩映射，压缩映射定理一步到位地给出存在性、唯一性、迭代算法与收敛速度。解出 v* 后贪心提取 π*，定理 3.4 保证这就是最优。γ 与奖励两个旋钮决定最优策略的形状——远视/近视、敢闯/保守，全是参数的表达。', en: 'This chapter turned "optimal" from a wish into a computable object. Conceptually: the <strong>optimal policy</strong> is defined by cell-wise state-value comparison, and its values are the <strong>optimal state values</strong>. Tool-wise: the <strong>BOE</strong> writes optimality into an equation whose right side is a contraction, and the contraction mapping theorem instantly yields existence, uniqueness, an iterative algorithm, and its rate. Solve for v*, extract π* greedily, and Theorem 3.4 certifies optimality. The two knobs γ and reward shape the optimal policy — far-sighted or short-sighted, bold or conservative are all parameter expressions.' },
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
    ],
  };

  /* ---- L3 Q&A ---- */
  S['l3-qa'] = {
    kicker: 'L3 · §3.7',
    title: { zh: '问答：最优性十连问（精选）', en: 'Q&A: Ten Questions on Optimality (Selected)' },
    blocks: [
      { t: 'p', zh: '书上的十个问答把本章钉得死死的，这里精选六张卡片 + 一张"旋钮速查"。', en: 'The book\'s ten Q&As nail this chapter shut; six selected cards plus one knob cheat-sheet follow.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l3' } },
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

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 3,
    label: 'L3 · Bellman 最优方程',
    items: [
      { id: 'l3-improve', zh: '动机：怎么改进策略', en: '§3.1 Policy improvement' },
      { id: 'l3-definition', zh: '最优性的定义与四问', en: '§3.2 Optimality defined' },
      { id: 'l3-boe', zh: 'BOE 与双未知数', en: '§3.3 The BOE' },
      { id: 'l3-contraction', zh: '压缩映射定理', en: '§3.3.3 Contraction mapping' },
      { id: 'l3-solving', zh: '解 BOE：v* 与 π*', en: '§3.4 Solving the BOE' },
      { id: 'l3-factors', zh: 'γ 与奖励的旋钮', en: '§3.5 γ & reward knobs' },
      { id: 'l3-detour', zh: '绕路之谜', en: '§3.5 The detour puzzle' },
      { id: 'l3-summary', zh: '本章总结', en: '§3.6 Summary' },
      { id: 'l3-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l3-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l3-qa', zh: '问答', en: 'Q&A · §3.7' },
    ],
  });
  const l3 = D.otherLectures.find(l => l.no === 3);
  if (l3) l3.done = true;
})();
