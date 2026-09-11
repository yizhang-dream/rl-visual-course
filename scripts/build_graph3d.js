// 知识星图数据管线：node scripts/build_graph3d.js → assets/js/graph3d-data.js（挂 window.GRAPH3D）
// 站点无构建步骤（双击 index.html 可用），数据以静态 js 产物入库，页面 <script> 直载。
// 数据源：assets/js/data*.js（浏览器全局脚本，Node 下用 window stub 加载）。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'js', 'graph3d-data.js');

/* ═════════ 精选关联边（40 条）：s|t|rel|lzh|len ═════════
   rel：pre=前置 / kin=同源对照 / ext=延伸 / app=应用；方向 = 知识流（前置→后继） */
const LINKS_RAW = `
l1-trajectory|l2-why|pre|回报的定义支撑“为什么要价值”|Returns ground the value question
l1-mdp|l2-bellman|pre|MDP 四要素进入推导|MDP ingredients enter the derivation
l1-policy|l2-state-value|pre|策略是价值的评价对象|Policy is what values grade
l1-policy|l9-representation|ext|“第三种表示”的伏笔在此兑现|The third-representation foreshadow pays off
l2-why|l3-factors|ext|γ 改变策略的伏笔在此兑现|The γ setup pays off
l2-bootstrap|l7-td0|pre|自举思想贯穿到 TD|Bootstrapping runs through to TD
l2-bellman|l3-boe|pre|期望方程加上 max 成最优方程|Expectation + max = optimality
l2-solving|l4-pi|pre|迭代解就是策略评估内环|Iterative solve = the PE inner loop
l2-action-value|l3-solving|pre|q* 由 v* 提取|q* extracted from v*
l2-action-value|l7-sarsa|pre|从算 q 到直接学 q|From computing q to learning q
l2-state-value|l10-qac|ext|评论家学的正是 vπ|The critic learns exactly vπ
l2-matrix|l3-boe|kin|线性代数在此谢幕|Linear algebra bows out
l3-improve|l4-pi|pre|贪心改进是 PI 的另一半|Greedy improvement is PI’s other half
l3-boe|l4-vi|pre|BOE 的迭代解就是值迭代|VI is the BOE iterated
l3-contraction|l4-vi|pre|压缩映射保证收敛|Contraction guarantees convergence
l3-improve|l7-qlearning|ext|贪心 max 化身 Q-learning|The greedy max becomes Q-learning
l3-boe|l7-qlearning|pre|无模型地直接解最优方程|Solving BOE without a model
l3-solving|l7-qlearning|ext|q* 路线的无模型走法|A model-free route to q*
l1-mdp|l5-mean|pre|模型未知是无模型的起点|Unknown model starts model-free
l4-pi|l5-basic|pre|评估步被采样替换|PE step swapped for sampling
l4-truncated|l5-basic|kin|评估不精确照样改进|Imprecise PE still improves
l5-mean|l6-incremental|pre|均值估计走向增量式|Mean estimation goes incremental
l5-eps|l7-sarsa|app|ε-greedy 成为 TD 的策略|ε-greedy becomes the TD policy
l5-basic|l7-td0|kin|MC 与 TD：采样对自举|MC vs TD: sampling vs bootstrapping
l5-basic|l7-nstep|kin|n-step 谱系的采样端|The sampling end of n-step
l6-incremental|l7-td0|pre|同一更新式，只换目标|Same update rule, new target
l6-rm|l7-qlearning|pre|Dvoretzky 定理撑起收敛证明|Dvoretzky backs the convergence proof
l6-rm|l7-unified|app|统一视角的 RM 骨架|The unified view’s RM skeleton
l6-sgd|l8-td-fa|pre|SGD 形状直接复用|The SGD shape reused wholesale
l7-td0|l7-nstep|kin|自举端与采样端在此汇合|The bootstrap end meets the sampling end
l7-sarsa|l8-q-fa|pre|Sarsa 换上函数引擎|Sarsa with a function engine
l7-qlearning|l8-q-fa|pre|Q-learning 换上函数引擎|Q-learning with a function engine
l7-qlearning|l8-dqn|pre|Q-learning 的深度版|The deep version of Q-learning
l7-unified|l8-representation|ext|统一模板里的 q 换成函数|The template’s q becomes a function
l7-td0|l10-qac|pre|TD 化身评论家|TD becomes the critic
l8-representation|l9-representation|kin|同一个换法，调转枪口|Same trick, opposite direction
l8-td-fa|l8-dqn|ext|线性到深度的最后一跃|Linear to deep, the final leap
l9-representation|l10-a2c|pre|零和性质是基线不变性的根基|Zero-sum grounds baseline invariance
l9-reinforce|l10-qac|pre|MC 梯度请 TD 评论家降方差|MC gradient gets a TD critic
l7-qlearning|l10-offpolicy|kin|两处 off-policy 的呼应|Two off-policy moments echo
`;

