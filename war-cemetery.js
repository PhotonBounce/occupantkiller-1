window.WarCemetery = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var crosses = [];
  var objects = [];
  var particles = [];
  var windPhase = 0;

  var init = function(s, c) {
    scene = s;
    camera = c;
    objects = [];
    crosses = [];
    particles = [];

    buildCrosses();
    buildObelisk();
    buildChapel();
    buildTrench();
    buildWreaths();
    buildMist();
  };

  var buildCrosses = function() {
    var rows = 12;
    var cols = 8;
    var spacing = 3;
    var startX = -cols * spacing / 2;
    var startZ = -rows * spacing / 2;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = startX + c * spacing;
        var z = startZ + r * spacing;

        var cross = createCross(x, 0, z);
        scene.add(cross);
        crosses.push(cross);
        objects.push(cross);
      }
    }
  };

  var createCross = function(x, y, z) {
    var group = new THREE.Group();

    var vertGeom = new THREE.CylinderGeometry(0.15, 0.15, 2.8, 8);
    var horGeom = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8);
    var material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });

    var vert = new THREE.Mesh(vertGeom, material);
    vert.position.y = 1.4;
    group.add(vert);

    var hor = new THREE.Mesh(horGeom, material);
    hor.rotation.z = Math.PI / 2;
    hor.position.y = 0.7;
    group.add(hor);

    group.position.set(x, y, z);
    return group;
  };

  var buildObelisk = function() {
    var height = 8;
    var baseSize = 1.5;
    var topSize = 0.4;

    var geom = new THREE.ConeGeometry(topSize, height, 4);
    var material = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5 });
    var obelisk = new THREE.Mesh(geom, material);

    obelisk.position.set(0, height / 2, 0);
    scene.add(obelisk);
    objects.push(obelisk);

    var baseGeom = new THREE.CylinderGeometry(baseSize, baseSize * 1.2, 1.5, 8);
    var base = new THREE.Mesh(baseGeom, material);
    base.position.set(0, 0.75, 0);
    scene.add(base);
    objects.push(base);
  };

  var buildChapel = function() {
    var group = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.8 });

    var wallGeom = new THREE.BoxGeometry(6, 5, 4);
    var wall = new THREE.Mesh(wallGeom, stoneMat);
    wall.position.set(0, 2.5, -15);
    group.add(wall);

    var roofGeom = new THREE.ConeGeometry(4.5, 2, 4);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 7.5, -15);
    group.add(roof);

    var stainedColors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00];
    for (var i = 0; i < 4; i++) {
      var windowGeom = new THREE.BoxGeometry(0.8, 1.2, 0.1);
      var windowMat = new THREE.MeshStandardMaterial({ color: stainedColors[i], emissive: stainedColors[i], emissiveIntensity: 0.4 });
      var window = new THREE.Mesh(windowGeom, windowMat);
      var xPos = -2 + i * 1.5;
      window.position.set(xPos, 4, -13);
      group.add(window);
    }

    group.position.set(0, 0, 0);
    scene.add(group);
    objects.push(group);
  };

  var buildTrench = function() {
    var trenchMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });

    var length = 20;
    var width = 2;
    var depth = 2.5;

    var bottomGeom = new THREE.BoxGeometry(width, 0.3, length);
    var bottom = new THREE.Mesh(bottomGeom, trenchMat);
    bottom.position.set(12, 0.15, 0);
    scene.add(bottom);
    objects.push(bottom);

    var sideGeom = new THREE.BoxGeometry(0.4, depth, length);
    var side1 = new THREE.Mesh(sideGeom, trenchMat);
    side1.position.set(12 + width / 2, depth / 2, 0);
    scene.add(side1);
    objects.push(side1);

    var side2 = new THREE.Mesh(sideGeom, trenchMat);
    side2.position.set(12 - width / 2, depth / 2, 0);
    scene.add(side2);
    objects.push(side2);
  };

  var buildWreaths = function() {
    var wreathPositions = [
      [-9, 0, -12],
      [-6, 0, -10],
      [-3, 0, -8],
      [3, 0, 8],
      [6, 0, 10],
      [9, 0, 12]
    ];

    for (var i = 0; i < wreathPositions.length; i++) {
      var pos = wreathPositions[i];
      var wreath = createWreath(pos[0], pos[1], pos[2]);
      scene.add(wreath);
      objects.push(wreath);
    }
  };

  var createWreath = function(x, y, z) {
    var group = new THREE.Group();
    var leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.8 });

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var px = Math.cos(angle) * 0.8;
      var pz = Math.sin(angle) * 0.8;

      var sphereGeom = new THREE.SphereGeometry(0.35, 8, 8);
      var sphere = new THREE.Mesh(sphereGeom, leafMat);
      sphere.position.set(px, 0.2, pz);
      group.add(sphere);
    }

    var ribbonMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
    var ribbonGeom = new THREE.BoxGeometry(1.6, 0.15, 0.3);
    var ribbon = new THREE.Mesh(ribbonGeom, ribbonMat);
    ribbon.position.y = 0.15;
    group.add(ribbon);

    group.position.set(x, y, z);
    return group;
  };

  var buildMist = function() {
    particles = [];
    var mistMat = new THREE.PointsMaterial({ color: 0xcccccc, size: 0.5, transparent: true, opacity: 0.4 });

    var positions = [];
    for (var i = 0; i < 150; i++) {
      var px = (Math.random() - 0.5) * 40;
      var py = Math.random() * 3;
      var pz = (Math.random() - 0.5) * 30;

      positions.push(px, py, pz);

      particles.push({
        x: px,
        y: py,
        z: pz,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.1,
        vz: (Math.random() - 0.5) * 0.5
      });
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var mist = new THREE.Points(geom, mistMat);
    scene.add(mist);
    objects.push(mist);
  };

  var update = function(delta) {
    windPhase += delta * 0.5;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx * delta;
      p.y += Math.sin(windPhase + i) * 0.01;
      p.z += p.vz * delta;

      if (Math.abs(p.x) > 25) p.vx *= -1;
      if (Math.abs(p.z) > 20) p.vz *= -1;
      if (p.y < 0 || p.y > 4) p.vy *= -1;
    }

    if (objects.length > 0 && objects[objects.length - 1].geometry && objects[objects.length - 1].geometry.attributes.position) {
      var positions = objects[objects.length - 1].geometry.attributes.position.array;
      for (var j = 0; j < particles.length; j++) {
        var idx = j * 3;
        positions[idx] = particles[j].x;
        positions[idx + 1] = particles[j].y;
        positions[idx + 2] = particles[j].z;
      }
      objects[objects.length - 1].geometry.attributes.position.needsUpdate = true;
    }
  };

  var reset = function() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    crosses = [];
    particles = [];
    windPhase = 0;
    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
