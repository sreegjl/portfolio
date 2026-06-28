function initQuiz() {
  var total = 0, correct = 0;
  var scoreEl = document.querySelector('.quiz-score');

  function updateScore() {
    if (scoreEl) scoreEl.textContent = total > 0 ? correct + ' / ' + total + ' correct' : '';
  }

  document.querySelectorAll('.quiz-q').forEach(function (q) {
    var opts = q.querySelectorAll('.quiz-opt');
    var explain = q.querySelector('.quiz-explain');
    var answered = false;

    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (answered) return;
        answered = true;
        total++;

        var isCorrect = opt.dataset.correct === 'true';
        if (isCorrect) correct++;

        opt.classList.add(isCorrect ? 'quiz-correct' : 'quiz-wrong');

        if (!isCorrect) {
          opts.forEach(function (o) {
            if (o.dataset.correct === 'true') o.classList.add('quiz-correct');
          });
        }

        opts.forEach(function (o) { o.classList.add('quiz-locked'); });

        if (explain) explain.classList.add('show');
        updateScore();
      });
    });

    var inputWrap = q.querySelector('.quiz-input-wrap');
    if (inputWrap) {
      var input = inputWrap.querySelector('.quiz-input');
      var btn = inputWrap.querySelector('.quiz-submit');
      var ans = parseFloat(inputWrap.dataset.answer);
      var tol = parseFloat(inputWrap.dataset.tolerance || '0.5');

      function checkInput() {
        if (answered) return;
        var val = parseFloat(input.value);
        if (isNaN(val)) return;
        answered = true;
        total++;

        var isCorrect = Math.abs(val - ans) <= tol;
        if (isCorrect) correct++;

        input.style.borderColor = isCorrect ? 'var(--accent-teal)' : 'var(--accent-coral)';
        input.style.background = isCorrect ? 'var(--accent-teal-bg)' : 'var(--accent-coral-bg)';
        btn.disabled = true;

        if (explain) explain.classList.add('show');
        updateScore();
      }

      if (btn) btn.addEventListener('click', checkInput);
      if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkInput(); });
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initQuiz();

  var eqPanel = document.getElementById('eqPanel');
  var pageEl = document.querySelector('.page');
  if (eqPanel && pageEl) {
    var isWide = window.matchMedia('(min-width: 1160px)');

    function setupLayout() {
      var existingWrapper = document.querySelector('.page-wrapper');
      if (isWide.matches) {
        if (!existingWrapper) {
          var wrapper = document.createElement('div');
          wrapper.className = 'page-wrapper';
          pageEl.parentNode.insertBefore(wrapper, pageEl);
          wrapper.appendChild(pageEl);
        }
        var w = pageEl.parentElement;
        w.appendChild(eqPanel);
        eqPanel.style.display = '';
        eqPanel.classList.remove('show');
      } else {
        if (existingWrapper) {
          existingWrapper.parentNode.insertBefore(pageEl, existingWrapper);
          existingWrapper.remove();
        }
        var header = pageEl.querySelector('header');
        var quizTop = pageEl.querySelector('.quiz-top');
        var insertBefore = quizTop ? quizTop.nextSibling : (header ? header.nextSibling : pageEl.firstChild);
        pageEl.insertBefore(eqPanel, insertBefore);
        eqPanel.style.display = '';
        eqPanel.classList.remove('show');
      }
    }

    setupLayout();
    isWide.addEventListener('change', setupLayout);

    var eqTitle = eqPanel.querySelector('.quiz-eqs-title');
    if (eqTitle) {
      eqPanel.classList.add('sidebar-collapsed');
      eqTitle.addEventListener('click', function () {
        eqPanel.classList.toggle('sidebar-collapsed');
      });
    }
  }
});
