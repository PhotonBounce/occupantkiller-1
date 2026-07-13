window.InverarayCastle = (function() {
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
        buildCastle();
    }
    function buildCastle() {
        var mainKeepGeom = new THREE.BoxGeometry(20, 30, 20);
        var castleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var mainKeep = new THREE.Mesh(mainKeepGeom, castleMaterial);
        mainKeep.position.set(0, 15, 0);
        scene.add(mainKeep);
        objects.push(mainKeep);

        var cornerTower1Geom = new THREE.BoxGeometry(10, 28, 10);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cornerTower1 = new THREE.Mesh(cornerTower1Geom, towerMaterial);
        cornerTower1.position.set(15, 14, 15);
        scene.add(cornerTower1);
        objects.push(cornerTower1);

        var cornerTower2 = new THREE.Mesh(cornerTower1Geom, towerMaterial);
        cornerTower2.position.set(-15, 14, 15);
        scene.add(cornerTower2);
        objects.push(cornerTower2);

        var cornerTower3 = new THREE.Mesh(cornerTower1Geom, towerMaterial);
        cornerTower3.position.set(15, 14, -15);
        scene.add(cornerTower3);
        objects.push(cornerTower3);

        var cornerTower4 = new THREE.Mesh(cornerTower1Geom, towerMaterial);
        cornerTower4.position.set(-15, 14, -15);
        scene.add(cornerTower4);
        objects.push(cornerTower4);

        var cylinderTurret1Geom = new THREE.CylinderGeometry(5, 5, 25, 16);
        var turretMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var cylinderTurret1 = new THREE.Mesh(cylinderTurret1Geom, turretMaterial);
        cylinderTurret1.position.set(10, 12.5, 20);
        scene.add(cylinderTurret1);
        objects.push(cylinderTurret1);

        var cylinderTurret2 = new THREE.Mesh(cylinderTurret1Geom, turretMaterial);
        cylinderTurret2.position.set(-10, 12.5, 20);
        scene.add(cylinderTurret2);
        objects.push(cylinderTurret2);

        var coneCap1Geom = new THREE.ConeGeometry(5, 8, 16);
        var capMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var coneCap1 = new THREE.Mesh(coneCap1Geom, capMaterial);
        coneCap1.position.set(10, 38, 20);
        scene.add(coneCap1);
        objects.push(coneCap1);

        var coneCap2 = new THREE.Mesh(coneCap1Geom, capMaterial);
        coneCap2.position.set(-10, 38, 20);
        scene.add(coneCap2);
        objects.push(coneCap2);

        var courtyard1Geom = new THREE.BoxGeometry(30, 2, 2);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var courtyard1 = new THREE.Mesh(courtyard1Geom, wallMaterial);
        courtyard1.position.set(0, 1, -22);
        scene.add(courtyard1);
        objects.push(courtyard1);

        var courtyard2 = new THREE.Mesh(courtyard1Geom, wallMaterial);
        courtyard2.position.set(0, 1, 22);
        scene.add(courtyard2);
        objects.push(courtyard2);

        var vehicleBarrierGeom = new THREE.BoxGeometry(2, 1.5, 10);
        var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var vehicleBarrier = new THREE.Mesh(vehicleBarrierGeom, barrierMaterial);
        vehicleBarrier.position.set(-12, 0.75, 0);
        scene.add(vehicleBarrier);
        objects.push(vehicleBarrier);

        var portcullisGeom = new THREE.CylinderGeometry(3, 3, 2, 8);
        var portcullisMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var portcullis = new THREE.Mesh(portcullisGeom, portcullisMaterial);
        portcullis.position.set(0, 1, -25);
        scene.add(portcullis);
        objects.push(portcullis);

        var opsRoomGeom = new THREE.BoxGeometry(12, 8, 12);
        var opsMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var opsRoom = new THREE.Mesh(opsRoomGeom, opsMaterial);
        opsRoom.position.set(8, 4, -8);
        scene.add(opsRoom);
        objects.push(opsRoom);

        var commRoomGeom = new THREE.BoxGeometry(10, 6, 10);
        var commMaterial = new THREE.MeshLambertMaterial({ color: 0xBC8F8F });
        var commRoom = new THREE.Mesh(commRoomGeom, commMaterial);
        commRoom.position.set(-8, 3, -8);
        scene.add(commRoom);
        objects.push(commRoom);

        var stairTowerGeom = new THREE.CylinderGeometry(4, 4, 15, 12);
        var stairMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var stairTower = new THREE.Mesh(stairTowerGeom, stairMaterial);
        stairTower.position.set(12, 7.5, -20);
        scene.add(stairTower);
        objects.push(stairTower);

        var jettyGeom = new THREE.BoxGeometry(12, 2, 8);
        var jettyMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var jetty = new THREE.Mesh(jettyGeom, jettyMaterial);
        jetty.position.set(-25, 0, 10);
        scene.add(jetty);
        objects.push(jetty);

        var patrolBoatGeom = new THREE.BoxGeometry(6, 2, 3);
        var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var patrolBoat = new THREE.Mesh(patrolBoatGeom, boatMaterial);
        patrolBoat.position.set(-25, 2, 15);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        var mooringBuoy1Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var mooringBuoy1 = new THREE.Mesh(mooringBuoy1Geom, buoyMaterial);
        mooringBuoy1.position.set(-20, 0.5, 8);
        scene.add(mooringBuoy1);
        objects.push(mooringBuoy1);

        var mooringBuoy2 = new THREE.Mesh(mooringBuoy1Geom, buoyMaterial);
        mooringBuoy2.position.set(-30, 0.5, 12);
        scene.add(mooringBuoy2);
        objects.push(mooringBuoy2);

        var aaPlateGeom = new THREE.BoxGeometry(10, 2, 10);
        var aaMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var aaPlate = new THREE.Mesh(aaPlateGeom, aaMaterial);
        aaPlate.position.set(22, 1, 15);
        scene.add(aaPlate);
        objects.push(aaPlate);

        var gunMountGeom = new THREE.CylinderGeometry(2, 2, 8, 12);
        var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var gunMount = new THREE.Mesh(gunMountGeom, gunMaterial);
        gunMount.position.set(22, 5, 15);
        scene.add(gunMount);
        objects.push(gunMount);

        var ammStorageGeom = new THREE.BoxGeometry(6, 4, 6);
        var ammMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var ammStorage = new THREE.Mesh(ammStorageGeom, ammMaterial);
        ammStorage.position.set(28, 2, 20);
        scene.add(ammStorage);
        objects.push(ammStorage);

        var treeTrunk1Geom = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        var treeMaterial = new THREE.MeshLambertMaterial({ color: 0x3B2F2F });
        var treeTrunk1 = new THREE.Mesh(treeTrunk1Geom, treeMaterial);
        treeTrunk1.position.set(-28, 6, -15);
        scene.add(treeTrunk1);
        objects.push(treeTrunk1);

        var treeTrunk2 = new THREE.Mesh(treeTrunk1Geom, treeMaterial);
        treeTrunk2.position.set(-28, 6, -5);
        scene.add(treeTrunk2);
        objects.push(treeTrunk2);

        var firePositionGeom = new THREE.BoxGeometry(8, 3, 8);
        var fireMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var firePosition = new THREE.Mesh(firePositionGeom, fireMaterial);
        firePosition.position.set(-30, 7, 5);
        scene.add(firePosition);
        objects.push(firePosition);

        var tripwirePoints = [];
        tripwirePoints.push(new THREE.Vector3(-28, 3, -12));
        tripwirePoints.push(new THREE.Vector3(-26, 3, -10));
        var tripwireGeom = new THREE.BufferGeometry().setFromPoints(tripwirePoints);
        var tripwireMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var tripwire = new THREE.LineSegments(tripwireGeom, tripwireMaterial);
        scene.add(tripwire);
        objects.push(tripwire);

        var tunnelEntryGeom = new THREE.BoxGeometry(4, 5, 6);
        var tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var tunnelEntry = new THREE.Mesh(tunnelEntryGeom, tunnelMaterial);
        tunnelEntry.position.set(-20, 2.5, -28);
        scene.add(tunnelEntry);
        objects.push(tunnelEntry);

        var tunnelSectionGeom = new THREE.BoxGeometry(4, 5, 8);
        var tunnelSection = new THREE.Mesh(tunnelSectionGeom, tunnelMaterial);
        tunnelSection.position.set(-12, 2.5, -28);
        scene.add(tunnelSection);
        objects.push(tunnelSection);

        var ventShaftGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
        var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var ventShaft = new THREE.Mesh(ventShaftGeom, ventMaterial);
        ventShaft.position.set(-16, 4, -24);
        scene.add(ventShaft);
        objects.push(ventShaft);

        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }
    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += 0.0001 * delta;
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
        scene = null;
        camera = null;
    }
    return { init: init, update: update, reset: reset };
}());
