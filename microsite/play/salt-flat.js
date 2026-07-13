window.SaltFlat = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var radarDish = null;

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

    function buildFloor() {
        var floorMat = new THREE.MeshLambertMaterial({ color: 0xFFFAF0 });
        var crackMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var tileSize = 10;
        var gridCount = 12;
        var startX = -(gridCount * tileSize) / 2;
        var startZ = -(gridCount * tileSize) / 2;

        for (var x = 0; x < gridCount; x++) {
            for (var z = 0; z < gridCount; z++) {
                var posX = startX + x * tileSize;
                var posZ = startZ + z * tileSize;
                var floorGeo = new THREE.BoxGeometry(tileSize - 0.1, 0.3, tileSize - 0.1);
                addMesh(floorGeo, floorMat, posX, 0, posZ);

                var crackGeo = new THREE.BoxGeometry(tileSize - 0.05, 0.32, 0.15);
                addMesh(crackGeo, crackMat, posX, 0.01, posZ);
                var crackGeo2 = new THREE.BoxGeometry(0.15, 0.32, tileSize - 0.05);
                addMesh(crackGeo2, crackMat, posX, 0.01, posZ);
            }
        }
    }

    function buildSaltCrusts() {
        var crustMat = new THREE.MeshLambertMaterial({ color: 0xFFFFF5 });
        var positions = [
            [15, 0.5, 20], [-18, 0.4, 15], [25, 0.6, -10], [-22, 0.5, -18],
            [8, 0.45, 25], [-12, 0.55, 22], [30, 0.48, 5], [-28, 0.52, -8],
            [5, 0.42, -25], [-35, 0.6, 10], [20, 0.5, -20], [-15, 0.48, -12],
            [35, 0.55, 15], [-30, 0.45, 25], [12, 0.5, -30], [-20, 0.52, 28],
            [28, 0.48, 22], [-25, 0.55, -22], [18, 0.5, 18], [-10, 0.48, -28],
            [32, 0.52, -15], [-32, 0.5, 0]
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var cluster1 = new THREE.SphereGeometry(1.2, 6, 6);
            addMesh(cluster1, crustMat, pos[0], pos[1], pos[2]);
            var cluster2 = new THREE.SphereGeometry(0.9, 6, 6);
            addMesh(cluster2, crustMat, pos[0] + 0.8, pos[1] + 0.5, pos[2]);
            var cluster3 = new THREE.SphereGeometry(1.0, 6, 6);
            addMesh(cluster3, crustMat, pos[0] - 0.9, pos[1] + 0.4, pos[2] + 0.7);
        }
    }

    function buildAbandonedBase() {
        var postMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var wireMat = new THREE.LineBasicMaterial({ color: 0x303030, linewidth: 2 });

        var baseSize = 40;
        var postRadius = 0.4;
        var postHeight = 3;

        var corners = [
            [-baseSize / 2, -baseSize / 2],
            [baseSize / 2, -baseSize / 2],
            [baseSize / 2, baseSize / 2],
            [-baseSize / 2, baseSize / 2]
        ];

        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];
            var postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
            addMesh(postGeo, postMat, corner[0], postHeight / 2, corner[1]);

            var towerGeo = new THREE.BoxGeometry(3, 8, 3);
            addMesh(towerGeo, postMat, corner[0], 5.5, corner[1]);

            var roofGeo = new THREE.ConeGeometry(2.5, 2, 8);
            addMesh(roofGeo, postMat, corner[0], 10.5, corner[1]);
        }

        for (var j = 0; j < 4; j++) {
            var corner1 = corners[j];
            var corner2 = corners[(j + 1) % 4];
            var segments = 8;
            for (var k = 0; k <= segments; k++) {
                var t = k / segments;
                var x = corner1[0] * (1 - t) + corner2[0] * t;
                var z = corner1[1] * (1 - t) + corner2[1] * t;
                var postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
                addMesh(postGeo, postMat, x, postHeight / 2, z);
            }
        }
    }

    function buildRadarDish() {
        var diskMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var mountMat = new THREE.MeshLambertMaterial({ color: 0x505050 });

        var mountGeo = new THREE.CylinderGeometry(1.5, 2, 3, 8);
        var mount = addMesh(mountGeo, mountMat, 0, 2, 0);

        var pivotGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        addMesh(pivotGeo, mountMat, 0, 5, 0);

        var dishGeo = new THREE.CylinderGeometry(6, 6, 0.5, 12);
        radarDish = addMesh(dishGeo, diskMat, 0, 6, 0);
        radarDish.rotation.x = Math.PI / 6;

        var boomGeo = new THREE.BoxGeometry(0.4, 0.4, 8);
        addMesh(boomGeo, mountMat, 0, 6, 4);

        var armGeo = new THREE.BoxGeometry(0.3, 0.3, 6);
        addMesh(armGeo, mountMat, 3, 6, 0);
        addMesh(armGeo, mountMat, -3, 6, 0);
    }

    function buildRustedVehicles() {
        var rustMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var vehicles = [
            [-25, 0.8, -15], [15, 0.8, 20], [-35, 0.8, 5],
            [28, 0.8, -25], [10, 0.8, -15], [-18, 0.8, 28]
        ];

        for (var v = 0; v < vehicles.length; v++) {
            var pos = vehicles[v];
            var chassisGeo = new THREE.BoxGeometry(2.5, 1.5, 5);
            addMesh(chassisGeo, rustMat, pos[0], pos[1], pos[2]);

            var cabinGeo = new THREE.BoxGeometry(2, 1.8, 2);
            addMesh(cabinGeo, rustMat, pos[0], pos[1] + 1.2, pos[2] - 1);

            for (var w = 0; w < 4; w++) {
                var wx = (w < 2 ? -1.2 : 1.2);
                var wz = (w % 2 === 0 ? -1.8 : 1.8);
                var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
                addMesh(wheelGeo, wheelMat, pos[0] + wx, pos[1] + 0.6, pos[2] + wz);
            }
        }
    }

    function buildSaltPillars() {
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0xFFFAF0 });

        var pillars = [
            [30, 0, -30, 7], [-30, 0, 30, 6], [35, 0, 15, 8],
            [-35, 0, -20, 5.5], [20, 0, 35, 9], [-28, 0, -35, 6.5],
            [25, 0, -20, 7.5], [-32, 0, 25, 8.5]
        ];

        for (var p = 0; p < pillars.length; p++) {
            var pil = pillars[p];
            var pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, pil[3], 8);
            addMesh(pillarGeo, pillarMat, pil[0], pil[3] / 2, pil[1]);
        }
    }

    function buildRunway() {
        var runwayMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var markingMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

        var runwayGeo = new THREE.BoxGeometry(25, 0.4, 80);
        addMesh(runwayGeo, runwayMat, 0, 0.2, 0);

        for (var m = 0; m < 16; m++) {
            var markGeo = new THREE.BoxGeometry(3, 0.42, 2);
            addMesh(markGeo, markingMat, -8, 0.25, -35 + m * 5);
            addMesh(markGeo, markingMat, 8, 0.25, -35 + m * 5);
        }

        var edgeGeo = new THREE.BoxGeometry(0.5, 0.42, 80);
        addMesh(edgeGeo, markingMat, -12.5, 0.25, 0);
        addMesh(edgeGeo, markingMat, 12.5, 0.25, 0);
    }

    function buildCommandBuilding() {
        var buildMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var antennaMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var dishMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });

        var mainGeo = new THREE.BoxGeometry(20, 5, 10);
        addMesh(mainGeo, buildMat, 0, 2.5, -35);

        var baseGeo = new THREE.BoxGeometry(0.6, 4, 15);
        addMesh(baseGeo, antennaMat, -7, 3.5, -35);
        addMesh(baseGeo, antennaMat, 7, 3.5, -35);

        var antennaGeo = new THREE.CylinderGeometry(0.15, 0.15, 12, 6);
        addMesh(antennaGeo, antennaMat, -8, 10, -35);
        addMesh(antennaGeo, antennaMat, 8, 10, -35);
        addMesh(antennaGeo, antennaMat, -10, 8, -35);
        addMesh(antennaGeo, antennaMat, 10, 8, -35);

        var satellitePositions = [
            [-6, 6.5, -42], [6, 6.5, -42],
            [-6, 6.5, -28], [6, 6.5, -28]
        ];

        for (var s = 0; s < satellitePositions.length; s++) {
            var satPos = satellitePositions[s];
            var dishGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 12);
            addMesh(dishGeo, dishMat, satPos[0], satPos[1], satPos[2]);
            var armGeo = new THREE.BoxGeometry(0.3, 0.3, 2);
            addMesh(armGeo, antennaMat, satPos[0], satPos[1] + 1, satPos[2]);
        }
    }

    function setupLighting() {
        var sunLight = new THREE.DirectionalLight(0xFFE5B4, 1.2);
        sunLight.position.set(100, 80, 50);
        sunLight.castShadow = true;
        addLight(sunLight);

        var ambientLight = new THREE.AmbientLight(0xFFF8DC, 0.8);
        addLight(ambientLight);

        var searchLight1 = new THREE.PointLight(0xFFFFFF, 0.8, 100);
        searchLight1.position.set(-30, 15, 30);
        addLight(searchLight1);

        var searchLight2 = new THREE.PointLight(0xFFFFFF, 0.8, 100);
        searchLight2.position.set(30, 15, -30);
        addLight(searchLight2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        radarDish = null;

        buildFloor();
        buildSaltCrusts();
        buildAbandonedBase();
        buildRadarDish();
        buildRustedVehicles();
        buildSaltPillars();
        buildRunway();
        buildCommandBuilding();
        setupLighting();
    }

    function update(delta) {
        if (radarDish) {
            radarDish.rotation.y += 0.3 * delta;
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
        radarDish = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
