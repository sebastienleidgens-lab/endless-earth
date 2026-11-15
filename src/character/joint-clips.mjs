// Original articulated lower-body keys: phase, thigh, knee, world foot pitch.
// These are the base animation, before contact locking/terrain correction.
const clips=[
 [[0,-.35,.12,0],[.18,-.12,.20,0],[.43,.22,.12,.18],[.61,.40,.35,.85],[.77,-.10,.95,-.14],[.92,-.55,.90,-.08],[1,-.35,.12,0]],
 [[0,-.50,.35,-.02],[.13,-.15,.40,0],[.30,.30,.35,.22],[.43,.50,.50,.8],[.62,.05,1.25,-.32],[.82,-.85,1.25,-.18],[1,-.50,.35,-.02]],
 [[0,-.52,.35,-.04],[.12,-.15,.45,0],[.25,.35,.40,.24],[.34,.55,.55,.9],[.52,.05,1.40,-.44],[.73,-.95,1.55,-.30],[.90,-.70,.65,-.08],[1,-.52,.35,-.04]]
];
function sample(keys,q,out){q=((q%1)+1)%1;let i=1;while(i<keys.length-1&&q>keys[i][0])i++;const a=keys[i-1],b=keys[i],x=(q-a[0])/(b[0]-a[0]),t=x*x*(3-2*x);out.thigh=a[1]+(b[1]-a[1])*t;out.shin=a[2]+(b[2]-a[2])*t;out.footPitch=a[3]+(b[3]-a[3])*t;return out;}
export function sampleJointPose(q,run,out={},scratch={}){const t=Math.max(0,Math.min(2,run*2)),i=t<1?0:1,a=t-i;sample(clips[i],q,out);sample(clips[i+1],q,scratch);for(const k of ['thigh','shin','footPitch'])out[k]+=(scratch[k]-out[k])*a;return out;}

// Original lead/trailing leg keys for an identified low trunk, not a generic hop.
const stepKeys=[
 [0,0,.08,0,.08], [.18,-.75,.95,.18,.2], [.42,-1.05,.8,.25,1.25],
 [.65,-.45,.35,-.75,1.35], [.84,.15,.08,-.4,.55], [1,0,.08,0,.08]
];
export function sampleStepOver(phase,out={legs:[{},{}]}){const q=Math.max(0,Math.min(1,phase));let i=1;while(i<stepKeys.length-1&&q>stepKeys[i][0])i++;const a=stepKeys[i-1],b=stepKeys[i],x=(q-a[0])/(b[0]-a[0]),t=x*x*(3-2*x);for(let leg=0;leg<2;leg++){out.legs[leg].thigh=a[1+leg*2]+(b[1+leg*2]-a[1+leg*2])*t;out.legs[leg].shin=a[2+leg*2]+(b[2+leg*2]-a[2+leg*2])*t;}return out;}
