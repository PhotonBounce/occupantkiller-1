window.HitIndicators = (function () {
  'use strict';

  var POOL_SIZE = 8;
  var ARROW_FADE_DURATION = 1.5;
  var VIGNETTE_FADE_DURATION = 0.3;
  var BLOOD_FADE_DURATION = 3.0;
  var VIEWPORT_RADIUS_PCT = 0.8;
  var ARROW_SIZE = 60;

  var container = null;
  var vignetteEl = null;
  var bloodCanvas = null;
  var bloodCtx = null;
  var bloodTimer = 0;
  var bloodAlpha = 0;
  var arrowPool = [];
  var activeArrows = [];
  var vignetteTimer = 0;
  var initialized = false;
  var shakeTimer = 0;
  var shakeIntensity = 0;

  function init() {
    if (initialized) return;
    initialized = true;

    container = document.createElement('div');
    container.id = 'hit-indicators-container';
    container.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:9999',
      'overflow:hidden'
    ].join(';');
    document.body.appendChild(container);

    vignetteEl = document.createElement('div');
    vignetteEl.id = 'hit-vignette';
    vignetteEl.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:radial-gradient(ellipse at center, transparent 60%, rgba(255,0,0,0.35) 100%)',
      'opacity:0',
      'pointer-events:none'
    ].join(';');
    container.appendChild(vignetteEl);

    bloodCanvas = document.createElement('canvas');
    bloodCanvas.id = 'hit-blood-canvas';
    bloodCanvas.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none'
    ].join(';');
    bloodCanvas.width = window.innerWidth;
    bloodCanvas.height = window.innerHeight;
    bloodCtx = bloodCanvas.getContext('2d');
    container.appendChild(bloodCanvas);

    for (var i = 0; i < POOL_SIZE; i++) {
      var el = document.createElement('div');
      el.style.cssText = [
        'position:absolute',
        'width:' + ARROW_SIZE + 'px',
        'height:' + ARROW_SIZE + 'px',
        'display:none',
        'pointer-events:none',
        'text-align:center',
        'line-height:' + ARROW_SIZE + 'px',
        'font-size:' + ARROW_SIZE + 'px'
      ].join(';');
      el.innerHTML = '<svg width="' + ARROW_SIZE + '" height="' + ARROW_SIZE + '" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><polygon points="30,2 58,58 30,44 2,58" fill="currentColor"/></svg>';
      container.appendChild(el);
      arrowPool.push(el);
    }

    window._onPlayerHitForIndicator = function (damage, attackerWorldPos) {
      if (attackerWorldPos) {
        showHit(attackerWorldPos.x, attackerWorldPos.z, damage);
      } else {
        showHit(0, 0, damage);
      }
    };

    window.addEventListener('resize', function () {
      if (bloodCanvas) {
        bloodCanvas.width = window.innerWidth;
        bloodCanvas.height = window.innerHeight;
      }
    });
  }

  function getPlayerWorldPos() {
    if (window.player && window.player.position) {
      return { x: window.player.position.x, z: window.player.position.z };
    }
    if (window.camera && window.camera.position) {
      return { x: window.camera.position.x, z: window.camera.position.z };
    }
    return { x: 0, z: 0 };
  }

  function showHit(attackerX, attackerZ, damage) {
    if (!initialized) init();

    triggerVignette();
    drawBloodSplatters();

    var playerPos = getPlayerWorldPos();
    var dx = attackerX - playerPos.x;
    var dz = attackerZ - playerPos.z;

    var angle = Math.atan2(dx, -dz);

    var playerYaw = 0;
    if (window.camera) {
      if (window.camera.rotation) {
        playerYaw = window.camera.rotation.y || 0;
      }
    }
    var relAngle = angle - playerYaw;

    var arrow = getPooledArrow();
    if (!arrow) return;

    var isCritical = damage > 50;
    var color;
    var isPulsing = false;
    if (damage < 15) {
      color = 'rgba(255,182,193,0.85)';
    } else if (damage <= 35) {
      color = 'rgba(220,0,0,0.95)';
    } else {
      color = 'rgba(200,0,0,1)';
      isPulsing = true;
    }

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var cx = vw / 2;
    var cy = vh / 2;
    var radius = Math.min(vw, vh) * VIEWPORT_RADIUS_PCT / 2;

    var ex = cx + Math.sin(relAngle) * radius;
    var ey = cy - Math.cos(relAngle) * radius;

    arrow.style.display = 'block';
    arrow.style.left = (ex - ARROW_SIZE / 2) + 'px';
    arrow.style.top = (ey - ARROW_SIZE / 2) + 'px';
    arrow.style.color = color;
    arrow.style.transform = 'rotate(' + (relAngle * 180 / Math.PI) + 'deg)';
    arrow.style.opacity = '0.9';

    var arrowData = {
      el: arrow,
      timer: 0,
      duration: ARROW_FADE_DURATION,
      isPulsing: isPulsing,
      isCritical: isCritical,
      flashCount: 0,
      flashTimer: 0
    };

    if (isCritical) {
      triggerScreenShake(0.5, 0.4);
      arrowData.flashCount = 3;
      arrowData.flashTimer = 0;
    }

    activeArrows.push(arrowData);
  }

  function triggerVignette() {
    vignetteTimer = 0;
    vignetteEl.style.opacity = '1';
  }

  function drawBloodSplatters() {
    if (!bloodCtx) return;
    bloodCtx.clearRect(0, 0, bloodCanvas.width, bloodCanvas.height);
    bloodCanvas.style.opacity = '0.5';
    bloodAlpha = 0.5;
    bloodTimer = 0;

    var w = bloodCanvas.width;
    var h = bloodCanvas.height;

    for (var i = 0; i < 3; i++) {
      var x = Math.random() * w;
      var y = Math.random() * h;
      var baseR = 20 + Math.random() * 40;

      bloodCtx.beginPath();
      bloodCtx.fillStyle = 'rgb(' + (100 + Math.floor(Math.random() * 30)) + ',0,0)';
      var pts = 8 + Math.floor(Math.random() * 5);
      for (var j = 0; j < pts; j++) {
        var a = (j / pts) * Math.PI * 2;
        var r = baseR * (0.6 + Math.random() * 0.7);
        var px = x + Math.cos(a) * r;
        var py = y + Math.sin(a) * r;
        if (j === 0) bloodCtx.moveTo(px, py);
        else bloodCtx.lineTo(px, py);
      }
      bloodCtx.closePath();
      bloodCtx.fill();

      for (var k = 0; k < 4; k++) {
        var dropX = x + (Math.random() - 0.5) * baseR * 3;
        var dropY = y + (Math.random() - 0.5) * baseR * 3;
        var dropR = 3 + Math.random() * 10;
        bloodCtx.beginPath();
        bloodCtx.fillStyle = 'rgb(' + (80 + Math.floor(Math.random() * 20)) + ',0,0)';
        bloodCtx.arc(dropX, dropY, dropR, 0, Math.PI * 2);
        bloodCtx.fill();
      }
    }
  }

  function triggerScreenShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTimer = duration;
  }

  function applyScreenShake(dt) {
    if (shakeTimer <= 0) {
      if (document.body.style.transform) {
        document.body.style.transform = '';
      }
      return;
    }
    shakeTimer -= dt;
    if (shakeTimer <= 0) {
      shakeTimer = 0;
      document.body.style.transform = '';
      return;
    }
    var progress = shakeTimer / shakeIntensity;
    var mag = shakeIntensity * 20 * progress;
    var sx = (Math.random() - 0.5) * 2 * mag;
    var sy = (Math.random() - 0.5) * 2 * mag;
    document.body.style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
  }

  function getPooledArrow() {
    for (var i = 0; i < arrowPool.length; i++) {
      var isActive = false;
      for (var j = 0; j < activeArrows.length; j++) {
        if (activeArrows[j].el === arrowPool[i]) {
          isActive = true;
          break;
        }
      }
      if (!isActive) return arrowPool[i];
    }
    return null;
  }

  function update(dt) {
    if (!initialized) return;

    applyScreenShake(dt);

    if (vignetteTimer < VIGNETTE_FADE_DURATION) {
      vignetteTimer += dt;
      var vp = 1 - vignetteTimer / VIGNETTE_FADE_DURATION;
      if (vp < 0) vp = 0;
      vignetteEl.style.opacity = String(vp);
    }

    if (bloodTimer < BLOOD_FADE_DURATION && bloodAlpha > 0) {
      bloodTimer += dt;
      var bp = 1 - bloodTimer / BLOOD_FADE_DURATION;
      if (bp < 0) bp = 0;
      bloodCanvas.style.opacity = String(bp * 0.5);
    }

    var stillActive = [];
    for (var i = 0; i < activeArrows.length; i++) {
      var a = activeArrows[i];
      a.timer += dt;

      if (a.isCritical && a.flashCount > 0) {
        a.flashTimer += dt;
        if (a.flashTimer > 0.1) {
          a.flashTimer = 0;
          a.flashCount--;
          a.el.style.opacity = a.el.style.opacity === '0' ? '0.9' : '0';
        }
      }

      if (a.isPulsing) {
        var pulse = 0.7 + 0.3 * Math.sin(a.timer * Math.PI * 4);
        var fadeRatio = 1 - a.timer / a.duration;
        if (fadeRatio < 0) fadeRatio = 0;
        a.el.style.opacity = String(0.9 * pulse * fadeRatio);
      } else if (!a.isCritical || a.flashCount <= 0) {
        var fade = 1 - a.timer / a.duration;
        if (fade < 0) fade = 0;
        a.el.style.opacity = String(0.9 * fade);
      }

      if (a.timer < a.duration) {
        stillActive.push(a);
      } else {
        a.el.style.display = 'none';
        a.el.style.opacity = '0';
      }
    }
    activeArrows = stillActive;
  }

  function reset() {
    for (var i = 0; i < activeArrows.length; i++) {
      activeArrows[i].el.style.display = 'none';
      activeArrows[i].el.style.opacity = '0';
    }
    activeArrows = [];
    vignetteTimer = VIGNETTE_FADE_DURATION;
    vignetteEl.style.opacity = '0';
    if (bloodCtx) {
      bloodCtx.clearRect(0, 0, bloodCanvas.width, bloodCanvas.height);
    }
    bloodTimer = BLOOD_FADE_DURATION;
    bloodAlpha = 0;
    bloodCanvas.style.opacity = '0';
    shakeTimer = 0;
    if (document.body.style.transform) {
      document.body.style.transform = '';
    }
  }

  return {
    init: init,
    showHit: showHit,
    update: update,
    reset: reset
  };
})();
