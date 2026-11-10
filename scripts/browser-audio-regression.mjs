// Reuse the existing 09.1 harnesses without overwriting their historical evidence.
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
await mkdir('work/mission-10',{recursive:true});await mkdir('docs/mission-10-evidence/regression',{recursive:true});let results=[];try{results=JSON.parse(await readFile('docs/mission-10-evidence/regression/summary.json','utf8'))}catch{};const selected=new Set(process.argv.slice(2));const record=row=>{results=results.filter(r=>r.harness!==row.harness);results.push(row)};
for(const name of ['runtime','memory','data']){if(selected.size&&!selected.has(name))continue;
 const original=`scripts/browser-earthlife-${name}-091.mjs`,target=`work/mission-10/regression-${name}.mjs`;
 const source=(await readFile(original,'utf8')).replaceAll('docs/mission-09-1-captures/','docs/mission-10-evidence/regression/').replaceAll("'./lib/browser-road-fixture.mjs'","'../../scripts/lib/browser-road-fixture.mjs'");await writeFile(target,source);
 try{execFileSync(process.execPath,[target],{stdio:'inherit',timeout:900000});record({harness:original,passed:true})}catch(error){record({harness:original,passed:false,error:String(error)})}
}
for(const target of selected.size?[]:['scripts/browser-camera.mjs','scripts/browser-safety.mjs'])try{execFileSync(process.execPath,[target],{stdio:'inherit',timeout:300000});record({harness:target,passed:true})}catch(error){record({harness:target,passed:false,error:String(error)})}
await writeFile('docs/mission-10-evidence/regression/summary.json',JSON.stringify(results,null,2));if(results.some(r=>!r.passed))throw Error('Regression harness failed; inspect retained report/log');console.log('PASS existing runtime, memory, 19 degraded-data cases, camera and collision safety');
