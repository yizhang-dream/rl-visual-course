# lite-build · JupyterLite 构建环境与操作文档

笔记本实验室（`lite.html` hub 页 + `/lite/` 子站）的构建环境说明。产物 `lite/` 是纯静态目录，
部署到任意静态服务器即可。**2026-09-13 起默认走瘦身构建**：pyodide 内核 + numpy/matplotlib
闭包全部本地离线，产物 **52MB**（原全量版 445MB，回退方法见 §6）。

## 目录职责

| 路径 | 职责 | 是否入库 |
|---|---|---|
| `notebooks/` | 笔记本**源文件**（nb0-tour.ipynb 等） | 是（内容归 git 管） |
| `lite-build/build.md` | 本文档 | 是 |
| `lite-build/requirements.lock` | venv 依赖锁（90 项，含 `pyodide-lock==0.2.1`） | 是 |
| `lite-build/jupyter_lite_config.json` | 瘦身构建的 PyodideLockAddon 配置（specs + wheels） | 是 |
| `lite-build/pyodide-wheels.urls` | 24 个闭包 wheel 的 CDN 固定 URL 清单 | 是 |
| `lite-build/pyodide-core-314.0.6.tar.bz2` | pyodide 核心包（6.8MB，**已重打包打补丁**，见 §2） | 否（可按 §2 重建） |
| `lite-build/pyodide-wheels/` | 24 个闭包 wheel 本地副本（17MB，sha 已对官方锁校验） | 否（由 urls 清单重建） |
| `lite-build/.venv` / `lite-build/.cache` / `lite-build/stage/` | 本地产物 | 否 |
| `D:/rl-viz-lite-cache/` | 瘦身构建缓存（路径**不能含空格**，见坑 ④） | 否（可整目录删） |
| 仓库根 `jupyter-lite.json` | JupyterLite 站点配置（**生效位置必须是仓库根**，见 §5） | 是 |
| `lite/` | `jupyterlite build` 产物（52MB，见体积实测） | 否（gitignore） |

## 1. 建环境（一次性）

```bash
# 仓库根执行；uv 需已安装。Windows Git Bash 下 venv 的 python 在 Scripts/（不是 bin/）
uv venv --python 3.13 lite-build/.venv
uv pip install --python lite-build/.venv/Scripts/python.exe \
    jupyterlite jupyterlite-pyodide-kernel jupyter-server pyodide-lock \
    numpy nbformat nbclient nbconvert ipykernel
uv pip freeze --python lite-build/.venv/Scripts/python.exe > lite-build/requirements.lock
```

锁定的关键版本（完整见 `requirements.lock`，90 项）：

- `jupyterlite==0.8.3`（= jupyterlite-core 0.8.3）
- `jupyterlite-pyodide-kernel==0.8.6`（绑定 `pyodide 314.0.6` / 浏览器内 Python 3.14）
- `pyodide-lock==0.2.1`（瘦身构建必需：PyodideLockAddon 用它 + uv 重写锁，**不装则 lock 任务直接 FAIL**）
- `jupyter-server==2.21.0`、`numpy==2.5.3`、`nbconvert==7.17.1`、`nbclient==0.11.0`、`nbformat==5.11.1`

### 与常见旧文档的版本差异（实测记录）

1. **`pip install 'jupyterlite[pyodide]'` 已失效**：0.8.x 的 `jupyterlite` 元包没有 `pyodide`
   extra。pyodide 内核是独立包 `jupyterlite-pyodide-kernel`，需单独安装。
2. **`--contents` 必须先装 `jupyter-server`**：缺包时报
   `RuntimeError: jupyter-server is not installed. You cannot add custom content...`。
3. **`--pyodide <tarball>` 是唯一的内核发行版开关**：本地路径相对仓库根解析，构建期解压拷进
   `lite/static/pyodide/`，并把产物 `jupyter-lite.json` 的 `pyodideUrl` patch 成
   `./static/pyodide/pyodide.mjs`。
