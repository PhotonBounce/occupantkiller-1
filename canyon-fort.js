window.CanyonFort = (function() {
  'use strict';

  var scene, camera, objects = [];
  var canyon, fort, bridge, river, wagons, stables, loopholes;

  function buildCanyonWalls() {
    var leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(50, 200, 20),
      new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
    );
    leftWall.position.set(-120, 80, 0);
    scene.add(leftWall);
    objects.push(leftWall);

    var rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(50, 200, 20),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
    );
    rightWall.position.set(120, 80, 0);
    scene.add(rightWall);
    objects.push(rightWall);

    var canyonFloor = new THREE.Mesh(
      new THREE.BoxGeometry(250, 5, 200),
      new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 })
    );
    canyonFloor.position.set(0, -5, 0);
    scene.add(canyonFloor);
    objects.push(canyonFloor);
  }

  function buildFort() {
    var palisade = new THREE.Mesh(
      new THREE.BoxGeometry(80, 15, 3),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.7 })
    );
    palisade.position.set(0, 7.5, -30);
    scene.add(palisade);
    objects.push(palisade);

    var cornerBlock1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 20, 8),
      new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.75 })
    );
    cornerBlock1.position.set(-38, 10, -30);
    scene.add(cornerBlock1);
    objects.push(cornerBlock1);

    var cornerBlock2 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 20, 8),
      new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.75 })
    );
    cornerBlock2.position.set(38, 10, -30);
    scene.add(cornerBlock2);
    objects.push(cornerBlock2);

    var eastPalisade = new THREE.Mesh(
      new THREE.BoxGeometry(3, 15, 60),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.7 })
    );
    eastPalisade.position.set(40, 7.5, 0);
    scene.add(eastPalisade);
    objects.push(eastPalisade);

    var westPalisade = new THREE.Mesh(
      new THREE.BoxGeometry(3, 15, 60),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.7 })
    );
    westPalisade.position.set(-40, 7.5, 0);
    scene.add(westPalisade);
    objects.push(westPalisade);
  }

  function buildRopeBridge() {
    var cableLeft = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-60, 40, -50),
        new THREE.Vector3(-40, 10, 40),
        new THREE.Vector3(-60, 40, 130)
      ]),
      new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 })
    );
    scene.add(cableLeft);
    objects.push(cableLeft);

    var cableRight = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(60, 40, -50),
        new THREE.Vector3(40, 10, 40),
        new THREE.Vector3(60, 40, 130)
      ]),
      new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 })
    );
    scene.add(cableRight);
    objects.push(cableRight);

    for (var i = 0; i < 5; i++) {
      var plank = new THREE.Mesh(
        new THREE.BoxGeometry(25, 2, 3),
        new THREE.MeshStandardMaterial({ color: 0xCD853F, roughness: 0.8 })
      );
      plank.position.set(0, 10 - i * 5, -40 + i * 40);
      scene.add(plank);
      objects.push(plank);
    }
  }

  function buildRiver() {
    var riverBox = new THREE.Mesh(
      new THREE.BoxGeometry(200, 2, 150),
      new THREE.MeshStandardMaterial({
        color: 0x1E90FF,
        emissive: 0x0066CC,
        emissiveIntensity: 0.5,
        roughness: 0.3
      })
    );
    riverBox.position.set(0, -4, 50);
    scene.add(riverBox);
    objects.push(riverBox);
  }

  function buildWagons() {
    for (var i = 0; i < 3; i++) {
      var wagonBody = new THREE.Mesh(
        new THREE.BoxGeometry(12, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.9 })
      );
      wagonBody.position.set(-25 + i * 20, 6, 10);
      scene.add(wagonBody);
      objects.push(wagonBody);

      var wheelFront = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 })
      );
      wheelFront.rotation.z = Math.PI / 2;
      wheelFront.position.set(-25 + i * 20, 4, 5);
      scene.add(wheelFront);
      objects.push(wheelFront);

      var wheelBack = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 })
      );
      wheelBack.rotation.z = Math.PI / 2;
      wheelBack.position.set(-25 + i * 20, 4, -5);
      scene.add(wheelBack);
      objects.push(wheelBack);
    }
  }

  function buildStables() {
    var stableBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(50, 12, 20),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85 })
    );
    stableBuilding.position.set(0, 6, -50);
    scene.add(stableBuilding);
    objects.push(stableBuilding);

    var roof = new THREE.Mesh(
      new THREE.ConeGeometry(35, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 })
    );
    roof.position.set(0, 15, -50);
    scene.add(roof);
    objects.push(roof);

    for (var i = 0; i < 4; i++) {
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
      );
      pillar.position.set(-20 + i * 15, 6, -50);
      scene.add(pillar);
      objects.push(pillar);
    }
  }

  function buildLoopholes() {
    var defenseWall = new THREE.Mesh(
      new THREE.BoxGeometry(40, 25, 5),
      new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9 })
    );
    defenseWall.position.set(70, 12, -80);
    scene.add(defenseWall);
    objects.push(defenseWall);

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var loophole = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2, 1),
          new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        loophole.position.set(50 + i * 15, 8 + j * 10, -80);
        scene.add(loophole);
        objects.push(loophole);
      }
    }
  }

  function buildOfficersQuarters() {
    var mainBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(25, 15, 30),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
    );
    mainBuilding.position.set(-50, 7.5, 5);
    scene.add(mainBuilding);
    objects.push(mainBuilding);

    var tower = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 20, 8),
      new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.85 })
    );
    tower.position.set(-55, 15, 10);
    scene.add(tower);
    objects.push(tower);

    var flag = new THREE.Mesh(
      new THREE.BoxGeometry(2, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xFF6347, roughness: 0.6 })
    );
    flag.position.set(-55, 28, 10);
    scene.add(flag);
    objects.push(flag);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];

    buildCanyonWalls();
    buildFort();
    buildRopeBridge();
    buildRiver();
    buildWagons();
    buildStables();
    buildLoopholes();
    buildOfficersQuarters();

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    sunLight.position.set(100, 150, 100);
    sunLight.castShadow = true;
    scene.add(sunLight);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].rotation) {
        if (i % 7 === 0) {
          objects[i].rotation.y += delta * 0.1;
        }
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
