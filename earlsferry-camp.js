window.EarlsferryCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var flashingLight = null;
  var flashPhase = 0;

  function create(scene) {
    // Lighthouse at Elie Ness
    var lightHouseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 14, 16);
    var lightHouseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var lightHouse = new THREE.Mesh(lightHouseGeometry, lightHouseMaterial);
    lightHouse.position.set(20, 7, 0);
    scene.add(lightHouse);
    objects.push(lightHouse);

    // Lighthouse cone cap (red)
    var capeGeometry = new THREE.ConeGeometry(1.5, 2, 16);
    var capeMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    var cape = new THREE.Mesh(capeGeometry, capeMaterial);
    cape.position.set(20, 15, 0);
    scene.add(cape);
    objects.push(cape);

    // Flashing red lighthouse light
    var flashLight = new THREE.PointLight(0xFF2200, 2.0);
    flashLight.position.set(20, 16, 0);
    scene.add(flashLight);
    lights.push(flashLight);
    flashingLight = flashLight;

    // Chain Walk cliff face (long 30x20x2 box)
    var cliffGeometry = new THREE.BoxGeometry(30, 20, 2);
    var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliff.position.set(-15, 10, -8);
    scene.add(cliff);
    objects.push(cliff);

    // Chain handholds (LineSegments)
    var chainPositions = [];
    var x = -15;
    var chainSpacing = 3;
    for (var i = 0; i < 12; i++) {
      chainPositions.push(x + i * chainSpacing, 18, -8);
      chainPositions.push(x + i * chainSpacing, 2, -8);
    }
    var chainGeometry = new THREE.BufferGeometry();
    chainGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(chainPositions), 3));
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var chains = new THREE.LineSegments(chainGeometry, chainMaterial);
    scene.add(chains);
    objects.push(chains);

    // Ruby Bay beach bunker (8x3x6 concrete, half-buried)
    var bunkerGeometry = new THREE.BoxGeometry(8, 3, 6);
    var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(-25, 1.5, 10);
    scene.add(bunker);
    objects.push(bunker);

    // Sand mound around bunker
    var moundGeometry = new THREE.SphereGeometry(6, 12, 8);
    var moundMaterial = new THREE.MeshLambertMaterial({ color: 0xCCBB99 });
    var mound = new THREE.Mesh(moundGeometry, moundMaterial);
    mound.scale.set(1, 0.5, 1);
    mound.position.set(-25, 0.5, 10);
    scene.add(mound);
    objects.push(mound);

    // Elie Harbour quay (16x1x4 stone)
    var quayGeometry = new THREE.BoxGeometry(16, 1, 4);
    var quayMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var quay = new THREE.Mesh(quayGeometry, quayMaterial);
    quay.position.set(0, 0.5, 15);
    scene.add(quay);
    objects.push(quay);

    // Harbour bollards (cylinders)
    var bollardPositions = [-6, -2, 2, 6];
    for (var b = 0; b < bollardPositions.length; b++) {
      var bollardGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
      var bollardMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      bollard.position.set(bollardPositions[b], 1.2, 15);
      scene.add(bollard);
      objects.push(bollard);
    }

    // Harbour lights
    var harbourLight1 = new THREE.PointLight(0xFFCC66, 0.8);
    harbourLight1.position.set(-8, 2, 15);
    scene.add(harbourLight1);
    lights.push(harbourLight1);

    var harbourLight2 = new THREE.PointLight(0xFFCC66, 0.8);
    harbourLight2.position.set(8, 2, 15);
    scene.add(harbourLight2);
    lights.push(harbourLight2);

    // Earlsferry Links bunkers (3 sand bunker clusters)
    var bunkerPositions = [[-35, 0, -5], [-40, 0, 5], [-30, 0, 10]];
    for (var p = 0; p < bunkerPositions.length; p++) {
      var bunkGeometry = new THREE.SphereGeometry(3, 10, 7);
      var bunkMaterial = new THREE.MeshLambertMaterial({ color: 0xCCBB88 });
      var bunk = new THREE.Mesh(bunkGeometry, bunkMaterial);
      bunk.scale.set(1, 0.6, 1);
      bunk.position.set(bunkerPositions[p][0], bunkerPositions[p][1], bunkerPositions[p][2]);
      scene.add(bunk);
      objects.push(bunk);

      // Sniper post (small box on bunker)
      var postGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
      var postMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(bunkerPositions[p][0], 3, bunkerPositions[p][2]);
      scene.add(post);
      objects.push(post);
    }

    // Watersports centre turned ammo store (12x4x8, bright blue)
    var storeGeometry = new THREE.BoxGeometry(12, 4, 8);
    var storeMaterial = new THREE.MeshLambertMaterial({ color: 0x2244CC });
    var store = new THREE.Mesh(storeGeometry, storeMaterial);
    store.position.set(5, 2, -15);
    scene.add(store);
    objects.push(store);

    // Clifftop OP - sandbag ring (3x2x3 open ring)
    var sandbag1Geometry = new THREE.BoxGeometry(3, 0.8, 0.8);
    var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xCCBB88 });
    var sandbag1 = new THREE.Mesh(sandbag1Geometry, sandbagMaterial);
    sandbag1.position.set(-10, 3.5, -20);
    scene.add(sandbag1);
    objects.push(sandbag1);

    var sandbag2Geometry = new THREE.BoxGeometry(0.8, 0.8, 3);
    var sandbag2 = new THREE.Mesh(sandbag2Geometry, sandbagMaterial);
    sandbag2.position.set(-11.5, 3.5, -21.5);
    scene.add(sandbag2);
    objects.push(sandbag2);

    var sandbag3 = new THREE.Mesh(sandbag2Geometry, sandbagMaterial);
    sandbag3.position.set(-8.5, 3.5, -21.5);
    scene.add(sandbag3);
    objects.push(sandbag3);

    // OP binoculars box
    var binoGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var binoMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var bino = new THREE.Mesh(binoGeometry, binoMaterial);
    bino.position.set(-10, 4.5, -20);
    scene.add(bino);
    objects.push(bino);

    // Sea cave opening (cylinder 3 radius height 4, set into cliff)
    var caveGeometry = new THREE.CylinderGeometry(3, 3, 4, 16);
    var caveMaterial = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var cave = new THREE.Mesh(caveGeometry, caveMaterial);
    cave.position.set(-20, 4, -9);
    scene.add(cave);
    objects.push(cave);

    // Coastal ambient light (golden-pink sunset)
    var ambientLight = new THREE.AmbientLight(0xFFAA88, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Main directional light for realism
    var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
    dirLight.position.set(30, 20, 10);
    scene.add(dirLight);
    lights.push(dirLight);
  }

  function update(delta) {
    if (flashingLight) {
      flashPhase += delta * 3;
      if (flashPhase > Math.PI * 2) {
        flashPhase -= Math.PI * 2;
      }
      var intensity = Math.max(0, Math.sin(flashPhase));
      flashingLight.intensity = 2.0 * intensity;
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
    flashingLight = null;
    flashPhase = 0;
  }

  return {
    create: create,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
