import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const paths=['package.json',...execFileSync('rg',['--files','src'],{encoding:'utf8'}).trim().split('\n')].sort(),snapshot={};
for(const path of paths)snapshot[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await mkdir('work/mission15c',{recursive:true});
await writeFile('work/mission15c/frozen-source.json',JSON.stringify(snapshot,null,2)+'\n');
console.log('Frozen',paths.length,'runtime sources for15C evidence; repeat after any runtime change.');
