window.MunitionsPlant = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var pressAnimations = [];
  var siloRotations = [];
  var vapors = [];
  var lightFlashes = [];
  var time = 0;

  function buildWalls() {
    var wallColor = 0x4a4a4a;
    var wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });

    var northWall = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 2), wallMaterial);
    northWall.position.set(0, 10, -50);
    scene.add(northWall);

    var southWall = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 2), wallMaterial);
    southWall.position.set(0, 10, 50);
    scene.add(southWall);

    var eastWall = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 100), wallMaterial);
    eastWall.position.set(50, 10, 0);
    scene.add(eastWall);

    var westWall = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 100), wallMaterial);
    westWall.position.set(-50, 10, 0);
    scene.add(westWall);

    var floor = new THREE.Mesh(new THREE.BoxGeometry(100, 0.5, 100), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
    floor.position.y = 0;
    scene.add(floor);
  }

  function buildStampingPresses() {
    var pressMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.7, roughness: 0.3 });
    var positions = [
      [-25, 5, -25],
      [0, 5, -25],
      [25, 5, -25],
      [-25, 5, 0],
      [25, 5, 0]
    ];

    positions.forEach(function(pos) {
      var base = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 8), pressMaterial);
      base.position.set(pos[0], pos[1], pos[2]);
      scene.add(base);

      var plunger = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 6), new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
      plunger.position.set(pos[0], pos[1] + 8, pos[2]);
      scene.add(plunger);

      pressAnimations.push({
        plunger: plunger,
        baseY: pos[1] + 8,
        phase: Math.random() * Math.PI * 2,
        speed: 3 + Math.random() * 2
      });
    });
  }

  function buildStorageSilos() {
    var siloMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.5 });
    var positions = [
      [-35, 12, 20],
      [-15, 12, 20],
      [5, 12, 20],
      [25, 12, 20]
    ];

    positions.forEach(function(pos) {
      var silo = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 24, 16), siloMaterial);
      silo.position.set(pos[0], pos[1], pos[2]);
      scene.add(silo);

      var top = new THREE.Mesh(new THREE.ConeGeometry(6.5, 4, 16), siloMaterial);
      top.position.set(pos[0], pos[1] + 14, pos[2]);
      scene.add(top);

      siloRotations.push({
        silo: silo,
        speed: 0.3 + Math.random() * 0.2
      });
    });
  }

  function buildLoadingBays() {
    var shellColor = 0xccaa00;
    var shellMaterial = new THREE.MeshStandardMaterial({ color: shellColor, metalness: 0.8 });

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 4; j++) {
        var shell = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), shellMaterial);
        shell.position.set(-40 + j * 4, 2 + i * 3.5, -10);
        scene.add(shell);
      }
    }
  }

  function buildNitrationVats() {
    var vatMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016, metalness: 0.4, roughness: 0.6 });
    var positions = [
      [35, 8, -20],
      [45, 8, -10],
      [35, 8, 0]
    ];

    positions.forEach(function(pos) {
      var vat = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 16, 12), vatMaterial);
      vat.position.set(pos[0], pos[1], pos[2]);
      scene.add(vat);

      var vapor = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshStandardMaterial({
        color: 0xffff99,
        transparent: true,
        opacity: 0.15
      }));
      vapor.position.set(pos[0], pos[1] + 12, pos[2]);
      scene.add(vapor);

      vapors.push({
        mesh: vapor,
        baseY: pos[1] + 12,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  function buildCatwalks() {
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });

    var catwalk1 = new THREE.Mesh(new THREE.BoxGeometry(60, 0.8, 3), beamMaterial);
    catwalk1.position.set(0, 12, -15);
    scene.add(catwalk1);

    var catwalk2 = new THREE.Mesh(new THREE.BoxGeometry(60, 0.8, 3), beamMaterial);
    catwalk2.position.set(0, 12, 15);
    scene.add(catwalk2);

    var supportL = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 8), beamMaterial);
    supportL.position.set(-30, 6, -15);
    scene.add(supportL);

    var supportR = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 8), beamMaterial);
    supportR.position.set(30, 6, -15);
    scene.add(supportR);
  }

  function buildEvacuationRoute() {
    var routeMaterial = new THREE.MeshStandardMaterial({ color: 0x00cc00 });
    var marker = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 4), routeMaterial);
    marker.position.set(0, 0.1, -45);
    scene.add(marker);

    var arrow = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 8), routeMaterial);
    arrow.position.set(0, 2, -45);
    arrow.rotation.z = Math.PI / 2;
    scene.add(arrow);

    var beacon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    }));
    beacon.position.set(0, 4, -45);
    scene.add(beacon);

    lightFlashes.push({
      light: beacon,
      phase: 0
    });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    time = 0;
    pressAnimations = [];
    siloRotations = [];
    vapors = [];
    lightFlashes = [];

    buildWalls();
    buildStampingPresses();
    buildStorageSilos();
    buildLoadingBays();
    buildNitrationVats();
    buildCatwalks();
    buildEvacuationRoute();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 40, 20);
    scene.add(directionalLight);
  }

  function update(delta) {
    time += delta;

    pressAnimations.forEach(function(anim) {
      var offset = Math.sin(time * anim.speed + anim.phase) * 2;
      anim.plunger.position.y = anim.baseY + offset;
    });

    siloRotations.forEach(function(silo) {
      silo.silo.rotation.y += delta * silo.speed;
    });

    vapors.forEach(function(vapor) {
      var bob = Math.sin(time * 0.7 + vapor.phase) * 1.2;
      vapor.mesh.position.y = vapor.baseY + bob;
      vapor.mesh.rotation.x += delta * 0.2;
      vapor.mesh.rotation.z += delta * 0.15;
    });

    lightFlashes.forEach(function(flash) {
      var brightness = Math.abs(Math.sin(time * 3)) * 2;
      flash.light.material.emissiveIntensity = brightness;
    });
  }

  function reset() {
    time = 0;
    pressAnimations.forEach(function(anim) {
      anim.plunger.position.y = anim.baseY;
    });
    siloRotations.forEach(function(silo) {
      silo.silo.rotation.y = 0;
    });
    vapors.forEach(function(vapor) {
      vapor.mesh.position.y = vapor.baseY;
      vapor.mesh.rotation.x = 0;
      vapor.mesh.rotation.z = 0;
    });
    lightFlashes.forEach(function(flash) {
      flash.light.material.emissiveIntensity = 0;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
