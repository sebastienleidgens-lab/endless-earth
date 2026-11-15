import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='66a078c3febb7fed26c72d23f068cb31cbb5b3e2',hash=b=>createHash('sha256').update(b).digest('hex');
const paths=execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n');
const protectedFiles=paths.filter(p=>p.startsWith('public/')||p.startsWith('src/world/')||p.startsWith('src/living/')&&p!=='src/living/sound.ts'||p.startsWith('.github/')||/living.paintings|lp-01/i.test(p));
const unchanged=[];
for(const path of protectedFiles){const original=execFileSync('git',['show',base+':'+path],{maxBuffer:128*1024*1024}),current=await readFile(path);assert.equal(hash(current),hash(original),path);unchanged.push({path,sha256:hash(current)});}
const snapshots={};
for(const [label,root]of [['base','work/mission-25-1/baseline'],['capture-v1','work/mission-25-1/candidate'],['navigation-capture','work/mission-25-1/candidate-final'],['sensory-capture','work/mission-25-1/candidate-audio'],['render-benchmark','work/mission-25-1/candidate-dock'],['grip-capture','work/mission-25-1/candidate-grip-capture'],['final','work/mission-25-1/candidate-grip']]){
 const files=execFileSync('rg',['--files',root+'/src'],{encoding:'utf8'}).trim().split('\n'),sources={};for(const path of files)sources[path.slice(root.length+1)]=hash(await readFile(path));snapshots[label]=sources;
}
for(const path of Object.keys(snapshots.final))assert.equal(hash(await readFile(path)),snapshots.final[path],'Final snapshot drift: '+path);
const runtimeCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const different=Object.keys(snapshots.final).filter(p=>snapshots.final[p]!==snapshots['capture-v1'][p]);
const modified=execFileSync('git',['diff','--name-only',base],{encoding:'utf8'}).trim().split('\n');
await writeFile('docs/mission-25-1-evidence/preservation.json',JSON.stringify({base,runtimeCommit,protectedUnchanged:unchanged.length,unchanged,modified,snapshots,captureV1ToFinalDifferences:different,comment:'capture-v1: locomotion and voyage-5. navigation-capture: attachment-corrected voyage-3. sensory-capture: swimming, forest/static wildlife, touch and terrain regression. render-benchmark: corrected bank corridor, mapped sound walk and ordinary benchmarks; grip-capture: corrected paddle grips, river walk and boat benchmarks; final: recurring perch lifecycle cleanup and local production. Source differences are explicit; never treat every film as the same revision. Geography and physical collision authority remain identical.'},null,2));console.log('PASS',unchanged.length,'protected files unchanged; snapshot differences',different);
