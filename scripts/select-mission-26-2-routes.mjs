import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {RouteIndex} from '../src/planet/route-index.mjs';
import {lambert93,inverseLambert93,legacyAdapter} from '../src/planet/coordinates.mjs';
const r=new RouteIndex(gunzipSync(await readFile('public/planet/fr-86/navigation/land.pack'))),legacy=legacyAdapter({lat:46.6953,lon:.8844});
const places={spawn:legacy.toGeo({x:-353.6621539555,z:-13.7275129297}),Angles:{lat:46.6953,lon:.8844},Vicq:{lat:46.721,lon:.862},SaintPierre:{lat:46.679,lon:.845},Chauvigny:{lat:46.571,lon:.649},Chatellerault:{lat:46.817,lon:.545},Poitiers:{lat:46.5802,lon:.3404},Montmorillon:{lat:46.427,lon:.869},Loudun:{lat:47.009,lon:.082},Lussac:{lat:46.403,lon:.727},Civaux:{lat:46.445,lon:.666},Leignes:{lat:46.505,lon:.778},Pleumartin:{lat:46.737,lon:.759},LaRochePosay:{lat:46.786,lon:.815}};
const cases=[];
for(const [from,to]of [['spawn','Vicq'],['spawn','SaintPierre'],['spawn','Pleumartin'],['spawn','Chauvigny'],['Chauvigny','Chatellerault'],['Chauvigny','Civaux'],['Poitiers','Chatellerault'],['Montmorillon','Poitiers'],['Loudun','Lussac']])for(const mode of ['foot','car']){
 const a=r.nearest(lambert93(places[from]),mode==='foot'?1:2,250),b=r.nearest(lambert93(places[to]),mode==='foot'?1:2,250),route=a&&b?r.route(a.point,b.point,mode):{complete:false,reason:'no-admitted-node-in-250m'};
 if(route.complete)route.localPoints=route.points.map(p=>legacy.fromGeo(inverseLambert93(p)));
 cases.push({from,to,mode,requested:[places[from],places[to]],offsets:[a?.distance,b?.distance],route});console.log(from,to,mode,route.complete,route.distance??route.reason);
}
await writeFile('docs/mission-26-2-evidence/routes-selection.json',JSON.stringify({method:'Source route selection ONLY, not physical journey. Same policy as tile renderer/controller; unknown structures refused.',navigation:JSON.parse(await readFile('public/planet/fr-86/navigation/land.json')),cases},null,2));
