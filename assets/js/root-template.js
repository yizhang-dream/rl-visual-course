/* ═══════════════════════════════════════════════════════════
   RL 可视化课堂 · 根应用模板
   原先内联在 index.html #app 里，现抽为本文件：file:// 下仍零构建可跑。
   加载顺序必须在 app.js 之前（app.js 以 window.ROOT_TEMPLATE 为根模板）。
   ═══════════════════════════════════════════════════════════ */
window.ROOT_TEMPLATE = `
  <!-- ═══════════ 顶部栏 ═══════════ -->
  <header class="topbar">
    <div class="topbar-inner">
      <button class="brand" @click="go('home')" aria-label="回到首页">
        <span class="brand-logo">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5.4" height="5.4" rx="1"/><rect x="15.6" y="3" width="5.4" height="5.4" rx="1"/><rect x="3" y="15.6" width="5.4" height="5.4" rx="1"/><rect x="15.6" y="15.6" width="5.4" height="5.4" rx="1" fill="currentColor" stroke="none"/><path d="M8.4 5.7h7.2M5.7 8.4v7.2M18.3 8.4v7.2M8.4 18.3h7.2"/></svg>
        </span>
        <span class="brand-text">
          <strong>RL 可视化课堂</strong>
          <em>Mathematical Foundation of RL · Visual Course</em>
        </span>
      </button>

      <div class="topbar-center">
        <div class="scroll-track"><div class="scroll-bar" :style="{width: scrollPct + '%'}"></div></div>
      </div>

      <div class="lang-switch" role="group" aria-label="语言 / Language">
        <button v-for="m in langModes" :key="m.key"
                :class="['lang-btn', {active: lang===m.key}]"
                @click="setLang(m.key)">{{ m.label }}</button>
      </div>

      <div class="theme-switch" role="group" aria-label="主题 / Theme">
        <button v-for="t in themes" :key="t.key"
                :class="['theme-btn', {active: theme===t.key}]"
                :title="t.label" :aria-label="t.label"
                @click="setTheme(t.key)">
          <span class="sw-dot" :style="{background: t.dot}"></span>
        </button>
      </div>
    </div>
  </header>

  <div class="shell">
    <!-- ═══════════ 侧边导航 ═══════════ -->
    <aside class="sidebar" :class="{open: sidebarOpen}">
      <div class="lecture-filter">
        <button class="lf-chip" :class="{active: lectureFilter===0}" @click="lectureFilter=0">全部</button>
        <button v-for="l in lectureChips" :key="l.no" class="lf-chip"
                :class="{active: lectureFilter===l.no, done: l.done}" @click="filterLecture(l.no)">
          L{{ l.no }}<i v-if="l.done">✓</i>
        </button>
      </div>
      <nav class="side-nav">
        <div class="nav-group" v-for="group in navGroups" :key="group.label">
          <button type="button" class="nav-group-label"
                  :class="{open: isLectureOpen(group.lecture), pinned: lectureFilter!==0}"
                  :aria-expanded="isLectureOpen(group.lecture) ? 'true' : 'false'"
                  @click="toggleLecture(group.lecture)">
            <span class="ngl-text">{{ group.label }}</span>
            <span class="ngl-chevron" aria-hidden="true">
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>
            </span>
          </button>
          <div class="nav-group-body" :class="{open: isLectureOpen(group.lecture)}">
            <div class="nav-group-inner">
              <div class="nav-cluster" :class="{flat: !cluster.zh}" v-for="cluster in clustersOf(group)" :key="cluster.zh || cluster.en || 'flat'">
                <div class="nav-cluster-label" v-if="cluster.zh">
                  <span class="zh">{{ cluster.zh }}</span>
                  <span class="en">{{ cluster.en }}</span>
                </div>
                <button v-for="item in cluster.items" :key="item.id"
                        class="nav-item"
                        :class="{active: section==='lesson' && activeId===item.id, done: visited.has(item.id)}"
                        @click="go(item.id)">
                  <span class="nav-dot"></span>
                  <span class="nav-text">
                    <span class="nav-zh">{{ item.zh }}</span>
                    <span class="nav-en">{{ item.en }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-group">
          <div class="nav-group-label plain">全部课程 · All Lectures</div>
          <div class="coming-list">
            <div class="coming-item" v-for="c in lectureChips" :key="c.no">
              <span class="coming-no">L{{ c.no }}</span>
              <span class="coming-title">
                <span class="nav-zh">{{ c.zh }}</span>
                <span class="nav-en">{{ c.en }}</span>
              </span>
              <span class="coming-badge" :class="{done: c.done}">{{ c.done ? '✓' : 'Soon' }}</span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
    <div class="sidebar-mask" v-if="sidebarOpen" @click="sidebarOpen=false"></div>

    <!-- ═══════════ 主内容 ═══════════ -->
    <main class="content" ref="content" @scroll="onScroll">

      <!-- 按讲懒加载占位：进入未加载讲时显示（深链冷启动 / 跨讲跳转 / 讲筛选） -->
      <div v-if="loadingLec" class="lazy-loading" role="status" aria-live="polite">
        <span class="ll-spinner" aria-hidden="true"></span>
        <span class="ll-text">
          <span class="zh">正在加载 L{{ loadingLec }} 讲内容…</span>
          <span class="en">Loading lecture L{{ loadingLec }}…</span>
        </span>
      </div>

      <template v-if="section==='home'">
        <home-hero @go="go"></home-hero>
        <lecture-index @go="go"></lecture-index>
        <course-map @go="go"></course-map>
        <how-to-use @go="go"></how-to-use>
      </template>

      <template v-else>
        <section v-for="sec in currentSections" :key="sec.id" :id="'sec-' + sec.id" class="lesson-section reveal">
          <header class="sec-head">
            <span class="sec-kicker">{{ sec.kicker }}</span>
            <h2 class="sec-title">
              <span class="zh">{{ sec.title.zh }}</span>
              <span class="en">{{ sec.title.en }}</span>
            </h2>
          </header>

          <template v-for="(blk, bi) in sec.blocks" :key="bi">
            <p v-if="blk.t==='p'" class="bi duo reveal-item" v-html="fmt(blk)"></p>
            <div v-else-if="blk.t==='formula'" class="formula-card reveal-item">
              <template v-if="blk.tex">
                <div class="fx-math" :data-tex="blk.tex"></div>
                <div v-if="blk.note" class="fx-note" v-html="blk.note"></div>
              </template>
              <div v-else v-html="blk.html"></div>
            </div>
            <div v-else-if="blk.t==='callout'" :class="['callout', 'reveal-item', blk.variant||'key']">
              <div class="callout-icon">{{ iconFor(blk.variant) }}</div>
              <div class="callout-body">
                <p class="bi duo" v-html="fmt(blk)"></p>
              </div>
            </div>
            <component v-else-if="blk.t==='widget'" :is="blk.component" class="reveal-item" v-bind="blk.props||{}"></component>
            <div v-else-if="blk.t==='steps'" class="mini-steps reveal-item">
              <div class="mini-step" v-for="(st,si) in blk.items" :key="si">
                <span class="mini-step-no">{{ si+1 }}</span>
                <div class="mini-step-body">
                  <p class="bi duo" v-html="fmt(st)"></p>
                </div>
              </div>
            </div>
          </template>

          <nav class="sec-pn" aria-label="上一节 / 下一节 · Previous / Next section">
            <button v-if="pnOf(sec.id).prev" type="button" class="pn-btn" @click="go(pnOf(sec.id).prev.id)">
              <span class="pn-arrow" aria-hidden="true">←</span>
              <span class="pn-text">
                <span class="pn-lab"><span class="zh">上一节</span><span class="en">Previous</span></span>
                <span class="pn-title zh">{{ pnOf(sec.id).prev.zh }}</span>
                <span class="pn-title en">{{ pnOf(sec.id).prev.en }}</span>
              </span>
            </button>
            <span v-else class="pn-spacer" aria-hidden="true"></span>
            <button v-if="pnOf(sec.id).next" type="button" class="pn-btn next" @click="go(pnOf(sec.id).next.id)">
              <span class="pn-text">
                <span class="pn-lab"><span class="zh">下一节</span><span class="en">Next</span></span>
                <span class="pn-title zh">{{ pnOf(sec.id).next.zh }}</span>
                <span class="pn-title en">{{ pnOf(sec.id).next.en }}</span>
              </span>
              <span class="pn-arrow" aria-hidden="true">→</span>
            </button>
            <span v-else class="pn-spacer" aria-hidden="true"></span>
          </nav>
        </section>
      </template>

      <footer class="footer">
        <p class="bi-footer">
          <span>基于 Shiyu Zhao《Mathematical Foundation of Reinforcement Learning》全书十讲与西湖大学 IUSLab 网格世界代码制作 · 仅用于学习</span>
          <span>Built on all ten chapters of "Mathematical Foundation of Reinforcement Learning" and the IUSLab grid-world code, Westlake University · For study only</span>
        </p>
        <p class="bi-footer" style="margin-top:5px">
          <span><a class="footer-link" href="graph3d.html">知识星图 · 3D 全书知识网络</a> · <a class="footer-link" href="lite.html">笔记本实验室 · 浏览器里跑 Jupyter</a></span>
          <span><a class="footer-link" href="graph3d.html">Knowledge Constellation</a> · <a class="footer-link" href="lite.html">Notebook Lab</a></span>
        </p>
      </footer>
    </main>
  </div>

  <!-- 移动端导航按钮 -->
  <button class="fab-nav" @click="sidebarOpen=!sidebarOpen" aria-label="目录">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
  </button>
`;
