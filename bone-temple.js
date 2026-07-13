window.BoneTemple = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var censers = [];
  var fires = [];
  var smokeParticles = [];

  function buildBoneWalls() {
    var wallHeight = 25;
    var wallThickness = 0.8;
    var wallLength = 50;

    var boneColor = 0xE8DCC4;
    var darkBoneColor = 0xC9B8A3;

    var leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var leftWallMat = new THREE.MeshStandardMaterial({
      color: boneColor,
      roughness: 0.9,
      metalness: 0.1
    });
    var leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
    leftWall.position.set(-25, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    objects.push(leftWall);

    var rightWall = new THREE.Mesh(leftWallGeo, leftWallMat);
    rightWall.position.set(25, wallHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    objects.push(rightWall);

    var backWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var backWall = new THREE.Mesh(backWallGeo, leftWallMat);
    backWall.position.set(0, wallHeight / 2, -25);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    objects.push(backWall);
  }

  function buildSkullArchways() {
    var archColor = 0xD4A574;
    var archMat = new THREE.MeshStandardMaterial({
      color: archColor,
      roughness: 0.8,
      metalness: 0.15
    });

    for (var i = 0; i < 4; i++) {
      var archX = -15 + (i * 10);
      var archGeo = new THREE.ConeGeometry(3, 8, 6);
      var arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(archX, 12, 5);
      arch.scale.set(1.2, 0.8, 1.2);
      arch.castShadow = true;
      arch.receiveShadow = true;
      scene.add(arch);
      objects.push(arch);

      var capGeo = new THREE.CylinderGeometry(3.5, 3.5, 1, 8);
      var cap = new THREE.Mesh(capGeo, archMat);
      cap.position.set(archX, 16.5, 5);
      cap.castShadow = true;
      cap.receiveShadow = true;
      scene.add(cap);
      objects.push(cap);
    }
  }

  function buildSkullGates() {
    var gateColor = 0xA0826D;
    var gateMat = new THREE.MeshStandardMaterial({
      color: gateColor,
      roughness: 0.7,
      metalness: 0.2
    });

    var skullGeo = new THREE.SphereGeometry(2.5, 8, 8);
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        var skull = new THREE.Mesh(skullGeo, gateMat);
        skull.position.set(-3 + (col * 3), 5 + (row * 4.5), -23);
        skull.scale.set(0.8, 1.1, 0.9);
        skull.castShadow = true;
        skull.receiveShadow = true;
        scene.add(skull);
        objects.push(skull);

        var jawGeo = new THREE.BoxGeometry(4, 0.8, 1.5);
        var jaw = new THREE.Mesh(jawGeo, gateMat);
        jaw.position.set(-3 + (col * 3), 3.5 + (row * 4.5), -23);
        jaw.castShadow = true;
        jaw.receiveShadow = true;
        scene.add(jaw);
        objects.push(jaw);
      }
    }
  }

  function buildCentralAltar() {
    var altarColor = 0xB8997E;
    var altarMat = new THREE.MeshStandardMaterial({
      color: altarColor,
      roughness: 0.85,
      metalness: 0.05
    });

    var baseGeo = new THREE.CylinderGeometry(8, 10, 2, 16);
    var base = new THREE.Mesh(baseGeo, altarMat);
    base.position.set(0, 1, -5);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);

    var ribcageGeo = new THREE.CylinderGeometry(5, 6, 6, 12);
    var ribcage = new THREE.Mesh(ribcageGeo, altarMat);
    ribcage.position.set(0, 5, -5);
    ribcage.castShadow = true;
    ribcage.receiveShadow = true;
    scene.add(ribcage);
    objects.push(ribcage);

    var topGeo = new THREE.SphereGeometry(7, 8, 8);
    var top = new THREE.Mesh(topGeo, altarMat);
    top.position.set(0, 11, -5);
    top.scale.set(1, 0.6, 1);
    top.castShadow = true;
    top.receiveShadow = true;
    scene.add(top);
    objects.push(top);
  }

  function buildCensers() {
    var censeColor = 0x8B7355;
    var censeMat = new THREE.MeshStandardMaterial({
      color: censeColor,
      roughness: 0.6,
      metalness: 0.3
    });

    var positions = [
      [-15, 8, 0],
      [15, 8, 0],
      [0, 8, 10],
      [0, 8, -15]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var bowlGeo = new THREE.CylinderGeometry(1.5, 1.8, 0.8, 8);
      var bowl = new THREE.Mesh(bowlGeo, censeMat);
      bowl.position.set(pos[0], pos[1], pos[2]);
      bowl.castShadow = true;
      bowl.receiveShadow = true;
      scene.add(bowl);
      objects.push(bowl);

      var standGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 6);
      var stand = new THREE.Mesh(standGeo, censeMat);
      stand.position.set(pos[0], pos[1] - 1.9, pos[2]);
      stand.castShadow = true;
      stand.receiveShadow = true;
      scene.add(stand);
      objects.push(stand);

      var handleGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 4);
      var handle = new THREE.Mesh(handleGeo, censeMat);
      handle.position.set(pos[0] + 2.5, pos[1] + 0.5, pos[2]);
      handle.rotation.z = Math.PI / 4;
      handle.castShadow = true;
      handle.receiveShadow = true;
      scene.add(handle);
      objects.push(handle);

      censers.push({
        position: [pos[0], pos[1], pos[2]],
        time: Math.random() * Math.PI * 2
      });
    }
  }

  function buildCeremonialFires() {
    var fireColor = 0xFF6B1A;
    var fireMat = new THREE.MeshStandardMaterial({
      color: fireColor,
      emissive: 0xFF4500,
      emissiveIntensity: 0.8,
      roughness: 0.5,
      metalness: 0
    });

    var firePositions = [
      [-18, 2, 10],
      [18, 2, 10],
      [0, 2, -15]
    ];

    for (var i = 0; i < firePositions.length; i++) {
      var fpos = firePositions[i];
      var flameGeo = new THREE.ConeGeometry(1.5, 4, 6);
      var flame = new THREE.Mesh(flameGeo, fireMat);
      flame.position.set(fpos[0], fpos[1], fpos[2]);
      flame.castShadow = true;
      flame.receiveShadow = true;
      scene.add(flame);
      objects.push(flame);

      fires.push({
        mesh: flame,
        baseY: fpos[1],
        time: Math.random() * Math.PI * 2,
        intensity: 0.7 + Math.random() * 0.3
      });
    }
  }

  function buildCollapsedSection() {
    var rubbleColor = 0x9B8B6D;
    var rubbleMat = new THREE.MeshStandardMaterial({
      color: rubbleColor,
      roughness: 0.95,
      metalness: 0.02
    });

    for (var i = 0; i < 8; i++) {
      var rubbleGeo = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        1 + Math.random() * 2,
        2 + Math.random() * 3
      );
      var rubble = new THREE.Mesh(rubbleGeo, rubbleMat);
      rubble.position.set(
        -20 + Math.random() * 8,
        0.5 + (i % 3) * 1.5,
        -20 + Math.random() * 8
      );
      rubble.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI,
        Math.random() * 0.3
      );
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
      objects.push(rubble);
    }

    var caveGeo = new THREE.SphereGeometry(12, 8, 8);
    var caveMat = new THREE.MeshStandardMaterial({
      color: 0x3D3D3D,
      roughness: 1,
      metalness: 0,
      side: THREE.BackSide
    });
    var cave = new THREE.Mesh(caveGeo, caveMat);
    cave.position.set(-20, -8, -20);
    cave.scale.set(0.6, 0.5, 0.7);
    scene.add(cave);
    objects.push(cave);
  }

  function createSmokeParticles(censePos) {
    for (var i = 0; i < 3; i++) {
      smokeParticles.push({
        x: censePos[0] + (Math.random() - 0.5) * 2,
        y: censePos[1] + Math.random(),
        z: censePos[2] + (Math.random() - 0.5) * 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.5 + Math.random() * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        life: 2 + Math.random() * 2,
        maxLife: 2 + Math.random() * 2
      });
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    censers = [];
    fires = [];
    smokeParticles = [];

    buildBoneWalls();
    buildSkullArchways();
    buildSkullGates();
    buildCentralAltar();
    buildCensers();
    buildCeremonialFires();
    buildCollapsedSection();

    var light = new THREE.PointLight(0xFFAA66, 0.8, 80);
    light.position.set(0, 15, 0);
    light.castShadow = true;
    scene.add(light);
    objects.push(light);

    var ambientLight = new THREE.AmbientLight(0x8B6914, 0.4);
    scene.add(ambientLight);
    objects.push(ambientLight);
  }

  function update(delta) {
    for (var i = 0; i < censers.length; i++) {
      censers[i].time += delta;
      if (Math.sin(censers[i].time * 1.5) > 0.7) {
        createSmokeParticles(censers[i].position);
      }
    }

    for (var j = 0; j < fires.length; j++) {
      fires[j].time += delta * 2;
      var flicker = 0.95 + Math.sin(fires[j].time * 3.5) * 0.05;
      fires[j].mesh.scale.y = flicker;
      fires[j].mesh.position.y = fires[j].baseY + Math.sin(fires[j].time) * 0.3;
    }

    for (var k = smokeParticles.length - 1; k >= 0; k--) {
      var p = smokeParticles[k];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.life -= delta;

      if (p.life <= 0) {
        smokeParticles.splice(k, 1);
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    censers = [];
    fires = [];
    smokeParticles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
