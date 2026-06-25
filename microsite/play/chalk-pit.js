window.ChalkPit = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var excavatorArm = null;
    var dustClouds = [];
    var conveyorSpheres = [];

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

    function buildPitFloor() {
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
        var tileGeo = new THREE.BoxGeometry(40, 1, 40);

        for (var ix = -2; ix <= 2; ix++) {
            for (var iz = -2; iz <= 2; iz++) {
                var tx = ix * 40;
                var tz = iz * 40;
                addMesh(tileGeo, whiteMat, tx, -5, tz);
            }
        }
    }

    function buildChalkWalls() {
        var creamMat = new THREE.MeshLambertMaterial({ color: 0xDDDDCC });
        var boxGeo = new THREE.BoxGeometry(40, 10, 3);

        for (var ty = 0; ty < 10; ty += 5) {
            addMesh(boxGeo, creamMat, -100, ty, 0);
            addMesh(boxGeo, creamMat, 100, ty, 0);
            addMesh(boxGeo, creamMat, 0, ty, -100);
            addMesh(boxGeo, creamMat, 0, ty, 100);
        }

        var stepGeo = new THREE.BoxGeometry(8, 5, 8);
        var positions = [
            [-80, 2, -80], [-80, 7, -80], [-80, 2, 80], [-80, 7, 80],
            [80, 2, -80], [80, 7, -80], [80, 2, 80], [80, 7, 80],
            [-40, 2, -90], [-40, 7, -90], [40, 2, -90], [40, 7, -90],
            [-40, 2, 90], [-40, 7, 90], [40, 2, 90], [40, 7, 90]
        ];

        for (var i = 0; i < positions.length; i++) {
            addMesh(stepGeo, creamMat, positions[i][0], positions[i][1], positions[i][2]);
        }
    }

    function buildExcavator() {
        var yellowMat = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var cabGeo = new THREE.BoxGeometry(8, 8, 8);
        addMesh(cabGeo, yellowMat, 0, 3, 0);

        var wheelGeo = new THREE.CylinderGeometry(3, 3, 2, 12);
        addMesh(wheelGeo, darkMat, -5, 1, -5);
        addMesh(wheelGeo, darkMat, 5, 1, -5);
        addMesh(wheelGeo, darkMat, -5, 1, 5);
        addMesh(wheelGeo, darkMat, 5, 1, 5);

        var boomGeo = new THREE.BoxGeometry(3, 2, 20);
        excavatorArm = addMesh(boomGeo, yellowMat, 0, 8, 0);
        excavatorArm.rotation.z = 0.3;
        excavatorArm.armRotation = 0;

        var bucketGeo = new THREE.BoxGeometry(6, 5, 5);
        addMesh(bucketGeo, yellowMat, 15, 12, 0);
    }

    function buildConveyorSystem() {
        var beltMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var rollerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var belt1Geo = new THREE.BoxGeometry(30, 2, 3);
        addMesh(belt1Geo, beltMat, -20, 5, 30);

        var belt2Geo = new THREE.BoxGeometry(35, 2, 3);
        addMesh(belt2Geo, beltMat, 0, 12, 50);

        var belt3Geo = new THREE.BoxGeometry(30, 2, 3);
        addMesh(belt3Geo, beltMat, 25, 18, 70);

        var rollerGeo = new THREE.CylinderGeometry(1.5, 1.5, 30, 8);
        for (var i = 0; i < 6; i++) {
            addMesh(rollerGeo, rollerMat, -20 + (i * 12), 5.5, 30);
            addMesh(rollerGeo, rollerMat, i * 12, 12.5, 50);
            addMesh(rollerGeo, rollerMat, 25 + (i * 10), 18.5, 70);
        }

        for (var j = 0; j < 15; j++) {
            var sphereGeo = new THREE.SphereGeometry(0.4, 6, 6);
            var whiteMat = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
            var sphere = addMesh(sphereGeo, whiteMat, -30 + (j * 4), 6.5, 30);
            conveyorSpheres.push(sphere);
        }
    }

    function buildChalkPiles() {
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
        var sphereGeo = new THREE.SphereGeometry(3, 8, 8);

        var pilePositions = [
            [-50, 0, -30], [-30, 0, -40], [-10, 0, -25], [20, 0, -50],
            [50, 0, -40], [60, 0, 0], [50, 0, 40], [20, 0, 50],
            [-20, 0, 60], [-50, 0, 50], [-60, 0, 20], [-40, 0, 5],
            [0, 0, 30], [-15, 0, 15], [35, 0, 15]
        ];

        for (var i = 0; i < pilePositions.length; i++) {
            addMesh(sphereGeo, whiteMat, pilePositions[i][0], pilePositions[i][1], pilePositions[i][2]);
        }
    }

    function buildMilitaryStorage() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x888877 });

        var building1Geo = new THREE.BoxGeometry(20, 12, 15);
        addMesh(building1Geo, concreteMat, -70, 2, -60);

        var building2Geo = new THREE.BoxGeometry(25, 10, 12);
        addMesh(building2Geo, concreteMat, 75, 2, 65);

        var crateGeo = new THREE.BoxGeometry(4, 4, 4);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x664422 });

        var cratePositions = [
            [-75, 1, -55], [-65, 1, -55], [-70, 5, -55], [-70, 9, -55],
            [-75, 1, -60], [-65, 1, -60], [-70, 5, -60], [-70, 9, -60],
            [70, 1, 60], [80, 1, 60], [75, 5, 65], [75, 9, 70],
            [65, 1, 70], [80, 1, 70], [70, 5, 60]
        ];

        for (var i = 0; i < cratePositions.length; i++) {
            addMesh(crateGeo, crateMat, cratePositions[i][0], cratePositions[i][1], cratePositions[i][2]);
        }
    }

    function buildAccessRamps() {
        var rampMat = new THREE.MeshLambertMaterial({ color: 0x999999 });

        var ramp1Geo = new THREE.BoxGeometry(12, 2, 30);
        var ramp1 = addMesh(ramp1Geo, rampMat, -70, 0, -40);
        ramp1.rotation.z = 0.4;

        var ramp2Geo = new THREE.BoxGeometry(12, 2, 30);
        var ramp2 = addMesh(ramp2Geo, rampMat, 70, 0, 40);
        ramp2.rotation.z = -0.4;

        var switch1Geo = new THREE.BoxGeometry(12, 2, 30);
        var switch1 = addMesh(switch1Geo, rampMat, -50, 8, 20);
        switch1.rotation.z = -0.35;

        var switch2Geo = new THREE.BoxGeometry(12, 2, 30);
        var switch2 = addMesh(switch2Geo, rampMat, 50, 8, -20);
        switch2.rotation.z = 0.35;
    }

    function buildDustClouds() {
        var dustMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.4 });
        var dustGeo = new THREE.SphereGeometry(1.5, 4, 4);

        var dustPositions = [
            [0, 8, 0], [10, 10, 10], [-15, 12, -15], [25, 9, 5], [-30, 11, 20],
            [35, 8, -25], [-40, 10, -35], [15, 13, 40], [-25, 9, 35], [45, 11, 15],
            [-35, 12, 5], [20, 8, -40], [-20, 10, 15], [30, 9, 30], [-45, 11, -20],
            [40, 10, -15], [-10, 12, 45], [5, 8, -30], [-50, 9, 10], [50, 11, -10],
            [0, 13, 25], [15, 8, 15], [-35, 10, 25], [25, 12, -20], [-15, 9, -45],
            [35, 8, 20], [-25, 11, 40], [10, 10, -35], [-40, 9, 15], [45, 12, 5],
            [-20, 8, -25], [20, 10, 35], [30, 11, -40], [-30, 9, 30], [15, 12, -15],
            [-45, 10, -5], [40, 8, 40], [5, 11, 10], [-50, 9, -30], [50, 10, 25]
        ];

        for (var i = 0; i < dustPositions.length; i++) {
            var dust = addMesh(dustGeo, dustMat, dustPositions[i][0], dustPositions[i][1], dustPositions[i][2]);
            dust.dustVelocity = [Math.random() * 0.3 - 0.15, 0, Math.random() * 0.3 - 0.15];
            dustClouds.push(dust);
        }
    }

    function setupLighting() {
        var sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
        sunLight.position.set(50, 80, 50);
        sunLight.castShadow = true;
        addLight(sunLight);

        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        addLight(ambientLight);

        var workLight1 = new THREE.PointLight(0xFFFFFF, 1.0, 150);
        workLight1.position.set(-40, 20, -40);
        addLight(workLight1);

        var workLight2 = new THREE.PointLight(0xFFFFFF, 1.0, 150);
        workLight2.position.set(40, 20, 40);
        addLight(workLight2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dustClouds = [];
        conveyorSpheres = [];

        buildPitFloor();
        buildChalkWalls();
        buildExcavator();
        buildConveyorSystem();
        buildChalkPiles();
        buildMilitaryStorage();
        buildAccessRamps();
        buildDustClouds();
        setupLighting();
    }

    function update(delta) {
        if (excavatorArm) {
            excavatorArm.armRotation = (excavatorArm.armRotation || 0) + 0.2 * delta;
            excavatorArm.rotation.z = 0.3 + Math.sin(excavatorArm.armRotation) * 0.5;
        }

        for (var i = 0; i < dustClouds.length; i++) {
            var dust = dustClouds[i];
            if (dust && dust.dustVelocity) {
                dust.position.x += dust.dustVelocity[0] * 0.5 * delta;
                dust.position.z += dust.dustVelocity[2] * 0.5 * delta;

                if (dust.position.x > 60) dust.position.x = -60;
                if (dust.position.x < -60) dust.position.x = 60;
                if (dust.position.z > 80) dust.position.z = -80;
                if (dust.position.z < -80) dust.position.z = 80;
            }
        }

        for (var j = 0; j < conveyorSpheres.length; j++) {
            var sphere = conveyorSpheres[j];
            if (sphere) {
                sphere.position.x -= 0.4 * delta;
                if (sphere.position.x < -50) {
                    sphere.position.x = 10;
                }
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
        dustClouds = [];
        conveyorSpheres = [];
        excavatorArm = null;
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
