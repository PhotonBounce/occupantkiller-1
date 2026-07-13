window.MelfortBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        var hotelGeom = new THREE.BoxGeometry(20, 15, 16);
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var hotel = new THREE.Mesh(hotelGeom, hotelMat);
        hotel.position.set(-25, 7.5, -20);
        scene.add(hotel);
        objects.push(hotel);

        var boathouseGeom = new THREE.BoxGeometry(12, 8, 18);
        var boathouseMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var boathouse = new THREE.Mesh(boathouseGeom, boathouseMat);
        boathouse.position.set(-15, 4, 5);
        scene.add(boathouse);
        objects.push(boathouse);

        var fuelTankGeom = new THREE.CylinderGeometry(5, 5, 12, 16);
        var fuelTankMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var fuelTank = new THREE.Mesh(fuelTankGeom, fuelTankMat);
        fuelTank.position.set(-8, 6, -12);
        scene.add(fuelTank);
        objects.push(fuelTank);

        var gardenWallGeom = new THREE.BoxGeometry(24, 3, 2);
        var gardenWallMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var gardenWall = new THREE.Mesh(gardenWallGeom, gardenWallMat);
        gardenWall.position.set(10, 1.5, -25);
        scene.add(gardenWall);
        objects.push(gardenWall);

        var equipmentStorageGeom = new THREE.BoxGeometry(14, 10, 16);
        var equipmentStorageMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var equipmentStorage = new THREE.Mesh(equipmentStorageGeom, equipmentStorageMat);
        equipmentStorage.position.set(18, 5, -18);
        scene.add(equipmentStorage);
        objects.push(equipmentStorage);

        var waterTowerGeom = new THREE.CylinderGeometry(4, 4, 14, 16);
        var waterTowerMat = new THREE.MeshLambertMaterial({ color: 0x4682B4 });
        var waterTower = new THREE.Mesh(waterTowerGeom, waterTowerMat);
        waterTower.position.set(25, 7, -8);
        scene.add(waterTower);
        objects.push(waterTower);

        var pontoonGeom = new THREE.BoxGeometry(16, 2, 10);
        var pontoonMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
        var pontoon = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon.position.set(-20, 1, 18);
        scene.add(pontoon);
        objects.push(pontoon);

        var fuelBowserGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
        var fuelBowserMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var fuelBowser = new THREE.Mesh(fuelBowserGeom, fuelBowserMat);
        fuelBowser.position.set(-12, 4, 22);
        scene.add(fuelBowser);
        objects.push(fuelBowser);

        var chandleryGeom = new THREE.BoxGeometry(10, 8, 12);
        var chandleryMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var chandlery = new THREE.Mesh(chandleryGeom, chandleryMat);
        chandlery.position.set(2, 4, 25);
        scene.add(chandlery);
        objects.push(chandlery);

        var camouflageCanopyGeom = new THREE.BoxGeometry(18, 6, 20);
        var camouflageCanopyMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
        var camouflageCanopy = new THREE.Mesh(camouflageCanopyGeom, camouflageCanopyMat);
        camouflageCanopy.position.set(22, 3, 10);
        scene.add(camouflageCanopy);
        objects.push(camouflageCanopy);

        var subHullGeom = new THREE.CylinderGeometry(6, 6, 24, 16);
        var subHullMat = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });
        var subHull = new THREE.Mesh(subHullGeom, subHullMat);
        subHull.rotation.z = Math.PI / 2;
        subHull.position.set(28, 0, 15);
        scene.add(subHull);
        objects.push(subHull);

        var sensorBuoyGeom = new THREE.SphereGeometry(2, 16, 16);
        var sensorBuoyMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var sensorBuoy = new THREE.Mesh(sensorBuoyGeom, sensorBuoyMat);
        sensorBuoy.position.set(30, 2, 22);
        scene.add(sensorBuoy);
        objects.push(sensorBuoy);

        var runwayGeom = new THREE.BoxGeometry(30, 1, 40);
        var runwayMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var runway = new THREE.Mesh(runwayGeom, runwayMat);
        runway.position.set(-5, 0.5, 8);
        scene.add(runway);
        objects.push(runway);

        var hangarGeom = new THREE.BoxGeometry(16, 12, 20);
        var hangarMat = new THREE.MeshLambertMaterial({ color: 0xB0C4DE });
        var hangar = new THREE.Mesh(hangarGeom, hangarMat);
        hangar.position.set(-8, 6, 20);
        scene.add(hangar);
        objects.push(hangar);

        var windIndicatorGeom = new THREE.ConeGeometry(3, 8, 16);
        var windIndicatorMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var windIndicator = new THREE.Mesh(windIndicatorGeom, windIndicatorMat);
        windIndicator.position.set(5, 10, 25);
        scene.add(windIndicator);
        objects.push(windIndicator);

        var damWallGeom = new THREE.BoxGeometry(40, 8, 3);
        var damWallMat = new THREE.MeshLambertMaterial({ color: 0x8B8B7A });
        var damWall = new THREE.Mesh(damWallGeom, damWallMat);
        damWall.position.set(-18, 4, -30);
        scene.add(damWall);
        objects.push(damWall);

        var intakeTowerGeom = new THREE.CylinderGeometry(4, 4, 10, 16);
        var intakeTowerMat = new THREE.MeshLambertMaterial({ color: 0x6F8E7F });
        var intakeTower = new THREE.Mesh(intakeTowerGeom, intakeTowerMat);
        intakeTower.position.set(0, 5, -28);
        scene.add(intakeTower);
        objects.push(intakeTower);

        var powerLinePoints = [
            new THREE.Vector3(-20, 8, -30),
            new THREE.Vector3(10, 8, -28),
            new THREE.Vector3(20, 8, -25)
        ];
        var powerLineGeom = new THREE.BufferGeometry().setFromPoints(powerLinePoints);
        var powerLineMat = new THREE.LineBasicMaterial({ color: 0x000000 });
        var powerLine = new THREE.LineSegments(powerLineGeom, powerLineMat);
        scene.add(powerLine);
        objects.push(powerLine);

        var valleyWallGeom = new THREE.BoxGeometry(35, 12, 4);
        var valleyWallMat = new THREE.MeshLambertMaterial({ color: 0x4A4A3A });
        var valleyWall = new THREE.Mesh(valleyWallGeom, valleyWallMat);
        valleyWall.position.set(12, 6, 30);
        scene.add(valleyWall);
        objects.push(valleyWall);

        var vehicleWreckGeom = new THREE.BoxGeometry(8, 4, 10);
        var vehicleWreckMat = new THREE.MeshLambertMaterial({ color: 0x3E3E3E });
        var vehicleWreck = new THREE.Mesh(vehicleWreckGeom, vehicleWreckMat);
        vehicleWreck.position.set(18, 2, 32);
        scene.add(vehicleWreck);
        objects.push(vehicleWreck);

        var tripwirePoints = [
            new THREE.Vector3(10, 2, 28),
            new THREE.Vector3(15, 2, 28),
            new THREE.Vector3(20, 2, 28)
        ];
        var tripwireGeom = new THREE.BufferGeometry().setFromPoints(tripwirePoints);
        var tripwireMat = new THREE.LineBasicMaterial({ color: 0x8B0000 });
        var tripwire = new THREE.LineSegments(tripwireGeom, tripwireMat);
        scene.add(tripwire);
        objects.push(tripwire);

        var mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        mainLight.position.set(20, 25, 20);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0x606060, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
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
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
