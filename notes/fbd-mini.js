(function () {
  var store = {};

  function isStudyMode() {
    var p = document.querySelector('.page');
    return p && p.classList.contains('study-mode');
  }

  function maskLabel(label) {
    if (!label) return label;
    return label.replace(/=\s*[\d.\-]+\s*(N|m\/s²|m\/s|kg|N\/m|cm)?/g, '= ???');
  }

  function drawMaskRect(ctx, lx, ly, tw, align, baseline) {
    var rx = align === 'left' ? lx : align === 'right' ? lx - tw : lx - tw / 2;
    var ry = baseline === 'top' ? ly : baseline === 'middle' ? ly - 7 : ly - 13;
    ctx.fillStyle = css('--border-strong');
    ctx.beginPath();
    var rw = tw + 4, rh = 15, r = 3;
    rx -= 2; ry -= 1;
    ctx.moveTo(rx + r, ry);
    ctx.lineTo(rx + rw - r, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
    ctx.lineTo(rx + rw, ry + rh - r);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
    ctx.lineTo(rx + r, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
    ctx.lineTo(rx, ry + r);
    ctx.quadraticCurveTo(rx, ry, rx + r, ry);
    ctx.fill();
  }

  var typeMeta = {
    weight:   { color: '--fbd-weight' },
    normal:   { color: '--fbd-normal' },
    friction: { color: '--fbd-friction' },
    tension:  { color: '--fbd-tension' },
    applied:  { color: '--fbd-applied' },
    spring:   { color: '--fbd-tension' },
    custom:   { color: '--fbd-custom' }
  };

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function distToSeg(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    var t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function drawArrow(ctx, sx, sy, dx, dy, color, label, bw, bh, headLen, masked) {
    var tipX = sx + dx, tipY = sy + dy;
    headLen = headLen || 8;
    var angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - headLen * Math.cos(angle - Math.PI / 6), tipY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tipX - headLen * Math.cos(angle + Math.PI / 6), tipY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
    var labelRect = null;
    if (label) {
      ctx.font = '600 11px "DM Mono", monospace';
      ctx.fillStyle = color;
      var nearHoriz = Math.abs(dy) < Math.abs(dx) * 0.3;
      var lx = tipX + (dx >= 0 ? 8 : -8);
      var ly = nearHoriz ? tipY : tipY + (dy >= 0 ? 8 : -8);
      ctx.textAlign = dx >= 0 ? 'left' : 'right';
      ctx.textBaseline = nearHoriz ? 'middle' : (dy >= 0 ? 'top' : 'bottom');
      var tw = ctx.measureText(label).width;
      if (ctx.textAlign === 'left' && lx + tw > bw - 4) { ctx.textAlign = 'right'; lx = tipX - 8; }
      if (ctx.textAlign === 'right' && lx - tw < 4) { ctx.textAlign = 'left'; lx = tipX + 8; }
      if (ly < 12) { ctx.textBaseline = 'top'; ly = 4; }
      if (ly > bh - 12) { ctx.textBaseline = 'bottom'; ly = bh - 4; }
      if (masked) {
        drawMaskRect(ctx, lx, ly, tw, ctx.textAlign, ctx.textBaseline);
        ctx.fillStyle = 'transparent';
      }
      ctx.fillText(label, lx, ly);
      var rx = ctx.textAlign === 'left' ? lx : lx - tw;
      var ry = ctx.textBaseline === 'top' ? ly : ctx.textBaseline === 'middle' ? ly - 7 : ly - 14;
      labelRect = { x: rx - 4, y: ry - 2, w: tw + 8, h: 18 };
    }
    return labelRect;
  }

  function drawSpringCoilH(ctx, x1, x2, y, coils, amp, color) {
    var leadIn = 8;
    var cx1 = x1 + leadIn, cx2 = x2 - leadIn;
    var segW = (cx2 - cx1) / (coils * 2);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineJoin = 'bevel';
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(cx1, y);
    for (var i = 0; i < coils * 2; i++) {
      ctx.lineTo(cx1 + (i + 1) * segW, y + (i % 2 === 0 ? amp : -amp));
    }
    ctx.lineTo(x2, y); ctx.stroke(); ctx.lineJoin = 'miter';
  }

  function drawSpringCoil(ctx, x, y1, y2, coils, amp, color) {
    var leadIn = 8;
    var cy1 = y1 + leadIn, cy2 = y2 - leadIn;
    var segH = (cy2 - cy1) / (coils * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'bevel';
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, cy1);
    for (var i = 0; i < coils * 2; i++) {
      ctx.lineTo(x + (i % 2 === 0 ? amp : -amp), cy1 + (i + 1) * segH);
    }
    ctx.lineTo(x, y2);
    ctx.stroke();
    ctx.lineJoin = 'miter';
  }

  function render(canvasId, hovIdx) {
    var s = store[canvasId];
    if (!s) return;
    var canvas = s.canvas, ctx = s.ctx, config = s.config;
    var w = s.w, h = s.h;
    var cx = w / 2, cy = h / 2;
    var objSize = config.size || 50;
    var hw = config.shape === 'point' ? 0 : objSize / 2;
    var hh = hw;
    var groundAngle = config.groundAngle || 0;
    var rot = (-groundAngle * Math.PI) / 180;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css('--surface');
    ctx.fillRect(0, 0, w, h);

    var gridSpacing = 25;
    var gox = s.gridOffset ? ((s.gridOffset.x % gridSpacing) + gridSpacing) % gridSpacing : 0;
    var goy = s.gridOffset ? ((s.gridOffset.y % gridSpacing) + gridSpacing) % gridSpacing : 0;
    ctx.strokeStyle = css('--border-08') || 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (var x = gox; x < w; x += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (var y = goy; y < h; y += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (config.spring) {
      var sp = config.spring;
      var coils = sp.coils || 10;
      var amp = sp.width || 14;

      if (sp.horizontal) {
        var wallX = 20;
        var wallTop = cy - hh - 40;
        var wallBot = cy + hh;
        ctx.strokeStyle = css('--border-strong') || 'rgba(0,0,0,0.14)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wallX, wallTop); ctx.lineTo(wallX, wallBot); ctx.stroke();
        ctx.strokeStyle = css('--border') || 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (var wi = wallTop; wi < wallBot; wi += 10) {
          ctx.beginPath(); ctx.moveTo(wallX, wi); ctx.lineTo(wallX - 6, wi + 6); ctx.stroke();
        }

        var dx = sp.displacement || 0;
        var maxDisp = w * 0.2;
        var dispPx = (dx / 0.3) * maxDisp;
        var restX = w * 0.45;
        cx = restX + dispPx;

        drawSpringCoilH(ctx, wallX, cx - hw, cy, coils, amp, css('--muted'));

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = css('--hint');
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(restX, cy - 30); ctx.lineTo(restX, cy + 30); ctx.stroke();
        ctx.restore();
        ctx.font = '10px "DM Mono", monospace';
        ctx.fillStyle = css('--hint');
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('x=0', restX, cy + 33);

        if (Math.abs(dispPx) > 3) {
          var dxLabelY = cy - hh - 28;
          ctx.font = '600 9px "DM Mono", monospace';
          ctx.fillStyle = css('--accent-purple');
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText('Δx=' + dx.toFixed(2) + ' m', (restX + cx) / 2, dxLabelY - 3);
          ctx.strokeStyle = css('--accent-purple');
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(restX, dxLabelY); ctx.lineTo(cx, dxLabelY); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(restX, dxLabelY - 3); ctx.lineTo(restX, dxLabelY + 3); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, dxLabelY - 3); ctx.lineTo(cx, dxLabelY + 3); ctx.stroke();
        }
      } else {
        var anchorY = 18;
        var ceilW = 50;
        ctx.strokeStyle = css('--border-strong') || 'rgba(0,0,0,0.14)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - ceilW / 2, anchorY); ctx.lineTo(cx + ceilW / 2, anchorY); ctx.stroke();
        ctx.strokeStyle = css('--border') || 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (var ci = -ceilW / 2; ci <= ceilW / 2; ci += 10) {
          ctx.beginPath(); ctx.moveTo(cx + ci, anchorY); ctx.lineTo(cx + ci - 5, anchorY - 5); ctx.stroke();
        }

        var weightMag = 0;
        (config.forces || []).forEach(function (f) { if (f.type === 'weight') weightMag = f.magnitude; });
        var k = sp.k || 100;
        var restLen = h * 0.25;
        var maxStretch = h * 0.3;
        var maxWeight = k * (maxStretch / 150);
        var stretch = maxWeight > 0 ? (weightMag / maxWeight) * maxStretch : 0;
        stretch = Math.min(stretch, maxStretch);

        var springBottom = anchorY + restLen + stretch;
        cy = springBottom + hh;

        drawSpringCoil(ctx, cx, anchorY, springBottom, coils, amp, css('--muted'));

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = css('--hint');
        ctx.lineWidth = 1;
        var eqY = anchorY + restLen + hh;
        ctx.beginPath(); ctx.moveTo(cx - 40, eqY); ctx.lineTo(cx + 40, eqY); ctx.stroke();
        ctx.restore();
        ctx.font = '10px "DM Mono", monospace';
        ctx.fillStyle = css('--hint');
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('rest', cx + 44, eqY);
      }
    }

    var orbPosRad = null;
    if (config.orbit) {
      var orb = config.orbit;
      var orbR = orb.radius || Math.min(w, h) * 0.28;
      orbPosRad = orb.animate && s.orbitAngle != null ? s.orbitAngle : (orb.position || 0) * Math.PI / 180;
      var offX = (orb.centerOffset && orb.centerOffset[0]) || 0;
      var offY = (orb.centerOffset && orb.centerOffset[1]) || 0;
      var orbCx = cx + offX, orbCy = cy + offY;
      s.orbCx = orbCx; s.orbCy = orbCy; s.orbR = orbR;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = orb.broken ? (css('--accent-coral') || css('--fbd-weight')) : css('--hint');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(orbCx, orbCy, orbR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = css('--muted');
      ctx.beginPath();
      ctx.arc(orbCx, orbCy, 3, 0, Math.PI * 2);
      ctx.fill();

      if (orb.broken) {
        var ft = s.fallTime || 0;
        var topX = orbCx + orbR * Math.cos(Math.PI / 2);
        var topY = orbCy - orbR * Math.sin(Math.PI / 2);
        cx = topX;
        cy = topY + 0.5 * 150 * ft * ft;
        if (cy > h + 20) s.fallTime = 0; else s.fallTime = ft + 0.016;
        orbPosRad = Math.PI / 2;

        ctx.strokeStyle = css('--muted');
        ctx.lineWidth = 1;
        ctx.save(); ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(orbCx, orbCy); ctx.lineTo(topX, topY); ctx.stroke();
        ctx.restore();

        ctx.font = '600 10px "DM Mono", monospace';
        ctx.fillStyle = css('--accent-coral') || css('--fbd-weight');
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('v < v_min, ball falls!', orbCx, orbCy + orbR + 10);
      } else {
        cx = orbCx + orbR * Math.cos(orbPosRad);
        cy = orbCy - orbR * Math.sin(orbPosRad);

        if (orb.showString !== false) {
          ctx.strokeStyle = css('--muted');
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(orbCx, orbCy); ctx.lineTo(cx, cy); ctx.stroke();
        }

        var tanDir = orb.clockwise ? orbPosRad - Math.PI / 2 : orbPosRad + Math.PI / 2;
        var vLen = orb.velocity ? Math.min(orb.velocity * 5, orbR * 0.8) : 28;
        var vsx = cx + Math.cos(tanDir) * (hw + 4);
        var vsy = cy - Math.sin(tanDir) * (hh + 4);
        var vdx = Math.cos(tanDir) * vLen;
        var vdy = -Math.sin(tanDir) * vLen;
        var vHead = Math.max(4, Math.min(vLen * 0.25, 8));
        ctx.save(); ctx.globalAlpha = 0.45; ctx.setLineDash([3, 3]);
        drawArrow(ctx, vsx, vsy, vdx, vdy, css('--hint'), null, w, h, vHead);
        ctx.restore();
      }
    }

    if (config.ground) {
      var gdx = Math.cos(rot), gdy = Math.sin(rot);
      var gnx = -Math.sin(rot), gny = Math.cos(rot);
      var gcx = cx + gnx * hh, gcy = cy + gny * hh;
      var ghl = w * 0.7;
      ctx.strokeStyle = css('--border-14') || 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gcx - gdx * ghl, gcy - gdy * ghl);
      ctx.lineTo(gcx + gdx * ghl, gcy + gdy * ghl);
      ctx.stroke();
      ctx.strokeStyle = css('--border-08') || 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (var t = -ghl; t <= ghl; t += 12) {
        var px = gcx + gdx * t, py = gcy + gdy * t;
        var hhx = (gdx + gnx) / Math.SQRT2, hhy = (gdy + gny) / Math.SQRT2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + hhx * 8, py + hhy * 8); ctx.stroke();
      }
    }

    ctx.fillStyle = css('--bg');
    ctx.strokeStyle = css('--border-14') || 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    if (hw === 0) {
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.rect(-hw, -hh, hw * 2, hh * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();

    var rawForces = config.forces || [];
    if (rawForces.length === 0) { s.arrows = []; return; }

    var forces = rawForces.map(function (f) {
      var ff = {};
      for (var k in f) ff[k] = f[k];

      if (ff.towardCenter && orbPosRad !== null) {
        ff.angle = ((orbPosRad + Math.PI) * 180 / Math.PI + 360) % 360;
      }

      if (ff.towardCenter && config.orbit && config.orbit.vertical && orbPosRad !== null) {
        var wMag = 0;
        rawForces.forEach(function (rf) { if (rf.type === 'weight') wMag = rf.magnitude; });
        var ftTop = f.magnitude;
        var ft = +(ftTop + 3 * wMag * (1 - Math.sin(orbPosRad))).toFixed(1);
        ff.magnitude = ft;
        ff.label = 'FT = ' + ft + ' N';
      }

      return ff;
    });

    var maxMag = 0;
    if (config.orbit && config.orbit.animate && config.orbit.vertical) {
      var wMag = 0, ftBase = 0;
      rawForces.forEach(function (rf) {
        if (rf.type === 'weight') wMag = rf.magnitude;
        if (rf.towardCenter) ftBase = rf.magnitude;
      });
      maxMag = Math.max(wMag, ftBase + 6 * wMag);
    } else if (config.maxForce) {
      maxMag = config.maxForce;
    } else {
      forces.forEach(function (f) { if (f.magnitude > maxMag) maxMag = f.magnitude; });
    }
    if (maxMag === 0) maxMag = 1;
    var maxLen = h * 0.22;

    function edgeDist(dxDir, dyDir) {
      if (hw === 0) return 0;
      var ldx = dxDir * Math.cos(rot) + dyDir * Math.sin(rot);
      var ldy = -dxDir * Math.sin(rot) + dyDir * Math.cos(rot);
      var tx = ldx !== 0 ? hw / Math.abs(ldx) : Infinity;
      var ty = ldy !== 0 ? hh / Math.abs(ldy) : Infinity;
      return Math.min(tx, ty);
    }

    var arrows = [];
    forces.forEach(function (f, i) {
      var angleDeg = f.angle;
      if (f.relative) angleDeg = ((angleDeg + groundAngle) % 360 + 360) % 360;
      var rad = (angleDeg * Math.PI) / 180;
      var dirX = Math.cos(rad), dirY = -Math.sin(rad);
      var ed = edgeDist(dirX, dirY);
      var len = (f.magnitude / maxMag) * maxLen;
      if (len < maxLen * 0.12) len = maxLen * 0.12;
      if (f.towardCenter && s.orbR) len = Math.min(len, s.orbR - hw - 6);
      var dx = dirX * len, dy = dirY * len;
      var sx = cx + dirX * ed, sy = cy + dirY * ed;
      if (config.spring && !config.spring.horizontal && (f.type === 'tension' || f.type === 'spring') && Math.abs(angleDeg - 90) < 5) {
        sx = cx + hw + 8;
      }
      if (config.spring && config.spring.horizontal && (f.type === 'tension' || f.type === 'spring')) {
        sy = cy - hh - 10;
      }
      arrows.push({ sx: sx, sy: sy, ex: sx + dx, ey: sy + dy, dx: dx, dy: dy, angleDeg: angleDeg, rad: rad, len: len, idx: i });
    });
    s.arrows = arrows;

    var sumX = 0, sumY = 0;
    forces.forEach(function (f, i) {
      var a = arrows[i];
      sumX += Math.cos(a.rad) * f.magnitude;
      sumY += Math.sin(a.rad) * f.magnitude;
    });
    s.netX = sumX;
    s.netY = sumY;

    var orbitAnim = config.orbit && config.orbit.animate;
    var study = isStudyMode();

    forces.forEach(function (f, i) {
      var a = arrows[i];
      var meta = typeMeta[f.type] || typeMeta.custom;
      var c = css(meta.color);
      var lbl = orbitAnim ? null : f.label;
      if (lbl && study && !s.revealed[i]) lbl = maskLabel(lbl);

      ctx.save();
      if (hovIdx !== null && hovIdx !== i) ctx.globalAlpha = 0.2;
      if (f.dashed) ctx.setLineDash([6, 5]);
      var isMasked = study && !s.revealed[i] && !orbitAnim;
      var lr = drawArrow(ctx, a.sx, a.sy, a.dx, a.dy, c, lbl, w, h, undefined, isMasked);
      if (lr) a.labelRect = lr;
      ctx.restore();
    });

    s.legendHits = [];
    if (orbitAnim) {
      var legX = 10, legY = 12;
      ctx.font = '600 10px "DM Mono", monospace';
      forces.forEach(function (f, i) {
        var meta = typeMeta[f.type] || typeMeta.custom;
        var c = css(meta.color);
        var alpha = (hovIdx !== null && hovIdx !== i) ? 0.25 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(legX + 4, legY + 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        var legMasked = study && !s.revealed[i];
        var legLabel = legMasked ? maskLabel(f.label) : f.label;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        if (legMasked) {
          var legTw = ctx.measureText(legLabel).width;
          drawMaskRect(ctx, legX + 12, legY + 4, legTw, 'left', 'middle');
          ctx.fillStyle = 'transparent';
        }
        ctx.fillText(legLabel, legX + 12, legY + 4);
        var tw = ctx.measureText(legLabel).width;
        s.legendHits.push({ x: legX, y: legY - 4, w: tw + 16, h: 16, idx: i });
        ctx.restore();
        legY += 16;
      });
    }

    if (config.showNet) {
      var netMag = Math.hypot(sumX, sumY);
      if (netMag > maxMag * 0.01) {
        var netRad = Math.atan2(sumY, sumX);
        var netDirX = Math.cos(netRad), netDirY = -Math.sin(netRad);
        var netEd = edgeDist(netDirX, netDirY);
        var netLen = (netMag / maxMag) * maxLen;
        if (netLen < maxLen * 0.12) netLen = maxLen * 0.12;
        var netDx = netDirX * netLen, netDy = netDirY * netLen;
        var netDeg = ((netRad * 180 / Math.PI) + 360) % 360;
        var needsOffset = false;
        arrows.forEach(function (a) {
          var diff = Math.abs(a.angleDeg - netDeg);
          if (diff > 180) diff = 360 - diff;
          if (diff < 30) needsOffset = true;
        });
        var perpX = Math.sin(netRad), perpY = Math.cos(netRad);
        var offAmt = needsOffset ? 16 : 0;
        var netSx = cx + netDirX * netEd + perpX * offAmt;
        var netSy = cy + netDirY * netEd + perpY * offAmt;
        var netColor = css('--fbd-net');
        var netLabel = (study && !s.revealed.net) ? 'ΣF = ?' : 'ΣF = ' + netMag.toFixed(1) + ' N';
        ctx.save();
        if (hovIdx !== null) ctx.globalAlpha = 0.2;
        ctx.setLineDash([6, 4]);
        var netMasked = study && !s.revealed.net;
        var netLr = drawArrow(ctx, netSx, netSy, netDx, netDy, netColor, netLabel, w, h, undefined, netMasked);
        ctx.restore();
        s.netHit = { lr: netLr, sx: netSx, sy: netSy, ex: netSx + netDx, ey: netSy + netDy };
      }
    }

    if (hovIdx !== null && hovIdx >= 0 && hovIdx < forces.length) {
      var hf = forces[hovIdx];
      var ha = arrows[hovIdx];
      var meta = typeMeta[hf.type] || typeMeta.custom;
      var c = css(meta.color);

      var compDx = ha.dx, compDy = ha.dy;
      var magX = Math.abs(hf.magnitude * Math.cos(ha.rad));
      var magY = Math.abs(hf.magnitude * Math.sin(ha.rad));
      var minComp = 0.5;

      if (magX > minComp && magY > minComp) {
        var cornerX = ha.sx + compDx, cornerY = ha.sy;

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = css('--hint');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ha.ex, ha.ey);
        ctx.lineTo(cornerX, cornerY);
        ctx.lineTo(ha.sx, ha.sy);
        ctx.stroke();
        ctx.restore();

        var sqSize = 6;
        var sqDirX = compDx > 0 ? -1 : 1;
        var sqDirY = compDy > 0 ? 1 : -1;
        ctx.strokeStyle = css('--hint');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cornerX + sqDirX * sqSize, cornerY);
        ctx.lineTo(cornerX + sqDirX * sqSize, cornerY + sqDirY * sqSize);
        ctx.lineTo(cornerX, cornerY + sqDirY * sqSize);
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.setLineDash([3, 3]);
        drawArrow(ctx, ha.sx, ha.sy, compDx, 0, c, null, w, h, 6);
        drawArrow(ctx, ha.sx, ha.sy, 0, compDy, c, null, w, h, 6);
        ctx.restore();

        ctx.font = '600 10px "DM Mono", monospace';
        ctx.fillStyle = c;
        var compMasked = study && !s.revealed[hovIdx];
        var fxLabel = compMasked ? 'Fx = ???' : 'Fx = ' + magX.toFixed(1) + ' N';
        var fyLabel = compMasked ? 'Fy = ???' : 'Fy = ' + magY.toFixed(1) + ' N';
        var fxMidX = ha.sx + compDx / 2;
        var fxMidY = ha.sy + (compDy > 0 ? -10 : 12);
        ctx.textAlign = 'center'; ctx.textBaseline = compDy > 0 ? 'bottom' : 'top';
        if (compMasked) {
          var fxTw = ctx.measureText(fxLabel).width;
          drawMaskRect(ctx, fxMidX, fxMidY, fxTw, 'center', ctx.textBaseline);
          ctx.fillStyle = 'transparent';
        }
        ctx.fillText(fxLabel, fxMidX, fxMidY);
        ctx.fillStyle = c;
        var fyMidX = ha.sx + (compDx > 0 ? -10 : 10);
        var fyMidY = ha.sy + compDy / 2;
        ctx.textAlign = compDx > 0 ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        if (compMasked) {
          var fyTw = ctx.measureText(fyLabel).width;
          drawMaskRect(ctx, fyMidX, fyMidY, fyTw, ctx.textAlign, 'middle');
          ctx.fillStyle = 'transparent';
        }
        ctx.fillText(fyLabel, fyMidX, fyMidY);
      }
    }

    if (study) {
      var allRevealed = true;
      for (var ri = 0; ri < forces.length; ri++) { if (!s.revealed[ri]) { allRevealed = false; break; } }
      if (!allRevealed) {
        ctx.font = '10px "DM Mono", monospace';
        ctx.fillStyle = css('--hint');
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('click forces to reveal values', w - 8, h - 6);
      }
    }
  }

  window.drawFBD = function (canvasId, config) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width;
    var h = Math.round(w * 0.65);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    store[canvasId] = {
      canvas: canvas, ctx: ctx, config: config,
      w: w, h: h, arrows: [], hovIdx: null,
      gridOffset: { x: 0, y: 0 }, netX: 0, netY: 0, animId: null,
      orbitAngle: config.orbit ? (config.orbit.position || 0) * Math.PI / 180 : 0, orbitAnimId: null,
      revealed: {}
    };

    if (config.controls && config.update) {
      var vals = {};
      config.controls.forEach(function (c) { if (c.type !== 'toggle') vals[c.id] = c.value; });
      var init = config.update(vals);
      if (init.forces) config.forces = init.forces;
      if (init.groundAngle !== undefined) config.groundAngle = init.groundAngle;
      if (init.springK !== undefined && config.spring) config.spring.k = init.springK;
      if (init.springDisp !== undefined && config.spring) config.spring.displacement = init.springDisp;
      if (init.orbitSpeed !== undefined && config.orbit) config.orbit.speed = init.orbitSpeed;
      if (init.orbitRadius !== undefined && config.orbit) config.orbit.radius = init.orbitRadius;
      if (init.orbitVelocity !== undefined && config.orbit) config.orbit.velocity = init.orbitVelocity;
      if (init.orbitBreak !== undefined && config.orbit) config.orbit.broken = init.orbitBreak;
      var wrap = canvas.parentElement;
      var cap = wrap.querySelector('.graph-caption');
      if (cap && init.caption) { var cs = cap.querySelector('span'); if (cs) { cs.innerHTML = init.caption; if (window.MathJax) MathJax.typesetPromise([cs]).catch(function(){}); } }

      var wrap = canvas.parentElement;
      var old = wrap.querySelector('.fbd-controls');
      if (old) old.remove();

      var cd = document.createElement('div');
      cd.className = 'fbd-controls';

      var inputs = {};

      function updateTracks() {
        for (var tid in inputs) {
          var t = inputs[tid];
          if (!t.ctrl.greyAfter) continue;
          var ref = inputs[t.ctrl.greyAfter];
          if (!ref) continue;
          var mn = parseFloat(t.ctrl.min), mx = parseFloat(t.ctrl.max);
          var pct = ((vals[t.ctrl.greyAfter] - mn) / (mx - mn)) * 100;
          var strong = css('--border-strong');
          var dim = css('--border');
          t.inp.style.background = 'linear-gradient(to right, ' + strong + ' ' + pct + '%, ' + dim + ' ' + pct + '%)';
        }
      }

      config.controls.forEach(function (ctrl) {
        if (ctrl.type === 'toggle') {
          var row = document.createElement('div');
          row.className = 'fbd-control';
          var lbl = document.createElement('span');
          lbl.className = 'fbd-control-label';
          lbl.textContent = ctrl.label;
          var btn = document.createElement('button');
          btn.className = 'fbd-randomize';
          btn.type = 'button';
          btn.textContent = ctrl.toggleLabel;
          btn.style.flex = '1'; btn.style.textAlign = 'center';
          btn.addEventListener('click', ctrl.toggleFn);
          row.appendChild(lbl); row.appendChild(btn);
          cd.appendChild(row);
          return;
        }

        var row = document.createElement('div');
        row.className = 'fbd-control';

        var lbl = document.createElement('span');
        lbl.className = 'fbd-control-label';
        lbl.textContent = ctrl.label;

        var inp = document.createElement('input');
        inp.type = 'range';
        inp.min = ctrl.min;
        inp.max = ctrl.max;
        inp.step = ctrl.step || 1;
        inp.value = ctrl.value;

        var vSpan = document.createElement('span');
        vSpan.className = 'fbd-control-val';
        vSpan.textContent = ctrl.value + ' ' + (ctrl.unit || '');

        inputs[ctrl.id] = { inp: inp, vSpan: vSpan, ctrl: ctrl };

        inp.addEventListener('input', function () {
          var v = parseFloat(inp.value);
          vals[ctrl.id] = v;

          if (ctrl.gte) {
            var other = inputs[ctrl.gte];
            if (other && parseFloat(other.inp.value) < v) {
              other.inp.value = v;
              vals[ctrl.gte] = v;
              var odp = (other.ctrl.step && other.ctrl.step < 1) ? ('' + other.ctrl.step).split('.')[1].length : 0;
              other.vSpan.textContent = v.toFixed(odp) + ' ' + (other.ctrl.unit || '');
            }
          }
          if (ctrl.lte) {
            var other = inputs[ctrl.lte];
            if (other && parseFloat(other.inp.value) > v) {
              other.inp.value = v;
              vals[ctrl.lte] = v;
              var odp = (other.ctrl.step && other.ctrl.step < 1) ? ('' + other.ctrl.step).split('.')[1].length : 0;
              other.vSpan.textContent = v.toFixed(odp) + ' ' + (other.ctrl.unit || '');
            }
          }

          var dp = (ctrl.step && ctrl.step < 1) ? ('' + ctrl.step).split('.')[1].length : 0;
          vSpan.textContent = v.toFixed(dp) + ' ' + (ctrl.unit || '');
          var upd = config.update(vals);
          if (upd.forces) config.forces = upd.forces;
          if (upd.groundAngle !== undefined) config.groundAngle = upd.groundAngle;
          if (upd.springK !== undefined && config.spring) config.spring.k = upd.springK;
          if (upd.springDisp !== undefined && config.spring) config.spring.displacement = upd.springDisp;
          if (upd.orbitSpeed !== undefined && config.orbit) config.orbit.speed = upd.orbitSpeed;
          if (upd.orbitRadius !== undefined && config.orbit) config.orbit.radius = upd.orbitRadius;
          if (upd.orbitVelocity !== undefined && config.orbit) config.orbit.velocity = upd.orbitVelocity;
          if (upd.orbitBreak !== undefined && config.orbit) { config.orbit.broken = upd.orbitBreak; if (upd.orbitBreak) store[canvasId].fallTime = 0; }
          var cap = wrap.querySelector('.graph-caption');
          if (cap && upd.caption) { cap.innerHTML = '<span>' + upd.caption + '</span>'; if (window.MathJax) MathJax.typesetPromise([cap]).catch(function(){}); }
          render(canvasId, store[canvasId].hovIdx);
          updateAnim(canvasId);
          updateTracks();
        });

        row.appendChild(lbl);
        row.appendChild(inp);
        row.appendChild(vSpan);
        cd.appendChild(row);
      });

      wrap.appendChild(cd);
      updateTracks();

      var cap = wrap.querySelector('.graph-caption');
      if (cap) {
        var randBtn = document.createElement('button');
        randBtn.className = 'fbd-randomize';
        randBtn.type = 'button';
        randBtn.textContent = 'randomize';
        randBtn.addEventListener('click', function () {
          config.controls.forEach(function (ctrl) {
            var mn = parseFloat(ctrl.min), mx = parseFloat(ctrl.max);
            var step = parseFloat(ctrl.step) || 1;
            var steps = Math.round((mx - mn) / step);
            var v = mn + Math.round(Math.random() * steps) * step;
            v = Math.min(mx, Math.max(mn, +v.toFixed(6)));
            vals[ctrl.id] = v;
            var inp = inputs[ctrl.id];
            if (inp) {
              inp.inp.value = v;
              var dp = (ctrl.step && ctrl.step < 1) ? ('' + ctrl.step).split('.')[1].length : 0;
              inp.vSpan.textContent = v.toFixed(dp) + ' ' + (ctrl.unit || '');
            }
          });
          config.controls.forEach(function (ctrl) {
            if (ctrl.gte) {
              var other = inputs[ctrl.gte];
              if (other && vals[ctrl.gte] < vals[ctrl.id]) {
                vals[ctrl.gte] = vals[ctrl.id];
                other.inp.value = vals[ctrl.id];
                var dp = (other.ctrl.step && other.ctrl.step < 1) ? ('' + other.ctrl.step).split('.')[1].length : 0;
                other.vSpan.textContent = vals[ctrl.id].toFixed(dp) + ' ' + (other.ctrl.unit || '');
              }
            }
          });
          var upd = config.update(vals);
          if (upd.forces) config.forces = upd.forces;
          if (upd.groundAngle !== undefined) config.groundAngle = upd.groundAngle;
          if (upd.springK !== undefined && config.spring) config.spring.k = upd.springK;
          if (upd.springDisp !== undefined && config.spring) config.spring.displacement = upd.springDisp;
          if (upd.orbitSpeed !== undefined && config.orbit) config.orbit.speed = upd.orbitSpeed;
          if (upd.orbitRadius !== undefined && config.orbit) config.orbit.radius = upd.orbitRadius;
          if (upd.orbitVelocity !== undefined && config.orbit) config.orbit.velocity = upd.orbitVelocity;
          if (upd.orbitBreak !== undefined && config.orbit) { config.orbit.broken = upd.orbitBreak; if (upd.orbitBreak) store[canvasId].fallTime = 0; }
          if (cap && upd.caption) { var cs = cap.querySelector('span'); if (cs) { cs.innerHTML = upd.caption; if (window.MathJax) MathJax.typesetPromise([cs]).catch(function(){}); } }
          store[canvasId].revealed = {};
          render(canvasId, store[canvasId].hovIdx);
          updateAnim(canvasId);
          updateTracks();
        });
        cap.appendChild(randBtn);

        if (config.orbit && config.orbit.animate) {
          var playBtn = document.createElement('button');
          playBtn.className = 'fbd-pause';
          playBtn.type = 'button';
          playBtn.textContent = 'play';
          playBtn.style.display = 'none';
          playBtn.addEventListener('click', function () {
            var st = store[canvasId];
            st.paused = false;
            playBtn.style.display = 'none';
            updateAnim(canvasId);
          });
          cap.appendChild(playBtn);

          var tScrub = document.createElement('input');
          tScrub.type = 'range';
          tScrub.min = 0; tScrub.max = 1000; tScrub.value = 0; tScrub.step = 1;
          tScrub.id = canvasId + '-scrub';
          tScrub.style.cssText = 'width:100%;height:3px;margin:0;padding:0;display:block;opacity:0;cursor:pointer;-webkit-appearance:none;appearance:none;background:var(--border-strong);border-radius:2px;transition:opacity 0.2s;';
          var scStyle = document.createElement('style');
          scStyle.textContent = '#' + canvasId + '-scrub::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border-radius:50%;background:var(--accent-purple);cursor:pointer;}#' + canvasId + '-scrub::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:var(--accent-purple);border:none;cursor:pointer;}';
          document.head.appendChild(scStyle);
          canvas.after(tScrub);

          var cardWrap = canvas.closest('.graph-card') || wrap;
          var orbScrubbing = false;
          cardWrap.addEventListener('mouseenter', function () { tScrub.style.opacity = '0.5'; });
          cardWrap.addEventListener('mouseleave', function () { if (!orbScrubbing) tScrub.style.opacity = '0'; });

          tScrub.addEventListener('input', function () {
            var st = store[canvasId];
            var scrubRad = (parseFloat(tScrub.value) / 1000) * Math.PI * 2;
            var startRad = (config.orbit.position || 0) * Math.PI / 180;
            st.orbitAngle = config.orbit.clockwise ? startRad - scrubRad : startRad + scrubRad;
            orbScrubbing = true;
            st.paused = true;
            playBtn.style.display = '';
            if (st.orbitAnimId) { cancelAnimationFrame(st.orbitAnimId); st.orbitAnimId = null; }
            render(canvasId, st.hovIdx);
          });
          tScrub.addEventListener('mouseup', function () { orbScrubbing = false; });

          cardWrap.addEventListener('keydown', function (e) {
            if (e.code === 'Space') {
              e.preventDefault();
              var st = store[canvasId];
              if (st.paused) {
                st.paused = false;
                playBtn.style.display = 'none';
                updateAnim(canvasId);
              } else {
                st.paused = true;
                playBtn.style.display = '';
                if (st.orbitAnimId) { cancelAnimationFrame(st.orbitAnimId); st.orbitAnimId = null; }
              }
            }
          });
          cardWrap.setAttribute('tabindex', '0');

          store[canvasId].orbitScrub = tScrub;
        }
      }
    }

    render(canvasId, null);
    updateAnim(canvasId);

    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      var best = null, bestD = 18;
      var st = store[canvasId];

      var legs = st.legendHits || [];
      for (var j = 0; j < legs.length; j++) {
        var lg = legs[j];
        if (mx >= lg.x && mx <= lg.x + lg.w && my >= lg.y && my <= lg.y + lg.h) {
          best = lg.idx; break;
        }
      }

      if (best === null) {
        var arrs = st.arrows;
        for (var i = 0; i < arrs.length; i++) {
          var d = distToSeg(mx, my, arrs[i].sx, arrs[i].sy, arrs[i].ex, arrs[i].ey);
          if (d < bestD) { bestD = d; best = i; }
        }
      }

      if (best !== st.hovIdx) {
        st.hovIdx = best;
        canvas.style.cursor = best !== null ? 'pointer' : '';
        render(canvasId, best);
      }
    });

    canvas.addEventListener('click', function (e) {
      if (!isStudyMode()) return;
      var r = canvas.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      var st = store[canvasId];
      var hit = null;

      var legs = st.legendHits || [];
      for (var j = 0; j < legs.length; j++) {
        var lg = legs[j];
        if (mx >= lg.x && mx <= lg.x + lg.w && my >= lg.y && my <= lg.y + lg.h) {
          hit = lg.idx; break;
        }
      }
      if (hit === null) {
        var arrs = st.arrows;
        for (var i = 0; i < arrs.length; i++) {
          var lr = arrs[i].labelRect;
          if (lr && mx >= lr.x && mx <= lr.x + lr.w && my >= lr.y && my <= lr.y + lr.h) {
            hit = i; break;
          }
        }
        if (hit === null) {
          for (var i = 0; i < arrs.length; i++) {
            if (distToSeg(mx, my, arrs[i].sx, arrs[i].sy, arrs[i].ex, arrs[i].ey) < 18) {
              hit = i; break;
            }
          }
        }
      }
      if (hit === null && st.netHit) {
        var nl = st.netHit.lr;
        if (nl && mx >= nl.x && mx <= nl.x + nl.w && my >= nl.y && my <= nl.y + nl.h) {
          st.revealed.net = !st.revealed.net;
          render(canvasId, st.hovIdx);
          return;
        }
        if (distToSeg(mx, my, st.netHit.sx, st.netHit.sy, st.netHit.ex, st.netHit.ey) < 18) {
          st.revealed.net = !st.revealed.net;
          render(canvasId, st.hovIdx);
          return;
        }
      }
      if (hit !== null) {
        st.revealed[hit] = !st.revealed[hit];
        render(canvasId, st.hovIdx);
      }
    });

    canvas.addEventListener('mouseleave', function () {
      if (store[canvasId].hovIdx !== null) {
        store[canvasId].hovIdx = null;
        canvas.style.cursor = '';
        render(canvasId, null);
      }
    });
  };

  function tickAnim(id) {
    var s = store[id];
    if (!s) return;
    var netMag = Math.hypot(s.netX, s.netY);
    if (netMag < 0.1) {
      s.animId = null;
      return;
    }
    var speed = Math.min(netMag * 0.04, 2.5);
    var dirX = s.netX / netMag;
    var dirY = s.netY / netMag;
    s.gridOffset.x -= dirX * speed;
    s.gridOffset.y += dirY * speed;
    render(id, s.hovIdx);
    s.animId = requestAnimationFrame(function () { tickAnim(id); });
  }

  function tickOrbit(id) {
    var s = store[id];
    if (!s || !s.config.orbit || !s.config.orbit.animate) return;
    var orb = s.config.orbit;
    if (orb.broken) {
      render(id, s.hovIdx);
      s.orbitAnimId = requestAnimationFrame(function () { tickOrbit(id); });
      return;
    }
    var baseSpeed = orb.speed || 0.018;
    if (orb.vertical) {
      var speedFactor = 1 + 0.6 * (1 - Math.sin(s.orbitAngle));
      s.orbitAngle += (orb.clockwise ? -1 : 1) * baseSpeed * speedFactor;
    } else {
      s.orbitAngle += (orb.clockwise ? -1 : 1) * baseSpeed;
    }
    if (s.orbitScrub) {
      var startRad = (s.config.orbit.position || 0) * Math.PI / 180;
      var diff = s.orbitAngle - startRad;
      if (s.config.orbit.clockwise) diff = -diff;
      var progress = ((diff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      s.orbitScrub.value = Math.round((progress / (Math.PI * 2)) * 1000);
    }
    render(id, s.hovIdx);
    s.orbitAnimId = requestAnimationFrame(function () { tickOrbit(id); });
  }

  function updateAnim(id) {
    var s = store[id];
    if (!s) return;

    if (s.config.orbit && s.config.orbit.animate) {
      if (!s.orbitAnimId && !s.paused) {
        s.orbitAnimId = requestAnimationFrame(function () { tickOrbit(id); });
      }
      return;
    }

    if (s.config.spring) return;

    var netMag = Math.hypot(s.netX, s.netY);
    if (netMag >= 0.1 && !s.animId) {
      s.animId = requestAnimationFrame(function () { tickAnim(id); });
    } else if (netMag < 0.1 && s.animId) {
      cancelAnimationFrame(s.animId);
      s.animId = null;
    }
  }

  document.addEventListener('themechange', function () {
    for (var id in store) render(id, store[id].hovIdx);
  });

  document.addEventListener('studymodechange', function (e) {
    for (var id in store) {
      if (!e.detail.active) store[id].revealed = {};
      render(id, store[id].hovIdx);
    }
  });
})();