4. **`--pyodide-lock-specs` / `--pyodide-lock-wheels` 在 CLI 上传多值会炸**：
   traitlets 把 `'numpy'` 当 str 塞给 TypedTuple，报
   `TraitError: The 'specs' trait ... expected a tuple`，且 addon **静默失败**（build 仍 exit 0，
   产物缺锁缺 wheel）。必须走 config 文件（`lite-build/jupyter_lite_config.json` + `--config`）。

## 2. 瘦身构建原理与首次准备（一次性）

思路：`--pyodide` 指向 **pyodide-core**（只有运行时，15MB 解压后）而非全量发行版（377MB），
再用 PyodideLockAddon + uv 重写 `pyodide-lock.json`，只把 **numpy + matplotlib 及其闭包 +
内核自身闭包**（共 31 个包）打进 `lite/static/pyodide-lock/`。

首次准备三步：

```bash
# ① 下载 pyodide-core 并重打包（info.platform 补丁，原因见坑 ⑤）
curl -L --fail -o lite-build/pyodide-core-314.0.6.tar.bz2 \
  "https://github.com/pyodide/pyodide/releases/download/314.0.6/pyodide-core-314.0.6.tar.bz2"
mkdir -p /d/core-repack && tar -xjf lite-build/pyodide-core-314.0.6.tar.bz2 -C /d/core-repack
lite-build/.venv/Scripts/python.exe -c "
import json
from pathlib import Path
p = Path('D:/core-repack/pyodide/pyodide-lock.json')
d = json.loads(p.read_text(encoding='utf-8'))
d['info']['platform'] = 'pyemscripten_2026_0'   # 原值 emscripten_5_0_3
p.write_text(json.dumps(d, indent=2), encoding='utf-8')
"
rm lite-build/pyodide-core-314.0.6.tar.bz2
tar -cjf lite-build/pyodide-core-314.0.6.tar.bz2 -C /d/core-repack pyodide && rm -rf /d/core-repack

# ② 下载 24 个闭包 wheel（清单已固定版本入库；建在 lite-build/pyodide-wheels/）
mkdir -p lite-build/pyodide-wheels && cd lite-build/pyodide-wheels
tr -d '\r' < ../pyodide-wheels.urls | while read -r u; do [ -n "$u" ] && curl -sSf -O "$u"; done
cd ../..

# ③ 缓存目录：任何无空格路径，例如 D:/rl-viz-lite-cache（原因见坑 ④），首次可mkdir或让构建自建
```

`jupyter_lite_config.json`（已入库，改动它 = 改锁内容）：

```json
{
  "PyodideLockAddon": {
    "enabled": true,
    "specs": ["numpy", "matplotlib", "pexpect"],
    "wheels": ["lite-build/pyodide-wheels"]
  }
}
```

- `specs`：进入锁的根包。`pexpect` 不是 notebook 用的——是坑 ⑤ 标记环境误判的补偿（见下）。
- `wheels`：闭包 wheel 本地目录。它们作为 `file://` 根需求进 uv 解，从而**强制落盘本地**
  （`static/pyodide-lock/`），而不是留在 CDN URL。comm / pexpect / ipython-pygments-lexers /
  ptyprocess 不在 pyodide 发行版锁里，由 uv 从 PyPI 自动补齐并本地化。
- 内核自身的 ipykernel / piplite / pyodide-kernel 不用管：addon 自动从
  `lite/extensions/` 拿到并把锁指向那里。

## 3. 构建 / 重建（在仓库根执行）

