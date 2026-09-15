// 术语 concordance 数据管线：node scripts/build_concordance.js → assets/js/concordance-data.js
// （挂 window.CONCORDANCE）。站点无构建步骤，数据以静态 js 产物入库，concordance.html <script> 直载。
// 数据源：assets/js/data.js + data-l2..l10（浏览器全局脚本，Node 下 stub window 后 require——
// 同款先例 scripts/build_graph3d.js / scripts/check_data.js）。
// 确定性：术语表与匹配逻辑固定、小节按 navGroups 权威顺序、排序加稳定 tie-break，
// generatedAt 截断到日（UTC）——同一天内重复运行产物逐字节一致（diff 为空）。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'js', 'concordance-data.js');

/* ═════════ 精选术语表（46 条）：关键概念 → 全书出现小节反向索引 ═════════
   zh/en：术语双语名（en 与站点双语数据一致译法，如 discount rate / bootstrapping）。
   alias：zh 文本匹配用的正则片段（'i' 大小写不敏感；\b 词边界防子串误伤）。
   站点行文用「Bellman 方程」「折扣率」等写法而非「贝尔曼方程」「折扣因子」——
   展示名与匹配名分离，alias 负责把两者接住。 */
const TERMS = [
  { zh: '马尔可夫决策过程（MDP）', en: 'Markov decision process (MDP)', alias: ['马尔可夫', '\\bMDP\\b', 'Markov'] },
  { zh: '贝尔曼方程', en: 'Bellman equation', alias: ['Bellman 方程', 'Bellman方程'] },
  { zh: '贝尔曼最优方程', en: 'Bellman optimality equation', alias: ['Bellman 最优', 'Bellman最优', '最优性方程', '\\bBOE\\b'] },
  { zh: '策略评估', en: 'Policy evaluation', alias: ['策略评估'] },
  { zh: '策略改进', en: 'Policy improvement', alias: ['策略改进'] },
  { zh: '策略迭代', en: 'Policy iteration', alias: ['策略迭代'] },
  { zh: '值迭代', en: 'Value iteration', alias: ['值迭代'] },
  { zh: '状态值函数', en: 'State value function', alias: ['状态值', '状态价值'] },
  { zh: '动作值函数', en: 'Action value function', alias: ['动作值', '动作价值'] },
  { zh: '最优策略', en: 'Optimal policy', alias: ['最优策略'] },
  { zh: '贪心策略', en: 'Greedy policy', alias: ['贪心'] },
  { zh: '折扣率 γ', en: 'Discount rate (γ)', alias: ['折扣率', '折扣因子', '折扣'] },
  { zh: '回报', en: 'Return', alias: ['回报'] },
  { zh: '回合', en: 'Episode', alias: ['回合', 'episode'] },
  { zh: '探索与利用', en: 'Exploration & exploitation', alias: ['探索', 'exploit'] },
  { zh: 'ε-greedy', en: 'ε-greedy', alias: ['ε-greedy', 'epsilon-greedy'] },
  { zh: '蒙特卡洛', en: 'Monte Carlo', alias: ['蒙特卡洛', 'Monte Carlo', '\\bMC\\b'] },
  { zh: '时序差分（TD）', en: 'Temporal-difference (TD)', alias: ['时序差分', '\\bTD\\b'] },
  { zh: 'TD 误差', en: 'TD error', alias: ['TD 误差', 'TD误差', 'TD error'] },
  { zh: 'TD 目标', en: 'TD target', alias: ['TD 目标', 'TD目标', 'TD target'] },
  { zh: '自举', en: 'Bootstrapping', alias: ['自举'] },
  { zh: '采样', en: 'Sampling', alias: ['采样'] },
  { zh: '重要性采样', en: 'Importance sampling', alias: ['重要性采样'] },
  { zh: 'SARSA', en: 'SARSA', alias: ['SARSA'] },
  { zh: 'Q-learning', en: 'Q-learning', alias: ['Q-learning', 'Q learning'] },
  { zh: '广义策略迭代', en: 'Generalized policy iteration', alias: ['广义策略迭代', '\\bGPI\\b'] },
  { zh: '函数近似', en: 'Function approximation', alias: ['函数近似'] },
  { zh: '线性近似', en: 'Linear function approximation', alias: ['线性近似', '线性形式', '线性情形', '线性值函数', '线性函数近似', '线性 v̂', '线性半梯度'] },
  { zh: '特征', en: 'Feature', alias: ['特征'] },
  { zh: '泛化', en: 'Generalization', alias: ['泛化'] },
  { zh: '策略梯度', en: 'Policy gradient', alias: ['策略梯度'] },
  { zh: 'REINFORCE', en: 'REINFORCE', alias: ['REINFORCE'] },
  { zh: 'Actor-Critic', en: 'Actor-Critic', alias: ['Actor-Critic', 'Actor–Critic', '演员-评论家', '演员−评论家', '\\bA2C\\b', '\\bQAC\\b'] },
  { zh: '基线', en: 'Baseline', alias: ['基线'] },
  { zh: '经验回放', en: 'Experience replay', alias: ['经验回放', '回放缓冲'] },
  { zh: '目标网络', en: 'Target network', alias: ['目标网络'] },
  { zh: '收敛', en: 'Convergence', alias: ['收敛'] },
  { zh: '轨迹', en: 'Trajectory', alias: ['轨迹'] },
  { zh: '奖励', en: 'Reward', alias: ['奖励'] },
  { zh: '无模型', en: 'Model-free', alias: ['无模型', 'model-free'] },
  { zh: 'off-policy', en: 'Off-policy', alias: ['off-policy', '离线策略'] },
  { zh: 'on-policy', en: 'On-policy', alias: ['on-policy', '在策略'] },
  { zh: '步长（学习率）', en: 'Step size (learning rate)', alias: ['步长', '学习率'] },
  { zh: '随机近似', en: 'Stochastic approximation', alias: ['随机近似', 'Robbins'] },
  { zh: '随机梯度下降（SGD）', en: 'Stochastic gradient descent (SGD)', alias: ['\\bSGD\\b', '随机梯度'] },
  { zh: '不动点', en: 'Fixed point', alias: ['不动点'] },
];

