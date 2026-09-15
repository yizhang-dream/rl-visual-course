
/* ===== L2 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 5 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 4–8，共 5 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l2'] = {
    min: 4,
    max: 8,
    episodes: [
      { n: 4, en: "Bellman Equation (P1-Motivating examples)", yt: "XCzWrlgZCwc" },
      { n: 5, en: "Bellman Equation (P2-State value)", yt: "DSvi3xEN13I" },
      { n: 6, en: "Bellman Equation (P3-Bellman equation-Derivation)", yt: "eNtId8yPWkA" },
      { n: 7, en: "Bellman Equation (P4-Matrix-vector form and solution)", yt: "EtCfBG_eP2w" },
      { n: 8, en: "Bellman Equation (P5-Action value)", yt: "zJo2sLDzfcU" }
    ],
  };
  D.sections['l2-why'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l2' } });
})();
