const OPEN=new Set(['yes','designated','permissive']);
const CLOSED=new Set(['no','private','customers','permit','agricultural','forestry']);
/** Permission is independent of geometry. An attractive habitat never grants access. */
export function areaAccess(feature,mode='foot'){
 const t=feature?.tags??{};
 const result=(state,reason)=>({state,reason,source:feature?.id??null,provenance:'OSM explicit area access tags; not a cadastral or field survey'});
 if(!feature?.polygon||mode!=='foot')return result('unknown','not-a-documented-walking-area');
 if(['building','hydro','rail','aviation'].includes(feature.kind))return result('known-disallowed','incompatible-area');
 if(CLOSED.has(t.access)||CLOSED.has(t.foot))return result('known-disallowed','restricted-area');
 if(t['access:conditional']||t['foot:conditional'])return result('unknown','unresolved-conditional-access');
 if(OPEN.has(t.foot??t.access))return result('known-allowed','explicit-area-access');
 return result('unknown','unknown-land-access');
}
