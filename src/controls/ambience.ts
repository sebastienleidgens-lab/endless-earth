// Original synthesized wind; no recordings, downloads or implied field survey.
export function createAmbienceButton(root:HTMLElement){
  const button=document.createElement('button');button.textContent='Son : désactivé';
  button.className='quiet-control sound-control';
  let context:AudioContext|undefined,gain:GainNode|undefined,enabled=false;
  button.addEventListener('click',async()=>{
    if(!context){
      context=new AudioContext();gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);
      const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),data=buffer.getChannelData(0);
      let state=17;
      for(let i=0;i<data.length;i++){state=(Math.imul(state,1664525)+1013904223)|0;data[i]=(state/2147483648)*.2;}
      const noise=context.createBufferSource();noise.buffer=buffer;noise.loop=true;
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;
      noise.connect(filter);filter.connect(gain);noise.start();
    }
    await context.resume();enabled=!enabled;gain!.gain.setTargetAtTime(enabled?.12:0,context.currentTime,.6);
    button.textContent=enabled?'Son : vent discret':'Son : désactivé';button.setAttribute('aria-pressed',String(enabled));
  });
  document.addEventListener('visibilitychange',()=>{if(context){if(document.hidden)void context.suspend();else if(enabled)void context.resume();}});
  root.append(button);
}
