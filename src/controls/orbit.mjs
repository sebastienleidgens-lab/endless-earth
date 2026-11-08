export const clampZoom=value=>Math.max(1.5,Math.min(15,value));
export function behind(yaw,heading,dt){return yaw+Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw))*(1-Math.exp(-dt*.8));}
