
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      strict: true,
      allow: ['..'],
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://drill.ntechnosolution.com/'] 
        : ['http://localhost:8080', 'http://127.0.0.1:8080', 'f3ad51aa-0243-4bac-b060-adbf68d4338f.lovableproject.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: 86400,
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
    },
    proxy: {
      // Add proxy configuration if needed
    },
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'opencascade.js': path.resolve(__dirname, 'node_modules/opencascade.js/dist/opencascade.js'),
    },
  },
  optimizeDeps: {
    exclude: ['opencascade.js'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      external: ['opencascade.js'],
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  publicDir: 'public',
  assetsInclude: ['**/*.wasm'],
}));
