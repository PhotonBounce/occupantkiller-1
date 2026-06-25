window.MossKeep = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var raindrops = [];
    var waterfallBoxes = [];

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildForestFloor() {
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x1A3A0A });
        var floorGeo = new THREE.BoxGeometry(40, 1, 40);
        addMesh(floorGeo, floorMaterial, 0, -1, 0);

        var fernMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5A1D });
        var fernGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
        for (var i = 0; i < 30; i++) {
            var fx = (Math.random() - 0.5) * 80;
            var fz = (Math.random() - 0.5) * 80;
            var fern = addMesh(fernGeo, fernMaterial, fx, 0.5, fz);
            fern.rotation.z = (Math.random() - 0.5) * 0.5;
        }
    }

    function buildMossyCastle() {
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x556644 });
        var mossyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5c3a });

        var baseGeo = new THREE.BoxGeometry(15, 20, 15);
        addMesh(baseGeo, stoneMaterial, 0, 10, 0);

        var turretGeo = new THREE.CylinderGeometry(2, 2, 22, 12);
        addMesh(turretGeo, mossyMaterial, 7, 11, 7);
        addMesh(turretGeo, mossyMaterial, -7, 11, 7);
        addMesh(turretGeo, mossyMaterial, 7, 11, -7);
        addMesh(turretGeo, mossyMaterial, -7, 11, -7);

        var battlementGeo = new THREE.BoxGeometry(2, 1.5, 15);
        var battlementMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
        for (var i = 0; i < 7; i++) {
            var bx = -7 + i * 2.3;
            addMesh(battlementGeo, battlementMaterial, bx, 20.5, 0);
        }

        var battlementGeo2 = new THREE.BoxGeometry(15, 1.5, 2);
        for (var i = 0; i < 7; i++) {
            var bz = -7 + i * 2.3;
            addMesh(battlementGeo2, battlementMaterial, 0, 20.5, bz);
        }
    }

    function buildVineWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x445533 });
        var wallGeo = new THREE.BoxGeometry(25, 18, 1);
        addMesh(wallGeo, wallMaterial, 0, 9, 12.5);
        addMesh(wallGeo, wallMaterial, 0, 9, -12.5);
        addMesh(wallGeo, wallMaterial, 12.5, 9, 0);
        addMesh(wallGeo, wallMaterial, -12.5, 9, 0);

        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x2D5A1D, linewidth: 1 });
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 10; j++) {
                var startX = -12 + i * 3;
                var startZ = 12;
                var startY = 18 - j * 2;
                var points = [
                    new THREE.Vector3(startX, startY, startZ),
                    new THREE.Vector3(startX + 0.3, startY - 1.5, startZ),
                    new THREE.Vector3(startX + 0.6, startY - 3, startZ),
                    new THREE.Vector3(startX + 0.9, startY - 4.5, startZ)
                ];
                var vineGeom = new THREE.BufferGeometry().setFromPoints(points);
                var vine = new THREE.LineSegments(vineGeom, lineMaterial);
                scene.add(vine);
                objects.push(vine);
            }
        }
    }

    function buildRainforestTrees() {
        var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
        var rootMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3820 });

        for (var t = 0; t < 20; t++) {
            var tx = (Math.random() - 0.5) * 100;
            var tz = (Math.random() - 0.5) * 100;
            if (Math.sqrt(tx * tx + tz * tz) < 20) continue;

            var trunkGeo = new THREE.CylinderGeometry(1.5, 2, 25, 16);
            addMesh(trunkGeo, trunkMaterial, tx, 12.5, tz);

            for (var c = 0; c < 4; c++) {
                var canopyGeo = new THREE.SphereGeometry(5 + Math.random() * 3, 12, 12);
                var cy = 20 + c * 4;
                var cox = (Math.random() - 0.5) * 4;
                var coz = (Math.random() - 0.5) * 4;
                addMesh(canopyGeo, canopyMaterial, tx + cox, cy, tz + coz);
            }

            var rootGeo = new THREE.BoxGeometry(1, 0.8, 6);
            for (var r = 0; r < 3; r++) {
                var angle = (r / 3) * Math.PI * 2;
                var rx = tx + Math.cos(angle) * 3;
                var rz = tz + Math.sin(angle) * 3;
                var root = addMesh(rootGeo, rootMaterial, rx, 0.4, rz);
                root.rotation.z = angle + Math.PI / 4;
            }
        }
    }

    function buildWaterfall() {
        var waterfallMaterial = new THREE.MeshLambertMaterial({ color: 0xAADDFF });
        var waterGeo = new THREE.BoxGeometry(3, 0.8, 1);

        for (var w = 0; w < 15; w++) {
            var wx = -20;
            var wy = 30 - w * 2;
            var waterBox = addMesh(waterGeo, waterfallMaterial, wx, wy, 0);
            waterfallBoxes.push({ mesh: waterBox, baseY: wy });
        }

        var splashGeo = new THREE.SphereGeometry(2, 16, 16);
        var splashMaterial = new THREE.MeshLambertMaterial({ color: 0x88CCFF });
        addMesh(splashGeo, splashMaterial, -20, 0, 0);
    }

    function buildAncientStatues() {
        var statueColors = [0x787860, 0x747468, 0x808080];

        for (var s = 0; s < 3; s++) {
            var sx = -15 + s * 15;
            var sz = -15;
            var statColor = statueColors[s];
            var statMat = new THREE.MeshLambertMaterial({ color: statColor });

            var bodyGeo1 = new THREE.BoxGeometry(1.2, 2, 0.8);
            addMesh(bodyGeo1, statMat, sx, 1.5, sz);

            var bodyGeo2 = new THREE.BoxGeometry(0.9, 1.8, 0.7);
            addMesh(bodyGeo2, statMat, sx, 3.5, sz);

            var headGeo = new THREE.SphereGeometry(0.6, 12, 12);
            addMesh(headGeo, statMat, sx, 5.5, sz);

            var hatGeo = new THREE.ConeGeometry(0.8, 0.8, 8);
            addMesh(hatGeo, statMat, sx, 6.4, sz);
        }
    }

    function buildMilitaryOccupation() {
        var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 1.5 });
        var ropeGeom = new THREE.BufferGeometry();
        var ropePoints = [
            new THREE.Vector3(-30, 25, -30),
            new THREE.Vector3(-25, 20, -20),
            new THREE.Vector3(-20, 18, -10),
            new THREE.Vector3(-15, 20, 0)
        ];
        ropeGeom.setFromPoints(ropePoints);
        var bridge = new THREE.LineSegments(ropeGeom, ropeMaterial);
        scene.add(bridge);
        objects.push(bridge);

        var plankMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var plankGeo = new THREE.BoxGeometry(0.8, 0.4, 12);
        for (var p = 0; p < 4; p++) {
            var px = -30 + p * 3;
            var py = 20 + Math.sin(p * 0.5) * 2;
            addMesh(plankGeo, plankMaterial, px, py, -20);
        }

        var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xBB8844 });
        var tentGeo = new THREE.ConeGeometry(2.5, 3.5, 8);
        addMesh(tentGeo, tentMaterial, -25, 1.75, 20);
        addMesh(tentGeo, tentMaterial, -30, 1.75, 25);
        addMesh(tentGeo, tentMaterial, -20, 1.75, 25);

        var mgMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mgGeo = new THREE.BoxGeometry(0.5, 0.3, 1);
        var mg = addMesh(mgGeo, mgMaterial, 0, 22, 0);
        mg.rotation.z = 0.3;
        mg.rotation.y = 0.5;
    }

    function buildRainEffect() {
        var rainMaterial = new THREE.MeshLambertMaterial({ color: 0xCCDDEE });
        var rainGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 4);

        for (var r = 0; r < 70; r++) {
            var rx = (Math.random() - 0.5) * 100;
            var ry = Math.random() * 50;
            var rz = (Math.random() - 0.5) * 100;
            var raindrop = addMesh(rainGeo, rainMaterial, rx, ry, rz);
            raindrops.push({
                mesh: raindrop,
                baseX: rx,
                baseZ: rz,
                startY: ry
            });
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x1A3D0A, 0.6);
        addLight(ambientLight);

        var directional = new THREE.DirectionalLight(0xAACCAA, 0.7);
        directional.position.set(30, 40, 30);
        addLight(directional);

        var waterfallLight = new THREE.PointLight(0x5599FF, 0.5);
        waterfallLight.position.set(-20, 5, 0);
        addLight(waterfallLight);

        var castleLight = new THREE.PointLight(0x88AA66, 0.4);
        castleLight.position.set(0, 25, 0);
        addLight(castleLight);
    }

    function update(delta) {
        for (var i = 0; i < raindrops.length; i++) {
            var drop = raindrops[i];
            drop.mesh.position.y -= 7 * delta;
            if (drop.mesh.position.y < -5) {
                drop.mesh.position.y = drop.startY;
            }
        }

        var wfSpeed = 3 * delta;
        for (var i = 0; i < waterfallBoxes.length; i++) {
            var wb = waterfallBoxes[i];
            wb.mesh.position.y -= wfSpeed;
            if (wb.mesh.position.y < -5) {
                wb.mesh.position.y = wb.baseY;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        raindrops = [];
        waterfallBoxes = [];
        scene = null;
        camera = null;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        raindrops = [];
        waterfallBoxes = [];
        buildForestFloor();
        buildMossyCastle();
        buildVineWalls();
        buildRainforestTrees();
        buildWaterfall();
        buildAncientStatues();
        buildMilitaryOccupation();
        buildRainEffect();
        setupLighting();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
