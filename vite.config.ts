import { defineConfig } from 'vite';
import {buildIdentityPlugin} from './build/identity.mjs';
export default defineConfig({
  cacheDir:'work/vite',
  base: '/endless-earth/',
  server:{watch:{ignored:['**/work/**']}},
  optimizeDeps:{entries:['index.html']},
  plugins:[buildIdentityPlugin()],
});
