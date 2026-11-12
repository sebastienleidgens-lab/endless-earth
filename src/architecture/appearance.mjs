// Stable decorative identity, separate from the existing geometric seed.
const hash=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
export function buildingAppearance(seed,tags,style){
 const n=hash('materials-v2:'+seed),wallTag=String(tags['building:material']??''),roofTag=String(tags['roof:material']??'');
 const facadeKinds={stone:0,limestone:0,sandstone:0,granite:style.facade?.regionalGranite?8:5,plaster:1,render:1,concrete:1,wood:4,timber:4,brick:5,metal:5};
 const roofKinds={clay:2,tile:2,tiles:2,roof_tiles:2,slate:3,wood:4,timber:4,metal:5,zinc:5,copper:5,concrete:5,thatch:5};
 let facadeKind=wallTag?(facadeKinds[wallTag]??5):seed%(style.facade?.plasterEvery??3)===0?1:0;
 // Synthetic Atlantic validation only: observed wall tags always take priority.
 if(!wallTag&&facadeKind===0&&style.facade?.regionalGranite)facadeKind=8;
 const roofKind=roofKinds[roofTag||style.roof?.defaultMaterial||'clay']??5;
 return {facadeKind,roofKind,door:n%(style.details?.doors.length??1),frame:(n>>>4)%(style.details?.frames.length??1),glass:(n>>>8)%(style.details?.glass.length??1),wallTone:1+(((n>>>12)%101)/100-.5)*(style.facade?.variation??.08),roofTone:1+(((n>>>19)%101)/100-.5)*(style.roof?.variation??.1),uv:[(n%97)/97,((n>>>7)%89)/89],provenance:{wall:wallTag?'OSM material tag':'regional interpretation; material unknown',roof:roofTag?'OSM material tag':'regional interpretation; material unknown',details:'procedural, not surveyed'}};
}
