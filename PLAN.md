# 第三轮修改计划（2026-09-10 拟定并执行完毕；第四轮已同日完成，见下）

> ✅ 已于 2026-09-10 执行完毕

> 主题：**链接与包容性——hash 路由 + 进度持久化 + 可访问性 + 双语/主题净化 + 教学勘误**
> 前两轮：09-09 主题系统（503eada）、09-10 全书深化（f4c4190）。本轮针对质量审计出的最高优先级欠缺，规模与上轮相当（预计 15 文件左右，±1000 行）。
> 完成后按上轮格式提交：`feat: 链接与包容性——hash路由+进度持久化+可访问性+双语主题净化+教学勘误` + 每条一句的 bullet。

## 已知坑位（执行前必读）

1. 根模板在 index.html 的 in-DOM HTML 里：英文缩写撇号必须写 `’`，不能写 `'`（会截断属性表达式）；改完跑 `node check_templates.js`（它编译根模板+全部组件模板）。
2. 同一组件对象只能有一个 `computed:` 键（后者静默覆盖前者）。
3. 改色必须走 CSS 变量（`html[data-theme=…]` 五主题层，main.css 末尾）；写死色值在 quant/chalk 深色主题下会破。
4. `verify_site.js` 的冒烟选择器依赖中文文案（`has-text("训练")` 等）和硬编码小节 id——Phase 3 动按钮文案时，**双语模式（默认）下按钮必须仍含"训练/暂停/重置"字样**，否则冒烟全断；改小节 id 则需同步改脚本。
5. Vue/gsap 已本地化、无构建步骤——不许引入 npm 构建链，一切改动保持"双击 index.html 可用"。

---

## Phase 1 · hash 路由 + 导航补全 + 进度持久化（55 min）

现状：`app.js:91-108` 的 `go()` 只改内存状态，无 `location.hash/pushState/popstate`——无深链、后退即退出、刷新丢位置；`visited` 是内存 Set 且滚动时把上方全部节标完成（`app.js:134-135`），刷新清零、滚到底=全绿。

改动（`app.js` 为主，`index.html` 根模板、`main.css` 少量）：

1. **hash 路由**：`go()` 写 `location.hash = '#sec-lX-yyy'`；监听 `hashchange` 同步内部状态（含切到对应讲的单讲视图）；初始化时读 hash 恢复位置。滚动激活节变化时用 `history.replaceState` 静默更新（不刷历史栈）。
2. **上一节/下一节**：按 navGroups 展平顺序，在每个小节底部加 prev/next 底栏（双语，首个/末个对应隐藏或禁用）。
3. **visited 持久化 + 去失真**：`localStorage['rl-viz-visited']` 存节 id 数组；只标记当前激活节（视口中心那个），不再"上方全标"；侧栏 done ✓ 跨会话保留。
4. 深链直达的小节 reveal 动画直接终态（`rv-done`），不播 stagger。

验收：刷新保持位置；浏览器后退/前进在节间移动；直接打开 `#sec-l7-ql` 直达该节并处于 L7 单讲视图；侧栏 ✓ 刷新后仍在、且只有真读过的节有 ✓。

## Phase 2 · 可访问性基础包（40 min）

现状：全部 components*.js 中 `aria/role/tabindex/keydown` 命中数为 0；QA 翻转卡是 `div @click`（`components.js:1382-1400`）、GridBoard 可点格子是裸 `rect @click`（`components.js:240-242`）、全部滑杆无 label 关联（`components-l7.js:156-159` 等）；`:focus-visible` 全站仅 3 处；`<html lang>` 固定 `zh-CN` 不随语言切换。

改动：

1. QA 翻转卡：`role="button"` + `tabindex="0"` + `@keydown.enter.prevent/space.prevent` 触发翻转。
2. GridBoard 可编辑格子：rect 加 `tabindex="0"`、`role="button"`、`aria-label`（坐标+当前类型），Enter/Space 切换（键盘事件挂在 rect 上，SVG 可聚焦）。
3. 全部 `input[type=range]` 补 `aria-label`（直接用已有 bi() 双语标签文案）。
4. main.css 加一条全局 `:focus-visible` 焦点环（走 token 色），统一全部按钮/卡片/格子的键盘可见性。
5. `setLang` 时同步 `document.documentElement.lang = 'zh-CN' | 'en'`。

验收：纯键盘可完成"Tab 到 QA 卡 → Enter 翻转"；Tab 到格子可 Enter 切墙；滑杆有读屏标签；Tab 走查有可见焦点环。

## Phase 3 · 双语净化 + 主题净化（35 min）

