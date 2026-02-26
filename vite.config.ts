import react from '@vitejs/plugin-react';
import dns from 'node:dns';
import path from 'path';
import externalGlobals from 'rollup-plugin-external-globals';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { createHtmlPlugin } from 'vite-plugin-html';

const CDN = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-router': 'ReactRouter',
  zustand: 'Zustand',
  axios: 'axios',
  'lodash-es': '_',
  'framer-motion': 'motion',
  dayjs: 'dayjs',
};

const externalList = Object.keys(CDN);

const globals = externalGlobals(CDN);

dns.setDefaultResultOrder('verbatim');

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production' || process.env.NODE_ENV === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    base: './',
    server: {
      port: 8888,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, '')
        },
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      viteCompression({
        threshold: 1024 * 10, // 压缩阈值
        deleteOriginFile: false,
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            // 生产环境使用CDN脚本
            cdnScripts: isProd
              ? `<script src="https://cdn.jsdelivr.net/npm/react@19.1.0/+esm"></script>
          <script src="https://cdn.jsdelivr.net/npm/react-dom@19.1.0/+esm"></script>
          <script src="https://cdn.jsdelivr.net/npm/react-router@7.6.0/+esm"></script>
          <script src="https://cdn.jsdelivr.net/npm/zustand@5.0.5/+esm"></script>
          <script src="https://cdn.jsdelivr.net/npm/axios@1.9.0/+esm"></script>
          <script src="https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/+esm"></script>
          <script src="https://cdn.jsdelivr.net/npm/framer-motion@12.12.1/+esm"></script>
          <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.13/+esm"></script>`
              : '',
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '~': path.resolve(__dirname),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    build: {
      minify: 'terser', // 压缩 terser 是 uglify-es 的继任者，压缩效果更好
      cssCodeSplit: true, // css 代码分割
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1024, // 警告阈值
      assetsInlineLimit: 4096, // 小于4kb的资源内联为base64
      target: 'esnext', // 现代浏览器支持
      rollupOptions: {
        // experimentalLogSideEffects: true, // 注释掉以减少副作用警告
        output: {
          // experimentalMinChunkSize: 1024, // 最小块大小
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              // 核心框架与状态管理
              if (
                id.includes('react/') ||
                id.includes('react-dom/') ||
                id.includes('scheduler/') ||
                id.includes('use-sync-external-store/')
              ) {
                return 'react-core';
              }

              // 路由相关
              if (id.includes('react-router')) {
                return 'router';
              }

              // 状态管理
              if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
                return 'state-management';
              }

              // UI组件和动画
              if (id.includes('framer-motion') || id.includes('styled-components')) {
                return 'ui-components';
              }

              // 工具类库
              if (
                id.includes('lodash') ||
                id.includes('dayjs') ||
                id.includes('immer') ||
                id.includes('classnames') ||
                id.includes('qs')
              ) {
                return 'utils';
              }

              // 编辑器相关
              if (id.includes('lexical')) {
                return 'editor';
              }

              // 网络请求
              if (id.includes('axios')) {
                return 'network';
              }

              // 按需加载大型依赖
              if (id.includes('lottie-web')) {
                return 'animations';
              }

              // 其他所有依赖
              return 'vendors';
            }

            // 应用代码按模块拆分
            if (id.includes('/src/')) {
              if (id.includes('/components/')) {
                return 'ui';
              }
              if (id.includes('/pages/')) {
                return 'pages';
              }
              if (id.includes('/hooks/')) {
                return 'hooks';
              }
              if (id.includes('/utils/') || id.includes('/helpers/')) {
                return 'app-utils';
              }
              if (id.includes('/services/') || id.includes('/api/')) {
                return 'services';
              }
              if (id.includes('/store/')) {
                return 'app-store';
              }
            }
          },
        },
        external: isProd ? externalList : [],
        plugins: [
          isAnalyze
            ? visualizer({
                open: true,
                filename: 'dist/stats.html',
                gzipSize: true,
                brotliSize: true,
              })
            : null,
          isProd ? globals : null,
        ].filter(Boolean),
      },
      terserOptions: {
        compress: {
          drop_console: isProd,
          pure_funcs: ['console.log'],
          drop_debugger: isProd,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
    },
  };
});