/* ═════════ 线索（8 条）：id|zh|en|成员,成员,… ═════════ */
const THREADS_RAW = `
t-boot|自举之线|The bootstrapping thread|l2-bootstrap,l2-solving,l4-vi,l4-truncated,l7-td0,l7-sarsa,l7-nstep,l7-qlearning,l10-qac
t-explore|探索与利用|Exploration & exploitation|l1-policy,l5-exploring,l5-eps,l7-sarsa,l7-qlearning
t-gpi|广义策略迭代|Generalized policy iteration|l3-improve,l4-vi,l4-pi,l4-truncated,l5-basic,l10-qac,l10-summary
t-sa|一条更新式的家族史|The one-update family|l5-mean,l6-incremental,l6-rm,l6-sgd,l7-td0,l7-unified,l8-td-fa
t-fa|从表格到函数|From tables to functions|l8-representation,l8-td-fa,l8-q-fa,l8-dqn,l9-representation
t-policy|策略直接登场|The policy takes the stage|l1-policy,l9-representation,l9-metrics,l9-theorem,l9-reinforce,l10-qac,l10-a2c,l10-offpolicy
t-gamma|γ 与远见|γ and foresight|l1-trajectory,l2-why,l3-factors,l3-detour
t-opt|最优性与压缩映射|Optimality & contraction|l3-definition,l3-boe,l3-contraction,l3-solving,l4-vi
`;

