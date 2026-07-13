window.DroneWarfare = (function() {
  'use strict';

  var objects = [];
  var animationState = {};

  function init(scene, camera) {
    // Clear any existing objects
    reset();

    // 1. Swarm Drone Launch Bay - Drone chassis arrangement
    var launchBayGeometry = new THREE.BoxGeometry(4, 2, 8);
    var launchBayMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    var launchBay = new THREE.Mesh(launchBayGeometry, launchBayMaterial);
    launchBay.position.set(-15, 0, 0);
    launchBay.castShadow = true;
    scene.add(launchBay);
    objects.push({ mesh: launchBay, type: 'launchBay' });

    // 2. Individual Drone Units (drones in launch bay)
    for (var i = 0; i < 4; i++) {
      var droneGeometry = new THREE.BoxGeometry(0.6, 0.4, 1.2);
      var droneMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
      var drone = new THREE.Mesh(droneGeometry, droneMaterial);
      drone.position.set(-15 + (i % 2) * 1.5 - 0.75, 1.5 + Math.floor(i / 2) * 0.8, -2 + (i % 2) * 2);
      drone.castShadow = true;
      scene.add(drone);
      objects.push({ mesh: drone, type: 'drone', index: i });
    }

    // 3. Jamming Tower (tall cylindrical structure)
    var jammingTowerGeometry = new THREE.CylinderGeometry(1.5, 2, 12, 8);
    var jammingTowerMaterial = new THREE.MeshPhongMaterial({ color: 0x4d96ff });
    var jammingTower = new THREE.Mesh(jammingTowerGeometry, jammingTowerMaterial);
    jammingTower.position.set(10, 0, 0);
    jammingTower.castShadow = true;
    scene.add(jammingTower);
    objects.push({ mesh: jammingTower, type: 'jammingTower' });

    // 4. Jamming Tower Cap
    var towerCapGeometry = new THREE.ConeGeometry(2, 2, 8);
    var towerCapMaterial = new THREE.MeshPhongMaterial({ color: 0x2d76df });
    var towerCap = new THREE.Mesh(towerCapGeometry, towerCapMaterial);
    towerCap.position.set(10, 6.5, 0);
    towerCap.castShadow = true;
    scene.add(towerCap);
    objects.push({ mesh: towerCap, type: 'towerCap' });

    // 5. Operator Control Station (box structure)
    var controlStationGeometry = new THREE.BoxGeometry(3, 2, 3);
    var controlStationMaterial = new THREE.MeshPhongMaterial({ color: 0x16213e });
    var controlStation = new THREE.Mesh(controlStationGeometry, controlStationMaterial);
    controlStation.position.set(5, 1, 10);
    controlStation.castShadow = true;
    scene.add(controlStation);
    objects.push({ mesh: controlStation, type: 'controlStation' });

    // 6. Control Station Monitor (smaller box on top)
    var monitorGeometry = new THREE.BoxGeometry(2, 1.2, 0.3);
    var monitorMaterial = new THREE.MeshPhongMaterial({ color: 0x0f3460 });
    var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(5, 2.5, 10);
    monitor.castShadow = true;
    scene.add(monitor);
    objects.push({ mesh: monitor, type: 'monitor' });

    // 7. Drone Repair Hangar (large box)
    var hangarGeometry = new THREE.BoxGeometry(8, 4, 10);
    var hangarMaterial = new THREE.MeshPhongMaterial({ color: 0x2d3561 });
    var hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
    hangar.position.set(-5, 2, -12);
    hangar.castShadow = true;
    scene.add(hangar);
    objects.push({ mesh: hangar, type: 'hangar' });

    // 8. Repair Bay Door (vertical cylinder)
    var doorGeometry = new THREE.CylinderGeometry(1, 1, 4, 6);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.rotation.z = Math.PI / 2;
    door.position.set(-5, 2, -7);
    door.castShadow = true;
    scene.add(door);
    objects.push({ mesh: door, type: 'door' });

    // 9. Targeting Radar Array (sphere on cylinder)
    var radarBaseGeometry = new THREE.CylinderGeometry(0.8, 1, 3, 8);
    var radarBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var radarBase = new THREE.Mesh(radarBaseGeometry, radarBaseMaterial);
    radarBase.position.set(15, 0, -8);
    radarBase.castShadow = true;
    scene.add(radarBase);
    objects.push({ mesh: radarBase, type: 'radarBase' });

    // 10. Radar Dome (sphere on top of radar)
    var radarDomeGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var radarDomeMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
    var radarDome = new THREE.Mesh(radarDomeGeometry, radarDomeMaterial);
    radarDome.position.set(15, 2.5, -8);
    radarDome.castShadow = true;
    scene.add(radarDome);
    objects.push({ mesh: radarDome, type: 'radarDome' });

    // 11. Anti-Drone Laser Turret (cone + cylinder)
    var turretBaseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
    var turretBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x8b0000 });
    var turretBase = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
    turretBase.position.set(0, 1, 12);
    turretBase.castShadow = true;
    scene.add(turretBase);
    objects.push({ mesh: turretBase, type: 'turretBase' });

    // 12. Laser Barrel (cone)
    var laserBarrelGeometry = new THREE.ConeGeometry(0.4, 2.5, 6);
    var laserBarrelMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var laserBarrel = new THREE.Mesh(laserBarrelGeometry, laserBarrelMaterial);
    laserBarrel.position.set(0, 3.5, 12);
    laserBarrel.castShadow = true;
    scene.add(laserBarrel);
    objects.push({ mesh: laserBarrel, type: 'laserBarrel' });

    // 13. Destroyed Drone Wreckage (scattered sphere parts)
    for (var w = 0; w < 3; w++) {
      var wreckageGeometry = new THREE.SphereGeometry(0.5 - w * 0.1, 8, 8);
      var wreckageMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var wreckage = new THREE.Mesh(wreckageGeometry, wreckageMaterial);
      wreckage.position.set(-20 + w * 2, 0.3 + w * 0.2, 5);
      wreckage.castShadow = true;
      scene.add(wreckage);
      objects.push({ mesh: wreckage, type: 'wreckage', index: w });
    }

    // 14. Payload Drop Zone with Flares (cylinders with lights)
    for (var f = 0; f < 2; f++) {
      var flareGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6);
      var flareMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
      var flare = new THREE.Mesh(flareGeometry, flareMaterial);
      flare.position.set(-8 + f * 4, 0.05, 15);
      flare.castShadow = true;
      scene.add(flare);
      objects.push({ mesh: flare, type: 'flare', index: f });
    }

    // 15. EW (Electronic Warfare) Antenna Mast (box and cylinder)
    var antennaMastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
    var antennaMastMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var antennaMast = new THREE.Mesh(antennaMastGeometry, antennaMastMaterial);
    antennaMast.position.set(20, 0, 8);
    antennaMast.castShadow = true;
    scene.add(antennaMast);
    objects.push({ mesh: antennaMast, type: 'antennaMast' });

    // 16. Antenna Element (small box on mast)
    var antennaElementGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    var antennaElementMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    var antennaElement = new THREE.Mesh(antennaElementGeometry, antennaElementMaterial);
    antennaElement.position.set(20, 5, 8);
    antennaElement.castShadow = true;
    scene.add(antennaElement);
    objects.push({ mesh: antennaElement, type: 'antennaElement' });

    // 17. Kamikaze Drone Storage Rack (stack of boxes)
    for (var k = 0; k < 3; k++) {
      var storageGeometry = new THREE.BoxGeometry(2, 1, 2);
      var storageMaterial = new THREE.MeshPhongMaterial({ color: 0xff3300 });
      var storage = new THREE.Mesh(storageGeometry, storageMaterial);
      storage.position.set(-10, 0.5 + k * 1.2, -20);
      storage.castShadow = true;
      scene.add(storage);
      objects.push({ mesh: storage, type: 'storageRack', index: k });
    }

    // Initialize animation state
    animationState = {
      droneSwarmAngle: 0,
      radarRotation: 0,
      laserTrackAngle: 0,
      flareIntensity: 0,
      antennaSway: 0
    };
  }

  function update(delta) {
    if (!delta) delta = 0.016; // ~60fps fallback

    animationState.droneSwarmAngle += delta * 1.5;
    animationState.radarRotation += delta * 0.8;
    animationState.laserTrackAngle += delta * 2;
    animationState.flareIntensity += delta * 3;
    animationState.antennaSway += delta * 1.2;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      var mesh = obj.mesh;

      // Drone swarm orbit animation
      if (obj.type === 'drone') {
        var radius = 3 + obj.index * 0.5;
        var angle = animationState.droneSwarmAngle + (obj.index * Math.PI / 2);
        var baseX = -15;
        mesh.position.x = baseX + Math.cos(angle) * radius;
        mesh.position.z = Math.sin(angle) * radius * 0.6;
        mesh.rotation.y = angle;
      }

      // Radar dome rotation
      if (obj.type === 'radarDome') {
        mesh.rotation.y = animationState.radarRotation;
      }

      // Laser barrel tracking
      if (obj.type === 'laserBarrel') {
        mesh.rotation.x = Math.sin(animationState.laserTrackAngle) * 0.5;
        mesh.rotation.z = Math.cos(animationState.laserTrackAngle * 0.7) * 0.3;
      }

      // Flare pulsing
      if (obj.type === 'flare') {
        var pulse = Math.sin(animationState.flareIntensity + obj.index) * 0.5 + 0.5;
        mesh.scale.set(1 + pulse * 0.3, 1, 1 + pulse * 0.3);
      }

      // Antenna swaying
      if (obj.type === 'antennaMast') {
        mesh.rotation.z = Math.sin(animationState.antennaSway) * 0.05;
      }

      // Control station monitor flicker
      if (obj.type === 'monitor') {
        mesh.material.emissive.setHex(Math.random() > 0.7 ? 0x00ff00 : 0x000000);
      }

      // Wreckage slight wobble
      if (obj.type === 'wreckage') {
        mesh.rotation.x += delta * 0.3;
        mesh.rotation.z += delta * 0.2;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      objects[i].mesh.geometry.dispose();
      objects[i].mesh.material.dispose();
      if (objects[i].mesh.parent) {
        objects[i].mesh.parent.remove(objects[i].mesh);
      }
    }
    objects = [];
    animationState = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
