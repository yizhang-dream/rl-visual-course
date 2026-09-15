
/* ===== L4 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 3 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 13–15，共 3 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l4'] = {
    min: 13,
    max: 15,
    episodes: [
      { n: 13, en: "Value Iteration and Policy Iteration (P1-Value iteration)", yt: "wMAVmLDIvQU" },
      { n: 14, en: "Value Iteration and Policy Iteration (P2-Policy iteration)", yt: "Pka6Om0nYQ8" },
      { n: 15, en: "Value Iteration and Policy Iteration (P3-Truncated policy iteration)", yt: "tUjPFPD3Vc8" }
    ],
  };
  D.sections['l4-vi'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l4' } });
})();
