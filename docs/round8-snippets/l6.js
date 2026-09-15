
/* ===== L6 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 7 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 22–28，共 7 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l6'] = {
    min: 22,
    max: 28,
    episodes: [
      { n: 22, en: "Stochastic Approximation and SGD (P1-Motivating example)", yt: "1bMgejvWoAo" },
      { n: 23, en: "Stochastic Approximation and SGD (P2-RM algorithm: introduction)", yt: "1FTGcNUUnCE" },
      { n: 24, en: "Stochastic Approximation and SGD (P3-RM algorithm: convergence)", yt: "juNDoAFEre4" },
      { n: 25, en: "Stochastic Approximation and SGD (P4-SGD algorithm: introduction)", yt: "EZO7Iadp5m4" },
      { n: 26, en: "Stochastic Approximation and SGD (P5-SGD algorithm: examples)", yt: "BsxU_4qvvNA" },
      { n: 27, en: "Stochastic Approximation and SGD (P6-SGD algorithm: properties)", yt: "fWxX9YuEHjE" },
      { n: 28, en: "Stochastic Approximation and SGD (P7-SGD algorithm: comparison)", yt: "yNEV2cLKuzU" }
    ],
  };
  D.sections['l6-incremental'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l6' } });
})();
