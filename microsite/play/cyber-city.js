window.CyberCity = (function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // keybind tracking
    cDown: false,
    yDown: false,
    cDownTime: 0,
    yDownTime: 0,
    // hud
    hudEl: null,
    hudVisible: true,
    // hud data
    dataExtracted: 0,
    militiaEliminated: 0,
    militiaTotal: 5,
    droneUptime: 'ACTIVE',
    // tracked objects for dispose
    meshes: [],
    geometries: [],
    materials: [],
    lights: [],
    // animated groups
    drones: [],
    rainParticles: null,
    rainPositions: null,
    rainCount: 0,
    holoDisplays: [],
    militiaSoldiers: [],
    transportPod: null,
    transportPodDir: 1,
    neonSigns: [],
    // resize handler ref
    onResize: null
  };

  // ─── Helper: create tracked BoxGeometry mesh ─────────────────────────────
  function makeBox(w, h, d, colorHex, x, y, z, emissiveHex, emissiveIntensity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var params = { color: colorHex };
    if (emissiveHex !== undefined) {
      params.emissive = emissiveHex;
      params.emissiveIntensity = (emissiveIntensity !== undefined) ? emissiveIntensity : 0.8;
    }
    var mat = new THREE.MeshLambertMaterial(params);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, (y !== undefined) ? y : h / 2, z || 0);
    state.geometries.push(geo);
    state.materials.push(mat);
    state.meshes.push(mesh);
    return mesh;
  }

  // ─── Helper: create tracked CylinderGeometry mesh ───────────────────────
  function makeCylinder(rt, rb, h, segs, colorHex, x, y, z, emissiveHex) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var params = { color: colorHex };
    if (emissiveHex !== undefined) {
      params.emissive = emissiveHex;
      params.emissiveIntensity = 0.9;
    }
    var mat = new THREE.MeshLambertMaterial(params);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, (y !== undefined) ? y : h / 2, z || 0);
    state.geometries.push(geo);
    state.materials.push(mat);
    state.meshes.push(mesh);
    return mesh;
  }

  // ─── Helper: add to scene and track ─────────────────────────────────────
  function add(mesh) {
    state.scene.add(mesh);
    return mesh;
  }

  // ─── Helper: tracked PointLight ─────────────────────────────────────────
  function makeLight(colorHex, intensity, distance, x, y, z) {
    var light = new THREE.PointLight(colorHex, intensity, distance);
    light.position.set(x || 0, (y !== undefined) ? y : 0, z || 0);
    state.lights.push(light);
    state.scene.add(light);
    return light;
  }

  // ─── Build: ambient lighting ─────────────────────────────────────────────
  function buildAmbient() {
    var ambient = new THREE.AmbientLight(0x080818, 0.7);
    state.lights.push(ambient);
    state.scene.add(ambient);
    var dir = new THREE.DirectionalLight(0x112244, 0.4);
    dir.position.set(10, 30, 10);
    state.lights.push(dir);
    state.scene.add(dir);
  }

  // ─── 1. Street surface ───────────────────────────────────────────────────
  function buildStreet() {
    var street = makeBox(160, 1, 160, 0x0d0d12, 0, -0.5, 0);
    add(street);
    // rain-slick puddle strips (emissive)
    var i, strip;
    for (i = 0; i < 18; i++) {
      strip = makeBox(
        2 + Math.random() * 5, 0.02, 0.4 + Math.random() * 0.8,
        0x001122,
        (Math.random() - 0.5) * 80, 0.01, (Math.random() - 0.5) * 80,
        0x002244, 0.5
      );
      add(strip);
    }
  }

  // ─── 2‑4. Skyscrapers A / B / C ─────────────────────────────────────────
  function buildSkyscrapers() {
    var scraperDefs = [
      { w: 10, h: 48, d: 10, x: -30, z: -35, color: 0x101824, neon: 0x00FFEE },
      { w:  8, h: 62, d:  9, x:  32, z: -38, color: 0x180e18, neon: 0xFF0066 },
      { w: 12, h: 38, d: 11, x: -22, z:  25, color: 0x101218, neon: 0xFFAA00 }
    ];
    var i, def, body, strip, winRow, winX, winY, wColor, winMesh;
    for (i = 0; i < scraperDefs.length; i++) {
      def = scraperDefs[i];
      body = makeBox(def.w, def.h, def.d, def.color, def.x, def.h / 2, def.z);
      add(body);
      // emissive neon strip on face
      strip = makeBox(def.w * 0.8, 0.3, 0.2, def.neon, def.x, def.h * 0.55, def.z - def.d / 2 - 0.15, def.neon, 1.2);
      add(strip);
      makeLight(def.neon, 2.0, 22, def.x, def.h * 0.6, def.z);
      // window rows
      for (winRow = 2; winRow < Math.floor(def.h / 4); winRow++) {
        for (winX = -1; winX <= 1; winX++) {
          if (Math.random() > 0.45) {
            wColor = (Math.random() > 0.6) ? 0xFF6633 : 0x3366FF;
            winMesh = makeBox(1.0, 0.6, 0.08, wColor, def.x + winX * 3, winRow * 4 + 1, def.z - def.d / 2 - 0.06, wColor, 0.9);
            add(winMesh);
          }
        }
      }
    }
  }

  // ─── 5. Neon sign billboard ──────────────────────────────────────────────
  function buildNeonBillboard() {
    // Support poles
    var poleL = makeCylinder(0.12, 0.12, 8, 6, 0x222222, -3.5, 4, -14);
    var poleR = makeCylinder(0.12, 0.12, 8, 6, 0x222222,  3.5, 4, -14);
    add(poleL); add(poleR);
    // Main billboard face
    var board = makeBox(9, 3.5, 0.2, 0x0a0a14, 0, 9.5, -14, 0x220044, 0.3);
    add(board);
    // Neon text sphere clusters spelling the sign
    var cols = [0xFF0066, 0x00FFEE, 0xFFAA00, 0x0099FF];
    var i, sx, sphere, sGeo, sMat;
    for (i = 0; i < 14; i++) {
      sx = -3.8 + i * 0.58;
      sGeo = new THREE.SphereGeometry(0.13, 6, 4);
      sMat = new THREE.MeshLambertMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: 1.2 });
      sphere = new THREE.Mesh(sGeo, sMat);
      sphere.position.set(sx, 9.5 + (Math.random() - 0.5) * 0.6, -13.88);
      state.geometries.push(sGeo);
      state.materials.push(sMat);
      state.meshes.push(sphere);
      state.scene.add(sphere);
      state.neonSigns.push({ mesh: sphere, phase: Math.random() * Math.PI * 2, mat: sMat });
    }
    makeLight(0xFF0066, 1.5, 14, 0, 9.5, -13);
  }

  // ─── 6. Corporate militia soldiers (5) ──────────────────────────────────
  function buildMilitiaSoldiers() {
    var positions = [
      { x: -8,  z: -10 }, { x:  8,  z: -10 },
      { x: -12, z:   0 }, { x: 12,  z:   0 },
      { x:   0, z: -20 }
    ];
    var i, pos, body, head;
    state.militiaSoldiers = [];
    for (i = 0; i < positions.length; i++) {
      pos = positions[i];
      body = makeBox(0.7, 1.5, 0.45, 0x141414, pos.x, 0.75, pos.z);
      add(body);
      head = makeBox(0.42, 0.42, 0.42, 0x1a1a1a, pos.x, 1.71, pos.z, 0xFF0000, 0.15);
      add(head);
      // arm left
      var armL = makeBox(0.18, 0.9, 0.18, 0x111111, pos.x - 0.44, 0.9, pos.z);
      add(armL);
      // arm right
      var armR = makeBox(0.18, 0.9, 0.18, 0x111111, pos.x + 0.44, 0.9, pos.z);
      add(armR);
      state.militiaSoldiers.push({
        body: body, head: head,
        baseX: pos.x, baseZ: pos.z,
        patrolAngle: i * (Math.PI * 2 / 5),
        patrolRadius: 3 + Math.random() * 2,
        speed: 0.3 + Math.random() * 0.2
      });
    }
  }

  // ─── 7. Hacker figure crouching by terminal ──────────────────────────────
  function buildHacker() {
    var body = makeBox(0.6, 1.1, 0.38, 0x1a0a2a, 5, 0.55, -6);
    add(body);
    var head = makeBox(0.38, 0.38, 0.38, 0x221133, 5, 1.29, -6, 0x00FFEE, 0.2);
    add(head);
    // terminal box
    var terminal = makeBox(0.55, 0.4, 0.3, 0x0a1a0a, 5.7, 0.2, -6.1, 0x00FF44, 0.9);
    add(terminal);
    makeLight(0x00FFEE, 1.2, 6, 5.5, 0.5, -6);
  }

  // ─── 8. Hovering police drones (3) ──────────────────────────────────────
  function buildDrones() {
    var droneDefs = [
      { x: -5,  y: 8,  z: -12 },
      { x:  6,  y: 10, z: -18 },
      { x:  0,  y: 12, z:   5 }
    ];
    var i, d, body, rotorFL, rotorFR, rotorBL, rotorBR;
    state.drones = [];
    for (i = 0; i < droneDefs.length; i++) {
      d = droneDefs[i];
      body = makeBox(1.2, 0.3, 1.2, 0x1a2233, d.x, d.y, d.z, 0x0066FF, 0.5);
      add(body);
      // rotor arms (flat boxes)
      rotorFL = makeBox(0.6, 0.05, 0.1, 0x334455, d.x - 0.7, d.y + 0.15, d.z - 0.7);
      rotorFR = makeBox(0.6, 0.05, 0.1, 0x334455, d.x + 0.7, d.y + 0.15, d.z - 0.7);
      rotorBL = makeBox(0.6, 0.05, 0.1, 0x334455, d.x - 0.7, d.y + 0.15, d.z + 0.7);
      rotorBR = makeBox(0.6, 0.05, 0.1, 0x334455, d.x + 0.7, d.y + 0.15, d.z + 0.7);
      add(rotorFL); add(rotorFR); add(rotorBL); add(rotorBR);
      // blue warning light
      makeLight(0x0066FF, 1.8, 10, d.x, d.y + 0.4, d.z);
      state.drones.push({
        body: body,
        baseX: d.x, baseY: d.y, baseZ: d.z,
        patrolAngle: i * (Math.PI * 2 / 3),
        patrolRadius: 5 + i * 2,
        hoverPhase: i * 1.1
      });
    }
  }

  // ─── 9. Rain particles (LineSegments) ────────────────────────────────────
  function buildRain() {
    var count = 600;
    var verts = new Float32Array(count * 6); // each raindrop: 2 points × 3 coords
    var i, x, z, y;
    for (i = 0; i < count; i++) {
      x = (Math.random() - 0.5) * 120;
      y = Math.random() * 50;
      z = (Math.random() - 0.5) * 120;
      verts[i * 6 + 0] = x;
      verts[i * 6 + 1] = y;
      verts[i * 6 + 2] = z;
      verts[i * 6 + 3] = x;
      verts[i * 6 + 4] = y - 0.6;
      verts[i * 6 + 5] = z;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x4488BB, transparent: true, opacity: 0.45 });
    var lines = new THREE.LineSegments(geo, mat);
    state.scene.add(lines);
    state.rainParticles = lines;
    state.rainPositions = verts;
    state.rainCount = count;
    state.geometries.push(geo);
    state.materials.push(mat);
    state.meshes.push(lines);
  }

  // ─── 10. Holographic display panels (2) ──────────────────────────────────
  function buildHolographicDisplays() {
    var defs = [
      { x: -6, y: 4.5, z: -8,  color: 0x0088FF, emissive: 0x0088FF },
      { x: 10, y: 3.5, z: -15, color: 0x00FFAA, emissive: 0x00FFAA }
    ];
    var i, def, panel, sub;
    state.holoDisplays = [];
    for (i = 0; i < defs.length; i++) {
      def = defs[i];
      panel = makeBox(2.8, 4, 0.06, def.color, def.x, def.y, def.z, def.emissive, 1.0);
      add(panel);
      sub = makeBox(1.6, 1.0, 0.05, def.color, def.x, def.y - 2.2, def.z, def.emissive, 0.7);
      add(sub);
      makeLight(def.emissive, 1.4, 8, def.x, def.y, def.z);
      state.holoDisplays.push({ panel: panel, sub: sub, phase: i * Math.PI, mat: panel.material, subMat: sub.material });
    }
  }

  // ─── 11. Street barricades (4) ───────────────────────────────────────────
  function buildBarricades() {
    var defs = [
      { x: -4,  z: -4 }, { x:  4,  z: -4 },
      { x: -4,  z:  4 }, { x:  4,  z:  4 }
    ];
    var i, def;
    for (i = 0; i < defs.length; i++) {
      def = defs[i];
      // main barrier
      add(makeBox(2.5, 0.9, 0.4, 0x222222, def.x, 0.45, def.z, 0xFF6600, 0.08));
      // stripe on top
      add(makeBox(2.5, 0.12, 0.42, 0xFF6600, def.x, 0.96, def.z, 0xFF6600, 0.6));
    }
  }

  // ─── 12. Hacked server terminal ──────────────────────────────────────────
  function buildServerTerminal() {
    var base = makeBox(0.8, 1.4, 0.5, 0x0a140a, -10, 0.7, -5);
    add(base);
    var screen = makeBox(0.62, 0.45, 0.05, 0x001800, -10, 1.1, -5.28, 0x00FF44, 1.1);
    add(screen);
    // emissive status indicator sphere
    var sGeo = new THREE.SphereGeometry(0.09, 6, 4);
    var sMat = new THREE.MeshLambertMaterial({ color: 0x00FF44, emissive: 0x00FF44, emissiveIntensity: 1.5 });
    var indicator = new THREE.Mesh(sGeo, sMat);
    indicator.position.set(-10, 1.45, -5.26);
    state.geometries.push(sGeo);
    state.materials.push(sMat);
    state.meshes.push(indicator);
    state.scene.add(indicator);
    makeLight(0x00FF44, 1.0, 5, -10, 1.2, -5);
  }

  // ─── 13. Neon car wreck ──────────────────────────────────────────────────
  function buildCarWreck() {
    // car body
    var body = makeBox(3.8, 0.9, 1.8, 0x1a0808, 8, 0.45, 5);
    add(body);
    // roof (slightly narrower)
    var roof = makeBox(2.4, 0.7, 1.6, 0x140606, 8, 1.25, 5);
    add(roof);
    // emissive headlights
    var hlL = makeBox(0.22, 0.18, 0.08, 0xFF8800, 6.12, 0.5, 4.3, 0xFF8800, 1.4);
    var hlR = makeBox(0.22, 0.18, 0.08, 0xFF8800, 6.12, 0.5, 5.7, 0xFF8800, 1.4);
    add(hlL); add(hlR);
    // red taillight
    var tl = makeBox(0.3, 0.15, 1.4, 0xFF0000, 9.92, 0.5, 5, 0xFF0000, 0.9);
    add(tl);
    makeLight(0xFF8800, 1.2, 7, 6, 0.6, 5);
  }

  // ─── 14. Rooftop sniper position ─────────────────────────────────────────
  function buildSniperPosition() {
    // Flat rooftop platform (on top of a low building)
    var platform = makeBox(6, 0.3, 5, 0x1a1a1a, -18, 5, 8);
    add(platform);
    // building under
    var bldg = makeBox(6, 5, 5, 0x111118, -18, 2.5, 8);
    add(bldg);
    // sandbag barriers
    var sb1 = makeBox(2.5, 0.55, 0.5, 0x3a3020, -18, 5.42, 5.76);
    var sb2 = makeBox(2.5, 0.55, 0.5, 0x2e2818, -20, 5.42, 8);
    var sb3 = makeBox(2.5, 0.55, 0.5, 0x3a3020, -16, 5.42, 8);
    add(sb1); add(sb2); add(sb3);
    // sniper figure
    var sBody = makeBox(0.55, 0.9, 0.38, 0x1a1a0a, -18, 5.75, 6.4);
    var sHead = makeBox(0.34, 0.34, 0.34, 0x151505, -18, 6.37, 6.4);
    add(sBody); add(sHead);
  }

  // ─── 15. Flying transport pod ─────────────────────────────────────────────
  function buildTransportPod() {
    var pod = makeBox(5, 1.4, 2.2, 0x0a1a2a, -40, 20, -10, 0x0066FF, 0.4);
    add(pod);
    // engine glow boxes
    var engL = makeBox(0.5, 0.5, 0.5, 0x0066FF, -42, 19.8, -10, 0x0066FF, 1.2);
    var engR = makeBox(0.5, 0.5, 0.5, 0x0066FF, -38, 19.8, -10, 0x0066FF, 1.2);
    add(engL); add(engR);
    makeLight(0x0066FF, 2.0, 12, -40, 19.5, -10);
    state.transportPod = pod;
    state.transportPodDir = 1;
  }

  // ─── 16. Street lamp with neon glow ─────────────────────────────────────
  function buildStreetLamps() {
    var positions = [
      { x: -10, z: -8 }, { x: 10, z: -8 },
      { x: -10, z: 10 }, { x: 10, z: 10 }
    ];
    var i, pos, pole, glowSphere, sGeo, sMat;
    for (i = 0; i < positions.length; i++) {
      pos = positions[i];
      pole = makeCylinder(0.06, 0.08, 5, 6, 0x1a1a22, pos.x, 2.5, pos.z);
      add(pole);
      // arm
      var arm = makeBox(0.8, 0.08, 0.08, 0x1a1a22, pos.x, 5.12, pos.z - 0.4);
      add(arm);
      // emissive glow sphere
      sGeo = new THREE.SphereGeometry(0.2, 8, 6);
      sMat = new THREE.MeshLambertMaterial({ color: 0xFF44AA, emissive: 0xFF44AA, emissiveIntensity: 1.5 });
      glowSphere = new THREE.Mesh(sGeo, sMat);
      glowSphere.position.set(pos.x, 5.3, pos.z - 0.4);
      state.geometries.push(sGeo);
      state.materials.push(sMat);
      state.meshes.push(glowSphere);
      state.scene.add(glowSphere);
      makeLight(0xFF44AA, 1.5, 12, pos.x, 5.3, pos.z - 0.4);
    }
  }

  // ─── 17. Manhole cover breach ─────────────────────────────────────────────
  function buildManholeBreaches() {
    var holes = [
      { x: 2,  z: 8  },
      { x: -6, z: 12 }
    ];
    var i, h, cover, glow, sGeo, sMat;
    for (i = 0; i < holes.length; i++) {
      h = holes[i];
      // dark cover box with gap
      cover = makeBox(0.85, 0.06, 0.85, 0x1a1a1a, h.x, 0.03, h.z);
      add(cover);
      // emissive light from below (flat glowing box slightly under surface level)
      glow = makeBox(0.6, 0.04, 0.6, 0xFF6600, h.x, 0.0, h.z, 0xFF6600, 1.8);
      add(glow);
      // ambient glow light
      makeLight(0xFF6600, 1.4, 4, h.x, 0.5, h.z);
      // sewer steam sphere
      sGeo = new THREE.SphereGeometry(0.18, 6, 4);
      sMat = new THREE.MeshLambertMaterial({ color: 0x334455, emissive: 0x112233, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
      var steam = new THREE.Mesh(sGeo, sMat);
      steam.position.set(h.x, 0.5, h.z);
      state.geometries.push(sGeo);
      state.materials.push(sMat);
      state.meshes.push(steam);
      state.scene.add(steam);
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────
  function buildHUD() {
    var el = document.createElement('div');
    el.id = 'cyber-city-hud';
    el.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:1000',
      'background:rgba(0,4,12,0.85)',
      'color:#00FFEE',
      'font-family:monospace',
      'font-size:13px',
      'padding:7px 18px',
      'border:1px solid #0055FF',
      'white-space:nowrap',
      'pointer-events:none',
      'letter-spacing:1px',
      'text-shadow:0 0 6px #00FFEE'
    ].join(';');
    document.body.appendChild(el);
    state.hudEl = el;
    refreshHUD();
  }

  function refreshHUD() {
    if (!state.hudEl) return;
    state.hudEl.textContent =
      'DATA EXTRACTED: ' + state.dataExtracted + '%' +
      '   |   MILITIA ELIMINATED: ' + state.militiaEliminated + '/' + state.militiaTotal +
      '   |   DRONE UPTIME: ' + state.droneUptime +
      '   [C+Y: TOGGLE]';
  }

  // ─── Keybind: C then Y within 400ms toggles HUD ──────────────────────────
  function setupKeybinds() {
    document.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      var now = performance.now();
      if (k === 'c') { state.cDown = true; state.cDownTime = now; }
      if (k === 'y') { state.yDown = true; state.yDownTime = now; }
      if (state.cDown && state.yDown) {
        if (Math.abs(state.cDownTime - state.yDownTime) < 400) {
          toggleHUD();
        }
      }
    });
    document.addEventListener('keyup', function (e) {
      var k = e.key.toLowerCase();
      if (k === 'c') { state.cDown = false; }
      if (k === 'y') { state.yDown = false; }
    });
  }

  function toggleHUD() {
    if (!state.hudEl) return;
    state.hudVisible = !state.hudVisible;
    state.hudEl.style.display = state.hudVisible ? '' : 'none';
  }

  // ─── Scene init ───────────────────────────────────────────────────────────
  function initScene() {
    var T = window.THREE;
    if (!T) { console.warn('CyberCity: THREE not found'); return false; }

    state.scene = new T.Scene();
    state.scene.background = new T.Color(0x010208);
    state.scene.fog = new T.FogExp2(0x030614, 0.018);

    state.camera = new T.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);
    state.camera.position.set(0, 6, 20);
    state.camera.lookAt(0, 2, 0);

    state.renderer = new T.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.domElement.id = 'cyber-city-canvas';
    state.renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:900;';
    document.body.appendChild(state.renderer.domElement);

    buildAmbient();
    buildStreet();
    buildSkyscrapers();
    buildNeonBillboard();
    buildMilitiaSoldiers();
    buildHacker();
    buildDrones();
    buildRain();
    buildHolographicDisplays();
    buildBarricades();
    buildServerTerminal();
    buildCarWreck();
    buildSniperPosition();
    buildTransportPod();
    buildStreetLamps();
    buildManholeBreaches();
    buildHUD();

    state.onResize = function () {
      if (!state.renderer || !state.camera) return;
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', state.onResize);

    return true;
  }

  // ─── Animation: rain ─────────────────────────────────────────────────────
  function updateRain(dt) {
    if (!state.rainParticles || !state.rainPositions) return;
    var verts = state.rainPositions;
    var count = state.rainCount;
    var speed = 18 * dt;
    var i;
    for (i = 0; i < count; i++) {
      verts[i * 6 + 1] -= speed;
      verts[i * 6 + 4] -= speed;
      if (verts[i * 6 + 1] < 0) {
        verts[i * 6 + 1] = 50 + Math.random() * 5;
        verts[i * 6 + 4] = verts[i * 6 + 1] - 0.6;
      }
    }
    state.rainParticles.geometry.attributes.position.needsUpdate = true;
  }

  // ─── Animation: holographic displays pulse ───────────────────────────────
  function updateHoloDisplays(dt) {
    var i, hd, t, intensity;
    for (i = 0; i < state.holoDisplays.length; i++) {
      hd = state.holoDisplays[i];
      hd.phase += dt * 2.2;
      intensity = 0.5 + 0.5 * Math.sin(hd.phase);
      hd.mat.emissiveIntensity = intensity;
      hd.subMat.emissiveIntensity = intensity * 0.7;
    }
  }

  // ─── Animation: militia soldiers patrol ──────────────────────────────────
  function updateMilitia(dt) {
    var i, s;
    for (i = 0; i < state.militiaSoldiers.length; i++) {
      s = state.militiaSoldiers[i];
      s.patrolAngle += dt * s.speed;
      var nx = s.baseX + Math.cos(s.patrolAngle) * s.patrolRadius;
      var nz = s.baseZ + Math.sin(s.patrolAngle) * s.patrolRadius;
      s.body.position.x = nx;
      s.body.position.z = nz;
      s.head.position.x = nx;
      s.head.position.z = nz;
    }
  }

  // ─── Animation: drone hovering + patrol ──────────────────────────────────
  function updateDrones(dt) {
    var i, d, nx, nz, ny;
    for (i = 0; i < state.drones.length; i++) {
      d = state.drones[i];
      d.patrolAngle += dt * 0.5;
      d.hoverPhase += dt * 1.8;
      nx = d.baseX + Math.cos(d.patrolAngle) * d.patrolRadius;
      nz = d.baseZ + Math.sin(d.patrolAngle) * d.patrolRadius;
      ny = d.baseY + Math.sin(d.hoverPhase) * 0.4;
      d.body.position.x = nx;
      d.body.position.z = nz;
      d.body.position.y = ny;
    }
  }

  // ─── Animation: transport pod crosses overhead ────────────────────────────
  function updateTransportPod(dt) {
    if (!state.transportPod) return;
    state.transportPod.position.x += state.transportPodDir * 8 * dt;
    if (state.transportPod.position.x > 60) { state.transportPodDir = -1; }
    if (state.transportPod.position.x < -60) { state.transportPodDir = 1; }
  }

  // ─── Animation: neon sign flicker ────────────────────────────────────────
  function updateNeonSigns(dt) {
    var i, ns, t;
    for (i = 0; i < state.neonSigns.length; i++) {
      ns = state.neonSigns[i];
      ns.phase += dt * (3 + i * 0.3);
      t = Math.sin(ns.phase);
      // occasional hard blink
      if (Math.sin(ns.phase * 7.3) > 0.92) {
        ns.mat.emissiveIntensity = 0;
      } else {
        ns.mat.emissiveIntensity = 0.7 + 0.5 * t;
      }
    }
  }

  // ─── Main loop ────────────────────────────────────────────────────────────
  function loop() {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(loop);
    var now = performance.now();
    var dt = Math.min((now - state.lastTime) / 1000, 0.1);
    state.lastTime = now;

    updateRain(dt);
    updateHoloDisplays(dt);
    updateMilitia(dt);
    updateDrones(dt);
    updateTransportPod(dt);
    updateNeonSigns(dt);

    // gentle camera orbit for passive scene view
    var angle = now * 0.00015;
    state.camera.position.x = Math.sin(angle) * 22;
    state.camera.position.z = Math.cos(angle) * 22;
    state.camera.lookAt(0, 3, -5);

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Public: init ─────────────────────────────────────────────────────────
  function init() {
    if (state.active) return;
    if (!window.THREE) { console.warn('CyberCity: THREE.js not loaded'); return; }
    state.active = true;
    if (!initScene()) { state.active = false; return; }
    setupKeybinds();
    state.lastTime = performance.now();
    loop();
  }

  // ─── Public: update (called by host if needed) ────────────────────────────
  function update(dt) {
    if (!state.active) return;
    updateRain(dt);
    updateHoloDisplays(dt);
    updateMilitia(dt);
    updateDrones(dt);
    updateTransportPod(dt);
    updateNeonSigns(dt);
  }

  // ─── Public: reset / dispose ──────────────────────────────────────────────
  function reset() {
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    // remove canvas
    var canvas = document.getElementById('cyber-city-canvas');
    if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }

    // remove hud
    var hud = document.getElementById('cyber-city-hud');
    if (hud && hud.parentNode) { hud.parentNode.removeChild(hud); }

    // dispose geometries
    var i;
    for (i = 0; i < state.geometries.length; i++) {
      if (state.geometries[i] && state.geometries[i].dispose) {
        state.geometries[i].dispose();
      }
    }
    // dispose materials
    for (i = 0; i < state.materials.length; i++) {
      if (state.materials[i] && state.materials[i].dispose) {
        state.materials[i].dispose();
      }
    }
    // dispose renderer
    if (state.renderer) {
      state.renderer.dispose();
      state.renderer = null;
    }

    // remove resize listener
    if (state.onResize) {
      window.removeEventListener('resize', state.onResize);
      state.onResize = null;
    }

    // clear scene ref
    state.scene = null;
    state.camera = null;
    state.meshes = [];
    state.geometries = [];
    state.materials = [];
    state.lights = [];
    state.drones = [];
    state.rainParticles = null;
    state.rainPositions = null;
    state.holoDisplays = [];
    state.militiaSoldiers = [];
    state.neonSigns = [];
    state.transportPod = null;
    state.hudEl = null;
    state.hudVisible = true;
    state.dataExtracted = 0;
    state.militiaEliminated = 0;
    state.droneUptime = 'ACTIVE';
    state.cDown = false;
    state.yDown = false;
  }

  return { init: init, update: update, reset: reset };

}());
