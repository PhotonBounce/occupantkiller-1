window.ClydeShipyard = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  var WX = 2110;
  var WZ = 2200;

  function createTitanCrane(scene) {
    var legMaterial = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
    var armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
    var houseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });

    // Four tall cylinder legs arranged in a square
    var legPositions = [
      { x: -6, z: -4 },
      { x:  6, z: -4 },
      { x: -6, z:  4 },
      { x:  6, z:  4 }
    ];

    for (var i = 0; i < legPositions.length; i++) {
      var legGeo = new THREE.CylinderGeometry(1, 1, 30, 12);
      var leg = new THREE.Mesh(legGeo, legMaterial);
      leg.position.set(WX + legPositions[i].x, 15, WZ + legPositions[i].z);
      scene.add(leg);
      objects.push(leg);
    }

    // Massive horizontal cantilever arm (60 x 3 x 4)
    var armGeo = new THREE.BoxGeometry(60, 3, 4);
    var arm = new THREE.Mesh(armGeo, armMaterial);
    arm.position.set(WX + 10, 31, WZ);
    scene.add(arm);
    objects.push(arm);

    // Counterbalance box on short end of cantilever
    var counterGeo = new THREE.BoxGeometry(8, 5, 6);
    var counter = new THREE.Mesh(counterGeo, houseMaterial);
    counter.position.set(WX - 22, 31, WZ);
    scene.add(counter);
    objects.push(counter);

    // Engine house box at apex (top of legs)
    var engineGeo = new THREE.BoxGeometry(14, 6, 10);
    var engine = new THREE.Mesh(engineGeo, houseMaterial);
    engine.position.set(WX, 33, WZ);
    scene.add(engine);
    objects.push(engine);

    // Vertical tower mast above engine house
    var mastGeo = new THREE.BoxGeometry(2, 10, 2);
    var mast = new THREE.Mesh(mastGeo, armMaterial);
    mast.position.set(WX, 42, WZ);
    scene.add(mast);
    objects.push(mast);
  }

  function createWarshipHull(scene) {
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A4A });
    var wayMaterial = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });

    // Enormous dark hull on slipway (60 x 8 x 18)
    var hullGeo = new THREE.BoxGeometry(60, 8, 18);
    var hull = new THREE.Mesh(hullGeo, hullMaterial);
    hull.position.set(WX, 4, WZ + 40);
    scene.add(hull);
    objects.push(hull);

    // Bow section – raised prow block
    var prowGeo = new THREE.BoxGeometry(6, 6, 16);
    var prow = new THREE.Mesh(prowGeo, hullMaterial);
    prow.position.set(WX + 33, 8, WZ + 40);
    scene.add(prow);
    objects.push(prow);

    // Superstructure block amidships
    var superGeo = new THREE.BoxGeometry(18, 6, 10);
    var superStruct = new THREE.Mesh(superGeo, hullMaterial);
    superStruct.position.set(WX - 5, 11, WZ + 40);
    scene.add(superStruct);
    objects.push(superStruct);

    // Slipway inclined rails — two long box rails either side
    var wayOffsets = [ -10, 10 ];
    for (var i = 0; i < wayOffsets.length; i++) {
      var wayGeo = new THREE.BoxGeometry(70, 1, 3);
      var way = new THREE.Mesh(wayGeo, wayMaterial);
      way.position.set(WX, 0.5, WZ + 40 + wayOffsets[i]);
      way.rotation.x = 0.04; // slight incline
      scene.add(way);
      objects.push(way);
    }
  }

  function createDryDock(scene) {
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
    var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x6E5A3A });

    // Three concrete walls of the dock pit (north, south, inland end)
    // North wall
    var northGeo = new THREE.BoxGeometry(50, 6, 2);
    var northWall = new THREE.Mesh(northGeo, wallMaterial);
    northWall.position.set(WX - 30, 3, WZ - 40);
    scene.add(northWall);
    objects.push(northWall);

    // South wall
    var southGeo = new THREE.BoxGeometry(50, 6, 2);
    var southWall = new THREE.Mesh(southGeo, wallMaterial);
    southWall.position.set(WX - 30, 3, WZ - 15);
    scene.add(southWall);
    objects.push(southWall);

    // Inland (east) end wall
    var endGeo = new THREE.BoxGeometry(2, 6, 27);
    var endWall = new THREE.Mesh(endGeo, wallMaterial);
    endWall.position.set(WX - 55, 3, WZ - 27);
    scene.add(endWall);
    objects.push(endWall);

    // Dock floor
    var floorGeo = new THREE.BoxGeometry(50, 1, 25);
    var floor = new THREE.Mesh(floorGeo, wallMaterial);
    floor.position.set(WX - 30, -0.5, WZ - 27);
    scene.add(floor);
    objects.push(floor);

    // Flood gate at river end — two gate leaf boxes
    var gateGeo1 = new THREE.BoxGeometry(12, 6, 1);
    var gate1 = new THREE.Mesh(gateGeo1, gateMaterial);
    gate1.position.set(WX - 4, 3, WZ - 27);
    scene.add(gate1);
    objects.push(gate1);

    var gateGeo2 = new THREE.BoxGeometry(12, 6, 1);
    var gate2 = new THREE.Mesh(gateGeo2, gateMaterial);
    gate2.position.set(WX - 16, 3, WZ - 27);
    scene.add(gate2);
    objects.push(gate2);
  }

  function createRivetingWorkshop(scene) {
    var shedMaterial = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
    var skylightMaterial = new THREE.MeshLambertMaterial({ color: 0xAABBCC });
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });

    // Long corrugated iron shed (40 x 8 x 15)
    var shedGeo = new THREE.BoxGeometry(40, 8, 15);
    var shed = new THREE.Mesh(shedGeo, shedMaterial);
    shed.position.set(WX + 50, 4, WZ - 10);
    scene.add(shed);
    objects.push(shed);

    // Roof ridge
    var ridgeGeo = new THREE.BoxGeometry(41, 2, 2);
    var ridge = new THREE.Mesh(ridgeGeo, roofMaterial);
    ridge.position.set(WX + 50, 9.5, WZ - 10);
    scene.add(ridge);
    objects.push(ridge);

    // Skylight strips along roof (5 glass box strips)
    var skylightPositions = [ -12, -6, 0, 6, 12 ];
    for (var i = 0; i < skylightPositions.length; i++) {
      var skyGeo = new THREE.BoxGeometry(6, 0.5, 3);
      var skylight = new THREE.Mesh(skyGeo, skylightMaterial);
      skylight.position.set(WX + 50 + skylightPositions[i], 8.3, WZ - 10);
      scene.add(skylight);
      objects.push(skylight);
    }

    // Large door opening framed by box pillars at each end
    var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var pillarGeo = new THREE.BoxGeometry(1, 8, 1);
    var p1 = new THREE.Mesh(pillarGeo, pillarMaterial);
    p1.position.set(WX + 30, 4, WZ - 3);
    scene.add(p1);
    objects.push(p1);

    var p2 = new THREE.Mesh(pillarGeo, pillarMaterial);
    p2.position.set(WX + 30, 4, WZ - 17);
    scene.add(p2);
    objects.push(p2);
  }

  function createOverheadCraneRails(scene) {
    var railMaterial = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
    var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });
    var blockMaterial = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });

    // Two elevated box rails, 50 units long, running along dock
    var railOffsets = [ -4, 4 ];
    for (var i = 0; i < railOffsets.length; i++) {
      var railGeo = new THREE.BoxGeometry(50, 1, 1);
      var rail = new THREE.Mesh(railGeo, railMaterial);
      rail.position.set(WX - 30, 12, WZ - 27 + railOffsets[i]);
      scene.add(rail);
      objects.push(rail);

      // Support columns every 10 units
      for (var j = 0; j < 6; j++) {
        var colGeo = new THREE.BoxGeometry(0.8, 12, 0.8);
        var col = new THREE.Mesh(colGeo, supportMaterial);
        col.position.set(WX - 55 + j * 10, 6, WZ - 27 + railOffsets[i]);
        scene.add(col);
        objects.push(col);
      }
    }

    // Travelling crane cross-beam
    var beamGeo = new THREE.BoxGeometry(1, 1, 9);
    var beam = new THREE.Mesh(beamGeo, railMaterial);
    beam.position.set(WX - 30, 12.5, WZ - 27);
    scene.add(beam);
    objects.push(beam);

    // Hanging block (cylinder)
    var blockGeo = new THREE.CylinderGeometry(1, 1, 3, 10);
    var block = new THREE.Mesh(blockGeo, blockMaterial);
    block.position.set(WX - 30, 8, WZ - 27);
    scene.add(block);
    objects.push(block);

    // Hoist cable represented as thin box
    var cableGeo = new THREE.BoxGeometry(0.2, 4, 0.2);
    var cableMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(WX - 30, 10.5, WZ - 27);
    scene.add(cable);
    objects.push(cable);
  }

  function createQE2Plaque(scene) {
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xCCBBAA });
    var plaqueMaterial = new THREE.MeshLambertMaterial({ color: 0xBB9933 });

    // Stone slab base at slipway where QE2 was launched
    var slabGeo = new THREE.BoxGeometry(3, 0.4, 2);
    var slab = new THREE.Mesh(slabGeo, stoneMaterial);
    slab.position.set(WX + 20, 0.2, WZ + 52);
    scene.add(slab);
    objects.push(slab);

    // Upright plaque face
    var plaqueGeo = new THREE.BoxGeometry(2, 1.5, 0.15);
    var plaque = new THREE.Mesh(plaqueGeo, plaqueMaterial);
    plaque.position.set(WX + 20, 1.15, WZ + 51);
    scene.add(plaque);
    objects.push(plaque);

    // Small post supporting plaque
    var postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x8A7A5A });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.set(WX + 20, 0.75, WZ + 51);
    scene.add(post);
    objects.push(post);
  }

  function createAmbientLighting(scene) {
    var ambient = new THREE.AmbientLight(0xAAB8CC, 0.7);
    scene.add(ambient);
    lights.push(ambient);

    // Crane spotlight from apex
    var craneLight = new THREE.PointLight(0xFFEE88, 1.2, 80);
    craneLight.position.set(WX, 36, WZ);
    scene.add(craneLight);
    lights.push(craneLight);

    // Workshop interior warmth
    var workshopLight = new THREE.PointLight(0xFF9944, 0.8, 50);
    workshopLight.position.set(WX + 50, 6, WZ - 10);
    scene.add(workshopLight);
    lights.push(workshopLight);
  }

  function build(scene) {
    createTitanCrane(scene);
    createWarshipHull(scene);
    createDryDock(scene);
    createRivetingWorkshop(scene);
    createOverheadCraneRails(scene);
    createQE2Plaque(scene);
    createAmbientLighting(scene);
  }

  function update(delta) {
    // No per-frame animation required
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights = [];
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
