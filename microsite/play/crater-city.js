window.CraterCity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var craters = [];
  var rubbleWalls = [];
  var skyscraperStumps = [];
  var sewerNetworks = [];
  var glowingDebris = [];
  var defensiveLines = [];
  var ambientParticles = [];
  var time = 0;

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 150, 400);

    buildTerrain();
    buildCraters();
    buildRubbleWalls();
    buildSkyscraperStumps();
    buildSewerNetworks();
    buildGlowingDebris();
    buildDefensiveLines();
    buildAmbientParticles();
  };

  var buildTerrain = function() {
    var groundGeom = new THREE.CylinderGeometry(200, 200, 5, 64);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x4a4a5e });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -10;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);

    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(100, 150, 100);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = -200;
    light.shadow.camera.right = 200;
    light.shadow.camera.top = 200;
    light.shadow.camera.bottom = -200;
    scene.add(light);

    var ambLight = new THREE.AmbientLight(0x555566, 0.4);
    scene.add(ambLight);
  };

  var buildCraters = function() {
    var positions = [
      [-60, 0, -80],
      [70, 0, 60],
      [-40, 0, 50],
      [80, 0, -40],
      [0, 0, 0],
      [-80, 0, 20],
      [50, 0, -70]
    ];

    var colors = [0x8B4513, 0x654321, 0x6B5D47, 0x7a5c3a, 0x5c4033];

    positions.forEach(function(pos, idx) {
      var radius = 20 + Math.random() * 30;
      var depth = 15 + Math.random() * 25;

      var craterGeom = new THREE.CylinderGeometry(radius, radius * 0.7, depth, 48, 16);
      var craterMat = new THREE.MeshPhongMaterial({
        color: colors[idx % colors.length],
        shininess: 10
      });
      var crater = new THREE.Mesh(craterGeom, craterMat);
      crater.position.set(pos[0], pos[1] - depth / 2, pos[2]);
      crater.castShadow = true;
      crater.receiveShadow = true;
      scene.add(crater);
      craters.push(crater);
    });
  };

  var buildRubbleWalls = function() {
    var wallPositions = [
      {x: -50, z: 0, width: 60},
      {x: 40, z: 70, width: 50},
      {x: 60, z: -60, width: 55},
      {x: -70, z: -40, width: 45}
    ];

    wallPositions.forEach(function(wall) {
      var segCount = Math.ceil(wall.width / 8);

      for (var i = 0; i < segCount; i++) {
        var blockWidth = Math.min(8, wall.width - i * 8);
        var blockHeight = 8 + Math.random() * 12;
        var blockDepth = 4 + Math.random() * 6;

        var rubbleGeom = new THREE.BoxGeometry(blockWidth, blockHeight, blockDepth);
        var rubbleMat = new THREE.MeshPhongMaterial({
          color: 0x6B5D47 + Math.floor(Math.random() * 0x111111),
          shininess: 5
        });
        var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);

        rubble.position.set(
          wall.x + i * 8 - wall.width / 2,
          blockHeight / 2 + Math.random() * 2,
          wall.z
        );
        rubble.rotation.z = (Math.random() - 0.5) * 0.3;
        rubble.castShadow = true;
        rubble.receiveShadow = true;
        scene.add(rubble);
        rubbleWalls.push(rubble);
      }
    });
  };

  var buildSkyscraperStumps = function() {
    var stumpPositions = [
      {x: -100, z: 100, height: 80},
      {x: 120, z: -100, height: 95},
      {x: -120, z: -80, height: 70},
      {x: 100, z: 100, height: 85}
    ];

    stumpPositions.forEach(function(stump) {
      var stumpGeom = new THREE.CylinderGeometry(12, 15, stump.height, 8);
      var stumpMat = new THREE.MeshPhongMaterial({
        color: 0x3a3a4a,
        shininess: 20
      });
      var stumpMesh = new THREE.Mesh(stumpGeom, stumpMat);
      stumpMesh.position.set(stump.x, stump.height / 2, stump.z);
      stumpMesh.castShadow = true;
      stumpMesh.receiveShadow = true;
      scene.add(stumpMesh);
      skyscraperStumps.push(stumpMesh);

      var fracturedTip = new THREE.ConeGeometry(10, 15, 4);
      var tipMat = new THREE.MeshPhongMaterial({ color: 0x2a2a3a });
      var tipMesh = new THREE.Mesh(fracturedTip, tipMat);
      tipMesh.position.set(stump.x, stump.height, stump.z);
      tipMesh.castShadow = true;
      scene.add(tipMesh);
    });
  };

  var buildSewerNetworks = function() {
    var sewerLines = [
      {start: [-80, -5, -80], end: [80, -5, -80]},
      {start: [-80, -5, 80], end: [80, -5, 80]},
      {start: [-80, -5, -40], end: [80, -5, -40]},
      {start: [-100, -5, 0], end: [100, -5, 0]}
    ];

    sewerLines.forEach(function(line) {
      var geom = new THREE.BufferGeometry();
      var positions = new Float32Array([
        line.start[0], line.start[1], line.start[2],
        line.end[0], line.end[1], line.end[2]
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var lineMat = new THREE.LineBasicMaterial({ color: 0x333355, linewidth: 3 });
      var sewerLine = new THREE.LineSegments(geom, lineMat);
      scene.add(sewerLine);
      sewerNetworks.push(sewerLine);
    });
  };

  var buildGlowingDebris = function() {
    var debrisPositions = [
      [-40, 25, -60],
      [50, 30, 40],
      [-80, 20, 0],
      [70, 28, -50],
      [0, 22, 80],
      [-120, 18, -100],
      [110, 35, 60]
    ];

    debrisPositions.forEach(function(pos) {
      var debrisGeom = new THREE.SphereGeometry(3 + Math.random() * 4, 8, 8);
      var debrisMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 1, 0.5),
        emissive: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 1, 0.4)
      });
      var debris = new THREE.Mesh(debrisGeom, debrisMat);
      debris.position.set(pos[0], pos[1], pos[2]);
      scene.add(debris);
      glowingDebris.push({mesh: debris, speed: 0.5 + Math.random() * 1.5});
    });

    var pointLight = new THREE.PointLight(0xff9933, 1, 100);
    pointLight.position.set(50, 30, 40);
    scene.add(pointLight);
  };

  var buildDefensiveLines = function() {
    var defensePosts = [
      {x: -60, z: -80},
      {x: 60, z: 80},
      {x: -80, z: 60},
      {x: 80, z: -60}
    ];

    defensePosts.forEach(function(post) {
      var postGeom = new THREE.BoxGeometry(6, 20, 6);
      var postMat = new THREE.MeshPhongMaterial({ color: 0x556633 });
      var postMesh = new THREE.Mesh(postGeom, postMat);
      postMesh.position.set(post.x, 10, post.z);
      postMesh.castShadow = true;
      postMesh.receiveShadow = true;
      scene.add(postMesh);

      var shieldGeom = new THREE.SphereGeometry(8, 6, 6);
      var shieldMat = new THREE.MeshPhongMaterial({
        color: 0x339955,
        transparent: true,
        opacity: 0.15,
        shininess: 100
      });
      var shield = new THREE.Mesh(shieldGeom, shieldMat);
      shield.position.set(post.x, 15, post.z);
      scene.add(shield);
      defensiveLines.push({post: postMesh, shield: shield});
    });
  };

  var buildAmbientParticles = function() {
    for (var i = 0; i < 30; i++) {
      var dustGeom = new THREE.SphereGeometry(0.3, 4, 4);
      var dustMat = new THREE.MeshBasicMaterial({ color: 0x888899, opacity: 0.4, transparent: true });
      var dust = new THREE.Mesh(dustGeom, dustMat);

      dust.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 100,
        (Math.random() - 0.5) * 200
      );

      scene.add(dust);
      ambientParticles.push({
        mesh: dust,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 3,
        life: Math.random() * 10
      });
    }
  };

  var update = function(delta) {
    time += delta;

    glowingDebris.forEach(function(debris) {
      debris.mesh.position.y += Math.sin(time * debris.speed) * 0.05;
      debris.mesh.rotation.x += 0.01;
      debris.mesh.rotation.y += 0.015;
    });

    skyscraperStumps.forEach(function(stump) {
      stump.rotation.z = Math.sin(time * 0.3) * 0.005;
    });

    defensiveLines.forEach(function(line) {
      var scale = 1 + Math.sin(time * 2) * 0.05;
      line.shield.scale.set(scale, scale, scale);
    });

    ambientParticles.forEach(function(particle) {
      particle.mesh.position.x += particle.vx * delta;
      particle.mesh.position.y += particle.vy * delta;
      particle.mesh.position.z += particle.vz * delta;

      if (Math.abs(particle.mesh.position.x) > 120) particle.vx *= -1;
      if (Math.abs(particle.mesh.position.z) > 120) particle.vz *= -1;
      if (particle.mesh.position.y > 120 || particle.mesh.position.y < 0) particle.vy *= -1;
    });
  };

  var reset = function() {
    craters.forEach(function(crater) { scene.remove(crater); });
    rubbleWalls.forEach(function(wall) { scene.remove(wall); });
    skyscraperStumps.forEach(function(stump) { scene.remove(stump); });
    sewerNetworks.forEach(function(sewer) { scene.remove(sewer); });
    glowingDebris.forEach(function(debris) { scene.remove(debris.mesh); });
    defensiveLines.forEach(function(line) { scene.remove(line.post); scene.remove(line.shield); });
    ambientParticles.forEach(function(particle) { scene.remove(particle.mesh); });

    craters = [];
    rubbleWalls = [];
    skyscraperStumps = [];
    sewerNetworks = [];
    glowingDebris = [];
    defensiveLines = [];
    ambientParticles = [];
    time = 0;

    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
