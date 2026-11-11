// Explicit synthetic local data. Regional appearance never changes these heights.
const box=(x,z,w,h)=>[{x,z},{x:x+w,z},{x:x+w,z:z+h},{x,z:z+h}];
export const FIXTURE_IDS=Object.freeze(['atlantic-village','mediterranean-rock']);
export function landscapeFixture(id='atlantic-village'){
 if(!FIXTURE_IDS.includes(id))throw new RangeError('Unknown synthetic fixture');
 const rocky=id==='mediterranean-rock',relief=rocky?8:3;
 const height=(x,z)=>Math.sin(x*.026)*relief*.55+Math.sin(z*.021)*relief*.4+x*.008;
 const buildings=[[-18,-37],[-18,-9],[10,-35],[11,1],[10,34]].map(([x,z],i)=>({tags:{building:'house',osm_id:'synthetic-building-'+i,height:String(7.6+i*.35),...(i===4?{'roof:material':'slate'}:{})},rings:[box(x,z,8,11)]}));
 const road={tags:{highway:'residential',width:'5.5',surface:'gravel'},line:[{x:0,z:-85},{x:0,z:85}]};
 const water={tags:{natural:'water',water:'pond'},rings:[box(-99,-70,48,13)]};
 const wood={tags:{natural:'wood'},rings:[box(-105,5,75,77)]};
 const meadow={tags:{landuse:'meadow'},rings:[box(25,-20,80,100)]};
 const rock={tags:{natural:'bare_rock'},rings:[box(rocky?28:68,-85,rocky?77:37,rocky?60:35)]};
 return {id,name:rocky?'Relief minéral et couvert ouvert':'Village tempéré et boisement',schema:'synthetic-landscape-v1',units:'metres',bounds:[-110,-90,110,90],provenance:'Original synthetic local geometry, not a real place or measured survey',defaultRegion:rocky?'mediterranean':'atlantic',height,buildings,road,water,wood,meadow,rock,features:[wood,meadow,rock,...buildings,road,water]};
}
