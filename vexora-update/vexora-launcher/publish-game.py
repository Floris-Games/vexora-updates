"""Create a release ZIP and valid SHA256 manifest for an HTML game update."""
import hashlib,json,sys,zipfile
from pathlib import Path
if len(sys.argv)!=3:
 print('Usage: py publish-game.py "path-to-latest-game.html" 1.0.1');sys.exit(1)
source=Path(sys.argv[1]);version=sys.argv[2]
if not source.is_file() or not __import__('re').fullmatch(r'\d+\.\d+\.\d+',version):
 sys.exit('Provide an existing HTML file and a version like 1.0.1')
out=Path(__file__).parent/'publish-output';out.mkdir(exist_ok=True)
archive=out/f'Silver-Road-v{version}.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:z.write(source,'silver-road.html')
hash=hashlib.sha256(archive.read_bytes()).hexdigest()
manifest={'version':version,'downloadUrl':f'https://github.com/Floris-Games/vexora-updates/releases/download/silver-road-v{version}/{archive.name}','sha256':hash,'executable':'silver-road.html','title':f'Silver Road v{version}','notes':'Silver Road update.'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Created:',archive,'and',out/'manifest.json')
print('1. Upload ZIP as GitHub Release asset with tag silver-road-v'+version)
print('2. Replace silver-road/manifest.json in the repository with generated manifest.json')
