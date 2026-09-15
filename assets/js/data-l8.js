/* ═══════════════════════════════════════════════════════════
   L8 · 值函数近似（书 Ch.8）：从表格到函数，再到 DQN
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §8.1 表示 ---- */
  S['l8-representation'] = {
    kicker: 'L8 · §8.1',
    title: { zh: '从表格到函数：为什么必须换表示？', en: 'From Table to Function: Why the Representation Must Change' },
    blocks: [
      { t: 'p', zh: '表格法的死穴是<strong>泛化</strong>：更新 s₁ 的价值，s₂、s₃ 的价值纹丝不动——格子之间互相不认识。状态空间一大（围棋 ~10<sup>170</sup>、连续控制任务无穷多），表既存不下也学不快。<strong>函数近似</strong>的解法：用参数化函数 v̂(s, w) ≈ v<sub>π</sub>(s) 代替查表——最简单的线性形式 v̂(s,w) = φ<sup>T</sup>(s)w，其中 φ(s) 是特征向量（把状态编码成几个数），w 是待学参数。', en: 'The table method\'s fatal flaw is <strong>generalisation</strong>: updating s₁\'s value leaves s₂ and s₃ untouched — cells do not know each other. With huge state spaces (Go ~10<sup>170</sup>, continuous control infinitely many), tables can neither be stored nor learned quickly. <strong>Function approximation</strong> answers: a parameterised function v̂(s, w) ≈ v<sub>π</sub>(s) replaces the lookup — the simplest linear form v̂(s,w) = φ<sup>T</sup>(s)w, where φ(s) is a feature vector (encoding the state into a few numbers) and w is the parameter to learn.' },
      { t: 'steps', items: [
        { zh: '<strong>检索方式变了</strong>：表格查一次 O(1)；函数要输入 s 算前向（神经网络的 forward）。', en: '<strong>Retrieval changes</strong>: a table is O(1); a function computes a forward pass on s.' },
        { zh: '<strong>更新方式变了</strong>：表格改一个格子；函数更新参数 w——<strong>间接地</strong>改变许多状态的价值。这既是泛化的来源，也是不稳定性的来源。', en: '<strong>Updating changes</strong>: a table rewrites one cell; a function updates w — <strong>indirectly</strong> changing many states\' values at once. This is both the source of generalisation and of instability.' },
        { zh: '<strong>拟合问题</strong>：给定各状态真值 {(sᵢ, v<sub>π</sub>(sᵢ))}，最小化 Σ(v̂(sᵢ,w) − v<sub>π</sub>(sᵢ))² 就是标准最小二乘，线性情形闭式解 w* = (Φ<sup>T</sup>Φ)⁻¹Φv<sub>π</sub>。', en: '<strong>The fitting problem</strong>: given true pairs {(sᵢ, v<sub>π</sub>(sᵢ))}, minimising Σ(v̂(sᵢ,w) − v<sub>π</sub>(sᵢ))² is plain least squares; the linear case has the closed form w* = (Φ<sup>T</sup>Φ)⁻¹Φv<sub>π</sub>.' },
      ]},
      { t: 'p', zh: '<strong>状态空间爆炸记的三笔账。</strong>① <strong>存储账</strong>：围棋 ~10<sup>170</sup> 个状态，比可观测宇宙的原子数（~10<sup>80</sup>）还多 90 个数量级——一格一个数，宇宙里没有硬盘装得下；连续状态（机器人关节角度）更是直接无穷。② <strong>样本账</strong>：更隐蔽的一笔。L7 的收敛条件要求每个 (s,a) 被访问无穷多次——表格时代这靠 ε-greedy 慢慢磨；状态一多，绝大多数格子终身饿肚子，估出来的价值全是初始值。③ <strong>迁移账</strong>：两个像素只差一点的局面，在表里是毫无关系的两格——从 (s=1000) 学到的东西帮不到 (s=1001)。<strong>函数近似一笔清三账</strong>：参数个数与 |S| 脱钩（存储）、改一次参数全体状态跟着动（样本被复用）、相似输入相似输出（迁移=泛化）。', en: '<strong>Three bills in the ledger of the state-space explosion.</strong> ① <strong>Storage</strong>: Go has ~10<sup>170</sup> states — ninety orders of magnitude more than the atoms in the observable universe (~10<sup>80</sup>); one number per cell and no disk in the universe suffices; continuous states (robot joint angles) are outright infinite. ② <strong>Samples</strong>: the subtler bill. L7’s convergence conditions demand every (s,a) be visited infinitely often — tabular times grind this out slowly with ε-greedy; once states multiply, most cells starve forever and their “values” remain initial values. ③ <strong>Transfer</strong>: two pixel-wise nearly identical screens are total strangers in a table — what is learned at s=1000 does nothing for s=1001. <strong>Function approximation clears all three at once</strong>: parameter count decouples from |S| (storage), one parameter update moves every state (samples are reused), similar inputs yield similar outputs (transfer = generalisation).' },
      { t: 'formula', lbl: '表格法 = 线性近似的特例 · Tables are a special case',
        html: '取 one-hot 特征 <i class="fx-inline" data-tex="\\varphi(s) = e_s"></i>（仅第 <i class="fx-inline" data-tex="s"></i> 维为 1）⟹ &nbsp;<i class="fx-inline" data-tex="\\hat{v}(s, w) = \\varphi^{T}(s)w"></i> = <span class="mt"><i class="fx-inline" data-tex="w_s"></i></span> &nbsp;&nbsp;<span style="font-size:13px;color:var(--ink-3)">每个状态独占一个参数——参数之间零共享，泛化为零、存储为 |S|：表格法的精确画像</span>' },
      { t: 'p', zh: '<strong>特征构造的直觉：把"相似"编码进向量。</strong>泛化不是函数近似白送的——它来自特征：<strong>两个状态的向量靠得近，学其中一个时另一个就顺带被修正</strong>。所以特征设计的本质是回答"什么算相似"。多项式特征按"坐标幂次"相似（s 和 s+1 的低次幂几乎相同）；Fourier 特征按"频率成分"相似（低频波覆盖大片相邻状态，高频波管局部细节）；Tile coding 干脆把状态空间铺上瓷砖，落进同一块瓷砖的状态共享激活。<strong>特征是先验知识的注入点</strong>：你对问题结构懂多少，就能把相似性设计得多准——这比调网络结构更本质。', en: '<strong>The intuition of feature construction: encode “similarity” into vectors.</strong> Generalisation is not a free gift of approximation — it comes from features: <strong>when two states have nearby vectors, learning one incidentally corrects the other</strong>. Feature design is therefore the answer to “what counts as similar”. Polynomial features are similar by coordinate powers (low powers of s and s+1 nearly coincide); Fourier features by frequency content (low frequencies cover swathes of neighbouring states, high frequencies handle local detail); tile coding literally tiles the state space, states in the same tile sharing activation. <strong>Features are the injection point of prior knowledge</strong>: the better you understand the problem’s structure, the more precisely you can encode similarity — more fundamental than tweaking network architectures.' },
      { t: 'callout', variant: 'key', zh: '<strong>泛化是函数近似的超能力</strong>（书 Figure 8.4）：s₃ 的经验样本不仅能更新 s₃ 自己，还会通过共享参数 w 顺带修正相邻状态的价值——因为它们共享特征。这正是神经网络能玩游戏的根本原因：没见过的局面，靠相似特征举一反三。', en: '<strong>Generalisation is the superpower</strong> (book Figure 8.4): an experience sample at s₃ updates not only s₃ but, through the shared parameters w, also the values of neighbouring states — they share features. This is exactly why neural networks can play games: unseen situations generalise from similar features.' },
      { t: 'callout', variant: 'idea', zh: '<strong>换表示不是抛弃前七章，而是推广它们。</strong>one-hot 特征下函数近似精确退回表格法——TD、Sarsa、Q-learning 的所有结论原封不动。函数近似是"更一般的语言"，表格是这门语言里最奢侈的方言（每个状态一个专属参数）。学第 8 章的正确姿势：每学一个结论，都问一句"表格情形它退化成什么"——答案应该恰好是你已经会的东西。', en: '<strong>Changing representation does not abandon the first seven chapters — it generalises them.</strong> With one-hot features, function approximation degenerates exactly back to tables, and every conclusion about TD, Sarsa, and Q-learning carries over untouched. Function approximation is “a more general language”, and tables are its most extravagant dialect (one dedicated parameter per state). The right posture for Chapter 8: with each new result, ask “what does this degenerate to in the tabular case” — the answer should be precisely what you already know.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"表格的死穴","en":"the table's dead end","d":{"zh":"格子之间互相不认识：更新 s₁，s₂ 纹丝不动；状态空间一大，表存不下也学不快。","en":"Cells know nothing of each other: updating s₁ leaves s₂ untouched; big state spaces can neither be stored nor learned."}},
        {"zh":"函数近似","en":"function approx.","d":{"zh":"v̂(s,w) = φᵀ(s)w：更新参数 w，间接改变许多状态的价值——既是泛化也是不稳定的来源。","en":"v̂(s,w) = φᵀ(s)w: updating w moves many states at once — the source of generalization and of instability alike."}},
        {"zh":"特征即先验","en":"features are priors","d":{"zh":"泛化来自特征：向量相近的状态互相修正；特征设计回答\"什么算相似\"。","en":"Generalization comes from features: nearby vectors correct each other; feature design answers \"what counts as similar\"."}},
        {"zh":"one-hot 退回表格","en":"one-hot = table","d":{"zh":"one-hot 特征下函数近似精确退回表格法——表格是这门语言里最奢侈的方言。","en":"With one-hot features, function approximation reduces exactly to tabular — tables are this language's most luxurious dialect."}},
      ] } },
    ],
  };

  /* ---- §8.2 TD + FA ---- */
  S['l8-td-fa'] = {
    kicker: 'L8 · §8.2',
    title: { zh: 'TD + 函数近似 = 一个优化问题', en: 'TD + Function Approximation = An Optimisation Problem' },
    blocks: [
      { t: 'p', zh: '把近似写成优化问题：目标函数 J(w) = E[(v<sub>π</sub>(S) − v̂(S,w))²]——让估计值和真值的平方误差期望最小（S 的分布决定"更在乎哪些状态"，平稳分布是最常用的选择）。对 J 做梯度下降，再按 SGD 精神把期望换成单样本：', en: 'Pose approximation as optimisation: J(w) = E[(v<sub>π</sub>(S) − v̂(S,w))²] — minimise the expected squared error (the distribution of S decides "which states matter"; the stationary distribution is the usual choice). Gradient descent on J, then swap the expectation for a single sample in SGD spirit:' },
      { t: 'formula', lbl: 'TD + 函数近似的骨架 · The skeleton — Eq. (8.12)',
        tex: String.raw`w_{t+1} = w_t + \alpha_t\big[v_\pi(s_t) - \hat{v}(s_t, w_t)\big]\,\nabla_w \hat{v}(s_t, w_t)` },
      { t: 'p', zh: '麻烦来了：真值 v<sub>π</sub>(s<sub>t</sub>) 未知（不然还学什么）。两种替换：<strong>MC 替换</strong>——用轨迹回报 g<sub>t</sub>；<strong>TD 替换</strong>——用自举目标 r + γv̂(s′,w)。后者代入得到 <strong>TD-Linear</strong>：', en: 'The catch: the true v<sub>π</sub>(s<sub>t</sub>) is unknown (or there would be nothing to learn). Two substitutions: <strong>MC</strong> — use the episode return g<sub>t</sub>; <strong>TD</strong> — use the bootstrap target r + γv̂(s′,w). The latter gives <strong>TD-Linear</strong>:' },
      { t: 'formula', lbl: 'TD-Linear — Eq. (8.13)',
        tex: String.raw`w_{t+1} = w_t + \alpha_t\big[r + \gamma\hat{v}(s',w_t) - \hat{v}(s,w_t)\big]\,\nabla_w \hat{v}(s,w_t)`,
        note: '（线性时 ∇<sub>w</sub>v̂ = φ(s)）' },
      { t: 'p', zh: '<strong>半梯度（semi-gradient）的精髓：目标里也有 w，但求导时装作没有。</strong>看仔细：TD 替换后的目标 r + γv̂(s′,w<sub>t</sub>) 本身就是 w 的函数——按微积分的规矩，对 J 求真梯度应该把这一项也链式展开。TD-Linear 偏不：<strong>把目标整体当作常数（当作"真值 v<sub>π</sub>(s) 的临时替身"），只对预测侧 v̂(s,w) 求导</strong>。为什么叫"半"：只做了一半的求导。为什么敢：若把目标看成真值的样本，更新式恰好保持 SGD 的形状，L6 的整套机器直接复用；而且自举目标只含一步噪声，方差小。代价是什么？<strong>更新方向不再是任何固定目标函数的梯度</strong>——你优化的靶子自己会随 w 移动，"梯度下降保证下山"的直觉就此失效。', en: '<strong>The essence of the semi-gradient: the target contains w too, but we differentiate as if it did not.</strong> Look closely: the TD-substituted target r + γv̂(s′,w<sub>t</sub>) is itself a function of w — by the rules of calculus, a true gradient of J should chain-rule through it as well. TD-Linear refuses: <strong>treat the whole target as a constant (a stand-in for the true value v<sub>π</sub>(s)) and differentiate only the prediction side v̂(s,w)</strong>. Why “semi”: only half the differentiation is done. Why dare: if the target is viewed as a sample of the truth, the update keeps the SGD shape and all of L6’s machinery carries over; and the bootstrap target carries only one step of noise — small variance. And the price? <strong>The update direction is no longer the gradient of any fixed objective</strong> — the bullseye you optimise moves with w, and the “gradient descent goes downhill” intuition dies there.' },
      { t: 'formula', lbl: '半梯度扔掉了什么 · What the semi-gradient throws away',
        tex: String.raw`\begin{gathered} \text{若对目标也求导，完整梯度应含}：\htmlClass{fx-gold}{-2\big(v_{\text{target}} - \hat{v}(s,w)\big) \cdot \nabla_w\big[r + \gamma\hat{v}(s',w)\big]}\,\text{（目标侧的链式项）}\\[2pt] \text{半梯度只保留}：\htmlClass{fx-accent}{-2\big(v_{\text{target}} - \hat{v}(s,w)\big) \cdot \nabla_w \hat{v}(s,w)}\,\text{（预测侧）} \end{gathered}`,
        note: '金色项被整体丢弃——便宜一步，代价是"不再是真梯度"' },
      { t: 'steps', items: [
        { zh: '<strong>MC 替换（真梯度）</strong>：目标 g<sub>t</sub> 是已实现的真实回报，<strong>不含 w</strong>——对 J(w)=E[(g−v̂)²] 是货真价实的 SGD。线性情形凸，收敛到全局最优；非线性收敛到局部最优。代价：高方差 + 必须等回合结束。', en: '<strong>MC substitution (true gradient)</strong>: the target g<sub>t</sub> is a realised return that <strong>contains no w</strong> — this is honest SGD on J(w)=E[(g−v̂)²]. The linear case is convex and converges globally; the nonlinear one converges locally. The price: high variance plus waiting for episode ends.' },
        { zh: '<strong>TD 替换（半梯度）</strong>：目标 r + γv̂(s′,w) 含 w 却被当作常数——更新不是任何固定 J 的梯度。换来的是：单步更新、低方差、在线可学。即便收敛，收敛点一般也不是 J 的极小值，而是<strong>投影 Bellman 误差（PBE）的不动点</strong>。', en: '<strong>TD substitution (semi-gradient)</strong>: the target r + γv̂(s′,w) contains w yet is treated as constant — the update is not the gradient of any fixed J. What it buys: per-step updates, low variance, online learning. Even when it converges, the limit is generally not a minimiser of J but a <strong>fixed point of the projected Bellman error (PBE)</strong>.' },
        { zh: '<strong>一句话记牢</strong>：MC+FA 是"无偏但吵的 SGD"；TD+FA 是"安静但路子不正的伪 SGD"。两者优化的目标函数压根不同——这不是精度差别，是去向差别。', en: '<strong>One line to remember</strong>: MC+FA is an “unbiased but noisy SGD”; TD+FA is a “quiet but improperly licensed pseudo-SGD”. The two optimise different objectives altogether — not a difference in accuracy but in destination.' },
      ]},
      { t: 'callout', variant: 'warn', zh: '<strong>【书外延伸，助理解】半梯度的代价可能不止"学不准"，还能"学崩"。</strong> Baird 的著名反例（1995）：一个仅 7 个状态的小 MDP + 线性 v̂ + TD 半梯度 + off-policy 训练，参数 ‖w‖ 每一步都增大，直冲无穷——不是收敛慢，是<strong>发散</strong>。这正警告了后面的"致命三角"：自举 + 函数近似 + off-policy 同开时，半梯度没有任何收敛保证。顺带一个好消息：纯 on-policy 的线性半梯度 TD(0) 有收敛保证（收敛到 PBE 不动点，不是真值）——书上的理论结论限定的都是这类温和情形。', en: '<strong>[Beyond the book, for intuition] The semi-gradient’s price may exceed “learning imperfectly” — it can “learn to explosion”.</strong> Baird’s famous counterexample (1995): a mere 7-state MDP + linear v̂ + TD semi-gradient + off-policy training, and ‖w‖ grows at every step, racing to infinity — not slow convergence but <strong>divergence</strong>. It is precisely the early warning of the later “deadly triad”: with bootstrapping + function approximation + off-policy all switched on, the semi-gradient carries no convergence guarantee whatsoever. One piece of good news alongside: purely on-policy linear semi-gradient TD(0) does converge (to the PBE fixed point, not the truth) — the book’s theoretical results are all stated for such tame settings.' },
      { t: 'callout', variant: 'danger', zh: '<strong>误区：把 MC 目标与自举目标混着用、混着比。</strong>常见三种翻车：① 目标函数写的是 E[(v<sub>π</sub> − v̂)²]（真值版 J），更新式里却代入自举目标还自称在"最小化这个 J"——半梯度的去向是 PBE 不动点，不是 J 的极小值；② 半个 batch 用 g<sub>t</sub>、半个 batch 用 r + γv̂ 混着训——两套目标函数的梯度方向相互拉扯，收敛点没有解释；③ 拿"MC 无偏"去要求 TD、拿"TD 低方差"去要求 MC——两个算法优化的对象不同，"谁更准"的问法本身就不成立。正确姿势：先想清楚要优化哪个目标函数，再选与它一致的替换。', en: '<strong>Misconception: mixing MC targets with bootstrap targets.</strong> Three common crashes: ① the objective is written as E[(v<sub>π</sub> − v̂)²] (the true-value J) while the update silently substitutes the bootstrap target, still claiming to “minimise this J” — the semi-gradient heads to the PBE fixed point, not a minimiser of J; ② half a batch uses g<sub>t</sub> and the other half r + γv̂ — gradients of two different objectives tug against each other, and the limit point admits no interpretation; ③ demanding “MC is unbiased” of TD and “TD is low-variance” of MC — the two optimise different objects, so asking “which is more accurate” is malformed. The right posture: decide which objective you are optimising, then choose the substitution consistent with it.' },
      { t: 'widget', component: 'l8-fit-lab' },
      { t: 'steps', items: [
        { zh: '<strong>特征选择</strong>决定能学成什么样：多项式特征（阶数越高越弯）、Fourier 特征（正交性好、书上的例子用它）、Tile Coding（把状态空间铺瓷砖，激活少数几块）。特征太少欠拟合，太多过拟合。', en: '<strong>Feature choice</strong> decides what can be learned: polynomial features (higher order, curvier), Fourier features (nice orthogonality — the book\'s example), tile coding (tile the state space, activate a few tiles). Too few features underfit; too many overfit.' },
        { zh: '<strong>理论身份</strong>：TD-Linear 收敛到的不是真值 v<sub>π</sub> 本身，而是它在特征空间上的<strong>投影</strong>——最小化投影 Bellman 误差（PBE）。表格特征（one-hot）时特征完备，投影退化为真值——表格法是函数近似的特例。', en: '<strong>Theoretical identity</strong>: TD-Linear converges not to the true v<sub>π</sub> but to its <strong>projection</strong> onto the feature space — minimising the projected Bellman error (PBE). With table-lookup (one-hot) features the projection degenerates to the truth — tabular methods are a special case of function approximation.' },
      ]},
    ],
  };

  /* ---- §8.3 q 近似 ---- */
  S['l8-q-fa'] = {
    kicker: 'L8 · §8.3',
    title: { zh: 'Sarsa/Q-learning 换上函数引擎', en: 'Sarsa and Q-learning with a Function Engine' },
    blocks: [
      { t: 'p', zh: '把 7 章的表格换近似函数，机械得不能再机械：<strong>Sarsa 版</strong>把 v̂ 换成 q̂(s,a,w)：w<sub>t+1</sub> = w<sub>t</sub> + α[r + γq̂(s′,a′,w) − q̂(s,a,w)]∇q̂；<strong>Q-learning 版</strong>把目标再换成 r + γ·max<sub>a</sub>q̂(s′,a,w)（Algorithm 8.3）。配上 ε-greedy 改进步，就能学出通往目标的策略——书上用 Fourier 特征（阶数 5）在 5×5 世界跑通，总奖励和回合长度逐步收敛。', en: 'Swapping the tabular values of Chapter 7 for approximations is mechanical: the <strong>Sarsa version</strong> replaces v̂ with q̂(s,a,w): w<sub>t+1</sub> = w<sub>t</sub> + α[r + γq̂(s′,a′,w) − q̂(s,a,w)]∇q̂; the <strong>Q-learning version</strong> further swaps the target for r + γ·max<sub>a</sub>q̂(s′,a,w) (Algorithm 8.3). With an ε-greedy improvement step this learns a policy to the target — the book runs it on a 5×5 world with order-5 Fourier features, total reward and episode length converging step by step.' },
      { t: 'callout', variant: 'warn', zh: '<strong>致命三角（deadly triad）预告</strong>：自举（bootstrapping）+ 函数近似（近似目标）+ 离线训练（off-policy）三者同用，收敛性不再有保证——值可能震荡甚至爆炸。表格时代三者共处无恙；函数时代要靠技巧驯服。DQN 的两大技术就是为此而生。', en: '<strong>Preview of the deadly triad</strong>: bootstrapping + function approximation + off-policy training together void the convergence guarantees — values may oscillate or explode. In the tabular era the three coexisted peacefully; the function era needs tricks to tame them. DQN’s two techniques were born exactly for this.' },
      { t: 'formula', lbl: '两个函数引擎并排 · The two function engines side by side',
        tex: String.raw`\begin{gathered} \text{Sarsa-FA}：w \leftarrow w + \alpha\big[\htmlClass{fx-green}{r + \gamma\hat{q}(s',a',w)} - \hat{q}(s,a,w)\big]\,\nabla_w \hat{q}(s,a,w)\\[2pt] \text{Q-FA}：\;\; w \leftarrow w + \alpha\big[\htmlClass{fx-gold}{r + \gamma\!\cdot\!\max_a \hat{q}(s',a,w)} - \hat{q}(s,a,w)\big]\,\nabla_w \hat{q}(s,a,w) \end{gathered}`,
        note: '与 L7 逐字对应，仅 q 表换成 q̂(·,·,w)、"改一格"换成"沿 ∇<sub>w</sub>q̂ 推参数"——注意两个目标里的 w 都被半梯度当成了常数' },
      { t: 'steps', items: [
        { zh: '<strong>三角之一：自举</strong>。目标 r + γv̂(s′,w) 追着正在更新的 w 跑——预测改一分，目标跟着改一分，误差可以在"自己喂自己"的循环里被放大而不是被消掉。', en: '<strong>Corner one: bootstrapping.</strong> The target r + γv̂(s′,w) chases the very w being updated — the prediction shifts a little and the target shifts with it; in the “feeding oneself” loop, error can be amplified rather than cancelled.' },
        { zh: '<strong>三角之二：函数近似</strong>。更新一个 (s,a) 会牵动所有共享特征的状态——表格时代"错也只错一格"，函数时代"一处更新、处处移动"，误差有了传播的公路网。', en: '<strong>Corner two: function approximation.</strong> Updating one (s,a) drags every state sharing its features — in tabular times “an error stays in its cell”; in function times “one update moves everything”, and error gains a highway network to travel.' },
        { zh: '<strong>三角之三：off-policy</strong>。样本来自行为策略，目标函数里的分布却应是目标策略的——分布错位让 SGD 的大数定律失准（L8 §8.2 里"平稳分布加权"的那个分布对不上了）。Q-learning 的 max 恰好三样全占，所以它既是利器又是危险品。', en: '<strong>Corner three: off-policy.</strong> Samples come from the behavior policy while the objective’s distribution should be the target policy’s — the distributional mismatch throws SGD’s law of large numbers off balance (the very stationary-distribution weighting of §8.2 no longer lines up). Q-learning’s max takes all three at once, which makes it both the sharpest tool and the most dangerous one.' },
      ]},
      { t: 'callout', variant: 'danger', zh: '<strong>【书外延伸】max 还有一层"放大镜效应"。</strong>max 不但占着 off-policy 的角，还会<strong>挑中估计里的高估噪声</strong>：max 对每个动作的估计误差只取正向的一侧——哪个动作被高估得最离谱，哪个就被 max 选中并写进目标，误差经自举一代代往下传。这就是"最大化偏差"（maximization bias）。Double Q-learning 的解法是把"选动作"和"算价值"拆给两套独立估计，让高估无处藏身。它与致命三角一起，构成了"为什么函数版 Q-learning 特别难驯"的完整答案。', en: '<strong>[Beyond the book] The max also acts as an amplifier.</strong> Beyond occupying the off-policy corner, max <strong>selects the upward noise among estimates</strong>: max keeps only the positive side of each action’s estimation error — whichever action is most grossly overestimated gets picked, written into the target, and passed down through bootstrapping generation after generation. This is the “maximisation bias”. Double Q-learning’s remedy splits “choosing the action” and “evaluating it” between two independent estimates, leaving overestimation nowhere to hide. Together with the deadly triad, it completes the answer to “why functional Q-learning is especially hard to tame”.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"换引擎","en":"swap the engine","d":{"zh":"Sarsa 与 Q-learning 把表换成 q̂(s,a,w)：更新式机械照抄，配上 ε-greedy 就能学出策略。","en":"Sarsa and Q-learning swap their tables for q̂(s,a,w); the update rules carry over, and ε-greedy improvement yields a policy."}},
        {"zh":"致命三角","en":"the deadly triad","d":{"zh":"自举 + 函数近似 + off-policy 三者同用，收敛性不再有保证。","en":"Bootstrapping plus function approximation plus off-policy together: convergence guarantees no longer exist."}},
        {"zh":"三角如何发威","en":"how it bites","d":{"zh":"目标追着 w 跑、误差沿共享特征传播、分布错位让大数定律失准——误差被放大而不是消掉。","en":"Targets chase w, errors travel shared features, mismatched distributions break the law of large numbers — errors amplify instead of cancelling."}},
        {"zh":"最大化偏差","en":"maximization bias","d":{"zh":"max 挑中高估噪声并经自举传下去；Double Q-learning 把\"选动作\"与\"算价值\"拆给两套估计。","en":"max picks overestimated noise and bootstraps it onward; Double Q-learning splits choosing from evaluating across two estimates."}},
      ] } },
    ],
  };

  /* ---- §8.4 DQN ---- */
  S['l8-dqn'] = {
    kicker: 'L8 · §8.4',
    title: { zh: 'Deep Q-Learning：深度学习与 RL 会师', en: 'Deep Q-Learning: Where Deep Learning Meets RL' },
    blocks: [
      { t: 'p', zh: '把 Q-learning 的 q 表换成深度神经网络 q̂(s,a,w)，目标函数 J = E[(R + γmax<sub>a</sub>q̂(S′,a,w) − q̂(S,A,w))²]——可以看作"平方 Bellman 最优误差"。麻烦：梯度里 w 同时出现在目标和目标网络两侧——自己追自己，必抖。DQN 的<strong>两大稳定化技术</strong>：', en: 'Replace Q-learning’s q-table with a deep network q̂(s,a,w) and the objective becomes J = E[(R + γmax<sub>a</sub>q̂(S′,a,w) − q̂(S,A,w))²] — readable as the “squared Bellman optimality error”. The trouble: w appears on BOTH sides of the target — chasing oneself, guaranteed wobble. DQN’s <strong>two stabilising techniques</strong>:' },
      { t: 'steps', items: [
        { zh: '<strong>目标网络（target network）</strong>：复制一份参数 w<sub>T</sub> 专门算目标，冻结一段时间再同步——把"追自己"变成"追一个暂时不动的影子"。', en: '<strong>Target network</strong>: clone the parameters w<sub>T</sub> solely to compute targets, frozen for a while then synced — turning “chasing oneself” into “chasing a briefly frozen shadow”.' },
        { zh: '<strong>经验回放（experience replay）</strong>：把经验 (s,a,r,s′) 存进大池子，训练时随机抽小批量——打破样本间的时间相关性（i.i.d. 的近似），还能反复利用稀有经验。', en: '<strong>Experience replay</strong>: store transitions (s,a,r,s′) in a big pool and sample random mini-batches — breaking temporal correlation in the data (approximating i.i.d.) and reusing rare experiences.' },
        { zh: '<strong>奖励截断</strong>：DQN 原论文还把奖励夹到 [−1,1]，使单个网络能同时适配几十种 Atari 游戏——奖励尺度统一是跨任务泛化的隐形前提。', en: '<strong>Reward clipping</strong>: the original DQN paper also clamps rewards to [−1,1] so one network can play dozens of Atari games at once — a unified reward scale is the hidden prerequisite of cross-task generalisation.' },
      ]},
      { t: 'callout', variant: 'idea', zh: '<strong>历史地位</strong>：DQN 是最早、最成功的深度强化学习算法之一——2015 年 Nature 论文里它用同一套网络从像素级别打通了 49 款 Atari 游戏，多个游戏超过人类水平。它证明了"深度网络 + RL"不是凑热闹，而是通向通用学习的路。', en: '<strong>Historic standing</strong>: DQN is among the earliest and most successful deep RL algorithms — the 2015 Nature paper played 49 Atari games from raw pixels with one architecture, surpassing humans on several. It proved that “deep nets + RL” is a road to general learning, not a gimmick.' },
      { t: 'callout', variant: 'key', zh: '<strong>【书外延伸，助理解】两大技巧恰好对着半梯度的两个病灶。</strong>病灶一：目标里的 w 会跟着更新跑（半梯度的"移动靶"）。<strong>目标网络</strong>把靶子冻结一段——在一个同步周期内，目标 r + γmax q̂(s′,a,w<sub>T</sub>) 里的 w<sub>T</sub> 真的是常数，更新在这一周期内<strong>货真价实地变回了 SGD</strong>（至少对预测侧而言靶子不动了）。病灶二：连续交互的样本高度相关 + 分布随策略漂移（SGD 大数定律失准）。<strong>经验回放</strong>把时序打散、把新旧样本混匀——随机小批量近似独立同分布，大数定律重新上岗。两招都不改算法的"骨架"，只改"训练的节奏"——这正是工程驯服理论的典范。', en: '<strong>[Beyond the book, for intuition] The two tricks aim at exactly the two lesions of the semi-gradient.</strong> Lesion one: the w inside the target runs along with the update (the semi-gradient’s “moving target”). The <strong>target network</strong> freezes the target for a while — within one sync period, the w<sub>T</sub> in r + γmax q̂(s′,a,w<sub>T</sub>) is genuinely constant, and for that period the update <strong>honestly becomes SGD again</strong> (the target at least stands still for the prediction side). Lesion two: consecutive samples are strongly correlated and the distribution drifts with the policy (SGD’s law of large numbers loses footing). <strong>Experience replay</strong> shuffles the timeline and mixes old with new — random mini-batches approximate i.i.d., and the law of large numbers returns to duty. Neither trick alters the algorithm’s skeleton; both only retune “the rhythm of training” — engineering taming theory at its finest.' },
      { t: 'p', zh: '<strong>别误会：DQN 没有摘掉三角的任何一角。</strong>目标网络只是"分期冻结"（自举还在，只是每 C 步才换一次靶子）；经验回放只是"逼近 i.i.d."（样本仍然来自会过期的旧策略，只是被搅匀了）。致命三角在 DQN 里三样全占——收敛保证依然缺席，实验里也确实常见价值高估与训练崩溃。所以工程实践还有一整套"没有定理、只有纪律"的配方：小步长、梯度裁剪、奖励截断、定期同步、随时盯住 q 值的量级。<strong>理论缺席的地方，纪律补位</strong>——这也是读深度 RL 论文时方法节越写越长的原因。', en: '<strong>Do not misread: DQN removes none of the triad’s corners.</strong> The target network only “freezes in instalments” (bootstrapping remains; the target just switches every C steps); experience replay only “approaches i.i.d.” (samples still come from an aging policy, merely stirred). DQN holds all three corners at once — convergence guarantees remain absent, and value overestimation and training collapse are indeed common in experiments. Hence a whole recipe of “no theorems, only discipline” in practice: small step sizes, gradient clipping, reward clipping, periodic syncing, and a constant eye on q-value magnitudes. <strong>Where theory is absent, discipline stands in</strong> — one reason the method sections of deep RL papers keep growing longer.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"深度网络当 q 表","en":"a deep net as q","d":{"zh":"q̂ 换成神经网络，目标函数是\"平方 Bellman 最优误差\"。","en":"q̂ becomes a neural network; the objective is a squared Bellman optimality error."}},
        {"zh":"目标网络","en":"target network","d":{"zh":"复制参数 wT 冻结一段时间再同步：把\"追自己\"变成\"追一个暂时不动的影子\"。","en":"Copy weights into wT, freeze a while, then sync: chase a still shadow instead of yourself."}},
        {"zh":"经验回放","en":"experience replay","d":{"zh":"经验存池、随机抽小批量：打破时间相关性，还能反复利用稀有经验。","en":"Store experiences, sample random minibatches: break temporal correlation and reuse rare experience."}},
        {"zh":"三角还在","en":"the triad remains","d":{"zh":"两招只改训练节奏，三角一角未摘；理论缺席的地方，纪律补位。","en":"Both tricks only change training rhythm; no triad corner is removed — where theory is missing, discipline fills in."}},
      ] } },
    ],
  };

  /* ---- §8.5 总结 ---- */
  S['l8-summary'] = {
    kicker: 'L8 · §8.5',
    title: { zh: '本章总结：近似即优化', en: 'Chapter Summary: Approximation Is Optimisation' },
    blocks: [
      { t: 'p', zh: '本章把 TD 学习从表格搬到函数，关键是换一副眼镜：<strong>价值估计不再是一组数，而是一个优化问题</strong>——目标函数（平方误差/Bellman 误差/投影 Bellman 误差）+ 优化器（SGD 家族）。特征决定上限，优化器决定下限；线性情形理解透了，非线性（神经网络）只是换更强的 v̂。值函数近似的终极意义：让神经网络得以与强化学习合体。', en: 'This chapter moved TD learning from tables to functions, and the key is a new pair of glasses: <strong>value estimation is no longer a collection of numbers but an optimisation problem</strong> — an objective (squared error / Bellman error / projected Bellman error) plus an optimiser (the SGD family). Features set the ceiling; the optimiser sets the floor; once the linear case is fully understood, the nonlinear (neural network) case is just a stronger v̂. The ultimate meaning of value function approximation: it marries neural networks to reinforcement learning.' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：一直以来我们近似的是<strong>价值</strong>，策略只是"从价值里 argmax"。第 9 章调转枪口：<strong>直接用函数近似策略本身 π(a|s,θ)</strong>，用梯度上升直接优化策略——策略梯度方法，深度 RL 的另一根支柱。', en: 'Next lecture teaser: so far we approximated <strong>values</strong> and treated the policy as an argmax over them. Chapter 9 turns the gun around: <strong>approximate the policy itself with a function π(a|s,θ)</strong> and ascend its gradient directly — policy gradient methods, the other pillar of deep RL.' },
      { t: 'steps', items: [
        { zh: '<strong>有收敛保证的地带</strong>：表格法全部结论（L7 定理）；on-policy + 线性 + 半梯度 TD → 收敛到 PBE 不动点；MC 替换 + 任意可微 v̂ → 真 SGD（线性全局最优、非线性局部最优）。', en: '<strong>Where guarantees hold</strong>: all tabular conclusions (L7 theorems); on-policy + linear + semi-gradient TD → convergence to the PBE fixed point; MC substitution + any differentiable v̂ → true SGD (global optimum if linear, local otherwise).' },
        { zh: '<strong>没有保证的地带</strong>：致命三角全占（自举 + 函数近似 + off-policy）——Baird 反例证明可以发散；DQN 带着两大纪律闯入此地并活了下来，但那是工程的胜利，不是定理的胜利。', en: '<strong>Where guarantees vanish</strong>: the full deadly triad (bootstrapping + approximation + off-policy) — Baird’s counterexample proves divergence is possible; DQN survived this territory with its two disciplines, an engineering victory, not a theorem’s.' },
        { zh: '<strong>读论文的姿势</strong>：看到新算法先做三连问——"自举吗？近似吗？off-policy 吗？"——占两角基本稳妥，三角全占就看它带什么纪律（冻结？回放？裁剪？信任域？）。', en: '<strong>How to read papers</strong>: upon meeting a new algorithm, ask three questions — “Does it bootstrap? Approximate? Go off-policy?” — two corners is usually safe; with all three, check what discipline it carries (freezing? replay? clipping? trust regions?).' },
      ]},
      { t: 'callout', variant: 'done', zh: '<strong>离场自检。</strong>① 能列出状态空间爆炸的三笔账并说出函数近似如何逐笔清掉；② 能解释 one-hot 特征下函数近似为何精确退回表格法；③ 能说出"半梯度"的"半"指什么、扔掉的链式项是哪一项、代价是什么；④ 能分辨 MC 替换（真 SGD）与 TD 替换（半梯度、PBE 不动点）在去向上的差别；⑤ 能逐角说出致命三角各自贡献哪种不稳定，以及 DQN 两招分别治哪个病灶。五题全过，第 9 章见。', en: '<strong>Exit self-check.</strong> ① List the three bills of the state-space explosion and how function approximation pays each; ② explain why one-hot features make approximation degenerate exactly back to tables; ③ say what the “semi” in semi-gradient refers to, which chain-rule term is discarded, and at what cost; ④ distinguish the destinations of MC substitution (true SGD) versus TD substitution (semi-gradient, PBE fixed point); ⑤ name the instability each corner of the deadly triad contributes, and which lesion each DQN technique treats. Pass all five, and see you in Chapter 9.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"近似即优化","en":"approx = optimisation","d":{"zh":"价值估计变成优化问题：目标函数（平方/Bellman/投影 Bellman 误差）+ 优化器（SGD 家族）。","en":"Value estimation becomes optimisation: an objective (squared / Bellman / projected Bellman error) plus an SGD-family optimiser."}},
        {"zh":"特征与优化器","en":"features & optimisers","d":{"zh":"特征决定上限，优化器决定下限；线性情形理解透，非线性只是换更强的 v̂。","en":"Features set the ceiling, optimisers the floor; master the linear case and nonlinear is just a stronger v̂."}},
        {"zh":"保证地图","en":"the guarantee map","d":{"zh":"on-policy + 线性 + 半梯度 TD 收敛到 PBE 不动点；致命三角全占则没有保证（Baird 反例）。","en":"On-policy linear semi-gradient TD converges to the PBE fixed point; the full deadly triad has no guarantee (Baird's counterexample)."}},
        {"zh":"读论文三连问","en":"three questions","d":{"zh":"自举吗？近似吗？off-policy 吗？——占两角基本稳妥，全占就看它带什么纪律。","en":"Bootstrapping? Approximation? Off-policy? — two corners are fairly safe; all three, check what discipline it carries."}},
      ] } },
    ],
  };

  /* ---- L8 长推理 ---- */
  S['l8-reasoning'] = {
    kicker: 'L8 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：表格的黄昏', en: 'The Long Coherent Reasoning: The Twilight of Tables' },
    blocks: [
      { t: 'p', zh: '本章推理链：表格无泛化、存不下 → 参数化函数 + 特征 → 近似即最小二乘 → 真值未知，MC/TD 目标顶替 → TD-Linear = SGD on Bellman 方程 → 收敛到投影 → Sarsa/Q-learning 换引擎 → 致命三角现形 → 目标网络 + 经验回放驯服之 → DQN 会师深度学习。', en: 'This chapter’s spine: tables neither generalise nor scale → parameterise with features → approximation as least squares → truth unknown, substitute MC/TD targets → TD-Linear = SGD on the Bellman equation → converges to a projection → Sarsa/Q-learning swap engines → the deadly triad appears → target network + experience replay tame it → DQN marries deep learning.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l8' } },
    ],
  };

  /* ---- L8 代码 ---- */
  S['l8-code'] = {
    kicker: 'L8 · 动手 · Hands-on',
    title: { zh: '代码精讲：TD-Linear 与 DQN 骨架', en: 'Code Walkthrough: TD-Linear and the DQN Skeleton' },
    blocks: [
      { t: 'p', zh: 'TD-Linear 十行可见全貌；DQN 骨架用伪代码点出目标网络与回放池的落点——参数 w<sub>T</sub> 出现在目标里但梯度只流向 w，这就是"冻结"的代码含义。', en: 'TD-Linear shows its whole face in ten lines; the DQN skeleton uses pseudocode to mark exactly where the target network and the replay pool sit — the parameter w<sub>T</sub> appears in the target while gradients flow only into w: that is what “freezing” means in code.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l8' } },
      { t: 'widget', component: 'notebook-bridge', props: { nb: 'nb5' } },
    ],
  };

  /* ---- L8 Q&A ---- */
  S['l8-qa'] = {
    kicker: 'L8 · §8.6',
    title: { zh: '问答：表格 vs 函数', en: 'Q&A: Tables vs Functions' },
    blocks: [
      { t: 'p', zh: '检索方式、更新方式、泛化能力、平稳分布的角色——本章问答聚焦"两种表示的本质差异"。', en: 'Retrieval, update, generalisation, and the role of the stationary distribution — the Q&As focus on the essential differences between the two representations.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l8' } },
      { t: 'widget', component: 'fill-lab', props: { source: 'l8' } },
      { t: 'widget', component: 'derivation-lab', props: { source: 'l8' } },
    ],
  };

  /* ═══ L8 长推理链 ═══ */
  D.reasoningSets['l8'] = [
    { link: '起点 · Start',
      title: { zh: '表格的天花板', en: 'The ceiling of tables' },
      zh: '表格法里每个 (s,a) 一格：格子互相不认识（无泛化）、状态一多就存不下（围棋 10^170）、学不到没见过的局面。第一条铁律：表示决定学习能力的上限。',
      en: 'In tabular methods each (s,a) is one cell: cells are strangers (no generalisation), huge spaces cannot be stored (Go 10^170), unseen situations are never learned. Iron law #1: representation caps learning.',
      question: '什么东西既能压缩状态又能互相举一反三？' },
    { link: '参数化 · Parameterise',
      title: { zh: 'v̂(s,w) = φᵀ(s)w：把价值变成函数', en: 'v̂(s,w) = φᵀ(s)w: values become a function' },
      zh: '特征 φ(s) 把状态编码成向量，w 是参数。更新 w 会同时影响所有状态的价值——s₃ 的经验顺带修正 s₂（泛化来了）。拟合问题就是最小二乘：J = ‖Φw − v_π‖²。',
      en: 'Features φ(s) encode states as vectors; w is the parameter. Updating w shifts the values of ALL states at once — s₃’s experience corrects s₂ too (generalisation). Fitting becomes least squares: J = ‖Φw − v_π‖².',
      question: '真值 v_π 从哪来？' },
    { link: '换目标 · Substitute',
      title: { zh: '真值未知：MC 或 TD 目标顶替', en: 'Truth unknown: substitute MC or TD targets' },
      zh: 'SGD 式 w ← w + α(v_π(s) − v̂)∇v̂ 里的真值换成 MC 回报 g_t（无偏高方差）或 TD 目标 r + γv̂(s′,w)（自举、低方差）——后者就是 TD-Linear。L6 的 SGD 引擎与 L7 的自举目标在此会师。',
      en: 'In the SGD step w ← w + α(v_π(s) − v̂)∇v̂, substitute the truth with the MC return g_t (unbiased, high variance) or the TD target r + γv̂(s′,w) (bootstrapped, low variance) — the latter is TD-Linear. L6’s SGD engine and L7’s bootstrap target meet here.',
      question: '它收敛到真值吗？' },
    { link: '投影 · Projection',
      title: { zh: '收敛到投影：特征决定上限', en: 'It converges to a projection: features set the ceiling' },
      zh: 'TD-Linear 最小化投影 Bellman 误差（PBE）——解是 v_π 在特征空间上的正交投影。特征空间表达不了的部分，永远学不到。one-hot 特征恢复表格情形：表格法是函数近似的特例。',
      en: 'TD-Linear minimises the projected Bellman error (PBE) — the solution is the orthogonal projection of v_π onto the feature space. What the features cannot express can never be learned. One-hot features recover the tabular case: tables are a special case of function approximation.',
      question: '把 q 表也换掉，最优性还能保证吗？' },
    { link: '危险区 · The triad',
      title: { zh: '致命三角：自举 + 近似 + off-policy', en: 'The deadly triad: bootstrap + approximation + off-policy' },
      zh: 'Q-learning 的函数版三样全占——目标追着正在变的函数跑，值可能震荡爆炸。DQN 的两剂药：目标网络（冻结影子让梯度有处可依）+ 经验回放（打散时序相关性逼近 i.i.d.）。深度 RL 从此起步。',
      en: 'The functional Q-learning takes all three at once — the target chases a moving function, and values may oscillate or explode. DQN’s two remedies: a target network (a frozen shadow for the gradient to lean on) + experience replay (shuffling away temporal correlation toward i.i.d.). Deep RL starts here.',
      question: null },
  ];

  /* ═══ L8 代码块 ═══ */
  const srcTDLinear = `import numpy as np

def fourier_features(s, n_states, order=3):
    """Fourier feature vector phi(s) (the book's Eq. 8.18 family).
    s in [0,1] after normalising state indices."""
    s_norm = s / (n_states - 1)
    return np.cos(np.pi * np.arange(order + 1) * s_norm)

def td_linear(env, policy, episodes=500, gamma=0.9, alpha=0.01, order=3):
    """TD(0) with linear function approximation (Eq. 8.13):
       w <- w + alpha * [r + gamma*v_hat(s') - v_hat(s)] * phi(s)
    v_hat(s,w) = phi(s)^T w   =>   grad v_hat = phi(s)."""
    n, dim = env.num_states, order + 1
    w = np.zeros(dim)
    for ep in range(episodes):
        s = env.reset()
        phi_s = fourier_features(s, n, order)
        done = False
        while not done:
            a = np.random.choice(len(policy[s]), p=policy[s])
            s2, r, done, _ = env.step(a)
            phi_s2 = fourier_features(s2, n, order)
            target = r + gamma * phi_s2 @ w * (not done)
            delta = target - phi_s @ w              # TD error (same as tabular!)
            w += alpha * delta * phi_s              # gradient = phi(s) when linear
            s, phi_s = s2, phi_s2
    return w

def v_hat_all(env, w, order=3):
    return np.array([fourier_features(s, env.num_states, order) @ w
                     for s in range(env.num_states)])`;

  const srcDQN = `# Deep Q-learning skeleton (Algorithm 8.3 + DQN tricks, pseudocode-level)
replay = ReplayBuffer(capacity=100_000)      # experience replay pool
q_main  = QNetwork(state_dim, n_actions)     # hat q(s, a, w)
q_target = QNetwork(state_dim, n_actions)    # hat q(s, a, w_T) -- frozen shadow
q_target.load_state_dict(q_main.state_dict())

for episode in range(N):
    s = env.reset()
    for t in range(max_steps):
        a = eps_greedy(q_main, s, eps)               # behavior: explore
        s2, r, done, _ = env.step(a)
        replay.store((s, a, r, s2, done))            # remember the transition
        s = s2
        if done: break

        # ---- learn from a random mini-batch (breaks temporal correlation) ----
        batch = replay.sample(m=32)
        # targets use the FROZEN network: w_T appears here, no gradient flows to it
        y = r + gamma * q_target(s2).max() * (1 - done)
        loss = (y - q_main(s, a)) ** 2               # squared Bellman optimality error
        q_main.backward_and_step(loss)               # gradient flows into w only

        # ---- periodic sync: the shadow catches up ----
        if global_step % C == 0:
            q_target.load_state_dict(q_main.state_dict())`;

  D.codeFileSets['l8'] = [
    {
      id: 'l8-tdl', file: 'td_linear.py — 线性 TD', tab: '① TD-Linear',
      intro: { zh: '把 L7 的表格 TD 换成线性函数近似后，代码只多了一步：算特征 φ(s)。<code class="inline">w += alpha * delta * phi_s</code> 这一行 = 式 (8.13)：delta 还是那个 TD 误差，"更新哪张表"变成了"更新参数向量 w"。Fourier 特征把状态编号映射成余弦波——相邻状态共享大部分波形，这就是泛化的物理来源。', en: 'Swapping L7’s tabular TD for linear approximation adds exactly one step: computing the features φ(s). The line <code class="inline">w += alpha * delta * phi_s</code> IS Eq. (8.13): delta is still the TD error, and “which cell to update” becomes “which direction to push w”. Fourier features map state indices to cosine waves — neighbouring states share most of the wave, the physical origin of generalisation.' },
      code: srcTDLinear,
      notes: [
        { lines: [11, 11], tag: 'fourier', zh: '<code class="inline">cos(π·k·s_norm)</code> 对 k = 0..order 生成一排余弦波：k=0 是常数项、k 越大频率越高。低频捕捉大势、高频捕捉细节——和信号分解一个思路。', en: '<code class="inline">cos(π·k·s_norm)</code> over k = 0..order lays out a bank of cosine waves: k=0 is the constant term, larger k oscillate faster. Low frequencies capture the trend, high ones the detail — the same idea as signal decomposition.' },
        { lines: [24, 24], tag: 'delta same', zh: 'TD 误差 <code class="inline">target − v̂(s)</code> 与表格版一模一样——变的只是"误差怎么被消化"：表格版改一格，线性版沿特征方向推参数。理解这一点，第 7 章到第 8 章就是平滑过渡。', en: 'The TD error <code class="inline">target − v̂(s)</code> is identical to the tabular version — only how the error is absorbed changes: tables edit one cell; linear functions push the parameters along the feature direction. Seen this way, Chapter 7 flows into Chapter 8 smoothly.' },
        { lines: [22, 23], tag: 'bootstrapped', zh: '<code class="inline">phi_s2 @ w</code> 是自举：下一状态的价值用当前参数现算——所以叫 semi-gradient（目标里的 w 没被求导）。这是致命三角的第一角。', en: '<code class="inline">phi_s2 @ w</code> is bootstrapping: the next state’s value is computed on the fly with current parameters — hence “semi-gradient” (no gradient through the target’s w). That is corner #1 of the deadly triad.' },
      ],
    },
    {
      id: 'l8-dqn-code', file: 'dqn_skeleton.py — DQN 骨架', tab: '② DQN 骨架',
      intro: { zh: 'DQN 骨架点出三个落点：回放池在哪里入样、目标网络在哪里出目标、梯度往哪流。伪代码里 <code class="inline">y = r + γ·q_target(s2).max()</code> 的 <code class="inline">q_target</code> 参数被冻结——梯度只流进 <code class="inline">q_main</code>，"追自己"变成"追影子"。', en: 'The DQN skeleton marks three spots: where the replay pool ingests samples, where the target network produces targets, and where gradients flow. In the pseudocode, <code class="inline">q_target</code> inside <code class="inline">y = r + γ·q_target(s2).max()</code> is frozen — gradients flow only into <code class="inline">q_main</code>: “chasing oneself” becomes “chasing a shadow”.' },
      code: srcDQN,
      notes: [
        { lines: [16, 17], tag: 'replay ★', zh: '经验回放一举两得：① 随机抽样打散相邻转移的相关性（逼近 i.i.d.，喂饱 SGD 的大数定律）；② 稀有宝贵经验（比如罕见死亡）可被反复重放学习。', en: 'Experience replay kills two birds: ① random sampling breaks correlations between adjacent transitions (approaching i.i.d., feeding SGD’s law of large numbers); ② rare precious experiences (say, an unusual death) can be replayed and learned again.' },
        { lines: [19, 20], tag: 'frozen target ★', zh: '<strong>DQN 的灵魂两行</strong>：y 用 w_T 算、loss 对 w 求导——目标暂时不动，学习才有一个稳定的靶子。每 C 步同步一次 w_T ← w：影子周期性追上本体。不冻结 = 自己追自己 = 追光（永远追不上）。', en: '<strong>The soul of DQN in two lines</strong>: y is computed with w_T while the loss differentiates w — the target stands still for a while, giving learning a stable mark. Every C steps sync w_T ← w: the shadow periodically catches up. Without freezing, you chase yourself — and never catch up.' },
        { lines: [12, 12], tag: 'eps-greedy', zh: '行为策略仍是 ε-greedy——致命三角的 off-policy 角在这里：训练样本由探索性策略产生，学到的却是贪心最优 q。', en: 'The behavior policy is still ε-greedy — here sits the off-policy corner of the deadly triad: samples come from an exploratory policy while the learned object is the greedy optimal q.' },
      ],
    },
  ];

  /* ═══ L8 Q&A ═══ */
  D.qaSets['l8'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '表格法与函数近似法的本质区别？', en: 'Tabular vs function approximation — the essential difference?' },
      a: { zh: '两处：① <strong>检索</strong>——表格直接读格子，函数要算前向；② <strong>更新</strong>——表格改一个格子，函数更新参数间接改变许多状态的价值。前者换来简单，后者换来泛化。', en: 'Two spots: ① <strong>retrieval</strong> — a table is read directly; a function computes a forward pass. ② <strong>update</strong> — a table rewrites one cell; a function updates parameters, indirectly changing many states. The first buys simplicity; the second buys generalisation.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '函数近似比表格强在哪？', en: 'What advantages does function approximation have over tables?' },
      a: { zh: '两条：① <strong>存储</strong>——存 |S| 个数 vs 存一个低维参数向量；② <strong>泛化</strong>——表格改一处只动一处，函数改参数会顺带修正相似状态的价值。学过 s₃ 就懂 s₂——经验被复用。', en: 'Two: ① <strong>storage</strong> — |S| numbers vs a low-dimensional parameter vector; ② <strong>generalisation</strong> — tables change one cell per update, functions nudge the values of similar states together. Learning s₃ teaches you s₂ — experience is reused.' } },
    { tag: 'Q3 · 补充', q: { zh: '为什么目标函数里 S 的分布那么重要（平稳分布）？', en: 'Why does the distribution of S in the objective matter (stationary distribution)?' },
      a: { zh: '平方误差 J(w) = E[(v_π(S) − v̂(S,w))²] 是加权平均——分布决定"哪些状态的误差更在乎"。特征有限时不可能处处拟合好，平稳分布（按访问频率）给出最合理的取舍：常去的状态拟合得更准。', en: 'The squared error J(w) = E[(v_π(S) − v̂(S,w))²] is a weighted average — the distribution decides “whose errors matter more”. With limited features you cannot fit everywhere; the stationary distribution (visit frequencies) makes the most sensible trade-off: frequently visited states get fitted better.' } },
    { tag: 'Q4 · 补充', q: { zh: 'TD-Linear 学到的是真值 v_π 吗？', en: 'Does TD-Linear learn the true v_π?' },
      a: { zh: '一般不是。它收敛到特征空间上的<strong>投影</strong>——最小化投影 Bellman 误差。特征表达不了的部分被永久舍弃；只有特征完备（如 one-hot 表格特征）时投影才等于真值。这是"特征决定上限"的精确含义。', en: 'Usually not. It converges to the <strong>projection</strong> onto the feature space — minimising the projected Bellman error. Whatever the features cannot express is permanently lost; only with complete features (e.g. one-hot table features) does the projection equal the truth. That is the precise meaning of “features set the ceiling”.' } },
    { tag: 'Q5 · 补充', q: { zh: 'DQN 的两个技巧分别在治什么病？', en: 'Which illness does each DQN trick cure?' },
      a: { zh: '目标网络治"自己追自己"——目标和被优化对象共享参数会让目标不断移动，冻结副本给梯度一个稳定靶子。经验回放治"样本相关"——连续决策的样本高度相关，violates i.i.d.，随机抽批打散它。两药合用驯服致命三角。', en: 'The target network cures “chasing oneself” — target and optimised object sharing parameters makes the target move; a frozen copy gives the gradient a stable mark. Experience replay cures “correlated samples” — sequential decisions are strongly correlated, violating i.i.d.; random mini-batches shuffle it away. Together they tame the deadly triad.' } },
  ];


  /* ═══ L8 知识填充 ═══ */
  D.fillSets = D.fillSets || {};   // 兜底：data.js 尚未预置 fillSets 容器（与 reasoningSets/qaSets 同级的懒加载注册）
  D.fillSets['l8'] = {
    title: { zh: '第八讲 · 知识填充', en: 'Lecture 8 · Knowledge Fill-in' },
    items: [
      { kind: 'choice',
        tag: { zh: '致命三角', en: 'the deadly triad' },
        stem: { zh: '自举、函数近似、off-policy——三件套里，[[1]] 时收敛保证才彻底缺席；任意两角组合都还有定理压阵。',
                en: 'Bootstrapping, function approximation, off-policy — convergence guarantees vanish only when [[1]]; any two corners still have theorems standing behind them.' },
        blanks: [
          { choices: {
              zh: ['三者全部同开', '任意两者组合', '仅 off-policy 单开'],
              en: ['all three run together', 'any two of the three', 'off-policy alone'],
            }, answer: 0,
            why: { zh: '两角组合各有保底：on-policy 线性半梯度 TD（自举+近似）收敛到 PBE 不动点；表格 Q-learning（自举+off-policy）收敛到 q*。三角全占时"目标追着 w 跑、误差沿共享特征传播、分布错位"三病齐发——Baird 反例证明 7 个状态的线性小问题都能发散。', en: 'Any two corners have a safety net: on-policy linear semi-gradient TD (bootstrap + approximation) converges to the PBE fixed point; tabular Q-learning (bootstrap + off-policy) converges to q*. With all three, “the target chases w, errors travel shared features, distributions mismatch” strike at once — Baird’s counterexample diverges with a mere 7-state linear problem.' } },
        ] },
      { kind: 'choice',
        tag: { zh: '书外延伸·分期冻结', en: 'beyond the book · frozen in instalments' },
        stem: { zh: '“DQN 挂上目标网络和经验回放，致命三角就摘掉一角了”——对这个说法的正确评价是 [[1]]。',
                en: '“With its target network and experience replay, DQN removes one corner of the deadly triad” — the correct verdict is [[1]].' },
        blanks: [
          { choices: {
              zh: ['两招只改训练节奏：目标网络分期冻结——自举还在，只是每 C 步换一次靶；经验回放只是逼近 i.i.d.——样本仍来自会过期的 ε-greedy 旧策略。三角全占，保证依然缺席',
                   '目标网络用冻结副本 w_T 算目标，自举从此消除',
                   '经验回放随机抽批、混匀新旧样本，离策略从此消除',
                   '两招让更新变回真 SGD，收敛从此有了定理保证'],
              en: ['both tricks only retune the rhythm: the target network freezes in instalments — bootstrapping remains, the mark merely switches every C steps; experience replay only approaches i.i.d. — samples still come from the aging ε-greedy behavior policy. The triad holds all three corners; guarantees stay absent',
                   'the target network computes targets with the frozen copy w_T, so bootstrapping is eliminated',
                   'experience replay shuffles and randomly samples, so off-policy is eliminated',
                   'both tricks turn the update back into true SGD, so convergence is guaranteed by theorem'],
            }, answer: 0,
            why: { zh: '目标 r + γ·max q̂(s′,a;w_T) 仍是"用网络现算的下一步价值"——自举一分未少，w_T 只是被冻结、每 C 步才同步一次。回放池里的 (s,a,r,s′) 全部由 ε-greedy 行为策略产生，目标分布照样错位——离策略角原封不动。DQN 的胜利是"纪律补位"（小步长、梯度裁剪、奖励截断到 [−1,1]、盯住 q 值量级），不是定理回归。', en: 'The target r + γ·max q̂(s′,a;w_T) is still a network-computed next-step value — bootstrapping is untouched; w_T is merely frozen and synced every C steps. Every (s,a,r,s′) in the pool was produced by the ε-greedy behavior policy, so the distribution mismatch stays — the off-policy corner is intact. DQN’s win is “discipline standing in for theory” (small step sizes, gradient clipping, reward clipping to [−1,1], watching q magnitudes), not theorems returning.' } },
        ] },
      { kind: 'choice',
        tag: { zh: '书外延伸·最大化偏差', en: 'beyond the book · maximization bias' },
        stem: { zh: '各动作的估计都是"真值 + 零均值噪声"时，对它们逐个取 max 得到的目标会 [[1]]——高估误差经自举 r + γ·max q̂ 一代代往下传，这就是最大化偏差（maximization bias）。',
                en: 'When every action’s estimate is “truth + zero-mean noise”, taking the max over actions yields a target that is systematically [[1]] — the upward error is bootstrapped onward through r + γ·max q̂, generation after generation: the maximization bias.' },
        blanks: [
          { choices: {
              zh: ['偏高——max 只挑上偏一侧的噪声：哪个动作被高估得最狠，哪个就入选目标',
                   '无偏——正负噪声在 max 里相互抵消',
                   '偏低——max 压平了极端值'],
              en: ['biased upward — max keeps only the upward side of the noise: whichever action is most overestimated gets into the target',
                   'unbiased — positive and negative noise cancel inside the max',
                   'biased downward — max flattens the extremes'],
            }, answer: 0,
            why: { zh: '把估计写成 q̂ = q + 噪声：max 比较的是总数，噪声为正的动作更容易冒头——动作数 n 越大、噪声方差越大，被选中的上偏越猛（n 个噪声里最大的那个几乎必为正）。上偏写进目标后又成为下一轮的"真值"，自举把它传下去。Double Q-learning 把"选动作"和"算价值"拆给两套独立估计，让高估无处藏身。', en: 'Write each estimate as q̂ = q + noise: the max compares totals, so actions with positive noise stick out — with n actions the largest of n noises is almost surely positive, and more actions or more variance mean a fiercer upward bias. The bias enters the target and becomes the next round’s “truth”. Double Q-learning splits “choosing the action” from “evaluating it” across two independent estimates, leaving overestimation nowhere to hide.' } },
        ] },
      { kind: 'code',
        tag: { zh: 'code · DQN 目标', en: 'code · the DQN target' },
        stem: { zh: 'DQN 损失 (y − q̂(s,a;w))² 的目标 y = r + γ·max q̂(s′,·;[[1]])——max 跑在哪套参数上，决定"靶子"多久动一次、梯度往哪流。',
                en: 'In the DQN loss (y − q̂(s,a;w))², the target is y = r + γ·max q̂(s′,·;[[1]]) — which parameters the max runs on decides how often the mark moves and where gradients flow.' },
        code: { zh: 'y = r + γ · max q̂(s′, ·; [[1]])　# 损失 (y − q̂(s,a;w))² 的梯度只沿预测侧回传',
                en: 'y = r + γ · max q̂(s′, ·; [[1]])　# the gradient of (y − q̂(s,a;w))² flows into the prediction side only' },
        blanks: [
          { choices: {
              zh: ['w_T（目标网参数）', 'w（在线参数）', 'θ（策略参数）'],
              en: ['w_T (target-net params)', 'w (online params)', 'θ (policy params)'],
            }, answer: 0,
            why: { zh: 'max 用冻结副本 w_T：一个同步周期内 y 是常数，更新退回"靶子不动的 SGD"，梯度只流向 w。若填 w——目标随每次更新一起移动，自己追自己，抖动无法收敛；θ 是第 9 章策略梯度 π(a|s,θ) 的参数，与本式无关。', en: 'The max runs on the frozen copy w_T: within one sync period y is a constant and the update honestly becomes SGD on a still mark, gradients flowing into w only. Fill in w and the target moves with every update — chasing oneself, wobbling without convergence; θ belongs to Chapter 9’s policy π(a|s,θ), irrelevant here.' } },
        ] },
      { kind: 'number',
        tag: { zh: '书外延伸·Baird 反例', en: 'beyond the book · Baird’s counterexample' },
        stem: { zh: '发散反例：Baird 在 [[1]] 年用一个仅 [[2]] 个状态的小 MDP 证明——线性 v̂ + TD 半梯度 + off-policy，‖w‖ 每步增大直冲无穷。三角全占，连"线性"都救不了。',
                en: 'The divergence counterexample: in [[1]] Baird used a tiny MDP with only [[2]] states to show that linear v̂ + TD semi-gradient + off-policy sends ‖w‖ growing every step toward infinity. The full triad defeats even linearity.' },
        blanks: [
          { answer: 1995, tol: 0.5,
            hint: { zh: '20 世纪 90 年代中期', en: 'mid-1990s' },
            why: { zh: '反例发表于 1995 年。它把"三角会爆炸"从担忧变成板上钉钉的事实：近似器是线性的也照样发散——病灶在 off-policy 的分布错位，不在模型大小。', en: 'The counterexample was published in 1995. It turns “the triad can explode” from a worry into a settled fact: even a linear approximator diverges — the lesion is the off-policy distribution mismatch, not model size.' } },
          { answer: 7, tol: 0.5,
            hint: { zh: '个位数——比 5×5 网格世界还小', en: 'single digits — smaller than the 5×5 grid world' },
            why: { zh: '仅 7 个状态：规模不是挡箭牌，发散源于"自举+近似+off-policy"的结构本身——这也是"读论文三连问"的出处。', en: 'Only 7 states: scale is no shield; divergence comes from the structure of bootstrap + approximation + off-policy itself — the origin of this lecture’s “three questions for any new algorithm”.' } },
        ] },
      { kind: 'number',
        tag: { zh: '实验台 · 拟合数字', en: 'lab · fitting numbers' },
        stem: { zh: '§8.2 的拟合实验台把 [[1]] 个状态的真值驼峰交给 v̂(s,w) = φᵀ(s)w 现场学：把特征阶数 order 拉到 0，参数维度 dim = [[2]]——φ 只剩常数项，v̂ 退化成一条水平线，欠拟合到连驼峰的影子都没有。',
                en: 'The §8.2 fitting lab hands the true-value hump of [[1]] states to v̂(s,w) = φᵀ(s)w to learn on the spot: drag the feature order to 0 and the parameter count dim = [[2]] — φ keeps only the constant term, v̂ flattens into a horizontal line, too crude to even hint at the hump.' },
        blanks: [
          { answer: 9, tol: 0.5,
            hint: { zh: '个位数——就是图上金点（各状态真值）的个数', en: 'single digits — the number of gold dots (true values) on the chart' },
            why: { zh: '实验台 nS = 9：金点 = 各状态真值，蓝点 = v̂ 的当前读数。状态取得少是刻意的——每个点的拟合过程都看得见。', en: 'The lab runs nS = 9 states: gold dots are true values, blue dots the current v̂ readings. Few states are deliberate — you can watch every point being fitted.' } },
          { answer: 1, tol: 0.5,
            hint: { zh: 'dim = order + 1', en: 'dim = order + 1' },
            why: { zh: 'dim = order + 1：order=0 时 w 只剩 1 个分量，v̂(s) = w₀ 是水平线——表达与泛化双双归零，"特征决定上限"的最小演示。order 拉到 6 则 dim = 7，蓝线逐渐贴住金线。', en: 'dim = order + 1: at order 0, w has a single component and v̂(s) = w₀ is a horizontal line — expression and generalisation both gone, the minimal demo of “features set the ceiling”. At order 6, dim = 7 and the blue curve hugs the gold one.' } },
        ] },
      { kind: 'number',
        tag: { zh: '代码 · 默认超参', en: 'code · default hyperparameters' },
        stem: { zh: '两份参考代码里的数字：TD-Linear 默认 γ = [[1]]、α = [[2]]（Fourier order = 3 ⟹ 参数维度 4）；DQN 骨架每个小批量从回放池（容量 100,000）里随机抽 m = [[3]] 条经验。',
                en: 'Numbers from the two reference codes: TD-Linear defaults to γ = [[1]], α = [[2]] (Fourier order = 3, so 4 parameters); the DQN skeleton samples m = [[3]] experiences per mini-batch from a pool of capacity 100,000.' },
        blanks: [
          { answer: 0.9, tol: 0.01,
            hint: { zh: '0 与 1 之间——一步自举能"看见"的折扣视野', en: 'between 0 and 1 — the discounted horizon one bootstrap step can see' },
            why: { zh: 'td_linear 默认 gamma=0.9：与 L7 网格世界同一量级，γ<1 保证自举目标有界。', en: 'td_linear defaults to gamma=0.9 — the same league as L7’s grid world; γ<1 keeps the bootstrapped target bounded.' } },
          { answer: 0.01, tol: 0.001,
            hint: { zh: '百分之一量级的步长', en: 'a step size on the order of one percent' },
            why: { zh: '默认 alpha=0.01：归一化 LMS 下小步长换稳定——函数近似的更新牵一发而动全身，步长不敢开大。', en: 'The default alpha=0.01: small steps buy stability under normalized LMS — one function-approximation update moves everything, so steps stay timid.' } },
          { answer: 32, tol: 0.5,
            hint: { zh: '2 的 5 次方', en: '2 to the 5th power' },
            why: { zh: 'm=32 是 DQN 系的惯用批大小：够大以摊平单样本噪声，够小以保住更新频率——回放池另存 100,000 条以打散时序相关性。', en: 'm=32 is the DQN-family staple: large enough to smooth single-sample noise, small enough to keep update frequency high — the pool stores 100,000 transitions to shuffle away temporal correlation.' } },
        ] },
      { kind: 'choice',
        tag: { zh: '半梯度', en: 'semi-gradient' },
        stem: { zh: 'TD-Linear 的更新里，目标 r + γv̂(s′,w) 自己也含 w，却只对预测侧 v̂(s,w) 求导——所谓"半"，指的是 [[1]]；代价是更新方向不再属于任何固定目标函数。',
                en: 'In the TD-Linear update, the target r + γv̂(s′,w) contains w itself, yet only the prediction side v̂(s,w) is differentiated — the “semi” means [[1]]; the price is an update direction belonging to no fixed objective.' },
        blanks: [
          { choices: {
              zh: ['目标侧的链式项 ∇w[r + γv̂(s′,w)] 被整体扔掉（目标被当成常数）',
                   '步长只取一半（α/2），以保数值稳定',
                   '特征只取一半：低频项保留、高频项丢弃'],
              en: ['the target-side chain-rule term ∇w[r + γv̂(s′,w)] is discarded wholesale (the target is treated as a constant)',
                   'only half the step size (α/2) is taken, for numerical stability',
                   'only half the features are used: low frequencies kept, high frequencies dropped'],
            }, answer: 0,
            why: { zh: '完整梯度应含 −2(v_target − v̂)·∇w[r + γv̂(s′,w)] 这一项，半梯度把它当常数丢弃——换来单步更新、低方差、在线可学。即便收敛，去的也是 PBE 不动点而非 J 的极小值。DQN 的目标网络让这个"假装"在同步周期内变成真的：w_T 冻结期间，目标里真的不含正在更新的参数。', en: 'The full gradient would include −2(v_target − v̂)·∇w[r + γv̂(s′,w)]; the semi-gradient drops it as a constant — buying per-step updates, low variance, and online learning. Even at convergence the destination is the PBE fixed point, not a minimiser of J. DQN’s target network makes the pretence real for one sync period: while w_T is frozen, the target genuinely contains no parameter being updated.' } },
        ] },
    ],
  };


  /* ═══ L8 定理推导 ═══ */
  D.derivationSets = D.derivationSets || {};   // 兜底行（与 fillSets 同款）：data.js 已预置容器，幂等无害
  D.derivationSets['l8'] = {
    title: { zh: '第八讲 · 定理推导', en: 'Lecture 8 · Theorem Derivations' },
    items: [
      { id: 'semi-gradient-dqn',
        name: { zh: '半梯度 TD 与 DQN 的梯度流向', en: 'Semi-gradient TD and the Flow of Gradients in DQN' },
        intro: {
          zh: '目标函数 J(w) = ½E[(δ(w))²] 里，w 同时藏在目标侧与预测侧。这条链推三件事：真梯度该往哪流、半梯度为何只留一半、这个“半”如何引出“追自己”的移动靶——最后看 DQN 的目标网络怎样把“假装”变成周期性的“真”。符号沿用讲内记号：q<sub>w</sub>(s,a) 是参数为 w 的动作值函数，δ 是 TD 误差。',
          en: 'Inside the objective J(w) = ½E[(δ(w))²], w hides on both the target side and the prediction side. This chain derives three things: where the true gradient should flow, why the semi-gradient keeps only half of it, and how that “semi” breeds the moving target of “chasing yourself” — ending with how DQN’s target network turns the “pretence” into a periodically exact fact. Notation follows the lecture: q<sub>w</sub>(s,a) is the action-value function with parameter w; δ is the TD error.',
        },
        steps: [
          { tex: String.raw`J(w) = \tfrac{1}{2}\,\mathbb{E}_{(s,a,r,s')\sim d}\big[(\delta(w))^2\big]`,
            why: { zh: '目标函数是<strong>TD 误差的平方期望</strong>。期望对谁取？对转移 (s,a,r,s′) 按分布 d 取——d 决定“哪些转移的误差被在乎”（on-policy 时 d 就是行为策略诱导的平稳分布，§8.2 的老问题）。这正是 DQN 损失“平方 Bellman 最优误差”的抽象形式。', en: 'The objective is the <strong>expected squared TD error</strong>. Expected over what? Over transitions (s,a,r,s′) under a distribution d — d decides “whose errors matter” (for on-policy learning, d is the stationary distribution induced by the behavior policy, the recurring question of §8.2). This is the abstract form of DQN’s “squared Bellman optimality error”.' } },
          { tex: String.raw`\delta(w) = \htmlClass{fx-gold}{\underbrace{r + \gamma\, q_w(s',\cdot)}_{\text{目标侧 · target}}} \;-\; \htmlClass{fx-accent}{\underbrace{q_w(s,a)}_{\text{预测侧 · prediction}}}`,
            why: { zh: '金色的<strong>目标侧</strong>：§8.2 的 TD 替换——用自举目标顶替未知的真值 q<sub>π</sub>(s,a)；q<sub>w</sub>(s′,·) 在 Q-learning/DQN 情形读作 max<sub>a′</sub> q<sub>w</sub>(s′,a′)。accent 的<strong>预测侧</strong>：当前网络的出值。关键观察：<strong>两侧都是 w 的函数</strong>——这是后面所有麻烦的伏笔。', en: 'The gold <strong>target side</strong>: the TD substitution of §8.2 — the bootstrap target stands in for the unknown truth q<sub>π</sub>(s,a); in the Q-learning/DQN case q<sub>w</sub>(s′,·) reads max<sub>a′</sub> q<sub>w</sub>(s′,a′). The accent <strong>prediction side</strong>: the current network’s output. Key observation: <strong>both sides are functions of w</strong> — the seed of all the trouble ahead.' } },
          { tex: String.raw`\nabla_w J = \mathbb{E}\big[\delta\cdot\nabla_w\delta\big] = \mathbb{E}\big[\delta\cdot\big(\htmlClass{fx-gold}{\gamma\,\nabla_w q_w(s',\cdot)} - \htmlClass{fx-accent}{\nabla_w q_w(s,a)}\big)\big]`,
            why: { zh: '链式法则全开：d(½δ²)/dw = δ·∇<sub>w</sub>δ。r 与 w 无关，所以目标侧只剩 γ∇<sub>w</sub>q<sub>w</sub>(s′,·)。注意<strong>真梯度同时打进 δ 里的 q<sub>w</sub>(s′)</strong>——目标侧的贡献不是零，这就是“完整求导”该有的样子。', en: 'Chain rule fully applied: d(½δ²)/dw = δ·∇<sub>w</sub>δ. Since r does not involve w, the target side keeps only γ∇<sub>w</sub>q<sub>w</sub>(s′,·). Note that the <strong>true gradient reaches into q<sub>w</sub>(s′) inside δ</strong> — the target side contributes a non-zero term; that is what “complete differentiation” looks like.' } },
          { tex: String.raw`w \leftarrow w - \alpha\,\nabla_w J \;=\; w + \alpha\,\big(\underbrace{\mathbb{E}\big[\delta\cdot\htmlClass{fx-accent}{\nabla_w q_w(s,a)}\big]}_{\text{预测侧：推向目标}} \;-\; \underbrace{\mathbb{E}\big[\delta\cdot\htmlClass{fx-gold}{\gamma\,\nabla_w q_w(s',\cdot)}\big]}_{\text{目标侧：跟着移动}}\big)`,
            why: { zh: '梯度下降沿 −∇<sub>w</sub>J 走（符号自核：−∇J = E[δ·(∇q<sub>w</sub>(s,a) − γ∇<sub>w</sub>q<sub>w</sub>(s′,·))]）。这个“真梯度更新”是个两件套：预测侧把 q<sub>w</sub>(s,a) 推向目标，目标侧又把 r + γq<sub>w</sub>(s′) 拉着一起动——对一个本身含 w 的目标做完整求导，必然得到两件套。', en: 'Gradient descent moves along −∇<sub>w</sub>J (check the signs: −∇J = E[δ·(∇q<sub>w</sub>(s,a) − γ∇<sub>w</sub>q<sub>w</sub>(s′,·))]). The “true-gradient update” is a two-piece kit: the prediction side pushes q<sub>w</sub>(s,a) toward the target while the target side drags r + γq<sub>w</sub>(s′) along — fully differentiating through a target that itself contains w inevitably yields both pieces.' } },
          { tex: String.raw`\nabla \text{ 如何处理目标侧的 } w \text{？} \;\Longrightarrow\; \htmlClass{fx-gold}{\gamma\,\nabla_w q_w(s',\cdot)} \;=\; \htmlClass{fx-red}{\text{?}}`,
            why: { zh: '半梯度的定义动作：<strong>目标侧的链式项被整体按零处理</strong>——不是算出来等于零，是“装作没有”。更新方向只剩预测侧一项：w ← w + α·δ·∇<sub>w</sub>q<sub>w</sub>(s,a)，与书式 (8.13)（v̂ 版）同形。', en: 'The defining move of the semi-gradient: the target-side chain-rule term is treated as zero — not computed to be zero, but “pretended away”. The update direction keeps only the prediction-side piece: w ← w + α·δ·∇<sub>w</sub>q<sub>w</sub>(s,a), the same shape as the book’s Eq. (8.13) (the v̂ version).' },
            blank: {
              q: { zh: '书 Ch.8 的 TD-Linear / Q-FA 在这一步实际取的是哪一种？', en: 'Which option does the book’s Ch.8 actually take for TD-Linear / Q-FA at this step?' },
              choices: [
                { zh: '半梯度：只对预测侧 q_w(s,a) 求导，目标里的 w 当常数冻结——更新保持 SGD 形状', en: 'Semi-gradient: differentiate only the prediction side q_w(s,a), freezing the w inside the target — the update keeps the SGD shape' },
                { zh: '真梯度：对目标侧也链式求导，两项都进更新——数学上更完整', en: 'True gradient: chain-rule through the target side too, both terms enter the update — mathematically more complete' },
                { zh: '都冻结：预测侧与目标侧都不求导，w 没有任何学习信号', en: 'Freeze both: neither side is differentiated, so w receives no learning signal at all' },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确——第 6 步会把它抄成书式 (8.13) 的形状。', en: 'Correct — step 6 writes it out in the shape of the book’s Eq. (8.13).' },
                { zh: '方向没错但路线不选：对自举目标求导意味着梯度穿过“自己现在的估计”，这一半正是半梯度要扔掉的——式 (8.12)–(8.13) 里乘在 δ 后面的只有 ∇_w q_w(s,a) 一项。为何敢扔，第 7 步给理由。', en: 'Not wrong in direction, but not the route taken: differentiating through the bootstrap target means gradients pass through “your own current estimate”, exactly the half the semi-gradient discards — in Eqs. (8.12)–(8.13) only ∇_w q_w(s,a) multiplies δ. Step 7 gives the license.' },
                { zh: '两侧都冻结就没有任何更新了：∇_w q_w(s,a) 是把预测推向目标的唯一通道，丢掉它 w 不再学习。“半”指留一半，不是丢全部。', en: 'Freezing both would end all learning: ∇_w q_w(s,a) is the only channel pushing the prediction toward the target; without it w never updates. “Semi” means keeping half, not dropping everything.' },
              ],
              hint: { zh: '看书式 (8.13)：乘在 δ 后面的 ∇_w 出现在几处？', en: 'Look at Eq. (8.13): in how many places does ∇_w multiply δ?' },
            } },
          { tex: String.raw`\text{采样掉期望（SGD 精神）：}\;\; w_{t+1} = w_t + \alpha_t\,\delta_t\cdot\htmlClass{fx-accent}{\nabla_w q_w(s_t,a_t)}`,
            why: { zh: '把期望换成单样本（L6 的 SGD 精神），得到 TD-Linear / Q-FA 的骨架——与书式 (8.13) 同形（v̂ 换成 q<sub>w</sub>）。线性情形 ∇<sub>w</sub>q<sub>w</sub>(s,a) = φ(s,a)，正是 l8-code 实验台里 <code class="inline">w += alpha * delta * phi</code> 那一行。<strong>“半”的精确含义：只求了导的一半，丢掉的是目标侧那一半链式项</strong>（呼应 §8.2 “半梯度扔掉了什么”公式块）。', en: 'Swap the expectation for a single sample (L6’s SGD spirit) and you get the skeleton of TD-Linear / Q-FA — the same shape as the book’s Eq. (8.13) with v̂ replaced by q<sub>w</sub>. In the linear case ∇<sub>w</sub>q<sub>w</sub>(s,a) = φ(s,a), exactly the line <code class="inline">w += alpha * delta * phi</code> in the l8-code lab. <strong>The precise meaning of “semi”: half the differentiation is done; the discarded half is the target-side chain-rule term</strong> (echoing the §8.2 block on what the semi-gradient throws away).' } },
          { tex: String.raw`\text{MC 替换：}\ \delta = g_t - q_w(s,a)\,,\ \ \nabla_w\delta = -\nabla_w q_w(s,a)\ \htmlClass{fx-dim}{\text{（目标 } g_t \text{ 天然无 } w\text{）}} \qquad\quad \text{TD 替换：把 } \htmlClass{fx-gold}{q_w(s',\cdot)} \text{ 当 } q_\pi(s',\cdot) \text{ 的临时替身}`,
            why: { zh: '<strong>为何愿意丢</strong>：bootstrapping 目标不是真标签。逻辑依据是“替身论”——把 q<sub>w</sub>(s′,·) 看成真值 q<sub>π</sub>(s′,·) 的临时样本：若它真是真值（不含 w），目标侧的梯度本就该是零，“假装”就顺理成章。对照 MC：g<sub>t</sub> 是已实现的真实回报，天然不含 w，那才是货真价实的 SGD（§8.2 的对比）。换来的是：更新保持 SGD 形状（L6 整套机器直接复用）+ 自举目标只含一步噪声（方差小）。', en: '<strong>Why we are willing to throw it away</strong>: the bootstrap target is not a true label. The justification is the “stand-in” argument — view q<sub>w</sub>(s′,·) as a temporary sample of the truth q<sub>π</sub>(s′,·): if it really were the truth (containing no w), the target-side gradient would legitimately be zero, making the “pretence” natural. Contrast MC: g<sub>t</sub> is a realised return containing no w — honest SGD (the §8.2 comparison). What this buys: the update keeps the SGD shape (all of L6’s machinery carries over) plus a target with only one step of noise (small variance).' } },
          { tex: String.raw`w \text{ 移动} \;\Rightarrow\; \htmlClass{fx-gold}{r + \gamma\, q_w(s',\cdot)} \text{ 跟着移动} \;\Rightarrow\; \text{靶子随 } w \text{ 漂移} \;\Rightarrow\; \text{震荡 / 发散风险}`,
            why: { zh: '<strong>追自己的展开</strong>：目标随参数移动 ⇒ 你在优化一个移动的靶子——预测改一分，目标跟着改一分，误差可以在“自己喂自己”的循环里被放大而不是被消掉（§8.3 致命三角的第一角）。这不是杞人忧天：讲内已标注的 Baird 反例（1995）里，线性 v̂ + TD 半梯度 + off-policy 让 ‖w‖ 每步增大直冲无穷。<strong>半梯度没有任何收敛保证</strong>——这句话从下一步起要严肃对待。', en: '<strong>Unfolding “chasing yourself”</strong>: the target moves with the parameters ⇒ you are optimising a moving bullseye — the prediction shifts a little and the target shifts with it, so error can amplify in the “feeding oneself” loop rather than cancel (the first corner of §8.3’s deadly triad). Not paranoia: in Baird’s counterexample (1995), already flagged in this lecture, linear v̂ + TD semi-gradient + off-policy sends ‖w‖ growing every step toward infinity. <strong>The semi-gradient carries no convergence guarantee</strong> — a sentence to take seriously from the next step on.' } },
          { tex: String.raw`y = r + \gamma\max_{a'}\, q_{\htmlClass{fx-gold}{w_T}}(s',a') \qquad\quad L(w) = \big(y - q_w(s,a)\big)^2`,
            why: { zh: 'DQN 落点：q<sub>w</sub> 换成深度网络，并把<strong>目标侧的参数单独复制一份冻结</strong>——w<sub>T</sub> 是主网络 w 的影子副本（§8.4）。max 在冻结副本上取：Q-learning 的 greedy 内核原样保留（maximization bias 的隐患也原样保留，见 §8.3 书外延伸）。', en: 'The DQN landing: q<sub>w</sub> becomes a deep network, and the target-side parameters get a separate frozen copy — w<sub>T</sub> is the shadow twin of the main network’s w (§8.4). The max runs on the frozen copy: Q-learning’s greedy kernel is preserved intact (and so is the maximization-bias hazard, see the §8.3 beyond-the-book note).' } },
          { tex: String.raw`\nabla_w L = -2\,\big(y - q_w(s,a)\big)\cdot\htmlClass{fx-accent}{\nabla_w q_w(s,a)} \qquad \htmlClass{fx-dim}{\big(\nabla_w y \overset{?}{=} 0\big)}`,
            why: { zh: '梯度只流一边：损失对 w 求导，反向传播只构建 main 网络的计算子图——目标侧的贡献恒为零。这里的 ∇<sub>w</sub>y = 0 不是近似而是恒等式（见本题解析），于是<strong>“半梯度的假装”在一个同步周期内变成了精确事实</strong>（呼应 §8.4 书外延伸“货真价实地变回了 SGD”）。', en: 'The gradient flows one way only: differentiating the loss w.r.t. w, backpropagation builds the computation subgraph of the main network alone — the target side contributes exactly zero. Here ∇<sub>w</sub>y = 0 is an identity, not an approximation (see the blank’s resolution), so <strong>the semi-gradient’s “pretence” becomes a precise fact within one sync period</strong> (echoing §8.4’s beyond-the-book note: “honestly becomes SGD again”).' },
            blank: {
              q: { zh: '∇_w y = 0 在这一步是精确成立还是仍是“假装”？为什么梯度只流进 main 网络？', en: 'Is ∇_w y = 0 here exact or still a “pretence”? Why does the gradient flow only into the main network?' },
              choices: [
                { zh: '精确成立：y 的算式里只有 w_T 没有 w——对 w 求导，目标侧贡献严格为零。冻结让“假装”变成了真事实', en: 'Exactly true: the formula for y contains w_T but no w — differentiating w.r.t. w, the target side contributes strictly zero. Freezing turns the “pretence” into fact' },
                { zh: '仍是假装：w_T 终究是从 w 复制来的旧值，y 间接依赖 w，DQN 只是推迟了目标侧梯度、并未消除', en: 'Still a pretence: w_T is after all an old copy of w, so y depends on w indirectly; DQN merely postpones the target-side gradient instead of removing it' },
                { zh: '半真半假：max 的选择 a′ 耦合着网络输出，梯度本应穿过 max 流进目标网络，只是被框架截断了', en: 'Half true, half false: the max’s choice of a′ is coupled to the network’s outputs, so gradients should flow through the max into the target network, merely cut off by the framework' },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确——这正是 DQN 目标网络的全部意义。', en: 'Correct — this is the entire point of DQN’s target network.' },
                { zh: '求导只看当前函数式、不看历史来源：y = r + γ·max q_{w_T}(s′,a′) 作为表达式不含 w，∇_w y = 0 是恒等式。w_T 曾从 w 复制只影响“同步节奏”，不影响此刻的导数。', en: 'Differentiation reads the current formula, not its history: as an expression y = r + γ·max q_{w_T}(s′,a′) contains no w, so ∇_w y = 0 is an identity. That w_T was once copied from w affects the sync rhythm, not the derivative at this moment.' },
                { zh: 'max 确实不可导、其选择也依赖 w_T——但那是“对 w_T 求导”时的话题；对 w 求导时整条目标路径根本不在计算图里（detach / stop-gradient 的语义），谈不上“被截断的梯度”。', en: 'The max is indeed non-differentiable and its choice depends on w_T — but that is a topic for “differentiating w.r.t. w_T”; when differentiating w.r.t. w, the whole target path is absent from the computation graph (the detach / stop-gradient semantics), so no gradient is “cut off”.' },
              ],
              hint: { zh: '把 y 的算式抄在纸上，圈出式中出现的每一个 w——一个都圈不到。', en: 'Copy the formula for y on paper and circle every w appearing in it — you will circle none.' },
            } },
          { tex: String.raw`\htmlClass{fx-gold}{w_T}\text{：只前向（出目标，无梯度路径）} \qquad\qquad \htmlClass{fx-accent}{w}\text{：前向出预测 + 反向收梯度}`,
            why: { zh: '代码含义（与 l8-code DQN 骨架逐行对应）：<code class="inline">y = r + gamma * q_target(s2).max()</code> 出目标、<code class="inline">loss = (y - q_main(s, a)) ** 2</code> 立损失、<code class="inline">q_main.backward_and_step(loss)</code> 收梯度——反向传播只构建 main 网络的子图。<strong>“w_T 出现在目标里但梯度只流向 w”，这就是“冻结”写在代码里的样子</strong>。', en: 'The code meaning (line by line against the l8-code DQN skeleton): <code class="inline">y = r + gamma * q_target(s2).max()</code> produces the target, <code class="inline">loss = (y - q_main(s, a)) ** 2</code> poses the loss, <code class="inline">q_main.backward_and_step(loss)</code> collects gradients — backprop builds only the main network’s subgraph. <strong>“w_T appears in the target while gradients flow only into w” — that is what “freezing” looks like in code</strong>.' } },
          { tex: String.raw`\text{每 } C \text{ 步：} \htmlClass{fx-gold}{w_T} \leftarrow \htmlClass{fx-accent}{w} \qquad \htmlClass{fx-dim}{\text{（其余时间 } w_T \text{ 冻结——影子周期性地变成自己）}}`,
            why: { zh: '目标网络不是永远不动：每 C 步把影子换成自己（<code class="inline">q_target.load_state_dict(q_main.state_dict())</code>），让目标缓慢跟上学习进度。这是“分期冻结”（§8.4）：同步周期内是货真价实的 SGD，同步瞬间靶子跳一格。自举没有被消除——致命三角一角未摘，DQN 的稳定是纪律的胜利，不是定理的胜利。', en: 'The target network does not stand still forever: every C steps the shadow becomes the main network (<code class="inline">q_target.load_state_dict(q_main.state_dict())</code>), letting the target catch up slowly. This is “freezing in instalments” (§8.4): within a sync period the update is honestly SGD; at each sync the bullseye hops one step. Bootstrapping is not eliminated — no corner of the deadly triad is removed; DQN’s stability is a victory of discipline, not of theorems.' } },
          { tex: String.raw`\text{换来：目标可计算（免去真值 } q_\pi\text{）、单步更新、低方差} \qquad \text{付出：收敛保证降级——表格时代的 Dvoretzky 保证不继承}`,
            why: { zh: '收尾对账。<strong>表格时代的收敛保证</strong>由 Dvoretzky 定理压阵（L7 推导链的结尾正是它）；换上函数近似 + 自举后，更新不再是任何固定目标函数的梯度，那条定理的前提不再成立。温和情形（on-policy + 线性半梯度 TD）收敛到 PBE 不动点——不是真值；致命三角全占则 Baird 反例当头。半梯度买来的是<strong>可计算性</strong>（不用等真值、不用等回合结束），DQN 再用目标网络 + 经验回放两条纪律在无保证地带换来实践稳定——§8.5“保证地图”上，这是一片用纪律补位的土地。', en: 'The closing audit. <strong>Tabular-era convergence</strong> was underwritten by Dvoretzky’s theorem (exactly where L7’s derivation chain ended); once function approximation plus bootstrapping enter, the update is no longer the gradient of any fixed objective and the theorem’s premises collapse. The tame case (on-policy + linear semi-gradient TD) converges to the PBE fixed point — not the truth; with the full deadly triad, Baird’s counterexample looms. What the semi-gradient buys is <strong>computability</strong> (no waiting for the truth, no waiting for episode ends), and DQN adds target network + experience replay as two disciplines buying practical stability in the guarantee-free zone — on §8.5’s “guarantee map”, a territory filled in by discipline.' } },
        ],
      },
    ],
  };

  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l8 = D.otherLectures.find(l => l.no === 8);
  if (l8) l8.live = true;
})();

/* ===== L8 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 8 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 37–44，共 8 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l8'] = {
    min: 37,
    max: 44,
    episodes: [
      { n: 37, en: "Value Function Approximation (P1-Motivating example–curve fitting)", yt: "uJXcI8fcdWc" },
      { n: 38, en: "Value Function Approximation (P2-Objective function)", yt: "Z3HI1TfpJP0" },
      { n: 39, en: "Value Function Approximation (P3-Optimization algorithm)", yt: "piBDwrKt0uU" },
      { n: 40, en: "Value Function Approximation (P4-illustrative examples and analysis)", yt: "VFyBNEZxMMs" },
      { n: 41, en: "Value Function Approximation (P5-Sarsa and Q-learning)", yt: "C-HtY4-W_zw" },
      { n: 42, en: "Value Function Approximation (P6-DQN–basic idea)", yt: "lZCcbZbqVSQ" },
      { n: 43, en: "Value Function Approximation (P7-DQN–experience replay)", yt: "rynEdAdebi0" },
      { n: 44, en: "Value Function Approximation (P8-DQN–implementation and example)", yt: "vQHuCHjd6hA" }
    ],
  };
  D.sections['l8-representation'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l8' } });
})();
