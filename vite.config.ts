import { defineConfig } from 'vite';
import {buildIdentityPlugin} from './build/identity.mjs';
export default defineConfig({
  base: '/endless-earth/',
  plugins:[buildIdentityPlugin()],
});
