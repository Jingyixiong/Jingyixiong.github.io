#!/usr/bin/env python3
"""
make_derivatives.py — image optimisation for real (non-placeholder) assets.

Run after dropping real images in:

    python tools/make_derivatives.py

For every content/papers/*/teaser.jpg it writes teaser-480.webp and
teaser-960.webp next to it, and downscales anything wider than 2400 px.
Gallery images are capped at 1600 px and given .webp siblings.

Placeholder teasers are skipped (they are already small and will be replaced).
Requires Pillow:  pip install pillow
"""

import pathlib
import json
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAPERS = ROOT / "content" / "papers"
MAX_SOURCE = 2400
TEASER_SIZES = (480, 960)
GALLERY_MAX = 1600

made = skipped = 0


def shrink_in_place(path, max_w):
    im = Image.open(path)
    if im.width <= max_w:
        return im
    h = round(im.height * max_w / im.width)
    im = im.resize((max_w, h), Image.LANCZOS)
    im.save(path, quality=88, optimize=True)
    print(f"  shrank  {path.relative_to(ROOT)} -> {max_w}px")
    return im


for d in sorted(PAPERS.iterdir()):
    if not d.is_dir() or d.name.startswith("_"):
        continue
    mf = d / "paper.json"
    if not mf.exists():
        continue

    try:
        meta = json.loads(mf.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print(f"  skip    {d.name}: paper.json is not valid JSON")
        continue

    media = meta.get("media", {})
    teaser = d / media.get("teaser", "teaser.jpg")

    if media.get("placeholder"):
        skipped += 1
    elif teaser.exists():
        im = shrink_in_place(teaser, MAX_SOURCE).convert("RGB")
        for w in TEASER_SIZES:
            if im.width < w:
                continue
            h = round(im.height * w / im.width)
            out = teaser.with_name(f"{teaser.stem}-{w}.webp")
            im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=82, method=6)
            print(f"  wrote   {out.relative_to(ROOT)}")
            made += 1

    gal = d / "gallery"
    if gal.exists():
        for g in sorted(gal.glob("*")):
            if g.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                continue
            im = shrink_in_place(g, GALLERY_MAX).convert("RGB")
            out = g.with_suffix(".webp")
            im.save(out, "WEBP", quality=82, method=6)
            print(f"  wrote   {out.relative_to(ROOT)}")
            made += 1

print(f"\n{made} derivative(s) written; {skipped} paper(s) skipped (teaser still a placeholder)")
