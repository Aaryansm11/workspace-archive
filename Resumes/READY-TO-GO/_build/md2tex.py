#!/usr/bin/env python3
"""Convert a resume Markdown file -> LaTeX matching Aaryan's personal template
(1in margins, hidelinks, \\quad contact line, \\section* + titlerule, noitemsep bullets,
bold Company,Location / italic Role + right-aligned dates, Skills as bullets,
Projects as bold title + right-aligned repo link + bullets).
Usage: python3 md2tex.py path/to/Resume.md   -> writes path/to/Resume.tex"""
import re, sys

PREAMBLE = r"""\documentclass[10pt,a4paper]{article}
\usepackage[margin=0.5in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage{titlesec}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{1ex plus .3ex minus .2ex}{0.5ex plus .1ex}
\setlist[itemize]{noitemsep, topsep=2pt, leftmargin=1.5em, parsep=0pt}
\setlength{\parindent}{0pt}
\begin{document}
\vspace*{-1cm}
"""
POST = "\n\\end{document}\n"

# Map project-name keywords -> repo/demo URL (for right-aligned links, like the template)
LINKS = [
    ('langtron-kgs', 'https://github.com/Aaryansm11/Langtron-KGS'),
    ('langtron', 'https://github.com/Aaryansm11/LANGTRON'),
    ('sdis', 'https://github.com/Aaryansm11/SDIS'),
    ('emostream', 'https://github.com/Aaryansm11/Live_emostream'),
    ('our-life', 'https://github.com/Aaryansm11/our-life-hq'),
    ('cardiac', 'https://github.com/Aaryansm11/ecg-ppg-arrhythmia-prediction'),
    ('ecg', 'https://github.com/Aaryansm11/ecg-ppg-arrhythmia-prediction'),
    ('self-supervised', 'https://github.com/Aaryansm11/ecg-ppg-arrhythmia-prediction'),
    ('hospital', 'https://github.com/Aaryansm11/hospital_management_ooad'),
    ('cloud', 'https://github.com/Aaryansm11/CloudComputingMonolithic'),
    ('airline', 'https://github.com/Aaryansm11/AirlineDBManagement'),
]


def find_link(title):
    t = title.lower()
    for kw, url in LINKS:
        if kw in t:
            return url
    return None


def esc_text(s):
    for a, b in [('&', r'\&'), ('%', r'\%'), ('#', r'\#'), ('_', r'\_'), ('$', r'\$')]:
        s = s.replace(a, b)
    s = s.replace('{', r'\{').replace('}', r'\}')
    s = s.replace('~', r'\textasciitilde{}').replace('^', r'\textasciicircum{}')
    s = s.replace('<', r'\textless{}').replace('>', r'\textgreater{}')
    s = s.replace('—', '---').replace('–', '--').replace('·', r' \textbar{} ')
    s = s.replace('’', "'").replace('‘', "'").replace('“', '``').replace('”', "''")
    s = s.replace('→', r'$\rightarrow$').replace('↔', r'$\leftrightarrow$')
    s = s.replace('≥', r'$\geq$').replace('≤', r'$\leq$').replace('×', r'$\times$')
    s = s.replace('₂', '2').replace('⭐', '')
    s = s.replace('τ', r'$\tau$').replace('σ', r'$\sigma$').replace('μ', r'$\mu$')
    s = s.replace('λ', r'$\lambda$').replace('θ', r'$\theta$').replace('α', r'$\alpha$').replace('β', r'$\beta$').replace('π', r'$\pi$')
    s = s.replace('↑', r'$\uparrow$').replace('↓', r'$\downarrow$').replace('≈', r'$\approx$').replace('•', r'\textbullet{}')
    return s


def esc_url(u):
    return u.replace('%', r'\%').replace('#', r'\#')


TOKEN = re.compile(r'\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*')


def inline(s):
    out, pos = '', 0
    for m in TOKEN.finditer(s):
        out += esc_text(s[pos:m.start()])
        if m.group(1) is not None:
            out += r'\href{%s}{%s}' % (esc_url(m.group(2)), inline(m.group(1)))
        elif m.group(3) is not None:
            out += r'\textbf{%s}' % inline(m.group(3))
        else:
            out += r'\textit{%s}' % inline(m.group(4))
        pos = m.end()
    out += esc_text(s[pos:])
    return out


