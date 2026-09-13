/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · JupyterLite 笔记本清单（单一事实源）
   NotebookBridge 组件（讲内入口卡）与 lite.html hub 页共用；
   与 notebooks/ 目录的实际 ipynb 文件一一对应（Phase 4 起填入真本）。
   字段：id / file / lectures(讲号数组，nb0 为全站导览) / level(1-3) /
         minutes / zh{name,goal} / en{name,goal}
   ═══════════════════════════════════════════════════════════ */
window.NB_MANIFEST = [
  {
    id: 'nb0', file: 'nb0-tour.ipynb', lectures: [], level: 1, minutes: 30,
    zh: { name: 'NB0 · JupyterLite 导览', goal: '环境自检 + 4×4 GridWorld 复刻，全部格子跑绿即毕业。' },
    en: { name: 'NB0 · JupyterLite tour', goal: 'Self-check the kernel and rebuild the 4×4 GridWorld — all-green cells mean you are ready.' },
  },
  {
    id: 'nb1', file: 'nb1-bellman.ipynb', lectures: [2, 3], level: 1, minutes: 35,
    zh: { name: 'NB1 · Bellman 方程手算与迭代', goal: '手算一轮 Bellman 迭代，再用代码验证；闭式解与迭代解对比到 1e-6。' },
    en: { name: 'NB1 · Bellman by hand and by loop', goal: 'Hand-compute one Bellman sweep, verify in code, and match the closed form to 1e-6.' },
  },
  {
    id: 'nb2', file: 'nb2-vi-pi.ipynb', lectures: [4], level: 2, minutes: 45,
    zh: { name: 'NB2 · 值迭代与策略迭代', goal: '实现两种迭代并画出收敛曲线，扫描 γ∈{0.5, 0.9, 0.99}。' },
    en: { name: 'NB2 · Value & policy iteration', goal: 'Implement both iterations, plot convergence, and sweep γ ∈ {0.5, 0.9, 0.99}.' },
  },
  {
    id: 'nb3', file: 'nb3-mc-rm.ipynb', lectures: [5, 6], level: 2, minutes: 40,
    zh: { name: 'NB3 · 蒙特卡洛与随机近似', goal: '多 seed 观察 MC 均值方差塌缩；对比 RM 步长 α=1/t^k 三种 k。' },
    en: { name: 'NB3 · Monte Carlo & stochastic approximation', goal: 'Watch MC means collapse in variance across seeds; compare RM step sizes α = 1/t^k.' },
  },
  {
    id: 'nb4', file: 'nb4-qlearning.ipynb', lectures: [7], level: 2, minutes: 50,
    zh: { name: 'NB4 · Q-learning 复现', goal: 'seed 可调复现 Q-learning，做 α/ε 敏感性与 10-seed 误差带。' },
    en: { name: 'NB4 · Q-learning reproduction', goal: 'Reproduce Q-learning with a tunable seed; sensitivity in α/ε and a 10-seed error band.' },
  },
  {
    id: 'nb5', file: 'nb5-td-linear.ipynb', lectures: [8], level: 3, minutes: 45,
    zh: { name: 'NB5 · TD 线性近似', goal: 'numpy 手写 TD-Linear，做特征设计消融实验。' },
    en: { name: 'NB5 · Linear TD', goal: 'Hand-write TD with linear features in numpy; ablate the feature design.' },
  },
  {
    id: 'nb6', file: 'nb6-reinforce.ipynb', lectures: [9, 10], level: 3, minutes: 50,
    zh: { name: 'NB6 · REINFORCE 与 baseline', goal: 'numpy softmax 策略梯度完整实现，验证 baseline 只降方差不改期望。' },
    en: { name: 'NB6 · REINFORCE with baselines', goal: 'A full numpy REINFORCE; verify baselines cut variance without moving the mean.' },
  },
];
