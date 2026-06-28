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
    }
  };
})();
