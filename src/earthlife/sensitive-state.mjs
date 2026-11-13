import * as THREE from 'three';
export const sensitiveUniforms={worldDew:{value:0},worldWet:{value:0},valleyMist:{value:new THREE.Vector4()},valleyTint:{value:new THREE.Color()}};
/** Veil rendering is local geometry; inactive mist never changes world shaders. */
export function sensitiveReceiver(s){Object.assign(s.uniforms,sensitiveUniforms)}
