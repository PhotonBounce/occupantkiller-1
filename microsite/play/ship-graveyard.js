window.ShipGraveyard = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var graveyard = null;
  var ships = [];
  var animatedObjects = [];
  var totalGeometryCount = 0;

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    graveyard = new THREE.Group();
    scene.add(graveyard);

    ships = [];
    animatedObjects = [];
    totalGeometryCount = 0;

    // Create the graveyard environment
    createWaterSurface();
    createShips();
    createDebrisField();
    createSmugglerCamp();
    createBridgeWalkways();
    createSeagullPerches();
    createCoralBarnacles();

    console.log('Ship Graveyard initialized with ' + totalGeometryCount + ' geometry objects');
  }

  function createWaterSurface() {
    var waterGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a3a52,
      shininess: 30
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = -0.25;
    water.castShadow = true;
    water.receiveShadow = true;
    graveyard.add(water);
    totalGeometryCount++;
  }

  function createShips() {
    // Ship 1: Large battleship at angle
    var ship1 = createShip(1, -20, -0.5, -15, -0.3, 0.1, 0);
    ships.push(ship1);

    // Ship 2: Cruiser at different angle
    var ship2 = createShip(2, 15, 0.3, 10, 0.25, -0.15, 0.2);
    ships.push(ship2);

    // Ship 3: Destroyer tilted more
    var ship3 = createShip(3, -5, -0.2, 25, -0.2, 0.25, -0.1);
    ships.push(ship3);

    // Ship 4: Frigate almost capsized
    var ship4 = createShip(4, 25, 0.4, -10, 0.4, -0.3, 0.15);
    ships.push(ship4);

    // Ship 5: Small patrol vessel
    var ship5 = createShip(5, 0, 0.1, -30, 0.1, 0.1, -0.05);
    ships.push(ship5);
  }

  function createShip(shipId, posX, rotX, posZ, tiltX, tiltZ, tiltY) {
    var shipGroup = new THREE.Group();
    shipGroup.position.set(posX, 2, posZ);
    shipGroup.rotation.x = tiltX;
    shipGroup.rotation.z = tiltZ;
    shipGroup.rotation.y = tiltY;

    var hullLength = 15 + shipId;
    var hullWidth = 4 + shipId * 0.3;
    var hullHeight = 3 + shipId * 0.2;

    // Hull
    var hullGeometry = new THREE.BoxGeometry(hullWidth, hullHeight, hullLength);
    var hullMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a2f1e,
      shininess: 20
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    hull.position.y = -hullHeight / 2;
    shipGroup.add(hull);
    totalGeometryCount++;

    // Superstructure
    var superGeometry = new THREE.BoxGeometry(hullWidth * 0.6, hullHeight * 0.8, hullLength * 0.4);
    var superMaterial = new THREE.MeshPhongMaterial({
      color: 0x6b4423,
      shininess: 15
    });
    var superstructure = new THREE.Mesh(superGeometry, superMaterial);
    superstructure.castShadow = true;
    superstructure.receiveShadow = true;
    superstructure.position.set(0, hullHeight * 0.4, hullLength * 0.1);
    shipGroup.add(superstructure);
    totalGeometryCount++;

    // Funnels (smokestacks)
    var funnelCount = 2 + shipId % 3;
    for (var f = 0; f < funnelCount; f++) {
      var funnelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
      var funnelMaterial = new THREE.MeshPhongMaterial({
        color: 0x331a0a,
        shininess: 10
      });
      var funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
      funnel.castShadow = true;
      funnel.receiveShadow = true;
      funnel.position.set(hullWidth * 0.2 - f * 0.6, hullHeight * 0.6, hullLength * 0.2 - f * 0.3);
      shipGroup.add(funnel);
      totalGeometryCount++;
    }

    // Gun turrets
    var turretCount = 2 + shipId;
    for (var t = 0; t < turretCount; t++) {
      var turretBaseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
      var turretMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a3a2a,
        shininess: 12
      });
      var turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
      turretBase.castShadow = true;
      turretBase.receiveShadow = true;
      turretBase.position.set((t % 2) ? 1.5 : -1.5, hullHeight * 0.5, hullLength * (0.25 - t * 0.15));
      shipGroup.add(turretBase);
      totalGeometryCount++;

      // Gun barrels
      for (var b = 0; b < 2; b++) {
        var gunGeometry = new THREE.BoxGeometry(0.25, 0.25, 2.5);
        var gunMaterial = new THREE.MeshPhongMaterial({
          color: 0x2a1a0a,
          shininess: 8
        });
        var gun = new THREE.Mesh(gunGeometry, gunMaterial);
        gun.castShadow = true;
        gun.receiveShadow = true;
        gun.position.set((b ? 0.4 : -0.4), 0.6, 1.3);
        gun.rotation.x = -0.2;
        turretBase.add(gun);
        totalGeometryCount++;
      }
    }

    // Exposed ribs (LineSegments)
    var ribCount = 8 + shipId;
    for (var r = 0; r < ribCount; r++) {
      var ribPoints = [
        new THREE.Vector3(-hullWidth / 2, 0, (r - ribCount / 2) * 1.5),
        new THREE.Vector3(hullWidth / 2, hullHeight / 2, (r - ribCount / 2) * 1.5)
      ];
      var ribGeometry = new THREE.BufferGeometry().setFromPoints(ribPoints);
      var ribMaterial = new THREE.LineBasicMaterial({
        color: 0x8b4513,
        linewidth: 2
      });
      var rib = new THREE.LineSegments(ribGeometry, ribMaterial);
      shipGroup.add(rib);
      totalGeometryCount++;
    }

    // Mast
    var mastGeometry = new THREE.CylinderGeometry(0.3, 0.4, 6, 8);
    var mastMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      shininess: 5
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.castShadow = true;
    mast.receiveShadow = true;
    mast.position.set(hullWidth * -0.3, hullHeight * 1.2, hullLength * 0.1);
    shipGroup.add(mast);
    totalGeometryCount++;

    // Wire rigging (LineSegments)
    var rigWires = [
      new THREE.Vector3(0, 0, -2),
      new THREE.Vector3(-3, 0, 0),
      new THREE.Vector3(0, 0, 2),
      new THREE.Vector3(3, 0, 0)
    ];
    for (var w = 0; w < rigWires.length; w++) {
      var rigPoints = [
        new THREE.Vector3(0, 6, 0),
        rigWires[w].clone().multiplyScalar(1.5)
      ];
      var rigGeometry = new THREE.BufferGeometry().setFromPoints(rigPoints);
      var rigMaterial = new THREE.LineBasicMaterial({
        color: 0xcccccc,
        linewidth: 1
      });
      var rig = new THREE.LineSegments(rigGeometry, rigMaterial);
      mast.add(rig);
      totalGeometryCount++;
    }

    // Ammunition lockers (crates)
    var lockerCount = 3 + shipId;
    for (var l = 0; l < lockerCount; l++) {
      var lockerGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      var lockerMaterial = new THREE.MeshPhongMaterial({
        color: 0x5a4a3a,
        shininess: 15
      });
      var locker = new THREE.Mesh(lockerGeometry, lockerMaterial);
      locker.castShadow = true;
      locker.receiveShadow = true;
      locker.position.set(hullWidth * 0.3 + l * 1.2, hullHeight + 0.5, hullLength * 0.2 - l * 0.8);
      shipGroup.add(locker);
      totalGeometryCount++;
    }

    // Anchors (hanging from chains)
    var anchorGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.3);
    var anchorMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      shininess: 8
    });
    var anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor.castShadow = true;
    anchor.receiveShadow = true;
    anchor.position.set(hullWidth * -0.4, -hullHeight * 0.8, hullLength * -0.3);
    shipGroup.add(anchor);
    totalGeometryCount++;

    // Anchor chain (LineSegments)
    var chainPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -3, 0)
    ];
    var chainGeometry = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainMaterial = new THREE.LineBasicMaterial({
      color: 0x333333,
      linewidth: 1
    });
    var chain = new THREE.LineSegments(chainGeometry, chainMaterial);
    chain.position.copy(anchor.position);
    chain.position.y += 1.5;
    shipGroup.add(chain);
    totalGeometryCount++;

    shipGroup.userData.baseY = shipGroup.position.y;
    shipGroup.userData.bobAmplitude = 0.3 + Math.random() * 0.2;
    shipGroup.userData.bobSpeed = 0.5 + Math.random() * 0.3;
    shipGroup.userData.bobPhase = Math.random() * Math.PI * 2;
    animatedObjects.push(shipGroup);

    graveyard.add(shipGroup);
    return shipGroup;
  }

  function createDebrisField() {
    // Metal chunks scattered around
    var debrisCount = 20 + ships.length * 5;
    for (var d = 0; d < debrisCount; d++) {
      var debrisGeometry = new THREE.BoxGeometry(
        0.5 + Math.random() * 1.5,
        0.3 + Math.random() * 0.8,
        0.5 + Math.random() * 1.5
      );
      var debrisMaterial = new THREE.MeshPhongMaterial({
        color: 0x5a3a2a + Math.floor(Math.random() * 0x2a2a2a),
        shininess: 5
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.castShadow = true;
      debris.receiveShadow = true;
      debris.position.set(
        (Math.random() - 0.5) * 70,
        0.2 + Math.random() * 0.3,
        (Math.random() - 0.5) * 70
      );
      debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      graveyard.add(debris);
      totalGeometryCount++;
    }

    // Shell casings (CylinderGeometry)
    var caseCount = 15;
    for (var c = 0; c < caseCount; c++) {
      var caseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
      var caseMaterial = new THREE.MeshPhongMaterial({
        color: 0xcc8833,
        shininess: 20
      });
      var shellCase = new THREE.Mesh(caseGeometry, caseMaterial);
      shellCase.castShadow = true;
      shellCase.receiveShadow = true;
      shellCase.position.set(
        (Math.random() - 0.5) * 60,
        0.4,
        (Math.random() - 0.5) * 60
      );
      shellCase.rotation.z = Math.random() * Math.PI;
      graveyard.add(shellCase);
      totalGeometryCount++;
    }
  }

  function createSmugglerCamp() {
    var campX = 10;
    var campZ = 15;

    // Find a ship to place camp on (using ship 1 position area)
    var campGroup = new THREE.Group();
    campGroup.position.set(campX, 6, campZ);
    graveyard.add(campGroup);

    // Tents (BoxGeometry)
    var tentCount = 4;
    for (var tn = 0; tn < tentCount; tn++) {
      var tentGeometry = new THREE.BoxGeometry(2, 2, 2);
      var tentMaterial = new THREE.MeshPhongMaterial({
        color: 0x8b6914,
        shininess: 10
      });
      var tent = new THREE.Mesh(tentGeometry, tentMaterial);
      tent.castShadow = true;
      tent.receiveShadow = true;
      tent.position.x = tn * 3 - 4.5;
      tent.position.z = Math.sin(tn) * 2;
      campGroup.add(tent);
      totalGeometryCount++;
    }

    // Campfire glow (SphereGeometry)
    var fireGeometry = new THREE.SphereGeometry(1, 16, 16);
    var fireMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      shininess: 30
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.castShadow = true;
    fire.receiveShadow = true;
    fire.scale.y = 1.5;
    fire.position.set(-6, 0.5, 0);
    campGroup.add(fire);
    totalGeometryCount++;

    campGroup.userData.fireGlow = fire;
    animatedObjects.push(campGroup);
  }

  function createBridgeWalkways() {
    // Connect ships with walkways
    var bridgeCount = 3;
    for (var br = 0; br < bridgeCount; br++) {
      var ship1 = ships[br];
      var ship2 = ships[(br + 1) % ships.length];

      var bridgeGeometry = new THREE.BoxGeometry(2, 0.3, 15);
      var bridgeMaterial = new THREE.MeshPhongMaterial({
        color: 0x3a3a4a,
        shininess: 12
      });
      var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.castShadow = true;
      bridge.receiveShadow = true;

      var midX = (ship1.position.x + ship2.position.x) / 2;
      var midZ = (ship1.position.z + ship2.position.z) / 2;
      bridge.position.set(midX, 4.5, midZ);

      var dx = ship2.position.x - ship1.position.x;
      var dz = ship2.position.z - ship1.position.z;
      bridge.rotation.y = Math.atan2(dx, dz);

      graveyard.add(bridge);
      totalGeometryCount++;

      // Railing (LineSegments)
      var railPoints = [
        new THREE.Vector3(-1, 0.3, -7.5),
        new THREE.Vector3(-1, 0.3, 7.5)
      ];
      var railGeometry = new THREE.BufferGeometry().setFromPoints(railPoints);
      var railMaterial = new THREE.LineBasicMaterial({
        color: 0x666666,
        linewidth: 2
      });
      var rail = new THREE.LineSegments(railGeometry, railMaterial);
      bridge.add(rail);
      totalGeometryCount++;
    }
  }

  function createSeagullPerches() {
    var perchCount = 8;
    for (var sp = 0; sp < perchCount; sp++) {
      var shipIndex = sp % ships.length;
      var ship = ships[shipIndex];

      var birdGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      var birdMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        shininess: 15
      });
      var bird = new THREE.Mesh(birdGeometry, birdMaterial);
      bird.castShadow = true;
      bird.receiveShadow = true;

      var localX = (Math.random() - 0.5) * 2;
      var localY = 6 + Math.random() * 2;
      var localZ = (Math.random() - 0.5) * 10;

      bird.position.set(
        ship.position.x + localX,
        ship.position.y + localY,
        ship.position.z + localZ
      );

      graveyard.add(bird);
      totalGeometryCount++;
    }
  }

  function createCoralBarnacles() {
    var coralColors = [0x8b5a3c, 0x6b4423, 0x9b5a4c, 0x7b3a2c, 0xab6a5c];
    var coralCount = 25 + ships.length * 10;

    for (var cr = 0; cr < coralCount; cr++) {
      var coralGeometry = new THREE.SphereGeometry(
        0.3 + Math.random() * 0.5,
        6 + Math.floor(Math.random() * 6),
        6 + Math.floor(Math.random() * 6)
      );
      var colorIndex = Math.floor(Math.random() * coralColors.length);
      var coralMaterial = new THREE.MeshPhongMaterial({
        color: coralColors[colorIndex],
        shininess: 8
      });
      var coral = new THREE.Mesh(coralGeometry, coralMaterial);
      coral.castShadow = true;
      coral.receiveShadow = true;

      // Cluster around ships
      var shipIndex = Math.floor(Math.random() * ships.length);
      var ship = ships[shipIndex];

      coral.position.set(
        ship.position.x + (Math.random() - 0.5) * 8,
        -0.5 + Math.random() * 1.5,
        ship.position.z + (Math.random() - 0.5) * 10
      );

      coral.scale.set(
        0.7 + Math.random() * 0.6,
        0.8 + Math.random() * 0.5,
        0.7 + Math.random() * 0.6
      );

      graveyard.add(coral);
      totalGeometryCount++;
    }
  }

  function update(delta) {
    if (!graveyard) return;

    // Animate bobbing ships
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.userData.bobAmplitude !== undefined) {
        var bobY = obj.userData.baseY + Math.sin(Date.now() * 0.001 * obj.userData.bobSpeed + obj.userData.bobPhase) * obj.userData.bobAmplitude;
        obj.position.y = bobY;
      }
    }

    // Animate campfire flicker
    for (var j = 0; j < animatedObjects.length; j++) {
      var campObj = animatedObjects[j];
      if (campObj.userData.fireGlow) {
        var flicker = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
        campObj.userData.fireGlow.scale.set(flicker, flicker * 1.5, flicker);
        var brightness = 0.5 + Math.random() * 0.5;
        campObj.userData.fireGlow.material.emissive.multiplyScalar(brightness);
      }
    }
  }

  function reset() {
    if (graveyard && scene) {
      scene.remove(graveyard);
    }
    graveyard = null;
    ships = [];
    animatedObjects = [];
    totalGeometryCount = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
