# Build environment — `resume-tools` conda env (reusable)

A single, persistent conda env holds **everything** needed to build resumes (and any
markdown → PDF/DOCX job), so we stop doing ad-hoc per-machine installs. Reusable across
projects — not specific to this repo.

## What's in it
- **python** (runs `READY-TO-GO/_build/md2tex.py`)
- **pandoc** (markdown → `.docx`)
- **tectonic** (LaTeX → `.pdf`, self-contained — no MiKTeX/MacTeX needed)

## Create it once
```powershell
conda create -y -n resume-tools --override-channels -c conda-forge python=3.12 pandoc tectonic
```
> `--override-channels -c conda-forge` avoids the Anaconda default-channel Terms-of-Service prompt.

## Use it
```powershell
conda activate resume-tools
# now pandoc / tectonic / python are all on PATH:
cd Resumes/Applications      # or Resumes/READY-TO-GO
./convert.sh                 # rebuilds .tex (md2tex.py) + .pdf (tectonic) + .docx (pandoc)
```

Or build one resume manually:
```powershell
python ../READY-TO-GO/_build/md2tex.py Resume_X.md   # -> Resume_X.tex
tectonic Resume_X.tex                                 # -> Resume_X.pdf
pandoc  Resume_X.md -o Resume_X.docx                  # -> Resume_X.docx
```

## Notes
- The env lives at `~/miniconda3/envs/resume-tools` — it **persists** across sessions; create once, reuse forever.
- `convert.sh` calls bare `python3`/`pandoc`/`tectonic`; with the env activated they all resolve.
  (On Windows the script needs a bash shell, e.g. Git Bash; the per-tool commands above work in plain PowerShell.)
- Any other project that needs markdown → PDF/DOCX can just `conda activate resume-tools`.
