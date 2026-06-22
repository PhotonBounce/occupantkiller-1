window.Weather = (function() {
  'use strict';

  var _scene = null;
  var _camera = null;
  var _current = 'clear'; // clear, rain, snow, fog, sandstorm
  var _particles = null;
  var _particleGeo = null;
  var _particleMat = null;
  var _particleCount = 2000;
  var _time = 0;
  var _fogColor = null;
  var _originalFog = null;

  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
  }

  function setWeather(type) {
    if (_particles) {
      _scene.remove(_particles);
      _particles = null;
    }
    _current = type;

    if (type === 'clear') {
      if (_originalFog && _scene.fog) {
        _scene.fog.color.setHex(_originalFog);
      }
      return;
    }

    // Save original fog
    if (_scene && _scene.fog && !_originalFog) {
      _originalFog = _scene.fog.color.getHex();
    }

    _particleGeo = new THREE.BufferGeometry();
    var positions = new Float32Array(_particleCount * 3);
    var spread = 60;
    for (var i = 0; i < _particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    _particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var color = 0xaaccff; // rain default
    var size = 0.12;
    var opacity = 0.6;
    if (type === 'snow') { color = 0xffffff; size = 0.25; opacity = 0.8; }
    if (type === 'sandstorm') { color = 0xcc9944; size = 0.18; opacity = 0.5; }
    if (type === 'fog') { color = 0xaaaaaa; size = 0.4; opacity = 0.15; }

    _particleMat = new THREE.PointsMaterial({ color: color, size: size, transparent: true, opacity: opacity, depthWrite: false });
    _particles = new THREE.Points(_particleGeo, _particleMat);
    _scene.add(_particles);

    // Adjust fog for weather
    if (_scene && _scene.fog) {
      if (type === 'fog') _scene.fog.color.setHex(0x888888);
      if (type === 'sandstorm') _scene.fog.color.setHex(0xbb8833);
      if (type === 'rain') _scene.fog.color.setHex(0x334455);
      if (type === 'snow') _scene.fog.color.setHex(0xccddee);
    }
  }

  function update(dt, cameraPos) {
    if (!_particles || !_particleGeo || _current === 'clear') return;
    _time += dt;
    var positions = _particleGeo.attributes.position.array;
    var spread = 60;
    var fallSpeed = _current === 'rain' ? 18 : (_current === 'snow' ? 3 : (_current === 'sandstorm' ? 8 : 0.5));
    var driftX = _current === 'sandstorm' ? 6 : (_current === 'rain' ? 1.5 : 0);

    for (var i = 0; i < _particleCount; i++) {
      positions[i * 3 + 1] -= fallSpeed * dt;
      positions[i * 3]     += driftX * dt * 0.1 * Math.sin(_time + i);
      // Reset particles that fall below ground; follow camera
      if (positions[i * 3 + 1] < (cameraPos ? cameraPos.y - 2 : 0)) {
        positions[i * 3]     = (cameraPos ? cameraPos.x : 0) + (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (cameraPos ? cameraPos.y : 0) + 25 + Math.random() * 10;
        positions[i * 3 + 2] = (cameraPos ? cameraPos.z : 0) + (Math.random() - 0.5) * spread;
      } else {
        // Keep following camera horizontally
        if (cameraPos) {
          var relX = positions[i * 3] - cameraPos.x;
          var relZ = positions[i * 3 + 2] - cameraPos.z;
          if (Math.abs(relX) > spread / 2) positions[i * 3] = cameraPos.x + (Math.random() - 0.5) * spread;
          if (Math.abs(relZ) > spread / 2) positions[i * 3 + 2] = cameraPos.z + (Math.random() - 0.5) * spread;
        }
      }
    }
    _particleGeo.attributes.position.needsUpdate = true;
  }

  function getCurrent() { return _current; }

  return { init: init, setWeather: setWeather, update: update, getCurrent: getCurrent };
})();