/* ═════════ 88 节一句话摘要 + 概念（en 摘要本版不做，en 模式由页面显示英文标题+概念） ═════════ */
const SUMMARIES = {
  'grid-world': ['机器人网格世界全书舞台，试错学策略', ['智能体', '禁区', '试错']],
  'state-action': ['状态与动作编号，状态空间与动作空间', ['状态空间', '动作空间', '负奖励惩罚']],
  'transition': ['转移如何发生，边界与禁区两种特例', ['状态转移', '边界反弹', '禁区']],
  'policy': ['策略即每格指令卡，规定怎么选动作', ['策略', '箭头图', '概率分布']],
  'reward': ['奖励牵引行为，正奖目标负罚禁区', ['奖励', 'r(s,a)', '行为塑造']],
  'trajectory': ['轨迹串起经历，回报折现打总分', ['轨迹', '回报', '折扣率']],
  'mdp': ['四要素形式化随机动态系统框架', ['MDP', '马尔可夫性', '随机动态系统']],
  'summary': ['概念依赖链总结，预告状态价值', ['概念链', '状态价值预告']],
  'reasoning': ['全章重构为不许断的逻辑推理链', ['推理链', '概念依赖']],
  'code': ['精讲作业代码，书本与代码动作序差异', ['动作序对照', '边界反弹', 'gym接口']],
  'qa': ['书末两问加代码常见疑惑翻卡作答', ['高频疑问', '常见错误']],
  'l2-why': ['2×2例算三策略回报，数学验证直觉', ['折扣回报', 'γ/(1−γ)', '策略比较']],
  'l2-bootstrap': ['圆环例展开回报，自举v=r+γv′登场', ['自举', '圆环例', '联立方程']],
  'l2-state-value': ['vπ(s)=E[Gt|s]，平均三层随机性', ['状态价值', '三层随机性', '期望']],
  'l2-bellman': ['三步推导Bellman方程，四件旧工具', ['Bellman方程', '马尔可夫性', '全期望公式']],
  'l2-examples': ['2×2与3×3两例逐格手算方程', ['手算', '逐格求解', '策略评估']],
  'l2-matrix': ['rπ、Pπ打包，n方程写成矩阵式', ['矩阵-向量形式', 'rπ', 'Pπ']],
  'l2-solving': ['闭式与迭代两条策略评估路线', ['闭式解', '迭代解', '策略评估']],
  'l2-action-value': ['定义qπ(s,a)，与vπ互相换算', ['动作价值', 'qπ', '与vπ互算']],
  'l2-summary': ['尺子（状态价值）与发动机（方程）', ['概念链', '尺子', '发动机']],
  'l2-reasoning': ['从回报样本到方程组的推理主线', ['推理链', '自举', '收敛']],
  'l2-code': ['20行策略评估，多算法复用的内环', ['策略评估实现', '迭代法', '收敛判据']],
  'l2-qa': ['七问直击要害，附常见错误卡', ['状态价值', '常见错误']],
  'l3-improve': ['2×2链上演示贪心改进一步', ['贪心改进', 'q比较', '策略改进']],
  'l3-definition': ['用状态值逐格比较定义最优', ['最优策略', '最优状态值v*', '逐格比较']],
  'l3-boe': ['把max写进方程，方程因此非线性', ['BOE', 'max算子', '非线性方程']],
  'l3-contraction': ['不动点与压缩，万能钥匙保证求解', ['不动点', '压缩映射', '唯一解']],
  'l3-solving': ['定理3.3：v*存在唯一且可迭代求解', ['定理3.3', 'v*', 'π*提取']],
  'l3-factors': ['拧γ与奖励旋钮看最优策略变脸', ['γ扫描', '奖励设计', '策略性格']],
  'l3-detour': ['γ天生罚绕路，零奖励不兜风', ['绕路之谜', 'γ折扣', '短路径']],
  'l3-summary': ['最优性变可计算对象，对照L2', ['概念链', 'L2L3对照']],
  'l3-reasoning': ['从换一步到最优性定理的推理链', ['推理链', '最优性定理']],
  'l3-code': ['15行值迭代解出4×4最优策略', ['值迭代', '贪心提取', '简短实现']],
  'l3-qa': ['十问精选六卡附旋钮速查', ['最优性', '旋钮速查']],
  'l4-vi': ['定理3.3落成算法，压缩映射保收敛', ['值迭代', '策略更新', '压缩收敛']],
  'l4-pi': ['评估改进交替，单调收敛到最优', ['策略迭代', '策略评估', '单调改进']],
  'l4-truncated': ['截断迭代统一VI与PI成连续谱', ['截断策略迭代', 'GPI', '连续谱']],
  'l4-summary': ['交替更新框架统摄三种算法', ['概念链', '交替更新']],
  'l4-reasoning': ['两步一循环走遍最优路的推理链', ['推理链', '收敛']],
  'l4-code': ['两算法并排，内嵌复用L2评估', ['并排实现', '复用评估']],
  'l4-qa': ['聚焦中间值身份与收敛保证', ['中间值', '收敛保证']],
  'l5-mean': ['样本平均替代期望，无模型入场', ['均值估计', '大数定律', '无模型']],
  'l5-basic': ['评估步换成采样，首个无模型算法', ['MC Basic', '策略改进', '采样估计']],
  'l5-exploring': ['单条长轨迹榨干所有(s,a)信息', ['探索起点', '轨迹复用', '批量估计']],
  'l5-eps': ['soft策略加ε-greedy持续探索', ['soft策略', 'ε-greedy', '探索利用平衡']],
  'l5-summary': ['均值思想三级放大成三算法', ['概念链', '均值思想']],
  'l5-reasoning': ['从期望到样本平均的推理链', ['推理链', '大数定律']],
  'l5-code': ['先造采样器再实现MC主循环', ['采样器', 'generate_episode']],
  'l5-qa': ['辨三算法关系与exploring starts', ['三算法关系', '探索']],
  'l6-incremental': ['批量均值改增量式，步长抽象αk', ['增量均值', '步长αk', '随机近似']],
  'l6-rm': ['RM黑盒求根，收敛三条件', ['Robbins-Monro', '黑盒求根', '收敛三条件']],
  'l6-sgd': ['SGD解随机优化，单样本更新', ['SGD', '随机优化', '方差']],
  'l6-summary': ['增量均值RM SGD为TD交学费', ['概念链', 'Dvoretzky']],
  'l6-reasoning': ['一条更新式家族史的推理链', ['推理链', 'RM']],
  'l6-code': ['各十行实现，对准步长条件', ['步长调度', '收敛条件']],
  'l6-qa': ['为什么学这章，答案指向第7讲', ['学习动机', 'TD衔接']],
  'l7-td0': ['目标换r+γv(s′)，走一步就更新', ['TD目标', '自举', '在线更新']],
  'l7-sarsa': ['TD状态版照抄成动作版学q', ['Sarsa', 'on-policy', '动作价值']],
  'l7-nstep': ['n步目标衔接Sarsa与MC两极', ['n-step', '自举谱', '采样谱']],
  'l7-qlearning': ['目标取max，直接解最优方程', ['Q-learning', 'off-policy', 'max目标']],
  'l7-unified': ['一个模板看穿MC Sarsa Q-learning', ['统一模板', '目标表', '算法族']],
  'l7-summary': ['TD三兄弟：同一RM骨架三目标', ['概念链', 'RM骨架']],
  'l7-reasoning': ['MC等轨迹到自举顶替的推理链', ['推理链', '自举']],
  'l7-code': ['两算法只差一行TD目标', ['并排实现', 'TD目标差异']],
  'l7-qa': ['on/off之辨与学习率之争', ['on/off-policy', '学习率']],
  'l8-representation': ['表格死穴是泛化，参数化登场', ['泛化', '参数化', '特征']],
  'l8-td-fa': ['价值近似成最小二乘优化问题', ['目标函数', '梯度下降', '线性近似']],
  'l8-q-fa': ['表格换函数，更新式机械照抄', ['函数引擎', '更新式照抄']],
  'l8-dqn': ['目标网络加经验回放驯服不稳定', ['目标网络', '经验回放', 'DQN']],
  'l8-summary': ['近似即优化，划表格结论适用边界', ['概念链', '适用边界']],
  'l8-reasoning': ['从查表到梯度下降的推理链', ['推理链', '梯度']],
  'l8-code': ['TD-Linear十行与DQN骨架伪代码', ['TD-Linear', 'DQN骨架']],
  'l8-qa': ['聚焦两种表示的本质差异', ['表格vs函数', '泛化']],
  'l9-representation': ['softmax参数化策略绕开argmax', ['softmax策略', '参数化', '可导']],
  'l9-metrics': ['三个标量度量给好策略定目标', ['平均状态值', '三度量', '访问分布']],
  'l9-theorem': ['定理9.1：梯度统一成期望式', ['策略梯度定理', 'log技巧', '期望梯度']],
  'l9-reinforce': ['单轨迹采样梯度即REINFORCE', ['REINFORCE', '蒙特卡洛梯度', '方差']],
  'l9-summary': ['策略基三步套路与价值基对照', ['概念链', '策略基']],
  'l9-reasoning': ['让策略自己长出最优的推理链', ['推理链', '梯度上升']],
  'l9-code': ['30行实现，核心是∇lnπ技巧', ['∇lnπ', '梯度公式']],
  'l9-qa': ['为什么有log更新什么六问扫清', ['log动机', '更新对象']],
  'l10-qac': ['QAC请TD评论家替MC评分降方差', ['QAC', 'TD评论家', '降方差']],
  'l10-a2c': ['基线不变性，减基线得优势函数', ['基线', '优势函数', '方差骤降']],
  'l10-offpolicy': ['重要性采样引旧数据训AC', ['重要性采样', 'off-policy', '轨迹复用']],
  'l10-summary': ['四种AC梳理加全书收官回顾', ['AC家族', '全书回顾']],
  'l10-reasoning': ['演员评论家分工史的推理链', ['推理链', '分工']],
  'l10-code': ['40行A2C：评论家TD误差加演员更新', ['A2C骨架', 'TD误差']],
  'l10-qa': ['评论家基线确定性策略收官六问', ['评论家', '基线']],
};

