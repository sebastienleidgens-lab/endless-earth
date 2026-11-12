export const CLOUD_HEIGHT=230;
// Slow internal billowing, independent of translation. Computed once per
// frame on the host and shared by sky and cloud-shadow receivers.
export function cloudMorph(time,out={}){out.x=Math.sin(time*.0028)*.35;out.y=Math.sin(time*.0019)*.32;out.z=Math.sin(time*.0031)*.28;return out}
export function cloudRawField(x,z,time,drift){const a=x-(drift?.x??time*1.32),b=z-(drift?.y??-time*.7125),m=cloudMorph(time);const field=.5+.24*Math.sin(a*.009+Math.sin(b*.007+m.x))+.16*Math.sin(b*.013-a*.004+m.y)+.10*Math.sin(a*.023+b*.016-m.z);return field;}
export function cloudField(x,z,time,cover,drift){const field=cloudRawField(x,z,time,drift);const edge=.84-cover*.53;const v=Math.max(0,Math.min(1,(field-edge)/.16));return v*v*(3-2*v);}
export function cloudShadow(x,z,y,time,cover,sun,drift){if(sun.y<=.08)return 0;return cloudField(x-(CLOUD_HEIGHT-y)*sun.x/Math.max(.2,sun.y),z-(CLOUD_HEIGHT-y)*sun.z/Math.max(.2,sun.y),time,cover,drift)*Math.min(1,(sun.y-.08)/.2);}
// Shared macro coverage. Fine sky detail is intentionally absent from the cheap
// vertex shadows; these are an atmospheric approximation, not a shadow map.
export const cloudGLSL=`
uniform vec2 lifeCloudDrift;
uniform vec3 lifeCloudMorph;
float lifeCloudField(vec2 p,float t){
 p-=lifeCloudDrift;
 float field=.5+.24*sin(p.x*.009+sin(p.y*.007+lifeCloudMorph.x))+.16*sin(p.y*.013-p.x*.004+lifeCloudMorph.y)+.10*sin(p.x*.023+p.y*.016-lifeCloudMorph.z);
 return field;
}
float lifeCloud(vec2 p,float t,float cover){
 return smoothstep(.84-cover*.53,1.-cover*.53,lifeCloudField(p,t));
}
`;
