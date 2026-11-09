// Explicit OSM semantics only. Unknown land never acquires an invented use.
export const COVER=Object.freeze({
 wood:{color:0x767b5d,priority:40},scrub:{color:0x8a916a,priority:45},
 meadow:{color:0x929b70,priority:30},farmland:{color:0xa89c76,priority:35},
 orchard:{color:0x929572,priority:36},garden:{color:0x8b9673,priority:50},
 wetland:{color:0x7d8973,priority:55},rock:{color:0xb3ad9a,priority:60},
 built:{color:0xaaa18e,priority:70}
});
export function coverClass(t){
 if(t.building||t.natural==='water'||t.water||t.highway)return null;
 if(t.natural==='wood'||t.landuse==='forest')return 'wood';
 if(t.natural==='scrub')return 'scrub';
 if(t.natural==='wetland')return 'wetland';
 if(['bare_rock','scree','shingle'].includes(t.natural))return 'rock';
 if(['farmland','farmyard'].includes(t.landuse))return t.landuse==='farmyard'?'built':'farmland';
 if(t.landuse==='orchard')return 'orchard';
 if(t.leisure==='garden'||t.landuse==='allotments')return 'garden';
 if(t.natural==='grassland'||['meadow','grass','village_green'].includes(t.landuse)||t.leisure==='park')return 'meadow';
 if(['residential','industrial','commercial','retail'].includes(t.landuse))return 'built';
 return null;
}
export function insideRing(x,z,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)yes=!yes}return yes}
export function coverAt(x,z,features){
 let best=null;
 for(const f of features){const type=coverClass(f.tags);if(!type||best&&COVER[type].priority<=COVER[best].priority)continue;
  if(insideRing(x,z,f.rings[0])&&!f.rings.slice(1).some(r=>insideRing(x,z,r)))best=type;
 }return best;
}
