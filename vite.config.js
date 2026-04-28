import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages: https://username.github.io/repo-name/ 형태이므로 base 필수
  base: '/quantum-visual-lab/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 빌드 결과 최적화
    minify: 'terser',
    sourcemap: false,
    
    // 멀티 페이지 설정 (infinite-well.html 등 추가 페이지 처리)
    rollupOptions: {
      input: {
        main: 'index.html',
        infiniteWell: 'src/pages/infinite-well.html'
      }
    }
  },
  
  // 개발 서버 설정 (로컬 테스트용 — 영향 없음)
  server: {
    port: 5173,
    open: true
  }
})
