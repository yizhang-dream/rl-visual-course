
/* ===== L1 官方视频索引 · official video index（第 8 轮新增）=====
   来源：官方仓库 Readme.md 的英文课程清单（与 B 站中文版同一编号，共 2 集）。
   中文 B 站单视频分 P：https://www.bilibili.com/video/BV1sd4y167NS/?p=<n>
   英文 YouTube：https://www.youtube.com/watch?v=<yt>&list=PLEhdbSEZZbDaFWPX4gehhwB9vJZJ1DNm8&index=<n>
   计数核对：本讲 2–3，共 2 集。 */
(function () {
  const D = window.DATA;
  D.videoSets = D.videoSets || {};
  D.videoSets['l1'] = {
    min: 2,
    max: 3,
    episodes: [
      { n: 2, en: "Basic Concepts (P1-State, action, policy, ...)", yt: "zJHtM5dN69g" },
      { n: 3, en: "Basic Concepts (P2-Reward,return, Markov decision process)", yt: "repVl3_GYCI" }
    ],
  };
  D.sections['grid-world'].blocks.push({ t: 'widget', component: 'official-videos', props: { source: 'l1' } });
})();
