window.SubmarineBay = (function() {
  'use strict';

  var objects = [];
  var animations = {};

  var init = function(scene, camera) {
    // Clear any existing objects
    reset();

    // 1. Dry dock cradle - U-shaped support structure
    var cradleGeom = new THREE.CylinderGeometry(2, 2, 0.3, 32);
    var cradleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8 });
    var cradle = new THREE.Mesh(cradleGeom, cradleMat);
    cradle.position.set(0, 1, 0);
    scene.add(cradle);
    objects.push(cradle);

    // Support legs for cradle
    for (var i = 0; i < 4; i++) {
      var legGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
      var leg = new THREE.Mesh(legGeom, legMat);
      var angle = (Math.PI / 2) * i;
      leg.position.set(Math.cos(angle) * 3, 2, Math.sin(angle) * 3);
      scene.add(leg);
      objects.push(leg);
    }

    // 2. Submarine hull (cylindrical body)
    var hullGeom = new THREE.CylinderGeometry(1.2, 1.2, 6, 32);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.9, roughness: 0.3 });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(0, 2.5, 0);
    hull.rotation.z = Math.PI / 2;
    scene.add(hull);
    objects.push(hull);

    // Conning tower (periscope tower)
    var towerGeom = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 16);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, metalness: 0.85 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(0, 4, 0);
    scene.add(tower);
    objects.push(tower);

    // 3. Torpedo reload crane - vertical boom
    var calmGeom = new THREE.CylinderGeometry(0.2, 0.2, 5, 16);
    var calmMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    var calmBoom = new THREE.Mesh(calmGeom, calmMat);
    calmBoom.position.set(5, 3, 0);
    scene.add(calmBoom);
    objects.push(calmBoom);
    animations.craneAngle = 0;

    // Crane hook
    var hookGeom = new THREE.SphereGeometry(0.3, 16, 16);
    var hookMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9 });
    var hook = new THREE.Mesh(hookGeom, hookMat);
    hook.position.set(5, 2, 0);
    scene.add(hook);
    objects.push(hook);
    animations.hookOffset = 0;

    // 4. Torpedo storage - cylinders
    for (var t = 0; t < 4; t++) {
      var torpedoGeom = new THREE.CylinderGeometry(0.25, 0.25, 2, 16);
      var torpedoMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
      var torpedo = new THREE.Mesh(torpedoGeom, torpedoMat);
      var row = Math.floor(t / 2);
      var col = t % 2;
      torpedo.position.set(-4 + col * 1.5, 1 + row * 1.5, 0);
      torpedo.rotation.z = Math.PI / 2;
      scene.add(torpedo);
      objects.push(torpedo);
    }

    // Torpedo roller track
    var trackerPoints = [];
    for (var p = 0; p <= 10; p++) {
      trackerPoints.push(new THREE.Vector3(-4 + (p / 10) * 8, 0.5, 0));
    }
    var trackerGeom = new THREE.BufferGeometry().setFromPoints(trackerPoints);
    var trackerMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 3 });
    var tracker = new THREE.Line(trackerGeom, trackerMat);
    scene.add(tracker);
    objects.push(tracker);
    animations.torpedoRollerPos = -4;

    // 5. Battery charging bays - rectangular frames
    for (var b = 0; b < 3; b++) {
      var bayGeom = new THREE.BoxGeometry(1.5, 0.5, 1);
      var bayMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, emissive: 0x00ff00, metalness: 0.6 });
      var bay = new THREE.Mesh(bayGeom, bayMat);
      bay.position.set(-5 + b * 2.5, 3.5, -3);
      scene.add(bay);
      objects.push(bay);
      animations['bayLight' + b] = 0;
    }

    // 6. Escape diver lock-out chamber
    var diverLockGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16);
    var diverLockMat = new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0.8, roughness: 0.2 });
    var diverLock = new THREE.Mesh(diverLockGeom, diverLockMat);
    diverLock.position.set(5, 1, -4);
    scene.add(diverLock);
    objects.push(diverLock);
    animations.diverLockCycle = 0;

    // Diver lock door
    var doorGeom = new THREE.BoxGeometry(0.15, 1.2, 1.3);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x004499, metalness: 0.85 });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(5.65, 1, -4);
    scene.add(door);
    objects.push(door);

    // 7. Periscope testing pool
    var poolGeom = new THREE.BoxGeometry(3, 0.2, 3);
    var poolMat = new THREE.MeshStandardMaterial({ color: 0x001a66, metalness: 0.3, transparent: true, opacity: 0.5 });
    var pool = new THREE.Mesh(poolGeom, poolMat);
    pool.position.set(-5, -0.5, 3);
    scene.add(pool);
    objects.push(pool);

    // Periscope in pool
    var scopeGeom = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 12);
    var scopeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 });
    var scope = new THREE.Mesh(scopeGeom, scopeMat);
    scope.position.set(-5, 1.5, 3);
    scene.add(scope);
    objects.push(scope);
    animations.scopeRotation = 0;

    // 8. Crew berthing bunkroom - stacked bunks
    for (var bk = 0; bk < 6; bk++) {
      var bunkGeom = new THREE.BoxGeometry(2, 0.3, 1);
      var bunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.5 });
      var bunk = new THREE.Mesh(bunkGeom, bunkMat);
      var bunkRow = Math.floor(bk / 2);
      var bunkCol = bk % 2;
      bunk.position.set(-8 + bunkCol * 2.5, 2 + bunkRow * 1.2, -2);
      scene.add(bunk);
      objects.push(bunk);
    }

    // 9. Galley kitchen - stove/oven
    var stoveGeom = new THREE.BoxGeometry(1, 1.2, 0.8);
    var stoveMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
    var stove = new THREE.Mesh(stoveGeom, stoveMat);
    stove.position.set(3, 1.5, -5);
    scene.add(stove);
    objects.push(stove);
    animations.stoveHeat = 0;

    // 10. Weapons locker - secure storage
    var lockerGeom = new THREE.BoxGeometry(1.5, 2, 0.8);
    var lockerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    var locker = new THREE.Mesh(lockerGeom, lockerMat);
    locker.position.set(-6, 1.5, 5);
    scene.add(locker);
    objects.push(locker);

    // Locker door with handle
    var lockerDoorGeom = new THREE.BoxGeometry(0.1, 1.8, 0.6);
    var lockerDoorMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9 });
    var lockerDoor = new THREE.Mesh(lockerDoorGeom, lockerDoorMat);
    lockerDoor.position.set(-5.4, 1.5, 5);
    scene.add(lockerDoor);
    objects.push(lockerDoor);

    // 11. Signal intelligence station - radar-like display
    var radarBaseGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    var radarMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7 });
    var radarBase = new THREE.Mesh(radarBaseGeom, radarMat);
    radarBase.position.set(0, 4.5, -5);
    scene.add(radarBase);
    objects.push(radarBase);

    // Radar screen
    var screenGeom = new THREE.BoxGeometry(1.2, 1.2, 0.15);
    var screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, metalness: 0.8 });
    var screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(0, 5.3, -5);
    scene.add(screen);
    objects.push(screen);
    animations.radarScan = 0;

    // 12. Underwater acoustic array control - speaker cone
    var arrayGeom = new THREE.ConeGeometry(0.8, 1.5, 16);
    var arrayMat = new THREE.MeshStandardMaterial({ color: 0x4a90e2, metalness: 0.6 });
    var array = new THREE.Mesh(arrayGeom, arrayMat);
    array.position.set(6, 2, 4);
    scene.add(array);
    objects.push(array);
    animations.arrayPulse = 0;

    // 13. Ballast tank indicators
    for (var bl = 0; bl < 4; bl++) {
      var indicatorGeom = new THREE.SphereGeometry(0.25, 16, 16);
      var indicatorMat = new THREE.MeshStandardMaterial({ color: 0x00aa00, emissive: 0x00ff00, metalness: 0.7 });
      var indicator = new THREE.Mesh(indicatorGeom, indicatorMat);
      indicator.position.set(-3 + bl * 1.5, 5.2, 2);
      scene.add(indicator);
      objects.push(indicator);
      animations['ballastGlow' + bl] = Math.random() * Math.PI * 2;
    }

    // 14. Main control console (multiple boxes)
    for (var c = 0; c < 3; c++) {
      var consoleGeom = new THREE.BoxGeometry(1.2, 1.5, 0.6);
      var consoleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6 });
      var console = new THREE.Mesh(consoleGeom, consoleMat);
      console.position.set(-7 + c * 2, 1.5, 1);
      scene.add(console);
      objects.push(console);

      // Console lights/buttons
      for (var l = 0; l < 4; l++) {
        var buttonGeom = new THREE.SphereGeometry(0.15, 12, 12);
        var buttonMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, metalness: 0.8 });
        var button = new THREE.Mesh(buttonGeom, buttonMat);
        button.position.set(-7 + c * 2 - 0.4 + (l % 2) * 0.4, 2.2 + Math.floor(l / 2) * 0.4, 0.35);
        scene.add(button);
        objects.push(button);
        animations['buttonPulse' + c + '_' + l] = Math.random() * Math.PI * 2;
      }
    }

    // 15. Structural framework - wall panels and beams
    var wallGeom = new THREE.BoxGeometry(15, 0.2, 10);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(0, -0.2, 0);
    scene.add(wall);
    objects.push(wall);

    // Ceiling structure
    var ceilingGeom = new THREE.BoxGeometry(15, 0.2, 10);
    var ceilingMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5 });
    var ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.set(0, 6, 0);
    scene.add(ceiling);
    objects.push(ceiling);

    // Structural beams - cross members
    for (var bm = 0; bm < 5; bm++) {
      var beamGeom = new THREE.BoxGeometry(0.3, 0.3, 10);
      var beamMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
      var beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set(-6 + bm * 3, 3, 0);
      scene.add(beam);
      objects.push(beam);
    }
  };

  var update = function(delta) {
    // Crane lift animation
    animations.craneAngle = (animations.craneAngle || 0) + delta * 0.3;
    var craneObj = objects[6];
    if (craneObj) {
      craneObj.rotation.x = Math.sin(animations.craneAngle) * 0.15;
    }

    // Hook movement
    animations.hookOffset = (animations.hookOffset || 0) + delta * 0.5;
    var hookObj = objects[7];
    if (hookObj) {
      hookObj.position.y = 2 + Math.sin(animations.hookOffset) * 0.8;
    }

    // Torpedo roller movement
    animations.torpedoRollerPos = (animations.torpedoRollerPos || -4) + delta * 1.5;
    if (animations.torpedoRollerPos > 4) {
      animations.torpedoRollerPos = -4;
    }

    // Battery bay lights pulsing
    for (var b = 0; b < 3; b++) {
      animations['bayLight' + b] = (animations['bayLight' + b] || 0) + delta * 1.5;
      var bayIdx = 14 + b;
      if (objects[bayIdx]) {
        var intensity = 0.3 + Math.sin(animations['bayLight' + b]) * 0.3;
        objects[bayIdx].material.emissiveIntensity = intensity;
      }
    }

    // Diver lock cycling
    animations.diverLockCycle = (animations.diverLockCycle || 0) + delta * 0.4;
    var diverLockObj = objects[17];
    if (diverLockObj) {
      diverLockObj.position.y = 1 + Math.sin(animations.diverLockCycle) * 0.3;
    }

    // Periscope rotation
    animations.scopeRotation = (animations.scopeRotation || 0) + delta * 0.6;
    var scopeIdx = 20;
    if (objects[scopeIdx]) {
      objects[scopeIdx].rotation.y = animations.scopeRotation;
    }

    // Stove heat glow
    animations.stoveHeat = (animations.stoveHeat || 0) + delta * 1.2;
    var stoveIdx = 24;
    if (objects[stoveIdx]) {
      var heatIntensity = 0.4 + Math.sin(animations.stoveHeat) * 0.3;
      objects[stoveIdx].material.emissiveIntensity = heatIntensity;
    }

    // Radar scanning animation
    animations.radarScan = (animations.radarScan || 0) + delta * 1.8;
    var screenIdx = 27;
    if (objects[screenIdx]) {
      objects[screenIdx].rotation.z = animations.radarScan;
    }

    // Acoustic array pulse
    animations.arrayPulse = (animations.arrayPulse || 0) + delta * 0.8;
    var arrayIdx = 28;
    if (objects[arrayIdx]) {
      var pulseScale = 1 + Math.sin(animations.arrayPulse) * 0.15;
      objects[arrayIdx].scale.set(pulseScale, pulseScale, pulseScale);
    }

    // Ballast tank glows
    for (var bl = 0; bl < 4; bl++) {
      animations['ballastGlow' + bl] = (animations['ballastGlow' + bl] || 0) + delta * 0.6;
      var ballastIdx = 29 + bl;
      if (objects[ballastIdx]) {
        var glowIntensity = 0.3 + Math.sin(animations['ballastGlow' + bl]) * 0.4;
        objects[ballastIdx].material.emissiveIntensity = glowIntensity;
      }
    }

    // Console button pulsing
    for (var c = 0; c < 3; c++) {
      for (var l = 0; l < 4; l++) {
        animations['buttonPulse' + c + '_' + l] = (animations['buttonPulse' + c + '_' + l] || 0) + delta * 2;
        var baseIdx = 33 + c * 5 + l + 1;
        if (objects[baseIdx]) {
          var pulseIntensity = 0.4 + Math.sin(animations['buttonPulse' + c + '_' + l]) * 0.5;
          objects[baseIdx].material.emissiveIntensity = pulseIntensity;
        }
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var m = 0; m < obj.material.length; m++) {
            obj.material[m].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }
    objects = [];
    animations = {};
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
