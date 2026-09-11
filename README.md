# RL 可视化课堂 · RL Visual Classroom

《Mathematical Foundation of Reinforcement Learning》(Shiyu Zhao) **全书十讲**的双语交互式可视化教程。
**L1–L10 全部完成**，共 88 个小节、72 个交互实验台（含十讲知识填空自测）、45 个 Vue 组件。

## 链接与包容性

- **hash 深链路由**：每个小节都有 `#sec-…` 地址——可直达、可收藏、可后退/前进、刷新不丢位置；滚动时地址栏静默跟随当前节（`history.replaceState`）
- **进度记忆**：真实读过的小节在侧栏打 ✓，存 `localStorage('rl-viz-visited')`，跨会话保留（只记当前激活节，不虚标）
- **上一节 / 下一节**底栏：按全书 88 节展平顺序逐节翻页（双语）
- **键盘可访问**：Q&A 翻转卡与网格可编辑格子支持 Tab + Enter/Space；全部滑杆带 `aria-label`；全局 `:focus-visible` 焦点环；`<html lang>` 随语言切换
- **五主题全适配**：图表/棋盘颜色全部走 CSS 变量（`--chart-*` / `--cell-alt`），深色主题下无白底突兀块

## 3D 知识星图 graph3d.html

独立页 `graph3d.html`：全书 **88 小节 + 10 讲枢纽**的 3D 网状知识图（3d-force-graph 本地化，离线可用）。

- 节点 = 小节，10 讲为枢纽节点；跨讲关联边带语义（前置 / 对照 / 延伸 / 应用）
- **8 条学习线索**：一键高亮成路径，按线索顺序走通全书
- **知识前沿**：结合已读进度（复用 `localStorage('rl-viz-visited')`）推荐下一步该看的节点
- 点击任意节点直达小节 `#sec-` 深链（与主站 hash 路由互通）
- 五主题 / 双语适配，与主站共享主题与语言记忆
- 数据再生成：改了任一 `data-lX.js` 后跑 `node scripts/build_graph3d.js`（输出 `assets/js/graph3d-data.js`）
- vendor：`assets/vendor/graph3d/`（npm devDependency `3d-force-graph` 的 dist 拷贝）

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
├── graph3d.html            # 独立页：3D 知识星图（全书网状知识网络）
├── assets/
│   ├── css/main.css        # 设计系统（tokens/双语排版/全部组件样式）
│   ├── css/graph3d.css     # 知识星图独立页样式（搜索/线索/信息面板）
│   ├── vendor/             # vue.global.prod.js + gsap.min.js（本地化）
│   ├── vendor/graph3d/     # 3d-force-graph dist（本地化，仅 graph3d.html 加载）
│   └── js/
│       ├── data.js         # 核心注册表 + L1 内容（表格/策略/代码块/推理链）
│       ├── data-l2..l10.js # 每讲内容：小节（双语块）+ 推理链 + 代码块 + QA
│       ├── components.js   # GridBoard 网格引擎 + L1 实验台 + 共享助手(window.RLV)
│       ├── components-l2..l10.js  # 每讲交互实验台
│       ├── graph3d-data.js # 知识图数据（由 scripts/build_graph3d.js 生成）
│       ├── graph3d.js      # 知识星图应用逻辑（搜索/选择/线索/知识前沿/深链）
│       └── graph3d-render.js  # 3D 渲染器工厂（window.G3DRender，封装 3d-force-graph）
├── scripts/
│   └── build_graph3d.js    # 从 data*.js 再生成 graph3d-data.js（节点/关联边/线索）
├── check_templates.js      # 开发工具：Vue 编译器校验全部模板 + 导航/小节交叉检查
├── verify_site.js          # 开发工具：无头 Edge 整页截图 + 控制台错误 + 交互冒烟
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

## 主题系统（2026-09-09 新增）

- 五套主题内置在 `assets/css/main.css` 末尾的 `html[data-theme=…]` 块：`chalk 墨板`（默认）/ `swiss 讲义` / `quant 深空` / `forest 教科书` / `classic 经典`（原版样式）
- 切换：顶栏右侧圆点切换器（`index.html` + `app.js` THEMES）；选择存 `localStorage('rl-viz-theme')`；`<head>` 里有引导脚本防首帧闪烁
- 改颜色**必须**走 CSS 变量（`--accent/--gold/--cyan/--green/--red/--violet/--code-*` 等），不要写死色值；写死色在深色主题下会破
- 每主题的动效性格：chalk 板书微旋转+虚线描边 / swiss 快而准+方角 / quant 辉光数字+发光轨迹 / forest 温和弹性+衬线标题
- `theme-picker.html`：独立的主题提案对比页（样机+四主题实时切换），留作设计参考

## 已完成轮次

| 轮次 | 日期 | commit | 主题 |
|---|---|---|---|
| 第一轮 | 2026-09-09 | `503eada` | 五套主题系统（墨板/讲义/深空/教科书/经典）+ 顶栏切换器 + 动效性格 |
| 第二轮 | 2026-09-10 | `f4c4190` | 全书深化：三层知识树、内容加厚（422 块 / 7.6 万字）、语言润色、动效系统 v2 |
| 第三轮 | 2026-09-10 | 见 git log | 链接与包容性：hash 路由深链 + 进度持久化 + 键盘可访问性 + 双语/主题净化 + 教学勘误（L10 真实 δ 轨迹、L7 清理、RingBoot 视口外暂停） |
| 第四轮 | 2026-09-10 | 见 git log | 结构与性能与公式工程：components 按讲拆分 + 根模板组件化 + sr()/种子化统一；按讲懒加载 + GSAP 移除（首载 1.15MB→0.40MB，-64%）；KaTeX 公式升级（57 块全 TeX 化、矩阵/分式真排版、vendor 本地按需加载）；SEO meta/JSON-LD + 打印样式；eslint + GitHub Actions CI + verify_site 26 条断言化；对比度 WCAG AA 调优（ink-3 与 chart-ink 五主题 ≥4.5:1）；27 节补 ConceptChain 复盘链（88/88 节有交互组件）；实验台口径修正为 62 |
| 第五轮 | 2026-09-11 | 见 git log | 知识星图：3D 网状知识图独立页（88 节点+10 枢纽+40 精选关联+8 线索+知识前沿），vendor 3d-force-graph 本地化，verify_site 加 graph3d 冒烟 |
| 第六轮 | 2026-09-12 | 见 git log | 知识填充自测系统：FillLab 组件（概念选择/数值/代码三种填空、判分即出讲解、localStorage 进度）+ 十讲题库 81 题（题源=书外延伸洞见+代码精讲要点+实验台实测数值）+ check_data fillSets 契约校验 |

**质量门禁**：`npm test`（模板编译 + 数据完整性）与 `npm run lint` 本地必过；`node verify_site.js` 40 条冒烟断言 + 零 console 错误；推送后 GitHub Actions 自动跑 check + smoke 两个 job。
