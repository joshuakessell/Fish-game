import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      // Proxy SignalR and API calls to C# backend
      '/gamehub': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            socket.on('error', err => {
              console.error('WebSocket proxy client socket error:', err);
            });
          });
          proxy.on('error', (err, _req, res) => {
            console.error('WebSocket proxy error:', err);
          });
        },
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../wwwroot',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
