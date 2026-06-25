window.WeldYard = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var cranePosition = 0;
    var weldingArcs = [];

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

    function buildYardFloor() {
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var floorGeo = new THREE.BoxGeometry(100, 0.5, 80);
        addMesh(floorGeo, floorMaterial, 0, -0.25, 0);

        var tileSize = 10;
        var tilesX = 10;
        var tilesZ = 8;
        for (var x = 0; x < tilesX; x++) {
            for (var z = 0; z < tilesZ; z++) {
                var tileColor = ((x + z) % 2 === 0) ? 0x444444 : 0x333333;
                var tileMat = new THREE.MeshLambertMaterial({ color: tileColor });
                var tileGeo = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
                var posX = (x * tileSize) - 45;
                var posZ = (z * tileSize) - 35;
                addMesh(tileGeo, tileMat, posX, 0.05, posZ);
            }
        }

        var oilStainMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        for (var i = 0; i < 5; i++) {
            var stainGeo = new THREE.BoxGeometry(8, 0.15, 6);
            var stainX = Math.random() * 80 - 40;
            var stainZ = Math.random() * 60 - 30;
            addMesh(stainGeo, oilStainMat, stainX, 0.08, stainZ);
        }

        var shavingMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        for (var i = 0; i < 4; i++) {
            var shavingGeo = new THREE.BoxGeometry(4, 0.8, 3);
            var shavingX = Math.random() * 60 - 30;
            var shavingZ = Math.random() * 50 - 25;
            addMesh(shavingGeo, shavingMat, shavingX, 0.4, shavingZ);
        }
    }

    function buildFabricationHall() {
        var hallMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });

        var roofGeo = new THREE.BoxGeometry(80, 1, 60);
        addMesh(roofGeo, hallMaterial, 0, 12, 0);

        var wallFrontGeo = new THREE.BoxGeometry(80, 12, 1);
        addMesh(wallFrontGeo, hallMaterial, 0, 6, -30);

        var wallBackGeo = new THREE.BoxGeometry(80, 12, 1);
        addMesh(wallBackGeo, hallMaterial, 0, 6, 30);

        var wallLeftGeo = new THREE.BoxGeometry(1, 12, 60);
        addMesh(wallLeftGeo, hallMaterial, -40, 6, 0);

        var wallRightGeo = new THREE.BoxGeometry(1, 12, 60);
        addMesh(wallRightGeo, hallMaterial, 40, 6, 0);

        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var columnGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 16);
        addMesh(columnGeo, supportMaterial, -25, 6, -15);
        addMesh(columnGeo, supportMaterial, 0, 6, -15);
        addMesh(columnGeo, supportMaterial, 25, 6, -15);
        addMesh(columnGeo, supportMaterial, -25, 6, 15);
        addMesh(columnGeo, supportMaterial, 0, 6, 15);
        addMesh(columnGeo, supportMaterial, 25, 6, 15);

        var cornerBraceGeo = new THREE.BoxGeometry(2, 2, 2);
        var braceMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
        addMesh(cornerBraceGeo, braceMat, -39, 11, -29);
        addMesh(cornerBraceGeo, braceMat, 39, 11, -29);
        addMesh(cornerBraceGeo, braceMat, -39, 11, 29);
        addMesh(cornerBraceGeo, braceMat, 39, 11, 29);
    }

    function buildWeldingBays() {
        var bay1X = -25;
        var bay2X = -5;
        var bay3X = 15;
        var bay4X = 35;
        var bayZ = 0;

        for (var b = 0; b < 4; b++) {
            var bayX = [bay1X, bay2X, bay3X, bay4X][b];

            var tableMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
            var tableGeo = new THREE.BoxGeometry(8, 0.5, 6);
            addMesh(tableGeo, tableMat, bayX, 2, bayZ);

            var tankMat = new THREE.MeshLambertMaterial({ color: 0xcc6600 });
            var tankGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
            addMesh(tankGeo, tankMat, bayX + 3, 2.5, bayZ);

            var chestMat = new THREE.MeshLambertMaterial({ color: 0xaa5533 });
            var chestGeo = new THREE.BoxGeometry(2, 2.5, 1.5);
            addMesh(chestGeo, chestMat, bayX - 3.5, 1.25, bayZ);

            var partMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var partGeo = new THREE.BoxGeometry(3, 1.5, 2);
            addMesh(partGeo, partMat, bayX, 2.5, bayZ + 4);
            addMesh(partGeo, partMat, bayX, 2.5, bayZ - 4);
        }
    }

    function buildPartialVehicles() {
        var vehicle1X = -35;
        var vehicle2X = 0;
        var vehicle3X = 35;
        var vehicleZ = -15;

        for (var v = 0; v < 3; v++) {
            var vX = [vehicle1X, vehicle2X, vehicle3X][v];

            var chassisMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var chassisGeo = new THREE.BoxGeometry(6, 2, 12);
            addMesh(chassisGeo, chassisMat, vX, 2, vehicleZ);

            var jackMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var jackGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
            addMesh(jackGeo, jackMat, vX - 2, 1.5, vehicleZ - 4);
            addMesh(jackGeo, jackMat, vX + 2, 1.5, vehicleZ - 4);
            addMesh(jackGeo, jackMat, vX - 2, 1.5, vehicleZ + 4);
            addMesh(jackGeo, jackMat, vX + 2, 1.5, vehicleZ + 4);

            var frameMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
            var frameGeo = new THREE.BoxGeometry(0.1, 0.1, 12);
            addMesh(frameGeo, frameMat, vX - 2.5, 3, vehicleZ);
            addMesh(frameGeo, frameMat, vX + 2.5, 3, vehicleZ);

            var roofFrameGeo = new THREE.BoxGeometry(6, 0.1, 0.1);
            addMesh(roofFrameGeo, frameMat, vX, 4, vehicleZ - 5);
            addMesh(roofFrameGeo, frameMat, vX, 4, vehicleZ + 5);

            var turretMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
            var turretGeo = new THREE.BoxGeometry(4, 3, 4);
            addMesh(turretGeo, turretMat, vX, 4, vehicleZ);
        }
    }

    function buildOverheadCrane() {
        var beamMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var beamGeo = new THREE.BoxGeometry(70, 1, 2);
        var beam = addMesh(beamGeo, beamMat, 0, 11, 0);

        var trackMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var trackGeo = new THREE.BoxGeometry(70, 0.3, 0.5);
        addMesh(trackGeo, trackMat, 0, 11.8, -3);
        addMesh(trackGeo, trackMat, 0, 11.8, 3);

        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 1, 12);
        var wheel1 = addMesh(wheelGeo, wheelMat, -30, 11, -3);
        var wheel2 = addMesh(wheelGeo, wheelMat, 30, 11, -3);
        var wheel3 = addMesh(wheelGeo, wheelMat, -30, 11, 3);
        var wheel4 = addMesh(wheelGeo, wheelMat, 30, 11, 3);

        var cableMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
        var cablePoints = [];
        cablePoints.push(new THREE.Vector3(-2, 11, 0));
        cablePoints.push(new THREE.Vector3(-2, 8, 0));
        var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cable1 = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cable1);
        objects.push(cable1);

        var cablePoints2 = [];
        cablePoints2.push(new THREE.Vector3(2, 11, 0));
        cablePoints2.push(new THREE.Vector3(2, 8, 0));
        var cableGeo2 = new THREE.BufferGeometry().setFromPoints(cablePoints2);
        var cable2 = new THREE.LineSegments(cableGeo2, cableMat);
        scene.add(cable2);
        objects.push(cable2);

        var hookMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var hookGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        var hook = addMesh(hookGeo, hookMat, 0, 8, 0);

        beam.userData.hook = hook;
        beam.userData.wheel1 = wheel1;
        beam.userData.wheel2 = wheel2;
        beam.userData.wheel3 = wheel3;
        beam.userData.wheel4 = wheel4;
        beam.userData.cable1 = cable1;
        beam.userData.cable2 = cable2;
    }

    function buildSteelStock() {
        var plateMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        for (var s = 0; s < 10; s++) {
            var plateX = (s % 5) * 12 - 24;
            var plateZ = Math.floor(s / 5) * 10 - 5;

            var plateGeo = new THREE.BoxGeometry(10, 0.2, 8);
            var plate1 = addMesh(plateGeo, plateMat, plateX, 1, plateZ);
            var plate2 = addMesh(plateGeo, plateMat, plateX, 2.2, plateZ);
            var plate3 = addMesh(plateGeo, plateMat, plateX, 4.4, plateZ);

            var spacerMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var spacerGeo = new THREE.BoxGeometry(0.5, 0.5, 8);
            addMesh(spacerGeo, spacerMat, plateX - 4, 1.1, plateZ);
            addMesh(spacerGeo, spacerMat, plateX, 1.1, plateZ);
            addMesh(spacerGeo, spacerMat, plateX + 4, 1.1, plateZ);
        }

        var rodMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        for (var r = 0; r < 8; r++) {
            var rodX = -30 + r * 8;
            var rodZ = 15;

            var rodGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
            addMesh(rodGeo, rodMat, rodX, 3, rodZ);
        }
    }

    function buildDefensePositions() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        var positions = [
            [-30, -20],
            [30, -20],
            [-30, 20],
            [30, 20]
        ];

        for (var p = 0; p < 4; p++) {
            var posX = positions[p][0];
            var posZ = positions[p][1];

            var sandbag1Geo = new THREE.BoxGeometry(3, 1, 2);
            addMesh(sandbag1Geo, sandbagMat, posX, 1, posZ);
            addMesh(sandbag1Geo, sandbagMat, posX, 2, posZ);
            addMesh(sandbag1Geo, sandbagMat, posX, 3, posZ);

            var sandbag2Geo = new THREE.BoxGeometry(3, 1, 2);
            addMesh(sandbag2Geo, sandbagMat, posX + 2, 1, posZ);
            addMesh(sandbag2Geo, sandbagMat, posX + 2, 2, posZ);

            var sandbag3Geo = new THREE.BoxGeometry(3, 1, 2);
            addMesh(sandbag3Geo, sandbagMat, posX - 2, 1, posZ);
            addMesh(sandbag3Geo, sandbagMat, posX - 2, 2, posZ);

            var mgNestMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var mgNestGeo = new THREE.BoxGeometry(2, 0.5, 2);
            addMesh(mgNestGeo, mgNestMat, posX, 3.5, posZ);
        }

        var craterMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var craterGeo = new THREE.BoxGeometry(12, 0.8, 12);
        addMesh(craterGeo, craterMat, -50, -0.4, -35);
    }

    function buildWeldingArcs() {
        var arcMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var arcGeo = new THREE.SphereGeometry(0.3, 8, 8);

        var arcPositions = [
            [-25, 2.5, 0],
            [-5, 2.5, 0],
            [15, 2.5, 0],
            [35, 2.5, 0],
            [-25, 3, 2],
            [15, 3, -3]
        ];

        for (var a = 0; a < 6; a++) {
            var arc = addMesh(arcGeo, arcMat, arcPositions[a][0], arcPositions[a][1], arcPositions[a][2]);
            arc.userData.intensity = 1.0;
            arc.userData.phase = a * 0.5;
            weldingArcs.push(arc);
        }
    }

    function setupLighting() {
        var ambientColor = 0x5A4A2A;
        var ambientLight = new THREE.AmbientLight(ambientColor, 0.6);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        addLight(directionalLight);

        var arcColor = 0xFFFFAA;
        var arcPositions = [
            [-25, 2.5, 0],
            [-5, 2.5, 0],
            [15, 2.5, 0],
            [35, 2.5, 0],
            [-25, 3, 2],
            [15, 3, -3]
        ];

        for (var i = 0; i < 6; i++) {
            var pointLight = new THREE.PointLight(arcColor, 0.5, 20);
            pointLight.position.set(arcPositions[i][0], arcPositions[i][1], arcPositions[i][2]);
            addLight(pointLight);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        weldingArcs = [];
        cranePosition = 0;

        buildYardFloor();
        buildFabricationHall();
        buildWeldingBays();
        buildPartialVehicles();
        buildOverheadCrane();
        buildSteelStock();
        buildDefensePositions();
        buildWeldingArcs();
        setupLighting();
    }

    function update(delta) {
        cranePosition += delta * 2;
        var craneTravel = Math.sin(cranePosition) * 25;

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.userData.hook) {
                obj.position.x = craneTravel;
                obj.userData.hook.position.x = craneTravel;
                obj.userData.wheel1.position.x = craneTravel - 30;
                obj.userData.wheel2.position.x = craneTravel + 30;
                obj.userData.wheel3.position.x = craneTravel - 30;
                obj.userData.wheel4.position.x = craneTravel + 30;
                obj.userData.cable1.position.x = craneTravel - 2;
                obj.userData.cable2.position.x = craneTravel + 2;
            }
        }

        for (var w = 0; w < weldingArcs.length; w++) {
            var arc = weldingArcs[w];
            var flicker = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(cranePosition * 3 + arc.userData.phase));
            arc.userData.intensity = flicker;
        }

        if (lights.length > 0) {
            for (var l = 6; l < lights.length && l < 12; l++) {
                var arcLight = lights[l];
                if (arcLight instanceof THREE.PointLight) {
                    var arcFlicker = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(cranePosition * 3 + l * 0.4));
                    arcLight.intensity = arcFlicker;
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
        weldingArcs = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
