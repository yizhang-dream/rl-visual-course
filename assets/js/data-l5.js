/* ═══════════════════════════════════════════════════════════
   L5 · 蒙特卡洛方法（书 Ch.5）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §5.1 均值估计 ---- */
  S['l5-mean'] = {
    kicker: 'L5 · §5.1',
    title: { zh: '均值估计：无模型时代的入场券', en: 'Mean Estimation: The Ticket to the Model-Free Era' },
    blocks: [
      { t: 'p', zh: '从这一课起，模型没了。之前所有算法都靠 p(s′|s,a)、p(r|s,a) 精确计算；现在只剩<strong>经验样本</strong>。凭什么样本也能算出价值？因为状态值、动作值本质上都是<strong>期望</strong>，而期望本质上是一个<strong>均值估计问题</strong>。书上用掷硬币示范：已知分布 p(X=1) = p(X=−1) = 0.5，均值 = 0（模型驱动）；分布未知就狂抛硬币记录样本 x₁,…,xₙ，取平均 x̄（数据驱动）——样本越多越准，大数定律保证 x̄ → E[X]。', en: 'From this lecture on, the model is gone. Every earlier algorithm leaned on p(s′|s,a) and p(r|s,a) for exact computation; now we hold only <strong>experience samples</strong>. Why should samples suffice? Because state and action values are both <strong>expectations</strong>, and an expectation is at heart a <strong>mean estimation problem</strong>. The book\'s coin game: with the known distribution p(X=1) = p(X=−1) = 0.5, the mean is 0 (model-driven); with an unknown distribution, flip like mad, record x₁,…,xₙ, average (data-driven) — more samples, better estimate; the law of large numbers guarantees x̄ → E[X].' },
      { t: 'formula', lbl: '大数定律 · Law of large numbers (Box 5.1)',
        tex: String.raw`\mathbb{E}[\bar{x}] = \mathbb{E}[X]\;\htmlClass{fx-dim}{\text{(无偏)}} \qquad\text{·}\qquad \operatorname{var}[\bar{x}] = \frac{\operatorname{var}[X]}{n}\;\htmlClass{fx-dim}{\text{(方差 }\propto 1/n \to 0\text{)}}` },
      { t: 'p', zh: '<strong>为什么没有模型也能算价值？</strong>因为 DP 和 MC 计算的是<strong>同一个期望</strong>，只是算法不同。DP 路线要把期望拆开：q(s,a) = Σ<sub>s′</sub> p(s′|s,a)[r + γv(s′)]，逐项乘概率再求和——所以手里必须有 p(s′|s,a)。MC 路线把同一个期望交给<strong>样本频率</strong>：从 (s,a) 出发采 n 条轨迹，q(s,a) ≈ (1/n) Σᵢ gᵢ。大数定律保证两条路线殊途同归。换一个说法：<strong>价值的必要原料是期望，不是模型</strong>——模型只是计算期望的一种查询方式，采样是另一种。理解了这一层，"无模型学习"就不再神秘：它不是放弃计算，而是换了台计算期望的机器。', en: '<strong>Why can values be computed without a model?</strong> Because DP and MC evaluate <strong>the same expectation</strong> by different algorithms. The DP route unpacks the expectation: q(s,a) = Σ<sub>s′</sub> p(s′|s,a)[r + γv(s′)], multiplying and summing term by term — hence p(s′|s,a) must be in hand. The MC route hands the same expectation to <strong>sample frequencies</strong>: run n episodes from (s,a) and take q(s,a) ≈ (1/n) Σᵢ gᵢ. The law of large numbers guarantees the two routes meet. Put differently: <strong>the necessary ingredient of value is the expectation, not the model</strong> — the model is merely one way of querying an expectation, sampling another. With this layer clear, "model-free learning" loses its mystery: it does not give up computation, it swaps the machine that computes expectations.' },
      { t: 'formula', lbl: '同一期望，两条算法 · One expectation, two algorithms',
        tex: String.raw`\text{DP}：\htmlClass{fx-violet}{\sum_{s'} p(s'\mid s,a)\,[r + \gamma v(s')]\,\htmlClass{fx-dim}{\text{（要模型）}}} \quad\longleftrightarrow\quad \text{MC}：\htmlClass{fx-green}{\tfrac{1}{n}\sum_i g_i \rightarrow \mathbb{E}[G\mid s,a]\,\htmlClass{fx-dim}{\text{（要样本）}}}` },
      { t: 'widget', component: 'l5-mean-est' },
      { t: 'callout', variant: 'warn', zh: '<strong>样本必须是独立同分布（i.i.d.）</strong>。书上的极端反例：如果每次采样都"抄"第一次的结果，采一亿条也没用——均值永远等于第一个样本。相关性是大样本估计的隐形杀手。', en: '<strong>Samples must be i.i.d. — independent and identically distributed</strong>. The book\'s extreme counterexample: if every sample copies the first, a hundred million samples are worthless — the average equals sample #1 forever. Correlation is the silent killer of large-sample estimation.' },
      { t: 'p', zh: '<strong>方差的账单。</strong>回报 G<sub>t</sub> 是整条轨迹上所有奖励的加权和——每一步的转移随机性、策略随机性都叠进同一份样本里。有效视野越长（γ 越接近 1，等效步数约 1/(1−γ)），叠加的随机源越多，单个回报的方差越大；估计的方差再按 1/n 缩小（Box 5.1），意味着<strong>要准就得采很多</strong>。对照 DP：一步量 r + γv(s′) 只含一次转移的随机性，方差小得多，但代价是要模型。"高方差 vs 需要模型"是 MC 与 DP 的本质分野——也正是 L7 的 TD（自举换方差）要来折中的那笔账。', en: '<strong>The variance bill.</strong> A return G<sub>t</sub> is a weighted sum of all rewards along a trajectory — every step’s transition noise and policy noise stacks into the same sample. The longer the effective horizon (γ near 1 means roughly 1/(1−γ) effective steps), the more random sources pile up and the larger each return’s variance; the estimate’s variance then shrinks only as 1/n (Box 5.1), so <strong>accuracy demands many samples</strong>. Contrast DP: the one-step quantity r + γv(s′) contains the randomness of a single transition — far smaller variance, at the price of the model. "High variance versus needing the model" is the essential divide between MC and DP — precisely the account L7’s TD comes to settle by trading bootstrapping for variance.' },
      { t: 'callout', variant: 'danger', zh: '<strong>误区粉碎机。</strong>① "MC 总要用到模型吧？"——不用。MC 与世界的全部接口是 env.step：喂进状态和动作、拿回下一状态和奖励，两张概率表从头到尾没出场。② "回报 G 和 r + γv(s′) 是一回事吧？"——不是。前者是<strong>整条轨迹</strong>上奖励的总和，是 MC 的估计目标；后者是单步的<strong>自举目标</strong>（L7 TD 的原材料）。两者的期望在真值处相等，样本行为却天差地别：G 无偏而高方差，r + γv(s′) 方差小但继承 v 的误差（有偏）。混用等于同时踩错两章。', en: '<strong>Misconception crusher.</strong> ① "MC surely needs the model somewhere?" — it does not. MC’s entire interface with the world is env.step: feed state and action, receive next state and reward; the two probability tables never appear. ② "The return G and r + γv(s′) are the same thing, right?" — no. The former sums rewards over the <strong>whole trajectory</strong> and is MC’s estimation target; the latter is a one-step <strong>bootstrapping target</strong> (the raw material of L7’s TD). Their expectations coincide at the true values, yet their sampling behaviour differs wildly: G is unbiased with high variance; r + γv(s′) has small variance but inherits v’s error (biased). Confusing them trips both chapters at once.' },
    ],
  };

  /* ---- §5.2 MC Basic ---- */
  S['l5-basic'] = {
    kicker: 'L5 · §5.2',
    title: { zh: 'MC Basic：把策略迭代的评估步换掉', en: 'MC Basic: Swap Out the Evaluation Step' },
    blocks: [
      { t: 'p', zh: '策略迭代的两步里，只有评估步用到了模型（式 5.1 需要概率）。q 的定义 q<sub>π</sub>(s,a) = E[G<sub>t</sub>|S<sub>t</sub>=s, A<sub>t</sub>=a] 提示了另一条路：<strong>从 (s,a) 出发按 π 采几条轨迹，用回报的平均值当 q 的估计</strong>（式 5.2）。把模型评估换成样本评估，就得到第一个无模型算法——<strong>MC Basic</strong>：每轮对每个 (s,a) 采足够多回合 → 平均回报当 q → 贪心改进。', en: 'Of policy iteration\'s two steps, only the evaluation step touches the model (Eq. 5.1 needs probabilities). The definition q<sub>π</sub>(s,a) = E[G<sub>t</sub>|S<sub>t</sub>=s, A<sub>t</sub>=a] hints at another route: <strong>start episodes at (s,a), follow π, and average their returns as the estimate of q</strong> (Eq. 5.2). Swap the model-based evaluation for the sample-based one and the first model-free algorithm appears — <strong>MC Basic</strong>: each round, sample enough episodes for every (s,a) → average returns as q → improve greedily.' },
      { t: 'steps', items: [
        { zh: '<strong>为什么直接估 q 而不是 v？</strong>改进步需要的正是 q(s,a)；若只估 v，回头还得靠模型算 q——白换。无模型算法直接以 q 为工作对象。', en: '<strong>Why estimate q directly rather than v?</strong> The improvement step needs exactly q(s,a); with only v you would need the model again to recover q — the swap would be pointless. Model-free algorithms work in q currency.' },
        { zh: '<strong>样本少也能凑合跑</strong>：n 条轨迹平均不准，但算法往往仍能改进——这和 L4 截断策略迭代"评估不精确照样工作"一脉相承（广义策略迭代再次显灵）。', en: '<strong>It still works on few samples</strong>: averaging n episodes is inaccurate, yet improvement often proceeds anyway — the same spirit as L4\'s truncated policy iteration "imprecise evaluation still works" (generalised policy iteration again).' },
        { zh: '<strong>MC Basic 的短板是样本效率</strong>：每轮要对每个 (s,a) 采一整批回合，太奢侈。它的使命是揭示核心思想；效率问题由后两个算法接力解决。', en: '<strong>MC Basic\'s weakness is sample efficiency</strong>: sampling a batch of episodes for every (s,a) every round is extravagant. Its mission is the core idea; efficiency is handed to the next two algorithms.' },
      ]},
      { t: 'widget', component: 'l5-mc-basic' },
      { t: 'p', zh: '<strong>与策略迭代的逐步对应。</strong>把 MC Basic 与 L4 的算法迭代逐行对齐：评估步"解 Bellman 方程"换成"平均回合回报"，改进步"贪心"原样保留。理论上每轮采样数 → ∞ 时，估计值依大数定律收敛到真 q，算法与策略迭代等价、同样收敛到最优策略。样本数因此成为新的"精度旋钮"：样本少，估计带噪声，贪心可能被噪声带偏——但正如 L4 截断策略迭代所示，广义策略迭代容得下不精确的评估，多数轮次仍然在改进。MC Basic 的收敛条件就这么朴素：<strong>每个 (s,a) 的样本足够多</strong>。', en: '<strong>Line-by-line correspondence with policy iteration.</strong> Align MC Basic with L4’s algorithm: the evaluation step "solve the Bellman equation" becomes "average episode returns", while the greedy improvement stays untouched. In theory, as the number of episodes per round → ∞, the estimates converge to the true q by the law of large numbers, and the algorithm is equivalent to policy iteration — likewise converging to optimal policies. The sample count thus becomes the new "precision knob": few samples mean noisy estimates and greed possibly misled by noise — yet, as L4’s truncated policy iteration showed, generalised policy iteration tolerates imprecise evaluation, and most rounds still improve. MC Basic’s convergence condition is that plain: <strong>enough samples for every (s,a)</strong>.' },
      { t: 'callout', variant: 'warn', zh: '<strong>MC 的适用边界：任务必须"回合化"。</strong>回报 G 要从轨迹末端倒着算，MC 因此要求轨迹<strong>有终点</strong>——episodic 任务天然合适；永不终止的 continuing 任务没有"末端"，MC 无从下嘴（工程上只能截成有限长回合，又引入截断偏差）。另一个隐含要求：每轮从每个 (s,a) 出发的样本都要"足够多"——下一节正式命名的 exploring starts 条件。记住这两条边界，就明白为什么第 7 章的 TD（走一步就能更新、不挑任务类型）会成为无模型方法的主力。', en: '<strong>MC’s boundary of applicability: tasks must be episodic.</strong> The return G is computed backwards from the end of a trajectory, so MC requires trajectories that <strong>terminate</strong> — a natural fit for episodic tasks; never-ending continuing tasks offer no "end" for MC to grab (engineering workarounds truncate to finite episodes, importing truncation bias). A second implicit demand: "enough" episodes from every (s,a) each round — the condition formally named exploring starts in the next section. Keep these two boundaries in mind and it becomes clear why Chapter 7’s TD (updating every single step, indifferent to task type) becomes the flagship of model-free methods.' },
    ],
  };

  /* ---- §5.3 MC Exploring Starts ---- */
  S['l5-exploring'] = {
    kicker: 'L5 · §5.3',
    title: { zh: 'MC Exploring Starts：把样本榨干', en: 'MC Exploring Starts: Squeezing the Samples Dry' },
    blocks: [
      { t: 'p', zh: 'MC Basic 每轮扔掉旧轨迹重新采——浪费。一条长轨迹里藏着大量信息：<strong>每访问到一个 (s,a)，它后面的尾部就是一条"从 (s,a) 出发"的迷你轨迹</strong>，其折扣回报就是一份 q 估计。按利用策略分三种：<strong>initial-visit</strong>（只用整条轨迹估计初始对）、<strong>first-visit</strong>（每个 (s,a) 只取第一次访问后的尾部）、<strong>every-visit</strong>（每次访问都取，最大化压榨）。', en: 'MC Basic throws old trajectories away each round — wasteful. A long trajectory is dense with information: <strong>whenever a (s,a) is visited, its tail is a mini-trajectory "starting from (s,a)"</strong> whose discounted return is one more q sample. Three usage strategies: <strong>initial-visit</strong> (only the whole episode estimates the starting pair), <strong>first-visit</strong> (only the first visit to each pair counts), <strong>every-visit</strong> (every visit counts — maximal squeezing).' },
      { t: 'p', zh: '实现上有个优雅的技巧：<strong>从轨迹末端倒着扫</strong>，g ← γg + r<sub>t+1</sub> 一边走一边天然算出"从每个访问点到末端"的折扣回报——一次反向扫描，全部样本到手。再用两个表记账：Returns(s,a) 累加回报、Num(s,a) 计数，q = Returns/Num 随时可更新。<strong>于是改进不必等"所有回合采完"，可以逐回合（episode-by-episode）进行</strong>——又落回广义策略迭代的怀抱：估计不准照样改进。', en: 'One elegant implementation trick: <strong>sweep the episode backwards</strong>, with g ← γg + r<sub>t+1</sub> naturally producing the discounted return from every visited point to the end — one reverse pass harvests every sample. Two tables keep the books: Returns(s,a) accumulates returns, Num(s,a) counts visits, and q = Returns/Num is updatable at any time. <strong>Improvement no longer waits for "all episodes collected" — it happens episode by episode</strong>, falling right back into generalised policy iteration: improve even on imprecise estimates.' },
      { t: 'p', zh: '<strong>first-visit 与 every-visit：殊途同归。</strong>同一状态-动作对被访问多次时，first-visit 只取第一次访问的尾部回报，every-visit 每次访问都取。两者是<strong>一致（consistent）</strong>的：访问次数 → ∞ 时都收敛到同一个真值 E[G|s,a]——每个"尾部"都是从该 (s,a) 出发的一条合法迷你轨迹。差别在统计品质：every-visit 的样本共享后缀、彼此强相关，同一个"真样本"被重复记账，有限样本下估计有偏；first-visit 的样本相关性较弱。工程上通常选 every-visit：实现一行都不多写、样本全部榨干，偏差随迭代被冲淡——本讲"代码精讲"一节用的正是它。', en: '<strong>First-visit and every-visit: two roads, one destination.</strong> When the same state-action pair is visited several times, first-visit takes only the first visit’s tail return; every-visit takes all of them. The two are <strong>consistent</strong>: as visits → ∞ both converge to the same truth E[G|s,a] — every "tail" is a legitimate mini-trajectory starting at that (s,a). They differ in statistical quality: every-visit’s samples share suffixes and are strongly correlated, one "true sample" is booked repeatedly, and the finite-sample estimate is biased; first-visit’s samples are less correlated. Engineering usually picks every-visit: not one extra line of code, every drop of sample squeezed, and the bias washes out over iterations — exactly what the code walkthrough on this site uses.' },
      { t: 'p', zh: '<strong>增量式：别存回报，边走边除。</strong>Returns/Num 两张表是"批量记账"——存下所有回报再相除。其实一步就能换成<strong>流式更新</strong>：新回报来了，q ← q + (1/N)(g − q) 加一笔就走，内存 O(1)、历史不用重算。这里的 1/N 不是随手选的：第 N 个样本到来时，它恰好等价于 N 个回报的算术平均——这正是 α<sub>t</sub> = 1/t 的出生地。把 1/N 换成别的步长，估计就从"精确平均"变成"带遗忘的学习"——全书所有更新式从这个替换出发，L6 整章都在讲它的收敛条件。', en: '<strong>Incremental form: keep no returns, divide as you go.</strong> The Returns/Num tables are "batch bookkeeping" — store every return, then divide. It converts in one step to a <strong>streaming update</strong>: when a new return arrives, q ← q + (1/N)(g − q) adds one increment and moves on, with O(1) memory and no recomputed history. The 1/N here is not a casual choice: when the N-th sample arrives, the rule is exactly equivalent to the arithmetic mean of all N returns — this is the birthplace of α<sub>t</sub> = 1/t. Swap 1/N for another step size and the estimator turns from "exact averaging" into "learning with forgetting" — every update rule in the book starts from this swap, and L6 is devoted to its convergence conditions.' },
      { t: 'formula', lbl: '增量式 MC 估计 · The incremental MC estimate',
        tex: String.raw`q(s,a) \leftarrow q(s,a) + \frac{1}{N(s,a)}\big( g - q(s,a) \big)`,
        note: '⟺ N 个回报的算术平均（α<sub>t</sub> = 1/t 的出生地）' },
      { t: 'callout', variant: 'key', zh: '<strong>新的代价：exploring starts 条件</strong>。所有动作价值都要被"从它出发"的样本喂过，才估得准——MC Basic/Exploring Starts 都要求从<strong>每个</strong> (s,a) 出发都有足够多的回合。现实系统（机器人、真用户）里强行从任意状态-动作对启动往往做不到。能不能去掉这个条件？能——下一节的 soft 策略。', en: '<strong>The new price: the exploring-starts condition</strong>. Every action value needs samples "starting from it" to be estimated well — both MC Basic and Exploring Starts require sufficiently many episodes from <strong>every</strong> (s,a). Real systems (robots, real users) cannot simply be launched from arbitrary state-action pairs. Can this condition be removed? Yes — soft policies, next section.' },
    ],
  };

  /* ---- §5.4/5.5 ε-greedy ---- */
  S['l5-eps'] = {
    kicker: 'L5 · §5.4–5.5',
    title: { zh: 'MC ε-Greedy：不靠 exploring starts 也能探索', en: 'MC ε-Greedy: Exploring without Exploring Starts' },
    blocks: [
      { t: 'p', zh: '<strong>Soft 策略</strong>：在任何状态选任何动作的概率都为正。只要策略是 soft 的，<strong>一条足够长的轨迹</strong>就能把每个 (s,a) 都逛到——exploring starts 条件被悄悄绕开。最常用的 soft 策略是 <strong>ε-greedy</strong>：以较大概率选贪心动作，同时给其他动作留一点概率：', en: 'A <strong>soft policy</strong> gives positive probability to every action at every state. With a soft policy, <strong>one sufficiently long trajectory</strong> can visit every (s,a) — the exploring-starts condition quietly dissolves. The most common soft policy is <strong>ε-greedy</strong>: favour the greedy action, but leave crumbs for the others:' },
      { t: 'formula', lbl: 'ε-greedy 策略 · The ε-greedy policy',
        tex: String.raw`\pi(a\mid s) = \htmlClass{fx-accent}{1 - \frac{(|A|-1)}{|A|}\,\varepsilon}\ \htmlClass{fx-dim}{\text{若 } a = \text{贪心动作}} \qquad\text{·}\qquad \pi(a\mid s) = \htmlClass{fx-accent}{\frac{\varepsilon}{|A|}}\ \htmlClass{fx-dim}{\text{否则}}` },
      { t: 'p', zh: '把 MC Exploring Starts 的改进步从"贪心"换成"ε-贪心"（在 ε-greedy 策略集合 Π<sub>ε</sub> 内取最优），就得到 <strong>MC ε-Greedy</strong>。收敛性答案微妙：<strong>给定充足样本，它收敛到 Π<sub>ε</sub> 内最优的 ε-greedy 策略</strong>——是 yes 也是 no：在 ε-greedy 家族里最优，但不等于全局最优策略。', en: 'Swapping MC Exploring Starts\' improvement step from greedy to ε-greedy (optimal within the set Π<sub>ε</sub> of ε-greedy policies) yields <strong>MC ε-Greedy</strong>. The convergence answer is nuanced: <strong>with enough samples it converges to the best ε-greedy policy within Π<sub>ε</sub></strong> — both yes and no: optimal in the ε-greedy family, not necessarily the globally optimal policy.' },
      { t: 'widget', component: 'l5-eps-greedy' },
      { t: 'p', zh: '<strong>收敛的正式条件：每个 (s,a) 都要被无限次访问。</strong>MC 类算法收敛到最优，需要两件事同时成立：估计要准——每个对的访问次数 → ∞，大数定律才发力；探索要够——每个对都被访到，否则没被访问的动作一直顶着初始估值，贪心永远看不见它。ε-greedy 天然满足访问下界：任何动作在任何状态被选的概率 ≥ ε/|A| &gt; 0，一条 t 步的长轨迹走下来，每个对的访问次数至少线性增长。exploring starts 用"起点任意"保证覆盖，ε-greedy 用"行动任意"保证覆盖——两种探索哲学，后者才落得了地。', en: '<strong>The formal condition for convergence: every (s,a) must be visited infinitely often.</strong> MC-type algorithms converge to optimal policies only when two things hold together: accurate estimates — visits per pair → ∞, so the law of large numbers fires; sufficient exploration — every pair gets visited, or unvisited actions keep their initial estimates and greed never sees them. ε-greedy secures the visitation lower bound for free: every action at every state is chosen with probability ≥ ε/|A| &gt; 0, so over a t-step trajectory each pair’s visit count grows at least linearly. Exploring starts secures coverage by "any starting point"; ε-greedy by "any action at any time" — two philosophies of exploration, and only the latter lands in practice.' },
      { t: 'formula', lbl: '访问次数下界 · Visitation lower bound under ε-greedy',
        tex: String.raw`N_t(s,a) \ge \frac{\varepsilon}{|A|}\,t \rightarrow \infty`,
        note: '（探索的预算律：ε 每减半，覆盖时间翻倍）' },
      { t: 'p', zh: '<strong>探索与利用（exploration vs. exploitation）</strong>——强化学习的基本权衡在此正式登场。ε 大：探索强，所有 (s,a) 被充分访问、估值准，但牺牲最优性（策略更"随机"）；ε 小：利用强、贴近贪心，但冷门动作可能估值失真、错过最优。书上的实验：ε = 1 时百万步内每个动作被访问近万次，覆盖极佳；ε = 0.5 时访问次数骤降一个量级。工程经验：<strong>先大 ε 勘探、后逐步衰减 ε 保最优</strong>。', en: '<strong>Exploration vs. exploitation</strong> — RL\'s fundamental trade-off formally enters. Large ε: strong exploration, every (s,a) well visited and well estimated, but optimality sacrificed (the policy grows random); small ε: strong exploitation close to greedy, but cold actions may be mis-estimated and the best one missed. The book\'s experiment: at ε = 1 each action is visited ~10⁴ times within a million steps (excellent coverage); at ε = 0.5 visit counts drop an order of magnitude. Engineering lore: <strong>explore with large ε first, then decay it to secure optimality</strong>.' },
    ],
  };

  /* ---- §5.6 总结 ---- */
  S['l5-summary'] = {
    kicker: 'L5 · §5.6',
    title: { zh: '本章总结：从模型到数据', en: 'Chapter Summary: From Models to Data' },
    blocks: [
      { t: 'p', zh: '本书第一批无模型算法登场。核心思想一以贯之：<strong>均值估计</strong>——状态值/动作值都是期望，期望用样本平均来估。三个算法是同一思想的三级放大：MC Basic（把策略迭代的评估步换成 MC 估计，揭示核心思想）→ MC Exploring Starts（every-visit + 反向计算 + 逐回合改进，提高样本效率）→ MC ε-Greedy（soft 策略去掉 exploring starts 条件）。', en: 'The book\'s first model-free algorithms take the stage. One core idea throughout: <strong>mean estimation</strong> — state and action values are expectations, and expectations are estimated by sample averages. Three algorithms amplify the idea in stages: MC Basic (swap policy iteration\'s evaluation step for MC estimation — reveals the core), MC Exploring Starts (every-visit + backward computation + episode-by-episode improvement — sample efficiency), MC ε-Greedy (soft policies remove the exploring-starts condition).' },
      { t: 'steps', items: [
        { zh: '<strong>用什么信息</strong>：DP 查模型表 p(s′|s,a)、p(r|s,a) 精确计算期望；MC 只看经历过的轨迹，用频率逼近期望。', en: '<strong>Information used</strong>: DP consults the model tables p(s′|s,a) and p(r|s,a) to compute expectations exactly; MC sees only experienced trajectories and approximates expectations by frequencies.' },
        { zh: '<strong>什么时机更新</strong>：DP 扫完全部状态才进下一轮；MC 逐回合更新（一条轨迹刷新一批 (s,a)），且必须等回合结束才算得出回报。', en: '<strong>When to update</strong>: DP sweeps the whole state space per round; MC updates episode by episode (one trajectory refreshes many pairs) and must wait for the episode to end before any return exists.' },
        { zh: '<strong>偏差与方差</strong>：DP 的评估精确——零偏差零方差（只要模型对）；MC 的估计无偏但高方差——方差 ∝ 1/n，要准靠堆样本。', en: '<strong>Bias and variance</strong>: DP’s evaluation is exact — zero bias, zero variance (provided the model is right); MC’s estimate is unbiased but high-variance — variance ∝ 1/n, accuracy bought with samples.' },
        { zh: '<strong>探索需求</strong>：DP 知道一切，无需探索；MC 必须保证每个 (s,a) 被访问到（exploring starts 或 soft 策略），盲区永远估不准。', en: '<strong>Exploration needs</strong>: DP knows everything and explores nothing; MC must guarantee visits to every (s,a) (exploring starts or soft policies) — blind spots stay mis-estimated forever.' },
        { zh: '<strong>共同骨架</strong>：两边都是"评估 + 贪心改进"的广义策略迭代——MC 只换了评估步的引擎，底盘原封未动。', en: '<strong>Shared skeleton</strong>: both run the generalised policy iteration loop of "evaluation + greedy improvement" — MC swaps the evaluation engine and leaves the chassis untouched.' },
      ]},
      { t: 'p', zh: '<strong>三个算法的演化逻辑：每次只换一个零件。</strong>MC Basic 把策略迭代的评估步换成"采样平均"——解决<strong>能不能</strong>（无模型可行吗）；MC Exploring Starts 把样本利用从 initial-visit 升级为 every-visit + 反向扫描 + 逐回合改进——解决<strong>省不省</strong>（样本效率）；MC ε-Greedy 把贪心换成 ε-贪心、用 soft 策略解除 exploring starts——解决<strong>行不行</strong>（现实里做得到吗）。正确性 → 效率 → 可行性，一条清晰的升级链。以后读论文遇到新算法，也建议这样拆：它换了哪个零件、又付出什么新代价。', en: '<strong>The evolution of the three algorithms: one part swapped at a time.</strong> MC Basic replaces policy iteration’s evaluation step with "sample averaging" — answering <strong>whether it is possible</strong> (does model-free work). MC Exploring Starts upgrades sample usage from initial-visit to every-visit + backward sweeps + episode-wise improvement — answering <strong>whether it is efficient</strong> (sample economy). MC ε-Greedy swaps greedy for ε-greedy and dissolves exploring starts with soft policies — answering <strong>whether it is practical</strong> (feasible in the real world). Correctness → efficiency → feasibility: a clean upgrade chain. When you meet a new algorithm in a paper, take it apart the same way: which part was swapped, and at what new price.' },
      { t: 'callout', variant: 'idea', zh: '下一课预告：MC 必须等一条轨迹走完才能算回报（g 要从末端倒推）。如果走一步就想更新一次呢？这需要把"未来回报"换成"当前奖励 + 下一状态价值的估计"——自举的回归，<strong>时序差分学习</strong>。它背后还有一个 170 年的老算法撑腰：随机近似。', en: 'Next lecture teaser: MC must wait for a trajectory to finish before computing a return (g works backwards from the end). What if we want to update every single step? Replace "future returns" by "current reward + an estimate of the next state\'s value" — the return of bootstrapping, <strong>temporal-difference learning</strong>. Behind it stands a 170-year-old algorithm: stochastic approximation.' },
    ],
  };

  /* ---- L5 长推理 ---- */
  S['l5-reasoning'] = {
    kicker: 'L5 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：模型消失的那一天', en: 'The Long Coherent Reasoning: The Day the Model Vanished' },
    blocks: [
      { t: 'p', zh: '本章推理链：期望 = 均值 → 样本平均估均值（大数定律）→ 策略迭代的评估步只用到 q → q 可以用轨迹平均来估 → MC Basic → 一条轨迹处处是样本（every-visit/反向 g）→ 但要求每个 (s,a) 都能当起点 → soft 策略化条件于无形 → 探索与利用的永恒权衡。', en: 'This chapter\'s spine: expectation = mean → estimate means by sample averages (LLN) → policy iteration\'s evaluation step only needs q → q can be estimated by trajectory averages → MC Basic → one trajectory is samples everywhere (every-visit, backward g) → but every (s,a) must be a possible start → soft policies dissolve the condition → the eternal exploration–exploitation trade-off.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l5' } },
    ],
  };

  /* ---- L5 代码 ---- */
  S['l5-code'] = {
    kicker: 'L5 · 动手 · Hands-on',
    title: { zh: '代码精讲：无模型，从采样开始', en: 'Code Walkthrough: Model-Free Starts with Sampling' },
    blocks: [
      { t: 'p', zh: '无模型代码的第一件工具不是算法，是<strong>采样器</strong>：<code class="inline">generate_episode</code>。有了它，MC Basic 就是"采样 → 平均 → 贪心"三行主循环。注意这次我们<strong>不再需要 build_model</strong>——这是与 L2–L4 代码的划时代差别。', en: 'The first tool of model-free code is not an algorithm but a <strong>sampler</strong>: <code class="inline">generate_episode</code>. With it, MC Basic is a three-line main loop: sample → average → improve greedily. Note what is missing: <strong>no build_model</strong> — that is the epochal difference from the L2–L4 code.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l5' } },
    ],
  };

  /* ---- L5 Q&A ---- */
  S['l5-qa'] = {
    kicker: 'L5 · §5.7',
    title: { zh: '问答：蒙特卡洛九连问（精选）', en: 'Q&A: Nine Questions on Monte Carlo (Selected)' },
    blocks: [
      { t: 'p', zh: '三个算法的关系、exploring starts 的来龙去脉、ε-greedy 的"是又不是"，全在问答里。', en: 'The relationship among the three algorithms, the full story of exploring starts, and the "yes and no" of ε-greedy all live in the Q&A.' },
      { t: 'p', zh: '翻卡前先在心里过三题：① MC 到底需不需要模型（不需要——env.step 就是全部接口）；② first-visit 与 every-visit 差在哪、为什么渐近一致（相关性不同，都收敛到 E[G|s,a]）；③ ε-greedy 策略"是不是最优"为什么是二义回答（在 ε-greedy 家族内最优，但不等于全局最优）。', en: 'Before flipping, settle three questions in your mind: ① does MC need a model (no — env.step is the entire interface); ② how do first-visit and every-visit differ, and why are they asymptotically consistent (different correlation, both converging to E[G|s,a]); ③ why is "is an ε-greedy policy optimal" a two-sided answer (optimal within the ε-greedy family, but not the global optimum).' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l5' } },
    ],
  };

  /* ═══ L5 长推理链 ═══ */
  D.reasoningSets['l5'] = [
    { link: '起点 · Start',
      title: { zh: '模型没了，还剩什么？', en: 'The model is gone — what remains?' },
      zh: '此前所有算法都查表：p(s′|s,a)、p(r|s,a)。真实机器人/真实用户给不了这些表，只能给出经历：状态、动作、奖励的流水账。无模型学习的第一性问题：只用流水账能算出价值吗？',
      en: 'Every earlier algorithm consulted tables: p(s′|s,a), p(r|s,a). A real robot or a real user hands you no such tables — only a diary of states, actions, rewards. The first question of model-free learning: can value be computed from the diary alone?',
      question: '价值到底是什么数学对象？' },
    { link: '还原 · Reduce',
      title: { zh: '价值 = 期望 = 均值', en: 'Value = expectation = mean' },
      zh: 'v(s) 和 q(s,a) 的定义都是期望。期望在没有模型时并非不可计算——它只是随机变量的平均值。价值估计问题瞬间降维成<strong>均值估计问题</strong>。',
      en: 'Both v(s) and q(s,a) are defined as expectations. Without a model an expectation is not beyond reach — it is just the average of a random variable. Value estimation instantly reduces to <strong>mean estimation</strong>.',
      question: '没有分布，均值怎么估？' },
    { link: '采样 · Sample',
      title: { zh: '大数定律：样本平均就是答案', en: 'The law of large numbers: sample averages are the answer' },
      zh: 'x̄ = (1/n)Σx_j 满足 E[x̄] = E[X]（无偏）、var[x̄] = var[X]/n（方差塌缩）。掷硬币游戏可见平均值随 n 逼近 0。代价：样本必须 i.i.d.，且"足够多"。',
      en: 'x̄ = (1/n)Σx_j satisfies E[x̄] = E[X] (unbiased) and var[x̄] = var[X]/n (variance collapse). In the coin game the average creeps toward 0 as n grows. The price: samples must be i.i.d. and “numerous enough.”',
      question: '强化学习里去哪弄这些样本？' },
    { link: '接回 · Reconnect',
      title: { zh: '轨迹就是样本：MC Basic', en: 'Trajectories are samples: MC Basic' },
      zh: '策略迭代的评估步只需要 q。从 (s,a) 出发按 π 走几条轨迹，每条的折扣回报是 q 的一次抽样，平均即可（式 5.2）。评估步换掉，策略迭代立刻无模型化——MC Basic。',
      en: 'Policy iteration\'s evaluation step only needs q. Start episodes at (s,a), follow π; each episode\'s discounted return is one sample of q; average them (Eq. 5.2). Swap the evaluation step and policy iteration goes model-free — MC Basic.',
      question: '每轮都从头采样，太浪费了吧？' },
    { link: '榨干 · Squeeze',
      title: { zh: '一条轨迹处处是样本：Exploring Starts', en: 'One trajectory, samples everywhere: Exploring Starts' },
      zh: '轨迹访问到的每个 (s,a)，其尾部都是一份 q 样本。反向扫描 g ← γg + r 一次算清全部；Returns/Num 两张表记账；逐回合改进而非等批量——广义策略迭代再度兜底。代价：要求每个 (s,a) 都能当起点。',
      en: 'Every visited (s,a) carries a q sample in its tail. One backward pass g ← γg + r computes them all; Returns/Num keep the books; improvement goes episode-by-episode rather than batch — generalised policy iteration cushions the imprecision. The price: every (s,a) must be a possible start.',
      question: '现实系统做不到任意起点，怎么办？' },
    { link: '软化 · Soften',
      title: { zh: 'Soft 策略化条件于无形：ε-greedy', en: 'Soft policies dissolve the condition: ε-greedy' },
      zh: '让策略在任何状态都以正概率尝试任何动作（ε-greedy：贪心动作拿大头、其余均分 ε），一条足够长的轨迹就能覆盖所有 (s,a)——exploring starts 不再必要。收敛到"ε-greedy 家族内最优"，ε 大偏探索、ε 小偏利用。',
      en: 'Let the policy try every action with positive probability everywhere (ε-greedy: the greedy action takes the lion’s share, the rest split ε): one long trajectory covers every (s,a), and exploring starts is no longer needed. It converges to “optimal within the ε-greedy family”; large ε favours exploration, small ε exploitation.',
      question: null },
  ];

  /* ═══ L5 代码块 ═══ */
  const srcSampler = `import numpy as np

def generate_episode(env, start, policy, gamma=0.9, max_steps=200):
    """THE model-free tool: experience the world, record the diary.
    start: (s0, a0); policy: (n, n_a) probability matrix."""
    s, a = start
    episode = [(s, a, None)]           # (state, action, reward-for-entering-state)
    for _ in range(max_steps):
        # 执行动作 -> 环境给 (next_state, reward)   [唯一的环境接口]
        next_state, r = env.step(s, a)
        episode.append((next_state, None, r))     # r 是这一步的即时奖励
        s = next_state
        # 按当前策略采样下一个动作（软策略在这里起作用）
        a = np.random.choice(len(policy[s]), p=policy[s])
        episode[-1] = (episode[-1][0], a, r)
        if False:
            break
    return episode

def mc_basic(env, n_episodes=50, gamma=0.9, max_outer=20, max_steps=200):
    """Algorithm 5.1: for every (s,a), average episode returns -> q -> greedy."""
    n, n_a = env.num_states, len(env.action_space)
    pi = np.full((n, n_a), 1.0 / n_a)             # pi_0: uniform (soft!)
    q = np.zeros((n, n_a))
    for k in range(max_outer):
        for s in range(n):
            for a in range(n_a):
                returns = []
                for _ in range(n_episodes):
                    ep = generate_episode(env, (s, a), pi, max_steps=max_steps)
                    g, first = 0.0, True
                    for (st, at, r) in reversed(ep[1:]):
                        if first:
                            g = r
                            first = False
                    returns.append(g)
                q[s, a] = np.mean(returns)         # MC 估计：样本平均 = 评估
        pi = np.zeros_like(q)
        pi[np.arange(n), q.argmax(axis=1)] = 1.0   # 贪心改进
    return pi, q`;

  const srcExploring = `def mc_exploring_starts(env, pi, gamma=0.9, n_episodes=5000, max_steps=200):
    """Algorithm 5.2: one episode improves many (s,a) pairs, backwards.
    Returns/Num 记账 + every-visit + episode-by-episode improvement."""
    n, n_a = env.num_states, len(env.action_space)
    Returns = np.zeros((n, n_a))
    Num = np.zeros((n, n_a))
    for ep_i in range(n_episodes):
        # exploring starts：起点 (s0,a0) 均匀随机覆盖所有可能
        s0 = np.random.randint(n)
        a0 = np.random.randint(n_a)
        episode = roll(env, s0, a0, pi, max_steps)     # [(s_t, a_t, r_{t+1}), ...]
        g = 0.0
        visited = []
        for t in reversed(range(len(episode))):        # 反向扫描：一次算全部回报
            s_t, a_t, r_t1 = episode[t]
            g = gamma * g + r_t1
            visited.append((s_t, a_t, g))              # every-visit：每次都记账
        for (s_t, a_t, g) in visited:
            Returns[s_t, a_t] += g
            Num[s_t, a_t] += 1
            q = Returns[s_t, a_t] / Num[s_t, a_t]      # 增量式估计
            q_row = np.divide(Returns[s_t], Num[s_t], out=np.zeros(n_a), where=Num[s_t] > 0)
            best = np.flatnonzero(q_row == q_row.max())   # 该状态的贪心动作集合（并列最优都算）
        pi = improve_episode_wise(pi, Returns, Num, visited)   # 逐回合改进
    return pi`;

  D.codeFileSets['l5'] = [
    {
      id: 'l5-basic-code', file: 'mc_basic.py — 采样与主循环', tab: '① 采样器 + MC Basic',
      intro: { zh: '第一段代码的明星是 <code class="inline">generate_episode</code>：它只通过 <code class="inline">env.step</code> 与世界交互（无模型），其余全部在处理"流水账"。MC Basic 主循环和 L4 策略迭代逐行对照，唯一区别是把"查模型算 q"换成了"采样平均估 q"。', en: 'The star of the first block is <code class="inline">generate_episode</code>: it touches the world only through <code class="inline">env.step</code> (model-free) and everything else is diary-keeping. Line by line, the MC Basic main loop mirrors L4\'s policy iteration with one difference: “compute q from the model” becomes “estimate q by sample averages”.' },
      code: srcSampler,
      notes: [
        { lines: [3, 9], tag: 'episode ★', zh: '<code class="inline">episode</code> 列表是"世界流水账"：(状态, 动作, 即时奖励)。它是无模型方法的一切原料——之后所有算法（TD、Q-learning）都从这条数据结构出发。', en: 'The <code class="inline">episode</code> list is the world diary: (state, action, immediate reward). It is the raw material of everything model-free — TD and Q-learning later set out from this very structure.' },
        { lines: [12, 12], tag: 'sample policy', zh: '<code class="inline">np.random.choice(len(policy[s]), p=policy[s])</code>：按概率向量抽动作——软策略的采样落点。如果 policy 是确定性的 one-hot，这行退化为确定性选择。', en: '<code class="inline">np.random.choice(len(policy[s]), p=policy[s])</code>: sample an action from the probability vector — where soft policies act. For a deterministic one-hot policy the line degenerates to a fixed choice.' },
        { lines: [26, 33], tag: 'estimate', zh: '每个 (s,a) 采 n_episodes 条轨迹、求平均——式 (5.2) 的直译。注意这里只为起点算了回报（MC Basic 的朴素之处），轨迹后半段的信息被浪费——这正是 MC Exploring Starts 要修的点。', en: 'For each (s,a), n_episodes are rolled and averaged — a literal translation of Eq. (5.2). Note only the starting pair consumes the episode (MC Basic\'s naivety); the information in the tail is discarded — exactly what MC Exploring Starts fixes.' },
        { lines: [34, 36], tag: 'greedy', zh: '贪心改进与 L4 完全同款。"模型驱动 → 数据驱动"的替换被限制在评估步内，其余骨架原封不动——这就是广义策略迭代的说服力。', en: 'The greedy improvement is identical to L4. The model-driven → data-driven swap is confined to the evaluation step while the skeleton stays untouched — that is the persuasive power of generalised policy iteration.' },
      ],
    },
    {
      id: 'l5-es-code', file: 'mc_exploring_starts.py — 反向扫描与记账', tab: '② Exploring Starts',
      intro: { zh: '这一版每采一条轨迹就榨干全部 (s,a) 样本：<strong>反向扫描</strong>让 g ← γg + r<sub>t+1</sub> 一次性算出"每个访问点到轨迹末端"的回报；Returns/Num 两张表支持<strong>逐回合改进</strong>——收一条轨迹就改进一次，不必攒批。', en: 'This version squeezes every (s,a) sample out of each trajectory: the <strong>backward sweep</strong> g ← γg + r<sub>t+1</sub> yields the return from every visited point to the end in one pass; the Returns/Num tables support <strong>episode-by-episode improvement</strong> — improve after every single episode rather than batching.' },
      code: srcExploring,
      notes: [
        { lines: [8, 9], tag: 'exploring starts', zh: '起点均匀随机覆盖所有 (s,a)——这就是"exploring starts 条件"的字面实现。它是算法正确性的理论前提，也是下一节要移除的工程负担。', en: 'Uniformly random starts cover all (s,a) — the literal implementation of the exploring-starts condition. It is the theoretical precondition of correctness and the engineering burden the next section removes.' },
        { lines: [13, 17], tag: 'backward ★', zh: '<strong>全文件最优雅的三行</strong>：反向扫一遍，g 依次变成"从 T−1 到末端""从 T−2 到末端"……的折扣回报。正向算是 O(n²)，反向是 O(n)——一个方向选择省一个数量级。', en: '<strong>The most elegant three lines of the file</strong>: one backward pass makes g successively equal to the discounted return from T−1, from T−2, … to the end. Forward would be O(n²); backward is O(n) — a direction choice worth an order of magnitude.' },
        { lines: [18, 21], tag: 'every-visit', zh: 'every-visit：每次访问都记账（first-visit 则只记每对的第一次）。两者在无穷样本下等价；有限样本下 every-visit 用料更省、偏差会随迭代被冲淡。', en: 'Every-visit: book every visit (first-visit books only each pair\'s first). Equivalent given infinite samples; with finite samples every-visit wastes nothing and its bias washes out over iterations.' },
        { lines: [22, 23], tag: 'incremental', zh: 'q = Returns/Num 随时可查——新样本来了加一笔即可，不用重算历史。这个"增量均值"思想在第 6 章会被抽象成一条通用更新式：新估计 ← 旧估计 + 步长×(目标 − 旧估计)，一路通向 TD。', en: 'q = Returns/Num is queryable at any time — a new sample is one more increment, no history recomputed. Chapter 6 abstracts this incremental mean into a universal update: new ← old + step × (target − old), the road straight to TD.' },
      ],
    },
  ];

  /* ═══ L5 Q&A ═══ */
  D.qaSets['l5'] = [
    { tag: 'Q1 · 书上原问', q: { zh: '为什么均值估计对强化学习如此重要？', en: 'Why is mean estimation so important for RL?' },
      a: { zh: '因为状态值和动作值都定义为回报的期望——估计价值本质上就是估计均值。大数定律保证了"样本够多就够准"。', en: 'Because state and action values are both defined as expectations of returns — estimating a value is essentially estimating a mean. The law of large numbers guarantees accuracy given enough samples.' } },
    { tag: 'Q2 · 书上原问', q: { zh: '无模型 MC 强化学习的核心思想是什么？', en: 'What is the core idea of model-free MC RL?' },
      a: { zh: '把策略迭代改造成无模型版本：评估步不再用模型算 q，而是用"从 (s,a) 出发的回合回报平均"来估 q。改进步原封不动——广义策略迭代的力量。', en: 'Convert policy iteration into a model-free one: the evaluation step no longer computes q from the model but estimates it by averaging episode returns started from (s,a). The improvement step is untouched — the power of generalised policy iteration.' } },
    { tag: 'Q3 · 书上原问', q: { zh: 'initial-visit / first-visit / every-visit 有什么区别？', en: 'Differences between initial-, first-, and every-visit?' },
      a: { zh: '三种样本利用策略：initial-visit 只用整条轨迹估计初始对的 q；every-visit 每次访问某对都拿其后缀估计一次（最省样本）；first-visit 只记每对的第一次访问。有限样本下常配 every-visit。', en: 'Three sample-usage strategies: initial-visit uses the whole episode only for the starting pair; every-visit takes a fresh estimate from each visit\'s tail (most frugal); first-visit counts only each pair\'s first visit. With finite samples every-visit is the usual choice.' } },
    { tag: 'Q4 · 书上原问', q: { zh: '什么是 exploring starts？为什么重要？', en: 'What is exploring starts and why does it matter?' },
      a: { zh: '要求"从每个 (s,a) 出发都有足够多的回合"。理论上它是找到最优策略的必要条件——只有每个动作价值都被充分探索，才可能正确挑出最优动作。工程上它常常做不到，所以下一招是 soft 策略。', en: 'It requires sufficiently many episodes started from every (s,a). Theoretically it is necessary for finding optimal policies — only well-explored action values support correct greedy choices. Practically it is often infeasible, hence soft policies next.' } },
    { tag: 'Q5 · 书上原问', q: { zh: 'ε-greedy 策略能是最优策略吗？', en: 'Can an ε-greedy policy be optimal?' },
      a: { zh: '既是又不是：给定充足样本，算法收敛到 ε-greedy 策略集合里最优的那一个（yes）；但它不等于全局最优策略——只要 ε > 0，它总在尝试非贪心动作（no）。工程解法：让 ε 随训练衰减。', en: 'Both yes and no: given enough samples the algorithm converges to the best policy within the ε-greedy family (yes), but that is not the globally optimal policy — with ε > 0 it keeps trying non-greedy actions (no). The engineering fix: decay ε during training.' } },
    { tag: 'Q6 · 书上原问', q: { zh: 'MC Basic、MC Exploring Starts、MC ε-Greedy 是什么关系？', en: 'How do MC Basic, Exploring Starts, and ε-Greedy relate?' },
      a: { zh: '同一思想的三个版本：MC Basic 揭示核心（评估步换成 MC 估计）；Exploring Starts 调整样本利用（every-visit + 反向 + 逐回合改进）；ε-Greedy 去掉 exploring starts 条件（soft 策略）。核心简单，复杂化都是为效率服务——学习时要分层拆解。', en: 'Three versions of one idea: MC Basic reveals the core (evaluation step → MC estimation); Exploring Starts refines sample usage (every-visit, backward pass, episode-wise improvement); ε-Greedy removes the exploring-starts condition (soft policies). The core is simple; the complications all serve efficiency — learn them in layers.' } },
  ];


  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l5 = D.otherLectures.find(l => l.no === 5);
  if (l5) l5.done = true;
})();