现状：EN 模式下组件按钮仍是中文（`components-l7.js:160-162`、`components-l9.js:104-106`、`components-l10.js:122-123`、`components-l8.js:88,94-96`）；GridBoard 起点标签按网格尺寸而非语言分流（`components.js:181`，4×4 世界 EN 模式仍显示"起点"）；图表/棋盘大量硬编码色违反自家铁律（GridBoard 白格 `'#ffffff'` `components.js:157`、价值数字 `fill="#233"` `:232`、agent 白描边 `:236`、rewardPops `:219-221`、l8/l9/l10 图表白底+固定灰字 `components-l8.js:100`、`components-l9.js:126,128`、`components-l10.js:137-138`、RingBoot 箭头 `components-l2.js:143-149`）。

改动：

1. 上述按钮文案全部接 `bi()`；GridBoard 起点 tag 改按语言分流。**默认双语模式文案保留"训练/暂停/重置"字样**（坑 4）。
2. main.css 增补图表变量（如 `--chart-bg / --chart-ink / --chart-grid / --cell-alt`），五主题层各自赋值；把上列硬编码色全部替换为 `var(…)`（SVG 里用 CSS 类或 `fill="var(--…)"`）。
3. 顺手把 l8 里三处重复的 SVG 几何魔数（`10/380/170/150/12`，`components-l8.js:76,131,141`）提成本文件顶部常量。

验收：EN 模式截图按钮全英文、4×4 起点显示 Start；quant 深空主题下 l8/l9/l10 图表与 GridBoard 无白底突兀块（截图对比五主题）。

## Phase 4 · 教学勘误 + 一致性清理（20 min）

1. **L10 图例与实现不符（教学误导）**：`components-l10.js` 宣称"TD 误差轨迹"实际画 |w| 均值，且 `:84` `deltaTrace.push(0)` 是死写法——改为真实记录每步 TD 误差 δ 并画 δ 轨迹（标题、图例、纵轴同步），或明确改名"权重范数轨迹"（优先做真 δ，更有教学价值）。
2. L7 死代码 `recent` 数组删除（`components-l7.js:53,125-126`）；`doneMark` 阈值 300 与 play 停止阈值 1000 统一（`:77` vs `:133`）。
3. 数字口径统一：`index.html:7` "63 个交互实验台" 与 `README.md:4` "44 个 Vue 组件、约 20 个交互实验台" 矛盾——统一为 88 小节 / 63 实验台 / 44 组件。
4. README 删除不存在的 `diag_template.js` 引用（`README.md:50`）。
5. RingBoot 常驻 1.3s 轮询（`components-l2.js:103`）加 IntersectionObserver：仅进视口才转，移出暂停。

## Phase 5 · 验收 + 文档 + 提交（30 min）

1. `node check_templates.js` —— 全部模板编译 + navClusters 一致性通过（退出码 0）。
2. `python -m http.server 8642` + `node verify_site.js` —— 全站截图 + console 零错误；**新增冒烟**：① 深链 `#sec-l7-ql` 直达；② goto 后浏览器后退返回上一节；③ Tab+Enter 翻转 QA 卡；④ 深色主题下 l8/l9/l10 图表截图（无白底块）。
3. README 更新：新增能力（深链/键盘/进度记忆）、修正口径与目录说明；删除本 PLAN.md 的已完成标记（或移到"已完成轮次"附录）。
4. git commit，格式与上两轮一致：

```
feat: 链接与包容性——hash路由+进度持久化+可访问性+双语主题净化+教学勘误

- hash 路由：#sec-… 深链直达/后退前进/刷新恢复位置，滚动静默 replaceState
- 上一节/下一节底栏；visited 落 localStorage 且只记真实激活节
- 可访问性：QA 卡与格子键盘可达、滑杆 aria-label、全局 focus-visible、lang 随语言切换
- EN 模式组件按钮双语化；GridBoard 起点按语言；图表/棋盘硬编码色全部 token 化（五主题适配）
- 勘误：L10 TD 误差轨迹改为真实 δ、L7 死代码与阈值统一、README 口径修正、RingBoot 视口外暂停
- verify_site.js 新增深链/后退/键盘/深色主题冒烟
```

---

## 明确不做（留给后续轮次，避免 3 小时超支）

- KaTeX/MathJax 公式升级（矩阵/分式排版质感，需引 vendor + 全部 57 个 formula 块改造，≥3 小时的独立一轮）
- 按讲懒加载 / bundle 拆分 / GSAP 替换（首载 1.14MB 优化，属性能专项）
- eslint + CI + verify_site 断言化（工程化专项）
- components.js（1635 行）按讲拆分、根模板组件化（重构专项）
- Math.random 种子化、sr() 五处重复统一走 RLV.stepOnce
- 27 个无组件小节补 ConceptChain、打印样式、SEO meta/JSON-LD、对比度 token 调优


---

## 第四轮（同日追加执行完毕，2026-09-10）

原"明确不做"清单已全部完成，分四批提交：

