var QuizGen = (function () {
  function rand(min, max, step) {
    step = step || 1;
    var steps = Math.round((max - min) / step);
    return +(min + Math.round(Math.random() * steps) * step).toFixed(6);
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function makeOpts(correct, wrongs) {
    var isNumeric = typeof correct === 'number';
    var seen = {}; seen[String(correct)] = true;
    var filtered = [];
    wrongs.forEach(function (w) {
      var key = isNumeric ? (+w).toFixed(2) : String(w);
      if (!seen[key] && (isNumeric ? (+w > 0 && +w !== +correct) : (w !== correct))) {
        seen[key] = true;
        filtered.push(isNumeric ? +((+w).toFixed(2)) : w);
      }
    });
    if (isNumeric) {
      while (filtered.length < 3) {
        var off = correct * (1 + (filtered.length + 1) * 0.3);
        off = +(off).toFixed(1);
        if (!seen[off] && off > 0) { seen[off] = true; filtered.push(off); }
        else filtered.push(+(correct + filtered.length * 7 + 3).toFixed(1));
      }
    }
    var all = [{ val: correct, correct: true }];
    filtered.slice(0, 3).forEach(function (w) { all.push({ val: w, correct: false }); });
    shuffle(all);
    return all;
  }

  function renderQ(el, text, opts, explain, unit) {
    var qText = el.querySelector('.quiz-q-text');
    var qOpts = el.querySelector('.quiz-opts');
    var qExpl = el.querySelector('.quiz-explain');
    if (qText) qText.innerHTML = text;
    if (qOpts) {
      qOpts.innerHTML = '';
      var letters = ['A', 'B', 'C', 'D'];
      opts.forEach(function (o, i) {
        var div = document.createElement('div');
        div.className = 'quiz-opt';
        div.dataset.correct = o.correct ? 'true' : 'false';
        div.innerHTML = '<span class="quiz-opt-letter">' + letters[i] + '</span><span class="quiz-opt-text">\\(' + o.val + (unit || '') + '\\)</span>';
        qOpts.appendChild(div);
      });
    }
    if (qExpl && explain) qExpl.innerHTML = explain;
    if (window.MathJax) MathJax.typesetPromise([el]).catch(function () {});
  }

  function steps() {
    var s = '';
    for (var i = 0; i < arguments.length; i++) {
      s += '<div class="quiz-step"><span class="quiz-step-num">' + (i + 1) + '</span><span>' + arguments[i] + '</span></div>';
    }
    return s;
  }

  function renderInput(el, text, answer, tolerance, explain) {
    var qText = el.querySelector('.quiz-q-text');
    var wrap = el.querySelector('.quiz-input-wrap');
    var qExpl = el.querySelector('.quiz-explain');
    if (qText) qText.innerHTML = text;
    if (wrap) {
      wrap.dataset.answer = answer;
      wrap.dataset.tolerance = tolerance || '0.5';
    }
    if (qExpl && explain) qExpl.innerHTML = explain;
    if (window.MathJax) MathJax.typesetPromise([el]).catch(function () {});
  }

  return {
    kinematicsDistance: function (el) {
      var a = rand(2, 8, 1);
      var t = rand(2, 6, 1);
      var x = +(0.5 * a * t * t).toFixed(1);
      var text = 'A car starts from rest and accelerates at \\(' + a + '\\text{ m/s}^2\\) for \\(' + t + '\\) seconds. How far does it travel?';
      var wrongs = [+(a * t).toFixed(1), +(a * t * t).toFixed(1), +(0.5 * a * t).toFixed(1)];
      var explain = steps(
        'Given: \\(v_0 = 0\\), \\(a = ' + a + '\\text{ m/s}^2\\), \\(t = ' + t + '\\text{ s}\\)',
        'Use \\(x = v_0 t + \\tfrac{1}{2}at^2\\)',
        'Plug in: \\(x = 0 + \\tfrac{1}{2}(' + a + ')(' + t + ')^2\\)',
        '\\(= \\tfrac{1}{2}(' + a + ')(' + (t*t) + ') = ' + x + '\\text{ m}\\)'
      );
      renderQ(el, text, makeOpts(x, wrongs), explain, '\\text{ m}');
    },

    projectileVx: function (el) {
      var v0 = rand(20, 50, 5);
      var angle = rand(25, 65, 5);
      var vx = +(v0 * Math.cos(angle * Math.PI / 180)).toFixed(1);
      var text = 'A projectile is launched at \\(' + angle + '°\\) with \\(v_0 = ' + v0 + '\\text{ m/s}\\). What is the horizontal velocity at the peak?';
      var vy = +(v0 * Math.sin(angle * Math.PI / 180)).toFixed(1);
      var wrongs = [0, vy, v0];
      var explain = steps(
        'Horizontal velocity is constant (no horizontal acceleration)',
        '\\(v_x = v_0\\cos\\theta = ' + v0 + ' \\times \\cos' + angle + '°\\)',
        '\\(= ' + v0 + ' \\times ' + Math.cos(angle * Math.PI / 180).toFixed(3) + ' = ' + vx + '\\text{ m/s}\\)',
        'Same value at launch, peak, and landing'
      );
      renderQ(el, text, makeOpts(vx, wrongs), explain, '\\text{ m/s}');
    },

    newton2: function (el) {
      var m = rand(2, 10, 1);
      var a = rand(2, 8, 1);
      var F = m * a;
      var text = 'A \\(' + m + '\\text{ kg}\\) box is pushed with \\(' + F + '\\text{ N}\\) on a frictionless surface. What is the acceleration?';
      var wrongs = [+(F * m).toFixed(1), +(m / F).toFixed(2), +(F / (m * 2)).toFixed(1)];
      var explain = steps(
        'On a frictionless surface, applied force is the only horizontal force',
        'Newton\'s 2nd law: \\(a = \\dfrac{\\sum F}{m}\\)',
        '\\(a = \\dfrac{' + F + '}{' + m + '} = ' + a + '\\text{ m/s}^2\\)'
      );
      renderQ(el, text, makeOpts(a, wrongs), explain, '\\text{ m/s}^2');
    },

    elevatorScale: function (el) {
      var m = rand(40, 90, 5);
      var a = rand(1, 4, 0.5);
      var dir = Math.random() > 0.5 ? 'upward' : 'downward';
      var sign = dir === 'upward' ? 1 : -1;
      var Fn = +(m * (9.8 + sign * a)).toFixed(0);
      var text = 'A \\(' + m + '\\text{ kg}\\) person stands on a scale in an elevator accelerating ' + dir + ' at \\(' + a + '\\text{ m/s}^2\\). What does the scale read?';
      var explain = steps(
        'The scale reads the normal force \\(F_n\\)',
        'Newton\'s 2nd law (vertical): \\(F_n - mg = ma\\)',
        'Solve: \\(F_n = m(g ' + (sign > 0 ? '+' : '-') + ' a)\\)',
        '\\(= ' + m + '(9.8 ' + (sign > 0 ? '+' : '-') + ' ' + a + ') = ' + Fn + '\\text{ N}\\)'
      );
      renderInput(el, text, Fn, 5, explain);
    },

    inclineParallel: function (el) {
      var m = rand(3, 15, 1);
      var angle = rand(20, 55, 5);
      var Fg = +(m * 9.8).toFixed(1);
      var Fpar = +(Fg * Math.sin(angle * Math.PI / 180)).toFixed(1);
      var Fperp = +(Fg * Math.cos(angle * Math.PI / 180)).toFixed(1);
      var text = 'A \\(' + m + '\\text{ kg}\\) block sits on a \\(' + angle + '°\\) incline. What is the gravity component parallel to the slope?';
      var wrongs = [Fperp, Fg, +(Fg * Math.tan(angle * Math.PI / 180)).toFixed(1)];
      var explain = steps(
        '\\(F_{g\\parallel} = mg\\sin\\theta\\)',
        '\\(mg = ' + m + ' \\times 9.8 = ' + Fg + '\\text{ N}\\)',
        '\\(F_{g\\parallel} = ' + Fg + ' \\times \\sin' + angle + '° = ' + Fg + ' \\times ' + Math.sin(angle * Math.PI / 180).toFixed(3) + '\\)',
        '\\(= ' + Fpar + '\\text{ N}\\)',
        'Tip: \\(\\sin\\) = parallel, \\(\\cos\\) = perpendicular'
      );
      renderQ(el, text, makeOpts(Fpar, wrongs), explain, '\\text{ N}');
    },

    springForce: function (el) {
      var k = rand(50, 300, 25);
      var dx = rand(0.05, 0.3, 0.05);
      var Fs = +(k * dx).toFixed(1);
      var text = 'A spring with \\(k = ' + k + '\\text{ N/m}\\) is stretched \\(' + dx + '\\text{ m}\\). What force does it exert?';
      var wrongs = [+(k / dx).toFixed(1), +(k * dx * dx).toFixed(1), +(Math.sqrt(k * dx)).toFixed(1)];
      var explain = steps(
        'Hooke\'s law: \\(F_s = k|\\Delta x|\\)',
        '\\(F_s = ' + k + ' \\times ' + dx + '\\)',
        '\\(= ' + Fs + '\\text{ N}\\)',
        'The force points back toward equilibrium (restoring force)'
      );
      renderQ(el, text, makeOpts(Fs, wrongs), explain, '\\text{ N}');
    },

    frictionCheck: function (el) {
      var m = rand(5, 25, 5);
      var mus = +(0.2 + Math.random() * 0.4).toFixed(1);
      var muk = +(mus * 0.75).toFixed(1);
      var Fn = +(m * 9.8).toFixed(1);
      var fsMax = +(mus * Fn).toFixed(1);
      var fk = +(muk * Fn).toFixed(1);
      var slides = Math.random() > 0.5;
      var Fapp = slides ? +(fsMax + rand(5, 20, 5)).toFixed(0) : +(fsMax * rand(0.4, 0.8, 0.1)).toFixed(0);
      Fapp = +Fapp;
      var actualSlides = Fapp > fsMax;
      var fActual = actualSlides ? fk : Fapp;
      var text = 'A \\(' + m + '\\text{ kg}\\) box on a surface (\\(\\mu_s = ' + mus + '\\), \\(\\mu_k = ' + muk + '\\)) is pushed with \\(' + Fapp + '\\text{ N}\\). What is the friction force?';
      var wrongs;
      if (actualSlides) {
        wrongs = [fsMax, Fapp, +(mus * Fn).toFixed(1)];
      } else {
        wrongs = [fsMax, fk, Fn];
      }
      var explain = actualSlides ? steps(
        'Max static friction: \\(f_{s,\\max} = \\mu_s mg = ' + mus + ' \\times ' + Fn + ' = ' + fsMax + '\\text{ N}\\)',
        'Compare: \\(F_{app} = ' + Fapp + ' > ' + fsMax + '\\text{ N}\\)',
        'Box slides! Friction switches to kinetic',
        '\\(f_k = \\mu_k mg = ' + muk + ' \\times ' + Fn + ' = ' + fk + '\\text{ N}\\)'
      ) : steps(
        'Max static friction: \\(f_{s,\\max} = \\mu_s mg = ' + mus + ' \\times ' + Fn + ' = ' + fsMax + '\\text{ N}\\)',
        'Compare: \\(F_{app} = ' + Fapp + ' < ' + fsMax + '\\text{ N}\\)',
        'Box stays put. Static friction matches the push exactly',
        '\\(f_s = F_{app} = ' + Fapp + '\\text{ N}\\)'
      );
      renderQ(el, text, makeOpts(fActual, wrongs), explain, '\\text{ N}');
    },

    newton3: function (el) {
      var F = rand(10, 80, 5);
      var text = 'A person pushes a wall with \\(' + F + '\\text{ N}\\) of force. By Newton\'s 3rd law, the wall pushes back with:';
      var wrongs = [0, +(F / 2).toFixed(0), +(F * 2).toFixed(0)];
      var explain = steps(
        'Newton\'s 3rd law: every force has an equal and opposite reaction',
        'The wall pushes back with \\(' + F + '\\text{ N}\\)',
        'This is always true, even if nothing moves',
        'The wall not moving doesn\'t mean the reaction is zero'
      );
      renderQ(el, text, makeOpts(F, wrongs), explain, '\\text{ N}');
    },

    twoBlockSystem: function (el) {
      var m1 = rand(2, 8, 1);
      var m2 = rand(2, 8, 1);
      while (m2 === m1) m2 = rand(2, 8, 1);
      var a = rand(2, 6, 1);
      var F = (m1 + m2) * a;
      var text = 'Two blocks (\\(' + m1 + '\\text{ kg}\\) and \\(' + m2 + '\\text{ kg}\\)) sit together on a frictionless surface. A \\(' + F + '\\text{ N}\\) force pushes the \\(' + m1 + '\\text{ kg}\\) block into the other. What is the acceleration of the system?';
      var wrongs = [+(F / m1).toFixed(1), +(F / m2).toFixed(1), +(F * (m1 + m2)).toFixed(0)];
      var explain = steps(
        'Treat both blocks as one system',
        'Contact force between them is internal (cancels)',
        '\\(a = \\dfrac{F}{m_1 + m_2} = \\dfrac{' + F + '}{' + m1 + ' + ' + m2 + '}\\)',
        '\\(= \\dfrac{' + F + '}{' + (m1+m2) + '} = ' + a + '\\text{ m/s}^2\\)'
      );
      renderQ(el, text, makeOpts(a, wrongs), explain, '\\text{ m/s}^2');
    },

    inverseSquare: function (el) {
      var factor = rand(2, 5, 1);
      var ratio = +(1 / (factor * factor)).toFixed(2);
      var text = 'Planet B is \\(' + factor + '\\times\\) farther from a star than Planet A (same masses). How does the gravitational force on B compare?';
      var wrongs = [+(1 / factor).toFixed(2), 1, +factor.toFixed(0)];
      var explain = steps(
        'Inverse square law: \\(F_g \\propto \\dfrac{1}{r^2}\\)',
        'Distance is \\(' + factor + '\\times\\) larger',
        'Force changes by \\(\\dfrac{1}{' + factor + '^2} = \\dfrac{1}{' + (factor * factor) + '} = ' + ratio + '\\)',
        '\\(F_B = ' + ratio + ' \\times F_A\\)'
      );
      renderQ(el, text, makeOpts(ratio, wrongs), explain, '\\times F_A');
    },

    centripetalAccel: function (el) {
      var v = rand(4, 15, 1);
      var r = rand(2, 8, 1);
      var ac = +(v * v / r).toFixed(1);
      var text = 'An object moves at \\(' + v + '\\text{ m/s}\\) in a circle of radius \\(' + r + '\\text{ m}\\). What is the centripetal acceleration?';
      var wrongs = [+(v / r).toFixed(1), +(v * r).toFixed(1), +(v * v * r).toFixed(1)];
      var explain = steps(
        '\\(a_c = \\dfrac{v^2}{r}\\)',
        '\\(= \\dfrac{' + v + '^2}{' + r + '} = \\dfrac{' + (v*v) + '}{' + r + '}\\)',
        '\\(= ' + ac + '\\text{ m/s}^2\\), toward the center'
      );
      renderQ(el, text, makeOpts(ac, wrongs), explain, '\\text{ m/s}^2');
    },

    centripetalForce: function (el) {
      var m = rand(2, 10, 1);
      var v = rand(3, 10, 1);
      var r = rand(2, 6, 1);
      var Fc = +(m * v * v / r).toFixed(1);
      var text = 'A \\(' + m + '\\text{ kg}\\) ball moves at \\(' + v + '\\text{ m/s}\\) in a circle of radius \\(' + r + '\\text{ m}\\). What net radial force is required?';
      var wrongs = [+(m * v / r).toFixed(1), +(v * v / r).toFixed(1), +(m * v * v * r).toFixed(1)];
      var explain = steps(
        '\\(\\sum F_{rad} = \\dfrac{mv^2}{r}\\)',
        '\\(= \\dfrac{' + m + ' \\times ' + v + '^2}{' + r + '} = \\dfrac{' + m + ' \\times ' + (v*v) + '}{' + r + '}\\)',
        '\\(= ' + Fc + '\\text{ N}\\)',
        '"Centripetal force" is just the net radial force, not a new force type'
      );
      renderQ(el, text, makeOpts(Fc, wrongs), explain, '\\text{ N}');
    },

    verticalCircleMinSpeed: function (el) {
      var r = rand(1, 5, 0.5);
      var vMin = +Math.sqrt(9.8 * r).toFixed(1);
      var text = 'A ball is swung in a vertical circle of radius \\(' + r + '\\text{ m}\\). What is the minimum speed at the top to maintain circular motion?';
      var explain = steps(
        'Min speed is when \\(F_T = 0\\) at the top',
        'Gravity alone provides centripetal force: \\(mg = \\dfrac{mv^2}{r}\\)',
        'Cancel \\(m\\): \\(v^2 = gr\\)',
        '\\(v_{min} = \\sqrt{9.8 \\times ' + r + '} = ' + vMin + '\\text{ m/s}\\)',
        'Mass cancels, so all objects need the same min speed'
      );
      renderInput(el, text, vMin, 0.3, explain);
    },

    deriveAccelIncline: function (el) {
      var hasFriction = Math.random() > 0.5;
      var text = hasFriction
        ? 'A block slides down a rough incline at angle \\(\\theta\\) with kinetic friction coefficient \\(\\mu_k\\). Derive the acceleration.'
        : 'A block slides down a frictionless incline at angle \\(\\theta\\). Derive the acceleration.';
      var correct = hasFriction ? 'g(\\sin\\theta - \\mu_k\\cos\\theta)' : 'g\\sin\\theta';
      var wrongs = hasFriction
        ? ['g(\\cos\\theta - \\mu_k\\sin\\theta)', 'g\\sin\\theta', 'g(\\sin\\theta + \\mu_k\\cos\\theta)']
        : ['g\\cos\\theta', 'g\\tan\\theta', 'g(\\sin\\theta - \\cos\\theta)'];
      var explain = hasFriction ? steps(
        'Forces along slope: \\(mg\\sin\\theta\\) down, \\(\\mu_k mg\\cos\\theta\\) up',
        'Newton\'s 2nd law: \\(ma = mg\\sin\\theta - \\mu_k mg\\cos\\theta\\)',
        'Cancel \\(m\\): \\(a = g(\\sin\\theta - \\mu_k\\cos\\theta)\\)'
      ) : steps(
        'Only force along slope: \\(mg\\sin\\theta\\) down',
        'Newton\'s 2nd law: \\(ma = mg\\sin\\theta\\)',
        'Cancel \\(m\\): \\(a = g\\sin\\theta\\)'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    deriveSpringDisplacement: function (el) {
      var text = 'A mass \\(m\\) hangs from a spring with constant \\(k\\) at equilibrium. Derive the displacement \\(\\Delta x\\) from the spring\'s natural length.';
      var correct = '\\dfrac{mg}{k}';
      var wrongs = ['\\dfrac{k}{mg}', '\\dfrac{mg}{k^2}', '\\dfrac{m}{kg}'];
      var explain = steps(
        'At equilibrium, spring force balances gravity',
        '\\(k\\Delta x = mg\\)',
        'Solve: \\(\\Delta x = \\dfrac{mg}{k}\\)'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    deriveOrbitalSpeed: function (el) {
      var text = 'A satellite of mass \\(m\\) orbits a planet of mass \\(M\\) at radius \\(r\\). Derive the orbital speed \\(v\\).';
      var correct = '\\sqrt{\\dfrac{GM}{r}}';
      var wrongs = ['\\sqrt{\\dfrac{Gm}{r}}', '\\sqrt{\\dfrac{GMm}{r}}', '\\dfrac{GM}{r}'];
      var explain = steps(
        'Gravity provides centripetal force: \\(\\dfrac{mv^2}{r} = \\dfrac{GMm}{r^2}\\)',
        'Cancel \\(m\\) from both sides',
        'Cancel one \\(r\\): \\(v^2 = \\dfrac{GM}{r}\\)',
        '\\(v = \\sqrt{\\dfrac{GM}{r}}\\)',
        'Satellite mass cancels out completely'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    deriveRangeProjectile: function (el) {
      var text = 'A projectile is launched from ground level at angle \\(\\theta\\) with speed \\(v_0\\). Derive the range \\(R\\) (horizontal distance when it lands).';
      var correct = '\\dfrac{v_0^2 \\sin 2\\theta}{g}';
      var wrongs = ['\\dfrac{v_0^2 \\sin\\theta}{g}', '\\dfrac{v_0^2 \\cos 2\\theta}{g}', '\\dfrac{2v_0^2 \\sin\\theta}{g}'];
      var explain = steps(
        'Time of flight: \\(t = \\dfrac{2v_0\\sin\\theta}{g}\\)',
        'Range: \\(R = v_x \\cdot t = v_0\\cos\\theta \\cdot \\dfrac{2v_0\\sin\\theta}{g}\\)',
        '\\(= \\dfrac{2v_0^2 \\sin\\theta \\cos\\theta}{g}\\)',
        'Use identity \\(2\\sin\\theta\\cos\\theta = \\sin 2\\theta\\)',
        '\\(R = \\dfrac{v_0^2 \\sin 2\\theta}{g}\\)'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    deriveWeightlessSpeed: function (el) {
      var text = 'A car drives over a circular hill of radius \\(r\\). Derive the speed at which a passenger would feel weightless at the top.';
      var correct = '\\sqrt{gr}';
      var wrongs = ['\\sqrt{2gr}', '\\dfrac{g}{r}', 'gr'];
      var explain = steps(
        'Weightless means \\(F_n = 0\\)',
        'At the top: \\(mg = \\dfrac{mv^2}{r}\\)',
        'Cancel \\(m\\): \\(g = \\dfrac{v^2}{r}\\)',
        '\\(v = \\sqrt{gr}\\)',
        'Same as min speed for a vertical loop'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    loopNormalForce: function (el) {
      var scenarios = [
        { setup: 'A pilot flies a plane in a vertical loop of radius \\(r\\). At the top of the loop the plane moves with speed \\(v\\).', obj: 'the seat on the pilot', who: 'pilot' },
        { setup: 'A bucket of water is swung in a vertical circle of radius \\(r\\). At the top the bucket moves with speed \\(v\\).', obj: 'the bucket on the water', who: 'water' },
        { setup: 'A marble rolls along the inside of a vertical circular track of radius \\(r\\). At the top it moves with speed \\(v\\).', obj: 'the track on the marble', who: 'marble' },
        { setup: 'A car drives over a circular hill of radius \\(r\\) at speed \\(v\\) at the top.', obj: 'the road on the car', who: 'car' }
      ];
      var s = scenarios[Math.floor(Math.random() * scenarios.length)];
      var text = s.setup + ' The ' + s.who + ' has mass \\(m\\). Derive an expression for the normal force of ' + s.obj + ' at the top.';
      var correct = 'm\\left(\\dfrac{v^2}{r} - g\\right)';
      var wrongs = [
        'm\\left(g + \\dfrac{v^2}{r}\\right)',
        'm\\left(g - \\dfrac{v^2}{r}\\right)',
        'mg\\left(1 + \\dfrac{v^2}{r}\\right)'
      ];
      var explain = steps(
        'At the top, both \\(F_n\\) and \\(F_g\\) point toward the center',
        'Newton\'s 2nd law (radial): \\(F_n + mg = \\dfrac{mv^2}{r}\\)',
        'Solve for \\(F_n\\): \\(F_n = \\dfrac{mv^2}{r} - mg\\)',
        '\\(= m\\left(\\dfrac{v^2}{r} - g\\right)\\)'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    kineticEnergy: function (el) {
      var m = rand(1, 12, 1);
      var v = rand(2, 15, 1);
      var K = +(0.5 * m * v * v).toFixed(1);
      var text = 'A \\(' + m + '\\text{ kg}\\) object moves at \\(' + v + '\\text{ m/s}\\). What is its kinetic energy?';
      var wrongs = [+(m * v).toFixed(1), +(m * v * v).toFixed(1), +(0.5 * m * v).toFixed(1)];
      var explain = steps(
        '\\(K = \\dfrac{1}{2}mv^2\\)',
        '\\(= \\dfrac{1}{2}(' + m + ')(' + v + ')^2 = \\dfrac{1}{2}(' + m + ')(' + (v*v) + ')\\)',
        '\\(= ' + K + '\\text{ J}\\)'
      );
      renderQ(el, text, makeOpts(K, wrongs), explain, '\\text{ J}');
    },

    workByForce: function (el) {
      var F = rand(20, 120, 10);
      var d = rand(3, 15, 1);
      var angle = [0, 30, 45, 60][Math.floor(Math.random() * 4)];
      var W = +(F * d * Math.cos(angle * Math.PI / 180)).toFixed(1);
      var cosStr = angle === 0 ? '1' : angle === 30 ? '\\tfrac{\\sqrt{3}}{2}' : angle === 45 ? '\\tfrac{\\sqrt{2}}{2}' : '\\tfrac{1}{2}';
      var text = 'A force of \\(' + F + '\\text{ N}\\) acts on a crate at \\(' + angle + '°\\) above the horizontal, moving it \\(' + d + '\\text{ m}\\) horizontally. How much work is done?';
      var wrongs = [+(F * d).toFixed(1), +(F * d * Math.sin(angle * Math.PI / 180)).toFixed(1), +(F * d * Math.cos(angle * Math.PI / 180) * 0.5).toFixed(1)];
      var explain = steps(
        '\\(W = Fd\\cos\\theta\\)',
        '\\(= ' + F + ' \\times ' + d + ' \\times \\cos' + angle + '°\\)',
        '\\(= ' + F + ' \\times ' + d + ' \\times ' + cosStr + '\\)',
        '\\(= ' + W + '\\text{ J}\\)'
      );
      renderQ(el, text, makeOpts(W, wrongs), explain, '\\text{ J}');
    },

    workEnergyFinalSpeed: function (el) {
      var m = rand(2, 10, 1);
      var v0 = rand(0, 6, 1);
      var Wnet = rand(20, 150, 10);
      var Kf = 0.5 * m * v0 * v0 + Wnet;
      var vf = +(Math.sqrt(2 * Kf / m)).toFixed(1);
      var text = 'A \\(' + m + '\\text{ kg}\\) object' + (v0 > 0 ? ' moving at \\(' + v0 + '\\text{ m/s}\\)' : ' initially at rest') + ' has \\(' + Wnet + '\\text{ J}\\) of net work done on it. What is its final speed?';
      var wrongs = [+(Math.sqrt(2 * Wnet / m)).toFixed(1), +(v0 + Wnet / m).toFixed(1), +(Math.sqrt(Kf / m)).toFixed(1)];
      var K0 = +(0.5 * m * v0 * v0).toFixed(1);
      var Kff = +Kf.toFixed(1);
      var explain = v0 > 0 ? steps(
        'Work-energy theorem: \\(W_{net} = \\Delta K = K_f - K_i\\)',
        '\\(K_i = \\tfrac{1}{2}(' + m + ')(' + v0 + ')^2 = ' + K0 + '\\text{ J}\\)',
        '\\(K_f = K_i + W_{net} = ' + K0 + ' + ' + Wnet + ' = ' + Kff + '\\text{ J}\\)',
        '\\(v_f = \\sqrt{\\dfrac{2K_f}{m}} = \\sqrt{\\dfrac{2(' + Kff + ')}{' + m + '}} = ' + vf + '\\text{ m/s}\\)'
      ) : steps(
        'Work-energy theorem: \\(W_{net} = \\Delta K\\)',
        '\\(K_i = 0\\), so \\(K_f = W_{net} = ' + Wnet + '\\text{ J}\\)',
        '\\(v_f = \\sqrt{\\dfrac{2K_f}{m}} = \\sqrt{\\dfrac{2(' + Wnet + ')}{' + m + '}}\\)',
        '\\(= ' + vf + '\\text{ m/s}\\)'
      );
      renderQ(el, text, makeOpts(vf, wrongs), explain, '\\text{ m/s}');
    },

    springPE: function (el) {
      var k = rand(100, 600, 50);
      var dx = rand(0.05, 0.40, 0.05);
      var Us = +(0.5 * k * dx * dx).toFixed(2);
      var text = 'A spring (\\(k = ' + k + '\\text{ N/m}\\)) is compressed \\(' + dx + '\\text{ m}\\). How much elastic potential energy is stored?';
      var wrongs = [+(k * dx).toFixed(2), +(k * dx * dx).toFixed(2), +(0.5 * k * dx).toFixed(2)];
      var explain = steps(
        '\\(U_s = \\dfrac{1}{2}k(\\Delta x)^2\\)',
        '\\(= \\dfrac{1}{2}(' + k + ')(' + dx + ')^2 = \\dfrac{1}{2}(' + k + ')(' + (dx*dx).toFixed(4) + ')\\)',
        '\\(= ' + Us + '\\text{ J}\\)'
      );
      renderQ(el, text, makeOpts(Us, wrongs), explain, '\\text{ J}');
    },

    energyConservationSpeed: function (el) {
      var h = rand(2, 20, 1);
      var v0 = 0;
      var vf = +(Math.sqrt(2 * 9.8 * h)).toFixed(1);
      var text = 'A ball is released from rest at a height of \\(' + h + '\\text{ m}\\). Ignoring air resistance, how fast is it moving just before hitting the ground?';
      var wrongs = [+(Math.sqrt(9.8 * h)).toFixed(1), +(9.8 * h).toFixed(1), +(Math.sqrt(2 * 9.8 * h) * 0.5).toFixed(1)];
      var explain = steps(
        'No friction: mechanical energy is conserved. \\(K_i + U_i = K_f + U_f\\)',
        'Released from rest: \\(K_i = 0\\). Set ground as \\(U = 0\\) reference.',
        '\\(mgh = \\dfrac{1}{2}mv_f^2\\)',
        'Cancel \\(m\\): \\(v_f = \\sqrt{2gh} = \\sqrt{2(9.8)(' + h + ')}\\)',
        '\\(= ' + vf + '\\text{ m/s}\\)'
      );
      renderQ(el, text, makeOpts(vf, wrongs), explain, '\\text{ m/s}');
    },

    energyConservationHeight: function (el) {
      var m = rand(1, 8, 1);
      var v0 = rand(4, 14, 1);
      var hMax = +(v0 * v0 / (2 * 9.8)).toFixed(1);
      var text = 'A \\(' + m + '\\text{ kg}\\) ball is thrown straight up at \\(' + v0 + '\\text{ m/s}\\). How high does it rise (ignoring air resistance)?';
      var wrongs = [+(v0 / 9.8).toFixed(1), +(v0 * v0 / 9.8).toFixed(1), +(v0 / (2 * 9.8)).toFixed(2)];
      var explain = steps(
        'At the peak, \\(v = 0\\) so \\(K_f = 0\\). Energy conserved.',
        '\\(\\dfrac{1}{2}mv_0^2 = mgh_{\\max}\\)',
        'Cancel \\(m\\): \\(h_{\\max} = \\dfrac{v_0^2}{2g}\\)',
        '\\(= \\dfrac{' + v0 + '^2}{2(9.8)} = \\dfrac{' + (v0*v0) + '}{19.6}\\)',
        '\\(= ' + hMax + '\\text{ m}\\)'
      );
      renderQ(el, text, makeOpts(hMax, wrongs), explain, '\\text{ m}');
    },

    averagePower: function (el) {
      var F = rand(50, 400, 50);
      var d = rand(10, 80, 10);
      var t = rand(4, 20, 2);
      var W = F * d;
      var P = +(W / t).toFixed(1);
      var text = 'A motor applies \\(' + F + '\\text{ N}\\) to push a cart \\(' + d + '\\text{ m}\\) in \\(' + t + '\\text{ s}\\). What is the average power delivered?';
      var wrongs = [+(F * t / d).toFixed(1), +(W).toFixed(0), +(F / t).toFixed(1)];
      var explain = steps(
        'First find the work done: \\(W = Fd = ' + F + ' \\times ' + d + ' = ' + W + '\\text{ J}\\)',
        'Average power: \\(P_{avg} = \\dfrac{W}{\\Delta t}\\)',
        '\\(= \\dfrac{' + W + '}{' + t + '} = ' + P + '\\text{ W}\\)'
      );
      renderQ(el, text, makeOpts(P, wrongs), explain, '\\text{ W}');
    },

    frictionEnergyLoss: function (el) {
      var m = rand(2, 10, 1);
      var v0 = rand(4, 12, 1);
      var muk = +(0.2 + Math.random() * 0.3).toFixed(1);
      var d = rand(3, 12, 1);
      var Wf = +(muk * m * 9.8 * d).toFixed(1);
      var K0 = +(0.5 * m * v0 * v0).toFixed(1);
      var Kf = +(Math.max(0, K0 - Wf)).toFixed(1);
      var vf = +(Math.sqrt(2 * Math.max(0, +Kf) / m)).toFixed(1);
      var text = 'A \\(' + m + '\\text{ kg}\\) block moves at \\(' + v0 + '\\text{ m/s}\\) on a surface with \\(\\mu_k = ' + muk + '\\). After sliding \\(' + d + '\\text{ m}\\), what is its speed?';
      var wrongs = [+(v0 - muk * 9.8 * d / v0).toFixed(1), +(v0 * (1 - muk)).toFixed(1), +(Math.sqrt(2 * K0 / m) * (1 - muk)).toFixed(1)];
      var explain = steps(
        '\\(K_i = \\tfrac{1}{2}(' + m + ')(' + v0 + ')^2 = ' + K0 + '\\text{ J}\\)',
        'Work by friction: \\(W_f = -\\mu_k mg d = -' + muk + '(' + m + ')(9.8)(' + d + ') = -' + Wf + '\\text{ J}\\)',
        '\\(K_f = K_i + W_f = ' + K0 + ' - ' + Wf + ' = ' + Kf + '\\text{ J}\\)',
        '\\(v_f = \\sqrt{\\dfrac{2K_f}{m}} = \\sqrt{\\dfrac{2(' + Kf + ')}{' + m + '}} = ' + vf + '\\text{ m/s}\\)'
      );
      renderQ(el, text, makeOpts(vf, wrongs), explain, '\\text{ m/s}');
    },

    deriveWorkEnergyTheorem: function (el) {
      var text = 'A constant net force \\(F_{net}\\) acts on mass \\(m\\) over displacement \\(d\\) from rest. Derive an expression for the final speed \\(v_f\\).';
      var correct = '\\sqrt{\\dfrac{2F_{net}\\,d}{m}}';
      var wrongs = ['\\dfrac{F_{net}\\,d}{m}', '\\sqrt{\\dfrac{F_{net}\\,d}{m}}', '\\dfrac{2F_{net}\\,d}{m}'];
      var explain = steps(
        'Net work done: \\(W_{net} = F_{net}\\,d\\)',
        'Work-energy theorem: \\(W_{net} = \\Delta K = \\tfrac{1}{2}mv_f^2 - 0\\)',
        '\\(F_{net}\\,d = \\tfrac{1}{2}mv_f^2\\)',
        'Solve: \\(v_f^2 = \\dfrac{2F_{net}\\,d}{m}\\)',
        '\\(v_f = \\sqrt{\\dfrac{2F_{net}\\,d}{m}}\\)'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    keplerPeriod: function (el) {
      var r1 = 1;
      var r2 = rand(2, 5, 1);
      var T2 = +Math.pow(r2, 1.5).toFixed(2);
      var text = 'Planet A orbits a star at \\(' + r1 + '\\text{ AU}\\) with period \\(1\\text{ yr}\\). Planet B orbits at \\(' + r2 + '\\text{ AU}\\). What is Planet B\'s period?';
      var wrongs = [+r2.toFixed(0), +(r2 * r2).toFixed(0), +(Math.sqrt(r2)).toFixed(2)];
      var explain = steps(
        'Kepler\'s 3rd law: \\(T^2 \\propto r^3\\) for the same star',
        '\\(\\dfrac{T_B^2}{T_A^2} = \\dfrac{r_B^3}{r_A^3}\\), with \\(T_A = 1\\text{ yr}\\), \\(r_A = 1\\text{ AU}\\)',
        '\\(T_B^2 = ' + r2 + '^3 = ' + (r2*r2*r2) + '\\)',
        '\\(T_B = ' + r2 + '^{1.5} = ' + T2 + '\\text{ yr}\\)'
      );
      renderQ(el, text, makeOpts(T2, wrongs), explain, '\\text{ yr}');
    },

    momentumOf: function (el) {
      var m = rand(2, 12, 1);
      var v = rand(3, 15, 1);
      var p = +(m * v).toFixed(1);
      var text = 'A \\(' + m + '\\text{ kg}\\) object moves at \\(' + v + '\\text{ m/s}\\). What is the magnitude of its momentum?';
      var wrongs = [+(0.5 * m * v * v).toFixed(1), +(m * v * v).toFixed(1), +(0.5 * m * v).toFixed(1)];
      var explain = steps(
        '\\(p = mv\\)',
        '\\(= ' + m + ' \\times ' + v + ' = ' + p + '\\text{ kg·m/s}\\)',
        'Momentum is a vector: it points along the velocity'
      );
      renderQ(el, text, makeOpts(p, wrongs), explain, '\\text{ kg·m/s}');
    },

    impulseFromForce: function (el) {
      var F = rand(20, 120, 10);
      var t = rand(0.5, 3, 0.5);
      var J = +(F * t).toFixed(1);
      var text = 'A net force of \\(' + F + '\\text{ N}\\) acts on a cart for \\(' + t + '\\text{ s}\\). What is the change in the cart\'s momentum?';
      var wrongs = [+(F / t).toFixed(1), +F.toFixed(1), +(0.5 * F * t).toFixed(1)];
      var explain = steps(
        'Impulse: \\(J = F\\Delta t = ' + F + ' \\times ' + t + ' = ' + J + '\\text{ N·s}\\)',
        'Impulse-momentum theorem: \\(J_{net} = \\Delta p\\)',
        '\\(\\Delta p = ' + J + '\\text{ kg·m/s}\\) (N·s and kg·m/s are the same unit)'
      );
      renderQ(el, text, makeOpts(J, wrongs), explain, '\\text{ kg·m/s}');
    },

    impulseFinalSpeed: function (el) {
      var m = rand(2, 8, 1);
      var v0 = rand(0, 5, 1);
      var F = rand(10, 60, 5);
      var t = rand(2, 6, 1);
      var vf = +(v0 + F * t / m).toFixed(1);
      var J = +(F * t).toFixed(0);
      var text = 'A \\(' + m + '\\text{ kg}\\) cart' + (v0 > 0 ? ' moving at \\(' + v0 + '\\text{ m/s}\\)' : ' at rest') + ' is pushed by a \\(' + F + '\\text{ N}\\) net force for \\(' + t + '\\text{ s}\\). What is its final speed?';
      var explain = steps(
        'Impulse: \\(J = F\\Delta t = ' + F + ' \\times ' + t + ' = ' + J + '\\text{ N·s}\\)',
        'Impulse-momentum theorem: \\(J = \\Delta p = m(v_f - v_0)\\)',
        'Solve: \\(v_f = v_0 + \\dfrac{J}{m} = ' + v0 + ' + \\dfrac{' + J + '}{' + m + '}\\)',
        '\\(= ' + vf + '\\text{ m/s}\\)'
      );
      renderInput(el, text, vf, 0.2, explain);
    },

    ftGraphImpulse: function (el) {
      var F = rand(40, 200, 20);
      var t = rand(2, 10, 2);
      var J = +(0.5 * F * t).toFixed(1);
      var text = 'The net force on an object rises linearly from \\(0\\) to \\(' + F + '\\text{ N}\\) over \\(' + t + '\\text{ s}\\). From the force vs. time graph, what impulse is delivered?';
      var wrongs = [+(F * t).toFixed(1), +(2 * F * t).toFixed(1), +(F / t).toFixed(1)];
      var explain = steps(
        'Impulse = area under the \\(F\\) vs. \\(t\\) curve',
        'The graph is a triangle: area \\(= \\tfrac{1}{2} \\times \\text{base} \\times \\text{height}\\)',
        '\\(J = \\tfrac{1}{2}(' + t + ')(' + F + ') = ' + J + '\\text{ N·s}\\)',
        'This also equals \\(\\Delta p\\) by the impulse-momentum theorem'
      );
      renderQ(el, text, makeOpts(J, wrongs), explain, '\\text{ N·s}');
    },

    recoilSpeed: function (el) {
      var m1 = rand(2, 8, 1);
      var v1 = rand(20, 80, 10);
      var m2 = rand(200, 1000, 100);
      var v2 = +(m1 * v1 / m2).toFixed(2);
      var text = 'A \\(' + m2 + '\\text{ kg}\\) cannon at rest fires a \\(' + m1 + '\\text{ kg}\\) shell horizontally at \\(' + v1 + '\\text{ m/s}\\). What is the cannon\'s recoil speed?';
      var wrongs = [+(m1 * v1 / (m1 + m2)).toFixed(2), +(v1 * m2 / (m1 * 1000)).toFixed(2), +(v1 / m1).toFixed(2)];
      var explain = steps(
        'Total momentum starts at zero and must stay zero',
        '\\(0 = m_1 v_1 + m_2 v_2 \\implies m_2|v_2| = m_1 v_1\\)',
        '\\(|v_2| = \\dfrac{m_1 v_1}{m_2} = \\dfrac{' + m1 + ' \\times ' + v1 + '}{' + m2 + '}\\)',
        '\\(= ' + v2 + '\\text{ m/s}\\), opposite the shell'
      );
      renderQ(el, text, makeOpts(v2, wrongs), explain, '\\text{ m/s}');
    },

    comVelocity: function (el) {
      var m1 = rand(2, 6, 1);
      var v1 = rand(4, 10, 1);
      var m2 = rand(2, 6, 1);
      var v2 = rand(1, 4, 1);
      var vcm = +((m1 * v1 + m2 * v2) / (m1 + m2)).toFixed(1);
      var text = 'Two carts move in the same direction: \\(' + m1 + '\\text{ kg}\\) at \\(' + v1 + '\\text{ m/s}\\) and \\(' + m2 + '\\text{ kg}\\) at \\(' + v2 + '\\text{ m/s}\\). What is the velocity of the system\'s center of mass?';
      var wrongs = [+((v1 + v2) / 2).toFixed(1), +(v1 + v2).toFixed(1), +((m1 * v1 + m2 * v2) / 2).toFixed(1)];
      var explain = steps(
        '\\(v_{cm} = \\dfrac{p_{tot}}{M} = \\dfrac{m_1 v_1 + m_2 v_2}{m_1 + m_2}\\)',
        '\\(p_{tot} = ' + m1 + '(' + v1 + ') + ' + m2 + '(' + v2 + ') = ' + (m1 * v1 + m2 * v2) + '\\text{ kg·m/s}\\)',
        '\\(v_{cm} = \\dfrac{' + (m1 * v1 + m2 * v2) + '}{' + (m1 + m2) + '} = ' + vcm + '\\text{ m/s}\\)',
        'The simple average of the velocities is only right when the masses are equal'
      );
      renderQ(el, text, makeOpts(vcm, wrongs), explain, '\\text{ m/s}');
    },

    comPosition: function (el) {
      var m1 = rand(2, 6, 1);
      var m2 = m1 + rand(2, 6, 1);
      var x1 = rand(0, 4, 1);
      var x2 = x1 + rand(2, 6, 1);
      var xcm = +((m1 * x1 + m2 * x2) / (m1 + m2)).toFixed(2);
      var text = 'A \\(' + m1 + '\\text{ kg}\\) object sits at \\(x = ' + x1 + '\\text{ m}\\) and a \\(' + m2 + '\\text{ kg}\\) object sits at \\(x = ' + x2 + '\\text{ m}\\). Where is the center of mass of the system?';
      var wrongs = [+((x1 + x2) / 2).toFixed(2), +((m1 * x2 + m2 * x1) / (m1 + m2)).toFixed(2), +((m1 * x1 + m2 * x2) / 2).toFixed(2)];
      var explain = steps(
        '\\(x_{cm} = \\dfrac{m_1 x_1 + m_2 x_2}{m_1 + m_2}\\)',
        '\\(= \\dfrac{' + m1 + '(' + x1 + ') + ' + m2 + '(' + x2 + ')}{' + (m1 + m2) + '} = \\dfrac{' + (m1 * x1 + m2 * x2) + '}{' + (m1 + m2) + '}\\)',
        '\\(= ' + xcm + '\\text{ m}\\)',
        'It sits closer to the ' + m2 + '\\(\\text{ kg}\\) mass; the midpoint is only right for equal masses'
      );
      renderQ(el, text, makeOpts(xcm, wrongs), explain, '\\text{ m}');
    },

    comPushOff: function (el) {
      var v = rand(1, 3, 1);
      var t1 = rand(2, 4, 1);
      var dt = rand(2, 3, 1);
      var t2 = t1 + dt;
      var xcm = v * t2;
      var xc = v * t1 + (v + rand(1, 3, 1)) * dt;
      var xm = +((3 * xcm - xc) / 2).toFixed(1);
      var text = 'Two astronauts drift together through space at \\(' + v + '\\text{ m/s}\\), starting from the origin. At \\(t = ' + t1 + '\\text{ s}\\) they push apart. At \\(t = ' + t2 + '\\text{ s}\\) the lighter astronaut is at \\(x = ' + xc + '\\text{ m}\\). The other astronaut is twice as massive. Where is the heavier astronaut at \\(t = ' + t2 + '\\text{ s}\\)?';
      var explain = steps(
        'The push is internal, so \\(v_{cm}\\) stays \\(' + v + '\\text{ m/s}\\): \\(x_{cm} = ' + v + '(' + t2 + ') = ' + xcm + '\\text{ m}\\)',
        'With masses \\(2m\\) and \\(m\\): \\(x_{cm} = \\dfrac{2m\\,x_{heavy} + m\\,x_{light}}{3m}\\)',
        '\\(' + xcm + ' = \\dfrac{2x_{heavy} + ' + xc + '}{3}\\)',
        '\\(x_{heavy} = \\dfrac{3(' + xcm + ') - ' + xc + '}{2} = ' + xm + '\\text{ m}\\)'
      );
      renderInput(el, text, xm, 0.2, explain);
    },

    deriveReboundForce: function (el) {
      var text = 'A ball of mass \\(m\\) hits a wall at speed \\(v\\) and rebounds at the same speed. The contact lasts \\(\\Delta t\\). Derive the magnitude of the average force on the ball.';
      var correct = '\\dfrac{2mv}{\\Delta t}';
      var wrongs = ['\\dfrac{mv}{\\Delta t}', '\\dfrac{mv}{2\\Delta t}', '2mv\\,\\Delta t'];
      var explain = steps(
        'Take toward the wall as positive: \\(p_i = mv\\), \\(p_f = -mv\\)',
        '\\(\\Delta p = -mv - mv = -2mv\\) (the sign flip doubles the change)',
        'Impulse-momentum theorem: \\(F_{avg} = \\dfrac{|\\Delta p|}{\\Delta t}\\)',
        '\\(F_{avg} = \\dfrac{2mv}{\\Delta t}\\)'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    perfectlyInelasticVf: function (el) {
      var m1 = rand(2, 8, 1);
      var v1 = rand(6, 12, 1);
      var m2 = rand(2, 8, 1);
      var v2 = rand(0, 4, 1);
      var vf = +((m1 * v1 + m2 * v2) / (m1 + m2)).toFixed(1);
      var text = 'A \\(' + m1 + '\\text{ kg}\\) cart moving at \\(' + v1 + '\\text{ m/s}\\) catches up to a \\(' + m2 + '\\text{ kg}\\) cart ' + (v2 > 0 ? 'moving at \\(' + v2 + '\\text{ m/s}\\) in the same direction' : 'at rest') + ', and they couple together. What is their common final velocity?';
      var wrongs = [+((v1 + v2) / 2).toFixed(1), +(m1 * v1 / (m1 + m2)).toFixed(1), +(v1 - v2).toFixed(1)];
      var explain = steps(
        'Perfectly inelastic: the carts share one final velocity',
        'Conservation: \\(m_1 v_1 + m_2 v_2 = (m_1 + m_2)v_f\\)',
        '\\(p_{tot} = ' + m1 + '(' + v1 + ') + ' + m2 + '(' + v2 + ') = ' + (m1 * v1 + m2 * v2) + '\\text{ kg·m/s}\\)',
        '\\(v_f = \\dfrac{' + (m1 * v1 + m2 * v2) + '}{' + (m1 + m2) + '} = ' + vf + '\\text{ m/s}\\)'
      );
      renderQ(el, text, makeOpts(vf, wrongs), explain, '\\text{ m/s}');
    },

    elasticEqualMass: function (el) {
      var v = rand(2, 10, 1);
      var text = 'Cart A moving at \\(' + v + '\\text{ m/s}\\) collides <strong>elastically</strong> with an identical cart B at rest. What are the final velocities?';
      var correct = 'v_{A} = 0,\\;\\; v_{B} = ' + v + '\\text{ m/s}';
      var wrongs = [
        'v_{A} = v_{B} = ' + +(v / 2).toFixed(1) + '\\text{ m/s}',
        'v_{A} = -' + v + '\\text{ m/s},\\;\\; v_{B} = 0',
        'v_{A} = v_{B} = ' + v + '\\text{ m/s}'
      ];
      var explain = steps(
        'Equal masses in an elastic collision swap velocities (like billiard balls)',
        'Check momentum: \\(m(' + v + ') + 0 = 0 + m(' + v + ')\\) ✓',
        'Check kinetic energy: \\(\\tfrac{1}{2}m(' + v + ')^2 = \\tfrac{1}{2}m(' + v + ')^2\\) ✓',
        'Both moving at \\(' + +(v / 2).toFixed(1) + '\\text{ m/s}\\) conserves momentum but loses \\(K\\): that\'s the perfectly inelastic outcome'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    collisionFindV2f: function (el) {
      var m1 = rand(1, 4, 1);
      var v1i = rand(4, 10, 1);
      var m2 = rand(4, 10, 1);
      var v1f = rand(1, 3, 1);
      var v2f = +((m1 * (v1i + v1f)) / m2).toFixed(2);
      var text = 'A \\(' + m1 + '\\text{ kg}\\) ball moving at \\(' + v1i + '\\text{ m/s}\\) hits a \\(' + m2 + '\\text{ kg}\\) ball at rest and rebounds backward at \\(' + v1f + '\\text{ m/s}\\). What is the final speed of the \\(' + m2 + '\\text{ kg}\\) ball?';
      var explain = steps(
        'Conservation: \\(m_1 v_{1i} + 0 = m_1 v_{1f} + m_2 v_{2f}\\)',
        'Rebounding means \\(v_{1f} = -' + v1f + '\\text{ m/s}\\)',
        '\\(' + m1 + '(' + v1i + ') = ' + m1 + '(-' + v1f + ') + ' + m2 + 'v_{2f}\\)',
        '\\(v_{2f} = \\dfrac{' + m1 + '(' + v1i + ' + ' + v1f + ')}{' + m2 + '} = ' + v2f + '\\text{ m/s}\\)'
      );
      renderInput(el, text, v2f, 0.1, explain);
    },

    kineticEnergyLostStick: function (el) {
      var m1 = rand(2, 6, 1);
      var v1 = rand(6, 12, 1);
      var m2 = rand(2, 6, 1);
      var vf = m1 * v1 / (m1 + m2);
      var Ki = +(0.5 * m1 * v1 * v1).toFixed(1);
      var Kf = +(0.5 * (m1 + m2) * vf * vf).toFixed(1);
      var lost = +(Ki - Kf).toFixed(1);
      var text = 'A \\(' + m1 + '\\text{ kg}\\) lump of clay moving at \\(' + v1 + '\\text{ m/s}\\) sticks to a \\(' + m2 + '\\text{ kg}\\) block at rest. How much kinetic energy is converted to internal energy?';
      var wrongs = [Ki, Kf, +(Ki / 2).toFixed(1)];
      var explain = steps(
        'Momentum first: \\(v_f = \\dfrac{m_1 v_1}{m_1 + m_2} = \\dfrac{' + (m1 * v1) + '}{' + (m1 + m2) + '} = ' + +vf.toFixed(2) + '\\text{ m/s}\\)',
        '\\(K_i = \\tfrac{1}{2}(' + m1 + ')(' + v1 + ')^2 = ' + Ki + '\\text{ J}\\)',
        '\\(K_f = \\tfrac{1}{2}(' + (m1 + m2) + ')(' + +vf.toFixed(2) + ')^2 = ' + Kf + '\\text{ J}\\)',
        'Converted: \\(K_i - K_f = ' + Ki + ' - ' + Kf + ' = ' + lost + '\\text{ J}\\)',
        'Momentum is conserved, but kinetic energy is not'
      );
      renderQ(el, text, makeOpts(lost, wrongs), explain, '\\text{ J}');
    },

    missingMomentum: function (el) {
      var triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25]];
      var tr = triples[Math.floor(Math.random() * triples.length)];
      var a = tr[0], b = tr[1], c = tr[2];
      var text = 'Before a particle collision, the total momentum transverse to the beam is zero. Detectors measure two particles with transverse momenta \\(\\langle -' + a + ',\\, 0\\rangle\\) and \\(\\langle 0,\\, -' + b + '\\rangle\\) \\(\\text{GeV}/c\\). What is the magnitude of the missing momentum?';
      var wrongs = [a + b, Math.max(b - a, 1), b];
      var explain = steps(
        'Total transverse momentum must still be zero after the collision',
        'Detected total: \\(\\langle -' + a + ',\\, -' + b + '\\rangle\\)',
        'Missing momentum balances it: \\(\\langle ' + a + ',\\, ' + b + '\\rangle\\)',
        'Magnitude: \\(\\sqrt{' + a + '^2 + ' + b + '^2} = \\sqrt{' + (a * a + b * b) + '} = ' + c + '\\text{ GeV}/c\\)',
        'An undetected particle, such as a neutrino, carried this momentum away'
      );
      renderQ(el, text, makeOpts(c, wrongs), explain, '\\text{ GeV}/c');
    },

    lorentzFactor: function (el) {
      var betas = [0.5, 0.6, 0.8, 0.9];
      var b = betas[Math.floor(Math.random() * betas.length)];
      var g = +(1 / Math.sqrt(1 - b * b)).toFixed(2);
      var text = 'A proton moves at \\(v = ' + b + 'c\\). What is its Lorentz factor \\(\\gamma\\)?';
      var wrongs = [+Math.sqrt(1 - b * b).toFixed(2), +(1 - b * b).toFixed(2), +(1 / (1 - b * b)).toFixed(2)];
      var explain = steps(
        '\\(\\gamma = \\dfrac{1}{\\sqrt{1 - v^2/c^2}}\\)',
        '\\(v^2/c^2 = ' + b + '^2 = ' + +(b * b).toFixed(2) + '\\)',
        '\\(\\gamma = \\dfrac{1}{\\sqrt{1 - ' + +(b * b).toFixed(2) + '}} = \\dfrac{1}{\\sqrt{' + +(1 - b * b).toFixed(2) + '}} = ' + g + '\\)',
        'Then \\(\\vec{p} = \\gamma m \\vec{v}\\): the faster the particle, the more \\(\\gamma\\) matters'
      );
      renderQ(el, text, makeOpts(g, wrongs), explain, '');
    },

    derivePhotonMomentum: function (el) {
      var text = 'Starting from the relativistic energy equation \\(E^2 = p^2c^2 + m^2c^4\\), derive the momentum of a photon with energy \\(E\\).';
      var correct = '\\dfrac{E}{c}';
      var wrongs = ['Ec', '\\dfrac{E}{c^2}', '\\dfrac{c}{E}'];
      var explain = steps(
        'Photons are massless: set \\(m = 0\\)',
        '\\(E^2 = p^2c^2\\)',
        'Take the square root: \\(E = pc\\)',
        'Solve: \\(p = \\dfrac{E}{c}\\)',
        'Massless particles still carry momentum and energy'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    angularDisplacementRevs: function (el) {
      var rev = rand(1.5, 6, 0.5);
      var dth = +(rev * 2 * Math.PI).toFixed(1);
      var text = 'A potter\'s wheel completes \\(' + rev + '\\) counterclockwise revolutions. What is its total angular displacement?';
      var wrongs = [+(rev * Math.PI).toFixed(1), +(rev * 4 * Math.PI).toFixed(1), +rev.toFixed(1)];
      var explain = steps(
        'One revolution is \\(2\\pi\\text{ rad}\\)',
        '\\(\\Delta\\theta = ' + rev + ' \\times 2\\pi\\)',
        '\\(= ' + dth + '\\text{ rad}\\), counterclockwise (positive)',
        'Angular displacement keeps accumulating past \\(2\\pi\\); it does not reset each revolution'
      );
      renderQ(el, text, makeOpts(dth, wrongs), explain, '\\text{ rad}');
    },

    avgAngularVelocity: function (el) {
      var rev = rand(2, 8, 1);
      var t = rand(4, 16, 2);
      var w = +(2 * Math.PI * rev / t).toFixed(2);
      var text = 'A wind turbine blade completes \\(' + rev + '\\) revolutions in \\(' + t + '\\text{ s}\\). What is its average angular velocity?';
      var wrongs = [+(rev / t).toFixed(2), +(Math.PI * rev / t).toFixed(2), +(2 * Math.PI * rev * t).toFixed(1)];
      var explain = steps(
        'Convert to radians: \\(\\Delta\\theta = ' + rev + ' \\times 2\\pi = ' + +(2 * Math.PI * rev).toFixed(1) + '\\text{ rad}\\)',
        '\\(\\omega_{avg} = \\dfrac{\\Delta\\theta}{\\Delta t} = \\dfrac{' + +(2 * Math.PI * rev).toFixed(1) + '}{' + t + '}\\)',
        '\\(= ' + w + '\\text{ rad/s}\\)'
      );
      renderQ(el, text, makeOpts(w, wrongs), explain, '\\text{ rad/s}');
    },

    linearSpeedFromOmega: function (el) {
      var r = rand(1, 3, 0.5);
      var w = rand(1, 4, 0.5);
      var v = +(r * w).toFixed(2);
      var text = 'A carousel spins at \\(' + w + '\\text{ rad/s}\\). A rider stands \\(' + r + '\\text{ m}\\) from the central axis. What is the rider\'s linear speed?';
      var explain = steps(
        'Linear speed of a rotating point: \\(v = r\\omega\\)',
        '\\(v = ' + r + ' \\times ' + w + '\\)',
        '\\(= ' + v + '\\text{ m/s}\\), tangent to the rider\'s circular path',
        'Every rider shares the same \\(\\omega\\), but \\(v\\) grows with distance from the axis'
      );
      renderInput(el, text, v, 0.1, explain);
    },

    arcLengthFromAngle: function (el) {
      var r = rand(2, 6, 1);
      var th = rand(1.5, 6, 0.5);
      var s = +(r * th).toFixed(1);
      var text = 'A horse on a carousel is \\(' + r + '\\text{ m}\\) from the central axis. The carousel rotates through \\(' + th + '\\text{ rad}\\). How far does the horse travel along its circular path?';
      var wrongs = [+(th / r).toFixed(2), +(2 * r * th).toFixed(1), +(r + th).toFixed(1)];
      var explain = steps(
        'Arc length: \\(\\Delta s = r\\,\\Delta\\theta\\) (angle in radians)',
        '\\(\\Delta s = ' + r + ' \\times ' + th + '\\)',
        '\\(= ' + s + '\\text{ m}\\)',
        'A point twice as far from the axis would travel twice as far for the same angle'
      );
      renderQ(el, text, makeOpts(s, wrongs), explain, '\\text{ m}');
    },

    angularAccelStop: function (el) {
      var w0 = rand(6, 20, 2);
      var t = rand(2, 10, 1);
      var a = +(w0 / t).toFixed(2);
      var text = 'A table saw blade spins at \\(' + w0 + '\\text{ rad/s}\\) when it is switched off. It comes to rest in \\(' + t + '\\text{ s}\\). What is the magnitude of its constant angular acceleration?';
      var wrongs = [+(w0 * t).toFixed(1), +(w0 / (2 * t)).toFixed(2), +(2 * w0 / t).toFixed(2)];
      var explain = steps(
        '\\(\\alpha_{avg} = \\dfrac{\\Delta\\omega}{\\Delta t} = \\dfrac{\\omega - \\omega_0}{\\Delta t}\\)',
        '\\(= \\dfrac{0 - ' + w0 + '}{' + t + '} = -' + a + '\\text{ rad/s}^2\\)',
        'Magnitude: \\(' + a + '\\text{ rad/s}^2\\)',
        'The negative sign means \\(\\alpha\\) opposes the spin direction, slowing it down'
      );
      renderQ(el, text, makeOpts(a, wrongs), explain, '\\text{ rad/s}^2');
    },

    rotKinFinalOmega: function (el) {
      var w0 = rand(2, 8, 1);
      var a = rand(1, 4, 0.5);
      var t = rand(2, 6, 1);
      var w = +(w0 + a * t).toFixed(1);
      var text = 'A drone rotor spinning at \\(' + w0 + '\\text{ rad/s}\\) speeds up with a constant angular acceleration of \\(' + a + '\\text{ rad/s}^2\\) for \\(' + t + '\\text{ s}\\). What is its final angular velocity?';
      var wrongs = [+(a * t).toFixed(1), +(w0 + a).toFixed(1), +(w0 * a * t).toFixed(1)];
      var explain = steps(
        'Rotational kinematic equation: \\(\\omega = \\omega_0 + \\alpha t\\)',
        '\\(\\omega = ' + w0 + ' + (' + a + ')(' + t + ')\\)',
        '\\(= ' + w0 + ' + ' + +(a * t).toFixed(1) + ' = ' + w + '\\text{ rad/s}\\)'
      );
      renderQ(el, text, makeOpts(w, wrongs), explain, '\\text{ rad/s}');
    },

    rotKinAngleTurned: function (el) {
      var a = rand(0.5, 3, 0.5);
      var t = rand(2, 8, 1);
      var dth = +(0.5 * a * t * t).toFixed(1);
      var text = 'A lab centrifuge starts from rest and accelerates at a constant \\(' + a + '\\text{ rad/s}^2\\). Through what angle does it rotate during the first \\(' + t + '\\text{ s}\\)?';
      var explain = steps(
        'Starts from rest: \\(\\omega_0 = 0\\)',
        '\\(\\Delta\\theta = \\omega_0 t + \\tfrac{1}{2}\\alpha t^2 = 0 + \\tfrac{1}{2}(' + a + ')(' + t + ')^2\\)',
        '\\(= \\tfrac{1}{2}(' + a + ')(' + (t * t) + ') = ' + dth + '\\text{ rad}\\)',
        'That is \\(' + +(dth / (2 * Math.PI)).toFixed(1) + '\\) revolutions'
      );
      renderInput(el, text, dth, 0.5, explain);
    },

    rotKinNoTime: function (el) {
      var w0 = rand(1, 4, 1);
      var a = rand(0.5, 2, 0.5);
      var dth = rand(4, 12, 2);
      var w = +(Math.sqrt(w0 * w0 + 2 * a * dth)).toFixed(1);
      var text = 'A merry-go-round spinning at \\(' + w0 + '\\text{ rad/s}\\) is given a constant angular acceleration of \\(' + a + '\\text{ rad/s}^2\\) over an angular displacement of \\(' + dth + '\\text{ rad}\\). What is its final angular speed?';
      var wrongs = [+(Math.sqrt(2 * a * dth)).toFixed(1), +(w0 + a * dth).toFixed(1), +(w0 * w0 + 2 * a * dth).toFixed(1)];
      var explain = steps(
        'No time given, so use \\(\\omega^2 = \\omega_0^2 + 2\\alpha\\,\\Delta\\theta\\)',
        '\\(\\omega^2 = (' + w0 + ')^2 + 2(' + a + ')(' + dth + ') = ' + +(w0 * w0 + 2 * a * dth).toFixed(1) + '\\)',
        '\\(\\omega = \\sqrt{' + +(w0 * w0 + 2 * a * dth).toFixed(1) + '} = ' + w + '\\text{ rad/s}\\)'
      );
      renderQ(el, text, makeOpts(w, wrongs), explain, '\\text{ rad/s}');
    },

    deriveStoppingAngle: function (el) {
      var text = 'A turntable spins at angular speed \\(\\omega_0\\) when its motor is switched off. It slows with a constant angular acceleration of magnitude \\(\\alpha\\). Derive the angle it rotates through before coming to rest.';
      var correct = '\\dfrac{\\omega_0^2}{2\\alpha}';
      var wrongs = ['\\dfrac{\\omega_0^2}{\\alpha}', '\\dfrac{\\omega_0}{2\\alpha}', '\\dfrac{2\\omega_0^2}{\\alpha}'];
      var explain = steps(
        'Time is unknown, so use \\(\\omega^2 = \\omega_0^2 + 2\\alpha\\,\\Delta\\theta\\)',
        'It comes to rest: \\(\\omega = 0\\), and the acceleration is \\(-\\alpha\\) (opposing the spin)',
        '\\(0 = \\omega_0^2 - 2\\alpha\\,\\Delta\\theta\\)',
        'Solve: \\(\\Delta\\theta = \\dfrac{\\omega_0^2}{2\\alpha}\\)',
        'Doubling the initial spin rate quadruples the angle needed to stop'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    torqueFromAngle: function (el) {
      var r = rand(0.2, 0.5, 0.05);
      var F = rand(40, 120, 10);
      var angles = [30, 45, 60];
      var ang = angles[Math.floor(Math.random() * angles.length)];
      var tau = +(r * F * Math.sin(ang * Math.PI / 180)).toFixed(1);
      var text = 'A cyclist pushes on a \\(' + r + '\\text{ m}\\) pedal crank with \\(' + F + '\\text{ N}\\) at an angle of \\(' + ang + '^\\circ\\) to the crank arm. What is the magnitude of the torque about the axle?';
      var wrongs = [+(r * F).toFixed(1), +(r * F * Math.cos(ang * Math.PI / 180)).toFixed(1), +(F * Math.sin(ang * Math.PI / 180)).toFixed(1)];
      var explain = steps(
        'Torque: \\(\\tau = rF\\sin\\theta\\)',
        '\\(\\tau = (' + r + ')(' + F + ')\\sin ' + ang + '^\\circ\\)',
        '\\(= ' + tau + '\\text{ N·m}\\)',
        'Only the force component perpendicular to the crank twists it; \\(rF\\) alone would overcount'
      );
      renderQ(el, text, makeOpts(tau, wrongs), explain, '\\text{ N·m}');
    },

    leverArmConcept: function (el) {
      var F = rand(20, 60, 10);
      var text = 'A force of \\(' + F + '\\text{ N}\\) is applied to a heavy door. Which application produces the largest torque about the hinges?';
      var correct = '\\text{at the handle, perpendicular to the door}';
      var wrongs = [
        '\\text{at the handle, aimed at the hinges}',
        '\\text{at the middle, perpendicular to the door}',
        '\\text{at the hinges, perpendicular to the door}'
      ];
      var explain = steps(
        '\\(\\tau = rF\\sin\\theta\\): torque grows with distance from the axis AND with the perpendicular component',
        'The handle maximizes \\(r\\); pushing perpendicular makes \\(\\sin\\theta = 1\\)',
        'A force aimed at the hinges has zero lever arm, so zero torque no matter how hard you push',
        'Pushing at the hinges makes \\(r = 0\\), also zero torque'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    torquePerpendicular: function (el) {
      var r = rand(0.2, 0.6, 0.1);
      var F = rand(30, 90, 5);
      var tau = +(r * F).toFixed(1);
      var text = 'A plumber pulls perpendicular to the end of a \\(' + r + '\\text{ m}\\) pipe wrench with \\(' + F + '\\text{ N}\\). What torque does the pull exert on the fitting?';
      var explain = steps(
        'Perpendicular force: \\(\\theta = 90^\\circ\\), so \\(\\sin\\theta = 1\\)',
        '\\(\\tau = rF = (' + r + ')(' + F + ')\\)',
        '\\(= ' + tau + '\\text{ N·m}\\)',
        'The full length of the wrench acts as the lever arm'
      );
      renderInput(el, text, tau, 0.2, explain);
    },

    seesawBalance: function (el) {
      var m1 = rand(20, 40, 5);
      var r1 = rand(1, 2, 0.5);
      var r2 = rand(2.5, 4, 0.5);
      var m2 = +((m1 * r1) / r2).toFixed(1);
      var text = 'A \\(' + m1 + '\\text{ kg}\\) child sits \\(' + r1 + '\\text{ m}\\) from the pivot of a seesaw. What mass must a friend sitting \\(' + r2 + '\\text{ m}\\) on the other side have to balance it?';
      var wrongs = [+((m1 * r2) / r1).toFixed(1), m1, +(m1 * r1).toFixed(1)];
      var explain = steps(
        'Balanced: \\(\\tau_{net} = 0\\), so the two torques about the pivot cancel',
        '\\(m_1 g r_1 = m_2 g r_2\\); the \\(g\\) cancels',
        '\\(m_2 = \\dfrac{m_1 r_1}{r_2} = \\dfrac{(' + m1 + ')(' + r1 + ')}{' + r2 + '}\\)',
        '\\(= ' + m2 + '\\text{ kg}\\); sitting farther out, the friend needs less mass for the same torque'
      );
      renderQ(el, text, makeOpts(m2, wrongs), explain, '\\text{ kg}');
    },

    rotationalInertiaPoint: function (el) {
      var m = rand(0.5, 3, 0.5);
      var r = rand(1, 3, 0.5);
      var I = +(m * r * r).toFixed(2);
      var text = 'A \\(' + m + '\\text{ kg}\\) ball is swung on a light string in a circle of radius \\(' + r + '\\text{ m}\\). What is its rotational inertia about the center?';
      var wrongs = [+(m * r).toFixed(2), +(0.5 * m * r * r).toFixed(2), +(m * m * r).toFixed(2)];
      var explain = steps(
        'Point mass: \\(I = mr^2\\)',
        '\\(I = (' + m + ')(' + r + ')^2 = (' + m + ')(' + +(r * r).toFixed(2) + ')\\)',
        '\\(= ' + I + '\\text{ kg·m}^2\\)',
        'Doubling the radius would quadruple \\(I\\): distance from the axis counts twice'
      );
      renderQ(el, text, makeOpts(I, wrongs), explain, '\\text{ kg·m}^2');
    },

    inertiaShapeCompare: function (el) {
      var text = 'A hoop, a solid disk, and a solid sphere have equal mass \\(M\\) and radius \\(R\\). Each spins about an axis through its center. Rank their rotational inertias from largest to smallest.';
      var correct = '\\text{hoop} > \\text{disk} > \\text{sphere}';
      var wrongs = [
        '\\text{sphere} > \\text{disk} > \\text{hoop}',
        '\\text{disk} > \\text{hoop} > \\text{sphere}',
        '\\text{all equal, same } M \\text{ and } R'
      ];
      var explain = steps(
        'Rotational inertia depends on where the mass sits, not just how much there is',
        'Hoop: all mass at the rim, \\(I = MR^2\\)',
        'Disk: mass spread inward, \\(I = \\tfrac{1}{2}MR^2\\); sphere: mass hugs the axis, \\(I = \\tfrac{2}{5}MR^2\\)',
        'The farther the mass from the axis, the harder the object is to spin up'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    },

    alphaFromTorque: function (el) {
      var tau = rand(2, 12, 1);
      var I = rand(0.5, 3, 0.5);
      var a = +(tau / I).toFixed(2);
      var text = 'A net torque of \\(' + tau + '\\text{ N·m}\\) acts on a flywheel with rotational inertia \\(' + I + '\\text{ kg·m}^2\\). What is its angular acceleration?';
      var explain = steps(
        'Newton\'s second law for rotation: \\(\\tau_{net} = I\\alpha\\)',
        '\\(\\alpha = \\dfrac{\\tau_{net}}{I} = \\dfrac{' + tau + '}{' + I + '}\\)',
        '\\(= ' + a + '\\text{ rad/s}^2\\)',
        'Same torque on a larger \\(I\\) would spin up more slowly, exactly like \\(a = F/m\\)'
      );
      renderInput(el, text, a, 0.1, explain);
    },

    diskRimTorque: function (el) {
      var M = rand(2, 8, 1);
      var R = rand(0.2, 0.6, 0.1);
      var F = rand(4, 12, 1);
      var I = +(0.5 * M * R * R).toFixed(3);
      var a = +((F * R) / I).toFixed(1);
      var text = 'A rope wrapped around the rim of a solid disk (\\(M = ' + M + '\\text{ kg}\\), \\(R = ' + R + '\\text{ m}\\)) is pulled tangentially with \\(' + F + '\\text{ N}\\). What is the disk\'s angular acceleration?';
      var wrongs = [+(F / (M * R)).toFixed(1), +(a / 2).toFixed(1), +(F * R / (M * R * R)).toFixed(1)];
      var explain = steps(
        'Torque from the rope: \\(\\tau = RF = (' + R + ')(' + F + ') = ' + +(R * F).toFixed(2) + '\\text{ N·m}\\)',
        'Solid disk: \\(I = \\tfrac{1}{2}MR^2 = \\tfrac{1}{2}(' + M + ')(' + R + ')^2 = ' + I + '\\text{ kg·m}^2\\)',
        '\\(\\alpha = \\dfrac{\\tau}{I} = \\dfrac{' + +(R * F).toFixed(2) + '}{' + I + '}\\)',
        '\\(= ' + a + '\\text{ rad/s}^2\\)'
      );
      renderQ(el, text, makeOpts(a, wrongs), explain, '\\text{ rad/s}^2');
    },

    deriveAlphaRod: function (el) {
      var text = 'A small ball of mass \\(m\\) sits at the end of a light rod of length \\(L\\) that pivots about its other end. A force \\(F\\) is applied to the ball, perpendicular to the rod. Derive the angular acceleration.';
      var correct = '\\dfrac{F}{mL}';
      var wrongs = ['\\dfrac{F}{mL^2}', '\\dfrac{FL}{m}', '\\dfrac{mF}{L}'];
      var explain = steps(
        'Torque about the pivot: \\(\\tau = LF\\) (perpendicular force, lever arm \\(L\\))',
        'Rotational inertia of a point mass at distance \\(L\\): \\(I = mL^2\\)',
        'Apply \\(\\tau_{net} = I\\alpha\\): \\(LF = mL^2\\alpha\\)',
        'Solve: \\(\\alpha = \\dfrac{F}{mL}\\)',
        'A longer rod means more torque but even more inertia, so \\(\\alpha\\) shrinks with \\(L\\)'
      );
      renderQ(el, text, makeOpts(correct, wrongs), explain, '');
    }
  };
})();
