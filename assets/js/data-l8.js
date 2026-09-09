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
        html: '取 one-hot 特征 φ(s) = e<sub>s</sub>（仅第 s 维为 1）⟹ &nbsp;v̂(s, w) = φ<sup>T</sup>(s)w = <span class="mt">w<sub>s</sub></span> &nbsp;&nbsp;<span style="color:var(--ink-3)">每个状态独占一个参数——参数之间零共享，泛化为零、存储为 |S|：表格法的精确画像</span>' },
      { t: 'p', zh: '<strong>特征构造的直觉：把"相似"编码进向量。</strong>泛化不是函数近似白送的——它来自特征：<strong>两个状态的向量靠得近，学其中一个时另一个就顺带被修正</strong>。所以特征设计的本质是回答"什么算相似"。多项式特征按"坐标幂次"相似（s 和 s+1 的低次幂几乎相同）；Fourier 特征按"频率成分"相似（低频波覆盖大片相邻状态，高频波管局部细节）；Tile coding 干脆把状态空间铺上瓷砖，落进同一块瓷砖的状态共享激活。<strong>特征是先验知识的注入点</strong>：你对问题结构懂多少，就能把相似性设计得多准——这比调网络结构更本质。', en: '<strong>The intuition of feature construction: encode “similarity” into vectors.</strong> Generalisation is not a free gift of approximation — it comes from features: <strong>when two states have nearby vectors, learning one incidentally corrects the other</strong>. Feature design is therefore the answer to “what counts as similar”. Polynomial features are similar by coordinate powers (low powers of s and s+1 nearly coincide); Fourier features by frequency content (low frequencies cover swathes of neighbouring states, high frequencies handle local detail); tile coding literally tiles the state space, states in the same tile sharing activation. <strong>Features are the injection point of prior knowledge</strong>: the better you understand the problem’s structure, the more precisely you can encode similarity — more fundamental than tweaking network architectures.' },
      { t: 'callout', variant: 'key', zh: '<strong>泛化是函数近似的超能力</strong>（书 Figure 8.4）：s₃ 的经验样本不仅能更新 s₃ 自己，还会通过共享参数 w 顺带修正相邻状态的价值——因为它们共享特征。这正是神经网络能玩游戏的根本原因：没见过的局面，靠相似特征举一反三。', en: '<strong>Generalisation is the superpower</strong> (book Figure 8.4): an experience sample at s₃ updates not only s₃ but, through the shared parameters w, also the values of neighbouring states — they share features. This is exactly why neural networks can play games: unseen situations generalise from similar features.' },
      { t: 'callout', variant: 'idea', zh: '<strong>换表示不是抛弃前七章，而是推广它们。</strong>one-hot 特征下函数近似精确退回表格法——TD、Sarsa、Q-learning 的所有结论原封不动。函数近似是"更一般的语言"，表格是这门语言里最奢侈的方言（每个状态一个专属参数）。学第 8 章的正确姿势：每学一个结论，都问一句"表格情形它退化成什么"——答案应该恰好是你已经会的东西。', en: '<strong>Changing representation does not abandon the first seven chapters — it generalises them.</strong> With one-hot features, function approximation degenerates exactly back to tables, and every conclusion about TD, Sarsa, and Q-learning carries over untouched. Function approximation is “a more general language”, and tables are its most extravagant dialect (one dedicated parameter per state). The right posture for Chapter 8: with each new result, ask “what does this degenerate to in the tabular case” — the answer should be precisely what you already know.' },
    ],
  };

  /* ---- §8.2 TD + FA ---- */
  S['l8-td-fa'] = {
    kicker: 'L8 · §8.2',
    title: { zh: 'TD + 函数近似 = 一个优化问题', en: 'TD + Function Approximation = An Optimisation Problem' },
    blocks: [
      { t: 'p', zh: '把近似写成优化问题：目标函数 J(w) = E[(v<sub>π</sub>(S) − v̂(S,w))²]——让估计值和真值的平方误差期望最小（S 的分布决定"更在乎哪些状态"，平稳分布是最常用的选择）。对 J 做梯度下降，再按 SGD 精神把期望换成单样本：', en: 'Pose approximation as optimisation: J(w) = E[(v<sub>π</sub>(S) − v̂(S,w))²] — minimise the expected squared error (the distribution of S decides "which states matter"; the stationary distribution is the usual choice). Gradient descent on J, then swap the expectation for a single sample in SGD spirit:' },
      { t: 'formula', lbl: 'TD + 函数近似的骨架 · The skeleton — Eq. (8.12)',
        html: 'w<sub>t+1</sub> = w<sub>t</sub> + α<sub>t</sub> [v<sub>π</sub>(s<sub>t</sub>) − v̂(s<sub>t</sub>, w<sub>t</sub>)] ∇<sub>w</sub>v̂(s<sub>t</sub>, w<sub>t</sub>)' },
      { t: 'p', zh: '麻烦来了：真值 v<sub>π</sub>(s<sub>t</sub>) 未知（不然还学什么）。两种替换：<strong>MC 替换</strong>——用轨迹回报 g<sub>t</sub>；<strong>TD 替换</strong>——用自举目标 r + γv̂(s′,w)。后者代入得到 <strong>TD-Linear</strong>：', en: 'The catch: the true v<sub>π</sub>(s<sub>t</sub>) is unknown (or there would be nothing to learn). Two substitutions: <strong>MC</strong> — use the episode return g<sub>t</sub>; <strong>TD</strong> — use the bootstrap target r + γv̂(s′,w). The latter gives <strong>TD-Linear</strong>:' },
      { t: 'formula', lbl: 'TD-Linear — Eq. (8.13)',
        html: 'w<sub>t+1</sub> = w<sub>t</sub> + α<sub>t</sub> [r + γv̂(s′,w<sub>t</sub>) − v̂(s,w<sub>t</sub>)] ∇<sub>w</sub>v̂(s,w<sub>t</sub>) &nbsp;&nbsp;<span style="color:var(--ink-3)">线性时 ∇<sub>w</sub>v̂ = φ(s)</span>' },
      { t: 'p', zh: '<strong>半梯度（semi-gradient）的精髓：目标里也有 w，但求导时装作没有。</strong>看仔细：TD 替换后的目标 r + γv̂(s′,w<sub>t</sub>) 本身就是 w 的函数——按微积分的规矩，对 J 求真梯度应该把这一项也链式展开。TD-Linear 偏不：<strong>把目标整体当作常数（当作"真值 v<sub>π</sub>(s) 的临时替身"），只对预测侧 v̂(s,w) 求导</strong>。为什么叫"半"：只做了一半的求导。为什么敢：若把目标看成真值的样本，更新式恰好保持 SGD 的形状，L6 的整套机器直接复用；而且自举目标只含一步噪声，方差小。代价是什么？<strong>更新方向不再是任何固定目标函数的梯度</strong>——你优化的靶子自己会随 w 移动，"梯度下降保证下山"的直觉就此失效。', en: '<strong>The essence of the semi-gradient: the target contains w too, but we differentiate as if it did not.</strong> Look closely: the TD-substituted target r + γv̂(s′,w<sub>t</sub>) is itself a function of w — by the rules of calculus, a true gradient of J should chain-rule through it as well. TD-Linear refuses: <strong>treat the whole target as a constant (a stand-in for the true value v<sub>π</sub>(s)) and differentiate only the prediction side v̂(s,w)</strong>. Why “semi”: only half the differentiation is done. Why dare: if the target is viewed as a sample of the truth, the update keeps the SGD shape and all of L6’s machinery carries over; and the bootstrap target carries only one step of noise — small variance. And the price? <strong>The update direction is no longer the gradient of any fixed objective</strong> — the bullseye you optimise moves with w, and the “gradient descent goes downhill” intuition dies there.' },
      { t: 'formula', lbl: '半梯度扔掉了什么 · What the semi-gradient throws away',
        html: '若对目标也求导，完整梯度应含：<span style="color:var(--gold)">−2(v<sub>target</sub> − v̂(s,w)) · ∇<sub>w</sub>[r + γv̂(s′,w)]</span>（目标侧的链式项）<br>半梯度只保留：<span class="mt">−2(v<sub>target</sub> − v̂(s,w)) · ∇<sub>w</sub>v̂(s,w)</span>（预测侧）&nbsp;&nbsp;<span style="color:var(--ink-3)">金色项被整体丢弃——便宜一步，代价是"不再是真梯度"</span>' },
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
        html: 'Sarsa-FA：w ← w + α[<span style="color:var(--green)">r + γq̂(s′,a′,w)</span> − q̂(s,a,w)]∇<sub>w</sub>q̂(s,a,w)<br>Q-FA：&nbsp;&nbsp; w ← w + α[<span style="color:var(--gold)">r + γ·max<sub>a</sub>q̂(s′,a,w)</span> − q̂(s,a,w)]∇<sub>w</sub>q̂(s,a,w)<br><span style="font-size:13px;color:var(--ink-3)">与 L7 逐字对应，仅 q 表换成 q̂(·,·,w)、"改一格"换成"沿 ∇<sub>w</sub>q̂ 推参数"——注意两个目标里的 w 都被半梯度当成了常数</span>' },
      { t: 'steps', items: [
        { zh: '<strong>三角之一：自举</strong>。目标 r + γv̂(s′,w) 追着正在更新的 w 跑——预测改一分，目标跟着改一分，误差可以在"自己喂自己"的循环里被放大而不是被消掉。', en: '<strong>Corner one: bootstrapping.</strong> The target r + γv̂(s′,w) chases the very w being updated — the prediction shifts a little and the target shifts with it; in the “feeding oneself” loop, error can be amplified rather than cancelled.' },
        { zh: '<strong>三角之二：函数近似</strong>。更新一个 (s,a) 会牵动所有共享特征的状态——表格时代"错也只错一格"，函数时代"一处更新、处处移动"，误差有了传播的公路网。', en: '<strong>Corner two: function approximation.</strong> Updating one (s,a) drags every state sharing its features — in tabular times “an error stays in its cell”; in function times “one update moves everything”, and error gains a highway network to travel.' },
        { zh: '<strong>三角之三：off-policy</strong>。样本来自行为策略，目标函数里的分布却应是目标策略的——分布错位让 SGD 的大数定律失准（L8 §8.2 里"平稳分布加权"的那个分布对不上了）。Q-learning 的 max 恰好三样全占，所以它既是利器又是危险品。', en: '<strong>Corner three: off-policy.</strong> Samples come from the behavior policy while the objective’s distribution should be the target policy’s — the distributional mismatch throws SGD’s law of large numbers off balance (the very stationary-distribution weighting of §8.2 no longer lines up). Q-learning’s max takes all three at once, which makes it both the sharpest tool and the most dangerous one.' },
      ]},
      { t: 'callout', variant: 'danger', zh: '<strong>【书外延伸】max 还有一层"放大镜效应"。</strong>max 不但占着 off-policy 的角，还会<strong>挑中估计里的高估噪声</strong>：max 对每个动作的估计误差只取正向的一侧——哪个动作被高估得最离谱，哪个就被 max 选中并写进目标，误差经自举一代代往下传。这就是"最大化偏差"（maximization bias）。Double Q-learning 的解法是把"选动作"和"算价值"拆给两套独立估计，让高估无处藏身。它与致命三角一起，构成了"为什么函数版 Q-learning 特别难驯"的完整答案。', en: '<strong>[Beyond the book] The max also acts as an amplifier.</strong> Beyond occupying the off-policy corner, max <strong>selects the upward noise among estimates</strong>: max keeps only the positive side of each action’s estimation error — whichever action is most grossly overestimated gets picked, written into the target, and passed down through bootstrapping generation after generation. This is the “maximisation bias”. Double Q-learning’s remedy splits “choosing the action” and “evaluating it” between two independent estimates, leaving overestimation nowhere to hide. Together with the deadly triad, it completes the answer to “why functional Q-learning is especially hard to tame”.' },
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
    ],
  };

  /* ---- L8 Q&A ---- */
  S['l8-qa'] = {
    kicker: 'L8 · §8.6',
    title: { zh: '问答：表格 vs 函数', en: 'Q&A: Tables vs Functions' },
    blocks: [
      { t: 'p', zh: '检索方式、更新方式、泛化能力、平稳分布的角色——本章问答聚焦"两种表示的本质差异"。', en: 'Retrieval, update, generalisation, and the role of the stationary distribution — the Q&As focus on the essential differences between the two representations.' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l8' } },
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

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 8,
    label: 'L8 · 值函数近似',
    items: [
      { id: 'l8-representation', zh: '从表格到函数', en: '§8.1 Table → function' },
      { id: 'l8-td-fa', zh: 'TD + 函数近似', en: '§8.2 TD with approximation' },
      { id: 'l8-q-fa', zh: 'Sarsa/Q-learning 换引擎', en: '§8.3 Sarsa/Q with approximation' },
      { id: 'l8-dqn', zh: 'Deep Q-Learning', en: '§8.4 Deep Q-learning' },
      { id: 'l8-summary', zh: '本章总结', en: '§8.5 Summary' },
      { id: 'l8-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l8-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l8-qa', zh: '问答', en: 'Q&A · §8.6' },
    ],
  });
  const l8 = D.otherLectures.find(l => l.no === 8);
  if (l8) l8.done = true;
})();
