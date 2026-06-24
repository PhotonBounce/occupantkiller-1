window.AncientPyramid = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var animatedObjects = [];
  var scene = null;
  var state = {
    torchIntensity: 1.0,
    boulderPos: 0,
    sarcophagusAngle: 0,
    mummyPulse: 0
  };

  function init(gameScene, camera) {
    scene = gameScene;
    objects = [];
    lights = [];
    animatedObjects = [];
    state = {
      torchIntensity: 1.0,
      boulderPos: 0,
      sarcophagusAngle: 0,
      mummyPulse: 0
    };

    // Desert sand floor
    var floorGeom = new THREE.BoxGeometry(200, 2, 200);
    var floorMat = new THREE.MeshPhongMaterial({ color: 0xF4D03F });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    // Build stepped pyramid
    var pyramidLayers = 6;
    var baseSize = 80;
    var layerHeight = 8;
    var sandstoneColor = 0xD2B48C;
    var sandMat = new THREE.MeshPhongMaterial({ color: sandstoneColor });

    for (var i = 0; i < pyramidLayers; i++) {
      var size = baseSize - (i * 12);
      var geom = new THREE.BoxGeometry(size, layerHeight, size);
      var mesh = new THREE.Mesh(geom, sandMat);
      mesh.position.y = i * layerHeight;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    }

    // Pyramid cap
    var capGeom = new THREE.ConeGeometry(12, 15, 4);
    var capMat = new THREE.MeshPhongMaterial({ color: 0xC9A061 });
    var cap = new THREE.Mesh(capGeom, capMat);
    cap.position.y = pyramidLayers * layerHeight + 7;
    cap.castShadow = true;
    scene.add(cap);
    objects.push(cap);

    // Interior burial chamber
    var chamberGeom = new THREE.BoxGeometry(30, 12, 35);
    var chamberMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var chamber = new THREE.Mesh(chamberGeom, chamberMat);
    chamber.position.set(0, 10, 0);
    chamber.castShadow = true;
    chamber.receiveShadow = true;
    scene.add(chamber);
    objects.push(chamber);

    // Sarcophagus in chamber
    var sarcophagusGeom = new THREE.BoxGeometry(8, 3, 15);
    var sarcophagusMat = new THREE.MeshPhongMaterial({ color: 0xA0522D });
    var sarcophagus = new THREE.Mesh(sarcophagusGeom, sarcophagusMat);
    sarcophagus.position.set(0, 13, 0);
    sarcophagus.castShadow = true;
    sarcophagus.userData.isSarcophagus = true;
    scene.add(sarcophagus);
    objects.push(sarcophagus);
    animatedObjects.push(sarcophagus);

    // Sarcophagus lid
    var lidGeom = new THREE.BoxGeometry(8.5, 1.5, 15.5);
    var lidMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var lid = new THREE.Mesh(lidGeom, lidMat);
    lid.position.set(0, 16.5, 0);
    lid.castShadow = true;
    lid.userData.isLid = true;
    lid.userData.pivotX = 0;
    lid.userData.pivotZ = 0;
    scene.add(lid);
    objects.push(lid);
    animatedObjects.push(lid);

    // Four corner sphinx statues
    var sphinxPositions = [
      { x: 50, z: 50 },
      { x: -50, z: 50 },
      { x: 50, z: -50 },
      { x: -50, z: -50 }
    ];

    var sphinxColor = 0xC2A06E;
    sphinxPositions.forEach(function(pos) {
      // Body
      var bodyGeom = new THREE.BoxGeometry(8, 6, 12);
      var sphinxMat = new THREE.MeshPhongMaterial({ color: sphinxColor });
      var body = new THREE.Mesh(bodyGeom, sphinxMat);
      body.position.set(pos.x, 3, pos.z);
      body.castShadow = true;
      scene.add(body);
      objects.push(body);

      // Head
      var headGeom = new THREE.SphereGeometry(3, 8, 8);
      var head = new THREE.Mesh(headGeom, sphinxMat);
      head.position.set(pos.x, 9, pos.z - 2);
      head.castShadow = true;
      scene.add(head);
      objects.push(head);
    });

    // Three treasure rooms with gold chests
    var treasurePositions = [
      { x: 30, z: -30 },
      { x: -30, z: 30 },
      { x: -40, z: -40 }
    ];

    var goldColor = 0xFFD700;
    treasurePositions.forEach(function(pos) {
      // Room
      var roomGeom = new THREE.BoxGeometry(20, 10, 20);
      var roomMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
      var room = new THREE.Mesh(roomGeom, roomMat);
      room.position.set(pos.x, 5, pos.z);
      room.castShadow = true;
      room.receiveShadow = true;
      scene.add(room);
      objects.push(room);

      // Gold chest
      var chestGeom = new THREE.BoxGeometry(6, 6, 6);
      var chestMat = new THREE.MeshPhongMaterial({
        color: goldColor,
        emissive: 0x997700,
        shininess: 100
      });
      var chest = new THREE.Mesh(chestGeom, chestMat);
      chest.position.set(pos.x, 8, pos.z);
      chest.castShadow = true;
      scene.add(chest);
      objects.push(chest);
    });

    // Mummy spawn zones
    var mummyZones = [
      { x: 20, z: 20 },
      { x: -20, z: -20 },
      { x: 25, z: -25 }
    ];

    var mummyColor = 0xE8DCC8;
    mummyZones.forEach(function(pos) {
      var zoneGeom = new THREE.BoxGeometry(12, 12, 12);
      var zoneMat = new THREE.MeshPhongMaterial({
        color: mummyColor,
        transparent: true,
        opacity: 0.3
      });
      var zone = new THREE.Mesh(zoneGeom, zoneMat);
      zone.position.set(pos.x, 6, pos.z);
      zone.userData.isMummyZone = true;
      zone.userData.pulsePhase = Math.random() * Math.PI * 2;
      scene.add(zone);
      objects.push(zone);
      animatedObjects.push(zone);
    });

    // Rolling boulder trap
    var boulderGeom = new THREE.SphereGeometry(5, 12, 12);
    var boulderMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var boulder = new THREE.Mesh(boulderGeom, boulderMat);
    boulder.position.set(0, 8, -50);
    boulder.castShadow = true;
    boulder.userData.isBoulder = true;
    scene.add(boulder);
    objects.push(boulder);
    animatedObjects.push(boulder);

    // Spike pit traps
    var spikePits = [
      { x: 15, z: -15 },
      { x: -15, z: 15 }
    ];

    var spikeColor = 0x888888;
    spikePits.forEach(function(pos) {
      for (var j = 0; j < 4; j++) {
        var spikeGeom = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
        var spikeMat = new THREE.MeshPhongMaterial({ color: spikeColor });
        var spike = new THREE.Mesh(spikeGeom, spikeMat);
        var offsetX = (j % 2) * 3 - 1.5;
        var offsetZ = Math.floor(j / 2) * 3 - 1.5;
        spike.position.set(pos.x + offsetX, 1.5, pos.z + offsetZ);
        spike.castShadow = true;
        scene.add(spike);
        objects.push(spike);
      }
    });

    // Entrance obelisks
    var obeliskPositions = [
      { x: -12, z: 60 },
      { x: 12, z: 60 }
    ];

    obeliskPositions.forEach(function(pos) {
      var obeliskGeom = new THREE.BoxGeometry(3, 25, 3);
      var obeliskMat = new THREE.MeshPhongMaterial({ color: 0xD2B48C });
      var obelisk = new THREE.Mesh(obeliskGeom, obeliskMat);
      obelisk.position.set(pos.x, 12.5, pos.z);
      obelisk.castShadow = true;
      scene.add(obelisk);
      objects.push(obelisk);
    });

    // Torch holders with lights
    var torchPositions = [
      { x: -25, z: 30 },
      { x: 25, z: 30 },
      { x: -25, z: -30 },
      { x: 25, z: -30 },
      { x: 0, z: 0 }
    ];

    var torchColor = 0xFF6600;
    torchPositions.forEach(function(pos) {
      // Torch holder
      var holderGeom = new THREE.CylinderGeometry(1.5, 2, 4, 8);
      var holderMat = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var holder = new THREE.Mesh(holderGeom, holderMat);
      holder.position.set(pos.x, 2, pos.z);
      holder.castShadow = true;
      scene.add(holder);
      objects.push(holder);

      // Flame (simple box with emissive)
      var flameGeom = new THREE.BoxGeometry(1, 2.5, 1);
      var flameMat = new THREE.MeshBasicMaterial({
        color: torchColor,
        emissive: torchColor
      });
      var flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(pos.x, 5, pos.z);
      flame.userData.isFlame = true;
      flame.userData.baseIntensity = 1.0;
      scene.add(flame);
      objects.push(flame);
      animatedObjects.push(flame);

      // Point light
      var light = new THREE.PointLight(torchColor, 1.5, 40);
      light.position.set(pos.x, 5, pos.z);
      light.castShadow = true;
      light.userData.isTorchLight = true;
      scene.add(light);
      lights.push(light);
      animatedObjects.push(light);
    });

    // Underground tunnel system
    var tunnelSegments = 3;
    for (var k = 0; k < tunnelSegments; k++) {
      var tunnelGeom = new THREE.BoxGeometry(8, 6, 15);
      var tunnelMat = new THREE.MeshPhongMaterial({ color: 0x4A4A4A });
      var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
      tunnel.position.set(-60 + k * 40, -5, 0);
      tunnel.castShadow = true;
      tunnel.receiveShadow = true;
      scene.add(tunnel);
      objects.push(tunnel);
    }

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Directional light for pyramid shadow
    var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    dirLight.position.set(100, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    lights.push(dirLight);
  }

  function update(delta) {
    state.mummyPulse += delta * 2;

    animatedObjects.forEach(function(obj) {
      if (obj.userData.isFlame) {
        // Flicker torch flames
        var flicker = Math.sin(state.mummyPulse * 3 + obj.position.x * 0.1) * 0.3 + 0.7;
        obj.material.emissiveIntensity = flicker;
      }

      if (obj.userData.isTorchLight) {
        // Flicker lights
        var lightFlicker = Math.sin(state.mummyPulse * 2.5 + obj.position.x * 0.15) * 0.4 + 0.8;
        obj.intensity = lightFlicker * 1.5;
      }

      if (obj.userData.isBoulder) {
        // Rolling boulder back and forth
        state.boulderPos += delta;
        var boulderOscillate = Math.sin(state.boulderPos * 0.5) * 8;
        obj.position.z = -50 + boulderOscillate;
        obj.rotation.z += delta * 2;
      }

      if (obj.userData.isLid) {
        // Sarcophagus lid opens
        state.sarcophagusAngle += delta * 0.3;
        if (state.sarcophagusAngle < Math.PI / 2) {
          obj.rotation.x = state.sarcophagusAngle;
          obj.position.y = 16.5 + Math.sin(state.sarcophagusAngle) * 3;
        }
      }

      if (obj.userData.isMummyZone) {
        // Mummy spawn zone pulsing
        var pulseAmount = Math.sin(state.mummyPulse + obj.userData.pulsePhase) * 0.15 + 0.85;
        obj.scale.set(pulseAmount, pulseAmount, pulseAmount);
      }
    });
  }

  function reset() {
    if (scene) {
      objects.forEach(function(obj) {
        scene.remove(obj);
      });
      lights.forEach(function(light) {
        scene.remove(light);
      });
    }
    objects = [];
    lights = [];
    animatedObjects = [];
    state = {
      torchIntensity: 1.0,
      boulderPos: 0,
      sarcophagusAngle: 0,
      mummyPulse: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