def subheading(entity, rest):
    rest = re.sub(r'^\s*[—–-]\s*', '', rest.strip())
    segs = [s.strip() for s in rest.split('·') if s.strip()]
    role = segs[0] if segs else ''
    date, loc = '', ''
    for s in segs[1:]:
        if re.search(r'\b\d{4}\b', s) and not date:
            date = s
        elif not loc:
            loc = s
    line1 = entity + (', ' + loc if loc else '')
    out = r'\vspace{1pt}\textbf{%s}' % inline(line1)
    if role or date:
        out += r'\\' + '\n' + r'\textit{%s}\hfill %s' % (inline(role), inline(date))
    out += r'\par\vspace{1pt}'
    return out


def project_block(bullet):
    m = re.match(r'\*\*(.+?)\*\*\s*(.*)', bullet)
    if not m:
        return r'\item %s' % inline(bullet)  # fallback
    title = m.group(1).rstrip(': ')
    desc = m.group(2).lstrip(': ').strip()
    desc = re.sub(r'^([^A-Za-z]*)([a-z])', lambda mm: mm.group(1) + mm.group(2).upper(), desc, count=1)
    link = find_link(title)
    head = r'\vspace{1pt}\textbf{%s}' % inline(title)
    if link:
        disp = link.replace('https://', '').replace('http://', '').rstrip('/')
        head += r'\hfill {\small\href{%s}{%s}}' % (esc_url(link), esc_text(disp))
    block = head
    if desc:
        block += '\n' + r'\begin{itemize}' + '\n' + r'\item %s' % inline(desc) + '\n' + r'\end{itemize}'
    return block


BOLD_LEAD = re.compile(r'^\*\*(.+?)\*\*(.*)$')
ITALIC_LINE = re.compile(r'^\*[^*].*\*$')


def convert(md):
    lines = md.split('\n')
    n, i, name = len(lines), 0, ''
    while i < n:
        if lines[i].startswith('# '):
            name = lines[i][2:].strip(); i += 1; break
        i += 1
    header = []
    while i < n:
        t = lines[i].strip()
        if t.startswith('## ') or t == '---':
            break
        if t:
            header.append(t)
        i += 1
    # ---- header block ----
    out = [r'\begin{center}', r'{\LARGE\bfseries %s}\\[0.5em]' % esc_text(name)]
    role, contact = None, []
    for h in header:
        if re.fullmatch(r'\*\*.+\*\*', h.strip()):
            role = h.strip()[2:-2]
        else:
            for seg in h.split('·'):
                if seg.strip():
                    contact.append(seg.strip())
    if role:
        out.append(r'{\large %s}\\[0.3em]' % esc_text(role))
    if contact:
        out.append(r' $\cdot$ '.join(inline(c) for c in contact))
    out.append(r'\end{center}\vspace{0.4ex}')

    # ---- sections ----
    cursec, item = '', [False]
    para = []

    def flush():
        if para:
            out.append('\\\\\n'.join(para) + r'\par\vspace{2pt}')
            para.clear()

    def enditem():
        if item[0]:
            out.append(r'\end{itemize}'); item[0] = False

    for l in lines[i:]:
        t = l.strip()
        if t.startswith('## '):
            flush(); enditem(); cursec = t[3:].strip().lower()
            out.append(r'\section*{%s}' % inline(t[3:])); continue
        if t == '' or t == '---':
            flush(); enditem(); continue
        if t.startswith('- '):
            content = t[2:]
            if 'project' in cursec:
                flush(); enditem(); out.append(project_block(content)); continue
            flush()
            if not item[0]:
                out.append(r'\begin{itemize}'); item[0] = True
            out.append(r'\item %s' % inline(content)); continue
        mb = BOLD_LEAD.match(t)
        if mb:
            if 'skill' in cursec:  # Skills: render categories as bullets
                flush()
                if not item[0]:
                    out.append(r'\begin{itemize}'); item[0] = True
                out.append(r'\item %s' % inline(t)); continue
            if not mb.group(1).rstrip().endswith(':') and not mb.group(2).lstrip().startswith(':'):
                flush(); enditem(); out.append(subheading(mb.group(1), mb.group(2))); continue
        if ITALIC_LINE.match(t):
            flush(); enditem(); out.append(r'{\small\itshape %s}\par\vspace{1pt}' % inline(t[1:-1])); continue
        enditem(); para.append(inline(t))
    flush(); enditem()
    return PREAMBLE + '\n'.join(out) + POST


if __name__ == '__main__':
    src = sys.argv[1]
    tex = convert(open(src, encoding='utf-8').read())
    dst = (src[:-3] if src.endswith('.md') else src) + '.tex'
    open(dst, 'w', encoding='utf-8').write(tex)
    print(dst)
