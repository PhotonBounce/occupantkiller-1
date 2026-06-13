/* ============================================================
 *  MISSION-TYPES.JS — 6 new mission type features
 *  Features: escort, demolition, capture zone, assassination,
 *  rescue, defuse
 * ============================================================ */
const MissionTypes = (function () {
  'use strict';

  /* ── Mission Type Definitions ──────────────── */
  const TYPES = {
    // Feature 40: Escort Mission
    ESCORT: {
      id: 'ESCORT', name: 'Escort VIP', icon: '🛡️', tier: 2,
      desc: 'Protect the VIP as they move to the extraction point.',
      objectives: [
        { type: 'protect_npc', label: 'Keep VIP alive' },
        { type: 'reach_zone', label: 'Reach extraction zone' }
      ],
      vipHP: 100, vipSpeed: 2.5,
      timeLimit: 180, // 3 minutes
      rewardOKC: 150, rewardXP: 200,
      failOnVIPDeath: true
    },
    // Feature 41: Demolition Mission
    DEMOLITION: {
      id: 'DEMOLITION', name: 'Demolition', icon: '💣', tier: 2,
      desc: 'Plant explosives on the target structure and escape.',
      objectives: [
        { type: 'reach_target', label: 'Reach target building' },
        { type: 'plant_charge', label: 'Plant explosive (5s)' },
        { type: 'escape_radius', label: 'Clear blast radius' }
      ],
      plantTime: 5, blastRadius: 15, blastDamage: 500,
      timeLimit: 120,
      rewardOKC: 200, rewardXP: 250
    },
    // Feature 42: Capture Zone
    CAPTURE_ZONE: {
      id: 'CAPTURE_ZONE', name: 'Capture Zone', icon: '🚩', tier: 1,
      desc: 'Hold the designated area for 60 seconds.',
      objectives: [
        { type: 'enter_zone', label: 'Enter capture zone' },
        { type: 'hold_zone', label: 'Hold zone for 60s' }
      ],
      holdTime: 60, zoneRadius: 8,
      contestPause: true, // timer pauses if enemies in zone
      timeLimit: 180,
      rewardOKC: 120, rewardXP: 150
    },
    // Feature 43: Assassination
    ASSASSINATION: {
      id: 'ASSASSINATION', name: 'Assassination', icon: '🎯', tier: 3,
      desc: 'Eliminate the high-value target before they escape.',
      objectives: [
        { type: 'locate_hvt', label: 'Locate the HVT' },
        { type: 'kill_hvt', label: 'Eliminate the HVT' }
      ],
      hvtHP: 250, hvtSpeed: 4, hvtEscapeTime: 120,
      bodyguardCount: 6,
      timeLimit: 150,
      rewardOKC: 300, rewardXP: 400
    },
    // Feature 44: Rescue
    RESCUE: {
      id: 'RESCUE', name: 'Rescue POWs', icon: '🔓', tier: 2,
      desc: 'Free the prisoners and escort them to safety.',
      objectives: [
        { type: 'reach_prison', label: 'Reach the prison' },
        { type: 'free_pows', label: 'Free prisoners (3s each)' },
        { type: 'escort_out', label: 'Escort to safe zone' }
      ],
      powCount: 3, freeTime: 3, powHP: 50, powSpeed: 2,
      timeLimit: 240,
      rewardOKC: 180, rewardXP: 220
    },
    // Feature 45: Defuse
    DEFUSE: {
      id: 'DEFUSE', name: 'Bomb Defusal', icon: '⏱️', tier: 3,
      desc: 'Find and defuse bombs before they detonate.',
      objectives: [
        { type: 'locate_bombs', label: 'Locate bombs (0/3)' },
        { type: 'defuse_all', label: 'Defuse all bombs' }
      ],
      bombCount: 3, defuseTime: 7,
      detonationTimer: 120, // bombs explode after 2 min
      blastDamage: 300, blastRadius: 10,
      timeLimit: 150,
      rewardOKC: 250, rewardXP: 350
    },
    // Feature 46: Assault Russian Dugouts (Ukrainian-led grenade assault)
    ASSAULT_DUGOUTS: {
      id: 'ASSAULT_DUGOUTS', name: 'Clear Russian Dugouts', icon: '💥', tier: 3,
      desc: 'Lead Ukrainian squad to clear Russian Federation dugouts, holes, and trenches with grenades.',
      objectives: [
        { type: 'reach_first_dugout', label: 'Reach first Russian position' },
        { type: 'clear_dugouts', label: 'Clear all dugouts (0/4)' },
        { type: 'hold_position', label: 'Hold for 30s after clear' }
      ],
      dugoutCount: 4, ukrSquadSize: 5, holdTime: 30,
      rusGarrisonPerHole: 4, grenadeBonus: 8,
      timeLimit: 360, // 6 minutes
      rewardOKC: 350, rewardXP: 500
    }
  };

  /* ── Active Mission State ──────────────────── */
  let activeMission = null;
  let missionProgress = {};

  function startMission(typeId, zoneX, zoneZ) {
    const type = TYPES[typeId];
    if (!type) return false;
    activeMission = {
      type: typeId,
      config: type,
      startTime: Date.now(),
      zoneX: zoneX || 0,
      zoneZ: zoneZ || 0,
      state: 'ACTIVE',
      objectiveIndex: 0,
      timers: {},
      data: {}
    };
    // Initialize type-specific data
    switch (typeId) {
      case 'ESCORT':
        missionProgress = { vipHP: type.vipHP, vipReached: false };
        break;
      case 'DEMOLITION':
        missionProgress = { planted: false, plantProgress: 0, escaped: false };
        break;
      case 'CAPTURE_ZONE':
        missionProgress = { holdTimer: 0, inZone: false };
        break;
      case 'ASSASSINATION':
        missionProgress = { hvtLocated: false, hvtDead: false, hvtHP: type.hvtHP, hvtEnemyId: null };
        try {
          if (typeof window !== 'undefined' && window.Enemies && window.Enemies.spawnSingle) {
            var _hvtY = (window.VoxelWorld && window.VoxelWorld.getTerrainHeight)
              ? window.VoxelWorld.getTerrainHeight(activeMission.zoneX, activeMission.zoneZ) : 0;
            var _hvt = window.Enemies.spawnSingle('OFFICER',
              { x: activeMission.zoneX, y: _hvtY + 1, z: activeMission.zoneZ });
            if (_hvt) {
              _hvt.hp = type.hvtHP; _hvt.maxHp = type.hvtHP;
              missionProgress.hvtEnemyId = _hvt.id;
            }
            var _bgCount = type.bodyguardCount || 4;
            for (var _bg = 0; _bg < _bgCount; _bg++) {
              var _bga = (_bg / _bgCount) * Math.PI * 2;
              var _bgx = activeMission.zoneX + Math.cos(_bga) * (5 + Math.random() * 3);
              var _bgz = activeMission.zoneZ + Math.sin(_bga) * (5 + Math.random() * 3);
              var _bgy = (window.VoxelWorld && window.VoxelWorld.getTerrainHeight)
                ? window.VoxelWorld.getTerrainHeight(_bgx, _bgz) : 0;
              window.Enemies.spawnSingle('STORMER', { x: _bgx, y: _bgy + 1, z: _bgz },
                { guardPost: { x: activeMission.zoneX, y: _hvtY, z: activeMission.zoneZ }, guardRadius: 10 });
            }
            if (window.HUD && window.HUD.showToast) {
              window.HUD.showToast('🎯 HVT LOCATED — Eliminate the Russian Officer and bodyguards.', 5000, '#ff4444');
            }
          }
        } catch (_eHVT) {}
        break;
      case 'RESCUE': {
        // Place powCount POW positions in an arc around the zone — guards spawn at each
        var _pows = [];
        var _powCount = type.powCount || 3;
        for (var _pi = 0; _pi < _powCount; _pi++) {
          var _pa = (_pi / _powCount) * Math.PI * 2;
          var _px = (activeMission.zoneX || 0) + Math.cos(_pa) * 7;
          var _pz = (activeMission.zoneZ || 0) + Math.sin(_pa) * 7;
          _pows.push({ x: _px, z: _pz, freed: false, freeProgress: 0 });
          // Spawn 1-2 guards at each POW site
          if (typeof window !== 'undefined' && window.Enemies && window.Enemies.spawnSingle) {
            try {
              var _gy = (window.VoxelWorld && window.VoxelWorld.getTerrainHeight)
                ? window.VoxelWorld.getTerrainHeight(_px, _pz) : 0;
              window.Enemies.spawnSingle('STORMER', { x: _px + 2, z: _pz + 2 }, {
                guardPost: { x: _px, y: _gy, z: _pz }, guardRadius: 6
              });
            } catch (_eg) {}
          }
        }
        missionProgress = { freed: 0, freeing: false, freeProgress: 0, pows: _pows, activePow: -1 };
        if (typeof window !== 'undefined' && window.HUD && window.HUD.showToast) {
          window.HUD.showToast('🔓 RESCUE: Approach each POW and hold [F] to free them.', 5000, '#88ff88');
        }
        break;
      }
      case 'DEFUSE': {
        // Place bombCount bombs at distinct positions around the zone
        var _bombs = [];
        var _bombCount = type.bombCount || 3;
        for (var _bi = 0; _bi < _bombCount; _bi++) {
          var _ba = (_bi / _bombCount) * Math.PI * 2 + 0.3;
          _bombs.push({
            x: (activeMission.zoneX || 0) + Math.cos(_ba) * 8,
            z: (activeMission.zoneZ || 0) + Math.sin(_ba) * 8,
            defused: false, defuseProgress: 0
          });
        }
        missionProgress = { located: 0, defused: 0, defusing: false, detonationTimer: type.detonationTimer, bombs: _bombs, activeBomb: -1 };
        if (typeof window !== 'undefined' && window.HUD && window.HUD.showToast) {
          window.HUD.showToast('⏱️ DEFUSE: Locate 3 bombs and hold [F] to defuse each. ' + type.detonationTimer + 's until detonation!', 6000, '#ffcc00');
        }
        break;
      }
      case 'ASSAULT_DUGOUTS':
        missionProgress = {
          dugoutsCleared: 0, reachedFirst: false, holdTimer: 0,
          dugoutPositions: [], rusKilledTotal: 0,
          ukrSquad: [], grenadesUsed: 0
        };
        // Spawn N dugouts in an arc around the zone, place RU defenders inside each.
        try {
          var dCount = type.dugoutCount || 4;
          var baseX = activeMission.zoneX;
          var baseZ = activeMission.zoneZ;
          for (var di = 0; di < dCount; di++) {
            var ang = (di / dCount) * Math.PI * 1.4 - Math.PI * 0.7;
            var dist = 14 + di * 4;
            var dx = baseX + Math.cos(ang) * dist;
            var dz = baseZ + Math.sin(ang) * dist;
            var dy = (typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.getTopSolidY)
              ? window.VoxelWorld.getTopSolidY(dx, dz)
              : ((window.VoxelWorld && window.VoxelWorld.getTerrainHeight) ? window.VoxelWorld.getTerrainHeight(dx, dz) + 1 : 0);
            // Carve voxel dugout
            if (typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.placeDugout) {
              try { window.VoxelWorld.placeDugout(dx, dy, dz, 5); } catch (e) {}
            }
            missionProgress.dugoutPositions.push({ x: dx, y: dy, z: dz, cleared: false });
            // Garrison: spawn RU enemies in/around this dugout with proper guard/patrol roles
            if (typeof window !== 'undefined' && window.Enemies && window.Enemies.spawnSingle) {
              var garrison = type.rusGarrisonPerHole || 3;
              for (var gi = 0; gi < garrison; gi++) {
                // Tight cluster — defenders inside the dugout, not wandering
                var ang2 = (gi / garrison) * Math.PI * 2;
                var rad2 = 0.6 + Math.random() * 0.8;
                var ox = dx + Math.cos(ang2) * rad2;
                var oz = dz + Math.sin(ang2) * rad2;
                // First defender = sentry at center; others split GUARD/PATROL
                var role = (gi === 0) ? 'SENTRY' : ((gi % 2 === 0) ? 'GUARD' : 'PATROL');
                var unitType = (gi === 0) ? 'STORMER' : 'CONSCRIPT';
                try {
                  window.Enemies.spawnSingle(unitType, { x: ox, z: oz }, {
                    guardPost: { x: dx, y: dy, z: dz },
                    guardRadius: 5,
                    garrisonRole: role
                  });
                } catch (e) {}
              }
            }
          }
          // Notify HUD
          if (typeof window !== 'undefined' && window.HUD && window.HUD.notifyPickup) {
            window.HUD.notifyPickup('CLEAR ' + dCount + ' RUSSIAN DUGOUTS', '#ff8844');
          }
        } catch (eD) { /* swallow */ }
        break;
    }
    return true;
  }

  function update(dt, playerPos) {
    if (!activeMission || activeMission.state !== 'ACTIVE') return null;
    if (!playerPos) return null;
    const m = activeMission;
    const cfg = m.config;
    const result = { type: m.type, state: 'ACTIVE' };

    // Time limit check
    const elapsed = (Date.now() - m.startTime) / 1000;
    if (elapsed > cfg.timeLimit) {
      m.state = 'FAILED';
      return { type: m.type, state: 'FAILED', reason: 'TIME_UP' };
    }
    result.timeRemaining = cfg.timeLimit - elapsed;

    // Type-specific updates
    switch (m.type) {
      case 'ESCORT':
        if (missionProgress.vipHP <= 0) {
          m.state = 'FAILED';
          return { ...result, state: 'FAILED', reason: 'VIP_DEAD' };
        }
        result.vipHP = missionProgress.vipHP;
        break;

      case 'CAPTURE_ZONE': {
        const dx = playerPos.x - m.zoneX, dz = playerPos.z - m.zoneZ;
        const inZone = dx * dx + dz * dz < cfg.zoneRadius * cfg.zoneRadius;
        missionProgress.inZone = inZone;
        if (inZone) {
          var contested = false;
          if (cfg.contestPause && typeof window !== 'undefined' && window.Enemies && window.Enemies.getAll) {
            var _zEnemies = window.Enemies.getAll();
            for (var _zi = 0; _zi < _zEnemies.length; _zi++) {
              var _ze = _zEnemies[_zi];
              if (!_ze || !_ze.alive || !_ze.mesh) continue;
              var _zdx = _ze.mesh.position.x - m.zoneX;
              var _zdz = _ze.mesh.position.z - m.zoneZ;
              if (_zdx * _zdx + _zdz * _zdz < cfg.zoneRadius * cfg.zoneRadius) { contested = true; break; }
            }
          }
          if (!contested) missionProgress.holdTimer += dt;
          result.contested = contested;
        }
        result.holdProgress = missionProgress.holdTimer / cfg.holdTime;
        result.inZone = inZone;
        if (missionProgress.holdTimer >= cfg.holdTime) {
          m.state = 'COMPLETE';
          return { ...result, state: 'COMPLETE' };
        }
        break;
      }

      case 'DEMOLITION':
        if (missionProgress.planted && !missionProgress.escaped) {
          var _demDx = playerPos.x - m.zoneX, _demDz = playerPos.z - m.zoneZ;
          if (_demDx * _demDx + _demDz * _demDz > 625) { // 25 units away
            missionProgress.escaped = true;
            if (typeof window !== 'undefined' && window.HUD && window.HUD.showToast) {
              window.HUD.showToast('💥 CHARGE DETONATED — BLAST ZONE CLEARED!', 4000, '#ff8800');
            }
          }
        }
        if (missionProgress.planted && missionProgress.escaped) {
          m.state = 'COMPLETE';
          return { ...result, state: 'COMPLETE' };
        }
        result.planted = missionProgress.planted;
        result.plantProgress = missionProgress.plantProgress;
        break;

      case 'ASSASSINATION':
        // Auto-locate: entering zone radius * 2 reveals HVT
        if (!missionProgress.hvtLocated) {
          var _aDx = playerPos.x - m.zoneX, _aDz = playerPos.z - m.zoneZ;
          var _aZr = (cfg.zoneRadius || 8) * 2;
          if (_aDx * _aDx + _aDz * _aDz < _aZr * _aZr) missionProgress.hvtLocated = true;
        }
        // Track HVT alive status by enemy ID
        if (missionProgress.hvtEnemyId !== null && typeof window !== 'undefined' && window.Enemies && window.Enemies.getAll) {
          var _hvtList = window.Enemies.getAll();
          var _hvtRef = null;
          for (var _hi = 0; _hi < _hvtList.length; _hi++) {
            if (_hvtList[_hi] && _hvtList[_hi].id === missionProgress.hvtEnemyId) { _hvtRef = _hvtList[_hi]; break; }
          }
          if (_hvtRef) {
            missionProgress.hvtHP = _hvtRef.hp;
            missionProgress.hvtLocated = true;
          } else {
            missionProgress.hvtDead = true;
          }
        }
        if (missionProgress.hvtDead) {
          m.state = 'COMPLETE';
          return { ...result, state: 'COMPLETE' };
        }
        result.hvtHP = missionProgress.hvtHP;
        result.hvtLocated = missionProgress.hvtLocated;
        break;

      case 'RESCUE': {
        // Find nearest unfreed POW to player
        var _nearPow = -1, _nearDist = 25; // 5m radius
        if (missionProgress.pows) {
          for (var _rpi = 0; _rpi < missionProgress.pows.length; _rpi++) {
            var _rp = missionProgress.pows[_rpi];
            if (_rp.freed) continue;
            var _rpDx = playerPos.x - _rp.x, _rpDz = playerPos.z - _rp.z;
            var _rpD = _rpDx * _rpDx + _rpDz * _rpDz;
            if (_rpD < _nearDist) { _nearDist = _rpD; _nearPow = _rpi; }
          }
        }
        missionProgress.activePow = _nearPow;
        result.freed = missionProgress.freed;
        result.activePow = _nearPow;
        result.pows = missionProgress.pows;
        if (missionProgress.freed >= cfg.powCount) {
          m.state = 'COMPLETE';
          return { ...result, state: 'COMPLETE' };
        }
        break;
      }

      case 'DEFUSE': {
        missionProgress.detonationTimer -= dt;
        if (missionProgress.detonationTimer <= 0) {
          // All undefused bombs blow up — deal blast damage to player
          if (typeof window !== 'undefined' && window.HUD && window.HUD.showToast) {
            window.HUD.showToast('💥 BOMBS DETONATED!', 4000, '#ff2222');
          }
          m.state = 'FAILED';
          return { ...result, state: 'FAILED', reason: 'DETONATION' };
        }
        // Find nearest undefused bomb
        var _nearBomb = -1, _nearBombD = 36; // 6m radius
        if (missionProgress.bombs) {
          for (var _dbi = 0; _dbi < missionProgress.bombs.length; _dbi++) {
            var _db = missionProgress.bombs[_dbi];
            if (_db.defused) continue;
            var _dbDx = playerPos.x - _db.x, _dbDz = playerPos.z - _db.z;
            var _dbD = _dbDx * _dbDx + _dbDz * _dbDz;
            if (_dbD < _nearBombD) { _nearBombD = _dbD; _nearBomb = _dbi; }
          }
        }
        missionProgress.activeBomb = _nearBomb;
        // Auto-locate: entering 6m of any bomb marks it located
        if (_nearBomb >= 0 && missionProgress.located <= _nearBomb) missionProgress.located = _nearBomb + 1;
        result.defused = missionProgress.defused;
        result.detonationTimer = missionProgress.detonationTimer;
        result.activeBomb = _nearBomb;
        result.bombs = missionProgress.bombs;
        // Expose active bomb's defuse progress for HUD display
        result.defuseProgress = (_nearBomb >= 0 && missionProgress.bombs[_nearBomb])
          ? (missionProgress.bombs[_nearBomb].defuseProgress || 0) : 0;
        if (missionProgress.defused >= cfg.bombCount) {
          m.state = 'COMPLETE';
          return { ...result, state: 'COMPLETE' };
        }
        break;
      }

      case 'ASSAULT_DUGOUTS':
        result.dugoutsCleared = missionProgress.dugoutsCleared;
        result.dugoutCount = cfg.dugoutCount;
        result.reachedFirst = missionProgress.reachedFirst;
        // Auto-clear: if no live enemies are within 5m of a dugout, mark it cleared
        if (typeof window !== 'undefined' && window.Enemies && window.Enemies.getAll && missionProgress.dugoutPositions) {
          var liveEnemies = window.Enemies.getAll();
          for (var dpi = 0; dpi < missionProgress.dugoutPositions.length; dpi++) {
            var dp = missionProgress.dugoutPositions[dpi];
            if (dp.cleared) continue;
            var hostiles = 0;
            for (var ei = 0; ei < liveEnemies.length; ei++) {
              var en = liveEnemies[ei];
              if (!en || !en.alive || !en.mesh) continue;
              var ddx = en.mesh.position.x - dp.x;
              var ddz = en.mesh.position.z - dp.z;
              if ((ddx * ddx + ddz * ddz) < 25) { hostiles++; break; }
            }
            if (hostiles === 0) {
              dp.cleared = true;
              missionProgress.dugoutsCleared++;
              missionProgress.reachedFirst = true;
              if (window.HUD && window.HUD.notifyPickup) {
                window.HUD.notifyPickup('DUGOUT CLEARED (' + missionProgress.dugoutsCleared + '/' + cfg.dugoutCount + ')', '#88ff44');
              }
            }
          }
        }
        if (missionProgress.dugoutsCleared >= cfg.dugoutCount) {
          missionProgress.holdTimer += dt;
          result.holdProgress = missionProgress.holdTimer / cfg.holdTime;
          if (missionProgress.holdTimer >= cfg.holdTime) {
            m.state = 'COMPLETE';
            return { ...result, state: 'COMPLETE' };
          }
        }
        break;
    }
    return result;
  }

  /* ── Interaction handlers ──────────────────── */
  function interact(action, data) {
    if (!activeMission || activeMission.state !== 'ACTIVE') return null;
    const m = activeMission;

    switch (action) {
      case 'PLANT_CHARGE':
        if (m.type === 'DEMOLITION' && !missionProgress.planted) {
          missionProgress.plantProgress += data.dt / m.config.plantTime;
          if (missionProgress.plantProgress >= 1) { missionProgress.planted = true; }
          return { planting: true, progress: missionProgress.plantProgress };
        }
        break;
      case 'ESCAPE_BLAST':
        if (m.type === 'DEMOLITION' && missionProgress.planted) {
          missionProgress.escaped = true;
          return { escaped: true };
        }
        break;
      case 'DAMAGE_VIP':
        if (m.type === 'ESCORT') {
          missionProgress.vipHP -= data.damage;
          return { vipHP: missionProgress.vipHP };
        }
        break;
      case 'DAMAGE_HVT':
        if (m.type === 'ASSASSINATION') {
          missionProgress.hvtHP -= data.damage;
          missionProgress.hvtLocated = true;
          if (missionProgress.hvtHP <= 0) missionProgress.hvtDead = true;
          return { hvtHP: missionProgress.hvtHP, dead: missionProgress.hvtDead };
        }
        break;
      case 'FREE_POW':
        if (m.type === 'RESCUE') {
          var _ap = missionProgress.activePow;
          if (_ap < 0 || !missionProgress.pows || !missionProgress.pows[_ap] || missionProgress.pows[_ap].freed) {
            return { freeing: false, noTarget: true };
          }
          missionProgress.pows[_ap].freeProgress = (missionProgress.pows[_ap].freeProgress || 0) + data.dt / m.config.freeTime;
          if (missionProgress.pows[_ap].freeProgress >= 1) {
            missionProgress.pows[_ap].freed = true;
            missionProgress.freed++;
            if (typeof window !== 'undefined' && window.HUD && window.HUD.notifyPickup) {
              window.HUD.notifyPickup('✅ POW FREED (' + missionProgress.freed + '/' + m.config.powCount + ')', '#88ff88');
            }
            return { freed: missionProgress.freed };
          }
          return { freeing: true, progress: missionProgress.pows[_ap].freeProgress };
        }
        break;
      case 'ESCORT_POW':
        if (m.type === 'RESCUE') {
          missionProgress.escorted++;
          return { escorted: missionProgress.escorted };
        }
        break;
      case 'DEFUSE_BOMB':
        if (m.type === 'DEFUSE') {
          var _ab = missionProgress.activeBomb;
          if (_ab < 0 || !missionProgress.bombs || !missionProgress.bombs[_ab] || missionProgress.bombs[_ab].defused) {
            return { defusing: false, noTarget: true };
          }
          missionProgress.bombs[_ab].defuseProgress = (missionProgress.bombs[_ab].defuseProgress || 0) + data.dt / m.config.defuseTime;
          if (missionProgress.bombs[_ab].defuseProgress >= 1) {
            missionProgress.bombs[_ab].defused = true;
            missionProgress.defused++;
            if (typeof window !== 'undefined' && window.HUD && window.HUD.notifyPickup) {
              window.HUD.notifyPickup('✅ BOMB DEFUSED (' + missionProgress.defused + '/' + m.config.bombCount + ')', '#88ff88');
            }
            return { defused: missionProgress.defused };
          }
          return { defusing: true, progress: missionProgress.bombs[_ab].defuseProgress };
        }
        break;
      case 'CLEAR_DUGOUT':
        if (m.type === 'ASSAULT_DUGOUTS') {
          missionProgress.dugoutsCleared++;
          missionProgress.reachedFirst = true;
          return { cleared: missionProgress.dugoutsCleared, total: m.config.dugoutCount };
        }
        break;
      case 'GRENADE_USED':
        if (m.type === 'ASSAULT_DUGOUTS') {
          missionProgress.grenadesUsed++;
          return { grenadesUsed: missionProgress.grenadesUsed };
        }
        break;
    }
    return null;
  }

  function getActive() { return activeMission; }
  function getProgress() { return missionProgress; }

  function cancelMission() {
    if (activeMission) activeMission.state = 'CANCELLED';
    activeMission = null;
    missionProgress = {};
  }

  function completeMission() {
    if (!activeMission) return null;
    activeMission.state = 'COMPLETE';
    const reward = { okc: activeMission.config.rewardOKC, xp: activeMission.config.rewardXP };
    const type = activeMission.type;
    activeMission = null;
    missionProgress = {};
    return { type, ...reward };
  }

  function clear() {
    activeMission = null;
    missionProgress = {};
  }

  return {
    TYPES, startMission, update, interact,
    getActive, getProgress, cancelMission, completeMission, clear
  };
})();
if (typeof window !== 'undefined') window.MissionTypes = MissionTypes;
