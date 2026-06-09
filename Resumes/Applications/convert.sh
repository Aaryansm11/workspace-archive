#!/bin/bash
# Regenerate .tex + .pdf + .docx for every company resume in Applications/*/.
# Usage: ./convert.sh   (requires pandoc + tectonic; uses the shared template in ../READY-TO-GO/_build/md2tex.py)
cd "$(dirname "$0")" || exit 1
MD2TEX="../READY-TO-GO/_build/md2tex.py"
find . -name "Resume_*.md" | while read -r f; do
  base="${f%.md}"
  pandoc "$f" -o "$base.docx" 2>/dev/null
  python3 "$MD2TEX" "$f" >/dev/null
  tectonic "$base.tex" >/dev/null 2>&1
  echo "✓ $f"
done
echo "Done — company resumes regenerated."
