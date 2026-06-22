window.Mines = (function() {
  var _mines = []; // {mesh, x, y, z, triggered, armed}
  var _scene = null;

  function init(scene) {
    _scene = scene;
    _mines = [];
  }

  function placeMine(x, y, z) {
    // Create a small flat disk mesh (cylinder geometry, radius 0.2, height 0.05)
    // Color: olive green (0x556633) with slight metallic tint
    var geo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556633 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.025, z);
    mesh.userData.isMine = true;
    if (_scene) _scene.add(mesh);
    var mine = { mesh: mesh, x: x, y: y, z: z, triggered: false, armed: true };
    _mines.push(mine);
    return mine;
  }

  function checkTrigger(entityX, entityZ, entityRadius) {
    // Returns mine that was triggered, or null
    // Called by game-manager.js for enemies and player each frame
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (!m.armed || m.triggered) continue;
      var dx = entityX - m.x;
      var dz = entityZ - m.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < (entityRadius || 0.6) + 0.2) {
        _triggerMine(i);
        return m;
      }
    }
    return null;
  }

  function _triggerMine(idx) {
    var m = _mines[idx];
    if (!m || m.triggered) return;
    m.triggered = true;
    m.armed = false;
    // Remove mesh
    if (m.mesh && _scene) { _scene.remove(m.mesh); m.mesh.geometry.dispose(); m.mesh.material.dispose(); }
    // Create explosion effect: add a brief PointLight and particle flash
    if (_scene) {
      var light = new THREE.PointLight(0xff6600, 8, 6);
      light.position.set(m.x, m.y + 0.5, m.z);
      _scene.add(light);
      setTimeout(function() { if (_scene) _scene.remove(light); }, 300);
    }
  }

  function checkBulletHit(bulletX, bulletY, bulletZ, radius) {
    // Called when a bullet passes near a mine position
    for (var i = 0; i < _mines.length; i++) {
      var m = _mines[i];
      if (!m.armed || m.triggered) continue;
      var dx = bulletX - m.x;
      var dy = bulletY - m.y;
      var dz = bulletZ - m.z;
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < (radius || 0.5)) {
        _triggerMine(i);
        return m;
      }
    }
    return null;
  }

  function getMines() { return _mines.slice(); }

  function clear() {
    for (var i = 0; i < _mines.length; i++) {
      if (_mines[i].mesh && _scene) _scene.remove(_mines[i].mesh);
    }
    _mines = [];
  }

  return { init: init, placeMine: placeMine, checkTrigger: checkTrigger, checkBulletHit: checkBulletHit, getMines: getMines, clear: clear };
})();