/* ═════════ 加载站点数据（stub 模式：站点文件是浏览器全局脚本） ═════════ */
global.window = { DATA: { sections: {}, navGroups: [], otherLectures: [] } };
require('../assets/js/data.js');
for (let n = 2; n <= 10; n++) require(`../assets/js/data-l${n}.js`);

const D = window.DATA;
const errors = [];
const fail = (msg) => errors.push(msg);

/* ---------- 小节权威顺序：navGroups ---------- */
const navSections = [];
for (const g of D.navGroups) {
  for (const it of g.items) navSections.push({ id: it.id, lecture: g.lecture });
}
const missingSections = navSections.filter(x => !D.sections[x.id]);
if (missingSections.length) fail('navGroups 引用了不存在的 section: ' + missingSections.map(x => x.id).join(', '));
const navIdSet = new Set(navSections.map(x => x.id));
const orphanSections = Object.keys(D.sections).filter(id => !navIdSet.has(id));
if (orphanSections.length) fail('sections 里存在 navGroups 未收录的孤儿: ' + orphanSections.join(', '));

/* ---------- 摘要表完整性（缺项报错，不静默跳过） ---------- */
const missingSummaries = navSections.map(x => x.id).filter(id => !Object.prototype.hasOwnProperty.call(SUMMARIES, id));
if (missingSummaries.length) fail('摘要表缺项: ' + missingSummaries.join(', '));
const extraSummaries = Object.keys(SUMMARIES).filter(id => !navIdSet.has(id));
if (extraSummaries.length) fail('摘要表多余项（id 拼错？）: ' + extraSummaries.join(', '));

