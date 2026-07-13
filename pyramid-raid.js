window.PyramidRaid = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var materials = [];
  var lights = [];
  var animations = {};
  var hudElement = null;
  var isHPressed = false;
  var hPressTime = 0;
  var artifactsRecovered = 0;
  var trapsTriggered = 0;
  var guardsAlerted = false;

  function createMaterial(color, emissive, emissiveIntensity) {
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0,
      metalness: 0.2,
      roughness: 0.8
    });
    materials.push(mat);
    return mat;
  }

  function addMesh(geometry, material, position, scale, rotation) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) {
      mesh.position.set(position.x, position.y, position.z);
    }
    if (scale) {
      mesh.scale.set(scale.x, scale.y, scale.z);
    }
    if (rotation) {
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createDesertGround() {
    var geometry = new THREE.BoxGeometry(400, 0.3, 400);
    var material = createMaterial(0xc2a050);
    var ground = addMesh(geometry, material, { x: 0, y: -1, z: 0 });
    animations.ground = { mesh: ground };
  }

  function createMainPyramid() {
    var baseGeometry = new THREE.BoxGeometry(40, 8, 40);
    var baseMaterial = createMaterial(0xd4b483);
    var base = addMesh(baseGeometry, baseMaterial, { x: 0, y: 4, z: 0 });

    var midGeometry = new THREE.BoxGeometry(28, 8, 28);
    var midMaterial = createMaterial(0xd9b896);
    var mid = addMesh(midGeometry, midMaterial, { x: 0, y: 12, z: 0 });

    var topGeometry = new THREE.BoxGeometry(16, 8, 16);
    var topMaterial = createMaterial(0xdcc5a4);
    var top = addMesh(topGeometry, topMaterial, { x: 0, y: 20, z: 0 });

    animations.pyramid = { base: base, mid: mid, top: top };
  }

  function createPyramidEntrance() {
    var leftPillarGeometry = new THREE.BoxGeometry(1.5, 5, 1.5);
    var pillarMaterial = createMaterial(0x8b8680);
    var leftPillar = addMesh(leftPillarGeometry, pillarMaterial, { x: -2.5, y: 2.5, z: -18 });

    var rightPillarGeometry = new THREE.BoxGeometry(1.5, 5, 1.5);
    var rightPillar = addMesh(rightPillarGeometry, pillarMaterial, { x: 2.5, y: 2.5, z: -18 });

    animations.entrance = { leftPillar: leftPillar, rightPillar: rightPillar };
  }

  function createSphinxes() {
    var sphinxes = [];

    var positions = [
      { x: 25, z: 25 },
      { x: -25, z: 25 },
      { x: -25, z: -25 },
      { x: 25, z: -25 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var bodyGeometry = new THREE.BoxGeometry(4, 2, 8);
      var bodyMaterial = createMaterial(0xd4a574);
      var body = addMesh(bodyGeometry, bodyMaterial, { x: pos.x, y: 1, z: pos.z });

      var headGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      var headMaterial = createMaterial(0xd9b075);
      var head = addMesh(headGeometry, headMaterial, { x: pos.x, y: 3, z: pos.z + 3 });

      var neckGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 8);
      var neckMaterial = createMaterial(0xd4a574);
      var neck = addMesh(neckGeometry, neckMaterial, { x: pos.x, y: 2.5, z: pos.z + 2 });

      sphinxes.push({ body: body, head: head, neck: neck });
    }

    animations.sphinxes = sphinxes;
  }

  function createTombRaiders() {
    var raiders = [];

    for (var i = 0; i < 5; i++) {
      var posX = -15 + i * 6;
      var posZ = -25 + i * 3;

      var bodyGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.8);
      var bodyMaterial = createMaterial(0xb8956a);
      var body = addMesh(bodyGeometry, bodyMaterial, { x: posX, y: 1.5, z: posZ });

      var headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      var headMaterial = createMaterial(0xc9a876);
      var head = addMesh(headGeometry, headMaterial, { x: posX, y: 3.2, z: posZ });

      var headlampGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      var headlampMaterial = createMaterial(0xffffff, 0xffffff, 2);
      var headlamp = addMesh(headlampGeometry, headlampMaterial, { x: posX + 0.3, y: 3.2, z: posZ - 0.35 });

      raiders.push({ body: body, head: head, headlamp: headlamp, targetZ: -18 });
    }

    animations.raiders = raiders;
  }

  function createSecurityGuards() {
    var guards = [];

    for (var i = 0; i < 4; i++) {
      var posX = -15 + i * 10;
      var posZ = -10;

      var bodyGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.8);
      var bodyMaterial = createMaterial(0x666666);
      var body = addMesh(bodyGeometry, bodyMaterial, { x: posX, y: 1.5, z: posZ });

      var headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      var headMaterial = createMaterial(0x777777);
      var head = addMesh(headGeometry, headMaterial, { x: posX, y: 3.2, z: posZ });

      guards.push({ body: body, head: head });
    }

    animations.guards = guards;
  }

  function createTorches() {
    var positions = [
      { x: -20, z: -16 },
      { x: 20, z: -16 },
      { x: -15, z: -20 }
    ];

    var torches = [];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
      var poleMaterial = createMaterial(0x333333);
      var pole = addMesh(poleGeometry, poleMaterial, { x: pos.x, y: 5, z: pos.z });

      var fireGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      var fireMaterial = createMaterial(0xffa500, 0xff6600, 2.5);
      var fire = addMesh(fireGeometry, fireMaterial, { x: pos.x, y: 9.5, z: pos.z });

      torches.push({ pole: pole, fire: fire, time: Math.random() * 6.28 });
    }

    animations.torches = torches;
  }

  function createInteriorChamber() {
    var chamberGeometry = new THREE.BoxGeometry(15, 8, 12);
    var chamberMaterial = createMaterial(0x2a2a2a);
    var chamber = addMesh(chamberGeometry, chamberMaterial, { x: 0, y: 3, z: -20 });

    var treasureGeometry = new THREE.BoxGeometry(4, 3, 4);
    var treasureMaterial = createMaterial(0xffd700, 0xffed4e, 1.5);
    var treasure = addMesh(treasureGeometry, treasureMaterial, { x: 0, y: 3, z: -22 });

    animations.chamber = { chamber: chamber, treasure: treasure };
  }

  function createSandDunes() {
    var dunes = [];

    for (var i = 0; i < 2; i++) {
      var posX = -50 + i * 100;
      var duneGeometry = new THREE.BoxGeometry(60, 15, 50);
      var duneMaterial = createMaterial(0xbda055);
      var dune = addMesh(duneGeometry, duneMaterial, { x: posX, y: 6, z: 80 });
      dunes.push(dune);
    }

    animations.dunes = dunes;
  }

  function createTreasureChests() {
    var chests = [];

    for (var i = 0; i < 4; i++) {
      var posX = -8 + i * 5;
      var posZ = -15;

      var chestGeometry = new THREE.BoxGeometry(2, 1.5, 2);
      var chestMaterial = createMaterial(0x8b4513);
      var chest = addMesh(chestGeometry, chestMaterial, { x: posX, y: 1, z: posZ });

      var gemGeometry = new THREE.SphereGeometry(0.3, 6, 6);
      var gemMaterial = createMaterial(0xffd700, 0xffed4e, 1.2);
      var gem = addMesh(gemGeometry, gemMaterial, { x: posX, y: 1.5, z: posZ });

      chests.push({ chest: chest, gem: gem });
    }

    animations.chests = chests;
  }

  function createObelisk() {
    var obeliskGeometry = new THREE.BoxGeometry(2, 20, 2);
    var obeliskMaterial = createMaterial(0x8b8680);
    var obelisk = addMesh(obeliskGeometry, obeliskMaterial, { x: -45, y: 10, z: 10 });

    for (var i = 0; i < 5; i++) {
      var bandGeometry = new THREE.BoxGeometry(2.3, 0.5, 2.3);
      var bandMaterial = createMaterial(0x6b6860);
      var band = addMesh(bandGeometry, bandMaterial, { x: -45, y: 5 + i * 3, z: 10 });
    }

    animations.obelisk = { mesh: obelisk };
  }

  function createSandParticles() {
    var particles = [];

    for (var i = 0; i < 20; i++) {
      var posX = Math.random() * 200 - 100;
      var posZ = Math.random() * 200 - 100;
      var posY = 0.5 + Math.random() * 2;

      var particleGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var particleMaterial = createMaterial(0xc2a050);
      var particle = addMesh(particleGeometry, particleMaterial, { x: posX, y: posY, z: posZ });

      particles.push({
        mesh: particle,
        startX: posX,
        startZ: posZ,
        startY: posY,
        time: Math.random() * 6.28
      });
    }

    animations.particles = particles;
  }

  function createTentCamp() {
    var tentGeometry = new THREE.BoxGeometry(8, 5, 8);
    var tentMaterial = createMaterial(0x228b22);
    var tent = addMesh(tentGeometry, tentMaterial, { x: -60, y: 2.5, z: 40 });

    for (var i = 0; i < 4; i++) {
      var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 6);
      var poleMaterial = createMaterial(0x8b4513);
      var offsetX = i % 2 === 0 ? -3 : 3;
      var offsetZ = i < 2 ? -3 : 3;
      var pole = addMesh(poleGeometry, poleMaterial, { x: -60 + offsetX, y: 3, z: 40 + offsetZ });
    }

    for (var j = 0; j < 3; j++) {
      var crateGeometry = new THREE.BoxGeometry(2, 2, 2);
      var crateMaterial = createMaterial(0x8b4513);
      var crate = addMesh(crateGeometry, crateMaterial, { x: -45 + j * 3, y: 1, z: 40 });
    }

    animations.camp = { tent: tent };
  }

  function createScarabSwarms() {
    var swarms = [];

    for (var s = 0; s < 2; s++) {
      var centerX = -25 + s * 50;
      var centerZ = -25;
      var swarm = [];

      for (var i = 0; i < 15; i++) {
        var particleGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.7);
        var particleMaterial = createMaterial(0x1a1a1a);
        var particle = addMesh(particleGeometry, particleMaterial, { x: centerX, y: 2, z: centerZ });

        swarm.push({
          mesh: particle,
          angle: (i / 15) * 6.28,
          centerX: centerX,
          centerZ: centerZ,
          radius: 5 + Math.random() * 3
        });
      }

      swarms.push(swarm);
    }

    animations.scarabs = swarms;
  }

  function createBoobyTrapMarkers() {
    var traps = [];

    for (var i = 0; i < 3; i++) {
      var posX = -8 + i * 8;
      var posZ = -18;

      var crackGeometry = new THREE.BoxGeometry(3, 0.2, 3);
      var crackMaterial = createMaterial(0x8b8680);
      var crack = addMesh(crackGeometry, crackMaterial, { x: posX, y: 0.1, z: posZ });

      var offsetGeometry = new THREE.BoxGeometry(1.5, 0.15, 1.5);
      var offsetMaterial = createMaterial(0x654321);
      var offset = addMesh(offsetGeometry, offsetMaterial, { x: posX + 1, y: 0.15, z: posZ + 1 });

      traps.push({ crack: crack, offset: offset });
    }

    animations.traps = traps;
  }

  function createFullMoon() {
    var moonGeometry = new THREE.SphereGeometry(40, 32, 32);
    var moonMaterial = createMaterial(0xffffff, 0xffffff, 1.5);
    var moon = addMesh(moonGeometry, moonMaterial, { x: 150, y: 120, z: -200 });

    animations.moon = { mesh: moon, colorPhase: 0 };
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'pyramid-raid-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#ffd700';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
      document.body.appendChild(hudElement);
    }

    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      var alertStatus = guardsAlerted ? 'YES' : 'NO';
      hudElement.innerHTML = 'ARTIFACTS RECOVERED: ' + artifactsRecovered + '/5<br>' +
                             'TRAPS TRIGGERED: ' + trapsTriggered + '<br>' +
                             'GUARDS ALERTED: ' + alertStatus;
    }
  }

  function removeHUD() {
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'h' || event.key === 'H') {
      var now = Date.now();
      if (isHPressed && (now - hPressTime) < 400) {
        if (event.key === 'p' || event.key === 'P') {
          isHPressed = false;
          updateHUD();
        }
      } else {
        isHPressed = true;
        hPressTime = now;
      }
    }
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    createDesertGround();
    createMainPyramid();
    createPyramidEntrance();
    createSphinxes();
    createTombRaiders();
    createSecurityGuards();
    createTorches();
    createInteriorChamber();
    createSandDunes();
    createTreasureChests();
    createObelisk();
    createSandParticles();
    createTentCamp();
    createScarabSwarms();
    createBoobyTrapMarkers();
    createFullMoon();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    lights.push(directionalLight);

    createHUD();

    document.addEventListener('keydown', handleKeyPress);
  }

  function update(delta) {
    if (animations.torches) {
      for (var i = 0; i < animations.torches.length; i++) {
        var torch = animations.torches[i];
        torch.time += delta * 3;
        var flicker = 0.8 + Math.sin(torch.time) * 0.2;
        torch.fire.scale.set(flicker, flicker, flicker);
        torch.fire.material.emissiveIntensity = 1.5 + Math.sin(torch.time * 1.5) * 0.5;
      }
    }

    if (animations.particles) {
      for (var i = 0; i < animations.particles.length; i++) {
        var particle = animations.particles[i];
        particle.time += delta * 0.5;
        var driftX = particle.startX + Math.sin(particle.time) * 15;
        var driftZ = particle.startZ + Math.cos(particle.time * 0.7) * 20;
        particle.mesh.position.set(driftX, particle.startY, driftZ);
      }
    }

    if (animations.scarabs) {
      for (var s = 0; s < animations.scarabs.length; s++) {
        var swarm = animations.scarabs[s];
        for (var i = 0; i < swarm.length; i++) {
          var scarab = swarm[i];
          scarab.angle += delta * 2;
          var x = scarab.centerX + Math.cos(scarab.angle) * scarab.radius;
          var z = scarab.centerZ + Math.sin(scarab.angle) * scarab.radius;
          var y = 3 + Math.sin(scarab.angle * 3) * 1;
          scarab.mesh.position.set(x, y, z);
          scarab.mesh.rotation.y += delta;
        }
      }
    }

    if (animations.moon) {
      var moon = animations.moon;
      moon.colorPhase += delta * 0.3;
      var colorIntensity = 0.5 + Math.sin(moon.colorPhase) * 0.5;
      moon.mesh.material.emissiveIntensity = 1 + colorIntensity * 0.3;
      moon.mesh.rotation.y += delta * 0.05;
    }

    if (animations.raiders) {
      for (var i = 0; i < animations.raiders.length; i++) {
        var raider = animations.raiders[i];
        if (raider.mesh.position.z > raider.targetZ) {
          raider.body.position.z -= delta * 5;
          raider.head.position.z -= delta * 5;
          raider.headlamp.position.z -= delta * 5;
        }
      }
    }
  }

  function reset() {
    document.removeEventListener('keydown', handleKeyPress);
    removeHUD();

    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].geometry) {
        meshes[i].geometry.dispose();
      }
    }

    for (var i = 0; i < materials.length; i++) {
      materials[i].dispose();
    }

    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }

    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }

    meshes = [];
    materials = [];
    lights = [];
    animations = {};
    artifactsRecovered = 0;
    trapsTriggered = 0;
    guardsAlerted = false;
    isHPressed = false;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
