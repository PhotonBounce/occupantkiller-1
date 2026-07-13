window.PortGlasgowPost = (function() {
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
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        lights.push(ambientLight);
        scene.add(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        lights.push(directionalLight);
        scene.add(directionalLight);
        var newarkCastleWalls = new THREE.Mesh(
            new THREE.BoxGeometry(20, 15, 20),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        newarkCastleWalls.position.set(-25, 7.5, -25);
        objects.push(newarkCastleWalls);
        scene.add(newarkCastleWalls);
        var roundTower = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 18, 16),
            new THREE.MeshLambertMaterial({ color: 0x704214 })
        );
        roundTower.position.set(-25, 9, -25);
        objects.push(roundTower);
        scene.add(roundTower);
        var turretRoof = new THREE.Mesh(
            new THREE.ConeGeometry(8, 8, 16),
            new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
        );
        turretRoof.position.set(-25, 22, -25);
        objects.push(turretRoof);
        scene.add(turretRoof);
        var craneGantry = new THREE.Mesh(
            new THREE.BoxGeometry(25, 12, 6),
            new THREE.MeshLambertMaterial({ color: 0x404040 })
        );
        craneGantry.position.set(0, 6, -20);
        objects.push(craneGantry);
        scene.add(craneGantry);
        var floatingDock1 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 4, 12),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        floatingDock1.position.set(10, 2, -15);
        objects.push(floatingDock1);
        scene.add(floatingDock1);
        var floatingDock2 = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 4, 12),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        floatingDock2.position.set(-10, 2, -15);
        objects.push(floatingDock2);
        scene.add(floatingDock2);
        var engineersShelter = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 10),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        engineersShelter.position.set(8, 3, -8);
        objects.push(engineersShelter);
        scene.add(engineersShelter);
        var kingstonDock = new THREE.Mesh(
            new THREE.BoxGeometry(22, 8, 18),
            new THREE.MeshLambertMaterial({ color: 0x9b8b7e })
        );
        kingstonDock.position.set(25, 4, 10);
        objects.push(kingstonDock);
        scene.add(kingstonDock);
        var harborCrane = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 16, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        harborCrane.position.set(28, 8, 12);
        objects.push(harborCrane);
        scene.add(harborCrane);
        var harborOffice = new THREE.Mesh(
            new THREE.BoxGeometry(10, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        harborOffice.position.set(20, 4, 20);
        objects.push(harborOffice);
        scene.add(harborOffice);
        var bridgeDeck = new THREE.Mesh(
            new THREE.BoxGeometry(30, 3, 12),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        bridgeDeck.position.set(-5, 8, 25);
        objects.push(bridgeDeck);
        scene.add(bridgeDeck);
        var iedCharge1 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xff6600 })
        );
        iedCharge1.position.set(-10, 12, 25);
        objects.push(iedCharge1);
        scene.add(iedCharge1);
        var iedCharge2 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xff6600 })
        );
        iedCharge2.position.set(0, 12, 25);
        objects.push(iedCharge2);
        scene.add(iedCharge2);
        var iedCharge3 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xff6600 })
        );
        iedCharge3.position.set(10, 12, 25);
        objects.push(iedCharge3);
        scene.add(iedCharge3);
        var wireGeometry = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            10, 12, 25,
            12, 6, 15
        ]);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireSegments = new THREE.LineSegments(
            wireGeometry,
            new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
        );
        objects.push(wireSegments);
        scene.add(wireSegments);
        var shelterBox = new THREE.Mesh(
            new THREE.BoxGeometry(7, 5, 9),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        shelterBox.position.set(12, 2.5, 15);
        objects.push(shelterBox);
        scene.add(shelterBox);
        var steepRoadCutting = new THREE.Mesh(
            new THREE.BoxGeometry(16, 10, 8),
            new THREE.MeshLambertMaterial({ color: 0x6b5d52 })
        );
        steepRoadCutting.position.set(-20, 5, 15);
        objects.push(steepRoadCutting);
        scene.add(steepRoadCutting);
        var stonWallCover = new THREE.Mesh(
            new THREE.BoxGeometry(18, 6, 4),
            new THREE.MeshLambertMaterial({ color: 0x8b8b7a })
        );
        stonWallCover.position.set(-20, 3, 20);
        objects.push(stonWallCover);
        scene.add(stonWallCover);
        var chargeSphereDevolGlen = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xdd5500 })
        );
        chargeSphereDevolGlen.position.set(-18, 10, 18);
        objects.push(chargeSphereDevolGlen);
        scene.add(chargeSphereDevolGlen);
        var glassOfficeBlock1 = new THREE.Mesh(
            new THREE.BoxGeometry(12, 14, 10),
            new THREE.MeshLambertMaterial({ color: 0x4da6ff })
        );
        glassOfficeBlock1.position.set(20, 7, -5);
        objects.push(glassOfficeBlock1);
        scene.add(glassOfficeBlock1);
        var serverRoomAnnex = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x2d5a8c })
        );
        serverRoomAnnex.position.set(28, 3, -8);
        objects.push(serverRoomAnnex);
        scene.add(serverRoomAnnex);
        var satelliteDish = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 3, 12),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
        );
        satelliteDish.position.set(24, 18, -3);
        objects.push(satelliteDish);
        scene.add(satelliteDish);
        var concreteBarrier1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })
        );
        concreteBarrier1.position.set(-15, 1, 5);
        objects.push(concreteBarrier1);
        scene.add(concreteBarrier1);
        var concreteBarrier2 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })
        );
        concreteBarrier2.position.set(-8, 1, 5);
        objects.push(concreteBarrier2);
        scene.add(concreteBarrier2);
        var concreteBarrier3 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })
        );
        concreteBarrier3.position.set(-1, 1, 5);
        objects.push(concreteBarrier3);
        scene.add(concreteBarrier3);
        var checkpointWatchtower = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 14, 12),
            new THREE.MeshLambertMaterial({ color: 0x5d5d5d })
        );
        checkpointWatchtower.position.set(-10, 7, 8);
        objects.push(checkpointWatchtower);
        scene.add(checkpointWatchtower);
        var sandbagEmplacement = new THREE.Mesh(
            new THREE.BoxGeometry(9, 3, 7),
            new THREE.MeshLambertMaterial({ color: 0xb8956a })
        );
        sandbagEmplacement.position.set(-5, 1.5, 15);
        objects.push(sandbagEmplacement);
        scene.add(sandbagEmplacement);
        var stoneObservationPost = new THREE.Mesh(
            new THREE.BoxGeometry(7, 6, 7),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        stoneObservationPost.position.set(5, 3, 28);
        objects.push(stoneObservationPost);
        scene.add(stoneObservationPost);
        var signalMast = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0xdc143c })
        );
        signalMast.position.set(8, 6, 28);
        objects.push(signalMast);
        scene.add(signalMast);
        var radome = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0xf0f0f0 })
        );
        radome.position.set(5, 15, 28);
        objects.push(radome);
        scene.add(radome);
    }
    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
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
