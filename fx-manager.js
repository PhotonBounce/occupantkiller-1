const FXManager = (function() {
  'use strict';

  /* ───────────────────────────────────────────────────────────────────────
     FX MANAGER — Standalone visual effects module
     Extracted from game-manager.js (loot particles, suppression, screen
     shake, flinch, slow-mo, blood, tracers, footstep puffs, threat glow)
     ─────────────────────────────────────────────────────────────────────── */

  /* ── Placeholder callbacks for GameManager dependencies ── */
  var _callbacks = {
    onLootCollect: function(value) {
      // Placeholder: wire to Economy.addCurrency + player.score += value
    },
    onLootLog: function(msg, color) {
      // Placeholder: wire to HUD.addCombatLog
    },
  };

  /* ── Private State ─────────────────────────────────────── */
  var _scene = null;
  var _lootParticles = [];
  var _lootGeo = null;
  var _lootMat = null;
  var _footstepPuffs = [];
  var _footstepPuffGeo = null;
  var _suppressionLevel = 0;
  var _suppressionDecay = 0.5;
  var _suppressionCanvas = null;
  var _threatEl = null;
  var _threatOpacity = 0;
  var _killFovKick = 0;
  var _lastKillPos = null;
  var _gmTmp1 = null;

  /* ── Constants ─────────────────────────────────────────── */
  const LOOT_CONFIG = {
    VALUE: 5,             // gold per loot particle collected
    COLLECT_RANGE: 2.5,   // distance to auto-collect
    LIFETIME: 15,         // seconds before despawn
    MAGNET_RANGE: 5,      // auto-attract within this range
  };

  /* ── Safe dependency wrappers ──────────────────────────── */
  function _safeShake(amt, dur) {
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(amt, dur);
    }
  }

  function _safeFlinch(yaw, pitch) {
    if (typeof CameraSystem !== 'undefined' && CameraSystem.flinch) {
      CameraSystem.flinch(yaw, pitch);
    }
  }

  function _safeSlowMo(rate, duration) {
    if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) {
      Feedback.triggerSlowMo(rate, duration);
    }
  }

  function _safeFlashDamage() {
    if (typeof HUD !== 'undefined' && HUD.flashDamage) HUD.flashDamage();
  }

  function _safeShowBloodDrops(severity) {
    if (typeof HUD !== 'undefined' && HUD.showBloodDrops) {
      HUD.showBloodDrops(severity);
    }
  }

  function _safeDamageFlash(color, duration) {
    if (typeof HUD !== 'undefined' && HUD.showDamageFlash) {
      HUD.showDamageFlash(color, duration);
    }
  }

  function _safeFlashHeal() {
    if (typeof HUD !== 'undefined' && HUD.flashHeal) HUD.flashHeal();
  }

  function _safePlayPickup() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playPickup === 'function') {
      window.AudioSystem.playPickup();
    }
  }

  function _safePlayHit() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playHit === 'function') {
      window.AudioSystem.playHit();
    }
  }

  function _safePlayExplosion() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playExplosion === 'function') {
      window.AudioSystem.playExplosion();
    }
  }

  function _safePlayLowHealth() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playLowHealth === 'function') {
      window.AudioSystem.playLowHealth();
    }
  }

  function _safePlayReadyChime() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playReadyChime === 'function') {
      window.AudioSystem.playReadyChime();
    }
  }

  function _safePlayCriticalHit() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playCriticalHit === 'function') {
      window.AudioSystem.playCriticalHit();
    }
  }

  function _safePlayHeadshotDing() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playHeadshotDing === 'function') {
      window.AudioSystem.playHeadshotDing();
    }
  }

  function _safePlayFirstBlood() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playFirstBlood === 'function') {
      window.AudioSystem.playFirstBlood();
    }
  }

  function _safePlayKillConfirm() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playKillConfirm === 'function') {
      window.AudioSystem.playKillConfirm();
    }
  }

  function _safePlayMultiKill(count) {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playMultiKill === 'function') {
      window.AudioSystem.playMultiKill(count);
    }
  }

  function _safePlayLevelUp() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playLevelUp === 'function') {
      window.AudioSystem.playLevelUp();
    }
  }

  function _safePlayBountyComplete() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playBountyComplete === 'function') {
      window.AudioSystem.playBountyComplete();
    }
  }

  function _safeRadioChatter(type) {
    if (typeof Feedback !== 'undefined' && Feedback.radioChatter) {
      Feedback.radioChatter(type);
    }
  }

  function _safeShowStreakBanner(text, data) {
    if (typeof HUD !== 'undefined' && HUD.showStreakBanner) {
      HUD.showStreakBanner(text, data);
    }
  }

  function _safeShowLowHP(isLow) {
    if (typeof HUD !== 'undefined' && HUD.showLowHP) {
      HUD.showLowHP(isLow);
    }
  }

  function _safeShowBleed(active) {
    if (typeof HUD !== 'undefined' && HUD.showBleed) {
      HUD.showBleed(active);
    }
  }

  function _safeUpdateArmor(val) {
    if (typeof HUD !== 'undefined' && HUD.updateArmor) {
      HUD.updateArmor(val);
    }
  }

  function _safeSetHealth(hp, maxHp) {
    if (typeof HUD !== 'undefined' && HUD.setHealth) {
      HUD.setHealth(hp, maxHp);
    }
  }

  function _safeSetScore(score) {
    if (typeof HUD !== 'undefined' && HUD.setScore) {
      HUD.setScore(score);
    }
  }

  function _safeNotifyPickup(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup(msg, color);
    }
  }

  function _safeAddCombatLog(msg, color) {
    if (typeof HUD !== 'undefined' && HUD.addCombatLog) {
      HUD.addCombatLog(msg, color);
    }
  }

  function _safeFlashHit(isHeadshot, isKill) {
    if (typeof HUD !== 'undefined' && HUD.flashHit) {
      HUD.flashHit(isHeadshot, isKill);
    }
  }

  function _safeShowHeadshot() {
    if (typeof HUD !== 'undefined' && HUD.showHeadshot) {
      HUD.showHeadshot();
    }
  }

  function _safeShowKillConfirm() {
    if (typeof Feedback !== 'undefined' && Feedback.showKillConfirm) {
      Feedback.showKillConfirm();
    }
  }

  function _safeShowXPGain(xp) {
    if (typeof Feedback !== 'undefined' && Feedback.showXPGain) {
      Feedback.showXPGain(xp);
    }
  }

  function _safeShowStreakMult(mult) {
    if (typeof Feedback !== 'undefined' && Feedback.showStreakMult) {
      Feedback.showStreakMult(mult);
    }
  }

  function _safeSpawnDamageNumber(x, y, dmg, isHeadshot, isKill) {
    if (typeof Feedback !== 'undefined' && Feedback.spawnDamageNumber) {
      Feedback.spawnDamageNumber(x, y, dmg, isHeadshot, isKill);
    }
  }

  function _safeAddKillFeedEntry(killer, victim, weapon, isHeadshot) {
    if (typeof Feedback !== 'undefined' && Feedback.addKillFeedEntry) {
      Feedback.addKillFeedEntry(killer, victim, weapon, isHeadshot);
    }
  }

  function _safeUnlockAchievement(id) {
    if (typeof Feedback !== 'undefined' && Feedback.unlockAchievement) {
      Feedback.unlockAchievement(id);
    }
  }

  function _safeTriggerHitStop(frames) {
    if (typeof Feedback !== 'undefined' && Feedback.triggerHitStop) {
      Feedback.triggerHitStop(frames);
    }
  }

  function _safeScreenShake(intensity) {
    if (typeof Feedback !== 'undefined' && Feedback.screenShake) {
      Feedback.screenShake(intensity);
    }
  }

  function _safeGetShakeOffset() {
    if (typeof Feedback !== 'undefined' && Feedback.getShakeOffset) {
      return Feedback.getShakeOffset();
    }
    return null;
  }

  function _safeUpdateHitStop(dt) {
    if (typeof Feedback !== 'undefined' && Feedback.updateHitStop) {
      Feedback.updateHitStop(dt);
    }
  }

  function _safeIsHitStopped() {
    if (typeof Feedback !== 'undefined' && Feedback.isHitStopped) {
      return Feedback.isHitStopped();
    }
    return false;
  }

  function _safeGetSlowMoRate() {
    if (typeof Feedback !== 'undefined' && Feedback.getSlowMoRate) {
      return Feedback.getSlowMoRate();
    }
    return 1;
  }

  function _safeUpdateFPS() {
    if (typeof HUD !== 'undefined' && HUD.updateFPS) {
      HUD.updateFPS();
    }
  }

  function _safePlayLandingThud(intensity) {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playLandingThud === 'function') {
      window.AudioSystem.playLandingThud(intensity);
    }
  }

  function _safePlayFootstep(blockType) {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playFootstep === 'function') {
      window.AudioSystem.playFootstep(blockType);
    }
  }

  function _safePlayGunshot(type) {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playGunshot === 'function') {
      window.AudioSystem.playGunshot(type);
    }
  }

  function _safePlayReload() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playReload === 'function') {
      window.AudioSystem.playReload();
    }
  }

  function _safePlayDistantBoom() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playDistantBoom === 'function') {
      window.AudioSystem.playDistantBoom();
    }
  }

  function _safePlayHeartbeat(intensity) {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playHeartbeat === 'function') {
      window.AudioSystem.playHeartbeat(intensity);
    }
  }

  function _safePlayGeigerTick() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playGeigerTick === 'function') {
      window.AudioSystem.playGeigerTick();
    }
  }

  function _safePlayFlashbang() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playFlashbang === 'function') {
      window.AudioSystem.playFlashbang();
    }
  }

  function _safePlaySmoke() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playSmoke === 'function') {
      window.AudioSystem.playSmoke();
    }
  }

  function _safePlayMine() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playMine === 'function') {
      window.AudioSystem.playMine();
    }
  }

  function _safePlayWaveStart() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playWaveStart === 'function') {
      window.AudioSystem.playWaveStart();
    }
  }

  function _safePlayDeath() {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playDeath === 'function') {
      window.AudioSystem.playDeath();
    }
  }

  function _safePlayHitPitched(hpFrac) {
    if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playHitPitched === 'function') {
      window.AudioSystem.playHitPitched(hpFrac);
    } else if (typeof window !== 'undefined' && window.AudioSystem && typeof window.AudioSystem.playHit === 'function') {
      window.AudioSystem.playHit();
    }
  }

  function _safeVibrate(pattern) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  /* ── Tracers passthroughs ──────────────────────────────── */
  function _safeTracerSpawn(method, args) {
    if (typeof Tracers !== 'undefined' && Tracers[method]) {
      Tracers[method].apply(Tracers, args);
    }
  }

  /* ── Terrain helper ────────────────────────────────────── */
  function _getTerrainHeight(x, z) {
    if (typeof window !== 'undefined' && window.VoxelWorld && typeof window.VoxelWorld.getTerrainHeight === 'function') {
      return window.VoxelWorld.getTerrainHeight(x, z);
    }
    return 0;
  }

  /* ── Loot Particle System (Sonic-style gold rings) ─────── */
  function spawnLoot(worldPos, count) {
    if (!_scene) return;
    for (var i = 0; i < (count || 1); i++) {
      var mesh = new THREE.Mesh(_lootGeo, _lootMat.clone());
      mesh.position.set(
        worldPos.x + (Math.random() - 0.5) * 1.5,
        worldPos.y + 0.5 + Math.random() * 1.0,
        worldPos.z + (Math.random() - 0.5) * 1.5
      );
      mesh.userData.vy = 3 + Math.random() * 2;
      mesh.userData.age = 0;
      mesh.userData.baseY = worldPos.y;
      if (_scene) _scene.add(mesh);
      else console.warn('Skipped mesh add: _scene is null');
      _lootParticles.push(mesh);
    }
  }

  function updateParticles(delta, playerPos) {
    for (var i = _lootParticles.length - 1; i >= 0; i--) {
      var lp = _lootParticles[i];
      lp.userData.age += delta;
      // Gravity + bounce
      lp.userData.vy -= 12 * delta;
      lp.position.y += lp.userData.vy * delta;
      var groundH = _getTerrainHeight(lp.position.x, lp.position.z) + 0.15;
      if (lp.position.y < groundH) {
        lp.position.y = groundH;
        lp.userData.vy = Math.abs(lp.userData.vy) * 0.4;
        if (Math.abs(lp.userData.vy) < 0.5) lp.userData.vy = 0;
      }
      // Spin
      lp.rotation.y += delta * 5;
      // Magnet toward player
      if (playerPos) {
        var dist = lp.position.distanceTo(playerPos);
        if (dist < LOOT_CONFIG.MAGNET_RANGE) {
          var pullDir = _gmTmp1.copy(playerPos).sub(lp.position).normalize();
          var pullSpeed = (1 - dist / LOOT_CONFIG.MAGNET_RANGE) * 12;
          lp.position.addScaledVector(pullDir, pullSpeed * delta);
        }
        // Collect
        if (dist < LOOT_CONFIG.COLLECT_RANGE) {
          if (typeof _callbacks.onLootCollect === 'function') {
            _callbacks.onLootCollect(LOOT_CONFIG.VALUE);
          }
          if (typeof _callbacks.onLootLog === 'function') {
            _callbacks.onLootLog('+' + LOOT_CONFIG.VALUE + ' gold (loot)', '#ffd700');
          }
          if (_scene) _scene.remove(lp);
          if (lp.geometry) lp.geometry.dispose();
          if (lp.material) lp.material.dispose();
          _lootParticles.splice(i, 1);
          _safePlayPickup();
          continue;
        }
      }
      // Blink before despawning (last 3 seconds)
      if (lp.userData.age > LOOT_CONFIG.LIFETIME - 3) {
        lp.visible = Math.floor(lp.userData.age * 6) % 2 === 0;
      }
      // Despawn after lifetime
      if (lp.userData.age > LOOT_CONFIG.LIFETIME) {
        if (_scene) _scene.remove(lp);
        if (lp.geometry) lp.geometry.dispose();
        if (lp.material) lp.material.dispose();
        _lootParticles.splice(i, 1);
      }
    }
  }

  /* ── Footstep Dust Puffs (visible when sprinting) ──────── */
  function spawnFootstepPuff(playerPos) {
    if (!_scene || !playerPos) return;
    if (!_footstepPuffGeo) _footstepPuffGeo = new THREE.PlaneGeometry(0.5, 0.5);
    var groundY = _getTerrainHeight(playerPos.x, playerPos.z);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xb0a080, transparent: true, opacity: 0.45,
      depthWrite: false,
    });
    var puff = new THREE.Mesh(_footstepPuffGeo, mat);
    puff.rotation.x = -Math.PI / 2;
    puff.position.set(
      playerPos.x + (Math.random() - 0.5) * 0.2,
      groundY + 0.04,
      playerPos.z + (Math.random() - 0.5) * 0.2
    );
    var s = 0.4 + Math.random() * 0.2;
    puff.scale.set(s, s, 1);
    _scene.add(puff);
    _footstepPuffs.push({ mesh: puff, material: mat, life: 0.5, maxLife: 0.5 });
    // Cap puff count for perf
    if (_footstepPuffs.length > 24) {
      var oldP = _footstepPuffs.shift();
      if (oldP.mesh && _scene) _scene.remove(oldP.mesh);
      if (oldP.material && oldP.material.dispose) oldP.material.dispose();
    }
  }

  function updateFootstepPuffs(delta) {
    for (var pi = _footstepPuffs.length - 1; pi >= 0; pi--) {
      var p = _footstepPuffs[pi];
      p.life -= delta;
      if (p.material) p.material.opacity = Math.max(0, (p.life / p.maxLife) * 0.45);
      // Expand outward as it rises slightly
      p.mesh.scale.x += delta * 0.6;
      p.mesh.scale.y += delta * 0.6;
      p.mesh.position.y += delta * 0.15;
      if (p.life <= 0) {
        if (_scene) _scene.remove(p.mesh);
        if (p.material && p.material.dispose) p.material.dispose();
        _footstepPuffs.splice(pi, 1);
      }
    }
  }

  /* ── Suppression System (near-miss visual response) ───── */
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
    if (_suppressionLevel > 0.2) {
      _safeShake(_suppressionLevel * 0.008, 0.05);
    }
  }

  /* ── Threat-behind warning glow ───────────────────────── */
  function updateThreatBehind(playerPos, enemies, camera) {
    if (!_threatEl) _threatEl = document.getElementById('threat-behind');
    if (!_threatEl) return;
    if (!playerPos || !camera || !enemies) return;
    var threatNear = false;
    var fwd = camera.getWorldDirection(new THREE.Vector3());
    for (var ii = 0; ii < enemies.length; ii++) {
      var ee = enemies[ii];
      if (!ee || !ee.alive || !ee.mesh) continue;
      var dx = ee.mesh.position.x - playerPos.x;
      var dz = ee.mesh.position.z - playerPos.z;
      var d2 = dx * dx + dz * dz;
      if (d2 > 49) continue; // >7m away
      var len = Math.sqrt(d2) || 1;
      var dot = (fwd.x * dx + fwd.z * dz) / len;
      if (dot < -0.25) { threatNear = true; break; }
    }
    var target = threatNear ? 1 : 0;
    _threatOpacity += (target - _threatOpacity) * Math.min(1, 6 * 0.016);
    if (_threatOpacity < 0.02 && target === 0) {
      if (_threatEl.style.display !== 'none') _threatEl.style.display = 'none';
      return;
    }
    if (_threatEl.style.display === 'none') _threatEl.style.display = 'block';
    _threatEl.style.opacity = _threatOpacity.toFixed(2);
  }

  /* ── Screen Effects ──────────────────────────────────── */
  function triggerScreenShake(amount, duration) {
    _safeShake(amount, duration);
  }

  function triggerFlinch(attackerPos, playerPos, camYaw, dmg) {
    if (!attackerPos || !playerPos || typeof camYaw !== 'number') return;
    var fAngle = Math.atan2(attackerPos.x - playerPos.x, attackerPos.z - playerPos.z);
    var fRel = fAngle - camYaw;
    while (fRel > Math.PI) fRel -= Math.PI * 2;
    while (fRel < -Math.PI) fRel += Math.PI * 2;
    var fIntensity = Math.min(1, (dmg || 10) / 50);
    // Kick view AWAY from attacker (opposite side)
    var fYaw = -Math.sin(fRel) * 0.04 * fIntensity;
    var fPitch = 0.025 * fIntensity; // slight upward kick
    _safeFlinch(fYaw, fPitch);
  }

  function triggerSlowMo(rate, duration) {
    _safeSlowMo(rate, duration);
  }

  function flashDamage() {
    _safeFlashDamage();
  }

  function showBloodDrops(severity) {
    _safeShowBloodDrops(severity);
  }

  /* ── Tracer / Particle Delegates ───────────────────────── */
  function triggerExplosion(position, scale) {
    _safeTracerSpawn('spawnExplosion', [position, scale]);
  }

  function spawnTracer(startPos, direction, color, length) {
    _safeTracerSpawn('spawnTracer', [startPos, direction, color, length]);
  }

  function spawnBullet(startPos, direction, color, speed) {
    _safeTracerSpawn('spawnBullet', [startPos, direction, color, speed]);
  }

  function spawnMuzzleFlash(pos, dir) {
    _safeTracerSpawn('spawnMuzzleFlash', [pos, dir]);
  }

  function spawnBlood(pos, dir) {
    _safeTracerSpawn('spawnBlood', [pos, dir]);
  }

  function spawnPickupBurst(pos, color) {
    _safeTracerSpawn('spawnPickupBurst', [pos, color]);
  }

  function spawnSparks(pos) {
    _safeTracerSpawn('spawnSparks', [pos]);
  }

  function spawnSmoke(pos) {
    _safeTracerSpawn('spawnSmoke', [pos]);
  }

  function spawnImpactSpark(pos) {
    _safeTracerSpawn('spawnImpactSpark', [pos]);
  }

  function spawnBlockImpact(pos, color) {
    _safeTracerSpawn('spawnBlockImpact', [pos, color]);
  }

  /* ── FOV Kick State ───────────────────────────────────── */
  function getKillFovKick() { return _killFovKick; }
  function setKillFovKick(value) { _killFovKick = value; }
  function addKillFovKick(value) { _killFovKick = Math.max(_killFovKick, value); }
  function decayKillFovKick(delta) {
    if (_killFovKick > 0) _killFovKick = Math.max(0, _killFovKick - delta * 8);
  }

  /* ── Last Kill Position (for kill-cam & confetti) ────── */
  function setLastKillPos(pos) {
    _lastKillPos = pos ? pos.clone() : null;
  }
  function getLastKillPos() {
    return _lastKillPos;
  }

  /* ── Feedback passthroughs (for main-loop integration) ───── */
  function updateHitStop(delta) {
    _safeUpdateHitStop(delta);
  }

  function isHitStopped() {
    return _safeIsHitStopped();
  }

  function getSlowMoRate() {
    return _safeGetSlowMoRate();
  }

  function getShakeOffset() {
    return _safeGetShakeOffset();
  }

  function screenShake(intensity) {
    _safeScreenShake(intensity);
  }

  function triggerHitStop(frames) {
    _safeTriggerHitStop(frames);
  }

  /* ── Init / Clear ──────────────────────────────────────── */
  function init(scene) {
    _scene = scene || null;
    _gmTmp1 = new THREE.Vector3();
    _lootGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    _lootMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xaa8800 });
    _footstepPuffGeo = new THREE.PlaneGeometry(0.5, 0.5);
  }

  function clear() {
    // Loot particles
    for (var i = _lootParticles.length - 1; i >= 0; i--) {
      var lp = _lootParticles[i];
      if (_scene) _scene.remove(lp);
      if (lp.geometry) lp.geometry.dispose();
      if (lp.material) lp.material.dispose();
    }
    _lootParticles.length = 0;

    // Footstep puffs
    for (var j = _footstepPuffs.length - 1; j >= 0; j--) {
      var fp = _footstepPuffs[j];
      if (_scene) _scene.remove(fp.mesh);
      if (fp.material) fp.material.dispose();
    }
    _footstepPuffs.length = 0;

    // Suppression
    _suppressionLevel = 0;
    if (_suppressionCanvas) {
      try { _suppressionCanvas.style.filter = ''; } catch (e) {}
    }

    // Threat
    _threatOpacity = 0;
    if (_threatEl) {
      try { _threatEl.style.display = 'none'; } catch (e) {}
    }

    _killFovKick = 0;
    _lastKillPos = null;
  }

  /* ── Callback wiring ───────────────────────────────────── */
  function setCallbacks(cbs) {
    if (!cbs) return;
    for (var key in cbs) {
      if (_callbacks.hasOwnProperty(key) && typeof cbs[key] === 'function') {
        _callbacks[key] = cbs[key];
      }
    }
  }

  /* ── Public API ────────────────────────────────────────── */
  return {
    LOOT_CONFIG,
    init,
    clear,
    setCallbacks,

    // Core particle systems
    spawnLoot,
    updateParticles,
    spawnFootstepPuff,
    updateFootstepPuffs,

    // Suppression
    addSuppression,
    updateSuppression,

    // Threat indicator
    updateThreatBehind,

    // Screen effects
    triggerScreenShake,
    triggerFlinch,
    triggerSlowMo,
    flashDamage,
    showBloodDrops,

    // Tracer / particle delegates
    triggerExplosion,
    spawnTracer,
    spawnBullet,
    spawnMuzzleFlash,
    spawnBlood,
    spawnPickupBurst,
    spawnSparks,
    spawnSmoke,
    spawnImpactSpark,
    spawnBlockImpact,

    // FOV / kill cam
    getKillFovKick,
    setKillFovKick,
    addKillFovKick,
    decayKillFovKick,
    setLastKillPos,
    getLastKillPos,

    // Feedback passthroughs
    updateHitStop,
    isHitStopped,
    getSlowMoRate,
    getShakeOffset,
    screenShake,
    triggerHitStop,

    // Safe HUD wrappers (convenience for migration)
    safeNotifyPickup: _safeNotifyPickup,
    safeAddCombatLog: _safeAddCombatLog,
    safeShowStreakBanner: _safeShowStreakBanner,
    safeFlashHit: _safeFlashHit,
    safeShowHeadshot: _safeShowHeadshot,
    safeShowKillConfirm: _safeShowKillConfirm,
    safeShowXPGain: _safeShowXPGain,
    safeShowStreakMult: _safeShowStreakMult,
    safeSpawnDamageNumber: _safeSpawnDamageNumber,
    safeAddKillFeedEntry: _safeAddKillFeedEntry,
    safeUnlockAchievement: _safeUnlockAchievement,
    safeDamageFlash: _safeDamageFlash,
    safeFlashHeal: _safeFlashHeal,
    safeShowLowHP: _safeShowLowHP,
    safeShowBleed: _safeShowBleed,
    safeUpdateArmor: _safeUpdateArmor,
    safeSetHealth: _safeSetHealth,
    safeSetScore: _safeSetScore,

    // Safe Audio wrappers (convenience for migration)
    safePlayPickup: _safePlayPickup,
    safePlayHit: _safePlayHit,
    safePlayExplosion: _safePlayExplosion,
    safePlayLowHealth: _safePlayLowHealth,
    safePlayReadyChime: _safePlayReadyChime,
    safePlayCriticalHit: _safePlayCriticalHit,
    safePlayHeadshotDing: _safePlayHeadshotDing,
    safePlayFirstBlood: _safePlayFirstBlood,
    safePlayKillConfirm: _safePlayKillConfirm,
    safePlayMultiKill: _safePlayMultiKill,
    safePlayLevelUp: _safePlayLevelUp,
    safePlayBountyComplete: _safePlayBountyComplete,
    safeRadioChatter: _safeRadioChatter,
    safePlayLandingThud: _safePlayLandingThud,
    safePlayFootstep: _safePlayFootstep,
    safePlayGunshot: _safePlayGunshot,
    safePlayReload: _safePlayReload,
    safePlayDistantBoom: _safePlayDistantBoom,
    safePlayHeartbeat: _safePlayHeartbeat,
    safePlayGeigerTick: _safePlayGeigerTick,
    safePlayFlashbang: _safePlayFlashbang,
    safePlaySmoke: _safePlaySmoke,
    safePlayMine: _safePlayMine,
    safePlayWaveStart: _safePlayWaveStart,
    safePlayDeath: _safePlayDeath,
    safePlayHitPitched: _safePlayHitPitched,
    safeVibrate: _safeVibrate,
    safeUpdateFPS: _safeUpdateFPS,
  };
})();

// Global export for browser integration
if (typeof window !== 'undefined') {
  window.FXManager = FXManager;
}
if (typeof globalThis !== 'undefined') {
  globalThis.FXManager = FXManager;
}
