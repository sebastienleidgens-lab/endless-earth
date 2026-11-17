/** Idempotent composition also handles cloned, already customized materials. */
export function canonicalShader(source,fragment=false){
 source=source.replace(/\/\/ EE_ORIGIN_HELPERS_BEGIN[\s\S]*?\/\/ EE_ORIGIN_HELPERS_END\n/g,'');
 let prelude='uniform vec3 eeRenderOrigin;\n';
 const model=/\b(modelMatrix|eeCanonicalModel)\b/.test(source),view=/\b(viewMatrix|eeCanonicalView)\b/.test(source),camera=/\b(cameraPosition|eeCanonicalCamera)\b/.test(source);
 source=source.replace(/\bmodelMatrix\b/g,'eeCanonicalModel()').replace(/\bviewMatrix\b/g,'eeCanonicalView()').replace(/\bcameraPosition\b/g,'eeCanonicalCamera()');
 if(model)prelude+=(fragment?'uniform mat4 modelMatrix;\n':'')+'mat4 eeCanonicalModel(){mat4 m=modelMatrix;m[3].xyz+=eeRenderOrigin;return m;}\n';
 if(view)prelude+='mat4 eeCanonicalView(){mat4 m=viewMatrix;m[3]-=m*vec4(eeRenderOrigin,0.);return m;}\n';
 if(camera)prelude+='vec3 eeCanonicalCamera(){return cameraPosition+eeRenderOrigin;}\n';
 return '// EE_ORIGIN_HELPERS_BEGIN\n'+prelude+'// EE_ORIGIN_HELPERS_END\n'+source;
}
