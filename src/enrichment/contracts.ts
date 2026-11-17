/** Versioned plans carry provenance; they grant no physical access. */
export type EvidenceStatus = 'observed'|'source-derived'|'inferred'|'procedural-decorative'|'unverified'|'restricted';
export interface RegionalEnrichmentPack {
  schema:'regional-enrichment-pack-v1'; id:string; version:string; license:string;
  fixture:boolean; climate:{regime:string; hemisphere:'north'|'south'|'equatorial'; seasonModel:string};
  architecture:{defaultLevels:number; facadeSpacing:number; roofRiseRatio:number; palettes:Array<Record<string,string|number>>};
  habitats:Array<{id:string;match:Record<string,string>;density:number;kinds:string[];riparianKinds?:string[];maxSlope?:number;edgeOnly?:boolean}>;
  detailSpacing:number; corridorSpacing?:number; maxDetails:number;
}
export interface DecorativeDetail {
  id:string; owner:string; kind:'grass'|'fern'|'reed'|'stone'|'deadwood';
  x:number; y:number; scale:number; rotation:number; phase:number; heightOffset:number;
  habitat:string; sourceId:string; collision:false; clusterId?:string; provenance:Record<string,string>;
}
export interface ArchitecturePlan {
  id:string; sourceId:string; worldObjectId:string; version:'world-enrichment-v1';
  family:string; seed:number; height:number; totalHeight:number; levels:number;
  roof:{type:'flat'|'gabled'|'hipped';height:number;color:number};
  palette:Record<string,string|number>; facadeSpacing:number;windowWidth:number;windowHeight:number;doorEdge:number;shutters:boolean;
  status:EvidenceStatus;provenance:Record<string,string>;warnings:string[];
}
export interface EnrichmentArtifact {
  schema:'world-enrichment-v1';tileId:string;bounds:number[];pack:RegionalEnrichmentPack;
  coordinateNamespace:string; buildings:ArchitecturePlan[];details:DecorativeDetail[];
  audit:Record<string,unknown>;warnings:Array<Record<string,string>>;
}
