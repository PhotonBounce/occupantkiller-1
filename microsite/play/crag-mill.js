window.CragMill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var sailGroup = null;
    var signalLight = null;

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

    function buildCragBase() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x332211 });

        var baseGeo1 = new THREE.BoxGeometry(30, 2, 30);
        addMesh(baseGeo1, stoneMat, 0, 8, 0);

        var baseGeo2 = new THREE.BoxGeometry(28, 2, 28);
        addMesh(baseGeo2, stoneMat, 0, 10, 0);

        var baseGeo3 = new THREE.BoxGeometry(26, 2, 26);
        addMesh(baseGeo3, stoneMat, 0, 12, 0);

        var baseGeo4 = new THREE.BoxGeometry(24, 1, 24);
        addMesh(baseGeo4, stoneMat, 0, 13.5, 0);

        var corePositions = [
            [-12, 9, -12], [0, 9, -12], [12, 9, -12],
            [-12, 9, 0], [0, 9, 0], [12, 9, 0],
            [-12, 9, 12], [0, 9, 12], [12, 9, 12],
            [-12, 11, -12], [0, 11, -12], [12, 11, -12],
            [-12, 11, 0], [12, 11, 0], [-12, 11, 12], [12, 11, 12]
        ];

        for (var i = 0; i < corePositions.length; i++) {
            var coreGeo = new THREE.BoxGeometry(2, 1, 2);
            addMesh(coreGeo, darkMat, corePositions[i][0], corePositions[i][1], corePositions[i][2]);
        }
    }

    function buildRockFormations() {
        var darkRock = new THREE.MeshLambertMaterial({ color: 0x443322 });
        var lightRock = new THREE.MeshLambertMaterial({ color: 0x666555 });
        var positions = [
            [-12, 15, -12], [-8, 18, -14], [-4, 16, -13],
            [4, 17, -12], [8, 19, -15], [12, 16, -11],
            [-14, 14, 0], [-12, 17, 2], [-10, 15, -2],
            [10, 16, 2], [12, 18, 0], [14, 15, -1],
            [-12, 16, 12], [-8, 17, 14], [-4, 15, 13],
            [4, 18, 12], [8, 16, 15], [12, 17, 11],
            [-6, 15, -10], [6, 16, -9], [-10, 16, 6],
            [10, 17, 8], [-8, 14, 8], [8, 15, -8],
            [-15, 13, -5], [15, 14, 5], [0, 16, -15],
            [0, 15, 15], [-13, 15, 10], [13, 16, -10]
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var h = 2 + (i % 3) * 1.5;
            var rockGeo = new THREE.BoxGeometry(1.5, h, 1.5);
            var mat = (i % 2 === 0) ? darkRock : lightRock;
            addMesh(rockGeo, mat, pos[0], pos[1], pos[2]);
        }
    }

    function buildMillTower() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var towerGeo = new THREE.CylinderGeometry(3, 3, 18, 12);
        addMesh(towerGeo, stoneMat, 0, 13, 0);

        var capGeo = new THREE.ConeGeometry(3.2, 2, 12);
        addMesh(capGeo, stoneMat, 0, 23, 0);

        var windowGeo = new THREE.BoxGeometry(0.4, 1.2, 0.3);
        addMesh(windowGeo, windowMat, 2.8, 20, 0);
        addMesh(windowGeo, windowMat, -2.8, 20, 0);
        addMesh(windowGeo, windowMat, 0, 20, 2.8);
        addMesh(windowGeo, windowMat, 0, 20, -2.8);
    }

    function buildSailBlade() {
        var sailMat = new THREE.MeshLambertMaterial({ color: 0xE8D4C0 });
        var axleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        sailGroup = new THREE.Group();
        scene.add(sailGroup);

        var axleGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var axleMesh = new THREE.Mesh(axleGeo, axleMat);
        axleMesh.rotation.z = Math.PI / 2;
        sailGroup.add(axleMesh);

        var positions = [
            [3, 0, 0], [-3, 0, 0], [0, 3, 0], [0, -3, 0]
        ];

        for (var i = 0; i < positions.length; i++) {
            var bladeGeo = new THREE.BoxGeometry(0.5, 4.5, 0.3);
            var blade = new THREE.Mesh(bladeGeo, sailMat);
            blade.position.set(positions[i][0], positions[i][1], positions[i][2]);
            sailGroup.add(blade);
        }

        sailGroup.position.set(0, 16, 0);
    }

    function buildFortWalls() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
        var crenelMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x554433 });

        var wallGeo = new THREE.BoxGeometry(22, 4, 0.8);
        addMesh(wallGeo, wallMat, 0, 15, -11);
        addMesh(wallGeo, wallMat, 0, 15, 11);

        var wallGeo2 = new THREE.BoxGeometry(0.8, 4, 22);
        addMesh(wallGeo2, wallMat, -11, 15, 0);
        addMesh(wallGeo2, wallMat, 11, 15, 0);

        var crenelPositions = [
            [-10, 17, -11], [-5, 17, -11], [0, 17, -11], [5, 17, -11], [10, 17, -11],
            [-10, 17, 11], [-5, 17, 11], [0, 17, 11], [5, 17, 11], [10, 17, 11],
            [-11, 17, -10], [-11, 17, -5], [-11, 17, 0], [-11, 17, 5], [-11, 17, 10],
            [11, 17, -10], [11, 17, -5], [11, 17, 0], [11, 17, 5], [11, 17, 10]
        ];

        for (var i = 0; i < crenelPositions.length; i++) {
            var crenelGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
            addMesh(crenelGeo, crenelMat, crenelPositions[i][0], crenelPositions[i][1], crenelPositions[i][2]);
        }

        var buttressPositions = [
            [-9, 14, -10], [-3, 14, -10], [3, 14, -10], [9, 14, -10],
            [-9, 14, 10], [-3, 14, 10], [3, 14, 10], [9, 14, 10],
            [-10, 14, -9], [-10, 14, -3], [-10, 14, 3], [-10, 14, 9],
            [10, 14, -9], [10, 14, -3], [10, 14, 3], [10, 14, 9]
        ];

        for (var i = 0; i < buttressPositions.length; i++) {
            var buttressGeo = new THREE.BoxGeometry(0.5, 3, 0.5);
            addMesh(buttressGeo, stoneMat, buttressPositions[i][0], buttressPositions[i][1], buttressPositions[i][2]);
        }
    }

    function buildSignalStation() {
        var roomMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        var roomGeo = new THREE.BoxGeometry(4, 3, 4);
        addMesh(roomGeo, roomMat, 0, 19, 0);

        var armPositions = [
            [2.5, 19.5, 0, 0, 0, 0],
            [-2.5, 19.5, 0, 0, 0, 0],
            [0, 19.5, 2.5, 0, 0, 0],
            [0, 19.5, -2.5, 0, 0, 0]
        ];

        for (var i = 0; i < armPositions.length; i++) {
            var arm = new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(armPositions[i][0], armPositions[i][1], armPositions[i][2]),
                    new THREE.Vector3(armPositions[i][0] * 1.5, armPositions[i][1] + 2, armPositions[i][2] * 1.5)
                ]),
                new THREE.LineBasicMaterial({ color: 0xFFFF00 })
            );
            scene.add(arm);
            objects.push(arm);
        }
    }

    function buildCliffPath() {
        var pathMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
        var railMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        var stepPositions = [
            [0, 8, 0], [0.5, 9, 0.5], [1, 10, 1], [1.5, 11, 1.5],
            [2, 12, 2], [1.5, 13, 2.5], [0.5, 14, 3],
            [-0.5, 13, 3.5], [-1, 12, 4], [-1.5, 11, 4.5],
            [-2, 10, 5], [-2.5, 9, 5.5], [-3, 8, 6]
        ];

        for (var i = 0; i < stepPositions.length; i++) {
            var stepGeo = new THREE.BoxGeometry(1.2, 0.4, 1.2);
            addMesh(stepGeo, pathMat, stepPositions[i][0], stepPositions[i][1], stepPositions[i][2]);
        }

        var railPositions = [
            [-0.3, 9, 0.5], [0.8, 10, 1.2], [1.8, 11, 2],
            [2.2, 12, 2.5], [1.8, 13, 3.2], [0.8, 14, 3.8],
            [-0.8, 13, 4], [-1.5, 12, 4.5], [-2.2, 11, 5.2]
        ];

        for (var i = 0; i < railPositions.length; i++) {
            var railGeo = new THREE.BoxGeometry(0.15, 1.2, 0.15);
            addMesh(railGeo, railMat, railPositions[i][0], railPositions[i][1], railPositions[i][2]);
        }
    }

    function buildAmmoDump() {
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222200 });
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x554433 });

        var bunkerGeo = new THREE.BoxGeometry(6, 3, 4);
        addMesh(bunkerGeo, bunkerMat, -15, 11, 8);

        var roofGeo = new THREE.BoxGeometry(6.5, 0.5, 4.5);
        addMesh(roofGeo, roofMat, -15, 14.2, 8);

        var doorGeo = new THREE.BoxGeometry(1.5, 2, 0.2);
        addMesh(doorGeo, bunkerMat, -15, 12, 10.2);

        var barrelPositions = [
            [-15, 14.5, 8], [-14, 14.5, 8], [-16, 14.5, 8],
            [-15, 14.5, 9], [-14, 14.5, 9], [-16, 14.5, 9],
            [-17, 14.5, 8], [-13, 14.5, 8], [-15, 16.5, 8]
        ];

        for (var i = 0; i < barrelPositions.length; i++) {
            var barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 8);
            addMesh(barrelGeo, barrelMat, barrelPositions[i][0], barrelPositions[i][1], barrelPositions[i][2]);
        }

        var cratePositions = [
            [-15, 14, 7], [-14, 14, 7], [-13, 14, 8],
            [-16, 14, 8], [-15, 15.5, 8], [-14, 14.8, 6.5],
            [-16, 14.6, 9.5], [-17, 14.4, 7.5], [-13, 14.3, 9]
        ];

        for (var i = 0; i < cratePositions.length; i++) {
            var crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            addMesh(crateGeo, crateMat, cratePositions[i][0], cratePositions[i][1], cratePositions[i][2]);
        }

        var supportPositions = [
            [-17.5, 12.5, 7], [-17.5, 12.5, 9], [-12.5, 12.5, 7], [-12.5, 12.5, 9]
        ];

        for (var i = 0; i < supportPositions.length; i++) {
            var supportGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
            addMesh(supportGeo, bunkerMat, supportPositions[i][0], supportPositions[i][1], supportPositions[i][2]);
        }
    }

    function setupLighting() {
        var sunLight = new THREE.DirectionalLight(0xFFFFCC, 1.2);
        sunLight.position.set(15, 25, 15);
        sunLight.castShadow = true;
        addLight(sunLight);

        var skyAmb = new THREE.AmbientLight(0x87CEEB, 0.5);
        addLight(skyAmb);

        signalLight = new THREE.PointLight(0xFF6600, 0.8, 20);
        signalLight.position.set(0, 22, 0);
        addLight(signalLight);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];

        buildCragBase();
        buildRockFormations();
        buildMillTower();
        buildSailBlade();
        buildFortWalls();
        buildSignalStation();
        buildCliffPath();
        buildAmmoDump();
        setupLighting();
    }

    function update(delta) {
        if (sailGroup !== null) {
            sailGroup.rotation.y += 0.6 * delta;
        }

        if (signalLight !== null) {
            var pulse = Math.sin(Date.now() * 0.003) * 0.4 + 0.8;
            signalLight.intensity = pulse;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        if (sailGroup !== null && scene !== null) {
            scene.remove(sailGroup);
        }
        objects = [];
        lights = [];
        sailGroup = null;
        signalLight = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
