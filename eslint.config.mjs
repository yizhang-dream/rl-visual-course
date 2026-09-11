// ESLint flat config · 纯静态站（无构建步骤）
// 目标：assets/js/**/*.js（浏览器经典脚本）+ 根目录 *.js 与 scripts/*.js（Node CommonJS）
// ignore：assets/vendor/**（第三方压缩产物）、node_modules/**、shots/**（截图产物）
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['assets/vendor/**', 'node_modules/**', 'shots/**'],
  },
  {
    // 浏览器经典脚本：index.html 里 <script> 直载，无模块系统
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // 项目全局：vendor 脚本与各文件按需注入（gsap 已移除，不再声明）
        Vue: 'readonly',        // assets/vendor/vue.global.prod.js
        katex: 'readonly',      // assets/vendor/katex/katex.min.js（ensureKatex 懒注入）
        RLV: 'readonly',        // components.js 导出的共享助手（window.RLV）
        RLVLoader: 'readonly',  // loader.js（window.RLVLoader）
        ROOT_TEMPLATE: 'readonly', // root-template.js（window.ROOT_TEMPLATE）
        DATA: 'readonly',       // 各 data*.js 挂在 window.DATA 上的课程数据
        GRAPH3D: 'readonly',    // graph3d-data.js 挂在 window.GRAPH3D 的知识图数据
        G3DRender: 'readonly',  // graph3d-render.js 挂在 window.G3DRender 的渲染器工厂
        ForceGraph3D: 'readonly', // assets/vendor/graph3d/3d-force-graph.min.js（仅 graph3d.html 载入）
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // == 容易在类型不同时悄悄放行：统一 ===，但保留惯用的 == null 判空
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'eol-last': 'error',
    },
  },
  {
    // Node 工具脚本：check_templates.js / verify_site.js / scripts/*.js
    files: ['*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        // verify_site.js 驱动浏览器 API（page.evaluate 内的代码是字符串，不在此检查）
        ...globals.browser,
        Vue: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'eol-last': 'error',
    },
  },
];