```bash
# ① 暂存：--contents 平铺进 lite/files/，hub 深链约定是 ?path=notebooks/<file>，先摆前缀
mkdir -p lite-build/stage/notebooks
cp notebooks/*.ipynb lite-build/stage/notebooks/

# ② 重建一律先删库删产物（doit 增量误判 + 瘦身缓存混入全量提取物的坑）
rm -rf lite .jupyterlite.doit.db

# ③ 瘦身构建（缓存路径不能含空格；UV_BIN 指向 uv.exe；--no-sourcemaps 省 49MB）
JUPYTERLITE_CACHE_DIR="D:/rl-viz-lite-cache" \
UV_BIN="C:\Users\zyz\.local\bin\uv.EXE" \
lite-build/.venv/Scripts/python.exe -m jupyterlite build \
    --no-sourcemaps \
    --config lite-build/jupyter_lite_config.json \
    --contents lite-build/stage \
    --output-dir lite \
    --pyodide lite-build/pyodide-core-314.0.6.tar.bz2
```

**构建成功三标志（每次都要核）**：

1. 日志含 `MERGED ...jupyter-lite.json from [...仓库根的 jupyter-lite.json]`；
2. 日志含 `.  post_build:jupyterlite-pyodide-kernel-lock:lock:build`（前置 `.` 而非 `--`）；
   且全日志 `-- `（任务被跳过）为 **0** 条——曾实测出现 `build:lite:patch` 与
   `pyodide-kernel-pyodide:patch` 被误判 up-to-date，导致 `pyodideUrl`、存储配置、
   `disablePyPIFallback` **全部没 patch 进产物**（内核会回退内置 CDN 地址）；重跑一次即可恢复。
3. `grep -o '"pyodideUrl": "[^"]*"' lite/jupyter-lite.json` 输出
   `./static/pyodide/pyodide.mjs`，且 `lockFileURL` 为 `./static/pyodide-lock/pyodide-lock.json`。

注意：`notebooks/` 里的 ipynb 若带着宿主 Python 的执行输出，打进产物会让浏览器用户首屏看到
过期输出——构建前先清输出再暂存（主会话收割时统一处理）。

### 瘦身构建四大坑（全为 2026-09-13 实测，回退/换版本前必读）

1. **CLI 多值参数不可用** → 见 §1 差异 4，一切 specs/wheels 走 `--config`。
2. **uv 不认含空格路径的 `--constraints/--excludes`**（`D:\rl course` 中招，报
   `failed to read from file 'D:\rl'`）→ `JUPYTERLITE_CACHE_DIR` 必须无空格。
3. **uv 只认 `wasm32-pyodide2024` 平台**，而 pyodide 314 的 wheel 标签是
   `pyemscripten_2026_0_wasm32`：裸包名 specs 会让 uv 去 PyPI 找 matplotlib 的 wasm wheel
   （不存在）→ `no usable wheels`。**根治办法 = wheels 目录喂 `file://` 根需求**（uv 对
   直接 URL 跳过平台标签匹配）。
4. （同 ②）
5. **pyodide-lock 0.2.1 与 pyodide 314 标签方案互相矛盾**：`_check_wheel_compatible` 要求
   `info.platform == "pyemscripten_2026_0"`，但其 marker 环境用 `re.match("([^_]+)_", platform)`
   取 `sys_platform`——必须是 `emscripten*` 才能正确排除 ipython 的
   `pexpect; sys_platform != "win32" and != "emscripten"`。鱼与熊掌的解法：
   **tarball 内锁打补丁 `info.platform='pyemscripten_2026_0'`（§2 ①），再把 `pexpect`
   显式加进 specs** 让它进闭包（marker 误判成必需，那就给它）。

## 4. 瘦身版 vs 全量版：体积与功能差异

体积（2026-09-13 实测，jupyterlite 0.8.3 + jupyterlite-pyodide-kernel 0.8.6）：

| 项目 | 全量版（旧默认） | 瘦身版（现默认） |
|---|---|---|
| `lite/` 总大小 | **445MB** | **52MB**（-88%，scp 发版从数分钟降到秒级） |
| `lite/static/pyodide/` | 377MB（全量发行版 303 个 wheel 全在） | 15MB（core：asm.wasm 9.6MB + stdlib 2.5MB + mjs 等） |
| `lite/static/pyodide-lock/` | —（不存在） | 17MB（28 个闭包 wheel + 重写的 pyodide-lock.json） |
| sourcemap | 含（49MB） | 无（`--no-sourcemaps`，纯调试损失） |
| 浏览器首启下载 | ~16MB | ~16MB 不变（asm.wasm + stdlib + numpy，按需取） |

