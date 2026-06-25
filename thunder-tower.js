window.ThunderTower = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var tower = null;
  var arcs = [];
  var sparks = [];
  var cageFrames = [];
  var warningPosts = [];
  var emissiveLineSegments = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildMainTower();
    buildBaseStructure();
    buildArcDischarges();
    buildFaradayCages();
    buildWarningSignPosts();
    buildControlBunker();

    return {
      tower: tower,
      arcs: arcs,
      sparks: sparks
    };
  }

  function buildMainTower() {
    var group = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(3, 4, 2, 32);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    group.add(base);

    var coilGeometry = new THREE.CylinderGeometry(2.5, 2.5, 12, 32);
    var coilMaterial = new THREE.MeshPhongMaterial({ color: 0x0f3460, emissive: 0x0f3460 });
    var coil = new THREE.Mesh(coilGeometry, coilMaterial);
    coil.position.y = 7;
    group.add(coil);

    var capacitorGeometry = new THREE.SphereGeometry(2, 32, 32);
    var capacitorMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00ffff });
    var capacitor = new THREE.Mesh(capacitorGeometry, capacitorMaterial);
    capacitor.position.y = 16;
    capacitor.castShadow = true;
    group.add(capacitor);

    var rimGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.3, 32);
    var rimMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 14.5;
    group.add(rim);

    group.position.set(0, 0, -15);
    scene.add(group);
    tower = group;
  }

  function buildBaseStructure() {
    var baseGroup = new THREE.Group();

    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 / 8) * i;
      var x = Math.cos(angle) * 5;
      var z = Math.sin(angle) * 5;

      var sphere1Geometry = new THREE.SphereGeometry(0.5, 16, 16);
      var sparkMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff3300 });
      var sphere1 = new THREE.Mesh(sphere1Geometry, sparkMaterial);
      sphere1.position.set(x, 0.5, z);
      baseGroup.add(sphere1);

      var sphere2Geometry = new THREE.SphereGeometry(0.5, 16, 16);
      var sphere2 = new THREE.Mesh(sphere2Geometry, sparkMaterial);
      sphere2.position.set(x * 0.6, 0.5, z * 0.6);
      baseGroup.add(sphere2);

      var lineGeometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        sphere1.position.x, sphere1.position.y, sphere1.position.z,
        sphere2.position.x, sphere2.position.y, sphere2.position.z
      ]);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);
      baseGroup.add(line);
      emissiveLineSegments.push(line);
      sparks.push({ line: line, intensity: 0 });
    }

    baseGroup.position.set(0, 0, -15);
    scene.add(baseGroup);
  }

  function buildArcDischarges() {
    var arcGroup = new THREE.Group();

    for (var ring = 0; ring < 3; ring++) {
      var ringRadius = 4 - ring * 0.5;
      var ringHeight = 10 + ring * 2;
      var sphereCount = 6 + ring * 2;

      for (var i = 0; i < sphereCount; i++) {
        var angle = (Math.PI * 2 / sphereCount) * i;
        var x = Math.cos(angle) * ringRadius;
        var z = Math.sin(angle) * ringRadius;

        var sphereGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        var conductorMaterial = new THREE.MeshPhongMaterial({ color: 0x00ddff });
        var sphere = new THREE.Mesh(sphereGeometry, conductorMaterial);
        sphere.position.set(x, ringHeight, z);
        arcGroup.add(sphere);

        if (i > 0) {
          var lastAngle = (Math.PI * 2 / sphereCount) * (i - 1);
          var lastX = Math.cos(lastAngle) * ringRadius;
          var lastZ = Math.sin(lastAngle) * ringRadius;

          var arcLineGeometry = new THREE.BufferGeometry();
          var arcPositions = new Float32Array([
            lastX, ringHeight, lastZ,
            x, ringHeight, z
          ]);
          arcLineGeometry.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
          var arcLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 1.5 });
          var arcLine = new THREE.LineSegments(arcLineGeometry, arcLineMaterial);
          arcGroup.add(arcLine);
          emissiveLineSegments.push(arcLine);
          arcs.push({ line: arcLine, active: false });
        }
      }
    }

    arcGroup.position.set(0, 0, -15);
    scene.add(arcGroup);
  }

  function buildFaradayCages() {
    var cageGroup = new THREE.Group();

    for (var cageIdx = 0; cageIdx < 2; cageIdx++) {
      var cageSize = 3;
      var offsetX = cageIdx * 8 - 4;
      var offsetZ = 5;
      var cageY = 0.5;

      var vertices = [
        [-cageSize, 0, -cageSize],
        [cageSize, 0, -cageSize],
        [cageSize, 0, cageSize],
        [-cageSize, 0, cageSize],
        [-cageSize, cageSize, -cageSize],
        [cageSize, cageSize, -cageSize],
        [cageSize, cageSize, cageSize],
        [-cageSize, cageSize, cageSize]
      ];

      var edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      for (var i = 0; i < edges.length; i++) {
        var v1 = vertices[edges[i][0]];
        var v2 = vertices[edges[i][1]];

        var edgeGeometry = new THREE.BufferGeometry();
        var edgePositions = new Float32Array([
          v1[0] + offsetX, cageY + v1[1], v1[2] + offsetZ,
          v2[0] + offsetX, cageY + v2[1], v2[2] + offsetZ
        ]);
        edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
        var edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        var edgeLine = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        cageGroup.add(edgeLine);
        cageFrames.push(edgeLine);
      }
    }

    cageGroup.position.set(0, 0, 0);
    scene.add(cageGroup);
  }

  function buildWarningSignPosts() {
    var postGroup = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 / 4) * i;
      var x = Math.cos(angle) * 8;
      var z = Math.sin(angle) * 8;

      var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
      var postMaterial = new THREE.MeshPhongMaterial({ color: 0xff3300 });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, 2, z);
      postGroup.add(post);

      var warningGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
      var warningMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffcc00 });
      var warning = new THREE.Mesh(warningGeometry, warningMaterial);
      warning.position.set(x, 4.5, z);
      postGroup.add(warning);

      warningPosts.push(warning);
    }

    postGroup.position.set(0, 0, -15);
    scene.add(postGroup);
  }

  function buildControlBunker() {
    var bunkerGroup = new THREE.Group();

    var bunkerRoof = new THREE.ConeGeometry(4, 2, 32);
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a5e });
    var roof = new THREE.Mesh(bunkerRoof, roofMaterial);
    roof.position.set(0, -1, 12);
    bunkerGroup.add(roof);

    var bunkerWallGeometry = new THREE.CylinderGeometry(3.5, 3.5, 3, 32);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a3e });
    var wall = new THREE.Mesh(bunkerWallGeometry, wallMaterial);
    wall.position.set(0, -3, 12);
    bunkerGroup.add(wall);

    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI * 2 / 4) * i;
      var x = Math.cos(angle) * 3;
      var z = 12 + Math.sin(angle) * 3;

      var ductGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
      var ductMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      var duct = new THREE.Mesh(ductGeometry, ductMaterial);
      duct.position.set(x, 0.5, z);
      bunkerGroup.add(duct);
    }

    bunkerGroup.position.set(0, 0, 0);
    scene.add(bunkerGroup);
  }

  function update(delta) {
    if (!scene || !tower) return;

    emissiveLineSegments.forEach(function(line) {
      if (line.material.color) {
        var flicker = Math.random();
        line.material.opacity = 0.3 + flicker * 0.7;
      }
    });

    warningPosts.forEach(function(post) {
      post.rotation.z += delta * 2;
    });

    arcs.forEach(function(arc) {
      if (Math.random() > 0.7) {
        arc.active = !arc.active;
      }
      if (arc.active) {
        arc.line.material.color.set(0xffff00);
        arc.line.material.linewidth = 3;
      } else {
        arc.line.material.color.set(0x00ffff);
        arc.line.material.linewidth = 1.5;
      }
    });

    sparks.forEach(function(spark) {
      spark.intensity = Math.max(0, spark.intensity - delta * 5);
      if (Math.random() > 0.85) {
        spark.intensity = Math.random();
      }
      if (spark.line && spark.line.material) {
        spark.line.material.opacity = 0.2 + spark.intensity * 0.8;
      }
    });
  }

  function reset() {
    arcs.forEach(function(arc) {
      arc.active = false;
    });
    sparks.forEach(function(spark) {
      spark.intensity = 0;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
