# 第 8 轮施工规格：官方资料索引 + 每讲官方视频索引

> 内容来源：`D:\rl course\course-materials.md`（本轮所有外链的唯一事实源，链接均已实测可达）
> 视频编号数据：`docs/round8-video-data.json`（由 `book-repo/Readme.md` 官方清单机器生成，54 集，编号无缺口）
> 本轮**不新增小节、不改公式块、不删任何现有 widget**。

---

## 0. 为什么这么做（先读，避免改错方向）

- 站点现有 88 小节 / 47 组件 / 57 公式块 / 81 实验台，**目前完全没有外链基础设施**（全部 `data*.js` 里 `http` 出现次数为 0）。
- 课程官方视频与本站十讲**一一对应**：英文清单共 54 集，B 站中文版是**同一个单视频的分 P**（`BV1sd4y167NS`），且 `?p=N` 的 N 与官方清单 `index=N` **完全同号**。这就让"每一讲精确挂到官方视频的具体几集"成为可能——这是本轮的核心增量。
- 交付物两块：① 每讲一个官方视频索引卡（进正文，数据驱动）；② 一个独立页 `resources.html`（全书资料索引，照 `lite.html`/`graph3d.html` 的纯静态先例）。
- 口径定义（写进 README/meta 时用）：官方视频索引卡是**资料卡，不计入"交互实验台"**，所以 `81 个交互实验台` 不变；Vue 组件数 47 → **48**。

## 1. 硬约束（来自现有门禁，违反必挂 CI）

1. **不新增小节** → `EXPECT_SECTIONS = 88` 不动；navGroups / navClusters / graph3d-data.js / `scripts/build_graph3d.js` **都不用碰**。
2. **新增 1 个组件** → 必须同步改 `scripts/check_data.js:8` 的 `EXPECT_COMPONENTS = 47` → `48`（唯一一处计数改动），否则 CI `check` job 必挂。
3. **不新增 formula 块** → `EXPECT_FORMULAS = 57` 不动。
4. **不许删** L2–L10 的 `notebook-bridge`（在 `lX-code`）与 `derivation-lab`（在 `lX-qa`）——`verify_site.js` 有硬断言。
5. 组件规范：`setup(){ return { bi } }` 暴露双语助手；**每个组件只能有一个 `computed:` 块**（重复键静默覆盖）。
6. 模板属性里的撇号必须用 `’`（英文直角单引号会截断表达式）。
7. 站点自有文案一律 `{zh, en}` 双语；只有**官方视频标题**是英文专有名词，按原样显示一次，不硬造中文译名。
8. 颜色走 main.css 的 CSS 变量，**不写死色值**；`npm run lint` 必须 0 error / 0 warning（eqeqeq、no-trailing-spaces、eol-last、no-multiple-empty-lines ≤2）。
9. 施工期间**不要跑 `npm test`**（`EXPECT_COMPONENTS` 会短暂不一致）；全部门禁在收尾的验证波统一跑。

## 2. 组件契约：`official-videos`

注册位置：`assets/js/components.js` 的 `window.COMPONENTS`（核心文件，**必须**放这里——十讲都要用，不能放按讲懒加载的 `components-lX.js`）。

**数据契约**（各 `data-lX.js` 已由 `docs/round8-snippets/` 提供，组件只需读）：

```js
D.videoSets['l2'] = { min: 4, max: 8, episodes: [ { n: 4, en: '…', yt: 'XCzWrlgZCwc' }, … ] };
```

**链接规则**（两版同号，务必照抄）：
- 中文 B 站：`https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>`
- 英文 YouTube：`https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>`
- 总览（官方第 1 集，所有讲共用）：B 站 `?p=1` / YouTube `watch?v=ZHMWHr9811U&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=1`

**讲名**：从 `D.otherLectures`（字段 `{no, zh, en}`）里按 `no === Number(source.slice(1))` 取 `zh`/`en`；取不到时回退 `'L' + n`。

**必须渲染出的 DOM 钩子**（收尾波冒烟断言要用，类名不可改）：

| 钩子 | 要求 |
|---|---|
| `.ovl-card[data-source="lX"]` | 根元素，带 `data-source` |
| `.ovl-range` | 文本含 `P<min>` 与 `P<max>`，例如 `P4–P8` |
| `ul.ovl-list > li.ovl-ep` | 每集一行，**数量必须等于 `episodes.length`** |
| `.ovl-a.ovl-a-cn` | 每行中文版链接，`href` 必须匹配 `BV1sd4y167NS/\?p=<n>` |
| `.ovl-a.ovl-a-en` | 每行英文版链接，`href` 含 `index=<n>` |
| `.ovl-all-cn` / `.ovl-all-en` | 两个"从第 1 集开始播"按钮（指向 min 集） |
| `.ovl-overview` | 总览集入口（上面那条固定链接） |

**文案要求**（双语，`<span class="zh">` / `<span class="en">`）：卡片标题（如「官方视频索引」/「Official Video Index」）、一句说明（中文版与英文版**同一编号，第 n 集就是第 n 集**；本站小节 ↔ 官方分集的对应关系）、按钮文字（「中文版」「English」而不是「CN/EN」也行，但必须双语成对）。

**样式**：`ovl-` 前缀，写在 `assets/css/main.css` 末尾新开一节（本轮唯一改 main.css 的人就是组件作者）。列表要能在窄屏折行；每行形如 `P4 · Bellman Equation (P1-Motivating examples)` + 右侧两个小链接。

## 3. 每讲数据插入（10 个文件，每文件一个负责人）

`docs/round8-snippets/INDEX.json` 给出清单，`docs/round8-snippets/lX.js` 是**可直接追加**的成品代码块：

