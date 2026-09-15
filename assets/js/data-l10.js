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
        tex: String.raw`\begin{gathered} \text{演员}：\htmlClass{fx-green}{\theta} \leftarrow \theta + \alpha_\theta \cdot \nabla_\theta\ln \pi(a_t\mid s_t,\theta) \cdot \htmlClass{fx-accent}{\hat{q}(s_t,a_t,w)}\\[2pt] \text{评论家}：\htmlClass{fx-gold}{w} \leftarrow w + \alpha_w \cdot \big[r + \gamma\hat{q}(s',a',w) - \hat{q}(s,a,w)\big] \cdot \nabla_w \hat{q}(s,a,w) \end{gathered}`,
        note: '（评论家的分——推动力）<br>（TD 误差——修正量）' },
      { t: 'steps', items: [
        { zh: '<strong>近似一：真值 → 估计</strong>。定理 9.1 要求的是 q<sub>π</sub>(s,a)；QAC 用函数近似的 q̂(s,a,w) 顶替（第 8 章的全部机器在此上岗）。评论家越准，演员的梯度越接近真策略梯度。', en: '<strong>Approximation one: truth → estimate.</strong> Theorem 9.1 demands q<sub>π</sub>(s,a); QAC stands the function-approximated q̂(s,a,w) in its place (all of Chapter 8’s machinery reports for duty here). The more accurate the critic, the closer the actor’s gradient to the true policy gradient.' },
        { zh: '<strong>近似二：期望 → 采样</strong>。梯度是期望，QAC 用当前交互到的单个 (s<sub>t</sub>,a<sub>t</sub>) 代替（L6 的 SGD 精神）。一步噪声换一步更新，划算。', en: '<strong>Approximation two: expectation → sample.</strong> The gradient is an expectation; QAC substitutes the single currently-visited (s<sub>t</sub>,a<sub>t</sub>) (L6’s SGD spirit). One step of noise buys one step of update — a fair trade.' },
        { zh: '<strong>近似三：最优 → "尽力"</strong>。梯度上升每步只走一小截，而 J(θ) 非凸——收敛到的是局部最优，"最优策略"名副其实地只是<strong>近似</strong>最优。三个近似各让一步，换来一个能跑、能在线、能持续学习的整体。', en: '<strong>Approximation three: optimal → “best effort”.</strong> Gradient ascent takes only a small step at a time, and J(θ) is nonconvex — what is reached is a local optimum, and the “optimal policy” is optimal only <strong>approximately</strong>, as the name honestly admits. Three approximations each concede a little, and together they buy a whole that runs, learns online, and never stops.' },
      ]},
      { t: 'p', zh: '<strong>每一步都在做最细粒度的广义策略迭代。</strong>回看 L4 的 GPI 骨架：策略评估与策略改进交替执行、互相成就。QAC 把"交替"的粒度压到<strong>单步</strong>：每个时间步里，评论家先用最新经验修正评分（评估半步），演员再沿新评分改进策略（改进半步）。评估不必收敛、改进不必彻底——两家都只前进一小格，长期看照样共同爬向最优。这是 GPI 思想在无模型、函数化世界的最终形态。', en: '<strong>Every step performs generalised policy iteration at its finest grain.</strong> Recall L4’s GPI skeleton: policy evaluation and policy improvement alternate, each propping up the other. QAC compresses the alternation to <strong>single steps</strong>: within every time step, the critic first corrects its scores with the freshest experience (an evaluation half-step), then the actor improves the policy along the updated scores (an improvement half-step). Evaluation need not converge, improvement need not be thorough — both advance by a small notch, yet over the long run they climb toward optimality together. This is GPI’s final form in a model-free, functional world.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"换评分员","en":"a new scorer","d":{"zh":"REINFORCE 的评分员是真实回报 Gt：无偏但要等整条轨迹、方差大；QAC 用 TD 现估的 q̂(s,a,w)。","en":"REINFORCE scores with the true return Gt — unbiased but episode-bound and noisy; QAC scores with the TD estimate q̂(s,a,w)."}},
        {"zh":"两行更新","en":"two update lines","d":{"zh":"演员 θ 沿 ∇θln π·q̂ 改进策略，评论家 w 按 TD 误差修正评分表——表演喂梯度，数据喂 TD。","en":"The actor θ improves along ∇θln π · q̂; the critic w corrects its scores by the TD error — performance feeds the gradient, data feeds the TD."}},
        {"zh":"单步 GPI","en":"single-step GPI","d":{"zh":"评估与改进的交替压缩到每个时间步：两家各进一小格，长期看照样共同爬向最优。","en":"The GPI alternation compresses into each time step: both sides advance a small notch and still climb toward optimality together."}},
        {"zh":"三个近似","en":"three approximations","d":{"zh":"真值→估计、期望→采样、最优→\"尽力\"：换来一个能跑、能在线、能持续学习的整体。","en":"Truth→estimate, expectation→sample, optimal→\"best effort\": the price of a whole that runs, learns online, and never stops."}},
      ] } },
    ],
  };

  /* ---- §10.2 A2C ---- */
  S['l10-a2c'] = {
    kicker: 'L10 · §10.2',
    title: { zh: 'A2C：减去基线，方差骤降', en: 'A2C: Subtract a Baseline, Watch the Variance Fall' },
    blocks: [
      { t: 'p', zh: '<strong>基线不变性（式 10.3）</strong>：策略梯度里给 q 减去任意一个只依赖状态的函数 b(S)，期望不变——因为 E[∇lnπ(S)·b(S)] = Σ<sub>s</sub>η(s)b(s)Σ<sub>a</sub>∇π(a|s) = 0（概率和恒为 1，导数为 0）。<strong>减错不了，白赚</strong>。最优的 b 是 v<sub>π</sub>(s)——减完剩下的恰好是<strong>优势（advantage）</strong>：', en: '<strong>Baseline invariance (Eq. 10.3)</strong>: subtracting any state-only function b(S) from q inside the policy gradient leaves the expectation unchanged — because E[∇lnπ(S)·b(S)] = Σ<sub>s</sub>η(s)b(s)Σ<sub>a</sub>∇π(a|s) = 0 (probabilities sum to one, so their gradient is zero). <strong>You cannot get it wrong, and it is free.</strong> The optimal b is v<sub>π</sub>(s) — subtracting it leaves exactly the <strong>advantage</strong>:' },
      { t: 'formula', lbl: '优势函数 · The advantage function',
        tex: String.raw`A_\pi(s,a) = q_\pi(s,a) - v_\pi(s)`,
        note: '= 这个动作比"平均水平"好多少' },
      { t: 'p', zh: '为什么 v<sub>π</sub>(s) 是最优基线？它让评分从"绝对好坏"变成"相对意外程度"：q 高于平均水平 → 正优势 → 多用；低于 → 少用。实践中用 TD 误差 δ = r + γv(s′) − v(s) 当优势的样本估计（单步、低方差），得到 <strong>A2C（Advantage Actor-Critic）</strong>。', en: 'Why is v<sub>π</sub>(s) the optimal baseline? It turns scores from “absolute goodness” into “relative surprise”: q above average → positive advantage → use more; below → less. In practice the TD error δ = r + γv(s′) − v(s) serves as the one-step, low-variance sample of the advantage, giving <strong>A2C (Advantage Actor-Critic)</strong>.' },
      { t: 'formula', lbl: 'δ 的隐藏身份 · The hidden identity of δ',
        tex: String.raw`\mathbb{E}[\delta_t \mid s_t=s, a_t=a] = \mathbb{E}[r + \gamma v_\pi(s')] - v_\pi(s) = \htmlClass{fx-accent}{q_\pi(s,a) - v_\pi(s) = A_\pi(s,a)}`,
        note: '（当 v 已收敛到 v<sub>π</sub> 时）' },
      { t: 'p', zh: '<strong>δ 作为优势代理的逐项读法。</strong>把 δ = r + γv(s′) − v(s) 拆成三段：<strong>r</strong> 是即时反馈（这一步实际拿到的）；<strong>γv(s′)</strong> 是"接下来的人生"按当前估值的折现（L7 自举的老朋友）；<strong>v(s)</strong> 是事前预期（待在这个状态本来就该值多少）。所以 δ 回答的问题是——<strong>"这次比预期好多少？"</strong>好于预期（δ&gt;0）→ 这个动作是惊喜，抬它的概率；不如预期（δ&lt;0）→ 压概率。推力的大小也自动校准：大惊喜大推、小惊喜小推。它不用等回合结束（单步可得）、不用另建优势网络（v 一个函数身兼两职）。v 不准时 δ 有偏——但 v(s) 与 v(s′) 的误差在相减中部分对消，比想象中扛造。', en: '<strong>Reading δ as an advantage proxy, term by term.</strong> Split δ = r + γv(s′) − v(s) into three parts: <strong>r</strong> is the immediate feedback (what this step actually earned); <strong>γv(s′)</strong> is “the rest of one’s life” discounted at current estimates (L7’s old friend, bootstrapping); <strong>v(s)</strong> is the prior expectation (what staying in this state was supposed to be worth). So δ answers the question — <strong>“how much better than expected was this?”</strong> Better than expected (δ&gt;0) → the action is a pleasant surprise, raise its probability; worse (δ&lt;0) → lower it. The push is self-calibrating: big surprises get big pushes, small ones small. No waiting for episode ends (available per step), no separate advantage network (one v function holds two jobs). When v is inaccurate δ is biased — but the errors of v(s) and v(s′) partly cancel in the subtraction, making it sturdier than it looks.' },
      { t: 'p', zh: '<strong>A2C 与 REINFORCE+baseline 是同一招的两个档位。</strong>两者都用"减基线"的中心化评分：REINFORCE+baseline 用 <strong>G<sub>t</sub> − b(s)</strong>——真实回报减基线，无偏但方差大、必须等回合；A2C 用 <strong>δ = r + γv(s′) − v(s)</strong>——把"整段真实回报"换成"一步真实 + 自举"，有偏但方差骤降、单步更新。偏差-方差的连续谱在这对兄弟身上再次现形（与 L7 的 n-step 谱完全同构）。【书外延伸】谱的中间点也有名有姓：用 n 步回报减基线（A2C 的 n-step 版），乃至把多档 n 步指数加权的 GAE——现代策略梯度方法的标配组件。', en: '<strong>A2C and REINFORCE+baseline are two gears of the same move.</strong> Both score with the centred “minus a baseline” signal: REINFORCE+baseline uses <strong>G<sub>t</sub> − b(s)</strong> — real return minus baseline, unbiased but high-variance and episode-bound; A2C uses <strong>δ = r + γv(s′) − v(s)</strong> — swapping “a whole stretch of real return” for “one real step plus bootstrapping”, biased but sharply lower-variance and per-step. The bias–variance spectrum reappears on this pair of siblings (exactly isomorphic to L7’s n-step spectrum). [Beyond the book] The middle of the spectrum also has names: n-step return minus baseline (the n-step A2C), up to GAE, the exponentially weighted blend of many n-step advantages — a standard component of modern policy-gradient methods.' },
      { t: 'callout', variant: 'warn', zh: '<strong>两个工程误区：失衡与抢跑。</strong>① <strong>actor/critic 学习率失衡</strong>：α<sub>θ</sub> 远大于 α<sub>w</sub>，演员在一张还没学明白的评分表上狂奔——梯度方向是噪声，策略越跑越偏，而评论家追不上修正；α<sub>w</sub> 远大于 α<sub>θ</sub> 则相反：评分表抖得厉害（每步都被单样本猛拉），演员无所适从。两个学习率要么同量级、要么 critic 略快——让评分先稳半拍。② <strong>critic 没热身，actor 先冲刺</strong>：训练初期 v 接近零、δ ≈ r——评分退化成"只看即时奖励"，演员会先学会一串短视动作。常见对策：前若干步只训评论家（或给 α<sub>θ</sub> 设 warm-up），等 δ 有了信息量再放开演员。', en: '<strong>Two engineering misconceptions: imbalance and false starts.</strong> ① <strong>Unbalanced actor/critic learning rates</strong>: with α<sub>θ</sub> far above α<sub>w</sub>, the actor sprints on a score sheet it has barely learned — gradient directions are noise, the policy veers off, and the critic cannot catch up to correct; with α<sub>w</sub> far above α<sub>θ</sub>, the score sheet jitters violently (yanked by every single sample) and the actor loses its bearings. Keep the two rates on the same order, or let the critic run slightly faster — the scores should steady themselves half a beat ahead. ② <strong>The critic not warmed up while the actor sprints</strong>: early in training v is near zero and δ ≈ r — scoring degenerates into “immediate reward only”, and the actor first learns a string of short-sighted moves. Common remedies: train the critic alone for the first stretch (or give α<sub>θ</sub> a warm-up), and release the actor once δ carries information.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"基线不变性","en":"baseline invariance","d":{"zh":"给 q 减去只依赖状态的 b(S)，策略梯度的期望不变——减错不了，白赚。","en":"Subtracting any state-only b(S) from q leaves the policy gradient's expectation unchanged — a free lunch."}},
        {"zh":"优势函数","en":"the advantage","d":{"zh":"最优的基线是 vπ(s)：评分从\"绝对好坏\"变成\"相对意外程度\"。","en":"The best baseline is vπ(s): scores turn from absolute goodness into relative surprise."}},
        {"zh":"δ 当优势代理","en":"δ as the proxy","d":{"zh":"δ = r + γv(s′) − v(s) 回答\"这次比预期好多少\"：单步可得、低方差，v 一个函数身兼两职。","en":"δ = r + γv(s′) − v(s) answers \"how much better than expected\": available every step, low variance, v doing double duty."}},
        {"zh":"两个工程误区","en":"two pitfalls","d":{"zh":"actor/critic 学习率失衡互相拖垮；critic 没热身就开跑，演员先学会一串短视动作。","en":"Mismatched actor/critic learning rates sabotage each other; an unwarmed critic lets the actor learn myopic moves first."}},
      ] } },
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
        tex: String.raw`\begin{gathered} \theta \leftarrow \theta + \alpha_\theta \cdot \htmlClass{fx-accent}{\rho_t} \cdot \nabla_\theta\ln \pi(a_t\mid s_t,\theta) \cdot \delta_t\\[2pt] \rho_t = \pi(a_t\mid s_t,\theta)\,/\,\beta(a_t\mid s_t) \end{gathered}`,
        note: '把 β 采的样本"折算"成 π 的期望' },
      { t: 'p', zh: '<strong>【书外延伸，助理解】A3C/A2C：并行也是一味药。</strong> on-policy 方法还有一个非算法层面的病：单环境串行采样，相邻样本高度相关（这一步的局势直接决定下一步）。<strong>A3C</strong>（Asynchronous Advantage Actor-Critic）的处方是"多开几个世界"：多个 worker 各自环境各自采样、异步把梯度推给共享参数——不同环境的样本天然去相关，还顺带压平了训练方差，也不再需要经验回放池。<strong>A2C</strong> 是它的同步版：所有 worker 走到同一节拍、攒一个大批量一起更新——去相关的收益保留，实现更简单、GPU 利用更充分。注意它们治的是"样本相关性"，与 off-policy 治的"数据过期"是两种病、两种药。', en: '<strong>[Beyond the book, for intuition] A3C/A2C: parallelism is also a medicine.</strong> On-policy methods suffer one further, non-algorithmic ailment: single-environment serial sampling makes adjacent samples strongly correlated (this step’s situation directly determines the next). <strong>A3C</strong> (Asynchronous Advantage Actor-Critic) prescribes “open more worlds”: multiple workers each sample their own environment and asynchronously push gradients to shared parameters — samples from different environments decorrelate naturally, training variance flattens along the way, and no replay buffer is needed. <strong>A2C</strong> is its synchronous sibling: all workers march to the same beat and pool one large batch per update — the decorrelation benefit stays, the implementation is simpler, and GPU utilisation improves. Note they treat “sample correlation”, a different disease from off-policy’s “stale data” — two diseases, two medicines.' },
      { t: 'callout', variant: 'danger', zh: '<strong>两个翻车现场。</strong>① <strong>连续任务忘记打折</strong>：γ=1 时折扣回报 G<sub>t</sub> 在持续任务里发散（无穷步奖励直接累加），REINFORCE 的更新式连定义都保不住；两条正路——要么老老实实 γ&lt;1，要么改用平均奖励 r̄<sub>π</sub> 目标（第 9 章的第三个度量正是为它准备的）。"顺手把 γ 设成 1 省事"是持续任务里最经典的隐性 bug。② <strong>重要性比值无界</strong>：ρ = π/β 在 β 采样到 π 几乎不选的动作时可以任意大——一条样本独占梯度，更新被单次运气劫持。【书外延伸】实战常给 ρ 裁剪（clip）上限，PPO 的截断目标正是这一思想的工程化。', en: '<strong>Two crash scenes.</strong> ① <strong>Forgetting to discount in continuing tasks</strong>: with γ=1 the discounted return G<sub>t</sub> diverges in continuing tasks (infinitely many rewards accumulate directly), and REINFORCE’s update cannot even stay defined; two proper roads — keep γ&lt;1 honestly, or switch to the average-reward objective r̄<sub>π</sub> (the third metric of Chapter 9 exists precisely for this). “Casually setting γ to 1 for convenience” is the classic hidden bug of continuing tasks. ② <strong>Unbounded importance ratios</strong>: ρ = π/β can grow arbitrarily large when β samples an action that π almost never chooses — a single sample monopolises the gradient, and the update is hijacked by one stroke of luck. [Beyond the book] Practice often clips ρ at a ceiling; PPO’s truncated objective is exactly this idea, engineered.' },
      { t: 'widget', component: 'concept-chain', props: { nodes: [
        {"zh":"重要性采样","en":"importance sampling","d":{"zh":"比值 ρ = π/β 给样本加权，把\"别的策略的经验\"折算回\"我的策略的期望\"——分布不同，权重来凑。","en":"The ratio ρ = π/β reweights samples, converting another policy's experience into my expectation — mismatched distributions patched by weights."}},
        {"zh":"代价：比值方差大","en":"the price","d":{"zh":"权重忽大忽小，轨迹越长越难算；实战常给 ρ 裁剪上限（PPO 的截断目标正是这一思想）。","en":"Weights swing wildly and long trajectories get unwieldy; practice clips ρ (PPO's clipped objective is exactly this idea)."}},
        {"zh":"确定性策略梯度","en":"DPG","d":{"zh":"策略直接输出动作 μ(s,θ)，沿 q 的山坡最陡处推动作；DDPG、TD3 都是这条线的后人。","en":"The policy outputs actions μ(s,θ) directly, pushed along q's steepest ascent; DDPG and TD3 descend from this line."}},
        {"zh":"持续任务的 γ","en":"γ when continuing","d":{"zh":"γ = 1 时折扣回报在持续任务里发散：要么老老实实 γ 小于 1，要么改用平均奖励目标。","en":"With γ = 1 discounted returns diverge in continuing tasks: keep γ below 1, or switch to the average-reward objective."}},
      ] } },
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
      { t: 'widget', component: 'notebook-bridge', props: { nb: 'nb6' } },
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
      { t: 'widget', component: 'fill-lab', props: { source: 'l10' } },
      { t: 'widget', component: 'derivation-lab', props: { source: 'l10' } },
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


  /* ═══ L10 知识填空 ═══ */
  D.fillSets = D.fillSets || {};
  D.fillSets['l10'] = {
    title: { zh: '第十讲 · 知识填充', en: 'Lecture 10 · Knowledge Fill-in' },
    items: [
      {
        kind: 'choice',
        tag: { zh: '分工 · 两行更新', en: 'Roles · two update lines' },
        stem: { zh: 'actor-critic 单循环里的分工：演员握着 [[1]]，负责行动、被推着改进；评论家握着 [[2]]，负责打分、被 TD 误差修正。每走一步两家各更一次——“整幕价值评估完再改策略”的老节奏就此作废。',
                en: 'The single-loop division of labour: the actor holds [[1]] and acts, pushed to improve; the critic holds [[2]] and scores, corrected by its own TD error. Both update once per step — the old rhythm of “evaluate a whole episode, then touch the policy” is retired.' },
        blanks: [
          { choices: [
              { zh: '策略 π(a|s,θ)', en: 'the policy π(a|s,θ)' },
              { zh: '价值函数 q̂(s,a,w)', en: 'the value function q̂(s,a,w)' },
              { zh: '真实回报 G_t', en: 'the true return G_t' },
            ], answer: 0,
            why: { zh: '演员是策略函数 π(a|s,θ)：沿 ∇θln π · q̂ 做梯度上升，评论家的分就是推力；评论家是价值函数 q̂(s,a,w)：沿 TD 误差 r + γq̂(s′,a′,w) − q̂ 做梯度下降，修正自己的评分表。两条更新在每个时间步里交替执行——QAC 把 L4 广义策略迭代的交替粒度压到了单步。G_t 是 REINFORCE 的评分员，评论家一登台它就退场了。', en: 'The actor is the policy function π(a|s,θ): it climbs along ∇θln π · q̂, with the critic’s score as the push. The critic is the value function q̂(s,a,w): it descends along the TD error r + γq̂(s′,a′,w) − q̂, correcting its own scoring table. The two updates alternate inside every time step — QAC compresses L4’s generalised policy iteration to the single-step grain. G_t was REINFORCE’s grader; it exits the moment the critic takes the seat.' } },
          { choices: [
              { zh: '价值函数 q̂(s,a,w)', en: 'the value function q̂(s,a,w)' },
              { zh: '策略 π(a|s,θ)', en: 'the policy π(a|s,θ)' },
              { zh: '折扣率 γ', en: 'the discount rate γ' },
            ], answer: 0,
            why: { zh: '打分的席位属于价值函数 q̂(s,a,w)：它给动作评分，自己的 TD 误差又兼任修正量。把席位给策略，两家职能就撞车——策略给自己打分，等于没有评分员；γ 只是双方共用的一个标量系数，不属于任何一方。', en: 'The scoring seat belongs to the value function q̂(s,a,w): it rates actions, and its own TD error doubles as the correction. Give the seat to the policy and the roles collide — a policy scoring itself means no grader at all; γ is a scalar coefficient shared by both sides, nobody’s property.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '自举目标', en: 'the bootstrap target' },
        stem: { zh: '评论家修正评分的 one-step target 取 [[1]]，δ = target − q̂(s,a,w) 单步可得；REINFORCE 的 [[2]] 则要等整条轨迹倒推，方差还大。',
                en: 'The critic’s one-step target is [[1]], so δ = target − q̂(s,a,w) is available every step; REINFORCE’s [[2]] must be traced back once the whole trajectory ends, variance riding along.' },
        blanks: [
          { choices: [
              { zh: 'r + γ·q̂(s′,a′,w)', en: 'r + γ·q̂(s′,a′,w)' },
              { zh: 'max q̂(s′,·,w)', en: 'max q̂(s′,·,w)' },
              { zh: 'G_t − b(s_t)', en: 'G_t − b(s_t)' },
            ], answer: 0,
            why: { zh: 'QAC 是 on-policy：target 沿实际采到的 (s,a,r,s′,a′) 记账，a′ 必须是当前策略真实采出的下一步。max q̂(s′,·,w) 是 Q-learning/DQN 的目标——off-policy 的最优读数，从不追问 a′ 是否真被采到；G_t − b(s_t) 是 REINFORCE+baseline 的评分，照样要等回合结束。', en: 'QAC is on-policy: the target books along the actually drawn (s,a,r,s′,a′), and a′ must be the next action the current policy really took. max q̂(s′,·,w) is Q-learning/DQN’s target — the off-policy optimal reading that never asks whether a′ was drawn; G_t − b(s_t) is REINFORCE+baseline’s score, still waiting for the episode to end.' } },
          { choices: [
              { zh: '整条回报 G_t', en: 'the whole-trajectory return G_t' },
              { zh: '即时奖励 r', en: 'the immediate reward r' },
              { zh: '优势 A(s,a)', en: 'the advantage A(s,a)' },
            ], answer: 0,
            why: { zh: 'REINFORCE 评分用真实回报 G_t：无偏，但更新押后到回合末，整条轨迹的运气全算在一个数上。r 单独当 target 是评论家没热身时的退化形态——v ≈ 0 时 δ ≈ r，评分塌缩成只看即时奖励；优势 A(s,a) 是 δ 收敛后的期望身份——它是 δ 长大后要当的角色，不是 target 本身。', en: 'REINFORCE scores with the true return G_t: unbiased, but updates wait for the episode’s end and a whole trajectory’s luck lands on one number. Using r alone as the target is the degenerate form of an unwarmed critic — with v ≈ 0, δ ≈ r and scoring collapses to the immediate reward; the advantage A(s,a) is δ’s expectation once converged — the role δ grows into, not the target itself.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '方差从哪降', en: 'where the variance falls' },
        stem: { zh: '评分员从 G_t 换成 q̂ 能把方差打下来，根本原因是 [[1]]；账单上多出的一项是 [[2]]。',
                en: 'Swapping the grader from G_t to q̂ slams the variance down because [[1]]; the extra item on the bill is [[2]].' },
        blanks: [
          { choices: [
              { zh: 'G_t 把从 t 到回合末的每一步运气叠乘在一个数上；q̂ 把下游所有随机性压缩成一个估计，噪声只剩这一步', en: 'G_t multiplies every step of luck from t to the episode’s end into one number, while q̂ compresses all downstream randomness into a single estimate — only this step’s noise remains' },
              { zh: 'q̂ 是对许多条轨迹的回报取平均，样本多了方差自然小', en: 'q̂ averages returns over many trajectories, so more samples naturally mean less variance' },
              { zh: 'q̂ 与 G_t 期望相同而方差更小，等于白赚', en: 'q̂ shares G_t’s expectation with smaller variance — a free lunch' },
            ], answer: 0,
            why: { zh: 'G_t 里装着三重运气：每步奖励的噪声、后续每个动作的采样、每个后继状态的转移——全部叠乘进一个数。q̂(s′,a′,w) 用一个读数顶替“下游的一切”，随机性只剩单步的 (r, s′, a′)。另两个说法都不成立：q̂ 一次只吃一个样本，不是多轨迹平均；自举恰恰牺牲了无偏，“期望相同”并不成立。', en: 'G_t packs a triple luck: per-step reward noise, the sampling of every later action, the transition into every later state — all folded into one number. q̂(s′,a′,w) stands in for “everything downstream” with a single reading, leaving only this step’s (r, s′, a′). The other two claims fail: q̂ swallows one sample at a time, it is no multi-trajectory average; and bootstrapping precisely trades away unbiasedness, so “same expectation” does not hold.' } },
          { choices: [
              { zh: '偏差——q̂ 不准时，target 跟着系统性地歪', en: 'bias — an inaccurate q̂ tilts the target systematically' },
              { zh: '更高的方差——自举把噪声逐层放大', en: 'even higher variance — bootstrapping amplifies the noise layer by layer' },
              { zh: '失去在线更新的能力', en: 'losing the ability to update online' },
            ], answer: 0,
            why: { zh: 'target 里的 q̂(s′,a′,w) 是估计值——拿估计估估计，偏差由此进门（L7 的老账）。两条缓解：q̂ 越准偏差越小（偏差会呼吸）；δ = r + γq̂(s′) − q̂(s) 的相减让两处价值误差部分对消。用方差换偏差，是偏差-方差谱上一次清醒的移动——与 L7 的 n-step 谱完全同构。', en: 'The q̂(s′,a′,w) inside the target is an estimate — estimating with estimates, so bias walks in (L7’s old ledger). Two reliefs: the bias shrinks as q̂ sharpens (bias breathes), and in δ = r + γq̂(s′) − q̂(s) the subtraction lets the two value errors partly cancel. Variance traded for bias: a deliberate move along the bias–variance spectrum, exactly isomorphic to L7’s n-step one.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '对比 REINFORCE', en: 'vs REINFORCE' },
        stem: { zh: '两代算法对账：REINFORCE 评分用 [[1]]，无偏但要等回合、方差大；QAC 评分用 TD 现估的 q̂(s,a,w)，能 [[2]]，代价是评分有偏。',
                en: 'Reconciling the two generations: REINFORCE scores with [[1]] — unbiased, but episode-bound and high-variance; QAC scores with the TD estimate q̂(s,a,w) and can [[2]], at the price of biased scores.' },
        blanks: [
          { choices: [
              { zh: '真实回报 G_t', en: 'the true return G_t' },
              { zh: 'TD 现估的 q̂(s,a,w)', en: 'the TD estimate q̂(s,a,w)' },
              { zh: '基线 b(s_t)', en: 'a baseline b(s_t)' },
            ], answer: 0,
            why: { zh: 'REINFORCE 的评分员是真实回报 G_t：期望恰为 q_π(s,a)，无偏；但要等整条轨迹、方差巨大，且每条 G 用完即弃。QAC 的痛点逐一对照：q̂ 每步被 TD 修正（不等回合）、只吃一步噪声（低方差）、跨回合持续积累（经验复用）。', en: 'REINFORCE’s grader is the true return G_t: its expectation is exactly q_π(s,a), unbiased; but it waits a whole trajectory, carries enormous variance, and each G is single-use. QAC treats the pains one by one: q̂ is corrected by TD every step (no waiting), swallows one step of noise (low variance), and accumulates across episodes (experience reuse).' } },
          { choices: [
              { zh: '每个时间步各更新一次演员与评论家', en: 'update both actor and critic at every time step' },
              { zh: '只在回合结束时更新一次', en: 'update once, only at the episode’s end' },
              { zh: '攒满一批整轨迹再统一更新', en: 'accumulate a full batch of whole trajectories, then update' },
            ], answer: 0,
            why: { zh: '每步两行更新：评论家先用最新 (s,a,r,s′,a′) 修评分（评估半步），演员再沿新评分改进策略（改进半步）——评估不必收敛、改进不必彻底，两家各进一小格。这是单步粒度的 GPI；REINFORCE 的更新只能押后到回合末，长回合与持续任务直接卡死。攒批整轨迹只改善统计效率，救不了“回合内无更新”。', en: 'Each step is two lines: the critic first corrects its scores with the freshest (s,a,r,s′,a′) (an evaluation half-step), then the actor improves along the new scores (an improvement half-step) — evaluation need not converge, improvement need not be thorough, both advance a small notch. This is GPI at single-step grain; REINFORCE must defer its update to the episode’s end, stalling on long episodes and continuing tasks. Batching whole trajectories only improves statistical efficiency — it cannot rescue “no updates mid-episode”.' } },
        ],
      },
      {
        kind: 'code',
        tag: { zh: 'code · δ 一行喂两张表', en: 'code · one δ feeds two tables' },
        stem: { zh: 'δ 是 a2c.py 全文件的枢纽——一个数喂两张表。把这一行的空补上：[[1]]',
                en: 'δ is the pivot of the whole a2c.py file — one number feeding two tables. Complete this line: [[1]]' },
        code: { zh: 'delta = r + gamma * [[1]] - q_w(s,a)',
                en: 'delta = r + gamma * [[1]] - q_w(s,a)' },
        blanks: [
          { choices: ['q_w(s_next, a_next)', 'G_t（整条回报）', 'max q_w(s_next, :)'], answer: 0,
            why: { zh: 'one-step target 用下一步动作价值的现估拼成：δ = r + γq̂(s′,a′,w) − q̂(s,a,w)。这一个 δ 喂两张表——评论家 w ← w + α_w·δ·∇w q̂（TD 误差修评分），演员 θ ← θ + α_θ·δ·∇ln π（同一个 δ 换个方向推策略）；演员那行与 L9 的 REINFORCE 逐字同构，仅 G 换成 δ。填 G_t 就退回整条轨迹评分，单步更新作废；填 max q_w(s_next, :) 是 Q-learning/DQN 的 off-policy 最优目标——QAC 是 on-policy，a′ 必须是策略实际采出的下一步。', en: 'The one-step target is assembled from the current estimate of the next action’s value: δ = r + γq̂(s′,a′,w) − q̂(s,a,w). One δ feeds two tables — the critic w ← w + α_w·δ·∇w q̂ (the TD error fixes the scores) and the actor θ ← θ + α_θ·δ·∇ln π (the same δ pushes the policy the other way); the actor’s line is verbatim L9’s REINFORCE with G swapped for δ. Fill in G_t and you are back to whole-trajectory scoring — per-step updates gone; fill in max q_w(s_next, :) and you have Q-learning/DQN’s off-policy optimal target — QAC is on-policy, a′ must be the action the policy actually drew.' } },
        ],
      },
      {
        kind: 'number',
        tag: { zh: '实验台 · 两个步长', en: 'ac-lab · two step sizes' },
        stem: { zh: '本讲 ac-lab 实验台默认 α_w = 0.10、α_θ = 0.05：评论家步长是演员的 [[1]] 倍——正合“两率同量级、critic 略快半拍”的工程建议。',
                en: 'This lecture’s ac-lab defaults to α_w = 0.10 and α_θ = 0.05: the critic’s step size is [[1]] times the actor’s — exactly the engineering advice “same order of magnitude, critic half a beat ahead”.' },
        blanks: [
          { answer: 2, tol: 0.01,
            hint: { zh: '0.10 ÷ 0.05', en: '0.10 ÷ 0.05' },
            why: { zh: '0.10 ÷ 0.05 = 2：评分先稳半拍，演员才不在一张乱表上狂奔。两个失衡方向各有病：α_θ ≫ α_w，梯度方向是噪声，策略越跑越偏；α_w ≫ α_θ，评分表每步被单样本猛拉，抖得演员无所适从。a2c.py 里这对数是 0.1 对 0.02（5 倍），同一个思想：critic 略快。', en: '0.10 ÷ 0.05 = 2: the scores steady themselves half a beat ahead, so the actor never sprints on a messy sheet. Each unbalanced direction has its own disease: α_θ ≫ α_w makes the gradient direction pure noise and the policy veers off; α_w ≫ α_θ lets every single sample yank the score sheet, leaving the actor without bearings. In a2c.py the pair is 0.1 vs 0.02 (5×) — the same idea: the critic runs slightly faster.' } },
        ],
      },
      {
        kind: 'number',
        tag: { zh: '折扣率 γ', en: 'the discount γ' },
        stem: { zh: 'a2c.py 与 ac-lab 实验台的折扣率都取 γ = [[1]]——持续任务里若顺手设成 1，折扣回报会发散，这是本讲点名的经典隐性 bug。',
                en: 'Both a2c.py and the ac-lab take the discount as γ = [[1]] — casually setting it to 1 in a continuing task makes the discounted return diverge: this lecture’s classic hidden bug.' },
        blanks: [
          { answer: 0.9, tol: 0.001,
            hint: { zh: '0 与 1 之间的一位小数', en: 'a one-decimal value between 0 and 1' },
            why: { zh: '两处都是 γ = 0.9：a2c.py 的函数默认参数，实验台 δ = r + 0.9·v(s′) − v(s) 的系数。γ < 1 把“接下来的人生”折现成有限数，自举 target 才有界；γ = 1 时持续任务的 G_t 是无穷步奖励的直接累加，REINFORCE 的更新式连定义都保不住——出路要么老实 γ < 1，要么改用第 9 章的平均奖励目标 r̄_π。', en: 'Both use γ = 0.9: a2c.py’s function default, and the coefficient inside the lab’s δ = r + 0.9·v(s′) − v(s). γ < 1 discounts “the rest of one’s life” into a finite number, keeping the bootstrap target bounded; with γ = 1 the continuing task’s G_t is a direct sum over infinitely many rewards and REINFORCE’s update cannot even stay defined — the two proper roads are an honest γ < 1, or Chapter 9’s average-reward objective r̄_π.' } },
        ],
      },
      {
        kind: 'choice',
        tag: { zh: '书外延伸·比值裁剪', en: 'beyond the book · ratio clipping' },
        stem: { zh: 'off-policy AC 里 ρ = π(a|s)/β(a|s) 可以无界：β 采到 π 几乎不选的动作时，比值能任意大，一条样本独占梯度。实战的对策是 [[1]]——PPO 把这一思想工程化成了截断目标。',
                en: 'In off-policy AC the ratio ρ = π(a|s)/β(a|s) is unbounded: when β draws an action π almost never chooses, the ratio can grow arbitrarily large and one sample monopolises the gradient. The practical remedy is [[1]] — PPO engineered this very idea into its clipped objective.' },
        blanks: [
          { choices: [
              { zh: '给 ρ 设裁剪上限（clip），摁住单次运气的权重', en: 'clip ρ at a ceiling, capping the weight of any single stroke of luck' },
              { zh: '把所有 ρ 归一化到 [0,1]，方差随之消失', en: 'normalise all ρ into [0,1], so the variance vanishes' },
              { zh: '直接丢弃 ρ 超限的样本，恢复无偏', en: 'drop the samples whose ρ exceeds the cap, restoring unbiasedness' },
            ], answer: 0,
            why: { zh: 'ρ 的病灶是“分布错位 × 轨迹长度”：β 越偏离 π、轨迹越长，权重越忽大忽小。裁剪上限保住“把 β 的经验折算回 π”的意图，同时摁住方差——代价是折算不再精确（有偏）。归一化会重排样本间的相对权重，丢样本则让重要性采样的期望修正失真，两者都不对症。PPO 的截断目标正是“不让单步更新被个别样本劫持”的工程化。', en: 'The ratio’s lesion is “distribution mismatch × trajectory length”: the further β strays from π and the longer the trajectory, the wilder the weights swing. A clip ceiling keeps the intent — converting β’s experience back into π’s expectation — while pinning down the variance, at the price of an imprecise conversion (bias). Normalising rearranges the samples’ relative weights, and dropping samples distorts the very expectation correction importance sampling exists to provide — neither addresses the disease. PPO’s clipped objective is exactly “no single sample hijacks an update”, engineered.' } },
        ],
      },
    ],
  };


  /* ═══ L10 定理推导 ═══ */
  D.derivationSets = D.derivationSets || {};
  D.derivationSets['l10'] = {
    title: { zh: '第十讲 · 定理推导', en: 'Lecture 10 · Theorem Derivations' },
    items: [
      /* ---- ① baseline 无偏性与方差缩减 ---- */
      {
        id: 'baseline-unbiased',
        name: { zh: '基线不变性：减了白减，方差还降', en: 'Baseline Invariance: Free to Subtract, Variance Falls' },
        intro: { zh: '给 REINFORCE 的评分 G 减去一个基线 b(s)，期望为什么一动不动？答案藏在一串五连等号里——概率和恒为 1，导数和恒为 0。本条完整走完式 10.3 的证明，并说清那个最容易踩的限制：b 只能依赖 s，不能依赖 a。', en: 'Subtracting a baseline b(s) from REINFORCE’s score G — why is the expectation untouched? The answer hides in a chain of five equalities: probabilities sum to one, so their gradients sum to zero. This derivation completes the proof of Eq. 10.3 and nails the subtle restriction: b may depend on s, never on a.' },
        steps: [
          { tex: String.raw`\nabla_\theta J(\theta) = \mathbb{E}\big[\,\htmlClass{fx-accent}{G}\cdot\nabla_\theta\ln\pi(A\mid S,\theta)\,\big]`,
            why: { zh: '<strong>起点（L9）</strong>：策略梯度定理给出 ∇<sub>θ</sub>J = E[∇<sub>θ</sub>ln π · q<sub>π</sub>]，REINFORCE 用单条轨迹的真实回报 G 当 q<sub>π</sub> 的无偏样本。G 没错——但整条轨迹的运气都乘在这一个评分上。', en: '<strong>Starting point (L9)</strong>: the policy gradient theorem gives ∇<sub>θ</sub>J = E[∇<sub>θ</sub>ln π · q<sub>π</sub>], and REINFORCE uses the single-trajectory return G as an unbiased sample of q<sub>π</sub>. Nothing wrong with G — except an entire trajectory’s luck multiplies into this one score.' } },
          { tex: String.raw`\nabla_\theta J(\theta) \;\stackrel{?}{=}\; \mathbb{E}\big[\big(G-\htmlClass{fx-gold}{b(s)}\big)\cdot\nabla_\theta\ln\pi(A\mid S,\theta)\big]`,
            why: { zh: '<strong>想法</strong>：把评分减去一个"参照值" b(s)，让 G 围绕它波动。波动小了，梯度估计还指向原方向吗？整条证明归结为一件事：多出来的第二项 E[b(s)·∇ln π] 是不是零。', en: '<strong>The idea</strong>: subtract a reference value b(s) so G oscillates around it. With less oscillation, does the gradient estimate still point the original way? The whole proof reduces to one question: is the extra term E[b(s)·∇ln π] zero?' } },
          { tex: String.raw`\mathbb{E}\big[(G-b)\,\nabla_\theta\ln\pi\big] \;=\; \underbrace{\mathbb{E}\big[G\,\nabla_\theta\ln\pi\big]}_{=\ \nabla_\theta J(\theta)} \;-\; \htmlClass{fx-gold}{\mathbb{E}\big[b(s)\,\nabla_\theta\ln\pi(A\mid s,\theta)\big]}`,
            why: { zh: '<strong>期望线性</strong>：拆成两项。第一项原封不动就是策略梯度；问题全部集中到染色的第二项——它是否恒等于 0。', en: '<strong>Linearity of expectation</strong>: split into two terms. The first is exactly the policy gradient; everything now hinges on the highlighted second term — whether it is identically 0.' } },
          { tex: String.raw`\mathbb{E}\big[b(s)\,\nabla_\theta\ln\pi\big] = \sum_s \eta_\pi(s)\,b(s)\sum_a \pi(a\mid s,\theta)\,\nabla_\theta\ln\pi(a\mid s,\theta)`,
            why: { zh: '<strong>全期望公式按状态展开</strong>：状态 s 服从策略的访问分布 η<sub>π</sub>，动作 a 服从 π(·|s)。b(s) 与动作无关，被原样乘在内层——记住这个"与动作无关"，它是后面一切特权的来源。', en: '<strong>Expand over states by total expectation</strong>: s follows the policy’s visiting distribution η<sub>π</sub>, a follows π(·|s). b(s) is action-independent and rides inside the inner sum — remember this independence, it is the source of every privilege to come.' } },
          { tex: String.raw`\sum_a \pi(a\mid s,\theta)\,\nabla_\theta\ln\pi(a\mid s,\theta) \;=\; ?`,
            why: { zh: '<strong>五连等号的枢纽</strong>：内层求和 Σ<sub>a</sub> π·∇ln π 等于什么？选出正确的第一步变换——选对它，剩下的链条自己走完。', en: '<strong>The hinge of the five-equality chain</strong>: what does the inner sum Σ<sub>a</sub> π·∇ln π equal? Pick the correct first transformation — get it right and the rest of the chain walks itself.' },
            blank: {
              q: { zh: '关键一步：内层求和等于——', en: 'The key move: the inner sum equals —' },
              choices: [
                { tex: String.raw`\sum_a \pi\,\nabla_\theta\ln\pi = \sum_a \nabla_\theta\pi(a\mid s,\theta)` },
                { tex: String.raw`\sum_a \pi\,\nabla_\theta\ln\pi = \nabla_\theta\ln\sum_a \pi(a\mid s,\theta)` },
                { tex: String.raw`\sum_a \pi\,\nabla_\theta\ln\pi = \Big(\sum_a \pi(a\mid s,\theta)\Big)\nabla_\theta\ln\pi(a\mid s,\theta)` },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确：链式法则 ∇ln x = ∇x / x，系数 π 恰好被约掉——逐项乘开，内层变成"对 ∇π 求和"。', en: 'Correct: the chain rule ∇ln x = ∇x / x cancels the π coefficient term by term — the inner sum becomes a sum of ∇π.' },
                { zh: 'ln 不能跨过求和号：Σ_a ln π ≠ ln Σ_a π，"先加再取对数再求导"不是链式法则——这一步没有任何恒等式撑腰。', en: 'The log cannot jump across the sum: Σ_a ln π ≠ ln Σ_a π; “add, then log, then differentiate” is not the chain rule — no identity backs this step.' },
                { zh: '∇ln π(a|s) 依赖动作 a，不是公因子，不能提到求和号外——能自由出入求和号的只有与 a 无关的量（比如 b(s)）。', en: '∇ln π(a|s) depends on the action a — it is no common factor and cannot be pulled out of the sum; only a-independent quantities (like b(s)) enjoy that freedom.' },
              ],
              hint: { zh: '对每一项用 ∇ln x = ∇x / x，看看系数去哪了。', en: 'Apply ∇ln x = ∇x / x to each term and watch where the coefficient goes.' },
            } },
          { tex: String.raw`\sum_a \pi\,\nabla_\theta\ln\pi \;=\; \sum_a \nabla_\theta\pi \;=\; \nabla_\theta\!\underbrace{\sum_a \pi(a\mid s,\theta)}_{=\,1} \;=\; \nabla_\theta 1 \;=\; \htmlClass{fx-green}{0}`,
            why: { zh: '<strong>五连等号</strong>：①E<sub>a~π</sub>[∇ln π] = Σ<sub>a</sub>π∇ln π（期望展开）；②链式法则约掉 π；③有限动作空间里求和与梯度交换；④概率归一化 Σ<sub>a</sub>π(a|s,θ) ≡ 1；⑤常数的梯度 = 0。每一环都只用初等事实——没有一处用到 b 或 G。', en: '<strong>The five equalities</strong>: ① E<sub>a~π</sub>[∇ln π] = Σ<sub>a</sub>π∇ln π (expand the expectation); ② the chain rule cancels π; ③ sum and gradient commute over finitely many actions; ④ normalization Σ<sub>a</sub>π(a|s,θ) ≡ 1; ⑤ the gradient of a constant is 0. Every link uses only elementary facts — none involves b or G.' } },
          { tex: String.raw`\mathbb{E}\big[b(s)\,\nabla_\theta\ln\pi\big] = \sum_s \eta_\pi(s)\,b(s)\cdot \htmlClass{fx-green}{0} = 0`,
            why: { zh: '<strong>第二项恒为零</strong>：内层是 0，外层乘什么都为 0——与 b 的取值无关、与状态分布 η<sub>π</sub> 无关。b(s) 可以任意选：常数、v̂(s)、任何只看状态的东西。', en: '<strong>The second term is identically zero</strong>: the inner sum is 0, so anything multiplying it is 0 — regardless of b’s values and of the state distribution η<sub>π</sub>. b(s) can be anything that looks only at the state: a constant, v̂(s), you name it.' } },
          { tex: String.raw`\nabla_\theta J(\theta) = \mathbb{E}\big[\big(G-b(s)\big)\cdot\nabla_\theta\ln\pi(A\mid S,\theta)\big] \qquad \forall\, b(s)`,
            why: { zh: '<strong>无偏性成立（式 10.3）</strong>：减去任何只依赖状态的基线，期望一动不动——"减了白减，不减白不减"。这就是 REINFORCE with baseline 的合法性证明。', en: '<strong>Unbiasedness holds (Eq. 10.3)</strong>: subtract any state-only baseline and the expectation does not move — “free to subtract, wasteful not to”. This is precisely the licence of REINFORCE with baseline.' } },
          { tex: String.raw`b = b(s,a)\ (\text{依赖 } a) \;\Rightarrow\; \sum_a b(s,a)\,\pi\,\nabla_\theta\ln\pi = \nabla_\theta\underbrace{\sum_a b(s,a)\,\pi(a\mid s,\theta)}_{\neq\,\text{常数}} \;\neq\; 0`,
            why: { zh: '<strong>关键限制</strong>：b 一旦依赖 a，就必须留在动作求和号内——Σ<sub>a</sub>b(s,a)π(a|s) 不再是"常数 × Σ<sub>a</sub>π"，而是随 θ 变动的 E[b|s]，其梯度一般非零。第二项不再消失，期望被系统性带偏。<strong>b 与动作无关，才享有滑出梯度的特权。</strong>', en: '<strong>The key restriction</strong>: once b depends on a it must stay inside the action sum — Σ<sub>a</sub>b(s,a)π(a|s) is no longer “a constant times Σ<sub>a</sub>π” but the θ-dependent E[b|s], whose gradient is generally nonzero. The second term no longer vanishes and the expectation is systematically tilted. <strong>Only an action-independent b enjoys the privilege of slipping out of the gradient.</strong>' },
            blank: {
              q: { zh: '五连等号哪一环被 b(s,a) 破坏？', en: 'Which link of the five-equality chain does b(s,a) break?' },
              choices: [
                { zh: '「∇Σ_a π = ∇1 = 0」那一环：b(s,a) 困在求和号里，Σ_a b(s,a)π ≠ 常数 × 1，梯度不再为零', en: 'The link ∇Σ_a π = ∇1 = 0: b(s,a) is trapped inside the sum, Σ_a b(s,a)π ≠ constant × 1, and the gradient no longer vanishes' },
                { zh: '「π∇ln π = ∇π」那一环：log-derivative 恒等式对含 b 的乘积失效', en: 'The link π∇ln π = ∇π: the log-derivative identity fails on products involving b' },
                { zh: '哪一环都不破坏——b(s,a) 同样让第二项为零', en: 'None breaks — b(s,a) also zeroes the second term' },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确：恒等式逐项成立的部分都还在，断掉的是"代入 Σ_a π = 1"这步——b(s,a) 挡住了归一化的路。', en: 'Correct: the term-by-term identities survive; what snaps is the substitution Σ_a π = 1 — b(s,a) blocks the road to normalization.' },
                { zh: 'π∇ln π = ∇π 是逐动作成立的链式法则，与 b 毫无关系——b 只是乘在每个 ∇π 前面的系数，恒等式照常成立。', en: 'π∇ln π = ∇π is the chain rule applied per action, utterly independent of b — b merely scales each ∇π, and the identity holds as usual.' },
                { zh: '若 b 依赖 a，第二项 = Σ_s η(s)·∇_θ E[b(S,·)|s]，一般不为零——评分被系统性扭曲，方向就偏了。', en: 'With b depending on a, the second term becomes Σ_s η(s)·∇_θ E[b(S,·)|s], generally nonzero — the score is systematically distorted and the direction tilts.' },
              ],
              hint: { zh: '想想 Σ_a b(s,a)π(a|s) 还能化简成 b(s) 吗？', en: 'Ask yourself: can Σ_a b(s,a)π(a|s) still collapse to b(s)?' },
            } },
          { tex: String.raw`\mathrm{Var}\big[(G-b(s))\,\nabla_\theta\ln\pi\big] \;\ll\; \mathrm{Var}\big[G\,\nabla_\theta\ln\pi\big] \quad \text{当 } b(s)\approx \mathbb{E}[G\mid s]`,
            why: { zh: '<strong>方差为什么降</strong>：G 的波动 = "该状态本身的水平" + "相对这个水平的意外"。前者与动作无关、对区分动作毫无信息量，却原样乘进梯度；b(s) 恰好把这层吸收掉，剩下的 (G−b) 只含意外成分。方向（期望）没变，噪声小了。', en: '<strong>Why the variance falls</strong>: G’s fluctuation = “the level of this state” + “the surprise relative to that level”. The former is action-independent, carries zero information for discriminating actions, yet multiplies straight into the gradient; b(s) absorbs exactly that layer, leaving (G−b) with only the surprise. The direction (expectation) is unchanged — the noise is not.' } },
          { tex: String.raw`b(s) = v_\pi(s) \;\Longrightarrow\; \mathbb{E}[\,G-b(s)\mid s,a\,] = q_\pi(s,a)-v_\pi(s) = \htmlClass{fx-gold}{A_\pi(s,a)}`,
            why: { zh: '<strong>书推荐的简洁基线</strong>：取 b = v<sub>π</sub>(s)——减去"这个状态的平均水平"，评分的期望恰好变成优势 A。直觉版最优：减均值；加权形式的最优解不在此展开。这正是下一条推导里 A2C 的入口。', en: '<strong>The book’s recommended concise baseline</strong>: take b = v<sub>π</sub>(s) — subtract “the average level of this state”, and the score’s expectation becomes exactly the advantage A. Intuition-grade optimum: subtract the mean; the weighted-form optimum is not expanded here. This is the doorway into A2C in the next derivation.' } },
          { tex: String.raw`\underbrace{\mathbb{E}\big[(G-b)\,\nabla_\theta\ln\pi\big]}_{\text{方向不变（无偏）}} = \nabla_\theta J(\theta), \qquad \underbrace{\mathrm{Var}\big[(G-b)\,\nabla_\theta\ln\pi\big]}_{\text{噪声变小（训练稳）}} \;\downarrow`,
            why: { zh: '<strong>收尾</strong>：无偏性保住"平均而言走对方向"，方差降让"每一步都少绕弯"——两者合起来，同样的样本量换来可靠得多的梯度，学习率才敢放开脚步。', en: '<strong>Closing</strong>: unbiasedness guarantees “right direction on average”; the variance drop means “fewer detours each step” — together, the same sample budget buys a far more reliable gradient, and the learning rate can finally loosen up.' } },
          { tex: String.raw`\text{REINFORCE} \;\xrightarrow{\;-\,b(s)\;}\; \text{REINFORCE with baseline} \;\xrightarrow{\;G-b\ \Rightarrow\ \delta\;}\; \text{A2C}`,
            why: { zh: '<strong>闭合卡</strong>：本条证完"减基线免费"。下一条把 G−b 进一步换成 TD 误差 δ——不用等回合、单步可得，Actor-Critic 正式登场。NB6 将用 numpy 复现这次消融：均值不动，方差塌下去。', en: '<strong>Closing card</strong>: “baselines are free” is now proved. The next derivation swaps G−b further for the TD error δ — no waiting for episode ends, available every step — and Actor-Critic takes the stage. NB6 reproduces this ablation in numpy: the mean stays put, the variance collapses.' } },
        ],
      },
      /* ---- ② 从 REINFORCE 到 Actor-Critic ---- */
      {
        id: 'reinforce-to-ac',
        name: { zh: '从 REINFORCE 到 Actor-Critic：δ 替真实回报', en: 'From REINFORCE to Actor-Critic: δ Replaces the Real Return' },
        intro: { zh: 'REINFORCE 的评分员 G_t 无偏但贵：要等整条轨迹、方差巨大。本条走完两次替换（G→q_π，再减 v_π 得优势）与一次自举（TD 误差 δ 估计优势），同一个 δ 喂演员和评论家两张表——Actor-Critic 的全部来历。', en: 'REINFORCE’s grader G_t is unbiased but dear: episode-bound and enormous variance. This derivation walks the two substitutions (G→q_π, then −v_π for the advantage) and one act of bootstrapping (the TD error δ estimating the advantage) — one δ feeding both the actor’s and the critic’s tables: the entire origin story of Actor-Critic.' },
        steps: [
          { tex: String.raw`\theta \leftarrow \theta + \alpha\,\htmlClass{fx-accent}{G_t}\cdot\nabla_\theta\ln\pi(a_t\mid s_t,\theta)`,
            why: { zh: '<strong>起点（L9 REINFORCE）</strong>：评分用真实回报 G<sub>t</sub>——E[G<sub>t</sub>|s<sub>t</sub>,a<sub>t</sub>] = q<sub>π</sub>，无偏。代价在下一步数。', en: '<strong>Starting point (L9 REINFORCE)</strong>: the score is the real return G<sub>t</sub> — E[G<sub>t</sub>|s<sub>t</sub>,a<sub>t</sub>] = q<sub>π</sub>, unbiased. The price is counted in the next step.' } },
          { tex: String.raw`G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots \qquad (\text{回合结束才可算})`,
            why: { zh: '<strong>两个痛点</strong>：①G<sub>t</sub> 要等轨迹末端才能倒推——长回合与持续任务里回合内零更新；②从 t 到末端每一步的运气（奖励噪声、动作采样、状态转移）全部叠乘进一个评分——方差巨大，学习率被迫保守。', en: '<strong>Two pains</strong>: ① G<sub>t</sub> can only be traced back once the trajectory ends — zero updates mid-episode for long or continuing tasks; ② every stroke of luck from t to the end (reward noise, action sampling, state transitions) multiplies into one score — enormous variance forces conservative learning rates.' } },
          { tex: String.raw`\mathbb{E}\big[G_t \mid s_t=s,\ a_t=a\big] = \htmlClass{fx-accent}{q_\pi(s,a)}`,
            why: { zh: '<strong>替换 1 的资格</strong>：回报的条件期望就是动作价值——把"含噪样本 G<sub>t</sub>"换成"它自己的条件均值"，信息一点不丢。这一步凭什么合法？下一步的塔性质作答。', en: '<strong>The credentials of substitution one</strong>: the conditional expectation of the return is exactly the action value — swapping the “noisy sample G<sub>t</sub>” for “its own conditional mean” loses no information. What licenses this? The tower property answers next.' } },
          { tex: String.raw`\mathbb{E}[G_t] = \mathbb{E}\big[\,\htmlClass{fx-accent}{\text{?}}\,\big]`,
            why: { zh: '<strong>塔性质（全期望公式）</strong>：先对 (s,a) 取条件期望、再对 (s,a) 的分布取期望，等于直接取期望。于是 E[G<sub>t</sub>·∇ln π] = E[q<sub>π</sub>(s<sub>t</sub>,a<sub>t</sub>)·∇ln π]——评分被平滑，期望纹丝不动；再由条件方差公式，方差只会降。', en: '<strong>The tower property (law of total expectation)</strong>: take the conditional expectation over (s,a) first, then the expectation over the distribution of (s,a) — the result equals the plain expectation. Hence E[G<sub>t</sub>·∇ln π] = E[q<sub>π</sub>(s<sub>t</sub>,a<sub>t</sub>)·∇ln π]: the score is smoothed, the expectation untouched; by the conditional variance formula, the variance only falls.' },
            blank: {
              q: { zh: '把 G_t 换成 q_π(s_t,a_t)，总体期望为什么不动？', en: 'Why does swapping G_t for q_π(s_t,a_t) leave the overall expectation unchanged?' },
              choices: [
                { tex: String.raw`\mathbb{E}[G_t] = \mathbb{E}\big[\,\mathbb{E}[G_t \mid s_t,\ a_t]\,\big]` },
                { zh: '大数定律：样本足够多时 G_t 的均值收敛到 q_π', en: 'Law of large numbers: with enough samples the mean of G_t converges to q_π' },
                { zh: '独立性：G_t 与 (s_t,a_t) 独立，替换不改分布', en: 'Independence: G_t is independent of (s_t,a_t), so the swap changes nothing' },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确：这是对分布逐点成立的恒等式，与样本量无关——条件期望再求期望，恰好绕回原期望。', en: 'Correct: this is a distribution-level identity holding pointwise, independent of sample size — an expectation of a conditional expectation lands exactly back on the original.' },
                { zh: '大数定律说的是"样本均值收敛到期望"，是采样层面的渐近性质；这里的替换要的是恒等式——单次替换也成立，不需要"样本多"。答它等于把无偏和一致混为一谈。', en: 'The law of large numbers says “sample means converge to the expectation” — an asymptotic, sampling-level fact; the swap here needs an identity, valid even for a single replacement, no “many samples” required. Choosing it confuses unbiasedness with consistency.' },
                { zh: '恰恰相反：G_t 强依赖 (s_t,a_t)——在这个状态做这个动作，回报的分布随之而变。若真独立，q_π(s,a) 就与 s,a 无关，策略梯度也无须分动作了。', en: 'Quite the opposite: G_t depends strongly on (s_t,a_t) — do this action in this state and the return’s distribution shifts. If they were independent, q_π(s,a) would not depend on s or a, and the policy gradient would need no actions at all.' },
              ],
              hint: { zh: '条件期望的"套娃"怎么拆？E[E[X|Y]] 等于什么？', en: 'How does the nested expectation collapse? What is E[E[X|Y]]?' },
            } },
          { tex: String.raw`\nabla_\theta J(\theta) = \mathbb{E}\big[\,\htmlClass{fx-accent}{q_\pi(s_t,a_t)}\cdot\nabla_\theta\ln\pi(a_t\mid s_t,\theta)\,\big]`,
            why: { zh: '<strong>替换 1 落地</strong>：策略梯度定理的标准形式。QAC 就是用 TD 学出的 q̂(s,a,w) 顶替 q<sub>π</sub>——评论家第一次上岗。但 q<sub>π</sub> 本身未知，这个坑第 8 步回来填。', en: '<strong>Substitution one lands</strong>: the standard form of the policy gradient theorem. QAC stands the TD-learned q̂(s,a,w) in for q<sub>π</sub> — the critic’s first day on the job. But q<sub>π</sub> itself is unknown; that pit is revisited at step 8.' } },
          { tex: String.raw`\nabla_\theta J(\theta) = \mathbb{E}\big[\big(\htmlClass{fx-accent}{q_\pi(s,a)}-\htmlClass{fx-gold}{v_\pi(s)}\big)\cdot\nabla_\theta\ln\pi\big]`,
            why: { zh: '<strong>替换 2：减基线</strong>。上一条已证 E[b(s)·∇ln π] = 0（Σ<sub>a</sub>π∇ln π = ∇Σ<sub>a</sub>π = 0）——任何只依赖 s 的 b 都免费。取最优候选 b = v<sub>π</sub>(s)。', en: '<strong>Substitution two: the baseline</strong>. The previous derivation proved E[b(s)·∇ln π] = 0 (Σ<sub>a</sub>π∇ln π = ∇Σ<sub>a</sub>π = 0) — any state-only b is free. Take the optimal candidate b = v<sub>π</sub>(s).' } },
          { tex: String.raw`A_\pi(s,a) \;\triangleq\; q_\pi(s,a)-v_\pi(s) \;=\; \mathbb{E}[G_t\mid s,a]-\mathbb{E}[G_t\mid s]`,
            why: { zh: '<strong>优势函数登场</strong>：减完剩下的 = 这个动作比"该状态平均水平"好多少。中心化把与动作无关的评分分量全部吸收——方差再降一档，方向依旧无偏。', en: '<strong>Enter the advantage</strong>: what remains = how much better this action is than “this state’s average”. Centring absorbs every action-independent component of the score — one more notch of variance down, the direction still unbiased.' } },
          { tex: String.raw`q_\pi(s,a) = \,?\,, \qquad v_\pi(s) = \,?\, \qquad (\text{model-free：两个期望都算不出})`,
            why: { zh: '<strong>现实一击</strong>：优势的两侧都是真值期望——无模型设定下没有 p(s′|s,a)、p(r|s,a) 可供枚举。需要一个<strong>单步采样就能得到</strong>的替代品。', en: '<strong>Reality strikes</strong>: both sides of the advantage are true expectations — in the model-free setting there is no p(s′|s,a) or p(r|s,a) to enumerate. We need a surrogate <strong>computable from a single step</strong>.' } },
          { tex: String.raw`\delta_t \;\triangleq\; R_{t+1}+\gamma\,v(s_{t+1})-v(s_t)`,
            why: { zh: '<strong>TD 误差登场（L7 老朋友）</strong>：只用一步转移 (r, s′) 和当前价值表 v——不用模型、不用等回合。接下来三步论证它的条件期望恰好是优势。', en: '<strong>Enter the TD error (L7’s old friend)</strong>: it needs only the one-step transition (r, s′) and the current value table v — no model, no waiting. The next three steps argue its conditional expectation is exactly the advantage.' } },
          { tex: String.raw`\mathbb{E}[\delta_t\mid s_t=s,\ a_t=a] = \mathbb{E}[R_{t+1}\mid s,a] + \gamma\,\mathbb{E}[\,v(s_{t+1})\mid s,a\,] - v(s)`,
            why: { zh: '<strong>核心论证 · 拆项</strong>：条件期望线性，三项分开处理；−v(s) 在条件下是常数，原样保留。剩下两个条件期望是标准的"一步模型读数"。', en: '<strong>The core argument · split</strong>: conditional expectation is linear — handle the three terms separately; −v(s) is constant under the conditioning and stays as is. The two remaining conditional expectations are the standard “one-step model readings”.' } },
          { tex: String.raw`\mathbb{E}[R_{t+1}\mid s,a] = \,?\, \qquad \mathbb{E}[\,v(s_{t+1})\mid s,a\,] = \,?`,
            why: { zh: '<strong>核心论证 · 一步读数</strong>：奖励的条件均值就是一步奖励 r(s,a)；下一状态按 p(s′|s,a) 撒开，v(s′) 的期望是对所有 s′ 的转移加权平均——这两块正是 q<sub>π</sub> 的 Bellman 方程零件。', en: '<strong>The core argument · one-step readings</strong>: the conditional mean of the reward is the one-step reward r(s,a); the next state spreads over p(s′|s,a), so the expectation of v(s′) is the transition-weighted average over all s′ — exactly the parts of q<sub>π</sub>’s Bellman equation.' },
            blank: {
              q: { zh: '两个条件期望的标准读数分别是？', en: 'What are the standard readings of the two conditional expectations?' },
              choices: [
                { tex: String.raw`\mathbb{E}[R_{t+1}\mid s,a] = r(s,a), \quad \mathbb{E}[v(s_{t+1})\mid s,a] = \sum_{s'} p(s'\mid s,a)\,v(s')` },
                { tex: String.raw`\mathbb{E}[R_{t+1}\mid s,a] = r(s,a), \quad \mathbb{E}[v(s_{t+1})\mid s,a] = v(s)` },
                { tex: String.raw`\mathbb{E}[R_{t+1}\mid s,a] = G_t, \quad \mathbb{E}[v(s_{t+1})\mid s,a] = q_\pi(s,a)` },
              ],
              answer: 0,
              whyWrong: [
                { zh: '正确：一步奖励的均值是 r(s,a)；下一状态按转移核 p(s′|s,a) 分布，对 v(s′) 做加权平均——这就是 q 的 Bellman 展开式。', en: 'Correct: the one-step reward’s mean is r(s,a); the next state follows the transition kernel p(s′|s,a), so v(s′) is averaged against it — exactly q’s Bellman expansion.' },
                { zh: 'E[v(s′)|s,a] 不是 v(s)：给定 (s,a) 后下一状态一般会变，必须对所有 s′ 加权平均——填 v(s) 等于假设"状态原地不动"。', en: 'E[v(s′)|s,a] is not v(s): given (s,a) the next state generally moves, and v(s′) must be averaged over all s′ — filling in v(s) assumes “the state never moves”.' },
                { zh: 'E[R_{t+1}|s,a] 是单步奖励的均值，不是整条回报 G_t；E[v(s′)|s,a] 是状态价值的平均，不是动作价值 q——这一组把不同时间尺度的量混在了一起。', en: 'E[R_{t+1}|s,a] is the mean of the one-step reward, not the whole return G_t; E[v(s′)|s,a] averages state values, not the action value q — this pair mixes quantities from different time scales.' },
              ],
              hint: { zh: '一个只看"这一步的奖励"，一个要对"下一步去哪"加权。', en: 'One reads only “this step’s reward”; the other weights “where the next step lands”.' },
            } },
          { tex: String.raw`\mathbb{E}[\delta_t\mid s,a] = \underbrace{r(s,a)+\gamma\!\sum_{s'} p(s'\mid s,a)\,v_\pi(s')}_{=\ q_\pi(s,a)\ \text{（Bellman）}} -\, v_\pi(s) \;=\; \htmlClass{fx-accent}{A_\pi(s,a)}`,
            why: { zh: '<strong>核心论证 · 合并</strong>：前两项拼成 q<sub>π</sub> 的 Bellman 方程（L5：q<sub>π</sub> = r + γΣp·v<sub>π</sub>），再减 v<sub>π</sub>(s) 恰得优势。当 v 尚未收敛，E[δ|s,a] ≈ A——δ 是优势的<strong>有偏、单步可得</strong>的样本。', en: '<strong>The core argument · merge</strong>: the first two terms assemble q<sub>π</sub>’s Bellman equation (L5: q<sub>π</sub> = r + γΣp·v<sub>π</sub>); subtracting v<sub>π</sub>(s) yields exactly the advantage. Before v converges, E[δ|s,a] ≈ A — δ is a <strong>biased, per-step-available</strong> sample of the advantage.' } },
          { tex: String.raw`\begin{gathered} \text{actor}: \theta \leftarrow \theta + \alpha_\theta\,\htmlClass{fx-accent}{\delta_t}\cdot\nabla_\theta\ln\pi(a_t\mid s_t,\theta)\\[2pt] \text{critic}: w \leftarrow w + \alpha_w\,\htmlClass{fx-accent}{\delta_t}\cdot\nabla_w v(s_t,w) \end{gathered}`,
            why: { zh: '<strong>Actor-Critic 更新对：一箭双雕</strong>。同一个 δ 喂两张表——演员把它当优势的样本（推策略），评论家把它当自己的 TD 误差（修价值表）。这就是 A2C 的两行更新，与 a2c.py 逐行对应。', en: '<strong>The Actor-Critic update pair: one arrow, two targets</strong>. The same δ feeds two tables — the actor reads it as a sample of the advantage (pushing the policy), the critic as its own TD error (fixing the value table). These are A2C’s two lines, matching a2c.py line for line.' } },
          { tex: String.raw`\text{actor} = \pi(a\mid s,\theta)\ \text{（表演）}, \qquad \text{critic} = \hat v(s,w)\ \text{（打分）}`,
            why: { zh: '<strong>名字的由来</strong>：演员上台表演——行动、被优势推着改进；评论家台下打分——评分、被 TD 误差纠错。每个时间步都是"评估半步 + 改进半步"，广义策略迭代被压到单步粒度。', en: '<strong>Where the names come from</strong>: the actor performs on stage — acting, pushed to improve by the advantage; the critic scores from the seats — grading, corrected by its own TD error. Every time step is “half a step of evaluation + half a step of improvement”: generalised policy iteration compressed to single-step grain.' } },
          { tex: String.raw`\text{REINFORCE}\ \big(G_t:\ \text{无偏 · 高方差 · 等回合}\big) \;\longrightarrow\; \text{A2C}\ \big(\delta:\ \text{有偏 · 低方差 · 单步}\big)`,
            why: { zh: '<strong>收尾</strong>：两次替换（G→q̂、−v 基线）加一次自举（δ 估计优势），换来单步更新与方差骤降；代价是 v 不准时有偏。NB6 将用 numpy 实现 REINFORCE 与 baseline 消融——亲手看到"均值不动、方差塌下去"。', en: '<strong>Closing</strong>: two substitutions (G→q̂, −v baseline) plus one act of bootstrapping (δ estimating the advantage) buy per-step updates and a collapsed variance; the price is bias while v is imperfect. NB6 implements the REINFORCE baseline ablation in numpy — watch the mean stay put while the variance collapses.' } },
        ],
      },
    ],
  };

  /* 导航组注册已提升至 data.js 的 NAV（按讲懒加载后，冷启动侧栏也要完整） */
  const l10 = D.otherLectures.find(l => l.no === 10);
  if (l10) l10.done = true;
})();

/* ===== L10 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 5 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 50–54，共 5 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l10'] = {
    min: 50,
    max: 54,
    episodes: [
      { n: 50, en: "Actor-Critic Methods (P1-The simplest Actor-Critic)", yt: "kjCZAT5Wh80" },
      { n: 51, en: "Actor-Critic Methods (P2-Advantage Actor-Critic)", yt: "vZVXJJcZNEM" },
      { n: 52, en: "Actor-Critic Methods (P3-Importance sampling & off-policy Actor-Critic)", yt: "TfO5mnsiGKc" },
      { n: 53, en: "Actor-Critic Methods (P4-Deterministic Actor-Critic)", yt: "dTjz1RNtic4" },
      { n: 54, en: "Actor-Critic Methods (P5-Summary and goodbye!)", yt: "npvnnKcXoBs" }
    ],
  };
  D.sections['l10-qac'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l10' } });
})();
