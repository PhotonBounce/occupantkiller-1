window.DunoonPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Dunoon Pier Ferry Terminal Control
        var pierBoxGeom = new THREE.BoxGeometry(15, 8, 10);
        var pierMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var pierBox = new THREE.Mesh(pierBoxGeom, pierMat);
        pierBox.position.set(-25, 4, -20);
        scene.add(pierBox);
        objects.push(pierBox);

        var dockCraneGeom = new THREE.CylinderGeometry(2, 2.5, 14, 8);
        var craneMatDark = new THREE.MeshLambertMaterial({color: 0x404040});
        var dockCrane = new THREE.Mesh(dockCraneGeom, craneMatDark);
        dockCrane.position.set(-20, 7, -15);
        scene.add(dockCrane);
        objects.push(dockCrane);

        var harborShedGeom = new THREE.BoxGeometry(8, 6, 7);
        var shedMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var harborShed = new THREE.Mesh(harborShedGeom, shedMat);
        harborShed.position.set(-15, 3, -10);
        scene.add(harborShed);
        objects.push(harborShed);

        // Clyde Riviera Defense Line
        var hotelOneGeom = new THREE.BoxGeometry(12, 10, 8);
        var hotelMat = new THREE.MeshLambertMaterial({color: 0xA0522D});
        var hotelOne = new THREE.Mesh(hotelOneGeom, hotelMat);
        hotelOne.position.set(5, 5, -18);
        scene.add(hotelOne);
        objects.push(hotelOne);

        var barrierOneGeom = new THREE.BoxGeometry(10, 3, 2);
        var barrierMat = new THREE.MeshLambertMaterial({color: 0x555555});
        var barrierOne = new THREE.Mesh(barrierOneGeom, barrierMat);
        barrierOne.position.set(20, 1.5, -12);
        scene.add(barrierOne);
        objects.push(barrierOne);

        var watchtowerGeom = new THREE.CylinderGeometry(3, 3.5, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var watchtower = new THREE.Mesh(watchtowerGeom, towerMat);
        watchtower.position.set(15, 6, 0);
        scene.add(watchtower);
        objects.push(watchtower);

        // Dunoon Castle Ruin Stronghold
        var castleRuinsGeom = new THREE.BoxGeometry(18, 7, 15);
        var castleMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var castleRuins = new THREE.Mesh(castleRuinsGeom, castleMat);
        castleRuins.position.set(-5, 3.5, 15);
        scene.add(castleRuins);
        objects.push(castleRuins);

        var ruinedTowerGeom = new THREE.CylinderGeometry(2.5, 3, 10, 8);
        var ruinedTowerMat = new THREE.MeshLambertMaterial({color: 0x5C4033});
        var ruinedTower = new THREE.Mesh(ruinedTowerGeom, ruinedTowerMat);
        ruinedTower.position.set(5, 5, 22);
        scene.add(ruinedTower);
        objects.push(ruinedTower);

        var graveyardWallGeom = new THREE.BoxGeometry(16, 4, 2);
        var wallMat = new THREE.MeshLambertMaterial({color: 0x8B8680});
        var graveyardWall = new THREE.Mesh(graveyardWallGeom, wallMat);
        graveyardWall.position.set(-12, 2, 28);
        scene.add(graveyardWall);
        objects.push(graveyardWall);

        // Holy Loch Marina Patrol
        var jettyGeom = new THREE.BoxGeometry(11, 3, 9);
        var jettyMat = new THREE.MeshLambertMaterial({color: 0x808080});
        var jetty = new THREE.Mesh(jettyGeom, jettyMat);
        jetty.position.set(25, 1.5, 10);
        scene.add(jetty);
        objects.push(jetty);

        var patrolBoatGeom = new THREE.BoxGeometry(5, 2, 8);
        var boatMat = new THREE.MeshLambertMaterial({color: 0x228B22});
        var patrolBoat = new THREE.Mesh(patrolBoatGeom, boatMat);
        patrolBoat.position.set(30, 2, 15);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        var mooringBuoyGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({color: 0xFF6347});
        var mooringBuoy = new THREE.Mesh(mooringBuoyGeom, buoyMat);
        mooringBuoy.position.set(28, 1, 22);
        scene.add(mooringBuoy);
        objects.push(mooringBuoy);

        var netCablePoints = [
            new THREE.Vector3(28, 1.5, 20),
            new THREE.Vector3(32, 1.5, 25)
        ];
        var netCableGeom = new THREE.BufferGeometry().setFromPoints(netCablePoints);
        var lineMat = new THREE.LineBasicMaterial({color: 0x333333});
        var netCable = new THREE.LineSegments(netCableGeom, lineMat);
        scene.add(netCable);
        objects.push(netCable);

        // Benmore Garden Base Camp
        var mansionGeom = new THREE.BoxGeometry(14, 9, 11);
        var mansionMat = new THREE.MeshLambertMaterial({color: 0xD2B48C});
        var mansion = new THREE.Mesh(mansionGeom, mansionMat);
        mansion.position.set(-20, 4.5, 5);
        scene.add(mansion);
        objects.push(mansion);

        var glassHouseGeom = new THREE.BoxGeometry(7, 5, 6);
        var glassMat = new THREE.MeshLambertMaterial({color: 0xB0E0E6});
        var glassHouse = new THREE.Mesh(glassHouseGeom, glassMat);
        glassHouse.position.set(-10, 2.5, 10);
        scene.add(glassHouse);
        objects.push(glassHouse);

        var waterTankGeom = new THREE.CylinderGeometry(2, 2, 8, 8);
        var tankMat = new THREE.MeshLambertMaterial({color: 0x4169E1});
        var waterTank = new THREE.Mesh(waterTankGeom, tankMat);
        waterTank.position.set(-15, 4, 18);
        scene.add(waterTank);
        objects.push(waterTank);

        // Tom a Mhoid Ridge Relay
        var shelterGeom = new THREE.BoxGeometry(6, 4, 5);
        var shelterMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(10, 2, 25);
        scene.add(shelter);
        objects.push(shelter);

        var signalMastGeom = new THREE.CylinderGeometry(1, 1.2, 9, 6);
        var mastMat = new THREE.MeshLambertMaterial({color: 0xFFD700});
        var signalMast = new THREE.Mesh(signalMastGeom, mastMat);
        signalMast.position.set(15, 4.5, 30);
        scene.add(signalMast);
        objects.push(signalMast);

        var radomeGeom = new THREE.SphereGeometry(2, 8, 8);
        var radomeMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
        var radome = new THREE.Mesh(radomeGeom, radomeMat);
        radome.position.set(18, 6.5, 32);
        scene.add(radome);
        objects.push(radome);

        // Bullwood Military Site
        var facilityGeom = new THREE.BoxGeometry(13, 5, 10);
        var facilityMat = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var facility = new THREE.Mesh(facilityGeom, facilityMat);
        facility.position.set(-30, 2.5, -5);
        scene.add(facility);
        objects.push(facility);

        var fuelTankGeom = new THREE.CylinderGeometry(2.2, 2.2, 7, 8);
        var fuelMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var fuelTank = new THREE.Mesh(fuelTankGeom, fuelMat);
        fuelTank.position.set(-25, 3.5, 5);
        scene.add(fuelTank);
        objects.push(fuelTank);

        var securityFenceGeom = new THREE.BoxGeometry(12, 3, 1);
        var fenceMat = new THREE.MeshLambertMaterial({color: 0x505050});
        var securityFence = new THREE.Mesh(securityFenceGeom, fenceMat);
        securityFence.position.set(-28, 1.5, 13);
        scene.add(securityFence);
        objects.push(securityFence);

        // Toward Lighthouse Coastal Battery
        var lighthouseTowerGeom = new THREE.BoxGeometry(4, 12, 4);
        var lighthouseMat = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
        var lighthouseTower = new THREE.Mesh(lighthouseTowerGeom, lighthouseMat);
        lighthouseTower.position.set(10, 6, -25);
        scene.add(lighthouseTower);
        objects.push(lighthouseTower);

        var gunBarrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
        var gunMat = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunMat);
        gunBarrel.position.set(12, 4, -20);
        gunBarrel.rotation.z = Math.PI / 6;
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        var magazineGeom = new THREE.BoxGeometry(8, 4, 6);
        var magazineMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var magazine = new THREE.Mesh(magazineGeom, magazineMat);
        magazine.position.set(8, 2, -15);
        scene.add(magazine);
        objects.push(magazine);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
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
