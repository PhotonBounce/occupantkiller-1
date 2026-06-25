window.LochgilpheadBase = (function() {
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
        // Argyll & Bute Council HQ main building
        var councilGeometry = new THREE.BoxGeometry(16, 12, 20);
        var councilMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var councilBuilding = new THREE.Mesh(councilGeometry, councilMaterial);
        councilBuilding.position.set(-25, 6, -20);
        scene.add(councilBuilding);
        objects.push(councilBuilding);

        // Council HQ annex
        var annexGeometry = new THREE.BoxGeometry(10, 8, 12);
        var annexMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var annexBuilding = new THREE.Mesh(annexGeometry, annexMaterial);
        annexBuilding.position.set(-18, 4, -8);
        scene.add(annexBuilding);
        objects.push(annexBuilding);

        // Communication mast at council HQ
        var mastGeometry = new THREE.CylinderGeometry(1.2, 1.2, 28, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var communicationMast = new THREE.Mesh(mastGeometry, mastMaterial);
        communicationMast.position.set(-25, 14, -20);
        scene.add(communicationMast);
        objects.push(communicationMast);

        // Hospital block
        var hospitalGeometry = new THREE.BoxGeometry(14, 10, 18);
        var hospitalMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hospitalBlock = new THREE.Mesh(hospitalGeometry, hospitalMaterial);
        hospitalBlock.position.set(5, 5, 15);
        scene.add(hospitalBlock);
        objects.push(hospitalBlock);

        // Hospital water tower
        var towerGeometry = new THREE.CylinderGeometry(3, 3.5, 16, 8);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var waterTower = new THREE.Mesh(towerGeometry, towerMaterial);
        waterTower.position.set(16, 8, 20);
        scene.add(waterTower);
        objects.push(waterTower);

        // Ambulance depot
        var depotGeometry = new THREE.BoxGeometry(8, 6, 10);
        var depotMaterial = new THREE.MeshLambertMaterial({ color: 0x7a5a4a });
        var ambulanceDepot = new THREE.Mesh(depotGeometry, depotMaterial);
        ambulanceDepot.position.set(12, 3, 28);
        scene.add(ambulanceDepot);
        objects.push(ambulanceDepot);

        // Canal basin
        var basinGeometry = new THREE.BoxGeometry(24, 3, 16);
        var basinMaterial = new THREE.MeshLambertMaterial({ color: 0x4a6fa5 });
        var canalBasin = new THREE.Mesh(basinGeometry, basinMaterial);
        canalBasin.position.set(20, 1.5, -15);
        scene.add(canalBasin);
        objects.push(canalBasin);

        // Patrol boat
        var boatGeometry = new THREE.BoxGeometry(6, 3, 14);
        var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
        var patrolBoat = new THREE.Mesh(boatGeometry, boatMaterial);
        patrolBoat.position.set(20, 2, -8);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        // Lock gate mechanism cylinder
        var lockGeometry = new THREE.CylinderGeometry(2.5, 2.5, 14, 8);
        var lockMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var lockGate = new THREE.Mesh(lockGeometry, lockMaterial);
        lockGate.position.set(32, 7, -15);
        scene.add(lockGate);
        objects.push(lockGate);

        // Kilmory Castle Victorian base
        var castleGeometry = new THREE.BoxGeometry(18, 14, 22);
        var castleMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var castleBlock = new THREE.Mesh(castleGeometry, castleMaterial);
        castleBlock.position.set(-30, 7, 10);
        scene.add(castleBlock);
        objects.push(castleBlock);

        // Castle tower cap cone
        var towerCapGeometry = new THREE.ConeGeometry(5, 12, 8);
        var towerCapMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var towerCap = new THREE.Mesh(towerCapGeometry, towerCapMaterial);
        towerCap.position.set(-30, 18, 10);
        scene.add(towerCap);
        objects.push(towerCap);

        // Castle outbuilding
        var outbuildingGeometry = new THREE.BoxGeometry(10, 7, 10);
        var outbuildingMaterial = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var castleOutbuilding = new THREE.Mesh(outbuildingGeometry, outbuildingMaterial);
        outbuildingGeometry.position.set(-20, 3.5, 22);
        scene.add(castleOutbuilding);
        objects.push(castleOutbuilding);

        // Exhibition halls converted hangars
        var hangarGeometry = new THREE.BoxGeometry(20, 9, 28);
        var hangarMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
        hangar.position.set(-15, 4.5, 25);
        scene.add(hangar);
        objects.push(hangar);

        // Fuel bowser cylinder
        var bowserGeometry = new THREE.CylinderGeometry(2, 2, 8, 8);
        var bowserMaterial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var fuelBowser = new THREE.Mesh(bowserGeometry, bowserMaterial);
        fuelBowser.position.set(-8, 4, 30);
        scene.add(fuelBowser);
        objects.push(fuelBowser);

        // Runway markers - LineSegments
        var runwayPoints = [
            new THREE.Vector3(-20, 0.1, 20),
            new THREE.Vector3(20, 0.1, 20),
            new THREE.Vector3(20, 0.1, 35),
            new THREE.Vector3(-20, 0.1, 35)
        ];
        var runwayGeometry = new THREE.BufferGeometry().setFromPoints(runwayPoints);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
        var runwayMarkers = new THREE.LineSegments(runwayGeometry, lineMaterial);
        scene.add(runwayMarkers);
        objects.push(runwayMarkers);

        // Cairnbaan standing stone pair cylinders
        var stoneGeometry = new THREE.CylinderGeometry(1.5, 1.8, 10, 8);
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x8b8680 });
        var stone1 = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stone1.position.set(8, 5, -22);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stone2.position.set(14, 5, -22);
        scene.add(stone2);
        objects.push(stone2);

        // Elevated observation post
        var obsPostGeometry = new THREE.BoxGeometry(6, 8, 6);
        var obsPostMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var obsPost = new THREE.Mesh(obsPostGeometry, obsPostMaterial);
        obsPost.position.set(11, 4, -28);
        scene.add(obsPost);
        objects.push(obsPost);

        // Forest road
        var roadGeometry = new THREE.BoxGeometry(8, 0.5, 24);
        var roadMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var forestRoad = new THREE.Mesh(roadGeometry, roadMaterial);
        forestRoad.position.set(-10, 0.25, 5);
        scene.add(forestRoad);
        objects.push(forestRoad);

        // IED charges as spheres
        var iedGeometry = new THREE.SphereGeometry(1.2, 8, 8);
        var iedMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        var ied1 = new THREE.Mesh(iedGeometry, iedMaterial);
        ied1.position.set(-8, 1.5, 8);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeometry, iedMaterial);
        ied2.position.set(-12, 1.5, 12);
        scene.add(ied2);
        objects.push(ied2);

        // Command wire through trees - LineSegments
        var wirePoints = [
            new THREE.Vector3(-8, 1.5, 8),
            new THREE.Vector3(-12, 1.5, 12),
            new THREE.Vector3(-15, 2, 16)
        ];
        var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        var commandWire = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(commandWire);
        objects.push(commandWire);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic can be added here
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
