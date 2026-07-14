(function () {
  var DECKS = window.FC_DECKS;

  var params  = new URLSearchParams(window.location.search);
  var key     = window.FC_TOPIC || params.get('topic') || 'kinematics';
  var deck;
  if (key === 'all') {
    deck = { title: 'All Equations', back: '../equations/', cards: [] };
    Object.keys(DECKS).forEach(function (k) { deck.cards = deck.cards.concat(DECKS[k].cards); });
  } else {
    deck = DECKS[key] || DECKS['kinematics'];
  }
  var allCards = deck.cards;

  var starredKey = 'fc-stars-' + key;
  var starred = new Set(JSON.parse(localStorage.getItem(starredKey) || '[]'));
  function saveStars() { localStorage.setItem(starredKey, JSON.stringify(Array.from(starred))); }

  document.title = deck.title + ' Flashcards';
  var backLink = document.getElementById('fcBackLink');
  backLink.href = window.FC_TOPIC ? '../' : deck.back;
  backLink.innerHTML = '&#8592; ' + deck.title;

  var cardEl      = document.getElementById('fcCard');
  var frontEl     = document.getElementById('fcFront');
  var backEl      = document.getElementById('fcBack');
  var descEl      = document.getElementById('fcDesc');
  var frontLabel  = document.getElementById('fcFrontLabel');
  var backLabel   = document.getElementById('fcBackLabel');
  var counter     = document.getElementById('fcCounter');
  var cardCounter = document.getElementById('fcCardCounter');
  var cardCounterBack = document.getElementById('fcCardCounterBack');
  var fill       = document.getElementById('fcFill');
  var hint       = document.getElementById('fcHint');
  var prevBtn    = document.getElementById('fcPrev');
  var nextBtn    = document.getElementById('fcNext');
  var starBtn    = document.getElementById('fcStar');
  var scene      = document.querySelector('.fc-scene');

  var filterMode    = 'both';
  var shuffleMode   = false;
  var filteredCards = [];
  var filteredIdxs  = [];  // parallel: original index in allCards for each filtered card
  var idx     = 0;
  var flipped = false;

  function buildDeck() {
    filteredCards = [];
    filteredIdxs  = [];
    allCards.forEach(function (c, i) {
      var include;
      if      (filterMode === 'formula') include = !c.type || c.type === 'formula';
      else if (filterMode === 'tf')      include = c.type === 'tf';
      else if (filterMode === 'starred') include = starred.has(i);
      else                               include = true;
      if (include) { filteredCards.push(c); filteredIdxs.push(i); }
    });
    if (shuffleMode) {
      for (var i = filteredCards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tc = filteredCards[i]; filteredCards[i] = filteredCards[j]; filteredCards[j] = tc;
        var ti = filteredIdxs[i];  filteredIdxs[i]  = filteredIdxs[j];  filteredIdxs[j]  = ti;
      }
    }
    idx = 0;
  }

  function goTo(i) {
    idx = i;
    flipped = false;
    cardEl.classList.remove('flipped');
    hint.textContent = 'tap card to reveal';

    var card = filteredCards[idx];
    var isTf = card.type === 'tf';

    frontLabel.textContent = isTf ? 'true or false' : 'concept';
    backLabel.textContent  = isTf ? 'answer' : 'formula';

    var counterText = (idx + 1) + ' / ' + filteredCards.length;
    counter.textContent = counterText;
    if (cardCounter) cardCounter.textContent = counterText;
    if (cardCounterBack) cardCounterBack.textContent = counterText;
    fill.style.width = ((idx + 1) / filteredCards.length * 100) + '%';
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === filteredCards.length - 1;
    starBtn.classList.toggle('active', starred.has(filteredIdxs[idx]));

    frontEl.innerHTML = card.q;
    backEl.innerHTML  = card.a;
    if (descEl) descEl.innerHTML = (!isTf && card.desc) ? card.desc : '';

    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetClear([frontEl, backEl, descEl]);
      MathJax.typesetPromise([frontEl, backEl, descEl]).catch(function () {});
    }
  }

  function showEmpty(msg) {
    scene.innerHTML = '<p class="fc-empty">' + (msg || 'No cards match this filter.') + '</p>';
    counter.textContent = '0 / 0';
    fill.style.width = '0%';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    starBtn.classList.remove('active');
    hint.textContent = '';
  }

  function applyFilter(mode) {
    filterMode = mode;
    buildDeck();
    if (filteredCards.length === 0) {
      showEmpty(mode === 'starred' ? 'No starred cards yet. Star cards with &#9733;.' : 'No cards match this filter.');
    } else {
      if (!document.getElementById('fcCard')) {
        scene.innerHTML = '<div class="fc-card" id="fcCard"><div class="fc-face fc-face-front"><span class="fc-face-label" id="fcFrontLabel">concept</span><span class="fc-card-counter" id="fcCardCounter"></span><p class="fc-concept" id="fcFront"></p></div><div class="fc-face fc-face-back"><span class="fc-face-label" id="fcBackLabel">formula</span><span class="fc-card-counter" id="fcCardCounterBack"></span><div class="fc-formula" id="fcBack"></div><p class="fc-desc" id="fcDesc"></p></div></div>';
        cardEl          = document.getElementById('fcCard');
        frontEl         = document.getElementById('fcFront');
        backEl          = document.getElementById('fcBack');
        descEl          = document.getElementById('fcDesc');
        frontLabel      = document.getElementById('fcFrontLabel');
        backLabel       = document.getElementById('fcBackLabel');
        cardCounter     = document.getElementById('fcCardCounter');
        cardCounterBack = document.getElementById('fcCardCounterBack');
        attachCardListeners();
      }
      goTo(0);
    }
  }

  function flipCard() {
    flipped = !flipped;
    cardEl.classList.toggle('flipped', flipped);
    hint.textContent = flipped ? 'tap card to flip back' : 'tap card to reveal';
  }

  var touchStartX = null, touchStartY = null;
  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = null; touchStartY = null;
    if (Math.abs(dx) < 30 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && idx < filteredCards.length - 1) goTo(idx + 1);
    else if (dx > 0 && idx > 0) goTo(idx - 1);
  }

  function attachCardListeners() {
    cardEl.addEventListener('click', flipCard);
    cardEl.addEventListener('touchstart', onTouchStart, { passive: true });
    cardEl.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  attachCardListeners();

  prevBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (idx > 0) goTo(idx - 1);
  });

  nextBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (idx < filteredCards.length - 1) goTo(idx + 1);
  });

  starBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var origIdx = filteredIdxs[idx];
    if (starred.has(origIdx)) {
      starred.delete(origIdx);
      starBtn.classList.remove('active');
      if (filterMode === 'starred') {
        filteredCards.splice(idx, 1);
        filteredIdxs.splice(idx, 1);
        if (filteredCards.length === 0) {
          showEmpty('No starred cards yet. Star cards with &#9733;.');
        } else {
          goTo(Math.min(idx, filteredCards.length - 1));
        }
      }
    } else {
      starred.add(origIdx);
      starBtn.classList.add('active');
    }
    saveStars();
  });

  var shuffleBtn = document.getElementById('fcShuffle');
  shuffleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    shuffleMode = !shuffleMode;
    shuffleBtn.classList.toggle('active', shuffleMode);
    buildDeck();
    if (filteredCards.length === 0) showEmpty(filterMode === 'starred' ? 'No starred cards yet. Star cards with &#9733;.' : 'No cards match this filter.');
    else goTo(0);
  });

  document.querySelectorAll('.fc-filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.fc-filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilter(btn.getAttribute('data-mode'));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft'  && idx > 0)                       goTo(idx - 1);
    if (e.key === 'ArrowRight' && idx < filteredCards.length - 1) goTo(idx + 1);
    if ((e.key === ' ' || e.key === 'Enter')
        && document.activeElement !== prevBtn
        && document.activeElement !== nextBtn) {
      e.preventDefault();
      var card = document.getElementById('fcCard');
      if (card) card.click();
    }
  });

  buildDeck();
  goTo(0);
})();
