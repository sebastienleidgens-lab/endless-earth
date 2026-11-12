// Appearance data only. Observed families win over a regional default.
export const FRENCH_REGIONS=Object.freeze(['poitou','atlantic','mediterranean']);
export function frenchRegion(id='poitou'){if(!FRENCH_REGIONS.includes(id))throw new RangeError('Unknown material context');return id}
export function resolveFrenchFamily(family,mapped,region='poitou'){
 frenchRegion(region);
 const known={roof:{slate:'slate',clay:'clay',tile:'clay',tiles:'clay',metal:'metal',wood:'wood'},wall:{stone:'stone',limestone:'stone',sandstone:'stone',granite:'granite',plaster:'plaster',render:'plaster',wood:'wood',brick:'brick'}};
 if(mapped)return {family:known[family]?.[mapped]??'unknown',basis:'local documented tag',sourceTag:mapped};
 return {family:family==='roof'?(region==='atlantic'?'slate':'clay'):family==='wall'?(region==='atlantic'?'granite':'stone'):'unknown',basis:'regional interpretation; local material unknown'};
}
export function validateFranceCatalogue(c){
 if(c?.schema!=='endless-earth-france-materials-v1'||c.tilePixels!==128||c.gutterPixels!==8||c.columns!==3||c.gpuChannels!==2||c.packs?.length!==3)throw Error('Invalid French material catalogue');
 const seen=new Set();
 for(const p of c.packs){
  frenchRegion(p.id);if(seen.has(p.id)||p.file!==p.id+'.png'||!/^[a-f0-9]{64}$/.test(p.sha256)||!Number.isInteger(p.bytes)||p.bytes<=0||p.bytes>600000||p.dimensions?.join()!==(p.id==='atlantic'?'432,432':'432,288')||p.entries?.length!==(p.id==='atlantic'?7:6))throw Error('Invalid French context pack');
  seen.add(p.id);
  for(const [i,e] of p.entries.entries())if(e.slot!==i||e.license!=='CC0-1.0'||e.metres?.length!==2||!e.metres.every(v=>Number.isFinite(v)&&v>.1&&v<50)||!Number.isFinite(e.reliefM)||e.reliefM<0||e.reliefM>.03)throw Error('Invalid French source binding');
 }
 return c;
}
