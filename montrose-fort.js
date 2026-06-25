window.MontroseFort = (function() {
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
        var baseX = 300;
        var baseZ = 230;

        // RAF Hangar - BoxGeometry with CylinderGeometry curved roof
        var hangarBody = new THREE.Mesh(
            new THREE.BoxGeometry(12, 5, 8),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        hangarBody.position.set(baseX, 2.5, baseZ);
        scene.add(hangarBody);
        objects.push(hangarBody);

        var hangarRoof = new THREE.Mesh(
            new THREE.CylinderGeometry(6.5, 6.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        hangarRoof.position.set(baseX, 5.2, baseZ);
        hangarRoof.rotation.z = Math.PI / 2;
        scene.add(hangarRoof);
        objects.push(hangarRoof);

        // Airfield Control Tower - BoxGeometry base + wider top
        var towerBase = new THREE.Mesh(
            new THREE.BoxGeometry(3, 8, 3),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
        );
        towerBase.position.set(baseX + 20, 4, baseZ - 15);
        scene.add(towerBase);
        objects.push(towerBase);

        var towerCab = new THREE.Mesh(
            new THREE.BoxGeometry(4.5, 3, 4.5),
            new THREE.MeshLambertMaterial({ color: 0xbbbbbb })
        );
        towerCab.position.set(baseX + 20, 10.5, baseZ - 15);
        scene.add(towerCab);
        objects.push(towerCab);

        // Runway hardstand - series of concrete pads
        for (var i = 0; i < 6; i++) {
            var pad = new THREE.Mesh(
                new THREE.BoxGeometry(8, 0.2, 10),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            pad.position.set(baseX - 25 + (i * 12), 0.1, baseZ + 25);
            scene.add(pad);
            objects.push(pad);
        }

        // Montrose Basin defensive earthwork - curved berm
        var berm = new THREE.Mesh(
            new THREE.BoxGeometry(40, 3, 2),
            new THREE.MeshLambertMaterial({ color: 0x8b6914 })
        );
        berm.position.set(baseX + 35, 1.5, baseZ - 30);
        scene.add(berm);
        objects.push(berm);

        // Anti-aircraft battery - 4 gun barrels pointing skyward
        for (var i = 0; i < 4; i++) {
            var gunBarrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 4, 8),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            var offsetX = (i % 2) === 0 ? -1 : 1;
            var offsetZ = Math.floor(i / 2) === 0 ? -1 : 1;
            gunBarrel.position.set(baseX - 20 + offsetX, 2.5, baseZ - 10 + offsetZ);
            gunBarrel.rotation.x = Math.PI * 0.15;
            scene.add(gunBarrel);
            objects.push(gunBarrel);
        }

        // AA battery base platform
        var aaBase = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.3, 3),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        aaBase.position.set(baseX - 20, 0.15, baseZ - 10);
        scene.add(aaBase);
        objects.push(aaBase);

        // Fuel bowser vehicles - 2 trucks with tanks
        for (var i = 0; i < 2; i++) {
            var truckBody = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 1.8, 4),
                new THREE.MeshLambertMaterial({ color: 0x556b2f })
            );
            truckBody.position.set(baseX + 15 + (i * 8), 0.9, baseZ - 20);
            scene.add(truckBody);
            objects.push(truckBody);

            var tankCylinder = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 3, 16),
                new THREE.MeshLambertMaterial({ color: 0x6b8e23 })
            );
            tankCylinder.position.set(baseX + 15 + (i * 8), 1.5, baseZ - 20);
            tankCylinder.rotation.z = Math.PI / 2;
            scene.add(tankCylinder);
            objects.push(tankCylinder);
        }

        // Blast pen walls for aircraft - U-shaped pen
        var penWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(1, 4, 15),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
        );
        penWallLeft.position.set(baseX - 8, 2, baseZ + 10);
        scene.add(penWallLeft);
        objects.push(penWallLeft);

        var penWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(1, 4, 15),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
        );
        penWallRight.position.set(baseX + 8, 2, baseZ + 10);
        scene.add(penWallRight);
        objects.push(penWallRight);

        var penWallBack = new THREE.Mesh(
            new THREE.BoxGeometry(16, 4, 1),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
        );
        penWallBack.position.set(baseX, 2, baseZ + 17);
        scene.add(penWallBack);
        objects.push(penWallBack);

        // Windsock pole - CylinderGeometry pole + ConeGeometry cone
        var sockPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        sockPole.position.set(baseX - 35, 4, baseZ + 5);
        scene.add(sockPole);
        objects.push(sockPole);

        var sockCone = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 2.5, 12),
            new THREE.MeshLambertMaterial({ color: 0xff8c00 })
        );
        sockCone.position.set(baseX - 35, 7.5, baseZ + 5);
        sockCone.rotation.z = Math.PI / 2.5;
        scene.add(sockCone);
        objects.push(sockCone);

        // White stripe on windsock
        var sockStripe = new THREE.Mesh(
            new THREE.ConeGeometry(0.55, 2.3, 12),
            new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        sockStripe.position.set(baseX - 35, 7.6, baseZ + 5.1);
        sockStripe.rotation.z = Math.PI / 2.5;
        scene.add(sockStripe);
        objects.push(sockStripe);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for sun
        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(baseX + 50, 30, baseZ + 50);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);
    }

    function update(delta) {
        // Update logic for future animation
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
