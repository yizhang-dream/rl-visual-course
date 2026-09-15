
/* ===== L5 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 6 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 16–21，共 6 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l5'] = {
    min: 16,
    max: 21,
    episodes: [
      { n: 16, en: "Monte Carlo Learning (P1-Motivating examples)", yt: "DO1yXinAV_Q" },
      { n: 17, en: "Monte Carlo Learning (P2-MC Basic-introduction)", yt: "6ShisunU0zs" },
      { n: 18, en: "Monte Carlo Learning (P3-MC Basic-examples)", yt: "axA0yns9FxU" },
      { n: 19, en: "Monte Carlo Learning (P4-MC Exploring Starts)", yt: "Qt8OMHPkLqg" },
      { n: 20, en: "Monte Carlo Learning (P5-MC Epsilon-Greedy-introduction)", yt: "dM3fYE630pY" },
      { n: 21, en: "Monte Carlo Learning (P6-MC Epsilon-Greedy-examples)", yt: "x6X_5ePT9gQ" }
    ],
  };
  D.sections['l5-mean'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l5' } });
})();
