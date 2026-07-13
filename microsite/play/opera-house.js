window.OperaHouse = (function() {
  'use strict';

  var config = {
    hostagesTotal: 12,
    terrorsisTotal: 5
  };

  var state = {
    hostagesSecured: 0,
    terroristsDown: 0,
    commanderCaptured: false,
    keyComboPending: false,
    keyComboTimeout: null,
    hudVisible: false
  };

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var elapsedTime = 0;

  var keyState = {};

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    state.hostagesSecured = 0;
    state.terroristsDown = 0;
    state.commanderCaptured = false;
    state.hudVisible = false;
    elapsedTime = 0;
    sceneObjects = [];
    animatedObjects = [];

    createExterior();
    createAuditorium();
    createStage();
    createOrchestraPit();
    createChandelier();
    createStageCurtain();
    createProsceniumArch();
    createBackstageArea();
    createFlyTower();
    createCatwalkGantry();
    createDressingRoom();
    createCostumeRack();
    createPropStorage();
    createControlBooth();
    createEmergencyExit();
    createEnemies();
    createAtmosphere();

    attachKeyListeners();
  }

  function createExterior() {
    var geometry = new THREE.BoxGeometry(40, 35, 15);
    var material = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
    var exterior = new THREE.Mesh(geometry, material);
    exterior.position.set(0, 0, -30);
    exterior.receiveShadow = true;
    scene.add(exterior);
    sceneObjects.push(exterior);

    var columnGeometry = new THREE.CylinderGeometry(2, 2, 35, 16);
    var columnMaterial = new THREE.MeshStandardMaterial({ color: 0xdaa520 });
    var columns = [
      { x: -15, z: -30 },
      { x: -5, z: -30 },
      { x: 5, z: -30 },
      { x: 15, z: -30 }
    ];

    columns.forEach(function(pos) {
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pos.x, 0, pos.z);
      column.receiveShadow = true;
      scene.add(column);
      sceneObjects.push(column);
    });
  }

  function createAuditorium() {
    var geometry = new THREE.BoxGeometry(35, 25, 50);
    var material = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x220000 });
    var auditorium = new THREE.Mesh(geometry, material);
    auditorium.position.set(0, 0, 0);
    auditorium.receiveShadow = true;
    scene.add(auditorium);
    sceneObjects.push(auditorium);

    var seatMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (var row = 0; row < 6; row++) {
      for (var seat = 0; seat < 3; seat++) {
        var seatGeometry = new THREE.BoxGeometry(1.2, 1, 1);
        var seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
        seatMesh.position.set(-5 + seat * 3, 5 + row * 2, 15);
        seatMesh.userData.isHostage = true;
        scene.add(seatMesh);
        sceneObjects.push(seatMesh);
      }
    }
  }

  function createStage() {
    var geometry = new THREE.BoxGeometry(30, 2, 12);
    var material = new THREE.MeshStandardMaterial({ color: 0x8b4513, emissive: 0x4a2511 });
    var stage = new THREE.Mesh(geometry, material);
    stage.position.set(0, 13, 20);
    stage.receiveShadow = true;
    scene.add(stage);
    sceneObjects.push(stage);
  }

  function createOrchestraPit() {
    var geometry = new THREE.BoxGeometry(35, 3, 10);
    var material = new THREE.MeshStandardMaterial({ color: 0x2f4f4f });
    var pit = new THREE.Mesh(geometry, material);
    pit.position.set(0, -5, 5);
    pit.receiveShadow = true;
    scene.add(pit);
    sceneObjects.push(pit);
  }

  function createChandelier() {
    var groupGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00 });

    var chandelier = new THREE.Group();
    chandelier.userData.isChandelier = true;
    chandelier.position.set(0, 20, 0);

    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var x = Math.cos(angle) * 4;
      var z = Math.sin(angle) * 4;

      var sphere = new THREE.Mesh(groupGeometry, sphereMaterial);
      sphere.position.set(x, -2, z);
      chandelier.add(sphere);

      var stemGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
      var stemMaterial = new THREE.MeshStandardMaterial({ color: 0xb8860b });
      var stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(x, 0.5, z);
      chandelier.add(stem);
    }

    var centerGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var centerSphere = new THREE.Mesh(centerGeometry, sphereMaterial);
    centerSphere.position.set(0, -4, 0);
    chandelier.add(centerSphere);

    scene.add(chandelier);
    sceneObjects.push(chandelier);
    animatedObjects.push({ obj: chandelier, type: 'chandelier' });
  }

  function createStageCurtain() {
    var geometry = new THREE.BoxGeometry(28, 15, 0.5);
    var material = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      emissive: 0x660000
    });
    var curtain = new THREE.Mesh(geometry, material);
    curtain.position.set(0, 12, 18);
    curtain.userData.isCurtain = true;
    scene.add(curtain);
    sceneObjects.push(curtain);
    animatedObjects.push({ obj: curtain, type: 'curtain' });
  }

  function createProsceniumArch() {
    var frameLeft = new THREE.BoxGeometry(2, 18, 1);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0xdaa520 });
    var archLeft = new THREE.Mesh(frameLeft, frameMaterial);
    archLeft.position.set(-15, 12, 18);
    scene.add(archLeft);
    sceneObjects.push(archLeft);

    var frameRight = new THREE.BoxGeometry(2, 18, 1);
    var archRight = new THREE.Mesh(frameRight, frameMaterial);
    archRight.position.set(15, 12, 18);
    scene.add(archRight);
    sceneObjects.push(archRight);

    var frameTop = new THREE.BoxGeometry(30, 2, 1);
    var archTop = new THREE.Mesh(frameTop, frameMaterial);
    archTop.position.set(0, 21, 18);
    scene.add(archTop);
    sceneObjects.push(archTop);
  }

  function createBackstageArea() {
    var roomGeometry = new THREE.BoxGeometry(25, 12, 20);
    var roomMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var backstage = new THREE.Mesh(roomGeometry, roomMaterial);
    backstage.position.set(0, 0, 35);
    scene.add(backstage);
    sceneObjects.push(backstage);

    var pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
    for (var i = 0; i < 4; i++) {
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(-8 + i * 5, 5, 35);
      pipe.rotation.z = Math.PI / 2;
      scene.add(pipe);
      sceneObjects.push(pipe);
    }
  }

  function createFlyTower() {
    var geometry = new THREE.BoxGeometry(32, 30, 8);
    var material = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var flyTower = new THREE.Mesh(geometry, material);
    flyTower.position.set(0, 20, 20);
    flyTower.userData.isFlyTower = true;
    scene.add(flyTower);
    sceneObjects.push(flyTower);
    animatedObjects.push({ obj: flyTower, type: 'flyTower' });
  }

  function createCatwalkGantry() {
    var walkGeometry = new THREE.BoxGeometry(32, 0.8, 3);
    var walkMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var catwalk = new THREE.Mesh(walkGeometry, walkMaterial);
    catwalk.position.set(0, 24, 0);
    catwalk.userData.isCatwalk = true;
    scene.add(catwalk);
    sceneObjects.push(catwalk);
    animatedObjects.push({ obj: catwalk, type: 'catwalk' });

    var railingGeometry = new THREE.BufferGeometry();
    var railPoints = [];
    for (var i = 0; i <= 32; i += 4) {
      railPoints.push(new THREE.Vector3(-16 + i, 25, -1.5));
      railPoints.push(new THREE.Vector3(-16 + i, 25, 1.5));
    }
    railingGeometry.setFromPoints(railPoints);
    var railingMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var railing = new THREE.LineSegments(railingGeometry, railingMaterial);
    scene.add(railing);
    sceneObjects.push(railing);
  }

  function createDressingRoom() {
    var roomGeometry = new THREE.BoxGeometry(12, 10, 12);
    var roomMaterial = new THREE.MeshStandardMaterial({ color: 0x9d7d4f });
    var room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.set(20, 0, 25);
    scene.add(room);
    sceneObjects.push(room);

    var mirrorGeometry = new THREE.BoxGeometry(6, 8, 0.2);
    var mirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0xb0c4de,
      metalness: 0.9,
      roughness: 0.1
    });
    var mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    mirror.position.set(20, 2, 31);
    scene.add(mirror);
    sceneObjects.push(mirror);
  }

  function createCostumeRack() {
    var rodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var rodMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.position.set(-20, 3, 30);
    rod.rotation.z = Math.PI / 2;
    scene.add(rod);
    sceneObjects.push(rod);

    var clothGeometry = new THREE.BoxGeometry(0.5, 5, 8);
    var clothMaterial = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
    var cloth = new THREE.Mesh(clothGeometry, clothMaterial);
    cloth.position.set(-20, 6, 30);
    scene.add(cloth);
    sceneObjects.push(cloth);
  }

  function createPropStorage() {
    for (var i = 0; i < 5; i++) {
      var propGeometry = new THREE.BoxGeometry(4, 4, 4);
      var propMaterial = new THREE.MeshStandardMaterial({ color: 0xa0522d });
      var prop = new THREE.Mesh(propGeometry, propMaterial);
      prop.position.set(-15 + i * 5, 2 + (i % 2) * 4, 40);
      scene.add(prop);
      sceneObjects.push(prop);
    }
  }

  function createControlBooth() {
    var boothGeometry = new THREE.BoxGeometry(8, 6, 6);
    var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(0, 15, -22);
    scene.add(booth);
    sceneObjects.push(booth);

    var screenGeometry = new THREE.BoxGeometry(5, 3, 0.3);
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00aa00 });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 16, -19);
    screen.userData.isMonitor = true;
    scene.add(screen);
    sceneObjects.push(screen);
    animatedObjects.push({ obj: screen, type: 'monitor' });
  }

  function createEmergencyExit() {
    var signGeometry = new THREE.BoxGeometry(4, 2, 0.3);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    });
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(-16, 18, 30);
    scene.add(sign);
    sceneObjects.push(sign);
  }

  function createEnemies() {
    var terroristGeometry = new THREE.BoxGeometry(0.8, 2.2, 0.6);
    var terroristMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    for (var i = 0; i < 5; i++) {
      var terrorist = new THREE.Mesh(terroristGeometry, terroristMaterial);
      terrorist.position.set(-10 + i * 5, 0, 20 + Math.random() * 10);
      terrorist.userData.isEnemy = true;
      terrorist.userData.isCommander = (i === 2);
      scene.add(terrorist);
      sceneObjects.push(terrorist);
    }
  }

  function createAtmosphere() {
    var fogColor = 0x4a3a2a;
    scene.fog = new THREE.Fog(fogColor, 100, 200);
    scene.background = new THREE.Color(0x1a1a2e);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xffd700, 0.8, 50);
    pointLight.position.set(0, 22, 0);
    scene.add(pointLight);

    var spotLight = new THREE.SpotLight(0xffffff, 1, 60, Math.PI / 4, 0.5, 2);
    spotLight.position.set(0, 20, 10);
    spotLight.target.position.set(0, 12, 20);
    spotLight.userData.isStageLight = true;
    scene.add(spotLight);
    scene.add(spotLight.target);
    animatedObjects.push({ obj: spotLight, type: 'spotlight' });
  }

  function attachKeyListeners() {
    document.addEventListener('keydown', function(e) {
      keyState[e.key.toUpperCase()] = true;

      if (e.key.toUpperCase() === 'O') {
        if (state.keyComboPending) {
          clearTimeout(state.keyComboTimeout);
          state.keyComboPending = false;
        } else {
          state.keyComboPending = true;
          state.keyComboTimeout = setTimeout(function() {
            state.keyComboPending = false;
          }, 400);
        }
      }

      if (state.keyComboPending && e.key.toUpperCase() === 'H') {
        clearTimeout(state.keyComboTimeout);
        state.keyComboPending = false;
        state.hudVisible = !state.hudVisible;
        updateHUD();
      }
    });

    document.addEventListener('keyup', function(e) {
      keyState[e.key.toUpperCase()] = false;
    });
  }

  function updateHUD() {
    var hudElement = document.getElementById('opera-house-hud');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'opera-house-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#ffd700';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
      hudElement.style.pointerEvents = 'none';
      hudElement.style.zIndex = '1000';
      document.body.appendChild(hudElement);
    }

    if (state.hudVisible) {
      hudElement.innerHTML = 'HOSTAGES SECURED: ' + state.hostagesSecured + '/12<br>' +
        'TERRORISTS DOWN: ' + state.terroristsDown + '<br>' +
        'COMMANDER CAPTURED: ' + (state.commanderCaptured ? 'YES' : 'NO');
      hudElement.style.display = 'block';
    } else {
      hudElement.style.display = 'none';
    }
  }

  function update(delta) {
    elapsedTime += delta;

    animatedObjects.forEach(function(anim) {
      if (anim.type === 'chandelier') {
        anim.obj.rotation.z = Math.sin(elapsedTime * 0.5) * 0.3;
        anim.obj.rotation.x = Math.cos(elapsedTime * 0.4) * 0.2;
      } else if (anim.type === 'curtain') {
        anim.obj.position.y = 12 + Math.sin(elapsedTime * 0.8) * 0.4;
      } else if (anim.type === 'flyTower') {
        anim.obj.rotation.y = Math.sin(elapsedTime * 0.3) * 0.1;
      } else if (anim.type === 'catwalk') {
        anim.obj.position.y = 24 + Math.sin(elapsedTime * 1.2) * 0.15;
      } else if (anim.type === 'monitor') {
        if (Math.random() > 0.9) {
          anim.obj.material.emissive.setHex(Math.random() > 0.5 ? 0x00aa00 : 0x002200);
        }
      } else if (anim.type === 'spotlight') {
        anim.obj.angle = Math.PI / 4 + Math.sin(elapsedTime * 0.6) * 0.3;
      }
    });
  }

  function reset() {
    sceneObjects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });
    sceneObjects = [];
    animatedObjects = [];
    state.hostagesSecured = 0;
    state.terroristsDown = 0;
    state.commanderCaptured = false;
    state.hudVisible = false;
    elapsedTime = 0;

    var hudElement = document.getElementById('opera-house-hud');
    if (hudElement) {
      hudElement.remove();
    }

    if (scene) {
      init(scene, camera);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