| 讲 | 文件 | 挂到哪个小节 | 分集范围 | 集数 |
|---|---|---|---|---|
| L1 | `data.js` | `grid-world` | P2–P3 | 2 |
| L2 | `data-l2.js` | `l2-why` | P4–P8 | 5 |
| L3 | `data-l3.js` | `l3-improve` | P9–P12 | 4 |
| L4 | `data-l4.js` | `l4-vi` | P13–P15 | 3 |
| L5 | `data-l5.js` | `l5-mean` | P16–P21 | 6 |
| L6 | `data-l6.js` | `l6-incremental` | P22–P28 | 7 |
| L7 | `data-l7.js` | `l7-td0` | P29–P36 | 8 |
| L8 | `data-l8.js` | `l8-representation` | P37–P44 | 8 |
| L9 | `data-l9.js` | `l9-representation` | P45–P49 | 5 |
| L10 | `data-l10.js` | `l10-qac` | P50–P54 | 5 |

操作：把 `docs/round8-snippets/<lec>.js` 的**全文**追加到对应文件的**最末尾**（它自带 IIFE 包装、用 `window.DATA` 取注册表，因此不依赖文件内的局部变量名）。追加后自查：`node -e "eval(require('fs').readFileSync('<文件>')); "` 之类的语法检查不必要，**用 `node --check <文件>` 确认语法**，并 grep 确认 `videoSets['<lec>']` 与 `blocks.push` 各出现 1 次。

## 4. 独立页 `resources.html`

照 `lite.html` / `graph3d.html` 先例：**纯静态 HTML + 原生 IIFE，不加载 Vue**；`<head>` 里放主题防闪烁脚本 + 自定 `window.RLV_VERSION`；引 `assets/css/main.css?v=<戳>`；页内 `<style>` 只写布局（`res-` 前缀）。

- localStorage 键**必须**沿用：主题 `rl-viz-theme`、语言 `rl-viz-lang`（`setTheme`/`setLang` 照 `graph3d.js:220-240` 抄，语言写 `document.body.dataset.lang`，`zh|en|both`；双语显隐靠 main.css 全局规则 + `span.zh`/`span.en`，页内不用写规则）
- 顶栏：返回 `index.html`、`graph3d.html`、`lite.html` + 语言三钮 + 五主题钮（类名沿用 `dot-theme-*` 那套记号）
- **`#res-stats` 元素必须有**，文本要含 `54`（官方视频集数）；卡片类名用 `.res-card`，**总数 ≥ 20**
- 分组（每组标题双语，条目 = 标题 + 一句双语说明 + 外链 + 类型标签）：
  1. 官方入口（课程主页 / Teaching 页 / GitHub 仓库 / Springer / 中国大学 MOOC / 国家智慧教育平台 / 知乎知学堂）
  2. 视频课程（中文 B 站合集与单视频、英文 YouTube 播放列表、30 分钟总览）+ **十讲分集对照表**（讲 · 分集范围 · 中文入口 · 英文入口）
  3. 教材与勘误（Springer 页、中文版公告、Errata PDF、Discussions）
  4. 社区代码实现（10 个仓库，按 star 排序，带 star 数）
  5. 中文笔记与精读（5 条）
  6. 查漏补缺外部课程（Sutton & Barto、Silver、CS285、李宏毅、《动手学强化学习》、Easy-RL、Karpathy demo、PyTorch DQN）
  7. **合规提醒 callout**：课程禁止现成算法工具箱、算法须从零自写；"明显 LLM 生成的报告/代码最多扣到 0 分"——社区仓库只作思路参照
- 页脚：返回课堂 + 返回知识星图
- 同时给 `graph3d.html` 与 `lite.html` 的顶栏各加一个指向 `resources.html` 的链接（双语）

## 5. 主站入口与文档口径

- `assets/js/components.js` 首页 hero 按钮组（约 1260 行，`graph3d.html` / `lite.html` 两个按钮旁）加第三个：`resources.html`，文案「📚 资料索引 / Resources」
- `assets/js/root-template.js:184-185` 页脚 zh 行与 en 行各加一条 `resources.html` 链接
- `index.html` 三处 meta（`:7`、`:10`、`:18`）里的 `47 个 Vue 组件` → `48 个 Vue 组件`；并在 description 里补一段「· 官方资料索引」之类的说明（保持自然中文，不堆关键词）
- `README.md`：第 4 行的组件数 47→48；新增「第 8 轮」功能小节（每讲官方视频索引 + resources.html 资料索引页）与「已完成轮次」表补 **第七轮**（此前漏记）与**第八轮**两行
- `PLAN.md`：在文末追加「第八轮」施工记录（目标/改动面/门禁/验收结果留位）

## 6. 收尾验证波（由验证负责人统一执行，非本轮各作者）

1. `npm test`（模板 + 数据契约）与 `npm run lint` 全绿
2. 起静态服务：`cd "D:/rl course/rl-viz" && "D:/rl course/.venv/Scripts/python.exe" -m http.server 8642`（后台），然后 `node verify_site.js`
3. `verify_site.js` 新增 `[smoke-resources]` 断言块（≥5 条）：
   - `resources.html` 返回 200、`#res-stats` 含 `54`、`.res-card` 数 ≥ 20、截图 `shots/resources.png`
   - `index.html#sec-l2-why` 上 `.ovl-card[data-source="l2"]` 可见、`li.ovl-ep` 数 = 5、`.ovl-a-cn` 的 href 匹配 `BV1sd4y167NS/\?p=4`
   - 顺带抽查另一讲（如 `#sec-l7-td0`，`li.ovl-ep` 数 = 8）
   - 同步更新文件头注释里的断言条数
4. 回归确认：原有断言（尤其 notebook-bridge / derivation-lab / graph3d 88 与 10）仍全过，`shots/` 截图人工扫一眼
