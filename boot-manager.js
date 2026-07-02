/* boot-manager.js — Standalone bootstrapping / initialization module
 *
 * Extracted from game-manager.js. Wraps renderer creation, scene setup,
 * lighting, sky, input binding, mobile controls, orientation handling,
 * resize logic, and the high-level init() / startGame() entry points.
 *
 * GameManager-specific dependencies are injected via _deps callbacks.
 */
const BootManager = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE STATE
  // ═══════════════════════════════════════════════════════════════════════
  let _renderer = null;
  let _scene    = null;
  let _camera   = null;
  let _rendererProfile = 'desktop';
  let _mobileControlsReady = false;
  let _updateLoopStarted = false;
  let _skyDome = null;

  let sunLight  = null;
  let ambLight  = null;
  let hemiLight = null;

  // Pointer-lock grace window (prevents spurious pause on slow PCs)
  let _pointerLockGraceUntil = 0;
  // Skip-next-ESC flag (fullscreen exit)
  let _skipNextEsc = false;

  // Mobile detection
  const _uaIsMobile = /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|PlayBook|BB10|Opera Mini/i.test(navigator.userAgent);
  const _isIpadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const _isTouch  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isMobile  = _uaIsMobile || _isIpadOS || (_isTouch && Math.min(window.innerWidth, window.innerHeight) < 900);

  if (isMobile) {
    try { document.documentElement.classList.add('is-mobile'); } catch (e) {}
  }
  try { window.__OK_LOWSPEC = !!isMobile; } catch (e) {}

  // ── Game State Constants (mirrors GameManager.STATE) ──
  const STATE = Object.freeze({
    MENU:        'menu',
    PLAYING:     'playing',
    PAUSED:      'paused',
    BUILD_MODE:  'buildMode',
    DEAD:        'dead',
    WAVE_CLEAR:  'waveClear',
    STAGE_CLEAR: 'stageClear',
    WIN:         'win',
  });

  // ── Input State ──
  const keys = {};
  let mouseDown = false;
  let mouseNewPress = false;
  const touch = {
    moveX: 0, moveY: 0,
    lookX: 0, lookY: 0,
    aimX: 0, aimY: 0,
    firing: false,
    jumping: false,
    reloading: false,
    sprinting: false,
    moveActive: false,
    lookActive: false,
    aimActive: false,
    moveTouchId: null,
    lookTouchId: null,
    aimTouchId: null,
    moveStartX: 0, moveStartY: 0,
    aimStartX: 0, aimStartY: 0,
    tapStartX: 0, tapStartY: 0, tapStartTime: 0,
    gyroEnabled: false,
    gyroReady: false,
    gyroPrevAlpha: null,
    gyroPrevBeta: null,
    gyroDX: 0,
    gyroDY: 0,
    gyroSensitivity: 4.0,
    gyroAutoAssist: true,
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PLACEHOLDER CALLBACKS for GameManager internals
  // ═══════════════════════════════════════════════════════════════════════
  const _deps = {
    // Boot
    clearBootTimeout: function () {},
    getCurrentStageConfig: function () { return null; },
    applyPerfLevel: function (level, fps, silent) {},
    computeInitialPerfLevel: function () { return isMobile ? 3 : 0; },
    onBootProgress: function (pct, label, detail) {},
    startUpdateLoop: function (prevTime) {},

    // Player / game state
    getPlayer: function () {
      return {
        position: new THREE.Vector3(0, 10, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        hp: 100, maxHp: 100, score: 0, kills: 0,
        onGround: false, sprinting: false, height: 1.7,
        stealth: false, role: 'brigade', godMode: false,
        prone: false, bleeding: false, bleedTimer: 0,
        killStreak: 0, streakTimer: 0, dogTags: 0,
        airdropCooldown: 0, nightVision: false,
        isCrouching: false, slideTimer: 0, slideDir: null,
        buildMaterials: { wood:0, stone:0, metal:0, dirt:0, sand:0, brick:0 },
        totalShots:0, totalHits:0, totalHeadshots:0,
        totalDamageTaken:0, bestStreak:0,
        waveKills:0, waveShots:0, waveHits:0,
        waveHeadshots:0, waveDamageTaken:0,
        waveMeleeKills:0, waveFirstKillTime:999,
        waveMaxExplosiveKill:0, distanceWalked:0,
        _lastPos:null, playStartTime:0,
        armor:0, lastDamageTime:10,
        grenades:0,
      };
    },
    getGameState: function () { return STATE.MENU; },
    setGameState: function (state) {},
    getCurrentStage: function () { return 0; },
    setCurrentStage: function (idx) {},
    getCurrentWave: function () { return 0; },
    setCurrentWave: function (w) {},
    getStages: function () { return []; },

    // Terrain / spawn
    findDrySpawnXZ: function () { return { x:0, h:0, z:0 }; },
    getTerrainHeight: function (x, z) { return 0; },
    getRoadWaypoints: function () { return []; },
    getTopSolidY: function (x, z) { return 0; },
    getBlock: function (x, y, z) { return 0; },
    raycastBlock: function (cam, dist) { return null; },
    setBlock: function (x, y, z, type) {},

    // Stage / wave
    applyStage: function (stageIdx) {},
    beginWave: function (wave) {},
    setWaveStartTimer: function (fn, delay) { return 0; },
    clearWaveStartTimer: function (id) { if (id) clearTimeout(id); },

    // Overlays / UI
    hideOverlays: function () {},
    showOverlay: function (name) {},
    showInventory: function () {},
    releaseMouseForUI: function () {},
    requestPointerLock: function () {},
    updateMobileControlsVisibility: function () {},

    // HUD
    showHUD: function () {},
    hideHUD: function () {},
    setHUDHealth: function (hp, maxHp) {},
    setHUDScore: function (score) {},
    setHUDWave: function (wave) {},
    setHUDKills: function (kills) {},
    setHUDStage: function (id, name) {},
    setHUDWeapon: function (name, idx) {},
    refreshWeaponHUD: function () {},
    setHandGrenades: function (n) {},
    notifyPickup: function (msg, color) {},
    announceStage: function (id, name, description, objective) {},
    showToast: function (msg, duration, color) {},
    toggleFPS: function () {},
    toggleSettings: function () {},

    // Subsystem init wrappers
    initCameraSystem: function (cam) {},
    initVoxelWorld: function (scene) {},
    initTimeSystem: function (scene, sun, amb, hemi) {},
    initBuilding: function (scene) {},
    initNPCSystem: function (scene) {},
    initDroneSystem: function (scene, camera) {},
    initEnemyArtillery: function (scene) {},
    initRefineryStrike: function (scene) {},
    initVehicleSystem: function (scene) {},
    initEconomy: function () {},
    initSkillSystem: function () {},
    initRankSystem: function () {},
    initMissionSystem: function () {},
    initAutomation: function () {},
    initPickups: function (scene) {},
    initTracers: function (scene) {},
    initAudioSystem: function () {},
    initWeatherSystem: function (scene, camera) {},
    initMLSystem: function () {},
    initStageVFX: function (scene) {},
    initFlags: function (scene) {},
    initEnvironment: function (scene, camera) {},
    resetCombatExtras: function () {},
    resetTraversal: function () {},
    initEnemyTypes: function () {},
    initWorldFeatures: function (scene, THREE) {},
    resetPerks: function () {},
    clearMissionTypes: function () {},
    initFeedback: function () {},
    initProgression: function () {},
    initBirds: function (scene) {},
    initMortar: function (scene, camera, controls) {},
    initBradley: function (scene, camera, controls) {},
    initPremium: function () {},
    initLottery: function () {},
    initGyro: function (camera) {},

    // Weapons
    createGunMesh: function (camera) {},
    createMuzzleFlash: function (scene, camera) {},
    setOnTerrainDig: function (fn) {},
    setOnTerrainShot: function (fn) {},
    getCurrentWeaponType: function () { return ''; },
    getBlastRadius: function () { return 3; },
    resetWeapons: function () {},
    unlockWeapon: function (idx) {},
    refillAllAmmo: function () {},
    getWeaponCount: function () { return 0; },
    getWeaponName: function (idx) { return ''; },
    isWeaponUnlocked: function (idx) { return false; },
    switchWeaponTo: function (idx) {},
    switchWeaponPrev: function () {},
    switchWeaponNext: function () {},
    forceReload: function () {},
    handleLeftDown: function () {},
    handleLeftUp: function () {},
    handleRightDown: function () {},
    handleRightUp: function () {},
    getCurrentWeaponName: function () { return ''; },
    getCurrentWeaponIdx: function () { return 0; },
    isJammed: function () { return false; },
    clearJam: function () {},
    addAmmo: function (n) {},
    toggleFlashlight: function () {},
    refreshWeaponHud: function () {},
    startInspect: function () {},

    // Camera
    cycleCameraMode: function () {},
    getCameraMode: function () { return 0; },
    getCameraYaw: function () { return 0; },
    setRTSKey: function (key, val) {},
    handleMouseMove: function (dx, dy) {},
    handleWheel: function (deltaY) {},
    toggleDroneViewMode: function () { return 'eye'; },
    getDroneViewMode: function () { return 'eye'; },
    cameraShake: function (intensity, duration) {},

    // Drone system
    isPossessingDrone: function () { return false; },
    releaseDrone: function () {},
    setDroneKey: function (key, val) {},
    getNests: function () { return []; },
    damageNest: function (idx, dmg) {},
    spawnDrone: function (x, y, z, type) {},
    showDroneControlsHUD: function (type) {},
    hideDroneControlsHUD: function () {},
    toggleDroneRemoteView: function () {},
    getNearestFriendlyDrone: function (range) { return null; },
    launchAndPossessDrone: function (type) { return null; },
    autoReconDroneForMission: function (mission) {},
    getDroneSelectionCallback: function () { return null; },
    setDroneSelectionCallback: function (cb) {},

    // Vehicle system
    isInVehicle: function () { return false; },
    isHijacking: function () { return false; },
    cancelHijack: function () {},
    exitVehicle: function () { return null; },
    getNearbyVehicles: function (pos, radius) { return []; },
    startHijack: function (id) {},
    enterVehicle: function (id) {},
    toggleVehicleView: function () {},
    getOccupiedVehicle: function () { return null; },
    setVehicleKey: function (key, val) {},
    honkHorn: function (id) {},
    clearVehicles: function () {},
    spawnVehicle: function (x, y, z, type) {},
    showTankHUD: function () {},
    hideTankHUD: function () {},
    removeEnemyTankClone: function (veh) {},

    // Enemies
    getAllEnemies: function () { return []; },
    damageEnemy: function (e, dmg) {},
    damageEnemyInRadius: function (pos, radius, damage) {},
    spawnSingleEnemy: function (type, opts) {},
    clearEnemies: function () {},

    // NPC
    clearNPCSystem: function () {},
    setPlayerFormation: function (formation) {},
    spawnAssaultGroups: function () {},
    getFriendlyGroups: function () { return []; },
    commandSquad: function (groupId, cmd) {},

    // Building
    clearBuilding: function () {},
    setBuildMode: function (active) {},
    getSelectedTemplate: function () { return null; },
    placeTemplate: function (x, y, z) { return false; },
    removeBlock: function (x, y, z) { return null; },
    selectTemplate: function (name) {},
    cancelTemplate: function () {},
    onBuild: function () {},
    handleBuildClick: function () {},
    handleBuildRemove: function () {},
    handleMinecraftPlace: function () {},

    // Economy / resources
    getResources: function () { return {}; },
    spendResource: function (type, amount) { return true; },
    hasResources: function (cost) { return true; },
    spendMultipleResources: function (cost) { return true; },
    addResource: function (type, amount) {},
    onResourceGathered: function (type, amount) {},
    onEconomyChange: function () {},
    weeklyUpdate: function () {},

    // Skills / Ranks / Progression
    initSkills: function () {},
    onSkillUnlock: function () {},
    initRanks: function () {},
    onRankPromote: function () {},
    refreshDailies: function () {},
    getChallengeModifiers: function () { return {}; },

    // Mission
    initMissions: function () {},
    generateMission: function (type) { return null; },
    generateRandomMission: function () { return null; },
    getActiveMissions: function () { return []; },
    getMissionProgress: function () { return null; },
    onMissionComplete: function (fn) {},
    onMissionFail: function (fn) {},

    // Pickups / Tracers / VFX
    clearPickups: function () {},
    spawnPickup: function (pos, type) {},
    clearTracers: function () {},
    clearStageVFX: function () {},
    clearFlags: function () {},
    clearEnvironment: function () {},
    clearWeatherSystem: function () {},
    initWeather: function (scene, camera) {},
    clearLootParticles: function () {},

    // Time system
    onWeekChange: function (fn) {},
    onPhaseChange: function (fn) {},
    setTimeSpeed: function (speed) {},

    // Audio
    resumeAudio: function () {},
    playMusic: function (track) {},
    stopMusic: function () {},
    isMusicPlaying: function () { return false; },
    resetFirstBlood: function () {},
    stopAmbientLoop: function () {},
    playReloadSound: function () {},
    playExplosionSound: function () {},
    playReadyChime: function () {},
    playRollDodgeSound: function () {},
    playGrappleHookSound: function () {},
    playFortificationBuildSound: function () {},

    // CombatExtras / Traversal / WorldFeatures
    setLean: function (dir) {},
    startInspect: function () {},
    cycleAmmoType: function () { return { name:'STANDARD', color:0xffffff }; },
    useBandage: function () { return false; },
    startBayonetCharge: function () { return false; },
    startMaintenance: function () { return false; },
    toggleBlindFire: function () { return false; },
    tryRoll: function (dir) { return false; },
    quickSwap: function () {},
    tryDolphinDive: function (dir, sprinting) { return false; },
    launchGrapple: function (pos, dir, len, getBlock) { return false; },
    applyExplosionDamage: function (x, y, z, radius, damage) {},
    buildFortification: function (type, x, y, z, scene) {},
    placeMine: function (x, y, z, faction) { return false; },
    startSandbagDeploy: function (x, y, z) { return false; },
    resetTraversal: function () {},

    // Feedback / Perks / MissionTypes
    resetTips: function () {},
    startOnboarding: function () {},
    addPing: function (x, y, z, type, color) {},
    openPerksMenu: function () {},
    openJournal: function () {},
    toggleKillstreakPanel: function () {},

    // Marketplace / backend
    initBackendSync: function () { return Promise.resolve(false); },
    setOKC: function (n) {},
    getOKC: function () { return 0; },
    updateOKC: function (n) {},
    isPremium: function () { return false; },
    addOKC: function (n) {},
    awardCustomOKC: function (n, reason, meta) { return Promise.resolve(); },

    // Mobile / Input helpers
    setMobileAim: function (active) {},
    tapVirtualKey: function (code, holdMs) {},
    toggleGyroAim: function () {},
    toggleInventory: function () {},
    toggleGodMode: function () {},
    toggleStealth: function () {},
    throwHandGrenade: function () {},
    onShovelMine: function (x, y, z, blockType) {},
    onTerrainDestroyed: function (x, y, z, blockType) {},
    onWaveComplete: function () {},
    onPointerLockChange: function () {},

    // Bradley / Environment / Flags / StageVFX
    isBradleyActive: function () { return false; },
    exitBradley: function () {},
    getBradleyVehicle: function () { return null; },
    enterBradley: function () {},
    setBradleyRapidFire: function (active) {},
    clearBradley: function () {},
    clearEnemyArtillery: function () {},
    spawnFlagpole: function (x, y, z, type, height) {},
    clearSuppression: function () {},

    // QA / misc
    isQAMode: function () { return false; },
    getQAStartStage: function () { return 0; },
    getChosenStartStage: function () { return null; },
    getChosenFormation: function () { return 'wedge'; },
    getChosenDroneType: function () { return null; },
    clearShopCountdown: function () {},
  };

  function _setDeps(deps) {
    if (!deps) return;
    for (var k in deps) {
      if (deps.hasOwnProperty(k) && _deps.hasOwnProperty(k) && typeof deps[k] === 'function') {
        _deps[k] = deps[k];
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SELF-CONTAINED HELPERS (no GameManager internals)
  // ═══════════════════════════════════════════════════════════════════════
  function showStartupError(message) {
    var overlay = document.getElementById('error-overlay');
    if (!overlay) return;
    overlay.style.display = 'block';
    overlay.innerText = 'STARTUP ERROR:\n' + message;
  }

  function getPreferredPixelRatio() {
    var dpr = window.devicePixelRatio || 1;
    if (_rendererProfile === 'compatibility') return 1;
    return Math.min(dpr, isMobile ? 1.1 : 1.5);
  }

  function createRendererWithFallback() {
    var container = document.getElementById('game-container');
    var profiles = [
      {
        name: isMobile ? 'mobile' : 'desktop',
        powerPreference: isMobile ? 'default' : 'high-performance',
        precision: isMobile ? 'mediump' : 'highp',
        shadows: !isMobile,
        toneMapping: true,
        exposure: isMobile ? 0.92 : 0.85,
      },
      {
        name: 'compatibility',
        powerPreference: 'default',
        precision: 'lowp',
        shadows: false,
        toneMapping: false,
        exposure: 1.0,
      }
    ];
    var lastError = null;
    for (var pi = 0; pi < profiles.length; pi++) {
      var profile = profiles[pi];
      try {
        var canvas = document.createElement('canvas');
        var attrs = {
          alpha: false,
          antialias: false,
          depth: true,
          stencil: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: profile.powerPreference,
          failIfMajorPerformanceCaveat: false,
        };
        var context = canvas.getContext('webgl2', attrs) ||
                      canvas.getContext('webgl', attrs) ||
                      canvas.getContext('experimental-webgl', attrs);
        if (!context) continue;
        var renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          context: context,
          antialias: false,
          alpha: false,
          depth: true,
          stencil: false,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: profile.powerPreference,
          precision: profile.precision,
        });
        _rendererProfile = profile.name;
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(getPreferredPixelRatio());
        renderer.shadowMap.enabled = profile.shadows;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = profile.toneMapping ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
        renderer.toneMappingExposure = profile.exposure;
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.addEventListener('webglcontextlost', function (e) {
          e.preventDefault();
          showStartupError('WebGL context was lost. Reload the page or close background tabs and try again.');
        }, false);
        if (container) container.appendChild(renderer.domElement);
        return renderer;
      } catch (err) {
        lastError = err;
      }
    }
    throw (lastError || new Error('Unable to create a WebGL context on this device.'));
  }

  function onResize() {
    if (!_camera || !_renderer) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(getPreferredPixelRatio());
  }

  function requestFullscreenAndLockLandscape() {
    try {
      var el = document.documentElement;
      var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (req) {
        var p = req.call(el);
        if (p && p.then) {
          p.then(function () {
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape').catch(function () {});
            }
          }).catch(function () {});
        }
      }
    } catch (e) {}
  }

  function isPortraitNow() {
    if (window.matchMedia) {
      var mm = window.matchMedia('(orientation: portrait)');
      if (mm && typeof mm.matches === 'boolean') return mm.matches;
    }
    return window.innerHeight > window.innerWidth;
  }

  function updateOrientationOverlay() {
    var overlay = document.getElementById('orientation-overlay');
    if (!overlay) return;
    var portrait = isPortraitNow();
    overlay.style.display = (isMobile && portrait) ? 'flex' : 'none';
  }

  function setupOrientationHandling() {
    updateOrientationOverlay();
    window.addEventListener('resize', updateOrientationOverlay);
    window.addEventListener('orientationchange', updateOrientationOverlay);
    if (screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', updateOrientationOverlay);
    }
    var fsBtn = document.getElementById('orientation-fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', requestFullscreenAndLockLandscape);
      fsBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        requestFullscreenAndLockLandscape();
      }, { passive: false });
    }
    var firstTap = function () {
      requestFullscreenAndLockLandscape();
      window.removeEventListener('touchend', firstTap);
    };
    window.addEventListener('touchend', firstTap, { once: true, passive: true });
  }

  function requestPointerLock() {
    if (isMobile) return;
    _pointerLockGraceUntil = performance.now() + 1600;
    if (!_renderer || !_renderer.domElement) return;
    var canvas = _renderer.domElement;
    var ownerDoc = canvas.ownerDocument || document;
    if (!canvas.isConnected || ownerDoc !== document || !document.contains(canvas)) return;
    if (ownerDoc.pointerLockElement === canvas) return;
    if (ownerDoc.visibilityState && ownerDoc.visibilityState !== 'visible') return;
    try {
      var req = canvas.requestPointerLock();
      if (req && typeof req.catch === 'function') {
        req.catch(function () {});
      }
    } catch (_) {}
  }

  function _releaseMouseForUI() {
    try {
      if (typeof document.exitPointerLock === 'function' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (_) {}
    try { document.body.style.cursor = 'auto'; } catch (_) {}
  }

  function showOverlay(name) {
    document.querySelectorAll('.overlay').forEach(function (el) { el.style.display = 'none'; });
    if (name === 'pause') {
      var inv = document.getElementById('inventory-overlay');
      if (inv) {
        try { if (typeof _deps.showInventory === 'function') _deps.showInventory(); } catch (e) {}
        inv.style.display = 'flex';
        _releaseMouseForUI();
        return;
      }
    }
    var el = document.getElementById('overlay-' + name);
    if (el) el.style.display = 'flex';
    _releaseMouseForUI();
  }

  function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(function (el) { el.style.display = 'none'; });
    touch.lookTouchId = null;
    touch.lookActive = false;
    touch.lookX = 0;
    touch.lookY = 0;
    try { var _lz = document.getElementById('mobile-look-zone'); if (_lz) _lz.classList.remove('look-active'); } catch (_e) {}
  }

  function showInventory() {
    // Placeholder — GameManager should inject real inventory renderer via _deps.showInventory
    try { _deps.showInventory(); } catch (_e) {}
  }

  function updateMobileControlsVisibility() {
    if (!isMobile) return;
    var mobileControls = document.getElementById('mobile-controls');
    if (!mobileControls) return;
    var gs = _deps.getGameState();
    var shouldShow = gs === STATE.PLAYING || gs === STATE.BUILD_MODE;
    mobileControls.style.display = shouldShow ? 'block' : 'none';
  }

  function getKeyValueFromCode(code) {
    var map = {
      Escape: 'Escape',
      Tab: 'Tab',
      Space: ' ',
      KeyB: 'b',
      KeyC: 'c',
      KeyF: 'f',
      KeyG: 'g',
      KeyL: 'l',
      KeyV: 'v',
      KeyX: 'x',
      KeyZ: 'z'
    };
    return map[code] || code;
  }

  function tapVirtualKey(code, holdMs) {
    var key = getKeyValueFromCode(code);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: code, key: key, bubbles: true, cancelable: true }));
    window.setTimeout(function () {
      document.dispatchEvent(new KeyboardEvent('keyup', { code: code, key: key, bubbles: true, cancelable: true }));
    }, holdMs || 70);
  }

  function tapVirtualKeyWithShift(code, holdMs) {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift', shiftKey: true, bubbles: true, cancelable: true }));
    var key = getKeyValueFromCode(code);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: code, key: key, shiftKey: true, bubbles: true, cancelable: true }));
    window.setTimeout(function () {
      document.dispatchEvent(new KeyboardEvent('keyup', { code: code, key: key, shiftKey: true, bubbles: true, cancelable: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', key: 'Shift', shiftKey: false, bubbles: true, cancelable: true }));
    }, holdMs || 70);
  }

  function setMobileAim(active) {
    if (_deps.isInVehicle()) {
      var occupied = _deps.getOccupiedVehicle();
      if (occupied && occupied.isTank) {
        _deps.setVehicleKey('mgFire', active);
        return;
      }
    }
    if (active) {
      _deps.handleRightDown();
    } else {
      _deps.handleRightUp();
    }
  }

  function _onDeviceOrientation(e) {
    if (!touch.gyroEnabled) return;
    var a = e.alpha, b = e.beta;
    if (a == null || b == null) return;
    if (touch.gyroPrevAlpha === null) {
      touch.gyroPrevAlpha = a;
      touch.gyroPrevBeta  = b;
      return;
    }
    var dA = a - touch.gyroPrevAlpha;
    if (dA > 180) dA -= 360; else if (dA < -180) dA += 360;
    var dB = b - touch.gyroPrevBeta;
    touch.gyroPrevAlpha = a;
    touch.gyroPrevBeta  = b;
    if (Math.abs(dA) > 30 || Math.abs(dB) > 30) return;
    var sens = touch.gyroSensitivity;
    touch.gyroDX += -dA * sens;
    touch.gyroDY += dB * sens * 0.6;
  }

  function toggleGyroAim() {
    if (!isMobile) return;
    var enable = !touch.gyroEnabled;
    var btn = document.getElementById('btn-gyro');
    function _activate() {
      touch.gyroEnabled = true;
      touch.gyroPrevAlpha = null;
      touch.gyroPrevBeta  = null;
      touch.gyroDX = 0;
      touch.gyroDY = 0;
      if (!touch.gyroReady) {
        window.addEventListener('deviceorientation', _onDeviceOrientation, true);
        touch.gyroReady = true;
      }
      if (btn) btn.classList.add('active');
      try { localStorage.setItem('ok_gyro', '1'); } catch (_e) {}
    }
    function _deactivate() {
      touch.gyroEnabled = false;
      touch.gyroDX = 0;
      touch.gyroDY = 0;
      if (btn) btn.classList.remove('active');
      try { localStorage.setItem('ok_gyro', '0'); } catch (_e) {}
    }
    if (!enable) { _deactivate(); return; }
    var DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (state) {
        if (state === 'granted') _activate();
        else if (btn) btn.classList.remove('active');
      }).catch(function () {});
    } else {
      _activate();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════
  function _init() {
    _deps.clearBootTimeout();

    // Update level badge
    try {
      var _badge = document.getElementById('level-badge');
      var stages = _deps.getStages();
      if (_badge && stages.length) _badge.textContent = 'HYBRID VOXEL WARFARE · ' + stages.length + ' STAGES';
    } catch (_e) {}

    try {
      _renderer = createRendererWithFallback();
      _scene = new THREE.Scene();
      var stageCfg = _deps.getCurrentStageConfig();
      var fogColor = stageCfg && stageCfg.fogColor !== undefined ? stageCfg.fogColor : 0xFFD700;
      _scene.background = new THREE.Color(fogColor);
      _scene.fog = new THREE.Fog(fogColor, 18, isMobile ? 55 : 120);

      if (_rendererProfile === 'compatibility') {
        var compatOverlay = document.getElementById('compat-overlay');
        if (!compatOverlay) {
          compatOverlay = document.createElement('div');
          compatOverlay.id = 'compat-overlay';
          compatOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:32px;background:rgba(0,0,0,0.7);color:#FFD700;font:bold 16px sans-serif;z-index:9999;display:flex;align-items:center;justify-content:center;';
          compatOverlay.innerText = 'Compatibility Mode: Reduced graphics for maximum device support';
          document.body.appendChild(compatOverlay);
        } else {
          compatOverlay.style.display = 'flex';
        }
      } else {
        var co = document.getElementById('compat-overlay');
        if (co) co.style.display = 'none';
      }
    } catch (err) {
      console.error('[INIT] Renderer creation failed:', err);
      showStartupError('This browser could not start WebGL rendering. Try refreshing, closing background tabs, or using a newer browser/GPU profile.');
      return;
    }

    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.02, isMobile ? 140 : 200);

    ambLight = new THREE.AmbientLight(0x888866, 0.8);
    if (_scene) _scene.add(ambLight); else console.warn('Skipped ambLight add: _scene is null');

    sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(20, 30, 10);
    sunLight.castShadow = !isMobile;
    var shadowRes = isMobile ? 512 : 1024;
    sunLight.shadow.mapSize.set(shadowRes, shadowRes);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = isMobile ? 60 : 100;
    sunLight.shadow.camera.left   = -50;
    sunLight.shadow.camera.right  =  50;
    sunLight.shadow.camera.top    =  50;
    sunLight.shadow.camera.bottom = -50;
    if (_scene) _scene.add(sunLight); else console.warn('Skipped sunLight add: _scene is null');

    if (_renderer && _scene && !isMobile && _rendererProfile !== 'compatibility') {
      try {
        var _envCanvas = document.createElement('canvas');
        _envCanvas.width = 128; _envCanvas.height = 64;
        var _ectx = _envCanvas.getContext('2d');
        var _grad = _ectx.createLinearGradient(0, 0, 0, 64);
        _grad.addColorStop(0.00, '#9bb7d4');
        _grad.addColorStop(0.45, '#c9d4dc');
        _grad.addColorStop(0.55, '#7a6b58');
        _grad.addColorStop(1.00, '#2e2820');
        _ectx.fillStyle = _grad; _ectx.fillRect(0, 0, 128, 64);
        var _sun = _ectx.createRadialGradient(96, 15, 0, 96, 15, 22);
        _sun.addColorStop(0, 'rgba(255,250,230,0.95)');
        _sun.addColorStop(1, 'rgba(255,250,230,0)');
        _ectx.fillStyle = _sun; _ectx.fillRect(0, 0, 128, 64);
        var _envTex = new THREE.CanvasTexture(_envCanvas);
        _envTex.mapping = THREE.EquirectangularReflectionMapping;
        var _pmrem = new THREE.PMREMGenerator(_renderer);
        if (_pmrem.compileEquirectangularShader) _pmrem.compileEquirectangularShader();
        var _envRT = _pmrem.fromEquirectangular(_envTex);
        _scene.environment = _envRT.texture;
        _envTex.dispose();
        _pmrem.dispose();
      } catch (eEnv) {}
    }

    hemiLight = new THREE.HemisphereLight(0xFFD700, 0x0057B8, 0.6);
    if (_scene) _scene.add(hemiLight); else console.warn('Skipped hemiLight add: _scene is null');

    (function createSkyDome() {
      var skyGeo = new THREE.SphereGeometry(180, 24, 16);
      var skyVertices = skyGeo.attributes.position;
      var skyColors = new Float32Array(skyVertices.count * 3);
      for (var si = 0; si < skyVertices.count; si++) {
        var y = skyVertices.getY(si);
        var t = Math.max(0, Math.min(1, (y + 180) / 360));
        var r = 0.35 + t * 0.45;
        var g = 0.45 + t * 0.35;
        var b = 0.55 + t * 0.15;
        skyColors[si * 3] = r;
        skyColors[si * 3 + 1] = g;
        skyColors[si * 3 + 2] = b;
      }
      skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
      var skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });
      _skyDome = new THREE.Mesh(skyGeo, skyMat);
      if (_scene) _scene.add(_skyDome); else console.warn('Skipped skyDome add: _scene is null');
    })();

    try { _deps.applyPerfLevel(_deps.computeInitialPerfLevel(), 0, true); } catch (_ePerf) {}

    var _initStep = 0;
    var _initSteps = 14;
    var _bootErrors = [];
    function _safeInit(label, fn) {
      try { fn(); } catch (e) {
        console.warn('[BOOT] ' + label + ' failed:', e);
        _bootErrors.push(label + ': ' + (e && e.message ? e.message : e));
      }
    }
    function _bootStep(label) {
      _initStep++;
      _deps.onBootProgress(30 + Math.round((_initStep / _initSteps) * 65), label,
        _bootErrors.length ? 'warnings: ' + _bootErrors.slice(-2).join('; ') : '');
    }

    _safeInit('camera', function () { _deps.initCameraSystem(_camera); });
    _bootStep('camera');
    _safeInit('voxel world', function () { _deps.initVoxelWorld(_scene); });
    _bootStep('voxel world');
    _safeInit('time', function () { _deps.initTimeSystem(_scene, sunLight, ambLight, hemiLight); });
    _bootStep('time');
    _safeInit('building', function () { _deps.initBuilding(_scene); });
    _bootStep('building');
    _safeInit('npc system', function () { _deps.initNPCSystem(_scene); });
    _bootStep('npc system');
    _safeInit('drones', function () {
      _deps.initDroneSystem(_scene, _camera);
      _deps.initEnemyArtillery(_scene);
    });
    _bootStep('drones');
    _safeInit('refinery', function () { _deps.initRefineryStrike(_scene); });
    _safeInit('vehicles', function () { _deps.initVehicleSystem(_scene); });
    _bootStep('vehicles');
    _safeInit('economy', function () { _deps.initEconomy(); });
    _safeInit('skills', function () { _deps.initSkillSystem(); });
    _safeInit('ranks', function () { _deps.initRankSystem(); });
    _bootStep('progression');
    _safeInit('missions', function () {
      _deps.initMissions();
      _deps.initAutomation();
      _deps.initPickups(_scene);
    });
    _bootStep('missions');
    _safeInit('tracers', function () { _deps.initTracers(_scene); });
    _bootStep('tracers');
    _safeInit('audio', function () { _deps.initAudioSystem(); });
    _safeInit('weather', function () { _deps.initWeatherSystem(_scene, _camera); });
    _safeInit('ml', function () { _deps.initMLSystem(); });
    _safeInit('stagevfx', function () { _deps.initStageVFX(_scene); });
    _safeInit('flags', function () {
      _deps.initFlags(_scene);
      try {
        var player = _deps.getPlayer();
        var spawnX = player && player.position ? player.position.x : 0;
        var spawnZ = player && player.position ? player.position.z : 0;
        var groundY = _deps.getTerrainHeight(spawnX + 6, spawnZ + 6) + 1;
        _deps.spawnFlagpole(spawnX + 6, groundY, spawnZ + 6, 'ukrainian', 4.5);
        var ry = _deps.getTerrainHeight(spawnX + 28, spawnZ - 28) + 1;
        _deps.spawnFlagpole(spawnX + 28, ry, spawnZ - 28, 'russian', 4.0);
      } catch (e) {}
    });
    _safeInit('environment', function () { _deps.initEnvironment(_scene, _camera); });

    _deps.resetCombatExtras();
    _deps.resetTraversal();
    _deps.initEnemyTypes();
    _deps.initWorldFeatures(_scene, THREE);
    _deps.resetPerks();
    _deps.clearMissionTypes();
    _deps.initFeedback();
    _deps.initProgression();
    try { _deps.initBirds(_scene); } catch (e) {}
    try { _deps.initMortar(_scene, _camera, null); } catch (e) {}
    try { _deps.initBradley(_scene, _camera, null); } catch (e) {}
    try { _deps.initPremium(); } catch (e) {}
    try { _deps.initLottery(); } catch (e) {}
    try { _deps.initGyro(_camera); } catch (e) {}

    _deps.createGunMesh(_camera);
    _deps.createMuzzleFlash(_scene, _camera);

    _deps.setOnTerrainDig(function (x, y, z, blockType) {
      _deps.onShovelMine(x, y, z, blockType);
    });
    _deps.setOnTerrainShot(function (x, y, z, blockType) {
      _deps.onTerrainDestroyed(x, y, z, blockType);
      var wType = _deps.getCurrentWeaponType();
      var isExpl = ['AT', 'ATGM', 'AT_HEAVY', 'AT_LIGHT', 'GRENADE', 'INCENDIARY', 'THERMOBARIC'].indexOf(wType) >= 0;
      if (isExpl) {
        var bRadius = _deps.getBlastRadius() || 3;
        _deps.applyExplosionDamage(x, y, z, bRadius, 100);
      }
      var nests = _deps.getNests();
      for (var ni = 0; ni < nests.length; ni++) {
        var n = nests[ni];
        if (!n.alive) continue;
        var ndx = n.x - x, ndz = n.z - z;
        var nestDist = Math.sqrt(ndx * ndx + ndz * ndz);
        if (nestDist < 8) {
          var dmg = isExpl ? 40 : 5;
          _deps.damageNest(ni, dmg);
        }
      }
    });

    _deps.onWeekChange(function () { _deps.weeklyUpdate(); });
    _deps.onPhaseChange(function (phase) {
      _deps.notifyPickup(phase === 'night' ? '🌙 NIGHT FALLS' : '☀️ DAY BREAKS', '#FFCC00');
    });

    _deps.onMissionComplete(function (mission, reward) {
      _deps.notifyPickup('MISSION COMPLETE: ' + mission.name + ' +' + (reward || 0), '#00FF88');
      if (mission.type === 'bradley_assault') {
        try { _deps.setBradleyRapidFire(false); } catch (_ebr) {}
        try { _deps.onWaveComplete(); } catch (_ewc) {}
      }
      try {
        if ((mission.type === 'recon' || mission.type === 'drone_strike') && _deps.isPossessingDrone()) {
          _deps.releaseDrone();
          _deps.showToast('🛬 RECON COMPLETE — returning to ground combat', 3000, '#44ff88');
        }
      } catch (_edr) {}
      if (reward > 0) {
        _deps.addOKC(reward);
        _deps.updateOKC(_deps.getOKC());
      }
      setTimeout(function () {
        var gs = _deps.getGameState();
        var stg = _deps.getCurrentStage();
        var stages = _deps.getStages();
        if (gs === STATE.PLAYING && !(stages[stg] && (stages[stg].droneOnly || stages[stg].bradleyAssault))) {
          var _newM;
          if (stages[stg] && stages[stg].capitalDefense) {
            _newM = _deps.generateMission('kyiv_defense');
          } else if (stages[stg] && stages[stg].id === 1) {
            _newM = _deps.generateMission('airborne_assault');
          } else {
            _newM = _deps.generateRandomMission();
            _deps.autoReconDroneForMission(_newM);
          }
          var active = _deps.getActiveMissions();
          if (active && active.length > 0) {
            _deps.notifyPickup('📋 NEW MISSION: ' + active[active.length - 1].name, '#ffcc00');
          }
        }
      }, 10000);
    });

    _deps.onMissionFail(function (mission) {
      _deps.notifyPickup('MISSION FAILED: ' + mission.name, '#FF4444');
    });

    _deps.onWaveClear(function () {
      _deps.notifyPickup('WAVE CLEARED!', '#00FF88');
    });

    _deps.onBuild(function () {
      _deps.onSkillUnlock();
      _deps.onRankPromote();
    });

    _deps.onEconomyChange(function () {});
    _deps.onSkillUnlock(function () {});
    _deps.onRankPromote(function () {});
    _deps.onDroneRelease(function () { _deps.hideDroneControlsHUD(); });
    _deps.onVehicleEnter(function () { _deps.showTankHUD(); });
    _deps.onVehicleExit(function () { _deps.hideTankHUD(); });

    var _ds = _deps.findDrySpawnXZ();
    var player = _deps.getPlayer();
    if (player && player.position) {
      player.position.set(_ds.x, _ds.h + player.height, _ds.z);
    }

    _deps.setPlayerFormation(window.__chosenFormation || 'wedge');
    if (player && player.role === 'brigade') {
      _deps.spawnAssaultGroups();
    }

    _deps.clearVehicles();
    var roadWPs = _deps.getRoadWaypoints();
    var _rp0 = roadWPs.length > 2 ? roadWPs[2] : new THREE.Vector3(8, 0, 20);
    var _rp1 = roadWPs.length > 6 ? roadWPs[6] : new THREE.Vector3(12, 0, 20);
    var _rp2 = roadWPs.length > 10 ? roadWPs[10] : new THREE.Vector3(-8, 0, 20);
    _deps.spawnVehicle(_rp0.x, _deps.getTerrainHeight(_rp0.x, _rp0.z), _rp0.z, 'transport');
    _deps.spawnVehicle(_rp1.x, _deps.getTerrainHeight(_rp1.x, _rp1.z), _rp1.z, 'combat');
    _deps.spawnVehicle(_rp2.x, _deps.getTerrainHeight(_rp2.x, _rp2.z), _rp2.z, 'turret_rover');
    var _rp3 = roadWPs.length > 14 ? roadWPs[14] : new THREE.Vector3(0, 0, 15);
    _deps.spawnVehicle(_rp3.x, _deps.getTerrainHeight(_rp3.x, _rp3.z), _rp3.z, 'tank');

    _deps.spawnDrone(5, _deps.getTerrainHeight(5, 5) + 8, 5, 'recon');
    _deps.spawnDrone(-5, _deps.getTerrainHeight(-5, 5) + 8, 5, 'fpv_attack');
    _deps.spawnDrone(0, _deps.getTerrainHeight(0, -10) + 10, -10, 'bomb');

    setupInput();

    if (isMobile) {
      if (!_mobileControlsReady) setupMobileControls();
      updateMobileControlsVisibility();
      setupOrientationHandling();
      var controlsHint = document.getElementById('controls-hint');
      if (controlsHint) {
        controlsHint.innerHTML = 'LEFT PAD · MOVE &nbsp;|&nbsp; RIGHT PAD · LOOK &nbsp;|&nbsp; 🔫 FIRE &nbsp;|&nbsp; ◎ AIM &nbsp;|&nbsp; ✋ USE &nbsp;|&nbsp; 🚗 VEHICLE &nbsp;|&nbsp; 🎒 INVENTORY';
      }
      var grHint = document.getElementById('grenade-keyhint');
      if (grHint) grHint.textContent = 'tap 💣 button';
    }

    window.addEventListener('resize', onResize);

    if (!_updateLoopStarted) {
      _updateLoopStarted = true;
      var prevTime = performance.now();
      _deps.startUpdateLoop(prevTime);
      setTimeout(function() {
        var preloader = document.getElementById('boot-preloader');
        window.__gameBootReady = true;
        if (preloader) preloader.style.display = 'none';
      }, 400);
    }

    return { scene: _scene, camera: _camera, renderer: _renderer };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // START GAME
  // ═══════════════════════════════════════════════════════════════════════
  function _startGame() {
    _deps.hideOverlays();
    _deps.clearShopCountdown();

    touch.lookTouchId = null;
    touch.lookActive = false;
    touch.lookX = 0;
    touch.lookY = 0;
    try { var _lz = document.getElementById('mobile-look-zone'); if (_lz) _lz.classList.remove('look-active'); } catch (_e) {}

    try {
      if (!_scene || !_camera) {
        console.warn('[startGame] Aborting: scene/camera not initialized.');
        return;
      }
      _deps.resumeAudio();
      _deps.playMusic('battle');
      _deps.resetFirstBlood();
      _deps.setGameState(STATE.PLAYING);
      _deps.resetTips();

      var player = _deps.getPlayer();
      player.hp = player.maxHp;
      player.score = 0;
      player.kills = 0;
      _deps.setCurrentWave(0);
      _deps.setCurrentStage(0);

      if (_deps.isQAMode() && typeof _deps.getQAStartStage() === 'number') {
        _deps.setCurrentStage(Math.max(0, Math.min(_deps.getStages().length - 1, _deps.getQAStartStage())));
      } else if (typeof _deps.getChosenStartStage() === 'number') {
        _deps.setCurrentStage(Math.max(0, Math.min(_deps.getStages().length - 1, _deps.getChosenStartStage())));
      }

      if (player.velocity) player.velocity.set(0, 0, 0);
      player.armor = 0;
      player.lastDamageTime = 10;
      player.totalShots = 0;
      player.totalHits = 0;
      player.totalHeadshots = 0;
      player.totalDamageTaken = 0;
      player.bestStreak = 0;
      player.waveKills = 0;
      player.waveShots = 0;
      player.waveHits = 0;
      player.waveHeadshots = 0;
      player.waveDamageTaken = 0;
      player.waveMeleeKills = 0;
      player.waveFirstKillTime = 999;
      player.waveMaxExplosiveKill = 0;
      player.distanceWalked = 0;
      player._lastPos = null;
      player.playStartTime = performance.now();
      player.buildMaterials = { wood:0, stone:0, metal:0, dirt:0, sand:0, brick:0 };

      if (_renderer && _renderer.domElement) _renderer.domElement.style.filter = '';
      _deps.clearSuppression();
      _deps.clearLootParticles();
      _deps.resetSkills();

      if (player.godMode) {
        player.maxHp = 999999;
        player.hp = 999999;
        player.stealth = true;
      }

      var chalMods = _deps.getChallengeModifiers();
      if (chalMods.hpMult) {
        player.maxHp = Math.round(player.maxHp * chalMods.hpMult);
        player.hp = player.maxHp;
      }

      _deps.resetCombatExtras();
      _deps.resetTraversal();
      _deps.clearWorldFeatures();
      _deps.resetPerks();
      _deps.clearMissionTypes();
      _deps.clearFeedback();
      _deps.setOKC(0);
      _deps.refreshDailies();

      _deps.applyStage(_deps.getCurrentStage());

      var _dsStart = _deps.findDrySpawnXZ();
      var spawnH = _dsStart.h;
      player.position.set(_dsStart.x, spawnH + player.height, _dsStart.z);

      _deps.resetWeapons();
      if (player.godMode) {
        for (var gi = 0; gi < _deps.getWeaponCount(); gi++) {
          _deps.unlockWeapon(gi);
        }
        _deps.refillAllAmmo();
      }
      _deps.clearEnemies();
      _deps.clearPickups();
      _deps.clearVehicles();
      _deps.clearDroneSystem();
      _deps.clearBradley();
      _deps.clearEnemyArtillery();
      _deps.clearNPCSystem();
      _deps.clearBuilding();
      _deps.clearTracers();
      _deps.clearStageVFX();
      _deps.clearFlags();
      _deps.clearEnvironment();
      _deps.clearWeatherSystem();
      _deps.initWeather(_scene, _camera);

      _deps.setPlayerFormation(window.__chosenFormation || 'wedge');
      if (player.role === 'brigade') _deps.spawnAssaultGroups();

      var _rwps = _deps.getRoadWaypoints();
      var _sp0 = _rwps.length > 2 ? _rwps[2] : new THREE.Vector3(8, 0, 20);
      var _sp1 = _rwps.length > 6 ? _rwps[6] : new THREE.Vector3(12, 0, 20);
      var _sp2 = _rwps.length > 10 ? _rwps[10] : new THREE.Vector3(-8, 0, 20);
      _deps.spawnVehicle(_sp0.x, _deps.getTerrainHeight(_sp0.x, _sp0.z), _sp0.z, 'transport');
      _deps.spawnVehicle(_sp1.x, _deps.getTerrainHeight(_sp1.x, _sp1.z), _sp1.z, 'combat');
      _deps.spawnVehicle(_sp2.x, _deps.getTerrainHeight(_sp2.x, _sp2.z), _sp2.z, 'turret_rover');
      var _sp3 = _rwps.length > 14 ? _rwps[14] : new THREE.Vector3(0, 0, 15);
      _deps.spawnVehicle(_sp3.x, _deps.getTerrainHeight(_sp3.x, _sp3.z), _sp3.z, 'tank');

      _deps.spawnDrone(5, _deps.getTerrainHeight(5, 5) + 8, 5, 'recon');
      _deps.spawnDrone(-5, _deps.getTerrainHeight(-5, 5) + 8, 5, 'fpv_attack');
      _deps.spawnDrone(0, _deps.getTerrainHeight(0, -10) + 10, -10, 'bomb');

      _deps.hideOverlays();
      _deps.showHUD();
      _deps.setHUDHealth(player.hp, player.maxHp);
      _deps.setHUDScore(0);
      _deps.setHUDWave(0);
      _deps.setHUDKills(0);
      var stg = _deps.getCurrentStage();
      var stages = _deps.getStages();
      if (stages[stg]) {
        _deps.setHUDStage(stages[stg].id, stages[stg].name);
      }
      _deps.setHUDWeapon(_deps.getCurrentWeaponName(), _deps.getCurrentWeaponIdx());
      _deps.refreshWeaponHUD();
      _deps.setHandGrenades(player.godMode ? Infinity : (player.grenades || 0));

      setTimeout(function () { _deps.requestPointerLock(); }, 100);

      var cstg = stages[stg];
      if (cstg) {
        _deps.announceStage(cstg.id, cstg.name, cstg.description, cstg.objective);
      }
      _deps.stopAmbientLoop();
      _deps.setWaveStartTimer(function () {
        _deps.beginWave(1);
        try { _deps.startOnboarding(); } catch (_e) {}
      }, 3200);

      if (!(cstg && (cstg.droneOnly || cstg.bradleyAssault))) {
        if (cstg && cstg.capitalDefense) {
          _deps.generateMission('kyiv_defense');
        } else if (cstg && cstg.id === 1) {
          _deps.generateMission('airborne_assault');
        } else {
          var _initMission = _deps.generateRandomMission();
          _deps.autoReconDroneForMission(_initMission);
        }
      }
    } catch (err) {
      console.error('Failed to initialize game:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SETUP INPUT
  // ═══════════════════════════════════════════════════════════════════════
  function setupInput() {
    // Detect fullscreen exit to prevent ESC from also toggling pause
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement) _skipNextEsc = true;
    });
    document.addEventListener('webkitfullscreenchange', function () {
      if (!document.webkitFullscreenElement) _skipNextEsc = true;
    });

    document.addEventListener('keydown', function (e) {
      keys[e.code] = true;

      if (e.code === 'KeyG' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        _deps.toggleGodMode();
        return;
      }

      var gs = _deps.getGameState();
      if (gs === STATE.PLAYING || gs === STATE.BUILD_MODE) {
        if (gs === STATE.BUILD_MODE) {
          if (e.code === 'Digit4') _deps.setTimeSpeed(1);
          if (e.code === 'Digit5') _deps.setTimeSpeed(2);
          if (e.code === 'Digit6') _deps.setTimeSpeed(5);
          if (e.code === 'Digit7') _deps.setTimeSpeed(10);
        }

        if (e.code === 'KeyV' && !_deps.isPossessingDrone() && !_deps.isInVehicle()) {
          _deps.cycleCameraMode();
        }

        if (e.code === 'KeyB') {
          if (gs === STATE.BUILD_MODE) {
            _deps.setGameState(STATE.PLAYING);
            _deps.setBuildMode(false);
            _deps.cancelTemplate();
            var bh = document.getElementById('build-hud');
            if (bh) bh.style.display = 'none';
          } else {
            var player = _deps.getPlayer();
            if (!player.sprinting) {
              _deps.setGameState(STATE.BUILD_MODE);
              _deps.setBuildMode(true);
              var bh2 = document.getElementById('build-hud');
              if (bh2) bh2.style.display = 'block';
            }
          }
        }

        if (e.code === 'KeyL') {
          _deps.toggleFlashlight();
        }

        if (e.code === 'KeyF') {
          var fHandled = false;
          if (_deps.releaseDrone()) { fHandled = true; }
          if (!fHandled) {
            var mt = _deps.getActiveMissions();
            var active = mt && mt.length ? mt[0] : null;
            if (active && active.config) {
              var mtDx = _deps.getPlayer().position.x - (active.config.zoneX || 0);
              var mtDz = _deps.getPlayer().position.z - (active.config.zoneZ || 0);
              if (mtDx * mtDx + mtDz * mtDz < 196) {
                if (active.config.id === 'DEMOLITION') {
                  _deps.notifyPickup('🧨 HOLD [F] TO PLANT CHARGE...', '#ff8800');
                  fHandled = true;
                } else if (active.config.id === 'RESCUE') {
                  var _mtr = _deps.getMissionProgress();
                  var _nearPowDist = 999;
                  if (_mtr && _mtr.pows) {
                    for (var _mpi = 0; _mpi < _mtr.pows.length; _mpi++) {
                      var _mp = _mtr.pows[_mpi];
                      if (_mp.freed) continue;
                      var _mdx2 = _deps.getPlayer().position.x - _mp.x;
                      var _mdz2 = _deps.getPlayer().position.z - _mp.z;
                      _nearPowDist = Math.min(_nearPowDist, _mdx2 * _mdx2 + _mdz2 * _mdz2);
                    }
                  }
                  if (_nearPowDist < 25) {
                    _deps.notifyPickup('🔓 HOLD [F] TO FREE POW...', '#88ff88');
                    fHandled = true;
                  }
                } else if (active.config.id === 'DEFUSE') {
                  var _mtp = _deps.getMissionProgress();
                  var _nearBombDist = 999;
                  if (_mtp && _mtp.bombs) {
                    for (var _dmi = 0; _dmi < _mtp.bombs.length; _dmi++) {
                      var _dm = _mtp.bombs[_dmi];
                      if (_dm.defused) continue;
                      var _ddx = _deps.getPlayer().position.x - _dm.x;
                      var _ddz = _deps.getPlayer().position.z - _dm.z;
                      _nearBombDist = Math.min(_nearBombDist, _ddx * _ddx + _ddz * _ddz);
                    }
                  }
                  if (_nearBombDist < 36) {
                    _deps.notifyPickup('⏱️ HOLD [F] TO DEFUSE...', '#ffcc00');
                    fHandled = true;
                  }
                }
              }
            }
          }
          if (!fHandled) {
            var linked = _deps.launchAndPossessDrone('recon');
            if (linked) fHandled = true;
          }
          if (!fHandled) {
            var qm = _deps.tryRoll ? null : null; // placeholder for quick melee
            if (qm) {
              var enemies = _deps.getAllEnemies();
              for (var qi = 0; qi < enemies.length; qi++) {
                var qe = enemies[qi];
                if (!qe.alive || !qe.mesh) continue;
                var qdx = qe.mesh.position.x - _deps.getPlayer().position.x;
                var qdz = qe.mesh.position.z - _deps.getPlayer().position.z;
                if (qdx * qdx + qdz * qdz < 9) { // 3m range placeholder
                  _deps.damageEnemy(qe, 50);
                  break;
                }
              }
            }
          }
        }

        if (e.code === 'KeyT' && _deps.isPossessingDrone()) {
          _deps.toggleDroneRemoteView();
        }

        if (e.code === 'KeyG' && e.shiftKey) {
          if (_deps.isBradleyActive()) {
            _deps.exitBradley();
            _deps.notifyPickup('🚛 DISMOUNTED BRADLEY', '#a0c878');
          } else if (_deps.isHijacking()) {
            _deps.cancelHijack();
            _deps.notifyPickup('❌ HIJACK CANCELLED', '#ff4444');
          } else if (_deps.isInVehicle()) {
            _deps.hideTankHUD();
            var exitPos = _deps.exitVehicle();
            if (exitPos) {
              _deps.getPlayer().position.copy(exitPos);
              _deps.getPlayer().position.y += _deps.getPlayer().height;
            }
          } else {
            var _bradleyMounted = false;
            var _bv = _deps.getBradleyVehicle();
            if (_bv && _bv.group) {
              var _bdx = _deps.getPlayer().position.x - _bv.group.position.x;
              var _bdz = _deps.getPlayer().position.z - _bv.group.position.z;
              if (_bdx * _bdx + _bdz * _bdz < 49) {
                _deps.enterBradley();
                _deps.notifyPickup('🚛 MOUNTED BRADLEY — M242 Bushmaster ready', '#a0c878');
                _bradleyMounted = true;
              }
            }
            if (!_bradleyMounted) {
              var nearby = _deps.getNearbyVehicles(_deps.getPlayer().position, 5);
              if (nearby.length > 0) {
                var target = nearby[0];
                if (target.faction === 'enemy') {
                  _deps.startHijack(target.id);
                  _deps.removeEnemyTankClone(target);
                  _deps.notifyPickup('🚗 HIJACKING… Hold steady!', '#ff4444');
                } else if (target.occupied) {
                  _deps.startHijack(target.id);
                  _deps.removeEnemyTankClone(target);
                  _deps.notifyPickup('🚗 COMMANDEERING…', '#ffaa00');
                } else {
                  _deps.enterVehicle(target.id);
                  _deps.removeEnemyTankClone(target);
                  if (target.isTank) _deps.showTankHUD();
                  _deps.notifyPickup('🚗 ENTERED VEHICLE', '#44ff44');
                }
              } else {
                _deps.throwHandGrenade();
              }
            }
          }
        }

        if (e.code === 'KeyT' && _deps.isInVehicle()) {
          _deps.toggleVehicleView();
          var veh = _deps.getOccupiedVehicle();
          _deps.notifyPickup(veh && veh.viewMode === 'first' ? '👁 FIRST PERSON VIEW' : '🎥 THIRD PERSON VIEW', '#00ccff');
        }

        if (e.code === 'Backquote') {
          _deps.toggleStealth();
        }

        if (e.code === 'KeyI') {
          _deps.toggleInventory();
        }

        if (e.code === 'KeyZ') {
          var p = _deps.getPlayer();
          p.prone = !p.prone;
          p.isCrouching = false;
          p.height = p.prone ? 0.6 : 1.7;
          _deps.notifyPickup(p.prone ? '🔽 PRONE' : '🔼 STANDING', p.prone ? '#888' : '#fff');
        }

        if (e.code === 'KeyX') {
          var px = _deps.getPlayer();
          if (px.bleeding) {
            px.bleeding = false;
            px.bleedTimer = 0;
            _deps.notifyPickup('🩹 BANDAGE APPLIED', '#22ff55');
          }
        }

        if (e.code === 'KeyN' && _deps.getPlayer().airdropCooldown <= 0) {
          _deps.getPlayer().airdropCooldown = 45;
          _deps.notifyPickup('📦 AIRDROP BEACON DEPLOYED!', '#44ff88');
          setTimeout(function () {
            for (var ai = 0; ai < 6; ai++) {
              var ax = _deps.getPlayer().position.x + (Math.random() - 0.5) * 10;
              var az = _deps.getPlayer().position.z + (Math.random() - 0.5) * 10;
              var ah = _deps.getTerrainHeight(ax, az);
              var types = ['HEALTH','AMMO','ARMOR','MEDKIT','GRENADE','STIM'];
              _deps.spawnPickup(new THREE.Vector3(ax, ah, az), types[Math.floor(Math.random() * types.length)]);
            }
            _deps.playExplosionSound();
            _deps.notifyPickup('📦 AIRDROP ARRIVED!', '#44ff88');
          }, 3000);
        }

        if (e.code === 'KeyR' && _deps.isJammed()) {
          _deps.clearJam();
          _deps.playReloadSound();
          _deps.notifyPickup('🔧 JAM CLEARED!', '#ffcc00');
          return;
        }

        if (e.code === 'Comma') {
          if (_deps.isMusicPlaying()) {
            _deps.stopMusic();
            _deps.notifyPickup('🔇 MUSIC OFF', '#888888');
          } else {
            _deps.playMusic('battle');
            _deps.notifyPickup('🎵 MUSIC ON', '#00ff88');
          }
        }

        if (e.code === 'KeyL') {
          var pl = _deps.getPlayer();
          pl.nightVision = !pl.nightVision;
          _deps.notifyPickup(pl.nightVision ? '🔦 NIGHT VISION ON' : '🔦 NIGHT VISION OFF', pl.nightVision ? '#00ff44' : '#888888');
          if (pl.nightVision) {
            if (ambLight) ambLight.intensity = 1.8;
            if (_scene && _scene.fog) { _scene.fog.near = 80; _scene.fog.far = 200; }
          } else {
            if (ambLight) ambLight.intensity = 0.8;
            if (_scene && _scene.fog) { _scene.fog.near = 30; _scene.fog.far = 140; }
          }
        }

        // Tactical lean
        if (e.code === 'KeyQ' && !_deps.isInVehicle() && !_deps.isPossessingDrone() && keys['AltLeft']) {
          _deps.setLean(-1);
        }
        if (e.code === 'KeyE' && !_deps.isInVehicle() && !_deps.isPossessingDrone() && keys['AltLeft']) {
          _deps.setLean(1);
        }

        // Weapon inspect
        if (e.code === 'KeyV' && !_deps.isInVehicle() && keys['ShiftLeft']) {
          _deps.startInspect();
        }

        // Cycle ammo type
        if (e.code === 'KeyC') {
          var ammoInfo = _deps.cycleAmmoType();
          _deps.notifyPickup('🔄 AMMO: ' + ammoInfo.name, '#' + ammoInfo.color.toString(16).padStart(6, '0'));
        }

        // Field bandage
        if (e.code === 'KeyH') {
          if (_deps.useBandage()) {
            _deps.notifyPickup('🩹 FIELD BANDAGE APPLIED!', '#22ff55');
          }
        }

        // Killstreak
        if (e.code === 'KeyK') {
          _deps.toggleKillstreakPanel();
        }

        // Crouch / slide
        if (e.code === 'ControlLeft' && gs === STATE.PLAYING) {
          var p2 = _deps.getPlayer();
          p2.isCrouching = !p2.isCrouching;
          if (p2.isCrouching && keys['ShiftLeft']) {
            p2.slideTimer = 0.6;
            var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
            fwd.y = 0; fwd.normalize();
            p2.slideDir = fwd;
            _deps.notifyPickup('🏃 SLIDE', '#00ddff');
          }
        }

        // Ping
        if (e.code === 'KeyM' && gs === STATE.PLAYING) {
          var pingPos = _deps.getPlayer().position.clone();
          var pfwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
          pingPos.add(pfwd.multiplyScalar(20));
          _deps.addPing(pingPos.x, pingPos.y, pingPos.z, 'MARK', '#ffff00');
          _deps.notifyPickup('📍 POSITION MARKED', '#ffff00');
        }

        // Perks menu
        if (e.code === 'KeyP' && gs === STATE.PLAYING) {
          _deps.openPerksMenu();
        }

        // War journal
        if (e.code === 'KeyY') {
          _deps.openJournal();
        }

        // Bayonet charge
        if (e.code === 'KeyB' && _deps.getPlayer().sprinting && gs === STATE.PLAYING) {
          if (_deps.startBayonetCharge()) {
            _deps.notifyPickup('🔪 BAYONET CHARGE!', '#ff2222');
          }
        }

        // Maintenance
        if (e.code === 'KeyR' && keys['KeyM']) {
          if (_deps.startMaintenance()) {
            _deps.notifyPickup('🔧 MAINTAINING WEAPON...', '#cccc00');
          }
        }

        // Blind fire
        if (e.code === 'KeyO') {
          var blindOn = _deps.toggleBlindFire();
          _deps.notifyPickup(blindOn ? '🔫 BLIND FIRE ON' : '🔫 BLIND FIRE OFF', blindOn ? '#bbb' : '#fff');
        }

        // Combat roll
        if ((e.code === 'KeyA' || e.code === 'KeyD') && keys['AltLeft']) {
          var rollDir = new THREE.Vector3();
          var rRight = new THREE.Vector3(Math.cos(_deps.getCameraYaw()), 0, -Math.sin(_deps.getCameraYaw()));
          rollDir.copy(rRight).multiplyScalar(e.code === 'KeyD' ? 1 : -1);
          if (_deps.tryRoll(rollDir)) {
            _deps.notifyPickup('🔄 DODGE ROLL', '#00ccff');
            _deps.playRollDodgeSound();
          }
        }

        // Quick swap
        if (e.code === 'KeyQ' && keys['AltLeft']) {
          _deps.quickSwap();
        }

        // Grapple hook
        if (e.code === 'KeyF' && keys['ShiftLeft']) {
          var grapDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
          var grapResult = _deps.launchGrapple(_deps.getPlayer().position, grapDir, 30, function (bx, by, bz) { return _deps.getBlock(bx, by, bz); });
          if (grapResult) {
            _deps.notifyPickup('🪝 GRAPPLE!', '#ff8800');
            _deps.playGrappleHookSound();
          }
        }

        // Squad commands
        var squadCmds = { 'Numpad1':'attack', 'Numpad2':'defend', 'Numpad3':'regroup', 'Numpad4':'flank_left', 'Numpad5':'flank_right', 'Numpad6':'hold_fire' };
        if (squadCmds[e.code]) {
          var fGroups = _deps.getFriendlyGroups();
          for (var gi = 0; gi < fGroups.length; gi++) _deps.commandSquad(fGroups[gi].id, squadCmds[e.code]);
          _deps.notifyPickup('📢 SQUAD: ' + squadCmds[e.code].toUpperCase().replace('_', ' '), '#44ddff');
        }

        // Build fortifications
        if (keys['ShiftLeft']) {
          var fortMap = { 'F1':'bunker', 'F2':'barricade', 'F3':'watchtower', 'F4':'ammo_cache' };
          if (fortMap[e.code] && gs === STATE.PLAYING) {
            e.preventDefault();
            var fwd3 = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
            var fx = _deps.getPlayer().position.x + fwd3.x * 3;
            var fz = _deps.getPlayer().position.z + fwd3.z * 3;
            var fy = _deps.getTerrainHeight(fx, fz);
            _deps.buildFortification(fortMap[e.code], fx, fy, fz, _scene);
            _deps.notifyPickup('🏗 ' + fortMap[e.code].toUpperCase() + ' BUILT', '#88cc44');
            _deps.playFortificationBuildSound();
          }
        }

        // Vehicle horn
        if (e.code === 'KeyN' && _deps.isInVehicle()) {
          var vh = _deps.getOccupiedVehicle();
          if (vh) _deps.honkHorn(vh.id);
        }

        // Dolphin dive
        if (e.code === 'ControlLeft' && _deps.getPlayer().sprinting) {
          var fwdDir = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
          if (_deps.tryDolphinDive({ x: fwdDir.x, z: fwdDir.z }, true)) {
            _deps.notifyPickup('💨 DOLPHIN DIVE!', '#00aaff');
          }
        }

        // Landmine
        if (e.code === 'KeyU') {
          var mineY = _deps.getTerrainHeight(_deps.getPlayer().position.x, _deps.getPlayer().position.z);
          if (_deps.placeMine(_deps.getPlayer().position.x, mineY, _deps.getPlayer().position.z, 'player')) {
            _deps.notifyPickup('💣 LANDMINE PLACED!', '#44aa44');
          }
        }

        // Weapon inspect (Home key)
        if (e.code === 'Home') {
          _deps.startInspect();
        }

        // Sandbag deploy
        if (e.code === 'KeyJ' && keys['ShiftLeft']) {
          var fwdSB = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
          var sbX = _deps.getPlayer().position.x + fwdSB.x * 2;
          var sbZ = _deps.getPlayer().position.z + fwdSB.z * 2;
          var sbY = _deps.getTerrainHeight(sbX, sbZ);
          if (_deps.startSandbagDeploy(sbX, sbY, sbZ)) {
            _deps.notifyPickup('🏗️ DEPLOYING SANDBAG...', '#c2b280');
          }
        }

        // Marketplace
        if (e.code === 'KeyJ' && !keys['ShiftLeft']) {
          _deps.toggleInventory();
          var shopTab = document.querySelector('.inv-tab[data-tab="shop"]');
          if (shopTab) shopTab.click();
        }

        // Inventory
        if (e.code === 'Tab') {
          e.preventDefault();
          _deps.toggleInventory();
        }

        // Weapon switching
        if (e.code === 'Digit1') _deps.switchWeaponTo(0);
        if (e.code === 'Digit2') _deps.switchWeaponTo(1);
        if (e.code === 'Digit3') _deps.switchWeaponTo(2);
        if (e.code === 'Digit4' && gs === STATE.PLAYING) _deps.switchWeaponTo(3);
        if (e.code === 'Digit5' && gs === STATE.PLAYING) _deps.switchWeaponTo(4);
        if (e.code === 'Digit6' && gs === STATE.PLAYING) _deps.switchWeaponTo(5);
        if (e.code === 'Digit7' && gs === STATE.PLAYING) _deps.switchWeaponTo(6);
        if (e.code === 'Digit8') _deps.switchWeaponTo(7);
        if (e.code === 'Digit9') _deps.switchWeaponTo(8);
        if (e.code === 'Digit0') _deps.switchWeaponTo(9);
        if (e.code === 'KeyQ' && !keys['AltLeft']) _deps.switchWeaponPrev();
        if (e.code === 'KeyE' && !keys['AltLeft'] && gs === STATE.PLAYING) _deps.switchWeaponNext();
        if (e.code === 'KeyR' && !_deps.isJammed() && !keys['KeyM']) {
          _deps.forceReload();
          _deps.playReloadSound();
        }

        // Build mode template keys
        if (gs === STATE.BUILD_MODE) {
          var templateKeys = { 'F1':'barracks', 'F2':'factory', 'F3':'turret', 'F4':'droneHangar', 'F5':'commandCenter', 'F6':'wall', 'F7':'dugout' };
          if (templateKeys[e.code]) {
            e.preventDefault();
            _deps.selectTemplate(templateKeys[e.code]);
          }
        }

        // RTS camera
        if (_deps.getCameraMode() === 0) { // 0 = STRATEGIC placeholder
          if (e.code === 'ArrowUp'    || e.code === 'KeyW') _deps.setRTSKey('up', true);
          if (e.code === 'ArrowDown'  || e.code === 'KeyS') _deps.setRTSKey('down', true);
          if (e.code === 'ArrowLeft'  || e.code === 'KeyA') _deps.setRTSKey('left', true);
          if (e.code === 'ArrowRight' || e.code === 'KeyD') _deps.setRTSKey('right', true);
        }

        // Drone keys
        if (_deps.isPossessingDrone()) {
          if (e.code === 'KeyW') _deps.setDroneKey('w', true);
          if (e.code === 'KeyS') _deps.setDroneKey('s', true);
          if (e.code === 'KeyA') _deps.setDroneKey('a', true);
          if (e.code === 'KeyD') _deps.setDroneKey('d', true);
          if (e.code === 'Space')    _deps.setDroneKey('up', true);
          if (e.code === 'ShiftLeft') _deps.setDroneKey('down', true);
        }

        // Vehicle keys
        if (_deps.isInVehicle()) {
          if (e.code === 'KeyW') _deps.setVehicleKey('w', true);
          if (e.code === 'KeyS') _deps.setVehicleKey('s', true);
          if (e.code === 'KeyA') _deps.setVehicleKey('a', true);
          if (e.code === 'KeyD') _deps.setVehicleKey('d', true);
          if (e.code === 'Space')     _deps.setVehicleKey('up', true);
          if (e.code === 'ShiftLeft') _deps.setVehicleKey('down', true);
        }
      }

      if (e.code === 'F10') {
        e.preventDefault();
        _deps.toggleFPS();
      }
      if (e.code === 'F9') {
        e.preventDefault();
        _deps.toggleSettings();
      }

      if (e.code === 'Escape') {
        if (e.isTrusted && (document.fullscreenElement || document.webkitFullscreenElement || _skipNextEsc)) {
          _skipNextEsc = false;
          return;
        }
        var gs2 = _deps.getGameState();
        if (gs2 === STATE.PLAYING || gs2 === STATE.BUILD_MODE) {
          _deps.setGameState(STATE.PAUSED);
          var invOv = document.getElementById('inventory-overlay');
          if (invOv) {
            try { _deps.showInventory(); } catch (e) {}
            invOv.style.display = 'flex';
          }
          _releaseMouseForUI();
        } else if (gs2 === STATE.PAUSED) {
          _deps.setGameState(STATE.PLAYING);
          var invOv2 = document.getElementById('inventory-overlay');
          if (invOv2) invOv2.style.display = 'none';
          _deps.hideOverlays();
          _deps.requestPointerLock();
        }
      }
    });

    document.addEventListener('keyup', function (e) {
      keys[e.code] = false;
      if (e.code === 'KeyQ' || e.code === 'KeyE') {
        _deps.setLean(0);
      }
      if (_deps.getCameraMode() === 0) {
        if (e.code === 'ArrowUp'    || e.code === 'KeyW') _deps.setRTSKey('up', false);
        if (e.code === 'ArrowDown'  || e.code === 'KeyS') _deps.setRTSKey('down', false);
        if (e.code === 'ArrowLeft'  || e.code === 'KeyA') _deps.setRTSKey('left', false);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') _deps.setRTSKey('right', false);
      }
      if (_deps.isPossessingDrone()) {
        if (e.code === 'KeyW') _deps.setDroneKey('w', false);
        if (e.code === 'KeyS') _deps.setDroneKey('s', false);
        if (e.code === 'KeyA') _deps.setDroneKey('a', false);
        if (e.code === 'KeyD') _deps.setDroneKey('d', false);
        if (e.code === 'Space')    _deps.setDroneKey('up', false);
        if (e.code === 'ShiftLeft') _deps.setDroneKey('down', false);
      }
      if (_deps.isInVehicle()) {
        if (e.code === 'KeyW') _deps.setVehicleKey('w', false);
        if (e.code === 'KeyS') _deps.setVehicleKey('s', false);
        if (e.code === 'KeyA') _deps.setVehicleKey('a', false);
        if (e.code === 'KeyD') _deps.setVehicleKey('d', false);
        if (e.code === 'Space')     _deps.setVehicleKey('up', false);
        if (e.code === 'ShiftLeft') _deps.setVehicleKey('down', false);
      }
    });

    document.addEventListener('touchstart', function () {
      _deps.resumeAudio();
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        var gs = _deps.getGameState();
        if (gs === STATE.PLAYING || gs === STATE.BUILD_MODE) {
          _deps.setGameState(STATE.PAUSED);
          var invOv = document.getElementById('inventory-overlay');
          if (invOv) {
            try { _deps.showInventory(); } catch (e) {}
            invOv.style.display = 'flex';
          }
          _releaseMouseForUI();
          _deps.updateMobileControlsVisibility();
        }
      }
    });

    document.addEventListener('mousedown', function (e) {
      _deps.resumeAudio();
      if (e.button === 0) {
        if (!isMobile && (_deps.getGameState() === STATE.PLAYING || _deps.getGameState() === STATE.BUILD_MODE) && !document.pointerLockElement) {
          _deps.requestPointerLock();
          if (_deps.isPossessingDrone()) {
            mouseDown = true;
            mouseNewPress = true;
          } else {
            return;
          }
        } else {
          mouseDown = true;
          mouseNewPress = true;
        }
        if (_deps.getGameState() === STATE.BUILD_MODE) {
          _deps.handleBuildClick();
        }
      }
      if (e.button === 2 && _deps.getGameState() === STATE.BUILD_MODE) {
        _deps.handleBuildRemove();
      }
      if (e.button === 2 && _deps.getGameState() === STATE.PLAYING) {
        if (_deps.isInVehicle()) {
          var occ = _deps.getOccupiedVehicle();
          if (occ && occ.isTank) {
            _deps.setVehicleKey('mgFire', true);
            return;
          }
        }
        if (_deps.getCurrentWeaponType() === 'MELEE') {
          _deps.handleMinecraftPlace();
        } else {
          _deps.handleRightDown();
        }
      }
    });

    document.addEventListener('mouseup', function (e) {
      if (e.button === 0) { mouseDown = false; mouseNewPress = false; }
      if (e.button === 2) {
        if (_deps.isInVehicle()) {
          _deps.setVehicleKey('mgFire', false);
        }
        _deps.handleRightUp();
      }
    });

    document.addEventListener('mousemove', function (e) {
      if (document.pointerLockElement) {
        _deps.handleMouseMove(e.movementX, e.movementY);
      }
    });

    document.addEventListener('wheel', function (e) {
      if (_deps.getGameState() === STATE.PLAYING) {
        if (e.deltaY > 0) _deps.switchWeaponNext();
        else if (e.deltaY < 0) _deps.switchWeaponPrev();
      } else {
        _deps.handleWheel(e.deltaY);
      }
    });

    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    document.addEventListener('pointerlockchange', function () {
      if (!document.pointerLockElement && _deps.getGameState() === STATE.PLAYING) {
        if (performance.now() < _pointerLockGraceUntil) return;
        if (!isMobile) {
          _deps.setGameState(STATE.PAUSED);
          var invOv = document.getElementById('inventory-overlay');
          if (invOv) {
            try { _deps.showInventory(); } catch (e) {}
            invOv.style.display = 'flex';
          } else {
            showOverlay('pause');
          }
          _releaseMouseForUI();
          _deps.updateMobileControlsVisibility();
        }
      }
    });

    if (isMobile) {
      var lookZone = document.getElementById('mobile-look-zone') || (_renderer ? _renderer.domElement : null);
      if (!lookZone) return;
      lookZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          touch.lookTouchId = t.identifier;
          touch.lookActive = true;
          touch._lookPrevX = t.clientX;
          touch._lookPrevY = t.clientY;
          touch.tapStartX = t.clientX;
          touch.tapStartY = t.clientY;
          touch.tapStartTime = performance.now();
          try { lookZone.classList.add('look-active'); } catch (_e) {}
        }
      }, { passive: false });
      lookZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.lookTouchId) {
            const dx = t.clientX - touch._lookPrevX;
            const dy = t.clientY - touch._lookPrevY;
            touch.lookX += dx;
            touch.lookY += dy;
            touch._lookPrevX = t.clientX;
            touch._lookPrevY = t.clientY;
          }
        }
      }, { passive: false });
      document.addEventListener('touchmove', function (e) {
        if (touch.lookTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.lookTouchId) {
            const dx = t.clientX - touch._lookPrevX;
            const dy = t.clientY - touch._lookPrevY;
            touch.lookX += dx;
            touch.lookY += dy;
            touch._lookPrevX = t.clientX;
            touch._lookPrevY = t.clientY;
          }
        }
      }, { passive: false });
      function _releaseLookTouch(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.lookTouchId) {
            var tapDur = performance.now() - touch.tapStartTime;
            var tapDx = t.clientX - touch.tapStartX;
            var tapDy = t.clientY - touch.tapStartY;
            if (tapDur < 250 && Math.abs(tapDx) < 12 && Math.abs(tapDy) < 12) {
              touch.firing = true;
              mouseNewPress = true;
              setTimeout(function() { touch.firing = false; mouseNewPress = false; }, 120);
            }
            touch.lookTouchId = null;
            touch.lookActive = false;
            try { lookZone.classList.remove('look-active'); } catch (_e) {}
          }
        }
      }
      lookZone.addEventListener('touchend', _releaseLookTouch, { passive: true });
      lookZone.addEventListener('touchcancel', _releaseLookTouch, { passive: true });
      document.addEventListener('touchend', _releaseLookTouch, { passive: true });
      document.addEventListener('touchcancel', _releaseLookTouch, { passive: true });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SETUP MOBILE CONTROLS
  // ═══════════════════════════════════════════════════════════════════════
  function setupMobileControls() {
    if (_mobileControlsReady) return;
    _mobileControlsReady = true;

    try {
      if (!localStorage.getItem('okc_mob_hint_v1')) {
        setTimeout(function () {
          _deps.showToast('📱 Drag anywhere to LOOK · tap to SHOOT · left stick to MOVE', 5500, '#5cc8ff');
          try { localStorage.setItem('okc_mob_hint_v1', '1'); } catch (_e) {}
        }, 1400);
      }
    } catch (_e) {}

    var joystickZone  = document.getElementById('joystick-zone');
    var joystickThumb = document.getElementById('joystick-thumb');
    if (!joystickZone || !joystickThumb) return;

    joystickZone.addEventListener('touchstart', function (e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      touch.moveTouchId = t.identifier;
      touch.moveActive = true;
      const rect = joystickZone.getBoundingClientRect();
      const currentBaseSize = rect.width || 110;
      const currentThumbSize = joystickThumb.offsetWidth || 46;
      touch.moveStartX = rect.left + currentBaseSize / 2;
      touch.moveStartY = rect.top + currentBaseSize / 2;
      touch.moveMaxDist = (currentBaseSize - currentThumbSize) / 2;
    }, { passive: false });

    joystickZone.addEventListener('touchmove', function (e) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touch.moveTouchId) {
          let dx = t.clientX - touch.moveStartX;
          let dy = t.clientY - touch.moveStartY;
          const maxDist = touch.moveMaxDist || 32;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) {
            dx = dx / dist * maxDist;
            dy = dy / dist * maxDist;
            dist = maxDist;
          }
          touch.moveX = dx / maxDist;
          touch.moveY = dy / maxDist;
          const rect = joystickZone.getBoundingClientRect();
          const currentBaseSize = rect.width || 110;
          const currentThumbSize = joystickThumb.offsetWidth || 46;
          joystickThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2 + dx) + 'px';
          joystickThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2 + dy) + 'px';
        }
      }
    }, { passive: false });

    function resetJoystick() {
      touch.moveTouchId = null;
      touch.moveActive = false;
      touch.moveX = 0;
      touch.moveY = 0;
      const rect = joystickZone.getBoundingClientRect();
      const currentBaseSize = rect.width || 110;
      const currentThumbSize = joystickThumb.offsetWidth || 46;
      joystickThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
      joystickThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
    }
    function _onMoveTouchEnd(e) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touch.moveTouchId) resetJoystick();
      }
    }
    joystickZone.addEventListener('touchend', _onMoveTouchEnd, { passive: true });
    joystickZone.addEventListener('touchcancel', _onMoveTouchEnd, { passive: true });
    document.addEventListener('touchend', _onMoveTouchEnd, { passive: true });
    document.addEventListener('touchcancel', _onMoveTouchEnd, { passive: true });

    // Aim joystick
    var aimZone  = document.getElementById('aim-joystick-zone');
    var aimThumb = document.getElementById('aim-joystick-thumb');
    if (aimZone && aimThumb) {
      aimZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        const t = e.changedTouches[0];
        touch.aimTouchId = t.identifier;
        touch.aimActive = true;
        const rect = aimZone.getBoundingClientRect();
        const currentBaseSize = rect.width || 110;
        const currentThumbSize = aimThumb.offsetWidth || 46;
        touch.aimStartX = rect.left + currentBaseSize / 2;
        touch.aimStartY = rect.top + currentBaseSize / 2;
        touch.aimMaxDist = (currentBaseSize - currentThumbSize) / 2;
      }, { passive: false });

      aimZone.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touch.aimTouchId) {
            let dx = t.clientX - touch.aimStartX;
            let dy = t.clientY - touch.aimStartY;
            const maxDist = touch.aimMaxDist || 32;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) {
              dx = dx / dist * maxDist;
              dy = dy / dist * maxDist;
            }
            touch.aimX = dx / maxDist;
            touch.aimY = dy / maxDist;
            const rect = aimZone.getBoundingClientRect();
            const currentBaseSize = rect.width || 110;
            const currentThumbSize = aimThumb.offsetWidth || 46;
            aimThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2 + dx) + 'px';
            aimThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2 + dy) + 'px';
          }
        }
      }, { passive: false });

      function resetAimJoystick() {
        touch.aimTouchId = null;
        touch.aimActive = false;
        touch.aimX = 0;
        touch.aimY = 0;
        const rect = aimZone.getBoundingClientRect();
        const currentBaseSize = rect.width || 110;
        const currentThumbSize = aimThumb.offsetWidth || 46;
        aimThumb.style.left = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
        aimThumb.style.top  = (currentBaseSize / 2 - currentThumbSize / 2) + 'px';
      }
      function _onAimTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touch.aimTouchId) resetAimJoystick();
        }
      }
      aimZone.addEventListener('touchend', _onAimTouchEnd, { passive: true });
      aimZone.addEventListener('touchcancel', _onAimTouchEnd, { passive: true });
      document.addEventListener('touchend', _onAimTouchEnd, { passive: true });
      document.addEventListener('touchcancel', _onAimTouchEnd, { passive: true });
    }

    // Fire button
    var btnFire = document.getElementById('btn-fire');
    if (btnFire) {
      btnFire.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touch.firing = true;
        mouseNewPress = true;
        btnFire.classList.add('active');
      }, { passive: false });
      btnFire.addEventListener('touchend', function () {
        touch.firing = false;
        mouseNewPress = false;
        btnFire.classList.remove('active');
      });
      btnFire.addEventListener('touchcancel', function () {
        touch.firing = false;
        mouseNewPress = false;
        btnFire.classList.remove('active');
      });
    }

    // Aim button
    var btnAim = document.getElementById('btn-aim');
    if (btnAim) {
      btnAim.addEventListener('touchstart', function (e) {
        e.preventDefault();
        setMobileAim(true);
        btnAim.classList.add('active');
      }, { passive: false });
      btnAim.addEventListener('touchend', function () {
        setMobileAim(false);
        btnAim.classList.remove('active');
      });
      btnAim.addEventListener('touchcancel', function () {
        setMobileAim(false);
        btnAim.classList.remove('active');
      });
    }

    // Reload button
    var btnReload = document.getElementById('btn-reload');
    if (btnReload) {
      btnReload.addEventListener('touchstart', function (e) {
        e.preventDefault();
        _deps.forceReload();
        _deps.playReloadSound();
        btnReload.classList.add('active');
      }, { passive: false });
      btnReload.addEventListener('touchend', function () { btnReload.classList.remove('active'); });
    }

    // Jump button
    var btnJump = document.getElementById('btn-jump');
    if (btnJump) {
      btnJump.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touch.jumping = true;
        btnJump.classList.add('active');
      }, { passive: false });
      btnJump.addEventListener('touchend', function () {
        touch.jumping = false;
        btnJump.classList.remove('active');
      });
      btnJump.addEventListener('touchcancel', function () {
        touch.jumping = false;
        btnJump.classList.remove('active');
      });
    }

    // Sprint button
    var btnSprint = document.getElementById('btn-sprint');
    if (btnSprint) {
      btnSprint.addEventListener('touchstart', function (e) {
        e.preventDefault();
        touch.sprinting = !touch.sprinting;
        btnSprint.classList.toggle('active', touch.sprinting);
      }, { passive: false });
    }

    // Weapon prev/next
    var btnPrev = document.getElementById('btn-weapon-prev');
    var btnNext = document.getElementById('btn-weapon-next');
    if (btnPrev) {
      btnPrev.addEventListener('touchstart', function (e) {
        e.preventDefault();
        _deps.switchWeaponPrev();
        btnPrev.classList.add('active');
      }, { passive: false });
      btnPrev.addEventListener('touchend', function () { btnPrev.classList.remove('active'); });
    }
    if (btnNext) {
      btnNext.addEventListener('touchstart', function (e) {
        e.preventDefault();
        _deps.switchWeaponNext();
        btnNext.classList.add('active');
      }, { passive: false });
      btnNext.addEventListener('touchend', function () { btnNext.classList.remove('active'); });
    }

    function bindTapButton(id, handler) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        handler();
        btn.classList.add('active');
      }, { passive: false });
      btn.addEventListener('touchend', function () { btn.classList.remove('active'); });
      btn.addEventListener('touchcancel', function () { btn.classList.remove('active'); });
    }

    bindTapButton('btn-use', function () {
      if (_deps.isPossessingDrone()) {
        _deps.releaseDrone();
      } else {
        tapVirtualKey('KeyF');
      }
    });
    bindTapButton('btn-vehicle', function () { tapVirtualKeyWithShift('KeyG'); });
    bindTapButton('btn-build', function () { tapVirtualKey('KeyB'); });

    document.querySelectorAll('.build-opt[data-template]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (_deps.getGameState() !== STATE.BUILD_MODE) return;
        _deps.selectTemplate(el.dataset.template);
        document.querySelectorAll('.build-opt').forEach(function (o) { o.classList.remove('selected'); });
        el.classList.add('selected');
      });
    });

    if (isMobile) {
      var _bOpts = [['barracks','Barracks'],['factory','Factory'],['turret','Turret'],
        ['droneHangar','Drone Hangar'],['commandCenter','Command Center'],['wall','Wall'],['dugout','Dugout']];
      _bOpts.forEach(function (pair) {
        var el = document.querySelector('.build-opt[data-template="' + pair[0] + '"]');
        if (el) el.textContent = pair[1];
      });
      var binfo = document.querySelector('#build-hud .build-info');
      if (binfo) binfo.textContent = 'TAP · Select | Fire · Place | 🔨 · Exit';
    }

    bindTapButton('btn-view', function () {
      if (_deps.isPossessingDrone()) {
        _deps.toggleDroneRemoteView();
      } else if (_deps.isInVehicle()) {
        tapVirtualKey('KeyT');
      } else {
        tapVirtualKey('KeyV');
      }
    });
    bindTapButton('btn-night', function () { tapVirtualKey('KeyL'); });
    bindTapButton('btn-gyro', function () { toggleGyroAim(); });
    bindTapButton('btn-inventory-mobile', function () { _deps.toggleInventory(); });
    bindTapButton('btn-crouch', function () { tapVirtualKey('KeyZ', 140); });
    bindTapButton('btn-melee', function () {
      var prev = _deps.getCurrentWeaponIdx();
      _deps.switchWeaponTo(0);
      _deps.handleLeftDown();
      setTimeout(function () {
        _deps.handleLeftUp();
        if (prev !== 0) _deps.switchWeaponTo(prev);
      }, 260);
    });
    bindTapButton('btn-grenade', function () {
      var count = _deps.getWeaponCount();
      var prev = _deps.getCurrentWeaponIdx();
      var grenadeIdx = -1;
      for (var gi = 0; gi < count; gi++) {
        var nm = _deps.getWeaponName(gi);
        if (/grenade|molotov/i.test(nm) && _deps.isWeaponUnlocked(gi)) {
          grenadeIdx = gi; break;
        }
      }
      if (grenadeIdx < 0) return;
      _deps.switchWeaponTo(grenadeIdx);
      _deps.handleLeftDown();
      setTimeout(function () {
        _deps.handleLeftUp();
        if (prev !== grenadeIdx) _deps.switchWeaponTo(prev);
      }, 200);
    });

    var btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var gs = _deps.getGameState();
        if (gs === STATE.PLAYING || gs === STATE.BUILD_MODE) {
          _deps.setGameState(STATE.PAUSED);
          var invOv = document.getElementById('inventory-overlay');
          if (invOv) {
            try { _deps.showInventory(); } catch (e) {}
            invOv.style.display = 'flex';
          } else {
            showOverlay('pause');
          }
          _releaseMouseForUI();
          _deps.updateMobileControlsVisibility();
        } else if (gs === STATE.PAUSED) {
          _deps.setGameState(STATE.PLAYING);
          var invOv2 = document.getElementById('inventory-overlay');
          if (invOv2) invOv2.style.display = 'none';
          _deps.hideOverlays();
          _deps.requestPointerLock();
          _deps.updateMobileControlsVisibility();
        }
      }, { passive: false });
    }

    try {
      if (localStorage.getItem('ok_gyro') === '1') {
        var DOE = window.DeviceOrientationEvent;
        if (!(DOE && typeof DOE.requestPermission === 'function')) {
          toggleGyroAim();
        }
      }
    } catch (_e) {}
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════
  return {
    init: function (deps) {
      _setDeps(deps);
      return _init();
    },
    startGame: function (deps) {
      _setDeps(deps);
      return _startGame();
    },
    setupMobileControls: function (deps) {
      _setDeps(deps);
      return setupMobileControls();
    },
    setupOrientation: function (deps) {
      _setDeps(deps);
      return setupOrientationHandling();
    },
    getRenderer: function () { return _renderer; },
    getScene: function () { return _scene; },
    getCamera: function () { return _camera; },
    // Expose internal state getters for advanced wiring
    getKeys: function () { return keys; },
    getTouch: function () { return touch; },
    getMouseDown: function () { return mouseDown; },
    getMouseNewPress: function () { return mouseNewPress; },
    setMouseDown: function (v) { mouseDown = v; },
    setMouseNewPress: function (v) { mouseNewPress = v; },
    setDeps: _setDeps,
  };
})();
