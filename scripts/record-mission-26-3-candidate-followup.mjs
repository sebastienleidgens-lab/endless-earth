import {execFileSync,spawn} from 'node:child_process';import {open} from 'node:fs/promises';
while(execFileSync('ps',['-eo','args']).toString().split('\n').some(s=>/^node scripts\/record-mission-26-3(?:.mjs |\-reference-followup.mjs)/.test(s)))await new Promise(r=>setTimeout(r,2000));
const f=await open('work/mission-26-3/native-candidate-checked.log','w');await new Promise(resolve=>spawn('node',['scripts/record-mission-26-3.mjs','candidate-checked','5416'],{stdio:['ignore',f.fd,f.fd]}).on('exit',resolve));await f.close();
