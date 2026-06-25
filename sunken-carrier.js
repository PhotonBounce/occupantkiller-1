window.SunkenCarrier = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var carrierGroup = null;
  var lights = [];
  var corals = [];
  var flickerLights = [];
  var deltaTime = 0;

  function buildCarrierHull() {
    var hullGroup = new THREE.Group();

    var mainHull = new THREE.Mesh(
      new THREE.BoxGeometry(150, 40, 30),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2a, roughness: 0.8 })
    );
    mainHull.position.y = -25;
    mainHull.castShadow = true;
    mainHull.receiveShadow = true;
    hullGroup.add(mainHull);

    var bow = new THREE.Mesh(
      new THREE.ConeGeometry(15, 25, 8),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    bow.position.set(75, -20, 0);
    bow.rotation.z = Math.PI / 2;
    bow.castShadow = true;
    hullGroup.add(bow);

    return hullGroup;
  }

  function buildFlightDeck() {
    var deckGroup = new THREE.Group();
    var deckMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a, map: null });

    var deck = new THREE.Mesh(
      new THREE.BoxGeometry(140, 3, 35),
      deckMaterial
    );
    deck.position.set(0, 20, 0);
    deck.rotation.z = Math.PI * 0.12;
    deck.castShadow = true;
    deck.receiveShadow = true;
    deckGroup.add(deck);

    return deckGroup;
  }

  function buildFighterPlanes() {
    var planesGroup = new THREE.Group();
    var positions = [
      { x: -40, z: -10 },
      { x: -20, z: 10 },
      { x: 20, z: -8 },
      { x: 50, z: 12 }
    ];

    positions.forEach(function(pos) {
      var fuselage = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 20, 8),
        new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
      );
      fuselage.position.set(pos.x, 24, pos.z);
      fuselage.rotation.z = Math.PI / 2;
      fuselage.castShadow = true;
      planesGroup.add(fuselage);

      var wing = new THREE.Mesh(
        new THREE.BoxGeometry(25, 1, 8),
        new THREE.MeshPhongMaterial({ color: 0x3a3a3a })
      );
      wing.position.set(pos.x, 25, pos.z);
      wing.castShadow = true;
      planesGroup.add(wing);
    });

    return planesGroup;
  }

  function buildHangarBays() {
    var hangarGroup = new THREE.Group();

    var bayLeft = new THREE.Mesh(
      new THREE.BoxGeometry(45, 35, 28),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide })
    );
    bayLeft.position.set(-50, -10, 0);
    bayLeft.castShadow = true;
    hangarGroup.add(bayLeft);

    var bayRight = new THREE.Mesh(
      new THREE.BoxGeometry(45, 35, 28),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide })
    );
    bayRight.position.set(50, -10, 0);
    bayRight.castShadow = true;
    hangarGroup.add(bayRight);

    return hangarGroup;
  }

  function buildTorpedoHoles() {
    var holesGroup = new THREE.Group();
    var positions = [
      { x: -60, y: -15, z: -12 },
      { x: -55, y: -18, z: 8 },
      { x: 45, y: -12, z: -10 }
    ];

    positions.forEach(function(pos) {
      var hole = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 5, 16),
        new THREE.MeshPhongMaterial({ color: 0x0a0a0a })
      );
      hole.position.set(pos.x, pos.y, pos.z);
      hole.rotation.z = Math.PI / 2;
      hole.castShadow = true;
      holesGroup.add(hole);
    });

    return holesGroup;
  }

  function buildCoralGrowth() {
    var coralGroup = new THREE.Group();
    var coralMaterial = new THREE.MeshPhongMaterial({ color: 0xff8844 });

    var coralPositions = [
      { x: -70, y: -35, z: 15, scale: 3 },
      { x: -65, y: -30, z: -18, scale: 2.5 },
      { x: 60, y: -35, z: 10, scale: 3.5 },
      { x: 50, y: -32, z: -15, scale: 2 },
      { x: -40, y: -38, z: 0, scale: 2.8 },
      { x: 30, y: -36, z: 18, scale: 2.2 }
    ];

    coralPositions.forEach(function(pos) {
      var coralCluster = new THREE.Group();

      for (var i = 0; i < 4; i++) {
        var coral = new THREE.Mesh(
          new THREE.SphereGeometry(pos.scale * 0.8, 8, 8),
          coralMaterial
        );
        var offsetX = (Math.random() - 0.5) * pos.scale * 2;
        var offsetY = (Math.random() - 0.5) * pos.scale * 1.5;
        var offsetZ = (Math.random() - 0.5) * pos.scale * 2;
        coral.position.set(offsetX, offsetY, offsetZ);
        coral.castShadow = true;
        coralCluster.add(coral);
      }

      coralCluster.position.set(pos.x, pos.y, pos.z);
      coralGroup.add(coralCluster);
      corals.push(coralCluster);
    });

    return coralGroup;
  }

  function buildEmergencyLighting() {
    var lightsGroup = new THREE.Group();

    var lightPositions = [
      { x: -50, y: 15, z: -15 },
      { x: 0, y: 18, z: 12 },
      { x: 50, y: 16, z: -18 },
      { x: -30, y: -5, z: 10 },
      { x: 25, y: -8, z: -12 }
    ];

    lightPositions.forEach(function(pos) {
      var lightBulb = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffdd44 })
      );
      lightBulb.position.set(pos.x, pos.y, pos.z);
      lightsGroup.add(lightBulb);

      var pointLight = new THREE.PointLight(0xffdd44, 1.5, 80);
      pointLight.position.set(pos.x, pos.y, pos.z);
      pointLight.castShadow = true;
      lightsGroup.add(pointLight);
      lights.push(pointLight);

      flickerLights.push({
        light: pointLight,
        baseIntensity: 1.5,
        time: Math.random() * 10
      });
    });

    return lightsGroup;
  }

  function buildOceanFloor() {
    var floorGroup = new THREE.Group();

    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(300, 5, 200),
      new THREE.MeshPhongMaterial({ color: 0x4a6a5a })
    );
    floor.position.y = -45;
    floor.castShadow = true;
    floor.receiveShadow = true;
    floorGroup.add(floor);

    return floorGroup;
  }

  function buildStructuralRibs() {
    var ribsGroup = new THREE.Group();
    var ribMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });

    for (var i = 0; i < 8; i++) {
      var rib = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 35, 6),
        ribMaterial
      );
      rib.position.set(-70 + i * 20, 0, 0);
      rib.rotation.z = Math.PI / 2;
      rib.castShadow = true;
      ribsGroup.add(rib);
    }

    return ribsGroup;
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    carrierGroup = new THREE.Group();
    carrierGroup.rotation.z = Math.PI * 0.08;
    carrierGroup.position.set(0, -5, 0);

    var hull = buildCarrierHull();
    var deck = buildFlightDeck();
    var planes = buildFighterPlanes();
    var hangars = buildHangarBays();
    var holes = buildTorpedoHoles();
    var corals = buildCoralGrowth();
    var ribs = buildStructuralRibs();
    var lights = buildEmergencyLighting();

    carrierGroup.add(hull);
    carrierGroup.add(deck);
    carrierGroup.add(planes);
    carrierGroup.add(hangars);
    carrierGroup.add(holes);
    carrierGroup.add(corals);
    carrierGroup.add(ribs);
    carrierGroup.add(lights);

    var floor = buildOceanFloor();
    scene.add(floor);

    scene.add(carrierGroup);

    var ambientLight = new THREE.AmbientLight(0x445577, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x8899aa, 0.8);
    directionalLight.position.set(100, 80, 80);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }

  function update(delta) {
    deltaTime = delta;

    flickerLights.forEach(function(flicker) {
      flicker.time += delta;
      var flicker_val = Math.sin(flicker.time * 8) * 0.3 + 0.7;
      var rand = Math.random() * 0.2;
      flicker.light.intensity = flicker.baseIntensity * (flicker_val + rand);
    });

    if (carrierGroup) {
      carrierGroup.rotation.z = Math.PI * 0.08 + Math.sin(deltaTime * 0.3) * 0.02;
    }

    corals.forEach(function(coral) {
      coral.rotation.y += 0.1 * delta;
    });
  }

  function reset() {
    flickerLights = [];
    corals = [];
    lights = [];
    if (carrierGroup && scene) {
      scene.remove(carrierGroup);
    }
    carrierGroup = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
