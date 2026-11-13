// Physical role and legal access are separate from rendered surface material.
export function roadCategory(tags={}){
 const highway=String(tags.highway??''),restriction=tags.motorcar??tags.motor_vehicle??tags.vehicle??tags.access;
 const conditional=!!(tags['motorcar:conditional']||tags['motor_vehicle:conditional']||tags['vehicle:conditional']||tags['access:conditional']);
 const carAccess=conditional?'conditional':['no','private','agricultural','forestry','delivery','destination'].includes(restriction)?'restricted':['yes','permissive','designated'].includes(restriction)?'permitted':['motorway','motorway_link','trunk','primary','secondary','tertiary','residential','unclassified','living_street','service'].includes(highway)?'plausible':'unknown';
 const role=highway==='steps'?'stairs':['path','footway','pedestrian','cycleway','bridleway'].includes(highway)?'pedestrian':['motorway','motorway_link','trunk','primary','secondary','tertiary','residential','unclassified','living_street','service'].includes(highway)?'carriageway':'unknown';
 return {category:tags.bridge&&tags.bridge!=='no'?'bridge':role,role,carAccess,surface:tags.surface??null,width:tags.width??null,confidence:carAccess==='plausible'?'OSM road class; no explicit motor permission observed':'OSM tags; unknown remains unknown'};
}
