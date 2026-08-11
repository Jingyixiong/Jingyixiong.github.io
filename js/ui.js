/* ============================================================
   ui.js — chrome only: dark-mode toggle, news "show earlier",
   nav current-page marker. No content lives here.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- dark mode ---------- */
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) { /* file:// or blocked */ }
  if (stored === 'dark' || stored === 'light') root.dataset.theme = stored;

  if (btn) {
    btn.addEventListener('click', function () {
      var current = root.dataset.theme ||
        (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---------- mark the current nav item ---------- */
  var here = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('nav a.nl'), function (a) {
    var href = a.getAttribute('href') || '';
    if (href.indexOf('#') !== 0 && href.split('/').pop() === here) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- teaser videos ----------
     The markup already carries autoplay/loop/muted, so these play with JS off.
     This block adds two things the attributes cannot express:
       1. honour prefers-reduced-motion — pause and reveal the still teaser instead
       2. pause whatever has scrolled out of view, so an idle tab is not decoding
          video nobody is looking at
     Safe to delete: without it the videos simply autoplay unconditionally. */
  window.initTeaserVideos = function () {
    var vids = document.querySelectorAll('.pub .thumb video');
    if (!vids.length) return;

    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)');
    if (calm && calm.matches) {
      Array.prototype.forEach.call(vids, function (v) {
        v.autoplay = false;
        v.removeAttribute('autoplay');
        v.pause();
      });
      return;
    }

    var play = function (v) {
      var r = v.play();
      if (r && r.catch) r.catch(function () { /* browser blocked it; poster shows */ });
    };

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(vids, play);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) play(e.target);
        else e.target.pause();
      });
    }, { rootMargin: '200px' });
    Array.prototype.forEach.call(vids, function (v) { io.observe(v); });
  };

  /* ---------- news show / hide ---------- */
  window.initNewsToggle = function (visibleCount) {
    var toggle = document.getElementById('news-toggle');
    if (!toggle) return;
    var extras = document.querySelectorAll('.news .extra');
    if (!extras.length) { toggle.style.display = 'none'; return; }
    var open = false;
    toggle.addEventListener('click', function () {
      open = !open;
      Array.prototype.forEach.call(extras, function (el) {
        el.style.display = open ? '' : 'none';
      });
      toggle.textContent = open ? '– show fewer' : '+ show earlier';
    });
  };
})();
