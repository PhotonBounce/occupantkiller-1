window.ShadowMarket = (function() {
  'use strict';

  var scene, camera;
  var meshes = [];
  var lights = [];
  var guards = [];
  var spinners = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lights = [];
    guards = [];
    spinners = [];

    buildFloor();
    buildWalls();
    buildStalls();
    buildCrates();
    buildCounters();
    buildVault();
    buildGuards();
    buildLights();
    buildSigns();
    buildAlleys();
  }

  function buildFloor() {
    var floorGeo = new THREE.BoxGeometry(60, 0.5, 80);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);
  }

  function buildWalls() {
    var wallGeo = new THREE.BoxGeometry(60, 8, 1);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

    var backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.z = -40;
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    meshes.push(backWall);

    var frontWall = new THREE.Mesh(wallGeo, wallMat);
    frontWall.position.z = 40;
    frontWall.castShadow = true;
    scene.add(frontWall);
    meshes.push(frontWall);

    var leftWallGeo = new THREE.BoxGeometry(1, 8, 80);
    var leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.x = -30;
    leftWall.castShadow = true;
    scene.add(leftWall);
    meshes.push(leftWall);

    var rightWall = new THREE.Mesh(leftWallGeo, wallMat);
    rightWall.position.x = 30;
    rightWall.castShadow = true;
    scene.add(rightWall);
    meshes.push(rightWall);
  }

  function buildStalls() {
    for (var i = 0; i < 4; i++) {
      var stallX = -20 + i * 15;
      buildStall(stallX);
    }
  }

  function buildStall(stallX) {
    var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
    var postMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });

    var nw = new THREE.Mesh(postGeo, postMat);
    nw.position.set(stallX - 3, 2, -8);
    nw.castShadow = true;
    scene.add(nw);
    meshes.push(nw);

    var ne = new THREE.Mesh(postGeo, postMat);
    ne.position.set(stallX + 3, 2, -8);
    ne.castShadow = true;
    scene.add(ne);
    meshes.push(ne);

    buildCanopy(stallX);
    buildTable(stallX);
  }

  function buildCanopy(stallX) {
    var points = [];
    for (var x = stallX - 3; x <= stallX + 3; x += 1.5) {
      for (var z = -8; z <= -5; z += 1.5) {
        points.push(new THREE.Vector3(x, 4.5, z));
      }
    }

    var edges = [];
    for (var i = 0; i < points.length - 1; i++) {
      edges.push(new THREE.BufferGeometry().setFromPoints([points[i], points[(i + 1) % points.length]]));
    }

    var lineMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });
    edges.forEach(function(edgeGeo) {
      var line = new THREE.LineSegments(edgeGeo, lineMat);
      scene.add(line);
      meshes.push(line);
    });
  }

  function buildTable(stallX) {
    var tableGeo = new THREE.BoxGeometry(6, 0.3, 3);
    var tableMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    var table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(stallX, 2.3, -6.5);
    table.castShadow = true;
    scene.add(table);
    meshes.push(table);
  }

  function buildCrates() {
    var crateGeo = new THREE.BoxGeometry(1.2, 1.5, 1.2);
    var crateMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

    for (var i = 0; i < 8; i++) {
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(-25 + i * 6, 0.75, 10);
      crate.rotation.y = Math.random() * 0.3;
      crate.castShadow = true;
      scene.add(crate);
      meshes.push(crate);
    }
  }

  function buildCounters() {
    var counterGeo = new THREE.BoxGeometry(4, 1.2, 2);
    var counterMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    for (var i = 0; i < 2; i++) {
      var counter = new THREE.Mesh(counterGeo, counterMat);
      counter.position.set(-15 + i * 25, 0.6, 25);
      counter.castShadow = true;
      scene.add(counter);
      meshes.push(counter);
    }
  }

  function buildVault() {
    var vaultGeo = new THREE.CylinderGeometry(3, 3, 5, 16);
    var vaultMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8 });
    var vault = new THREE.Mesh(vaultGeo, vaultMat);
    vault.position.set(0, 2.5, -35);
    vault.castShadow = true;
    scene.add(vault);
    meshes.push(vault);
    spinners.push(vault);
  }

  function buildGuards() {
    for (var i = 0; i < 3; i++) {
      var guardX = -20 + i * 20;
      var bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
      var guardMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var body = new THREE.Mesh(bodyGeo, guardMat);
      body.position.set(guardX, 0.9, 15);
      body.castShadow = true;
      scene.add(body);
      meshes.push(body);

      var headGeo = new THREE.SphereGeometry(0.35, 8, 8);
      var head = new THREE.Mesh(headGeo, guardMat);
      head.position.set(guardX, 2.2, 15);
      head.castShadow = true;
      scene.add(head);
      meshes.push(head);

      guards.push({ body: body, headPos: head.position });
    }
  }

  function buildLights() {
    var spotGeo = new THREE.ConeGeometry(1, 2, 8);
    var spotMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 });

    for (var i = 0; i < 3; i++) {
      var spotlight = new THREE.Mesh(spotGeo, spotMat);
      spotlight.position.set(-15 + i * 15, 6, -35);
      spotlight.castShadow = true;
      scene.add(spotlight);
      meshes.push(spotlight);

      var light = new THREE.SpotLight(0xffff99, 1.5, 50, Math.PI / 4, 0.8, 1);
      light.position.set(-15 + i * 15, 6.5, -35);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      scene.add(light);
      lights.push(light);
    }

    var ambientLight = new THREE.AmbientLight(0x444444, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function buildSigns() {
    var signGeo = new THREE.BoxGeometry(3, 0.8, 0.2);
    var signMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff });

    var sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 5, -39);
    scene.add(sign);
    meshes.push(sign);
  }

  function buildAlleys() {
    var alleyWallGeo = new THREE.BoxGeometry(0.4, 3, 20);
    var alleyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

    for (var i = 0; i < 3; i++) {
      var wall = new THREE.Mesh(alleyWallGeo, alleyMat);
      wall.position.set(-15 + i * 15, 1.5, 0);
      wall.castShadow = true;
      scene.add(wall);
      meshes.push(wall);
    }
  }

  function update(delta) {
    spinners.forEach(function(mesh) {
      mesh.rotation.y += delta * 0.3;
    });

    guards.forEach(function(guard, idx) {
      var angle = Date.now() * 0.001 + idx * 2.09;
      guard.body.position.x += Math.sin(angle) * 0.05;
      guard.body.position.z += Math.cos(angle) * 0.05;
    });

    lights.forEach(function(light) {
      if (light.intensity !== undefined && light.intensity > 0.5) {
        light.intensity = 1 + Math.sin(Date.now() * 0.003) * 0.3;
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      scene.remove(mesh);
    });
    lights.forEach(function(light) {
      scene.remove(light);
    });
    meshes = [];
    lights = [];
    guards = [];
    spinners = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
