// Load browser-independent Three.js builders in Node without a renderer.
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve,dirname,extname} from 'node:path';import {pathToFileURL} from 'node:url';import {transpileModule} from 'typescript';import {createHash} from 'node:crypto';
export async function cpuModules(root=process.cwd(),directory='work/cpu-modules',transforms={}){
 directory=resolve(directory);await mkdir(directory,{recursive:true});const seen=new Map();
 async function compile(file){file=resolve(file);if(!extname(file))file+='.ts';if(seen.has(file))return seen.get(file);
  const target=resolve(directory,createHash('sha256').update(file).digest('hex').slice(0,16)+'.mjs');seen.set(file,target);let text=await readFile(file,'utf8');const relative=file.slice(resolve(root).length+1);if(transforms[relative])text=transforms[relative](text);
  let code=file.endsWith('.ts')?transpileModule(text,{compilerOptions:{target:9,module:99}}).outputText:text;
  const imports=[...code.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)];
  for(const match of imports){const source=resolve(dirname(file),match[1]);const dependency=await compile(source);code=code.replaceAll(`'${match[1]}'`,`'${pathToFileURL(dependency).href}'`).replaceAll(`"${match[1]}"`,`"${pathToFileURL(dependency).href}"`)}
  await writeFile(target,code);return target;
 }
 return async file=>import(pathToFileURL(await compile(resolve(root,file))).href);
}
