import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
const src=resolve(process.argv[2]),dst=resolve('docs/mission-26-2-evidence/builds',process.argv[3]);await mkdir(dst,{recursive:true});
const files={};
for(const name of ['index.html','runtime-build.json',...(await readdir(join(src,'assets'))).map(f=>'assets/'+f)]){
 const data=await readFile(join(src,name)),target=join(dst,name);await mkdir(resolve(target,'..'),{recursive:true});await writeFile(target,data);files[name]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};
}
const receipt=JSON.parse(await readFile(join(src,'runtime-build.json')));
await writeFile(join(dst,'receipt.json'),JSON.stringify({...receipt,files,scope:'Exact executed diagnostic HTML/JS/CSS/workers. Public source assets are referenced by source manifests rather than duplicating hundreds of MB per build.'},null,2));
console.log({archive:relative(process.cwd(),dst),source:receipt.sourceCommit,files:Object.keys(files).length});
