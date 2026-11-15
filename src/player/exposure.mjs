/** Appearance follows the one shared climate and native simulation time. */
export class TravelerExposure{
 wetness=0;snow=0;mud=0;
 update(dt,climate,immersed=false){if(!Number.isFinite(dt)||dt<0)return this;dt=Math.min(dt,.25);const rain=Math.max(0,Math.min(1,climate?.weather?.rain??0)),temp=climate?.metrics?.temperatureC??climate?.weather?.temperatureC??12,wind=climate?.wind?.speed??.3;const target=immersed?1:rain*.8,rate=target>this.wetness?(immersed?2:.06):(.0012+Math.max(0,temp)*.00012+wind*.0004);this.wetness+=(target-this.wetness)*(1-Math.exp(-dt*rate));const snow=climate?.snow?.cover??0;this.snow+=(snow*(1-this.wetness)-this.snow)*(1-Math.exp(-dt*.04));return this;}
}
