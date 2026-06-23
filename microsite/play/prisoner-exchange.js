// ============================================================
//  prisoner-exchange.js — Prisoner Exchange Negotiations FPS Module
//  Features:
//    1. Prisoner NPCs: 1-2 friendly prisoners (orange jumpsuits), kneeling at exchange zone
//    2. Exchange zone: circular gray platform (radius 5) with X marking
//    3. Enemy negotiator in officer uniform, holds prisoner at gunpoint
//    4. Negotiation phases: CONTACT → TERMS → COUNTER_OFFER → EXCHANGE → COMPLETE/FAILED
//    5. Dialogue HUD: comic-strip style boxes, typewriter effect
//    6. Risk mechanics: aiming raises threat level; at 100% prisoner is executed
//    7. Ambush trigger: 30% chance at EXCHANGE phase, 3 flanking enemies
//    8. Counter: press F during TERMS to neutralize negotiator preemptively
//    9. Key bindings: G=accept Y=counter Z=reject F=neutralize
//   10. HUD: status bar, threat meter, phase indicator
//  Public API: { init(scene, camera, playerRef), update(delta), triggerExchange(x, z), reset() }
// ============================================================
window.PrisonerExchange = (function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  var EXCHANGE_ZONE_RADIUS     = 5;
  var NEGOTIATOR_DISTANCE      = 12;
  var PRISONER_COUNT           = 2;
  var THREAT_AIM_RATE          = 0.25;     // threat per second while player aims
  var THREAT_DECAY_RATE        = 0.05;     // threat decay per second when not aiming
  var AMBUSH_CHANCE            = 0.30;
  var AMBUSH_REACT_TIME        = 2.0;      // seconds player has to react
  var WALK_SPEED               = 2.0;
  var TYPEWRITER_SPEED         = 0.04;     // seconds per character
  var SCORE_EXCHANGE_SUCCESS   = 600;
  var SCORE_PREEMPTIVE         = 400;
  var SCORE_MORALE_HIT         = -200;

  // Colors
  var COLOR_JUMPSUIT           = 0xe8841a;  // orange
  var COLOR_SKIN               = 0xf5c5a3;
  var COLOR_OFFICER            = 0x1a1a2e;  // dark navy
  var COLOR_OFFICER_SKIN       = 0x8b7355;
  var COLOR_ZONE               = 0x888888;
  var COLOR_ZONE_MARK          = 0x555555;
  var COLOR_ROPE               = 0x8b6914;  // brown hand ties
  var COLOR_GUN                = 0x111111;
  var COLOR_AMBUSH             = 0x3d0000;

  // Negotiation phases
  var PHASE_IDLE               = 'IDLE';
  var PHASE_CONTACT            = 'CONTACT';
  var PHASE_TERMS              = 'TERMS';
  var PHASE_COUNTER            = 'COUNTER_OFFER';
  var PHASE_EXCHANGE           = 'EXCHANGE';
  var PHASE_COMPLETE           = 'COMPLETE';
  var PHASE_FAILED             = 'FAILED';

  // Dialogue lines per phase
  var DIALOGUE = {};
  DIALOGUE[PHASE_CONTACT]  = [
    'This is Commander Draikov. Radio channel established.',
    'We have your people. They are alive... for now.',
    'Come to the exchange point. Come ALONE.'
  ];
  DIALOGUE[PHASE_TERMS]    = [
    'Our terms: you surrender all weapons in Sector 7.',
    'Also — your vehicle depot at grid reference Kilo-4.',
    'And control of the Northern checkpoint. Agreed?'
  ];
  DIALOGUE[PHASE_COUNTER]  = [
    'You dare counter-offer? Interesting...',
    'We will consider your terms. But patience wears thin.',
    'Final answer required. NOW.'
  ];
  DIALOGUE[PHASE_EXCHANGE] = [
    'Send the prisoner forward. We send ours.',
    'Walk slowly. Any tricks and this ends badly.',
    'Step by step. No sudden moves.'
  ];

  // ── State ───────────────────────────────────────────────────
  var _scene              = null;
  var _camera             = null;
  var _player             = null;

  var _phase              = PHASE_IDLE;
  var _phaseTimer         = 0;
  var _threatLevel        = 0;         // 0.0 to 1.0
  var _isAiming           = false;
  var _ambushTriggered    = false;
  var _ambushReactTimer   = 0;
  var _exchangeActive     = false;
  var _score              = 0;

  var _exchangeZone       = null;
  var _zonePosition       = new THREE.Vector3(0, 0, 0);

  var _prisoners          = [];
  var _negotiator         = null;
  var _ambushEnemies      = [];

  var _dialogueIndex      = 0;
  var _dialogueLines      = [];
  var _dialogueTimer      = 0;
  var _dialogueChars      = 0;
  var _dialogueCurrentLine = '';

  var _hudElement         = null;
  var _dialogueBox        = null;
  var _statusBar          = null;
  var _threatBar          = null;
  var _phaseLabel         = null;
  var _scoreLabel         = null;
  var _messageLabel       = null;
  var _messageTimer       = 0;

  var _keyState           = {};
  var _keyPressedThisFrame = {};
  var _onKeyDown          = null;
  var _onKeyUp            = null;

  var _phaseNames = {};
  _phaseNames[PHASE_IDLE]     = 'STANDBY';
  _phaseNames[PHASE_CONTACT]  = 'CONTACT';
  _phaseNames[PHASE_TERMS]    = 'TERMS';
  _phaseNames[PHASE_COUNTER]  = 'COUNTER OFFER';
  _phaseNames[PHASE_EXCHANGE] = 'EXCHANGE';
  _phaseNames[PHASE_COMPLETE] = 'COMPLETE';
  _phaseNames[PHASE_FAILED]   = 'FAILED';

  var _phaseNumbers = {};
  _phaseNumbers[PHASE_CONTACT]  = 1;
  _phaseNumbers[PHASE_TERMS]    = 2;
  _phaseNumbers[PHASE_COUNTER]  = 3;
  _phaseNumbers[PHASE_EXCHANGE] = 4;

  // ── NPC Builders ────────────────────────────────────────────

  function buildPrisonerMesh() {
    var group = new THREE.Group();

    // Body: orange cylinder (jumpsuit)
    var bodyGeo  = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 8);
    var bodyMat  = new THREE.MeshLambertMaterial({ color: COLOR_JUMPSUIT });
    var body     = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    // Head: sphere
    var headGeo  = new THREE.SphereGeometry(0.28, 8, 8);
    var headMat  = new THREE.MeshLambertMaterial({ color: COLOR_SKIN });
    var head     = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.28;
    group.add(head);

    // Tied hands: two small cubes in front of body
    var handMat  = new THREE.MeshLambertMaterial({ color: COLOR_ROPE });
    var handGeo  = new THREE.BoxGeometry(0.15, 0.15, 0.15);

    var handL    = new THREE.Mesh(handGeo, handMat);
    handL.position.set(-0.15, 0.55, 0.38);
    group.add(handL);

    var handR    = new THREE.Mesh(handGeo, handMat);
    handR.position.set(0.15, 0.55, 0.38);
    group.add(handR);

    // Rope binding between hands
    var ropeGeo  = new THREE.BoxGeometry(0.32, 0.06, 0.06);
    var rope     = new THREE.Mesh(ropeGeo, handMat);
    rope.position.set(0, 0.55, 0.42);
    group.add(rope);

    // Kneeling: shift group down so prisoner appears to kneel
    group.position.y = -0.35;

    return group;
  }

  function buildNegotiatorMesh() {
    var group = new THREE.Group();

    // Body: dark box (officer uniform)
    var bodyGeo  = new THREE.BoxGeometry(0.7, 1.1, 0.4);
    var bodyMat  = new THREE.MeshLambertMaterial({ color: COLOR_OFFICER });
    var body     = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    group.add(body);

    // Shoulders / epaulettes
    var epGeo    = new THREE.BoxGeometry(0.85, 0.1, 0.44);
    var epMat    = new THREE.MeshLambertMaterial({ color: 0x2c3e6b });
    var epaulettes = new THREE.Mesh(epGeo, epMat);
    epaulettes.position.y = 1.08;
    group.add(epaulettes);

    // Head
    var headGeo  = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    var headMat  = new THREE.MeshLambertMaterial({ color: COLOR_OFFICER_SKIN });
    var head     = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.45;
    group.add(head);

    // Officer cap
    var capBrimGeo = new THREE.BoxGeometry(0.54, 0.06, 0.54);
    var capTopGeo  = new THREE.BoxGeometry(0.40, 0.22, 0.40);
    var capMat   = new THREE.MeshLambertMaterial({ color: 0x0d0d1a });
    var capBrim  = new THREE.Mesh(capBrimGeo, capMat);
    capBrim.position.y = 1.69;
    group.add(capBrim);
    var capTop   = new THREE.Mesh(capTopGeo, capMat);
    capTop.position.y = 1.84;
    group.add(capTop);

    // Arm holding gun (right side, extended)
    var armGeo   = new THREE.BoxGeometry(0.18, 0.18, 0.65);
    var armMat   = new THREE.MeshLambertMaterial({ color: COLOR_OFFICER });
    var arm      = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0.5, 0.9, 0.35);
    arm.rotation.x = -0.3;
    group.add(arm);

    // Gun
    var gunGeo   = new THREE.BoxGeometry(0.08, 0.12, 0.48);
    var gunMat   = new THREE.MeshLambertMaterial({ color: COLOR_GUN });
    var gun      = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.5, 0.88, 0.65);
    group.add(gun);

    // Legs
    var legMat   = new THREE.MeshLambertMaterial({ color: 0x0f0f28 });
    var legGeo   = new THREE.BoxGeometry(0.25, 0.6, 0.28);

    var legL     = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.18, 0.0, 0.0);
    // shift so legs start from waist
    legL.position.y = 0.0;
    group.add(legL);

    var legR     = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.18, 0.0, 0.0);
    group.add(legR);

    return group;
  }

  function buildAmbushEnemy() {
    var group = new THREE.Group();

    var bodyGeo  = new THREE.BoxGeometry(0.6, 1.0, 0.35);
    var bodyMat  = new THREE.MeshLambertMaterial({ color: COLOR_AMBUSH });
    var body     = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    var headGeo  = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    var headMat  = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var head     = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.19;
    group.add(head);

    var gunGeo   = new THREE.BoxGeometry(0.07, 0.1, 0.55);
    var gunMat   = new THREE.MeshLambertMaterial({ color: COLOR_GUN });
    var gun      = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.4, 0.75, 0.4);
    group.add(gun);

    return group;
  }

  // ── Exchange Zone Builder ────────────────────────────────────

  function buildExchangeZone(pos) {
    var group = new THREE.Group();
    group.position.copy(pos);
    group.position.y = 0.01;

    // Platform disk
    var diskGeo  = new THREE.CylinderGeometry(EXCHANGE_ZONE_RADIUS, EXCHANGE_ZONE_RADIUS, 0.06, 32);
    var diskMat  = new THREE.MeshLambertMaterial({ color: COLOR_ZONE });
    var disk     = new THREE.Mesh(diskGeo, diskMat);
    group.add(disk);

    // X marking — two crossed boxes on top of platform
    var barMat   = new THREE.MeshLambertMaterial({ color: COLOR_ZONE_MARK });
    var bar1Geo  = new THREE.BoxGeometry(8.0, 0.08, 0.35);
    var bar1     = new THREE.Mesh(bar1Geo, barMat);
    bar1.position.y = 0.07;
    bar1.rotation.y = Math.PI / 4;
    group.add(bar1);

    var bar2Geo  = new THREE.BoxGeometry(8.0, 0.08, 0.35);
    var bar2     = new THREE.Mesh(bar2Geo, barMat);
    bar2.position.y = 0.07;
    bar2.rotation.y = -Math.PI / 4;
    group.add(bar2);

    _scene.add(group);
    return group;
  }

  // ── HUD Builder ─────────────────────────────────────────────

  function buildHUD() {
    if (_hudElement) return;

    _hudElement = document.createElement('div');
    _hudElement.id = 'pe-hud';
    _hudElement.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'pointer-events:none',
      'z-index:9000',
      'font-family:"Courier New",monospace'
    ].join(';');
    document.body.appendChild(_hudElement);

    // --- Dialogue box (comic-strip style, top-center) ---
    _dialogueBox = document.createElement('div');
    _dialogueBox.style.cssText = [
      'position:absolute',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'border:3px solid #ffcc00',
      'border-radius:4px',
      'padding:10px 18px',
      'min-width:380px',
      'max-width:560px',
      'display:none',
      'color:#ffcc00',
      'font-size:15px',
      'line-height:1.5',
      'text-shadow:0 0 6px #cc8800',
      'box-shadow:0 0 12px rgba(255,200,0,0.4)'
    ].join(';');
    _hudElement.appendChild(_dialogueBox);

    // Speaker label inside dialogue box
    var speakerLabel = document.createElement('div');
    speakerLabel.id  = 'pe-speaker';
    speakerLabel.style.cssText = [
      'font-size:11px',
      'color:#ff6600',
      'margin-bottom:4px',
      'letter-spacing:2px',
      'text-transform:uppercase'
    ].join(';');
    speakerLabel.textContent = 'COMMANDER DRAIKOV';
    _dialogueBox.appendChild(speakerLabel);

    var dialogueText = document.createElement('div');
    dialogueText.id  = 'pe-dialogue-text';
    _dialogueBox.appendChild(dialogueText);

    // --- Status bar (bottom of screen) ---
    _statusBar = document.createElement('div');
    _statusBar.style.cssText = [
      'position:absolute',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'border:2px solid #555',
      'border-radius:3px',
      'padding:8px 16px',
      'min-width:420px',
      'display:none',
      'color:#fff',
      'font-size:13px'
    ].join(';');
    _hudElement.appendChild(_statusBar);

    // Phase label
    _phaseLabel = document.createElement('div');
    _phaseLabel.style.cssText = 'color:#88aaff;font-size:14px;letter-spacing:1px;margin-bottom:6px;';
    _statusBar.appendChild(_phaseLabel);

    // Threat meter row
    var threatRow = document.createElement('div');
    threatRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
    _statusBar.appendChild(threatRow);

    var threatLbl = document.createElement('span');
    threatLbl.style.cssText = 'color:#ffaa00;font-size:12px;min-width:90px;';
    threatLbl.textContent = 'THREAT:';
    threatRow.appendChild(threatLbl);

    var threatTrack = document.createElement('div');
    threatTrack.style.cssText = [
      'flex:1',
      'height:12px',
      'background:#333',
      'border:1px solid #666',
      'border-radius:2px',
      'overflow:hidden'
    ].join(';');
    threatRow.appendChild(threatTrack);

    _threatBar = document.createElement('div');
    _threatBar.style.cssText = [
      'height:100%',
      'width:0%',
      'background:#22ff44',
      'transition:width 0.1s,background 0.3s'
    ].join(';');
    threatTrack.appendChild(_threatBar);

    // Key hints row
    var keyRow = document.createElement('div');
    keyRow.style.cssText = 'color:#aaa;font-size:11px;margin-top:4px;';
    keyRow.id = 'pe-key-hints';
    _statusBar.appendChild(keyRow);

    // Score / message flash label
    _scoreLabel = document.createElement('div');
    _scoreLabel.style.cssText = [
      'position:absolute',
      'bottom:140px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#22ff44',
      'font-size:22px',
      'font-weight:bold',
      'letter-spacing:3px',
      'text-shadow:0 0 10px #00ff66',
      'display:none'
    ].join(';');
    _hudElement.appendChild(_scoreLabel);

    _messageLabel = document.createElement('div');
    _messageLabel.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff2200',
      'font-size:28px',
      'font-weight:bold',
      'letter-spacing:4px',
      'text-shadow:0 0 16px #ff0000',
      'display:none',
      'pointer-events:none',
      'text-align:center'
    ].join(';');
    _hudElement.appendChild(_messageLabel);
  }

  function updateHUD() {
    if (!_hudElement) return;

    if (_phase === PHASE_IDLE) {
      _dialogueBox.style.display = 'none';
      _statusBar.style.display   = 'none';
      return;
    }

    // Phase indicator
    _statusBar.style.display = 'block';
    var pNum   = _phaseNumbers[_phase] || '';
    var pName  = _phaseNames[_phase] || _phase;
    var phaseStr = pNum ? ('NEGOTIATION: ' + pName + ' [Phase ' + pNum + '/4]') : ('NEGOTIATION: ' + pName);
    _phaseLabel.textContent = phaseStr;

    // Key hints per phase
    var hints = document.getElementById('pe-key-hints');
    if (hints) {
      if (_phase === PHASE_TERMS) {
        hints.textContent = '[F] Neutralize Negotiator';
      } else if (_phase === PHASE_COUNTER) {
        hints.textContent = '[G] Accept  [Y] Counter  [Z] Reject';
      } else {
        hints.textContent = '';
      }
    }

    // Threat bar colour
    var threatPct  = Math.round(_threatLevel * 100);
    _threatBar.style.width = threatPct + '%';
    if (_threatLevel < 0.5) {
      _threatBar.style.background = '#22ff44';
    } else if (_threatLevel < 0.85) {
      _threatBar.style.background = '#ffcc00';
    } else {
      _threatBar.style.background = '#ff2200';
    }

    // Dialogue box
    if (_dialogueLines.length > 0 && _dialogueChars > 0) {
      _dialogueBox.style.display = 'block';
      var txtEl = document.getElementById('pe-dialogue-text');
      if (txtEl) {
        txtEl.textContent = _dialogueCurrentLine.substring(0, _dialogueChars);
      }
    } else if (_phase === PHASE_IDLE || _phase === PHASE_COMPLETE || _phase === PHASE_FAILED) {
      _dialogueBox.style.display = 'none';
    }

    // Flash message timer
    if (_messageTimer > 0) {
      _messageLabel.style.display = 'block';
    } else {
      _messageLabel.style.display = 'none';
    }

    if (_scoreLabel._timer > 0) {
      _scoreLabel.style.display = 'block';
    } else {
      _scoreLabel.style.display = 'none';
    }
  }

  function showMessage(text, color, duration) {
    if (!_messageLabel) return;
    _messageLabel.textContent  = text;
    _messageLabel.style.color  = color || '#ff2200';
    _messageLabel.style.textShadow = '0 0 16px ' + (color || '#ff2200');
    _messageTimer = duration || 3.0;
    _messageLabel.style.display = 'block';
  }

  function showScore(text, color) {
    if (!_scoreLabel) return;
    _scoreLabel.textContent = text;
    _scoreLabel.style.color = color || '#22ff44';
    _scoreLabel._timer = 3.0;
    _scoreLabel.style.display = 'block';
  }

  // ── Dialogue System ──────────────────────────────────────────

  function startDialogue(lines) {
    _dialogueLines    = lines.slice();
    _dialogueIndex    = 0;
    _dialogueChars    = 0;
    _dialogueTimer    = 0;
    _dialogueCurrentLine = _dialogueLines[0] || '';
  }

  function updateDialogue(delta) {
    if (_dialogueLines.length === 0) return;

    _dialogueTimer += delta;
    var target = _dialogueCurrentLine.length;

    if (_dialogueChars < target) {
      _dialogueChars = Math.min(target, Math.floor(_dialogueTimer / TYPEWRITER_SPEED));
    } else {
      // Pause 1.8s between lines
      if (_dialogueTimer > target * TYPEWRITER_SPEED + 1.8) {
        _dialogueIndex++;
        if (_dialogueIndex < _dialogueLines.length) {
          _dialogueCurrentLine = _dialogueLines[_dialogueIndex];
          _dialogueChars = 0;
          _dialogueTimer = 0;
        } else {
          _dialogueLines = [];
        }
      }
    }
  }

  // ── Phase Transitions ────────────────────────────────────────

  function setPhase(newPhase) {
    _phase      = newPhase;
    _phaseTimer = 0;

    if (DIALOGUE[newPhase]) {
      startDialogue(DIALOGUE[newPhase]);
    }

    if (newPhase === PHASE_EXCHANGE) {
      checkAmbush();
    }
  }

  function checkAmbush() {
    if (Math.random() < AMBUSH_CHANCE) {
      _ambushTriggered   = true;
      _ambushReactTimer  = AMBUSH_REACT_TIME;
      spawnAmbushEnemies();
      showMessage('AMBUSH! RESPOND NOW!', '#ff2200', 2.5);
    }
  }

  function spawnAmbushEnemies() {
    var basePos = _zonePosition;
    var angles  = [Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    var spread  = 18;

    for (var i = 0; i < 3; i++) {
      var mesh = buildAmbushEnemy();
      var angle = angles[i];
      mesh.position.set(
        basePos.x + Math.cos(angle) * spread,
        0,
        basePos.z + Math.sin(angle) * spread
      );
      mesh.lookAt(basePos);
      mesh.userData.isAmbush = true;
      mesh.userData.speed    = 4.0;
      mesh.userData.alive    = true;
      _scene.add(mesh);
      _ambushEnemies.push(mesh);
    }
  }

  function handleExchangeSuccess() {
    _score += SCORE_EXCHANGE_SUCCESS;
    showScore('+' + SCORE_EXCHANGE_SUCCESS + '  PRISONER RECOVERED', '#22ff44');
    showMessage('PRISONER RECOVERED', '#22ff44', 4.0);

    // Walk prisoners toward player
    for (var i = 0; i < _prisoners.length; i++) {
      _prisoners[i].userData.walkToPlayer = true;
    }

    // Remove negotiator
    if (_negotiator) {
      _negotiator.userData.fleeing = true;
    }

    setPhase(PHASE_COMPLETE);
  }

  function handleExchangeFailed(reason) {
    _score += SCORE_MORALE_HIT;
    showScore(SCORE_MORALE_HIT + '  MORALE HIT', '#ff2200');
    showMessage('PRISONER EXECUTED — MISSION FAILED', '#ff3300', 5.0);

    // Collapse prisoners
    for (var i = 0; i < _prisoners.length; i++) {
      collapsePrisoner(_prisoners[i]);
    }

    if (_negotiator) {
      _negotiator.userData.fleeing = true;
    }

    setPhase(PHASE_FAILED);
  }

  function collapsePrisoner(prisonerGroup) {
    prisonerGroup.userData.collapsed = true;
    prisonerGroup.rotation.z = Math.PI / 2;
    prisonerGroup.position.y = 0.0;
  }

  function preemptiveNeutralize() {
    if (_phase !== PHASE_TERMS) return;
    if (!_negotiator) return;

    // Remove negotiator instantly
    _scene.remove(_negotiator);
    _negotiator = null;

    _score += SCORE_PREEMPTIVE;
    showScore('+' + SCORE_PREEMPTIVE + '  NEUTRALIZED', '#ffcc00');
    showMessage('NEGOTIATOR NEUTRALIZED — PRISONER RUNS FREE', '#ffcc00', 4.0);

    // Prisoners walk toward player
    for (var i = 0; i < _prisoners.length; i++) {
      _prisoners[i].userData.walkToPlayer = true;
    }

    setPhase(PHASE_COMPLETE);
  }

  // ── Input Handlers ───────────────────────────────────────────

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    if (!_keyState[k]) {
      _keyPressedThisFrame[k] = true;
    }
    _keyState[k] = true;
  }

  function onKeyUp(e) {
    var k = e.key.toUpperCase();
    _keyState[k] = false;
  }

  function consumeKey(k) {
    var pressed = !!_keyPressedThisFrame[k];
    _keyPressedThisFrame[k] = false;
    return pressed;
  }

  function isAimingWeapon() {
    // Check for right-mouse-button held (ADS), or external player ref
    if (_player && typeof _player.isAiming !== 'undefined') {
      return !!_player.isAiming;
    }
    return !!_keyState['MOUSEBUTTONRIGHT'] || !!_keyState['Z'];
  }

  // ── Main Lifecycle ───────────────────────────────────────────

  function init(scene, camera, playerRef) {
    _scene   = scene;
    _camera  = camera;
    _player  = playerRef || null;

    buildHUD();

    _onKeyDown = onKeyDown;
    _onKeyUp   = onKeyUp;
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);

    // Track right-mouse for aiming detection
    window.addEventListener('mousedown', function (e) {
      if (e.button === 2) _keyState['MOUSEBUTTONRIGHT'] = true;
    });
    window.addEventListener('mouseup', function (e) {
      if (e.button === 2) _keyState['MOUSEBUTTONRIGHT'] = false;
    });
  }

  function triggerExchange(x, z) {
    if (_exchangeActive) return;
    _exchangeActive = true;

    _zonePosition.set(x || 0, 0, z || 0);

    // Build exchange zone platform
    _exchangeZone = buildExchangeZone(_zonePosition);

    // Spawn prisoners — kneel near zone center, slightly player-side
    for (var i = 0; i < PRISONER_COUNT; i++) {
      var pMesh = buildPrisonerMesh();
      var offsetX = (i === 0) ? -1.2 : 1.2;
      pMesh.position.set(
        _zonePosition.x + offsetX,
        0.35,
        _zonePosition.z - 2
      );
      pMesh.userData.isPrisoner    = true;
      pMesh.userData.walkToPlayer  = false;
      pMesh.userData.collapsed     = false;
      _scene.add(pMesh);
      _prisoners.push(pMesh);
    }

    // Spawn negotiator opposite the zone
    _negotiator = buildNegotiatorMesh();
    _negotiator.position.set(
      _zonePosition.x,
      0,
      _zonePosition.z + NEGOTIATOR_DISTANCE
    );
    _negotiator.lookAt(_zonePosition);
    _negotiator.userData.isNegotiator = true;
    _negotiator.userData.fleeing      = false;
    _scene.add(_negotiator);

    // Begin negotiation
    setPhase(PHASE_CONTACT);
  }

  function update(delta) {
    if (!_exchangeActive || !_scene) return;

    // Clear frame keys at end — collect first
    updatePhaseLogic(delta);
    updateNPCMovement(delta);
    updateDialogue(delta);
    updateTimers(delta);
    updateHUD();

    // Clear per-frame key presses
    _keyPressedThisFrame = {};
  }

  function updateTimers(delta) {
    if (_messageTimer > 0) {
      _messageTimer -= delta;
      if (_messageTimer < 0) _messageTimer = 0;
    }
    if (_scoreLabel && _scoreLabel._timer > 0) {
      _scoreLabel._timer -= delta;
      if (_scoreLabel._timer < 0) _scoreLabel._timer = 0;
    }
    if (_ambushReactTimer > 0) {
      _ambushReactTimer -= delta;
    }
    _phaseTimer += delta;
  }

  function updatePhaseLogic(delta) {
    // Threat level — goes up if player is aiming during negotiation
    _isAiming = isAimingWeapon();

    if (_phase !== PHASE_IDLE && _phase !== PHASE_COMPLETE && _phase !== PHASE_FAILED) {
      if (_isAiming) {
        _threatLevel = Math.min(1.0, _threatLevel + THREAT_AIM_RATE * delta);
      } else {
        _threatLevel = Math.max(0.0, _threatLevel - THREAT_DECAY_RATE * delta);
      }

      // Threat maxed — negotiator executes prisoner
      if (_threatLevel >= 1.0) {
        handleExchangeFailed('THREAT_MAXED');
        return;
      }
    }

    if (_phase === PHASE_CONTACT) {
      // After dialogue finishes or 6 seconds, advance
      if (_phaseTimer > 6.0 && _dialogueLines.length === 0) {
        setPhase(PHASE_TERMS);
      } else if (_phaseTimer > 9.0) {
        setPhase(PHASE_TERMS);
      }

    } else if (_phase === PHASE_TERMS) {
      // F = preemptive neutralize
      if (consumeKey('F')) {
        preemptiveNeutralize();
        return;
      }
      // Auto-advance after terms dialogue finishes
      if (_phaseTimer > 5.0 && _dialogueLines.length === 0) {
        setPhase(PHASE_COUNTER);
      } else if (_phaseTimer > 12.0) {
        setPhase(PHASE_COUNTER);
      }

    } else if (_phase === PHASE_COUNTER) {
      // G = accept, Y = counter, Z = reject
      if (consumeKey('G')) {
        // Accept terms — proceed to exchange
        showMessage('TERMS ACCEPTED', '#22ff44', 2.0);
        setPhase(PHASE_EXCHANGE);
      } else if (consumeKey('Y')) {
        // Counter — re-run counter dialogue, slight threat rise
        _threatLevel = Math.min(1.0, _threatLevel + 0.15);
        startDialogue(DIALOGUE[PHASE_COUNTER]);
        _phaseTimer = 0;
        showMessage('COUNTER SENT — THEY ARE UNHAPPY', '#ffcc00', 2.0);
      } else if (consumeKey('Z')) {
        // Reject — negotiations collapse
        handleExchangeFailed('TERMS_REJECTED');
      } else if (_phaseTimer > 20.0) {
        // Timeout — reject
        handleExchangeFailed('TIMEOUT');
      }

    } else if (_phase === PHASE_EXCHANGE) {
      if (_ambushTriggered) {
        // Ambush phase — player must survive 2 seconds
        if (_ambushReactTimer <= 0) {
          // Timer expired — consider it survived, exchange still happens
          _ambushTriggered = false;
          handleExchangeSuccess();
        }
      } else {
        // Normal exchange walk — complete after 5 seconds
        if (_phaseTimer > 5.0) {
          handleExchangeSuccess();
        }
      }
    }
  }

  function updateNPCMovement(delta) {
    var i;

    // Prisoners walking toward player after success
    if (_phase === PHASE_COMPLETE) {
      for (i = 0; i < _prisoners.length; i++) {
        var p = _prisoners[i];
        if (!p.userData.walkToPlayer || p.userData.collapsed) continue;

        var target = _camera ? _camera.position : new THREE.Vector3(0, 0, 0);
        var dir    = new THREE.Vector3(
          target.x - p.position.x,
          0,
          target.z - p.position.z
        );
        var dist = dir.length();
        if (dist > 1.0) {
          dir.normalize();
          p.position.x += dir.x * WALK_SPEED * delta;
          p.position.z += dir.z * WALK_SPEED * delta;
          p.lookAt(new THREE.Vector3(target.x, p.position.y, target.z));
        }
      }
    }

    // Negotiator fleeing
    if (_negotiator && _negotiator.userData.fleeing) {
      var fleeDir = new THREE.Vector3(
        _negotiator.position.x - _zonePosition.x,
        0,
        _negotiator.position.z - _zonePosition.z
      );
      if (fleeDir.length() < 0.01) {
        fleeDir.set(0, 0, 1);
      }
      fleeDir.normalize();
      _negotiator.position.x += fleeDir.x * WALK_SPEED * 1.8 * delta;
      _negotiator.position.z += fleeDir.z * WALK_SPEED * 1.8 * delta;

      // Remove when far enough
      if (_negotiator.position.distanceTo(_zonePosition) > 60) {
        _scene.remove(_negotiator);
        _negotiator = null;
      }
    }

    // Ambush enemies rushing toward zone center
    for (i = 0; i < _ambushEnemies.length; i++) {
      var enemy = _ambushEnemies[i];
      if (!enemy.userData.alive) continue;

      var eDir = new THREE.Vector3(
        _zonePosition.x - enemy.position.x,
        0,
        _zonePosition.z - enemy.position.z
      );
      var eDist = eDir.length();
      if (eDist > 1.5) {
        eDir.normalize();
        enemy.position.x += eDir.x * enemy.userData.speed * delta;
        enemy.position.z += eDir.z * enemy.userData.speed * delta;
      }
    }
  }

  // ── Public Reset ─────────────────────────────────────────────

  function reset() {
    var i;

    // Remove all scene objects
    if (_exchangeZone) {
      _scene.remove(_exchangeZone);
      _exchangeZone = null;
    }
    for (i = 0; i < _prisoners.length; i++) {
      _scene.remove(_prisoners[i]);
    }
    _prisoners = [];

    if (_negotiator) {
      _scene.remove(_negotiator);
      _negotiator = null;
    }

    for (i = 0; i < _ambushEnemies.length; i++) {
      _scene.remove(_ambushEnemies[i]);
    }
    _ambushEnemies = [];

    // Reset state
    _phase              = PHASE_IDLE;
    _phaseTimer         = 0;
    _threatLevel        = 0;
    _isAiming           = false;
    _ambushTriggered    = false;
    _ambushReactTimer   = 0;
    _exchangeActive     = false;
    _dialogueLines      = [];
    _dialogueIndex      = 0;
    _dialogueChars      = 0;
    _dialogueTimer      = 0;
    _dialogueCurrentLine = '';
    _messageTimer       = 0;
    _keyState           = {};
    _keyPressedThisFrame = {};

    if (_scoreLabel) _scoreLabel._timer = 0;

    updateHUD();
  }

  // ── Public API ───────────────────────────────────────────────

  return {
    init:            init,
    update:          update,
    triggerExchange: triggerExchange,
    reset:           reset,
    getPhase:        function () { return _phase; },
    getThreat:       function () { return _threatLevel; },
    getScore:        function () { return _score; }
  };

})();
