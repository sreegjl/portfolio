(function () {
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function buildControls(wrap, controls, vals, onChange) {
    var cd = document.createElement('div');
    cd.className = 'fbd-controls';
    controls.forEach(function (ctrl) {
      var row = document.createElement('div');
      row.className = 'fbd-control';
      var lbl = document.createElement('span');
      lbl.className = 'fbd-control-label';
      lbl.textContent = ctrl.label;
      var inp = document.createElement('input');
      inp.type = 'range'; inp.min = ctrl.min; inp.max = ctrl.max;
      inp.step = ctrl.step || 1; inp.value = ctrl.value;
      var vSpan = document.createElement('span');
      vSpan.className = 'fbd-control-val';
      var dp = (ctrl.step && ctrl.step < 1) ? ('' + ctrl.step).split('.')[1].length : 0;
      vSpan.textContent = (+ctrl.value).toFixed(dp) + ' ' + (ctrl.unit || '');
      inp.addEventListener('input', function () {
        vals[ctrl.id] = parseFloat(inp.value);
        vSpan.textContent = (+inp.value).toFixed(dp) + ' ' + (ctrl.unit || '');
        onChange();
      });
      row.appendChild(lbl); row.appendChild(inp); row.appendChild(vSpan);
      cd.appendChild(row);
    });
    wrap.appendChild(cd);
    return cd;
  }

  // ── Triple graph: x, v, a vs t ──
  window.drawTripleGraph = function (canvasId, config) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width;
    var h = Math.round(w * 0.42);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var vals = { v0: config.v0 || 4, a: config.a || 2 };
    var cursorT = 2.5, dragging = false;
    var tMax = 5;
    var pad = { l: 32, r: 8, t: 18, b: 22 };
    var gap = 30;
    var pw = (w - pad.l - pad.r - gap * 2) / 3;
    var ph = h - pad.t - pad.b;

    function render() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = css('--surface');
      ctx.fillRect(0, 0, w, h);

      var panels = [
        { title: 'Position (x vs t)', unit: 'm', yMin: -80, yMax: 80, fn: function (t) { return vals.v0 * t + 0.5 * vals.a * t * t; } },
        { title: 'Velocity (v vs t)', unit: 'm/s', yMin: -25, yMax: 25, fn: function (t) { return vals.v0 + vals.a * t; } },
        { title: 'Accel (a vs t)', unit: 'm/s²', yMin: -5, yMax: 5, fn: function (t) { return vals.a; } }
      ];

      panels.forEach(function (p, i) {
        var px = pad.l + i * (pw + gap);
        var yMin = p.yMin, yMax = p.yMax;

        function tx(t) { return px + (t / tMax) * pw; }
        function ty(v) { return pad.t + (1 - (v - yMin) / (yMax - yMin)) * ph; }

        // grid
        ctx.strokeStyle = css('--border') || 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (var gx = 0; gx <= 5; gx++) {
          var x = tx(gx);
          ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke();
          if (gx > 0) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = css('--muted');
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(gx, x, pad.t + ph + 3);
          }
        }
        var ySteps = 4;
        for (var gy = 0; gy <= ySteps; gy++) {
          var yv = yMin + (yMax - yMin) * gy / ySteps;
          var y = ty(yv);
          ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke();
          if (gy > 0) {
            ctx.font = '600 8px "DM Mono", monospace';
            ctx.fillStyle = css('--muted');
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.abs(yv) >= 10 ? yv.toFixed(0) : yv.toFixed(1), px - 4, y);
          }
        }

        // zero line
        if (yMin < 0 && yMax > 0) {
          ctx.strokeStyle = css('--border-strong') || 'rgba(0,0,0,0.12)';
          ctx.lineWidth = 1;
          var zy = ty(0);
          ctx.beginPath(); ctx.moveTo(px, zy); ctx.lineTo(px + pw, zy); ctx.stroke();
        }

        // curve (clipped to panel)
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, pad.t, pw, ph);
        ctx.clip();
        ctx.strokeStyle = css('--accent-teal');
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var ct = 0; ct <= tMax; ct += 0.05) {
          var cx = tx(ct), cy = ty(p.fn(ct));
          if (ct === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();

        // cursor
        var curX = tx(cursorT);
        var curY = ty(p.fn(cursorT));
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = css('--accent-purple');
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(curX, pad.t); ctx.lineTo(curX, pad.t + ph); ctx.stroke();
        ctx.restore();

        ctx.fillStyle = css('--accent-purple');
        ctx.beginPath(); ctx.arc(curX, curY, 4, 0, Math.PI * 2); ctx.fill();

        // value at cursor
        ctx.font = '600 11px "DM Mono", monospace';
        ctx.fillStyle = css('--accent-purple');
        ctx.textAlign = 'center';
        ctx.textBaseline = curY > pad.t + ph / 2 ? 'bottom' : 'top';
        var valY = curY + (curY > pad.t + ph / 2 ? -20 : 20);
        ctx.fillText(p.fn(cursorT).toFixed(1) + ' ' + p.unit, curX, valY);

        // title
        ctx.font = '600 9px "DM Mono", monospace';
        ctx.fillStyle = css('--muted');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.title, px + pw / 2, pad.t - 5);

        // t axis label
        ctx.font = '9px "DM Mono", monospace';
        ctx.fillStyle = css('--hint');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('t (s)', px + pw / 2, pad.t + ph + 8);
      });
    }

    function tFromMouse(e) {
      var r = canvas.getBoundingClientRect();
      var mx = e.clientX - r.left;
      for (var i = 0; i < 3; i++) {
        var px = pad.l + i * (pw + gap);
        if (mx >= px && mx <= px + pw) {
          return Math.max(0, Math.min(tMax, ((mx - px) / pw) * tMax));
        }
      }
      return null;
    }

    canvas.addEventListener('mousedown', function (e) {
      var t = tFromMouse(e);
      if (t !== null) { cursorT = t; dragging = true; render(); updateCaption(); }
    });
    canvas.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var t = tFromMouse(e);
      if (t !== null) { cursorT = t; render(); updateCaption(); }
    });
    canvas.addEventListener('mouseup', function () { dragging = false; });
    canvas.addEventListener('mouseleave', function () { dragging = false; });

    var wrap = canvas.parentElement;
    var cap = wrap.querySelector('.graph-caption');

    function updateCaption() {
      if (!cap) return;
      var x = vals.v0 * cursorT + 0.5 * vals.a * cursorT * cursorT;
      var v = vals.v0 + vals.a * cursorT;
      var txt = '\\(t = ' + cursorT.toFixed(1) + '\\text{ s},\\; x = ' + x.toFixed(1) + '\\text{ m},\\; v = ' + v.toFixed(1) + '\\text{ m/s},\\; a = ' + vals.a.toFixed(1) + '\\text{ m/s}^2\\)';
      cap.querySelector('span').innerHTML = txt;
      var cs = cap.querySelector('span'); if (cs && window.MathJax) MathJax.typesetPromise([cs]).catch(function () {});
    }

    buildControls(wrap, [
      { id: 'v0', label: 'v₀', unit: 'm/s', min: -10, max: 10, value: vals.v0, step: 0.5 },
      { id: 'a', label: 'a', unit: 'm/s²', min: -5, max: 5, value: vals.a, step: 0.5 }
    ], vals, function () { render(); updateCaption(); });

    // randomize button
    if (cap) {
      var rb = document.createElement('button');
      rb.className = 'fbd-randomize'; rb.type = 'button'; rb.textContent = 'randomize';
      rb.addEventListener('click', function () {
        vals.v0 = +((-10 + Math.random() * 20).toFixed(1));
        vals.a = +((-5 + Math.random() * 10).toFixed(1));
        var ctrls = wrap.querySelectorAll('.fbd-control input[type="range"]');
        var vSpans = wrap.querySelectorAll('.fbd-control-val');
        if (ctrls[0]) { ctrls[0].value = vals.v0; vSpans[0].textContent = vals.v0.toFixed(1) + ' m/s'; }
        if (ctrls[1]) { ctrls[1].value = vals.a; vSpans[1].textContent = vals.a.toFixed(1) + ' m/s²'; }
        render(); updateCaption();
      });
      cap.appendChild(rb);
    }

    render();
    updateCaption();

    document.addEventListener('themechange', render);
  };

  // ── Projectile motion ──
  window.drawProjectile = function (canvasId, config) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width;
    var h = Math.round(w * 0.55);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var vals = { angle: config.angle || 45, v0: config.v0 || 20, horizontal: false, height: 30 };
    var g = 9.8;
    var time = 0, animId = null;
    var pad = { l: 40, r: 15, t: 15, b: 30 };
    var pw = w - pad.l - pad.r;
    var ph = h - pad.t - pad.b;

    function flightTime() {
      if (vals.horizontal) {
        return Math.sqrt(2 * vals.height / g);
      }
      var rad = vals.angle * Math.PI / 180;
      return 2 * vals.v0 * Math.sin(rad) / g;
    }

    function pos(t) {
      if (vals.horizontal) {
        return { x: vals.v0 * t, y: vals.height - 0.5 * g * t * t };
      }
      var rad = vals.angle * Math.PI / 180;
      return {
        x: vals.v0 * Math.cos(rad) * t,
        y: vals.v0 * Math.sin(rad) * t - 0.5 * g * t * t
      };
    }

    function vel(t) {
      if (vals.horizontal) {
        return { vx: vals.v0, vy: -g * t };
      }
      var rad = vals.angle * Math.PI / 180;
      return {
        vx: vals.v0 * Math.cos(rad),
        vy: vals.v0 * Math.sin(rad) - g * t
      };
    }

    function render() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = css('--surface');
      ctx.fillRect(0, 0, w, h);

      var tF = flightTime();
      var rad = vals.angle * Math.PI / 180;
      var range = vals.v0 * vals.v0 * Math.sin(2 * rad) / g;
      var maxH = vals.v0 * vals.v0 * Math.sin(rad) * Math.sin(rad) / (2 * g);
      if (range < 1) range = 1;
      if (maxH < 1) maxH = 1;

      var v0Max = 30;
      var maxRange = v0Max * v0Max / g;
      var maxMaxH = vals.horizontal ? 80 : v0Max * v0Max / (2 * g);
      var xScale = pw / (maxRange * 1.05);
      var yScale = ph / (maxMaxH * 1.1);
      var scale = Math.min(xScale, yScale);

      function tx(xv) { return pad.l + xv * scale; }
      function ty(yv) { return pad.t + ph - yv * scale; }

      // grid
      ctx.strokeStyle = css('--border') || 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      var gridSpacing = 25;
      for (var gx = pad.l; gx < w - pad.r; gx += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, pad.t + ph); ctx.stroke();
      }
      for (var gy = pad.t; gy < h - pad.b; gy += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + pw, gy); ctx.stroke();
      }

      // ground
      var groundY = ty(0);
      ctx.strokeStyle = css('--border-strong') || 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pad.l, groundY); ctx.lineTo(pad.l + pw, groundY); ctx.stroke();
      ctx.strokeStyle = css('--border') || 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (var hi = pad.l; hi < pad.l + pw; hi += 12) {
        ctx.beginPath(); ctx.moveTo(hi, groundY); ctx.lineTo(hi - 5, groundY + 5); ctx.stroke();
      }

      // trajectory path
      ctx.strokeStyle = css('--hint');
      ctx.lineWidth = 1;
      ctx.save(); ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (var pt = 0; pt <= tF; pt += tF / 80) {
        var pp = pos(pt);
        var cx = tx(pp.x), cy = ty(pp.y);
        if (pt === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke(); ctx.restore();

      // projectile dot
      var cp = pos(time);
      var cv = vel(time);
      var dotX = tx(cp.x), dotY = ty(Math.max(0, cp.y));

      // velocity vectors
      var vMax = vals.v0;
      var vVisMax = Math.min(pw, ph) * 0.18;
      var vxLen = vMax > 0 ? (cv.vx / vMax) * vVisMax : 0;
      var vyLen = vMax > 0 ? (-cv.vy / vMax) * vVisMax : 0;

      // vx arrow
      if (Math.abs(vxLen) > 2) {
        ctx.strokeStyle = css('--accent-teal');
        ctx.fillStyle = css('--accent-teal');
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(dotX, dotY); ctx.lineTo(dotX + vxLen, dotY); ctx.stroke();
        var aVx = Math.atan2(0, vxLen);
        ctx.beginPath();
        ctx.moveTo(dotX + vxLen, dotY);
        ctx.lineTo(dotX + vxLen - 6 * Math.cos(aVx - 0.5), dotY - 6 * Math.sin(aVx - 0.5));
        ctx.lineTo(dotX + vxLen - 6 * Math.cos(aVx + 0.5), dotY - 6 * Math.sin(aVx + 0.5));
        ctx.fill();
      }

      // vy arrow
      if (Math.abs(vyLen) > 2) {
        ctx.strokeStyle = css('--fbd-tension');
        ctx.fillStyle = css('--fbd-tension');
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(dotX, dotY); ctx.lineTo(dotX, dotY + vyLen); ctx.stroke();
        var aVy = Math.atan2(vyLen, 0);
        ctx.beginPath();
        ctx.moveTo(dotX, dotY + vyLen);
        ctx.lineTo(dotX - 6 * Math.cos(aVy - 0.5), dotY + vyLen - 6 * Math.sin(aVy - 0.5));
        ctx.lineTo(dotX + 6 * Math.cos(aVy - 0.5), dotY + vyLen - 6 * Math.sin(aVy - 0.5));
        ctx.fill();
      }

      // corner legend
      var legX = w - 10, legY = 12;
      ctx.font = '600 10px "DM Mono", monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';

      ctx.fillStyle = css('--hint');
      ctx.fillText('t = ' + time.toFixed(2) + ' s', legX, legY);

      legY += 16;
      ctx.fillStyle = css('--accent-teal');
      ctx.beginPath(); ctx.arc(legX - 80, legY, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('vx = ' + Math.abs(cv.vx).toFixed(1) + ' m/s', legX, legY);

      legY += 16;
      ctx.fillStyle = css('--fbd-tension');
      ctx.beginPath(); ctx.arc(legX - 80, legY, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('vy = ' + Math.abs(cv.vy).toFixed(1) + ' m/s', legX, legY);

      legY += 16;
      ctx.fillStyle = css('--muted');
      var speed = Math.sqrt(cv.vx * cv.vx + cv.vy * cv.vy);
      ctx.fillText('|v| = ' + speed.toFixed(1) + ' m/s', legX, legY);

      // dot
      ctx.fillStyle = css('--text');
      ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill();

      // axis labels
      ctx.font = '9px "DM Mono", monospace';
      ctx.fillStyle = css('--hint');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('x (m)', pad.l + pw / 2, groundY + 12);
      ctx.save(); ctx.translate(12, pad.t + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('y (m)', 0, 0);
      ctx.restore();
    }

    var paused = false;

    var wrap = canvas.parentElement;
    var cap = wrap.querySelector('.graph-caption');

    function updateCaption() {
      if (!cap) return;
      var txt;
      if (vals.horizontal) {
        var tF = +Math.sqrt(2 * vals.height / g).toFixed(2);
        var range = +(vals.v0 * tF).toFixed(1);
        txt = '\\(R = ' + range + '\\text{ m},\\; h_0 = ' + vals.height + '\\text{ m},\\; t_f = ' + tF + '\\text{ s}\\)';
      } else {
        var rad = vals.angle * Math.PI / 180;
        var range = +(vals.v0 * vals.v0 * Math.sin(2 * rad) / g).toFixed(1);
        var maxH = +(vals.v0 * vals.v0 * Math.sin(rad) * Math.sin(rad) / (2 * g)).toFixed(1);
        var tF = +(2 * vals.v0 * Math.sin(rad) / g).toFixed(2);
        txt = '\\(R = ' + range + '\\text{ m},\\; H = ' + maxH + '\\text{ m},\\; t_f = ' + tF + '\\text{ s}\\)';
      }
      cap.querySelector('span').innerHTML = txt;
      var cs = cap.querySelector('span'); if (cs && window.MathJax) MathJax.typesetPromise([cs]).catch(function () {});
    }

    var controlsDiv = buildControls(wrap, [
      { id: 'angle', label: 'Angle', unit: '°', min: 5, max: 85, value: vals.angle, step: 1 },
      { id: 'v0', label: 'v₀', unit: 'm/s', min: 5, max: 30, value: vals.v0, step: 1 }
    ], vals, function () { time = 0; render(); updateCaption(); });

    // horizontal launch toggle
    var toggleRow = document.createElement('div');
    toggleRow.className = 'fbd-control';
    toggleRow.style.cursor = 'pointer';
    var toggleLabel = document.createElement('span');
    toggleLabel.className = 'fbd-control-label';
    toggleLabel.textContent = 'Mode';
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'fbd-randomize';
    toggleBtn.type = 'button';
    toggleBtn.textContent = 'angled launch';
    toggleBtn.style.flex = '1';
    toggleBtn.style.textAlign = 'center';

    var angleRow = controlsDiv.children[0];
    var heightRow = null;

    function buildHeightSlider() {
      if (heightRow) return;
      heightRow = document.createElement('div');
      heightRow.className = 'fbd-control';
      var hl = document.createElement('span');
      hl.className = 'fbd-control-label';
      hl.textContent = 'Height';
      var hi = document.createElement('input');
      hi.type = 'range'; hi.min = 5; hi.max = 80; hi.step = 1; hi.value = vals.height;
      var hs = document.createElement('span');
      hs.className = 'fbd-control-val';
      hs.textContent = vals.height + ' m';
      hi.addEventListener('input', function () {
        vals.height = parseFloat(hi.value);
        hs.textContent = hi.value + ' m';
        time = 0; render(); updateCaption();
      });
      heightRow.appendChild(hl); heightRow.appendChild(hi); heightRow.appendChild(hs);
    }

    toggleBtn.addEventListener('click', function () {
      vals.horizontal = !vals.horizontal;
      toggleBtn.textContent = vals.horizontal ? 'horizontal launch' : 'angled launch';
      if (vals.horizontal) {
        angleRow.style.display = 'none';
        buildHeightSlider();
        controlsDiv.insertBefore(heightRow, angleRow);
        heightRow.style.display = 'flex';
      } else {
        angleRow.style.display = 'flex';
        if (heightRow) heightRow.style.display = 'none';
      }
      time = 0; render(); updateCaption();
    });

    toggleRow.appendChild(toggleLabel);
    toggleRow.appendChild(toggleBtn);
    controlsDiv.insertBefore(toggleRow, controlsDiv.firstChild);

    if (cap) {
      var rb = document.createElement('button');
      rb.className = 'fbd-randomize'; rb.type = 'button'; rb.textContent = 'randomize';
      rb.addEventListener('click', function () {
        vals.angle = 5 + Math.floor(Math.random() * 80);
        vals.v0 = 5 + Math.floor(Math.random() * 25);
        var ctrls = wrap.querySelectorAll('.fbd-control input[type="range"]');
        var vSpans = wrap.querySelectorAll('.fbd-control-val');
        if (ctrls[0]) { ctrls[0].value = vals.angle; vSpans[0].textContent = vals.angle + ' °'; }
        if (ctrls[1]) { ctrls[1].value = vals.v0; vSpans[1].textContent = vals.v0 + ' m/s'; }
        time = 0; render(); updateCaption();
      });
      cap.appendChild(rb);

      var playBtn = document.createElement('button');
      playBtn.className = 'fbd-pause';
      playBtn.type = 'button';
      playBtn.textContent = 'play';
      playBtn.style.display = 'none';
      playBtn.addEventListener('click', function () {
        paused = false;
        playBtn.style.display = 'none';
        tick();
      });
      cap.appendChild(playBtn);
    }

    var tScrub = document.createElement('input');
    tScrub.type = 'range';
    tScrub.min = 0; tScrub.max = 1000; tScrub.value = 0; tScrub.step = 1;
    tScrub.style.cssText = 'width:100%;height:3px;margin:0;padding:0;display:block;opacity:0;cursor:pointer;-webkit-appearance:none;appearance:none;background:var(--border-strong);border-radius:2px;transition:opacity 0.2s;';
    var scrubStyle = document.createElement('style');
    scrubStyle.textContent = '#' + canvasId + '-scrub::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border-radius:50%;background:var(--accent-purple);cursor:pointer;}#' + canvasId + '-scrub::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:var(--accent-purple);border:none;cursor:pointer;}';
    tScrub.id = canvasId + '-scrub';
    document.head.appendChild(scrubStyle);
    canvas.after(tScrub);

    var cardWrap = canvas.closest('.graph-card') || wrap;
    cardWrap.addEventListener('mouseenter', function () { tScrub.style.opacity = '0.5'; });
    cardWrap.addEventListener('mouseleave', function () { if (!scrubbing) tScrub.style.opacity = '0'; });

    var scrubbing = false;
    tScrub.addEventListener('input', function () {
      var tF = flightTime();
      time = (parseFloat(tScrub.value) / 1000) * tF;
      scrubbing = true;
      paused = true;
      if (playBtn) playBtn.style.display = '';
      render();
    });
    tScrub.addEventListener('mouseup', function () { scrubbing = false; });

    cardWrap.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        e.preventDefault();
        if (paused) {
          paused = false;
          if (playBtn) playBtn.style.display = 'none';
          tick();
        } else {
          paused = true;
          if (playBtn) playBtn.style.display = '';
        }
      }
    });
    cardWrap.setAttribute('tabindex', '0');

    function tick() {
      if (paused) { animId = null; return; }
      var tF = flightTime();
      time += 0.03;
      if (time > tF) time = 0;
      if (!scrubbing && tF > 0) tScrub.value = Math.round((time / tF) * 1000);
      render();
      animId = requestAnimationFrame(tick);
    }

    tick();
    updateCaption();

    document.addEventListener('themechange', render);
  };
})();
