#!/usr/bin/env python3
"""Acquire only the central 08.5 tile; refuse a changed provider payload."""
import pathlib,json,hashlib,urllib.request,datetime
root=pathlib.Path('work/mission-14/raw');root.mkdir(parents=True,exist_ok=True)
meta=json.loads(pathlib.Path('docs/mission-08-5-sources.json').read_text())['mnt']
item=next(f for f in meta['files'] if f['path']=='LHD_FXX_0538_6624_MNT_O_0M50_LAMB93_IGN69.tif')
path=root/item['path'];status=None;mode='verified existing local cache'
if not path.exists():
 with urllib.request.urlopen(item['url'],timeout=90) as response:
  data=response.read();status=response.status
 if hashlib.sha256(data).hexdigest()!=item['raw_sha256']:raise ValueError('Provider raster changed; re-audit before accepting it')
 path.write_bytes(data);mode='downloaded from pinned official URL'
assert hashlib.sha256(path.read_bytes()).hexdigest()==item['raw_sha256'],'Cached source checksum mismatch'
(root/'mnt-manifest.json').write_text(json.dumps({**meta,'files':[{**item,'sha256':item['raw_sha256'],'bytes':item['raw_bytes']}]},indent=2))
evidence=dict(mode=mode,checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),url=item['url'],path=item['path'],rawBytes=path.stat().st_size,rawSha256=item['raw_sha256'],httpStatusOfThisInvocation=status,historicalProvenance='docs/mission-08-5-sources.json; unchanged raw SHA-256',license=meta['license'],nativeSpacingM=.5,acquiredAt=meta['acquired_at'],edition=meta['edition'])
pathlib.Path('docs/mission-14-evidence/source-acquisition.json').write_text(json.dumps(evidence,indent=2)+'\n')
print(mode,path,path.stat().st_size)
