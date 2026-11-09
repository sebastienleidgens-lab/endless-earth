import {roadUniforms,roadShaderPrelude,roadColorShader,roadNormalShader,type RoadEdges} from '../world/road-material';
import * as THREE from 'three';
export const environmentalTime={value:0},environmentalWind={value:.35};
// Shared original 64² noise atlas: fixed CPU generation, mipmapped on the GPU.
const pixels=new Uint8Array(64*64*4);
for(let z=0;z<64;z++)for(let x=0;x<64;x++){const i=(z*64+x)*4,n=Math.sin(x*127.1+z*311.7)*43758.5453;pixels[i]=Math.floor((n-Math.floor(n))*255);pixels[i+1]=Math.floor(128+Math.sin(x*.37+Math.sin(z*.23))*40+Math.cos(z*.31-x*.12)*30);pixels[i+2]=pixels[i];pixels[i+3]=255;}
const soilTexture=new THREE.DataTexture(pixels,64,64);soilTexture.wrapS=soilTexture.wrapT=THREE.RepeatWrapping;soilTexture.minFilter=THREE.LinearMipmapLinearFilter;soilTexture.magFilter=THREE.LinearFilter;soilTexture.generateMipmaps=true;soilTexture.needsUpdate=true;
export function groundDetail(material:THREE.MeshLambertMaterial,roads=false,edges:RoadEdges|null=null){
 material.onBeforeCompile=s=>{
  s.uniforms.natureSoil={value:soilTexture};
  if(roads){Object.assign(s.uniforms,roadUniforms);if(edges){
   s.uniforms.roadEdges={value:edges.texture};s.uniforms.roadEdgeOrigin={value:new THREE.Vector2(...edges.manifest.origin)};
   s.uniforms.roadEdgeExtent={value:new THREE.Vector2(...edges.manifest.extent)};s.uniforms.roadEdgeRange={value:edges.manifest.range};
  }}
  s.vertexShader=(roads?'attribute float earthRoad; attribute float earthShoulder; varying float earthRoadType; varying float earthShoulderRegion;\n':'')+'varying vec3 naturePosition;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnaturePosition=position;'+(roads?'earthRoadType=earthRoad;earthShoulderRegion=earthShoulder;':''));
  s.fragmentShader=(roads?'varying float earthRoadType; varying float earthShoulderRegion;\n'+roadShaderPrelude+(edges?'#define ROAD_EDGES\nuniform sampler2D roadEdges;uniform vec2 roadEdgeOrigin;uniform vec2 roadEdgeExtent;uniform float roadEdgeRange;\n':''):'')+'uniform sampler2D natureSoil; varying vec3 naturePosition;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=naturePosition.xz;
   vec4 soilA=texture2D(natureSoil,p*.017);
   vec4 soilB=texture2D(natureSoil,mat2(.8,.6,-.6,.8)*p*.0113+vec2(.37,.13));
   float groundPatch=(soilA.g+soilB.g)*.5-.5;
   float groundMineral=(soilA.r+soilB.r)*.5-.5;
   float nearDetail=1.0-smoothstep(8.0,65.0,vViewPosition.z);
   float grain=0.0; if(nearDetail>.001${roads?'&&earthRoadType<.5':''})grain=texture2D(natureSoil,p*1.7).r-.5;
   diffuseColor.rgb *= .98+groundPatch*.17+grain*.07*nearDetail;
   ${roads?roadColorShader:''}`);
  if(roads)s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+roadNormalShader);
 };
 material.customProgramCacheKey=()=> roads?'nature-ground-mineral-v3-'+!!edges:'nature-ground-atlas-v3';
}
export function waterMaterial(){const material=new THREE.MeshLambertMaterial({color:0x608884,side:THREE.DoubleSide});material.userData.natureShared=true;material.onBeforeCompile=s=>{s.uniforms.natureTime=environmentalTime;s.uniforms.natureWind=environmentalWind;s.vertexShader='varying vec3 waterPosition;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwaterPosition=position;');s.fragmentShader='uniform float natureTime; uniform float natureWind; varying vec3 waterPosition;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float ripple=sin(waterPosition.x*.9+waterPosition.z*.55+natureTime*.55)*sin(waterPosition.z*1.3-waterPosition.x*.3+natureTime*.31);
 float calm=sin(waterPosition.x*.019+waterPosition.z*.027)*.5+.5;
 diffuseColor.rgb *= .91+ripple*(.035+natureWind*.045)+calm*.08;
 vec3 waterNormal=viewMatrix[1].xyz;
 float grazing=1.0-abs(dot(normalize(vViewPosition),waterNormal));grazing=grazing*grazing*grazing;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.55,.65,.67),grazing*.16);`)};material.customProgramCacheKey=()=> 'anglin-ripples-v3';return material}
