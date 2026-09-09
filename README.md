# RL 可视化课堂 · RL Visual Classroom

《Mathematical Foundation of Reinforcement Learning》(Shiyu Zhao) **全书十讲**的双语交互式可视化教程。
**L1–L10 全部完成**，共 88 个小节、44 个 Vue 组件、约 20 个交互实验台。

## 打开方式

- 方式一：本地服务器 → `python -m http.server 8642` 后访问 <http://localhost:8642/>
- 方式二：直接双击 `index.html`（所有依赖已本地化，完全离线可用）

## 全书地图（每讲均含：双语讲义 · 交互实验台 · 连贯长推理 · 代码精讲 · Q&A）

| 讲 | 主题 | 招牌交互件 |
|---|---|---|
| L1 ✓ | 基本概念 | 3×3/4×4 双世界、转移实验台（书规则⇄代码规则）、轨迹播放器（无限模式+γ 折扣）、ε 探索 |
| L2 ✓ | 状态价值与 Bellman 方程 | 三条策略对赌（γ/(1−γ)）、圆环自举、5×5 迭代策略评估（复现书 Figure 2.7 数值） |
| L3 ✓ | Bellman 最优方程 | 策略改进（q 比较换动作）、压缩映射蛛网、**γ-奖励最优策略实验机**（复现书 Figure 3.4a–d） |
| L4 ✓ | 值迭代与策略迭代 | 值迭代逐步 q 表（复现书 Table 4.2/4.3）、PI vs VI 赛跑、截断谱系总账 |
| L5 ✓ | 蒙特卡洛方法 | 大数定律采样、MC Basic 现场学习（刮风模式演示样本噪声）、ε-greedy 探索热图 |
| L6 ✓ | 随机近似 | 步长 α 的三种命运（1/k 收敛/常数抖动/发散）、RM 黑盒求根、SGD vs MBGD 赛跑 |
| L7 ✓ | 时序差分方法 | **Q-learning vs Sarsa 现场训练**（q 表、策略箭头、访问热图实时演化）、TD 目标对照表 |
| L8 ✓ | 值函数近似 | TD-Linear 曲线拟合实验台（多项式/Fourier 特征、order 旋钮）、DQN 骨架 |
| L9 ✓ | 策略梯度 | REINFORCE 现场训练（softmax 策略概率演化 + 回报曲线） |
| L10 ✓ | Actor-Critic | A2C 现场训练（演员箭头 + 评论家价值 + TD 误差轨迹） |

**全程中文/英文双语**（双语对照分栏 / 中文 / EN 三模式，右上角切换，localStorage 记忆）。

## 技术栈

- **Vue 3**（`assets/vendor/` 本地化，无构建步骤）
- **GSAP**（本地化）数字滚动等时序动效；其余为 CSS transitions/keyframes
- 动效规范来自本地《动效资料库》：时长 150/250/400ms、cubic-bezier(.2,0,0,1)、只动 transform/opacity、`prefers-reduced-motion` 降级
- 纯静态，无外部网络依赖

## 目录结构

```
rl-viz/
├── index.html              # SPA 外壳（根模板 + 全部脚本标签）
├── assets/
│   ├── css/main.css        # 设计系统（tokens/双语排版/全部组件样式）
│   ├── vendor/             # vue.global.prod.js + gsap.min.js（本地化）
│   └── js/
│       ├── data.js         # 核心注册表 + L1 内容（表格/策略/代码块/推理链）
│       ├── data-l2..l10.js # 每讲内容：小节（双语块）+ 推理链 + 代码块 + QA
│       ├── components.js   # GridBoard 网格引擎 + L1 实验台 + 共享助手(window.RLV)
│       └── components-l2..l10.js  # 每讲交互实验台
├── check_templates.js      # 开发工具：Vue 编译器校验全部模板 + 导航/小节交叉检查
├── verify_site.js          # 开发工具：无头 Edge 整页截图 + 控制台错误 + 交互冒烟
├── diag_template.js        # 开发工具：二分定位单个组件模板的出错行
└── shots/                  # verify_site.js 生成的验收截图
```

## 扩展/修改指南

1. 内容：在对应 `data-lX.js` 的小节里增删 `{ t:'p'|'callout'|'formula'|'steps'|'widget', ... }` 块（全部 `{zh, en}` 双语）
2. 组件：在 `components-lX.js` 写新实验台，注册进 `window.COMPONENTS`；复用 `window.RLV`（stepOnce/网格几何/双语助手）与 `GridBoard`
3. 每个组件**必须**：`setup(){return {bi}}` 暴露双语助手；`computed:` 块只写一个（重复键会静默覆盖）
4. 模板属性里英文缩写撇号用 `’`（`today's` 会截断单引号表达式）
5. 验收：`node check_templates.js` → `node verify_site.js`（截图进 shots/）

## 教学要点备忘（已写进对应页面）

- 课件 p.8：**课上禁区"可进入但扣分"，作业代码是"弹回"** —— 转移实验台可切换两种规则
- 书 a1–a5（上右下左原）与代码 action_space（下右上左原）**列序不同**，作业策略矩阵以代码为准
- 作业坐标换算：s_i ↔ (x, y) = ((i−1)%4, (i−1)//4)，s8=(3,1)、s10=(1,2)、s12=(3,2)
- `plt.pause(0)` 在 Agg 后端会永久卡死；`add_policy` 必须在 `render()` 之后调用
