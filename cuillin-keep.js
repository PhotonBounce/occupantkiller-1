window.CuillinKeep = (function() {
  'use strict';

  var baseX = 1340;
  var baseZ = 1780;
  var structures = [];

  function createBlackCuillinRidge() {
    var ridge = [];
    var peakPositions = [
      { x: 0, z: 0, h: 22 },
      { x: 8, z: 15, h: 25 },
      { x: 18, z: 28, h: 20 },
      { x: 30, z: 35, h: 23 },
      { x: 42, z: 38, h: 19 },
      { x: 50, z: 40, h: 21 }
    ];

    for (var i = 0; i < peakPositions.length; i++) {
      var peak = peakPositions[i];
      var geom = new THREE.BoxGeometry(6, peak.h, 4);
      var mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(baseX + peak.x, peak.h / 2, baseZ + peak.z);
      mesh.rotation.z = (Math.random() - 0.5) * 0.3;
      ridge.push(mesh);
    }

    return ridge;
  }

  function createRedCuillinDome() {
    var dome = [];
    var hillPositions = [
      { x: 70, z: 10, h: 18, w: 10, d: 10 },
      { x: 85, z: 5, h: 16, w: 11, d: 9 },
      { x: 100, z: 15, h: 17, w: 9, d: 11 }
    ];

    for (var i = 0; i < hillPositions.length; i++) {
      var hill = hillPositions[i];
      var geom = new THREE.BoxGeometry(hill.w, hill.h, hill.d);
      var mat = new THREE.MeshLambertMaterial({ color: 0xAA6644 });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(baseX + hill.x, hill.h / 2, baseZ + hill.z);
      mesh.scale.y = 0.8 + Math.random() * 0.2;
      dome.push(mesh);
    }

    return dome;
  }

  function createGlenSligachanBaseCamp() {
    var camp = [];

    var baseGeom = new THREE.BoxGeometry(6, 4, 3);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var baseBuilding = new THREE.Mesh(baseGeom, baseMat);
    baseBuilding.position.set(baseX - 40, 2, baseZ - 50);
    camp.push(baseBuilding);

    var tentPositions = [
      { x: -35, z: -55 },
      { x: -30, z: -48 },
      { x: -45, z: -45 },
      { x: -50, z: -52 }
    ];

    for (var i = 0; i < tentPositions.length; i++) {
      var pos = tentPositions[i];
      var tentGeom = new THREE.BoxGeometry(3, 2.5, 3);
      var tentMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
      var tent = new THREE.Mesh(tentGeom, tentMat);
      tent.position.set(baseX + pos.x, 1.25, baseZ + pos.z);
      tent.rotation.y = Math.random() * Math.PI;
      camp.push(tent);
    }

    return camp;
  }

  function createRidgeTraverseRope() {
    var rope = [];

    var ropeGeom = new THREE.BufferGeometry();
    var positions = new Float32Array([
      baseX + 8, 13, baseZ + 15,
      baseX + 30, 12, baseZ + 35,
      baseX + 50, 11, baseZ + 40
    ]);
    ropeGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });
    var ropeSegments = new THREE.LineSegments(ropeGeom, ropeMat);
    rope.push(ropeSegments);

    var anchorPositions = [
      { x: 8, z: 15, h: 13 },
      { x: 30, z: 35, h: 12 },
      { x: 50, z: 40, h: 11 }
    ];

    for (var i = 0; i < anchorPositions.length; i++) {
      var anchor = anchorPositions[i];
      var anchorGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
      var anchorMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var anchorMesh = new THREE.Mesh(anchorGeom, anchorMat);
      anchorMesh.position.set(baseX + anchor.x, anchor.h + 1, baseZ + anchor.z);
      rope.push(anchorMesh);
    }

    return rope;
  }

  function createCuillinSummitGun() {
    var summit = [];

    var platformGeom = new THREE.BoxGeometry(8, 1, 8);
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(baseX + 25, 26, baseZ + 28);
    summit.push(platform);

    var gunGeom = new THREE.CylinderGeometry(0.6, 0.8, 4, 16);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var gun = new THREE.Mesh(gunGeom, gunMat);
    gun.position.set(baseX + 25, 29, baseZ + 28);
    gun.rotation.z = 0.3;
    summit.push(gun);

    return summit;
  }

  function createCourrieLaganPost() {
    var post = [];

    var bowlGeom = new THREE.SphereGeometry(25, 16, 12);
    var bowlMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var bowl = new THREE.Mesh(bowlGeom, bowlMat);
    bowl.position.set(baseX - 60, 0, baseZ + 60);
    bowl.scale.y = 0.5;
    post.push(bowl);

    var postGeom = new THREE.BoxGeometry(3, 6, 3);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var postMesh = new THREE.Mesh(postGeom, postMat);
    postMesh.position.set(baseX - 60, 3, baseZ + 60);
    post.push(postMesh);

    return post;
  }

  function createMountainRescueCache() {
    var cache = [];

    var postGeom = new THREE.CylinderGeometry(0.5, 0.7, 15, 8);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var postMesh = new THREE.Mesh(postGeom, postMat);
    postMesh.position.set(baseX + 60, 7.5, baseZ + 25);
    cache.push(postMesh);

    var boxGeom = new THREE.BoxGeometry(4, 3, 3);
    var boxMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var box = new THREE.Mesh(boxGeom, boxMat);
    box.position.set(baseX + 60, 17, baseZ + 25);
    cache.push(box);

    return cache;
  }

  function createSligachanHotelRuins() {
    var ruins = [];

    var mainGeom = new THREE.BoxGeometry(8, 5, 4);
    var mainMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var main = new THREE.Mesh(mainGeom, mainMat);
    main.position.set(baseX - 80, 2.5, baseZ + 50);
    ruins.push(main);

    var wallGeom = new THREE.BoxGeometry(1, 5, 4);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var wall1 = new THREE.Mesh(wallGeom, wallMat);
    wall1.position.set(baseX - 84, 2.5, baseZ + 45);
    ruins.push(wall1);

    var wall2 = new THREE.Mesh(wallGeom, wallMat);
    wall2.position.set(baseX - 76, 2.5, baseZ + 55);
    ruins.push(wall2);

    return ruins;
  }

  function init() {
    var all = [];

    var blackRidge = createBlackCuillinRidge();
    for (var i = 0; i < blackRidge.length; i++) {
      all.push(blackRidge[i]);
    }

    var redDome = createRedCuillinDome();
    for (var i = 0; i < redDome.length; i++) {
      all.push(redDome[i]);
    }

    var baseCamp = createGlenSligachanBaseCamp();
    for (var i = 0; i < baseCamp.length; i++) {
      all.push(baseCamp[i]);
    }

    var rope = createRidgeTraverseRope();
    for (var i = 0; i < rope.length; i++) {
      all.push(rope[i]);
    }

    var gun = createCuillinSummitGun();
    for (var i = 0; i < gun.length; i++) {
      all.push(gun[i]);
    }

    var post = createCourrieLaganPost();
    for (var i = 0; i < post.length; i++) {
      all.push(post[i]);
    }

    var cache = createMountainRescueCache();
    for (var i = 0; i < cache.length; i++) {
      all.push(cache[i]);
    }

    var hotelRuins = createSligachanHotelRuins();
    for (var i = 0; i < hotelRuins.length; i++) {
      all.push(hotelRuins[i]);
    }

    structures = all;
    return all;
  }

  function add(scene) {
    for (var i = 0; i < structures.length; i++) {
      scene.add(structures[i]);
    }
  }

  function getMeshes() {
    return structures;
  }

  return {
    init: init,
    add: add,
    getMeshes: getMeshes
  };

}());
