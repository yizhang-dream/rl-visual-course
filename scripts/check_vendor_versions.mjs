// Vendored 依赖版本漂移检查（informational）：对比 assets/vendor 内置版本与 npm latest。
// 只打印对照结果，永远退出 0 —— 网络抖动/解析失败仅告警，绝不拦截 CI。
// 版本提取点（均已 grep 验证全文唯一命中）：
//   katex.min.js          → webpack 模块表内字面量 version:"x.y.z"（仅 1 处）
//   3d-force-graph.min.js → 文件头注释 // Version x.y.z 3d-force-graph - ...（仅第 1 行）
import fs from 'node:fs';
import path from 'node:path';

const VENDORED = [
  {
    pkg: 'katex',
    file: path.join('assets', 'vendor', 'katex', 'katex.min.js'),
    re: /\bversion:"(\d+\.\d+\.\d+)"/,
  },
  {
    pkg: '3d-force-graph',
    file: path.join('assets', 'vendor', 'graph3d', '3d-force-graph.min.js'),
    re: /^\/\/ Version (\d+\.\d+\.\d+) 3d-force-graph/m,
  },
];

// 与根 package.json devDependencies 交叉参照（缺字段不报错）
let declared = {};
try {
  declared = JSON.parse(fs.readFileSync('package.json', 'utf8')).devDependencies || {};
} catch { /* informational：package.json 读不到只影响 declared 列 */ }

// vendored 落后 latest 至少一个 major 则为 true
const majorBehind = (vendored, latest) =>
  Number(String(vendored).split('.')[0]) < Number(String(latest).split('.')[0]);

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));

const fetchLatest = async (pkg) => {
  const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).version;
};

const main = async () => {
  console.log('Vendor version drift check (informational, never fails CI)');
  const rows = [];
  for (const dep of VENDORED) {
    let vendored = null;
    try {
      vendored = fs.readFileSync(dep.file, 'utf8').match(dep.re)?.[1] ?? null;
    } catch (e) {
      console.log(`WARN  cannot read ${dep.file}: ${e.message}`);
    }
    if (!vendored) {
      console.log(`WARN  cannot extract vendored version for ${dep.pkg} from ${dep.file}`);
      continue;
    }

    let latest = null;
    try {
      latest = await fetchLatest(dep.pkg);
    } catch (e) {
      console.log(`WARN  npm registry query failed for ${dep.pkg} (${e.message}); skipping comparison`);
    }
    rows.push({ pkg: dep.pkg, vendored, latest, declared: declared[dep.pkg] || '-' });
  }

  if (!rows.length) {
    console.log('WARN  no vendored version could be determined.');
    return;
  }
  console.log('');
  console.log(pad('package', 16) + pad('vendored', 10) + pad('latest', 10) + pad('declared', 12) + 'major-behind');
  for (const r of rows) {
    const behind = r.latest ? (majorBehind(r.vendored, r.latest) ? 'YES' : 'no') : 'n/a';
    console.log(pad(r.pkg, 16) + pad(r.vendored, 10) + pad(r.latest || 'unknown', 10) + pad(r.declared, 12) + behind);
  }
};

// 兜底：任何漏网异常只打日志，进程自然退出 0（不显式 process.exit，避免与在途句柄竞态）
process.on('unhandledRejection', (e) => console.log(`WARN  unhandled rejection: ${e?.message || e}`));
main()
  .catch((e) => console.log(`WARN  check aborted: ${e?.message || e}`))
  .finally(() => console.log('Vendor version drift check done (informational only).'));