锁内**本地**包（31 个，全部经 sha256 校验为官方产物）：
numpy 2.4.6、matplotlib 3.10.8 及其依赖（contourpy / cycler / fonttools / kiwisolver /
packaging / pillow / pyparsing / python-dateutil / six）、ipython 9.12 及其依赖
（decorator / jedi / parso / prompt_toolkit / pure_eval / pygments / stack_data /
traitlets / wcwidth / asttokens / executing / matplotlib-inline / pexpect / ptyprocess /
ipython-pygments-lexers）、comm，以及内核三件（ipykernel / piplite / pyodide-kernel，
锁指向 `lite/extensions/` 下的官方 wheel）。

**功能差异（设计取舍，非缺陷）**：

- 锁里其余 332 个包（polars/scipy/opencv 等全量发行版包）在**重写的锁中是 jsdelivr CDN
  绝对 URL**。锁外包 `import` 时：在线会被拉起（CDN 可达即成功），**离线则失败**。全量版
  这些包可离线 import——瘦身版用不上它们，接受该取舍。notebooks 只允许 import 锁内闭包
  （numpy/matplotlib/标准库），这条纪律已由 `disablePyPIFallback: true` +
  `verify_site`/部署 smoke 兜底。
- `micropip.install` 装 PyPI 包：与全量版行为一致（`disablePyPIFallback: true` 只禁
  内核自动回退；显式 micropip 仍可装，在线才行）。
- 内核启动、numpy、matplotlib、断网运行：**与全量版无差**（首启预装 comm/ipykernel/
  ipython/pyodide-kernel，全部本地）。

## 5. jupyter-lite.json：存放位置与生效方式

**必须在仓库根**（= 构建时的 `lite_dir`）。jupyterlite 用 `lite_dir.rglob()` 收集
`jupyter-lite.json` 并 merge 进产物；放在子目录里会被"输出目录无对应父目录"规则**静默跳过**
——实测踩过，配置全没生效。

当前配置（字段名取自产物内 `jupyterlite.schema.v0.json`，非臆造）：

- `contentsStorageDrivers: ["asyncStorage"]` + `contentsStorageName: rl-viz-lite-contents`
  （settings/workspaces 同款三键）：三存储全部走 **IndexedDB**，浏览器里对笔记本文件的
  **改动跨刷新保留**（清站点数据才丢）。
- `litePluginSettings["@jupyterlite/pyodide-kernel-extension:kernel"].disablePyPIFallback: true`：
  禁止运行时回退 PyPI——配合本地闭包，**notebook 常规使用断网可跑**。
- 瘦身构建自动追加（勿手写，会被 patch 任务覆盖）：`pyodideUrl`、
  `loadPyodideOptions.lockFileURL`、预装 `packages` 列表、`pipliteUrls`。

**已确认无法持久化的：kernel 状态**（变量、import 的模块）。浏览器刷新即清空，需 Run All
重跑——JupyterLite 固有限制，hub 页与 NB0 里已写明。

## 6. 回退全量版（445MB，如瘦身后发现问题）

全量构建命令（不传 `--config`、不传 `--no-sourcemaps`，其余同旧文档；全量 tarball 仍在
`lite-build/.cache/pyodide/`，首次需重新解压）：

```bash
rm -rf lite .jupyterlite.doit.db
JUPYTERLITE_CACHE_DIR=lite-build/.cache \
lite-build/.venv/Scripts/python.exe -m jupyterlite build \
    --contents lite-build/stage --output-dir lite \
    --pyodide "https://github.com/pyodide/pyodide/releases/download/314.0.6/pyodide-314.0.6.tar.bz2"
```

注意全量与瘦身的**缓存目录不同**（瘦身必须无空格路径），两者互不污染，可并存。
全量版回退后锁回到 `lite/static/pyodide/pyodide-lock.json`（零绝对 URL）。

