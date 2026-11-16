/** Geographic truth, inferred geometry and simulation are separate contracts. */
export type Datum='IGN69'|'EGM2008'|'WGS84-ellipsoid'|'unknown';
export interface GeoPosition {lat:number;lon:number;height:number;datum:Datum}
export interface Provenance {source:string;license:string;retrievedAt:string;sha256:string;precisionM:number|null;confidence:'high'|'medium'|'low';inferred:boolean}
export type Layer='elevation'|'landcover'|'hydro'|'road'|'rail'|'aviation'|'building';
export interface TileEntry {id:string;x:number;y:number;bounds:number[];url:string;sha256:string;bytes:number;decodedBytes:number;coverageM2:number;quality:string}
export interface RegionManifest {schema:'planet-region-v1';id:string;name:string;projection:{type:string;code:string;origin?:{lat:number;lon:number}};verticalDatum:Datum;tileSize:number;sampleStep:number;stations?:string|null;overview?:string|null;navigation?:string|null;boundary:unknown;communes:Array<{code:string;name:string;lon:number;lat:number}>;tiles:TileEntry[];sources:Record<string,Provenance>;accessDefaults:Record<string,unknown>;coverage:{areaM2:number;preparedM2:number;fraction:number;nodata:number};budgets:Record<string,unknown>}
export interface ElevationProvider {sample(easting:number,northing:number):{height:number;datum:Datum;normal:{x:number;y:number;z:number};tile:string;source:Provenance}|null}
export interface FeatureProvider {query(bounds:number[]):Iterable<unknown>;revision:string}
export interface LandCoverProvider extends FeatureProvider {}
export interface HydroProvider extends FeatureProvider {navigable(id:string):boolean}
export interface RoadProvider extends FeatureProvider {}
export interface RailProvider extends FeatureProvider {}
export interface AviationProvider extends FeatureProvider {}
export interface BuildingProvider extends FeatureProvider {}
export interface BiomeResolver {at(lat:number,lon:number,height:number):{habitat:string;confidence:string}}
export interface ClimateProvider {at(position:GeoPosition,time:number):unknown}
export interface TrafficProvider {update(time:number,nearby:GeoPosition):void;dispose():void}
export interface NavGraphProvider {route(from:GeoPosition,to:GeoPosition,mode:string):{points:GeoPosition[];distance:number}|null}
export interface MapDataProvider {region:RegionManifest;features(bounds:number[],zoom:number,layers:Set<Layer>):Iterable<unknown>}
export interface WorldTileManager {demand(ids:Array<{id:string;priority:number}>):void;readonly resident:Map<string,unknown>;dispose():void}
