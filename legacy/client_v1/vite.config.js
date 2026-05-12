import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,           // LAN/터널에서 접속 허용 (0.0.0.0 바인딩)
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001'
    },
    // cloudflared 터널/외부 도메인에서도 접속 허용
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.app', '.loca.lt', '.serveo.net', '.pinggy.link']
  }
});
