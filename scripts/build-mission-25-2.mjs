import {build} from 'vite';
import {resolve} from 'node:path';
import {evidencePlugin} from './lib/mission-25-2-diagnostic.mjs';
const root=resolve(process.argv[2]??'.'),out=resolve(process.argv[3]??'work/mission-25-2/compiled');
await build({root,configFile:resolve(root,'vite.config.ts'),plugins:[evidencePlugin()],build:{outDir:out,emptyOutDir:true}});
