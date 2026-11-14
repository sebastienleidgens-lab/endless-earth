import * as THREE from 'three';
// @ts-ignore Same runtime character implementation, no concept assets.
import {createVillageRender} from '../life/village-render.mjs';
// @ts-ignore Same identity and wardrobe implementation.
import {identity,wardrobe,AGES} from '../life/village-identity.mjs';
const scene=new THREE.Scene();scene.background=new THREE.Color(0xdce0d7);scene.add(new THREE.HemisphereLight(0xfff6df,0x6a7866,2));const light=new THREE.DirectionalLight(0xfff0dd,2.3);light.position.set(-3,5,6);scene.add(light);
const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.01,100);camera.position.set(2.3,1.45,3.4);camera.lookAt(0,.87,0);const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas')!,antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(devicePixelRatio);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshLambertMaterial({color:0xd0d5c9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);const model=createVillageRender(scene);let current=0,gray=false,g:any,time=3,walking=false;
const people=Array.from({length:28},(_,i)=>identity('mission22:gallery:'+i,AGES[i%7]));
function show(index:number){current=(index+people.length)%people.length;const p=people[current],c={temperatureC:current%3===0?3:current%3===1?17:27,rain:current%11===0?.6:0},person=p.age==='baby'?identity('mission22:guardian:'+current,'adult'):p;g={id:'gallery:'+current,kind:p.age==='baby'?'stroller':current===20?'cycle':'solo',state:walking?'walk':'activity',activity:current%5===0?'photo':'observe',members:[{person,outfit:wardrobe(person,c),position:{x:0,y:0,z:0},yaw:0,phase:0,distance:0,speed:0},...(p.age==='baby'?[{person:p,outfit:wardrobe(p,c),position:{x:0,y:0,z:.7}}]:[])]};document.querySelector('#caption')!.textContent=`${current+1} / 28 · ${p.age} · ${p.height.toFixed(2)} m · ${g.members[0].outfit.style}`;draw();}
function draw(){model.monochrome=gray;model.draw([g],time,()=>0);time+=3;model.draw([g],time,()=>0);renderer.render(scene,camera)}
document.querySelector('#next')!.addEventListener('click',()=>show(current+1));document.querySelector('#previous')!.addEventListener('click',()=>show(current-1));document.querySelector('#gray')!.addEventListener('click',()=>{gray=!gray;draw()});
Object.assign(window,{villageGallery:{show,draw,people,model,gray(value:boolean){gray=value;draw()},walk(value:boolean){walking=value;show(current)},state(){return {current,gray,person:people[current],outfit:g.members[0].outfit,stats:model.stats}}}});show(0);
