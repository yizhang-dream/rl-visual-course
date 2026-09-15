
/* ===== L8 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 8 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 37–44，共 8 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l8'] = {
    min: 37,
    max: 44,
    episodes: [
      { n: 37, en: "Value Function Approximation (P1-Motivating example–curve fitting)", yt: "uJXcI8fcdWc" },
      { n: 38, en: "Value Function Approximation (P2-Objective function)", yt: "Z3HI1TfpJP0" },
      { n: 39, en: "Value Function Approximation (P3-Optimization algorithm)", yt: "piBDwrKt0uU" },
      { n: 40, en: "Value Function Approximation (P4-illustrative examples and analysis)", yt: "VFyBNEZxMMs" },
      { n: 41, en: "Value Function Approximation (P5-Sarsa and Q-learning)", yt: "C-HtY4-W_zw" },
      { n: 42, en: "Value Function Approximation (P6-DQN–basic idea)", yt: "lZCcbZbqVSQ" },
      { n: 43, en: "Value Function Approximation (P7-DQN–experience replay)", yt: "rynEdAdebi0" },
      { n: 44, en: "Value Function Approximation (P8-DQN–implementation and example)", yt: "vQHuCHjd6hA" }
    ],
  };
  D.sections['l8-representation'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l8' } });
})();
