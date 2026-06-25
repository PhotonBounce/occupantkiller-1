window.KnockCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        var hillock = new THREE.Mesh(
            new THREE.BoxGeometry(60, 8, 50),
            new THREE.MeshLambertMaterial({ color: 0x4a3f35 })
        );
        hillock.position.set(0, 4, 0);
        hillock.scale.y = 0.6;
        scene.add(hillock);
        objects.push(hillock);

        var vehicleBody = new THREE.Mesh(
            new THREE.BoxGeometry(8, 4, 12),
            new THREE.MeshLambertMaterial({ color: 0x3d5a3d })
        );
        vehicleBody.position.set(-20, 8, -15);
        scene.add(vehicleBody);
        objects.push(vehicleBody);

        var bermLeft = new THREE.Mesh(
            new THREE.BoxGeometry(2, 5, 14),
            new THREE.MeshLambertMaterial({ color: 0x6b5d4f })
        );
        bermLeft.position.set(-26, 6, -15);
        scene.add(bermLeft);
        objects.push(bermLeft);

        var bermRight = new THREE.Mesh(
            new THREE.BoxGeometry(2, 5, 14),
            new THREE.MeshLambertMaterial({ color: 0x6b5d4f })
        );
        bermRight.position.set(-14, 6, -15);
        scene.add(bermRight);
        objects.push(bermRight);

        var aaPit = new THREE.Mesh(
            new THREE.CylinderGeometry(10, 10, 3, 16),
            new THREE.MeshLambertMaterial({ color: 0x5c4033 })
        );
        aaPit.position.set(15, 5.5, -10);
        scene.add(aaPit);
        objects.push(aaPit);

        var aaBarrel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x2c2c2c })
        );
        aaBarrel1.position.set(18, 12, -10);
        scene.add(aaBarrel1);
        objects.push(aaBarrel1);

        var aaBarrel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x2c2c2c })
        );
        aaBarrel2.position.set(12, 12, -10);
        scene.add(aaBarrel2);
        objects.push(aaBarrel2);

        var kitTent = new THREE.Mesh(
            new THREE.BoxGeometry(6, 5, 8),
            new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        );
        kitTent.position.set(-25, 6, 5);
        scene.add(kitTent);
        objects.push(kitTent);

        var kitChimney = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 7, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        kitChimney.position.set(-23, 11, 6);
        scene.add(kitChimney);
        objects.push(kitChimney);

        var crateStack1 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            new THREE.MeshLambertMaterial({ color: 0x8b4513 })
        );
        crateStack1.position.set(25, 6, 10);
        scene.add(crateStack1);
        objects.push(crateStack1);

        var crateStack2 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            new THREE.MeshLambertMaterial({ color: 0x8b4513 })
        );
        crateStack2.position.set(25, 10, 10);
        scene.add(crateStack2);
        objects.push(crateStack2);

        var blastWall = new THREE.Mesh(
            new THREE.ConeGeometry(8, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x7a6f5d })
        );
        blastWall.position.set(25, 6, 18);
        scene.add(blastWall);
        objects.push(blastWall);

        var radioHut = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3.5, 4),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        radioHut.position.set(-12, 5.75, 20);
        scene.add(radioHut);
        objects.push(radioHut);

        var antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 16, 6),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        antenna.position.set(-12, 15, 20);
        scene.add(antenna);
        objects.push(antenna);

        var stayWire1 = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-12, 20, 20),
                new THREE.Vector3(-8, 8, 14)
            ]),
            new THREE.LineBasicMaterial({ color: 0xaaaaaa })
        );
        scene.add(stayWire1);
        objects.push(stayWire1);

        var stayWire2 = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-12, 20, 20),
                new THREE.Vector3(-16, 8, 26)
            ]),
            new THREE.LineBasicMaterial({ color: 0xaaaaaa })
        );
        scene.add(stayWire2);
        objects.push(stayWire2);

        var motoWheel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 0.8, 16),
            new THREE.MeshLambertMaterial({ color: 0x1c1c1c })
        );
        motoWheel1.rotation.z = Math.PI / 2;
        motoWheel1.position.set(5, 4, 25);
        scene.add(motoWheel1);
        objects.push(motoWheel1);

        var motoWheel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 0.8, 16),
            new THREE.MeshLambertMaterial({ color: 0x1c1c1c })
        );
        motoWheel2.rotation.z = Math.PI / 2;
        motoWheel2.position.set(5, 4, 32);
        scene.add(motoWheel2);
        objects.push(motoWheel2);

        var motoFrame = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 3, 9),
            new THREE.MeshLambertMaterial({ color: 0x2d5016 })
        );
        motoFrame.position.set(5, 5.5, 28.5);
        scene.add(motoFrame);
        objects.push(motoFrame);

        var tripwire = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-30, 2, -25),
                new THREE.Vector3(30, 2, -25)
            ]),
            new THREE.LineBasicMaterial({ color: 0x666666 })
        );
        scene.add(tripwire);
        objects.push(tripwire);

        var noiseCan1 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xcd5c5c })
        );
        noiseCan1.position.set(-15, 2.5, -25);
        scene.add(noiseCan1);
        objects.push(noiseCan1);

        var noiseCan2 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xcd5c5c })
        );
        noiseCan2.position.set(15, 2.5, -25);
        scene.add(noiseCan2);
        objects.push(noiseCan2);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 50, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (antenna) {
            antenna.rotation.y += 0.02;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