## 7. 离线验证方法（发版前自查）

```bash
# ① 产物配置零外链（配置文件里的 http(s) 都应是 schema 引用）
grep -rn "https\?://" lite/jupyter-lite.json lite/lab/jupyter-lite.json
# ② 内核本地化：pyodideUrl / lockFileURL 必须是本地相对路径
grep -o '"pyodideUrl": "[^"]*"\|"lockFileURL": "[^"]*"' lite/jupyter-lite.json
# ③ 锁内闭包全部本地且 sha 对得上（瘦身版核心断言；锁内其余 CDN 条目是设计取舍，见 §4）
lite-build/.venv/Scripts/python.exe -c "
import json, hashlib
from pathlib import Path
pkgs = json.load(open('lite/static/pyodide-lock/pyodide-lock.json', encoding='utf-8'))['packages']
base = Path('lite/static/pyodide')
bad = [n for n, p in pkgs.items() if not p['file_name'].startswith('http')
       and not (base / p['file_name']).resolve().is_file()]
assert not bad, bad
for n in ('numpy', 'matplotlib'):
    w = (base / pkgs[n]['file_name']).resolve()
    assert hashlib.sha256(w.read_bytes()).hexdigest() == pkgs[n]['sha256'], n
print('lock OK:', sum(1 for p in pkgs.values() if not p['file_name'].startswith('http')), 'local packages')
"
# ④ 本地起服 + 关键资产 200
lite-build/.venv/Scripts/python.exe -m http.server 8642   # 仓库根；起前 netstat -ano | grep 8642 清僵尸
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8642/lite/lab/index.html
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8642/lite/static/pyodide/pyodide.mjs
# ⑤ 官方一致性检查（解析锁 + depends 闭包 + 本地 wheel 存在性；参数必须与 build 完全一致，
#    否则 status_info 变化会触发 lock:build 重跑）
JUPYTERLITE_CACHE_DIR="D:/rl-viz-lite-cache" UV_BIN="C:\Users\zyz\.local\bin\uv.EXE" \
lite-build/.venv/Scripts/python.exe -m jupyterlite check \
    --config lite-build/jupyter_lite_config.json --contents lite-build/stage \
    --output-dir lite --pyodide lite-build/pyodide-core-314.0.6.tar.bz2
# 期望：exit 0，日志含 `.  check:jupyterlite-pyodide-kernel-lock:lock`
```

实测（2026-09-13 瘦身版）：①零外链；②`pyodideUrl=./static/pyodide/pyodide.mjs`、
`lockFileURL=./static/pyodide-lock/pyodide-lock.json`；③31 个本地条目全部解析 + numpy/
matplotlib sha256 匹配；④lab/index.html、pyodide.mjs、pyodide-lock.json、numpy/
matplotlib wheel、asm.wasm、stdlib、notebook 全部 200；⑤check 退出码 0。唯一一处
`cdn.jsdelivr.net` 出现在 `lite/extensions/.../schema/kernel.v0.schema.json`——设置项的
**文档示例默认值**，非运行时配置。

## 8. 其他已知限制与运维备忘

- **CI 不构建 lite**（下载 pyodide + uv 解算太重）：lite 构建是发版时本地步骤；`lite/`
  不存在时 verify_site 对 lite 的断言跳过。
- **宝塔重配可能覆盖 nginx location 块**（老坑）：部署后给 `/lite/static/` 配
  `js/wasm 7d 强缓存`、`location = /lite/lab/index.html` no-cache，每次发版后 curl 验证
  响应头。**锁外包的 CDN 条目**（§4）不受强缓存影响（浏览器直接请求 jsdelivr）。
- **发版序列**：`tar` 打包含 `lite/`（现在 52MB，scp 秒级）。
- 部署后 smoke：打开 `/lite/lab/index.html?path=notebooks/nb0-tour.ipynb`，
  Run All 应全绿（断网状态跑 = 常规使用零 CDN 的最终证明）。
