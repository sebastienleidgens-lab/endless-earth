import {execFileSync} from 'node:child_process';
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative,basename} from 'node:path';

// The active report is explicitly selected in package.json, never guessed
// from the branch name, newest document, environment variables or today's date.
export function readBuildIdentity(root,environment){
 const git=(...args)=>{try{return execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:2000}).trim()}catch{return null}};
 let mission=null;
 try{
  const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
  const source=pkg.endlessEarth?.missionReport;
  if(typeof source==='string'){
   const file=realpathSync(resolve(root,source)),path=relative(realpathSync(root),file);
   if(path&&!path.startsWith('..')&&!path.startsWith('/')){
    const heading=readFileSync(file,'utf8').split(/\r?\n/).find(line=>line.trim());
    const match=heading?.match(/^# Mission (\d{2,}(?:\.\d+)*) — (\S[^\r\n]{0,99})$/u);
    if(match&&basename(file)===`mission-${match[1].replaceAll('.','-')}.md`)mission={number:match[1],name:match[2].trim(),source};
   }
  }
 }catch{/* No authoritative mission: keep it explicitly unavailable. */}
 const top=git('rev-parse','--show-toplevel');
 // An exported source folder inside another checkout must not inherit its Git ID.
 const ownRepository=top!==null&&realpathSync(top)===realpathSync(root);
 const candidate=ownRepository?git('rev-parse','HEAD'):null;
 const commit=candidate&&/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(candidate)?candidate:null;
 const short=commit?git('rev-parse','--short=8','HEAD'):null;
 const status=commit?git('status','--porcelain','--untracked-files=normal'):null;
 return {app:'ENDLESS EARTH',mission,commit,shortCommit:short&&/^[a-f0-9]{8,64}$/.test(short)&&commit.startsWith(short)?short:null,dirty:status===null?null:status.length>0,environment};
}

export function buildIdentityPlugin(){
 const id='\0virtual:build-identity';let root,environment,snapshot;
 return {
  name:'endless-earth-build-identity',
  configResolved(config){root=config.root;environment=config.command==='build'?'production':'development';snapshot=readBuildIdentity(root,environment)},
  resolveId(source){if(source==='virtual:build-identity')return id},
  load(source){if(source===id){if(environment==='development')snapshot=readBuildIdentity(root,environment);return `export const buildIdentity = ${JSON.stringify(snapshot)};`}},
  generateBundle(){
   if(JSON.stringify(readBuildIdentity(root,environment))!==JSON.stringify(snapshot))this.error('Les métadonnées des sources ont changé pendant la compilation ; relancer le build.');
  },
  handleHotUpdate(ctx){
   if(!ctx.modules.length&&ctx.file!==resolve(root,'package.json')&&!/^docs\/mission-\d+(?:-\d+)*\.md$/.test(relative(root,ctx.file)))return;
   const next=readBuildIdentity(root,environment);
   if(JSON.stringify(next)!==JSON.stringify(snapshot)){
    snapshot=next;const module=ctx.server.moduleGraph.getModuleById(id);
    if(module){ctx.server.moduleGraph.invalidateModule(module);return [...ctx.modules,module]}
   }
  }
 };
}
