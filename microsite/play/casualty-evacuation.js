/* ─────────────────────────────────────────────────────────────────────────────
   CASUALTY EVACUATION (CASEVAC) — Medical helicopter extraction system
   Keys: C or E = call CASEVAC (when HP < 40 or downed ally nearby)
         S       = pop smoke at LZ during CASEVAC
         Tab     = show/hide 9-line CASEVAC report
   ───────────────────────────────────────────────────────────────────────────── */
window.CasualtyEvacuation = (function () {
  'use strict';

  // ── Scene / player references ─────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var player = null;

  // ── Module state ──────────────────────────────────────────────────────────
  var active = false;
  var casevacState = 'idle'; // idle | inbound | hovering | departed
  var casevacTimer = 0;
  var countdownMax = 150; // 2:30
  var countdownRemaining = 150;
  var hoverDuration = 15;
  var hoverTimer = 0;
  var lzPosition = null;
  var lzCompromised = false;

  // ── Helicopter objects ─────────────────────────────────────────────────────
  var heliGroup = null;
  var heliBody = null;
  var heliRotor = null;
  var heliTailBoom = null;
  var heliSkidL = null;
  var heliSkidR = null;
  var heliStartPos = null;
  var heliTargetPos = null;
  var heliDepartPos = null;
  var heliArrivalT = 0;
  var heliArrivalDuration = 8;

  // ── LZ objects ────────────────────────────────────────────────────────────
  var lzGroup = null;
  var lzDisc = null;
  var lzStrobeLights = [];
  var strobeTimer = 0;

  // ── Smoke signal objects ──────────────────────────────────────────────────
  var smokePuffs = [];
  var smokeActive = false;
  var smokeGroup = null;

  // ── Mortar interdiction objects ───────────────────────────────────────────
  var mortarActive = false;
  var mortarProjectile = null;
  var mortarCrater = null;
  var mortarT = 0;
  var mortarDuration = 3;
  var mortarStart = null;
  var mortarEnd = null;
  var mortarPeak = 12;

  // ── Healing state ─────────────────────────────────────────────────────────
  var healing = false;
  var healTimer = 0;
  var healDuration = 5;
  var healTargetHP = 80;
  var healStartHP = 0;
  var heartbeatTimer = 0;

  // ── 9-line panel ─────────────────────────────────────────────────────────
  var nineLine = null;
  var nineLineVisible = false;

  // ── HUD elements ──────────────────────────────────────────────────────────
  var hudBanner = null;
  var hudStatus = null;
  var hudHeart = null;

  // ── Key handler refs ──────────────────────────────────────────────────────
  var boundKeyDown = null;

  // ─────────────────────────────────────────────────────────────────────────
  //  HELICOPTER CONSTRUCTION
  // ─────────────────────────────────────────────────────────────────────────
  function createHelicopter() {
    heliGroup = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(4, 1.5, 2);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2D5A1B });
    heliBody = new THREE.Mesh(bodyGeo, bodyMat);
    heliBody.position.set(0, 0, 0);
    heliGroup.add(heliBody);

    // Main rotor
    var rotorGeo = new THREE.CylinderGeometry(3, 3, 0.1, 12);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    heliRotor = new THREE.Mesh(rotorGeo, rotorMat);
    heliRotor.position.set(0, 1.0, 0);
    heliGroup.add(heliRotor);

    // Rotor blade cross bars for visual detail
    var bladeGeo = new THREE.BoxGeometry(6, 0.08, 0.25);
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    blade1.position.set(0, 1.05, 0);
    heliGroup.add(blade1);
    var blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.position.set(0, 1.05, 0);
    blade2.rotation.y = Math.PI / 2;
    heliGroup.add(blade2);

    // Tail boom
    var tailGeo = new THREE.BoxGeometry(2.5, 0.4, 0.4);
    var tailMat = new THREE.MeshLambertMaterial({ color: 0x2D5A1B });
    heliTailBoom = new THREE.Mesh(tailGeo, tailMat);
    heliTailBoom.position.set(-3.0, 0.1, 0);
    heliGroup.add(heliTailBoom);

    // Tail rotor
    var tailRotorGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 8);
    var tailRotorMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var tailRotorMesh = new THREE.Mesh(tailRotorGeo, tailRotorMat);
    tailRotorMesh.position.set(-4.2, 0.3, 0.25);
    tailRotorMesh.rotation.z = Math.PI / 2;
    heliGroup.add(tailRotorMesh);

    // Landing skid left
    var skidGeo = new THREE.BoxGeometry(3, 0.12, 0.12);
    var skidMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    heliSkidL = new THREE.Mesh(skidGeo, skidMat);
    heliSkidL.position.set(0, -0.9, 0.8);
    heliGroup.add(heliSkidL);

    // Landing skid right
    heliSkidR = new THREE.Mesh(skidGeo, skidMat);
    heliSkidR.position.set(0, -0.9, -0.8);
    heliGroup.add(heliSkidR);

    // Skid struts
    var strutGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    var strutMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var strutPositions = [
      [1.2, -0.6, 0.8], [-1.2, -0.6, 0.8],
      [1.2, -0.6, -0.8], [-1.2, -0.6, -0.8]
    ];
    for (var si = 0; si < strutPositions.length; si++) {
      var strut = new THREE.Mesh(strutGeo, strutMat);
      strut.position.set(strutPositions[si][0], strutPositions[si][1], strutPositions[si][2]);
      heliGroup.add(strut);
    }

    // Nav lights
    var navLightR = new THREE.PointLight(0xFF0000, 0.8, 5);
    navLightR.position.set(2, 0, 1);
    heliGroup.add(navLightR);
    var navLightG = new THREE.PointLight(0x00FF00, 0.8, 5);
    navLightG.position.set(2, 0, -1);
    heliGroup.add(navLightG);

    scene.add(heliGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  LZ MARKER CONSTRUCTION
  // ─────────────────────────────────────────────────────────────────────────
  function createLZ() {
    lzGroup = new THREE.Group();

    // Landing zone disc
    var discGeo = new THREE.CylinderGeometry(5, 5, 0.08, 24);
    var discMat = new THREE.MeshLambertMaterial({
      color: 0x00FF00,
      transparent: true,
      opacity: 0.6
    });
    lzDisc = new THREE.Mesh(discGeo, discMat);
    lzDisc.position.copy(lzPosition);
    lzDisc.position.y += 0.05;
    lzGroup.add(lzDisc);

    // H marker in center
    var hGeoH = new THREE.BoxGeometry(0.3, 0.05, 3);
    var hMatH = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var hLeft = new THREE.Mesh(hGeoH, hMatH);
    hLeft.position.copy(lzPosition);
    hLeft.position.x -= 0.8;
    hLeft.position.y += 0.15;
    lzGroup.add(hLeft);
    var hRight = new THREE.Mesh(hGeoH, hMatH);
    hRight.position.copy(lzPosition);
    hRight.position.x += 0.8;
    hRight.position.y += 0.15;
    lzGroup.add(hRight);
    var hCross = new THREE.BoxGeometry(1.9, 0.05, 0.3);
    var hCrossM = new THREE.Mesh(hCross, hMatH);
    hCrossM.position.copy(lzPosition);
    hCrossM.position.y += 0.15;
    lzGroup.add(hCrossM);

    // 4 corner strobe lights
    lzStrobeLights = [];
    var cornerOffsets = [
      [4.5, 4.5], [-4.5, 4.5], [4.5, -4.5], [-4.5, -4.5]
    ];
    for (var ci = 0; ci < cornerOffsets.length; ci++) {
      var strobe = new THREE.PointLight(0xFFFF00, 2.0, 8);
      strobe.position.copy(lzPosition);
      strobe.position.x += cornerOffsets[ci][0];
      strobe.position.z += cornerOffsets[ci][1];
      strobe.position.y += 0.5;
      lzGroup.add(strobe);
      lzStrobeLights.push(strobe);

      // Small strobe post mesh
      var postGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 6);
      var postMat = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.copy(strobe.position);
      post.position.y -= 0.2;
      lzGroup.add(post);
    }

    scene.add(lzGroup);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SMOKE SIGNAL
  // ─────────────────────────────────────────────────────────────────────────
  function popSmoke() {
    if (smokeActive || !active) return;
    smokeActive = true;

    smokeGroup = new THREE.Group();
    smokePuffs = [];

    var puffGeo = new THREE.CylinderGeometry(0.6, 0.4, 0.8, 8);
    var puffMat = new THREE.MeshLambertMaterial({
      color: 0xFF4444,
      transparent: true,
      opacity: 0.75
    });

    for (var pi = 0; pi < 3; pi++) {
      var puff = new THREE.Mesh(puffGeo, puffMat.clone());
      puff.position.copy(lzPosition);
      puff.position.y += 0.5 + pi * 0.9;
      puff.position.x += (Math.random() - 0.5) * 0.4;
      puff.position.z += (Math.random() - 0.5) * 0.4;
      puff.userData.riseSpeed = 0.8 + Math.random() * 0.4;
      puff.userData.age = 0;
      puff.userData.maxAge = 8 + pi * 2;
      smokeGroup.add(puff);
      smokePuffs.push(puff);
    }

    scene.add(smokeGroup);
    showBannerFlash('SMOKE POPPED — LZ MARKED');
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MORTAR INTERDICTION
  // ─────────────────────────────────────────────────────────────────────────
  function triggerMortarInterdiction() {
    if (mortarActive) return;
    mortarActive = true;
    lzCompromised = true;
    updateHUDStatus();

    mortarStart = new THREE.Vector3(
      lzPosition.x + 30 + Math.random() * 20,
      5,
      lzPosition.z + 30 + Math.random() * 20
    );
    mortarEnd = new THREE.Vector3(
      lzPosition.x + (Math.random() - 0.5) * 6,
      0,
      lzPosition.z + (Math.random() - 0.5) * 6
    );
    mortarT = 0;

    var projGeo = new THREE.SphereGeometry(0.2, 6, 6);
    var projMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    mortarProjectile = new THREE.Mesh(projGeo, projMat);
    mortarProjectile.position.copy(mortarStart);
    scene.add(mortarProjectile);
  }

  function updateMortar(delta) {
    if (!mortarActive) return;
    if (!mortarProjectile) return;

    mortarT += delta / mortarDuration;

    if (mortarT >= 1.0) {
      // Impact
      scene.remove(mortarProjectile);
      mortarProjectile = null;
      createCrater(mortarEnd);
      mortarActive = false;
      showBannerFlash('LZ UNDER FIRE — COMPROMISED');
      return;
    }

    // Parabolic arc
    var t = mortarT;
    var px = mortarStart.x + (mortarEnd.x - mortarStart.x) * t;
    var pz = mortarStart.z + (mortarEnd.z - mortarStart.z) * t;
    var py = mortarStart.y + (mortarEnd.y - mortarStart.y) * t + mortarPeak * 4 * t * (1 - t);
    mortarProjectile.position.set(px, py, pz);
  }

  function createCrater(pos) {
    var craterGeo = new THREE.CylinderGeometry(2.5, 2.0, 0.4, 12);
    var craterMat = new THREE.MeshLambertMaterial({ color: 0x2A1A00 });
    mortarCrater = new THREE.Mesh(craterGeo, craterMat);
    mortarCrater.position.copy(pos);
    mortarCrater.position.y += 0.0;
    scene.add(mortarCrater);

    // Explosion flash light
    var flash = new THREE.PointLight(0xFF6600, 8, 20);
    flash.position.copy(pos);
    flash.position.y += 2;
    scene.add(flash);
    var flashAge = { v: 0 };
    var flashRef = flash;
    var sceneRef = scene;
    function fadeFlash() {
      flashAge.v += 0.05;
      if (flashRef.intensity !== undefined) {
        flashRef.intensity = Math.max(0, 8 - flashAge.v * 16);
      }
      if (flashAge.v < 0.5) {
        requestAnimationFrame(fadeFlash);
      } else {
        sceneRef.remove(flashRef);
      }
    }
    requestAnimationFrame(fadeFlash);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  CALL CASEVAC
  // ─────────────────────────────────────────────────────────────────────────
  function callCasevac() {
    if (active) return;

    var hp = player ? (player.hp !== undefined ? player.hp : 100) : 100;
    var hasDownedAlly = checkDownedAlly();

    if (hp >= 40 && !hasDownedAlly) {
      showBannerFlash('CASEVAC: HP TOO HIGH — MUST BE < 40 OR DOWNED ALLY NEARBY');
      return;
    }

    active = true;
    casevacState = 'inbound';
    casevacTimer = 0;
    countdownRemaining = countdownMax;
    hoverTimer = 0;
    lzCompromised = false;
    smokeActive = false;
    healTimer = 0;
    healing = false;

    // Set LZ at player position or nearby
    lzPosition = new THREE.Vector3(
      player ? player.position.x : 0,
      0,
      player ? player.position.z + 10 : 10
    );

    createLZ();
    createHelicopter();
    positionHeliApproach();
    buildHUD();

    // 30% chance of mortar attack after 5 seconds
    if (Math.random() < 0.3) {
      var mortarDelay = 5000 + Math.random() * 5000;
      setTimeout(function () {
        if (active) triggerMortarInterdiction();
      }, mortarDelay);
    }
  }

  function checkDownedAlly() {
    if (!player) return false;
    if (window.AllySystem && window.AllySystem.getDownedNearby) {
      return window.AllySystem.getDownedNearby(player.position, 10);
    }
    return false;
  }

  function positionHeliApproach() {
    if (!heliGroup) return;

    // Start from map edge high up
    var edgeX = lzPosition.x + (Math.random() > 0.5 ? 80 : -80);
    var edgeZ = lzPosition.z + (Math.random() > 0.5 ? 80 : -80);
    heliStartPos = new THREE.Vector3(edgeX, 20, edgeZ);
    heliTargetPos = new THREE.Vector3(lzPosition.x, 3, lzPosition.z);
    heliDepartPos = new THREE.Vector3(-edgeX, 20, -edgeZ);

    heliGroup.position.copy(heliStartPos);
    heliArrivalT = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  HUD
  // ─────────────────────────────────────────────────────────────────────────
  function buildHUD() {
    removeHUD();

    hudBanner = document.createElement('div');
    hudBanner.id = 'casevac-banner';
    hudBanner.style.cssText = [
      'position:fixed',
      'top:12%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FF4444',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'padding:10px 22px',
      'border:2px solid #FF4444',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9100',
      'text-align:center',
      'letter-spacing:2px'
    ].join(';');
    hudBanner.textContent = 'CASEVAC INBOUND [2:30]';
    document.body.appendChild(hudBanner);

    hudStatus = document.createElement('div');
    hudStatus.id = 'casevac-status';
    hudStatus.style.cssText = [
      'position:fixed',
      'top:17%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#00FF00',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'padding:5px 16px',
      'border:1px solid #00FF00',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9100'
    ].join(';');
    hudStatus.textContent = 'LZ STATUS: ACTIVE';
    document.body.appendChild(hudStatus);

    hudHeart = document.createElement('div');
    hudHeart.id = 'casevac-heart';
    hudHeart.style.cssText = [
      'position:fixed',
      'top:22%',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FF0066',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:9100',
      'display:none'
    ].join(';');
    hudHeart.textContent = '♥ RECEIVING MEDICAL CARE ♥';
    document.body.appendChild(hudHeart);
  }

  function removeHUD() {
    if (hudBanner && hudBanner.parentNode) hudBanner.parentNode.removeChild(hudBanner);
    if (hudStatus && hudStatus.parentNode) hudStatus.parentNode.removeChild(hudStatus);
    if (hudHeart && hudHeart.parentNode) hudHeart.parentNode.removeChild(hudHeart);
    hudBanner = null;
    hudStatus = null;
    hudHeart = null;
  }

  function showBannerFlash(msg) {
    var flash = document.createElement('div');
    flash.style.cssText = [
      'position:fixed',
      'top:25%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#FFFF00',
      'font-family:monospace',
      'font-size:16px',
      'padding:8px 18px',
      'border:1px solid #FFFF00',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9200'
    ].join(';');
    flash.textContent = msg;
    document.body.appendChild(flash);
    setTimeout(function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 3000);
  }

  function updateHUDBanner(remaining) {
    if (!hudBanner) return;
    var mins = Math.floor(remaining / 60);
    var secs = Math.floor(remaining % 60);
    var secStr = secs < 10 ? '0' + secs : '' + secs;
    hudBanner.textContent = 'CASEVAC INBOUND [' + mins + ':' + secStr + ']';
    if (casevacState === 'hovering') {
      hudBanner.textContent = 'CASEVAC ON LZ — APPROACH NOW';
    } else if (casevacState === 'departed') {
      hudBanner.textContent = 'CASEVAC DEPARTED';
    }
  }

  function updateHUDStatus() {
    if (!hudStatus) return;
    if (lzCompromised) {
      hudStatus.style.color = '#FF4444';
      hudStatus.style.borderColor = '#FF4444';
      hudStatus.textContent = 'LZ STATUS: COMPROMISED';
    } else {
      hudStatus.style.color = '#00FF00';
      hudStatus.style.borderColor = '#00FF00';
      hudStatus.textContent = 'LZ STATUS: ACTIVE';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  9-LINE CASEVAC PANEL
  // ─────────────────────────────────────────────────────────────────────────
  function buildNineLinePanel() {
    if (nineLine) return;

    nineLine = document.createElement('div');
    nineLine.id = 'casevac-9line';
    nineLine.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,20,10,0.95)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:14px',
      'padding:20px 30px',
      'border:2px solid #00FF88',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:9300',
      'min-width:360px',
      'line-height:1.8',
      'display:none'
    ].join(';');

    var html = '<div style="font-size:18px;font-weight:bold;margin-bottom:12px;color:#FFFF00;letter-spacing:2px;">9-LINE CASEVAC REPORT</div>';
    html += '<table style="border-collapse:collapse;width:100%;">';

    var lines = [
      ['LINE 1', 'GRID', 'GR 441897 — LZ ALPHA'],
      ['LINE 2', 'CALLSIGN/FREQ', 'DUSTOFF 7 / 30.000 MHz'],
      ['LINE 3', 'PRECEDENCE', 'URGENT SURGICAL'],
      ['LINE 4', 'SPECIAL EQUIP', 'NONE'],
      ['LINE 5', 'PATIENTS', '1 LITTER / 0 AMBULATORY'],
      ['LINE 6', 'SECURITY', 'HOT — ENEMY CONTACT'],
      ['LINE 7', 'MARKINGS', 'RED SMOKE / PANEL'],
      ['LINE 8', 'NATIONALITY', 'FRIENDLY (US)'],
      ['LINE 9', 'NBC HAZARD', 'NONE']
    ];

    for (var li = 0; li < lines.length; li++) {
      var ln = lines[li];
      html += '<tr>';
      html += '<td style="color:#FFAA00;padding:2px 8px;font-weight:bold;">' + ln[0] + '</td>';
      html += '<td style="color:#88FFAA;padding:2px 8px;">' + ln[1] + '</td>';
      html += '<td style="color:#FFFFFF;padding:2px 8px;">' + ln[2] + '</td>';
      html += '</tr>';
    }

    html += '</table>';
    html += '<div style="margin-top:12px;color:#888888;font-size:11px;">[TAB] to close this panel</div>';
    nineLine.innerHTML = html;
    document.body.appendChild(nineLine);
  }

  function toggleNineLine() {
    if (!active) return;
    if (!nineLine) buildNineLinePanel();
    nineLineVisible = !nineLineVisible;
    if (nineLine) {
      nineLine.style.display = nineLineVisible ? 'block' : 'none';
    }
  }

  function removeNineLine() {
    if (nineLine && nineLine.parentNode) nineLine.parentNode.removeChild(nineLine);
    nineLine = null;
    nineLineVisible = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  KEY HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var code = e.code || e.key;

    // C or E = call CASEVAC
    if (code === 'KeyC' || code === 'KeyE') {
      if (!active) callCasevac();
    }

    // S = pop smoke at LZ
    if (code === 'KeyS') {
      if (active && casevacState !== 'idle' && casevacState !== 'departed') {
        popSmoke();
      }
    }

    // Tab = 9-line panel
    if (code === 'Tab') {
      if (active) {
        e.preventDefault();
        toggleNineLine();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  HEALING LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  function startHealing() {
    if (healing || !player) return;
    healing = true;
    healTimer = 0;
    healStartHP = player.hp !== undefined ? player.hp : 0;
    healTargetHP = 80;
    heartbeatTimer = 0;
    if (hudHeart) hudHeart.style.display = 'block';
    showBannerFlash('LOADING CASUALTY — TREATMENT INITIATED');
  }

  function updateHealing(delta) {
    if (!healing || !player) return;

    healTimer += delta;
    heartbeatTimer += delta;

    var t = Math.min(healTimer / healDuration, 1.0);
    player.hp = healStartHP + (healTargetHP - healStartHP) * t;

    // Heartbeat visual pulse on HUD
    if (hudHeart) {
      var pulse = Math.sin(heartbeatTimer * 6) > 0.5;
      hudHeart.style.opacity = pulse ? '1.0' : '0.4';
      hudHeart.textContent = '♥ RECEIVING MEDICAL CARE — HP: ' + Math.round(player.hp) + ' ♥';
    }

    if (t >= 1.0) {
      healing = false;
      player.hp = healTargetHP;
      if (hudHeart) {
        hudHeart.style.display = 'none';
      }
      showBannerFlash('TREATMENT COMPLETE — HP RESTORED TO 80');
    }
  }

  function checkPlayerNearHeli(delta) {
    if (!player || !heliGroup || casevacState !== 'hovering') return;
    if (healing) return;

    var dx = player.position.x - heliGroup.position.x;
    var dz = player.position.z - heliGroup.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 3) {
      startHealing();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SMOKE UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateSmoke(delta) {
    if (!smokeActive || smokePuffs.length === 0) return;

    for (var si = 0; si < smokePuffs.length; si++) {
      var puff = smokePuffs[si];
      puff.userData.age += delta;

      // Rise upward
      puff.position.y += puff.userData.riseSpeed * delta;

      // Expand and fade
      var ageRatio = puff.userData.age / puff.userData.maxAge;
      var scale = 1.0 + ageRatio * 1.5;
      puff.scale.set(scale, 1.0, scale);

      if (puff.material) {
        puff.material.opacity = Math.max(0, 0.75 - ageRatio * 0.75);
      }

      // Respawn puff when fully faded
      if (puff.userData.age >= puff.userData.maxAge) {
        puff.userData.age = 0;
        puff.position.copy(lzPosition);
        puff.position.y += 0.5;
        puff.position.x += (Math.random() - 0.5) * 0.6;
        puff.position.z += (Math.random() - 0.5) * 0.6;
        puff.scale.set(1, 1, 1);
        if (puff.material) puff.material.opacity = 0.75;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  STROBE LIGHTS UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateStrobes(delta) {
    if (!active || lzStrobeLights.length === 0) return;

    strobeTimer += delta;

    for (var i = 0; i < lzStrobeLights.length; i++) {
      var strobe = lzStrobeLights[i];
      // Flicker by randomizing intensity
      var flicker = Math.random();
      if (strobe.intensity !== undefined) {
        strobe.intensity = flicker > 0.4 ? (1.5 + Math.random() * 2.0) : 0.0;
      }
      strobe.visible = flicker > 0.3;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  HELICOPTER FLIGHT UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateHelicopter(delta) {
    if (!heliGroup) return;

    // Spin main rotor
    if (heliRotor) {
      heliRotor.rotation.y += 0.3 * delta * 60;
    }

    // Also spin blade meshes (children)
    for (var ci = 0; ci < heliGroup.children.length; ci++) {
      var child = heliGroup.children[ci];
      if (child.userData && child.userData.isBlade) {
        child.rotation.y += 0.3 * delta * 60;
      }
    }

    if (casevacState === 'inbound') {
      // Approach from edge to LZ
      heliArrivalT += delta / heliArrivalDuration;
      if (heliArrivalT >= 1.0) {
        heliArrivalT = 1.0;
        casevacState = 'hovering';
        hoverTimer = 0;
        showBannerFlash('CASEVAC ON LZ — APPROACH HELICOPTER FOR TREATMENT');
      }
      var t = heliArrivalT;
      var easedT = t * t * (3 - 2 * t); // smoothstep
      heliGroup.position.lerpVectors(heliStartPos, heliTargetPos, easedT);

      // Face direction of travel
      var dir = new THREE.Vector3().subVectors(heliTargetPos, heliStartPos).normalize();
      heliGroup.rotation.y = Math.atan2(dir.x, dir.z);

    } else if (casevacState === 'hovering') {
      // Gentle hover bob
      var bobY = Math.sin(casevacTimer * 1.5) * 0.15;
      heliGroup.position.set(heliTargetPos.x, heliTargetPos.y + bobY, heliTargetPos.z);

      hoverTimer += delta;
      if (hoverTimer >= hoverDuration) {
        casevacState = 'departing';
        heliArrivalT = 0;
        showBannerFlash('CASEVAC DEPARTING');
      }

    } else if (casevacState === 'departing') {
      heliArrivalT += delta / heliArrivalDuration;
      if (heliArrivalT >= 1.0) {
        heliArrivalT = 1.0;
        casevacState = 'departed';
        updateHUDBanner(0);
        if (hudBanner) hudBanner.style.color = '#888888';
      }
      var dt2 = heliArrivalT;
      var easedT2 = dt2 * dt2 * (3 - 2 * dt2);
      heliGroup.position.lerpVectors(heliTargetPos, heliDepartPos, easedT2);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SCENE CLEANUP
  // ─────────────────────────────────────────────────────────────────────────
  function removeSceneObjects() {
    if (heliGroup) {
      scene.remove(heliGroup);
      heliGroup = null;
    }
    if (lzGroup) {
      scene.remove(lzGroup);
      lzGroup = null;
    }
    if (smokeGroup) {
      scene.remove(smokeGroup);
      smokeGroup = null;
    }
    if (mortarProjectile) {
      scene.remove(mortarProjectile);
      mortarProjectile = null;
    }
    if (mortarCrater) {
      scene.remove(mortarCrater);
      mortarCrater = null;
    }
    heliBody = null;
    heliRotor = null;
    heliTailBoom = null;
    heliSkidL = null;
    heliSkidR = null;
    lzDisc = null;
    lzStrobeLights = [];
    smokePuffs = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PUBLIC: INIT
  // ─────────────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, playerRef) {
    scene = sceneRef;
    camera = cameraRef;
    player = playerRef;

    boundKeyDown = onKeyDown;
    document.addEventListener('keydown', boundKeyDown);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PUBLIC: UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function update(delta) {
    if (!active) return;

    casevacTimer += delta;

    // Countdown
    if (casevacState === 'inbound' || casevacState === 'hovering') {
      countdownRemaining = Math.max(0, countdownMax - casevacTimer);
      updateHUDBanner(countdownRemaining);
    }

    updateHelicopter(delta);
    updateStrobes(delta);
    updateSmoke(delta);
    updateMortar(delta);
    updateHealing(delta);
    checkPlayerNearHeli(delta);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PUBLIC: RESET
  // ─────────────────────────────────────────────────────────────────────────
  function reset() {
    active = false;
    casevacState = 'idle';
    casevacTimer = 0;
    countdownRemaining = countdownMax;
    hoverTimer = 0;
    lzCompromised = false;
    smokeActive = false;
    mortarActive = false;
    mortarT = 0;
    healing = false;
    healTimer = 0;
    heliArrivalT = 0;
    strobeTimer = 0;

    if (scene) {
      removeSceneObjects();
    }

    removeHUD();
    removeNineLine();

    if (boundKeyDown) {
      document.removeEventListener('keydown', boundKeyDown);
      boundKeyDown = null;
    }

    lzPosition = null;
    heliStartPos = null;
    heliTargetPos = null;
    heliDepartPos = null;
    mortarStart = null;
    mortarEnd = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MODULE EXPORT
  // ─────────────────────────────────────────────────────────────────────────
  return { init: init, update: update, reset: reset };

})();
