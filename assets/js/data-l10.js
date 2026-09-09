/* ═══════════════════════════════════════════════════════════
   L10 · Actor-Critic 方法（书 Ch.10）
   ═══════════════════════════════════════════════════════════ */
(function () {
  const D = window.DATA;
  const S = D.sections;

  /* ---- §10.1 QAC ---- */
  S['l10-qac'] = {
    kicker: 'L10 · §10.1',
    title: { zh: 'QAC：演员上台，评论家入席', en: 'QAC: The Actor Takes the Stage, the Critic Takes a Seat' },
    blocks: [
      { t: 'p', zh: 'REINFORCE 的评分员是真实回报 G<sub>t</sub>——无偏但要等整条轨迹、方差大。<strong>QAC（Q actor-critic）</strong>换了个评分员：<strong>用 TD 学习现估的 q(s,a,w)</strong>。每步两行更新：<strong>演员（actor）</strong>——θ<sub>t+1</sub> = θ<sub>t</sub> + α<sub>θ</sub>∇<sub>θ</sub>ln π(a<sub>t</sub>|s<sub>t</sub>,θ<sub>t</sub>) q(s<sub>t</sub>,a<sub>t</sub>,w<sub>t</sub>)，沿评论家给的分改进策略；<strong>评论家（critic）</strong>——w<sub>t+1</sub> = w<sub>t</sub> + α<sub>w</sub>[r + γq(s′,a′,w) − q(s,a,w)]∇<sub>w</sub>q，用 TD 误差修正自己的评分表。', en: 'REINFORCE’s grader is the real return G<sub>t</sub> — unbiased but episode-bound and high-variance. <strong>QAC (Q actor-critic)</strong> hires a different grader: <strong>the q(s,a,w) estimated on the fly by TD learning</strong>. Each step is two lines. The <strong>actor</strong>: θ<sub>t+1</sub> = θ<sub>t</sub> + α<sub>θ</sub>∇<sub>θ</sub>ln π(a<sub>t</sub>|s<sub>t</sub>,θ<sub>t</sub>) q(s<sub>t</sub>,a<sub>t</sub>,w<sub>t</sub>) — improve the policy along the critic’s score. The <strong>critic</strong>: w<sub>t+1</sub> = w<sub>t</sub> + α<sub>w</sub>[r + γq(s′,a′,w) − q(s,a,w)]∇<sub>w</sub>q — correct its own scoring table by the TD error.' },
      { t: 'callout', variant: 'key', zh: '<strong>分工的本质</strong>：演员是策略函数 π(a|s,θ)（负责行动），评论家是价值函数 q(s,a,w)（负责打分）。评论家的 TD 目标让打分逐渐可靠；演员的梯度让策略逐渐优秀。对比 REINFORCE：评分从"事后整条轨迹"变为"当场 TD"——方差骤降、可单步更新。这就是广义策略迭代在无模型世界的完成态。', en: '<strong>The essence of the division of labour</strong>: the actor is the policy function π(a|s,θ) (acts); the critic is the value function q(s,a,w) (scores). The critic’s TD target makes the scores reliable over time; the actor’s gradient makes the policy better. Against REINFORCE: scoring changes from “after-the-fact whole trajectory” to “on-the-spot TD” — variance collapses and per-step updates become possible. This is generalised policy iteration completed in the model-free world.' },
      { t: 'p', zh: '<strong>为什么非要请一位评论家？REINFORCE 的三个痛点逐一对照。</strong>① <strong>必须等回合结束</strong>：G<sub>t</sub> 要从轨迹末端倒推，回合内毫无更新——长回合/持续任务直接卡死；② <strong>方差巨大</strong>：整条轨迹的运气全乘在一个评分上，学习率被迫设小，训练慢；③ <strong>评分是"一次性的"</strong>：每条轨迹的 G 用完即弃，上一回合学到的"什么动作好"传不到下一回合。QAC 的解法是把评分员换成<strong>一直在学的价值函数</strong>：q̂(s,a,w) 用 TD 每步修正（不等回合）、只吃一步噪声（低方差）、且跨回合持续积累（经验复用）。结构就两件套：<strong>演员 π(a|s,θ) 上台表演，评论家 q̂(s,a,w) 台下打分</strong>——打分喂给演员的梯度，表演产生的数据喂给评论家的 TD。', en: '<strong>Why hire a critic at all? REINFORCE’s three pains, one by one.</strong> ① <strong>It must wait for the episode’s end</strong>: G<sub>t</sub> is computed backwards from the trajectory tail — no updates mid-episode; long episodes and continuing tasks stall outright. ② <strong>Enormous variance</strong>: the luck of an entire trajectory multiplies into one score, forcing tiny learning rates and slow training. ③ <strong>Scores are single-use</strong>: each trajectory’s G is discarded after one update — what last episode taught about “which actions are good” cannot reach the next episode. QAC’s remedy is to replace the grader with <strong>a value function that never stops learning</strong>: q̂(s,a,w) corrects itself by TD every step (no waiting), swallows only one step of noise (low variance), and keeps accumulating across episodes (experience reuse). The structure is a two-piece ensemble: <strong>the actor π(a|s,θ) performs on stage while the critic q̂(s,a,w) scores from the seats</strong> — scores feed the actor’s gradient; the performance’s data feeds the critic’s TD.' },
      { t: 'formula', lbl: 'QAC 的两行更新并排 · The two update lines side by side',
        html: '演员：<span style="color:var(--green)">θ</span> ← θ + α<sub>θ</sub> · ∇<sub>θ</sub>ln π(a<sub>t</sub>|s<sub>t</sub>,θ) · <span class="mt">q̂(s<sub>t</sub>,a<sub>t</sub>,w)</span> &nbsp;<span style="color:var(--ink-3)">（评论家的分——推动力）</span><br>评论家：<span style="color:var(--gold)">w</span> ← w + α<sub>w</sub> · [r + γq̂(s′,a′,w) − q̂(s,a,w)] · ∇<sub>w</sub>q̂(s,a,w) &nbsp;<span style="color:var(--ink-3)">（TD 误差——修正量）</span>' },
      { t: 'steps', items: [
        { zh: '<strong>近似一：真值 → 估计</strong>。定理 9.1 要求的是 q<sub>π</sub>(s,a)；QAC 用函数近似的 q̂(s,a,w) 顶替（第 8 章的全部机器在此上岗）。评论家越准，演员的梯度越接近真策略梯度。', en: '<strong>Approximation one: truth → estimate.</strong> Theorem 9.1 demands q<sub>π</sub>(s,a); QAC stands the function-approximated q̂(s,a,w) in its place (all of Chapter 8’s machinery reports for duty here). The more accurate the critic, the closer the actor’s gradient to the true policy gradient.' },
        { zh: '<strong>近似二：期望 → 采样</strong>。梯度是期望，QAC 用当前交互到的单个 (s<sub>t</sub>,a<sub>t</sub>) 代替（L6 的 SGD 精神）。一步噪声换一步更新，划算。', en: '<strong>Approximation two: expectation → sample.</strong> The gradient is an expectation; QAC substitutes the single currently-visited (s<sub>t</sub>,a<sub>t</sub>) (L6’s SGD spirit). One step of noise buys one step of update — a fair trade.' },
        { zh: '<strong>近似三：最优 → "尽力"</strong>。梯度上升每步只走一小截，而 J(θ) 非凸——收敛到的是局部最优，"最优策略"名副其实地只是<strong>近似</strong>最优。三个近似各让一步，换来一个能跑、能在线、能持续学习的整体。', en: '<strong>Approximation three: optimal → “best effort”.</strong> Gradient ascent takes only a small step at a time, and J(θ) is nonconvex — what is reached is a local optimum, and the “optimal policy” is optimal only <strong>approximately</strong>, as the name honestly admits. Three approximations each concede a little, and together they buy a whole that runs, learns online, and never stops.' },
      ]},
      { t: 'p', zh: '<strong>每一步都在做最细粒度的广义策略迭代。</strong>回看 L4 的 GPI 骨架：策略评估与策略改进交替执行、互相成就。QAC 把"交替"的粒度压到<strong>单步</strong>：每个时间步里，评论家先用最新经验修正评分（评估半步），演员再沿新评分改进策略（改进半步）。评估不必收敛、改进不必彻底——两家都只前进一小格，长期看照样共同爬向最优。这是 GPI 思想在无模型、函数化世界的最终形态。', en: '<strong>Every step performs generalised policy iteration at its finest grain.</strong> Recall L4’s GPI skeleton: policy evaluation and policy improvement alternate, each propping up the other. QAC compresses the alternation to <strong>single steps</strong>: within every time step, the critic first corrects its scores with the freshest experience (an evaluation half-step), then the actor improves the policy along the updated scores (an improvement half-step). Evaluation need not converge, improvement need not be thorough — both advance by a small notch, yet over the long run they climb toward optimality together. This is GPI’s final form in a model-free, functional world.' },
    ],
  };

  /* ---- §10.2 A2C ---- */
  S['l10-a2c'] = {
    kicker: 'L10 · §10.2',
    title: { zh: 'A2C：减去基线，方差骤降', en: 'A2C: Subtract a Baseline, Watch the Variance Fall' },
    blocks: [
      { t: 'p', zh: '<strong>基线不变性（式 10.3）</strong>：策略梯度里给 q 减去任意一个只依赖状态的函数 b(S)，期望不变——因为 E[∇lnπ(S)·b(S)] = Σ<sub>s</sub>η(s)b(s)Σ<sub>a</sub>∇π(a|s) = 0（概率和恒为 1，导数为 0）。<strong>减错不了，白赚</strong>。最优的 b 是 v<sub>π</sub>(s)——减完剩下的恰好是<strong>优势（advantage）</strong>：', en: '<strong>Baseline invariance (Eq. 10.3)</strong>: subtracting any state-only function b(S) from q inside the policy gradient leaves the expectation unchanged — because E[∇lnπ(S)·b(S)] = Σ<sub>s</sub>η(s)b(s)Σ<sub>a</sub>∇π(a|s) = 0 (probabilities sum to one, so their gradient is zero). <strong>You cannot get it wrong, and it is free.</strong> The optimal b is v<sub>π</sub>(s) — subtracting it leaves exactly the <strong>advantage</strong>:' },
      { t: 'formula', lbl: '优势函数 · The advantage function',
        html: 'A<sub>π</sub>(s,a) = q<sub>π</sub>(s,a) − v<sub>π</sub>(s) &nbsp;<span style="color:var(--ink-3)">= 这个动作比"平均水平"好多少</span>' },
      { t: 'p', zh: '为什么 v<sub>π</sub>(s) 是最优基线？它让评分从"绝对好坏"变成"相对意外程度"：q 高于平均水平 → 正优势 → 多用；低于 → 少用。实践中用 TD 误差 δ = r + γv(s′) − v(s) 当优势的样本估计（单步、低方差），得到 <strong>A2C（Advantage Actor-Critic）</strong>。', en: 'Why is v<sub>π</sub>(s) the optimal baseline? It turns scores from “absolute goodness” into “relative surprise”: q above average → positive advantage → use more; below → less. In practice the TD error δ = r + γv(s′) − v(s) serves as the one-step, low-variance sample of the advantage, giving <strong>A2C (Advantage Actor-Critic)</strong>.' },
      { t: 'formula', lbl: 'δ 的隐藏身份 · The hidden identity of δ',
        html: 'E[δ<sub>t</sub> | s<sub>t</sub>=s, a<sub>t</sub>=a] = E[r + γv<sub>π</sub>(s′)] − v<sub>π</sub>(s) = <span class="mt">q<sub>π</sub>(s,a) − v<sub>π</sub>(s) = A<sub>π</sub>(s,a)</span> &nbsp;&nbsp;<span style="color:var(--ink-3)">（当 v 已收敛到 v<sub>π</sub> 时）</span>' },
      { t: 'p', zh: '<strong>δ 作为优势代理的逐项读法。</strong>把 δ = r + γv(s′) − v(s) 拆成三段：<strong>r</strong> 是即时反馈（这一步实际拿到的）；<strong>γv(s′)</strong> 是"接下来的人生"按当前估值的折现（L7 自举的老朋友）；<strong>v(s)</strong> 是事前预期（待在这个状态本来就该值多少）。所以 δ 回答的问题是——<strong>"这次比预期好多少？"</strong>好于预期（δ&gt;0）→ 这个动作是惊喜，抬它的概率；不如预期（δ&lt;0）→ 压概率。推力的大小也自动校准：大惊喜大推、小惊喜小推。它不用等回合结束（单步可得）、不用另建优势网络（v 一个函数身兼两职）。v 不准时 δ 有偏——但 v(s) 与 v(s′) 的误差在相减中部分对消，比想象中扛造。', en: '<strong>Reading δ as an advantage proxy, term by term.</strong> Split δ = r + γv(s′) − v(s) into three parts: <strong>r</strong> is the immediate feedback (what this step actually earned); <strong>γv(s′)</strong> is “the rest of one’s life” discounted at current estimates (L7’s old friend, bootstrapping); <strong>v(s)</strong> is the prior expectation (what staying in this state was supposed to be worth). So δ answers the question — <strong>“how much better than expected was this?”</strong> Better than expected (δ&gt;0) → the action is a pleasant surprise, raise its probability; worse (δ&lt;0) → lower it. The push is self-calibrating: big surprises get big pushes, small ones small. No waiting for episode ends (available per step), no separate advantage network (one v function holds two jobs). When v is inaccurate δ is biased — but the errors of v(s) and v(s′) partly cancel in the subtraction, making it sturdier than it looks.' },
      { t: 'p', zh: '<strong>A2C 与 REINFORCE+baseline 是同一招的两个档位。</strong>两者都用"减基线"的中心化评分：REINFORCE+baseline 用 <strong>G<sub>t</sub> − b(s)</strong>——真实回报减基线，无偏但方差大、必须等回合；A2C 用 <strong>δ = r + γv(s′) − v(s)</strong>——把"整段真实回报"换成"一步真实 + 自举"，有偏但方差骤降、单步更新。偏差-方差的连续谱在这对兄弟身上再次现形（与 L7 的 n-step 谱完全同构）。【书外延伸】谱的中间点也有名有姓：用 n 步回报减基线（A2C 的 n-step 版），乃至把多档 n 步指数加权的 GAE——现代策略梯度方法的标配组件。', en: '<strong>A2C and REINFORCE+baseline are two gears of the same move.</strong> Both score with the centred “minus a baseline” signal: REINFORCE+baseline uses <strong>G<sub>t</sub> − b(s)</strong> — real return minus baseline, unbiased but high-variance and episode-bound; A2C uses <strong>δ = r + γv(s′) − v(s)</strong> — swapping “a whole stretch of real return” for “one real step plus bootstrapping”, biased but sharply lower-variance and per-step. The bias–variance spectrum reappears on this pair of siblings (exactly isomorphic to L7’s n-step spectrum). [Beyond the book] The middle of the spectrum also has names: n-step return minus baseline (the n-step A2C), up to GAE, the exponentially weighted blend of many n-step advantages — a standard component of modern policy-gradient methods.' },
      { t: 'callout', variant: 'warn', zh: '<strong>两个工程误区：失衡与抢跑。</strong>① <strong>actor/critic 学习率失衡</strong>：α<sub>θ</sub> 远大于 α<sub>w</sub>，演员在一张还没学明白的评分表上狂奔——梯度方向是噪声，策略越跑越偏，而评论家追不上修正；α<sub>w</sub> 远大于 α<sub>θ</sub> 则相反：评分表抖得厉害（每步都被单样本猛拉），演员无所适从。两个学习率要么同量级、要么 critic 略快——让评分先稳半拍。② <strong>critic 没热身，actor 先冲刺</strong>：训练初期 v 接近零、δ ≈ r——评分退化成"只看即时奖励"，演员会先学会一串短视动作。常见对策：前若干步只训评论家（或给 α<sub>θ</sub> 设 warm-up），等 δ 有了信息量再放开演员。', en: '<strong>Two engineering misconceptions: imbalance and false starts.</strong> ① <strong>Unbalanced actor/critic learning rates</strong>: with α<sub>θ</sub> far above α<sub>w</sub>, the actor sprints on a score sheet it has barely learned — gradient directions are noise, the policy veers off, and the critic cannot catch up to correct; with α<sub>w</sub> far above α<sub>θ</sub>, the score sheet jitters violently (yanked by every single sample) and the actor loses its bearings. Keep the two rates on the same order, or let the critic run slightly faster — the scores should steady themselves half a beat ahead. ② <strong>The critic not warmed up while the actor sprints</strong>: early in training v is near zero and δ ≈ r — scoring degenerates into “immediate reward only”, and the actor first learns a string of short-sighted moves. Common remedies: train the critic alone for the first stretch (or give α<sub>θ</sub> a warm-up), and release the actor once δ carries information.' },
    ],
  };

  /* ---- §10.3 off-policy ---- */
  S['l10-offpolicy'] = {
    kicker: 'L10 · §10.3',
    title: { zh: 'Off-policy Actor-Critic：重要性采样穿针引线', en: 'Off-Policy Actor-Critic: Importance Sampling Threads the Needle' },
    blocks: [
      { t: 'p', zh: 'A2C 仍是 on-policy（样本必须来自当前策略）。想用旧数据或别的策略的数据？需要<strong>重要性采样（importance sampling）</strong>：用比值 ρ = π(a|s)/β(a|s) 给每条样本加权，把"别的策略的经验"折算回"我的策略的期望"——分布不同，权重来凑。代价：比值方差大（权重忽大忽小），轨迹越长越难算。', en: 'A2C is still on-policy (samples must come from the current policy). Want to reuse old data or another policy’s data? <strong>Importance sampling</strong>: weight each sample by the ratio ρ = π(a|s)/β(a|s), converting “another policy’s experience” into “my policy’s expectation” — different distributions, weights make up the difference. The price: ratio variance (weights swing wildly), and it worsens with trajectory length.' },
      { t: 'p', zh: '把重要性比值塞进优势加权的梯度，就得到 off-policy actor-critic。再往前一步：<strong>确定性策略梯度（DPG）</strong>——策略干脆不输出概率，直接输出动作 μ(s,θ)，梯度变成 ∇<sub>θ</sub>μ(s,θ)·∇<sub>a</sub>q(s,a)|<sub>a=μ</sub>（沿着 q 的山坡最陡处推动作）。行为策略 β 随便选个探索性的即可。DDPG、TD3 都是这条线的后人。', en: 'Plugging the importance ratios into the advantage-weighted gradient yields off-policy actor-critic. One step further: the <strong>deterministic policy gradient (DPG)</strong> — the policy outputs an action μ(s,θ) outright instead of probabilities, with gradient ∇<sub>θ</sub>μ(s,θ)·∇<sub>a</sub>q(s,a)|<sub>a=μ</sub> (push the action along q’s steepest slope). The behavior policy β can be any exploratory one. DDPG and TD3 are descendants of this line.' },
      { t: 'formula', lbl: 'off-policy 演员更新 · The off-policy actor update',
        html: 'θ ← θ + α<sub>θ</sub> · <span class="mt">ρ<sub>t</sub></span> · ∇<sub>θ</sub>ln π(a<sub>t</sub>|s<sub>t</sub>,θ) · δ<sub>t</sub> &nbsp;&nbsp;<span style="color:var(--ink-3)">ρ<sub>t</sub> = π(a<sub>t</sub>|s<sub>t</sub>,θ) / β(a<sub>t</sub>|s<sub>t</sub>)——把 β 采的样本"折算"成 π 的期望</span>' },
      { t: 'p', zh: '<strong>【书外延伸，助理解】A3C/A2C：并行也是一味药。</strong> on-policy 方法还有一个非算法层面的病：单环境串行采样，相邻样本高度相关（这一步的局势直接决定下一步）。<strong>A3C</strong>（Asynchronous Advantage Actor-Critic）的处方是"多开几个世界"：多个 worker 各自环境各自采样、异步把梯度推给共享参数——不同环境的样本天然去相关，还顺带压平了训练方差，也不再需要经验回放池。<strong>A2C</strong> 是它的同步版：所有 worker 走到同一节拍、攒一个大批量一起更新——去相关的收益保留，实现更简单、GPU 利用更充分。注意它们治的是"样本相关性"，与 off-policy 治的"数据过期"是两种病、两种药。', en: '<strong>[Beyond the book, for intuition] A3C/A2C: parallelism is also a medicine.</strong> On-policy methods suffer one further, non-algorithmic ailment: single-environment serial sampling makes adjacent samples strongly correlated (this step’s situation directly determines the next). <strong>A3C</strong> (Asynchronous Advantage Actor-Critic) prescribes “open more worlds”: multiple workers each sample their own environment and asynchronously push gradients to shared parameters — samples from different environments decorrelate naturally, training variance flattens along the way, and no replay buffer is needed. <strong>A2C</strong> is its synchronous sibling: all workers march to the same beat and pool one large batch per update — the decorrelation benefit stays, the implementation is simpler, and GPU utilisation improves. Note they treat “sample correlation”, a different disease from off-policy’s “stale data” — two diseases, two medicines.' },
      { t: 'callout', variant: 'danger', zh: '<strong>两个翻车现场。</strong>① <strong>连续任务忘记打折</strong>：γ=1 时折扣回报 G<sub>t</sub> 在持续任务里发散（无穷步奖励直接累加），REINFORCE 的更新式连定义都保不住；两条正路——要么老老实实 γ&lt;1，要么改用平均奖励 r̄<sub>π</sub> 目标（第 9 章的第三个度量正是为它准备的）。"顺手把 γ 设成 1 省事"是持续任务里最经典的隐性 bug。② <strong>重要性比值无界</strong>：ρ = π/β 在 β 采样到 π 几乎不选的动作时可以任意大——一条样本独占梯度，更新被单次运气劫持。【书外延伸】实战常给 ρ 裁剪（clip）上限，PPO 的截断目标正是这一思想的工程化。', en: '<strong>Two crash scenes.</strong> ① <strong>Forgetting to discount in continuing tasks</strong>: with γ=1 the discounted return G<sub>t</sub> diverges in continuing tasks (infinitely many rewards accumulate directly), and REINFORCE’s update cannot even stay defined; two proper roads — keep γ&lt;1 honestly, or switch to the average-reward objective r̄<sub>π</sub> (the third metric of Chapter 9 exists precisely for this). “Casually setting γ to 1 for convenience” is the classic hidden bug of continuing tasks. ② <strong>Unbounded importance ratios</strong>: ρ = π/β can grow arbitrarily large when β samples an action that π almost never chooses — a single sample monopolises the gradient, and the update is hijacked by one stroke of luck. [Beyond the book] Practice often clips ρ at a ceiling; PPO’s truncated objective is exactly this idea, engineered.' },
    ],
  };

  /* ---- §10.5 总结 ---- */
  S['l10-summary'] = {
    kicker: 'L10 · §10.5',
    title: { zh: '本章总结 & 全书收官', en: 'Chapter Summary & The End of the Book' },
    blocks: [
      { t: 'p', zh: '本章四种 actor-critic：QAC（评论家用 TD 估 q，替代 MC 评分）→ A2C（减基线 v<sub>π</sub>，评分变成优势，方差骤降）→ off-policy 版（重要性采样复用旧数据）→ 确定性策略梯度（连续动作的钥匙）。它们共享同一个骨架：<strong>演员沿评论家的分数做梯度上升，评论家沿 TD 误差做梯度下降</strong>。', en: 'Four actor-critics this chapter: QAC (the critic estimates q by TD, replacing the MC grader) → A2C (subtract the baseline v<sub>π</sub>, scores become advantages, variance collapses) → the off-policy version (importance sampling reuses old data) → deterministic policy gradient (the key to continuous actions). All share one skeleton: <strong>the actor ascends the critic’s score; the critic descends its TD error</strong>.' },
      { t: 'p', zh: '全书收官回顾：L1 概念 → L2–L3 Bellman 方程与最优性 → L4 动态规划 → L5–L7 无模型（MC/TD/Sarsa/Q）→ L8 函数近似与 DQN → L9–L10 策略梯度与 Actor-Critic。两条主线贯穿始终：<strong>广义策略迭代</strong>（评估↔改进交替）与<strong>随机近似</strong>（带噪声的增量更新）。书的终点是文献的起点：SAC、TRPO、PPO、TD3、多智能体、基于模型、分布式 RL……地基已经打好，往上盖楼吧。', en: 'A closing tour: L1 concepts → L2–L3 Bellman equations and optimality → L4 dynamic programming → L5–L7 model-free (MC/TD/Sarsa/Q) → L8 function approximation and DQN → L9–L10 policy gradient and Actor-Critic. Two threads run through it all: <strong>generalised policy iteration</strong> (evaluation↔improvement alternating) and <strong>stochastic approximation</strong> (noisy incremental updates). Where the book ends, the literature begins: SAC, TRPO, PPO, TD3, multi-agent, model-based, distributional RL… the foundation is laid — go build on it.' },
      { t: 'steps', items: [
        { zh: '<strong>QAC</strong>：用 TD 评论家 q̂(s,a,w) 替掉 REINFORCE 的 G<sub>t</sub>——修"等回合 + 高方差"，代价是评分有偏（q̂ 不准）。', en: '<strong>QAC</strong>: replaces REINFORCE’s G<sub>t</sub> with a TD critic q̂(s,a,w) — fixes “episode-bound + high variance”, at the price of biased scores (q̂ is imperfect).' },
        { zh: '<strong>A2C</strong>：评分减去基线 v(s)、改用优势 δ——修"评分噪声大"（中心化白赚，方差再降），代价仍是有偏（v 不准）。', en: '<strong>A2C</strong>: subtracts the baseline v(s) from the score and switches to the advantage δ — fixes “noisy scores” (centring is free, variance drops again), still at the price of bias (imperfect v).' },
        { zh: '<strong>off-policy AC</strong>：重要性采样把 β 策略的经验折算回 π——修"数据必须新鲜"，代价是比值方差（裁剪可治）。', en: '<strong>Off-policy AC</strong>: importance sampling converts β-policy experience back into π’s expectation — fixes “data must be fresh”, at the price of ratio variance (treatable by clipping).' },
        { zh: '<strong>DPG</strong>：策略直接输出动作 μ(s,θ)——修"连续动作枚举不动"，代价是失去随机性（探索靠外挂的行为策略）。', en: '<strong>DPG</strong>: the policy outputs an action μ(s,θ) outright — fixes “continuous actions cannot be enumerated”, at the price of losing stochasticity (exploration outsourced to the behavior policy).' },
      ]},
      { t: 'callout', variant: 'done', zh: '<strong>离场自检（也是全书毕业考）。</strong>① 能说出 REINFORCE 的三个痛点与评论家如何逐一对症；② 能逐项解读 δ = r + γv(s′) − v(s) 并证明它的期望就是优势（当 v 准确时）；③ 能解释基线为什么白赚（概率守恒 Σ∇π=0）以及 v<sub>π</sub> 为何是最优基线；④ 能分辨 A2C 与 REINFORCE+baseline 在偏差-方差谱上的位置；⑤ 能把全书两条主线（GPI、随机近似）在 actor 和 critic 的两行更新里各自指出来。五题全过——十讲圆满，可以放心去读论文了。', en: '<strong>Exit self-check (also the book’s graduation exam).</strong> ① Name REINFORCE’s three pains and how the critic treats each; ② read δ = r + γv(s′) − v(s) term by term and show its expectation is the advantage (when v is accurate); ③ explain why baselines are free (probability conservation Σ∇π=0) and why v<sub>π</sub> is the optimal one; ④ locate A2C and REINFORCE+baseline on the bias–variance spectrum; ⑤ point out where the book’s two main threads (GPI, stochastic approximation) live inside the actor’s and critic’s two update lines. Pass all five — ten lectures complete, and the papers await with confidence.' },
      { t: 'widget', component: 'l10-ac-lab' },
      { t: 'callout', variant: 'done', zh: '<strong>恭喜读完</strong>：十讲全部可视化完毕。建议的复习路径：① 从首页课程索引重进每一课的“连贯长推理”；② 对照“代码精讲”亲手复现值迭代、Q-learning 和 REINFORCE；③ 回到作业（4×4 世界）把报告需要的图逐一画出来。', en: '<strong>Congratulations on finishing</strong>: all ten lectures are now visualised. Suggested review path: ① re-enter each lecture via its “long coherent reasoning” from the lecture index; ② reproduce value iteration, Q-learning and REINFORCE by hand against the code walkthroughs; ③ return to the assignment (the 4×4 world) and produce the figures your report needs.' },
    ],
  };

  /* ---- L10 长推理 ---- */
  S['l10-reasoning'] = {
    kicker: 'L10 · 贯通 · Synthesis',
    title: { zh: '连贯长推理：演员与评论家的分工史', en: 'The Long Coherent Reasoning: A History of the Actor–Critic Division of Labour' },
    blocks: [
      { t: 'p', zh: '本章推理链：REINFORCE 的 MC 评分贵 → 请 TD 评论家（QAC）→ 评分减基线 v(s) 变优势（A2C，方差骤降且不变性免费）→ off-policy 复用旧数据（重要性采样）→ 确定性策略（DPG 通向连续控制）→ SAC/PPO/TD3 的家谱。', en: 'This chapter’s spine: REINFORCE’s MC grading is dear → hire a TD critic (QAC) → subtract the baseline v(s) for advantages (A2C: variance collapses, invariance is free) → reuse old data off-policy (importance sampling) → deterministic policies (DPG toward continuous control) → the family tree of SAC/PPO/TD3.' },
      { t: 'widget', component: 'reasoning-lab', props: { source: 'l10' } },
    ],
  };

  /* ---- L10 代码 ---- */
  S['l10-code'] = {
    kicker: 'L10 · 动手 · Hands-on',
    title: { zh: '代码精讲：A2C 的完整骨架', en: 'Code Walkthrough: The Complete A2C Skeleton' },
    blocks: [
      { t: 'p', zh: 'A2C 的每一步 = 一行评论家更新（TD 误差修 v）+ 一行演员更新（优势推策略）。40 行以内，两个网络（或两张表）的全部爱恨情仇。', en: 'One step of A2C = one line of critic update (TD error fixes v) + one line of actor update (advantage pushes the policy). Within 40 lines, the entire love-hate story of two networks (or two tables).' },
      { t: 'p', zh: '读代码前先定位三个位置：两个学习率（α<sub>θ</sub> 管演员、α<sub>w</sub> 管评论家——上一节的"失衡"误区就藏在这两个数里）、δ 的计算行（一个数喂两张表，全文件的枢纽）、以及演员更新里 ∇lnπ 的写法（与 L9 的 REINFORCE 逐字相同——把 G 换成 δ 就是全部改动）。带着这三个锚点去读，40 行代码会自己讲解。', en: 'Before reading, pin down three locations: the two learning rates (α<sub>θ</sub> for the actor, α<sub>w</sub> for the critic — the “imbalance” misconception of the previous section hides inside these two numbers), the line computing δ (one number feeding two tables, the pivot of the whole file), and the ∇lnπ line in the actor update (verbatim identical to L9’s REINFORCE — swapping G for δ is the entire change). With these three anchors, the 40 lines will explain themselves.' },
      { t: 'widget', component: 'code-lab', props: { source: 'l10' } },
    ],
  };

  /* ---- L10 Q&A ---- */
  S['l10-qa'] = {
    kicker: 'L10 · §10.6',
    title: { zh: '问答：Actor-Critic 六连问', en: 'Q&A: Six Questions on Actor-Critic' },
    blocks: [
      { t: 'p', zh: '为什么需要评论家、基线为什么白赚、确定性策略怎么求导——收官六问。', en: 'Why a critic, why baselines are free, how deterministic policies differentiate — the closing six.' },
      { t: 'p', zh: '翻卡前先过三题：① "评论家和演员的学习率能共用一个吗"（不能——两个更新的尺度、噪声、收敛速度都不同，失衡即翻车）；② "δ 是优势本身吗"（不是——它是优势的单步采样代理，期望等于优势仅当 v 收敛，平时有偏但方差小）；③ "actor-critic 收敛到全局最优吗"（不保证——J(θ) 非凸、评分还在动，实践中以"稳定改进"为目标，理论缺口靠工程纪律补）。', en: 'Before flipping, run through three: ① “Can the critic and actor share one learning rate” (no — the two updates differ in scale, noise, and convergence speed; imbalance means a crash); ② “Is δ itself the advantage” (no — it is a one-step sample proxy whose expectation equals the advantage only once v has converged; biased in general, but low-variance); ③ “Does actor-critic converge to the global optimum” (not guaranteed — J(θ) is nonconvex and the scores keep moving; practice aims for “steady improvement”, and engineering discipline fills the theoretical gap).' },
      { t: 'widget', component: 'qa-lab', props: { source: 'l10' } },
    ],
  };

  /* ═══ L10 长推理链 ═══ */
  D.reasoningSets = D.reasoningSets || {};
  D.reasoningSets['l10'] = [
    { link: '起点 · Start',
      title: { zh: 'REINFORCE 的评分员太贵', en: 'REINFORCE’s grader is too expensive' },
      zh: 'MC 评分员 G_t：无偏但要等回合结束、方差巨大（整条轨迹的噪声全算在头上）。想象一位评论家要等电影全部放完才打分，而且打分全凭最后一幕的心情。',
      en: 'The MC grader G_t: unbiased but episode-bound, with enormous variance (an entire trajectory’s noise lands on one head). Imagine a critic who waits for the whole movie to end and rates it by the mood of the last scene.',
      question: '能不能有一位当场打分的评论家？' },
    { link: '请评论家 · Hire a critic',
      title: { zh: 'QAC：TD 误差就是评分修正', en: 'QAC: the TD error is the scoring correction' },
      zh: '评论家 q(s,a,w) 用 TD 学习现场估值（critic 更新）；演员用评论家的 q 值替代 REINFORCE 里的 G_t 做策略梯度（actor 更新）。方差骤降、单步更新、在线可学——广义策略迭代的无模型完成态。',
      en: 'The critic q(s,a,w) estimates values on the fly by TD (critic update); the actor replaces REINFORCE’s G_t with the critic’s q in the policy gradient (actor update). Variance collapses, per-step updates, online learning — generalised policy iteration completed model-free.',
      question: 'q 减去一个只依赖状态的函数，会变味吗？' },
    { link: '减基线 · Baseline',
      title: { zh: '基线免费：减 v(s) 得优势 A(s,a)', en: 'Baselines are free: subtract v(s) for the advantage A(s,a)' },
      zh: 'E[∇lnπ·b(S)] = 0 对任何 b(S) 成立（概率和恒 1、导数和恒 0）——基线随便减，期望不变。最优基线取 v_π(s)：评分从“绝对好坏”变成“超出平均多少”，方差进一步下降。A2C = advantage actor-critic。',
      en: 'E[∇lnπ·b(S)] = 0 for any b(S) (probabilities sum to one, so their gradient is zero) — subtract any baseline, the expectation is untouched. The optimal baseline is v_π(s): scores shift from “absolute goodness” to “surprise above average”, and variance falls further. A2C = advantage actor-critic.',
      question: '想用旧数据或别人的数据怎么办？' },
    { link: '复用 · Reuse',
      title: { zh: '重要性采样：off-policy 的通行证', en: 'Importance sampling: the off-policy pass' },
      zh: '比值 ρ = π/β 把 β 策略的经验折算回 π 的期望。代价：方差随轨迹长度增长。再进一步的 DPG 让策略直接输出动作 μ(s,θ)（连续动作的钥匙），梯度沿 ∇_a q 推动作。这一支的后人：DDPG、TD3。',
      en: 'The ratio ρ = π/β converts β-policy experience into π-policy expectation. The cost: ratio variance grows with trajectory length. A step further, DPG makes the policy output actions μ(s,θ) directly (the key to continuous control), pushing actions along ∇_a q. Descendants: DDPG, TD3.',
      question: null },
  ];

  /* ═══ L10 代码块 ═══ */
  const srcA2C = `import numpy as np

def softmax(h):
    e = np.exp(h - h.max())
    return e / e.sum()

def a2c(env, episodes=4000, gamma=0.9, alpha_theta=0.02, alpha_w=0.1,
        max_steps=200):
    """Advantage actor-critic (one-step, tabular).
    actor:  theta[s]  -- raw scores -> softmax policy  (the performer)
    critic: w[s]      -- state values v(s)             (the scorer)"""
    n, n_a = env.num_states, len(env.action_space)
    theta = np.zeros((n, n_a))
    w = np.zeros(n)
    for ep in range(episodes):
        s = env.reset()
        for t in range(max_steps):
            # ---- act by the current policy ----
            pi_s = softmax(theta[s])
            a = np.random.choice(n_a, p=pi_s)
            s2, r, done, _ = env.step(a)
            # ---- critic: TD error = advantage sample ----
            v_s2 = 0.0 if done else w[s2]
            delta = r + gamma * v_s2 - w[s]
            w[s] += alpha_w * delta                       # critic update
            # ---- actor: push the taken action by the advantage ----
            pi_s = softmax(theta[s])
            grad_ln_pi = -pi_s.copy(); grad_ln_pi[a] += 1.0
            theta[s] += alpha_theta * delta * grad_ln_pi   # actor update
            s = s2
            if done:
                break
    return theta, w`;

  D.codeFileSets = D.codeFileSets || {};
  D.codeFileSets['l10'] = [
    {
      id: 'l10-a2c-code', file: 'a2c.py — 优势演员评论家', tab: '① A2C',
      intro: { zh: 'A2C 每步只有两行更新：评论家 <code class="inline">w[s] += α_w·δ</code>（沿 TD 误差修正价值），演员 <code class="inline">theta[s] += α_θ·δ·∇lnπ</code>（同一个 δ 换个方向推策略）。对比 L9 的 REINFORCE：G_t 换成了 δ——从“整条轨迹的最终审判”变成“每一步的当庭修正”。', en: 'One A2C step is two update lines: the critic <code class="inline">w[s] += α_w·δ</code> (fixing values along the TD error) and the actor <code class="inline">theta[s] += α_θ·δ·∇lnπ</code> (the same δ pushes the policy). Against L9’s REINFORCE: G_t is replaced by δ — from “the final verdict of a whole trajectory” to “an on-the-spot correction every step”.' },
      code: srcA2C,
      notes: [
        { lines: [20, 22], tag: 'delta ★', zh: '<strong>δ = r + γv(s′) − v(s)</strong>：这一行身兼三职——它是评论家的 TD 误差、优势的单步样本、演员的推动力。一个量喂两张网络，这正是 actor-critic 的效率来源。', en: '<strong>δ = r + γv(s′) − v(s)</strong>: this one line holds three jobs — the critic’s TD error, the one-step sample of the advantage, and the actor’s driving force. One quantity feeds two networks: the efficiency source of actor-critic.' },
        { lines: [23, 23], tag: 'critic', zh: '评论家更新与 L7 的 TD(0) 完全同款——评论家就是"会打分的 TD"。它的收敛由 L6 的随机近似理论背书。', en: 'The critic update is identical to L7’s TD(0) — the critic is “a TD that grades”. Its convergence is vouched by L6’s stochastic approximation theory.' },
        { lines: [26, 28], tag: 'actor', zh: '演员更新与 L9 的 REINFORCE 同构，仅 G 换成 δ。对比记忆：REINFORCE 高方差无偏、必须等回合；A2C 有偏低方差、单步更新。基线 v(s) 减掉的正是"与动作无关的那部分评分噪声"。', en: 'The actor update is isomorphic to L9’s REINFORCE with G swapped for δ. Contrast: REINFORCE is high-variance, unbiased, episode-bound; A2C is biased, low-variance, per-step. The baseline v(s) removes exactly the score noise that has nothing to do with the action.' },
      ],
    },
  ];

  /* ═══ L10 Q&A ═══ */
  D.qaSets = D.qaSets || {};
  D.qaSets['l10'] = [
    { tag: 'Q1 · 补充', q: { zh: '为什么 Actor-Critic 需要"两个网络"？', en: 'Why does Actor-Critic need “two networks”?' },
      a: { zh: '演员（策略）负责行动与被优化；评论家（价值）负责给动作打分以降低梯度估计的方差。理论上一个就够（REINFORCE 用真实回报打分），但评论家换来的是低方差与单步更新——分工是最划算的工程。', en: 'The actor (policy) acts and gets optimised; the critic (value) scores actions to reduce the gradient-estimation variance. One could do without (REINFORCE scores with real returns), but the critic buys low variance and per-step updates — the division of labour is the cheapest engineering.' } },
    { tag: 'Q2 · 补充', q: { zh: '基线 b(S) 为什么"减了白减、不减白不减"？', en: 'Why is the baseline “free to subtract”?' },
      a: { zh: '因为 Σ<sub>a</sub>∇lnπ(a|s) = Σ<sub>a</sub>(onehot − π) = 0：概率对数梯度对动作求和恒为零，所以只依赖状态的 b(S) 乘上去期望恰为零。减去最优基线 v<sub>π</sub>(s) 后梯度变成优势的平均——方差最小。', en: 'Because Σ<sub>a</sub>∇lnπ(a|s) = Σ<sub>a</sub>(onehot − π) = 0: summed over actions the log-gradient vanishes, so any state-only b(S) contributes zero in expectation. Subtracting the optimal baseline v<sub>π</sub>(s) turns the gradient into an average of advantages — minimal variance.' } },
    { tag: 'Q3 · 补充', q: { zh: 'QAC、A2C、off-policy AC、DPG 的进化主线？', en: 'The evolutionary line of QAC → A2C → off-policy AC → DPG?' },
      a: { zh: '每一步都在修上一代的短板：QAC 用 TD 评分替代 MC（修"等回合+高方差"）；A2C 减基线（修"评分噪声大"）；off-policy 版用重要性采样复用旧数据（修"数据必须新鲜"）；DPG 干脆输出确定性动作（修"连续动作空间无法枚举"）。', en: 'Each step fixes the previous generation’s flaw: QAC grades by TD instead of MC (fixes “episode-bound + high variance”); A2C subtracts a baseline (fixes “noisy scores”); the off-policy version reuses old data via importance sampling (fixes “data must be fresh”); DPG outputs deterministic actions outright (fixes “continuous action spaces cannot be enumerated”).' } },
    { tag: 'Q4 · 补充', q: { zh: '全书两条主线在 Actor-Critic 里如何汇合？', en: 'How do the book’s two main threads converge in Actor-Critic?' },
      a: { zh: '<strong>广义策略迭代</strong>：演员的改进步 + 评论家的评估步每一步都在交替——正是 L4 框架的无模型形态。<strong>随机近似</strong>：评论家的 TD 更新、演员的 SGD 更新都是 L6 的增量式。加上 L8 的函数近似，Actor-Critic 是全书所有零件的总装。', en: '<strong>Generalised policy iteration</strong>: the actor’s improvement and the critic’s evaluation alternate every step — L4’s framework in model-free form. <strong>Stochastic approximation</strong>: the critic’s TD update and the actor’s SGD update are both L6’s incremental rules. With L8’s function approximation, Actor-Critic is the final assembly of every part in the book.' } },
    { tag: 'Q5 · 补充', q: { zh: '从这里通往现代算法（PPO/SAC 等）的路标？', en: 'What are the signposts from here to modern algorithms (PPO/SAC, etc.)?' },
      a: { zh: '方差治理：REINFORCE→A2C→GAE（多步优势）；trust region：TRPO/PPO（限制每步更新幅度防崩坏）；off-policy + 确定性：DPG→DDPG→TD3（连续控制）；随机策略正则：SAC（熵正则最大化探索）。另有模型基、多智能体、分布式 RL 等分支——本书的地基都在它们的地基里。', en: 'Variance governance: REINFORCE→A2C→GAE (multi-step advantages); trust regions: TRPO/PPO (bounding each update against collapse); off-policy + deterministic: DPG→DDPG→TD3 (continuous control); stochastic-policy regularisation: SAC (entropy-maximised exploration). Branches extend to model-based, multi-agent, and distributional RL — this book’s foundations underlie all of them.' } },
  ];


  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l10 = D.otherLectures.find(l => l.no === 10);
  if (l10) l10.done = true;
})();
