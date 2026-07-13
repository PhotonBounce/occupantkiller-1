window.MesaPost = (function() {
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
        // Mesa plateau base - wide flat-topped formation
        var meshaPlateau = new THREE.Mesh(
            new THREE.BoxGeometry(120, 20, 100),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        meshaPlateau.position.set(0, 10, 0);
        scene.add(meshaPlateau);
        objects.push(meshaPlateau);

        // Mesa cliff face - darker shade
        var mesaCliff = new THREE.Mesh(
            new THREE.BoxGeometry(120, 18, 8),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        mesaCliff.position.set(0, 9, -46);
        scene.add(mesaCliff);
        objects.push(mesaCliff);

        // Lookout tower base on mesa top
        var towerBase = new THREE.Mesh(
            new THREE.CylinderGeometry(12, 14, 8, 16),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        towerBase.position.set(5, 30, 5);
        scene.add(towerBase);
        objects.push(towerBase);

        // Lookout tower mid section
        var towerMid = new THREE.Mesh(
            new THREE.CylinderGeometry(10, 12, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        towerMid.position.set(5, 42, 5);
        scene.add(towerMid);
        objects.push(towerMid);

        // Lookout tower top section - observation platform
        var towerTop = new THREE.Mesh(
            new THREE.CylinderGeometry(11, 10, 4, 16),
            new THREE.MeshLambertMaterial({ color: 0x606060 })
        );
        towerTop.position.set(5, 52, 5);
        scene.add(towerTop);
        objects.push(towerTop);

        // Radio antenna 1 - tall thin cylinder
        var antenna1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 28, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        antenna1.position.set(15, 62, 10);
        scene.add(antenna1);
        objects.push(antenna1);

        // Radio antenna 2
        var antenna2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 24, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        antenna2.position.set(-8, 58, 8);
        scene.add(antenna2);
        objects.push(antenna2);

        // Radio antenna 3
        var antenna3 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 26, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        antenna3.position.set(10, 60, -12);
        scene.add(antenna3);
        objects.push(antenna3);

        // Sniper position boulders - rock 1
        var boulder1 = new THREE.Mesh(
            new THREE.BoxGeometry(18, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x8B8680 })
        );
        boulder1.position.set(-35, 28, -28);
        boulder1.rotation.z = 0.3;
        scene.add(boulder1);
        objects.push(boulder1);

        // Sniper position boulders - rock 2
        var boulder2 = new THREE.Mesh(
            new THREE.BoxGeometry(14, 10, 14),
            new THREE.MeshLambertMaterial({ color: 0x9B9890 })
        );
        boulder2.position.set(-40, 37, -25);
        boulder2.rotation.z = -0.2;
        scene.add(boulder2);
        objects.push(boulder2);

        // Sniper position boulders - rock 3
        var boulder3 = new THREE.Mesh(
            new THREE.BoxGeometry(16, 11, 15),
            new THREE.MeshLambertMaterial({ color: 0x7B7670 })
        );
        boulder3.position.set(-32, 35, -32);
        boulder3.rotation.z = 0.15;
        scene.add(boulder3);
        objects.push(boulder3);

        // Eagle nest 1 - sphere on mesa edge
        var eagle1 = new THREE.Mesh(
            new THREE.SphereGeometry(8, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        eagle1.position.set(55, 35, 40);
        scene.add(eagle1);
        objects.push(eagle1);

        // Eagle nest 2
        var eagle2 = new THREE.Mesh(
            new THREE.SphereGeometry(7, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        eagle2.position.set(-50, 32, 45);
        scene.add(eagle2);
        objects.push(eagle2);

        // Communication cone on tower
        var commCone = new THREE.Mesh(
            new THREE.ConeGeometry(6, 10, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        commCone.position.set(5, 58, 5);
        scene.add(commCone);
        objects.push(commCone);

        // Rock formation - large cone
        var rockCone = new THREE.Mesh(
            new THREE.ConeGeometry(11, 18, 8),
            new THREE.MeshLambertMaterial({ color: 0x6B5D47 })
        );
        rockCone.position.set(30, 24, -35);
        scene.add(rockCone);
        objects.push(rockCone);

        // Desert sand dune - another plateau formation
        var dune = new THREE.Mesh(
            new THREE.BoxGeometry(80, 8, 60),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        dune.position.set(-25, 4, 25);
        scene.add(dune);
        objects.push(dune);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for sun
        var sunLight = new THREE.DirectionalLight(0xFFEE99, 0.8);
        sunLight.position.set(40, 80, 40);
        scene.add(sunLight);
        lights.push(sunLight);
    }

    function update(delta) {
        // Animate antenna swaying
        if (objects.length > 5) {
            var swayAmount = Math.sin(Date.now() * 0.0005) * 0.02;
            objects[5].rotation.z = swayAmount;
            objects[6].rotation.z = -swayAmount * 0.8;
            objects[7].rotation.z = swayAmount * 0.9;
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
