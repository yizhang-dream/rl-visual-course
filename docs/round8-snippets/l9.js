
/* ===== L9 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 5 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 45–49，共 5 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l9'] = {
    min: 45,
    max: 49,
    episodes: [
      { n: 45, en: "Policy Gradient Methods (P1-Basic idea)", yt: "mtFHOj83QSo" },
      { n: 46, en: "Policy Gradient Methods (P2-Metric 1–Average value)", yt: "la8jQc3hX1M" },
      { n: 47, en: "Policy Gradient Methods (P3-Metric 2–Average reward)", yt: "8RZ_rQFe69E" },
      { n: 48, en: "Policy Gradient Methods (P4-Gradients of the metrics)", yt: "MvmtPXur3Ls" },
      { n: 49, en: "Policy Gradient Methods (P5-Gradient-based algorithms & REINFORCE)", yt: "1DQnnUC8ng8" }
    ],
  };
  D.sections['l9-representation'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l9' } });
})();
