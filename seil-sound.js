window.SeilSound = (function() {
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
        buildSound();
    }

    function buildSound() {
        var i;

        var ambientLight = new THREE.AmbientLight(0xcccccc);
        lights.push(ambientLight);
        scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 20);
        lights.push(directionalLight);
        scene.add(directionalLight);

        var bridgeDeckGeom = new THREE.BoxGeometry(60, 3, 8);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var bridgeDeck = new THREE.Mesh(bridgeDeckGeom, stoneMat);
        bridgeDeck.position.set(0, 15, 0);
        objects.push(bridgeDeck);
        scene.add(bridgeDeck);

        var pillar1Geom = new THREE.CylinderGeometry(2, 2.5, 25, 8);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var pillar1 = new THREE.Mesh(pillar1Geom, pillarMat);
        pillar1.position.set(-20, 12.5, 0);
        objects.push(pillar1);
        scene.add(pillar1);

        var pillar2 = new THREE.Mesh(pillar1Geom, pillarMat);
        pillar2.position.set(20, 12.5, 0);
        objects.push(pillar2);
        scene.add(pillar2);

        var abutment1Geom = new THREE.BoxGeometry(8, 20, 10);
        var abutmentMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var abutment1 = new THREE.Mesh(abutment1Geom, abutmentMat);
        abutment1.position.set(-35, 10, 0);
        objects.push(abutment1);
        scene.add(abutment1);

        var abutment2 = new THREE.Mesh(abutment1Geom, abutmentMat);
        abutment2.position.set(35, 10, 0);
        objects.push(abutment2);
        scene.add(abutment2);

        var quarryGeom = new THREE.BoxGeometry(25, 15, 25);
        var quarryMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var quarry = new THREE.Mesh(quarryGeom, quarryMat);
        quarry.position.set(-28, 7.5, -30);
        objects.push(quarry);
        scene.add(quarry);

        var magazineGeom = new THREE.BoxGeometry(10, 8, 10);
        var magazineMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var magazine = new THREE.Mesh(magazineGeom, magazineMat);
        magazine.position.set(-28, 22, -30);
        objects.push(magazine);
        scene.add(magazine);

        var slateMarkerGeom = new THREE.SphereGeometry(1.5, 6, 6);
        var slateMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var slateMarker = new THREE.Mesh(slateMarkerGeom, slateMat);
        slateMarker.position.set(-28, 25, -25);
        objects.push(slateMarker);
        scene.add(slateMarker);

        var cottage1Geom = new THREE.BoxGeometry(6, 6, 6);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
        var cottage1 = new THREE.Mesh(cottage1Geom, cottageMat);
        cottage1.position.set(-15, 3, 20);
        objects.push(cottage1);
        scene.add(cottage1);

        var cottage2 = new THREE.Mesh(cottage1Geom, cottageMat);
        cottage2.position.set(-5, 3, 22);
        objects.push(cottage2);
        scene.add(cottage2);

        var barrierGeom = new THREE.BoxGeometry(2, 4, 12);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(-10, 2, 28);
        objects.push(barrier);
        scene.add(barrier);

        var guardPostGeom = new THREE.CylinderGeometry(1.5, 2, 8, 6);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var guardPost = new THREE.Mesh(guardPostGeom, guardMat);
        guardPost.position.set(5, 4, 24);
        objects.push(guardPost);
        scene.add(guardPost);

        var truckGeom = new THREE.BoxGeometry(4, 3, 8);
        var truckMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var truck = new THREE.Mesh(truckGeom, truckMat);
        truck.position.set(15, 1.5, 10);
        objects.push(truck);
        scene.add(truck);

        var tankerGeom = new THREE.CylinderGeometry(2, 2, 12, 8);
        var tankerMat = new THREE.MeshLambertMaterial({ color: 0xdd8844 });
        var tanker = new THREE.Mesh(tankerGeom, tankerMat);
        tanker.position.set(25, 6, 15);
        objects.push(tanker);
        scene.add(tanker);

        var crateGeom = new THREE.BoxGeometry(3, 3, 3);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
        var crate = new THREE.Mesh(crateGeom, crateMat);
        crate.position.set(28, 1.5, 8);
        objects.push(crate);
        scene.add(crate);

        var mastGeom = new THREE.CylinderGeometry(0.8, 1, 20, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(20, 10, -20);
        objects.push(mast);
        scene.add(mast);

        var relayHutGeom = new THREE.BoxGeometry(5, 5, 5);
        var relayMat = new THREE.MeshLambertMaterial({ color: 0xaabbcc });
        var relayHut = new THREE.Mesh(relayHutGeom, relayMat);
        relayHut.position.set(18, 2.5, -22);
        objects.push(relayHut);
        scene.add(relayHut);

        var aerialGeom = new THREE.ConeGeometry(1.2, 6, 6);
        var aerialMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var aerial = new THREE.Mesh(aerialGeom, aerialMat);
        aerial.position.set(20, 22, -20);
        objects.push(aerial);
        scene.add(aerial);

        var mineGeom = new THREE.SphereGeometry(1, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(-10, 2, -28);
        objects.push(mine1);
        scene.add(mine1);

        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(0, 2, -30);
        objects.push(mine2);
        scene.add(mine2);

        var mine3 = new THREE.Mesh(mineGeom, mineMat);
        mine3.position.set(10, 2, -28);
        objects.push(mine3);
        scene.add(mine3);

        var cablePoints = [];
        cablePoints.push(new THREE.Vector3(-10, 2, -28));
        cablePoints.push(new THREE.Vector3(0, 3, -30));
        cablePoints.push(new THREE.Vector3(10, 2, -28));
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableLineMat = new THREE.LineBasicMaterial({ color: 0x666666 });
        var cableLines = new THREE.LineSegments(cableGeom, cableLineMat);
        objects.push(cableLines);
        scene.add(cableLines);

        var demoBridgeGeom = new THREE.BoxGeometry(40, 2, 6);
        var demoBridgeMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var demoBridge = new THREE.Mesh(demoBridgeGeom, demoBridgeMat);
        demoBridge.position.set(-25, 18, 28);
        objects.push(demoBridge);
        scene.add(demoBridge);

        var chargeGeom = new THREE.SphereGeometry(0.8, 6, 6);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        var charge1 = new THREE.Mesh(chargeGeom, chargeMat);
        charge1.position.set(-35, 20, 28);
        objects.push(charge1);
        scene.add(charge1);

        var charge2 = new THREE.Mesh(chargeGeom, chargeMat);
        charge2.position.set(-25, 20, 28);
        objects.push(charge2);
        scene.add(charge2);

        var charge3 = new THREE.Mesh(chargeGeom, chargeMat);
        charge3.position.set(-15, 20, 28);
        objects.push(charge3);
        scene.add(charge3);

        var wirePoints = [];
        wirePoints.push(new THREE.Vector3(-35, 18, 28));
        wirePoints.push(new THREE.Vector3(-25, 17, 28));
        wirePoints.push(new THREE.Vector3(-15, 18, 28));
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireLineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var wireLines = new THREE.LineSegments(wireGeom, wireLineMat);
        objects.push(wireLines);
        scene.add(wireLines);
    }

    function update(delta) {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
            }
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
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
