/* ════════════════════════════════════════════════════════════════════════
 *  LORE-PROPS.JS — Interactive Lore Props (Documents & Intel)
 *
 *  Spawns 6 collectible lore prop items at fixed positions around the level.
 *  Prop types: LETTER, PHOTO, DOCUMENT, DOGTAGS — each glows with a warm
 *  PointLight and shows a "PRESS E TO READ" prompt when the player is close.
 *
 *  E key opens a full-screen styled military document panel with story text.
 *  Reading awards +50 score, saves to localStorage `okk_lore_read_v1`, and
 *  dims the glow on that prop. Collecting all 6 awards a +500 bonus and shows
 *  a "FULL INTEL GATHERED" toast.
 *
 *  HUD shows "INTEL: X/6" in the top-right corner.
 *
 *  Public API:
 *    LoreProps.init(scene)   — call once with the THREE.Scene reference
 *    LoreProps.update(dt, camPos) — call every frame from the game loop
 *    LoreProps.reset()       — clear all props (e.g. on level change)
 *
 *  Globals set:
 *    window._loreCollected   — array of collected prop ids (strings)
 *    window._onLoreRead      — hook: function(propDef) called on each read
 * ════════════════════════════════════════════════════════════════════════ */

window.LoreProps = (function () {
  'use strict';

  /* ── Storage key ─────────────────────────────────────────── */
  var STORAGE_KEY = 'okk_lore_read_v1';
  var INTERACT_RANGE = 1.5;   // units to trigger prompt
  var GLOW_INTENSITY_NORMAL  = 0.8;
  var GLOW_INTENSITY_DIMMED  = 0.18;
  var GLOW_RANGE  = 1.5;
  var BONUS_ALL   = 500;
  var SCORE_READ  = 50;

  /* ── 6 Intel Documents ───────────────────────────────────── */
  var LORE_DOCS = [
    {
      id: 'order_001',
      type: 'DOCUMENT',
      title: 'OPERATIONAL ORDER — KHARKIV AXIS',
      classification: 'TOP SECRET // EYES ONLY',
      text: [
        'DATE: 24 FEB 2022  |  ORIGINATOR: 1st GUARDS TANK ARMY  |  PRIORITY: FLASH',
        '',
        'TO: ALL COMMANDING OFFICERS, KHARKIV GROUP OF FORCES',
        '',
        '1. SITUATION: Ukrainian resistance in urban sectors continues to obstruct',
        '   the northern axis. Enemy forces have retreated into prepared defensive',
        '   positions along the ring road. Artillery preparation has been insufficient.',
        '',
        '2. MISSION: Advance along HIGHWAY P07 and seize KHARKIV CITY CENTRE NLT 72',
        '   HOURS from receipt of this order. Accept no delay. Bypass pockets.',
        '',
        '3. COMMANDER\'S INTENT: The population must understand that resistance is',
        '   futile. Psychological effect is a valid combat multiplier. Collateral',
        '   damage is AUTHORISED at commander discretion.',
        '',
        '4. LOGISTICS: Fuel resupply to follow. Do NOT wait. Momentum is decisive.',
        '',
        'Signed: Lt. Gen. ALEKSANDR ZHURAVLYOV',
        'DESTROY AFTER READING.'
      ].join('\n')
    },
    {
      id: 'letter_002',
      type: 'LETTER',
      title: 'PERSONAL LETTER — FOUND IN ABANDONED DUGOUT',
      classification: 'PERSONAL CORRESPONDENCE',
      text: [
        'Masha,',
        '',
        'I do not know when this will reach you or if it ever will. We have been',
        'moving without sleep for four days. Half the men in my platoon are sick.',
        'Dima lost two toes to frostbite last night and we had no medic to send',
        'him to. He wrapped his foot in his spare shirt.',
        '',
        'They told us it would be three days. A parade, they said. The people',
        'would throw flowers. There are no flowers here. Only fires and silence.',
        '',
        'The village we passed through today — I will not write what I saw.',
        'I will carry it instead.',
        '',
        'I think of you every hour. I think of Petya\'s face when I come home.',
        'I pray that I will see his face again.',
        '',
        'If you receive this from someone other than me, know that I loved you',
        'completely, and that I am sorry I did not refuse when I should have.',
        '',
        'Yours always,',
        'Kostya',
        '',
        '(INTERCEPTED BY UKRAINIAN TERRITORIAL DEFENCE — GRID 48-CHARLIE)'
      ].join('\n')
    },
    {
      id: 'intercept_003',
      type: 'DOCUMENT',
      title: 'INTERCEPTED COMMS — FSB CHANNEL 7',
      classification: 'SIGNALS INTELLIGENCE // UMBRA',
      text: [
        'SOURCE: ELINT PACKAGE BRAVO-7  |  INTERCEPT TIME: 0317 LOCAL',
        'CONFIDENCE: HIGH (88%)  |  TRANSLATED FROM RUSSIAN BY UNIT 8200',
        '',
        '[TRANSMISSION BEGINS]',
        '',
        'ALPHA: The convoy at grid 41-Delta has been destroyed. We lost the fuel.',
        'BRAVO: How? Air?',
        'ALPHA: Bayraktar. Third time this week. The men are afraid to sit still.',
        'BRAVO: Request you remind them that fear is not a valid excuse in reports.',
        'ALPHA: Understood. We also have a problem at the command post.',
        'BRAVO: Speak.',
        'ALPHA: General Gerasimov\'s vehicle struck a mine on approach to—',
        'BRAVO: DO NOT TRANSMIT NAMES ON THIS CHANNEL.',
        'ALPHA: Apologies. The senior visitor is... not injured but his staff officer',
        '       Lieutenant [REDACTED] was killed. Three others wounded.',
        'BRAVO: Understood. Suppress this. No reports to Moscow until I say.',
        'ALPHA: And the families?',
        'BRAVO: What about them.',
        '',
        '[TRANSMISSION ENDS]',
        '',
        'ANALYST NOTE: Subject "senior visitor" is assessed with high confidence',
        'to be Chief of the General Staff. Information forwarded to NATO partners.'
      ].join('\n')
    },
    {
      id: 'photo_004',
      type: 'PHOTO',
      title: 'PHOTOGRAPH — RECOVERED FROM ENEMY KIA',
      classification: 'EVIDENCE DOSSIER // UA-ICC-44',
      text: [
        'ITEM: Polaroid photograph, creased, partial burn damage on lower-left corner.',
        '',
        'DESCRIPTION: Shows a residential apartment building. The top four floors have',
        'collapsed into the floors below. Visible in the foreground: a child\'s bicycle,',
        'a red coat on a rail, a single broken window with curtains still intact.',
        '',
        'On the reverse, handwritten in Russian:',
        '"Mariupol, building 14. We cleared it. — V."',
        '',
        'DATE STAMP: 16 MAR 2022',
        '',
        'CHAIN OF CUSTODY: Recovered from the personal effects of a Russian soldier',
        'identified as Cpl. Vasily NIKITIN, 810th Naval Infantry Brigade, killed in',
        'action near Manhush, 27 March 2022.',
        '',
        'STATUS: Submitted to International Criminal Court as part of evidence',
        'package documenting systematic destruction of civilian infrastructure.',
        'Original photograph retained by Ukraine War Crimes Prosecutor\'s Office.',
        '',
        'REFERENCE: UA-ICC-2022-0391'
      ].join('\n')
    },
    {
      id: 'dogtags_005',
      type: 'DOGTAGS',
      title: 'DOG TAGS — SGT. IVAN PETROVICH MOROZOV',
      classification: 'CASUALTY DOCUMENTATION',
      text: [
        '╔══════════════════════════════╗',
        '║  MILITARY IDENTIFICATION     ║',
        '║  SOVIET / RUSSIAN FEDERATION ║',
        '╚══════════════════════════════╝',
        '',
        '  NAME:     MOROZOV, IVAN PETROVICH',
        '  RANK:     SERGEANT (E-5)',
        '  UNIT:     64th SEPARATE MOTORISED RIFLE BRIGADE',
        '  SERVICE#: RU-77-449-0023-M',
        '  BLOOD:    A+',
        '  DOB:      14 SEP 1999',
        '',
        'FIELD NOTE (written in Ukrainian, attached with tape):',
        '',
        '"These were found at Bucha. He was 22 years old.',
        ' He had a phone. On his phone: photos of his mother,',
        ' photos of a dog named Sharik, and 47 unanswered',
        ' messages from a girl named Oksana.',
        '',
        ' We do not know if she knows yet.',
        '',
        ' We are keeping these until someone can tell her."',
        '',
        '— Territorial Defence Unit, Bucha District'
      ].join('\n')
    },
    {
      id: 'order_006',
      type: 'LETTER',
      title: 'COMMANDER\'S LAST LETTER — MARIUPOL GARRISON',
      classification: 'DECLASSIFIED — RELEASED 2023',
      text: [
        'TO: THE UKRAINIAN PEOPLE',
        'FROM: DEFENDERS OF AZOVSTAL STEEL PLANT',
        'DATE: 17 MAY 2022',
        '',
        'We have held this position for 82 days.',
        '',
        'When they told us Mariupol would fall in hours, we answered with weeks.',
        'When they sent armour, we answered with men who stood in front of it.',
        'When they cut the water, the power, and then the ammunition, we answered',
        'with whatever was left.',
        '',
        'There is very little left now.',
        '',
        'We are soldiers. We understood the terms of this when we signed our names.',
        'What we did not expect — what we could not have expected — was the courage',
        'of the civilians who stayed beside us. The women who cooked in darkness.',
        'The men who carried the wounded. The children who learned not to cry at',
        'the sound of shelling because crying takes energy they needed to survive.',
        '',
        'To the world that watched: we do not blame you for what you could not do.',
        'We ask only that you remember what was done here.',
        '',
        'Mariupol will be rebuilt. Ukraine will endure.',
        '',
        'We go now into captivity, or into whatever comes after.',
        'We go without shame.',
        '',
        'SLAVA UKRAINI.',
        '',
        '— Signed, the Garrison of Azovstal'
      ].join('\n')
    }
  ];

  /* ── Fixed spawn positions [x, y, z] ────────────────────── */
  var SPAWN_POSITIONS = [
    [ -12,  0.9,  -8  ],
    [   8,  0.9,  14  ],
    [  18,  0.9,  -5  ],
    [  -5,  0.9,  20  ],
    [ -20,  0.9,   3  ],
    [   2,  0.9, -18  ]
  ];

  /* ── Internal state ──────────────────────────────────────── */
  var _scene          = null;
  var _props          = [];          // live prop objects
  var _panelOpen      = false;
  var _promptEl       = null;
  var _hudEl          = null;
  var _panelEl        = null;
  var _nearPropIndex  = -1;
  var _time           = 0;
  var _audioCtx       = null;

  /* ── Initialise global hooks ─────────────────────────────── */
  window._loreCollected = window._loreCollected || [];
  window._onLoreRead    = window._onLoreRead    || null;

  /* ── localStorage helpers ────────────────────────────────── */
  function _loadRead() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function _saveRead(idMap) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idMap));
    } catch (e) { /* quota */ }
  }

  function _markRead(id) {
    var map = _loadRead();
    map[id] = true;
    _saveRead(map);
  }

  function _wasRead(id) {
    return !!_loadRead()[id];
  }

  /* ── Audio ───────────────────────────────────────────────── */
  function _getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { }
    return _audioCtx;
  }

  function _playReadSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    /* Paper rustle: shaped noise burst */
    var sr  = ctx.sampleRate;
    var len = Math.floor(sr * 0.25);
    var buf = ctx.createBuffer(1, len, sr);
    var d   = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2) * 0.3;
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var bp  = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 1.2;
    src.connect(bp);
    bp.connect(ctx.destination);
    src.start();

    /* Intel chime: two sine blips */
    var freqs = [660, 880];
    for (var fi = 0; fi < freqs.length; fi++) {
      (function (freq, delay) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      })(freqs[fi], fi * 0.12);
    }
  }

  /* ── Mesh builders ───────────────────────────────────────── */
  function _buildLetter() {
    var g = new THREE.Group();
    /* Paper body */
    var paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.38, 0.015),
      new THREE.MeshLambertMaterial({ color: 0xf8f4e8 })
    );
    g.add(paper);
    /* Fold crease line */
    var crease = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.003, 0.018),
      new THREE.MeshLambertMaterial({ color: 0xd4c898 })
    );
    crease.position.set(0, 0.02, 0);
    g.add(crease);
    /* Envelope flap hint */
    var flap = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.14, 0.012),
      new THREE.MeshLambertMaterial({ color: 0xede7d0 })
    );
    flap.position.set(0, -0.13, -0.003);
    g.add(flap);
    return g;
  }

  function _buildPhoto() {
    var g = new THREE.Group();
    /* Sepia photo body */
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.26, 0.012),
      new THREE.MeshLambertMaterial({ color: 0xb89060 })
    );
    g.add(body);
    /* White border */
    var border = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.30, 0.008),
      new THREE.MeshLambertMaterial({ color: 0xf0ece0 })
    );
    border.position.z = -0.002;
    g.add(border);
    /* Caption strip at bottom */
    var caption = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.06, 0.013),
      new THREE.MeshLambertMaterial({ color: 0xfaf8f2 })
    );
    caption.position.set(0, -0.16, 0.001);
    g.add(caption);
    return g;
  }

  function _buildDocument() {
    var g = new THREE.Group();
    /* Folder body */
    var folder = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.40, 0.018),
      new THREE.MeshLambertMaterial({ color: 0x8b7355 })
    );
    g.add(folder);
    /* Clasp */
    var clasp = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.05, 0.025),
      new THREE.MeshLambertMaterial({ color: 0xc8a030 })
    );
    clasp.position.set(0, 0.18, 0.005);
    g.add(clasp);
    /* Papers peeking out top */
    var pages = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.06, 0.014),
      new THREE.MeshLambertMaterial({ color: 0xf0ece0 })
    );
    pages.position.set(0, 0.21, -0.001);
    g.add(pages);
    /* Stamp mark */
    var stamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.07, 0.019),
      new THREE.MeshLambertMaterial({ color: 0x8b0000, transparent: true, opacity: 0.75 })
    );
    stamp.position.set(-0.06, -0.10, 0.010);
    stamp.rotation.z = -0.22;
    g.add(stamp);
    return g;
  }

  function _buildDogtags() {
    var g = new THREE.Group();
    /* Two metal plates */
    var mat = new THREE.MeshLambertMaterial({ color: 0xa8a8a0 });
    var tag1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.012), mat);
    tag1.position.set(-0.04, 0.04, 0);
    g.add(tag1);
    var tag2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.20, 0.012), mat);
    tag2.position.set( 0.06, -0.04, 0.006);
    g.add(tag2);
    /* Chain links (simple horizontal bar) */
    var chainMat = new THREE.MeshLambertMaterial({ color: 0x888880 });
    for (var ci = 0; ci < 5; ci++) {
      var link = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.036, 0.008),
        chainMat
      );
      link.position.set(-0.04 + ci * 0.025, 0.18 + ci * 0.030, 0.002);
      link.rotation.z = (ci % 2 === 0) ? 0 : 0.4;
      g.add(link);
    }
    return g;
  }

  var _BUILDERS = {
    LETTER:   _buildLetter,
    PHOTO:    _buildPhoto,
    DOCUMENT: _buildDocument,
    DOGTAGS:  _buildDogtags
  };

  /* ── HUD counter ─────────────────────────────────────────── */
  function _ensureHud() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'lorePropsHud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:14px',
      'right:14px',
      'z-index:820',
      'font-family:"Courier New",Courier,monospace',
      'font-size:13px',
      'color:#c8d4b0',
      'background:rgba(0,0,0,0.58)',
      'padding:4px 10px',
      'border-radius:3px',
      'border:1px solid #4a5a2a',
      'pointer-events:none',
      'user-select:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHud() {
    _ensureHud();
    var total   = _props.length;
    var readMap = _loadRead();
    var count   = 0;
    for (var i = 0; i < _props.length; i++) {
      if (readMap[_props[i].def.id]) count++;
    }
    _hudEl.style.display = total > 0 ? '' : 'none';
    _hudEl.style.color = (count >= total && total > 0) ? '#ffd700' : '#c8d4b0';
    _hudEl.textContent = 'INTEL: ' + count + '/' + total;
    return count;
  }

  /* ── "PRESS E TO READ" prompt ────────────────────────────── */
  function _ensurePrompt() {
    if (_promptEl) return;
    _promptEl = document.createElement('div');
    _promptEl.id = 'lorePropsPrompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:820',
      'font-family:"Courier New",Courier,monospace',
      'font-size:14px',
      'font-weight:bold',
      'color:#ffe88a',
      'background:rgba(0,0,0,0.65)',
      'padding:5px 16px',
      'border-radius:4px',
      'border:1px solid #7a6a20',
      'pointer-events:none',
      'display:none',
      'letter-spacing:2px',
      'text-shadow:0 0 8px rgba(255,220,100,0.6)'
    ].join(';');
    _promptEl.textContent = 'PRESS E TO READ';
    document.body.appendChild(_promptEl);
  }

  function _showPrompt(show) {
    _ensurePrompt();
    _promptEl.style.display = show ? 'block' : 'none';
  }

  /* ── Lore panel ──────────────────────────────────────────── */
  function _openPanel(def) {
    if (_panelEl) _closePanel();
    _panelOpen = true;

    var overlay = document.createElement('div');
    overlay.id = 'lorePropPanel';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:1200',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.82)',
      'font-family:"Courier New",Courier,monospace'
    ].join(';');

    var panel = document.createElement('div');
    panel.style.cssText = [
      'position:relative',
      'max-width:680px',
      'width:90vw',
      'max-height:85vh',
      'overflow-y:auto',
      'background:#ddd3a0',
      'border:3px double #8a6a20',
      'box-shadow:0 0 0 8px rgba(0,0,0,0.7),inset 0 0 30px rgba(0,0,0,0.18)',
      'padding:30px 36px 26px 36px',
      'color:#1a1200',
      'position:relative'
    ].join(';');

    /* Classified stamp — top right corner */
    var stamp = document.createElement('div');
    stamp.style.cssText = [
      'position:absolute',
      'top:18px',
      'right:20px',
      'border:2px solid #8b0000',
      'color:#8b0000',
      'font-size:11px',
      'font-weight:bold',
      'letter-spacing:3px',
      'padding:3px 8px',
      'transform:rotate(6deg)',
      'opacity:0.85',
      'pointer-events:none'
    ].join(';');
    stamp.textContent = def.classification;
    panel.appendChild(stamp);

    /* Header bar */
    var header = document.createElement('div');
    header.style.cssText = [
      'font-size:10px',
      'letter-spacing:4px',
      'color:#5a4010',
      'margin-bottom:8px',
      'padding-bottom:6px',
      'border-bottom:2px solid #8a6a20',
      'display:flex',
      'align-items:center',
      'gap:10px'
    ].join(';');

    var typeTag = document.createElement('span');
    typeTag.style.cssText = 'background:#5a4010;color:#e0c87a;padding:2px 7px;font-size:9px;letter-spacing:2px;';
    typeTag.textContent = def.type;
    header.appendChild(typeTag);

    var headerText = document.createElement('span');
    headerText.textContent = '— RECOVERED DOCUMENT —';
    header.appendChild(headerText);
    panel.appendChild(header);

    /* Title */
    var title = document.createElement('div');
    title.style.cssText = [
      'font-size:17px',
      'font-weight:bold',
      'letter-spacing:1.5px',
      'margin-bottom:18px',
      'margin-top:10px',
      'color:#2a1a00'
    ].join(';');
    title.textContent = def.title;
    panel.appendChild(title);

    /* Body text */
    var body = document.createElement('pre');
    body.style.cssText = [
      'font-family:"Courier New",Courier,monospace',
      'font-size:12.5px',
      'line-height:1.65',
      'white-space:pre-wrap',
      'word-break:break-word',
      'margin:0 0 22px 0',
      'color:#2a1800',
      'border-top:1px solid #b09050',
      'padding-top:14px'
    ].join(';');
    body.textContent = def.text;
    panel.appendChild(body);

    /* Close button */
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '[ CLOSE DOCUMENT ]';
    closeBtn.style.cssText = [
      'display:block',
      'margin:0 auto',
      'background:#3a2800',
      'color:#e0c87a',
      'border:1px solid #c8a030',
      'font-family:"Courier New",Courier,monospace',
      'font-size:13px',
      'letter-spacing:2px',
      'padding:7px 22px',
      'cursor:pointer'
    ].join(';');
    closeBtn.addEventListener('click', _closePanel);
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) _closePanel();
    });
    document.body.appendChild(overlay);
    _panelEl = overlay;
  }

  function _closePanel() {
    if (_panelEl && _panelEl.parentNode) {
      _panelEl.parentNode.removeChild(_panelEl);
    }
    _panelEl  = null;
    _panelOpen = false;
  }

  /* ── Score helper ────────────────────────────────────────── */
  function _addScore(amount) {
    /* Try every known score surface in order of reliability */
    if (typeof window.GameManager !== 'undefined') {
      var gm = window.GameManager;
      if (gm._player && typeof gm._player.score === 'number') {
        gm._player.score += amount;
        if (typeof window.HUD !== 'undefined' && typeof window.HUD.setScore === 'function') {
          window.HUD.setScore(gm._player.score);
        }
        return;
      }
    }
    if (typeof window._score === 'number') {
      window._score += amount;
      return;
    }
    if (typeof window.addScore === 'function') {
      window.addScore(amount);
    }
  }

  /* ── Toast helper ────────────────────────────────────────── */
  function _toast(text, color, duration) {
    if (typeof window.HUD !== 'undefined' && typeof window.HUD.showToast === 'function') {
      window.HUD.showToast(text, duration || 3500, color || '#ffe88a');
      return;
    }
    /* Fallback: own simple toast */
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:1300',
      'font-family:"Courier New",Courier,monospace',
      'font-size:15px',
      'font-weight:bold',
      'color:' + (color || '#ffe88a'),
      'background:rgba(0,0,0,0.7)',
      'padding:7px 20px',
      'border-radius:4px',
      'pointer-events:none',
      'letter-spacing:2px'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, duration || 3500);
  }

  /* ── Handle document read ─────────────────────────────────── */
  function _readProp(propObj) {
    var def     = propObj.def;
    var already = _wasRead(def.id);

    _openPanel(def);
    _playReadSound();

    if (!already) {
      /* First-time read: award score + persist */
      _markRead(def.id);
      _addScore(SCORE_READ);

      /* Dim the glow light */
      if (propObj.light) {
        propObj.light.intensity = GLOW_INTENSITY_DIMMED;
      }

      /* Update global collected array */
      window._loreCollected.push(def.id);

      /* Fire hook */
      if (typeof window._onLoreRead === 'function') {
        try { window._onLoreRead(def); } catch (e) { }
      }

      /* Update HUD and check completion */
      var count = _updateHud();
      if (count >= _props.length && _props.length > 0) {
        _onAllRead();
      }
    } else {
      /* Already read: just update HUD */
      _updateHud();
    }
  }

  function _onAllRead() {
    _addScore(BONUS_ALL);
    _toast('FULL INTEL GATHERED — +500 BONUS', '#ffd700', 4500);
    if (_hudEl) {
      _hudEl.style.color = '#ffd700';
      _hudEl.style.textShadow = '0 0 10px #ffd700';
      setTimeout(function () {
        if (_hudEl) _hudEl.style.textShadow = '';
      }, 2000);
    }
    if (typeof window.Achievements !== 'undefined' && typeof window.Achievements.unlock === 'function') {
      window.Achievements.unlock('FULL_INTEL');
    }
  }

  /* ── E-key listener ──────────────────────────────────────── */
  function _onKeyDown(e) {
    if (_panelOpen) {
      /* Any key closes the panel */
      if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') {
        _closePanel();
        e.preventDefault();
      }
      return;
    }
    if (e.code === 'KeyE' && _nearPropIndex >= 0) {
      _readProp(_props[_nearPropIndex]);
      _showPrompt(false);
      e.preventDefault();
    }
  }

  /* ── Public: init ─────────────────────────────────────────── */
  function init(scene) {
    _scene = scene || _scene;

    /* Spawn all 6 props */
    for (var i = 0; i < LORE_DOCS.length; i++) {
      var def  = LORE_DOCS[i];
      var pos  = SPAWN_POSITIONS[i] || [0, 0.9, 0];
      var build = _BUILDERS[def.type] || _buildDocument;
      var mesh = build();

      /* Glow point light */
      var wasRead = _wasRead(def.id);
      var light   = new THREE.PointLight(0xFFFFAA, wasRead ? GLOW_INTENSITY_DIMMED : GLOW_INTENSITY_NORMAL, GLOW_RANGE);
      light.position.set(0, 0, 0);
      mesh.add(light);

      mesh.position.set(pos[0], pos[1], pos[2]);

      if (_scene) _scene.add(mesh);

      _props.push({
        def:    def,
        mesh:   mesh,
        light:  light,
        baseY:  pos[1],
        phase:  i * 1.05
      });

      /* Sync collected array for already-read docs */
      if (wasRead && window._loreCollected.indexOf(def.id) === -1) {
        window._loreCollected.push(def.id);
      }
    }

    _ensureHud();
    _updateHud();
    _ensurePrompt();

    document.addEventListener('keydown', _onKeyDown);
  }

  /* ── Public: update ──────────────────────────────────────── */
  function update(dt, camPos) {
    if (!camPos) return;
    _time += dt;

    var nearest  = -1;
    var nearDist = Infinity;

    for (var i = 0; i < _props.length; i++) {
      var p  = _props[i];
      var m  = p.mesh;

      /* Bob + slow Y rotation */
      m.position.y = p.baseY + Math.sin(_time * 1.8 + p.phase) * 0.12;
      m.rotation.y += dt * 0.6;

      /* Gentle glow pulse (read props stay dim) */
      var wasRead = _wasRead(p.def.id);
      if (!wasRead) {
        var pulse = GLOW_INTENSITY_NORMAL * (0.88 + 0.12 * Math.sin(_time * 2.4 + p.phase));
        if (p.light) p.light.intensity = pulse;
      }

      /* Distance to player camera */
      var dx = camPos.x - m.position.x;
      var dz = camPos.z - m.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearDist) {
        nearDist = dist;
        nearest  = i;
      }
    }

    var inRange = nearDist <= INTERACT_RANGE && nearest >= 0;
    _nearPropIndex = inRange ? nearest : -1;
    if (!_panelOpen) {
      _showPrompt(inRange);
    }
  }

  /* ── Public: reset ───────────────────────────────────────── */
  function reset() {
    document.removeEventListener('keydown', _onKeyDown);
    _closePanel();
    _showPrompt(false);

    for (var i = 0; i < _props.length; i++) {
      if (_scene && _props[i].mesh) {
        _scene.remove(_props[i].mesh);
      }
    }
    _props          = [];
    _nearPropIndex  = -1;
    _panelOpen      = false;
    _scene          = null;
    window._loreCollected = [];

    if (_hudEl) _hudEl.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };

})();