1. **结构重构**：components.js（1635 行）拆为核心 797 行 + components-l1.js（887 行）；根模板移出 index.html 为 root-template.js（' 撇号规约随之消灭）；sr() 六处重复统一走 RLV.stepOnce（3070 例对比零差异）；l7-l10 实验台种子化（Reset 重训逐字节一致）。
2. **性能**：按讲懒加载（loader.js ensureLecture，首载 1,147,640B→408,759B，-64.4%）；GSAP 移除（rAF/CSS 重写两处动效）；SEO meta/og/canonical/JSON-LD + 路由级 document.title；@media print 打印样式。
3. **KaTeX**：vendor 本地化（css+js+60 字体）经 ensureKatex() 按需加载（首载预算 420KB 内不破）；57 个 formula 块全 TeX 化（53 纯 tex + 4 hybrid），String.raw 转义约定，矩阵 pmatrix/分式 frac 真排版；五主题 \htmlClass 色 映射 CSS 变量。
4. **工程+内容**：eslint flat config（0 error/0 warning，全仓零 disable）+ GitHub Actions CI（check + smoke 双 job）+ verify_site 26 条断言化且失败 exit 1；--ink-3 与 --chart-ink 五主题对比度全部 ≥4.5:1（WCAG AA）；27 个无组件小节补 ConceptChain（88/88 节有交互组件）；实验台口径修正 63→62（原 63 误将 L1 总结复盘链计入）。

---
---

# 第七轮计划（2026-09-13 拟定，**2026-09-14 执行完毕**）

> ✅ 已于 2026-09-14 执行完毕。交付：DerivationLab 组件 + L2–L10 九讲 12 条推导（数学 reviewer 对书核验零数学错误、数值全实算，S1–S7 全部修毕）；JupyterLite 瘦身子站 52MB（445MB→52MB，numpy/matplotlib 锁内离线）；NB0–NB6 七本 assert 自检笔记本（全部参考实现验证可解）；hero 第 5 钮/footer/lite.html hub/讲内 NotebookBridge 入口；check_data 契约+tex 严格渲染门禁；verify_site 50 断言全绿。实验台口径 72→81（+9 derivation-lab）、组件 45→47。顺手修掉 L6 存量"抖动 ∝ α²"缩放错误（含重设计一道填空题）与 L9 式 (9.32) 引用口径。

> **For agentic workers:** 本计划按 Phase 执行，步骤用 checkbox 跟踪；Phase 2/4 是内容扇出轮，按"派发模板"整批派 coder、验收标准即核对清单。

> 主题：**充分理论推导 + JupyterLite 笔记本实验室——从"消费型理解"补上"产出型训练"**
> 来源：2026-09-13 评审结论——站点把"看懂"做到 95 分，但学习者全程只读/看/拖/选/翻，无一处要求产出（写代码、推证明、设计实验），学完仍难应对代码与科研。本轮补两块最承重的：**亲手推导**（DerivationLab）与**亲手跑代码**（站内 Jupyter）。

**Goal:** 每讲挂可交互的定理推导链（12 条承重推导，走步+关键步填空），并部署浏览器内 Jupyter 实验室（JupyterLite/Pyodide，六本带 assert 自检的 numpy 笔记本）。

**Architecture:** 推导复用 FillLab 的 choice 判分与 ReasoningLab 的走步模式，新组件 `derivation-lab` 挂每讲 qa 节（零 navGroups/graph3d 结构涟漪）；Jupyter 以独立静态子站 `/lite/` 落地（jupyterlite build 产物），主站只加 hub 页 `lite.html` 与讲内 bridge 卡深链过去，不碰 Vue 主应用。

**Tech Stack:** 现有 Vue3(no-build)+KaTeX 栈；新增 jupyterlite + pyodide（uv 独立 Python env 构建，产物静态目录，gitignore）。

## 决策记录（为什么这么选）

1. **Jupyter 方案 = JupyterLite，不是自建 Pyodide runner / Binder / 纯下载**。
   - Binder：依赖外部服务，国内不可达，否。
   - 纯下载 .ipynb：零摩擦但零完成率，学习者大概率不装环境，否。
   - 自建 Pyodide 多格 runner：能融进实验台样式，但要自己造 notebook UX，且与 JupyterLite 双份 Pyodide 运行时维护，否（留作 v2 微练习的候选）。
   - JupyterLite：官方静态构建（Pyodide 内核，numpy/matplotlib 开箱），真 Jupyter 操作技能直接迁移科研，部署后纯静态符合"无后端"铁律。代价：iframe 内 UI 不能套主站五主题、首启下载 pyodide+numpy 约 10–15MB（brotli 后，matplotlib 再 +8–10MB）——用强缓存+导览本不用 matplotlib 缓解。
2. **推导挂 qa 节 fill-lab 之后**（同 FillLab 先例），不新增小节——不动 navGroups/navClusters/check_templates 交叉引用，也不用重跑 build_graph3d.js。
3. **笔记本 numpy-only**。pyodide 里 torch 不可行（体积 GB 级）；TD-Linear/REINFORCE 均可 numpy 手写，DQN 真网络在 NB6 尾部给 Colab 上传链接（外链，标注）。底本用 `D:\rl course\book-repo\Code for grid world\python_version`（data.js 头注释引用的书配代码），瘦身改造不重写。
4. **笔记本自检 = assert 格**（跑绿即通过），v1 不做 lite→主站进度回传（跨 iframe postMessage 留 v2）。

