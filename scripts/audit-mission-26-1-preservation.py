"""Compare every historical public asset and protected source with M26."""
import hashlib, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'de3958c6c55b9ef9856d5809b14ef3d41ed8e4b5'
paths = ['public', 'src/world', 'src/living', '.github/workflows']
raw = subprocess.check_output(['git', 'ls-tree', '-rz', BASE, '--', *paths], cwd=ROOT)
unchanged, changed, missing, total = 0, [], [], 0
for row in raw.split(b'\0'):
    if not row:
        continue
    head, name = row.split(b'\t', 1)
    mode, kind, expected = head.decode().split()
    name = name.decode()
    if kind != 'blob':
        continue
    total += 1
    path = ROOT / name
    if not path.is_file():
        missing.append(name)
        continue
    content = path.read_bytes()
    actual = hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest()
    if actual == expected:
        unchanged += 1
    else:
        changed.append({'path': name, 'beforeGitBlobSHA': expected, 'afterGitBlobSHA': actual})
allowed = ['public/planet/fr-86/manifest.json']
report = {
    'method': 'Every preexisting blob read from disk and its Git blob SHA compared with the executable M26 reference. New files are separate additions.',
    'baselineSHA': BASE,
    'sourceSHA': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip(),
    'paths': paths, 'checked': total, 'unchanged': unchanged, 'changed': changed, 'missing': missing,
    'allowedMetadataChanges': allowed,
    'passed': not missing and all(r['path'] in allowed for r in changed),
    'limitation': 'Byte preservation does not certify every historical runtime behavior.'
}
(ROOT / 'docs/mission-26-1-evidence/preservation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
