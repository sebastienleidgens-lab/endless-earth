/** Original deterministic foley, not a field recording or a species sample.
 * Buffers are generated once in the owner's existing AudioContext and reused.
 */
export function makeWaterBuffers(context){
  const buffers=new Map();
  for(const [kind,seconds]of [['entry',.65],['exit',.45],['stroke',.28],['paddle',.32],['wade',.2]]){
    for(let variant=0;variant<3;variant++){
      const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*seconds),context.sampleRate),data=buffer.getChannelData(0);
      let seed=251+variant*177+kind.length*991,low=0,body=0;
      for(let i=0;i<data.length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const noise=seed/2147483648-1,t=i/context.sampleRate,attack=1-Math.exp(-t*130),tail=Math.exp(-t*(kind==='entry'?8:15));
        low+=.17*(noise-low);body+=.025*(noise-body);
        const splash=(low-body)*.75,drop=Math.sin(t*(620+variant*90)-t*t*900)*Math.exp(-t*24)*.12;
        data[i]=(splash+drop)*attack*tail*(kind==='entry'?.9:.65);
      }
      buffers.set(kind+':'+variant,buffer);
    }
  }
  return buffers;
}
