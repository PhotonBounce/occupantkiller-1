window.AberdeenCamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        build();
    }

    function build() {
        // Base offset for all structures
        var baseX = 480;
        var baseZ = 490;

        // Granite city block buildings (5 buildings)
        var graniteGray = 0x9E9E9E;
        var building1Geom = new THREE.BoxGeometry(20, 25, 15);
        var building1Mat = new THREE.MeshLambertMaterial({ color: graniteGray });
        var building1 = new THREE.Mesh(building1Geom, building1Mat);
        building1.position.set(baseX, 12.5, baseZ);
        scene.add(building1);
        objects.push(building1);

        var building2Geom = new THREE.BoxGeometry(16, 30, 18);
        var building2Mat = new THREE.MeshLambertMaterial({ color: graniteGray });
        var building2 = new THREE.Mesh(building2Geom, building2Mat);
        building2.position.set(baseX + 35, 15, baseZ + 10);
        scene.add(building2);
        objects.push(building2);

        var building3Geom = new THREE.BoxGeometry(18, 22, 16);
        var building3Mat = new THREE.MeshLambertMaterial({ color: graniteGray });
        var building3 = new THREE.Mesh(building3Geom, building3Mat);
        building3.position.set(baseX - 30, 11, baseZ - 25);
        scene.add(building3);
        objects.push(building3);

        var building4Geom = new THREE.BoxGeometry(24, 28, 14);
        var building4Mat = new THREE.MeshLambertMaterial({ color: graniteGray });
        var building4 = new THREE.Mesh(building4Geom, building4Mat);
        building4.position.set(baseX + 50, 14, baseZ - 40);
        scene.add(building4);
        objects.push(building4);

        var building5Geom = new THREE.BoxGeometry(14, 20, 20);
        var building5Mat = new THREE.MeshLambertMaterial({ color: graniteGray });
        var building5 = new THREE.Mesh(building5Geom, building5Mat);
        building5.position.set(baseX - 45, 10, baseZ + 35);
        scene.add(building5);
        objects.push(building5);

        // Aberdeen harbour crane (CylinderGeometry + BoxGeometry boom)
        var craneBaseGeom = new THREE.CylinderGeometry(4, 5, 2, 8);
        var industrialYellow = 0xFFD700;
        var craneBaseMat = new THREE.MeshLambertMaterial({ color: industrialYellow });
        var craneBase = new THREE.Mesh(craneBaseGeom, craneBaseMat);
        craneBase.position.set(baseX - 60, 1, baseZ + 60);
        scene.add(craneBase);
        objects.push(craneBase);

        var craneColumnGeom = new THREE.CylinderGeometry(1.5, 1.5, 35, 8);
        var craneColumnMat = new THREE.MeshLambertMaterial({ color: industrialYellow });
        var craneColumn = new THREE.Mesh(craneColumnGeom, craneColumnMat);
        craneColumn.position.set(baseX - 60, 17.5, baseZ + 60);
        scene.add(craneColumn);
        objects.push(craneColumn);

        var craneBoomGeom = new THREE.BoxGeometry(40, 2, 2);
        var craneBoomMat = new THREE.MeshLambertMaterial({ color: industrialYellow });
        var craneBoom = new THREE.Mesh(craneBoomGeom, craneBoomMat);
        craneBoom.position.set(baseX - 40, 33, baseZ + 60);
        scene.add(craneBoom);
        objects.push(craneBoom);

        var craneHookGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 6);
        var craneHookMat = new THREE.MeshLambertMaterial({ color: industrialYellow });
        var craneHook = new THREE.Mesh(craneHookGeom, craneHookMat);
        craneHook.position.set(baseX - 20, 25, baseZ + 60);
        scene.add(craneHook);
        objects.push(craneHook);

        // University quad fortification (4 buildings on 3 sides + sandbag defences)
        var quadX = baseX + 80;
        var quadZ = baseZ - 80;
        var quadBuildingColor = 0x8B7355;

        var quadNorthGeom = new THREE.BoxGeometry(50, 20, 10);
        var quadBuildingMat = new THREE.MeshLambertMaterial({ color: quadBuildingColor });
        var quadNorth = new THREE.Mesh(quadNorthGeom, quadBuildingMat);
        quadNorth.position.set(quadX, 10, quadZ - 30);
        scene.add(quadNorth);
        objects.push(quadNorth);

        var quadEastGeom = new THREE.BoxGeometry(10, 18, 40);
        var quadEast = new THREE.Mesh(quadEastGeom, quadBuildingMat);
        quadEast.position.set(quadX + 30, 9, quadZ);
        scene.add(quadEast);
        objects.push(quadEast);

        var quadWestGeom = new THREE.BoxGeometry(10, 18, 40);
        var quadWest = new THREE.Mesh(quadWestGeom, quadBuildingMat);
        quadWest.position.set(quadX - 30, 9, quadZ);
        scene.add(quadWest);
        objects.push(quadWest);

        var quadSouthGeom = new THREE.BoxGeometry(50, 16, 10);
        var quadSouth = new THREE.Mesh(quadSouthGeom, quadBuildingMat);
        quadSouth.position.set(quadX, 8, quadZ + 30);
        scene.add(quadSouth);
        objects.push(quadSouth);

        // Sandbag defences (small BoxGeometry blocks around courtyard)
        for (var i = 0; i < 12; i++) {
            var sandBagGeom = new THREE.BoxGeometry(3, 2, 3);
            var sandBagMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
            var sandBag = new THREE.Mesh(sandBagGeom, sandBagMat);
            var angle = (i / 12) * Math.PI * 2;
            var radius = 35;
            sandBag.position.set(quadX + Math.cos(angle) * radius, 1, quadZ + Math.sin(angle) * radius);
            scene.add(sandBag);
            objects.push(sandBag);
        }

        // North Sea oil terminal (large tank farm)
        var terminalX = baseX - 100;
        var terminalZ = baseZ + 100;

        var mainTankGeom = new THREE.CylinderGeometry(12, 12, 25, 16);
        var oilColor = 0x2F4F4F;
        var mainTankMat = new THREE.MeshLambertMaterial({ color: oilColor });
        var mainTank = new THREE.Mesh(mainTankGeom, mainTankMat);
        mainTank.position.set(terminalX, 12.5, terminalZ);
        scene.add(mainTank);
        objects.push(mainTank);

        var tankGeom = new THREE.CylinderGeometry(8, 8, 20, 12);
        var tankMat = new THREE.MeshLambertMaterial({ color: oilColor });
        for (var j = 0; j < 4; j++) {
            var tank = new THREE.Mesh(tankGeom, tankMat);
            var tx = terminalX + (j % 2) * 25 - 12.5;
            var tz = terminalZ + Math.floor(j / 2) * 25 - 12.5;
            tank.position.set(tx, 10, tz);
            scene.add(tank);
            objects.push(tank);
        }

        var platformGeom = new THREE.BoxGeometry(60, 3, 60);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(terminalX, 1.5, terminalZ);
        scene.add(platform);
        objects.push(platform);

        // Coastal gun battery (3 CylinderGeometry gun mounts facing east)
        var batteryX = baseX + 120;
        var batteryZ = baseZ + 70;
        var gunColor = 0x696969;

        for (var k = 0; k < 3; k++) {
            var gunMountGeom = new THREE.CylinderGeometry(3, 4, 2, 8);
            var gunMountMat = new THREE.MeshLambertMaterial({ color: gunColor });
            var gunMount = new THREE.Mesh(gunMountGeom, gunMountMat);
            gunMount.position.set(batteryX, 1, batteryZ + (k - 1) * 20);
            scene.add(gunMount);
            objects.push(gunMount);

            var gunBarrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 18, 8);
            var gunBarrelMat = new THREE.MeshLambertMaterial({ color: gunColor });
            var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunBarrelMat);
            gunBarrel.rotation.z = Math.PI / 6;
            gunBarrel.position.set(batteryX + 12, 4, batteryZ + (k - 1) * 20);
            scene.add(gunBarrel);
            objects.push(gunBarrel);
        }

        var gunEmplacementGeom = new THREE.BoxGeometry(35, 1.5, 70);
        var gunEmplacementMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var gunEmplacement = new THREE.Mesh(gunEmplacementGeom, gunEmplacementMat);
        gunEmplacement.position.set(batteryX, 0.75, batteryZ);
        scene.add(gunEmplacement);
        objects.push(gunEmplacement);

        // Bridge barricade on River Dee
        var bridgeX = baseX - 80;
        var bridgeZ = baseZ - 100;

        var bridgeGeom = new THREE.BoxGeometry(30, 2, 8);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(bridgeX, 1, bridgeZ);
        scene.add(bridge);
        objects.push(bridge);

        var railGeom = new THREE.BoxGeometry(1, 3, 8);
        var railMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var railLeft = new THREE.Mesh(railGeom, railMat);
        railLeft.position.set(bridgeX - 15, 3, bridgeZ);
        scene.add(railLeft);
        objects.push(railLeft);

        var railRight = new THREE.Mesh(railGeom, railMat);
        railRight.position.set(bridgeX + 15, 3, bridgeZ);
        scene.add(railRight);
        objects.push(railRight);

        var barrierGeom = new THREE.BoxGeometry(8, 4, 8);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        for (var m = 0; m < 3; m++) {
            var barrier = new THREE.Mesh(barrierGeom, barrierMat);
            barrier.position.set(bridgeX - 10 + m * 10, 2, bridgeZ + 15);
            scene.add(barrier);
            objects.push(barrier);
        }

        // Military HQ in former council building (10x8x6)
        var hqGeom = new THREE.BoxGeometry(20, 15, 16);
        var hqMat = new THREE.MeshLambertMaterial({ color: graniteGray });
        var hq = new THREE.Mesh(hqGeom, hqMat);
        hq.position.set(baseX + 40, 7.5, baseZ - 60);
        scene.add(hq);
        objects.push(hq);

        // HQ entrance structure (smaller box)
        var entranceGeom = new THREE.BoxGeometry(8, 6, 4);
        var entranceMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var entrance = new THREE.Mesh(entranceGeom, entranceMat);
        entrance.position.set(baseX + 40, 3, baseZ - 70);
        scene.add(entrance);
        objects.push(entrance);

        // Supply column on main street (5 BoxGeometry vehicles)
        var supplyX = baseX + 60;
        var supplyZ = baseZ + 10;
        var oliveDrab = 0x556B2F;

        for (var n = 0; n < 5; n++) {
            var vehicleGeom = new THREE.BoxGeometry(4, 3, 8);
            var vehicleMat = new THREE.MeshLambertMaterial({ color: oliveDrab });
            var vehicle = new THREE.Mesh(vehicleGeom, vehicleMat);
            vehicle.position.set(supplyX + n * 12, 1.5, supplyZ);
            scene.add(vehicle);
            objects.push(vehicle);

            // Vehicle cabin
            var cabinGeom = new THREE.BoxGeometry(3, 2.5, 3);
            var cabinMat = new THREE.MeshLambertMaterial({ color: 0x3D3D1F });
            var cabin = new THREE.Mesh(cabinGeom, cabinMat);
            cabin.position.set(supplyX + n * 12 - 1.5, 3, supplyZ + 1.5);
            scene.add(cabin);
            objects.push(cabin);
        }

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for sun
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(100, 100, 100);
        scene.add(dirLight);
        lights.push(dirLight);

        // Add point light near HQ for atmosphere
        var hqLight = new THREE.PointLight(0xFFFFFF, 0.5, 50);
        hqLight.position.set(baseX + 40, 20, baseZ - 60);
        scene.add(hqLight);
        lights.push(hqLight);
    }

    function update(delta) {
        // Animation logic can be added here
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
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
