window.DuskCamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var fireEmbers = [];
    var duskLights = [];

    function addMesh(geometry, material, x, y, z) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addLight(light, x, y, z) {
        light.position.set(x, y, z);
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildCampsite() {
        var brownMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var darkBrownMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });

        var mainGround = new THREE.BoxGeometry(200, 2, 200);
        addMesh(mainGround, brownMat, 0, -1, 0);

        var unevenGround1 = new THREE.BoxGeometry(40, 1.5, 40);
        addMesh(unevenGround1, darkBrownMat, 30, -0.8, 50);

        var unevenGround2 = new THREE.BoxGeometry(35, 1.5, 35);
        addMesh(unevenGround2, darkBrownMat, -40, -0.8, -60);

        var unevenGround3 = new THREE.BoxGeometry(30, 1.5, 30);
        addMesh(unevenGround3, darkBrownMat, 60, -0.8, -30);

        var unevenGround4 = new THREE.BoxGeometry(25, 1.5, 45);
        addMesh(unevenGround4, darkBrownMat, -70, -0.8, 40);
    }

    function buildTents() {
        var oliveMat = new THREE.MeshLambertMaterial({ color: 0x6b8e23 });
        var khakiMat = new THREE.MeshLambertMaterial({ color: 0x9d8f6f });

        var tentRows = 8;
        var tentCols = 8;
        var spacing = 12;
        var startX = -42;
        var startZ = -42;

        for (var row = 0; row < tentRows; row++) {
            for (var col = 0; col < tentCols; col++) {
                var x = startX + col * spacing;
                var z = startZ + row * spacing;

                var roof1 = new THREE.BoxGeometry(4, 3.5, 6);
                var tent1 = addMesh(roof1, oliveMat, x - 1.5, 1.8, z);
                tent1.rotation.z = 0.3;

                var roof2 = new THREE.BoxGeometry(4, 3.5, 6);
                var tent2 = addMesh(roof2, oliveMat, x + 1.5, 1.8, z);
                tent2.rotation.z = -0.3;

                var base = new THREE.BoxGeometry(8, 0.5, 6);
                addMesh(base, khakiMat, x, 0.1, z);
            }
        }
    }

    function buildFirePits() {
        var redMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        var orangeMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        var greyMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var firePitPositions = [
            [30, 60], [-50, 30], [70, -40], [-80, -50], [40, -80], [-30, 70]
        ];

        for (var f = 0; f < firePitPositions.length; f++) {
            var fx = firePitPositions[f][0];
            var fz = firePitPositions[f][1];

            var ring = new THREE.CylinderGeometry(3, 3, 0.5, 16);
            addMesh(ring, greyMat, fx, 0.2, fz);

            for (var s = 0; s < 8; s++) {
                var ang = (s / 8) * Math.PI * 2;
                var sx = fx + Math.cos(ang) * 2.5;
                var sz = fz + Math.sin(ang) * 2.5;
                var ember = new THREE.SphereGeometry(0.4, 4, 4);
                var embMesh = addMesh(ember, redMat, sx, 1.2, sz);
                fireEmbers.push(embMesh);
            }

            var flame1 = new THREE.SphereGeometry(0.8, 6, 6);
            var flameMesh1 = addMesh(flame1, orangeMat, fx - 0.5, 1.5, fz - 0.5);
            fireEmbers.push(flameMesh1);

            var flame2 = new THREE.SphereGeometry(0.7, 6, 6);
            var flameMesh2 = addMesh(flame2, orangeMat, fx + 0.5, 1.8, fz + 0.5);
            fireEmbers.push(flameMesh2);
        }
    }

    function buildMotorPool() {
        var darkGreyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var khakiMat = new THREE.MeshLambertMaterial({ color: 0x9d8f6f });
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x000000 });

        var vehiclePositions = [
            [80, 80], [95, 80], [110, 80], [80, 95], [95, 95]
        ];

        for (var v = 0; v < vehiclePositions.length; v++) {
            var vx = vehiclePositions[v][0];
            var vz = vehiclePositions[v][1];

            var chassis = new THREE.BoxGeometry(5, 2.5, 8);
            addMesh(chassis, khakiMat, vx, 1.3, vz);

            var cabin = new THREE.BoxGeometry(3, 2, 3);
            addMesh(cabin, darkGreyMat, vx - 0.5, 2.5, vz - 2);

            for (var w = 0; w < 4; w++) {
                var wheelX = (w < 2) ? vx - 1.5 : vx + 1.5;
                var wheelZ = (w % 2 === 0) ? vz - 2.5 : vz + 2.5;
                var wheel = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8);
                addMesh(wheel, blackMat, wheelX, 0.6, wheelZ);
            }
        }
    }

    function buildSupplyLine() {
        var crateColor = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var drumColor = new THREE.MeshLambertMaterial({ color: 0xcc6600 });
        var palletColor = new THREE.MeshLambertMaterial({ color: 0x5d4037 });

        var supplyX = -90;
        var supplyZ = 80;

        for (var c = 0; c < 6; c++) {
            var crateX = supplyX + c * 5;
            var crate = new THREE.BoxGeometry(3, 3, 3);
            addMesh(crate, crateColor, crateX, 1.5, supplyZ);
        }

        var pallet1 = new THREE.BoxGeometry(10, 0.8, 10);
        addMesh(pallet1, palletColor, supplyX + 8, 0.4, supplyZ);

        var pallet2 = new THREE.BoxGeometry(10, 0.8, 10);
        addMesh(pallet2, palletColor, supplyX + 25, 0.4, supplyZ);

        for (var d = 0; d < 4; d++) {
            var drumX = supplyX - 15 + d * 6;
            var drum = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 8);
            addMesh(drum, drumColor, drumX, 1.3, supplyZ);
        }

        for (var s = 0; s < 8; s++) {
            var stackX = supplyX + 40 + (s % 3) * 4;
            var stackZ = supplyZ - 8 + Math.floor(s / 3) * 4;
            var stackCrate = new THREE.BoxGeometry(2.5, 2.5, 2.5);
            addMesh(stackCrate, crateColor, stackX, 1.3, stackZ);
        }
    }

    function buildPerimeter() {
        var stakeMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });

        var stakePositions = [
            [-95, -95], [-95, 95], [95, -95], [95, 95],
            [-95, -60], [-95, -30], [-95, 0], [-95, 30], [-95, 60],
            [95, -60], [95, -30], [95, 0], [95, 30], [95, 60],
            [-60, -95], [-30, -95], [0, -95], [30, -95], [60, -95],
            [-60, 95], [-30, 95], [0, 95], [30, 95], [60, 95]
        ];

        for (var p = 0; p < stakePositions.length; p++) {
            var px = stakePositions[p][0];
            var pz = stakePositions[p][1];
            var stake = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
            addMesh(stake, stakeMat, px, 1.5, pz);
        }

        var ropeGeom = new THREE.BufferGeometry();
        var ropePositions = [];

        for (var r = 0; r < stakePositions.length; r++) {
            var current = stakePositions[r];
            var next = stakePositions[(r + 1) % stakePositions.length];
            ropePositions.push(current[0], 2.5, current[1]);
            ropePositions.push(next[0], 2.5, next[1]);
        }

        ropeGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
        var ropeMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });
        var ropes = new THREE.LineSegments(ropeGeom, ropeMat);
        scene.add(ropes);
        objects.push(ropes);
    }

    function buildCommandPost() {
        var darkOliveMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var khakiMat = new THREE.MeshLambertMaterial({ color: 0x9d8f6f });
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var greyMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        var cmdX = -60;
        var cmdZ = -70;

        var mainTent = new THREE.BoxGeometry(12, 6, 10);
        addMesh(mainTent, darkOliveMat, cmdX, 3, cmdZ);

        var desk = new THREE.BoxGeometry(4, 1.5, 2);
        addMesh(desk, khakiMat, cmdX - 2, 1, cmdZ + 1);

        var mapStand = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 8);
        addMesh(mapStand, greyMat, cmdX + 3, 1.3, cmdZ - 2);

        var mapBoard = new THREE.BoxGeometry(1.8, 2.5, 0.3);
        addMesh(mapBoard, khakiMat, cmdX + 3, 2.8, cmdZ - 2);

        var flagPole = new THREE.CylinderGeometry(0.25, 0.25, 5, 6);
        addMesh(flagPole, blackMat, cmdX + 5.5, 2.5, cmdZ - 4);

        var flag = new THREE.BoxGeometry(1.5, 1, 0.1);
        addMesh(flag, darkOliveMat, cmdX + 6.5, 4, cmdZ - 4);
    }

    function buildFieldKitchen() {
        var counterColor = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var redMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });

        var kitX = 50;
        var kitZ = -90;

        var counter = new THREE.BoxGeometry(8, 1, 2);
        addMesh(counter, counterColor, kitX, 0.5, kitZ);

        var stove = new THREE.BoxGeometry(3, 2, 2);
        addMesh(stove, blackMat, kitX - 3, 1, kitZ);

        var pot = new THREE.CylinderGeometry(0.8, 0.8, 1, 8);
        addMesh(pot, redMat, kitX - 3, 2.2, kitZ);

        var shelf = new THREE.BoxGeometry(8, 0.5, 1.5);
        addMesh(shelf, counterColor, kitX, 2.5, kitZ);
    }

    function buildGenerator() {
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var smokeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });

        var genX = -50;
        var genZ = -90;

        var motor = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
        addMesh(motor, metalMat, genX, 1, genZ);

        var housing = new THREE.BoxGeometry(3, 2.5, 2);
        addMesh(housing, blackMat, genX, 1.3, genZ);

        var exhaust = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 6);
        addMesh(exhaust, blackMat, genX + 1.5, 3, genZ);

        var smokePuff = new THREE.SphereGeometry(0.6, 4, 4);
        var smokeMesh = addMesh(smokePuff, smokeMat, genX + 1.5, 4.5, genZ);
        fireEmbers.push(smokeMesh);
    }

    function buildSoldierGear() {
        var equipMat = new THREE.MeshLambertMaterial({ color: 0x7a6e60 });

        var gearPositions = [
            [-20, -50], [20, -50], [-20, 50], [20, 50],
            [-60, 0], [60, 0], [0, -60], [0, 60],
            [-40, 30], [40, -30], [30, 60], [-30, -60]
        ];

        for (var g = 0; g < gearPositions.length; g++) {
            var gx = gearPositions[g][0];
            var gz = gearPositions[g][1];

            var gear1 = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            addMesh(gear1, equipMat, gx, 0.75, gz);

            var gear2 = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            addMesh(gear2, equipMat, gx + 1, 1.5, gz + 0.5);

            var gear3 = new THREE.BoxGeometry(1, 1, 1);
            addMesh(gear3, equipMat, gx - 0.8, 1, gz - 0.8);
        }
    }

    function buildLatrine() {
        var brownMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var latX = 70;
        var latZ = 70;

        var outhouse = new THREE.BoxGeometry(2, 2.5, 2);
        addMesh(outhouse, brownMat, latX, 1.25, latZ);

        var door = new THREE.BoxGeometry(0.8, 2, 0.2);
        addMesh(door, blackMat, latX + 0.9, 1.2, latZ - 0.9);

        var roof = new THREE.BoxGeometry(2.5, 0.5, 2.5);
        addMesh(roof, brownMat, latX, 2.6, latZ);
    }

    function setupLighting() {
        var duskColor = 0xffb366;
        var ambLight = new THREE.AmbientLight(duskColor, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var mainPointLight = new THREE.PointLight(duskColor, 0.8, 200);
        addLight(mainPointLight, 0, 30, 0);
        duskLights.push(mainPointLight);

        var campfire1Light = new THREE.PointLight(0xff6600, 1.2, 40);
        addLight(campfire1Light, 30, 5, 60);
        duskLights.push(campfire1Light);

        var campfire2Light = new THREE.PointLight(0xff6600, 1.2, 40);
        addLight(campfire2Light, -50, 5, 30);
        duskLights.push(campfire2Light);

        var campfire3Light = new THREE.PointLight(0xff6600, 1.2, 40);
        addLight(campfire3Light, 70, 5, -40);
        duskLights.push(campfire3Light);

        var skyLight = new THREE.DirectionalLight(0xffddaa, 0.4);
        skyLight.position.set(50, 50, 50);
        scene.add(skyLight);
        lights.push(skyLight);
    }

    function update(delta) {
        for (var i = 0; i < fireEmbers.length; i++) {
            var ember = fireEmbers[i];
            var flicker = 0.8 + 0.2 * Math.sin(Date.now() * 0.003 + i);
            ember.scale.set(flicker, flicker, flicker);
        }

        for (var j = 0; j < duskLights.length; j++) {
            var light = duskLights[j];
            var glow = 0.8 + 0.3 * Math.sin(Date.now() * 0.002 + j);
            light.intensity = glow;
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
        fireEmbers = [];
        duskLights = [];
        scene = null;
        camera = null;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        fireEmbers = [];
        duskLights = [];
        buildCampsite();
        buildTents();
        buildFirePits();
        buildMotorPool();
        buildSupplyLine();
        buildPerimeter();
        buildCommandPost();
        buildFieldKitchen();
        buildGenerator();
        buildSoldierGear();
        buildLatrine();
        setupLighting();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
