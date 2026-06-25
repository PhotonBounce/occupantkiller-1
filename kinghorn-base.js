window.KinghornBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createTerminal(scene) {
    var geometry = new THREE.BoxGeometry(16, 5, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 2.5, 0);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createRamp(scene) {
    var geometry = new THREE.BoxGeometry(16, 0.5, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = 0.1;
    mesh.position.set(0, 0.25, 8);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createMemorialCross(scene) {
    var vertical = new THREE.BoxGeometry(1, 6, 1);
    var vMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var vMesh = new THREE.Mesh(vertical, vMaterial);
    vMesh.position.set(-8, 3, 8);
    scene.add(vMesh);
    objects.push(vMesh);

    var horizontal = new THREE.BoxGeometry(3, 1, 1);
    var hMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var hMesh = new THREE.Mesh(horizontal, hMaterial);
    hMesh.position.set(-8, 4, 8);
    scene.add(hMesh);
    objects.push(hMesh);

    var arm1 = new THREE.BoxGeometry(1.5, 0.5, 0.5);
    var aMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var aMesh1 = new THREE.Mesh(arm1, aMaterial);
    aMesh1.position.set(-8, 5, 8);
    scene.add(aMesh1);
    objects.push(aMesh1);

    return vMesh;
  }

  function createCliffMemorial(scene) {
    var geometry = new THREE.BoxGeometry(4, 2, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-6, 1, 10);
    scene.add(mesh);
    objects.push(mesh);

    var box2 = new THREE.BoxGeometry(2, 1.5, 3);
    var mesh2 = new THREE.Mesh(box2, material);
    mesh2.position.set(-8, 0.75, 11);
    scene.add(mesh2);
    objects.push(mesh2);

    return mesh;
  }

  function createCastleRuins(scene) {
    var wall1Geo = new THREE.BoxGeometry(1, 8, 10);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var wall1 = new THREE.Mesh(wall1Geo, stoneMat);
    wall1.position.set(8, 4, -5);
    scene.add(wall1);
    objects.push(wall1);

    var wall2Geo = new THREE.BoxGeometry(1, 8, 6);
    var wall2 = new THREE.Mesh(wall2Geo, stoneMat);
    wall2.position.set(9, 4, -3);
    scene.add(wall2);
    objects.push(wall2);

    return wall1;
  }

  function createBeach(scene) {
    var geometry = new THREE.BoxGeometry(20, 0.3, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0xCCBB88 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 0.15, -8);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createLandingCraft(scene) {
    var geometry = new THREE.BoxGeometry(10, 2, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(12, 1, -6);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createRadarPost(scene) {
    var boxGeo = new THREE.BoxGeometry(4, 4, 4);
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var box = new THREE.Mesh(boxGeo, darkMat);
    box.position.set(-10, 2, 6);
    scene.add(box);
    objects.push(box);

    var cylGeo = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
    var antenna = new THREE.Mesh(cylGeo, darkMat);
    antenna.position.set(-10, 9, 6);
    antenna.name = 'radarAntenna';
    scene.add(antenna);
    objects.push(antenna);

    return box;
  }

  function createHarbour(scene) {
    var geometry = new THREE.BoxGeometry(14, 1, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(6, 0.5, -12);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addLighting(scene) {
    var ambientGeo = new THREE.AmbientLight(0x99AABB, 0.6);
    scene.add(ambientGeo);
    lights.push(ambientGeo);

    var pointLight = new THREE.PointLight(0xFFFFFF, 1.0);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);
    lights.push(pointLight);

    var pointLight2 = new THREE.PointLight(0xFFFFFF, 0.8);
    pointLight2.position.set(8, 6, -5);
    scene.add(pointLight2);
    lights.push(pointLight2);

    return pointLight;
  }

  function build(scene) {
    createTerminal(scene);
    createRamp(scene);
    createMemorialCross(scene);
    createCliffMemorial(scene);
    createCastleRuins(scene);
    createBeach(scene);
    createLandingCraft(scene);
    createRadarPost(scene);
    createHarbour(scene);
    addLighting(scene);
  }

  function update(delta) {
    var i = 0;
    while (i < objects.length) {
      var obj = objects[i];
      if (obj.name === 'radarAntenna') {
        obj.rotation.y += delta * 1.5;
      }
      i++;
    }
  }

  function reset(scene) {
    var i = 0;
    while (i < objects.length) {
      scene.remove(objects[i]);
      i++;
    }
    objects = [];

    var j = 0;
    while (j < lights.length) {
      scene.remove(lights[j]);
      j++;
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
