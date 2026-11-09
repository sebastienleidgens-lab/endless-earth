// Material interpretations, not additional surveyed geography.
export const ROAD_STYLES=Object.freeze({
 1:{name:'asphalt',color:0x898d89,priority:60},
 2:{name:'setts',color:0xa4a08f,priority:50},
 3:{name:'earth',color:0xa49a7f,priority:40},
 4:{name:'gravel',color:0xa6a28f,priority:45},
 5:{name:'unknown',color:0x9c998b,priority:30},
 6:{name:'rural-unknown',color:0xa39b83,priority:20}
});
export function roadStyle(tags){
 const surface=String(tags.surface??'');
 if(['asphalt','concrete','concrete:plates'].includes(surface))return 1;
 if(['sett','unhewn_cobblestone','cobblestone','paving_stones'].includes(surface))return 2;
 if(['dirt','earth','ground','unpaved','grass'].includes(surface))return 3;
 if(['gravel','fine_gravel','compacted','pebblestone'].includes(surface))return 4;
 return ['track','path','footway','steps','cycleway'].includes(String(tags.highway))?6:5;
}
export function roadWidth(tags){
 const raw=typeof tags.width==='string'?tags.width.trim():tags.width;
 const parsed=typeof raw==='number'?raw:typeof raw==='string'&&/^\d+(?:\.\d+)?(?:\s*m)?$/.test(raw)?Number.parseFloat(raw):NaN;
 return Number.isFinite(parsed)&&parsed>0?{metres:Math.min(30,parsed),estimated:false}:{metres:['path','footway','steps','cycleway'].includes(tags.highway)?2.5:5.5,estimated:true};
}