## 已知坑位（执行前必读）

1. 继承老坑：改色必须走 CSS 变量；同一组件对象只能一个 `computed:` 键；组件模板字符串里 TeX 必须 `String.raw`（`\f` 会变 formfeed）；`\textcolor` 不认 CSS 变量，配色用 `\htmlClass{fx-gold 等}{…}`（render 需 `trust:true, strict:'ignore'`）——derivation 的 tex 字段同样适用。
2. **容器预置模式**：`data.js` 注册表区已预置 `fillSets: {}`；derivationSets 照抄——在 data.js 预置空注册表，各 data-lX 尾部 `D.derivationSets = D.derivationSets || {}` 兜底行（幂等无害）。
3. KaTeX 经 `loader.ensureKatex()` 按需加载——derivation-lab 挂 qa 节时 KaTeX 大概率已被 formula 块加载，但组件仍须走 ensureKatex 而非假设已存在（单讲视图深链直达 qa 节的场景）。
4. **JupyterLite 不持久化 kernel 状态**，浏览器刷新丢变量；文件改动默认不落盘——`jupyter-lite.json` 需配存储（或接受"每次重跑"，导览本开头写明）。构建版本锁进 `lite-build/requirements.lock`，产物体积/传输以构建后实测为准（预估 lite/ 目录 50–100MB）。
5. **宝塔重配站点可能覆盖手工 location 块**（nginx 缓存事故的老坑）——`/lite/` 的缓存规则加进部署文档并在每次发版后 curl 验证响应头。
6. verify_site.js 冒烟依赖中文文案与硬编码小节 id；Phase 4/5 新断言沿用既有写法（元素截图 `.locator('.lab')`，滚动用 `behavior:'instant'`）；8642 僵尸端口清理（`netstat -ano | grep 8642` + taskkill）。
7. CI 不构建 lite（下载 pyodide ~200MB 太重）——lite 构建是发版时本地步骤；verify_site 对 lite 的断言做成"lite/ 不存在则跳过并提示"。

---

## Phase 1 · DerivationLab 组件 + 契约校验 + L2 试点（先行，≈半天）

**Files:**
- Modify: `assets/js/components.js`（新增 DerivationLab 组件 + 注册表加 `'derivation-lab'`；判分复用文件内已有 `judgeBlank`）
- Modify: `assets/js/data.js`（注册表区预置 `derivationSets: {}`，同 fillSets 位置约 :827）
- Modify: `assets/js/data-l2.js`（试点推导 1 条：Bellman 方程从回报展开，挂 `l2-qa` 节 fill-lab 之后）
- Modify: `scripts/check_data.js`（新增 derivationSets 契约校验；**顶部 `EXPECT_COMPONENTS = 45` → 46**，否则 CI check job 必挂）
- Modify: `verify_site.js`（断言 +2（现 39）：derivation-lab 冒烟 + 元素截图）

- [ ] 1.1 data.js 预置容器 + data-l2.js 尾部兜底行（坑 2），`node scripts/check_data.js` 仍过（此时无 derivationSets，校验应为空集通过）
- [ ] 1.2 **先写契约校验**（TDD）：check_data.js 加 `checkDerivations()`——items 数、每 item `steps.length ≥ 6`、每 step `tex` 非空字符串、`why` 双语、`blank` 可选但出现时 `choices.length ≥ 2 && answer ∈ [0, len)`；跑一次确认对"缺失结构"报错退出 1
- [ ] 1.3 DerivationLab 组件，行为规格：
  - 走步模式（同 ReasoningLab：下一步/全文模式/重来/进度 x/y）；
  - 每步渲染 `tex`（KaTeX display 模式，`ensureKatex()` 后 `katex.render(String.raw…)`）+ `why` 行（该步凭什么成立——引理/替换/取期望）；
  - 带 `blank` 的步骤**答对才放行**（复用 `judgeBlank`；choice 型比下标；错误选项点选后即时标红并给一句 whyWrong，若有）；提供"看提示"降级（显示 `hint`）后可选继续；
  - 完成态打勾 + `localStorage['rl-viz-deriv-<source>']` 记录已完成 item 下标；
  - 键盘可达（按钮原生 button + blank 选项 role=radio/Enter 选择，同 FillLab 模式）。
- [ ] 1.4 L2 试点数据（完整 14 步骨架已写入本计划附录 A，照抄即用）；`node check_templates.js` + `node scripts/check_data.js` 过
- [ ] 1.5 verify_site.js 断言：深链 `#sec-l2-qa` 出现推导组件、走 3 步、答对 1 个 blank、`.lab` 元素截图
- [ ] 1.6 提交 `feat: DerivationLab 组件+契约校验+L2 试点推导`

