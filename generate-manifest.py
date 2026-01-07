import os
import json
from pathlib import Path

script_dir = Path(__file__).parent
notes_dir = script_dir / 'files' / 'notes'
output_file = script_dir / 'notes-manifest.json'

try:
    md_files = sorted([f.name for f in notes_dir.glob('*.md')])
    
    manifest = {
        'notes': md_files
    }
    
    with open(output_file, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f'✓ Generated notes-manifest.json with {len(md_files)} notes')
    print(f'Notes: {", ".join(md_files)}')
    
except Exception as e:
    print(f'Error generating manifest: {e}')
    exit(1)
