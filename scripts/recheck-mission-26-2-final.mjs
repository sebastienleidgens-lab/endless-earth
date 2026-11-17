// Run only after benchmark/native browsers close. Preserve each older cohort.
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const out='docs/mission-26-2-evidence';
const run=(script,args=[])=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/'+script,...args],{stdio:'inherit'});p.on('error',reject);p.on('close',code=>code===0?resolve():reject(Error(script+' exited '+code)));});
await mkdir('docs/mission-26-2-evidence/prior-cohorts',{recursive:true});
for(const name of ['spawn-Vicq-return-foot','fixture','seam-strips']){
 const old=JSON.parse(await readFile(`${out}/${name}.json`));await copyFile(`${out}/${name}.json`,`${out}/prior-cohorts/${name}.json`);
}
await run('traverse-mission-26-2.mjs',['spawn','Vicq-return','foot','5401']);
await run('check-mission-26-2-fixture.mjs',['5401']);
await run('check-mission-26-2-seams.mjs',['5401']);
