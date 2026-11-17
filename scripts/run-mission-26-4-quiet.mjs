import {execFileSync,spawnSync} from 'node:child_process';
import {openSync,closeSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
const report={method:'Sequential CPU/reference/candidate after all functional/media/report work finished. No encoder, second game, document generation or bulk hashing by this agent during samples. Actual process inventories and case wall timestamps retained. Software rendering and unequal climate/cache histories still prevent physical GPU or<=5percent acceptance.',runs:[]};
const inventory=()=>execFileSync('ps',['-eo','pid,stat,comm,args'],{encoding:'utf8'}).split('\n').filter(s=>/chromium|ffmpeg|node scripts|python3 scripts/.test(s)&&!/^\s*\d+\s+Z/.test(s)&&!/codex-linux-sandbox|bwrap/.test(s));
const busy=inventory().filter(s=>/node scripts\/(?:traverse|regress|record|soak|verify|replay|probe|check|report|audit)-mission-26-4/.test(s));
if(busy.length)throw Error('Functional/media/report owners still running: '+busy.join('\n'));
for(const [script,args,label] of [['benchmark-mission-26-4-cpu.mjs',['docs/mission-26-4-evidence/cpu-quiet.json'],'cpu-quiet'],['benchmark-mission-26-4.mjs',['reference-quiet','5437','8'],'reference-quiet'],['benchmark-mission-26-4.mjs',['candidate-quiet','5441','8'],'candidate-quiet']]){
 const before=inventory(),start=new Date().toISOString(),fd=openSync('work/mission-26-4/'+label+'.log','w'),result=spawnSync(process.execPath,['scripts/'+script,...args],{stdio:['ignore',fd,fd]});closeSync(fd);report.runs.push({script,args,start,end:new Date().toISOString(),exitCode:result.status,before,after:inventory()});await writeFile('docs/mission-26-4-evidence/quiet-execution.json',JSON.stringify(report,null,2));if(result.status)throw Error(label+' exited '+result.status);
}
