window.AberfeldyDock = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createBridge(scene) {
    var roadMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });

    var roadGeometry = new THREE.BoxGeometry(50, 2, 6);
    var road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(0, 4, 0);
    scene.add(road);
    objects.push(road);

    var archRadius = 3;
    var archSpacing = 10;
    var startX = -20;

    for (var i = 0; i < 5; i++) {
      var xPos = startX + (i * archSpacing);

      var leftArchGeometry = new THREE.CylinderGeometry(archRadius, archRadius, 2, 16, 8);
      var leftArch = new THREE.Mesh(leftArchGeometry, stoneMaterial);
      leftArch.position.set(xPos - 2, 1, -4);
      leftArch.rotation.z = Math.PI / 2;
      scene.add(leftArch);
      objects.push(leftArch);

      var rightArchGeometry = new THREE.CylinderGeometry(archRadius, archRadius, 2, 16, 8);
      var rightArch = new THREE.Mesh(rightArchGeometry, stoneMaterial);
      rightArch.position.set(xPos + 2, 1, -4);
      rightArch.rotation.z = Math.PI / 2;
      scene.add(rightArch);
      objects.push(rightArch);

      var pointLightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var pointLightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var pointLightMesh = new THREE.Mesh(pointLightGeometry, pointLightMaterial);
      pointLightMesh.position.set(xPos, 6, 0);
      scene.add(pointLightMesh);
      objects.push(pointLightMesh);

      var pointLight = new THREE.PointLight(0xFFFFFF, 0.9, 30);
      pointLight.position.set(xPos, 6, 0);
      scene.add(pointLight);
      lights.push(pointLight);
    }
  }

  function createCentralObelisk(scene) {
    var obeliskMaterial = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });

    var obeliskGeometry = new THREE.BoxGeometry(1, 8, 1);
    var obelisk = new THREE.Mesh(obeliskGeometry, obeliskMaterial);
    obelisk.position.set(0, 8, 0);
    scene.add(obelisk);
    objects.push(obelisk);

    var sphereGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 12.5, 0);
    scene.add(sphere);
    objects.push(sphere);
  }

  function createSupplyDepot(scene) {
    var depotMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5240 });

    var depotGeometry = new THREE.BoxGeometry(14, 5, 10);
    var depot = new THREE.Mesh(depotGeometry, depotMaterial);
    depot.position.set(-25, 2.5, -15);
    scene.add(depot);
    objects.push(depot);
  }

  function createPatrolBoats(scene) {
    var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });

    var boat1Geometry = new THREE.BoxGeometry(8, 1.5, 3);
    var boat1 = new THREE.Mesh(boat1Geometry, boatMaterial);
    boat1.position.set(-15, 0.75, -25);
    boat1.userData.boatIndex = 0;
    scene.add(boat1);
    objects.push(boat1);

    var boat2Geometry = new THREE.BoxGeometry(8, 1.5, 3);
    var boat2 = new THREE.Mesh(boat2Geometry, boatMaterial);
    boat2.position.set(15, 0.75, -20);
    boat2.userData.boatIndex = 1;
    scene.add(boat2);
    objects.push(boat2);
  }

  function createDistilleryPagoda(scene) {
    var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });

    var baseGeometry = new THREE.CylinderGeometry(4, 4, 6, 16);
    var base = new THREE.Mesh(baseGeometry, cylinderMaterial);
    base.position.set(25, 3, -18);
    scene.add(base);
    objects.push(base);

    var roofGeometry = new THREE.ConeGeometry(5, 4, 16);
    var roof = new THREE.Mesh(roofGeometry, coneMaterial);
    roof.position.set(25, 9, -18);
    scene.add(roof);
    objects.push(roof);
  }

  function createRoadMarker(scene) {
    var postMaterial = new THREE.MeshLambertMaterial({ color: 0xBB8833 });
    var signMaterial = new THREE.MeshLambertMaterial({ color: 0xBB8833 });

    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-35, 2, 10);
    scene.add(post);
    objects.push(post);

    var signGeometry = new THREE.BoxGeometry(3, 2, 0.5);
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(-35, 5, 10);
    scene.add(sign);
    objects.push(sign);
  }

  function createMemorialStatue(scene) {
    var plinthMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3A00 });
    var statueMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3A00 });

    var plinthGeometry = new THREE.BoxGeometry(2, 4, 2);
    var plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinth.position.set(35, 2, 15);
    scene.add(plinth);
    objects.push(plinth);

    var statueGeometry = new THREE.BoxGeometry(1, 3, 1);
    var statue = new THREE.Mesh(statueGeometry, statueMaterial);
    statue.position.set(35, 6.5, 15);
    scene.add(statue);
    objects.push(statue);
  }

  function createFordMarkers(scene) {
    var markerMaterial = new THREE.MeshLambertMaterial({ color: 0x887766 });

    var positions = [
      { x: 5, y: -5 },
      { x: 10, y: -8 },
      { x: -5, y: -10 },
      { x: -10, y: -7 },
      { x: 0, y: -12 },
      { x: 15, y: -5 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var markerGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(positions[i].x, 0.8, positions[i].y);
      scene.add(marker);
      objects.push(marker);
    }
  }

  function createMistAmbient(scene) {
    var ambientLight = new THREE.AmbientLight(0xAABBCC, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function build(scene) {
    createBridge(scene);
    createCentralObelisk(scene);
    createSupplyDepot(scene);
    createPatrolBoats(scene);
    createDistilleryPagoda(scene);
    createRoadMarker(scene);
    createMemorialStatue(scene);
    createFordMarkers(scene);
    createMistAmbient(scene);
  }

  function update(delta) {
    var boatTime = Date.now() * 0.001;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData.boatIndex !== undefined) {
        var baseY = obj.userData.boatIndex === 0 ? 0.75 : 0.75;
        obj.position.y = baseY + Math.sin(boatTime + obj.userData.boatIndex) * 0.15;
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
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
