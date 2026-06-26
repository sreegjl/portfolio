(function () {
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawArrow(ctx, sx, sy, dx, dy, color, headLen) {
    var tipX = sx + dx, tipY = sy + dy;
    headLen = headLen || 7;
    var angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(angle - Math.PI / 6), tipY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tipX - headLen * Math.cos(angle + Math.PI / 6), tipY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
  }

  window.drawElevator = function (canvasId, config) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width, h = Math.round(w * 0.65);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var mass = config.mass || 70;
    var g = 9.8;
    var vals = { accel: 0 };
    var gridOffset = 0, velocity = 0, animId = null;

    var elevW = 120, elevH = 160;
    var elevX = w / 2 - elevW / 2;
    var elevY = h / 2 - elevH / 2 + 10;
    var personW = 30, personH = 60;
    var personX = w / 2, personY = elevY + elevH - 12;
    var scaleH = 8;
    var maxArrow = 80;

    function render() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = css('--surface');
      ctx.fillRect(0, 0, w, h);

      // scrolling grid
      var gridSpacing = 25;
      var goy = ((gridOffset % gridSpacing) + gridSpacing) % gridSpacing;
      ctx.strokeStyle = css('--border') || 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (var gx = gridSpacing; gx < w; gx += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (var gy = goy; gy < h; gy += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      // elevator frame
      ctx.strokeStyle = css('--border-strong') || 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 2;
      ctx.strokeRect(elevX, elevY, elevW, elevH);

      // elevator floor
      ctx.fillStyle = css('--border-strong') || 'rgba(0,0,0,0.14)';
      ctx.fillRect(elevX, elevY + elevH - 4, elevW, 4);

      // scale
      var scaleX = personX - 22, scaleY = personY - scaleH;
      ctx.fillStyle = css('--accent-teal-bg') || 'rgba(54,201,160,0.14)';
      ctx.strokeStyle = css('--accent-teal');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(scaleX, scaleY, 44, scaleH, 2);
      ctx.fill(); ctx.stroke();

      // person (simple box)
      ctx.fillStyle = css('--bg');
      ctx.strokeStyle = css('--muted');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(personX - personW / 2, personY - personH - scaleH, personW, personH, 4);
      ctx.fill(); ctx.stroke();

      // head
      ctx.beginPath();
      ctx.arc(personX, personY - personH - scaleH - 10, 8, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // forces
      var Fg = mass * g;
      var Fn = mass * (g + vals.accel);
      if (Fn < 0) Fn = 0;
      var maxF = 120 * (g + 5);
      var fgLen = (Fg / maxF) * maxArrow;
      var fnLen = (Fn / maxF) * maxArrow;

      var bodyMidY = personY - personH / 2 - scaleH;

      // Fg arrow (down from center of person)
      var fgColor = css('--fbd-weight');
      drawArrow(ctx, personX + personW / 2 + 8, bodyMidY, 0, fgLen, fgColor);

      // Fn arrow (up from bottom of person / scale)
      var fnColor = css('--fbd-normal');
      drawArrow(ctx, personX + personW / 2 + 8, bodyMidY, 0, -fnLen, fnColor);

      // force labels - right side legend
      var legX = elevX + elevW + 20;
      var legY = elevY + 20;
      ctx.font = '600 10px "DM Mono", monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

      ctx.fillStyle = fgColor;
      ctx.beginPath(); ctx.arc(legX, legY, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('Fg = ' + Fg.toFixed(0) + ' N', legX + 10, legY);

      legY += 18;
      ctx.fillStyle = fnColor;
      ctx.beginPath(); ctx.arc(legX, legY, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('Fn = ' + Fn.toFixed(0) + ' N', legX + 10, legY);

      legY += 18;
      var net = +(Fn - Fg).toFixed(1);
      ctx.fillStyle = css('--muted');
      ctx.fillText('ΣF = ' + net + ' N', legX + 10, legY);

      // scale reading
      var scaleReading = Fn;
      var apparentMass = +(scaleReading / g).toFixed(1);
      legY += 24;
      ctx.fillStyle = css('--accent-teal');
      ctx.font = '600 11px "DM Mono", monospace';
      ctx.fillText('Scale: ' + scaleReading.toFixed(0) + ' N', legX + 10, legY);
      legY += 16;
      ctx.font = '10px "DM Mono", monospace';
      ctx.fillStyle = css('--hint');
      ctx.fillText('(' + apparentMass + ' kg apparent)', legX + 10, legY);

      // which law indicator
      legY += 24;
      ctx.font = '600 9px "DM Mono", monospace';
      if (Math.abs(vals.accel) < 0.01) {
        ctx.fillStyle = css('--accent-teal');
        if (Math.abs(velocity) > 0.05) {
          ctx.fillText('1st law: constant velocity', legX + 10, legY);
          legY += 14;
          ctx.fillText('Fn = Fg, no net force needed', legX + 10, legY);
        } else {
          ctx.fillText('1st law: at rest', legX + 10, legY);
          legY += 14;
          ctx.fillText('Fn = Fg, a = 0', legX + 10, legY);
        }
      } else {
        ctx.fillStyle = css('--accent-purple');
        ctx.fillText('2nd law: Fn - Fg = ma', legX + 10, legY);
        legY += 14;
        ctx.fillText('a = ' + vals.accel.toFixed(1) + ' m/s²', legX + 10, legY);
      }

      // 3rd law note at bottom
      ctx.font = '9px "DM Mono", monospace';
      ctx.fillStyle = css('--hint');
      ctx.textAlign = 'center';
      ctx.fillText('3rd law: person pushes down on scale = scale pushes up on person', w / 2, h - 8);

      // velocity/acceleration indicators on left
      var indX = elevX - 18;
      if (Math.abs(velocity) > 0.05) {
        var vDir = velocity > 0 ? -1 : 1;
        var vLen = Math.min(Math.abs(velocity) * 3, 30);
        ctx.save();
        ctx.globalAlpha = 0.4;
        drawArrow(ctx, indX, h / 2, 0, vDir * vLen, css('--muted'), 5);
        ctx.restore();
        ctx.font = '8px "DM Mono", monospace';
        ctx.fillStyle = css('--hint');
        ctx.textAlign = 'center';
        ctx.fillText('v=' + Math.abs(velocity).toFixed(1), indX, h / 2 + vDir * (vLen + 10));
      }
    }

    var paused = false;

    function tick() {
      if (paused) { animId = null; return; }
      velocity += vals.accel * 0.016;
      var scrollStep = velocity * 0.8;
      var maxStep = 10;
      if (scrollStep > maxStep) scrollStep = maxStep;
      if (scrollStep < -maxStep) scrollStep = -maxStep;
      gridOffset += scrollStep;
      if (Math.abs(velocity) < 0.01 && Math.abs(vals.accel) < 0.01) {
        velocity = 0;
        animId = null;
        render();
        return;
      }
      render();
      animId = requestAnimationFrame(tick);
    }

    function startAnim() {
      if (!animId && !paused) animId = requestAnimationFrame(tick);
    }

    var wrap = canvas.parentElement;
    var cap = wrap.querySelector('.graph-caption');

    function updateCaption() {
      if (!cap) return;
      var Fn = mass * (g + vals.accel);
      if (Fn < 0) Fn = 0;
      var txt;
      if (Math.abs(vals.accel) < 0.01) {
        txt = '\\(F_n = mg = ' + (mass * g).toFixed(0) + '\\text{ N, at rest or constant velocity}\\)';
      } else {
        txt = '\\(F_n = m(g + a) = ' + mass + '(' + g + ' + ' + vals.accel.toFixed(1) + ') = ' + Fn.toFixed(0) + '\\text{ N}\\)';
      }
      cap.querySelector('span').innerHTML = txt;
      if (window.MathJax) MathJax.typesetPromise([cap]).catch(function () {});
    }

    // controls
    var cd = document.createElement('div');
    cd.className = 'fbd-controls';

    // mass slider
    var mRow = document.createElement('div');
    mRow.className = 'fbd-control';
    var mLbl = document.createElement('span');
    mLbl.className = 'fbd-control-label';
    mLbl.textContent = 'Mass';
    var mInp = document.createElement('input');
    mInp.type = 'range'; mInp.min = 30; mInp.max = 120; mInp.step = 5; mInp.value = mass;
    var mSpan = document.createElement('span');
    mSpan.className = 'fbd-control-val';
    mSpan.textContent = mass + ' kg';
    mInp.addEventListener('input', function () {
      mass = parseFloat(mInp.value);
      mSpan.textContent = mass + ' kg';
      render(); updateCaption();
    });
    mRow.appendChild(mLbl); mRow.appendChild(mInp); mRow.appendChild(mSpan);
    cd.appendChild(mRow);

    // acceleration slider
    var row = document.createElement('div');
    row.className = 'fbd-control';
    var lbl = document.createElement('span');
    lbl.className = 'fbd-control-label';
    lbl.textContent = 'Elevator a';
    var inp = document.createElement('input');
    inp.type = 'range'; inp.min = -5; inp.max = 5; inp.step = 0.5; inp.value = 0;
    var vSpan = document.createElement('span');
    vSpan.className = 'fbd-control-val';
    vSpan.textContent = '0.0 m/s²';

    inp.addEventListener('input', function () {
      vals.accel = parseFloat(inp.value);
      vSpan.textContent = vals.accel.toFixed(1) + ' m/s²';
      render(); updateCaption(); startAnim();
    });

    row.appendChild(lbl); row.appendChild(inp); row.appendChild(vSpan);
    cd.appendChild(row);

    // stop button
    var stopRow = document.createElement('div');
    stopRow.className = 'fbd-control';
    var stopSpacer = document.createElement('span');
    stopSpacer.className = 'fbd-control-label';
    var stopBtn = document.createElement('button');
    stopBtn.className = 'fbd-randomize';
    stopBtn.type = 'button';
    stopBtn.textContent = 'stop elevator';
    stopBtn.style.flex = '1';
    stopBtn.addEventListener('click', function () {
      velocity = 0;
      vals.accel = 0;
      inp.value = 0;
      vSpan.textContent = '0.0 m/s²';
      render(); updateCaption();
    });
    stopRow.appendChild(stopSpacer); stopRow.appendChild(stopBtn);
    cd.appendChild(stopRow);

    wrap.appendChild(cd);

    if (cap) {
      var rb = document.createElement('button');
      rb.className = 'fbd-randomize'; rb.type = 'button'; rb.textContent = 'randomize';
      rb.addEventListener('click', function () {
        vals.accel = +(-5 + Math.random() * 10).toFixed(1);
        vals.accel = Math.round(vals.accel * 2) / 2;
        inp.value = vals.accel;
        vSpan.textContent = vals.accel.toFixed(1) + ' m/s²';
        render(); updateCaption(); startAnim();
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
        startAnim();
      });
      cap.appendChild(playBtn);

      var elevCard = canvas.closest('.graph-card');
      if (elevCard) {
        elevCard.addEventListener('keydown', function (e) {
          if (e.code === 'Space') {
            e.preventDefault();
            if (paused) {
              paused = false;
              playBtn.style.display = 'none';
              startAnim();
            } else {
              paused = true;
              playBtn.style.display = '';
              if (animId) { cancelAnimationFrame(animId); animId = null; }
            }
          }
        });
        elevCard.setAttribute('tabindex', '0');
      }
    }

    render();
    updateCaption();

    document.addEventListener('themechange', render);
  };
})();
