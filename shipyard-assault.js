window.ShipyardAssault = (function() {
  'use strict';

  var scene, camera;
  var terrorizts = [];
  var navyTeam = [];
  var vehicles = [];
  var weldingSparks = [];
  var gantryBoom = null;
  var gantryHook = null;
  var hudDiv = null;
  var keyStates = {};
  var hudToggleSequence = [];

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    terrorizts = [];
    navyTeam = [];
    vehicles = [];
    weldingSparks = [];
    keyStates = {};
    hudToggleSequence = [];

    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 400, 800);

    // 1. Shipyard ground - concrete gray flat box
    var groundGeom = new THREE.BoxGeometry(400, 0.3, 400);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Dry dock basin - recessed box with water
    var dockGeom = new THREE.BoxGeometry(80, 3, 30);
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x1a5f7a, metalness: 0.3 });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(-100, -1.5, 0);
    dock.receiveShadow = true;
    scene.add(dock);

    // Water surface in dock
    var waterGeom = new THREE.BoxGeometry(78, 0.1, 28);
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x2288dd, metalness: 0.5, roughness: 0.4 });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(-100, 0.8, 0);
    scene.add(water);

    // 3. Half-built destroyer hull
    var hullGeom = new THREE.BoxGeometry(70, 8, 20);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(-100, 1, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);

    // Hull frame ribs - thin vertical struts
    for (var i = 0; i < 6; i++) {
      var ribGeom = new THREE.BoxGeometry(2, 8, 0.5);
      var ribMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var rib = new THREE.Mesh(ribGeom, ribMat);
      rib.position.set(-100 + (i - 2.5) * 18, 1, 0);
      rib.castShadow = true;
      scene.add(rib);
    }

    // 4. Gantry crane - A-frame tower + boom + hook
    // Left tower leg
    var leftLegGeom = new THREE.BoxGeometry(3, 80, 3);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    var leftLeg = new THREE.Mesh(leftLegGeom, legMat);
    leftLeg.position.set(-120, 40, -25);
    leftLeg.castShadow = true;
    scene.add(leftLeg);

    // Right tower leg
    var rightLeg = new THREE.Mesh(leftLegGeom, legMat);
    rightLeg.position.set(-80, 40, -25);
    rightLeg.castShadow = true;
    scene.add(rightLeg);

    // Top A-frame
    var topBeamGeom = new THREE.BoxGeometry(42, 4, 3);
    var topBeam = new THREE.Mesh(topBeamGeom, legMat);
    topBeam.position.set(-100, 78, -25);
    topBeam.castShadow = true;
    scene.add(topBeam);

    // Gantry boom - horizontal, swingable
    gantryBoom = new THREE.Group();
    var boomGeom = new THREE.BoxGeometry(60, 3, 3);
    var boom = new THREE.Mesh(boomGeom, legMat);
    boom.position.set(30, 0, 0);
    boom.castShadow = true;
    gantryBoom.add(boom);

    // Gantry hook - hanging below boom
    gantryHook = new THREE.Group();
    var hookGeom = new THREE.BoxGeometry(2, 15, 2);
    var hook = new THREE.Mesh(hookGeom, new THREE.MeshStandardMaterial({ color: 0x999999 }));
    hook.position.set(30, -7.5, 0);
    hook.castShadow = true;
    gantryHook.add(hook);

    gantryBoom.add(gantryHook);
    gantryBoom.position.set(-100, 76, -25);
    scene.add(gantryBoom);

    // 5. Second dry dock - submarine hull
    var dock2Geom = new THREE.BoxGeometry(60, 2, 20);
    var dock2Mat = new THREE.MeshStandardMaterial({ color: 0x1a5f7a });
    var dock2 = new THREE.Mesh(dock2Geom, dock2Mat);
    dock2.position.set(80, -1, 0);
    dock2.receiveShadow = true;
    scene.add(dock2);

    // Submarine hull
    var subGeom = new THREE.BoxGeometry(50, 6, 12);
    var subMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    var sub = new THREE.Mesh(subGeom, subMat);
    sub.position.set(80, 2, 0);
    sub.castShadow = true;
    scene.add(sub);

    // 6. Munitions warehouse - large box building
    var warehouseGeom = new THREE.BoxGeometry(40, 15, 30);
    var warehouseMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var warehouse = new THREE.Mesh(warehouseGeom, warehouseMat);
    warehouse.position.set(150, 7.5, -80);
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;
    scene.add(warehouse);

    // Warning markings on warehouse
    var warningGeom = new THREE.BoxGeometry(8, 8, 0.5);
    var warningMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    var warning1 = new THREE.Mesh(warningGeom, warningMat);
    warning1.position.set(150 - 15, 10, -14.75);
    scene.add(warning1);

    var warning2 = new THREE.Mesh(warningGeom, warningMat);
    warning2.position.set(150 + 15, 10, -14.75);
    scene.add(warning2);

    // 7. Terrorist figures - dark box bodies
    var terroristPositions = [
      { x: -80, y: 2, z: -30 },
      { x: -60, y: 2, z: 40 },
      { x: 50, y: 2, z: -50 },
      { x: 120, y: 2, z: -20 },
      { x: 140, y: 2, z: 50 },
      { x: -140, y: 2, z: 20 }
    ];

    var terroristMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    for (var t = 0; t < terroristPositions.length; t++) {
      var pos = terroristPositions[t];
      var terroristGeom = new THREE.BoxGeometry(1.5, 3, 1);
      var terrorist = new THREE.Mesh(terroristGeom, terroristMat);
      terrorist.position.set(pos.x, pos.y, pos.z);
      terrorist.castShadow = true;
      terrorist.userData = { type: 'terrorist', angle: 0 };
      scene.add(terrorist);
      terrorizts.push(terrorist);
    }

    // 8. Navy response team - blue/gray box figures
    var navyPositions = [
      { x: -180, y: 2, z: -60 },
      { x: -170, y: 2, z: -50 },
      { x: -175, y: 2, z: -35 },
      { x: -185, y: 2, z: -45 },
      { x: -165, y: 2, z: -20 }
    ];

    var navyMat = new THREE.MeshStandardMaterial({ color: 0x4a6fa5 });
    for (var n = 0; n < navyPositions.length; n++) {
      var npos = navyPositions[n];
      var navyGeom = new THREE.BoxGeometry(1.5, 3, 1);
      var navySoldier = new THREE.Mesh(navyGeom, navyMat);
      navySoldier.position.set(npos.x, npos.y, npos.z);
      navySoldier.castShadow = true;
      navySoldier.userData = { type: 'navy', angle: 0 };
      scene.add(navySoldier);
      navyTeam.push(navySoldier);
    }

    // 9. Navy armored vehicles - dark gray box trucks
    var vehMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });

    // Vehicle 1 body
    var veh1BodyGeom = new THREE.BoxGeometry(6, 4, 3);
    var veh1Body = new THREE.Mesh(veh1BodyGeom, vehMat);
    veh1Body.position.set(-160, 2, -70);
    veh1Body.castShadow = true;
    scene.add(veh1Body);

    // Vehicle 1 turret
    var turretGeom = new THREE.BoxGeometry(2.5, 2, 2.5);
    var turret1 = new THREE.Mesh(turretGeom, vehMat);
    turret1.position.set(-160, 4, -70);
    turret1.castShadow = true;
    scene.add(turret1);
    vehicles.push({ body: veh1Body, turret: turret1 });

    // Vehicle 2 body
    var veh2Body = new THREE.Mesh(veh1BodyGeom, vehMat);
    veh2Body.position.set(-200, 2, -80);
    veh2Body.castShadow = true;
    scene.add(veh2Body);

    // Vehicle 2 turret
    var turret2 = new THREE.Mesh(turretGeom, vehMat);
    turret2.position.set(-200, 4, -80);
    turret2.castShadow = true;
    scene.add(turret2);
    vehicles.push({ body: veh2Body, turret: turret2 });

    // 10. Welding sparks effect - cluster of emissive boxes
    createWeldingSparks();

    // 11. Shipyard workers as hostages - orange vest figures
    var workerMat = new THREE.MeshStandardMaterial({ color: 0xff9900 });
    var workerPositions = [
      { x: -100, y: 2, z: 10 },
      { x: -105, y: 2, z: 5 },
      { x: -95, y: 2, z: 8 }
    ];

    for (var w = 0; w < workerPositions.length; w++) {
      var wpos = workerPositions[w];
      var workerGeom = new THREE.BoxGeometry(1.2, 2.5, 0.8);
      var worker = new THREE.Mesh(workerGeom, workerMat);
      worker.position.set(wpos.x, wpos.y, wpos.z);
      worker.castShadow = true;
      scene.add(worker);
    }

    // 12. Ship propeller mock-up - large layered disc with 3 blades
    var propellerGroup = new THREE.Group();
    propellerGroup.position.set(-100, 3, -15);

    // Center hub
    var hubGeom = new THREE.BoxGeometry(2, 2, 2);
    var hubMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    var hub = new THREE.Mesh(hubGeom, hubMat);
    propellerGroup.add(hub);

    // Three blades
    for (var b = 0; b < 3; b++) {
      var bladeGeom = new THREE.BoxGeometry(12, 0.8, 3);
      var bladeMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
      var blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.z = 0;
      blade.rotation.z = (b * Math.PI * 2) / 3;
      blade.position.x = 6 * Math.cos(blade.rotation.z);
      blade.position.y = 6 * Math.sin(blade.rotation.z);
      blade.castShadow = true;
      propellerGroup.add(blade);
    }

    scene.add(propellerGroup);

    // 13. Parts storage racks - tall metal frame with cylindrical components
    var rackGroup = new THREE.Group();
    rackGroup.position.set(20, 0, -120);

    // Frame
    var frameVertGeom = new THREE.BoxGeometry(1, 20, 1);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

    var vert1 = new THREE.Mesh(frameVertGeom, frameMat);
    vert1.position.set(-8, 10, -5);
    rackGroup.add(vert1);

    var vert2 = new THREE.Mesh(frameVertGeom, frameMat);
    vert2.position.set(8, 10, -5);
    rackGroup.add(vert2);

    var vert3 = new THREE.Mesh(frameVertGeom, frameMat);
    vert3.position.set(-8, 10, 5);
    rackGroup.add(vert3);

    var vert4 = new THREE.Mesh(frameVertGeom, frameMat);
    vert4.position.set(8, 10, 5);
    rackGroup.add(vert4);

    // Shelves
    var shelfGeom = new THREE.BoxGeometry(16, 0.5, 10);
    for (var s = 0; s < 4; s++) {
      var shelf = new THREE.Mesh(shelfGeom, frameMat);
      shelf.position.y = 5 + s * 5;
      rackGroup.add(shelf);
    }

    // Component cylinders - using boxes as approximation
    var compGeom = new THREE.BoxGeometry(2, 3, 2);
    var compMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    for (var c = 0; c < 12; c++) {
      var comp = new THREE.Mesh(compGeom, compMat);
      comp.position.set((c % 4 - 1.5) * 4, 7 + Math.floor(c / 4) * 5, 0);
      comp.castShadow = true;
      rackGroup.add(comp);
    }

    scene.add(rackGroup);

    // 14. Control tower - box building with observation windows
    var towerGeom = new THREE.BoxGeometry(8, 20, 8);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-200, 10, 120);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    // Windows on tower
    var windowGeom = new THREE.BoxGeometry(2, 2, 0.5);
    var windowMat = new THREE.MeshStandardMaterial({ color: 0x333399, metalness: 0.9 });
    var windowPositions = [
      { x: -200 - 3.75, z: 120 - 3.75 },
      { x: -200 + 3.75, z: 120 - 3.75 },
      { x: -200 - 3.75, z: 120 + 3.75 },
      { x: -200 + 3.75, z: 120 + 3.75 }
    ];

    for (var wp = 0; wp < windowPositions.length; wp++) {
      var wwin = windowPositions[wp];
      var window1 = new THREE.Mesh(windowGeom, windowMat);
      window1.position.set(wwin.x, 12, wwin.z);
      scene.add(window1);
    }

    // 15. Fuel depot - 3 cylindrical tank boxes + pipes
    var tankGroup = new THREE.Group();
    tankGroup.position.set(180, 0, 100);

    var tankGeom = new THREE.BoxGeometry(6, 12, 6);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xaa4400 });

    for (var tk = 0; tk < 3; tk++) {
      var tank = new THREE.Mesh(tankGeom, tankMat);
      tank.position.x = tk * 10 - 10;
      tank.position.y = 6;
      tank.castShadow = true;
      tankGroup.add(tank);
    }

    // Connecting pipes
    var pipeGeom = new THREE.BoxGeometry(20, 2, 2);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var pipe = new THREE.Mesh(pipeGeom, pipeMat);
    pipe.position.y = 12;
    tankGroup.add(pipe);

    scene.add(tankGroup);

    // 16. Perimeter fence line - chain-link fence segments
    var fenceGroup = new THREE.Group();
    fenceGroup.position.set(0, 0, 0);

    var fenceSegGeom = new THREE.BoxGeometry(20, 4, 0.5);
    var fenceMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.4 });

    // Fence segments around perimeter
    for (var f = 0; f < 8; f++) {
      var fenceSeg = new THREE.Mesh(fenceSegGeom, fenceMat);
      var angle = (f / 8) * Math.PI * 2;
      var dist = 220;
      fenceSeg.position.x = Math.cos(angle) * dist;
      fenceSeg.position.z = Math.sin(angle) * dist;
      fenceSeg.rotation.y = angle;
      fenceSeg.receiveShadow = true;
      fenceGroup.add(fenceSeg);
    }

    // Guard booth
    var boothGeom = new THREE.BoxGeometry(6, 5, 6);
    var boothMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var booth = new THREE.Mesh(boothGeom, boothMat);
    booth.position.set(-220, 2.5, 0);
    booth.castShadow = true;
    fenceGroup.add(booth);

    scene.add(fenceGroup);

    // 17. Supply ship docked alongside - gray box hull + bridge
    var shipGroup = new THREE.Group();
    shipGroup.position.set(0, 0, -180);

    var shipHullGeom = new THREE.BoxGeometry(100, 6, 15);
    var shipMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });
    var shipHull = new THREE.Mesh(shipHullGeom, shipMat);
    shipHull.position.y = 3;
    shipHull.castShadow = true;
    shipGroup.add(shipHull);

    var bridgeGeom = new THREE.BoxGeometry(20, 12, 12);
    var bridge = new THREE.Mesh(bridgeGeom, shipMat);
    bridge.position.set(30, 9, 0);
    bridge.castShadow = true;
    shipGroup.add(bridge);

    scene.add(shipGroup);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(200, 150, 200);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -300;
    dirLight.shadow.camera.right = 300;
    dirLight.shadow.camera.top = 300;
    dirLight.shadow.camera.bottom = -300;
    scene.add(dirLight);

    // HUD overlay
    createHUD();

    // Input listeners
    document.addEventListener('keydown', function(e) {
      keyStates[e.key.toUpperCase()] = true;
      handleHUDToggle(e.key.toUpperCase());
    });

    document.addEventListener('keyup', function(e) {
      keyStates[e.key.toUpperCase()] = false;
    });
  }

  function createWeldingSparks() {
    var sparkPositions = [
      { x: -100, y: 8, z: 0 },
      { x: -110, y: 6, z: -5 },
      { x: -90, y: 7, z: 5 }
    ];

    for (var sp = 0; sp < sparkPositions.length; sp++) {
      var spos = sparkPositions[sp];
      var sparkGroup = new THREE.Group();
      sparkGroup.userData = { basePos: spos, time: Math.random() * 6.28 };

      for (var ss = 0; ss < 15; ss++) {
        var sparkGeom = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        var sparkMat = new THREE.MeshBasicMaterial({ color: 0xffff00, toneMapped: false });
        var spark = new THREE.Mesh(sparkGeom, sparkMat);
        spark.position.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        );
        sparkGroup.add(spark);
      }

      sparkGroup.position.set(spos.x, spos.y, spos.z);
      scene.add(sparkGroup);
      weldingSparks.push(sparkGroup);
    }
  }

  function createHUD() {
    if (hudDiv) {
      document.body.removeChild(hudDiv);
    }

    hudDiv = document.createElement('div');
    hudDiv.style.position = 'fixed';
    hudDiv.style.top = '20px';
    hudDiv.style.left = '20px';
    hudDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudDiv.style.color = '#00ff00';
    hudDiv.style.fontFamily = 'monospace';
    hudDiv.style.fontSize = '14px';
    hudDiv.style.padding = '10px';
    hudDiv.style.borderLeft = '3px solid #00ff00';
    hudDiv.style.zIndex = '100';
    hudDiv.style.maxWidth = '300px';

    hudDiv.innerHTML = '\n' +
      'DOCK STATUS: CONTESTED<br>\n' +
      'TERRORISTS: 6<br>\n' +
      'DESTROYER: AT RISK<br>\n' +
      '<br>\n' +
      'Navy Response: ADVANCING<br>\n' +
      'Threat Level: CRITICAL<br>\n';

    document.body.appendChild(hudDiv);
  }

  function handleHUDToggle(key) {
    hudToggleSequence.push(key);
    if (hudToggleSequence.length > 2) {
      hudToggleSequence.shift();
    }

    if (hudToggleSequence.length === 2) {
      var timeNow = performance.now();
      if (!hudToggleSequence[0].time) {
        hudToggleSequence[0] = { key: hudToggleSequence[0], time: timeNow };
        hudToggleSequence[1] = { key: hudToggleSequence[1], time: timeNow };
      } else {
        var timeDiff = timeNow - hudToggleSequence[0].time;
        if (timeDiff < 400 && hudToggleSequence[0].key === 'H' && hudToggleSequence[1].key === 'Y') {
          if (hudDiv) {
            hudDiv.style.display = hudDiv.style.display === 'none' ? 'block' : 'none';
          }
          hudToggleSequence = [];
        }
      }
    }
  }

  function update(delta) {
    // Gantry crane boom rotation
    if (gantryBoom) {
      gantryBoom.rotation.y += delta * 0.3;
      if (gantryHook) {
        gantryHook.position.y = -7.5 - Math.sin(performance.now() * 0.001) * 3;
      }
    }

    // Welding sparks animation
    for (var w = 0; w < weldingSparks.length; w++) {
      var sparkGroup = weldingSparks[w];
      sparkGroup.userData.time += delta;

      var children = sparkGroup.children;
      for (var c = 0; c < children.length; c++) {
        var spark = children[c];
        spark.position.y -= delta * 8;
        spark.position.x += (Math.random() - 0.5) * delta * 4;
        spark.position.z += (Math.random() - 0.5) * delta * 4;

        if (spark.position.y < -5) {
          spark.position.y = 2;
          spark.position.x = (Math.random() - 0.5) * 2;
          spark.position.z = (Math.random() - 0.5) * 2;
        }
      }

      var opacity = Math.abs(Math.sin(sparkGroup.userData.time * 3));
      for (var s = 0; s < children.length; s++) {
        children[s].material.opacity = opacity;
      }
    }

    // Navy team advances toward action
    for (var n = 0; n < navyTeam.length; n++) {
      navyTeam[n].position.x += delta * 5;
      navyTeam[n].userData.angle += delta * 2;
    }

    // Terrorists take defensive positions
    for (var t = 0; t < terrorizts.length; t++) {
      var angle = (t / terrorizts.length) * Math.PI * 2;
      terrorizts[t].userData.angle = angle;
      var baseX = Math.cos(angle) * 100;
      var baseZ = Math.sin(angle) * 100;
      terrorizts[t].position.x = baseX + Math.sin(performance.now() * 0.0005) * 10;
      terrorizts[t].position.z = baseZ + Math.cos(performance.now() * 0.0005) * 10;
    }

    // Vehicle turrets rotate
    for (var v = 0; v < vehicles.length; v++) {
      vehicles[v].turret.rotation.y += delta * 1.5;
    }
  }

  function reset() {
    terrorizts = [];
    navyTeam = [];
    vehicles = [];
    weldingSparks = [];
    gantryBoom = null;
    gantryHook = null;
    keyStates = {};
    hudToggleSequence = [];

    if (hudDiv && hudDiv.parentNode) {
      document.body.removeChild(hudDiv);
      hudDiv = null;
    }

    if (scene) {
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
