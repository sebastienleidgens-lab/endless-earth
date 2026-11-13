import {openForest,launch} from './mission-17b-browser.mjs';
export {launch};
export const inspection=`
import {forestSeason as m18Season} from '/endless-earth/src/nature/forest-life.mjs';
import {groundAppearance as m18Ground} from '/endless-earth/src/nature/surfaces.ts';
window.m18={
 choose(label,value){const s=document.querySelector('select[aria-label="'+label+'"]');s.value=String(value);s.dispatchEvent(new Event('change'));},
 step(dt=.1){updateAtmosphere(dt,quality==='low',dt);updateForestLife(scene);window.c15.tick()},
 absolute(date){dispatchEvent(new CustomEvent('nature-test-date',{detail:date}));this.choose('Moment de la journée','real');for(let i=0;i<30;i++)this.step(.1)},
 month(m){this.choose("Mois de l'année",m);this.step(.1)},
 state(){let forest=[],flowers=[];scene.traverse(o=>{const f=o.userData.forest,l=o.userData.forestLife;if(f)forest=f.items.filter((t,i)=>i%320===0||t.l.evergreen).slice(0,25).map(t=>({id:t.l.id,evergreen:t.l.evergreen,position:t.p,season:m18Season(l.uniforms.forestDay.value,t.dates,t.l.evergreen)}));if(o.userData.villageFlowers)flowers.push(o.userData.villageFlowers.season.value.toArray())});return {game:window.c15.snapshot(),forest,flowers,ground:m18Ground.earthGroundSeason.value.toArray(),wetness:m18Ground.earthWetness.value,snow:scene.userData.snow,glError:renderer.getContext().getError()};},
 collision(){return window.c15.collisions()},
 audio(){const forward=new THREE.Vector3();camera.getWorldDirection(forward);sound.listener(camera.position,forward,new THREE.Vector3(0,1,0));sound.update(avatar.position,0,0,yaw,scene.userData.climate,scene.userData.earthLife,scene.userData.lifeHabitat,lifeSettings.name,(x,z)=>activeTerrain.sample(x,z));return sound.stats()},
 shadow(on){if(on){landscapeLighting.invalidate();return}const light=scene.userData.landscapeLighting;this.savedBefore=scene.onBeforeRender;scene.onBeforeRender=()=>{};},
 render(){return window.c15.render()},
 beginWalk(){const route=routeAt(avatar.position,activeTerrain);walker.start(route);return {active:walker.active,route}},
};`;
export async function open18(browser,options={}){return openForest(browser,Number(options.port??5318),{...options,append:inspection+(options.append??'')})}
export async function settle18(page){for(let i=0;i<28;i++){await page.evaluate(()=>window.m18.step(.1));await page.waitForTimeout(35)}await page.evaluate(()=>window.m18.step(0))}
