import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { themeHeadScript } from '@yewdiel21/motion-kit/theme';
import { MK_HEAD_SCRIPT } from '@yewdiel21/motion-kit';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'motion-kit-theme',
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            children: themeHeadScript({ default: 'oled', mode: 'dark' }),
            injectTo: 'head-prepend',
          },
          { tag: 'script', children: MK_HEAD_SCRIPT, injectTo: 'head-prepend' },
        ];
      },
    },
  ],
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8000' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['@yewdiel21/motion-kit/react', '@yewdiel21/motion-kit/theme', 'gsap'],
        },
      },
    },
  },
});
