window.FlameShrine = (function() {
    'use strict';

    var _objects = [];
    var _flames = [];
    var _pillars = [];
    var _time = 0;

    function buildFloor() {
        var geo = new THREE.BoxGeometry(60, 1, 60);
        var mat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, -0.5, 0);
        mesh.receiveShadow = true;
        return mesh;
    }

    function buildWalls() {
        var mat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8 });
        var walls = [
            { pos: [0, 5, -30], size: [60, 10, 2] },
            { pos: [0, 5, 30], size: [60, 10, 2] },
            { pos: [-30, 5, 0], size: [2, 10, 60] },
            { pos: [30, 5, 0], size: [2, 10, 60] }
        ];
        var group = [];
        for (var i = 0; i < walls.length; i++) {
            var w = walls[i];
            var geo = new THREE.BoxGeometry(w.size[0], w.size[1], w.size[2]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.push(mesh);
        }
        return group;
    }

    function buildPillars() {
        var mat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.7 });
        var positions = [
            [-20, -20], [-20, 0], [-20, 20],
            [20, -20], [20, 0], [20, 20],
            [0, -25], [0, 25]
        ];
        var group = [];
        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            var bodyGeo = new THREE.CylinderGeometry(1.2, 1.5, 12, 8);
            var body = new THREE.Mesh(bodyGeo, mat);
            body.position.set(p[0], 6, p[1]);
            body.castShadow = true;
            var capGeo = new THREE.BoxGeometry(3.5, 1.5, 3.5);
            var capMat = new THREE.MeshStandardMaterial({ color: 0x9a6a3a });
            var cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(p[0], 12.5, p[1]);
            group.push(body);
            group.push(cap);
            _pillars.push(body);
        }
        return group;
    }

    function buildCentralAltar() {
        var group = [];
        var baseMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6 });
        var baseGeo = new THREE.BoxGeometry(8, 2, 8);
        var base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 1, 0);
        base.castShadow = true;
        group.push(base);

        var topGeo = new THREE.BoxGeometry(5, 1.5, 5);
        var top = new THREE.Mesh(topGeo, baseMat);
        top.position.set(0, 2.75, 0);
        group.push(top);

        var bowlGeo = new THREE.CylinderGeometry(1.5, 0.8, 2, 8);
        var bowlMat = new THREE.MeshStandardMaterial({ color: 0x4a3a1a, metalness: 0.8 });
        var bowl = new THREE.Mesh(bowlGeo, bowlMat);
        bowl.position.set(0, 4.5, 0);
        group.push(bowl);

        return group;
    }

    function buildFlames() {
        var positions = [
            [0, 5, 0],
            [-18, 1, -18], [18, 1, -18], [-18, 1, 18], [18, 1, 18],
            [-20, 1, 0], [20, 1, 0], [0, 1, -25], [0, 1, 25]
        ];
        var sizes = [2.5, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2];
        var group = [];
        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            var h = sizes[i];
            var coreMat = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xff6600,
                emissiveIntensity: 2.0
            });
            var coreGeo = new THREE.ConeGeometry(h * 0.4, h * 2, 6);
            var core = new THREE.Mesh(coreGeo, coreMat);
            core.position.set(p[0], p[1] + h, p[2]);
            core._baseY = p[1] + h;
            core._phase = Math.random() * Math.PI * 2;
            core._size = h;
            group.push(core);
            _flames.push(core);

            var outerMat = new THREE.MeshStandardMaterial({
                color: 0xff4400,
                emissive: 0xff2200,
                emissiveIntensity: 1.0,
                transparent: true,
                opacity: 0.6
            });
            var outerGeo = new THREE.ConeGeometry(h * 0.6, h * 1.4, 6);
            var outer = new THREE.Mesh(outerGeo, outerMat);
            outer.position.set(p[0], p[1] + h * 0.7, p[2]);
            outer._baseY = p[1] + h * 0.7;
            outer._phase = Math.random() * Math.PI * 2 + 0.3;
            outer._size = h;
            group.push(outer);
            _flames.push(outer);
        }
        return group;
    }

    function buildOfferings() {
        var group = [];
        var mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
        var angles = [0, 1.2, 2.4, 3.6, 4.8, 6.0];
        for (var i = 0; i < angles.length; i++) {
            var a = angles[i];
            var r = 5;
            var x = Math.cos(a) * r;
            var z = Math.sin(a) * r;
            var geo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 3.6, z);
            mesh.rotation.y = a;
            group.push(mesh);
        }
        return group;
    }

    function buildFirePits() {
        var group = [];
        var rimMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, metalness: 0.6 });
        var pitPositions = [[-18, -18], [18, -18], [-18, 18], [18, 18]];
        for (var i = 0; i < pitPositions.length; i++) {
            var p = pitPositions[i];
            var rimGeo = new THREE.CylinderGeometry(2.5, 2.5, 1, 8);
            var rim = new THREE.Mesh(rimGeo, rimMat);
            rim.position.set(p[0], 0.5, p[1]);
            rim.castShadow = true;
            group.push(rim);

            var tripodMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9 });
            for (var j = 0; j < 3; j++) {
                var a = (j / 3) * Math.PI * 2;
                var legGeo = new THREE.CylinderGeometry(0.12, 0.12, 3, 4);
                var leg = new THREE.Mesh(legGeo, tripodMat);
                leg.position.set(p[0] + Math.cos(a) * 1.8, 1.5, p[1] + Math.sin(a) * 1.8);
                leg.rotation.z = Math.cos(a) * 0.3;
                leg.rotation.x = Math.sin(a) * 0.3;
                group.push(leg);
            }
        }
        return group;
    }

    function buildLights(scene) {
        var ambient = new THREE.AmbientLight(0x1a0a00, 0.5);
        scene.add(ambient);
        _objects.push(ambient);

        var mainLight = new THREE.PointLight(0xff6600, 3, 50);
        mainLight.position.set(0, 10, 0);
        mainLight.castShadow = true;
        scene.add(mainLight);
        _objects.push(mainLight);
        mainLight._phase = 0;

        var cornerLights = [
            [-18, 2, -18], [18, 2, -18], [-18, 2, 18], [18, 2, 18]
        ];
        for (var i = 0; i < cornerLights.length; i++) {
            var cl = cornerLights[i];
            var pt = new THREE.PointLight(0xff4400, 1.5, 20);
            pt.position.set(cl[0], cl[1], cl[2]);
            pt._phase = i * 0.8;
            scene.add(pt);
            _objects.push(pt);
        }
    }

    function init(scene, camera) {
        _objects = [];
        _flames = [];
        _pillars = [];
        _time = 0;

        var floor = buildFloor();
        scene.add(floor);
        _objects.push(floor);

        var walls = buildWalls();
        for (var i = 0; i < walls.length; i++) {
            scene.add(walls[i]);
            _objects.push(walls[i]);
        }

        var pillars = buildPillars();
        for (var i = 0; i < pillars.length; i++) {
            scene.add(pillars[i]);
            _objects.push(pillars[i]);
        }

        var altar = buildCentralAltar();
        for (var i = 0; i < altar.length; i++) {
            scene.add(altar[i]);
            _objects.push(altar[i]);
        }

        var flames = buildFlames();
        for (var i = 0; i < flames.length; i++) {
            scene.add(flames[i]);
            _objects.push(flames[i]);
        }

        var offerings = buildOfferings();
        for (var i = 0; i < offerings.length; i++) {
            scene.add(offerings[i]);
            _objects.push(offerings[i]);
        }

        var pits = buildFirePits();
        for (var i = 0; i < pits.length; i++) {
            scene.add(pits[i]);
            _objects.push(pits[i]);
        }

        buildLights(scene);
    }

    function update(delta) {
        _time += delta;
        for (var i = 0; i < _flames.length; i++) {
            var f = _flames[i];
            var flicker = Math.sin(_time * 8 + f._phase) * 0.15 + Math.sin(_time * 13 + f._phase * 2) * 0.08;
            f.scale.y = 1.0 + flicker;
            f.scale.x = 1.0 + flicker * 0.5;
            f.position.y = f._baseY + flicker * f._size * 0.3;
            if (f.material.emissiveIntensity !== undefined) {
                f.material.emissiveIntensity = 1.5 + Math.sin(_time * 10 + f._phase) * 0.8;
            }
        }
        for (var j = 0; j < _objects.length; j++) {
            var obj = _objects[j];
            if (obj.isLight && obj._phase !== undefined) {
                obj.intensity = 2.0 + Math.sin(_time * 7 + obj._phase) * 0.6;
            }
        }
    }

    function reset() {
        for (var i = 0; i < _objects.length; i++) {
            var obj = _objects[i];
            if (obj.parent) obj.parent.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
        _objects = [];
        _flames = [];
        _pillars = [];
    }

    return { init: init, update: update, reset: reset };
}());
