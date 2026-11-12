export class InputController {
 private keys=new Set<string>();private gesture={x:0,y:0};private pointer:number|null=null;private origin={x:0,y:0};private lifecycle=new AbortController();touchRunning=false;
 constructor(private canvas:HTMLCanvasElement,private blocked:()=>boolean=()=>false){
  const options={signal:this.lifecycle.signal};
  addEventListener('keydown',e=>{if(((e.target as HTMLElement)?.closest('button')&&[' ','Enter'].includes(e.key))||this.blocked()||(e.target as HTMLElement)?.closest('input,select,summary,textarea,[contenteditable="true"]'))return;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();this.keys.add(e.key.toLowerCase())},options);
  addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()),options);addEventListener('blur',()=>this.clear(),options);
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||e.clientX>innerWidth*.5||this.pointer!==null||this.blocked())return;this.pointer=e.pointerId;this.origin={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault()},options);
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==this.pointer)return;const dx=e.clientX-this.origin.x,dy=this.origin.y-e.clientY,length=Math.hypot(dx,dy),scale=Math.min(1,Math.max(0,(length-7)/58))/Math.max(1,length);this.gesture.x=dx*scale;this.gesture.y=dy*scale;e.preventDefault()},options);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if((e as PointerEvent).pointerId===this.pointer)this.reset()},options);
 }
 ownsPointer(id:number){return this.pointer===id}
 private reset(){this.pointer=null;this.gesture.x=this.gesture.y=0}
 clear(){this.keys.clear();this.reset()}
 get running(){return this.keys.has('shift')||(this.pointer!==null&&this.touchRunning)}
 getVector(){if(this.blocked())return {forward:0,strafe:0};const k=this.keys,f=Number(k.has('w')||k.has('z')||k.has('arrowup'))-Number(k.has('s')||k.has('arrowdown')),s=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('q')||k.has('arrowleft'));return {forward:Math.max(-1,Math.min(1,f+this.gesture.y)),strafe:Math.max(-1,Math.min(1,s+this.gesture.x))}}
 dispose(){this.clear();this.lifecycle.abort()}
}
