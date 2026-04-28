import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/quantum-visual-lab/',  // GitHub Pages 배포용
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        infiniteWell: resolve(__dirname, 'src/pages/infinite-well.html'),
        tunneling: resolve(__dirname, 'src/pages/phase2-tunneling/tunneling.html'),  // ← 이 줄 추가!
      },
    },
  },
});
