window.IronGrove = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var waterWheelGroup = null;

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

    function buildGroundFloor() {
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3D1C02 });
        var gridSize = 40;
        var tileSize = 1;
        var tilesPerSide = gridSize / tileSize;

        for (var x = 0; x < tilesPerSide; x++) {
            for (var z = 0; z < tilesPerSide; z++) {
                var xPos = x * tileSize - gridSize / 2;
                var zPos = z * tileSize - gridSize / 2;
                var geo = new THREE.BoxGeometry(tileSize, 0.2, tileSize);
                addMesh(geo, groundMaterial, xPos, -0.1, zPos);
            }
        }
    }

    function buildTrees() {
        var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4D2C1C });
        var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5F1C });

        var treePositions = [
            [-15, 0, -15], [-12, 0, -18], [-10, 0, -12],
            [-8, 0, -20], [-5, 0, -16], [0, 0, -18],
            [5, 0, -20], [8, 0, -15], [12, 0, -17],
            [15, 0, -19], [18, 0, -14], [-18, 0, 5],
            [-16, 0, 12], [-12, 0, 15], [-8, 0, 10],
            [0, 0, 16], [8, 0, 14], [14, 0, 18],
            [16, 0, 8], [19, 0, 12]
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var pos = treePositions[i];
            var trunkHeight = 8 + Math.random() * 6;
            var trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, trunkHeight, 8);
            var trunk = addMesh(trunkGeo, trunkMaterial, pos[0], pos[1] + trunkHeight / 2, pos[2]);

            var canopyRadius = 3 + Math.random() * 2;
            var canopyGeo = new THREE.SphereGeometry(canopyRadius, 8, 8);
            var canopy = addMesh(canopyGeo, canopyMaterial, pos[0], pos[1] + trunkHeight + canopyRadius - 1, pos[2]);
        }

        var fallenLogPositions = [
            [6, 0.3, 8], [-10, 0.3, 2], [12, 0.3, -8]
        ];

        for (var j = 0; j < fallenLogPositions.length; j++) {
            var lpos = fallenLogPositions[j];
            var logGeo = new THREE.CylinderGeometry(0.3, 0.35, 12, 8);
            var log = addMesh(logGeo, trunkMaterial, lpos[0], lpos[1], lpos[2]);
            log.rotation.z = Math.PI / 2.5;
        }
    }

    function buildIronDeposits() {
        var rustMaterial = new THREE.MeshLambertMaterial({ color: 0x8B2500 });
        var oreMaterial = new THREE.MeshLambertMaterial({ color: 0x4A1A0A });

        var depositPositions = [
            [-20, 0, 0], [-16, 0, 8], [-12, 0, -6],
            [-6, 0, 12], [0, 0, 8], [6, 0, 10],
            [12, 0, 6], [16, 0, 0], [18, 0, -8],
            [-14, 0, -12], [10, 0, -6], [14, 0, -12]
        ];

        for (var i = 0; i < depositPositions.length; i++) {
            var pos = depositPositions[i];
            var boulderRadius = 1.2 + Math.random() * 0.8;
            var boulderGeo = new THREE.SphereGeometry(boulderRadius, 6, 6);
            addMesh(boulderGeo, rustMaterial, pos[0], pos[1] + boulderRadius, pos[2]);

            var boxSize = 0.6 + Math.random() * 0.4;
            var oreGeo = new THREE.BoxGeometry(boxSize, boxSize * 1.5, boxSize * 0.8);
            addMesh(oreGeo, oreMaterial, pos[0] + 1.5, pos[1] + 0.8, pos[2] + 1);

            var oreGeo2 = new THREE.BoxGeometry(boxSize * 0.7, boxSize, boxSize);
            addMesh(oreGeo2, oreMaterial, pos[0] - 1.2, pos[1] + 0.5, pos[2] - 1.5);
        }

        var oreVeinMaterial = new THREE.LineBasicMaterial({ color: 0xA0522D });
        var veinGeometry = new THREE.BufferGeometry();
        var veinPoints = [
            new THREE.Vector3(-18, 0.3, -2),
            new THREE.Vector3(-14, 0.8, 1),
            new THREE.Vector3(-10, 0.5, 3)
        ];
        veinGeometry.setFromPoints(veinPoints);
        var vein = new THREE.LineSegments(veinGeometry, oreVeinMaterial);
        scene.add(vein);
        objects.push(vein);

        var veinGeometry2 = new THREE.BufferGeometry();
        var veinPoints2 = [
            new THREE.Vector3(8, 0.3, 5),
            new THREE.Vector3(12, 0.6, 8),
            new THREE.Vector3(16, 0.4, 11)
        ];
        veinGeometry2.setFromPoints(veinPoints2);
        var vein2 = new THREE.LineSegments(veinGeometry2, oreVeinMaterial);
        scene.add(vein2);
        objects.push(vein2);
    }

    function buildForgeRuins() {
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x5A4A42 });
        var slagMaterial = new THREE.MeshLambertMaterial({ color: 0x2A1A12 });

        var forgeBaseGeo = new THREE.BoxGeometry(8, 5, 4);
        addMesh(forgeBaseGeo, stoneMaterial, -8, 2.5, 12);

        var forgeWallGeo = new THREE.BoxGeometry(7.5, 4, 3.5);
        addMesh(forgeWallGeo, stoneMaterial, -8, 5, 12);

        var chimneyGeo = new THREE.CylinderGeometry(1, 1.2, 8, 8);
        addMesh(chimneyGeo, stoneMaterial, -8, 8, 12);

        var collapsedChimneyGeo = new THREE.BoxGeometry(1.8, 2, 1.8);
        addMesh(collapsedChimneyGeo, stoneMaterial, -7, 9, 14);
        addMesh(collapsedChimneyGeo, stoneMaterial, -9, 8.5, 13);

        var slagPile1Geo = new THREE.SphereGeometry(2, 6, 6);
        addMesh(slagPile1Geo, slagMaterial, -6, 1.5, 14);

        var slagPile2Geo = new THREE.BoxGeometry(3, 2, 2.5);
        addMesh(slagPile2Geo, slagMaterial, -10, 1.2, 14);

        var ductGeo = new THREE.CylinderGeometry(0.6, 0.6, 5, 6);
        var duct = addMesh(ductGeo, stoneMaterial, -8, 5.5, 12);
        duct.rotation.z = Math.PI / 3;
    }

    function buildWaterWheel() {
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3828 });
        var axleMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2420 });

        waterWheelGroup = new THREE.Group();

        var axleGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
        var axle = new THREE.Mesh(axleGeo, axleMaterial);
        axle.rotation.x = Math.PI / 2;
        axle.position.set(0, 0, 0);
        waterWheelGroup.add(axle);

        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var paddleGeo = new THREE.BoxGeometry(1.5, 0.3, 3);
            var paddle = new THREE.Mesh(paddleGeo, wheelMaterial);
            paddle.position.set(0, Math.cos(angle) * 2.5, Math.sin(angle) * 2.5);
            waterWheelGroup.add(paddle);
        }

        waterWheelGroup.position.set(12, 3, -12);
        scene.add(waterWheelGroup);
        objects.push(waterWheelGroup);
    }

    function buildMineShafts() {
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x3A2820 });
        var ladderMaterial = new THREE.LineBasicMaterial({ color: 0x5A4A40 });

        var shaftPositions = [
            [-10, 0, -10],
            [0, 0, -8],
            [10, 0, -6]
        ];

        for (var s = 0; s < shaftPositions.length; s++) {
            var sp = shaftPositions[s];

            var frameGeo = new THREE.BoxGeometry(3, 4, 3);
            addMesh(frameGeo, frameMaterial, sp[0], sp[1] + 2, sp[2]);

            var ladderGeometry = new THREE.BufferGeometry();
            var ladderPoints = [];
            for (var r = 0; r < 6; r++) {
                var rungY = sp[1] + 3 - (r * 0.7);
                ladderPoints.push(new THREE.Vector3(sp[0] - 1.2, rungY, sp[2]));
                ladderPoints.push(new THREE.Vector3(sp[0] + 1.2, rungY, sp[2]));
            }
            ladderGeometry.setFromPoints(ladderPoints);
            var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
            scene.add(ladder);
            objects.push(ladder);
        }
    }

    function buildDefenses() {
        var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0x4D3C2C });
        var stakeMaterial = new THREE.MeshLambertMaterial({ color: 0x3D2C1C });
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x5A4A42 });

        var barricadePositions = [
            [-18, 0.4, -15],
            [16, 0.4, 18],
            [-12, 0.4, 16]
        ];

        for (var b = 0; b < barricadePositions.length; b++) {
            var bp = barricadePositions[b];
            var barricadeGeo = new THREE.CylinderGeometry(0.25, 0.3, 10, 6);
            var barricade = addMesh(barricadeGeo, barricadeMaterial, bp[0], bp[1], bp[2]);
            barricade.rotation.z = Math.PI / 2.2;
        }

        var stakePositions = [
            [-19, 0.5, -18], [-19, 0.5, -14], [-18, 0.5, -18], [-18, 0.5, -14],
            [17, 0.5, 16], [17, 0.5, 20], [18, 0.5, 16], [18, 0.5, 20],
            [-13, 0.5, 14], [-13, 0.5, 18], [-11, 0.5, 14], [-11, 0.5, 18]
        ];

        for (var st = 0; st < stakePositions.length; st++) {
            var stp = stakePositions[st];
            var stakeGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 4);
            addMesh(stakeGeo, stakeMaterial, stp[0], stp[1], stp[2]);
        }

        var platform1Geo = new THREE.BoxGeometry(4, 0.4, 4);
        addMesh(platform1Geo, platformMaterial, -15, 6, 0);

        var supportGeo = new THREE.CylinderGeometry(0.3, 0.4, 6, 6);
        addMesh(supportGeo, platformMaterial, -15, 3, 0);

        var platform2Geo = new THREE.BoxGeometry(4, 0.4, 4);
        addMesh(platform2Geo, platformMaterial, 14, 6, 8);

        var support2Geo = new THREE.CylinderGeometry(0.3, 0.4, 6, 6);
        addMesh(support2Geo, platformMaterial, 14, 3, 8);
    }

    function buildCampSites() {
        var tentMaterial = new THREE.MeshLambertMaterial({ color: 0x6A5A4A });
        var createMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
        var emberMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B1A });

        var camp1X = -20;
        var camp1Z = 10;

        var tent1Geo = new THREE.ConeGeometry(1.5, 2.5, 6);
        addMesh(tent1Geo, tentMaterial, camp1X, 1.25, camp1Z);

        var tent2Geo = new THREE.ConeGeometry(1.2, 2, 6);
        addMesh(tent2Geo, tentMaterial, camp1X + 4, 1, camp1Z);

        var crateGeo = new THREE.BoxGeometry(1, 1, 1);
        addMesh(crateGeo, createMaterial, camp1X - 2, 0.5, camp1Z - 2);
        addMesh(crateGeo, createMaterial, camp1X - 2, 0.5, camp1Z + 2);

        var fireGeo = new THREE.SphereGeometry(0.8, 6, 6);
        addMesh(fireGeo, emberMaterial, camp1X + 1, 0.5, camp1Z);

        var camp2X = 18;
        var camp2Z = -16;

        var tent3Geo = new THREE.ConeGeometry(1.5, 2.5, 6);
        addMesh(tent3Geo, tentMaterial, camp2X, 1.25, camp2Z);

        var tent4Geo = new THREE.ConeGeometry(1.2, 2, 6);
        addMesh(tent4Geo, tentMaterial, camp2X - 4, 1, camp2Z);

        var crateGeo2 = new THREE.BoxGeometry(1, 1, 1);
        addMesh(crateGeo2, createMaterial, camp2X + 2, 0.5, camp2Z - 2);
        addMesh(crateGeo2, createMaterial, camp2X + 2, 0.5, camp2Z + 2);

        var fireGeo2 = new THREE.SphereGeometry(0.8, 6, 6);
        addMesh(fireGeo2, emberMaterial, camp2X - 1, 0.5, camp2Z);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x2D3B1A, 0.5);
        addLight(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xD4A574, 0.7);
        dirLight.position.set(15, 20, 15);
        addLight(dirLight);

        var dirLight2 = new THREE.DirectionalLight(0x6B8E23, 0.4);
        dirLight2.position.set(-15, 15, -20);
        addLight(dirLight2);

        var forgeGlow = new THREE.PointLight(0xFF6B1A, 0.8, 20);
        forgeGlow.position.set(-8, 6, 12);
        addLight(forgeGlow);

        var campGlow = new THREE.PointLight(0xFF8C00, 0.6, 15);
        campGlow.position.set(-20, 1.5, 10);
        addLight(campGlow);

        var campGlow2 = new THREE.PointLight(0xFF8C00, 0.6, 15);
        campGlow2.position.set(18, 1.5, -16);
        addLight(campGlow2);

        var wheelGlow = new THREE.PointLight(0xA0522D, 0.4, 12);
        wheelGlow.position.set(12, 5, -12);
        addLight(wheelGlow);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildGroundFloor();
        buildTrees();
        buildIronDeposits();
        buildForgeRuins();
        buildWaterWheel();
        buildMineShafts();
        buildDefenses();
        buildCampSites();
        setupLighting();
    }

    function update(delta) {
        if (waterWheelGroup !== null) {
            waterWheelGroup.rotation.z += 0.4 * delta;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        waterWheelGroup = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
