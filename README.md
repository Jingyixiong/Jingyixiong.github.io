# yixiongjing.com — personal website

Static site. No framework, no bundler, no npm. One small Python script aggregates
per-paper manifests; everything else is plain HTML, CSS and JS.

## Looking at it locally

Double-click `index.html`. It works from disk — there is no `fetch()` anywhere,
so no local server is needed.

If you prefer a server (closer to how GitHub Pages behaves):

```bash
python -m http.server 8000        #  then open http://localhost:8000
```

## Where things live

| I want to change… | Edit this |
|---|---|
| Bio, roles, research theme text, InfraMind band | `index.html` — prose sits in HTML on purpose, so search engines and screen readers see it |
| News items | `data/content.js` → `news` |
| Invited talks | `data/content.js` → `talks` |
| Reviewing / service | `data/content.js` → `service` |
| **A paper** | `content/papers/<folder>/paper.json` — **then run the build** |
| Colours, fonts, spacing | `css/base.css` (tokens at the top) |
| Layout of the page frame | `css/layout.css` |
| How a publication card looks | `css/components.css` + `js/render.js` |
| How project pages look | `tools/paper_template.html` |

`data/publications.js`, `data/publications.json` and everything under `papers/`
are **generated**. Never edit them; your changes will be overwritten.

## Adding a paper

```bash
cp -r content/papers/_template content/papers/2026-my-new-paper
# edit paper.json, replace teaser.jpg with a real 16:9 image
python tools/build_index.py
```

The build **refuses to write anything** if a paper is broken — missing teaser,
unknown theme, malformed JSON, dangling gallery path, or `"page": true` with no
abstract. That is deliberate: you cannot silently publish a half-finished entry.

It also prints a `warn` line for every paper still using a placeholder teaser, so
the remaining work is always visible.

### Preprint becomes a journal paper

Edit `venue` in place. Do **not** create a second folder — the folder name is the
URL, and a citation from two years ago still has to resolve.

```diff
-  "venue": { "name": "arXiv preprint", "short": "arXiv", "year": 2025, "status": "preprint" }
+  "venue": { "name": "Automation in Construction 184, 106839", "short": "AutCon", "year": 2026, "status": "journal" }
```

### Paper under review

`"hidden": true`. The folder stays in the repo and assets accumulate; nothing
appears publicly. Flip one boolean on acceptance.

## Replacing placeholder images

Every teaser is currently a generated placeholder. To replace one, overwrite the
file **keeping the same name**, then set `"placeholder": false` in that paper's
`media` block and rebuild.

| File | Spec |
|---|---|
| `content/papers/*/teaser.jpg` | 16:9, 1600×900. Crop your Figure 1 — don't letterbox it |
| `content/papers/*/teaser.mp4` | ≤6 s, ≤2 MB, 960×540, silent, seamless loop |
| `content/papers/*/gallery/*.jpg` | any width up to 2400 px |
| `assets/research/{perception,physics,embodied}.jpg` | 4:3 theme figures |
| `assets/img/headshot.jpg` | square, ≥800 px |
| `assets/cv.pdf` | your CV |

`python tools/make_derivatives.py` generates WebP and responsive sizes once real
images are in place.

## Deploying

Push to a repo named `Jingyixiong.github.io`; GitHub Pages serves the root.
`.nojekyll` is present so Pages does not try to process the folder as a Jekyll site.

For a custom domain, put the bare domain in `CNAME` and point DNS at GitHub.

## Still to do

- [ ] Paste the real BendTwin arXiv URL into `content/papers/2026-bendtwin/paper.json`
- [ ] Replace 19 placeholder teasers and 3 research figures
- [ ] Fill in `abstract` for `2026-bendtwin` (currently a TODO string)
- [ ] Fill in `bibtex.txt` for the published papers
- [ ] Add `alt` text to each paper's `media` block
- [ ] Decide whether the four under-review papers stay visible
- [ ] Add `favicon.ico`, `sitemap.xml`, JSON-LD `Person` schema