/* ═════════ 加载站点数据（stub 模式：站点文件是浏览器全局脚本） ═════════ */
global.window = { DATA: { sections: {}, navGroups: [], otherLectures: [] } };
require('../assets/js/data.js');
for (let n = 2; n <= 10; n++) require(`../assets/js/data-l${n}.js`);

const D = window.DATA;
const errors = [];
const fail = (msg) => errors.push(msg);

/* ---------- 小节元数据：navGroups 权威顺序 → 讲号 + 讲内序号 ---------- */
const meta = new Map();   // id → { no, sec }（Map 保序 = L1..L10、讲内升序，天然确定性）
for (const g of D.navGroups) {
  g.items.forEach((it, i) => meta.set(it.id, { no: g.lecture, sec: i + 1 }));
}
const missingSections = [...meta.keys()].filter(id => !D.sections[id]);
if (missingSections.length) fail('navGroups 引用了不存在的 section: ' + missingSections.join(', '));
const orphanSections = Object.keys(D.sections).filter(id => !meta.has(id));
if (orphanSections.length) fail('sections 里存在 navGroups 未收录的孤儿: ' + orphanSections.join(', '));

/* ---------- zh 文本提取：标题 + kicker + 正文里一切中文载体 ----------
   收集规则：key 为 zh / note 的字符串必收；其余字符串含 CJK 才收（接住
   「zh · en」拼在一格的 widget prop）；key 为 en / tex 的不收（英文行与 LaTeX）。
   最后剥掉 HTML 标签，避免行内 <strong> 把术语劈成两半。 */
const CJK = /[\u4e00-\u9fff]/;
function zhTextOf(sec) {
  const parts = [sec.title.zh || '', sec.kicker || ''];
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if (key === 'en' || key === 'tex') return;
      if (key === 'zh' || key === 'note' || CJK.test(v)) parts.push(v);
      return;
    }
    if (Array.isArray(v)) { v.forEach(x => walk(x, key)); return; }
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) walk(v[k], k); }
  };
  for (const b of sec.blocks || []) walk(b, '');
  return parts.join('\n').replace(/<[^>]+>/g, '');
}
const texts = {};
for (const id of meta.keys()) texts[id] = zhTextOf(D.sections[id]);

