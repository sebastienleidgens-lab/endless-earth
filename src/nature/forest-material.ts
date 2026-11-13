import * as THREE from 'three';
// @ts-ignore Existing climate owner and material lifecycle.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore Same continuous weather field, no second simulation.
import {windGLSL} from '../earthlife/wind.mjs';
// @ts-ignore Shared life model and exact colour/caster leaf gates.
import {forestSeasonGLSL,FOREST_COARSE_BEND} from './forest-life.mjs';
// @ts-ignore Structural profile switches only.
import {registerLifeMaterial} from '../earthlife/capabilities.mjs';

// Shared by colour and the coarse solar proxy. Ordered joint rotations preserve
// branch bases and leaf-spray roots while each level inherits its parent motion.
export const forestAttributes=`attribute vec4 natureTraits,forestForm,forestDates;
attribute float natureCluster;attribute vec3 forestData;
attribute float forestJointIndex;uniform highp usampler2D forestJoints;
uniform sampler2D forestWindField;uniform vec4 forestWindRect;uniform float forestDay,forestPreviousDay,forestSeasonBlend;
uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine;
`;
export const forestGLSL=`
vec4 forestVisualSeason(vec4 dates,float evergreen){
 vec4 target=forestSeasonAt(forestDay,dates,evergreen);
 if(forestSeasonBlend>.9999||evergreen>.5)return target;
 return mix(forestSeasonAt(forestPreviousDay,dates,evergreen),target,forestSeasonBlend);
}
vec3 forestShape(vec3 p,vec4 traits,vec4 form,vec3 data){
 float gain=clamp(p.y/3.,0.,1.);
 p.y+=form.x*data.x*smoothstep(.8,data.x*.45,p.y)*(1.-smoothstep(data.x*.65,data.x,p.y));
 p.xz*=mix(form.y,1.,smoothstep(.36,4.,dot(p.xz,p.xz)));
 float h=clamp(p.y/max(1.,data.x),0.,1.),turn=form.z*h;
 p.xz=vec2(p.x-turn*p.z,p.z+turn*p.x);
 p.x+=(traits.y-.5)*.7*h*h*gain;
 p.z+=(traits.x-.5)*.6*h*(1.2-h)*gain;
 return p;
}
vec4 forestJoint(int slot){int w=textureSize(forestJoints,0).x,at=int(forestJointIndex)*5+slot;return vec4(texelFetch(forestJoints,ivec2(at%w,at/w),0))/65535.;}
vec3 forestPivot(vec3 encoded){return encoded*64.-32.;}
vec2 forestLocal(vec2 w){vec2 x=(modelMatrix*vec4(instanceMatrix[0].xyz,0.)).xz,z=(modelMatrix*vec4(instanceMatrix[2].xyz,0.)).xz;return lifeInstanceWind(w,x,z);}
void forestRotate(inout vec3 p,inout vec3 n,vec3 pivot,vec3 axis,float gain){
 vec3 r=p-pivot,c=cross(axis,r);p=pivot+r+gain*c+.5*gain*gain*cross(axis,c);
 vec3 cn=cross(axis,n);n+=gain*cn+.5*gain*gain*cross(axis,cn);
}
void forestWindJoint(inout vec3 p,inout vec3 n,vec4 joint,vec2 w,float gain){if(joint.w>.005)forestRotate(p,n,forestPivot(joint.xyz),vec3(w.y,0.,-w.x),gain);}
vec3 forestPose(vec3 raw,inout vec3 n,vec4 season){
 vec3 p=raw;
 if(forestData.z>.5&&season.x<.999){vec3 leafRoot=forestJoint(3).xyz*64.-32.;p=leafRoot+(p-leafRoot)*max(.035,season.x);}

 #if LIFE_WIND_MODE == 1
 vec2 anchor=(modelMatrix*instanceMatrix[3]).xz;float size=forestWindRect.w;vec2 q=clamp((anchor-forestWindRect.xy)/forestWindRect.z,0.,1.);vec2 uv=(q*(size-1.)+.5)/size;uv.y*=.5;vec4 bank=texture2D(forestWindField,uv);vec2 w=forestLocal(mix(bank.xy,bank.zw,clamp(.52+forestData.y*.20,0.,1.)));float gain=forestData.y*forestForm.w*lifeVegetation;
 n.y-=${FOREST_COARSE_BEND*2}*p.y*gain*dot(w,n.xz);p.xz+=w*(${FOREST_COARSE_BEND}*p.y*p.y*gain);
 #elif LIFE_WIND_MODE == 2
 vec4 forestPrimary=forestJoint(0);vec2 lifeAnchor=(modelMatrix*instanceMatrix[3]).xz;
 float size=forestWindRect.w;vec2 q=clamp((lifeAnchor-forestWindRect.xy)/forestWindRect.z,0.,1.);vec2 uv=(q*(size-1.)+.5)/size;uv.y*=.5;
 vec4 bank=texture2D(forestWindField,uv);vec2 rootWind=forestLocal(bank.xy),branchWind=forestLocal(mix(bank.xy,bank.zw,clamp(.52+forestData.y*.20+forestPrimary.w*.12,0.,1.)));
 float gain=forestData.y*forestForm.w*lifeVegetation;
 #if LIFE_WIND_MODE == 2
 vec4 forestSecondary=forestJoint(1),forestTwig=forestJoint(2);
 vec4 fine=texture2D(forestWindField,uv+vec2(0.,.5));vec2 secondaryWind=forestLocal(mix(bank.zw,fine.xy,clamp(.60+forestData.y*.14+forestSecondary.w*.12,0.,1.))),twigWind=forestLocal(mix(bank.zw,fine.xy,clamp(.64+forestData.y*.14+forestTwig.w*.12,0.,1.)));
 if(forestData.z>.5){float phase=natureCluster*37.+natureTraits.x*19.,rate=(4.1+forestData.y)*(.88+natureTraits.x*.26);float wave=sin(lifeTime*rate+phase)+.38*sin(lifeTime*rate*1.618+phase*1.37);float angle=wave*min(.12,length(fine.zw)*.14*forestData.y)*lifeFine*forestForm.w*lifeVegetation;
  forestRotate(p,n,forestPivot(forestJoint(3).xyz),normalize(forestJoint(4).xyz*2.-1.),angle);
 }
 forestWindJoint(p,n,forestTwig,twigWind,.05*gain*(.91+.09*sin(lifeTime*2.4*(.88+natureTraits.x*.26)+forestTwig.w*29.)));
 forestWindJoint(p,n,forestSecondary,secondaryWind,.035*gain*(.92+.08*sin(lifeTime*1.3*(.88+natureTraits.x*.26)+forestSecondary.w*41.)));
 #endif
 forestWindJoint(p,n,forestPrimary,branchWind,.018*gain*(.86+forestPrimary.w*.14));
 forestRotate(p,n,vec3(0.),vec3(rootWind.y,0.,-rootWind.x),.006*gain/(1.+forestData.x*.08+natureTraits.y*.3+forestForm.y*.4));
 #endif
 return forestShape(p,natureTraits,forestForm,forestData);
}
`;
export function forestMaterial(calendar:{value:THREE.Vector4},atlas:THREE.Texture|null,far=false,life?:any,merged=false){
 const leaf=!!atlas,m=new THREE.MeshLambertMaterial({vertexColors:true,side:leaf?THREE.DoubleSide:THREE.FrontSide,map:atlas,alphaTest:leaf?.38:0});
 m.userData.forestSnow=true;
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,lifeUniforms,life?.uniforms??{});
  s.vertexShader=forestAttributes+'varying vec4 vForestTraits,vForestSeason;varying float vForestCluster,vForestPart;varying vec3 vForestPosition,vForestWorld;varying vec3 vForestAnchor;varying vec2 vForestSnow;\n'+windGLSL+forestSeasonGLSL+forestGLSL+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   vForestTraits=natureTraits;vForestCluster=natureCluster;vForestPart=forestData.z;vForestPosition=position;
   vForestSeason=forestVisualSeason(forestDates,natureTraits.z);
   vec3 forestPosition=forestPose(position,objectNormal,vForestSeason);vec2 forestRoot=(modelMatrix*instanceMatrix[3]).xz;
   float forestRange=1.-smoothstep(950.,1050.,length(forestRoot-cameraPosition.xz));vForestAnchor=vec3(forestRoot,forestRange);
   vForestWorld=vec3(0.);if(natureTraits.w>1.5||forestRange<.9999)vForestWorld=(modelMatrix*(instanceMatrix*vec4(forestPosition,1.))).xyz;
   float top=clamp(position.y/max(1.,forestData.x),0.,1.);
   vForestSnow=vec2(mix(1.,.18+.82*smoothstep(.25,.92,top),vForestSeason.y),mix(forestData.z>.5?.45:.85,1.3,natureTraits.z));`);
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','vec3 transformed=forestPosition;');
  s.fragmentShader='varying vec4 vForestTraits,vForestSeason;varying float vForestCluster,vForestPart;varying vec3 vForestPosition,vForestWorld;varying vec3 vForestAnchor;\n'+forestSeasonGLSL+s.fragmentShader;
  // The packed trait uses an integer only during a bounded LOD crossfade;
  // its fraction retains the original leaf density. No extra vertex location.
  s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
   float rangeCoverage=vForestAnchor.z;
   if(vForestTraits.w>1.5||rangeCoverage<.9999){
    vec3 ray=vForestWorld-cameraPosition;vec2 origin=vForestAnchor.xy-cameraPosition.xz;
    bool useX=abs(origin.x)>abs(origin.y);float denominator=useX?ray.x:ray.z;
    float planeT=(useX?origin.x:origin.y)/(abs(denominator)>1e-8?denominator:1e-8);
    vec3 planePoint=cameraPosition+ray*planeT;
    vec2 cell=floor(vec2(planePoint.y,useX?planePoint.z:planePoint.x)*24.);
    float noise=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);
    if(noise>=rangeCoverage)discard;
    if(vForestTraits.w>1.5){float k=floor(vForestTraits.w)-2.,progress=floor(k*.5)/255.,side=mod(k,2.);if((side>.5&&noise>=progress)||(side<.5&&noise<progress))discard;}
   }`);
  if(leaf)s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec4 forestArt=vec4(1.);if(vForestPart>.5){forestArt=texture2D(map,vMapUv);diffuseColor.rgb*=forestArt.rrr;float density=vForestTraits.w<1.5?vForestTraits.w:fract(vForestTraits.w);diffuseColor.a*=forestLeafAlpha(forestArt,vForestSeason,vForestCluster,vForestTraits.z,density);}`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   ${leaf?`if(vForestPart>.5){if(vForestTraits.z<.5){
    float rank=forestArt.g;
    float warm=clamp((vForestSeason.z-rank*.28)*(.75+vForestTraits.y*.55),0.,1.);
    vec3 gold=mix(vec3(3.4,1.65,.28),vec3(3.7,.74,.16),fract(vForestTraits.x+rank*.41));
    diffuseColor.rgb*=mix(vec3(1.06,1.10,.84),vec3(1.),vForestSeason.x);
    diffuseColor.rgb*=mix(vec3(1.),gold,warm);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.24,.14,.07),vForestSeason.w*(1.-vForestSeason.x));
   }}`:''}
   ${!leaf||merged?`if(vForestPart<.5){float grain=sin(vForestPosition.y*3.+sin(vForestPosition.x*43.+vForestPosition.z*39.)*1.8);diffuseColor.rgb*=.93+.07*grain;}`:''}`);
  if(leaf)s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','if(vForestPart>.5)outgoingLight+=diffuseColor.rgb*lifeDay*.12;\n#include <opaque_fragment>');
 };
 m.userData.coarseSolarReceiver=far;m.customProgramCacheKey=()=>`forest-19-${leaf}-${far}-${merged}`;cloudReceiver(m);registerLifeMaterial(m,{foliage:true,forest:true,far});return m;
}
