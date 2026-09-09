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
        html: 'E[x̄] = E[X] <span style="color:var(--ink-3)">(无偏)</span>, &nbsp;&nbsp; var[x̄] = var[X]/n <span style="color:var(--ink-3)">(方差 ∝ 1/n → 0)</span>' },
      { t: 'widget', component: 'l5-mean-est' },
      { t: 'callout', variant: 'warn', zh: '<strong>样本必须是独立同分布（i.i.d.）</strong>。书上的极端反例：如果每次采样都"抄"第一次的结果，采一亿条也没用——均值永远等于第一个样本。相关性是大样本估计的隐形杀手。', en: '<strong>Samples must be i.i.d. — independent and identically distributed</strong>. The book\'s extreme counterexample: if every sample copies the first, a hundred million samples are worthless — the average equals sample #1 forever. Correlation is the silent killer of large-sample estimation.' },
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
    ],
  };

  /* ---- §5.3 MC Exploring Starts ---- */
  S['l5-exploring'] = {
    kicker: 'L5 · §5.3',
    title: { zh: 'MC Exploring Starts：把样本榨干', en: 'MC Exploring Starts: Squeezing the Samples Dry' },
    blocks: [
      { t: 'p', zh: 'MC Basic 每轮扔掉旧轨迹重新采——浪费。一条长轨迹里藏着大量信息：<strong>每访问到一个 (s,a)，它后面的尾部就是一条"从 (s,a) 出发"的迷你轨迹</strong>，其折扣回报就是一份 q 估计。按利用策略分三种：<strong>initial-visit</strong>（只用整条轨迹估计初始对）、<strong>first-visit</strong>（每个 (s,a) 只取第一次访问后的尾部）、<strong>every-visit</strong>（每次访问都取，最大化压榨）。', en: 'MC Basic throws old trajectories away each round — wasteful. A long trajectory is dense with information: <strong>whenever a (s,a) is visited, its tail is a mini-trajectory "starting from (s,a)"</strong> whose discounted return is one more q sample. Three usage strategies: <strong>initial-visit</strong> (only the whole episode estimates the starting pair), <strong>first-visit</strong> (only the first visit to each pair counts), <strong>every-visit</strong> (every visit counts — maximal squeezing).' },
      { t: 'p', zh: '实现上有个优雅的技巧：<strong>从轨迹末端倒着扫</strong>，g ← γg + r<sub>t+1</sub> 一边走一边天然算出"从每个访问点到末端"的折扣回报——一次反向扫描，全部样本到手。再用两个表记账：Returns(s,a) 累加回报、Num(s,a) 计数，q = Returns/Num 随时可更新。<strong>于是改进不必等"所有回合采完"，可以逐回合（episode-by-episode）进行</strong>——又落回广义策略迭代的怀抱：估计不准照样改进。', en: 'One elegant implementation trick: <strong>sweep the episode backwards</strong>, with g ← γg + r<sub>t+1</sub> naturally producing the discounted return from every visited point to the end — one reverse pass harvests every sample. Two tables keep the books: Returns(s,a) accumulates returns, Num(s,a) counts visits, and q = Returns/Num is updatable at any time. <strong>Improvement no longer waits for "all episodes collected" — it happens episode by episode</strong>, falling right back into generalised policy iteration: improve even on imprecise estimates.' },
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
        html: 'π(a|s) = <span class="mt">1 − (|A|−1)/|A| · ε</span> &nbsp;<span style="color:var(--ink-3)">若 a = 贪心动作</span>&nbsp;&nbsp;·&nbsp;&nbsp; π(a|s) = <span class="mt">ε/|A|</span> &nbsp;<span style="color:var(--ink-3)">否则</span>' },
      { t: 'p', zh: '把 MC Exploring Starts 的改进步从"贪心"换成"ε-贪心"（在 ε-greedy 策略集合 Π<sub>ε</sub> 内取最优），就得到 <strong>MC ε-Greedy</strong>。收敛性答案微妙：<strong>给定充足样本，它收敛到 Π<sub>ε</sub> 内最优的 ε-greedy 策略</strong>——是 yes 也是 no：在 ε-greedy 家族里最优，但不等于全局最优策略。', en: 'Swapping MC Exploring Starts\' improvement step from greedy to ε-greedy (optimal within the set Π<sub>ε</sub> of ε-greedy policies) yields <strong>MC ε-Greedy</strong>. The convergence answer is nuanced: <strong>with enough samples it converges to the best ε-greedy policy within Π<sub>ε</sub></strong> — both yes and no: optimal in the ε-greedy family, not necessarily the globally optimal policy.' },
      { t: 'widget', component: 'l5-eps-greedy' },
      { t: 'p', zh: '<strong>探索与利用（exploration vs. exploitation）</strong>——强化学习的基本权衡在此正式登场。ε 大：探索强，所有 (s,a) 被充分访问、估值准，但牺牲最优性（策略更"随机"）；ε 小：利用强、贴近贪心，但冷门动作可能估值失真、错过最优。书上的实验：ε = 1 时百万步内每个动作被访问近万次，覆盖极佳；ε = 0.5 时访问次数骤降一个量级。工程经验：<strong>先大 ε 勘探、后逐步衰减 ε 保最优</strong>。', en: '<strong>Exploration vs. exploitation</strong> — RL\'s fundamental trade-off formally enters. Large ε: strong exploration, every (s,a) well visited and well estimated, but optimality sacrificed (the policy grows random); small ε: strong exploitation close to greedy, but cold actions may be mis-estimated and the best one missed. The book\'s experiment: at ε = 1 each action is visited ~10⁴ times within a million steps (excellent coverage); at ε = 0.5 visit counts drop an order of magnitude. Engineering lore: <strong>explore with large ε first, then decay it to secure optimality</strong>.' },
    ],
  };

  /* ---- §5.6 总结 ---- */
  S['l5-summary'] = {
    kicker: 'L5 · §5.6',
    title: { zh: '本章总结：从模型到数据', en: 'Chapter Summary: From Models to Data' },
    blocks: [
      { t: 'p', zh: '本书第一批无模型算法登场。核心思想一以贯之：<strong>均值估计</strong>——状态值/动作值都是期望，期望用样本平均来估。三个算法是同一思想的三级放大：MC Basic（把策略迭代的评估步换成 MC 估计，揭示核心思想）→ MC Exploring Starts（every-visit + 反向计算 + 逐回合改进，提高样本效率）→ MC ε-Greedy（soft 策略去掉 exploring starts 条件）。', en: 'The book\'s first model-free algorithms take the stage. One core idea throughout: <strong>mean estimation</strong> — state and action values are expectations, and expectations are estimated by sample averages. Three algorithms amplify the idea in stages: MC Basic (swap policy iteration\'s evaluation step for MC estimation — reveals the core), MC Exploring Starts (every-visit + backward computation + episode-by-episode improvement — sample efficiency), MC ε-Greedy (soft policies remove the exploring-starts condition).' },
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
            best = np.flatnonzero(q == q.max() if np.ndim(q) == 0 else
                                  np.flatnonzero(q_like(q, s_t, a_t)))
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

  /* ═══ 注册导航 ═══ */
  D.navGroups.push({
    lecture: 5,
    label: 'L5 · 蒙特卡洛方法',
    items: [
      { id: 'l5-mean', zh: '均值估计与大数定律', en: '§5.1 Mean estimation' },
      { id: 'l5-basic', zh: 'MC Basic', en: '§5.2 MC Basic' },
      { id: 'l5-exploring', zh: 'MC Exploring Starts', en: '§5.3 Exploring starts' },
      { id: 'l5-eps', zh: 'MC ε-Greedy 与探索利用', en: '§5.4–5.5 ε-greedy' },
      { id: 'l5-summary', zh: '本章总结', en: '§5.6 Summary' },
      { id: 'l5-reasoning', zh: '连贯长推理', en: 'The long reasoning' },
      { id: 'l5-code', zh: '代码精讲', en: 'Code walkthrough' },
      { id: 'l5-qa', zh: '问答', en: 'Q&A · §5.7' },
    ],
  });
  const l5 = D.otherLectures.find(l => l.no === 5);
  if (l5) l5.done = true;
})();
