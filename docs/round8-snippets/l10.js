
/* ===== L10 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 5 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 50–54，共 5 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l10'] = {
    min: 50,
    max: 54,
    episodes: [
      { n: 50, en: "Actor-Critic Methods (P1-The simplest Actor-Critic)", yt: "kjCZAT5Wh80" },
      { n: 51, en: "Actor-Critic Methods (P2-Advantage Actor-Critic)", yt: "vZVXJJcZNEM" },
      { n: 52, en: "Actor-Critic Methods (P3-Importance sampling & off-policy Actor-Critic)", yt: "TfO5mnsiGKc" },
      { n: 53, en: "Actor-Critic Methods (P4-Deterministic Actor-Critic)", yt: "dTjz1RNtic4" },
      { n: 54, en: "Actor-Critic Methods (P5-Summary and goodbye!)", yt: "npvnnKcXoBs" }
    ],
  };
  D.sections['l10-qac'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l10' } });
})();
