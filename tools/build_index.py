#!/usr/bin/env python3
"""
build_index.py — the only build step this site has.

Reads   content/papers/<YYYY-slug>/paper.json   (one folder per paper)
Writes  data/publications.json                  (canonical, for tooling)
        data/publications.js                    (what the pages load)
        papers/<slug>/index.html                (for papers with "page": true)

Run it after adding or editing any paper:

    python tools/build_index.py

It VALIDATES and refuses to write anything if a paper is broken — missing
teaser, unknown theme, bad JSON, dangling gallery path. That is the point:
you cannot silently ship a half-finished entry.

Two outputs for the publication list because `fetch()` on a JSON file is
blocked when a page is opened directly from disk (file://). The .js copy is
a plain <script> tag, so double-clicking index.html works. The .json copy is
the portable one — feed it to a CV generator, a BibTeX export, anything.
"""

import json
import pathlib
import sys

ROOT    = pathlib.Path(__file__).resolve().parents[1]
PAPERS  = ROOT / "content" / "papers"
DATA    = ROOT / "data"
PAGES   = ROOT / "papers"
TPL     = ROOT / "tools" / "paper_template.html"

THEMES   = {"perception", "physics", "embodied"}
STATUSES = {"journal", "conference", "preprint", "under-review", "dataset"}
# Author role. "first" and "corresponding" are Jing's own work and are the only
# ones eligible for the homepage Selected list. "contributing" = minor/middle
# author: stays in the full archive and the theme filters, off the homepage.
ROLES    = {"first", "corresponding", "contributing"}
OWN_WORK = {"first", "corresponding"}
REQUIRED = ("title", "authors", "venue", "themes")

LINK_ORDER = ["project", "paper", "arxiv", "code", "data",
              "video", "demo", "slides", "poster", "press"]
LINK_LABEL = {"project": "Project", "paper": "Paper", "arxiv": "arXiv", "code": "Code",
              "data": "Data", "video": "Video", "demo": "Demo", "slides": "Slides",
              "poster": "Poster", "press": "Press"}

errors, warnings, items = [], [], []


