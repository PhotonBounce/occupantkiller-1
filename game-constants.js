/* game-constants.js — Centralized constants for OccupantKiller
   Replaces magic numbers scattered across game-manager.js and other modules
   ====================================================================== */
const GameConstants = (function () {
  'use strict';

  /* ── Frame / Timing ─────────────────────────────────────────────── */
  const FPS = {
    SEVERE: 24,   // below this, severe perf degradation
    LOW: 30,      // below this, noticeable lag
    TARGET: 60,   // target frame rate
    HIGH: 52,     // above this, considered smooth
  };

  const TIME = {
    SECOND: 1,
    MINUTE: 60,
    HOUR: 3600,
  };

  /* ── Player ─────────────────────────────────────────────────────── */
  const PLAYER = {
    HEIGHT: 1.7,
    DEFAULT_HP: 100,
    DEFAULT_MAX_HP: 100,
    DEFAULT_GRENADES: 5,
    DEFAULT_STAMINA: 1.0,
    SPRINT_SPEED_MULT: 1.6,
    WALK_SPEED: 4.5,
    CROUCH_SPEED_MULT: 0.6,
    PRONE_SPEED_MULT: 0.3,
    JUMP_FORCE: 6.5,
    GRAVITY: 22.0,
    GROUND_SNAP_DIST: 1.5,
    GROUND_SNAP_VEL: 0.5,
    BLEED_DPS: 3,           // damage per second while bleeding
    BLEED_DURATION: 8,      // seconds
    HEALTH_REGEN_DELAY: 5,  // seconds after damage before regen starts
    HEALTH_REGEN_RATE: 2,   // HP per second
    STAMINA_DRAIN_RATE: 0.15,
    STAMINA_REGEN_RATE: 0.08,
    ARMOR_MAX: 100,
    ARMOR_ABSORB_PCT: 0.5, // armor absorbs up to 50% of damage
    SHIELD_DURATION: 10,    // seconds
    SECOND_WIND_HP_PCT: 0.20,
    LOW_HP_PCT: 0.25,
    CRITICAL_HP_PCT: 0.18,
    SAFE_HP_PCT: 0.30,
    COVER_DMG_MULT: 0.6,
    CROUCH_DMG_MULT: 0.85,
  };

  /* ── Combat ───────────────────────────────────────────────────────── */
  const COMBAT = {
    HEADSHOT_MULT: 2.0,
    MELEE_RANGE: 2.5,
    MELEE_DMG: 35,
    GRENADE_THROW_FORCE: 12,
    GRENADE_COOLDOWN: 1.5,
    GRENADE_FUSE: 2.0,
    GRENADE_RADIUS: 6,
    GRENADE_MAX_DMG: 80,
    SUPPRESSION_DECAY: 0.5,
    KILL_STREAK_TIMEOUT: 3.0, // seconds between kills to maintain streak
    MULTIKILL_WINDOW: 2.0,    // seconds for multikill
    DOG_TAG_DROP_CHANCE: 0.15,
    LOOT_VALUE: 5,
    LOOT_COLLECT_RANGE: 2.5,
    LOOT_LIFETIME: 15,
    LOOT_MAGNET_RANGE: 5,
    AIM_ASSIST_CONE: 0.18,    // radians (~10°)
    AIM_ASSIST_MAX_DIST: 60,
    GYRO_AUTO_ASSIST_PULL: 0.04,
    MOBILE_AIM_PULL: 0.18,
    MOBILE_AIM_IDLE_PULL: 0.06,
  };

  /* ── Waves / Stages ─────────────────────────────────────────────── */
  const WAVE = {
    DEFAULT_WAVES_PER_STAGE: 7,
    SCORE_WAVE_BONUS: 500,
    DEFAULT_ENEMY_COUNT: 4,
    MAX_ENEMIES: 40,
    ARMOR_MIN_WAVE: 3,
    TRANSPORT_MIN_WAVE: 5,
    TANK_FOCUS_EXTRA: 1,
    MIN_SPAWN_DIST: 18,
    MAX_SPAWN_DIST: 55,
    VEHICLE_SPAWN_DIST: 35,
    SUPPLY_DROP_WAVE: 3,
    MINE_UNLOCK_WAVE: 2,
    SENTRY_UNLOCK_WAVE: 4,
    STIM_UNLOCK_WAVE: 5,
    BARREL_UNLOCK_WAVE: 6,
    GRENADE_LAUNCHER_WAVE: 8,
    JUGGERNAUT_WAVE: 10,
    STEALTH_UNLOCK_WAVE: 12,
    EXPLOSIVE_KILLS_MEDAL: 3,
    EXPLOSIVE_KILLS_GOLD: 5,
  };

  /* ── Stage-Specific Timers (seconds) ────────────────────────────── */
  const STAGE_TIMERS = {
    CHORNOBYL_RADIATION: 12,
    CHORNOBYL_RADIATION_VAR: 8,
    CHORNOBYL_RAD_DMG: 2,
    CHORNOBYL_RAD_RANGE: 8,
    CHORNOBYL_RAD_MAX_DMG: 15,
    CRIMEA_BOMBARD: 12,
    CRIMEA_BOMBARD_VAR: 6,
    MOSCOW_MORTAR: 15,
    MOSCOW_MORTAR_VAR: 10,
    ANTONOV_ARTILLERY: 16,
    ANTONOV_ARTILLERY_VAR: 10,
    TREELINE_MINE_DMG: 25,
    TREELINE_MINE_RANGE: 3,
    MINE_DMG: 20,
    MINE_RANGE: 3.5,
    MINE_TRIGGER_RANGE: 1.8,
    BARREL_DMG: 50,
    BARREL_RANGE: 5,
    BATTLEFIELD_EVENT_INTERVAL: 25,
    BATTLEFIELD_EVENT_VAR: 15,
    AMBUSH_SPAWN_DIST: 8,
    AMBUSH_SPAWN_VAR: 6,
  };

  /* ── Vehicles ───────────────────────────────────────────────────── */
  const VEHICLE = {
    SPAWN_ROAD_MIN_DIST: 25,
    SPAWN_ROAD_MAX_DIST: 35,
    TURRET_IMMUNITY_TIME: 1.0,
  };

  /* ── Audio / Visual ─────────────────────────────────────────────── */
  const AUDIO = {
    MUSIC_INTENSITY_INTERVAL: 0.5,
  };

  const VISUAL = {
    FOOTSTEP_PUFF_LIFE: 0.5,
    FOOTSTEP_PUFF_MAX: 24,
    FOOTSTEP_PUFF_OPACITY: 0.45,
    FOOTSTEP_PUFF_COLOR: 0xb0a080,
    DAMAGE_FLASH_DURATION: 0.2,
    SCREEN_SHAKE_BASE: 0.02,
    SCREEN_SHAKE_DMG_SCALE: 0.0025,
    SCREEN_SHAKE_MAX: 0.18,
    SLOW_MO_RATE: 0.45,
    SLOW_MO_HIT_DURATION: 0.4,
    SLOW_MO_SECOND_WIND_DURATION: 1.2,
    KILL_FOV_KICK: 2.5,
    KILL_FOV_KICK_HEADSHOT: 4.5,
    FOV_KICK_DECAY: 5.0,
    THREAT_MAX_DIST: 7,       // meters
    THREAT_DOT_THRESHOLD: -0.25,
  };

  /* ── Mobile ─────────────────────────────────────────────────────── */
  const MOBILE = {
    TOUCH_LOOK_SENSITIVITY: 4.0,
    AIM_JOYSTICK_SENSITIVITY: 14.0,
    VIBRATE_BASE_MS: 20,
    VIBRATE_DMG_SCALE: 0.8,
    VIBRATE_MAX_MS: 80,
  };

  /* ── Economy ────────────────────────────────────────────────────── */
  const ECONOMY = {
    DOG_TAG_VALUE: 10,
    KILL_REWARD_BASE: 5,
    KILL_REWARD_HEAVY: 10,
    KILL_REWARD_OFFICER: 15,
    KILL_REWARD_SUIT: 50,
    KILL_REWARD_BOSS: 100,
    WAVE_CLEAR_BONUS: 100,
    STAGE_CLEAR_BONUS: 250,
    PERFECT_WAVE_BONUS: 50,
    MINE_COST: 15,
    SENTRY_COST: 30,
    STIM_COST: 20,
    BARREL_COST: 10,
    HEAL_COST: 10,
    ARMOR_COST: 15,
  };

  /* ── Public API ─────────────────────────────────────────────────── */
  return {
    FPS: FPS,
    TIME: TIME,
    PLAYER: PLAYER,
    COMBAT: COMBAT,
    WAVE: WAVE,
    STAGE_TIMERS: STAGE_TIMERS,
    VEHICLE: VEHICLE,
    AUDIO: AUDIO,
    VISUAL: VISUAL,
    MOBILE: MOBILE,
    ECONOMY: ECONOMY,
  };
})();

if (typeof window !== 'undefined') {
  window.GameConstants = GameConstants;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameConstants;
}
