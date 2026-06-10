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
  });

  document.addEventListener('click', e => {
    if (!page.classList.contains('study-mode')) return;
    const target = e.target.closest('.row-val, .badge');
    if (target) target.classList.toggle('revealed');
  });
}
