window.BoltKeep = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    function init(sceneRef, cameraRef) {
        scene = sceneRef; camera = cameraRef;
        objects = []; lights = [];
        buildKeep();
    }
    function buildKeep() {
        // Chain Home mast tower base
        var mast1Base = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 2),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        mast1Base.position.set(-25, 0.5, -25);
        scene.add(mast1Base);
        objects.push(mast1Base);

        // Chain Home tall mast cylinder
        var mast1Pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 45, 8),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        mast1Pole.position.set(-25, 23, -25);
        scene.add(mast1Pole);
        objects.push(mast1Pole);

        // Cross-bar boxes on mast at intervals
        var crossBar1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.4, 0.4),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        crossBar1.position.set(-25, 12, -25);
        scene.add(crossBar1);
        objects.push(crossBar1);

        var crossBar2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.4, 0.4),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        crossBar2.position.set(-25, 25, -25);
        scene.add(crossBar2);
        objects.push(crossBar2);

        var crossBar3 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.4, 0.4),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        crossBar3.position.set(-25, 38, -25);
        scene.add(crossBar3);
        objects.push(crossBar3);

        // Radar receiver hut - box building
        var receiverHut = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0x7a5c3a })
        );
        receiverHut.position.set(15, 2, -20);
        scene.add(receiverHut);
        objects.push(receiverHut);

        // Receiver hut cylinder aerial
        var receiverAerial = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        receiverAerial.position.set(15, 5, -20);
        scene.add(receiverAerial);
        objects.push(receiverAerial);

        // Transmitter block - large concrete box
        var transmitterBlock = new THREE.Mesh(
            new THREE.BoxGeometry(10, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x6b6b6b })
        );
        transmitterBlock.position.set(10, 3, 15);
        scene.add(transmitterBlock);
        objects.push(transmitterBlock);

        // Transmitter cable runs using LineSegments
        var cablePoints = [
            new THREE.Vector3(10, 9, 15),
            new THREE.Vector3(10, 12, 15),
            new THREE.Vector3(12, 14, 15),
            new THREE.Vector3(14, 16, 15)
        ];
        var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableLine = new THREE.LineSegments(
            cableGeometry,
            new THREE.MeshLambertMaterial({ color: 0xccaa00 })
        );
        scene.add(cableLine);
        objects.push(cableLine);

        // Blast wall protection ring - stacked boxes
        var blastWall1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 0.5),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        blastWall1.position.set(-8, 1, 8);
        scene.add(blastWall1);
        objects.push(blastWall1);

        var blastWall2 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 0.5),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        blastWall2.position.set(8, 1, 8);
        scene.add(blastWall2);
        objects.push(blastWall2);

        var blastWall3 = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        blastWall3.position.set(-8, 1, -5);
        scene.add(blastWall3);
        objects.push(blastWall3);

        // Backup generator shed - box
        var genShed = new THREE.Mesh(
            new THREE.BoxGeometry(5, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        genShed.position.set(-15, 1.5, 18);
        scene.add(genShed);
        objects.push(genShed);

        // Generator exhaust pipe - cylinder
        var exhaustPipe = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 5, 8),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        exhaustPipe.position.set(-15, 5, 18);
        scene.add(exhaustPipe);
        objects.push(exhaustPipe);

        // Underground operations room entrance hatch - box
        var hatchBox = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.5, 2),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        hatchBox.position.set(0, 0.25, -15);
        scene.add(hatchBox);
        objects.push(hatchBox);

        // Blast door frame using LineSegments
        var doorFramePoints = [
            new THREE.Vector3(-1, 0, -15),
            new THREE.Vector3(1, 0, -15),
            new THREE.Vector3(1, 3, -15),
            new THREE.Vector3(-1, 3, -15),
            new THREE.Vector3(-1, 0, -15)
        ];
        var doorFrameGeometry = new THREE.BufferGeometry().setFromPoints(doorFramePoints);
        var doorFrame = new THREE.LineSegments(
            doorFrameGeometry,
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        scene.add(doorFrame);
        objects.push(doorFrame);

        // Anti-aircraft gun pit - cylinder barrel
        var gunBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        gunBarrel.rotation.z = 0.5;
        gunBarrel.position.set(25, 5, 25);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // Gun mount - box
        var gunMount = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
        );
        gunMount.position.set(25, 1.5, 25);
        scene.add(gunMount);
        objects.push(gunMount);

        // Gun pit earthwork - box
        var gunPit = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1, 6),
            new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
        );
        gunPit.position.set(25, 0.5, 25);
        scene.add(gunPit);
        objects.push(gunPit);

        // Cone antenna on receiver hut
        var conAntenna = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
        );
        conAntenna.position.set(15, 7, -20);
        scene.add(conAntenna);
        objects.push(conAntenna);

        // Additional storage sphere for variety
        var storageBlob = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x7a6a5a })
        );
        storageBlob.position.set(-5, 2, 5);
        scene.add(storageBlob);
        objects.push(storageBlob);

        // Add ambient light
        var ambientLight = new THREE.Light();
        ambientLight.intensity = 0.6;
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for shadows
        var dirLight = new THREE.Light();
        dirLight.position.set(30, 30, 30);
        dirLight.intensity = 0.8;
        scene.add(dirLight);
        lights.push(dirLight);
    }
    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += delta * 0.05;
                }
            }
        }
    }
    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = []; lights = []; scene = null; camera = null;
    }
    return { init: init, update: update, reset: reset };
}());
