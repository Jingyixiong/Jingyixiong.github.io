/* ============================================================
   render.js — turns data into DOM. Shared by index.html and
   publications.html.

   Reads two globals, both loaded as plain <script> tags so the
   site works when opened directly from disk (file://) as well as
   over http:
     window.PUBLICATIONS  <- data/publications.js   (GENERATED)
     window.SITE          <- data/content.js        (hand-edited)

   Set window.BASE = '../../' on pages nested in a subfolder.
   ============================================================ */
(function () {
  'use strict';

  var BASE = window.BASE || '';
  var PUBS = window.PUBLICATIONS || [];
  var SITE = window.SITE || {};

  var THEME_GRADIENT = {
    perception: 'linear-gradient(135deg,#1f6f8b,#2e4a6b)',
    physics:    'linear-gradient(135deg,#6b4fa8,#3d3172)',
    embodied:   'linear-gradient(135deg,#b5651d,#7a3f16)'
  };

  var LINK_LABEL = {
    project: 'Project', paper: 'Paper', arxiv: 'arXiv', code: 'Code',
    data: 'Data', video: 'Video', demo: 'Demo', slides: 'Slides',
    poster: 'Poster', press: 'Press'
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  /** **bold** -> <b>bold</b>, applied after escaping */
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }

  function isPending(url) { return !url || url.charAt(0) === '#'; }

  function teaserURL(p) {
    var f = (p.media && p.media.teaser) || 'teaser.jpg';
    return BASE + p.dir + '/' + f;
  }
  function videoURL(p) {
    var f = p.media && p.media.teaser_video;
    return f ? BASE + p.dir + '/' + f : null;
  }
  function pageURL(p) {
    return p.page ? BASE + 'papers/' + p.slug + '/' : null;
  }
  /** Where the title should point: project page > first real link > nothing */
  function titleHref(p) {
    var page = pageURL(p);
    if (page) return page;
    for (var i = 0; i < p.links.length; i++) {
      if (!isPending(p.links[i].url)) return p.links[i].url;
    }
    return null;
  }

  function badges(p) {
    var out = '';
    if (p.is_new) out += '<span class="badge new">New</span>';
    if (p.venue.status === 'under-review') {
      out += '<span class="badge outline">Under review</span>';
    } else if (p.venue.status === 'preprint') {
      out += '<span class="badge outline">Preprint</span>';
    } else {
      out += '<span class="badge">' + esc(p.venue.short) + '</span>';
    }
    if (p.venue.status === 'dataset' || p.is_dataset) {
      out += '<span class="badge">Dataset</span>';
    }
    return out;
  }

  function buttons(p) {
    if (!p.links.length) return '';
    var html = p.links.map(function (l) {
      var label = l.label || LINK_LABEL[l.type] || l.type;
      var pending = isPending(l.url);
      return '<a href="' + esc(pending ? '#' : l.url) + '"' +
        (pending ? ' class="pending" title="Link not added yet"' : ' target="_blank" rel="noopener"') +
        '>' + esc(label) + '</a>';
    }).join('');
    return '<div class="btns">' + html + '</div>';
  }

  function thumb(p) {
    var grad = THEME_GRADIENT[p.themes[0]] || THEME_GRADIENT.perception;
    var vid = videoURL(p);
    var inner = '<img src="' + esc(teaserURL(p)) + '" alt="' +
      esc((p.media && p.media.alt) || p.title) + '" loading="lazy">' +
      (vid
        ? '<video src="' + esc(vid) + '" muted loop autoplay playsinline ' +
          'preload="auto" disablepictureinpicture aria-hidden="true" tabindex="-1" ' +
          'poster="' + esc(teaserURL(p)) + '"></video>'
        : '');
    var href = titleHref(p);
    var style = ' style="background:' + grad + '"';
    return href
      ? '<a class="thumb" href="' + esc(href) + '"' + style + '>' + inner + '</a>'
      : '<div class="thumb"' + style + '>' + inner + '</div>';
  }

  /* ---------- one publication card ---------- */
  function card(p) {
    var href = titleHref(p);
    var title = href
      ? '<a href="' + esc(href) + '">' + esc(p.title) + '</a>'
      : esc(p.title);
    return '' +
      '<article class="pub">' +
        thumb(p) +
        '<div>' +
          '<h3>' + title + badges(p) + '</h3>' +
          '<div class="authors">' + md(p.authors) + '</div>' +
          '<div class="venue">' + esc(p.venue.name) + ', ' + p.venue.year + '</div>' +
          (p.tldr ? '<p class="tldr">' + esc(p.tldr) + '</p>' : '') +
          buttons(p) +
        '</div>' +
      '</article>';
  }

  /* ---------- list renderers ---------- */
  function byYearDesc(a, b) { return b.venue.year - a.venue.year; }

  /** rank ascending, then newest first. `rank` is set per paper in paper.json. */
  function byRank(a, b) {
    return (a.rank - b.rank) || (b.venue.year - a.venue.year);
  }

  /** Selected papers, flat, no year headings, manually ordered. Homepage. */
  function renderSelected(target, limit) {
    var el = document.getElementById(target);
    if (!el) return;
    var items = PUBS.filter(function (p) { return p.selected; }).sort(byRank);
    if (limit) items = items.slice(0, limit);
    el.innerHTML = items.map(card).join('');
    if (window.initTeaserVideos) window.initTeaserVideos();
  }

  /** Filterable archive with year headings. Used on publications.html. */
  function renderArchive(target, filter) {
    var el = document.getElementById(target);
    if (!el) return;
    var items;
    if (filter === 'selected')      items = PUBS.filter(function (p) { return p.selected; });
    else if (filter === 'all')      items = PUBS.slice();
    else if (filter === 'code')     items = PUBS.filter(function (p) {
      return p.links.some(function (l) {
        return (l.type === 'code' || l.type === 'data') && !isPending(l.url);
      });
    });
    else                            items = PUBS.filter(function (p) {
      return p.themes.indexOf(filter) !== -1;
    });

    if (filter === 'selected') {
      el.innerHTML = items.sort(byRank).map(card).join('');
      if (window.initTeaserVideos) window.initTeaserVideos();
      return;
    }
    items.sort(byYearDesc);

    var html = '', year = null;
    items.forEach(function (p) {
      if (p.venue.year !== year) {
        year = p.venue.year;
        html += '<div class="year-head">' + year + '</div>';
      }
      html += card(p);
    });
    el.innerHTML = html ||
      '<p class="muted small">Nothing here yet.</p>';
    if (window.initTeaserVideos) window.initTeaserVideos();
  }

  function initFilters(containerId, target) {
    var box = document.getElementById(containerId);
    if (!box) return;
    var buttonsEl = box.querySelectorAll('button');
    Array.prototype.forEach.call(buttonsEl, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(buttonsEl, function (x) {
          x.setAttribute('aria-pressed', 'false');
        });
        b.setAttribute('aria-pressed', 'true');
        renderArchive(target, b.dataset.filter);
      });
    });
    var active = box.querySelector('button[aria-pressed="true"]') || buttonsEl[0];
    renderArchive(target, active.dataset.filter);
  }

  /* ---------- news ---------- */
  function renderNews(target, visible) {
    var el = document.getElementById(target);
    if (!el || !SITE.news) return;
    el.innerHTML = SITE.news.map(function (n, i) {
      var extra = i >= visible ? ' class="extra" style="display:none"' : '';
      return '<dt' + extra + '>' + esc(n.date) + '</dt>' +
             '<dd' + extra + '>' + n.text + '</dd>';   // text may contain <b>/<a>
    }).join('');
    if (window.initNewsToggle) window.initNewsToggle(visible);
  }

  /* ---------- simple row lists ---------- */
  function renderTalks(target) {
    var el = document.getElementById(target);
    if (!el || !SITE.talks) return;
    el.innerHTML = SITE.talks.map(function (t) {
      return '<div><b>' + esc(t.title) + '</b><br>' +
             '<span class="muted small">' + esc(t.where) + ' — ' + esc(t.date) + '</span></div>';
    }).join('');
  }

  function renderService(target) {
    var el = document.getElementById(target);
    if (!el || !SITE.service) return;
    el.innerHTML = SITE.service.map(function (s) {
      return '<div><span class="muted">' + esc(s.label) + '</span><br>' + s.body + '</div>';
    }).join('');
  }

  /* ---------- public API ---------- */
  window.Render = {
    selected: renderSelected,
    archive: renderArchive,
    filters: initFilters,
    news: renderNews,
    talks: renderTalks,
    service: renderService,
    count: function () { return PUBS.length; }
  };
})();