**验收**：本地起 8642，深链进 L2 qa 节可完整走完 Bellman 推导（含 3 个填空步，答错不放行）；check_data/check_templates/verify_site 全绿；EN 模式走一遍无中文残留。

## Phase 2 · 全书 12 条推导扇出（内容轮，≈半天+）

**Files:** Modify `assets/js/data-l2.js`～`data-l10.js` 各一（互不冲突，可整批并行派发）。

清单（= 验收对照单；步数 8–20/条，每条 ≥2 个 blank 步）：

| # | 讲 | 推导 | 锚点（现有内容已提及） |
|---|----|------|------|
| 1 | L2 | Bellman 方程从回报逐步展开（试点，Phase 1） | §2.4 |
| 2 | L2 | 闭式解 v=(I−γP)⁻¹r：Neumann 级数证 (I−γP) 可逆 | §2.7 |
| 3 | L3 | Bellman 最优方程：max 与期望的交互、为何挡住线性求解 | §3 全讲 |
| 4 | L4 | Banach 压缩映射 → Bellman 算子是 γ-压缩 → 不动点存在唯一 | 已提 Banach/不动点 |
| 5 | L4 | 值迭代误差界 ‖vₖ−v*‖ ≤ γᵏ/(1−γ)·‖v₀−v₁‖ | §4 收敛性 |
| 6 | L5 | MC 均值无偏性 E[x̄]=E[X] 与 var/n 收缩 | §5.3 增量均值（已有 1/k 填空题，推导链展开） |
| 7 | L6 | Robbins-Monro：从均值估计到求根；步长条件 Σα=∞、Σα²<∞ | 已提 RM |
| 8 | L6/L7 | Dvoretzky 定理完整版（条件→结论→直觉）+ TD(0)/Q-learning 是其特例——把现有"证明引用 Dvoretzky"做实 | l6/l7 多处引用 |
| 9 | L8 | 半梯度 TD 目标推导 + DQN 损失梯度"追自己"展开（→目标网络动机） | §8 TD-Linear/DQN 骨架 |
| 10 | L9 | **策略梯度定理完整推导**（log-derivative trick，∇logπ 消掉转移项）——全书科研含金量最高，步数给足（18–22 步） | 已提 log-derivative |
| 11 | L10 | baseline 不改期望只降方差：E[(G−b)∇logπ]=E[G∇logπ] 完整推导 | §10 |
| 12 | L10 | Actor-Critic：TD 误差 δ 替真实回报的推导链 | §10 |

- [ ] 2.1 **9 个文件**（data-l2.js～data-l10.js；L1 无 qa 节不挂）整批并行派发，每文件 1 个 coder 防同文件写冲突；双条文件合给同一 coder：L2（#1#2）、L4（#4#5）、L10（#11#12）。**#8 Dvoretzky 挂 l7-qa**（Q-learning 收敛是其主用武之地），L6 只挂 #7 Robbins-Monro。派发指令给：数据契约（同 Phase 1 试点结构）、该条推导的步骤纲要（每步一句"这步要写什么公式+凭什么是它"）、验收=check_data 该讲过 + verify_site 该讲冒烟过
- [ ] 2.2 数学内容红线：只推书内定理（Zhao《Mathematical Foundation of RL》对应章）；书外延伸不得进推导链（可作脚注 callout）
- [ ] 2.3 收割：`node scripts/check_data.js` 全绿（EXPECT_COMPONENTS=46）；verify_site 十讲 derivation-lab 冒烟全绿（断言 +9 左右，L2–L10 每讲一条，按实际计）
- [ ] 2.4 提交 `feat: 全书 12 条承重定理交互推导（L2–L10 derivationSets）`

**验收**：每讲 qa 节 fill-lab 之后出现推导；抽查 L9（最长链）完整走通；五主题截图无破版。

## Phase 3 · JupyterLite 基建（≈半天）

**Files:**
- Create: `lite-build/`（uv env 说明 + `requirements.lock` + `jupyter-lite.json` 模板 + build.md 操作文档）
- Create: `notebooks/`（源 ipynb，git 管内容；Phase 4 填）
- Create: `lite.html`（主站风格 hub 页：NB 卡片列表——名称/对应讲/难度/时长/前置；每卡深链 `/lite/lab/index.html?path=notebooks/<file>.ipynb`；页首一条带宽提示"首启下载 ~15MB，之后强缓存"）
- Create: `.gitignore` 追加 `lite/`（构建产物，同 node_modules 待遇）
- Modify: `README.md`（笔记本实验室一节）、`verify_site.js`（lite.html 冒烟 + lite/ 产物存在性可选断言）

