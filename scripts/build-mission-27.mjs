import {build} from 'vite';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {mission26EvidencePlugin} from './lib/mission-26-diagnostic.mjs';

const root=resolve('.'),out=resolve(process.argv[2]??'work/mission-27/compiled');
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
execFileSync('git',['diff','--exit-code',source,'--','src','public','package.json','package-lock.json','vite.config.ts']);
const prior=mission26EvidencePlugin();
const extension=`
if(new URLSearchParams(location.search).has('evidence')){
 window.m27={
  source:${JSON.stringify(source)},
  state(){return {source:this.source,position:avatar.position.toArray(),gps:planet?.geo(avatar.position),activity:activity.state,planet:structuredClone(planet?.metrics),render:{...renderer.info.render},memory:{...renderer.info.memory},buffer:[renderer.domElement.width,renderer.domElement.height],profile:lifeSettings.name,gpu:window.p252.state().gpu,climate:window.p252.state().climate,audio:sound.stats()};},
  ready(){return geographyReady&&planet?.ready;},
  face(yawValue,pitchValue=.05,view='first'){yaw=yawValue;pitch=pitchValue;setViewMode(view);zoom=smoothZoom=thirdZoom=4;transitionElapsed=1;eyeHeight=avatar.position.y+1.65;window.p252.hold(false);},
  objects(){const records=[];scene.traverse(o=>{if(o.name.startsWith('planet-enrichment')||o.userData.enrichment)records.push({name:o.name,visible:o.visible,instances:o.count??null,vertices:o.geometry?.attributes.position?.count??null,metadata:o.userData.enrichment??null});});return records;},
  nearBuildings(){if(!planet?.surface)return [];return [...planet.surface.features.values()].map(r=>r.feature).filter(f=>f.kind==='building'&&f.polygon).map(f=>({id:f.id,points:f.points,tags:f.tags}));}
 };
}
`;
await build({root,configFile:resolve('vite.config.ts'),plugins:[{...prior,name:'mission-27-evidence-only',transform(code,id){const result=prior.transform(code,id);return result?result+extension:undefined;}}],build:{outDir:out,emptyOutDir:true,rollupOptions:{input:{main:resolve('index.html'),fixture:resolve('fixtures/mission-27.html')}}}});
await mkdir(out,{recursive:true});
await writeFile(resolve(out,'runtime-build.json'),JSON.stringify({sourceCommit:source,sourceTree:execFileSync('git',['rev-parse',source+':src'],{encoding:'utf8'}).trim(),instrumentationSHA256:createHash('sha256').update(await readFile('scripts/build-mission-27.mjs')).digest('hex'),builtAt:new Date().toISOString(),method:'Existing M25.2/M26 diagnostic shim plus inspection only. No changed physics/controller. Placements in q26 are diagnostics, never counted as journeys. No acceleration supplied by this shim.'},null,2));
