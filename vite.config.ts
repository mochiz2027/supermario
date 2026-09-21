import { defineConfig } from 'vite';

export default defineConfig({
  base: '/supermario/', // 이 부분을 추가
  // 기존 설정 내용 유지...
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
  },
});