- [ ] 3.1 `uv venv lite-build/.venv && uv pip install 'jupyterlite[pyodide]'`，锁版本进 requirements.lock；`jupyterlite build --contents notebooks --output-dir lite`（含 `--pyodide` 拿离线内核包，全本地无 CDN 依赖）
- [ ] 3.2 `jupyter-lite.json`：禁不需要的扩展（减体积）、配浏览器存储（坑 4）、notebooks 目录挂载确认
- [ ] 3.3 NB0 导览本（约 30 格）：环境自检格（pyodide/numpy 版本 print+assert）→ 4×4 GridWorld 瘦身复刻（从 book-repo 底本抄 env 类，保留 step/reset/reward 三方法 + assert 验证转移与奖励对得上站点作业世界配置——`data.js:53` A4：奖励 −1/−1/+1/0、γ=0.9、禁区 s8/s10、目标 s12；站内无 T4/R4 常量，勿按图索骥）→ "跑通即毕业"说明
- [ ] 3.4 lite.html hub 页 + hero 第 5 钮"📓 笔记本实验室"（graph3d 按钮模式照抄）+ footer 链接。lite.html 为纯静态独立页（graph3d.html/theme-picker.html 先例），不进 Vue 模板校验；eslint 以全仓 0/0 为准
- [ ] 3.5 本地验收：`python -m http.server 8642` 根目录起 → `/lite/lab/` 能打开、NB0 逐格跑绿（含 assert 格）；lite/ 不存在时 verify_site 跳过 lite 断言并 console 提示
- [ ] 3.6 提交 `feat: JupyterLite 笔记本实验室基建（lite 子站+hub 页+NB0 导览）`

**验收**：断网（或 localhost）状态 NB0 全绿——证明零 CDN 依赖；hub 页五主题可切；主站首载预算不受影响（lite 资源仅点击后经 iframe 加载）。

## Phase 4 · 六本笔记本扇出 + 讲内入口（内容轮，≈半天+）

**Files:** Create `notebooks/nb1..nb6.ipynb`；Modify `assets/js/components.js`（NotebookBridge 静态卡片组件）+ 各 `data-lX.js` code 节尾部挂 bridge + `scripts/check_data.js`（**EXPECT_COMPONENTS 46 → 47**）。

| 本 | 对应讲 | 内容主线 | 自检 assert |
|----|--------|----------|-------------|
| NB1 | L2/L3 | 手算 Bellman 一轮 → 编程迭代验证；闭式解 vs 迭代对比 | 收敛值与闭式解差 <1e-6 |
| NB2 | L4 | 值迭代/策略迭代实现；收敛曲线；γ∈{0.5,0.9,0.99} 扫描 | 三 γ 下迭代次数与策略 |
| NB3 | L5/L6 | MC 均值多 seed 方差实验（呼应"方差是第一公民"）；RM 步长 α=1/tᵏ 三种 k 对比 | 无偏性/方差塌缩数值断言 |
| NB4 | L7 | Q-learning 复现（seed 可调）+ α/ε 敏感性 + 10-seed 误差带（呼应评审缺口 7） | 最优策略命中率阈值断言 |
| NB5 | L8 | TD-Linear（numpy 线性函数近似）+ 特征设计消融 | 收敛曲线末端阈值断言 |
| NB6 | L9/L10 | REINFORCE（numpy softmax 策略梯度）+ baseline 消融（对应推导 #11） | 回报上升趋势断言；尾部 Colab 上传指引（DQN 真网络外链） |

- [ ] 4.1 六本整批并行派发（每本 1 个 coder）；统一模板：引导文（双语可选，正文中文为主）+ `# TODO` 格（给签名/注释/形状提示）+ `# ✅ 自检` assert 格（跑绿才算完）+ `# 🏔 挑战` 格（无答案开放任务，呼应评审缺口 8）+ 每 ≥1 个多 seed 实验格
- [ ] 4.2 NotebookBridge 组件（静态卡片：本名/一句话目标/难度/预估时长/"在 Jupyter 中打开"深链）挂各讲 code 节尾；lite.html 卡片数据与 bridge 共用一份 `notebooks/manifest.json`（id/讲/难度/文件名），单一事实源
- [ ] 4.3 重建 lite（`jupyterlite build`），verify_site：hub 卡片数=manifest 数、bridge 深链格式断言
- [ ] 4.4 提交 `feat: 六本 numpy 实验笔记本 + 讲内 NotebookBridge 入口`

**验收**：每本逐格跑绿（人工 + 抽 2 本 headless 冒烟可选）；manifest 与 hub/bridge/实际文件三方一致。

## Phase 5 · 总验收 + 部署（≈2 小时）

