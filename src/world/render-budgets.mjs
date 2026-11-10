// Rendering/work policies share identical geographic sources and anchors.
export const RENDER_BUDGETS=Object.freeze({eco:{installMs:.5,prefetchM:48},balanced:{installMs:.8,prefetchM:72},quality:{installMs:1.2,prefetchM:96},custom:{installMs:.8,prefetchM:72}});
export function workBudget(profile='quality',frameMs=16,speed=0){const p=RENDER_BUDGETS[profile]??RENDER_BUDGETS.quality;return {installMs:frameMs>50?Math.min(.25,p.installMs):p.installMs,prefetchM:p.prefetchM+Math.min(160,Math.max(0,speed)*2),maxNetwork:2,maxReady:2,maxInstalls:1};}
