/**
 * crosshair-config.js
 * Crosshair customization system for OccupantKiller.
 * Press L to open the configurator panel.
 * Standalone — no game-manager.js changes required.
 */

window.CrosshairConfig = (function() {

  // ── Constants ──────────────────────────────────────────────────────────────

  var STORAGE_KEY = 'okk_crosshair_v1';
  var CANVAS_SIZE  = 60;
  var CENTER       = CANVAS_SIZE / 2; // 30

  var COLOR_OPTIONS = [
    { label: 'White',  value: '#ffffff' },
    { label: 'Green',  value: '#00ff44' },
    { label: 'Red',    value: '#ff2222' },
    { label: 'Cyan',   value: '#00ffff' },
    { label: 'Yellow', value: '#ffff00' },
    { label: 'Pink',   value: '#ff66cc' }
  ];

  // ── Crosshair style presets ────────────────────────────────────────────────

  var STYLES = {
    CLASSIC_CROSS: {
      lines: [
        {x:-12, y:0, w:8, h:2},
        {x:4,   y:0, w:8, h:2},
        {x:0,   y:-12, w:2, h:8},
        {x:0,   y:4,   w:2, h:8}
      ],
      dot: false,
      gap: 4
    },
    DOT_ONLY: {
      lines: [],
      dot: {size: 3, color: '#ffffff'}
    },
    CIRCLE_DOT: {
      lines: [],
      dot: {size: 2},
      circle: {r: 14, thickness: 1.5}
    },
    TACTICAL_T: {
      lines: [
        {x:-12, y:0, w:8, h:2},
        {x:4,   y:0, w:8, h:2},
        {x:0,   y:4, w:2, h:8}
      ],
      dot: false
    },
    CHEVRON: {
      lines: [
        {x:-8, y:6, w:2, h:8, angle:-45},
        {x:8,  y:6, w:2, h:8, angle:45}
      ],
      dot: {size: 2}
    },
    NONE: {
      lines: [],
      dot: false
    }
  };

  var STYLE_NAMES = Object.keys(STYLES);

  // ── State ──────────────────────────────────────────────────────────────────

  var _currentStyle   = 'CLASSIC_CROSS';
  var _currentColor   = '#ffffff';
  var _opacity        = 1.0;
  var _canvas         = null;
  var _ctx            = null;
  var _panel          = null;
  var _visible        = true;
  var _panelOpen      = false;
  var _rafId          = null;

  // ── Persistence ────────────────────────────────────────────────────────────

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        style:   _currentStyle,
        color:   _currentColor,
        opacity: _opacity
      }));
    } catch(e) {}
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data.style  && STYLES[data.style])  _currentStyle = data.style;
      if (data.color)                          _currentColor = data.color;
      if (typeof data.opacity === 'number')    _opacity = Math.max(0.2, Math.min(1.0, data.opacity));
    } catch(e) {}
  }

  // ── Canvas creation ────────────────────────────────────────────────────────

  function _createCanvas() {
    _canvas = document.createElement('canvas');
    _canvas.id = 'crosshairCanvas';
    _canvas.width  = CANVAS_SIZE;
    _canvas.height = CANVAS_SIZE;
    _canvas.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:50%',
      'transform:translate(-30px,-30px)',
      'pointer-events:none',
      'z-index:700',
      'image-rendering:pixelated'
    ].join(';');
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  function _drawCrosshair() {
    if (!_ctx) return;

    _ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // When ADS is active, collapse to a tiny dot regardless of style
    if (window._adsActive) {
      _ctx.globalAlpha = _opacity;
      _ctx.fillStyle   = _currentColor;
      _ctx.beginPath();
      _ctx.arc(CENTER, CENTER, 2, 0, Math.PI * 2);
      _ctx.fill();
      _ctx.globalAlpha = 1;
      return;
    }

    var style  = STYLES[_currentStyle];
    var spread = (typeof window._crosshairSpread === 'number')
                   ? Math.max(0, Math.min(20, window._crosshairSpread))
                   : 0;
    var color  = _currentColor;

    // Dot from style may override color
    var dotColor = color;

    _ctx.globalAlpha = _opacity;

    // Draw lines
    for (var i = 0; i < style.lines.length; i++) {
      var line = style.lines[i];

      // Apply spread: push lines away from center proportionally
      var sx = line.x;
      var sy = line.y;

      // Determine direction from center
      if (sx < 0)      sx -= spread;
      else if (sx > 0) sx += spread;
      if (sy < 0)      sy -= spread;
      else if (sy > 0) sy += spread;

      _ctx.save();
      _ctx.translate(CENTER + sx, CENTER + sy);

      if (typeof line.angle === 'number') {
        _ctx.rotate(line.angle * Math.PI / 180);
      }

      _ctx.fillStyle = color;
      _ctx.fillRect(0, 0, line.w, line.h);
      _ctx.restore();
    }

    // Draw circle (CIRCLE_DOT style)
    if (style.circle) {
      var r  = style.circle.r + spread * 0.5;
      var lw = style.circle.thickness || 1.5;
      _ctx.beginPath();
      _ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2);
      _ctx.strokeStyle = color;
      _ctx.lineWidth   = lw;
      _ctx.stroke();
    }

    // Draw dot
    if (style.dot) {
      var dSize = style.dot.size || 2;
      dotColor  = style.dot.color || color;
      _ctx.fillStyle = dotColor;
      _ctx.beginPath();
      _ctx.arc(CENTER, CENTER, dSize, 0, Math.PI * 2);
      _ctx.fill();
    }

    _ctx.globalAlpha = 1;
  }

  // ── Animation loop ─────────────────────────────────────────────────────────

  function _loop() {
    _drawCrosshair();
    _rafId = requestAnimationFrame(_loop);
  }

  // ── Mini-preview in panel buttons ──────────────────────────────────────────

  function _drawPreview(canvas, styleName) {
    var ctx = canvas.getContext('2d');
    var sz  = canvas.width;  // 30
    var cx  = sz / 2;
    var style = STYLES[styleName];

    ctx.clearRect(0, 0, sz, sz);
    ctx.fillStyle   = _currentColor;
    ctx.strokeStyle = _currentColor;
    ctx.globalAlpha = 1;

    var scale = sz / CANVAS_SIZE; // 0.5

    for (var i = 0; i < style.lines.length; i++) {
      var line = style.lines[i];
      ctx.save();
      ctx.translate(cx + line.x * scale, cx + line.y * scale);
      if (typeof line.angle === 'number') {
        ctx.rotate(line.angle * Math.PI / 180);
      }
      ctx.fillRect(0, 0, line.w * scale, line.h * scale);
      ctx.restore();
    }

    if (style.circle) {
      ctx.beginPath();
      ctx.arc(cx, cx, style.circle.r * scale, 0, Math.PI * 2);
      ctx.lineWidth = style.circle.thickness * scale;
      ctx.stroke();
    }

    if (style.dot) {
      var dColor = style.dot.color || _currentColor;
      ctx.fillStyle = dColor;
      ctx.beginPath();
      ctx.arc(cx, cx, (style.dot.size || 2) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Config Panel ───────────────────────────────────────────────────────────

  function _buildPanel() {
    if (_panel) { document.body.removeChild(_panel); }

    _panel = document.createElement('div');
    _panel.id = 'crosshairConfigPanel';
    _panel.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'right:16px',
      'width:220px',
      'background:#0a0a0a',
      'border:1px solid #00cc44',
      'border-radius:6px',
      'padding:10px',
      'z-index:800',
      'font-family:monospace',
      'font-size:11px',
      'color:#ccc',
      'user-select:none'
    ].join(';');

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid #00cc4466;padding-bottom:6px';
    header.innerHTML = '<span style="color:#00cc44;font-weight:bold;letter-spacing:1px">CROSSHAIR CFG</span>';

    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = 'background:none;border:none;color:#888;cursor:pointer;font-size:12px;font-family:monospace;padding:0 2px';
    closeBtn.onclick = function() { hide(); };
    header.appendChild(closeBtn);
    _panel.appendChild(header);

    // Style label
    var styleLabel = document.createElement('div');
    styleLabel.textContent = 'STYLE';
    styleLabel.style.cssText = 'color:#888;font-size:10px;margin-bottom:5px;letter-spacing:1px';
    _panel.appendChild(styleLabel);

    // Style buttons grid
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px';

    for (var si = 0; si < STYLE_NAMES.length; si++) {
      (function(sName) {
        var btn = document.createElement('button');
        btn.title = sName;
        btn.style.cssText = [
          'background:' + (_currentStyle === sName ? 'rgba(0,204,68,0.15)' : 'rgba(255,255,255,0.04)'),
          'border:1px solid ' + (_currentStyle === sName ? '#00cc44' : '#333'),
          'border-radius:4px',
          'cursor:pointer',
          'padding:3px',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'gap:2px'
        ].join(';');

        var previewCanvas = document.createElement('canvas');
        previewCanvas.width  = 30;
        previewCanvas.height = 30;
        previewCanvas.style.cssText = 'display:block;image-rendering:pixelated';
        _drawPreview(previewCanvas, sName);

        var nameSpan = document.createElement('span');
        nameSpan.textContent = sName.replace(/_/g, ' ');
        nameSpan.style.cssText = 'font-size:8px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px';

        btn.appendChild(previewCanvas);
        btn.appendChild(nameSpan);

        btn.onclick = function() {
          _currentStyle = sName;
          _save();
          _buildPanel(); // rebuild to reflect selection
          show();
        };

        grid.appendChild(btn);
      })(STYLE_NAMES[si]);
    }
    _panel.appendChild(grid);

    // Color label
    var colorLabel = document.createElement('div');
    colorLabel.textContent = 'COLOR';
    colorLabel.style.cssText = 'color:#888;font-size:10px;margin-bottom:5px;letter-spacing:1px';
    _panel.appendChild(colorLabel);

    // Color swatches
    var swatchRow = document.createElement('div');
    swatchRow.style.cssText = 'display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap';

    for (var ci = 0; ci < COLOR_OPTIONS.length; ci++) {
      (function(opt) {
        var swatch = document.createElement('button');
        swatch.title = opt.label;
        swatch.style.cssText = [
          'width:22px',
          'height:22px',
          'border-radius:50%',
          'background:' + opt.value,
          'border:2px solid ' + (_currentColor === opt.value ? '#ffffff' : '#333'),
          'cursor:pointer',
          'padding:0',
          'transition:border-color 0.15s'
        ].join(';');

        swatch.onclick = function() {
          _currentColor = opt.value;
          _save();
          _buildPanel();
          show();
        };

        swatchRow.appendChild(swatch);
      })(COLOR_OPTIONS[ci]);
    }
    _panel.appendChild(swatchRow);

    // Opacity label
    var opacLabel = document.createElement('div');
    opacLabel.textContent = 'OPACITY';
    opacLabel.style.cssText = 'color:#888;font-size:10px;margin-bottom:4px;letter-spacing:1px';
    _panel.appendChild(opacLabel);

    // Opacity slider
    var sliderWrap = document.createElement('div');
    sliderWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px';

    var slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = '0.2';
    slider.max   = '1.0';
    slider.step  = '0.05';
    slider.value = String(_opacity);
    slider.style.cssText = 'flex:1;accent-color:#00cc44';

    var opacVal = document.createElement('span');
    opacVal.textContent = Math.round(_opacity * 100) + '%';
    opacVal.style.cssText = 'color:#ccc;font-size:10px;min-width:30px;text-align:right';

    slider.oninput = function() {
      _opacity = parseFloat(slider.value);
      opacVal.textContent = Math.round(_opacity * 100) + '%';
      _save();
    };

    sliderWrap.appendChild(slider);
    sliderWrap.appendChild(opacVal);
    _panel.appendChild(sliderWrap);

    // Footer hint
    var hint = document.createElement('div');
    hint.textContent = '[L] to close';
    hint.style.cssText = 'color:#444;font-size:9px;text-align:center;margin-top:6px';
    _panel.appendChild(hint);

    document.body.appendChild(_panel);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function show() {
    _panelOpen = true;
    if (!_panel) { _buildPanel(); return; }
    _panel.style.display = 'block';
  }

  function hide() {
    _panelOpen = false;
    if (_panel) _panel.style.display = 'none';
  }

  function toggle() {
    if (_panelOpen) hide(); else show();
  }

  function getCurrentStyle() {
    return _currentStyle;
  }

  function setStyle(name) {
    if (!STYLES[name]) return;
    _currentStyle = name;
    _save();
  }

  function init() {
    // Load preferences from localStorage
    _load();

    // Hide legacy CSS crosshair if present
    var old = document.getElementById('crosshair');
    if (old) old.style.display = 'none';

    // Create canvas and start render loop
    _createCanvas();
    _loop();

    // Bind L key — toggle panel
    document.addEventListener('keydown', function(e) {
      // Skip if typing in an input/textarea
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'l' || e.key === 'L') {
        // Only intercept if no modifier is held (to avoid clashing with other shortcuts)
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          toggle();
          e.stopPropagation();
        }
      }
    }, true);

    console.log('[CrosshairConfig] init — style:', _currentStyle, 'color:', _currentColor, 'opacity:', _opacity);
  }

  return {
    init:            init,
    toggle:          toggle,
    show:            show,
    hide:            hide,
    getCurrentStyle: getCurrentStyle,
    setStyle:        setStyle
  };

})();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { window.CrosshairConfig.init(); });
} else {
  window.CrosshairConfig.init();
}
