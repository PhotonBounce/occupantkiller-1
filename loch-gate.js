window.LochGate = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var fogSpheres = [];
    var rippleSpheres = [];
    var time = 0;

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

    function buildLochSurface() {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A2A3A });
        var tileSize = 5;
        var tilesX = 11;
        var tilesY = 9;
        var startX = -tilesX * tileSize / 2;
        var startY = -tilesY * tileSize / 2;

        for (var x = 0; x < tilesX; x++) {
            for (var y = 0; y < tilesY; y++) {
                var posX = startX + x * tileSize + tileSize / 2;
                var posY = 0;
                var posZ = startY + y * tileSize + tileSize / 2;
                var geo = new THREE.BoxGeometry(tileSize, 0.5, tileSize);
                addMesh(geo, waterMat, posX, posY, posZ);
            }
        }

        var rippleMat = new THREE.MeshLambertMaterial({ color: 0x2A4A5A });
        for (var i = 0; i < 15; i++) {
            var rx = (Math.random() - 0.5) * 50;
            var rz = (Math.random() - 0.5) * 40;
            var rippleGeo = new THREE.SphereGeometry(2, 4, 4);
            var ripple = addMesh(rippleGeo, rippleMat, rx, 0.5, rz);
            ripple.scale.set(1, 0.3, 1);
            rippleSpheres.push({
                mesh: ripple,
                baseY: 0.5,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }

    function buildIslandBase() {
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
        var layer1Geo = new THREE.BoxGeometry(20, 1.5, 20);
        addMesh(layer1Geo, rockMat, 0, 1, 0);

        var layer2Geo = new THREE.BoxGeometry(16, 1.5, 16);
        addMesh(layer2Geo, rockMat, 0, 2.7, 0);

        var layer3Geo = new THREE.BoxGeometry(12, 1.5, 12);
        addMesh(layer3Geo, rockMat, 0, 4.4, 0);

        var cornerRocks = [
            {x: -8, z: -8}, {x: 8, z: -8},
            {x: -8, z: 8}, {x: 8, z: 8}
        ];
        for (var i = 0; i < cornerRocks.length; i++) {
            var rockGeo = new THREE.SphereGeometry(2, 4, 4);
            addMesh(rockGeo, rockMat, cornerRocks[i].x, 3.5, cornerRocks[i].z);
        }
    }

    function buildCauseway() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
        var segmentLength = 6;
        var numSegments = 6;
        var totalLength = segmentLength * numSegments;
        var startX = -totalLength / 2;

        for (var i = 0; i < numSegments; i++) {
            var segX = startX + i * segmentLength + segmentLength / 2;
            var segGeo = new THREE.BoxGeometry(segmentLength, 1.2, 3);
            addMesh(segGeo, stoneMat, segX, 0.8, 0);

            var pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 6);
            addMesh(pillarGeo, stoneMat, segX - segmentLength / 2, -0.5, -2);
            addMesh(pillarGeo, stoneMat, segX - segmentLength / 2, -0.5, 2);
        }
    }

    function buildCastleKeep() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
        var keepGeo = new THREE.BoxGeometry(10, 20, 10);
        var keep = addMesh(keepGeo, stoneMat, 0, 14.5, 0);

        var battlementGeo = new THREE.ConeGeometry(6, 4, 8);
        addMesh(battlementGeo, stoneMat, 0, 24, 0);

        var turretPos = [
            {x: -5, z: -5}, {x: 5, z: -5},
            {x: -5, z: 5}, {x: 5, z: 5}
        ];
        for (var i = 0; i < turretPos.length; i++) {
            var turretGeo = new THREE.CylinderGeometry(1.2, 1.2, 15, 8);
            addMesh(turretGeo, stoneMat, turretPos[i].x, 17, turretPos[i].z);

            var capGeo = new THREE.ConeGeometry(1.5, 2, 8);
            addMesh(capGeo, stoneMat, turretPos[i].x, 25, turretPos[i].z);
        }
    }

    function buildShoreline() {
        var shoreMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
        var shorePositions = [
            {x: -28, z: -22}, {x: -25, z: -24}, {x: -26, z: -20},
            {x: 28, z: -22}, {x: 26, z: -24}, {x: 27, z: -20},
            {x: -28, z: 22}, {x: -25, z: 24}, {x: -26, z: 20},
            {x: 28, z: 22}, {x: 26, z: 24}, {x: 27, z: 20}
        ];

        for (var i = 0; i < shorePositions.length; i++) {
            if (i % 2 === 0) {
                var rockGeo = new THREE.BoxGeometry(3, 2.5, 3);
                addMesh(rockGeo, shoreMat, shorePositions[i].x, 1.2, shorePositions[i].z);
            } else {
                var sphereGeo = new THREE.SphereGeometry(2, 4, 4);
                addMesh(sphereGeo, shoreMat, shorePositions[i].x, 1, shorePositions[i].z);
            }
        }
    }

    function buildBoathouses() {
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        var boathousePos = [
            {x: -20, z: -18},
            {x: 20, z: -18}
        ];

        for (var i = 0; i < boathousePos.length; i++) {
            var roofGeo = new THREE.BoxGeometry(8, 3, 6);
            addMesh(roofGeo, woodMat, boathousePos[i].x, 4, boathousePos[i].z);

            var wallGeo = new THREE.BoxGeometry(8, 3.5, 6);
            addMesh(wallGeo, woodMat, boathousePos[i].x, 1.8, boathousePos[i].z);

            var boatGeo = new THREE.BoxGeometry(5, 1.5, 2);
            addMesh(boatGeo, woodMat, boathousePos[i].x, 1, boathousePos[i].z);
        }
    }

    function buildWatchTowers() {
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x665555 });
        var towerPos = [
            {x: -22, z: 20},
            {x: 22, z: 20}
        ];

        for (var i = 0; i < towerPos.length; i++) {
            var towerGeo = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
            addMesh(towerGeo, towerMat, towerPos[i].x, 10, towerPos[i].z);

            var platformGeo = new THREE.BoxGeometry(6, 1.2, 6);
            addMesh(platformGeo, towerMat, towerPos[i].x, 18, towerPos[i].z);

            var railPost1Geo = new THREE.CylinderGeometry(0.3, 0.3, 3, 4);
            addMesh(railPost1Geo, towerMat, towerPos[i].x - 2.5, 18.5, towerPos[i].z - 2.5);
            addMesh(railPost1Geo, towerMat, towerPos[i].x + 2.5, 18.5, towerPos[i].z - 2.5);
            addMesh(railPost1Geo, towerMat, towerPos[i].x - 2.5, 18.5, towerPos[i].z + 2.5);
            addMesh(railPost1Geo, towerMat, towerPos[i].x + 2.5, 18.5, towerPos[i].z + 2.5);
        }
    }

    function buildFogMist() {
        var fogMat = new THREE.MeshLambertMaterial({ color: 0x889988, transparent: true, opacity: 0.4 });

        var fogClusters = [
            {x: -15, z: -15, count: 6},
            {x: 15, z: -15, count: 5},
            {x: -15, z: 15, count: 5},
            {x: 15, z: 15, count: 6},
            {x: 0, z: 0, count: 8},
            {x: -25, z: 0, count: 4},
            {x: 25, z: 0, count: 4},
            {x: 0, z: -25, count: 4},
            {x: 0, z: 25, count: 4}
        ];

        for (var c = 0; c < fogClusters.length; c++) {
            var cluster = fogClusters[c];
            for (var f = 0; f < cluster.count; f++) {
                var offsetX = (Math.random() - 0.5) * 6;
                var offsetZ = (Math.random() - 0.5) * 6;
                var radius = 0.8 + Math.random() * 0.6;
                var fogGeo = new THREE.SphereGeometry(radius, 4, 4);
                var fog = addMesh(fogGeo, fogMat, cluster.x + offsetX, 1.5, cluster.z + offsetZ);
                fogSpheres.push({
                    mesh: fog,
                    baseX: cluster.x + offsetX,
                    baseZ: cluster.z + offsetZ,
                    speed: 0.03 + Math.random() * 0.05,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x334455, 0.5);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xCCCCDD, 0.6);
        directionalLight.position.set(20, 30, -20);
        addLight(directionalLight);

        var keepLight1 = new THREE.PointLight(0xFFDD88, 0.8, 30);
        keepLight1.position.set(-3, 20, -3);
        addLight(keepLight1);

        var keepLight2 = new THREE.PointLight(0xFFDD88, 0.8, 30);
        keepLight2.position.set(3, 20, 3);
        addLight(keepLight2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        fogSpheres = [];
        rippleSpheres = [];
        time = 0;

        buildLochSurface();
        buildIslandBase();
        buildCauseway();
        buildCastleKeep();
        buildShoreline();
        buildBoathouses();
        buildWatchTowers();
        buildFogMist();
        setupLighting();
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < fogSpheres.length; i++) {
            var fog = fogSpheres[i];
            var driftX = Math.sin(time * fog.speed + fog.phase) * 0.25 * delta;
            fog.mesh.position.x += driftX;
        }

        for (var i = 0; i < rippleSpheres.length; i++) {
            var ripple = rippleSpheres[i];
            var newY = ripple.baseY + Math.sin(time * ripple.speed + ripple.phase) * 0.4;
            ripple.mesh.position.y = newY;
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
        fogSpheres = [];
        rippleSpheres = [];
        scene = null;
        camera = null;
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
