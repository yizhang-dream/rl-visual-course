
/* ===== L3 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 4 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 9–12，共 4 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l3'] = {
    min: 9,
    max: 12,
    episodes: [
      { n: 9, en: "Bellman Optimality Equation (P1-Motivating example)", yt: "lXKY_Hyg4SQ" },
      { n: 10, en: "Bellman Optimality Equation (P2-Optimal policy)", yt: "BxyjdHhK8a8" },
      { n: 11, en: "Bellman Optimality Equation (P3-More on BOE)", yt: "FXftTCKotC8" },
      { n: 12, en: "Bellman Optimality Equation (P4-Interesting properties)", yt: "a--bck2ow9s" }
    ],
  };
  D.sections['l3-improve'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l3' } });
})();
