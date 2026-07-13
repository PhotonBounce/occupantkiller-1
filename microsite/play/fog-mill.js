window.FogMill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var windmills = [];
    var fogWisps = [];

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

    function buildMoor() {
        var moorMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3d2d });
        var tileSize = 1;
        var gridCount = 40;
        var baseY = -0.5;

        for (var x = 0; x < gridCount; x++) {
            for (var z = 0; z < gridCount; z++) {
                var posX = (x - gridCount / 2) * tileSize;
                var posZ = (z - gridCount / 2) * tileSize;
                var geo = new THREE.BoxGeometry(tileSize, 0.2, tileSize);
                addMesh(geo, moorMaterial, posX, baseY, posZ);
            }
        }
    }

    function buildWindmills() {
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var sailMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var capMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        var positions = [
            { x: -12, z: -10 },
            { x: 8, z: 15 },
            { x: 15, z: -12 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];

            var towerGeo = new THREE.CylinderGeometry(2, 2, 16, 8);
            var tower = addMesh(towerGeo, towerMaterial, pos.x, 8, pos.z);

            var capGeo = new THREE.ConeGeometry(2.5, 3, 8);
            addMesh(capGeo, capMaterial, pos.x, 16.5, pos.z);

            var sailGroup = [];
            for (var s = 0; s < 4; s++) {
                var sailGeo = new THREE.BoxGeometry(0.3, 4, 2);
                var sail = new THREE.Mesh(sailGeo, sailMaterial);
                sail.position.set(pos.x, 14, pos.z);
                sail.rotation.y = (Math.PI / 2) * s;
                scene.add(sail);
                objects.push(sail);
                sailGroup.push(sail);
            }

            windmills.push({
                sails: sailGroup,
                x: pos.x,
                y: 14,
                z: pos.z,
                speed: i === 0 ? 0.5 : (i === 1 ? 0.7 : 0.4)
            });
        }
    }

    function buildVillageRuins() {
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
        var debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        var cottagePositions = [
            { x: -8, z: 8 },
            { x: -15, z: -5 },
            { x: 3, z: -18 },
            { x: 12, z: 8 },
            { x: -5, z: 20 },
            { x: 18, z: 12 },
            { x: -20, z: 15 },
            { x: 20, z: -8 }
        ];

        for (var i = 0; i < cottagePositions.length; i++) {
            var cPos = cottagePositions[i];

            var wallGeo = new THREE.BoxGeometry(4, 3, 4);
            addMesh(wallGeo, stoneMaterial, cPos.x, 1.5, cPos.z);

            var roofGeo = new THREE.BoxGeometry(4.5, 0.3, 4.5);
            addMesh(roofGeo, debrisMaterial, cPos.x + 0.5, 3.2, cPos.z + 0.5);

            for (var d = 0; d < 3; d++) {
                var debrisGeo = new THREE.BoxGeometry(
                    0.8 + Math.random() * 0.4,
                    0.5 + Math.random() * 0.3,
                    0.8 + Math.random() * 0.4
                );
                var debrisX = cPos.x + (Math.random() - 0.5) * 6;
                var debrisZ = cPos.z + (Math.random() - 0.5) * 6;
                addMesh(debrisGeo, debrisMaterial, debrisX, 0.5, debrisZ);
            }
        }

        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var wallPositions = [
            { x: -10, z: -15, lenX: 15, lenZ: 1 },
            { x: 5, z: 18, lenX: 12, lenZ: 1 },
            { x: -18, z: 0, lenX: 1, lenZ: 10 }
        ];

        for (var w = 0; w < wallPositions.length; w++) {
            var wPos = wallPositions[w];
            var wallGeo = new THREE.BoxGeometry(wPos.lenX, 2, wPos.lenZ);
            addMesh(wallGeo, wallMaterial, wPos.x, 1, wPos.z);
        }
    }

    function buildFogWisps() {
        var fogMaterial = new THREE.MeshLambertMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.3
        });

        for (var i = 0; i < 50; i++) {
            var x = (Math.random() - 0.5) * 40;
            var z = (Math.random() - 0.5) * 40;
            var y = Math.random() * 3;
            var size = 1 + Math.random() * 1.5;

            var wispGeo = new THREE.SphereGeometry(size, 4, 4);
            var wisp = addMesh(wispGeo, fogMaterial, x, y, z);

            fogWisps.push({
                mesh: wisp,
                startY: y,
                amplitude: 0.5 + Math.random() * 0.5,
                speed: 0.5 + Math.random() * 1.0,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function buildDefenses() {
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

        var sandbagWalls = [
            { x: -18, z: 5, lenX: 12, lenZ: 1 },
            { x: 10, z: -20, lenX: 1, lenZ: 8 },
            { x: 0, z: 20, lenX: 8, lenZ: 1 }
        ];

        for (var i = 0; i < sandbagWalls.length; i++) {
            var w = sandbagWalls[i];
            for (var layer = 0; layer < 3; layer++) {
                var bagGeo = new THREE.BoxGeometry(w.lenX, 0.6, w.lenZ);
                addMesh(bagGeo, sandbagMaterial, w.x, 0.3 + layer * 0.7, w.z);
            }
        }

        var nestPositions = [
            { x: -15, z: 10 },
            { x: 12, z: -15 },
            { x: 8, z: 18 }
        ];

        for (var n = 0; n < nestPositions.length; n++) {
            var nPos = nestPositions[n];
            var nestGeo = new THREE.BoxGeometry(3, 1, 3);
            addMesh(nestGeo, sandbagMaterial, nPos.x, 2, nPos.z);

            var gunGeo = new THREE.BoxGeometry(0.4, 0.4, 1.5);
            addMesh(gunGeo, metalMaterial, nPos.x, 2.8, nPos.z);
        }

        var towerPositions = [
            { x: -8, z: 8, basePos: { x: -8, z: 8 } },
            { x: 3, z: -18, basePos: { x: 3, z: -18 } },
            { x: 18, z: 12, basePos: { x: 18, z: 12 } }
        ];

        for (var t = 0; t < towerPositions.length; t++) {
            var tPos = towerPositions[t];
            var baseGeo = new THREE.BoxGeometry(4, 0.8, 4);
            addMesh(baseGeo, sandbagMaterial, tPos.basePos.x, 3.5, tPos.basePos.z);

            var towerGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 6);
            addMesh(towerGeo, metalMaterial, tPos.x, 6.5, tPos.z);

            var roofGeo = new THREE.ConeGeometry(2, 1.5, 6);
            addMesh(roofGeo, metalMaterial, tPos.x, 9.5, tPos.z);

            var gunGeo = new THREE.BoxGeometry(0.3, 0.3, 1.2);
            addMesh(gunGeo, metalMaterial, tPos.x, 7.8, tPos.z);
        }
    }

    function buildMoorPools() {
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });

        var poolPositions = [
            { x: -12, z: -15, w: 5, d: 4 },
            { x: 10, z: 10, w: 4, d: 3 },
            { x: 15, z: -8, w: 6, d: 5 },
            { x: -18, z: 20, w: 4, d: 4 },
            { x: 5, z: -25, w: 5, d: 4 },
            { x: -8, z: 25, w: 3, d: 3 }
        ];

        for (var i = 0; i < poolPositions.length; i++) {
            var pPos = poolPositions[i];
            var poolGeo = new THREE.BoxGeometry(pPos.w, 1.5, pPos.d);
            addMesh(poolGeo, waterMaterial, pPos.x, -0.8, pPos.z);
        }
    }

    function buildGraveyard() {
        var crossMaterial = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });

        var gravePositions = [
            { x: -15, z: -25 },
            { x: -13, z: -25 },
            { x: -11, z: -25 },
            { x: -15, z: -23 },
            { x: -13, z: -23 },
            { x: -11, z: -23 },
            { x: -15, z: -21 },
            { x: -13, z: -21 },
            { x: -11, z: -21 },
            { x: -15, z: -19 },
            { x: -13, z: -19 },
            { x: -11, z: -19 }
        ];

        for (var i = 0; i < gravePositions.length; i++) {
            var gPos = gravePositions[i];

            var verticalGeo = new THREE.BoxGeometry(0.3, 2.5, 0.3);
            addMesh(verticalGeo, crossMaterial, gPos.x, 1.25, gPos.z);

            var horizontalGeo = new THREE.BoxGeometry(1, 0.3, 0.3);
            addMesh(horizontalGeo, crossMaterial, gPos.x, 1.5, gPos.z);
        }

        var graveWallSegments = [
            { x: -17, z: -27, lenX: 8, lenZ: 1 },
            { x: -17, z: -17, lenX: 8, lenZ: 1 },
            { x: -17, z: -22, lenX: 1, lenZ: 10 },
            { x: -9, z: -22, lenX: 1, lenZ: 10 }
        ];

        for (var w = 0; w < graveWallSegments.length; w++) {
            var wSeg = graveWallSegments[w];
            var wallGeo = new THREE.BoxGeometry(wSeg.lenX, 1.5, wSeg.lenZ);
            addMesh(wallGeo, wallMaterial, wSeg.x, 0.75, wSeg.z);
        }
    }

    function buildCartTracks() {
        var trackMaterial = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });

        var trackPairs = [
            { startX: -20, startZ: -20, endX: 20, endZ: 5 },
            { startX: -18, startZ: -22, endX: 18, endZ: 3 },
            { startX: -25, startZ: 0, endX: 25, endZ: 0 },
            { startX: -22, startZ: 2, endX: 22, endZ: 2 }
        ];

        for (var i = 0; i < trackPairs.length; i++) {
            var track = trackPairs[i];
            var points = [
                new THREE.Vector3(track.startX, 0, track.startZ),
                new THREE.Vector3(track.endX, 0, track.endZ)
            ];
            var geo = new THREE.BufferGeometry().setFromPoints(points);
            var line = new THREE.LineSegments(geo, trackMaterial);
            scene.add(line);
            objects.push(line);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x334455, 0.5);
        addLight(ambientLight);

        var moonLight = new THREE.DirectionalLight(0xaabbff, 0.8);
        moonLight.position.set(15, 20, -10);
        moonLight.castShadow = true;
        addLight(moonLight);

        var lanternPositions = [
            { x: -10, z: 10 },
            { x: 12, z: -12 },
            { x: 8, z: 18 },
            { x: -18, z: -8 }
        ];

        for (var i = 0; i < lanternPositions.length; i++) {
            var lPos = lanternPositions[i];
            var lantern = new THREE.PointLight(0xffcc99, 0.6, 15);
            lantern.position.set(lPos.x, 4, lPos.z);
            addLight(lantern);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        windmills = [];
        fogWisps = [];

        buildMoor();
        buildWindmills();
        buildVillageRuins();
        buildFogWisps();
        buildDefenses();
        buildMoorPools();
        buildGraveyard();
        buildCartTracks();
        setupLighting();

        var fog = new THREE.Fog(0x334455, 30, 80);
        scene.fog = fog;
    }

    function update(delta) {
        for (var i = 0; i < windmills.length; i++) {
            var mill = windmills[i];
            for (var s = 0; s < mill.sails.length; s++) {
                mill.sails[s].rotation.z += mill.speed * delta;
            }
        }

        for (var f = 0; f < fogWisps.length; f++) {
            var wisp = fogWisps[f];
            var waveOffset = Math.sin(Date.now() * 0.001 * wisp.speed + wisp.phase) * wisp.amplitude;
            wisp.mesh.position.y = wisp.startY + waveOffset;
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
        windmills = [];
        fogWisps = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
