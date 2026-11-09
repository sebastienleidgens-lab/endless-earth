import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {build} from 'vite';
import {readBuildIdentity,buildIdentityPlugin} from '../build/identity.mjs';
import {buildIdentityMarkup} from '../src/ui/build-identity.mjs';

async function fixture(run,withGit=true){
 const root=await mkdtemp(join(tmpdir(),'endless-build-'));
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
  await mkdir(join(root,'docs'));
  await writeFile(join(root,'package.json'),JSON.stringify({type:'module',endlessEarth:{missionReport:'docs/mission-07.md'}}));
  await writeFile(join(root,'docs/mission-07.md'),'# Mission 07 — La Terre véritable\n');
  // A planned document must never become the executed mission by filename sorting.
  await writeFile(join(root,'docs/mission-99.md'),'# Mission 99 — Projet futur\n');
  const component=resolve('src/ui/build-identity.mjs');
  await writeFile(join(root,'entry.mjs'),`import {buildIdentity} from 'virtual:build-identity';import {buildIdentityMarkup} from ${JSON.stringify(component)};export const info=buildIdentity;export const markup=buildIdentityMarkup(buildIdentity);`);
  if(withGit){git('init','-q');git('add','.');git('-c','user.name=Build test','-c','user.email=build@example.invalid','commit','-qm','Fixture')}
  await run(root,git);
 }finally{await rm(root,{recursive:true,force:true})}
}
async function compiled(root){
 const output=await build({root,configFile:false,logLevel:'silent',plugins:[buildIdentityPlugin()],build:{write:false,minify:false,lib:{entry:join(root,'entry.mjs'),formats:['es']}}});
 const chunk=(Array.isArray(output)?output:[output]).flatMap(o=>o.output).find(o=>o.type==='chunk');assert.ok(chunk);
 return import(`data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`);
}

test('compiled production badge matches the actual checkout and its explicitly selected mission',async()=>fixture(async(root,git)=>{
 const expectedCommit=git('rev-parse','HEAD'),short=git('rev-parse','--short=8','HEAD');
 const {info,markup}=await compiled(root);
 assert.equal(info.commit,expectedCommit);assert.equal(info.shortCommit,short);assert.equal(info.dirty,false);assert.equal(info.environment,'production');
 assert.deepEqual(info.mission,{number:'07',name:'La Terre véritable',source:'docs/mission-07.md'});
 assert.ok(markup.includes(`data-commit="${expectedCommit}"`));assert.ok(markup.includes(short));assert.ok(markup.includes('Mission 07 — La Terre véritable'));assert.ok(markup.includes('Production'));assert.ok(markup.includes('ENDLESS EARTH'));assert.ok(!markup.includes('Projet futur'));
}));
test('compiled dirty builds identify a base commit and local modifications',async()=>fixture(async(root,git)=>{
 await writeFile(join(root,'local-change.mjs'),'export const local=true;');
 const {info,markup}=await compiled(root);assert.equal(info.commit,git('rev-parse','HEAD'));assert.equal(info.dirty,true);assert.match(markup,/Base [a-f0-9]+ · modifié/);
}));
test('source export without Git retains the declared mission but never invents a commit',async()=>fixture(async root=>{
 const {info,markup}=await compiled(root);assert.equal(info.commit,null);assert.equal(info.shortCommit,null);assert.equal(info.dirty,null);assert.match(markup,/Commit indisponible/);assert.match(markup,/Mission 07 — La Terre véritable/);
},false));
test('missing or inconsistent mission metadata remains explicitly unknown',async()=>fixture(async root=>{
 await writeFile(join(root,'docs/mission-07.md'),'# Mission 08 — Mauvaise correspondance\n');
 const info=readBuildIdentity(root,'development');assert.equal(info.mission,null);assert.match(buildIdentityMarkup(info),/Mission indisponible/);assert.match(buildIdentityMarkup(info),/Développement/);
}));
test('an export inside another repository cannot borrow its parent commit',async()=>fixture(async root=>{
 const exported=join(root,'export');await mkdir(exported);await writeFile(join(exported,'package.json'),'{}');
 const info=readBuildIdentity(exported,'production');assert.equal(info.commit,null);assert.equal(info.mission,null);
}));
test('build labels escape source text rather than interpreting it as HTML',()=>{
 const html=buildIdentityMarkup({app:'ENDLESS EARTH',mission:{number:'07',name:'<img src=x>'},commit:null,shortCommit:null,dirty:null,environment:'development'},'<script>');
 assert.ok(html.includes('&lt;img src=x&gt;'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));
});
test('a checkout that changes during compilation cannot publish a falsely clean identity',async()=>fixture(async(root)=>{
 await assert.rejects(build({root,configFile:false,logLevel:'silent',plugins:[buildIdentityPlugin(),{name:'edit-during-build',buildStart:()=>writeFile(join(root,'changed-during-build.txt'),'changed')}],build:{write:false,lib:{entry:join(root,'entry.mjs'),formats:['es']}}}),/changé pendant la compilation/);
}));

test('corrective mission 07.1 is taken from its declared report, including in the compiled badge',async()=>fixture(async root=>{
 await writeFile(join(root,'package.json'),JSON.stringify({type:'module',endlessEarth:{missionReport:'docs/mission-07-1.md'}}));
 await writeFile(join(root,'docs/mission-07-1.md'),'# Mission 07.1 — Routes et intersections continues\n');
 const {info,markup}=await compiled(root);assert.deepEqual(info.mission,{number:'07.1',name:'Routes et intersections continues',source:'docs/mission-07-1.md'});assert.match(markup,/Mission 07\.1 — Routes et intersections continues/);
}));
