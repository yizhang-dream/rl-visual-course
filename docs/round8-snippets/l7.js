
/* ===== L7 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 8 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 29–36，共 8 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l7'] = {
    min: 29,
    max: 36,
    episodes: [
      { n: 29, en: "Temporal-Difference Learning (P1-Motivating example)", yt: "u1X-7XX3dtI" },
      { n: 30, en: "Temporal-Difference Learning (P2-TD algorithm: introduction)", yt: "XiCUsc7CCE0" },
      { n: 31, en: "Temporal-Difference Learning (P3-TD algorithm: convergence)", yt: "faWg8M91-Oo" },
      { n: 32, en: "Temporal-Difference Learning (P4-Sarsa)", yt: "jYwQufkBUPo" },
      { n: 33, en: "Temporal-Difference Learning (P5-Expected Sarsa & n-step Sarsa)", yt: "0kKzQbWZOlk" },
      { n: 34, en: "Temporal-Difference Learning (P6-Q-learning: introduction)", yt: "4BvYR2hm730" },
      { n: 35, en: "Temporal-Difference Learning (P7-Q-learning: pseudo code)", yt: "I0YhlOIFF4s" },
      { n: 36, en: "Temporal-Difference Learning (P8-Unified viewpoint and summary)", yt: "3t74lvk1GBM" }
    ],
  };
  D.sections['l7-td0'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l7' } });
})();