/* ---------- 组归属：navClusters（讲号 → [{zh,en,items}]） ---------- */
function groupOf(lecture, id) {
  const groups = D.navClusters[lecture] || [];
  const g = groups.find(gr => gr.items.includes(id));
  return g ? { zh: g.zh, en: g.en } : null;
}

/* ---------- 讲列表：zh/en 取自 otherLectures，格式 'L{no} · {名}' ---------- */
const lectures = [...D.otherLectures]
  .sort((a, b) => a.no - b.no)
  .map(l => ({ no: l.no, id: 'L' + l.no, zh: 'L' + l.no + ' · ' + l.zh, en: 'L' + l.no + ' · ' + l.en }));

/* ---------- id 归一化：精选边/线索里的 L1 小节写作 'l1-x'，数据文件中实为 'x' ---------- */
const allNodeIds = new Set([...navIdSet, ...lectures.map(l => l.id)]);
const renames = [];
function resolveId(rawId) {
  if (allNodeIds.has(rawId)) return rawId;
  const m = /^l1-(.+)$/.exec(rawId);
  if (m && allNodeIds.has(m[1])) {
    renames.push(rawId + ' → ' + m[1]);
    return m[1];
  }
  return rawId; // 保持原样，交给引用完整性校验报错
}

/* ---------- 节点 ---------- */
const nodes = lectures.map(l => ({ id: l.id, type: 'hub', lecture: l.no, zh: l.zh, en: l.en }));
for (const x of navSections) {
  const sec = D.sections[x.id];
  const group = groupOf(x.lecture, x.id);
  if (!group) { fail('section 无 navClusters 分组: ' + x.id); continue; }
  const sm = SUMMARIES[x.id];
  const labs = []; // 实验台：widget 块且非 concept-chain 复盘链，可为空数组
  for (const b of sec.blocks || []) {
    if (b && b.t === 'widget' && b.component && b.component !== 'concept-chain' && !labs.includes(b.component)) {
      labs.push(b.component);
    }
  }
  nodes.push({
    id: x.id, type: 'sec', lecture: x.lecture, group,
    zh: sec.title.zh, en: sec.title.en,
    sum: sm[0], labs, concepts: [...sm[1]],
  });
}

