export type Vec3={x:number;y:number;z:number};
export interface SoundContext {
 version:1;geo:{lat:number;lon:number}|null;key:string;worldTimeMs:number|null;
 altitudeM:number|null;habitat:string;solarAltitude:number|null;
 localHour:number|null;timeBasis:'civil'|'mean-solar-estimate'|'unknown';season:string|null;
 weather:{wind:number;rain:number;cloud?:number;mist?:number}|null;
 position:Vec3;influences:Record<string,number>;
 sources:{id:string;kind:string;position:Vec3;velocity?:Vec3}[];
 provenance:{geography:string;weather:string;region?:string};fixture:boolean;
}
export interface AudioAsset {file:string;bytes:number;sha256:string;duration:number;channels:number;sampleRate:number;source:string;provisional:boolean;license:string}
