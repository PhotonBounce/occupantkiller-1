window.BathgateKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var radarSphere = null;

  function buildPrimaryBing(scene) {
    var geometry = new THREE.BoxGeometry(20, 8, 20);
    var material = new THREE.MeshLambertMaterial({ color: 0x6B3344 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 4, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function buildSecondaryBing(scene) {
    var geometry = new THREE.BoxGeometry(14, 6, 14);
    var material = new THREE.MeshLambertMaterial({ color: 0x5C2233 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(25, 3, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function buildSilicaRuins(scene) {
    var geometry = new THREE.BoxGeometry(14, 6, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-20, 3, 15);
    scene.add(mesh);
    objects.push(mesh);
  }

  function buildRetortFurnace(scene) {
    var bodyGeometry = new THREE.CylinderGeometry(3, 3, 8, 16);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B3A3A });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(30, 4, 25);
    scene.add(body);
    objects.push(body);

    var topGeometry = new THREE.CylinderGeometry(3.2, 3, 0.5, 16);
    var topMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(30, 8.25, 25);
    scene.add(top);
    objects.push(top);
  }

  function buildMilitaryBunker(scene) {
    var geometry = new THREE.BoxGeometry(8, 3, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x5C4030 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-5, 2, -8);
    scene.add(mesh);
    objects.push(mesh);
  }

  function buildRadarInstallation(scene) {
    var plinthGeometry = new THREE.BoxGeometry(4, 1, 4);
    var plinthMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinth.position.set(0, 8.5, 0);
    scene.add(plinth);
    objects.push(plinth);

    var radarGeometry = new THREE.SphereGeometry(3, 16, 16);
    var radarMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    radarSphere = new THREE.Mesh(radarGeometry, radarMaterial);
    radarSphere.position.set(0, 11, 0);
    scene.add(radarSphere);
    objects.push(radarSphere);
  }

  function buildSecurityPerimeter(scene) {
    var posts = [
      [-30, 0.5, -30],
      [30, 0.5, -30],
      [30, 0.5, 30],
      [-30, 0.5, 30]
    ];

    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var i;
    for (i = 0; i < posts.length; i = i + 1) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(posts[i][0], posts[i][1], posts[i][2]);
      scene.add(post);
      objects.push(post);
    }

    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      -30, 1, -30,
      30, 1, -30,
      30, 1, 30,
      -30, 1, 30,
      -30, 1, -30
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x999999 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    objects.push(wire);
  }

  function buildWorkerCottages(scene) {
    var cottages = [
      [-15, 0, -20],
      [-10, 0, -20],
      [-5, 0, -20],
      [0, 0, -20],
      [5, 0, -20]
    ];

    var cottageGeometry = new THREE.BoxGeometry(6, 4, 5);
    var cottageMaterial = new THREE.MeshLambertMaterial({ color: 0x998877 });

    var j;
    for (j = 0; j < cottages.length; j = j + 1) {
      var cottage = new THREE.Mesh(cottageGeometry, cottageMaterial);
      cottage.position.set(cottages[j][0], cottages[j][1], cottages[j][2]);
      scene.add(cottage);
      objects.push(cottage);
    }
  }

  function createAmbientLight(scene) {
    var light = new THREE.AmbientLight(0xCC7755, 0.5);
    scene.add(light);
    lights.push(light);
  }

  function createRadarLight(scene) {
    var light = new THREE.PointLight(0xFF2200, 0.9);
    light.position.set(0, 11, 0);
    scene.add(light);
    lights.push(light);
  }

  function createPerimeterFloodlights(scene) {
    var positions = [
      [-25, 5, -25],
      [25, 5, -25],
      [25, 5, 25],
      [-25, 5, 25]
    ];

    var k;
    for (k = 0; k < positions.length; k = k + 1) {
      var light = new THREE.PointLight(0xFFFFFF, 0.6);
      light.position.set(positions[k][0], positions[k][1], positions[k][2]);
      scene.add(light);
      lights.push(light);
    }
  }

  function create(scene) {
    buildPrimaryBing(scene);
    buildSecondaryBing(scene);
    buildSilicaRuins(scene);
    buildRetortFurnace(scene);
    buildMilitaryBunker(scene);
    buildRadarInstallation(scene);
    buildSecurityPerimeter(scene);
    buildWorkerCottages(scene);
    createAmbientLight(scene);
    createRadarLight(scene);
    createPerimeterFloodlights(scene);
  }

  function update(delta) {
    if (radarSphere) {
      radarSphere.rotation.x = radarSphere.rotation.x + (delta * 0.5);
      radarSphere.rotation.y = radarSphere.rotation.y + (delta * 0.8);
    }
  }

  function reset(scene) {
    var i;
    for (i = 0; i < objects.length; i = i + 1) {
      scene.remove(objects[i]);
    }
    objects = [];

    var j;
    for (j = 0; j < lights.length; j = j + 1) {
      scene.remove(lights[j]);
    }
    lights = [];
    radarSphere = null;
  }

  return {
    create: create,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
