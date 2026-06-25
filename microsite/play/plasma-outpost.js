window.PlasmaOutpost = (function() {
  'use strict';

  var scene, camera;
  var containmentSpheres = [];
  var turretBases = [];
  var turretCylinders = [];
  var conduitSpheres = [];

  function buildWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
    var wallGeom = new THREE.BoxGeometry(40, 8, 2);

    var backWall = new THREE.Mesh(wallGeom, wallMaterial);
    backWall.position.z = -20;
    backWall.castShadow = true;
    scene.add(backWall);

    var leftWall = new THREE.Mesh(wallGeom, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.scale.z = 10;
    leftWall.position.x = -20;
    leftWall.castShadow = true;
    scene.add(leftWall);

    var rightWall = new THREE.Mesh(wallGeom, wallMaterial);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.scale.z = 10;
    rightWall.position.x = 20;
    rightWall.castShadow = true;
    scene.add(rightWall);
  }

  function buildContainmentCylinders() {
    var containmentMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
    var emissiveMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.8 });

    for (var i = 0; i < 3; i++) {
      var outerGeom = new THREE.CylinderGeometry(2, 2, 6, 32);
      var outer = new THREE.Mesh(outerGeom, containmentMaterial);
      outer.position.x = -15 + i * 15;
      outer.position.y = 3;
      outer.castShadow = true;
      scene.add(outer);

      var innerGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 32);
      var inner = new THREE.Mesh(innerGeom, emissiveMaterial);
      inner.position.x = -15 + i * 15;
      inner.position.y = 3;
      inner.position.z = 0.1;
      scene.add(inner);
    }
  }

  function buildConduits() {
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    var jointMaterial = new THREE.MeshStandardMaterial({ color: 0x00aa66, emissive: 0x00aa66, emissiveIntensity: 0.6 });

    for (var i = 0; i < 4; i++) {
      var pipeGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
      var pipe = new THREE.Mesh(pipeGeom, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.y = 10;
      pipe.position.x = -12 + i * 8;
      pipe.castShadow = true;
      scene.add(pipe);

      var jointGeom = new THREE.SphereGeometry(0.6, 16, 16);
      var joint = new THREE.Mesh(jointGeom, jointMaterial);
      joint.position.y = 10;
      joint.position.x = -8 + i * 8;
      conduitSpheres.push(joint);
      scene.add(joint);
    }
  }

  function buildTurrets() {
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.8 });
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    for (var i = 0; i < 2; i++) {
      var baseGeom = new THREE.SphereGeometry(1, 16, 16);
      var base = new THREE.Mesh(baseGeom, baseMaterial);
      base.position.x = -15 + i * 30;
      base.position.y = 4;
      base.position.z = -18;
      base.castShadow = true;
      turretBases.push(base);
      scene.add(base);

      var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
      var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
      barrel.rotation.z = -Math.PI / 4;
      barrel.position.x = -15 + i * 30;
      barrel.position.y = 5;
      barrel.position.z = -18;
      barrel.castShadow = true;
      turretCylinders.push(barrel);
      scene.add(barrel);
    }
  }

  function buildChargeStations() {
    var podMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.7 });
    var chargeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0080, emissive: 0xff0080, emissiveIntensity: 0.5 });

    for (var i = 0; i < 2; i++) {
      var podGeom = new THREE.BoxGeometry(2, 3, 2);
      var pod = new THREE.Mesh(podGeom, podMaterial);
      pod.position.x = 12 + i * 6;
      pod.position.y = 1.5;
      pod.castShadow = true;
      scene.add(pod);

      var chargeGeom = new THREE.SphereGeometry(0.8, 16, 16);
      var charge = new THREE.Mesh(chargeGeom, chargeMaterial);
      charge.position.x = 12 + i * 6;
      charge.position.y = 3.5;
      scene.add(charge);
    }
  }

  function buildRailing() {
    var railMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var railGeom = new THREE.BufferGeometry();

    var positions = new Float32Array([
      -20, 5, 18, 20, 5, 18,
      20, 5, 18, 20, 2, 18,
      -20, 5, 18, -20, 2, 18
    ]);

    railGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var rails = new THREE.LineSegments(railGeom, railMaterial);
    scene.add(rails);
  }

  function buildBreachZone() {
    var breachMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.7 });

    for (var i = 0; i < 3; i++) {
      var breachGeom = new THREE.SphereGeometry(1.5, 16, 16);
      var breach = new THREE.Mesh(breachGeom, breachMaterial);
      breach.position.x = -8 + i * 8;
      breach.position.y = 2;
      breach.position.z = 15;
      breach.userData.initialScale = 1.5;
      containmentSpheres.push(breach);
      scene.add(breach);
    }
  }

  function buildFloor() {
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
    var floorGeom = new THREE.BoxGeometry(50, 0.5, 40);
    var floor = new THREE.Mesh(floorGeom, floorMaterial);
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  function buildSky() {
    var skyGeom = new THREE.SphereGeometry(150, 32, 32);
    var skyMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, side: THREE.BackSide });
    var sky = new THREE.Mesh(skyGeom, skyMaterial);
    scene.add(sky);
  }

  function setupLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var plasmaLight = new THREE.PointLight(0x00ff88, 1.5, 25);
    plasmaLight.position.set(-15, 3, 0);
    scene.add(plasmaLight);

    var breachLight = new THREE.PointLight(0xff00ff, 2, 30);
    breachLight.position.set(0, 2, 15);
    scene.add(breachLight);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildFloor();
    buildSky();
    buildWalls();
    buildContainmentCylinders();
    buildConduits();
    buildTurrets();
    buildChargeStations();
    buildRailing();
    buildBreachZone();
    setupLights();
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < turretBases.length; i++) {
      turretBases[i].rotation.y += delta * 0.5;
    }

    for (var i = 0; i < turretCylinders.length; i++) {
      turretCylinders[i].rotation.z = -Math.PI / 4 + Math.sin(time + i) * 0.3;
    }

    for (var i = 0; i < conduitSpheres.length; i++) {
      conduitSpheres[i].scale.x = 1 + Math.sin(time * 2 + i) * 0.15;
      conduitSpheres[i].scale.y = 1 + Math.sin(time * 2 + i) * 0.15;
      conduitSpheres[i].scale.z = 1 + Math.sin(time * 2 + i) * 0.15;
    }

    for (var i = 0; i < containmentSpheres.length; i++) {
      var sphere = containmentSpheres[i];
      var scale = sphere.userData.initialScale * (1 + Math.sin(time * 1.5 + i * 0.3) * 0.25);
      sphere.scale.set(scale, scale, scale);
    }
  }

  function reset() {
    containmentSpheres = [];
    turretBases = [];
    turretCylinders = [];
    conduitSpheres = [];

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
