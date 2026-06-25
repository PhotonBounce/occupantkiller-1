var PlagueCove = (function() {
  'use strict';

  var scene, camera, animationState, waterMaterial, beaconLight, rotatingParts;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    animationState = { time: 0 };
    rotatingParts = [];

    buildWater();
    buildDocks();
    buildPlagueship();
    buildLighthouse();
    buildQuarantineZone();
    buildFishingShacks();
    buildBiohazardCrates();
    buildBarricades();
  }

  function buildWater() {
    var waterGeometry = new THREE.CylinderGeometry(400, 400, 8, 64, 8);
    waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x1a1a2e,
      emissiveIntensity: 0.3
    });
    var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.position.y = -10;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
  }

  function buildDocks() {
    var pilingCount = 8;
    for (var i = 0; i < pilingCount; i++) {
      var angle = (i / pilingCount) * Math.PI * 2;
      var x = Math.cos(angle) * 120;
      var z = Math.sin(angle) * 120;

      var pilingGeometry = new THREE.CylinderGeometry(3, 3.5, 40, 8);
      var pilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        metalness: 0.4,
        roughness: 0.8
      });
      var piling = new THREE.Mesh(pilingGeometry, pilingMaterial);
      piling.position.set(x, 0, z);
      piling.castShadow = true;
      piling.receiveShadow = true;
      scene.add(piling);
    }

    var deckGeometry = new THREE.BoxGeometry(160, 2, 60);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x332211,
      metalness: 0.2,
      roughness: 0.9
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 15, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
  }

  function buildPlagueship() {
    var hullGeometry = new THREE.BoxGeometry(80, 30, 25);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.85
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(60, 8, 50);
    hull.castShadow = true;
    scene.add(hull);

    var superstructureGeometry = new THREE.BoxGeometry(30, 25, 20);
    var superstructure = new THREE.Mesh(superstructureGeometry, hullMaterial);
    superstructure.position.set(75, 30, 50);
    superstructure.castShadow = true;
    scene.add(superstructure);

    var mastGeometry = new THREE.CylinderGeometry(1.5, 1.5, 50, 6);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(75, 40, 50);
    mast.castShadow = true;
    scene.add(mast);

    var sailGeometry = new THREE.BoxGeometry(35, 30, 1);
    var sailMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a0000,
      emissive: 0x440000,
      emissiveIntensity: 0.4
    });
    var sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.position.set(60, 32, 68);
    sail.castShadow = true;
    scene.add(sail);
  }

  function buildLighthouse() {
    var towerGeometry = new THREE.CylinderGeometry(8, 9, 60, 12);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a5c3c,
      metalness: 0.2,
      roughness: 0.8
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(-90, 20, -80);
    tower.castShadow = true;
    scene.add(tower);

    var lanternGeometry = new THREE.CylinderGeometry(6, 6, 8, 8);
    var lanternMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.5
    });
    var lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
    lantern.position.set(-90, 65, -80);
    scene.add(lantern);

    var beaconGeometry = new THREE.CylinderGeometry(5, 5, 1, 8);
    var beaconMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
    var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.set(-90, 73, -80);
    beacon.castShadow = true;
    scene.add(beacon);

    beaconLight = new THREE.PointLight(0xff0000, 2, 200);
    beaconLight.position.set(-90, 75, -80);
    beaconLight.castShadow = true;
    scene.add(beaconLight);

    rotatingParts.push({ object: beacon, speed: 2 });
  }

  function buildQuarantineZone() {
    var crateStack = function(x, z) {
      for (var row = 0; row < 3; row++) {
        var crateGeometry = new THREE.BoxGeometry(8, 8, 8);
        var crateMaterial = new THREE.MeshStandardMaterial({
          color: 0x2a5f2a,
          metalness: 0.3,
          roughness: 0.7
        });
        var crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(x, 4 + row * 8, z);
        crate.castShadow = true;
        scene.add(crate);
      }
    };

    crateStack(-40, 30);
    crateStack(-40, 50);
    crateStack(-60, 40);
  }

  function buildFishingShacks() {
    var buildShack = function(x, z, label) {
      var wallGeometry = new THREE.BoxGeometry(15, 12, 12);
      var wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x5c5c5c,
        metalness: 0.1,
        roughness: 0.9
      });
      var walls = new THREE.Mesh(wallGeometry, wallMaterial);
      walls.position.set(x, 7, z);
      walls.castShadow = true;
      scene.add(walls);

      var roofGeometry = new THREE.ConeGeometry(10, 6, 4);
      var roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.2
      });
      var roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(x, 16, z);
      roof.castShadow = true;
      scene.add(roof);

      var sniperWindowGeometry = new THREE.BoxGeometry(3, 3, 0.5);
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        emissive: 0x333333,
        emissiveIntensity: 0.2
      });
      var window = new THREE.Mesh(sniperWindowGeometry, windowMaterial);
      window.position.set(x + 8, 10, z - 6.5);
      scene.add(window);
    };

    buildShack(80, -60);
    buildShack(100, -40);
    buildShack(120, -50);
  }

  function buildBiohazardCrates() {
    var drumCount = 12;
    for (var i = 0; i < drumCount; i++) {
      var angle = (i / drumCount) * Math.PI * 2;
      var x = Math.cos(angle) * 70;
      var z = Math.sin(angle) * 70;

      var drumGeometry = new THREE.CylinderGeometry(2.5, 2.5, 6, 8);
      var drumMaterial = new THREE.MeshStandardMaterial({
        color: 0xff7700,
        metalness: 0.4,
        roughness: 0.6,
        emissive: 0xff3300,
        emissiveIntensity: 0.2
      });
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(x, 3.5, z);
      drum.castShadow = true;
      scene.add(drum);

      var stripeGeometry = new THREE.CylinderGeometry(2.6, 2.6, 0.3, 8);
      var stripeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000
      });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(x, 3, z);
      scene.add(stripe);
    }
  }

  function buildBarricades() {
    var barricadeCount = 6;
    for (var i = 0; i < barricadeCount; i++) {
      var angle = (i / barricadeCount) * Math.PI * 2;
      var radius = 110;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var barricadeGeometry = new THREE.BoxGeometry(20, 8, 1.5);
      var barricadeMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        metalness: 0.5,
        roughness: 0.5,
        emissive: 0x440000,
        emissiveIntensity: 0.1
      });
      var barricade = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
      barricade.position.set(x, 4, z);
      barricade.rotation.z = angle;
      barricade.castShadow = true;
      scene.add(barricade);

      var warningGeometry = new THREE.BoxGeometry(2, 2, 0.2);
      var warningMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
      });
      var warning = new THREE.Mesh(warningGeometry, warningMaterial);
      warning.position.set(x - 5, 6, z - 1);
      scene.add(warning);
    }
  }

  function update(delta) {
    animationState.time += delta;

    if (waterMaterial) {
      waterMaterial.emissiveIntensity = 0.25 + Math.sin(animationState.time * 2) * 0.08;
    }

    if (beaconLight) {
      beaconLight.intensity = 1.5 + Math.sin(animationState.time * 4) * 0.8;
    }

    for (var i = 0; i < rotatingParts.length; i++) {
      var part = rotatingParts[i];
      part.object.rotation.y += part.speed * delta;
    }
  }

  function reset() {
    animationState.time = 0;
    for (var i = scene.children.length - 1; i >= 0; i--) {
      scene.remove(scene.children[i]);
    }
    rotatingParts = [];
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
