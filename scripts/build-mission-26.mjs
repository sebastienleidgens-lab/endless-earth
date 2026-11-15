import {build} from 'vite';
import {resolve} from 'node:path';
import {mission26EvidencePlugin} from './lib/mission-26-diagnostic.mjs';
const root=resolve(process.argv[2]??'.'),out=resolve(process.argv[3]??'work/mission-26/compiled');
await build({root,configFile:resolve(root,'vite.config.ts'),plugins:[mission26EvidencePlugin()],build:{outDir:out,emptyOutDir:true}});
