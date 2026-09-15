# NOTICE · 分层授权声明

本仓库采用「代码 + 内容」**双许可分层**：站点代码与讲解内容各按其层取用授权，边界与复用规则以本文件为准（`README.md` 的「开源协议」一节是本文件的摘要）。

## 一、适用范围 Scope

仓库中**贡献者自创内容**按层适用双许可：

| 层 | 覆盖范围 | 授权 |
|---|---|---|
| 站点代码层 | 工程实现：`index.html` 等根模板与独立页、`assets/js`（组件 / 根模板 / 应用逻辑）、`assets/css`、`scripts/`、`check_templates.js` / `verify_site.js` 等构建与校验脚本 | [LICENSE](LICENSE)（Apache-2.0） |
| 讲解内容层 | 各 `data-lX.js` 中的中英讲解文字、题库（知识填空自测）、推导步骤（DerivationLab）、图表与可视化设计 | [LICENSE-CONTENT.md](LICENSE-CONTENT.md)（CC BY 4.0） |

两层边界以「工程实现 vs 讲给读者听的内容」划分：让页面跑起来的代码按 Apache-2.0，讲给人听的中英文字与教学设计按 CC BY 4.0。同一个 `data-lX.js` 文件里两层并存，复用时请按实际取用的部分对应许可。

## 二、原始材料与第三方材料 Original & Third-Party Materials

- 本站是《Mathematical Foundation of Reinforcement Learning》（Shiyu Zhao 著）课程的**教学衍生项目**。书中原文公式表述、定理陈述、章节结构，以及官方课件与官方视频（YouTube 播放列表 / B 站合集）的版权归**原书作者与课程方**所有。本站仅在讲解与评论的教学目的下引用与指向这些材料，**它们不因在本站出现或被本站收录而纳入本站的任何授权范围**。
- 本地化的第三方库（Vue、KaTeX、GSAP、3d-force-graph 等，位于 `assets/vendor/`）各自遵循其原发布协议，本仓库的授权不改变它们自身的条款。

## 三、复用提示 Reuse Notes

- **复用代码**：请依 Apache-2.0 保留 `LICENSE` 及其中的许可、版权与署名声明（NOTICE 声明随附）。
- **复用讲解内容**：请依 CC BY 4.0 署名并链接本站 <https://rl.离命塔.cn/> 与仓库地址 <https://github.com/yizhang-dream/rl-visual-course>。
- **引用原书内容**（公式表述、定理陈述、课件、官方视频等）：不在本站授权范围之内，请自行向版权方确认授权。
