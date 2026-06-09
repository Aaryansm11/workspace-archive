#!/bin/bash
# Regenerate .docx (ATS) + .tex (LaTeX source) + .pdf (clean LaTeX) for every resume .md.
# Usage: ./convert.sh     (requires pandoc + tectonic)
cd "$(dirname "$0")" || exit 1
find . -name "*.md" ! -name "README.md" | while read -r f; do
  base="${f%.md}"
  pandoc "$f" -o "$base.docx" 2>/dev/null            # ATS-friendly Word
  python3 _build/md2tex.py "$f" >/dev/null            # md -> LaTeX
  tectonic "$base.tex" >/dev/null 2>&1                # LaTeX -> clean PDF
  echo "✓ $(basename "$base")"
done
echo "Done — .docx + .tex + .pdf regenerated."