- [ ] 5.1 全套：`node check_templates.js` && `node scripts/check_data.js` && `node verify_site.js`（含 lite 可选断言）零错零警告；eslint 0/0
- [ ] 5.2 文档：README 补推导系统+笔记本实验室两节（口径：12 推导/6 笔记本/hub 路径）；PLAN.md 本轮标记执行完毕
- [ ] 5.3 nginx：`/lite/` 加 `js/wasm 7d 强缓存`、`location = /lite/lab/index.html` no-cache（部署文档记录宝塔覆盖风险，坑 5）
- [ ] 5.4 部署序列：① index.html `RLV_VERSION` → 20260913a ② git push ③ 本地 `jupyterlite build` ④ tar（index.html+lite.html+graph3d.html+assets+README+theme-picker.html+**lite/**）→ scp /tmp → 远程解压覆盖 + chown www:www（lite 目录大，scp 预计数分钟）⑤ 线上验证：`/lite/lab/` 打开 + NB0 远程跑绿 + curl 响应头确认缓存规则 + 主站 verify 冒烟
- [ ] 5.5 提交信息模板：

```
feat: 充分理论推导 + JupyterLite 笔记本实验室（第七轮）

- DerivationLab：走步式定理推导组件，关键步答对放行，进度落 localStorage
- 全书 12 条承重推导（Bellman 展开/闭式可逆/最优方程/压缩映射×2/MC 无偏/
  RM/Dvoretzky/半梯度与 DQN 梯度/策略梯度定理/baseline/AC 替换）
- JupyterLite 子站 /lite/（pyodide 内核，numpy/matplotlib 离线）
- hub 页 lite.html + hero/footer 入口 + 六本 assert 自检笔记本 + 讲内 bridge 卡
- check_data 新增 derivationSets 契约；verify_site 断言扩展；CI 不变
```

## 明确不做（v2 候选，防本轮超支）

- 站内自建 Pyodide 微练习组件（单格改代码→跑→判输出；与 lite 双运行时，待 lite 体量实测后再定）
- 实验台"预测模式"（跑前先填预期值）与多 seed 实验台改造（评审修复清单 1/2，独立小轮）
- lite→主站进度回传（postMessage）、实验设计题库、DQN 站内真网络（Colab 外链已覆盖）
- 推导链进 graph3d 知识星图（需重跑 build_graph3d.js，收益低）
- EN 完整双语笔记本（中文为主，术语标注英文）

## 附录 A · L2 试点推导步骤纲要（Phase 1.4 照此展开）

目标：v_π(s) = E[G_t|S_t=s] → v = r_π + γP_π v 的 14 步链，blank 两处（第 3、9 步标 ★，满足每条 ≥2 blank 红线；第 11 步的钩子用文字标注，不带 ★）。

1. 起点：回报定义 G_t = R_{t+1} + γR_{t+2} + γ²R_{t+3}+…，写明为何 γ<1 保证收敛（引 L1 等比级数填空题）
2. 拆第一项：G_t = R_{t+1} + γ(R_{t+2} + γR_{t+3}+…) = R_{t+1} + γG_{t+1}（自举结构露头）
3. ★ blank：代入期望 v(s)=E[G_t|S_t=s]，E[R_{t+1}+γG_{t+1}|s] 用期望线性拆成哪两项（choice：正确=v(s)=E[R_{t+1}|s]+γE[G_{t+1}|s]；干扰=先 max 再期望/漏 γ）
4. E[R_{t+1}|s] = Σ_a π(a|s)Σ_r p(r|s,a) r ≜ r_π(s)（对 a、r 双重求和展开）
5. E[G_{t+1}|S_{t+1}=s'] = v(s')（马尔可夫性：未来只依赖 s'，这一步 why 必须点明）
6. E[G_{t+1}|s] = Σ_{s'} p(s'|s) v(s')（全期望公式展开）
7. p(s'|s) = Σ_a π(a|s)p(s'|s,a) ≜ P_π 的定义
8. 合并：v(s) = r_π(s) + γ Σ_{s'} P_π(s|s') v(s')——单状态形式完成
9. ★ blank：矩阵-向量形式 v = r_π + γP_π v 中 P_π 的 (i,j) 元素是什么（choice；干扰：把 π 放错边/漏 p(s'|s,a)）
10. 为何这不是"解出来了"：v 出现在两边（自举悖论，呼应 §2.1 动机）
11. 移项 (I−γP_π)v = r_π（留给推导 #2 的钩子：I−γP_π 何时可逆）
12. 迭代视角 v_{k+1} = r_π + γP_π v_k（不动点语言埋 L4 伏笔）
13. 数值验证钩子：NB1 将用代码验证第 9 步矩阵形式
14. 闭合卡：这条链每一环——γ 收敛→拆项→线性→马尔可夫→全期望→矩阵——谁也少不了谁

---
---

# 第八轮施工记录（2026-09-15）

> 主题：**官方资料索引 + 每讲官方视频索引**——课程官方视频与本站十讲一一对应，英文清单 54 集与 B 站中文合集（`BV1sd4y167NS`）同号（`?p=N` ↔ `index=N`），让"每一讲精确挂到官方视频的具体分集"成为可能；另补一个全书资料索引独立页。规格唯一事实源：`docs/round8-spec.md`（链接事实源：`D:\rl course\course-materials.md`；分集数据：`docs/round8-video-data.json`）。本轮**不新增小节（88 不动）、不新增公式块（57 不动）、不删任何现有 widget**；官方视频索引卡是资料卡，不计入"交互实验台"（81 不变）。

## 目标

1. 每讲一张官方视频索引卡：`official-videos` 组件注册进 `assets/js/components.js` 的 `window.COMPONENTS`（核心文件，十讲共用），挂每讲首个内容小节；逐集「中文版 / English」双链 + 总览集入口（官方第 1 集共用）+ 小节 ↔ 分集对照说明；DOM 钩子契约（`.ovl-card[data-source]` / `.ovl-range` / `ul.ovl-list > li.ovl-ep` / `.ovl-a-cn` / `.ovl-a-en` / `.ovl-all-cn` / `.ovl-all-en` / `.ovl-overview`）见规格第 2 节。
2. 独立页 `resources.html`：照 `lite.html` / `graph3d.html` 纯静态先例；七组资料（官方入口 / 视频课程含十讲分集对照表 / 教材与勘误 / 社区实现 / 中文笔记 / 外部课程 / 合规提醒 callout）；`#res-stats` 含 `54`、`.res-card` ≥ 20；顶栏给 `graph3d.html` 与 `lite.html` 各加返回链接。
3. 文档与门禁口径同步：组件 47 → **48**（本轮唯一计数改动）；README 补第七轮（此前漏记）与第八轮条目；主站三处 meta、页脚入口更新。

## 改动面

- 组件与内容作者（另一位负责人）：`assets/js/components.js`（official-videos + hero 第三钮）、`assets/js/data*.js`（按 `docs/round8-snippets/` 追加十讲分集数据）、`assets/css/main.css`（`ovl-` 样式段）、`resources.html`（新建）、`graph3d.html` / `lite.html`（顶栏链接）
- 门禁与文档口径（本人）：`scripts/check_data.js`（`EXPECT_COMPONENTS 47→48` + 头注释）、`assets/js/root-template.js`（页脚 zh/en 行各加 resources.html 链接）、`index.html`（`:7` `:10` `:18` 三处 meta：48 组件 + 官方资料索引能力）、`verify_site.js`（新增 `[smoke-resources]` 断言块 7 条 + 头注释计数）、`README.md`、`PLAN.md`

## 门禁

- `EXPECT_SECTIONS = 88` / `EXPECT_FORMULAS = 57` 不动；navGroups / graph3d-data.js / `scripts/build_graph3d.js` 不碰
- `verify_site.js` 现有断言一条不删（尤其 notebook-bridge / derivation-lab / graph3d 的 88 与 10）；新断言只依赖规格第 2 节的 DOM 钩子契约，不为过断言改他人文件
- 施工期间不跑 `npm test`（`EXPECT_COMPONENTS=48` 与组件落地间存在短暂不一致，收尾验证波统一跑）

## 验收结果（2026-09-15 收尾验证波回填，全部实测）

- **契约门禁**：`npm test` → `sections: 88/88 · components: 48/48 · formula blocks: 57/57 · katex snippets rendered: 300, failures: 0 · fill sets: 10 · derivation sets: 9`，`ALL DATA CHECKS PASSED`；`npm run lint` → 0 error / 0 warning。
- **端到端冒烟**：起 `http.server 8642` 后 `node verify_site.js` → **57/57 smoke asserts passed**，退出码 0，`NO CONSOLE ERRORS`。新增段实测行：`resources assert: status=200 stats54=true cards=41 l2Eps=5 l2CnHref=https://www.bilibili.com/video/BV1sd4y167NS/?p=4 l7Eps=8`；`shots/resources.png` 已生成（798 KB）。原有断言（graph3d 88/10、notebook-bridge、derivation-lab、lite、file://）全部照旧通过。
- **数据正确性**：程序化全量比对 `data*.js` 的 (n, yt, en) 与 `docs/round8-video-data.json` → 零差异，各讲集数 L1=2…L10=5 与规格表一致、编号连续无重号；`n=1` 总览集由 `.ovl-overview` 承担，全集 54 无遗漏。
- **独立评审（reviewer，只读）**：总 verdict `pass-with-notes`，无 blocker、无 should-fix。notes 之一（双语模式下内联链接「中文版Chinese 英文版English」黏连）**已当场修复**：`official-videos` 模板内联标签统一改用 `bi()` 助手（对齐 `notebook-bridge` 先例，`du-line` 生效），修复后重跑冒烟仍 57/57、零 console 错误，并实测 10 个链接内的 `span.zh`/`span.en` computed `display` 均为 `block`。
- **人工目检**：`shots/resources.png`（七组资料卡 + 十讲分集对照表 + 合规 callout）、`shots/ovl-l2-after.png`（L2 卡双语模式）、`shots/ovl-l2-en.png`（英文单语）三张截图确认排版与双语切换正常。
- **遗留口径**：`data*.js` 追加片段为 LF 行尾、原文件为 CRLF，形成混合行尾（git autocrlf 提示，功能无影响）；如后续要统一，`git add --renormalize .` 处理即可。

