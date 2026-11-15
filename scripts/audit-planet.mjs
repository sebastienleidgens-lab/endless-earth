import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {validateTile} from '../src/planet/tile-manager.mjs';
import {admitFeature} from '../src/planet/network.mjs';
const base=process.argv[2]??'public/planet/fr-86',manifest=JSON.parse(await readFile(base+'/manifest.json')),tiles=new Map(),seen=new Set(),counts={},kilometres={},reasons={},seams=[],failures=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const entry of manifest.tiles){
 const bytes=await readFile(base+'/'+entry.url);if(bytes.length!==entry.bytes||sha(bytes)!==entry.sha256)throw Error('Tile integrity: '+entry.id);const raw=gunzipSync(bytes);if(raw.length!==entry.decodedBytes)throw Error('Decode integrity: '+entry.id);const tile=validateTile(JSON.parse(raw),entry);tiles.set(tile.id,{bounds:tile.bounds,grid:tile.grid});
 for(const f of tile.features){if(seen.has(f.id))continue;seen.add(f.id);counts[f.kind]=(counts[f.kind]??0)+1;if(f.polygon||f.points.length<2)continue;const length=f.points.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-f.points[i][0],p[1]-f.points[i][1]),0)/1000;kilometres[f.kind]=(kilometres[f.kind]??0)+length;if(f.kind==='road')for(const mode of ['foot','car']){const a=admitFeature(f.tags,mode,manifest.accessDefaults),key=mode+':'+(a.ok?'eligible-by-metadata':a.reason);reasons[key]=(reasons[key]??0)+length;}}
 if(tiles.size%100===0)console.log('AUDIT',tiles.size,'/',manifest.tiles.length);
}
for(const entry of manifest.tiles){const tile=tiles.get(entry.id),n=tile.grid.size;for(const [dx,dy,side]of [[1,0,'east'],[0,1,'north']]){const other=tiles.get(`${entry.x+dx}:${entry.y+dy}`);if(!other)continue;let max=0;for(let i=0;i<n;i++){const a=tile.grid.heights[side==='east'?i*n+n-1:(n-1)*n+i],b=other.grid.heights[side==='east'?i*n:i];max=Math.max(max,Math.abs(a-b));}seams.push({a:entry.id,b:`${entry.x+dx}:${entry.y+dy}`,maxHeightDifferenceM:max});if(max>1e-9)failures.push(seams.at(-1));}}
const result={method:'Every published compressed tile decoded, checksum/length/schema/finite heights checked. Shared 128 m lattice edges compared. Counts de-duplicate stable source IDs. Eligibility is a metadata policy, NOT proof of physical traversability.',tiles:tiles.size,expected:manifest.tiles.length,communes:manifest.communes.length,coverage:manifest.coverage,uniqueFeatures:counts,fullImportedFeatureKm:kilometres,roadPolicyKm:reasons,seamPairs:seams.length,seamFailures:failures.length,maxSeamDifferenceM:Math.max(0,...seams.map(s=>s.maxHeightDifferenceM)),seams,failures,manifestSha256:sha(await readFile(base+'/manifest.json')),limitations:['Lengths here include complete source ways at the border; coverage.json has administratively clipped source totals.','No departmental native traversal or visual/collision guarantee is inferred from a seam audit.','Pilot-to-department seam is a separate unresolved audit.']};
await mkdir('docs/mission-26-evidence',{recursive:true});await writeFile('docs/mission-26-evidence/tile-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,seams:undefined},null,2));
if(failures.length)process.exitCode=1;
