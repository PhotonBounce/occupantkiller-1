/* ============================================================
 *  ENEMY-TYPES.JS — 24 enemy type features
 *  Features: boss, bomber, sniper, medic, engineer, war dog,
 *  shield bearer, mortar, flamethrower, paratroop, tank,
 *  drone operator, spetsnaz, kadyrovite, wagner, BTR,
 *  kamikaze drone, officer, heavy sniper, commissar,
 *  thermobaric, EW operator, assault mech, swarm operator
 * ============================================================ */
const EnemyTypes = (function () {
  'use strict';

  /* ── New Enemy Type Definitions ────────────── */
  const TYPES = {
    // Feature 16: Boss enemies (appear every 5th wave)
    BOSS: {
      id: 'BOSS', name: 'Commander Boss', tier: 4,
      hp: 500, speed: 1.5, damage: 45, attackRange: 8,
      color: 0x990000, scale: 1.6, xpReward: 200,
      abilities: ['summon_reinforcements', 'rage_mode', 'shield_bash'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '⚠️ ENEMY COMMANDER APPROACHING!'
    },

    // ── Stage-Specific Boss Types (Stages 1-4) ──────────────

    // Stage 1: HOSTOMEL AIRPORT — VDV Airborne Assault Colonel
    BOSS_HOSTOMEL: {
      id: 'BOSS_HOSTOMEL', name: 'VDV Assault Colonel', tier: 3,
      hp: 600, speed: 2.2, damage: 40, attackRange: 12,
      color: 0x4466cc, scale: 1.65, xpReward: 220,
      abilities: ['summon_reinforcements', 'rage_mode'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '🪂 VDV ASSAULT COLONEL DROPS IN!',
      behavior: 'boss',
      rageThreshold: 0.5, rageDamageMult: 1.5,
      summonTypes: ['PARATROOP', 'DRONE_OP'], summonCount: 3, summonInterval: 12
    },

    // Stage 2: AVDIIVKA — Siege Commander in armored vest
    BOSS_AVDIIVKA: {
      id: 'BOSS_AVDIIVKA', name: 'Avdiivka Siege Commander', tier: 3,
      hp: 650, speed: 1.3, damage: 50, attackRange: 10,
      color: 0x664422, scale: 1.70, xpReward: 260,
      abilities: ['summon_reinforcements', 'rage_mode', 'bunker_shield'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '🏭 SIEGE COMMANDER BREAKS THROUGH THE LINE!',
      behavior: 'boss',
      rageThreshold: 0.45, rageDamageMult: 1.4,
      summonTypes: ['ARMORED', 'STORMER'], summonCount: 3, summonInterval: 15
    },

    // Stage 3: BAKHMUT RUINS — Wagner Group Butcher
    BOSS_BAKHMUT: {
      id: 'BOSS_BAKHMUT', name: 'Bakhmut Butcher (Wagner Lt.)', tier: 3,
      hp: 700, speed: 2.0, damage: 60, attackRange: 8,
      color: 0x442200, scale: 1.75, xpReward: 300,
      abilities: ['summon_reinforcements', 'rage_mode'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT', 'RARE_WEAPON'],
      spawnMessage: '☠ WAGNER BUTCHER STORMS THE RUINS!',
      behavior: 'boss',
      rageThreshold: 0.5, rageDamageMult: 1.8,
      summonTypes: ['WAGNER', 'CONSCRIPT', 'CONSCRIPT'], summonCount: 4, summonInterval: 10
    },

    // Stage 4: KHERSON — Occupation Commissioner
    BOSS_KHERSON: {
      id: 'BOSS_KHERSON', name: 'Kherson Occupation Commissioner', tier: 3,
      hp: 550, speed: 1.6, damage: 35, attackRange: 15,
      color: 0x446622, scale: 1.60, xpReward: 240,
      abilities: ['summon_reinforcements', 'rage_mode'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '🪖 OCCUPATION COMMISSIONER TAKES THE FIELD!',
      behavior: 'boss',
      rageThreshold: 0.4, rageDamageMult: 1.3,
      summonTypes: ['BTR', 'SNIPER', 'CONSCRIPT'], summonCount: 3, summonInterval: 14
    },

    // ── Stage-Specific Boss Types (Stages 5-12) ──────────────

    // Stage 5: MARIUPOL STEELWORKS — Forge Master amid molten steel
    BOSS_MARIUPOL: {
      id: 'BOSS_MARIUPOL', name: 'Azovstal Forge Master', tier: 4,
      hp: 800, speed: 1.8, damage: 55, attackRange: 10,
      color: 0xff4400, scale: 1.8, xpReward: 350,
      abilities: ['summon_reinforcements', 'rage_mode', 'flame_aura'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT', 'RARE_WEAPON'],
      spawnMessage: '🔥 THE FORGE MASTER EMERGES FROM THE FURNACE!',
      behavior: 'boss',
      burnDPS: 5, burnRadius: 6, // passive fire aura
      rageThreshold: 0.5, rageDamageMult: 1.6,
      summonTypes: ['FLAMETHROWER', 'SHIELD_BEARER'], summonCount: 3, summonInterval: 18
    },

    // Stage 6: CRIMEA BRIDGE — Admiral raining down naval fire
    BOSS_CRIMEA: {
      id: 'BOSS_CRIMEA', name: 'Kerch Bridge Admiral', tier: 4,
      hp: 1000, speed: 1.2, damage: 40, attackRange: 30,
      color: 0x2244aa, scale: 1.7, xpReward: 450,
      abilities: ['summon_reinforcements', 'rage_mode', 'naval_barrage'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT', 'RARE_WEAPON'],
      spawnMessage: '⚓ KERCH BRIDGE ADMIRAL ON DECK!',
      behavior: 'boss',
      barrageDamage: 100, barrageRadius: 6, barrageInterval: 10,
      rageThreshold: 0.4, rageDamageMult: 1.5,
      summonTypes: ['PARATROOP', 'KAMIKAZE_DRONE'], summonCount: 4, summonInterval: 16
    },

    // Stage 7: CHORNOBYL ZONE — Irradiated mutant commander, regenerates
    BOSS_CHORNOBYL: {
      id: 'BOSS_CHORNOBYL', name: 'Irradiated Stalker', tier: 4,
      hp: 1200, speed: 2.0, damage: 50, attackRange: 12,
      color: 0x44ff22, scale: 2.0, xpReward: 550,
      abilities: ['summon_reinforcements', 'rage_mode', 'radiation_aura', 'regeneration'],
      lootTable: ['WEAPON', 'ARMOR', 'MEDKIT', 'RARE_WEAPON', 'XP_BOOST'],
      spawnMessage: '☢️ IRRADIATED STALKER CRAWLS FROM THE REACTOR!',
      behavior: 'boss',
      radDPS: 8, radRadius: 10, // radiation damages player nearby
      regenRate: 15, // HP per second when not taking damage for 3s
      rageThreshold: 0.35, rageDamageMult: 1.7,
      summonTypes: ['WAR_DOG', 'BOMBER', 'WAGNER'], summonCount: 5, summonInterval: 14
    },

    // Stage 8: MOSCOW FINALE — Elite FSB field commander, fast & lethal
    BOSS_MOSCOW: {
      id: 'BOSS_MOSCOW', name: 'FSB Black Colonel', tier: 5,
      hp: 1800, speed: 3.0, damage: 65, attackRange: 18,
      color: 0x111111, scale: 1.6, xpReward: 700,
      abilities: ['summon_reinforcements', 'rage_mode', 'flashbang_salvo', 'tactical_dodge'],
      lootTable: ['RARE_WEAPON', 'ARMOR', 'MEDKIT', 'XP_BOOST'],
      spawnMessage: '🕶️ FSB BLACK COLONEL HAS ENTERED THE FIELD!',
      behavior: 'boss',
      dodgeChance: 0.25, flashbangInterval: 8,
      rageThreshold: 0.4, rageDamageMult: 1.8, rageSpeedMult: 1.5,
      summonTypes: ['SPETSNAZ', 'SNIPER_ELITE', 'EW_OPERATOR'], summonCount: 4, summonInterval: 15
    },

    // Stage 9: SEVASTOPOL NAVAL BASE — Fleet Commander with heavy ordnance
    BOSS_SEVASTOPOL: {
      id: 'BOSS_SEVASTOPOL', name: 'Black Sea Fleet Commander', tier: 5,
      hp: 2000, speed: 1.0, damage: 80, attackRange: 35,
      color: 0x335588, scale: 2.2, xpReward: 850,
      abilities: ['summon_reinforcements', 'rage_mode', 'cruise_missile', 'torpedo_salvo'],
      lootTable: ['RARE_WEAPON', 'ARMOR', 'MEDKIT', 'XP_BOOST', 'LEGENDARY_WEAPON'],
      spawnMessage: '🚢 BLACK SEA FLEET COMMANDER ORDERS ALL HANDS!',
      behavior: 'boss',
      missileDamage: 150, missileRadius: 7, missileInterval: 12,
      armorFront: 0.5, armorSide: 0.3,
      rageThreshold: 0.35, rageDamageMult: 1.6,
      summonTypes: ['BTR', 'DRONE_OP', 'HEAVY_SNIPER'], summonCount: 3, summonInterval: 20
    },

    // Stage 10: DONBAS FINAL PUSH — Entrenched warlord, overwhelming reinforcements
    BOSS_DONBAS: {
      id: 'BOSS_DONBAS', name: 'Donbas Warlord', tier: 5,
      hp: 2500, speed: 1.4, damage: 60, attackRange: 15,
      color: 0x553322, scale: 2.0, xpReward: 1000,
      abilities: ['summon_reinforcements', 'rage_mode', 'fortify', 'artillery_call'],
      lootTable: ['RARE_WEAPON', 'LEGENDARY_WEAPON', 'ARMOR', 'MEDKIT', 'XP_BOOST'],
      spawnMessage: '💀 THE DONBAS WARLORD CALLS HIS HORDE!',
      behavior: 'boss',
      artilleryDamage: 120, artilleryRadius: 5, artilleryInterval: 10,
      shieldHP: 300, // temporary barrier
      rageThreshold: 0.3, rageDamageMult: 1.8,
      summonTypes: ['KADYROVITE', 'WAGNER', 'COMMISSAR', 'MORTAR'], summonCount: 6, summonInterval: 12
    },

    // Stage 11: BELGOROD OFFENSIVE — Walking fortress general
    BOSS_BELGOROD: {
      id: 'BOSS_BELGOROD', name: 'Belgorod Iron General', tier: 5,
      hp: 3000, speed: 1.2, damage: 90, attackRange: 25,
      color: 0x445533, scale: 2.5, xpReward: 1200,
      abilities: ['summon_reinforcements', 'rage_mode', 'rocket_salvo', 'armor_plates'],
      lootTable: ['LEGENDARY_WEAPON', 'ARMOR', 'MEDKIT', 'XP_BOOST'],
      spawnMessage: '🛡️ THE IRON GENERAL ROLLS INTO BATTLE!',
      behavior: 'boss',
      armorFront: 0.6, armorSide: 0.4, armorRear: 0.15,
      rocketSalvoDmg: 130, rocketSalvoCount: 6, rocketInterval: 8,
      rageThreshold: 0.25, rageDamageMult: 2.0, rageArmorBoost: 0.2,
      summonTypes: ['TANK', 'THERMOBARIC', 'ASSAULT_MECH'], summonCount: 3, summonInterval: 22
    },

    // Stage 12: KREMLIN SHOWDOWN — The Tyrant, final boss of the game
    // Stage 13-17 unique bosses
    BOSS_KYIV: {
      id: 'BOSS_KYIV', name: 'Kyiv Column Commander', tier: 4,
      hp: 1800, speed: 1.8, damage: 70, attackRange: 18,
      color: 0x8b0000, scale: 2.2, xpReward: 1400,
      abilities: ['call_armor', 'artillery_strike', 'conscript_wave'],
      lootTable: ['NLAW_AMMO', 'HEALTH_PACK', 'XP_BOOST'],
      spawnMessage: '🪖 RUSSIAN COLUMN COMMANDER ADVANCES ON KYIV!',
      behavior: 'boss',
      phaseThresholds: [0.6, 0.3],
      summonTypes: ['CONSCRIPT', 'STORMER', 'PARATROOP'], summonCount: 4, summonInterval: 12
    },
    BOSS_SNAKE_ISLAND: {
      id: 'BOSS_SNAKE_ISLAND', name: 'Moskva Warship Captain', tier: 4,
      hp: 2000, speed: 1.2, damage: 80, attackRange: 25,
      color: 0x1a3a5a, scale: 2.4, xpReward: 1600,
      abilities: ['naval_barrage', 'depth_charge', 'marine_drop'],
      lootTable: ['HEALTH_PACK', 'XP_BOOST', 'AMMO_CRATE'],
      spawnMessage: '⚓ WARSHIP CAPTAIN: "SURRENDER OR DIE!"',
      behavior: 'boss',
      phaseThresholds: [0.7, 0.4],
      summonTypes: ['BTR', 'DRONE_OP', 'SNIPER_ELITE'], summonCount: 3, summonInterval: 14
    },
    BOSS_SAKY: {
      id: 'BOSS_SAKY', name: 'Black Sea Aviation General', tier: 4,
      hp: 1600, speed: 2.0, damage: 65, attackRange: 20,
      color: 0x2a2a4a, scale: 2.0, xpReward: 1300,
      abilities: ['airstrike_call', 'drone_swarm', 'scramble_jets'],
      lootTable: ['HEALTH_PACK', 'XP_BOOST', 'AMMO_CRATE'],
      spawnMessage: '✈ BLACK SEA AVIATION GENERAL SCRAMBLES!',
      behavior: 'boss',
      phaseThresholds: [0.65, 0.35],
      summonTypes: ['KAMIKAZE_DRONE', 'PARATROOP', 'SPETSNAZ'], summonCount: 4, summonInterval: 10
    },
    BOSS_VUHLEDAR: {
      id: 'BOSS_VUHLEDAR', name: 'Tank Corps Colonel', tier: 4,
      hp: 2200, speed: 1.4, damage: 90, attackRange: 22,
      color: 0x3a2800, scale: 2.6, xpReward: 1800,
      abilities: ['tank_column', 'artillery_prep', 'minefield_advance'],
      lootTable: ['AT_AMMO', 'HEALTH_PACK', 'XP_BOOST'],
      spawnMessage: '🚂 TANK CORPS COLONEL: STEEL AVALANCHE INCOMING!',
      behavior: 'boss',
      phaseThresholds: [0.6, 0.3],
      summonTypes: ['TANK', 'BTR', 'HEAVY_SNIPER'], summonCount: 3, summonInterval: 16
    },
    BOSS_ANTONOV: {
      id: 'BOSS_ANTONOV', name: 'Logistics Rear Admiral', tier: 4,
      hp: 1400, speed: 1.6, damage: 55, attackRange: 16,
      color: 0x2a4a2a, scale: 2.0, xpReward: 1100,
      abilities: ['supply_drop', 'repair_team', 'mortar_screen'],
      lootTable: ['HEALTH_PACK', 'HEALTH_PACK', 'XP_BOOST'],
      spawnMessage: '🚢 REAR ADMIRAL DEFENDS THE SUPPLY BRIDGE!',
      behavior: 'boss',
      phaseThresholds: [0.65, 0.35],
      summonTypes: ['ENGINEER', 'MORTAR', 'BTR'], summonCount: 3, summonInterval: 12
    },

    BOSS_KREMLIN: {
      id: 'BOSS_KREMLIN', name: 'The Zombie President', tier: 5,
      hp: 5000, speed: 1.5, damage: 100, attackRange: 20,
      color: 0x3a0a6a, scale: 3.0, xpReward: 2500,
      abilities: ['summon_reinforcements', 'rage_mode', 'nuclear_briefcase', 'body_doubles', 'bunker_shield'],
      lootTable: ['LEGENDARY_WEAPON', 'LEGENDARY_WEAPON', 'XP_BOOST', 'VICTORY_TOKEN'],
      spawnMessage: '🧟 THE ZOMBIE PRESIDENT SHAMBLES FROM THE KREMLIN!',
      behavior: 'boss',
      phaseThresholds: [0.75, 0.5, 0.25],
      shieldHP: 800, shieldRegenRate: 5,
      nukeDamage: 250, nukeRadius: 12, nukeInterval: 20,
      rageThreshold: 0.25, rageDamageMult: 2.5, rageSpeedMult: 2.0,
      summonTypes: ['SPETSNAZ', 'ASSAULT_MECH', 'THERMOBARIC', 'SWARM_OP'], summonCount: 5, summonInterval: 15,
      zombie: true, baldHead: true
    },

    // New city bosses — Slavutych through Hostomel Airport
    BOSS_SLAVUTYCH: {
      id: 'BOSS_SLAVUTYCH', name: 'Exclusion Zone Warden', tier: 3,
      hp: 800, speed: 1.3, damage: 50, attackRange: 18,
      color: 0x2a4a22, scale: 1.6, xpReward: 350,
      abilities: ['summon_reinforcements', 'radiation_burst'],
      lootTable: ['MEDKIT', 'RARE_WEAPON', 'ARMOR'],
      spawnMessage: '☢ THE EXCLUSION ZONE WARDEN EMERGES FROM THE REACTOR SHADOW!',
      behavior: 'boss'
    },
    BOSS_KREMENCHUK: {
      id: 'BOSS_KREMENCHUK', name: 'Missile Strike Commander', tier: 3,
      hp: 900, speed: 1.4, damage: 55, attackRange: 20,
      color: 0x553311, scale: 1.7, xpReward: 380,
      abilities: ['summon_reinforcements', 'artillery_call'],
      lootTable: ['MEDKIT', 'RARE_WEAPON', 'XP_BOOST'],
      spawnMessage: '🚀 THE MISSILE STRIKE COMMANDER CALLS IN ANOTHER SALVO!',
      behavior: 'boss',
      artilleryDamage: 80, artilleryRadius: 4, artilleryInterval: 12
    },
    BOSS_CHERKASY: {
      id: 'BOSS_CHERKASY', name: 'Dnipro River Blockade General', tier: 3,
      hp: 950, speed: 1.3, damage: 60, attackRange: 18,
      color: 0x2a3344, scale: 1.7, xpReward: 400,
      abilities: ['summon_reinforcements', 'fortify'],
      lootTable: ['RARE_WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '⚔ THE DNIPRO BLOCKADE GENERAL TAKES THE BRIDGE!',
      behavior: 'boss'
    },
    BOSS_DNIPRO_METRO: {
      id: 'BOSS_DNIPRO_METRO', name: 'Industrial Zone Overseer', tier: 4,
      hp: 1100, speed: 1.4, damage: 65, attackRange: 20,
      color: 0x334455, scale: 1.8, xpReward: 450,
      abilities: ['summon_reinforcements', 'artillery_call', 'rage_mode'],
      lootTable: ['RARE_WEAPON', 'RARE_WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '🏭 THE INDUSTRIAL ZONE OVERSEER DEPLOYS HIS GARRISON!',
      behavior: 'boss',
      artilleryDamage: 90, artilleryRadius: 4, artilleryInterval: 10,
      rageThreshold: 0.4, rageDamageMult: 1.6
    },
    BOSS_AZOVSTAL: {
      id: 'BOSS_AZOVSTAL', name: 'Azovstal Siege Marshal', tier: 4,
      hp: 1500, speed: 1.2, damage: 80, attackRange: 22,
      color: 0x221111, scale: 2.0, xpReward: 600,
      abilities: ['summon_reinforcements', 'rage_mode', 'artillery_call', 'fortify'],
      lootTable: ['RARE_WEAPON', 'LEGENDARY_WEAPON', 'ARMOR', 'MEDKIT', 'XP_BOOST'],
      spawnMessage: '⚙ THE AZOVSTAL SIEGE MARSHAL BRINGS THE STEEL WORKS DOWN!',
      behavior: 'boss',
      artilleryDamage: 100, artilleryRadius: 5, artilleryInterval: 8,
      rageThreshold: 0.35, rageDamageMult: 1.8,
      summonTypes: ['SPETSNAZ', 'MORTAR', 'COMMISSAR'], summonCount: 4, summonInterval: 14
    },
    BOSS_KHERSON_BRIDGE: {
      id: 'BOSS_KHERSON_BRIDGE', name: 'River Crossing General', tier: 4,
      hp: 1200, speed: 1.4, damage: 70, attackRange: 20,
      color: 0x334466, scale: 1.8, xpReward: 500,
      abilities: ['summon_reinforcements', 'rocket_salvo', 'rage_mode'],
      lootTable: ['RARE_WEAPON', 'RARE_WEAPON', 'ARMOR', 'XP_BOOST'],
      spawnMessage: '🌊 THE RIVER CROSSING GENERAL HOLDS THE ANTONIVKA BRIDGE!',
      behavior: 'boss',
      rageThreshold: 0.4, rageDamageMult: 1.7
    },
    BOSS_ZAPORIZHZHIA_NPP: {
      id: 'BOSS_ZAPORIZHZHIA_NPP', name: 'Nuclear Plant Commandant', tier: 5,
      hp: 2000, speed: 1.3, damage: 90, attackRange: 25,
      color: 0x446633, scale: 2.2, xpReward: 750,
      abilities: ['summon_reinforcements', 'artillery_call', 'rage_mode', 'radiation_burst'],
      lootTable: ['LEGENDARY_WEAPON', 'RARE_WEAPON', 'ARMOR', 'MEDKIT', 'XP_BOOST'],
      spawnMessage: '☢ THE NUCLEAR PLANT COMMANDANT TRIGGERS REACTOR ALERT!',
      behavior: 'boss',
      artilleryDamage: 110, artilleryRadius: 5, artilleryInterval: 9,
      rageThreshold: 0.3, rageDamageMult: 2.0,
      summonTypes: ['SPETSNAZ', 'MORTAR', 'THERMOBARIC'], summonCount: 4, summonInterval: 12
    },
    BOSS_KRAMATORSK_STATION: {
      id: 'BOSS_KRAMATORSK_STATION', name: 'Railway Massacre Colonel', tier: 4,
      hp: 1300, speed: 1.5, damage: 75, attackRange: 20,
      color: 0x443322, scale: 1.9, xpReward: 550,
      abilities: ['summon_reinforcements', 'artillery_call', 'rage_mode'],
      lootTable: ['RARE_WEAPON', 'RARE_WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '💀 THE RAILWAY MASSACRE COLONEL ARRIVES BY ARMORED TRAIN!',
      behavior: 'boss',
      artilleryDamage: 95, artilleryRadius: 4, artilleryInterval: 10,
      rageThreshold: 0.35, rageDamageMult: 1.7
    },
    BOSS_BUCHA_MEMORIAL: {
      id: 'BOSS_BUCHA_MEMORIAL', name: 'Bucha Occupation Commander', tier: 4,
      hp: 1400, speed: 1.4, damage: 80, attackRange: 22,
      color: 0x333322, scale: 2.0, xpReward: 600,
      abilities: ['summon_reinforcements', 'rage_mode', 'fortify'],
      lootTable: ['RARE_WEAPON', 'LEGENDARY_WEAPON', 'ARMOR', 'MEDKIT'],
      spawnMessage: '💀 THE BUCHA OCCUPATION COMMANDER MUST BE BROUGHT TO JUSTICE!',
      behavior: 'boss',
      rageThreshold: 0.3, rageDamageMult: 1.9,
      summonTypes: ['KADYROVITE', 'SPETSNAZ', 'COMMISSAR'], summonCount: 5, summonInterval: 13
    },
    BOSS_HOSTOMEL_AIRPORT_RAID: {
      id: 'BOSS_HOSTOMEL_AIRPORT_RAID', name: 'VDV Heliborne Strike Colonel', tier: 4,
      hp: 1200, speed: 1.6, damage: 70, attackRange: 18,
      color: 0x334433, scale: 1.8, xpReward: 520,
      abilities: ['summon_reinforcements', 'rocket_salvo', 'rage_mode'],
      lootTable: ['RARE_WEAPON', 'RARE_WEAPON', 'ARMOR', 'XP_BOOST'],
      spawnMessage: '🚁 THE VDV HELIBORNE STRIKE COLONEL DESCENDS ON HOSTOMEL!',
      behavior: 'boss',
      rageThreshold: 0.4, rageDamageMult: 1.7
    },

    // Feature 17: Suicide Bomber
    BOMBER: {
      id: 'BOMBER', name: 'Suicide Bomber', tier: 2,
      hp: 30, speed: 6, damage: 0, attackRange: 2,
      color: 0xff4400, scale: 1.0, xpReward: 35,
      explosionDamage: 150, explosionRadius: 5,
      behavior: 'rush_and_explode',
      warningBeep: true, beepInterval: 0.5
    },
    // Feature 18: Sniper
    SNIPER_ELITE: {
      id: 'SNIPER_ELITE', name: 'Elite Sniper', tier: 3,
      hp: 60, speed: 1, damage: 70, attackRange: 50,
      color: 0x445544, scale: 1.0, xpReward: 80,
      aimTime: 2.0, relocateAfterShots: 2,
      laserSight: true, laserColor: 0xff0000,
      behavior: 'camp_and_snipe'
    },
    // Feature 19: Medic
    MEDIC: {
      id: 'MEDIC', name: 'Combat Medic', tier: 2,
      hp: 80, speed: 3, damage: 15, attackRange: 6,
      color: 0xffffff, scale: 1.0, xpReward: 60,
      healRange: 8, healRate: 15, healInterval: 2,
      priorityTarget: true, // player should target medics first
      behavior: 'heal_allies'
    },
    // Feature 20: Engineer
    ENGINEER: {
      id: 'ENGINEER', name: 'Combat Engineer', tier: 2,
      hp: 90, speed: 2.5, damage: 20, attackRange: 5,
      color: 0x886644, scale: 1.1, xpReward: 55,
      buildInterval: 8, // seconds between placing cover
      coverHP: 40,
      behavior: 'build_and_fight'
    },
    // Feature 21: War Dog
    WAR_DOG: {
      id: 'WAR_DOG', name: 'Attack Dog', tier: 1,
      hp: 25, speed: 9, damage: 25, attackRange: 1.5,
      color: 0x554433, scale: 0.6, xpReward: 20,
      leapRange: 5, leapDamage: 35, leapCooldown: 4,
      behavior: 'chase_and_leap'
    },
    // Feature 22: Shield Bearer
    SHIELD_BEARER: {
      id: 'SHIELD_BEARER', name: 'Riot Shield', tier: 2,
      hp: 120, speed: 2, damage: 18, attackRange: 2,
      color: 0x333333, scale: 1.2, xpReward: 50,
      shieldHP: 200, shieldArc: Math.PI * 0.6, // frontal shield
      behavior: 'advance_with_shield'
    },
    // Feature 23: Mortar
    MORTAR: {
      id: 'MORTAR', name: 'Mortar Team', tier: 3,
      hp: 70, speed: 1, damage: 0, attackRange: 40,
      color: 0x666633, scale: 1.1, xpReward: 75,
      mortarDamage: 80, mortarRadius: 4, mortarInterval: 5,
      setupTime: 3, // seconds to deploy mortar
      behavior: 'indirect_fire'
    },
    // Feature 24: Flamethrower
    FLAMETHROWER: {
      id: 'FLAMETHROWER', name: 'Flamethrower', tier: 3,
      hp: 100, speed: 2.5, damage: 0, attackRange: 10,
      color: 0xff6600, scale: 1.1, xpReward: 85,
      flameDamage: 25, flameRate: 0.1, flameRange: 10,
      burnDuration: 3, burnDPS: 8,
      behavior: 'advance_and_burn'
    },
    // Feature 25: Paratroop
    PARATROOP: {
      id: 'PARATROOP', name: 'VDV Paratrooper', tier: 2,
      hp: 75, speed: 4.5, damage: 28, attackRange: 12,
      color: 0x4466aa, scale: 1.0, xpReward: 65,
      dropHeight: 30, parachuteSpeed: 3,
      behavior: 'air_drop_assault'
    },
    // Feature 26: T-72 Tank
    TANK: {
      id: 'TANK', name: 'T-72B3 Tank', tier: 4,
      hp: 1500, speed: 1.2, damage: 200, attackRange: 35,
      color: 0x445533, scale: 2.5, xpReward: 300,
      armorFront: 0.8, armorSide: 0.5, armorRear: 0.2,
      reloadTime: 4, mgDamage: 15, mgRate: 0.15,
      behavior: 'tank_advance'
    },
    // Feature 27: Drone Operator
    DRONE_OP: {
      id: 'DRONE_OP', name: 'FPV Drone Operator', tier: 2,
      hp: 50, speed: 1.5, damage: 10, attackRange: 5,
      color: 0x888888, scale: 1.0, xpReward: 70,
      droneHP: 15, droneDamage: 100, droneSpeed: 12,
      droneInterval: 4, maxDrones: 4,
      behavior: 'send_drones'
    },
    // Feature 28: Spetsnaz
    SPETSNAZ: {
      id: 'SPETSNAZ', name: 'Spetsnaz Operator', tier: 3,
      hp: 130, speed: 5, damage: 35, attackRange: 15,
      color: 0x1a1a1a, scale: 1.05, xpReward: 100,
      dodgeChance: 0.3, flashbangInterval: 12,
      canFlank: true, grenadeRange: 18,
      behavior: 'tactical_assault'
    },
    // Feature 29: Kadyrovite
    KADYROVITE: {
      id: 'KADYROVITE', name: 'Kadyrovite Fighter', tier: 2,
      hp: 95, speed: 3, damage: 22, attackRange: 10,
      color: 0x334411, scale: 1.1, xpReward: 55,
      rallyRadius: 12, rallyBuff: 1.3,
      behavior: 'rally_and_push'
    },
    // Feature 30: Wagner Prisoner
    WAGNER: {
      id: 'WAGNER', name: 'Wagner Convict', tier: 1,
      hp: 40, speed: 5.5, damage: 18, attackRange: 3,
      color: 0x554433, scale: 1.0, xpReward: 25,
      berserkerHP: 0.3, berserkerSpeedMult: 1.8,
      behavior: 'zerg_rush'
    },
    // Feature 31: BTR APC
    BTR: {
      id: 'BTR', name: 'BTR-82A APC', tier: 3,
      hp: 600, speed: 2.5, damage: 30, attackRange: 20,
      color: 0x445544, scale: 2.0, xpReward: 180,
      armorAll: 0.5, autocannonRate: 0.2,
      canSpawnInfantry: true, infantryCount: 3, infantryInterval: 15,
      behavior: 'apc_advance'
    },
    // Feature 32: Kamikaze Drone
    KAMIKAZE_DRONE: {
      id: 'KAMIKAZE_DRONE', name: 'Shahed Drone', tier: 2,
      hp: 20, speed: 8, damage: 0, attackRange: 1.5,
      color: 0x666666, scale: 0.5, xpReward: 40,
      explosionDamage: 120, explosionRadius: 4,
      flyHeight: 8, diveSpeed: 15,
      behavior: 'fly_and_dive'
    },
    // Feature 33: Officer
    OFFICER: {
      id: 'OFFICER', name: 'Russian Officer', tier: 3,
      hp: 110, speed: 2, damage: 25, attackRange: 12,
      color: 0x334455, scale: 1.15, xpReward: 120,
      buffRadius: 15, buffDamage: 1.25, buffSpeed: 1.2,
      callReinforcementInterval: 20, reinforceCount: 4,
      behavior: 'command_and_buff'
    },
    // Feature 34: Heavy Sniper
    HEAVY_SNIPER: {
      id: 'HEAVY_SNIPER', name: 'Anti-Material Sniper', tier: 4,
      hp: 90, speed: 0.8, damage: 120, attackRange: 60,
      color: 0x2a3a2a, scale: 1.1, xpReward: 150,
      aimTime: 3.0, relocateAfterShots: 1,
      penetration: true, canHitVehicles: true,
      laserSight: true, laserColor: 0x00ff00,
      behavior: 'camp_and_snipe'
    },
    // Feature 35: Commissar (political officer that prevents retreat)
    COMMISSAR: {
      id: 'COMMISSAR', name: 'Political Commissar', tier: 3,
      hp: 100, speed: 1.5, damage: 20, attackRange: 10,
      color: 0x880000, scale: 1.2, xpReward: 130,
      fearRadius: 20, moraleBuff: 1.5,
      preventsFlee: true, executesDeserters: true,
      behavior: 'command_and_execute'
    },
    // Feature 36: Thermobaric Launcher
    THERMOBARIC: {
      id: 'THERMOBARIC', name: 'TOS-1 Operator', tier: 4,
      hp: 80, speed: 1.2, damage: 0, attackRange: 35,
      color: 0xff3300, scale: 1.15, xpReward: 160,
      thermobaricDamage: 200, thermobaricRadius: 8,
      thermobaricInterval: 8, setupTime: 4,
      burnDuration: 5, burnDPS: 15,
      behavior: 'indirect_fire'
    },
    // Feature 37: Electronic Warfare Operator (jams player HUD)
    EW_OPERATOR: {
      id: 'EW_OPERATOR', name: 'EW Jammer', tier: 3,
      hp: 60, speed: 2, damage: 15, attackRange: 8,
      color: 0x4488aa, scale: 1.0, xpReward: 100,
      jamRadius: 25, jamEffect: 'hud_static',
      disablesMinimap: true, disablesCompass: true,
      behavior: 'hide_and_jam'
    },
    // Feature 38: Assault Mech (prototype heavy walker)
    ASSAULT_MECH: {
      id: 'ASSAULT_MECH', name: 'Assault Walker', tier: 5,
      hp: 3000, speed: 1.0, damage: 80, attackRange: 25,
      color: 0x444444, scale: 3.0, xpReward: 500,
      armorFront: 0.85, armorSide: 0.6, armorRear: 0.3,
      rocketSalvoDmg: 150, rocketSalvoCount: 4, rocketInterval: 6,
      mgDamage: 20, mgRate: 0.12,
      shieldHP: 500, shieldRegenRate: 10,
      behavior: 'mech_advance'
    },
    // Feature 39: Suicide Drone Swarm Operator
    SWARM_OP: {
      id: 'SWARM_OP', name: 'Drone Swarm Operator', tier: 3,
      hp: 45, speed: 1.0, damage: 8, attackRange: 5,
      color: 0x777777, scale: 1.0, xpReward: 110,
      swarmSize: 8, droneDamage: 40, droneSpeed: 15, droneHP: 8,
      swarmInterval: 8,
      behavior: 'send_swarm'
    }
  };

  /* ── Wave Composition Rules ────────────────── */
  const WAVE_COMPOSITIONS = {
    1:  { types: ['CONSCRIPT'], weights: [1] },
    2:  { types: ['CONSCRIPT', 'BOMBER'], weights: [0.8, 0.2] },
    3:  { types: ['CONSCRIPT', 'STORMER', 'WAR_DOG'], weights: [0.5, 0.3, 0.2] },
    4:  { types: ['CONSCRIPT', 'STORMER', 'SNIPER_ELITE', 'MEDIC'], weights: [0.4, 0.3, 0.15, 0.15] },
    5:  { types: ['BOSS', 'STORMER', 'SHIELD_BEARER'], weights: [0.05, 0.5, 0.45] },
    6:  { types: ['STORMER', 'ARMORED', 'ENGINEER', 'BOMBER'], weights: [0.3, 0.3, 0.2, 0.2] },
    7:  { types: ['ARMORED', 'SNIPER_ELITE', 'MORTAR', 'MEDIC'], weights: [0.3, 0.25, 0.25, 0.2] },
    8:  { types: ['ARMORED', 'SHIELD_BEARER', 'ENGINEER', 'MORTAR'], weights: [0.3, 0.25, 0.25, 0.2] },
    9:  { types: ['BOSS', 'ARMORED', 'SNIPER_ELITE', 'BOMBER', 'WAR_DOG'], weights: [0.05, 0.3, 0.25, 0.2, 0.2] },
    10: { types: ['BOSS', 'ARMORED', 'SHIELD_BEARER', 'MORTAR', 'SNIPER_ELITE', 'MEDIC'], weights: [0.1, 0.25, 0.2, 0.15, 0.15, 0.15] },
    // Stage 5+ waves: introduce new types
    11: { types: ['FLAMETHROWER', 'WAGNER', 'KADYROVITE', 'STORMER', 'MEDIC'], weights: [0.2, 0.25, 0.2, 0.2, 0.15] },
    12: { types: ['PARATROOP', 'SPETSNAZ', 'DRONE_OP', 'SNIPER_ELITE'], weights: [0.25, 0.25, 0.25, 0.25] },
    13: { types: ['BTR', 'FLAMETHROWER', 'SHIELD_BEARER', 'WAGNER', 'KAMIKAZE_DRONE'], weights: [0.1, 0.2, 0.2, 0.3, 0.2] },
    14: { types: ['TANK', 'SPETSNAZ', 'OFFICER', 'MORTAR', 'DRONE_OP'], weights: [0.08, 0.25, 0.17, 0.25, 0.25] },
    15: { types: ['BOSS', 'TANK', 'SPETSNAZ', 'KAMIKAZE_DRONE', 'FLAMETHROWER', 'OFFICER'], weights: [0.08, 0.12, 0.2, 0.2, 0.2, 0.2] },
    // Stages 9-10: Naval & Donbas endgame waves
    16: { types: ['HEAVY_SNIPER', 'BTR', 'SPETSNAZ', 'DRONE_OP', 'SHIELD_BEARER', 'SWARM_OP'], weights: [0.12, 0.12, 0.2, 0.2, 0.16, 0.2] },
    17: { types: ['COMMISSAR', 'WAGNER', 'KADYROVITE', 'FLAMETHROWER', 'MORTAR'], weights: [0.1, 0.25, 0.2, 0.25, 0.2] },
    18: { types: ['THERMOBARIC', 'TANK', 'HEAVY_SNIPER', 'SPETSNAZ', 'EW_OPERATOR'], weights: [0.1, 0.15, 0.2, 0.3, 0.25] },
    19: { types: ['BOSS', 'THERMOBARIC', 'COMMISSAR', 'BTR', 'SWARM_OP', 'HEAVY_SNIPER', 'DRONE_OP'], weights: [0.07, 0.13, 0.1, 0.18, 0.22, 0.18, 0.12] },
    20: { types: ['BOSS', 'ASSAULT_MECH', 'TANK', 'THERMOBARIC', 'SWARM_OP', 'SPETSNAZ', 'DRONE_OP'], weights: [0.08, 0.05, 0.13, 0.18, 0.22, 0.2, 0.14] },
    // Stages 11-12: Belgorod & Kremlin — maximum intensity
    21: { types: ['ASSAULT_MECH', 'HEAVY_SNIPER', 'COMMISSAR', 'EW_OPERATOR', 'THERMOBARIC', 'SWARM_OP', 'DRONE_OP'], weights: [0.07, 0.17, 0.13, 0.15, 0.18, 0.18, 0.12] },
    22: { types: ['BOSS', 'ASSAULT_MECH', 'TANK', 'BTR', 'THERMOBARIC', 'SWARM_OP', 'COMMISSAR', 'DRONE_OP'], weights: [0.09, 0.07, 0.11, 0.14, 0.18, 0.18, 0.13, 0.1] },
    23: { types: ['BOSS', 'ASSAULT_MECH', 'HEAVY_SNIPER', 'SPETSNAZ', 'THERMOBARIC', 'EW_OPERATOR', 'SWARM_OP', 'DRONE_OP'], weights: [0.11, 0.09, 0.14, 0.16, 0.14, 0.14, 0.14, 0.08] },
    // Wave 24 = Kremlin final — everything
    24: { types: ['BOSS', 'ASSAULT_MECH', 'TANK', 'THERMOBARIC', 'HEAVY_SNIPER', 'COMMISSAR', 'SWARM_OP', 'SPETSNAZ', 'DRONE_OP'], weights: [0.13, 0.11, 0.11, 0.11, 0.11, 0.11, 0.12, 0.12, 0.08] },
  };

  /* ── AI Behavior State ─────────────────────── */
  let activeEnemies = [];

  function init() { activeEnemies = []; }

  function selectType(wave) {
    const comp = WAVE_COMPOSITIONS[Math.min(wave, 24)] || WAVE_COMPOSITIONS[24];
    const roll = Math.random();
    let cumulative = 0;
    for (let i = 0; i < comp.types.length; i++) {
      cumulative += comp.weights[i];
      if (roll < cumulative) return comp.types[i];
    }
    return comp.types[0];
  }

  function getTypeConfig(typeId) {
    return TYPES[typeId] || null;
  }

  /* ── Per-Type AI Update Helpers ────────────── */
  function updateBomber(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // beeping gets faster as closer
    enemy._beepTimer = (enemy._beepTimer || 0) - dt;
    const beepRate = Math.max(0.1, dist * 0.05);
    const shouldBeep = enemy._beepTimer <= 0;
    if (shouldBeep) enemy._beepTimer = beepRate;
    // check detonation
    if (dist < TYPES.BOMBER.attackRange) {
      return {
        detonate: true,
        x: enemy.x, y: enemy.y, z: enemy.z,
        damage: TYPES.BOMBER.explosionDamage,
        radius: TYPES.BOMBER.explosionRadius
      };
    }
    return { beep: shouldBeep };
  }

  function updateSniper(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    enemy._aimTimer = (enemy._aimTimer || 0) + dt;
    enemy._shotCount = enemy._shotCount || 0;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > TYPES.SNIPER_ELITE.attackRange) return null;
    if (enemy._aimTimer >= TYPES.SNIPER_ELITE.aimTime) {
      enemy._aimTimer = 0;
      enemy._shotCount++;
      const shouldRelocate = enemy._shotCount >= TYPES.SNIPER_ELITE.relocateAfterShots;
      if (shouldRelocate) enemy._shotCount = 0;
      return {
        fire: true, damage: TYPES.SNIPER_ELITE.damage,
        relocate: shouldRelocate
      };
    }
    return { aiming: true, progress: enemy._aimTimer / TYPES.SNIPER_ELITE.aimTime };
  }

  function updateMedic(enemy, allEnemies, dt) {
    if (!enemy.alive) return null;
    enemy._healTimer = (enemy._healTimer || 0) + dt;
    if (enemy._healTimer < TYPES.MEDIC.healInterval) return null;
    enemy._healTimer = 0;
    // find wounded ally in range
    const range = TYPES.MEDIC.healRange;
    for (const ally of allEnemies) {
      if (!ally || ally === enemy || !ally.alive) continue;
      const dx = ally.mesh.position.x - enemy.mesh.position.x, dz = ally.mesh.position.z - enemy.mesh.position.z;
      if (dx * dx + dz * dz < range * range) {
        const cfg = getTypeConfig(ally.typeName) || { hp: 50 };
        if (ally.hp < cfg.hp) {
          return { heal: true, target: ally, amount: TYPES.MEDIC.healRate };
        }
      }
    }
    return null;
  }

  function updateEngineer(enemy, dt, placeBlock) {
    if (!enemy.alive) return null;
    enemy._buildTimer = (enemy._buildTimer || 0) + dt;
    if (enemy._buildTimer >= TYPES.ENGINEER.buildInterval) {
      enemy._buildTimer = 0;
      // place a cover block nearby
      const bx = Math.floor(enemy.x + (Math.random() - 0.5) * 3);
      const bz = Math.floor(enemy.z + (Math.random() - 0.5) * 3);
      if (placeBlock) placeBlock(bx, Math.floor(enemy.y), bz, 9); // CONCRETE
      return { built: true, x: bx, z: bz };
    }
    return null;
  }

  function updateWarDog(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    enemy._leapCD = (enemy._leapCD || 0) - dt;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < TYPES.WAR_DOG.leapRange && enemy._leapCD <= 0) {
      enemy._leapCD = TYPES.WAR_DOG.leapCooldown;
      return { leap: true, damage: TYPES.WAR_DOG.leapDamage, dirX: dx / dist, dirZ: dz / dist };
    }
    return null;
  }

  function updateShieldBearer(enemy, playerPos) {
    if (!enemy.alive) return null;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const angleToPlayer = Math.atan2(dx, dz);
    const facingAngle = enemy.rotation || 0;
    let angleDiff = angleToPlayer - facingAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const shieldBlocking = Math.abs(angleDiff) < TYPES.SHIELD_BEARER.shieldArc / 2;
    return { shieldFacing: shieldBlocking, shieldHP: enemy._shieldHP || TYPES.SHIELD_BEARER.shieldHP };
  }

  function updateMortar(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    enemy._mortarTimer = (enemy._mortarTimer || 0) + dt;
    enemy._setupTimer = (enemy._setupTimer || 0) + dt;
    if (enemy._setupTimer < TYPES.MORTAR.setupTime) {
      return { settingUp: true, progress: enemy._setupTimer / TYPES.MORTAR.setupTime };
    }
    if (enemy._mortarTimer >= TYPES.MORTAR.mortarInterval) {
      enemy._mortarTimer = 0;
      // target player position with some scatter
      return {
        fire: true,
        targetX: playerPos.x + (Math.random() - 0.5) * 6,
        targetZ: playerPos.z + (Math.random() - 0.5) * 6,
        damage: TYPES.MORTAR.mortarDamage,
        radius: TYPES.MORTAR.mortarRadius
      };
    }
    return null;
  }

  function updateBoss(enemy, playerPos, dt, wave) {
    if (!enemy.alive) return null;
    const result = {};
    // Rage mode at < 50% HP — use actual maxHp so stage bosses phase correctly
    const bossMaxHP = enemy.maxHp || (TYPES.BOSS.hp + (wave - 1) * 50);
    if (enemy.hp < bossMaxHP * 0.5) {
      result.rageMode = true;
      enemy._rageMult = 1.5; // faster attacks
    }
    // Summon reinforcements using boss-specific interval + types when available
    const typeCfg = TYPES[enemy.typeName] || TYPES[enemy.typeCfg && enemy.typeCfg.name] || null;
    const summonInterval = (typeCfg && typeCfg.summonInterval) ? typeCfg.summonInterval : 15;
    enemy._summonTimer = (enemy._summonTimer || 0) + dt;
    if (enemy._summonTimer >= summonInterval) {
      enemy._summonTimer = 0;
      result.summon = true;
      result.summonCount = (typeCfg && typeCfg.summonCount) ? typeCfg.summonCount : (2 + Math.floor(wave / 3));
      result.summonTypes = (typeCfg && typeCfg.summonTypes && typeCfg.summonTypes.length) ? typeCfg.summonTypes : null;
    }
    // Nuclear briefcase ability (BOSS_KREMLIN)
    var hasNuke = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('nuclear_briefcase') !== -1;
    if (hasNuke) {
      var nukeInterval = typeCfg.nukeInterval || 20;
      // Start at half interval so first strike isn't instant
      if (enemy._nukeTimer === undefined) enemy._nukeTimer = nukeInterval * 0.5;
      enemy._nukeTimer += dt;
      if (enemy._nukeTimer >= nukeInterval) {
        enemy._nukeTimer = 0;
        result.nuclearStrike = {
          damage:  typeCfg.nukeDamage  || 250,
          radius:  typeCfg.nukeRadius  || 12,
          targetX: playerPos.x,
          targetY: playerPos.y,
          targetZ: playerPos.z
        };
      }
    }
    // Bunker shield — periodic invincibility when ability is present
    var hasShield = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('bunker_shield') !== -1;
    if (hasShield) {
      enemy._shieldCooldown = (enemy._shieldCooldown || 0) - dt;
      enemy._shieldActive   = (enemy._shieldActive  || false);
      if (!enemy._shieldActive && enemy._shieldCooldown <= 0) {
        enemy._shieldActive   = true;
        enemy._shieldTimer    = 4;      // 4s of invincibility
        enemy._shieldCooldown = 25;     // 25s between phases
        result.bunkerShieldOn = true;
      }
      if (enemy._shieldActive) {
        enemy._shieldTimer -= dt;
        if (enemy._shieldTimer <= 0) {
          enemy._shieldActive = false;
          result.bunkerShieldOff = true;
        }
      }
    }
    // Body doubles — spawn decoy bosses at 25% HP (once per fight)
    var hasDoubles = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('body_doubles') !== -1;
    if (hasDoubles && !enemy._doublesSpawned && enemy.hp < bossMaxHP * 0.25) {
      enemy._doublesSpawned = true;
      var bossPos = enemy.mesh ? enemy.mesh.position : null;
      result.bodyDoubles = {
        count: 2,
        x: bossPos ? bossPos.x : playerPos.x,
        z: bossPos ? bossPos.z : playerPos.z
      };
    }
    // Flame aura — passive fire ring that damages player when nearby
    var hasFlame = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('flame_aura') !== -1;
    if (hasFlame && typeCfg.burnDPS && typeCfg.burnRadius) {
      var dx = enemy.mesh ? (enemy.mesh.position.x - playerPos.x) : 99;
      var dz = enemy.mesh ? (enemy.mesh.position.z - playerPos.z) : 99;
      var distToPlayer = Math.sqrt(dx*dx + dz*dz);
      if (distToPlayer < typeCfg.burnRadius) {
        result.flameBurn = { dps: typeCfg.burnDPS, dist: distToPlayer, radius: typeCfg.burnRadius };
      }
    }
    // Radiation aura + regeneration — BOSS_CHORNOBYL
    var hasRad = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('radiation_aura') !== -1;
    if (hasRad && typeCfg.radDPS && typeCfg.radRadius) {
      var rdx = enemy.mesh ? (enemy.mesh.position.x - playerPos.x) : 99;
      var rdz = enemy.mesh ? (enemy.mesh.position.z - playerPos.z) : 99;
      var radDist = Math.sqrt(rdx*rdx + rdz*rdz);
      if (radDist < typeCfg.radRadius) {
        result.radBurn = { dps: typeCfg.radDPS, dist: radDist, radius: typeCfg.radRadius };
      }
    }
    var hasRegen = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('regeneration') !== -1;
    if (hasRegen && typeCfg.regenRate) {
      // Track last damage time on enemy
      if (!enemy._regenTimer) enemy._regenTimer = 0;
      // Only regen if haven't been hit for 3s and not at max HP
      enemy._regenTimer += dt;
      if (enemy._regenTimer > 3 && enemy.hp < bossMaxHP) {
        var regenAmt = typeCfg.regenRate * dt;
        enemy.hp = Math.min(bossMaxHP, enemy.hp + regenAmt);
        result.regen = true;
      }
    }
    // Naval barrage (BOSS_CRIMEA) — periodic shell salvo at player position
    var hasBarrage = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('naval_barrage') !== -1;
    if (hasBarrage && typeCfg.barrageInterval) {
      enemy._barrageTimer = (enemy._barrageTimer || typeCfg.barrageInterval * 0.6) + dt;
      if (enemy._barrageTimer >= typeCfg.barrageInterval) {
        enemy._barrageTimer = 0;
        result.navalBarrage = {
          damage: typeCfg.barrageDamage || 80,
          radius: typeCfg.barrageRadius || 6,
          targetX: playerPos.x,
          targetZ: playerPos.z
        };
      }
    }
    // Flashbang salvo (BOSS_MOSCOW) — blinds player on interval
    var hasFlash = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('flashbang_salvo') !== -1;
    if (hasFlash && typeCfg.flashbangInterval) {
      if (enemy._flashTimer === undefined) enemy._flashTimer = typeCfg.flashbangInterval * 0.7;
      enemy._flashTimer += dt;
      if (enemy._flashTimer >= typeCfg.flashbangInterval) {
        enemy._flashTimer = 0;
        result.flashbangSalvo = { targetX: playerPos.x, targetZ: playerPos.z };
      }
    }
    // Cruise missile (BOSS_SEVASTOPOL) — big delayed single impact
    var hasMissile = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('cruise_missile') !== -1;
    if (hasMissile && typeCfg.missileInterval) {
      if (enemy._missileTimer === undefined) enemy._missileTimer = typeCfg.missileInterval * 0.5;
      enemy._missileTimer += dt;
      if (enemy._missileTimer >= typeCfg.missileInterval) {
        enemy._missileTimer = 0;
        result.cruiseMissile = {
          damage: typeCfg.missileDamage || 150,
          radius: typeCfg.missileRadius || 7,
          targetX: playerPos.x,
          targetZ: playerPos.z
        };
      }
    }
    // Artillery call (BOSS_DONBAS) — rapid barrage of close shells
    var hasArtCall = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('artillery_call') !== -1;
    if (hasArtCall && typeCfg.artilleryInterval) {
      if (enemy._artCallTimer === undefined) enemy._artCallTimer = typeCfg.artilleryInterval * 0.4;
      enemy._artCallTimer += dt;
      if (enemy._artCallTimer >= typeCfg.artilleryInterval) {
        enemy._artCallTimer = 0;
        result.artilleryCall = {
          damage: typeCfg.artilleryDamage || 120,
          radius: typeCfg.artilleryRadius || 5,
          targetX: playerPos.x,
          targetZ: playerPos.z
        };
      }
    }
    // Rocket salvo (BOSS_BELGOROD) — burst of rockets at player in quick succession
    var hasRockets = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('rocket_salvo') !== -1;
    if (hasRockets && typeCfg.rocketInterval) {
      if (enemy._rocketTimer === undefined) enemy._rocketTimer = typeCfg.rocketInterval * 0.5;
      enemy._rocketTimer += dt;
      if (enemy._rocketTimer >= typeCfg.rocketInterval) {
        enemy._rocketTimer = 0;
        result.rocketSalvo = {
          damage: typeCfg.rocketSalvoDmg || 130,
          count:  typeCfg.rocketSalvoCount || 6,
          targetX: playerPos.x,
          targetZ: playerPos.z
        };
      }
    }
    // Drone swarm (BOSS_SAKY) — deploys kamikaze drones to hunt player
    var hasDroneSwarm = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('drone_swarm') !== -1;
    if (hasDroneSwarm) {
      var swarmInterval = 22;
      if (enemy._droneSwarmTimer === undefined) enemy._droneSwarmTimer = swarmInterval * 0.6;
      enemy._droneSwarmTimer += dt;
      if (enemy._droneSwarmTimer >= swarmInterval) {
        enemy._droneSwarmTimer = 0;
        result.droneSwarm = { count: 4 };
      }
    }
    // Mortar screen (BOSS_ANTONOV) — dense mortar barrage around player position
    var hasMortarScreen = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('mortar_screen') !== -1;
    if (hasMortarScreen) {
      var msInterval = 14;
      if (enemy._mortarScreenTimer === undefined) enemy._mortarScreenTimer = msInterval * 0.5;
      enemy._mortarScreenTimer += dt;
      if (enemy._mortarScreenTimer >= msInterval) {
        enemy._mortarScreenTimer = 0;
        result.mortarScreen = {
          damage: 70,
          targetX: playerPos.x,
          targetZ: playerPos.z
        };
      }
    }
    // call_armor (BOSS_KYIV) — calls in armored vehicle support
    var hasCallArmor = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('call_armor') !== -1;
    if (hasCallArmor) {
      var caInterval = typeCfg.callArmorInterval || 20;
      if (enemy._callArmorTimer === undefined) enemy._callArmorTimer = caInterval * 0.7;
      enemy._callArmorTimer += dt;
      if (enemy._callArmorTimer >= caInterval) {
        enemy._callArmorTimer = 0;
        result.callArmor = { count: 2, types: typeCfg.summonTypes || ['BTR', 'TANK'] };
      }
    }
    // artillery_strike (BOSS_KYIV) — targeted artillery on player
    var hasArtilleryStrike = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('artillery_strike') !== -1;
    if (hasArtilleryStrike) {
      var asInterval = typeCfg.artilleryStrikeInterval || 15;
      if (enemy._artilleryStrikeTimer === undefined) enemy._artilleryStrikeTimer = asInterval * 0.6;
      enemy._artilleryStrikeTimer += dt;
      if (enemy._artilleryStrikeTimer >= asInterval) {
        enemy._artilleryStrikeTimer = 0;
        result.artilleryStrike = {
          damage: typeCfg.artilleryStrikeDmg || 100,
          radius: typeCfg.artilleryStrikeRadius || 6,
          targetX: playerPos.x, targetZ: playerPos.z
        };
      }
    }
    // conscript_wave (BOSS_KYIV) — floods the zone with conscripts
    var hasConscriptWave = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('conscript_wave') !== -1;
    if (hasConscriptWave) {
      var cwInterval = typeCfg.conscriptWaveInterval || 25;
      if (enemy._conscriptWaveTimer === undefined) enemy._conscriptWaveTimer = cwInterval * 0.5;
      enemy._conscriptWaveTimer += dt;
      if (enemy._conscriptWaveTimer >= cwInterval) {
        enemy._conscriptWaveTimer = 0;
        result.conscriptWave = { count: typeCfg.conscriptWaveCount || 5 };
      }
    }
    // depth_charge (BOSS_SNAKE_ISLAND) — drops AoE blasts in a wide pattern
    var hasDepthCharge = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('depth_charge') !== -1;
    if (hasDepthCharge) {
      var dcInterval = typeCfg.depthChargeInterval || 12;
      if (enemy._depthChargeTimer === undefined) enemy._depthChargeTimer = dcInterval * 0.6;
      enemy._depthChargeTimer += dt;
      if (enemy._depthChargeTimer >= dcInterval) {
        enemy._depthChargeTimer = 0;
        result.depthCharge = {
          damage: typeCfg.depthChargeDmg || 90,
          radius: typeCfg.depthChargeRadius || 8,
          count: 4,
          targetX: playerPos.x, targetZ: playerPos.z
        };
      }
    }
    // marine_drop (BOSS_SNAKE_ISLAND) — air-drops marines at strategic positions
    var hasMarineDrop = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('marine_drop') !== -1;
    if (hasMarineDrop) {
      var mdInterval = typeCfg.marineDropInterval || 18;
      if (enemy._marineDropTimer === undefined) enemy._marineDropTimer = mdInterval * 0.8;
      enemy._marineDropTimer += dt;
      if (enemy._marineDropTimer >= mdInterval) {
        enemy._marineDropTimer = 0;
        result.marineDrop = { count: typeCfg.marineDropCount || 3 };
      }
    }
    // airstrike_call (BOSS_SAKY) — carpet bombing run across player position
    var hasAirstrikeCall = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('airstrike_call') !== -1;
    if (hasAirstrikeCall) {
      var acInterval = typeCfg.airstrikeInterval || 18;
      if (enemy._airstrikeCallTimer === undefined) enemy._airstrikeCallTimer = acInterval * 0.5;
      enemy._airstrikeCallTimer += dt;
      if (enemy._airstrikeCallTimer >= acInterval) {
        enemy._airstrikeCallTimer = 0;
        result.airstrikeCall = {
          damage: typeCfg.airstrikeDmg || 110,
          radius: typeCfg.airstrikeRadius || 5,
          bombCount: 6,
          targetX: playerPos.x, targetZ: playerPos.z
        };
      }
    }
    // scramble_jets (BOSS_SAKY) — strafing run dealing rapid light damage
    var hasScrambleJets = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('scramble_jets') !== -1;
    if (hasScrambleJets) {
      var sjInterval = typeCfg.scrambleInterval || 14;
      if (enemy._scrambleJetsTimer === undefined) enemy._scrambleJetsTimer = sjInterval * 0.7;
      enemy._scrambleJetsTimer += dt;
      if (enemy._scrambleJetsTimer >= sjInterval) {
        enemy._scrambleJetsTimer = 0;
        result.scrambleJets = {
          damage: typeCfg.scrambleDmg || 30,
          strafePasses: 3,
          targetX: playerPos.x, targetZ: playerPos.z
        };
      }
    }
    // tank_column (BOSS_VUHLEDAR) — summons a column of tanks
    var hasTankColumn = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('tank_column') !== -1;
    if (hasTankColumn) {
      var tcInterval = typeCfg.tankColumnInterval || 22;
      if (enemy._tankColumnTimer === undefined) enemy._tankColumnTimer = tcInterval * 0.6;
      enemy._tankColumnTimer += dt;
      if (enemy._tankColumnTimer >= tcInterval) {
        enemy._tankColumnTimer = 0;
        result.tankColumn = { count: typeCfg.tankColumnCount || 2 };
      }
    }
    // artillery_prep (BOSS_VUHLEDAR) — preparatory bombardment before infantry advance
    var hasArtilleryPrep = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('artillery_prep') !== -1;
    if (hasArtilleryPrep) {
      var apInterval = typeCfg.artilleryPrepInterval || 16;
      if (enemy._artilleryPrepTimer === undefined) enemy._artilleryPrepTimer = apInterval * 0.5;
      enemy._artilleryPrepTimer += dt;
      if (enemy._artilleryPrepTimer >= apInterval) {
        enemy._artilleryPrepTimer = 0;
        result.artilleryPrep = {
          damage: typeCfg.artilleryPrepDmg || 80,
          radius: typeCfg.artilleryPrepRadius || 7,
          shellCount: 7,
          targetX: playerPos.x, targetZ: playerPos.z
        };
      }
    }
    // minefield_advance (BOSS_VUHLEDAR) — scatter proximity mines around player
    var hasMinefieldAdvance = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('minefield_advance') !== -1;
    if (hasMinefieldAdvance) {
      var mfInterval = typeCfg.minefieldInterval || 20;
      if (enemy._minefieldTimer === undefined) enemy._minefieldTimer = mfInterval * 0.4;
      enemy._minefieldTimer += dt;
      if (enemy._minefieldTimer >= mfInterval) {
        enemy._minefieldTimer = 0;
        result.minefieldAdvance = {
          mineCount: typeCfg.mineCount || 6,
          mineDamage: typeCfg.mineDamage || 85,
          spreadRadius: 12,
          targetX: playerPos.x, targetZ: playerPos.z
        };
      }
    }
    // supply_drop (BOSS_ANTONOV) — boss heals nearby enemy allies
    var hasSupplyDrop = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('supply_drop') !== -1;
    if (hasSupplyDrop) {
      var sdInterval = typeCfg.supplyDropInterval || 18;
      if (enemy._supplyDropTimer === undefined) enemy._supplyDropTimer = sdInterval * 0.7;
      enemy._supplyDropTimer += dt;
      if (enemy._supplyDropTimer >= sdInterval) {
        enemy._supplyDropTimer = 0;
        result.supplyDrop = { healAmount: typeCfg.supplyHealAmount || 80, healRadius: 15 };
      }
    }
    // repair_team (BOSS_ANTONOV) — spawns combat engineers to repair/heal
    var hasRepairTeam = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('repair_team') !== -1;
    if (hasRepairTeam) {
      var rtInterval = typeCfg.repairTeamInterval || 24;
      if (enemy._repairTeamTimer === undefined) enemy._repairTeamTimer = rtInterval * 0.8;
      enemy._repairTeamTimer += dt;
      if (enemy._repairTeamTimer >= rtInterval) {
        enemy._repairTeamTimer = 0;
        result.repairTeam = { count: typeCfg.repairTeamCount || 2 };
      }
    }

    // fortify (BOSS_DONBAS) — periodic absorbing barrier that eats incoming damage
    var hasFortify = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('fortify') !== -1;
    if (hasFortify) {
      if (enemy._fortifyTimer === undefined) enemy._fortifyTimer = 12;
      enemy._fortifyTimer += dt;
      if (enemy._fortifyActive) {
        enemy._fortifyDuration = (enemy._fortifyDuration || 0) - dt;
        if (enemy._fortifyDuration <= 0) {
          enemy._fortifyActive = false;
          enemy._fortifyShieldHP = 0;
          result.fortifyExpired = true;
        }
      } else if (enemy._fortifyTimer >= 25) {
        enemy._fortifyTimer = 0;
        enemy._fortifyShieldHP = typeCfg.shieldHP || 300;
        enemy._fortifyActive = true;
        enemy._fortifyDuration = 8;
        result.fortify = { shieldHP: enemy._fortifyShieldHP };
      }
    }

    // armor_plates (BOSS_BELGOROD) — timed heavy armor period
    var hasArmorPlates = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('armor_plates') !== -1;
    if (hasArmorPlates) {
      if (enemy._armorPlatesTimer === undefined) enemy._armorPlatesTimer = 10;
      enemy._armorPlatesTimer += dt;
      if (enemy._armorPlatesActive) {
        enemy._armorPlatesDuration = (enemy._armorPlatesDuration || 0) - dt;
        if (enemy._armorPlatesDuration <= 0) {
          enemy._armorPlatesActive = false;
          result.armorPlatesExpired = true;
        }
      } else if (enemy._armorPlatesTimer >= 20) {
        enemy._armorPlatesTimer = 0;
        enemy._armorPlatesActive = true;
        enemy._armorPlatesDuration = 10;
        result.armorPlates = {
          reduction: (typeCfg.armorFront || 0.6)
        };
      }
    }

    // torpedo_salvo (BOSS_SEVASTOPOL) — spread of 5 torpedo blasts toward player
    var hasTorpedo = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('torpedo_salvo') !== -1;
    if (hasTorpedo) {
      if (enemy._torpedoTimer === undefined) enemy._torpedoTimer = 6;
      enemy._torpedoTimer += dt;
      if (enemy._torpedoTimer >= 10) {
        enemy._torpedoTimer = 0;
        result.torpedoSalvo = {
          count: 5,
          damage: 80,
          radius: 5,
          spread: 10,
          targetX: playerPos.x,
          targetZ: playerPos.z
        };
      }
    }

    // shield_bash (generic BOSS) — melee slam when player is close
    var hasShieldBash = typeCfg && typeCfg.abilities && typeCfg.abilities.indexOf('shield_bash') !== -1;
    if (hasShieldBash) {
      if (enemy._shieldBashTimer === undefined) enemy._shieldBashTimer = 4;
      enemy._shieldBashTimer += dt;
      var _sbDx = enemy.mesh ? (enemy.mesh.position.x - playerPos.x) : 99;
      var _sbDz = enemy.mesh ? (enemy.mesh.position.z - playerPos.z) : 99;
      var _sbDist = Math.sqrt(_sbDx*_sbDx + _sbDz*_sbDz);
      if (enemy._shieldBashTimer >= 8 && _sbDist < 6) {
        enemy._shieldBashTimer = 0;
        result.shieldBash = { damage: 60, pushback: 8 };
      }
    }

    return result;
  }

  /* ── Damage handler for shield enemies ─────── */
  function applyDamage(enemy, damage, fromAngle) {
    if (enemy.type === 'SHIELD_BEARER') {
      const facingAngle = enemy.rotation || 0;
      let angleDiff = fromAngle - facingAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      if (Math.abs(angleDiff) < TYPES.SHIELD_BEARER.shieldArc / 2) {
        enemy._shieldHP = (enemy._shieldHP !== undefined ? enemy._shieldHP : TYPES.SHIELD_BEARER.shieldHP);
        enemy._shieldHP -= damage;
        if (enemy._shieldHP > 0) return 0; // shield absorbed
        const overflow = -enemy._shieldHP;
        enemy._shieldHP = 0;
        return overflow;
      }
    }
    return damage; // full damage (unshielded)
  }

  /* ── Boss scaling per wave ─────────────────── */
  function getBossHP(wave) { return TYPES.BOSS.hp + (wave - 1) * 50; }

  /* ── Stage-Specific Boss Selection ─────────── */
  const STAGE_BOSS_MAP = {
    1:  'BOSS_HOSTOMEL',      // VDV Airborne Assault Colonel
    2:  'BOSS_AVDIIVKA',      // Avdiivka Siege Commander
    3:  'BOSS_BAKHMUT',       // Bakhmut Butcher (Wagner Lt.)
    4:  'BOSS_KHERSON',       // Kherson Occupation Commissioner
    5:  'BOSS_MARIUPOL',      // Azovstal Forge Master
    6:  'BOSS_CRIMEA',        // Kerch Bridge Admiral
    7:  'BOSS_CHORNOBYL',     // Irradiated Stalker
    8:  'BOSS_MOSCOW',        // FSB Black Colonel
    9:  'BOSS_SEVASTOPOL',    // Black Sea Fleet Commander
    10: 'BOSS_DONBAS',        // Donbas Warlord
    11: 'BOSS_BELGOROD',      // Belgorod Iron General
    12: 'BOSS_KREMLIN',       // The Tyrant
    13: 'BOSS_KYIV',          // Kyiv Column Commander
    14: 'BOSS_SNAKE_ISLAND',  // Moskva Warship Captain
    15: 'BOSS_SAKY',          // Black Sea Aviation General
    16: 'BOSS_VUHLEDAR',      // Tank Corps Colonel
    17: 'BOSS_ANTONOV',       // Logistics Rear Admiral
    // 18 (Refinery FPV) is droneOnly/single-wave — no boss needed
    // New city levels — keyed by string level ID
    SLAVUTYCH:            'BOSS_SLAVUTYCH',
    KREMENCHUK:           'BOSS_KREMENCHUK',
    CHERKASY:             'BOSS_CHERKASY',
    DNIPRO_METRO:         'BOSS_DNIPRO_METRO',
    AZOVSTAL:             'BOSS_AZOVSTAL',
    KHERSON_BRIDGE:       'BOSS_KHERSON_BRIDGE',
    ZAPORIZHZHIA_NPP:     'BOSS_ZAPORIZHZHIA_NPP',
    KRAMATORSK_STATION:   'BOSS_KRAMATORSK_STATION',
    BUCHA_MEMORIAL:       'BOSS_BUCHA_MEMORIAL',
    HOSTOMEL_AIRPORT_RAID: 'BOSS_HOSTOMEL_AIRPORT_RAID',
  };

  /**
   * Returns the boss type ID for a given stage (1-based stage id or level string ID).
   * All combat stages have unique named bosses.
   */
  function getBossForStage(stageId) {
    return STAGE_BOSS_MAP[stageId] || 'BOSS';
  }

  /**
   * Returns max HP for any boss type, with optional wave-based scaling.
   * Stage bosses use their base HP + 5% per wave beyond their spawn wave.
   */
  function getStageBossHP(bossTypeId, wave) {
    const cfg = TYPES[bossTypeId];
    if (!cfg) return getBossHP(wave);
    return cfg.hp + Math.floor(wave * 0.05 * cfg.hp);
  }

  /* ── New AI update functions for B18 enemy types ─── */

  function updateFlamethrower(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < TYPES.FLAMETHROWER.flameRange) {
      enemy._flameTimer = (enemy._flameTimer || 0) + dt;
      if (enemy._flameTimer >= TYPES.FLAMETHROWER.flameRate) {
        enemy._flameTimer = 0;
        return { flame: true, damage: TYPES.FLAMETHROWER.flameDamage, burn: TYPES.FLAMETHROWER.burnDuration, burnDPS: TYPES.FLAMETHROWER.burnDPS };
      }
    }
    return null;
  }

  function updateParatroop(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    if (enemy._dropping) {
      enemy.y = (enemy.y || 30) - TYPES.PARATROOP.parachuteSpeed * dt;
      if (enemy.y <= (enemy._groundY || 5)) {
        enemy._dropping = false;
        enemy.y = enemy._groundY || 5;
      }
      return { dropping: true, y: enemy.y };
    }
    return null; // normal combat handled by base AI
  }

  function updateTank(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    enemy._reloadTimer = (enemy._reloadTimer || 0) + dt;
    enemy._mgTimer = (enemy._mgTimer || 0) + dt;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const result = {};
    // Main gun
    if (dist < TYPES.TANK.attackRange && enemy._reloadTimer >= TYPES.TANK.reloadTime) {
      enemy._reloadTimer = 0;
      result.mainGun = true;
      result.damage = TYPES.TANK.damage;
      result.targetX = playerPos.x + (Math.random() - 0.5) * 3;
      result.targetZ = playerPos.z + (Math.random() - 0.5) * 3;
    }
    // Coaxial MG
    if (dist < 25 && enemy._mgTimer >= TYPES.TANK.mgRate) {
      enemy._mgTimer = 0;
      result.mg = true;
      result.mgDamage = TYPES.TANK.mgDamage;
    }
    return result.mainGun || result.mg ? result : null;
  }

  function updateDroneOp(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    enemy._droneTimer = (enemy._droneTimer || 0) + dt;
    enemy._activeDrones = enemy._activeDrones || 0;
    if (enemy._droneTimer >= TYPES.DRONE_OP.droneInterval && enemy._activeDrones < TYPES.DRONE_OP.maxDrones) {
      enemy._droneTimer = 0;
      enemy._activeDrones++;
      return { launchDrone: true, droneDamage: TYPES.DRONE_OP.droneDamage, droneSpeed: TYPES.DRONE_OP.droneSpeed };
    }
    return null;
  }

  function updateSpetsnaz(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    enemy._flashTimer = (enemy._flashTimer || 0) + dt;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Dodge chance on incoming fire handled in applyDamage
    if (dist < TYPES.SPETSNAZ.grenadeRange && enemy._flashTimer >= TYPES.SPETSNAZ.flashbangInterval) {
      enemy._flashTimer = 0;
      return { flashbang: true, targetX: playerPos.x, targetZ: playerPos.z };
    }
    if (TYPES.SPETSNAZ.canFlank && dist < 20 && dist > 8) {
      // Try to flank: move perpendicular
      const perpX = -dz / dist, perpZ = dx / dist;
      return { flanking: true, moveX: perpX, moveZ: perpZ };
    }
    return null;
  }

  function updateKadyrovite(enemy, allEnemies) {
    if (!enemy.alive) return null;
    // Rally nearby allies
    const range = TYPES.KADYROVITE.rallyRadius;
    let rallied = 0;
    for (const ally of allEnemies) {
      if (!ally || ally === enemy || !ally.alive) continue;
      const dx = ally.mesh.position.x - enemy.mesh.position.x, dz = ally.mesh.position.z - enemy.mesh.position.z;
      if (dx * dx + dz * dz < range * range) {
        ally._rallyBuff = TYPES.KADYROVITE.rallyBuff;
        rallied++;
      }
    }
    return rallied > 0 ? { rallying: true, count: rallied } : null;
  }

  function updateWagner(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    // Berserker mode at low HP
    const cfg = TYPES.WAGNER;
    if (enemy.hp < cfg.hp * cfg.berserkerHP) {
      enemy._berserker = true;
      return { berserker: true, speedMult: cfg.berserkerSpeedMult };
    }
    return null;
  }

  function updateBTR(enemy, playerPos, dt, allEnemies) {
    if (!enemy.alive) return null;
    const result = {};
    enemy._cannonTimer = (enemy._cannonTimer || 0) + dt;
    enemy._spawnTimer = (enemy._spawnTimer || 0) + dt;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Autocannon
    if (dist < TYPES.BTR.attackRange && enemy._cannonTimer >= TYPES.BTR.autocannonRate) {
      enemy._cannonTimer = 0;
      result.fire = true;
      result.damage = TYPES.BTR.damage;
    }
    // Spawn infantry
    if (TYPES.BTR.canSpawnInfantry && enemy._spawnTimer >= TYPES.BTR.infantryInterval) {
      enemy._spawnTimer = 0;
      result.spawnInfantry = true;
      result.infantryCount = TYPES.BTR.infantryCount;
    }
    return result.fire || result.spawnInfantry ? result : null;
  }

  function updateKamikazeDrone(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    const dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Fly high then dive when close
    if (enemy._diving) {
      if (dist < TYPES.KAMIKAZE_DRONE.attackRange) {
        return { detonate: true, damage: TYPES.KAMIKAZE_DRONE.explosionDamage, radius: TYPES.KAMIKAZE_DRONE.explosionRadius };
      }
      return { diving: true };
    }
    if (dist < 15) {
      enemy._diving = true;
      return { startDive: true };
    }
    return { flying: true, height: TYPES.KAMIKAZE_DRONE.flyHeight };
  }

  function updateOfficer(enemy, allEnemies, dt) {
    if (!enemy.alive) return null;
    const result = {};
    enemy._reinforceTimer = (enemy._reinforceTimer || 0) + dt;
    // Buff nearby allies
    const range = TYPES.OFFICER.buffRadius;
    let buffed = 0;
    for (const ally of allEnemies) {
      if (!ally || ally === enemy || !ally.alive) continue;
      const dx = ally.mesh.position.x - enemy.mesh.position.x, dz = ally.mesh.position.z - enemy.mesh.position.z;
      if (dx * dx + dz * dz < range * range) {
        ally._officerBuffDmg = TYPES.OFFICER.buffDamage;
        ally._officerBuffSpd = TYPES.OFFICER.buffSpeed;
        buffed++;
      }
    }
    if (buffed > 0) result.buffing = true;
    // Call reinforcements
    if (enemy._reinforceTimer >= TYPES.OFFICER.callReinforcementInterval) {
      enemy._reinforceTimer = 0;
      result.reinforce = true;
      result.reinforceCount = TYPES.OFFICER.reinforceCount;
    }
    return result.buffing || result.reinforce ? result : null;
  }

  /* ── B19 update functions: 6 new enemy types ── */

  function updateHeavySniper(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    var cfg = TYPES.HEAVY_SNIPER;
    var dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    // Relocating after shot
    if (enemy._relocating) {
      enemy._relocateTimer = (enemy._relocateTimer || 0) + dt;
      if (enemy._relocateTimer >= 2) {
        enemy._relocating = false;
        enemy._relocateTimer = 0;
      }
      return { relocating: true };
    }
    // Aim charge-up
    enemy._aimTimer = (enemy._aimTimer || 0) + dt;
    if (enemy._aimTimer < cfg.aimTime) {
      return { aiming: true, aimProgress: enemy._aimTimer / cfg.aimTime };
    }
    // Fire
    enemy._aimTimer = 0;
    enemy._shotCount = (enemy._shotCount || 0) + 1;
    if (enemy._shotCount >= cfg.relocateAfterShots) {
      enemy._shotCount = 0;
      enemy._relocating = true;
      enemy.x += (Math.random() - 0.5) * 20;
      enemy.z += (Math.random() - 0.5) * 20;
    }
    return { fire: true, damage: cfg.damage, penetration: cfg.penetration };
  }

  function updateCommissar(enemy, allEnemies, dt) {
    if (!enemy.alive) return null;
    var cfg = TYPES.COMMISSAR;
    var range = cfg.fearRadius;
    var buffed = 0, executed = false;
    for (var i = 0; i < allEnemies.length; i++) {
      var ally = allEnemies[i];
      if (!ally || ally === enemy || !ally.alive) continue;
      var dx = ally.mesh.position.x - enemy.mesh.position.x;
      var dz = ally.mesh.position.z - enemy.mesh.position.z;
      if (dx * dx + dz * dz > range * range) continue;
      // Prevent retreat and buff morale
      ally._noRetreat = true;
      ally._moraleBuff = cfg.moraleBuff;
      buffed++;
      // Execute deserters
      if (ally._retreating) {
        ally.hp = 0;
        ally.alive = false;
        executed = true;
      }
    }
    if (executed) return { executed: true };
    return buffed > 0 ? { commanding: true, buffed: buffed } : null;
  }

  function updateThermobaric(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    var cfg = TYPES.THERMOBARIC;
    // Setup phase
    enemy._setupTimer = (enemy._setupTimer || 0) + dt;
    if (enemy._setupTimer < cfg.setupTime) {
      return { settingUp: true, progress: enemy._setupTimer / cfg.setupTime };
    }
    // Fire timer
    enemy._fireTimer = (enemy._fireTimer || 0) + dt;
    if (enemy._fireTimer >= cfg.thermobaricInterval) {
      enemy._fireTimer = 0;
      return {
        fire: true, damage: cfg.thermobaricDamage, radius: cfg.thermobaricRadius,
        targetX: playerPos.x + (Math.random() - 0.5) * 4,
        targetZ: playerPos.z + (Math.random() - 0.5) * 4,
        burn: { duration: cfg.burnDuration, dps: cfg.burnDPS }
      };
    }
    return null;
  }

  function updateEWOperator(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    var cfg = TYPES.EW_OPERATOR;
    var dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    // Run away if player too close
    if (dist < 12) {
      var nx = -dx / dist, nz = -dz / dist;
      enemy.x += nx * cfg.speed * dt * 2;
      enemy.z += nz * cfg.speed * dt * 2;
      return { fleeing: true };
    }
    // Jam if in range
    if (dist < cfg.jamRadius) {
      return { jamming: true, disablesMinimap: cfg.disablesMinimap, disablesCompass: cfg.disablesCompass };
    }
    return null;
  }

  function updateAssaultMech(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    var cfg = TYPES.ASSAULT_MECH;
    var dx = playerPos.x - enemy.x, dz = playerPos.z - enemy.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var result = {};
    // Shield regen
    enemy._shieldHP = (enemy._shieldHP !== undefined) ? enemy._shieldHP : cfg.shieldHP;
    if (enemy._shieldHP < cfg.shieldHP) {
      enemy._shieldHP = Math.min(cfg.shieldHP, enemy._shieldHP + cfg.shieldRegenRate * dt);
    }
    result.shieldActive = enemy._shieldHP > 0;
    result.shieldHP = enemy._shieldHP;
    // Rotate toward player
    enemy.rotation = Math.atan2(dx, dz);
    // MG fire
    enemy._mgTimer = (enemy._mgTimer || 0) + dt;
    if (dist < cfg.attackRange && enemy._mgTimer >= cfg.mgRate) {
      enemy._mgTimer = 0;
      result.mg = true;
      result.mgDamage = cfg.mgDamage;
    }
    // Rocket salvo
    enemy._rocketTimer = (enemy._rocketTimer || 0) + dt;
    if (dist < cfg.attackRange && enemy._rocketTimer >= cfg.rocketInterval) {
      enemy._rocketTimer = 0;
      result.rockets = true;
      result.rocketDamage = cfg.rocketSalvoDmg;
      result.count = cfg.rocketSalvoCount;
    }
    return (result.mg || result.rockets || result.shieldActive) ? result : null;
  }

  function updateSwarmOp(enemy, playerPos, dt) {
    if (!enemy.alive) return null;
    var cfg = TYPES.SWARM_OP;
    enemy._swarmTimer = (enemy._swarmTimer || 0) + dt;
    if (enemy._swarmTimer >= cfg.swarmInterval) {
      enemy._swarmTimer = 0;
      return { launchSwarm: true, count: cfg.swarmSize, droneDamage: cfg.droneDamage, droneSpeed: cfg.droneSpeed };
    }
    return null;
  }

  /* ── Tank armor damage reduction ──────────── */
  function applyTankArmor(enemy, damage, fromAngle) {
    if (enemy.type !== 'TANK') return damage;
    const facingAngle = enemy.rotation || 0;
    let angleDiff = fromAngle - facingAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const absDiff = Math.abs(angleDiff);
    let reduction;
    if (absDiff < Math.PI * 0.3) reduction = TYPES.TANK.armorFront;
    else if (absDiff > Math.PI * 0.7) reduction = TYPES.TANK.armorRear;
    else reduction = TYPES.TANK.armorSide;
    return damage * (1 - reduction);
  }

  return {
    TYPES, WAVE_COMPOSITIONS, STAGE_BOSS_MAP,
    init, selectType, getTypeConfig,
    updateBomber, updateSniper, updateMedic, updateEngineer,
    updateWarDog, updateShieldBearer, updateMortar, updateBoss,
    updateFlamethrower, updateParatroop, updateTank, updateDroneOp,
    updateSpetsnaz, updateKadyrovite, updateWagner, updateBTR,
    updateKamikazeDrone, updateOfficer,
    updateHeavySniper, updateCommissar, updateThermobaric,
    updateEWOperator, updateAssaultMech, updateSwarmOp,
    applyDamage, applyTankArmor, getBossHP,
    getBossForStage, getStageBossHP
  };
})();
