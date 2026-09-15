# 贡献指南 · Contributing

感谢关注 RL 可视化课堂！动手前请先读完本页——大部分「为什么 CI 拦我」的答案都写在这里。

## 1. 项目哲学（改代码前先对齐）

- **纯静态，无构建步骤**：没有 bundler、没有框架 CLI，双击 `index.html` 即可运行。所有「生成物」以静态 js 入库（如 `assets/js/graph3d-data.js`），不引入任何构建环节。
- **零运行时 CDN**：Vue / KaTeX / 3d-force-graph 等依赖全部本地化在 `assets/vendor/`，`file://` 离线可用。新依赖照此办理：npm 装为 devDependency、把 dist 拷进 `assets/vendor/`，禁止在页面里引用任何外网 URL。
- **双语一等公民**：所有自有文案（讲义、题库、推导步骤、组件内文案）一律 `{zh, en}` 双语。
- **浏览器内可计算**：实验台全部在浏览器里现场算（Vue 3 组件 + rAF），无后端、无预计算结果文件。

## 2. 目录速查表

| 位置 | 内容 |
|---|---|
| `index.html` | SPA 外壳：根模板脚本标签 + `window.RLV_VERSION` 版本戳 |
| `assets/js/data.js` | 核心注册表 `window.DATA`（sections / navGroups / navClusters）+ L1 正文 |
| `assets/js/data-lX.js` | 第 X 讲内容：小节 blocks（全部双语）+ 推理链 + 代码精讲 + QA + 题库 |
| `assets/js/components.js` | GridBoard 网格引擎 + L1 实验台 + 共享助手 `window.RLV`（bi / stepOnce / hlPy 等） |
| `assets/js/components-lX.js` | 该讲交互实验台，注册进 `window.COMPONENTS` |
| `assets/js/root-template.js` | `window.ROOT_TEMPLATE` 根模板（app.js 以此为根组件模板，必须先于 app.js 加载） |
| `assets/js/loader.js` | 按讲懒加载器 `window.RLVLoader`：首次进入某讲才注入 `data-lX.js` + `components-lX.js`（file:// 可用），KaTeX 按需注入 |
| `assets/js/app.js` | 根应用：挂载、hash 路由、语言 / 主题状态 |
| `assets/js/graph3d-data.js` | 知识星图数据，**由 `scripts/build_graph3d.js` 生成的产物，不要手改** |
| `assets/js/concordance-data.js` | 术语索引（concordance）数据，**由 `scripts/build_concordance.js` 生成的产物，不要手改** |
| `graph3d.html` / `lite.html` / `resources.html` / `concordance.html` | 四个独立页：3D 知识星图 / JupyterLite 笔记本实验室 / 官方资料索引 / 术语全书反查 |
| `assets/vendor/` | 本地化第三方库（Vue / KaTeX / 3d-force-graph），压缩产物不要手改 |
| `scripts/` | 质量门禁与数据生成：`check_data.js`、`build_graph3d.js`、`build_concordance.js`、`check_vendor_versions.mjs`、`nb-baseline.json` |
| `check_templates.js` / `verify_site.js` | 仓库根目录的开发工具：模板编译校验 / 无头 Edge 整页冒烟 |

## 3. 改内容 / 加实验台

1. **改讲义内容**：改对应 `assets/js/data-lX.js` 里小节的 blocks（`t: 'p' | 'callout' | 'formula' | 'steps' | 'widget'`，每块双语）；qa 节挂填空题库 `D.fillSets['lX']` 与推导 `D.derivationSets['lX']`，契约见 `scripts/check_data.js` 头部注释。
2. **加实验台**：在 `assets/js/components-lX.js` 写组件并注册 `window.COMPONENTS`；必须 `setup(){ return { bi } }` 暴露双语助手；`computed:` 只写一个（重复键会静默覆盖）；优先复用 `window.RLV` 与 `GridBoard`。
3. **双语内联必须用 bi()**：模板里写 `v-html="bi(zh, en)"`——bi() 生成的 span 带 `.du-line` 类，双语对照模式下中英各占一行；手写 `<span>` 没有该类，两种文字会挤在一行。
4. **公式**：formula 块的 `tex` 用 `String.raw` 模板串写（免反斜杠转义），可用 `\htmlClass{fx-gold}{…}` 等钩子配合主题上色；CI 对全部 tex 做 KaTeX 严格渲染（throwOnError），写错即挂。
5. **模板属性里的英文撇号用 `’`**：直引号 `'` 会截断单引号表达式。
6. **填空题库**：`fillSets` 每题 stem 双语里的 `[[n]]` 空号必须从 1 连续、数量等于 `blanks.length`；choice 选项 3–4 个、number 型必须带 `tol > 0`——check_data.js 会逐条校验。
7. **计数断言同 PR 更新**：增删小节 / 组件 / 公式块时，同步改 `scripts/check_data.js` 顶部的 `EXPECT_SECTIONS = 88`、`EXPECT_COMPONENTS = 48`、`EXPECT_FORMULAS = 57`。
8. **改 data 后要不要重新生成**：**增删小节、改小节 id 或导航结构**时必须跑 `node scripts/build_graph3d.js`（再生成 `assets/js/graph3d-data.js` 入库提交）；同样场景**以及讲义正文文字改动影响术语命中时**跑 `npm run build:concordance`（再生成 `assets/js/concordance-data.js` 入库提交）。两份都是入库静态产物，手改无效。纯实验台 / 样式改动不用重生成。

