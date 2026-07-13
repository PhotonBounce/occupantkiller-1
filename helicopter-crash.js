window.HelicopterCrash = (function() {
  'use strict';

  var scene, camera;
  var meshes = {};
  var time = 0;
  var hudElement = null;
  var keyDownTime = {};
  var survivors = 3;
  var enemyCount = 6;
  var rescueETA = 120;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    meshes = {};
    time = 0;

    // Set background color
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 300, 500);

    // 1. Mountain terrain - dark rocky ground
    var terrainGeom = new THREE.BoxGeometry(400, 0.3, 400);
    var terrainMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    var terrain = new THREE.Mesh(terrainGeom, terrainMat);
    terrain.position.set(0, -5, 0);
    scene.add(terrain);
    meshes.terrain = terrain;

    // Add some lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 2. Crashed helicopter body - crumpled fuselage
    var fuselageGeom = new THREE.BoxGeometry(12, 3, 4);
    var fuselageMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.position.set(0, 0, 0);
    fuselage.rotation.z = 0.3;
    fuselage.rotation.x = 0.1;
    scene.add(fuselage);
    meshes.fuselage = fuselage;

    // 3. Rotor blades - 2 long thin boxes bent at angles
    var blade1Geom = new THREE.BoxGeometry(0.5, 1, 20);
    var bladeMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var blade1 = new THREE.Mesh(blade1Geom, bladeMat);
    blade1.position.set(8, 2, -5);
    blade1.rotation.z = 0.4;
    blade1.rotation.y = 0.2;
    scene.add(blade1);
    meshes.blade1 = blade1;

    var blade2Geom = new THREE.BoxGeometry(0.5, 1, 18);
    var blade2 = new THREE.Mesh(blade2Geom, bladeMat);
    blade2.position.set(-10, 1.5, 8);
    blade2.rotation.z = -0.5;
    blade2.rotation.y = -0.3;
    scene.add(blade2);
    meshes.blade2 = blade2;

    // 4. Tail boom broken off
    var tailBoomGeom = new THREE.BoxGeometry(1, 1, 20);
    var tailBoomMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var tailBoom = new THREE.Mesh(tailBoomGeom, tailBoomMat);
    tailBoom.position.set(15, -1, 12);
    tailBoom.rotation.z = 0.6;
    scene.add(tailBoom);
    meshes.tailBoom = tailBoom;

    // 5. Burning fuel section - orange/red emissive cluster
    var fireGroup = new THREE.Group();
    var fireCluster = [];
    for (var i = 0; i < 4; i++) {
      var fireGeom = new THREE.SphereGeometry(1.5 + Math.random() * 1, 8, 8);
      var fireMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff6600 : 0xff3300,
        emissive: i % 2 === 0 ? 0xff6600 : 0xff3300
      });
      var fireSphere = new THREE.Mesh(fireGeom, fireMat);
      fireSphere.position.set(
        -3 + Math.random() * 6,
        1 + i * 0.5,
        -2 + Math.random() * 4
      );
      fireGroup.add(fireSphere);
      fireCluster.push(fireSphere);
    }
    fireGroup.position.set(2, 1, 0);
    scene.add(fireGroup);
    meshes.fireGroup = fireGroup;
    meshes.fireCluster = fireCluster;

    // 5b. Smoke boxes above wreck
    var smokeGroup = new THREE.Group();
    var smokeBoxes = [];
    for (var i = 0; i < 5; i++) {
      var smokeGeom = new THREE.BoxGeometry(8 - i * 1, 4, 6 - i * 0.5);
      var smokeMat = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3 - i * 0.05
      });
      var smokeBox = new THREE.Mesh(smokeGeom, smokeMat);
      smokeBox.position.set(0, 4 + i * 3, 0);
      smokeGroup.add(smokeBox);
      smokeBoxes.push(smokeBox);
    }
    scene.add(smokeGroup);
    meshes.smokeGroup = smokeGroup;
    meshes.smokeBoxes = smokeBoxes;

    // 6. Signal fire - cylinder base + tall orange emissive sphere on high rock
    var rockGeom = new THREE.BoxGeometry(4, 3, 4);
    var rockMat = new THREE.MeshPhongMaterial({ color: 0x3a3a2a });
    var signalRock = new THREE.Mesh(rockGeom, rockMat);
    signalRock.position.set(40, 1.5, -30);
    scene.add(signalRock);
    meshes.signalRock = signalRock;

    var firebaseGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var firebaseMat = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var firebase = new THREE.Mesh(firebaseGeom, firebaseMat);
    firebase.position.set(40, 4.5, -30);
    scene.add(firebase);
    meshes.firebase = firebase;

    var signalFireGeom = new THREE.SphereGeometry(2.5, 8, 8);
    var signalFireMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00
    });
    var signalFire = new THREE.Mesh(signalFireGeom, signalFireMat);
    signalFire.position.set(40, 8, -30);
    scene.add(signalFire);
    meshes.signalFire = signalFire;

    // 7. 3 crash survivor crew - olive green box figures
    var crewPositions = [
      { x: -5, y: 0.5, z: -8 },
      { x: 8, y: 0.5, z: 6 },
      { x: -2, y: 0, z: 2 }
    ];
    var crewGroup = new THREE.Group();
    for (var i = 0; i < 3; i++) {
      var crewGeom = new THREE.BoxGeometry(0.8, 1.8, 0.6);
      var crewMat = new THREE.MeshPhongMaterial({ color: 0x556633 });
      var crew = new THREE.Mesh(crewGeom, crewMat);
      crew.position.set(crewPositions[i].x, crewPositions[i].y, crewPositions[i].z);
      if (i === 2) {
        crew.rotation.z = Math.PI / 2; // one lying flat
      }
      crewGroup.add(crew);
    }
    scene.add(crewGroup);
    meshes.crewGroup = crewGroup;

    // 8. 6 enemy militia closing in - khaki box figures
    var enemyPositions = [
      { x: -80, y: 0.5, z: -60 },
      { x: 75, y: 0.5, z: -70 },
      { x: -70, y: 0.5, z: 80 },
      { x: 60, y: 0.5, z: 85 },
      { x: 80, y: 0.5, z: 20 },
      { x: -85, y: 0.5, z: 30 }
    ];
    var militiaGroup = new THREE.Group();
    for (var i = 0; i < 6; i++) {
      var militiaGeom = new THREE.BoxGeometry(0.7, 1.7, 0.5);
      var militiaMat = new THREE.MeshPhongMaterial({ color: 0x9a8a5a });
      var militia = new THREE.Mesh(militiaGeom, militiaMat);
      militia.position.set(enemyPositions[i].x, enemyPositions[i].y, enemyPositions[i].z);
      militiaGroup.add(militia);
    }
    scene.add(militiaGroup);
    meshes.militiaGroup = militiaGroup;

    // 9. 2 PJ pararescue team members - maroon beret box figures
    var pjGroup = new THREE.Group();
    var pjPositions = [
      { x: -50, y: 80, z: -80 },
      { x: 50, y: 80, z: 70 }
    ];
    for (var i = 0; i < 2; i++) {
      var pjGeom = new THREE.BoxGeometry(0.7, 1.7, 0.5);
      var pjMat = new THREE.MeshPhongMaterial({ color: 0x552200 });
      var pj = new THREE.Mesh(pjGeom, pjMat);
      pj.position.set(pjPositions[i].x, pjPositions[i].y, pjPositions[i].z);
      pjGroup.add(pj);
    }
    scene.add(pjGroup);
    meshes.pjGroup = pjGroup;

    // 10. Steep rocky ridgeline - 3 large irregular rock-pile clusters
    var ridgePositions = [
      { x: -120, z: -100 },
      { x: 100, z: 120 },
      { x: -80, z: 110 }
    ];
    var ridgeGroup = new THREE.Group();
    for (var r = 0; r < 3; r++) {
      for (var i = 0; i < 4; i++) {
        var rockGeom = new THREE.BoxGeometry(
          15 + Math.random() * 10,
          20 + Math.random() * 15,
          12 + Math.random() * 8
        );
        var rockMat = new THREE.MeshPhongMaterial({ color: 0x5a4a3a });
        var rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(
          ridgePositions[r].x + Math.random() * 20 - 10,
          15 + i * 8,
          ridgePositions[r].z + Math.random() * 20 - 10
        );
        rock.rotation.set(
          Math.random() * 0.3,
          Math.random() * 0.3,
          Math.random() * 0.3
        );
        ridgeGroup.add(rock);
      }
    }
    scene.add(ridgeGroup);
    meshes.ridgeGroup = ridgeGroup;

    // 11. Scattered equipment - 5 small box items
    var equipmentPositions = [
      { x: 12, y: 0.3, z: -5 },
      { x: -8, y: 0.3, z: 10 },
      { x: 5, y: 0.3, z: 8 },
      { x: -10, y: 0.3, z: -10 },
      { x: 15, y: 0.3, z: 3 }
    ];
    var equipGroup = new THREE.Group();
    var equipColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xff00ff];
    for (var i = 0; i < 5; i++) {
      var equipGeom = new THREE.BoxGeometry(0.6, 0.4, 0.8);
      var equipMat = new THREE.MeshPhongMaterial({ color: equipColors[i] });
      var equip = new THREE.Mesh(equipGeom, equipMat);
      equip.position.set(equipmentPositions[i].x, equipmentPositions[i].y, equipmentPositions[i].z);
      equipGroup.add(equip);
    }
    scene.add(equipGroup);
    meshes.equipGroup = equipGroup;

    // 12. Smoke column - large dark gray semi-transparent box stack
    // Already created above with smokeGroup

    // 13. Emergency beacon - flashing red emissive sphere
    var beaconGeom = new THREE.SphereGeometry(0.8, 8, 8);
    var beaconMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    });
    var beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(0, 2.5, 0);
    scene.add(beacon);
    meshes.beacon = beacon;

    // 14. Defensive position - crew using fuselage as cover
    var defensiveGeom = new THREE.BoxGeometry(6, 2, 0.5);
    var defensiveMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var defensive = new THREE.Mesh(defensiveGeom, defensiveMat);
    defensive.position.set(10, 1.5, 5);
    defensive.rotation.z = 0.25;
    scene.add(defensive);
    meshes.defensive = defensive;

    // 15. Mountain pine trees - 4 thin dark cylinders + cone tops
    var treePositions = [
      { x: -100, z: -50 },
      { x: 110, z: 60 },
      { x: -90, z: 100 },
      { x: 85, z: -80 }
    ];
    var treeGroup = new THREE.Group();
    for (var i = 0; i < 4; i++) {
      // Trunk
      var trunkGeom = new THREE.CylinderGeometry(0.5, 0.8, 15, 8);
      var trunkMat = new THREE.MeshPhongMaterial({ color: 0x2a2a1a });
      var trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(treePositions[i].x, 7.5, treePositions[i].z);
      treeGroup.add(trunk);

      // Crown - cone box
      var crownGeom = new THREE.BoxGeometry(8, 12, 8);
      var crownMat = new THREE.MeshPhongMaterial({ color: 0x1a3a1a });
      var crown = new THREE.Mesh(crownGeom, crownMat);
      crown.position.set(treePositions[i].x, 16, treePositions[i].z);
      treeGroup.add(crown);
    }
    scene.add(treeGroup);
    meshes.treeGroup = treeGroup;

    // 16. Inbound rescue helicopter - distant box shape
    var rescueHeliGeom = new THREE.BoxGeometry(6, 2, 10);
    var rescueHeliMat = new THREE.MeshPhongMaterial({ color: 0x006600 });
    var rescueHeli = new THREE.Mesh(rescueHeliGeom, rescueHeliMat);
    rescueHeli.position.set(-200, 60, 200);
    scene.add(rescueHeli);
    meshes.rescueHeli = rescueHeli;

    // Create HUD
    createHUD();
  }

  function createHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'hud-display';
    hudElement.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #00ff00; font-family: monospace; font-size: 16px; text-shadow: 0 0 10px #00ff00; pointer-events: none; z-index: 1000;';

    hudElement.innerHTML = 'CREW SURVIVORS: ' + survivors + '<br>ENEMY CLOSING: ' + enemyCount + '<br>RESCUE ETA: ' + rescueETA + 's';
    document.body.appendChild(hudElement);

    // Setup keyboard listeners for H+C toggle
    document.addEventListener('keydown', handleKeyDown);
  }

  function handleKeyDown(evt) {
    var now = Date.now();
    var key = evt.key.toUpperCase();

    if (key === 'H' || key === 'C') {
      if (!keyDownTime[key]) {
        keyDownTime[key] = now;
      }

      if (key === 'H' && keyDownTime['C'] && (now - keyDownTime['C']) < 400) {
        toggleHUD();
        keyDownTime = {};
      } else if (key === 'C' && keyDownTime['H'] && (now - keyDownTime['H']) < 400) {
        toggleHUD();
        keyDownTime = {};
      }
    }
  }

  function toggleHUD() {
    if (hudElement) {
      hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  function update(delta) {
    time += delta;

    if (!meshes.fireCluster) return;

    // Animate fire cluster - flickers and pulses
    for (var i = 0; i < meshes.fireCluster.length; i++) {
      var fire = meshes.fireCluster[i];
      fire.scale.x = 1 + Math.sin(time * 8 + i) * 0.3;
      fire.scale.y = 1 + Math.cos(time * 7 + i * 0.5) * 0.3;
      fire.scale.z = 1 + Math.sin(time * 6 + i * 0.7) * 0.3;
    }

    // Smoke column rises
    if (meshes.smokeBoxes) {
      for (var i = 0; i < meshes.smokeBoxes.length; i++) {
        var baseY = 4 + i * 3;
        meshes.smokeBoxes[i].position.y = baseY + Math.sin(time * 2 + i * 0.5) * 2;
      }
    }

    // Beacon blinks
    if (meshes.beacon) {
      meshes.beacon.visible = Math.floor(time * 2) % 2 === 0;
    }

    // Signal fire oscillates
    if (meshes.signalFire) {
      meshes.signalFire.scale.x = 1 + Math.sin(time * 1.5) * 0.2;
      meshes.signalFire.scale.y = 1 + Math.cos(time * 1.5) * 0.2;
      meshes.signalFire.scale.z = 1 + Math.sin(time * 1.5) * 0.2;
    }

    // Rescue helicopter approaches slowly
    if (meshes.rescueHeli) {
      meshes.rescueHeli.position.x += delta * 8;
      meshes.rescueHeli.position.z -= delta * 12;
      if (meshes.rescueHeli.position.x > 50) {
        meshes.rescueHeli.position.x = -200;
        meshes.rescueHeli.position.z = 200;
      }
    }

    // Militia converges toward origin
    if (meshes.militiaGroup) {
      var children = meshes.militiaGroup.children;
      for (var i = 0; i < children.length; i++) {
        children[i].position.x -= Math.sign(children[i].position.x) * delta * 5;
        children[i].position.z -= Math.sign(children[i].position.z) * delta * 5;
      }
    }

    // Pararescue descends
    if (meshes.pjGroup) {
      var children = meshes.pjGroup.children;
      for (var i = 0; i < children.length; i++) {
        children[i].position.y -= delta * 10;
        if (children[i].position.y < 0) {
          children[i].position.y = 80;
        }
      }
    }

    // Update HUD timer
    rescueETA = Math.max(0, 120 - Math.floor(time));
    if (hudElement) {
      hudElement.innerHTML = 'CREW SURVIVORS: ' + survivors + '<br>ENEMY CLOSING: ' + enemyCount + '<br>RESCUE ETA: ' + rescueETA + 's';
    }
  }

  function reset() {
    time = 0;
    survivors = 3;
    enemyCount = 6;
    rescueETA = 120;
    keyDownTime = {};

    if (hudElement) {
      hudElement.style.display = 'block';
    }

    // Reset positions
    if (meshes.rescueHeli) {
      meshes.rescueHeli.position.set(-200, 60, 200);
    }

    if (meshes.militiaGroup) {
      var militiaPositions = [
        { x: -80, y: 0.5, z: -60 },
        { x: 75, y: 0.5, z: -70 },
        { x: -70, y: 0.5, z: 80 },
        { x: 60, y: 0.5, z: 85 },
        { x: 80, y: 0.5, z: 20 },
        { x: -85, y: 0.5, z: 30 }
      ];
      var children = meshes.militiaGroup.children;
      for (var i = 0; i < children.length; i++) {
        if (militiaPositions[i]) {
          children[i].position.x = militiaPositions[i].x;
          children[i].position.y = militiaPositions[i].y;
          children[i].position.z = militiaPositions[i].z;
        }
      }
    }

    if (meshes.pjGroup) {
      var pjPositions = [
        { x: -50, y: 80, z: -80 },
        { x: 50, y: 80, z: 70 }
      ];
      var children = meshes.pjGroup.children;
      for (var i = 0; i < children.length; i++) {
        if (pjPositions[i]) {
          children[i].position.x = pjPositions[i].x;
          children[i].position.y = pjPositions[i].y;
          children[i].position.z = pjPositions[i].z;
        }
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