/* ---------- 边：struct（枢纽→小节）/ spine（书脊 L1→…→L10）/ link（精选 40 条） ---------- */
const edges = [];
for (const x of navSections) edges.push({ s: 'L' + x.lecture, t: x.id, type: 'struct' });
for (let n = 1; n < lectures.length; n++) edges.push({ s: lectures[n - 1].id, t: lectures[n].id, type: 'spine' });

const RELS = ['pre', 'kin', 'ext', 'app'];
const links = [];
for (const line of LINKS_RAW.split('\n')) {
  const raw = line.trim();
  if (!raw) continue;
  const parts = raw.split('|');
  if (parts.length !== 5) { fail('关联边格式错误（应为 s|t|rel|lzh|len）: ' + raw); continue; }
  const [s, t, rel, lzh, len] = parts;
  if (!RELS.includes(rel)) { fail('关联边 rel 非法（' + rel + '）: ' + raw); continue; }
  links.push({ s: resolveId(s), t: resolveId(t), rel, lzh, len });
}
if (links.length !== 40) fail('关联边数量 = ' + links.length + '（应为 40）');
for (const lk of links) edges.push({ s: lk.s, t: lk.t, type: 'link', rel: lk.rel, lzh: lk.lzh, len: lk.len });

/* ---------- 线索 ---------- */
const threads = [];
for (const line of THREADS_RAW.split('\n')) {
  const raw = line.trim();
  if (!raw) continue;
  const parts = raw.split('|');
  if (parts.length !== 4) { fail('线索格式错误（应为 id|zh|en|members）: ' + raw); continue; }
  threads.push({ id: parts[0], zh: parts[1], en: parts[2], members: parts[3].split(',').map(m => resolveId(m.trim())).filter(Boolean) });
}
if (threads.length !== 8) fail('线索数量 = ' + threads.length + '（应为 8）');

/* ═════════ 组装 ═════════ */
const relCount = links.filter(lk => lk.rel === 'pre' || lk.rel === 'app').length;
const graph = {
  meta: {
    generated: new Date().toISOString().slice(0, 10),
    sections: navSections.length,
    hubs: lectures.length,
    edges: { struct: navSections.length, spine: lectures.length - 1, link: links.length },
    threads: threads.length,
  },
  lectures,
  nodes,
  edges,
  threads,
};

/* ═════════ 内置校验（失败 exit 1） ═════════ */
// 1. 计数：节点 98（10 hub + 88 sec）、struct 88、spine 9、link 40、threads 8
const hubs = nodes.filter(nd => nd.type === 'hub');
const secs = nodes.filter(nd => nd.type === 'sec');
const countType = (ty) => edges.filter(e => e.type === ty).length;
if (nodes.length !== 98) fail('节点数 = ' + nodes.length + '（应为 98 = 10 hub + 88 sec）');
if (hubs.length !== 10) fail('hub 节点 = ' + hubs.length + '（应为 10）');
if (secs.length !== 88) fail('sec 节点 = ' + secs.length + '（应为 88）');
if (countType('struct') !== 88) fail('struct 边 = ' + countType('struct') + '（应为 88）');
if (countType('spine') !== 9) fail('spine 边 = ' + countType('spine') + '（应为 9）');
if (countType('link') !== 40) fail('link 边 = ' + countType('link') + '（应为 40）');
if (threads.length !== 8) fail('threads = ' + threads.length + '（应为 8）');

// 2. 所有边端点 / 线索成员存在于节点集
const nodeIds = new Set(nodes.map(nd => nd.id));
for (const e of edges) {
  if (!nodeIds.has(e.s)) fail('边 s 不存在于节点集: ' + e.s + ' → ' + e.t + '（' + e.type + '）');
  if (!nodeIds.has(e.t)) fail('边 t 不存在于节点集: ' + e.s + ' → ' + e.t + '（' + e.type + '）');
}
for (const th of threads) {
  for (const m of th.members) {
    if (!nodeIds.has(m)) fail('线索成员不存在于节点集: ' + th.id + ' → ' + m);
  }
}

