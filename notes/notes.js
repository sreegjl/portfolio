// Track page visit for progress
try {
  var visited = JSON.parse(localStorage.getItem('notesVisited') || '{}');
  var path = window.location.pathname.replace(/\/index\.html$/, '/');
  if (path.charAt(path.length - 1) !== '/') path += '/';
  visited[path] = true;
  localStorage.setItem('notesVisited', JSON.stringify(visited));
} catch(e) {}

// Fade in header and sections top to bottom on page load
if (window.gsap) {
  gsap.to('.page > header, .page > .section', {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.12
  });
}

// Study mode toggle: hide answers/values until clicked
const studyToggle = document.getElementById('studyToggle');
const page = document.querySelector('.page');

if (studyToggle && page) {
  studyToggle.addEventListener('click', () => {
    const entering = !page.classList.contains('study-mode');
    page.classList.toggle('study-mode');
    if (!entering) {
      document.querySelectorAll('.revealed').forEach(el => el.classList.remove('revealed'));
    }
    document.dispatchEvent(new CustomEvent('studymodechange', { detail: { active: entering } }));
  });

  document.addEventListener('click', e => {
    if (!page.classList.contains('study-mode')) return;
    const target = e.target.closest('.row-val, .badge, .formula, .graph-caption');
    if (target) target.classList.toggle('revealed');
  });
}

// Table of contents
(function () {
  const sections = document.querySelectorAll('.page > .section');
  if (sections.length < 2) return;

  const navEl = document.querySelector('nav');
  const pageEl = document.querySelector('.page');

  var toc = document.createElement('nav');
  toc.className = 'toc';

  var inner = document.createElement('div');
  inner.className = 'toc-inner';

  sections.forEach(function (section, i) {
    var label = section.querySelector('.section-label');
    if (!label) return;
    var id = 'section-' + i;
    section.id = id;
    var a = document.createElement('a');
    a.href = '#' + id;
    a.className = 'toc-link';
    a.textContent = label.textContent;
    inner.appendChild(a);
  });

  toc.appendChild(inner);

  var wrapper = document.createElement('div');
  wrapper.className = 'page-wrapper';
  pageEl.parentNode.insertBefore(wrapper, pageEl);
  wrapper.appendChild(pageEl);
  wrapper.appendChild(toc);

  if (navEl) {
    toc.style.setProperty('--nav-h', navEl.offsetHeight + 'px');
  }

  requestAnimationFrame(function () { toc.classList.add('visible'); });

  var links = toc.querySelectorAll('.toc-link');
  var ticking = false;

  function updateActive() {
    var navH = navEl ? navEl.offsetHeight : 0;
    var offset = navH + 100;
    var maxScroll = document.body.scrollHeight - window.innerHeight;
    var current = null;

    sections.forEach(function (s) {
      if (!s.id) return;
      var top = s.getBoundingClientRect().top;
      if (top <= offset) {
        current = s.id;
      } else if (top < window.innerHeight * 0.4) {
        var neededScroll = window.scrollY + (top - offset);
        if (neededScroll > maxScroll) current = s.id;
      }
    });

    links.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { updateActive(); ticking = false; });
      ticking = true;
    }
  });
  updateActive();

  toc.addEventListener('click', function (e) {
    var link = e.target.closest('.toc-link');
    if (!link) return;
    e.preventDefault();
    var target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    var navH = navEl ? navEl.offsetHeight : 0;
    var y = target.getBoundingClientRect().top + window.scrollY - navH - 16;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });

})();

