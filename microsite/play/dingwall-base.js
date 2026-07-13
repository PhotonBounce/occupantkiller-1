window.DingwallBase = (function() {
  'use strict';

  var baseX = 760;
  var baseZ = 910;
  var scene = null;

  function create() {
    var structures = [];

    // 1. Norse thing (parliament mound) earthwork
    structures.push(thingmound());

    // 2. Macbeth's castle ruins
    structures.push(castleruins());

    // 3. Cromarty Firth naval gun
    structures.push(navalgun());

    // 4. County hall HQ
    structures.push(countyhall());

    // 5. Market square barricade
    structures.push(marketbarricade());

    // 6. Railway bridge fortification
    structures.push(railwaybridge());

    // 7. Viking longship beached
    structures.push(longship());

    // 8. Black Isle ferry checkpoint
    structures.push(ferrycheckpoint());

    return structures;
  }

  function thingmound() {
    var group = new THREE.Group();
    var geometry = new THREE.BoxGeometry(12, 3, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(baseX, 1.5, baseZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  }

  function castleruins() {
    var group = new THREE.Group();
    var baseOffsetX = baseX + 25;
    var baseOffsetZ = baseZ + 20;

    // Wall fragment 1
    var wall1geom = new THREE.BoxGeometry(8, 5, 1.5);
    var sandstone = new THREE.MeshLambertMaterial({ color: 0xC2B280 });
    var wall1 = new THREE.Mesh(wall1geom, sandstone);
    wall1.position.set(baseOffsetX, 2.5, baseOffsetZ);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    group.add(wall1);

    // Wall fragment 2
    var wall2geom = new THREE.BoxGeometry(1.5, 4, 6);
    var wall2 = new THREE.Mesh(wall2geom, sandstone);
    wall2.position.set(baseOffsetX + 5, 2, baseOffsetZ + 4);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    group.add(wall2);

    // Wall fragment 3
    var wall3geom = new THREE.BoxGeometry(6, 3.5, 1.5);
    var wall3 = new THREE.Mesh(wall3geom, sandstone);
    wall3.position.set(baseOffsetX - 4, 1.75, baseOffsetZ + 8);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    group.add(wall3);

    return group;
  }

  function navalgun() {
    var group = new THREE.Group();
    var baseOffsetX = baseX - 30;
    var baseOffsetZ = baseZ + 35;

    // Mount base
    var basegeom = new THREE.BoxGeometry(4, 2, 4);
    var ironmat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var base = new THREE.Mesh(basegeom, ironmat);
    base.position.set(baseOffsetX, 1, baseOffsetZ);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Gun barrel
    var barrelgeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
    var barrel = new THREE.Mesh(barrelgeom, ironmat);
    barrel.position.set(baseOffsetX, 2.8, baseOffsetZ);
    barrel.rotation.z = Math.PI / 12;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    return group;
  }

  function countyhall() {
    var group = new THREE.Group();
    var baseOffsetX = baseX - 20;
    var baseOffsetZ = baseZ - 25;

    var geometry = new THREE.BoxGeometry(8, 6, 4);
    var stonegray = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var mesh = new THREE.Mesh(geometry, stonegray);
    mesh.position.set(baseOffsetX, 3, baseOffsetZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return group;
  }

  function marketbarricade() {
    var group = new THREE.Group();
    var baseOffsetX = baseX + 15;
    var baseOffsetZ = baseZ - 20;

    var woodmat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    // Stall 1
    var stall1geom = new THREE.BoxGeometry(2.5, 2, 2.5);
    var stall1 = new THREE.Mesh(stall1geom, woodmat);
    stall1.position.set(baseOffsetX, 1, baseOffsetZ);
    stall1.castShadow = true;
    stall1.receiveShadow = true;
    group.add(stall1);

    // Stall 2
    var stall2geom = new THREE.BoxGeometry(2.5, 2, 2.5);
    var stall2 = new THREE.Mesh(stall2geom, woodmat);
    stall2.position.set(baseOffsetX + 4, 1, baseOffsetZ);
    stall2.castShadow = true;
    stall2.receiveShadow = true;
    group.add(stall2);

    // Stall 3
    var stall3geom = new THREE.BoxGeometry(2.5, 2, 2.5);
    var stall3 = new THREE.Mesh(stall3geom, woodmat);
    stall3.position.set(baseOffsetX + 8, 1, baseOffsetZ);
    stall3.castShadow = true;
    stall3.receiveShadow = true;
    group.add(stall3);

    // Connecting barricade
    var bargeom = new THREE.BoxGeometry(10, 1.5, 0.8);
    var bar = new THREE.Mesh(bargeom, woodmat);
    bar.position.set(baseOffsetX + 4, 1.2, baseOffsetZ - 2);
    bar.castShadow = true;
    bar.receiveShadow = true;
    group.add(bar);

    return group;
  }

  function railwaybridge() {
    var group = new THREE.Group();
    var baseOffsetX = baseX + 40;
    var baseOffsetZ = baseZ - 35;

    var ironmat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

    // Bridge deck
    var deckgeom = new THREE.BoxGeometry(12, 1.5, 3);
    var deck = new THREE.Mesh(deckgeom, ironmat);
    deck.position.set(baseOffsetX, 4, baseOffsetZ);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Left support pillar
    var pillar1geom = new THREE.BoxGeometry(1.5, 4, 1.5);
    var pillar1 = new THREE.Mesh(pillar1geom, ironmat);
    pillar1.position.set(baseOffsetX - 5, 2, baseOffsetZ);
    pillar1.castShadow = true;
    pillar1.receiveShadow = true;
    group.add(pillar1);

    // Right support pillar
    var pillar2geom = new THREE.BoxGeometry(1.5, 4, 1.5);
    var pillar2 = new THREE.Mesh(pillar2geom, ironmat);
    pillar2.position.set(baseOffsetX + 5, 2, baseOffsetZ);
    pillar2.castShadow = true;
    pillar2.receiveShadow = true;
    group.add(pillar2);

    // Pillbox fortification
    var pillboxgeom = new THREE.BoxGeometry(3, 2.5, 3);
    var pillbox = new THREE.Mesh(pillboxgeom, ironmat);
    pillbox.position.set(baseOffsetX, 5.5, baseOffsetZ);
    pillbox.castShadow = true;
    pillbox.receiveShadow = true;
    group.add(pillbox);

    return group;
  }

  function longship() {
    var group = new THREE.Group();
    var baseOffsetX = baseX - 45;
    var baseOffsetZ = baseZ + 15;

    var woodmat = new THREE.MeshLambertMaterial({ color: 0x654321 });

    // Hull
    var hullgeom = new THREE.BoxGeometry(10, 1.5, 3);
    var hull = new THREE.Mesh(hullgeom, woodmat);
    hull.position.set(baseOffsetX, 0.75, baseOffsetZ);
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Mast
    var mastgeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 12);
    var mast = new THREE.Mesh(mastgeom, woodmat);
    mast.position.set(baseOffsetX, 3.75, baseOffsetZ);
    mast.castShadow = true;
    mast.receiveShadow = true;
    group.add(mast);

    // Prow
    var prowgeom = new THREE.BoxGeometry(2, 1.5, 1);
    var prow = new THREE.Mesh(prowgeom, woodmat);
    prow.position.set(baseOffsetX + 5.5, 0.75, baseOffsetZ);
    prow.castShadow = true;
    prow.receiveShadow = true;
    group.add(prow);

    return group;
  }

  function ferrycheckpoint() {
    var group = new THREE.Group();
    var baseOffsetX = baseX + 50;
    var baseOffsetZ = baseZ + 25;

    var ironmat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var postmat = new THREE.MeshLambertMaterial({ color: 0xDC143C });

    // Main barrier
    var barriergeom = new THREE.BoxGeometry(10, 1.5, 0.8);
    var barrier = new THREE.Mesh(barriergeom, ironmat);
    barrier.position.set(baseOffsetX, 0.75, baseOffsetZ);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    group.add(barrier);

    // Signal post 1
    var post1geom = new THREE.CylinderGeometry(0.25, 0.25, 4, 12);
    var post1 = new THREE.Mesh(post1geom, postmat);
    post1.position.set(baseOffsetX - 4, 2, baseOffsetZ);
    post1.castShadow = true;
    post1.receiveShadow = true;
    group.add(post1);

    // Signal post 2
    var post2geom = new THREE.CylinderGeometry(0.25, 0.25, 4, 12);
    var post2 = new THREE.Mesh(post2geom, postmat);
    post2.position.set(baseOffsetX + 4, 2, baseOffsetZ);
    post2.castShadow = true;
    post2.receiveShadow = true;
    group.add(post2);

    // Checkpoint booth
    var boothgeom = new THREE.BoxGeometry(3, 2.5, 2.5);
    var booth = new THREE.Mesh(boothgeom, ironmat);
    booth.position.set(baseOffsetX, 1.25, baseOffsetZ - 3);
    booth.castShadow = true;
    booth.receiveShadow = true;
    group.add(booth);

    return group;
  }

  function add(parent) {
    scene = parent;
    var structures = create();
    structures.forEach(function(struct) {
      scene.add(struct);
    });
  }

  function init(parentScene) {
    add(parentScene);
  }

  return {
    init: init,
    add: add,
    create: create
  };
}());
