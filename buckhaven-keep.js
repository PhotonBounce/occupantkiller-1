window.BuckhavenKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function init(scene) {
    var cliffMesh = new THREE.Mesh(
      new THREE.BoxGeometry(30, 4, 3),
      new THREE.MeshLambertMaterial({ color: 0x554433 })
    );
    cliffMesh.position.set(0, 0, 0);
    cliffMesh.castShadow = true;
    cliffMesh.receiveShadow = true;
    scene.add(cliffMesh);
    objects.push(cliffMesh);

    var churchTower = new THREE.Mesh(
      new THREE.BoxGeometry(6, 14, 6),
      new THREE.MeshLambertMaterial({ color: 0xCC8855 })
    );
    churchTower.position.set(-8, 7, -5);
    churchTower.castShadow = true;
    churchTower.receiveShadow = true;
    scene.add(churchTower);
    objects.push(churchTower);

    var headframeLeft = new THREE.Mesh(
      new THREE.BoxGeometry(2, 12, 1),
      new THREE.MeshLambertMaterial({ color: 0x333344 })
    );
    headframeLeft.position.set(-5, 6, 3);
    headframeLeft.rotation.z = 0.3;
    headframeLeft.castShadow = true;
    headframeLeft.receiveShadow = true;
    scene.add(headframeLeft);
    objects.push(headframeLeft);

    var headframeRight = new THREE.Mesh(
      new THREE.BoxGeometry(2, 12, 1),
      new THREE.MeshLambertMaterial({ color: 0x333344 })
    );
    headframeRight.position.set(5, 6, 3);
    headframeRight.rotation.z = -0.3;
    headframeRight.castShadow = true;
    headframeRight.receiveShadow = true;
    scene.add(headframeRight);
    objects.push(headframeRight);

    var headframeCrossbar = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x333344 })
    );
    headframeCrossbar.position.set(0, 12, 3);
    headframeCrossbar.castShadow = true;
    headframeCrossbar.receiveShadow = true;
    scene.add(headframeCrossbar);
    objects.push(headframeCrossbar);

    var windingWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.8, 32),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    windingWheel.position.set(0, 12, 4);
    windingWheel.rotation.x = Math.PI / 2;
    windingWheel.castShadow = true;
    windingWheel.receiveShadow = true;
    windingWheel.userData.windingWheel = true;
    scene.add(windingWheel);
    objects.push(windingWheel);

    var rowhouse1 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 5),
      new THREE.MeshLambertMaterial({ color: 0x998877 })
    );
    rowhouse1.position.set(-14, 2, 8);
    rowhouse1.castShadow = true;
    rowhouse1.receiveShadow = true;
    scene.add(rowhouse1);
    objects.push(rowhouse1);

    var rowhouse2 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 5),
      new THREE.MeshLambertMaterial({ color: 0x998877 })
    );
    rowhouse2.position.set(-14, 2, 14);
    rowhouse2.castShadow = true;
    rowhouse2.receiveShadow = true;
    scene.add(rowhouse2);
    objects.push(rowhouse2);

    var rowhouse3 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 5),
      new THREE.MeshLambertMaterial({ color: 0x998877 })
    );
    rowhouse3.position.set(-14, 2, 20);
    rowhouse3.castShadow = true;
    rowhouse3.receiveShadow = true;
    scene.add(rowhouse3);
    objects.push(rowhouse3);

    var rowhouse4 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 5),
      new THREE.MeshLambertMaterial({ color: 0x998877 })
    );
    rowhouse4.position.set(-14, 2, 26);
    rowhouse4.castShadow = true;
    rowhouse4.receiveShadow = true;
    scene.add(rowhouse4);
    objects.push(rowhouse4);

    var memorialPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshLambertMaterial({ color: 0x888877 })
    );
    memorialPlinth.position.set(10, 1, 12);
    memorialPlinth.castShadow = true;
    memorialPlinth.receiveShadow = true;
    scene.add(memorialPlinth);
    objects.push(memorialPlinth);

    var memorialSlab = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 5),
      new THREE.MeshLambertMaterial({ color: 0x888877 })
    );
    memorialSlab.position.set(10, 2.5, 12);
    memorialSlab.castShadow = true;
    memorialSlab.receiveShadow = true;
    scene.add(memorialSlab);
    objects.push(memorialSlab);

    var fishingPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.5, 4),
      new THREE.MeshLambertMaterial({ color: 0x8B5E3C })
    );
    fishingPlatform.position.set(0, -2, -12);
    fishingPlatform.castShadow = true;
    fishingPlatform.receiveShadow = true;
    scene.add(fishingPlatform);
    objects.push(fishingPlatform);

    var dugout = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 6),
      new THREE.MeshLambertMaterial({ color: 0x5C4030 })
    );
    dugout.position.set(12, 1, -3);
    dugout.castShadow = true;
    dugout.receiveShadow = true;
    scene.add(dugout);
    objects.push(dugout);

    var fenceCorner1 = [
      new THREE.Vector3(-20, 3, -10),
      new THREE.Vector3(-20, 3, 30)
    ];
    var fenceGeom1 = new THREE.BufferGeometry().setFromPoints(fenceCorner1);
    var fenceLine1 = new THREE.LineSegments(fenceGeom1, new THREE.LineBasicMaterial({ color: 0x444444 }));
    scene.add(fenceLine1);
    objects.push(fenceLine1);

    var fenceCorner2 = [
      new THREE.Vector3(-20, 3, 30),
      new THREE.Vector3(20, 3, 30)
    ];
    var fenceGeom2 = new THREE.BufferGeometry().setFromPoints(fenceCorner2);
    var fenceLine2 = new THREE.LineSegments(fenceGeom2, new THREE.LineBasicMaterial({ color: 0x444444 }));
    scene.add(fenceLine2);
    objects.push(fenceLine2);

    var fenceCorner3 = [
      new THREE.Vector3(20, 3, 30),
      new THREE.Vector3(20, 3, -10)
    ];
    var fenceGeom3 = new THREE.BufferGeometry().setFromPoints(fenceCorner3);
    var fenceLine3 = new THREE.LineSegments(fenceGeom3, new THREE.LineBasicMaterial({ color: 0x444444 }));
    scene.add(fenceLine3);
    objects.push(fenceLine3);

    var fenceCorner4 = [
      new THREE.Vector3(20, 3, -10),
      new THREE.Vector3(-20, 3, -10)
    ];
    var fenceGeom4 = new THREE.BufferGeometry().setFromPoints(fenceCorner4);
    var fenceLine4 = new THREE.LineSegments(fenceGeom4, new THREE.LineBasicMaterial({ color: 0x444444 }));
    scene.add(fenceLine4);
    objects.push(fenceLine4);

    var ambientLight = new THREE.AmbientLight(0x99AABB, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var cornerLight1 = new THREE.PointLight(0xFF8800, 1, 30);
    cornerLight1.position.set(-20, 5, -10);
    cornerLight1.castShadow = true;
    scene.add(cornerLight1);
    lights.push(cornerLight1);

    var cornerLight2 = new THREE.PointLight(0xFF8800, 1, 30);
    cornerLight2.position.set(-20, 5, 30);
    cornerLight2.castShadow = true;
    scene.add(cornerLight2);
    lights.push(cornerLight2);

    var cornerLight3 = new THREE.PointLight(0xFF8800, 1, 30);
    cornerLight3.position.set(20, 5, 30);
    cornerLight3.castShadow = true;
    scene.add(cornerLight3);
    lights.push(cornerLight3);

    var cornerLight4 = new THREE.PointLight(0xFF8800, 1, 30);
    cornerLight4.position.set(20, 5, -10);
    cornerLight4.castShadow = true;
    scene.add(cornerLight4);
    lights.push(cornerLight4);

    var spotLight = new THREE.SpotLight(0xFFEE88, 1.0, 50, Math.PI / 4, 0.8, 2);
    spotLight.position.set(-8, 15, 0);
    spotLight.target.position.set(-8, 7, -5);
    spotLight.castShadow = true;
    scene.add(spotLight);
    scene.add(spotLight.target);
    lights.push(spotLight);
  }

  function update(delta) {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].userData.windingWheel) {
        objects[i].rotation.z += delta * 0.3;
      }
    }
  }

  function reset(scene) {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
