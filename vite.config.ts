import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.Finnhub_API_Key1': JSON.stringify(env.Finnhub_API_Key1),
      'process.env.Finnhub_API_Key2': JSON.stringify(env.Finnhub_API_Key2),
      'process.env.Finnhub_API_Key3': JSON.stringify(env.Finnhub_API_Key3),
      'process.env.Finnhub_API_Key4': JSON.stringify(env.Finnhub_API_Key4),
      'process.env.Finnhub_API_Key5': JSON.stringify(env.Finnhub_API_Key5),
      'process.env.Tiingo_API_Key': JSON.stringify(env.Tiingo_API_Key),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