// Unified meta bar: prev/next + flashcards + practice + study toggle
(function () {
  var pageEl = document.querySelector('.page');
  if (!pageEl) return;

  var resourceMap = {
    'kinematics':      { fc: 'kinematics',     practice: '/notes/quiz-1a/' },
    'force-dynamics':  { fc: 'dynamics',        practice: '/notes/quiz-2a/' },
    'forces':          { fc: 'forces',          practice: '/notes/quiz-3a/' },
    'circular-motion': { fc: 'circular-motion', practice: '/notes/quiz-4a/' },
    'work-energy':     { fc: 'work-energy',     practice: null }
  };

  // Maps practice page paths to the note folder they belong to
  var practiceToNote = {
    '/notes/quiz-1a/': 'kinematics',
    '/notes/quiz-2a/': 'force-dynamics',
    '/notes/quiz-3a/': 'forces',
    '/notes/quiz-4a/': 'circular-motion'
  };

  fetch('/notes-manifest.json')
    .then(function (r) { return r.json(); })
    .then(function (manifest) {
      var allNotes = (manifest.htmlNotes || []).filter(function (n) { return !/^quiz-/.test(n.path); });
      var base  = '/' + (manifest.htmlNotesBase || 'notes/');
      var path  = window.location.pathname.replace(/\/index\.html$/, '/');
      if (path.charAt(path.length - 1) !== '/') path += '/';

      var idx = -1;
      allNotes.forEach(function (n, i) {
        var np = base + n.path.replace(/\/index\.html$/, '') + '/';
        if (path === np) idx = i;
      });

      var prev, next, res, isPractice = false;

      if (idx !== -1) {
        // Note page
        prev = idx > 0 ? allNotes[idx - 1] : null;
        next = idx < allNotes.length - 1 ? allNotes[idx + 1] : null;
        var folder = path.replace(base, '').replace(/\/$/, '');
        res = resourceMap[folder] || null;
      } else {
        // Practice page — prev = corresponding note, next = note after it
        var noteFolder = practiceToNote[path];
        if (!noteFolder) return;
        var noteIdx = -1;
        allNotes.forEach(function (n, i) {
          if (base + n.path.replace(/\/index\.html$/, '') + '/' === base + noteFolder + '/') noteIdx = i;
        });
        if (noteIdx === -1) return;
        isPractice = true;
        prev = allNotes[noteIdx];
        next = noteIdx < allNotes.length - 1 ? allNotes[noteIdx + 1] : null;
        res = null;
      }

      // ── Top meta bar ──────────────────────────────
      var bar = document.createElement('div');
      bar.className = 'note-metabar';

      var left = document.createElement('div');
      left.className = 'note-metabar-left';

      if (prev) {
        var pl = document.createElement('a');
        pl.className = 'note-nav-link note-nav-prev';
        pl.href = base + prev.path.replace(/\/index\.html$/, '') + '/';
        pl.textContent = prev.title;
        left.appendChild(pl);
      }
      if (prev && next) {
        var sep = document.createElement('span');
        sep.className = 'note-metabar-sep';
        sep.textContent = '|';
        left.appendChild(sep);
      }
      if (next) {
        var nl = document.createElement('a');
        nl.className = 'note-nav-link note-nav-next';
        nl.href = base + next.path.replace(/\/index\.html$/, '') + '/';
        nl.textContent = next.title;
        left.appendChild(nl);
      }
      bar.appendChild(left);

      var right = document.createElement('div');
      right.className = 'note-metabar-right';

      if (res) {
        var fcSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';
        var fcLink = document.createElement('a');
        fcLink.className = 'note-resource-link';
        fcLink.href = base + 'flashcards/?topic=' + res.fc;
        fcLink.innerHTML = fcSvg + ' Flashcards';
        right.appendChild(fcLink);

        if (res.practice) {
          var prSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
          var prLink = document.createElement('a');
          prLink.className = 'note-resource-link';
          prLink.href = res.practice;
          prLink.innerHTML = prSvg + ' Practice';
          right.appendChild(prLink);
        }
      }

      // Move study toggle into meta bar (note pages only)
      if (!isPractice) {
        var toggle = document.getElementById('studyToggle');
        if (toggle) right.appendChild(toggle);
      }

      bar.appendChild(right);

      var header = pageEl.querySelector('header');
      if (header) header.after(bar);
      else pageEl.insertBefore(bar, pageEl.firstChild);

      // ── Bottom prev/next nav ───────────────────────
      if (prev || next) {
        var bottomNav = document.createElement('div');
        bottomNav.className = 'note-nav';
        if (prev) {
          var pa = document.createElement('a');
          pa.className = 'note-nav-link note-nav-prev';
          pa.href = base + prev.path.replace(/\/index\.html$/, '') + '/';
          pa.textContent = prev.title;
          bottomNav.appendChild(pa);
        }
        if (next) {
          var na = document.createElement('a');
          na.className = 'note-nav-link note-nav-next';
          na.href = base + next.path.replace(/\/index\.html$/, '') + '/';
          na.textContent = next.title;
          bottomNav.appendChild(na);
        }
        pageEl.appendChild(bottomNav);
      }
    })
    .catch(function () {});
})();
