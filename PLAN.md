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
