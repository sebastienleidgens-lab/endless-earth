// Reuse Mission 12/Mission 11 checks, saving fresh results without rewriting history.
import {readFile,mkdir,writeFile,unlink} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const out='docs/mission-13-evidence/checks';
await mkdir(out,{recursive:true});
for(const [file,from,to] of [
 ['browser-final-runtime.mjs',"const out='docs/mission-12-evidence/final'",`const out='${out}'`],
 ['browser-regional-architecture-runtime.mjs',"writeFile('docs/mission-12-evidence/architecture/runtime.json'",`writeFile('${out}/architecture-runtime.json'`],
 ['browser-regional-nature-runtime.mjs',"writeFile('docs/mission-12-evidence/nature/runtime.json'",`writeFile('${out}/nature-runtime.json'`],
 ['browser-immersive-runtime.mjs',"const out='docs/mission-11-evidence/optimization'",`const out='${out}'`]
]){
 let source=await readFile(new URL(file,import.meta.url),'utf8');
 if(!source.includes(from))throw Error('Upstream check changed: '+file);
 source=source.replace(from,to).replaceAll(/from '(\.\/[^']+)'/g,(_,path)=>`from '${new URL(path,import.meta.url).href}'`).replaceAll("from 'playwright'",`from '${import.meta.resolve('playwright')}'`);
 console.log('Running unchanged check logic:',file);
 await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
for(const file of ['zone-cycles.json','architecture-runtime.json','nature-runtime.json','runtime.json']){
 await writeFile(`${out}/${file}.gz`,gzipSync(await readFile(`${out}/${file}`),{level:9,mtime:0}));
 await unlink(`${out}/${file}`);
}
