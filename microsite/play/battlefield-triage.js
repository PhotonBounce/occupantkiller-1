window.BattlefieldTriage = (function() {
  'use strict';

  // ── Constants ──
  var CASUALTY_COUNT = 6;
  var SPAWN_RADIUS = 30;
  var ASSESS_DISTANCE = 2;
  var ASSESS_TIME = 3000;
  var DETERIORATION_RATE = 5; // HP/sec for T1
  var EVAC_DURATION = 10000; // ms
  var INITIAL_SUPPLIES = 8;

  var CATEGORIES = {
    T1: { label: 'T1 IMMEDIATE', color: '#FF0000', colorHex: 0xFF0000, textColor: 'red' },
    T2: { label: 'T2 DELAYED',   color: '#FFD700', colorHex: 0xFFD700, textColor: 'yellow' },
    T3: { label: 'T3 MINIMAL',   color: '#00CC00', colorHex: 0x00CC00, textColor: 'lime' },
    T4: { label: 'T4 EXPECTANT', color: '#333333', colorHex: 0x333333, textColor: '#aaa' }
  };

  var TREATMENTS = {
    TOURNIQUET: { label: 'TOURNIQUET', time: 2000, cost: 1 },
    CHEST_SEAL: { label: 'CHEST SEAL', time: 3000, cost: 2 },
    IV_LINE:    { label: 'IV LINE',    time: 4000, cost: 2 },
    AIRWAY:     { label: 'AIRWAY',     time: 2000, cost: 1 }
  };

  var SCORES = { T1_SAVED: 400, T2_SAVED: 200, T3_SAVED: 100, T4_EVAC: 50, DIED: -200 };

  // ── Module State ──
  var _active = false;
  var _scene = null;
  var _camera = null;
  var _playerMesh = null;
  var _renderer = null;
  var _casualties = [];
  var _supplies = INITIAL_SUPPLIES;
  var _score = 0;
  var _evacCount = 0;
  var _startTime = 0;
  var _lastUpdate = 0;
  var _assessingId = null;
  var _assessTimer = 0;
  var _treatmentTarget = null;
  var _treatmentAction = null;
  var _treatmentTimer = 0;
  var _treatmentStartTime = 0;
  var _hudEl = null;
  var _panelEl = null;
  var _treatMenuEl = null;
  var _assessRingEl = null;
  var _aarEl = null;
  var _statusLabels = {};
  var _idCounter = 0;
  var _keysDown = {};
  var _bDown = false;
  var _tDown = false;
  var _eDown = false;
  var _eWasDown = false;
  var _onKeyDown = null;
  var _onKeyUp = null;
  var _containerEl = null;

  // ── Vital Signs helpers ──
  function _vitalsByCategory(cat) {
    if (cat === 'T1') return { hr: (120 + Math.floor(Math.random()*40)), bp: (70 + Math.floor(Math.random()*20)) + '/' + (40 + Math.floor(Math.random()*15)) };
    if (cat === 'T2') return { hr: (100 + Math.floor(Math.random()*30)), bp: (90 + Math.floor(Math.random()*20)) + '/' + (60 + Math.floor(Math.random()*15)) };
    if (cat === 'T3') return { hr: (70  + Math.floor(Math.random()*30)), bp: (110+ Math.floor(Math.random()*20)) + '/' + (70 + Math.floor(Math.random()*15)) };
    return { hr: (30 + Math.floor(Math.random()*30)),  bp: (50 + Math.floor(Math.random()*20)) + '/' + (30 + Math.floor(Math.random()*10)) };
  }

  // ── Casualty factory ──
  function _createCasualty(playerPos) {
    var angle = Math.random() * Math.PI * 2;
    var dist  = 10 + Math.random() * (SPAWN_RADIUS - 10);
    var x = playerPos.x + Math.cos(angle) * dist;
    var z = playerPos.z + Math.sin(angle) * dist;

    var cats = ['T1','T1','T2','T2','T3','T4'];
    var catKey = cats[_idCounter % cats.length];
    var vitals = _vitalsByCategory(catKey);

    // Prone cylinder (horizontal)
    var geo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2; // lay flat
    mesh.position.set(x, 0.15, z);
    _scene.add(mesh);

    var id = _idCounter++;
    var casualty = {
      id: id,
      mesh: mesh,
      category: catKey,
      trueCat: catKey,
      assessed: false,
      hp: 100,
      vitals: vitals,
      treatments: [],
      status: 'alive',   // alive | stable | evac | dead
      bleedingStopped: false,
      outcome: null,
      labelEl: null,
      stretcherMesh: null,
      buddyMeshes: [],
      evacProgress: 0,
      evacStartPos: null,
      evacTargetPos: null
    };

    // CSS label
    var lbl = document.createElement('div');
    lbl.style.cssText = 'position:absolute;pointer-events:none;font-size:11px;font-weight:bold;text-shadow:1px 1px 2px #000;white-space:nowrap;display:none;';
    lbl.textContent = 'UNKNOWN';
    lbl.style.color = '#ffffff';
    (_containerEl || document.body).appendChild(lbl);
    casualty.labelEl = lbl;

    _casualties.push(casualty);
    return casualty;
  }

  // ── 3D → screen projection ──
  function _worldToScreen(pos3d) {
    var vec = pos3d.clone();
    vec.project(_camera);
    var canvas = _renderer.domElement;
    var x = (vec.x * 0.5 + 0.5) * canvas.clientWidth;
    var y = (-(vec.y) * 0.5 + 0.5) * canvas.clientHeight;
    return { x: x, y: y, behind: vec.z > 1 };
  }

  // ── Update label positions ──
  function _updateLabels() {
    for (var i = 0; i < _casualties.length; i++) {
      var c = _casualties[i];
      if (!c.labelEl) continue;
      var above = c.mesh.position.clone();
      above.y += 1.2;
      var s = _worldToScreen(above);
      if (s.behind) {
        c.labelEl.style.display = 'none';
        continue;
      }
      c.labelEl.style.display = 'block';
      c.labelEl.style.left = (s.x - 40) + 'px';
      c.labelEl.style.top  = (s.y - 10) + 'px';
    }
  }

  // ── Update a single casualty label text/color ──
  function _refreshLabel(c) {
    if (!c.labelEl) return;
    if (!c.assessed) {
      c.labelEl.textContent = 'CASUALTY';
      c.labelEl.style.color = '#ffffff';
    } else {
      var catData = CATEGORIES[c.category];
      c.labelEl.textContent = catData.label;
      c.labelEl.style.color = catData.color;
    }
    if (c.status === 'dead') {
      c.labelEl.textContent = 'KIA';
      c.labelEl.style.color = '#555';
    }
    if (c.status === 'evac') {
      c.labelEl.textContent = 'EVAC';
      c.labelEl.style.color = '#00cfff';
    }
  }

  // ── HUD ──
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'triage-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'z-index:900',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;
    var t1=0, t2=0, t3=0, t4=0;
    for (var i = 0; i < _casualties.length; i++) {
      var c = _casualties[i];
      if (c.category==='T1') t1++;
      else if (c.category==='T2') t2++;
      else if (c.category==='T3') t3++;
      else if (c.category==='T4') t4++;
    }
    _hudEl.style.display = 'block';
    _hudEl.textContent = 'TRIAGE [T1:'+t1+' T2:'+t2+' T3:'+t3+' T4:'+t4+'] [SUPPLIES:'+_supplies+'] [EVAC: '+_evacCount+'/'+CASUALTY_COUNT+']';
  }

  // ── Triage Panel (side panel) ──
  function _createPanel() {
    _panelEl = document.createElement('div');
    _panelEl.id = 'triage-panel';
    _panelEl.style.cssText = [
      'position:fixed',
      'top:80px',
      'right:10px',
      'width:220px',
      'background:rgba(0,0,0,0.82)',
      'color:#eee',
      'font-family:monospace',
      'font-size:11px',
      'padding:8px',
      'border:1px solid #555',
      'border-radius:4px',
      'z-index:900',
      'display:none',
      'max-height:70vh',
      'overflow-y:auto'
    ].join(';');
    document.body.appendChild(_panelEl);
  }

  function _updatePanel() {
    if (!_panelEl) return;
    _panelEl.style.display = _active ? 'block' : 'none';
    if (!_active) return;
    var html = '<b style="color:#ff8800">MASS CASUALTY TRIAGE</b><br><hr style="border-color:#444;margin:4px 0">';
    for (var i = 0; i < _casualties.length; i++) {
      var c = _casualties[i];
      var catData = c.assessed ? CATEGORIES[c.category] : null;
      var color = catData ? catData.color : '#888';
      var catLabel = c.assessed ? catData.label : 'UNKNOWN';
      var statusStr = c.status === 'dead' ? '<span style="color:#555">KIA</span>' :
                      c.status === 'evac' ? '<span style="color:#00cfff">EVACUATING</span>' :
                      c.status === 'stable' ? '<span style="color:#00ff88">STABLE</span>' :
                      '<span style="color:#ff8888">'+Math.round(c.hp)+'HP</span>';
      html += '<div style="margin:3px 0;padding:3px;border-left:3px solid '+color+'">';
      html += '<span style="color:'+color+'">CAS-'+(i+1)+' '+catLabel+'</span> '+statusStr+'<br>';
      if (c.assessed) {
        html += 'HR:'+c.vitals.hr+' BP:'+c.vitals.bp+'<br>';
        if (c.treatments.length > 0) html += '<span style="color:#aaffaa">Tx: '+c.treatments.join(', ')+'</span><br>';
      }
      html += '</div>';
    }
    _panelEl.innerHTML = html;
  }

  // ── Assessment ring ──
  function _createAssessRing() {
    _assessRingEl = document.createElement('div');
    _assessRingEl.id = 'triage-assess-ring';
    _assessRingEl.style.cssText = [
      'position:fixed',
      'width:44px',
      'height:44px',
      'border-radius:50%',
      'border:3px solid transparent',
      'border-top-color:#00ff88',
      'box-sizing:border-box',
      'animation:triageAssessSpin 3s linear infinite',
      'display:none',
      'z-index:910',
      'pointer-events:none',
      'transform:translate(-50%,-50%)'
    ].join(';');

    var style = document.createElement('style');
    style.textContent = '@keyframes triageAssessSpin { 0%{transform:translate(-50%,-50%) rotate(0deg)} 100%{transform:translate(-50%,-50%) rotate(360deg)} }';
    document.head.appendChild(style);
    document.body.appendChild(_assessRingEl);
  }

  // ── Treatment sub-menu ──
  function _createTreatMenu() {
    _treatMenuEl = document.createElement('div');
    _treatMenuEl.id = 'triage-treat-menu';
    _treatMenuEl.style.cssText = [
      'position:fixed',
      'background:rgba(0,0,0,0.88)',
      'color:#eee',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px',
      'border:1px solid #888',
      'border-radius:4px',
      'z-index:920',
      'display:none',
      'min-width:160px'
    ].join(';');
    document.body.appendChild(_treatMenuEl);
  }

  function _showTreatMenu(c, screenX, screenY) {
    if (!_treatMenuEl) return;
    _treatmentTarget = c;
    var catData = CATEGORIES[c.category];
    var options = [];
    if (c.category === 'T1') {
      options.push({ key: 'TOURNIQUET', label: 'TOURNIQUET (2s, 1 sup)' });
      options.push({ key: 'CHEST_SEAL', label: 'CHEST SEAL (3s, 2 sup)' });
      options.push({ key: 'AIRWAY',     label: 'AIRWAY (2s, 1 sup)' });
    } else if (c.category === 'T2') {
      options.push({ key: 'IV_LINE',    label: 'IV LINE (4s, 2 sup)' });
      options.push({ key: 'TOURNIQUET', label: 'TOURNIQUET (2s, 1 sup)' });
    } else if (c.category === 'T3') {
      options.push({ key: 'TOURNIQUET', label: 'TOURNIQUET (2s, 1 sup)' });
    }

    var html = '<b style="color:'+catData.color+'">'+catData.label+'</b><br>';
    html += '<small>HP: '+Math.round(c.hp)+'</small><br><hr style="border-color:#444;margin:4px 0">';
    for (var i = 0; i < options.length; i++) {
      var op = options[i];
      var alreadyDone = c.treatments.indexOf(op.key) >= 0;
      var cls = alreadyDone ? 'color:#555;text-decoration:line-through' : 'color:#0cf;cursor:pointer';
      html += '<div data-tx="'+op.key+'" style="padding:3px 0;'+cls+'">'+op.label+'</div>';
    }
    html += '<div data-tx="CLOSE" style="padding:3px 0;color:#f88;cursor:pointer;margin-top:4px">[ CLOSE ]</div>';
    _treatMenuEl.innerHTML = html;
    _treatMenuEl.style.left = Math.min(screenX, window.innerWidth - 180) + 'px';
    _treatMenuEl.style.top  = Math.min(screenY, window.innerHeight - 200) + 'px';
    _treatMenuEl.style.display = 'block';

    _treatMenuEl.onclick = function(e) {
      var tx = e.target.getAttribute('data-tx');
      if (!tx) return;
      if (tx === 'CLOSE') { _hideTreatMenu(); return; }
      if (TREATMENTS[tx]) _startTreatment(c, tx);
    };
  }

  function _hideTreatMenu() {
    if (_treatMenuEl) _treatMenuEl.style.display = 'none';
    _treatmentTarget = null;
  }

  // ── Start a treatment ──
  function _startTreatment(c, txKey) {
    if (_supplies < TREATMENTS[txKey].cost) {
      _showNotice('INSUFFICIENT SUPPLIES', '#ff4444');
      _hideTreatMenu();
      return;
    }
    if (c.treatments.indexOf(txKey) >= 0) {
      _hideTreatMenu();
      return;
    }
    _supplies -= TREATMENTS[txKey].cost;
    _treatmentTarget = c;
    _treatmentAction = txKey;
    _treatmentTimer = TREATMENTS[txKey].time;
    _treatmentStartTime = performance.now();
    _hideTreatMenu();
    _showNotice('Applying ' + TREATMENTS[txKey].label + '...', '#ffff00');
  }

  // ── Apply treatment effect ──
  function _applyTreatmentEffect(c, txKey) {
    c.treatments.push(txKey);
    if (txKey === 'TOURNIQUET' && c.category === 'T1') {
      c.bleedingStopped = true;
    }
    var elapsed = (performance.now() - _startTime) / 1000;
    if (c.category === 'T1' && (c.bleedingStopped || elapsed < 60)) {
      c.status = 'stable';
      _refreshLabel(c);
    } else if (c.category === 'T2') {
      c.status = 'stable';
      _refreshLabel(c);
    } else if (c.category === 'T3') {
      c.status = 'stable';
      _refreshLabel(c);
    }
    _showNotice(TREATMENTS[txKey].label + ' applied!', '#00ff88');
  }

  // ── Evac ──
  function _startEvac(c) {
    if (c.status !== 'stable' && c.status !== 'alive') return;
    if (c.status === 'evac' || c.status === 'dead') return;
    c.status = 'evac';
    _evacCount++;
    _refreshLabel(c);

    // Stretcher
    var stretchGeo = new THREE.BoxGeometry(0.5, 0.1, 2.0);
    var stretchMat = new THREE.MeshLambertMaterial({ color: 0x228833 });
    c.stretcherMesh = new THREE.Mesh(stretchGeo, stretchMat);
    c.stretcherMesh.position.copy(c.mesh.position);
    _scene.add(c.stretcherMesh);

    // 2 buddy NPCs
    for (var b = 0; b < 2; b++) {
      var buddyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.6, 8);
      var buddyMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
      var buddy = new THREE.Mesh(buddyGeo, buddyMat);
      buddy.position.set(c.mesh.position.x + (b === 0 ? -0.6 : 0.6), 0.8, c.mesh.position.z);
      _scene.add(buddy);
      c.buddyMeshes.push(buddy);
    }

    c.evacStartPos = c.mesh.position.clone();
    var edgeAngle = Math.atan2(c.mesh.position.z, c.mesh.position.x);
    c.evacTargetPos = new THREE.Vector3(
      Math.cos(edgeAngle) * (SPAWN_RADIUS + 15),
      c.mesh.position.y,
      Math.sin(edgeAngle) * (SPAWN_RADIUS + 15)
    );
    c.evacProgress = 0;
  }

  function _updateEvac(c, dt) {
    if (c.status !== 'evac') return;
    c.evacProgress += dt / (EVAC_DURATION / 1000);
    if (c.evacProgress >= 1) {
      c.evacProgress = 1;
      // Remove from scene
      _scene.remove(c.mesh);
      if (c.stretcherMesh) _scene.remove(c.stretcherMesh);
      for (var b = 0; b < c.buddyMeshes.length; b++) _scene.remove(c.buddyMeshes[b]);
      if (c.labelEl) { c.labelEl.style.display = 'none'; }
      c.status = 'removed';
      c.outcome = (c.category === 'T4') ? 'T4_EVAC' : (c.trueCat + '_SAVED');
      _addScore(c);
      return;
    }
    var t = c.evacProgress;
    var pos = new THREE.Vector3().lerpVectors(c.evacStartPos, c.evacTargetPos, t);
    c.mesh.position.copy(pos);
    if (c.stretcherMesh) c.stretcherMesh.position.copy(pos);
    for (var bi = 0; bi < c.buddyMeshes.length; bi++) {
      c.buddyMeshes[bi].position.set(pos.x + (bi===0?-0.6:0.6), 0.8, pos.z);
    }
  }

  function _addScore(c) {
    if (c.outcome === 'T4_EVAC') { _score += SCORES.T4_EVAC; }
    else if (c.trueCat === 'T1') { _score += SCORES.T1_SAVED; }
    else if (c.trueCat === 'T2') { _score += SCORES.T2_SAVED; }
    else if (c.trueCat === 'T3') { _score += SCORES.T3_SAVED; }
  }

  // ── Notices ──
  var _noticeEl = null;
  var _noticeTimeout = null;

  function _showNotice(text, color) {
    if (!_noticeEl) {
      _noticeEl = document.createElement('div');
      _noticeEl.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'background:rgba(0,0,0,0.8)',
        'color:#fff',
        'font-family:monospace',
        'font-size:16px',
        'padding:10px 20px',
        'border-radius:6px',
        'z-index:950',
        'pointer-events:none',
        'display:none'
      ].join(';');
      document.body.appendChild(_noticeEl);
    }
    _noticeEl.textContent = text;
    _noticeEl.style.color = color || '#fff';
    _noticeEl.style.display = 'block';
    if (_noticeTimeout) clearTimeout(_noticeTimeout);
    _noticeTimeout = setTimeout(function() {
      if (_noticeEl) _noticeEl.style.display = 'none';
    }, 2000);
  }

  // ── AAR Panel ──
  function _showAAR() {
    if (_aarEl) { _aarEl.style.display = 'none'; }
    _aarEl = document.createElement('div');
    _aarEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.93)',
      'color:#eee',
      'font-family:monospace',
      'font-size:13px',
      'padding:20px',
      'border:2px solid #ff8800',
      'border-radius:8px',
      'z-index:999',
      'min-width:320px',
      'max-height:80vh',
      'overflow-y:auto'
    ].join(';');

    var elapsed = Math.round((performance.now() - _startTime) / 1000);
    var html = '<b style="color:#ff8800;font-size:15px">AFTER ACTION REVIEW</b><br>';
    html += '<hr style="border-color:#444;margin:6px 0">';
    for (var i = 0; i < _casualties.length; i++) {
      var c = _casualties[i];
      var catData = CATEGORIES[c.trueCat];
      var outcomeStr = '';
      var outcomeColor = '#aaa';
      if (c.status === 'dead') { outcomeStr = 'KIA / DIED'; outcomeColor = '#f44'; }
      else if (c.status === 'removed') {
        if (c.trueCat === 'T4') { outcomeStr = 'EVACUATED'; outcomeColor = '#aaa'; }
        else { outcomeStr = 'SAVED'; outcomeColor = '#0f0'; }
      } else {
        outcomeStr = 'LEFT BEHIND'; outcomeColor = '#f84';
      }
      html += '<div style="margin:4px 0;padding:3px;border-left:3px solid '+catData.color+'">';
      html += 'CAS-'+(i+1)+' <span style="color:'+catData.color+'">'+catData.label+'</span> ';
      html += '→ <span style="color:'+outcomeColor+'">'+outcomeStr+'</span>';
      if (c.treatments.length) html += '<br><small>Tx: '+c.treatments.join(', ')+'</small>';
      html += '</div>';
    }
    html += '<hr style="border-color:#444;margin:6px 0">';
    html += '<b>TOTAL SCORE: <span style="color:#ff8800">'+_score+'</span></b><br>';
    html += 'Time: '+elapsed+'s<br>';
    html += '<br><div id="triage-aar-close" style="color:#0cf;cursor:pointer;text-align:center;border:1px solid #0cf;padding:4px">[ CLOSE ]</div>';
    _aarEl.innerHTML = html;
    document.body.appendChild(_aarEl);
    document.getElementById('triage-aar-close').onclick = function() {
      if (_aarEl) { _aarEl.style.display = 'none'; _aarEl = null; }
    };
  }

  // ── Check event end ──
  function _checkEventEnd() {
    var done = true;
    for (var i = 0; i < _casualties.length; i++) {
      var s = _casualties[i].status;
      if (s !== 'removed' && s !== 'dead') { done = false; break; }
    }
    if (done) {
      _showAAR();
      _stopEvent();
    }
  }

  // ── Start event ──
  function _startEvent() {
    if (_active) return;
    _active = true;
    _casualties = [];
    _supplies = INITIAL_SUPPLIES;
    _score = 0;
    _evacCount = 0;
    _idCounter = 0;
    _startTime = performance.now();
    _assessingId = null;
    _treatmentTarget = null;
    _treatmentAction = null;

    var playerPos = _playerMesh ? _playerMesh.position : new THREE.Vector3(0,0,0);
    for (var i = 0; i < CASUALTY_COUNT; i++) {
      _createCasualty(playerPos);
    }
    _updateHUD();
    _updatePanel();
    _showNotice('MASS CASUALTY EVENT — TRIAGE REQUIRED', '#ff4400');
  }

  // ── Stop event (cleanup) ──
  function _stopEvent() {
    _active = false;
    if (_hudEl) _hudEl.style.display = 'none';
    if (_panelEl) _panelEl.style.display = 'none';
    if (_assessRingEl) _assessRingEl.style.display = 'none';
    _hideTreatMenu();
  }

  // ── Key handlers ──
  function _onKD(e) {
    var k = e.key ? e.key.toUpperCase() : '';
    _keysDown[k] = true;
    if (k === 'B') _bDown = true;
    if (k === 'T' && _bDown) {
      _startEvent();
    }
    if (k === 'E') {
      if (!_eWasDown && _active) {
        _tryEvac();
      }
      _eWasDown = true;
    }
  }

  function _onKU(e) {
    var k = e.key ? e.key.toUpperCase() : '';
    _keysDown[k] = false;
    if (k === 'B') _bDown = false;
    if (k === 'E') _eWasDown = false;
  }

  function _tryEvac() {
    if (!_playerMesh) return;
    var pp = _playerMesh.position;
    var nearest = null;
    var nearestDist = 999;
    for (var i = 0; i < _casualties.length; i++) {
      var c = _casualties[i];
      if (c.status === 'evac' || c.status === 'dead' || c.status === 'removed') continue;
      var d = pp.distanceTo(c.mesh.position);
      if (d < nearestDist) { nearestDist = d; nearest = c; }
    }
    if (nearest && nearestDist < 3) {
      _startEvac(nearest);
      _showNotice('EVAC CALLED — STRETCHER EN ROUTE', '#00cfff');
    }
  }

  // ── Click on casualties ──
  function _onCanvasClick(e) {
    if (!_active) return;
    var canvas = _renderer.domElement;
    var rect = canvas.getBoundingClientRect();
    var mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mx, my), _camera);

    var meshes = [];
    for (var i = 0; i < _casualties.length; i++) {
      if (_casualties[i].status !== 'dead' && _casualties[i].status !== 'removed') {
        meshes.push(_casualties[i].mesh);
      }
    }
    var hits = raycaster.intersectObjects(meshes);
    if (hits.length > 0) {
      var hitMesh = hits[0].object;
      for (var j = 0; j < _casualties.length; j++) {
        var c = _casualties[j];
        if (c.mesh === hitMesh && c.assessed) {
          _showTreatMenu(c, e.clientX, e.clientY);
          break;
        }
      }
    } else {
      _hideTreatMenu();
    }
  }

  // ── Main update ──
  function update(dt) {
    if (!_active) return;

    var now = performance.now();

    // Assessment logic
    if (_playerMesh) {
      var pp = _playerMesh.position;
      var assessingCasualty = null;

      for (var i = 0; i < _casualties.length; i++) {
        var c = _casualties[i];
        if (c.assessed || c.status === 'dead' || c.status === 'removed' || c.status === 'evac') continue;
        var d = pp.distanceTo(c.mesh.position);
        if (d < ASSESS_DISTANCE) {
          if (_assessingId === c.id) {
            // continue assessing
            assessingCasualty = c;
            var elapsed = now - _assessTimer;
            var frac = Math.min(1, elapsed / ASSESS_TIME);
            if (_assessRingEl) {
              var s = _worldToScreen(c.mesh.position.clone().add(new THREE.Vector3(0,1.2,0)));
              if (!s.behind) {
                _assessRingEl.style.display = 'block';
                _assessRingEl.style.left = s.x + 'px';
                _assessRingEl.style.top  = s.y + 'px';
              }
            }
            if (frac >= 1) {
              c.assessed = true;
              _assessingId = null;
              if (_assessRingEl) _assessRingEl.style.display = 'none';
              _refreshLabel(c);
              _updatePanel();
              _showNotice('CAS ASSESSED: ' + CATEGORIES[c.category].label, CATEGORIES[c.category].color);
            }
          } else {
            // start assessing
            _assessingId = c.id;
            _assessTimer = now;
            assessingCasualty = c;
          }
          break;
        }
      }

      if (!assessingCasualty && _assessingId !== null) {
        _assessingId = null;
        if (_assessRingEl) _assessRingEl.style.display = 'none';
      }
    }

    // T1 deterioration
    for (var ci = 0; ci < _casualties.length; ci++) {
      var cas = _casualties[ci];
      if (cas.category === 'T1' && cas.status === 'alive' && !cas.bleedingStopped) {
        cas.hp -= DETERIORATION_RATE * dt;
        if (cas.hp <= 0) {
          cas.hp = 0;
          cas.status = 'dead';
          cas.category = 'T4';
          cas.outcome = 'DIED';
          _score += SCORES.DIED;
          _refreshLabel(cas);
          _updatePanel();
          _showNotice('CASUALTY DIED — TRIAGE FAILED', '#ff0000');
        }
      }
    }

    // Active treatment countdown
    if (_treatmentAction && _treatmentTarget) {
      var txElapsed = now - _treatmentStartTime;
      if (txElapsed >= _treatmentTimer) {
        _applyTreatmentEffect(_treatmentTarget, _treatmentAction);
        _treatmentTarget = null;
        _treatmentAction = null;
        _updatePanel();
      }
    }

    // Evac movement
    for (var ei = 0; ei < _casualties.length; ei++) {
      _updateEvac(_casualties[ei], dt);
    }

    // Labels
    _updateLabels();

    // HUD + panel
    _updateHUD();
    _updatePanel();

    // Check end
    if (_active) _checkEventEnd();
  }

  // ── Init ──
  function init(scene, camera, playerMesh, renderer, containerEl) {
    _scene      = scene;
    _camera     = camera;
    _playerMesh = playerMesh;
    _renderer   = renderer;
    _containerEl = containerEl || document.body;

    _createHUD();
    _createPanel();
    _createAssessRing();
    _createTreatMenu();

    _onKeyDown = _onKD;
    _onKeyUp   = _onKU;
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);

    if (_renderer && _renderer.domElement) {
      _renderer.domElement.addEventListener('click', _onCanvasClick);
    }
  }

  // ── Reset ──
  function reset() {
    _stopEvent();

    // Remove all casualty meshes
    for (var i = 0; i < _casualties.length; i++) {
      var c = _casualties[i];
      if (c.mesh && _scene) _scene.remove(c.mesh);
      if (c.stretcherMesh && _scene) _scene.remove(c.stretcherMesh);
      for (var b = 0; b < c.buddyMeshes.length; b++) {
        if (_scene) _scene.remove(c.buddyMeshes[b]);
      }
      if (c.labelEl && c.labelEl.parentNode) c.labelEl.parentNode.removeChild(c.labelEl);
    }
    _casualties = [];

    if (_hudEl && _hudEl.parentNode) { _hudEl.parentNode.removeChild(_hudEl); _hudEl = null; }
    if (_panelEl && _panelEl.parentNode) { _panelEl.parentNode.removeChild(_panelEl); _panelEl = null; }
    if (_assessRingEl && _assessRingEl.parentNode) { _assessRingEl.parentNode.removeChild(_assessRingEl); _assessRingEl = null; }
    if (_treatMenuEl && _treatMenuEl.parentNode) { _treatMenuEl.parentNode.removeChild(_treatMenuEl); _treatMenuEl = null; }
    if (_noticeEl && _noticeEl.parentNode) { _noticeEl.parentNode.removeChild(_noticeEl); _noticeEl = null; }
    if (_aarEl && _aarEl.parentNode) { _aarEl.parentNode.removeChild(_aarEl); _aarEl = null; }

    if (_onKeyDown) { window.removeEventListener('keydown', _onKeyDown); _onKeyDown = null; }
    if (_onKeyUp)   { window.removeEventListener('keyup',   _onKeyUp);   _onKeyUp   = null; }

    if (_renderer && _renderer.domElement) {
      _renderer.domElement.removeEventListener('click', _onCanvasClick);
    }

    _active = false;
    _scene  = null;
    _camera = null;
    _playerMesh = null;
    _renderer   = null;
    _supplies   = INITIAL_SUPPLIES;
    _score      = 0;
    _evacCount  = 0;
    _idCounter  = 0;
  }

  return { init: init, update: update, reset: reset };

})();
