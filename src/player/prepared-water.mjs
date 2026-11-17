import {sha256} from '../planet/tile-manager.mjs';
/** A source-bound cache of the exact existing checked graph, never an access grant. */
export async function loadPreparedWater(base,surface){
 const response=await fetch(new URL('pilot.json',base));if(!response.ok)return null;const m=await response.json();
 if(m.schema!=='estimated-water-cache-manifest-v1'||m.model!=='estimated-bed-v3-network4m'||m.surface!==surface||m.bytes>8*1024*1024||m.decodedBytes>24*1024*1024)return null;
 const r=await fetch(new URL('pilot.pack',base));if(!r.ok)return null;const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length!==m.bytes||await sha256(bytes)!==m.sha256)throw Error('Prepared water checksum mismatch');
 const text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();if(new TextEncoder().encode(text).length!==m.decodedBytes)throw Error('Prepared water length mismatch');
 const data=JSON.parse(text);if(data.surface!==surface||data.nodes.length!==m.nodes||data.accesses.length!==m.accesses)throw Error('Prepared water source mismatch');return data;
}
