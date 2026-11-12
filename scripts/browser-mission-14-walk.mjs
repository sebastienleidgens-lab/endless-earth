// Existing native 450 m recorder; independent Mission 14 evidence destination.
import {readFile,mkdir} from 'node:fs/promises';
await mkdir('work/mission-14',{recursive:true});
let code=await readFile(new URL('browser-final-walk.mjs',import.meta.url),'utf8');
code=code.replace("port=phase==='before'?5181:5173,out='docs/mission-12-evidence/final'","port=phase==='before'?5177:5173,out='docs/mission-14-evidence'")
 .replaceAll('work/mission-12D/','work/mission-14/')
 .replaceAll("from 'playwright'",`from '${import.meta.resolve('playwright')}'`);
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
await import('./publish-mission-14-evidence.mjs');
