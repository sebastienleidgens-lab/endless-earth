import {build} from 'vite';
import {resolve} from 'node:path';
import {mission26EvidencePlugin} from './lib/mission-26-diagnostic.mjs';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=resolve(process.argv[2]??'.'),out=resolve(process.argv[3]??'work/mission-26/compiled');
await build({root,configFile:resolve(root,'vite.config.ts'),plugins:[mission26EvidencePlugin()],build:{outDir:out,emptyOutDir:true}});
await writeFile(resolve(out,'runtime-build.json'),JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),builtAt:new Date().toISOString(),root,method:'Compiled instrumented runtime; exact native capture build.'},null,2)+'\n');
