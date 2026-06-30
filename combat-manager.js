/* combat-manager.js — Standalone combat logic extracted from game-manager.js */
const CombatManager = (function() {
  // ── Private combat state ─────────────────────────────────────────
  var _lastKillPos = null;  // position of most recent enemy kill
  var _killFovKick = 0; // additive FOV bump on kill, decays
  var _handGrenades = [];
  var _handGrenadeCooldown = 0;

  // ── Reusable temp vectors (mirrors game-manager.js) ──────────────
  var _gmTmp1 = new THREE.Vector3();
  var _gmTmp2 = new THREE.Vector3();
  var _gmTmp3 = new THREE.Vector3();
  var _gmNewPos = new THREE.Vector3();

  // ── Dependency placeholders (GameManager can override via init()) ─
  var player = (typeof window !== 'undefined' && window.player) ? window.player : null;
  var HUD = (typeof window !== 'undefined' && window.HUD) ? window.HUD : null;
  var Enemies = (typeof window !== 'undefined' && window.Enemies) ? window.Enemies : null;
  var Weapons = (typeof window !== 'undefined' && window.Weapons) ? window.Weapons : null;
  var CameraSystem = (typeof window !== 'undefined' && window.CameraSystem) ? window.CameraSystem : null;
  var AudioSystem = (typeof window !== 'undefined' && window.AudioSystem) ? window.AudioSystem : null;
  var DroneSystem = (typeof window !== 'undefined' && window.DroneSystem) ? window.DroneSystem : null;
  var VehicleSystem = (typeof window !== 'undefined' && window.VehicleSystem) ? window.VehicleSystem : null;
  var Tracers = (typeof window !== 'undefined' && window.Tracers) ? window.Tracers : null;
  var Feedback = (typeof window !== 'undefined' && window.Feedback) ? window.Feedback : null;
  var MLSystem = (typeof window !== 'undefined' && window.MLSystem) ? window.MLSystem : null;
  var MissionSystem = (typeof window !== 'undefined' && window.MissionSystem) ? window.MissionSystem : null;
  var Perks = (typeof window !== 'undefined' && window.Perks) ? window.Perks : null;
  var Progression = (typeof window !== 'undefined' && window.Progression) ? window.Progression : null;
  var Economy = (typeof window !== 'undefined' && window.Economy) ? window.Economy : null;
  var Marketplace = (typeof window !== 'undefined' && window.Marketplace) ? window.Marketplace : null;
  var Pickups = (typeof window !== 'undefined' && window.Pickups) ? window.Pickups : null;
  var NPCSystem = (typeof window !== 'undefined' && window.NPCSystem) ? window.NPCSystem : null;
  var RankSystem = (typeof window !== 'undefined' && window.RankSystem) ? window.RankSystem : null;
  var SkillSystem = (typeof window !== 'undefined' && window.SkillSystem) ? window.SkillSystem : null;
  var CombatExtras = (typeof window !== 'undefined' && window.CombatExtras) ? window.CombatExtras : null;
  var WeatherSystem = (typeof window !== 'undefined' && window.WeatherSystem) ? window.WeatherSystem : null;
  var VoxelWorld = (typeof window !== 'undefined' && window.VoxelWorld) ? window.VoxelWorld : null;
  var _scene = (typeof window !== 'undefined' && window._scene) ? window._scene : null;
  var _camera = (typeof window !== 'undefined' && window._camera) ? window._camera : null;
  var isMobile = (typeof window !== 'undefined' && window.isMobile) ? window.isMobile : false;
  var mouseDown = (typeof window !== 'undefined' && window.mouseDown) ? window.mouseDown : false;
  var touch = (typeof window !== 'undefined' && window.touch) ? window.touch : {};
  var mouseNewPress = (typeof window !== 'undefined' && window.mouseNewPress) ? window.mouseNewPress : false;
  var gameState = (typeof window !== 'undefined' && window.gameState) ? window.gameState : null;
  var STATE = (typeof window !== 'undefined' && window.STATE) ? window.STATE : null;
  var currentWave = (typeof window !== 'undefined' && window.currentWave) ? window.currentWave : 0;
  var currentStage = (typeof window !== 'undefined' && window.currentStage) ? window.currentStage : 0;
  var STAGES = (typeof window !== 'undefined' && window.STAGES) ? window.STAGES : [];
  var _waveStartTimer = (typeof window !== 'undefined' && window._waveStartTimer) ? window._waveStartTimer : null;
  var _defeatReason = (typeof window !== 'undefined' && window._defeatReason) ? window._defeatReason : null;
  var _baseFOV = (typeof window !== 'undefined' && window._baseFOV) ? window._baseFOV : 75;
  var _targetFOV = (typeof window !== 'undefined' && window._targetFOV) ? window._targetFOV : 75;
  var _lowEndVFX = (typeof window !== 'undefined' && window._lowEndVFX) ? window._lowEndVFX : false;
  var _rendererProfile = (typeof window !== 'undefined' && window._rendererProfile) ? window._rendererProfile : null;

  // Helper placeholders
  var spawnLootParticle = (typeof window !== 'undefined' && window.spawnLootParticle) ? window.spawnLootParticle : function() {};
  var showOverlay = (typeof window !== 'undefined' && window.showOverlay) ? window.showOverlay : function() {};
  var hideTankHUD = (typeof window !== 'undefined' && window.hideTankHUD) ? window.hideTankHUD : function() {};
  var hideDroneControlsHUD = (typeof window !== 'undefined' && window.hideDroneControlsHUD) ? window.hideDroneControlsHUD : function() {};
  var escapeHTML = (typeof window !== 'undefined' && window.escapeHTML) ? window.escapeHTML : function(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // ── Extracted functions ──────────────────────────────────────────
  function updateCombat(delta) {
    // Drone combat: LMB triggers drone action
    if (DroneSystem.isPossessing()) {
      if (mouseDown || touch.firing) {
        const drone = DroneSystem.getPossessed();
        if (drone) {
          if (drone.type === 'fpv_attack') {
            DroneSystem.fireAttack(drone.id);
          } else if (drone.type === 'bomb' && drone.hasPayload) {
            DroneSystem.dropPayload(drone.id);
          } else if ((drone.type === 'incendiary' || drone.type === 'baba_yaga') && drone.hasPayload) {
            DroneSystem.dropFire(drone.id);
            if (drone.type === 'baba_yaga') HUD.notifyPickup('🔥 THERMITE DROPPED!', '#ff8800');
          }
        }
        mouseNewPress = false;
      }
      return;
    }

    // Vehicle combat: LMB triggers turret fire
    if (VehicleSystem.isInVehicle()) {
      if (mouseDown || touch.firing) {
        VehicleSystem.setVehicleKey('fire', true);
      } else {
        VehicleSystem.setVehicleKey('fire', false);
      }
      return;
    }

    if (CameraSystem.getMode() === CameraSystem.MODE.STRATEGIC) return;

    if (mouseDown || touch.firing) {
      const targets = Enemies.getEnemyMeshes().slice();
      // Add vehicle meshes as targets so player can damage/destroy vehicles
      var allVehicles = VehicleSystem.getAll();
      for (var vi = 0; vi < allVehicles.length; vi++) {
        var veh = allVehicles[vi];
        if (veh.mesh && veh !== VehicleSystem.getOccupied()) {
          targets.push(veh.mesh);
        }
      }
      // Add drone meshes as targets so player can shoot down enemy AND friendly drones (friendly fire allowed)
      if (typeof DroneSystem !== 'undefined' && DroneSystem.getAllMeshes) {
        var droneMeshes = DroneSystem.getAllMeshes();
        for (var dmi = 0; dmi < droneMeshes.length; dmi++) {
          targets.push(droneMeshes[dmi]);
        }
      }
      // Add friendly NPC meshes for friendly-fire
      var _npcMeshes = [];
      if (typeof NPCSystem !== 'undefined' && NPCSystem.getAll) {
        var _npcList = NPCSystem.getAll();
        for (var ni = 0; ni < _npcList.length; ni++) {
          var _n = _npcList[ni];
          if (_n && _n.alive && _n.mesh) { targets.push(_n.mesh); _npcMeshes.push(_n); }
        }
      }
      const weaponType = Weapons.getCurrentType();
      const weaponId = Weapons.getCurrentId();
      // Map weapon type to audio sound type
      const audioMap = { MELEE: 'melee', PISTOL: 'pistol', ASSAULT: 'rifle', LMG: 'rifle', SNIPER: 'sniper', HMG: 'hmg', AT: 'launcher', ATGM: 'launcher', NATO: 'rifle', AT_HEAVY: 'launcher', AT_LIGHT: 'launcher', AA: 'launcher', GRENADE: 'launcher', NATO_HEAVY: 'rifle', HMG_HEAVY: 'hmg', INCENDIARY: 'launcher', MACHINEGUN: 'hmg', SMG: 'smg', AMR: 'heavy_sniper', MINIGUN: 'hmg', SILENT: 'silenced', THERMOBARIC: 'launcher', SHOTGUN: 'shotgun', MINE: 'explosive', SMOKE: 'launcher', FLASHBANG: 'launcher', EXPLOSIVE: 'explosive', GATLING: 'gatling' };
      Weapons.tryFire(_camera, targets, delta, function (hit) {
        // Check if hit a drone first (mesh hierarchy tagged with userData.droneId)
        var hitDrone = null;
        if (typeof DroneSystem !== 'undefined' && DroneSystem.findByMesh) {
          hitDrone = DroneSystem.findByMesh(hit.object);
        }
        if (hitDrone) {
          var dmgD = Weapons.getDamage();
          DroneSystem.damageDrone(hitDrone.id, dmgD);
          if (typeof Tracers !== 'undefined' && Tracers.spawnImpactSpark) {
            Tracers.spawnImpactSpark(hit.point || hitDrone.position);
          }
          // Award score for downing enemy drone
          if (!hitDrone.alive && hitDrone.faction === 'russian') {
            player.score += 50;
            player.kills += 1;
            if (typeof HUD !== 'undefined' && HUD.addCombatLog) {
              HUD.addCombatLog('Enemy drone shot down (+50)', '#44ddff');
            }
          }
          return;
        }
        // ── Friendly Fire: check if bullet hit a Ukrainian NPC ──
        var hitNPC = null;
        var _nWalk = hit.object;
        var _nGuard = 0;
        while (_nWalk && _nGuard < 8 && !hitNPC) {
          for (var _nii = 0; _nii < _npcMeshes.length; _nii++) {
            if (_npcMeshes[_nii].mesh === _nWalk) { hitNPC = _npcMeshes[_nii]; break; }
          }
          _nWalk = _nWalk.parent;
          _nGuard++;
        }
        if (hitNPC) {
          var ffDmg = Weapons.getDamage();
          if (typeof NPCSystem !== 'undefined' && NPCSystem.damage) {
            NPCSystem.damage(hitNPC.id, ffDmg);
          }
          // Penalty
          var penalty = Math.min(50, Math.max(10, Math.floor(ffDmg * 0.5)));
          player.score = Math.max(0, player.score - penalty);
          if (typeof Economy !== 'undefined' && Economy.spendCurrency) {
            Economy.spendCurrency(penalty);
          }
          if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
            HUD.notifyPickup('⚠ FRIENDLY FIRE! -' + penalty + ' OKC', '#ff2222');
          }
          // Red flash
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) {
            HUD.showDamageFlash(0.4);
          }
          return;
        }
        // Check if hit a vehicle mesh — walk up parent tree because vehicles have nested children
        var hitVehicle = null;
        var _vWalk = hit.object;
        var _vGuard = 0;
        while (_vWalk && _vGuard < 8 && !hitVehicle) {
          for (var hvi = 0; hvi < allVehicles.length; hvi++) {
            if (allVehicles[hvi].mesh === _vWalk) { hitVehicle = allVehicles[hvi]; break; }
          }
          _vWalk = _vWalk.parent;
          _vGuard++;
        }
        if (hitVehicle) {
          onVehicleHit(hitVehicle, Weapons.getDamage());
        } else {
          onEnemyHit(hit);
        }
      }, mouseNewPress);
      // Play sound on every actual shot (auto-fire included), not just first click
      if (Weapons.didFire()) {
        if (window.AudioSystem) {
          if (weaponType === 'FLASHBANG' && window.AudioSystem.playFlashbang) window.AudioSystem.playFlashbang();
          else if (weaponType === 'SMOKE' && window.AudioSystem.playSmoke) window.AudioSystem.playSmoke();
          else if (weaponType === 'MINE' && window.AudioSystem.playMine) window.AudioSystem.playMine();
          else if (window.AudioSystem.playGunshot) window.AudioSystem.playGunshot(audioMap[weaponType] || 'rifle');
        }
        // Mobile fire haptic — louder for heavy weapons
        if (isMobile && navigator.vibrate) {
          var heavyFire = ['HMG', 'HMG_HEAVY', 'MACHINEGUN', 'MINIGUN', 'AT', 'ATGM', 'AT_HEAVY', 'AT_LIGHT', 'AA', 'AMR'].indexOf(weaponType) >= 0;
          try { navigator.vibrate(heavyFire ? 22 : 8); } catch (e) {}
        }
        MLSystem.onShot(weaponId);
        player.totalShots++;
        player.waveShots++;
        // Register heat + maintenance per shot (not per hit, to avoid shotgun 8x issue)
        if (typeof CombatExtras !== 'undefined') {
          CombatExtras.registerShot();
          var isAutoWep = ['ASSAULT', 'NATO', 'NATO_HEAVY', 'LMG', 'HMG', 'SMG', 'HMG_HEAVY', 'MACHINEGUN', 'MINIGUN'].indexOf(weaponType) >= 0;
          // God mode: never overheat.
          if (!player.godMode) CombatExtras.addHeat(isAutoWep);
        }
        // Spawn bullet tracer
        if (typeof Tracers !== 'undefined' && weaponType !== 'MELEE' && weaponType !== 'SILENT') {
          _gmTmp2.copy(_camera.position);
          _camera.getWorldDirection(_gmTmp3);
          var isHeavy = ['HMG', 'HMG_HEAVY', 'MACHINEGUN', 'MINIGUN'].indexOf(weaponType) >= 0;
          var isExplosive = ['AT', 'ATGM', 'AT_HEAVY', 'AT_LIGHT', 'AA', 'GRENADE', 'INCENDIARY', 'THERMOBARIC'].indexOf(weaponType) >= 0;
          var isSniperShot = ['SNIPER', 'AMR'].indexOf(weaponType) >= 0;
          if (!isExplosive) {
            _gmNewPos.copy(_gmTmp2).addScaledVector(_gmTmp3, 0.5);
            var tracerColor = isHeavy ? 0xff4400 : (isSniperShot ? 0x66ff88 : 0xffcc44);
            Tracers.spawnTracer(_gmNewPos, _gmTmp3, tracerColor, isSniperShot ? 220 : 120);
            if (Tracers.spawnBullet) {
              Tracers.spawnBullet(_gmNewPos, _gmTmp3, tracerColor, isSniperShot ? 320 : 200);
            }
          }
          // Muzzle flash on every shot
          if (Tracers.spawnMuzzleFlash) {
            Tracers.spawnMuzzleFlash(_gmTmp2, _gmTmp3);
          }
          // Screen shake for heavy weapons
          if (isHeavy && CameraSystem.shake) {
            CameraSystem.shake(0.02, 0.1);
          }
        }
      }
      mouseNewPress = false;
    }
  }
  function onEnemyHit(hit) {
    const enemy = Enemies.findByMesh(hit.object);
    if (!enemy || !enemy.alive) return;

    // Pitch-shift hit marker by remaining HP — high pitch when target near death
    if (AudioSystem.playHitPitched) {
      var _hpFrac = (enemy.maxHp > 0) ? (enemy.hp / enemy.maxHp) : 1;
      AudioSystem.playHitPitched(_hpFrac);
    } else {
      AudioSystem.playHit();
    }
    // Blood splatter on hit — directional exit-wound spray
    if (typeof Tracers !== 'undefined' && Tracers.spawnBlood) {
      var _bloodPt = hit.point || enemy.mesh.position;
      var _bloodDir = null;
      try {
        if (hit.point && _camera) {
          _bloodDir = hit.point.clone().sub(_camera.position).normalize();
        }
      } catch (eBd) { _bloodDir = null; }
      Tracers.spawnBlood(_bloodPt, _bloodDir);
    }
    MLSystem.onHit(Weapons.getCurrentId());
    // AI Smart Learning: track weapon engagement range
    var engageRange = enemy.mesh.position.distanceTo(player.position);
    MLSystem.trackWeaponUse(Weapons.getCurrentId(), engageRange);
    MLSystem.trackWeaponType(Weapons.getCurrentType());
    // Track if player is being aggressive (moving toward enemies)
    MLSystem.trackCombatEngagement(engageRange < 10);

    const isHeadshot = hit.object === enemy.mesh.userData.headMesh;
    let baseDmg = Weapons.getDamage();

    // ═══ NEW: Apply ammo type and perk damage modifiers ═══
    if (typeof CombatExtras !== 'undefined') {
      var ammoMods = CombatExtras.getAmmoModifiers();
      baseDmg = Math.round(baseDmg * ammoMods.dmgMult);
    }
    // Dead eye crit check
    if (typeof Perks !== 'undefined' && Perks.isDeadEyeShot()) {
      baseDmg = Math.round(baseDmg * Perks.getDeadEyeMult());
      HUD.notifyPickup('🎯 DEAD EYE CRIT!', '#ff4400');
    }
    // Prestige damage bonus
    if (typeof Progression !== 'undefined') {
      var pBonuses = Progression.getPrestigeBonuses();
      baseDmg = Math.round(baseDmg * pBonuses.damageMult);
    }
    const dmg = isHeadshot ? baseDmg * 2 : baseDmg;

    var _wepType = (typeof Weapons !== 'undefined' && Weapons.getCurrent) ? Weapons.getCurrent().type : '';
    const remaining = Enemies.damage(enemy, dmg, isHeadshot, _wepType);

    // Floating damage number on hit (not just kill)
    if (typeof Feedback !== 'undefined') {
      // Project enemy world position to screen so the number rises from the actual hit point
      var _dnX = window.innerWidth / 2 + (Math.random() - 0.5) * 40;
      var _dnY = window.innerHeight / 2 - 20 + (Math.random() - 0.5) * 30;
      try {
        if (enemy && enemy.mesh && _camera) {
          var _wpos = enemy.mesh.position.clone();
          _wpos.y += 1.4 + Math.random() * 0.4; // rise from upper torso
          var _proj = _wpos.project(_camera);
          if (_proj.z < 1) {
            _dnX = (_proj.x * 0.5 + 0.5) * window.innerWidth;
            _dnY = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
          }
        }
      } catch (eDN) {}
      Feedback.spawnDamageNumber(_dnX, _dnY, dmg, isHeadshot, false);
    }

    SkillSystem.onShoot(true, isHeadshot);
    HUD.flashHit(isHeadshot, remaining <= 0);
    player.totalHits++;
    player.waveHits++;

    if (isHeadshot) {
      HUD.showHeadshot();
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playCriticalHit) AudioSystem.playCriticalHit();
      player.score += 50;
      player.totalHeadshots++;
      player.waveHeadshots++;
    }

    if (remaining <= 0) {
      AudioSystem.playDeath();
      // Track last kill position for kill cam
      _lastKillPos = enemy.mesh ? enemy.mesh.position.clone() : null;
      // Death explosion effect
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(enemy.mesh.position, 1.5);
      }
      MLSystem.onKill(Weapons.getCurrentId());
      MLSystem.trackKillTiming(); // AI Smart Learning: track kill timing patterns
      // INFILTRATE mission: count occupant kills (stealth bonus if disguise still up)
      try { if (typeof MissionSystem !== 'undefined' && MissionSystem.onEnemyKilled) MissionSystem.onEnemyKilled(); } catch (eMK) {}
      // Patriotic kill flair — occasional Ukrainian battle cries on streak.
      try {
        if (player.killStreak >= 3 && Math.random() < 0.18 && typeof HUD !== 'undefined' && HUD.showToast) {
          var _cries = [
            'СЛАВА УКРАЇНІ! 🇺🇦',
            'ГЕРОЯМ СЛАВА!',
            'PUTIN KHUYLO!',
            'Ghost of Kyiv strikes!',
            'For Mariupol! 🇺🇦',
            'BAYRAKTAR! 🚁',
            'Russian warship — go fuck yourself.',
            'НА БАЙРАКТАРИ!',
          ];
          HUD.showToast(_cries[Math.floor(Math.random() * _cries.length)], 1800, '#ffd500');
        }
      } catch (eUC) {}
      // Streak score multiplier: 3+ kills in chain = +10% per streak (capped at +150%)
      var _streakMult = 1 + Math.min(1.5, Math.max(0, player.killStreak - 1) * 0.1);
      var _scoreGain = Math.round((enemy.scoreValue || 0) * _streakMult);
      player.score += _scoreGain;
      // Show floating multiplier text when meaningful (>= x1.2)
      if (_streakMult >= 1.2 && typeof Feedback !== 'undefined' && Feedback.showStreakMult) {
        try { Feedback.showStreakMult(_streakMult); } catch (eSM) {}
      }
      player.kills++;
      player.waveKills++;
      if (player.waveKills === 1) player.waveFirstKillTime = (performance.now() - player.waveStartTime) / 1000;
      // Kill milestone banners — celebrate round numbers of total kills
      try {
        var _kMile = player.kills;
        var _mileLabel = null;
        if (_kMile === 50) _mileLabel = '⚔ 50 KILLS — WARRIOR';
        else if (_kMile === 100) _mileLabel = '🔥 100 KILLS — VETERAN';
        else if (_kMile === 250) _mileLabel = '💀 250 KILLS — REAPER';
        else if (_kMile === 500) _mileLabel = '☠ 500 KILLS — DESTROYER';
        else if (_kMile === 1000) _mileLabel = '👑 1000 KILLS — LEGEND';
        else if (_kMile > 1000 && _kMile % 1000 === 0) _mileLabel = '👑 ' + _kMile + ' KILLS — UNSTOPPABLE';
        if (_mileLabel && HUD.showStreakBanner) HUD.showStreakBanner(_mileLabel, _kMile);
      } catch (eMile) {}
      // Mobile haptic — double-pulse for kill, longer for headshot
      if (isMobile && navigator.vibrate) {
        try { navigator.vibrate(isHeadshot ? [25, 35, 60] : [20, 30, 30]); } catch (e) {}
      }
      HUD.setScore(player.score);
      HUD.setKills(player.kills);
      RankSystem.onKill(isHeadshot);
      HUD.addKill(Weapons.getCurrentName(), enemy.typeCfg ? enemy.typeCfg.name : 'ENEMY', isHeadshot);
      // FOV kick: brief zoom-out punch on kill (bigger on headshot)
      _killFovKick = Math.max(_killFovKick, isHeadshot ? 4.5 : 2.5);

      // ── B23: XP system ──
      var xpGain = (enemy.typeCfg ? enemy.typeCfg.xpReward : 20) || 20;
      if (isHeadshot) xpGain = Math.floor(xpGain * 1.5);
      // Long-shot bonus: kills beyond 40m award bonus XP and a banner
      try {
        var _killDist = (enemy && enemy.mesh) ? enemy.mesh.position.distanceTo(player.position) : 0;
        if (_killDist >= 40) {
          var _longBonus = _killDist >= 80 ? 50 : (_killDist >= 60 ? 35 : 20);
          xpGain += _longBonus;
          player.score += _longBonus;
          if (HUD.showStreakBanner) {
            var _ldLabel = _killDist >= 80 ? '🎯 IMPOSSIBLE SHOT' : (_killDist >= 60 ? '🎯 LONG SHOT' : '🎯 RANGED KILL');
            HUD.showStreakBanner(_ldLabel + ' +' + _longBonus, Math.round(_killDist));
          }
        }
      } catch (eLS) {}
      // Personal-best longest-shot tracker — announce + persist when broken
      try {
        var _kdNow = (enemy && enemy.mesh) ? enemy.mesh.position.distanceTo(player.position) : 0;
        if (_kdNow > 5) {
          if (player._longestShot === undefined) {
            player._longestShot = parseFloat(localStorage.getItem('ok_longest_shot') || '0') || 0;
          }
          if (_kdNow > player._longestShot + 1) {
            player._longestShot = _kdNow;
            try { localStorage.setItem('ok_longest_shot', String(_kdNow)); } catch (eLS2) {}
            if (HUD.showStreakBanner) HUD.showStreakBanner('🏆 NEW LONGEST SHOT: ' + Math.round(_kdNow) + 'm', Math.round(_kdNow));
          }
        }
      } catch (eLS3) {}
      player.xp += xpGain;
      var xpNeeded = player.level * 200;
      if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.level++;
        if (HUD.showStreakBanner) HUD.showStreakBanner('LEVEL UP! LVL ' + player.level, player.level);
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playLevelUp) AudioSystem.playLevelUp();
        // Level-up VFX: golden burst of pickup-style sparks at player + brief FOV punch
        try {
          if (typeof Tracers !== 'undefined' && Tracers.spawnPickupBurst) {
            var _luPos = player.position.clone(); _luPos.y += 1.2;
            Tracers.spawnPickupBurst(_luPos, 0xffd700);
          }
          _killFovKick = Math.max(_killFovKick, 6); // bigger zoom-out punch
          if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) {
            Feedback.triggerSlowMo(0.35, 0.5);
          }
        } catch (eLU) {}
        // Unlock a weapon every 3 levels
        if (player.level % 3 === 0) {
          var newWepIdx = Weapons.unlockNext();
          if (newWepIdx >= 0 && HUD.showWeaponUnlockCard && Weapons.getWeaponDef) {
            HUD.showWeaponUnlockCard(Weapons.getWeaponDef(newWepIdx));
          }
        }
      }
      if (HUD.updateXPBar) HUD.updateXPBar(player.xp, xpNeeded, player.level);
      if (Feedback.showXPGain) Feedback.showXPGain(xpGain);

      // ── B23: Multikill tracking ──
      player.multikillTimer = 2.0;
      player.multikillCount++;
      if (player.multikillCount >= 2) {
        var mkNames = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'MULTI KILL', 'MEGA KILL', 'ULTRA KILL'];
        var mkName = mkNames[Math.min(player.multikillCount, 6)];
        if (HUD.showStreakBanner) HUD.showStreakBanner(mkName, player.multikillCount);
        // Adrenaline rush on quad+: brief slow-mo + FOV punch
        if (player.multikillCount >= 4) {
          if (Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.5, 0.55);
          _killFovKick = Math.max(_killFovKick, 7);
          if (CameraSystem.shake) CameraSystem.shake(0.10, 0.4);
        }
      }

      // ── B23: Kill confirm effect ──
      if (Feedback.showKillConfirm) Feedback.showKillConfirm();
      if (isHeadshot && AudioSystem.playHeadshotDing) AudioSystem.playHeadshotDing();
      // Headshot brain-spurt: extra blood spray upward + slight extra slow-mo
      if (isHeadshot && enemy && enemy.mesh && typeof Tracers !== 'undefined') {
        try {
          var _hsPos = enemy.mesh.position.clone();
          _hsPos.y += (enemy.typeCfg ? enemy.typeCfg.scale * 1.7 : 1.7);
          // Multiple blood sprays in different directions for fountain effect
          var _hsUp = new THREE.Vector3(0, 1, 0);
          if (Tracers.spawnBlood) {
            Tracers.spawnBlood(_hsPos, _hsUp);
            Tracers.spawnBlood(_hsPos, new THREE.Vector3(0.4, 0.9, 0.1).normalize());
            Tracers.spawnBlood(_hsPos, new THREE.Vector3(-0.4, 0.9, -0.1).normalize());
          }
        } catch (eHS) {}
      }

      // ── Kill audio feedback ──
      if (typeof AudioSystem !== 'undefined') {
        if (player.kills === 1 && AudioSystem.playFirstBlood) AudioSystem.playFirstBlood();
        else if (AudioSystem.playKillConfirm) AudioSystem.playKillConfirm();
        if (player.multikillCount >= 2 && AudioSystem.playMultiKill) AudioSystem.playMultiKill(player.multikillCount);
      }

      // ── Hitstop on kill (micro-freeze for impact feel) ──
      if (typeof Feedback !== 'undefined' && Feedback.triggerHitStop) {
        if (player.multikillCount >= 3) Feedback.triggerHitStop(4);
        else if (isHeadshot) Feedback.triggerHitStop(3);
        else Feedback.triggerHitStop(1);
      }

      // ── Slow-mo on triple+ multikill ──
      if (player.multikillCount >= 3 && typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) {
        Feedback.triggerSlowMo(0.25, 0.3);
      }

      // ── Kill Momentum: HP regen + speed burst + mag refill ──
      var killHeal = 5 + Math.min(player.killStreak * 2, 15);
      player.hp = Math.min(player.maxHp, player.hp + killHeal);
      HUD.setHealth(player.hp, player.maxHp);
      // Streak 3+: partial armor regen
      if (player.killStreak >= 3) {
        player.armor = Math.min(100, player.armor + 5);
        if (HUD.updateArmor) HUD.updateArmor(player.armor / 100);
      }
      // Speed burst after kill
      player._killSpeedBoost = Math.min(0.4, 0.1 + player.killStreak * 0.03);
      player._killSpeedTimer = 1.5;
      // Streak 5+: refill 20% of magazine
      if (player.killStreak >= 5) {
        var kst = Weapons.getState ? Weapons.getState() : null;
        var kwep = Weapons.getCurrent ? Weapons.getCurrent() : null;
        if (kst && kwep && kwep.clipSize > 0 && !kst.reloading) {
          kst.clip = Math.min(kwep.clipSize, kst.clip + Math.ceil(kwep.clipSize * 0.2));
          HUD.setAmmo(kst.clip, kst.reserve, kwep.clipSize);
        }
      }

      // ── B22: Boss bar update ──
      if (enemy.type === 'BOSS') {
        if (HUD.hideBossBar) HUD.hideBossBar();
      }

      // ── B22: Damage log ──
      if (HUD.addDamageLog) HUD.addDamageLog('Killed ' + (enemy.typeCfg ? enemy.typeCfg.name : 'Enemy') + ' (+' + xpGain + ' XP)', '#44ff44');

      // ═══ NEW: Progression, Perks, Feedback tracking on kill ═══
      // Kill feed entry
      if (typeof Feedback !== 'undefined') {
        Feedback.addKillFeedEntry('You', enemy.typeCfg ? enemy.typeCfg.name : 'Enemy', Weapons.getCurrentName(), isHeadshot);
      }
      // Floating damage number
      if (typeof Feedback !== 'undefined') {
        Feedback.spawnDamageNumber(window.innerWidth / 2, window.innerHeight / 2 - 30, dmg, isHeadshot, false);
      }
      // Perk: kill tracking & killstreaks
      if (typeof Perks !== 'undefined') {
        Perks.onKill();
        // Scavenger auto-loot
        var scavRange = Perks.getScavengerRange();
        if (scavRange > 0) {
          Weapons.addAmmo(Perks.getScavengerAmmo());
          HUD.notifyPickup('🔄 SCAVENGER: +' + Perks.getScavengerAmmo() + ' ammo', '#88ff88');
        }
        // Update killstreak panel
        var ksList = document.getElementById('killstreak-list');
        if (ksList) {
          var avail = Perks.getAvailableStreaks();
          if (avail.length > 0) {
            document.getElementById('killstreak-panel').style.display = 'block';
            var ksHTML = '';
            for (var ksi = 0; ksi < avail.length; ksi++) {
              ksHTML += '<div style="margin:3px 0;cursor:pointer;padding:2px 4px;border:1px solid #ff6600;border-radius:3px" onclick="GameManager._activateStreak(' + ksi + ')">' + avail[ksi].icon + ' ' + avail[ksi].name + '</div>';
            }
            ksList.innerHTML = ksHTML;
          }
        }
      }
      // Progression: stats tracking
      if (typeof Progression !== 'undefined') {
        Progression.trackStat('totalKills', 1);
        Progression.trackWeaponKill(Weapons.getCurrentName());
        if (isHeadshot) Progression.trackStat('headshots', 1);
        Progression.trackStat('totalDamageDealt', dmg);
        // Check bounties
        var completedBounties = Progression.updateBounty('weapon_kill', 1);
        if (isHeadshot) Progression.updateBounty('headshot_wave', 1);
        Progression.updateBounty('damage', dmg);
        for (var cbi = 0; cbi < completedBounties.length; cbi++) {
          HUD.notifyPickup('💰 BOUNTY COMPLETE! +' + escapeHTML(completedBounties[cbi].reward) + ' OKC', '#ffaa00');
          if (typeof Marketplace !== 'undefined' && Marketplace.awardCustomOKC) {
            var _awardPromise = Marketplace.awardCustomOKC(completedBounties[cbi].reward, 'bounty_reward', {
              bountyId: completedBounties[cbi].id || null,
              bountyType: completedBounties[cbi].type || null,
            });
            if (_awardPromise && typeof _awardPromise.then === 'function') {
              _awardPromise.then(function () {
                if (HUD && HUD.updateOKC) HUD.updateOKC(Marketplace.getOKC());
              });
            } else if (HUD && HUD.updateOKC) {
              HUD.updateOKC(Marketplace.getOKC());
            }
          } else if (typeof Marketplace !== 'undefined') {
            Marketplace.addOKC(completedBounties[cbi].reward);
          }
          if (typeof AudioSystem !== 'undefined' && AudioSystem.playBountyComplete) AudioSystem.playBountyComplete();
        }
        // Achievement checks
        if (typeof Feedback !== 'undefined') {
          if (player.kills === 1) Feedback.unlockAchievement('FIRST_BLOOD');
          if (player.totalHeadshots >= 10) Feedback.unlockAchievement('SHARPSHOOTER');
          if (player.killStreak >= 4) Feedback.unlockAchievement('MULTI_KILL');
          if (Weapons.getCurrentIdx() === 0) {
            Progression.trackStat('meleeKills', 1);
            player.waveMeleeKills++;
            if (Progression.getStats().meleeKills >= 10) Feedback.unlockAchievement('MELEE_MASTER');
          }
        }
        // Journal unlock by kills
        if (player.kills >= 5) Progression.unlockJournalEntry('entry_conscript');
        if (player.kills >= 10) Progression.unlockJournalEntry('entry_stormer');
        if (player.kills >= 15) Progression.unlockJournalEntry('entry_armored');
      }

      // Kill streak tracking
      player.killStreak++;
      if (player.killStreak > player.bestStreak) player.bestStreak = player.killStreak;
      // Radio chatter on milestones
      if (typeof Feedback !== 'undefined' && Feedback.radioChatter) {
        if (player.kills === 1) Feedback.radioChatter('first_blood');
        if (player.killStreak === 5 || player.killStreak === 10) Feedback.radioChatter('kill_streak');
      }

      // ── B30: Weapon Mastery tracking ──
      if (typeof CombatExtras !== 'undefined' && CombatExtras.addWeaponKill) {
        var masteryUp = CombatExtras.addWeaponKill(Weapons.getCurrentId());
        if (masteryUp) {
          var mastery = CombatExtras.getWeaponMastery(Weapons.getCurrentId());
          if (mastery) HUD.notifyPickup('⭐ ' + Weapons.getCurrentName() + ' MASTERY: ' + mastery.rankName, '#ffdd44');
        }
      }

      // ── B27: Economy bounty tracking ──
      if (typeof Economy !== 'undefined' && Economy.updateBounty) {
        if (isHeadshot) Economy.updateBounty('headshot', 1);
        Economy.updateBounty('kills', 1);
        if (Weapons.getCurrentType() === 'MELEE') Economy.updateBounty('melee', 1);
        if (player.killStreak >= 5) Economy.updateBounty('streak', player.killStreak);
      }

      // ── B31: Progression achievements on kill milestones ──
      if (typeof Progression !== 'undefined' && Progression.checkAchievement) {
        Progression.checkAchievement('FIRST_BLOOD', player.kills);
        Progression.checkAchievement('SLAYER', player.kills);
        Progression.checkAchievement('HEADHUNTER', player.totalHeadshots);
        if (player.totalShots >= 100) {
          var accPct = player.totalHits / player.totalShots;
          Progression.checkAchievement('SHARPSHOOTER', accPct * 100);
        }
        if (Progression.addSeasonXP) Progression.addSeasonXP(5 + (isHeadshot ? 5 : 0));
      }
      player.streakTimer = 4.0; // 4 seconds to chain another kill
      var streakMult = 1.0 + Math.min(player.killStreak - 1, 10) * 0.2; // up to 3.0x at 11+ streak
      var streakBonus = Math.floor(enemy.scoreValue * (streakMult - 1));
      if (streakBonus > 0) {
        player.score += streakBonus;
        HUD.setScore(player.score);
      }
      if (HUD.showStreak) HUD.showStreak(player.killStreak, streakMult);

      // Dog tag collection (every kill drops a dog tag)
      player.dogTags++;
      if (player.dogTags % 10 === 0) {
        player.score += 500;
        HUD.setScore(player.score);
        HUD.notifyPickup('🏷 10 DOG TAGS! +500 SCORE', '#ffaa00');
      }

      // Play-to-Earn: award OKC for kills
      if (typeof Marketplace !== 'undefined') {
        Marketplace.onKill(isHeadshot);
        if (player.killStreak === 3 || player.killStreak === 5 || player.killStreak >= 10) {
          Marketplace.onStreak(player.killStreak);
        }
        HUD.updateOKC(Marketplace.getOKC());
      }

      // Pickup spawn — expanded loot table
      if (Math.random() < enemy.dropChance) {
        const lootRoll = Math.random();
        let type;
        if (lootRoll < 0.25)      type = 'HEALTH';
        else if (lootRoll < 0.45) type = 'AMMO';
        else if (lootRoll < 0.58) type = 'ARMOR';
        else if (lootRoll < 0.68) type = 'GRENADE';
        else if (lootRoll < 0.77) type = 'MEDKIT';
        else if (lootRoll < 0.85) type = 'STIM';
        else if (lootRoll < 0.92) type = 'INTEL';
        else                      type = 'SHIELD';
        Pickups.spawn(enemy.mesh.position, type);
        // Loot drop sparkle
        if (typeof Tracers !== 'undefined' && Tracers.spawnSparks) Tracers.spawnSparks(enemy.mesh.position);
      }

      // Enemy weapon drop: enemies drop their own weapon as collectible loot (~40%).
      if (Math.random() < 0.40) {
        var _ENEMY_WEAPONS = {
          CONSCRIPT: 'MAKAROV',   STORMER: 'AK74',        ARMORED: 'PKM',
          MEDIC: 'MAKAROV',       OFFICER: 'MAKAROV',     SNIPER: 'SVD',
          ENGINEER: 'AK74',       SPETSNAZ: 'AK12',       RIOT: 'MAKAROV',
          TANK: 'PKM',            ASSAULT_MECH: 'PKM',    BOSS: 'PKM',
          WAGNER: 'SCARH',        KADYROVITE: 'AK74',     COMMISSAR: 'MAKAROV',
          SABOTEUR: 'GP25',       SHIELD_BEARER: 'MAKAROV', MORTAR: 'AK74',
          SNIPER_ELITE: 'BARRETTM82', HEAVY_SNIPER: 'BARRETTM82',
          FLAMETHROWER: 'FLAMETHROWER',
          BTR: 'PKM',             PARATROOP: 'AK74',      DRONE_OP: 'MAKAROV',
          EW_OPERATOR: 'MAKAROV', WAR_DOG: null,          BOMBER: null,
          KAMIKAZE_DRONE: null,   THERMOBARIC: 'RPG7',    ASSAULT_MECH: 'PKM',
        };
        var enemyTypeName = (enemy.typeCfg && enemy.typeCfg.name) || 'CONSCRIPT';
        var dropWeaponId = (enemyTypeName in _ENEMY_WEAPONS) ? _ENEMY_WEAPONS[enemyTypeName] : 'AK74';
        if (!dropWeaponId) dropWeaponId = null;
        // Find weapon index by ID
        var dropIdx = -1;
        var wCount = Weapons.getWeaponCount();
        for (var dwi = 0; dwi < wCount; dwi++) {
          if (Weapons.getWeaponId(dwi) === dropWeaponId) { dropIdx = dwi; break; }
        }
        if (dropIdx >= 0 && dropWeaponId) {
          Pickups.spawn(enemy.mesh.position, 'WEAPON', { weaponIdx: dropIdx, weaponId: dropWeaponId });
        }
      }

      // Weapon unlock drop (pickup weapons 2-15)
      if (Math.random() < 0.12) {
        const candidates = [];
        const weaponCount = Weapons.getWeaponCount();
        for (let wi = 2; wi < weaponCount; wi++) {
          if (!Weapons.isUnlocked(wi)) candidates.push(wi);
        }
        if (candidates.length > 0) {
          const idx = candidates[Math.floor(Math.random() * candidates.length)];
          Weapons.unlockWeapon(idx);
          HUD.notifyPickup('WEAPON UNLOCKED: ' + Weapons.getWeaponName(idx), '#ff8800');
        }
      }
    }
  }
  function onVehicleHit(vehicle, dmg) {
    if (!vehicle || !vehicle.alive) return;
    VehicleSystem.damageVehicle(vehicle.id, dmg);
    if (window.AudioSystem && window.AudioSystem.playHit) window.AudioSystem.playHit();
    if (HUD.addCombatLog) HUD.addCombatLog('Hit vehicle (-' + dmg + ')', '#ff8800');
    // Spawn sparks on vehicle hit
    if (typeof Tracers !== 'undefined' && Tracers.spawnMuzzleFlash) {
      _gmTmp1.set(0, 1, 0);
      Tracers.spawnMuzzleFlash(vehicle.position, _gmTmp1);
    }
    // Check if destroyed
    if (vehicle.health <= 0) {
      player.score += 200;
      HUD.setScore(player.score);
      HUD.notifyPickup('🚗 VEHICLE DESTROYED! +200', '#ff8800');
      if (HUD.addCombatLog) HUD.addCombatLog('Vehicle destroyed! +200 score', '#ff4400');
      // Spawn loot from destroyed vehicle
      spawnLootParticle(vehicle.position, 5 + Math.floor(Math.random() * 5));
      // Explosion effect
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(vehicle.position, 3);
      }
    }
  }
  function onPlayerHit(dmg, attackerPos) {
    if (gameState !== STATE.PLAYING) return; // can't take damage when dead/paused
    if (player.godMode) return; // God mode: immune to damage
    if (DroneSystem.isPossessing()) return; // player body is passive while piloting drone
    // Shield absorbs damage
    if (player.shieldTimer > 0) {
      HUD.notifyPickup('🛡 SHIELDED!', '#ffd700');
      return;
    }
    // B24: Crouch reduces damage 15%, cover reduces 40%
    if (player.inCover) {
      dmg = Math.round(dmg * 0.6);
    } else if (player.isCrouching) {
      dmg = Math.round(dmg * 0.85);
    }
    // Perk: Juggernaut reduces incoming damage
    if (typeof Perks !== 'undefined') {
      dmg = Math.round(dmg * Perks.getDamageTakenMult());
    }
    // Challenge mode: hardcore double damage
    if (typeof Progression !== 'undefined') {
      var chalMods = Progression.getChallengeModifiers();
      if (chalMods.enemyDmgMult) dmg = Math.round(dmg * chalMods.enemyDmgMult);
    }
    // Armor absorbs up to 50% of incoming damage, capped by available armor points
    if (player.armor > 0) {
      var absorbed = Math.min(player.armor, dmg * 0.5);
      player.armor = Math.max(0, player.armor - absorbed);
      dmg = dmg - absorbed;
      if (HUD.updateArmor) HUD.updateArmor(player.armor / 100);
    }
    player.lastDamageTime = 0; // reset health regen timer
    player.totalDamageTaken += dmg;
    player.waveDamageTaken += dmg;
    // Tag the attacker enemy: brief red outline so player can identify the shooter
    try {
      if (attackerPos && Enemies.getAll) {
        var _atkList = Enemies.getAll();
        var _bestE = null, _bestD = Infinity;
        for (var _ai = 0; _ai < _atkList.length; _ai++) {
          var _ae = _atkList[_ai];
          if (!_ae || !_ae.alive || !_ae.mesh) continue;
          var _adx = _ae.mesh.position.x - attackerPos.x;
          var _adz = _ae.mesh.position.z - attackerPos.z;
          var _ad = _adx * _adx + _adz * _adz;
          if (_ad < _bestD) { _bestD = _ad; _bestE = _ae; }
        }
        if (_bestE && _bestD < 9 && Enemies.tagAttacker) Enemies.tagAttacker(_bestE);
      }
    } catch (eAtk) {}
    MLSystem.onDamageTaken(dmg);
    var _hpBefore = player.hp;
    player.hp = Math.max(0, player.hp - dmg);
    HUD.setHealth(player.hp, player.maxHp);
    HUD.flashDamage();
    // Close-call slow-mo: hit drops HP from > 30% into critical (< 18%) in one shot
    var _critFrac = 0.18, _safeFrac = 0.30;
    if (player.maxHp > 0 && _hpBefore > player.maxHp * _safeFrac && player.hp > 0 && player.hp < player.maxHp * _critFrac) {
      try {
        if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.45, 0.4);
        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.12, 0.35);
        if (typeof AudioSystem !== 'undefined' && AudioSystem.playLowHealth) AudioSystem.playLowHealth();
      } catch (eCC) {}
    }
    // Damage-proportional camera shake — big hits punch the view
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake && dmg >= 5) {
      var _shakeAmt = Math.min(0.18, 0.02 + dmg * 0.0025);
      var _shakeDur = Math.min(0.45, 0.12 + dmg * 0.005);
      CameraSystem.shake(_shakeAmt, _shakeDur);
    }
    // ── Second Wind: trigger once per wave when HP first drops to <=20% ──
    if (player.hp > 0 && player.hp <= player.maxHp * 0.20 && !player._secondWindTriggered) {
      player._secondWindTriggered = true;
      if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.45, 1.2);
      if (HUD.showStreakBanner) HUD.showStreakBanner('⚡ SECOND WIND', 0);
      if (CameraSystem.shake) CameraSystem.shake(0.06, 0.4);
      if (typeof AudioSystem !== 'undefined' && AudioSystem.playReadyChime) AudioSystem.playReadyChime();
    }
    // Mobile haptic feedback — sharper for heavier damage
    if (isMobile && navigator.vibrate) {
      try { navigator.vibrate(Math.min(80, 20 + dmg * 0.8)); } catch (e) {}
    }
    // Blood drops — severity scales with damage as fraction of max HP
    if (HUD.showBloodDrops) HUD.showBloodDrops(Math.min(1, dmg / player.maxHp));
    // Low HP radio chatter
    if (player.hp > 0 && player.hp <= player.maxHp * 0.25) {
      if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('low_hp');
    }
    // Player-hit audio feedback
    if (typeof AudioSystem !== 'undefined' && AudioSystem.playHit) AudioSystem.playHit();
    // Screen shake on hit
    if (CameraSystem.shake) {
      CameraSystem.shake(dmg * 0.004, 0.2);
    }
    // Directional camera flinch: kick view away from attacker
    if (attackerPos && CameraSystem.flinch) {
      var fAngle = Math.atan2(attackerPos.x - player.position.x, attackerPos.z - player.position.z);
      var camYaw = CameraSystem.getYaw();
      var fRel = fAngle - camYaw;
      // Normalize to [-PI, PI]
      while (fRel > Math.PI) fRel -= Math.PI * 2;
      while (fRel < -Math.PI) fRel += Math.PI * 2;
      var fIntensity = Math.min(1, dmg / 50);
      // Kick view AWAY from attacker (opposite side)
      var fYaw = -Math.sin(fRel) * 0.04 * fIntensity;
      var fPitch = 0.025 * fIntensity; // slight upward kick
      CameraSystem.flinch(fYaw, fPitch);
    }

    // AI Smart Learning: track directional vulnerability
    if (attackerPos) {
      MLSystem.trackHitDirection(
        attackerPos.x, attackerPos.z,
        player.position.x, player.position.z,
        CameraSystem.getYaw()
      );
    }

    // Heavy hits cause bleeding (25% chance on hits > 15 dmg)
    if (dmg > 15 && Math.random() < 0.25 && !player.bleeding) {
      player.bleeding = true;
      player.bleedTimer = 6.0; // 6 seconds of bleed
      if (HUD.showBleed) HUD.showBleed(true);
      HUD.notifyPickup('🩸 BLEEDING! Press X to bandage', '#ff2222');
    }

    // Hit direction indicator
    if (attackerPos && HUD.showHitDirection) {
      var dx = attackerPos.x - player.position.x;
      var dz = attackerPos.z - player.position.z;
      var worldAngle = Math.atan2(dx, dz);
      var relAngle = CameraSystem.getYaw() - worldAngle + Math.PI;
      if (HUD.showHitDirectionScaled) HUD.showHitDirectionScaled(relAngle, dmg);
      else HUD.showHitDirection(relAngle);
    }

    if (player.hp <= 0) {
      // ── B24: Last Stand — once per life, survive fatal hit ──
      if (!player._usedLastStand && player.level >= 5) {
        player._usedLastStand = true;
        player.hp = 1;
        player.shieldTimer = 2.0; // 2 sec invulnerability
        HUD.setHealth(player.hp, player.maxHp);
        if (HUD.showStreakBanner) HUD.showStreakBanner('💀 LAST STAND!', 0);
        if (HUD.showDamageFlash) HUD.showDamageFlash('#ffff00');
        if (CameraSystem.shake) CameraSystem.shake(0.08, 0.5);
        return;
      }
      gameState = STATE.DEAD;
      if (_waveStartTimer) { clearTimeout(_waveStartTimer); _waveStartTimer = null; }
      if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
      // Streak-end banner: show what was ended
      if (player.killStreak >= 5 && HUD.showStreakBanner) {
        HUD.showStreakBanner('STREAK ENDED — ' + player.killStreak + ' KILLS', 0);
      }
      // Force exit vehicle / release drone on death
      if (VehicleSystem.isInVehicle()) VehicleSystem.exit();
      hideTankHUD();
      hideDroneControlsHUD();
      if (DroneSystem.isPossessing()) DroneSystem.release();
      if (window.AudioSystem.stopMusic) window.AudioSystem.stopMusic();
      if (window.AudioSystem.stopAmbientLoop) window.AudioSystem.stopAmbientLoop();
      Weapons.exitZoom();
      MLSystem.onDeath();
      // Track death in progression
      if (typeof Progression !== 'undefined') {
        Progression.trackStat('deathCount', 1);
        Progression.trackStat('totalDamageTaken', player.totalDamageTaken);
        var rank = Progression.submitScore('Player', player.score, currentWave, STAGES[currentStage].id, player.kills);
        var deadLB = document.getElementById('dead-leaderboard');
        if (deadLB) {
          deadLB.textContent = '🏆 Leaderboard Rank: #' + rank;
        }
        Progression.save();
      }
      // Reset perk streak on death
      if (typeof Perks !== 'undefined') Perks.resetStreak();
      // AI Smart Learning: classify combat style on death and track death context
      MLSystem.classifyCombatStyle();
      if (attackerPos) {
        var deathDist = player.position.distanceTo(attackerPos);
        var deathType = deathDist < 5 ? 'rush' : (deathDist > 25 ? 'sniper' : 'flank');
        var deathAngle = Math.atan2(attackerPos.x - player.position.x, attackerPos.z - player.position.z);
        MLSystem.trackDeathContext(deathType, deathAngle);
      }
      // Defeat banner: custom reason (capital fell) or the default
      var _dtEl = document.getElementById('dead-title');
      if (_dtEl) _dtEl.textContent = _defeatReason || 'YOU DIED';
      _defeatReason = null;
      showOverlay('dead');

      var _ds = document.getElementById('dead-stage');   if (_ds) _ds.textContent = STAGES[currentStage].id;
      var _dsc = document.getElementById('dead-score');  if (_dsc) _dsc.textContent = player.score;
      var _dk = document.getElementById('dead-kills');   if (_dk) _dk.textContent = player.kills;
      var _dw = document.getElementById('dead-wave');    if (_dw) _dw.textContent = currentWave;

      // ── Gameplay Tip Overlay on Death ──
      var tips = [
        'Always keep moving to avoid enemy fire.',
        'Use cover to reduce incoming damage.',
        'Headshots deal extra damage to most enemies.',
        'Switch weapons for different enemy types.',
        'Use grenades to clear groups of enemies.',
        'Reload during downtime, not in combat.',
        'Watch your ammo and reload before empty.',
        'Use perks to boost your survivability.',
        'Try different weapons to find your favorite.',
        'Use the minimap to track enemy positions.',
        'Bandage when bleeding to stop health loss.',
        'Vehicles provide speed and protection.',
        'Drones can scout and attack from above.',
        'Upgrade your skills for new abilities.',
        'Use build mode to create defensive structures.',
        'Night vision helps in dark stages.',
        'Switch to armor-piercing ammo for tough enemies.',
        'Use stealth to avoid detection.',
        'Ping locations for your squad.',
        'Check the shop for upgrades between waves.'
      ];
      var tip = tips[Math.floor(Math.random() * tips.length)];
      var tipEl = document.getElementById('dead-tip');
      if (!tipEl) {
        tipEl = document.createElement('div');
        tipEl.id = 'dead-tip';
        tipEl.style.cssText = 'margin-top:18px;font-size:15px;color:#44ff88;text-align:center;line-height:1.5;max-width:420px;margin-left:auto;margin-right:auto;';
        var overlay = document.getElementById('overlay-dead');
        if (overlay) overlay.appendChild(tipEl);
      }
      tipEl.textContent = '💡 TIP: ' + tip;

      // ── Death Screen: Letter Grade + Personal Best ──
      var gradeScore = 0;
      gradeScore += Math.min(player.kills * 2, 40); // kills: max 40 pts
      var acc = player.totalShots > 0 ? (player.totalHits / player.totalShots) : 0;
      gradeScore += Math.min(Math.round(acc * 30), 30); // accuracy: max 30 pts
      gradeScore += Math.min(currentWave * 3, 30); // wave survival: max 30 pts
      var grades = [{min:90,g:'S',c:'#ffd700'},{min:75,g:'A',c:'#44ff88'},{min:55,g:'B',c:'#4488ff'},{min:35,g:'C',c:'#ffaa44'},{min:0,g:'D',c:'#ff4444'}];
      var letterGrade = grades[grades.length - 1];
      for (var gi = 0; gi < grades.length; gi++) { if (gradeScore >= grades[gi].min) { letterGrade = grades[gi]; break; } }
      var gradeEl = document.getElementById('dead-grade');
      if (gradeEl) {
        gradeEl.textContent = letterGrade.g;
        gradeEl.style.color = letterGrade.c;
      }
      // Personal best tracking
      var pbEl = document.getElementById('dead-pb');
      if (pbEl) {
        try {
          var bestKills = parseInt(localStorage.getItem('ok_best_kills') || '0', 10);
          var bestWave  = parseInt(localStorage.getItem('ok_best_wave') || '0', 10);
          var bestScore = parseInt(localStorage.getItem('ok_best_score') || '0', 10);
          var pbLines = [];
          if (player.kills > bestKills) { localStorage.setItem('ok_best_kills', String(player.kills)); pbLines.push('\u2B06 NEW BEST KILLS: ' + player.kills + ' (prev ' + bestKills + ')'); }
          if (currentWave > bestWave)   { localStorage.setItem('ok_best_wave', String(currentWave)); pbLines.push('\u2B06 NEW BEST WAVE: ' + currentWave + ' (prev ' + bestWave + ')'); }
          if (player.score > bestScore) { localStorage.setItem('ok_best_score', String(player.score)); pbLines.push('\u2B06 NEW BEST SCORE: ' + player.score + ' (prev ' + bestScore + ')'); }
          if (pbLines.length === 0) pbLines.push('BEST: ' + bestKills + ' kills \u2022 wave ' + bestWave + ' \u2022 ' + bestScore + ' pts');
          pbEl.innerHTML = pbLines.join('<br>');
        } catch (e) { pbEl.textContent = ''; }
      }
      // Death statistics (Feature 43)
      if (HUD.showDeathStats) {
        var playTime = Math.floor((performance.now() - player.playStartTime) / 1000);
        var pm = Math.floor(playTime / 60);
        var ps = playTime % 60;
        HUD.showDeathStats({
          accuracy: player.totalShots > 0 ? Math.round((player.totalHits / player.totalShots) * 100) : 0,
          headshotPct: player.totalHits > 0 ? Math.round((player.totalHeadshots / player.totalHits) * 100) : 0,
          favWeapon: Weapons.getCurrentName(),
          playtime: pm + 'm ' + ps + 's',
          distance: Math.round(player.distanceWalked),
        });
      }
    }
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
  function notifyExplosiveKills(n) {
    if (player && n > 0) player.waveMaxExplosiveKill = Math.max(player.waveMaxExplosiveKill || 0, n);
  }
  function notifyNPCDeath(npc) {
    // Friendly fire casualty — show feedback and track morale
    if (HUD.notifyPickup) {
      HUD.notifyPickup('💀 FRIENDLY NPC KILLED: ' + (npc.rank || 'soldier').toUpperCase(), '#ff4444');
    }
    if (typeof Progression !== 'undefined' && Progression.trackStat) {
      Progression.trackStat('friendlyDeaths', 1);
    }
  }

  // ── init: override placeholder dependencies ──────────────────────
  function init(deps) {
    if (!deps) deps = {};
    if (deps.player) player = deps.player;
    if (deps.HUD) HUD = deps.HUD;
    if (deps.Enemies) Enemies = deps.Enemies;
    if (deps.Weapons) Weapons = deps.Weapons;
    if (deps.CameraSystem) CameraSystem = deps.CameraSystem;
    if (deps.AudioSystem) AudioSystem = deps.AudioSystem;
    if (deps.DroneSystem) DroneSystem = deps.DroneSystem;
    if (deps.VehicleSystem) VehicleSystem = deps.VehicleSystem;
    if (deps.Tracers) Tracers = deps.Tracers;
    if (deps.Feedback) Feedback = deps.Feedback;
    if (deps.MLSystem) MLSystem = deps.MLSystem;
    if (deps.MissionSystem) MissionSystem = deps.MissionSystem;
    if (deps.Perks) Perks = deps.Perks;
    if (deps.Progression) Progression = deps.Progression;
    if (deps.Economy) Economy = deps.Economy;
    if (deps.Marketplace) Marketplace = deps.Marketplace;
    if (deps.Pickups) Pickups = deps.Pickups;
    if (deps.NPCSystem) NPCSystem = deps.NPCSystem;
    if (deps.RankSystem) RankSystem = deps.RankSystem;
    if (deps.SkillSystem) SkillSystem = deps.SkillSystem;
    if (deps.CombatExtras) CombatExtras = deps.CombatExtras;
    if (deps.WeatherSystem) WeatherSystem = deps.WeatherSystem;
    if (deps.VoxelWorld) VoxelWorld = deps.VoxelWorld;
    if (deps._scene) _scene = deps._scene;
    if (deps._camera) _camera = deps._camera;
    if (deps.isMobile !== undefined) isMobile = deps.isMobile;
    if (deps.mouseDown !== undefined) mouseDown = deps.mouseDown;
    if (deps.touch) touch = deps.touch;
    if (deps.mouseNewPress !== undefined) mouseNewPress = deps.mouseNewPress;
    if (deps.gameState !== undefined) gameState = deps.gameState;
    if (deps.STATE) STATE = deps.STATE;
    if (deps.currentWave !== undefined) currentWave = deps.currentWave;
    if (deps.currentStage !== undefined) currentStage = deps.currentStage;
    if (deps.STAGES) STAGES = deps.STAGES;
    if (deps._waveStartTimer !== undefined) _waveStartTimer = deps._waveStartTimer;
    if (deps._defeatReason !== undefined) _defeatReason = deps._defeatReason;
    if (deps._baseFOV !== undefined) _baseFOV = deps._baseFOV;
    if (deps._targetFOV !== undefined) _targetFOV = deps._targetFOV;
    if (deps._lowEndVFX !== undefined) _lowEndVFX = deps._lowEndVFX;
    if (deps._rendererProfile !== undefined) _rendererProfile = deps._rendererProfile;
    if (deps._gmTmp1) _gmTmp1 = deps._gmTmp1;
    if (deps._gmTmp2) _gmTmp2 = deps._gmTmp2;
    if (deps._gmTmp3) _gmTmp3 = deps._gmTmp3;
    if (deps._gmNewPos) _gmNewPos = deps._gmNewPos;
    if (deps.spawnLootParticle) spawnLootParticle = deps.spawnLootParticle;
    if (deps.showOverlay) showOverlay = deps.showOverlay;
    if (deps.hideTankHUD) hideTankHUD = deps.hideTankHUD;
    if (deps.hideDroneControlsHUD) hideDroneControlsHUD = deps.hideDroneControlsHUD;
    if (deps.escapeHTML) escapeHTML = deps.escapeHTML;
  }

  // ── Public API ───────────────────────────────────────────────────
  return {
    init: init,
    update: updateCombat,
    onEnemyHit: onEnemyHit,
    onVehicleHit: onVehicleHit,
    onPlayerHit: onPlayerHit,
    throwGrenade: throwHandGrenade,
    updateGrenades: updateHandGrenades,
    clearGrenades: clearHandGrenades,
    getKillFovKick: function() { return _killFovKick; },
    getLastKillPos: function() { return _lastKillPos; }
  };
})();
