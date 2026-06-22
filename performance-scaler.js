/**
 * PerformanceScaler — adaptive quality auto-scaling for OccupantKiller
 * Window-global IIFE module. Detects device capability and scales
 * rendering quality from POTATO to ULTRA tiers automatically.
 *
 * API:
 *   PerformanceScaler.tick(frameTimeMs)  — call each frame from game loop
 *   PerformanceScaler.setTier('HIGH')    — manual override
 *   PerformanceScaler.maxEnemies         — readable cap for enemy spawner
 *   PerformanceScaler.maxParticles       — readable cap for particle systems
 *   PerformanceScaler.drawDistance       — readable draw distance (units)
 *   window.__perf_set('MEDIUM')          — console shortcut alias
 */
(function () {
  'use strict';

  // ── Quality tier definitions ─────────────────────────────────────────────
  var TIERS = {
    ULTRA:  { name: 'ULTRA',  pixelRatio: 1.5, drawDistance: 500, maxEnemies: 100, maxParticles: 200, shadows: true  },
    HIGH:   { name: 'HIGH',   pixelRatio: 1.0, drawDistance: 350, maxEnemies: 70,  maxParticles: 120, shadows: true  },
    MEDIUM: { name: 'MEDIUM', pixelRatio: 0.75,drawDistance: 200, maxEnemies: 50,  maxParticles: 60,  shadows: false },
    LOW:    { name: 'LOW',    pixelRatio: 0.5, drawDistance: 120, maxEnemies: 30,  maxParticles: 30,  shadows: false },
    POTATO: { name: 'POTATO', pixelRatio: 0.4, drawDistance: 80,  maxEnemies: 20,  maxParticles: 15,  shadows: false },
  };

  var TIER_ORDER = ['POTATO', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

  // ── Internal state ───────────────────────────────────────────────────────
  var _currentTierName = 'MEDIUM';
  var _manualOverride  = false;   // set to true when user calls setTier()
  var _initialized     = false;

  // Benchmark / auto-calibration state
  var _benchFrames     = 0;
  var _benchAccumMs    = 0;
  var _benchDone       = false;
  var _benchTarget     = 60;      // frames to sample before first decision

  // Ongoing frame-time tracking for live adaptation
  var _ftAccumMs       = 0;
  var _ftSamples       = 0;
  var _ftWindowSec     = 3.0;     // seconds per evaluation window
  var _ftWindowElapsed = 0;       // seconds elapsed in current window
  var _highFpsStreakSec= 0;       // consecutive seconds above upgrade threshold
  var _firstRunDone    = false;   // never auto-upgrade above HIGH on first run

  // ── HUD element ─────────────────────────────────────────────────────────
  var _hudEl = null;
  var _hudFadeTimer = null;

  function _createHud() {
    if (_hudEl) return;
    var el = document.createElement('div');
    el.id = '__perf-scaler-hud';
    el.style.cssText = [
      'position:fixed',
      'bottom:14px',
      'right:14px',
      'z-index:99990',
      'font-family:monospace',
      'font-size:11px',
      'color:#aaffaa',
      'background:rgba(0,0,0,0.55)',
      'border:1px solid rgba(100,200,100,0.35)',
      'padding:3px 9px',
      'border-radius:4px',
      'pointer-events:auto',
      'cursor:pointer',
      'transition:opacity 0.5s',
      'opacity:0',
      'user-select:none',
    ].join(';');
    el.title = 'Click to dismiss';
    el.addEventListener('click', function () {
      el.style.opacity = '0';
    });
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _showHud(tierName, message) {
    if (typeof document === 'undefined') return;
    if (!_hudEl) _createHud();
    _hudEl.textContent = '⚡ ' + tierName + (message ? ' — ' + message : '');
    _hudEl.style.opacity = '1';
    if (_hudFadeTimer) clearTimeout(_hudFadeTimer);
    _hudFadeTimer = setTimeout(function () {
      if (_hudEl) _hudEl.style.opacity = '0';
    }, 5000);
  }

  function _showToast(msg, color) {
    // Try to use the game's existing HUD notification first
    try {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup(msg, color || '#88ffaa');
        return;
      }
    } catch (e) {}
    // Fallback: show in our own HUD element
    _showHud(_currentTierName, msg);
  }

  // ── Apply a tier to the renderer / game globals ──────────────────────────
  function _applyTier(tier) {
    var r = window.__renderer;
    if (r) {
      try {
        var dpr = window.devicePixelRatio || 1;
        r.setPixelRatio(Math.min(dpr, tier.pixelRatio));
        r.shadowMap.enabled = tier.shadows;
      } catch (e) {}
    }

    // Expose readable properties
    PerformanceScaler.maxEnemies   = tier.maxEnemies;
    PerformanceScaler.maxParticles = tier.maxParticles;
    PerformanceScaler.drawDistance = tier.drawDistance;

    // Fog far distance for game-manager to read
    window.__fogFar = tier.drawDistance;

    // Dispatch event for other modules
    try {
      window.dispatchEvent(new CustomEvent('quality-tier-change', { detail: tier }));
    } catch (e) {}
  }

  // ── Public setTier ───────────────────────────────────────────────────────
  function setTier(name, isAuto) {
    var tier = TIERS[name];
    if (!tier) {
      console.warn('[PerformanceScaler] Unknown tier:', name);
      return;
    }
    var prev = _currentTierName;
    _currentTierName = name;
    if (!isAuto) _manualOverride = true;

    _applyTier(tier);
    _showHud(name);

    if (prev !== name) {
      console.log('[PerformanceScaler] Tier:', prev, '->', name, isAuto ? '(auto)' : '(manual)');
    }
  }

  // ── Device capability probe ──────────────────────────────────────────────
  function _probe() {
    var score = 0; // higher = better hardware

    // Device pixel ratio — high DPR on old hardware = pain
    var dpr = window.devicePixelRatio || 1;
    if (dpr <= 1)        score += 2;
    else if (dpr <= 1.5) score += 1;

    // CPU cores
    var cores = navigator.hardwareConcurrency || 2;
    if (cores >= 8)      score += 3;
    else if (cores >= 4) score += 2;
    else if (cores >= 2) score += 1;

    // Device memory (GB), available in Chrome
    var mem = navigator.deviceMemory;
    if (mem !== undefined) {
      if (mem >= 8)      score += 3;
      else if (mem >= 4) score += 2;
      else if (mem >= 2) score += 1;
    } else {
      score += 1; // assume mid
    }

    // GPU renderer string
    try {
      var r = window.__renderer;
      if (r) {
        var gl = r.getContext();
        var ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          var gpuStr = (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
          // Dedicated GPUs
          if (/rtx|gtx [0-9]{4}|radeon rx|arc a[0-9]/.test(gpuStr)) score += 4;
          else if (/gtx|radeon|intel iris xe|apple m[23]/.test(gpuStr)) score += 2;
          else if (/intel|apple m1/.test(gpuStr)) score += 1;
          // Potato indicators
          if (/mali|adreno [23][0-9]{2}|sgx|powervr/.test(gpuStr)) score -= 2;
        }
      }
    } catch (e) {}

    // Mobile detection — penalise score
    var isMobile = 'ontouchstart' in window;
    if (isMobile) score -= 2;

    // Translate score to starting tier
    var startTier;
    if      (score >= 9) startTier = 'HIGH';   // never start at ULTRA (benchmark first)
    else if (score >= 6) startTier = 'MEDIUM';
    else if (score >= 3) startTier = 'LOW';
    else                 startTier = 'POTATO';

    // Mobile override: start at LOW minimum
    if (isMobile && startTier === 'MEDIUM') startTier = 'LOW';

    return startTier;
  }

  // ── Frame time benchmark (first 60 frames) ───────────────────────────────
  function _runBenchFrame(frameTimeMs) {
    _benchFrames++;
    _benchAccumMs += frameTimeMs;
    if (_benchFrames < _benchTarget) return;

    _benchDone = true;
    var avgMs  = _benchAccumMs / _benchFrames;
    var avgFps = 1000 / avgMs;

    console.log('[PerformanceScaler] Benchmark:', avgFps.toFixed(1), 'fps avg over', _benchFrames, 'frames');

    // Don't override manual user settings
    if (_manualOverride) return;

    if (avgMs > 50) {
      // < 20 fps — emergency
      setTier('POTATO', true);
      _showToast('⚡ POTATO mode — severe lag detected', '#ff4444');
    } else if (avgMs > 33) {
      // < 30 fps
      setTier('LOW', true);
      _showToast('⚡ LOW quality — lag detected', '#ffaa44');
    } else if (avgMs < 14) {
      // > 70 fps — can try HIGH (never ULTRA on first run)
      setTier('HIGH', true);
      _showToast('⚡ HIGH quality — great performance!', '#44ffaa');
    }
    // else: keep current probe-determined tier

    _firstRunDone = true;
  }

  // ── Live adaptation (after benchmark) ───────────────────────────────────
  function _liveAdapt(frameTimeMs) {
    _ftAccumMs       += frameTimeMs;
    _ftSamples       ++;
    _ftWindowElapsed += frameTimeMs / 1000;

    if (_ftWindowElapsed < _ftWindowSec) return;

    var avgMs  = _ftAccumMs / _ftSamples;
    var avgFps = 1000 / avgMs;

    // Reset window
    _ftAccumMs       = 0;
    _ftSamples       = 0;
    _ftWindowElapsed = 0;

    if (_manualOverride) return;

    var idx = TIER_ORDER.indexOf(_currentTierName);

    if (avgMs > 50 && idx > 0) {
      // < 20 fps — drop immediately
      var newTier = TIER_ORDER[idx - 1];
      setTier(newTier, true);
      _showToast('⚡ Quality lowered to ' + newTier + ' — heavy lag', '#ff4444');
      _highFpsStreakSec = 0;
    } else if (avgMs > 33 && idx > 0) {
      // < 30 fps — drop one tier
      var newTier = TIER_ORDER[idx - 1];
      setTier(newTier, true);
      _showToast('⚡ Quality lowered to ' + newTier, '#ffaa44');
      _highFpsStreakSec = 0;
    } else if (avgFps > 70) {
      _highFpsStreakSec += _ftWindowSec;
      if (_highFpsStreakSec >= 5 && idx < TIER_ORDER.length - 1) {
        // Cap first-run upgrades at HIGH
        var maxIdx = _firstRunDone ? (TIER_ORDER.length - 1) : TIER_ORDER.indexOf('HIGH');
        if (idx < maxIdx) {
          var newTier = TIER_ORDER[idx + 1];
          setTier(newTier, true);
          _showToast('⚡ Quality raised to ' + newTier, '#44ffaa');
        }
        _highFpsStreakSec = 0;
      }
    } else {
      _highFpsStreakSec = 0;
    }
  }

  // ── Public tick (called by game-manager each frame) ──────────────────────
  function tick(frameTimeMs) {
    if (!_initialized) return;
    if (frameTimeMs <= 0 || frameTimeMs > 2000) return; // sanity check

    if (!_benchDone) {
      _runBenchFrame(frameTimeMs);
    } else {
      _liveAdapt(frameTimeMs);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function _init() {
    if (_initialized) return;
    _initialized = true;

    // Determine starting tier from device probe
    var startTier = _probe();
    setTier(startTier, true);

    console.log('[PerformanceScaler] Initialized. Starting tier:', startTier,
      '| cores:', navigator.hardwareConcurrency || '?',
      '| deviceMemory:', navigator.deviceMemory || '?',
      '| dpr:', window.devicePixelRatio || 1,
      '| touch:', 'ontouchstart' in window);
  }

  // Wait for DOM to be ready before injecting HUD
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    // DOM already ready — init on next tick so other scripts can set window.__renderer first
    setTimeout(_init, 0);
  }

  // ── Public API object (defined before _applyTier uses it) ───────────────
  var PerformanceScaler = {
    tick:           tick,
    setTier:        setTier,
    getCurrentTier: function () { return TIERS[_currentTierName]; },
    getTierName:    function () { return _currentTierName; },
    // Readable properties (kept in sync by _applyTier)
    maxEnemies:    TIERS['MEDIUM'].maxEnemies,
    maxParticles:  TIERS['MEDIUM'].maxParticles,
    drawDistance:  TIERS['MEDIUM'].drawDistance,
  };

  window.PerformanceScaler = PerformanceScaler;

  // Convenience console alias
  window.__perf_set = function (name) { PerformanceScaler.setTier(name); };

  console.log('[PerformanceScaler] Module loaded.');
})();