/* ---------- 术语表自检 ---------- */
const seenZh = new Set();
for (const t of TERMS) {
  if (!t.zh || !t.en) fail('术语缺 zh/en 名: ' + JSON.stringify(t));
  if (seenZh.has(t.zh)) fail('术语 zh 名重复: ' + t.zh);
  seenZh.add(t.zh);
  if (!Array.isArray(t.alias) || !t.alias.length) fail('术语 alias 为空: ' + t.zh);
  try {
    for (const a of t.alias) new RegExp(a, 'i');
  } catch (e) {
    fail(`术语 ${t.zh} 的 alias 编译失败（${e.message.slice(0, 80)}）`);
  }
}

/* ---------- 匹配：出现即计一次（一个小节一条），不做出现次数统计 ---------- */
const terms = [];
for (const t of TERMS) {
  const re = new RegExp(t.alias.join('|'), 'i');
  const sections = [];
  for (const id of meta.keys()) {
    if (re.test(texts[id])) {
      const m = meta.get(id);
      sections.push({ id, no: m.no, sec: m.sec, titleZh: D.sections[id].title.zh });
    }
  }
  if (!sections.length) fail('术语零命中（data 文案或 alias 漂移？）: ' + t.zh + ' ← ' + t.alias.join(' | '));
  terms.push({ zh: t.zh, en: t.en, alias: t.alias, count: sections.length, sections });
}

/* 排序：出现小节数降序；并列按 zh 码点升序（跨平台稳定，不依赖 ICU） */
terms.sort((a, b) => (b.count - a.count) || (a.zh < b.zh ? -1 : a.zh > b.zh ? 1 : 0));

/* 覆盖小节并集（统计行用） */
const covered = new Set();
for (const t of terms) for (const s of t.sections) covered.add(s.id);

if (errors.length) {
  console.error('BUILD FAILED（' + errors.length + ' 处）:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

/* ═════════ 产出：IIFE 挂 window.CONCORDANCE，2 空格缩进、单引号、分号 ═════════ */
const lit = (v) => {
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return '[' + v.map(lit).join(', ') + ']';
  const parts = Object.keys(v).map(k => k + ': ' + lit(v[k]));
  return '{ ' + parts.join(', ') + ' }';
};

const now = new Date();   // 本地日期截断到日：同日重复构建 diff 为空（本地日切比 UTC 更贴近站点读者时区）
const generatedAt = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

const lines = [];
lines.push('// 自动生成：node scripts/build_concordance.js —— 手改无效（术语表在构建脚本里维护）');
lines.push('');
lines.push('window.CONCORDANCE = (function () {');
lines.push('  return {');
lines.push('    generatedAt: ' + lit(generatedAt) + ',');
lines.push('    sectionsCovered: ' + lit(covered.size) + ',');
lines.push('    sectionsTotal: ' + lit(meta.size) + ',');
lines.push('    terms: [');
for (const t of terms) {
  lines.push('      { zh: ' + lit(t.zh) + ', en: ' + lit(t.en) + ', alias: ' + lit(t.alias) + ', count: ' + t.count + ', sections: [');
  for (const s of t.sections) {
    lines.push('        { id: ' + lit(s.id) + ', no: ' + s.no + ', sec: ' + s.sec + ', titleZh: ' + lit(s.titleZh) + ' },');
  }
  lines.push('      ] },');
}
lines.push('    ],');
lines.push('  };');
lines.push('})();');
fs.writeFileSync(OUT, lines.join('\n') + '\n');

/* ---------- 成功摘要 ---------- */
console.log('CONCORDANCE 构建成功 → assets/js/concordance-data.js');
console.log('  generatedAt = ' + generatedAt + '（截断到日，同日重建确定性）');
console.log('  terms: ' + terms.length + ' · sections covered: ' + covered.size + '/' + meta.size);
console.log('  top5: ' + terms.slice(0, 5).map(t => t.zh + '(' + t.count + ')').join(' · '));
console.log('  zero-hit: 0（零命中术语已在上方按 FAIL 拦截）');
