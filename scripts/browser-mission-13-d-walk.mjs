// Reuse the continuous native 450 m Mission 12 recorder, without rewriting its evidence.
import {readFile,mkdir} from 'node:fs/promises';
const phase=process.argv[2]??'after';
await mkdir('work/mission-13D',{recursive:true});
let code=await readFile(new URL('browser-final-walk.mjs',import.meta.url),'utf8');
code=code.replace("port=phase==='before'?5181:5173,out='docs/mission-12-evidence/final'","port=phase==='before'?5182:5173,out='docs/mission-13-evidence/optimization'")
 .replaceAll('work/mission-12D/','work/mission-13D/')
 .replaceAll("from 'playwright'",`from '${import.meta.resolve('playwright')}'`)
 .replace('const phase=process.argv[2]??\'after\'','const phase='+JSON.stringify(phase));
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
