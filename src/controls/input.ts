export class InputController {
  private keys = new Set<string>();
  private joystick = { x: 0, y: 0 };
  private pointer: number | null = null;
  private base: HTMLElement;
  private knob: HTMLElement;
  constructor() {
    this.base = document.createElement('div');
    this.base.className = 'joystick';
    this.base.setAttribute('aria-label', 'Joystick de déplacement');
    this.knob = document.createElement('div');
    this.knob.className = 'joystick-knob';
    this.base.appendChild(this.knob);
    document.body.appendChild(this.base);
    window.addEventListener('keydown', e => {
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.reset(); });
    const move = (e: PointerEvent) => {
      if (this.pointer !== e.pointerId) return;
      const r = this.base.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
      const limit = r.width * .34;
      const len = Math.hypot(dx,dy), k = len > limit ? limit/len : 1;
      this.joystick.x = dx*k/limit; this.joystick.y = -dy*k/limit;
      this.knob.style.transform = `translate(${dx*k}px,${dy*k}px)`;
    };
    this.base.addEventListener('pointerdown', e => { e.preventDefault(); this.pointer=e.pointerId; this.base.setPointerCapture(e.pointerId); move(e); });
    this.base.addEventListener('pointermove', move);
    this.base.addEventListener('pointerup', () => this.reset());
    this.base.addEventListener('pointercancel', () => this.reset());
    this.base.addEventListener('lostpointercapture', () => this.reset());
  }
  private reset() { this.pointer=null; this.joystick.x=0; this.joystick.y=0; this.knob.style.transform='translate(0,0)'; }
  get running() { return this.keys.has('shift'); }
  getVector() {
    const k=this.keys;
    const f=Number(k.has('w')||k.has('z')||k.has('arrowup'))-Number(k.has('s')||k.has('arrowdown'));
    const s=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('q')||k.has('arrowleft'));
    return { forward: Math.max(-1,Math.min(1,f+this.joystick.y)), strafe: Math.max(-1,Math.min(1,s+this.joystick.x)) };
  }
}
