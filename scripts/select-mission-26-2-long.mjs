import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {RouteIndex} from '../src/planet/route-index.mjs';
import {lambert93,inverseLambert93,legacyAdapter} from '../src/planet/coordinates.mjs';
const r=new RouteIndex(gunzipSync(await readFile('public/planet/fr-86/navigation/land.pack'))),selection=JSON.parse(await readFile('docs/mission-26-2-evidence/routes-selection.json')),legacy=legacyAdapter({lat:46.6953,lon:.8844});
for(const [name,mode,gps]of [['Chauvigny','car',{lat:46.571,lon:.649}],['Vallee','car',{lat:46.6065100,lon:.60530915}],['spawn','foot',legacy.toGeo({x:-353.6621539555,z:-13.7275129297})]].filter(c=>!process.argv[2]||c[0]===process.argv[2])){
 const mask=mode==='foot'?1:2,start=r.nearest(lambert93(gps),mask,250),distance=new Float64Array(r.count);distance.fill(Infinity);distance[start.id]=0;
 const heap=[],push=(id,score)=>{let i=heap.length;heap.push({id,score});while(i){const p=(i-1)>>1;if(heap[p].score<=score)break;heap[i]=heap[p];i=p;}heap[i]={id,score};},pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(2*i+1<heap.length){let c=2*i+1;if(c+1<heap.length&&heap[c+1].score<heap[c].score)c++;if(heap[c].score>=last.score)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;};
 push(start.id,0);const closed=new Uint8Array(r.count);let visited=0,furthest=start.id;
 while(heap.length){const {id,score}=pop();if(closed[id])continue;closed[id]=1;visited++;if(score>distance[furthest])furthest=id;for(let e=r.offsets[id];e<r.offsets[id+1];e++){const o=r.edgeOffset+e*24;if(!(r.view.getUint32(o+20,true)&mask))continue;const to=r.view.getUint32(o+4,true),next=score+r.view.getFloat64(o+8,true);if(next>=distance[to])continue;distance[to]=next;push(to,next);}}
 const route=r.route(start.point,r.point(furthest),mode);if(route.complete)route.localPoints=route.points.map(p=>legacy.fromGeo(inverseLambert93(p)));
 selection.cases=selection.cases.filter(c=>!(c.from===name&&c.to==='furthest-connected-source'&&c.mode===mode));selection.cases.push({from:name,to:'furthest-connected-source',mode,requested:[gps,inverseLambert93(r.point(furthest))],reachableSourceNodes:visited,route});console.log(name,mode,visited,route.distance);
}
await writeFile('docs/mission-26-2-evidence/routes-selection.json',JSON.stringify(selection,null,2));
