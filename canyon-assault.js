window.CanyonAssault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var trackedObjects = [];
  var keybindState = [];
  var hudElement = null;
  var gameState = {
    bunkersClearedCount: 0,
    artilleryDestroyed: false,
    canyonSecured: false
  };

  var TIME_WINDOW = 400;
  var lastCKeyTime = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    trackedObjects = [];

    scene.fog = new THREE.Fog(0xd9b59e, 10, 100);
    scene.background = new THREE.Color(0xc9915d);

    createCanyonStructure();
    createEnemies();
    createFacilities();
    createAnimatedElements();
    createHUD();
    setupKeybinds();
  }

  function createCanyonStructure() {
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0xb8956a });

    // Left canyon wall
    var leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(2, 40, 80),
      wallMaterial
    );
    leftWall.position.set(-20, 20, 0);
    leftWall.castShadow = true;
    scene.add(leftWall);
    trackedObjects.push(leftWall);

    // Right canyon wall
    var rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(2, 40, 80),
      wallMaterial
    );
    rightWall.position.set(20, 20, 0);
    rightWall.castShadow = true;
    scene.add(rightWall);
    trackedObjects.push(rightWall);

    // Canyon floor
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(40, 1, 80),
      floorMaterial
    );
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);
    trackedObjects.push(floor);

    // Dry riverbed (lighter sandy floor section)
    var riverbed = new THREE.Mesh(
      new THREE.BoxGeometry(35, 0.5, 20),
      new THREE.MeshPhongMaterial({ color: 0xf4e4c1 })
    );
    riverbed.position.set(0, 0.1, -40);
    scene.add(riverbed);
    trackedObjects.push(riverbed);

    // Rock formations (stacked boxes at base of walls)
    var rockColors = [0x704214, 0x6b3f10, 0x8b5a2b];
    for (var i = 0; i < 6; i++) {
      var rockX = (i % 2 === 0) ? -18 : 18;
      var rockZ = -60 + (i * 12);
      var rock1 = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 3),
        new THREE.MeshPhongMaterial({ color: rockColors[i % 3] })
      );
      rock1.position.set(rockX, 1.5, rockZ);
      rock1.rotation.z = Math.random() * 0.3;
      scene.add(rock1);
      trackedObjects.push(rock1);
    }
  }

  function createEnemies() {
    var tanMaterial = new THREE.MeshPhongMaterial({ color: 0xd4a574 });

    // Desert troops in canyon (box figures)
    for (var i = 0; i < 3; i++) {
      var troopBody = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 0.8),
        tanMaterial
      );
      troopBody.position.set(-8 + i * 8, 1, -30 - i * 10);
      scene.add(troopBody);
      trackedObjects.push(troopBody);
    }

    // Sniper on left ledge
    var sniperPlatformL = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 3),
      new THREE.MeshPhongMaterial({ color: 0x696969 })
    );
    sniperPlatformL.position.set(-18, 25, -20);
    scene.add(sniperPlatformL);
    trackedObjects.push(sniperPlatformL);

    var sniperL = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.5, 0.8),
      tanMaterial
    );
    sniperL.position.set(-18, 26.5, -20);
    scene.add(sniperL);
    trackedObjects.push(sniperL);

    // Sniper on right ledge
    var sniperPlatformR = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 3),
      new THREE.MeshPhongMaterial({ color: 0x696969 })
    );
    sniperPlatformR.position.set(18, 25, 0);
    scene.add(sniperPlatformR);
    trackedObjects.push(sniperPlatformR);

    var sniperR = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.5, 0.8),
      tanMaterial
    );
    sniperR.position.set(18, 26.5, 0);
    scene.add(sniperR);
    trackedObjects.push(sniperR);
  }

  function createFacilities() {
    var concreteMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    var darkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var sandMaterial = new THREE.MeshPhongMaterial({ color: 0xcc9966 });

    // Concrete bunkers with narrow slits
    var bunkerPositions = [
      { x: -10, z: -50 },
      { x: 10, z: -50 },
      { x: -10, z: 20 },
      { x: 10, z: 20 }
    ];

    for (var i = 0; i < bunkerPositions.length; i++) {
      var pos = bunkerPositions[i];
      var bunker = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3, 4),
        concreteMaterial
      );
      bunker.position.set(pos.x, 1.5, pos.z);
      bunker.castShadow = true;
      scene.add(bunker);
      trackedObjects.push(bunker);

      // Bunker slit (thin vertical opening)
      var slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1, 3),
        darkMaterial
      );
      slit.position.set(pos.x + 2, 2, pos.z);
      scene.add(slit);
      trackedObjects.push(slit);
    }

    // Sandbag walls (stacked sphere/box clusters)
    for (var j = 0; j < 4; j++) {
      var sbWallX = -6 + j * 4;
      var sbWallZ = 40;
      var bag1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.6, 1.5),
        sandMaterial
      );
      bag1.position.set(sbWallX, 0.3, sbWallZ);
      scene.add(bag1);
      trackedObjects.push(bag1);

      var bag2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.6, 1.5),
        sandMaterial
      );
      bag2.position.set(sbWallX, 0.9, sbWallZ);
      scene.add(bag2);
      trackedObjects.push(bag2);
    }

    // Ammunition depot (box building)
    var ammoDepot = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 5),
      new THREE.MeshPhongMaterial({ color: 0x8b4513 })
    );
    ammoDepot.position.set(0, 2, 60);
    ammoDepot.castShadow = true;
    scene.add(ammoDepot);
    trackedObjects.push(ammoDepot);

    // Watchtower ladder (box + LineSegments rungs)
    var towerPole = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 15, 0.4),
      concreteMaterial
    );
    towerPole.position.set(-15, 7.5, 50);
    scene.add(towerPole);
    trackedObjects.push(towerPole);

    var ladderGeom = new THREE.BufferGeometry();
    var ladderVerts = [];
    for (var k = 0; k < 10; k++) {
      var yPos = 0.5 + k * 1.3;
      ladderVerts.push(-15.3, yPos, 50);
      ladderVerts.push(-14.7, yPos, 50);
    }
    ladderGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ladderVerts), 3));
    var ladderLine = new THREE.LineSegments(
      ladderGeom,
      new THREE.LineBasicMaterial({ color: 0x666666 })
    );
    scene.add(ladderLine);
    trackedObjects.push(ladderLine);

    // Observation post (small box shelter on ledge)
    var obsPost = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      concreteMaterial
    );
    obsPost.position.set(18, 27, 40);
    scene.add(obsPost);
    trackedObjects.push(obsPost);

    // Communication relay dish (cylinder + cone)
    var dishMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2, 8),
      concreteMaterial
    );
    dishMount.position.set(-15, 16, 45);
    scene.add(dishMount);
    trackedObjects.push(dishMount);

    var dish = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 0.8, 16),
      new THREE.MeshPhongMaterial({ color: 0xc0c0c0 })
    );
    dish.position.set(-15, 17.5, 45);
    scene.add(dish);
    trackedObjects.push(dish);

    // Supply truck (box vehicle)
    var truckBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 6),
      new THREE.MeshPhongMaterial({ color: 0x8b7355 })
    );
    truckBody.position.set(0, 1, 0);
    truckBody.userData.originalPos = { x: 0, y: 1, z: 0 };
    scene.add(truckBody);
    trackedObjects.push(truckBody);

    var truckCab = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      new THREE.MeshPhongMaterial({ color: 0x654321 })
    );
    truckCab.position.set(0, 2.3, 4);
    scene.add(truckCab);
    trackedObjects.push(truckCab);
  }

  function createAnimatedElements() {
    var metalMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

    // Artillery gun at canyon exit (box mount + cylinder barrel)
    var artilleryMount = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 3),
      metalMaterial
    );
    artilleryMount.position.set(0, 1, 75);
    scene.add(artilleryMount);
    trackedObjects.push(artilleryMount);

    var artilleryBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 5, 12),
      barrelMaterial
    );
    artilleryBarrel.rotation.z = Math.PI / 6;
    artilleryBarrel.position.set(0, 2.5, 75);
    artilleryBarrel.userData.originalZ = artilleryBarrel.position.z;
    artilleryBarrel.userData.originalX = artilleryBarrel.position.x;
    scene.add(artilleryBarrel);
    trackedObjects.push(artilleryBarrel);

    // Rope bridge across canyon gap (box planks + LineSegments ropes)
    var bridgeGeom = new THREE.BufferGeometry();
    var bridgeRopeVerts = [];
    var ropeLeft = -15;
    var ropeRight = 15;
    var bridgeZ = -70;

    for (var i = 0; i < 3; i++) {
      bridgeRopeVerts.push(ropeLeft, 8, bridgeZ + i * 1);
      bridgeRopeVerts.push(ropeLeft, 3, bridgeZ + i * 1);
      bridgeRopeVerts.push(ropeRight, 8, bridgeZ + i * 1);
      bridgeRopeVerts.push(ropeRight, 3, bridgeZ + i * 1);
    }

    bridgeGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bridgeRopeVerts), 3));
    var bridgeRopes = new THREE.LineSegments(
      bridgeGeom,
      new THREE.LineBasicMaterial({ color: 0x8b4513 })
    );
    bridgeRopes.userData.originalZ = bridgeZ;
    scene.add(bridgeRopes);
    trackedObjects.push(bridgeRopes);

    // Bridge planks
    for (var j = 0; j < 4; j++) {
      var plank = new THREE.Mesh(
        new THREE.BoxGeometry(30, 0.3, 1),
        new THREE.MeshPhongMaterial({ color: 0xa0826d })
      );
      plank.position.set(0, 3, bridgeZ + j * 0.9);
      plank.userData.originalZ = plank.position.z;
      scene.add(plank);
      trackedObjects.push(plank);
    }

    // Rockfall trap (box rocks above ready to fall)
    for (var k = 0; k < 4; k++) {
      var rockTrap = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshPhongMaterial({ color: 0x704214 })
      );
      rockTrap.position.set(-12 + k * 8, 35, -60);
      rockTrap.userData.fallActive = false;
      rockTrap.userData.originalY = rockTrap.position.y;
      scene.add(rockTrap);
      trackedObjects.push(rockTrap);
    }
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'canyon-assault-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#ffff00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
      hudElement.style.zIndex = '1000';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      var artStatus = gameState.artilleryDestroyed ? 'YES' : 'NO';
      var canyonStatus = gameState.canyonSecured ? 'YES' : 'NO';
      hudElement.innerHTML =
        'BUNKERS CLEARED: ' + gameState.bunkersClearedCount + '/4<br>' +
        'ARTILLERY DESTROYED: ' + artStatus + '<br>' +
        'CANYON SECURED: ' + canyonStatus;
    }
  }

  function setupKeybinds() {
    document.addEventListener('keydown', function(event) {
      if (event.key.toUpperCase() === 'C') {
        var now = Date.now();
        if (now - lastCKeyTime < TIME_WINDOW) {
          if (keybindState.length > 0 && keybindState[keybindState.length - 1] === 'C') {
            keybindState.push('A');
            if (keybindState.length >= 2) {
              toggleHUDNotification();
              keybindState = [];
            }
          }
        } else {
          keybindState = ['C'];
        }
        lastCKeyTime = now;
      } else if (event.key.toUpperCase() === 'A') {
        var now = Date.now();
        if (keybindState.length > 0 && keybindState[keybindState.length - 1] === 'C' &&
            now - lastCKeyTime < TIME_WINDOW) {
          keybindState.push('A');
          if (keybindState.length >= 2) {
            toggleHUDNotification();
            keybindState = [];
          }
        }
      }
    });
  }

  function toggleHUDNotification() {
    if (hudElement) {
      var wasVisible = hudElement.style.display !== 'none';
      hudElement.style.display = wasVisible ? 'none' : 'block';
    }
  }

  function update(delta) {
    if (!scene) return;

    // Animate artillery gun fire and recoil
    var artilleryBarrel = trackedObjects.find(function(obj) {
      return obj instanceof THREE.Mesh && obj.geometry instanceof THREE.CylinderGeometry &&
             obj.position.z === 75;
    });
    if (artilleryBarrel) {
      var firePhase = (Date.now() % 3000) / 3000;
      if (firePhase < 0.1) {
        artilleryBarrel.position.z = artilleryBarrel.userData.originalZ - 0.3;
      } else if (firePhase < 0.2) {
        artilleryBarrel.position.z = artilleryBarrel.userData.originalZ - 0.2;
      } else {
        artilleryBarrel.position.z = artilleryBarrel.userData.originalZ;
      }
    }

    // Rope bridge sway
    var swayPhase = (Date.now() % 4000) / 4000;
    var swayAmount = Math.sin(swayPhase * Math.PI * 2) * 0.5;

    trackedObjects.forEach(function(obj) {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BoxGeometry &&
          obj.userData.originalZ && Math.abs(obj.position.z - (-70 + obj.position.z % 4)) < 2) {
        if (obj.position.y < 5 && obj.position.y > 2) {
          obj.position.x = swayAmount;
        }
      }
      if (obj instanceof THREE.LineSegments && obj.userData.originalZ === -70) {
        obj.position.x = swayAmount;
      }
    });

    // Supply truck loops around canyon
    var truck = trackedObjects.find(function(o) {
      return o instanceof THREE.Mesh && o.userData.originalPos;
    });
    if (truck) {
      var truckPhase = (Date.now() % 8000) / 8000;
      var angle = truckPhase * Math.PI * 2;
      truck.position.x = Math.cos(angle) * 15;
      truck.position.z = Math.sin(angle) * 25;
    }

    // Rockfall trap triggers and releases
    trackedObjects.forEach(function(obj) {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BoxGeometry &&
          obj.userData.originalY && obj.userData.originalY > 30) {
        var fallPhase = (Date.now() % 5000) / 5000;
        if (fallPhase < 0.3) {
          obj.position.y = obj.userData.originalY;
          obj.userData.fallActive = false;
        } else if (fallPhase < 0.8) {
          obj.position.y = obj.userData.originalY - (fallPhase - 0.3) * 20;
          obj.userData.fallActive = true;
        } else {
          obj.position.y = obj.userData.originalY - 10;
          obj.userData.fallActive = true;
        }
      }
    });

    // Sniper scanning motion
    var snipers = trackedObjects.filter(function(o) {
      return o instanceof THREE.Mesh && o.geometry instanceof THREE.BoxGeometry &&
             o.position.y > 25 && (Math.abs(o.position.x) > 15);
    });
    snipers.forEach(function(sniper) {
      var scanPhase = (Date.now() % 3000) / 3000;
      sniper.rotation.y = (scanPhase * Math.PI * 2) * 0.2;
    });

    // Update commander in bunker (rotating)
    var bunkerSoldiers = trackedObjects.filter(function(o) {
      return o instanceof THREE.Mesh && o.geometry instanceof THREE.BoxGeometry &&
             o.position.y > 1.4 && o.position.y < 2 && o.position.z > 15;
    });
    bunkerSoldiers.forEach(function(soldier) {
      soldier.rotation.y += delta * 0.5;
    });

    updateHUD();
  }

  function reset() {
    trackedObjects.forEach(function(obj) {
      scene.remove(obj);
    });
    trackedObjects = [];
    gameState = {
      bunkersClearedCount: 0,
      artilleryDestroyed: false,
      canyonSecured: false
    };
    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