## 4. 质量门禁（CI 会拦的，本地先过）

```bash
npm ci                        # 一次性装依赖
npm run lint                  # eslint：0 error 0 warning（eqeqeq / eol-last / 空行 ≤2 等规则）
node check_templates.js       # Vue 编译器编译全部模板 + 导航 / navClusters 交叉检查
node scripts/check_data.js    # 88 小节 / 48 组件 / 57 公式块 KaTeX 严格渲染 + 题库契约
npm run check:data            # 单跑数据校验（等价于上一条）
npm test                      # = check_templates + check_data 一起跑
python -m http.server 8642    # 先起本地服务（仓库根目录），然后：
node verify_site.js           # 无头 Edge 整页截图 + 79 条冒烟断言 + 零 console 错误
```

- `verify_site.js` 默认驱动本机 Edge，路径不同用 `EDGE_PATH` 环境变量覆盖（CI 里即 `EDGE_PATH=/usr/bin/microsoft-edge node verify_site.js`）。
- **notebook 基线**：`notebooks/` 正本保留学员练习 TODO（`assert None` 等占位），CI 以 `--allow_errors` 全量执行后与 `scripts/nb-baseline.json` 逐本比对**含 error output 的 code cell 数**，任一偏离即拦截。所以：改任何笔记本的练习 TODO 数量，必须在**同一个 PR** 里更新 `scripts/nb-baseline.json`。
- CI（push / PR 到 main 触发）跑三个 job：`check`（模板 + lint + 数据）、`smoke`（8642 服务 + verify_site）、`notebooks`（执行 + 基线），另每周定时执行 notebooks 防依赖漂移。`scripts/check_vendor_versions.mjs` 只打印 vendor 版本漂移，informational，不拦截。

## 5. 本地运行

双击 `index.html`（依赖全本地化，离线可用），或 `python -m http.server 8642` 后访问 <http://localhost:8642/>。
改 `notebooks/` 源笔记本后，离线子站 `lite/`（构建产物，不入库）需另行重建，方式见 `lite-build/build.md`。

## 6. 发版纪律（重要，有事故先例）

- 线上 nginx 对 `/assets/` 配了 **7 天强缓存**，浏览器只靠入口页里的版本参数穿透缓存。**任何 `assets/` 下文件（js / css / vendor）的改动，上线前必须 bump 全部五个入口页**——`index.html`、`graph3d.html`、`lite.html`、`resources.html`、`concordance.html`——里的 `window.RLV_VERSION` 与静态引用的 `?v=` 参数（值格式如 `20260916a` = 日期 + 当日序号；loader.js 动态注入的脚本同样读 RLV_VERSION）。漏 bump 的后果是用户拿旧文件：曾有白屏事故，不要成为第二例。
- 部署由维护者执行；贡献者 PR 合并即可，不需要也不应该自行部署。

## 7. 许可

本仓库双许可分层，**提交 PR 即表示同意按此发布**：

- 站点代码层（HTML / JS / CSS、`scripts/` 与校验脚本等工程实现）按 [LICENSE](LICENSE)（Apache-2.0）；
- 讲解内容层（`data-lX.js` 中的中英讲解、题库、推导步骤、图表与可视化设计）按 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)（CC BY 4.0）。
- 原书公式表述、定理陈述、官方课件与视频的版权归原书作者与课程方，不在本站授权范围之内；引用边界见 [NOTICE.md](NOTICE.md)。

## 8. PR 约定

- **小步、单主题**：一个 PR 只解决一件事；讲义内容改动与工程改动尽量分开提。
- 本地门禁全绿再提（第 4 节命令）；CI 绿后等维护者 review，合并与部署由维护者操作。
- 标题中英文均可；描述里写清改了哪几讲 / 哪些组件，涉及计数断言（第 3.6 条）或 notebook 基线（第 4 节）的请在描述里说明。
