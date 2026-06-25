window.AshFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var ashDrifts = [];
    var lavaCracks = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        ashDrifts = [];
        lavaCracks = [];
        buildAshField();
        buildFortressWalls();
        buildAshDrifts();
        buildTunnelEntries();
        buildGlowCracks();
        buildSentryTowers();
        buildArsenalBuilding();
        buildRubbleZone();
        setupLighting();
    }

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

    function buildAshField() {
        var ashMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var groundGeo = new THREE.BoxGeometry(40, 0.5, 40);
        addMesh(groundGeo, ashMaterial, 0, -0.25, 0);

        for (var x = -20; x < 20; x += 10) {
            for (var z = -20; z < 20; z += 10) {
                var tileGeo = new THREE.BoxGeometry(9, 0.3, 9);
                var offsetY = Math.sin(x * 0.1 + z * 0.1) * 0.4;
                addMesh(tileGeo, ashMaterial, x, offsetY - 0.2, z);
            }
        }
    }

    function buildFortressWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var innerWallGeo = new THREE.BoxGeometry(30, 8, 1);
        var outerWallGeo = new THREE.BoxGeometry(30, 8, 1);

        addMesh(outerWallGeo, wallMaterial, 0, 4, -16);
        addMesh(outerWallGeo, wallMaterial, 0, 4, 16);

        var sideWallGeo = new THREE.BoxGeometry(1, 8, 32);
        addMesh(sideWallGeo, wallMaterial, -15, 4, 0);
        addMesh(sideWallGeo, wallMaterial, 15, 4, 0);

        var cornerGeo = new THREE.BoxGeometry(3, 8, 3);
        addMesh(cornerGeo, wallMaterial, -14, 4, -15);
        addMesh(cornerGeo, wallMaterial, 14, 4, -15);
        addMesh(cornerGeo, wallMaterial, -14, 4, 15);
        addMesh(cornerGeo, wallMaterial, 14, 4, 15);

        var rampartGeo = new THREE.BoxGeometry(28, 1, 1);
        addMesh(rampartGeo, wallMaterial, 0, 8.5, -15.5);
        addMesh(rampartGeo, wallMaterial, 0, 8.5, 15.5);
    }

    function buildAshDrifts() {
        var driftMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var driftPositions = [
            [-13, 1, -13], [-13, 1, 13], [13, 1, -13], [13, 1, 13],
            [-5, 0.8, -15], [5, 0.8, -15], [-5, 0.8, 15], [5, 0.8, 15],
            [-15, 0.6, -5], [-15, 0.6, 5], [15, 0.6, -5], [15, 0.6, 5],
            [-8, 1, -8], [-8, 1, 8], [8, 1, -8], [8, 1, 8],
            [0, 0.7, -12], [0, 0.7, 12], [-12, 0.9, 0], [12, 0.9, 0],
            [-10, 1.2, -10], [10, 1.2, -10], [-10, 1.2, 10], [10, 1.2, 10]
        ];

        for (var i = 0; i < driftPositions.length; i++) {
            var pos = driftPositions[i];
            var driftGeo = new THREE.SphereGeometry(1.2, 6, 6);
            var drift = addMesh(driftGeo, driftMaterial, pos[0], pos[1], pos[2]);
            ashDrifts.push({
                mesh: drift,
                vx: (Math.random() - 0.5) * 0.02,
                vy: (Math.random() - 0.5) * 0.015,
                vz: (Math.random() - 0.5) * 0.02,
                rotX: Math.random() * Math.PI,
                rotY: Math.random() * Math.PI,
                rotZ: Math.random() * Math.PI
            });
        }
    }

    function buildTunnelEntries() {
        var archMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var glowMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4400 });

        var tunnelPositions = [
            [-12, 3, -15.5],
            [12, 3, -15.5],
            [0, 3, 15.5]
        ];

        for (var i = 0; i < tunnelPositions.length; i++) {
            var pos = tunnelPositions[i];

            var archFrameGeo = new THREE.BoxGeometry(4, 4, 0.3);
            addMesh(archFrameGeo, archMaterial, pos[0], pos[1], pos[2] - 0.5);

            var archTopGeo = new THREE.BoxGeometry(4, 0.5, 0.3);
            addMesh(archTopGeo, archMaterial, pos[0], pos[1] + 2.3, pos[2] - 0.5);

            var glowGeo = new THREE.SphereGeometry(0.8, 8, 8);
            addMesh(glowGeo, glowMaterial, pos[0], pos[1] - 0.5, pos[2] - 1.5);

            lavaCracks.push({
                light: new THREE.PointLight(0xFF5500, 0.8, 6),
                position: pos
            });
        }
    }

    function buildGlowCracks() {
        var crackMaterial = new THREE.LineBasicMaterial({ color: 0xFF6600, linewidth: 2 });

        var crackLines = [
            [[-10, 0.1, -10], [10, 0.1, 10]],
            [[-10, 0.1, 10], [10, 0.1, -10]],
            [[-15, 0.1, 0], [-5, 0.1, 5]],
            [[15, 0.1, 0], [5, 0.1, 5]],
            [[-15, 0.1, 0], [-5, 0.1, -5]],
            [[15, 0.1, 0], [5, 0.1, -5]],
            [[0, 0.1, -15], [0, 0.1, -8]],
            [[0, 0.1, 15], [0, 0.1, 8]],
            [[-8, 4, -14], [-3, 4, -14]],
            [[8, 4, -14], [3, 4, -14]],
            [[-8, 4, 14], [-3, 4, 14]],
            [[8, 4, 14], [3, 4, 14]],
            [[-14, 4, 0], [-14, 4, 5]],
            [[14, 4, 0], [14, 4, 5]],
            [[-14, 4, 0], [-14, 4, -5]],
            [[14, 4, 0], [14, 4, -5]]
        ];

        for (var i = 0; i < crackLines.length; i++) {
            var lineGeometry = new THREE.BufferGeometry();
            var points = [
                new THREE.Vector3(crackLines[i][0][0], crackLines[i][0][1], crackLines[i][0][2]),
                new THREE.Vector3(crackLines[i][1][0], crackLines[i][1][1], crackLines[i][1][2])
            ];
            lineGeometry.setFromPoints(points);
            var line = new THREE.LineSegments(lineGeometry, crackMaterial);
            scene.add(line);
            objects.push(line);

            var midX = (crackLines[i][0][0] + crackLines[i][1][0]) / 2;
            var midY = (crackLines[i][0][1] + crackLines[i][1][1]) / 2;
            var midZ = (crackLines[i][0][2] + crackLines[i][1][2]) / 2;

            lavaCracks.push({
                light: new THREE.PointLight(0xFF6600, 0.5, 4),
                position: [midX, midY, midZ],
                initialIntensity: 0.5
            });
        }
    }

    function buildSentryTowers() {
        var towerBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var guardRoomMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

        var towerPositions = [
            [-13, 0, -13],
            [13, 0, -13],
            [-13, 0, 13],
            [13, 0, 13]
        ];

        for (var i = 0; i < towerPositions.length; i++) {
            var pos = towerPositions[i];

            var towerBaseGeo = new THREE.CylinderGeometry(1.5, 1.8, 6, 8);
            addMesh(towerBaseGeo, towerBaseMaterial, pos[0], pos[1] + 3, pos[2]);

            var guardRoomGeo = new THREE.BoxGeometry(3, 2, 3);
            addMesh(guardRoomGeo, guardRoomMaterial, pos[0], pos[1] + 7, pos[2]);

            var roofGeo = new THREE.ConeGeometry(2, 1, 8);
            addMesh(roofGeo, towerBaseMaterial, pos[0], pos[1] + 8.5, pos[2]);
        }
    }

    function buildArsenalBuilding() {
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var crateColor = new THREE.MeshLambertMaterial({ color: 0x6B4423 });

        var wallGeo = new THREE.BoxGeometry(8, 6, 8);
        addMesh(wallGeo, stoneMaterial, -8, 3, -8);

        var roofGeo = new THREE.BoxGeometry(8.5, 0.5, 8.5);
        addMesh(roofGeo, stoneMaterial, -8, 6.5, -8);

        var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 6);
        addMesh(barrelGeo, metalMaterial, -10, 0.75, -6);
        addMesh(barrelGeo, metalMaterial, -10, 0.75, -8);
        addMesh(barrelGeo, metalMaterial, -10.5, 0.75, -7);
        addMesh(barrelGeo, metalMaterial, -9.5, 0.75, -7);

        var crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        addMesh(crateGeo, crateColor, -6.5, 0.6, -6);
        addMesh(crateGeo, crateColor, -5, 0.6, -6);
        addMesh(crateGeo, crateColor, -6.5, 0.6, -7.5);
        addMesh(crateGeo, crateColor, -5, 0.6, -7.5);

        var doorFrameGeo = new THREE.BoxGeometry(3, 4, 0.3);
        addMesh(doorFrameGeo, stoneMaterial, -8, 2.2, -3.85);
    }

    function buildRubbleZone() {
        var rubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var rubblePieces = [
            [6, 1, 8, 3, 1.5, 2],
            [8, 1.2, 10, 2.5, 1.2, 2.5],
            [4, 0.8, 10, 2, 1, 3],
            [7, 1.5, 6, 2, 1.8, 1.5],
            [5, 0.9, 7, 1.5, 1, 2],
            [9, 1.3, 8, 2, 1.3, 2],
            [6, 0.7, 9, 2.5, 0.8, 1.5],
            [8, 1.1, 7, 1.8, 1.2, 2]
        ];

        for (var i = 0; i < rubblePieces.length; i++) {
            var piece = rubblePieces[i];
            var pieceGeo = new THREE.BoxGeometry(piece[3], piece[4], piece[5]);
            addMesh(pieceGeo, rubbleMaterial, piece[0], piece[1], piece[2]);
        }

        var roofSlabGeo = new THREE.BoxGeometry(6, 0.8, 8);
        addMesh(roofSlabGeo, rubbleMaterial, 6.5, 2.5, 8.5);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x666666, 0.7);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFF8844, 0.6);
        directionalLight.position.set(20, 15, 20);
        directionalLight.castShadow = true;
        addLight(directionalLight);

        for (var i = 0; i < lavaCracks.length; i++) {
            lavaCracks[i].light.position.set(lavaCracks[i].position[0], lavaCracks[i].position[1], lavaCracks[i].position[2]);
            addLight(lavaCracks[i].light);
        }
    }

    function update(delta) {
        for (var i = 0; i < ashDrifts.length; i++) {
            var drift = ashDrifts[i];
            drift.mesh.position.x += drift.vx * delta;
            drift.mesh.position.y += drift.vy * delta;
            drift.mesh.position.z += drift.vz * delta;

            drift.rotX += drift.vx * 0.5;
            drift.rotY += drift.vy * 0.5;
            drift.rotZ += drift.vz * 0.5;

            drift.mesh.rotation.x = drift.rotX;
            drift.mesh.rotation.y = drift.rotY;
            drift.mesh.rotation.z = drift.rotZ;

            if (drift.mesh.position.x < -20) drift.mesh.position.x = 20;
            if (drift.mesh.position.x > 20) drift.mesh.position.x = -20;
            if (drift.mesh.position.z < -20) drift.mesh.position.z = 20;
            if (drift.mesh.position.z > 20) drift.mesh.position.z = -20;
        }

        for (var i = 0; i < lavaCracks.length; i++) {
            var crack = lavaCracks[i];
            var pulseIntensity = crack.initialIntensity || 0.5;
            var basePulse = Math.sin(Date.now() * 0.003 + i) * 0.3;
            crack.light.intensity = pulseIntensity + basePulse;
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
        ashDrifts = [];
        lavaCracks = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
