window.WarCathedral = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene = null;
  var camera = null;
  var renderer = null;
  var structures = [];
  var lights = [];
  var dynamicObjects = [];
  var time = 0;
  var shellCraters = [];
  var organSmoke = [];

  function init(canvasElement) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer */

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 150, 200);

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(20, 8, 20);
    camera.lookAt(40, 15, 40);

    renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    buildStructures();
    buildLighting();
    createDynamicElements();

    window.addEventListener('resize', onWindowResize);

    return {
      scene: scene,
      camera: camera,
      renderer: renderer
    };
  }

  function buildStructures() {
    var stoneColor = 0x4a4a5a;
    var brickColor = 0x6b3d2d;
    var metalColor = 0x555555;

    addFoundation();
    addCrypt();
    addNave();
    addLeftSpire();
    addRightSpire();
    addFlyingButtresses();
    addRoseWindow();
    addOrganPipes();
    addAltarApseis();
    addMilitaryFieldHospital();
    addCommandPost();
    addArtilleryShells();
    addShatteredFloor();
    addAmmoCache();
    addSnowOverlay();
  }

  function addFoundation() {
    var foundationGeo = new THREE.BoxGeometry(85, 2, 85);
    var foundationMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a });
    var foundation = new THREE.Mesh(foundationGeo, foundationMat);
    foundation.position.set(40, -2, 40);
    foundation.receiveShadow = true;
    scene.add(foundation);
    structures.push(foundation);
  }

  function addCrypt() {
    var cryptWallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(70, 6, 3),
      new THREE.MeshStandardMaterial({ color: 0x3a3a4a })
    );
    cryptWallNorth.position.set(40, 0, 8);
    cryptWallNorth.castShadow = true;
    cryptWallNorth.receiveShadow = true;
    scene.add(cryptWallNorth);
    structures.push(cryptWallNorth);

    var cryptWallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(70, 6, 3),
      new THREE.MeshStandardMaterial({ color: 0x3a3a4a })
    );
    cryptWallSouth.position.set(40, 0, 72);
    cryptWallSouth.castShadow = true;
    cryptWallSouth.receiveShadow = true;
    scene.add(cryptWallSouth);
    structures.push(cryptWallSouth);

    var pillars = [
      [20, 5],
      [35, 5],
      [50, 5],
      [65, 5],
      [20, 75],
      [35, 75],
      [50, 75],
      [65, 75]
    ];

    var i;
    for (i = 0; i < pillars.length; i++) {
      var pillarGeo = new THREE.CylinderGeometry(1.5, 1.8, 6, 8);
      var pillarMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pillars[i][0], 3, pillars[i][1]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      structures.push(pillar);
    }
  }

  function addNave() {
    var naveFloor = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.5, 60),
      new THREE.MeshStandardMaterial({ color: 0x5a3a2a })
    );
    naveFloor.position.set(40, 6.2, 40);
    naveFloor.receiveShadow = true;
    scene.add(naveFloor);
    structures.push(naveFloor);

    var naveWalls = 4;
    var wallWidth = 50;
    var wallHeight = 25;

    var naveWallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, wallHeight, 2),
      new THREE.MeshStandardMaterial({ color: 0x6b4423 })
    );
    naveWallNorth.position.set(40, 6 + wallHeight / 2, 10);
    naveWallNorth.castShadow = true;
    naveWallNorth.receiveShadow = true;
    scene.add(naveWallNorth);
    structures.push(naveWallNorth);

    var naveWallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(wallWidth, wallHeight, 2),
      new THREE.MeshStandardMaterial({ color: 0x6b4423 })
    );
    naveWallSouth.position.set(40, 6 + wallHeight / 2, 70);
    naveWallSouth.castShadow = true;
    naveWallSouth.receiveShadow = true;
    scene.add(naveWallSouth);
    structures.push(naveWallSouth);

    var naveWallWest = new THREE.Mesh(
      new THREE.BoxGeometry(2, wallHeight, 60),
      new THREE.MeshStandardMaterial({ color: 0x6b4423 })
    );
    naveWallWest.position.set(15, 6 + wallHeight / 2, 40);
    naveWallWest.castShadow = true;
    naveWallWest.receiveShadow = true;
    scene.add(naveWallWest);
    structures.push(naveWallWest);

    var naveWallEast = new THREE.Mesh(
      new THREE.BoxGeometry(2, wallHeight, 60),
      new THREE.MeshStandardMaterial({ color: 0x6b4423 })
    );
    naveWallEast.position.set(65, 6 + wallHeight / 2, 40);
    naveWallEast.castShadow = true;
    naveWallEast.receiveShadow = true;
    scene.add(naveWallEast);
    structures.push(naveWallEast);
  }

  function addLeftSpire() {
    var spireBaseGeo = new THREE.CylinderGeometry(4, 5, 8, 12);
    var spireMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a });
    var spireBase = new THREE.Mesh(spireBaseGeo, spireMat);
    spireBase.position.set(20, 14, 20);
    spireBase.castShadow = true;
    spireBase.receiveShadow = true;
    scene.add(spireBase);
    structures.push(spireBase);

    var spireTowerGeo = new THREE.CylinderGeometry(3.5, 4, 30, 12);
    var spireTower = new THREE.Mesh(spireTowerGeo, spireMat);
    spireTower.position.set(20, 14 + 15, 20);
    spireTower.castShadow = true;
    spireTower.receiveShadow = true;
    scene.add(spireTower);
    structures.push(spireTower);

    var spireTipGeo = new THREE.ConeGeometry(3, 8, 12);
    var spireTip = new THREE.Mesh(spireTipGeo, spireMat);
    spireTip.position.set(20, 14 + 30 + 4, 20);
    spireTip.castShadow = true;
    spireTip.receiveShadow = true;
    scene.add(spireTip);
    structures.push(spireTip);

    var aaGun1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    aaGun1.position.set(20, 30, 20);
    aaGun1.rotation.z = Math.PI / 6;
    aaGun1.castShadow = true;
    scene.add(aaGun1);
    structures.push(aaGun1);
    dynamicObjects.push({ mesh: aaGun1, type: 'aagun' });
  }

  function addRightSpire() {
    var spireBaseGeo = new THREE.CylinderGeometry(4, 5, 8, 12);
    var spireMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a });
    var spireBase = new THREE.Mesh(spireBaseGeo, spireMat);
    spireBase.position.set(60, 14, 20);
    spireBase.castShadow = true;
    spireBase.receiveShadow = true;
    scene.add(spireBase);
    structures.push(spireBase);

    var spireTowerGeo = new THREE.CylinderGeometry(3.5, 4, 30, 12);
    var spireTower = new THREE.Mesh(spireTowerGeo, spireMat);
    spireTower.position.set(60, 14 + 15, 20);
    spireTower.castShadow = true;
    spireTower.receiveShadow = true;
    scene.add(spireTower);
    structures.push(spireTower);

    var spireTipGeo = new THREE.ConeGeometry(3, 8, 12);
    var spireTip = new THREE.Mesh(spireTipGeo, spireMat);
    spireTip.position.set(60, 14 + 30 + 4, 20);
    spireTip.castShadow = true;
    spireTip.receiveShadow = true;
    scene.add(spireTip);
    structures.push(spireTip);

    var aaGun2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    aaGun2.position.set(60, 30, 20);
    aaGun2.rotation.z = -Math.PI / 6;
    aaGun2.castShadow = true;
    scene.add(aaGun2);
    structures.push(aaGun2);
    dynamicObjects.push({ mesh: aaGun2, type: 'aagun' });
  }

  function addFlyingButtresses() {
    var buttressPositions = [
      { x: 15, z: 15 },
      { x: 15, z: 65 },
      { x: 65, z: 15 },
      { x: 65, z: 65 }
    ];

    var i;
    for (i = 0; i < buttressPositions.length; i++) {
      var pos = buttressPositions[i];
      var arch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 18, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a4a5a })
      );
      arch.position.set(pos.x, 16, pos.z);
      arch.rotation.z = Math.PI / 4;
      arch.castShadow = true;
      arch.receiveShadow = true;
      scene.add(arch);
      structures.push(arch);

      var platform = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 4),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      platform.position.set(pos.x, 22, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      structures.push(platform);
    }
  }

  function addRoseWindow() {
    var windowCenterX = 40;
    var windowCenterZ = 10.5;
    var windowY = 25;

    var frameGeo = new THREE.CylinderGeometry(6, 6, 0.5, 12);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(windowCenterX, windowY, windowCenterZ);
    frame.rotation.x = Math.PI / 2;
    frame.castShadow = true;
    scene.add(frame);
    structures.push(frame);

    var glassColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff];
    var j;
    for (j = 0; j < 5; j++) {
      var glassGeo = new THREE.BoxGeometry(2, 2, 0.1);
      var glassMat = new THREE.MeshStandardMaterial({
        color: glassColors[j],
        emissive: glassColors[j],
        emissiveIntensity: 0.4
      });
      var glassPiece = new THREE.Mesh(glassGeo, glassMat);
      var angle = (j / 5) * Math.PI * 2;
      glassPiece.position.set(
        windowCenterX + Math.cos(angle) * 3.5,
        windowY,
        windowCenterZ + Math.sin(angle) * 3.5
      );
      scene.add(glassPiece);
      structures.push(glassPiece);
    }

    var shellHole = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    shellHole.position.set(windowCenterX + 2, windowY + 1.5, windowCenterZ);
    scene.add(shellHole);
    structures.push(shellHole);
  }

  function addOrganPipes() {
    var pipePositions = [
      { x: 35, z: 65 },
      { x: 40, z: 65 },
      { x: 45, z: 65 },
      { x: 32, z: 65 },
      { x: 48, z: 65 }
    ];

    var i;
    for (i = 0; i < pipePositions.length; i++) {
      var pos = pipePositions[i];
      var pipeGeo = new THREE.CylinderGeometry(0.35, 0.4, 16, 6);
      var pipeMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
      var pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(pos.x, 14.5, pos.z);
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      structures.push(pipe);
      dynamicObjects.push({ mesh: pipe, type: 'organpipe' });

      var organSmokePuff = {
        mesh: new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 4, 4),
          new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.3
          })
        ),
        pipeX: pos.x,
        pipeZ: pos.z,
        age: 0,
        life: 60
      };
      organSmokePuff.mesh.position.set(pos.x, 14.5, pos.z);
      scene.add(organSmokePuff.mesh);
      organSmoke.push(organSmokePuff);
    }
  }

  function addAltarApseis() {
    var apsisGeo = new THREE.CylinderGeometry(8, 10, 20, 12);
    var apsisMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 });
    var apsis = new THREE.Mesh(apsisGeo, apsisMat);
    apsis.position.set(40, 16, 72);
    apsis.castShadow = true;
    apsis.receiveShadow = true;
    scene.add(apsis);
    structures.push(apsis);

    var altar = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a })
    );
    altar.position.set(40, 16.5, 74);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    structures.push(altar);
  }

  function addMilitaryFieldHospital() {
    var hospitalCornerX = 8;
    var hospitalCornerZ = 50;

    var hospitalTent = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    hospitalTent.position.set(hospitalCornerX, 9.5, hospitalCornerZ);
    hospitalTent.castShadow = true;
    hospitalTent.receiveShadow = true;
    scene.add(hospitalTent);
    structures.push(hospitalTent);

    var hospitalSign = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    hospitalSign.position.set(hospitalCornerX + 7, 11, hospitalCornerZ);
    hospitalSign.castShadow = true;
    scene.add(hospitalSign);
    structures.push(hospitalSign);
  }

  function addCommandPost() {
    var commandPostX = 72;
    var commandPostZ = 50;

    var commandTower = new THREE.Mesh(
      new THREE.BoxGeometry(8, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    commandTower.position.set(commandPostX, 12, commandPostZ);
    commandTower.castShadow = true;
    commandTower.receiveShadow = true;
    scene.add(commandTower);
    structures.push(commandTower);

    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 8, 4),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    antenna.position.set(commandPostX, 18, commandPostZ);
    antenna.castShadow = true;
    scene.add(antenna);
    structures.push(antenna);
    dynamicObjects.push({ mesh: antenna, type: 'antenna' });
  }

  function addArtilleryShells() {
    var shellPositions = [
      { x: 25, z: 30, rotation: 0.2 },
      { x: 55, z: 35, rotation: 0.5 },
      { x: 35, z: 55, rotation: 1.0 }
    ];

    var i;
    for (i = 0; i < shellPositions.length; i++) {
      var pos = shellPositions[i];
      var shellGeo = new THREE.CylinderGeometry(0.8, 1, 4, 8);
      var shellMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
      var shell = new THREE.Mesh(shellGeo, shellMat);
      shell.position.set(pos.x, 6.5, pos.z);
      shell.rotation.z = pos.rotation;
      shell.castShadow = true;
      shell.receiveShadow = true;
      scene.add(shell);
      structures.push(shell);
    }
  }

  function addShatteredFloor() {
    var craterCount = 6;
    var i;
    for (i = 0; i < craterCount; i++) {
      var craterX = 20 + Math.random() * 40;
      var craterZ = 15 + Math.random() * 50;
      var craterGeo = new THREE.SphereGeometry(2 + Math.random() * 1.5, 6, 6);
      var craterMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      var crater = new THREE.Mesh(craterGeo, craterMat);
      crater.position.set(craterX, 6.2, craterZ);
      crater.scale.y = 0.3;
      crater.castShadow = true;
      crater.receiveShadow = true;
      scene.add(crater);
      structures.push(crater);
      shellCraters.push(crater);
    }
  }

  function addAmmoCache() {
    var ammoCacheX = 10;
    var ammoCacheZ = 10;

    var ammoBox1 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x3a3a2a })
    );
    ammoBox1.position.set(ammoCacheX, 4.5, ammoCacheZ);
    ammoBox1.castShadow = true;
    ammoBox1.receiveShadow = true;
    scene.add(ammoBox1);
    structures.push(ammoBox1);

    var ammoBox2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a3a2a })
    );
    ammoBox2.position.set(ammoCacheX + 6, 4.5, ammoCacheZ);
    ammoBox2.castShadow = true;
    ammoBox2.receiveShadow = true;
    scene.add(ammoBox2);
    structures.push(ammoBox2);

    var ammoBox3 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x3a3a2a })
    );
    ammoBox3.position.set(ammoCacheX, 5.5, ammoCacheZ + 6);
    ammoBox3.castShadow = true;
    ammoBox3.receiveShadow = true;
    scene.add(ammoBox3);
    structures.push(ammoBox3);
  }

  function addSnowOverlay() {
    var snowParticleCount = 200;
    var geometry = new THREE.BufferGeometry();
    var positions = [];

    var i;
    for (i = 0; i < snowParticleCount; i++) {
      positions.push(
        Math.random() * 80,
        Math.random() * 50,
        Math.random() * 80
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(positions),
      3
    ));

    var material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.6
    });

    var snow = new THREE.Points(geometry, material);
    scene.add(snow);
    dynamicObjects.push({ mesh: snow, type: 'snow' });
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffddcc, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.left = -80;
    directionalLight.shadow.camera.right = 80;
    directionalLight.shadow.camera.top = 80;
    directionalLight.shadow.camera.bottom = -80;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 200;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var spotlightLeft = new THREE.SpotLight(0xffff88, 1, 80, Math.PI / 4, 0.5, 1);
    spotlightLeft.position.set(20, 35, 20);
    spotlightLeft.target.position.set(20, 10, 20);
    spotlightLeft.castShadow = true;
    scene.add(spotlightLeft);
    scene.add(spotlightLeft.target);
    lights.push(spotlightLeft);
    dynamicObjects.push({ mesh: spotlightLeft, type: 'spirespot' });

    var spotlightRight = new THREE.SpotLight(0x88ffff, 1, 80, Math.PI / 4, 0.5, 1);
    spotlightRight.position.set(60, 35, 20);
    spotlightRight.target.position.set(60, 10, 20);
    spotlightRight.castShadow = true;
    scene.add(spotlightRight);
    scene.add(spotlightRight.target);
    lights.push(spotlightRight);
    dynamicObjects.push({ mesh: spotlightRight, type: 'spirespot' });

    var roseWindowLight = new THREE.PointLight(0xff6666, 0.6, 50);
    roseWindowLight.position.set(40, 25, 12);
    scene.add(roseWindowLight);
    lights.push(roseWindowLight);
    dynamicObjects.push({ mesh: roseWindowLight, type: 'shellblast' });
  }

  function createDynamicElements() {
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      if (dynamicObjects[i].type === 'spirespot') {
        dynamicObjects[i].rotation = 0;
        dynamicObjects[i].speed = 0.02;
      }
      if (dynamicObjects[i].type === 'shellblast') {
        dynamicObjects[i].intensity = 0.6;
        dynamicObjects[i].flicker = 0;
      }
      if (dynamicObjects[i].type === 'aagun') {
        dynamicObjects[i].angle = 0;
      }
      if (dynamicObjects[i].type === 'antenna') {
        dynamicObjects[i].sway = 0;
      }
      if (dynamicObjects[i].type === 'organpipe') {
        dynamicObjects[i].vibration = 0;
      }
      if (dynamicObjects[i].type === 'snow') {
        dynamicObjects[i].offset = 0;
      }
    }
  }

  function update() {
    time += 1;

    updateSpotlights();
    updateShellBlast();
    updateAA();
    updateAntenna();
    updateOrganPipes();
    updateSnow();
    updateOrganSmoke();
  }

  function updateSpotlights() {
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      var obj = dynamicObjects[i];
      if (obj.type === 'spirespot') {
        obj.rotation += obj.speed;
        obj.mesh.angle = obj.rotation;
        var angle = obj.rotation;
        if (obj.mesh.position.x < 40) {
          obj.mesh.target.position.set(
            20 + Math.cos(angle) * 15,
            10,
            20 + Math.sin(angle) * 15
          );
        } else {
          obj.mesh.target.position.set(
            60 + Math.cos(angle) * 15,
            10,
            20 + Math.sin(angle) * 15
          );
        }
      }
    }
  }

  function updateShellBlast() {
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      var obj = dynamicObjects[i];
      if (obj.type === 'shellblast') {
        obj.flicker = Math.sin(time * 0.1) * 0.3 + 0.6;
        obj.mesh.intensity = obj.intensity * obj.flicker;
      }
    }
  }

  function updateAA() {
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      var obj = dynamicObjects[i];
      if (obj.type === 'aagun') {
        obj.angle += 0.01;
        obj.mesh.rotation.y = obj.angle;
      }
    }
  }

  function updateAntenna() {
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      var obj = dynamicObjects[i];
      if (obj.type === 'antenna') {
        obj.sway = Math.sin(time * 0.05) * 0.15;
        obj.mesh.rotation.z = obj.sway;
      }
    }
  }

  function updateOrganPipes() {
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      var obj = dynamicObjects[i];
      if (obj.type === 'organpipe') {
        obj.vibration = Math.sin(time * 0.15) * 0.05;
        obj.mesh.position.x += obj.vibration;
      }
    }
  }

  function updateSnow() {
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      var obj = dynamicObjects[i];
      if (obj.type === 'snow') {
        obj.offset += 0.05;
        var positions = obj.mesh.geometry.attributes.position.array;
        var j;
        for (j = 0; j < positions.length; j += 3) {
          positions[j + 1] -= 0.2;
          if (positions[j + 1] < 0) {
            positions[j + 1] = 50;
          }
        }
        obj.mesh.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  function updateOrganSmoke() {
    var i;
    for (i = organSmoke.length - 1; i >= 0; i--) {
      var puff = organSmoke[i];
      puff.age += 1;

      puff.mesh.position.y += 0.15;
      puff.mesh.position.x += Math.sin(puff.age * 0.1) * 0.05;
      puff.mesh.position.z += Math.cos(puff.age * 0.1) * 0.05;

      puff.mesh.scale.x += 0.01;
      puff.mesh.scale.y += 0.01;
      puff.mesh.scale.z += 0.01;

      puff.mesh.material.opacity = (1 - (puff.age / puff.life)) * 0.3;

      if (puff.age >= puff.life) {
        scene.remove(puff.mesh);
        organSmoke.splice(i, 1);

        var newPuff = {
          mesh: new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 4, 4),
            new THREE.MeshStandardMaterial({
              color: 0xaaaaaa,
              transparent: true,
              opacity: 0.3
            })
          ),
          pipeX: puff.pipeX,
          pipeZ: puff.pipeZ,
          age: 0,
          life: 60
        };
        newPuff.mesh.position.set(puff.pipeX, 14.5, puff.pipeZ);
        scene.add(newPuff.mesh);
        organSmoke.push(newPuff);
      }
    }
  }

  function reset() {
    time = 0;
    var i;
    for (i = 0; i < dynamicObjects.length; i++) {
      if (dynamicObjects[i].type === 'spirespot') {
        dynamicObjects[i].rotation = 0;
      }
      if (dynamicObjects[i].type === 'shellblast') {
        dynamicObjects[i].flicker = 0;
      }
      if (dynamicObjects[i].type === 'aagun') {
        dynamicObjects[i].angle = 0;
      }
      if (dynamicObjects[i].type === 'antenna') {
        dynamicObjects[i].sway = 0;
      }
      if (dynamicObjects[i].type === 'organpipe') {
        dynamicObjects[i].vibration = 0;
      }
    }
  }

  function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
