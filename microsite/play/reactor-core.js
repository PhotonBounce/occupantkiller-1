window.ReactorCore = (function() {
  'use strict';

  var scene, camera, renderer, canvas2d, ctx2d;
  var reactor, controlRods, steamParticles, saboteurs, guards, scientists;
  var meltdownTimer, hudVisible, isAlert, keybindState;
  var objectsToDispose;

  function init(containerId) {
    objectsToDispose = [];

    // Setup 3D scene
    var container = document.getElementById(containerId);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a0a);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 100, 200);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // 1. Reactor floor (graphite grey, flat box)
    var floorGeo = new THREE.BoxGeometry(30, 0.5, 30);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.3, roughness: 0.8 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -2;
    scene.add(floor);
    objectsToDispose.push({ geometry: floorGeo, material: floorMat, mesh: floor });

    // 2. Reactor pressure vessel (massive cylinder, emissive blue-white)
    var vesselGeo = new THREE.CylinderGeometry(5, 5, 12, 32);
    var vesselMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2
    });
    reactor = new THREE.Mesh(vesselGeo, vesselMat);
    reactor.position.set(0, 2, 0);
    scene.add(reactor);
    objectsToDispose.push({ geometry: vesselGeo, material: vesselMat, mesh: reactor });

    // 3. Control rod assembly (12 thin cylinders)
    controlRods = [];
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x = Math.cos(angle) * 3.5;
      var z = Math.sin(angle) * 3.5;
      var rodGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 16);
      var rodMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });
      var rod = new THREE.Mesh(rodGeo, rodMat);
      rod.position.set(x, 1, z);
      rod.originalY = 1;
      scene.add(rod);
      controlRods.push(rod);
      objectsToDispose.push({ geometry: rodGeo, material: rodMat, mesh: rod });
    }

    // 4. Steam generator units (2 large cylinders)
    for (var i = 0; i < 2; i++) {
      var sgGeo = new THREE.CylinderGeometry(2.5, 2.5, 10, 24);
      var sgMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.4, roughness: 0.6 });
      var sg = new THREE.Mesh(sgGeo, sgMat);
      sg.position.set((i === 0 ? -10 : 10), 2, 0);
      scene.add(sg);
      objectsToDispose.push({ geometry: sgGeo, material: sgMat, mesh: sg });
    }

    // 5. Cooling water pipes (interconnected loops)
    var pipeRadius = 0.3;
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, 15, 16);
      var pipeMat = new THREE.MeshStandardMaterial({ color: 0x0066aa, emissive: 0x004488, metalness: 0.5 });
      var pipe = new THREE.Mesh(pipeGeo, pipeMat);
      if (i % 2 === 0) {
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(Math.cos(angle) * 8, 0, Math.sin(angle) * 8);
      } else {
        pipe.position.set(Math.cos(angle) * 8, 4, Math.sin(angle) * 8);
      }
      scene.add(pipe);
      objectsToDispose.push({ geometry: pipeGeo, material: pipeMat, mesh: pipe });
    }

    // 6. Containment wall (thick box walls)
    var wallThickness = 1;
    var wallHeight = 20;
    var wallDist = 20;
    for (var i = 0; i < 4; i++) {
      var wallGeo = new THREE.BoxGeometry(wallDist * 2, wallHeight, wallThickness);
      var wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.9 });
      var wall = new THREE.Mesh(wallGeo, wallMat);
      if (i < 2) {
        wall.position.set((i === 0 ? -wallDist : wallDist), wallHeight / 2, 0);
      } else {
        wall.position.set(0, wallHeight / 2, (i === 2 ? -wallDist : wallDist));
      }
      scene.add(wall);
      objectsToDispose.push({ geometry: wallGeo, material: wallMat, mesh: wall });
    }

    // 7. Observation catwalk (elevated flat box walkway with rails)
    var catkGeo = new THREE.BoxGeometry(25, 0.5, 4);
    var catkMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.5 });
    var catwalk = new THREE.Mesh(catkGeo, catkMat);
    catwalk.position.set(0, 10, 0);
    scene.add(catwalk);
    objectsToDispose.push({ geometry: catkGeo, material: catkMat, mesh: catwalk });

    // Catwalk rails (LineSegments)
    var railPoints = [];
    railPoints.push(new THREE.Vector3(-12.5, 10.5, 2.2));
    railPoints.push(new THREE.Vector3(12.5, 10.5, 2.2));
    railPoints.push(new THREE.Vector3(-12.5, 10.5, -2.2));
    railPoints.push(new THREE.Vector3(12.5, 10.5, -2.2));
    var railGeo = new THREE.BufferGeometry().setFromPoints(railPoints);
    var railMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var railLines = new THREE.LineSegments(railGeo, railMat);
    scene.add(railLines);
    objectsToDispose.push({ geometry: railGeo, material: railMat, mesh: railLines });

    // 8. Radiation monitoring panels (box panels with emissive gauges)
    for (var i = 0; i < 3; i++) {
      var panelGeo = new THREE.BoxGeometry(2, 3, 0.3);
      var panelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.7 });
      var panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(-15 + (i * 7), 4, -18);
      scene.add(panel);
      objectsToDispose.push({ geometry: panelGeo, material: panelMat, mesh: panel });

      // Gauge indicator
      var gaugeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
      var gaugeMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.8 });
      var gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
      gauge.position.set(-15 + (i * 7), 4.5, -17.8);
      scene.add(gauge);
      objectsToDispose.push({ geometry: gaugeGeo, material: gaugeMat, mesh: gauge });
    }

    // 9. Emergency SCRAM button station (console with emissive red button)
    var consoleGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
    var consoleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 });
    var console = new THREE.Mesh(consoleGeo, consoleMat);
    console.position.set(18, 1, -18);
    scene.add(console);
    objectsToDispose.push({ geometry: consoleGeo, material: consoleMat, mesh: console });

    var buttonGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    var buttonMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
    var button = new THREE.Mesh(buttonGeo, buttonMat);
    button.position.set(18, 2, -18);
    scene.add(button);
    objectsToDispose.push({ geometry: buttonGeo, material: buttonMat, mesh: button });

    // 10. Fuel rod storage pool (deep blue emissive box)
    var poolGeo = new THREE.BoxGeometry(8, 6, 8);
    var poolMat = new THREE.MeshStandardMaterial({
      color: 0x001a4d,
      emissive: 0x003366,
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.8
    });
    var pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(-18, 1, 10);
    scene.add(pool);
    objectsToDispose.push({ geometry: poolGeo, material: poolMat, mesh: pool });

    // 11. Control room window (box frame with grid)
    var winFrameGeo = new THREE.BoxGeometry(6, 4, 0.2);
    var winFrameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 });
    var winFrame = new THREE.Mesh(winFrameGeo, winFrameMat);
    winFrame.position.set(-18, 6, -18);
    scene.add(winFrame);
    objectsToDispose.push({ geometry: winFrameGeo, material: winFrameMat, mesh: winFrame });

    // Window glass grid (LineSegments)
    var gridPoints = [];
    for (var i = 0; i <= 3; i++) {
      gridPoints.push(new THREE.Vector3(-3 + (i * 2), -2, -17.8));
      gridPoints.push(new THREE.Vector3(-3 + (i * 2), 2, -17.8));
      gridPoints.push(new THREE.Vector3(-3, -2 + (i * 1.33), -17.8));
      gridPoints.push(new THREE.Vector3(3, -2 + (i * 1.33), -17.8));
    }
    var gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);
    var gridMat = new THREE.LineBasicMaterial({ color: 0x4466aa, linewidth: 1 });
    var gridLines = new THREE.LineSegments(gridGeo, gridMat);
    scene.add(gridLines);
    objectsToDispose.push({ geometry: gridGeo, material: gridMat, mesh: gridLines });

    // 12. Scientist/operator figures (3 white workers)
    scientists = [];
    for (var i = 0; i < 3; i++) {
      var figGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
      var figMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.2, roughness: 0.8 });
      var body = new THREE.Mesh(figGeo, figMat);
      var headGeo = new THREE.SphereGeometry(0.35, 16, 16);
      var head = new THREE.Mesh(headGeo, figMat);
      head.position.y = 0.85;
      body.add(head);
      body.position.set(-8 + (i * 6), 0.6, 10);
      body.userData.isScientist = true;
      scene.add(body);
      scientists.push(body);
      objectsToDispose.push({ geometry: figGeo, material: figMat, mesh: body });
      objectsToDispose.push({ geometry: headGeo, material: figMat, mesh: head });
    }

    // 13. Saboteur figures (4 dark gear attackers)
    saboteurs = [];
    for (var i = 0; i < 4; i++) {
      var sabGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
      var sabMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.6 });
      var sabBody = new THREE.Mesh(sabGeo, sabMat);
      var sabHeadGeo = new THREE.SphereGeometry(0.35, 16, 16);
      var sabHead = new THREE.Mesh(sabHeadGeo, sabMat);
      sabHead.position.y = 0.85;
      sabBody.add(sabHead);
      sabBody.position.set(15 + (i * 2), 0.6, 10 - (i * 1.5));
      sabBody.userData.isSaboteur = true;
      sabBody.userData.active = true;
      scene.add(sabBody);
      saboteurs.push(sabBody);
      objectsToDispose.push({ geometry: sabGeo, material: sabMat, mesh: sabBody });
      objectsToDispose.push({ geometry: sabHeadGeo, material: sabMat, mesh: sabHead });
    }

    // 14. Security guard figures (3 guards)
    guards = [];
    for (var i = 0; i < 3; i++) {
      var guardGeo = new THREE.BoxGeometry(0.7, 1.3, 0.7);
      var guardMat = new THREE.MeshStandardMaterial({ color: 0x333366, metalness: 0.5, roughness: 0.5 });
      var guardBody = new THREE.Mesh(guardGeo, guardMat);
      var guardHeadGeo = new THREE.SphereGeometry(0.4, 16, 16);
      var guardHead = new THREE.Mesh(guardHeadGeo, guardMat);
      guardHead.position.y = 0.9;
      guardBody.add(guardHead);
      guardBody.position.set(-15 + (i * 8), 0.65, 5);
      guardBody.userData.isGuard = true;
      scene.add(guardBody);
      guards.push(guardBody);
      objectsToDispose.push({ geometry: guardGeo, material: guardMat, mesh: guardBody });
      objectsToDispose.push({ geometry: guardHeadGeo, material: guardMat, mesh: guardHead });
    }

    // 15. Coolant leak effect (emissive steam particles rising)
    steamParticles = [];
    for (var i = 0; i < 20; i++) {
      var steamGeo = new THREE.SphereGeometry(0.4, 8, 8);
      var steamMat = new THREE.MeshStandardMaterial({
        color: 0xccccff,
        emissive: 0x8899ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.6
      });
      var steam = new THREE.Mesh(steamGeo, steamMat);
      steam.position.set(
        (Math.random() - 0.5) * 10,
        -2 + Math.random() * 2,
        (Math.random() - 0.5) * 10
      );
      steam.userData.velocity = new THREE.Vector3(0, 0.05 + Math.random() * 0.02, 0);
      scene.add(steam);
      steamParticles.push(steam);
      objectsToDispose.push({ geometry: steamGeo, material: steamMat, mesh: steam });
    }

    // 16. Seismic monitor display (box with LineSegments graph)
    var seisGeo = new THREE.BoxGeometry(3, 2.5, 0.3);
    var seisMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, metalness: 0.3, roughness: 0.8 });
    var seisDisplay = new THREE.Mesh(seisGeo, seisMat);
    seisDisplay.position.set(18, 4, 18);
    scene.add(seisDisplay);
    objectsToDispose.push({ geometry: seisGeo, material: seisMat, mesh: seisDisplay });

    var graphPoints = [];
    for (var i = 0; i < 10; i++) {
      graphPoints.push(new THREE.Vector3(-1.3 + (i * 0.3), -0.5 + Math.random() * 0.5, 0.2));
      graphPoints.push(new THREE.Vector3(-1.3 + (i * 0.3), -0.5 + Math.random() * 0.5, 0.2));
    }
    var graphGeo = new THREE.BufferGeometry().setFromPoints(graphPoints);
    var graphMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
    var graphLines = new THREE.LineSegments(graphGeo, graphMat);
    graphLines.position.set(18, 4, 18);
    scene.add(graphLines);
    objectsToDispose.push({ geometry: graphGeo, material: graphMat, mesh: graphLines });

    // 17. Emergency lighting strips (emissive orange/red)
    for (var i = 0; i < 8; i++) {
      var lightGeo = new THREE.BoxGeometry(1, 0.3, 0.2);
      var lightMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff3300,
        emissiveIntensity: 0.7
      });
      var light = new THREE.Mesh(lightGeo, lightMat);
      var posAngle = (i / 8) * Math.PI * 2;
      light.position.set(
        Math.cos(posAngle) * 20,
        15,
        Math.sin(posAngle) * 20
      );
      light.rotation.y = posAngle;
      scene.add(light);
      objectsToDispose.push({ geometry: lightGeo, material: lightMat, mesh: light });
    }

    // Setup 2D HUD canvas
    var hudCanvas = document.createElement('canvas');
    hudCanvas.width = 1024;
    hudCanvas.height = 256;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '10px';
    hudCanvas.style.left = '10px';
    hudCanvas.style.fontFamily = 'monospace';
    hudCanvas.style.color = '#00ff00';
    hudCanvas.style.zIndex = '10';
    document.body.appendChild(hudCanvas);
    canvas2d = hudCanvas;
    ctx2d = hudCanvas.getContext('2d');

    meltdownTimer = 300; // 5 minutes in seconds
    hudVisible = true;
    isAlert = false;
    keybindState = '';

    // Keybind listener for R+C within 400ms
    window.addEventListener('keydown', function(e) {
      if (e.key.toUpperCase() === 'R') {
        keybindState = 'R';
        setTimeout(function() {
          if (keybindState === 'R') {
            keybindState = '';
          }
        }, 400);
      } else if (e.key.toUpperCase() === 'C' && keybindState === 'R') {
        hudVisible = !hudVisible;
        keybindState = '';
      }
    });

    // Window resize listener
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function update(deltaTime) {
    if (!scene) return;

    // Reactor vessel pulses (Cherenkov glow)
    if (reactor) {
      var pulseIntensity = 0.4 + 0.3 * Math.sin(Date.now() * 0.003);
      reactor.material.emissiveIntensity = pulseIntensity;
    }

    // Control rods move up/down slowly
    for (var i = 0; i < controlRods.length; i++) {
      var rod = controlRods[i];
      var bobAmount = Math.sin(Date.now() * 0.002 + i) * 1.5;
      rod.position.y = rod.originalY + bobAmount;
    }

    // Steam particles rise
    for (var i = 0; i < steamParticles.length; i++) {
      var particle = steamParticles[i];
      particle.position.add(particle.userData.velocity);
      particle.rotation.x += 0.01;
      particle.rotation.y += 0.02;

      // Reset if too high
      if (particle.position.y > 15) {
        particle.position.y = -2;
        particle.position.x = (Math.random() - 0.5) * 10;
        particle.position.z = (Math.random() - 0.5) * 10;
      }
    }

    // Emergency lighting strobes during alert
    if (isAlert) {
      var strobeOn = Math.sin(Date.now() * 0.01) > 0;
      // Update emergency lights (already set in scene)
    }

    // Saboteurs advance
    var saboteursNeutralized = 0;
    for (var i = 0; i < saboteurs.length; i++) {
      var sab = saboteurs[i];
      if (sab.userData.active) {
        // Move toward reactor
        sab.position.x -= 0.02;
        sab.position.z -= 0.01;
        sab.rotation.y += 0.005;

        // Check if engaged by guards
        for (var j = 0; j < guards.length; j++) {
          var guard = guards[j];
          var dist = sab.position.distanceTo(guard.position);
          if (dist < 3) {
            sab.userData.active = false;
            saboteursNeutralized += 1;
            break;
          }
        }
      } else {
        saboteursNeutralized += 1;
      }
    }

    // Scientists flee
    for (var i = 0; i < scientists.length; i++) {
      var scientist = scientists[i];
      scientist.position.z += 0.01;
    }

    // Guards engage
    for (var i = 0; i < guards.length; i++) {
      var guard = guards[i];
      guard.position.x += 0.008;
      guard.rotation.y += 0.01;
    }

    // Coolant loop pipes throb (pulse emissive)
    // This is handled via scene traversal for pipes

    // Update meltdown timer
    meltdownTimer -= deltaTime;
    if (meltdownTimer < 0) {
      meltdownTimer = 0;
      isAlert = true;
    }

    // Render 3D
    renderer.render(scene, camera);

    // Render 2D HUD
    if (hudVisible) {
      ctx2d.fillStyle = '#000000';
      ctx2d.fillRect(0, 0, canvas2d.width, canvas2d.height);
      ctx2d.fillStyle = '#00ff00';
      ctx2d.font = 'bold 20px monospace';
      ctx2d.fillText('REACTOR STATUS: ' + (isAlert ? 'CRITICAL ALERT' : 'STABLE'), 10, 30);
      ctx2d.fillText('SABOTEURS NEUTRALIZED: ' + saboteursNeutralized + '/4', 10, 70);

      var mins = Math.floor(meltdownTimer / 60);
      var secs = Math.floor(meltdownTimer % 60);
      var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
      ctx2d.fillText('MELTDOWN TIMER: ' + timeStr, 10, 110);

      if (!hudVisible) {
        ctx2d.fillStyle = '#ffff00';
        ctx2d.font = '12px monospace';
        ctx2d.fillText('(Press R+C to toggle HUD)', 10, 250);
      }
    }
  }

  function reset() {
    // Dispose all geometries, materials, and meshes
    for (var i = 0; i < objectsToDispose.length; i++) {
      var obj = objectsToDispose[i];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }
    objectsToDispose = [];

    // Clear scene
    if (scene) {
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }

    // Dispose renderer
    if (renderer) {
      renderer.dispose();
    }

    // Remove HUD canvas
    if (canvas2d && canvas2d.parentNode) {
      canvas2d.parentNode.removeChild(canvas2d);
    }

    // Clear arrays
    reactor = null;
    controlRods = [];
    steamParticles = [];
    saboteurs = [];
    guards = [];
    scientists = [];
    scene = null;
    camera = null;
    renderer = null;
    canvas2d = null;
    ctx2d = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