def fail(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


# ----------------------------------------------------------------- read papers
if not PAPERS.exists():
    print(f"error: {PAPERS} does not exist")
    sys.exit(1)

for d in sorted(PAPERS.iterdir(), reverse=True):
    if not d.is_dir() or d.name.startswith("_"):
        continue                                   # _template/ is skipped

    manifest = d / "paper.json"
    if not manifest.exists():
        fail(f"{d.name}: no paper.json")
        continue

    try:
        p = json.loads(manifest.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"{d.name}: invalid JSON — line {e.lineno}, {e.msg}")
        continue

    for key in REQUIRED:
        if not p.get(key):
            fail(f"{d.name}: missing required field '{key}'")
    if errors and errors[-1].startswith(d.name):
        pass                                       # keep going, collect everything

    # -- themes
    bad = set(p.get("themes", [])) - THEMES
    if bad:
        fail(f"{d.name}: unknown theme(s) {sorted(bad)} — allowed: {sorted(THEMES)}")

    # -- role: who Jing was on this paper. Gates the homepage Selected list.
    role = p.get("role")
    if role not in ROLES:
        fail(f"{d.name}: role must be one of {sorted(ROLES)} (got {role!r})")
    elif p.get("selected") and role not in OWN_WORK:
        fail(f"{d.name}: \"selected\": true is not allowed with role '{role}' — "
             f"the homepage shows first-author and corresponding-author work only")

    # -- venue
    venue = p.get("venue") or {}
    if venue.get("status") not in STATUSES:
        fail(f"{d.name}: venue.status must be one of {sorted(STATUSES)}")
    if not venue.get("year"):
        fail(f"{d.name}: venue.year is required")
    venue.setdefault("short", venue.get("name", "")[:12])

    # -- optional workshop recognition, separate from the publication venue
    if "workshop" in p:
        workshop = p["workshop"]
        if not isinstance(workshop, dict):
            fail(f"{d.name}: workshop must be an object")
        else:
            for key in ("badge", "name", "url", "presentation"):
                value = workshop.get(key)
                if not isinstance(value, str) or not value.strip():
                    fail(f"{d.name}: workshop.{key} must be a non-empty string")
            url = workshop.get("url")
            if isinstance(url, str) and not url.startswith(("https://", "http://")):
                fail(f"{d.name}: workshop.url must be an HTTP(S) URL")
            if not isinstance(workshop.get("non_archival"), bool):
                fail(f"{d.name}: workshop.non_archival must be true or false")

    # -- media
    media = p.setdefault("media", {})
    media.setdefault("teaser", "teaser.jpg")
    if not (d / media["teaser"]).exists():
        fail(f"{d.name}: teaser '{media['teaser']}' not found in the folder")
    if media.get("teaser_video") and not (d / media["teaser_video"]).exists():
        fail(f"{d.name}: teaser_video '{media['teaser_video']}' not found")
    if not media.get("alt"):
        warn(f"{d.name}: no media.alt (hurts accessibility and image search)")
    if media.get("placeholder"):
        warn(f"{d.name}: teaser is still a PLACEHOLDER — drop in the real figure")

    # -- gallery
    for g in p.get("gallery", []):
        if not (d / g.get("src", "")).exists():
            fail(f"{d.name}: gallery file '{g.get('src')}' not found")

    # -- links
    links = []
    for l in p.get("links", []):
        if "type" not in l:
            fail(f"{d.name}: a link is missing 'type'")
            continue
        l.setdefault("label", LINK_LABEL.get(l["type"], l["type"]))
        l.setdefault("url", "#")
        links.append(l)
    links.sort(key=lambda l: LINK_ORDER.index(l["type"]) if l["type"] in LINK_ORDER else 99)
    p["links"] = links
    if not links:
        warn(f"{d.name}: no links at all")

    # -- project page prerequisites
    if p.get("page") and not p.get("abstract"):
        fail(f"{d.name}: \"page\": true requires an \"abstract\"")

    if not p.get("tldr"):
        warn(f"{d.name}: no tldr — this is the line most readers actually read")

    # -- rank: optional manual ordering for the homepage "Selected" list.
    #    Lower numbers appear first. Papers without a rank fall to the end and
    #    are then ordered by year.
    p["rank"] = p.get("rank", 500)

    # -- derived fields
    bib = d / "bibtex.txt"
    p["bibtex"] = bib.read_text(encoding="utf-8").strip() if bib.exists() else None
    p["dir"]    = f"content/papers/{d.name}"
    p["slug"]   = p.get("slug") or (d.name.split("-", 1)[1] if "-" in d.name else d.name)

    if p.get("hidden"):
        continue                                   # in the repo, off the site
    items.append(p)


# ----------------------------------------------------------------- report
for w in warnings:
    print(f"  warn   {w}")

if errors:
    print("\nBUILD FAILED — nothing written\n")
    for e in errors:
        print(f"  error  {e}")
    sys.exit(1)

# duplicate slug check
seen = {}
for p in items:
    if p["slug"] in seen:
        print(f"\nBUILD FAILED — duplicate slug '{p['slug']}'")
        sys.exit(1)
    seen[p["slug"]] = True

items.sort(key=lambda p: (-p["venue"]["year"], p["title"]))


# ----------------------------------------------------------------- write data
DATA.mkdir(parents=True, exist_ok=True)
blob = json.dumps(items, indent=2, ensure_ascii=False)

(DATA / "publications.json").write_text(blob + "\n", encoding="utf-8", newline="\n")
(DATA / "publications.js").write_text(
    "/* GENERATED by tools/build_index.py — do not edit.\n"
    "   Source of truth: content/papers/<folder>/paper.json */\n"
    "window.PUBLICATIONS = " + blob + ";\n",
    encoding="utf-8", newline="\n")


# ----------------------------------------------------------------- project pages
def render_page(p):
    tpl = TPL.read_text(encoding="utf-8")
    up = "../../"

    authors = p["authors"].replace("**", "")       # plain text in the byline
    for tag, val in [
        ("TITLE",    p["title"]),
        ("SHORT",    p.get("short_title", p["title"])),
        ("AUTHORS",  authors),
        ("VENUE",    f'{p["venue"]["name"]}, {p["venue"]["year"]}'),
        ("ABSTRACT", p.get("abstract", "")),
        ("TLDR",     p.get("tldr", "")),
        ("BASE",     up),
    ]:
        tpl = tpl.replace("{{" + tag + "}}", val)

    hero = f'<img src="{up}{p["dir"]}/{p["media"]["teaser"]}" alt="{p["media"].get("alt","")}">'
    if p["media"].get("teaser_video"):
        hero = (f'<video src="{up}{p["dir"]}/{p["media"]["teaser_video"]}" '
                f'poster="{up}{p["dir"]}/{p["media"]["teaser"]}" '
                f'muted loop autoplay playsinline></video>')
    tpl = tpl.replace("{{HERO_MEDIA}}", hero)

    btns = "".join(
        f'<a href="{l["url"]}"'
        + (' class="pending"' if l["url"].startswith("#") else ' target="_blank" rel="noopener"')
        + f'>{l["label"]}</a>'
        for l in p["links"])
    tpl = tpl.replace("{{BUTTONS}}", f'<div class="btns">{btns}</div>' if btns else "")

    gal = "".join(
        f'<figure><img src="{up}{p["dir"]}/{g["src"]}" alt="{g.get("caption","")}" '
        f'loading="lazy"><figcaption>{g.get("caption","")}</figcaption></figure>'
        for g in p.get("gallery", []))
    tpl = tpl.replace("{{GALLERY}}",
                      f'<h2>Figures</h2><div class="gallery">{gal}</div>' if gal else "")

    tpl = tpl.replace("{{BIBTEX}}",
                      f'<h2>BibTeX</h2><pre class="bibtex">{p["bibtex"]}</pre>'
                      if p.get("bibtex") else "")
    return tpl


made = []
if TPL.exists():
    for p in items:
        if not p.get("page"):
            continue
        out = PAGES / p["slug"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(render_page(p), encoding="utf-8", newline="\n")
        made.append(p["slug"])
else:
    warn("tools/paper_template.html missing — no project pages generated")

# ----------------------------------------------------------------- summary
sel = sum(1 for p in items if p.get("selected"))
roles = {r: sum(1 for p in items if p.get("role") == r) for r in sorted(ROLES)}
ph  = sum(1 for p in items if p["media"].get("placeholder"))
print(f"\nOK  {len(items)} papers  ({sel} selected, {ph} still using placeholder teasers)")
print("    roles: " + ", ".join(f"{n} {r}" for r, n in roles.items() if n))
print(f"    -> data/publications.json")
print(f"    -> data/publications.js")
if made:
    print(f"    -> {len(made)} project page(s): {', '.join(made)}")
