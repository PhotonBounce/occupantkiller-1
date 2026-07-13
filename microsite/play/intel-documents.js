/* ─────────────────────────────────────────────────────────────────────────
   INTEL DOCUMENTS — Collectible enemy intelligence document system
   5 typed documents per wave; press E to collect, view classified text.
   Bonus effects per type: PLANS reveals wave composition, CODES boosts
   kill score, ROSTER highlights enemies, MAP shows patrol paths,
   ORDERS marks boss spawn.
   Depends on: THREE (global), window._gameScene, window._player (optional)
   ───────────────────────────────────────────────────────────────────────── */
window.IntelDocuments = (function () {
  'use strict';

  /* ── Intel types ───────────────────────────────────────────────────────── */
  var TYPES = {
    PLANS:  'PLANS',
    CODES:  'CODES',
    ROSTER: 'ROSTER',
    MAP:    'MAP',
    ORDERS: 'ORDERS'
  };

  /* ── Fake Russian-transliterated classified phrases ─────────────────────── */
  var RUSSIAN_PHRASES = [
    'ПРИОРИТЕТ АЛЬФА',
    'ОПЕРАЦИЯ БУРЯ',
    'ПОЗИЦИИ АРТИЛЛЕРИИ',
    'СОВЕРШЕННО СЕКРЕТНО',
    'КОМАНДОВАНИЕ ВОЙСКАМИ',
    'ТОЧКА СБОРА БРАВО',
    'ШТУРМ РАССВЕТ',
    'КООРДИНАТЫ ЦЕЛИ',
    'ЗАПАСНОЙ МАРШРУТ',
    'УНИЧТОЖИТЬ ПОСЛЕ ПРОЧТЕНИЯ',
    'КОНТРУДАР ЗЕНИТ',
    'РЕЖИМ ТИШИНЫ РАДИО',
    'РЕЗЕРВНЫЙ БАТАЛЬОН',
    'ОГНЕВАЯ ТОЧКА РОМБ',
    'КОДОВОЕ СЛОВО СОКОЛ'
  ];

  /* ── Type-specific document content arrays (5 items each) ──────────────── */
  var DOCUMENT_CONTENT = {};

  DOCUMENT_CONTENT[TYPES.PLANS] = [
    'СОВЕРШЕННО СЕКРЕТНО — ОПЕРАЦИЯ БУРЯ\n\nСледующая волна: 4 пехотинца, 2 снайпера, 1 тяжёлый солдат.\nАтака с северного фланга. ПРИОРИТЕТ АЛЬФА.\nКоординаты сбора: сектор 7.',
    'КОМАНДОВАНИЕ ВОЙСКАМИ — ПРИКАЗ №14\n\nРазвернуть усиленный отряд: 3 штурмовика, 2 пулемётчика.\nПоддержка с воздуха прибудет в 03:00.\nЗАПАСНОЙ МАРШРУТ через сектор Браво.',
    'ПЛАН АТАКИ — ШТУРМ РАССВЕТ\n\nСостав: 5 пехотинцев, 1 командир, 1 гранатомётчик.\nЦель: уничтожить периметр обороны.\nКОДОВОЕ СЛОВО СОКОЛ активировано.',
    'СЕКРЕТНО — ДИСПОЗИЦИЯ ВОЙСК\n\nВолна усиления: 6 бойцов линии, 1 берсерк.\nАртиллерийская поддержка: ПОЗИЦИИ АРТИЛЛЕРИИ сектор 3.\nАтака по сигналу ЗЕНИТ.',
    'ОПЕРАТИВНЫЙ ПРИКАЗ — УНИЧТОЖИТЬ ПОСЛЕ ПРОЧТЕНИЯ\n\nСостав следующей волны: 2 снайпера, 3 бойца CQC, 1 тяжёлый.\nТочка сбора: ТОЧКА СБОРА БРАВО.\nОГНЕВАЯ ТОЧКА РОМБ активна.'
  ];

  DOCUMENT_CONTENT[TYPES.CODES] = [
    'СОВЕРШЕННО СЕКРЕТНО — КОДЫ АВТОРИЗАЦИИ\n\nКод подтверждения: СОКОЛ-7-3-АЛЬФА\nАктивация: немедленная. Срок: 60 секунд.\nКаждый уничтоженный враг — +100 очков. ПРИОРИТЕТ АЛЬФА.',
    'ШИФРОВАННЫЙ КАНАЛ — БОНУС-КОД\n\nПРИОРИТЕТ АЛЬФА: протокол усиления активирован.\nЗа каждое уничтожение: бонус 100 очков.\nВремя действия: 60 секунд. ОПЕРАЦИЯ БУРЯ.',
    'КОД ДОСТУПА — ОПЕРАЦИЯ БУРЯ\n\nАвторизация: КОМАНДОВАНИЕ ВОЙСКАМИ\nУровень угрозы: критический.\nБонус за уничтожение: активирован на 60с. Код: ЗЕНИТ-9.',
    'ШИФРОВКА — УНИЧТОЖИТЬ ПОСЛЕ ПРОЧТЕНИЯ\n\nПротокол КОД-СОКОЛ активирован.\nБонус за каждого уничтоженного противника: 100 очков.\nДействует 60 секунд. СОВЕРШЕННО СЕКРЕТНО.',
    'СЕКРЕТНЫЙ КОД — РЕЖИМ ТИШИНЫ РАДИО\n\nКодовое слово: РЕЗЕРВНЫЙ БАТАЛЬОН\nАктивация бонуса: +100 за уничтожение (60с).\nКоординаты передачи: КООРДИНАТЫ ЦЕЛИ — засекречены.'
  ];

  DOCUMENT_CONTENT[TYPES.ROSTER] = [
    'СОВЕРШЕННО СЕКРЕТНО — СПИСОК ЛИЧНОГО СОСТАВА\n\nОперативники высокой ценности идентифицированы.\nМаркировка: ПРИОРИТЕТ АЛЬФА.\n3 цели выделены для ликвидации. ОПЕРАЦИЯ БУРЯ.',
    'ДОСЬЕ — КОМАНДОВАНИЕ ВОЙСКАМИ\n\nИдентифицированы 3 ключевых противника.\nОбозначение: красный маркер.\nПриоритет поражения: максимальный. ШТУРМ РАССВЕТ.',
    'СПИСОК ЦЕЛЕЙ — ОПЕРАЦИЯ СОКОЛ\n\nТри цели с особым статусом помечены.\nКоординаты: КООРДИНАТЫ ЦЕЛИ активны.\nПоразить в первую очередь. СОВЕРШЕННО СЕКРЕТНО.',
    'СЕКРЕТНЫЙ РЕЕСТР — УНИЧТОЖИТЬ ПОСЛЕ ПРОЧТЕНИЯ\n\nВысокоприоритетные противники: 3 единицы.\nОбозначение: визуальная маркировка (красный).\nПОЗИЦИИ АРТИЛЛЕРИИ — прикрытие обеспечено.',
    'СПИСОК ЛИКВИДАЦИИ — СОВЕРШЕННО СЕКРЕТНО\n\n3 особо опасных противника маркированы.\nПриоритет: ПРИОРИТЕТ АЛЬФА.\nОГНЕВАЯ ТОЧКА РОМБ — поддержка. Действовать немедленно.'
  ];

  DOCUMENT_CONTENT[TYPES.MAP] = [
    'СОВЕРШЕННО СЕКРЕТНО — МАРШРУТЫ ПАТРУЛИРОВАНИЯ\n\nПатруль А: север → восток → центр → север.\nПатруль Б: запад → юг → запад.\nКоординаты: КООРДИНАТЫ ЦЕЛИ активны. Время: 30 секунд.',
    'КАРТА ОПЕРАЦИИ — ОПЕРАЦИЯ БУРЯ\n\nМаршруты движения противника отображены.\nСектор патрулирования: ТОЧКА СБОРА БРАВО.\nВидимость маршрутов: 30 секунд. ПРИОРИТЕТ АЛЬФА.',
    'ТАКТИЧЕСКАЯ КАРТА — ШТУРМ РАССВЕТ\n\nПоказаны пути патрулирования: 3 маршрута.\nЗапасной маршрут: ЗАПАСНОЙ МАРШРУТ активен.\nВремя отображения: 30 секунд. СОВЕРШЕННО СЕКРЕТНО.',
    'РАЗВЕДЫВАТЕЛЬНЫЕ ДАННЫЕ — РЕЖИМ ТИШИНЫ РАДИО\n\nПатрульные пути врага раскрыты.\nДлительность отображения: 30 секунд.\nИспользовать немедленно. КОМАНДОВАНИЕ ВОЙСКАМИ.',
    'КАРТА ПАТРУЛЕЙ — УНИЧТОЖИТЬ ПОСЛЕ ПРОЧТЕНИЯ\n\nМаршруты всех патрулей активированы в системе.\nВремя: 30 секунд.\nОГНЕВАЯ ТОЧКА РОМБ — зона наблюдения. ЗЕНИТ.'
  ];

  DOCUMENT_CONTENT[TYPES.ORDERS] = [
    'СОВЕРШЕННО СЕКРЕТНО — ПРИКАЗ О КОМАНДИРЕ\n\nКомандир прибывает в точку АЛЬФА-7.\nКоординаты появления: северо-восточный сектор.\nВремя прибытия: следующая волна. ОПЕРАЦИЯ БУРЯ.',
    'ПРИКАЗ КОМАНДОВАНИЯ — ШТУРМ РАССВЕТ\n\nКомандир развернётся в секторе БРАВО.\nМаркер появления активирован.\nПРИОРИТЕТ АЛЬФА: ликвидировать командира. СОВЕРШЕННО СЕКРЕТНО.',
    'ОПЕРАТИВНЫЙ ПРИКАЗ — КОМАНДОВАНИЕ ВОЙСКАМИ\n\nМесто появления командира: ТОЧКА СБОРА БРАВО.\nВизуальный маркер установлен.\nЦель высшего приоритета. КООРДИНАТЫ ЦЕЛИ подтверждены.',
    'СЕКРЕТНЫЙ ПРИКАЗ — УНИЧТОЖИТЬ ПОСЛЕ ПРОЧТЕНИЯ\n\nКомандир появится в западном секторе.\nВайпоинт активирован для обнаружения.\nОПЕРАЦИЯ ЗЕНИТ: ликвидация командира. ПРИОРИТЕТ АЛЬФА.',
    'ДИРЕКТИВА — СОВЕРШЕННО СЕКРЕТНО\n\nТочка появления командира: южный периметр.\nМаркер позиции отображён.\nНемедленно уничтожить. ШТУРМ РАССВЕТ активирован. СОКОЛ-7.'
  ];

  /* ── HUD counter element ────────────────────────────────────────────────── */
  var _counterEl = null;

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _docs          = [];   // { mesh, light, type, collected, baseY, phase, searchEnemy }
  var _totalSpawned  = 0;
  var _totalCollected = 0;
  var _viewPanel     = null;
  var _viewTimer     = null;
  var _time          = 0;

  /* ── Active bonus state ─────────────────────────────────────────────────── */
  var _codesActive       = false;
  var _codesEndTime      = 0;
  var _rosterLights      = [];   // PointLights added above enemies for ROSTER
  var _mapLines          = [];   // Line meshes for MAP patrol paths
  var _mapEndTime        = 0;
  var _mapActive         = false;
  var _ordersMarker      = null; // waypoint mesh for ORDERS
  var _plansRevealed     = false;

  /* ── Shared geometry / material ─────────────────────────────────────────── */
  var _docGeo  = null;
  var _docMat  = null;
  var _docMatCream = null;

  function _getDocGeo() {
    if (!_docGeo) _docGeo = new THREE.BoxGeometry(0.3, 0.02, 0.4);
    return _docGeo;
  }
  function _getDocMat() {
    if (!_docMat) _docMat = new THREE.MeshLambertMaterial({ color: 0xFFFDD0 });
    return _docMat;
  }

  /* ── Toast helper ───────────────────────────────────────────────────────── */
  function _toast(msg, duration, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.showToast) {
        HUD.showToast(msg, duration || 3000, color || '#44ff88');
        return;
      }
    } catch (_e) {}
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed', 'top:80px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)', 'color:' + (color || '#44ff88'),
      'padding:8px 18px', 'border-radius:6px', 'font-family:monospace',
      'font-size:14px', 'z-index:9999', 'pointer-events:none',
      'border:1px solid ' + (color || '#44ff88')
    ].join(';');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, duration || 3000);
  }

  /* ── HUD counter ────────────────────────────────────────────────────────── */
  function _createCounter() {
    if (_counterEl) return;
    _counterEl = document.createElement('div');
    _counterEl.id = 'intel-doc-counter';
    _counterEl.style.cssText = [
      'position:fixed', 'top:12px', 'right:160px',
      'background:rgba(0,0,0,0.7)', 'color:#FFD700',
      'padding:5px 12px', 'border-radius:4px',
      'font-family:monospace', 'font-size:13px',
      'font-weight:bold', 'z-index:8000',
      'border:1px solid #FFD700', 'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_counterEl);
    _updateCounter();
  }

  function _updateCounter() {
    if (!_counterEl) return;
    _counterEl.textContent = 'INTEL: ' + _totalCollected + '/' + _totalSpawned;
  }

  /* ── Document view panel ────────────────────────────────────────────────── */
  function _createViewPanel() {
    if (_viewPanel) return;
    _viewPanel = document.createElement('div');
    _viewPanel.id = 'intel-doc-panel';
    _viewPanel.style.cssText = [
      'position:fixed', 'top:50%', 'right:-320px',
      'transform:translateY(-50%)',
      'width:300px', 'min-height:400px',
      'background:rgba(10,10,10,0.95)',
      'color:#d4c89a',
      'border:2px solid #8B7355',
      'border-radius:6px',
      'padding:16px',
      'font-family:"Courier New",monospace',
      'font-size:12px',
      'z-index:9500',
      'transition:right 0.4s ease',
      'cursor:pointer',
      'box-shadow:0 0 20px rgba(139,115,85,0.4)'
    ].join(';');
    document.body.appendChild(_viewPanel);
    _viewPanel.addEventListener('click', _hideViewPanel);
  }

  function _showViewPanel(type, content) {
    if (!_viewPanel) _createViewPanel();
    var typeLabel = type;
    var typeColor = '#FFD700';

    var stamp = 'СОВЕРШЕННО\nСЕКРЕТНО';
    var stampColor = '#cc2222';

    _viewPanel.innerHTML = [
      '<div style="text-align:center;margin-bottom:8px;font-size:10px;color:#888;letter-spacing:2px">CLASSIFIED DOCUMENT</div>',
      '<div style="text-align:center;margin-bottom:4px;font-size:16px;font-weight:bold;color:' + typeColor + ';letter-spacing:3px">' + typeLabel + '</div>',
      '<div style="border-top:1px solid #8B7355;margin:8px 0;"></div>',
      '<div style="white-space:pre-wrap;line-height:1.6;font-size:11px;color:#c8b882">' + content + '</div>',
      '<div style="border-top:1px solid #8B7355;margin:8px 0;"></div>',
      '<div style="text-align:center;color:' + stampColor + ';font-size:18px;font-weight:bold;opacity:0.7;letter-spacing:4px;transform:rotate(-8deg);display:inline-block;width:100%">' + stamp + '</div>',
      '<div style="text-align:center;margin-top:10px;font-size:10px;color:#555">[ CLICK TO DISMISS ]</div>'
    ].join('');

    _viewPanel.style.right = '20px';

    if (_viewTimer) clearTimeout(_viewTimer);
    _viewTimer = setTimeout(_hideViewPanel, 6000);
  }

  function _hideViewPanel() {
    if (!_viewPanel) return;
    _viewPanel.style.right = '-320px';
    if (_viewTimer) { clearTimeout(_viewTimer); _viewTimer = null; }
  }

  /* ── Spawn a single intel document ─────────────────────────────────────── */
  function spawnIntel(scene, x, y, z, type) {
    if (!scene || typeof THREE === 'undefined') return null;

    type = type || TYPES.PLANS;

    var mesh = new THREE.Mesh(_getDocGeo(), _getDocMat().clone());
    mesh.position.set(x, y !== undefined ? y : 0.8, z);

    /* Slight natural rotation — ~5 degrees */
    mesh.rotation.y = (Math.random() * 0.3 - 0.15) + 0.0873; /* 5° base + small random */
    mesh.rotation.z = (Math.random() * 0.06 - 0.03);

    /* Subtle type-tint variation */
    var tintMap = {};
    tintMap[TYPES.PLANS]  = 0xFFF8DC;
    tintMap[TYPES.CODES]  = 0xFFFDD0;
    tintMap[TYPES.ROSTER] = 0xFFF5E1;
    tintMap[TYPES.MAP]    = 0xF5F5DC;
    tintMap[TYPES.ORDERS] = 0xFAF0E6;
    mesh.material.color.setHex(tintMap[type] || 0xFFFDD0);

    scene.add(mesh);

    /* Gentle glow light beneath */
    var light = new THREE.PointLight(0xFFD700, 0.4, 3);
    light.position.set(x, (y !== undefined ? y : 0.8) - 0.3, z);
    scene.add(light);

    var docObj = {
      mesh: mesh,
      light: light,
      type: type,
      collected: false,
      baseY: y !== undefined ? y : 0.8,
      phase: Math.random() * Math.PI * 2,   /* randomise float phase */
      scene: scene,
      searchEnemy: null                       /* set externally for search behaviour */
    };

    _docs.push(docObj);
    _totalSpawned++;
    _updateCounter();

    return docObj;
  }

  /* ── Wave spawning: 2-4 documents at random positions ───────────────────── */
  function spawnForWave(scene, wave) {
    if (!scene) return;

    var count = 2 + Math.floor(Math.random() * 3); /* 2, 3, or 4 */
    var types = [TYPES.PLANS, TYPES.CODES, TYPES.ROSTER, TYPES.MAP, TYPES.ORDERS];
    var radius = 18 + (wave || 1) * 1.5;

    for (var i = 0; i < count; i++) {
      var angle  = (i / count) * Math.PI * 2 + Math.random() * 0.8;
      var dist   = radius * (0.4 + Math.random() * 0.6);
      var px     = Math.cos(angle) * dist;
      var pz     = Math.sin(angle) * dist;
      var type   = types[Math.floor(Math.random() * types.length)];
      spawnIntel(scene, px, 0.8, pz, type);
    }
  }

  /* ── Collection check ───────────────────────────────────────────────────── */
  function _tryCollect(docObj, playerPos) {
    if (docObj.collected) return;

    var dx = docObj.mesh.position.x - playerPos.x;
    var dy = docObj.mesh.position.y - playerPos.y;
    var dz = docObj.mesh.position.z - playerPos.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 1.5) return;

    docObj.collected = true;
    _totalCollected++;

    /* Remove mesh + light from scene */
    docObj.scene.remove(docObj.mesh);
    docObj.scene.remove(docObj.light);

    _updateCounter();
    _applyBonus(docObj, playerPos);

    /* Show document viewer */
    var contents = DOCUMENT_CONTENT[docObj.type];
    var content  = contents[Math.floor(Math.random() * contents.length)];
    _showViewPanel(docObj.type, content);

    _toast('[INTEL] ' + docObj.type + ' document acquired!', 3500, '#FFD700');

    /* Check for wave clear bonus */
    var allCollected = true;
    for (var i = 0; i < _docs.length; i++) {
      if (!_docs[i].collected) { allCollected = false; break; }
    }
    if (allCollected && _totalSpawned > 0) {
      _toast('[INTEL] All intel collected! +1000 score bonus!', 4000, '#00FF88');
      _addScore(1000);
    }
  }

  /* ── Per-type bonus effects ─────────────────────────────────────────────── */
  function _applyBonus(docObj, playerPos) {
    var scene = docObj.scene;

    if (docObj.type === TYPES.PLANS) {
      _applyPlansBonus();
    } else if (docObj.type === TYPES.CODES) {
      _applyCodesBonus();
    } else if (docObj.type === TYPES.ROSTER) {
      _applyRosterBonus(scene);
    } else if (docObj.type === TYPES.MAP) {
      _applyMapBonus(scene);
    } else if (docObj.type === TYPES.ORDERS) {
      _applyOrdersBonus(scene, playerPos);
    }
  }

  /* PLANS: reveal next wave enemy composition in HUD */
  function _applyPlansBonus() {
    _plansRevealed = true;
    var waveInfo = _getWaveComposition();
    var msg = '[PLANS] Next wave: ' + waveInfo;
    _toast(msg, 6000, '#00BFFF');
    /* Also push to HUD if available */
    try {
      if (typeof HUD !== 'undefined' && HUD.showObjective) {
        HUD.showObjective('PLANS: ' + waveInfo, 8000);
      }
    } catch (_e) {}
  }

  function _getWaveComposition() {
    var types = ['Infantry', 'Sniper', 'Heavy', 'Berserker', 'Commander'];
    var parts = [];
    var total = 3 + Math.floor(Math.random() * 5);
    var counts = {};
    for (var i = 0; i < total; i++) {
      var t = types[Math.floor(Math.random() * types.length)];
      counts[t] = (counts[t] || 0) + 1;
    }
    for (var k in counts) {
      if (counts.hasOwnProperty(k)) parts.push(counts[k] + 'x ' + k);
    }
    return parts.join(', ');
  }

  /* CODES: +100 bonus score per kill for 60s */
  function _applyCodesBonus() {
    _codesActive  = true;
    _codesEndTime = (_time + 60);
    _toast('[CODES] +100 bonus per kill for 60 seconds!', 4000, '#FF6600');
  }

  /* ROSTER: highlight 3 random enemies with red halos */
  function _applyRosterBonus(scene) {
    /* Remove old roster lights */
    for (var i = 0; i < _rosterLights.length; i++) {
      scene.remove(_rosterLights[i]);
    }
    _rosterLights = [];

    /* Try to get enemies from global enemy list */
    var enemies = _getEnemyList();
    if (!enemies || enemies.length === 0) {
      _toast('[ROSTER] 3 high-value targets identified!', 4000, '#FF4444');
      return;
    }

    var shuffled = enemies.slice();
    for (var j = shuffled.length - 1; j > 0; j--) {
      var swap = Math.floor(Math.random() * (j + 1));
      var tmp = shuffled[j]; shuffled[j] = shuffled[swap]; shuffled[swap] = tmp;
    }
    var targets = shuffled.slice(0, Math.min(3, shuffled.length));

    for (var k = 0; k < targets.length; k++) {
      var enemy = targets[k];
      var pos = enemy.position || (enemy.mesh && enemy.mesh.position);
      if (!pos) continue;
      var halo = new THREE.PointLight(0xFF0000, 1.2, 5);
      halo.position.set(pos.x, (pos.y || 0) + 2, pos.z);
      scene.add(halo);
      _rosterLights.push(halo);
      /* Tag the enemy so light follows them */
      halo._targetEnemy = enemy;
    }
    _toast('[ROSTER] 3 priority targets marked with red halos!', 4000, '#FF4444');
  }

  /* MAP: show patrol paths as lines in scene for 30s */
  function _applyMapBonus(scene) {
    /* Remove old map lines */
    _clearMapLines(scene);

    var patrolRoutes = [
      [[-10, 0, -10], [10, 0, -10], [10, 0, 10], [-10, 0, 10]],
      [[0, 0, -15],   [15, 0, 0],   [0, 0, 15],  [-15, 0, 0]],
      [[-8, 0, 0],    [0, 0, -8],   [8, 0, 0],   [0, 0, 8]]
    ];

    var lineMat = new THREE.LineBasicMaterial({ color: 0x00FF88, opacity: 0.7, transparent: true });

    for (var r = 0; r < patrolRoutes.length; r++) {
      var route = patrolRoutes[r];
      var points = [];
      for (var p = 0; p < route.length; p++) {
        points.push(new THREE.Vector3(route[p][0], route[p][1] + 0.15, route[p][2]));
      }
      /* Close the loop */
      points.push(points[0].clone());
      var geo  = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.Line(geo, lineMat.clone());
      scene.add(line);
      _mapLines.push({ line: line, scene: scene });
    }

    _mapActive  = true;
    _mapEndTime = _time + 30;
    _toast('[MAP] Enemy patrol routes displayed for 30 seconds!', 4000, '#00FF88');
  }

  function _clearMapLines(scene) {
    for (var i = 0; i < _mapLines.length; i++) {
      var s = _mapLines[i].scene || scene;
      if (s) s.remove(_mapLines[i].line);
    }
    _mapLines = [];
    _mapActive = false;
  }

  /* ORDERS: place boss spawn waypoint marker */
  function _applyOrdersBonus(scene, playerPos) {
    /* Remove old marker */
    if (_ordersMarker) {
      scene.remove(_ordersMarker);
      _ordersMarker = null;
    }

    /* Pick a spawn position opposite the player */
    var px = playerPos ? playerPos.x : 0;
    var pz = playerPos ? playerPos.z : 0;
    var spawnX = -px + (Math.random() * 10 - 5);
    var spawnZ = -pz + (Math.random() * 10 - 5);

    /* Waypoint: a glowing diamond shape (octahedron) */
    var geo = new THREE.OctahedronGeometry(0.5);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF2200, wireframe: true });
    _ordersMarker = new THREE.Mesh(geo, mat);
    _ordersMarker.position.set(spawnX, 1.5, spawnZ);
    scene.add(_ordersMarker);

    /* Light beneath marker */
    var markerLight = new THREE.PointLight(0xFF2200, 1.0, 6);
    markerLight.position.set(spawnX, 0.5, spawnZ);
    scene.add(markerLight);
    _ordersMarker._light = markerLight;
    _ordersMarker._lightScene = scene;

    _toast('[ORDERS] Boss spawn location revealed!', 5000, '#FF2200');
  }

  /* ── Score helper ───────────────────────────────────────────────────────── */
  function _addScore(amount) {
    try {
      if (typeof GameManager !== 'undefined' && GameManager.addScore) {
        GameManager.addScore(amount);
      } else if (window._score !== undefined) {
        window._score += amount;
      }
    } catch (_e) {}
  }

  /* ── Enemy list helper ──────────────────────────────────────────────────── */
  function _getEnemyList() {
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getList) return Enemies.getList();
      if (window._enemies) return window._enemies;
      if (window._enemyList) return window._enemyList;
    } catch (_e) {}
    return [];
  }

  /* ── Player position helper ─────────────────────────────────────────────── */
  function _getPlayerPos() {
    try {
      if (window._player) {
        if (window._player.position) return window._player.position;
        if (window._player.mesh && window._player.mesh.position) return window._player.mesh.position;
      }
      if (window._camera) return window._camera.position;
    } catch (_e) {}
    return { x: 0, y: 0, z: 0 };
  }

  /* ── Enemy search behaviour ─────────────────────────────────────────────── */
  function _updateEnemySearch() {
    var uncollected = [];
    for (var i = 0; i < _docs.length; i++) {
      if (!_docs[i].collected) uncollected.push(_docs[i]);
    }
    if (uncollected.length === 0) return;

    var enemies = _getEnemyList();
    for (var j = 0; j < enemies.length; j++) {
      var enemy = enemies[j];
      /* Skip if already assigned a search target */
      if (enemy._searchingIntel) continue;
      /* 30% chance to assign a search behaviour */
      if (Math.random() < 0.30) {
        var target = uncollected[Math.floor(Math.random() * uncollected.length)];
        enemy._searchingIntel = target;
        target.searchEnemy = enemy;
      }
    }
  }

  /* ── E key listener ─────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.code !== 'KeyE' && e.key !== 'e' && e.key !== 'E') return;
    var playerPos = _getPlayerPos();
    for (var i = 0; i < _docs.length; i++) {
      if (!_docs[i].collected) _tryCollect(_docs[i], playerPos);
    }
  }

  /* ── Init ───────────────────────────────────────────────────────────────── */
  function init() {
    _createCounter();
    _createViewPanel();
    document.addEventListener('keydown', _onKeyDown);
  }

  /* ── Update (call each frame with delta time in seconds) ────────────────── */
  function update(dt) {
    if (!dt || dt <= 0) dt = 0.016;
    _time += dt;

    /* Float + rotate uncollected documents */
    for (var i = 0; i < _docs.length; i++) {
      var doc = _docs[i];
      if (doc.collected) continue;

      /* Rotation */
      doc.mesh.rotation.y += 0.8 * dt;

      /* Vertical oscillation ±0.1 at 0.5 Hz */
      doc.mesh.position.y = doc.baseY + Math.sin(doc.phase + _time * Math.PI) * 0.1;

      /* Light follows document */
      doc.light.position.x = doc.mesh.position.x;
      doc.light.position.y = doc.mesh.position.y - 0.3;
      doc.light.position.z = doc.mesh.position.z;

      /* Pulse light intensity */
      doc.light.intensity = 0.3 + Math.sin(_time * 2 + doc.phase) * 0.1;
    }

    /* CODES timer */
    if (_codesActive && _time > _codesEndTime) {
      _codesActive = false;
      _toast('[CODES] Score bonus expired.', 2500, '#888');
    }

    /* MAP timer */
    if (_mapActive && _time > _mapEndTime) {
      _clearMapLines(null);
      _toast('[MAP] Patrol route data expired.', 2500, '#888');
    }

    /* ORDERS marker spin */
    if (_ordersMarker) {
      _ordersMarker.rotation.y += dt * 1.5;
      _ordersMarker.rotation.x += dt * 0.8;
    }

    /* ROSTER lights follow enemies */
    for (var r = 0; r < _rosterLights.length; r++) {
      var rl = _rosterLights[r];
      var te = rl._targetEnemy;
      if (!te) continue;
      var tPos = te.position || (te.mesh && te.mesh.position);
      if (tPos) {
        rl.position.x = tPos.x;
        rl.position.y = (tPos.y || 0) + 2;
        rl.position.z = tPos.z;
      }
    }

    /* Periodically assign search behaviour (every ~5s roughly) */
    if (Math.floor(_time * 10) % 50 === 0 && _docs.length > 0) {
      _updateEnemySearch();
    }
  }

  /* ── Getters / reset ────────────────────────────────────────────────────── */
  function getCount() {
    return { collected: _totalCollected, total: _totalSpawned };
  }

  function reset() {
    /* Clean up any live docs */
    for (var i = 0; i < _docs.length; i++) {
      var doc = _docs[i];
      if (!doc.collected && doc.scene) {
        doc.scene.remove(doc.mesh);
        doc.scene.remove(doc.light);
      }
    }
    _docs           = [];
    _totalSpawned   = 0;
    _totalCollected = 0;
    _codesActive    = false;
    _plansRevealed  = false;
    _mapActive      = false;
    _mapLines       = [];
    _rosterLights   = [];
    if (_ordersMarker) {
      if (_ordersMarker._lightScene) _ordersMarker._lightScene.remove(_ordersMarker._light);
      _ordersMarker = null;
    }
    _hideViewPanel();
    _updateCounter();
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  return {
    init:          init,
    update:        update,
    spawnIntel:    spawnIntel,
    spawnForWave:  spawnForWave,
    getCount:      getCount,
    reset:         reset,
    TYPES:         TYPES,
    isCodesActive: function () { return _codesActive; },
    getCodesBonus: function () { return _codesActive ? 100 : 0; }
  };

})();
