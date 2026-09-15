// 无头验证：整页截图 + 控制台错误收集（驱动本机 Edge）
// 断言计数：40 条基础冒烟 + 2 条 derivation-lab L2 冒烟（走步放行 + KaTeX 渲染）+ 2 条 L9 长链冒烟
//   + 1 条 DATA 全量挂载扫描（L2–L10 qa 节 derivation-lab / code 节 notebook-bridge）
//   + 2 条 notebook-bridge 冒烟（.nb-card 渲染 + 深链格式）+ 3 条 lite 冒烟（200 / 卡片数 / lab 可达）
//   + 7 条 resources 冒烟（resources 页 200 / #res-stats 含 54 / .res-card ≥ 20 + L2 官方视频卡 3 条 + L7 抽查 1 条）。
// 门控规则：derivation-lab 两处——window.DATA.derivationSets 注册表全空 → SKIP（内容未落，计通过）；
//   注册表非空而 #sec-l2-qa 无 .deriv-lab → FAIL（接线错，reviewer note N2）。
//   lite/lab/index.html 可达性——lite/ 未构建时 SKIP 并提示（PLAN 第七轮坑 7 模式）。
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--no-first-run', '--disable-extensions'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

  // 冒烟断言集中计数：ok(条件, 失败文案) —— 失败文案进 errors，计数进汇总行
  let assertTotal = 0, assertFail = 0;
  const ok = (cond, failMsg) => { assertTotal++; if (!cond) { assertFail++; errors.push(failMsg); } return cond; };

  // 0. 懒加载冒烟：冷启动首页不注入任何讲脚本；深链进入 L7 后注入 data-l7 而 data-l8 仍缺席
  try {
    await page.goto('http://localhost:8642/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const coldL7 = await page.$('script[src*="data-l7"]');
    const coldL2 = await page.$('script[src*="data-l2"]');
    const coldKatex = await page.$('script[src*="katex"]');
    ok(!coldL7, '[smoke-lazy] cold home already has script[src*="data-l7"]');
    ok(!coldL2, '[smoke-lazy] cold home already has script[src*="data-l2"]');
    ok(!coldKatex, '[smoke-lazy] cold home already has script[src*="katex"]');
    await page.goto('http://localhost:8642/#sec-l7-qlearning', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const hotL7 = await page.$('script[src*="data-l7"]');
    const hotL8 = await page.$('script[src*="data-l8"]');
    const hotKatex = await page.$('script[src*="katex"]');
    ok(hotL7, '[smoke-lazy] deep-link L7 missing script[src*="data-l7"]');
    ok(!hotL8, '[smoke-lazy] deep-link L7 unexpectedly loaded script[src*="data-l8"]');
    ok(hotKatex, '[smoke-lazy] deep-link L7 (has formula blocks) missing script[src*="katex"]');
    console.log('lazy-load assert: cold data-l7=' + (coldL7 ? 'PRESENT' : 'null')
      + ' cold data-l2=' + (coldL2 ? 'PRESENT' : 'null')
      + ' cold katex=' + (coldKatex ? 'PRESENT' : 'null')
      + ' | deep-link L7: data-l7=' + (hotL7 ? 'PRESENT' : 'null')
      + ' data-l8=' + (hotL8 ? 'PRESENT' : 'null')
      + ' katex=' + (hotKatex ? 'PRESENT' : 'null'));
  } catch (e) { errors.push('[smoke-lazy] ' + e.message); }

  // 0a. 深链冒烟：全新加载直接打开 #sec-l7-qlearning，应直达该节（L7 单讲视图）
  try {
    await page.goto('http://localhost:8642/#sec-l7-qlearning', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const chip = await page.textContent('.lecture-filter .lf-chip.active');
    const nSections = (await page.$$('.lesson-section')).length;
    const secTop = await page.$eval('#sec-l7-qlearning', el => el.getBoundingClientRect().top);
    ok(/L7/.test(chip || ''), '[smoke-deeplink] active chip = ' + chip);
    ok(nSections === 9, '[smoke-deeplink] L7 sections = ' + nSections + ' (expect 9)');
    ok(secTop != null && secTop <= 220, '[smoke-deeplink] section top = ' + secTop);
    await page.screenshot({ path: path.join(OUT, 'smoke-deeplink-l7.png') });

    // 0b. 后退冒烟：pn 底栏 goto 下一节后 goBack() 应回到 l7-qlearning
    await page.click('#sec-l7-qlearning .pn-btn.next');
    await page.waitForTimeout(900);
    await page.goBack();
    await page.waitForTimeout(900);
    const backHash = await page.evaluate(() => location.hash);
    const backTop = await page.$eval('#sec-l7-qlearning', el => el.getBoundingClientRect().top);
    ok(backHash === '#sec-l7-qlearning', '[smoke-back] hash after goBack = ' + backHash);
    ok(backTop != null && backTop <= 220, '[smoke-back] section top after goBack = ' + backTop);
    await page.screenshot({ path: path.join(OUT, 'smoke-back-nav.png') });
  } catch (e) { errors.push('[smoke-deeplink/back] ' + e.message); }

  await page.goto('http://localhost:8642/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  // 1. 首页整页
  await page.screenshot({ path: path.join(OUT, '01-home.png'), fullPage: true });

  // 2. 进入 lesson：点侧栏第一项（懒加载：等待 components-l1 注入完成）
  await page.click('text=网格世界');
  await page.waitForTimeout(1800);

  const secIds = await page.$$eval('.lesson-section', els => els.map(e => e.id));
  console.log('sections:', secIds.join(', '));

  // 每个小节截图（视口滚动到该节）
  const shotNames = ['02-grid-world', '03-state-action', '04-transition', '05-policy',
    '06-reward', '07-trajectory', '08-mdp', '09-summary', '10-reasoning', '11-code', '12-qa'];
  for (let i = 0; i < secIds.length && i < shotNames.length; i++) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView(), secIds[i]);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, shotNames[i] + '.png') });
  }

  // 3. 交互冒烟：transition lab 执行、trajectory 播放、code tab 切换
  try {
    await page.evaluate(() => document.getElementById('sec-transition').scrollIntoView());
    await page.waitForTimeout(400);
    await page.click('#sec-transition button.btn.primary');
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'smoke-transition-run.png') });
  } catch (e) { errors.push('[smoke-transition] ' + e.message); }

  try {
    await page.evaluate(() => document.getElementById('sec-trajectory').scrollIntoView());
    await page.waitForTimeout(400);
    await page.click('#sec-trajectory .play-ctl .btn.primary');
    await page.waitForTimeout(2300);
    await page.click('#sec-trajectory .play-ctl .btn:has-text("♾")');
    await page.waitForTimeout(3200);
    await page.screenshot({ path: path.join(OUT, 'smoke-trajectory-inf.png') });
  } catch (e) { errors.push('[smoke-trajectory] ' + e.message); }

  try {
    await page.evaluate(() => document.getElementById('sec-code').scrollIntoView());
    await page.waitForTimeout(400);
    await page.click('#sec-code .code-tab >> nth=3');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'smoke-code-tab.png') });
  } catch (e) { errors.push('[smoke-code] ' + e.message); }

  try {
    // 推理链连点三次
    await page.evaluate(() => document.getElementById('sec-reasoning').scrollIntoView());
    await page.waitForTimeout(400);
    for (let i = 0; i < 3; i++) { await page.click('#sec-reasoning .reason-ctl .btn.primary'); await page.waitForTimeout(350); }
    await page.click('#sec-reasoning .reason-ctl .btn:has-text("连贯全文")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'smoke-reasoning-essay.png') });
  } catch (e) { errors.push('[smoke-reasoning] ' + e.message); }

  // 3b. 键盘冒烟：纯 Tab 走查到 QA 卡，Enter 翻转
  try {
    await page.evaluate(() => document.getElementById('sec-qa').scrollIntoView());
    await page.waitForTimeout(400);
    let focusedCard = false;
    for (let i = 0; i < 150 && !focusedCard; i++) {
      await page.keyboard.press('Tab');
      focusedCard = await page.evaluate(() => {
        const el = document.activeElement;
        return !!(el && el.classList && el.classList.contains('qa-card'));
      });
    }
    ok(focusedCard, '[smoke-qa-keyboard] qa-card not reachable via Tab (150 tries)');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
    const flipped = await page.$eval('.qa-card', el => el.classList.contains('flipped'));
    ok(flipped, '[smoke-qa-keyboard] card not flipped after Enter');
    await page.screenshot({ path: path.join(OUT, 'smoke-qa-keyboard.png') });
  } catch (e) { errors.push('[smoke-qa-keyboard] ' + e.message); }

    // ── L2+：按课程筛选逐节截图 + 冒烟 ──
  const lectures = [
    { chip: 'L3', first: 'l3-improve',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l3-factors').scrollIntoView());
        await page.waitForTimeout(400);
        await page.click('#sec-l3-factors .btn:has-text("3.4a")');
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(OUT, 'smoke-l3-gamma.png') });
      },
      shots: ['32-l3-improve', '33-l3-contraction', '34-l3-solving', '35-l3-factors', '36-l3-detour', '37-l3-code', '38-l3-qa'],
      ids: ['sec-l3-improve','sec-l3-contraction','sec-l3-solving','sec-l3-factors','sec-l3-detour','sec-l3-code','sec-l3-qa'] },
    { chip: 'L4', first: 'l4-vi',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l4-vi').scrollIntoView());
        await page.waitForTimeout(300);
        await page.click('#sec-l4-vi .play-ctl .btn:has-text("一轮")');
        await page.waitForTimeout(300);
        await page.click('#sec-l4-vi .play-ctl .btn:has-text("一轮")');
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, 'smoke-l4-vi.png') });
      },
      shots: ['39-l4-vi', '40-l4-pi', '41-l4-truncated', '42-l4-code'],
      ids: ['sec-l4-vi','sec-l4-pi','sec-l4-truncated','sec-l4-code'] },
    { chip: 'L5', first: 'l5-mean',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l5-basic').scrollIntoView());
        await page.waitForTimeout(300);
        await page.click('#sec-l5-basic .play-ctl .btn:has-text("一轮")');
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(OUT, 'smoke-l5-mc.png') });
      },
      shots: ['43-l5-mean', '44-l5-basic', '45-l5-eps', '46-l5-code'],
      ids: ['sec-l5-mean','sec-l5-basic','sec-l5-eps','sec-l5-code'] },
    { chip: 'L6', first: 'l6-incremental',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l6-rm').scrollIntoView());
        await page.waitForTimeout(300);
        await page.click('#sec-l6-rm .play-ctl .btn:has-text("迭代")');
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(OUT, 'smoke-l6-rm.png') });
      },
      shots: ['47-l6-incremental', '48-l6-rm', '49-l6-sgd', '50-l6-code'],
      ids: ['sec-l6-incremental','sec-l6-rm','sec-l6-sgd','sec-l6-code'] },
    { chip: 'L7', first: 'l7-td0',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l7-qlearning').scrollIntoView());
        await page.waitForTimeout(400);
        await page.click('#sec-l7-qlearning .btn:has-text("训练")');
        await page.waitForTimeout(2500);
        await page.screenshot({ path: path.join(OUT, 'smoke-l7-qlearn.png') });
      },
      shots: ['51-l7-td0', '52-l7-sarsa', '53-l7-qlearning', '54-l7-unified', '55-l7-code'],
      ids: ['sec-l7-td0','sec-l7-sarsa','sec-l7-qlearning','sec-l7-unified','sec-l7-code'] },
        { chip: 'L8',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l8-td-fa').scrollIntoView());
        await page.waitForTimeout(400);
        await page.click('#sec-l8-td-fa .btn:has-text("SGD")');
        await page.waitForTimeout(1800);
        await page.screenshot({ path: path.join(OUT, 'smoke-l8-fit.png') });
      },
      shots: ['56-l8-representation', '57-l8-td-fa', '58-l8-dqn', '59-l8-code'],
      ids: ['sec-l8-representation','sec-l8-td-fa','sec-l8-dqn','sec-l8-code'] },
    { chip: 'L9',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l9-reinforce').scrollIntoView());
        await page.waitForTimeout(400);
        await page.click('#sec-l9-reinforce .btn:has-text("训练")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUT, 'smoke-l9-reinforce.png') });
      },
      shots: ['60-l9-representation', '61-l9-theorem', '62-l9-reinforce', '63-l9-code'],
      ids: ['sec-l9-representation','sec-l9-theorem','sec-l9-reinforce','sec-l9-code'] },
    { chip: 'L10',
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l10-summary').scrollIntoView());
        await page.waitForTimeout(400);
        await page.click('#sec-l10-summary .btn:has-text("训练")');
        await page.waitForTimeout(2500);
        await page.screenshot({ path: path.join(OUT, 'smoke-l10-a2c.png') });
      },
      shots: ['64-l10-qac', '65-l10-a2c', '66-l10-offpolicy', '67-l10-summary', '68-l10-code'],
      ids: ['sec-l10-qac','sec-l10-a2c','sec-l10-offpolicy','sec-l10-summary','sec-l10-code'] },
    { chip: 'L2',
      ids: ['sec-l2-why','sec-l2-bootstrap','sec-l2-state-value','sec-l2-bellman','sec-l2-examples','sec-l2-matrix','sec-l2-solving','sec-l2-action-value','sec-l2-summary','sec-l2-reasoning','sec-l2-code','sec-l2-qa'],
      shots: ['20-l2-why','21-l2-bootstrap','22-l2-state-value','23-l2-bellman','24-l2-examples','25-l2-matrix','26-l2-solving','27-l2-action-value','28-l2-summary','29-l2-reasoning','30-l2-code','31-l2-qa'],
      smoke: async () => {
        await page.evaluate(() => document.getElementById('sec-l2-solving').scrollIntoView());
        await page.waitForTimeout(300);
        await page.click('#sec-l2-solving .play-ctl .btn:has-text("一轮")');
        await page.waitForTimeout(250);
        await page.click('#sec-l2-solving .play-ctl .btn:has-text("一轮")');
        await page.waitForTimeout(250);
        await page.click('#sec-l2-solving .play-ctl .btn:has-text("一轮")');
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, 'smoke-l2-iter.png') });
      } },
  ];
  for (const lec of lectures) {
    await page.click('.lecture-filter .lf-chip:has-text("' + lec.chip + '")');
    await page.waitForTimeout(1400);   // chip 切讲 = 懒加载注入 data+components，等待加长
    await lec.smoke();
    const ids = lec.ids;
    for (let i = 0; i < ids.length && i < lec.shots.length; i++) {
      await page.evaluate((id) => document.getElementById(id).scrollIntoView(), ids[i]);
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT, lec.shots[i] + '.png') });
    }
  }

  // ── KaTeX 公式冒烟：L4 收敛链抽查 + L2 矩阵节 .katex/.katex-mathml/.mtable 断言 + chalk/quant 双主题截图 ──
  try {
    // L4 抽查（先切 L4：讲筛选视图里只有该讲的小节）
    await page.click('.lecture-filter .lf-chip:has-text("L4")');
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.getElementById('sec-l4-vi').scrollIntoView());
    await page.waitForTimeout(700);
    const l4Katex = await page.$$eval('#sec-l4-vi .katex', els => els.length);
    ok(l4Katex >= 1, '[smoke-katex] sec-l4-vi .katex count = ' + l4Katex);
    await page.screenshot({ path: path.join(OUT, 'smoke-katex-l4-vi-chalk.png') });

    // L2 矩阵节（重点验收：pmatrix 竖排 + 分式上下结构）
    await page.click('.lecture-filter .lf-chip:has-text("L2")');
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.getElementById('sec-l2-matrix').scrollIntoView());
    await page.waitForTimeout(900);
    const katexCount = await page.$$eval('#sec-l2-matrix .katex', els => els.length);
    const mathml = await page.$('#sec-l2-matrix .katex-mathml');
    const mtable = await page.$$('#sec-l2-matrix .mtable');
    const l2Frac = await page.$$eval('.lesson-section .mfrac', els => els.length);
    const parseErr = await page.$eval('#sec-l2-matrix', el => el.textContent.includes('KaTeX parse error'));
    ok(katexCount >= 1, '[smoke-katex] sec-l2-matrix .katex count = ' + katexCount);
    ok(mathml, '[smoke-katex] sec-l2-matrix missing .katex-mathml (accessibility layer)');
    ok(mtable.length >= 1, '[smoke-katex] sec-l2-matrix missing .mtable (pmatrix not vertical)');
    ok(l2Frac >= 1, '[smoke-katex] L2 view missing .mfrac (fraction not stacked)');
    ok(!parseErr, '[smoke-katex] KaTeX parse error text visible in sec-l2-matrix');
    await page.screenshot({ path: path.join(OUT, 'smoke-katex-l2-matrix-chalk.png') });
    // 3×3 pmatrix 卡片特写（矩阵竖排证据）
    const pmatrixCard = page.locator('#sec-l2-matrix .formula-card:has(.mtable)').first();
    await pmatrixCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await pmatrixCard.screenshot({ path: path.join(OUT, 'smoke-katex-l2-pmatrix-chalk.png') });
    console.log('katex assert: L2 matrix .katex=' + katexCount
      + ' mathml=' + (mathml ? 'PRESENT' : 'null')
      + ' mtable=' + mtable.length + ' L2 .mfrac=' + l2Frac
      + ' | L4 vi .katex=' + l4Katex);

    // quant 深空主题同节截图（KaTeX 继承 currentColor 应自然适配）
    await page.click('.theme-switch .theme-btn >> nth=2');
    await page.waitForTimeout(700);
    await page.evaluate(() => document.getElementById('sec-l2-matrix').scrollIntoView());
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'smoke-katex-l2-matrix-quant.png') });
    const pmatrixCardQ = page.locator('#sec-l2-matrix .formula-card:has(.mtable)').first();
    await pmatrixCardQ.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await pmatrixCardQ.screenshot({ path: path.join(OUT, 'smoke-katex-l2-pmatrix-quant.png') });
    await page.click('.theme-switch .theme-btn >> nth=0');   // 切回 chalk 默认
    await page.waitForTimeout(400);
  } catch (e) { errors.push('[smoke-katex] ' + e.message); }

  // ── 深色主题（quant 深空）冒烟：l8/l9/l10 图表与棋盘无白底块 ──
  try {
    await page.click('.theme-switch .theme-btn >> nth=2');   // 第 3 个圆点 = quant
    await page.waitForTimeout(600);
    const darks = [
      { chip: 'L8',  id: 'sec-l8-td-fa',      shot: 'smoke-dark-l8' },
      { chip: 'L9',  id: 'sec-l9-reinforce',  shot: 'smoke-dark-l9' },
      { chip: 'L10', id: 'sec-l10-summary',    shot: 'smoke-dark-l10' },
    ];
    for (const d of darks) {
      await page.click('.lecture-filter .lf-chip:has-text("' + d.chip + '")');
      await page.waitForTimeout(400);
      const whites = await page.$$eval('#' + d.id + ' .lab svg', els =>
        els.filter(el => getComputedStyle(el).backgroundColor === 'rgb(255, 255, 255)').length);
      ok(!whites, '[smoke-dark ' + d.chip + '] ' + whites + ' chart svg still white');
      const labLoc = page.locator('#' + d.id + ' .lab').first();
      await labLoc.scrollIntoViewIfNeeded();
      await labLoc.screenshot({ path: path.join(OUT, d.shot + '.png') });
    }
    await page.click('.theme-switch .theme-btn >> nth=0');   // 切回 chalk 默认
  } catch (e) { errors.push('[smoke-dark] ' + e.message); }

  // ── graph3d 知识星图冒烟：stats 口径、搜索选中、深链 href、WebGL 画布/降级 ──
  try {
    await page.goto('http://localhost:8642/graph3d.html');
    await page.waitForSelector('#g3d-stats', { timeout: 15000 });
    const statsTxt = (await page.textContent('#g3d-stats')) || '';
    ok(statsTxt.includes('88'), '[graph3d] stats lists 88 sections');
    ok(statsTxt.includes('10'), '[graph3d] stats lists 10 lectures');
    await page.fill('#g3d-search', 'Bellman');
    await page.waitForSelector('.g3d-result', { timeout: 5000 });
    await page.click('.g3d-result');
    ok(await page.isVisible('#g3d-info .g3d-title'), '[graph3d] info panel opens on select');
    const goHref = await page.getAttribute('#g3d-info .g3d-go', 'href');
    ok(/index\.html#sec-/.test(goHref || ''), '[graph3d] deep-link href = ' + goHref);
    ok((await page.$('#g3d-canvas canvas')) || (await page.isVisible('#g3d-fallback')), '[graph3d] webgl canvas or fallback');
    await page.screenshot({ path: path.join(OUT, 'graph3d.png') });
    console.log('graph3d assert: stats=' + statsTxt.replace(/\s+/g, ' ').trim().slice(0, 60)
      + ' goHref=' + goHref
      + ' canvas=' + (!!(await page.$('#g3d-canvas canvas'))));
  } catch (e) { errors.push('[graph3d] ' + e.message); }

  // ── fill-lab 知识填空冒烟：深链 L7 qa 节 → .fill-lab 渲染 → 点槽出选项 → 选项 → 检查出讲解 → localStorage → 元素级截图 ──
  try {
    await page.goto('http://localhost:8642/#sec-l7-qa', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);   // 冷深链 = 懒加载注入 data-l7，等 fillSets 注入后 fill-lab 渲染
    await page.evaluate(() => {
      const el = document.getElementById('sec-l7-qa');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
    const fillLab = page.locator('#sec-l7-qa .fill-lab');
    const labCount = await fillLab.count();
    ok(labCount === 1, '[smoke-fill] #sec-l7-qa .fill-lab count = ' + labCount + ' (expect 1)');
    ok(labCount === 1 && await fillLab.isVisible(), '[smoke-fill] #sec-l7-qa .fill-lab not visible');
    const nItems = await page.locator('#sec-l7-qa .fill-item').count();
    ok(nItems >= 5, '[smoke-fill] #sec-l7-qa .fill-item count = ' + nItems + ' (expect >= 5)');

    // 第一条（choice 单空题）：点槽 → 选项浮层 → 选首项（即正确答案）→ 检查 → 判分 + 讲解展开
    const item1 = page.locator('#sec-l7-qa .fill-item').first();
    await item1.locator('.fill-slot').first().click();
    await page.waitForTimeout(300);
    ok(await item1.locator('.fill-opts').isVisible(), '[smoke-fill] .fill-opts not shown after slot click');
    const nOpts = await item1.locator('.fill-opt').count();
    ok(nOpts >= 2, '[smoke-fill] .fill-opt count = ' + nOpts + ' (expect >= 2)');
    await item1.locator('.fill-opt').first().click();
    await page.waitForTimeout(250);
    const checkBtn = item1.locator('.fill-item-foot button.btn');
    ok(await checkBtn.isEnabled(), '[smoke-fill] check button still disabled with the only blank filled');
    await checkBtn.click();
    await page.waitForTimeout(450);
    ok(await item1.locator('.fill-why').isVisible(), '[smoke-fill] .fill-why not visible after check');
    // 双语模式下同一空在 zh/en 两行各渲染一个槽（共享作答状态），故 .right 槽数 = 语言行数 >= 1
    ok(await item1.locator('.fill-slot.right').count() >= 1, '[smoke-fill] slot lacks .right mark after correct check');
    const stored = await page.evaluate(() => localStorage.getItem('rl-viz-fill-l7'));
    ok(!!stored && stored.indexOf('"checked":true') >= 0,
      '[smoke-fill] localStorage rl-viz-fill-l7 = ' + String(stored || 'null').slice(0, 90));
    await fillLab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await fillLab.screenshot({ path: path.join(OUT, 'smoke-fill-lab.png') });   // 元素级证据图（勿用视口截图）
    console.log('fill-lab assert: items=' + nItems + ' opts=' + nOpts
      + ' stored=' + (stored ? 'PRESENT' : 'null'));
  } catch (e) { errors.push('[smoke-fill] ' + e.message); }

  // ── derivation-lab 推导冒烟（门控：derivationSets 注册表全空 → SKIP 计通过；非空而组件缺席 → FAIL）──
  // 深链 #sec-l2-qa → .deriv-lab 渲染 → 走到首个 blank 步 → 点错一次验证不放行 →
  // 答对放行 → 进度推进；KaTeX 经 ensureKatex 渲染 + .deriv-lab 元素级截图。
  try {
    await page.goto('http://localhost:8642/#sec-l2-qa', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);   // 冷深链 = 懒加载注入 data-l2
    await page.evaluate(() => {
      const el = document.getElementById('sec-l2-qa');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
    const derivLab = page.locator('#sec-l2-qa .deriv-lab');
    const nDeriv = await derivLab.count();
    // 注册表有真实条目的讲数：0 = 全书内容未落（SKIP）；>0 = 接线必须成立（硬断言）
    const derivRegistry = await page.evaluate(() => {
      const d = window.DATA && window.DATA.derivationSets;
      if (!d) return 0;
      return Object.keys(d).filter((k) => d[k] && Array.isArray(d[k].items) && d[k].items.length).length;
    });
    if (derivRegistry === 0) {
      assertTotal += 2;   // SKIP：全书 derivationSets 均未落（内容未到位），两条计通过不失败
      console.log('derivation-lab assert: SKIP — window.DATA.derivationSets empty (content not landed yet)');
    } else if (nDeriv < 1) {
      ok(false, '[smoke-deriv] derivationSets registry has ' + derivRegistry
        + ' lecture(s) but #sec-l2-qa has no .deriv-lab — wiring broken (reviewer note N2)');
      ok(false, '[smoke-deriv] KaTeX assert not run — .deriv-lab missing in #sec-l2-qa');
    } else {
      // 从页面数据取首条的步数与首个 blank 的位置/答案（通用适配 Wave 2 真数据）
      const plan = await page.evaluate(() => {
        const set = window.DATA.derivationSets && window.DATA.derivationSets.l2;
        const steps = set && set.items && set.items[0] && set.items[0].steps;
        if (!Array.isArray(steps)) return null;
        const bi = steps.findIndex((s) => s && s.blank);
        return { n: steps.length, blankAt: bi, answer: bi >= 0 ? steps[bi].blank.answer : -1 };
      });
      const nextBtn = page.locator('#sec-l2-qa .deriv-lab .reason-ctl .btn.primary');
      let walkOK = false, walkInfo = 'plan unreadable';
      if (plan && plan.blankAt >= 0) {
        for (let k = 0; k < plan.blankAt; k++) {   // 走到 blank 步（shown = blankAt+1）
          await nextBtn.click();
          await page.waitForTimeout(250);
        }
        const opts = page.locator('#sec-l2-qa .deriv-lab .deriv-step.now .fill-opts .deriv-opt');
        const nOpts = await opts.count();
        const wrongIdx = plan.answer === 0 ? 1 : 0;   // 先点一个必错选项验证门不放行
        await opts.nth(wrongIdx).click();
        await page.waitForTimeout(250);
        const gateHeld = !(await nextBtn.isEnabled());
        await opts.nth(plan.answer).click();
        await page.waitForTimeout(250);
        const released = await nextBtn.isEnabled();
        await nextBtn.click();
        await page.waitForTimeout(350);
        const prog = ((await page.textContent('#sec-l2-qa .deriv-lab .reason-progress')) || '').trim();
        walkOK = nOpts >= 2 && gateHeld && released && prog === (plan.blankAt + 2) + ' / ' + plan.n;
        walkInfo = 'steps=' + plan.n + ' blankAt=' + (plan.blankAt + 1) + '/' + plan.n
          + ' answer=' + plan.answer + ' opts=' + nOpts + ' gateHeld=' + gateHeld
          + ' released=' + released + ' progress="' + prog + '"';
      } else if (plan) {
        // 首条无 blank（数据形态变化时的降级路径）：直接走 3 步验证走步模式
        for (let k = 0; k < 3; k++) { await nextBtn.click(); await page.waitForTimeout(250); }
        const prog = ((await page.textContent('#sec-l2-qa .deriv-lab .reason-progress')) || '').trim();
        walkOK = prog === '4 / ' + plan.n;
        walkInfo = 'no blank in item#0 — walk-only progress="' + prog + '"';
      }
      ok(walkOK, '[smoke-deriv] walk 3 steps + answer 1 blank (gate → release → advance) failed: ' + walkInfo);
      console.log('derivation-lab assert: ' + walkInfo);
      // KaTeX 经组件内 ensureKatex 路径渲染（区别于公式块）+ 元素级截图
      const kx = await page.$$eval('#sec-l2-qa .deriv-lab .katex', els => els.length);
      ok(kx >= 1, '[smoke-deriv] .deriv-lab .katex count = ' + kx + ' (KaTeX not rendered via ensureKatex)');
      await derivLab.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await derivLab.screenshot({ path: path.join(OUT, 'smoke-deriv-lab.png') });
    }
  } catch (e) { errors.push('[smoke-deriv] ' + e.message); }

  // ── 五主题抽查：同一 L2 推导组件在 chalk/swiss/quant/forest/classic 下各截一张元素图 ──
  try {
    const derivL2 = page.locator('#sec-l2-qa .deriv-lab').first();
    if (await derivL2.count()) {
      for (let ti = 0; ti < 5; ti++) {
        await page.click('.theme-switch .theme-btn >> nth=' + ti);
        await page.waitForTimeout(600);
        await derivL2.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await derivL2.screenshot({ path: path.join(OUT, 'smoke-deriv-l2-theme-' + ti + '.png') });
      }
      await page.click('.theme-switch .theme-btn >> nth=0');   // 切回 chalk 默认
      await page.waitForTimeout(400);
      console.log('deriv themes: 5 element shots saved (smoke-deriv-l2-theme-0..4.png)');
    }
  } catch (e) { errors.push('[smoke-deriv-themes] ' + e.message); }

  // ── derivation-lab L9 长链冒烟：深链 #sec-l9-qa → 组件存在 + KaTeX 渲染 + 走 2 步（不断言通过）+ 元素截图 ──
  try {
    await page.goto('http://localhost:8642/#sec-l9-qa', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);   // 冷深链 = 懒加载注入 data-l9
    await page.evaluate(() => {
      const el = document.getElementById('sec-l9-qa');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
    const derivL9 = page.locator('#sec-l9-qa .deriv-lab');
    const nL9 = await derivL9.count();
    ok(nL9 >= 1, '[smoke-deriv-l9] #sec-l9-qa .deriv-lab count = ' + nL9 + ' (expect >= 1)');
    if (nL9 >= 1) {
      const kxL9 = await page.$$eval('#sec-l9-qa .deriv-lab .deriv-tex .katex', els => els.length);
      ok(kxL9 >= 1, '[smoke-deriv-l9] .deriv-tex .katex count = ' + kxL9 + ' (KaTeX not rendered via ensureKatex)');
      const nextL9 = page.locator('#sec-l9-qa .deriv-lab .reason-ctl .btn.primary');
      for (let k = 0; k < 2; k++) {   // 走 2 步冒烟（步进门放行与否不在此断言，只验证按钮链路不炸）
        await nextL9.click();
        await page.waitForTimeout(300);
      }
      const progL9 = ((await page.textContent('#sec-l9-qa .deriv-lab .reason-progress')) || '').trim();
      await derivL9.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await derivL9.screenshot({ path: path.join(OUT, 'smoke-deriv-lab-l9.png') });
      console.log('deriv-l9 assert: labs=' + nL9 + ' katex=' + kxL9 + ' progress="' + progL9 + '"');
    }
  } catch (e) { errors.push('[smoke-deriv-l9] ' + e.message); }

  // ── DATA 全量挂载扫描：L2–L10 每讲 qa 节 blocks 含 derivation-lab、code 节 blocks 含 notebook-bridge ──
  // 懒加载站点不会一次注入全部 data-lX，这里按懒加载同款方式逐个注入脚本后读 window.DATA.sections，
  // 一次断言列出全部缺失项（缺失即 fail——接线/内容缺一不可）。
  try {
    for (let n = 2; n <= 10; n++) {
      await page.addScriptTag({ url: 'http://localhost:8642/assets/js/data-l' + n + '.js' });
    }
    await page.waitForTimeout(300);
    const missing = await page.evaluate(() => {
      const S = window.DATA.sections;
      const has = (id, comp) => {
        const sec = S[id];
        return !!(sec && Array.isArray(sec.blocks)
          && sec.blocks.some((b) => b && b.t === 'widget' && b.component === comp));
      };
      const out = [];
      for (let n = 2; n <= 10; n++) {
        if (!has('l' + n + '-qa', 'derivation-lab')) out.push('l' + n + '-qa:derivation-lab');
        if (!has('l' + n + '-code', 'notebook-bridge')) out.push('l' + n + '-code:notebook-bridge');
      }
      return out;
    });
    ok(!missing.length, '[smoke-deriv-data] L2-L10 mounting gaps: '
      + (missing.length ? missing.join(', ') : 'none'));
    console.log('deriv-data assert: ' + (missing.length
      ? 'MISSING — ' + missing.join(', ')
      : 'all L2-L10 qa sections mount derivation-lab and code sections mount notebook-bridge'));
  } catch (e) { errors.push('[smoke-deriv-data] ' + e.message); }

  // ── notebook-bridge 冒烟：#sec-l2-code 出现 .nb-card 且深链以 lite/lab/index.html?path=notebooks/ 开头 ──
  try {
    await page.goto('http://localhost:8642/#sec-l2-code', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);   // 冷深链 = 懒加载注入 data-l2
    await page.evaluate(() => {
      const el = document.getElementById('sec-l2-code');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
    const nbCards = await page.locator('#sec-l2-code .nb-card').count();
    ok(nbCards >= 1, '[smoke-nb-bridge] #sec-l2-code .nb-card count = ' + nbCards + ' (expect >= 1)');
    const nbHref = await page.getAttribute('#sec-l2-code .nb-card .nb-actions a', 'href');
    ok(/^lite\/lab\/index\.html\?path=notebooks\//.test(nbHref || ''),
      '[smoke-nb-bridge] nb deep-link href = ' + nbHref + ' (expect lite/lab/index.html?path=notebooks/...)');
    const nbBridge = page.locator('#sec-l2-code .nb-bridge').first();
    if (await nbBridge.count()) {
      await nbBridge.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await nbBridge.screenshot({ path: path.join(OUT, 'smoke-nb-bridge.png') });
    }
    console.log('nb-bridge assert: cards=' + nbCards + ' href=' + nbHref);
  } catch (e) { errors.push('[smoke-nb-bridge] ' + e.message); }

  // ── lite.html hub 冒烟：200 + NB 卡片数 ≥7（NB_MANIFEST 渲染）+ lite/lab/index.html 可达性 ──
  try {
    const errMark = errors.length;   // lite 页窗口起点：probeFiles 的预期 404 稍后从这里剔除
    const liteResp = await page.goto('http://localhost:8642/lite.html', { waitUntil: 'networkidle' });
    ok(!!liteResp && liteResp.status() === 200, '[smoke-lite] lite.html status = '
      + (liteResp ? liteResp.status() : 'no-response'));
    await page.waitForTimeout(700);   // 卡片在 DOMContentLoaded 后由 nb-manifest 渲染
    const liteCards = await page.locator('.nbl-card').count();
    ok(liteCards >= 7, '[smoke-lite] lite.html .nbl-card count = ' + liteCards + ' (expect >= 7 from NB_MANIFEST)');
    await page.screenshot({ path: path.join(OUT, 'lite-hub.png'), fullPage: true });
    console.log('lite assert: status=' + (liteResp && liteResp.status()) + ' cards=' + liteCards);
    if (fs.existsSync(path.join(__dirname, 'lite', 'lab', 'index.html'))) {
      const labResp = await page.request.get('http://localhost:8642/lite/lab/index.html');
      ok(labResp.status() === 200, '[smoke-lite] lite/lab/index.html status = ' + labResp.status());
      console.log('lite assert: lite/lab/index.html status=' + labResp.status());
    } else {
      console.log('lite assert: SKIP lite/lab/index.html reachability — lite/ not built '
        + '(local release step; PLAN 第七轮坑 7 模式)');
    }
    // hub 页 probeFiles 按设计对尚未构建的笔记本（nb1–nb6 未 rebuild lite 前）发 HEAD 探测，
    // 404 → 卡片自动转"建设中"；Chromium 会为每个 404 资源记一条 console error——
    // 这是页面的设计行为而非站点缺陷，仅剔除本窗口内这批资源 404（其他错误照常计入）
    for (let i = errors.length - 1; i >= errMark; i--) {
      if (/^\[console\] Failed to load resource: the server responded with a status of 404/.test(errors[i])) {
        errors.splice(i, 1);
      }
    }
  } catch (e) { errors.push('[smoke-lite] ' + e.message); }

  // ── resources 冒烟：资料页 200 + 54 集统计口径 + 卡片规模 + 十讲官方视频索引卡（L2 全量 3 条 + L7 抽查 1 条）──
  try {
    const resResp = await page.goto('http://localhost:8642/resources.html', { waitUntil: 'networkidle' });
    ok(!!resResp && resResp.status() === 200, '[smoke-resources] resources.html status = '
      + (resResp ? resResp.status() : 'no-response'));
    await page.waitForTimeout(500);
    const resStats = (await page.textContent('#res-stats')) || '';
    ok(resStats.includes('54'), '[smoke-resources] #res-stats = "' + resStats.trim().slice(0, 80)
      + '" (expect contains 54)');
    const resCards = await page.locator('.res-card').count();
    ok(resCards >= 20, '[smoke-resources] .res-card count = ' + resCards + ' (expect >= 20)');
    await page.screenshot({ path: path.join(OUT, 'resources.png'), fullPage: true });

    // 主站官方视频索引卡：L2（P4–P8，5 集）挂 #sec-l2-why
    await page.goto('http://localhost:8642/#sec-l2-why', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);   // 冷深链 = 懒加载注入 data-l2 + components-l2
    await page.evaluate(() => {
      const el = document.getElementById('sec-l2-why');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
    ok(await page.isVisible('#sec-l2-why .ovl-card[data-source="l2"]'),
      '[smoke-resources] #sec-l2-why .ovl-card[data-source="l2"] not visible');
    const l2Eps = await page.locator('#sec-l2-why .ovl-list li.ovl-ep').count();
    ok(l2Eps === 5, '[smoke-resources] #sec-l2-why li.ovl-ep count = ' + l2Eps + ' (expect 5, P4-P8)');
    const cnHrefs = await page.$$eval('#sec-l2-why .ovl-list li.ovl-ep .ovl-a-cn',
      els => els.map(e => e.getAttribute('href')));
    ok(/BV1sd4y167NS\/\?p=4/.test(cnHrefs[0] || ''),
      '[smoke-resources] first .ovl-a-cn href = ' + cnHrefs[0] + ' (expect BV1sd4y167NS/?p=4)');

    // 抽查另一讲：L7（P29–P36，8 集）挂 #sec-l7-td0
    await page.goto('http://localhost:8642/#sec-l7-td0', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);   // 冷深链 = 懒加载注入 data-l7
    await page.evaluate(() => {
      const el = document.getElementById('sec-l7-td0');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(400);
    const l7Eps = await page.locator('#sec-l7-td0 .ovl-list li.ovl-ep').count();
    ok(l7Eps === 8, '[smoke-resources] #sec-l7-td0 li.ovl-ep count = ' + l7Eps + ' (expect 8, P29-P36)');
    console.log('resources assert: status=' + (resResp && resResp.status())
      + ' stats54=' + resStats.includes('54') + ' cards=' + resCards
      + ' l2Eps=' + l2Eps + ' l2CnHref=' + cnHrefs[0] + ' l7Eps=' + l7Eps);
  } catch (e) { errors.push('[smoke-resources] ' + e.message); }

  // ── file:// 双击可用冒烟：KaTeX 相对路径 css/字体在 file 协议下可加载、公式可渲染 ──
  try {
    const fileUrl = 'file:///' + encodeURI(__dirname.replace(/\\/g, '/')) + '/index.html#sec-l2-matrix';
    const p2 = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    const errs2 = [];
    p2.on('console', (m) => { if (m.type() === 'error') errs2.push('[console] ' + m.text()); });
    p2.on('pageerror', (e) => errs2.push('[pageerror] ' + e.message));
    await p2.goto(fileUrl, { waitUntil: 'load' });
    await p2.waitForTimeout(2500);
    const fKatex = await p2.$$eval('#sec-l2-matrix .katex', els => els.length);
    const fMathml = await p2.$('#sec-l2-matrix .katex-mathml');
    const fTable = await p2.$('#sec-l2-matrix .mtable');
    ok(fKatex >= 1, '[smoke-file] file:// sec-l2-matrix .katex = ' + fKatex);
    ok(fMathml, '[smoke-file] file:// missing .katex-mathml');
    ok(fTable, '[smoke-file] file:// missing .mtable');
    ok(!errs2.length, '[smoke-file] console errors: ' + errs2.join(' | '));
    await p2.screenshot({ path: path.join(OUT, 'smoke-katex-file-url.png') });
    await p2.close();
    console.log('file:// assert: .katex=' + fKatex + ' mathml=' + (fMathml ? 'PRESENT' : 'null')
      + ' mtable=' + (fTable ? 'PRESENT' : 'null') + ' consoleErrors=' + errs2.length);
  } catch (e) { errors.push('[smoke-file] ' + e.message); }

  await browser.close();

  // 汇总：断言计数 + 退出码（CI/脚本可据此判定失败；打印条件与退出条件同走 errors，避免口径分叉）
  console.log(errors.length
    ? 'ERRORS:\n' + errors.join('\n')
    : 'NO CONSOLE ERRORS');
  console.log((assertTotal - assertFail) + '/' + assertTotal + ' smoke asserts passed');
  process.exitCode = errors.length ? 1 : 0;
})();
