export type Vec3={x:number;y:number;z:number};
export interface SoundContext {
 environment?:{revision:number;commandRevision:number;manual:boolean};mixRevision?:number;
 version:1;geo:{lat:number;lon:number}|null;key:string;worldTimeMs:number|null;
 altitudeM:number|null;habitat:string;solarAltitude:number|null;
 localHour:number|null;timeBasis:'civil'|'mean-solar-estimate'|'unknown';season:string|null;
 weather:{wind:number;rain:number;cloud?:number;mist?:number;gust?:number}|null;
 position:Vec3;water:{distanceM:number;point:{x:number;z:number};provenance:string;kind?:string;weirDistanceM?:number|null;bankDistanceM?:number|null;centrelineDistanceM?:number|null;verticalDistanceM?:number|null}|null;emitters:{id:string;position:Vec3;habitat:string;geo:{lat:number;lon:number}}[];ground:{surface:string|null;material:string;basis:string;confidence:string}|null;influences:Record<string,number>;
 traffic?:{id:string;position:Vec3;distance:number;tags:Record<string,string>;interpreted:boolean}[];listener?:{position:Vec3;forward:Vec3};
 sources:{id:string;kind:string;position:Vec3;velocity?:Vec3}[];
 provenance:{geography:string;weather:string;region?:string};fixture:boolean;
}
export interface AudioAsset {file:string;bytes:number;sha256:string;duration:number;channels:number;sampleRate:number;source:string;provisional:boolean;license:string}