// 3. rel∈{pre,app} 的边构成 DAG（DFS 三色判环）
const relEdges = edges.filter(e => e.type === 'link' && (e.rel === 'pre' || e.rel === 'app'));
{
  const adj = new Map();
  for (const e of relEdges) {
    if (!adj.has(e.s)) adj.set(e.s, []);
    adj.get(e.s).push(e.t);
  }
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  const stack = [];
  let cycle = null;
  const dfs = (u) => {
    color.set(u, GRAY);
    stack.push(u);
    for (const v of adj.get(u) || []) {
      if (cycle) return;
      const c = color.get(v) || WHITE;
      if (c === GRAY) {
        cycle = stack.slice(stack.indexOf(v)).concat(v);
        return;
      }
      if (c === WHITE) dfs(v);
    }
    stack.pop();
    color.set(u, BLACK);
  };
  for (const u of adj.keys()) {
    if (!cycle && (color.get(u) || WHITE) === WHITE) dfs(u);
  }
  if (cycle) fail('pre/app 边存在环（前置依赖须无环）: ' + cycle.join(' → '));
}

// 4. 每节都有 group（navClusters 覆盖 88 节，无孤儿）
const noGroup = secs.filter(nd => !nd.group);
if (noGroup.length) fail('无 group 的小节: ' + noGroup.map(nd => nd.id).join(', '));
const grouped = secs.filter(nd => nd.group).length;
if (grouped !== 88) fail('有 group 的小节 = ' + grouped + '（应为 88）');

if (errors.length) {
  console.error('BUILD FAILED（' + errors.length + ' 处）:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

/* ═════════ 产出：IIFE 挂 window.GRAPH3D，2 空格缩进、单引号、分号 ═════════ */
const lit = (v) => {
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return '[' + v.map(lit).join(', ') + ']';
  const parts = Object.keys(v).map(k => k + ': ' + lit(v[k]));
  return '{ ' + parts.join(', ') + ' }';
};

const lines = [];
lines.push('// 自动生成：node scripts/build_graph3d.js —— 手改无效');
lines.push('');
lines.push('window.GRAPH3D = (function () {');
lines.push('  return {');
lines.push('    meta: ' + lit(graph.meta) + ',');
lines.push('    lectures: [');
for (const l of graph.lectures) lines.push('      ' + lit(l) + ',');
lines.push('    ],');
lines.push('    nodes: [');
for (const nd of graph.nodes) lines.push('      ' + lit(nd) + ',');
lines.push('    ],');
lines.push('    edges: [');
for (const e of graph.edges) lines.push('      ' + lit(e) + ',');
lines.push('    ],');
lines.push('    threads: [');
for (const th of graph.threads) lines.push('      ' + lit(th) + ',');
lines.push('    ],');
lines.push('  };');
lines.push('})();');
fs.writeFileSync(OUT, lines.join('\n') + '\n');

/* ---------- 成功摘要 ---------- */
console.log('GRAPH3D 构建成功 → assets/js/graph3d-data.js');
console.log('  meta.generated = ' + graph.meta.generated);
console.log('  lectures: ' + lectures.length + '（L1..L10）');
console.log('  nodes: ' + nodes.length + '（hub ' + hubs.length + ' + sec ' + secs.length + '）');
console.log('  edges: ' + edges.length + '（struct ' + countType('struct') + ' / spine ' + countType('spine') + ' / link ' + countType('link') + '）');
console.log('  threads: ' + threads.length);
console.log('  DAG OK（pre/app 边 ' + relCount + ' 条，DFS 无环）');
console.log('  group 覆盖 ' + grouped + '/88，labs 非空小节 ' + secs.filter(nd => nd.labs.length > 0).length + ' 节');
if (renames.length) console.log('  id 归一化 ' + renames.length + ' 处（l1-x → x）: ' + [...new Set(renames)].join(', '));
