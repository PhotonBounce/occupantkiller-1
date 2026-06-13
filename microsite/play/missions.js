/* ───────────────────────────────────────────────────────────────────────
   MISSION SYSTEM — procedural missions with objectives
   ─────────────────────────────────────────────────────────────────────── */
const MissionSystem = (function () {
  'use strict';

  /* ── Mission Types ───────────────────────────────────────────────── */
  const MISSION_TYPE = Object.freeze({
    GATHER:         'gather',
    EXPAND:         'expand',
    RECON:          'recon',
    DEFENSE:        'defense',
    ESCORT:         'escort',
    INFILTRATE:     'infiltrate',
    CLEAR_BUILDING: 'clear_building',
  });

  /* ── Templates ───────────────────────────────────────────────────── */
  const TEMPLATES = {
            // Bradley IFV Assault — drive M2A3 Bradley, clear forest ambush
            //   M242 Bushmaster 25mm chain gun (200 rpm cyclic, dual-feed HE/AP)
            //   M240C 7.62mm coax. Press B to enter/exit. WASD drive, mouse aim turret.
            bradley_mission: {
              name: 'Bradley IFV Assault',
              description: 'Drive the M2A3 Bradley. Use the M242 Bushmaster 25mm chain gun and M240 coax to clear {kills} Russian occupants ambushing from the woods.',
              tier: 5,
              generate() {
                var killTarget = 18 + Math.floor(Math.random() * 7); // 18-24
                var spawned = 0;
                var spawnPositions = [];
                var spawnedEnemyIds = [];
                try {
                  // Find the player position via active camera
                  var playerPos = new THREE.Vector3(0, 0, 0);
                  try {
                    if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
                      var p = GameManager.getPlayer();
                      if (p && p.position) playerPos.copy(p.position);
                    }
                  } catch (e) {}
                  // Forest ambush ahead of player (~80-130 units away)
                  var fwdAngle = (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw)
                    ? CameraSystem.getYaw() : Math.random() * Math.PI * 2;
                  var fwd = new THREE.Vector3(Math.sin(fwdAngle), 0, Math.cos(fwdAngle));
                  var center = playerPos.clone().add(fwd.clone().multiplyScalar(105));
                  if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
                    var types = ['CONSCRIPT', 'RIFLEMAN', 'GRENADIER', 'RIFLEMAN'];
                    for (var i = 0; i < killTarget; i++) {
                      // Scatter across an 80x40 forest strip
                      var ux = (Math.random() - 0.5) * 80;
                      var uz = (Math.random() - 0.5) * 40;
                      // Rotate the strip to face the player axis
                      var rx = ux * fwd.z + uz * fwd.x;
                      var rz = -ux * fwd.x + uz * fwd.z;
                      var ex = center.x + rx;
                      var ez = center.z + rz;
                      var ey = 0;
                      try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ey = VoxelWorld.getTerrainHeight(ex, ez) || 0; } catch (e2) {}
                      try {
                        var tp = types[Math.floor(Math.random() * types.length)];
                        var spawnedEnemy = Enemies.spawnSingle(tp, { x: ex, y: ey + 1, z: ez });
                        if (spawnedEnemy) {
                          spawnedEnemyIds.push(spawnedEnemy.id);
                          spawned++;
                        }
                        spawnPositions.push({ x: ex, z: ez });
                      } catch (eS) {}
                    }
                  }
                  // Auto-spawn the Bradley right next to the player and announce
                  try {
                    if (typeof Bradley !== 'undefined' && Bradley.spawnAt) {
                      var bx = playerPos.x + 4;
                      var bz = playerPos.z;
                      var by = 0;
                      try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) by = VoxelWorld.getTerrainHeight(bx, bz) || 0; } catch (e3) {}
                      Bradley.spawnAt(new THREE.Vector3(bx, by, bz));
                    }
                    if (typeof HUD !== 'undefined' && HUD.showToast) {
                      HUD.showToast('🚛 BRADLEY READY — Press B to mount. M242 Bushmaster 25mm + M240 coax.', 5000, '#a0c878');
                    }
                  } catch (eBR) {}
                } catch (eAll) {}
                return {
                  type: 'bradley_mission',
                  killTarget: killTarget,
                  kills: 0,
                  spawned: spawned,
                  spawnedEnemyIds: spawnedEnemyIds,
                  spawnPositions: spawnPositions,
                  startTime: Date.now(),
                  objectiveText: 'Clear forest ambush ahead...',
                };
              },
              check(mission) {
                if (mission.spawned === 0) { mission.objectiveText = 'Clear forest ambush: complete'; return true; }
                if (typeof Enemies === 'undefined' || !Enemies.getAll || !mission.spawnedEnemyIds) return false;
                var aliveCount = 0;
                var allEnemies = Enemies.getAll();
                for (var id of mission.spawnedEnemyIds) {
                  var found = allEnemies.find(e => e && e.id === id);
                  if (found && found.alive) {
                    aliveCount++;
                  }
                }
                mission.kills = mission.spawned - aliveCount;
                mission.objectiveText = `Clear forest ambush: ${mission.kills}/${mission.spawned} killed`;
                return aliveCount === 0;
              },
            },
        // Airborne Assault (Hostomel)
        airborne_assault: {
          name: 'Airborne Assault',
          description: 'Repel Russian airborne troops and secure the landing zone.',
          tier: 4,
          generate() {
            var playerPos = new THREE.Vector3(0, 0, 0);
            try {
              if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
                var p = GameManager.getPlayer();
                if (p && p.position) playerPos.copy(p.position);
              }
            } catch(e){}
            var zones = [];
            for (var i = 0; i < 2; i++) {
              var angle = Math.random() * Math.PI * 2;
              var dist = 30 + Math.random() * 20;
              zones.push({
                x: playerPos.x + Math.sin(angle) * dist,
                z: playerPos.z + Math.cos(angle) * dist
              });
            }
            return {
              type: 'airborne_assault',
              waves: 3,
              completedWaves: 0,
              landingZones: zones,
              spawnedEnemyIds: [],
              waveTimer: 1.0,
              state: 'waiting',
              objectiveText: 'Prepare for airborne assault...',
            };
          },
          update(mission, delta) {
            if (mission.completedWaves >= mission.waves) return;

            if (mission.state === 'waiting') {
              mission.waveTimer -= delta;
              if (mission.waveTimer <= 0) {
                mission.state = 'spawning';
              } else {
                mission.objectiveText = `Next paratrooper wave in ${Math.ceil(mission.waveTimer)}s...`;
              }
            }

            if (mission.state === 'spawning') {
              var zone = mission.landingZones[mission.completedWaves % mission.landingZones.length];
              var count = 5 + mission.completedWaves * 2;
              var types = ['CONSCRIPT', 'STORMER', 'ARMORED'];
              mission.spawnedEnemyIds = [];
              for (var i = 0; i < count; i++) {
                var tp = types[Math.floor(Math.random() * types.length)];
                var ex = zone.x + (Math.random() - 0.5) * 8;
                var ez = zone.z + (Math.random() - 0.5) * 8;
                var ey = 0;
                try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ey = VoxelWorld.getTerrainHeight(ex, ez) || 0; } catch (e) {}
                try {
                  var spawnedEnemy = Enemies.spawnSingle(tp, { x: ex, y: ey + 1, z: ez });
                  if (spawnedEnemy) {
                    mission.spawnedEnemyIds.push(spawnedEnemy.id);
                  }
                } catch (e) {}
              }
              mission.state = 'active';
              if (typeof HUD !== 'undefined' && HUD.showToast) {
                HUD.showToast(`🪂 WAVE ${mission.completedWaves + 1} PARATROOPERS INBOUND!`, 4000, '#ff4444');
              }
            }

            if (mission.state === 'active') {
              if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
              var aliveCount = 0;
              var allEnemies = Enemies.getAll();
              for (var id of mission.spawnedEnemyIds) {
                var found = allEnemies.find(e => e && e.id === id);
                if (found && found.alive) {
                  aliveCount++;
                }
              }
              mission.objectiveText = `Repel airborne assault: Wave ${mission.completedWaves + 1}/${mission.waves} (${aliveCount} hostiles alive)`;
              if (aliveCount === 0) {
                mission.completedWaves++;
                if (mission.completedWaves < mission.waves) {
                  mission.state = 'waiting';
                  mission.waveTimer = 6.0;
                  if (typeof HUD !== 'undefined' && HUD.showToast) {
                    HUD.showToast(`✓ WAVE ${mission.completedWaves} REPELLED! Next drop imminent.`, 4000, '#88ff88');
                  }
                }
              }
            }
          },
          check(mission) { return mission.completedWaves >= mission.waves; },
        },
        // Urban Breakout (Kyiv)
        urban_breakout: {
          name: 'Urban Breakout',
          description: 'Break out of encirclement and reach friendly lines.',
          tier: 5,
          generate() {
            var playerPos = new THREE.Vector3(0, 0, 0);
            try {
              if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
                var p = GameManager.getPlayer();
                if (p && p.position) playerPos.copy(p.position);
              }
            } catch(e){}
            var angle = Math.random() * Math.PI * 2;
            var dist = 100 + Math.random() * 40;
            var dest = new THREE.Vector3(
              playerPos.x + Math.sin(angle) * dist,
              0,
              playerPos.z + Math.cos(angle) * dist
            );
            try {
              if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
                dest.y = VoxelWorld.getTerrainHeight(dest.x, dest.z) || 0;
              }
            } catch (e) {}
            return {
              type: 'urban_breakout',
              destination: dest,
              reached: false,
              timeLimit: 180,
              ambushSpawned: false,
              distanceToDest: Math.round(dist),
              objectiveText: 'Break out of encirclement!',
              timerExpiries: 0,
            };
          },
          update(mission, delta) {
            var playerPos = new THREE.Vector3(0, 0, 0);
            try {
              if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
                var p = GameManager.getPlayer();
                if (p && p.position) playerPos.copy(p.position);
              }
            } catch(e){}
            
            var d = playerPos.distanceTo(mission.destination);
            mission.distanceToDest = Math.round(d);
            mission.timeLimit -= delta;

            if (d < 15) {
              mission.reached = true;
              if (typeof HUD !== 'undefined' && HUD.showToast) {
                HUD.showToast('✓ BROKEN OUT! You reached friendly lines.', 4000, '#88ff88');
              }
            } else if (mission.timeLimit <= 0) {
              mission.timerExpiries = (mission.timerExpiries || 0) + 1;
              if (mission.timerExpiries >= 3) {
                mission.timeLimit = -999;
                if (typeof HUD !== 'undefined' && HUD.showToast) {
                  HUD.showToast('❌ BREAKOUT FAILED — encirclement holds.', 5000, '#ff3333');
                }
              } else {
                mission.timeLimit = 60;
                if (typeof Enemies !== 'undefined' && Enemies.spawnReinforcement) {
                  Enemies.spawnReinforcement(playerPos.x, playerPos.z, 4);
                }
                if (typeof HUD !== 'undefined' && HUD.showToast) {
                  HUD.showToast('⚠ TIME EXPIRED! Reinforcements incoming!', 5000, '#ff3333');
                }
              }
            }

            if (!mission.ambushSpawned && d < 60 && d > 30) {
              mission.ambushSpawned = true;
              var ambushPos = new THREE.Vector3().lerpVectors(playerPos, mission.destination, 0.5);
              try {
                if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
                  var types = ['CONSCRIPT', 'STORMER', 'ARMORED', 'GRENADIER'];
                  for (var i = 0; i < 6; i++) {
                    var tp = types[Math.floor(Math.random() * types.length)];
                    var ax = ambushPos.x + (Math.random() - 0.5) * 12;
                    var az = ambushPos.z + (Math.random() - 0.5) * 12;
                    var ay = 0;
                    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
                      ay = VoxelWorld.getTerrainHeight(ax, az) || 0;
                    }
                    Enemies.spawnSingle(tp, { x: ax, y: ay + 1, z: az });
                  }
                }
              } catch(e){}
              if (typeof HUD !== 'undefined' && HUD.showToast) {
                HUD.showToast('⚠ ROADBLOCK AMBUSH! Clear the path!', 5000, '#ffaa00');
              }
            }

            mission.objectiveText = `Breakout: reach the ◆ waypoint — ${mission.distanceToDest}m (${Math.round(mission.timeLimit)}s left)`;
          },
          check(mission) { return mission.reached; },
          failed(mission) { return !mission.reached && mission.timeLimit === -999; },
        },
    gather: {
      name: 'Resource Gathering',
      description: 'Collect {amount} {resource} from the world.',
      tier: 1,
      generate() {
        const resources = ['wood', 'metal', 'stone'];
        const res = resources[Math.floor(Math.random() * resources.length)];
        const amount = 20 + Math.floor(Math.random() * 40);
        return {
          type: MISSION_TYPE.GATHER,
          resource: res,
          targetAmount: amount,
          currentAmount: 0,
        };
      },
      check(mission) {
        mission.objectiveText = `Gather ${mission.resource.toUpperCase()}: ${mission.currentAmount}/${mission.targetAmount}`;
        return mission.currentAmount >= mission.targetAmount;
      },
    },
    expand: {
      name: 'Base Expansion',
      description: 'Build {count} new structure(s).',
      tier: 2,
      generate() {
        return {
          type: MISSION_TYPE.EXPAND,
          targetCount: 1 + Math.floor(Math.random() * 2),
          startCount: (typeof Building !== 'undefined' && Building.getStructures) ? Building.getStructures().length : 0,
        };
      },
      check(mission) {
        var cur = (typeof Building !== 'undefined' && Building.getStructures) ? Building.getStructures().length : 0;
        var built = cur - mission.startCount;
        mission.objectiveText = `Build structures: ${built}/${mission.targetCount}`;
        return cur >= mission.startCount + mission.targetCount;
      },
    },
    recon: {
      name: 'Drone Reconnaissance',
      description: 'Scout {count} locations with a recon drone.',
      tier: 2,
      generate() {
        const points = [];
        for (let i = 0; i < 3; i++) {
          points.push(new THREE.Vector3(
            -40 + Math.random() * 80,
            10 + Math.random() * 10,
            -40 + Math.random() * 80
          ));
        }
        return {
          type: MISSION_TYPE.RECON,
          targetPoints: points,
          scoutedPoints: points.map(function () { return false; }),
          scoutedCount: 0,
          targetCount: 3,
        };
      },
      check(mission) {
        mission.objectiveText = `Drone Recon: ${mission.scoutedCount}/${mission.targetCount} scouted`;
        return mission.scoutedCount >= mission.targetCount;
      },
    },
    defense: {
      name: 'Defensive Survival',
      description: 'Survive {waves} enemy waves without losing your base.',
      tier: 3,
      generate() {
        return {
          type: MISSION_TYPE.DEFENSE,
          targetWaves: 3 + Math.floor(Math.random() * 3),
          completedWaves: 0,
          baseHealthStart: 100,
        };
      },
      check(mission) {
        mission.objectiveText = `Survival: Complete Wave ${mission.completedWaves}/${mission.targetWaves}`;
        return mission.completedWaves >= mission.targetWaves;
      },
    },
    kyiv_defense: {
      name: 'Defend the Capital',
      description: 'Feb 2022. Stop every Russian armored column before it breaches the Maidan line. Kyiv must not fall.',
      tier: 5,
      generate() {
        return {
          type: 'kyiv_defense',
          targetWaves: 8,
          completedWaves: 0,
          objectiveText: 'Hold the line — columns inbound',
        };
      },
      update(mission) {
        try {
          var w = (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) ? GameManager.getCurrentWave() : 1;
          mission.completedWaves = Math.max(mission.completedWaves, w - 1);
          var hp = (typeof ConvoySystem !== 'undefined') ? ConvoySystem.getCityHP() : 100;
          mission.objectiveText = 'Defend Kyiv: wave ' + w + '/' + mission.targetWaves + ' — city integrity ' + hp + '%';
        } catch (e) {}
      },
      check(mission) { return mission.completedWaves >= mission.targetWaves; },
      failed() { return (typeof ConvoySystem !== 'undefined') && ConvoySystem.isCityLost(); },
    },
    escort: {
      name: 'Logistics Escort',
      description: 'Escort supply convoy to destination safely.',
      tier: 3,
      generate() {
        var playerPos = new THREE.Vector3(0, 0, 0);
        try {
          if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
            var p = GameManager.getPlayer();
            if (p && p.position) playerPos.copy(p.position);
          }
        } catch(e){}
        var angle = Math.random() * Math.PI * 2;
        var dist = 90 + Math.random() * 40;
        var dest = new THREE.Vector3(
          playerPos.x + Math.sin(angle) * dist,
          0,
          playerPos.z + Math.cos(angle) * dist
        );
        try {
          if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
            dest.y = VoxelWorld.getTerrainHeight(dest.x, dest.z) || 0;
          }
        } catch (e) {}
        return {
          type: MISSION_TYPE.ESCORT,
          destination: dest,
          convoyHealth: 100,
          arrived: false,
          escortNpcId: null,
          spawned: false,
          ambushSpawned1: false,
          ambushSpawned2: false,
          objectiveText: 'Locating escort NPC...',
        };
      },
      update(mission, delta) {
        if (mission.arrived || mission.convoyHealth <= 0) return;

        var playerPos = new THREE.Vector3(0, 0, 0);
        try {
          if (typeof GameManager !== 'undefined' && GameManager.getPlayer) {
            var p = GameManager.getPlayer();
            if (p && p.position) playerPos.copy(p.position);
          }
        } catch(e){}

        if (!mission.spawned) {
          mission.spawned = true;
          try {
            if (typeof NPCSystem !== 'undefined' && NPCSystem.spawn) {
              var ex = playerPos.x + 4;
              var ez = playerPos.z + 4;
              var ey = playerPos.y;
              try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ey = VoxelWorld.getTerrainHeight(ex, ez) || 0; } catch (e2) {}
              var npc = NPCSystem.spawn(ex, ey + 1, ez, 'veteran');
              if (npc) {
                npc.job = 'guard';
                npc.guardPos = playerPos.clone();
                mission.escortNpcId = npc.id;
                // The officer must survive the trip through a hostile field —
                // ambient enemies previously shredded them in seconds, failing
                // the mission before the player could react. Triple HP and let
                // the scripted ambushes be the real threat.
                npc.maxHealth = (npc.maxHealth || npc.health || 100) * 3;
                npc.health = npc.maxHealth;
              }
            }
          } catch(e3){}
          // If NPCSystem was unavailable or spawn returned null, fail fast
          // instead of stalling forever in "Locating escort NPC..."
          if (mission.escortNpcId === null) {
            mission.convoyHealth = 0;
            mission.objectiveText = 'Escort Logistics NPC: FAILED (Could not spawn officer)';
            if (typeof HUD !== 'undefined' && HUD.showToast) {
              HUD.showToast('❌ ESCORT FAILED — officer could not be located.', 4000, '#ff3333');
            }
            return;
          }
          if (typeof HUD !== 'undefined' && HUD.showToast) {
            HUD.showToast('🛡 ESCORT STARTED — Protect the logistics officer and lead them to the destination.', 5000, '#a0c878');
          }
        }

        if (mission.escortNpcId === null) return;

        var escortNpc = null;
        try {
          if (typeof NPCSystem !== 'undefined' && NPCSystem.getById) {
            escortNpc = NPCSystem.getById(mission.escortNpcId);
          }
        } catch(eFind){}

        if (!escortNpc || !escortNpc.alive || escortNpc.health <= 0) {
          mission.convoyHealth = 0;
          mission.objectiveText = 'Escort Logistics NPC: FAILED (Escort killed)';
          if (typeof HUD !== 'undefined' && HUD.showToast) {
            HUD.showToast('❌ ESCORT FAILED! The logistics officer was killed.', 5000, '#ff3333');
          }
          return;
        }

        mission.convoyHealth = Math.round((escortNpc.health / (escortNpc.maxHealth || 100)) * 100);
        var npcPos = escortNpc.position;
        var pDist = npcPos.distanceTo(playerPos);
        var dDist = npcPos.distanceTo(mission.destination);

        var waiting = false;
        if (pDist > 12) {
          escortNpc.guardPos.copy(npcPos);
          waiting = true;
        } else {
          escortNpc.guardPos.copy(playerPos);
        }

        if (dDist < 12) {
          mission.arrived = true;
          if (typeof HUD !== 'undefined' && HUD.showToast) {
            HUD.showToast('✓ ESCORT SUCCESSFUL! Destination reached.', 5000, '#88ff88');
          }
        }

        if (!mission.ambushSpawned1 && dDist < 80 && dDist > 55) {
          mission.ambushSpawned1 = true;
          spawnAmbushNear(npcPos, 4);
        }
        if (!mission.ambushSpawned2 && dDist < 45 && dDist > 25) {
          mission.ambushSpawned2 = true;
          spawnAmbushNear(npcPos, 5);
        }

        var statusText = waiting ? ' (Waiting for you — stay within 12m)' : '';
        mission.objectiveText = `Escort officer (${mission.convoyHealth}% HP) to the ◆ waypoint — ${Math.round(dDist)}m${statusText}`;

        function spawnAmbushNear(center, enemyCount) {
          try {
            if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
              var types = ['CONSCRIPT', 'STORMER', 'RIFLEMAN'];
              for (var i = 0; i < enemyCount; i++) {
                var tp = types[Math.floor(Math.random() * types.length)];
                var ax = center.x + (Math.random() - 0.5) * 15 + 10;
                var az = center.z + (Math.random() - 0.5) * 15 + 10;
                var ay = 0;
                if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
                  ay = VoxelWorld.getTerrainHeight(ax, az) || 0;
                }
                Enemies.spawnSingle(tp, { x: ax, y: ay + 1, z: az });
              }
            }
          } catch(e){}
          if (typeof HUD !== 'undefined' && HUD.showToast) {
            HUD.showToast('⚠ ESCORT AMBUSH INBOUND!', 4000, '#ffcc00');
          }
        }
      },
      check(mission) { return mission.arrived && mission.convoyHealth > 0; },
      failed(mission) { return !mission.arrived && mission.spawned && mission.convoyHealth <= 0; },
    },
    infiltrate: {
      name: 'Infiltrate the Occupants',
      description: 'You are inserted in a Russian uniform. Walk among them, then eliminate {kills} occupants. Disguise breaks when you attack — survive the response.',
      tier: 4,
      generate() {
        const kills = 8 + Math.floor(Math.random() * 5);
        return {
          type: MISSION_TYPE.INFILTRATE,
          targetKills: kills,
          kills: 0,
          disguiseBlown: false,
          completed: false,
          stealthKills: 0,
          stealthBonus: 3,
        };
      },
      check(mission) {
        var blown = (typeof Enemies !== 'undefined' && Enemies.isDisguiseBlown) ? Enemies.isDisguiseBlown() : false;
        var status = blown ? '⚠ COMPROMISED' : '🕵 DISGUISED';
        mission.objectiveText = `Infiltration (${status}): ${mission.kills}/${mission.targetKills} eliminated`;
        return mission.kills >= mission.targetKills;
      },
    },
    clear_building: {
      name: 'Clear the Building',
      description: 'Russian occupants have holed up inside an apartment block. Enter and eliminate every hostile on every floor.',
      tier: 3,
      generate() {
        var building = null;
        try {
          if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getBuildings) {
            var list = VoxelWorld.getBuildings();
            if (list && list.length) building = list[Math.floor(Math.random() * list.length)];
          }
        } catch (e) {}
        if (!building) {
          building = { kind: 'apartment', x: -9, z: -5, w: 18, d: 10, baseY: 0, floorH: 3, floors: 4, cx: 0, cz: 0 };
        }
        var spawned = 0;
        var spawnedEnemyIds = [];
        try {
          if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
            var types = ['CONSCRIPT', 'RIFLEMAN', 'GRENADIER'];
            for (var f = 0; f < building.floors; f++) {
              for (var n = 0; n < 2; n++) {
                var tp = types[Math.floor(Math.random() * types.length)];
                var px = building.x + 4 + Math.floor(Math.random() * (building.w - 8));
                var pz = building.cz + (n === 0 ? -1 : 1);
                var py = building.baseY + f * building.floorH + 1;
                var spawnedEnemy = Enemies.spawnSingle(tp, { x: px + 0.5, z: pz + 0.5, y: py });
                if (spawnedEnemy) {
                  spawnedEnemyIds.push(spawnedEnemy.id);
                  spawned++;
                }
              }
            }
          }
        } catch (e2) {}
        return {
          type: MISSION_TYPE.CLEAR_BUILDING,
          building: building,
          spawned: spawned,
          spawnedEnemyIds: spawnedEnemyIds,
          remaining: spawned,
          completed: false,
        };
      },
      check(mission) {
        // No enemies were spawned (system unavailable at generate time) — auto-complete rather than stall
        if (mission.spawned === 0) { mission.objectiveText = 'Clear Building: complete'; return true; }
        if (typeof Enemies === 'undefined' || !Enemies.getAll || !mission.spawnedEnemyIds) return false;
        var aliveCount = 0;
        var allEnemies = Enemies.getAll();
        for (var id of mission.spawnedEnemyIds) {
          var found = allEnemies.find(e => e && e.id === id);
          if (found && found.alive) {
            aliveCount++;
          }
        }
        mission.remaining = aliveCount;
        mission.objectiveText = `Clear Building: ${mission.spawned - aliveCount}/${mission.spawned} cleared`;
        return aliveCount === 0;
      },
    },
  };

  /* ── State ───────────────────────────────────────────────────────── */
  const activeMissions  = [];
  const completedMissions = [];
  let missionCount = 0;
  let _onComplete = null;

  /* ── Init ────────────────────────────────────────────────────────── */
  function init() {
    activeMissions.length = 0;
    completedMissions.length = 0;
    missionCount = 0;
  }

  /* ── Generate Mission ────────────────────────────────────────────── */
  function generateMission(type) {
    const template = TEMPLATES[type];
    if (!template) return null;

    const data = template.generate();
    const mission = {
      id: ++missionCount,
      name: template.name,
      description: template.description,
      tier: template.tier,
      type: type,
      data,
      status: 'active',
      startTime: Date.now(),
    };

    activeMissions.push(mission);
    // INFILTRATE: activate Russian-uniform disguise on the player.
    try {
      if (type === MISSION_TYPE.INFILTRATE && typeof Enemies !== 'undefined' && Enemies.setPlayerDisguised) {
        Enemies.setPlayerDisguised(true);
        if (typeof HUD !== 'undefined' && HUD.showToast) {
          HUD.showToast('🕵 DISGUISE ACTIVE — Russian uniform on. Walk among them.', 4500, '#88ff88');
        }
      }
    } catch (e) {}
    // CLEAR_BUILDING: show building coords + floor count so the player
    // knows where to push.
    try {
      if (type === MISSION_TYPE.CLEAR_BUILDING && typeof HUD !== 'undefined' && HUD.showToast) {
        var b = mission.data.building;
        var msg = '🏚 CLEAR BUILDING — ' + mission.data.spawned + ' hostiles across ' +
                  b.floors + ' floors @ (' + Math.round(b.x + b.w/2) + ', ' + Math.round(b.z + b.d/2) + ')';
        HUD.showToast(msg, 5000, '#ffaa44');
      }
    } catch (eCB) {}
    return mission;
  }

  function generateRandom() {
    // Weighted pool so the marquee building-clearing content (and combat
    // missions) surface reliably — it was 1-of-7 uniform RNG, so the
    // 'clear the building' mission was rarely seen ("missing").
    const weighted = [
      'clear_building', 'clear_building', 'clear_building',
      'defense', 'defense', 'recon', 'recon',
      'gather', 'expand', 'escort', 'infiltrate',
    ];
    let pick = weighted[Math.floor(Math.random() * weighted.length)];
    if (!TEMPLATES[pick]) pick = Object.keys(TEMPLATES)[0];
    return generateMission(pick);
  }

  /* ── Update / Check ──────────────────────────────────────────────── */
  function update(delta) {
    for (let i = activeMissions.length - 1; i >= 0; i--) {
      const m = activeMissions[i];
      const template = TEMPLATES[m.type];
      if (template) {
        if (template.update) {
          try {
            template.update(m.data, delta);
          } catch (eUpd) {
            console.error('Failed to update mission:', m.type, eUpd);
          }
        }
        // Mission failure: templates may define failed(data). Without this,
        // a failed mission (e.g. escort officer killed) sat in the active
        // list forever showing FAILED and was never replaced.
        if (template.failed && template.failed(m.data)) {
          m.status = 'failed';
          activeMissions.splice(i, 1);
          if (typeof HUD !== 'undefined' && HUD.showToast) {
            HUD.showToast('❌ MISSION FAILED: ' + m.name + ' — a new operation will come in shortly', 4500, '#ff5555');
          }
          // Replace it after a short breather, like the success path does.
          setTimeout(function () {
            try { if (activeMissions.length === 0) generateRandom(); } catch (eGR) {}
          }, 8000);
          continue;
        }
        if (template.check(m.data)) {
          m.status = 'completed';
          completedMissions.push(m);
          activeMissions.splice(i, 1);

          // INFILTRATE: turn off disguise on completion.
          try {
            if (m.type === MISSION_TYPE.INFILTRATE && typeof Enemies !== 'undefined' && Enemies.setPlayerDisguised) {
              Enemies.setPlayerDisguised(false);
              if (typeof HUD !== 'undefined' && HUD.showToast) {
                const stealth = m.data.stealthKills || 0;
                const bonus = stealth >= (m.data.stealthBonus || 0) ? ' +STEALTH BONUS' : '';
                HUD.showToast(`✓ INFILTRATION COMPLETE (${stealth} stealth kills)${bonus}`, 4000, '#88ff88');
              }
            }
          } catch (eIC) {}

          // Reward
          var reward = (typeof Economy !== 'undefined' && Economy.missionReward) ? Economy.missionReward(m.tier) : 0;
          if (typeof RankSystem !== 'undefined' && RankSystem.onMissionComplete) RankSystem.onMissionComplete(m.tier);

          if (_onComplete) _onComplete(m, reward);
        }
      }
    }
    // Update objective HUD. The primary-objective banner already shows the
    // FIRST active mission's name + live progress, so only surface the yellow
    // marker for a SECOND concurrent mission — otherwise it duplicated the
    // banner text and collided with the stage header.
    if (typeof HUD !== 'undefined') {
      if (activeMissions.length > 1) {
        const latest = activeMissions[activeMissions.length - 1];
        const txt = (latest.data && latest.data.objectiveText) ? latest.data.objectiveText : latest.name;
        HUD.showObjective(txt);
      } else {
        HUD.hideObjective();
      }
    }
  }

  /* ── Mission Progress Updates ────────────────────────────────────── */
  function onResourceGathered(type, amount) {
    for (const m of activeMissions) {
      if (m.data.type === MISSION_TYPE.GATHER && m.data.resource === type) {
        m.data.currentAmount += amount;
      }
    }
  }

  function onWaveCompleted() {
    for (const m of activeMissions) {
      if (m.data.type === MISSION_TYPE.DEFENSE) {
        m.data.completedWaves++;
      }
    }
  }

  // INFILTRATE: called every time the player kills a Russian occupant.
  function onEnemyKilled() {
    for (const m of activeMissions) {
      if (m.data.type === MISSION_TYPE.INFILTRATE) {
        m.data.kills++;
        // Stealth bonus: kills before disguise was blown
        const blown = (typeof Enemies !== 'undefined' && Enemies.isDisguiseBlown) ? Enemies.isDisguiseBlown() : true;
        if (!blown) m.data.stealthKills++;
        else m.data.disguiseBlown = true;
      }
    }
  }

  function onDroneScout(position) {
    for (const m of activeMissions) {
      if (m.data.type === MISSION_TYPE.RECON) {
        for (let i = 0; i < m.data.targetPoints.length; i++) {
          const pt = m.data.targetPoints[i];
          if (!m.data.scoutedPoints[i] && position.distanceTo(pt) < 10) {
            m.data.scoutedPoints[i] = true;
            m.data.scoutedCount++;
          }
        }
      }
    }
  }

  /* ── Queries ─────────────────────────────────────────────────────── */
  function getActive()    { return activeMissions; }
  function getCompleted() { return completedMissions; }
  function getById(id)    { return activeMissions.find(m => m.id === id); }

  function onMissionComplete(cb) { _onComplete = cb; }

  /* ── 1. Side Objectives ──────────────────────────────────────────── */
  const SIDE_OBJECTIVES = [
    { id: 'no_damage',      name: 'No Damage Taken',  desc: 'Survive wave without taking damage',         reward: 200, check: function (s) { return s.damageTaken === 0; } },
    { id: 'headshots_only', name: 'Headshots Only',    desc: 'All kills must be headshots',                reward: 300, check: function (s) { return s.kills > 0 && s.headshots === s.kills; } },
    { id: 'speed_run',      name: 'Speed Run',         desc: 'Complete wave under 60 seconds',             reward: 250, check: function (s) { return s.waveTime < 60; } },
    { id: 'knife_only',     name: 'Knife Only',        desc: 'Use only melee weapons',                     reward: 400, check: function (s) { return s.kills > 0 && s.meleeKills === s.kills; } },
    { id: 'pacifist_start', name: 'Pacifist Start',    desc: 'Don\'t kill for the first 15 seconds',       reward: 150, check: function (s) { return s.firstKillTime >= 15; } },
    { id: 'conserve_ammo',  name: 'Conserve Ammo',     desc: 'Finish wave with >50% ammo remaining',       reward: 200, check: function (s) { return s.ammoPercent > 50; } },
    { id: 'ghost',          name: 'Ghost',             desc: 'Don\'t get spotted for 30 seconds',          reward: 300, check: function (s) { return s.undetectedTime >= 30; } },
    { id: 'collateral',     name: 'Collateral',        desc: 'Kill 3+ enemies with one explosive',         reward: 350, check: function (s) { return s.maxExplosiveKill >= 3; } },
    { id: 'marksman',       name: 'Marksman',          desc: '>80% accuracy this wave',                    reward: 250, check: function (s) { return s.shotsFired > 0 && (s.shotsHit / s.shotsFired) > 0.8; } },
    { id: 'survivor',       name: 'Survivor',          desc: 'Finish wave with less than 20 HP',           reward: 200, check: function (s) { return s.hpAtEnd < 20 && s.hpAtEnd > 0; } },
  ];

  let activeSideObj = null;

  function generateSideObjective() {
    activeSideObj = SIDE_OBJECTIVES[Math.floor(Math.random() * SIDE_OBJECTIVES.length)];
    return activeSideObj;
  }

  function checkSideObjective(stats) {
    if (!activeSideObj) return false;
    var passed = activeSideObj.check(stats);
    if (!passed) return false;
    return {
      completed: true,
      id: activeSideObj.id,
      name: activeSideObj.name,
      reward: activeSideObj.reward,
    };
  }

  function getSideObjective() {
    return activeSideObj;
  }

  /* ── 2. Mission Chains ───────────────────────────────────────────── */
  const MISSION_CHAINS = [
            // Bradley IFV Forest Road Mission
            {
              id: 'bradley_forest',
              name: 'Bradley Forest Road',
              stages: [
                { name: 'Convoy Start', type: 'bradley_mission', desc: 'Defend the convoy while riding the Bradley IFV through a Ukrainian forest road.' },
                { name: 'Ambush Defense', type: MISSION_TYPE.DEFENSE, desc: 'Repel ambushes and protect the convoy.' },
                { name: 'Breakout', type: MISSION_TYPE.ESCORT, desc: 'Escort survivors to safety after exiting the vehicle.' }
              ]
            },
        // Hostomel Airport Assault (campaign & skirmish)
        {
          id: 'hostomel_airport',
          name: 'Hostomel Airport Assault',
          stages: [
            { name: 'Repel Airborne', type: 'airborne_assault', desc: 'Defend against Russian VDV landings' },
            { name: 'Secure Runway', type: MISSION_TYPE.DEFENSE, desc: 'Hold the runway for reinforcements' },
            { name: 'Counterattack', type: MISSION_TYPE.ESCORT, desc: 'Lead a counterattack to clear the airport' }
          ]
        },
        // Kyiv Siege: First Day (campaign)
        {
          id: 'kyiv_siege_day1',
          name: 'Kyiv Siege: First Day',
          stages: [
            { name: 'Urban Defense', type: MISSION_TYPE.DEFENSE, desc: 'Hold defensive lines in Kyiv suburbs' },
            { name: 'Breakout', type: 'urban_breakout', desc: 'Break out of partial encirclement' },
            { name: 'Rescue Civilians', type: MISSION_TYPE.ESCORT, desc: 'Escort civilians to safety' }
          ]
        },
    {
      id: 'operation_viper',
      name: 'Operation Viper',
      stages: [
        { name: 'Recon',        type: MISSION_TYPE.RECON,    desc: 'Scout enemy stronghold locations' },
        { name: 'Assassinate',  type: MISSION_TYPE.DEFENSE,  desc: 'Eliminate the garrison commander' },
        { name: 'Extract',      type: MISSION_TYPE.ESCORT,   desc: 'Extract intel to base safely' },
      ],
    },
    {
      id: 'supply_line',
      name: 'Supply Line',
      stages: [
        { name: 'Gather Resources', type: MISSION_TYPE.GATHER,  desc: 'Collect supplies for the convoy' },
        { name: 'Defend Convoy',     type: MISSION_TYPE.DEFENSE, desc: 'Protect the supply convoy from ambush' },
        { name: 'Deliver Supplies',  type: MISSION_TYPE.ESCORT,  desc: 'Deliver supplies to the forward base' },
      ],
    },
    {
      id: 'liberation',
      name: 'Liberation',
      stages: [
        { name: 'Capture Zone',       type: MISSION_TYPE.EXPAND,   desc: 'Seize the occupied territory' },
        { name: 'Eliminate Garrison',  type: MISSION_TYPE.DEFENSE,  desc: 'Wipe out remaining enemy forces' },
        { name: 'Rebuild',            type: MISSION_TYPE.EXPAND,   desc: 'Reconstruct the liberated zone' },
      ],
    },
    {
      id: 'deep_strike',
      name: 'Deep Strike',
      stages: [
        { name: 'Scout',          type: MISSION_TYPE.RECON,    desc: 'Locate the target bridge' },
        { name: 'Demolish Bridge', type: MISSION_TYPE.DEFENSE, desc: 'Plant charges and defend the site' },
        { name: 'Escape',         type: MISSION_TYPE.ESCORT,   desc: 'Escape the blast zone before reinforcements arrive' },
      ],
    },
  ];

  let activeChain = null;
  let chainProgress = 0;

  function startChain(chainId) {
    var chain = MISSION_CHAINS.find(function (c) { return c.id === chainId; });
    if (!chain) return null;
    activeChain = chain;
    chainProgress = 0;
    var stage = chain.stages[0];
    return generateMission(stage.type);
  }

  function advanceChain() {
    if (!activeChain) return null;
    chainProgress++;
    if (chainProgress >= activeChain.stages.length) {
      var finished = { chain: activeChain.name, completed: true };
      activeChain = null;
      chainProgress = 0;
      return finished;
    }
    var stage = activeChain.stages[chainProgress];
    return generateMission(stage.type);
  }

  function getChainProgress() {
    if (!activeChain) return null;
    return {
      chain: activeChain,
      current: chainProgress,
      total: activeChain.stages.length,
      stage: activeChain.stages[chainProgress] || null,
    };
  }

  /* ── 3. Dynamic Mission Difficulty ───────────────────────────────── */
  function scaleMission(mission, playerLevel) {
    var factor = 1 + (playerLevel - 1) * 0.15;
    var d = mission.data;
    if (d.targetAmount)  d.targetAmount  = Math.ceil(d.targetAmount * factor);
    if (d.targetWaves)   d.targetWaves   = Math.ceil(d.targetWaves * factor);
    if (d.targetCount)   d.targetCount   = Math.ceil(d.targetCount * factor);
    if (d.convoyHealth)  d.convoyHealth  = Math.round(d.convoyHealth * factor);
    mission.tier = Math.min(5, Math.ceil(mission.tier * factor));
    return mission;
  }

  /* ── 4. Mission Timer ────────────────────────────────────────────── */
  var missionTimerLeft = 0;
  var missionTimerActive = false;

  function startMissionTimer(seconds) {
    missionTimerLeft = seconds;
    missionTimerActive = true;
  }

  function updateMissionTimer(delta) {
    if (!missionTimerActive) return;
    missionTimerLeft -= delta;
    if (missionTimerLeft <= 0) {
      missionTimerLeft = 0;
      missionTimerActive = false;
    }
    if (typeof MissionTypes !== 'undefined' && MissionTypes.getActive && MissionTypes.getActive()) {
      return;
    }
    if (typeof HUD !== 'undefined' && HUD.showTimer) {
      HUD.showTimer(missionTimerLeft);
    }
  }

  function getMissionTimeLeft() {
    return missionTimerLeft;
  }

  return {
    MISSION_TYPE,
    // Expose new mission types for IIFE compliance
    TEMPLATES,
    init,
    generateMission,
    generateRandom,
    update,
    onResourceGathered,
    onWaveCompleted,
    onDroneScout,
    onEnemyKilled,
    getActive,
    getCompleted,
    getById,
    onMissionComplete,
    /* Side Objectives */
    SIDE_OBJECTIVES,
    generateSideObjective,
    checkSideObjective,
    getSideObjective,
    /* Mission Chains */
    MISSION_CHAINS,
    startChain,
    advanceChain,
    getChainProgress,
    /* Dynamic Difficulty */
    scaleMission,
    /* Mission Timer */
    startMissionTimer,
    updateMissionTimer,
    getMissionTimeLeft,
  };
})();
