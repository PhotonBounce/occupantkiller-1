window.Attachments = (function() {
  'use strict';

  var DEFS = {
    SILENCER:     { id: 'SILENCER',     name: 'Silencer',      icon: '🔇', desc: 'Quiet — -15% dmg', damageMulti: 0.85, recoilMulti: 1.0,  magMulti: 1.0 },
    EXTENDED_MAG: { id: 'EXTENDED_MAG', name: 'Extended Mag',  icon: '📦', desc: '+50% mag size',     damageMulti: 1.0,  recoilMulti: 1.0,  magMulti: 1.5 },
    GRIP:         { id: 'GRIP',         name: 'Foregrip',      icon: '✊', desc: '-20% recoil',       damageMulti: 1.0,  recoilMulti: 0.8,  magMulti: 1.0 },
    RED_DOT:      { id: 'RED_DOT',      name: 'Red Dot',       icon: '🔴', desc: '+10% accuracy',     damageMulti: 1.0,  recoilMulti: 0.9,  magMulti: 1.0 },
    ACOG_SCOPE:   { id: 'ACOG_SCOPE',   name: 'ACOG Scope',    icon: '🔭', desc: '+25% accuracy',     damageMulti: 1.0,  recoilMulti: 0.85, magMulti: 1.0 },
    DRUM_MAG:     { id: 'DRUM_MAG',     name: 'Drum Mag',      icon: '🥁', desc: '+100% mag, slow reload', damageMulti: 1.0, recoilMulti: 1.05, magMulti: 2.0 },
    SUPPRESSOR:   { id: 'SUPPRESSOR',   name: 'Suppressor',    icon: '🔇', desc: 'Heavy quiet — -15% dmg', damageMulti: 0.85, recoilMulti: 1.0, magMulti: 1.0 },
  };

  // _attached[weaponSlot] = attachment ID or null
  var _attached = {};
  var _STORAGE_KEY = 'okk_attachments_v1';

  function _load() {
    try {
      var raw = localStorage.getItem(_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          _attached = parsed;
        }
      }
    } catch (e) {}
  }

  function _save() {
    try {
      localStorage.setItem(_STORAGE_KEY, JSON.stringify(_attached));
    } catch (e) {}
  }

  function getAttached(slot) {
    return (_attached[slot] && DEFS[_attached[slot]]) ? DEFS[_attached[slot]] : null;
  }

  function attach(slot, attachId) {
    if (!DEFS[attachId]) return;
    _attached[slot] = attachId;
    _save();
    // Show HUD notification
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      var def = DEFS[attachId];
      HUD.notifyPickup(def.icon + ' ' + def.name + ' → Slot ' + slot, '#88ff88');
    }
  }

  function detach(slot) {
    _attached[slot] = null;
    _save();
  }

  function getDamageMulti(slot) {
    var a = getAttached(slot);
    return a ? a.damageMulti : 1.0;
  }

  function getRecoilMulti(slot) {
    var a = getAttached(slot);
    return a ? a.recoilMulti : 1.0;
  }

  function getMagMulti(slot) {
    var a = getAttached(slot);
    return a ? a.magMulti : 1.0;
  }

  // Drop pickup system: spawn a glowing pickup box on the ground
  function spawnPickup(scene, x, y, z, attachId) {
    if (!scene || !DEFS[attachId]) return null;
    var geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x00ff88, emissive: 0x004422 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.2, z);
    mesh.userData.isAttachmentPickup = true;
    mesh.userData.attachmentId = attachId;
    mesh.userData.label = DEFS[attachId] ? DEFS[attachId].name : attachId;
    mesh.userData.bobBase = y + 0.2;
    scene.add(mesh);
    return mesh;
  }

  // Get random attachment for drops (weighted)
  function getRandomAttachment() {
    var keys = Object.keys(DEFS);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function getAll() {
    return Object.assign({}, DEFS);
  }

  _load();

  return {
    attach: attach,
    detach: detach,
    getAttached: getAttached,
    getDamageMulti: getDamageMulti,
    getRecoilMulti: getRecoilMulti,
    getMagMulti: getMagMulti,
    spawnPickup: spawnPickup,
    getRandomAttachment: getRandomAttachment,
    getAll: getAll,
  };
})();
