/* player-state.js — Standalone player state module */
/* Extracted from game-manager.js */

const PlayerState = (function () {
  "use strict";

  const GOD_MODE_HP = 999999;

  /* ── Private Player State ─────────────────────────────────────── */
  const player = {
    
        position:   new THREE.Vector3(0, 10, 0),
        velocity:   new THREE.Vector3(0, 0, 0),
        hp:         100,
        maxHp:      100,
        score:      0,
        kills:      0,
        onGround:   false,
        sprinting:  false,
        height:     1.7,
        stealth:    false,        // invisibility toggle
        role:       'brigade',    // 'brigade' or 'lonewolf'
        godMode: false,       // God Mode: all weapons, invincible, invisible
        prone:      false,        // prone stance for accuracy
        bleeding:   false,        // bleed DOT status
        bleedTimer: 0,            // time remaining on bleed
        killStreak: 0,            // consecutive rapid kills
        streakTimer: 0,           // time since last kill (resets streak)
        dogTags:    0,            // collected dog tags
        airdropCooldown: 0,       // cooldown for airdrop beacon
        stamina:    1.0,          // 0-1, drains on sprint, regens on walk
        nightVision: false,       // night vision toggle
        shieldTimer: 0,           // temporary shield timer
        intelTimer: 0,            // intel reveal timer
        armor:      0,            // armor points (0-100), reduces damage
        lastDamageTime: 0,        // time since last damage (for health regen)
        // ── Throwables ──
        grenades:   5,            // hand grenades on player; default 5, unlimited in god mode
        // ── Loot & Building ──
        lootParticles: [],        // active loot particles in world
        buildMaterials: { wood: 0, stone: 0, metal: 0, dirt: 0, sand: 0, brick: 0 },
        // ── Stats Tracking ──
        totalShots: 0,
        totalHits: 0,
        totalHeadshots: 0,
        totalDamageTaken: 0,
        waveStartTime: 0,
        bestStreak: 0,
        waveKills: 0,
        waveShots: 0,
        waveHits: 0,
        waveHeadshots: 0,
        waveDamageTaken: 0,
        waveMeleeKills: 0,
        waveFirstKillTime: 999,
        waveMaxExplosiveKill: 0,
        distanceWalked: 0,
        _lastPos: null,
        playStartTime: 0,
        // ── B23: New Gameplay State ──
        xp: 0,
        level: 1,
        grenadeCooked: false,
        grenadeCookTimer: 0,
        _radTimer: 0,
        _geigerTimer: 0,
        executionTarget: null,
        lastKillWeapon: null,
        multikillTimer: 0,
        multikillCount: 0,
        // ── B24: Cover & Crouch ──
        isCrouching: false,
        crouchTimer: 0,        // smooth crouch lerp
        inCover: false,         // near a wall while crouching
        slideTimer: 0,
        slideDir: null,
        _usedLastStand: false,
    
  };

  /* ── Suppression System (private) ───────────────────────────── */
  var _suppressionLevel = 0;
  var _suppressionDecay = 0.5;
  var _suppressionCanvas = null;

  /* ── Hand Grenade State (private) ───────────────────────────── */
  var _handGrenades = [];
  var _handGrenadeCooldown = 0;

  /* ── Initialization ─────────────────────────────────────────── */
  function init() {
    player.position.set(0, 10, 0);
    player.velocity.set(0, 0, 0);
    player.hp = 100;
    player.maxHp = 100;
    player.score = 0;
    player.kills = 0;
    player.onGround = false;
    player.sprinting = false;
    player.height = 1.7;
    player.stealth = false;
    player.role = 'brigade';
    player.godMode = false;
    player.prone = false;
    player.bleeding = false;
    player.bleedTimer = 0;
    player.killStreak = 0;
    player.streakTimer = 0;
    player.dogTags = 0;
    player.airdropCooldown = 0;
    player.stamina = 1.0;
    player.nightVision = false;
    player.shieldTimer = 0;
    player.intelTimer = 0;
    player.armor = 0;
    player.lastDamageTime = 0;
    player.grenades = 5;
    player.lootParticles = [];
    player.buildMaterials = { wood: 0, stone: 0, metal: 0, dirt: 0, sand: 0, brick: 0 };
    player.totalShots = 0;
    player.totalHits = 0;
    player.totalHeadshots = 0;
    player.totalDamageTaken = 0;
    player.waveStartTime = 0;
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
    player.playStartTime = 0;
    player.xp = 0;
    player.level = 1;
    player.grenadeCooked = false;
    player.grenadeCookTimer = 0;
    player._radTimer = 0;
    player._geigerTimer = 0;
    player.executionTarget = null;
    player.lastKillWeapon = null;
    player.multikillTimer = 0;
    player.multikillCount = 0;
    player.isCrouching = false;
    player.crouchTimer = 0;
    player.inCover = false;
    player.slideTimer = 0;
    player.slideDir = null;
    player._usedLastStand = false;
    player._secondWindTriggered = false;
    player._stimTimer = 0;
    player._killSpeedBoost = 0;
    player._killSpeedTimer = 0;
    player._landSlowTimer = 0;
    player._footstepTimer = 0;
    player._inWater = false;
    player._waterSpeedMult = 1;
    player._blizzardSlow = 1.0;
    player._fireTimer = 0;
    player._bombardTimer = 0;
    player._mortarTimer = 0;
    player._antonovArtillTimer = 0;
    player._trenchSuppressionTimer = 0;
    player._snakeBombardTimer = 0;
    player._sakyDroneTimer = 0;
    player._sevaNavalTimer = 0;
    player._bakhmutArtillTimer = 0;
    player._vuhMineTimer = 0;
    player._refineryFireTimer = 0;
    player._khersonMineTimer = 0;
    player._donbasThermTimer = 0;
    player._kyivTankTimer = 0;
    player._avdiivkaSniperTimer = 0;
    player._belgorodGradTimer = 0;
    player._dustStepTimer = 0;
    player._distantBoomTimer = 0;
    player._ledgeTimer = 0;
    player._hfNotifCd = 0;
    player._longestShot = 0;
    player.coins = 0;
    _suppressionLevel = 0;
    _suppressionCanvas = null;
    _handGrenades = [];
    _handGrenadeCooldown = 0;
  }

  /* ── General State Access ───────────────────────────────────── */
  function get() {
    return {
      position: player.position,
      velocity: player.velocity,
      hp: player.hp,
      maxHp: player.maxHp,
      score: player.score,
      kills: player.kills,
      onGround: player.onGround,
      sprinting: player.sprinting,
      height: player.height,
      stealth: player.stealth,
      role: player.role,
      godMode: player.godMode,
      prone: player.prone,
      bleeding: player.bleeding,
      bleedTimer: player.bleedTimer,
      killStreak: player.killStreak,
      streakTimer: player.streakTimer,
      dogTags: player.dogTags,
      airdropCooldown: player.airdropCooldown,
      stamina: player.stamina,
      nightVision: player.nightVision,
      shieldTimer: player.shieldTimer,
      intelTimer: player.intelTimer,
      armor: player.armor,
      lastDamageTime: player.lastDamageTime,
      grenades: player.grenades,
      lootParticles: player.lootParticles,
      buildMaterials: player.buildMaterials,
      totalShots: player.totalShots,
      totalHits: player.totalHits,
      totalHeadshots: player.totalHeadshots,
      totalDamageTaken: player.totalDamageTaken,
      waveStartTime: player.waveStartTime,
      bestStreak: player.bestStreak,
      waveKills: player.waveKills,
      waveShots: player.waveShots,
      waveHits: player.waveHits,
      waveHeadshots: player.waveHeadshots,
      waveDamageTaken: player.waveDamageTaken,
      waveMeleeKills: player.waveMeleeKills,
      waveFirstKillTime: player.waveFirstKillTime,
      waveMaxExplosiveKill: player.waveMaxExplosiveKill,
      distanceWalked: player.distanceWalked,
      _lastPos: player._lastPos,
      playStartTime: player.playStartTime,
      xp: player.xp,
      level: player.level,
      grenadeCooked: player.grenadeCooked,
      grenadeCookTimer: player.grenadeCookTimer,
      _radTimer: player._radTimer,
      _geigerTimer: player._geigerTimer,
      executionTarget: player.executionTarget,
      lastKillWeapon: player.lastKillWeapon,
      multikillTimer: player.multikillTimer,
      multikillCount: player.multikillCount,
      isCrouching: player.isCrouching,
      crouchTimer: player.crouchTimer,
      inCover: player.inCover,
      slideTimer: player.slideTimer,
      slideDir: player.slideDir,
      _usedLastStand: player._usedLastStand,
    };
  }

  /* ── Field Getters / Setters ────────────────────────────────── */
  function getPosition() { return player.position; }
  function setPosition(v) { player.position = v; }

  function getVelocity() { return player.velocity; }
  function setVelocity(v) { player.velocity = v; }

  function getHp() { return player.hp; }
  function setHp(v) { player.hp = v; }

  function getMaxHp() { return player.maxHp; }
  function setMaxHp(v) { player.maxHp = v; }

  function getScore() { return player.score; }
  function setScore(v) { player.score = v; }

  function getKills() { return player.kills; }
  function setKills(v) { player.kills = v; }

  function getOnGround() { return player.onGround; }
  function setOnGround(v) { player.onGround = v; }

  function getSprinting() { return player.sprinting; }
  function setSprinting(v) { player.sprinting = v; }

  function getHeight() { return player.height; }
  function setHeight(v) { player.height = v; }

  function getStealth() { return player.stealth; }
  function setStealth(v) { player.stealth = v; }

  function getRole() { return player.role; }
  function setRole(v) { player.role = v; }

  function getGodMode() { return player.godMode; }
  function setGodMode(v) { player.godMode = v; }

  function getProne() { return player.prone; }
  function setProne(v) { player.prone = v; }

  function getBleeding() { return player.bleeding; }
  function setBleeding(v) { player.bleeding = v; }

  function getBleedTimer() { return player.bleedTimer; }
  function setBleedTimer(v) { player.bleedTimer = v; }

  function getKillStreak() { return player.killStreak; }
  function setKillStreak(v) { player.killStreak = v; }

  function getStreakTimer() { return player.streakTimer; }
  function setStreakTimer(v) { player.streakTimer = v; }

  function getDogTags() { return player.dogTags; }
  function setDogTags(v) { player.dogTags = v; }

  function getAirdropCooldown() { return player.airdropCooldown; }
  function setAirdropCooldown(v) { player.airdropCooldown = v; }

  function getStamina() { return player.stamina; }
  function setStamina(v) { player.stamina = v; }

  function getNightVision() { return player.nightVision; }
  function setNightVision(v) { player.nightVision = v; }

  function getShieldTimer() { return player.shieldTimer; }
  function setShieldTimer(v) { player.shieldTimer = v; }

  function getIntelTimer() { return player.intelTimer; }
  function setIntelTimer(v) { player.intelTimer = v; }

  function getArmor() { return player.armor; }
  function setArmor(v) { player.armor = v; }

  function getLastDamageTime() { return player.lastDamageTime; }
  function setLastDamageTime(v) { player.lastDamageTime = v; }

  function getGrenades() { return player.grenades; }
  function setGrenades(v) { player.grenades = v; }

  function getLootParticles() { return player.lootParticles; }
  function setLootParticles(v) { player.lootParticles = v; }

  function getBuildMaterials() { return player.buildMaterials; }
  function setBuildMaterials(v) { player.buildMaterials = v; }

  function getTotalShots() { return player.totalShots; }
  function setTotalShots(v) { player.totalShots = v; }

  function getTotalHits() { return player.totalHits; }
  function setTotalHits(v) { player.totalHits = v; }

  function getTotalHeadshots() { return player.totalHeadshots; }
  function setTotalHeadshots(v) { player.totalHeadshots = v; }

  function getTotalDamageTaken() { return player.totalDamageTaken; }
  function setTotalDamageTaken(v) { player.totalDamageTaken = v; }

  function getWaveStartTime() { return player.waveStartTime; }
  function setWaveStartTime(v) { player.waveStartTime = v; }

  function getBestStreak() { return player.bestStreak; }
  function setBestStreak(v) { player.bestStreak = v; }

  function getWaveKills() { return player.waveKills; }
  function setWaveKills(v) { player.waveKills = v; }

  function getWaveShots() { return player.waveShots; }
  function setWaveShots(v) { player.waveShots = v; }

  function getWaveHits() { return player.waveHits; }
  function setWaveHits(v) { player.waveHits = v; }

  function getWaveHeadshots() { return player.waveHeadshots; }
  function setWaveHeadshots(v) { player.waveHeadshots = v; }

  function getWaveDamageTaken() { return player.waveDamageTaken; }
  function setWaveDamageTaken(v) { player.waveDamageTaken = v; }

  function getWaveMeleeKills() { return player.waveMeleeKills; }
  function setWaveMeleeKills(v) { player.waveMeleeKills = v; }

  function getWaveFirstKillTime() { return player.waveFirstKillTime; }
  function setWaveFirstKillTime(v) { player.waveFirstKillTime = v; }

  function getWaveMaxExplosiveKill() { return player.waveMaxExplosiveKill; }
  function setWaveMaxExplosiveKill(v) { player.waveMaxExplosiveKill = v; }

  function getDistanceWalked() { return player.distanceWalked; }
  function setDistanceWalked(v) { player.distanceWalked = v; }

  function getLastPos() { return player._lastPos; }
  function setLastPos(v) { player._lastPos = v; }

  function getPlayStartTime() { return player.playStartTime; }
  function setPlayStartTime(v) { player.playStartTime = v; }

  function getXp() { return player.xp; }
  function setXp(v) { player.xp = v; }

  function getLevel() { return player.level; }
  function setLevel(v) { player.level = v; }

  function getGrenadeCooked() { return player.grenadeCooked; }
  function setGrenadeCooked(v) { player.grenadeCooked = v; }

  function getGrenadeCookTimer() { return player.grenadeCookTimer; }
  function setGrenadeCookTimer(v) { player.grenadeCookTimer = v; }

  function getRadTimer() { return player._radTimer; }
  function setRadTimer(v) { player._radTimer = v; }

  function getGeigerTimer() { return player._geigerTimer; }
  function setGeigerTimer(v) { player._geigerTimer = v; }

  function getExecutionTarget() { return player.executionTarget; }
  function setExecutionTarget(v) { player.executionTarget = v; }

  function getLastKillWeapon() { return player.lastKillWeapon; }
  function setLastKillWeapon(v) { player.lastKillWeapon = v; }

  function getMultikillTimer() { return player.multikillTimer; }
  function setMultikillTimer(v) { player.multikillTimer = v; }

  function getMultikillCount() { return player.multikillCount; }
  function setMultikillCount(v) { player.multikillCount = v; }

  function getIsCrouching() { return player.isCrouching; }
  function setIsCrouching(v) { player.isCrouching = v; }

  function getCrouchTimer() { return player.crouchTimer; }
  function setCrouchTimer(v) { player.crouchTimer = v; }

  function getInCover() { return player.inCover; }
  function setInCover(v) { player.inCover = v; }

  function getSlideTimer() { return player.slideTimer; }
  function setSlideTimer(v) { player.slideTimer = v; }

  function getSlideDir() { return player.slideDir; }
  function setSlideDir(v) { player.slideDir = v; }

  function getUsedLastStand() { return player._usedLastStand; }
  function setUsedLastStand(v) { player._usedLastStand = v; }

  /* ── Increment Helpers ──────────────────────────────────────── */
  function addScore(v) { player.score += v; }
  function addKills(v) { player.kills += v; }
  function addDogTags(v) { player.dogTags += v; }
  function addTotalShots(v) { player.totalShots += v; }
  function addTotalHits(v) { player.totalHits += v; }
  function addTotalHeadshots(v) { player.totalHeadshots += v; }
  function addTotalDamageTaken(v) { player.totalDamageTaken += v; }
  function addWaveKills(v) { player.waveKills += v; }
  function addWaveShots(v) { player.waveShots += v; }
  function addWaveHits(v) { player.waveHits += v; }
  function addWaveHeadshots(v) { player.waveHeadshots += v; }
  function addWaveDamageTaken(v) { player.waveDamageTaken += v; }
  function addWaveMeleeKills(v) { player.waveMeleeKills += v; }
  function addDistanceWalked(v) { player.distanceWalked += v; }
  function addXp(v) { player.xp += v; }
  function addGrenades(v) { player.grenades += v; }
  function addMultikillCount(v) { player.multikillCount += v; }
  function addKillStreak(v) { player.killStreak += v; }
  function addBestStreak(v) { player.bestStreak += v; }

  /* ── Build Material Helpers ─────────────────────────────────── */
  function addBuildMaterial(type, amount) {
    if (!player.buildMaterials) player.buildMaterials = {};
    if (player.buildMaterials[type] !== undefined) player.buildMaterials[type] += amount;
    else player.buildMaterials[type] = amount;
  }

  function getBuildMaterial(type) {
    return player.buildMaterials && player.buildMaterials[type] || 0;
  }

  function resetBuildMaterials() {
    player.buildMaterials = { wood: 0, stone: 0, metal: 0, dirt: 0, sand: 0, brick: 0 };
  }

  /* ── Grenade Helpers ────────────────────────────────────────── */
  function consumeGrenade() {
    if (!player.godMode && player.grenades > 0) {
      player.grenades = Math.max(0, player.grenades - 1);
      return true;
    }
    return player.godMode;
  }

  function addGrenades(n) {
    if (!player.godMode) player.grenades = Math.min(99, (player.grenades || 0) + n);
  }

  /* ── Damage / Health Helpers ────────────────────────────────── */
  function damage(amount) {
    player.hp = Math.max(0, player.hp - amount);
    player.lastDamageTime = 0;
    player.totalDamageTaken += amount;
    player.waveDamageTaken += amount;
    return player.hp;
  }

  function heal(amount) {
    if (!player) return;
    player.hp = Math.min(player.hp + amount, player.maxHp);
  }

  function isAlive() { return player.hp > 0; }

  /* ── Stamina Helpers ───────────────────────────────────────── */
  function drainStamina(amount) {
    player.stamina = Math.max(0, player.stamina - amount);
  }

  function regenStamina(amount) {
    player.stamina = Math.min(1.0, player.stamina + amount);
  }

  /* ── Multikill Helpers ──────────────────────────────────────── */
  function resetMultikill() {
    player.multikillTimer = 0;
    player.multikillCount = 0;
  }

  function addMultikill() {
    player.multikillTimer = 2.0;
    player.multikillCount++;
  }

  /* ── Kill Streak Helpers ───────────────────────────────────── */
  function resetKillStreak() {
    player.killStreak = 0;
    player.streakTimer = 0;
  }

  function addKillStreak() {
    player.killStreak++;
    player.streakTimer = 4.0;
    if (player.killStreak > player.bestStreak) player.bestStreak = player.killStreak;
  }

  /* ── Bleed Helpers ──────────────────────────────────────────── */
  function startBleeding(duration) {
    player.bleeding = true;
    player.bleedTimer = duration || 6.0;
  }

  function stopBleeding() {
    player.bleeding = false;
    player.bleedTimer = 0;
  }

  /* ── Position / Velocity Helpers ────────────────────────────── */
  function setPosition(x, y, z) {
    if (typeof x === "object" && x.x !== undefined) {
      player.position.copy(x);
    } else {
      player.position.set(x, y, z);
    }
  }

  function setVelocity(x, y, z) {
    if (typeof x === "object" && x.x !== undefined) {
      player.velocity.copy(x);
    } else {
      player.velocity.set(x, y, z);
    }
  }

  /* ── Extracted Helper Functions ─────────────────────────────── */

  function healPlayer(amount) {
      if (!player) return;
      player.hp = Math.min(player.hp + amount, player.maxHp);
      if (HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
      if (HUD.notifyPickup) HUD.notifyPickup('❤️ +' + amount + ' HP', '#44ff88');
    }

  function addArmor(amount) {
      if (!player) return;
      player.armor = Math.min((player.armor || 0) + amount, 100);
      if (HUD.notifyPickup) HUD.notifyPickup('🛡️ Armor +' + amount, '#4fc3f7');
    }

  function addStimBuff(duration) {
      if (!player) return;
      player._stimTimer = (player._stimTimer || 0) + duration;
      if (HUD.notifyPickup) HUD.notifyPickup('💉 Speed Boost ' + duration + 's', '#ff8a65');
    }

  function addSuppression(amount) {
      _suppressionLevel = Math.min(1, _suppressionLevel + (amount || 0.15));
    }

  function updateSuppression(delta) {
      if (_suppressionLevel <= 0) return;
      _suppressionLevel = Math.max(0, _suppressionLevel - _suppressionDecay * delta);
      if (!_suppressionCanvas) {
        _suppressionCanvas = document.querySelector('canvas');
      }
      if (_suppressionCanvas) {
        var bl = _suppressionLevel * 1.5;
        var sat = 1 - _suppressionLevel * 0.4;
        _suppressionCanvas.style.filter = _suppressionLevel > 0.01
          ? 'blur(' + bl.toFixed(2) + 'px) saturate(' + sat.toFixed(2) + ')'
          : '';
      }
      // Micro-shake from suppression
      if (_suppressionLevel > 0.2 && typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        CameraSystem.shake(_suppressionLevel * 0.008, 0.05);
      }
    }

  function toggleStealth() {
      player.stealth = !player.stealth;
      var stInd = document.getElementById('stealth-indicator');
      if (stInd) stInd.style.display = player.stealth ? 'block' : 'none';
      HUD.notifyPickup(player.stealth ? '👻 STEALTH ON' : '👁 STEALTH OFF',
        player.stealth ? '#00ff66' : '#ff6600');
      // update pause button text
      var btn = document.getElementById('stealth-toggle-btn');
      if (btn) btn.textContent = player.stealth ? '👻 STEALTH ON' : '👻 TOGGLE STEALTH';
    }

  function toggleGodMode() {
      player.godMode = !player.godMode;
      if (player.godMode) {
        // Unlock all weapons
        for (var i = 0; i < Weapons.getWeaponCount(); i++) {
          Weapons.unlockWeapon(i);
        }
        // Refresh HUD weapon bar to show all unlocked slots
        HUD.setWeapon(Weapons.getCurrentName(), Weapons.getCurrentIdx());
        // Refill all ammo in god mode
        Weapons.refillAllAmmo();
        // Set infinite health
        player.maxHp = GOD_MODE_HP;
        player.hp = GOD_MODE_HP;
        HUD.setHealth(player.hp, player.maxHp);
        // Full armor
        player.armor = 100;
        if (HUD.updateArmor) HUD.updateArmor(1);
        // Full equipment kit (grenades, throwables, special items)
        try {
          if (typeof Pickups !== 'undefined' && Pickups.grantFullKit) Pickups.grantFullKit();
        } catch (e) {}
        // Equip top-tier perks (fills MAX_PERKS slots)
        try {
          if (typeof Perks !== 'undefined' && Perks.PERK_LIST && Perks.equipPerk) {
            var perkIds = Object.keys(Perks.PERK_LIST);
            var slots = (Perks.MAX_PERKS || 3);
            for (var p = 0; p < Math.min(slots, perkIds.length); p++) {
              try { Perks.equipPerk(perkIds[p]); } catch (e2) {}
            }
          }
        } catch (e) {}
        // Boost economy so player can buy anything
        try {
          if (typeof Economy !== 'undefined' && Economy.setCurrency) Economy.setCurrency(999999);
          else if (player.coins !== undefined) player.coins = 999999;
          // Top up build resources so structure placement (which gates on Economy) always succeeds
          if (typeof Economy !== 'undefined' && Economy.add) {
            ['wood','metal','electronics','fuel','stone','food'].forEach(function(r){
              try { Economy.add(r, 9999); } catch(e3) {}
            });
          }
        } catch (e) {}
        // Unlimited hand grenades
        player.grenades = Infinity;
        if (HUD.setHandGrenades) HUD.setHandGrenades(Infinity);
        // Enable stealth (enemies can't see player)
        player.stealth = true;
        Enemies.setPlayerStealth(true);
        var stInd = document.getElementById('stealth-indicator');
        if (stInd) stInd.style.display = 'block';
        // Grant unlimited build materials so god-mode player can build dugouts/structures freely
        try {
          if (player.buildMaterials) {
            player.buildMaterials.wood = 9999;
            player.buildMaterials.stone = 9999;
            player.buildMaterials.metal = 9999;
            player.buildMaterials.dirt = 9999;
            player.buildMaterials.sand = 9999;
            player.buildMaterials.brick = 9999;
          }
        } catch (e) {}
        HUD.notifyPickup('⚡ GOD MODE — FULL KIT EQUIPPED', '#ffff00');
      } else {
        // Reset health
        player.maxHp = 100;
        player.hp = 100;
        HUD.setHealth(player.hp, player.maxHp);
        // Disable forced stealth
        player.stealth = false;
        Enemies.setPlayerStealth(false);
        var stInd = document.getElementById('stealth-indicator');
        if (stInd) stInd.style.display = 'none';
        // Reset grenades to default 5
        player.grenades = 5;
        if (HUD.setHandGrenades) HUD.setHandGrenades(5);
        HUD.notifyPickup('⚡ GOD MODE DEACTIVATED', '#ff6600');
      }
    }

  function isGodMode() { return player.godMode; }

  function setRole(r) {
      var prev = player.role;
      player.role = (r === 'brigade') ? 'brigade' : 'lonewolf';
      updateRoleIndicator();
      HUD.notifyPickup(player.role === 'brigade' ? '🎖 ASSAULT BRIGADE' : '🐺 LONE WOLF',
        player.role === 'brigade' ? '#00aaff' : '#ffaa00');
      // Apply the role for real: BRIGADE fields the allied assault squads,
      // LONE WOLF fights solo. Previously this only changed the badge and the
      // 22-NPC army spawned either way, erasing all combat threat.
      try {
        if (typeof NPCSystem !== 'undefined' && prev !== player.role) {
          if (player.role === 'brigade') {
            if (NPCSystem.getCount && NPCSystem.getCount() < 4 && NPCSystem.spawnAssaultGroups) NPCSystem.spawnAssaultGroups();
          } else if (NPCSystem.clear) {
            NPCSystem.clear();
          }
        }
      } catch (eRole) {}
    }

  function updateRoleIndicator() {
      var el = document.getElementById('role-indicator');
      if (el) {
        el.textContent = player.role === 'brigade' ? '🎖 BRIGADE' : '🐺 LONE WOLF';
        el.style.color = player.role === 'brigade' ? '#0af' : '#fa0';
      }
      // highlight active button on start screen
      var sb = document.getElementById('start-role-brigade');
      var sl = document.getElementById('start-role-lonewolf');
      if (sb) sb.style.opacity = player.role === 'brigade' ? '1' : '0.4';
      if (sl) sl.style.opacity = player.role === 'lonewolf' ? '1' : '0.4';
      // highlight active button on pause screen
      var pb = document.getElementById('role-brigade-btn');
      var pl = document.getElementById('role-lonewolf-btn');
      if (pb) pb.style.opacity = player.role === 'brigade' ? '1' : '0.4';
      if (pl) pl.style.opacity = player.role === 'lonewolf' ? '1' : '0.4';
    }

  function throwHandGrenade() {
      if (_handGrenadeCooldown > 0) return;
      if (!player.godMode && (!player.grenades || player.grenades <= 0)) {
        HUD.notifyPickup('🚫 NO GRENADES', '#ff6600');
        return;
      }
      if (!_scene || !_camera) return;
      var geo = new THREE.SphereGeometry(0.10, 8, 6);
      var mat = new THREE.MeshLambertMaterial({ color: 0x2a3018 });
      var nade = new THREE.Mesh(geo, mat);
      var origin = player.position.clone();
      origin.y -= 0.4;
      nade.position.copy(origin);
      _scene.add(nade);
      var fwd = _camera.getWorldDirection(new THREE.Vector3());
      var vel = new THREE.Vector3(fwd.x * 18, 6 + fwd.y * 14, fwd.z * 18);
      _handGrenades.push({ mesh: nade, vel: vel, fuse: 2.5, spin: new THREE.Vector3(8, 6, 4) });
      if (!player.godMode) player.grenades = Math.max(0, player.grenades - 1);
      if (HUD.setHandGrenades) HUD.setHandGrenades(player.godMode ? Infinity : player.grenades);
      _handGrenadeCooldown = 0.45;
      HUD.notifyPickup('💣 GRENADE OUT', '#ffaa00');
    }

  function updateHandGrenades(delta) {
      if (_handGrenadeCooldown > 0) _handGrenadeCooldown = Math.max(0, _handGrenadeCooldown - delta);
      if (_handGrenades.length === 0) return;
      for (var i = _handGrenades.length - 1; i >= 0; i--) {
        var g = _handGrenades[i];
        g.fuse -= delta;
        g.vel.y -= 18 * delta;
        g.mesh.position.x += g.vel.x * delta;
        g.mesh.position.y += g.vel.y * delta;
        g.mesh.position.z += g.vel.z * delta;
        // Tumble while flying
        if (g.spin) {
          g.mesh.rotation.x += g.spin.x * delta;
          g.mesh.rotation.y += g.spin.y * delta;
          g.mesh.rotation.z += g.spin.z * delta;
        }
        var groundY = 0;
        try {
          if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTopSolidY) {
            groundY = VoxelWorld.getTopSolidY(g.mesh.position.x, g.mesh.position.z);
          } else if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
            groundY = VoxelWorld.getTerrainHeight(g.mesh.position.x, g.mesh.position.z) + 1;
          }
        } catch (e) {}
        if (g.mesh.position.y <= groundY + 0.1) {
          g.mesh.position.y = groundY + 0.1;
          g.vel.y = Math.abs(g.vel.y) * 0.35;
          g.vel.x *= 0.55;
          g.vel.z *= 0.55;
          if (g.vel.length() < 0.4) g.vel.set(0, 0, 0);
        }
        if (g.fuse <= 0) {
          var pos = g.mesh.position.clone();
          if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(pos, 2.2);
          if (window.AudioSystem && window.AudioSystem.playExplosion) {
            try { window.AudioSystem.playExplosion(); } catch (e) {}
          }
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
            var _gRes = Enemies.damageInRadius(pos, 6.5, 110);
            if (player && Array.isArray(_gRes)) {
              var _gKills = 0;
              for (var _gi = 0; _gi < _gRes.length; _gi++) if (_gRes[_gi].remaining <= 0) _gKills++;
              if (_gKills > 0) player.waveMaxExplosiveKill = Math.max(player.waveMaxExplosiveKill || 0, _gKills);
            }
          }
          if (CameraSystem.shake) CameraSystem.shake(0.35, 0.4);
          if (!player.godMode) {
            var dx = player.position.x - pos.x, dy = player.position.y - pos.y, dz = player.position.z - pos.z;
            var d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < 36) {
              var falloff = 1 - Math.sqrt(d2) / 6;
              onPlayerHit(60 * falloff, pos);
            }
          }
          if (_scene) _scene.remove(g.mesh);
          if (g.mesh.geometry) g.mesh.geometry.dispose();
          if (g.mesh.material) g.mesh.material.dispose();
          _handGrenades.splice(i, 1);
        }
      }
    }

  function clearHandGrenades() {
      for (var i = 0; i < _handGrenades.length; i++) {
        var g = _handGrenades[i];
        if (_scene) _scene.remove(g.mesh);
        if (g.mesh.geometry) g.mesh.geometry.dispose();
        if (g.mesh.material) g.mesh.material.dispose();
      }
      _handGrenades.length = 0;
    }

  /* ── Public API ─────────────────────────────────────────────── */
  return {
    init,
    get,
    isAlive,
    damage,
    heal,
    addArmor,
    addStimBuff,
    addSuppression,
    updateSuppression,
    toggleStealth,
    toggleGodMode,
    isGodMode,
    setRole,
    updateRoleIndicator,
    throwHandGrenade,
    updateHandGrenades,
    clearHandGrenades,
    consumeGrenade,
    addGrenades,
    addBuildMaterial,
    getBuildMaterial,
    resetBuildMaterials,
    drainStamina,
    regenStamina,
    resetMultikill,
    addMultikill,
    resetKillStreak,
    addKillStreak,
    startBleeding,
    stopBleeding,
    setPosition,
    setVelocity,

    /* Getters / Setters */
    getPosition, setPosition,
    getVelocity, setVelocity,
    getHp, setHp,
    getMaxHp, setMaxHp,
    getScore, setScore,
    getKills, setKills,
    getOnGround, setOnGround,
    getSprinting, setSprinting,
    getHeight, setHeight,
    getStealth, setStealth,
    getRole, setRole,
    getGodMode, setGodMode,
    getProne, setProne,
    getBleeding, setBleeding,
    getBleedTimer, setBleedTimer,
    getKillStreak, setKillStreak,
    getStreakTimer, setStreakTimer,
    getDogTags, setDogTags,
    getAirdropCooldown, setAirdropCooldown,
    getStamina, setStamina,
    getNightVision, setNightVision,
    getShieldTimer, setShieldTimer,
    getIntelTimer, setIntelTimer,
    getArmor, setArmor,
    getLastDamageTime, setLastDamageTime,
    getGrenades, setGrenades,
    getLootParticles, setLootParticles,
    getBuildMaterials, setBuildMaterials,
    getTotalShots, setTotalShots,
    getTotalHits, setTotalHits,
    getTotalHeadshots, setTotalHeadshots,
    getTotalDamageTaken, setTotalDamageTaken,
    getWaveStartTime, setWaveStartTime,
    getBestStreak, setBestStreak,
    getWaveKills, setWaveKills,
    getWaveShots, setWaveShots,
    getWaveHits, setWaveHits,
    getWaveHeadshots, setWaveHeadshots,
    getWaveDamageTaken, setWaveDamageTaken,
    getWaveMeleeKills, setWaveMeleeKills,
    getWaveFirstKillTime, setWaveFirstKillTime,
    getWaveMaxExplosiveKill, setWaveMaxExplosiveKill,
    getDistanceWalked, setDistanceWalked,
    getLastPos, setLastPos,
    getPlayStartTime, setPlayStartTime,
    getXp, setXp,
    getLevel, setLevel,
    getGrenadeCooked, setGrenadeCooked,
    getGrenadeCookTimer, setGrenadeCookTimer,
    getRadTimer, setRadTimer,
    getGeigerTimer, setGeigerTimer,
    getExecutionTarget, setExecutionTarget,
    getLastKillWeapon, setLastKillWeapon,
    getMultikillTimer, setMultikillTimer,
    getMultikillCount, setMultikillCount,
    getIsCrouching, setIsCrouching,
    getCrouchTimer, setCrouchTimer,
    getInCover, setInCover,
    getSlideTimer, setSlideTimer,
    getSlideDir, setSlideDir,
    getUsedLastStand, setUsedLastStand,
    addScore,
    addKills,
    addDogTags,
    addTotalShots,
    addTotalHits,
    addTotalHeadshots,
    addTotalDamageTaken,
    addWaveKills,
    addWaveShots,
    addWaveHits,
    addWaveHeadshots,
    addWaveDamageTaken,
    addWaveMeleeKills,
    addDistanceWalked,
    addXp,
    addGrenades,
    addMultikillCount,
    addKillStreak,
    addBestStreak,
  };
})();

/* Export for both CommonJS and browser environments */
if (typeof module !== "undefined" && module.exports) {
  module.exports = PlayerState;
}