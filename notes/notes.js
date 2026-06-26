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

// Prev / next note navigation (top & bottom of page)
(function () {
  var pageEl = document.querySelector('.page');
  if (!pageEl) return;

  fetch('/notes-manifest.json')
    .then(function (r) { return r.json(); })
    .then(function (manifest) {
      var notes = manifest.htmlNotes || [];
      if (notes.length < 2) return;

      var base = '/' + (manifest.htmlNotesBase || 'notes/');
      var path = window.location.pathname.replace(/\/index\.html$/, '/');
      if (path.charAt(path.length - 1) !== '/') path += '/';

      var idx = -1;
      notes.forEach(function (n, i) {
        var np = base + n.path.replace(/\/index\.html$/, '') + '/';
        if (path === np) idx = i;
      });
      if (idx === -1) return;

      var prev = idx > 0 ? notes[idx - 1] : null;
      var next = idx < notes.length - 1 ? notes[idx + 1] : null;
      if (!prev && !next) return;

      function buildNav() {
        var nav = document.createElement('div');
        nav.className = 'note-nav';
        if (prev) {
          var a = document.createElement('a');
          a.className = 'note-nav-link note-nav-prev';
          a.href = base + prev.path.replace(/\/index\.html$/, '') + '/';
          a.textContent = prev.title;
          nav.appendChild(a);
        }
        if (next) {
          var a = document.createElement('a');
          a.className = 'note-nav-link note-nav-next';
          a.href = base + next.path.replace(/\/index\.html$/, '') + '/';
          a.textContent = next.title;
          nav.appendChild(a);
        }
        return nav;
      }

      var header = pageEl.querySelector('header');
      if (header) header.after(buildNav());
      pageEl.appendChild(buildNav());
    })
    .catch(function () {});
})();
