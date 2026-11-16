import { defineConfig } from 'vite';
// @ts-ignore Deterministic public asset staging.
import {publicAssets} from './build/public-assets.mjs';
import {buildIdentityPlugin} from './build/identity.mjs';
export default defineConfig({
  cacheDir:'work/vite',
  base: '/endless-earth/',
  server:{watch:{ignored:['**/work/**']}},
  optimizeDeps:{entries:['index.html']},
  plugins:[buildIdentityPlugin(),publicAssets()],
});
