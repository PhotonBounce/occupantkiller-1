window.DestroyerEscort = (function() {
  'use strict';

  var scene, camera, renderer, canvas;
  var sceneObjects = [];
  var animationFrameId = null;

  var state = {
    boardersRepelled: 0,
    gunsIntact: 2,
    hullBreach: false,
    gunRotation: 0,
    radarRotation: 0,
    funnelIntensity: 0.7,
    fireFlickerTime: 0,
    crewPositions: [],
    boarderPositions: [],
    showHUD: true,
    keyTimings: {}
  };

  function init(container) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1929);
    scene.fog = new THREE.Fog(0x0d1929, 500, 1000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(100, 60, 80);
    camera.lookAt(0, 10, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#00ff00';
    ctx.font = '32px monospace';
    ctx.fillText('BOARDERS REPELLED: 0/4', 20, 60);
    ctx.fillText('GUN BATTERIES INTACT: 2/2', 20, 120);
    ctx.fillText('HULL BREACH: NO', 20, 180);
    var texture = new THREE.CanvasTexture(canvas);
    var hudMaterial = new THREE.MeshBasicMaterial({ map: texture });
    var hudGeometry = new THREE.PlaneGeometry(50, 12.5);
    var hudMesh = new THREE.Mesh(hudGeometry, hudMaterial);
    hudMesh.position.set(0, 40, 100);
    scene.add(hudMesh);
    sceneObjects.push(hudMesh);

    setupLighting();
    buildShip();
    setupKeyBindings();
    animate();
  }

  function setupLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);
  }

  function buildShip() {
    // 1. Ship hull - long wide dark grey box
    var hullGeometry = new THREE.BoxGeometry(8, 6, 40);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.4 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = -3;
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    sceneObjects.push(hull);

    // 2. Main deck - flat box atop hull
    var deckGeometry = new THREE.BoxGeometry(9, 0.5, 41);
    var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.5 });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.3;
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    sceneObjects.push(deck);

    // 3. Bridge superstructure - tall box with windows
    var bridgeGeometry = new THREE.BoxGeometry(6, 8, 5);
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.6 });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, 5, 12);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    sceneObjects.push(bridge);

    // Bridge windows
    var windowsGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 2, 0.1));
    var windowsLine = new THREE.LineSegments(windowsGeometry, new THREE.LineBasicMaterial({ color: 0x00ffff }));
    windowsLine.position.set(0, 6, 14.6);
    scene.add(windowsLine);
    sceneObjects.push(windowsLine);

    // 4. Forward gun turret - cylinder base + barrel
    var turretBaseGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 8);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9 });
    var turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turretBase.position.set(0, 2, 8);
    turretBase.castShadow = true;
    turretBase.receiveShadow = true;
    scene.add(turretBase);
    sceneObjects.push(turretBase);

    var turretBarrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    var turretBarrel = new THREE.Mesh(turretBarrelGeometry, turretMaterial);
    turretBarrel.rotation.z = Math.PI / 6;
    turretBarrel.position.set(0, 4, 10);
    turretBarrel.castShadow = true;
    turretBarrel.receiveShadow = true;
    var turretGroup = new THREE.Group();
    turretGroup.add(turretBarrel);
    turretBase.add(turretGroup);
    sceneObjects.push(turretBarrel);
    state.forwardTurret = turretGroup;

    // 5. Rear gun turret
    var rearTurretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    rearTurretBase.position.set(0, 2, -12);
    rearTurretBase.castShadow = true;
    rearTurretBase.receiveShadow = true;
    scene.add(rearTurretBase);
    sceneObjects.push(rearTurretBase);

    var rearTurretBarrel = new THREE.Mesh(turretBarrelGeometry, turretMaterial);
    rearTurretBarrel.rotation.z = -Math.PI / 6;
    rearTurretBarrel.position.set(0, 4, -10);
    rearTurretBarrel.castShadow = true;
    rearTurretBarrel.receiveShadow = true;
    var rearTurretGroup = new THREE.Group();
    rearTurretGroup.add(rearTurretBarrel);
    rearTurretBase.add(rearTurretGroup);
    sceneObjects.push(rearTurretBarrel);
    state.rearTurret = rearTurretGroup;

    // 6. Torpedo tube battery - 4 cylinders angled forward
    var torpedoMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.85 });
    for (var i = 0; i < 4; i++) {
      var torpGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
      var torpedo = new THREE.Mesh(torpGeometry, torpedoMaterial);
      torpedo.rotation.x = Math.PI / 8;
      var yOffset = (i - 1.5) * 1.2;
      torpedo.position.set(yOffset, 2 + Math.abs(yOffset) * 0.3, 5);
      torpedo.castShadow = true;
      torpedo.receiveShadow = true;
      scene.add(torpedo);
      sceneObjects.push(torpedo);
    }

    // 7. Depth charge rack stern - 3 spheres on box rail
    var rackGeometry = new THREE.BoxGeometry(8, 0.5, 2);
    var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(0, 1, -18);
    rack.castShadow = true;
    rack.receiveShadow = true;
    scene.add(rack);
    sceneObjects.push(rack);

    var depthChargeMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, metalness: 0.7 });
    for (var j = 0; j < 3; j++) {
      var chargeGeometry = new THREE.SphereGeometry(1, 8, 8);
      var charge = new THREE.Mesh(chargeGeometry, depthChargeMaterial);
      charge.position.set((j - 1) * 3, 2, -18);
      charge.castShadow = true;
      charge.receiveShadow = true;
      scene.add(charge);
      sceneObjects.push(charge);
    }

    // 8. Radar mast - cylinder pole + antenna array
    var mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x505050, metalness: 0.6 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(2, 10, 10);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    sceneObjects.push(mast);

    var antennaGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(6, 1, 6));
    var antennaLine = new THREE.LineSegments(antennaGeometry, new THREE.LineBasicMaterial({ color: 0xffff00 }));
    antennaLine.position.set(2, 16, 10);
    scene.add(antennaLine);
    sceneObjects.push(antennaLine);
    state.radar = antennaLine;

    // 9. Smoke funnel - 2 cylinder stacks
    var funnelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0xff4400, emissiveIntensity: 0.7 });
    for (var k = 0; k < 2; k++) {
      var funnelGeometry = new THREE.CylinderGeometry(1.2, 1.5, 6, 8);
      var funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
      funnel.position.set(k * 4 - 2, 5, 0);
      funnel.castShadow = true;
      funnel.receiveShadow = true;
      scene.add(funnel);
      sceneObjects.push(funnel);
    }

    // 10. Life raft containers - box containers on rails
    var raftMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.5 });
    for (var m = 0; m < 2; m++) {
      var raftGeometry = new THREE.BoxGeometry(2, 2, 2);
      var raft = new THREE.Mesh(raftGeometry, raftMaterial);
      raft.position.set((m * 2 - 1) * 4.5, 3, 0);
      raft.castShadow = true;
      raft.receiveShadow = true;
      scene.add(raft);
      sceneObjects.push(raft);
    }

    // 11. Anchor chain hawsepipe - cylinder pipe in bow
    var pipeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(0, 1, 19);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    scene.add(pipe);
    sceneObjects.push(pipe);

    // 12. Anti-aircraft gun mounts - 2x box+cylinder, rotating
    var aaBoxMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 });
    var aaCylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9 });
    for (var n = 0; n < 2; n++) {
      var aaBoxGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      var aaBox = new THREE.Mesh(aaBoxGeometry, aaBoxMaterial);
      aaBox.position.set((n * 2 - 1) * 4, 3.5, -5);
      aaBox.castShadow = true;
      aaBox.receiveShadow = true;
      scene.add(aaBox);
      sceneObjects.push(aaBox);

      var aaCylinderGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 8);
      var aaCylinder = new THREE.Mesh(aaCylinderGeometry, aaCylinderMaterial);
      aaCylinder.rotation.z = Math.PI / 4;
      aaCylinder.position.set((n * 2 - 1) * 4, 5, -4);
      aaCylinder.castShadow = true;
      aaCylinder.receiveShadow = true;
      var aaGroup = new THREE.Group();
      aaGroup.add(aaCylinder);
      aaBox.add(aaGroup);
      sceneObjects.push(aaCylinder);
      if (n === 0) state.aaGun1 = aaGroup;
      else state.aaGun2 = aaGroup;
    }

    // 13. Signal lamp - sphere emissive flashing
    var lampGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0 });
    var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(-3, 6, 14);
    lamp.castShadow = true;
    scene.add(lamp);
    sceneObjects.push(lamp);
    state.signalLamp = lamp;

    // 14-15. Crew sailors and enemy boarders
    var crewMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var boarderMaterial = new THREE.MeshStandardMaterial({ color: 0x660000 });

    // 6 defenders
    for (var p = 0; p < 6; p++) {
      var crewBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), crewMaterial);
      crewBox.position.set((p % 3 - 1) * 2, 1, (Math.floor(p / 3) - 0.5) * 4);
      crewBox.castShadow = true;
      scene.add(crewBox);
      sceneObjects.push(crewBox);

      var crewHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), crewMaterial);
      crewHead.position.copy(crewBox.position);
      crewHead.position.y = 1.8;
      crewHead.castShadow = true;
      scene.add(crewHead);
      sceneObjects.push(crewHead);

      state.crewPositions.push({ box: crewBox, head: crewHead, vx: (Math.random() - 0.5) * 0.2 });
    }

    // 4 attackers
    for (var q = 0; q < 4; q++) {
      var boarderBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), boarderMaterial);
      boarderBox.position.set((q % 2 - 0.5) * 5, 2, 15 + Math.floor(q / 2) * 3);
      boarderBox.castShadow = true;
      scene.add(boarderBox);
      sceneObjects.push(boarderBox);

      var boarderHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), boarderMaterial);
      boarderHead.position.copy(boarderBox.position);
      boarderHead.position.y = 2.8;
      boarderHead.castShadow = true;
      scene.add(boarderHead);
      sceneObjects.push(boarderHead);

      state.boarderPositions.push({ box: boarderBox, head: boarderHead, vx: (Math.random() - 0.5) * 0.15 });
    }

    // 16. Deck fire from hit - emissive orange sphere cluster
    var fireMaterial = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff8800, emissiveIntensity: 0.8 });
    for (var r = 0; r < 5; r++) {
      var fireGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var fire = new THREE.Mesh(fireGeometry, fireMaterial);
      fire.position.set((r - 2) * 1.5, 2 + (r % 2) * 0.5, 3);
      fire.castShadow = true;
      scene.add(fire);
      sceneObjects.push(fire);
      if (r === 0) state.fireCluster = fire;
    }

    // 17. Wake foam behind stern - white flat box
    var wakeMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.2, roughness: 0.8 });
    var wakeGeometry = new THREE.BoxGeometry(10, 0.2, 8);
    var wake = new THREE.Mesh(wakeGeometry, wakeMaterial);
    wake.position.set(0, 0.1, -25);
    wake.receiveShadow = true;
    scene.add(wake);
    sceneObjects.push(wake);
  }

  function setupKeyBindings() {
    var lastDKeyPress = 0;
    window.addEventListener('keydown', function(event) {
      if (event.key.toLowerCase() === 'd') {
        var now = Date.now();
        if (now - lastDKeyPress < 400) {
          state.showHUD = !state.showHUD;
          lastDKeyPress = 0;
        } else {
          lastDKeyPress = now;
        }
      }
      if (event.key.toLowerCase() === 'e') {
        var now2 = Date.now();
        if (now2 - lastDKeyPress < 400) {
          state.showHUD = !state.showHUD;
          lastDKeyPress = 0;
        }
      }
    });
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
  }

  function update() {
    state.gunRotation += 0.005;
    state.radarRotation += 0.03;
    state.fireFlickerTime += 1;

    // Forward gun turret rotates
    if (state.forwardTurret) {
      state.forwardTurret.rotation.y = Math.sin(state.gunRotation) * 0.3;
    }

    // Rear gun turret rotates opposite
    if (state.rearTurret) {
      state.rearTurret.rotation.y = Math.sin(state.gunRotation + Math.PI) * 0.3;
    }

    // Radar antenna spins
    if (state.radar) {
      state.radar.rotation.y = state.radarRotation;
    }

    // Exhaust funnels pulse
    scene.children.forEach(function(obj) {
      if (obj.material && obj.material.emissive && obj.material.emissiveIntensity !== undefined) {
        if (obj.position.y > 4 && obj.position.y < 7) {
          obj.material.emissiveIntensity = state.funnelIntensity + Math.sin(state.fireFlickerTime * 0.05) * 0.2;
        }
      }
    });

    // Crew and boarders move toward each other
    state.crewPositions.forEach(function(crew) {
      crew.box.position.z += crew.vx;
      crew.head.position.copy(crew.box.position);
      crew.head.position.y += 0.8;
    });

    state.boarderPositions.forEach(function(boarder) {
      boarder.box.position.z -= boarder.vx;
      boarder.head.position.copy(boarder.box.position);
      boarder.head.position.y += 0.8;
    });

    // Deck fire flickers
    if (state.fireCluster && state.fireCluster.material) {
      state.fireCluster.material.emissiveIntensity = 0.6 + Math.sin(state.fireFlickerTime * 0.1) * 0.4;
    }

    // Signal lamp strobes
    if (state.signalLamp && state.signalLamp.material) {
      state.signalLamp.material.emissiveIntensity = (Math.sin(state.fireFlickerTime * 0.15) > 0.7) ? 1 : 0;
    }

    // Anti-aircraft guns rotate
    if (state.aaGun1) {
      state.aaGun1.rotation.y = Math.sin(state.gunRotation) * 0.2;
    }
    if (state.aaGun2) {
      state.aaGun2.rotation.y = Math.cos(state.gunRotation) * 0.2;
    }

    // Window resize
    if (window.innerWidth !== renderer.domElement.width || window.innerHeight !== renderer.domElement.height) {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
  }

  function reset() {
    cancelAnimationFrame(animationFrameId);

    sceneObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      if (obj.parent) obj.parent.remove(obj);
    });

    renderer.dispose();
    renderer.forceContextLoss();
    var canvas = renderer.domElement;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);

    scene = null;
    camera = null;
    renderer = null;
    sceneObjects = [];
    state = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
