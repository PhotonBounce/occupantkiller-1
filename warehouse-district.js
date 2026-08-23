window.WarehouseDistrict = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene, camera, renderer, controls;
  var sceneObjects = [];
  var deaVehicle, forklift, drone;
  var gangMembers = [];
  var deaAgents = [];
  var hudCanvas, hudContext;
  var lastWKey = 0, lastDKey = 0;
  var hudVisible = true;
  var gangArrested = 0;
  var shipmentSeized = false;
  var deaSafe = 4;

  function init(container) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a4a4a);
    scene.fog = new THREE.Fog(0x4a4a4a, 500, 1000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(100, 80, 100);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(200, 300, 200);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.left = -500;
    light.shadow.camera.right = 500;
    light.shadow.camera.top = 500;
    light.shadow.camera.bottom = -500;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 1000;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    buildScene();
    setupHUD();
    setupKeyBindings();

    window.addEventListener('resize', onWindowResize);
    animate();
  }

  function buildScene() {
    // 1. District ground
    var groundGeom = new THREE.BoxGeometry(600, 2, 600);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);

    // 2. Warehouse A
    var warehouseAGeom = new THREE.BoxGeometry(100, 50, 80);
    var warehouseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var warehouseA = new THREE.Mesh(warehouseAGeom, warehouseMat);
    warehouseA.position.set(-120, 25, -80);
    warehouseA.castShadow = true;
    warehouseA.receiveShadow = true;
    scene.add(warehouseA);
    sceneObjects.push(warehouseA);

    // Loading doors on Warehouse A
    var doorGeom = new THREE.BoxGeometry(30, 35, 2);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var door1 = new THREE.Mesh(doorGeom, doorMat);
    door1.position.set(-120, 25, -80 - 40);
    door1.castShadow = true;
    scene.add(door1);
    sceneObjects.push(door1);

    // 3. Warehouse B
    var warehouseBGeom = new THREE.BoxGeometry(100, 50, 80);
    var warehouseB = new THREE.Mesh(warehouseBGeom, warehouseMat);
    warehouseB.position.set(120, 25, 20);
    warehouseB.castShadow = true;
    warehouseB.receiveShadow = true;
    scene.add(warehouseB);
    sceneObjects.push(warehouseB);

    var door2 = new THREE.Mesh(doorGeom, doorMat);
    door2.position.set(120, 25, 20 - 40);
    door2.castShadow = true;
    scene.add(door2);
    sceneObjects.push(door2);

    // 4. Loading dock platforms
    var dockGeom = new THREE.BoxGeometry(60, 3, 50);
    var dockMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var dock1 = new THREE.Mesh(dockGeom, dockMat);
    dock1.position.set(-120, 20, -50);
    dock1.castShadow = true;
    dock1.receiveShadow = true;
    scene.add(dock1);
    sceneObjects.push(dock1);

    var dock2 = new THREE.Mesh(dockGeom, dockMat);
    dock2.position.set(120, 20, 50);
    dock2.castShadow = true;
    dock2.receiveShadow = true;
    scene.add(dock2);
    sceneObjects.push(dock2);

    // 5. Semi truck at dock
    var cabGeom = new THREE.BoxGeometry(25, 25, 35);
    var truckMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var cab = new THREE.Mesh(cabGeom, truckMat);
    cab.position.set(-120, 15, -90);
    cab.castShadow = true;
    scene.add(cab);
    sceneObjects.push(cab);

    var trailerGeom = new THREE.BoxGeometry(30, 30, 60);
    var trailer = new THREE.Mesh(trailerGeom, truckMat);
    trailer.position.set(-120, 15, -50);
    trailer.castShadow = true;
    scene.add(trailer);
    sceneObjects.push(trailer);

    // 6. Forklift
    var forklifBody = new THREE.BoxGeometry(15, 20, 20);
    var forkMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    forklift = new THREE.Mesh(forklifBody, forkMat);
    forklift.position.set(0, 10, -60);
    forklift.castShadow = true;
    scene.add(forklift);
    sceneObjects.push(forklift);

    var wheelGeom = new THREE.CylinderGeometry(5, 5, 3, 16);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    var wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel1.position.set(-5, 5, -8);
    wheel1.rotation.z = Math.PI / 2;
    forklift.add(wheel1);

    var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel2.position.set(5, 5, -8);
    wheel2.rotation.z = Math.PI / 2;
    forklift.add(wheel2);

    var forkGeom = new THREE.BoxGeometry(2, 15, 40);
    var forkMat2 = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var forks = new THREE.Mesh(forkGeom, forkMat2);
    forks.position.set(0, 15, 0);
    forklift.add(forks);

    // 7. Shipping container stack
    var containerGeom = new THREE.BoxGeometry(20, 20, 40);
    var containerMat = new THREE.MeshLambertMaterial({ color: 0x0066cc });
    for (var i = 0; i < 3; i++) {
      var container = new THREE.Mesh(containerGeom, containerMat);
      container.position.set(80, 10 + i * 20, -30);
      container.castShadow = true;
      scene.add(container);
      sceneObjects.push(container);
    }

    // 8. Gang member figures (6)
    gangMembers = [];
    var gangPositions = [
      [-80, 0, 40],
      [-60, 0, 60],
      [-40, 0, 50],
      [40, 0, -40],
      [60, 0, -30],
      [80, 0, 20]
    ];
    for (var i = 0; i < 6; i++) {
      var gang = createFigure(gangPositions[i], 0xff0000);
      gangMembers.push(gang);
    }

    // 9. DEA agent figures (4)
    deaAgents = [];
    var deaPositions = [
      [-150, 0, 0],
      [-150, 0, 30],
      [-150, 0, -30],
      [-150, 0, 60]
    ];
    for (var i = 0; i < 4; i++) {
      var agent = createFigure(deaPositions[i], 0x0000ff);
      deaAgents.push(agent);
    }

    // 10. DEA armored vehicle
    var vehicleGeom = new THREE.BoxGeometry(40, 35, 60);
    var vehicleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    deaVehicle = new THREE.Mesh(vehicleGeom, vehicleMat);
    deaVehicle.position.set(-200, 17, 0);
    deaVehicle.castShadow = true;
    scene.add(deaVehicle);
    sceneObjects.push(deaVehicle);

    // 11. Drug shipment pallets
    var palletGeom = new THREE.BoxGeometry(20, 2, 20);
    var palletMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var pallet1 = new THREE.Mesh(palletGeom, palletMat);
    pallet1.position.set(100, 1, 0);
    pallet1.receiveShadow = true;
    scene.add(pallet1);
    sceneObjects.push(pallet1);

    var packageGeom = new THREE.BoxGeometry(8, 8, 8);
    var packageMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (var i = 0; i < 4; i++) {
      var pkg = new THREE.Mesh(packageGeom, packageMat);
      pkg.position.set(100 + (i % 2) * 10 - 5, 5 + Math.floor(i / 2) * 8, 0 + (i % 2) * 5 - 2.5);
      pkg.castShadow = true;
      scene.add(pkg);
      sceneObjects.push(pkg);
    }

    // 12. Perimeter chain-link fence
    var fenceGroup = new THREE.Group();
    var postGeom = new THREE.CylinderGeometry(2, 2, 40, 8);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var fencePositions = [
      [-250, 0, -250],
      [-250, 0, 250],
      [250, 0, -250],
      [250, 0, 250]
    ];
    for (var i = 0; i < 4; i++) {
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(fencePositions[i][0], 20, fencePositions[i][2]);
      post.castShadow = true;
      fenceGroup.add(post);
    }
    var lineMat = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
    var lineGeom = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      -250, 20, -250,
      -250, 20, 250,
      250, 20, 250,
      250, 20, -250,
      -250, 20, -250
    ]);
    lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var fence = new THREE.LineSegments(lineGeom, lineMat);
    fenceGroup.add(fence);
    scene.add(fenceGroup);
    sceneObjects.push(fenceGroup);

    // 13. Security guard booth
    var boothGeom = new THREE.BoxGeometry(15, 15, 15);
    var boothMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
    var booth = new THREE.Mesh(boothGeom, boothMat);
    booth.position.set(-250, 7, 0);
    booth.castShadow = true;
    scene.add(booth);
    sceneObjects.push(booth);

    // 14. Industrial light towers (4)
    for (var i = 0; i < 4; i++) {
      var towerPos = [
        [-200, 0, -200],
        [-200, 0, 200],
        [200, 0, -200],
        [200, 0, 200]
      ];
      var poleGeom = new THREE.CylinderGeometry(3, 3, 80, 8);
      var poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(towerPos[i][0], 40, towerPos[i][2]);
      pole.castShadow = true;
      scene.add(pole);
      sceneObjects.push(pole);

      var lightGeom = new THREE.SphereGeometry(8, 8, 8);
      var lightMat = new THREE.MeshBasicMaterial({ color: 0xffff99, emissive: 0xffff99 });
      var lightBulb = new THREE.Mesh(lightGeom, lightMat);
      lightBulb.position.set(towerPos[i][0], 75, towerPos[i][2]);
      scene.add(lightBulb);
      sceneObjects.push(lightBulb);
    }

    // 15. Surveillance drone
    var droneGeom = new THREE.BoxGeometry(10, 5, 10);
    var droneMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    drone = new THREE.Mesh(droneGeom, droneMat);
    drone.position.set(0, 100, 0);
    drone.castShadow = true;
    scene.add(drone);
    sceneObjects.push(drone);

    var rotorGeom = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    var rotor1 = new THREE.Mesh(rotorGeom, rotorMat);
    rotor1.position.set(-5, 5, -5);
    drone.add(rotor1);

    var rotor2 = new THREE.Mesh(rotorGeom, rotorMat);
    rotor2.position.set(5, 5, -5);
    drone.add(rotor2);

    var rotor3 = new THREE.Mesh(rotorGeom, rotorMat);
    rotor3.position.set(-5, 5, 5);
    drone.add(rotor3);

    var rotor4 = new THREE.Mesh(rotorGeom, rotorMat);
    rotor4.position.set(5, 5, 5);
    drone.add(rotor4);

    // 16. Abandoned car
    var carGeom = new THREE.BoxGeometry(20, 15, 40);
    var carMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var car = new THREE.Mesh(carGeom, carMat);
    car.position.set(-50, 8, 100);
    car.castShadow = true;
    scene.add(car);
    sceneObjects.push(car);

    // 17. Explosion debris
    var debrisGeom = new THREE.BoxGeometry(5, 5, 5);
    var debrisMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var debrisPositions = [
      [-120, 30, -75],
      [-120, 35, -70],
      [-115, 25, -80],
      [-125, 28, -78]
    ];
    for (var i = 0; i < 4; i++) {
      var debris = new THREE.Mesh(debrisGeom, debrisMat);
      debris.position.set(debrisPositions[i][0], debrisPositions[i][1], debrisPositions[i][2]);
      debris.castShadow = true;
      scene.add(debris);
      sceneObjects.push(debris);
    }
  }

  function createFigure(position, color) {
    var group = new THREE.Group();
    var bodyGeom = new THREE.BoxGeometry(6, 15, 6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 10;
    body.castShadow = true;
    group.add(body);

    var headGeom = new THREE.SphereGeometry(4, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 22;
    head.castShadow = true;
    group.add(head);

    group.position.set(position[0], position[1], position[2]);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    document.body.appendChild(hudCanvas);
    hudContext = hudCanvas.getContext('2d');
  }

  function drawHUD() {
    if (!hudVisible) return;
    hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    hudContext.fillStyle = '#ffffff';
    hudContext.font = '24px Arial';
    hudContext.fillText('GANG MEMBERS ARRESTED: ' + gangArrested + '/6', 20, 40);
    hudContext.fillText('SHIPMENT SEIZED: ' + (shipmentSeized ? 'YES' : 'NO'), 20, 80);
    hudContext.fillText('DEA AGENTS SAFE: ' + deaSafe + '/4', 20, 120);
  }

  function setupKeyBindings() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'w' || e.key === 'W') {
        lastWKey = Date.now();
      }
      if (e.key === 'd' || e.key === 'D') {
        if (Date.now() - lastWKey < 400) {
          hudVisible = !hudVisible;
        }
        lastDKey = Date.now();
      }
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    var time = Date.now() * 0.001;

    // DEA vehicle advances
    if (deaVehicle.position.x < 50) {
      deaVehicle.position.x += 0.1;
    }

    // Gang members take cover
    for (var i = 0; i < gangMembers.length; i++) {
      gangMembers[i].position.y = Math.sin(time + i) * 2;
    }

    // DEA agents advance in formation
    for (var i = 0; i < deaAgents.length; i++) {
      deaAgents[i].position.x += 0.05;
    }

    // Forklift drives circuit
    var forkPath = 200 * Math.sin(time * 0.3);
    forklift.position.x = forkPath;
    forklift.position.z = 200 * Math.cos(time * 0.3) - 60;
    forklift.rotation.y = Math.atan2(Math.cos(time * 0.3), Math.sin(time * 0.3));

    // Drone circles overhead
    drone.position.x = 100 * Math.cos(time * 0.5);
    drone.position.z = 100 * Math.sin(time * 0.5);

    // Industrial lights flicker
    var lightFlicker = 0.6 + 0.4 * Math.sin(time * 5);
    scene.children.forEach(function(child) {
      if (child.material && child.material.emissive) {
        child.material.emissive.setHSL(0.15, 1, lightFlicker * 0.5);
      }
    });

    drawHUD();
    if (renderer) renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (hudCanvas) {
      hudCanvas.width = window.innerWidth;
      hudCanvas.height = window.innerHeight;
    }
  }

  function update() {
    if (renderer) {
      if (renderer) renderer.render(scene, camera);
    }
  }

  function reset() {
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) {
            m.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });
    if (renderer) {
      renderer.dispose();
    }
    sceneObjects = [];
    gangMembers = [];
    deaAgents = [];
    scene = null;
    camera = null;
    renderer = null;
    hudCanvas = null;
    hudContext = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
