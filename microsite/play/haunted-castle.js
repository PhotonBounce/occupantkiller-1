window.HauntedCastle = (function() {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    player: null,

    // Haunted castle objects
    outerWalls: [],
    battlements: [],
    greatHallColumns: [],
    armorSuits: [],
    dungeonBars: [],
    drawbridge: null,
    moatWater: null,
    portcullis: null,
    tortureInstruments: [],
    bookcase: null,
    cryptStairs: null,
    fireplace: null,
    chandeliers: [],
    weaponsRack: null,
    throne: null,

    // Animation state
    drawbridgeAngle: 0,
    drawbridgeDirection: -1,        // -1 = lowering, 1 = raising
    torchFlickerPhase: 0,
    armorRotationPhases: [],
    chandelierSwayPhase: 0,
    moatRipplePhase: 0,
    portcullisHeight: 0,            // 0 = fully down, 1 = fully up
    portcullisDirection: 1,         // 1 = raising, -1 = lowering
    fireflamePhase: 0,

    // HUD
    hudElement: null,

    // Internals
    elapsedTime: 0
  };

  // ─── Constants ────────────────────────────────────────────────────────────
  var DRAWBRIDGE_ANGLE_MAX = Math.PI / 3;  // ~60 degrees
  var DRAWBRIDGE_SPEED     = 0.5;          // radians per second
  var TORCH_FLICKER_SPEED  = 8;            // cycles per second
  var ARMOR_ROTATION_SPEED = 0.3;          // radians per second
  var CHANDELIER_SWAY_SPEED = 1.5;         // oscillations per second
  var CHANDELIER_SWAY_ANGLE = 0.4;         // radians
  var MOAT_RIPPLE_SPEED    = 2;            // cycles per second
  var PORTCULLIS_SPEED     = 0.8;          // units per second
  var FIREFLAME_FLICKER    = 6;            // cycles per second

  // Colors
  var DARK_STONE   = 0x333333;
  var TORCH_FLAME  = 0xFF6600;
  var GOLD_TRIM    = 0xCCCC88;
  var MOAT_BLUE    = 0x1133AA;
  var IRON_GRAY    = 0x666666;

  // ─── Initialization ───────────────────────────────────────────────────────
  function activateCastle() {
    if (!state.scene) { return; }
    state.active = true;

    // Set atmospheric fog
    var oldFog = state.scene.fog;
    state.scene.fog = new THREE.FogExp2(0x000000, 0.015);

    // Ambient light - dim, cold castle atmosphere
    var ambLight = new THREE.AmbientLight(0x1A2A4A, 0.4);
    state.scene.add(ambLight);

    // Directional light - from castle's torch fires
    var dirLight = new THREE.DirectionalLight(0xFF8844, 0.6);
    dirLight.position.set(20, 15, -20);
    state.scene.add(dirLight);

    // Build castle elements
    buildOuterWalls();
    buildBattlements();
    buildGreatHall();
    buildArmorSuits();
    buildDungeonCells();
    buildDrawbridge();
    buildMoat();
    buildPortcullis();
    buildTortureChamber();
    buildBookcaseWall();
    buildCryptStairway();
    buildFireplace();
    buildChandeliers();
    buildWeaponsRack();
    buildThrone();

    createHUD();
  }

  function deactivateCastle() {
    if (!state.scene) { return; }
    state.active = false;

    // Remove all castle meshes
    var i;
    for (i = 0; i < state.outerWalls.length; i++) {
      state.scene.remove(state.outerWalls[i]);
    }
    state.outerWalls = [];

    for (i = 0; i < state.battlements.length; i++) {
      state.scene.remove(state.battlements[i]);
    }
    state.battlements = [];

    for (i = 0; i < state.greatHallColumns.length; i++) {
      state.scene.remove(state.greatHallColumns[i]);
    }
    state.greatHallColumns = [];

    for (i = 0; i < state.armorSuits.length; i++) {
      state.scene.remove(state.armorSuits[i]);
    }
    state.armorSuits = [];
    state.armorRotationPhases = [];

    for (i = 0; i < state.dungeonBars.length; i++) {
      state.scene.remove(state.dungeonBars[i]);
    }
    state.dungeonBars = [];

    if (state.drawbridge) {
      state.scene.remove(state.drawbridge);
      state.drawbridge = null;
    }

    if (state.moatWater) {
      state.scene.remove(state.moatWater);
      state.moatWater = null;
    }

    if (state.portcullis) {
      state.scene.remove(state.portcullis);
      state.portcullis = null;
    }

    for (i = 0; i < state.tortureInstruments.length; i++) {
      state.scene.remove(state.tortureInstruments[i]);
    }
    state.tortureInstruments = [];

    if (state.bookcase) {
      state.scene.remove(state.bookcase);
      state.bookcase = null;
    }

    if (state.cryptStairs) {
      state.scene.remove(state.cryptStairs);
      state.cryptStairs = null;
    }

    if (state.fireplace) {
      state.scene.remove(state.fireplace);
      state.fireplace = null;
    }

    for (i = 0; i < state.chandeliers.length; i++) {
      state.scene.remove(state.chandeliers[i]);
    }
    state.chandeliers = [];

    if (state.weaponsRack) {
      state.scene.remove(state.weaponsRack);
      state.weaponsRack = null;
    }

    if (state.throne) {
      state.scene.remove(state.throne);
      state.throne = null;
    }

    // Reset animation phases
    state.drawbridgeAngle = 0;
    state.drawbridgeDirection = -1;
    state.torchFlickerPhase = 0;
    state.armorRotationPhases = [];
    state.chandelierSwayPhase = 0;
    state.moatRipplePhase = 0;
    state.portcullisHeight = 0;
    state.portcullisDirection = 1;
    state.fireflamePhase = 0;
  }

  // ─── Castle Structure Builders ─────────────────────────────────────────────

  function buildOuterWalls() {
    // Four massive outer walls (dark stone)
    var thickness = 2;
    var height = 25;

    // North wall
    var northGeo = new THREE.BoxGeometry(80, height, thickness);
    var stoneMat = new THREE.MeshLambertMaterial({ color: DARK_STONE });
    var northWall = new THREE.Mesh(northGeo, stoneMat);
    northWall.position.set(0, height / 2, -40);
    state.scene.add(northWall);
    state.outerWalls.push(northWall);

    // South wall
    var southWall = new THREE.Mesh(northGeo, stoneMat);
    southWall.position.set(0, height / 2, 40);
    state.scene.add(southWall);
    state.outerWalls.push(southWall);

    // East wall
    var eastGeo = new THREE.BoxGeometry(thickness, height, 80);
    var eastWall = new THREE.Mesh(eastGeo, stoneMat);
    eastWall.position.set(40, height / 2, 0);
    state.scene.add(eastWall);
    state.outerWalls.push(eastWall);

    // West wall
    var westWall = new THREE.Mesh(eastGeo, stoneMat);
    westWall.position.set(-40, height / 2, 0);
    state.scene.add(westWall);
    state.outerWalls.push(westWall);
  }

  function buildBattlements() {
    // Merlons (square crenellations) along top of walls
    var merlon = new THREE.BoxGeometry(3, 4, 2);
    var stoneMat = new THREE.MeshLambertMaterial({ color: DARK_STONE });

    var merlonCount = 12;
    var i;
    for (i = 0; i < merlonCount; i++) {
      var spacing = 80 / merlonCount;
      var merlonMesh = new THREE.Mesh(merlon, stoneMat);
      merlonMesh.position.set(-40 + i * spacing, 27, -41);
      state.scene.add(merlonMesh);
      state.battlements.push(merlonMesh);
    }
  }

  function buildGreatHall() {
    // Four columns in great hall
    var colGeo = new THREE.CylinderGeometry(2, 2, 20, 8);
    var stoneMat = new THREE.MeshLambertMaterial({ color: DARK_STONE });

    var positions = [
      [-15, 10, -15],
      [15, 10, -15],
      [-15, 10, 15],
      [15, 10, 15]
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var col = new THREE.Mesh(colGeo, stoneMat);
      col.position.set(positions[i][0], positions[i][1], positions[i][2]);
      state.scene.add(col);
      state.greatHallColumns.push(col);
    }
  }

  function buildArmorSuits() {
    // Suits of armor on stands (cylinder + box shapes)
    var armorCount = 5;
    var i;

    for (i = 0; i < armorCount; i++) {
      var group = new THREE.Group();
      var x = -20 + i * 10;
      var z = 10;
      group.position.set(x, 0, z);

      // Armor stand base (cylinder)
      var standGeo = new THREE.CylinderGeometry(0.8, 1, 1, 6);
      var ironMat = new THREE.MeshLambertMaterial({ color: IRON_GRAY });
      var stand = new THREE.Mesh(standGeo, ironMat);
      stand.position.y = 0.5;
      group.add(stand);

      // Torso (large box)
      var torsoGeo = new THREE.BoxGeometry(1.2, 2, 0.7);
      var torso = new THREE.Mesh(torsoGeo, ironMat);
      torso.position.y = 2.5;
      group.add(torso);

      // Helmet (small box on top)
      var helmetGeo = new THREE.BoxGeometry(0.9, 1, 0.9);
      var helmet = new THREE.Mesh(helmetGeo, ironMat);
      helmet.position.y = 4;
      group.add(helmet);

      state.scene.add(group);
      state.armorSuits.push(group);
      state.armorRotationPhases.push(0);
    }
  }

  function buildDungeonCells() {
    // Prison cells with bars (LineSegments)
    var cellCount = 4;
    var i, j;

    for (i = 0; i < cellCount; i++) {
      var x = -15 + i * 10;
      var z = -15;

      // Create cell bars using LineSegments
      var points = [];
      var barSpacing = 1.5;
      var barHeight = 4;

      // Vertical bars
      for (j = 0; j < 5; j++) {
        var bx = x - 2.5 + j * barSpacing;
        points.push(new THREE.Vector3(bx, 0.5, z));
        points.push(new THREE.Vector3(bx, 0.5 + barHeight, z));
      }

      // Horizontal bars (top and middle)
      for (j = 0; j < 2; j++) {
        var by = 0.5 + (j + 1) * 2;
        points.push(new THREE.Vector3(x - 2.5, by, z));
        points.push(new THREE.Vector3(x + 2.5, by, z));
      }

      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var mat = new THREE.LineBasicMaterial({ color: IRON_GRAY, linewidth: 2 });
      var bars = new THREE.LineSegments(geo, mat);
      state.scene.add(bars);
      state.dungeonBars.push(bars);
    }
  }

  function buildDrawbridge() {
    // Drawbridge - flat box that rotates
    var drawGeo = new THREE.BoxGeometry(20, 0.8, 8);
    var woodMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    state.drawbridge = new THREE.Mesh(drawGeo, woodMat);
    state.drawbridge.position.set(0, 2, -35);
    // Store original position for rotation pivot
    state.drawbridge.userData.pivotZ = -35;
    state.drawbridge.userData.pivotX = 0;
    state.scene.add(state.drawbridge);
  }

  function buildMoat() {
    // Moat water surface
    var moatGeo = new THREE.BoxGeometry(85, 1, 50);
    var waterMat = new THREE.MeshLambertMaterial({
      color: MOAT_BLUE,
      transparent: true,
      opacity: 0.6
    });
    state.moatWater = new THREE.Mesh(moatGeo, waterMat);
    state.moatWater.position.set(0, -8, 0);
    state.scene.add(state.moatWater);
  }

  function buildPortcullis() {
    // Portcullis grate (LineSegments)
    var points = [];
    var gridSize = 12;
    var gridSpacing = 1.5;
    var gateHeight = 8;
    var gateWidth = 20;

    // Vertical bars
    var i;
    for (i = 0; i < gridSize; i++) {
      var x = -gateWidth / 2 + i * gridSpacing;
      points.push(new THREE.Vector3(x, 2, -38));
      points.push(new THREE.Vector3(x, 2 + gateHeight, -38));
    }

    // Horizontal bars
    var barCount = 6;
    for (i = 0; i < barCount; i++) {
      var y = 2 + i * (gateHeight / (barCount - 1));
      points.push(new THREE.Vector3(-gateWidth / 2, y, -38));
      points.push(new THREE.Vector3(gateWidth / 2, y, -38));
    }

    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: IRON_GRAY, linewidth: 3 });
    state.portcullis = new THREE.LineSegments(geo, mat);
    state.portcullis.position.y = 0;
    state.scene.add(state.portcullis);
  }

  function buildTorturechamber() {
    // Torture instruments - various ominous shapes
    var tortureCount = 4;
    var i;

    for (i = 0; i < tortureCount; i++) {
      var x = -10 + i * 7;
      var z = -25;

      // Rack-like torture device (elongated box)
      var rackGeo = new THREE.BoxGeometry(4, 1.5, 0.5);
      var ironMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var rack = new THREE.Mesh(rackGeo, ironMat);
      rack.position.set(x, 1, z);
      state.scene.add(rack);
      state.tortureInstruments.push(rack);

      // Vertical post
      var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
      var post = new THREE.Mesh(postGeo, ironMat);
      post.position.set(x, 2, z);
      state.scene.add(post);
      state.tortureInstruments.push(post);
    }
  }

  function buildBookcaseWall() {
    // Bookcase with hidden door gap
    var bookGeo = new THREE.BoxGeometry(8, 6, 1.2);
    var brownMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    state.bookcase = new THREE.Mesh(bookGeo, brownMat);
    state.bookcase.position.set(-35, 3, -5);
    state.scene.add(state.bookcase);
  }

  function buildCryptStairway() {
    // Stairway descending to crypt (stepped boxes)
    var stairCount = 5;
    var i;

    for (i = 0; i < stairCount; i++) {
      var stepGeo = new THREE.BoxGeometry(10, 0.6, 2);
      var stoneMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
      var step = new THREE.Mesh(stepGeo, stoneMat);
      step.position.set(30, 4 - i * 1.5, -10 - i * 2);
      state.scene.add(step);
      if (!state.cryptStairs) {
        state.cryptStairs = [];
      }
      if (!Array.isArray(state.cryptStairs)) {
        state.cryptStairs = [state.cryptStairs];
      }
    }
  }

  function buildFireplace() {
    // Stone fireplace structure
    var fireGeo = new THREE.BoxGeometry(6, 8, 1.5);
    var stoneMat = new THREE.MeshLambertMaterial({ color: DARK_STONE });
    state.fireplace = new THREE.Mesh(fireGeo, stoneMat);
    state.fireplace.position.set(-25, 4, 20);
    state.scene.add(state.fireplace);

    // Inner fire glow (sphere)
    var flameGeo = new THREE.SphereGeometry(2, 8, 8);
    var flameMat = new THREE.MeshBasicMaterial({ color: TORCH_FLAME });
    var flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(-25, 3, 20.5);
    flame.scale.set(1, 1.5, 0.3);
    state.scene.add(flame);
  }

  function buildChandeliers() {
    // Hanging chandeliers
    var chandelierCount = 3;
    var i, j;

    for (i = 0; i < chandelierCount; i++) {
      var group = new THREE.Group();
      var x = -15 + i * 15;
      var z = 0;
      group.position.set(x, 18, z);

      // Main chandelier body (sphere)
      var bodyGeo = new THREE.SphereGeometry(1.2, 8, 8);
      var goldMat = new THREE.MeshLambertMaterial({ color: GOLD_TRIM });
      var body = new THREE.Mesh(bodyGeo, goldMat);
      group.add(body);

      // Candle holders (small cylinders hanging down)
      var candleCount = 6;
      for (j = 0; j < candleCount; j++) {
        var angle = (j / candleCount) * Math.PI * 2;
        var candleX = Math.cos(angle) * 1.5;
        var candleZ = Math.sin(angle) * 1.5;

        var candleGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6);
        var candle = new THREE.Mesh(candleGeo, goldMat);
        candle.position.set(candleX, -1.5, candleZ);
        group.add(candle);

        // Flame (small sphere)
        var flameGeo = new THREE.SphereGeometry(0.25, 4, 4);
        var flameMat = new THREE.MeshBasicMaterial({ color: TORCH_FLAME });
        var flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(candleX, -0.8, candleZ);
        group.add(flame);
      }

      state.scene.add(group);
      state.chandeliers.push(group);
    }
  }

  function buildWeaponsRack() {
    // Weapons rack display
    var rackGeo = new THREE.BoxGeometry(6, 5, 0.5);
    var woodMat = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
    state.weaponsRack = new THREE.Mesh(rackGeo, woodMat);
    state.weaponsRack.position.set(25, 3, -20);
    state.scene.add(state.weaponsRack);

    // Swords (boxes) on rack
    var swordCount = 4;
    var i;
    for (i = 0; i < swordCount; i++) {
      var swordGeo = new THREE.BoxGeometry(0.2, 2, 3);
      var ironMat = new THREE.MeshLambertMaterial({ color: GOLD_TRIM });
      var sword = new THREE.Mesh(swordGeo, ironMat);
      sword.position.set(25 - 1.5 + i * 1, 3 + 1.5, -20);
      state.scene.add(sword);
    }
  }

  function buildThrone() {
    // Throne structure
    var seatGeo = new THREE.BoxGeometry(4, 1, 3);
    var goldMat = new THREE.MeshLambertMaterial({ color: GOLD_TRIM });
    state.throne = new THREE.Mesh(seatGeo, goldMat);
    state.throne.position.set(0, 1.5, 25);
    state.scene.add(state.throne);

    // Throne backrest
    var backGeo = new THREE.BoxGeometry(4, 5, 0.5);
    var back = new THREE.Mesh(backGeo, goldMat);
    back.position.set(0, 4, 23);
    state.scene.add(back);

    // Throne armrests
    var armGeo = new THREE.BoxGeometry(0.8, 2, 1.5);
    var armL = new THREE.Mesh(armGeo, goldMat);
    armL.position.set(-2.2, 2.5, 25);
    state.scene.add(armL);

    var armR = new THREE.Mesh(armGeo, goldMat);
    armR.position.set(2.2, 2.5, 25);
    state.scene.add(armR);
  }

  // ─── Animation Updates ────────────────────────────────────────────────────

  function updateDrawbridge(delta) {
    if (!state.drawbridge) { return; }

    // Cycle drawbridge up and down
    state.drawbridgeAngle += DRAWBRIDGE_SPEED * state.drawbridgeDirection * delta;

    if (state.drawbridgeAngle >= DRAWBRIDGE_ANGLE_MAX) {
      state.drawbridgeAngle = DRAWBRIDGE_ANGLE_MAX;
      state.drawbridgeDirection = -1;
    } else if (state.drawbridgeAngle <= 0) {
      state.drawbridgeAngle = 0;
      state.drawbridgeDirection = 1;
    }

    // Apply rotation around pivot point
    state.drawbridge.quaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      state.drawbridgeAngle
    );
    state.drawbridge.position.set(0, 2 + Math.sin(state.drawbridgeAngle) * 3, -35 - Math.cos(state.drawbridgeAngle) * 2 + 2);
  }

  function updateTorchFlickering(delta) {
    state.torchFlickerPhase += TORCH_FLICKER_SPEED * delta;
    if (state.torchFlickerPhase > Math.PI * 2) {
      state.torchFlickerPhase -= Math.PI * 2;
    }

    // Modulate all flame objects' brightness
    var flickerIntensity = 0.7 + Math.sin(state.torchFlickerPhase * 3) * 0.3;
    // This would require access to materials; approximate with position jitter instead
  }

  function updateArmorRotation(delta) {
    var i;
    for (i = 0; i < state.armorSuits.length; i++) {
      state.armorRotationPhases[i] += ARMOR_ROTATION_SPEED * delta;
      if (state.armorRotationPhases[i] > Math.PI * 2) {
        state.armorRotationPhases[i] -= Math.PI * 2;
      }

      // Eerie slow rotation around Y axis
      state.armorSuits[i].rotation.y = Math.sin(state.armorRotationPhases[i] / 4) * 0.3;
    }
  }

  function updateChandelierSway(delta) {
    state.chandelierSwayPhase += CHANDELIER_SWAY_SPEED * delta;
    if (state.chandelierSwayPhase > Math.PI * 2) {
      state.chandelierSwayPhase -= Math.PI * 2;
    }

    var sway = Math.sin(state.chandelierSwayPhase) * CHANDELIER_SWAY_ANGLE;
    var i;
    for (i = 0; i < state.chandeliers.length; i++) {
      state.chandeliers[i].rotation.z = sway;
    }
  }

  function updateMoatRipple(delta) {
    state.moatRipplePhase += MOAT_RIPPLE_SPEED * delta;
    if (state.moatRipplePhase > Math.PI * 2) {
      state.moatRipplePhase -= Math.PI * 2;
    }

    // Subtle Y position ripple
    if (state.moatWater) {
      state.moatWater.position.y = -8 + Math.sin(state.moatRipplePhase) * 0.3;
    }
  }

  function updatePortcullis(delta) {
    if (!state.portcullis) { return; }

    // Portcullis slowly raises and lowers
    state.portcullisHeight += PORTCULLIS_SPEED * state.portcullisDirection * delta;

    if (state.portcullisHeight >= 5) {
      state.portcullisHeight = 5;
      state.portcullisDirection = -1;
    } else if (state.portcullisHeight <= 0) {
      state.portcullisHeight = 0;
      state.portcullisDirection = 1;
    }

    state.portcullis.position.y = state.portcullisHeight;
  }

  function updateFireplaceFlames(delta) {
    state.fireflamePhase += FIREFLAME_FLICKER * delta;
    if (state.fireflamePhase > Math.PI * 2) {
      state.fireflamePhase -= Math.PI * 2;
    }

    // Subtle dancing effect - would animate height/scale if we had material access
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  function createHUD() {
    if (state.hudElement) { return; }
    var el = document.createElement('div');
    el.id = 'haunted-castle-hud';
    el.style.position = 'fixed';
    el.style.top = '16px';
    el.style.left = '16px';
    el.style.color = '#FF8844';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '14px';
    el.style.background = 'rgba(20, 20, 20, 0.7)';
    el.style.padding = '8px 14px';
    el.style.borderRadius = '4px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.whiteSpace = 'nowrap';
    el.style.display = 'none';
    el.style.border = '2px solid #666666';
    document.body.appendChild(el);
    state.hudElement = el;
  }

  function updateHUD() {
    if (!state.hudElement) { return; }
    if (!state.active) {
      state.hudElement.style.display = 'none';
      return;
    }
    state.hudElement.style.display = 'block';
    var drawbridgeState = state.drawbridgeDirection === -1 ? 'LOWERING' : 'RAISING';
    var portcullisState = state.portcullisDirection === 1 ? 'RAISING' : 'LOWERING';
    state.hudElement.textContent =
      'HAUNTED CASTLE | DRAWBRIDGE: ' + drawbridgeState +
      ' | PORTCULLIS: ' + portcullisState +
      ' | CURSE LEVEL: ' + Math.round(state.elapsedTime * 10) % 100;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  function init(scene, camera) {
    state.scene = scene;
    state.camera = camera;

    // Keyboard toggle for castle mode (H+K)
    document.addEventListener('keydown', function(e) {
      var key = e.key ? e.key.toLowerCase() : '';
      if (key === 'h' || key === 'k') {
        if (state.active) {
          deactivateCastle();
        } else {
          activateCastle();
        }
      }
    });

    updateHUD();
  }

  function update(delta) {
    if (!delta || delta <= 0) { delta = 0.016; }
    state.elapsedTime += delta;

    if (!state.active) { return; }

    // Update all animations
    updateDrawbridge(delta);
    updateTorchFlickering(delta);
    updateArmorRotation(delta);
    updateChandelierSway(delta);
    updateMoatRipple(delta);
    updatePortcullis(delta);
    updateFireplaceFlames(delta);

    // Update HUD
    updateHUD();
  }

  function reset() {
    // Deactivate if active
    if (state.active) { deactivateCastle(); }

    // Remove HUD
    if (state.hudElement && state.hudElement.parentNode) {
      state.hudElement.parentNode.removeChild(state.hudElement);
      state.hudElement = null;
    }

    // Reset state
    state.active = false;
    state.scene = null;
    state.camera = null;
    state.player = null;
    state.outerWalls = [];
    state.battlements = [];
    state.greatHallColumns = [];
    state.armorSuits = [];
    state.dungeonBars = [];
    state.drawbridge = null;
    state.moatWater = null;
    state.portcullis = null;
    state.tortureInstruments = [];
    state.bookcase = null;
    state.cryptStairs = null;
    state.fireplace = null;
    state.chandeliers = [];
    state.weaponsRack = null;
    state.throne = null;
    state.drawbridgeAngle = 0;
    state.drawbridgeDirection = -1;
    state.torchFlickerPhase = 0;
    state.armorRotationPhases = [];
    state.chandelierSwayPhase = 0;
    state.moatRipplePhase = 0;
    state.portcullisHeight = 0;
    state.portcullisDirection = 1;
    state.fireflamePhase = 0;
    state.elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getState: function() { return state; },
    activate: function() { activateCastle(); },
    deactivate: function() { deactivateCastle(); }
  };
})();
